import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, ComposedChart,
} from 'recharts';

/* ───────────────────── THEME ───────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ───────────────────── CRREM PATHWAYS ───────────────────── */
const CRREM_PATHWAYS = {
  Office:      { '1.5': { 2020:70, 2025:58, 2030:45, 2035:32, 2040:20, 2045:10, 2050:0 }, 'WB2': { 2020:70, 2025:62, 2030:52, 2035:42, 2040:30, 2045:18, 2050:8 }, '2.0': { 2020:70, 2025:65, 2030:58, 2035:48, 2040:38, 2045:25, 2050:15 } },
  Retail:      { '1.5': { 2020:65, 2025:54, 2030:42, 2035:30, 2040:18, 2045:9, 2050:0 }, 'WB2': { 2020:65, 2025:58, 2030:48, 2035:38, 2040:26, 2045:15, 2050:6 }, '2.0': { 2020:65, 2025:60, 2030:54, 2035:45, 2040:35, 2045:22, 2050:12 } },
  Industrial:  { '1.5': { 2020:40, 2025:33, 2030:26, 2035:19, 2040:12, 2045:6, 2050:0 }, 'WB2': { 2020:40, 2025:36, 2030:30, 2035:24, 2040:16, 2045:10, 2050:4 }, '2.0': { 2020:40, 2025:38, 2030:34, 2035:28, 2040:22, 2045:14, 2050:8 } },
  Logistics:   { '1.5': { 2020:35, 2025:29, 2030:22, 2035:16, 2040:10, 2045:5, 2050:0 }, 'WB2': { 2020:35, 2025:32, 2030:26, 2035:21, 2040:14, 2045:8, 2050:3 }, '2.0': { 2020:35, 2025:33, 2030:30, 2035:24, 2040:19, 2045:12, 2050:6 } },
  Residential: { '1.5': { 2020:30, 2025:25, 2030:20, 2035:14, 2040:9, 2045:4, 2050:0 }, 'WB2': { 2020:30, 2025:27, 2030:23, 2035:18, 2040:12, 2045:7, 2050:3 }, '2.0': { 2020:30, 2025:28, 2030:25, 2035:21, 2040:16, 2045:10, 2050:5 } },
  Hotel:       { '1.5': { 2020:80, 2025:66, 2030:52, 2035:38, 2040:24, 2045:12, 2050:0 }, 'WB2': { 2020:80, 2025:72, 2030:60, 2035:48, 2040:34, 2045:20, 2050:8 }, '2.0': { 2020:80, 2025:75, 2030:66, 2035:55, 2040:42, 2045:28, 2050:15 } },
  DataCentre:  { '1.5': { 2020:250, 2025:208, 2030:165, 2035:120, 2040:75, 2045:38, 2050:0 }, 'WB2': { 2020:250, 2025:225, 2030:190, 2035:150, 2040:105, 2045:60, 2050:25 }, '2.0': { 2020:250, 2025:235, 2030:210, 2035:175, 2040:135, 2045:85, 2050:45 } },
  Mixed:       { '1.5': { 2020:55, 2025:46, 2030:36, 2035:26, 2040:16, 2045:8, 2050:0 }, 'WB2': { 2020:55, 2025:49, 2030:42, 2035:34, 2040:24, 2045:14, 2050:6 }, '2.0': { 2020:55, 2025:51, 2030:46, 2035:38, 2040:30, 2045:20, 2050:10 } },
  Healthcare:  { '1.5': { 2020:90, 2025:75, 2030:58, 2035:42, 2040:26, 2045:13, 2050:0 }, 'WB2': { 2020:90, 2025:80, 2030:68, 2035:52, 2040:38, 2045:22, 2050:10 }, '2.0': { 2020:90, 2025:84, 2030:74, 2035:62, 2040:48, 2045:32, 2050:18 } },
};

/* ───────────────────── CONSTANTS ───────────────────── */
const PROPERTY_TYPES = ['Office','Retail','Industrial','Logistics','Residential','Hotel','DataCentre','Mixed','Healthcare'];
const CONSTRUCTION_TYPES = ['Steel Frame','Reinforced Concrete','Timber','CLT Timber','Mixed'];
const EPC_RATINGS = ['A','B','C','D','E','F','G'];
const COUNTRIES = ['GBR','FRA','SGP','DEU','USA','JPN','AUS','IND','BRA','CHN','CAN','ARE','KOR','NLD','ESP','ITA','CHE','SWE','NOR','HKG','NZL','MYS','THA','IDN','PHL','ZAF','MEX','CHL','COL','SAU'];

const BULK_IMPORT_PROPERTIES = [
  { id:'P31', name:'Pudong Tower', type:'Office', city:'Shanghai', country:'CHN', countryCode:'CN', lat:31.235, lon:121.506, gfa_m2:78000, nla_m2:66000, floors:42, year_built:2014, year_renovated:null, construction:'Steel Frame', epc_rating:'B', epc_score:72, energy_intensity_kwh:145, carbon_intensity_kgco2:55, scope1_tco2e:320, scope2_tco2e_location:4100, scope2_tco2e_market:3600, renewable_share_pct:12, energy_source_mix:{grid:70,gas:15,solar:8,wind:2,district:5}, water_intensity_l_m2:1.6, waste_diversion_rate_pct:68, gav_usd_mn:920, noi_usd_mn:46.0, occupancy_pct:91, wault_years:5.1, rent_psf_usd:8.5, green_lease_pct:35, tenant_satisfaction_score:7.0, certifications:[{scheme:'LEED',level:'Gold',year:2015,expiry:2030,score:70}], gresb_scores:{leadership:14,policies:13,riskMgmt:15,monitoring:12,stakeholder:11,performance:13,certifications:10}, gresb_history:[{year:2022,total:60},{year:2023,total:65},{year:2024,total:70},{year:2025,total:74},{year:2026,total:78}], peer_group:'Office APAC', physicalRisk:{flood:60,cyclone:20,wildfire:5,heatwave:45,drought:30,sealevel:50}, floodZone:'AE', elevation_m:4, coastal_distance_km:25, insuranceRiskScore:58, insurance_premium_usd:1350000, building_resilience_score:62, renovation:[{measure:'LED Lighting',cost_usd_mn:0.5,savings_kwh_pct:10,payback_years:2.0,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:3.0,savings_kwh_pct:16,payback_years:5.0,carbon_reduction_pct:12},{measure:'Envelope',cost_usd_mn:4.5,savings_kwh_pct:14,payback_years:7.5,carbon_reduction_pct:11},{measure:'Solar PV',cost_usd_mn:2.2,savings_kwh_pct:12,payback_years:5.5,carbon_reduction_pct:10},{measure:'BMS',cost_usd_mn:1.0,savings_kwh_pct:7,payback_years:3.8,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.5,savings_kwh_pct:0,payback_years:7.5,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:1.5,savings_kwh_pct:4,payback_years:11,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.8,savings_kwh_pct:5,payback_years:8.5,carbon_reduction_pct:4}] },
  { id:'P32', name:'Maple Logistics Hub', type:'Logistics', city:'Toronto', country:'CAN', countryCode:'CA', lat:43.653, lon:-79.383, gfa_m2:55000, nla_m2:52000, floors:3, year_built:2019, year_renovated:null, construction:'Steel Frame', epc_rating:'B', epc_score:76, energy_intensity_kwh:28, carbon_intensity_kgco2:12, scope1_tco2e:90, scope2_tco2e_location:580, scope2_tco2e_market:450, renewable_share_pct:30, energy_source_mix:{grid:50,gas:10,solar:20,wind:10,district:10}, water_intensity_l_m2:0.6, waste_diversion_rate_pct:85, gav_usd_mn:210, noi_usd_mn:14.7, occupancy_pct:98, wault_years:8.5, rent_psf_usd:9.2, green_lease_pct:70, tenant_satisfaction_score:8.0, certifications:[{scheme:'LEED',level:'Platinum',year:2020,expiry:2030,score:88}], gresb_scores:{leadership:17,policies:16,riskMgmt:17,monitoring:15,stakeholder:14,performance:16,certifications:15}, gresb_history:[{year:2022,total:78},{year:2023,total:82},{year:2024,total:86},{year:2025,total:89},{year:2026,total:92}], peer_group:'Logistics Americas', physicalRisk:{flood:35,cyclone:5,wildfire:8,heatwave:20,drought:15,sealevel:10}, floodZone:'X', elevation_m:76, coastal_distance_km:550, insuranceRiskScore:28, insurance_premium_usd:420000, building_resilience_score:82, renovation:[{measure:'LED Lighting',cost_usd_mn:0.3,savings_kwh_pct:15,payback_years:1.5,carbon_reduction_pct:10},{measure:'HVAC Upgrade',cost_usd_mn:1.2,savings_kwh_pct:12,payback_years:4.5,carbon_reduction_pct:9},{measure:'Solar PV',cost_usd_mn:2.0,savings_kwh_pct:20,payback_years:4.0,carbon_reduction_pct:15},{measure:'BMS',cost_usd_mn:0.6,savings_kwh_pct:8,payback_years:3.0,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:1.5,savings_kwh_pct:7,payback_years:7.0,carbon_reduction_pct:5}] },
  { id:'P33', name:'Riverside Medical Center', type:'Healthcare', city:'Chicago', country:'USA', countryCode:'US', lat:41.878, lon:-87.630, gfa_m2:45000, nla_m2:38000, floors:12, year_built:2005, year_renovated:2020, construction:'Reinforced Concrete', epc_rating:'C', epc_score:55, energy_intensity_kwh:195, carbon_intensity_kgco2:72, scope1_tco2e:510, scope2_tco2e_location:2900, scope2_tco2e_market:2400, renewable_share_pct:10, energy_source_mix:{grid:68,gas:22,solar:5,wind:0,district:5}, water_intensity_l_m2:3.2, waste_diversion_rate_pct:58, gav_usd_mn:380, noi_usd_mn:22.8, occupancy_pct:95, wault_years:7.0, rent_psf_usd:42, green_lease_pct:20, tenant_satisfaction_score:7.5, certifications:[], gresb_scores:{leadership:10,policies:10,riskMgmt:12,monitoring:9,stakeholder:8,performance:10,certifications:5}, gresb_history:[{year:2022,total:42},{year:2023,total:48},{year:2024,total:54},{year:2025,total:60},{year:2026,total:65}], peer_group:'Healthcare Americas', physicalRisk:{flood:40,cyclone:8,wildfire:3,heatwave:30,drought:20,sealevel:15}, floodZone:'X', elevation_m:180, coastal_distance_km:900, insuranceRiskScore:35, insurance_premium_usd:680000, building_resilience_score:55, renovation:[{measure:'LED Lighting',cost_usd_mn:0.4,savings_kwh_pct:10,payback_years:2.2,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:3.5,savings_kwh_pct:20,payback_years:5.8,carbon_reduction_pct:16},{measure:'Envelope',cost_usd_mn:4.0,savings_kwh_pct:12,payback_years:8.0,carbon_reduction_pct:10},{measure:'Solar PV',cost_usd_mn:1.8,savings_kwh_pct:8,payback_years:6.5,carbon_reduction_pct:7},{measure:'BMS',cost_usd_mn:1.2,savings_kwh_pct:9,payback_years:3.5,carbon_reduction_pct:6},{measure:'EV Charging',cost_usd_mn:0.5,savings_kwh_pct:0,payback_years:8,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:1.6,savings_kwh_pct:4,payback_years:12,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.8,savings_kwh_pct:5,payback_years:9,carbon_reduction_pct:4}] },
  { id:'P34', name:'Bangsar South Retail', type:'Retail', city:'Kuala Lumpur', country:'MYS', countryCode:'MY', lat:3.110, lon:101.671, gfa_m2:38000, nla_m2:32000, floors:6, year_built:2016, year_renovated:null, construction:'Reinforced Concrete', epc_rating:'B', epc_score:70, energy_intensity_kwh:160, carbon_intensity_kgco2:58, scope1_tco2e:250, scope2_tco2e_location:2050, scope2_tco2e_market:1800, renewable_share_pct:18, energy_source_mix:{grid:60,gas:12,solar:15,wind:3,district:10}, water_intensity_l_m2:2.0, waste_diversion_rate_pct:72, gav_usd_mn:280, noi_usd_mn:19.6, occupancy_pct:89, wault_years:4.2, rent_psf_usd:6.8, green_lease_pct:40, tenant_satisfaction_score:7.3, certifications:[{scheme:'Green Mark',level:'Gold Plus',year:2017,expiry:2027,score:78}], gresb_scores:{leadership:13,policies:12,riskMgmt:14,monitoring:11,stakeholder:11,performance:12,certifications:10}, gresb_history:[{year:2022,total:58},{year:2023,total:63},{year:2024,total:68},{year:2025,total:72},{year:2026,total:76}], peer_group:'Retail APAC', physicalRisk:{flood:55,cyclone:15,wildfire:5,heatwave:70,drought:25,sealevel:40}, floodZone:'AE', elevation_m:22, coastal_distance_km:40, insuranceRiskScore:52, insurance_premium_usd:520000, building_resilience_score:60, renovation:[{measure:'LED Lighting',cost_usd_mn:0.3,savings_kwh_pct:12,payback_years:1.8,carbon_reduction_pct:8},{measure:'HVAC Upgrade',cost_usd_mn:2.0,savings_kwh_pct:18,payback_years:5.0,carbon_reduction_pct:14},{measure:'Solar PV',cost_usd_mn:1.5,savings_kwh_pct:14,payback_years:4.5,carbon_reduction_pct:11},{measure:'BMS',cost_usd_mn:0.7,savings_kwh_pct:7,payback_years:3.2,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:1.2,savings_kwh_pct:5,payback_years:8,carbon_reduction_pct:4}] },
  { id:'P35', name:'Stockholm Data Vault', type:'DataCentre', city:'Stockholm', country:'SWE', countryCode:'SE', lat:59.329, lon:18.069, gfa_m2:25000, nla_m2:20000, floors:4, year_built:2020, year_renovated:null, construction:'Reinforced Concrete', epc_rating:'A', epc_score:90, energy_intensity_kwh:200, carbon_intensity_kgco2:18, scope1_tco2e:50, scope2_tco2e_location:450, scope2_tco2e_market:200, renewable_share_pct:85, energy_source_mix:{grid:15,gas:0,solar:10,wind:40,district:35}, water_intensity_l_m2:5.0, waste_diversion_rate_pct:92, gav_usd_mn:520, noi_usd_mn:41.6, occupancy_pct:100, wault_years:10.0, rent_psf_usd:120, green_lease_pct:90, tenant_satisfaction_score:9.0, certifications:[{scheme:'BREEAM',level:'Outstanding',year:2021,expiry:2031,score:95}], gresb_scores:{leadership:19,policies:18,riskMgmt:19,monitoring:17,stakeholder:16,performance:18,certifications:17}, gresb_history:[{year:2022,total:88},{year:2023,total:91},{year:2024,total:93},{year:2025,total:95},{year:2026,total:97}], peer_group:'DataCentre Europe', physicalRisk:{flood:20,cyclone:2,wildfire:5,heatwave:10,drought:8,sealevel:15}, floodZone:'X', elevation_m:28, coastal_distance_km:5, insuranceRiskScore:18, insurance_premium_usd:980000, building_resilience_score:92, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:5,payback_years:2.5,carbon_reduction_pct:3},{measure:'HVAC Upgrade',cost_usd_mn:2.5,savings_kwh_pct:10,payback_years:6.0,carbon_reduction_pct:8},{measure:'Solar PV',cost_usd_mn:1.5,savings_kwh_pct:8,payback_years:5.0,carbon_reduction_pct:6},{measure:'BMS',cost_usd_mn:0.8,savings_kwh_pct:6,payback_years:3.5,carbon_reduction_pct:4},{measure:'Battery Storage',cost_usd_mn:3.0,savings_kwh_pct:10,payback_years:7.0,carbon_reduction_pct:7}] },
];

