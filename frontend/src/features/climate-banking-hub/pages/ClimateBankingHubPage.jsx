import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, Cell, AreaChart, Area, LineChart, Line, PieChart, Pie,
  ScatterChart, Scatter, ComposedChart, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { NGFS_SCENARIOS, CARBON_PRICES, SECTOR_BENCHMARKS, EMISSION_FACTORS } from '../../../data/referenceData';
import { SECURITY_UNIVERSE, MOCK_PORTFOLIO } from '../../../data/securityUniverse';

/* ═══════════════════════════════════════════════════════════════════════════════
 * ClimateBankingHubPage.jsx
 * Framework: EBA Pillar 3 ESG ITS + PCAF + EU Taxonomy + NGFS
 * 7 Tabs · 15 KPIs · 10 EBA Templates · 25 Regulatory Items · 20 Peer Banks
 * ═══════════════════════════════════════════════════════════════════════════════ */

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const pick=(a,s)=>a[Math.floor(sr(s)*a.length)];
const range=(lo,hi,s)=>+(lo+sr(s)*(hi-lo)).toFixed(2);
const rangeInt=(lo,hi,s)=>Math.floor(lo+sr(s)*(hi-lo+1));
const fmt=(n,d=1)=>n>=1e9?(n/1e9).toFixed(d)+'bn':n>=1e6?(n/1e6).toFixed(d)+'M':n>=1e3?(n/1e3).toFixed(d)+'k':n.toFixed(d);
const fmtPct=(n,d=1)=>n.toFixed(d)+'%';
const fmtGBP=(n)=>'£'+fmt(n);

/* ── Tab Definitions ──────────────────────────────────────────────────────── */
const TABS=[
  {id:'dashboard',label:'Board Dashboard',icon:'📊'},
  {id:'pillar3',label:'EBA Pillar 3',icon:'🏛️'},
  {id:'regulatory',label:'Regulatory Tracker',icon:'📋'},
  {id:'appetite',label:'Risk Appetite',icon:'🎯'},
  {id:'peer',label:'Peer Benchmarking',icon:'📈'},
  {id:'nzba',label:'NZBA Commitment',icon:'🌍'},
  {id:'report',label:'Board Report & Export',icon:'📄'},
];

/* ── Period Data ──────────────────────────────────────────────────────────── */
const PERIODS=['Q4 2024','Q3 2024','Q2 2024','Q1 2024','FY 2023','FY 2022'];

const KPI_BY_PERIOD={
  'Q4 2024':{fe:812.4,waci:185.2,gar:7.8,btar:12.4,cet1Impact:-1.92,physRiskExp:18.5,transRiskExp:34.2,carbonIntPct:28.1,sbtiPct:42.5,tempScore:2.64,nzbaProgress:38,greenBond:2.85,scope3Cat15:847.3,dqsAvg:3.2,regCompliance:76.8},
  'Q3 2024':{fe:847.3,waci:192.8,gar:7.3,btar:11.8,cet1Impact:-1.82,physRiskExp:19.2,transRiskExp:35.8,carbonIntPct:29.4,sbtiPct:39.8,tempScore:2.71,nzbaProgress:35,greenBond:2.65,scope3Cat15:891.2,dqsAvg:3.1,regCompliance:74.2},
  'Q2 2024':{fe:891.2,waci:201.5,gar:6.9,btar:11.2,cet1Impact:-1.68,physRiskExp:19.8,transRiskExp:36.5,carbonIntPct:30.8,sbtiPct:37.2,tempScore:2.78,nzbaProgress:32,greenBond:2.42,scope3Cat15:934.0,dqsAvg:3.0,regCompliance:71.5},
  'Q1 2024':{fe:934.0,waci:208.3,gar:6.2,btar:10.5,cet1Impact:-1.55,physRiskExp:20.5,transRiskExp:37.8,carbonIntPct:32.1,sbtiPct:34.5,tempScore:2.85,nzbaProgress:28,greenBond:2.18,scope3Cat15:960.8,dqsAvg:2.9,regCompliance:68.8},
  'FY 2023':{fe:960.8,waci:215.7,gar:5.8,btar:9.8,cet1Impact:-1.42,physRiskExp:21.2,transRiskExp:39.2,carbonIntPct:33.5,sbtiPct:31.8,tempScore:2.92,nzbaProgress:24,greenBond:1.95,scope3Cat15:1050.0,dqsAvg:2.8,regCompliance:62.4},
  'FY 2022':{fe:1050.0,waci:238.4,gar:4.2,btar:8.2,cet1Impact:-1.12,physRiskExp:22.8,transRiskExp:41.5,carbonIntPct:36.2,sbtiPct:25.4,tempScore:3.12,nzbaProgress:18,greenBond:1.52,scope3Cat15:1180.0,dqsAvg:2.5,regCompliance:48.5},
};

const KPI_DEFS=[
  {id:'fe',label:'Financed Emissions',unit:'ktCO₂e',target:750,direction:'lower',format:v=>v.toFixed(1),module:'PCAF Financed Emissions'},
  {id:'waci',label:'WACI',unit:'tCO₂e/$M',target:150,direction:'lower',format:v=>v.toFixed(1),module:'Portfolio Analytics'},
  {id:'gar',label:'Green Asset Ratio',unit:'%',target:10,direction:'higher',format:v=>v.toFixed(1),module:'EU Taxonomy'},
  {id:'btar',label:'BTAR',unit:'%',target:15,direction:'higher',format:v=>v.toFixed(1),module:'Banking Book'},
  {id:'cet1Impact',label:'CET1 Climate Impact',unit:'pp',target:-2.0,direction:'higher',format:v=>v.toFixed(2),module:'Climate Stress Test'},
  {id:'physRiskExp',label:'Physical Risk Exposure',unit:'%',target:15,direction:'lower',format:v=>v.toFixed(1),module:'Physical Risk'},
  {id:'transRiskExp',label:'Transition Risk Exp.',unit:'%',target:30,direction:'lower',format:v=>v.toFixed(1),module:'Transition Risk'},
  {id:'carbonIntPct',label:'Carbon-Intensive Sectors',unit:'%',target:25,direction:'lower',format:v=>v.toFixed(1),module:'Sector Analysis'},
  {id:'sbtiPct',label:'SBTi Portfolio %',unit:'%',target:50,direction:'higher',format:v=>v.toFixed(1),module:'SBTi Tracker'},
  {id:'tempScore',label:'Temperature Score',unit:'°C',target:2.0,direction:'lower',format:v=>v.toFixed(2),module:'Temperature Alignment'},
  {id:'nzbaProgress',label:'NZBA Progress',unit:'%',target:100,direction:'higher',format:v=>v.toFixed(0),module:'NZBA Commitments'},
  {id:'greenBond',label:'Green Bond Issuance',unit:'£bn',target:5.0,direction:'higher',format:v=>v.toFixed(2),module:'Green Finance'},
  {id:'scope3Cat15',label:'Scope 3 Cat 15',unit:'ktCO₂e',target:600,direction:'lower',format:v=>v.toFixed(1),module:'PCAF Financed Emissions'},
  {id:'dqsAvg',label:'DQS Weighted Avg',unit:'/5',target:4.0,direction:'higher',format:v=>v.toFixed(1),module:'Data Quality'},
  {id:'regCompliance',label:'Regulatory Compliance',unit:'%',target:90,direction:'higher',format:v=>v.toFixed(1),module:'Regulatory Tracker'},
];

/* ── EBA Pillar 3 Templates ───────────────────────────────────────────────── */
const EBA_TEMPLATES=[
  {id:1,ref:'Template 1',title:'Banking Book — Scope 3 Financed Emissions',article:'CRR Art. 449a(1)(a)',description:'GHG financed emissions (Scope 1, 2, 3) by counterparty sector',status:'Complete',lastUpdated:'2024-11-15'},
  {id:2,ref:'Template 2',title:'Banking Book — Top 20 Carbon-Intensive Exposures',article:'CRR Art. 449a(1)(b)',description:'Largest 20 exposures to carbon-intensive counterparties',status:'Complete',lastUpdated:'2024-11-15'},
  {id:3,ref:'Template 3',title:'Banking Book — Physical Risk',article:'CRR Art. 449a(1)(c)',description:'Exposures subject to physical climate risk by geography and sector',status:'Complete',lastUpdated:'2024-11-15'},
  {id:4,ref:'Template 4',title:'Banking Book — Climate-Relevant Metrics',article:'CRR Art. 449a(1)(d)',description:'Maturity buckets and NACE sector exposures for banking book',status:'Complete',lastUpdated:'2024-11-15'},
  {id:5,ref:'Template 5',title:'Banking Book — NACE Sector Alignment',article:'CRR Art. 449a(2)',description:'EU Taxonomy alignment assessment by NACE sector',status:'In Progress',lastUpdated:'2024-10-30'},
  {id:6,ref:'Template 6',title:'Banking Book — Real Estate Exposures',article:'CRR Art. 449a(3)',description:'Energy efficiency of real estate collateral by EPC band',status:'Complete',lastUpdated:'2024-11-15'},
  {id:7,ref:'Template 7',title:'GAR — Green Asset Ratio',article:'CRR Art. 449a(4)',description:'Taxonomy-aligned assets as proportion of total assets',status:'Complete',lastUpdated:'2024-11-15'},
  {id:8,ref:'Template 8',title:'BTAR — Banking Book Taxonomy Alignment',article:'CRR Art. 449a(5)',description:'Taxonomy alignment of banking book exposures',status:'In Progress',lastUpdated:'2024-10-30'},
  {id:9,ref:'Template 9',title:'Trading Book — Equities',article:'CRR Art. 449a(6)',description:'Climate exposure metrics for equity trading book',status:'In Progress',lastUpdated:'2024-09-30'},
  {id:10,ref:'Template 10',title:'Fees & Commissions — Climate Services',article:'CRR Art. 449a(7)',description:'Income from climate-related advisory and underwriting',status:'Planned',lastUpdated:'2024-08-15'},
];

/* ── Generate Template 1 data: Scope 3 by sector ─────────────────────────── */
const genTemplate1=()=>{
  const sectors=['Oil & Gas','Electric Utilities','Steel & Metals','Chemicals','Cement','Transport','Agriculture','Real Estate','Mining','Automotive','Construction','Food & Beverage','Manufacturing','Telecoms','Technology','Healthcare','Financial Services','Retail','Aerospace','Shipping'];
  return sectors.map((s,i)=>{
    const seed=i*97+11;
    const exposure=range(200,8000,seed)*1e6;
    const scope1=range(50,2500,seed+1)*1e3;
    const scope2=range(10,800,seed+2)*1e3;
    const scope3=range(100,15000,seed+3)*1e3;
    const intensity=range(5,800,seed+4);
    const dqs=rangeInt(1,5,seed+5);
    return{sector:s,exposure,scope1,scope2,scope3,total:scope1+scope2+scope3,intensity,dqs,pctOfBook:0,aligned:range(0,45,seed+6)};
  });
};

/* ── Generate Template 2 data: Top 20 ─────────────────────────────────────── */
const genTemplate2=()=>{
  const names=['Shell plc','TotalEnergies','BP plc','ExxonMobil','Chevron','RWE AG','Enel SpA','ArcelorMittal','BASF SE','HeidelbergCement','Maersk','Glencore','Rio Tinto','BHP Group','Vale SA','Anglo American','CMA CGM','Heidelberg Materials','ThyssenKrupp','Holcim Group'];
  return names.map((n,i)=>{
    const seed=i*131+7;
    return{rank:i+1,name:n,sector:pick(['Oil & Gas','Utilities','Steel','Chemicals','Cement','Mining','Shipping'],seed),country:pick(['UK','NL','FR','US','DE','DK','CH','AU','BR','ZA'],seed+1),exposure:range(500,5000,seed+2)*1e6,scope1:range(5e6,100e6,seed+3),scope2:range(500e3,10e6,seed+4),intensity:range(100,800,seed+5),pct:range(0.5,4.5,seed+6),rating:pick(['A+','A','A-','BBB+','BBB','BBB-','BB+','BB'],seed+7)};
  });
};

/* ── Generate Template 3 data: Physical risk ──────────────────────────────── */
const genTemplate3=()=>{
  const regions=['Western Europe','Southern Europe','North America','Latin America','Sub-Saharan Africa','South Asia','East Asia','Southeast Asia','Middle East','Oceania'];
  return regions.map((r,i)=>{
    const seed=i*179+23;
    return{region:r,exposure:range(1000,15000,seed)*1e6,flood:range(0,40,seed+1),drought:range(0,35,seed+2),wildfire:range(0,25,seed+3),cyclone:range(0,30,seed+4),heatStress:range(0,45,seed+5),seaLevel:range(0,20,seed+6),totalPhysRisk:0,avgScore:range(1.2,4.5,seed+7)};
  }).map(r=>({...r,totalPhysRisk:r.flood+r.drought+r.wildfire+r.cyclone+r.heatStress+r.seaLevel}));
};

/* ── Generate Template 6 data: Real estate EPC ────────────────────────────── */
const genTemplate6=()=>{
  const bands=['A','B','C','D','E','F','G'];
  return bands.map((b,i)=>{
    const seed=i*211+31;
    const count=rangeInt(5,120,seed);
    const avgValue=range(2,80,seed+1)*1e6;
    return{band:b,count,totalValue:count*avgValue,avgLTV:range(0.45,0.80,seed+2),avgYield:range(0.04,0.08,seed+3),meesCompliant:i<=4,lgdHaircut:i<=1?0:i<=2?0.02:i<=3?0.05:i<=4?0.08:i<=5?0.15:0.22};
  });
};

/* ── Generate Template 7 data: GAR ────────────────────────────────────────── */
const genTemplate7=()=>{
  const objectives=['Climate Mitigation','Climate Adaptation','Water & Marine','Circular Economy','Pollution Prevention','Biodiversity'];
  return objectives.map((o,i)=>{
    const seed=i*157+41;
    return{objective:o,eligibleAssets:range(2000,25000,seed)*1e6,alignedAssets:range(200,8000,seed+1)*1e6,alignmentPct:0,transAssets:range(100,3000,seed+2)*1e6,enablingAssets:range(50,2000,seed+3)*1e6};
  }).map(o=>({...o,alignmentPct:o.alignedAssets/o.eligibleAssets*100}));
};

