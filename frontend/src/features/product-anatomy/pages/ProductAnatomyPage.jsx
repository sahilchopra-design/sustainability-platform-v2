import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line, Area,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ================================================================= THEME */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif"};
const ESG_COLORS={low:'#16a34a',medium:'#d97706',high:'#dc2626',critical:'#991b1b'};
const MAT_COLORS=['#1b3a5c','#c5a96a','#5a8a6a','#dc2626','#7c3aed','#d97706','#06b6d4','#8b5cf6','#f59e0b','#10b981','#ef4444','#6366f1','#ec4899','#14b8a6','#f97316'];

/* ================================================================= DATA */
const LS_PORT='ra_portfolio_v1';
const LS_CUSTOM='ra_custom_products_v1';
const loadLS=k=>{try{return JSON.parse(localStorage.getItem(k))||null}catch{return null}};
const saveLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const fmt=(n,d=1)=>n==null?'\u2014':Number(n).toFixed(d);
const fmtUSD=n=>{if(n==null)return'\u2014';if(n>=1e9)return`$${(n/1e9).toFixed(1)}B`;if(n>=1e6)return`$${(n/1e6).toFixed(1)}M`;if(n>=1000)return`$${(n/1000).toFixed(1)}K`;return`$${Number(n).toFixed(2)}`};
const fmtG=n=>{if(n==null)return'\u2014';if(n>=1000)return`${(n/1000).toFixed(1)} kg`;return`${Number(n).toFixed(0)} g`};
const fmtL=n=>{if(n==null)return'\u2014';if(n>=1000)return`${(n/1000).toFixed(1)} kL`;return`${Number(n).toFixed(0)} L`};
const esgColor=v=>v>=80?ESG_COLORS.critical:v>=60?ESG_COLORS.high:v>=40?ESG_COLORS.medium:ESG_COLORS.low;