/* ───────────────────── DEFAULT RE PORTFOLIO (30 PROPERTIES) ───────────────────── */
const DEFAULT_RE_PORTFOLIO = {
  portfolioName: 'AA Impact RE Fund I', currency: 'USD', lastUpdated: '2026-03-25',
  properties: [
    { id:'P01', name:'One Canada Square', type:'Office', city:'London', country:'GBR', countryCode:'GB', lat:51.505, lon:-0.020, gfa_m2:111480, nla_m2:95000, floors:50, year_built:1991, year_renovated:2018, construction:'Steel Frame', epc_rating:'C', epc_score:58, energy_intensity_kwh:185, carbon_intensity_kgco2:52, scope1_tco2e:420, scope2_tco2e_location:5380, scope2_tco2e_market:4200, renewable_share_pct:15, energy_source_mix:{grid:65,gas:20,solar:8,wind:0,district:7}, water_intensity_l_m2:1.8, waste_diversion_rate_pct:72, gav_usd_mn:1250, noi_usd_mn:62.5, occupancy_pct:92, wault_years:4.8, rent_psf_usd:68, green_lease_pct:45, tenant_satisfaction_score:7.2, certifications:[{scheme:'BREEAM',level:'Very Good',year:2022,expiry:2027,score:62}], gresb_scores:{leadership:15,policies:14,riskMgmt:16,monitoring:13,stakeholder:12,performance:14,certifications:11}, gresb_history:[{year:2022,total:62},{year:2023,total:68},{year:2024,total:73},{year:2025,total:78},{year:2026,total:82}], peer_group:'Office Global', physicalRisk:{flood:55,cyclone:12,wildfire:8,heatwave:35,drought:28,sealevel:55}, floodZone:'AE', elevation_m:4, coastal_distance_km:12, insuranceRiskScore:62, insurance_premium_usd:1850000, building_resilience_score:58, renovation:[{measure:'LED Lighting',cost_usd_mn:0.8,savings_kwh_pct:12,payback_years:2.1,carbon_reduction_pct:8},{measure:'HVAC Upgrade',cost_usd_mn:3.2,savings_kwh_pct:18,payback_years:5.5,carbon_reduction_pct:14},{measure:'Envelope',cost_usd_mn:5.1,savings_kwh_pct:15,payback_years:8.2,carbon_reduction_pct:12},{measure:'Solar PV',cost_usd_mn:2.4,savings_kwh_pct:10,payback_years:6.0,carbon_reduction_pct:9},{measure:'BMS',cost_usd_mn:1.1,savings_kwh_pct:8,payback_years:3.5,carbon_reduction_pct:6},{measure:'EV Charging',cost_usd_mn:0.6,savings_kwh_pct:0,payback_years:7.0,carbon_reduction_pct:2},{measure:'Green Roof',cost_usd_mn:1.8,savings_kwh_pct:5,payback_years:12,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:2.0,savings_kwh_pct:6,payback_years:9,carbon_reduction_pct:5}] },
    { id:'P02', name:'Tour La D\u00e9fense', type:'Office', city:'Paris', country:'FRA', countryCode:'FR', lat:48.892, lon:2.236, gfa_m2:90000, nla_m2:76000, floors:38, year_built:1973, year_renovated:2015, construction:'Reinforced Concrete', epc_rating:'D', epc_score:42, energy_intensity_kwh:220, carbon_intensity_kgco2:68, scope1_tco2e:580, scope2_tco2e_location:5540, scope2_tco2e_market:4100, renewable_share_pct:8, energy_source_mix:{grid:72,gas:18,solar:2,wind:0,district:8}, water_intensity_l_m2:2.1, waste_diversion_rate_pct:65, gav_usd_mn:890, noi_usd_mn:40.1, occupancy_pct:88, wault_years:3.5, rent_psf_usd:52, green_lease_pct:30, tenant_satisfaction_score:6.5, certifications:[{scheme:'HQE',level:'Good',year:2020,expiry:2025,score:55}], gresb_scores:{leadership:12,policies:11,riskMgmt:13,monitoring:10,stakeholder:10,performance:11,certifications:8}, gresb_history:[{year:2022,total:52},{year:2023,total:56},{year:2024,total:62},{year:2025,total:68},{year:2026,total:72}], peer_group:'Office Europe', physicalRisk:{flood:52,cyclone:10,wildfire:45,heatwave:55,drought:45,sealevel:35}, floodZone:'X', elevation_m:35, coastal_distance_km:180, insuranceRiskScore:48, insurance_premium_usd:1120000, building_resilience_score:52, renovation:[{measure:'LED Lighting',cost_usd_mn:0.6,savings_kwh_pct:14,payback_years:1.8,carbon_reduction_pct:10},{measure:'HVAC Upgrade',cost_usd_mn:4.5,savings_kwh_pct:22,payback_years:5.2,carbon_reduction_pct:18},{measure:'Envelope',cost_usd_mn:7.2,savings_kwh_pct:20,payback_years:7.5,carbon_reduction_pct:16},{measure:'Solar PV',cost_usd_mn:1.8,savings_kwh_pct:8,payback_years:6.5,carbon_reduction_pct:7},{measure:'BMS',cost_usd_mn:1.5,savings_kwh_pct:10,payback_years:3.2,carbon_reduction_pct:8},{measure:'EV Charging',cost_usd_mn:0.4,savings_kwh_pct:0,payback_years:8,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:2.2,savings_kwh_pct:4,payback_years:14,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.5,savings_kwh_pct:5,payback_years:10,carbon_reduction_pct:4}] },
    { id:'P03', name:'Marina One', type:'Office', city:'Singapore', country:'SGP', countryCode:'SG', lat:1.276, lon:103.854, gfa_m2:92000, nla_m2:78000, floors:34, year_built:2017, year_renovated:null, construction:'Steel Frame', epc_rating:'A', epc_score:88, energy_intensity_kwh:125, carbon_intensity_kgco2:42, scope1_tco2e:180, scope2_tco2e_location:3680, scope2_tco2e_market:3200, renewable_share_pct:22, energy_source_mix:{grid:58,gas:12,solar:18,wind:0,district:12}, water_intensity_l_m2:1.4, waste_diversion_rate_pct:82, gav_usd_mn:1680, noi_usd_mn:84.0, occupancy_pct:96, wault_years:6.2, rent_psf_usd:12.5, green_lease_pct:65, tenant_satisfaction_score:8.1, certifications:[{scheme:'Green Mark',level:'Platinum',year:2017,expiry:2027,score:92},{scheme:'LEED',level:'Gold',year:2018,expiry:2028,score:72}], gresb_scores:{leadership:18,policies:17,riskMgmt:18,monitoring:16,stakeholder:15,performance:17,certifications:16}, gresb_history:[{year:2022,total:82},{year:2023,total:86},{year:2024,total:90},{year:2025,total:92},{year:2026,total:94}], peer_group:'Office APAC', physicalRisk:{flood:48,cyclone:15,wildfire:5,heatwave:78,drought:18,sealevel:82}, floodZone:'V', elevation_m:3, coastal_distance_km:1, insuranceRiskScore:72, insurance_premium_usd:2200000, building_resilience_score:78, renovation:[{measure:'LED Lighting',cost_usd_mn:0.5,savings_kwh_pct:8,payback_years:2.5,carbon_reduction_pct:6},{measure:'HVAC Upgrade',cost_usd_mn:2.8,savings_kwh_pct:12,payback_years:6.0,carbon_reduction_pct:10},{measure:'Solar PV',cost_usd_mn:3.0,savings_kwh_pct:15,payback_years:5.0,carbon_reduction_pct:12},{measure:'BMS',cost_usd_mn:0.9,savings_kwh_pct:6,payback_years:4.0,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:2.5,savings_kwh_pct:8,payback_years:7.5,carbon_reduction_pct:6}] },
    { id:'P04', name:'Frankfurt Skyline Tower', type:'Office', city:'Frankfurt', country:'DEU', countryCode:'DE', lat:50.110, lon:8.682, gfa_m2:72000, nla_m2:61000, floors:42, year_built:2008, year_renovated:2022, construction:'Steel Frame', epc_rating:'B', epc_score:75, energy_intensity_kwh:145, carbon_intensity_kgco2:44, scope1_tco2e:280, scope2_tco2e_location:2950, scope2_tco2e_market:2100, renewable_share_pct:28, energy_source_mix:{grid:52,gas:15,solar:12,wind:8,district:13}, water_intensity_l_m2:1.5, waste_diversion_rate_pct:78, gav_usd_mn:1020, noi_usd_mn:51.0, occupancy_pct:94, wault_years:5.5, rent_psf_usd:48, green_lease_pct:55, tenant_satisfaction_score:7.8, certifications:[{scheme:'DGNB',level:'Gold',year:2022,expiry:2032,score:78}], gresb_scores:{leadership:16,policies:15,riskMgmt:17,monitoring:14,stakeholder:13,performance:15,certifications:13}, gresb_history:[{year:2022,total:72},{year:2023,total:76},{year:2024,total:80},{year:2025,total:83},{year:2026,total:86}], peer_group:'Office Europe', physicalRisk:{flood:42,cyclone:5,wildfire:8,heatwave:38,drought:32,sealevel:15}, floodZone:'X', elevation_m:98, coastal_distance_km:400, insuranceRiskScore:32, insurance_premium_usd:920000, building_resilience_score:72, renovation:[{measure:'LED Lighting',cost_usd_mn:0.5,savings_kwh_pct:10,payback_years:2.2,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:3.0,savings_kwh_pct:15,payback_years:5.8,carbon_reduction_pct:12},{measure:'Envelope',cost_usd_mn:4.8,savings_kwh_pct:12,payback_years:8.5,carbon_reduction_pct:10},{measure:'Solar PV',cost_usd_mn:2.0,savings_kwh_pct:10,payback_years:5.5,carbon_reduction_pct:8},{measure:'BMS',cost_usd_mn:1.0,savings_kwh_pct:7,payback_years:3.5,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.5,savings_kwh_pct:0,payback_years:7.0,carbon_reduction_pct:2},{measure:'Green Roof',cost_usd_mn:1.5,savings_kwh_pct:4,payback_years:11,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.8,savings_kwh_pct:5,payback_years:8.5,carbon_reduction_pct:4}] },
    { id:'P05', name:'Hudson Yards West', type:'Office', city:'New York', country:'USA', countryCode:'US', lat:40.754, lon:-74.000, gfa_m2:120000, nla_m2:102000, floors:52, year_built:2019, year_renovated:null, construction:'Steel Frame', epc_rating:'A', epc_score:85, energy_intensity_kwh:130, carbon_intensity_kgco2:38, scope1_tco2e:350, scope2_tco2e_location:4200, scope2_tco2e_market:3500, renewable_share_pct:25, energy_source_mix:{grid:55,gas:12,solar:15,wind:5,district:13}, water_intensity_l_m2:1.3, waste_diversion_rate_pct:80, gav_usd_mn:2200, noi_usd_mn:110.0, occupancy_pct:95, wault_years:7.0, rent_psf_usd:85, green_lease_pct:72, tenant_satisfaction_score:8.5, certifications:[{scheme:'LEED',level:'Platinum',year:2019,expiry:2029,score:88}], gresb_scores:{leadership:18,policies:17,riskMgmt:18,monitoring:16,stakeholder:15,performance:17,certifications:16}, gresb_history:[{year:2022,total:82},{year:2023,total:85},{year:2024,total:88},{year:2025,total:91},{year:2026,total:93}], peer_group:'Office Americas', physicalRisk:{flood:58,cyclone:18,wildfire:5,heatwave:32,drought:15,sealevel:52}, floodZone:'AE', elevation_m:5, coastal_distance_km:2, insuranceRiskScore:58, insurance_premium_usd:3200000, building_resilience_score:82, renovation:[{measure:'LED Lighting',cost_usd_mn:0.7,savings_kwh_pct:8,payback_years:2.8,carbon_reduction_pct:5},{measure:'HVAC Upgrade',cost_usd_mn:4.0,savings_kwh_pct:14,payback_years:6.5,carbon_reduction_pct:10},{measure:'Solar PV',cost_usd_mn:3.5,savings_kwh_pct:12,payback_years:5.5,carbon_reduction_pct:10},{measure:'BMS',cost_usd_mn:1.2,savings_kwh_pct:6,payback_years:4.5,carbon_reduction_pct:4},{measure:'Battery Storage',cost_usd_mn:2.8,savings_kwh_pct:7,payback_years:8.0,carbon_reduction_pct:5}] },
    { id:'P06', name:'Ginza Retail Tower', type:'Retail', city:'Tokyo', country:'JPN', countryCode:'JP', lat:35.672, lon:139.765, gfa_m2:28000, nla_m2:23000, floors:10, year_built:2012, year_renovated:2020, construction:'Steel Frame', epc_rating:'B', epc_score:72, energy_intensity_kwh:155, carbon_intensity_kgco2:48, scope1_tco2e:180, scope2_tco2e_location:1250, scope2_tco2e_market:1000, renewable_share_pct:18, energy_source_mix:{grid:62,gas:15,solar:10,wind:3,district:10}, water_intensity_l_m2:1.9, waste_diversion_rate_pct:88, gav_usd_mn:650, noi_usd_mn:32.5, occupancy_pct:97, wault_years:5.8, rent_psf_usd:55, green_lease_pct:50, tenant_satisfaction_score:7.9, certifications:[{scheme:'CASBEE',level:'S',year:2020,expiry:2030,score:82}], gresb_scores:{leadership:16,policies:15,riskMgmt:16,monitoring:14,stakeholder:13,performance:15,certifications:14}, gresb_history:[{year:2022,total:68},{year:2023,total:72},{year:2024,total:76},{year:2025,total:80},{year:2026,total:84}], peer_group:'Retail APAC', physicalRisk:{flood:40,cyclone:35,wildfire:5,heatwave:42,drought:18,sealevel:45}, floodZone:'AE', elevation_m:6, coastal_distance_km:8, insuranceRiskScore:55, insurance_premium_usd:1100000, building_resilience_score:72, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:10,payback_years:1.8,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:1.8,savings_kwh_pct:16,payback_years:5.0,carbon_reduction_pct:12},{measure:'Envelope',cost_usd_mn:2.5,savings_kwh_pct:12,payback_years:7.0,carbon_reduction_pct:9},{measure:'Solar PV',cost_usd_mn:1.2,savings_kwh_pct:8,payback_years:6.0,carbon_reduction_pct:6},{measure:'BMS',cost_usd_mn:0.7,savings_kwh_pct:7,payback_years:3.2,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.3,savings_kwh_pct:0,payback_years:7.5,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:1.0,savings_kwh_pct:4,payback_years:10,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.2,savings_kwh_pct:5,payback_years:8,carbon_reduction_pct:4}] },
    { id:'P07', name:'Sydney Industrial Park', type:'Industrial', city:'Sydney', country:'AUS', countryCode:'AU', lat:-33.868, lon:151.209, gfa_m2:65000, nla_m2:60000, floors:2, year_built:2015, year_renovated:null, construction:'Steel Frame', epc_rating:'C', epc_score:62, energy_intensity_kwh:95, carbon_intensity_kgco2:32, scope1_tco2e:220, scope2_tco2e_location:1880, scope2_tco2e_market:1500, renewable_share_pct:20, energy_source_mix:{grid:58,gas:18,solar:15,wind:5,district:4}, water_intensity_l_m2:0.8, waste_diversion_rate_pct:75, gav_usd_mn:320, noi_usd_mn:22.4, occupancy_pct:100, wault_years:8.2, rent_psf_usd:8.5, green_lease_pct:55, tenant_satisfaction_score:7.5, certifications:[{scheme:'NABERS',level:'4 Star',year:2020,expiry:2025,score:68}], gresb_scores:{leadership:14,policies:13,riskMgmt:14,monitoring:12,stakeholder:11,performance:13,certifications:11}, gresb_history:[{year:2022,total:58},{year:2023,total:62},{year:2024,total:66},{year:2025,total:70},{year:2026,total:74}], peer_group:'Industrial APAC', physicalRisk:{flood:35,cyclone:22,wildfire:55,heatwave:62,drought:58,sealevel:30}, floodZone:'X', elevation_m:18, coastal_distance_km:8, insuranceRiskScore:52, insurance_premium_usd:580000, building_resilience_score:62, renovation:[{measure:'LED Lighting',cost_usd_mn:0.4,savings_kwh_pct:12,payback_years:1.6,carbon_reduction_pct:8},{measure:'HVAC Upgrade',cost_usd_mn:2.0,savings_kwh_pct:15,payback_years:5.0,carbon_reduction_pct:12},{measure:'Solar PV',cost_usd_mn:2.5,savings_kwh_pct:18,payback_years:4.0,carbon_reduction_pct:14},{measure:'BMS',cost_usd_mn:0.8,savings_kwh_pct:8,payback_years:3.0,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:2.0,savings_kwh_pct:8,payback_years:7.0,carbon_reduction_pct:6}] },
    { id:'P08', name:'Mumbai One BKC', type:'Office', city:'Mumbai', country:'IND', countryCode:'IN', lat:19.066, lon:72.867, gfa_m2:55000, nla_m2:46000, floors:28, year_built:2016, year_renovated:null, construction:'Reinforced Concrete', epc_rating:'B', epc_score:70, energy_intensity_kwh:140, carbon_intensity_kgco2:62, scope1_tco2e:350, scope2_tco2e_location:3100, scope2_tco2e_market:2800, renewable_share_pct:14, energy_source_mix:{grid:68,gas:14,solar:10,wind:2,district:6}, water_intensity_l_m2:2.2, waste_diversion_rate_pct:55, gav_usd_mn:480, noi_usd_mn:28.8, occupancy_pct:90, wault_years:4.5, rent_psf_usd:5.8, green_lease_pct:25, tenant_satisfaction_score:6.8, certifications:[{scheme:'IGBC',level:'Gold',year:2017,expiry:2027,score:72}], gresb_scores:{leadership:12,policies:11,riskMgmt:13,monitoring:10,stakeholder:10,performance:12,certifications:9}, gresb_history:[{year:2022,total:52},{year:2023,total:58},{year:2024,total:63},{year:2025,total:68},{year:2026,total:72}], peer_group:'Office APAC', physicalRisk:{flood:72,cyclone:45,wildfire:8,heatwave:82,drought:45,sealevel:60}, floodZone:'AE', elevation_m:8, coastal_distance_km:5, insuranceRiskScore:72, insurance_premium_usd:850000, building_resilience_score:48, renovation:[{measure:'LED Lighting',cost_usd_mn:0.3,savings_kwh_pct:12,payback_years:1.5,carbon_reduction_pct:8},{measure:'HVAC Upgrade',cost_usd_mn:2.5,savings_kwh_pct:18,payback_years:4.5,carbon_reduction_pct:14},{measure:'Envelope',cost_usd_mn:3.5,savings_kwh_pct:14,payback_years:7.0,carbon_reduction_pct:11},{measure:'Solar PV',cost_usd_mn:1.5,savings_kwh_pct:12,payback_years:4.0,carbon_reduction_pct:10},{measure:'BMS',cost_usd_mn:0.7,savings_kwh_pct:8,payback_years:3.0,carbon_reduction_pct:6},{measure:'EV Charging',cost_usd_mn:0.3,savings_kwh_pct:0,payback_years:6.0,carbon_reduction_pct:2},{measure:'Green Roof',cost_usd_mn:1.0,savings_kwh_pct:5,payback_years:8,carbon_reduction_pct:4},{measure:'Battery Storage',cost_usd_mn:1.2,savings_kwh_pct:6,payback_years:7,carbon_reduction_pct:5}] },
    { id:'P09', name:'S\u00e3o Paulo Centro Log', type:'Logistics', city:'S\u00e3o Paulo', country:'BRA', countryCode:'BR', lat:-23.550, lon:-46.634, gfa_m2:42000, nla_m2:40000, floors:1, year_built:2020, year_renovated:null, construction:'Steel Frame', epc_rating:'B', epc_score:74, energy_intensity_kwh:25, carbon_intensity_kgco2:8, scope1_tco2e:45, scope2_tco2e_location:310, scope2_tco2e_market:250, renewable_share_pct:45, energy_source_mix:{grid:35,gas:8,solar:30,wind:15,district:12}, water_intensity_l_m2:0.5, waste_diversion_rate_pct:80, gav_usd_mn:150, noi_usd_mn:12.0, occupancy_pct:100, wault_years:9.5, rent_psf_usd:5.2, green_lease_pct:60, tenant_satisfaction_score:7.8, certifications:[{scheme:'LEED',level:'Gold',year:2021,expiry:2031,score:75}], gresb_scores:{leadership:15,policies:14,riskMgmt:15,monitoring:13,stakeholder:12,performance:14,certifications:12}, gresb_history:[{year:2022,total:65},{year:2023,total:70},{year:2024,total:74},{year:2025,total:78},{year:2026,total:82}], peer_group:'Logistics Americas', physicalRisk:{flood:62,cyclone:12,wildfire:18,heatwave:52,drought:40,sealevel:20}, floodZone:'AE', elevation_m:760, coastal_distance_km:70, insuranceRiskScore:42, insurance_premium_usd:280000, building_resilience_score:68, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:15,payback_years:1.2,carbon_reduction_pct:10},{measure:'Solar PV',cost_usd_mn:1.8,savings_kwh_pct:22,payback_years:3.5,carbon_reduction_pct:18},{measure:'BMS',cost_usd_mn:0.5,savings_kwh_pct:8,payback_years:2.5,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:1.5,savings_kwh_pct:10,payback_years:6.0,carbon_reduction_pct:8}] },
    { id:'P10', name:'Berlin Mixed Quarter', type:'Mixed', city:'Berlin', country:'DEU', countryCode:'DE', lat:52.520, lon:13.405, gfa_m2:48000, nla_m2:40000, floors:18, year_built:2021, year_renovated:null, construction:'CLT Timber', epc_rating:'A', epc_score:82, energy_intensity_kwh:85, carbon_intensity_kgco2:22, scope1_tco2e:120, scope2_tco2e_location:980, scope2_tco2e_market:650, renewable_share_pct:55, energy_source_mix:{grid:30,gas:5,solar:25,wind:20,district:20}, water_intensity_l_m2:1.0, waste_diversion_rate_pct:90, gav_usd_mn:580, noi_usd_mn:29.0, occupancy_pct:97, wault_years:7.5, rent_psf_usd:28, green_lease_pct:80, tenant_satisfaction_score:8.8, certifications:[{scheme:'DGNB',level:'Platinum',year:2021,expiry:2031,score:90}], gresb_scores:{leadership:19,policies:18,riskMgmt:18,monitoring:17,stakeholder:16,performance:18,certifications:17}, gresb_history:[{year:2022,total:85},{year:2023,total:88},{year:2024,total:91},{year:2025,total:93},{year:2026,total:95}], peer_group:'Mixed Europe', physicalRisk:{flood:38,cyclone:3,wildfire:8,heatwave:32,drought:28,sealevel:10}, floodZone:'X', elevation_m:34, coastal_distance_km:300, insuranceRiskScore:22, insurance_premium_usd:650000, building_resilience_score:88, renovation:[{measure:'LED Lighting',cost_usd_mn:0.3,savings_kwh_pct:8,payback_years:2.5,carbon_reduction_pct:5},{measure:'HVAC Upgrade',cost_usd_mn:1.8,savings_kwh_pct:10,payback_years:6.0,carbon_reduction_pct:8},{measure:'Solar PV',cost_usd_mn:2.0,savings_kwh_pct:12,payback_years:4.5,carbon_reduction_pct:10},{measure:'BMS',cost_usd_mn:0.7,savings_kwh_pct:6,payback_years:3.5,carbon_reduction_pct:4},{measure:'Battery Storage',cost_usd_mn:2.2,savings_kwh_pct:8,payback_years:7.0,carbon_reduction_pct:6}] },
    { id:'P11', name:'Dubai Marina Hotel', type:'Hotel', city:'Dubai', country:'ARE', countryCode:'AE', lat:25.080, lon:55.141, gfa_m2:35000, nla_m2:28000, floors:45, year_built:2018, year_renovated:null, construction:'Reinforced Concrete', epc_rating:'C', epc_score:55, energy_intensity_kwh:245, carbon_intensity_kgco2:78, scope1_tco2e:420, scope2_tco2e_location:2580, scope2_tco2e_market:2200, renewable_share_pct:10, energy_source_mix:{grid:72,gas:15,solar:8,wind:0,district:5}, water_intensity_l_m2:4.5, waste_diversion_rate_pct:52, gav_usd_mn:420, noi_usd_mn:25.2, occupancy_pct:82, wault_years:15.0, rent_psf_usd:35, green_lease_pct:15, tenant_satisfaction_score:7.0, certifications:[{scheme:'LEED',level:'Silver',year:2018,expiry:2028,score:58}], gresb_scores:{leadership:10,policies:10,riskMgmt:12,monitoring:9,stakeholder:8,performance:10,certifications:8}, gresb_history:[{year:2022,total:45},{year:2023,total:50},{year:2024,total:55},{year:2025,total:60},{year:2026,total:65}], peer_group:'Hotel MENA', physicalRisk:{flood:30,cyclone:15,wildfire:5,heatwave:95,drought:90,sealevel:42}, floodZone:'AE', elevation_m:2, coastal_distance_km:0.5, insuranceRiskScore:62, insurance_premium_usd:780000, building_resilience_score:52, renovation:[{measure:'LED Lighting',cost_usd_mn:0.3,savings_kwh_pct:8,payback_years:2.0,carbon_reduction_pct:5},{measure:'HVAC Upgrade',cost_usd_mn:3.5,savings_kwh_pct:20,payback_years:5.0,carbon_reduction_pct:16},{measure:'Envelope',cost_usd_mn:4.0,savings_kwh_pct:15,payback_years:7.5,carbon_reduction_pct:12},{measure:'Solar PV',cost_usd_mn:2.5,savings_kwh_pct:12,payback_years:5.0,carbon_reduction_pct:10},{measure:'BMS',cost_usd_mn:1.0,savings_kwh_pct:8,payback_years:3.5,carbon_reduction_pct:6},{measure:'EV Charging',cost_usd_mn:0.4,savings_kwh_pct:0,payback_years:7,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:1.2,savings_kwh_pct:3,payback_years:12,carbon_reduction_pct:2},{measure:'Battery Storage',cost_usd_mn:2.0,savings_kwh_pct:6,payback_years:8,carbon_reduction_pct:5}] },
    { id:'P12', name:'Gangnam Office Tower', type:'Office', city:'Seoul', country:'KOR', countryCode:'KR', lat:37.498, lon:127.028, gfa_m2:62000, nla_m2:52000, floors:35, year_built:2010, year_renovated:2021, construction:'Reinforced Concrete', epc_rating:'B', epc_score:68, energy_intensity_kwh:158, carbon_intensity_kgco2:55, scope1_tco2e:310, scope2_tco2e_location:3200, scope2_tco2e_market:2600, renewable_share_pct:16, energy_source_mix:{grid:64,gas:16,solar:10,wind:4,district:6}, water_intensity_l_m2:1.7, waste_diversion_rate_pct:70, gav_usd_mn:780, noi_usd_mn:39.0, occupancy_pct:93, wault_years:4.8, rent_psf_usd:38, green_lease_pct:35, tenant_satisfaction_score:7.2, certifications:[{scheme:'G-SEED',level:'Grade 1',year:2021,expiry:2031,score:76}], gresb_scores:{leadership:14,policies:13,riskMgmt:15,monitoring:12,stakeholder:12,performance:14,certifications:11}, gresb_history:[{year:2022,total:62},{year:2023,total:67},{year:2024,total:71},{year:2025,total:76},{year:2026,total:80}], peer_group:'Office APAC', physicalRisk:{flood:42,cyclone:12,wildfire:8,heatwave:40,drought:22,sealevel:28}, floodZone:'X', elevation_m:22, coastal_distance_km:35, insuranceRiskScore:38, insurance_premium_usd:880000, building_resilience_score:65, renovation:[{measure:'LED Lighting',cost_usd_mn:0.4,savings_kwh_pct:10,payback_years:2.0,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:2.8,savings_kwh_pct:16,payback_years:5.5,carbon_reduction_pct:13},{measure:'Envelope',cost_usd_mn:4.2,savings_kwh_pct:14,payback_years:7.8,carbon_reduction_pct:11},{measure:'Solar PV',cost_usd_mn:1.8,savings_kwh_pct:10,payback_years:5.5,carbon_reduction_pct:8},{measure:'BMS',cost_usd_mn:0.9,savings_kwh_pct:7,payback_years:3.5,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.4,savings_kwh_pct:0,payback_years:7.5,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:1.3,savings_kwh_pct:4,payback_years:10,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.5,savings_kwh_pct:5,payback_years:8,carbon_reduction_pct:4}] },
    { id:'P13', name:'Amsterdam Zuid Residences', type:'Residential', city:'Amsterdam', country:'NLD', countryCode:'NL', lat:52.339, lon:4.872, gfa_m2:22000, nla_m2:19000, floors:12, year_built:2022, year_renovated:null, construction:'CLT Timber', epc_rating:'A', epc_score:92, energy_intensity_kwh:65, carbon_intensity_kgco2:12, scope1_tco2e:40, scope2_tco2e_location:240, scope2_tco2e_market:150, renewable_share_pct:68, energy_source_mix:{grid:22,gas:0,solar:30,wind:25,district:23}, water_intensity_l_m2:0.9, waste_diversion_rate_pct:92, gav_usd_mn:280, noi_usd_mn:14.0, occupancy_pct:100, wault_years:10.0, rent_psf_usd:22, green_lease_pct:85, tenant_satisfaction_score:9.0, certifications:[{scheme:'BREEAM',level:'Outstanding',year:2022,expiry:2032,score:94}], gresb_scores:{leadership:19,policies:18,riskMgmt:18,monitoring:17,stakeholder:17,performance:18,certifications:17}, gresb_history:[{year:2022,total:88},{year:2023,total:90},{year:2024,total:92},{year:2025,total:94},{year:2026,total:96}], peer_group:'Residential Europe', physicalRisk:{flood:62,cyclone:5,wildfire:3,heatwave:25,drought:22,sealevel:72}, floodZone:'AE', elevation_m:-2, coastal_distance_km:50, insuranceRiskScore:55, insurance_premium_usd:380000, building_resilience_score:85, renovation:[{measure:'LED Lighting',cost_usd_mn:0.1,savings_kwh_pct:5,payback_years:3.0,carbon_reduction_pct:3},{measure:'Solar PV',cost_usd_mn:1.2,savings_kwh_pct:10,payback_years:5.0,carbon_reduction_pct:8},{measure:'BMS',cost_usd_mn:0.4,savings_kwh_pct:5,payback_years:4.0,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.5,savings_kwh_pct:8,payback_years:6.5,carbon_reduction_pct:6}] },
    { id:'P14', name:'Barcelona Retail Rambla', type:'Retail', city:'Barcelona', country:'ESP', countryCode:'ES', lat:41.381, lon:2.174, gfa_m2:18000, nla_m2:15000, floors:5, year_built:1998, year_renovated:2019, construction:'Reinforced Concrete', epc_rating:'C', epc_score:55, energy_intensity_kwh:175, carbon_intensity_kgco2:52, scope1_tco2e:150, scope2_tco2e_location:880, scope2_tco2e_market:720, renewable_share_pct:20, energy_source_mix:{grid:58,gas:15,solar:15,wind:5,district:7}, water_intensity_l_m2:2.0, waste_diversion_rate_pct:68, gav_usd_mn:220, noi_usd_mn:13.2, occupancy_pct:87, wault_years:3.8, rent_psf_usd:32, green_lease_pct:30, tenant_satisfaction_score:7.0, certifications:[], gresb_scores:{leadership:10,policies:9,riskMgmt:11,monitoring:8,stakeholder:8,performance:10,certifications:5}, gresb_history:[{year:2022,total:40},{year:2023,total:45},{year:2024,total:50},{year:2025,total:56},{year:2026,total:62}], peer_group:'Retail Europe', physicalRisk:{flood:35,cyclone:8,wildfire:42,heatwave:68,drought:58,sealevel:38}, floodZone:'X', elevation_m:12, coastal_distance_km:1, insuranceRiskScore:48, insurance_premium_usd:350000, building_resilience_score:52, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:12,payback_years:1.5,carbon_reduction_pct:8},{measure:'HVAC Upgrade',cost_usd_mn:1.5,savings_kwh_pct:18,payback_years:4.5,carbon_reduction_pct:14},{measure:'Envelope',cost_usd_mn:2.2,savings_kwh_pct:15,payback_years:7.0,carbon_reduction_pct:12},{measure:'Solar PV',cost_usd_mn:0.8,savings_kwh_pct:10,payback_years:4.5,carbon_reduction_pct:8},{measure:'BMS',cost_usd_mn:0.5,savings_kwh_pct:7,payback_years:3.0,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.2,savings_kwh_pct:0,payback_years:8,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:0.8,savings_kwh_pct:5,payback_years:9,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.0,savings_kwh_pct:5,payback_years:7,carbon_reduction_pct:4}] },
    { id:'P15', name:'Milano Centro Office', type:'Office', city:'Milan', country:'ITA', countryCode:'IT', lat:45.464, lon:9.190, gfa_m2:35000, nla_m2:29000, floors:15, year_built:2005, year_renovated:2020, construction:'Reinforced Concrete', epc_rating:'C', epc_score:60, energy_intensity_kwh:170, carbon_intensity_kgco2:50, scope1_tco2e:220, scope2_tco2e_location:1650, scope2_tco2e_market:1300, renewable_share_pct:18, energy_source_mix:{grid:60,gas:18,solar:12,wind:2,district:8}, water_intensity_l_m2:1.6, waste_diversion_rate_pct:70, gav_usd_mn:450, noi_usd_mn:22.5, occupancy_pct:91, wault_years:4.2, rent_psf_usd:42, green_lease_pct:35, tenant_satisfaction_score:7.2, certifications:[{scheme:'LEED',level:'Gold',year:2020,expiry:2030,score:72}], gresb_scores:{leadership:14,policies:13,riskMgmt:14,monitoring:12,stakeholder:11,performance:13,certifications:11}, gresb_history:[{year:2022,total:60},{year:2023,total:65},{year:2024,total:69},{year:2025,total:73},{year:2026,total:77}], peer_group:'Office Europe', physicalRisk:{flood:40,cyclone:5,wildfire:22,heatwave:58,drought:48,sealevel:25}, floodZone:'X', elevation_m:120, coastal_distance_km:120, insuranceRiskScore:35, insurance_premium_usd:580000, building_resilience_score:62, renovation:[{measure:'LED Lighting',cost_usd_mn:0.3,savings_kwh_pct:10,payback_years:2.0,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:2.2,savings_kwh_pct:16,payback_years:5.0,carbon_reduction_pct:13},{measure:'Envelope',cost_usd_mn:3.5,savings_kwh_pct:14,payback_years:7.5,carbon_reduction_pct:11},{measure:'Solar PV',cost_usd_mn:1.5,savings_kwh_pct:10,payback_years:5.0,carbon_reduction_pct:8},{measure:'BMS',cost_usd_mn:0.8,savings_kwh_pct:7,payback_years:3.2,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.3,savings_kwh_pct:0,payback_years:7,carbon_reduction_pct:2},{measure:'Green Roof',cost_usd_mn:1.2,savings_kwh_pct:5,payback_years:10,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.3,savings_kwh_pct:5,payback_years:8,carbon_reduction_pct:4}] },
    { id:'P16', name:'Z\u00fcrich Prime Tower', type:'Office', city:'Z\u00fcrich', country:'CHE', countryCode:'CH', lat:47.386, lon:8.519, gfa_m2:40000, nla_m2:34000, floors:36, year_built:2011, year_renovated:null, construction:'Steel Frame', epc_rating:'B', epc_score:78, energy_intensity_kwh:120, carbon_intensity_kgco2:28, scope1_tco2e:110, scope2_tco2e_location:1050, scope2_tco2e_market:650, renewable_share_pct:42, energy_source_mix:{grid:38,gas:8,solar:15,wind:12,district:27}, water_intensity_l_m2:1.2, waste_diversion_rate_pct:85, gav_usd_mn:850, noi_usd_mn:42.5, occupancy_pct:96, wault_years:6.0, rent_psf_usd:58, green_lease_pct:70, tenant_satisfaction_score:8.5, certifications:[{scheme:'DGNB',level:'Gold',year:2015,expiry:2025,score:80}], gresb_scores:{leadership:17,policies:16,riskMgmt:17,monitoring:15,stakeholder:14,performance:16,certifications:15}, gresb_history:[{year:2022,total:78},{year:2023,total:82},{year:2024,total:85},{year:2025,total:88},{year:2026,total:90}], peer_group:'Office Europe', physicalRisk:{flood:30,cyclone:2,wildfire:5,heatwave:28,drought:20,sealevel:5}, floodZone:'X', elevation_m:408, coastal_distance_km:500, insuranceRiskScore:18, insurance_premium_usd:720000, building_resilience_score:82, renovation:[{measure:'LED Lighting',cost_usd_mn:0.3,savings_kwh_pct:8,payback_years:2.5,carbon_reduction_pct:5},{measure:'HVAC Upgrade',cost_usd_mn:2.0,savings_kwh_pct:12,payback_years:6.0,carbon_reduction_pct:9},{measure:'Solar PV',cost_usd_mn:1.8,savings_kwh_pct:10,payback_years:5.5,carbon_reduction_pct:8},{measure:'BMS',cost_usd_mn:0.8,savings_kwh_pct:6,payback_years:4.0,carbon_reduction_pct:4},{measure:'Battery Storage',cost_usd_mn:2.0,savings_kwh_pct:7,payback_years:7.5,carbon_reduction_pct:5}] },
    { id:'P17', name:'Oslo Barcode Residential', type:'Residential', city:'Oslo', country:'NOR', countryCode:'NO', lat:59.907, lon:10.760, gfa_m2:18000, nla_m2:16000, floors:14, year_built:2019, year_renovated:null, construction:'CLT Timber', epc_rating:'A', epc_score:90, energy_intensity_kwh:55, carbon_intensity_kgco2:8, scope1_tco2e:18, scope2_tco2e_location:90, scope2_tco2e_market:50, renewable_share_pct:82, energy_source_mix:{grid:12,gas:0,solar:8,wind:35,district:45}, water_intensity_l_m2:0.8, waste_diversion_rate_pct:95, gav_usd_mn:320, noi_usd_mn:16.0, occupancy_pct:100, wault_years:12.0, rent_psf_usd:25, green_lease_pct:90, tenant_satisfaction_score:9.2, certifications:[{scheme:'BREEAM',level:'Outstanding',year:2019,expiry:2029,score:96},{scheme:'Svanen',level:'Nordic Swan',year:2019,expiry:2029,score:90}], gresb_scores:{leadership:20,policies:19,riskMgmt:19,monitoring:18,stakeholder:17,performance:19,certifications:18}, gresb_history:[{year:2022,total:92},{year:2023,total:94},{year:2024,total:95},{year:2025,total:96},{year:2026,total:97}], peer_group:'Residential Europe', physicalRisk:{flood:28,cyclone:5,wildfire:5,heatwave:12,drought:10,sealevel:35}, floodZone:'X', elevation_m:15, coastal_distance_km:5, insuranceRiskScore:22, insurance_premium_usd:280000, building_resilience_score:92, renovation:[{measure:'LED Lighting',cost_usd_mn:0.1,savings_kwh_pct:5,payback_years:3.0,carbon_reduction_pct:3},{measure:'Solar PV',cost_usd_mn:0.8,savings_kwh_pct:8,payback_years:5.5,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:1.2,savings_kwh_pct:6,payback_years:7.0,carbon_reduction_pct:4}] },
    { id:'P18', name:'HK Central Retail', type:'Retail', city:'Hong Kong', country:'HKG', countryCode:'HK', lat:22.282, lon:114.158, gfa_m2:15000, nla_m2:12000, floors:8, year_built:2000, year_renovated:2018, construction:'Reinforced Concrete', epc_rating:'C', epc_score:52, energy_intensity_kwh:195, carbon_intensity_kgco2:62, scope1_tco2e:130, scope2_tco2e_location:880, scope2_tco2e_market:750, renewable_share_pct:5, energy_source_mix:{grid:80,gas:12,solar:3,wind:0,district:5}, water_intensity_l_m2:2.5, waste_diversion_rate_pct:55, gav_usd_mn:520, noi_usd_mn:26.0, occupancy_pct:88, wault_years:3.5, rent_psf_usd:85, green_lease_pct:20, tenant_satisfaction_score:6.8, certifications:[], gresb_scores:{leadership:9,policies:8,riskMgmt:10,monitoring:7,stakeholder:7,performance:9,certifications:5}, gresb_history:[{year:2022,total:38},{year:2023,total:42},{year:2024,total:48},{year:2025,total:54},{year:2026,total:60}], peer_group:'Retail APAC', physicalRisk:{flood:52,cyclone:58,wildfire:5,heatwave:62,drought:15,sealevel:55}, floodZone:'V', elevation_m:3, coastal_distance_km:1, insuranceRiskScore:68, insurance_premium_usd:920000, building_resilience_score:48, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:10,payback_years:1.8,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:1.5,savings_kwh_pct:18,payback_years:4.5,carbon_reduction_pct:14},{measure:'Envelope',cost_usd_mn:2.0,savings_kwh_pct:12,payback_years:7.5,carbon_reduction_pct:10},{measure:'Solar PV',cost_usd_mn:0.5,savings_kwh_pct:5,payback_years:6.0,carbon_reduction_pct:4},{measure:'BMS',cost_usd_mn:0.5,savings_kwh_pct:7,payback_years:3.0,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.2,savings_kwh_pct:0,payback_years:8,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:0.6,savings_kwh_pct:3,payback_years:10,carbon_reduction_pct:2},{measure:'Battery Storage',cost_usd_mn:0.8,savings_kwh_pct:4,payback_years:7.5,carbon_reduction_pct:3}] },
    { id:'P19', name:'Auckland Viaduct Office', type:'Office', city:'Auckland', country:'NZL', countryCode:'NZ', lat:-36.843, lon:174.764, gfa_m2:30000, nla_m2:25000, floors:18, year_built:2014, year_renovated:null, construction:'Steel Frame', epc_rating:'B', epc_score:72, energy_intensity_kwh:135, carbon_intensity_kgco2:35, scope1_tco2e:120, scope2_tco2e_location:980, scope2_tco2e_market:780, renewable_share_pct:35, energy_source_mix:{grid:45,gas:10,solar:18,wind:15,district:12}, water_intensity_l_m2:1.3, waste_diversion_rate_pct:78, gav_usd_mn:350, noi_usd_mn:21.0, occupancy_pct:94, wault_years:5.5, rent_psf_usd:28, green_lease_pct:55, tenant_satisfaction_score:7.8, certifications:[{scheme:'Green Star',level:'5 Star',year:2015,expiry:2025,score:75}], gresb_scores:{leadership:15,policies:14,riskMgmt:15,monitoring:13,stakeholder:13,performance:14,certifications:13}, gresb_history:[{year:2022,total:68},{year:2023,total:72},{year:2024,total:76},{year:2025,total:80},{year:2026,total:83}], peer_group:'Office APAC', physicalRisk:{flood:45,cyclone:18,wildfire:15,heatwave:22,drought:18,sealevel:52}, floodZone:'AE', elevation_m:3, coastal_distance_km:2, insuranceRiskScore:48, insurance_premium_usd:480000, building_resilience_score:68, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:10,payback_years:2.0,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:1.5,savings_kwh_pct:14,payback_years:5.0,carbon_reduction_pct:11},{measure:'Solar PV',cost_usd_mn:1.2,savings_kwh_pct:12,payback_years:4.5,carbon_reduction_pct:10},{measure:'BMS',cost_usd_mn:0.5,savings_kwh_pct:7,payback_years:3.0,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:1.2,savings_kwh_pct:6,payback_years:7.0,carbon_reduction_pct:5}] },
    { id:'P20', name:'Bangkok Sathorn Hotel', type:'Hotel', city:'Bangkok', country:'THA', countryCode:'TH', lat:13.722, lon:100.529, gfa_m2:28000, nla_m2:22000, floors:32, year_built:2008, year_renovated:2019, construction:'Reinforced Concrete', epc_rating:'D', epc_score:40, energy_intensity_kwh:260, carbon_intensity_kgco2:85, scope1_tco2e:380, scope2_tco2e_location:2250, scope2_tco2e_market:2000, renewable_share_pct:8, energy_source_mix:{grid:75,gas:15,solar:5,wind:0,district:5}, water_intensity_l_m2:5.0, waste_diversion_rate_pct:45, gav_usd_mn:180, noi_usd_mn:10.8, occupancy_pct:78, wault_years:12.0, rent_psf_usd:15, green_lease_pct:10, tenant_satisfaction_score:6.2, certifications:[], gresb_scores:{leadership:8,policies:7,riskMgmt:9,monitoring:6,stakeholder:6,performance:8,certifications:4}, gresb_history:[{year:2022,total:32},{year:2023,total:38},{year:2024,total:44},{year:2025,total:50},{year:2026,total:55}], peer_group:'Hotel APAC', physicalRisk:{flood:78,cyclone:25,wildfire:5,heatwave:88,drought:35,sealevel:52}, floodZone:'AE', elevation_m:2, coastal_distance_km:30, insuranceRiskScore:72, insurance_premium_usd:420000, building_resilience_score:38, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:8,payback_years:1.8,carbon_reduction_pct:5},{measure:'HVAC Upgrade',cost_usd_mn:2.5,savings_kwh_pct:22,payback_years:4.5,carbon_reduction_pct:18},{measure:'Envelope',cost_usd_mn:3.0,savings_kwh_pct:14,payback_years:7.0,carbon_reduction_pct:11},{measure:'Solar PV',cost_usd_mn:1.2,savings_kwh_pct:8,payback_years:5.0,carbon_reduction_pct:7},{measure:'BMS',cost_usd_mn:0.6,savings_kwh_pct:8,payback_years:2.8,carbon_reduction_pct:6},{measure:'EV Charging',cost_usd_mn:0.2,savings_kwh_pct:0,payback_years:7,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:0.8,savings_kwh_pct:3,payback_years:10,carbon_reduction_pct:2},{measure:'Battery Storage',cost_usd_mn:1.0,savings_kwh_pct:5,payback_years:7.5,carbon_reduction_pct:4}] },
    { id:'P21', name:'Jakarta Sudirman Tower', type:'Office', city:'Jakarta', country:'IDN', countryCode:'ID', lat:-6.227, lon:106.808, gfa_m2:52000, nla_m2:44000, floors:38, year_built:2015, year_renovated:null, construction:'Reinforced Concrete', epc_rating:'C', epc_score:58, energy_intensity_kwh:175, carbon_intensity_kgco2:65, scope1_tco2e:380, scope2_tco2e_location:3200, scope2_tco2e_market:2800, renewable_share_pct:8, energy_source_mix:{grid:74,gas:14,solar:6,wind:0,district:6}, water_intensity_l_m2:2.0, waste_diversion_rate_pct:48, gav_usd_mn:320, noi_usd_mn:19.2, occupancy_pct:85, wault_years:4.0, rent_psf_usd:5.2, green_lease_pct:15, tenant_satisfaction_score:6.5, certifications:[{scheme:'Green Mark',level:'Gold',year:2016,expiry:2026,score:68}], gresb_scores:{leadership:10,policies:9,riskMgmt:11,monitoring:8,stakeholder:8,performance:10,certifications:7}, gresb_history:[{year:2022,total:42},{year:2023,total:48},{year:2024,total:53},{year:2025,total:58},{year:2026,total:64}], peer_group:'Office APAC', physicalRisk:{flood:82,cyclone:20,wildfire:5,heatwave:75,drought:25,sealevel:72}, floodZone:'V', elevation_m:5, coastal_distance_km:15, insuranceRiskScore:75, insurance_premium_usd:580000, building_resilience_score:42, renovation:[{measure:'LED Lighting',cost_usd_mn:0.3,savings_kwh_pct:10,payback_years:1.8,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:2.8,savings_kwh_pct:18,payback_years:5.0,carbon_reduction_pct:14},{measure:'Envelope',cost_usd_mn:3.8,savings_kwh_pct:14,payback_years:7.5,carbon_reduction_pct:11},{measure:'Solar PV',cost_usd_mn:1.5,savings_kwh_pct:10,payback_years:4.5,carbon_reduction_pct:8},{measure:'BMS',cost_usd_mn:0.7,savings_kwh_pct:8,payback_years:3.0,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.3,savings_kwh_pct:0,payback_years:7,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:0.8,savings_kwh_pct:4,payback_years:9,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.2,savings_kwh_pct:5,payback_years:7.5,carbon_reduction_pct:4}] },
    { id:'P22', name:'Manila BGC Office', type:'Office', city:'Manila', country:'PHL', countryCode:'PH', lat:14.551, lon:121.047, gfa_m2:38000, nla_m2:32000, floors:25, year_built:2017, year_renovated:null, construction:'Reinforced Concrete', epc_rating:'C', epc_score:55, energy_intensity_kwh:168, carbon_intensity_kgco2:60, scope1_tco2e:280, scope2_tco2e_location:2180, scope2_tco2e_market:1900, renewable_share_pct:10, energy_source_mix:{grid:72,gas:12,solar:8,wind:2,district:6}, water_intensity_l_m2:1.8, waste_diversion_rate_pct:50, gav_usd_mn:220, noi_usd_mn:13.2, occupancy_pct:88, wault_years:4.2, rent_psf_usd:5.0, green_lease_pct:18, tenant_satisfaction_score:6.5, certifications:[{scheme:'LEED',level:'Silver',year:2018,expiry:2028,score:55}], gresb_scores:{leadership:10,policies:9,riskMgmt:11,monitoring:8,stakeholder:8,performance:9,certifications:7}, gresb_history:[{year:2022,total:40},{year:2023,total:46},{year:2024,total:52},{year:2025,total:57},{year:2026,total:62}], peer_group:'Office APAC', physicalRisk:{flood:80,cyclone:75,wildfire:5,heatwave:72,drought:20,sealevel:65}, floodZone:'V', elevation_m:8, coastal_distance_km:12, insuranceRiskScore:82, insurance_premium_usd:480000, building_resilience_score:42, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:10,payback_years:1.5,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:2.0,savings_kwh_pct:16,payback_years:4.5,carbon_reduction_pct:12},{measure:'Envelope',cost_usd_mn:2.5,savings_kwh_pct:12,payback_years:7.0,carbon_reduction_pct:10},{measure:'Solar PV',cost_usd_mn:1.2,savings_kwh_pct:10,payback_years:4.0,carbon_reduction_pct:8},{measure:'BMS',cost_usd_mn:0.5,savings_kwh_pct:7,payback_years:2.8,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.2,savings_kwh_pct:0,payback_years:7,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:0.5,savings_kwh_pct:3,payback_years:8,carbon_reduction_pct:2},{measure:'Battery Storage',cost_usd_mn:0.8,savings_kwh_pct:4,payback_years:7,carbon_reduction_pct:3}] },
    { id:'P23', name:'Johannesburg Sandton Tower', type:'Office', city:'Johannesburg', country:'ZAF', countryCode:'ZA', lat:-26.107, lon:28.057, gfa_m2:42000, nla_m2:35000, floors:22, year_built:2013, year_renovated:null, construction:'Reinforced Concrete', epc_rating:'D', epc_score:45, energy_intensity_kwh:200, carbon_intensity_kgco2:80, scope1_tco2e:420, scope2_tco2e_location:3200, scope2_tco2e_market:2900, renewable_share_pct:6, energy_source_mix:{grid:78,gas:12,solar:5,wind:2,district:3}, water_intensity_l_m2:2.2, waste_diversion_rate_pct:42, gav_usd_mn:180, noi_usd_mn:10.8, occupancy_pct:82, wault_years:3.5, rent_psf_usd:8.5, green_lease_pct:12, tenant_satisfaction_score:6.0, certifications:[], gresb_scores:{leadership:8,policies:7,riskMgmt:9,monitoring:6,stakeholder:6,performance:7,certifications:4}, gresb_history:[{year:2022,total:30},{year:2023,total:35},{year:2024,total:42},{year:2025,total:48},{year:2026,total:54}], peer_group:'Office Africa', physicalRisk:{flood:35,cyclone:5,wildfire:18,heatwave:52,drought:65,sealevel:5}, floodZone:'X', elevation_m:1753, coastal_distance_km:500, insuranceRiskScore:42, insurance_premium_usd:320000, building_resilience_score:45, renovation:[{measure:'LED Lighting',cost_usd_mn:0.3,savings_kwh_pct:12,payback_years:1.5,carbon_reduction_pct:8},{measure:'HVAC Upgrade',cost_usd_mn:2.2,savings_kwh_pct:18,payback_years:4.5,carbon_reduction_pct:14},{measure:'Envelope',cost_usd_mn:3.0,savings_kwh_pct:14,payback_years:7.0,carbon_reduction_pct:11},{measure:'Solar PV',cost_usd_mn:1.8,savings_kwh_pct:15,payback_years:3.5,carbon_reduction_pct:12},{measure:'BMS',cost_usd_mn:0.6,savings_kwh_pct:8,payback_years:2.5,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.3,savings_kwh_pct:0,payback_years:8,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:0.8,savings_kwh_pct:4,payback_years:9,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.2,savings_kwh_pct:6,payback_years:6.5,carbon_reduction_pct:5}] },
    { id:'P24', name:'Mexico City Reforma Office', type:'Office', city:'Mexico City', country:'MEX', countryCode:'MX', lat:19.427, lon:-99.168, gfa_m2:45000, nla_m2:38000, floors:30, year_built:2016, year_renovated:null, construction:'Reinforced Concrete', epc_rating:'C', epc_score:58, energy_intensity_kwh:165, carbon_intensity_kgco2:55, scope1_tco2e:300, scope2_tco2e_location:2400, scope2_tco2e_market:2100, renewable_share_pct:12, energy_source_mix:{grid:68,gas:15,solar:10,wind:2,district:5}, water_intensity_l_m2:1.8, waste_diversion_rate_pct:52, gav_usd_mn:280, noi_usd_mn:16.8, occupancy_pct:87, wault_years:4.5, rent_psf_usd:18, green_lease_pct:22, tenant_satisfaction_score:6.8, certifications:[{scheme:'LEED',level:'Silver',year:2017,expiry:2027,score:58}], gresb_scores:{leadership:11,policies:10,riskMgmt:12,monitoring:9,stakeholder:9,performance:11,certifications:8}, gresb_history:[{year:2022,total:48},{year:2023,total:53},{year:2024,total:58},{year:2025,total:63},{year:2026,total:68}], peer_group:'Office Americas', physicalRisk:{flood:55,cyclone:12,wildfire:15,heatwave:45,drought:52,sealevel:5}, floodZone:'AE', elevation_m:2240, coastal_distance_km:350, insuranceRiskScore:52, insurance_premium_usd:420000, building_resilience_score:52, renovation:[{measure:'LED Lighting',cost_usd_mn:0.3,savings_kwh_pct:10,payback_years:1.8,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:2.5,savings_kwh_pct:16,payback_years:5.0,carbon_reduction_pct:12},{measure:'Envelope',cost_usd_mn:3.2,savings_kwh_pct:12,payback_years:7.5,carbon_reduction_pct:10},{measure:'Solar PV',cost_usd_mn:1.5,savings_kwh_pct:12,payback_years:4.0,carbon_reduction_pct:10},{measure:'BMS',cost_usd_mn:0.6,savings_kwh_pct:7,payback_years:3.0,carbon_reduction_pct:5},{measure:'EV Charging',cost_usd_mn:0.3,savings_kwh_pct:0,payback_years:7,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:0.8,savings_kwh_pct:4,payback_years:9,carbon_reduction_pct:3},{measure:'Battery Storage',cost_usd_mn:1.0,savings_kwh_pct:5,payback_years:7,carbon_reduction_pct:4}] },
    { id:'P25', name:'Santiago Las Condes Office', type:'Office', city:'Santiago', country:'CHL', countryCode:'CL', lat:-33.417, lon:-70.606, gfa_m2:32000, nla_m2:27000, floors:20, year_built:2018, year_renovated:null, construction:'Reinforced Concrete', epc_rating:'B', epc_score:70, energy_intensity_kwh:128, carbon_intensity_kgco2:32, scope1_tco2e:120, scope2_tco2e_location:950, scope2_tco2e_market:750, renewable_share_pct:30, energy_source_mix:{grid:48,gas:10,solar:20,wind:12,district:10}, water_intensity_l_m2:1.2, waste_diversion_rate_pct:72, gav_usd_mn:250, noi_usd_mn:15.0, occupancy_pct:92, wault_years:5.0, rent_psf_usd:15, green_lease_pct:42, tenant_satisfaction_score:7.5, certifications:[{scheme:'LEED',level:'Gold',year:2019,expiry:2029,score:74}], gresb_scores:{leadership:14,policies:13,riskMgmt:14,monitoring:12,stakeholder:11,performance:13,certifications:12}, gresb_history:[{year:2022,total:60},{year:2023,total:65},{year:2024,total:70},{year:2025,total:74},{year:2026,total:78}], peer_group:'Office Americas', physicalRisk:{flood:32,cyclone:5,wildfire:22,heatwave:35,drought:48,sealevel:25}, floodZone:'X', elevation_m:520, coastal_distance_km:100, insuranceRiskScore:35, insurance_premium_usd:350000, building_resilience_score:68, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:10,payback_years:1.8,carbon_reduction_pct:7},{measure:'HVAC Upgrade',cost_usd_mn:1.5,savings_kwh_pct:14,payback_years:5.0,carbon_reduction_pct:11},{measure:'Solar PV',cost_usd_mn:1.2,savings_kwh_pct:15,payback_years:3.5,carbon_reduction_pct:12},{measure:'BMS',cost_usd_mn:0.5,savings_kwh_pct:7,payback_years:3.0,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:1.0,savings_kwh_pct:6,payback_years:6.5,carbon_reduction_pct:5}] },
    { id:'P26', name:'Bogot\u00e1 Salitre Industrial', type:'Industrial', city:'Bogot\u00e1', country:'COL', countryCode:'CO', lat:4.638, lon:-74.082, gfa_m2:35000, nla_m2:32000, floors:2, year_built:2017, year_renovated:null, construction:'Steel Frame', epc_rating:'C', epc_score:60, energy_intensity_kwh:88, carbon_intensity_kgco2:28, scope1_tco2e:110, scope2_tco2e_location:920, scope2_tco2e_market:780, renewable_share_pct:20, energy_source_mix:{grid:58,gas:12,solar:15,wind:8,district:7}, water_intensity_l_m2:0.8, waste_diversion_rate_pct:62, gav_usd_mn:120, noi_usd_mn:8.4, occupancy_pct:95, wault_years:6.5, rent_psf_usd:4.5, green_lease_pct:28, tenant_satisfaction_score:7.0, certifications:[{scheme:'LEED',level:'Silver',year:2018,expiry:2028,score:56}], gresb_scores:{leadership:11,policies:10,riskMgmt:12,monitoring:9,stakeholder:9,performance:10,certifications:8}, gresb_history:[{year:2022,total:46},{year:2023,total:52},{year:2024,total:57},{year:2025,total:62},{year:2026,total:66}], peer_group:'Industrial Americas', physicalRisk:{flood:52,cyclone:5,wildfire:12,heatwave:28,drought:32,sealevel:5}, floodZone:'AE', elevation_m:2640, coastal_distance_km:600, insuranceRiskScore:32, insurance_premium_usd:220000, building_resilience_score:58, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:12,payback_years:1.2,carbon_reduction_pct:8},{measure:'HVAC Upgrade',cost_usd_mn:1.2,savings_kwh_pct:14,payback_years:4.0,carbon_reduction_pct:10},{measure:'Solar PV',cost_usd_mn:1.5,savings_kwh_pct:18,payback_years:3.5,carbon_reduction_pct:14},{measure:'BMS',cost_usd_mn:0.4,savings_kwh_pct:7,payback_years:2.5,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:1.0,savings_kwh_pct:6,payback_years:6.0,carbon_reduction_pct:5}] },
    { id:'P27', name:'Riyadh KAFD Tower', type:'Office', city:'Riyadh', country:'SAU', countryCode:'SA', lat:24.689, lon:46.685, gfa_m2:68000, nla_m2:58000, floors:45, year_built:2020, year_renovated:null, construction:'Steel Frame', epc_rating:'B', epc_score:72, energy_intensity_kwh:195, carbon_intensity_kgco2:72, scope1_tco2e:520, scope2_tco2e_location:4600, scope2_tco2e_market:4200, renewable_share_pct:12, energy_source_mix:{grid:70,gas:15,solar:10,wind:0,district:5}, water_intensity_l_m2:2.8, waste_diversion_rate_pct:45, gav_usd_mn:580, noi_usd_mn:29.0, occupancy_pct:88, wault_years:5.5, rent_psf_usd:22, green_lease_pct:18, tenant_satisfaction_score:7.0, certifications:[{scheme:'LEED',level:'Gold',year:2020,expiry:2030,score:72}], gresb_scores:{leadership:12,policies:11,riskMgmt:13,monitoring:10,stakeholder:10,performance:11,certifications:9}, gresb_history:[{year:2022,total:52},{year:2023,total:58},{year:2024,total:63},{year:2025,total:68},{year:2026,total:72}], peer_group:'Office MENA', physicalRisk:{flood:15,cyclone:5,wildfire:8,heatwave:98,drought:95,sealevel:5}, floodZone:'X', elevation_m:612, coastal_distance_km:400, insuranceRiskScore:28, insurance_premium_usd:850000, building_resilience_score:62, renovation:[{measure:'LED Lighting',cost_usd_mn:0.5,savings_kwh_pct:8,payback_years:2.5,carbon_reduction_pct:5},{measure:'HVAC Upgrade',cost_usd_mn:4.5,savings_kwh_pct:22,payback_years:5.0,carbon_reduction_pct:18},{measure:'Envelope',cost_usd_mn:5.5,savings_kwh_pct:15,payback_years:8.0,carbon_reduction_pct:12},{measure:'Solar PV',cost_usd_mn:3.5,savings_kwh_pct:15,payback_years:4.0,carbon_reduction_pct:12},{measure:'BMS',cost_usd_mn:1.2,savings_kwh_pct:8,payback_years:3.5,carbon_reduction_pct:6},{measure:'EV Charging',cost_usd_mn:0.5,savings_kwh_pct:0,payback_years:8,carbon_reduction_pct:1},{measure:'Green Roof',cost_usd_mn:1.5,savings_kwh_pct:3,payback_years:12,carbon_reduction_pct:2},{measure:'Battery Storage',cost_usd_mn:2.5,savings_kwh_pct:7,payback_years:8,carbon_reduction_pct:5}] },
    { id:'P28', name:'Stockholm Offices', type:'Office', city:'Stockholm', country:'SWE', countryCode:'SE', lat:59.329, lon:18.069, gfa_m2:28000, nla_m2:24000, floors:12, year_built:2020, year_renovated:null, construction:'CLT Timber', epc_rating:'A', epc_score:88, energy_intensity_kwh:78, carbon_intensity_kgco2:12, scope1_tco2e:35, scope2_tco2e_location:320, scope2_tco2e_market:180, renewable_share_pct:75, energy_source_mix:{grid:18,gas:0,solar:12,wind:35,district:35}, water_intensity_l_m2:0.9, waste_diversion_rate_pct:92, gav_usd_mn:380, noi_usd_mn:19.0, occupancy_pct:98, wault_years:8.0, rent_psf_usd:32, green_lease_pct:88, tenant_satisfaction_score:9.0, certifications:[{scheme:'BREEAM',level:'Outstanding',year:2020,expiry:2030,score:93},{scheme:'Svanen',level:'Nordic Swan',year:2020,expiry:2030,score:88}], gresb_scores:{leadership:19,policies:18,riskMgmt:18,monitoring:17,stakeholder:16,performance:18,certifications:17}, gresb_history:[{year:2022,total:86},{year:2023,total:89},{year:2024,total:92},{year:2025,total:94},{year:2026,total:96}], peer_group:'Office Europe', physicalRisk:{flood:22,cyclone:3,wildfire:5,heatwave:12,drought:8,sealevel:18}, floodZone:'X', elevation_m:28, coastal_distance_km:5, insuranceRiskScore:15, insurance_premium_usd:380000, building_resilience_score:90, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:5,payback_years:3.0,carbon_reduction_pct:3},{measure:'Solar PV',cost_usd_mn:1.0,savings_kwh_pct:8,payback_years:5.5,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:1.5,savings_kwh_pct:6,payback_years:7.0,carbon_reduction_pct:4}] },
    { id:'P29', name:'Colombo Industrial Estate', type:'Industrial', city:'Colombo', country:'LKA', countryCode:'LK', lat:6.927, lon:79.861, gfa_m2:40000, nla_m2:37000, floors:2, year_built:2018, year_renovated:null, construction:'Steel Frame', epc_rating:'D', epc_score:38, energy_intensity_kwh:110, carbon_intensity_kgco2:42, scope1_tco2e:200, scope2_tco2e_location:1580, scope2_tco2e_market:1400, renewable_share_pct:8, energy_source_mix:{grid:75,gas:12,solar:8,wind:2,district:3}, water_intensity_l_m2:1.0, waste_diversion_rate_pct:38, gav_usd_mn:85, noi_usd_mn:5.9, occupancy_pct:90, wault_years:5.0, rent_psf_usd:3.2, green_lease_pct:8, tenant_satisfaction_score:5.8, certifications:[], gresb_scores:{leadership:6,policies:5,riskMgmt:7,monitoring:5,stakeholder:4,performance:6,certifications:3}, gresb_history:[{year:2022,total:22},{year:2023,total:28},{year:2024,total:34},{year:2025,total:40},{year:2026,total:46}], peer_group:'Industrial APAC', physicalRisk:{flood:72,cyclone:42,wildfire:8,heatwave:82,drought:35,sealevel:62}, floodZone:'V', elevation_m:2, coastal_distance_km:3, insuranceRiskScore:78, insurance_premium_usd:180000, building_resilience_score:32, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:12,payback_years:1.2,carbon_reduction_pct:8},{measure:'HVAC Upgrade',cost_usd_mn:1.5,savings_kwh_pct:15,payback_years:4.0,carbon_reduction_pct:12},{measure:'Solar PV',cost_usd_mn:1.5,savings_kwh_pct:18,payback_years:3.5,carbon_reduction_pct:14},{measure:'BMS',cost_usd_mn:0.4,savings_kwh_pct:8,payback_years:2.5,carbon_reduction_pct:5},{measure:'Battery Storage',cost_usd_mn:0.8,savings_kwh_pct:6,payback_years:5.5,carbon_reduction_pct:5}] },
    { id:'P30', name:'Perth Data Centre', type:'DataCentre', city:'Perth', country:'AUS', countryCode:'AU', lat:-31.950, lon:115.860, gfa_m2:20000, nla_m2:16000, floors:3, year_built:2021, year_renovated:null, construction:'Reinforced Concrete', epc_rating:'B', epc_score:75, energy_intensity_kwh:220, carbon_intensity_kgco2:55, scope1_tco2e:120, scope2_tco2e_location:1050, scope2_tco2e_market:850, renewable_share_pct:40, energy_source_mix:{grid:40,gas:5,solar:30,wind:15,district:10}, water_intensity_l_m2:4.5, waste_diversion_rate_pct:80, gav_usd_mn:320, noi_usd_mn:25.6, occupancy_pct:100, wault_years:10.0, rent_psf_usd:95, green_lease_pct:75, tenant_satisfaction_score:8.2, certifications:[{scheme:'NABERS',level:'5 Star',year:2022,expiry:2027,score:80},{scheme:'Green Star',level:'5 Star',year:2022,expiry:2032,score:78}], gresb_scores:{leadership:16,policies:15,riskMgmt:16,monitoring:14,stakeholder:14,performance:15,certifications:14}, gresb_history:[{year:2022,total:72},{year:2023,total:76},{year:2024,total:80},{year:2025,total:84},{year:2026,total:88}], peer_group:'DataCentre APAC', physicalRisk:{flood:18,cyclone:12,wildfire:62,heatwave:72,drought:75,sealevel:15}, floodZone:'X', elevation_m:25, coastal_distance_km:15, insuranceRiskScore:48, insurance_premium_usd:680000, building_resilience_score:72, renovation:[{measure:'LED Lighting',cost_usd_mn:0.2,savings_kwh_pct:5,payback_years:2.5,carbon_reduction_pct:3},{measure:'HVAC Upgrade',cost_usd_mn:2.0,savings_kwh_pct:12,payback_years:5.5,carbon_reduction_pct:10},{measure:'Solar PV',cost_usd_mn:2.5,savings_kwh_pct:18,payback_years:3.5,carbon_reduction_pct:14},{measure:'BMS',cost_usd_mn:0.8,savings_kwh_pct:6,payback_years:3.5,carbon_reduction_pct:4},{measure:'Battery Storage',cost_usd_mn:2.5,savings_kwh_pct:10,payback_years:6.0,carbon_reduction_pct:8}] },
  ],
};

