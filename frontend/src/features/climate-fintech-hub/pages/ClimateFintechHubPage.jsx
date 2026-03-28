import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line,
} from 'recharts';

/* ── Theme ────────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── Seed RNG ─────────────────────────────────────────────────────────────── */
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const sRange=(s,lo,hi)=>lo+(hi-lo)*sr(s);
const sInt=(s,lo,hi)=>Math.floor(sRange(s,lo,hi));

/* ── Constants ────────────────────────────────────────────────────────────── */
const TABS = ['Executive Dashboard','Technology Landscape','Integration Status','Board Report'];
const PERIODS = ['Q4 2025','Q3 2025','Q2 2025','Q1 2025','FY 2024'];
const AUDIENCES = ['Board','Tech Committee','Regulator'];
const REPORT_SECTIONS = [
  'Digital MRV Adoption','ROI Analysis','Regulatory Landscape',
  'Technology Readiness','Risk Assessment','Strategic Recommendations',
];

/* ── KPI definitions ──────────────────────────────────────────────────────── */
const KPI_META = [
  { id:'ve',  label:'Verified Emissions',      unit:'MtCO₂e',  icon:'🏭' },
  { id:'sc',  label:'Satellite Coverage',       unit:'%',        icon:'🛰️' },
  { id:'iot', label:'IoT Sensors Online',       unit:'',         icon:'📡' },
  { id:'cc',  label:'Carbon Credits Tracked',   unit:'',         icon:'🌿' },
  { id:'dp',  label:'Data Providers Integrated', unit:'',        icon:'🔗' },
  { id:'ms',  label:'MRV Cost Savings',         unit:'%',        icon:'💰' },
  { id:'btx', label:'Blockchain Tx Count',      unit:'',         icon:'⛓️' },
  { id:'ad',  label:'Anomalies Detected',       unit:'',         icon:'⚠️' },
  { id:'cs',  label:'Compliance Score',          unit:'/100',    icon:'✅' },
  { id:'dr',  label:'Digital Readiness Index',   unit:'/10',     icon:'📊' },
];

const KPI_DATA = {
  'Q4 2025':{ ve:'42.7',sc:'94.3',iot:'12,847',cc:'1.2M',dp:'47',ms:'38',btx:'847K',ad:'23',cs:'91',dr:'8.4' },
  'Q3 2025':{ ve:'44.1',sc:'91.8',iot:'11,592',cc:'1.1M',dp:'43',ms:'34',btx:'723K',ad:'31',cs:'88',dr:'8.1' },
  'Q2 2025':{ ve:'45.8',sc:'88.2',iot:'10,140',cc:'982K',dp:'39',ms:'29',btx:'614K',ad:'42',cs:'85',dr:'7.6' },
  'Q1 2025':{ ve:'47.3',sc:'84.7',iot:'8,891',cc:'847K',dp:'34',ms:'24',btx:'498K',ad:'56',cs:'82',dr:'7.1' },
  'FY 2024':{ ve:'51.2',sc:'78.1',iot:'6,420',cc:'612K',dp:'28',ms:'18',btx:'312K',ad:'89',cs:'76',dr:'6.3' },
};

/* ── Sub-module cards ─────────────────────────────────────────────────────── */
const SUB_MODULES = [
  { id:'mrv',    name:'Digital MRV',        color:T.sage,  stats:[{l:'Verifications',v:'4,812'},{l:'Accuracy',v:'99.2%'},{l:'Avg Latency',v:'2.1s'}] },
  { id:'sat',    name:'Satellite Analytics', color:T.navyL, stats:[{l:'Imagery Sets',v:'8,420'},{l:'Resolution',v:'10m'},{l:'Refresh Rate',v:'Daily'}] },
  { id:'block',  name:'Blockchain Registry', color:T.gold,  stats:[{l:'Smart Contracts',v:'342'},{l:'Tokens Issued',v:'1.2M'},{l:'Gas Saved',v:'78%'}] },
  { id:'market', name:'Data Marketplace',    color:'#8b5cf6',stats:[{l:'Datasets',v:'1,847'},{l:'Providers',v:'47'},{l:'Downloads/mo',v:'12.4K'}] },
  { id:'iot',    name:'IoT Platform',        color:T.teal,  stats:[{l:'Sensors',v:'12,847'},{l:'Uptime',v:'99.7%'},{l:'Alerts/day',v:'142'}] },
];

/* ── Tech Readiness Radar ─────────────────────────────────────────────────── */
const RADAR_DATA = [
  { tech:'MRV', readiness:92, adoption:78, maturity:85 },
  { tech:'Satellite', readiness:88, adoption:72, maturity:80 },
  { tech:'Blockchain', readiness:76, adoption:54, maturity:62 },
  { tech:'IoT', readiness:84, adoption:68, maturity:74 },
  { tech:'AI/ML', readiness:90, adoption:65, maturity:71 },
  { tech:'Data Platforms', readiness:94, adoption:82, maturity:88 },
];

/* ── Innovation Pipeline ──────────────────────────────────────────────────── */
const INNOVATION_PIPELINE = [
  { trend:'Tokenized Carbon Credits', stage:'Growth', impact:'High', timeline:'2025-2026', funding:'$2.3B' },
  { trend:'AI-Powered MRV', stage:'Early Adoption', impact:'Very High', timeline:'2025-2027', funding:'$1.8B' },
  { trend:'Digital Twin Climate Models', stage:'Emerging', impact:'High', timeline:'2026-2028', funding:'$890M' },
  { trend:'Satellite Methane Detection', stage:'Growth', impact:'Critical', timeline:'2025-2026', funding:'$1.2B' },
  { trend:'Decentralized ESG Data', stage:'Pilot', impact:'Medium', timeline:'2026-2029', funding:'$420M' },
  { trend:'IoT Biodiversity Monitoring', stage:'Emerging', impact:'Medium', timeline:'2026-2028', funding:'$310M' },
  { trend:'Quantum Climate Simulation', stage:'Research', impact:'Transformative', timeline:'2028-2032', funding:'$180M' },
  { trend:'Zero-Knowledge ESG Proofs', stage:'Research', impact:'High', timeline:'2027-2030', funding:'$95M' },
];

/* ── Tech Landscape: 40 companies ─────────────────────────────────────────── */
const TECH_CATEGORIES = ['MRV','Satellite','Blockchain','IoT','AI/ML','Data Platforms'];
const TECH_CAT_COLORS = { MRV:T.sage, Satellite:T.navyL, Blockchain:T.gold, IoT:T.teal, 'AI/ML':'#8b5cf6', 'Data Platforms':'#ec4899' };

