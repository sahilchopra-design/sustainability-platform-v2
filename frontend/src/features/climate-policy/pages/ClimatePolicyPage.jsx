import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';
import { EMISSIONS_TARGETS, DATASET_METADATA } from '../../../data/countryEmissions';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const PIE_COLORS = [T.navy, T.sage, T.gold, T.red, T.amber, '#7c3aed', '#0d9488'];
const loadLS = (key) => { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } };
const LS_PORTFOLIO = 'ra_portfolio_v1';
const scoreColor = v => v >= 80 ? T.green : v >= 60 ? T.sage : v >= 40 ? T.amber : T.red;

/* ══════════════════════════════════════════════════════════════
   CLIMATE POLICY DATABASE — 30 countries
   ══════════════════════════════════════════════════════════════ */
const CLIMATE_POLICIES = [
  // Europe (12)
  { iso2:'DE', country:'Germany', region:'Europe', carbon_price_usd:45, carbon_pricing_type:'ETS + Carbon Tax', ets_coverage_pct:40, ndc_target:'-65% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:65, ndc_progress_pct:52, net_zero_year:2045, net_zero_law:true, climate_law:true, climate_law_name:'Federal Climate Change Act 2021', renewable_target_2030:'80%', renewable_current_pct:52, coal_phaseout_year:2038, ev_mandate:true, cbam_applicable:true, taxonomy_applicable:true, climate_finance_pledge_bn:6.0 },
  { iso2:'FR', country:'France', region:'Europe', carbon_price_usd:45, carbon_pricing_type:'ETS + Carbon Tax', ets_coverage_pct:38, ndc_target:'-55% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:55, ndc_progress_pct:45, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'Climate & Resilience Law 2021', renewable_target_2030:'40%', renewable_current_pct:25, coal_phaseout_year:2027, ev_mandate:true, cbam_applicable:true, taxonomy_applicable:true, climate_finance_pledge_bn:6.0 },
  { iso2:'GB', country:'United Kingdom', region:'Europe', carbon_price_usd:52, carbon_pricing_type:'UK ETS', ets_coverage_pct:33, ndc_target:'-68% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:68, ndc_progress_pct:55, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'Climate Change Act 2008 (amended)', renewable_target_2030:'50%', renewable_current_pct:43, coal_phaseout_year:2024, ev_mandate:true, cbam_applicable:false, taxonomy_applicable:true, climate_finance_pledge_bn:11.6 },
  { iso2:'SE', country:'Sweden', region:'Europe', carbon_price_usd:130, carbon_pricing_type:'ETS + Carbon Tax', ets_coverage_pct:42, ndc_target:'-63% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:63, ndc_progress_pct:58, net_zero_year:2045, net_zero_law:true, climate_law:true, climate_law_name:'Climate Policy Framework 2017', renewable_target_2030:'65%', renewable_current_pct:60, coal_phaseout_year:2022, ev_mandate:true, cbam_applicable:true, taxonomy_applicable:true, climate_finance_pledge_bn:1.2 },
  { iso2:'DK', country:'Denmark', region:'Europe', carbon_price_usd:45, carbon_pricing_type:'ETS + Carbon Tax', ets_coverage_pct:35, ndc_target:'-70% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:70, ndc_progress_pct:48, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'Climate Act 2020', renewable_target_2030:'100% power', renewable_current_pct:82, coal_phaseout_year:2028, ev_mandate:true, cbam_applicable:true, taxonomy_applicable:true, climate_finance_pledge_bn:0.5 },
  { iso2:'NL', country:'Netherlands', region:'Europe', carbon_price_usd:45, carbon_pricing_type:'ETS + Carbon Tax', ets_coverage_pct:36, ndc_target:'-55% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:55, ndc_progress_pct:40, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'Climate Act 2019', renewable_target_2030:'35%', renewable_current_pct:16, coal_phaseout_year:2030, ev_mandate:true, cbam_applicable:true, taxonomy_applicable:true, climate_finance_pledge_bn:1.3 },
  { iso2:'NO', country:'Norway', region:'Europe', carbon_price_usd:88, carbon_pricing_type:'Carbon Tax + ETS', ets_coverage_pct:30, ndc_target:'-55% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:55, ndc_progress_pct:35, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'Climate Change Act 2018', renewable_target_2030:'99% power', renewable_current_pct:98, coal_phaseout_year:null, ev_mandate:true, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:0.8 },
  { iso2:'FI', country:'Finland', region:'Europe', carbon_price_usd:45, carbon_pricing_type:'ETS + Carbon Tax', ets_coverage_pct:34, ndc_target:'-60% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:60, ndc_progress_pct:50, net_zero_year:2035, net_zero_law:true, climate_law:true, climate_law_name:'Climate Change Act 2022', renewable_target_2030:'51%', renewable_current_pct:47, coal_phaseout_year:2029, ev_mandate:true, cbam_applicable:true, taxonomy_applicable:true, climate_finance_pledge_bn:0.3 },
  { iso2:'CH', country:'Switzerland', region:'Europe', carbon_price_usd:130, carbon_pricing_type:'Carbon Levy + ETS', ets_coverage_pct:25, ndc_target:'-50% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:50, ndc_progress_pct:38, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'CO2 Act (revised 2023)', renewable_target_2030:'45%', renewable_current_pct:30, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:0.6 },
  { iso2:'ES', country:'Spain', region:'Europe', carbon_price_usd:45, carbon_pricing_type:'EU ETS', ets_coverage_pct:32, ndc_target:'-55% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:55, ndc_progress_pct:35, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'Climate Change Law 2021', renewable_target_2030:'42%', renewable_current_pct:26, coal_phaseout_year:2030, ev_mandate:true, cbam_applicable:true, taxonomy_applicable:true, climate_finance_pledge_bn:1.5 },
  { iso2:'IT', country:'Italy', region:'Europe', carbon_price_usd:45, carbon_pricing_type:'EU ETS', ets_coverage_pct:30, ndc_target:'-55% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:55, ndc_progress_pct:32, net_zero_year:2050, net_zero_law:false, climate_law:false, climate_law_name:'', renewable_target_2030:'30%', renewable_current_pct:22, coal_phaseout_year:2025, ev_mandate:true, cbam_applicable:true, taxonomy_applicable:true, climate_finance_pledge_bn:2.5 },
  { iso2:'PL', country:'Poland', region:'Europe', carbon_price_usd:45, carbon_pricing_type:'EU ETS', ets_coverage_pct:28, ndc_target:'-55% by 2030 vs 1990', ndc_base_year:1990, ndc_target_year:2030, ndc_reduction_pct:55, ndc_progress_pct:25, net_zero_year:2050, net_zero_law:false, climate_law:false, climate_law_name:'', renewable_target_2030:'23%', renewable_current_pct:18, coal_phaseout_year:2049, ev_mandate:false, cbam_applicable:true, taxonomy_applicable:true, climate_finance_pledge_bn:0.1 },
  // Americas (5)
  { iso2:'US', country:'United States', region:'Americas', carbon_price_usd:0, carbon_pricing_type:'State-level only (RGGI, CA)', ets_coverage_pct:8, ndc_target:'-50-52% by 2030 vs 2005', ndc_base_year:2005, ndc_target_year:2030, ndc_reduction_pct:51, ndc_progress_pct:28, net_zero_year:2050, net_zero_law:false, climate_law:true, climate_law_name:'Inflation Reduction Act 2022', renewable_target_2030:'40%', renewable_current_pct:22, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:11.4 },
  { iso2:'CA', country:'Canada', region:'Americas', carbon_price_usd:50, carbon_pricing_type:'Carbon Tax + OBPS', ets_coverage_pct:45, ndc_target:'-40-45% by 2030 vs 2005', ndc_base_year:2005, ndc_target_year:2030, ndc_reduction_pct:42, ndc_progress_pct:22, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'Net-Zero Emissions Accountability Act 2021', renewable_target_2030:'90% power', renewable_current_pct:68, coal_phaseout_year:2030, ev_mandate:true, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:5.3 },
  { iso2:'BR', country:'Brazil', region:'Americas', carbon_price_usd:0, carbon_pricing_type:'Under development', ets_coverage_pct:0, ndc_target:'-50% by 2030 vs 2005', ndc_base_year:2005, ndc_target_year:2030, ndc_reduction_pct:50, ndc_progress_pct:18, net_zero_year:2050, net_zero_law:false, climate_law:true, climate_law_name:'National Climate Policy 2009', renewable_target_2030:'48%', renewable_current_pct:48, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:0.0 },
  { iso2:'CL', country:'Chile', region:'Americas', carbon_price_usd:5, carbon_pricing_type:'Green Tax', ets_coverage_pct:12, ndc_target:'-Peak by 2025, -25% by 2030', ndc_base_year:2005, ndc_target_year:2030, ndc_reduction_pct:25, ndc_progress_pct:20, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'Framework Climate Change Law 2022', renewable_target_2030:'40%', renewable_current_pct:32, coal_phaseout_year:2040, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:true, climate_finance_pledge_bn:0.0 },
  { iso2:'MX', country:'Mexico', region:'Americas', carbon_price_usd:3, carbon_pricing_type:'Carbon Tax', ets_coverage_pct:5, ndc_target:'-22% by 2030 (BAU)', ndc_base_year:2013, ndc_target_year:2030, ndc_reduction_pct:22, ndc_progress_pct:10, net_zero_year:2050, net_zero_law:false, climate_law:true, climate_law_name:'General Law on Climate Change 2012', renewable_target_2030:'35%', renewable_current_pct:18, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:true, climate_finance_pledge_bn:0.0 },
  // Asia-Pacific (8)
  { iso2:'JP', country:'Japan', region:'Asia-Pacific', carbon_price_usd:2, carbon_pricing_type:'Carbon Tax + Pilot ETS', ets_coverage_pct:5, ndc_target:'-46% by 2030 vs 2013', ndc_base_year:2013, ndc_target_year:2030, ndc_reduction_pct:46, ndc_progress_pct:28, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'GX Promotion Act 2023', renewable_target_2030:'36-38%', renewable_current_pct:22, coal_phaseout_year:null, ev_mandate:true, cbam_applicable:false, taxonomy_applicable:true, climate_finance_pledge_bn:7.5 },
  { iso2:'CN', country:'China', region:'Asia-Pacific', carbon_price_usd:12, carbon_pricing_type:'National ETS', ets_coverage_pct:18, ndc_target:'Peak by 2030, -65% intensity vs 2005', ndc_base_year:2005, ndc_target_year:2030, ndc_reduction_pct:65, ndc_progress_pct:55, net_zero_year:2060, net_zero_law:false, climate_law:false, climate_law_name:'', renewable_target_2030:'1200GW wind+solar', renewable_current_pct:31, coal_phaseout_year:null, ev_mandate:true, cbam_applicable:false, taxonomy_applicable:true, climate_finance_pledge_bn:0.0 },
  { iso2:'IN', country:'India', region:'Asia-Pacific', carbon_price_usd:0, carbon_pricing_type:'PAT scheme (intensity)', ets_coverage_pct:3, ndc_target:'-45% intensity by 2030 vs 2005', ndc_base_year:2005, ndc_target_year:2030, ndc_reduction_pct:45, ndc_progress_pct:35, net_zero_year:2070, net_zero_law:false, climate_law:false, climate_law_name:'', renewable_target_2030:'50% power', renewable_current_pct:28, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:0.0 },
  { iso2:'KR', country:'South Korea', region:'Asia-Pacific', carbon_price_usd:18, carbon_pricing_type:'K-ETS', ets_coverage_pct:35, ndc_target:'-40% by 2030 vs 2018', ndc_base_year:2018, ndc_target_year:2030, ndc_reduction_pct:40, ndc_progress_pct:15, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'Carbon Neutrality Act 2021', renewable_target_2030:'21.5%', renewable_current_pct:9, coal_phaseout_year:null, ev_mandate:true, cbam_applicable:false, taxonomy_applicable:true, climate_finance_pledge_bn:0.5 },
  { iso2:'AU', country:'Australia', region:'Asia-Pacific', carbon_price_usd:0, carbon_pricing_type:'Safeguard Mechanism', ets_coverage_pct:22, ndc_target:'-43% by 2030 vs 2005', ndc_base_year:2005, ndc_target_year:2030, ndc_reduction_pct:43, ndc_progress_pct:20, net_zero_year:2050, net_zero_law:true, climate_law:true, climate_law_name:'Climate Change Act 2022', renewable_target_2030:'82% power', renewable_current_pct:32, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:true, climate_finance_pledge_bn:2.0 },
  { iso2:'SG', country:'Singapore', region:'Asia-Pacific', carbon_price_usd:25, carbon_pricing_type:'Carbon Tax', ets_coverage_pct:50, ndc_target:'Peak ~65Mt by 2030', ndc_base_year:2005, ndc_target_year:2030, ndc_reduction_pct:36, ndc_progress_pct:30, net_zero_year:2050, net_zero_law:false, climate_law:true, climate_law_name:'Carbon Pricing Act 2018', renewable_target_2030:'2 GW solar', renewable_current_pct:4, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:true, climate_finance_pledge_bn:0.3 },
  { iso2:'ID', country:'Indonesia', region:'Asia-Pacific', carbon_price_usd:2, carbon_pricing_type:'Carbon Tax (pilot)', ets_coverage_pct:5, ndc_target:'-31.89% by 2030 (BAU)', ndc_base_year:2010, ndc_target_year:2030, ndc_reduction_pct:32, ndc_progress_pct:12, net_zero_year:2060, net_zero_law:false, climate_law:false, climate_law_name:'', renewable_target_2030:'23%', renewable_current_pct:15, coal_phaseout_year:2056, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:true, climate_finance_pledge_bn:0.0 },
  { iso2:'VN', country:'Vietnam', region:'Asia-Pacific', carbon_price_usd:0, carbon_pricing_type:'Pilot ETS planned', ets_coverage_pct:0, ndc_target:'-15.8% by 2030 (BAU)', ndc_base_year:2014, ndc_target_year:2030, ndc_reduction_pct:16, ndc_progress_pct:8, net_zero_year:2050, net_zero_law:false, climate_law:false, climate_law_name:'', renewable_target_2030:'15-20%', renewable_current_pct:25, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:0.0 },
  // Africa & MENA (5)
  { iso2:'ZA', country:'South Africa', region:'Africa', carbon_price_usd:8, carbon_pricing_type:'Carbon Tax', ets_coverage_pct:12, ndc_target:'Peak 398-510Mt by 2030', ndc_base_year:2015, ndc_target_year:2030, ndc_reduction_pct:28, ndc_progress_pct:10, net_zero_year:2050, net_zero_law:false, climate_law:true, climate_law_name:'Climate Change Bill (draft)', renewable_target_2030:'25%', renewable_current_pct:8, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:true, climate_finance_pledge_bn:0.0 },
  { iso2:'AE', country:'United Arab Emirates', region:'MENA', carbon_price_usd:0, carbon_pricing_type:'None', ets_coverage_pct:0, ndc_target:'-31% by 2030 (BAU)', ndc_base_year:2019, ndc_target_year:2030, ndc_reduction_pct:31, ndc_progress_pct:15, net_zero_year:2050, net_zero_law:true, climate_law:false, climate_law_name:'', renewable_target_2030:'30%', renewable_current_pct:7, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:0.3 },
  { iso2:'SA', country:'Saudi Arabia', region:'MENA', carbon_price_usd:0, carbon_pricing_type:'None', ets_coverage_pct:0, ndc_target:'-278Mt reduction by 2030', ndc_base_year:2019, ndc_target_year:2030, ndc_reduction_pct:19, ndc_progress_pct:5, net_zero_year:2060, net_zero_law:false, climate_law:false, climate_law_name:'', renewable_target_2030:'50% power', renewable_current_pct:1, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:0.0 },
  { iso2:'EG', country:'Egypt', region:'MENA', carbon_price_usd:0, carbon_pricing_type:'None', ets_coverage_pct:0, ndc_target:'-33% by 2030 (conditional)', ndc_base_year:2015, ndc_target_year:2030, ndc_reduction_pct:33, ndc_progress_pct:8, net_zero_year:2050, net_zero_law:false, climate_law:false, climate_law_name:'', renewable_target_2030:'42%', renewable_current_pct:12, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:0.0 },
  { iso2:'KE', country:'Kenya', region:'Africa', carbon_price_usd:0, carbon_pricing_type:'None', ets_coverage_pct:0, ndc_target:'-32% by 2030 (BAU)', ndc_base_year:2010, ndc_target_year:2030, ndc_reduction_pct:32, ndc_progress_pct:20, net_zero_year:2050, net_zero_law:false, climate_law:true, climate_law_name:'Climate Change Act 2016', renewable_target_2030:'100% power', renewable_current_pct:90, coal_phaseout_year:null, ev_mandate:false, cbam_applicable:false, taxonomy_applicable:false, climate_finance_pledge_bn:0.0 },
];

/* ══════════════════════════════════════════════════════════════
   CARBON PRICING MAP
   ══════════════════════════════════════════════════════════════ */
const CARBON_PRICING = [
  { jurisdiction:'EU ETS', type:'Cap-and-Trade', price_usd:90, coverage_gt:1.4, coverage_pct_global:3.5, sectors:['Power','Industry','Aviation'], year_started:2005 },
  { jurisdiction:'UK ETS', type:'Cap-and-Trade', price_usd:52, coverage_gt:0.12, coverage_pct_global:0.3, sectors:['Power','Industry','Aviation'], year_started:2021 },
  { jurisdiction:'China National ETS', type:'Cap-and-Trade', price_usd:12, coverage_gt:4.5, coverage_pct_global:9.2, sectors:['Power'], year_started:2021 },
  { jurisdiction:'Canada Federal', type:'Carbon Tax + OBPS', price_usd:50, coverage_gt:0.28, coverage_pct_global:0.6, sectors:['All sectors'], year_started:2019 },
  { jurisdiction:'South Korea ETS', type:'Cap-and-Trade', price_usd:18, coverage_gt:0.45, coverage_pct_global:0.9, sectors:['Power','Industry','Buildings'], year_started:2015 },
  { jurisdiction:'Sweden Carbon Tax', type:'Carbon Tax', price_usd:130, coverage_gt:0.02, coverage_pct_global:0.05, sectors:['Heating','Transport'], year_started:1991 },
  { jurisdiction:'Switzerland ETS + Levy', type:'Hybrid', price_usd:130, coverage_gt:0.01, coverage_pct_global:0.03, sectors:['Heating','Industry'], year_started:2008 },
  { jurisdiction:'Norway Carbon Tax', type:'Carbon Tax', price_usd:88, coverage_gt:0.02, coverage_pct_global:0.05, sectors:['Oil & Gas','Transport'], year_started:1991 },
  { jurisdiction:'California Cap-and-Trade', type:'Cap-and-Trade', price_usd:38, coverage_gt:0.32, coverage_pct_global:0.6, sectors:['Power','Industry','Transport'], year_started:2012 },
  { jurisdiction:'RGGI (US Northeast)', type:'Cap-and-Trade', price_usd:15, coverage_gt:0.10, coverage_pct_global:0.2, sectors:['Power'], year_started:2009 },
  { jurisdiction:'Singapore Carbon Tax', type:'Carbon Tax', price_usd:25, coverage_gt:0.05, coverage_pct_global:0.1, sectors:['All large emitters'], year_started:2019 },
  { jurisdiction:'South Africa Carbon Tax', type:'Carbon Tax', price_usd:8, coverage_gt:0.12, coverage_pct_global:0.2, sectors:['Industry','Power'], year_started:2019 },
  { jurisdiction:'Chile Green Tax', type:'Carbon Tax', price_usd:5, coverage_gt:0.03, coverage_pct_global:0.06, sectors:['Power','Industry'], year_started:2017 },
  { jurisdiction:'Mexico Carbon Tax', type:'Carbon Tax', price_usd:3, coverage_gt:0.08, coverage_pct_global:0.2, sectors:['Fossil fuels'], year_started:2014 },
  { jurisdiction:'Japan Carbon Tax', type:'Carbon Tax', price_usd:2, coverage_gt:0.22, coverage_pct_global:0.4, sectors:['All fossil fuels'], year_started:2012 },
  { jurisdiction:'Indonesia Carbon Tax', type:'Carbon Tax (pilot)', price_usd:2, coverage_gt:0.05, coverage_pct_global:0.1, sectors:['Coal power'], year_started:2022 },
];

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow .15s, transform .1s', ...style }} onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,58,92,.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>{children}</div>
);
const KpiCard = ({ label, value, sub, color }) => (
  <Card><div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, marginBottom: 4 }}>{label}</div><div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.font }}>{value}</div>{sub && <div style={{ fontSize: 12, color: T.textMut, fontFamily: T.font, marginTop: 2 }}>{sub}</div>}</Card>
);
const Badge = ({ label, color }) => (
  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: color ? `${color}18` : `${T.navy}15`, color: color || T.navy, fontFamily: T.font }}>{label}</span>
);
const Section = ({ title, sub, children }) => (
  <div style={{ marginBottom: 28 }}><div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}><div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</div>{sub && <span style={{ fontSize: 12, color: T.textMut, fontFamily: T.font }}>{sub}</span>}</div>{children}</div>
);
const Btn = ({ children, onClick, variant, style }) => (
  <button onClick={onClick} style={{ padding: '8px 18px', borderRadius: 8, border: variant === 'outline' ? `1px solid ${T.border}` : 'none', background: variant === 'outline' ? T.surface : T.navy, color: variant === 'outline' ? T.navy : '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font, ...style }}>{children}</button>
);
const SortTh = ({ label, sortKey, sortCol, sortDir, onSort, style }) => (
  <th onClick={() => onSort(sortKey)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.navy, cursor: 'pointer', borderBottom: `2px solid ${T.border}`, fontFamily: T.font, userSelect: 'none', whiteSpace: 'nowrap', ...style }}>{label} {sortCol === sortKey ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25BD'}</th>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, background: T.surfaceH, borderRadius: 10, padding: 3, marginBottom: 20, flexWrap: 'wrap' }}>{tabs.map(t => (<button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: active === t ? T.surface : 'transparent', color: active === t ? T.navy : T.textSec, fontWeight: active === t ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: T.font, boxShadow: active === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none', minWidth: 100 }}>{t}</button>))}</div>
);

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */
const csvExport = (rows, cols, filename) => {
  const hdr = cols.map(c => c.label).join(',');
  const body = rows.map(r => cols.map(c => { const v = typeof c.key === 'function' ? c.key(r) : r[c.key]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v; }).join(',')).join('\n');
  const blob = new Blob([hdr + '\n' + body], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};
const jsonExport = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};
const printExport = () => window.print();
const pctOf = (arr, fn) => arr.length ? ((arr.filter(fn).length / arr.length) * 100).toFixed(0) : '0';