const LS_KEY = 'ra_re_portfolio_v1';
function loadPortfolio() {
  try { const d = JSON.parse(localStorage.getItem(LS_KEY)); if (d && d.properties && d.properties.length >= 30) return d; } catch {}
  localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_RE_PORTFOLIO));
  return DEFAULT_RE_PORTFOLIO;
}

/* ───────────────────── HELPERS ───────────────────── */
const fmt = (n,d=0) => n == null ? '-' : Number(n).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtPct = n => n == null ? '-' : `${Number(n).toFixed(1)}%`;
const fmtMn = n => n == null ? '-' : `$${Number(n).toFixed(1)}Mn`;

const PATHWAY_YEARS = [2020,2025,2030,2035,2040,2045,2050];

function getTypeKey(type) {
  if (['Industrial','Logistics'].includes(type)) return CRREM_PATHWAYS[type] ? type : 'Industrial';
  if (type === 'Hotel') return 'Hotel';
  if (type === 'DataCentre') return 'DataCentre';
  if (type === 'Mixed') return 'Mixed';
  if (type === 'Healthcare') return 'Healthcare';
  if (type === 'Residential') return 'Residential';
  if (type === 'Retail') return 'Retail';
  return 'Office';
}

function interpolatePathway(pathwayObj) {
  const pts = PATHWAY_YEARS.map(y => ({ year: y, val: pathwayObj[y] }));
  const result = [];
  for (let y = 2020; y <= 2050; y++) {
    const lower = pts.filter(p => p.year <= y).pop();
    const upper = pts.find(p => p.year >= y);
    if (!lower || !upper || lower.year === upper.year) { result.push({ year: y, val: lower ? lower.val : upper.val }); continue; }
    const frac = (y - lower.year) / (upper.year - lower.year);
    result.push({ year: y, val: lower.val + (upper.val - lower.val) * frac });
  }
  return result;
}

