import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const STORAGE_KEY = 'ra_infra_portfolio_v1';
const PIE_COLORS = [T.navy, T.gold, T.sage, T.navyL, T.goldL, T.sageL, '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];
const EP_COLORS = { A: T.red, B: T.amber, C: T.green };
const SDG_NAMES = { 1:'No Poverty',2:'Zero Hunger',3:'Good Health',4:'Quality Education',5:'Gender Equality',6:'Clean Water',7:'Affordable Energy',8:'Decent Work',9:'Industry & Innovation',10:'Reduced Inequalities',11:'Sustainable Cities',12:'Responsible Consumption',13:'Climate Action',14:'Life Below Water',15:'Life on Land',16:'Peace & Justice',17:'Partnerships' };
const ASSET_TYPES = ['Solar','Wind','Toll Road','Port','Airport','Water','Telecom','Mining','Storage','Geothermal','Hydro','Rail','Waste-to-Energy','Gas Pipeline'];
const COUNTRIES = ['India','UK','Germany','Kenya','Indonesia','Chile','UAE','Brazil','Vietnam','South Africa','Morocco','Philippines','Egypt','Colombia','Thailand','Nigeria','Mexico','Australia','Japan','Canada'];

const DD_ITEMS = {
  environmental: ['Environmental Impact Assessment (EIA)','GHG Emissions Baseline & Projections','Biodiversity Impact Assessment','Water Resource Impact','Air Quality Assessment','Noise & Vibration Study','Waste Management Plan','Soil & Groundwater Contamination','Hazardous Materials Management','Decommissioning & Rehabilitation Plan','Climate Change Vulnerability','Ecosystem Services Impact','Marine/Coastal Impact','Land Use Change Analysis','Environmental Monitoring Plan'],
  social: ['Stakeholder Engagement Plan','Community Health & Safety','Land Acquisition & Resettlement','Indigenous Peoples Assessment','Labor & Working Conditions','Gender Impact Assessment','Supply Chain Labor Audit','Community Benefit Sharing Plan','Grievance Mechanism','Cultural Heritage Impact','Influx Management Plan','Security & Human Rights','Livelihood Restoration Plan','Gender-Based Violence Risk','Community Investment Plan'],
  governance: ['Anti-Corruption & Anti-Bribery','Procurement & Contract Transparency','Tax & Royalty Compliance','Regulatory Permits & Licenses','Board ESG Oversight','Whistleblower Protection','Conflict of Interest Policy','Data Privacy & Cybersecurity','Insurance & Risk Transfer','ESG Reporting & Disclosure'],
};

const DEFAULT_INFRA_PORTFOLIO = {
  portfolioName: 'AA Impact Infra Fund I', currency: 'USD', lastUpdated: '2026-03-25',
  assets: [
    { id:'INF-01', name:'Rajasthan Solar Park', type:'Solar', subtype:'Utility-Scale PV', country:'India', city:'Jaisalmer', lat:26.917, lon:70.917, sponsor:'Azure Power', concession_years:25, installed_capacity:500, capacity_unit:'MW', capacity_factor_pct:22, annual_output_gwh:964, total_investment_usd_mn:380, equity_usd_mn:114, debt_usd_mn:266, irr_target_pct:14.5, annual_revenue_usd_mn:52, opex_usd_mn:8.5, scope1_tco2e:0, scope2_tco2e:450, avoided_emissions_tco2e:680000, carbon_intensity:0.47, environmental_score:85, social_score:68, governance_score:72, composite_esg:76, ifc_ps:{ps1:82,ps2:75,ps3:88,ps4:70,ps5:85,ps6:78,ps7:72,ps8:80}, ep_category:'B', ep_rationale:'Significant but manageable environmental impacts; large land area', community_impact_score:72, jobs_created:1200, local_procurement_pct:45, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[7,13,9], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,true,true,false,true,true,true,false,true,true,true,false,true], social:[true,true,true,false,true,true,true,false,true,true,true,true,false,true,true], governance:[true,true,true,true,true,false,true,true,true,true]}, blended_finance:{equity_pct:30,commercial_debt_pct:50,dfi_pct:15,concessional_pct:5}, dd_meta:{} },
    { id:'INF-02', name:'North Sea Offshore Wind', type:'Wind', subtype:'Offshore Fixed', country:'UK', city:'Hull', lat:53.95, lon:1.45, sponsor:'Orsted', concession_years:30, installed_capacity:1200, capacity_unit:'MW', capacity_factor_pct:42, annual_output_gwh:4415, total_investment_usd_mn:4800, equity_usd_mn:1440, debt_usd_mn:3360, irr_target_pct:9.5, annual_revenue_usd_mn:520, opex_usd_mn:85, scope1_tco2e:200, scope2_tco2e:1800, avoided_emissions_tco2e:2200000, carbon_intensity:0.45, environmental_score:82, social_score:78, governance_score:85, composite_esg:82, ifc_ps:{ps1:88,ps2:82,ps3:90,ps4:85,ps5:78,ps6:85,ps7:80,ps8:88}, ep_category:'B', ep_rationale:'Marine environmental impact requires mitigation; significant community benefit', community_impact_score:82, jobs_created:3500, local_procurement_pct:55, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[7,13,14,9], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], social:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], governance:[true,true,true,true,true,true,true,true,true,true]}, blended_finance:{equity_pct:30,commercial_debt_pct:60,dfi_pct:8,concessional_pct:2}, dd_meta:{} },
    { id:'INF-03', name:'Mumbai-Pune Expressway', type:'Toll Road', subtype:'Expressway', country:'India', city:'Mumbai', lat:19.076, lon:72.878, sponsor:'IRB Infra', concession_years:30, installed_capacity:94, capacity_unit:'km', capacity_factor_pct:85, annual_output_gwh:0, total_investment_usd_mn:850, equity_usd_mn:255, debt_usd_mn:595, irr_target_pct:12.0, annual_revenue_usd_mn:120, opex_usd_mn:18, scope1_tco2e:2500, scope2_tco2e:1200, avoided_emissions_tco2e:0, carbon_intensity:30.9, environmental_score:55, social_score:62, governance_score:68, composite_esg:62, ifc_ps:{ps1:65,ps2:68,ps3:72,ps4:58,ps5:72,ps6:62,ps7:55,ps8:68}, ep_category:'A', ep_rationale:'Major land acquisition, forest clearing, high traffic volume', community_impact_score:58, jobs_created:2800, local_procurement_pct:65, resettlement_required:true, indigenous_impact:'Minor tribal land adjacent', sdg_alignment:[9,11], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,false,true,true,false,true,false,true,false,true,true,false,true,false], social:[true,true,false,true,true,false,true,false,true,true,false,true,false,true,false], governance:[true,true,true,true,false,true,true,false,true,true]}, blended_finance:{equity_pct:30,commercial_debt_pct:70,dfi_pct:0,concessional_pct:0}, dd_meta:{} },
    { id:'INF-04', name:'Nhava Sheva Container Port', type:'Port', subtype:'Container Terminal', country:'India', city:'Mumbai', lat:18.951, lon:72.952, sponsor:'DP World', concession_years:30, installed_capacity:5, capacity_unit:'M TEU', capacity_factor_pct:78, annual_output_gwh:0, total_investment_usd_mn:1200, equity_usd_mn:360, debt_usd_mn:840, irr_target_pct:11.0, annual_revenue_usd_mn:180, opex_usd_mn:42, scope1_tco2e:18000, scope2_tco2e:8500, avoided_emissions_tco2e:0, carbon_intensity:147.2, environmental_score:52, social_score:65, governance_score:70, composite_esg:62, ifc_ps:{ps1:62,ps2:65,ps3:68,ps4:55,ps5:70,ps6:58,ps7:52,ps8:65}, ep_category:'A', ep_rationale:'Major coastal development, dredging, air quality impact', community_impact_score:55, jobs_created:4200, local_procurement_pct:50, resettlement_required:true, indigenous_impact:'Fishing community displacement', sdg_alignment:[9,8], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,false,true,false,false,true,false,true,false,true,false,true,false,true], social:[true,false,true,true,false,true,false,true,true,false,true,false,true,true,false], governance:[true,true,false,true,true,true,false,true,true,true]}, blended_finance:{equity_pct:30,commercial_debt_pct:65,dfi_pct:5,concessional_pct:0}, dd_meta:{} },
    { id:'INF-05', name:'Frankfurt Airport Terminal 3', type:'Airport', subtype:'Passenger Terminal', country:'Germany', city:'Frankfurt', lat:50.033, lon:8.570, sponsor:'Fraport AG', concession_years:40, installed_capacity:25, capacity_unit:'M pax', capacity_factor_pct:72, annual_output_gwh:0, total_investment_usd_mn:4200, equity_usd_mn:1680, debt_usd_mn:2520, irr_target_pct:8.5, annual_revenue_usd_mn:680, opex_usd_mn:120, scope1_tco2e:35000, scope2_tco2e:28000, avoided_emissions_tco2e:0, carbon_intensity:92.6, environmental_score:62, social_score:75, governance_score:82, composite_esg:72, ifc_ps:{ps1:78,ps2:80,ps3:82,ps4:72,ps5:75,ps6:70,ps7:68,ps8:78}, ep_category:'A', ep_rationale:'Major infrastructure with noise, emissions, land use impacts', community_impact_score:68, jobs_created:8500, local_procurement_pct:72, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[9,11,8], status:'Construction', construction_pct:82, dd_checklist:{environmental:[true,true,true,true,true,true,true,false,true,true,true,true,false,true,true], social:[true,true,true,true,true,true,true,true,true,false,true,true,true,true,true], governance:[true,true,true,true,true,true,true,true,true,true]}, blended_finance:{equity_pct:40,commercial_debt_pct:55,dfi_pct:5,concessional_pct:0}, dd_meta:{} },
    { id:'INF-06', name:'Nairobi Water Treatment', type:'Water', subtype:'Treatment Plant', country:'Kenya', city:'Nairobi', lat:-1.286, lon:36.817, sponsor:'Veolia', concession_years:25, installed_capacity:500, capacity_unit:'ML/d', capacity_factor_pct:88, annual_output_gwh:0, total_investment_usd_mn:420, equity_usd_mn:126, debt_usd_mn:294, irr_target_pct:13.0, annual_revenue_usd_mn:48, opex_usd_mn:12, scope1_tco2e:1200, scope2_tco2e:3500, avoided_emissions_tco2e:0, carbon_intensity:9.4, environmental_score:78, social_score:82, governance_score:72, composite_esg:78, ifc_ps:{ps1:82,ps2:78,ps3:85,ps4:75,ps5:80,ps6:82,ps7:72,ps8:78}, ep_category:'B', ep_rationale:'Essential service with manageable environmental impact', community_impact_score:88, jobs_created:850, local_procurement_pct:35, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[6,3,11], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], social:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], governance:[true,true,true,true,true,true,true,true,true,true]}, blended_finance:{equity_pct:30,commercial_debt_pct:35,dfi_pct:25,concessional_pct:10}, dd_meta:{} },
    { id:'INF-07', name:'Indonesia Telecom Towers', type:'Telecom', subtype:'Tower Network', country:'Indonesia', city:'Jakarta', lat:-6.208, lon:106.846, sponsor:'Tower Bersama', concession_years:15, installed_capacity:2500, capacity_unit:'towers', capacity_factor_pct:95, annual_output_gwh:0, total_investment_usd_mn:580, equity_usd_mn:232, debt_usd_mn:348, irr_target_pct:15.0, annual_revenue_usd_mn:95, opex_usd_mn:22, scope1_tco2e:8500, scope2_tco2e:12000, avoided_emissions_tco2e:0, carbon_intensity:8.2, environmental_score:58, social_score:62, governance_score:65, composite_esg:62, ifc_ps:{ps1:62,ps2:65,ps3:70,ps4:55,ps5:68,ps6:58,ps7:55,ps8:62}, ep_category:'C', ep_rationale:'Low environmental impact; distributed small-scale sites', community_impact_score:65, jobs_created:1800, local_procurement_pct:55, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[9,11], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,false,true,false,true,true,false,true,true,false,true,true,false], social:[true,true,false,true,true,true,false,true,true,true,false,true,true,false,true], governance:[true,true,true,true,false,true,true,true,true,false]}, blended_finance:{equity_pct:40,commercial_debt_pct:60,dfi_pct:0,concessional_pct:0}, dd_meta:{} },
    { id:'INF-08', name:'Chile Lithium Extraction', type:'Mining', subtype:'Lithium Brine', country:'Chile', city:'Antofagasta', lat:-23.650, lon:-70.400, sponsor:'SQM', concession_years:20, installed_capacity:40, capacity_unit:'kt LCE', capacity_factor_pct:82, annual_output_gwh:0, total_investment_usd_mn:1800, equity_usd_mn:720, debt_usd_mn:1080, irr_target_pct:18.0, annual_revenue_usd_mn:320, opex_usd_mn:85, scope1_tco2e:42000, scope2_tco2e:18000, avoided_emissions_tco2e:0, carbon_intensity:187.5, environmental_score:42, social_score:52, governance_score:62, composite_esg:52, ifc_ps:{ps1:55,ps2:58,ps3:52,ps4:48,ps5:62,ps6:45,ps7:58,ps8:55}, ep_category:'A', ep_rationale:'Major water use in arid region, indigenous territory, ecosystem disruption', community_impact_score:45, jobs_created:2200, local_procurement_pct:30, resettlement_required:false, indigenous_impact:'Atacameno community water rights', sdg_alignment:[7,12], status:'Construction', construction_pct:75, dd_checklist:{environmental:[true,false,true,false,true,false,false,true,false,true,false,true,false,true,false], social:[true,false,true,false,true,false,true,false,true,false,true,false,true,false,true], governance:[true,true,false,true,false,true,true,false,true,false]}, blended_finance:{equity_pct:40,commercial_debt_pct:45,dfi_pct:10,concessional_pct:5}, dd_meta:{} },
    { id:'INF-09', name:'UAE Desalination Plant', type:'Water', subtype:'Reverse Osmosis', country:'UAE', city:'Abu Dhabi', lat:24.453, lon:54.377, sponsor:'ACWA Power', concession_years:30, installed_capacity:600, capacity_unit:'ML/d', capacity_factor_pct:92, annual_output_gwh:0, total_investment_usd_mn:680, equity_usd_mn:204, debt_usd_mn:476, irr_target_pct:11.5, annual_revenue_usd_mn:82, opex_usd_mn:28, scope1_tco2e:5500, scope2_tco2e:18000, avoided_emissions_tco2e:0, carbon_intensity:34.6, environmental_score:65, social_score:72, governance_score:78, composite_esg:72, ifc_ps:{ps1:72,ps2:75,ps3:78,ps4:68,ps5:75,ps6:65,ps7:70,ps8:72}, ep_category:'B', ep_rationale:'High energy use, brine discharge, but essential water supply', community_impact_score:78, jobs_created:650, local_procurement_pct:40, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[6,3,13], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,true,true,false,true,true,true,false,true,true,true,true,false], social:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], governance:[true,true,true,true,true,true,true,true,true,true]}, blended_finance:{equity_pct:30,commercial_debt_pct:55,dfi_pct:10,concessional_pct:5}, dd_meta:{} },
    { id:'INF-10', name:'Brazil Toll Highway', type:'Toll Road', subtype:'Concession Road', country:'Brazil', city:'Sao Paulo', lat:-23.551, lon:-46.634, sponsor:'CCR', concession_years:30, installed_capacity:320, capacity_unit:'km', capacity_factor_pct:80, annual_output_gwh:0, total_investment_usd_mn:620, equity_usd_mn:186, debt_usd_mn:434, irr_target_pct:13.5, annual_revenue_usd_mn:88, opex_usd_mn:15, scope1_tco2e:3200, scope2_tco2e:1500, avoided_emissions_tco2e:0, carbon_intensity:53.4, environmental_score:58, social_score:62, governance_score:65, composite_esg:62, ifc_ps:{ps1:62,ps2:65,ps3:68,ps4:55,ps5:70,ps6:58,ps7:55,ps8:62}, ep_category:'B', ep_rationale:'Moderate land use and community impact', community_impact_score:62, jobs_created:1500, local_procurement_pct:60, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[9,11], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,false,true,true,false,true,true,false,true,true,false,true,true,false], social:[true,true,true,false,true,true,false,true,true,true,false,true,true,false,true], governance:[true,true,true,true,false,true,true,true,true,false]}, blended_finance:{equity_pct:30,commercial_debt_pct:70,dfi_pct:0,concessional_pct:0}, dd_meta:{} },
    { id:'INF-11', name:'Vietnam Offshore Wind', type:'Wind', subtype:'Offshore Fixed', country:'Vietnam', city:'Binh Thuan', lat:11.090, lon:108.530, sponsor:'Enterprize Energy', concession_years:25, installed_capacity:300, capacity_unit:'MW', capacity_factor_pct:38, annual_output_gwh:998, total_investment_usd_mn:980, equity_usd_mn:294, debt_usd_mn:686, irr_target_pct:12.0, annual_revenue_usd_mn:85, opex_usd_mn:18, scope1_tco2e:50, scope2_tco2e:350, avoided_emissions_tco2e:580000, carbon_intensity:0.40, environmental_score:78, social_score:70, governance_score:68, composite_esg:72, ifc_ps:{ps1:72,ps2:68,ps3:80,ps4:65,ps5:72,ps6:75,ps7:62,ps8:70}, ep_category:'B', ep_rationale:'Marine impact and fishing community displacement risk', community_impact_score:65, jobs_created:1200, local_procurement_pct:25, resettlement_required:false, indigenous_impact:'Fishing community', sdg_alignment:[7,13,14], status:'Construction', construction_pct:45, dd_checklist:{environmental:[true,true,true,true,true,false,true,true,false,true,true,true,false,true,true], social:[true,true,false,true,true,true,false,true,true,false,true,true,true,false,true], governance:[true,true,true,false,true,true,true,false,true,true]}, blended_finance:{equity_pct:30,commercial_debt_pct:40,dfi_pct:20,concessional_pct:10}, dd_meta:{} },
    { id:'INF-12', name:'South Africa BESS', type:'Storage', subtype:'Li-ion BESS', country:'South Africa', city:'Cape Town', lat:-33.925, lon:18.424, sponsor:'Eskom/ACWA', concession_years:20, installed_capacity:200, capacity_unit:'MWh', capacity_factor_pct:90, annual_output_gwh:0, total_investment_usd_mn:120, equity_usd_mn:48, debt_usd_mn:72, irr_target_pct:14.0, annual_revenue_usd_mn:18, opex_usd_mn:3.5, scope1_tco2e:0, scope2_tco2e:200, avoided_emissions_tco2e:45000, carbon_intensity:0, environmental_score:82, social_score:75, governance_score:72, composite_esg:76, ifc_ps:{ps1:78,ps2:75,ps3:82,ps4:72,ps5:80,ps6:78,ps7:68,ps8:75}, ep_category:'C', ep_rationale:'Minimal environmental impact, small footprint', community_impact_score:78, jobs_created:180, local_procurement_pct:35, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[7,13,11], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], social:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], governance:[true,true,true,true,true,true,true,true,true,true]}, blended_finance:{equity_pct:40,commercial_debt_pct:35,dfi_pct:15,concessional_pct:10}, dd_meta:{} },
    { id:'INF-13', name:'Morocco Concentrated Solar', type:'Solar', subtype:'CSP Tower', country:'Morocco', city:'Ouarzazate', lat:30.938, lon:-6.937, sponsor:'MASEN/ACWA', concession_years:25, installed_capacity:580, capacity_unit:'MW', capacity_factor_pct:28, annual_output_gwh:1423, total_investment_usd_mn:2400, equity_usd_mn:720, debt_usd_mn:1680, irr_target_pct:10.5, annual_revenue_usd_mn:210, opex_usd_mn:42, scope1_tco2e:800, scope2_tco2e:2200, avoided_emissions_tco2e:950000, carbon_intensity:2.11, environmental_score:72, social_score:78, governance_score:75, composite_esg:75, ifc_ps:{ps1:78,ps2:75,ps3:80,ps4:72,ps5:78,ps6:72,ps7:68,ps8:75}, ep_category:'B', ep_rationale:'Large land use in desert, water for cooling', community_impact_score:82, jobs_created:2500, local_procurement_pct:45, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[7,13,8,9], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,true,true,true,true,true,false,true,true,true,true,false,true], social:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], governance:[true,true,true,true,true,true,true,true,true,true]}, blended_finance:{equity_pct:30,commercial_debt_pct:35,dfi_pct:25,concessional_pct:10}, dd_meta:{} },
    { id:'INF-14', name:'Philippines Geothermal', type:'Geothermal', subtype:'Flash Steam', country:'Philippines', city:'Leyte', lat:11.178, lon:124.960, sponsor:'Energy Dev Corp', concession_years:25, installed_capacity:150, capacity_unit:'MW', capacity_factor_pct:88, annual_output_gwh:1155, total_investment_usd_mn:680, equity_usd_mn:272, debt_usd_mn:408, irr_target_pct:13.0, annual_revenue_usd_mn:92, opex_usd_mn:15, scope1_tco2e:12000, scope2_tco2e:800, avoided_emissions_tco2e:420000, carbon_intensity:11.1, environmental_score:72, social_score:70, governance_score:68, composite_esg:70, ifc_ps:{ps1:70,ps2:68,ps3:75,ps4:65,ps5:72,ps6:70,ps7:62,ps8:68}, ep_category:'B', ep_rationale:'Geothermal fluid management, seismic monitoring', community_impact_score:72, jobs_created:450, local_procurement_pct:30, resettlement_required:false, indigenous_impact:'Minor Waray community', sdg_alignment:[7,13], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,true,true,true,true,false,true,true,true,true,false,true,true], social:[true,true,true,false,true,true,true,true,true,false,true,true,true,true,false], governance:[true,true,true,true,true,false,true,true,true,true]}, blended_finance:{equity_pct:40,commercial_debt_pct:45,dfi_pct:10,concessional_pct:5}, dd_meta:{} },
    { id:'INF-15', name:'Egypt Wind Farm', type:'Wind', subtype:'Onshore', country:'Egypt', city:'Ras Ghareb', lat:28.353, lon:33.094, sponsor:'Lekela', concession_years:20, installed_capacity:250, capacity_unit:'MW', capacity_factor_pct:35, annual_output_gwh:766, total_investment_usd_mn:340, equity_usd_mn:102, debt_usd_mn:238, irr_target_pct:14.0, annual_revenue_usd_mn:42, opex_usd_mn:7, scope1_tco2e:0, scope2_tco2e:300, avoided_emissions_tco2e:380000, carbon_intensity:0.39, environmental_score:80, social_score:72, governance_score:70, composite_esg:74, ifc_ps:{ps1:75,ps2:72,ps3:82,ps4:68,ps5:78,ps6:72,ps7:65,ps8:72}, ep_category:'B', ep_rationale:'Bird migration corridor, desert ecology', community_impact_score:70, jobs_created:600, local_procurement_pct:28, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[7,13], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,true,true,true,true,true,false,true,true,true,true,false,true], social:[true,true,true,true,true,false,true,true,true,true,false,true,true,true,false], governance:[true,true,true,true,false,true,true,true,true,true]}, blended_finance:{equity_pct:30,commercial_debt_pct:40,dfi_pct:20,concessional_pct:10}, dd_meta:{} },
    { id:'INF-16', name:'Colombia Hydro', type:'Hydro', subtype:'Run-of-River', country:'Colombia', city:'Medellin', lat:6.244, lon:-75.574, sponsor:'EPM', concession_years:30, installed_capacity:400, capacity_unit:'MW', capacity_factor_pct:55, annual_output_gwh:1927, total_investment_usd_mn:920, equity_usd_mn:368, debt_usd_mn:552, irr_target_pct:11.0, annual_revenue_usd_mn:105, opex_usd_mn:12, scope1_tco2e:500, scope2_tco2e:200, avoided_emissions_tco2e:720000, carbon_intensity:0.36, environmental_score:68, social_score:62, governance_score:65, composite_esg:65, ifc_ps:{ps1:68,ps2:65,ps3:72,ps4:58,ps5:70,ps6:65,ps7:60,ps8:68}, ep_category:'A', ep_rationale:'River diversion, aquatic ecosystem impact, community displacement', community_impact_score:58, jobs_created:1800, local_procurement_pct:42, resettlement_required:true, indigenous_impact:'Minor indigenous community downstream', sdg_alignment:[7,6,13], status:'Construction', construction_pct:60, dd_checklist:{environmental:[true,true,false,true,true,false,true,true,false,true,true,false,true,true,false], social:[true,true,false,true,true,false,true,true,false,true,true,false,true,true,false], governance:[true,true,true,false,true,true,false,true,true,true]}, blended_finance:{equity_pct:40,commercial_debt_pct:35,dfi_pct:15,concessional_pct:10}, dd_meta:{} },
    { id:'INF-17', name:'Thailand LNG Terminal', type:'Gas Pipeline', subtype:'LNG Terminal', country:'Thailand', city:'Map Ta Phut', lat:12.654, lon:101.155, sponsor:'PTT', concession_years:25, installed_capacity:7.5, capacity_unit:'MTPA', capacity_factor_pct:85, annual_output_gwh:0, total_investment_usd_mn:1500, equity_usd_mn:600, debt_usd_mn:900, irr_target_pct:10.0, annual_revenue_usd_mn:180, opex_usd_mn:35, scope1_tco2e:25000, scope2_tco2e:8000, avoided_emissions_tco2e:0, carbon_intensity:110.5, environmental_score:55, social_score:68, governance_score:72, composite_esg:65, ifc_ps:{ps1:68,ps2:72,ps3:65,ps4:62,ps5:70,ps6:58,ps7:55,ps8:68}, ep_category:'A', ep_rationale:'Fossil fuel infrastructure, marine environmental impact, safety risks', community_impact_score:62, jobs_created:1200, local_procurement_pct:48, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[7,9], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,false,true,true,false,true,true,false,true,true,false,true,true], social:[true,true,true,true,false,true,true,false,true,true,true,false,true,true,false], governance:[true,true,true,true,true,false,true,true,true,true]}, blended_finance:{equity_pct:40,commercial_debt_pct:60,dfi_pct:0,concessional_pct:0}, dd_meta:{} },
    { id:'INF-18', name:'Nigeria Solar Mini-Grids', type:'Solar', subtype:'Distributed Mini-Grid', country:'Nigeria', city:'Lagos', lat:6.524, lon:3.379, sponsor:'Husk Power', concession_years:15, installed_capacity:50, capacity_unit:'MW', capacity_factor_pct:20, annual_output_gwh:88, total_investment_usd_mn:85, equity_usd_mn:34, debt_usd_mn:51, irr_target_pct:16.0, annual_revenue_usd_mn:12, opex_usd_mn:3, scope1_tco2e:0, scope2_tco2e:100, avoided_emissions_tco2e:52000, carbon_intensity:1.14, environmental_score:85, social_score:88, governance_score:68, composite_esg:80, ifc_ps:{ps1:82,ps2:80,ps3:85,ps4:78,ps5:82,ps6:80,ps7:75,ps8:78}, ep_category:'C', ep_rationale:'Minimal environmental footprint, high social benefit', community_impact_score:92, jobs_created:800, local_procurement_pct:55, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[7,1,13,5], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], social:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], governance:[true,true,true,true,true,true,true,true,true,true]}, blended_finance:{equity_pct:40,commercial_debt_pct:20,dfi_pct:25,concessional_pct:15}, dd_meta:{} },
    { id:'INF-19', name:'Mexico Waste-to-Energy', type:'Waste-to-Energy', subtype:'Incineration', country:'Mexico', city:'Mexico City', lat:19.432, lon:-99.133, sponsor:'Veolia', concession_years:25, installed_capacity:30, capacity_unit:'MW', capacity_factor_pct:85, annual_output_gwh:223, total_investment_usd_mn:280, equity_usd_mn:112, debt_usd_mn:168, irr_target_pct:12.5, annual_revenue_usd_mn:38, opex_usd_mn:12, scope1_tco2e:85000, scope2_tco2e:2000, avoided_emissions_tco2e:120000, carbon_intensity:390.1, environmental_score:55, social_score:65, governance_score:68, composite_esg:62, ifc_ps:{ps1:62,ps2:68,ps3:58,ps4:55,ps5:65,ps6:52,ps7:50,ps8:62}, ep_category:'A', ep_rationale:'Air emissions, dioxin risk, community opposition risk', community_impact_score:52, jobs_created:350, local_procurement_pct:62, resettlement_required:false, indigenous_impact:'None', sdg_alignment:[7,11,12], status:'Construction', construction_pct:35, dd_checklist:{environmental:[true,true,false,true,false,true,false,true,false,true,false,true,false,true,false], social:[true,false,true,false,true,false,true,false,true,false,true,false,true,false,true], governance:[true,true,false,true,true,false,true,false,true,true]}, blended_finance:{equity_pct:40,commercial_debt_pct:45,dfi_pct:10,concessional_pct:5}, dd_meta:{} },
    { id:'INF-20', name:'Australia Rail Corridor', type:'Rail', subtype:'Freight Rail', country:'Australia', city:'Perth', lat:-31.951, lon:115.861, sponsor:'Aurizon', concession_years:50, installed_capacity:800, capacity_unit:'km', capacity_factor_pct:70, annual_output_gwh:0, total_investment_usd_mn:2200, equity_usd_mn:880, debt_usd_mn:1320, irr_target_pct:9.0, annual_revenue_usd_mn:280, opex_usd_mn:55, scope1_tco2e:15000, scope2_tco2e:5000, avoided_emissions_tco2e:180000, carbon_intensity:25.0, environmental_score:65, social_score:72, governance_score:78, composite_esg:72, ifc_ps:{ps1:72,ps2:75,ps3:78,ps4:68,ps5:75,ps6:70,ps7:65,ps8:72}, ep_category:'B', ep_rationale:'Linear infrastructure through sensitive habitat, Aboriginal land', community_impact_score:68, jobs_created:3200, local_procurement_pct:58, resettlement_required:false, indigenous_impact:'Aboriginal heritage sites along corridor', sdg_alignment:[9,11,13], status:'Operating', construction_pct:100, dd_checklist:{environmental:[true,true,true,true,true,false,true,true,true,false,true,true,true,false,true], social:[true,true,true,false,true,true,true,false,true,true,true,true,false,true,true], governance:[true,true,true,true,true,true,true,true,true,true]}, blended_finance:{equity_pct:40,commercial_debt_pct:55,dfi_pct:5,concessional_pct:0}, dd_meta:{} },
  ],
};