const COMPANIES = [
  { name:'Pachama', cat:'MRV', founded:2018, funding:'$79M', trl:8, hq:'San Francisco', employees:120, desc:'Forest carbon verification using satellite + LiDAR' },
  { name:'Sylvera', cat:'MRV', founded:2020, funding:'$96M', trl:8, hq:'London', employees:150, desc:'Carbon credit ratings and analytics platform' },
  { name:'Verra', cat:'MRV', founded:2005, funding:'N/A', trl:9, hq:'Washington DC', employees:200, desc:'Global standard setter for climate action credits' },
  { name:'Gold Standard', cat:'MRV', founded:2003, funding:'N/A', trl:9, hq:'Geneva', employees:80, desc:'Certification for climate and development interventions' },
  { name:'Regrow Ag', cat:'MRV', founded:2017, funding:'$58M', trl:7, hq:'San Francisco', employees:95, desc:'Agricultural MRV for soil carbon and regenerative practices' },
  { name:'Perennial', cat:'MRV', founded:2020, funding:'$36M', trl:7, hq:'Boulder', employees:55, desc:'Soil carbon measurement platform' },
  { name:'Dryad Networks', cat:'MRV', founded:2019, funding:'$12M', trl:6, hq:'Berlin', employees:40, desc:'IoT wildfire detection and forest monitoring' },
  { name:'Planet Labs', cat:'Satellite', founded:2010, funding:'$600M', trl:9, hq:'San Francisco', employees:800, desc:'Daily global satellite imagery constellation' },
  { name:'Kayrros', cat:'Satellite', founded:2016, funding:'$60M', trl:8, hq:'Paris', employees:110, desc:'Satellite-based asset monitoring and emissions tracking' },
  { name:'GHGSat', cat:'Satellite', founded:2011, funding:'$120M', trl:8, hq:'Montreal', employees:130, desc:'High-resolution methane and CO2 satellite monitoring' },
  { name:'Satellogic', cat:'Satellite', founded:2010, funding:'$155M', trl:8, hq:'Buenos Aires', employees:250, desc:'Sub-meter resolution Earth observation' },
  { name:'Muon Space', cat:'Satellite', founded:2021, funding:'$87M', trl:6, hq:'Mountain View', employees:70, desc:'Climate-focused satellite constellation' },
  { name:'Pixxel', cat:'Satellite', founded:2019, funding:'$71M', trl:7, hq:'Bangalore', employees:90, desc:'Hyperspectral imaging satellites for environmental monitoring' },
  { name:'Toucan Protocol', cat:'Blockchain', founded:2021, funding:'$5M', trl:7, hq:'Zug', employees:30, desc:'On-chain carbon credit infrastructure' },
  { name:'KlimaDAO', cat:'Blockchain', founded:2021, funding:'$4M', trl:6, hq:'Decentralized', employees:25, desc:'DeFi protocol for carbon market liquidity' },
  { name:'Flowcarbon', cat:'Blockchain', founded:2022, funding:'$70M', trl:6, hq:'New York', employees:45, desc:'Blockchain-based carbon credit tokenization' },
  { name:'Regen Network', cat:'Blockchain', founded:2017, funding:'$22M', trl:7, hq:'Remote', employees:35, desc:'Blockchain for ecological asset verification' },
  { name:'Hedera', cat:'Blockchain', founded:2018, funding:'$125M', trl:8, hq:'Richardson TX', employees:180, desc:'Enterprise DLT with Guardian for ESG MRV' },
  { name:'Chia Network', cat:'Blockchain', founded:2017, funding:'$61M', trl:7, hq:'San Francisco', employees:60, desc:'Energy-efficient blockchain for carbon registries' },
  { name:'Polygon', cat:'Blockchain', founded:2017, funding:'$451M', trl:8, hq:'Remote', employees:600, desc:'L2 scaling with sustainability commitments' },
  { name:'Samsara', cat:'IoT', founded:2015, funding:'$930M', trl:9, hq:'San Francisco', employees:2100, desc:'Industrial IoT platform for fleet and facility monitoring' },
  { name:'Monnit', cat:'IoT', founded:2010, funding:'$25M', trl:8, hq:'Salt Lake City', employees:80, desc:'Wireless sensor networks for environmental monitoring' },
  { name:'Envio Systems', cat:'IoT', founded:2014, funding:'$18M', trl:7, hq:'Hamburg', employees:50, desc:'Building energy optimization through IoT sensors' },
  { name:'Thinxtra', cat:'IoT', founded:2015, funding:'$20M', trl:7, hq:'Sydney', employees:40, desc:'IoT solutions for sustainability and asset tracking' },
  { name:'Aclima', cat:'IoT', founded:2010, funding:'$40M', trl:8, hq:'San Francisco', employees:75, desc:'Hyperlocal air quality and emissions sensing network' },
  { name:'Sensirion', cat:'IoT', founded:1998, funding:'IPO', trl:9, hq:'Zurich', employees:1000, desc:'Environmental sensor manufacturer (CO2, humidity, particulate)' },
  { name:'Climate TRACE', cat:'AI/ML', founded:2020, funding:'$20M', trl:8, hq:'San Francisco', employees:40, desc:'AI-powered global emissions tracking coalition' },
  { name:'Blue Sky Analytics', cat:'AI/ML', founded:2018, funding:'$10M', trl:7, hq:'Noida', employees:60, desc:'Geospatial AI for environmental intelligence' },
  { name:'Cervest', cat:'AI/ML', founded:2016, funding:'$32M', trl:7, hq:'London', employees:55, desc:'Climate intelligence platform using AI risk modeling' },
  { name:'Jupiter Intelligence', cat:'AI/ML', founded:2017, funding:'$78M', trl:8, hq:'San Mateo', employees:100, desc:'AI climate risk analytics for physical risk assessment' },
  { name:'One Concern', cat:'AI/ML', founded:2015, funding:'$131M', trl:8, hq:'Menlo Park', employees:90, desc:'Resilience-as-a-service using AI catastrophe modeling' },
  { name:'ClimateAi', cat:'AI/ML', founded:2017, funding:'$29M', trl:7, hq:'San Francisco', employees:50, desc:'AI-powered supply chain climate risk analytics' },
  { name:'Watershed', cat:'Data Platforms', founded:2019, funding:'$100M', trl:8, hq:'San Francisco', employees:250, desc:'Enterprise carbon management and reporting platform' },
  { name:'Persefoni', cat:'Data Platforms', founded:2020, funding:'$101M', trl:8, hq:'Tempe', employees:200, desc:'Carbon accounting and management SaaS platform' },
  { name:'Sweep', cat:'Data Platforms', founded:2020, funding:'$73M', trl:7, hq:'Paris', employees:120, desc:'Carbon management for enterprises and supply chains' },
  { name:'Plan A', cat:'Data Platforms', founded:2017, funding:'$26M', trl:7, hq:'Berlin', employees:80, desc:'Automated carbon accounting and decarbonization platform' },
  { name:'Normative', cat:'Data Platforms', founded:2014, funding:'$12M', trl:7, hq:'Stockholm', employees:50, desc:'Science-based carbon accounting engine' },
  { name:'Sinai Technologies', cat:'Data Platforms', founded:2018, funding:'$20M', trl:7, hq:'San Francisco', employees:45, desc:'Decarbonization intelligence and abatement planning' },
  { name:'Emitwise', cat:'Data Platforms', founded:2019, funding:'$9M', trl:6, hq:'London', employees:35, desc:'Supply chain carbon tracking and analytics' },
  { name:'Net0', cat:'Data Platforms', founded:2021, funding:'$14M', trl:6, hq:'London', employees:30, desc:'AI-driven carbon management for real-time tracking' },
];

/* ── Funding tracker ──────────────────────────────────────────────────────── */
const FUNDING_YEARLY = [
  { year:'2018', total:2.1, mrv:0.3, sat:0.8, block:0.1, iot:0.4, ai:0.2, data:0.3 },
  { year:'2019', total:3.8, mrv:0.5, sat:1.2, block:0.3, iot:0.6, ai:0.5, data:0.7 },
  { year:'2020', total:6.2, mrv:0.9, sat:1.8, block:0.5, iot:0.8, ai:0.9, data:1.3 },
  { year:'2021', total:12.4, mrv:1.8, sat:3.2, block:2.1, iot:1.4, ai:1.6, data:2.3 },
  { year:'2022', total:8.7, mrv:1.2, sat:2.1, block:1.5, iot:1.0, ai:1.2, data:1.7 },
  { year:'2023', total:5.9, mrv:0.8, sat:1.4, block:0.7, iot:0.7, ai:1.0, data:1.3 },
  { year:'2024', total:4.1, mrv:0.6, sat:0.9, block:0.4, iot:0.5, ai:0.8, data:0.9 },
  { year:'2025', total:1.8, mrv:0.3, sat:0.4, block:0.2, iot:0.2, ai:0.4, data:0.3 },
];

