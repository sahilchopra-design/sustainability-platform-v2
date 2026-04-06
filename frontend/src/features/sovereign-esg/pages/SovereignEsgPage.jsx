import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis, LineChart, Line } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const REGION_COLORS = { Europe: T.navy, Americas: T.sage, 'Asia-Pacific': T.gold, Africa: '#7c3aed', MENA: '#0d9488' };
const PIE_COLORS = [T.green, T.gold, T.amber, T.red, '#7c3aed'];
const loadLS = (key) => { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } };
const LS_PORTFOLIO = 'ra_portfolio_v1';

/* ══════════════════════════════════════════════════════════════
   SOVEREIGN ESG DATABASE — 40 countries
   ══════════════════════════════════════════════════════════════ */
const SOVEREIGN_DB = [
  // Europe (14)
  { iso2:'DK', name:'Denmark', region:'Europe', income:'High', population_mn:5.9, gdp_bn:400, gdp_per_capita:67800, climate_score:92, social_score:94, governance_score:93, composite:93, ndgain:76.8, ndgain_vulnerability:28.5, ndgain_readiness:82.1, cat_rating:'1.5\u00B0C Compatible', cat_color:'#16a34a', emissions_mt:33, emissions_per_capita:5.6, renewable_pct:82, forest_cover_pct:14, debt_to_gdp:36, cpi_score:90, hdi:0.952, gini:28.2, press_freedom:92, rule_of_law:95, paris_ndc_target:'-70% by 2030 vs 1990', net_zero_year:2050, green_bond_volume_bn:8.2, sovereign_rating:'AAA' },
  { iso2:'SE', name:'Sweden', region:'Europe', income:'High', population_mn:10.5, gdp_bn:592, gdp_per_capita:56400, climate_score:90, social_score:93, governance_score:90, composite:91, ndgain:74.8, ndgain_vulnerability:29.2, ndgain_readiness:80.5, cat_rating:'1.5\u00B0C Compatible', cat_color:'#16a34a', emissions_mt:41, emissions_per_capita:3.9, renewable_pct:60, forest_cover_pct:69, debt_to_gdp:33, cpi_score:85, hdi:0.947, gini:30.0, press_freedom:90, rule_of_law:93, paris_ndc_target:'-63% by 2030 vs 1990', net_zero_year:2045, green_bond_volume_bn:22.4, sovereign_rating:'AAA' },
  { iso2:'NO', name:'Norway', region:'Europe', income:'High', population_mn:5.5, gdp_bn:485, gdp_per_capita:88200, climate_score:85, social_score:95, governance_score:96, composite:92, ndgain:76.1, ndgain_vulnerability:27.8, ndgain_readiness:83.5, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:50, emissions_per_capita:9.1, renewable_pct:98, forest_cover_pct:33, debt_to_gdp:43, cpi_score:84, hdi:0.961, gini:27.7, press_freedom:95, rule_of_law:97, paris_ndc_target:'-55% by 2030 vs 1990', net_zero_year:2050, green_bond_volume_bn:15.2, sovereign_rating:'AAA' },
  { iso2:'DE', name:'Germany', region:'Europe', income:'High', population_mn:84.4, gdp_bn:4260, gdp_per_capita:50500, climate_score:88, social_score:92, governance_score:91, composite:90, ndgain:72.0, ndgain_vulnerability:31.5, ndgain_readiness:78.2, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:674, emissions_per_capita:8.0, renewable_pct:52, forest_cover_pct:33, debt_to_gdp:64, cpi_score:80, hdi:0.942, gini:31.7, press_freedom:82, rule_of_law:88, paris_ndc_target:'-65% by 2030 vs 1990', net_zero_year:2045, green_bond_volume_bn:198.7, sovereign_rating:'AAA' },
  { iso2:'FR', name:'France', region:'Europe', income:'High', population_mn:67.8, gdp_bn:2780, gdp_per_capita:41000, climate_score:80, social_score:84, governance_score:83, composite:82, ndgain:68.5, ndgain_vulnerability:33.8, ndgain_readiness:76.5, cat_rating:'Almost Sufficient', cat_color:'#d97706', emissions_mt:400, emissions_per_capita:5.9, renewable_pct:25, forest_cover_pct:31, debt_to_gdp:112, cpi_score:72, hdi:0.903, gini:32.4, press_freedom:78, rule_of_law:82, paris_ndc_target:'-55% by 2030 vs 1990', net_zero_year:2050, green_bond_volume_bn:214.2, sovereign_rating:'AA' },
  { iso2:'GB', name:'United Kingdom', region:'Europe', income:'High', population_mn:67.3, gdp_bn:3070, gdp_per_capita:45600, climate_score:72, social_score:82, governance_score:80, composite:78, ndgain:71.4, ndgain_vulnerability:30.2, ndgain_readiness:79.8, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:380, emissions_per_capita:5.6, renewable_pct:43, forest_cover_pct:13, debt_to_gdp:101, cpi_score:73, hdi:0.929, gini:35.1, press_freedom:70, rule_of_law:85, paris_ndc_target:'-68% by 2030 vs 1990', net_zero_year:2050, green_bond_volume_bn:95.4, sovereign_rating:'AA' },
  { iso2:'IT', name:'Italy', region:'Europe', income:'High', population_mn:59.0, gdp_bn:2010, gdp_per_capita:34100, climate_score:68, social_score:76, governance_score:72, composite:72, ndgain:62.4, ndgain_vulnerability:37.1, ndgain_readiness:68.2, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:340, emissions_per_capita:5.8, renewable_pct:22, forest_cover_pct:32, debt_to_gdp:144, cpi_score:56, hdi:0.895, gini:35.9, press_freedom:58, rule_of_law:65, paris_ndc_target:'-55% by 2030 vs 1990', net_zero_year:2050, green_bond_volume_bn:42.1, sovereign_rating:'BBB' },
  { iso2:'ES', name:'Spain', region:'Europe', income:'High', population_mn:47.4, gdp_bn:1400, gdp_per_capita:29500, climate_score:70, social_score:78, governance_score:74, composite:74, ndgain:64.2, ndgain_vulnerability:36.0, ndgain_readiness:70.5, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:260, emissions_per_capita:5.5, renewable_pct:26, forest_cover_pct:37, debt_to_gdp:113, cpi_score:60, hdi:0.905, gini:34.7, press_freedom:64, rule_of_law:72, paris_ndc_target:'-55% by 2030 vs 1990', net_zero_year:2050, green_bond_volume_bn:35.6, sovereign_rating:'A' },
  { iso2:'NL', name:'Netherlands', region:'Europe', income:'High', population_mn:17.6, gdp_bn:1010, gdp_per_capita:57400, climate_score:78, social_score:88, governance_score:87, composite:84, ndgain:70.2, ndgain_vulnerability:32.8, ndgain_readiness:77.0, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:155, emissions_per_capita:8.8, renewable_pct:16, forest_cover_pct:11, debt_to_gdp:50, cpi_score:82, hdi:0.941, gini:28.1, press_freedom:86, rule_of_law:90, paris_ndc_target:'-55% by 2030 vs 1990', net_zero_year:2050, green_bond_volume_bn:62.8, sovereign_rating:'AAA' },
  { iso2:'CH', name:'Switzerland', region:'Europe', income:'High', population_mn:8.8, gdp_bn:808, gdp_per_capita:91800, climate_score:82, social_score:90, governance_score:94, composite:89, ndgain:75.5, ndgain_vulnerability:28.0, ndgain_readiness:84.0, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:38, emissions_per_capita:4.3, renewable_pct:30, forest_cover_pct:32, debt_to_gdp:42, cpi_score:82, hdi:0.962, gini:33.1, press_freedom:88, rule_of_law:96, paris_ndc_target:'-50% by 2030 vs 1990', net_zero_year:2050, green_bond_volume_bn:18.9, sovereign_rating:'AAA' },
  { iso2:'FI', name:'Finland', region:'Europe', income:'High', population_mn:5.5, gdp_bn:280, gdp_per_capita:50900, climate_score:87, social_score:92, governance_score:95, composite:91, ndgain:74.0, ndgain_vulnerability:29.5, ndgain_readiness:81.0, cat_rating:'Almost Sufficient', cat_color:'#d97706', emissions_mt:42, emissions_per_capita:7.6, renewable_pct:47, forest_cover_pct:73, debt_to_gdp:73, cpi_score:87, hdi:0.940, gini:27.3, press_freedom:88, rule_of_law:94, paris_ndc_target:'-60% by 2030 vs 1990', net_zero_year:2035, green_bond_volume_bn:12.4, sovereign_rating:'AA+' },
  { iso2:'AT', name:'Austria', region:'Europe', income:'High', population_mn:9.1, gdp_bn:478, gdp_per_capita:52500, climate_score:76, social_score:86, governance_score:84, composite:82, ndgain:68.8, ndgain_vulnerability:33.0, ndgain_readiness:76.0, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:72, emissions_per_capita:7.9, renewable_pct:36, forest_cover_pct:47, debt_to_gdp:78, cpi_score:74, hdi:0.916, gini:30.8, press_freedom:80, rule_of_law:87, paris_ndc_target:'-55% by 2030 vs 1990', net_zero_year:2040, green_bond_volume_bn:14.8, sovereign_rating:'AA+' },
  { iso2:'PL', name:'Poland', region:'Europe', income:'High', population_mn:38.0, gdp_bn:688, gdp_per_capita:18100, climate_score:52, social_score:70, governance_score:64, composite:62, ndgain:60.5, ndgain_vulnerability:38.2, ndgain_readiness:66.5, cat_rating:'Highly Insufficient', cat_color:'#dc2626', emissions_mt:340, emissions_per_capita:8.9, renewable_pct:18, forest_cover_pct:31, debt_to_gdp:49, cpi_score:56, hdi:0.876, gini:29.7, press_freedom:50, rule_of_law:55, paris_ndc_target:'-55% by 2030 vs 1990', net_zero_year:2050, green_bond_volume_bn:8.5, sovereign_rating:'A-' },
  { iso2:'IE', name:'Ireland', region:'Europe', income:'High', population_mn:5.1, gdp_bn:530, gdp_per_capita:103900, climate_score:65, social_score:85, governance_score:86, composite:79, ndgain:69.0, ndgain_vulnerability:32.0, ndgain_readiness:77.5, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:60, emissions_per_capita:11.8, renewable_pct:36, forest_cover_pct:11, debt_to_gdp:44, cpi_score:77, hdi:0.945, gini:30.6, press_freedom:78, rule_of_law:86, paris_ndc_target:'-51% by 2030 vs 2018', net_zero_year:2050, green_bond_volume_bn:6.7, sovereign_rating:'AA-' },
  // Americas (7)
  { iso2:'US', name:'United States', region:'Americas', income:'High', population_mn:334, gdp_bn:25500, gdp_per_capita:76300, climate_score:55, social_score:72, governance_score:78, composite:68, ndgain:69.5, ndgain_vulnerability:32.5, ndgain_readiness:78.0, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:5200, emissions_per_capita:15.6, renewable_pct:22, forest_cover_pct:34, debt_to_gdp:123, cpi_score:69, hdi:0.921, gini:41.4, press_freedom:55, rule_of_law:72, paris_ndc_target:'-50-52% by 2030 vs 2005', net_zero_year:2050, green_bond_volume_bn:285.3, sovereign_rating:'AA+' },
  { iso2:'CA', name:'Canada', region:'Americas', income:'High', population_mn:39, gdp_bn:2140, gdp_per_capita:54900, climate_score:62, social_score:84, governance_score:82, composite:76, ndgain:72.5, ndgain_vulnerability:29.8, ndgain_readiness:80.2, cat_rating:'Highly Insufficient', cat_color:'#dc2626', emissions_mt:680, emissions_per_capita:17.4, renewable_pct:68, forest_cover_pct:38, debt_to_gdp:106, cpi_score:74, hdi:0.936, gini:33.3, press_freedom:75, rule_of_law:88, paris_ndc_target:'-40-45% by 2030 vs 2005', net_zero_year:2050, green_bond_volume_bn:38.2, sovereign_rating:'AAA' },
  { iso2:'BR', name:'Brazil', region:'Americas', income:'Upper-Mid', population_mn:215, gdp_bn:1920, gdp_per_capita:8930, climate_score:58, social_score:55, governance_score:48, composite:54, ndgain:51.2, ndgain_vulnerability:42.5, ndgain_readiness:55.8, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:2300, emissions_per_capita:10.7, renewable_pct:48, forest_cover_pct:59, debt_to_gdp:88, cpi_score:38, hdi:0.754, gini:53.4, press_freedom:45, rule_of_law:42, paris_ndc_target:'-50% by 2030 vs 2005', net_zero_year:2050, green_bond_volume_bn:12.8, sovereign_rating:'BB-' },
  { iso2:'CL', name:'Chile', region:'Americas', income:'High', population_mn:19.5, gdp_bn:335, gdp_per_capita:17200, climate_score:65, social_score:68, governance_score:72, composite:68, ndgain:58.5, ndgain_vulnerability:39.0, ndgain_readiness:65.2, cat_rating:'Almost Sufficient', cat_color:'#d97706', emissions_mt:110, emissions_per_capita:5.6, renewable_pct:32, forest_cover_pct:24, debt_to_gdp:36, cpi_score:67, hdi:0.860, gini:44.9, press_freedom:60, rule_of_law:70, paris_ndc_target:'-Peak by 2025, -25% by 2030', net_zero_year:2050, green_bond_volume_bn:7.3, sovereign_rating:'A' },
  { iso2:'MX', name:'Mexico', region:'Americas', income:'Upper-Mid', population_mn:128, gdp_bn:1320, gdp_per_capita:10300, climate_score:50, social_score:56, governance_score:46, composite:51, ndgain:50.8, ndgain_vulnerability:43.2, ndgain_readiness:54.5, cat_rating:'Highly Insufficient', cat_color:'#dc2626', emissions_mt:480, emissions_per_capita:3.8, renewable_pct:18, forest_cover_pct:34, debt_to_gdp:54, cpi_score:31, hdi:0.758, gini:45.4, press_freedom:38, rule_of_law:35, paris_ndc_target:'-22% by 2030 (BAU)', net_zero_year:2050, green_bond_volume_bn:5.2, sovereign_rating:'BBB' },
  { iso2:'CO', name:'Colombia', region:'Americas', income:'Upper-Mid', population_mn:52, gdp_bn:344, gdp_per_capita:6620, climate_score:56, social_score:52, governance_score:50, composite:53, ndgain:48.5, ndgain_vulnerability:45.0, ndgain_readiness:52.0, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:270, emissions_per_capita:5.2, renewable_pct:28, forest_cover_pct:52, debt_to_gdp:60, cpi_score:39, hdi:0.752, gini:51.3, press_freedom:42, rule_of_law:40, paris_ndc_target:'-51% by 2030 (BAU)', net_zero_year:2050, green_bond_volume_bn:2.5, sovereign_rating:'BB+' },
  { iso2:'AR', name:'Argentina', region:'Americas', income:'Upper-Mid', population_mn:46, gdp_bn:632, gdp_per_capita:13740, climate_score:48, social_score:58, governance_score:44, composite:50, ndgain:49.0, ndgain_vulnerability:44.8, ndgain_readiness:52.5, cat_rating:'Highly Insufficient', cat_color:'#dc2626', emissions_mt:370, emissions_per_capita:8.0, renewable_pct:14, forest_cover_pct:10, debt_to_gdp:85, cpi_score:38, hdi:0.842, gini:42.3, press_freedom:48, rule_of_law:38, paris_ndc_target:'-Absolute cap 349Mt by 2030', net_zero_year:2050, green_bond_volume_bn:1.8, sovereign_rating:'CCC+' },
  // Asia-Pacific (11)
  { iso2:'JP', name:'Japan', region:'Asia-Pacific', income:'High', population_mn:125, gdp_bn:4230, gdp_per_capita:33800, climate_score:72, social_score:78, governance_score:76, composite:75, ndgain:67.8, ndgain_vulnerability:34.2, ndgain_readiness:75.8, cat_rating:'Highly Insufficient', cat_color:'#dc2626', emissions_mt:1060, emissions_per_capita:8.5, renewable_pct:22, forest_cover_pct:67, debt_to_gdp:263, cpi_score:73, hdi:0.925, gini:32.9, press_freedom:68, rule_of_law:82, paris_ndc_target:'-46% by 2030 vs 2013', net_zero_year:2050, green_bond_volume_bn:52.3, sovereign_rating:'A+' },
  { iso2:'CN', name:'China', region:'Asia-Pacific', income:'Upper-Mid', population_mn:1412, gdp_bn:17960, gdp_per_capita:12720, climate_score:45, social_score:48, governance_score:38, composite:44, ndgain:49.5, ndgain_vulnerability:46.5, ndgain_readiness:50.2, cat_rating:'Highly Insufficient', cat_color:'#dc2626', emissions_mt:12100, emissions_per_capita:8.6, renewable_pct:31, forest_cover_pct:23, debt_to_gdp:77, cpi_score:45, hdi:0.768, gini:38.2, press_freedom:22, rule_of_law:30, paris_ndc_target:'-Peak by 2030, -65% intensity vs 2005', net_zero_year:2060, green_bond_volume_bn:85.4, sovereign_rating:'A+' },
  { iso2:'IN', name:'India', region:'Asia-Pacific', income:'Lower-Mid', population_mn:1428, gdp_bn:3730, gdp_per_capita:2612, climate_score:60, social_score:42, governance_score:50, composite:51, ndgain:42.8, ndgain_vulnerability:52.0, ndgain_readiness:42.5, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:3400, emissions_per_capita:2.4, renewable_pct:28, forest_cover_pct:24, debt_to_gdp:83, cpi_score:40, hdi:0.633, gini:35.7, press_freedom:36, rule_of_law:45, paris_ndc_target:'-45% intensity by 2030 vs 2005', net_zero_year:2070, green_bond_volume_bn:18.5, sovereign_rating:'BBB-' },
  { iso2:'KR', name:'South Korea', region:'Asia-Pacific', income:'High', population_mn:51.7, gdp_bn:1665, gdp_per_capita:32200, climate_score:68, social_score:74, governance_score:72, composite:71, ndgain:64.5, ndgain_vulnerability:36.5, ndgain_readiness:72.0, cat_rating:'Highly Insufficient', cat_color:'#dc2626', emissions_mt:610, emissions_per_capita:11.8, renewable_pct:9, forest_cover_pct:64, debt_to_gdp:54, cpi_score:63, hdi:0.925, gini:31.4, press_freedom:62, rule_of_law:76, paris_ndc_target:'-40% by 2030 vs 2018', net_zero_year:2050, green_bond_volume_bn:28.5, sovereign_rating:'AA' },
  { iso2:'SG', name:'Singapore', region:'Asia-Pacific', income:'High', population_mn:5.9, gdp_bn:397, gdp_per_capita:67300, climate_score:64, social_score:80, governance_score:92, composite:79, ndgain:70.2, ndgain_vulnerability:31.5, ndgain_readiness:80.0, cat_rating:'Critically Insufficient', cat_color:'#7c3aed', emissions_mt:52, emissions_per_capita:8.8, renewable_pct:4, forest_cover_pct:23, debt_to_gdp:168, cpi_score:83, hdi:0.939, gini:37.9, press_freedom:42, rule_of_law:92, paris_ndc_target:'-Peak ~65Mt by 2030', net_zero_year:2050, green_bond_volume_bn:25.2, sovereign_rating:'AAA' },
  { iso2:'AU', name:'Australia', region:'Asia-Pacific', income:'High', population_mn:26.0, gdp_bn:1680, gdp_per_capita:64600, climate_score:55, social_score:82, governance_score:80, composite:72, ndgain:68.5, ndgain_vulnerability:33.0, ndgain_readiness:78.0, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:500, emissions_per_capita:19.2, renewable_pct:32, forest_cover_pct:17, debt_to_gdp:57, cpi_score:75, hdi:0.951, gini:34.3, press_freedom:65, rule_of_law:85, paris_ndc_target:'-43% by 2030 vs 2005', net_zero_year:2050, green_bond_volume_bn:22.5, sovereign_rating:'AAA' },
  { iso2:'ID', name:'Indonesia', region:'Asia-Pacific', income:'Lower-Mid', population_mn:277, gdp_bn:1320, gdp_per_capita:4760, climate_score:42, social_score:48, governance_score:46, composite:45, ndgain:44.5, ndgain_vulnerability:50.0, ndgain_readiness:46.0, cat_rating:'Highly Insufficient', cat_color:'#dc2626', emissions_mt:1560, emissions_per_capita:5.6, renewable_pct:15, forest_cover_pct:50, debt_to_gdp:40, cpi_score:34, hdi:0.705, gini:37.9, press_freedom:40, rule_of_law:38, paris_ndc_target:'-31.89% by 2030 (BAU)', net_zero_year:2060, green_bond_volume_bn:5.8, sovereign_rating:'BBB' },
  { iso2:'TH', name:'Thailand', region:'Asia-Pacific', income:'Upper-Mid', population_mn:72, gdp_bn:535, gdp_per_capita:7430, climate_score:48, social_score:55, governance_score:50, composite:51, ndgain:50.0, ndgain_vulnerability:44.0, ndgain_readiness:54.0, cat_rating:'Critically Insufficient', cat_color:'#7c3aed', emissions_mt:310, emissions_per_capita:4.3, renewable_pct:15, forest_cover_pct:38, debt_to_gdp:62, cpi_score:36, hdi:0.800, gini:34.9, press_freedom:35, rule_of_law:45, paris_ndc_target:'-30% by 2030 (BAU)', net_zero_year:2065, green_bond_volume_bn:3.5, sovereign_rating:'BBB+' },
  { iso2:'MY', name:'Malaysia', region:'Asia-Pacific', income:'Upper-Mid', population_mn:33, gdp_bn:407, gdp_per_capita:12330, climate_score:46, social_score:60, governance_score:58, composite:55, ndgain:54.5, ndgain_vulnerability:42.0, ndgain_readiness:58.0, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:290, emissions_per_capita:8.8, renewable_pct:10, forest_cover_pct:58, debt_to_gdp:65, cpi_score:50, hdi:0.803, gini:41.2, press_freedom:44, rule_of_law:55, paris_ndc_target:'-45% intensity by 2030 vs 2005', net_zero_year:2050, green_bond_volume_bn:4.2, sovereign_rating:'A-' },
  { iso2:'VN', name:'Vietnam', region:'Asia-Pacific', income:'Lower-Mid', population_mn:100, gdp_bn:409, gdp_per_capita:4090, climate_score:44, social_score:50, governance_score:42, composite:45, ndgain:43.0, ndgain_vulnerability:51.0, ndgain_readiness:44.0, cat_rating:'Critically Insufficient', cat_color:'#7c3aed', emissions_mt:380, emissions_per_capita:3.8, renewable_pct:25, forest_cover_pct:42, debt_to_gdp:39, cpi_score:41, hdi:0.726, gini:35.7, press_freedom:25, rule_of_law:40, paris_ndc_target:'-15.8% by 2030 (BAU)', net_zero_year:2050, green_bond_volume_bn:1.2, sovereign_rating:'BB+' },
  { iso2:'PH', name:'Philippines', region:'Asia-Pacific', income:'Lower-Mid', population_mn:115, gdp_bn:404, gdp_per_capita:3510, climate_score:40, social_score:46, governance_score:44, composite:43, ndgain:40.5, ndgain_vulnerability:54.0, ndgain_readiness:40.5, cat_rating:'1.5\u00B0C Compatible', cat_color:'#16a34a', emissions_mt:190, emissions_per_capita:1.7, renewable_pct:22, forest_cover_pct:24, debt_to_gdp:61, cpi_score:33, hdi:0.699, gini:42.3, press_freedom:38, rule_of_law:35, paris_ndc_target:'-75% by 2030 (BAU)', net_zero_year:2050, green_bond_volume_bn:1.5, sovereign_rating:'BBB+' },
  // Africa (4)
  { iso2:'ZA', name:'South Africa', region:'Africa', income:'Upper-Mid', population_mn:60, gdp_bn:405, gdp_per_capita:6750, climate_score:38, social_score:45, governance_score:52, composite:45, ndgain:46.5, ndgain_vulnerability:48.5, ndgain_readiness:50.0, cat_rating:'Highly Insufficient', cat_color:'#dc2626', emissions_mt:470, emissions_per_capita:7.8, renewable_pct:8, forest_cover_pct:8, debt_to_gdp:72, cpi_score:43, hdi:0.713, gini:63.0, press_freedom:55, rule_of_law:48, paris_ndc_target:'-Peak 398-510Mt by 2030', net_zero_year:2050, green_bond_volume_bn:2.8, sovereign_rating:'BB-' },
  { iso2:'NG', name:'Nigeria', region:'Africa', income:'Lower-Mid', population_mn:224, gdp_bn:477, gdp_per_capita:2130, climate_score:32, social_score:30, governance_score:28, composite:30, ndgain:32.0, ndgain_vulnerability:60.0, ndgain_readiness:28.5, cat_rating:'Critically Insufficient', cat_color:'#7c3aed', emissions_mt:290, emissions_per_capita:1.3, renewable_pct:8, forest_cover_pct:7, debt_to_gdp:38, cpi_score:25, hdi:0.535, gini:35.1, press_freedom:30, rule_of_law:22, paris_ndc_target:'-47% by 2030 (BAU)', net_zero_year:2060, green_bond_volume_bn:0.4, sovereign_rating:'B-' },
  { iso2:'KE', name:'Kenya', region:'Africa', income:'Lower-Mid', population_mn:55, gdp_bn:113, gdp_per_capita:2050, climate_score:52, social_score:40, governance_score:42, composite:45, ndgain:38.5, ndgain_vulnerability:56.0, ndgain_readiness:36.0, cat_rating:'1.5\u00B0C Compatible', cat_color:'#16a34a', emissions_mt:30, emissions_per_capita:0.5, renewable_pct:90, forest_cover_pct:8, debt_to_gdp:70, cpi_score:32, hdi:0.575, gini:40.8, press_freedom:48, rule_of_law:38, paris_ndc_target:'-32% by 2030 (BAU)', net_zero_year:2050, green_bond_volume_bn:0.3, sovereign_rating:'B' },
  { iso2:'GH', name:'Ghana', region:'Africa', income:'Lower-Mid', population_mn:33, gdp_bn:77, gdp_per_capita:2330, climate_score:45, social_score:42, governance_score:50, composite:46, ndgain:40.0, ndgain_vulnerability:55.0, ndgain_readiness:38.0, cat_rating:'1.5\u00B0C Compatible', cat_color:'#16a34a', emissions_mt:42, emissions_per_capita:1.3, renewable_pct:35, forest_cover_pct:21, debt_to_gdp:88, cpi_score:43, hdi:0.602, gini:43.5, press_freedom:55, rule_of_law:50, paris_ndc_target:'-45% by 2030 (BAU)', net_zero_year:2060, green_bond_volume_bn:0.2, sovereign_rating:'B-' },
  // MENA (4)
  { iso2:'AE', name:'United Arab Emirates', region:'MENA', income:'High', population_mn:10, gdp_bn:509, gdp_per_capita:50900, climate_score:40, social_score:62, governance_score:70, composite:57, ndgain:58.0, ndgain_vulnerability:40.0, ndgain_readiness:62.0, cat_rating:'Critically Insufficient', cat_color:'#7c3aed', emissions_mt:220, emissions_per_capita:22.0, renewable_pct:7, forest_cover_pct:4, debt_to_gdp:30, cpi_score:68, hdi:0.911, gini:26.0, press_freedom:35, rule_of_law:70, paris_ndc_target:'-31% by 2030 (BAU)', net_zero_year:2050, green_bond_volume_bn:8.5, sovereign_rating:'AA' },
  { iso2:'SA', name:'Saudi Arabia', region:'MENA', income:'High', population_mn:36, gdp_bn:1069, gdp_per_capita:29700, climate_score:28, social_score:45, governance_score:48, composite:40, ndgain:50.0, ndgain_vulnerability:45.0, ndgain_readiness:52.0, cat_rating:'Critically Insufficient', cat_color:'#7c3aed', emissions_mt:620, emissions_per_capita:17.2, renewable_pct:1, forest_cover_pct:1, debt_to_gdp:26, cpi_score:53, hdi:0.875, gini:45.9, press_freedom:18, rule_of_law:55, paris_ndc_target:'-278Mt reduction by 2030', net_zero_year:2060, green_bond_volume_bn:3.2, sovereign_rating:'A' },
  { iso2:'IL', name:'Israel', region:'MENA', income:'High', population_mn:9.7, gdp_bn:525, gdp_per_capita:54100, climate_score:55, social_score:72, governance_score:68, composite:65, ndgain:62.0, ndgain_vulnerability:38.0, ndgain_readiness:68.0, cat_rating:'Insufficient', cat_color:'#d97706', emissions_mt:75, emissions_per_capita:7.7, renewable_pct:12, forest_cover_pct:8, debt_to_gdp:60, cpi_score:62, hdi:0.919, gini:39.0, press_freedom:52, rule_of_law:65, paris_ndc_target:'-27% by 2030 vs 2015', net_zero_year:2050, green_bond_volume_bn:4.5, sovereign_rating:'A+' },
  { iso2:'EG', name:'Egypt', region:'MENA', income:'Lower-Mid', population_mn:110, gdp_bn:476, gdp_per_capita:4330, climate_score:35, social_score:38, governance_score:35, composite:36, ndgain:38.0, ndgain_vulnerability:55.5, ndgain_readiness:36.5, cat_rating:'Highly Insufficient', cat_color:'#dc2626', emissions_mt:340, emissions_per_capita:3.1, renewable_pct:12, forest_cover_pct:1, debt_to_gdp:92, cpi_score:30, hdi:0.731, gini:31.5, press_freedom:22, rule_of_law:28, paris_ndc_target:'-33% by 2030 (conditional)', net_zero_year:2050, green_bond_volume_bn:1.2, sovereign_rating:'B' },
];

