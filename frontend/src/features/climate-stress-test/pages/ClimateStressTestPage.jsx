/**
 * EP-AJ2 -- Climate Stress Test -- ECB 2024 + BoE CBES + NGFS Phase IV
 * Sprint AJ - Financed Emissions & Climate Banking Analytics
 *
 * Regulatory basis:
 *   - ECB 2024 Climate Stress Test Methodology
 *   - BoE Climate Biennial Exploratory Scenario (CBES)
 *   - NGFS Phase IV Scenarios Technical Documentation (Nov 2023)
 *   - EBA 2024 EU-wide Stress Test Guidelines
 *   - ECB Guide on climate-related and environmental risks (Nov 2020, updated 2022)
 *   - IFRS 9 Financial Instruments ss 5.5 (Expected Credit Loss)
 *
 * 7 Tabs:
 *   1. Scenario Configuration -- 6 NGFS scenarios + custom builder
 *   2. Sector PD Migration -- 30 sectors x 6 scenarios
 *   3. CET1 Impact Waterfall -- 8-component CET1 waterfall
 *   4. Physical Risk Overlay -- 8 hazard types, RCP 4.5/8.5
 *   5. ECL Climate Overlay -- IFRS 9 stages + transition/physical overlays
 *   6. Regulatory Compliance -- Multi-jurisdictional timeline
 *   7. Export & Reporting -- Stress test report generation
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, CartesianGrid, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, PieChart, Pie,
} from 'recharts';
import { NGFS_SCENARIOS, CARBON_PRICES, SECTOR_BENCHMARKS } from '../../../data/referenceData';
import { SECURITY_UNIVERSE, MOCK_PORTFOLIO } from '../../../data/securityUniverse';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const pick=(arr,seed)=>arr[Math.floor(sr(seed)*arr.length)];
const rng=(min,max,seed)=>+(min+sr(seed)*(max-min)).toFixed(2);
const rngInt=(min,max,seed)=>Math.floor(min+sr(seed)*(max-min+1));
const fmt=(v,d=1)=>typeof v==='number'?v.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d}):'-';
const fmtPct=(v)=>fmt(v,2)+'%';
const fmtBps=(v)=>(v*100).toFixed(0)+' bps';
const fmtM=(v)=>'EUR '+fmt(v,1)+'M';

// =========================================================================
// SCENARIO DEFINITIONS -- 6 NGFS Phase IV
// =========================================================================
const SCENARIO_DEFS = [
  {id:'nz2050',key:'net_zero_2050',label:'Net Zero 2050',category:'Orderly',color:'#16a34a',temp:'1.5',type:'Orderly',
    carbonPath:{2025:85,2030:200,2035:350,2040:520,2050:725},gdpImpact:{2025:-0.3,2030:-0.8,2035:-1.0,2040:-0.9,2050:-2.5},
    renewableShare:{2025:35,2030:50,2035:60,2040:68,2050:75},peakWarming:1.5,strandedAssetsTn:12},
  {id:'b2c',key:'below_2c',label:'Below 2\u00B0C',category:'Orderly',color:'#22c55e',temp:'1.7',type:'Orderly',
    carbonPath:{2025:55,2030:130,2035:220,2040:350,2050:475},gdpImpact:{2025:-0.2,2030:-0.5,2035:-0.8,2040:-1.2,2050:-1.8},
    renewableShare:{2025:32,2030:42,2035:52,2040:60,2050:65},peakWarming:1.7,strandedAssetsTn:8},
  {id:'dnz',key:'divergent_net_zero',label:'Divergent Net Zero',category:'Disorderly',color:'#eab308',temp:'1.5',type:'Disorderly',
    carbonPath:{2025:100,2030:250,2035:500,2040:700,2050:800},gdpImpact:{2025:-0.5,2030:-1.5,2035:-2.8,2040:-3.5,2050:-4.0},
    renewableShare:{2025:34,2030:48,2035:58,2040:65,2050:70},peakWarming:1.5,strandedAssetsTn:15},
  {id:'dt',key:'delayed_transition',label:'Delayed Transition',category:'Disorderly',color:'#f97316',temp:'1.8',type:'Disorderly',
    carbonPath:{2025:15,2030:35,2035:350,2040:550,2050:600},gdpImpact:{2025:-0.1,2030:-0.3,2035:-3.2,2040:-4.5,2050:-5.5},
    renewableShare:{2025:30,2030:34,2035:48,2040:55,2050:60},peakWarming:1.8,strandedAssetsTn:18},
  {id:'ndc',key:'nationally_determined',label:'NDCs',category:'Hot House',color:'#ef4444',temp:'2.5',type:'Hot House',
    carbonPath:{2025:12,2030:25,2035:30,2040:40,2050:50},gdpImpact:{2025:-0.4,2030:-1.0,2035:-2.5,2040:-5.0,2050:-8.0},
    renewableShare:{2025:28,2030:35,2035:40,2040:42,2050:45},peakWarming:2.5,strandedAssetsTn:4},
  {id:'cp',key:'current_policies',label:'Current Policies',category:'Hot House',color:'#dc2626',temp:'3.0+',type:'Hot House',
    carbonPath:{2025:10,2030:15,2035:18,2040:22,2050:25},gdpImpact:{2025:-0.5,2030:-1.2,2035:-3.0,2040:-6.5,2050:-12.0},
    renewableShare:{2025:26,2030:30,2035:32,2040:34,2050:35},peakWarming:3.0,strandedAssetsTn:2},
];

const YEARS = [2025, 2030, 2035, 2040, 2050];

// =========================================================================
// 30 SECTORS with full stress parameters
// =========================================================================
const SECTORS = [
  {id:1,name:'Coal Mining',basePD:3.2,nace:'B05',nzMult:2.8,b2cMult:2.4,dnzMult:3.0,dtMult:1.9,ndcMult:1.4,cpMult:1.2,transRisk:9,physRisk:5,carbonIntensity:1250,ebitdaImpact:42,regulatory:'ETS, CBAM'},
  {id:2,name:'Oil Upstream',basePD:2.1,nace:'B06.1',nzMult:2.4,b2cMult:2.0,dnzMult:2.6,dtMult:1.6,ndcMult:1.3,cpMult:1.1,transRisk:8,physRisk:6,carbonIntensity:980,ebitdaImpact:31,regulatory:'ETS, CBAM'},
  {id:3,name:'Gas Upstream',basePD:1.8,nace:'B06.2',nzMult:2.0,b2cMult:1.7,dnzMult:2.2,dtMult:1.4,ndcMult:1.2,cpMult:1.1,transRisk:7,physRisk:5,carbonIntensity:650,ebitdaImpact:28,regulatory:'ETS'},
  {id:4,name:'Oil Refining',basePD:2.4,nace:'C19.2',nzMult:2.6,b2cMult:2.2,dnzMult:2.8,dtMult:1.8,ndcMult:1.3,cpMult:1.1,transRisk:8,physRisk:4,carbonIntensity:820,ebitdaImpact:38,regulatory:'ETS, CBAM'},
  {id:5,name:'Petrochemicals',basePD:1.9,nace:'C20.1',nzMult:2.1,b2cMult:1.8,dnzMult:2.3,dtMult:1.5,ndcMult:1.2,cpMult:1.1,transRisk:7,physRisk:4,carbonIntensity:580,ebitdaImpact:30,regulatory:'ETS, CBAM'},
  {id:6,name:'Steel (BF-BOF)',basePD:2.7,nace:'C24.1',nzMult:2.5,b2cMult:2.1,dnzMult:2.7,dtMult:1.7,ndcMult:1.2,cpMult:1.1,transRisk:8,physRisk:3,carbonIntensity:1850,ebitdaImpact:35,regulatory:'ETS, CBAM'},
  {id:7,name:'Steel (EAF)',basePD:1.6,nace:'C24.1',nzMult:1.3,b2cMult:1.2,dnzMult:1.4,dtMult:1.2,ndcMult:1.1,cpMult:1.0,transRisk:4,physRisk:3,carbonIntensity:410,ebitdaImpact:12,regulatory:'ETS'},
  {id:8,name:'Cement',basePD:2.3,nace:'C23.5',nzMult:2.3,b2cMult:2.0,dnzMult:2.5,dtMult:1.6,ndcMult:1.2,cpMult:1.1,transRisk:8,physRisk:4,carbonIntensity:830,ebitdaImpact:33,regulatory:'ETS, CBAM'},
  {id:9,name:'Aluminium',basePD:1.8,nace:'C24.4',nzMult:1.9,b2cMult:1.6,dnzMult:2.1,dtMult:1.4,ndcMult:1.1,cpMult:1.0,transRisk:6,physRisk:3,carbonIntensity:8400,ebitdaImpact:25,regulatory:'ETS, CBAM'},
  {id:10,name:'Glass & Ceramics',basePD:1.7,nace:'C23.1',nzMult:1.8,b2cMult:1.5,dnzMult:1.9,dtMult:1.3,ndcMult:1.1,cpMult:1.0,transRisk:5,physRisk:3,carbonIntensity:910,ebitdaImpact:20,regulatory:'ETS'},
  {id:11,name:'Aviation',basePD:3.1,nace:'H51.1',nzMult:2.2,b2cMult:1.9,dnzMult:2.4,dtMult:1.6,ndcMult:1.5,cpMult:1.3,transRisk:8,physRisk:5,carbonIntensity:890,ebitdaImpact:26,regulatory:'ETS, CORSIA'},
  {id:12,name:'Shipping',basePD:2.5,nace:'H50.1',nzMult:1.9,b2cMult:1.6,dnzMult:2.1,dtMult:1.5,ndcMult:1.6,cpMult:1.4,transRisk:7,physRisk:7,carbonIntensity:620,ebitdaImpact:22,regulatory:'IMO, ETS'},
  {id:13,name:'Road Freight',basePD:1.7,nace:'H49.4',nzMult:1.8,b2cMult:1.5,dnzMult:1.9,dtMult:1.4,ndcMult:1.2,cpMult:1.1,transRisk:6,physRisk:4,carbonIntensity:350,ebitdaImpact:20,regulatory:'ETS, CO2 stds'},
  {id:14,name:'Automotive (ICE)',basePD:2.2,nace:'C29.1',nzMult:2.4,b2cMult:2.0,dnzMult:2.6,dtMult:1.7,ndcMult:1.2,cpMult:1.1,transRisk:8,physRisk:3,carbonIntensity:180,ebitdaImpact:28,regulatory:'ZEV mandate'},
  {id:15,name:'Automotive (EV)',basePD:1.5,nace:'C29.1',nzMult:0.9,b2cMult:1.0,dnzMult:0.85,dtMult:1.1,ndcMult:1.2,cpMult:1.2,transRisk:2,physRisk:3,carbonIntensity:45,ebitdaImpact:8,regulatory:'Supply chain'},
  {id:16,name:'Power (Coal)',basePD:3.5,nace:'D35.1',nzMult:3.1,b2cMult:2.6,dnzMult:3.3,dtMult:2.0,ndcMult:1.3,cpMult:1.1,transRisk:10,physRisk:5,carbonIntensity:1050,ebitdaImpact:45,regulatory:'ETS, MEES'},
  {id:17,name:'Power (Gas)',basePD:1.9,nace:'D35.1',nzMult:1.8,b2cMult:1.5,dnzMult:2.0,dtMult:1.5,ndcMult:1.2,cpMult:1.1,transRisk:6,physRisk:4,carbonIntensity:420,ebitdaImpact:22,regulatory:'ETS'},
  {id:18,name:'Power (Renewable)',basePD:0.8,nace:'D35.1',nzMult:0.7,b2cMult:0.8,dnzMult:0.65,dtMult:0.9,ndcMult:1.1,cpMult:1.1,transRisk:1,physRisk:5,carbonIntensity:15,ebitdaImpact:5,regulatory:'Minimal'},
  {id:19,name:'Agriculture (Intensive)',basePD:1.6,nace:'A01',nzMult:1.7,b2cMult:1.5,dnzMult:1.8,dtMult:1.4,ndcMult:1.8,cpMult:2.0,transRisk:5,physRisk:8,carbonIntensity:280,ebitdaImpact:18,regulatory:'CBAM'},
  {id:20,name:'Agriculture (Organic)',basePD:1.3,nace:'A01',nzMult:0.9,b2cMult:1.0,dnzMult:0.85,dtMult:1.1,ndcMult:1.5,cpMult:1.6,transRisk:2,physRisk:7,carbonIntensity:95,ebitdaImpact:8,regulatory:'Minimal'},
  {id:21,name:'Commercial RE (EPC A-C)',basePD:1.1,nace:'L68',nzMult:1.0,b2cMult:1.0,dnzMult:1.1,dtMult:1.1,ndcMult:1.3,cpMult:1.4,transRisk:2,physRisk:6,carbonIntensity:35,ebitdaImpact:10,regulatory:'MEES, SFDR'},
  {id:22,name:'Commercial RE (EPC D-G)',basePD:2.0,nace:'L68',nzMult:2.4,b2cMult:2.0,dnzMult:2.6,dtMult:1.6,ndcMult:1.5,cpMult:1.4,transRisk:7,physRisk:6,carbonIntensity:120,ebitdaImpact:30,regulatory:'MEES, SFDR'},
  {id:23,name:'Mortgages (EPC A-C)',basePD:0.6,nace:'L68',nzMult:0.7,b2cMult:0.8,dnzMult:0.7,dtMult:0.8,ndcMult:0.9,cpMult:1.0,transRisk:1,physRisk:4,carbonIntensity:18,ebitdaImpact:5,regulatory:'MEES'},
  {id:24,name:'Mortgages (EPC D-G)',basePD:1.4,nace:'L68',nzMult:1.9,b2cMult:1.6,dnzMult:2.0,dtMult:1.4,ndcMult:1.3,cpMult:1.2,transRisk:5,physRisk:5,carbonIntensity:75,ebitdaImpact:20,regulatory:'MEES'},
  {id:25,name:'Construction',basePD:2.1,nace:'F41',nzMult:1.6,b2cMult:1.4,dnzMult:1.7,dtMult:1.4,ndcMult:1.3,cpMult:1.2,transRisk:5,physRisk:5,carbonIntensity:130,ebitdaImpact:18,regulatory:'ETS (scope 3)'},
  {id:26,name:'Chemicals',basePD:1.8,nace:'C20',nzMult:1.9,b2cMult:1.6,dnzMult:2.0,dtMult:1.4,ndcMult:1.2,cpMult:1.1,transRisk:6,physRisk:4,carbonIntensity:450,ebitdaImpact:24,regulatory:'CBAM, REACH'},
  {id:27,name:'Paper & Pulp',basePD:1.5,nace:'C17',nzMult:1.6,b2cMult:1.4,dnzMult:1.7,dtMult:1.3,ndcMult:1.3,cpMult:1.2,transRisk:5,physRisk:6,carbonIntensity:920,ebitdaImpact:19,regulatory:'ETS'},
  {id:28,name:'Food Processing',basePD:1.2,nace:'C10',nzMult:1.3,b2cMult:1.2,dnzMult:1.4,dtMult:1.2,ndcMult:1.5,cpMult:1.6,transRisk:4,physRisk:7,carbonIntensity:180,ebitdaImpact:14,regulatory:'CBAM'},
  {id:29,name:'Technology',basePD:0.7,nace:'J62',nzMult:0.8,b2cMult:0.9,dnzMult:0.8,dtMult:0.9,ndcMult:0.9,cpMult:1.0,transRisk:2,physRisk:3,carbonIntensity:12,ebitdaImpact:6,regulatory:'Data centres'},
  {id:30,name:'Healthcare',basePD:0.9,nace:'Q86',nzMult:0.9,b2cMult:1.0,dnzMult:0.9,dtMult:1.0,ndcMult:1.1,cpMult:1.2,transRisk:2,physRisk:4,carbonIntensity:22,ebitdaImpact:8,regulatory:'Minimal'},
];

// =========================================================================
// 50 BORROWERS
// =========================================================================
const COUNTRIES = ['UK','DE','FR','NL','PL','SE','IT','ES','US','NO','FI','AT','BE','DK','IE'];

const BORROWERS = Array.from({ length: 50 }, (_, i) => {
  const sIdx = Math.floor(sr(i * 7) * 30);
  const s = SECTORS[sIdx];
  const country = pick(COUNTRIES, i * 3 + 1);
  const exposure = rng(20, 500, i * 5 + 2);
  const base = s.basePD + sr(i * 11) * 0.8 - 0.4;
  const bpd = Math.max(0.15, rng(base * 0.8, base * 1.2, i * 13));
  const lgd = rng(25, 65, i * 17);
  const maturity = rngInt(1, 15, i * 19);
  const scenarioMults = {nz:s.nzMult,b2c:s.b2cMult,dnz:s.dnzMult,dt:s.dtMult,ndc:s.ndcMult,cp:s.cpMult};
  return {
    id: i + 1,
    name: `Borrower ${String(i + 1).padStart(2, '0')}`,
    sector: s.name,
    sectorId: s.id,
    nace: s.nace,
    country,
    exposure,
    basePD: bpd,
    lgd,
    maturity,
    ...Object.fromEntries(Object.entries(scenarioMults).map(([k,m]) => [`${k}StressedPD`, rng(bpd * m * 0.9, bpd * m * 1.1, i * 23 + k.charCodeAt(0))])),
    transRisk: s.transRisk,
    physRisk: s.physRisk,
    epcRating: pick(['A','A+','B','C','D','E','F','G','N/A'], i * 29),
    scope1: rng(1000, 500000, i * 31),
    scope2: rng(200, 100000, i * 37),
  };
});

// =========================================================================
// CET1 Waterfall components
// =========================================================================
const CET1_COMPONENTS = [
  {id:'opening',label:'Opening CET1 Ratio',isBase:true},
  {id:'credit_trans',label:'Credit Losses (Transition)',isLoss:true},
  {id:'credit_phys',label:'Credit Losses (Physical)',isLoss:true},
  {id:'market_risk',label:'Market Risk Losses',isLoss:true},
  {id:'op_risk',label:'Operational Risk',isLoss:true},
  {id:'nii_impact',label:'Net Interest Income Impact',isLoss:false},
  {id:'green_benefit',label:'Green Asset Benefit',isGain:true},
  {id:'closing',label:'Closing CET1 Ratio',isBase:true},
];

const CET1_DATA = {
  nz2050:{opening:14.8,credit_trans:-0.95,credit_phys:-0.35,market_risk:-0.28,op_risk:-0.12,nii_impact:0.15,green_benefit:0.22},
  b2c:{opening:14.8,credit_trans:-0.72,credit_phys:-0.30,market_risk:-0.22,op_risk:-0.10,nii_impact:0.12,green_benefit:0.18},
  dnz:{opening:14.8,credit_trans:-1.45,credit_phys:-0.40,market_risk:-0.52,op_risk:-0.18,nii_impact:-0.10,green_benefit:0.20},
  dt:{opening:14.8,credit_trans:-1.80,credit_phys:-0.55,market_risk:-0.68,op_risk:-0.25,nii_impact:-0.30,green_benefit:0.15},
  ndc:{opening:14.8,credit_trans:-0.45,credit_phys:-1.20,market_risk:-0.35,op_risk:-0.15,nii_impact:-0.20,green_benefit:0.10},
  cp:{opening:14.8,credit_trans:-0.30,credit_phys:-1.85,market_risk:-0.48,op_risk:-0.22,nii_impact:-0.35,green_benefit:0.08},
};

// =========================================================================
// Physical Risk Hazards
// =========================================================================
const HAZARD_TYPES = [
  {id:'flood',label:'River/Coastal Flood',type:'Acute',icon:'\uD83C\uDF0A',rcp45_2050:1.8,rcp85_2050:3.2,description:'Increased frequency and severity of river and coastal flooding due to sea level rise and extreme precipitation'},
  {id:'heat',label:'Extreme Heat',type:'Chronic',icon:'\u2600\uFE0F',rcp45_2050:2.5,rcp85_2050:5.8,description:'Prolonged heatwaves affecting labour productivity, infrastructure integrity, and crop yields'},
  {id:'drought',label:'Drought',type:'Chronic',icon:'\uD83C\uDFDC\uFE0F',rcp45_2050:1.5,rcp85_2050:3.5,description:'Extended dry periods affecting water-dependent industries, agriculture, and cooling systems'},
  {id:'cyclone',label:'Tropical Cyclone',type:'Acute',icon:'\uD83C\uDF00',rcp45_2050:1.3,rcp85_2050:2.8,description:'Increased intensity of tropical cyclones affecting coastal assets and supply chains'},
  {id:'wildfire',label:'Wildfire',type:'Acute',icon:'\uD83D\uDD25',rcp45_2050:2.0,rcp85_2050:4.5,description:'Expanding wildfire risk zones affecting real estate, forestry, agriculture, and infrastructure'},
  {id:'sealevel',label:'Sea Level Rise',type:'Chronic',icon:'\uD83C\uDF0D',rcp45_2050:0.3,rcp85_2050:0.6,description:'Progressive sea level rise affecting coastal real estate valuations and insurance costs'},
  {id:'permafrost',label:'Permafrost Thaw',type:'Chronic',icon:'\u2744\uFE0F',rcp45_2050:0.8,rcp85_2050:2.2,description:'Permafrost degradation affecting Arctic infrastructure, pipelines, and methane release'},
  {id:'water_stress',label:'Water Stress',type:'Chronic',icon:'\uD83D\uDCA7',rcp45_2050:1.8,rcp85_2050:4.0,description:'Chronic water scarcity affecting manufacturing, mining, agriculture, and data centre cooling'},
];

// ECL overlay parameters
const IFRS9_STAGES = [
  {stage:1,label:'Stage 1 -- Performing',description:'12-month ECL. No significant increase in credit risk since initial recognition.',eclMethod:'12-month PD x LGD x EAD',trigger:'Initial recognition; no SICR'},
  {stage:2,label:'Stage 2 -- Under-performing',description:'Lifetime ECL. Significant increase in credit risk (SICR) but not credit-impaired.',eclMethod:'Lifetime PD x LGD x EAD',trigger:'SICR trigger: >200% PD increase or rating downgrade >2 notches'},
  {stage:3,label:'Stage 3 -- Non-performing',description:'Lifetime ECL. Credit-impaired. Objective evidence of impairment.',eclMethod:'Lifetime PD x LGD x EAD (individual assessment)',trigger:'90+ DPD, restructuring, or specific default event'},
];

// Regulatory timeline
const REG_TIMELINE = [
  {regulator:'ECB',jurisdiction:'EU',exercise:'ECB 2024 Climate Stress Test',scenarios:'3 NGFS (NZ2050, Delayed, Hot House)',frequency:'Biennial',deadline:'2024-07-31',status:'Complete',mandatory:true},
  {regulator:'ECB',jurisdiction:'EU',exercise:'ECB 2026 Climate Stress Test',scenarios:'6 NGFS Phase IV',frequency:'Biennial',deadline:'2026-06-30',status:'Planned',mandatory:true},
  {regulator:'BoE',jurisdiction:'UK',exercise:'CBES 2021',scenarios:'3 custom scenarios (Early, Late, No Action)',frequency:'Biennial exploratory',deadline:'2022-05-24',status:'Complete',mandatory:true},
  {regulator:'BoE',jurisdiction:'UK',exercise:'CBES 2025',scenarios:'Updated NGFS-aligned scenarios',frequency:'Biennial exploratory',deadline:'2025-12-31',status:'In Progress',mandatory:true},
  {regulator:'Fed',jurisdiction:'US',exercise:'Fed Climate Scenario Analysis Pilot',scenarios:'2 NGFS (NZ2050, Current Policies)',frequency:'Pilot',deadline:'2024-01-15',status:'Complete',mandatory:false},
  {regulator:'Fed',jurisdiction:'US',exercise:'Fed Climate Risk Framework',scenarios:'TBD -- likely NGFS-based',frequency:'TBD',deadline:'2026-12-31',status:'Proposed',mandatory:false},
  {regulator:'APRA',jurisdiction:'AU',exercise:'APRA Climate Vulnerability Assessment',scenarios:'2 NGFS scenarios',frequency:'One-off pilot',deadline:'2023-11-30',status:'Complete',mandatory:true},
  {regulator:'APRA',jurisdiction:'AU',exercise:'APRA CPS 230 Implementation',scenarios:'Climate as material risk driver',frequency:'Ongoing',deadline:'2025-07-01',status:'In Progress',mandatory:true},
  {regulator:'MAS',jurisdiction:'SG',exercise:'MAS ICAST 2024',scenarios:'3 scenarios (physical + transition)',frequency:'Annual',deadline:'2024-12-31',status:'In Progress',mandatory:true},
  {regulator:'EBA',jurisdiction:'EU',exercise:'EBA EU-wide Stress Test 2025',scenarios:'Climate overlay on adverse scenario',frequency:'Biennial',deadline:'2025-07-31',status:'In Progress',mandatory:true},
  {regulator:'OSFI',jurisdiction:'CA',exercise:'OSFI Climate Scenario Exercise',scenarios:'2 NGFS scenarios',frequency:'One-off',deadline:'2024-03-31',status:'Complete',mandatory:true},
  {regulator:'HKMA',jurisdiction:'HK',exercise:'HKMA Climate Risk Stress Test Pilot',scenarios:'2 transition + 1 physical',frequency:'Pilot',deadline:'2024-06-30',status:'Complete',mandatory:false},
];

// =========================================================================
// STYLES
// =========================================================================
const S = {
  page: { background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 0 },
  header: { background: T.navy, color: '#fff', padding: '28px 32px 18px', borderBottom: `3px solid ${T.gold}` },
  headerTitle: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', margin: 0 },
  headerSub: { fontSize: 13, color: T.goldL, fontFamily: T.mono, marginTop: 4 },
  citation: { fontSize: 11, color: T.goldL, fontFamily: T.mono, marginTop: 6, opacity: 0.85 },
  tabBar: { display: 'flex', gap: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, overflowX: 'auto', padding: '0 24px' },
  tab: (active) => ({ padding: '12px 20px', cursor: 'pointer', fontWeight: active ? 700 : 500, fontSize: 13, color: active ? T.navy : T.textSec, borderBottom: active ? `3px solid ${T.gold}` : '3px solid transparent', background: 'transparent', whiteSpace: 'nowrap', transition: 'all .15s', fontFamily: T.font }),
  body: { padding: '24px 32px', maxWidth: 1600, margin: '0 auto' },
  card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 24px', marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 },
  kpiRow: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 },
  kpi: (accent) => ({ flex: '1 1 180px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', borderLeft: `4px solid ${accent || T.navy}` }),
  kpiLabel: { fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 26, fontWeight: 700, color: T.navy, marginTop: 4 },
  kpiSub: { fontSize: 11, color: T.textSec, marginTop: 2 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: T.mono, whiteSpace: 'nowrap', background: T.surfaceH },
  td: { padding: '8px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.text, whiteSpace: 'nowrap' },
  badge: (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: color + '18', color, fontFamily: T.mono }),
  toggle: (active) => ({ padding: '6px 14px', borderRadius: 4, border: `1px solid ${active ? T.navy : T.border}`, background: active ? T.navy : T.surface, color: active ? '#fff' : T.textSec, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: T.font }),
  select: { padding: '6px 12px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, color: T.text, background: T.surface },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8, marginTop: 20 },
  citationBox: { background: T.surfaceH, border: `1px solid ${T.borderL}`, borderRadius: 6, padding: '10px 14px', fontSize: 11, color: T.textSec, fontFamily: T.mono, marginTop: 12, lineHeight: 1.6 },
  slider: { width: '100%', accentColor: T.navy },
  sliderLabel: { fontSize: 11, color: T.textSec, fontFamily: T.mono, display: 'flex', justifyContent: 'space-between' },
  exportBtn: { padding: '10px 20px', borderRadius: 6, background: T.navy, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: T.font },
  chip: (color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: color + '20', color, marginRight: 4 }),
};

// =========================================================================
// TAB 1: Scenario Configuration
// =========================================================================
const TabScenarioConfig = () => {
  const [selectedScenario, setSelectedScenario] = useState('nz2050');
  const [customCarbon, setCustomCarbon] = useState(150);
  const [customGDP, setCustomGDP] = useState(-3.0);
  const [customTemp, setCustomTemp] = useState(2.0);
  const [customRenewable, setCustomRenewable] = useState(55);
  const [horizon, setHorizon] = useState(2050);

  const sc = SCENARIO_DEFS.find(s => s.id === selectedScenario) || SCENARIO_DEFS[0];

  const carbonPathData = useMemo(() => YEARS.map(y => {
    const row = { year: y };
    SCENARIO_DEFS.forEach(s => { row[s.id] = s.carbonPath[y] || 0; });
    row.custom = Math.round(customCarbon * (y - 2025) / 25);
    return row;
  }), [customCarbon]);

  const gdpPathData = useMemo(() => YEARS.map(y => {
    const row = { year: y };
    SCENARIO_DEFS.forEach(s => { row[s.id] = s.gdpImpact[y] || 0; });
    row.custom = customGDP * (y - 2025) / 25;
    return row;
  }), [customGDP]);

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Framework:</strong> NGFS Phase IV Scenarios (September 2023) -- 6 reference scenarios covering orderly, disorderly, and hot house worlds.<br/>
        <strong>Key Variables:</strong> Shadow carbon price path (USD/tCO2e), GDP deviation from baseline (%), peak warming (C), renewable energy share (%).<br/>
        <strong>Citation:</strong> NGFS Phase IV Scenarios Technical Documentation, Version 4.2, November 2023<br/>
        <strong>Models:</strong> MESSAGEix-GLOBIOM 1.1 (IIASA), REMIND-MAgPIE 3.2 (PIK), GCAM 6.0 (PNNL)
      </div>

      {/* Scenario selector */}
      <div style={{display:'flex',gap:8,marginTop:16,marginBottom:16,flexWrap:'wrap'}}>
        {SCENARIO_DEFS.map(s=>(
          <button key={s.id} style={{...S.toggle(selectedScenario===s.id),borderColor:selectedScenario===s.id?s.color:T.border}} onClick={()=>setSelectedScenario(s.id)}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:4,background:s.color,marginRight:6}}/>
            {s.label}
          </button>
        ))}
      </div>

      {/* Selected scenario KPIs */}
      <div style={S.kpiRow}>
        <div style={S.kpi(sc.color)}>
          <div style={S.kpiLabel}>SCENARIO</div>
          <div style={{fontSize:18,fontWeight:700,color:T.navy}}>{sc.label}</div>
          <div style={S.kpiSub}>{sc.category} -- {sc.type}</div>
        </div>
        <div style={S.kpi(sc.color)}>
          <div style={S.kpiLabel}>PEAK WARMING</div>
          <div style={S.kpiValue}>{sc.temp}&deg;C</div>
          <div style={S.kpiSub}>By 2100</div>
        </div>
        <div style={S.kpi(sc.color)}>
          <div style={S.kpiLabel}>CARBON PRICE 2050</div>
          <div style={S.kpiValue}>${sc.carbonPath[2050]}/t</div>
          <div style={S.kpiSub}>Shadow price (USD/tCO2e)</div>
        </div>
        <div style={S.kpi(sc.color)}>
          <div style={S.kpiLabel}>GDP IMPACT 2050</div>
          <div style={{...S.kpiValue,color:T.red}}>{sc.gdpImpact[2050]}%</div>
          <div style={S.kpiSub}>Deviation from baseline</div>
        </div>
        <div style={S.kpi(sc.color)}>
          <div style={S.kpiLabel}>RENEWABLE SHARE 2050</div>
          <div style={{...S.kpiValue,color:T.green}}>{sc.renewableShare[2050]}%</div>
        </div>
        <div style={S.kpi(sc.color)}>
          <div style={S.kpiLabel}>STRANDED ASSETS</div>
          <div style={S.kpiValue}>${sc.strandedAssetsTn}Tn</div>
        </div>
      </div>

      {/* Carbon price paths */}
      <div style={S.card}>
        <div style={S.cardTitle}>Carbon Price Paths (USD/tCO2e) -- All 6 NGFS Scenarios</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={carbonPathData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}} />
            <YAxis tick={{fontSize:11,fill:T.textSec}} />
            <Tooltip contentStyle={{fontSize:11}} />
            <Legend wrapperStyle={{fontSize:10}} />
            {SCENARIO_DEFS.map(s=>(
              <Line key={s.id} type="monotone" dataKey={s.id} name={s.label} stroke={s.color} strokeWidth={selectedScenario===s.id?3:1.5} dot={selectedScenario===s.id} />
            ))}
            <Line type="monotone" dataKey="custom" name="Custom" stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* GDP impact paths */}
      <div style={S.card}>
        <div style={S.cardTitle}>GDP Impact Paths (% deviation from baseline)</div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={gdpPathData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}} />
            <YAxis tick={{fontSize:11,fill:T.textSec}} />
            <Tooltip contentStyle={{fontSize:11}} />
            <Legend wrapperStyle={{fontSize:10}} />
            {SCENARIO_DEFS.map(s=>(
              <Area key={s.id} type="monotone" dataKey={s.id} name={s.label} stroke={s.color} fill={s.color} fillOpacity={selectedScenario===s.id?0.15:0.03} strokeWidth={selectedScenario===s.id?2:1} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Custom scenario builder */}
      <div style={S.card}>
        <div style={S.cardTitle}>Custom Scenario Builder</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div>
            <div style={S.sliderLabel}><span>Carbon Price 2050</span><span>${customCarbon}/tCO2e</span></div>
            <input type="range" style={S.slider} min={10} max={1000} value={customCarbon} onChange={e=>setCustomCarbon(Number(e.target.value))} />
          </div>
          <div>
            <div style={S.sliderLabel}><span>GDP Impact 2050</span><span>{customGDP}%</span></div>
            <input type="range" style={S.slider} min={-15} max={0} step={0.1} value={customGDP} onChange={e=>setCustomGDP(Number(e.target.value))} />
          </div>
          <div>
            <div style={S.sliderLabel}><span>Peak Warming</span><span>{customTemp}&deg;C</span></div>
            <input type="range" style={S.slider} min={1.2} max={4.0} step={0.1} value={customTemp} onChange={e=>setCustomTemp(Number(e.target.value))} />
          </div>
          <div>
            <div style={S.sliderLabel}><span>Renewable Share 2050</span><span>{customRenewable}%</span></div>
            <input type="range" style={S.slider} min={20} max={90} value={customRenewable} onChange={e=>setCustomRenewable(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Scenario comparison table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Scenario Comparison Matrix</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Parameter</th>
                {SCENARIO_DEFS.map(s=><th key={s.id} style={{...S.th,color:s.color}}>{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                {p:'Category',fn:s=>s.category},{p:'Peak Warming',fn:s=>s.temp+'\u00B0C'},{p:'Stranded Assets',fn:s=>'$'+s.strandedAssetsTn+'Tn'},
                ...YEARS.map(y=>({p:`Carbon Price ${y}`,fn:s=>'$'+s.carbonPath[y]+'/t'})),
                ...YEARS.map(y=>({p:`GDP Impact ${y}`,fn:s=>s.gdpImpact[y]+'%'})),
                ...YEARS.map(y=>({p:`Renewable ${y}`,fn:s=>s.renewableShare[y]+'%'})),
              ].map((r,i)=>(
                <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:600}}>{r.p}</td>
                  {SCENARIO_DEFS.map(s=><td key={s.id} style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{r.fn(s)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 2: Sector PD Migration
// =========================================================================
const TabSectorPDMigration = ({borrowers}) => {
  const [selectedScenario, setSelectedScenario] = useState('nz2050');
  const [viewMode, setViewMode] = useState('sectors');

  const scenarioKey = {nz2050:'nz',b2c:'b2c',dnz:'dnz',dt:'dt',ndc:'ndc',cp:'cp'}[selectedScenario]||'nz';
  const multKey = scenarioKey + 'Mult';
  const sc = SCENARIO_DEFS.find(s=>s.id===selectedScenario)||SCENARIO_DEFS[0];

  const sectorData = useMemo(()=>SECTORS.map(s=>{
    const stressed = rng(s.basePD * s[multKey] * 0.95, s.basePD * s[multKey] * 1.05, s.id * 101 + scenarioKey.charCodeAt(0));
    const pdChange = stressed - s.basePD;
    const pdChangePct = (pdChange / s.basePD) * 100;
    return {...s, stressedPD: stressed, pdChange, pdChangePct};
  }).sort((a,b)=>b.pdChange-a.pdChange),[selectedScenario]);

  const borrowerData = useMemo(()=>{
    const key = scenarioKey + 'StressedPD';
    return borrowers.map(b=>({...b,stressedPD:b[key]||b.basePD*1.5,pdChange:(b[key]||b.basePD*1.5)-b.basePD})).sort((a,b)=>b.pdChange-a.pdChange);
  },[borrowers,selectedScenario]);

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Methodology:</strong> ECB 2024 Climate Stress Test -- Carbon price pass-through model<br/>
        <strong>Formula:</strong> Stressed PD = Base PD x Scenario Multiplier x Sector Elasticity<br/>
        <strong>Multiplier derivation:</strong> Carbon price impact on EBITDA margin x pass-through rate x time horizon scaling<br/>
        <strong>Citation:</strong> ECB 2024 Climate Stress Test Methodology, Section 3.2 -- Transition Risk Credit Risk Module
      </div>

      <div style={{display:'flex',gap:8,marginTop:16,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:700}}>Scenario:</span>
        {SCENARIO_DEFS.map(s=>(
          <button key={s.id} style={{...S.toggle(selectedScenario===s.id)}} onClick={()=>setSelectedScenario(s.id)}>{s.label}</button>
        ))}
        <div style={{flex:1}}/>
        <button style={S.toggle(viewMode==='sectors')} onClick={()=>setViewMode('sectors')}>By Sector (30)</button>
        <button style={S.toggle(viewMode==='borrowers')} onClick={()=>setViewMode('borrowers')}>By Borrower (50)</button>
      </div>

      {/* PD migration chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>PD Migration -- {sc.label} Scenario</div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={viewMode==='sectors'?sectorData.slice(0,20):borrowerData.slice(0,25)} layout="vertical" margin={{left:120}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} unit="%" />
            <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={110} />
            <Tooltip contentStyle={{fontSize:11}} formatter={v=>fmtPct(v)} />
            <Bar dataKey="basePD" name="Base PD" fill={T.navy} barSize={8} radius={[0,3,3,0]} />
            <Bar dataKey="stressedPD" name="Stressed PD" fill={sc.color} barSize={8} radius={[0,3,3,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full table */}
      <div style={S.card}>
        <div style={S.cardTitle}>{viewMode==='sectors'?'30 Sectors':'50 Borrowers'} -- PD Migration Matrix</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th><th style={S.th}>Name</th>
                {viewMode==='sectors'&&<th style={S.th}>NACE</th>}
                {viewMode==='borrowers'&&<><th style={S.th}>Sector</th><th style={S.th}>Country</th><th style={{...S.th,textAlign:'right'}}>Exposure (EUR M)</th></>}
                <th style={{...S.th,textAlign:'right'}}>Base PD (%)</th>
                <th style={{...S.th,textAlign:'right'}}>Stressed PD (%)</th>
                <th style={{...S.th,textAlign:'right'}}>PD Change (pp)</th>
                <th style={{...S.th,textAlign:'right'}}>PD Change (%)</th>
                <th style={S.th}>Trans. Risk</th>
                <th style={S.th}>Phys. Risk</th>
                {viewMode==='sectors'&&<th style={{...S.th,textAlign:'right'}}>Carbon Intensity</th>}
                {viewMode==='sectors'&&<th style={S.th}>Regulatory</th>}
              </tr>
            </thead>
            <tbody>
              {(viewMode==='sectors'?sectorData:borrowerData).map((r,i)=>(
                <tr key={r.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={S.td}>{r.id}</td>
                  <td style={{...S.td,fontWeight:600,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis'}}>{r.name}</td>
                  {viewMode==='sectors'&&<td style={{...S.td,fontFamily:T.mono}}>{r.nace}</td>}
                  {viewMode==='borrowers'&&<><td style={S.td}>{r.sector}</td><td style={S.td}>{r.country}</td><td style={{...S.td,textAlign:'right'}}>{fmt(r.exposure,1)}</td></>}
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(r.basePD)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:r.stressedPD>r.basePD*1.5?T.red:r.stressedPD>r.basePD?T.amber:T.green}}>{fmtPct(r.stressedPD)}</td>
                  <td style={{...S.td,textAlign:'right',color:r.pdChange>0?T.red:T.green}}>{r.pdChange>0?'+':''}{fmtPct(r.pdChange)}</td>
                  <td style={{...S.td,textAlign:'right',color:r.pdChange>0?T.red:T.green}}>{r.basePD>0?((r.pdChange/r.basePD)*100).toFixed(0)+'%':'-'}</td>
                  <td style={{...S.td,textAlign:'center'}}><span style={S.badge(r.transRisk>=8?T.red:r.transRisk>=5?T.amber:T.green)}>{r.transRisk}/10</span></td>
                  <td style={{...S.td,textAlign:'center'}}><span style={S.badge(r.physRisk>=7?T.red:r.physRisk>=4?T.amber:T.green)}>{r.physRisk}/10</span></td>
                  {viewMode==='sectors'&&<td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{r.carbonIntensity}</td>}
                  {viewMode==='sectors'&&<td style={{...S.td,fontSize:10}}>{r.regulatory}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 3: CET1 Impact Waterfall
// =========================================================================
const TabCET1Waterfall = () => {
  const [selectedScenario, setSelectedScenario] = useState('nz2050');

  const sc = SCENARIO_DEFS.find(s=>s.id===selectedScenario)||SCENARIO_DEFS[0];
  const cet1 = CET1_DATA[{nz2050:'nz2050',b2c:'b2c',dnz:'dnz',dt:'dt',ndc:'ndc',cp:'cp'}[selectedScenario]||'nz2050'];

  const waterfallData = useMemo(()=>{
    if (!cet1) return [];
    const closing = cet1.opening + cet1.credit_trans + cet1.credit_phys + cet1.market_risk + cet1.op_risk + cet1.nii_impact + cet1.green_benefit;
    return [
      {name:'Opening CET1',value:cet1.opening,color:T.navy,cumulative:cet1.opening},
      {name:'Credit (Trans.)',value:cet1.credit_trans,color:T.red,cumulative:cet1.opening+cet1.credit_trans},
      {name:'Credit (Phys.)',value:cet1.credit_phys,color:'#ef4444',cumulative:cet1.opening+cet1.credit_trans+cet1.credit_phys},
      {name:'Market Risk',value:cet1.market_risk,color:'#f97316',cumulative:cet1.opening+cet1.credit_trans+cet1.credit_phys+cet1.market_risk},
      {name:'Op. Risk',value:cet1.op_risk,color:T.amber,cumulative:cet1.opening+cet1.credit_trans+cet1.credit_phys+cet1.market_risk+cet1.op_risk},
      {name:'NII Impact',value:cet1.nii_impact,color:cet1.nii_impact>=0?T.sage:T.amber,cumulative:cet1.opening+cet1.credit_trans+cet1.credit_phys+cet1.market_risk+cet1.op_risk+cet1.nii_impact},
      {name:'Green Benefit',value:cet1.green_benefit,color:T.green,cumulative:cet1.opening+cet1.credit_trans+cet1.credit_phys+cet1.market_risk+cet1.op_risk+cet1.nii_impact+cet1.green_benefit},
      {name:'Closing CET1',value:closing,color:closing>=10.5?T.navy:closing>=8?T.amber:T.red,cumulative:closing},
    ];
  },[selectedScenario]);

  const closingCET1 = waterfallData.length>0?waterfallData[waterfallData.length-1].value:0;
  const totalImpact = closingCET1 - (cet1?.opening||0);

  // All scenarios comparison
  const allScenariosData = SCENARIO_DEFS.map(s=>{
    const k = s.id;
    const d = CET1_DATA[k];
    if(!d) return {name:s.label,closing:14.8,color:s.color};
    const c = d.opening + d.credit_trans + d.credit_phys + d.market_risk + d.op_risk + d.nii_impact + d.green_benefit;
    return {name:s.label,closing:rng(c*0.98,c*1.02,s.id.charCodeAt(0)),impact:c-d.opening,color:s.color};
  });

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Methodology:</strong> EBA 2024 EU-wide Stress Test Guidelines -- CET1 impact decomposition<br/>
        <strong>Components:</strong> Opening CET1 &rarr; Credit losses (transition + physical) &rarr; Market risk &rarr; Operational risk &rarr; NII impact &rarr; Green asset benefit &rarr; Closing CET1<br/>
        <strong>Regulatory minimum:</strong> CET1 ratio must remain above 4.5% (Pillar 1) + 2.5% (CCB) + P2R = ~10.5% effective<br/>
        <strong>Citation:</strong> EBA 2024 Stress Test Guidelines, Section 5 -- Capital Impact Assessment
      </div>

      <div style={{display:'flex',gap:8,marginTop:16,marginBottom:16,flexWrap:'wrap'}}>
        {SCENARIO_DEFS.map(s=>(
          <button key={s.id} style={S.toggle(selectedScenario===s.id)} onClick={()=>setSelectedScenario(s.id)}>{s.label}</button>
        ))}
      </div>

      <div style={S.kpiRow}>
        <div style={S.kpi(T.navy)}>
          <div style={S.kpiLabel}>OPENING CET1</div>
          <div style={S.kpiValue}>{cet1?.opening||0}%</div>
        </div>
        <div style={S.kpi(closingCET1>=10.5?T.green:closingCET1>=8?T.amber:T.red)}>
          <div style={S.kpiLabel}>CLOSING CET1</div>
          <div style={{...S.kpiValue,color:closingCET1>=10.5?T.green:closingCET1>=8?T.amber:T.red}}>{fmt(closingCET1,2)}%</div>
        </div>
        <div style={S.kpi(T.red)}>
          <div style={S.kpiLabel}>TOTAL IMPACT</div>
          <div style={{...S.kpiValue,color:T.red}}>{fmt(totalImpact,2)} pp</div>
        </div>
        <div style={S.kpi(closingCET1>=10.5?T.green:T.red)}>
          <div style={S.kpiLabel}>VS MINIMUM (10.5%)</div>
          <div style={{...S.kpiValue,color:closingCET1>=10.5?T.green:T.red}}>{closingCET1>=10.5?'PASS':'BREACH'}</div>
          <div style={S.kpiSub}>Buffer: {fmt(closingCET1-10.5,2)} pp</div>
        </div>
      </div>

      {/* Waterfall chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>CET1 Impact Waterfall -- {sc.label}</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={waterfallData} margin={{bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,'auto']} unit="%" />
            <Tooltip formatter={v=>fmt(v,2)+'%'} contentStyle={{fontSize:11}} />
            <Bar dataKey="value" radius={[3,3,0,0]}>
              {waterfallData.map((d,i)=><Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Decomposition table */}
      <div style={S.card}>
        <div style={S.cardTitle}>CET1 Impact Decomposition</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Component</th><th style={{...S.th,textAlign:'right'}}>Impact (pp)</th><th style={{...S.th,textAlign:'right'}}>% of Total</th><th style={S.th}>Driver</th></tr></thead>
          <tbody>
            {waterfallData.filter(d=>d.name!=='Opening CET1'&&d.name!=='Closing CET1').map((d,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{d.name}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:d.value<0?T.red:T.green}}>{d.value>0?'+':''}{fmt(d.value,2)}</td>
                <td style={{...S.td,textAlign:'right'}}>{totalImpact!==0?Math.abs(Math.round(d.value/totalImpact*100))+'%':'-'}</td>
                <td style={{...S.td,fontSize:11,color:T.textSec}}>
                  {d.name.includes('Trans')?'Carbon price pass-through; sector PD migration':
                   d.name.includes('Phys')?'Physical hazard exposure; RCP scenario impact':
                   d.name.includes('Market')?'Credit spread widening; equity repricing':
                   d.name.includes('Op.')?'Climate litigation; regulatory fines':
                   d.name.includes('NII')?'Interest rate path; green bond premium':
                   'Taxonomy-aligned asset preferential treatment'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cross-scenario comparison */}
      <div style={S.card}>
        <div style={S.cardTitle}>Closing CET1 -- All Scenarios</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={allScenariosData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} />
            <YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,16]} unit="%" />
            <Tooltip formatter={v=>fmt(v,2)+'%'} contentStyle={{fontSize:11}} />
            <Bar dataKey="closing" name="Closing CET1" radius={[3,3,0,0]}>
              {allScenariosData.map((d,i)=><Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{borderTop:`1px dashed ${T.red}`,marginTop:-60,position:'relative',top:-60,left:0,width:'100%',height:0}}/>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 4: Physical Risk Overlay
// =========================================================================
const TabPhysicalRisk = () => {
  const [rcpScenario, setRcpScenario] = useState('rcp85');
  const [timeHorizon, setTimeHorizon] = useState(2050);
  const [selectedHazard, setSelectedHazard] = useState('flood');

  const hazardData = useMemo(()=>HAZARD_TYPES.map(h=>{
    const key = rcpScenario === 'rcp45' ? 'rcp45_2050' : 'rcp85_2050';
    const scale = (timeHorizon - 2025) / 25;
    return {...h, impactPct: rng(h[key]*scale*0.8, h[key]*scale*1.2, h.id.charCodeAt(0)*100+timeHorizon)};
  }),[rcpScenario,timeHorizon]);

  const selectedH = HAZARD_TYPES.find(h=>h.id===selectedHazard)||HAZARD_TYPES[0];

  // Per-borrower physical risk
  const borrowerPhysRisk = useMemo(()=>BORROWERS.slice(0,30).map((b,i)=>{
    const hazardExposures = HAZARD_TYPES.map(h=>{
      const base = sr(b.id*200+h.id.charCodeAt(0)*3);
      const exposure = rcpScenario==='rcp85'?base*h.rcp85_2050:base*h.rcp45_2050;
      return {hazard:h.id,label:h.label,exposure:rng(0,exposure*10,b.id*300+h.id.charCodeAt(0)),type:h.type};
    });
    const totalPhysRisk = hazardExposures.reduce((s,h)=>s+h.exposure,0);
    return {...b,hazardExposures,totalPhysRisk};
  }).sort((a,b)=>b.totalPhysRisk-a.totalPhysRisk),[rcpScenario,timeHorizon]);

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Framework:</strong> ECB Guide on climate-related and environmental risks (Nov 2020, updated 2022)<br/>
        <strong>Hazard Types:</strong> 8 hazards covering acute (flood, cyclone, wildfire) and chronic (heat, drought, sea level, permafrost, water stress) risks<br/>
        <strong>Scenarios:</strong> RCP 4.5 (Paris-aligned) vs RCP 8.5 (business-as-usual) from IPCC AR6 WG1<br/>
        <strong>Citation:</strong> IPCC AR6 WG1 Chapter 12 -- Climate Change Information for Regional Impact and for Risk Assessment
      </div>

      <div style={{display:'flex',gap:12,marginTop:16,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:700}}>RCP:</span>
        <button style={S.toggle(rcpScenario==='rcp45')} onClick={()=>setRcpScenario('rcp45')}>RCP 4.5</button>
        <button style={S.toggle(rcpScenario==='rcp85')} onClick={()=>setRcpScenario('rcp85')}>RCP 8.5</button>
        <span style={{fontSize:12,fontWeight:700,marginLeft:12}}>Horizon:</span>
        {[2030,2040,2050].map(y=>(
          <button key={y} style={S.toggle(timeHorizon===y)} onClick={()=>setTimeHorizon(y)}>{y}</button>
        ))}
      </div>

      {/* Hazard KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginBottom:20}}>
        {hazardData.map(h=>(
          <div key={h.id} style={{...S.kpi(h.impactPct>3?T.red:h.impactPct>1.5?T.amber:T.green),cursor:'pointer',borderWidth:selectedHazard===h.id?2:1,borderColor:selectedHazard===h.id?T.gold:T.border}} onClick={()=>setSelectedHazard(h.id)}>
            <div style={{fontSize:18,marginBottom:4}}>{h.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:T.navy}}>{h.label}</div>
            <div style={{fontSize:18,fontWeight:700,color:h.impactPct>3?T.red:h.impactPct>1.5?T.amber:T.green}}>{fmtPct(h.impactPct)}</div>
            <div style={{fontSize:10,color:T.textMut}}>{h.type}</div>
          </div>
        ))}
      </div>

      {/* Selected hazard detail */}
      <div style={S.card}>
        <div style={S.cardTitle}>{selectedH.icon} {selectedH.label} -- Detail</div>
        <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>{selectedH.description}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
          <div><div style={S.kpiLabel}>TYPE</div><div style={{fontSize:14,fontWeight:700}}>{selectedH.type}</div></div>
          <div><div style={S.kpiLabel}>RCP 4.5 IMPACT</div><div style={{fontSize:14,fontWeight:700,color:T.amber}}>{fmtPct(selectedH.rcp45_2050)}</div></div>
          <div><div style={S.kpiLabel}>RCP 8.5 IMPACT</div><div style={{fontSize:14,fontWeight:700,color:T.red}}>{fmtPct(selectedH.rcp85_2050)}</div></div>
        </div>
      </div>

      {/* Radar */}
      <div style={S.card}>
        <div style={S.cardTitle}>Physical Risk Profile -- Radar</div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={hazardData} cx="50%" cy="50%" outerRadius={110}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="label" tick={{fontSize:10,fill:T.textSec}} />
            <PolarRadiusAxis tick={{fontSize:9}} />
            <Radar name="Impact %" dataKey="impactPct" stroke={rcpScenario==='rcp85'?T.red:T.amber} fill={rcpScenario==='rcp85'?T.red:T.amber} fillOpacity={0.25} />
            <Tooltip contentStyle={{fontSize:11}} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Acute vs Chronic breakdown */}
      <div style={S.card}>
        <div style={S.cardTitle}>Acute vs Chronic Risk Decomposition</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:8}}>Acute Risks (Event-driven)</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Hazard</th><th style={{...S.th,textAlign:'right'}}>RCP 4.5</th><th style={{...S.th,textAlign:'right'}}>RCP 8.5</th><th style={{...S.th,textAlign:'right'}}>Frequency Increase</th></tr></thead>
              <tbody>
                {HAZARD_TYPES.filter(h=>h.type==='Acute').map((h,i)=>(
                  <tr key={h.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                    <td style={{...S.td,fontWeight:600}}>{h.icon} {h.label}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(h.rcp45_2050)}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.red}}>{fmtPct(h.rcp85_2050)}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{rng(1.2,3.5,h.id.charCodeAt(0)*100).toFixed(1)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.amber,marginBottom:8}}>Chronic Risks (Trend-driven)</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Hazard</th><th style={{...S.th,textAlign:'right'}}>RCP 4.5</th><th style={{...S.th,textAlign:'right'}}>RCP 8.5</th><th style={{...S.th,textAlign:'right'}}>Trend Direction</th></tr></thead>
              <tbody>
                {HAZARD_TYPES.filter(h=>h.type==='Chronic').map((h,i)=>(
                  <tr key={h.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                    <td style={{...S.td,fontWeight:600}}>{h.icon} {h.label}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(h.rcp45_2050)}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.red}}>{fmtPct(h.rcp85_2050)}</td>
                    <td style={{...S.td,textAlign:'right'}}><span style={S.badge(T.red)}>Increasing</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Geographic concentration of physical risk */}
      <div style={S.card}>
        <div style={S.cardTitle}>Geographic Concentration of Physical Risk Exposure</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Country</th><th style={{...S.th,textAlign:'right'}}>Exposure (EUR M)</th><th style={{...S.th,textAlign:'right'}}>Borrowers</th>
              <th style={S.th}>Primary Hazard</th><th style={{...S.th,textAlign:'right'}}>Phys Risk Score</th><th style={S.th}>Insurance Coverage</th></tr>
          </thead>
          <tbody>
            {(() => {
              const geoData = {};
              BORROWERS.forEach(b=>{
                if(!geoData[b.country]) geoData[b.country]={country:b.country,exposure:0,count:0,physRisk:0};
                geoData[b.country].exposure+=b.exposure;
                geoData[b.country].count++;
                geoData[b.country].physRisk+=b.physRisk;
              });
              return Object.values(geoData).map(g=>({...g,avgPhysRisk:g.physRisk/g.count})).sort((a,b)=>b.exposure-a.exposure).map((g,i)=>(
                <tr key={g.country} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:700}}>{g.country}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(g.exposure,1)}</td>
                  <td style={{...S.td,textAlign:'center'}}>{g.count}</td>
                  <td style={S.td}>{pick(['Flood','Heat','Drought','Storm','Water Stress'],g.country.charCodeAt(0)*100)}</td>
                  <td style={{...S.td,textAlign:'right'}}><span style={S.badge(g.avgPhysRisk>6?T.red:g.avgPhysRisk>3.5?T.amber:T.green)}>{fmt(g.avgPhysRisk,1)}/10</span></td>
                  <td style={S.td}><span style={S.badge(sr(g.country.charCodeAt(0)*200)>0.4?T.green:T.amber)}>{sr(g.country.charCodeAt(0)*200)>0.4?'Adequate':'Partial'}</span></td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Climate tipping points */}
      <div style={S.card}>
        <div style={S.cardTitle}>Climate Tipping Points -- Tail Risk Assessment</div>
        <div style={S.citationBox}>
          <strong>Source:</strong> Armstrong McKay et al. (2022), Science -- 16 identified climate tipping elements. Relevance to financial risk assessment per NGFS conceptual framework.
        </div>
        <table style={{...S.table,marginTop:12}}>
          <thead><tr><th style={S.th}>Tipping Element</th><th style={S.th}>Threshold</th><th style={S.th}>Timeframe</th><th style={S.th}>Financial Impact</th><th style={S.th}>Probability by 2100</th></tr></thead>
          <tbody>
            {[
              {elem:'Greenland Ice Sheet Collapse',thresh:'1.5-3.0C',time:'Centuries (commitment)',impact:'Sea level +7m: coastal RE, infrastructure',prob:'Medium (RCP 8.5)'},
              {elem:'West Antarctic Ice Sheet',thresh:'1.5-3.0C',time:'Centuries',impact:'Sea level +3.3m: amplifies Greenland',prob:'Medium'},
              {elem:'AMOC Shutdown',thresh:'1.4-8.0C',time:'Decades',impact:'European cooling: agriculture, energy, transport',prob:'Low-Medium'},
              {elem:'Amazon Dieback',thresh:'2.0-6.0C',time:'Decades',impact:'Carbon release, commodity disruption, biodiversity',prob:'Medium'},
              {elem:'Arctic Winter Sea Ice Loss',thresh:'~2.0C',time:'Decades',impact:'Shipping routes, Arctic infrastructure, albedo feedback',prob:'High (RCP 8.5)'},
              {elem:'Permafrost Carbon Release',thresh:'1.0-2.0C',time:'Decades',impact:'Methane release: amplifying feedback, Arctic infrastructure',prob:'High'},
              {elem:'Coral Reef Die-off',thresh:'1.5C',time:'Years-Decades',impact:'Tourism, fisheries, coastal protection',prob:'Very High'},
              {elem:'Boreal Forest Shift',thresh:'1.4-5.0C',time:'Decades',impact:'Carbon release, timber industry, ecosystem services',prob:'Medium'},
            ].map((r,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{r.elem}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{r.thresh}</td>
                <td style={S.td}>{r.time}</td>
                <td style={{...S.td,fontSize:11}}>{r.impact}</td>
                <td style={S.td}><span style={S.badge(r.prob.includes('Very High')||r.prob.includes('High')?T.red:r.prob.includes('Medium')?T.amber:T.green)}>{r.prob}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insurance gap analysis */}
      <div style={S.card}>
        <div style={S.cardTitle}>Climate Insurance Gap Analysis</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Hazard</th><th style={{...S.th,textAlign:'right'}}>Estimated Loss (EUR M)</th><th style={{...S.th,textAlign:'right'}}>Insured Loss</th><th style={{...S.th,textAlign:'right'}}>Insurance Gap</th><th style={{...S.th,textAlign:'right'}}>Gap %</th><th style={S.th}>Trend</th></tr>
          </thead>
          <tbody>
            {HAZARD_TYPES.map((h,i)=>{
              const totalLoss = rng(50,800,h.id.charCodeAt(0)*500);
              const insuredLoss = totalLoss * rng(0.2,0.7,h.id.charCodeAt(0)*503);
              const gap = totalLoss - insuredLoss;
              const gapPct = gap/totalLoss*100;
              return (
                <tr key={h.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:600}}>{h.icon} {h.label}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(totalLoss,1)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(insuredLoss,1)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.red}}>{fmt(gap,1)}</td>
                  <td style={{...S.td,textAlign:'right'}}><span style={S.badge(gapPct>50?T.red:gapPct>30?T.amber:T.green)}>{fmtPct(gapPct)}</span></td>
                  <td style={S.td}><span style={S.badge(T.red)}>Widening</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Per-borrower physical risk */}
      <div style={S.card}>
        <div style={S.cardTitle}>Per-Borrower Physical Risk Exposure (Top 30)</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th><th style={S.th}>Borrower</th><th style={S.th}>Sector</th><th style={S.th}>Country</th>
                <th style={{...S.th,textAlign:'right'}}>Exposure (EUR M)</th>
                <th style={{...S.th,textAlign:'right'}}>Total Phys Risk</th>
                {HAZARD_TYPES.slice(0,4).map(h=><th key={h.id} style={S.th}>{h.label.split(' ')[0]}</th>)}
              </tr>
            </thead>
            <tbody>
              {borrowerPhysRisk.map((b,i)=>(
                <tr key={b.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={S.td}>{b.id}</td>
                  <td style={{...S.td,fontWeight:600}}>{b.name}</td>
                  <td style={S.td}>{b.sector}</td>
                  <td style={S.td}>{b.country}</td>
                  <td style={{...S.td,textAlign:'right'}}>{fmt(b.exposure,1)}</td>
                  <td style={{...S.td,textAlign:'right'}}><span style={S.badge(b.totalPhysRisk>10?T.red:b.totalPhysRisk>5?T.amber:T.green)}>{fmt(b.totalPhysRisk,1)}</span></td>
                  {b.hazardExposures.slice(0,4).map(h=><td key={h.hazard} style={{...S.td,textAlign:'center',fontSize:10}}>{fmt(h.exposure,1)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 5: ECL Climate Overlay
// =========================================================================
const TabECLOverlay = ({borrowers}) => {
  const [selectedScenario, setSelectedScenario] = useState('nz2050');
  const [overlayType, setOverlayType] = useState('combined');

  const scenarioKey = {nz2050:'nz',b2c:'b2c',dnz:'dnz',dt:'dt',ndc:'ndc',cp:'cp'}[selectedScenario]||'nz';
  const sc = SCENARIO_DEFS.find(s=>s.id===selectedScenario)||SCENARIO_DEFS[0];

  const eclData = useMemo(()=>{
    return borrowers.map((b,i)=>{
      const stressedPDKey = scenarioKey+'StressedPD';
      const stressedPD = b[stressedPDKey] || b.basePD * 1.5;
      const baseECL = b.basePD / 100 * b.lgd / 100 * b.exposure;
      const transOverlay = (stressedPD - b.basePD) / 100 * b.lgd / 100 * b.exposure * 0.6;
      const physOverlay = b.physRisk / 10 * b.exposure * rng(0.002, 0.015, i * 301);
      const combinedECL = baseECL + transOverlay + physOverlay;
      const sicrTriggered = stressedPD > b.basePD * 2;
      const stage = sicrTriggered ? (stressedPD > b.basePD * 4 ? 3 : 2) : 1;
      const lifetimeMultiplier = stage >= 2 ? b.maturity * 0.8 : 1;
      const lifetimeECL = combinedECL * lifetimeMultiplier;
      return { ...b, baseECL, transOverlay, physOverlay, combinedECL, lifetimeECL, sicrTriggered, stage, stressedPD };
    });
  },[borrowers,selectedScenario]);

  const totalBaseECL = eclData.reduce((s,b)=>s+b.baseECL,0);
  const totalTransOverlay = eclData.reduce((s,b)=>s+b.transOverlay,0);
  const totalPhysOverlay = eclData.reduce((s,b)=>s+b.physOverlay,0);
  const totalLifetimeECL = eclData.reduce((s,b)=>s+b.lifetimeECL,0);
  const sicrCount = eclData.filter(b=>b.sicrTriggered).length;
  const stageDistribution = [
    {stage:'Stage 1',count:eclData.filter(b=>b.stage===1).length,exposure:eclData.filter(b=>b.stage===1).reduce((s,b)=>s+b.exposure,0),color:T.green},
    {stage:'Stage 2',count:eclData.filter(b=>b.stage===2).length,exposure:eclData.filter(b=>b.stage===2).reduce((s,b)=>s+b.exposure,0),color:T.amber},
    {stage:'Stage 3',count:eclData.filter(b=>b.stage===3).length,exposure:eclData.filter(b=>b.stage===3).reduce((s,b)=>s+b.exposure,0),color:T.red},
  ];

  // Sector ECL aggregation
  const sectorECL = useMemo(()=>{
    const map = {};
    eclData.forEach(b=>{
      if (!map[b.sector]) map[b.sector]={sector:b.sector,baseECL:0,transOverlay:0,physOverlay:0,lifetimeECL:0,exposure:0,count:0};
      map[b.sector].baseECL += b.baseECL;
      map[b.sector].transOverlay += b.transOverlay;
      map[b.sector].physOverlay += b.physOverlay;
      map[b.sector].lifetimeECL += b.lifetimeECL;
      map[b.sector].exposure += b.exposure;
      map[b.sector].count += 1;
    });
    return Object.values(map).sort((a,b)=>b.lifetimeECL-a.lifetimeECL);
  },[eclData]);

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Framework:</strong> IFRS 9 Financial Instruments ss 5.5.17 -- Forward-looking expected credit loss model<br/>
        <strong>ECL Formula:</strong> ECL = PD x LGD x EAD, adjusted for climate overlay (transition + physical risk uplift)<br/>
        <strong>SICR Triggers:</strong> PD increase &gt;200% from origination, or 2+ notch rating downgrade under climate scenario<br/>
        <strong>Stage Migration:</strong> Stage 1 (12-month ECL) &rarr; Stage 2 (lifetime ECL on SICR) &rarr; Stage 3 (credit-impaired)<br/>
        <strong>Citation:</strong> IFRS 9 ss 5.5, ECB Supervisory Expectations on climate risk in ICAAP (2020)
      </div>

      <div style={{display:'flex',gap:8,marginTop:16,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:700}}>Scenario:</span>
        {SCENARIO_DEFS.map(s=>(
          <button key={s.id} style={S.toggle(selectedScenario===s.id)} onClick={()=>setSelectedScenario(s.id)}>{s.label}</button>
        ))}
        <div style={{flex:1}}/>
        <button style={S.toggle(overlayType==='combined')} onClick={()=>setOverlayType('combined')}>Combined</button>
        <button style={S.toggle(overlayType==='transition')} onClick={()=>setOverlayType('transition')}>Transition Only</button>
        <button style={S.toggle(overlayType==='physical')} onClick={()=>setOverlayType('physical')}>Physical Only</button>
      </div>

      <div style={S.kpiRow}>
        <div style={S.kpi(T.navy)}>
          <div style={S.kpiLabel}>BASE ECL</div>
          <div style={S.kpiValue}>{fmtM(totalBaseECL)}</div>
          <div style={S.kpiSub}>Pre-overlay</div>
        </div>
        <div style={S.kpi(T.amber)}>
          <div style={S.kpiLabel}>TRANSITION OVERLAY</div>
          <div style={{...S.kpiValue,color:T.amber}}>+{fmtM(totalTransOverlay)}</div>
        </div>
        <div style={S.kpi(T.red)}>
          <div style={S.kpiLabel}>PHYSICAL OVERLAY</div>
          <div style={{...S.kpiValue,color:T.red}}>+{fmtM(totalPhysOverlay)}</div>
        </div>
        <div style={S.kpi(T.green)}>
          <div style={S.kpiLabel}>TOTAL LIFETIME ECL</div>
          <div style={S.kpiValue}>{fmtM(totalLifetimeECL)}</div>
          <div style={S.kpiSub}>{fmtPct((totalLifetimeECL/totalBaseECL-1)*100)} uplift</div>
        </div>
        <div style={S.kpi('#7c3aed')}>
          <div style={S.kpiLabel}>SICR TRIGGERED</div>
          <div style={S.kpiValue}>{sicrCount}/{eclData.length}</div>
          <div style={S.kpiSub}>{fmtPct(sicrCount/eclData.length*100)} of book</div>
        </div>
      </div>

      {/* IFRS 9 Stage definitions */}
      <div style={S.card}>
        <div style={S.cardTitle}>IFRS 9 Stage Definitions & Climate SICR Triggers</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Stage</th><th style={S.th}>Description</th><th style={S.th}>ECL Method</th><th style={S.th}>Climate SICR Trigger</th></tr></thead>
          <tbody>
            {IFRS9_STAGES.map((s,i)=>(
              <tr key={s.stage} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:700}}>{s.label}</td>
                <td style={{...S.td,maxWidth:300}}>{s.description}</td>
                <td style={{...S.td,fontFamily:T.mono,fontSize:10}}>{s.eclMethod}</td>
                <td style={S.td}>{s.trigger}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stage distribution */}
      <div style={S.card}>
        <div style={S.cardTitle}>Stage Distribution Under {sc.label} Scenario</div>
        <div style={{display:'flex',gap:20,alignItems:'center'}}>
          <ResponsiveContainer width={250} height={200}>
            <PieChart>
              <Pie data={stageDistribution} dataKey="count" nameKey="stage" cx="50%" cy="50%" innerRadius={45} outerRadius={80}>
                {stageDistribution.map((s,i)=><Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip contentStyle={{fontSize:11}} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{flex:1}}>
            {stageDistribution.map(s=>(
              <div key={s.stage} style={{display:'flex',gap:12,alignItems:'center',marginBottom:8,padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`}}>
                <div style={{width:12,height:12,borderRadius:2,background:s.color}}/>
                <div style={{flex:1}}><span style={{fontWeight:700}}>{s.stage}</span></div>
                <div style={{fontFamily:T.mono,fontSize:12}}>{s.count} borrowers</div>
                <div style={{fontFamily:T.mono,fontSize:12}}>EUR {fmt(s.exposure,1)}M</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sector ECL */}
      <div style={S.card}>
        <div style={S.cardTitle}>ECL by Sector</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sectorECL.slice(0,15)}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis tick={{fontSize:10,fill:T.textSec}} />
            <Tooltip contentStyle={{fontSize:11}} formatter={v=>fmtM(v)} />
            <Legend wrapperStyle={{fontSize:10}} />
            <Bar dataKey="baseECL" name="Base ECL" stackId="a" fill={T.navy} />
            <Bar dataKey="transOverlay" name="Transition Overlay" stackId="a" fill={T.amber} />
            <Bar dataKey="physOverlay" name="Physical Overlay" stackId="a" fill={T.red} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Borrower table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Per-Borrower ECL Detail</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th><th style={S.th}>Borrower</th><th style={S.th}>Sector</th>
                <th style={{...S.th,textAlign:'right'}}>Exposure</th>
                <th style={{...S.th,textAlign:'right'}}>Base PD</th><th style={{...S.th,textAlign:'right'}}>Stressed PD</th>
                <th style={{...S.th,textAlign:'right'}}>Base ECL</th><th style={{...S.th,textAlign:'right'}}>Trans Overlay</th>
                <th style={{...S.th,textAlign:'right'}}>Phys Overlay</th><th style={{...S.th,textAlign:'right'}}>Lifetime ECL</th>
                <th style={S.th}>Stage</th><th style={S.th}>SICR</th>
              </tr>
            </thead>
            <tbody>
              {eclData.sort((a,b)=>b.lifetimeECL-a.lifetimeECL).slice(0,30).map((b,i)=>(
                <tr key={b.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={S.td}>{b.id}</td>
                  <td style={{...S.td,fontWeight:600}}>{b.name}</td>
                  <td style={S.td}>{b.sector}</td>
                  <td style={{...S.td,textAlign:'right'}}>{fmt(b.exposure,1)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(b.basePD)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:b.stressedPD>b.basePD*2?T.red:T.amber}}>{fmtPct(b.stressedPD)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(b.baseECL,2)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.amber}}>{fmt(b.transOverlay,2)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.red}}>{fmt(b.physOverlay,2)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono,fontWeight:700}}>{fmt(b.lifetimeECL,2)}</td>
                  <td style={S.td}><span style={S.badge(b.stage===3?T.red:b.stage===2?T.amber:T.green)}>S{b.stage}</span></td>
                  <td style={S.td}>{b.sicrTriggered?<span style={S.badge(T.red)}>YES</span>:<span style={S.badge(T.green)}>NO</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 6: Regulatory Compliance
// =========================================================================
const TabRegulatoryCompliance = () => {
  const [filterRegulator, setFilterRegulator] = useState('All');

  const regulators = ['All','ECB','BoE','Fed','EBA','APRA','MAS','OSFI','HKMA'];
  const filtered = filterRegulator === 'All' ? REG_TIMELINE : REG_TIMELINE.filter(r=>r.regulator===filterRegulator);

  const scenarioReqs = [
    {regulator:'ECB',scenarios:['Net Zero 2050','Delayed Transition','Current Policies'],mandatory:true,frequency:'Biennial'},
    {regulator:'BoE',scenarios:['Early Action','Late Action','No Additional Action'],mandatory:true,frequency:'Biennial exploratory'},
    {regulator:'Fed',scenarios:['Net Zero 2050','Current Policies'],mandatory:false,frequency:'Pilot'},
    {regulator:'EBA',scenarios:['Baseline + Adverse (with climate overlay)'],mandatory:true,frequency:'Biennial'},
    {regulator:'APRA',scenarios:['Below 2C','Current Policies'],mandatory:true,frequency:'Ad hoc'},
    {regulator:'MAS',scenarios:['Orderly','Disorderly','Hot House'],mandatory:true,frequency:'Annual'},
  ];

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Multi-Jurisdictional Coverage:</strong> ECB (EU), BoE (UK), Fed (US), EBA (EU-wide), APRA (AU), MAS (SG), OSFI (CA), HKMA (HK)<br/>
        <strong>Status as of March 2026:</strong> ECB 2024 complete; BoE CBES 2025 in progress; Fed framework under development<br/>
        <strong>Key Trend:</strong> Convergence toward NGFS scenarios as common reference framework across jurisdictions
      </div>

      <div style={{display:'flex',gap:8,marginTop:16,marginBottom:16,flexWrap:'wrap'}}>
        {regulators.map(r=>(
          <button key={r} style={S.toggle(filterRegulator===r)} onClick={()=>setFilterRegulator(r)}>{r}</button>
        ))}
      </div>

      {/* Timeline */}
      <div style={S.card}>
        <div style={S.cardTitle}>Climate Stress Test Timeline</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Regulator</th><th style={S.th}>Jurisdiction</th><th style={S.th}>Exercise</th>
                <th style={S.th}>Scenarios</th><th style={S.th}>Frequency</th><th style={S.th}>Deadline</th>
                <th style={S.th}>Status</th><th style={S.th}>Mandatory</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:700}}>{r.regulator}</td>
                  <td style={S.td}>{r.jurisdiction}</td>
                  <td style={{...S.td,fontWeight:600}}>{r.exercise}</td>
                  <td style={{...S.td,fontSize:11,maxWidth:200}}>{r.scenarios}</td>
                  <td style={S.td}>{r.frequency}</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{r.deadline}</td>
                  <td style={S.td}><span style={S.badge(r.status==='Complete'?T.green:r.status==='In Progress'?T.amber:r.status==='Planned'?T.navyL:T.textMut)}>{r.status}</span></td>
                  <td style={S.td}>{r.mandatory?<span style={S.badge(T.red)}>Mandatory</span>:<span style={S.badge(T.textMut)}>Voluntary</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario requirements by regulator */}
      <div style={S.card}>
        <div style={S.cardTitle}>Scenario Requirements by Regulator</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Regulator</th><th style={S.th}>Required Scenarios</th><th style={S.th}>Mandatory</th><th style={S.th}>Frequency</th></tr></thead>
          <tbody>
            {scenarioReqs.map((r,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:700}}>{r.regulator}</td>
                <td style={S.td}>{r.scenarios.join(', ')}</td>
                <td style={S.td}>{r.mandatory?<span style={S.badge(T.red)}>Yes</span>:<span style={S.badge(T.textMut)}>No</span>}</td>
                <td style={S.td}>{r.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compliance checklist */}
      <div style={S.card}>
        <div style={S.cardTitle}>Our Institution -- Compliance Status</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {[
            {item:'ECB 2024 submission',status:'Complete',date:'2024-07-31'},
            {item:'ECB 2026 data collection',status:'In Progress',date:'2026-03-31'},
            {item:'BoE CBES 2025 submission',status:'In Progress',date:'2025-12-31'},
            {item:'EBA ST 2025 climate overlay',status:'In Progress',date:'2025-07-31'},
            {item:'Internal ICAAP climate integration',status:'Complete',date:'2024-12-31'},
            {item:'Board risk appetite: climate metrics',status:'Complete',date:'2025-01-15'},
            {item:'Model validation: climate PD models',status:'In Progress',date:'2025-06-30'},
            {item:'Data infrastructure: physical risk scoring',status:'In Progress',date:'2025-09-30'},
          ].map((c,i)=>(
            <div key={i} style={{padding:'12px 16px',borderRadius:6,border:`1px solid ${T.border}`,borderLeft:`4px solid ${c.status==='Complete'?T.green:T.amber}`}}>
              <div style={{fontSize:12,fontWeight:700,color:T.navy}}>{c.item}</div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                <span style={S.badge(c.status==='Complete'?T.green:T.amber)}>{c.status}</span>
                <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{c.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 7: Export & Reporting
// =========================================================================
const TabExportReporting = () => {
  const [reportFormat, setReportFormat] = useState('ecb');

  const reportFormats = [
    {id:'ecb',label:'ECB Format',desc:'ECB Climate Stress Test submission template. Includes all mandatory data points per ECB methodology note.'},
    {id:'boe',label:'BoE CBES Format',desc:'Bank of England Climate Biennial Exploratory Scenario template. Sterling-denominated, UK-centric.'},
    {id:'eba',label:'EBA Stress Test',desc:'EBA EU-wide stress test climate module overlay. Integrated with main stress test framework.'},
    {id:'board',label:'Board Summary',desc:'Executive summary for Board risk committee. Key metrics, traffic lights, action items.'},
    {id:'internal',label:'Internal Risk',desc:'Detailed internal risk report for ICAAP/ILAAP climate integration. Full borrower-level detail.'},
  ];

  const downstreamFeeds = [
    {target:'Climate Banking Hub',fields:'All stress test results, CET1 impacts, PD migrations',status:'Active'},
    {target:'Credit Risk Models',fields:'Climate-adjusted PDs, LGDs, EAD',status:'Active'},
    {target:'EBA Pillar 3 Template 4',fields:'Banking book climate risk by sector and credit quality',status:'Active'},
    {target:'ICAAP',fields:'Climate capital buffer, concentration risk add-on',status:'Active'},
    {target:'Risk Appetite Framework',fields:'CET1 impact limits per scenario, sector concentration limits',status:'Active'},
    {target:'ALM/Treasury',fields:'NII climate impact, green bond portfolio benefit',status:'Planned'},
    {target:'Investor Relations',fields:'Climate stress test summary for annual/ESG report',status:'Active'},
    {target:'CSRD E1',fields:'Transition plan resilience assessment per ESRS E1-9',status:'Planned'},
  ];

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Export Formats:</strong> ECB submission XML, BoE CBES template, EBA ST template, Board PDF, Internal CSV<br/>
        <strong>Downstream Consumers:</strong> Climate Banking Hub, Credit Risk, EBA Pillar 3, ICAAP, Risk Appetite Framework<br/>
        <strong>Submission Timeline:</strong> ECB CST: biennial (next: H1 2026) | BoE CBES: biennial (next: 2025) | EBA ST: biennial (next: 2025)
      </div>

      {/* Report format selector */}
      <div style={S.card}>
        <div style={S.cardTitle}>Generate Stress Test Report</div>
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {reportFormats.map(f=>(
            <button key={f.id} style={S.toggle(reportFormat===f.id)} onClick={()=>setReportFormat(f.id)}>{f.label}</button>
          ))}
        </div>
        {reportFormats.filter(f=>f.id===reportFormat).map(f=>(
          <div key={f.id} style={{padding:'14px 18px',borderRadius:6,background:T.surfaceH,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{f.label}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:4}}>{f.desc}</div>
            <button style={{...S.exportBtn,marginTop:12}}>Generate {f.label} Report</button>
          </div>
        ))}
      </div>

      {/* Board summary preview */}
      <div style={S.card}>
        <div style={S.cardTitle}>Board Summary -- Key Metrics</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Metric</th><th style={S.th}>Net Zero 2050</th><th style={S.th}>Delayed Transition</th><th style={S.th}>Current Policies</th><th style={S.th}>Status</th></tr></thead>
          <tbody>
            {[
              {m:'CET1 Impact (pp)',nz:'-1.33',dt:'-3.43',cp:'-3.12',s:'Amber'},
              {m:'Total ECL Uplift (EUR M)',nz:'285',dt:'820',cp:'680',s:'Amber'},
              {m:'SICR Triggered (#)',nz:'8',dt:'22',cp:'18',s:'Red'},
              {m:'Max Sector PD Increase (%)',nz:'+180%',dt:'+240%',cp:'+210%',s:'Red'},
              {m:'Green Asset Benefit (pp)',nz:'+0.22',dt:'+0.15',cp:'+0.08',s:'Green'},
              {m:'Risk Appetite Breach',nz:'No',dt:'Marginal',cp:'Yes',s:'Red'},
            ].map((r,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{r.m}</td>
                <td style={{...S.td,textAlign:'center',fontFamily:T.mono}}>{r.nz}</td>
                <td style={{...S.td,textAlign:'center',fontFamily:T.mono}}>{r.dt}</td>
                <td style={{...S.td,textAlign:'center',fontFamily:T.mono}}>{r.cp}</td>
                <td style={S.td}><span style={S.badge(r.s==='Green'?T.green:r.s==='Amber'?T.amber:T.red)}>{r.s}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Downstream feeds */}
      <div style={S.card}>
        <div style={S.cardTitle}>Downstream Data Feeds</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Target System</th><th style={S.th}>Data Fields</th><th style={S.th}>Status</th></tr></thead>
          <tbody>
            {downstreamFeeds.map((f,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{f.target}</td>
                <td style={S.td}>{f.fields}</td>
                <td style={S.td}><span style={S.badge(f.status==='Active'?T.green:T.amber)}>{f.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reverse stress test */}
      <div style={S.card}>
        <div style={S.cardTitle}>Reverse Stress Test -- What Breaks the Bank?</div>
        <div style={S.citationBox}>
          <strong>Purpose:</strong> Identify scenarios that would cause CET1 to breach regulatory minimums (4.5% Pillar 1 + buffers).<br/>
          <strong>Methodology:</strong> Work backwards from breach point to determine required combination of carbon price, GDP shock, and physical damage.
        </div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Breach Level</th><th style={S.th}>Carbon Price Required</th><th style={S.th}>GDP Shock Required</th><th style={S.th}>Physical Damage</th><th style={S.th}>Probability</th><th style={S.th}>Time Horizon</th></tr>
          </thead>
          <tbody>
            {[
              {level:'Breach 10.5% (P2R)',carbon:'$350/t',gdp:'-4.5%',physical:'1-in-50yr flood + drought',prob:'Medium',horizon:'2035-2040'},
              {level:'Breach 8.0% (CCB)',carbon:'$500/t',gdp:'-7.0%',physical:'1-in-100yr multi-hazard',prob:'Low',horizon:'2040-2050'},
              {level:'Breach 4.5% (Pillar 1)',carbon:'$800/t + abrupt',gdp:'-12%',physical:'Tipping point cascade',prob:'Very Low',horizon:'2050+'},
              {level:'Resolution trigger',carbon:'$1000/t overnight',gdp:'-15%+',physical:'Systemic failure',prob:'Tail risk',horizon:'Extreme'},
            ].map((r,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:700}}>{r.level}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{r.carbon}</td>
                <td style={{...S.td,fontFamily:T.mono,color:T.red}}>{r.gdp}</td>
                <td style={{...S.td,fontSize:11}}>{r.physical}</td>
                <td style={S.td}><span style={S.badge(r.prob==='Very Low'||r.prob==='Tail risk'?T.green:r.prob==='Low'?T.amber:T.red)}>{r.prob}</span></td>
                <td style={S.td}>{r.horizon}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cross-scenario comparison matrix */}
      <div style={S.card}>
        <div style={S.cardTitle}>Cross-Scenario Impact Comparison Matrix</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Impact Metric</th>
              {SCENARIO_DEFS.map(s=><th key={s.id} style={{...S.th,textAlign:'center',color:s.color,fontSize:10}}>{s.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              {m:'CET1 Depletion (pp)',vals:[-1.33,-1.04,-2.45,-3.43,-2.25,-3.12]},
              {m:'Total ECL Uplift (EUR M)',vals:[285,210,520,820,480,680]},
              {m:'SICR Triggered (count)',vals:[8,5,15,22,14,18]},
              {m:'NPL Increase (pp)',vals:[0.8,0.5,1.8,2.5,1.5,2.2]},
              {m:'Max Sector PD Increase (%)',vals:[180,140,200,240,80,120]},
              {m:'Physical Risk Loss (EUR M)',vals:[120,110,140,180,350,520]},
              {m:'Market Risk Loss (EUR M)',vals:[85,65,165,220,115,155]},
              {m:'Green Asset Benefit (pp)',vals:[0.22,0.18,0.20,0.15,0.10,0.08]},
              {m:'NII Impact (pp)',vals:[0.15,0.12,-0.10,-0.30,-0.20,-0.35]},
              {m:'Stranded Asset Write-Down (EUR M)',vals:[450,320,580,720,180,120]},
              {m:'Insurance Gap (EUR M)',vals:[80,70,95,110,250,380]},
              {m:'Supply Chain Disruption (%)',vals:[5,4,8,12,6,8]},
            ].map((r,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600,fontSize:11}}>{r.m}</td>
                {r.vals.map((v,j)=>{
                  const isNeg = typeof v==='number'&&v<0;
                  const isPos = typeof v==='number'&&v>0&&r.m.includes('Benefit');
                  return <td key={j} style={{...S.td,textAlign:'center',fontFamily:T.mono,fontSize:11,color:isPos?T.green:isNeg?T.red:T.text}}>{typeof v==='number'?(v<0?v:r.m.includes('EUR')?fmt(v,0):r.m.includes('pp')?fmt(v,2):r.m.includes('%')?v+'%':v):v}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed scenario narrative */}
      <div style={S.card}>
        <div style={S.cardTitle}>Scenario Narrative & Management Actions</div>
        {[
          {scenario:'Net Zero 2050 (Orderly)',narrative:'Smooth transition with front-loaded policy action. Carbon prices rise steadily to $725/t by 2050. Fossil fuel sector experiences gradual decline. Green lending opportunities expand significantly. Bank benefits from early-mover advantage in green finance.',actions:['Accelerate green origination (+EUR 5Bn/yr)','De-risk coal exposures (30% reduction by 2028)','Develop green bond framework','Invest in climate data infrastructure'],cet1:'Manageable (-1.33 pp)'},
          {scenario:'Delayed Transition (Disorderly)',narrative:'Policy inaction until 2030 followed by abrupt regulatory tightening. Carbon prices spike to $600/t by 2050 with majority of increase post-2035. Severe sector disruption. Real estate revaluation risk from MEES. Insurance market dislocation.',actions:['Build climate capital buffer (+50 bps)','Scenario-contingent hedging strategy','Accelerate data quality improvement (PCAF <2.5)','Board-level escalation protocol'],cet1:'Stressful (-3.43 pp, near breach)'},
          {scenario:'Current Policies (Hot House)',narrative:'No additional climate policies. Physical risks dominate. Temperature rises to 3C+ by 2100. Severe weather events increase in frequency and intensity. Agricultural disruption. Coastal asset impairment. Insurance withdrawal from high-risk areas.',actions:['Physical risk scoring for all new origination','Climate VaR integration in risk appetite','Geographic diversification of real estate book','Parametric insurance for tail physical risks'],cet1:'Severe (-3.12 pp)'},
        ].map((s,i)=>(
          <div key={i} style={{padding:'14px 18px',borderRadius:6,border:`1px solid ${T.border}`,marginBottom:12,borderLeft:`4px solid ${i===0?T.green:i===1?T.amber:T.red}`}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{s.scenario}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:4,lineHeight:1.6}}>{s.narrative}</div>
            <div style={{fontSize:12,fontWeight:700,color:i===0?T.green:i===1?T.amber:T.red,marginTop:8}}>CET1 Impact: {s.cet1}</div>
            <div style={{marginTop:8}}>
              <div style={{fontSize:11,fontWeight:700,color:T.textSec}}>Recommended Management Actions:</div>
              {s.actions.map((a,j)=>(
                <div key={j} style={{fontSize:11,color:T.text,paddingLeft:12,marginTop:2}}>- {a}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Data quality assessment */}
      <div style={S.card}>
        <div style={S.cardTitle}>Stress Test Data Quality Assessment</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Data Element</th><th style={S.th}>Source</th><th style={S.th}>Coverage</th><th style={S.th}>PCAF Score</th><th style={S.th}>Quality Issue</th><th style={S.th}>Remediation</th></tr></thead>
          <tbody>
            {[
              {elem:'Scope 1 Emissions',source:'CDP/company reports',coverage:'78%',pcaf:'2.5',issue:'22% estimated from sector avg',remediation:'Engage with counterparties'},
              {elem:'Scope 2 Emissions',source:'CDP/company reports',coverage:'75%',pcaf:'2.8',issue:'Location vs market-based method inconsistency',remediation:'Standardize on market-based'},
              {elem:'Scope 3 Emissions',source:'PCAF/EXIOBASE',coverage:'45%',pcaf:'4.0',issue:'55% sector-average proxy',remediation:'Phase in reported data'},
              {elem:'EPC Ratings',source:'National EPC registries',coverage:'62%',pcaf:'3.0',issue:'38% missing for older stock',remediation:'Partner with EPC assessors'},
              {elem:'Geocoded Assets',source:'Internal/CoreLogic',coverage:'55%',pcaf:'3.5',issue:'45% at HQ level only',remediation:'Asset-level geocoding project'},
              {elem:'NACE Classification',source:'Internal/BvD',coverage:'92%',pcaf:'2.0',issue:'8% mapped by SIC conversion',remediation:'Direct NACE lookup'},
              {elem:'Taxonomy Alignment',source:'Counterparty reporting',coverage:'35%',pcaf:'3.8',issue:'65% estimated/proxied',remediation:'CSRD phase-in will improve'},
              {elem:'Physical Risk Scores',source:'Munich Re/WRI',coverage:'85%',pcaf:'2.5',issue:'15% missing flood zone data',remediation:'Subscribe to NGFS climate data'},
            ].map((r,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{r.elem}</td>
                <td style={S.td}>{r.source}</td>
                <td style={{...S.td,textAlign:'center'}}><span style={S.badge(parseInt(r.coverage)>75?T.green:parseInt(r.coverage)>50?T.amber:T.red)}>{r.coverage}</span></td>
                <td style={{...S.td,textAlign:'center'}}><span style={S.badge(parseFloat(r.pcaf)<=2.5?T.green:parseFloat(r.pcaf)<=3.5?T.amber:T.red)}>{r.pcaf}</span></td>
                <td style={{...S.td,fontSize:11}}>{r.issue}</td>
                <td style={{...S.td,fontSize:11}}>{r.remediation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Risk appetite monitoring */}
      <div style={S.card}>
        <div style={S.cardTitle}>Risk Appetite Monitoring -- Climate Stress Limits</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Metric</th><th style={S.th}>Limit</th><th style={S.th}>Current</th><th style={S.th}>Headroom</th><th style={S.th}>Status</th></tr></thead>
          <tbody>
            {[
              {m:'Max CET1 depletion (any scenario)',limit:'-3.0 pp',current:'-3.43 pp (DT)',headroom:'-0.43 pp',s:'Breach'},
              {m:'Max sector concentration in high-risk NACE',limit:'15% of book',current:'12.8%',headroom:'2.2 pp',s:'Green'},
              {m:'Physical risk: max coastal flood exposure',limit:'EUR 5Bn',current:'EUR 3.2Bn',headroom:'EUR 1.8Bn',s:'Green'},
              {m:'Min closing CET1 (all scenarios)',limit:'10.5%',current:'11.37% (DT)',headroom:'0.87 pp',s:'Amber'},
              {m:'Max ECL uplift vs baseline',limit:'EUR 1Bn',current:'EUR 820M (DT)',headroom:'EUR 180M',s:'Amber'},
              {m:'Stranded asset exposure limit',limit:'EUR 8Bn',current:'EUR 5.4Bn',headroom:'EUR 2.6Bn',s:'Green'},
            ].map((r,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{r.m}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{r.limit}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{r.current}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{r.headroom}</td>
                <td style={S.td}><span style={S.badge(r.s==='Green'?T.green:r.s==='Amber'?T.amber:T.red)}>{r.s}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// EXPANDED: Scenario Sensitivity & Macro Linkage Analysis
// =========================================================================
const TabScenarioSensitivity = ({borrowers}) => {
  const [carbonPriceOverride, setCarbonPriceOverride] = useState(200);
  const [gdpShockOverride, setGdpShockOverride] = useState(-3.0);
  const [interestRateShock, setInterestRateShock] = useState(1.5);
  const [energyPriceShock, setEnergyPriceShock] = useState(50);

  // Carbon price sensitivity on PD
  const carbonSensitivity = useMemo(()=>{
    return [25, 50, 100, 150, 200, 300, 500, 725, 1000].map(price=>{
      const avgPDMult = 1 + (price / 1000) * 1.8;
      const avgPD = 1.85 * avgPDMult;
      const eclUplift = (avgPDMult - 1) * 100;
      const cet1Impact = -(price / 1000) * 2.8;
      return {carbonPrice: price, avgPD: rng(avgPD*0.9,avgPD*1.1,price*101), eclUplift: rng(eclUplift*0.9,eclUplift*1.1,price*103), cet1Impact: rng(cet1Impact*0.9,cet1Impact*1.1,price*107)};
    });
  },[]);

  // GDP sensitivity
  const gdpSensitivity = useMemo(()=>{
    return [-1, -2, -3, -4, -5, -7, -10, -12, -15].map(gdp=>{
      const pdMult = 1 + Math.abs(gdp) * 0.12;
      return {gdpShock: gdp, avgPDMult: rng(pdMult*0.95,pdMult*1.05,Math.abs(gdp)*201), nplRate: rng(1.5+Math.abs(gdp)*0.3,1.5+Math.abs(gdp)*0.5,Math.abs(gdp)*203), cet1Impact: rng(gdp*0.35,gdp*0.45,Math.abs(gdp)*207)};
    });
  },[]);

  // Cross-sector correlation heatmap data
  const sectorCorrelations = useMemo(()=>{
    const topSectors = SECTORS.slice(0,12);
    return topSectors.map((s1,i)=>({
      sector: s1.name,
      ...Object.fromEntries(topSectors.map((s2,j)=>[s2.name, rng(
        Math.abs(i-j)<3?0.5:0.1,
        Math.abs(i-j)<2?0.95:Math.abs(i-j)<4?0.7:0.5,
        i*1000+j*100+7
      )]))
    }));
  },[]);

  // Interest rate pass-through
  const interestRateImpact = useMemo(()=>{
    return SECTORS.slice(0,15).map(s=>({
      sector: s.name,
      niiImpact: rng(-0.5, 2.5, s.id*301+interestRateShock*100),
      debtServiceRatio: rng(1.2, 4.5, s.id*303),
      refinancingRisk: rng(0, 10, s.id*307),
      interestCoverage: rng(1.5, 8.0, s.id*311),
    }));
  },[interestRateShock]);

  // Energy price impact
  const energyPriceImpact = useMemo(()=>{
    return SECTORS.slice(0,15).map(s=>({
      sector: s.name,
      energyCostPct: rng(2, 45, s.id*401),
      passThrough: rng(20, 95, s.id*403),
      marginImpact: rng(-15, -0.5, s.id*407) * (energyPriceShock/50),
      competitiveImpact: pick(['Low','Medium','High','Very High'], s.id*409+energyPriceShock),
    }));
  },[energyPriceShock]);

  // Stranded asset analysis
  const strandedAssetData = useMemo(()=>{
    const highRiskSectors = SECTORS.filter(s=>s.transRisk>=7);
    return highRiskSectors.map(s=>{
      const currentExposure = rng(500, 5000, s.id*501);
      const strandedBy2030 = currentExposure * rng(0.1, 0.4, s.id*503);
      const strandedBy2040 = currentExposure * rng(0.3, 0.7, s.id*507);
      const strandedBy2050 = currentExposure * rng(0.5, 0.95, s.id*509);
      return {sector:s.name,nace:s.nace,currentExposure,strandedBy2030,strandedBy2040,strandedBy2050,writeDownRisk:rng(5,45,s.id*511)};
    });
  },[]);

  // Second-round effects
  const secondRoundEffects = [
    {effect:'Supply chain disruption',channel:'Carbon price -> input cost increase -> supplier default',magnitude:'Medium-High',sectors:'Manufacturing, Construction, Automotive',amplification:'1.2-1.8x'},
    {effect:'Real estate devaluation',channel:'MEES non-compliance -> forced retrofit / stranded assets',magnitude:'High',sectors:'Commercial RE, Mortgages (EPC D-G)',amplification:'1.3-2.0x'},
    {effect:'Consumer demand shift',channel:'Green preferences -> ICE vehicle demand decline',magnitude:'Medium',sectors:'Automotive (ICE), Oil Refining',amplification:'1.1-1.5x'},
    {effect:'Insurance withdrawal',channel:'Physical risk repricing -> uninsurable assets',magnitude:'High',sectors:'Agriculture, Coastal RE, Infrastructure',amplification:'1.5-2.5x'},
    {effect:'Sovereign contagion',channel:'Climate damage -> fiscal stress -> sovereign downgrade -> bank exposures',magnitude:'Medium',sectors:'Sovereign, All (via risk-free rate)',amplification:'1.2-1.6x'},
    {effect:'Technology disruption',channel:'Clean tech breakthrough -> accelerated fossil asset obsolescence',magnitude:'Very High',sectors:'Coal, Oil, Gas, ICE Automotive',amplification:'2.0-3.0x'},
    {effect:'Labour market friction',channel:'Transition -> job losses in high-carbon sectors -> household default',magnitude:'Medium',sectors:'Coal regions, Oil-dependent economies',amplification:'1.1-1.4x'},
    {effect:'Trade policy shock',channel:'CBAM implementation -> competitive disadvantage for non-EU imports',magnitude:'Medium',sectors:'Steel, Cement, Aluminium, Fertilizers',amplification:'1.2-1.7x'},
  ];

  // Concentration risk analysis
  const concentrationRisk = useMemo(()=>{
    const totalExposure = borrowers.reduce((s,b)=>s+b.exposure,0);
    const top5 = borrowers.sort((a,b)=>b.exposure-a.exposure).slice(0,5);
    const top5Pct = top5.reduce((s,b)=>s+b.exposure,0)/totalExposure*100;
    const highTransRisk = borrowers.filter(b=>b.transRisk>=7);
    const highPhysRisk = borrowers.filter(b=>b.physRisk>=7);
    return {
      totalExposure,
      top5,
      top5Pct,
      top5Exposure: top5.reduce((s,b)=>s+b.exposure,0),
      highTransRiskCount: highTransRisk.length,
      highTransRiskExposure: highTransRisk.reduce((s,b)=>s+b.exposure,0),
      highPhysRiskCount: highPhysRisk.length,
      highPhysRiskExposure: highPhysRisk.reduce((s,b)=>s+b.exposure,0),
      hhi: borrowers.reduce((s,b)=>s+Math.pow(b.exposure/totalExposure*100,2),0),
    };
  },[borrowers]);

  return (
    <div>
      {/* Sliders */}
      <div style={S.card}>
        <div style={S.cardTitle}>Scenario Parameter Sensitivity</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div>
            <div style={{...S.sliderLabel||{fontSize:11,display:'flex',justifyContent:'space-between'}}}><span>Carbon Price</span><span>${carbonPriceOverride}/tCO2e</span></div>
            <input type="range" style={{width:'100%',accentColor:T.navy}} min={10} max={1000} value={carbonPriceOverride} onChange={e=>setCarbonPriceOverride(Number(e.target.value))} />
          </div>
          <div>
            <div style={{...S.sliderLabel||{fontSize:11,display:'flex',justifyContent:'space-between'}}}><span>GDP Shock</span><span>{gdpShockOverride}%</span></div>
            <input type="range" style={{width:'100%',accentColor:T.navy}} min={-15} max={0} step={0.5} value={gdpShockOverride} onChange={e=>setGdpShockOverride(Number(e.target.value))} />
          </div>
          <div>
            <div style={{...S.sliderLabel||{fontSize:11,display:'flex',justifyContent:'space-between'}}}><span>Interest Rate Shock</span><span>+{interestRateShock} pp</span></div>
            <input type="range" style={{width:'100%',accentColor:T.navy}} min={0} max={5} step={0.25} value={interestRateShock} onChange={e=>setInterestRateShock(Number(e.target.value))} />
          </div>
          <div>
            <div style={{...S.sliderLabel||{fontSize:11,display:'flex',justifyContent:'space-between'}}}><span>Energy Price Shock</span><span>+{energyPriceShock}%</span></div>
            <input type="range" style={{width:'100%',accentColor:T.navy}} min={0} max={200} value={energyPriceShock} onChange={e=>setEnergyPriceShock(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Carbon price sensitivity */}
      <div style={S.card}>
        <div style={S.cardTitle}>Carbon Price Sensitivity -- Impact on PD, ECL, and CET1</div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={carbonSensitivity}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="carbonPrice" tick={{fontSize:10,fill:T.textSec}} label={{value:'Carbon Price ($/tCO2e)',position:'bottom',fontSize:10}} />
            <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textSec}} />
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textSec}} />
            <Tooltip contentStyle={{fontSize:11}} />
            <Legend wrapperStyle={{fontSize:10}} />
            <Bar yAxisId="left" dataKey="eclUplift" name="ECL Uplift %" fill={T.amber} radius={[3,3,0,0]} />
            <Line yAxisId="right" type="monotone" dataKey="cet1Impact" name="CET1 Impact (pp)" stroke={T.red} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
        <table style={{...S.table,marginTop:12}}>
          <thead>
            <tr>
              <th style={S.th}>Carbon Price</th><th style={{...S.th,textAlign:'right'}}>Avg Stressed PD</th>
              <th style={{...S.th,textAlign:'right'}}>ECL Uplift</th><th style={{...S.th,textAlign:'right'}}>CET1 Impact</th>
            </tr>
          </thead>
          <tbody>
            {carbonSensitivity.map((r,i)=>(
              <tr key={r.carbonPrice} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600,fontFamily:T.mono}}>${r.carbonPrice}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(r.avgPD)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.amber}}>+{fmtPct(r.eclUplift)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.red}}>{fmt(r.cet1Impact,2)} pp</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GDP sensitivity */}
      <div style={S.card}>
        <div style={S.cardTitle}>GDP Shock Sensitivity</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>GDP Shock</th><th style={{...S.th,textAlign:'right'}}>PD Multiplier</th><th style={{...S.th,textAlign:'right'}}>NPL Rate</th><th style={{...S.th,textAlign:'right'}}>CET1 Impact</th></tr>
          </thead>
          <tbody>
            {gdpSensitivity.map((r,i)=>(
              <tr key={r.gdpShock} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600,fontFamily:T.mono}}>{r.gdpShock}%</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(r.avgPDMult,2)}x</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(r.nplRate)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.red}}>{fmt(r.cet1Impact,2)} pp</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stranded assets */}
      <div style={S.card}>
        <div style={S.cardTitle}>Stranded Asset Analysis -- High Transition Risk Sectors</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Sector</th><th style={S.th}>NACE</th><th style={{...S.th,textAlign:'right'}}>Current (EUR M)</th>
              <th style={{...S.th,textAlign:'right'}}>Stranded 2030</th><th style={{...S.th,textAlign:'right'}}>Stranded 2040</th>
              <th style={{...S.th,textAlign:'right'}}>Stranded 2050</th><th style={{...S.th,textAlign:'right'}}>Write-Down Risk %</th></tr>
          </thead>
          <tbody>
            {strandedAssetData.map((r,i)=>(
              <tr key={r.sector} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{r.sector}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{r.nace}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(r.currentExposure,0)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.amber}}>{fmt(r.strandedBy2030,0)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:'#ef4444'}}>{fmt(r.strandedBy2040,0)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.red}}>{fmt(r.strandedBy2050,0)}</td>
                <td style={{...S.td,textAlign:'right'}}><span style={S.badge(r.writeDownRisk>30?T.red:r.writeDownRisk>15?T.amber:T.green)}>{fmtPct(r.writeDownRisk)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Second-round effects */}
      <div style={S.card}>
        <div style={S.cardTitle}>Second-Round Effects & Amplification Channels</div>
        <div style={S.citationBox}>
          <strong>ECB Methodology:</strong> The ECB 2024 Climate Stress Test explicitly requires banks to model second-round effects including supply chain disruption, fire-sale dynamics, and feedback loops between the real economy and financial sector.
        </div>
        <table style={{...S.table,marginTop:12}}>
          <thead>
            <tr><th style={S.th}>Effect</th><th style={S.th}>Transmission Channel</th><th style={S.th}>Magnitude</th><th style={S.th}>Affected Sectors</th><th style={S.th}>Amplification</th></tr>
          </thead>
          <tbody>
            {secondRoundEffects.map((e,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{e.effect}</td>
                <td style={{...S.td,fontSize:11,maxWidth:250}}>{e.channel}</td>
                <td style={S.td}><span style={S.badge(e.magnitude==='Very High'?T.red:e.magnitude==='High'?'#ef4444':e.magnitude==='Medium-High'?T.amber:T.gold)}>{e.magnitude}</span></td>
                <td style={{...S.td,fontSize:11}}>{e.sectors}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{e.amplification}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Concentration risk */}
      <div style={S.card}>
        <div style={S.cardTitle}>Climate Concentration Risk Analysis</div>
        <div style={S.kpiRow}>
          <div style={S.kpi(T.navy)}>
            <div style={S.kpiLabel}>TOP-5 CONCENTRATION</div>
            <div style={S.kpiValue}>{fmtPct(concentrationRisk.top5Pct)}</div>
            <div style={S.kpiSub}>EUR {fmt(concentrationRisk.top5Exposure,1)}M</div>
          </div>
          <div style={S.kpi(T.red)}>
            <div style={S.kpiLabel}>HIGH TRANSITION RISK</div>
            <div style={S.kpiValue}>{concentrationRisk.highTransRiskCount}</div>
            <div style={S.kpiSub}>EUR {fmt(concentrationRisk.highTransRiskExposure,1)}M</div>
          </div>
          <div style={S.kpi(T.amber)}>
            <div style={S.kpiLabel}>HIGH PHYSICAL RISK</div>
            <div style={S.kpiValue}>{concentrationRisk.highPhysRiskCount}</div>
            <div style={S.kpiSub}>EUR {fmt(concentrationRisk.highPhysRiskExposure,1)}M</div>
          </div>
          <div style={S.kpi(T.sage)}>
            <div style={S.kpiLabel}>HHI (SECTOR)</div>
            <div style={S.kpiValue}>{fmt(concentrationRisk.hhi,0)}</div>
            <div style={S.kpiSub}>{concentrationRisk.hhi>2500?'High':'Moderate'} concentration</div>
          </div>
        </div>
      </div>

      {/* Energy price impact */}
      <div style={S.card}>
        <div style={S.cardTitle}>Energy Price Shock Impact by Sector (+{energyPriceShock}%)</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Sector</th><th style={{...S.th,textAlign:'right'}}>Energy Cost %</th><th style={{...S.th,textAlign:'right'}}>Pass-Through</th><th style={{...S.th,textAlign:'right'}}>Margin Impact</th><th style={S.th}>Competitive Impact</th></tr>
          </thead>
          <tbody>
            {energyPriceImpact.map((r,i)=>(
              <tr key={r.sector} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{r.sector}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(r.energyCostPct)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(r.passThrough)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.red}}>{fmt(r.marginImpact,1)} pp</td>
                <td style={S.td}><span style={S.badge(r.competitiveImpact==='Very High'?T.red:r.competitiveImpact==='High'?'#ef4444':r.competitiveImpact==='Medium'?T.amber:T.green)}>{r.competitiveImpact}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interest rate impact */}
      <div style={S.card}>
        <div style={S.cardTitle}>Interest Rate Shock Impact (+{interestRateShock} pp)</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Sector</th><th style={{...S.th,textAlign:'right'}}>NII Impact</th><th style={{...S.th,textAlign:'right'}}>Debt Service Ratio</th><th style={{...S.th,textAlign:'right'}}>Refinancing Risk</th><th style={{...S.th,textAlign:'right'}}>Interest Coverage</th></tr>
          </thead>
          <tbody>
            {interestRateImpact.map((r,i)=>(
              <tr key={r.sector} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{r.sector}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:r.niiImpact>0?T.green:T.red}}>{r.niiImpact>0?'+':''}{fmt(r.niiImpact,2)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(r.debtServiceRatio,2)}x</td>
                <td style={{...S.td,textAlign:'right'}}><span style={S.badge(r.refinancingRisk>7?T.red:r.refinancingRisk>4?T.amber:T.green)}>{fmt(r.refinancingRisk,1)}/10</span></td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(r.interestCoverage,2)}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// EXPANDED: Model Methodology & Validation
// =========================================================================
const TabModelMethodology = () => {
  const methodologyNotes = [
    {section:'1. Transition Risk PD Model',content:'PD stress multiplier = f(carbon_price_pass_through, sector_elasticity, time_horizon). Carbon price pass-through rates calibrated to ECB 2024 CST methodology. Sector-specific elasticity derived from EBITDA sensitivity to carbon costs. Time horizon scaling uses exponential decay function.',citation:'ECB 2024 CST Methodology Note, Section 3.2'},
    {section:'2. Physical Risk Scoring',content:'Per-borrower physical risk score = weighted sum of 8 hazard exposures. Weights calibrated to IPCC AR6 WG2 damage functions. Geocoded asset-level data mapped to CMIP6 projections at 0.25-degree resolution. Acute vs chronic hazard split per ECB climate risk guide.',citation:'ECB Guide on C&E Risks, Expectation 7.4'},
    {section:'3. SICR Trigger Calibration',content:'Climate SICR trigger: PD increase >200% from origination or 2+ notch downgrade under climate scenario. Calibrated to ECB TRIM data. Stage 2 transfers include 3-month cooling-off period. Backstop: any borrower in NACE B05/B06 with maturity >5yr under NZ2050 scenario.',citation:'IFRS 9 ss 5.5.9, ECB TRIM Guide'},
    {section:'4. LGD Climate Adjustment',content:'LGD uplift for collateral devaluation under physical risk (real estate flood/fire zone) and transition risk (stranded industrial assets). Haircut schedule: 5-20% for transition-exposed collateral, 10-40% for physical-risk-exposed property.',citation:'ECB 2024 CST, Section 4.3'},
    {section:'5. NII Climate Module',content:'Net interest income projection under climate scenarios. Green bond funding advantage (10-25 bps greenium). Transition risk on deposit base (potential outflows from climate-sensitive sectors). Interest rate path from NGFS REMIND/GCAM models.',citation:'EBA ST Methodology 2024, Section 6'},
    {section:'6. Operational Risk',content:'Climate litigation risk: historical frequency x severity analysis. Regulatory fine exposure: Basel III standardised approach with climate add-on. Reputational risk: ESG score sensitivity to climate events (RepRisk methodology).',citation:'ECB SSM Climate Expectations 2022'},
    {section:'7. Concentration Add-on',content:'Sector concentration risk add-on per ICG/SREP. HHI-based measure for NACE B-D35 exposures. Single-name concentration for top-20 carbon-intensive counterparties. Geographic concentration for physical risk hotspots.',citation:'ECB 2024 CST, Section 5.1'},
    {section:'8. Model Validation',content:'Backtesting against ECB 2022 CST results. Sensitivity analysis across NGFS scenarios. Expert judgement overlay for tail risks. Annual independent model validation by 2nd line. Challenger model comparison with MSCI Climate VaR.',citation:'ECB SSM TRIM Expectations, SR 11-7'},
  ];

  const modelGovernance = [
    {item:'Model Owner',value:'Chief Risk Officer (CRO)',status:'Assigned'},
    {item:'Model Developer',value:'Climate Risk Analytics Team',status:'Assigned'},
    {item:'Independent Validator',value:'Model Validation Unit (2nd line)',status:'Complete (FY2024)'},
    {item:'External Audit',value:'Deloitte Climate Risk Advisory',status:'Planned (FY2025)'},
    {item:'Board Approval',value:'Risk Committee',status:'Complete (Jan 2025)'},
    {item:'Next Validation Cycle',value:'H2 2025',status:'Scheduled'},
    {item:'Data Quality Assessment',value:'PCAF Score <3.0 target',status:'In Progress (Current: 3.2)'},
    {item:'Scenario Governance',value:'NGFS Phase IV adopted as standard',status:'Complete'},
  ];

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Model Methodology Documentation</div>
        {methodologyNotes.map((m,i)=>(
          <div key={i} style={{padding:'12px 16px',borderRadius:6,border:`1px solid ${T.border}`,marginBottom:8,background:i%2===0?T.surfaceH:T.surface}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{m.section}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:4,lineHeight:1.6}}>{m.content}</div>
            <div style={{fontSize:10,fontFamily:T.mono,color:T.gold,marginTop:4}}>Citation: {m.citation}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Model Governance & Validation Status</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Item</th><th style={S.th}>Detail</th><th style={S.th}>Status</th></tr></thead>
          <tbody>
            {modelGovernance.map((g,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{g.item}</td>
                <td style={S.td}>{g.value}</td>
                <td style={S.td}><span style={S.badge(g.status.includes('Complete')?T.green:g.status.includes('In Progress')||g.status.includes('Planned')||g.status.includes('Scheduled')?T.amber:T.textMut)}>{g.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Model validation results */}
      <div style={S.card}>
        <div style={S.cardTitle}>Model Validation Results Summary</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Test</th><th style={S.th}>Description</th><th style={S.th}>Result</th><th style={S.th}>Threshold</th><th style={S.th}>Status</th></tr></thead>
          <tbody>
            {[
              {test:'Backtesting (ECB 2022 CST)',desc:'Compare model output vs ECB 2022 actual results for overlapping portfolio',result:'RMSE: 0.42 pp',threshold:'<0.50 pp',status:'Pass'},
              {test:'Sensitivity: Carbon +50%',desc:'CET1 response to 50% carbon price increase',result:'-0.65 pp',threshold:'Within 0.3-1.0 pp',status:'Pass'},
              {test:'Sensitivity: GDP -1%',desc:'CET1 response to additional 1% GDP shock',result:'-0.38 pp',threshold:'Within 0.2-0.6 pp',status:'Pass'},
              {test:'Concentration Test',desc:'Impact of top-5 counterparty default under stress',result:'-1.85 pp',threshold:'<2.0 pp',status:'Pass'},
              {test:'Time Horizon Stability',desc:'Model output stability across 2030/2040/2050 horizons',result:'Monotonic',threshold:'Non-decreasing path',status:'Pass'},
              {test:'Cross-Scenario Ordering',desc:'NZ2050 < Below 2C < Delayed < Current (loss ordering)',result:'Consistent',threshold:'Ordering preserved',status:'Pass'},
              {test:'Expert Overlay Review',desc:'Subject matter expert challenge on top-10 sector PDs',result:'3 adjustments',threshold:'<5 material overrides',status:'Pass'},
              {test:'Challenger Model Comparison',desc:'MSCI Climate VaR vs internal model correlation',result:'R2 = 0.78',threshold:'>0.70',status:'Pass'},
              {test:'Data Quality: PCAF Score',desc:'Weighted average PCAF data quality score',result:'3.2',threshold:'<3.5',status:'Pass'},
              {test:'Tail Risk Coverage',desc:'Model captures 95th percentile loss',result:'EUR 1.2Bn',threshold:'Within 0.8-1.5Bn range',status:'Pass'},
            ].map((r,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{r.test}</td>
                <td style={{...S.td,fontSize:11}}>{r.desc}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{r.result}</td>
                <td style={{...S.td,fontFamily:T.mono,fontSize:11}}>{r.threshold}</td>
                <td style={S.td}><span style={S.badge(r.status==='Pass'?T.green:T.red)}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PD Model Calibration Details */}
      <div style={S.card}>
        <div style={S.cardTitle}>Transition Risk PD Model -- Calibration Parameters</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Sector</th><th style={S.th}>Carbon Elasticity</th><th style={S.th}>Pass-Through Rate</th>
              <th style={S.th}>EBITDA Sensitivity</th><th style={S.th}>PD Floor</th><th style={S.th}>PD Cap</th>
              <th style={S.th}>Time Decay (lambda)</th></tr>
          </thead>
          <tbody>
            {SECTORS.slice(0,20).map((s,i)=>(
              <tr key={s.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{s.name}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{rng(0.1,2.5,s.id*701).toFixed(2)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(rng(15,95,s.id*703))}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(s.ebitdaImpact)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(0.03)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(rng(15,45,s.id*707))}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{rng(0.85,0.98,s.id*709).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Physical risk model parameters */}
      <div style={S.card}>
        <div style={S.cardTitle}>Physical Risk Model -- Hazard-Sector Vulnerability Matrix</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Sector</th>
                {HAZARD_TYPES.slice(0,6).map(h=><th key={h.id} style={{...S.th,fontSize:9}}>{h.label.split(' ')[0]}</th>)}
                <th style={{...S.th,textAlign:'right'}}>Composite</th>
              </tr>
            </thead>
            <tbody>
              {SECTORS.slice(0,15).map((s,i)=>{
                const hazardScores = HAZARD_TYPES.slice(0,6).map((h,j)=>rng(1,10,s.id*800+j*100));
                const composite = hazardScores.reduce((a,b)=>a+b,0)/hazardScores.length;
                return (
                  <tr key={s.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                    <td style={{...S.td,fontWeight:600,fontSize:11}}>{s.name}</td>
                    {hazardScores.map((v,j)=>(
                      <td key={j} style={{...S.td,textAlign:'center'}}>
                        <span style={S.badge(v>7?T.red:v>4?T.amber:T.green)}>{v.toFixed(1)}</span>
                      </td>
                    ))}
                    <td style={{...S.td,textAlign:'right',fontWeight:700}}>
                      <span style={S.badge(composite>6?T.red:composite>3.5?T.amber:T.green)}>{composite.toFixed(1)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ECL Model Architecture */}
      <div style={S.card}>
        <div style={S.cardTitle}>ECL Climate Overlay Model Architecture</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {[
            {step:'1. Base ECL',desc:'Standard IFRS 9 ECL calculation using through-the-cycle PD, downturn LGD, and EAD from internal models.',input:'IRB/SA parameters',output:'Base 12-month and lifetime ECL'},
            {step:'2. Transition Overlay',desc:'Scenario-specific PD uplift based on carbon price pass-through, sector elasticity, and time horizon. Applied to all performing exposures.',input:'NGFS scenario + sector PD multipliers',output:'Transition-adjusted PD per borrower'},
            {step:'3. Physical Overlay',desc:'Per-borrower physical risk score x exposure x damage function. Geocoded hazard assessment with RCP 4.5/8.5 weighting.',input:'Hazard maps + geocoded assets',output:'Physical risk loss estimate'},
            {step:'4. SICR Assessment',desc:'Climate SICR trigger: PD increase >200% from origination or 2+ notch downgrade. Determines Stage 1 vs Stage 2 allocation.',input:'Stressed PD vs origination PD',output:'Stage classification'},
            {step:'5. Lifetime ECL',desc:'For Stage 2/3 borrowers: lifetime PD x downturn LGD x EAD, using residual maturity. Forward-looking scenario weights applied.',input:'Stage + maturity + LGD',output:'Lifetime ECL per borrower'},
            {step:'6. Management Overlay',desc:'Expert judgement layer for: (a) model limitations, (b) emerging risks not captured, (c) sector-specific idiosyncratic factors.',input:'Risk committee input',output:'Final ECL with overlay'},
          ].map((s,i)=>(
            <div key={i} style={{padding:'14px 18px',borderRadius:6,border:`1px solid ${T.border}`,background:i%2===0?T.surfaceH:T.surface}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{s.step}</div>
              <div style={{fontSize:11,color:T.textSec,marginTop:4,lineHeight:1.5}}>{s.desc}</div>
              <div style={{fontSize:10,fontFamily:T.mono,color:T.gold,marginTop:6}}>Input: {s.input}</div>
              <div style={{fontSize:10,fontFamily:T.mono,color:T.sage,marginTop:2}}>Output: {s.output}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory comparison of methodologies */}
      <div style={S.card}>
        <div style={S.cardTitle}>Cross-Jurisdictional Methodology Comparison</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr><th style={S.th}>Feature</th><th style={S.th}>ECB 2024</th><th style={S.th}>BoE CBES</th><th style={S.th}>Fed Pilot</th><th style={S.th}>EBA ST 2025</th></tr>
            </thead>
            <tbody>
              {[
                {f:'Scenarios',ecb:'3 NGFS (NZ, DT, HH)',boe:'3 custom (Early, Late, No)',fed:'2 NGFS (NZ, CP)',eba:'Adverse + climate overlay'},
                {f:'Time Horizon',ecb:'2025-2050',boe:'2021-2050',fed:'2024-2050',eba:'3-year (2025-2027)'},
                {f:'Balance Sheet',ecb:'Static',boe:'Dynamic (management actions)',fed:'Static',eba:'Static (constrained)'},
                {f:'Physical Risk',ecb:'Integrated',boe:'Separate module',fed:'Limited',eba:'Overlay approach'},
                {f:'Granularity',ecb:'Counterparty-level',boe:'Sector-level (with deep dives)',fed:'Portfolio-level',eba:'Counterparty-level'},
                {f:'Second Round',ecb:'Required (simplified)',boe:'Required (detailed)',fed:'Not required',eba:'Required (simplified)'},
                {f:'NII Module',ecb:'Yes',boe:'Yes (detailed)',fed:'No',eba:'Yes'},
                {f:'Publication',ecb:'Aggregate + bank-level',boe:'Aggregate only',fed:'Aggregate summary',eba:'Bank-level (adverse only)'},
                {f:'Capital Impact',ecb:'Information only',boe:'Exploratory (no capital add-on)',fed:'Pilot (no binding)',eba:'Binding (Pillar 2)'},
                {f:'Frequency',ecb:'Biennial',boe:'Biennial',fed:'TBD',eba:'Biennial'},
              ].map((r,i)=>(
                <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:600}}>{r.f}</td>
                  <td style={{...S.td,fontSize:11}}>{r.ecb}</td>
                  <td style={{...S.td,fontSize:11}}>{r.boe}</td>
                  <td style={{...S.td,fontSize:11}}>{r.fed}</td>
                  <td style={{...S.td,fontSize:11}}>{r.eba}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key assumptions */}
      <div style={S.card}>
        <div style={S.cardTitle}>Key Model Assumptions & Limitations</div>
        <div style={{fontSize:12,lineHeight:1.8,color:T.textSec}}>
          <p><strong>1. Static Balance Sheet:</strong> Portfolio composition held constant over projection horizon. No management actions, new origination, or run-off modelled. This is conservative for transition scenarios where banks may de-risk proactively.</p>
          <p><strong>2. Carbon Price Pass-Through:</strong> Assumed linear relationship between carbon price and cost impact on EBITDA. Actual pass-through varies by market structure, competitive dynamics, and abatement options. Sector-specific non-linearities not fully captured.</p>
          <p><strong>3. Physical Risk Geocoding:</strong> Borrower physical risk based on headquarters location. Multi-site operations not individually geocoded (data gap). Underestimates supply chain physical risk for globally diversified borrowers.</p>
          <p><strong>4. Scenario Independence:</strong> Transition and physical risks modelled separately with additive overlay. Correlation between transition path and physical damage trajectory not explicitly modelled. ECB 2026 CST expected to address this.</p>
          <p><strong>5. Data Quality:</strong> Average PCAF data quality score of 3.2 across portfolio. Scope 3 data relies on sector averages for ~40% of book. SME data quality remains a challenge (estimated/proxied for ~25% of eligible exposures).</p>
          <p><strong>6. Tipping Points:</strong> Model does not capture climate tipping points (e.g., AMOC collapse, permafrost cascade). Tail risks beyond NGFS scenario range not modelled. Reverse stress test recommended for these extreme scenarios.</p>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================
const TABS = [
  {key:'scenario',label:'Scenario Configuration'},
  {key:'pd',label:'Sector PD Migration'},
  {key:'cet1',label:'CET1 Impact Waterfall'},
  {key:'physical',label:'Physical Risk Overlay'},
  {key:'ecl',label:'ECL Climate Overlay'},
  {key:'regulatory',label:'Regulatory Compliance'},
  {key:'export',label:'Export & Reporting'},
  {key:'sensitivity',label:'Sensitivity & Macro'},
  {key:'methodology',label:'Model Methodology'},
];

export default function ClimateStressTestPage() {
  const [activeTab, setActiveTab] = useState('scenario');

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTitle}>Climate Stress Test -- ECB 2024 / BoE CBES / NGFS Phase IV</div>
        <div style={S.headerSub}>EP-AJ2 | ECB Climate Stress Test Methodology | EBA 2024 Guidelines | IFRS 9 Climate Overlay</div>
        <div style={S.citation}>
          Frameworks: NGFS Phase IV (Nov 2023) | ECB Guide on C&E Risks (2022) | BoE CBES | EBA ITS on Pillar 3 ESG
        </div>
      </div>

      {/* Tab Bar */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <div key={t.key} style={S.tab(activeTab===t.key)} onClick={()=>setActiveTab(t.key)}>{t.label}</div>
        ))}
      </div>

      {/* Tab Content */}
      <div style={S.body}>
        {activeTab === 'scenario' && <TabScenarioConfig />}
        {activeTab === 'pd' && <TabSectorPDMigration borrowers={BORROWERS} />}
        {activeTab === 'cet1' && <TabCET1Waterfall />}
        {activeTab === 'physical' && <TabPhysicalRisk />}
        {activeTab === 'ecl' && <TabECLOverlay borrowers={BORROWERS} />}
        {activeTab === 'regulatory' && <TabRegulatoryCompliance />}
        {activeTab === 'export' && <TabExportReporting />}
        {activeTab === 'sensitivity' && <TabScenarioSensitivity borrowers={BORROWERS} />}
        {activeTab === 'methodology' && <TabModelMethodology />}
      </div>
    </div>
  );
}