const PRODUCT_ANATOMY = {
  smartphone:{name:'Smartphone (avg flagship)',icon:'\u{1F4F1}',retail_price:999,weight_g:185,lifespan_years:3,category:'Electronics',
    components:[
      {material:'Lithium',component:'Battery',quantity_g:0.8,cost_usd:0.01,pct_of_cost:0.001,source_countries:['AU','CL','CN'],esg_risk:55,carbon_g:12,water_l:1.6,child_labor_risk:'Low',conflict_mineral:false,recyclable:true,recycling_rate:0.05,commodity_id:'LITHIUM'},
      {material:'Cobalt',component:'Battery cathode',quantity_g:6.3,cost_usd:0.18,pct_of_cost:0.02,source_countries:['CD','AU'],esg_risk:85,carbon_g:45,water_l:8.5,child_labor_risk:'Critical (DRC artisanal)',conflict_mineral:true,recyclable:true,recycling_rate:0.15,commodity_id:'COBALT'},
      {material:'Copper',component:'Wiring, connectors',quantity_g:15.0,cost_usd:0.13,pct_of_cost:0.01,source_countries:['CL','PE','CN','CD'],esg_risk:60,carbon_g:75,water_l:45,child_labor_risk:'Low',conflict_mineral:false,recyclable:true,recycling_rate:0.30,commodity_id:'COPPER'},
      {material:'Gold',component:'Circuit board contacts',quantity_g:0.03,cost_usd:2.50,pct_of_cost:0.25,source_countries:['CN','AU','RU','US'],esg_risk:65,carbon_g:0.5,water_l:30,child_labor_risk:'Medium (artisanal)',conflict_mineral:true,recyclable:true,recycling_rate:0.25,commodity_id:'GOLD'},
      {material:'Rare Earth Elements',component:'Magnets, vibration motor',quantity_g:0.5,cost_usd:0.02,pct_of_cost:0.002,source_countries:['CN (90%)'],esg_risk:72,carbon_g:8,water_l:5,child_labor_risk:'Low',conflict_mineral:false,recyclable:false,recycling_rate:0.01,geopolitical_risk:'Very High (China dominance)',commodity_id:'RARE_EARTH'},
      {material:'Silicon',component:'Processor chip',quantity_g:2.0,cost_usd:85.00,pct_of_cost:8.5,source_countries:['TW','KR','US'],esg_risk:35,carbon_g:100,water_l:32000,child_labor_risk:'None',note:'TSMC/Samsung fab \u2014 extreme water use per wafer'},
      {material:'Aluminum',component:'Casing',quantity_g:30.0,cost_usd:0.07,pct_of_cost:0.007,source_countries:['CN','RU','CA'],esg_risk:55,carbon_g:270,water_l:15,recyclable:true,recycling_rate:0.70,commodity_id:'ALUMINUM'},
      {material:'Glass (Gorilla)',component:'Screen',quantity_g:35.0,cost_usd:3.50,pct_of_cost:0.35,source_countries:['US (Corning)','JP'],esg_risk:30,carbon_g:85,water_l:10},
      {material:'Plastic (various)',component:'Internal components',quantity_g:45.0,cost_usd:0.15,pct_of_cost:0.015,source_countries:['CN','KR','JP'],esg_risk:50,carbon_g:95,water_l:25,recyclable:false,ocean_pollution_risk:'High'},
      {material:'Tin',component:'Solder',quantity_g:1.0,cost_usd:0.03,pct_of_cost:0.003,source_countries:['CN','ID','MM'],esg_risk:70,conflict_mineral:true},
      {material:'Tantalum',component:'Capacitors',quantity_g:0.04,cost_usd:0.01,source_countries:['CD','RW','AU'],esg_risk:80,conflict_mineral:true,child_labor_risk:'High (DRC)'},
      {material:'Tungsten',component:'Vibration motor',quantity_g:0.6,cost_usd:0.02,source_countries:['CN','RU','VN'],conflict_mineral:true},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:12.00,pct_of_cost:1.2,source_countries:['CN (Foxconn)','IN','VN'],esg_risk:65,carbon_g:15,living_wage_gap:'35% below living wage in some suppliers'},
      {material:'IP & Software',component:'Design, R&D, OS',quantity_g:0,cost_usd:450.00,pct_of_cost:45.0,source_countries:['US','KR'],esg_risk:20,note:'Largest cost component \u2014 intangible'},
      {material:'Packaging & Retail',component:'Box, transport, store',quantity_g:0,cost_usd:35.00,pct_of_cost:3.5},
    ],
    end_of_life:{e_waste_kg:0.185,recycled_pct:17,landfill_pct:83,toxic_materials:['Lithium (fire risk)','Cobalt (toxic)','Lead (solder)'],gold_recoverable_usd:1.50,total_recoverable_usd:3.20,recycling_cost_usd:5.00},
    externalities:{carbon_total_kg:70,water_total_l:12700,land_total_m2:0.2,conflict_minerals_count:4,child_labor_exposure:true,e_waste_contribution:true}},
  electric_car:{name:'Electric Vehicle (compact)',icon:'\u{1F697}',retail_price:42000,weight_g:1800000,lifespan_years:15,category:'Transport',
    components:[
      {material:'Lithium',component:'Battery pack',quantity_g:8000,cost_usd:96,pct_of_cost:0.23,source_countries:['AU','CL','CN','AR'],esg_risk:55,carbon_g:96000,water_l:12800,child_labor_risk:'Low',conflict_mineral:false,recyclable:true,recycling_rate:0.05,commodity_id:'LITHIUM'},
      {material:'Cobalt',component:'Battery cathode (NMC)',quantity_g:6400,cost_usd:179,pct_of_cost:0.43,source_countries:['CD','AU'],esg_risk:85,carbon_g:288000,water_l:54400,child_labor_risk:'Critical (DRC)',conflict_mineral:true,recyclable:true,recycling_rate:0.15,commodity_id:'COBALT'},
      {material:'Nickel',component:'Battery cathode',quantity_g:11000,cost_usd:178,pct_of_cost:0.42,source_countries:['ID','PH','RU'],esg_risk:60,carbon_g:110000,water_l:22000,commodity_id:'NICKEL'},
      {material:'Copper',component:'Motor, wiring, bus bars',quantity_g:83000,cost_usd:743,pct_of_cost:1.77,source_countries:['CL','PE','CN'],esg_risk:55,carbon_g:415000,water_l:249000,recyclable:true,recycling_rate:0.50,commodity_id:'COPPER'},
      {material:'Aluminum',component:'Body, chassis, battery housing',quantity_g:250000,cost_usd:588,pct_of_cost:1.4,source_countries:['CN','RU','CA','AU'],esg_risk:55,carbon_g:2250000,water_l:125000,recyclable:true,recycling_rate:0.80,commodity_id:'ALUMINUM'},
      {material:'Steel',component:'Structural frame',quantity_g:900000,cost_usd:612,pct_of_cost:1.46,source_countries:['CN','JP','KR','IN'],esg_risk:50,carbon_g:1620000,water_l:180000,recyclable:true,recycling_rate:0.85,commodity_id:'STEEL'},
      {material:'Rare Earth Elements',component:'Permanent magnets (motor)',quantity_g:1500,cost_usd:63,pct_of_cost:0.15,source_countries:['CN (90%)'],esg_risk:72,carbon_g:24000,water_l:7500,geopolitical_risk:'Very High',commodity_id:'RARE_EARTH'},
      {material:'Graphite',component:'Battery anode',quantity_g:52000,cost_usd:34,pct_of_cost:0.08,source_countries:['CN','MZ','BR'],esg_risk:45,carbon_g:52000,water_l:26000},
      {material:'Glass',component:'Windshield, windows',quantity_g:35000,cost_usd:280,pct_of_cost:0.67,source_countries:['Global'],esg_risk:30,carbon_g:25000,water_l:3500},
      {material:'Rubber',component:'Tires',quantity_g:40000,cost_usd:200,pct_of_cost:0.48,source_countries:['TH','ID','VN'],esg_risk:50,carbon_g:80000,water_l:8000,deforestation_risk:'Medium'},
      {material:'Plastics & Polymers',component:'Interior, bumpers',quantity_g:150000,cost_usd:450,pct_of_cost:1.07,source_countries:['Global'],esg_risk:45,carbon_g:450000,water_l:75000,recyclable:false,ocean_pollution_risk:'Medium'},
      {material:'Silicon',component:'Power electronics, chips',quantity_g:500,cost_usd:1200,pct_of_cost:2.86,source_countries:['TW','KR','US'],esg_risk:35,carbon_g:25000,water_l:8000000},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:4500,pct_of_cost:10.7,source_countries:['DE','US','CN','JP'],esg_risk:35,carbon_g:150000},
      {material:'IP, R&D & Software',component:'Design, engineering, OS',quantity_g:0,cost_usd:12000,pct_of_cost:28.6,source_countries:['US','DE','JP'],esg_risk:15},
      {material:'Battery Management System',component:'Electronics & firmware',quantity_g:2000,cost_usd:800,pct_of_cost:1.9,source_countries:['US','KR','JP'],esg_risk:25},
    ],
    end_of_life:{e_waste_kg:350,recycled_pct:65,landfill_pct:20,toxic_materials:['Lithium (fire risk)','Cobalt','Coolant fluids'],gold_recoverable_usd:15,total_recoverable_usd:2800,recycling_cost_usd:1500},
    externalities:{carbon_total_kg:8500,water_total_l:8750000,land_total_m2:35,conflict_minerals_count:2,child_labor_exposure:true,e_waste_contribution:true}},
  fast_fashion_tshirt:{name:'Fast Fashion T-Shirt',icon:'\u{1F455}',retail_price:12,weight_g:150,lifespan_years:1,category:'Textiles',
    components:[
      {material:'Cotton',component:'Fabric (conventional)',quantity_g:120,cost_usd:0.36,pct_of_cost:3.0,source_countries:['IN','CN','US','UZ'],esg_risk:60,carbon_g:2400,water_l:2160,child_labor_risk:'Medium (India, Uzbekistan)',pesticide_use:'High',recyclable:true,recycling_rate:0.12},
      {material:'Polyester',component:'Blend fabric',quantity_g:30,cost_usd:0.06,pct_of_cost:0.5,source_countries:['CN','IN','TW'],esg_risk:55,carbon_g:1100,water_l:12,microplastic_release:'High',fossil_derived:true,recyclable:false},
      {material:'Dye chemicals',component:'Coloring',quantity_g:5,cost_usd:0.02,pct_of_cost:0.17,source_countries:['CN','IN'],esg_risk:75,carbon_g:50,water_l:200,water_pollution:'High (untreated effluent)'},
      {material:'Thread & Trim',component:'Stitching, buttons, labels',quantity_g:8,cost_usd:0.05,pct_of_cost:0.42,source_countries:['CN'],esg_risk:40,carbon_g:30,water_l:5},
      {material:'Labor',component:'Sewing, finishing',quantity_g:0,cost_usd:0.50,pct_of_cost:4.2,source_countries:['BD','KH','VN','MM'],esg_risk:80,carbon_g:10,living_wage_gap:'60-80% below living wage',child_labor_risk:'Medium'},
      {material:'Transport',component:'Shipping to market',quantity_g:0,cost_usd:0.30,pct_of_cost:2.5,source_countries:['Global'],carbon_g:500},
      {material:'Brand & Retail',component:'Marketing, store, margin',quantity_g:0,cost_usd:8.50,pct_of_cost:70.8,source_countries:['US','EU'],esg_risk:10},
      {material:'Packaging',component:'Polybag, tags, hangers',quantity_g:15,cost_usd:0.08,pct_of_cost:0.67,source_countries:['CN'],esg_risk:45,ocean_pollution_risk:'High'},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:12,landfill_pct:73,incinerated_pct:15,toxic_materials:['Dye chemicals','Microplastics'],total_recoverable_usd:0.02,recycling_cost_usd:0.50},
    externalities:{carbon_total_kg:6.5,water_total_l:2700,land_total_m2:5.5,conflict_minerals_count:0,child_labor_exposure:true}},
  chocolate_bar:{name:'Chocolate Bar (100g)',icon:'\u{1F36B}',retail_price:3.50,weight_g:100,lifespan_years:0.5,category:'Food',
    components:[
      {material:'Cocoa beans',component:'Chocolate mass',quantity_g:35,cost_usd:0.30,pct_of_cost:8.6,source_countries:['CI','GH','ID'],esg_risk:80,carbon_g:665,water_l:560,child_labor_risk:'High (West Africa)',deforestation_risk:'High',commodity_id:'COCOA'},
      {material:'Cocoa butter',component:'Fat base',quantity_g:20,cost_usd:0.25,pct_of_cost:7.1,source_countries:['CI','GH'],esg_risk:75,carbon_g:380,water_l:320},
      {material:'Sugar',component:'Sweetener',quantity_g:30,cost_usd:0.03,pct_of_cost:0.86,source_countries:['BR','IN','TH'],esg_risk:45,carbon_g:60,water_l:54,labor_risk:'Medium (sugarcane cutters)'},
      {material:'Milk powder',component:'Dairy solids',quantity_g:12,cost_usd:0.08,pct_of_cost:2.3,source_countries:['EU','NZ','US'],esg_risk:40,carbon_g:150,water_l:144,methane_emitter:true},
      {material:'Soy lecithin',component:'Emulsifier',quantity_g:0.5,cost_usd:0.005,pct_of_cost:0.14,source_countries:['BR','AR','US'],esg_risk:55,deforestation_risk:'High'},
      {material:'Packaging',component:'Foil wrapper, cardboard',quantity_g:10,cost_usd:0.05,pct_of_cost:1.4,source_countries:['Global'],esg_risk:35,carbon_g:25,recyclable:true,recycling_rate:0.55},
      {material:'Brand & Retail',component:'Marketing, distribution',quantity_g:0,cost_usd:2.20,pct_of_cost:62.9,source_countries:['US','EU'],esg_risk:10},
      {material:'Labor (farming)',component:'Cocoa farming',quantity_g:0,cost_usd:0.12,pct_of_cost:3.4,source_countries:['CI','GH'],esg_risk:85,child_labor_risk:'Critical',living_wage_gap:'70% below living wage'},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:55,landfill_pct:40,toxic_materials:[],total_recoverable_usd:0.01,recycling_cost_usd:0.02},
    externalities:{carbon_total_kg:19.0,water_total_l:1700,land_total_m2:4.2,conflict_minerals_count:0,child_labor_exposure:true}},
  laptop:{name:'Laptop Computer',icon:'\u{1F4BB}',retail_price:1299,weight_g:1400,lifespan_years:5,category:'Electronics',
    components:[
      {material:'Lithium',component:'Battery',quantity_g:4.5,cost_usd:0.05,pct_of_cost:0.004,source_countries:['AU','CL','CN'],esg_risk:55,carbon_g:54,water_l:7.2,recyclable:true,recycling_rate:0.05,commodity_id:'LITHIUM'},
      {material:'Cobalt',component:'Battery cathode',quantity_g:22,cost_usd:0.62,pct_of_cost:0.05,source_countries:['CD','AU'],esg_risk:85,carbon_g:155,water_l:29,child_labor_risk:'Critical (DRC)',conflict_mineral:true,commodity_id:'COBALT'},
      {material:'Copper',component:'Wiring, heat pipes',quantity_g:40,cost_usd:0.36,pct_of_cost:0.03,source_countries:['CL','PE'],esg_risk:55,carbon_g:200,water_l:120,recyclable:true,recycling_rate:0.35,commodity_id:'COPPER'},
      {material:'Gold',component:'PCB contacts, connectors',quantity_g:0.2,cost_usd:16.70,pct_of_cost:1.29,source_countries:['CN','AU','RU'],esg_risk:65,carbon_g:3.3,water_l:200,conflict_mineral:true,commodity_id:'GOLD'},
      {material:'Aluminum',component:'Unibody chassis',quantity_g:300,cost_usd:0.71,pct_of_cost:0.05,source_countries:['CN','RU','CA'],esg_risk:55,carbon_g:2700,water_l:150,recyclable:true,recycling_rate:0.75,commodity_id:'ALUMINUM'},
      {material:'Silicon',component:'CPU, GPU, RAM, SSD',quantity_g:15,cost_usd:250.00,pct_of_cost:19.2,source_countries:['TW','KR','US'],esg_risk:35,carbon_g:750,water_l:240000,note:'Multiple wafer processes'},
      {material:'Glass',component:'Display panel',quantity_g:120,cost_usd:45.00,pct_of_cost:3.46,source_countries:['KR','JP','CN'],esg_risk:30,carbon_g:290,water_l:35},
      {material:'Plastic',component:'Keyboard, bezel, internals',quantity_g:350,cost_usd:1.20,pct_of_cost:0.09,source_countries:['CN'],esg_risk:50,carbon_g:735,water_l:195,recyclable:false},
      {material:'Rare Earth Elements',component:'HDD magnets, speakers',quantity_g:2.0,cost_usd:0.08,pct_of_cost:0.006,source_countries:['CN (90%)'],esg_risk:72,carbon_g:32,water_l:20,geopolitical_risk:'Very High',commodity_id:'RARE_EARTH'},
      {material:'Tin',component:'Solder',quantity_g:5,cost_usd:0.14,pct_of_cost:0.01,source_countries:['CN','ID'],esg_risk:70,conflict_mineral:true},
      {material:'Tantalum',component:'Capacitors',quantity_g:0.3,cost_usd:0.08,pct_of_cost:0.006,source_countries:['CD','RW'],esg_risk:80,conflict_mineral:true,child_labor_risk:'High'},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:25.00,pct_of_cost:1.92,source_countries:['CN','TW'],esg_risk:55},
      {material:'IP & Software',component:'Design, R&D, OS licenses',quantity_g:0,cost_usd:580.00,pct_of_cost:44.6,source_countries:['US'],esg_risk:15},
      {material:'Packaging & Retail',component:'Box, charger, logistics',quantity_g:0,cost_usd:40.00,pct_of_cost:3.08,source_countries:['Global']},
    ],
    end_of_life:{e_waste_kg:1.4,recycled_pct:22,landfill_pct:78,toxic_materials:['Lithium','Mercury (backlight)','Cobalt','Lead'],gold_recoverable_usd:10.50,total_recoverable_usd:18.00,recycling_cost_usd:12.00},
    externalities:{carbon_total_kg:350,water_total_l:190000,land_total_m2:0.5,conflict_minerals_count:4,child_labor_exposure:true,e_waste_contribution:true}},
  solar_panel:{name:'Solar Panel (400W mono)',icon:'\u2600\uFE0F',retail_price:280,weight_g:22000,lifespan_years:30,category:'Energy',
    components:[
      {material:'Silicon (polysilicon)',component:'Solar cells',quantity_g:1200,cost_usd:10.20,pct_of_cost:3.6,source_countries:['CN (80%)','US','DE'],esg_risk:50,carbon_g:14400,water_l:192000,geopolitical_risk:'High (Xinjiang)',commodity_id:'SILICON'},
      {material:'Silver',component:'Cell contacts',quantity_g:12,cost_usd:11.40,pct_of_cost:4.07,source_countries:['MX','PE','CN'],esg_risk:45,carbon_g:36,water_l:1440},
      {material:'Aluminum',component:'Frame',quantity_g:8000,cost_usd:18.80,pct_of_cost:6.7,source_countries:['CN','IN'],esg_risk:55,carbon_g:72000,water_l:4000,recyclable:true,recycling_rate:0.85,commodity_id:'ALUMINUM'},
      {material:'Glass (tempered)',component:'Front cover',quantity_g:10000,cost_usd:5.00,pct_of_cost:1.79,source_countries:['CN','DE'],esg_risk:30,carbon_g:24000,water_l:2900},
      {material:'Copper',component:'Wiring, junction box',quantity_g:500,cost_usd:4.48,pct_of_cost:1.6,source_countries:['CL','PE'],esg_risk:55,carbon_g:2500,water_l:1500,recyclable:true,recycling_rate:0.60,commodity_id:'COPPER'},
      {material:'EVA (polymer)',component:'Encapsulant',quantity_g:1500,cost_usd:2.25,pct_of_cost:0.8,source_countries:['CN'],esg_risk:40,carbon_g:3000,water_l:750},
      {material:'Backsheet (PVF)',component:'Rear protection',quantity_g:600,cost_usd:1.80,pct_of_cost:0.64,source_countries:['US','JP'],esg_risk:35,carbon_g:1200,water_l:300},
      {material:'Tin',component:'Solder ribbons',quantity_g:15,cost_usd:0.42,pct_of_cost:0.15,source_countries:['CN','ID'],esg_risk:60,conflict_mineral:true},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:35.00,pct_of_cost:12.5,source_countries:['CN','VN','MY'],esg_risk:45},
      {material:'Logistics & Retail',component:'Shipping, installer margin',quantity_g:0,cost_usd:80.00,pct_of_cost:28.6,source_countries:['Global']},
    ],
    end_of_life:{e_waste_kg:22,recycled_pct:30,landfill_pct:65,toxic_materials:['Lead (solder)','Cadmium (some thin-film)'],total_recoverable_usd:8.50,recycling_cost_usd:15.00},
    externalities:{carbon_total_kg:1200,water_total_l:210000,land_total_m2:2.0,conflict_minerals_count:1,child_labor_exposure:false}},
  concrete_building:{name:'Concrete Building (1 m\u00B3)',icon:'\u{1F3D7}\uFE0F',retail_price:150,weight_g:2400000,lifespan_years:75,category:'Construction',
    components:[
      {material:'Portland Cement',component:'Binder',quantity_g:350000,cost_usd:43.75,pct_of_cost:29.2,source_countries:['Local','CN','IN'],esg_risk:65,carbon_g:297500,water_l:175,commodity_id:'CEMENT'},
      {material:'Sand & Gravel',component:'Aggregates',quantity_g:1850000,cost_usd:22.20,pct_of_cost:14.8,source_countries:['Local'],esg_risk:45,carbon_g:37000,water_l:1850,ecosystem_impact:'River erosion'},
      {material:'Water',component:'Mixing water',quantity_g:175000,cost_usd:0.05,pct_of_cost:0.03,source_countries:['Local'],esg_risk:25,water_l:175},
      {material:'Steel (rebar)',component:'Reinforcement',quantity_g:100000,cost_usd:68.00,pct_of_cost:45.3,source_countries:['CN','IN','JP'],esg_risk:55,carbon_g:185000,water_l:28000,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'Fly Ash / Slag',component:'Supplementary cementitious',quantity_g:50000,cost_usd:2.50,pct_of_cost:1.67,source_countries:['Local'],esg_risk:20,carbon_g:5000,note:'Waste byproduct \u2014 reduces cement need'},
      {material:'Labor',component:'Mixing, pouring, curing',quantity_g:0,cost_usd:12.00,pct_of_cost:8.0,source_countries:['Local'],esg_risk:40},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:40,landfill_pct:55,toxic_materials:['Chromium VI (cement dust)'],total_recoverable_usd:5.00,recycling_cost_usd:8.00},
    externalities:{carbon_total_kg:520,water_total_l:30000,land_total_m2:0,conflict_minerals_count:0,child_labor_exposure:false}},
  leather_shoes:{name:'Leather Shoes (pair)',icon:'\u{1F45E}',retail_price:120,weight_g:700,lifespan_years:3,category:'Textiles',
    components:[
      {material:'Bovine Leather',component:'Upper, lining',quantity_g:350,cost_usd:8.75,pct_of_cost:7.3,source_countries:['IT','BR','IN','CN'],esg_risk:70,carbon_g:5950,water_l:5810,deforestation_risk:'High',tanning_chemicals:'Chromium',commodity_id:'CATTLE'},
      {material:'Rubber',component:'Sole',quantity_g:200,cost_usd:1.20,pct_of_cost:1.0,source_countries:['TH','ID','VN'],esg_risk:50,carbon_g:400,water_l:400,deforestation_risk:'Medium'},
      {material:'Textile (lining)',component:'Inner lining',quantity_g:80,cost_usd:0.40,pct_of_cost:0.33,source_countries:['CN','BD'],esg_risk:55,carbon_g:160,water_l:1440},
      {material:'Adhesives & Chemicals',component:'Glue, finish',quantity_g:30,cost_usd:0.30,pct_of_cost:0.25,source_countries:['CN','DE'],esg_risk:60,carbon_g:90,water_l:60,voc_emissions:'Medium'},
      {material:'Metal',component:'Eyelets, shank',quantity_g:20,cost_usd:0.15,pct_of_cost:0.13,source_countries:['CN'],esg_risk:40,carbon_g:40},
      {material:'Labor',component:'Crafting, finishing',quantity_g:0,cost_usd:8.00,pct_of_cost:6.67,source_countries:['VN','CN','IT','IN'],esg_risk:60,living_wage_gap:'40% below in Asia'},
      {material:'Brand & Retail',component:'Marketing, store margin',quantity_g:0,cost_usd:85.00,pct_of_cost:70.8,source_countries:['US','EU'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:5,landfill_pct:85,incinerated_pct:10,toxic_materials:['Chromium (tanning)','Formaldehyde'],total_recoverable_usd:0.05,recycling_cost_usd:1.00},
    externalities:{carbon_total_kg:17.0,water_total_l:16600,land_total_m2:18,conflict_minerals_count:0,child_labor_exposure:false}},
  disposable_cup:{name:'Disposable Coffee Cup',icon:'\u2615',retail_price:0.15,weight_g:12,lifespan_years:0.001,category:'Industrial',
    components:[
      {material:'Paper (virgin)',component:'Cup body',quantity_g:9,cost_usd:0.04,pct_of_cost:26.7,source_countries:['US','BR','FI'],esg_risk:40,carbon_g:13,water_l:3.6,deforestation_risk:'Low (managed forests)'},
      {material:'Polyethylene (PE)',component:'Waterproof lining',quantity_g:2,cost_usd:0.01,pct_of_cost:6.7,source_countries:['US','SA','CN'],esg_risk:55,carbon_g:6,water_l:0.4,fossil_derived:true,recyclable:false,note:'Makes cup non-recyclable'},
      {material:'Ink',component:'Branding print',quantity_g:0.5,cost_usd:0.005,pct_of_cost:3.3,source_countries:['Global'],esg_risk:30},
      {material:'Lid (polystyrene)',component:'Plastic lid',quantity_g:3,cost_usd:0.02,pct_of_cost:13.3,source_countries:['CN','US'],esg_risk:60,carbon_g:9,ocean_pollution_risk:'Very High',recyclable:false},
      {material:'Manufacturing',component:'Forming, printing',quantity_g:0,cost_usd:0.03,pct_of_cost:20.0,source_countries:['Local'],esg_risk:30},
      {material:'Distribution',component:'Transport to cafe',quantity_g:0,cost_usd:0.02,pct_of_cost:13.3,source_countries:['Local'],carbon_g:2},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:1,landfill_pct:92,incinerated_pct:7,toxic_materials:['Polystyrene (styrene)'],total_recoverable_usd:0.001,recycling_cost_usd:0.05},
    externalities:{carbon_total_kg:0.11,water_total_l:5.5,land_total_m2:0.003,conflict_minerals_count:0,child_labor_exposure:false}},
  washing_machine:{name:'Washing Machine',icon:'\u{1F9FA}',retail_price:650,weight_g:70000,lifespan_years:12,category:'Appliances',
    components:[
      {material:'Steel',component:'Drum, frame, panels',quantity_g:45000,cost_usd:30.60,pct_of_cost:4.71,source_countries:['CN','KR','TR'],esg_risk:50,carbon_g:81000,water_l:9000,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'Copper',component:'Motor windings, wiring',quantity_g:3000,cost_usd:26.85,pct_of_cost:4.13,source_countries:['CL','PE'],esg_risk:55,carbon_g:15000,water_l:9000,recyclable:true,recycling_rate:0.50,commodity_id:'COPPER'},
      {material:'Aluminum',component:'Heat exchanger',quantity_g:2000,cost_usd:4.70,pct_of_cost:0.72,source_countries:['CN'],esg_risk:55,carbon_g:18000,water_l:1000,recyclable:true,recycling_rate:0.75,commodity_id:'ALUMINUM'},
      {material:'Plastic (PP/ABS)',component:'Housing, controls, tub',quantity_g:15000,cost_usd:7.50,pct_of_cost:1.15,source_countries:['CN','KR'],esg_risk:50,carbon_g:31500,water_l:8250,recyclable:false},
      {material:'Rubber',component:'Door seal, hoses',quantity_g:3000,cost_usd:4.50,pct_of_cost:0.69,source_countries:['TH','MY'],esg_risk:45,carbon_g:6000,water_l:600},
      {material:'Glass',component:'Door window',quantity_g:2500,cost_usd:2.50,pct_of_cost:0.38,source_countries:['CN'],esg_risk:30,carbon_g:6000,water_l:725},
      {material:'Electronics',component:'PCB, sensors, display',quantity_g:500,cost_usd:35.00,pct_of_cost:5.38,source_countries:['CN','TW','KR'],esg_risk:45,carbon_g:2500,water_l:8000},
      {material:'Concrete',component:'Counterweight',quantity_g:25000,cost_usd:0.75,pct_of_cost:0.12,source_countries:['Local'],esg_risk:35,carbon_g:15500},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:45.00,pct_of_cost:6.92,source_countries:['CN','TR','KR'],esg_risk:45},
      {material:'IP, R&D & Warranty',component:'Design, software, support',quantity_g:0,cost_usd:180.00,pct_of_cost:27.7,source_countries:['KR','DE','US'],esg_risk:15},
      {material:'Packaging & Retail',component:'Cardboard, logistics, margin',quantity_g:0,cost_usd:120.00,pct_of_cost:18.5,source_countries:['Global']},
    ],
    end_of_life:{e_waste_kg:70,recycled_pct:60,landfill_pct:35,toxic_materials:['PCB chemicals','Refrigerants'],total_recoverable_usd:25.00,recycling_cost_usd:18.00},
    externalities:{carbon_total_kg:185,water_total_l:45000,land_total_m2:0.5,conflict_minerals_count:0,child_labor_exposure:false}},
  wind_turbine:{name:'Wind Turbine Blade (1 blade)',icon:'\u{1F32C}\uFE0F',retail_price:150000,weight_g:12000000,lifespan_years:25,category:'Energy',
    components:[
      {material:'Fiberglass (GFRP)',component:'Blade shell',quantity_g:8000000,cost_usd:32000,pct_of_cost:21.3,source_countries:['CN','US','DK'],esg_risk:40,carbon_g:32000000,water_l:16000000,recyclable:false,note:'Major end-of-life challenge'},
      {material:'Epoxy Resin',component:'Matrix binder',quantity_g:2500000,cost_usd:18750,pct_of_cost:12.5,source_countries:['US','DE','CN'],esg_risk:45,carbon_g:12500000,water_l:5000000,recyclable:false},
      {material:'Balsa Wood / PVC Foam',component:'Core material',quantity_g:800000,cost_usd:12000,pct_of_cost:8.0,source_countries:['EC','PNG'],esg_risk:55,carbon_g:400000,deforestation_risk:'Medium (balsa)'},
      {material:'Carbon Fiber',component:'Spar cap (structural)',quantity_g:400000,cost_usd:28000,pct_of_cost:18.7,source_countries:['JP','US','CN'],esg_risk:50,carbon_g:8000000,water_l:800000,recyclable:false},
      {material:'Steel',component:'Root bolts, inserts',quantity_g:200000,cost_usd:136,pct_of_cost:0.09,source_countries:['EU','CN'],esg_risk:50,carbon_g:370000,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'Lightning Protection (Copper)',component:'Conductor system',quantity_g:50000,cost_usd:448,pct_of_cost:0.3,source_countries:['CL','PE'],esg_risk:55,carbon_g:250000,recyclable:true,commodity_id:'COPPER'},
      {material:'Paint & Coatings',component:'Surface protection',quantity_g:150000,cost_usd:4500,pct_of_cost:3.0,source_countries:['DE','US'],esg_risk:40,voc_emissions:'Medium'},
      {material:'Labor',component:'Layup, curing, finishing',quantity_g:0,cost_usd:25000,pct_of_cost:16.7,source_countries:['DK','DE','CN','US'],esg_risk:25},
      {material:'Engineering & IP',component:'Aerodynamic design, testing',quantity_g:0,cost_usd:15000,pct_of_cost:10.0,source_countries:['DK','DE','US'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:15,landfill_pct:75,incinerated_pct:10,toxic_materials:['Epoxy dust','BPA (resin)'],total_recoverable_usd:500,recycling_cost_usd:8000},
    externalities:{carbon_total_kg:53000,water_total_l:22000000,land_total_m2:5,conflict_minerals_count:0,child_labor_exposure:false}},
  lithium_battery_pack:{name:'Li-Ion Battery Pack (50 kWh)',icon:'\u{1F50B}',retail_price:7500,weight_g:350000,lifespan_years:10,category:'Energy',
    components:[
      {material:'Lithium Carbonate',component:'Cathode active material',quantity_g:6000,cost_usd:75,pct_of_cost:1.0,source_countries:['AU','CL','CN','AR'],esg_risk:55,carbon_g:72000,water_l:9600,recyclable:true,recycling_rate:0.05,commodity_id:'LITHIUM'},
      {material:'Cobalt',component:'Cathode (NMC)',quantity_g:5500,cost_usd:154,pct_of_cost:2.05,source_countries:['CD','AU'],esg_risk:85,carbon_g:247500,water_l:46750,child_labor_risk:'Critical (DRC)',conflict_mineral:true,commodity_id:'COBALT'},
      {material:'Nickel',component:'Cathode (NMC)',quantity_g:12000,cost_usd:194,pct_of_cost:2.59,source_countries:['ID','PH','RU','CA'],esg_risk:60,carbon_g:120000,water_l:24000,commodity_id:'NICKEL'},
      {material:'Graphite',component:'Anode',quantity_g:28000,cost_usd:18.20,pct_of_cost:0.24,source_countries:['CN','MZ','BR'],esg_risk:45,carbon_g:28000,water_l:14000},
      {material:'Copper',component:'Current collector foil',quantity_g:9000,cost_usd:80.55,pct_of_cost:1.07,source_countries:['CL','PE','CN'],esg_risk:55,carbon_g:45000,water_l:27000,recyclable:true,recycling_rate:0.55,commodity_id:'COPPER'},
      {material:'Aluminum',component:'Current collector, casing',quantity_g:15000,cost_usd:35.25,pct_of_cost:0.47,source_countries:['CN','RU','CA'],esg_risk:55,carbon_g:135000,water_l:7500,recyclable:true,recycling_rate:0.75,commodity_id:'ALUMINUM'},
      {material:'Electrolyte (LiPF6)',component:'Ion conductor',quantity_g:8000,cost_usd:120,pct_of_cost:1.6,source_countries:['CN','JP','KR'],esg_risk:50,carbon_g:24000,toxic:true},
      {material:'Separator (PE/PP)',component:'Cell separator film',quantity_g:2000,cost_usd:60,pct_of_cost:0.8,source_countries:['JP','KR','CN'],esg_risk:35,carbon_g:6000},
      {material:'Steel',component:'Cell cans, module frame',quantity_g:30000,cost_usd:20.40,pct_of_cost:0.27,source_countries:['CN','JP'],esg_risk:50,carbon_g:55500,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'BMS Electronics',component:'Battery management system',quantity_g:3000,cost_usd:450,pct_of_cost:6.0,source_countries:['US','KR','CN'],esg_risk:35},
      {material:'Thermal Management',component:'Cooling plates, TIM',quantity_g:5000,cost_usd:200,pct_of_cost:2.67,source_countries:['US','JP'],esg_risk:30},
      {material:'Labor & Assembly',component:'Cell to pack assembly',quantity_g:0,cost_usd:800,pct_of_cost:10.7,source_countries:['CN','KR','US','DE'],esg_risk:30},
      {material:'IP, Testing & QC',component:'Design, validation',quantity_g:0,cost_usd:2500,pct_of_cost:33.3,source_countries:['US','KR','JP'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:350,recycled_pct:5,landfill_pct:85,toxic_materials:['Lithium (fire/explosive)','Cobalt (toxic)','Electrolyte (HF gas)','Nickel'],gold_recoverable_usd:0,total_recoverable_usd:1200,recycling_cost_usd:800},
    externalities:{carbon_total_kg:3250,water_total_l:1500000,land_total_m2:2,conflict_minerals_count:1,child_labor_exposure:true}},
  palm_oil_soap:{name:'Palm Oil Soap Bar',icon:'\u{1F9FC}',retail_price:4.00,weight_g:100,lifespan_years:0.2,category:'Consumer Goods',
    components:[
      {material:'Palm Oil',component:'Base fat (saponified)',quantity_g:60,cost_usd:0.05,pct_of_cost:1.25,source_countries:['ID','MY'],esg_risk:85,carbon_g:510,water_l:60,deforestation_risk:'Very High',biodiversity_loss:'Critical (orangutan)',commodity_id:'PALM_OIL'},
      {material:'Coconut Oil',component:'Lathering agent',quantity_g:15,cost_usd:0.02,pct_of_cost:0.5,source_countries:['PH','ID','IN'],esg_risk:40,carbon_g:30,water_l:15},
      {material:'Sodium Hydroxide (Lye)',component:'Saponification agent',quantity_g:8,cost_usd:0.01,pct_of_cost:0.25,source_countries:['US','CN','EU'],esg_risk:35,carbon_g:16},
      {material:'Fragrance',component:'Essential oils / synthetic',quantity_g:2,cost_usd:0.08,pct_of_cost:2.0,source_countries:['FR','US','IN'],esg_risk:30},
      {material:'Water',component:'Processing water',quantity_g:12,cost_usd:0.001,pct_of_cost:0.025,source_countries:['Local'],esg_risk:10,water_l:0.5},
      {material:'Packaging',component:'Cardboard box, wrapper',quantity_g:8,cost_usd:0.05,pct_of_cost:1.25,source_countries:['Local'],esg_risk:30,carbon_g:10,recyclable:true},
      {material:'Brand & Retail',component:'Marketing, distribution, margin',quantity_g:0,cost_usd:3.20,pct_of_cost:80.0,source_countries:['US','EU'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:70,landfill_pct:25,toxic_materials:[],total_recoverable_usd:0.002,recycling_cost_usd:0.01},
    externalities:{carbon_total_kg:8.5,water_total_l:2500,land_total_m2:2.0,conflict_minerals_count:0,child_labor_exposure:false}},
  steel_bridge:{name:'Steel Bridge (per tonne)',icon:'\u{1F309}',retail_price:4500,weight_g:1000000,lifespan_years:100,category:'Construction',
    components:[
      {material:'Structural Steel',component:'Main girders, deck',quantity_g:850000,cost_usd:1445,pct_of_cost:32.1,source_countries:['CN','JP','KR','US'],esg_risk:55,carbon_g:1572500,water_l:23800000,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'High-Strength Bolts',component:'Connections',quantity_g:30000,cost_usd:150,pct_of_cost:3.3,source_countries:['JP','US','DE'],esg_risk:45,carbon_g:55500,recyclable:true},
      {material:'Welding Consumables',component:'Electrodes, gas',quantity_g:15000,cost_usd:45,pct_of_cost:1.0,source_countries:['US','KR','CN'],esg_risk:40,carbon_g:27750},
      {material:'Paint & Coatings',component:'Corrosion protection',quantity_g:25000,cost_usd:75,pct_of_cost:1.67,source_countries:['US','DE','JP'],esg_risk:50,carbon_g:62500,voc_emissions:'Medium'},
      {material:'Concrete (foundations)',component:'Pier foundations',quantity_g:500000,cost_usd:62.50,pct_of_cost:1.39,source_countries:['Local'],esg_risk:55,carbon_g:310000},
      {material:'Labor',component:'Fabrication, erection',quantity_g:0,cost_usd:1800,pct_of_cost:40.0,source_countries:['Local'],esg_risk:35},
      {material:'Engineering & Design',component:'Structural design, inspection',quantity_g:0,cost_usd:650,pct_of_cost:14.4,source_countries:['US','EU','JP'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:90,landfill_pct:5,toxic_materials:['Lead (old paint)','Cadmium (coatings)'],total_recoverable_usd:350,recycling_cost_usd:120},
    externalities:{carbon_total_kg:1850,water_total_l:24000000,land_total_m2:0,conflict_minerals_count:0,child_labor_exposure:false}},
  pharmaceutical_pill:{name:'Pharmaceutical Pill (1 dose)',icon:'\u{1F48A}',retail_price:15.00,weight_g:0.5,lifespan_years:2,category:'Healthcare',
    components:[
      {material:'Active Pharmaceutical Ingredient',component:'Drug compound',quantity_g:0.05,cost_usd:0.25,pct_of_cost:1.67,source_countries:['IN','CN','US','IE'],esg_risk:45,carbon_g:0.5,water_l:5},
      {material:'Excipients (lactose, starch)',component:'Filler, binder',quantity_g:0.35,cost_usd:0.005,pct_of_cost:0.03,source_countries:['US','EU','IN'],esg_risk:20,carbon_g:0.2,water_l:0.5},
      {material:'Coating (polymer/sugar)',component:'Film coating',quantity_g:0.05,cost_usd:0.003,pct_of_cost:0.02,source_countries:['US','DE'],esg_risk:20,carbon_g:0.1},
      {material:'Blister Pack (PVC/Aluminum)',component:'Primary packaging',quantity_g:3,cost_usd:0.02,pct_of_cost:0.13,source_countries:['EU','US'],esg_risk:40,carbon_g:8,recyclable:false},
      {material:'Cardboard Box',component:'Secondary packaging',quantity_g:5,cost_usd:0.01,pct_of_cost:0.07,source_countries:['Local'],esg_risk:25,carbon_g:5,recyclable:true},
      {material:'R&D (amortized)',component:'Drug discovery, trials',quantity_g:0,cost_usd:5.00,pct_of_cost:33.3,source_countries:['US','CH','UK'],esg_risk:15,note:'$2.6B avg new drug development cost'},
      {material:'Manufacturing & QC',component:'GMP production',quantity_g:0,cost_usd:0.50,pct_of_cost:3.3,source_countries:['IN','IE','US','CH'],esg_risk:30},
      {material:'Distribution & Retail',component:'Wholesaler, pharmacy, insurance',quantity_g:0,cost_usd:8.00,pct_of_cost:53.3,source_countries:['US','EU'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:10,landfill_pct:85,toxic_materials:['Pharmaceutical residues (water contamination)','PVC (blister)'],total_recoverable_usd:0.001,recycling_cost_usd:0.10},
    externalities:{carbon_total_kg:0.05,water_total_l:8,land_total_m2:0.001,conflict_minerals_count:0,child_labor_exposure:false}},
};

const PRODUCT_KEYS = Object.keys(PRODUCT_ANATOMY);
const CARBON_EXTERNALITY_PER_KG = 0.05;
const WATER_EXTERNALITY_PER_L = 0.002;

/* ================================================================= COMPONENTS */
const Card=({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI=({label,value,sub,color})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px'}}>
    <div style={{fontSize:11,color:T.textMut,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:color||T.navy,marginTop:4,fontFamily:T.font}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
  </div>
);
const Badge=({label,color})=>{
  const cm={blue:T.navyL,green:T.sage,red:T.red,amber:T.amber,purple:'#7c3aed',gray:T.textMut};
  const c=cm[color]||cm.gray;
  return <span style={{display:'inline-block',fontSize:10,fontWeight:700,color:c,background:`${c}18`,border:`1px solid ${c}40`,borderRadius:50,padding:'2px 10px',letterSpacing:0.3}}>{label}</span>;
};
const Section=({title,badge,children})=>(
  <div style={{marginBottom:28}}>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
      <h2 style={{fontSize:16,fontWeight:700,color:T.navy,margin:0}}>{title}</h2>
      {badge&&<Badge label={badge} color="blue"/>}
    </div>
    {children}
  </div>
);
const Btn=({children,onClick,primary,small,style})=>(
  <button onClick={onClick} style={{padding:small?'5px 14px':'9px 22px',fontSize:small?12:13,fontWeight:600,border:primary?'none':`1px solid ${T.border}`,borderRadius:8,cursor:'pointer',background:primary?T.navy:T.surface,color:primary?'#fff':T.navy,fontFamily:T.font,transition:'all .15s',...style}}>{children}</button>
);
const TH=({children,onClick,sorted,style})=>(
  <th onClick={onClick} style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,cursor:onClick?'pointer':'default',userSelect:'none',whiteSpace:'nowrap',background:T.surfaceH,...style}}>
    {children}{sorted===true?' \u25B2':sorted===false?' \u25BC':''}
  </th>
);
const TD=({children,style})=><td style={{padding:'10px 12px',fontSize:12,color:T.text,borderBottom:`1px solid ${T.border}`,...style}}>{children}</td>;

/* ================================================================= MAIN */
export default function ProductAnatomyPage(){
  const navigate=useNavigate();
  const [portfolio]=useState(()=>{const raw=loadLS(LS_PORT);return raw&&Array.isArray(raw)?raw:(GLOBAL_COMPANY_MASTER||[]).slice(0,30)});
  const [selectedProduct,setSelectedProduct]=useState('smartphone');
  const [compareProduct,setCompareProduct]=useState('electric_car');
  const [viewMode,setViewMode]=useState('weight');
  const [sortCol,setSortCol]=useState('esg_risk');
  const [sortDir,setSortDir]=useState(false);
  const [detailMat,setDetailMat]=useState(null);
  const [showCompare,setShowCompare]=useState(false);
  const [showBuilder,setShowBuilder]=useState(false);
  const [customProducts,setCustomProducts]=useState(()=>loadLS(LS_CUSTOM)||[]);
  const [builderName,setBuilderName]=useState('');
  const [builderComponents,setBuilderComponents]=useState([]);
  const [carbonExtSlider,setCarbonExtSlider]=useState(50);
  const [waterExtSlider,setWaterExtSlider]=useState(2);

  const product=PRODUCT_ANATOMY[selectedProduct];
  const comps=product?.components||[];

  useEffect(()=>{if(customProducts.length)saveLS(LS_CUSTOM,customProducts)},[customProducts]);

  const toggleSort=col=>{if(sortCol===col)setSortDir(!sortDir);else{setSortCol(col);setSortDir(false)}};
  const sorted=useMemo(()=>[...comps].sort((a,b)=>{const av=a[sortCol]??-999,bv=b[sortCol]??-999;return sortDir?(av>bv?1:-1):(av<bv?1:-1)}),[comps,sortCol,sortDir]);

  const totals=useMemo(()=>{
    const t={cost:0,weight:0,carbon:0,water:0,conflict:0,childLabor:0,recyclable:0,totalMats:comps.length};
    comps.forEach(c=>{t.cost+=c.cost_usd||0;t.weight+=c.quantity_g||0;t.carbon+=c.carbon_g||0;t.water+=c.water_l||0;if(c.conflict_mineral)t.conflict++;if(c.child_labor_risk&&c.child_labor_risk!=='Low'&&c.child_labor_risk!=='None')t.childLabor++;if(c.recyclable)t.recyclable++});
    t.extCost=(t.carbon/1000)*carbonExtSlider+(t.water)*waterExtSlider/1000;
    t.trueCost=(product?.retail_price||0)+t.extCost;
    return t;
  },[comps,product,carbonExtSlider,waterExtSlider]);

  const anatomyData=useMemo(()=>comps.filter(c=>(viewMode==='weight'?c.quantity_g:c.cost_usd)>0).map((c,i)=>({...c,value:viewMode==='weight'?c.quantity_g:c.cost_usd,fill:MAT_COLORS[i%MAT_COLORS.length]})),[comps,viewMode]);
  const waterfallData=useMemo(()=>{
    const raw=comps.filter(c=>c.cost_usd>0).sort((a,b)=>b.cost_usd-a.cost_usd);
    let cum=0;return raw.map(c=>{const start=cum;cum+=c.cost_usd;return{name:c.material.slice(0,12),cost:c.cost_usd,start,fill:MAT_COLORS[raw.indexOf(c)%MAT_COLORS.length]}});
  },[comps]);
  const esgPie=useMemo(()=>comps.filter(c=>c.esg_risk).map((c,i)=>({name:c.material,value:c.esg_risk,fill:MAT_COLORS[i%MAT_COLORS.length]})),[comps]);
  const carbonBars=useMemo(()=>comps.filter(c=>c.carbon_g>0).sort((a,b)=>b.carbon_g-a.carbon_g).map(c=>({name:c.material.slice(0,14),carbon:c.carbon_g})),[comps]);
  const waterBars=useMemo(()=>comps.filter(c=>c.water_l>0).sort((a,b)=>b.water_l-a.water_l).map(c=>({name:c.material.slice(0,14),water:c.water_l})),[comps]);
  const conflictMinerals=useMemo(()=>comps.filter(c=>c.conflict_mineral),[comps]);
  const childLaborComps=useMemo(()=>comps.filter(c=>c.child_labor_risk&&c.child_labor_risk!=='Low'&&c.child_labor_risk!=='None'),[comps]);
  const geopoliticalRisks=useMemo(()=>comps.filter(c=>c.geopolitical_risk||c.source_countries?.some(s=>s.includes('90%')||s.includes('80%'))),[comps]);

  const exportCSV=()=>{
    const hdr=['Material','Component','Quantity (g)','Cost (USD)','% of Cost','Source Countries','ESG Risk','Carbon (g)','Water (L)','Child Labor','Conflict Mineral','Recyclable'];
    const rows=comps.map(c=>[c.material,c.component,c.quantity_g,c.cost_usd,c.pct_of_cost,c.source_countries?.join('; '),c.esg_risk||'',c.carbon_g||'',c.water_l||'',c.child_labor_risk||'',c.conflict_mineral?'Yes':'No',c.recyclable?'Yes':'No']);
    const csv=[hdr,...rows].map(r=>r.join(',')).join('\n');
    const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`product_anatomy_${selectedProduct}.csv`;a.click();URL.revokeObjectURL(u);
  };
  const exportJSON=()=>{
    const b=new Blob([JSON.stringify({product:product.name,components:comps,externalities:product.externalities,end_of_life:product.end_of_life},null,2)],{type:'application/json'});
    const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`material_decomposition_${selectedProduct}.json`;a.click();URL.revokeObjectURL(u);
  };
  const addBuilderComp=()=>setBuilderComponents([...builderComponents,{material:'',component:'',quantity_g:0,cost_usd:0,esg_risk:50}]);
  const saveCustomProduct=()=>{
    if(!builderName.trim())return;
    const np={id:`custom_${Date.now()}`,name:builderName,components:builderComponents,retail_price:builderComponents.reduce((s,c)=>s+c.cost_usd,0)};
    setCustomProducts([...customProducts,np]);setBuilderName('');setBuilderComponents([]);setShowBuilder(false);
  };

  const compProduct=PRODUCT_ANATOMY[compareProduct];

  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font}}>
      <div style={{maxWidth:1440,margin:'0 auto',padding:'24px 32px'}}>

        {/* HEADER */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,color:T.navy,margin:0}}>Product Anatomy: What Are You Really Buying?</h1>
            <p style={{fontSize:13,color:T.textSec,margin:'6px 0 10px'}}>3-Dimensional Decomposition Engine \u2014 Finance \u00D7 ESG \u00D7 Climate Impact of Every Material</p>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <Badge label="15 Products" color="blue"/>
              <Badge label="Material Decomposition" color="green"/>
              <Badge label="Finance \u00D7 ESG \u00D7 Climate" color="purple"/>
              <Badge label="EP-Y9" color="gray"/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={exportCSV} small>CSV Export</Btn>
            <Btn onClick={exportJSON} small>JSON Report</Btn>
            <Btn onClick={()=>window.print()} small>Print</Btn>
          </div>
        </div>

        {/* S2: PRODUCT SELECTOR */}
        <Section title="Product Selector" badge={`${PRODUCT_KEYS.length} Products`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155,1fr))',gap:10}}>
            {PRODUCT_KEYS.map(k=>{const p=PRODUCT_ANATOMY[k];return(
              <div key={k} onClick={()=>setSelectedProduct(k)} style={{padding:'14px 12px',background:selectedProduct===k?`${T.navy}10`:T.surface,border:`2px solid ${selectedProduct===k?T.navy:T.border}`,borderRadius:10,cursor:'pointer',textAlign:'center',transition:'all .15s'}}>
                <div style={{fontSize:28}}>{p.icon}</div>
                <div style={{fontSize:11,fontWeight:700,color:T.navy,marginTop:6}}>{p.name}</div>
                <div style={{fontSize:12,fontWeight:600,color:T.gold,marginTop:2}}>{fmtUSD(p.retail_price)}</div>
              </div>
            )})}
          </div>
        </Section>

        {/* S3: KPIs */}
        <Section title={`${product.name} \u2014 Key Metrics`} badge={`${product.icon} ${product.category}`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
            <KPI label="Retail Price" value={fmtUSD(product.retail_price)} color={T.navy}/>
            <KPI label="Materials Count" value={comps.length} sub="unique materials"/>
            <KPI label="Conflict Minerals" value={totals.conflict} color={totals.conflict>0?T.red:T.green} sub="3TG flagged"/>
            <KPI label="Child Labor Risk" value={totals.childLabor} color={totals.childLabor>0?T.red:T.green} sub="components exposed"/>
            <KPI label="Total Carbon" value={`${fmt(totals.carbon/1000,1)} kg`} color={T.amber} sub="cradle-to-gate"/>
            <KPI label="Water Footprint" value={fmtL(totals.water)} color={T.navyL}/>
            <KPI label="Recyclable" value={`${Math.round(totals.recyclable/comps.length*100)}%`} sub={`${totals.recyclable} of ${comps.length} materials`} color={T.sage}/>
            <KPI label="E-Waste" value={`${product.end_of_life?.e_waste_kg||0} kg`} color={T.amber}/>
            <KPI label="Externality Cost" value={fmtUSD(totals.extCost)} sub="carbon + water" color={T.red}/>
            <KPI label="TRUE Cost" value={fmtUSD(totals.trueCost)} sub={`+${Math.round(totals.extCost/product.retail_price*100)}% hidden`} color={T.red}/>
          </div>
        </Section>

        {/* S4: ANATOMY VISUAL */}
        <Section title="Anatomy Visual \u2014 Material Decomposition" badge={viewMode==='weight'?'By Weight':'By Cost'}>
          <Card>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <Btn small primary={viewMode==='weight'} onClick={()=>setViewMode('weight')}>By Weight</Btn>
              <Btn small primary={viewMode==='cost'} onClick={()=>setViewMode('cost')}>By Cost</Btn>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,minHeight:120}}>
              {anatomyData.map((c,i)=>{
                const total=anatomyData.reduce((s,x)=>s+x.value,0);
                const pctW=Math.max(2,(c.value/total*100));
                return(
                  <div key={i} onClick={()=>setDetailMat(c)} title={`${c.material}: ${viewMode==='weight'?fmtG(c.quantity_g):fmtUSD(c.cost_usd)}`}
                    style={{width:`${pctW}%`,minWidth:36,height:80+Math.min(60,(c.esg_risk||30)),background:c.fill,borderRadius:6,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:4,transition:'all .2s',border:detailMat?.material===c.material?'3px solid #000':'3px solid transparent',position:'relative',overflow:'hidden'}}>
                    <div style={{fontSize:8,fontWeight:700,color:'#fff',textAlign:'center',textShadow:'0 1px 2px rgba(0,0,0,.5)',lineHeight:1.2}}>{c.material.slice(0,10)}</div>
                    <div style={{fontSize:9,color:'rgba(255,255,255,.85)',marginTop:2}}>{viewMode==='weight'?fmtG(c.quantity_g):fmtUSD(c.cost_usd)}</div>
                    {c.conflict_mineral&&<div style={{position:'absolute',top:2,right:2,fontSize:8,background:'rgba(220,38,38,.9)',color:'#fff',borderRadius:4,padding:'1px 3px'}}>3TG</div>}
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:11,color:T.textMut,marginTop:8}}>Block height reflects ESG risk score. Click any material for full detail.</div>
          </Card>
        </Section>

        {/* S4b: DETAIL PANEL */}
        {detailMat&&(
          <Section title={`Material Detail: ${detailMat.material}`} badge={detailMat.component}>
            <Card>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14}}>
                <KPI label="Quantity" value={fmtG(detailMat.quantity_g)}/>
                <KPI label="Cost" value={fmtUSD(detailMat.cost_usd)}/>
                <KPI label="ESG Risk" value={detailMat.esg_risk||'\u2014'} color={esgColor(detailMat.esg_risk||0)}/>
                <KPI label="Carbon" value={fmtG(detailMat.carbon_g)}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                <div><span style={{fontSize:11,color:T.textMut,fontWeight:600}}>Source Countries:</span><div style={{fontSize:13,color:T.text}}>{detailMat.source_countries?.join(', ')||'\u2014'}</div></div>
                <div><span style={{fontSize:11,color:T.textMut,fontWeight:600}}>Child Labor Risk:</span><div style={{fontSize:13,color:detailMat.child_labor_risk?.includes('Critical')||detailMat.child_labor_risk?.includes('High')?T.red:T.text}}>{detailMat.child_labor_risk||'None reported'}</div></div>
                <div><span style={{fontSize:11,color:T.textMut,fontWeight:600}}>Conflict Mineral:</span><div style={{fontSize:13,color:detailMat.conflict_mineral?T.red:T.green}}>{detailMat.conflict_mineral?'Yes \u2014 SEC reporting required':'No'}</div></div>
                <div><span style={{fontSize:11,color:T.textMut,fontWeight:600}}>Recyclable:</span><div style={{fontSize:13}}>{detailMat.recyclable?`Yes (${Math.round((detailMat.recycling_rate||0)*100)}% rate)`:'No'}</div></div>
                <div><span style={{fontSize:11,color:T.textMut,fontWeight:600}}>Water Use:</span><div style={{fontSize:13}}>{fmtL(detailMat.water_l)}</div></div>
                <div><span style={{fontSize:11,color:T.textMut,fontWeight:600}}>Geopolitical Risk:</span><div style={{fontSize:13,color:detailMat.geopolitical_risk?T.red:T.text}}>{detailMat.geopolitical_risk||'Standard'}</div></div>
              </div>
              {detailMat.note&&<div style={{marginTop:10,padding:10,background:T.surfaceH,borderRadius:6,fontSize:12,color:T.textSec}}>{detailMat.note}</div>}
              {detailMat.living_wage_gap&&<div style={{marginTop:8,padding:10,background:`${T.red}10`,borderRadius:6,fontSize:12,color:T.red}}>Living Wage Gap: {detailMat.living_wage_gap}</div>}
              <Btn small onClick={()=>setDetailMat(null)} style={{marginTop:12}}>Close</Btn>
            </Card>
          </Section>
        )}

        {/* S5: SORTABLE TABLE */}
        <Section title="3-Dimensional Material Table" badge="Sortable">
          <Card style={{overflowX:'auto',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <TH onClick={()=>toggleSort('material')} sorted={sortCol==='material'?sortDir:undefined}>Material</TH>
                <TH onClick={()=>toggleSort('component')} sorted={sortCol==='component'?sortDir:undefined}>Component</TH>
                <TH onClick={()=>toggleSort('quantity_g')} sorted={sortCol==='quantity_g'?sortDir:undefined}>Qty (g)</TH>
                <TH onClick={()=>toggleSort('cost_usd')} sorted={sortCol==='cost_usd'?sortDir:undefined}>Cost ($)</TH>
                <TH onClick={()=>toggleSort('pct_of_cost')} sorted={sortCol==='pct_of_cost'?sortDir:undefined}>% Cost</TH>
                <TH>Source</TH>
                <TH onClick={()=>toggleSort('esg_risk')} sorted={sortCol==='esg_risk'?sortDir:undefined}>ESG Risk</TH>
                <TH onClick={()=>toggleSort('carbon_g')} sorted={sortCol==='carbon_g'?sortDir:undefined}>Carbon (g)</TH>
                <TH onClick={()=>toggleSort('water_l')} sorted={sortCol==='water_l'?sortDir:undefined}>Water (L)</TH>
                <TH>Flags</TH>
              </tr></thead>
              <tbody>
                {sorted.map((c,i)=>(
                  <tr key={i} onClick={()=>setDetailMat(c)} style={{cursor:'pointer',background:i%2?T.surfaceH:'transparent'}}>
                    <TD style={{fontWeight:600}}>{c.material}</TD>
                    <TD>{c.component}</TD>
                    <TD>{c.quantity_g>0?fmtG(c.quantity_g):'\u2014'}</TD>
                    <TD>{fmtUSD(c.cost_usd)}</TD>
                    <TD>{c.pct_of_cost?`${fmt(c.pct_of_cost)}%`:'\u2014'}</TD>
                    <TD style={{fontSize:10,maxWidth:120}}>{c.source_countries?.slice(0,3).join(', ')}</TD>
                    <TD><span style={{fontWeight:700,color:esgColor(c.esg_risk||0)}}>{c.esg_risk||'\u2014'}</span></TD>
                    <TD>{c.carbon_g?fmtG(c.carbon_g):'\u2014'}</TD>
                    <TD>{c.water_l?fmtL(c.water_l):'\u2014'}</TD>
                    <TD style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {c.conflict_mineral&&<Badge label="3TG" color="red"/>}
                      {c.child_labor_risk&&c.child_labor_risk!=='Low'&&c.child_labor_risk!=='None'&&<Badge label="Child Labor" color="red"/>}
                      {c.geopolitical_risk&&<Badge label="Geopolitical" color="purple"/>}
                      {c.recyclable&&<Badge label="Recyclable" color="green"/>}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* S6: COST WATERFALL */}
        <Section title="Cost Decomposition Waterfall" badge="Value Capture Analysis">
          <Card>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={waterfallData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="name" tick={{fontSize:10}} angle={-30} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${v>=1000?(v/1000).toFixed(0)+'K':v.toFixed(0)}`}/>
                <Tooltip formatter={v=>[fmtUSD(v),'Cost']}/>
                <Bar dataKey="cost">{waterfallData.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{fontSize:11,color:T.textMut,marginTop:6}}>From raw materials through assembly, IP, packaging to retail price. Where value is captured vs. where impact is generated.</div>
          </Card>
        </Section>

        {/* S7: ESG PIE */}
        <Section title="ESG Risk Decomposition" badge="By Material">
          <Card style={{display:'flex',gap:20}}>
            <div style={{flex:1}}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={esgPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,value})=>`${name.slice(0,8)}: ${value}`}>
                  {esgPie.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie><Tooltip/></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
              {esgPie.sort((a,b)=>b.value-a.value).slice(0,8).map((e,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:12,height:12,borderRadius:3,background:e.fill,flexShrink:0}}/>
                  <span style={{fontSize:12,color:T.text,flex:1}}>{e.name}</span>
                  <span style={{fontSize:13,fontWeight:700,color:esgColor(e.value)}}>{e.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* S8: CLIMATE BARS */}
        <Section title="Climate Impact Decomposition" badge="Carbon + Water">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:10}}>Carbon Footprint by Material</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={carbonBars.slice(0,10)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>fmtG(v)}/>
                  <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={90}/>
                  <Tooltip formatter={v=>[fmtG(v),'Carbon']}/>
                  <Bar dataKey="carbon" fill={T.amber} radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:10}}>Water Footprint by Material</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={waterBars.slice(0,10)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>fmtL(v)}/>
                  <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={90}/>
                  <Tooltip formatter={v=>[fmtL(v),'Water']}/>
                  <Bar dataKey="water" fill={T.navyL} radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </Section>

        {/* S9: CONFLICT MINERALS */}
        <Section title="Conflict Mineral Map" badge={`${conflictMinerals.length} flagged (3TG)`}>
          <Card>
            <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Tin, Tantalum, Tungsten, Gold (3TG) \u2014 SEC conflict mineral reporting under Dodd-Frank Section 1502</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240,1fr))',gap:12}}>
              {conflictMinerals.map((c,i)=>(
                <div key={i} style={{padding:14,background:`${T.red}08`,border:`1px solid ${T.red}30`,borderRadius:8}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.red}}>{c.material}</div>
                  <div style={{fontSize:12,color:T.textSec,marginTop:4}}>Component: {c.component}</div>
                  <div style={{fontSize:11,color:T.text,marginTop:4}}>Sources: {c.source_countries?.join(', ')}</div>
                  <div style={{fontSize:11,color:T.textMut,marginTop:4}}>ESG Risk: <span style={{fontWeight:700,color:esgColor(c.esg_risk||0)}}>{c.esg_risk||'\u2014'}</span></div>
                  {c.child_labor_risk&&<div style={{fontSize:11,color:T.red,marginTop:2}}>Child Labor: {c.child_labor_risk}</div>}
                </div>
              ))}
            </div>
            {conflictMinerals.length===0&&<div style={{textAlign:'center',padding:20,color:T.green,fontWeight:600}}>No conflict minerals in this product</div>}
          </Card>
        </Section>

        {/* S10: CHILD LABOR */}
        <Section title="Child Labor Exposure" badge={`${childLaborComps.length} components`}>
          <Card>
            {childLaborComps.length>0?(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280,1fr))',gap:12}}>
                {childLaborComps.map((c,i)=>(
                  <div key={i} style={{padding:14,background:`${T.red}06`,border:`1px solid ${T.red}25`,borderRadius:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:14,fontWeight:700,color:T.navy}}>{c.material}</span>
                      <Badge label={c.child_labor_risk} color="red"/>
                    </div>
                    <div style={{fontSize:12,color:T.textSec,marginTop:6}}>{c.component}</div>
                    <div style={{fontSize:11,color:T.text,marginTop:4}}>Sources: {c.source_countries?.join(', ')}</div>
                    {c.living_wage_gap&&<div style={{fontSize:11,color:T.amber,marginTop:4}}>Wage gap: {c.living_wage_gap}</div>}
                  </div>
                ))}
              </div>
            ):<div style={{textAlign:'center',padding:20,color:T.green,fontWeight:600}}>No child labor exposure identified</div>}
          </Card>
        </Section>

        {/* S11: GEOPOLITICAL */}
        <Section title="Geopolitical Supply Risk" badge="Single-Country Dominance">
          <Card>
            {geopoliticalRisks.length>0?(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280,1fr))',gap:12}}>
                {geopoliticalRisks.map((c,i)=>(
                  <div key={i} style={{padding:14,background:`${T.amber}08`,border:`1px solid ${T.amber}30`,borderRadius:8}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{c.material}</div>
                    <div style={{fontSize:12,color:T.textSec,marginTop:4}}>{c.component}</div>
                    <div style={{fontSize:12,color:T.red,fontWeight:600,marginTop:4}}>{c.geopolitical_risk||'High concentration risk'}</div>
                    <div style={{fontSize:11,color:T.text,marginTop:4}}>Sources: {c.source_countries?.join(', ')}</div>
                  </div>
                ))}
              </div>
            ):<div style={{textAlign:'center',padding:20,color:T.green,fontWeight:600}}>No single-country dominance detected</div>}
          </Card>
        </Section>

        {/* S12: HIDDEN COST CALCULATOR */}
        <Section title="&quot;Hidden Cost&quot; Calculator" badge="Externality Pricing">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:16}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:6}}>Carbon Externality Price ($/tonne CO\u2082e)</div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <input type="range" min={10} max={200} value={carbonExtSlider} onChange={e=>setCarbonExtSlider(+e.target.value)} style={{flex:1}}/>
                  <span style={{fontSize:16,fontWeight:700,color:T.navy,minWidth:60}}>${carbonExtSlider}</span>
                </div>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:6}}>Water Externality Price ($/kL)</div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <input type="range" min={0.5} max={10} step={0.5} value={waterExtSlider} onChange={e=>setWaterExtSlider(+e.target.value)} style={{flex:1}}/>
                  <span style={{fontSize:16,fontWeight:700,color:T.navy,minWidth:60}}>${waterExtSlider}</span>
                </div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              <KPI label="Retail Price" value={fmtUSD(product.retail_price)} color={T.navy}/>
              <KPI label="Carbon Externality" value={fmtUSD((totals.carbon/1000)*carbonExtSlider)} sub={`${fmt(totals.carbon/1000,1)} kg \u00D7 $${carbonExtSlider}/t`} color={T.amber}/>
              <KPI label="Water Externality" value={fmtUSD(totals.water*waterExtSlider/1000)} sub={`${fmtL(totals.water)} \u00D7 $${waterExtSlider}/kL`} color={T.navyL}/>
              <KPI label="TRUE Cost" value={fmtUSD(totals.trueCost)} sub={`+${Math.round(totals.extCost/product.retail_price*100)}% hidden costs`} color={T.red}/>
            </div>
          </Card>
        </Section>

        {/* S13: END OF LIFE */}
        <Section title="End-of-Life Analysis" badge="E-Waste & Recovery">
          <Card>
            {product.end_of_life&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:10}}>Disposal Breakdown</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:12}}>Recycled</span><span style={{fontSize:13,fontWeight:700,color:T.green}}>{product.end_of_life.recycled_pct}%</span></div>
                    <div style={{height:8,background:T.surfaceH,borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:`${product.end_of_life.recycled_pct}%`,background:T.green,borderRadius:4}}/></div>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:12}}>Landfill</span><span style={{fontSize:13,fontWeight:700,color:T.red}}>{product.end_of_life.landfill_pct}%</span></div>
                    <div style={{height:8,background:T.surfaceH,borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:`${product.end_of_life.landfill_pct}%`,background:T.red,borderRadius:4}}/></div>
                    {product.end_of_life.incinerated_pct!=null&&<><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:12}}>Incinerated</span><span style={{fontSize:13,fontWeight:700,color:T.amber}}>{product.end_of_life.incinerated_pct}%</span></div>
                    <div style={{height:8,background:T.surfaceH,borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:`${product.end_of_life.incinerated_pct}%`,background:T.amber,borderRadius:4}}/></div></>}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:10}}>Toxic Materials</div>
                  {(product.end_of_life.toxic_materials||[]).map((t,i)=>(
                    <div key={i} style={{fontSize:12,color:T.red,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}>{t}</div>
                  ))}
                  {(!product.end_of_life.toxic_materials||product.end_of_life.toxic_materials.length===0)&&<div style={{fontSize:12,color:T.green}}>No significant toxic materials</div>}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:10}}>Recovery Economics</div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span>Recoverable Value</span><span style={{fontWeight:700,color:T.green}}>{fmtUSD(product.end_of_life.total_recoverable_usd)}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span>Recycling Cost</span><span style={{fontWeight:700,color:T.red}}>{fmtUSD(product.end_of_life.recycling_cost_usd)}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,borderTop:`1px solid ${T.border}`,paddingTop:6}}><span style={{fontWeight:700}}>Net Recovery</span><span style={{fontWeight:700,color:(product.end_of_life.total_recoverable_usd-product.end_of_life.recycling_cost_usd)>=0?T.green:T.red}}>{fmtUSD(product.end_of_life.total_recoverable_usd-product.end_of_life.recycling_cost_usd)}</span></div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Section>

        {/* S14: CIRCULAR ECONOMY */}
        <Section title="Circular Economy Score" badge="Sustainability Index">
          <Card>
            {(()=>{
              const recyclableCount=comps.filter(c=>c.recyclable).length;
              const recyclablePct=Math.round(recyclableCount/comps.length*100);
              const avgRecRate=comps.filter(c=>c.recycling_rate).reduce((s,c)=>s+c.recycling_rate,0)/(comps.filter(c=>c.recycling_rate).length||1)*100;
              const recoverValue=product.end_of_life?.total_recoverable_usd||0;
              const circScore=Math.round((recyclablePct*0.4+avgRecRate*0.3+(product.end_of_life?.recycled_pct||0)*0.3));
              return(
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
                  <KPI label="Circular Score" value={`${circScore}/100`} color={circScore>60?T.green:circScore>30?T.amber:T.red}/>
                  <KPI label="Recyclable Materials" value={`${recyclablePct}%`} sub={`${recyclableCount} of ${comps.length}`} color={T.sage}/>
                  <KPI label="Avg Recycling Rate" value={`${fmt(avgRecRate,0)}%`} color={T.navyL}/>
                  <KPI label="Recoverable Value" value={fmtUSD(recoverValue)} color={T.gold}/>
                  <KPI label="Product Lifespan" value={`${product.lifespan_years} yr`} color={T.navy}/>
                </div>
              );
            })()}
          </Card>
        </Section>

        {/* S15: COMPARISON MODE */}
        <Section title="Product Comparison Mode" badge="Side-by-Side">
          <Card>
            <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
              <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Compare:</span>
              <select value={selectedProduct} onChange={e=>setSelectedProduct(e.target.value)} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
                {PRODUCT_KEYS.map(k=><option key={k} value={k}>{PRODUCT_ANATOMY[k].name}</option>)}
              </select>
              <span style={{fontSize:12,color:T.textMut}}>vs.</span>
              <select value={compareProduct} onChange={e=>setCompareProduct(e.target.value)} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
                {PRODUCT_KEYS.filter(k=>k!==selectedProduct).map(k=><option key={k} value={k}>{PRODUCT_ANATOMY[k].name}</option>)}
              </select>
              <Btn small primary onClick={()=>setShowCompare(!showCompare)}>{showCompare?'Hide':'Show'} Comparison</Btn>
            </div>
            {showCompare&&compProduct&&(()=>{
              const pA=product,pB=compProduct;
              const cA=pA.components,cB=pB.components;
              const tA={carbon:cA.reduce((s,c)=>s+(c.carbon_g||0),0),water:cA.reduce((s,c)=>s+(c.water_l||0),0),conflict:cA.filter(c=>c.conflict_mineral).length,childLabor:cA.filter(c=>c.child_labor_risk&&c.child_labor_risk!=='Low'&&c.child_labor_risk!=='None').length};
              const tB={carbon:cB.reduce((s,c)=>s+(c.carbon_g||0),0),water:cB.reduce((s,c)=>s+(c.water_l||0),0),conflict:cB.filter(c=>c.conflict_mineral).length,childLabor:cB.filter(c=>c.child_labor_risk&&c.child_labor_risk!=='Low'&&c.child_labor_risk!=='None').length};
              const rows=[{label:'Retail Price',a:fmtUSD(pA.retail_price),b:fmtUSD(pB.retail_price)},{label:'Materials',a:cA.length,b:cB.length},{label:'Carbon (kg)',a:fmt(tA.carbon/1000,1),b:fmt(tB.carbon/1000,1)},{label:'Water (L)',a:fmtL(tA.water),b:fmtL(tB.water)},{label:'Conflict Minerals',a:tA.conflict,b:tB.conflict},{label:'Child Labor Risk',a:tA.childLabor,b:tB.childLabor},{label:'Lifespan (yr)',a:pA.lifespan_years,b:pB.lifespan_years},{label:'E-Waste (kg)',a:pA.end_of_life?.e_waste_kg||0,b:pB.end_of_life?.e_waste_kg||0},{label:'Recycled %',a:`${pA.end_of_life?.recycled_pct||0}%`,b:`${pB.end_of_life?.recycled_pct||0}%`}];
              return(
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr><TH>Metric</TH><TH>{pA.icon} {pA.name}</TH><TH>{pB.icon} {pB.name}</TH></tr></thead>
                  <tbody>{rows.map((r,i)=><tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}><TD style={{fontWeight:600}}>{r.label}</TD><TD>{r.a}</TD><TD>{r.b}</TD></tr>)}</tbody>
                </table>
              );
            })()}
          </Card>
        </Section>

        {/* S16: CUSTOM PRODUCT BUILDER */}
        <Section title="Custom Product Builder" badge="Persist to localStorage">
          <Card>
            <Btn small primary onClick={()=>setShowBuilder(!showBuilder)}>{showBuilder?'Close Builder':'Build Custom Product'}</Btn>
            {showBuilder&&(
              <div style={{marginTop:14}}>
                <div style={{display:'flex',gap:10,marginBottom:10}}>
                  <input placeholder="Product name" value={builderName} onChange={e=>setBuilderName(e.target.value)} style={{padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,flex:1,fontFamily:T.font}}/>
                  <Btn small onClick={addBuilderComp}>+ Add Component</Btn>
                  <Btn small primary onClick={saveCustomProduct}>Save Product</Btn>
                </div>
                {builderComponents.map((bc,i)=>(
                  <div key={i} style={{display:'flex',gap:8,marginBottom:6}}>
                    <input placeholder="Material" value={bc.material} onChange={e=>{const u=[...builderComponents];u[i].material=e.target.value;setBuilderComponents(u)}} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:11,flex:1}}/>
                    <input placeholder="Component" value={bc.component} onChange={e=>{const u=[...builderComponents];u[i].component=e.target.value;setBuilderComponents(u)}} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:11,flex:1}}/>
                    <input type="number" placeholder="Qty (g)" value={bc.quantity_g||''} onChange={e=>{const u=[...builderComponents];u[i].quantity_g=+e.target.value;setBuilderComponents(u)}} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:11,width:80}}/>
                    <input type="number" placeholder="Cost ($)" value={bc.cost_usd||''} onChange={e=>{const u=[...builderComponents];u[i].cost_usd=+e.target.value;setBuilderComponents(u)}} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:11,width:80}}/>
                    <input type="number" placeholder="ESG Risk" value={bc.esg_risk||''} onChange={e=>{const u=[...builderComponents];u[i].esg_risk=+e.target.value;setBuilderComponents(u)}} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:11,width:80}}/>
                    <Btn small onClick={()=>setBuilderComponents(builderComponents.filter((_,j)=>j!==i))} style={{color:T.red}}>X</Btn>
                  </div>
                ))}
              </div>
            )}
            {customProducts.length>0&&(
              <div style={{marginTop:14}}>
                <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:6}}>Saved Custom Products ({customProducts.length})</div>
                {customProducts.map((cp,i)=>(
                  <div key={i} style={{padding:8,background:T.surfaceH,borderRadius:6,marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:12,fontWeight:600}}>{cp.name} ({cp.components.length} materials, {fmtUSD(cp.retail_price)})</span>
                    <Btn small onClick={()=>setCustomProducts(customProducts.filter((_,j)=>j!==i))} style={{color:T.red}}>Remove</Btn>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Section>

        {/* S17: PORTFOLIO LINKAGE */}
        <Section title="Portfolio Company Linkage" badge={`${portfolio.length} Holdings`}>
          <Card style={{overflowX:'auto',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><TH>Company</TH><TH>Sector</TH><TH>Relevant Products</TH><TH>Exposure</TH></tr></thead>
              <tbody>
                {portfolio.slice(0,15).map((co,i)=>{
                  const s=co.sector||co.gics_sector||'';
                  const prods=PRODUCT_KEYS.filter(k=>{const p=PRODUCT_ANATOMY[k];return(s.includes('Tech')&&p.category==='Electronics')||(s.includes('Energy')&&p.category==='Energy')||(s.includes('Consumer')&&(p.category==='Textiles'||p.category==='Food'||p.category==='Consumer Goods'))||(s.includes('Material')&&p.category==='Construction')||(s.includes('Health')&&p.category==='Healthcare')||(s.includes('Industrial')&&(p.category==='Appliances'||p.category==='Industrial'))});
                  return(
                    <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                      <TD style={{fontWeight:600}}>{co.name||co.company_name}</TD>
                      <TD>{s}</TD>
                      <TD style={{fontSize:11}}>{prods.map(k=>PRODUCT_ANATOMY[k].icon+' '+PRODUCT_ANATOMY[k].name.slice(0,20)).join(', ')||'\u2014'}</TD>
                      <TD>{prods.length>0?<Badge label={`${prods.length} products`} color={prods.length>2?'amber':'blue'}/>:'\u2014'}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* S18: CROSS-NAV */}
        <Section title="Related Modules">
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[
              {label:'Commodity Intelligence',path:'/commodity-intelligence'},
              {label:'Supply Chain Carbon',path:'/supply-chain-carbon'},
              {label:'Lifecycle Assessment (LCA)',path:'/lifecycle-assessment'},
              {label:'Financial Flow Analysis',path:'/financial-flow'},
              {label:'EPD & LCA Database',path:'/epd-lca-database'},
              {label:'IWA Framework',path:'/iwa-framework'},
            ].map(m=>(
              <Btn key={m.path} onClick={()=>navigate(m.path)} style={{background:T.surfaceH}}>{m.label} &rarr;</Btn>
            ))}
          </div>
        </Section>

        <div style={{textAlign:'center',padding:'20px 0',borderTop:`1px solid ${T.border}`,marginTop:20}}>
          <span style={{fontSize:11,color:T.textMut}}>Product Anatomy: 3-Dimensional Decomposition Engine | EP-Y9 | 15 Products | Finance \u00D7 ESG \u00D7 Climate | Sprint Y</span>
        </div>
      </div>
    </div>
  );
}
