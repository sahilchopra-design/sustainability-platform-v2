import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine, PieChart, Pie
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899', '#f97316', '#6366f1'];
const seed = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════
   SPRINT O MODULES
   ══════════════════════════════════════════════════════════════ */
const MODULES = [
  { id: 'sovereign-esg', name: 'Sovereign ESG Ratings', icon: '\uD83C\uDFF3\uFE0F', path: '/sovereign-esg', color: T.navy, status: 'Active', kpi: 'Weighted ESG', kpiKey: 'wtdESG' },
  { id: 'climate-policy', name: 'Climate Policy Dashboard', icon: '\uD83C\uDFDB\uFE0F', path: '/climate-policy', color: T.sage, status: 'Active', kpi: 'Avg Carbon Price', kpiKey: 'avgCarbonPrice' },
  { id: 'macro-transition', name: 'Macro Transition Pathways', icon: '\u26A1', path: '/macro-transition', color: T.gold, status: 'Active', kpi: 'Renewable %', kpiKey: 'renewablePct' },
  { id: 'just-transition', name: 'Just Transition Monitor', icon: '\u2696\uFE0F', path: '/just-transition', color: '#7c3aed', status: 'Active', kpi: 'JT Score', kpiKey: 'jtScore' },
  { id: 'paris-alignment', name: 'Paris Agreement Alignment', icon: '\uD83C\uDF21\uFE0F', path: '/paris-alignment', color: T.green, status: 'Active', kpi: 'Portfolio ITR', kpiKey: 'portfolioITR' },
];

/* ══════════════════════════════════════════════════════════════
   SOVEREIGN ESG DATA (40 countries)
   ══════════════════════════════════════════════════════════════ */