const COUNTRY_MAP = {};
SOVEREIGN_DB.forEach(c => { COUNTRY_MAP[c.iso2] = c; COUNTRY_MAP[c.name] = c; });

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
const scoreColor = v => v >= 80 ? T.green : v >= 60 ? T.sage : v >= 40 ? T.amber : T.red;
const fmt = (v, d = 1) => typeof v === 'number' ? v.toFixed(d) : v;

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
const avg = (arr, key) => arr.length ? arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length : 0;

/* ══════════════════════════════════════════════════════════════
   TABS
   ══════════════════════════════════════════════════════════════ */
const TABS = ['Rankings & KPIs', 'Climate & Emissions', 'Governance & Social', 'Portfolio Exposure', 'Country Deep Dive', 'Compare & Export'];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
const SovereignEsgPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [sortCol, setSortCol] = useState('composite');
  const [sortDir, setSortDir] = useState('desc');
  const [regionFilter, setRegionFilter] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [searchQ, setSearchQ] = useState('');

  const onSort = useCallback(col => { setSortDir(d => sortCol === col ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); setSortCol(col); }, [sortCol]);

  /* portfolio linkage */
  const portfolio = useMemo(() => {
    const p = loadLS(LS_PORTFOLIO);
    if (!p || !p.length) return GLOBAL_COMPANY_MASTER.slice(0, 30);
    return p.map(h => { const m = GLOBAL_COMPANY_MASTER.find(c => c.isin === h.isin || c.ticker === h.ticker); return m ? { ...m, ...h } : h; }).filter(Boolean);
  }, []);

  const countryExposure = useMemo(() => {
    const map = {};
    portfolio.forEach(h => {
      const c = h.country || h._region || 'Unknown';
      if (!map[c]) map[c] = { count: 0, weight: 0 };
      map[c].count += 1;
      map[c].weight += (h.weight || 1 / (portfolio.length || 1)) * 100;
    });
    return map;
  }, [portfolio]);

  /* filtering & sorting */
  const filtered = useMemo(() => {
    let d = SOVEREIGN_DB;
    if (regionFilter !== 'All') d = d.filter(c => c.region === regionFilter);
    if (searchQ) { const q = searchQ.toLowerCase(); d = d.filter(c => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q)); }
    return [...d].sort((a, b) => { const va = a[sortCol], vb = b[sortCol]; if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va; return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va)); });
  }, [regionFilter, searchQ, sortCol, sortDir]);

  /* KPI calculations */
  const kpis = useMemo(() => {
    const db = SOVEREIGN_DB;
    const parisAligned = db.filter(c => c.cat_rating.includes('1.5') || c.cat_rating === 'Almost Sufficient').length;
    const netZero = db.filter(c => c.net_zero_year).length;
    const portfolioCountries = Object.keys(countryExposure).length;
    const weightedESG = (() => {
      let wSum = 0, wTotal = 0;
      Object.entries(countryExposure).forEach(([cn, data]) => {
        const sov = SOVEREIGN_DB.find(s => s.name === cn || s.iso2 === cn);
        if (sov) { wSum += sov.composite * data.weight; wTotal += data.weight; }
      });
      return wTotal > 0 ? wSum / wTotal : 0;
    })();
    return {
      countries: db.length, portfolioCountries, weightedESG: weightedESG.toFixed(1),
      avgNdgain: avg(db, 'ndgain').toFixed(1), parisAligned: ((parisAligned / db.length) * 100).toFixed(0),
      netZero: ((netZero / db.length) * 100).toFixed(0),
      avgEmissionsPC: avg(db, 'emissions_per_capita').toFixed(1),
      greenBondTotal: db.reduce((s, c) => s + c.green_bond_volume_bn, 0).toFixed(0),
      avgHdi: avg(db, 'hdi').toFixed(3), avgCpi: avg(db, 'cpi_score').toFixed(0),
      avgGini: avg(db, 'gini').toFixed(1), avgRenewable: avg(db, 'renewable_pct').toFixed(0)
    };
  }, [countryExposure]);

  /* chart data */
  const regionESG = useMemo(() => {
    const map = {};
    SOVEREIGN_DB.forEach(c => {
      if (!map[c.region]) map[c.region] = { region: c.region, climate: 0, social: 0, governance: 0, n: 0 };
      map[c.region].climate += c.climate_score; map[c.region].social += c.social_score; map[c.region].governance += c.governance_score; map[c.region].n += 1;
    });
    return Object.values(map).map(r => ({ region: r.region, Climate: +(r.climate / (r.n || 1)).toFixed(1), Social: +(r.social / (r.n || 1)).toFixed(1), Governance: +(r.governance / (r.n || 1)).toFixed(1) }));
  }, []);

  const catDistribution = useMemo(() => {
    const map = {};
    SOVEREIGN_DB.forEach(c => { const r = c.cat_rating; map[r] = (map[r] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  const scatterData = useMemo(() => SOVEREIGN_DB.map(c => ({ name: c.name, region: c.region, x: c.ndgain_vulnerability, y: c.ndgain_readiness, z: Math.sqrt(c.gdp_bn) * 3, iso2: c.iso2 })), []);

  const emissionsSorted = useMemo(() => [...SOVEREIGN_DB].sort((a, b) => b.emissions_per_capita - a.emissions_per_capita), []);
  const greenBondSorted = useMemo(() => [...SOVEREIGN_DB].sort((a, b) => b.green_bond_volume_bn - a.green_bond_volume_bn).slice(0, 20), []);

  const toggleCompare = (iso2) => setCompareList(prev => prev.includes(iso2) ? prev.filter(x => x !== iso2) : prev.length < 3 ? [...prev, iso2] : prev);

  /* ── RENDER ── */
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.navy, letterSpacing: '-0.5px' }}>Sovereign ESG Scorer</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Badge label="40 Countries" color={T.navy} /><Badge label="ND-GAIN" color={T.sage} /><Badge label="CAT Ratings" color={T.gold} /><Badge label="Paris NDCs" color={T.amber} /><Badge label="HDI" color="#7c3aed" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" onClick={() => csvExport(SOVEREIGN_DB, [{ label:'Country', key:'name' },{ label:'ISO2', key:'iso2' },{ label:'Region', key:'region' },{ label:'Composite', key:'composite' },{ label:'Climate', key:'climate_score' },{ label:'Social', key:'social_score' },{ label:'Governance', key:'governance_score' },{ label:'ND-GAIN', key:'ndgain' },{ label:'CAT', key:'cat_rating' },{ label:'Emissions/Cap', key:'emissions_per_capita' },{ label:'HDI', key:'hdi' },{ label:'CPI', key:'cpi_score' },{ label:'Gini', key:'gini' },{ label:'Renewables%', key:'renewable_pct' },{ label:'Green Bonds $Bn', key:'green_bond_volume_bn' },{ label:'Rating', key:'sovereign_rating' }], 'sovereign_esg_export.csv')}>Export CSV</Btn>
          <Btn variant="outline" onClick={() => jsonExport(compareList.map(iso => COUNTRY_MAP[iso]).filter(Boolean), 'country_comparison.json')}>Compare JSON</Btn>
          <Btn variant="outline" onClick={printExport}>Print</Btn>
          <Btn onClick={() => navigate('/climate-policy')}>Climate Policy Tracker</Btn>
        </div>
      </div>

      {/* Tabs + Controls */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search countries..." style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, width: 220 }} />
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 }}>
          <option value="All">All Regions</option>{['Europe','Americas','Asia-Pacific','Africa','MENA'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {compareList.length > 0 && <Badge label={`Comparing: ${compareList.join(', ')}`} color={T.sage} />}
      </div>

      {/* ═══ TAB 1: Rankings & KPIs ═══ */}
      {tab === TABS[0] && (<>
        {/* 12 KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
          <KpiCard label="Countries Covered" value={kpis.countries} sub="40 sovereigns" />
          <KpiCard label="Portfolio Exposure" value={kpis.portfolioCountries} sub="unique countries" />
          <KpiCard label="Weighted Sovereign ESG" value={kpis.weightedESG} color={scoreColor(parseFloat(kpis.weightedESG))} sub="portfolio-weighted" />
          <KpiCard label="Avg ND-GAIN" value={kpis.avgNdgain} sub="readiness index" />
          <KpiCard label="Paris-Aligned %" value={`${kpis.parisAligned}%`} color={parseInt(kpis.parisAligned) > 50 ? T.green : T.amber} />
          <KpiCard label="Net Zero Committed" value={`${kpis.netZero}%`} color={T.sage} />
          <KpiCard label="Avg Emissions/Capita" value={`${kpis.avgEmissionsPC}t`} sub="CO2e per person" />
          <KpiCard label="Green Bond Market" value={`$${kpis.greenBondTotal}Bn`} color={T.sage} />
          <KpiCard label="Avg HDI" value={kpis.avgHdi} sub="Human Dev Index" />
          <KpiCard label="Avg CPI (Corruption)" value={kpis.avgCpi} sub="0-100 scale" />
          <KpiCard label="Avg Gini" value={kpis.avgGini} sub="inequality index" />
          <KpiCard label="Avg Renewables" value={`${kpis.avgRenewable}%`} color={T.sage} />
        </div>

        {/* Country Ranking Table */}
        <Section title="Country ESG Rankings" sub={`${filtered.length} countries sorted by ${sortCol}`}>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead><tr style={{ background: T.surfaceH }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}`, width: 30 }}>Cmp</th>
                <SortTh label="Country" sortKey="name" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Region" sortKey="region" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Composite" sortKey="composite" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Climate" sortKey="climate_score" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Social" sortKey="social_score" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Gov" sortKey="governance_score" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="ND-GAIN" sortKey="ndgain" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="CAT Rating" sortKey="cat_rating" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Emis/Cap" sortKey="emissions_per_capita" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Renew%" sortKey="renewable_pct" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="HDI" sortKey="hdi" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="CPI" sortKey="cpi_score" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Rating" sortKey="sovereign_rating" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Green Bonds" sortKey="green_bond_volume_bn" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              </tr></thead>
              <tbody>{filtered.map((c, i) => (
                <tr key={c.iso2} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, cursor: 'pointer' }} onClick={() => setSelectedCountry(c.iso2)}>
                  <td style={{ padding: '8px 12px' }}><input type="checkbox" checked={compareList.includes(c.iso2)} onChange={e => { e.stopPropagation(); toggleCompare(c.iso2); }} /></td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{c.iso2} {c.name}</td>
                  <td style={{ padding: '8px 12px' }}><span style={{ color: REGION_COLORS[c.region] || T.navy }}>{c.region}</span></td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: scoreColor(c.composite) }}>{c.composite}</td>
                  <td style={{ padding: '8px 12px', color: scoreColor(c.climate_score) }}>{c.climate_score}</td>
                  <td style={{ padding: '8px 12px', color: scoreColor(c.social_score) }}>{c.social_score}</td>
                  <td style={{ padding: '8px 12px', color: scoreColor(c.governance_score) }}>{c.governance_score}</td>
                  <td style={{ padding: '8px 12px' }}>{c.ndgain}</td>
                  <td style={{ padding: '8px 12px' }}><span style={{ color: c.cat_color, fontWeight: 600, fontSize: 11 }}>{c.cat_rating}</span></td>
                  <td style={{ padding: '8px 12px' }}>{c.emissions_per_capita}t</td>
                  <td style={{ padding: '8px 12px' }}>{c.renewable_pct}%</td>
                  <td style={{ padding: '8px 12px' }}>{c.hdi}</td>
                  <td style={{ padding: '8px 12px' }}>{c.cpi_score}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.sovereign_rating}</td>
                  <td style={{ padding: '8px 12px' }}>${c.green_bond_volume_bn}Bn</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: T.textMut }}>No countries match your filter criteria. Try broadening your search.</div>}
        </Section>

        {/* Regional ESG Bar Chart */}
        <Section title="Sovereign ESG by Region" sub="Average E/S/G scores">
          <Card><ResponsiveContainer width="100%" height={320}>
            <BarChart data={regionESG} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="region" tick={{ fill: T.textSec, fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fill: T.textSec, fontSize: 11 }} /><Tooltip /><Legend />
              <Bar dataKey="Climate" fill={T.sage} radius={[4,4,0,0]} /><Bar dataKey="Social" fill={T.gold} radius={[4,4,0,0]} /><Bar dataKey="Governance" fill={T.navy} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer></Card>
        </Section>

        {/* CAT Distribution */}
        <Section title="Climate Action Tracker Distribution" sub="Global temperature alignment">
          <Card><ResponsiveContainer width="100%" height={300}>
            <PieChart><Pie data={catDistribution} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
              {catDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer></Card>
        </Section>
      </>)}

      {/* ═══ TAB 2: Climate & Emissions ═══ */}
      {tab === TABS[1] && (<>
        {/* ND-GAIN Scatter */}
        <Section title="ND-GAIN Vulnerability vs Readiness" sub="Bubble size = GDP, color = region">
          <Card><ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="x" name="Vulnerability" type="number" domain={[20, 65]} tick={{ fontSize: 11 }} label={{ value: 'Vulnerability (lower = better)', position: 'bottom', fontSize: 11 }} /><YAxis dataKey="y" name="Readiness" type="number" domain={[25, 90]} tick={{ fontSize: 11 }} label={{ value: 'Readiness (higher = better)', angle: -90, position: 'left', fontSize: 11 }} /><ZAxis dataKey="z" range={[40, 600]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload && payload[0] ? <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12 }}><div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div><div>Vulnerability: {payload[0].payload.x}</div><div>Readiness: {payload[0].payload.y}</div><div>Region: {payload[0].payload.region}</div></div> : null} />
              {['Europe','Americas','Asia-Pacific','Africa','MENA'].map(region => (
                <Scatter key={region} name={region} data={scatterData.filter(d => d.region === region)} fill={REGION_COLORS[region]} opacity={0.75} />
              ))}
              <Legend />
            </ScatterChart>
          </ResponsiveContainer></Card>
        </Section>

        {/* Emissions per Capita */}
        <Section title="Emissions per Capita" sub="tCO2e/person, 2\u00B0C target line at 2.0t">
          <Card><ResponsiveContainer width="100%" height={500}>
            <BarChart data={emissionsSorted} layout="vertical" margin={{ left: 100 }}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={95} />
              <Tooltip /><Bar dataKey="emissions_per_capita" name="Emissions/Capita (t)">{emissionsSorted.map((c, i) => <Cell key={i} fill={c.emissions_per_capita > 10 ? T.red : c.emissions_per_capita > 5 ? T.amber : T.green} />)}</Bar>
              <Line type="monotone" dataKey={() => 2.0} stroke={T.red} strokeDasharray="5 5" />
            </BarChart>
          </ResponsiveContainer></Card>
        </Section>

        {/* Paris NDC Target Comparison */}
        <Section title="Paris NDC Target Comparison" sub="Country commitments and net zero timelines">
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead><tr style={{ background: T.surfaceH }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>Country</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>NDC Target</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>Net Zero Year</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>CAT Rating</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>Renewable %</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>Emissions (Mt)</th>
              </tr></thead>
              <tbody>{SOVEREIGN_DB.map((c, i) => (
                <tr key={c.iso2} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.iso2} {c.name}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>{c.paris_ndc_target}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: c.net_zero_year <= 2050 ? T.green : T.amber }}>{c.net_zero_year}</td>
                  <td style={{ padding: '8px 12px' }}><span style={{ color: c.cat_color, fontWeight: 600 }}>{c.cat_rating}</span></td>
                  <td style={{ padding: '8px 12px' }}>{c.renewable_pct}%</td>
                  <td style={{ padding: '8px 12px' }}>{c.emissions_mt.toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>

        {/* Green Bond Market */}
        <Section title="Green Bond Market by Country" sub="Top 20 issuers ($Bn)">
          <Card><ResponsiveContainer width="100%" height={420}>
            <BarChart data={greenBondSorted} layout="vertical" margin={{ left: 110 }}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={105} />
              <Tooltip /><Bar dataKey="green_bond_volume_bn" name="Green Bonds ($Bn)" fill={T.sage} radius={[0,4,4,0]}>{greenBondSorted.map((c, i) => <Cell key={i} fill={c.green_bond_volume_bn > 50 ? T.sage : c.green_bond_volume_bn > 10 ? T.gold : T.navy} />)}</Bar>
            </BarChart>
          </ResponsiveContainer></Card>
        </Section>
      </>)}

      {/* ═══ TAB 3: Governance & Social ═══ */}
      {tab === TABS[2] && (<>
        {/* Governance Indicators */}
        <Section title="Governance Indicators" sub="CPI (Corruption), Rule of Law, Press Freedom">
          <Card><ResponsiveContainer width="100%" height={500}>
            <BarChart data={[...SOVEREIGN_DB].sort((a, b) => b.cpi_score - a.cpi_score).slice(0, 25)} layout="vertical" margin={{ left: 110 }}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={105} /><Tooltip /><Legend />
              <Bar dataKey="cpi_score" name="CPI (Corruption)" fill={T.navy} /><Bar dataKey="rule_of_law" name="Rule of Law" fill={T.sage} /><Bar dataKey="press_freedom" name="Press Freedom" fill={T.gold} />
            </BarChart>
          </ResponsiveContainer></Card>
        </Section>

        {/* Social Indicators */}
        <Section title="Social Indicators" sub="HDI, Gini coefficient (inequality)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Human Development Index (HDI)</div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={[...SOVEREIGN_DB].sort((a, b) => b.hdi - a.hdi).slice(0, 20)} layout="vertical" margin={{ left: 100 }}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis type="number" domain={[0.5, 1.0]} tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={95} />
                  <Tooltip /><Bar dataKey="hdi" name="HDI" fill={T.navyL}>{[...SOVEREIGN_DB].sort((a, b) => b.hdi - a.hdi).slice(0, 20).map((c, i) => <Cell key={i} fill={c.hdi > 0.9 ? T.green : c.hdi > 0.7 ? T.gold : T.red} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Gini Coefficient (Inequality)</div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={[...SOVEREIGN_DB].sort((a, b) => b.gini - a.gini).slice(0, 20)} layout="vertical" margin={{ left: 100 }}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis type="number" domain={[20, 70]} tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={95} />
                  <Tooltip /><Bar dataKey="gini" name="Gini">{[...SOVEREIGN_DB].sort((a, b) => b.gini - a.gini).slice(0, 20).map((c, i) => <Cell key={i} fill={c.gini > 45 ? T.red : c.gini > 35 ? T.amber : T.green} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </Section>

        {/* Sovereign Bond Risk Overlay */}
        <Section title="Sovereign Bond Risk Overlay" sub="ESG composite vs credit rating & green bond volume">
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead><tr style={{ background: T.surfaceH }}>
                {['Country','Composite ESG','Sovereign Rating','Debt/GDP %','Green Bonds $Bn','CPI','HDI'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{[...SOVEREIGN_DB].sort((a, b) => b.composite - a.composite).map((c, i) => (
                <tr key={c.iso2} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: scoreColor(c.composite) }}>{c.composite}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.sovereign_rating}</td>
                  <td style={{ padding: '8px 12px', color: c.debt_to_gdp > 100 ? T.red : c.debt_to_gdp > 60 ? T.amber : T.green }}>{c.debt_to_gdp}%</td>
                  <td style={{ padding: '8px 12px' }}>${c.green_bond_volume_bn}Bn</td>
                  <td style={{ padding: '8px 12px' }}>{c.cpi_score}</td>
                  <td style={{ padding: '8px 12px' }}>{c.hdi}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>
      </>)}

      {/* ═══ TAB 4: Portfolio Exposure ═══ */}
      {tab === TABS[3] && (<>
        <Section title="Portfolio Sovereign Exposure" sub="Holdings mapped to country ESG scores">
          {Object.keys(countryExposure).length === 0 ? (
            <Card><div style={{ padding: 40, textAlign: 'center', color: T.textMut }}>No portfolio data found. Build a portfolio in the Portfolio Builder to see sovereign exposure mapping.</div></Card>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  {['Country','Holdings','Weight %','Sovereign ESG','Climate','Social','Governance','CAT Rating','Emissions/Cap','Rating'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{Object.entries(countryExposure).sort((a, b) => b[1].weight - a[1].weight).map(([cn, data], i) => {
                  const sov = SOVEREIGN_DB.find(s => s.name === cn || s.iso2 === cn || cn.includes(s.name));
                  return (
                    <tr key={cn} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{cn}</td>
                      <td style={{ padding: '8px 12px' }}>{data.count}</td>
                      <td style={{ padding: '8px 12px' }}>{data.weight.toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: sov ? scoreColor(sov.composite) : T.textMut }}>{sov ? sov.composite : 'N/A'}</td>
                      <td style={{ padding: '8px 12px' }}>{sov ? sov.climate_score : '-'}</td>
                      <td style={{ padding: '8px 12px' }}>{sov ? sov.social_score : '-'}</td>
                      <td style={{ padding: '8px 12px' }}>{sov ? sov.governance_score : '-'}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ color: sov?.cat_color || T.textMut, fontWeight: 600, fontSize: 11 }}>{sov?.cat_rating || '-'}</span></td>
                      <td style={{ padding: '8px 12px' }}>{sov ? `${sov.emissions_per_capita}t` : '-'}</td>
                      <td style={{ padding: '8px 12px' }}>{sov?.sovereign_rating || '-'}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Portfolio country weight chart */}
        <Section title="Country Weight Distribution" sub="Portfolio allocation by country">
          <Card><ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(countryExposure).map(([cn, d]) => ({ name: cn, weight: +d.weight.toFixed(1) })).sort((a, b) => b.weight - a.weight).slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{ fontSize: 10, angle: -30 }} height={60} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="weight" name="Weight %" fill={T.navy} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer></Card>
        </Section>
      </>)}

      {/* ═══ TAB 5: Country Deep Dive ═══ */}
      {tab === TABS[4] && (<>
        {selectedCountry ? (() => {
          const c = COUNTRY_MAP[selectedCountry];
          if (!c) return <Card><div style={{ padding: 40, textAlign: 'center', color: T.textMut }}>Country not found.</div></Card>;
          return (
            <Section title={`${c.name} (${c.iso2})`} sub={`${c.region} | ${c.income} Income | Pop ${c.population_mn}M`}>
              <Btn variant="outline" onClick={() => setSelectedCountry(null)} style={{ marginBottom: 16 }}>Back to List</Btn>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                <KpiCard label="Composite ESG" value={c.composite} color={scoreColor(c.composite)} />
                <KpiCard label="Climate Score" value={c.climate_score} color={scoreColor(c.climate_score)} />
                <KpiCard label="Social Score" value={c.social_score} color={scoreColor(c.social_score)} />
                <KpiCard label="Governance Score" value={c.governance_score} color={scoreColor(c.governance_score)} />
                <KpiCard label="ND-GAIN Index" value={c.ndgain} sub={`Vuln: ${c.ndgain_vulnerability} | Ready: ${c.ndgain_readiness}`} />
                <KpiCard label="CAT Rating" value={c.cat_rating} color={c.cat_color} />
                <KpiCard label="GDP" value={`$${c.gdp_bn.toLocaleString()}Bn`} sub={`$${c.gdp_per_capita.toLocaleString()}/cap`} />
                <KpiCard label="Emissions" value={`${c.emissions_mt.toLocaleString()} Mt`} sub={`${c.emissions_per_capita}t/capita`} />
                <KpiCard label="Renewables" value={`${c.renewable_pct}%`} color={c.renewable_pct > 40 ? T.green : T.amber} />
                <KpiCard label="Forest Cover" value={`${c.forest_cover_pct}%`} />
                <KpiCard label="Debt/GDP" value={`${c.debt_to_gdp}%`} color={c.debt_to_gdp > 100 ? T.red : T.green} />
                <KpiCard label="CPI (Corruption)" value={c.cpi_score} color={c.cpi_score > 60 ? T.green : T.red} />
                <KpiCard label="HDI" value={c.hdi} color={c.hdi > 0.8 ? T.green : T.amber} />
                <KpiCard label="Gini" value={c.gini} color={c.gini > 40 ? T.red : T.green} />
                <KpiCard label="Press Freedom" value={c.press_freedom} />
                <KpiCard label="Rule of Law" value={c.rule_of_law} />
                <KpiCard label="Sovereign Rating" value={c.sovereign_rating} />
                <KpiCard label="Green Bonds" value={`$${c.green_bond_volume_bn}Bn`} color={T.sage} />
                <KpiCard label="Net Zero Target" value={c.net_zero_year} color={c.net_zero_year <= 2050 ? T.green : T.amber} />
              </div>
              <Card style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Paris NDC Commitment</div>
                <div style={{ fontSize: 14, color: T.text }}>{c.paris_ndc_target}</div>
              </Card>
            </Section>
          );
        })() : (
          <Section title="Select a Country" sub="Click any country from the list below for a full profile">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
              {SOVEREIGN_DB.map(c => (
                <Card key={c.iso2} onClick={() => setSelectedCountry(c.iso2)} style={{ cursor: 'pointer', padding: 14 }}>
                  <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{c.iso2} {c.name}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{c.region} | Composite: <span style={{ color: scoreColor(c.composite), fontWeight: 700 }}>{c.composite}</span></div>
                  <div style={{ fontSize: 11, color: c.cat_color, marginTop: 4 }}>{c.cat_rating}</div>
                </Card>
              ))}
            </div>
          </Section>
        )}
      </>)}

      {/* ═══ TAB 6: Compare & Export ═══ */}
      {tab === TABS[5] && (<>
        <Section title="Country Comparison Mode" sub="Select 2-3 countries using checkboxes in the Rankings table">
          {compareList.length === 0 ? (
            <Card><div style={{ padding: 40, textAlign: 'center', color: T.textMut }}>No countries selected for comparison. Go to Rankings &amp; KPIs tab and check the compare boxes next to countries you want to compare side-by-side.</div></Card>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>Indicator</th>
                  {compareList.map(iso => { const c = COUNTRY_MAP[iso]; return <th key={iso} style={{ padding: '10px 14px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11 }}>{c?.name || iso}</th>; })}
                </tr></thead>
                <tbody>{[
                  { label: 'Composite ESG', key: 'composite' }, { label: 'Climate Score', key: 'climate_score' }, { label: 'Social Score', key: 'social_score' },
                  { label: 'Governance Score', key: 'governance_score' }, { label: 'ND-GAIN', key: 'ndgain' }, { label: 'Vulnerability', key: 'ndgain_vulnerability' },
                  { label: 'Readiness', key: 'ndgain_readiness' }, { label: 'CAT Rating', key: 'cat_rating' }, { label: 'Emissions/Capita', key: 'emissions_per_capita' },
                  { label: 'Renewables %', key: 'renewable_pct' }, { label: 'GDP ($Bn)', key: 'gdp_bn' }, { label: 'GDP/Capita', key: 'gdp_per_capita' },
                  { label: 'Population (M)', key: 'population_mn' }, { label: 'Debt/GDP %', key: 'debt_to_gdp' }, { label: 'CPI (Corruption)', key: 'cpi_score' },
                  { label: 'HDI', key: 'hdi' }, { label: 'Gini', key: 'gini' }, { label: 'Press Freedom', key: 'press_freedom' },
                  { label: 'Rule of Law', key: 'rule_of_law' }, { label: 'Sovereign Rating', key: 'sovereign_rating' }, { label: 'Green Bonds ($Bn)', key: 'green_bond_volume_bn' },
                  { label: 'Net Zero Year', key: 'net_zero_year' }, { label: 'NDC Target', key: 'paris_ndc_target' },
                ].map((row, i) => (
                  <tr key={row.key} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600, color: T.navy }}>{row.label}</td>
                    {compareList.map(iso => { const c = COUNTRY_MAP[iso]; const v = c?.[row.key]; return (
                      <td key={iso} style={{ padding: '8px 14px', textAlign: 'center', fontWeight: typeof v === 'number' ? 700 : 400, color: typeof v === 'number' && row.key !== 'gini' && row.key !== 'ndgain_vulnerability' && row.key !== 'emissions_per_capita' && row.key !== 'debt_to_gdp' ? scoreColor(v) : T.text }}>{v ?? '-'}</td>
                    ); })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Btn onClick={() => setCompareList([])}>Clear Comparison</Btn>
            <Btn variant="outline" onClick={() => jsonExport(compareList.map(iso => COUNTRY_MAP[iso]).filter(Boolean), 'country_comparison.json')}>Export Comparison JSON</Btn>
          </div>
        </Section>

        {/* Cross-nav */}
        <Section title="Cross-Navigation" sub="Related analytics modules">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Climate Policy Tracker', path: '/climate-policy' },
              { label: 'Transition Risk', path: '/transition-risk' },
              { label: 'NGFS Scenarios', path: '/ngfs-scenarios' },
              { label: 'Stranded Assets', path: '/stranded-assets' },
              { label: 'Portfolio Climate VaR', path: '/portfolio-climate-var' },
              { label: 'Regulatory Calendar', path: '/regulatory-calendar' },
            ].map(link => (
              <Btn key={link.path} variant="outline" onClick={() => navigate(link.path)}>{link.label}</Btn>
            ))}
          </div>
        </Section>
      </>)}

      {/* Footer */}
      <div style={{ marginTop: 40, padding: '16px 0', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}>
        <span>Sovereign ESG Scorer | Sprint O - EP-O1 | 40 Countries</span>
        <span>Data: ND-GAIN, CAT, World Bank, IMF, TPI | Updated Mar 2026</span>
      </div>
    </div>
  );
};

export default SovereignEsgPage;