function initData() {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INFRA_PORTFOLIO));
  return DEFAULT_INFRA_PORTFOLIO;
}

const pct = (v, d = 1) => v != null ? `${v.toFixed(d)}%` : '-';
const fmt = (v, d = 1) => v != null ? v.toFixed(d) : '-';
const fmtB = v => v >= 1000 ? `${(v / 1000).toFixed(1)}B` : `${v.toFixed(0)}M`;
const fmtK = v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`;
const heatColor = v => v >= 90 ? T.green : v >= 70 ? T.sage : v >= 50 ? T.amber : T.red;

const Badge = ({ children, color = T.navy }) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}30`, borderRadius: 4, padding: '2px 7px', letterSpacing: 0.3 }}>{children}</span>
);
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20, ...style }}>{children}</div>
);
const KPI = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '14px 16px', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);
const SortIcon = ({ active, dir }) => (
  <span style={{ fontSize: 10, marginLeft: 3, opacity: active ? 1 : 0.3 }}>{active ? (dir === 'asc' ? '\u25B2' : '\u25BC') : '\u25B4'}</span>
);

const inputS = { padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, color: T.text, background: T.surface, width: '100%', boxSizing: 'border-box', fontFamily: T.font };
const labelS = { fontSize: 10, color: T.textSec, fontWeight: 600, marginBottom: 3, display: 'block', textTransform: 'uppercase', letterSpacing: 0.4 };
const btnS = (bg, c = '#fff') => ({ padding: '8px 16px', borderRadius: 8, border: 'none', background: bg, color: c, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font });