const COUNTRY_DATA = [
  { iso2:'US', name:'United States', region:'Americas', esg:62, ndgain:72.8, carbon_price:0, ets:false, taxonomy:false, cbam:false, coal_phaseout:2035, ev_target:50, renewable_pct:22, emissions_capita:14.7, green_bond_bn:45.2, jt_score:55, hdi:0.921, cpi:69, net_zero:2050, nz_law:false, paris_aligned:false, portfolio_itr:2.4, workers_affected:820000 },
  { iso2:'CN', name:'China', region:'Asia-Pacific', esg:48, ndgain:55.2, carbon_price:8, ets:true, taxonomy:true, cbam:false, coal_phaseout:2060, ev_target:40, renewable_pct:31, emissions_capita:8.0, green_bond_bn:85.4, jt_score:42, hdi:0.768, cpi:42, net_zero:2060, nz_law:false, paris_aligned:false, portfolio_itr:2.8, workers_affected:3200000 },
  { iso2:'IN', name:'India', region:'Asia-Pacific', esg:44, ndgain:45.2, carbon_price:0, ets:false, taxonomy:true, cbam:false, coal_phaseout:2070, ev_target:30, renewable_pct:28, emissions_capita:1.9, green_bond_bn:12.8, jt_score:38, hdi:0.633, cpi:40, net_zero:2070, nz_law:false, paris_aligned:true, portfolio_itr:2.6, workers_affected:4100000 },
  { iso2:'DE', name:'Germany', region:'Europe', esg:78, ndgain:74.5, carbon_price:45, ets:true, taxonomy:true, cbam:true, coal_phaseout:2038, ev_target:100, renewable_pct:47, emissions_capita:8.1, green_bond_bn:32.4, jt_score:72, hdi:0.942, cpi:79, net_zero:2045, nz_law:true, paris_aligned:false, portfolio_itr:1.9, workers_affected:120000 },
  { iso2:'GB', name:'United Kingdom', region:'Europe', esg:76, ndgain:73.2, carbon_price:52, ets:true, taxonomy:true, cbam:true, coal_phaseout:2024, ev_target:100, renewable_pct:43, emissions_capita:5.2, green_bond_bn:28.6, jt_score:68, hdi:0.929, cpi:73, net_zero:2050, nz_law:true, paris_aligned:true, portfolio_itr:1.8, workers_affected:95000 },
  { iso2:'FR', name:'France', region:'Europe', esg:75, ndgain:72.1, carbon_price:45, ets:true, taxonomy:true, cbam:true, coal_phaseout:2022, ev_target:100, renewable_pct:25, emissions_capita:4.6, green_bond_bn:42.1, jt_score:70, hdi:0.903, cpi:71, net_zero:2050, nz_law:true, paris_aligned:true, portfolio_itr:1.7, workers_affected:85000 },
  { iso2:'JP', name:'Japan', region:'Asia-Pacific', esg:65, ndgain:68.4, carbon_price:3, ets:true, taxonomy:true, cbam:false, coal_phaseout:2050, ev_target:100, renewable_pct:22, emissions_capita:8.4, green_bond_bn:18.2, jt_score:58, hdi:0.925, cpi:73, net_zero:2050, nz_law:true, paris_aligned:false, portfolio_itr:2.2, workers_affected:180000 },
  { iso2:'BR', name:'Brazil', region:'Americas', esg:45, ndgain:52.8, carbon_price:0, ets:false, taxonomy:false, cbam:false, coal_phaseout:2040, ev_target:20, renewable_pct:84, emissions_capita:2.3, green_bond_bn:8.4, jt_score:40, hdi:0.754, cpi:38, net_zero:2050, nz_law:false, paris_aligned:false, portfolio_itr:2.5, workers_affected:650000 },
  { iso2:'AU', name:'Australia', region:'Asia-Pacific', esg:58, ndgain:70.2, carbon_price:0, ets:false, taxonomy:true, cbam:false, coal_phaseout:2038, ev_target:50, renewable_pct:32, emissions_capita:15.0, green_bond_bn:6.8, jt_score:52, hdi:0.951, cpi:75, net_zero:2050, nz_law:true, paris_aligned:false, portfolio_itr:2.3, workers_affected:45000 },
  { iso2:'CA', name:'Canada', region:'Americas', esg:64, ndgain:71.5, carbon_price:65, ets:true, taxonomy:true, cbam:false, coal_phaseout:2030, ev_target:100, renewable_pct:68, emissions_capita:14.2, green_bond_bn:12.4, jt_score:60, hdi:0.936, cpi:74, net_zero:2050, nz_law:true, paris_aligned:false, portfolio_itr:2.1, workers_affected:125000 },
  { iso2:'KR', name:'South Korea', region:'Asia-Pacific', esg:60, ndgain:66.8, carbon_price:18, ets:true, taxonomy:true, cbam:false, coal_phaseout:2050, ev_target:100, renewable_pct:10, emissions_capita:12.1, green_bond_bn:15.2, jt_score:48, hdi:0.925, cpi:63, net_zero:2050, nz_law:true, paris_aligned:false, portfolio_itr:2.4, workers_affected:95000 },
  { iso2:'ZA', name:'South Africa', region:'Africa', esg:38, ndgain:42.5, carbon_price:9, ets:false, taxonomy:true, cbam:false, coal_phaseout:2050, ev_target:15, renewable_pct:12, emissions_capita:7.5, green_bond_bn:2.4, jt_score:35, hdi:0.713, cpi:44, net_zero:2050, nz_law:false, paris_aligned:false, portfolio_itr:3.1, workers_affected:350000 },
  { iso2:'SA', name:'Saudi Arabia', region:'MENA', esg:35, ndgain:50.1, carbon_price:0, ets:false, taxonomy:false, cbam:false, coal_phaseout:null, ev_target:10, renewable_pct:1, emissions_capita:18.7, green_bond_bn:4.2, jt_score:28, hdi:0.875, cpi:53, net_zero:2060, nz_law:false, paris_aligned:false, portfolio_itr:3.5, workers_affected:420000 },
  { iso2:'MX', name:'Mexico', region:'Americas', esg:42, ndgain:50.8, carbon_price:4, ets:true, taxonomy:false, cbam:false, coal_phaseout:2040, ev_target:20, renewable_pct:28, emissions_capita:3.6, green_bond_bn:5.6, jt_score:38, hdi:0.758, cpi:31, net_zero:2050, nz_law:false, paris_aligned:false, portfolio_itr:2.7, workers_affected:280000 },
  { iso2:'ID', name:'Indonesia', region:'Asia-Pacific', esg:40, ndgain:47.2, carbon_price:2, ets:true, taxonomy:true, cbam:false, coal_phaseout:2050, ev_target:20, renewable_pct:15, emissions_capita:2.3, green_bond_bn:6.8, jt_score:35, hdi:0.705, cpi:34, net_zero:2060, nz_law:false, paris_aligned:false, portfolio_itr:2.9, workers_affected:1800000 },
  { iso2:'SE', name:'Sweden', region:'Europe', esg:85, ndgain:78.2, carbon_price:120, ets:true, taxonomy:true, cbam:true, coal_phaseout:2020, ev_target:100, renewable_pct:60, emissions_capita:3.6, green_bond_bn:8.4, jt_score:82, hdi:0.947, cpi:83, net_zero:2045, nz_law:true, paris_aligned:true, portfolio_itr:1.5, workers_affected:12000 },
  { iso2:'NO', name:'Norway', region:'Europe', esg:82, ndgain:76.8, carbon_price:88, ets:true, taxonomy:true, cbam:true, coal_phaseout:2025, ev_target:100, renewable_pct:98, emissions_capita:7.5, green_bond_bn:6.2, jt_score:78, hdi:0.961, cpi:84, net_zero:2050, nz_law:true, paris_aligned:true, portfolio_itr:1.6, workers_affected:28000 },
  { iso2:'DK', name:'Denmark', region:'Europe', esg:84, ndgain:77.5, carbon_price:45, ets:true, taxonomy:true, cbam:true, coal_phaseout:2028, ev_target:100, renewable_pct:80, emissions_capita:5.1, green_bond_bn:5.8, jt_score:80, hdi:0.948, cpi:90, net_zero:2050, nz_law:true, paris_aligned:true, portfolio_itr:1.5, workers_affected:8000 },
  { iso2:'FI', name:'Finland', region:'Europe', esg:82, ndgain:76.2, carbon_price:45, ets:true, taxonomy:true, cbam:true, coal_phaseout:2029, ev_target:100, renewable_pct:44, emissions_capita:7.1, green_bond_bn:3.2, jt_score:76, hdi:0.940, cpi:87, net_zero:2035, nz_law:true, paris_aligned:true, portfolio_itr:1.6, workers_affected:15000 },
  { iso2:'CH', name:'Switzerland', region:'Europe', esg:80, ndgain:75.8, carbon_price:130, ets:true, taxonomy:true, cbam:true, coal_phaseout:2025, ev_target:100, renewable_pct:75, emissions_capita:4.0, green_bond_bn:4.8, jt_score:74, hdi:0.962, cpi:82, net_zero:2050, nz_law:true, paris_aligned:true, portfolio_itr:1.6, workers_affected:5000 },
  { iso2:'NL', name:'Netherlands', region:'Europe', esg:74, ndgain:72.5, carbon_price:45, ets:true, taxonomy:true, cbam:true, coal_phaseout:2030, ev_target:100, renewable_pct:33, emissions_capita:8.8, green_bond_bn:12.6, jt_score:68, hdi:0.941, cpi:79, net_zero:2050, nz_law:true, paris_aligned:false, portfolio_itr:2.0, workers_affected:25000 },
  { iso2:'ES', name:'Spain', region:'Europe', esg:70, ndgain:68.5, carbon_price:45, ets:true, taxonomy:true, cbam:true, coal_phaseout:2030, ev_target:100, renewable_pct:50, emissions_capita:5.4, green_bond_bn:18.2, jt_score:65, hdi:0.905, cpi:60, net_zero:2050, nz_law:true, paris_aligned:true, portfolio_itr:1.8, workers_affected:55000 },
  { iso2:'IT', name:'Italy', region:'Europe', esg:66, ndgain:65.8, carbon_price:45, ets:true, taxonomy:true, cbam:true, coal_phaseout:2025, ev_target:100, renewable_pct:42, emissions_capita:5.5, green_bond_bn:14.8, jt_score:60, hdi:0.895, cpi:56, net_zero:2050, nz_law:true, paris_aligned:false, portfolio_itr:2.0, workers_affected:68000 },
  { iso2:'SG', name:'Singapore', region:'Asia-Pacific', esg:68, ndgain:65.2, carbon_price:25, ets:true, taxonomy:true, cbam:false, coal_phaseout:2040, ev_target:100, renewable_pct:5, emissions_capita:8.6, green_bond_bn:22.4, jt_score:55, hdi:0.939, cpi:83, net_zero:2050, nz_law:false, paris_aligned:false, portfolio_itr:2.2, workers_affected:8000 },
  { iso2:'HK', name:'Hong Kong', region:'Asia-Pacific', esg:64, ndgain:62.5, carbon_price:0, ets:false, taxonomy:true, cbam:false, coal_phaseout:2035, ev_target:60, renewable_pct:2, emissions_capita:5.8, green_bond_bn:15.6, jt_score:50, hdi:0.952, cpi:76, net_zero:2050, nz_law:false, paris_aligned:false, portfolio_itr:2.3, workers_affected:6000 },
  { iso2:'AE', name:'UAE', region:'MENA', esg:42, ndgain:54.8, carbon_price:0, ets:false, taxonomy:true, cbam:false, coal_phaseout:null, ev_target:25, renewable_pct:7, emissions_capita:20.5, green_bond_bn:8.2, jt_score:35, hdi:0.911, cpi:68, net_zero:2050, nz_law:true, paris_aligned:false, portfolio_itr:3.2, workers_affected:85000 },
  { iso2:'PL', name:'Poland', region:'Europe', esg:52, ndgain:60.2, carbon_price:45, ets:true, taxonomy:true, cbam:true, coal_phaseout:2049, ev_target:50, renewable_pct:22, emissions_capita:8.2, green_bond_bn:5.4, jt_score:45, hdi:0.876, cpi:55, net_zero:2050, nz_law:false, paris_aligned:false, portfolio_itr:2.6, workers_affected:120000 },
  { iso2:'TH', name:'Thailand', region:'Asia-Pacific', esg:42, ndgain:48.5, carbon_price:0, ets:false, taxonomy:true, cbam:false, coal_phaseout:2050, ev_target:30, renewable_pct:18, emissions_capita:3.8, green_bond_bn:4.2, jt_score:38, hdi:0.800, cpi:36, net_zero:2065, nz_law:false, paris_aligned:false, portfolio_itr:2.8, workers_affected:420000 },
  { iso2:'CL', name:'Chile', region:'Americas', esg:56, ndgain:58.2, carbon_price:5, ets:true, taxonomy:true, cbam:false, coal_phaseout:2040, ev_target:40, renewable_pct:45, emissions_capita:4.5, green_bond_bn:6.8, jt_score:52, hdi:0.855, cpi:67, net_zero:2050, nz_law:true, paris_aligned:true, portfolio_itr:2.0, workers_affected:35000 },
  { iso2:'RU', name:'Russia', region:'Europe', esg:32, ndgain:52.4, carbon_price:0, ets:false, taxonomy:false, cbam:false, coal_phaseout:null, ev_target:10, renewable_pct:20, emissions_capita:12.1, green_bond_bn:1.2, jt_score:25, hdi:0.822, cpi:28, net_zero:2060, nz_law:false, paris_aligned:false, portfolio_itr:3.4, workers_affected:1500000 },
  { iso2:'TR', name:'Turkey', region:'MENA', esg:40, ndgain:52.0, carbon_price:0, ets:false, taxonomy:false, cbam:false, coal_phaseout:2053, ev_target:30, renewable_pct:42, emissions_capita:5.0, green_bond_bn:2.8, jt_score:32, hdi:0.838, cpi:36, net_zero:2053, nz_law:false, paris_aligned:false, portfolio_itr:2.9, workers_affected:310000 },
  { iso2:'NG', name:'Nigeria', region:'Africa', esg:30, ndgain:32.5, carbon_price:0, ets:false, taxonomy:false, cbam:false, coal_phaseout:null, ev_target:5, renewable_pct:18, emissions_capita:0.6, green_bond_bn:0.8, jt_score:22, hdi:0.535, cpi:24, net_zero:2060, nz_law:false, paris_aligned:false, portfolio_itr:3.2, workers_affected:850000 },
  { iso2:'KE', name:'Kenya', region:'Africa', esg:42, ndgain:38.5, carbon_price:0, ets:false, taxonomy:false, cbam:false, coal_phaseout:null, ev_target:5, renewable_pct:90, emissions_capita:0.4, green_bond_bn:0.4, jt_score:35, hdi:0.575, cpi:32, net_zero:null, nz_law:false, paris_aligned:false, portfolio_itr:2.8, workers_affected:120000 },
  { iso2:'EG', name:'Egypt', region:'MENA', esg:36, ndgain:42.8, carbon_price:0, ets:false, taxonomy:false, cbam:false, coal_phaseout:2050, ev_target:10, renewable_pct:12, emissions_capita:2.5, green_bond_bn:1.8, jt_score:30, hdi:0.731, cpi:30, net_zero:null, nz_law:false, paris_aligned:false, portfolio_itr:3.0, workers_affected:280000 },
  { iso2:'CO', name:'Colombia', region:'Americas', esg:48, ndgain:50.2, carbon_price:5, ets:true, taxonomy:false, cbam:false, coal_phaseout:2040, ev_target:20, renewable_pct:75, emissions_capita:1.8, green_bond_bn:2.2, jt_score:42, hdi:0.752, cpi:39, net_zero:2050, nz_law:true, paris_aligned:false, portfolio_itr:2.4, workers_affected:180000 },
  { iso2:'PH', name:'Philippines', region:'Asia-Pacific', esg:38, ndgain:40.2, carbon_price:0, ets:false, taxonomy:false, cbam:false, coal_phaseout:2050, ev_target:10, renewable_pct:28, emissions_capita:1.3, green_bond_bn:1.4, jt_score:32, hdi:0.699, cpi:33, net_zero:null, nz_law:false, paris_aligned:false, portfolio_itr:3.0, workers_affected:220000 },
  { iso2:'VN', name:'Vietnam', region:'Asia-Pacific', esg:40, ndgain:46.5, carbon_price:0, ets:false, taxonomy:false, cbam:false, coal_phaseout:2050, ev_target:30, renewable_pct:35, emissions_capita:3.5, green_bond_bn:2.8, jt_score:36, hdi:0.726, cpi:33, net_zero:2050, nz_law:false, paris_aligned:false, portfolio_itr:2.8, workers_affected:580000 },
  { iso2:'MY', name:'Malaysia', region:'Asia-Pacific', esg:48, ndgain:55.8, carbon_price:0, ets:false, taxonomy:true, cbam:false, coal_phaseout:2050, ev_target:30, renewable_pct:24, emissions_capita:8.2, green_bond_bn:4.8, jt_score:42, hdi:0.803, cpi:47, net_zero:2050, nz_law:false, paris_aligned:false, portfolio_itr:2.6, workers_affected:145000 },
  { iso2:'AT', name:'Austria', region:'Europe', esg:76, ndgain:73.8, carbon_price:45, ets:true, taxonomy:true, cbam:true, coal_phaseout:2025, ev_target:100, renewable_pct:78, emissions_capita:6.8, green_bond_bn:4.2, jt_score:72, hdi:0.916, cpi:71, net_zero:2040, nz_law:true, paris_aligned:true, portfolio_itr:1.7, workers_affected:12000 },
  { iso2:'IE', name:'Ireland', region:'Europe', esg:72, ndgain:71.2, carbon_price:45, ets:true, taxonomy:true, cbam:true, coal_phaseout:2025, ev_target:100, renewable_pct:42, emissions_capita:7.8, green_bond_bn:3.6, jt_score:65, hdi:0.945, cpi:74, net_zero:2050, nz_law:true, paris_aligned:false, portfolio_itr:1.9, workers_affected:8000 },
];

