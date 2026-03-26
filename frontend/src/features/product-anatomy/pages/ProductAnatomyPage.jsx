import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line, Area,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ================================================================= THEME */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',purple:'#7c3aed',teal:'#0d9488',font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif"};
const ESG_COLORS={low:'#16a34a',medium:'#d97706',high:'#dc2626',critical:'#991b1b'};
const MAT_COLORS=['#1b3a5c','#c5a96a','#5a8a6a','#dc2626','#7c3aed','#d97706','#06b6d4','#8b5cf6','#f59e0b','#10b981','#ef4444','#6366f1','#ec4899','#14b8a6','#f97316','#0ea5e9','#a855f7','#84cc16','#fb923c','#2dd4bf'];

/* ================================================================= DATA */
const LS_PORT='ra_portfolio_v1';
const LS_CUSTOM='ra_custom_products_v1';
const loadLS=k=>{try{return JSON.parse(localStorage.getItem(k))||null}catch{return null}};
const saveLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const fmt=(n,d=1)=>n==null?'\u2014':Number(n).toFixed(d);
const fmtUSD=n=>{if(n==null)return'\u2014';if(n>=1e9)return`$${(n/1e9).toFixed(1)}B`;if(n>=1e6)return`$${(n/1e6).toFixed(1)}M`;if(n>=1000)return`$${(n/1000).toFixed(1)}K`;return`$${Number(n).toFixed(2)}`};
const fmtG=n=>{if(n==null)return'\u2014';if(n>=1e6)return`${(n/1e6).toFixed(1)} t`;if(n>=1000)return`${(n/1000).toFixed(1)} kg`;return`${Number(n).toFixed(0)} g`};
const fmtL=n=>{if(n==null)return'\u2014';if(n>=1e6)return`${(n/1e6).toFixed(1)} ML`;if(n>=1000)return`${(n/1000).toFixed(1)} kL`;return`${Number(n).toFixed(0)} L`};
const esgColor=v=>v>=80?ESG_COLORS.critical:v>=60?ESG_COLORS.high:v>=40?ESG_COLORS.medium:ESG_COLORS.low;