function computeStrandYear(carbonIntensity, typeKey, scenario) {
  const pw = CRREM_PATHWAYS[typeKey];
  if (!pw || !pw[scenario]) return '>2050';
  const path = interpolatePathway(pw[scenario]);
  for (const p of path) { if (carbonIntensity > p.val) return p.year; }
  return '>2050';
}

function makeDefaultProperty(type) {
  const defaults = { Office:{ei:150,ci:45,s1:300,s2l:3000,s2m:2500}, Retail:{ei:160,ci:48,s1:200,s2l:1500,s2m:1200}, Industrial:{ei:80,ci:28,s1:150,s2l:1200,s2m:1000}, Logistics:{ei:28,ci:10,s1:60,s2l:400,s2m:300}, Residential:{ei:60,ci:15,s1:40,s2l:300,s2m:200}, Hotel:{ei:240,ci:75,s1:350,s2l:2200,s2m:1900}, DataCentre:{ei:210,ci:50,s1:100,s2l:900,s2m:700}, Mixed:{ei:90,ci:25,s1:120,s2l:1000,s2m:700}, Healthcare:{ei:190,ci:70,s1:500,s2l:2800,s2m:2400} };
  const d = defaults[type] || defaults.Office;
  return {
    id: 'P' + String(Date.now()).slice(-4), name: 'New Property', type, city: '', country: 'USA', countryCode: 'US', lat: 0, lon: 0,
    gfa_m2: 10000, nla_m2: 8500, floors: 10, year_built: 2020, year_renovated: null, construction: 'Reinforced Concrete',
    epc_rating: 'C', epc_score: 55, energy_intensity_kwh: d.ei, carbon_intensity_kgco2: d.ci,
    scope1_tco2e: d.s1, scope2_tco2e_location: d.s2l, scope2_tco2e_market: d.s2m,
    renewable_share_pct: 15, energy_source_mix: { grid: 60, gas: 15, solar: 10, wind: 5, district: 10 },
    water_intensity_l_m2: 1.5, waste_diversion_rate_pct: 60,
    gav_usd_mn: 100, noi_usd_mn: 7.0, occupancy_pct: 90, wault_years: 5.0, rent_psf_usd: 20, green_lease_pct: 30,
    tenant_satisfaction_score: 7.0,
    certifications: [],
    gresb_scores: { leadership:10, policies:10, riskMgmt:10, monitoring:10, stakeholder:10, performance:10, certifications:8 },
    gresb_history: [{year:2022,total:45},{year:2023,total:50},{year:2024,total:55},{year:2025,total:60},{year:2026,total:65}],
    peer_group: `${type} Global`,
    physicalRisk: { flood:30, cyclone:10, wildfire:10, heatwave:30, drought:20, sealevel:20 },
    floodZone: 'X', elevation_m: 50, coastal_distance_km: 100, insuranceRiskScore: 35, insurance_premium_usd: 500000, building_resilience_score: 55,
    renovation: [
      { measure:'LED Lighting', cost_usd_mn:0.3, savings_kwh_pct:10, payback_years:2.0, carbon_reduction_pct:7 },
      { measure:'HVAC Upgrade', cost_usd_mn:2.0, savings_kwh_pct:16, payback_years:5.0, carbon_reduction_pct:12 },
      { measure:'Envelope', cost_usd_mn:3.0, savings_kwh_pct:12, payback_years:7.5, carbon_reduction_pct:10 },
      { measure:'Solar PV', cost_usd_mn:1.5, savings_kwh_pct:12, payback_years:5.0, carbon_reduction_pct:9 },
      { measure:'BMS', cost_usd_mn:0.6, savings_kwh_pct:7, payback_years:3.0, carbon_reduction_pct:5 },
      { measure:'EV Charging', cost_usd_mn:0.3, savings_kwh_pct:0, payback_years:7.0, carbon_reduction_pct:1 },
      { measure:'Green Roof', cost_usd_mn:0.8, savings_kwh_pct:4, payback_years:10, carbon_reduction_pct:3 },
      { measure:'Battery Storage', cost_usd_mn:1.2, savings_kwh_pct:5, payback_years:7.5, carbon_reduction_pct:4 },
    ],
  };
}