/* ══════════════════════════════════════════════════════════════
   POLICY DIMENSIONS (for heatmap)
   ══════════════════════════════════════════════════════════════ */
const POLICY_DIMS = [
  { key: 'carbon_price', label: 'Carbon Price', unit: '$/tCO2' },
  { key: 'ets', label: 'ETS', unit: 'bool' },
  { key: 'taxonomy', label: 'Taxonomy', unit: 'bool' },
  { key: 'cbam', label: 'CBAM', unit: 'bool' },
  { key: 'coal_phaseout', label: 'Coal Phase-out', unit: 'year' },
  { key: 'ev_target', label: 'EV Target', unit: '%' },
];

/* ══════════════════════════════════════════════════════════════
   ENERGY TRANSITION TRAJECTORY (global)
   ══════════════════════════════════════════════════════════════ */
const ENERGY_TRAJECTORY = Array.from({ length: 7 }, (_, i) => {
  const yr = 2020 + i * 5;
  const base = 27 + i * 2;
  return {
    year: yr,
    current_policy: +(base + i * 1.5).toFixed(1),
    stated_policy: +(base + i * 3.2).toFixed(1),
    net_zero_2050: +(base + i * 6.5).toFixed(1),
  };
});

/* ══════════════════════════════════════════════════════════════
   REGULATORY LANDSCAPE
   ══════════════════════════════════════════════════════════════ */
