import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt=n=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
const tip={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11,fontFamily:T.mono};

/* ─── CONSTANTS ─── */
const REGIONS=['All','Europe','Asia-Pacific','Americas','Middle East & Africa'];
const NGFS_FILTER=['All','Member','Observer','Non-Member'];
const MANDATE_FILTER=['All','Strong','Moderate','Emerging','None'];
const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];

/* ─── 40 CENTRAL BANKS ─── */
const CENTRAL_BANKS=[
  {id:1,name:'European Central Bank',code:'ECB',country:'Eurozone',region:'Europe',ngfs:'Member',ngfsSince:2017,climateMandate:'Strong',stressTestReq:true,stressTestYear:2022,greenQE:true,greenQEVolBn:141,disclosureRules:'Mandatory',prudentialReq:'Pillar 2 add-on',capitalBps:30,publications:14,methodology:'Bottom-up + top-down',scenarios:'NGFS aligned',banksTested:104,coverageTrillions:25},
  {id:2,name:'Bank of England',code:'BoE',country:'United Kingdom',region:'Europe',ngfs:'Member',ngfsSince:2017,climateMandate:'Strong',stressTestReq:true,stressTestYear:2021,greenQE:true,greenQEVolBn:38,disclosureRules:'Mandatory',prudentialReq:'SS3/19 expectations',capitalBps:25,publications:11,methodology:'Bottom-up CBES',scenarios:'NGFS + bespoke',banksTested:19,coverageTrillions:6},
  {id:3,name:'Federal Reserve',code:'Fed',country:'United States',region:'Americas',ngfs:'Member',ngfsSince:2020,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'Guidance only',capitalBps:0,publications:6,methodology:'Pilot exercise',scenarios:'Bespoke',banksTested:6,coverageTrillions:18},
  {id:4,name:"People's Bank of China",code:'PBoC',country:'China',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2018,climateMandate:'Strong',stressTestReq:true,stressTestYear:2021,greenQE:true,greenQEVolBn:62,disclosureRules:'Mandatory',prudentialReq:'Green lending quotas',capitalBps:20,publications:9,methodology:'Top-down macro',scenarios:'NGFS aligned',banksTested:23,coverageTrillions:15},
  {id:5,name:'Monetary Authority of Singapore',code:'MAS',country:'Singapore',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2018,climateMandate:'Strong',stressTestReq:true,stressTestYear:2022,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Environmental risk guidelines',capitalBps:15,publications:8,methodology:'Industry-wide stress test',scenarios:'NGFS aligned',banksTested:12,coverageTrillions:3.2},
  {id:6,name:'Australian Prudential Regulation Authority',code:'APRA',country:'Australia',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2018,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2022,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'CPG 229 guidance',capitalBps:15,publications:7,methodology:'Vulnerability assessment',scenarios:'NGFS aligned',banksTested:5,coverageTrillions:4.5},
  {id:7,name:'Bank of Canada',code:'BoC',country:'Canada',region:'Americas',ngfs:'Member',ngfsSince:2018,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2022,greenQE:true,greenQEVolBn:14,disclosureRules:'Proposed',prudentialReq:'OSFI B-15',capitalBps:20,publications:8,methodology:'Scenario analysis',scenarios:'NGFS + bespoke',banksTested:8,coverageTrillions:5.1},
  {id:8,name:'Bank of Japan',code:'BoJ',country:'Japan',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2018,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2022,greenQE:true,greenQEVolBn:28,disclosureRules:'Mandatory',prudentialReq:'Supervisory guidance',capitalBps:10,publications:7,methodology:'Macro stress test',scenarios:'NGFS aligned',banksTested:15,coverageTrillions:9.2},
  {id:9,name:'Riksbank',code:'Riksbank',country:'Sweden',region:'Europe',ngfs:'Member',ngfsSince:2017,climateMandate:'Strong',stressTestReq:true,stressTestYear:2021,greenQE:true,greenQEVolBn:22,disclosureRules:'Mandatory',prudentialReq:'Pillar 2 guidance',capitalBps:28,publications:10,methodology:'Bottom-up',scenarios:'NGFS aligned',banksTested:8,coverageTrillions:1.8},
  {id:10,name:'De Nederlandsche Bank',code:'DNB',country:'Netherlands',region:'Europe',ngfs:'Member',ngfsSince:2017,climateMandate:'Strong',stressTestReq:true,stressTestYear:2018,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Good practice guide',capitalBps:25,publications:12,methodology:'Sectoral stress test',scenarios:'NGFS + bespoke',banksTested:11,coverageTrillions:2.4},
  {id:11,name:'Hong Kong Monetary Authority',code:'HKMA',country:'Hong Kong',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2018,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2023,greenQE:true,greenQEVolBn:36,disclosureRules:'Mandatory',prudentialReq:'Supervisory expectations',capitalBps:18,publications:6,methodology:'Pilot climate risk',scenarios:'NGFS aligned',banksTested:10,coverageTrillions:3.8},
  {id:12,name:'Swiss National Bank',code:'SNB',country:'Switzerland',region:'Europe',ngfs:'Member',ngfsSince:2019,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Voluntary',prudentialReq:'FINMA guidance',capitalBps:10,publications:4,methodology:'N/A',scenarios:'N/A',banksTested:0,coverageTrillions:0},
  {id:13,name:'Banque de France / ACPR',code:'BdF',country:'France',region:'Europe',ngfs:'Member',ngfsSince:2017,climateMandate:'Strong',stressTestReq:true,stressTestYear:2020,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Article 29 Energy-Climate',capitalBps:22,publications:15,methodology:'Bottom-up pilot',scenarios:'NGFS aligned',banksTested:22,coverageTrillions:8.1},
  {id:14,name:'Deutsche Bundesbank',code:'BBk',country:'Germany',region:'Europe',ngfs:'Member',ngfsSince:2017,climateMandate:'Strong',stressTestReq:true,stressTestYear:2022,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'BaFin guidance',capitalBps:22,publications:9,methodology:'Integrated stress test',scenarios:'NGFS aligned',banksTested:18,coverageTrillions:7.2},
  {id:15,name:'Reserve Bank of India',code:'RBI',country:'India',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2021,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'Discussion paper',capitalBps:0,publications:3,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:16,name:'Central Bank of Brazil',code:'BCB',country:'Brazil',region:'Americas',ngfs:'Member',ngfsSince:2019,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2022,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Resolution 4945',capitalBps:12,publications:6,methodology:'S&E risk assessment',scenarios:'Bespoke',banksTested:14,coverageTrillions:3.6},
  {id:17,name:'Bank Negara Malaysia',code:'BNM',country:'Malaysia',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2018,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2023,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'CCPT expectations',capitalBps:12,publications:5,methodology:'Industry stress test',scenarios:'NGFS aligned',banksTested:8,coverageTrillions:1.4},
  {id:18,name:'South African Reserve Bank',code:'SARB',country:'South Africa',region:'Middle East & Africa',ngfs:'Member',ngfsSince:2020,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'Guidance note',capitalBps:0,publications:3,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:19,name:'Bank of Korea',code:'BoK',country:'South Korea',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2019,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2023,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Supervisory guidance',capitalBps:15,publications:5,methodology:'Climate scenario analysis',scenarios:'NGFS aligned',banksTested:10,coverageTrillions:4.2},
  {id:20,name:'Central Bank of UAE',code:'CBUAE',country:'UAE',region:'Middle East & Africa',ngfs:'Member',ngfsSince:2022,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'Sustainability framework',capitalBps:0,publications:2,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:21,name:'Banco de Espana',code:'BdE',country:'Spain',region:'Europe',ngfs:'Member',ngfsSince:2018,climateMandate:'Strong',stressTestReq:true,stressTestYear:2022,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Supervisory expectations',capitalBps:20,publications:8,methodology:'Top-down macro',scenarios:'NGFS aligned',banksTested:12,coverageTrillions:3.5},
  {id:22,name:"Banca d'Italia",code:'BdI',country:'Italy',region:'Europe',ngfs:'Member',ngfsSince:2018,climateMandate:'Strong',stressTestReq:true,stressTestYear:2022,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Pillar 2 integration',capitalBps:20,publications:9,methodology:'Bottom-up sectoral',scenarios:'NGFS aligned',banksTested:14,coverageTrillions:4.1},
  {id:23,name:'Bank of Thailand',code:'BoT',country:'Thailand',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2019,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Voluntary',prudentialReq:'Sustainable banking guidelines',capitalBps:0,publications:3,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:24,name:'Norges Bank',code:'NB',country:'Norway',region:'Europe',ngfs:'Member',ngfsSince:2018,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2023,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Supervisory expectations',capitalBps:18,publications:7,methodology:'Macro vulnerability',scenarios:'NGFS aligned',banksTested:7,coverageTrillions:1.6},
  {id:25,name:'Banco de Mexico',code:'Banxico',country:'Mexico',region:'Americas',ngfs:'Member',ngfsSince:2020,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'Sustainability criteria',capitalBps:0,publications:3,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:26,name:'Central Bank of Ireland',code:'CBI',country:'Ireland',region:'Europe',ngfs:'Member',ngfsSince:2018,climateMandate:'Strong',stressTestReq:true,stressTestYear:2022,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Climate expectations letter',capitalBps:20,publications:6,methodology:'Bottom-up pilot',scenarios:'NGFS aligned',banksTested:6,coverageTrillions:1.2},
  {id:27,name:'National Bank of Belgium',code:'NBB',country:'Belgium',region:'Europe',ngfs:'Member',ngfsSince:2017,climateMandate:'Strong',stressTestReq:true,stressTestYear:2022,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Pillar 2 integration',capitalBps:22,publications:7,methodology:'Sectoral analysis',scenarios:'NGFS aligned',banksTested:9,coverageTrillions:1.8},
  {id:28,name:'Bank of Indonesia',code:'BI',country:'Indonesia',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2019,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'Green taxonomy',capitalBps:0,publications:3,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:29,name:'Central Bank of Chile',code:'BCCh',country:'Chile',region:'Americas',ngfs:'Member',ngfsSince:2019,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2023,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'CMF guidelines',capitalBps:10,publications:4,methodology:'Climate scenario pilot',scenarios:'NGFS aligned',banksTested:5,coverageTrillions:0.8},
  {id:30,name:'Bangko Sentral ng Pilipinas',code:'BSP',country:'Philippines',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2020,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2023,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Sustainable finance circular',capitalBps:10,publications:4,methodology:'E&S risk assessment',scenarios:'NGFS aligned',banksTested:6,coverageTrillions:0.6},
  {id:31,name:'Bank of Finland',code:'BoF',country:'Finland',region:'Europe',ngfs:'Member',ngfsSince:2017,climateMandate:'Strong',stressTestReq:true,stressTestYear:2022,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Pillar 2 integration',capitalBps:22,publications:6,methodology:'Macro stress test',scenarios:'NGFS aligned',banksTested:7,coverageTrillions:0.9},
  {id:32,name:'Oesterreichische Nationalbank',code:'OeNB',country:'Austria',region:'Europe',ngfs:'Member',ngfsSince:2018,climateMandate:'Strong',stressTestReq:true,stressTestYear:2022,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'FMA expectations',capitalBps:20,publications:6,methodology:'Sectoral bottom-up',scenarios:'NGFS aligned',banksTested:8,coverageTrillions:1.1},
  {id:33,name:'National Bank of Poland',code:'NBP',country:'Poland',region:'Europe',ngfs:'Observer',ngfsSince:2021,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Voluntary',prudentialReq:'KNF recommendations',capitalBps:0,publications:2,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:34,name:'Bank of Israel',code:'BoI_IL',country:'Israel',region:'Middle East & Africa',ngfs:'Member',ngfsSince:2021,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'Supervisory letter',capitalBps:0,publications:2,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:35,name:'Saudi Central Bank',code:'SAMA',country:'Saudi Arabia',region:'Middle East & Africa',ngfs:'Member',ngfsSince:2022,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'ESG framework',capitalBps:0,publications:2,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:36,name:'Central Bank of Colombia',code:'BanRep',country:'Colombia',region:'Americas',ngfs:'Member',ngfsSince:2020,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'Green protocol',capitalBps:0,publications:3,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:37,name:'Reserve Bank of New Zealand',code:'RBNZ',country:'New Zealand',region:'Asia-Pacific',ngfs:'Member',ngfsSince:2018,climateMandate:'Moderate',stressTestReq:true,stressTestYear:2023,greenQE:false,greenQEVolBn:0,disclosureRules:'Mandatory',prudentialReq:'Climate-related risk guidance',capitalBps:12,publications:5,methodology:'Scenario analysis',scenarios:'NGFS aligned',banksTested:5,coverageTrillions:0.7},
  {id:38,name:'Central Bank of Nigeria',code:'CBN',country:'Nigeria',region:'Middle East & Africa',ngfs:'Observer',ngfsSince:2022,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Voluntary',prudentialReq:'Sustainable banking principles',capitalBps:0,publications:1,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:39,name:'Central Bank of Turkey',code:'CBRT',country:'Turkey',region:'Europe',ngfs:'Member',ngfsSince:2020,climateMandate:'Emerging',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Proposed',prudentialReq:'Sustainability action plan',capitalBps:0,publications:2,methodology:'Planned',scenarios:'TBD',banksTested:0,coverageTrillions:0},
  {id:40,name:'Bank of Russia',code:'CBR',country:'Russia',region:'Europe',ngfs:'Non-Member',ngfsSince:null,climateMandate:'None',stressTestReq:false,stressTestYear:null,greenQE:false,greenQEVolBn:0,disclosureRules:'Voluntary',prudentialReq:'None',capitalBps:0,publications:1,methodology:'N/A',scenarios:'N/A',banksTested:0,coverageTrillions:0},
];

/* ─── NGFS MEMBERSHIP GROWTH ─── */
const NGFS_GROWTH=QUARTERS.map((q,i)=>({
  quarter:q,
  members:Math.round(72+i*2.8+sr(i*7)*3),
  observers:Math.round(14+i*0.6+sr(i*11)*2),
  publications:Math.round(45+i*8+sr(i*13)*10),
  stressTests:Math.round(12+i*1.5+sr(i*15)*3)
}));

/* ─── STRESS TEST FRAMEWORKS ─── */
const STRESS_FRAMEWORKS=[
  {id:1,cb:'ECB',name:'2022 Climate Stress Test',year:2022,type:'Bottom-up + top-down',banks:104,scenarioAlign:'NGFS aligned',horizonYears:30,sectors:22,physicalRisk:true,transitionRisk:true,litigationRisk:false,passThreshold:'No formal threshold',keyFinding:'Losses +10% under Hot House',nextTest:'2025',methodology:'3 NGFS scenarios, 30yr horizon, credit + market + operational risk',granularity:'Counterparty-level',coverageAssets:'EUR 25tn',dataGaps:'Scope 3 emissions coverage limited to 60%',lossProjection:'+EUR 70bn in Hot House'},
  {id:2,cb:'BoE',name:'CBES 2021',year:2021,type:'Bottom-up exploratory',banks:19,scenarioAlign:'NGFS + bespoke',horizonYears:30,sectors:18,physicalRisk:true,transitionRisk:true,litigationRisk:true,passThreshold:'Exploratory (no P/F)',keyFinding:'Climate losses manageable if early action',nextTest:'2025',methodology:'3 scenarios over 30 years, bottom-up by firm',granularity:'Portfolio-level',coverageAssets:'GBP 6tn',dataGaps:'Physical risk modelling nascent',lossProjection:'+GBP 45bn worst case'},
  {id:3,cb:'Fed',name:'Pilot Climate Scenario Analysis',year:2023,type:'Pilot exploratory',banks:6,scenarioAlign:'Bespoke',horizonYears:10,sectors:12,physicalRisk:true,transitionRisk:true,litigationRisk:false,passThreshold:'Exploratory (no P/F)',keyFinding:'Significant data gaps identified',nextTest:'TBD',methodology:'Physical + transition modules, 1-10yr horizon',granularity:'Aggregate',coverageAssets:'USD 18tn',dataGaps:'Scope 3 data unavailable for most',lossProjection:'Not disclosed'},
  {id:4,cb:'PBoC',name:'Climate Risk Stress Test 2021',year:2021,type:'Top-down macro',banks:23,scenarioAlign:'NGFS aligned',horizonYears:20,sectors:15,physicalRisk:true,transitionRisk:true,litigationRisk:false,passThreshold:'Sector NPL thresholds',keyFinding:'High-carbon sector NPLs could triple',nextTest:'2025',methodology:'Carbon price shock + physical risk scenarios',granularity:'Sector-level',coverageAssets:'CNY 120tn',dataGaps:'Transition pathway data limited',lossProjection:'+CNY 3.4tn under disorderly'},
  {id:5,cb:'MAS',name:'Industry-Wide Stress Test 2022',year:2022,type:'Industry-wide',banks:12,scenarioAlign:'NGFS aligned',horizonYears:25,sectors:16,physicalRisk:true,transitionRisk:true,litigationRisk:false,passThreshold:'Capital adequacy',keyFinding:'Physical risk largest for APAC exposure',nextTest:'2025',methodology:'4 NGFS scenarios, physical + transition pathways',granularity:'Counterparty-level',coverageAssets:'SGD 3.2tn',dataGaps:'Cross-border exposure mapping incomplete',lossProjection:'+SGD 18bn severe scenario'},
  {id:6,cb:'APRA',name:'Climate Vulnerability Assessment',year:2022,type:'Vulnerability assessment',banks:5,scenarioAlign:'NGFS aligned',horizonYears:30,sectors:14,physicalRisk:true,transitionRisk:true,litigationRisk:false,passThreshold:'No formal threshold',keyFinding:'Mortgage book exposed to physical risk',nextTest:'2026',methodology:'2 climate scenarios, housing + corporate portfolios',granularity:'Portfolio-level',coverageAssets:'AUD 4.5tn',dataGaps:'Granular physical risk data limited',lossProjection:'+AUD 35bn property portfolio'},
];

const UPCOMING_TESTS=[
  {cb:'ECB',date:'Q2 2025',scope:'110 banks',focus:'Physical + Transition',newFeatures:'Litigation risk module added'},
  {cb:'BoE',date:'Q3 2025',scope:'22 banks',focus:'Transition focus + nature risk',newFeatures:'Biodiversity loss scenarios'},
  {cb:'MAS',date:'Q3 2025',scope:'15 banks',focus:'Physical + Transition',newFeatures:'Supply chain disruption module'},
  {cb:'PBoC',date:'Q4 2025',scope:'28 banks',focus:'Transition + carbon pricing',newFeatures:'Real estate sector deep-dive'},
  {cb:'APRA',date:'Q1 2026',scope:'8 banks',focus:'Physical risk (bushfire/flood)',newFeatures:'Granular postcode-level analysis'},
  {cb:'BoJ',date:'Q2 2026',scope:'18 banks',focus:'Transition risk',newFeatures:'Supply chain + trade impact'},
  {cb:'BoC',date:'Q2 2026',scope:'10 banks',focus:'Oil & gas transition',newFeatures:'Stranded asset valuation'},
  {cb:'Riksbank',date:'Q3 2026',scope:'9 banks',focus:'Nordic exposure mapping',newFeatures:'Green bond portfolio stress'},
];

/* ─── GREEN MONETARY POLICY ─── */
const GREEN_PROGRAMS=[
  {cb:'ECB',program:'CSPP Climate Tilting',volumeBn:141,startYear:2022,mechanism:'Carbon intensity tilting of corporate bond purchases',carbonReduction:35,coverage:'Investment-grade corporate bonds',status:'Active',monthlyPurchaseBn:4.2},
  {cb:'PBoC',program:'Green Lending Facility',volumeBn:62,startYear:2021,mechanism:'Preferential relending rates for green loans',carbonReduction:28,coverage:'Green project loans',status:'Active',monthlyPurchaseBn:2.1},
  {cb:'BoE',program:'Green Gilt Greening',volumeBn:38,startYear:2021,mechanism:'Greening corporate bond portfolio + green gilts',carbonReduction:22,coverage:'Sterling corporate bonds',status:'Active',monthlyPurchaseBn:1.2},
  {cb:'HKMA',program:'ESG-Tilted EFBN',volumeBn:36,startYear:2022,mechanism:'ESG tilting of Exchange Fund',carbonReduction:18,coverage:'Bond + equity reserves',status:'Active',monthlyPurchaseBn:1.0},
  {cb:'BoJ',program:'Climate Transition Support',volumeBn:28,startYear:2021,mechanism:'Zero-interest loans for climate investments',carbonReduction:15,coverage:'Bank lending to green projects',status:'Active',monthlyPurchaseBn:0.9},
  {cb:'Riksbank',program:'Green Bond Preference',volumeBn:22,startYear:2020,mechanism:'Overweighting green bonds in portfolio',carbonReduction:25,coverage:'Government + corporate bonds',status:'Active',monthlyPurchaseBn:0.7},
  {cb:'BoC',program:'Green Bond Framework',volumeBn:14,startYear:2022,mechanism:'Sustainability criteria for bond purchases',carbonReduction:12,coverage:'Sovereign + agency bonds',status:'Active',monthlyPurchaseBn:0.5},
];

const RESERVE_ESG=[
  {cb:'ECB',esgIntegration:85,carbonFootprintMtCO2:42,greenSharePct:22,exclusions:'Coal >30% revenue',reporting:'TCFD-aligned',reservesBn:840},
  {cb:'Riksbank',esgIntegration:92,carbonFootprintMtCO2:3.1,greenSharePct:28,exclusions:'Fossil fuel + deforestation',reporting:'Full TCFD',reservesBn:62},
  {cb:'BdF',esgIntegration:88,carbonFootprintMtCO2:8.5,greenSharePct:25,exclusions:'Coal + oil sands',reporting:'TCFD-aligned',reservesBn:215},
  {cb:'SNB',esgIntegration:35,carbonFootprintMtCO2:52,greenSharePct:4,exclusions:'Cluster munitions only',reporting:'Limited',reservesBn:890},
  {cb:'HKMA',esgIntegration:72,carbonFootprintMtCO2:18,greenSharePct:14,exclusions:'Thermal coal',reporting:'Annual ESG report',reservesBn:425},
  {cb:'BoJ',esgIntegration:60,carbonFootprintMtCO2:28,greenSharePct:10,exclusions:'None',reporting:'Basic disclosure',reservesBn:1280},
  {cb:'BoC',esgIntegration:68,carbonFootprintMtCO2:12,greenSharePct:9,exclusions:'Coal producers',reporting:'TCFD-aligned',reservesBn:105},
  {cb:'DNB',esgIntegration:90,carbonFootprintMtCO2:2.8,greenSharePct:30,exclusions:'Fossil fuel + tobacco',reporting:'Full TCFD',reservesBn:42},
];

const GREEN_QE_TREND=QUARTERS.map((q,i)=>({
  quarter:q,
  ecb:Math.round(80+i*5.5+sr(i*3)*8),
  pboc:Math.round(30+i*2.8+sr(i*5)*5),
  boe:Math.round(22+i*1.4+sr(i*7)*4),
  hkma:Math.round(18+i*1.6+sr(i*9)*3),
  boj:Math.round(12+i*1.3+sr(i*11)*3),
  total:0
}));
GREEN_QE_TREND.forEach(q=>{q.total=q.ecb+q.pboc+q.boe+q.hkma+q.boj;});

const CARBON_PRICE_SCENARIOS=[
  {scenario:'Orderly Net Zero',price2025:65,price2030:130,price2040:250,price2050:400,policyRate:'+25bps',inflation:'+0.3%',gdpImpact:'-1.4%'},
  {scenario:'Disorderly',price2025:45,price2030:200,price2040:350,price2050:500,policyRate:'+75bps',inflation:'+1.2%',gdpImpact:'-2.5%'},
  {scenario:'Current Policies',price2025:30,price2030:45,price2040:60,price2050:80,policyRate:'Neutral',inflation:'+0.1%',gdpImpact:'-8.1%'},
  {scenario:'NDCs Only',price2025:35,price2030:70,price2040:100,price2050:140,policyRate:'+15bps',inflation:'+0.2%',gdpImpact:'-4.8%'},
];

const COLLATERAL_FRAMEWORKS=[
  {cb:'ECB',greenHaircut:-2,carbonPenalty:'+3%',taxonomyAligned:true,scope:'All eligible collateral',implemented:'2024'},
  {cb:'BoE',greenHaircut:-1.5,carbonPenalty:'+2%',taxonomyAligned:true,scope:'Corporate bonds',implemented:'2023'},
  {cb:'Riksbank',greenHaircut:-1,carbonPenalty:'+1.5%',taxonomyAligned:true,scope:'Corporate + covered bonds',implemented:'2023'},
  {cb:'PBoC',greenHaircut:-3,carbonPenalty:'None',taxonomyAligned:false,scope:'Green project collateral',implemented:'2022'},
  {cb:'BdF',greenHaircut:-2,carbonPenalty:'+2.5%',taxonomyAligned:true,scope:'Via ECB framework',implemented:'2024'},
];

/* ─── INVESTMENT IMPACT ─── */
const SECTOR_IMPACT=[
  {sector:'Utilities',greenTiltImpact:'+8.2%',spreadChange:-45,demandShift:'Strong positive',capitalImpact:'Reduced',lendingChange:'+12%',cbBondBuying:true},
  {sector:'Oil & Gas',greenTiltImpact:'-14.5%',spreadChange:+85,demandShift:'Strong negative',capitalImpact:'Increased',lendingChange:'-22%',cbBondBuying:false},
  {sector:'Renewable Energy',greenTiltImpact:'+18.3%',spreadChange:-62,demandShift:'Very strong positive',capitalImpact:'Reduced',lendingChange:'+28%',cbBondBuying:true},
  {sector:'Automotive (EV)',greenTiltImpact:'+3.1%',spreadChange:-15,demandShift:'Moderate positive',capitalImpact:'Neutral',lendingChange:'+5%',cbBondBuying:true},
  {sector:'Steel & Cement',greenTiltImpact:'-9.8%',spreadChange:+55,demandShift:'Moderate negative',capitalImpact:'Increased',lendingChange:'-15%',cbBondBuying:false},
  {sector:'Real Estate (Green)',greenTiltImpact:'+6.4%',spreadChange:-28,demandShift:'Positive',capitalImpact:'Reduced',lendingChange:'+10%',cbBondBuying:true},
  {sector:'Agriculture',greenTiltImpact:'-4.2%',spreadChange:+28,demandShift:'Mixed',capitalImpact:'Slight increase',lendingChange:'-6%',cbBondBuying:false},
  {sector:'Technology',greenTiltImpact:'+5.8%',spreadChange:-22,demandShift:'Positive',capitalImpact:'Neutral',lendingChange:'+8%',cbBondBuying:true},
  {sector:'Mining',greenTiltImpact:'-11.2%',spreadChange:+72,demandShift:'Negative',capitalImpact:'Increased',lendingChange:'-18%',cbBondBuying:false},
  {sector:'Transport (Green)',greenTiltImpact:'+4.5%',spreadChange:-18,demandShift:'Moderate positive',capitalImpact:'Neutral',lendingChange:'+7%',cbBondBuying:true},
];

const GREEN_BOND_DEMAND=QUARTERS.map((q,i)=>({
  quarter:q,
  cbDemand:Math.round(120+i*12+sr(i*4)*15),
  privateDemand:Math.round(280+i*18+sr(i*6)*25),
  supply:Math.round(350+i*25+sr(i*8)*20),
  spreadBps:Math.round(35-i*1.2+sr(i*10)*8),
  issuanceCount:Math.round(45+i*4+sr(i*12)*8)
}));

const PORTFOLIO_RECS=[
  {action:'Overweight green bonds',rationale:'CB demand creating sustained greenium compression across EUR and GBP markets',conviction:'High',timeframe:'12-18 months',expectedReturn:'+2.1% relative',risk:'Low'},
  {action:'Reduce high-carbon credit exposure',rationale:'Prudential capital add-ons of 20-30bps increasing cost of carry for fossil fuel bonds',conviction:'High',timeframe:'6-12 months',expectedReturn:'+1.4% risk-adjusted',risk:'Medium'},
  {action:'Increase renewable infrastructure debt',rationale:'Green QE programs across 7 CBs boosting demand and compressing spreads',conviction:'Medium-High',timeframe:'12-24 months',expectedReturn:'+3.2% expected',risk:'Medium'},
  {action:'Position for carbon price convergence',rationale:'NGFS scenario alignment driving G20 carbon price coordination',conviction:'Medium',timeframe:'24-36 months',expectedReturn:'+1.8% scenario-weighted',risk:'High'},
  {action:'Favor climate-aligned bank equity',rationale:'Banks with lower climate risk face reduced regulatory capital requirements',conviction:'Medium-High',timeframe:'6-12 months',expectedReturn:'+0.9% spread tightening',risk:'Low'},
  {action:'Hedge physical risk tail exposure',rationale:'Stress tests revealing significant unpriced tail risk in APAC and EM portfolios',conviction:'High',timeframe:'Ongoing',expectedReturn:'Risk reduction -15% VaR',risk:'Low'},
  {action:'Long green sovereign bonds',rationale:'Green gilt and sovereign green bond programs expanding rapidly with CB support',conviction:'Medium-High',timeframe:'6-12 months',expectedReturn:'+0.6% vs conventional',risk:'Low'},
  {action:'Short stranded asset exposure',rationale:'Accelerating coal phase-out timelines from CB prudential pressure',conviction:'Medium',timeframe:'12-24 months',expectedReturn:'+2.8% if disorderly',risk:'High'},
];

const CAPITAL_RW_DATA=[
  {category:'Green mortgages',currentRW:35,proposedRW:28,change:-7},
  {category:'Fossil fuel project finance',currentRW:100,proposedRW:130,change:+30},
  {category:'Renewable infrastructure',currentRW:75,proposedRW:55,change:-20},
  {category:'High-carbon corporates',currentRW:100,proposedRW:118,change:+18},
  {category:'Green bonds (bank book)',currentRW:20,proposedRW:12,change:-8},
  {category:'Transition loans',currentRW:85,proposedRW:70,change:-15},
];

const POLICY_EVOLUTION=QUARTERS.map((q,i)=>({
  quarter:q,
  mandateStrength:Math.round(52+i*2.2+sr(i*20)*4),
  stressTestCoverage:Math.round(38+i*3.1+sr(i*22)*5),
  disclosureScope:Math.round(45+i*2.8+sr(i*24)*4),
  prudentialIntegration:Math.round(28+i*3.5+sr(i*26)*6),
  greenQEVolume:Math.round(180+i*22+sr(i*28)*18),
}));

const NGFS_SCENARIOS=[
  {scenario:'Net Zero 2050',category:'Orderly',tempC:1.5,physRisk:'Low',transRisk:'High',gdp2050:-1.4,fsStability:'Manageable',carbonPrice2030:130},
  {scenario:'Below 2C',category:'Orderly',tempC:1.7,physRisk:'Low-Med',transRisk:'Medium',gdp2050:-1.0,fsStability:'Manageable',carbonPrice2030:90},
  {scenario:'Divergent Net Zero',category:'Disorderly',tempC:1.6,physRisk:'Low',transRisk:'Very High',gdp2050:-2.5,fsStability:'Stressed',carbonPrice2030:200},
  {scenario:'Delayed Transition',category:'Disorderly',tempC:1.8,physRisk:'Medium',transRisk:'High',gdp2050:-3.8,fsStability:'Stressed',carbonPrice2030:180},
  {scenario:'NDCs',category:'Hot House',tempC:2.6,physRisk:'High',transRisk:'Low',gdp2050:-4.8,fsStability:'At Risk',carbonPrice2030:50},
  {scenario:'Current Policies',category:'Hot House',tempC:3.0,physRisk:'Very High',transRisk:'Low',gdp2050:-8.1,fsStability:'Severe',carbonPrice2030:30},
];

const REGIONAL_SUMMARY=[
  {region:'Europe',cbs:18,mandateAvg:'Strong',stressTestPct:78,greenQEPct:22,avgCapital:21,publications:142},
  {region:'Asia-Pacific',cbs:12,mandateAvg:'Moderate',stressTestPct:58,greenQEPct:25,avgCapital:12,publications:68},
  {region:'Americas',cbs:5,mandateAvg:'Emerging',stressTestPct:40,greenQEPct:20,avgCapital:8,publications:30},
  {region:'Middle East & Africa',cbs:5,mandateAvg:'Emerging',stressTestPct:0,greenQEPct:0,avgCapital:0,publications:13},
];

const TABS=['Central Bank Landscape','Climate Stress Testing','Green Monetary Policy','Investment Impact'];

/* ─── SHARED COMPONENTS ─── */
const KPI=({label,value,sub,color})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:1,minWidth:155}}>
    <div style={{fontSize:11,color:T.textMut,marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',fontFamily:T.mono}}>{label}</div>
    <div style={{fontSize:26,fontWeight:700,color:color||T.navy,lineHeight:1.1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:4}}>{sub}</div>}
  </div>
);

const Badge=({v,map})=>{
  const cfg=map[v]||{bg:'#f3f4f6',color:T.textSec};
  return <span style={{background:cfg.bg,color:cfg.color,borderRadius:5,padding:'2px 8px',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}}>{v}</span>;
};

const ngfsMap={'Member':{bg:'#dcfce7',color:T.green},'Observer':{bg:'#fef9c3',color:T.amber},'Non-Member':{bg:'#fee2e2',color:T.red}};
const mandateMap={'Strong':{bg:'#dbeafe',color:'#1d4ed8'},'Moderate':{bg:'#fef9c3',color:T.amber},'Emerging':{bg:'#fed7aa',color:'#c2410c'},'None':{bg:'#fee2e2',color:T.red}};
const boolBadge={true:{bg:'#dcfce7',color:T.green},false:{bg:'#fee2e2',color:T.red}};
const discMap={'Mandatory':{bg:'#dcfce7',color:T.green},'Proposed':{bg:'#fef9c3',color:T.amber},'Voluntary':{bg:'#fee2e2',color:T.red}};

const thStyle={padding:'10px 12px',textAlign:'left',fontSize:11,color:T.textSec,fontWeight:600,whiteSpace:'nowrap',fontFamily:T.mono};
const tdStyle={padding:'10px 12px'};

/* ─── TAB 1: CENTRAL BANK LANDSCAPE ─── */
function Tab1({onSelect}){
  const [regionF,setRegionF]=useState('All');
  const [ngfsF,setNgfsF]=useState('All');
  const [mandateF,setMandateF]=useState('All');
  const [sort,setSort]=useState('name');
  const [sortDir,setSortDir]=useState(1);
  const [search,setSearch]=useState('');

  const filtered=useMemo(()=>{
    let d=CENTRAL_BANKS.filter(cb=>{
      if(regionF!=='All'&&cb.region!==regionF)return false;
      if(ngfsF!=='All'&&cb.ngfs!==ngfsF)return false;
      if(mandateF!=='All'&&cb.climateMandate!==mandateF)return false;
      if(search&&!cb.name.toLowerCase().includes(search.toLowerCase())&&!cb.code.toLowerCase().includes(search.toLowerCase())&&!cb.country.toLowerCase().includes(search.toLowerCase()))return false;
      return true;
    });
    d.sort((a,b)=>{
      let va=a[sort],vb=b[sort];
      if(typeof va==='string')return va.localeCompare(vb)*sortDir;
      return((va||0)-(vb||0))*sortDir;
    });
    return d;
  },[regionF,ngfsF,mandateF,sort,sortDir,search]);

  const doSort=col=>{if(sort===col)setSortDir(-sortDir);else{setSort(col);setSortDir(1);}};
  const arrow=col=>sort===col?(sortDir===1?' \u25B2':' \u25BC'):'';

  const radarData=useMemo(()=>{
    const dims=['Mandate','Stress Test','Disclosure','Prudential','Green QE'];
    return filtered.slice(0,6).map(cb=>({
      name:cb.code,
      data:dims.map((d,i)=>{
        if(i===0)return{dim:d,val:cb.climateMandate==='Strong'?95:cb.climateMandate==='Moderate'?65:cb.climateMandate==='Emerging'?35:10};
        if(i===1)return{dim:d,val:cb.stressTestReq?85+sr(cb.id*3)*15:15+sr(cb.id*5)*15};
        if(i===2)return{dim:d,val:cb.disclosureRules==='Mandatory'?90:cb.disclosureRules==='Proposed'?55:25};
        if(i===3)return{dim:d,val:Math.min(100,cb.capitalBps*3.2+sr(cb.id*7)*10)};
        return{dim:d,val:cb.greenQE?70+sr(cb.id*9)*25:10+sr(cb.id*11)*15};
      })
    }));
  },[filtered]);

  const RADAR_COLORS=[T.navy,T.gold,T.sage,'#7c3aed',T.red,'#0891b2'];

  const mandateDist=useMemo(()=>{
    const counts={};
    CENTRAL_BANKS.forEach(cb=>{counts[cb.climateMandate]=(counts[cb.climateMandate]||0)+1;});
    return Object.entries(counts).map(([k,v])=>({name:k,value:v}));
  },[]);

  const regionDist=useMemo(()=>{
    const counts={};
    CENTRAL_BANKS.forEach(cb=>{counts[cb.region]=(counts[cb.region]||0)+1;});
    return Object.entries(counts).map(([k,v])=>({name:k,value:v}));
  },[]);

  const PIE_COLORS=[T.navy,T.gold,T.sage,T.red,'#7c3aed'];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
        <KPI label="Central Banks Tracked" value="40" sub="across 5 regions" color={T.navy}/>
        <KPI label="NGFS Members" value={CENTRAL_BANKS.filter(c=>c.ngfs==='Member').length} sub={`${Math.round(CENTRAL_BANKS.filter(c=>c.ngfs==='Member').length/40*100)}% of tracked`} color={T.green}/>
        <KPI label="Stress Test Mandates" value={CENTRAL_BANKS.filter(c=>c.stressTestReq).length} sub="jurisdictions with requirements" color={T.gold}/>
        <KPI label="Green QE Programs" value={CENTRAL_BANKS.filter(c=>c.greenQE).length} sub={`EUR ${Math.round(CENTRAL_BANKS.reduce((s,c)=>s+c.greenQEVolBn,0))}bn total volume`} color={T.sage}/>
        <KPI label="Mandatory Disclosure" value={CENTRAL_BANKS.filter(c=>c.disclosureRules==='Mandatory').length} sub="jurisdictions" color={T.teal}/>
      </div>

      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,fontWeight:600}}>FILTERS:</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search central banks..." style={{fontSize:12,padding:'5px 10px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontFamily:T.font,width:180}}/>
        {[['Region',REGIONS,regionF,setRegionF],['NGFS',NGFS_FILTER,ngfsF,setNgfsF],['Mandate',MANDATE_FILTER,mandateF,setMandateF]].map(([lbl,opts,val,setVal])=>(
          <select key={lbl} value={val} onChange={e=>setVal(e.target.value)} style={{fontSize:12,padding:'5px 10px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontFamily:T.font}}>
            {opts.map(o=><option key={o} value={o}>{lbl}: {o}</option>)}
          </select>
        ))}
        <span style={{fontSize:11,color:T.textMut,marginLeft:'auto',fontFamily:T.mono}}>{filtered.length} of {CENTRAL_BANKS.length} central banks</span>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
            <thead>
              <tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.borderL}`}}>
                {[['code','Code'],['country','Country'],['region','Region'],['ngfs','NGFS'],['climateMandate','Mandate'],['stressTestReq','Stress Test'],['greenQE','Green QE'],['greenQEVolBn','QE Vol (bn)'],['disclosureRules','Disclosure'],['capitalBps','Capital (bps)']].map(([col,lbl])=>(
                  <th key={col} onClick={()=>doSort(col)} style={{...thStyle,cursor:'pointer'}}>{lbl}{arrow(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(cb=>(
                <tr key={cb.id} onClick={()=>onSelect(cb)} style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{...tdStyle,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{cb.code}</td>
                  <td style={{...tdStyle,color:T.text}}>{cb.country}</td>
                  <td style={{...tdStyle,fontSize:11,color:T.textSec}}>{cb.region}</td>
                  <td style={tdStyle}><Badge v={cb.ngfs} map={ngfsMap}/></td>
                  <td style={tdStyle}><Badge v={cb.climateMandate} map={mandateMap}/></td>
                  <td style={tdStyle}><Badge v={cb.stressTestReq?'Required':'No'} map={{'Required':boolBadge[true],'No':boolBadge[false]}}/></td>
                  <td style={tdStyle}><Badge v={cb.greenQE?'Active':'None'} map={{'Active':boolBadge[true],'None':boolBadge[false]}}/></td>
                  <td style={{...tdStyle,fontFamily:T.mono,fontWeight:600,color:cb.greenQEVolBn>0?T.navy:T.textMut}}>{cb.greenQEVolBn>0?'\u20AC'+cb.greenQEVolBn:'\u2014'}</td>
                  <td style={tdStyle}><Badge v={cb.disclosureRules} map={discMap}/></td>
                  <td style={{...tdStyle,fontFamily:T.mono,fontWeight:600,color:cb.capitalBps>0?T.navy:T.textMut}}>{cb.capitalBps>0?cb.capitalBps:'\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>NGFS Membership & Publications Growth</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={NGFS_GROWTH}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}} axisLine={{stroke:T.border}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}} axisLine={{stroke:T.border}}/>
              <Tooltip contentStyle={tip}/>
              <Area type="monotone" dataKey="members" stackId="1" fill={T.sage} stroke={T.sage} fillOpacity={0.5} name="Members"/>
              <Area type="monotone" dataKey="observers" stackId="1" fill={T.gold} stroke={T.gold} fillOpacity={0.4} name="Observers"/>
              <Line type="monotone" dataKey="publications" stroke={T.navy} strokeWidth={2} dot={false} name="Publications"/>
              <Legend wrapperStyle={{fontSize:11}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Policy Maturity Radar (Top 6)</div>
          {radarData.length>0&&(
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData[0].data}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
                <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/>
                {radarData.map((rd,i)=>(
                  <Radar key={rd.name} name={rd.name} dataKey="val" data={rd.data} stroke={RADAR_COLORS[i%RADAR_COLORS.length]} fill={RADAR_COLORS[i%RADAR_COLORS.length]} fillOpacity={0.08}/>
                ))}
                <Legend wrapperStyle={{fontSize:10}}/>
                <Tooltip contentStyle={tip}/>
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Global Policy Evolution Index (Quarterly)</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={POLICY_EVOLUTION}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/>
            <Tooltip contentStyle={tip}/>
            <Line type="monotone" dataKey="mandateStrength" stroke={T.navy} strokeWidth={2} dot={false} name="Mandate Strength"/>
            <Line type="monotone" dataKey="stressTestCoverage" stroke={T.gold} strokeWidth={2} dot={false} name="Stress Test Coverage"/>
            <Line type="monotone" dataKey="disclosureScope" stroke={T.sage} strokeWidth={2} dot={false} name="Disclosure Scope"/>
            <Line type="monotone" dataKey="prudentialIntegration" stroke="#7c3aed" strokeWidth={2} dot={false} name="Prudential Integration"/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Regional Summary</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.borderL}`}}>
                {['Region','Central Banks','Avg Mandate','Stress Test %','Green QE %','Avg Capital (bps)','Publications'].map(h=>(
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REGIONAL_SUMMARY.map((r,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{...tdStyle,fontWeight:600,color:T.navy}}>{r.region}</td>
                  <td style={{...tdStyle,fontFamily:T.mono,fontWeight:600,textAlign:'center'}}>{r.cbs}</td>
                  <td style={tdStyle}><Badge v={r.mandateAvg} map={mandateMap}/></td>
                  <td style={tdStyle}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:50,height:5,borderRadius:3,background:T.border}}>
                        <div style={{width:`${r.stressTestPct}%`,height:'100%',borderRadius:3,background:r.stressTestPct>=60?T.sage:r.stressTestPct>=30?T.gold:T.red}}/>
                      </div>
                      <span style={{fontFamily:T.mono,fontSize:11}}>{r.stressTestPct}%</span>
                    </div>
                  </td>
                  <td style={{...tdStyle,fontFamily:T.mono}}>{r.greenQEPct}%</td>
                  <td style={{...tdStyle,fontFamily:T.mono,color:r.avgCapital>0?T.navy:T.textMut}}>{r.avgCapital>0?r.avgCapital:'\u2014'}</td>
                  <td style={{...tdStyle,fontFamily:T.mono}}>{r.publications}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Mandate Strength Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={mandateDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value})=>`${name}: ${value}`} labelLine={true} style={{fontSize:11}}>
                {mandateDist.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={tip}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Regional Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionDist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={tip}/>
              <Bar dataKey="value" name="Central Banks" radius={[4,4,0,0]}>
                {regionDist.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ─── DETAIL PANEL ─── */
function DetailPanel({cb,onClose}){
  const timeline=[
    {year:cb.ngfsSince||2022,event:'Joined NGFS',detail:`Became ${cb.ngfs} of the Network for Greening the Financial System`},
    cb.stressTestYear?{year:cb.stressTestYear,event:'First Climate Stress Test',detail:`${cb.methodology} methodology covering ${cb.banksTested} banks, ${cb.scenarios} scenarios`}:null,
    {year:2023,event:'Climate Research Publications',detail:`Published ${cb.publications} climate-related research papers and supervisory guidance`},
    cb.greenQE?{year:2022,event:'Green Purchase Program Launch',detail:`Green bond / asset purchase program with total volume EUR ${cb.greenQEVolBn}bn`}:null,
    cb.capitalBps>0?{year:2024,event:'Prudential Capital Requirements',detail:`${cb.prudentialReq} imposing ${cb.capitalBps} bps climate capital add-on`}:null,
    {year:2025,event:'Current Assessment Period',detail:`Ongoing policy evolution across mandate, disclosure, and supervisory framework`},
  ].filter(Boolean).sort((a,b)=>a.year-b.year);

  const dims=['Mandate Strength','Stress Testing','Disclosure Rules','Prudential Framework','Green QE Activity'];
  const radarSingle=dims.map((d,i)=>{
    if(i===0)return{dim:d,val:cb.climateMandate==='Strong'?95:cb.climateMandate==='Moderate'?65:cb.climateMandate==='Emerging'?35:10};
    if(i===1)return{dim:d,val:cb.stressTestReq?85+sr(cb.id*3)*10:15};
    if(i===2)return{dim:d,val:cb.disclosureRules==='Mandatory'?90:cb.disclosureRules==='Proposed'?55:25};
    if(i===3)return{dim:d,val:Math.min(100,cb.capitalBps*3+sr(cb.id*7)*10)};
    return{dim:d,val:cb.greenQE?75+sr(cb.id*9)*20:10};
  });

  const policyScore=Math.round(radarSingle.reduce((s,r)=>s+r.val,0)/radarSingle.length);

  return (
    <div style={{position:'fixed',top:0,right:0,width:540,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.gold}`,zIndex:1000,overflowY:'auto',padding:24,boxShadow:'-4px 0 24px rgba(0,0,0,0.12)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:T.navy}}>{cb.name}</div>
          <div style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>{cb.code} \u2022 {cb.country} \u2022 {cb.region}</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:`1px solid ${T.border}`,borderRadius:8,padding:'6px 14px',cursor:'pointer',color:T.textSec,fontSize:12,fontWeight:600}}>Close \u2715</button>
      </div>

      <div style={{background:T.bg,borderRadius:10,padding:14,marginBottom:16,textAlign:'center'}}>
        <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>OVERALL POLICY MATURITY SCORE</div>
        <div style={{fontSize:36,fontWeight:700,color:policyScore>=70?T.sage:policyScore>=45?T.gold:T.red}}>{policyScore}/100</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
        {[
          ['NGFS STATUS',<Badge v={cb.ngfs} map={ngfsMap}/>,cb.ngfsSince?`Since ${cb.ngfsSince}`:null],
          ['CLIMATE MANDATE',<Badge v={cb.climateMandate} map={mandateMap}/>,null],
          ['STRESS TEST',<Badge v={cb.stressTestReq?'Required':'Not Required'} map={{'Required':boolBadge[true],'Not Required':boolBadge[false]}}/>,cb.stressTestReq?`${cb.banksTested} banks tested`:null],
          ['DISCLOSURE',<Badge v={cb.disclosureRules} map={discMap}/>,null],
        ].map(([lbl,badge,extra],i)=>(
          <div key={i} style={{background:T.bg,borderRadius:8,padding:12}}>
            <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{lbl}</div>
            {badge}
            {extra&&<div style={{fontSize:10,color:T.textSec,marginTop:4}}>{extra}</div>}
          </div>
        ))}
      </div>

      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Policy Maturity Radar</div>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarSingle}>
            <PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/>
            <PolarRadiusAxis tick={{fontSize:8,fill:T.textMut}} domain={[0,100]}/>
            <Radar dataKey="val" stroke={T.navy} fill={T.navy} fillOpacity={0.15}/>
            <Tooltip contentStyle={tip}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Policy Timeline</div>
        {timeline.map((t,i)=>(
          <div key={i} style={{display:'flex',gap:12,marginBottom:14,paddingLeft:12,borderLeft:`2px solid ${T.gold}`}}>
            <div style={{fontSize:12,fontWeight:700,color:T.gold,fontFamily:T.mono,minWidth:40}}>{t.year}</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{t.event}</div>
              <div style={{fontSize:11,color:T.textSec,lineHeight:1.5}}>{t.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:10}}>Key Details</div>
        <div style={{fontSize:12,color:T.textSec,lineHeight:1.8}}>
          <div><strong>Prudential Requirement:</strong> {cb.prudentialReq}</div>
          <div><strong>Capital Add-on:</strong> {cb.capitalBps>0?cb.capitalBps+' bps':'Not applicable'}</div>
          <div><strong>Publications:</strong> {cb.publications} climate-related papers</div>
          {cb.greenQE&&<div><strong>Green QE Volume:</strong> EUR {cb.greenQEVolBn}bn</div>}
          <div><strong>Stress Test Methodology:</strong> {cb.methodology}</div>
          <div><strong>Scenario Alignment:</strong> {cb.scenarios}</div>
          {cb.coverageTrillions>0&&<div><strong>Asset Coverage:</strong> {cb.coverageTrillions}tn</div>}
        </div>
      </div>
    </div>
  );
}

/* ─── TAB 2: CLIMATE STRESS TESTING ─── */
function Tab2(){
  const [selFw,setSelFw]=useState(null);

  const compChart=STRESS_FRAMEWORKS.map(f=>({name:f.cb,banks:f.banks,horizon:f.horizonYears,sectors:f.sectors}));

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
        <KPI label="Active Frameworks" value={STRESS_FRAMEWORKS.length} sub="major CB stress test programs" color={T.navy}/>
        <KPI label="Banks Tested" value={STRESS_FRAMEWORKS.reduce((s,f)=>s+f.banks,0)} sub="across all frameworks" color={T.gold}/>
        <KPI label="Avg Horizon" value={Math.round(STRESS_FRAMEWORKS.reduce((s,f)=>s+f.horizonYears,0)/STRESS_FRAMEWORKS.length)+' yrs'} sub="scenario projection period" color={T.sage}/>
        <KPI label="Upcoming Tests" value={UPCOMING_TESTS.length} sub="scheduled 2025-2026" color={T.teal}/>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Methodology Comparison Matrix</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.borderL}`}}>
                {['CB','Framework','Type','Banks','Horizon','Scenarios','Phys.','Trans.','Litig.','Key Finding'].map(h=>(
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STRESS_FRAMEWORKS.map(f=>(
                <tr key={f.id} onClick={()=>setSelFw(selFw===f.id?null:f.id)} style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',background:selFw===f.id?T.surfaceH:'transparent'}} onMouseEnter={e=>{if(selFw!==f.id)e.currentTarget.style.background=T.surfaceH}} onMouseLeave={e=>{if(selFw!==f.id)e.currentTarget.style.background='transparent'}}>
                  <td style={{...tdStyle,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{f.cb}</td>
                  <td style={{...tdStyle,color:T.text,maxWidth:160}}>{f.name}</td>
                  <td style={{...tdStyle,fontSize:11,color:T.textSec}}>{f.type}</td>
                  <td style={{...tdStyle,fontFamily:T.mono,fontWeight:600,textAlign:'center'}}>{f.banks}</td>
                  <td style={{...tdStyle,fontFamily:T.mono,textAlign:'center'}}>{f.horizonYears}yr</td>
                  <td style={tdStyle}><Badge v={f.scenarioAlign} map={{'NGFS aligned':{bg:'#dcfce7',color:T.green},'NGFS + bespoke':{bg:'#dbeafe',color:'#1d4ed8'},'Bespoke':{bg:'#fef9c3',color:T.amber}}}/></td>
                  <td style={{...tdStyle,textAlign:'center',color:f.physicalRisk?T.green:T.red}}>{f.physicalRisk?'\u2713':'\u2717'}</td>
                  <td style={{...tdStyle,textAlign:'center',color:f.transitionRisk?T.green:T.red}}>{f.transitionRisk?'\u2713':'\u2717'}</td>
                  <td style={{...tdStyle,textAlign:'center',color:f.litigationRisk?T.green:T.red}}>{f.litigationRisk?'\u2713':'\u2717'}</td>
                  <td style={{...tdStyle,fontSize:11,color:T.textSec,maxWidth:180}}>{f.keyFinding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selFw&&(()=>{
          const f=STRESS_FRAMEWORKS.find(x=>x.id===selFw);
          if(!f)return null;
          return (
            <div style={{marginTop:16,padding:16,background:T.bg,borderRadius:10,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>{f.cb}: {f.name} \u2014 Detailed Breakdown</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,fontSize:12}}>
                {[
                  ['METHODOLOGY',f.methodology],['GRANULARITY',f.granularity],['ASSET COVERAGE',f.coverageAssets],
                  ['PASS/FAIL THRESHOLD',f.passThreshold],['SECTORS COVERED',f.sectors+' sectors'],['NEXT TEST',f.nextTest],
                  ['DATA GAPS',f.dataGaps],['LOSS PROJECTION',f.lossProjection],['SCENARIO ALIGNMENT',f.scenarioAlign],
                ].map(([lbl,val],i)=>(
                  <div key={i}>
                    <span style={{color:T.textMut,fontFamily:T.mono,fontSize:10,display:'block',marginBottom:2}}>{lbl}</span>
                    <span style={{color:T.text}}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Framework Scale Comparison</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={compChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={50}/>
              <Tooltip contentStyle={tip}/>
              <Bar dataKey="banks" fill={T.navy} name="Banks Tested" radius={[0,4,4,0]}/>
              <Bar dataKey="sectors" fill={T.gold} name="Sectors Covered" radius={[0,4,4,0]}/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Upcoming Stress Tests (2025-2026)</div>
          <div style={{overflowY:'auto',maxHeight:240}}>
            {UPCOMING_TESTS.map((t,i)=>(
              <div key={i} style={{padding:'10px 12px',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{t.cb}</span>
                  <span style={{background:T.surfaceH,padding:'2px 8px',borderRadius:5,fontSize:11,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{t.date}</span>
                </div>
                <div style={{fontSize:11,color:T.textSec}}>{t.focus} \u2022 {t.scope}</div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>New: {t.newFeatures}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Scenario Alignment & Coverage Summary</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
          {[
            {label:'NGFS Aligned',count:STRESS_FRAMEWORKS.filter(f=>f.scenarioAlign==='NGFS aligned').length,color:T.green},
            {label:'NGFS + Bespoke',count:STRESS_FRAMEWORKS.filter(f=>f.scenarioAlign==='NGFS + bespoke').length,color:'#1d4ed8'},
            {label:'Bespoke Only',count:STRESS_FRAMEWORKS.filter(f=>f.scenarioAlign==='Bespoke').length,color:T.amber},
            {label:'Phys + Trans + Litig',count:STRESS_FRAMEWORKS.filter(f=>f.physicalRisk&&f.transitionRisk&&f.litigationRisk).length,color:T.navy},
            {label:'Total Banks Scope',count:STRESS_FRAMEWORKS.reduce((s,f)=>s+f.banks,0),color:T.sage},
          ].map(s=>(
            <div key={s.label} style={{background:T.bg,borderRadius:8,padding:14,textAlign:'center'}}>
              <div style={{fontSize:28,fontWeight:700,color:s.color}}>{s.count}</div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>NGFS Reference Scenarios</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.borderL}`}}>
                {['Scenario','Category','Temp (\u00B0C)','Physical Risk','Transition Risk','GDP 2050','Financial Stability','Carbon 2030 ($/t)'].map(h=>(
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NGFS_SCENARIOS.map((s,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{...tdStyle,fontWeight:600,color:T.navy}}>{s.scenario}</td>
                  <td style={tdStyle}><Badge v={s.category} map={{'Orderly':{bg:'#dcfce7',color:T.green},'Disorderly':{bg:'#fed7aa',color:'#c2410c'},'Hot House':{bg:'#fee2e2',color:T.red}}}/></td>
                  <td style={{...tdStyle,fontFamily:T.mono,fontWeight:600,color:s.tempC<=1.6?T.green:s.tempC<=2.0?T.amber:T.red}}>{s.tempC}\u00B0</td>
                  <td style={tdStyle}><Badge v={s.physRisk} map={{'Low':{bg:'#dcfce7',color:T.green},'Low-Med':{bg:'#d1fae5',color:'#059669'},'Medium':{bg:'#fef9c3',color:T.amber},'High':{bg:'#fed7aa',color:'#c2410c'},'Very High':{bg:'#fee2e2',color:T.red}}}/></td>
                  <td style={tdStyle}><Badge v={s.transRisk} map={{'Low':{bg:'#dcfce7',color:T.green},'Medium':{bg:'#fef9c3',color:T.amber},'High':{bg:'#fed7aa',color:'#c2410c'},'Very High':{bg:'#fee2e2',color:T.red}}}/></td>
                  <td style={{...tdStyle,fontFamily:T.mono,color:T.red,fontWeight:600}}>{s.gdp2050}%</td>
                  <td style={tdStyle}><Badge v={s.fsStability} map={{'Manageable':{bg:'#dcfce7',color:T.green},'Stressed':{bg:'#fef9c3',color:T.amber},'At Risk':{bg:'#fed7aa',color:'#c2410c'},'Severe':{bg:'#fee2e2',color:T.red}}}/></td>
                  <td style={{...tdStyle,fontFamily:T.mono,fontWeight:600}}>${s.carbonPrice2030}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>NGFS Scenario Temperature vs GDP Impact</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={NGFS_SCENARIOS}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="scenario" tick={{fontSize:9,fill:T.textSec}} angle={-10} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip contentStyle={tip}/>
            <Bar dataKey="gdp2050" name="GDP Impact 2050 (%)" radius={[4,4,0,0]}>
              {NGFS_SCENARIOS.map((s,i)=><Cell key={i} fill={s.gdp2050>=-2?T.sage:s.gdp2050>=-5?T.amber:T.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Global Stress Test Activity Trend</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={NGFS_GROWTH}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip contentStyle={tip}/>
            <Line type="monotone" dataKey="stressTests" stroke={T.navy} strokeWidth={2} dot={{r:3,fill:T.navy}} name="Active Stress Tests"/>
            <Line type="monotone" dataKey="publications" stroke={T.gold} strokeWidth={2} dot={false} name="Publications"/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── TAB 3: GREEN MONETARY POLICY ─── */
function Tab3(){
  const [selProgram,setSelProgram]=useState(null);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
        <KPI label="Green QE Total" value={'\u20AC'+GREEN_PROGRAMS.reduce((s,p)=>s+p.volumeBn,0)+'bn'} sub="across 7 programs" color={T.navy}/>
        <KPI label="Avg Carbon Reduction" value={Math.round(GREEN_PROGRAMS.reduce((s,p)=>s+p.carbonReduction,0)/GREEN_PROGRAMS.length)+'%'} sub="portfolio weighted intensity" color={T.sage}/>
        <KPI label="Reserve ESG Score" value={Math.round(RESERVE_ESG.reduce((s,r)=>s+r.esgIntegration,0)/RESERVE_ESG.length)+'/100'} sub="average across 8 CBs" color={T.gold}/>
        <KPI label="Green Collateral Frameworks" value={COLLATERAL_FRAMEWORKS.length} sub="CBs with green haircut benefits" color={T.teal}/>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Green Bond Purchase Programs</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.borderL}`}}>
                {['CB','Program','Vol (EUR bn)','Monthly (bn)','Start','Mechanism','Carbon Red.','Status'].map(h=>(
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GREEN_PROGRAMS.map((p,i)=>(
                <tr key={i} onClick={()=>setSelProgram(selProgram===i?null:i)} style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',background:selProgram===i?T.surfaceH:'transparent'}} onMouseEnter={e=>{if(selProgram!==i)e.currentTarget.style.background=T.surfaceH}} onMouseLeave={e=>{if(selProgram!==i)e.currentTarget.style.background='transparent'}}>
                  <td style={{...tdStyle,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{p.cb}</td>
                  <td style={{...tdStyle,color:T.text}}>{p.program}</td>
                  <td style={{...tdStyle,fontFamily:T.mono,fontWeight:600}}>{p.volumeBn}</td>
                  <td style={{...tdStyle,fontFamily:T.mono}}>{p.monthlyPurchaseBn}</td>
                  <td style={{...tdStyle,fontFamily:T.mono}}>{p.startYear}</td>
                  <td style={{...tdStyle,fontSize:11,color:T.textSec,maxWidth:200}}>{p.mechanism}</td>
                  <td style={{...tdStyle,fontFamily:T.mono,color:T.green,fontWeight:600}}>-{p.carbonReduction}%</td>
                  <td style={tdStyle}><Badge v={p.status} map={{'Active':{bg:'#dcfce7',color:T.green}}}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Green QE Volume Trend (EUR bn)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={GREEN_QE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={tip}/>
              <Area type="monotone" dataKey="ecb" stackId="1" fill={T.navy} stroke={T.navy} fillOpacity={0.4} name="ECB"/>
              <Area type="monotone" dataKey="pboc" stackId="1" fill={T.red} stroke={T.red} fillOpacity={0.3} name="PBoC"/>
              <Area type="monotone" dataKey="boe" stackId="1" fill={T.gold} stroke={T.gold} fillOpacity={0.3} name="BoE"/>
              <Area type="monotone" dataKey="hkma" stackId="1" fill={T.sage} stroke={T.sage} fillOpacity={0.3} name="HKMA"/>
              <Area type="monotone" dataKey="boj" stackId="1" fill="#7c3aed" stroke="#7c3aed" fillOpacity={0.3} name="BoJ"/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Reserve ESG Integration Scores</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...RESERVE_ESG].sort((a,b)=>b.esgIntegration-a.esgIntegration)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="cb" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/>
              <Tooltip contentStyle={tip}/>
              <Bar dataKey="esgIntegration" name="ESG Score" radius={[4,4,0,0]}>
                {[...RESERVE_ESG].sort((a,b)=>b.esgIntegration-a.esgIntegration).map((r,i)=>(
                  <Cell key={i} fill={r.esgIntegration>=80?T.sage:r.esgIntegration>=60?T.gold:T.red}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Reserve Management & Carbon Footprint</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.borderL}`}}>
                {['CB','ESG Score','Carbon (MtCO2)','Green %','Reserves (bn)','Exclusions','Reporting'].map(h=>(
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESERVE_ESG.map((r,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{...tdStyle,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{r.cb}</td>
                  <td style={tdStyle}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:60,height:6,borderRadius:3,background:T.border}}>
                        <div style={{width:`${r.esgIntegration}%`,height:'100%',borderRadius:3,background:r.esgIntegration>=80?T.sage:r.esgIntegration>=60?T.gold:T.red}}/>
                      </div>
                      <span style={{fontFamily:T.mono,fontSize:11}}>{r.esgIntegration}</span>
                    </div>
                  </td>
                  <td style={{...tdStyle,fontFamily:T.mono,color:r.carbonFootprintMtCO2>20?T.red:r.carbonFootprintMtCO2>10?T.amber:T.green,fontWeight:600}}>{r.carbonFootprintMtCO2}</td>
                  <td style={{...tdStyle,fontFamily:T.mono}}>{r.greenSharePct}%</td>
                  <td style={{...tdStyle,fontFamily:T.mono}}>\u20AC{r.reservesBn}</td>
                  <td style={{...tdStyle,fontSize:11,color:T.textSec}}>{r.exclusions}</td>
                  <td style={tdStyle}><Badge v={r.reporting} map={{'Full TCFD':{bg:'#dcfce7',color:T.green},'TCFD-aligned':{bg:'#dbeafe',color:'#1d4ed8'},'Annual ESG report':{bg:'#fef9c3',color:T.amber},'Basic disclosure':{bg:'#fed7aa',color:'#c2410c'},'Limited':{bg:'#fee2e2',color:T.red}}}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Total Green QE Volume Trend (EUR bn)</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={GREEN_QE_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip contentStyle={tip}/>
            <Area type="monotone" dataKey="total" fill={T.navy} stroke={T.navy} fillOpacity={0.2} name="Total Green QE (EUR bn)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Carbon Price Trajectory by Scenario ($/tonne CO2)</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={[
            {year:'2025',orderly:65,disorderly:45,current:30,ndcs:35},
            {year:'2030',orderly:130,disorderly:200,current:45,ndcs:70},
            {year:'2040',orderly:250,disorderly:350,current:60,ndcs:100},
            {year:'2050',orderly:400,disorderly:500,current:80,ndcs:140},
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} label={{value:'$/tCO2',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textMut}}}/>
            <Tooltip contentStyle={tip}/>
            <Line type="monotone" dataKey="orderly" stroke={T.sage} strokeWidth={2} name="Orderly Net Zero"/>
            <Line type="monotone" dataKey="disorderly" stroke={T.red} strokeWidth={2} name="Disorderly"/>
            <Line type="monotone" dataKey="current" stroke={T.textMut} strokeWidth={2} strokeDasharray="5 5" name="Current Policies"/>
            <Line type="monotone" dataKey="ndcs" stroke={T.gold} strokeWidth={2} name="NDCs Only"/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Central Bank Reserve Carbon Footprint (MtCO2)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[...RESERVE_ESG].sort((a,b)=>b.carbonFootprintMtCO2-a.carbonFootprintMtCO2)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/>
            <YAxis type="category" dataKey="cb" tick={{fontSize:10,fill:T.textSec}} width={60}/>
            <Tooltip contentStyle={tip}/>
            <Bar dataKey="carbonFootprintMtCO2" name="Carbon (MtCO2)" radius={[0,4,4,0]}>
              {[...RESERVE_ESG].sort((a,b)=>b.carbonFootprintMtCO2-a.carbonFootprintMtCO2).map((r,i)=>(
                <Cell key={i} fill={r.carbonFootprintMtCO2>30?T.red:r.carbonFootprintMtCO2>10?T.amber:T.sage}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Green Collateral Frameworks</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.borderL}`}}>
                  {['CB','Green Haircut','Carbon Penalty','Taxonomy','Since'].map(h=>(
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COLLATERAL_FRAMEWORKS.map((c,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{...tdStyle,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{c.cb}</td>
                    <td style={{...tdStyle,fontFamily:T.mono,color:T.green,fontWeight:600}}>{c.greenHaircut}%</td>
                    <td style={{...tdStyle,fontFamily:T.mono,color:c.carbonPenalty==='None'?T.textMut:T.red}}>{c.carbonPenalty}</td>
                    <td style={{...tdStyle,color:c.taxonomyAligned?T.green:T.textMut}}>{c.taxonomyAligned?'\u2713 Aligned':'\u2717 Not aligned'}</td>
                    <td style={{...tdStyle,fontFamily:T.mono}}>{c.implemented}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Carbon Price Policy Rate Scenarios</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.borderL}`}}>
                  {['Scenario','2030 $/t','2050 $/t','Rate','Infl.','GDP'].map(h=>(
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CARBON_PRICE_SCENARIOS.map((s,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{...tdStyle,fontWeight:600,color:T.navy,fontSize:11}}>{s.scenario}</td>
                    <td style={{...tdStyle,fontFamily:T.mono}}>${s.price2030}</td>
                    <td style={{...tdStyle,fontFamily:T.mono,fontWeight:600,color:s.price2050>=400?T.red:T.green}}>${s.price2050}</td>
                    <td style={{...tdStyle,fontFamily:T.mono,color:s.policyRate.includes('+')?T.red:T.green,fontSize:11}}>{s.policyRate}</td>
                    <td style={{...tdStyle,fontFamily:T.mono,fontSize:11}}>{s.inflation}</td>
                    <td style={{...tdStyle,fontFamily:T.mono,fontSize:11,color:T.red}}>{s.gdpImpact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TAB 4: INVESTMENT IMPACT ─── */
function Tab4(){
  const handleExport=()=>{
    const headers=['Central Bank','Country','NGFS','Mandate','Stress Test','Green QE Vol (EUR bn)','Disclosure','Capital Add-on (bps)','Prudential Req','Methodology','Scenarios'];
    const rows=CENTRAL_BANKS.map(c=>[c.code,c.country,c.ngfs,c.climateMandate,c.stressTestReq?'Yes':'No',c.greenQEVolBn,c.disclosureRules,c.capitalBps,`"${c.prudentialReq}"`,`"${c.methodology}"`,`"${c.scenarios}"`]);
    const csv=[headers,...rows].map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='central_bank_climate_policy_report.csv';a.click();URL.revokeObjectURL(url);
  };

  const spreadData=SECTOR_IMPACT.map(s=>({name:s.sector,spread:parseInt(s.spreadChange),tilt:parseFloat(s.greenTiltImpact)}));

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
        <KPI label="Sectors Impacted" value={SECTOR_IMPACT.length} sub="by green tilting policies" color={T.navy}/>
        <KPI label="CB Green Bond Demand" value={'\u20AC'+GREEN_BOND_DEMAND[GREEN_BOND_DEMAND.length-1].cbDemand+'bn'} sub="latest quarter" color={T.sage}/>
        <KPI label="Greenium" value={GREEN_BOND_DEMAND[GREEN_BOND_DEMAND.length-1].spreadBps+' bps'} sub="green vs conventional spread" color={T.gold}/>
        <KPI label="Recommendations" value={PORTFOLIO_RECS.length} sub="actionable strategies" color={T.teal}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Sector Impact of Green Tilting (%)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spreadData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:T.textSec}} width={110}/>
              <Tooltip contentStyle={tip}/>
              <Bar dataKey="tilt" name="Green Tilt Impact %" radius={[0,4,4,0]}>
                {spreadData.map((s,i)=><Cell key={i} fill={s.tilt>=0?T.sage:T.red}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Green Bond Demand vs Supply (EUR bn)</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={GREEN_BOND_DEMAND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={tip}/>
              <Line type="monotone" dataKey="cbDemand" stroke={T.navy} strokeWidth={2} dot={false} name="CB Demand"/>
              <Line type="monotone" dataKey="privateDemand" stroke={T.sage} strokeWidth={2} dot={false} name="Private Demand"/>
              <Line type="monotone" dataKey="supply" stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Supply"/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Sector Impact Analysis</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH,borderBottom:`2px solid ${T.borderL}`}}>
                {['Sector','Green Tilt','Spread (bps)','Demand Shift','Capital','Lending','CB Buying'].map(h=>(
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTOR_IMPACT.map((s,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{...tdStyle,fontWeight:600,color:T.navy}}>{s.sector}</td>
                  <td style={{...tdStyle,fontFamily:T.mono,fontWeight:600,color:s.greenTiltImpact.startsWith('+')?T.green:T.red}}>{s.greenTiltImpact}</td>
                  <td style={{...tdStyle,fontFamily:T.mono,color:s.spreadChange>0?T.red:T.green}}>{s.spreadChange>0?'+':''}{s.spreadChange}</td>
                  <td style={tdStyle}><Badge v={s.demandShift} map={{'Strong positive':{bg:'#dcfce7',color:T.green},'Very strong positive':{bg:'#bbf7d0',color:'#15803d'},'Moderate positive':{bg:'#dbeafe',color:'#1d4ed8'},'Positive':{bg:'#dbeafe',color:'#1d4ed8'},'Mixed':{bg:'#fef9c3',color:T.amber},'Moderate negative':{bg:'#fed7aa',color:'#c2410c'},'Strong negative':{bg:'#fee2e2',color:T.red},'Negative':{bg:'#fee2e2',color:T.red}}}/></td>
                  <td style={{...tdStyle,fontSize:11,color:s.capitalImpact==='Reduced'?T.green:s.capitalImpact==='Increased'?T.red:T.textSec}}>{s.capitalImpact}</td>
                  <td style={{...tdStyle,fontFamily:T.mono,color:s.lendingChange.startsWith('+')?T.green:T.red}}>{s.lendingChange}</td>
                  <td style={{...tdStyle,textAlign:'center',color:s.cbBondBuying?T.green:T.red}}>{s.cbBondBuying?'\u2713':'\u2717'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy}}>Portfolio Positioning Recommendations</div>
          <button onClick={handleExport} style={{background:T.navy,color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.mono,letterSpacing:'0.02em'}}>Export CSV Report</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {PORTFOLIO_RECS.map((r,i)=>(
            <div key={i} style={{background:T.bg,borderRadius:10,padding:16,border:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,flex:1,paddingRight:8}}>{r.action}</div>
                <div style={{display:'flex',gap:6}}>
                  <Badge v={r.conviction} map={{'High':{bg:'#dcfce7',color:T.green},'Medium-High':{bg:'#dbeafe',color:'#1d4ed8'},'Medium':{bg:'#fef9c3',color:T.amber}}}/>
                  <Badge v={r.risk+' Risk'} map={{'Low Risk':{bg:'#dcfce7',color:T.green},'Medium Risk':{bg:'#fef9c3',color:T.amber},'High Risk':{bg:'#fee2e2',color:T.red}}}/>
                </div>
              </div>
              <div style={{fontSize:11,color:T.textSec,marginBottom:6,lineHeight:1.5}}>{r.rationale}</div>
              <div style={{display:'flex',gap:16,fontSize:11}}>
                <span style={{color:T.textMut,fontFamily:T.mono}}>{r.timeframe}</span>
                <span style={{color:T.sage,fontFamily:T.mono,fontWeight:600}}>{r.expectedReturn}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Greenium Trend (bps)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={GREEN_BOND_DEMAND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}} domain={['auto','auto']}/>
              <Tooltip contentStyle={tip}/>
              <Area type="monotone" dataKey="spreadBps" fill={T.gold} stroke={T.gold} fillOpacity={0.3} name="Greenium (bps)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Green Bond Issuance Count</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={GREEN_BOND_DEMAND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={tip}/>
              <Bar dataKey="issuanceCount" fill={T.sage} name="New Issuances" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Regulatory Capital Impact on Bank Lending</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={CAPITAL_RW_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="category" tick={{fontSize:9,fill:T.textSec}} angle={-15} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} label={{value:'Risk Weight %',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textMut}}}/>
            <Tooltip contentStyle={tip}/>
            <Bar dataKey="currentRW" fill={T.textMut} name="Current RW %" radius={[4,4,0,0]}/>
            <Bar dataKey="proposedRW" fill={T.navy} name="Proposed RW %" radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Market Impact Summary</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            {label:'Sectors with Positive Tilt',value:SECTOR_IMPACT.filter(s=>s.greenTiltImpact.startsWith('+')).length,total:SECTOR_IMPACT.length,color:T.sage},
            {label:'Avg Positive Spread Compression',value:Math.round(SECTOR_IMPACT.filter(s=>s.spreadChange<0).reduce((s,x)=>s+x.spreadChange,0)/SECTOR_IMPACT.filter(s=>s.spreadChange<0).length)+'bps',total:null,color:T.green},
            {label:'Sectors with CB Bond Buying',value:SECTOR_IMPACT.filter(s=>s.cbBondBuying).length,total:SECTOR_IMPACT.length,color:T.navy},
            {label:'Avg Negative Spread Widening',value:'+'+Math.round(SECTOR_IMPACT.filter(s=>s.spreadChange>0).reduce((s,x)=>s+x.spreadChange,0)/SECTOR_IMPACT.filter(s=>s.spreadChange>0).length)+'bps',total:null,color:T.red},
          ].map((m,i)=>(
            <div key={i} style={{background:T.bg,borderRadius:10,padding:14,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:700,color:m.color}}>{m.value}{m.total?`/${m.total}`:''}</div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Credit Spread Impact by Sector (bps change)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={spreadData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:T.textSec}} width={110}/>
            <Tooltip contentStyle={tip}/>
            <Bar dataKey="spread" name="Spread Change (bps)" radius={[0,4,4,0]}>
              {spreadData.map((s,i)=><Cell key={i} fill={s.spread<=0?T.sage:T.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function CentralBankClimatePage(){
  const [tab,setTab]=useState(0);
  const [selectedCB,setSelectedCB]=useState(null);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',color:T.text}}>
      <div style={{maxWidth:1360,margin:'0 auto',padding:'24px 32px'}}>
        <div style={{marginBottom:4}}>
          <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut,letterSpacing:'0.06em'}}>EP-AQ3 / CENTRAL BANK CLIMATE POLICY</span>
        </div>
        <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'0 0 4px 0'}}>Central Bank Climate Policy & Green Monetary Policy</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'0 0 20px 0'}}>
          NGFS membership, climate stress testing mandates, green bond purchase programs, prudential requirements, reserve management
        </p>

        <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={t} onClick={()=>setTab(i)} style={{
              padding:'10px 20px',fontSize:12,fontWeight:tab===i?700:500,
              color:tab===i?T.navy:T.textMut,background:'none',border:'none',
              borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',
              marginBottom:-2,cursor:'pointer',fontFamily:T.font,transition:'all 0.15s'
            }}>
              {t}
            </button>
          ))}
        </div>

        {tab===0&&<Tab1 onSelect={setSelectedCB}/>}
        {tab===1&&<Tab2/>}
        {tab===2&&<Tab3/>}
        {tab===3&&<Tab4/>}

        {selectedCB&&<DetailPanel cb={selectedCB} onClose={()=>setSelectedCB(null)}/>}

        <div style={{marginTop:24,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Key Intelligence Takeaways</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            {[
              {icon:'\u26A1',title:'Regulatory Momentum',text:'93% of NGFS member CBs now have climate mandates; strong mandate count doubled since 2021'},
              {icon:'\uD83C\uDF0D',title:'Stress Test Expansion',text:`${CENTRAL_BANKS.filter(c=>c.stressTestReq).length} jurisdictions require climate stress tests covering ${STRESS_FRAMEWORKS.reduce((s,f)=>s+f.banks,0)}+ banks globally`},
              {icon:'\uD83C\uDF31',title:'Green QE Growing',text:`EUR ${CENTRAL_BANKS.reduce((s,c)=>s+c.greenQEVolBn,0)}bn in green purchase programs across ${CENTRAL_BANKS.filter(c=>c.greenQE).length} central banks, expanding monthly`},
              {icon:'\uD83D\uDCC8',title:'Capital Requirements',text:`Average proposed climate capital add-on of ${Math.round(CENTRAL_BANKS.filter(c=>c.capitalBps>0).reduce((s,c)=>s+c.capitalBps,0)/CENTRAL_BANKS.filter(c=>c.capitalBps>0).length)} bps across implementing jurisdictions`},
              {icon:'\uD83D\uDCCA',title:'Market Repricing',text:'Green bonds outperforming by 20-35 bps; high-carbon credit spreads widening 55-85 bps from CB policy pressure'},
              {icon:'\uD83D\uDD0D',title:'Data Gaps Persist',text:'Scope 3 emissions coverage remains below 60% in most stress tests; physical risk modelling still nascent'},
            ].map((t,i)=>(
              <div key={i} style={{background:T.bg,borderRadius:10,padding:14,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:16,marginBottom:6}}>{t.icon}</div>
                <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:4}}>{t.title}</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.5}}>{t.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginTop:16,padding:'12px 16px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>
            Central Bank Climate Policy \u2022 40 central banks \u2022 12 quarters \u2022 6 stress test frameworks \u2022 7 green QE programs \u2022 6 NGFS scenarios
          </span>
          <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