const COLORS_8 = ['#1b3a5c','#c5a96a','#5a8a6a','#2c5a8c','#d97706','#dc2626','#7ba67d','#d4be8a'];
const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#2c5a8c','#d97706','#16a34a','#dc2626','#7c3aed','#7ba67d','#0d9488'];
const TYPE_FILTER = ['All','Office','Retail','Industrial','Logistics','Residential','Hotel','DataCentre','Mixed','Healthcare'];

/* ───────────────────── REUSABLE STYLE HELPERS ───────────────────── */
const card = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:16 };
const thS = { padding:'8px 10px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap' };
const tdS = { padding:'7px 10px', fontSize:12, color:T.text, borderBottom:`1px solid ${T.border}` };
const inputS = { width:'100%', padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, fontFamily:T.font, color:T.text, background:T.surface, outline:'none', boxSizing:'border-box' };
const selectS = { ...inputS, cursor:'pointer' };
const labelS = { display:'block', fontSize:11, fontWeight:600, color:T.textSec, marginBottom:3 };
const btnPrimary = { padding:'7px 16px', background:T.navy, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font };
const btnSecondary = { padding:'7px 16px', background:'transparent', color:T.navy, border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:T.font };
const btnDanger = { padding:'5px 12px', background:T.red, color:'#fff', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:T.font };
const badge = (bg, c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:bg, color:c });
const strandColor = sy => { const n = typeof sy === 'number' ? sy : 2051; return n <= 2030 ? T.red : n <= 2040 ? T.amber : T.green; };