/* ── Integration Status data ──────────────────────────────────────────────── */
const INTEGRATIONS = [
  { name:'Planet Labs API', type:'Satellite', status:'Active', latency:142, errors:0.02, uptime:99.98, lastSync:'2 min ago' },
  { name:'GHGSat Stream', type:'Satellite', status:'Active', latency:238, errors:0.08, uptime:99.91, lastSync:'5 min ago' },
  { name:'Verra Registry', type:'MRV', status:'Active', latency:420, errors:0.15, uptime:99.85, lastSync:'15 min ago' },
  { name:'Gold Standard API', type:'MRV', status:'Active', latency:380, errors:0.12, uptime:99.88, lastSync:'12 min ago' },
  { name:'Hedera Guardian', type:'Blockchain', status:'Active', latency:95, errors:0.01, uptime:99.99, lastSync:'30s ago' },
  { name:'Toucan Bridge', type:'Blockchain', status:'Degraded', latency:1240, errors:2.4, uptime:97.6, lastSync:'8 min ago' },
  { name:'Samsara Fleet', type:'IoT', status:'Active', latency:186, errors:0.05, uptime:99.95, lastSync:'1 min ago' },
  { name:'Aclima Sensors', type:'IoT', status:'Active', latency:210, errors:0.09, uptime:99.92, lastSync:'3 min ago' },
  { name:'Climate TRACE', type:'AI/ML', status:'Active', latency:560, errors:0.22, uptime:99.78, lastSync:'30 min ago' },
  { name:'Watershed Sync', type:'Data', status:'Maintenance', latency:null, errors:null, uptime:98.2, lastSync:'2h ago' },
  { name:'Persefoni Connect', type:'Data', status:'Active', latency:310, errors:0.11, uptime:99.89, lastSync:'10 min ago' },
  { name:'EU ETS Registry', type:'Registry', status:'Active', latency:680, errors:0.31, uptime:99.69, lastSync:'1h ago' },
  { name:'UNFCCC CDM', type:'Registry', status:'Active', latency:890, errors:0.45, uptime:99.55, lastSync:'2h ago' },
  { name:'Copernicus Climate', type:'Satellite', status:'Active', latency:340, errors:0.14, uptime:99.86, lastSync:'20 min ago' },
];

const PIPELINE_STAGES = [
  { stage:'Data Ingestion', sources:14, throughput:'2.4TB/day', health:98 },
  { stage:'Validation & QA', sources:14, throughput:'2.1TB/day', health:96 },
  { stage:'Normalization', sources:14, throughput:'1.8TB/day', health:97 },
  { stage:'ML Processing', sources:12, throughput:'1.2TB/day', health:94 },
  { stage:'Verification', sources:10, throughput:'0.8TB/day', health:99 },
  { stage:'Output & API', sources:8, throughput:'0.6TB/day', health:99 },
];

const INTEGRATION_ROADMAP = [
  { name:'ESA Sentinel Hub', type:'Satellite', status:'Planned', quarter:'Q1 2026' },
  { name:'Carbonplace Network', type:'Blockchain', status:'In Progress', quarter:'Q4 2025' },
  { name:'MSCI Climate Data', type:'Data', status:'In Progress', quarter:'Q4 2025' },
  { name:'S&P Trucost', type:'Data', status:'Planned', quarter:'Q2 2026' },
  { name:'Methane SAT', type:'Satellite', status:'Planned', quarter:'Q1 2026' },
  { name:'ICE Carbon Futures', type:'Registry', status:'In Progress', quarter:'Q4 2025' },
];

/* ── Executive: alert log ─────────────────────────────────────────────────── */
const EXEC_ALERTS = [
  { id:1, severity:'Critical', text:'Toucan Bridge blockchain integration showing >2% error rate — failover engaged', module:'Blockchain Registry', time:'12 min ago' },
  { id:2, severity:'Warning', text:'Satellite refresh rate degraded to 48h in APAC region due to cloud cover', module:'Satellite Analytics', time:'2h ago' },
  { id:3, severity:'Info', text:'Monthly MRV verification batch completed — 4,812 credits verified', module:'Digital MRV', time:'6h ago' },
  { id:4, severity:'Warning', text:'IoT sensor cluster #47 (Amazon basin) offline — scheduled maintenance', module:'IoT Platform', time:'1d ago' },
  { id:5, severity:'Info', text:'New data provider onboarded: Copernicus Climate Data Store', module:'Data Marketplace', time:'2d ago' },
  { id:6, severity:'Critical', text:'Anomaly detected: 23% spike in reported emissions from Sector 7 — under investigation', module:'Digital MRV', time:'3h ago' },
];

/* ── Executive: monthly trend data ────────────────────────────────────────── */
const MONTHLY_TREND = [
  { month:'Jan', verifications:312, credits:84, sensors:8420, anomalies:12, cost:42 },
  { month:'Feb', verifications:348, credits:91, sensors:8810, anomalies:8, cost:39 },
  { month:'Mar', verifications:402, credits:112, sensors:9240, anomalies:15, cost:37 },
  { month:'Apr', verifications:378, credits:98, sensors:9680, anomalies:11, cost:36 },
  { month:'May', verifications:421, credits:124, sensors:10140, anomalies:9, cost:34 },
  { month:'Jun', verifications:456, credits:138, sensors:10590, anomalies:14, cost:33 },
  { month:'Jul', verifications:489, credits:147, sensors:11020, anomalies:7, cost:31 },
  { month:'Aug', verifications:512, credits:156, sensors:11430, anomalies:18, cost:30 },
  { month:'Sep', verifications:534, credits:168, sensors:11870, anomalies:6, cost:28 },
  { month:'Oct', verifications:561, credits:182, sensors:12310, anomalies:10, cost:27 },
  { month:'Nov', verifications:578, credits:194, sensors:12580, anomalies:8, cost:26 },
  { month:'Dec', verifications:601, credits:208, sensors:12847, anomalies:5, cost:25 },
];

/* ── Executive: coverage by region ────────────────────────────────────────── */
const REGIONAL_COVERAGE = [
  { region:'Europe', satellite:97.2, iot:89.4, mrv:94.1, providers:18 },
  { region:'N. America', satellite:96.8, iot:92.1, mrv:95.3, providers:14 },
  { region:'Asia Pacific', satellite:91.3, iot:78.2, mrv:82.7, providers:8 },
  { region:'Latin America', satellite:88.7, iot:62.4, mrv:71.8, providers:4 },
  { region:'Africa', satellite:82.1, iot:41.8, mrv:54.2, providers:2 },
  { region:'Middle East', satellite:93.4, iot:71.6, mrv:78.9, providers:3 },
];

/* ── Tech landscape: deal flow ────────────────────────────────────────────── */
const RECENT_DEALS = [
  { company:'Persefoni', round:'Series C', amount:'$101M', date:'Q3 2024', lead:'TPG Rise Climate', cat:'Data Platforms' },
  { company:'Sylvera', round:'Series B', amount:'$57M', date:'Q2 2024', lead:'Balderton Capital', cat:'MRV' },
  { company:'Muon Space', round:'Series A', amount:'$87M', date:'Q1 2024', lead:'Innovation Endeavors', cat:'Satellite' },
  { company:'Watershed', round:'Series C', amount:'$100M', date:'Q4 2023', lead:'Greenoaks', cat:'Data Platforms' },
  { company:'GHGSat', round:'Series D', amount:'$120M', date:'Q3 2023', lead:'Fonds de solidarite FTQ', cat:'Satellite' },
  { company:'Jupiter Intelligence', round:'Series C', amount:'$54M', date:'Q2 2023', lead:'QIC', cat:'AI/ML' },
  { company:'Flowcarbon', round:'Series A', amount:'$70M', date:'Q1 2023', lead:'a16z crypto', cat:'Blockchain' },
  { company:'One Concern', round:'Series C', amount:'$45M', date:'Q4 2022', lead:'Verizon Ventures', cat:'AI/ML' },
];

/* ── Integration: weekly health history ───────────────────────────────────── */
const WEEKLY_HEALTH = Array.from({length:12},(_,i)=>({
  week:`W${i+1}`,
  uptime:parseFloat((99.2+sRange(i*3,0,0.7)).toFixed(2)),
  latency:sInt(i*3+1,180,420),
  errors:parseFloat((sRange(i*3+2,0.02,0.35)).toFixed(2)),
  throughput:parseFloat((1.8+sRange(i*3+3,0,0.8)).toFixed(1)),
}));

/* ── Board Report: adoption metrics ───────────────────────────────────────── */
const ADOPTION_DATA = [
  { metric:'Verification Turnaround', digital:'2.1 days', traditional:'14.3 days', improvement:'85%' },
  { metric:'Cost per Verification', digital:'$42', traditional:'$380', improvement:'89%' },
  { metric:'Data Accuracy', digital:'99.2%', traditional:'91.4%', improvement:'8.5%' },
  { metric:'Geographic Coverage', digital:'94.3%', traditional:'32.1%', improvement:'194%' },
  { metric:'Real-Time Monitoring', digital:'Yes (continuous)', traditional:'Quarterly', improvement:'N/A' },
  { metric:'Anomaly Detection Time', digital:'2.3 hours', traditional:'45 days', improvement:'99.8%' },
];