const TEMPLATE1_DATA=genTemplate1();
const TEMPLATE2_DATA=genTemplate2();
const TEMPLATE3_DATA=genTemplate3();
const TEMPLATE6_DATA=genTemplate6();
const TEMPLATE7_DATA=genTemplate7();

/* ── 25 Regulatory Items ──────────────────────────────────────────────────── */
const REGULATORY_ITEMS=[
  {id:1,regulator:'ECB',ref:'ECB Guide C&E Risks',area:'Credit Risk',requirement:'Integrate climate factors into credit risk assessment',deadline:'2024-12-31',status:'Implemented',compliance:92,owner:'CRO',priority:'Critical'},
  {id:2,regulator:'ECB',ref:'ECB SSM Expectations',area:'Governance',requirement:'Board oversight of climate risk with clear mandates',deadline:'2024-06-30',status:'Implemented',compliance:88,owner:'Board',priority:'Critical'},
  {id:3,regulator:'ECB',ref:'ECB Climate Stress Test',area:'Stress Testing',requirement:'Bottom-up climate stress test with NGFS scenarios',deadline:'2024-03-31',status:'Completed',compliance:95,owner:'Risk',priority:'Critical'},
  {id:4,regulator:'BoE',ref:'SS3/19',area:'Risk Management',requirement:'Embed climate risk across governance and strategy',deadline:'2025-06-30',status:'In Progress',compliance:75,owner:'CRO',priority:'High'},
  {id:5,regulator:'BoE',ref:'CBES',area:'Stress Testing',requirement:'Climate Biennial Exploratory Scenario participation',deadline:'2025-12-31',status:'In Progress',compliance:68,owner:'Risk',priority:'High'},
  {id:6,regulator:'EBA',ref:'GL/2020/06',area:'ESG Risk',requirement:'ESG factors in credit origination and monitoring',deadline:'2024-12-31',status:'Implemented',compliance:85,owner:'Credit',priority:'Critical'},
  {id:7,regulator:'EBA',ref:'ITS Pillar 3 ESG',area:'Disclosure',requirement:'10 ESG disclosure templates (CRR Art. 449a)',deadline:'2025-06-30',status:'In Progress',compliance:62,owner:'Finance',priority:'Critical'},
  {id:8,regulator:'EBA',ref:'GL ESG Risk Mgmt',area:'Risk Management',requirement:'ESG risk management guidelines implementation',deadline:'2025-12-31',status:'In Progress',compliance:55,owner:'CRO',priority:'High'},
  {id:9,regulator:'ECB',ref:'Fit-for-55 Assessment',area:'Strategy',requirement:'Impact assessment of EU Fit-for-55 package on portfolios',deadline:'2025-06-30',status:'In Progress',compliance:58,owner:'Strategy',priority:'Medium'},
  {id:10,regulator:'BCBS',ref:'Principles for C&E Risks',area:'Risk Management',requirement:'12 principles for management of climate-related financial risks',deadline:'2025-12-31',status:'In Progress',compliance:52,owner:'CRO',priority:'High'},
  {id:11,regulator:'Fed',ref:'SR 23-7',area:'Risk Management',requirement:'Climate-related financial risk guidance for large banks',deadline:'2025-12-31',status:'Planning',compliance:35,owner:'US Risk',priority:'Medium'},
  {id:12,regulator:'MAS',ref:'ENRM Guidelines',area:'Risk Management',requirement:'Environmental risk management for banks',deadline:'2024-06-30',status:'Implemented',compliance:82,owner:'APAC Risk',priority:'High'},
  {id:13,regulator:'APRA',ref:'CPG 229',area:'Climate Risk',requirement:'Climate vulnerability assessment for ADIs',deadline:'2025-06-30',status:'In Progress',compliance:65,owner:'APAC Risk',priority:'Medium'},
  {id:14,regulator:'HKMA',ref:'SPM Module GS-1',area:'Climate Risk',requirement:'Climate risk management supervisory expectations',deadline:'2024-12-31',status:'Implemented',compliance:78,owner:'APAC Risk',priority:'High'},
  {id:15,regulator:'ECB',ref:'CSRD Integration',area:'Disclosure',requirement:'Align with CSRD double materiality assessment',deadline:'2025-12-31',status:'In Progress',compliance:48,owner:'Sustainability',priority:'Medium'},
  {id:16,regulator:'EBA',ref:'CRR3 / Basel 3.1',area:'Capital',requirement:'Climate risk in Pillar 1 capital requirements',deadline:'2026-01-01',status:'Planning',compliance:25,owner:'Capital',priority:'High'},
  {id:17,regulator:'BoE',ref:'Climate BES 2025',area:'Stress Testing',requirement:'Second climate BES with enhanced physical risk',deadline:'2025-12-31',status:'Planning',compliance:30,owner:'Risk',priority:'High'},
  {id:18,regulator:'ECB',ref:'C&E Risk Dashboard',area:'Monitoring',requirement:'Supervisory climate risk dashboard submissions',deadline:'Ongoing',status:'Operational',compliance:85,owner:'Risk',priority:'Medium'},
  {id:19,regulator:'EBA',ref:'ESG Benchmarks ITS',area:'Disclosure',requirement:'Benchmarking of ESG risk metrics across EU banks',deadline:'2025-06-30',status:'In Progress',compliance:60,owner:'Finance',priority:'Medium'},
  {id:20,regulator:'ISSB',ref:'IFRS S1/S2',area:'Disclosure',requirement:'Climate-related disclosures under ISSB standards',deadline:'2025-01-01',status:'In Progress',compliance:70,owner:'Finance',priority:'High'},
  {id:21,regulator:'TCFD',ref:'TCFD Recommendations',area:'Disclosure',requirement:'Full TCFD-aligned climate risk disclosures',deadline:'2024-06-30',status:'Implemented',compliance:90,owner:'Finance',priority:'Critical'},
  {id:22,regulator:'EU',ref:'EU Taxonomy',area:'Taxonomy',requirement:'Taxonomy alignment reporting for banking book',deadline:'2024-12-31',status:'Implemented',compliance:75,owner:'Finance',priority:'Critical'},
  {id:23,regulator:'ECB',ref:'Transition Plan Guidance',area:'Strategy',requirement:'Credible transition plan with interim targets',deadline:'2025-12-31',status:'In Progress',compliance:45,owner:'Strategy',priority:'High'},
  {id:24,regulator:'BoE',ref:'CP16/22',area:'Disclosure',requirement:'TCFD-aligned climate disclosures for UK banks',deadline:'2024-06-30',status:'Implemented',compliance:88,owner:'Finance',priority:'High'},
  {id:25,regulator:'NGFS',ref:'NGFS Guide Phase IV',area:'Scenario Analysis',requirement:'Adoption of NGFS Phase IV scenarios in stress testing',deadline:'2025-06-30',status:'In Progress',compliance:72,owner:'Risk',priority:'Medium'},
];

/* ── 20 Peer Banks ────────────────────────────────────────────────────────── */
const PEER_BANKS=[
  {name:'HSBC Holdings',country:'UK',gar:8.2,fe:920,waci:195,tempScore:2.8,cet1Impact:-1.9,sbtiPct:38,nzba:true,greenBond:3.2,dqs:3.0,physRisk:20},
  {name:'Barclays plc',country:'UK',gar:6.5,fe:1050,waci:220,tempScore:3.0,cet1Impact:-2.2,sbtiPct:32,nzba:true,greenBond:2.1,dqs:2.8,physRisk:18},
  {name:'Standard Chartered',country:'UK',gar:5.8,fe:880,waci:188,tempScore:2.9,cet1Impact:-1.7,sbtiPct:35,nzba:true,greenBond:1.8,dqs:2.9,physRisk:25},
  {name:'Lloyds Banking',country:'UK',gar:7.1,fe:760,waci:172,tempScore:2.6,cet1Impact:-1.5,sbtiPct:44,nzba:true,greenBond:2.5,dqs:3.2,physRisk:15},
  {name:'NatWest Group',country:'UK',gar:9.4,fe:640,waci:148,tempScore:2.4,cet1Impact:-1.2,sbtiPct:48,nzba:true,greenBond:3.8,dqs:3.5,physRisk:12},
  {name:'Deutsche Bank',country:'DE',gar:5.2,fe:1180,waci:245,tempScore:3.1,cet1Impact:-2.5,sbtiPct:28,nzba:true,greenBond:2.0,dqs:2.6,physRisk:16},
  {name:'BNP Paribas',country:'FR',gar:7.8,fe:980,waci:208,tempScore:2.7,cet1Impact:-2.0,sbtiPct:40,nzba:true,greenBond:4.2,dqs:3.1,physRisk:19},
  {name:'Societe Generale',country:'FR',gar:6.9,fe:890,waci:198,tempScore:2.8,cet1Impact:-1.8,sbtiPct:36,nzba:true,greenBond:2.8,dqs:2.9,physRisk:21},
  {name:'ING Group',country:'NL',gar:10.2,fe:550,waci:132,tempScore:2.3,cet1Impact:-1.0,sbtiPct:52,nzba:true,greenBond:5.1,dqs:3.8,physRisk:14},
  {name:'UBS Group',country:'CH',gar:6.1,fe:720,waci:165,tempScore:2.5,cet1Impact:-1.4,sbtiPct:42,nzba:true,greenBond:3.0,dqs:3.3,physRisk:10},
  {name:'Credit Suisse',country:'CH',gar:4.8,fe:1020,waci:228,tempScore:3.0,cet1Impact:-2.1,sbtiPct:25,nzba:false,greenBond:1.5,dqs:2.4,physRisk:11},
  {name:'Rabobank',country:'NL',gar:8.8,fe:680,waci:158,tempScore:2.5,cet1Impact:-1.3,sbtiPct:46,nzba:true,greenBond:2.9,dqs:3.4,physRisk:17},
  {name:'Nordea Bank',country:'FI',gar:9.1,fe:580,waci:138,tempScore:2.3,cet1Impact:-1.1,sbtiPct:50,nzba:true,greenBond:3.5,dqs:3.6,physRisk:8},
  {name:'Danske Bank',country:'DK',gar:8.5,fe:620,waci:145,tempScore:2.4,cet1Impact:-1.2,sbtiPct:47,nzba:true,greenBond:2.4,dqs:3.3,physRisk:9},
  {name:'UniCredit',country:'IT',gar:6.4,fe:950,waci:210,tempScore:2.8,cet1Impact:-1.9,sbtiPct:33,nzba:true,greenBond:2.2,dqs:2.7,physRisk:22},
  {name:'Santander',country:'ES',gar:6.8,fe:870,waci:195,tempScore:2.7,cet1Impact:-1.7,sbtiPct:37,nzba:true,greenBond:3.1,dqs:2.8,physRisk:20},
  {name:'ABN AMRO',country:'NL',gar:9.8,fe:490,waci:118,tempScore:2.2,cet1Impact:-0.9,sbtiPct:55,nzba:true,greenBond:4.5,dqs:3.7,physRisk:13},
  {name:'Commerzbank',country:'DE',gar:5.5,fe:1080,waci:232,tempScore:3.0,cet1Impact:-2.3,sbtiPct:30,nzba:true,greenBond:1.8,dqs:2.5,physRisk:15},
  {name:'Intesa Sanpaolo',country:'IT',gar:7.0,fe:820,waci:185,tempScore:2.6,cet1Impact:-1.6,sbtiPct:39,nzba:true,greenBond:2.6,dqs:2.9,physRisk:23},
  {name:'KBC Group',country:'BE',gar:8.0,fe:710,waci:162,tempScore:2.5,cet1Impact:-1.3,sbtiPct:43,nzba:true,greenBond:2.3,dqs:3.2,physRisk:16},
];

/* ── NZBA Sector Targets ──────────────────────────────────────────────────── */
const NZBA_SECTORS=[
  {sector:'Oil & Gas',unit:'gCO₂e/MJ',baseline:68,target2030:48,current:58,progress:42,clients:35,engagements:28,highRisk:12},
  {sector:'Power Generation',unit:'kgCO₂/MWh',baseline:420,target2030:180,current:310,progress:46,clients:42,engagements:38,highRisk:8},
  {sector:'Steel',unit:'tCO₂/t steel',baseline:1.85,target2030:1.20,current:1.55,progress:46,clients:18,engagements:15,highRisk:6},
  {sector:'Cement',unit:'kgCO₂/t cement',baseline:620,target2030:430,current:540,progress:42,clients:12,engagements:10,highRisk:5},
  {sector:'Transport — Aviation',unit:'gCO₂/pkm',baseline:95,target2030:72,current:82,progress:57,clients:15,engagements:12,highRisk:4},
  {sector:'Transport — Shipping',unit:'gCO₂/t-nm',baseline:11.2,target2030:7.8,current:9.5,progress:50,clients:22,engagements:18,highRisk:7},
  {sector:'Real Estate — Commercial',unit:'kgCO₂/m²',baseline:85,target2030:55,current:68,progress:57,clients:48,engagements:35,highRisk:15},
  {sector:'Agriculture',unit:'tCO₂e/ha',baseline:4.2,target2030:2.8,current:3.5,progress:50,clients:25,engagements:18,highRisk:9},
  {sector:'Coal Mining',unit:'tCO₂/t coal',baseline:0.45,target2030:0,current:0.32,progress:29,clients:8,engagements:8,highRisk:8},
  {sector:'Aluminium',unit:'tCO₂/t Al',baseline:12.5,target2030:8.0,current:10.2,progress:51,clients:10,engagements:8,highRisk:3},
];