/* ───────────────────── MAIN COMPONENT ───────────────────── */
export default function CRREMPage() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(() => loadPortfolio());
  const props = portfolio.properties;
  const [scenario, setScenario] = useState('1.5');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedProp, setSelectedProp] = useState('P01');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [activeTab, setActiveTab] = useState('analytics');
  const [renovToggles, setRenovToggles] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPropType, setNewPropType] = useState('Office');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkPreview, setBulkPreview] = useState(false);
  const [wiEnergy, setWiEnergy] = useState(null);
  const [wiRenewable, setWiRenewable] = useState(null);
  const [wiEpc, setWiEpc] = useState(null);

  /* Persist to localStorage on every portfolio change */
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(portfolio));
  }, [portfolio]);

  const updateProperty = useCallback((propId, field, value) => {
    setPortfolio(prev => ({
      ...prev,
      properties: prev.properties.map(p => p.id === propId ? { ...p, [field]: value } : p)
    }));
  }, []);

  const updateEnergyMix = useCallback((propId, source, value) => {
    setPortfolio(prev => ({
      ...prev,
      properties: prev.properties.map(p => {
        if (p.id !== propId) return p;
        const mix = { ...p.energy_source_mix };
        const clamped = Math.max(0, Math.min(100, Number(value) || 0));
        const oldVal = mix[source];
        mix[source] = clamped;
        const diff = clamped - oldVal;
        const others = Object.keys(mix).filter(k => k !== source);
        const othersTotal = others.reduce((s, k) => s + mix[k], 0);
        if (othersTotal > 0) {
          others.forEach(k => { mix[k] = Math.max(0, Math.round(mix[k] - diff * (mix[k] / othersTotal))); });
        }
        const total = Object.values(mix).reduce((s, v) => s + v, 0);
        if (total !== 100 && others.length > 0) {
          const adj = others.find(k => mix[k] > 0) || others[0];
          mix[adj] = Math.max(0, mix[adj] + (100 - total));
        }
        return { ...p, energy_source_mix: mix };
      })
    }));
  }, []);

  const addProperty = useCallback(() => {
    const np = makeDefaultProperty(newPropType);
    np.id = 'P' + String(props.length + 1).padStart(2, '0');
    np.name = 'New ' + newPropType + ' ' + np.id;
    setPortfolio(prev => ({ ...prev, properties: [...prev.properties, np] }));
    setSelectedProp(np.id);
    setShowAddForm(false);
    setActiveTab('editor');
  }, [newPropType, props.length]);

  const deleteProperty = useCallback((propId) => {
    setPortfolio(prev => ({ ...prev, properties: prev.properties.filter(p => p.id !== propId) }));
    setDeleteConfirm(null);
    if (selectedProp === propId) setSelectedProp(props[0]?.id || '');
  }, [selectedProp, props]);

  const bulkImport = useCallback(() => {
    const existing = new Set(props.map(p => p.id));
    const toAdd = BULK_IMPORT_PROPERTIES.filter(p => !existing.has(p.id));
    if (toAdd.length === 0) return;
    setPortfolio(prev => ({ ...prev, properties: [...prev.properties, ...toAdd] }));
    setBulkPreview(false);
  }, [props]);

  const filtered = useMemo(() => typeFilter === 'All' ? props : props.filter(p => p.type === typeFilter), [props, typeFilter]);
  const sel = useMemo(() => props.find(p => p.id === selectedProp) || props[0], [props, selectedProp]);

  /* KPIs */
  const kpis = useMemo(() => {
    const f = filtered;
    if (!f.length) return {};
    const avgEnergy = f.reduce((s,p) => s+p.energy_intensity_kwh,0)/f.length;
    const avgCarbon = f.reduce((s,p) => s+p.carbon_intensity_kgco2,0)/f.length;
    const totalGFA = f.reduce((s,p) => s+p.gfa_m2,0);
    const totalGAV = f.reduce((s,p) => s+p.gav_usd_mn,0);
    const totalS1 = f.reduce((s,p) => s+p.scope1_tco2e,0);
    const totalS2 = f.reduce((s,p) => s+p.scope2_tco2e_location,0);
    const avgRenewable = f.reduce((s,p) => s+p.renewable_share_pct,0)/f.length;
    const avgOccupancy = f.reduce((s,p) => s+p.occupancy_pct,0)/f.length;
    const avgGreenLease = f.reduce((s,p) => s+p.green_lease_pct,0)/f.length;
    const strandings = f.map(p => { const sy = computeStrandYear(p.carbon_intensity_kgco2, getTypeKey(p.type), scenario); return typeof sy === 'number' ? sy : 2051; });
    const avgStrand = strandings.reduce((s,v)=>s+v,0)/strandings.length;
    const strandBefore2030 = strandings.filter(s => s <= 2030).length;
    const totalNOI = f.reduce((s,p)=>s+p.noi_usd_mn,0);
    const avgWater = f.reduce((s,p)=>s+p.water_intensity_l_m2,0)/f.length;
    return { avgEnergy, avgCarbon, totalGFA, totalGAV, totalS1, totalS2, avgRenewable, avgOccupancy, avgGreenLease, avgStrand, strandBefore2030, totalNOI, count: f.length, avgWater };
  }, [filtered, scenario]);

  /* CRREM pathway chart data for selected property */
  const pathwayChartData = useMemo(() => {
    if (!sel) return [];
    const tk = getTypeKey(sel.type);
    const data = [];
    for (let y = 2020; y <= 2050; y++) {
      const row = { year: y };
      ['1.5','WB2','2.0'].forEach(sc => {
        const pw = CRREM_PATHWAYS[tk];
        if (pw && pw[sc]) {
          const path = interpolatePathway(pw[sc]);
          const pt = path.find(p => p.year === y);
          row[`path_${sc}`] = pt ? pt.val : null;
        }
      });
      const decline = sel.carbon_intensity_kgco2 * Math.pow(0.985, y - 2026);
      row.property = y >= 2026 ? decline : (y === 2025 ? sel.carbon_intensity_kgco2 : null);
      row.energyLine = y >= 2026 ? sel.energy_intensity_kwh * Math.pow(0.99, y - 2026) : (y === 2025 ? sel.energy_intensity_kwh : null);
      data.push(row);
    }
    return data;
  }, [sel]);

  /* Stranding cascade */
  const strandCascade = useMemo(() => {
    const buckets = { '<=2025':0, '2026-2030':0, '2031-2035':0, '2036-2040':0, '2041-2045':0, '2046-2050':0, '>2050':0 };
    filtered.forEach(p => {
      const sy = computeStrandYear(p.carbon_intensity_kgco2, getTypeKey(p.type), scenario);
      if (sy === '>2050') buckets['>2050']++;
      else if (sy <= 2025) buckets['<=2025']++;
      else if (sy <= 2030) buckets['2026-2030']++;
      else if (sy <= 2035) buckets['2031-2035']++;
      else if (sy <= 2040) buckets['2036-2040']++;
      else if (sy <= 2045) buckets['2041-2045']++;
      else buckets['2046-2050']++;
    });
    return Object.entries(buckets).map(([k,v]) => ({ period: k, count: v }));
  }, [filtered, scenario]);

  /* Sortable property table */
  const sortedTable = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const d = [...filtered].map(p => {
      const tk = getTypeKey(p.type);
      return { ...p, strandYear: computeStrandYear(p.carbon_intensity_kgco2, tk, scenario) };
    });
    d.sort((a,b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'strandYear') { va = va === '>2050' ? 2051 : va; vb = vb === '>2050' ? 2051 : vb; }
      if (typeof va === 'string') return va.localeCompare(vb) * dir;
      return ((va||0) - (vb||0)) * dir;
    });
    return d;
  }, [filtered, scenario, sortCol, sortDir]);

  const toggleSort = col => { if (sortCol === col) setSortDir(d => d==='asc'?'desc':'asc'); else { setSortCol(col); setSortDir('asc'); } };

  /* Energy source mix chart */
  const energyMixData = useMemo(() => filtered.map(p => ({ name: p.name.length > 18 ? p.name.slice(0,16)+'..' : p.name, grid: p.energy_source_mix.grid, gas: p.energy_source_mix.gas, solar: p.energy_source_mix.solar, wind: p.energy_source_mix.wind, district: p.energy_source_mix.district })), [filtered]);

  /* Scope 1 vs 2 pie */
  const scopePie = useMemo(() => {
    const s1 = filtered.reduce((s,p)=>s+p.scope1_tco2e,0);
    const s2 = filtered.reduce((s,p)=>s+p.scope2_tco2e_location,0);
    return [{ name:'Scope 1', value:s1 },{ name:'Scope 2 (Location)', value:s2 }];
  }, [filtered]);

  /* Renovation ROI for selected property */
  const renovROI = useMemo(() => {
    if (!sel) return [];
    const discountRate = 0.08;
    return sel.renovation.map(r => {
      const annualSavingsKwh = sel.energy_intensity_kwh * sel.gfa_m2 * (r.savings_kwh_pct/100);
      const annualSavingsUSD = annualSavingsKwh * 0.12 / 1e6;
      const npv = Array.from({length:20},(_,i)=>annualSavingsUSD/Math.pow(1+discountRate,i+1)).reduce((a,b)=>a+b,0) - r.cost_usd_mn;
      const annualCarbonReduction = sel.carbon_intensity_kgco2 * sel.gfa_m2 * (r.carbon_reduction_pct/100) / 1000;
      const abatementCost = annualCarbonReduction > 0 ? (r.cost_usd_mn * 1e6) / (annualCarbonReduction * 20) : 0;
      return { ...r, annualSavingsUSD, npv, abatementCost };
    });
  }, [sel]);

  /* Renovation planner calculations */
  const renovPlan = useMemo(() => {
    if (!sel) return { totalCapex:0, totalSavings:0, combinedPayback:0, adjustedEnergy:sel?.energy_intensity_kwh||0, adjustedCarbon:sel?.carbon_intensity_kgco2||0, newStrand:'>2050' };
    const enabledMeasures = sel.renovation.filter((_, i) => renovToggles[sel.id + '_' + i]);
    const totalCapex = enabledMeasures.reduce((s, m) => s + m.cost_usd_mn, 0);
    const totalSavingsPct = Math.min(80, enabledMeasures.reduce((s, m) => s + m.savings_kwh_pct, 0));
    const totalCarbonPct = Math.min(80, enabledMeasures.reduce((s, m) => s + m.carbon_reduction_pct, 0));
    const adjustedEnergy = sel.energy_intensity_kwh * (1 - totalSavingsPct / 100);
    const adjustedCarbon = sel.carbon_intensity_kgco2 * (1 - totalCarbonPct / 100);
    const totalSavingsUSD = sel.energy_intensity_kwh * sel.gfa_m2 * (totalSavingsPct / 100) * 0.12 / 1e6;
    const combinedPayback = totalSavingsUSD > 0 ? totalCapex / totalSavingsUSD : 0;
    const tk = getTypeKey(sel.type);
    const newStrand = computeStrandYear(adjustedCarbon, tk, scenario);
    const origStrand = computeStrandYear(sel.carbon_intensity_kgco2, tk, scenario);
    return { totalCapex, totalSavingsUSD, combinedPayback, adjustedEnergy, adjustedCarbon, newStrand, origStrand, totalSavingsPct, totalCarbonPct };
  }, [sel, renovToggles, scenario]);

  /* What-if scenario calculations */
  const whatIf = useMemo(() => {
    if (!sel) return {};
    const tk = getTypeKey(sel.type);
    const origStrand = computeStrandYear(sel.carbon_intensity_kgco2, tk, scenario);
    const eiVal = wiEnergy !== null ? wiEnergy : sel.energy_intensity_kwh;
    const eiCarbon = sel.carbon_intensity_kgco2 * (eiVal / sel.energy_intensity_kwh);
    const eiStrand = computeStrandYear(eiCarbon, tk, scenario);
    const rnVal = wiRenewable !== null ? wiRenewable : sel.renewable_share_pct;
    const rnFactor = 1 - (rnVal - sel.renewable_share_pct) * 0.005;
    const rnCarbon = sel.carbon_intensity_kgco2 * Math.max(0.2, rnFactor);
    const rnStrand = computeStrandYear(rnCarbon, tk, scenario);
    const epcMap = { A:0.70, B:0.82, C:0.92, D:1.0, E:1.08, F:1.15, G:1.25 };
    const epcVal = wiEpc || sel.epc_rating;
    const epcFactor = (epcMap[epcVal] || 1.0) / (epcMap[sel.epc_rating] || 1.0);
    const epcCarbon = sel.carbon_intensity_kgco2 * epcFactor;
    const epcStrand = computeStrandYear(epcCarbon, tk, scenario);
    return { origStrand, eiStrand, eiCarbon, rnStrand, rnCarbon, epcStrand, epcCarbon };
  }, [sel, wiEnergy, wiRenewable, wiEpc, scenario]);

  /* Pathway comparison table */
  const pathwayComparison = useMemo(() => filtered.map(p => {
    const tk = getTypeKey(p.type);
    return { id:p.id, name:p.name, type:p.type, carbon:p.carbon_intensity_kgco2, sy15:computeStrandYear(p.carbon_intensity_kgco2,tk,'1.5'), syWB2:computeStrandYear(p.carbon_intensity_kgco2,tk,'WB2'), sy20:computeStrandYear(p.carbon_intensity_kgco2,tk,'2.0') };
  }), [filtered]);

  /* Exports */
  const exportCSV = useCallback(() => {
    const headers = ['ID','Name','Type','City','Country','GFA m2','Energy kWh/m2','Carbon kgCO2/m2','Strand Year','EPC','GAV USDMn','Occupancy%'];
    const rows = sortedTable.map(p => [p.id,p.name,p.type,p.city,p.country,p.gfa_m2,p.energy_intensity_kwh,p.carbon_intensity_kgco2,p.strandYear,p.epc_rating,p.gav_usd_mn,p.occupancy_pct].join(','));
    const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crrem_pathway_analysis.csv'; a.click();
  }, [sortedTable]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(portfolio, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crrem_portfolio.json'; a.click();
  }, [portfolio]);

  const exportPDF = useCallback(() => { window.print(); }, []);

  const TABS = [
    { key:'analytics', label:'Portfolio Analytics' },
    { key:'editor', label:'Property Editor' },
    { key:'renovation', label:'Renovation Planner' },
    { key:'scenario', label:'Scenario Builder' },
  ];

  /* ───────────────────── FIELD EDIT HELPER ───────────────────── */
  const numField = (propId, field, val, label, opts={}) => (
    <div style={{ marginBottom:10 }}>
      <label style={labelS}>{label}</label>
      <input type="number" style={inputS} value={val ?? ''} min={opts.min} max={opts.max} step={opts.step || 1}
        onChange={e => { const v = e.target.value === '' ? null : Number(e.target.value); updateProperty(propId, field, v); }} />
    </div>
  );

  const sliderField = (propId, field, val, label, min=0, max=100) => (
    <div style={{ marginBottom:10 }}>
      <label style={labelS}>{label}: {val != null ? val : 0}{field.includes('pct') || field.includes('share') ? '%' : ''}</label>
      <input type="range" min={min} max={max} value={val ?? 0} style={{ width:'100%', accentColor:T.navy }}
        onChange={e => updateProperty(propId, field, Number(e.target.value))} />
    </div>
  );

  const dropdownField = (propId, field, val, label, options) => (
    <div style={{ marginBottom:10 }}>
      <label style={labelS}>{label}</label>
      <select style={selectS} value={val || ''} onChange={e => updateProperty(propId, field, e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const textField = (propId, field, val, label) => (
    <div style={{ marginBottom:10 }}>
      <label style={labelS}>{label}</label>
      <input type="text" style={inputS} value={val || ''} onChange={e => updateProperty(propId, field, e.target.value)} />
    </div>
  );

  /* ───────────────────── KPI CARD ───────────────────── */
  const KpiCard = ({ title, value, sub, color }) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 16px', minWidth:140, flex:'1 1 140px' }}>
      <div style={{ fontSize:11, color:T.textSec, fontWeight:500, marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:22, fontWeight:700, color: color || T.navy }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>{sub}</div>}
    </div>
  );

  if (!sel) return <div style={{ padding:40, fontFamily:T.font }}>Loading...</div>;

  /* ───────────────────── RENDER ───────────────────── */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 28px', color:T.text }}>
      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:0 }}>EP-I1 CRREM Pathway Analyzer</h1>
          <p style={{ fontSize:12, color:T.textSec, margin:'4px 0 0' }}>{portfolio.portfolioName} | {props.length} properties | {scenario === '1.5' ? '1.5\u00b0C' : scenario === 'WB2' ? 'WB2\u00b0C' : '2.0\u00b0C'} scenario</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={btnSecondary} onClick={exportCSV}>Export CSV</button>
          <button style={btnSecondary} onClick={exportJSON}>Export JSON</button>
          <button style={btnSecondary} onClick={exportPDF}>Print / PDF</button>
          <button style={btnPrimary} onClick={() => navigate('/green-building-cert')}>Green Certs</button>
          <button style={btnPrimary} onClick={() => navigate('/stranded-assets')}>Stranded Assets</button>
          <button style={btnPrimary} onClick={() => navigate('/pipeline-dashboard')}>Pipeline</button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display:'flex', gap:4, marginBottom:16, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:4 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ flex:1, padding:'8px 12px', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font,
              background: activeTab === t.key ? T.navy : 'transparent', color: activeTab === t.key ? '#fff' : T.textSec }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* FILTERS ROW */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div>
          <label style={labelS}>Scenario</label>
          <select style={{ ...selectS, width:120 }} value={scenario} onChange={e => setScenario(e.target.value)}>
            <option value="1.5">1.5\u00b0C</option><option value="WB2">WB2\u00b0C</option><option value="2.0">2.0\u00b0C</option>
          </select>
        </div>
        <div>
          <label style={labelS}>Property Type</label>
          <select style={{ ...selectS, width:140 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            {TYPE_FILTER.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Selected Property</label>
          <select style={{ ...selectS, width:220 }} value={selectedProp} onChange={e => setSelectedProp(e.target.value)}>
            {props.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
          </select>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'flex-end' }}>
          <button style={btnPrimary} onClick={() => setShowAddForm(true)}>+ Add Property</button>
          <button style={btnSecondary} onClick={() => setBulkPreview(true)}>Import 5 Properties</button>
        </div>
      </div>

      {/* ═══════ TAB: PORTFOLIO ANALYTICS ═══════ */}
      {activeTab === 'analytics' && (
        <>
          {/* KPI ROW */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <KpiCard title="Avg Energy Intensity" value={`${fmt(kpis.avgEnergy,1)} kWh/m\u00b2`} sub="Portfolio weighted" />
            <KpiCard title="Avg Carbon Intensity" value={`${fmt(kpis.avgCarbon,1)} kgCO\u2082/m\u00b2`} />
            <KpiCard title="Total GFA" value={`${fmt(kpis.totalGFA)} m\u00b2`} sub={`${kpis.count} properties`} />
            <KpiCard title="Total GAV" value={fmtMn(kpis.totalGAV)} sub={`NOI ${fmtMn(kpis.totalNOI)}`} />
            <KpiCard title="Scope 1 + 2" value={`${fmt(kpis.totalS1 + kpis.totalS2)} tCO\u2082e`} sub={`S1: ${fmt(kpis.totalS1)} | S2: ${fmt(kpis.totalS2)}`} />
            <KpiCard title="Avg Renewable" value={fmtPct(kpis.avgRenewable)} color={kpis.avgRenewable >= 30 ? T.green : T.amber} />
            <KpiCard title="Avg Strand Year" value={fmt(kpis.avgStrand,0)} color={strandColor(kpis.avgStrand)} />
            <KpiCard title="Strand Before 2030" value={kpis.strandBefore2030} color={kpis.strandBefore2030 > 0 ? T.red : T.green} sub={`of ${kpis.count} properties`} />
            <KpiCard title="Avg Occupancy" value={fmtPct(kpis.avgOccupancy)} />
            <KpiCard title="Avg Green Lease" value={fmtPct(kpis.avgGreenLease)} />
            <KpiCard title="Avg Water Intensity" value={`${(kpis.avgWater||0).toFixed(1)} l/m\u00b2`} />
            <KpiCard title="Portfolio Properties" value={props.length} sub={`Filtered: ${filtered.length}`} />
          </div>

          {/* CRREM PATHWAY CHART */}
          <div style={card}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>CRREM Pathway - {sel.name} ({sel.type})</h3>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={pathwayChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11 }} />
                <YAxis yAxisId="left" tick={{ fontSize:11 }} label={{ value:'kgCO\u2082e/m\u00b2', angle:-90, position:'insideLeft', fontSize:11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11 }} label={{ value:'kWh/m\u00b2', angle:90, position:'insideRight', fontSize:11 }} />
                <Tooltip contentStyle={{ fontSize:11 }} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Area yAxisId="left" type="monotone" dataKey="path_1.5" name="1.5\u00b0C Pathway" stroke={T.red} fill={T.red} fillOpacity={0.08} strokeWidth={2} />
                <Area yAxisId="left" type="monotone" dataKey="path_WB2" name="WB2\u00b0C Pathway" stroke={T.amber} fill={T.amber} fillOpacity={0.06} strokeWidth={1.5} strokeDasharray="5 3" />
                <Area yAxisId="left" type="monotone" dataKey="path_2.0" name="2.0\u00b0C Pathway" stroke={T.sage} fill={T.sage} fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="3 3" />
                <Line yAxisId="left" type="monotone" dataKey="property" name="Property Carbon" stroke={T.navy} strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="energyLine" name="Property Energy" stroke={T.gold} strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* STRANDING CASCADE + SCOPE PIE */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div style={card}>
              <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Stranding Year Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={strandCascade}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip contentStyle={{ fontSize:11 }} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {strandCascade.map((d,i) => <Cell key={i} fill={i < 2 ? T.red : i < 4 ? T.amber : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Scope 1 vs Scope 2 Emissions</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={scopePie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke:T.textMut }} style={{ fontSize:11 }}>
                    {scopePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ENERGY SOURCE MIX STACKED BAR */}
          <div style={card}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Energy Source Mix by Property</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={energyMixData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9 }} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize:11 }} label={{ value:'%', angle:-90, position:'insideLeft', fontSize:11 }} />
                <Tooltip contentStyle={{ fontSize:11 }} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="grid" stackId="a" fill="#64748b" name="Grid" />
                <Bar dataKey="gas" stackId="a" fill="#d97706" name="Gas" />
                <Bar dataKey="solar" stackId="a" fill="#eab308" name="Solar" />
                <Bar dataKey="wind" stackId="a" fill="#2563eb" name="Wind" />
                <Bar dataKey="district" stackId="a" fill="#0d9488" name="District" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* SORTABLE PROPERTY TABLE */}
          <div style={{ ...card, overflowX:'auto' }}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Property Stranding Analysis</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {[{k:'id',l:'ID'},{k:'name',l:'Name'},{k:'type',l:'Type'},{k:'city',l:'City'},{k:'energy_intensity_kwh',l:'Energy kWh/m\u00b2'},{k:'carbon_intensity_kgco2',l:'Carbon kgCO\u2082/m\u00b2'},{k:'strandYear',l:'Strand Year'},{k:'epc_rating',l:'EPC'},{k:'gav_usd_mn',l:'GAV $Mn'},{k:'occupancy_pct',l:'Occ %'},{k:'renewable_share_pct',l:'Renew %'}].map(h => (
                    <th key={h.k} style={{ ...thS, cursor:'pointer' }} onClick={() => toggleSort(h.k)}>{h.l} {sortCol===h.k ? (sortDir==='asc'?'\u25b2':'\u25bc'):''}</th>
                  ))}
                  <th style={thS}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTable.map((p,i) => (
                  <tr key={p.id} style={{ background: i%2===0 ? 'transparent' : T.surfaceH, cursor:'pointer' }} onClick={() => { setSelectedProp(p.id); setActiveTab('editor'); }}>
                    <td style={tdS}>{p.id}</td>
                    <td style={{...tdS,fontWeight:500}}>{p.name}</td>
                    <td style={tdS}><span style={badge(T.surfaceH, T.navy)}>{p.type}</span></td>
                    <td style={tdS}>{p.city}</td>
                    <td style={{...tdS,textAlign:'right'}}>{fmt(p.energy_intensity_kwh)}</td>
                    <td style={{...tdS,textAlign:'right'}}>{fmt(p.carbon_intensity_kgco2)}</td>
                    <td style={{...tdS,fontWeight:600,color:strandColor(p.strandYear)}}>{p.strandYear}</td>
                    <td style={tdS}><span style={badge(p.epc_rating<='B'?'#dcfce7':'#fef3c7', p.epc_rating<='B'?T.green:T.amber)}>{p.epc_rating}</span></td>
                    <td style={{...tdS,textAlign:'right'}}>{fmtMn(p.gav_usd_mn)}</td>
                    <td style={{...tdS,textAlign:'right'}}>{p.occupancy_pct}%</td>
                    <td style={{...tdS,textAlign:'right'}}>{p.renewable_share_pct}%</td>
                    <td style={tdS}>
                      <button style={{ ...btnDanger, fontSize:10, padding:'3px 8px' }} onClick={e => { e.stopPropagation(); setDeleteConfirm(p.id); }}>Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RENOVATION ROI TABLE */}
          <div style={{ ...card, overflowX:'auto' }}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Renovation ROI - {sel.name}</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['Measure','Cost $Mn','Savings kWh%','Payback Yr','Carbon Red%','Annual Savings $Mn','NPV $Mn','Abatement $/tCO\u2082'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {renovROI.map((r,i) => (
                  <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                    <td style={{...tdS,fontWeight:500}}>{r.measure}</td>
                    <td style={{...tdS,textAlign:'right'}}>{r.cost_usd_mn.toFixed(1)}</td>
                    <td style={{...tdS,textAlign:'right'}}>{r.savings_kwh_pct}%</td>
                    <td style={{...tdS,textAlign:'right'}}>{r.payback_years}</td>
                    <td style={{...tdS,textAlign:'right'}}>{r.carbon_reduction_pct}%</td>
                    <td style={{...tdS,textAlign:'right'}}>{r.annualSavingsUSD.toFixed(2)}</td>
                    <td style={{...tdS,textAlign:'right',color:r.npv>=0?T.green:T.red}}>{r.npv.toFixed(2)}</td>
                    <td style={{...tdS,textAlign:'right'}}>{fmt(r.abatementCost,0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PATHWAY COMPARISON TABLE */}
          <div style={{ ...card, overflowX:'auto' }}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Pathway Comparison - All 3 Scenarios</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['ID','Property','Type','Carbon kgCO2/m\u00b2','Strand 1.5C','Strand WB2','Strand 2.0C','Gap (1.5 vs 2.0)'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pathwayComparison.map((p,i) => {
                  const gap = (p.sy15 === '>2050' ? 2050 : p.sy15) - (p.sy20 === '>2050' ? 2050 : p.sy20);
                  return (
                    <tr key={p.id} style={{ background: i%2===0 ? 'transparent' : T.surfaceH }}>
                      <td style={tdS}>{p.id}</td>
                      <td style={{...tdS,fontWeight:500}}>{p.name}</td>
                      <td style={tdS}>{p.type}</td>
                      <td style={{...tdS,textAlign:'right'}}>{fmt(p.carbon)}</td>
                      <td style={{...tdS,fontWeight:600,color:strandColor(p.sy15)}}>{p.sy15}</td>
                      <td style={{...tdS,fontWeight:600,color:strandColor(p.syWB2)}}>{p.syWB2}</td>
                      <td style={{...tdS,fontWeight:600,color:strandColor(p.sy20)}}>{p.sy20}</td>
                      <td style={{...tdS,textAlign:'right',color:T.textSec}}>{gap === 0 ? '-' : `${Math.abs(gap)} yr`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════ TAB: PROPERTY EDITOR ═══════ */}
      {activeTab === 'editor' && sel && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* IDENTITY SECTION */}
          <div style={card}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12, borderBottom:`2px solid ${T.gold}`, paddingBottom:6 }}>Identity</h3>
            {textField(sel.id, 'name', sel.name, 'Property Name')}
            {dropdownField(sel.id, 'type', sel.type, 'Type', PROPERTY_TYPES)}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {textField(sel.id, 'city', sel.city, 'City')}
              {dropdownField(sel.id, 'country', sel.country, 'Country', COUNTRIES)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {numField(sel.id, 'year_built', sel.year_built, 'Year Built', { min:1900, max:2026 })}
              {numField(sel.id, 'year_renovated', sel.year_renovated, 'Year Renovated', { min:1900, max:2026 })}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {numField(sel.id, 'gfa_m2', sel.gfa_m2, 'GFA m\u00b2', { min:0 })}
              {numField(sel.id, 'nla_m2', sel.nla_m2, 'NLA m\u00b2', { min:0 })}
              {numField(sel.id, 'floors', sel.floors, 'Floors', { min:1 })}
            </div>
            {dropdownField(sel.id, 'construction', sel.construction, 'Construction', CONSTRUCTION_TYPES)}
          </div>

          {/* ENERGY & CARBON SECTION */}
          <div style={card}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12, borderBottom:`2px solid ${T.red}`, paddingBottom:6 }}>Energy & Carbon (CRREM Core)</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {numField(sel.id, 'energy_intensity_kwh', sel.energy_intensity_kwh, 'Energy Intensity kWh/m\u00b2/yr', { min:0, step:0.1 })}
              {numField(sel.id, 'carbon_intensity_kgco2', sel.carbon_intensity_kgco2, 'Carbon Intensity kgCO\u2082e/m\u00b2/yr', { min:0, step:0.1 })}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {numField(sel.id, 'scope1_tco2e', sel.scope1_tco2e, 'Scope 1 tCO\u2082e', { min:0 })}
              {numField(sel.id, 'scope2_tco2e_location', sel.scope2_tco2e_location, 'Scope 2 Loc tCO\u2082e', { min:0 })}
              {numField(sel.id, 'scope2_tco2e_market', sel.scope2_tco2e_market, 'Scope 2 Mkt tCO\u2082e', { min:0 })}
            </div>
            {sliderField(sel.id, 'renewable_share_pct', sel.renewable_share_pct, 'Renewable Share')}
            <div style={{ marginBottom:10 }}>
              <label style={{ ...labelS, marginBottom:6 }}>Energy Source Mix (must sum to 100%)</label>
              {['grid','gas','solar','wind','district'].map(src => (
                <div key={src} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ width:55, fontSize:11, color:T.textSec, textTransform:'capitalize' }}>{src}</span>
                  <input type="range" min={0} max={100} value={sel.energy_source_mix[src] || 0} style={{ flex:1, accentColor:T.navy }}
                    onChange={e => updateEnergyMix(sel.id, src, e.target.value)} />
                  <span style={{ width:35, fontSize:11, textAlign:'right' }}>{sel.energy_source_mix[src] || 0}%</span>
                </div>
              ))}
              <div style={{ fontSize:10, color: Object.values(sel.energy_source_mix).reduce((s,v)=>s+v,0) === 100 ? T.green : T.red, marginTop:2 }}>
                Total: {Object.values(sel.energy_source_mix).reduce((s,v)=>s+v,0)}%
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {numField(sel.id, 'water_intensity_l_m2', sel.water_intensity_l_m2, 'Water l/m\u00b2/yr', { min:0, step:0.1 })}
              {sliderField(sel.id, 'waste_diversion_rate_pct', sel.waste_diversion_rate_pct, 'Waste Diversion Rate')}
            </div>
          </div>

          {/* EPC SECTION */}
          <div style={card}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12, borderBottom:`2px solid ${T.green}`, paddingBottom:6 }}>EPC Rating</h3>
            {dropdownField(sel.id, 'epc_rating', sel.epc_rating, 'EPC Rating', EPC_RATINGS)}
            {numField(sel.id, 'epc_score', sel.epc_score, 'EPC Score (0-100)', { min:0, max:100 })}
            <div style={{ padding:10, background:T.surfaceH, borderRadius:8, fontSize:12 }}>
              <strong>Current Strand Year ({scenario}):</strong>{' '}
              <span style={{ color: strandColor(computeStrandYear(sel.carbon_intensity_kgco2, getTypeKey(sel.type), scenario)), fontWeight:700 }}>
                {computeStrandYear(sel.carbon_intensity_kgco2, getTypeKey(sel.type), scenario)}
              </span>
            </div>
          </div>

          {/* FINANCIAL SECTION */}
          <div style={card}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12, borderBottom:`2px solid ${T.gold}`, paddingBottom:6 }}>Financial</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {numField(sel.id, 'gav_usd_mn', sel.gav_usd_mn, 'GAV USD Mn', { min:0, step:0.1 })}
              {numField(sel.id, 'noi_usd_mn', sel.noi_usd_mn, 'NOI USD Mn', { min:0, step:0.1 })}
            </div>
            {sliderField(sel.id, 'occupancy_pct', sel.occupancy_pct, 'Occupancy')}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {numField(sel.id, 'wault_years', sel.wault_years, 'WAULT Years', { min:0, step:0.1 })}
              {numField(sel.id, 'rent_psf_usd', sel.rent_psf_usd, 'Rent PSF USD', { min:0, step:0.1 })}
            </div>
            {sliderField(sel.id, 'green_lease_pct', sel.green_lease_pct, 'Green Lease')}
          </div>
        </div>
      )}

      {/* ═══════ TAB: RENOVATION PLANNER ═══════ */}
      {activeTab === 'renovation' && sel && (
        <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16 }}>
          <div style={card}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Renovation Measures - {sel.name}</h3>
            <p style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>Toggle measures to see live impact on energy, carbon, and stranding year.</p>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['Enable','Measure','Cost $Mn','Energy Savings %','Carbon Reduction %','Payback Yr'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {sel.renovation.map((r, i) => {
                  const key = sel.id + '_' + i;
                  return (
                    <tr key={i} style={{ background: renovToggles[key] ? '#f0fdf4' : (i%2===0 ? 'transparent' : T.surfaceH) }}>
                      <td style={tdS}>
                        <input type="checkbox" checked={!!renovToggles[key]} onChange={() => setRenovToggles(prev => ({ ...prev, [key]: !prev[key] }))} style={{ accentColor:T.green }} />
                      </td>
                      <td style={{...tdS,fontWeight:500}}>{r.measure}</td>
                      <td style={{...tdS,textAlign:'right'}}>{r.cost_usd_mn.toFixed(1)}</td>
                      <td style={{...tdS,textAlign:'right'}}>{r.savings_kwh_pct}%</td>
                      <td style={{...tdS,textAlign:'right'}}>{r.carbon_reduction_pct}%</td>
                      <td style={{...tdS,textAlign:'right'}}>{r.payback_years} yr</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div>
            <div style={card}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Renovation Impact Summary</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                <div style={{ padding:10, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:11, color:T.textSec }}>Total CapEx</div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>${renovPlan.totalCapex.toFixed(1)}Mn</div>
                </div>
                <div style={{ padding:10, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:11, color:T.textSec }}>Annual Savings</div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.green }}>${renovPlan.totalSavingsUSD.toFixed(2)}Mn</div>
                </div>
                <div style={{ padding:10, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:11, color:T.textSec }}>Combined Payback</div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.amber }}>{renovPlan.combinedPayback > 0 ? renovPlan.combinedPayback.toFixed(1) + ' yr' : '-'}</div>
                </div>
                <div style={{ padding:10, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:11, color:T.textSec }}>Carbon Reduction</div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.green }}>{renovPlan.totalCarbonPct.toFixed(0)}%</div>
                </div>
              </div>
              <div style={{ padding:12, background:'#f0fdf4', borderRadius:8, border:`1px solid ${T.green}22`, marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:6 }}>Energy Intensity</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                  <span>Before: {sel.energy_intensity_kwh} kWh/m\u00b2</span>
                  <span style={{ fontWeight:700, color:T.green }}>After: {renovPlan.adjustedEnergy.toFixed(1)} kWh/m\u00b2</span>
                </div>
              </div>
              <div style={{ padding:12, background:'#fef3c7', borderRadius:8, border:`1px solid ${T.amber}22`, marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:6 }}>Carbon Intensity</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                  <span>Before: {sel.carbon_intensity_kgco2} kgCO\u2082/m\u00b2</span>
                  <span style={{ fontWeight:700, color:T.green }}>After: {renovPlan.adjustedCarbon.toFixed(1)} kgCO\u2082/m\u00b2</span>
                </div>
              </div>
              <div style={{ padding:12, background:'#eff6ff', borderRadius:8, border:`1px solid ${T.navyL}22` }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:6 }}>Stranding Year ({scenario})</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                  <span style={{ color:strandColor(renovPlan.origStrand) }}>Before: {renovPlan.origStrand}</span>
                  <span style={{ fontWeight:700, color:strandColor(renovPlan.newStrand) }}>After: {renovPlan.newStrand}</span>
                </div>
              </div>
            </div>
            <button style={{ ...btnPrimary, width:'100%', padding:12 }}
              onClick={() => {
                const enabledIdxs = sel.renovation.map((_, i) => renovToggles[sel.id + '_' + i] ? i : -1).filter(i => i >= 0);
                if (enabledIdxs.length === 0) return;
                updateProperty(sel.id, 'energy_intensity_kwh', Math.round(renovPlan.adjustedEnergy * 10) / 10);
                updateProperty(sel.id, 'carbon_intensity_kgco2', Math.round(renovPlan.adjustedCarbon * 10) / 10);
                setRenovToggles(prev => {
                  const next = { ...prev };
                  enabledIdxs.forEach(i => delete next[sel.id + '_' + i]);
                  return next;
                });
              }}>
              Apply Renovation Plan
            </button>
          </div>
        </div>
      )}

      {/* ═══════ TAB: SCENARIO BUILDER ═══════ */}
      {activeTab === 'scenario' && sel && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
          {/* ENERGY INTENSITY WHAT-IF */}
          <div style={card}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>What if Energy Intensity changes?</h3>
            <p style={{ fontSize:12, color:T.textSec, marginBottom:8 }}>Current: {sel.energy_intensity_kwh} kWh/m\u00b2</p>
            <input type="range" min={10} max={Math.max(400, sel.energy_intensity_kwh * 2)} value={wiEnergy !== null ? wiEnergy : sel.energy_intensity_kwh}
              style={{ width:'100%', accentColor:T.navy }}
              onChange={e => setWiEnergy(Number(e.target.value))} />
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginTop:8 }}>{wiEnergy !== null ? wiEnergy : sel.energy_intensity_kwh} kWh/m\u00b2</div>
            <div style={{ padding:12, background:T.surfaceH, borderRadius:8, marginTop:12 }}>
              <div style={{ fontSize:12 }}>Adjusted Carbon: <strong>{whatIf.eiCarbon?.toFixed(1)}</strong> kgCO\u2082/m\u00b2</div>
              <div style={{ fontSize:12, marginTop:4 }}>
                Strand Year: <span style={{ color:strandColor(whatIf.origStrand) }}>{whatIf.origStrand}</span>{' \u2192 '}
                <strong style={{ color:strandColor(whatIf.eiStrand) }}>{whatIf.eiStrand}</strong>
              </div>
            </div>
            <button style={{ ...btnSecondary, marginTop:10, width:'100%' }} onClick={() => setWiEnergy(null)}>Reset</button>
          </div>

          {/* RENEWABLE SHARE WHAT-IF */}
          <div style={card}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>What if Renewable Share changes?</h3>
            <p style={{ fontSize:12, color:T.textSec, marginBottom:8 }}>Current: {sel.renewable_share_pct}%</p>
            <input type="range" min={0} max={100} value={wiRenewable !== null ? wiRenewable : sel.renewable_share_pct}
              style={{ width:'100%', accentColor:T.green }}
              onChange={e => setWiRenewable(Number(e.target.value))} />
            <div style={{ fontSize:14, fontWeight:700, color:T.green, marginTop:8 }}>{wiRenewable !== null ? wiRenewable : sel.renewable_share_pct}%</div>
            <div style={{ padding:12, background:T.surfaceH, borderRadius:8, marginTop:12 }}>
              <div style={{ fontSize:12 }}>Adjusted Carbon: <strong>{whatIf.rnCarbon?.toFixed(1)}</strong> kgCO\u2082/m\u00b2</div>
              <div style={{ fontSize:12, marginTop:4 }}>
                Strand Year: <span style={{ color:strandColor(whatIf.origStrand) }}>{whatIf.origStrand}</span>{' \u2192 '}
                <strong style={{ color:strandColor(whatIf.rnStrand) }}>{whatIf.rnStrand}</strong>
              </div>
            </div>
            <button style={{ ...btnSecondary, marginTop:10, width:'100%' }} onClick={() => setWiRenewable(null)}>Reset</button>
          </div>

          {/* EPC UPGRADE WHAT-IF */}
          <div style={card}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>What if EPC upgraded?</h3>
            <p style={{ fontSize:12, color:T.textSec, marginBottom:8 }}>Current: EPC {sel.epc_rating}</p>
            <select style={{ ...selectS, width:'100%' }} value={wiEpc || sel.epc_rating} onChange={e => setWiEpc(e.target.value)}>
              {EPC_RATINGS.map(r => <option key={r} value={r}>EPC {r}</option>)}
            </select>
            <div style={{ padding:12, background:T.surfaceH, borderRadius:8, marginTop:12 }}>
              <div style={{ fontSize:12 }}>Adjusted Carbon: <strong>{whatIf.epcCarbon?.toFixed(1)}</strong> kgCO\u2082/m\u00b2</div>
              <div style={{ fontSize:12, marginTop:4 }}>
                Strand Year: <span style={{ color:strandColor(whatIf.origStrand) }}>{whatIf.origStrand}</span>{' \u2192 '}
                <strong style={{ color:strandColor(whatIf.epcStrand) }}>{whatIf.epcStrand}</strong>
              </div>
            </div>
            <button style={{ ...btnSecondary, marginTop:10, width:'100%' }} onClick={() => setWiEpc(null)}>Reset</button>
          </div>
        </div>
      )}

      {/* ═══════ MODALS ═══════ */}
      {/* ADD PROPERTY MODAL */}
      {showAddForm && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowAddForm(false)}>
          <div style={{ background:T.surface, borderRadius:12, padding:24, width:400, maxHeight:'80vh', overflow:'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:16 }}>Add New Property</h3>
            <label style={labelS}>Property Type</label>
            <select style={{ ...selectS, marginBottom:16 }} value={newPropType} onChange={e => setNewPropType(e.target.value)}>
              {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <p style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>A new property will be created with default values for {newPropType} type. You can edit all fields in the Property Editor tab.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button style={btnPrimary} onClick={addProperty}>Create Property</button>
              <button style={btnSecondary} onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setDeleteConfirm(null)}>
          <div style={{ background:T.surface, borderRadius:12, padding:24, width:360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.red, marginBottom:12 }}>Delete Property?</h3>
            <p style={{ fontSize:13, color:T.textSec, marginBottom:16 }}>Are you sure you want to delete {props.find(p => p.id === deleteConfirm)?.name || deleteConfirm}? This action cannot be undone.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button style={btnDanger} onClick={() => deleteProperty(deleteConfirm)}>Delete</button>
              <button style={btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT PREVIEW MODAL */}
      {bulkPreview && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setBulkPreview(false)}>
          <div style={{ background:T.surface, borderRadius:12, padding:24, width:700, maxHeight:'80vh', overflow:'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:12 }}>Import 5 Sample Properties</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, marginBottom:16 }}>
              <thead>
                <tr>
                  {['ID','Name','Type','City','Country','GFA m\u00b2','Energy kWh/m\u00b2','Carbon kgCO\u2082/m\u00b2'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {BULK_IMPORT_PROPERTIES.map((p, i) => {
                  const exists = props.some(ep => ep.id === p.id);
                  return (
                    <tr key={p.id} style={{ background: exists ? '#fef2f2' : (i%2===0 ? 'transparent' : T.surfaceH) }}>
                      <td style={tdS}>{p.id}</td>
                      <td style={{...tdS,fontWeight:500}}>{p.name}</td>
                      <td style={tdS}>{p.type}</td>
                      <td style={tdS}>{p.city}</td>
                      <td style={tdS}>{p.country}</td>
                      <td style={{...tdS,textAlign:'right'}}>{fmt(p.gfa_m2)}</td>
                      <td style={{...tdS,textAlign:'right'}}>{p.energy_intensity_kwh}</td>
                      <td style={{...tdS,textAlign:'right'}}>{p.carbon_intensity_kgco2}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ display:'flex', gap:8 }}>
              <button style={btnPrimary} onClick={bulkImport}>Confirm Import</button>
              <button style={btnSecondary} onClick={() => setBulkPreview(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ marginTop:24, padding:16, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:T.textMut }}>CRREM Pathway Analyzer v6.0 | {portfolio.portfolioName} | {portfolio.lastUpdated}</span>
        <span style={{ fontSize:11, color:T.textMut }}>Data: {filtered.length} properties | {scenario === '1.5' ? '1.5C' : scenario === 'WB2' ? 'WB2C' : '2.0C'} scenario</span>
      </div>
    </div>
  );
}