const ROI_DATA = [
  { year:'Y1', digitalCost:2.8, manualCost:8.4, savings:5.6, cumSavings:5.6 },
  { year:'Y2', digitalCost:1.9, manualCost:9.1, savings:7.2, cumSavings:12.8 },
  { year:'Y3', digitalCost:1.4, manualCost:9.8, savings:8.4, cumSavings:21.2 },
  { year:'Y4', digitalCost:1.1, manualCost:10.5, savings:9.4, cumSavings:30.6 },
  { year:'Y5', digitalCost:0.9, manualCost:11.2, savings:10.3, cumSavings:40.9 },
];

const REGULATORY_LANDSCAPE = [
  { reg:'EU Digital Finance Strategy', status:'Active', impact:'High', deadline:'Q4 2025', relevance:'Digital MRV frameworks and fintech regulation' },
  { reg:'MiCA (Markets in Crypto-Assets)', status:'Enforced', impact:'Critical', deadline:'Dec 2024', relevance:'Carbon credit tokenization compliance' },
  { reg:'EU Green Bond Standard', status:'Active', impact:'High', deadline:'Q4 2025', relevance:'Digital verification requirements for green bonds' },
  { reg:'SFDR Technical Standards', status:'Active', impact:'High', deadline:'Ongoing', relevance:'Digital data collection and reporting mandates' },
  { reg:'Article 6 (Paris Agreement)', status:'Evolving', impact:'Critical', deadline:'2025+', relevance:'International carbon market digital infrastructure' },
  { reg:'SEC Climate Rule', status:'Pending', impact:'Medium', deadline:'2026', relevance:'Digital assurance and verification requirements' },
];

/* ── Shared UI components ─────────────────────────────────────────────────── */
const card = { background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:24, boxShadow:'0 1px 4px rgba(27,58,92,0.06)' };
const cardHover = { ...card, transition:'box-shadow .18s', cursor:'default' };
const pill = (active) => ({
  padding:'7px 18px', borderRadius:20, fontSize:13, fontWeight:600,
  border:`1.5px solid ${active?T.navy:T.border}`,
  background:active?T.navy:'transparent',
  color:active?'#fff':T.textSec, cursor:'pointer', transition:'all .15s',
  fontFamily:T.font,
});
const badge = (color) => ({
  display:'inline-block', padding:'2px 10px', borderRadius:10, fontSize:11, fontWeight:700,
  background:`${color}18`, color, fontFamily:T.font,
});

const StatusDot = ({ status }) => {
  const c = status==='Active'?T.green:status==='Degraded'?T.amber:status==='Maintenance'?T.textMut:T.red;
  return <span style={{ display:'inline-block',width:8,height:8,borderRadius:'50%',background:c,marginRight:6 }} />;
};

