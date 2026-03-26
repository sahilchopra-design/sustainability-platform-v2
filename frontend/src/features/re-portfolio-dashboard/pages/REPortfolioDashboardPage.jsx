import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const RE_KEY = 'ra_re_portfolio_v1';
const INFRA_KEY = 'ra_infra_portfolio_v1';
const EQUITY_KEY = 'ra_portfolio_v1';

const PIE_COLORS = [T.navy, T.gold, T.sage, T.navyL, T.goldL, T.sageL, '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];
const HAZARD_LABELS = ['Flood','Heat Stress','Wind','Wildfire','Sea Level Rise','Drought'];
const GRESB_ASPECTS = ['Energy','GHG','Water','Waste','Biodiversity','Stakeholder','Management'];
const CRREM_PATHWAY = [{ year:2020, portfolio:62, target:58 },{ year:2025, portfolio:55, target:45 },{ year:2030, portfolio:42, target:32 },{ year:2035, portfolio:32, target:22 },{ year:2040, portfolio:24, target:15 },{ year:2045, portfolio:18, target:10 },{ year:2050, portfolio:14, target:6 }];
const PROP_TYPES = ['Office','Retail','Logistics','Residential','Data Center','Mixed-Use','Life Sciences','Hotel','Healthcare'];
const EPC_RATINGS = ['A+','A','B','C','D','E','F','G'];
const CURRENCIES = ['USD','EUR','GBP','CHF','SGD','AUD'];
const PERIODS = ['FY2024','FY2025','FY2026'];
const COUNTRIES_RE = ['US','UK','SG','AU','DE','JP','FR','AE','CA','CN','NL','SE','HK','ES','KR','IN','PL','ID','BR','DK','CH','IT','NO'];

const DEFAULT_RE_PORTFOLIO = {
  portfolioName: 'AA Global RE Fund II', currency: 'USD', reportingPeriod: 'FY2026', lastUpdated: '2026-03-25',
  targets: { energyIntensity2030: 100, carbonIntensity2030: 25, certCoverage2027: 80, gresbScore2027: 80, renewableShare2030: 50 },
  properties: [
    { id:'RE-01', name:'One Vanderbilt', type:'Office', city:'New York', country:'US', gfa_m2:167000, floors:58, year_built:2020, construction:'Steel & Glass', gav_usd_mn:3200, nav_usd_mn:2100, noi_usd_mn:185, cap_rate:5.8, occupancy_pct:94, wault_years:8.2, rent_psf:92, energy_intensity_kwh:185, carbon_intensity_kgco2:52, scope1:2200, scope2:6500, renewable_pct:35, energy_mix:{grid:45,solar:20,wind:15,gas:15,other:5}, crrem_aligned:true, stranding_year:2042, gresb_score:88, gresb_aspects:{energy:16,ghg:17,water:14,waste:12,biodiversity:10,stakeholder:9,management:10}, certification:'LEED Platinum', cert_level:'Platinum', epc_rating:'A', epc_score:88, physical_risk_score:35, flood_risk:25, heat_risk:40, wind_risk:45, wildfire_risk:10, sea_level_risk:30, drought_risk:15, flood_zone:'AE', elevation_m:12, green_lease_pct:72, tenant_satisfaction:82, capex_plan_usd_mn:45, retrofit_status:'Planned', water_intensity:0.42, waste_diversion_pct:78, biodiversity_score:62, regulation:['Local Law 97'], lat:40.753, lon:-73.979 },
    { id:'RE-02', name:'The Shard Office Floors', type:'Office', city:'London', country:'UK', gfa_m2:72000, floors:35, year_built:2012, construction:'Steel Frame', gav_usd_mn:1800, nav_usd_mn:1200, noi_usd_mn:98, cap_rate:5.4, occupancy_pct:91, wault_years:6.5, rent_psf:78, energy_intensity_kwh:165, carbon_intensity_kgco2:42, scope1:1500, scope2:4200, renewable_pct:28, energy_mix:{grid:52,solar:12,wind:16,gas:15,other:5}, crrem_aligned:true, stranding_year:2045, gresb_score:82, gresb_aspects:{energy:15,ghg:15,water:13,waste:11,biodiversity:9,stakeholder:10,management:9}, certification:'BREEAM Outstanding', cert_level:'Outstanding', epc_rating:'A', epc_score:85, physical_risk_score:28, flood_risk:35, heat_risk:20, wind_risk:30, wildfire_risk:5, sea_level_risk:25, drought_risk:10, flood_zone:'X', elevation_m:8, green_lease_pct:85, tenant_satisfaction:78, capex_plan_usd_mn:28, retrofit_status:'In Progress', water_intensity:0.38, waste_diversion_pct:82, biodiversity_score:58, regulation:['MEES','EPBD'], lat:51.504, lon:-0.086 },
    { id:'RE-03', name:'Marina Bay Financial Centre', type:'Office', city:'Singapore', country:'SG', gfa_m2:185000, floors:50, year_built:2010, construction:'Reinforced Concrete', gav_usd_mn:4200, nav_usd_mn:2800, noi_usd_mn:240, cap_rate:5.7, occupancy_pct:96, wault_years:7.8, rent_psf:105, energy_intensity_kwh:210, carbon_intensity_kgco2:68, scope1:3800, scope2:9200, renewable_pct:15, energy_mix:{grid:72,solar:8,wind:7,gas:10,other:3}, crrem_aligned:false, stranding_year:2034, gresb_score:78, gresb_aspects:{energy:14,ghg:13,water:12,waste:10,biodiversity:9,stakeholder:10,management:10}, certification:'BCA Green Mark Platinum', cert_level:'Platinum', epc_rating:'A', epc_score:82, physical_risk_score:42, flood_risk:45, heat_risk:55, wind_risk:20, wildfire_risk:5, sea_level_risk:50, drought_risk:15, flood_zone:'AE', elevation_m:5, green_lease_pct:65, tenant_satisfaction:85, capex_plan_usd_mn:62, retrofit_status:'Planned', water_intensity:0.55, waste_diversion_pct:72, biodiversity_score:55, regulation:[], lat:1.281, lon:103.854 },
    { id:'RE-04', name:'Westfield Sydney', type:'Retail', city:'Sydney', country:'AU', gfa_m2:130000, floors:8, year_built:2004, construction:'Steel Frame', gav_usd_mn:2800, nav_usd_mn:1850, noi_usd_mn:168, cap_rate:6.0, occupancy_pct:92, wault_years:5.2, rent_psf:65, energy_intensity_kwh:280, carbon_intensity_kgco2:78, scope1:4500, scope2:7800, renewable_pct:22, energy_mix:{grid:60,solar:12,wind:10,gas:15,other:3}, crrem_aligned:false, stranding_year:2031, gresb_score:72, gresb_aspects:{energy:12,ghg:11,water:11,waste:10,biodiversity:8,stakeholder:10,management:10}, certification:'NABERS 5 Star', cert_level:'5 Star', epc_rating:'B', epc_score:72, physical_risk_score:38, flood_risk:20, heat_risk:45, wind_risk:25, wildfire_risk:55, sea_level_risk:15, drought_risk:40, flood_zone:'X', elevation_m:18, green_lease_pct:55, tenant_satisfaction:80, capex_plan_usd_mn:38, retrofit_status:'In Progress', water_intensity:0.68, waste_diversion_pct:65, biodiversity_score:48, regulation:['NABERS mandatory'], lat:-33.870, lon:151.209 },
    { id:'RE-05', name:'Frankfurt Logistics Hub', type:'Logistics', city:'Frankfurt', country:'DE', gfa_m2:95000, floors:2, year_built:2019, construction:'Prefab Steel', gav_usd_mn:420, nav_usd_mn:290, noi_usd_mn:28, cap_rate:6.7, occupancy_pct:100, wault_years:12.5, rent_psf:18, energy_intensity_kwh:120, carbon_intensity_kgco2:35, scope1:800, scope2:2500, renewable_pct:45, energy_mix:{grid:35,solar:25,wind:20,gas:12,other:8}, crrem_aligned:true, stranding_year:2048, gresb_score:85, gresb_aspects:{energy:16,ghg:16,water:13,waste:12,biodiversity:10,stakeholder:9,management:9}, certification:'DGNB Gold', cert_level:'Gold', epc_rating:'A', epc_score:85, physical_risk_score:18, flood_risk:15, heat_risk:20, wind_risk:15, wildfire_risk:5, sea_level_risk:5, drought_risk:10, flood_zone:'X', elevation_m:110, green_lease_pct:90, tenant_satisfaction:88, capex_plan_usd_mn:8, retrofit_status:'Complete', water_intensity:0.25, waste_diversion_pct:88, biodiversity_score:72, regulation:['EPBD'], lat:50.111, lon:8.682 },
    { id:'RE-06', name:'Prologis Tokyo Bay', type:'Logistics', city:'Tokyo', country:'JP', gfa_m2:110000, floors:4, year_built:2021, construction:'Seismic RC', gav_usd_mn:680, nav_usd_mn:450, noi_usd_mn:42, cap_rate:6.2, occupancy_pct:98, wault_years:10.8, rent_psf:22, energy_intensity_kwh:105, carbon_intensity_kgco2:28, scope1:600, scope2:2200, renewable_pct:52, energy_mix:{grid:30,solar:28,wind:24,gas:12,other:6}, crrem_aligned:true, stranding_year:2050, gresb_score:90, gresb_aspects:{energy:17,ghg:17,water:14,waste:13,biodiversity:10,stakeholder:10,management:9}, certification:'CASBEE S Rank', cert_level:'S Rank', epc_rating:'A', epc_score:90, physical_risk_score:52, flood_risk:40, heat_risk:35, wind_risk:55, wildfire_risk:5, sea_level_risk:45, drought_risk:10, flood_zone:'AE', elevation_m:4, green_lease_pct:82, tenant_satisfaction:90, capex_plan_usd_mn:12, retrofit_status:'Complete', water_intensity:0.22, waste_diversion_pct:92, biodiversity_score:65, regulation:[], lat:35.620, lon:139.770 },
    { id:'RE-07', name:'Hudson Yards Tower D', type:'Office', city:'New York', country:'US', gfa_m2:148000, floors:52, year_built:2019, construction:'Steel & Glass', gav_usd_mn:2900, nav_usd_mn:1900, noi_usd_mn:162, cap_rate:5.6, occupancy_pct:89, wault_years:7.0, rent_psf:88, energy_intensity_kwh:175, carbon_intensity_kgco2:48, scope1:2000, scope2:5800, renewable_pct:40, energy_mix:{grid:40,solar:22,wind:18,gas:14,other:6}, crrem_aligned:true, stranding_year:2043, gresb_score:86, gresb_aspects:{energy:16,ghg:16,water:13,waste:12,biodiversity:10,stakeholder:10,management:9}, certification:'LEED Platinum', cert_level:'Platinum', epc_rating:'A', epc_score:86, physical_risk_score:38, flood_risk:30, heat_risk:38, wind_risk:42, wildfire_risk:8, sea_level_risk:35, drought_risk:12, flood_zone:'AE', elevation_m:8, green_lease_pct:78, tenant_satisfaction:84, capex_plan_usd_mn:35, retrofit_status:'Planned', water_intensity:0.40, waste_diversion_pct:80, biodiversity_score:60, regulation:['Local Law 97'], lat:40.754, lon:-74.002 },
    { id:'RE-08', name:'Canary Wharf Tower', type:'Office', city:'London', country:'UK', gfa_m2:88000, floors:42, year_built:2002, construction:'Steel Frame', gav_usd_mn:1600, nav_usd_mn:1050, noi_usd_mn:88, cap_rate:5.5, occupancy_pct:87, wault_years:5.8, rent_psf:72, energy_intensity_kwh:195, carbon_intensity_kgco2:55, scope1:2400, scope2:5200, renewable_pct:20, energy_mix:{grid:60,solar:8,wind:12,gas:15,other:5}, crrem_aligned:false, stranding_year:2033, gresb_score:74, gresb_aspects:{energy:13,ghg:12,water:12,waste:10,biodiversity:8,stakeholder:10,management:9}, certification:'BREEAM Excellent', cert_level:'Excellent', epc_rating:'B', epc_score:72, physical_risk_score:32, flood_risk:40, heat_risk:22, wind_risk:28, wildfire_risk:5, sea_level_risk:35, drought_risk:8, flood_zone:'AE', elevation_m:6, green_lease_pct:68, tenant_satisfaction:75, capex_plan_usd_mn:42, retrofit_status:'In Progress', water_intensity:0.48, waste_diversion_pct:70, biodiversity_score:52, regulation:['MEES','EPBD'], lat:51.505, lon:-0.023 },
    { id:'RE-09', name:'Mumbai BKC Tower', type:'Office', city:'Mumbai', country:'IN', gfa_m2:62000, floors:38, year_built:2018, construction:'RCC Frame', gav_usd_mn:580, nav_usd_mn:380, noi_usd_mn:38, cap_rate:6.6, occupancy_pct:90, wault_years:6.2, rent_psf:42, energy_intensity_kwh:220, carbon_intensity_kgco2:85, scope1:3000, scope2:8500, renewable_pct:12, energy_mix:{grid:75,solar:5,wind:7,gas:10,other:3}, crrem_aligned:false, stranding_year:2030, gresb_score:65, gresb_aspects:{energy:11,ghg:10,water:10,waste:9,biodiversity:7,stakeholder:9,management:9}, certification:'IGBC Gold', cert_level:'Gold', epc_rating:'B', epc_score:65, physical_risk_score:55, flood_risk:65, heat_risk:58, wind_risk:35, wildfire_risk:10, sea_level_risk:55, drought_risk:25, flood_zone:'VE', elevation_m:3, green_lease_pct:42, tenant_satisfaction:72, capex_plan_usd_mn:18, retrofit_status:'Planned', water_intensity:0.62, waste_diversion_pct:55, biodiversity_score:42, regulation:[], lat:19.065, lon:72.870 },
    { id:'RE-10', name:'Berlin Mitte Residential', type:'Residential', city:'Berlin', country:'DE', gfa_m2:45000, floors:12, year_built:2022, construction:'CLT/Timber Hybrid', gav_usd_mn:320, nav_usd_mn:220, noi_usd_mn:18, cap_rate:5.6, occupancy_pct:97, wault_years:4.5, rent_psf:28, energy_intensity_kwh:95, carbon_intensity_kgco2:22, scope1:400, scope2:1200, renewable_pct:65, energy_mix:{grid:20,solar:30,wind:35,gas:10,other:5}, crrem_aligned:true, stranding_year:2050, gresb_score:88, gresb_aspects:{energy:17,ghg:17,water:13,waste:12,biodiversity:11,stakeholder:9,management:9}, certification:'Passivhaus', cert_level:'Certified', epc_rating:'A+', epc_score:95, physical_risk_score:15, flood_risk:10, heat_risk:18, wind_risk:12, wildfire_risk:5, sea_level_risk:5, drought_risk:8, flood_zone:'X', elevation_m:38, green_lease_pct:95, tenant_satisfaction:92, capex_plan_usd_mn:5, retrofit_status:'Complete', water_intensity:0.18, waste_diversion_pct:90, biodiversity_score:78, regulation:['EPBD'], lat:52.520, lon:13.405 },
    { id:'RE-11', name:'Paris La Defense Office', type:'Office', city:'Paris', country:'FR', gfa_m2:78000, floors:35, year_built:2015, construction:'Steel & Concrete', gav_usd_mn:1400, nav_usd_mn:920, noi_usd_mn:78, cap_rate:5.6, occupancy_pct:88, wault_years:6.0, rent_psf:68, energy_intensity_kwh:155, carbon_intensity_kgco2:18, scope1:800, scope2:2800, renewable_pct:30, energy_mix:{grid:48,solar:14,wind:16,gas:15,other:7}, crrem_aligned:true, stranding_year:2048, gresb_score:84, gresb_aspects:{energy:16,ghg:16,water:13,waste:11,biodiversity:9,stakeholder:10,management:9}, certification:'HQE Exceptional', cert_level:'Exceptional', epc_rating:'A', epc_score:84, physical_risk_score:22, flood_risk:20, heat_risk:28, wind_risk:18, wildfire_risk:5, sea_level_risk:10, drought_risk:15, flood_zone:'X', elevation_m:55, green_lease_pct:80, tenant_satisfaction:80, capex_plan_usd_mn:22, retrofit_status:'Planned', water_intensity:0.35, waste_diversion_pct:78, biodiversity_score:62, regulation:['EPBD'], lat:48.892, lon:2.238 },
    { id:'RE-12', name:'Dubai Marina Mall', type:'Retail', city:'Dubai', country:'AE', gfa_m2:92000, floors:5, year_built:2008, construction:'Reinforced Concrete', gav_usd_mn:850, nav_usd_mn:560, noi_usd_mn:58, cap_rate:6.8, occupancy_pct:85, wault_years:4.8, rent_psf:48, energy_intensity_kwh:350, carbon_intensity_kgco2:120, scope1:6000, scope2:12000, renewable_pct:8, energy_mix:{grid:80,solar:5,wind:3,gas:10,other:2}, crrem_aligned:false, stranding_year:2028, gresb_score:55, gresb_aspects:{energy:9,ghg:8,water:9,waste:8,biodiversity:6,stakeholder:8,management:7}, certification:'Estidama 2 Pearl', cert_level:'2 Pearl', epc_rating:'C', epc_score:48, physical_risk_score:58, flood_risk:15, heat_risk:85, wind_risk:25, wildfire_risk:5, sea_level_risk:20, drought_risk:80, flood_zone:'X', elevation_m:3, green_lease_pct:30, tenant_satisfaction:78, capex_plan_usd_mn:35, retrofit_status:'Planned', water_intensity:0.85, waste_diversion_pct:45, biodiversity_score:35, regulation:[], lat:25.077, lon:55.139 },
    { id:'RE-13', name:'Toronto Yorkville Resi', type:'Residential', city:'Toronto', country:'CA', gfa_m2:38000, floors:28, year_built:2023, construction:'Cast-in-Place RC', gav_usd_mn:280, nav_usd_mn:190, noi_usd_mn:16, cap_rate:5.7, occupancy_pct:95, wault_years:5.0, rent_psf:35, energy_intensity_kwh:110, carbon_intensity_kgco2:25, scope1:500, scope2:1800, renewable_pct:42, energy_mix:{grid:38,solar:22,wind:20,gas:14,other:6}, crrem_aligned:true, stranding_year:2050, gresb_score:82, gresb_aspects:{energy:15,ghg:15,water:13,waste:12,biodiversity:9,stakeholder:9,management:9}, certification:'LEED Gold', cert_level:'Gold', epc_rating:'A', epc_score:82, physical_risk_score:25, flood_risk:15, heat_risk:20, wind_risk:30, wildfire_risk:10, sea_level_risk:5, drought_risk:12, flood_zone:'X', elevation_m:85, green_lease_pct:88, tenant_satisfaction:86, capex_plan_usd_mn:6, retrofit_status:'Complete', water_intensity:0.28, waste_diversion_pct:82, biodiversity_score:68, regulation:[], lat:43.672, lon:-79.394 },
    { id:'RE-14', name:'Shanghai Lujiazui Tower', type:'Office', city:'Shanghai', country:'CN', gfa_m2:125000, floors:48, year_built:2016, construction:'Composite Steel', gav_usd_mn:2200, nav_usd_mn:1450, noi_usd_mn:132, cap_rate:6.0, occupancy_pct:88, wault_years:5.5, rent_psf:55, energy_intensity_kwh:240, carbon_intensity_kgco2:95, scope1:5000, scope2:14000, renewable_pct:10, energy_mix:{grid:78,solar:4,wind:6,gas:8,other:4}, crrem_aligned:false, stranding_year:2029, gresb_score:62, gresb_aspects:{energy:10,ghg:10,water:10,waste:9,biodiversity:7,stakeholder:8,management:8}, certification:'China Green Building 3-Star', cert_level:'3-Star', epc_rating:'B', epc_score:62, physical_risk_score:48, flood_risk:50, heat_risk:42, wind_risk:38, wildfire_risk:5, sea_level_risk:45, drought_risk:18, flood_zone:'AE', elevation_m:4, green_lease_pct:38, tenant_satisfaction:76, capex_plan_usd_mn:55, retrofit_status:'Planned', water_intensity:0.58, waste_diversion_pct:60, biodiversity_score:40, regulation:[], lat:31.240, lon:121.501 },
    { id:'RE-15', name:'Amsterdam Zuidas Office', type:'Office', city:'Amsterdam', country:'NL', gfa_m2:52000, floors:22, year_built:2020, construction:'Timber Hybrid', gav_usd_mn:680, nav_usd_mn:450, noi_usd_mn:38, cap_rate:5.6, occupancy_pct:93, wault_years:7.2, rent_psf:62, energy_intensity_kwh:130, carbon_intensity_kgco2:20, scope1:500, scope2:1800, renewable_pct:55, energy_mix:{grid:28,solar:25,wind:30,gas:12,other:5}, crrem_aligned:true, stranding_year:2050, gresb_score:92, gresb_aspects:{energy:18,ghg:17,water:14,waste:13,biodiversity:11,stakeholder:10,management:9}, certification:'BREEAM Outstanding', cert_level:'Outstanding', epc_rating:'A', epc_score:92, physical_risk_score:30, flood_risk:55, heat_risk:18, wind_risk:22, wildfire_risk:5, sea_level_risk:48, drought_risk:8, flood_zone:'AE', elevation_m:-1, green_lease_pct:92, tenant_satisfaction:88, capex_plan_usd_mn:10, retrofit_status:'Complete', water_intensity:0.28, waste_diversion_pct:88, biodiversity_score:72, regulation:['EPBD','EPC minimum'], lat:52.339, lon:4.874 },
    { id:'RE-16', name:'Melbourne CBD Retail', type:'Retail', city:'Melbourne', country:'AU', gfa_m2:68000, floors:4, year_built:2006, construction:'Steel Frame', gav_usd_mn:520, nav_usd_mn:340, noi_usd_mn:36, cap_rate:6.9, occupancy_pct:86, wault_years:4.2, rent_psf:38, energy_intensity_kwh:260, carbon_intensity_kgco2:72, scope1:3500, scope2:6200, renewable_pct:18, energy_mix:{grid:65,solar:8,wind:10,gas:12,other:5}, crrem_aligned:false, stranding_year:2032, gresb_score:68, gresb_aspects:{energy:11,ghg:11,water:10,waste:10,biodiversity:8,stakeholder:9,management:9}, certification:'NABERS 4 Star', cert_level:'4 Star', epc_rating:'B', epc_score:68, physical_risk_score:35, flood_risk:22, heat_risk:42, wind_risk:28, wildfire_risk:48, sea_level_risk:12, drought_risk:38, flood_zone:'X', elevation_m:25, green_lease_pct:50, tenant_satisfaction:76, capex_plan_usd_mn:22, retrofit_status:'In Progress', water_intensity:0.58, waste_diversion_pct:62, biodiversity_score:45, regulation:['NABERS mandatory'], lat:-37.814, lon:144.963 },
    { id:'RE-17', name:'Stockholm Hammarby Resi', type:'Residential', city:'Stockholm', country:'SE', gfa_m2:32000, floors:8, year_built:2023, construction:'Mass Timber', gav_usd_mn:240, nav_usd_mn:165, noi_usd_mn:14, cap_rate:5.8, occupancy_pct:98, wault_years:6.0, rent_psf:32, energy_intensity_kwh:75, carbon_intensity_kgco2:12, scope1:200, scope2:800, renewable_pct:78, energy_mix:{grid:12,solar:30,wind:48,gas:5,other:5}, crrem_aligned:true, stranding_year:2050, gresb_score:94, gresb_aspects:{energy:18,ghg:18,water:15,waste:13,biodiversity:11,stakeholder:10,management:9}, certification:'Miljoebyggnad Gold', cert_level:'Gold', epc_rating:'A', epc_score:94, physical_risk_score:12, flood_risk:10, heat_risk:8, wind_risk:15, wildfire_risk:5, sea_level_risk:12, drought_risk:5, flood_zone:'X', elevation_m:15, green_lease_pct:98, tenant_satisfaction:94, capex_plan_usd_mn:3, retrofit_status:'Complete', water_intensity:0.15, waste_diversion_pct:95, biodiversity_score:85, regulation:['EPBD'], lat:59.302, lon:18.098 },
    { id:'RE-18', name:'Chicago Data Center', type:'Data Center', city:'Chicago', country:'US', gfa_m2:25000, floors:3, year_built:2022, construction:'Reinforced Concrete', gav_usd_mn:480, nav_usd_mn:320, noi_usd_mn:42, cap_rate:8.8, occupancy_pct:100, wault_years:15.0, rent_psf:120, energy_intensity_kwh:1200, carbon_intensity_kgco2:320, scope1:4000, scope2:25000, renewable_pct:30, energy_mix:{grid:55,solar:12,wind:18,gas:12,other:3}, crrem_aligned:false, stranding_year:2028, gresb_score:58, gresb_aspects:{energy:9,ghg:9,water:9,waste:8,biodiversity:7,stakeholder:8,management:8}, certification:'LEED Silver', cert_level:'Silver', epc_rating:'C', epc_score:48, physical_risk_score:28, flood_risk:15, heat_risk:25, wind_risk:35, wildfire_risk:5, sea_level_risk:5, drought_risk:15, flood_zone:'X', elevation_m:180, green_lease_pct:100, tenant_satisfaction:92, capex_plan_usd_mn:25, retrofit_status:'In Progress', water_intensity:2.80, waste_diversion_pct:55, biodiversity_score:38, regulation:[], lat:41.878, lon:-87.630 },
    { id:'RE-19', name:'Hong Kong Central Office', type:'Office', city:'Hong Kong', country:'HK', gfa_m2:58000, floors:42, year_built:2005, construction:'Steel RC', gav_usd_mn:3800, nav_usd_mn:2500, noi_usd_mn:190, cap_rate:5.0, occupancy_pct:85, wault_years:4.8, rent_psf:135, energy_intensity_kwh:230, carbon_intensity_kgco2:88, scope1:3200, scope2:9500, renewable_pct:8, energy_mix:{grid:82,solar:3,wind:5,gas:7,other:3}, crrem_aligned:false, stranding_year:2030, gresb_score:68, gresb_aspects:{energy:11,ghg:11,water:10,waste:9,biodiversity:8,stakeholder:10,management:9}, certification:'BEAM Plus Gold', cert_level:'Gold', epc_rating:'B', epc_score:65, physical_risk_score:55, flood_risk:45, heat_risk:52, wind_risk:65, wildfire_risk:5, sea_level_risk:50, drought_risk:12, flood_zone:'VE', elevation_m:5, green_lease_pct:45, tenant_satisfaction:74, capex_plan_usd_mn:48, retrofit_status:'Planned', water_intensity:0.52, waste_diversion_pct:58, biodiversity_score:42, regulation:[], lat:22.280, lon:114.158 },
    { id:'RE-20', name:'Madrid Logistics Park', type:'Logistics', city:'Madrid', country:'ES', gfa_m2:82000, floors:1, year_built:2021, construction:'Prefab Steel', gav_usd_mn:350, nav_usd_mn:240, noi_usd_mn:24, cap_rate:6.9, occupancy_pct:100, wault_years:11.0, rent_psf:16, energy_intensity_kwh:100, carbon_intensity_kgco2:30, scope1:600, scope2:2000, renewable_pct:48, energy_mix:{grid:32,solar:28,wind:20,gas:14,other:6}, crrem_aligned:true, stranding_year:2050, gresb_score:80, gresb_aspects:{energy:15,ghg:15,water:12,waste:11,biodiversity:9,stakeholder:9,management:9}, certification:'LEED Gold', cert_level:'Gold', epc_rating:'A', epc_score:80, physical_risk_score:22, flood_risk:10, heat_risk:35, wind_risk:15, wildfire_risk:25, sea_level_risk:5, drought_risk:40, flood_zone:'X', elevation_m:650, green_lease_pct:85, tenant_satisfaction:86, capex_plan_usd_mn:6, retrofit_status:'Complete', water_intensity:0.22, waste_diversion_pct:85, biodiversity_score:68, regulation:['EPBD'], lat:40.417, lon:-3.704 },
    { id:'RE-21', name:'Zurich Prime Office', type:'Office', city:'Zurich', country:'CH', gfa_m2:42000, floors:18, year_built:2018, construction:'Timber Hybrid', gav_usd_mn:950, nav_usd_mn:630, noi_usd_mn:48, cap_rate:5.1, occupancy_pct:95, wault_years:8.0, rent_psf:82, energy_intensity_kwh:125, carbon_intensity_kgco2:15, scope1:300, scope2:1200, renewable_pct:60, energy_mix:{grid:22,solar:28,wind:32,gas:12,other:6}, crrem_aligned:true, stranding_year:2050, gresb_score:90, gresb_aspects:{energy:17,ghg:17,water:14,waste:12,biodiversity:11,stakeholder:10,management:9}, certification:'Minergie-P', cert_level:'P-ECO', epc_rating:'A', epc_score:90, physical_risk_score:15, flood_risk:12, heat_risk:15, wind_risk:10, wildfire_risk:5, sea_level_risk:5, drought_risk:8, flood_zone:'X', elevation_m:408, green_lease_pct:90, tenant_satisfaction:90, capex_plan_usd_mn:12, retrofit_status:'Complete', water_intensity:0.25, waste_diversion_pct:90, biodiversity_score:75, regulation:[], lat:47.377, lon:8.540 },
    { id:'RE-22', name:'Seoul Gangnam Tower', type:'Office', city:'Seoul', country:'KR', gfa_m2:72000, floors:35, year_built:2017, construction:'Steel Frame', gav_usd_mn:1200, nav_usd_mn:790, noi_usd_mn:68, cap_rate:5.7, occupancy_pct:91, wault_years:5.5, rent_psf:52, energy_intensity_kwh:200, carbon_intensity_kgco2:75, scope1:2800, scope2:7500, renewable_pct:15, energy_mix:{grid:72,solar:6,wind:9,gas:10,other:3}, crrem_aligned:false, stranding_year:2032, gresb_score:72, gresb_aspects:{energy:12,ghg:12,water:11,waste:10,biodiversity:8,stakeholder:10,management:9}, certification:'G-SEED Green 1', cert_level:'Green 1', epc_rating:'B', epc_score:68, physical_risk_score:32, flood_risk:28, heat_risk:30, wind_risk:25, wildfire_risk:5, sea_level_risk:15, drought_risk:18, flood_zone:'X', elevation_m:22, green_lease_pct:55, tenant_satisfaction:78, capex_plan_usd_mn:28, retrofit_status:'Planned', water_intensity:0.45, waste_diversion_pct:68, biodiversity_score:48, regulation:[], lat:37.498, lon:127.028 },
    { id:'RE-23', name:'San Francisco Tech Hub', type:'Office', city:'San Francisco', country:'US', gfa_m2:55000, floors:22, year_built:2020, construction:'Steel & Glass', gav_usd_mn:1100, nav_usd_mn:720, noi_usd_mn:62, cap_rate:5.6, occupancy_pct:82, wault_years:5.0, rent_psf:75, energy_intensity_kwh:145, carbon_intensity_kgco2:22, scope1:600, scope2:2200, renewable_pct:55, energy_mix:{grid:28,solar:28,wind:27,gas:12,other:5}, crrem_aligned:true, stranding_year:2048, gresb_score:88, gresb_aspects:{energy:17,ghg:17,water:14,waste:12,biodiversity:10,stakeholder:9,management:9}, certification:'LEED Platinum', cert_level:'Platinum', epc_rating:'A', epc_score:88, physical_risk_score:42, flood_risk:15, heat_risk:18, wind_risk:20, wildfire_risk:55, sea_level_risk:25, drought_risk:45, flood_zone:'X', elevation_m:15, green_lease_pct:82, tenant_satisfaction:86, capex_plan_usd_mn:15, retrofit_status:'Complete', water_intensity:0.32, waste_diversion_pct:85, biodiversity_score:62, regulation:[], lat:37.790, lon:-122.401 },
    { id:'RE-24', name:'Warsaw Resi Complex', type:'Residential', city:'Warsaw', country:'PL', gfa_m2:48000, floors:15, year_built:2024, construction:'Precast Concrete', gav_usd_mn:185, nav_usd_mn:130, noi_usd_mn:12, cap_rate:6.5, occupancy_pct:96, wault_years:5.5, rent_psf:20, energy_intensity_kwh:85, carbon_intensity_kgco2:28, scope1:600, scope2:1600, renewable_pct:35, energy_mix:{grid:48,solar:15,wind:20,gas:12,other:5}, crrem_aligned:true, stranding_year:2050, gresb_score:78, gresb_aspects:{energy:14,ghg:14,water:12,waste:11,biodiversity:9,stakeholder:9,management:9}, certification:'BREEAM Very Good', cert_level:'Very Good', epc_rating:'A', epc_score:78, physical_risk_score:18, flood_risk:15, heat_risk:20, wind_risk:12, wildfire_risk:5, sea_level_risk:5, drought_risk:10, flood_zone:'X', elevation_m:100, green_lease_pct:75, tenant_satisfaction:82, capex_plan_usd_mn:4, retrofit_status:'Complete', water_intensity:0.22, waste_diversion_pct:78, biodiversity_score:65, regulation:['EPBD'], lat:52.230, lon:21.012 },
    { id:'RE-25', name:'Jakarta Mixed-Use Tower', type:'Mixed-Use', city:'Jakarta', country:'ID', gfa_m2:95000, floors:45, year_built:2019, construction:'Reinforced Concrete', gav_usd_mn:680, nav_usd_mn:440, noi_usd_mn:48, cap_rate:7.1, occupancy_pct:84, wault_years:5.0, rent_psf:28, energy_intensity_kwh:250, carbon_intensity_kgco2:92, scope1:4200, scope2:11000, renewable_pct:8, energy_mix:{grid:82,solar:3,wind:5,gas:8,other:2}, crrem_aligned:false, stranding_year:2029, gresb_score:58, gresb_aspects:{energy:9,ghg:9,water:9,waste:8,biodiversity:7,stakeholder:8,management:8}, certification:'Greenship Gold', cert_level:'Gold', epc_rating:'B', epc_score:58, physical_risk_score:62, flood_risk:70, heat_risk:55, wind_risk:25, wildfire_risk:5, sea_level_risk:65, drought_risk:15, flood_zone:'VE', elevation_m:2, green_lease_pct:35, tenant_satisfaction:72, capex_plan_usd_mn:32, retrofit_status:'Planned', water_intensity:0.65, waste_diversion_pct:48, biodiversity_score:38, regulation:[], lat:-6.200, lon:106.845 },
    { id:'RE-26', name:'Boston Life Sciences', type:'Life Sciences', city:'Boston', country:'US', gfa_m2:35000, floors:8, year_built:2023, construction:'Reinforced Concrete', gav_usd_mn:520, nav_usd_mn:350, noi_usd_mn:38, cap_rate:7.3, occupancy_pct:100, wault_years:12.0, rent_psf:95, energy_intensity_kwh:380, carbon_intensity_kgco2:105, scope1:2500, scope2:10000, renewable_pct:25, energy_mix:{grid:58,solar:10,wind:15,gas:12,other:5}, crrem_aligned:false, stranding_year:2031, gresb_score:75, gresb_aspects:{energy:13,ghg:13,water:12,waste:10,biodiversity:8,stakeholder:10,management:9}, certification:'LEED Gold', cert_level:'Gold', epc_rating:'B', epc_score:72, physical_risk_score:28, flood_risk:25, heat_risk:22, wind_risk:35, wildfire_risk:5, sea_level_risk:30, drought_risk:10, flood_zone:'AE', elevation_m:8, green_lease_pct:100, tenant_satisfaction:88, capex_plan_usd_mn:18, retrofit_status:'In Progress', water_intensity:1.20, waste_diversion_pct:72, biodiversity_score:55, regulation:[], lat:42.360, lon:-71.059 },
    { id:'RE-27', name:'Bangalore Tech Park', type:'Office', city:'Bangalore', country:'IN', gfa_m2:120000, floors:12, year_built:2020, construction:'RCC', gav_usd_mn:450, nav_usd_mn:300, noi_usd_mn:35, cap_rate:7.8, occupancy_pct:92, wault_years:6.8, rent_psf:22, energy_intensity_kwh:180, carbon_intensity_kgco2:72, scope1:3200, scope2:8800, renewable_pct:20, energy_mix:{grid:68,solar:10,wind:10,gas:8,other:4}, crrem_aligned:false, stranding_year:2033, gresb_score:70, gresb_aspects:{energy:12,ghg:11,water:11,waste:10,biodiversity:8,stakeholder:9,management:9}, certification:'IGBC Platinum', cert_level:'Platinum', epc_rating:'A', epc_score:75, physical_risk_score:35, flood_risk:40, heat_risk:42, wind_risk:15, wildfire_risk:10, sea_level_risk:5, drought_risk:35, flood_zone:'X', elevation_m:920, green_lease_pct:52, tenant_satisfaction:80, capex_plan_usd_mn:15, retrofit_status:'Planned', water_intensity:0.48, waste_diversion_pct:65, biodiversity_score:52, regulation:[], lat:12.972, lon:77.580 },
    { id:'RE-28', name:'Munich Student Housing', type:'Residential', city:'Munich', country:'DE', gfa_m2:28000, floors:6, year_built:2024, construction:'CLT', gav_usd_mn:165, nav_usd_mn:115, noi_usd_mn:10, cap_rate:6.1, occupancy_pct:99, wault_years:8.0, rent_psf:22, energy_intensity_kwh:80, carbon_intensity_kgco2:18, scope1:200, scope2:700, renewable_pct:58, energy_mix:{grid:25,solar:25,wind:33,gas:10,other:7}, crrem_aligned:true, stranding_year:2050, gresb_score:86, gresb_aspects:{energy:16,ghg:16,water:13,waste:12,biodiversity:10,stakeholder:10,management:9}, certification:'DGNB Gold', cert_level:'Gold', epc_rating:'A', epc_score:86, physical_risk_score:12, flood_risk:10, heat_risk:15, wind_risk:10, wildfire_risk:5, sea_level_risk:5, drought_risk:8, flood_zone:'X', elevation_m:520, green_lease_pct:92, tenant_satisfaction:88, capex_plan_usd_mn:3, retrofit_status:'Complete', water_intensity:0.18, waste_diversion_pct:88, biodiversity_score:72, regulation:['EPBD'], lat:48.137, lon:11.575 },
    { id:'RE-29', name:'Sao Paulo Office Tower', type:'Office', city:'Sao Paulo', country:'BR', gfa_m2:68000, floors:32, year_built:2014, construction:'Reinforced Concrete', gav_usd_mn:420, nav_usd_mn:275, noi_usd_mn:32, cap_rate:7.6, occupancy_pct:82, wault_years:4.2, rent_psf:28, energy_intensity_kwh:195, carbon_intensity_kgco2:28, scope1:1200, scope2:3500, renewable_pct:35, energy_mix:{grid:48,solar:15,wind:20,gas:12,other:5}, crrem_aligned:true, stranding_year:2044, gresb_score:68, gresb_aspects:{energy:11,ghg:11,water:10,waste:10,biodiversity:8,stakeholder:9,management:9}, certification:'LEED Gold', cert_level:'Gold', epc_rating:'B', epc_score:68, physical_risk_score:32, flood_risk:35, heat_risk:32, wind_risk:18, wildfire_risk:15, sea_level_risk:10, drought_risk:25, flood_zone:'X', elevation_m:760, green_lease_pct:45, tenant_satisfaction:74, capex_plan_usd_mn:18, retrofit_status:'Planned', water_intensity:0.42, waste_diversion_pct:62, biodiversity_score:48, regulation:[], lat:-23.551, lon:-46.634 },
    { id:'RE-30', name:'Copenhagen Green Campus', type:'Mixed-Use', city:'Copenhagen', country:'DK', gfa_m2:55000, floors:10, year_built:2025, construction:'Mass Timber + RC', gav_usd_mn:480, nav_usd_mn:330, noi_usd_mn:26, cap_rate:5.4, occupancy_pct:94, wault_years:9.0, rent_psf:52, energy_intensity_kwh:70, carbon_intensity_kgco2:8, scope1:100, scope2:500, renewable_pct:85, energy_mix:{grid:8,solar:35,wind:50,gas:2,other:5}, crrem_aligned:true, stranding_year:2050, gresb_score:96, gresb_aspects:{energy:19,ghg:19,water:15,waste:14,biodiversity:12,stakeholder:10,management:7}, certification:'DGNB Platinum', cert_level:'Platinum', epc_rating:'A+', epc_score:96, physical_risk_score:18, flood_risk:22, heat_risk:10, wind_risk:20, wildfire_risk:5, sea_level_risk:18, drought_risk:5, flood_zone:'X', elevation_m:5, green_lease_pct:98, tenant_satisfaction:95, capex_plan_usd_mn:5, retrofit_status:'Complete', water_intensity:0.12, waste_diversion_pct:96, biodiversity_score:90, regulation:['EPBD'], lat:55.676, lon:12.568 },
  ],
};

function loadStore(key) { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch { return null; } }
function initRE() { let d = loadStore(RE_KEY); if (!d) { d = DEFAULT_RE_PORTFOLIO; localStorage.setItem(RE_KEY, JSON.stringify(d)); } return d; }

const pct = (v, d = 1) => `${v.toFixed(d)}%`;
const fmt = (v, d = 1) => v != null ? v.toFixed(d) : '-';
const fmtB = v => v >= 1000 ? `${(v / 1000).toFixed(1)}B` : `${v.toFixed(0)}M`;

const Badge = ({ children, color = T.navy }) => (<span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}30`, borderRadius: 4, padding: '2px 7px', letterSpacing: 0.3 }}>{children}</span>);
const Card = ({ children, style }) => (<div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20, ...style }}>{children}</div>);
const KPI = ({ label, value, sub, color = T.navy }) => (<div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '12px 14px', minWidth: 120 }}><div style={{ fontSize: 10, color: T.textMut, fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div><div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>{sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{sub}</div>}</div>);
const SortIcon = ({ active, dir }) => (<span style={{ fontSize: 10, marginLeft: 3, opacity: active ? 1 : 0.3 }}>{active ? (dir === 'asc' ? '\u25B2' : '\u25BC') : '\u25B4'}</span>);

const inputS = { padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, color: T.text, background: T.surface, width: '100%', boxSizing: 'border-box', fontFamily: T.font };
const labelS = { fontSize: 10, color: T.textSec, fontWeight: 600, marginBottom: 3, display: 'block', textTransform: 'uppercase', letterSpacing: 0.4 };
const btnS = (bg, c = '#fff') => ({ padding: '8px 16px', borderRadius: 8, border: 'none', background: bg, color: c, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font });

function newProperty(id) {
  return { id, name: '', type: 'Office', city: '', country: 'US', gfa_m2: 0, floors: 1, year_built: 2024, construction: '', gav_usd_mn: 0, nav_usd_mn: 0, noi_usd_mn: 0, cap_rate: 5.5, occupancy_pct: 90, wault_years: 5, rent_psf: 0, energy_intensity_kwh: 150, carbon_intensity_kgco2: 50, scope1: 0, scope2: 0, renewable_pct: 20, energy_mix: { grid: 60, solar: 15, wind: 15, gas: 5, other: 5 }, crrem_aligned: false, stranding_year: 2040, gresb_score: 70, gresb_aspects: { energy: 12, ghg: 12, water: 10, waste: 10, biodiversity: 8, stakeholder: 9, management: 9 }, certification: '', cert_level: '', epc_rating: 'B', epc_score: 65, physical_risk_score: 30, flood_risk: 20, heat_risk: 25, wind_risk: 20, wildfire_risk: 10, sea_level_risk: 15, drought_risk: 15, flood_zone: 'X', elevation_m: 50, green_lease_pct: 60, tenant_satisfaction: 75, capex_plan_usd_mn: 10, retrofit_status: 'Planned', water_intensity: 0.4, waste_diversion_pct: 65, biodiversity_score: 50, regulation: [], lat: 0, lon: 0 };
}

export default function REPortfolioDashboardPage() {
  const nav = useNavigate();
  const [reData, setReData] = useState(initRE);
  const props = reData.properties;
  const infraData = useMemo(() => loadStore(INFRA_KEY), []);
  const equityData = useMemo(() => loadStore(EQUITY_KEY), []);
  const infraAssets = infraData?.assets || [];

  const [sortCol, setSortCol] = useState('gav_usd_mn');
  const [sortDir, setSortDir] = useState('desc');
  const [typeFilter, setTypeFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [epcFilter, setEpcFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [tab, setTab] = useState('dashboard');
  const [editPropId, setEditPropId] = useState(null);
  const [addDraft, setAddDraft] = useState(() => newProperty('RE-31'));
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [targets, setTargets] = useState(() => reData.targets || { energyIntensity2030: 100, carbonIntensity2030: 25, certCoverage2027: 80, gresbScore2027: 80, renewableShare2030: 50 });
  const [portfolioName, setPortfolioName] = useState(reData.portfolioName);
  const [currency, setCurrency] = useState(reData.currency || 'USD');
  const [period, setPeriod] = useState(reData.reportingPeriod || 'FY2026');

  const persist = useCallback((updated) => { setReData(updated); localStorage.setItem(RE_KEY, JSON.stringify(updated)); }, []);

  const updateProperty = useCallback((propId, changes) => {
    const updated = { ...reData, properties: reData.properties.map(p => p.id === propId ? { ...p, ...changes } : p) };
    persist(updated);
  }, [reData, persist]);

  const addProperty = useCallback((prop) => {
    if (!prop.name.trim()) { alert('Property name is required'); return; }
    const nextNum = reData.properties.length + 1;
    const final = { ...prop, id: `RE-${String(nextNum).padStart(2, '0')}` };
    persist({ ...reData, properties: [...reData.properties, final] });
    setAddDraft(newProperty(`RE-${String(nextNum + 1).padStart(2, '0')}`));
    setTab('dashboard');
  }, [reData, persist]);

  const deleteProperty = useCallback((propId) => {
    persist({ ...reData, properties: reData.properties.filter(p => p.id !== propId) });
    setDeleteConfirm(null);
  }, [reData, persist]);

  const saveTargets = useCallback((newTargets) => {
    setTargets(newTargets);
    persist({ ...reData, targets: newTargets });
  }, [reData, persist]);

  const saveConfig = useCallback(() => {
    persist({ ...reData, portfolioName, currency, reportingPeriod: period });
  }, [reData, portfolioName, currency, period, persist]);

  const importSamples = useCallback(() => {
    const samples = [
      { ...newProperty(''), name: 'Oslo Waterfront Office', type: 'Office', city: 'Oslo', country: 'NO', gfa_m2: 48000, floors: 18, year_built: 2024, gav_usd_mn: 520, noi_usd_mn: 32, cap_rate: 6.2, occupancy_pct: 93, energy_intensity_kwh: 90, carbon_intensity_kgco2: 14, gresb_score: 91, epc_rating: 'A', epc_score: 91, crrem_aligned: true, stranding_year: 2050, physical_risk_score: 14, renewable_pct: 72, green_lease_pct: 92, tenant_satisfaction: 90, certification: 'BREEAM Outstanding' },
      { ...newProperty(''), name: 'Milan Retail Centre', type: 'Retail', city: 'Milan', country: 'IT', gfa_m2: 62000, floors: 3, year_built: 2015, gav_usd_mn: 380, noi_usd_mn: 28, cap_rate: 7.4, occupancy_pct: 88, energy_intensity_kwh: 220, carbon_intensity_kgco2: 65, gresb_score: 66, epc_rating: 'B', epc_score: 66, crrem_aligned: false, stranding_year: 2034, physical_risk_score: 28, renewable_pct: 15, green_lease_pct: 45, tenant_satisfaction: 78, certification: 'LEED Silver' },
    ];
    let nextNum = reData.properties.length + 1;
    const news = samples.map(s => { const p = { ...s, id: `RE-${String(nextNum).padStart(2, '0')}` }; nextNum++; return p; });
    persist({ ...reData, properties: [...reData.properties, ...news] });
  }, [reData, persist]);

  const clearPortfolio = useCallback(() => { if (window.confirm('Are you sure you want to remove all properties?')) persist({ ...reData, properties: [] }); }, [reData, persist]);

  const handleSort = col => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };
  const types = useMemo(() => ['All', ...new Set(props.map(p => p.type))], [props]);
  const countries = useMemo(() => ['All', ...new Set(props.map(p => p.country))], [props]);
  const filtered = useMemo(() => {
    let f = props;
    if (typeFilter !== 'All') f = f.filter(p => p.type === typeFilter);
    if (countryFilter !== 'All') f = f.filter(p => p.country === countryFilter);
    if (epcFilter !== 'All') f = f.filter(p => p.epc_rating === epcFilter);
    if (riskFilter !== 'All') { const rMap = { Low: [0, 25], Medium: [25, 40], High: [40, 60], Critical: [60, 101] }; const [lo, hi] = rMap[riskFilter] || [0, 101]; f = f.filter(p => p.physical_risk_score >= lo && p.physical_risk_score < hi); }
    return [...f].sort((a, b) => { const m = sortDir === 'asc' ? 1 : -1; const av = a[sortCol], bv = b[sortCol]; return typeof av === 'number' ? (av - bv) * m : String(av).localeCompare(String(bv)) * m; });
  }, [props, typeFilter, countryFilter, epcFilter, riskFilter, sortCol, sortDir]);

  // KPIs
  const totalGFA = props.reduce((s, p) => s + p.gfa_m2, 0);
  const totalGAV = props.reduce((s, p) => s + p.gav_usd_mn, 0);
  const numCountries = new Set(props.map(p => p.country)).size;
  const avgEnergy = props.length ? props.reduce((s, p) => s + p.energy_intensity_kwh, 0) / props.length : 0;
  const avgCarbon = props.length ? props.reduce((s, p) => s + p.carbon_intensity_kgco2, 0) / props.length : 0;
  const crremPct = props.length ? (props.filter(p => p.crrem_aligned).length / props.length * 100) : 0;
  const avgGresb = props.length ? props.reduce((s, p) => s + p.gresb_score, 0) / props.length : 0;
  const certCoverage = props.length ? (props.filter(p => p.certification).length / props.length * 100) : 0;
  const avgPhysRisk = props.length ? props.reduce((s, p) => s + p.physical_risk_score, 0) / props.length : 0;
  const stranded2030 = props.length ? (props.filter(p => p.stranding_year <= 2030).length / props.length * 100) : 0;
  const avgRenewable = props.length ? props.reduce((s, p) => s + (p.renewable_pct || 0), 0) / props.length : 0;
  const infraInvest = infraAssets.reduce((s, a) => s + (a.total_investment_usd_mn || 0), 0);
  const infraAvoided = infraAssets.reduce((s, a) => s + (a.avoided_emissions_tco2e || 0), 0);
  const greenLeasePct = props.length ? props.reduce((s, p) => s + p.green_lease_pct, 0) / props.length : 0;
  const avgTenantSat = props.length ? props.reduce((s, p) => s + p.tenant_satisfaction, 0) / props.length : 0;

  // Chart data
  const strandingBands = useMemo(() => [{ band: '<2030', min: 0, max: 2030 }, { band: '2030-34', min: 2030, max: 2035 }, { band: '2035-39', min: 2035, max: 2040 }, { band: '2040-44', min: 2040, max: 2045 }, { band: '2045-49', min: 2045, max: 2050 }, { band: '2050+', min: 2050, max: 9999 }].map(b => ({ band: b.band, count: props.filter(p => p.stranding_year >= b.min && p.stranding_year < b.max).length })), [props]);
  const certDistrib = useMemo(() => { const m = {}; props.forEach(p => { const c = p.certification || 'Uncertified'; m[c] = (m[c] || 0) + p.gfa_m2; }); return Object.entries(m).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + '..' : name, value })); }, [props]);
  const physRiskData = useMemo(() => { const keys = ['flood_risk','heat_risk','wind_risk','wildfire_risk','sea_level_risk','drought_risk']; return HAZARD_LABELS.map((label, i) => ({ hazard: label, score: props.length ? Math.round(props.reduce((s, p) => s + p[keys[i]], 0) / props.length) : 0 })); }, [props]);
  const gresbRadar = useMemo(() => { const peer = 72; return GRESB_ASPECTS.map((a, i) => ({ aspect: a, portfolio: Math.round(avgGresb * (0.85 + Math.sin(i * 1.3) * 0.15)), peer: Math.round(peer * (0.9 + Math.cos(i * 0.9) * 0.1)) })); }, [avgGresb]);
  const typeDistrib = useMemo(() => { const m = {}; props.forEach(p => { m[p.type] = (m[p.type] || 0) + p.gfa_m2; }); return Object.entries(m).map(([name, value]) => ({ name, value })); }, [props]);
  const crossAsset = useMemo(() => { const eqH = equityData?.holdings || []; const eqWACI = eqH.length > 0 ? eqH.reduce((s, h) => s + (h.carbon_intensity || h.carbonIntensity || 0) * (h.weight || h.portfolioWeight || 0.01), 0) : 142; const reCI = avgCarbon; const infraCI = infraAssets.length > 0 ? infraAssets.reduce((s, a) => s + a.carbon_intensity, 0) / infraAssets.length : 45; return { eqWACI: eqWACI.toFixed(1), reCI: reCI.toFixed(1), infraCI: infraCI.toFixed(1), combined: ((eqWACI * 0.5 + reCI * 0.3 + infraCI * 0.2)).toFixed(1) }; }, [equityData, avgCarbon, infraAssets]);
  const regulations = useMemo(() => ['MEES','EPBD','Local Law 97','NABERS mandatory','EPC minimum'].map(r => ({ regulation: r, count: props.filter(p => p.regulation.includes(r)).length, properties: props.filter(p => p.regulation.includes(r)).map(p => p.name), jurisdiction: r === 'MEES' ? 'UK' : r === 'EPBD' ? 'EU' : r === 'Local Law 97' ? 'NYC' : r === 'NABERS mandatory' ? 'AU' : 'Various' })), [props]);

  const heatColor = v => v >= 80 ? T.green : v >= 60 ? T.sage : v >= 40 ? T.amber : T.red;
  const riskColor = v => v <= 20 ? T.green : v <= 35 ? T.sage : v <= 50 ? T.amber : T.red;
  const thS = { padding: '7px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', letterSpacing: 0.3, textTransform: 'uppercase' };
  const tdS = { padding: '6px 10px', fontSize: 11, color: T.text, borderBottom: `1px solid ${T.border}` };

  const exportCSV = (rows, filename) => { if (!rows.length) return; const keys = Object.keys(rows[0]); const csv = [keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v; }).join(','))].join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); };
  const exportPortfolio = () => exportCSV(props.map(p => ({ ID: p.id, Name: p.name, Type: p.type, City: p.city, Country: p.country, 'GFA(m2)': p.gfa_m2, 'GAV($M)': p.gav_usd_mn, 'Energy(kWh/m2)': p.energy_intensity_kwh, 'Carbon(kgCO2/m2)': p.carbon_intensity_kgco2, CRREM: p.crrem_aligned, 'Strand Yr': p.stranding_year, GRESB: p.gresb_score, EPC: p.epc_rating, 'Phys Risk': p.physical_risk_score })), 're_portfolio.csv');
  const exportRisk = () => exportCSV(props.map(p => ({ ID: p.id, Name: p.name, 'Phys Risk': p.physical_risk_score, Flood: p.flood_risk, Heat: p.heat_risk, Wind: p.wind_risk, Wildfire: p.wildfire_risk, 'Sea Level': p.sea_level_risk, Drought: p.drought_risk, 'Strand Yr': p.stranding_year })), 're_risk_assessment.csv');
  const exportTemplate = () => { const headers = ['Name','Type','City','Country','GFA_m2','Floors','Year_Built','GAV_USD_Mn','NOI_USD_Mn','Cap_Rate','Occupancy_Pct','Energy_Intensity_kWh','Carbon_Intensity_kgCO2','EPC_Rating','EPC_Score','GRESB_Score','Physical_Risk_Score','Green_Lease_Pct']; const csv = headers.join(',') + '\nExample Office,Office,London,UK,50000,20,2020,500,30,5.5,92,150,45,A,85,80,25,75'; const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 're_portfolio_template.csv'; a.click(); };

  // Quick actions
  const quickActions = [
    { label: 'CRREM Pathways', path: '/crrem-pathways', metric: `${crremPct.toFixed(0)}% aligned`, desc: 'Carbon reduction pathway', color: T.sage },
    { label: 'Physical Risk', path: '/physical-risk', metric: `Avg ${avgPhysRisk.toFixed(0)}/100`, desc: 'Climate hazard exposure', color: T.amber },
    { label: 'Green Certs', path: '/green-certifications', metric: `${certCoverage.toFixed(0)}% covered`, desc: 'LEED, BREEAM, NABERS', color: T.green },
    { label: 'Stranded Assets', path: '/stranded-assets', metric: `${stranded2030.toFixed(0)}% by 2030`, desc: 'Transition risk', color: T.red },
    { label: 'Infra ESG DD', path: '/infra-esg-dd', metric: `${infraAssets.length} assets`, desc: 'IFC PS, EP IV', color: T.navy },
  ];

  // Editor form
  const renderPropForm = (prop, onChange) => {
    const set = (f, v) => onChange({ ...prop, [f]: v });
    const setNum = (f, v) => onChange({ ...prop, [f]: Number(v) || 0 });
    const field = (label, f, type = 'text', opts) => (
      <div style={{ marginBottom: 10 }}>
        <label style={labelS}>{label}</label>
        {type === 'select' ? <select value={prop[f] || ''} onChange={e => set(f, e.target.value)} style={inputS}>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select>
        : type === 'checkbox' ? <input type="checkbox" checked={!!prop[f]} onChange={e => set(f, e.target.checked)} />
        : <input type={type} value={prop[f] ?? ''} onChange={e => type === 'number' ? setNum(f, e.target.value) : set(f, e.target.value)} style={inputS} />}
      </div>
    );
    return (
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Identity</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {field('Name', 'name')}{field('Type', 'type', 'select', PROP_TYPES)}{field('City', 'city')}{field('Country', 'country', 'select', COUNTRIES_RE)}{field('Year Built', 'year_built', 'number')}{field('GFA (m2)', 'gfa_m2', 'number')}{field('Floors', 'floors', 'number')}{field('Construction', 'construction')}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Energy & Carbon</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {field('Energy (kWh/m2)', 'energy_intensity_kwh', 'number')}{field('Carbon (kgCO2/m2)', 'carbon_intensity_kgco2', 'number')}{field('Scope 1 tCO2e', 'scope1', 'number')}{field('Scope 2 tCO2e', 'scope2', 'number')}{field('Renewable %', 'renewable_pct', 'number')}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Financial</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {field('GAV ($M)', 'gav_usd_mn', 'number')}{field('NOI ($M)', 'noi_usd_mn', 'number')}{field('Occupancy %', 'occupancy_pct', 'number')}{field('WAULT yrs', 'wault_years', 'number')}{field('Rent PSF', 'rent_psf', 'number')}{field('Green Lease %', 'green_lease_pct', 'number')}{field('Cap Rate %', 'cap_rate', 'number')}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>EPC & GRESB</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {field('EPC Rating', 'epc_rating', 'select', EPC_RATINGS)}{field('EPC Score', 'epc_score', 'number')}{field('GRESB Score', 'gresb_score', 'number')}{field('Certification', 'certification')}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Physical Risk</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {['flood_risk','heat_risk','wind_risk','wildfire_risk','sea_level_risk','drought_risk'].map((k, i) => (
            <div key={k} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span style={{ fontWeight: 600 }}>{HAZARD_LABELS[i]}</span><span style={{ fontWeight: 700, color: riskColor(prop[k]) }}>{prop[k]}</span></div>
              <input type="range" min={0} max={100} value={prop[k] || 0} onChange={e => setNum(k, e.target.value)} style={{ width: '100%', accentColor: riskColor(prop[k]) }} />
            </div>
          ))}
          {field('Flood Zone', 'flood_zone')}{field('Elevation (m)', 'elevation_m', 'number')}{field('Physical Risk Score', 'physical_risk_score', 'number')}
        </div>
      </div>
    );
  };

  const tabs = [{ id: 'dashboard', label: 'Dashboard' }, { id: 'manager', label: 'Portfolio Manager' }, { id: 'addprop', label: 'Add Property' }, { id: 'targets', label: 'Targets' }, { id: 'crossasset', label: 'Cross-Asset View' }];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px 60px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.navy, letterSpacing: -0.5 }}>Real Estate & Infrastructure Portfolio Dashboard</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{portfolioName} | {period} | {currency}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge color={T.navy}>Hub</Badge>
          <Badge color={T.gold}>{props.length} Properties</Badge>
          <Badge color={T.sage}>{infraAssets.length} Infra</Badge>
          <Badge color={T.navyL}>Cross-Asset</Badge>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {tabs.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0', border: `1px solid ${tab === t.id ? T.navy : T.border}`, borderBottom: tab === t.id ? `2px solid ${T.surface}` : 'none', background: tab === t.id ? T.surface : 'transparent', color: tab === t.id ? T.navy : T.textSec, fontSize: 12, fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer', fontFamily: T.font, marginBottom: -2 }}>{t.label}</button>))}
      </div>

      {/* ============== DASHBOARD TAB ============== */}
      {tab === 'dashboard' && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10, marginBottom: 10 }}>
            <KPI label="Total GFA" value={`${(totalGFA / 1e6).toFixed(2)}M`} sub="m2 gross floor" />
            <KPI label="Total GAV" value={`$${fmtB(totalGAV)}`} sub={`${currency} portfolio`} color={T.gold} />
            <KPI label="Properties" value={props.length} sub={`${numCountries} countries`} />
            <KPI label="Avg Energy" value={fmt(avgEnergy, 0)} sub="kWh/m2/yr" color={avgEnergy < 180 ? T.sage : T.amber} />
            <KPI label="Avg Carbon" value={fmt(avgCarbon, 0)} sub="kgCO2/m2/yr" color={avgCarbon < 55 ? T.sage : T.amber} />
            <KPI label="CRREM Aligned" value={pct(crremPct, 0)} sub="1.5C pathway" color={crremPct >= 50 ? T.green : T.red} />
            <KPI label="GRESB Score" value={fmt(avgGresb, 0)} sub="/100 avg" color={T.navyL} />
            <KPI label="Cert Coverage" value={pct(certCoverage, 0)} sub="of GFA certified" color={T.sage} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10, marginBottom: 24 }}>
            <KPI label="Physical Risk" value={fmt(avgPhysRisk, 0)} sub="/100 avg" color={avgPhysRisk < 35 ? T.green : T.amber} />
            <KPI label="Stranded <2030" value={pct(stranded2030, 0)} sub="at risk" color={stranded2030 > 15 ? T.red : T.green} />
            <KPI label="Infra Invest" value={`$${fmtB(infraInvest)}`} sub={`${infraAssets.length} assets`} color={T.gold} />
            <KPI label="Infra Avoided" value={`${(infraAvoided / 1e6).toFixed(1)}M`} sub="tCO2e/yr" color={T.sage} />
            <KPI label="Renewable %" value={pct(avgRenewable, 0)} sub="avg share" color={avgRenewable >= 40 ? T.green : T.amber} />
            <KPI label="Green Lease" value={pct(greenLeasePct, 0)} sub="avg %" color={T.sage} />
            <KPI label="Countries" value={numCountries} sub="markets" />
            <KPI label="Tenant Satis." value={fmt(avgTenantSat, 0)} sub="/100 avg" color={avgTenantSat >= 80 ? T.green : T.amber} />
          </div>

          {/* Carbon Pathway */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Portfolio Carbon Pathway vs CRREM 1.5C</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>kgCO2/m2/yr trajectory</div>
            <ResponsiveContainer width="100%" height={280}><AreaChart data={CRREM_PATHWAY}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} /><YAxis tick={{ fontSize: 11, fill: T.textSec }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /><Area type="monotone" dataKey="target" name="CRREM 1.5C" stroke={T.green} fill={T.green} fillOpacity={0.12} strokeDasharray="5 5" /><Area type="monotone" dataKey="portfolio" name="Portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.15} /><ReferenceLine x={2026} stroke={T.gold} strokeDasharray="3 3" label={{ value: 'Current', fill: T.gold, fontSize: 10 }} /></AreaChart></ResponsiveContainer>
          </Card>

          {/* Stranding + Cert */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Stranding Year Distribution</div>
              <ResponsiveContainer width="100%" height={260}><BarChart data={strandingBands}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="band" tick={{ fontSize: 11, fill: T.textSec }} /><YAxis tick={{ fontSize: 11, fill: T.textSec }} allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Properties" radius={[4, 4, 0, 0]}>{strandingBands.map((_, i) => <Cell key={i} fill={i < 2 ? T.red : i < 4 ? T.amber : T.green} />)}</Bar></BarChart></ResponsiveContainer>
            </Card>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Certification Coverage (by GFA)</div>
              <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={certDistrib} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: T.textMut }}>{certDistrib.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={v => `${(v / 1000).toFixed(0)}K m2`} /></PieChart></ResponsiveContainer>
            </Card>
          </div>

          {/* Physical Risk + GRESB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Physical Risk Heatmap</div>
              {physRiskData.map(h => (<div key={h.hazard} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}><div style={{ width: 100, fontSize: 12, color: T.textSec, fontWeight: 600 }}>{h.hazard}</div><div style={{ flex: 1, height: 22, background: T.surfaceH, borderRadius: 6, overflow: 'hidden', position: 'relative' }}><div style={{ width: `${h.score}%`, height: '100%', background: riskColor(h.score), borderRadius: 6 }} /><span style={{ position: 'absolute', right: 8, top: 2, fontSize: 11, fontWeight: 700, color: T.text }}>{h.score}/100</span></div></div>))}
            </Card>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>GRESB Performance vs Peer</div>
              <ResponsiveContainer width="100%" height={280}><RadarChart data={gresbRadar}><PolarGrid stroke={T.border} /><PolarAngleAxis dataKey="aspect" tick={{ fontSize: 10, fill: T.textSec }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} /><Radar name="Portfolio" dataKey="portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.2} /><Radar name="Peer" dataKey="peer" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeDasharray="4 4" /><Legend wrapperStyle={{ fontSize: 11 }} /><Tooltip /></RadarChart></ResponsiveContainer>
            </Card>
          </div>

          {/* Type Distribution + Cross-Asset */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Property Type Distribution (by GFA)</div>
              <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={typeDistrib} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: T.textMut }}>{typeDistrib.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={v => `${(v / 1000).toFixed(0)}K m2`} /></PieChart></ResponsiveContainer>
            </Card>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Cross-Asset Carbon Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                {[{ label: 'Equity WACI', value: crossAsset.eqWACI, unit: 'tCO2e/$M rev', color: T.navy }, { label: 'RE Carbon', value: crossAsset.reCI, unit: 'kgCO2/m2/yr', color: T.gold }, { label: 'Infra Carbon', value: crossAsset.infraCI, unit: 'tCO2e/GWh', color: T.sage }, { label: 'Combined', value: crossAsset.combined, unit: 'weighted blend', color: T.navyL }].map(c => (
                  <div key={c.label} style={{ padding: 14, borderRadius: 10, border: `1px solid ${T.border}`, background: `${c.color}06`, cursor: 'pointer' }} onClick={() => setTab('crossasset')}>
                    <div style={{ fontSize: 10, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>{c.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: c.color, margin: '4px 0' }}>{c.value}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.unit}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
            {quickActions.map(q => (<div key={q.label} onClick={() => nav(q.path)} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 14px', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.borderColor = q.color; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}><div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{q.label}</div><div style={{ fontSize: 18, fontWeight: 800, color: q.color, marginBottom: 4 }}>{q.metric}</div><div style={{ fontSize: 10, color: T.textSec }}>{q.desc}</div></div>))}
          </div>

          {/* Regulatory */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Regulatory Exposure</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={thS}>Regulation</th><th style={thS}>Jurisdiction</th><th style={{ ...thS, textAlign: 'center' }}>Exposed</th><th style={thS}>Affected</th></tr></thead><tbody>{regulations.map(r => (<tr key={r.regulation} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><td style={{ ...tdS, fontWeight: 700 }}><Badge color={T.navy}>{r.regulation}</Badge></td><td style={tdS}>{r.jurisdiction}</td><td style={{ ...tdS, textAlign: 'center', fontWeight: 700, color: r.count > 0 ? T.amber : T.textMut }}>{r.count}</td><td style={{ ...tdS, fontSize: 10 }}>{r.properties.join(', ') || '-'}</td></tr>))}</tbody></table>
          </Card>

          {/* Property Table */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Property Portfolio ({filtered.length}/{props.length})</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setTab('addprop')} style={btnS(T.green)}>+ Add Property</button>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inputS, width: 'auto' }}>{types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}</select>
                <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ ...inputS, width: 'auto' }}>{countries.map(c => <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>)}</select>
                <select value={epcFilter} onChange={e => setEpcFilter(e.target.value)} style={{ ...inputS, width: 'auto' }}><option value="All">All EPC</option>{EPC_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}</select>
                <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ ...inputS, width: 'auto' }}><option value="All">All Risk</option>{['Low','Medium','High','Critical'].map(r => <option key={r} value={r}>{r}</option>)}</select>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1600 }}><thead><tr>{[['id','ID'],['name','Property'],['type','Type'],['city','City'],['country','Cty'],['gfa_m2','GFA(m2)'],['gav_usd_mn','GAV($M)'],['occupancy_pct','Occ%'],['energy_intensity_kwh','Energy'],['carbon_intensity_kgco2','Carbon'],['epc_rating','EPC'],['crrem_aligned','CRREM'],['stranding_year','Strand'],['gresb_score','GRESB'],['physical_risk_score','Risk'],['green_lease_pct','GrnLse%']].map(([col, label]) => (<th key={col} style={thS} onClick={() => handleSort(col)}>{label}<SortIcon active={sortCol === col} dir={sortDir} /></th>))}<th style={thS}>Actions</th></tr></thead><tbody>{filtered.map(p => (<tr key={p.id} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><td style={{ ...tdS, fontWeight: 600, fontSize: 10 }}>{p.id}</td><td style={{ ...tdS, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td><td style={tdS}><Badge color={T.navyL}>{p.type}</Badge></td><td style={{ ...tdS, fontSize: 10 }}>{p.city}</td><td style={{ ...tdS, fontSize: 10 }}>{p.country}</td><td style={{ ...tdS, textAlign: 'right' }}>{(p.gfa_m2 / 1000).toFixed(0)}K</td><td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>${p.gav_usd_mn.toLocaleString()}</td><td style={{ ...tdS, textAlign: 'right' }}><span style={{ color: p.occupancy_pct >= 90 ? T.green : p.occupancy_pct >= 80 ? T.amber : T.red, fontWeight: 600 }}>{p.occupancy_pct}%</span></td><td style={{ ...tdS, textAlign: 'right' }}>{p.energy_intensity_kwh}</td><td style={{ ...tdS, textAlign: 'right' }}><span style={{ color: p.carbon_intensity_kgco2 < 40 ? T.green : p.carbon_intensity_kgco2 < 80 ? T.amber : T.red, fontWeight: 600 }}>{p.carbon_intensity_kgco2}</span></td><td style={{ ...tdS, textAlign: 'center', fontWeight: 700 }}>{p.epc_rating}</td><td style={{ ...tdS, textAlign: 'center' }}>{p.crrem_aligned ? <Badge color={T.green}>Yes</Badge> : <Badge color={T.red}>No</Badge>}</td><td style={{ ...tdS, textAlign: 'center' }}><span style={{ fontWeight: 700, color: p.stranding_year <= 2030 ? T.red : p.stranding_year <= 2040 ? T.amber : T.green }}>{p.stranding_year}</span></td><td style={{ ...tdS, textAlign: 'center' }}><span style={{ padding: '2px 6px', borderRadius: 4, background: `${p.gresb_score >= 80 ? T.green : p.gresb_score >= 65 ? T.amber : T.red}18`, color: p.gresb_score >= 80 ? T.green : p.gresb_score >= 65 ? T.amber : T.red, fontWeight: 700, fontSize: 11 }}>{p.gresb_score}</span></td><td style={{ ...tdS, textAlign: 'center' }}><span style={{ padding: '2px 6px', borderRadius: 4, background: `${riskColor(p.physical_risk_score)}18`, color: riskColor(p.physical_risk_score), fontWeight: 600, fontSize: 10 }}>{p.physical_risk_score}</span></td><td style={{ ...tdS, textAlign: 'right' }}>{p.green_lease_pct}%</td><td style={tdS}><div style={{ display: 'flex', gap: 4 }}><button onClick={() => { setEditPropId(p.id); setTab('manager'); }} style={{ ...btnS(T.navyL), padding: '4px 8px', fontSize: 10 }}>Edit</button><button onClick={() => setDeleteConfirm(p.id)} style={{ ...btnS(T.red), padding: '4px 8px', fontSize: 10 }}>Del</button></div></td></tr>))}</tbody></table></div>
          </Card>

          {/* Exports + Cross-nav */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>{[{ label: 'Export Portfolio', fn: exportPortfolio }, { label: 'Export Risk', fn: exportRisk }, { label: 'Download Template', fn: exportTemplate }].map(b => (<button key={b.label} onClick={b.fn} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = T.surface}>{b.label}</button>))}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{[{ label: 'CRREM', path: '/crrem-pathways', bg: T.sage }, { label: 'Physical Risk', path: '/physical-risk', bg: T.amber }, { label: 'Green Certs', path: '/green-certifications', bg: T.green }, { label: 'Stranded', path: '/stranded-assets', bg: T.red }, { label: 'Infra DD', path: '/infra-esg-dd', bg: T.navy }, { label: 'Equity', path: '/portfolio', bg: T.navyL }].map(b => (<button key={b.label} onClick={() => nav(b.path)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: b.bg, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{b.label}</button>))}</div>
            </div>
          </Card>
        </>
      )}

      {/* ============== PORTFOLIO MANAGER TAB ============== */}
      {tab === 'manager' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>Portfolio Manager</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={editPropId || (props[0]?.id || '')} onChange={e => setEditPropId(e.target.value)} style={{ ...inputS, width: 260 }}>{props.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}</select>
              <button onClick={() => setTab('addprop')} style={btnS(T.green)}>+ New</button>
              <button onClick={importSamples} style={{ ...btnS(T.navyL), fontSize: 11 }}>Import Samples</button>
              <button onClick={clearPortfolio} style={{ ...btnS(T.red), fontSize: 11 }}>Clear All</button>
            </div>
          </div>
          {/* Config */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20, padding: 14, background: `${T.navy}06`, borderRadius: 10 }}>
            <div><label style={labelS}>Portfolio Name</label><input value={portfolioName} onChange={e => setPortfolioName(e.target.value)} onBlur={saveConfig} style={inputS} /></div>
            <div><label style={labelS}>Currency</label><select value={currency} onChange={e => { setCurrency(e.target.value); }} onBlur={saveConfig} style={inputS}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label style={labelS}>Reporting Period</label><select value={period} onChange={e => { setPeriod(e.target.value); }} onBlur={saveConfig} style={inputS}>{PERIODS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          </div>
          {/* Edit form */}
          {(() => {
            const p = props.find(x => x.id === (editPropId || props[0]?.id));
            if (!p) return <div style={{ color: T.textMut, padding: 20 }}>No properties to edit. Add a property first.</div>;
            return (
              <>
                {renderPropForm(p, changes => updateProperty(p.id, changes))}
                <div style={{ marginTop: 16 }}><button onClick={() => setDeleteConfirm(p.id)} style={btnS(T.red)}>Delete Property</button></div>
              </>
            );
          })()}
        </Card>
      )}

      {/* ============== ADD PROPERTY TAB ============== */}
      {tab === 'addprop' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>+ Add New Property</div>
            <button onClick={() => setTab('dashboard')} style={btnS(T.textMut)}>Cancel</button>
          </div>
          {renderPropForm(addDraft, setAddDraft)}
          <div style={{ marginTop: 16 }}><button onClick={() => addProperty(addDraft)} style={btnS(T.green)}>Save New Property</button></div>
        </Card>
      )}

      {/* ============== TARGETS TAB ============== */}
      {tab === 'targets' && (
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 20 }}>Portfolio Targets & Tracking</div>
          {[
            { key: 'energyIntensity2030', label: 'Energy Intensity 2030 Target (kWh/m2)', current: avgEnergy, unit: 'kWh/m2', lower: true },
            { key: 'carbonIntensity2030', label: 'Carbon Intensity 2030 Target (kgCO2/m2)', current: avgCarbon, unit: 'kgCO2/m2', lower: true },
            { key: 'certCoverage2027', label: 'Certification Coverage 2027 Target (%)', current: certCoverage, unit: '%', lower: false },
            { key: 'gresbScore2027', label: 'GRESB Score 2027 Target (/100)', current: avgGresb, unit: '/100', lower: false },
            { key: 'renewableShare2030', label: 'Renewable Share 2030 Target (%)', current: avgRenewable, unit: '%', lower: false },
          ].map(t => {
            const target = targets[t.key];
            const progress = t.lower ? (target > 0 ? Math.min(100, (1 - (t.current - target) / Math.max(t.current, 1)) * 100) : 100) : (target > 0 ? Math.min(100, t.current / target * 100) : 0);
            const onTrack = t.lower ? t.current <= target : t.current >= target;
            return (
              <div key={t.key} style={{ marginBottom: 20, padding: 16, background: `${onTrack ? T.green : T.amber}06`, borderRadius: 10, border: `1px solid ${onTrack ? T.green : T.amber}20` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t.label}</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: T.textSec }}>Current: <b style={{ color: onTrack ? T.green : T.amber }}>{fmt(t.current, 1)}</b> {t.unit}</span>
                    <label style={{ fontSize: 11, color: T.textSec }}>Target:</label>
                    <input type="number" value={target} onChange={e => { const v = Number(e.target.value) || 0; saveTargets({ ...targets, [t.key]: v }); }} style={{ ...inputS, width: 80 }} />
                  </div>
                </div>
                <div style={{ height: 10, background: T.surfaceH, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(0, Math.min(100, progress))}%`, height: '100%', background: onTrack ? T.green : T.amber, borderRadius: 5, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4, textAlign: 'right' }}>{onTrack ? 'On Track' : 'Behind Target'} ({Math.max(0, progress).toFixed(0)}%)</div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ============== CROSS-ASSET TAB ============== */}
      {tab === 'crossasset' && (
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 20 }}>Cross-Asset-Class View</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Equity Portfolio', count: equityData?.holdings?.length || 0, metric: `WACI: ${crossAsset.eqWACI}`, unit: 'tCO2e/$M rev', color: T.navy, path: '/portfolio', source: 'ra_portfolio_v1' },
              { label: 'RE Portfolio', count: props.length, metric: `CI: ${crossAsset.reCI}`, unit: 'kgCO2/m2/yr', color: T.gold, path: null, source: 'ra_re_portfolio_v1' },
              { label: 'Infra Portfolio', count: infraAssets.length, metric: `CI: ${crossAsset.infraCI}`, unit: 'tCO2e/GWh avg', color: T.sage, path: '/infra-esg-dd', source: 'ra_infra_portfolio_v1' },
            ].map(c => (
              <div key={c.label} style={{ padding: 20, borderRadius: 12, border: `1px solid ${T.border}`, background: `${c.color}06`, cursor: c.path ? 'pointer' : 'default' }} onClick={() => c.path && nav(c.path)}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.count}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{c.metric} {c.unit}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.color, marginTop: 8 }}>Scope 1+2: {c.label === 'Equity Portfolio' ? `${(equityData?.holdings || []).reduce((s, h) => s + (h.scope1 || 0) + (h.scope2 || 0), 0).toLocaleString() || 'N/A'}` : c.label === 'RE Portfolio' ? `${props.reduce((s, p) => s + (p.scope1 || 0) + (p.scope2 || 0), 0).toLocaleString()} tCO2e` : `${infraAssets.reduce((s, a) => s + (a.scope1_tco2e || 0) + (a.scope2_tco2e || 0), 0).toLocaleString()} tCO2e`}</div>
                <div style={{ fontSize: 9, color: T.textMut, marginTop: 4 }}>Source: {c.source}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: `2px solid ${T.navy}20`, background: `${T.navy}04` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Combined Carbon Footprint</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.navy }}>{crossAsset.combined}</div>
            <div style={{ fontSize: 12, color: T.textSec }}>Weighted blend (Equity 50% / RE 30% / Infra 20%)</div>
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Total RE Scope 1+2: {props.reduce((s, p) => s + (p.scope1 || 0) + (p.scope2 || 0), 0).toLocaleString()} tCO2e | Total Infra Scope 1+2: {infraAssets.reduce((s, a) => s + (a.scope1_tco2e || 0) + (a.scope2_tco2e || 0), 0).toLocaleString()} tCO2e</div>
          </div>
        </Card>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: T.surface, borderRadius: 14, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.red, marginBottom: 12 }}>Delete Property</div>
            <div style={{ fontSize: 13, color: T.text, marginBottom: 20 }}>Are you sure you want to delete <b>{props.find(p => p.id === deleteConfirm)?.name}</b>? This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ ...btnS(T.surface, T.text), border: `1px solid ${T.border}` }}>Cancel</button>
              <button onClick={() => deleteProperty(deleteConfirm)} style={btnS(T.red)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