function newAsset(id) {
  return { id, name: '', type: 'Solar', subtype: '', country: 'India', city: '', lat: 0, lon: 0, sponsor: '', concession_years: 25, installed_capacity: 0, capacity_unit: 'MW', capacity_factor_pct: 0, annual_output_gwh: 0, total_investment_usd_mn: 0, equity_usd_mn: 0, debt_usd_mn: 0, irr_target_pct: 10, annual_revenue_usd_mn: 0, opex_usd_mn: 0, scope1_tco2e: 0, scope2_tco2e: 0, avoided_emissions_tco2e: 0, carbon_intensity: 0, environmental_score: 50, social_score: 50, governance_score: 50, composite_esg: 50, ifc_ps: { ps1: 50, ps2: 50, ps3: 50, ps4: 50, ps5: 50, ps6: 50, ps7: 50, ps8: 50 }, ep_category: 'B', ep_rationale: '', community_impact_score: 50, jobs_created: 0, local_procurement_pct: 0, resettlement_required: false, indigenous_impact: 'None', sdg_alignment: [], status: 'Planning', construction_pct: 0, dd_checklist: { environmental: DD_ITEMS.environmental.map(() => false), social: DD_ITEMS.social.map(() => false), governance: DD_ITEMS.governance.map(() => false) }, blended_finance: { equity_pct: 30, commercial_debt_pct: 50, dfi_pct: 15, concessional_pct: 5 }, dd_meta: {} };
}