const Section = ({ title, children, right }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
      <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:T.navy, fontFamily:T.font }}>{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const TrlBar = ({ level }) => (
  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
    <div style={{ width:80, height:6, borderRadius:3, background:T.surfaceH, overflow:'hidden' }}>
      <div style={{ width:`${(level/9)*100}%`, height:'100%', borderRadius:3, background:level>=8?T.green:level>=6?T.gold:T.amber }} />
    </div>
    <span style={{ fontSize:11, fontWeight:600, color:T.textSec, fontFamily:T.mono }}>TRL {level}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ClimateFintechHubPage() {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [techCatFilter, setTechCatFilter] = useState('All');
  const [healthRunning, setHealthRunning] = useState(false);
  const [audience, setAudience] = useState('Board');
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo, setDateTo] = useState('2025-12-31');
  const [reportSections, setReportSections] = useState(() => REPORT_SECTIONS.reduce((a,s)=>({...a,[s]:true}),{}));

  const kpis = useMemo(() => KPI_DATA[period] || KPI_DATA[PERIODS[0]], [period]);

  const filteredCompanies = useMemo(() =>
    techCatFilter==='All' ? COMPANIES : COMPANIES.filter(c=>c.cat===techCatFilter),
  [techCatFilter]);

  const catDistribution = useMemo(() =>
    TECH_CATEGORIES.map(cat => ({ name:cat, count:COMPANIES.filter(c=>c.cat===cat).length, color:TECH_CAT_COLORS[cat] })),
  []);

  const fundingCumulative = useMemo(() => {
    let cum = 0;
    return FUNDING_YEARLY.map(f => { cum += f.total; return { ...f, cumulative:parseFloat(cum.toFixed(1)) }; });
  }, []);

  const toggleSection = useCallback((s) => {
    setReportSections(prev => ({ ...prev, [s]:!prev[s] }));
  }, []);

  const runHealthCheck = useCallback(() => {
    setHealthRunning(true);
    setTimeout(() => setHealthRunning(false), 2200);
  }, []);

  const exportCSV = useCallback(() => {
    const rows = [['Metric','Digital','Traditional','Improvement']];
    ADOPTION_DATA.forEach(r => rows.push([r.metric,r.digital,r.traditional,r.improvement]));
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='climate_fintech_board_report.csv'; a.click();
    URL.revokeObjectURL(url);
  }, []);

  /* ── Tab 1: Executive Dashboard ──────────────────────────────────────── */
  const renderExecutive = () => (
    <div>
      {/* Period Toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
        {PERIODS.map(p => (
          <button key={p} onClick={()=>setPeriod(p)} style={pill(p===period)}>{p}</button>
        ))}
      </div>

      {/* 10 KPIs — 5x2 grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:28 }}>
        {KPI_META.map((m,i) => {
          const val = kpis[m.id];
          const prev = KPI_DATA[PERIODS[Math.min(PERIODS.indexOf(period)+1,PERIODS.length-1)]]?.[m.id];
          const isUp = m.id==='ad' ? false : true;
          return (
            <div key={m.id} style={{ ...card, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{m.icon}</div>
              <div style={{ fontSize:11, color:T.textMut, fontWeight:600, marginBottom:4, fontFamily:T.font, textTransform:'uppercase', letterSpacing:0.5 }}>{m.label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:T.navy, fontFamily:T.mono }}>{val}{m.unit && <span style={{ fontSize:12, color:T.textSec }}> {m.unit}</span>}</div>
              {prev && prev !== val && (
                <div style={{ fontSize:11, color:isUp?T.green:T.amber, fontWeight:600, marginTop:2, fontFamily:T.font }}>
                  {isUp?'▲':'▼'} vs prior
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sub-module cards */}
      <Section title="Sub-Module Performance">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14 }}>
          {SUB_MODULES.map(m => (
            <div key={m.id} style={{ ...card, padding:16, borderTop:`3px solid ${m.color}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10, fontFamily:T.font }}>{m.name}</div>
              {m.stats.map(s => (
                <div key={s.l} style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, color:T.textMut, fontFamily:T.font }}>{s.l}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:T.navy, fontFamily:T.mono }}>{s.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Technology Readiness Radar + Innovation Pipeline side by side */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:18, marginBottom:28 }}>
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12, fontFamily:T.font }}>Technology Readiness</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="tech" tick={{ fontSize:11, fill:T.textSec, fontFamily:T.font }} />
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize:9, fill:T.textMut }} />
              <Radar name="Readiness" dataKey="readiness" stroke={T.sage} fill={T.sage} fillOpacity={0.25} />
              <Radar name="Adoption" dataKey="adoption" stroke={T.gold} fill={T.gold} fillOpacity={0.2} />
              <Radar name="Maturity" dataKey="maturity" stroke={T.navyL} fill={T.navyL} fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize:11, fontFamily:T.font }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12, fontFamily:T.font }}>Innovation Pipeline</div>
          <div style={{ maxHeight:300, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  {['Trend','Stage','Impact','Timeline','Funding'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:T.textMut, fontWeight:600, fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INNOVATION_PIPELINE.map((row,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.surfaceH}` }}>
                    <td style={{ padding:'7px 8px', fontWeight:600, color:T.navy }}>{row.trend}</td>
                    <td style={{ padding:'7px 8px' }}>
                      <span style={badge(
                        row.stage==='Growth'?T.green:row.stage==='Early Adoption'?T.sage:
                        row.stage==='Emerging'?T.gold:row.stage==='Pilot'?T.amber:T.textMut
                      )}>{row.stage}</span>
                    </td>
                    <td style={{ padding:'7px 8px', color:row.impact==='Critical'||row.impact==='Transformative'?T.red:row.impact==='Very High'?T.amber:T.textSec, fontWeight:600 }}>{row.impact}</td>
                    <td style={{ padding:'7px 8px', color:T.textSec, fontFamily:T.mono, fontSize:11 }}>{row.timeline}</td>
                    <td style={{ padding:'7px 8px', fontWeight:600, color:T.navy, fontFamily:T.mono }}>{row.funding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Operations Trend */}
      <Section title="Monthly Operations Trend (YTD)">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8, fontFamily:T.font }}>Verifications & Credits Tracked</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MONTHLY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
                <XAxis dataKey="month" tick={{ fontSize:10, fill:T.textMut }} />
                <YAxis yAxisId="left" tick={{ fontSize:10, fill:T.textMut }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:T.textMut }} />
                <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
                <Line yAxisId="left" type="monotone" dataKey="verifications" name="Verifications" stroke={T.sage} strokeWidth={2} dot={{ r:3 }} />
                <Line yAxisId="right" type="monotone" dataKey="credits" name="Credits (K)" stroke={T.gold} strokeWidth={2} dot={{ r:3 }} />
                <Legend wrapperStyle={{ fontSize:10, fontFamily:T.font }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8, fontFamily:T.font }}>IoT Sensors Online & Cost per Verification ($)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHLY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
                <XAxis dataKey="month" tick={{ fontSize:10, fill:T.textMut }} />
                <YAxis yAxisId="left" tick={{ fontSize:10, fill:T.textMut }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:T.textMut }} />
                <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
                <Area yAxisId="left" type="monotone" dataKey="sensors" name="Sensors Online" stroke={T.teal} fill={T.teal} fillOpacity={0.15} />
                <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost ($)" stroke={T.red} strokeWidth={2} dot={{ r:2 }} />
                <Legend wrapperStyle={{ fontSize:10, fontFamily:T.font }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* Regional Coverage */}
      <Section title="Coverage by Region">
        <div style={card}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Region','Satellite %','IoT %','MRV %','Data Providers','Overall Score'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'7px 10px', color:T.textMut, fontWeight:600, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REGIONAL_COVERAGE.map((r,i) => {
                const overall = ((r.satellite+r.iot+r.mrv)/3).toFixed(1);
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.surfaceH}` }}>
                    <td style={{ padding:'7px 10px', fontWeight:600, color:T.navy }}>{r.region}</td>
                    <td style={{ padding:'7px 10px', fontFamily:T.mono, color:r.satellite>=95?T.green:r.satellite>=85?T.textSec:T.amber }}>{r.satellite}%</td>
                    <td style={{ padding:'7px 10px', fontFamily:T.mono, color:r.iot>=80?T.green:r.iot>=60?T.amber:T.red }}>{r.iot}%</td>
                    <td style={{ padding:'7px 10px', fontFamily:T.mono, color:r.mrv>=85?T.green:r.mrv>=70?T.amber:T.red }}>{r.mrv}%</td>
                    <td style={{ padding:'7px 10px', fontFamily:T.mono, color:T.navy, fontWeight:700 }}>{r.providers}</td>
                    <td style={{ padding:'7px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:80, height:6, borderRadius:3, background:T.surfaceH, overflow:'hidden' }}>
                          <div style={{ width:`${overall}%`, height:'100%', borderRadius:3, background:parseFloat(overall)>=85?T.green:parseFloat(overall)>=65?T.gold:T.amber }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:T.textSec, fontFamily:T.mono }}>{overall}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Alert Log */}
      <Section title="Recent Alerts & Notifications">
        <div style={card}>
          <div style={{ display:'grid', gap:8 }}>
            {EXEC_ALERTS.map(a => (
              <div key={a.id} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10,
                background:a.severity==='Critical'?`${T.red}08`:a.severity==='Warning'?`${T.amber}08`:T.surfaceH,
                borderLeft:`3px solid ${a.severity==='Critical'?T.red:a.severity==='Warning'?T.amber:T.sage}`,
              }}>
                <span style={badge(a.severity==='Critical'?T.red:a.severity==='Warning'?T.amber:T.sage)}>{a.severity}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:T.navy, fontFamily:T.font }}>{a.text}</div>
                  <div style={{ fontSize:10, color:T.textMut, fontFamily:T.font, marginTop:2 }}>{a.module} | {a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Platform Growth Trajectory */}
      <Section title="Platform Growth Trajectory">
        <div style={card}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={FUNDING_YEARLY.map((f,i) => ({
              year:f.year,
              sensors:sInt(i*10+1,2000,13000),
              credits:sInt(i*10+2,100,1200),
              providers:sInt(i*10+3,8,50),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
              <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textMut }} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} />
              <Tooltip contentStyle={{ fontFamily:T.font, fontSize:12, borderRadius:8, border:`1px solid ${T.border}` }} />
              <Area type="monotone" dataKey="sensors" name="IoT Sensors" stroke={T.teal} fill={T.teal} fillOpacity={0.15} />
              <Area type="monotone" dataKey="credits" name="Credits (K)" stroke={T.gold} fill={T.gold} fillOpacity={0.15} />
              <Area type="monotone" dataKey="providers" name="Providers" stroke={T.navyL} fill={T.navyL} fillOpacity={0.1} />
              <Legend wrapperStyle={{ fontSize:11, fontFamily:T.font }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  );

  /* ── Tab 2: Technology Landscape ─────────────────────────────────────── */
  const renderTechLandscape = () => (
    <div>
      {/* Category filter */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['All',...TECH_CATEGORIES].map(cat => (
          <button key={cat} onClick={()=>{setTechCatFilter(cat);setSelectedCompany(null);}} style={pill(cat===techCatFilter)}>{cat} {cat!=='All'?`(${COMPANIES.filter(c=>c.cat===cat).length})`:''}</button>
        ))}
      </div>

      {/* Ecosystem map + Category pie */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:18, marginBottom:24 }}>
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:14, fontFamily:T.font }}>
            Climate Fintech Ecosystem — {filteredCompanies.length} Companies
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, maxHeight:380, overflowY:'auto' }}>
            {filteredCompanies.map(c => (
              <div
                key={c.name}
                onClick={()=>setSelectedCompany(selectedCompany?.name===c.name?null:c)}
                style={{
                  ...card, padding:10, cursor:'pointer',
                  borderLeft:`3px solid ${TECH_CAT_COLORS[c.cat]}`,
                  background:selectedCompany?.name===c.name?T.surfaceH:T.surface,
                  transition:'all .15s',
                }}
              >
                <div style={{ fontSize:12, fontWeight:700, color:T.navy, fontFamily:T.font }}>{c.name}</div>
                <div style={{ fontSize:10, color:T.textMut, fontFamily:T.font }}>{c.cat}</div>
                <TrlBar level={c.trl} />
              </div>
            ))}
          </div>
        </div>

        <div>
          {/* Category distribution pie */}
          <div style={{ ...card, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8, fontFamily:T.font }}>Distribution by Category</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2}>
                  {catDistribution.map((d,i)=><Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
              {catDistribution.map(d => (
                <span key={d.name} style={{ fontSize:10, color:T.textSec, fontFamily:T.font }}>
                  <span style={{ display:'inline-block',width:8,height:8,borderRadius:2,background:d.color,marginRight:3 }} />
                  {d.name} ({d.count})
                </span>
              ))}
            </div>
          </div>

          {/* Company detail card */}
          {selectedCompany && (
            <div style={{ ...card, borderTop:`3px solid ${TECH_CAT_COLORS[selectedCompany.cat]}` }}>
              <div style={{ fontSize:15, fontWeight:800, color:T.navy, fontFamily:T.font }}>{selectedCompany.name}</div>
              <div style={{ fontSize:11, color:T.textMut, fontFamily:T.font, marginBottom:10 }}>{selectedCompany.cat} | {selectedCompany.hq}</div>
              <p style={{ fontSize:12, color:T.textSec, lineHeight:1.5, margin:'0 0 10px', fontFamily:T.font }}>{selectedCompany.desc}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  ['Founded', selectedCompany.founded],
                  ['Funding', selectedCompany.funding],
                  ['Employees', selectedCompany.employees],
                  ['TRL', selectedCompany.trl],
                ].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:10, color:T.textMut, fontFamily:T.font }}>{l}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.navy, fontFamily:T.mono }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Funding tracker */}
      <Section title="Climate Fintech Investment Tracker — $45B Cumulative">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8, fontFamily:T.font }}>Annual Investment by Category ($B)</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={FUNDING_YEARLY}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textMut }} />
                <YAxis tick={{ fontSize:10, fill:T.textMut }} />
                <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
                <Bar dataKey="mrv" name="MRV" stackId="a" fill={T.sage} />
                <Bar dataKey="sat" name="Satellite" stackId="a" fill={T.navyL} />
                <Bar dataKey="block" name="Blockchain" stackId="a" fill={T.gold} />
                <Bar dataKey="iot" name="IoT" stackId="a" fill={T.teal} />
                <Bar dataKey="ai" name="AI/ML" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="data" name="Data" stackId="a" fill="#ec4899" />
                <Legend wrapperStyle={{ fontSize:10, fontFamily:T.font }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8, fontFamily:T.font }}>Cumulative Investment ($B)</div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={fundingCumulative}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textMut }} />
                <YAxis tick={{ fontSize:10, fill:T.textMut }} />
                <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
                <Area type="monotone" dataKey="cumulative" name="Cumulative $B" stroke={T.navy} fill={T.navy} fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* Maturity / TRL assessment */}
      <Section title="Technology Readiness Level Assessment">
        <div style={card}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TECH_CATEGORIES.map(cat => {
              const cos = COMPANIES.filter(c=>c.cat===cat);
              const avg = cos.reduce((a,c)=>a+c.trl,0)/cos.length;
              return { cat, avgTrl:parseFloat(avg.toFixed(1)), max:Math.max(...cos.map(c=>c.trl)), min:Math.min(...cos.map(c=>c.trl)) };
            })} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
              <XAxis type="number" domain={[0,10]} tick={{ fontSize:10, fill:T.textMut }} />
              <YAxis type="category" dataKey="cat" tick={{ fontSize:11, fill:T.textSec, fontFamily:T.font }} width={100} />
              <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
              <Bar dataKey="avgTrl" name="Avg TRL" fill={T.sage} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Recent Deal Flow */}
      <Section title="Recent Deal Flow">
        <div style={card}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Company','Round','Amount','Date','Lead Investor','Category'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'7px 8px', color:T.textMut, fontWeight:600, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_DEALS.map((d,i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.surfaceH}`, cursor:'pointer' }}
                    onClick={()=>setSelectedCompany(COMPANIES.find(c=>c.name===d.company)||null)}>
                  <td style={{ padding:'7px 8px', fontWeight:700, color:T.navy }}>{d.company}</td>
                  <td style={{ padding:'7px 8px' }}><span style={badge(T.sage)}>{d.round}</span></td>
                  <td style={{ padding:'7px 8px', fontWeight:700, color:T.navy, fontFamily:T.mono }}>{d.amount}</td>
                  <td style={{ padding:'7px 8px', color:T.textSec, fontFamily:T.mono, fontSize:11 }}>{d.date}</td>
                  <td style={{ padding:'7px 8px', color:T.textSec }}>{d.lead}</td>
                  <td style={{ padding:'7px 8px' }}><span style={badge(TECH_CAT_COLORS[d.cat]||T.navyL)}>{d.cat}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Competitive landscape */}
      <Section title="Competitive Landscape — Top Funded">
        <div style={card}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Company','Category','HQ','Founded','Funding','TRL','Employees'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:T.textMut, fontWeight:600, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...COMPANIES].sort((a,b) => {
                const pf = (s) => { const m = String(s).match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; };
                return pf(b.funding) - pf(a.funding);
              }).slice(0,12).map((c,i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.surfaceH}`, cursor:'pointer', background:selectedCompany?.name===c.name?T.surfaceH:'transparent' }}
                    onClick={()=>setSelectedCompany(c)}>
                  <td style={{ padding:'7px 8px', fontWeight:600, color:T.navy }}>{c.name}</td>
                  <td style={{ padding:'7px 8px' }}><span style={badge(TECH_CAT_COLORS[c.cat])}>{c.cat}</span></td>
                  <td style={{ padding:'7px 8px', color:T.textSec }}>{c.hq}</td>
                  <td style={{ padding:'7px 8px', color:T.textSec, fontFamily:T.mono }}>{c.founded}</td>
                  <td style={{ padding:'7px 8px', fontWeight:700, color:T.navy, fontFamily:T.mono }}>{c.funding}</td>
                  <td style={{ padding:'7px 8px' }}><TrlBar level={c.trl} /></td>
                  <td style={{ padding:'7px 8px', color:T.textSec, fontFamily:T.mono }}>{c.employees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );

  /* ── Tab 3: Integration Status ───────────────────────────────────────── */
  const renderIntegration = () => (
    <div>
      {/* Health summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Integrations', value:INTEGRATIONS.length, color:T.navy },
          { label:'Active', value:INTEGRATIONS.filter(i=>i.status==='Active').length, color:T.green },
          { label:'Degraded', value:INTEGRATIONS.filter(i=>i.status==='Degraded').length, color:T.amber },
          { label:'Avg Uptime', value:`${(INTEGRATIONS.reduce((a,i)=>a+i.uptime,0)/INTEGRATIONS.length).toFixed(2)}%`, color:T.sage },
        ].map((m,i) => (
          <div key={i} style={{ ...card, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:11, color:T.textMut, fontWeight:600, fontFamily:T.font, textTransform:'uppercase', letterSpacing:0.5 }}>{m.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:m.color, fontFamily:T.mono, marginTop:4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* API Connection Status */}
      <Section title="API Connection Status" right={
        <button onClick={runHealthCheck} style={{ ...pill(true), background:healthRunning?T.amber:T.sage, borderColor:healthRunning?T.amber:T.sage, fontSize:12 }}>
          {healthRunning?'Running Health Check...':'Run Health Check'}
        </button>
      }>
        <div style={card}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Service','Type','Status','Latency (ms)','Error Rate %','Uptime %','Last Sync'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:T.textMut, fontWeight:600, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INTEGRATIONS.map((intg,i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.surfaceH}` }}>
                  <td style={{ padding:'7px 8px', fontWeight:600, color:T.navy }}>{intg.name}</td>
                  <td style={{ padding:'7px 8px' }}><span style={badge(TECH_CAT_COLORS[intg.type]||T.navyL)}>{intg.type}</span></td>
                  <td style={{ padding:'7px 8px' }}><StatusDot status={intg.status} /><span style={{ fontWeight:600, color:intg.status==='Active'?T.green:intg.status==='Degraded'?T.amber:T.textMut }}>{intg.status}</span></td>
                  <td style={{ padding:'7px 8px', fontFamily:T.mono, color:intg.latency?intg.latency>500?T.amber:T.textSec:T.textMut }}>{intg.latency??'—'}</td>
                  <td style={{ padding:'7px 8px', fontFamily:T.mono, color:intg.errors?intg.errors>1?T.red:intg.errors>0.2?T.amber:T.textSec:T.textMut }}>{intg.errors!==null?intg.errors.toFixed(2):'—'}</td>
                  <td style={{ padding:'7px 8px', fontFamily:T.mono, color:intg.uptime>=99.9?T.green:intg.uptime>=99?T.textSec:T.amber }}>{intg.uptime.toFixed(2)}</td>
                  <td style={{ padding:'7px 8px', color:T.textMut, fontSize:11 }}>{intg.lastSync}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Data Pipeline Flow */}
      <Section title="Data Pipeline Health">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
          {PIPELINE_STAGES.map((s,i) => (
            <div key={i} style={{ ...card, padding:14, textAlign:'center', position:'relative' }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginBottom:6, fontFamily:T.font }}>{s.stage}</div>
              <div style={{ fontSize:20, fontWeight:800, color:s.health>=98?T.green:s.health>=95?T.gold:T.amber, fontFamily:T.mono }}>{s.health}%</div>
              <div style={{ fontSize:10, color:T.textMut, fontFamily:T.font }}>{s.throughput}</div>
              <div style={{ fontSize:10, color:T.textMut, fontFamily:T.font }}>{s.sources} sources</div>
              {i < PIPELINE_STAGES.length-1 && (
                <div style={{ position:'absolute', right:-10, top:'50%', transform:'translateY(-50%)', color:T.textMut, fontSize:16, zIndex:1 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Latency chart */}
      <Section title="Latency Metrics (ms)">
        <div style={card}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={INTEGRATIONS.filter(i=>i.latency).map(i=>({ name:i.name.split(' ')[0], latency:i.latency, errors:i.errors*100 }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
              <XAxis type="number" tick={{ fontSize:10, fill:T.textMut }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:T.textSec, fontFamily:T.font }} width={90} />
              <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
              <Bar dataKey="latency" name="Latency (ms)" fill={T.navyL} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Error rate line chart */}
      <Section title="Error Rate Tracking (%)">
        <div style={card}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={INTEGRATIONS.filter(i=>i.errors!==null).map((intg,i) => ({
              name:intg.name.split(' ')[0],
              current:intg.errors,
              baseline:0.1,
              ...Object.fromEntries([1,2,3,4,5,6].map(w => [`w${w}`, parseFloat((intg.errors * sRange(i*6+w,0.5,1.5)).toFixed(2))])),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
              <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textMut }} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} domain={[0,'auto']} />
              <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
              <Line type="monotone" dataKey="current" name="Current" stroke={T.red} strokeWidth={2} dot={{ r:3 }} />
              <Line type="monotone" dataKey="baseline" name="Baseline" stroke={T.textMut} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Weekly Health History */}
      <Section title="Weekly Platform Health History">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8, fontFamily:T.font }}>Uptime % & Throughput (TB/day)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={WEEKLY_HEALTH}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
                <XAxis dataKey="week" tick={{ fontSize:10, fill:T.textMut }} />
                <YAxis yAxisId="left" domain={[99,100]} tick={{ fontSize:10, fill:T.textMut }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:T.textMut }} />
                <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
                <Line yAxisId="left" type="monotone" dataKey="uptime" name="Uptime %" stroke={T.green} strokeWidth={2} dot={{ r:3 }} />
                <Line yAxisId="right" type="monotone" dataKey="throughput" name="Throughput TB/day" stroke={T.navyL} strokeWidth={2} dot={{ r:3 }} />
                <Legend wrapperStyle={{ fontSize:10, fontFamily:T.font }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8, fontFamily:T.font }}>Avg Latency (ms) & Error Rate (%)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={WEEKLY_HEALTH}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
                <XAxis dataKey="week" tick={{ fontSize:10, fill:T.textMut }} />
                <YAxis yAxisId="left" tick={{ fontSize:10, fill:T.textMut }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:T.textMut }} />
                <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
                <Bar yAxisId="left" dataKey="latency" name="Latency (ms)" fill={T.gold} radius={[3,3,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="errors" name="Error %" stroke={T.red} strokeWidth={2} dot={{ r:3 }} />
                <Legend wrapperStyle={{ fontSize:10, fontFamily:T.font }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* Integration Roadmap */}
      <Section title="Integration Roadmap">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {INTEGRATION_ROADMAP.map((r,i) => (
            <div key={i} style={{ ...card, padding:14, borderLeft:`3px solid ${r.status==='In Progress'?T.gold:T.textMut}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color:T.navy, fontFamily:T.font }}>{r.name}</span>
                <span style={badge(r.status==='In Progress'?T.gold:T.textMut)}>{r.status}</span>
              </div>
              <div style={{ fontSize:11, color:T.textMut, fontFamily:T.font }}>{r.type} | Target: {r.quarter}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );

  /* ── Tab 4: Board Report ─────────────────────────────────────────────── */
  const renderBoardReport = () => (
    <div>
      {/* Controls */}
      <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:22, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ fontSize:12, fontWeight:600, color:T.textSec, fontFamily:T.font }}>From:</label>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, color:T.navy }} />
          <label style={{ fontSize:12, fontWeight:600, color:T.textSec, fontFamily:T.font }}>To:</label>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, color:T.navy }} />
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {AUDIENCES.map(a => (
            <button key={a} onClick={()=>setAudience(a)} style={pill(a===audience)}>{a}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
          <button onClick={exportCSV} style={{ ...pill(false), background:T.sage, color:'#fff', borderColor:T.sage }}>Export CSV</button>
          <button onClick={()=>window.print()} style={{ ...pill(false), background:T.navyL, color:'#fff', borderColor:T.navyL }}>Print Preview</button>
        </div>
      </div>

      {/* Section toggles */}
      <div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
        {REPORT_SECTIONS.map(s => (
          <button key={s} onClick={()=>toggleSection(s)}
            style={{ ...pill(reportSections[s]), fontSize:11, padding:'5px 14px' }}>
            {reportSections[s]?'✓':''} {s}
          </button>
        ))}
      </div>

      {/* Header card for audience */}
      <div style={{ ...card, marginBottom:22, padding:18, background:`linear-gradient(135deg, ${T.navy}, ${T.navyL})` }}>
        <div style={{ fontSize:18, fontWeight:800, color:'#fff', fontFamily:T.font }}>
          Climate Fintech & Digital MRV — {audience} Report
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontFamily:T.font, marginTop:4 }}>
          Period: {dateFrom} to {dateTo} | Generated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Section: Digital MRV Adoption */}
      {reportSections['Digital MRV Adoption'] && (
        <Section title="Digital MRV Adoption vs Traditional">
          <div style={card}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  {['Metric','Digital MRV','Traditional','Improvement'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 10px', color:T.textMut, fontWeight:600, fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ADOPTION_DATA.map((r,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.surfaceH}` }}>
                    <td style={{ padding:'8px 10px', fontWeight:600, color:T.navy }}>{r.metric}</td>
                    <td style={{ padding:'8px 10px', color:T.green, fontWeight:600, fontFamily:T.mono }}>{r.digital}</td>
                    <td style={{ padding:'8px 10px', color:T.textSec, fontFamily:T.mono }}>{r.traditional}</td>
                    <td style={{ padding:'8px 10px' }}><span style={badge(T.green)}>{r.improvement}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Section: ROI Analysis */}
      {reportSections['ROI Analysis'] && (
        <Section title="ROI Analysis — Digital vs Manual Verification ($M)">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8, fontFamily:T.font }}>Annual Cost Comparison</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ROI_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textMut }} />
                  <YAxis tick={{ fontSize:10, fill:T.textMut }} />
                  <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
                  <Bar dataKey="digitalCost" name="Digital Cost" fill={T.sage} radius={[4,4,0,0]} />
                  <Bar dataKey="manualCost" name="Manual Cost" fill={T.red} radius={[4,4,0,0]} opacity={0.6} />
                  <Legend wrapperStyle={{ fontSize:11, fontFamily:T.font }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8, fontFamily:T.font }}>Cumulative Savings</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={ROI_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceH} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textMut }} />
                  <YAxis tick={{ fontSize:10, fill:T.textMut }} />
                  <Tooltip contentStyle={{ fontFamily:T.font, fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
                  <Area type="monotone" dataKey="cumSavings" name="Cumulative Savings ($M)" stroke={T.gold} fill={T.gold} fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="savings" name="Annual Savings ($M)" stroke={T.sage} fill={T.sage} fillOpacity={0.15} />
                  <Legend wrapperStyle={{ fontSize:11, fontFamily:T.font }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>
      )}

      {/* Section: Regulatory Landscape */}
      {reportSections['Regulatory Landscape'] && (
        <Section title="Regulatory Landscape (EU Digital Finance, MiCA)">
          <div style={card}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  {['Regulation','Status','Impact','Deadline','Relevance'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'7px 8px', color:T.textMut, fontWeight:600, fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGULATORY_LANDSCAPE.map((r,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.surfaceH}` }}>
                    <td style={{ padding:'7px 8px', fontWeight:600, color:T.navy }}>{r.reg}</td>
                    <td style={{ padding:'7px 8px' }}>
                      <span style={badge(r.status==='Enforced'?T.green:r.status==='Active'?T.sage:r.status==='Evolving'?T.gold:T.textMut)}>{r.status}</span>
                    </td>
                    <td style={{ padding:'7px 8px', fontWeight:600, color:r.impact==='Critical'?T.red:r.impact==='High'?T.amber:T.textSec }}>{r.impact}</td>
                    <td style={{ padding:'7px 8px', fontFamily:T.mono, color:T.textSec, fontSize:11 }}>{r.deadline}</td>
                    <td style={{ padding:'7px 8px', color:T.textSec, fontSize:11, maxWidth:200 }}>{r.relevance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Section: Technology Readiness */}
      {reportSections['Technology Readiness'] && (
        <Section title="Technology Readiness Overview">
          <div style={card}>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="tech" tick={{ fontSize:11, fill:T.textSec, fontFamily:T.font }} />
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize:9, fill:T.textMut }} />
                <Radar name="Readiness" dataKey="readiness" stroke={T.sage} fill={T.sage} fillOpacity={0.25} />
                <Radar name="Adoption" dataKey="adoption" stroke={T.gold} fill={T.gold} fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize:11, fontFamily:T.font }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Section: Risk Assessment */}
      {reportSections['Risk Assessment'] && (
        <Section title="Risk Assessment">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {[
              { title:'Data Quality Risk', level:'Low', score:92, detail:'Multi-source validation with satellite cross-referencing achieves 99.2% accuracy', color:T.green },
              { title:'Technology Risk', level:'Medium', score:74, detail:'Blockchain interoperability standards still evolving; 3 platforms under evaluation', color:T.amber },
              { title:'Regulatory Risk', level:'Medium', score:68, detail:'MiCA enforcement requires updated smart contract compliance by Q4 2025', color:T.amber },
              { title:'Operational Risk', level:'Low', score:88, detail:'99.7% platform uptime with automated failover across 3 cloud regions', color:T.green },
              { title:'Cybersecurity Risk', level:'Low', score:91, detail:'SOC 2 Type II certified; zero breaches in 24 months; annual penetration testing', color:T.green },
              { title:'Vendor Concentration', level:'Medium', score:71, detail:'Top 3 providers represent 62% of satellite data; diversification in progress', color:T.amber },
            ].map((r,i) => (
              <div key={i} style={{ ...card, padding:16, borderLeft:`3px solid ${r.color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:T.navy, fontFamily:T.font }}>{r.title}</span>
                  <span style={badge(r.color)}>{r.level}</span>
                </div>
                <div style={{ fontSize:24, fontWeight:800, color:r.color, fontFamily:T.mono, marginBottom:6 }}>{r.score}/100</div>
                <div style={{ fontSize:11, color:T.textSec, lineHeight:1.4, fontFamily:T.font }}>{r.detail}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Section: Strategic Recommendations + Key Metrics Summary */}
      {reportSections['Strategic Recommendations'] && (
        <Section title="Key Performance Metrics Summary">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
            {[
              { label:'Total Verified Credits', value:'1.2M', delta:'+18% YoY', color:T.sage },
              { label:'Platform Cost Savings', value:'$40.9M', delta:'5-Year Cumulative', color:T.gold },
              { label:'Data Provider Coverage', value:'47', delta:'+19 vs FY 2024', color:T.navyL },
              { label:'Avg Verification Cost', value:'$42', delta:'-89% vs Manual', color:T.green },
            ].map((m,i) => (
              <div key={i} style={{ ...card, padding:16, textAlign:'center' }}>
                <div style={{ fontSize:11, color:T.textMut, fontWeight:600, fontFamily:T.font, textTransform:'uppercase', letterSpacing:0.5 }}>{m.label}</div>
                <div style={{ fontSize:24, fontWeight:800, color:m.color, fontFamily:T.mono, marginTop:4 }}>{m.value}</div>
                <div style={{ fontSize:11, color:T.textSec, fontFamily:T.font, marginTop:2 }}>{m.delta}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {reportSections['Strategic Recommendations'] && (
        <Section title="Strategic Recommendations">
          <div style={card}>
            <div style={{ display:'grid', gap:12 }}>
              {[
                { priority:'P1', rec:'Accelerate satellite MRV integration to achieve 98% coverage by Q2 2026', owner:'CTO', timeline:'Q1-Q2 2026', status:'In Progress' },
                { priority:'P1', rec:'Complete MiCA compliance for carbon credit tokenization smart contracts', owner:'Legal/Compliance', timeline:'Q4 2025', status:'On Track' },
                { priority:'P2', rec:'Expand IoT sensor network to cover Scope 3 supply chain monitoring', owner:'Operations', timeline:'Q2-Q3 2026', status:'Planning' },
                { priority:'P2', rec:'Implement zero-knowledge proofs for privacy-preserving ESG reporting', owner:'Engineering', timeline:'Q3-Q4 2026', status:'Research' },
                { priority:'P3', rec:'Establish data marketplace monetization strategy for anonymized climate datasets', owner:'Strategy', timeline:'H2 2026', status:'Scoping' },
              ].map((r,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px', borderRadius:10, background:T.surfaceH }}>
                  <span style={badge(r.priority==='P1'?T.red:r.priority==='P2'?T.amber:T.textMut)}>{r.priority}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.navy, fontFamily:T.font }}>{r.rec}</div>
                    <div style={{ fontSize:10, color:T.textMut, fontFamily:T.font, marginTop:2 }}>{r.owner} | {r.timeline}</div>
                  </div>
                  <span style={badge(
                    r.status==='In Progress'?T.sage:r.status==='On Track'?T.green:
                    r.status==='Planning'?T.gold:r.status==='Research'?T.navyL:T.textMut
                  )}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                               */
  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <span style={{ fontSize:22, fontWeight:800, color:T.navy, fontFamily:T.font }}>Climate Fintech & Digital MRV Hub</span>
          <span style={{ ...badge(T.sage), fontSize:10 }}>EP-AM6</span>
          <span style={{ ...badge(T.navyL), fontSize:10 }}>Sprint AM</span>
        </div>
        <div style={{ fontSize:13, color:T.textSec, fontFamily:T.font }}>
          Executive dashboard aggregating Digital MRV, Satellite Analytics, Blockchain Carbon, Data Marketplace & IoT Climate Intelligence
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:`2px solid ${T.border}`, paddingBottom:0 }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:'10px 22px', fontSize:13, fontWeight:tab===i?700:500,
            color:tab===i?T.navy:T.textMut, background:tab===i?T.surface:'transparent',
            border:`1px solid ${tab===i?T.border:'transparent'}`, borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',
            borderTopLeftRadius:10, borderTopRightRadius:10,
            cursor:'pointer', fontFamily:T.font, transition:'all .15s',
            marginBottom:-2,
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab===0 && renderExecutive()}
      {tab===1 && renderTechLandscape()}
      {tab===2 && renderIntegration()}
      {tab===3 && renderBoardReport()}

      {/* Footer */}
      <div style={{ marginTop:32, paddingTop:16, borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:11, color:T.textMut, fontFamily:T.font }}>
          Climate Fintech & Digital MRV Hub v2.4 | Data refreshed: {new Date().toLocaleString()} | Sources: {INTEGRATIONS.length} active integrations
        </div>
        <div style={{ display:'flex', gap:12 }}>
          {[
            { label:'Active APIs', value:INTEGRATIONS.filter(i=>i.status==='Active').length, color:T.green },
            { label:'Monitored Companies', value:COMPANIES.length, color:T.navyL },
            { label:'Tech Categories', value:TECH_CATEGORIES.length, color:T.gold },
          ].map((m,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:m.color, display:'inline-block' }} />
              <span style={{ fontSize:10, color:T.textMut, fontFamily:T.font }}>{m.label}: <strong style={{ color:T.textSec }}>{m.value}</strong></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