/* ══════════════════════════════════════════════════════════════
   TABS
   ══════════════════════════════════════════════════════════════ */
const TABS = ['NDCs & Net Zero', 'Carbon Pricing', 'Climate Legislation', 'Portfolio Policy Risk', 'Country Policy Table'];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
const ClimatePolicyPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [sortCol, setSortCol] = useState('carbon_price_usd');
  const [sortDir, setSortDir] = useState('desc');
  const [regionFilter, setRegionFilter] = useState('All');
  const [searchQ, setSearchQ] = useState('');

  const onSort = useCallback(col => { setSortDir(d => sortCol === col ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); setSortCol(col); }, [sortCol]);

  /* portfolio linkage */
  const portfolio = useMemo(() => {
    const p = loadLS(LS_PORTFOLIO);
    if (!p || !p.length) return GLOBAL_COMPANY_MASTER.slice(0, 30);
    return p.map(h => { const m = GLOBAL_COMPANY_MASTER.find(c => c.isin === h.isin || c.ticker === h.ticker); return m ? { ...m, ...h } : h; }).filter(Boolean);
  }, []);

  /* filtering */
  const filtered = useMemo(() => {
    let d = CLIMATE_POLICIES;
    if (regionFilter !== 'All') d = d.filter(c => c.region === regionFilter);
    if (searchQ) { const q = searchQ.toLowerCase(); d = d.filter(c => c.country.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q)); }
    return [...d].sort((a, b) => { const va = a[sortCol], vb = b[sortCol]; if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va; return sortDir === 'asc' ? String(va || '').localeCompare(String(vb || '')) : String(vb || '').localeCompare(String(va || '')); });
  }, [regionFilter, searchQ, sortCol, sortDir]);

  /* KPIs */
  const kpis = useMemo(() => {
    const db = CLIMATE_POLICIES;
    const carbonPricingCoverage = CARBON_PRICING.reduce((s, c) => s + c.coverage_pct_global, 0);
    const avgPrice = db.filter(c => c.carbon_price_usd > 0);
    return {
      countries: db.length,
      netZeroLaw: pctOf(db, c => c.net_zero_law),
      carbonCoverage: carbonPricingCoverage.toFixed(1),
      avgCarbonPrice: avgPrice.length ? (avgPrice.reduce((s, c) => s + c.carbon_price_usd, 0) / avgPrice.length).toFixed(0) : '0',
      parisAligned: pctOf(db, c => c.ndc_progress_pct >= 40),
      coalPhaseout: pctOf(db, c => c.coal_phaseout_year && c.coal_phaseout_year <= 2040),
      evMandate: pctOf(db, c => c.ev_mandate),
      cbam: pctOf(db, c => c.cbam_applicable),
      climateFinance: db.reduce((s, c) => s + c.climate_finance_pledge_bn, 0).toFixed(1),
      taxonomy: pctOf(db, c => c.taxonomy_applicable),
    };
  }, []);

  /* chart data */
  const ndcProgressData = useMemo(() =>
    [...CLIMATE_POLICIES].sort((a, b) => b.ndc_reduction_pct - a.ndc_reduction_pct).map(c => ({
      name: c.iso2, target: c.ndc_reduction_pct, progress: c.ndc_progress_pct, country: c.country
    })), []);

  const carbonPriceSorted = useMemo(() =>
    [...CARBON_PRICING].sort((a, b) => b.price_usd - a.price_usd), []);

  const netZeroTimeline = useMemo(() => {
    const years = {};
    CLIMATE_POLICIES.forEach(c => {
      if (c.net_zero_year) { const y = c.net_zero_year; if (!years[y]) years[y] = []; years[y].push(c.country); }
    });
    return Object.entries(years).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([year, countries]) => ({ year: parseInt(year), count: countries.length, countries: countries.join(', ') }));
  }, []);

  const renewableGapData = useMemo(() =>
    [...CLIMATE_POLICIES].sort((a, b) => {
      const gapA = parseInt(a.renewable_target_2030) - a.renewable_current_pct;
      const gapB = parseInt(b.renewable_target_2030) - b.renewable_current_pct;
      return gapB - gapA;
    }).map(c => ({
      name: c.iso2, current: c.renewable_current_pct, target: parseInt(c.renewable_target_2030) || c.renewable_current_pct + 10, country: c.country
    })), []);

  /* Policy risk heatmap for portfolio */
  const policyDimensions = ['carbon_price_usd', 'ets_coverage_pct', 'taxonomy_applicable', 'cbam_applicable', 'ev_mandate', 'climate_law'];
  const policyLabels = { carbon_price_usd: 'Carbon Price', ets_coverage_pct: 'ETS Coverage', taxonomy_applicable: 'Taxonomy', cbam_applicable: 'CBAM', ev_mandate: 'EV Mandate', climate_law: 'Climate Law' };

  const portfolioPolicyExposure = useMemo(() => {
    const countryMap = {};
    CLIMATE_POLICIES.forEach(p => { countryMap[p.iso2] = p; countryMap[p.country] = p; });
    const result = [];
    const seen = new Set();
    portfolio.forEach(h => {
      const cn = h.country || h._region || '';
      if (seen.has(cn)) return;
      seen.add(cn);
      const pol = countryMap[cn];
      if (pol) result.push({ country: cn, ...pol });
    });
    return result;
  }, [portfolio]);

  /* CBAM impact */
  const cbamCountries = useMemo(() => CLIMATE_POLICIES.filter(c => c.cbam_applicable), []);
  const cbamExposedCompanies = useMemo(() => {
    const cbamIso = new Set(cbamCountries.map(c => c.iso2));
    return portfolio.filter(h => {
      const cn = h.country || '';
      return !cbamIso.has(cn) && (h.sector || '').match(/energy|material|industrial|cement|steel|alumin/i);
    });
  }, [portfolio, cbamCountries]);

  /* Climate finance */
  const climateFinanceData = useMemo(() =>
    CLIMATE_POLICIES.filter(c => c.climate_finance_pledge_bn > 0).sort((a, b) => b.climate_finance_pledge_bn - a.climate_finance_pledge_bn), []);

  /* ── RENDER ── */
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.navy, letterSpacing: '-0.5px' }}>Climate Policy Tracker</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Badge label="30 Countries" color={T.navy} /><Badge label="NDCs" color={T.sage} /><Badge label="Carbon Pricing" color={T.gold} /><Badge label="Net Zero Laws" color={T.amber} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" onClick={() => csvExport(CLIMATE_POLICIES, [
            { label:'Country', key:'country' },{ label:'ISO2', key:'iso2' },{ label:'Carbon Price', key:'carbon_price_usd' },{ label:'Carbon Type', key:'carbon_pricing_type' },
            { label:'NDC Target', key:'ndc_target' },{ label:'NDC Progress %', key:'ndc_progress_pct' },{ label:'Net Zero Year', key:'net_zero_year' },{ label:'Net Zero Law', key: r => r.net_zero_law ? 'Yes':'No' },
            { label:'Climate Law', key: r => r.climate_law ? 'Yes':'No' },{ label:'Renewable Target', key:'renewable_target_2030' },{ label:'Renewable Current %', key:'renewable_current_pct' },
            { label:'CBAM', key: r => r.cbam_applicable ? 'Yes':'No' },{ label:'Taxonomy', key: r => r.taxonomy_applicable ? 'Yes':'No' },{ label:'Climate Finance $Bn', key:'climate_finance_pledge_bn' }
          ], 'climate_policy_export.csv')}>Export CSV</Btn>
          <Btn variant="outline" onClick={() => jsonExport({ policies: CLIMATE_POLICIES, carbonPricing: CARBON_PRICING }, 'climate_policy_data.json')}>Export JSON</Btn>
          <Btn variant="outline" onClick={printExport}>Print</Btn>
          <Btn onClick={() => navigate('/sovereign-esg')}>Sovereign ESG</Btn>
        </div>
      </div>

      {/* Tabs + Controls */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search countries..." style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, width: 220 }} />
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 }}>
          <option value="All">All Regions</option>{['Europe','Americas','Asia-Pacific','Africa','MENA'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* ═══ TAB 1: NDCs & Net Zero ═══ */}
      {tab === TABS[0] && (<>
        {/* 10 KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
          <KpiCard label="Countries Tracked" value={kpis.countries} sub="30 sovereigns" />
          <KpiCard label="Net Zero Laws" value={`${kpis.netZeroLaw}%`} color={parseInt(kpis.netZeroLaw) > 50 ? T.green : T.amber} sub="legally binding" />
          <KpiCard label="Carbon Pricing Coverage" value={`${kpis.carbonCoverage}%`} sub="of global emissions" />
          <KpiCard label="Avg Carbon Price" value={`$${kpis.avgCarbonPrice}`} sub="USD/tCO2 (priced only)" />
          <KpiCard label="On-Track NDCs" value={`${kpis.parisAligned}%`} color={parseInt(kpis.parisAligned) > 40 ? T.green : T.red} sub="40%+ progress" />
          <KpiCard label="Coal Phaseout" value={`${kpis.coalPhaseout}%`} sub="committed by 2040" />
          <KpiCard label="EV Mandates" value={`${kpis.evMandate}%`} sub="countries with mandates" />
          <KpiCard label="CBAM Applicable" value={`${kpis.cbam}%`} sub="EU border adjustment" />
          <KpiCard label="Climate Finance" value={`$${kpis.climateFinance}Bn`} color={T.sage} sub="pledged (developed)" />
          <KpiCard label="Taxonomy Adopted" value={`${kpis.taxonomy}%`} sub="green taxonomy" />
        </div>

        {/* NDC Progress Chart */}
        <Section title="NDC Progress: Target vs Current" sub="Reduction target % vs estimated progress %">
          <Card><ResponsiveContainer width="100%" height={450}>
            <BarChart data={ndcProgressData} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{ fontSize: 10, angle: -30 }} height={50} /><YAxis domain={[0, 80]} tick={{ fontSize: 11 }} /><Tooltip content={({ payload }) => payload && payload[0] ? <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12 }}><div style={{ fontWeight: 700 }}>{payload[0].payload.country}</div><div>Target: {payload[0].payload.target}%</div><div>Progress: {payload[0].payload.progress}%</div></div> : null} /><Legend />
              <Bar dataKey="target" name="NDC Target %" fill={T.navy} opacity={0.4} radius={[4,4,0,0]} />
              <Bar dataKey="progress" name="Current Progress %" fill={T.sage} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer></Card>
        </Section>

        {/* Net Zero Timeline */}
        <Section title="Net Zero Commitment Timeline" sub="When countries plan to reach net zero emissions">
          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, height: 220, padding: '20px 0' }}>
              {netZeroTimeline.map((item, i) => (
                <div key={item.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{item.count}</div>
                  <div style={{ width: '70%', background: item.year <= 2050 ? T.sage : T.amber, borderRadius: '4px 4px 0 0', height: item.count * 30, minHeight: 20, transition: 'height .3s' }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginTop: 8 }}>{item.year}</div>
                  <div style={{ fontSize: 10, color: T.textMut, textAlign: 'center', maxWidth: 100, marginTop: 4, lineHeight: '1.3' }}>{item.countries}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* Renewable Target Tracker */}
        <Section title="Renewable Energy: Current vs 2030 Target" sub="Country renewable electricity targets">
          <Card><ResponsiveContainer width="100%" height={400}>
            <BarChart data={renewableGapData} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{ fontSize: 10, angle: -30 }} height={50} /><YAxis domain={[0, 110]} tick={{ fontSize: 11 }} /><Tooltip content={({ payload }) => payload && payload[0] ? <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12 }}><div style={{ fontWeight: 700 }}>{payload[0].payload.country}</div><div>Current: {payload[0].payload.current}%</div><div>Target: {payload[0].payload.target}%</div></div> : null} /><Legend />
              <Bar dataKey="current" name="Current %" fill={T.sage} radius={[4,4,0,0]} />
              <Bar dataKey="target" name="2030 Target %" fill={T.gold} opacity={0.5} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer></Card>
        </Section>

        {/* NDC Targets Reference — real Paris Agreement pledges (OWID / IEA / UNFCCC) */}
        <Section title="Real NDC Targets — Paris Agreement Pledges" sub={`Source: ${DATASET_METADATA.primarySource} · UNFCCC NDC Registry · CC BY 4.0`}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '8px 12px', background: '#16a34a15', border: '1px solid #16a34a55', borderRadius: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>✓ Real NDC data: UNFCCC / Climate Action Tracker / OWID 2023</span>
              <span style={{ fontSize: 11, color: '#5c6b7e', marginLeft: 'auto' }}>{EMISSIONS_TARGETS.length} major emitters tracked</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {EMISSIONS_TARGETS.map((t, i) => (
                <div key={t.iso3 || i} style={{ border: `1px solid #e5e0d8`, borderRadius: 8, padding: 14, background: '#f6f4f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: '#1b3a5c', fontSize: 14 }}>{t.country}</div>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: t.onTrack === true ? '#16a34a' : t.onTrack === false ? '#dc2626' : '#d97706',
                      background: t.onTrack === true ? '#16a34a15' : t.onTrack === false ? '#dc262615' : '#d9770615',
                      border: `1px solid ${t.onTrack === true ? '#16a34a55' : t.onTrack === false ? '#dc262655' : '#d9770655'}`,
                      borderRadius: 4, padding: '2px 7px',
                    }}>
                      {t.onTrack === true ? 'On Track' : t.onTrack === false ? 'Off Track' : 'Partial'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#2c5a8c', marginBottom: 6 }}>{t.target}</div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#9aa3ae' }}>Net Zero</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.netZero <= 2050 ? '#16a34a' : '#d97706' }}>{t.netZero}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#9aa3ae' }}>Reduction</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1b3a5c' }}>{t.reductionPct}%</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#9aa3ae' }}>Legislation</div>
                      <div style={{ fontSize: 11, color: '#5c6b7e' }}>{t.legislation}</div>
                    </div>
                  </div>
                  {t.notes && (
                    <div style={{ fontSize: 11, color: '#5c6b7e', lineHeight: 1.5, borderTop: '1px solid #e5e0d8', paddingTop: 8 }}>{t.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* Climate Finance */}
        <Section title="Climate Finance Pledges" sub="Developed country commitments ($Bn)">
          {climateFinanceData.length === 0 ? (
            <Card><div style={{ padding: 40, textAlign: 'center', color: T.textMut }}>No climate finance pledges found for filtered countries.</div></Card>
          ) : (
            <Card><ResponsiveContainer width="100%" height={300}>
              <BarChart data={climateFinanceData} layout="vertical" margin={{ left: 120 }}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} width={115} />
                <Tooltip /><Bar dataKey="climate_finance_pledge_bn" name="Pledge ($Bn)" fill={T.navy} radius={[0,4,4,0]}>{climateFinanceData.map((c, i) => <Cell key={i} fill={c.climate_finance_pledge_bn > 5 ? T.sage : T.gold} />)}</Bar>
              </BarChart>
            </ResponsiveContainer></Card>
          )}
        </Section>
      </>)}

      {/* ═══ TAB 2: Carbon Pricing ═══ */}
      {tab === TABS[1] && (<>
        {/* Carbon Pricing Table */}
        <Section title="Global Carbon Pricing Mechanisms" sub={`${CARBON_PRICING.length} jurisdictions tracked`}>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead><tr style={{ background: T.surfaceH }}>
                {['Jurisdiction','Type','Price (USD/t)','Coverage (Gt CO2)','% Global Emissions','Sectors','Year Started'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{CARBON_PRICING.map((c, i) => (
                <tr key={c.jurisdiction} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.jurisdiction}</td>
                  <td style={{ padding: '8px 12px' }}><Badge label={c.type} color={c.type.includes('Cap') ? T.navy : c.type.includes('Tax') ? T.gold : T.sage} /></td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: c.price_usd > 50 ? T.green : c.price_usd > 10 ? T.amber : T.red }}>${c.price_usd}</td>
                  <td style={{ padding: '8px 12px' }}>{c.coverage_gt} Gt</td>
                  <td style={{ padding: '8px 12px' }}>{c.coverage_pct_global}%</td>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>{c.sectors.join(', ')}</td>
                  <td style={{ padding: '8px 12px' }}>{c.year_started}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>

        {/* Carbon Price Comparison */}
        <Section title="Carbon Price Comparison by Jurisdiction" sub="USD per tonne CO2e, color by mechanism type">
          <Card><ResponsiveContainer width="100%" height={450}>
            <BarChart data={carbonPriceSorted} layout="vertical" margin={{ left: 160 }}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="jurisdiction" type="category" tick={{ fontSize: 10 }} width={155} />
              <Tooltip /><Bar dataKey="price_usd" name="Carbon Price (USD/t)">{carbonPriceSorted.map((c, i) => <Cell key={i} fill={c.type.includes('Cap') ? T.navy : c.type.includes('Tax') ? T.gold : T.sage} />)}</Bar>
            </BarChart>
          </ResponsiveContainer></Card>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: T.textSec }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: T.navy, marginRight: 4 }} />Cap-and-Trade</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: T.gold, marginRight: 4 }} />Carbon Tax</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: T.sage, marginRight: 4 }} />Hybrid</span>
          </div>
        </Section>

        {/* Paris Agreement Tracker table */}
        <Section title="Paris Agreement NDC Tracker" sub="Submission status, ambition, and implementation">
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead><tr style={{ background: T.surfaceH }}>
                {['Country','NDC Target','Base Year','Target Year','Reduction %','Progress %','Gap %'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{[...CLIMATE_POLICIES].sort((a, b) => b.ndc_reduction_pct - a.ndc_reduction_pct).map((c, i) => {
                const gap = c.ndc_reduction_pct - c.ndc_progress_pct;
                return (
                  <tr key={c.iso2} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.iso2} {c.country}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11 }}>{c.ndc_target}</td>
                    <td style={{ padding: '8px 12px' }}>{c.ndc_base_year}</td>
                    <td style={{ padding: '8px 12px' }}>{c.ndc_target_year}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>{c.ndc_reduction_pct}%</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${(c.ndc_progress_pct / c.ndc_reduction_pct) * 100}%`, height: '100%', background: c.ndc_progress_pct / c.ndc_reduction_pct > 0.5 ? T.green : T.amber, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{c.ndc_progress_pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', color: gap > 30 ? T.red : T.amber, fontWeight: 600 }}>{gap}%</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </Section>
      </>)}

      {/* ═══ TAB 3: Climate Legislation ═══ */}
      {tab === TABS[2] && (<>
        <Section title="Climate Legislation Dashboard" sub="Countries with climate laws, coal phaseout, EV mandates">
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead><tr style={{ background: T.surfaceH }}>
                {['Country','Climate Law','Law Name','Net Zero Year','Net Zero Law','Coal Phaseout','EV Mandate','CBAM','Taxonomy','Renewable Target'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{CLIMATE_POLICIES.map((c, i) => (
                <tr key={c.iso2} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.iso2} {c.country}</td>
                  <td style={{ padding: '8px 12px' }}>{c.climate_law ? <span style={{ color: T.green, fontWeight: 700 }}>Yes</span> : <span style={{ color: T.red }}>No</span>}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.climate_law_name || '-'}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: c.net_zero_year <= 2050 ? T.green : T.amber }}>{c.net_zero_year}</td>
                  <td style={{ padding: '8px 12px' }}>{c.net_zero_law ? <span style={{ color: T.green, fontWeight: 700 }}>Yes</span> : <span style={{ color: T.textMut }}>No</span>}</td>
                  <td style={{ padding: '8px 12px' }}>{c.coal_phaseout_year ? <span style={{ color: c.coal_phaseout_year <= 2030 ? T.green : T.amber }}>{c.coal_phaseout_year}</span> : <span style={{ color: T.textMut }}>None</span>}</td>
                  <td style={{ padding: '8px 12px' }}>{c.ev_mandate ? <span style={{ color: T.green }}>Yes</span> : <span style={{ color: T.textMut }}>No</span>}</td>
                  <td style={{ padding: '8px 12px' }}>{c.cbam_applicable ? <span style={{ color: T.navy, fontWeight: 600 }}>Yes</span> : '-'}</td>
                  <td style={{ padding: '8px 12px' }}>{c.taxonomy_applicable ? <span style={{ color: T.sage }}>Yes</span> : '-'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>{c.renewable_target_2030}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>

        {/* CBAM Impact Assessment */}
        <Section title="CBAM Impact Assessment" sub="EU Carbon Border Adjustment Mechanism exposure">
          <Card>
            <div style={{ fontSize: 13, color: T.text, marginBottom: 16 }}>
              The EU CBAM applies to imports of carbon-intensive goods (cement, steel, aluminum, fertilizers, electricity, hydrogen) into the EU.
              Countries within the EU ETS ({cbamCountries.map(c => c.iso2).join(', ')}) are exempt. Non-EU portfolio companies in exposed sectors face potential CBAM costs.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>CBAM-Covered Countries ({cbamCountries.length})</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{cbamCountries.map(c => <Badge key={c.iso2} label={`${c.iso2} ${c.country}`} color={T.navy} />)}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Potentially Exposed Holdings ({cbamExposedCompanies.length})</div>
                {cbamExposedCompanies.length > 0 ? (
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>{cbamExposedCompanies.slice(0, 10).map((h, i) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>{h.name || h.ticker}</span> <span style={{ color: T.textMut }}>({h.sector || 'N/A'})</span>
                    </div>
                  ))}</div>
                ) : <div style={{ color: T.textMut, fontSize: 12 }}>No directly exposed holdings identified in current portfolio.</div>}
              </div>
            </div>
          </Card>
        </Section>
      </>)}

      {/* ═══ TAB 4: Portfolio Policy Risk ═══ */}
      {tab === TABS[3] && (<>
        <Section title="Policy Risk Heatmap" sub="Portfolio holdings mapped to 6 policy dimensions">
          {portfolioPolicyExposure.length === 0 ? (
            <Card><div style={{ padding: 40, textAlign: 'center', color: T.textMut }}>No portfolio-policy mapping available. Build a portfolio to see policy risk exposure across your holdings.</div></Card>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>Country</th>
                  {policyDimensions.map(d => (
                    <th key={d} style={{ padding: '10px 12px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>{policyLabels[d]}</th>
                  ))}
                </tr></thead>
                <tbody>{portfolioPolicyExposure.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.iso2} {c.country}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, background: c.carbon_price_usd > 40 ? `${T.red}20` : c.carbon_price_usd > 10 ? `${T.amber}20` : `${T.green}20`, color: c.carbon_price_usd > 40 ? T.red : c.carbon_price_usd > 10 ? T.amber : T.green, fontWeight: 600 }}>${c.carbon_price_usd}</div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, background: c.ets_coverage_pct > 30 ? `${T.amber}20` : `${T.green}20`, color: c.ets_coverage_pct > 30 ? T.amber : T.green, fontWeight: 600 }}>{c.ets_coverage_pct}%</div>
                    </td>
                    {['taxonomy_applicable','cbam_applicable','ev_mandate','climate_law'].map(key => (
                      <td key={key} style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', width: 24, height: 24, borderRadius: '50%', background: c[key] ? `${T.amber}30` : `${T.green}20`, color: c[key] ? T.amber : T.green, fontWeight: 700, lineHeight: '24px', fontSize: 14 }}>{c[key] ? '\u2713' : '-'}</div>
                      </td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Policy dimension distribution charts */}
        <Section title="Policy Dimension Distribution" sub="Breakdown across 30 tracked countries">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { label: 'Carbon Pricing Type', data: (() => { const m = {}; CLIMATE_POLICIES.forEach(c => { const t = c.carbon_price_usd > 0 ? (c.carbon_pricing_type.includes('ETS') ? 'ETS-based' : 'Tax-based') : 'None'; m[t] = (m[t] || 0) + 1; }); return Object.entries(m).map(([name, value]) => ({ name, value })); })() },
              { label: 'Net Zero Law Status', data: [{ name: 'Has Law', value: CLIMATE_POLICIES.filter(c => c.net_zero_law).length }, { name: 'No Law', value: CLIMATE_POLICIES.filter(c => !c.net_zero_law).length }] },
              { label: 'Taxonomy Adoption', data: [{ name: 'Adopted', value: CLIMATE_POLICIES.filter(c => c.taxonomy_applicable).length }, { name: 'Not Adopted', value: CLIMATE_POLICIES.filter(c => !c.taxonomy_applicable).length }] },
            ].map(chart => (
              <Card key={chart.label}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8, textAlign: 'center' }}>{chart.label}</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={chart.data} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {chart.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </Card>
            ))}
          </div>
        </Section>
      </>)}

      {/* ═══ TAB 5: Country Policy Table ═══ */}
      {tab === TABS[4] && (<>
        <Section title="Sortable Country Policy Table" sub={`${filtered.length} countries | Click column headers to sort`}>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead><tr style={{ background: T.surfaceH }}>
                <SortTh label="Country" sortKey="country" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Region" sortKey="region" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Carbon $" sortKey="carbon_price_usd" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Pricing Type" sortKey="carbon_pricing_type" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="ETS %" sortKey="ets_coverage_pct" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="NDC %" sortKey="ndc_reduction_pct" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Progress" sortKey="ndc_progress_pct" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Net Zero" sortKey="net_zero_year" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Law" sortKey="climate_law" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Renew Target" sortKey="renewable_target_2030" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Renew Now" sortKey="renewable_current_pct" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Coal Out" sortKey="coal_phaseout_year" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="EV" sortKey="ev_mandate" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="CBAM" sortKey="cbam_applicable" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Finance$Bn" sortKey="climate_finance_pledge_bn" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              </tr></thead>
              <tbody>{filtered.map((c, i) => (
                <tr key={c.iso2} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.iso2} {c.country}</td>
                  <td style={{ padding: '8px 12px' }}>{c.region}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: c.carbon_price_usd > 50 ? T.green : c.carbon_price_usd > 0 ? T.amber : T.red }}>${c.carbon_price_usd}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>{c.carbon_pricing_type}</td>
                  <td style={{ padding: '8px 12px' }}>{c.ets_coverage_pct}%</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.ndc_reduction_pct}%</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 50, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(c.ndc_progress_pct / Math.max(c.ndc_reduction_pct, 1)) * 100}%`, height: '100%', background: c.ndc_progress_pct / c.ndc_reduction_pct > 0.5 ? T.green : T.amber, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11 }}>{c.ndc_progress_pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: c.net_zero_year <= 2050 ? T.green : T.amber }}>{c.net_zero_year}</td>
                  <td style={{ padding: '8px 12px' }}>{c.climate_law ? <span style={{ color: T.green }}>Yes</span> : <span style={{ color: T.red }}>No</span>}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>{c.renewable_target_2030}</td>
                  <td style={{ padding: '8px 12px' }}>{c.renewable_current_pct}%</td>
                  <td style={{ padding: '8px 12px' }}>{c.coal_phaseout_year || '-'}</td>
                  <td style={{ padding: '8px 12px' }}>{c.ev_mandate ? 'Yes' : '-'}</td>
                  <td style={{ padding: '8px 12px' }}>{c.cbam_applicable ? 'Yes' : '-'}</td>
                  <td style={{ padding: '8px 12px' }}>{c.climate_finance_pledge_bn > 0 ? `$${c.climate_finance_pledge_bn}` : '-'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: T.textMut }}>No countries match your filter criteria. Try broadening your search.</div>}
        </Section>

        {/* Cross-nav */}
        <Section title="Cross-Navigation" sub="Related analytics modules">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Sovereign ESG Scorer', path: '/sovereign-esg' },
              { label: 'Transition Risk', path: '/transition-risk' },
              { label: 'NGFS Scenarios', path: '/ngfs-scenarios' },
              { label: 'Stranded Assets', path: '/stranded-assets' },
              { label: 'Regulatory Calendar', path: '/regulatory-calendar' },
              { label: 'Scenario Stress Test', path: '/scenario-stress-test' },
            ].map(link => (
              <Btn key={link.path} variant="outline" onClick={() => navigate(link.path)}>{link.label}</Btn>
            ))}
          </div>
        </Section>
      </>)}

      {/* Footer */}
      <div style={{ marginTop: 40, padding: '16px 0', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}>
        <span>Climate Policy Tracker | Sprint O - EP-O2 | 30 Countries</span>
        <span>Data: Climate Action Tracker, World Bank Carbon Pricing, UNFCCC, IEA | Updated Mar 2026</span>
      </div>
    </div>
  );
};

export default ClimatePolicyPage;