/* ── Risk Appetite Metrics ────────────────────────────────────────────────── */
const RISK_APPETITE_METRICS=[
  {id:1,metric:'Financed Emissions (Scope 1+2)',unit:'ktCO₂e',value:812,limit:900,warning:850,trend:'down',board:'2024-Q2'},
  {id:2,metric:'Portfolio Temperature Score',unit:'°C',value:2.64,limit:3.0,warning:2.8,trend:'down',board:'2024-Q2'},
  {id:3,metric:'Green Asset Ratio',unit:'%',value:7.8,limit:5.0,warning:6.0,trend:'up',board:'2024-Q2'},
  {id:4,metric:'CET1 Climate Impact (Stress)',unit:'pp',value:-1.92,limit:-3.0,warning:-2.5,trend:'improving',board:'2024-Q2'},
  {id:5,metric:'Physical Risk Concentration',unit:'%',value:18.5,limit:25,warning:22,trend:'down',board:'2024-Q2'},
  {id:6,metric:'Transition Risk Concentration',unit:'%',value:34.2,limit:40,warning:38,trend:'down',board:'2024-Q2'},
  {id:7,metric:'Carbon-Intensive Sector Share',unit:'%',value:28.1,limit:35,warning:32,trend:'down',board:'2024-Q2'},
  {id:8,metric:'SBTi-Aligned Portfolio',unit:'%',value:42.5,limit:30,warning:35,trend:'up',board:'2024-Q2'},
  {id:9,metric:'Climate ECL Overlay',unit:'£M',value:438,limit:600,warning:500,trend:'up',board:'2024-Q2'},
  {id:10,metric:'Stranded Assets Exposure',unit:'£bn',value:1.84,limit:2.5,warning:2.2,trend:'down',board:'2024-Q2'},
  {id:11,metric:'NZBA Alignment Progress',unit:'%',value:38,limit:25,warning:30,trend:'up',board:'2024-Q2'},
  {id:12,metric:'Data Quality Score (DQS)',unit:'/5',value:3.2,limit:2.5,warning:2.8,trend:'up',board:'2024-Q2'},
  {id:13,metric:'Coal Exposure Phase-Out',unit:'£M',value:320,limit:500,warning:400,trend:'down',board:'2024-Q2'},
  {id:14,metric:'Green Bond Pipeline',unit:'£bn',value:2.85,limit:2.0,warning:2.2,trend:'up',board:'2024-Q2'},
  {id:15,metric:'Regulatory Compliance Score',unit:'%',value:76.8,limit:60,warning:70,trend:'up',board:'2024-Q2'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
 * STYLES
 * ═══════════════════════════════════════════════════════════════════════════════ */
const S={
  page:{background:T.bg,minHeight:'100vh',fontFamily:T.font,color:T.text,padding:0,margin:0},
  header:{background:T.navy,padding:'20px 32px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  headerTitle:{color:'#fff',fontSize:20,fontWeight:700,margin:0,letterSpacing:'-0.3px'},
  headerSub:{color:T.goldL,fontSize:12,fontFamily:T.mono,marginTop:2},
  badge:{background:'rgba(197,169,106,0.15)',color:T.gold,fontSize:10,fontFamily:T.mono,padding:'3px 8px',borderRadius:4,fontWeight:600},
  tabBar:{display:'flex',gap:0,background:T.surface,borderBottom:`2px solid ${T.border}`,padding:'0 24px',overflowX:'auto'},
  tab:{padding:'12px 18px',cursor:'pointer',fontSize:13,fontWeight:500,color:T.textSec,borderBottom:'2px solid transparent',transition:'all 0.15s',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6},
  tabActive:{color:T.navy,borderBottom:`2px solid ${T.gold}`,fontWeight:700},
  content:{padding:'24px 32px',maxWidth:1600,margin:'0 auto'},
  card:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:20,marginBottom:20},
  cardTitle:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:4},
  cardSub:{fontSize:11,color:T.textMut,fontFamily:T.mono,marginBottom:16},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16},
  grid5:{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12},
  kpi:{background:T.surface,borderRadius:8,border:`1px solid ${T.border}`,padding:'16px 20px',textAlign:'center'},
  kpiValue:{fontSize:22,fontWeight:800,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textSec,marginTop:4},
  kpiSub:{fontSize:10,color:T.textMut,fontFamily:T.mono,marginTop:2},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{padding:'10px 12px',textAlign:'left',fontWeight:700,fontSize:11,color:T.textSec,borderBottom:`2px solid ${T.border}`,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.5px',position:'sticky',top:0,background:T.surface,whiteSpace:'nowrap'},
  td:{padding:'8px 12px',borderBottom:`1px solid ${T.border}`,fontSize:12,whiteSpace:'nowrap'},
  select:{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,cursor:'pointer'},
  btn:{padding:'8px 16px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.15s'},
  btnPrimary:{background:T.navy,color:'#fff'},
  btnGold:{background:T.gold,color:'#fff'},
  btnOutline:{background:'transparent',border:`1px solid ${T.border}`,color:T.text},
  tag:(color)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,fontFamily:T.mono,background:`${color}18`,color}),
  cite:{fontSize:10,color:T.textMut,fontFamily:T.mono,fontStyle:'italic',marginTop:8,display:'block'},
  scrollTable:{overflowX:'auto',overflowY:'auto',maxHeight:520},
  filterBar:{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16,alignItems:'center'},
  pillActive:{background:T.navy,color:'#fff',padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',border:'none'},
  pill:{background:T.surfaceH,color:T.textSec,padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:500,cursor:'pointer',border:`1px solid ${T.border}`},
  heatCell:(v,max=5)=>{const pct=v/max;const r=Math.round(220-pct*180);const g=Math.round(220-pct*40);return{background:`rgb(${r},${g},${Math.round(220-pct*100)})`,color:pct>0.6?'#fff':T.text,padding:'6px 10px',textAlign:'center',fontSize:11,fontWeight:600,fontFamily:T.mono};},
  trafficLight:(value,warning,limit,direction='lower')=>{
    if(direction==='lower'){
      if(value<=limit)return T.green;if(value<=warning)return T.amber;return T.red;
    }else{
      if(value>=limit)return T.green;if(value>=warning)return T.amber;return T.red;
    }
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 1: BOARD DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════ */
const BoardDashboardTab=()=>{
  const [period,setPeriod]=useState('Q4 2024');
  const [viewMode,setViewMode]=useState('tiles');
  const data=KPI_BY_PERIOD[period]||KPI_BY_PERIOD['Q4 2024'];
  const prevData=KPI_BY_PERIOD[PERIODS[PERIODS.indexOf(period)+1]]||data;

  const trendData=useMemo(()=>PERIODS.slice().reverse().map(p=>{
    const d=KPI_BY_PERIOD[p];
    return{period:p,fe:d.fe,gar:d.gar,tempScore:d.tempScore,cet1Impact:d.cet1Impact,sbtiPct:d.sbtiPct,regCompliance:d.regCompliance};
  }),[]);

  return(
    <div>
      {/* Period Selector */}
      <div style={{...S.filterBar,marginBottom:20}}>
        <span style={{fontSize:11,fontWeight:600,color:T.textSec}}>Reporting Period:</span>
        {PERIODS.map(p=>(
          <button key={p} style={period===p?S.pillActive:S.pill} onClick={()=>setPeriod(p)}>{p}</button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button style={viewMode==='tiles'?S.pillActive:S.pill} onClick={()=>setViewMode('tiles')}>Tile View</button>
          <button style={viewMode==='table'?S.pillActive:S.pill} onClick={()=>setViewMode('table')}>Board Pack</button>
        </div>
      </div>

      {/* 15 KPI Tiles */}
      {viewMode==='tiles'?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
          {KPI_DEFS.map(kpi=>{
            const value=data[kpi.id];
            const prev=prevData[kpi.id];
            const delta=value-prev;
            const improving=kpi.direction==='lower'?delta<0:delta>0;
            const atTarget=kpi.direction==='lower'?value<=kpi.target:value>=kpi.target;
            const nearTarget=kpi.direction==='lower'?value<=kpi.target*1.15:value>=kpi.target*0.85;
            const statusColor=atTarget?T.green:nearTarget?T.amber:T.red;
            return(
              <div key={kpi.id} style={{...S.kpi,borderLeft:`3px solid ${statusColor}`}}>
                <div style={{fontSize:10,color:T.textMut,marginBottom:4,textAlign:'left'}}>{kpi.label}</div>
                <div style={{fontSize:20,fontWeight:800,color:T.navy,fontFamily:T.mono,textAlign:'left'}}>{kpi.format(value)}<span style={{fontSize:11,fontWeight:400,color:T.textMut}}> {kpi.unit}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
                  <span style={{fontSize:10,color:improving?T.green:T.red,fontFamily:T.mono}}>
                    {improving?'▼':'▲'} {Math.abs(delta).toFixed(1)} {kpi.direction==='lower'&&improving?'':''}
                  </span>
                  <span style={{fontSize:9,color:T.textMut}}>Target: {kpi.target} {kpi.unit}</span>
                </div>
                <div style={{height:4,borderRadius:2,background:T.surfaceH,marginTop:6,overflow:'hidden'}}>
                  <div style={{width:`${Math.min(100,kpi.direction==='lower'?(kpi.target/value)*100:(value/kpi.target)*100)}%`,height:'100%',borderRadius:2,background:statusColor}}/>
                </div>
              </div>
            );
          })}
        </div>
      ):(
        /* Board Pack Table View */
        <div style={{...S.card,padding:0}}>
          <div style={{padding:'16px 20px 0'}}>
            <div style={S.cardTitle}>Board Climate Risk Dashboard — {period}</div>
            <div style={S.cardSub}>15 key performance indicators with trend and target assessment</div>
          </div>
          <div style={S.scrollTable}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>KPI</th><th style={S.th}>Current</th><th style={S.th}>Previous</th>
                  <th style={S.th}>Change</th><th style={S.th}>Target</th><th style={S.th}>Status</th><th style={S.th}>Module</th>
                </tr>
              </thead>
              <tbody>
                {KPI_DEFS.map(kpi=>{
                  const value=data[kpi.id];const prev=prevData[kpi.id];const delta=value-prev;
                  const improving=kpi.direction==='lower'?delta<0:delta>0;
                  const atTarget=kpi.direction==='lower'?value<=kpi.target:value>=kpi.target;
                  return(
                    <tr key={kpi.id}>
                      <td style={{...S.td,fontWeight:600}}>{kpi.label}</td>
                      <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{kpi.format(value)} {kpi.unit}</td>
                      <td style={{...S.td,fontFamily:T.mono,color:T.textMut}}>{kpi.format(prev)} {kpi.unit}</td>
                      <td style={{...S.td,fontFamily:T.mono,color:improving?T.green:T.red}}>{delta>0?'+':''}{delta.toFixed(1)}</td>
                      <td style={{...S.td,fontFamily:T.mono}}>{kpi.target} {kpi.unit}</td>
                      <td style={S.td}><span style={S.tag(atTarget?T.green:T.amber)}>{atTarget?'On Track':'Gap'}</span></td>
                      <td style={{...S.td,fontSize:10,color:T.textMut}}>{kpi.module}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trend Charts */}
      <div style={S.grid3}>
        <div style={S.card}>
          <div style={S.cardTitle}>Financed Emissions Trend</div>
          <div style={S.cardSub}>ktCO₂e · Target: 750</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <XAxis dataKey="period" tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}}/>
              <Tooltip/>
              <ReferenceLine y={750} stroke={T.green} strokeDasharray="5 5" label={{value:'Target',fontSize:9,fill:T.green}}/>
              <Area type="monotone" dataKey="fe" stroke={T.navy} fill={T.navy} fillOpacity={0.1}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Temperature Score Trend</div>
          <div style={S.cardSub}>°C · Target: 2.0°C</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <XAxis dataKey="period" tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} domain={[2,3.5]}/>
              <Tooltip/>
              <ReferenceLine y={2.0} stroke={T.green} strokeDasharray="5 5" label={{value:'2.0°C',fontSize:9,fill:T.green}}/>
              <Area type="monotone" dataKey="tempScore" stroke={T.red} fill={T.red} fillOpacity={0.1}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>GAR & SBTi Progress</div>
          <div style={S.cardSub}>Green Asset Ratio (%) + SBTi portfolio (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={trendData}>
              <XAxis dataKey="period" tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="gar" name="GAR %" fill={T.sage} radius={[4,4,0,0]}/>
              <Line type="monotone" dataKey="sbtiPct" name="SBTi %" stroke={T.gold} strokeWidth={2}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 2: EBA PILLAR 3 TEMPLATES
 * ═══════════════════════════════════════════════════════════════════════════════ */
const Pillar3Tab=()=>{
  const [activeTemplate,setActiveTemplate]=useState(1);

  const totalFE=TEMPLATE1_DATA.reduce((s,r)=>s+r.total,0);
  const t1WithPct=TEMPLATE1_DATA.map(r=>({...r,pctOfBook:r.exposure/(TEMPLATE1_DATA.reduce((s,x)=>s+x.exposure,0))*100}));

  return(
    <div>
      {/* Template Selector */}
      <div style={S.card}>
        <div style={S.cardTitle}>EBA ITS Pillar 3 ESG Disclosure Templates</div>
        <div style={S.cardSub}>CRR Art. 449a — 10 mandatory ESG disclosure templates</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
          {EBA_TEMPLATES.map(t=>(
            <div key={t.id} style={{padding:10,borderRadius:6,cursor:'pointer',border:`2px solid ${activeTemplate===t.id?T.gold:T.border}`,background:activeTemplate===t.id?`${T.gold}08`:T.surface}} onClick={()=>setActiveTemplate(t.id)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:10,fontWeight:700,color:T.navy}}>{t.ref}</span>
                <span style={S.tag(t.status==='Complete'?T.green:t.status==='In Progress'?T.amber:T.red)}>{t.status}</span>
              </div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{t.title.substring(0,40)}...</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Template Content */}
      {activeTemplate===1&&(
        <div style={S.card}>
          <div style={S.cardTitle}>Template 1: Banking Book — Scope 3 Financed Emissions by Sector</div>
          <div style={S.cardSub}>CRR Art. 449a(1)(a) · Total financed emissions: {fmt(totalFE,0)} tCO₂e</div>
          <div style={S.scrollTable}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Sector</th><th style={S.th}>Exposure (£M)</th><th style={S.th}>% Book</th>
                  <th style={S.th}>Scope 1 (tCO₂e)</th><th style={S.th}>Scope 2 (tCO₂e)</th><th style={S.th}>Scope 3 (tCO₂e)</th>
                  <th style={S.th}>Total (tCO₂e)</th><th style={S.th}>Intensity</th><th style={S.th}>DQS</th><th style={S.th}>Aligned %</th>
                </tr>
              </thead>
              <tbody>
                {[...t1WithPct].sort((a,b)=>b.total-a.total).map((r,i)=>(
                  <tr key={i}>
                    <td style={{...S.td,fontWeight:600}}>{r.sector}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{(r.exposure/1e6).toFixed(0)}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{r.pctOfBook.toFixed(1)}%</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{fmt(r.scope1,0)}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{fmt(r.scope2,0)}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{fmt(r.scope3,0)}</td>
                    <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{fmt(r.total,0)}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{r.intensity.toFixed(0)}</td>
                    <td style={S.td}><span style={S.tag(r.dqs>=4?T.green:r.dqs>=3?T.amber:T.red)}>{r.dqs}/5</span></td>
                    <td style={{...S.td,fontFamily:T.mono}}>{r.aligned.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span style={S.cite}>Ref: EBA ITS on Pillar 3 ESG Disclosures, CRR Art. 449a — Template 1: GHG emissions (Scope 1, 2, 3)</span>
        </div>
      )}

      {activeTemplate===2&&(
        <div style={S.card}>
          <div style={S.cardTitle}>Template 2: Top 20 Carbon-Intensive Exposures</div>
          <div style={S.cardSub}>CRR Art. 449a(1)(b) · 20 largest carbon-intensive counterparties</div>
          <div style={S.scrollTable}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th><th style={S.th}>Counterparty</th><th style={S.th}>Sector</th><th style={S.th}>Country</th>
                  <th style={S.th}>Exposure (£M)</th><th style={S.th}>% Book</th><th style={S.th}>Scope 1 (tCO₂e)</th>
                  <th style={S.th}>Scope 2 (tCO₂e)</th><th style={S.th}>Intensity</th><th style={S.th}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {TEMPLATE2_DATA.map(r=>(
                  <tr key={r.rank}>
                    <td style={{...S.td,fontFamily:T.mono}}>{r.rank}</td>
                    <td style={{...S.td,fontWeight:600}}>{r.name}</td>
                    <td style={S.td}>{r.sector}</td>
                    <td style={S.td}>{r.country}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{(r.exposure/1e6).toFixed(0)}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{r.pct.toFixed(1)}%</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{fmt(r.scope1,0)}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{fmt(r.scope2,0)}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{r.intensity.toFixed(0)}</td>
                    <td style={S.td}><span style={S.tag(T.navyL)}>{r.rating}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span style={S.cite}>Ref: EBA ITS on Pillar 3 ESG, CRR Art. 449a(1)(b) — Template 2: Top 20 carbon-intensive</span>
        </div>
      )}

      {activeTemplate===3&&(
        <div style={S.card}>
          <div style={S.cardTitle}>Template 3: Banking Book — Physical Risk by Geography</div>
          <div style={S.cardSub}>CRR Art. 449a(1)(c) · Exposure to chronic & acute physical hazards</div>
          <div style={S.scrollTable}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Region</th><th style={S.th}>Exposure (£M)</th><th style={S.th}>Flood %</th>
                  <th style={S.th}>Drought %</th><th style={S.th}>Wildfire %</th><th style={S.th}>Cyclone %</th>
                  <th style={S.th}>Heat %</th><th style={S.th}>Sea Level %</th><th style={S.th}>Total Phys %</th><th style={S.th}>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {[...TEMPLATE3_DATA].sort((a,b)=>b.avgScore-a.avgScore).map((r,i)=>(
                  <tr key={i}>
                    <td style={{...S.td,fontWeight:600}}>{r.region}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{(r.exposure/1e6).toFixed(0)}</td>
                    <td style={{...S.td,...S.heatCell(r.flood,40)}}>{r.flood.toFixed(1)}</td>
                    <td style={{...S.td,...S.heatCell(r.drought,35)}}>{r.drought.toFixed(1)}</td>
                    <td style={{...S.td,...S.heatCell(r.wildfire,25)}}>{r.wildfire.toFixed(1)}</td>
                    <td style={{...S.td,...S.heatCell(r.cyclone,30)}}>{r.cyclone.toFixed(1)}</td>
                    <td style={{...S.td,...S.heatCell(r.heatStress,45)}}>{r.heatStress.toFixed(1)}</td>
                    <td style={{...S.td,...S.heatCell(r.seaLevel,20)}}>{r.seaLevel.toFixed(1)}</td>
                    <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{r.totalPhysRisk.toFixed(1)}</td>
                    <td style={{...S.td,...S.heatCell(r.avgScore)}}>{r.avgScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span style={S.cite}>Ref: EBA ITS on Pillar 3 ESG, CRR Art. 449a(1)(c) — Template 3: Physical risk exposures</span>
        </div>
      )}

      {activeTemplate===6&&(
        <div style={S.card}>
          <div style={S.cardTitle}>Template 6: Real Estate Exposures by EPC Band</div>
          <div style={S.cardSub}>CRR Art. 449a(3) · Energy efficiency of CRE collateral</div>
          <div style={S.scrollTable}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>EPC Band</th><th style={S.th}>Properties</th><th style={S.th}>Total Value (£M)</th>
                  <th style={S.th}>Avg LTV</th><th style={S.th}>Avg Yield</th><th style={S.th}>MEES Compliant</th><th style={S.th}>LGD Haircut</th>
                </tr>
              </thead>
              <tbody>
                {TEMPLATE6_DATA.map(r=>(
                  <tr key={r.band}>
                    <td style={S.td}><span style={S.tag(r.band<='C'?T.green:r.band<='E'?T.amber:T.red)}>{r.band}</span></td>
                    <td style={{...S.td,fontFamily:T.mono}}>{r.count}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{(r.totalValue/1e6).toFixed(0)}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{(r.avgLTV*100).toFixed(0)}%</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{(r.avgYield*100).toFixed(1)}%</td>
                    <td style={S.td}><span style={S.tag(r.meesCompliant?T.green:T.red)}>{r.meesCompliant?'Yes':'No'}</span></td>
                    <td style={{...S.td,fontFamily:T.mono,color:r.lgdHaircut>0?T.red:T.green}}>+{(r.lgdHaircut*100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span style={S.cite}>Ref: EBA ITS on Pillar 3 ESG, CRR Art. 449a(3) — Template 6: Real estate EPC distribution</span>
        </div>
      )}

      {activeTemplate===7&&(
        <div style={S.card}>
          <div style={S.cardTitle}>Template 7: Green Asset Ratio (GAR)</div>
          <div style={S.cardSub}>CRR Art. 449a(4) · Taxonomy-aligned assets by environmental objective</div>
          <div style={S.scrollTable}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Env. Objective</th><th style={S.th}>Eligible (£M)</th><th style={S.th}>Aligned (£M)</th>
                  <th style={S.th}>Alignment %</th><th style={S.th}>Transitional (£M)</th><th style={S.th}>Enabling (£M)</th>
                </tr>
              </thead>
              <tbody>
                {TEMPLATE7_DATA.map((r,i)=>(
                  <tr key={i}>
                    <td style={{...S.td,fontWeight:600}}>{r.objective}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{(r.eligibleAssets/1e6).toFixed(0)}</td>
                    <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{(r.alignedAssets/1e6).toFixed(0)}</td>
                    <td style={{...S.td,fontFamily:T.mono,color:r.alignmentPct>20?T.green:T.amber}}>{r.alignmentPct.toFixed(1)}%</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{(r.transAssets/1e6).toFixed(0)}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{(r.enablingAssets/1e6).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span style={S.cite}>Ref: EBA ITS on Pillar 3 ESG, CRR Art. 449a(4) — Template 7: Green Asset Ratio (GAR)</span>
        </div>
      )}

      {/* For templates 4,5,8,9,10 — show placeholder with metadata */}
      {[4,5,8,9,10].includes(activeTemplate)&&(
        <div style={S.card}>
          <div style={S.cardTitle}>{EBA_TEMPLATES.find(t=>t.id===activeTemplate)?.title}</div>
          <div style={S.cardSub}>{EBA_TEMPLATES.find(t=>t.id===activeTemplate)?.article} · {EBA_TEMPLATES.find(t=>t.id===activeTemplate)?.description}</div>
          <div style={{padding:24,textAlign:'center',background:T.surfaceH,borderRadius:8}}>
            <div style={{fontSize:13,fontWeight:600,color:T.textSec}}>Template {activeTemplate} — {EBA_TEMPLATES.find(t=>t.id===activeTemplate)?.status}</div>
            <div style={{fontSize:11,color:T.textMut,marginTop:8}}>Last updated: {EBA_TEMPLATES.find(t=>t.id===activeTemplate)?.lastUpdated}</div>
            <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Data populated from banking book and PCAF calculations</div>
          </div>
          <span style={S.cite}>Ref: EBA ITS on Pillar 3 ESG Disclosures, {EBA_TEMPLATES.find(t=>t.id===activeTemplate)?.article}</span>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 3: REGULATORY TRACKER
 * ═══════════════════════════════════════════════════════════════════════════════ */
const RegulatoryTrackerTab=()=>{
  const [viewMode,setViewMode]=useState('table');
  const [regulatorFilter,setRegulatorFilter]=useState('All');
  const [statusFilter,setStatusFilter]=useState('All');

  const regulators=[...new Set(REGULATORY_ITEMS.map(r=>r.regulator))];
  const statuses=[...new Set(REGULATORY_ITEMS.map(r=>r.status))];

  const filtered=useMemo(()=>{
    let d=[...REGULATORY_ITEMS];
    if(regulatorFilter!=='All')d=d.filter(r=>r.regulator===regulatorFilter);
    if(statusFilter!=='All')d=d.filter(r=>r.status===statusFilter);
    return d;
  },[regulatorFilter,statusFilter]);

  const avgCompliance=filtered.length?filtered.reduce((s,r)=>s+r.compliance,0)/filtered.length:0;
  const byStatus=useMemo(()=>{
    const map={};
    filtered.forEach(r=>{map[r.status]=(map[r.status]||0)+1;});
    return Object.entries(map).map(([status,count])=>({status,count}));
  },[filtered]);

  const kanbanCols=[
    {title:'Completed',status:['Completed','Implemented','Operational'],color:T.green},
    {title:'In Progress',status:['In Progress'],color:T.amber},
    {title:'Planning',status:['Planning'],color:T.red},
  ];

  return(
    <div>
      {/* KPIs */}
      <div style={S.grid4}>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:avgCompliance>70?T.green:T.amber}}>{avgCompliance.toFixed(1)}%</div>
          <div style={S.kpiLabel}>Average Compliance</div>
          <div style={S.kpiSub}>{filtered.length} items tracked</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.green}}>{filtered.filter(r=>['Completed','Implemented','Operational'].includes(r.status)).length}</div>
          <div style={S.kpiLabel}>Completed</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.amber}}>{filtered.filter(r=>r.status==='In Progress').length}</div>
          <div style={S.kpiLabel}>In Progress</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>{filtered.filter(r=>r.status==='Planning').length}</div>
          <div style={S.kpiLabel}>Planning</div>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div style={S.filterBar}>
        <select style={S.select} value={regulatorFilter} onChange={e=>setRegulatorFilter(e.target.value)}>
          <option value="All">All Regulators</option>
          {regulators.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select style={S.select} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          {statuses.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          {['table','kanban','timeline'].map(v=>(
            <button key={v} style={viewMode===v?S.pillActive:S.pill} onClick={()=>setViewMode(v)}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
          ))}
        </div>
      </div>

      {viewMode==='table'&&(
        <div style={S.card}>
          <div style={S.cardTitle}>Regulatory Requirements — {filtered.length} Items</div>
          <div style={S.cardSub}>Cross-jurisdictional climate risk regulatory tracker</div>
          <div style={S.scrollTable}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Regulator</th><th style={S.th}>Reference</th><th style={S.th}>Area</th>
                  <th style={S.th}>Requirement</th><th style={S.th}>Deadline</th><th style={S.th}>Owner</th>
                  <th style={S.th}>Priority</th><th style={S.th}>Status</th><th style={{...S.th,width:80}}>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r=>(
                  <tr key={r.id}>
                    <td style={S.td}><span style={S.tag(T.navyL)}>{r.regulator}</span></td>
                    <td style={{...S.td,fontWeight:600,fontSize:11}}>{r.ref}</td>
                    <td style={S.td}>{r.area}</td>
                    <td style={{...S.td,maxWidth:280}}>{r.requirement}</td>
                    <td style={{...S.td,fontFamily:T.mono,fontSize:10}}>{r.deadline}</td>
                    <td style={S.td}>{r.owner}</td>
                    <td style={S.td}><span style={S.tag(r.priority==='Critical'?T.red:r.priority==='High'?T.amber:T.sage)}>{r.priority}</span></td>
                    <td style={S.td}><span style={S.tag(['Completed','Implemented','Operational'].includes(r.status)?T.green:r.status==='In Progress'?T.amber:T.red)}>{r.status}</span></td>
                    <td style={S.td}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <div style={{flex:1,height:6,borderRadius:3,background:T.surfaceH,overflow:'hidden'}}>
                          <div style={{width:`${r.compliance}%`,height:'100%',borderRadius:3,background:r.compliance>=80?T.green:r.compliance>=50?T.amber:T.red}}/>
                        </div>
                        <span style={{fontFamily:T.mono,fontSize:10,minWidth:28}}>{r.compliance}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode==='kanban'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
          {kanbanCols.map(col=>(
            <div key={col.title} style={{background:T.surfaceH,borderRadius:10,padding:16,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:13,fontWeight:700,color:col.color,marginBottom:12,display:'flex',justifyContent:'space-between'}}>
                <span>{col.title}</span>
                <span style={{fontSize:11,fontFamily:T.mono}}>{filtered.filter(r=>col.status.includes(r.status)).length}</span>
              </div>
              {filtered.filter(r=>col.status.includes(r.status)).map(r=>(
                <div key={r.id} style={{background:T.surface,borderRadius:6,padding:12,marginBottom:8,border:`1px solid ${T.border}`,borderLeft:`3px solid ${col.color}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:10,fontWeight:700}}>{r.regulator}</span>
                    <span style={S.tag(r.priority==='Critical'?T.red:T.amber)}>{r.priority}</span>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,marginTop:4}}>{r.ref}</div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{r.requirement.substring(0,60)}...</div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
                    <span style={{fontSize:9,color:T.textMut}}>{r.deadline}</span>
                    <span style={{fontSize:9,fontFamily:T.mono}}>{r.compliance}%</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {viewMode==='timeline'&&(
        <div style={S.card}>
          <div style={S.cardTitle}>Regulatory Timeline</div>
          <div style={S.cardSub}>Key deadlines across jurisdictions</div>
          {[...filtered].sort((a,b)=>a.deadline.localeCompare(b.deadline)).map(r=>(
            <div key={r.id} style={{display:'flex',gap:16,padding:'10px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{width:90,fontFamily:T.mono,fontSize:10,color:T.textMut,flexShrink:0}}>{r.deadline}</div>
              <div style={{width:50}}><span style={S.tag(T.navyL)}>{r.regulator}</span></div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:600}}>{r.ref}</div>
                <div style={{fontSize:10,color:T.textSec}}>{r.requirement.substring(0,80)}...</div>
              </div>
              <div style={{width:60}}><span style={S.tag(['Completed','Implemented','Operational'].includes(r.status)?T.green:r.status==='In Progress'?T.amber:T.red)}>{r.status}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 4: RISK APPETITE
 * ═══════════════════════════════════════════════════════════════════════════════ */
const RiskAppetiteTab=()=>{
  const getStatus=(m)=>{
    if(m.id===3||m.id===8||m.id===11||m.id===14||m.id===15){
      // higher is better
      return m.value>=m.limit?'green':m.value>=m.warning?'amber':'red';
    }
    // lower is better
    return m.value<=m.limit?'green':m.value<=m.warning?'amber':'red';
  };

  const breaches=RISK_APPETITE_METRICS.filter(m=>getStatus(m)==='red');
  const warnings=RISK_APPETITE_METRICS.filter(m=>getStatus(m)==='amber');

  return(
    <div>
      {/* Summary */}
      <div style={S.grid4}>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.green}}>{RISK_APPETITE_METRICS.filter(m=>getStatus(m)==='green').length}</div>
          <div style={S.kpiLabel}>Within Appetite</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.amber}}>{warnings.length}</div>
          <div style={S.kpiLabel}>Near Limit (Warning)</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>{breaches.length}</div>
          <div style={S.kpiLabel}>Breaches</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{RISK_APPETITE_METRICS.length}</div>
          <div style={S.kpiLabel}>Total Metrics</div>
          <div style={S.kpiSub}>Board-approved framework</div>
        </div>
      </div>

      {/* Traffic Light Dashboard */}
      <div style={S.card}>
        <div style={S.cardTitle}>Climate Risk Appetite Dashboard</div>
        <div style={S.cardSub}>Board-approved risk limits with traffic light status · Last board review: Q2 2024</div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Metric</th><th style={S.th}>Current</th><th style={S.th}>Warning</th>
                <th style={S.th}>Limit</th><th style={S.th}>Headroom</th><th style={S.th}>Trend</th><th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {RISK_APPETITE_METRICS.map(m=>{
                const status=getStatus(m);
                const statusColor={green:T.green,amber:T.amber,red:T.red}[status];
                const isHigherBetter=[3,8,11,14,15].includes(m.id);
                const headroom=isHigherBetter?m.value-m.limit:m.limit-m.value;
                return(
                  <tr key={m.id} style={{background:status==='red'?'#dc262608':'transparent'}}>
                    <td style={{...S.td,fontWeight:600}}>{m.metric}</td>
                    <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{m.value} {m.unit}</td>
                    <td style={{...S.td,fontFamily:T.mono,color:T.amber}}>{m.warning} {m.unit}</td>
                    <td style={{...S.td,fontFamily:T.mono,color:T.red}}>{m.limit} {m.unit}</td>
                    <td style={{...S.td,fontFamily:T.mono,color:headroom>0?T.green:T.red}}>{headroom>0?'+':''}{headroom.toFixed(1)}</td>
                    <td style={{...S.td,fontSize:11}}>{m.trend==='down'?'↘':'↗'} {m.trend}</td>
                    <td style={S.td}>
                      <div style={{width:16,height:16,borderRadius:'50%',background:statusColor,display:'inline-block'}}/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Carbon Budget Allocation */}
      <div style={S.card}>
        <div style={S.cardTitle}>Carbon Budget Allocation by Sector</div>
        <div style={S.cardSub}>Board-approved carbon budget: 750 ktCO₂e by FY 2025</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={NZBA_SECTORS.slice(0,8).map(s=>({sector:s.sector,budget:range(50,150,NZBA_SECTORS.indexOf(s)*47+3),actual:range(40,180,NZBA_SECTORS.indexOf(s)*47+7)}))}>
            <XAxis dataKey="sector" tick={{fontSize:9}} angle={-15}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}}/>
            <Tooltip/>
            <Legend/>
            <Bar dataKey="budget" name="Budget (ktCO₂e)" fill={T.sage} radius={[4,4,0,0]}/>
            <Bar dataKey="actual" name="Actual (ktCO₂e)" fill={T.navy} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 5: PEER BENCHMARKING
 * ═══════════════════════════════════════════════════════════════════════════════ */
const PeerBenchmarkingTab=()=>{
  const [sortMetric,setSortMetric]=useState('gar');
  const [showRadar,setShowRadar]=useState(false);

  const ourBank={name:'Our Bank',country:'UK',gar:7.8,fe:812,waci:185,tempScore:2.64,cet1Impact:-1.92,sbtiPct:42.5,nzba:true,greenBond:2.85,dqs:3.2,physRisk:18.5};

  const allBanks=useMemo(()=>[ourBank,...PEER_BANKS].sort((a,b)=>{
    if(['gar','sbtiPct','greenBond','dqs'].includes(sortMetric))return b[sortMetric]-a[sortMetric];
    return a[sortMetric]-b[sortMetric];
  }),[sortMetric]);

  const ourRank=allBanks.findIndex(b=>b.name==='Our Bank')+1;

  const radarData=useMemo(()=>{
    const metrics=['gar','sbtiPct','dqs','greenBond','tempScore','fe'];
    const labels=['GAR','SBTi %','DQS','Green Bond','Temp Score','Financed Em.'];
    const maxVals={gar:12,sbtiPct:60,dqs:4,greenBond:6,tempScore:3.5,fe:1200};
    return metrics.map((m,i)=>({
      metric:labels[i],
      ourBank:ourBank[m]/maxVals[m]*100,
      peerAvg:PEER_BANKS.reduce((s,b)=>s+b[m],0)/PEER_BANKS.length/maxVals[m]*100,
      bestInClass:Math.max(...PEER_BANKS.map(b=>b[m]))/maxVals[m]*100,
    }));
  },[]);

  return(
    <div>
      {/* Ranking */}
      <div style={S.grid4}>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{ourRank}/{allBanks.length}</div>
          <div style={S.kpiLabel}>Our Ranking ({sortMetric.toUpperCase()})</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{allBanks[0]?.name?.split(' ')[0]}</div>
          <div style={S.kpiLabel}>Best in Class</div>
          <div style={S.kpiSub}>{allBanks[0]?.[sortMetric]}</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,fontSize:16}}>{(PEER_BANKS.reduce((s,b)=>s+b[sortMetric],0)/PEER_BANKS.length).toFixed(1)}</div>
          <div style={S.kpiLabel}>Peer Average</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{PEER_BANKS.filter(b=>b.nzba).length}/{PEER_BANKS.length}</div>
          <div style={S.kpiLabel}>NZBA Members</div>
        </div>
      </div>

      {/* Sort selector */}
      <div style={S.filterBar}>
        <span style={{fontSize:11,fontWeight:600}}>Rank by:</span>
        {[{id:'gar',label:'GAR'},{id:'fe',label:'Financed Em.'},{id:'tempScore',label:'Temp Score'},{id:'sbtiPct',label:'SBTi %'},{id:'greenBond',label:'Green Bond'},{id:'dqs',label:'DQS'}].map(m=>(
          <button key={m.id} style={sortMetric===m.id?S.pillActive:S.pill} onClick={()=>setSortMetric(m.id)}>{m.label}</button>
        ))}
        <button style={{...S.pill,marginLeft:'auto'}} onClick={()=>setShowRadar(!showRadar)}>{showRadar?'Table':'Radar'} View</button>
      </div>

      {showRadar?(
        <div style={S.card}>
          <div style={S.cardTitle}>Peer Comparison Radar</div>
          <div style={S.cardSub}>Our Bank vs Peer Average vs Best-in-Class (normalized to 100)</div>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="metric" tick={{fontSize:11}}/>
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
              <Radar name="Our Bank" dataKey="ourBank" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
              <Radar name="Peer Avg" dataKey="peerAvg" stroke={T.amber} fill={T.amber} fillOpacity={0.1}/>
              <Radar name="Best" dataKey="bestInClass" stroke={T.green} fill={T.green} fillOpacity={0.05}/>
              <Legend/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ):(
        <div style={S.card}>
          <div style={S.cardTitle}>Peer Bank Climate Metrics Comparison</div>
          <div style={S.cardSub}>20 European peer banks — ranked by {sortMetric.toUpperCase()}</div>
          <div style={S.scrollTable}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th><th style={S.th}>Bank</th><th style={S.th}>Country</th>
                  <th style={S.th}>GAR %</th><th style={S.th}>FE (ktCO₂e)</th><th style={S.th}>WACI</th>
                  <th style={S.th}>Temp (°C)</th><th style={S.th}>CET1 Imp (pp)</th><th style={S.th}>SBTi %</th>
                  <th style={S.th}>NZBA</th><th style={S.th}>Green Bond (£bn)</th><th style={S.th}>DQS</th><th style={S.th}>Phys Risk %</th>
                </tr>
              </thead>
              <tbody>
                {allBanks.map((b,i)=>{
                  const isOurs=b.name==='Our Bank';
                  return(
                    <tr key={i} style={{background:isOurs?`${T.gold}12`:'transparent',fontWeight:isOurs?700:400}}>
                      <td style={{...S.td,fontFamily:T.mono}}>{i+1}</td>
                      <td style={{...S.td,fontWeight:700,color:isOurs?T.gold:T.navy}}>{b.name}{isOurs?' ★':''}</td>
                      <td style={S.td}>{b.country}</td>
                      <td style={{...S.td,fontFamily:T.mono}}>{b.gar.toFixed(1)}</td>
                      <td style={{...S.td,fontFamily:T.mono}}>{b.fe.toFixed(0)}</td>
                      <td style={{...S.td,fontFamily:T.mono}}>{b.waci.toFixed(0)}</td>
                      <td style={{...S.td,fontFamily:T.mono,color:b.tempScore<=2.5?T.green:b.tempScore<=3?T.amber:T.red}}>{b.tempScore.toFixed(2)}</td>
                      <td style={{...S.td,fontFamily:T.mono}}>{b.cet1Impact.toFixed(2)}</td>
                      <td style={{...S.td,fontFamily:T.mono}}>{b.sbtiPct.toFixed(0)}</td>
                      <td style={S.td}><span style={S.tag(b.nzba?T.green:T.red)}>{b.nzba?'Yes':'No'}</span></td>
                      <td style={{...S.td,fontFamily:T.mono}}>{b.greenBond.toFixed(1)}</td>
                      <td style={{...S.td,fontFamily:T.mono}}>{b.dqs.toFixed(1)}</td>
                      <td style={{...S.td,fontFamily:T.mono}}>{b.physRisk.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 6: NZBA COMMITMENT
 * ═══════════════════════════════════════════════════════════════════════════════ */
const NZBACommitmentTab=()=>{
  const totalClients=NZBA_SECTORS.reduce((s,sec)=>s+sec.clients,0);
  const totalEngagements=NZBA_SECTORS.reduce((s,sec)=>s+sec.engagements,0);
  const avgProgress=NZBA_SECTORS.reduce((s,sec)=>s+sec.progress,0)/NZBA_SECTORS.length;

  return(
    <div>
      {/* Summary */}
      <div style={S.grid4}>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.sage}}>{avgProgress.toFixed(0)}%</div>
          <div style={S.kpiLabel}>Avg NZBA Progress</div>
          <div style={S.kpiSub}>Across {NZBA_SECTORS.length} sectors</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{totalClients}</div>
          <div style={S.kpiLabel}>In-Scope Clients</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{totalEngagements}</div>
          <div style={S.kpiLabel}>Active Engagements</div>
          <div style={S.kpiSub}>{(totalEngagements/(totalClients||1)*100).toFixed(0)}% engaged</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>{NZBA_SECTORS.reduce((s,sec)=>s+sec.highRisk,0)}</div>
          <div style={S.kpiLabel}>High-Risk Clients</div>
          <div style={S.kpiSub}>Priority engagement</div>
        </div>
      </div>

      {/* Sector Targets */}
      <div style={S.card}>
        <div style={S.cardTitle}>NZBA Sector Decarbonisation Targets</div>
        <div style={S.cardSub}>Net Zero Banking Alliance — sector pathway targets vs current performance</div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Sector</th><th style={S.th}>Metric</th><th style={S.th}>Baseline</th>
                <th style={S.th}>Target 2030</th><th style={S.th}>Current</th><th style={S.th}>Progress</th>
                <th style={S.th}>Clients</th><th style={S.th}>Engaged</th><th style={S.th}>High-Risk</th>
              </tr>
            </thead>
            <tbody>
              {NZBA_SECTORS.map((s,i)=>(
                <tr key={i}>
                  <td style={{...S.td,fontWeight:600}}>{s.sector}</td>
                  <td style={{...S.td,fontFamily:T.mono,fontSize:10}}>{s.unit}</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{s.baseline}</td>
                  <td style={{...S.td,fontFamily:T.mono,color:T.green,fontWeight:700}}>{s.target2030}</td>
                  <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{s.current}</td>
                  <td style={S.td}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{flex:1,height:8,borderRadius:4,background:T.surfaceH,overflow:'hidden'}}>
                        <div style={{width:`${s.progress}%`,height:'100%',borderRadius:4,background:s.progress>=50?T.green:s.progress>=30?T.amber:T.red}}/>
                      </div>
                      <span style={{fontFamily:T.mono,fontSize:10,minWidth:32}}>{s.progress}%</span>
                    </div>
                  </td>
                  <td style={{...S.td,fontFamily:T.mono}}>{s.clients}</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{s.engagements} ({(s.engagements/s.clients*100).toFixed(0)}%)</td>
                  <td style={{...S.td,fontFamily:T.mono,color:s.highRisk>5?T.red:T.amber}}>{s.highRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span style={S.cite}>Ref: NZBA — Net Zero Banking Alliance commitment, UNEP FI · Sector targets aligned with IEA Net Zero Emissions by 2050 Scenario</span>
      </div>

      {/* Progress Chart */}
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Sector Decarbonisation Progress</div>
          <div style={S.cardSub}>Current vs baseline vs 2030 target</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={NZBA_SECTORS} layout="vertical" margin={{left:120}}>
              <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} domain={[0,100]}/>
              <YAxis dataKey="sector" type="category" tick={{fontSize:10}} width={115}/>
              <Tooltip/>
              <Bar dataKey="progress" name="Progress %" radius={[0,4,4,0]}>
                {NZBA_SECTORS.map((s,i)=><Cell key={i} fill={s.progress>=50?T.green:s.progress>=30?T.amber:T.red}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Engagement Pipeline</div>
          <div style={S.cardSub}>Client engagement status by sector</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={NZBA_SECTORS}>
              <XAxis dataKey="sector" tick={{fontSize:8}} angle={-20}/>
              <YAxis tick={{fontSize:10}}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="engagements" name="Engaged" stackId="a" fill={T.green}/>
              <Bar dataKey="highRisk" name="High-Risk" stackId="a" fill={T.red}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Coal Phase-Out */}
      <div style={S.card}>
        <div style={S.cardTitle}>Coal Phase-Out Commitment</div>
        <div style={S.cardSub}>OECD by 2030 · Non-OECD by 2040 · Complete exit target</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
          {[
            {label:'Current Coal Exposure',value:'£320M',color:T.red},
            {label:'2025 Target',value:'£200M',color:T.amber},
            {label:'2030 Target (OECD)',value:'£0',color:T.green},
            {label:'Active Exit Plans',value:'8 clients',color:T.navyL},
          ].map((m,i)=>(
            <div key={i} style={{padding:16,borderRadius:8,border:`2px solid ${m.color}30`,textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:800,color:m.color,fontFamily:T.mono}}>{m.value}</div>
              <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 7: BOARD REPORT & EXPORT
 * ═══════════════════════════════════════════════════════════════════════════════ */
const BoardReportExportTab=()=>{
  const [dateFrom,setDateFrom]=useState('2024-01-01');
  const [dateTo,setDateTo]=useState('2024-12-31');
  const [audience,setAudience]=useState('Board');
  const [sections,setSections]=useState({
    executive:true,emissions:true,taxonomy:true,stress:true,appetite:true,regulatory:true,peer:true,nzba:true,
  });

  const audiences=['Board','ALCO','Risk Committee','Regulator'];
  const sectionList=[
    {id:'executive',label:'Executive Summary',desc:'Key KPIs, trends, and recommendations',pages:3},
    {id:'emissions',label:'Financed Emissions & WACI',desc:'PCAF-aligned emissions with Scope 1+2+3 by sector',pages:5},
    {id:'taxonomy',label:'EU Taxonomy & GAR',desc:'Green Asset Ratio, BTAR, and taxonomy alignment',pages:4},
    {id:'stress',label:'Climate Stress Test',desc:'NGFS scenarios, CET1 impact, ECL overlay',pages:6},
    {id:'appetite',label:'Risk Appetite Statement',desc:'15 climate risk metrics vs board-approved limits',pages:3},
    {id:'regulatory',label:'Regulatory Compliance',desc:'25 requirements across ECB/BoE/EBA/BCBS',pages:4},
    {id:'peer',label:'Peer Benchmarking',desc:'Comparison with 20 European peers',pages:3},
    {id:'nzba',label:'NZBA Progress',desc:'Sector targets, engagement pipeline, coal phase-out',pages:4},
  ];

  const totalPages=sectionList.filter(s=>sections[s.id]).reduce((sum,s)=>sum+s.pages,0);

  return(
    <div>
      {/* Report Configuration */}
      <div style={S.card}>
        <div style={S.cardTitle}>Board Report Configuration</div>
        <div style={S.cardSub}>Configure report parameters, audience, and section selection</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,marginTop:12}}>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:T.textSec,display:'block',marginBottom:4}}>Date Range</label>
            <div style={{display:'flex',gap:8}}>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...S.select,flex:1}}/>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...S.select,flex:1}}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:T.textSec,display:'block',marginBottom:4}}>Audience</label>
            <div style={{display:'flex',gap:6}}>
              {audiences.map(a=>(
                <button key={a} style={audience===a?S.pillActive:S.pill} onClick={()=>setAudience(a)}>{a}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:T.textSec,display:'block',marginBottom:4}}>Estimated Pages</label>
            <div style={{fontSize:24,fontWeight:800,color:T.navy,fontFamily:T.mono}}>{totalPages}</div>
            <div style={{fontSize:10,color:T.textMut}}>{sectionList.filter(s=>sections[s.id]).length} of {sectionList.length} sections selected</div>
          </div>
        </div>
      </div>

      {/* Section Selection */}
      <div style={S.card}>
        <div style={S.cardTitle}>Report Sections</div>
        <div style={S.cardSub}>Select sections to include in the {audience} report</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {sectionList.map(s=>(
            <div key={s.id} style={{padding:12,borderRadius:8,border:`2px solid ${sections[s.id]?T.gold:T.border}`,background:sections[s.id]?`${T.gold}08`:T.surface,cursor:'pointer'}} onClick={()=>setSections(p=>({...p,[s.id]:!p[s.id]}))}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:700,color:sections[s.id]?T.navy:T.textMut}}>{s.label}</span>
                <input type="checkbox" checked={sections[s.id]} readOnly/>
              </div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{s.desc}</div>
              <div style={{fontSize:9,color:T.textMut,marginTop:4,fontFamily:T.mono}}>~{s.pages} pages</div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Formats */}
      <div style={S.card}>
        <div style={S.cardTitle}>Export Formats</div>
        <div style={S.cardSub}>Generate reports for {audience} submission</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
          {[
            {fmt:'EBA XML',desc:'Pillar 3 ESG ITS format for EBA submission',icon:'🏛️',reg:true},
            {fmt:'XBRL',desc:'Structured regulatory filing (iXBRL)',icon:'📋',reg:true},
            {fmt:'PDF',desc:'Board-ready report with charts and commentary',icon:'📄',reg:false},
            {fmt:'CSV',desc:'Raw data export for further analysis',icon:'📊',reg:false},
            {fmt:'Excel',desc:'Multi-sheet workbook with all templates',icon:'📈',reg:false},
            {fmt:'PowerPoint',desc:'Board presentation slides',icon:'🎯',reg:false},
            {fmt:'JSON',desc:'API-ready structured data',icon:'🔗',reg:false},
            {fmt:'TCFD Pack',desc:'TCFD-aligned disclosure package',icon:'🌍',reg:true},
          ].map((f,i)=>(
            <button key={i} style={{...S.btn,...S.btnOutline,padding:16,textAlign:'left'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:20}}>{f.icon}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:12}}>{f.fmt}</div>
                  <div style={{fontSize:10,color:T.textMut,fontWeight:400,marginTop:2}}>{f.desc}</div>
                  {f.reg&&<span style={{...S.tag(T.navyL),fontSize:8,marginTop:4}}>Regulatory</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Audit Trail */}
      <div style={S.card}>
        <div style={S.cardTitle}>Audit Trail</div>
        <div style={S.cardSub}>Report generation and data lineage tracking</div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Timestamp</th><th style={S.th}>Action</th><th style={S.th}>User</th>
                <th style={S.th}>Format</th><th style={S.th}>Status</th><th style={S.th}>Details</th>
              </tr>
            </thead>
            <tbody>
              {[
                {ts:'2024-11-15 14:32',action:'Report Generated',user:'J. Smith',fmt:'PDF',status:'Complete',details:'Q3 2024 Board Pack — 32 pages'},
                {ts:'2024-11-15 14:28',action:'EBA XML Export',user:'J. Smith',fmt:'EBA XML',status:'Complete',details:'All 10 Pillar 3 templates'},
                {ts:'2024-11-14 16:45',action:'Data Refresh',user:'System',fmt:'—',status:'Complete',details:'PCAF + Taxonomy data refresh'},
                {ts:'2024-11-14 10:12',action:'XBRL Filing',user:'A. Johnson',fmt:'XBRL',status:'Submitted',details:'H1 2024 regulatory filing'},
                {ts:'2024-11-01 09:00',action:'Peer Data Update',user:'System',fmt:'—',status:'Complete',details:'20 peer banks Q3 data'},
                {ts:'2024-10-30 15:22',action:'Risk Committee Report',user:'M. Williams',fmt:'PowerPoint',status:'Complete',details:'Q3 climate risk update — 18 slides'},
                {ts:'2024-10-15 11:45',action:'NZBA Submission',user:'K. Brown',fmt:'CSV',status:'Submitted',details:'Annual NZBA progress report'},
                {ts:'2024-10-01 08:30',action:'Model Version Update',user:'System',fmt:'—',status:'Complete',details:'CCR model v3.2 → v3.3'},
              ].map((r,i)=>(
                <tr key={i}>
                  <td style={{...S.td,fontFamily:T.mono,fontSize:10}}>{r.ts}</td>
                  <td style={{...S.td,fontWeight:600}}>{r.action}</td>
                  <td style={S.td}>{r.user}</td>
                  <td style={S.td}>{r.fmt}</td>
                  <td style={S.td}><span style={S.tag(r.status==='Complete'?T.green:r.status==='Submitted'?T.navyL:T.amber)}>{r.status}</span></td>
                  <td style={{...S.td,fontSize:10,color:T.textMut}}>{r.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Button */}
      <div style={{textAlign:'center',padding:20}}>
        <button style={{...S.btn,...S.btnGold,padding:'14px 48px',fontSize:14}}>
          Generate {audience} Report — {totalPages} Pages
        </button>
        <div style={{fontSize:10,color:T.textMut,marginTop:8,fontFamily:T.mono}}>
          Period: {dateFrom} to {dateTo} · Audience: {audience} · Sections: {sectionList.filter(s=>sections[s.id]).length}/{sectionList.length}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */
export default function ClimateBankingHubPage(){
  const [tab,setTab]=useState('dashboard');

  return(
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.headerTitle}>Climate Banking Hub</h1>
          <div style={S.headerSub}>EBA Pillar 3 ESG ITS · PCAF · EU Taxonomy · NGFS Scenarios</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={S.badge}>CRR Art. 449a</span>
          <span style={S.badge}>PCAF v2</span>
          <span style={S.badge}>EU Taxonomy</span>
          <span style={S.badge}>NGFS Phase IV</span>
          <span style={S.badge}>{PEER_BANKS.length} Peers · {NZBA_SECTORS.length} NZBA Sectors</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={S.tabBar}>
        {TABS.map(t=>(
          <div key={t.id} style={{...S.tab,...(tab===t.id?S.tabActive:{})}} onClick={()=>setTab(t.id)}>
            <span>{t.icon}</span>{t.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={S.content}>
        {tab==='dashboard'&&<BoardDashboardTab/>}
        {tab==='pillar3'&&<Pillar3Tab/>}
        {tab==='regulatory'&&<RegulatoryTrackerTab/>}
        {tab==='appetite'&&<RiskAppetiteTab/>}
        {tab==='peer'&&<PeerBenchmarkingTab/>}
        {tab==='nzba'&&<NZBACommitmentTab/>}
        {tab==='report'&&<BoardReportExportTab/>}
      </div>

      {/* Footer */}
      <div style={{padding:'16px 32px',borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:10,color:T.textMut,fontFamily:T.mono}}>
        <span>Climate Banking Hub v3.2 · EBA Pillar 3 ESG ITS + PCAF + EU Taxonomy + NGFS</span>
        <span>Data as at Q4 2024 · {PEER_BANKS.length} peer banks · {NZBA_SECTORS.length} NZBA sectors · {REGULATORY_ITEMS.length} regulatory items</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * EXTENDED DATA — ADDITIONAL BANKING HUB ANALYTICS
 * ═══════════════════════════════════════════════════════════════════════════════ */

/* ── EBA Template 4 — Banking Book Climate-Relevant Metrics ───────────────── */
const TEMPLATE4_DATA = [
  { nace: 'A', sector: 'Agriculture, Forestry & Fishing', exposure: 1850e6, maturity_0_5y: 620e6, maturity_5_10y: 780e6, maturity_10_plus: 450e6, performing: 1720e6, non_performing: 130e6, stage2: 185e6, coverage: 4.2 },
  { nace: 'B', sector: 'Mining & Quarrying', exposure: 2400e6, maturity_0_5y: 840e6, maturity_5_10y: 960e6, maturity_10_plus: 600e6, performing: 2180e6, non_performing: 220e6, stage2: 320e6, coverage: 5.8 },
  { nace: 'C', sector: 'Manufacturing', exposure: 5200e6, maturity_0_5y: 1820e6, maturity_5_10y: 2080e6, maturity_10_plus: 1300e6, performing: 4940e6, non_performing: 260e6, stage2: 520e6, coverage: 3.1 },
  { nace: 'D', sector: 'Electricity, Gas & Steam', exposure: 3800e6, maturity_0_5y: 1140e6, maturity_5_10y: 1520e6, maturity_10_plus: 1140e6, performing: 3610e6, non_performing: 190e6, stage2: 380e6, coverage: 3.5 },
  { nace: 'E', sector: 'Water & Waste Management', exposure: 980e6, maturity_0_5y: 294e6, maturity_5_10y: 392e6, maturity_10_plus: 294e6, performing: 960e6, non_performing: 20e6, stage2: 98e6, coverage: 2.1 },
  { nace: 'F', sector: 'Construction', exposure: 2100e6, maturity_0_5y: 840e6, maturity_5_10y: 840e6, maturity_10_plus: 420e6, performing: 1950e6, non_performing: 150e6, stage2: 252e6, coverage: 4.5 },
  { nace: 'G', sector: 'Wholesale & Retail Trade', exposure: 3200e6, maturity_0_5y: 1280e6, maturity_5_10y: 1280e6, maturity_10_plus: 640e6, performing: 3040e6, non_performing: 160e6, stage2: 320e6, coverage: 2.8 },
  { nace: 'H', sector: 'Transportation & Storage', exposure: 4100e6, maturity_0_5y: 1230e6, maturity_5_10y: 1640e6, maturity_10_plus: 1230e6, performing: 3854e6, non_performing: 246e6, stage2: 492e6, coverage: 4.0 },
  { nace: 'K', sector: 'Financial & Insurance', exposure: 6500e6, maturity_0_5y: 2275e6, maturity_5_10y: 2600e6, maturity_10_plus: 1625e6, performing: 6370e6, non_performing: 130e6, stage2: 325e6, coverage: 1.5 },
  { nace: 'L', sector: 'Real Estate Activities', exposure: 8200e6, maturity_0_5y: 1640e6, maturity_5_10y: 3280e6, maturity_10_plus: 3280e6, performing: 7790e6, non_performing: 410e6, stage2: 820e6, coverage: 3.2 },
];

/* ── EBA Template 5 — NACE Alignment Assessment ──────────────────────────── */
const TEMPLATE5_DATA = TEMPLATE4_DATA.map((t, i) => ({
  ...t,
  taxonomy_eligible: range(10, 85, i * 127 + 1),
  taxonomy_aligned: range(2, 45, i * 127 + 2),
  transition_activities: range(1, 25, i * 127 + 3),
  enabling_activities: range(0, 15, i * 127 + 4),
  dnsh_compliant: range(50, 95, i * 127 + 5),
  mss_compliant: range(60, 98, i * 127 + 6),
}));

/* ── EBA Template 8 — BTAR by sector ──────────────────────────────────────── */
const TEMPLATE8_DATA = TEMPLATE4_DATA.map((t, i) => ({
  nace: t.nace,
  sector: t.sector,
  total_exposure: t.exposure,
  taxonomy_aligned: range(5, 35, i * 143 + 1),
  transitioning: range(5, 25, i * 143 + 2),
  not_aligned: 0,
  btar: 0,
  target_2025: range(8, 20, i * 143 + 3),
  target_2030: range(15, 40, i * 143 + 4),
})).map(t => ({
  ...t,
  not_aligned: 100 - t.taxonomy_aligned - t.transitioning,
  btar: t.taxonomy_aligned + t.transitioning,
}));

/* ── EBA Template 9 — Trading Book Climate Metrics ────────────────────────── */
const TEMPLATE9_DATA = [
  { asset_class: 'Equities — Energy', notional: 1200e6, carbon_intensity: 380, climate_var: 85e6, phys_risk_exp: 12.5, trans_risk_exp: 42.8, sbti_pct: 28 },
  { asset_class: 'Equities — Materials', notional: 980e6, carbon_intensity: 520, climate_var: 72e6, phys_risk_exp: 8.2, trans_risk_exp: 38.5, sbti_pct: 32 },
  { asset_class: 'Equities — Industrials', notional: 1450e6, carbon_intensity: 120, climate_var: 48e6, phys_risk_exp: 15.8, trans_risk_exp: 22.1, sbti_pct: 45 },
  { asset_class: 'Equities — Utilities', notional: 650e6, carbon_intensity: 680, climate_var: 62e6, phys_risk_exp: 18.4, trans_risk_exp: 55.2, sbti_pct: 38 },
  { asset_class: 'Equities — Technology', notional: 2200e6, carbon_intensity: 8, climate_var: 12e6, phys_risk_exp: 3.1, trans_risk_exp: 5.5, sbti_pct: 62 },
  { asset_class: 'Equities — Healthcare', notional: 1800e6, carbon_intensity: 15, climate_var: 18e6, phys_risk_exp: 4.5, trans_risk_exp: 8.2, sbti_pct: 55 },
  { asset_class: 'Equities — Financials', notional: 3200e6, carbon_intensity: 4, climate_var: 8e6, phys_risk_exp: 2.8, trans_risk_exp: 12.5, sbti_pct: 42 },
  { asset_class: 'Equities — Real Estate', notional: 580e6, carbon_intensity: 45, climate_var: 28e6, phys_risk_exp: 22.1, trans_risk_exp: 18.8, sbti_pct: 35 },
  { asset_class: 'Equities — Consumer', notional: 1650e6, carbon_intensity: 35, climate_var: 22e6, phys_risk_exp: 6.5, trans_risk_exp: 12.8, sbti_pct: 48 },
  { asset_class: 'Equities — Comm. Services', notional: 1100e6, carbon_intensity: 18, climate_var: 15e6, phys_risk_exp: 5.2, trans_risk_exp: 8.5, sbti_pct: 52 },
];

/* ── EBA Template 10 — Climate Fees & Commissions ─────────────────────────── */
const TEMPLATE10_DATA = [
  { service: 'Green Bond Underwriting', revenue_fy23: 42e6, revenue_fy24: 58e6, growth: 38.1, pct_total: 2.8 },
  { service: 'Sustainability-Linked Loans', revenue_fy23: 35e6, revenue_fy24: 48e6, growth: 37.1, pct_total: 2.3 },
  { service: 'ESG Advisory', revenue_fy23: 18e6, revenue_fy24: 28e6, growth: 55.6, pct_total: 1.3 },
  { service: 'Carbon Trading', revenue_fy23: 12e6, revenue_fy24: 22e6, growth: 83.3, pct_total: 1.1 },
  { service: 'Taxonomy Alignment Assessment', revenue_fy23: 5e6, revenue_fy24: 12e6, growth: 140.0, pct_total: 0.6 },
  { service: 'Climate Risk Analytics', revenue_fy23: 8e6, revenue_fy24: 15e6, growth: 87.5, pct_total: 0.7 },
  { service: 'Transition Finance Structuring', revenue_fy23: 22e6, revenue_fy24: 35e6, growth: 59.1, pct_total: 1.7 },
  { service: 'Impact Investing Advisory', revenue_fy23: 10e6, revenue_fy24: 18e6, growth: 80.0, pct_total: 0.9 },
];

/* ── PCAF Financed Emissions by asset class ───────────────────────────────── */
const PCAF_BY_ASSET_CLASS = [
  { assetClass: 'Listed Equity & Corporate Bonds', exposure: 12500e6, scope1: 285e3, scope2: 120e3, scope3: 1250e3, dqs: 3.8, methodology: 'Enterprise Value method', attribution: 'EVIC-based', pctPortfolio: 28.5 },
  { assetClass: 'Business Loans & Unlisted Equity', exposure: 18200e6, scope1: 420e3, scope2: 180e3, scope3: 2100e3, dqs: 2.8, methodology: 'Revenue attribution', attribution: 'Revenue-based', pctPortfolio: 41.5 },
  { assetClass: 'Project Finance', exposure: 4800e6, scope1: 185e3, scope2: 45e3, scope3: 350e3, dqs: 3.5, methodology: 'Project emissions', attribution: 'Attribution factor', pctPortfolio: 10.9 },
  { assetClass: 'Commercial Real Estate', exposure: 5200e6, scope1: 28e3, scope2: 95e3, scope3: 180e3, dqs: 3.2, methodology: 'Floor area method', attribution: 'Property-specific', pctPortfolio: 11.9 },
  { assetClass: 'Mortgages', exposure: 2800e6, scope1: 12e3, scope2: 42e3, scope3: 85e3, dqs: 2.5, methodology: 'EPC-based estimates', attribution: 'Property-specific', pctPortfolio: 6.4 },
  { assetClass: 'Motor Vehicle Loans', exposure: 350e6, scope1: 18e3, scope2: 2e3, scope3: 25e3, dqs: 3.0, methodology: 'Vehicle class method', attribution: 'Per-vehicle', pctPortfolio: 0.8 },
];

/* ── Emissions trajectory — historical + targets ──────────────────────────── */
const EMISSIONS_TRAJECTORY = [
  { year: 2019, abs: 1240, int: 42.1, target: 1240, nzePath: 1240, sbtiPath: 1240 },
  { year: 2020, abs: 1180, int: 39.8, target: 1100, nzePath: 1120, sbtiPath: 1140 },
  { year: 2021, abs: 1050, int: 35.2, target: 960, nzePath: 1000, sbtiPath: 1040 },
  { year: 2022, abs: 960, int: 32.0, target: 820, nzePath: 880, sbtiPath: 940 },
  { year: 2023, abs: 847, int: 27.9, target: 700, nzePath: 760, sbtiPath: 840 },
  { year: 2024, abs: 812, int: 26.5, target: 600, nzePath: 640, sbtiPath: 740 },
  { year: 2025, abs: null, int: null, target: 520, nzePath: 520, sbtiPath: 640 },
  { year: 2030, abs: null, int: null, target: 250, nzePath: 280, sbtiPath: 420 },
  { year: 2035, abs: null, int: null, target: 100, nzePath: 140, sbtiPath: 250 },
  { year: 2040, abs: null, int: null, target: 30, nzePath: 60, sbtiPath: 120 },
  { year: 2050, abs: null, int: null, target: 0, nzePath: 0, sbtiPath: 0 },
];

/* ── Capital adequacy — climate risk impact on CET1 ───────────────────────── */
const CET1_WATERFALL = [
  { item: 'CET1 Ratio (Baseline)', value: 14.2, cumulative: 14.2, type: 'base' },
  { item: 'Credit risk — Transition', value: -0.85, cumulative: 13.35, type: 'adverse' },
  { item: 'Credit risk — Physical', value: -0.42, cumulative: 12.93, type: 'adverse' },
  { item: 'Market risk — Carbon price', value: -0.28, cumulative: 12.65, type: 'adverse' },
  { item: 'Market risk — Equity', value: -0.18, cumulative: 12.47, type: 'adverse' },
  { item: 'Operational risk', value: -0.12, cumulative: 12.35, type: 'adverse' },
  { item: 'Stranded assets write-down', value: -0.35, cumulative: 12.00, type: 'adverse' },
  { item: 'Green asset benefit', value: 0.15, cumulative: 12.15, type: 'benefit' },
  { item: 'Management actions', value: 0.25, cumulative: 12.40, type: 'benefit' },
  { item: 'CET1 Ratio (Stressed)', value: 12.40, cumulative: 12.40, type: 'total' },
];

/* ── Financed emissions by country ────────────────────────────────────────── */
const FE_BY_COUNTRY = [
  { country: 'United Kingdom', fe: 185, pct: 22.8, exposure: 9800e6, intensity: 18.9, trend: 'Decreasing' },
  { country: 'Germany', fe: 142, pct: 17.5, exposure: 7200e6, intensity: 19.7, trend: 'Decreasing' },
  { country: 'France', fe: 88, pct: 10.8, exposure: 5400e6, intensity: 16.3, trend: 'Stable' },
  { country: 'United States', fe: 105, pct: 12.9, exposure: 8500e6, intensity: 12.4, trend: 'Decreasing' },
  { country: 'Japan', fe: 52, pct: 6.4, exposure: 3200e6, intensity: 16.3, trend: 'Stable' },
  { country: 'India', fe: 48, pct: 5.9, exposure: 2800e6, intensity: 17.1, trend: 'Increasing' },
  { country: 'Brazil', fe: 35, pct: 4.3, exposure: 1800e6, intensity: 19.4, trend: 'Stable' },
  { country: 'China', fe: 62, pct: 7.6, exposure: 4100e6, intensity: 15.1, trend: 'Decreasing' },
  { country: 'Australia', fe: 38, pct: 4.7, exposure: 2200e6, intensity: 17.3, trend: 'Decreasing' },
  { country: 'Other', fe: 57, pct: 7.0, exposure: 3900e6, intensity: 14.6, trend: 'Mixed' },
];

/* ── Green bond portfolio ─────────────────────────────────────────────────── */
const GREEN_BOND_PORTFOLIO = [
  { issuer: 'EIB Climate Awareness Bond', amount: 450e6, coupon: 2.85, maturity: '2028', rating: 'AAA', use: 'Renewable energy + energy efficiency', cbi_certified: true },
  { issuer: 'UK Government Green Gilt', amount: 380e6, coupon: 1.50, maturity: '2033', rating: 'AA', use: 'Clean transport + nature-based solutions', cbi_certified: true },
  { issuer: 'Iberdrola Green Bond', amount: 250e6, coupon: 3.25, maturity: '2030', rating: 'BBB+', use: 'Offshore wind + solar PV', cbi_certified: true },
  { issuer: 'Apple Green Bond', amount: 200e6, coupon: 2.95, maturity: '2029', rating: 'AA+', use: 'Renewable energy + recycled materials', cbi_certified: false },
  { issuer: 'KfW Green Bond', amount: 350e6, coupon: 2.10, maturity: '2027', rating: 'AAA', use: 'Energy efficiency + climate adaptation', cbi_certified: true },
  { issuer: 'Orsted Green Bond', amount: 180e6, coupon: 3.50, maturity: '2031', rating: 'BBB+', use: 'Offshore wind farms', cbi_certified: true },
  { issuer: 'BNP Paribas Green Bond', amount: 220e6, coupon: 2.75, maturity: '2028', rating: 'A+', use: 'Renewable energy financing', cbi_certified: true },
  { issuer: 'Republic of France OAT', amount: 300e6, coupon: 1.75, maturity: '2039', rating: 'AA', use: 'Green infrastructure + biodiversity', cbi_certified: true },
  { issuer: 'Enel Green Bond', amount: 175e6, coupon: 3.15, maturity: '2029', rating: 'BBB+', use: 'Solar + wind capacity addition', cbi_certified: true },
  { issuer: 'World Bank Green Bond', amount: 280e6, coupon: 2.40, maturity: '2030', rating: 'AAA', use: 'Climate adaptation in developing nations', cbi_certified: true },
];

/* ── Client engagement pipeline for NZBA ──────────────────────────────────── */
const ENGAGEMENT_PIPELINE = [
  { client: 'Shell plc', sector: 'Oil & Gas', engagement: 'Transition plan review', status: 'In Progress', priority: 'Critical', intensity: 520, target: 280, gap: 46, lastMeeting: '2024-10-15', nextStep: 'Scope 3 target setting' },
  { client: 'BP plc', sector: 'Oil & Gas', engagement: 'Capital allocation', status: 'Behind', priority: 'Critical', intensity: 480, target: 260, gap: 46, lastMeeting: '2024-09-22', nextStep: 'Low-carbon capex increase' },
  { client: 'RWE AG', sector: 'Power', engagement: 'Coal exit timeline', status: 'On Track', priority: 'High', intensity: 650, target: 180, gap: 72, lastMeeting: '2024-11-05', nextStep: 'Renewable expansion review' },
  { client: 'ArcelorMittal', sector: 'Steel', engagement: 'DRI-EAF transition', status: 'In Progress', priority: 'High', intensity: 1.85, target: 1.20, gap: 35, lastMeeting: '2024-10-08', nextStep: 'Pilot plant assessment' },
  { client: 'HeidelbergCement', sector: 'Cement', engagement: 'CCUS implementation', status: 'Behind', priority: 'High', intensity: 580, target: 430, gap: 26, lastMeeting: '2024-09-15', nextStep: 'Brevik CCS timeline' },
  { client: 'Maersk Group', sector: 'Shipping', engagement: 'Green fuel transition', status: 'On Track', priority: 'Medium', intensity: 9.8, target: 7.8, gap: 20, lastMeeting: '2024-11-12', nextStep: 'Methanol sourcing review' },
  { client: 'British Land', sector: 'Real Estate', engagement: 'Net zero carbon buildings', status: 'On Track', priority: 'Medium', intensity: 72, target: 55, gap: 24, lastMeeting: '2024-10-28', nextStep: 'Retrofit programme update' },
  { client: 'Cargill Inc', sector: 'Agriculture', engagement: 'Deforestation-free supply', status: 'In Progress', priority: 'High', intensity: 3.8, target: 2.8, gap: 26, lastMeeting: '2024-09-30', nextStep: 'Satellite monitoring rollout' },
  { client: 'EasyJet plc', sector: 'Aviation', engagement: 'SAF procurement', status: 'Behind', priority: 'Medium', intensity: 88, target: 72, gap: 18, lastMeeting: '2024-11-01', nextStep: 'SAF offtake agreement' },
  { client: 'Tata Steel', sector: 'Steel', engagement: 'Port Talbot transition', status: 'Behind', priority: 'Critical', intensity: 1.92, target: 1.20, gap: 38, lastMeeting: '2024-10-20', nextStep: 'Government funding review' },
];

/* ── Climate stress test P&L impact ───────────────────────────────────────── */
const STRESS_PL_IMPACT = NGFS_SCENARIOS.slice(0, 4).map((scen, i) => ({
  scenario: scen.name,
  category: scen.category,
  color: scen.color,
  nii_impact: range(-2, -18, i * 109 + 1),
  trading_income: range(-5, -25, i * 109 + 2),
  fee_income: range(-1, -8, i * 109 + 3),
  credit_losses: range(-15, -120, i * 109 + 4),
  opex_change: range(-2, -8, i * 109 + 5),
  total_pl_impact: 0,
  roe_impact_pp: range(-0.5, -5.5, i * 109 + 6),
  dividend_impact: range(-5, -35, i * 109 + 7),
})).map(s => ({ ...s, total_pl_impact: s.nii_impact + s.trading_income + s.fee_income + s.credit_losses + s.opex_change }));

/* ── Key risk indicators — time series ────────────────────────────────────── */
const KRI_TIMESERIES = [
  { date: '2022-Q1', fe: 1050, waci: 238, gar: 4.2, tempScore: 3.12, physRisk: 22.8, transRisk: 41.5, sbtiPct: 25.4, dqs: 2.5 },
  { date: '2022-Q2', fe: 1020, waci: 232, gar: 4.5, tempScore: 3.08, physRisk: 22.5, transRisk: 41.0, sbtiPct: 26.8, dqs: 2.5 },
  { date: '2022-Q3', fe: 990, waci: 225, gar: 4.8, tempScore: 3.02, physRisk: 22.2, transRisk: 40.2, sbtiPct: 28.2, dqs: 2.6 },
  { date: '2022-Q4', fe: 960, waci: 216, gar: 5.2, tempScore: 2.95, physRisk: 21.8, transRisk: 39.5, sbtiPct: 30.0, dqs: 2.7 },
  { date: '2023-Q1', fe: 934, waci: 208, gar: 5.8, tempScore: 2.92, physRisk: 21.2, transRisk: 39.2, sbtiPct: 31.8, dqs: 2.8 },
  { date: '2023-Q2', fe: 912, waci: 205, gar: 6.0, tempScore: 2.88, physRisk: 20.8, transRisk: 38.5, sbtiPct: 33.5, dqs: 2.9 },
  { date: '2023-Q3', fe: 891, waci: 201, gar: 6.2, tempScore: 2.85, physRisk: 20.5, transRisk: 37.8, sbtiPct: 34.5, dqs: 2.9 },
  { date: '2023-Q4', fe: 870, waci: 198, gar: 6.5, tempScore: 2.82, physRisk: 20.2, transRisk: 37.2, sbtiPct: 36.0, dqs: 3.0 },
  { date: '2024-Q1', fe: 847, waci: 192, gar: 6.9, tempScore: 2.78, physRisk: 19.8, transRisk: 36.5, sbtiPct: 37.2, dqs: 3.0 },
  { date: '2024-Q2', fe: 835, waci: 189, gar: 7.1, tempScore: 2.74, physRisk: 19.5, transRisk: 35.8, sbtiPct: 39.8, dqs: 3.1 },
  { date: '2024-Q3', fe: 822, waci: 187, gar: 7.4, tempScore: 2.68, physRisk: 19.0, transRisk: 35.0, sbtiPct: 41.2, dqs: 3.2 },
  { date: '2024-Q4', fe: 812, waci: 185, gar: 7.8, tempScore: 2.64, physRisk: 18.5, transRisk: 34.2, sbtiPct: 42.5, dqs: 3.2 },
];

/* ── Sustainability-linked loan portfolio ─────────────────────────────────── */
const SLL_PORTFOLIO = [
  { borrower: 'Unilever plc', amount: 850e6, margin_adj: -15, kpi: 'Scope 1+2 reduction 50% by 2030', current_progress: 62, on_track: true, maturity: '2028' },
  { borrower: 'Vodafone Group', amount: 620e6, margin_adj: -12, kpi: 'RE100 — 100% renewable by 2025', current_progress: 88, on_track: true, maturity: '2027' },
  { borrower: 'Tesco plc', amount: 480e6, margin_adj: -10, kpi: 'Food waste reduction 50% by 2030', current_progress: 45, on_track: false, maturity: '2029' },
  { borrower: 'Siemens AG', amount: 720e6, margin_adj: -18, kpi: 'Carbon neutral operations by 2030', current_progress: 55, on_track: true, maturity: '2030' },
  { borrower: 'Nestle SA', amount: 550e6, margin_adj: -12, kpi: 'Net zero by 2050 with interim 2030 target', current_progress: 38, on_track: true, maturity: '2028' },
  { borrower: 'SAP SE', amount: 400e6, margin_adj: -8, kpi: 'Carbon neutral cloud by 2025', current_progress: 92, on_track: true, maturity: '2026' },
  { borrower: 'Holcim Group', amount: 380e6, margin_adj: -20, kpi: 'CO₂ per tonne cement -20% by 2030', current_progress: 42, on_track: true, maturity: '2029' },
  { borrower: 'Danone SA', amount: 320e6, margin_adj: -15, kpi: 'B Corp certification maintenance + scope 3', current_progress: 52, on_track: true, maturity: '2027' },
];

/* ── Data governance & lineage ────────────────────────────────────────────── */
const DATA_GOVERNANCE = [
  { dataset: 'Financed Emissions (Scope 1+2)', source: 'CDP + Company Reports', frequency: 'Annual', lastUpdate: '2024-11-15', dqs: 3.8, coverage: 82, methodology: 'PCAF v2', owner: 'Climate Data Team' },
  { dataset: 'Financed Emissions (Scope 3)', source: 'Estimations + PCAF factors', frequency: 'Annual', lastUpdate: '2024-11-15', dqs: 2.5, coverage: 65, methodology: 'PCAF v2', owner: 'Climate Data Team' },
  { dataset: 'Physical Risk Scores', source: 'Munich Re + Swiss Re', frequency: 'Semi-annual', lastUpdate: '2024-09-30', dqs: 3.5, coverage: 95, methodology: '8-hazard model', owner: 'Risk Analytics' },
  { dataset: 'EPC Ratings', source: 'UK EPC Register + valuations', frequency: 'On-event', lastUpdate: '2024-11-01', dqs: 4.2, coverage: 88, methodology: 'SAP methodology', owner: 'Property Risk' },
  { dataset: 'EU Taxonomy Alignment', source: 'Internal assessment + 3rd party', frequency: 'Annual', lastUpdate: '2024-10-30', dqs: 3.0, coverage: 72, methodology: 'EU Taxonomy Regulation', owner: 'Taxonomy Team' },
  { dataset: 'SBTi Status', source: 'SBTi database', frequency: 'Monthly', lastUpdate: '2024-11-20', dqs: 4.5, coverage: 98, methodology: 'SBTi website scrape', owner: 'Climate Data Team' },
  { dataset: 'Carbon Prices', source: 'ICE + exchange data', frequency: 'Daily', lastUpdate: '2024-11-22', dqs: 5.0, coverage: 100, methodology: 'Market data', owner: 'Market Risk' },
  { dataset: 'Peer Bank Metrics', source: 'Annual reports + CDP', frequency: 'Annual', lastUpdate: '2024-10-15', dqs: 3.2, coverage: 90, methodology: 'Public disclosures', owner: 'Benchmarking Team' },
  { dataset: 'NZBA Progress', source: 'Internal tracking', frequency: 'Quarterly', lastUpdate: '2024-11-15', dqs: 3.8, coverage: 100, methodology: 'NZBA framework', owner: 'Sustainability Team' },
  { dataset: 'Regulatory Requirements', source: 'Legal & Compliance', frequency: 'Monthly', lastUpdate: '2024-11-20', dqs: 4.0, coverage: 100, methodology: 'Manual tracking', owner: 'Compliance Team' },
];

/* ── Board-level key messages ─────────────────────────────────────────────── */
const BOARD_KEY_MESSAGES = [
  { category: 'Positive', message: 'Financed emissions reduced 17.2% YoY — ahead of NZE pathway trajectory', priority: 'Highlight', metric: 'fe' },
  { category: 'Positive', message: 'Green Asset Ratio increased from 5.8% to 7.8% (+34.5% YoY)', priority: 'Highlight', metric: 'gar' },
  { category: 'Positive', message: 'SBTi portfolio coverage reached 42.5% — on track for 50% by 2025', priority: 'Highlight', metric: 'sbtiPct' },
  { category: 'Concern', message: 'CET1 climate impact at -1.92pp under delayed transition — within limit but deteriorating', priority: 'Monitor', metric: 'cet1Impact' },
  { category: 'Concern', message: 'Carbon-intensive sector concentration at 28.1% — above 25% target', priority: 'Action Required', metric: 'carbonIntPct' },
  { category: 'Concern', message: 'EBA Pillar 3 templates 5, 8, 9 still in progress — June 2025 deadline', priority: 'Action Required', metric: 'pillar3' },
  { category: 'Neutral', message: 'NZBA progress at 38% — coal sector on track for OECD 2030 exit', priority: 'Monitor', metric: 'nzbaProgress' },
  { category: 'Positive', message: 'Data quality score improved from 2.5 to 3.2 — on track for 4.0 target', priority: 'Highlight', metric: 'dqsAvg' },
  { category: 'Neutral', message: 'Regulatory compliance score at 76.8% — 5 requirements below 60%', priority: 'Monitor', metric: 'regCompliance' },
  { category: 'Positive', message: 'Green bond issuance reached £2.85bn — new pipeline of £1.5bn in Q1 2025', priority: 'Highlight', metric: 'greenBond' },
];

/* ── Climate Risk Committee reporting calendar ────────────────────────────── */
const COMMITTEE_CALENDAR = [
  { date: '2025-01-28', committee: 'Board Risk Committee', agenda: 'Q4 2024 Climate Risk Dashboard + Annual Risk Appetite Review', papers: 'Climate Board Pack, Risk Appetite Statement', owner: 'CRO' },
  { date: '2025-02-15', committee: 'ALCO', agenda: 'Climate stress test results + capital allocation', papers: 'Stress Test Report, CET1 Waterfall', owner: 'CFO/CRO' },
  { date: '2025-03-01', committee: 'Credit Committee', agenda: 'Climate covenant monitoring + high-carbon client review', papers: 'Covenant Report, Engagement Tracker', owner: 'Chief Credit Officer' },
  { date: '2025-03-15', committee: 'ESG Committee', agenda: 'NZBA progress review + 2030 target setting', papers: 'NZBA Report, Sector Pathways', owner: 'Head of Sustainability' },
  { date: '2025-04-01', committee: 'Audit Committee', agenda: 'Climate ECL overlay methodology review', papers: 'Model Documentation, Backtesting Report', owner: 'Head of Model Validation' },
  { date: '2025-04-30', committee: 'Board', agenda: 'Annual climate disclosure approval (TCFD + Pillar 3)', papers: 'TCFD Report, EBA Templates', owner: 'CFO' },
  { date: '2025-06-30', committee: 'Board Risk Committee', agenda: 'H1 2025 Climate Risk Dashboard + regulatory update', papers: 'Climate Board Pack, Regulatory Tracker', owner: 'CRO' },
  { date: '2025-09-30', committee: 'Board', agenda: 'Climate transition plan annual update', papers: 'Transition Plan, NZBA Progress', owner: 'CEO/Head of Sustainability' },
];