const REGULATIONS = [
  { name: 'EU CBAM', jurisdiction: 'EU', phase: 'Transitional', effective: '2026-01', impact: 'High', desc: 'Carbon border adjustment on imports; full pricing by 2026' },
  { name: 'EU Taxonomy', jurisdiction: 'EU', phase: 'Phase 2', effective: '2024-01', impact: 'High', desc: 'Environmental taxonomy for sustainable investments' },
  { name: 'CSDDD', jurisdiction: 'EU', phase: 'Implementation', effective: '2027-01', impact: 'High', desc: 'Corporate Sustainability Due Diligence Directive' },
  { name: 'SEC Climate Rules', jurisdiction: 'US', phase: 'Finalized', effective: '2026-01', impact: 'Medium', desc: 'Mandatory climate risk disclosure for public companies' },
  { name: 'ISSB S1/S2', jurisdiction: 'Global', phase: 'Adoption', effective: '2025-01', impact: 'High', desc: 'IFRS sustainability & climate disclosure standards' },
  { name: 'Japan GX', jurisdiction: 'Japan', phase: 'Active', effective: '2023-02', impact: 'Medium', desc: 'Green Transformation bonds and transition pathways' },
  { name: 'India BRSR Core', jurisdiction: 'India', phase: 'Mandatory', effective: '2023-04', impact: 'Medium', desc: 'Business Responsibility & Sustainability Reporting' },
  { name: 'Singapore Taxonomy', jurisdiction: 'Singapore', phase: 'Consultation', effective: '2024-06', impact: 'Medium', desc: 'ASEAN taxonomy for sustainable finance' },
];

/* ══════════════════════════════════════════════════════════════
   DATA SOURCES
   ══════════════════════════════════════════════════════════════ */
const DATA_SOURCES = [
  { name: 'ND-GAIN', provider: 'Notre Dame', coverage: '192 countries', updated: '2024', desc: 'Vulnerability & readiness index' },
  { name: 'Climate Action Tracker', provider: 'CAT', coverage: '40 countries', updated: '2024', desc: 'Country climate policy assessment' },
  { name: 'IEA World Energy', provider: 'IEA', coverage: 'Global', updated: '2024', desc: 'Energy transition data & scenarios' },
  { name: 'UNFCCC NDC Registry', provider: 'UNFCCC', coverage: '197 parties', updated: '2024', desc: 'Nationally Determined Contributions' },
  { name: 'World Bank WDI', provider: 'World Bank', coverage: '217 countries', updated: '2024', desc: 'Development indicators including HDI' },
  { name: 'ILO Just Transition', provider: 'ILO', coverage: 'Global', updated: '2023', desc: 'Workers affected by energy transition' },
];

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow .15s, transform .1s', ...style }} onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,58,92,.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>{children}</div>
);
const KpiCard = ({ label, value, sub, color }) => (
  <Card>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.font, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.font, marginTop: 2 }}>{sub}</div>}
  </Card>
);
const Badge = ({ label, color }) => (
  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: color ? `${color}18` : `${T.navy}15`, color: color || T.navy, fontFamily: T.font }}>{label}</span>
);
const Section = ({ title, sub, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</div>
      {sub && <span style={{ fontSize: 12, color: T.textMut, fontFamily: T.font }}>{sub}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, variant, style }) => (
  <button onClick={onClick} style={{ padding: '8px 18px', borderRadius: 8, border: variant === 'outline' ? `1px solid ${T.border}` : 'none', background: variant === 'outline' ? T.surface : T.navy, color: variant === 'outline' ? T.navy : '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font, ...style }}>{children}</button>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, background: T.surfaceH, borderRadius: 10, padding: 3, marginBottom: 20, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: active === t ? T.surface : 'transparent', color: active === t ? T.navy : T.textSec, fontWeight: active === t ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: T.font, boxShadow: active === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none', minWidth: 100 }}>{t}</button>
    ))}
  </div>
);
const SortTh = ({ label, sortKey, sortCol, sortDir, onSort, style }) => (
  <th onClick={() => onSort(sortKey)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, cursor: 'pointer', borderBottom: `2px solid ${T.border}`, fontFamily: T.font, userSelect: 'none', whiteSpace: 'nowrap', ...style }}>
    {label} {sortCol === sortKey ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25BD'}
  </th>
);

/* ══════════════════════════════════════════════════════════════
   DATA LOADING
   ══════════════════════════════════════════════════════════════ */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const loadLS = (key) => { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } };

const TABS = ['Overview', 'Country Intelligence', 'Policy & Transition', 'Regulatory & Data'];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function SovereignHubPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [sortCol, setSortCol] = useState('esg');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [regionFilter, setRegionFilter] = useState('All');
  const [itrSlider, setItrSlider] = useState(2.0);

  /* Load portfolio & map to countries */
  const holdings = useMemo(() => {
    const portfolio = loadLS(LS_PORTFOLIO);
    if (!portfolio || !portfolio.length) return GLOBAL_COMPANY_MASTER.slice(0, 30);
    return portfolio.map(p => {
      const master = GLOBAL_COMPANY_MASTER.find(c => c.isin === p.isin || c.ticker === p.ticker);
      return master ? { ...master, weight: p.weight } : { ...p, weight: p.weight };
    }).filter(Boolean);
  }, []);

  /* Country exposure from holdings */
  const countryExposure = useMemo(() => {
    const map = {};
    holdings.forEach(h => {
      const c = h.country || 'India';
      map[c] = (map[c] || 0) + (h.weight || 1 / (holdings.length || 1));
    });
    return Object.entries(map).map(([country, weight]) => {
      const cd = COUNTRY_DATA.find(d => d.name === country);
      return { country, weight: +(weight * 100).toFixed(2), ...cd };
    }).sort((a, b) => b.weight - a.weight);
  }, [holdings]);

  /* Regions */
  const regions = useMemo(() => ['All', ...new Set(COUNTRY_DATA.map(c => c.region))].sort(), []);

  /* Aggregates */
  const agg = useMemo(() => {
    const n = COUNTRY_DATA.length;
    const wtdESG = countryExposure.reduce((s, c) => s + (c.esg || 50) * (c.weight || 0) / 100, 0) || COUNTRY_DATA.reduce((s, c) => s + c.esg, 0) / n;
    const avgNDGain = COUNTRY_DATA.reduce((s, c) => s + c.ndgain, 0) / n;
    const parisAligned = COUNTRY_DATA.filter(c => c.paris_aligned).length / n * 100;
    const nzPct = COUNTRY_DATA.filter(c => c.net_zero).length / n * 100;
    const avgCarbonPrice = COUNTRY_DATA.reduce((s, c) => s + c.carbon_price, 0) / n;
    const avgRenewable = COUNTRY_DATA.reduce((s, c) => s + c.renewable_pct, 0) / n;
    const avgEmissionsCapita = COUNTRY_DATA.reduce((s, c) => s + c.emissions_capita, 0) / n;
    const totalGreenBond = COUNTRY_DATA.reduce((s, c) => s + c.green_bond_bn, 0);
    const avgJT = COUNTRY_DATA.reduce((s, c) => s + c.jt_score, 0) / n;
    const avgHDI = COUNTRY_DATA.reduce((s, c) => s + c.hdi, 0) / n;
    const avgCPI = COUNTRY_DATA.reduce((s, c) => s + c.cpi, 0) / n;
    const coalPhaseout = COUNTRY_DATA.filter(c => c.coal_phaseout && c.coal_phaseout <= 2035).length;
    return {
      countries: n, portfolioExposure: countryExposure.length, wtdESG: +wtdESG.toFixed(1),
      avgNDGain: +avgNDGain.toFixed(1), parisAligned: +parisAligned.toFixed(0), nzPct: +nzPct.toFixed(0),
      avgCarbonPrice: +avgCarbonPrice.toFixed(0), avgRenewable: +avgRenewable.toFixed(0),
      avgEmissionsCapita: +avgEmissionsCapita.toFixed(1), totalGreenBond: +totalGreenBond.toFixed(1),
      avgJT: +avgJT.toFixed(0), avgHDI: +avgHDI.toFixed(3), avgCPI: +avgCPI.toFixed(0), coalPhaseout,
    };
  }, [countryExposure]);

  /* Filtered + sorted countries */
  const filteredCountries = useMemo(() => {
    let arr = [...COUNTRY_DATA];
    if (regionFilter !== 'All') arr = arr.filter(c => c.region === regionFilter);
    arr.sort((a, b) => {
      const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return arr;
  }, [sortCol, sortDir, regionFilter]);

  const onSort = (key) => { if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(key); setSortDir('desc'); } };

  /* Region aggregation */
  const regionData = useMemo(() => {
    const regionMap = {};
    COUNTRY_DATA.forEach(c => {
      if (!regionMap[c.region]) regionMap[c.region] = { region: c.region, total: 0, esgSum: 0 };
      regionMap[c.region].total++;
      regionMap[c.region].esgSum += c.esg;
    });
    return Object.values(regionMap).map(r => ({ ...r, avgESG: +(r.esgSum / r.total).toFixed(1) })).sort((a, b) => b.avgESG - a.avgESG);
  }, []);

  /* Radar data for selected country */
  const radarData = useMemo(() => {
    const c = COUNTRY_DATA.find(d => d.iso2 === selectedCountry) || COUNTRY_DATA[0];
    return [
      { axis: 'Climate', value: Math.min(100, c.renewable_pct + 20) },
      { axis: 'Social', value: Math.round(c.hdi * 100) },
      { axis: 'Governance', value: c.cpi },
      { axis: 'ND-GAIN', value: Math.round(c.ndgain) },
      { axis: 'Transition', value: Math.min(100, c.renewable_pct + c.carbon_price / 2) },
      { axis: 'Just Trans.', value: c.jt_score },
      { axis: 'Paris Align.', value: c.paris_aligned ? 80 : 30 },
      { axis: 'Policy', value: Math.min(100, (c.ets ? 20 : 0) + (c.taxonomy ? 20 : 0) + (c.cbam ? 20 : 0) + c.carbon_price / 2) },
    ];
  }, [selectedCountry]);

  /* JT Scorecard */
  const jtScorecard = useMemo(() => {
    return [...COUNTRY_DATA].sort((a, b) => b.jt_score - a.jt_score).slice(0, 15);
  }, []);

  /* Exports */
  const exportCSV = useCallback(() => {
    const header = ['Country', 'Region', 'ESG', 'ND-GAIN', 'Carbon Price', 'Renewable %', 'Emissions/Capita', 'JT Score', 'HDI', 'CPI', 'Net Zero', 'Paris Aligned'];
    const rows = COUNTRY_DATA.map(c => [c.name, c.region, c.esg, c.ndgain, c.carbon_price, c.renewable_pct, c.emissions_capita, c.jt_score, c.hdi, c.cpi, c.net_zero || 'N/A', c.paris_aligned ? 'Yes' : 'No']);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sovereign_hub_report.csv'; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportJSON = useCallback(() => {
    const data = { generated: new Date().toISOString(), aggregates: agg, countries: COUNTRY_DATA, portfolioExposure: countryExposure, modules: MODULES.map(m => ({ name: m.name, status: m.status })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sovereign_hub_data.json'; a.click(); URL.revokeObjectURL(url);
  }, [agg, countryExposure]);

  const exportPrint = useCallback(() => window.print(), []);

  const esgColor = (v) => v >= 70 ? T.green : v >= 50 ? T.sage : v >= 35 ? T.amber : T.red;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px' }}>

        {/* ── S1: Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.navy, marginBottom: 6 }}>Sovereign & Macro ESG Intelligence</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge label="Hub" color={T.navy} /><Badge label="40 Countries" color={T.gold} /><Badge label="IEA" color={T.sage} /><Badge label="Paris" color={T.green} /><Badge label="Just Transition" color="#7c3aed" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={exportCSV}>Export CSV</Btn>
            <Btn onClick={exportJSON} variant="outline">Export JSON</Btn>
            <Btn onClick={exportPrint} variant="outline">Print</Btn>
          </div>
        </div>

        {/* ── S2: Module Status Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
          {MODULES.map((m, i) => (
            <Card key={i} onClick={() => navigate(m.path)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <Badge label={m.status} color={T.green} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: T.textMut }}>{m.kpi}</div>
            </Card>
          ))}
        </div>

        {/* ── S3: 14 KPI cards (2 rows) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 24 }}>
          <KpiCard label="Countries Covered" value={agg.countries} sub="40 nations tracked" color={T.navy} />
          <KpiCard label="Portfolio Exposure" value={agg.portfolioExposure} sub="Countries in portfolio" color={T.navyL} />
          <KpiCard label="Wtd Sovereign ESG" value={agg.wtdESG} sub="Weighted by exposure" color={esgColor(agg.wtdESG)} />
          <KpiCard label="Avg ND-GAIN" value={agg.avgNDGain} sub="Readiness index" color={T.sage} />
          <KpiCard label="Paris-Aligned" value={`${agg.parisAligned}%`} sub="Countries on track" color={T.green} />
          <KpiCard label="Net Zero" value={`${agg.nzPct}%`} sub="With NZ target" color={T.sage} />
          <KpiCard label="Avg Carbon Price" value={`$${agg.avgCarbonPrice}`} sub="$/tCO2 average" color={T.gold} />
          <KpiCard label="Renewable Avg" value={`${agg.avgRenewable}%`} sub="Of electricity" color={T.green} />
          <KpiCard label="Emissions/Capita" value={`${agg.avgEmissionsCapita}t`} sub="tCO2e per person" color={T.amber} />
          <KpiCard label="Green Bond Vol." value={`$${agg.totalGreenBond}B`} sub="Total issued" color={T.sage} />
          <KpiCard label="JT Score" value={agg.avgJT} sub="Just transition avg" color="#7c3aed" />
          <KpiCard label="HDI" value={agg.avgHDI} sub="Human dev. index" color={T.navyL} />
          <KpiCard label="CPI" value={agg.avgCPI} sub="Corruption perception" color={T.amber} />
          <KpiCard label="Coal Phase-out" value={agg.coalPhaseout} sub="By 2035" color={T.red} />
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* ══════ TAB 1: OVERVIEW ══════ */}
        {tab === 'Overview' && (<>
          {/* ── S4: Sovereign ESG by Region BarChart ── */}
          <Section title="Sovereign ESG by Region" sub="Average ESG score across 5 regions">
            <Card>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="region" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="avgESG" name="Avg ESG Score" radius={[6, 6, 0, 0]}>
                    {regionData.map((r, i) => <Cell key={i} fill={esgColor(r.avgESG)} />)}
                  </Bar>
                  <Bar dataKey="total" name="Countries" radius={[6, 6, 0, 0]} fill={`${T.navy}40`} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* ── S8: Paris Alignment Gap ── */}
          <Section title="Paris Alignment Gap" sub="Portfolio ITR vs 1.5C target">
            <Card>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Target Temperature Slider</div>
                  <input type="range" min={1.5} max={3.0} step={0.1} value={itrSlider} onChange={e => setItrSlider(+e.target.value)} style={{ width: '100%', accentColor: T.navy }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}>
                    <span>1.5C</span><span style={{ fontWeight: 700, color: T.navy }}>{itrSlider}C Target</span><span>3.0C</span>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {COUNTRY_DATA.filter(c => c.portfolio_itr <= itrSlider).length > 0 && (
                      <div style={{ padding: 12, background: `${T.green}10`, borderRadius: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: T.green, fontWeight: 700 }}>{COUNTRY_DATA.filter(c => c.portfolio_itr <= itrSlider).length} countries aligned at {itrSlider}C</div>
                      </div>
                    )}
                    <div style={{ padding: 12, background: `${T.red}10`, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: T.red, fontWeight: 700 }}>{COUNTRY_DATA.filter(c => c.portfolio_itr > itrSlider).length} countries exceeding {itrSlider}C</div>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Top Aligned Countries</div>
                  {COUNTRY_DATA.filter(c => c.paris_aligned).slice(0, 6).map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                      <span style={{ color: T.textSec }}>{c.iso2} {c.name}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: T.green }}>{c.portfolio_itr}C</span>
                        <Badge label="Aligned" color={T.green} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Section>

          {/* ── S11: Quick Action Cards ── */}
          <Section title="Quick Actions" sub="Navigate to Sprint O sub-modules">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
              {MODULES.map((m, i) => (
                <Card key={i} onClick={() => navigate(m.path)} style={{ cursor: 'pointer', textAlign: 'center', borderLeft: `4px solid ${m.color}` }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{m.name}</div>
                  <Btn onClick={(e) => { e.stopPropagation(); navigate(m.path); }} style={{ marginTop: 8, width: '100%', fontSize: 11 }}>Open Module</Btn>
                </Card>
              ))}
            </div>
          </Section>

          {/* ── S10: Cross-Asset Sovereign Exposure ── */}
          <Section title="Cross-Asset Sovereign Exposure" sub="Portfolio holdings mapped to countries by weight">
            <Card>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryExposure.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Portfolio Weight %', position: 'bottom', style: { fontSize: 11, fill: T.textMut } }} />
                  <YAxis dataKey="country" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}%`, 'Weight']} />
                  <Bar dataKey="weight" name="Weight %" radius={[0, 6, 6, 0]}>
                    {countryExposure.slice(0, 15).map((c, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* ── Sovereign ESG Distribution PieChart ── */}
          <Section title="Sovereign ESG Tier Distribution" sub="Countries by ESG performance tier">
            <Card>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 300 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={[
                        { name: 'Leaders (70+)', value: COUNTRY_DATA.filter(c => c.esg >= 70).length, fill: T.green },
                        { name: 'Adequate (50-69)', value: COUNTRY_DATA.filter(c => c.esg >= 50 && c.esg < 70).length, fill: T.sage },
                        { name: 'Developing (35-49)', value: COUNTRY_DATA.filter(c => c.esg >= 35 && c.esg < 50).length, fill: T.amber },
                        { name: 'Lagging (<35)', value: COUNTRY_DATA.filter(c => c.esg < 35).length, fill: T.red },
                      ]} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine>
                      </Pie>
                      <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: 280 }}>
                  {[
                    { tier: 'Leaders (70+)', countries: COUNTRY_DATA.filter(c => c.esg >= 70).map(c => c.iso2).join(', '), color: T.green, count: COUNTRY_DATA.filter(c => c.esg >= 70).length },
                    { tier: 'Adequate (50-69)', countries: COUNTRY_DATA.filter(c => c.esg >= 50 && c.esg < 70).map(c => c.iso2).join(', '), color: T.sage, count: COUNTRY_DATA.filter(c => c.esg >= 50 && c.esg < 70).length },
                    { tier: 'Developing (35-49)', countries: COUNTRY_DATA.filter(c => c.esg >= 35 && c.esg < 50).map(c => c.iso2).join(', '), color: T.amber, count: COUNTRY_DATA.filter(c => c.esg >= 35 && c.esg < 50).length },
                    { tier: 'Lagging (<35)', countries: COUNTRY_DATA.filter(c => c.esg < 35).map(c => c.iso2).join(', '), color: T.red, count: COUNTRY_DATA.filter(c => c.esg < 35).length },
                  ].map((t, i) => (
                    <div key={i} style={{ marginBottom: 12, padding: '8px 12px', background: `${t.color}08`, borderLeft: `3px solid ${t.color}`, borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.tier}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{t.count} countries</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMut }}>{t.countries}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Section>

          {/* ── Green Bond Issuance ── */}
          <Section title="Green Bond Issuance" sub="Top sovereign green bond markets (USD Bn)">
            <Card>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...COUNTRY_DATA].sort((a, b) => b.green_bond_bn - a.green_bond_bn).slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="iso2" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'USD Bn', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} formatter={(v) => [`$${v}B`, 'Green Bond Volume']} />
                  <Bar dataKey="green_bond_bn" name="Green Bond USD Bn" radius={[6, 6, 0, 0]}>
                    {[...COUNTRY_DATA].sort((a, b) => b.green_bond_bn - a.green_bond_bn).slice(0, 12).map((c, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* ── Emissions per Capita Comparison ── */}
          <Section title="Emissions per Capita" sub="tCO2e per person across 40 countries">
            <Card>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...COUNTRY_DATA].sort((a, b) => b.emissions_capita - a.emissions_capita).slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="iso2" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'tCO2e/person', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v} tCO2e/capita`, 'Emissions']} />
                  <ReferenceLine y={4.7} stroke={T.sage} strokeDasharray="5 5" label={{ value: 'Global Avg', position: 'right', style: { fontSize: 10, fill: T.sage } }} />
                  <ReferenceLine y={2.5} stroke={T.green} strokeDasharray="5 5" label={{ value: '1.5C Budget', position: 'right', style: { fontSize: 10, fill: T.green } }} />
                  <Bar dataKey="emissions_capita" name="tCO2e/capita" radius={[6, 6, 0, 0]}>
                    {[...COUNTRY_DATA].sort((a, b) => b.emissions_capita - a.emissions_capita).slice(0, 15).map((c, i) => (
                      <Cell key={i} fill={c.emissions_capita > 10 ? T.red : c.emissions_capita > 5 ? T.amber : T.green} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>
        </>)}

        {/* ══════ TAB 2: COUNTRY INTELLIGENCE ══════ */}
        {tab === 'Country Intelligence' && (<>
          {/* ── S9: Country Risk Radar ── */}
          <Section title="Country Risk Radar" sub="8-axis sovereign assessment">
            <Card>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Select Country</div>
                  <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: T.surface, width: '100%' }}>
                    {COUNTRY_DATA.map(c => <option key={c.iso2} value={c.iso2}>{c.iso2} - {c.name}</option>)}
                  </select>
                  <div style={{ marginTop: 16 }}>
                    {(() => {
                      const c = COUNTRY_DATA.find(d => d.iso2 === selectedCountry);
                      if (!c) return null;
                      return (
                        <div style={{ fontSize: 12, color: T.textSec }}>
                          <div style={{ marginBottom: 6 }}><strong>ESG:</strong> {c.esg}/100</div>
                          <div style={{ marginBottom: 6 }}><strong>ND-GAIN:</strong> {c.ndgain}</div>
                          <div style={{ marginBottom: 6 }}><strong>Carbon Price:</strong> ${c.carbon_price}/tCO2</div>
                          <div style={{ marginBottom: 6 }}><strong>Renewable:</strong> {c.renewable_pct}%</div>
                          <div style={{ marginBottom: 6 }}><strong>Net Zero:</strong> {c.net_zero || 'N/A'}</div>
                          <div style={{ marginBottom: 6 }}><strong>JT Score:</strong> {c.jt_score}</div>
                          <div><strong>Paris:</strong> {c.paris_aligned ? '\u2705 Aligned' : '\u274C Not aligned'}</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 350 }}>
                  <ResponsiveContainer width="100%" height={340}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={T.borderL} />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: T.textSec }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                      <Radar name={selectedCountry} dataKey="value" stroke={T.navy} fill={`${T.navy}30`} fillOpacity={0.5} />
                      <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </Section>

          {/* ── S7: Just Transition Scorecard ── */}
          <Section title="Just Transition Scorecard" sub={`Top 15 by JT composite | Workers affected`}>
            <Card style={{ padding: 0, overflow: 'auto', maxHeight: 420 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 2 }}>
                  <tr>
                    {['Country', 'Region', 'JT Score', 'HDI', 'Workers Affected', 'Coal Phase-out', 'Renewable %', 'CPI'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jtScorecard.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{c.iso2} {c.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.region}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${c.jt_score}%`, height: '100%', background: c.jt_score >= 60 ? T.green : c.jt_score >= 40 ? T.amber : T.red, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: c.jt_score >= 60 ? T.green : c.jt_score >= 40 ? T.amber : T.red }}>{c.jt_score}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.hdi}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{(c.workers_affected / 1000).toFixed(0)}K</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.coal_phaseout || '-'}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.renewable_pct}%</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.cpi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>

          {/* Country ESG table (sortable) */}
          <Section title="Country ESG Intelligence" sub={`${filteredCountries.length} countries | Sortable`}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: T.surface }}>
                {regions.map(r => <option key={r}>{r}</option>)}
              </select>
              <div style={{ fontSize: 12, color: T.textMut, alignSelf: 'center' }}>{filteredCountries.length} countries shown</div>
            </div>
            <Card style={{ padding: 0, overflow: 'auto', maxHeight: 480 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 2 }}>
                  <tr>
                    <SortTh label="Country" sortKey="name" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Region" sortKey="region" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="ESG" sortKey="esg" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="ND-GAIN" sortKey="ndgain" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Carbon $" sortKey="carbon_price" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Renew %" sortKey="renewable_pct" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Em/Cap" sortKey="emissions_capita" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="NZ" sortKey="net_zero" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>Paris</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCountries.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH, cursor: 'pointer' }} onClick={() => setSelectedCountry(c.iso2)}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{c.iso2} {c.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.region}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: esgColor(c.esg) }}>{c.esg}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.ndgain}</td>
                      <td style={{ padding: '8px 12px', color: c.carbon_price > 0 ? T.sage : T.textMut }}>${c.carbon_price}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.renewable_pct}%</td>
                      <td style={{ padding: '8px 12px', color: c.emissions_capita > 10 ? T.red : T.textSec }}>{c.emissions_capita}t</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.net_zero || '-'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{c.paris_aligned ? '\u2705' : '\u274C'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>
        </>)}

        {/* ══════ TAB 3: POLICY & TRANSITION ══════ */}
        {tab === 'Policy & Transition' && (<>
          {/* ── S5: Climate Policy Heatmap ── */}
          <Section title="Climate Policy Heatmap" sub="Countries x 6 policy dimensions">
            <Card style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.font }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}`, position: 'sticky', left: 0, background: T.surface, zIndex: 3 }}>Country</th>
                    {POLICY_DIMS.map(d => (
                      <th key={d.key} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}`, minWidth: 80 }}>{d.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COUNTRY_DATA.slice(0, 25).map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap', position: 'sticky', left: 0, background: i % 2 === 0 ? T.surface : T.surfaceH, zIndex: 2 }}>{c.iso2} {c.name}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', background: c.carbon_price > 50 ? `${T.green}20` : c.carbon_price > 10 ? `${T.amber}20` : c.carbon_price > 0 ? `${T.gold}15` : `${T.red}10` }}>${c.carbon_price}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', background: c.ets ? `${T.green}20` : `${T.red}10` }}>{c.ets ? '\u2705' : '\u274C'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', background: c.taxonomy ? `${T.green}20` : `${T.red}10` }}>{c.taxonomy ? '\u2705' : '\u274C'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', background: c.cbam ? `${T.green}20` : `${T.red}10` }}>{c.cbam ? '\u2705' : '\u274C'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', background: c.coal_phaseout && c.coal_phaseout <= 2035 ? `${T.green}20` : c.coal_phaseout ? `${T.amber}15` : `${T.red}10` }}>{c.coal_phaseout || '-'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', background: c.ev_target >= 80 ? `${T.green}20` : c.ev_target >= 30 ? `${T.amber}15` : `${T.red}10` }}>{c.ev_target}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>

          {/* ── S6: Energy Transition Progress AreaChart ── */}
          <Section title="Energy Transition Progress" sub="Global renewable % trajectory 2020-2050">
            <Card>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ENERGY_TRAJECTORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 80]} label={{ value: 'Renewable %', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: T.font }} />
                  <Area type="monotone" dataKey="net_zero_2050" name="Net Zero 2050" stroke={T.green} fill={`${T.green}20`} />
                  <Area type="monotone" dataKey="stated_policy" name="Stated Policies" stroke={T.amber} fill={`${T.amber}15`} />
                  <Area type="monotone" dataKey="current_policy" name="Current Policy" stroke={T.red} fill={`${T.red}15`} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Carbon price distribution */}
          <Section title="Carbon Pricing Landscape" sub="Distribution of carbon prices across 40 countries">
            <Card>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...COUNTRY_DATA].filter(c => c.carbon_price > 0).sort((a, b) => b.carbon_price - a.carbon_price).slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="iso2" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$/tCO2', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} formatter={(v) => [`$${v}/tCO2`, 'Carbon Price']} />
                  <ReferenceLine y={50} stroke={T.sage} strokeDasharray="5 5" label={{ value: 'Effective price threshold', position: 'right', style: { fontSize: 10, fill: T.sage } }} />
                  <Bar dataKey="carbon_price" name="Carbon Price" radius={[6, 6, 0, 0]}>
                    {[...COUNTRY_DATA].filter(c => c.carbon_price > 0).sort((a, b) => b.carbon_price - a.carbon_price).slice(0, 15).map((c, i) => (
                      <Cell key={i} fill={c.carbon_price > 50 ? T.green : c.carbon_price > 20 ? T.sage : T.amber} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>
        </>)}

        {/* ══════ TAB 4: REGULATORY & DATA ══════ */}
        {tab === 'Regulatory & Data' && (<>
          {/* ── Methodology & Benchmarks ── */}
          <Section title="Sovereign ESG Methodology" sub="Data sources, weighting, and update frequency">
            <Card style={{ background: T.surfaceH }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {[
                  { title: 'ESG Composite', desc: 'Weighted aggregate of environmental performance (40%), social indicators including HDI, education, and health (30%), and governance metrics including corruption perception, rule of law, and regulatory quality (30%). Updated annually from ND-GAIN, World Bank WDI, and Transparency International.' },
                  { title: 'Climate Policy Score', desc: 'Six-dimension assessment: carbon pricing mechanism, ETS coverage, green taxonomy adoption, CBAM readiness, coal phase-out timeline, and EV transition targets. Binary and quantitative indicators combined for policy completeness scoring.' },
                  { title: 'Just Transition Index', desc: 'Composite of workers affected in fossil fuel sectors, social safety net adequacy, retraining program availability, regional economic diversification, and energy poverty metrics. Sources: ILO, national statistics, and just transition commission reports.' },
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          {/* ── Net Zero Commitment Tracker ── */}
          <Section title="Net Zero Commitment Tracker" sub="Country net-zero target years and legal status">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[...COUNTRY_DATA].filter(c => c.net_zero).sort((a, b) => a.net_zero - b.net_zero).slice(0, 20).map((c, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: c.nz_law ? `${T.green}10` : T.surfaceH, borderRadius: 8, border: `1px solid ${c.nz_law ? T.green : T.border}`, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{c.iso2}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: c.nz_law ? T.green : T.amber }}>{c.net_zero}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{c.nz_law ? 'In Law' : 'Pledge'}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          {/* ── S12: Regulatory Landscape ── */}
          <Section title="Regulatory Landscape" sub="Major upcoming sovereign regulations">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {REGULATIONS.map((r, i) => (
                <Card key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{r.name}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Badge label={r.jurisdiction} color={T.navyL} />
                      <Badge label={r.phase} color={r.impact === 'High' ? T.red : T.amber} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>{r.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}>
                    <span>Effective: {r.effective}</span>
                    <span>Impact: <strong style={{ color: r.impact === 'High' ? T.red : T.amber }}>{r.impact}</strong></span>
                  </div>
                </Card>
              ))}
            </div>
          </Section>

          {/* ── Regional Risk Summary ── */}
          <Section title="Regional Risk Summary" sub="Aggregate risk indicators by world region">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
              {regionData.map((r, i) => {
                const regionCountries = COUNTRY_DATA.filter(c => c.region === r.region);
                const avgCarbon = regionCountries.reduce((s, c) => s + c.carbon_price, 0) / regionCountries.length;
                const avgRenew = regionCountries.reduce((s, c) => s + c.renewable_pct, 0) / regionCountries.length;
                const parisCount = regionCountries.filter(c => c.paris_aligned).length;
                const avgJT = regionCountries.reduce((s, c) => s + c.jt_score, 0) / regionCountries.length;
                return (
                  <Card key={i} style={{ borderTop: `3px solid ${PIE_COLORS[i % PIE_COLORS.length]}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 10 }}>{r.region}</div>
                    <div style={{ fontSize: 12, color: T.textMut, marginBottom: 8 }}>{r.total} countries</div>
                    {[
                      { label: 'Avg ESG', value: r.avgESG, color: esgColor(r.avgESG) },
                      { label: 'Carbon Price', value: `$${avgCarbon.toFixed(0)}`, color: T.textSec },
                      { label: 'Renewable', value: `${avgRenew.toFixed(0)}%`, color: T.sage },
                      { label: 'Paris Aligned', value: `${parisCount}/${r.total}`, color: T.green },
                      { label: 'JT Score', value: avgJT.toFixed(0), color: '#7c3aed' },
                    ].map((row, j) => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: j < 4 ? `1px solid ${T.borderL}` : 'none' }}>
                        <span style={{ color: T.textMut }}>{row.label}</span>
                        <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                  </Card>
                );
              })}
            </div>
          </Section>

          {/* ── S13: Data Sources ── */}
          <Section title="Data Sources" sub="Sovereign ESG data providers and coverage">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {DATA_SOURCES.map((ds, i) => (
                <Card key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{ds.name}</div>
                    <Badge label={ds.provider} color={T.sage} />
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{ds.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}>
                    <span>Coverage: {ds.coverage}</span>
                    <span>Updated: {ds.updated}</span>
                  </div>
                </Card>
              ))}
            </div>
          </Section>

          {/* ── S14: Cross-Navigation ── */}
          <Section title="Cross-Navigation" sub="Explore Sprint O modules, Portfolio Suite, and more">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Sovereign ESG Ratings', path: '/sovereign-esg', desc: 'Detailed sovereign ESG analysis', icon: '\uD83C\uDFF3\uFE0F' },
                { label: 'Climate Policy Dashboard', path: '/climate-policy', desc: 'Policy landscape & carbon pricing', icon: '\uD83C\uDFDB\uFE0F' },
                { label: 'Macro Transition Paths', path: '/macro-transition', desc: 'IEA scenarios & energy transition', icon: '\u26A1' },
                { label: 'Just Transition Monitor', path: '/just-transition', desc: 'Social equity in energy transition', icon: '\u2696\uFE0F' },
                { label: 'Paris Agreement Alignment', path: '/paris-alignment', desc: 'NDCs, carbon budget & stocktake', icon: '\uD83C\uDF21\uFE0F' },
                { label: 'Portfolio Climate VaR', path: '/portfolio-climate-var', desc: 'Climate value-at-risk analysis', icon: '\uD83D\uDCC9' },
                { label: 'NGFS Scenarios', path: '/ngfs-scenarios', desc: 'Central bank climate scenarios', icon: '\uD83D\uDD2C' },
                { label: 'Regulatory Calendar', path: '/regulatory-calendar', desc: 'Upcoming ESG regulatory deadlines', icon: '\uD83D\uDCC5' },
                { label: 'Stranded Assets', path: '/stranded-assets', desc: 'Fossil fuel stranding risk', icon: '\u26A0\uFE0F' },
                { label: 'Pipeline Dashboard', path: '/pipeline-dashboard', desc: 'Full module pipeline status', icon: '\uD83D\uDCCA' },
                { label: 'CSRD iXBRL', path: '/csrd-ixbrl', desc: 'EU CSRD reporting taxonomy', icon: '\uD83D\uDCCB' },
                { label: 'Portfolio Suite', path: '/portfolio', desc: 'Core portfolio analytics hub', icon: '\uD83D\uDCBC' },
              ].map((nav, i) => (
                <Card key={i} onClick={() => navigate(nav.path)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{nav.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 3 }}>{nav.label}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{nav.desc}</div>
                </Card>
              ))}
            </div>
          </Section>
        </>)}

      </div>
    </div>
  );
}