/* ================================================================= 30 PRODUCTS */
const PRODUCT_ANATOMY = {
  smartphone:{name:'Smartphone (avg flagship)',icon:'\u{1F4F1}',retail_price:999,weight_g:185,lifespan_years:3,category:'Electronics',
    components:[
      {material:'Lithium',component:'Battery',quantity_g:0.8,cost_usd:0.01,pct_of_cost:0.001,source_countries:['AU','CL','CN'],esg_risk:55,carbon_g:12,water_l:1.6,child_labor_risk:'Low',conflict_mineral:false,recyclable:true,recycling_rate:0.05,commodity_id:'LITHIUM'},
      {material:'Cobalt',component:'Battery cathode',quantity_g:6.3,cost_usd:0.18,pct_of_cost:0.02,source_countries:['CD','AU'],esg_risk:85,carbon_g:45,water_l:8.5,child_labor_risk:'Critical (DRC artisanal)',conflict_mineral:true,recyclable:true,recycling_rate:0.15,commodity_id:'COBALT'},
      {material:'Copper',component:'Wiring, connectors',quantity_g:15.0,cost_usd:0.13,pct_of_cost:0.01,source_countries:['CL','PE','CN','CD'],esg_risk:60,carbon_g:75,water_l:45,child_labor_risk:'Low',conflict_mineral:false,recyclable:true,recycling_rate:0.30,commodity_id:'COPPER'},
      {material:'Gold',component:'Circuit board contacts',quantity_g:0.03,cost_usd:2.50,pct_of_cost:0.25,source_countries:['CN','AU','RU','US'],esg_risk:65,carbon_g:0.5,water_l:30,child_labor_risk:'Medium (artisanal)',conflict_mineral:true,recyclable:true,recycling_rate:0.25,commodity_id:'GOLD'},
      {material:'Rare Earth Elements',component:'Magnets, vibration motor',quantity_g:0.5,cost_usd:0.02,pct_of_cost:0.002,source_countries:['CN (90%)'],esg_risk:72,carbon_g:8,water_l:5,child_labor_risk:'Low',conflict_mineral:false,recyclable:false,recycling_rate:0.01,commodity_id:'RARE_EARTH'},
      {material:'Silicon',component:'Processor chip',quantity_g:2.0,cost_usd:85.00,pct_of_cost:8.5,source_countries:['TW','KR','US'],esg_risk:35,carbon_g:100,water_l:32000,child_labor_risk:'None'},
      {material:'Aluminum',component:'Casing',quantity_g:30.0,cost_usd:0.07,pct_of_cost:0.007,source_countries:['CN','RU','CA'],esg_risk:55,carbon_g:270,water_l:15,recyclable:true,recycling_rate:0.70,commodity_id:'ALUMINUM'},
      {material:'Glass (Gorilla)',component:'Screen',quantity_g:35.0,cost_usd:3.50,pct_of_cost:0.35,source_countries:['US (Corning)','JP'],esg_risk:30,carbon_g:85,water_l:10},
      {material:'Plastic (various)',component:'Internal components',quantity_g:45.0,cost_usd:0.15,pct_of_cost:0.015,source_countries:['CN','KR','JP'],esg_risk:50,carbon_g:95,water_l:25,recyclable:false},
      {material:'Tin',component:'Solder',quantity_g:1.0,cost_usd:0.03,pct_of_cost:0.003,source_countries:['CN','ID','MM'],esg_risk:70,conflict_mineral:true},
      {material:'Tantalum',component:'Capacitors',quantity_g:0.04,cost_usd:0.01,source_countries:['CD','RW','AU'],esg_risk:80,conflict_mineral:true,child_labor_risk:'High (DRC)'},
      {material:'Tungsten',component:'Vibration motor',quantity_g:0.6,cost_usd:0.02,source_countries:['CN','RU','VN'],conflict_mineral:true},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:12.00,pct_of_cost:1.2,source_countries:['CN (Foxconn)','IN','VN'],esg_risk:65,carbon_g:15},
      {material:'IP & Software',component:'Design, R&D, OS',quantity_g:0,cost_usd:450.00,pct_of_cost:45.0,source_countries:['US','KR'],esg_risk:20},
      {material:'Packaging & Retail',component:'Box, transport, store',quantity_g:0,cost_usd:35.00,pct_of_cost:3.5},
    ],
    end_of_life:{e_waste_kg:0.185,recycled_pct:17,landfill_pct:83,toxic_materials:['Lithium (fire risk)','Cobalt (toxic)','Lead (solder)'],total_recoverable_usd:3.20,recycling_cost_usd:5.00},
    externalities:{carbon_total_kg:70,water_total_l:12700,land_total_m2:0.2,conflict_minerals_count:4,child_labor_exposure:true,e_waste_contribution:true}},
  electric_car:{name:'Electric Vehicle (compact)',icon:'\u{1F697}',retail_price:42000,weight_g:1800000,lifespan_years:15,category:'Transport',
    components:[
      {material:'Lithium',component:'Battery pack',quantity_g:8000,cost_usd:96,pct_of_cost:0.23,source_countries:['AU','CL','CN','AR'],esg_risk:55,carbon_g:96000,water_l:12800,child_labor_risk:'Low',conflict_mineral:false,recyclable:true,recycling_rate:0.05,commodity_id:'LITHIUM'},
      {material:'Cobalt',component:'Battery cathode (NMC)',quantity_g:6400,cost_usd:179,pct_of_cost:0.43,source_countries:['CD','AU'],esg_risk:85,carbon_g:288000,water_l:54400,child_labor_risk:'Critical (DRC)',conflict_mineral:true,recyclable:true,recycling_rate:0.15,commodity_id:'COBALT'},
      {material:'Nickel',component:'Battery cathode',quantity_g:11000,cost_usd:178,pct_of_cost:0.42,source_countries:['ID','PH','RU'],esg_risk:60,carbon_g:110000,water_l:22000,commodity_id:'NICKEL'},
      {material:'Copper',component:'Motor, wiring, bus bars',quantity_g:83000,cost_usd:743,pct_of_cost:1.77,source_countries:['CL','PE','CN'],esg_risk:55,carbon_g:415000,water_l:249000,recyclable:true,recycling_rate:0.50,commodity_id:'COPPER'},
      {material:'Aluminum',component:'Body, chassis, battery housing',quantity_g:250000,cost_usd:588,pct_of_cost:1.4,source_countries:['CN','RU','CA','AU'],esg_risk:55,carbon_g:2250000,water_l:125000,recyclable:true,recycling_rate:0.80,commodity_id:'ALUMINUM'},
      {material:'Steel',component:'Structural frame',quantity_g:900000,cost_usd:612,pct_of_cost:1.46,source_countries:['CN','JP','KR','IN'],esg_risk:50,carbon_g:1620000,water_l:180000,recyclable:true,recycling_rate:0.85,commodity_id:'STEEL'},
      {material:'Rare Earth Elements',component:'Permanent magnets (motor)',quantity_g:1500,cost_usd:63,pct_of_cost:0.15,source_countries:['CN (90%)'],esg_risk:72,carbon_g:24000,water_l:7500,commodity_id:'RARE_EARTH'},
      {material:'Graphite',component:'Battery anode',quantity_g:52000,cost_usd:34,pct_of_cost:0.08,source_countries:['CN','MZ','BR'],esg_risk:45,carbon_g:52000,water_l:26000},
      {material:'Glass',component:'Windshield, windows',quantity_g:35000,cost_usd:280,pct_of_cost:0.67,source_countries:['Global'],esg_risk:30,carbon_g:25000,water_l:3500},
      {material:'Rubber',component:'Tires',quantity_g:40000,cost_usd:200,pct_of_cost:0.48,source_countries:['TH','ID','VN'],esg_risk:50,carbon_g:80000,water_l:8000},
      {material:'Plastics & Polymers',component:'Interior, bumpers',quantity_g:150000,cost_usd:450,pct_of_cost:1.07,source_countries:['Global'],esg_risk:45,carbon_g:450000,water_l:75000,recyclable:false},
      {material:'Silicon',component:'Power electronics, chips',quantity_g:500,cost_usd:1200,pct_of_cost:2.86,source_countries:['TW','KR','US'],esg_risk:35,carbon_g:25000,water_l:8000000},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:4500,pct_of_cost:10.7,source_countries:['DE','US','CN','JP'],esg_risk:35,carbon_g:150000},
      {material:'IP, R&D & Software',component:'Design, engineering, OS',quantity_g:0,cost_usd:12000,pct_of_cost:28.6,source_countries:['US','DE','JP'],esg_risk:15},
      {material:'Battery Management System',component:'Electronics & firmware',quantity_g:2000,cost_usd:800,pct_of_cost:1.9,source_countries:['US','KR','JP'],esg_risk:25},
    ],
    end_of_life:{e_waste_kg:350,recycled_pct:65,landfill_pct:20,toxic_materials:['Lithium (fire risk)','Cobalt','Coolant fluids'],total_recoverable_usd:2800,recycling_cost_usd:1500},
    externalities:{carbon_total_kg:8500,water_total_l:8750000,land_total_m2:35,conflict_minerals_count:2,child_labor_exposure:true,e_waste_contribution:true}},
  fast_fashion_tshirt:{name:'Fast Fashion T-Shirt',icon:'\u{1F455}',retail_price:12,weight_g:150,lifespan_years:1,category:'Textiles',
    components:[
      {material:'Cotton',component:'Fabric (conventional)',quantity_g:120,cost_usd:0.36,pct_of_cost:3.0,source_countries:['IN','CN','US','UZ'],esg_risk:60,carbon_g:2400,water_l:2160,child_labor_risk:'Medium (India, Uzbekistan)',recyclable:true,recycling_rate:0.12},
      {material:'Polyester',component:'Blend fabric',quantity_g:30,cost_usd:0.06,pct_of_cost:0.5,source_countries:['CN','IN','TW'],esg_risk:55,carbon_g:1100,water_l:12,recyclable:false},
      {material:'Dye chemicals',component:'Coloring',quantity_g:5,cost_usd:0.02,pct_of_cost:0.17,source_countries:['CN','IN'],esg_risk:75,carbon_g:50,water_l:200},
      {material:'Thread & Trim',component:'Stitching, buttons, labels',quantity_g:8,cost_usd:0.05,pct_of_cost:0.42,source_countries:['CN'],esg_risk:40,carbon_g:30,water_l:5},
      {material:'Labor',component:'Sewing, finishing',quantity_g:0,cost_usd:0.50,pct_of_cost:4.2,source_countries:['BD','KH','VN','MM'],esg_risk:80,carbon_g:10,child_labor_risk:'Medium'},
      {material:'Transport',component:'Shipping to market',quantity_g:0,cost_usd:0.30,pct_of_cost:2.5,source_countries:['Global'],carbon_g:500},
      {material:'Brand & Retail',component:'Marketing, store, margin',quantity_g:0,cost_usd:8.50,pct_of_cost:70.8,source_countries:['US','EU'],esg_risk:10},
      {material:'Packaging',component:'Polybag, tags, hangers',quantity_g:15,cost_usd:0.08,pct_of_cost:0.67,source_countries:['CN'],esg_risk:45},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:12,landfill_pct:73,incinerated_pct:15,toxic_materials:['Dye chemicals','Microplastics'],total_recoverable_usd:0.02,recycling_cost_usd:0.50},
    externalities:{carbon_total_kg:6.5,water_total_l:2700,land_total_m2:5.5,conflict_minerals_count:0,child_labor_exposure:true}},
  chocolate_bar:{name:'Chocolate Bar (100g)',icon:'\u{1F36B}',retail_price:3.50,weight_g:100,lifespan_years:0.5,category:'Food',
    components:[
      {material:'Cocoa beans',component:'Chocolate mass',quantity_g:35,cost_usd:0.30,pct_of_cost:8.6,source_countries:['CI','GH','ID'],esg_risk:80,carbon_g:665,water_l:560,child_labor_risk:'High (West Africa)',commodity_id:'COCOA'},
      {material:'Cocoa butter',component:'Fat base',quantity_g:20,cost_usd:0.25,pct_of_cost:7.1,source_countries:['CI','GH'],esg_risk:75,carbon_g:380,water_l:320},
      {material:'Sugar',component:'Sweetener',quantity_g:30,cost_usd:0.03,pct_of_cost:0.86,source_countries:['BR','IN','TH'],esg_risk:45,carbon_g:60,water_l:54},
      {material:'Milk powder',component:'Dairy solids',quantity_g:12,cost_usd:0.08,pct_of_cost:2.3,source_countries:['EU','NZ','US'],esg_risk:40,carbon_g:150,water_l:144},
      {material:'Soy lecithin',component:'Emulsifier',quantity_g:0.5,cost_usd:0.005,pct_of_cost:0.14,source_countries:['BR','AR','US'],esg_risk:55},
      {material:'Packaging',component:'Foil wrapper, cardboard',quantity_g:10,cost_usd:0.05,pct_of_cost:1.4,source_countries:['Global'],esg_risk:35,carbon_g:25,recyclable:true,recycling_rate:0.55},
      {material:'Brand & Retail',component:'Marketing, distribution',quantity_g:0,cost_usd:2.20,pct_of_cost:62.9,source_countries:['US','EU'],esg_risk:10},
      {material:'Labor (farming)',component:'Cocoa farming',quantity_g:0,cost_usd:0.12,pct_of_cost:3.4,source_countries:['CI','GH'],esg_risk:85,child_labor_risk:'Critical'},
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
      {material:'Silicon',component:'CPU, GPU, RAM, SSD',quantity_g:15,cost_usd:250.00,pct_of_cost:19.2,source_countries:['TW','KR','US'],esg_risk:35,carbon_g:750,water_l:240000},
      {material:'Glass',component:'Display panel',quantity_g:120,cost_usd:45.00,pct_of_cost:3.46,source_countries:['KR','JP','CN'],esg_risk:30,carbon_g:290,water_l:35},
      {material:'Plastic',component:'Keyboard, bezel, internals',quantity_g:350,cost_usd:1.20,pct_of_cost:0.09,source_countries:['CN'],esg_risk:50,carbon_g:735,water_l:195,recyclable:false},
      {material:'Rare Earth Elements',component:'HDD magnets, speakers',quantity_g:2.0,cost_usd:0.08,pct_of_cost:0.006,source_countries:['CN (90%)'],esg_risk:72,carbon_g:32,water_l:20,commodity_id:'RARE_EARTH'},
      {material:'Tin',component:'Solder',quantity_g:5,cost_usd:0.14,pct_of_cost:0.01,source_countries:['CN','ID'],esg_risk:70,conflict_mineral:true},
      {material:'Tantalum',component:'Capacitors',quantity_g:0.3,cost_usd:0.08,pct_of_cost:0.006,source_countries:['CD','RW'],esg_risk:80,conflict_mineral:true,child_labor_risk:'High'},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:25.00,pct_of_cost:1.92,source_countries:['CN','TW'],esg_risk:55},
      {material:'IP & Software',component:'Design, R&D, OS licenses',quantity_g:0,cost_usd:580.00,pct_of_cost:44.6,source_countries:['US'],esg_risk:15},
      {material:'Packaging & Retail',component:'Box, charger, logistics',quantity_g:0,cost_usd:40.00,pct_of_cost:3.08,source_countries:['Global']},
    ],
    end_of_life:{e_waste_kg:1.4,recycled_pct:22,landfill_pct:78,toxic_materials:['Lithium','Mercury (backlight)','Cobalt','Lead'],total_recoverable_usd:18.00,recycling_cost_usd:12.00},
    externalities:{carbon_total_kg:350,water_total_l:190000,land_total_m2:0.5,conflict_minerals_count:4,child_labor_exposure:true,e_waste_contribution:true}},
  solar_panel:{name:'Solar Panel (400W mono)',icon:'\u2600\uFE0F',retail_price:280,weight_g:22000,lifespan_years:30,category:'Energy',
    components:[
      {material:'Silicon (polysilicon)',component:'Solar cells',quantity_g:1200,cost_usd:10.20,pct_of_cost:3.6,source_countries:['CN (80%)','US','DE'],esg_risk:50,carbon_g:14400,water_l:192000},
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
      {material:'Sand & Gravel',component:'Aggregates',quantity_g:1850000,cost_usd:22.20,pct_of_cost:14.8,source_countries:['Local'],esg_risk:45,carbon_g:37000,water_l:1850},
      {material:'Water',component:'Mixing water',quantity_g:175000,cost_usd:0.05,pct_of_cost:0.03,source_countries:['Local'],esg_risk:25,water_l:175},
      {material:'Steel (rebar)',component:'Reinforcement',quantity_g:100000,cost_usd:68.00,pct_of_cost:45.3,source_countries:['CN','IN','JP'],esg_risk:55,carbon_g:185000,water_l:28000,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'Fly Ash / Slag',component:'Supplementary cementitious',quantity_g:50000,cost_usd:2.50,pct_of_cost:1.67,source_countries:['Local'],esg_risk:20,carbon_g:5000},
      {material:'Labor',component:'Mixing, pouring, curing',quantity_g:0,cost_usd:12.00,pct_of_cost:8.0,source_countries:['Local'],esg_risk:40},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:40,landfill_pct:55,toxic_materials:['Chromium VI (cement dust)'],total_recoverable_usd:5.00,recycling_cost_usd:8.00},
    externalities:{carbon_total_kg:520,water_total_l:30000,land_total_m2:0,conflict_minerals_count:0,child_labor_exposure:false}},
  leather_shoes:{name:'Leather Shoes (pair)',icon:'\u{1F45E}',retail_price:120,weight_g:700,lifespan_years:3,category:'Textiles',
    components:[
      {material:'Bovine Leather',component:'Upper, lining',quantity_g:350,cost_usd:8.75,pct_of_cost:7.3,source_countries:['IT','BR','IN','CN'],esg_risk:70,carbon_g:5950,water_l:5810,commodity_id:'CATTLE'},
      {material:'Rubber',component:'Sole',quantity_g:200,cost_usd:1.20,pct_of_cost:1.0,source_countries:['TH','ID','VN'],esg_risk:50,carbon_g:400,water_l:400},
      {material:'Textile (lining)',component:'Inner lining',quantity_g:80,cost_usd:0.40,pct_of_cost:0.33,source_countries:['CN','BD'],esg_risk:55,carbon_g:160,water_l:1440},
      {material:'Adhesives & Chemicals',component:'Glue, finish',quantity_g:30,cost_usd:0.30,pct_of_cost:0.25,source_countries:['CN','DE'],esg_risk:60,carbon_g:90,water_l:60},
      {material:'Metal',component:'Eyelets, shank',quantity_g:20,cost_usd:0.15,pct_of_cost:0.13,source_countries:['CN'],esg_risk:40,carbon_g:40},
      {material:'Labor',component:'Crafting, finishing',quantity_g:0,cost_usd:8.00,pct_of_cost:6.67,source_countries:['VN','CN','IT','IN'],esg_risk:60},
      {material:'Brand & Retail',component:'Marketing, store margin',quantity_g:0,cost_usd:85.00,pct_of_cost:70.8,source_countries:['US','EU'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:5,landfill_pct:85,incinerated_pct:10,toxic_materials:['Chromium (tanning)','Formaldehyde'],total_recoverable_usd:0.05,recycling_cost_usd:1.00},
    externalities:{carbon_total_kg:17.0,water_total_l:16600,land_total_m2:18,conflict_minerals_count:0,child_labor_exposure:false}},
  disposable_cup:{name:'Disposable Coffee Cup',icon:'\u2615',retail_price:0.15,weight_g:12,lifespan_years:0.001,category:'Consumer Goods',
    components:[
      {material:'Paper (virgin)',component:'Cup body',quantity_g:9,cost_usd:0.04,pct_of_cost:26.7,source_countries:['US','BR','FI'],esg_risk:40,carbon_g:13,water_l:3.6},
      {material:'Polyethylene (PE)',component:'Waterproof lining',quantity_g:2,cost_usd:0.01,pct_of_cost:6.7,source_countries:['US','SA','CN'],esg_risk:55,carbon_g:6,water_l:0.4,recyclable:false},
      {material:'Ink',component:'Branding print',quantity_g:0.5,cost_usd:0.005,pct_of_cost:3.3,source_countries:['Global'],esg_risk:30},
      {material:'Lid (polystyrene)',component:'Plastic lid',quantity_g:3,cost_usd:0.02,pct_of_cost:13.3,source_countries:['CN','US'],esg_risk:60,carbon_g:9,recyclable:false},
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
      {material:'Fiberglass (GFRP)',component:'Blade shell',quantity_g:8000000,cost_usd:32000,pct_of_cost:21.3,source_countries:['CN','US','DK'],esg_risk:40,carbon_g:32000000,water_l:16000000,recyclable:false},
      {material:'Epoxy Resin',component:'Matrix binder',quantity_g:2500000,cost_usd:18750,pct_of_cost:12.5,source_countries:['US','DE','CN'],esg_risk:45,carbon_g:12500000,water_l:5000000,recyclable:false},
      {material:'Balsa Wood / PVC Foam',component:'Core material',quantity_g:800000,cost_usd:12000,pct_of_cost:8.0,source_countries:['EC','PNG'],esg_risk:55,carbon_g:400000},
      {material:'Carbon Fiber',component:'Spar cap (structural)',quantity_g:400000,cost_usd:28000,pct_of_cost:18.7,source_countries:['JP','US','CN'],esg_risk:50,carbon_g:8000000,water_l:800000,recyclable:false},
      {material:'Steel',component:'Root bolts, inserts',quantity_g:200000,cost_usd:136,pct_of_cost:0.09,source_countries:['EU','CN'],esg_risk:50,carbon_g:370000,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'Lightning Protection (Copper)',component:'Conductor system',quantity_g:50000,cost_usd:448,pct_of_cost:0.3,source_countries:['CL','PE'],esg_risk:55,carbon_g:250000,recyclable:true,commodity_id:'COPPER'},
      {material:'Paint & Coatings',component:'Surface protection',quantity_g:150000,cost_usd:4500,pct_of_cost:3.0,source_countries:['DE','US'],esg_risk:40},
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
      {material:'Electrolyte (LiPF6)',component:'Ion conductor',quantity_g:8000,cost_usd:120,pct_of_cost:1.6,source_countries:['CN','JP','KR'],esg_risk:50,carbon_g:24000},
      {material:'Separator (PE/PP)',component:'Cell separator film',quantity_g:2000,cost_usd:60,pct_of_cost:0.8,source_countries:['JP','KR','CN'],esg_risk:35,carbon_g:6000},
      {material:'Steel',component:'Cell cans, module frame',quantity_g:30000,cost_usd:20.40,pct_of_cost:0.27,source_countries:['CN','JP'],esg_risk:50,carbon_g:55500,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'BMS Electronics',component:'Battery management system',quantity_g:3000,cost_usd:450,pct_of_cost:6.0,source_countries:['US','KR','CN'],esg_risk:35},
      {material:'Thermal Management',component:'Cooling plates, TIM',quantity_g:5000,cost_usd:200,pct_of_cost:2.67,source_countries:['US','JP'],esg_risk:30},
      {material:'Labor & Assembly',component:'Cell to pack assembly',quantity_g:0,cost_usd:800,pct_of_cost:10.7,source_countries:['CN','KR','US','DE'],esg_risk:30},
      {material:'IP, Testing & QC',component:'Design, validation',quantity_g:0,cost_usd:2500,pct_of_cost:33.3,source_countries:['US','KR','JP'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:350,recycled_pct:5,landfill_pct:85,toxic_materials:['Lithium (fire/explosive)','Cobalt (toxic)','Electrolyte (HF gas)','Nickel'],total_recoverable_usd:1200,recycling_cost_usd:800},
    externalities:{carbon_total_kg:3250,water_total_l:1500000,land_total_m2:2,conflict_minerals_count:1,child_labor_exposure:true}},
  palm_oil_soap:{name:'Palm Oil Soap Bar',icon:'\u{1F9FC}',retail_price:4.00,weight_g:100,lifespan_years:0.2,category:'Consumer Goods',
    components:[
      {material:'Palm Oil',component:'Base fat (saponified)',quantity_g:60,cost_usd:0.05,pct_of_cost:1.25,source_countries:['ID','MY'],esg_risk:85,carbon_g:510,water_l:60,commodity_id:'PALM_OIL'},
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
      {material:'Paint & Coatings',component:'Corrosion protection',quantity_g:25000,cost_usd:75,pct_of_cost:1.67,source_countries:['US','DE','JP'],esg_risk:50,carbon_g:62500},
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
      {material:'R&D (amortized)',component:'Drug discovery, trials',quantity_g:0,cost_usd:5.00,pct_of_cost:33.3,source_countries:['US','CH','UK'],esg_risk:15},
      {material:'Manufacturing & QC',component:'GMP production',quantity_g:0,cost_usd:0.50,pct_of_cost:3.3,source_countries:['IN','IE','US','CH'],esg_risk:30},
      {material:'Distribution & Retail',component:'Wholesaler, pharmacy, insurance',quantity_g:0,cost_usd:8.00,pct_of_cost:53.3,source_countries:['US','EU'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:10,landfill_pct:85,toxic_materials:['Pharmaceutical residues (water contamination)','PVC (blister)'],total_recoverable_usd:0.001,recycling_cost_usd:0.10},
    externalities:{carbon_total_kg:0.05,water_total_l:8,land_total_m2:0.001,conflict_minerals_count:0,child_labor_exposure:false}},
  // ─── NEW PRODUCTS ──────────────────────────────────────────────────────────
  refrigerator:{name:'Refrigerator',icon:'\u{1F9CA}',retail_price:900,weight_g:75000,lifespan_years:15,category:'Appliances',
    components:[
      {material:'Steel',component:'Cabinet, shelves, compressor',quantity_g:40000,cost_usd:27.20,pct_of_cost:3.02,source_countries:['CN','KR','MX'],esg_risk:50,carbon_g:72000,water_l:8000,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'Copper',component:'Compressor motor, tubing',quantity_g:2500,cost_usd:22.38,pct_of_cost:2.49,source_countries:['CL','PE'],esg_risk:55,carbon_g:12500,water_l:7500,recyclable:true,recycling_rate:0.55,commodity_id:'COPPER'},
      {material:'Aluminum',component:'Evaporator, condenser',quantity_g:3000,cost_usd:7.05,pct_of_cost:0.78,source_countries:['CN','RU'],esg_risk:55,carbon_g:27000,water_l:1500,recyclable:true,recycling_rate:0.75,commodity_id:'ALUMINUM'},
      {material:'Polyurethane Foam',component:'Insulation',quantity_g:8000,cost_usd:16.00,pct_of_cost:1.78,source_countries:['US','DE','CN'],esg_risk:50,carbon_g:24000,water_l:4000,recyclable:false},
      {material:'Plastic (ABS/PP)',component:'Interior, drawers, handles',quantity_g:12000,cost_usd:6.00,pct_of_cost:0.67,source_countries:['CN','KR'],esg_risk:45,carbon_g:25200,water_l:6600,recyclable:false},
      {material:'Glass',component:'Shelves',quantity_g:5000,cost_usd:5.00,pct_of_cost:0.56,source_countries:['CN'],esg_risk:30,carbon_g:12000,water_l:1450},
      {material:'Refrigerant (R-600a)',component:'Cooling gas',quantity_g:80,cost_usd:2.40,pct_of_cost:0.27,source_countries:['CN','US'],esg_risk:40,carbon_g:240},
      {material:'Electronics',component:'PCB, thermostat, display',quantity_g:500,cost_usd:40.00,pct_of_cost:4.44,source_countries:['CN','KR','TW'],esg_risk:45,carbon_g:2500,water_l:8000},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:55.00,pct_of_cost:6.11,source_countries:['CN','MX','KR'],esg_risk:40},
      {material:'IP, R&D & Warranty',component:'Design, software, support',quantity_g:0,cost_usd:220.00,pct_of_cost:24.4,source_countries:['KR','JP','DE'],esg_risk:15},
      {material:'Packaging & Retail',component:'Logistics, cardboard, margin',quantity_g:0,cost_usd:150.00,pct_of_cost:16.7,source_countries:['Global']},
    ],
    end_of_life:{e_waste_kg:75,recycled_pct:55,landfill_pct:35,toxic_materials:['Refrigerant','Polyurethane (blowing agents)','PCB chemicals'],total_recoverable_usd:30.00,recycling_cost_usd:25.00},
    externalities:{carbon_total_kg:210,water_total_l:52000,land_total_m2:0.5,conflict_minerals_count:0,child_labor_exposure:false}},
  bicycle:{name:'Bicycle (commuter)',icon:'\u{1F6B2}',retail_price:500,weight_g:12000,lifespan_years:10,category:'Transport',
    components:[
      {material:'Steel',component:'Frame, fork',quantity_g:6000,cost_usd:40.80,pct_of_cost:8.16,source_countries:['TW','CN','JP'],esg_risk:50,carbon_g:11100,water_l:1200,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'Aluminum',component:'Handlebars, rims, seatpost',quantity_g:2500,cost_usd:5.88,pct_of_cost:1.18,source_countries:['TW','CN'],esg_risk:55,carbon_g:22500,water_l:1250,recyclable:true,recycling_rate:0.75,commodity_id:'ALUMINUM'},
      {material:'Rubber',component:'Tires, inner tubes, grips',quantity_g:1200,cost_usd:8.00,pct_of_cost:1.60,source_countries:['TH','ID','VN'],esg_risk:45,carbon_g:2400,water_l:240},
      {material:'Chromium-Molybdenum Steel',component:'Drivetrain, chain, gears',quantity_g:1500,cost_usd:25.00,pct_of_cost:5.00,source_countries:['JP','TW','IT'],esg_risk:45,carbon_g:2775,recyclable:true},
      {material:'Plastic & Nylon',component:'Pedals, saddle base, cable housing',quantity_g:500,cost_usd:3.00,pct_of_cost:0.60,source_countries:['CN'],esg_risk:40,carbon_g:1050},
      {material:'Leather/Synthetic',component:'Saddle cover',quantity_g:100,cost_usd:2.50,pct_of_cost:0.50,source_countries:['IT','CN'],esg_risk:35,carbon_g:170,water_l:170},
      {material:'Lubricants',component:'Chain oil, grease',quantity_g:50,cost_usd:0.50,pct_of_cost:0.10,source_countries:['Global'],esg_risk:30,carbon_g:100},
      {material:'Labor & Assembly',component:'Manufacturing, wheel building',quantity_g:0,cost_usd:60.00,pct_of_cost:12.0,source_countries:['TW','CN','EU'],esg_risk:30},
      {material:'Brand & Retail',component:'Marketing, store margin',quantity_g:0,cost_usd:250.00,pct_of_cost:50.0,source_countries:['US','EU'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:75,landfill_pct:15,incinerated_pct:10,toxic_materials:['Rubber (tire burning)'],total_recoverable_usd:15.00,recycling_cost_usd:5.00},
    externalities:{carbon_total_kg:45,water_total_l:5000,land_total_m2:0.1,conflict_minerals_count:0,child_labor_exposure:false}},
  electric_scooter:{name:'Electric Scooter',icon:'\u{1F6F4}',retail_price:450,weight_g:14000,lifespan_years:4,category:'Transport',
    components:[
      {material:'Aluminum',component:'Frame, deck',quantity_g:5000,cost_usd:11.75,pct_of_cost:2.61,source_countries:['CN'],esg_risk:55,carbon_g:45000,water_l:2500,recyclable:true,recycling_rate:0.75,commodity_id:'ALUMINUM'},
      {material:'Lithium',component:'Battery cells',quantity_g:150,cost_usd:1.80,pct_of_cost:0.40,source_countries:['CN','AU'],esg_risk:55,carbon_g:1800,water_l:240,recyclable:true,recycling_rate:0.05,commodity_id:'LITHIUM'},
      {material:'Cobalt',component:'Battery cathode',quantity_g:120,cost_usd:3.36,pct_of_cost:0.75,source_countries:['CD','AU'],esg_risk:85,carbon_g:5400,water_l:1020,child_labor_risk:'Critical (DRC)',conflict_mineral:true,commodity_id:'COBALT'},
      {material:'Copper',component:'Motor windings, wiring',quantity_g:800,cost_usd:7.16,pct_of_cost:1.59,source_countries:['CL','PE'],esg_risk:55,carbon_g:4000,water_l:2400,recyclable:true,commodity_id:'COPPER'},
      {material:'Steel',component:'Bolts, kickstand, brake disc',quantity_g:2000,cost_usd:1.36,pct_of_cost:0.30,source_countries:['CN'],esg_risk:50,carbon_g:3700,recyclable:true,recycling_rate:0.90},
      {material:'Rubber',component:'Tires',quantity_g:1500,cost_usd:6.00,pct_of_cost:1.33,source_countries:['TH','CN'],esg_risk:45,carbon_g:3000,water_l:300},
      {material:'Plastic (ABS)',component:'Fenders, display cover',quantity_g:2000,cost_usd:3.00,pct_of_cost:0.67,source_countries:['CN'],esg_risk:45,carbon_g:4200,recyclable:false},
      {material:'Electronics',component:'Controller, BMS, display',quantity_g:300,cost_usd:45.00,pct_of_cost:10.0,source_countries:['CN','TW'],esg_risk:40,carbon_g:1500,water_l:4800},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:35.00,pct_of_cost:7.78,source_countries:['CN'],esg_risk:45},
      {material:'IP & Retail',component:'Brand, design, margin',quantity_g:0,cost_usd:250.00,pct_of_cost:55.6,source_countries:['US','EU','CN'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:14,recycled_pct:30,landfill_pct:60,toxic_materials:['Lithium (fire risk)','Cobalt'],total_recoverable_usd:8.00,recycling_cost_usd:10.00},
    externalities:{carbon_total_kg:75,water_total_l:15000,land_total_m2:0.1,conflict_minerals_count:1,child_labor_exposure:true}},
  yoga_mat:{name:'Yoga Mat (PVC)',icon:'\u{1F9D8}',retail_price:25,weight_g:1200,lifespan_years:3,category:'Consumer Goods',
    components:[
      {material:'PVC (polyvinyl chloride)',component:'Mat body',quantity_g:900,cost_usd:1.80,pct_of_cost:7.2,source_countries:['CN','TW'],esg_risk:65,carbon_g:2700,water_l:450,recyclable:false},
      {material:'Plasticizers (DOP/DINP)',component:'Softening agent',quantity_g:200,cost_usd:0.40,pct_of_cost:1.6,source_countries:['CN'],esg_risk:60,carbon_g:400,water_l:100},
      {material:'Pigments',component:'Coloring',quantity_g:30,cost_usd:0.15,pct_of_cost:0.6,source_countries:['CN','IN'],esg_risk:45,carbon_g:60},
      {material:'Textile mesh',component:'Reinforcement layer',quantity_g:50,cost_usd:0.10,pct_of_cost:0.4,source_countries:['CN'],esg_risk:35,carbon_g:105,water_l:90},
      {material:'Packaging',component:'Plastic wrap, cardboard',quantity_g:80,cost_usd:0.15,pct_of_cost:0.6,source_countries:['CN'],esg_risk:35,carbon_g:100},
      {material:'Labor',component:'Manufacturing, rolling',quantity_g:0,cost_usd:1.50,pct_of_cost:6.0,source_countries:['CN','TW'],esg_risk:45},
      {material:'Brand & Retail',component:'Marketing, margin',quantity_g:0,cost_usd:18.00,pct_of_cost:72.0,source_countries:['US','EU'],esg_risk:10},
      {material:'Transport',component:'Sea freight, last mile',quantity_g:0,cost_usd:1.50,pct_of_cost:6.0,source_countries:['Global'],carbon_g:200},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:2,landfill_pct:90,incinerated_pct:8,toxic_materials:['PVC (dioxins when burned)','Phthalates'],total_recoverable_usd:0.01,recycling_cost_usd:0.50},
    externalities:{carbon_total_kg:4.2,water_total_l:800,land_total_m2:0.01,conflict_minerals_count:0,child_labor_exposure:false},
    sustainable_alt:{name:'Natural Rubber/Cork Yoga Mat',benefit:'No PVC or phthalates, biodegradable, 40% lower carbon',price_premium:'+60%'}},
  ceramic_tile:{name:'Ceramic Tile (1 m\u00B2)',icon:'\u{1F3E0}',retail_price:20,weight_g:18000,lifespan_years:50,category:'Construction',
    components:[
      {material:'Clay',component:'Tile body',quantity_g:14000,cost_usd:1.40,pct_of_cost:7.0,source_countries:['IT','ES','CN','BR'],esg_risk:30,carbon_g:14000,water_l:2800},
      {material:'Feldspar',component:'Flux agent',quantity_g:2000,cost_usd:0.30,pct_of_cost:1.5,source_countries:['TR','IT','CN'],esg_risk:25,carbon_g:2000,water_l:400},
      {material:'Silica Sand',component:'Glass former',quantity_g:1500,cost_usd:0.15,pct_of_cost:0.75,source_countries:['Local'],esg_risk:30,carbon_g:750,water_l:150},
      {material:'Glaze (frit)',component:'Surface coating',quantity_g:500,cost_usd:0.50,pct_of_cost:2.5,source_countries:['IT','ES','CN'],esg_risk:40,carbon_g:1000,water_l:250},
      {material:'Natural Gas',component:'Kiln firing energy',quantity_g:0,cost_usd:2.00,pct_of_cost:10.0,source_countries:['Local'],esg_risk:45,carbon_g:8000},
      {material:'Pigments',component:'Coloring, patterns',quantity_g:50,cost_usd:0.10,pct_of_cost:0.5,source_countries:['DE','CN'],esg_risk:35,carbon_g:100},
      {material:'Labor',component:'Manufacturing, quality control',quantity_g:0,cost_usd:3.00,pct_of_cost:15.0,source_countries:['IT','CN','BR'],esg_risk:30},
      {material:'Packaging & Logistics',component:'Cardboard, pallets, transport',quantity_g:0,cost_usd:4.00,pct_of_cost:20.0,source_countries:['Local']},
      {material:'Brand & Retail',component:'Showroom, margin',quantity_g:0,cost_usd:6.00,pct_of_cost:30.0,source_countries:['Local'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:20,landfill_pct:75,toxic_materials:['Lead (some glazes)'],total_recoverable_usd:0.50,recycling_cost_usd:1.00},
    externalities:{carbon_total_kg:28,water_total_l:4500,land_total_m2:0.5,conflict_minerals_count:0,child_labor_exposure:false}},
  paint_can:{name:'Paint Can (1 gallon)',icon:'\u{1F3A8}',retail_price:35,weight_g:5500,lifespan_years:5,category:'Consumer Goods',
    components:[
      {material:'Titanium Dioxide (TiO2)',component:'White pigment',quantity_g:800,cost_usd:2.40,pct_of_cost:6.86,source_countries:['AU','ZA','CN'],esg_risk:50,carbon_g:4000,water_l:4800},
      {material:'Acrylic/Latex Resin',component:'Binder',quantity_g:1500,cost_usd:3.00,pct_of_cost:8.57,source_countries:['US','DE','CN'],esg_risk:45,carbon_g:4500,water_l:1500},
      {material:'Water',component:'Solvent (water-based paint)',quantity_g:2500,cost_usd:0.005,pct_of_cost:0.01,source_countries:['Local'],esg_risk:10,water_l:2.5},
      {material:'Calcium Carbonate',component:'Filler/extender',quantity_g:400,cost_usd:0.08,pct_of_cost:0.23,source_countries:['US','EU'],esg_risk:20,carbon_g:200},
      {material:'Additives',component:'Thickeners, biocides, surfactants',quantity_g:100,cost_usd:0.50,pct_of_cost:1.43,source_countries:['DE','US','CN'],esg_risk:50,carbon_g:200,water_l:50},
      {material:'Steel Can',component:'Container',quantity_g:300,cost_usd:0.60,pct_of_cost:1.71,source_countries:['US','CN'],esg_risk:40,carbon_g:555,recyclable:true,recycling_rate:0.70},
      {material:'Label & Lid',component:'Branding, closure',quantity_g:50,cost_usd:0.10,pct_of_cost:0.29,source_countries:['Local'],esg_risk:25},
      {material:'Labor',component:'Mixing, filling, QC',quantity_g:0,cost_usd:2.00,pct_of_cost:5.71,source_countries:['US','EU','CN'],esg_risk:25},
      {material:'Brand & Retail',component:'Marketing, store margin',quantity_g:0,cost_usd:22.00,pct_of_cost:62.9,source_countries:['US','EU'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:15,landfill_pct:75,toxic_materials:['TiO2 nanoparticles','Biocides','VOCs (oil-based)'],total_recoverable_usd:0.10,recycling_cost_usd:1.00},
    externalities:{carbon_total_kg:12,water_total_l:8000,land_total_m2:0.05,conflict_minerals_count:0,child_labor_exposure:false}},
  prescription_glasses:{name:'Prescription Glasses',icon:'\u{1F453}',retail_price:300,weight_g:30,lifespan_years:2,category:'Healthcare',
    components:[
      {material:'Polycarbonate',component:'Lenses',quantity_g:8,cost_usd:5.00,pct_of_cost:1.67,source_countries:['US','JP','CN'],esg_risk:35,carbon_g:24,water_l:8},
      {material:'Acetate (cellulose)',component:'Frame',quantity_g:15,cost_usd:3.00,pct_of_cost:1.00,source_countries:['IT','CN','JP'],esg_risk:30,carbon_g:30,water_l:15},
      {material:'Stainless Steel',component:'Hinges, screws',quantity_g:5,cost_usd:0.50,pct_of_cost:0.17,source_countries:['CN','DE'],esg_risk:40,carbon_g:9.25,recyclable:true},
      {material:'Nickel',component:'Hinge alloy',quantity_g:1,cost_usd:0.02,pct_of_cost:0.007,source_countries:['ID','RU'],esg_risk:50,carbon_g:1,commodity_id:'NICKEL'},
      {material:'Silicone',component:'Nose pads',quantity_g:1,cost_usd:0.05,pct_of_cost:0.017,source_countries:['CN','US'],esg_risk:25,carbon_g:2},
      {material:'AR Coating',component:'Anti-reflective coating',quantity_g:0.01,cost_usd:8.00,pct_of_cost:2.67,source_countries:['DE','JP'],esg_risk:35,carbon_g:0.5},
      {material:'Optician Labor',component:'Fitting, adjustment',quantity_g:0,cost_usd:25.00,pct_of_cost:8.33,source_countries:['Local'],esg_risk:10},
      {material:'R&D & Brand',component:'Design, marketing',quantity_g:0,cost_usd:80.00,pct_of_cost:26.7,source_countries:['IT','FR','US'],esg_risk:10},
      {material:'Retail & Overhead',component:'Store, insurance, margin',quantity_g:0,cost_usd:150.00,pct_of_cost:50.0,source_countries:['Local'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:5,landfill_pct:90,toxic_materials:['Nickel (allergen)'],total_recoverable_usd:0.10,recycling_cost_usd:0.50},
    externalities:{carbon_total_kg:0.5,water_total_l:50,land_total_m2:0.001,conflict_minerals_count:0,child_labor_exposure:false}},
  baby_diaper:{name:'Baby Diaper (single use)',icon:'\u{1F476}',retail_price:0.30,weight_g:45,lifespan_years:0.0003,category:'Consumer Goods',
    components:[
      {material:'Fluff Pulp',component:'Absorbent core',quantity_g:15,cost_usd:0.03,pct_of_cost:10.0,source_countries:['US','CA','BR','SE'],esg_risk:35,carbon_g:15,water_l:15},
      {material:'SAP (sodium polyacrylate)',component:'Super absorbent polymer',quantity_g:10,cost_usd:0.04,pct_of_cost:13.3,source_countries:['JP','DE','CN'],esg_risk:40,carbon_g:30,water_l:20},
      {material:'Polypropylene',component:'Top sheet, back sheet',quantity_g:8,cost_usd:0.02,pct_of_cost:6.67,source_countries:['US','SA','CN'],esg_risk:45,carbon_g:16,water_l:4,recyclable:false},
      {material:'Polyethylene',component:'Waterproof outer',quantity_g:5,cost_usd:0.01,pct_of_cost:3.33,source_countries:['US','CN'],esg_risk:45,carbon_g:10,water_l:2.5},
      {material:'Adhesives',component:'Construction glue, tab tapes',quantity_g:3,cost_usd:0.01,pct_of_cost:3.33,source_countries:['US','DE'],esg_risk:35,carbon_g:6},
      {material:'Elastic (Spandex)',component:'Leg cuffs, waistband',quantity_g:2,cost_usd:0.01,pct_of_cost:3.33,source_countries:['CN','US'],esg_risk:30,carbon_g:8},
      {material:'Fragrance/Lotion',component:'Skin care additive',quantity_g:0.5,cost_usd:0.005,pct_of_cost:1.67,source_countries:['US','EU'],esg_risk:25},
      {material:'Manufacturing',component:'Automated assembly',quantity_g:0,cost_usd:0.03,pct_of_cost:10.0,source_countries:['US','EU','CN'],esg_risk:20},
      {material:'Brand & Retail',component:'Marketing, distribution, margin',quantity_g:0,cost_usd:0.12,pct_of_cost:40.0,source_countries:['US','EU'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:0,landfill_pct:95,incinerated_pct:5,toxic_materials:['SAP (non-biodegradable)','Dioxins (incineration)'],total_recoverable_usd:0,recycling_cost_usd:0.02},
    externalities:{carbon_total_kg:0.55,water_total_l:50,land_total_m2:0.01,conflict_minerals_count:0,child_labor_exposure:false},
    sustainable_alt:{name:'Cloth/Reusable Diaper',benefit:'500x less landfill waste, 30% lower lifetime carbon',price_premium:'+300% upfront, -60% lifetime'}},
  paper_book:{name:'Paper Book (300 pages)',icon:'\u{1F4D6}',retail_price:18,weight_g:400,lifespan_years:50,category:'Consumer Goods',
    components:[
      {material:'Paper (wood pulp)',component:'Pages',quantity_g:350,cost_usd:0.70,pct_of_cost:3.89,source_countries:['US','CA','FI','BR'],esg_risk:35,carbon_g:350,water_l:3500},
      {material:'Printing Ink',component:'Text and images',quantity_g:15,cost_usd:0.30,pct_of_cost:1.67,source_countries:['US','DE','JP'],esg_risk:30,carbon_g:30},
      {material:'Cardboard',component:'Cover',quantity_g:30,cost_usd:0.15,pct_of_cost:0.83,source_countries:['US','CN'],esg_risk:30,carbon_g:30,water_l:300,recyclable:true},
      {material:'Adhesive (PVA)',component:'Spine binding',quantity_g:5,cost_usd:0.02,pct_of_cost:0.11,source_countries:['US','DE'],esg_risk:25,carbon_g:10},
      {material:'Printing & Binding',component:'Manufacturing',quantity_g:0,cost_usd:1.50,pct_of_cost:8.33,source_countries:['US','CN','IN'],esg_risk:25,carbon_g:200},
      {material:'Author & Publisher',component:'Content, editing, marketing',quantity_g:0,cost_usd:5.00,pct_of_cost:27.8,source_countries:['Global'],esg_risk:10},
      {material:'Distribution & Retail',component:'Warehousing, shipping, bookstore',quantity_g:0,cost_usd:8.00,pct_of_cost:44.4,source_countries:['US','EU'],esg_risk:10,carbon_g:500},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:68,landfill_pct:27,incinerated_pct:5,toxic_materials:['Ink chemicals (minor)'],total_recoverable_usd:0.05,recycling_cost_usd:0.02},
    externalities:{carbon_total_kg:1.2,water_total_l:4500,land_total_m2:1.5,conflict_minerals_count:0,child_labor_exposure:false}},
  led_lightbulb:{name:'LED Lightbulb (10W)',icon:'\u{1F4A1}',retail_price:5,weight_g:70,lifespan_years:11,category:'Electronics',
    components:[
      {material:'LED Chip (GaN/InGaN)',component:'Light emitter',quantity_g:0.5,cost_usd:0.30,pct_of_cost:6.0,source_countries:['CN','JP','KR','US'],esg_risk:40,carbon_g:5,water_l:50},
      {material:'Aluminum',component:'Heat sink',quantity_g:20,cost_usd:0.05,pct_of_cost:1.0,source_countries:['CN'],esg_risk:55,carbon_g:180,water_l:10,recyclable:true,recycling_rate:0.75,commodity_id:'ALUMINUM'},
      {material:'Polycarbonate',component:'Diffuser dome',quantity_g:15,cost_usd:0.08,pct_of_cost:1.6,source_countries:['CN','US'],esg_risk:35,carbon_g:45,water_l:8},
      {material:'Ceramic',component:'Base insulator',quantity_g:10,cost_usd:0.03,pct_of_cost:0.6,source_countries:['CN'],esg_risk:25,carbon_g:15},
      {material:'Copper',component:'Wiring, contacts',quantity_g:3,cost_usd:0.03,pct_of_cost:0.6,source_countries:['CL','CN'],esg_risk:50,carbon_g:15,water_l:9,recyclable:true,commodity_id:'COPPER'},
      {material:'Electronics',component:'Driver PCB, capacitors',quantity_g:8,cost_usd:0.40,pct_of_cost:8.0,source_countries:['CN','TW'],esg_risk:40,carbon_g:40,water_l:128},
      {material:'Solder (tin-lead)',component:'PCB solder',quantity_g:0.5,cost_usd:0.01,pct_of_cost:0.2,source_countries:['CN','ID'],esg_risk:55,conflict_mineral:true},
      {material:'Phosphor Coating',component:'Color conversion',quantity_g:0.1,cost_usd:0.05,pct_of_cost:1.0,source_countries:['CN','JP'],esg_risk:35},
      {material:'Labor & Assembly',component:'Automated production',quantity_g:0,cost_usd:0.30,pct_of_cost:6.0,source_countries:['CN'],esg_risk:35},
      {material:'Packaging & Retail',component:'Cardboard, margin',quantity_g:0,cost_usd:3.00,pct_of_cost:60.0,source_countries:['Global'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0.07,recycled_pct:10,landfill_pct:85,toxic_materials:['Lead (solder)','Gallium compounds'],total_recoverable_usd:0.02,recycling_cost_usd:0.20},
    externalities:{carbon_total_kg:0.8,water_total_l:250,land_total_m2:0.001,conflict_minerals_count:1,child_labor_exposure:false}},
  office_chair:{name:'Office Chair (ergonomic)',icon:'\u{1FA91}',retail_price:400,weight_g:18000,lifespan_years:10,category:'Industrial',
    components:[
      {material:'Steel',component:'Base, gas cylinder, mechanism',quantity_g:8000,cost_usd:5.44,pct_of_cost:1.36,source_countries:['CN','TW'],esg_risk:50,carbon_g:14800,water_l:1600,recyclable:true,recycling_rate:0.90,commodity_id:'STEEL'},
      {material:'Aluminum',component:'Armrests, star base',quantity_g:2000,cost_usd:4.70,pct_of_cost:1.18,source_countries:['CN'],esg_risk:55,carbon_g:18000,water_l:1000,recyclable:true,recycling_rate:0.75,commodity_id:'ALUMINUM'},
      {material:'Nylon (PA6)',component:'Base, casters',quantity_g:2500,cost_usd:5.00,pct_of_cost:1.25,source_countries:['CN','US'],esg_risk:40,carbon_g:5250,water_l:2500},
      {material:'Polyester Mesh',component:'Seat, back',quantity_g:1500,cost_usd:8.00,pct_of_cost:2.00,source_countries:['CN','KR'],esg_risk:40,carbon_g:3150,water_l:450},
      {material:'Polyurethane Foam',component:'Seat cushion',quantity_g:3000,cost_usd:6.00,pct_of_cost:1.50,source_countries:['US','CN'],esg_risk:45,carbon_g:9000,water_l:1500,recyclable:false},
      {material:'Polypropylene',component:'Back shell, covers',quantity_g:1500,cost_usd:3.00,pct_of_cost:0.75,source_countries:['CN'],esg_risk:40,carbon_g:3150},
      {material:'Rubber',component:'Caster wheels',quantity_g:200,cost_usd:0.80,pct_of_cost:0.20,source_countries:['TH','CN'],esg_risk:40,carbon_g:400},
      {material:'Labor & Assembly',component:'Manufacturing',quantity_g:0,cost_usd:30.00,pct_of_cost:7.50,source_countries:['CN','MY','US'],esg_risk:35},
      {material:'IP & Design',component:'Ergonomic R&D',quantity_g:0,cost_usd:80.00,pct_of_cost:20.0,source_countries:['US','DE','JP'],esg_risk:10},
      {material:'Retail & Logistics',component:'Shipping, store margin',quantity_g:0,cost_usd:200.00,pct_of_cost:50.0,source_countries:['Global'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:30,landfill_pct:60,incinerated_pct:10,toxic_materials:['PU foam (isocyanates)','Gas cylinder oil'],total_recoverable_usd:5.00,recycling_cost_usd:8.00},
    externalities:{carbon_total_kg:60,water_total_l:12000,land_total_m2:0.1,conflict_minerals_count:0,child_labor_exposure:false}},
  running_shoes:{name:'Running Shoes (pair)',icon:'\u{1F45F}',retail_price:130,weight_g:520,lifespan_years:1.5,category:'Textiles',
    components:[
      {material:'EVA Foam',component:'Midsole',quantity_g:200,cost_usd:2.00,pct_of_cost:1.54,source_countries:['VN','CN','ID'],esg_risk:40,carbon_g:600,water_l:200},
      {material:'Rubber',component:'Outsole',quantity_g:120,cost_usd:1.20,pct_of_cost:0.92,source_countries:['TH','VN'],esg_risk:45,carbon_g:240,water_l:24},
      {material:'Polyester Mesh',component:'Upper',quantity_g:100,cost_usd:1.50,pct_of_cost:1.15,source_countries:['CN','VN','TW'],esg_risk:40,carbon_g:500,water_l:50},
      {material:'TPU (thermoplastic PU)',component:'Heel counter, overlays',quantity_g:40,cost_usd:0.60,pct_of_cost:0.46,source_countries:['CN','DE'],esg_risk:40,carbon_g:120,water_l:20},
      {material:'Recycled Polyester',component:'Laces, lining',quantity_g:30,cost_usd:0.45,pct_of_cost:0.35,source_countries:['TW','CN'],esg_risk:25,carbon_g:60,water_l:6,recyclable:true,recycling_rate:0.15},
      {material:'Metal (eyelets)',component:'Lace holes',quantity_g:5,cost_usd:0.05,pct_of_cost:0.04,source_countries:['CN'],esg_risk:35,carbon_g:9},
      {material:'Adhesives',component:'Bonding agent',quantity_g:15,cost_usd:0.15,pct_of_cost:0.12,source_countries:['CN','DE'],esg_risk:45,carbon_g:30},
      {material:'Labor',component:'Stitching, lasting, assembly',quantity_g:0,cost_usd:4.00,pct_of_cost:3.08,source_countries:['VN','ID','CN'],esg_risk:55,child_labor_risk:'Low'},
      {material:'Brand & Marketing',component:'Sponsorships, advertising',quantity_g:0,cost_usd:30.00,pct_of_cost:23.1,source_countries:['US','EU'],esg_risk:10},
      {material:'Retail & Logistics',component:'Store, shipping, margin',quantity_g:0,cost_usd:75.00,pct_of_cost:57.7,source_countries:['Global'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:5,landfill_pct:88,incinerated_pct:7,toxic_materials:['Adhesive VOCs','EVA decomposition'],total_recoverable_usd:0.02,recycling_cost_usd:0.80},
    externalities:{carbon_total_kg:14,water_total_l:800,land_total_m2:0.5,conflict_minerals_count:0,child_labor_exposure:false},
    sustainable_alt:{name:'Allbirds / Plant-Based Running Shoe',benefit:'Bio-based materials, 30% lower carbon, carbon neutral',price_premium:'+15%'}},
  lipstick:{name:'Lipstick (cosmetic)',icon:'\u{1F484}',retail_price:28,weight_g:15,lifespan_years:1,category:'Consumer Goods',
    components:[
      {material:'Wax (beeswax/carnauba)',component:'Structure base',quantity_g:4,cost_usd:0.20,pct_of_cost:0.71,source_countries:['BR','CN','US'],esg_risk:30,carbon_g:8,water_l:4},
      {material:'Oils (castor, jojoba)',component:'Moisturizing base',quantity_g:3,cost_usd:0.15,pct_of_cost:0.54,source_countries:['IN','US','IL'],esg_risk:25,carbon_g:6,water_l:30},
      {material:'Pigments (iron oxides, mica)',component:'Color',quantity_g:1.5,cost_usd:0.30,pct_of_cost:1.07,source_countries:['IN','CN','US'],esg_risk:55,carbon_g:3,child_labor_risk:'Medium (India mica mines)'},
      {material:'Silicones',component:'Texture, feel',quantity_g:1,cost_usd:0.10,pct_of_cost:0.36,source_countries:['US','JP','DE'],esg_risk:35,carbon_g:3},
      {material:'Preservatives',component:'Shelf life extension',quantity_g:0.2,cost_usd:0.05,pct_of_cost:0.18,source_countries:['US','EU'],esg_risk:30},
      {material:'Fragrance',component:'Scent',quantity_g:0.1,cost_usd:0.05,pct_of_cost:0.18,source_countries:['FR','US'],esg_risk:25},
      {material:'Plastic Tube',component:'Container',quantity_g:4,cost_usd:0.40,pct_of_cost:1.43,source_countries:['CN','IT'],esg_risk:40,carbon_g:12,recyclable:false},
      {material:'Metal Cap',component:'Closure',quantity_g:2,cost_usd:0.15,pct_of_cost:0.54,source_countries:['CN'],esg_risk:35,carbon_g:4,recyclable:true},
      {material:'R&D & Safety Testing',component:'Formulation, dermal tests',quantity_g:0,cost_usd:2.00,pct_of_cost:7.14,source_countries:['US','FR','JP'],esg_risk:20},
      {material:'Brand & Marketing',component:'Advertising, influencers',quantity_g:0,cost_usd:10.00,pct_of_cost:35.7,source_countries:['US','FR','KR'],esg_risk:10},
      {material:'Retail & Packaging',component:'Box, counter display, margin',quantity_g:0,cost_usd:12.00,pct_of_cost:42.9,source_countries:['Global'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:2,landfill_pct:95,toxic_materials:['Microplastics','Fragrance chemicals'],total_recoverable_usd:0.01,recycling_cost_usd:0.15},
    externalities:{carbon_total_kg:0.8,water_total_l:120,land_total_m2:0.01,conflict_minerals_count:0,child_labor_exposure:true}},
  wooden_furniture:{name:'Wooden Desk',icon:'\u{1FA91}',retail_price:350,weight_g:25000,lifespan_years:20,category:'Industrial',
    components:[
      {material:'Oak/Pine Wood',component:'Desktop, legs, frame',quantity_g:20000,cost_usd:40.00,pct_of_cost:11.4,source_countries:['US','RU','CA','DE'],esg_risk:35,carbon_g:6000,water_l:40000,commodity_id:'TIMBER'},
      {material:'MDF/Particleboard',component:'Shelves, drawer bottoms',quantity_g:3000,cost_usd:3.00,pct_of_cost:0.86,source_countries:['CN','EU'],esg_risk:40,carbon_g:3000,water_l:3000},
      {material:'Varnish/Lacquer',component:'Surface finish',quantity_g:200,cost_usd:1.00,pct_of_cost:0.29,source_countries:['DE','US','CN'],esg_risk:45,carbon_g:400},
      {material:'Steel',component:'Drawer slides, screws, brackets',quantity_g:1500,cost_usd:1.02,pct_of_cost:0.29,source_countries:['CN','US'],esg_risk:45,carbon_g:2775,recyclable:true,recycling_rate:0.85},
      {material:'Adhesive (PVA/PUR)',component:'Wood glue',quantity_g:100,cost_usd:0.20,pct_of_cost:0.06,source_countries:['US','DE'],esg_risk:30,carbon_g:200},
      {material:'Rubber (feet)',component:'Floor protectors',quantity_g:50,cost_usd:0.10,pct_of_cost:0.03,source_countries:['CN'],esg_risk:35,carbon_g:100},
      {material:'Packaging',component:'Cardboard, foam, straps',quantity_g:2000,cost_usd:3.00,pct_of_cost:0.86,source_countries:['Local'],esg_risk:25,carbon_g:2000},
      {material:'Labor',component:'Woodworking, finishing, assembly',quantity_g:0,cost_usd:50.00,pct_of_cost:14.3,source_countries:['VN','CN','PL','US'],esg_risk:35},
      {material:'Design & Brand',component:'R&D, marketing',quantity_g:0,cost_usd:60.00,pct_of_cost:17.1,source_countries:['US','EU'],esg_risk:10},
      {material:'Retail & Logistics',component:'Store, delivery, margin',quantity_g:0,cost_usd:150.00,pct_of_cost:42.9,source_countries:['Global'],esg_risk:10},
    ],
    end_of_life:{e_waste_kg:0,recycled_pct:20,landfill_pct:40,incinerated_pct:30,toxic_materials:['Formaldehyde (MDF)','VOCs (varnish)'],total_recoverable_usd:10.00,recycling_cost_usd:5.00},
    externalities:{carbon_total_kg:18,water_total_l:48000,land_total_m2:3.0,conflict_minerals_count:0,child_labor_exposure:false}},
};

const PRODUCT_KEYS = Object.keys(PRODUCT_ANATOMY);
const CARBON_EXTERNALITY_PER_KG = 0.05;
const WATER_EXTERNALITY_PER_L = 0.002;

/* ================================================================= PRODUCT ESG SCORE */
function computeProductESGScore(comps) {
  const withRisk = comps.filter(c => c.esg_risk != null && c.esg_risk > 0);
  if (!withRisk.length) return 0;
  const totalCost = withRisk.reduce((s, c) => s + (c.cost_usd || 0), 0);
  if (totalCost <= 0) return Math.round(withRisk.reduce((s, c) => s + c.esg_risk, 0) / withRisk.length);
  return Math.round(withRisk.reduce((s, c) => s + c.esg_risk * (c.cost_usd || 0), 0) / totalCost);
}

function computeCircularScore(product) {
  const comps = product.components || [];
  const recyclableCount = comps.filter(c => c.recyclable).length;
  const recyclablePct = comps.length ? Math.round(recyclableCount / comps.length * 100) : 0;
  const avgRecRate = comps.filter(c => c.recycling_rate).reduce((s, c) => s + c.recycling_rate, 0) / (comps.filter(c => c.recycling_rate).length || 1) * 100;
  return Math.round((recyclablePct * 0.4 + avgRecRate * 0.3 + (product.end_of_life?.recycled_pct || 0) * 0.3));
}

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
  const cm={blue:T.navyL,green:T.sage,red:T.red,amber:T.amber,purple:'#7c3aed',gray:T.textMut,teal:T.teal};
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

  const productESGScore = useMemo(() => computeProductESGScore(comps), [comps]);
  const circularScore = useMemo(() => computeCircularScore(product), [product]);

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

  // Product comparison radar data
  const radarCompareData = useMemo(() => {
    if (!showCompare) return [];
    const pA = product, pB = PRODUCT_ANATOMY[compareProduct];
    if (!pA || !pB) return [];
    const cA = pA.components, cB = pB.components;
    const tA = { carbon: cA.reduce((s, c) => s + (c.carbon_g || 0), 0), water: cA.reduce((s, c) => s + (c.water_l || 0), 0), esg: computeProductESGScore(cA), circular: computeCircularScore(pA), conflict: cA.filter(c => c.conflict_mineral).length * 20, materials: cA.length * 5 };
    const tB = { carbon: cB.reduce((s, c) => s + (c.carbon_g || 0), 0), water: cB.reduce((s, c) => s + (c.water_l || 0), 0), esg: computeProductESGScore(cB), circular: computeCircularScore(pB), conflict: cB.filter(c => c.conflict_mineral).length * 20, materials: cB.length * 5 };
    const maxCarbon = Math.max(tA.carbon, tB.carbon) || 1;
    const maxWater = Math.max(tA.water, tB.water) || 1;
    return [
      { dim: 'ESG Risk', A: tA.esg, B: tB.esg },
      { dim: 'Carbon', A: Math.round(tA.carbon / maxCarbon * 100), B: Math.round(tB.carbon / maxCarbon * 100) },
      { dim: 'Water', A: Math.round(tA.water / maxWater * 100), B: Math.round(tB.water / maxWater * 100) },
      { dim: 'Circular', A: tA.circular, B: tB.circular },
      { dim: 'Conflict', A: Math.min(100, tA.conflict), B: Math.min(100, tB.conflict) },
      { dim: 'Complexity', A: Math.min(100, tA.materials), B: Math.min(100, tB.materials) },
    ];
  }, [product, compareProduct, showCompare]);

  // All products ESG ranking
  const allProductsRanked = useMemo(() => {
    return PRODUCT_KEYS.map(k => {
      const p = PRODUCT_ANATOMY[k];
      const c = p.components || [];
      return {
        key: k, name: p.name, icon: p.icon, price: p.retail_price, category: p.category, lifespan: p.lifespan_years,
        esgScore: computeProductESGScore(c), circularScore: computeCircularScore(p),
        carbon: c.reduce((s, x) => s + (x.carbon_g || 0), 0), water: c.reduce((s, x) => s + (x.water_l || 0), 0),
        materials: c.length, conflict: c.filter(x => x.conflict_mineral).length,
        hasAlt: !!p.sustainable_alt,
      };
    }).sort((a, b) => b.esgScore - a.esgScore);
  }, []);

  const exportCSV=()=>{
    const hdr=['Material','Component','Quantity (g)','Cost (USD)','% of Cost','Source Countries','ESG Risk','Carbon (g)','Water (L)','Child Labor','Conflict Mineral','Recyclable'];
    const rows=comps.map(c=>[c.material,c.component,c.quantity_g,c.cost_usd,c.pct_of_cost,c.source_countries?.join('; '),c.esg_risk||'',c.carbon_g||'',c.water_l||'',c.child_labor_risk||'',c.conflict_mineral?'Yes':'No',c.recyclable?'Yes':'No']);
    const csv=[hdr,...rows].map(r=>r.join(',')).join('\n');
    const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`product_anatomy_${selectedProduct}.csv`;a.click();URL.revokeObjectURL(u);
  };
  const exportJSON=()=>{
    const b=new Blob([JSON.stringify({product:product.name,esgScore:productESGScore,circularScore,components:comps,externalities:product.externalities,end_of_life:product.end_of_life,sustainable_alt:product.sustainable_alt||null},null,2)],{type:'application/json'});
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
            <p style={{fontSize:13,color:T.textSec,margin:'6px 0 10px'}}>3-Dimensional Decomposition Engine {'\u2014'} Finance {'\u00D7'} ESG {'\u00D7'} Climate Impact of Every Material</p>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <Badge label={`${PRODUCT_KEYS.length} Products`} color="blue"/>
              <Badge label="Material Decomposition" color="green"/>
              <Badge label="Product ESG Score" color="purple"/>
              <Badge label="Sustainable Alternatives" color="teal"/>
              <Badge label="Circular Economy" color="amber"/>
              <Badge label="EP-Y9" color="gray"/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={exportCSV} small>CSV Export</Btn>
            <Btn onClick={exportJSON} small>JSON Report</Btn>
            <Btn onClick={()=>window.print()} small>Print</Btn>
          </div>
        </div>

        {/* PRODUCT SELECTOR */}
        <Section title="Product Selector" badge={`${PRODUCT_KEYS.length} Products`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140,1fr))',gap:10}}>
            {PRODUCT_KEYS.map(k=>{const p=PRODUCT_ANATOMY[k];return(
              <div key={k} onClick={()=>setSelectedProduct(k)} style={{padding:'12px 10px',background:selectedProduct===k?`${T.navy}10`:T.surface,border:`2px solid ${selectedProduct===k?T.navy:T.border}`,borderRadius:10,cursor:'pointer',textAlign:'center',transition:'all .15s'}}>
                <div style={{fontSize:24}}>{p.icon}</div>
                <div style={{fontSize:10,fontWeight:700,color:T.navy,marginTop:4,lineHeight:1.2}}>{p.name}</div>
                <div style={{fontSize:11,fontWeight:600,color:T.gold,marginTop:2}}>{fmtUSD(p.retail_price)}</div>
              </div>
            )})}
          </div>
        </Section>

        {/* KPIs */}
        <Section title={`${product.name} ${'\u2014'} Key Metrics`} badge={`${product.icon} ${product.category}`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
            <KPI label="Retail Price" value={fmtUSD(product.retail_price)} color={T.navy}/>
            <KPI label="Product ESG Score" value={`${productESGScore}/100`} sub="weighted by cost share" color={esgColor(productESGScore)}/>
            <KPI label="Circular Score" value={`${circularScore}/100`} color={circularScore>60?T.green:circularScore>30?T.amber:T.red}/>
            <KPI label="Materials Count" value={comps.length} sub="unique materials"/>
            <KPI label="Conflict Minerals" value={totals.conflict} color={totals.conflict>0?T.red:T.green} sub="3TG flagged"/>
            <KPI label="Child Labor Risk" value={totals.childLabor} color={totals.childLabor>0?T.red:T.green} sub="components exposed"/>
            <KPI label="Total Carbon" value={`${fmt(totals.carbon/1000,1)} kg`} color={T.amber} sub="cradle-to-gate"/>
            <KPI label="Water Footprint" value={fmtL(totals.water)} color={T.navyL}/>
            <KPI label="Externality Cost" value={fmtUSD(totals.extCost)} sub="carbon + water" color={T.red}/>
            <KPI label="TRUE Cost" value={fmtUSD(totals.trueCost)} sub={`+${Math.round(totals.extCost/(product.retail_price||1)*100)}% hidden`} color={T.red}/>
          </div>
        </Section>

        {/* SUSTAINABLE ALTERNATIVE */}
        {product.sustainable_alt && (
          <Section title="Sustainable Alternative Finder" badge="Lower-impact option available">
            <Card style={{borderLeft:`4px solid ${T.green}`}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:20}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:T.green}}>{product.sustainable_alt.name}</div>
                  <div style={{fontSize:12,color:T.textSec,marginTop:8}}>{product.sustainable_alt.benefit}</div>
                  <div style={{fontSize:12,color:T.amber,fontWeight:600,marginTop:8}}>Price Premium: {product.sustainable_alt.price_premium}</div>
                </div>
                <div style={{display:'flex',gap:16,alignItems:'center'}}>
                  <div style={{flex:1,textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                    <div style={{fontSize:10,color:T.textMut,fontWeight:600}}>CURRENT</div>
                    <div style={{fontSize:11,fontWeight:700,color:T.navy,marginTop:4}}>{product.name}</div>
                    <div style={{fontSize:18,fontWeight:800,color:esgColor(productESGScore),marginTop:4}}>ESG: {productESGScore}</div>
                  </div>
                  <div style={{fontSize:20,color:T.green,fontWeight:800}}>{'\u2192'}</div>
                  <div style={{flex:1,textAlign:'center',padding:12,background:`${T.green}10`,borderRadius:8,border:`1px solid ${T.green}30`}}>
                    <div style={{fontSize:10,color:T.green,fontWeight:600}}>ALTERNATIVE</div>
                    <div style={{fontSize:11,fontWeight:700,color:T.navy,marginTop:4}}>{product.sustainable_alt.name}</div>
                    <div style={{fontSize:18,fontWeight:800,color:T.green,marginTop:4}}>Lower Impact</div>
                  </div>
                </div>
              </div>
            </Card>
          </Section>
        )}

        {/* ANATOMY VISUAL */}
        <Section title="Anatomy Visual" badge={viewMode==='weight'?'By Weight':'By Cost'}>
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

        {/* DETAIL PANEL */}
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

        {/* SORTABLE TABLE */}
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

        {/* CLIMATE BARS */}
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

        {/* HIDDEN COST CALCULATOR */}
        <Section title="Hidden Cost Calculator" badge="Externality Pricing">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:16}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:6}}>Carbon Externality Price ($/tonne CO{'\u2082'}e)</div>
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
              <KPI label="Carbon Externality" value={fmtUSD((totals.carbon/1000)*carbonExtSlider)} sub={`${fmt(totals.carbon/1000,1)} kg ${'\u00D7'} $${carbonExtSlider}/t`} color={T.amber}/>
              <KPI label="Water Externality" value={fmtUSD(totals.water*waterExtSlider/1000)} sub={`${fmtL(totals.water)} ${'\u00D7'} $${waterExtSlider}/kL`} color={T.navyL}/>
              <KPI label="TRUE Cost" value={fmtUSD(totals.trueCost)} sub={`+${Math.round(totals.extCost/(product.retail_price||1)*100)}% hidden costs`} color={T.red}/>
            </div>
          </Card>
        </Section>

        {/* END OF LIFE */}
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

        {/* PRODUCT ESG RANKING */}
        <Section title="All Products ESG Ranking" badge={`${PRODUCT_KEYS.length} products ranked`}>
          <Card style={{overflowX:'auto',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <TH>Rank</TH><TH>Product</TH><TH>Category</TH><TH>Price</TH><TH>ESG Score</TH><TH>Circular</TH><TH>Carbon (kg)</TH><TH>Water (L)</TH><TH>Materials</TH><TH>Conflict</TH><TH>Alt?</TH>
              </tr></thead>
              <tbody>
                {allProductsRanked.map((p,i)=>(
                  <tr key={p.key} onClick={()=>setSelectedProduct(p.key)} style={{cursor:'pointer',background:selectedProduct===p.key?`${T.navy}08`:i%2?T.surfaceH:'transparent'}}>
                    <TD style={{fontWeight:700,textAlign:'center'}}>#{i+1}</TD>
                    <TD style={{fontWeight:600}}>{p.icon} {p.name}</TD>
                    <TD style={{fontSize:11}}>{p.category}</TD>
                    <TD>{fmtUSD(p.price)}</TD>
                    <TD><span style={{fontWeight:700,color:esgColor(p.esgScore)}}>{p.esgScore}</span></TD>
                    <TD><span style={{fontWeight:700,color:p.circularScore>60?T.green:p.circularScore>30?T.amber:T.red}}>{p.circularScore}</span></TD>
                    <TD>{fmt(p.carbon/1000,1)}</TD>
                    <TD>{fmtL(p.water)}</TD>
                    <TD style={{textAlign:'center'}}>{p.materials}</TD>
                    <TD style={{textAlign:'center',color:p.conflict>0?T.red:T.green,fontWeight:700}}>{p.conflict}</TD>
                    <TD>{p.hasAlt?<Badge label="Alt" color="green"/>:'\u2014'}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* COMPARISON MODE */}
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
              const rows=[{label:'Retail Price',a:fmtUSD(pA.retail_price),b:fmtUSD(pB.retail_price)},{label:'ESG Score',a:computeProductESGScore(cA),b:computeProductESGScore(cB)},{label:'Circular Score',a:computeCircularScore(pA),b:computeCircularScore(pB)},{label:'Materials',a:cA.length,b:cB.length},{label:'Carbon (kg)',a:fmt(tA.carbon/1000,1),b:fmt(tB.carbon/1000,1)},{label:'Water (L)',a:fmtL(tA.water),b:fmtL(tB.water)},{label:'Conflict Minerals',a:tA.conflict,b:tB.conflict},{label:'Child Labor Risk',a:tA.childLabor,b:tB.childLabor},{label:'Lifespan (yr)',a:pA.lifespan_years,b:pB.lifespan_years},{label:'Recycled %',a:`${pA.end_of_life?.recycled_pct||0}%`,b:`${pB.end_of_life?.recycled_pct||0}%`}];
              return(
                <div>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr><TH>Metric</TH><TH>{pA.icon} {pA.name}</TH><TH>{pB.icon} {pB.name}</TH></tr></thead>
                    <tbody>{rows.map((r,i)=><tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}><TD style={{fontWeight:600}}>{r.label}</TD><TD>{r.a}</TD><TD>{r.b}</TD></tr>)}</tbody>
                  </table>
                  {radarCompareData.length > 0 && (
                    <div style={{marginTop:16}}>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarCompareData}>
                          <PolarGrid stroke={T.border}/>
                          <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
                          <PolarRadiusAxis domain={[0,100]} tick={false}/>
                          <Radar name={pA.name} dataKey="A" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2}/>
                          <Radar name={pB.name} dataKey="B" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeWidth={2}/>
                          <Legend/>
                          <Tooltip/>
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })()}
          </Card>
        </Section>

        {/* PORTFOLIO LINKAGE */}
        <Section title="Portfolio Company Linkage" badge={`${portfolio.length} Holdings`}>
          <Card style={{overflowX:'auto',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><TH>Company</TH><TH>Sector</TH><TH>Relevant Products</TH><TH>Exposure</TH></tr></thead>
              <tbody>
                {portfolio.slice(0,15).map((co,i)=>{
                  const s=co.sector||co.gics_sector||'';
                  const prods=PRODUCT_KEYS.filter(k=>{const p=PRODUCT_ANATOMY[k];return(s.includes('Tech')&&p.category==='Electronics')||(s.includes('Energy')&&p.category==='Energy')||(s.includes('Consumer')&&(p.category==='Textiles'||p.category==='Food'||p.category==='Consumer Goods'))||(s.includes('Material')&&p.category==='Construction')||(s.includes('Health')&&p.category==='Healthcare')||(s.includes('Industrial')&&(p.category==='Appliances'||p.category==='Industrial'||p.category==='Transport'))});
                  return(
                    <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                      <TD style={{fontWeight:600}}>{co.name||co.company_name}</TD>
                      <TD>{s}</TD>
                      <TD style={{fontSize:11}}>{prods.map(k=>PRODUCT_ANATOMY[k].icon+' '+PRODUCT_ANATOMY[k].name.slice(0,18)).join(', ')||'\u2014'}</TD>
                      <TD>{prods.length>0?<Badge label={`${prods.length} products`} color={prods.length>2?'amber':'blue'}/>:'\u2014'}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* CROSS-NAV */}
        <Section title="Related Modules">
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[
              {label:'Commodity Intelligence',path:'/commodity-intelligence'},
              {label:'Supply Chain Carbon',path:'/supply-chain-carbon'},
              {label:'Multi-Factor Integration (Y7)',path:'/multi-factor-integration'},
              {label:'EPD & LCA Database',path:'/epd-lca-database'},
              {label:'CSDDD Compliance',path:'/csddd-compliance'},
              {label:'Deforestation Risk',path:'/deforestation-risk'},
            ].map(m=>(
              <Btn key={m.path} onClick={()=>navigate(m.path)} style={{background:T.surfaceH}}>{m.label} &rarr;</Btn>
            ))}
          </div>
        </Section>

        <div style={{textAlign:'center',padding:'20px 0',borderTop:`1px solid ${T.border}`,marginTop:20}}>
          <span style={{fontSize:11,color:T.textMut}}>Product Anatomy: 3-Dimensional Decomposition Engine | EP-Y9 | {PRODUCT_KEYS.length} Products | Finance {'\u00D7'} ESG {'\u00D7'} Climate | Sprint Y</span>
        </div>
      </div>
    </div>
  );
}