export default function InfraESGDueDiligencePage() {
  const nav = useNavigate();
  const [data, setData] = useState(initData);
  const assets = data.assets;
  const [selectedAsset, setSelectedAsset] = useState('INF-01');
  const [sortCol, setSortCol] = useState('composite_esg');
  const [sortDir, setSortDir] = useState('desc');
  const [typeFilter, setTypeFilter] = useState('All');
  const [epFilter, setEpFilter] = useState('All');
  const [tab, setTab] = useState('overview');
  const [editAssetId, setEditAssetId] = useState(null);
  const [addFormTab, setAddFormTab] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDraft, setAddDraft] = useState(() => newAsset('INF-21'));
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const persist = useCallback((updated) => {
    setData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const updateAsset = useCallback((assetId, changes) => {
    const updated = { ...data, assets: data.assets.map(a => a.id === assetId ? { ...a, ...changes } : a) };
    persist(updated);
  }, [data, persist]);

  const addAsset = useCallback((asset) => {
    if (!asset.name.trim()) { alert('Asset name is required'); return; }
    const nextId = `INF-${String(data.assets.length + 1).padStart(2, '0')}`;
    const final = { ...asset, id: nextId, composite_esg: Math.round((asset.environmental_score + asset.social_score + asset.governance_score) / 3) };
    const updated = { ...data, assets: [...data.assets, final] };
    persist(updated);
    setShowAddForm(false);
    setAddDraft(newAsset(`INF-${String(data.assets.length + 2).padStart(2, '0')}`));
    setTab('overview');
  }, [data, persist]);

  const deleteAsset = useCallback((assetId) => {
    const updated = { ...data, assets: data.assets.filter(a => a.id !== assetId) };
    persist(updated);
    setDeleteConfirm(null);
    if (selectedAsset === assetId && updated.assets.length) setSelectedAsset(updated.assets[0].id);
  }, [data, persist, selectedAsset]);

  const handleSort = col => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };
  const types = useMemo(() => ['All', ...new Set(assets.map(a => a.type))], [assets]);
  const filtered = useMemo(() => {
    let f = assets;
    if (typeFilter !== 'All') f = f.filter(a => a.type === typeFilter);
    if (epFilter !== 'All') f = f.filter(a => a.ep_category === epFilter);
    return [...f].sort((a, b) => { const m = sortDir === 'asc' ? 1 : -1; const av = a[sortCol], bv = b[sortCol]; return typeof av === 'number' ? (av - bv) * m : String(av).localeCompare(String(bv)) * m; });
  }, [assets, typeFilter, epFilter, sortCol, sortDir]);

  const sel = assets.find(a => a.id === selectedAsset) || assets[0];

  // KPI calculations
  const totalInvestment = assets.reduce((s, a) => s + a.total_investment_usd_mn, 0);
  const operating = assets.filter(a => a.status === 'Operating').length;
  const construction = assets.filter(a => a.status === 'Construction').length;
  const avgESG = assets.length ? assets.reduce((s, a) => s + a.composite_esg, 0) / assets.length : 0;
  const epA = assets.filter(a => a.ep_category === 'A').length;
  const epB = assets.filter(a => a.ep_category === 'B').length;
  const epC = assets.filter(a => a.ep_category === 'C').length;
  const totalAvoided = assets.reduce((s, a) => s + a.avoided_emissions_tco2e, 0);
  const totalJobs = assets.reduce((s, a) => s + a.jobs_created, 0);
  const avgCommunity = assets.length ? assets.reduce((s, a) => s + a.community_impact_score, 0) / assets.length : 0;
  const ddTotalAll = assets.reduce((acc, a) => {
    const e = a.dd_checklist.environmental, s = a.dd_checklist.social, g = a.dd_checklist.governance;
    acc.done += [...e, ...s, ...g].filter(Boolean).length;
    acc.total += e.length + s.length + g.length;
    return acc;
  }, { done: 0, total: 0 });
  const ddPct = ddTotalAll.total > 0 ? (ddTotalAll.done / ddTotalAll.total * 100) : 0;

  // Chart data
  const typeDistrib = useMemo(() => { const m = {}; assets.forEach(a => { m[a.type] = (m[a.type] || 0) + 1; }); return Object.entries(m).map(([name, value]) => ({ name, value })); }, [assets]);
  const investByType = useMemo(() => { const m = {}; assets.forEach(a => { m[a.type] = (m[a.type] || 0) + a.total_investment_usd_mn; }); return Object.entries(m).map(([type, investment]) => ({ type, investment })).sort((a, b) => b.investment - a.investment); }, [assets]);
  const epDistrib = [{ name: 'Category A', value: epA, color: T.red }, { name: 'Category B', value: epB, color: T.amber }, { name: 'Category C', value: epC, color: T.green }];
  const psLabels = ['PS1: Assessment','PS2: Labor','PS3: Pollution','PS4: Community','PS5: Land','PS6: Biodiversity','PS7: Indigenous','PS8: Cultural'];
  const avgPS = useMemo(() => { const sums = {ps1:0,ps2:0,ps3:0,ps4:0,ps5:0,ps6:0,ps7:0,ps8:0}; assets.forEach(a => { Object.keys(sums).forEach(k => { sums[k] += a.ifc_ps[k]; }); }); Object.keys(sums).forEach(k => { sums[k] /= assets.length || 1; }); return sums; }, [assets]);
  const radarData = psLabels.map((label, i) => { const k = `ps${i + 1}`; return { subject: label, asset: sel?.ifc_ps?.[k] || 0, average: Math.round(avgPS[k]) }; });
  const sdgFreq = useMemo(() => { const m = {}; assets.forEach(a => a.sdg_alignment.forEach(s => { m[s] = (m[s] || 0) + 1; })); return Object.entries(m).map(([sdg, count]) => ({ sdg: `SDG ${sdg}`, label: SDG_NAMES[sdg] || `Goal ${sdg}`, count })).sort((a, b) => parseInt(a.sdg.split(' ')[1]) - parseInt(b.sdg.split(' ')[1])); }, [assets]);
  const ddHeatmap = useMemo(() => assets.map(a => { const eD = a.dd_checklist.environmental.filter(Boolean).length, eT = a.dd_checklist.environmental.length; const sD = a.dd_checklist.social.filter(Boolean).length, sT = a.dd_checklist.social.length; const gD = a.dd_checklist.governance.filter(Boolean).length, gT = a.dd_checklist.governance.length; return { id: a.id, name: a.name, envPct: eT ? eD / eT * 100 : 0, socPct: sT ? sD / sT * 100 : 0, govPct: gT ? gD / gT * 100 : 0, totalPct: (eT + sT + gT) ? (eD + sD + gD) / (eT + sT + gT) * 100 : 0 }; }), [assets]);
  const emissionsComparison = useMemo(() => assets.filter(a => a.avoided_emissions_tco2e > 0).map(a => ({ name: a.name.length > 18 ? a.name.slice(0, 16) + '..' : a.name, avoided: a.avoided_emissions_tco2e / 1000, actual: (a.scope1_tco2e + a.scope2_tco2e) / 1000 })), [assets]);
  const blendedData = useMemo(() => assets.map(a => ({ name: a.name.length > 14 ? a.name.slice(0, 12) + '..' : a.name, Equity: a.blended_finance.equity_pct, 'Commercial Debt': a.blended_finance.commercial_debt_pct, DFI: a.blended_finance.dfi_pct, Concessional: a.blended_finance.concessional_pct })), [assets]);
  const concessionData = useMemo(() => assets.map(a => { const elapsed = a.construction_pct === 100 ? Math.min(5, a.concession_years) : 0; return { name: a.name.length > 14 ? a.name.slice(0, 12) + '..' : a.name, remaining: a.concession_years - elapsed, elapsed, status: a.status, constructionPct: a.construction_pct }; }).sort((a, b) => a.remaining - b.remaining), [assets]);

  const thS = { padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', letterSpacing: 0.3, textTransform: 'uppercase' };
  const tdS = { padding: '7px 10px', fontSize: 12, color: T.text, borderBottom: `1px solid ${T.border}` };

  const exportCSV = (rows, filename) => { if (!rows.length) return; const keys = Object.keys(rows[0]); const csv = [keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v; }).join(','))].join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); };
  const exportPortfolio = () => exportCSV(assets.map(a => ({ ID: a.id, Name: a.name, Type: a.type, Country: a.country, 'Investment ($M)': a.total_investment_usd_mn, 'EP Cat': a.ep_category, ESG: a.composite_esg, Status: a.status, 'Avoided (tCO2e)': a.avoided_emissions_tco2e, Jobs: a.jobs_created })), 'infra_esg_portfolio.csv');
  const exportDD = () => exportCSV(ddHeatmap.map(d => ({ ID: d.id, Name: d.name, 'Env %': d.envPct.toFixed(1), 'Soc %': d.socPct.toFixed(1), 'Gov %': d.govPct.toFixed(1), 'Total %': d.totalPct.toFixed(1) })), 'infra_dd_completion.csv');
  const exportIFC = () => exportCSV(assets.map(a => ({ ID: a.id, Name: a.name, PS1: a.ifc_ps.ps1, PS2: a.ifc_ps.ps2, PS3: a.ifc_ps.ps3, PS4: a.ifc_ps.ps4, PS5: a.ifc_ps.ps5, PS6: a.ifc_ps.ps6, PS7: a.ifc_ps.ps7, PS8: a.ifc_ps.ps8, 'EP Cat': a.ep_category })), 'infra_ifc_ps_scores.csv');

  // --- DD Checklist per-item meta helpers ---
  const getDDMeta = (asset, dim, idx) => asset.dd_meta?.[`${dim}_${idx}`] || {};
  const setDDMeta = (assetId, dim, idx, field, value) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    const meta = { ...(asset.dd_meta || {}) };
    const key = `${dim}_${idx}`;
    meta[key] = { ...(meta[key] || {}), [field]: value };
    updateAsset(assetId, { dd_meta: meta });
  };

  // --- Blended finance rebalance ---
  const updateBlended = (assetId, field, val) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    const bf = { ...asset.blended_finance };
    const numVal = Math.min(100, Math.max(0, Number(val)));
    bf[field] = numVal;
    const others = ['equity_pct', 'commercial_debt_pct', 'dfi_pct', 'concessional_pct'].filter(f => f !== field);
    const remaining = 100 - numVal;
    const otherSum = others.reduce((s, f) => s + bf[f], 0);
    if (otherSum > 0) { others.forEach(f => { bf[f] = Math.round(bf[f] / otherSum * remaining); }); } else { others.forEach((f, i) => { bf[f] = i === 0 ? remaining : 0; }); }
    const total = Object.values(bf).reduce((s, v) => s + v, 0);
    if (total !== 100) bf[others[0]] += 100 - total;
    updateAsset(assetId, { blended_finance: bf });
  };

  // --- IFC PS update ---
  const updatePS = (assetId, psKey, val) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    const ps = { ...asset.ifc_ps, [psKey]: Number(val) };
    const avg = Math.round(Object.values(ps).reduce((s, v) => s + v, 0) / 8);
    updateAsset(assetId, { ifc_ps: ps, composite_esg: avg });
  };

  // Tab bar
  const tabs = [
    { id: 'overview', label: 'Portfolio Overview' },
    { id: 'ddchecklist', label: 'Due Diligence Checklist' },
    { id: 'editor', label: 'Asset Editor' },
    { id: 'ifcps', label: 'IFC PS Assessment' },
    { id: 'finance', label: 'Financial Structure' },
  ];

  // --- RENDER: Asset Editor Form ---
  const renderEditorForm = (asset, onChange, isNew = false) => {
    const set = (field, val) => onChange({ ...asset, [field]: val });
    const setNum = (field, val) => onChange({ ...asset, [field]: Number(val) || 0 });
    const fieldRow = (label, field, type = 'text', opts) => (
      <div style={{ marginBottom: 10 }}>
        <label style={labelS}>{label}</label>
        {type === 'select' ? (
          <select value={asset[field] || ''} onChange={e => set(field, e.target.value)} style={inputS}>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select>
        ) : type === 'checkbox' ? (
          <input type="checkbox" checked={!!asset[field]} onChange={e => set(field, e.target.checked)} />
        ) : (
          <input type={type} value={asset[field] ?? ''} onChange={e => type === 'number' ? setNum(field, e.target.value) : set(field, e.target.value)} style={inputS} />
        )}
      </div>
    );
    const addTabs = ['Identity', 'Financial', 'Climate', 'ESG', 'Community'];
    return (
      <div>
        {isNew && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {addTabs.map((t, i) => (
              <button key={t} onClick={() => setAddFormTab(i)} style={{ ...btnS(addFormTab === i ? T.navy : T.surface, addFormTab === i ? '#fff' : T.navy), border: `1px solid ${T.border}`, fontSize: 11, padding: '6px 14px' }}>{t}</button>
            ))}
          </div>
        )}
        {(!isNew || addFormTab === 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {fieldRow('Name', 'name')}
            {fieldRow('Type', 'type', 'select', ASSET_TYPES)}
            {fieldRow('Subtype', 'subtype')}
            {fieldRow('Country', 'country', 'select', COUNTRIES)}
            {fieldRow('City', 'city')}
            {fieldRow('Sponsor', 'sponsor')}
            {fieldRow('Concession Years', 'concession_years', 'number')}
            {fieldRow('Capacity', 'installed_capacity', 'number')}
            {fieldRow('Capacity Unit', 'capacity_unit')}
            {fieldRow('Capacity Factor %', 'capacity_factor_pct', 'number')}
            {fieldRow('Annual Output GWh', 'annual_output_gwh', 'number')}
            {fieldRow('Status', 'status', 'select', ['Operating', 'Construction', 'Planning'])}
          </div>
        )}
        {(!isNew || addFormTab === 1) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: isNew ? 0 : 16 }}>
            {fieldRow('Total Investment ($M)', 'total_investment_usd_mn', 'number')}
            {fieldRow('Equity ($M)', 'equity_usd_mn', 'number')}
            {fieldRow('Debt ($M)', 'debt_usd_mn', 'number')}
            {fieldRow('IRR Target %', 'irr_target_pct', 'number')}
            {fieldRow('Revenue ($M/yr)', 'annual_revenue_usd_mn', 'number')}
            {fieldRow('OpEx ($M/yr)', 'opex_usd_mn', 'number')}
          </div>
        )}
        {(!isNew || addFormTab === 2) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: isNew ? 0 : 16 }}>
            {fieldRow('Scope 1 (tCO2e)', 'scope1_tco2e', 'number')}
            {fieldRow('Scope 2 (tCO2e)', 'scope2_tco2e', 'number')}
            {fieldRow('Avoided Emissions (tCO2e)', 'avoided_emissions_tco2e', 'number')}
            {fieldRow('Carbon Intensity', 'carbon_intensity', 'number')}
          </div>
        )}
        {(!isNew || addFormTab === 3) && (
          <div style={{ marginTop: isNew ? 0 : 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {fieldRow('E Score', 'environmental_score', 'number')}
              {fieldRow('S Score', 'social_score', 'number')}
              {fieldRow('G Score', 'governance_score', 'number')}
              {fieldRow('EP Category', 'ep_category', 'select', ['A', 'B', 'C'])}
              {fieldRow('EP Rationale', 'ep_rationale')}
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={labelS}>SDG Alignment (1-17)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
                  <label key={n} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '2px 6px', borderRadius: 4, background: (asset.sdg_alignment || []).includes(n) ? `${T.sage}20` : 'transparent', border: `1px solid ${(asset.sdg_alignment || []).includes(n) ? T.sage : T.border}` }}>
                    <input type="checkbox" checked={(asset.sdg_alignment || []).includes(n)} onChange={e => { const arr = [...(asset.sdg_alignment || [])]; e.target.checked ? arr.push(n) : arr.splice(arr.indexOf(n), 1); onChange({ ...asset, sdg_alignment: arr.sort((a, b) => a - b) }); }} style={{ width: 12, height: 12 }} />
                    {n}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        {(!isNew || addFormTab === 4) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: isNew ? 0 : 16 }}>
            {fieldRow('Community Score', 'community_impact_score', 'number')}
            {fieldRow('Jobs Created', 'jobs_created', 'number')}
            {fieldRow('Local Procurement %', 'local_procurement_pct', 'number')}
            {fieldRow('Resettlement Required', 'resettlement_required', 'checkbox')}
            {fieldRow('Indigenous Impact', 'indigenous_impact')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px 60px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.navy, letterSpacing: -0.5 }}>Infrastructure ESG Due Diligence</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{data.portfolioName} | {data.lastUpdated}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge color={T.navy}>IFC PS1-8</Badge>
          <Badge color={T.gold}>EP IV</Badge>
          <Badge color={T.sage}>SDGs</Badge>
          <Badge color={T.navyL}>{assets.length} Assets</Badge>
          <Badge color={T.amber}>40 DD Items</Badge>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0', border: `1px solid ${tab === t.id ? T.navy : T.border}`, borderBottom: tab === t.id ? `2px solid ${T.surface}` : 'none', background: tab === t.id ? T.surface : 'transparent', color: tab === t.id ? T.navy : T.textSec, fontSize: 12, fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer', fontFamily: T.font, marginBottom: -2 }}>{t.label}</button>
        ))}
      </div>

      {/* ============== TAB: PORTFOLIO OVERVIEW ============== */}
      {tab === 'overview' && (
        <>
          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
            <KPI label="Total Assets" value={assets.length} sub={`${operating} operating, ${construction} construction`} />
            <KPI label="Total Investment" value={`$${fmtB(totalInvestment)}`} sub={`Equity: $${fmtB(assets.reduce((s,a)=>s+a.equity_usd_mn,0))}`} color={T.gold} />
            <KPI label="Avg ESG Score" value={fmt(avgESG, 0)} sub="/100 composite" color={avgESG >= 70 ? T.green : T.amber} />
            <KPI label="EP Cat A/B/C" value={`${epA}/${epB}/${epC}`} sub="Equator Principles" color={T.navy} />
            <KPI label="Avoided Emissions" value={`${(totalAvoided / 1e6).toFixed(1)}M`} sub="tCO2e annually" color={T.sage} />
            <KPI label="DD Completion" value={pct(ddPct, 0)} sub={`${ddTotalAll.done}/${ddTotalAll.total} items`} color={ddPct >= 80 ? T.green : T.amber} />
            <KPI label="Total Jobs" value={fmtK(totalJobs)} sub="direct employment" color={T.navyL} />
            <KPI label="Avg Community" value={fmt(avgCommunity, 0)} sub="impact score /100" color={T.sage} />
            <KPI label="Countries" value={new Set(assets.map(a => a.country)).size} sub="geographic spread" />
            <KPI label="Avg IRR Target" value={pct(assets.reduce((s,a)=>s+a.irr_target_pct,0)/(assets.length||1), 1)} sub="portfolio target" color={T.gold} />
            <KPI label="Revenue (Ann)" value={`$${fmtB(assets.reduce((s,a)=>s+a.annual_revenue_usd_mn,0))}`} sub="total annual" color={T.navyL} />
            <KPI label="Planning" value={assets.filter(a => a.status === 'Planning').length} sub="pipeline assets" />
          </div>

          {/* Charts Row 1: Type + Investment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Asset Type Distribution</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={typeDistrib} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: T.textMut }}>{typeDistrib.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            </Card>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Investment by Asset Type (USD Mn)</div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={investByType} layout="vertical" margin={{ left: 80 }}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} /><YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: T.textSec }} width={75} /><Tooltip formatter={v => `$${v.toFixed(0)}M`} /><Bar dataKey="investment" fill={T.navy} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </Card>
          </div>

          {/* Charts Row 2: EP + IFC PS Radar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>EP Category Distribution</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={epDistrib} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: T.textMut }}>{epDistrib.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
            </Card>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>IFC Performance Standards</div>
                <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} style={{ ...inputS, width: 'auto' }}>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              </div>
              <ResponsiveContainer width="100%" height={280}><RadarChart data={radarData}><PolarGrid stroke={T.border} /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: T.textSec }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} /><Radar name={sel?.name} dataKey="asset" stroke={T.navy} fill={T.navy} fillOpacity={0.25} /><Radar name="Portfolio Avg" dataKey="average" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeDasharray="4 4" /><Legend wrapperStyle={{ fontSize: 11 }} /><Tooltip /></RadarChart></ResponsiveContainer>
            </Card>
          </div>

          {/* SDG Alignment */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>SDG Alignment Across Portfolio</div>
            <ResponsiveContainer width="100%" height={250}><BarChart data={sdgFreq} margin={{ bottom: 30 }}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="sdg" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" /><YAxis tick={{ fontSize: 11, fill: T.textSec }} /><Tooltip content={({ active, payload }) => active && payload?.length ? (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12 }}><div style={{ fontWeight: 700, color: T.navy }}>{payload[0].payload.sdg}</div><div style={{ color: T.textSec }}>{payload[0].payload.label}</div><div style={{ color: T.sage, fontWeight: 600 }}>{payload[0].value} assets</div></div>) : null} /><Bar dataKey="count" fill={T.sage} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          </Card>

          {/* DD Heatmap */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Due Diligence Completion Heatmap</div>
            <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={thS}>Asset</th><th style={{ ...thS, textAlign: 'center' }}>Environmental (15)</th><th style={{ ...thS, textAlign: 'center' }}>Social (15)</th><th style={{ ...thS, textAlign: 'center' }}>Governance (10)</th><th style={{ ...thS, textAlign: 'center' }}>Overall</th><th style={{ ...thS, textAlign: 'center' }}>EP</th></tr></thead><tbody>{ddHeatmap.map(d => { const a = assets.find(x => x.id === d.id); return (<tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedAsset(d.id); setTab('ddchecklist'); }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{d.name}</td>{[d.envPct, d.socPct, d.govPct, d.totalPct].map((v, i) => (<td key={i} style={{ ...tdS, textAlign: 'center' }}><span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 4, background: `${heatColor(v)}18`, color: heatColor(v), fontWeight: 700, fontSize: 11 }}>{v.toFixed(0)}%</span></td>))}<td style={{ ...tdS, textAlign: 'center' }}><span style={{ fontWeight: 700, color: EP_COLORS[a?.ep_category], fontSize: 12 }}>{a?.ep_category}</span></td></tr>); })}</tbody></table></div>
          </Card>

          {/* Avoided Emissions */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Avoided vs Actual Emissions (Thousand tCO2e/yr)</div>
            <ResponsiveContainer width="100%" height={300}><BarChart data={emissionsComparison} margin={{ bottom: 40 }}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" /><YAxis tick={{ fontSize: 11, fill: T.textSec }} /><Tooltip formatter={v => `${v.toFixed(0)}K tCO2e`} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="avoided" name="Avoided" fill={T.green} radius={[4, 4, 0, 0]} /><Bar dataKey="actual" name="Scope 1+2" fill={T.red} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          </Card>

          {/* Community Impact */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Community Impact Assessment</div>
            <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={thS}>Asset</th><th style={thS}>Type</th><th style={thS}>Country</th><th style={{ ...thS, textAlign: 'right' }}>Jobs</th><th style={{ ...thS, textAlign: 'right' }}>Procurement</th><th style={{ ...thS, textAlign: 'center' }}>Score</th><th style={thS}>Resettle</th><th style={thS}>Indigenous</th><th style={thS}>SDGs</th></tr></thead><tbody>{assets.map(a => (<tr key={a.id} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{a.name}</td><td style={tdS}><Badge color={T.navyL}>{a.type}</Badge></td><td style={{ ...tdS, fontSize: 11 }}>{a.country}</td><td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>{a.jobs_created.toLocaleString()}</td><td style={{ ...tdS, textAlign: 'right' }}>{a.local_procurement_pct}%</td><td style={{ ...tdS, textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: 4, background: `${heatColor(a.community_impact_score)}18`, color: heatColor(a.community_impact_score), fontWeight: 700, fontSize: 11 }}>{a.community_impact_score}</span></td><td style={tdS}>{a.resettlement_required ? <Badge color={T.red}>Yes</Badge> : <Badge color={T.green}>No</Badge>}</td><td style={{ ...tdS, fontSize: 10 }}>{a.indigenous_impact}</td><td style={tdS}>{a.sdg_alignment.map(s => <Badge key={s} color={T.sage}>{s}</Badge>)}</td></tr>))}</tbody></table></div>
          </Card>

          {/* Sortable Table */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Infrastructure Portfolio Detail</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowAddForm(true); setTab('editor'); }} style={btnS(T.green)}>+ Add Asset</button>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inputS, width: 'auto' }}>{types.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <select value={epFilter} onChange={e => setEpFilter(e.target.value)} style={{ ...inputS, width: 'auto' }}><option value="All">All EP</option><option value="A">Cat A</option><option value="B">Cat B</option><option value="C">Cat C</option></select>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400 }}><thead><tr>{[['id','ID'],['name','Name'],['type','Type'],['country','Country'],['total_investment_usd_mn','Invest($M)'],['irr_target_pct','IRR%'],['ep_category','EP'],['composite_esg','ESG'],['environmental_score','E'],['social_score','S'],['governance_score','G'],['avoided_emissions_tco2e','Avoided(t)'],['jobs_created','Jobs'],['community_impact_score','Community'],['status','Status']].map(([col, label]) => (<th key={col} style={thS} onClick={() => handleSort(col)}>{label}<SortIcon active={sortCol === col} dir={sortDir} /></th>))}<th style={thS}>Actions</th></tr></thead><tbody>{filtered.map(a => (<tr key={a.id} onClick={() => setSelectedAsset(a.id)} style={{ cursor: 'pointer', background: selectedAsset === a.id ? `${T.navy}08` : 'transparent' }} onMouseEnter={e => { if (selectedAsset !== a.id) e.currentTarget.style.background = T.surfaceH; }} onMouseLeave={e => { e.currentTarget.style.background = selectedAsset === a.id ? `${T.navy}08` : 'transparent'; }}><td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{a.id}</td><td style={{ ...tdS, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</td><td style={tdS}><Badge color={T.navyL}>{a.type}</Badge></td><td style={{ ...tdS, fontSize: 11 }}>{a.country}</td><td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>${a.total_investment_usd_mn.toLocaleString()}</td><td style={{ ...tdS, textAlign: 'right' }}>{a.irr_target_pct}%</td><td style={{ ...tdS, textAlign: 'center' }}><span style={{ fontWeight: 700, color: EP_COLORS[a.ep_category] }}>{a.ep_category}</span></td><td style={{ ...tdS, textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: 4, background: `${a.composite_esg >= 75 ? T.green : a.composite_esg >= 65 ? T.amber : T.red}18`, color: a.composite_esg >= 75 ? T.green : a.composite_esg >= 65 ? T.amber : T.red, fontWeight: 700, fontSize: 11 }}>{a.composite_esg}</span></td><td style={{ ...tdS, textAlign: 'center', fontSize: 11 }}>{a.environmental_score}</td><td style={{ ...tdS, textAlign: 'center', fontSize: 11 }}>{a.social_score}</td><td style={{ ...tdS, textAlign: 'center', fontSize: 11 }}>{a.governance_score}</td><td style={{ ...tdS, textAlign: 'right', fontSize: 11 }}>{a.avoided_emissions_tco2e > 0 ? fmtK(a.avoided_emissions_tco2e) : '-'}</td><td style={{ ...tdS, textAlign: 'right', fontSize: 11 }}>{a.jobs_created.toLocaleString()}</td><td style={{ ...tdS, textAlign: 'center' }}><span style={{ padding: '2px 6px', borderRadius: 4, background: `${heatColor(a.community_impact_score)}18`, color: heatColor(a.community_impact_score), fontWeight: 600, fontSize: 10 }}>{a.community_impact_score}</span></td><td style={tdS}><Badge color={a.status === 'Operating' ? T.green : a.status === 'Construction' ? T.amber : T.navyL}>{a.status}</Badge></td><td style={tdS}><div style={{ display: 'flex', gap: 4 }}><button onClick={e => { e.stopPropagation(); setEditAssetId(a.id); setTab('editor'); }} style={{ ...btnS(T.navyL), padding: '4px 8px', fontSize: 10 }}>Edit</button><button onClick={e => { e.stopPropagation(); setDeleteConfirm(a.id); }} style={{ ...btnS(T.red), padding: '4px 8px', fontSize: 10 }}>Del</button></div></td></tr>))}</tbody></table></div>
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 8 }}>Showing {filtered.length} of {assets.length} assets</div>
          </Card>

          {/* Exports + Cross-nav */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ label: 'Export Portfolio CSV', fn: exportPortfolio }, { label: 'Export DD Status', fn: exportDD }, { label: 'Export IFC PS Scores', fn: exportIFC }].map(b => (<button key={b.label} onClick={b.fn} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = T.surface}>{b.label}</button>))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => nav('/re-portfolio-dashboard')} style={btnS(T.navy)}>RE Dashboard</button>
                <button onClick={() => nav('/climate-physical-risk')} style={btnS(T.sage)}>Physical Risk</button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ============== TAB: DD CHECKLIST ============== */}
      {tab === 'ddchecklist' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>Due Diligence Checklist</div>
            <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} style={{ ...inputS, width: 250 }}>{assets.map(a => <option key={a.id} value={a.id}>{a.id} - {a.name}</option>)}</select>
          </div>
          {sel && ['environmental', 'social', 'governance'].map(dim => {
            const items = DD_ITEMS[dim];
            const checks = sel.dd_checklist[dim];
            const done = checks.filter(Boolean).length;
            const dimColor = dim === 'environmental' ? T.sage : dim === 'social' ? T.gold : T.navy;
            return (
              <div key={dim} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: dimColor, textTransform: 'capitalize' }}>{dim} ({done}/{items.length})</div>
                  <div style={{ flex: 1, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${items.length ? done / items.length * 100 : 0}%`, height: '100%', background: dimColor, borderRadius: 4, transition: 'width 0.3s' }} /></div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: dimColor }}>{items.length ? (done / items.length * 100).toFixed(0) : 0}%</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={{ ...thS, width: 30 }}></th><th style={thS}>Item</th><th style={{ ...thS, width: 80 }}>Priority</th><th style={{ ...thS, width: 120 }}>Owner</th><th style={{ ...thS, width: 160 }}>Evidence</th><th style={{ ...thS, width: 110 }}>Due Date</th><th style={{ ...thS, width: 110 }}>Status</th></tr></thead>
                  <tbody>{items.map((item, idx) => {
                    const meta = getDDMeta(sel, dim, idx);
                    const statusColor = checks[idx] ? T.green : meta.status === 'In Progress' ? T.amber : meta.status === 'N/A' ? T.textMut : T.red;
                    return (
                      <tr key={idx} style={{ background: checks[idx] ? `${T.green}06` : 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = checks[idx] ? `${T.green}06` : 'transparent'}>
                        <td style={tdS}><input type="checkbox" checked={checks[idx]} onChange={e => { const newChecks = [...checks]; newChecks[idx] = e.target.checked; updateAsset(sel.id, { dd_checklist: { ...sel.dd_checklist, [dim]: newChecks } }); }} /></td>
                        <td style={{ ...tdS, fontSize: 11, fontWeight: 500 }}>{item}</td>
                        <td style={tdS}><select value={meta.priority || 'P2'} onChange={e => setDDMeta(sel.id, dim, idx, 'priority', e.target.value)} style={{ ...inputS, fontSize: 10, padding: '3px 4px', color: meta.priority === 'P1' ? T.red : meta.priority === 'P3' ? T.textMut : T.amber }}><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option></select></td>
                        <td style={tdS}><input value={meta.owner || ''} onChange={e => setDDMeta(sel.id, dim, idx, 'owner', e.target.value)} placeholder="Owner" style={{ ...inputS, fontSize: 10, padding: '3px 6px' }} /></td>
                        <td style={tdS}><input value={meta.evidence || ''} onChange={e => setDDMeta(sel.id, dim, idx, 'evidence', e.target.value)} placeholder="Evidence ref..." style={{ ...inputS, fontSize: 10, padding: '3px 6px' }} /></td>
                        <td style={tdS}><input type="date" value={meta.due || ''} onChange={e => setDDMeta(sel.id, dim, idx, 'due', e.target.value)} style={{ ...inputS, fontSize: 10, padding: '3px 4px' }} /></td>
                        <td style={tdS}><select value={meta.status || 'Not Started'} onChange={e => { setDDMeta(sel.id, dim, idx, 'status', e.target.value); if (e.target.value === 'Complete') { const newChecks = [...checks]; newChecks[idx] = true; updateAsset(sel.id, { dd_checklist: { ...sel.dd_checklist, [dim]: newChecks } }); } }} style={{ ...inputS, fontSize: 10, padding: '3px 4px', color: statusColor }}><option value="Not Started">Not Started</option><option value="In Progress">In Progress</option><option value="Complete">Complete</option><option value="N/A">N/A</option></select></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            );
          })}
        </Card>
      )}

      {/* ============== TAB: ASSET EDITOR ============== */}
      {tab === 'editor' && (
        <Card>
          {showAddForm ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>+ Add Infrastructure Asset</div>
                <button onClick={() => setShowAddForm(false)} style={btnS(T.textMut)}>Cancel</button>
              </div>
              {renderEditorForm(addDraft, setAddDraft, true)}
              <div style={{ marginTop: 16 }}><button onClick={() => addAsset(addDraft)} style={btnS(T.green)}>Save New Asset</button></div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>Edit Asset</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={editAssetId || selectedAsset} onChange={e => setEditAssetId(e.target.value)} style={{ ...inputS, width: 250 }}>{assets.map(a => <option key={a.id} value={a.id}>{a.id} - {a.name}</option>)}</select>
                  <button onClick={() => setShowAddForm(true)} style={btnS(T.green)}>+ New</button>
                </div>
              </div>
              {(() => {
                const a = assets.find(x => x.id === (editAssetId || selectedAsset));
                if (!a) return <div style={{ color: T.textMut }}>Select an asset to edit</div>;
                return (
                  <>
                    {renderEditorForm(a, changes => updateAsset(a.id, changes))}
                    <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                      <button onClick={() => setDeleteConfirm(a.id)} style={btnS(T.red)}>Delete Asset</button>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </Card>
      )}

      {/* ============== TAB: IFC PS ASSESSMENT ============== */}
      {tab === 'ifcps' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>IFC Performance Standards Assessment</div>
            <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} style={{ ...inputS, width: 250 }}>{assets.map(a => <option key={a.id} value={a.id}>{a.id} - {a.name}</option>)}</select>
          </div>
          {sel && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>PS Score Sliders</div>
                {psLabels.map((label, i) => {
                  const k = `ps${i + 1}`;
                  const val = sel.ifc_ps[k];
                  const gap = 100 - val;
                  const remedCost = gap > 30 ? `$${(gap * 50).toLocaleString()}K` : gap > 10 ? `$${(gap * 30).toLocaleString()}K` : `$${(gap * 15).toLocaleString()}K`;
                  return (
                    <div key={k} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, color: T.text }}>{label}</span>
                        <span style={{ color: T.textSec }}>Score: <b style={{ color: val >= 80 ? T.green : val >= 60 ? T.amber : T.red }}>{val}</b>/100 | Gap: {gap} | Est. remediation: {remedCost}</span>
                      </div>
                      <input type="range" min={0} max={100} value={val} onChange={e => updatePS(sel.id, k, e.target.value)} style={{ width: '100%', accentColor: val >= 80 ? T.green : val >= 60 ? T.amber : T.red }} />
                    </div>
                  );
                })}
                <div style={{ marginTop: 16, padding: 12, background: `${T.navy}08`, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>Composite ESG (auto-calculated from PS avg)</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: sel.composite_esg >= 75 ? T.green : sel.composite_esg >= 60 ? T.amber : T.red }}>{sel.composite_esg}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Radar Chart</div>
                <ResponsiveContainer width="100%" height={360}><RadarChart data={radarData}><PolarGrid stroke={T.border} /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: T.textSec }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} /><Radar name={sel.name} dataKey="asset" stroke={T.navy} fill={T.navy} fillOpacity={0.25} /><Radar name="Portfolio Avg" dataKey="average" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeDasharray="4 4" /><Legend wrapperStyle={{ fontSize: 11 }} /><Tooltip /></RadarChart></ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ============== TAB: FINANCIAL STRUCTURE ============== */}
      {tab === 'finance' && (
        <>
          {/* Blended Finance Editor */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>Blended Finance Structure</div>
              <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} style={{ ...inputS, width: 250 }}>{assets.map(a => <option key={a.id} value={a.id}>{a.id} - {a.name}</option>)}</select>
            </div>
            {sel && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  {[{ key: 'equity_pct', label: 'Equity', color: T.navy }, { key: 'commercial_debt_pct', label: 'Commercial Debt', color: T.navyL }, { key: 'dfi_pct', label: 'DFI / MDB', color: T.gold }, { key: 'concessional_pct', label: 'Concessional', color: T.sage }].map(s => (
                    <div key={s.key} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, color: s.color }}>{s.label}</span>
                        <span style={{ fontWeight: 700, color: s.color }}>{sel.blended_finance[s.key]}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={sel.blended_finance[s.key]} onChange={e => updateBlended(sel.id, s.key, e.target.value)} style={{ width: '100%', accentColor: s.color }} />
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 8 }}>Total: {Object.values(sel.blended_finance).reduce((s, v) => s + v, 0)}% (auto-rebalances to 100%)</div>
                </div>
                <div>
                  <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={[{ name: 'Equity', value: sel.blended_finance.equity_pct }, { name: 'Commercial', value: sel.blended_finance.commercial_debt_pct }, { name: 'DFI', value: sel.blended_finance.dfi_pct }, { name: 'Concessional', value: sel.blended_finance.concessional_pct }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} ${value}%`}><Cell fill={T.navy} /><Cell fill={T.navyL} /><Cell fill={T.gold} /><Cell fill={T.sage} /></Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>

          {/* All-asset blended finance stacked bar */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Blended Finance Structure by Asset</div>
            <ResponsiveContainer width="100%" height={350}><BarChart data={blendedData} margin={{ bottom: 50 }}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-35} textAnchor="end" /><YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} tickFormatter={v => `${v}%`} /><Tooltip formatter={v => `${v}%`} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Equity" stackId="a" fill={T.navy} /><Bar dataKey="Commercial Debt" stackId="a" fill={T.navyL} /><Bar dataKey="DFI" stackId="a" fill={T.gold} /><Bar dataKey="Concessional" stackId="a" fill={T.sage} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          </Card>

          {/* Concession Timeline */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Concession Timeline & Construction Status</div>
            <ResponsiveContainer width="100%" height={350}><BarChart data={concessionData} layout="vertical" margin={{ left: 100 }}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={95} /><Tooltip content={({ active, payload }) => active && payload?.length ? (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12 }}><div style={{ fontWeight: 700, color: T.navy }}>{payload[0].payload.name}</div><div>Remaining: <b>{payload[0].payload.remaining} yrs</b></div><div>Status: <b>{payload[0].payload.status}</b></div></div>) : null} /><Bar dataKey="elapsed" stackId="a" fill={T.textMut} name="Elapsed" /><Bar dataKey="remaining" stackId="a" fill={T.sage} name="Remaining" radius={[0, 4, 4, 0]} /><Legend wrapperStyle={{ fontSize: 11 }} /></BarChart></ResponsiveContainer>
          </Card>
        </>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: T.surface, borderRadius: 14, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.red, marginBottom: 12 }}>Delete Asset</div>
            <div style={{ fontSize: 13, color: T.text, marginBottom: 20 }}>Are you sure you want to delete <b>{assets.find(a => a.id === deleteConfirm)?.name}</b>? This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ ...btnS(T.surface, T.text), border: `1px solid ${T.border}` }}>Cancel</button>
              <button onClick={() => deleteAsset(deleteConfirm)} style={btnS(T.red)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
