import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  AreaChart, Area, LineChart, Line, PieChart, Pie, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ================================================================= THEME */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif"};
const CAT_COLORS=['#16a34a','#dc2626','#7c3aed','#d97706','#6b7280','#c5a96a','#06b6d4','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#6366f1'];

/* ================================================================= DATA: 120 COMMODITIES */
const COMMODITY_UNIVERSE = {
  carbon:{name:'Carbon Markets',color:'#16a34a',icon:'🌿',commodities:[
    {id:'EUA',name:'EU ETS Carbon (EUA)',unit:'EUR/tCO\u2082e',price:88.50,ytd_change:12.5,eodhd_ticker:'EUA.COMM',category:'Compliance',global_volume_mt:1400,description:'EU Emissions Trading System allowance',vintage_2020:25.0,vintage_2021:52.0,vintage_2022:80.0,vintage_2023:85.0,vintage_2024:88.5,supply_mt:1400,demand_mt:1350,balance_mt:50,vol_30d:18.2},
    {id:'UKA',name:'UK ETS Carbon (UKA)',unit:'GBP/tCO\u2082e',price:42.30,ytd_change:-5.2,category:'Compliance',global_volume_mt:120,vintage_2023:48.0,vintage_2024:42.3,supply_mt:120,demand_mt:115,balance_mt:5,vol_30d:22.1},
    {id:'CCA',name:'California Carbon (CCA)',unit:'USD/tCO\u2082e',price:38.50,ytd_change:8.1,category:'Compliance',global_volume_mt:320,vintage_2023:35.0,vintage_2024:38.5,supply_mt:320,demand_mt:310,balance_mt:10,vol_30d:12.5},
    {id:'CEA',name:'China ETS (CEA)',unit:'CNY/tCO\u2082e',price:92.00,ytd_change:45.0,category:'Compliance',global_volume_mt:4500,vintage_2023:65.0,vintage_2024:92.0,supply_mt:4500,demand_mt:4200,balance_mt:300,vol_30d:28.3},
    {id:'VCU',name:'Voluntary Carbon (VCU/VER)',unit:'USD/tCO\u2082e',price:8.50,ytd_change:-32.0,category:'Voluntary',global_volume_mt:250,vintage_2020:5.80,vintage_2021:8.20,vintage_2022:12.50,vintage_2023:11.00,vintage_2024:8.50,supply_mt:300,demand_mt:250,balance_mt:50,vol_30d:35.0},
    {id:'REC',name:'Renewable Energy Certificates',unit:'USD/MWh',price:2.80,ytd_change:5.0,category:'Certificates',global_volume_mt:0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:8.5},
    {id:'RGGI',name:'RGGI Carbon Allowance',unit:'USD/tCO\u2082e',price:14.20,ytd_change:3.5,category:'Compliance',global_volume_mt:85,supply_mt:85,demand_mt:82,balance_mt:3,vol_30d:10.2},
    {id:'NZU',name:'NZ ETS (NZU)',unit:'NZD/tCO\u2082e',price:55.00,ytd_change:-18.0,category:'Compliance',global_volume_mt:35,supply_mt:35,demand_mt:30,balance_mt:5,vol_30d:20.5},
    {id:'KCER',name:'Korea ETS (KAU)',unit:'KRW/tCO\u2082e',price:8500,ytd_change:5.0,category:'Compliance',global_volume_mt:590,supply_mt:590,demand_mt:570,balance_mt:20,vol_30d:15.0},
    {id:'CORSIA',name:'CORSIA (Aviation Offsets)',unit:'USD/tCO\u2082e',price:5.20,ytd_change:12.0,category:'Compliance',global_volume_mt:180,supply_mt:200,demand_mt:180,balance_mt:20,vol_30d:25.0},
    {id:'BIO_CREDIT',name:'Biodiversity Credits',unit:'USD/credit',price:35.00,ytd_change:55.0,category:'Voluntary',global_volume_mt:2,supply_mt:2,demand_mt:3,balance_mt:-1,vol_30d:45.0},
    {id:'PLASTIC_CREDIT',name:'Plastic Credits',unit:'USD/tonne',price:22.00,ytd_change:28.0,category:'Voluntary',global_volume_mt:8,supply_mt:8,demand_mt:10,balance_mt:-2,vol_30d:30.0},
  ]},
  energy:{name:'Energy',color:'#dc2626',icon:'\u26FD',commodities:[
    {id:'WTI',name:'WTI Crude Oil',unit:'USD/bbl',price:72.50,ytd_change:-8.5,eodhd_ticker:'CL.COMM',av_function:'WTI',global_production:'80M bbl/day',reserves_years:47,stranded_risk:'High',supply_mt:4000,demand_mt:4050,balance_mt:-50,vol_30d:22.5},
    {id:'BRENT',name:'Brent Crude',unit:'USD/bbl',price:76.80,ytd_change:-7.2,eodhd_ticker:'BZ.COMM',av_function:'BRENT',supply_mt:4000,demand_mt:4050,balance_mt:-50,vol_30d:21.8},
    {id:'NG',name:'Natural Gas (Henry Hub)',unit:'USD/MMBtu',price:2.85,ytd_change:15.3,eodhd_ticker:'NG.COMM',av_function:'NATURAL_GAS',supply_mt:950,demand_mt:920,balance_mt:30,vol_30d:35.2},
    {id:'COAL',name:'Thermal Coal (Newcastle)',unit:'USD/t',price:135.00,ytd_change:-22.5,stranded_risk:'Very High',supply_mt:8200,demand_mt:8100,balance_mt:100,vol_30d:28.0},
    {id:'LNG',name:'LNG (Japan-Korea Marker)',unit:'USD/MMBtu',price:12.50,ytd_change:8.0,supply_mt:410,demand_mt:400,balance_mt:10,vol_30d:30.5},
    {id:'URANIUM',name:'Uranium (U3O8)',unit:'USD/lb',price:85.00,ytd_change:45.0,supply_mt:60,demand_mt:65,balance_mt:-5,vol_30d:18.0},
    {id:'HEATING_OIL',name:'Heating Oil',unit:'USD/gal',price:2.65,ytd_change:-12.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:20.0},
    {id:'GASOLINE',name:'RBOB Gasoline',unit:'USD/gal',price:2.45,ytd_change:-5.0,eodhd_ticker:'RB.COMM',supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:19.5},
    {id:'DIESEL',name:'Ultra-Low Sulfur Diesel',unit:'USD/gal',price:2.75,ytd_change:-10.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:21.0},
    {id:'ETHANOL',name:'Ethanol',unit:'USD/gal',price:1.65,ytd_change:3.0,supply_mt:110,demand_mt:105,balance_mt:5,vol_30d:15.5},
    {id:'TTF_GAS',name:'TTF Natural Gas (EU)',unit:'EUR/MWh',price:32.00,ytd_change:-15.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:38.0},
    {id:'JKM_LNG',name:'JKM LNG (Asia)',unit:'USD/MMBtu',price:13.20,ytd_change:10.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:32.0},
    {id:'PROPANE',name:'Propane',unit:'USD/gal',price:0.78,ytd_change:-8.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:16.0},
    {id:'NAPHTHA',name:'Naphtha',unit:'USD/t',price:620.00,ytd_change:-5.5,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:17.0},
    {id:'COKING_COAL',name:'Coking Coal (Premium)',unit:'USD/t',price:215.00,ytd_change:-18.0,stranded_risk:'High',supply_mt:1100,demand_mt:1050,balance_mt:50,vol_30d:25.0},
    {id:'GREEN_H2',name:'Green Hydrogen',unit:'USD/kg',price:4.50,ytd_change:-15.0,supply_mt:0.8,demand_mt:1.2,balance_mt:-0.4,vol_30d:12.0},
    {id:'GREY_H2',name:'Grey Hydrogen',unit:'USD/kg',price:1.50,ytd_change:2.0,supply_mt:90,demand_mt:88,balance_mt:2,vol_30d:8.0},
    {id:'AMMONIA_GREEN',name:'Green Ammonia',unit:'USD/t',price:800.00,ytd_change:5.0,supply_mt:0.5,demand_mt:0.8,balance_mt:-0.3,vol_30d:15.0},
  ]},
  critical_minerals:{name:'Critical Minerals',color:'#7c3aed',icon:'\u26A1',commodities:[
    {id:'LITHIUM',name:'Lithium Carbonate',unit:'USD/t',price:12500,ytd_change:-65.0,ev_relevance:'Battery cathode',top_producers:['AU','CL','CN','AR'],supply_risk:'High',supply_mt:130,demand_mt:120,balance_mt:10,vol_30d:42.0},
    {id:'COBALT',name:'Cobalt',unit:'USD/t',price:28000,ytd_change:-15.0,ev_relevance:'Battery cathode',top_producers:['CD','AU','PH'],supply_risk:'Very High',child_labor_risk:'Critical (DRC)',supply_mt:190,demand_mt:180,balance_mt:10,vol_30d:25.0},
    {id:'NICKEL',name:'Nickel',unit:'USD/t',price:16200,ytd_change:-10.5,eodhd_ticker:'NI.COMM',ev_relevance:'Battery cathode (NMC)',supply_mt:3300,demand_mt:3200,balance_mt:100,vol_30d:22.0},
    {id:'COPPER',name:'Copper',unit:'USD/t',price:8950,ytd_change:5.2,eodhd_ticker:'HG.COMM',av_function:'COPPER',ev_relevance:'Wiring, motors, grid',supply_mt:22000,demand_mt:25000,balance_mt:-3000,vol_30d:18.5},
    {id:'RARE_EARTH',name:'Rare Earth Elements',unit:'USD/kg (avg)',price:42.00,ytd_change:-18.0,ev_relevance:'Magnets for EVs and wind turbines',top_producers:['CN (60%)','MM','AU'],supply_risk:'Very High',geopolitical_risk:'China dominance',supply_mt:300,demand_mt:280,balance_mt:20,vol_30d:20.0},
    {id:'GRAPHITE',name:'Graphite',unit:'USD/t',price:650,ytd_change:-8.0,ev_relevance:'Battery anode',supply_mt:1100,demand_mt:1050,balance_mt:50,vol_30d:15.0},
    {id:'SILICON',name:'Silicon (polysilicon)',unit:'USD/kg',price:8.50,ytd_change:-25.0,ev_relevance:'Solar panels',supply_mt:800,demand_mt:750,balance_mt:50,vol_30d:30.0},
    {id:'MANGANESE',name:'Manganese',unit:'USD/t',price:4.80,ytd_change:-12.0,ev_relevance:'Battery cathode (LMFP)',top_producers:['ZA','AU','GA','CN'],supply_risk:'Medium',supply_mt:20000,demand_mt:19000,balance_mt:1000,vol_30d:18.0},
    {id:'VANADIUM',name:'Vanadium',unit:'USD/lb',price:8.20,ytd_change:15.0,ev_relevance:'Vanadium redox flow batteries',supply_risk:'High',supply_mt:100,demand_mt:95,balance_mt:5,vol_30d:22.0},
    {id:'GALLIUM',name:'Gallium',unit:'USD/kg',price:280.00,ytd_change:-20.0,ev_relevance:'Semiconductors, LEDs',top_producers:['CN (98%)'],supply_risk:'Very High',geopolitical_risk:'China export controls',supply_mt:0.4,demand_mt:0.35,balance_mt:0.05,vol_30d:25.0},
    {id:'GERMANIUM',name:'Germanium',unit:'USD/kg',price:1850.00,ytd_change:10.0,ev_relevance:'Fiber optics, IR optics',top_producers:['CN (60%)'],supply_risk:'Very High',supply_mt:0.13,demand_mt:0.12,balance_mt:0.01,vol_30d:20.0},
    {id:'INDIUM',name:'Indium',unit:'USD/kg',price:250.00,ytd_change:-8.0,ev_relevance:'ITO coatings, displays',supply_risk:'High',supply_mt:0.9,demand_mt:0.85,balance_mt:0.05,vol_30d:18.0},
    {id:'TELLURIUM',name:'Tellurium',unit:'USD/kg',price:75.00,ytd_change:20.0,ev_relevance:'CdTe solar cells',supply_risk:'High',supply_mt:0.5,demand_mt:0.6,balance_mt:-0.1,vol_30d:22.0},
    {id:'TUNGSTEN',name:'Tungsten',unit:'USD/mtu',price:335.00,ytd_change:8.0,top_producers:['CN (80%)','VN','RU'],supply_risk:'Very High',supply_mt:84,demand_mt:80,balance_mt:4,vol_30d:12.0},
    {id:'MOLYBDENUM',name:'Molybdenum',unit:'USD/lb',price:22.00,ytd_change:15.0,supply_mt:300,demand_mt:290,balance_mt:10,vol_30d:16.0},
    {id:'TANTALUM',name:'Tantalum',unit:'USD/lb',price:85.00,ytd_change:5.0,supply_risk:'High',supply_mt:2,demand_mt:1.8,balance_mt:0.2,vol_30d:14.0,conflict_mineral:true},
    {id:'NIOBIUM',name:'Niobium',unit:'USD/kg',price:42.00,ytd_change:3.0,top_producers:['BR (90%)'],supply_risk:'High',supply_mt:75,demand_mt:72,balance_mt:3,vol_30d:10.0},
    {id:'LITHIUM_HYDROXIDE',name:'Lithium Hydroxide',unit:'USD/t',price:14200,ytd_change:-60.0,ev_relevance:'High-nickel battery cathode',supply_mt:85,demand_mt:80,balance_mt:5,vol_30d:40.0},
    {id:'SPODUMENE',name:'Spodumene Concentrate',unit:'USD/t',price:1050,ytd_change:-72.0,ev_relevance:'Lithium feedstock',supply_mt:65,demand_mt:60,balance_mt:5,vol_30d:45.0},
  ]},
  agricultural_deforestation:{name:'Agricultural (EUDR)',color:'#d97706',icon:'🌾',commodities:[
    {id:'PALM_OIL',name:'Palm Oil',unit:'USD/t',price:850,ytd_change:12.0,deforestation_risk:'Very High',eudr_regulated:true,top_producers:['ID','MY'],annual_deforestation_ha:680000,supply_mt:77000,demand_mt:75000,balance_mt:2000,vol_30d:18.0},
    {id:'SOY',name:'Soybean',unit:'USD/bushel',price:10.25,ytd_change:-5.0,eodhd_ticker:'ZS.COMM',deforestation_risk:'High',eudr_regulated:true,top_producers:['BR','US','AR'],supply_mt:395000,demand_mt:380000,balance_mt:15000,vol_30d:15.0},
    {id:'COCOA',name:'Cocoa',unit:'USD/t',price:8500,ytd_change:120.0,deforestation_risk:'High',eudr_regulated:true,child_labor_risk:'High',top_producers:['CI','GH','ID'],supply_mt:5200,demand_mt:5400,balance_mt:-200,vol_30d:38.0},
    {id:'COFFEE',name:'Coffee (Arabica)',unit:'USD/lb',price:3.85,ytd_change:55.0,eodhd_ticker:'KC.COMM',eudr_regulated:true,top_producers:['BR','VN','CO'],supply_mt:10500,demand_mt:10800,balance_mt:-300,vol_30d:28.0},
    {id:'RUBBER',name:'Natural Rubber',unit:'USD/t',price:1650,ytd_change:8.0,deforestation_risk:'High',eudr_regulated:true,supply_mt:14000,demand_mt:13500,balance_mt:500,vol_30d:16.0},
    {id:'TIMBER',name:'Timber/Wood',unit:'USD/1000 bf',price:520,ytd_change:-15.0,eudr_regulated:true,supply_mt:4000000,demand_mt:3800000,balance_mt:200000,vol_30d:25.0},
    {id:'CATTLE',name:'Live Cattle',unit:'USD/cwt',price:195,ytd_change:18.0,eodhd_ticker:'LE.COMM',deforestation_risk:'Very High',eudr_regulated:true,supply_mt:72000,demand_mt:70000,balance_mt:2000,vol_30d:14.0},
    {id:'COFFEE_ROBUSTA',name:'Coffee (Robusta)',unit:'USD/t',price:5200,ytd_change:80.0,eudr_regulated:true,top_producers:['VN','BR','ID'],supply_mt:4800,demand_mt:5000,balance_mt:-200,vol_30d:30.0},
    {id:'SOY_OIL',name:'Soybean Oil',unit:'USD/lb',price:0.42,ytd_change:5.0,deforestation_risk:'High',supply_mt:62000,demand_mt:60000,balance_mt:2000,vol_30d:16.0},
    {id:'SOY_MEAL',name:'Soybean Meal',unit:'USD/t',price:320,ytd_change:-8.0,supply_mt:260000,demand_mt:255000,balance_mt:5000,vol_30d:14.0},
    {id:'CANOLA',name:'Canola / Rapeseed',unit:'CAD/t',price:620,ytd_change:-10.0,supply_mt:87000,demand_mt:85000,balance_mt:2000,vol_30d:18.0},
    {id:'SUNFLOWER',name:'Sunflower Oil',unit:'USD/t',price:920,ytd_change:-12.0,supply_mt:21000,demand_mt:20000,balance_mt:1000,vol_30d:20.0},
  ]},
  metals:{name:'Industrial Metals',color:'#6b7280',icon:'🔩',commodities:[
    {id:'STEEL',name:'Steel (HRC)',unit:'USD/t',price:680,ytd_change:-12.0,green_premium:25,h2_steel_price:850,supply_mt:1900000,demand_mt:1850000,balance_mt:50000,vol_30d:15.0},
    {id:'ALUMINUM',name:'Aluminum',unit:'USD/t',price:2350,ytd_change:3.5,eodhd_ticker:'AL.COMM',green_premium:15,supply_mt:70000,demand_mt:69000,balance_mt:1000,vol_30d:14.0},
    {id:'IRON_ORE',name:'Iron Ore (62% Fe)',unit:'USD/t',price:110,ytd_change:-18.0,eodhd_ticker:'TIO.COMM',supply_mt:2400000,demand_mt:2300000,balance_mt:100000,vol_30d:22.0},
    {id:'ZINC',name:'Zinc',unit:'USD/t',price:2750,ytd_change:8.0,supply_mt:14000,demand_mt:13800,balance_mt:200,vol_30d:16.0},
    {id:'TIN',name:'Tin',unit:'USD/t',price:28000,ytd_change:12.0,supply_mt:380,demand_mt:400,balance_mt:-20,vol_30d:20.0},
    {id:'LEAD',name:'Lead',unit:'USD/t',price:2100,ytd_change:2.0,supply_mt:12000,demand_mt:11500,balance_mt:500,vol_30d:12.0},
    {id:'CHROMIUM',name:'Chromium (Ferrochrome)',unit:'USD/t',price:1350,ytd_change:-5.0,supply_mt:16000,demand_mt:15500,balance_mt:500,vol_30d:14.0},
    {id:'TITANIUM',name:'Titanium Sponge',unit:'USD/t',price:12000,ytd_change:8.0,supply_mt:220,demand_mt:210,balance_mt:10,vol_30d:10.0},
    {id:'MAGNESIUM',name:'Magnesium',unit:'USD/t',price:2800,ytd_change:-15.0,top_producers:['CN (85%)'],supply_risk:'High',supply_mt:1100,demand_mt:1050,balance_mt:50,vol_30d:18.0},
    {id:'ANTIMONY',name:'Antimony',unit:'USD/t',price:25000,ytd_change:60.0,top_producers:['CN (55%)'],supply_risk:'Very High',geopolitical_risk:'China export controls',supply_mt:83,demand_mt:90,balance_mt:-7,vol_30d:35.0},
    {id:'BISMUTH',name:'Bismuth',unit:'USD/lb',price:6.50,ytd_change:10.0,supply_mt:18,demand_mt:16,balance_mt:2,vol_30d:12.0},
    {id:'STAINLESS_STEEL',name:'Stainless Steel (304)',unit:'USD/t',price:2450,ytd_change:-5.0,supply_mt:58000,demand_mt:56000,balance_mt:2000,vol_30d:14.0},
  ]},
  precious:{name:'Precious Metals',color:'#c5a96a',icon:'🥇',commodities:[
    {id:'GOLD',name:'Gold',unit:'USD/oz',price:2650,ytd_change:28.0,eodhd_ticker:'GC.COMM',av_function:'GOLD',supply_mt:3.6,demand_mt:4.9,balance_mt:-1.3,vol_30d:12.0},
    {id:'SILVER',name:'Silver',unit:'USD/oz',price:31.50,ytd_change:32.0,eodhd_ticker:'SI.COMM',av_function:'SILVER',supply_mt:26,demand_mt:30,balance_mt:-4,vol_30d:22.0},
    {id:'PLATINUM',name:'Platinum',unit:'USD/oz',price:985,ytd_change:-5.0,ev_relevance:'Fuel cell catalysts',supply_mt:0.19,demand_mt:0.24,balance_mt:-0.05,vol_30d:18.0},
    {id:'PALLADIUM',name:'Palladium',unit:'USD/oz',price:1050,ytd_change:-22.0,ev_relevance:'Catalytic converters',supply_mt:0.21,demand_mt:0.28,balance_mt:-0.07,vol_30d:25.0},
    {id:'RHODIUM',name:'Rhodium',unit:'USD/oz',price:4800,ytd_change:-35.0,ev_relevance:'Autocatalysts',supply_mt:0.025,demand_mt:0.03,balance_mt:-0.005,vol_30d:30.0},
    {id:'IRIDIUM',name:'Iridium',unit:'USD/oz',price:4900,ytd_change:5.0,ev_relevance:'PEM electrolyzers for H2',supply_mt:0.007,demand_mt:0.008,balance_mt:-0.001,vol_30d:15.0},
    {id:'RUTHENIUM',name:'Ruthenium',unit:'USD/oz',price:450,ytd_change:10.0,supply_mt:0.03,demand_mt:0.028,balance_mt:0.002,vol_30d:18.0},
  ]},
  water_food:{name:'Water & Food',color:'#06b6d4',icon:'💧',commodities:[
    {id:'WHEAT',name:'Wheat',unit:'USD/bushel',price:5.85,ytd_change:-10.0,eodhd_ticker:'ZW.COMM',food_security:'Critical',climate_sensitivity:'Very High',supply_mt:800000,demand_mt:795000,balance_mt:5000,vol_30d:20.0},
    {id:'CORN',name:'Corn',unit:'USD/bushel',price:4.35,ytd_change:-8.0,eodhd_ticker:'ZC.COMM',food_security:'Critical',supply_mt:1200000,demand_mt:1180000,balance_mt:20000,vol_30d:18.0},
    {id:'RICE',name:'Rice',unit:'USD/cwt',price:15.20,ytd_change:5.0,food_security:'Critical',populations_dependent:'3.5B',supply_mt:520000,demand_mt:515000,balance_mt:5000,vol_30d:12.0},
    {id:'SUGAR',name:'Sugar',unit:'USD/lb',price:0.22,ytd_change:-15.0,eodhd_ticker:'SB.COMM',supply_mt:185000,demand_mt:180000,balance_mt:5000,vol_30d:22.0},
    {id:'COTTON',name:'Cotton',unit:'USD/lb',price:0.72,ytd_change:-5.0,water_intensity:'Very High',labor_risk:'High (Uzbekistan/Xinjiang)',supply_mt:25000,demand_mt:24500,balance_mt:500,vol_30d:16.0},
    {id:'ORANGE_JUICE',name:'Orange Juice (FCOJ)',unit:'USD/lb',price:4.80,ytd_change:85.0,climate_sensitivity:'Very High',supply_mt:1600,demand_mt:1700,balance_mt:-100,vol_30d:35.0},
    {id:'OATS',name:'Oats',unit:'USD/bushel',price:3.50,ytd_change:-20.0,supply_mt:25000,demand_mt:24000,balance_mt:1000,vol_30d:22.0},
    {id:'BARLEY',name:'Barley',unit:'USD/t',price:220,ytd_change:-12.0,supply_mt:150000,demand_mt:145000,balance_mt:5000,vol_30d:16.0},
    {id:'LEAN_HOGS',name:'Lean Hogs',unit:'USD/cwt',price:82.00,ytd_change:8.0,eodhd_ticker:'HE.COMM',supply_mt:120000,demand_mt:118000,balance_mt:2000,vol_30d:20.0},
    {id:'FEEDER_CATTLE',name:'Feeder Cattle',unit:'USD/cwt',price:265.00,ytd_change:22.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:15.0},
    {id:'MILK',name:'Milk (Class III)',unit:'USD/cwt',price:18.50,ytd_change:5.0,supply_mt:540000,demand_mt:535000,balance_mt:5000,vol_30d:14.0},
    {id:'WATER_INDEX',name:'Water Futures (NQH2O)',unit:'USD/acre-foot',price:520.00,ytd_change:15.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:10.0},
    {id:'POTASH',name:'Potash (MOP)',unit:'USD/t',price:280,ytd_change:-25.0,supply_mt:43000,demand_mt:42000,balance_mt:1000,vol_30d:18.0},
    {id:'PHOSPHATE',name:'Phosphate Rock',unit:'USD/t',price:120,ytd_change:-15.0,supply_mt:240000,demand_mt:235000,balance_mt:5000,vol_30d:12.0},
    {id:'UREA',name:'Urea (Fertilizer)',unit:'USD/t',price:300,ytd_change:-20.0,supply_mt:190000,demand_mt:185000,balance_mt:5000,vol_30d:20.0},
    {id:'DAP',name:'DAP Fertilizer',unit:'USD/t',price:550,ytd_change:-10.0,supply_mt:70000,demand_mt:68000,balance_mt:2000,vol_30d:14.0},
    {id:'SORGHUM',name:'Sorghum',unit:'USD/bushel',price:4.50,ytd_change:-12.0,supply_mt:58000,demand_mt:57000,balance_mt:1000,vol_30d:16.0},
    {id:'FISHMEAL',name:'Fishmeal',unit:'USD/t',price:1850,ytd_change:10.0,supply_mt:5000,demand_mt:5200,balance_mt:-200,vol_30d:18.0},
    {id:'COCOA_BUTTER',name:'Cocoa Butter',unit:'USD/t',price:12000,ytd_change:100.0,supply_mt:1800,demand_mt:1900,balance_mt:-100,vol_30d:35.0},
    {id:'RAPESEED_OIL',name:'Rapeseed Oil',unit:'EUR/t',price:880,ytd_change:-8.0,supply_mt:28000,demand_mt:27000,balance_mt:1000,vol_30d:16.0},
    {id:'TEA',name:'Tea (Auction)',unit:'USD/kg',price:3.20,ytd_change:5.0,supply_mt:6500,demand_mt:6400,balance_mt:100,vol_30d:10.0},
    {id:'VANILLA',name:'Vanilla Beans',unit:'USD/kg',price:120,ytd_change:-35.0,top_producers:['MG (80%)'],supply_risk:'High',supply_mt:3,demand_mt:3.2,balance_mt:-0.2,vol_30d:40.0},
    {id:'PEPPER',name:'Black Pepper',unit:'USD/t',price:5200,ytd_change:45.0,supply_mt:550,demand_mt:580,balance_mt:-30,vol_30d:25.0},
    {id:'CASHEW',name:'Cashew Nuts',unit:'USD/lb',price:4.50,ytd_change:12.0,supply_mt:3600,demand_mt:3500,balance_mt:100,vol_30d:16.0},
  ]},
  construction:{name:'Construction',color:'#8b5cf6',icon:'🏗',commodities:[
    {id:'CEMENT',name:'Cement',unit:'USD/t',price:125,ytd_change:3.0,co2_per_tonne:0.62,eu_taxonomy_threshold:0.469,supply_mt:4200000,demand_mt:4100000,balance_mt:100000,vol_30d:8.0},
    {id:'SAND',name:'Sand & Gravel',unit:'USD/t',price:12,ytd_change:2.0,ecosystem_impact:'River erosion, habitat destruction',supply_mt:50000000,demand_mt:48000000,balance_mt:2000000,vol_30d:5.0},
    {id:'GLASS',name:'Flat Glass',unit:'USD/t',price:450,ytd_change:5.0,recycling_rate:0.34,supply_mt:75000,demand_mt:73000,balance_mt:2000,vol_30d:10.0},
    {id:'LUMBER',name:'Lumber (Random Length)',unit:'USD/mbf',price:480,ytd_change:-10.0,eodhd_ticker:'LB.COMM',supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:28.0},
    {id:'GYPSUM',name:'Gypsum',unit:'USD/t',price:10,ytd_change:1.0,supply_mt:150000,demand_mt:145000,balance_mt:5000,vol_30d:5.0},
    {id:'COPPER_WIRE',name:'Copper Wire Rod',unit:'USD/t',price:9400,ytd_change:6.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:17.0},
    {id:'REBAR',name:'Steel Rebar',unit:'USD/t',price:580,ytd_change:-8.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:14.0},
    {id:'CONCRETE',name:'Ready-Mix Concrete',unit:'USD/m3',price:150,ytd_change:5.0,co2_per_tonne:0.30,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:6.0},
  ]},
  energy_transition:{name:'Energy Transition',color:'#14b8a6',icon:'🔋',commodities:[
    {id:'SOLAR_POLY',name:'Polysilicon (Solar Grade)',unit:'USD/kg',price:7.20,ytd_change:-30.0,supply_mt:1200,demand_mt:1100,balance_mt:100,vol_30d:28.0},
    {id:'SOLAR_WAFER',name:'Solar Wafer (182mm)',unit:'USD/pc',price:0.18,ytd_change:-40.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:32.0},
    {id:'SOLAR_CELL',name:'Solar Cell (PERC)',unit:'USD/W',price:0.035,ytd_change:-35.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:30.0},
    {id:'SOLAR_MODULE',name:'Solar Module (Bifacial)',unit:'USD/W',price:0.10,ytd_change:-25.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:22.0},
    {id:'WIND_NACELLE',name:'Wind Turbine Nacelle',unit:'USD/kW',price:850,ytd_change:-5.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:8.0},
    {id:'BATTERY_CELL',name:'Li-ion Battery Cell (NMC)',unit:'USD/kWh',price:85,ytd_change:-20.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:15.0},
    {id:'BATTERY_LFP',name:'LFP Battery Cell',unit:'USD/kWh',price:60,ytd_change:-25.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:18.0},
    {id:'EV_MOTOR_MAGNET',name:'NdFeB Magnet (EV grade)',unit:'USD/kg',price:120,ytd_change:-10.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:20.0},
    {id:'INVERTER_IGBT',name:'IGBT Module (Power)',unit:'USD/unit',price:35,ytd_change:-8.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:12.0},
    {id:'TRANSFORMER_STEEL',name:'Grain-Oriented Electrical Steel',unit:'USD/t',price:3200,ytd_change:15.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:14.0},
    {id:'HEAT_PUMP',name:'Heat Pump (Air-Source)',unit:'USD/unit',price:4500,ytd_change:-12.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:10.0},
    {id:'ELECTROLYZER_PEM',name:'PEM Electrolyzer Stack',unit:'USD/kW',price:1200,ytd_change:-18.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:15.0},
    {id:'CCS_CREDIT',name:'CCS Carbon Credit (Direct Air)',unit:'USD/tCO2',price:600,ytd_change:-10.0,supply_mt:0.01,demand_mt:0.02,balance_mt:-0.01,vol_30d:20.0},
    {id:'SAF',name:'Sustainable Aviation Fuel',unit:'USD/gal',price:6.50,ytd_change:5.0,supply_mt:0.3,demand_mt:0.5,balance_mt:-0.2,vol_30d:18.0},
    {id:'BIOCHAR',name:'Biochar (Carbon Removal)',unit:'USD/t',price:250,ytd_change:15.0,supply_mt:0.1,demand_mt:0.15,balance_mt:-0.05,vol_30d:22.0},
  ]},
  shipping_freight:{name:'Shipping & Freight',color:'#ec4899',icon:'🚢',commodities:[
    {id:'BDI',name:'Baltic Dry Index',unit:'Index',price:1420,ytd_change:-15.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:30.0},
    {id:'VLCC',name:'VLCC Tanker Rate',unit:'USD/day',price:42000,ytd_change:10.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:35.0},
    {id:'CONTAINER_40FT',name:'Container Rate (40ft FEU)',unit:'USD/FEU',price:3200,ytd_change:65.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:40.0},
    {id:'BUNKER_VLSFO',name:'Bunker Fuel (VLSFO)',unit:'USD/t',price:580,ytd_change:-8.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:18.0},
    {id:'SCFI',name:'Shanghai Container Freight Index',unit:'Index',price:2100,ytd_change:55.0,supply_mt:0,demand_mt:0,balance_mt:0,vol_30d:38.0},
  ]},
  chemicals:{name:'Chemicals & Polymers',color:'#f59e0b',icon:'⚗',commodities:[
    {id:'ETHYLENE',name:'Ethylene',unit:'USD/t',price:980,ytd_change:-8.0,supply_mt:210000,demand_mt:205000,balance_mt:5000,vol_30d:16.0},
    {id:'PROPYLENE',name:'Propylene',unit:'USD/t',price:920,ytd_change:-5.0,supply_mt:130000,demand_mt:128000,balance_mt:2000,vol_30d:14.0},
    {id:'BENZENE',name:'Benzene',unit:'USD/gal',price:3.20,ytd_change:5.0,supply_mt:55000,demand_mt:54000,balance_mt:1000,vol_30d:18.0},
    {id:'METHANOL',name:'Methanol',unit:'USD/t',price:380,ytd_change:-12.0,supply_mt:110000,demand_mt:105000,balance_mt:5000,vol_30d:20.0},
    {id:'PTA',name:'PTA (Purified Terephthalic Acid)',unit:'USD/t',price:750,ytd_change:-3.0,supply_mt:80000,demand_mt:78000,balance_mt:2000,vol_30d:12.0},
    {id:'HDPE',name:'HDPE (High-Density Polyethylene)',unit:'USD/t',price:1150,ytd_change:2.0,supply_mt:65000,demand_mt:63000,balance_mt:2000,vol_30d:10.0},
    {id:'PVC',name:'PVC (Polyvinyl Chloride)',unit:'USD/t',price:850,ytd_change:-8.0,supply_mt:52000,demand_mt:50000,balance_mt:2000,vol_30d:14.0},
    {id:'CAUSTIC_SODA',name:'Caustic Soda',unit:'USD/t',price:520,ytd_change:5.0,supply_mt:78000,demand_mt:76000,balance_mt:2000,vol_30d:12.0},
    {id:'SULFURIC_ACID',name:'Sulfuric Acid',unit:'USD/t',price:95,ytd_change:-5.0,supply_mt:260000,demand_mt:255000,balance_mt:5000,vol_30d:8.0},
    {id:'CARBON_BLACK',name:'Carbon Black',unit:'USD/t',price:1200,ytd_change:3.0,supply_mt:16000,demand_mt:15500,balance_mt:500,vol_30d:10.0},
  ]},
};

const ALL_COMMODITIES = Object.entries(COMMODITY_UNIVERSE).flatMap(([catKey,cat])=>cat.commodities.map(c=>({...c,catKey,catName:cat.name,catColor:cat.color,catIcon:cat.icon})));
const TOTAL_COMM_COUNT = ALL_COMMODITIES.length;

/* ================================================================= SECTOR-COMMODITY DEPENDENCY MATRIX (ALL 11 GICS) */
const SECTOR_COMMODITY_EXPOSURE = {
  Energy:{primary:['WTI','BRENT','NG','COAL','URANIUM','LNG','COKING_COAL','TTF_GAS','GREEN_H2','GREY_H2'],secondary:['COPPER','STEEL','NAPHTHA','PROPANE','HEATING_OIL','GASOLINE','DIESEL'],carbon:['EUA','UKA','CCA','RGGI'],tertiary:['SAND','CEMENT','REBAR'],weight_factor:0.95},
  Materials:{primary:['IRON_ORE','COPPER','ALUMINUM','STEEL','CEMENT','ZINC','TIN','LEAD','CHROMIUM','TITANIUM','MAGNESIUM','STAINLESS_STEEL'],secondary:['COAL','NG','COKING_COAL','MANGANESE','NICKEL','MOLYBDENUM'],carbon:['EUA','CEA'],tertiary:['SAND','GLASS','GYPSUM'],weight_factor:0.90},
  'Consumer Staples':{primary:['PALM_OIL','SOY','COCOA','COFFEE','WHEAT','CORN','SUGAR','COTTON','RICE','COFFEE_ROBUSTA','SOY_OIL','SOY_MEAL','CANOLA','SUNFLOWER','BARLEY','OATS','MILK','ORANGE_JUICE','RUBBER'],secondary:['NG','POTASH','PHOSPHATE','UREA','WATER_INDEX'],carbon:[],tertiary:['ETHANOL'],weight_factor:0.75},
  Industrials:{primary:['STEEL','ALUMINUM','COPPER','CEMENT','REBAR','STAINLESS_STEEL','TITANIUM','LUMBER'],secondary:['WTI','NG','ZINC','LEAD','TIN','NICKEL'],carbon:['EUA','CEA'],tertiary:['SAND','GLASS','CONCRETE','GYPSUM'],weight_factor:0.85},
  'Information Technology':{primary:['RARE_EARTH','SILICON','COPPER','LITHIUM','COBALT','GALLIUM','GERMANIUM','INDIUM','TANTALUM','TUNGSTEN','GRAPHITE'],secondary:['GOLD','SILVER','PALLADIUM','TIN','NICKEL'],carbon:[],tertiary:['SOLAR_POLY','BATTERY_CELL','INVERTER_IGBT'],weight_factor:0.80},
  'Health Care':{primary:['PLATINUM','PALLADIUM','TITANIUM','COBALT'],secondary:['NG','RUBBER','GLASS','SILVER'],carbon:[],tertiary:['COTTON','PHOSPHATE'],weight_factor:0.40},
  Financials:{primary:[],secondary:['GOLD','SILVER'],carbon:['EUA','VCU'],tertiary:['COPPER_WIRE'],weight_factor:0.15},
  'Communication Services':{primary:['COPPER','RARE_EARTH','GALLIUM','GERMANIUM','INDIUM'],secondary:['SILICON','SILVER','GOLD','FIBER_OPTIC'],carbon:[],tertiary:['TITANIUM'],weight_factor:0.55},
  'Consumer Discretionary':{primary:['LITHIUM','COBALT','NICKEL','COPPER','RUBBER','COTTON','STEEL','ALUMINUM','RARE_EARTH'],secondary:['STEEL','ALUMINUM','LEATHER','GLASS','PLATINUM','PALLADIUM'],carbon:['EUA','CEA'],tertiary:['BATTERY_CELL','BATTERY_LFP','EV_MOTOR_MAGNET'],weight_factor:0.78},
  'Real Estate':{primary:['CEMENT','STEEL','GLASS','SAND','TIMBER','LUMBER','REBAR','CONCRETE','GYPSUM','COPPER_WIRE'],secondary:['COPPER','ALUMINUM'],carbon:['EUA'],tertiary:['TRANSFORMER_STEEL'],weight_factor:0.65},
  Utilities:{primary:['NG','COAL','URANIUM','COPPER','TTF_GAS','LNG','GREEN_H2'],secondary:['SILICON','SOLAR_POLY','SOLAR_MODULE','WIND_NACELLE','TRANSFORMER_STEEL','BATTERY_LFP'],carbon:['EUA','CCA','RGGI','NZU'],tertiary:['STEEL','CEMENT','SAND'],weight_factor:0.88},
};

/* ================================================================= CARBON CREDIT VINTAGE PRICING */
const CARBON_VINTAGE_DATA = [
  {year:2018,EUA:15.8,CCA:15.2,VCU:3.50,UKA:null,CEA:null},
  {year:2019,EUA:24.7,CCA:17.0,VCU:4.20,UKA:null,CEA:null},
  {year:2020,EUA:25.0,CCA:16.5,VCU:5.80,UKA:null,CEA:null},
  {year:2021,EUA:52.0,CCA:22.0,VCU:8.20,UKA:48.0,CEA:42.0},
  {year:2022,EUA:80.0,CCA:28.5,VCU:12.50,UKA:72.0,CEA:58.0},
  {year:2023,EUA:85.0,CCA:35.0,VCU:11.00,UKA:48.0,CEA:65.0},
  {year:2024,EUA:88.5,CCA:38.5,VCU:8.50,UKA:42.3,CEA:92.0},
];

/* ================================================================= ENERGY TRANSITION DEMAND FORECAST */
const TRANSITION_DEMAND = [
  {mineral:'Lithium',current_kt:130,iea_2030_kt:500,iea_2040_kt:1200,iea_2050_kt:1800,growth:'14x',cagr_pct:10.5,driver:'EV batteries, grid storage'},
  {mineral:'Cobalt',current_kt:190,iea_2030_kt:350,iea_2040_kt:480,iea_2050_kt:600,growth:'3x',cagr_pct:4.5,driver:'EV batteries (declining per cell)'},
  {mineral:'Copper',current_kt:25000,iea_2030_kt:32000,iea_2040_kt:39000,iea_2050_kt:45000,growth:'1.8x',cagr_pct:2.3,driver:'Electrification, EVs, grid'},
  {mineral:'Nickel',current_kt:3300,iea_2030_kt:5000,iea_2040_kt:7200,iea_2050_kt:9000,growth:'2.7x',cagr_pct:3.9,driver:'Battery cathodes (high-Ni NMC)'},
  {mineral:'Rare Earths',current_kt:300,iea_2030_kt:450,iea_2040_kt:580,iea_2050_kt:700,growth:'2.3x',cagr_pct:3.3,driver:'Wind turbine magnets, EV motors'},
  {mineral:'Graphite',current_kt:1100,iea_2030_kt:3000,iea_2040_kt:4500,iea_2050_kt:5500,growth:'5x',cagr_pct:6.4,driver:'Battery anodes'},
  {mineral:'Silicon',current_kt:800,iea_2030_kt:1500,iea_2040_kt:2200,iea_2050_kt:3000,growth:'3.8x',cagr_pct:5.2,driver:'Solar PV expansion'},
  {mineral:'Manganese',current_kt:20000,iea_2030_kt:25000,iea_2040_kt:30000,iea_2050_kt:35000,growth:'1.8x',cagr_pct:2.2,driver:'LMFP batteries'},
  {mineral:'Vanadium',current_kt:100,iea_2030_kt:180,iea_2040_kt:300,iea_2050_kt:450,growth:'4.5x',cagr_pct:5.9,driver:'Flow batteries for grid'},
  {mineral:'Platinum',current_kt:0.19,iea_2030_kt:0.25,iea_2040_kt:0.32,iea_2050_kt:0.40,growth:'2.1x',cagr_pct:2.9,driver:'Fuel cell catalysts'},
  {mineral:'Iridium',current_kt:0.007,iea_2030_kt:0.012,iea_2040_kt:0.018,iea_2050_kt:0.025,growth:'3.6x',cagr_pct:5.0,driver:'PEM electrolyzers'},
  {mineral:'Tellurium',current_kt:0.5,iea_2030_kt:0.8,iea_2040_kt:1.1,iea_2050_kt:1.4,growth:'2.8x',cagr_pct:4.0,driver:'CdTe thin-film solar'},
];

/* ================================================================= SUPPLY/DEMAND BALANCE SHEETS (per-commodity detail) */
const BALANCE_SHEETS = {
  WTI:{supply_bpd:'80M',demand_bpd:'82M',opec_spare_capacity:'4.5M bpd',us_shale_output:'13.2M bpd',strategic_reserves:'372M bbl',days_cover:26,iea_forecast_2030:'Peak demand ~103M bpd',opec_plus_cuts:'2M bpd voluntary',refinery_utilization:92},
  COPPER:{supply_kt:22000,demand_kt:25000,deficit_kt:-3000,mine_supply_growth:1.5,recycling_share:32,top_mine:'Escondida (BHP)',chile_share:27,peru_share:10,congo_share:12,green_demand_pct:18,ev_wiring_kg:83,solar_farm_t_per_mw:4.5,offshore_wind_t_per_mw:8.0,grid_expansion_t:2500000},
  LITHIUM:{supply_kt:130,demand_kt:120,surplus_kt:10,price_from_peak_pct:-75,drc_brine_pct:50,hard_rock_pct:50,battery_grade_share:82,recycling_rate:5,avg_ev_battery_kg:8.9,gigafactory_demand_2030:4200,price_floor_estimate:8000,price_ceiling_estimate:25000},
  GOLD:{supply_t:3600,mine_production_t:3100,recycling_t:1100,central_bank_buying_t:1037,etf_holdings_t:3200,jewelry_demand_t:2100,industrial_t:330,investment_demand_t:1200,reserves_underground_t:54000,top_producer:'CN 370t',second:'AU 310t'},
  IRON_ORE:{supply_mt:2400,demand_mt:2300,china_import_share:72,australia_export_share:53,brazil_export_share:22,india_domestic:230,seaborne_trade_mt:1600,green_steel_impact:'DRI reduces ore demand 15-20% by 2040',price_range_5yr:'$80-160',avg_fe_content:62},
  EUA:{supply_mt:1400,demand_mt:1350,free_allocation_pct:43,auction_revenue_eur:'38B (2023)',msr_intake_mt:400,price_floor_eur:45,price_ceiling_eur:130,sectors_covered:'Power, industry, aviation, maritime (2024)',reform:'Fit for 55 cap reduction 4.3%/yr',linked_markets:['CH','UK (partial)']},
  WHEAT:{supply_mt:800000,demand_mt:795000,ending_stocks_mt:260000,stocks_to_use_ratio:33,top_exporter:'RU 49Mt',second_exporter:'EU 35Mt',us_export_mt:22,import_dependent_countries:52,ukraine_export_mt:18,climate_risk_yield_change:'-6% per 1C warming',black_sea_corridor:'Active but fragile'},
  COBALT:{supply_kt:190,demand_kt:180,drc_share:73,china_refining_share:72,artisanal_mining_share:20,child_labor_estimate:'40K children',price_from_peak_pct:-78,lfp_substitution_impact:'Reducing cobalt intensity 30% by 2030',recycling_rate:12,conflict_mineral:true},
  PALM_OIL:{supply_mt:77000,demand_mt:75000,indonesia_share:59,malaysia_share:25,yield_t_per_ha:3.8,land_area_mha:28,annual_deforestation_kha:680,rspo_certified_pct:19,biofuel_demand_share:12,eu_ban_2030:'Phase-out of palm oil biofuel',smallholder_share:40},
  NICKEL:{supply_kt:3300,demand_kt:3200,indonesia_share:48,philippines_share:10,russia_share:6,class1_share:40,battery_demand_pct:14,stainless_demand_pct:68,price_range_5yr:'$13K-33K',indonesia_ban:'Export ban on raw ore since 2020',sulfate_premium:2200},
};

/* ================================================================= COMMODITY GROUP CORRELATION SUMMARY */
const GROUP_CORRELATIONS = [
  {group1:'Precious Metals',group2:'USD Index',correlation:-0.65,note:'Inverse: gold rises when USD weakens'},
  {group1:'Oil (WTI/Brent)',group2:'Natural Gas',correlation:0.55,note:'Moderate: same energy complex'},
  {group1:'Gold',group2:'Silver',correlation:0.88,note:'Strong: precious metals move together'},
  {group1:'Copper',group2:'Iron Ore',correlation:0.60,note:'Moderate: both tied to China demand'},
  {group1:'Lithium',group2:'Cobalt',correlation:0.78,note:'Strong: EV battery demand link'},
  {group1:'Corn',group2:'Ethanol',correlation:0.72,note:'Strong: feedstock relationship'},
  {group1:'WTI Oil',group2:'Gold',correlation:-0.15,note:'Weak inverse: risk-on vs safe-haven'},
  {group1:'Wheat',group2:'Corn',correlation:0.75,note:'Strong: substitution in feed'},
  {group1:'EUA Carbon',group2:'Natural Gas',correlation:0.45,note:'Moderate: gas-coal switching'},
  {group1:'Steel',group2:'Coking Coal',correlation:0.70,note:'Strong: production input'},
  {group1:'Copper',group2:'Nickel',correlation:0.65,note:'Moderate: industrial metals co-move'},
  {group1:'Palm Oil',group2:'Soybean Oil',correlation:0.82,note:'Strong: vegetable oil substitution'},
];

/* ================================================================= COMMODITY SEASONAL PATTERNS */
const SEASONAL_PATTERNS = [
  {commodity:'WTI',q1:'Neutral',q2:'Strong (driving season)',q3:'Peak demand',q4:'Weak (refinery maint.)',best_month:'Jun',worst_month:'Nov'},
  {commodity:'Natural Gas',q1:'Strong (winter)',q2:'Weak',q3:'Build season',q4:'Very Strong',best_month:'Jan',worst_month:'Apr'},
  {commodity:'Gold',q1:'Strong (India)',q2:'Weak',q3:'Mixed',q4:'Strong (jewelry)',best_month:'Sep',worst_month:'Mar'},
  {commodity:'Wheat',q1:'Mixed',q2:'Strong (planting)',q3:'Harvest pressure',q4:'Neutral',best_month:'Apr',worst_month:'Sep'},
  {commodity:'Copper',q1:'Strong (China restock)',q2:'Peak construction',q3:'Neutral',q4:'Weak',best_month:'Mar',worst_month:'Nov'},
  {commodity:'Cocoa',q1:'Neutral',q2:'Harvest pressure',q3:'Neutral',q4:'Strong (holiday)',best_month:'Dec',worst_month:'May'},
  {commodity:'Corn',q1:'Neutral',q2:'Planting uncertainty',q3:'Harvest pressure',q4:'Neutral',best_month:'Jun',worst_month:'Oct'},
  {commodity:'Silver',q1:'Strong',q2:'Weak',q3:'Strong (industrial)',q4:'Mixed',best_month:'Feb',worst_month:'Jun'},
  {commodity:'EUA Carbon',q1:'Strong (compliance)',q2:'Weak (post-surrender)',q3:'Building',q4:'Strong',best_month:'Apr',worst_month:'Jul'},
  {commodity:'Palm Oil',q1:'Neutral',q2:'Low production',q3:'Ramp up',q4:'Peak production',best_month:'Feb',worst_month:'Oct'},
];

/* ================================================================= CATEGORY STATISTICS SUMMARY */
const CATEGORY_STATISTICS = Object.entries(COMMODITY_UNIVERSE).map(([catKey,cat])=>{
  const comms=cat.commodities;
  const avgYtd=comms.filter(c=>c.ytd_change!=null).reduce((s,c)=>s+c.ytd_change,0)/Math.max(1,comms.filter(c=>c.ytd_change!=null).length);
  const avgVol=comms.filter(c=>c.vol_30d).reduce((s,c)=>s+c.vol_30d,0)/Math.max(1,comms.filter(c=>c.vol_30d).length);
  const deficits=comms.filter(c=>c.balance_mt!=null&&c.balance_mt<0).length;
  const eudrCount=comms.filter(c=>c.eudr_regulated).length;
  const highRiskCount=comms.filter(c=>c.supply_risk==='High'||c.supply_risk==='Very High').length;
  const bestPerformer=[...comms].filter(c=>c.ytd_change!=null).sort((a,b)=>b.ytd_change-a.ytd_change)[0];
  const worstPerformer=[...comms].filter(c=>c.ytd_change!=null).sort((a,b)=>a.ytd_change-b.ytd_change)[0];
  return{
    catKey,name:cat.name,color:cat.color,icon:cat.icon,count:comms.length,
    avgYtd:Math.round(avgYtd*10)/10,avgVol:Math.round(avgVol*10)/10,
    deficits,eudrCount,highRiskCount,
    bestId:bestPerformer?.id||'N/A',bestYtd:bestPerformer?.ytd_change||0,
    worstId:worstPerformer?.id||'N/A',worstYtd:worstPerformer?.ytd_change||0,
    totalSupply:comms.filter(c=>c.supply_mt>0).reduce((s,c)=>s+c.supply_mt,0),
  };
});

/* ================================================================= GEOPOLITICAL CHOKEPOINTS */
const CHOKEPOINTS = [
  {name:'Strait of Hormuz',location:'Persian Gulf',commodities:['WTI','BRENT','LNG','NG'],daily_volume:'21M bbl oil + 5 Bcf LNG',share_global_oil:21,risk:'Iran-US tensions, mine threats',disruption_impact:'Oil +$30-50/bbl immediately',alternative:'None for Gulf producers',countries_affected:['SA','AE','KW','IQ','QA']},
  {name:'Strait of Malacca',location:'Singapore',commodities:['WTI','BRENT','PALM_OIL','LNG','COAL','IRON_ORE'],daily_volume:'16M bbl oil + bulk cargo',share_global_oil:16,risk:'Piracy, China-US rivalry',disruption_impact:'Asia energy crisis, +30% freight',alternative:'Lombok/Sunda Strait (+3-5 days)',countries_affected:['CN','JP','KR','ID','MY']},
  {name:'Suez Canal',location:'Egypt',commodities:['WTI','BRENT','LNG','WHEAT','COCOA','COFFEE','CONTAINER_40FT'],daily_volume:'5M bbl oil equiv + 15% global trade',share_global_oil:9,risk:'Houthi attacks (Red Sea crisis 2024)',disruption_impact:'+50-70% container rates, +5% commodity costs',alternative:'Cape of Good Hope (+10-14 days)',countries_affected:['EU','US','Global']},
  {name:'Panama Canal',location:'Panama',commodities:['SOY','CORN','LNG','CONTAINER_40FT'],daily_volume:'3% of global seaborne trade',share_global_oil:2,risk:'Drought reducing transit capacity (2023-24)',disruption_impact:'+$10-15/t grain, longer transit',alternative:'US rail to Pacific, Suez route',countries_affected:['US','CN','JP']},
  {name:'Bab el-Mandeb',location:'Yemen/Djibouti',commodities:['WTI','BRENT','LNG','CONTAINER_40FT'],daily_volume:'6M bbl oil',share_global_oil:7,risk:'Houthi attacks on shipping (2024)',disruption_impact:'Red Sea rerouting via Cape',alternative:'Cape of Good Hope',countries_affected:['EU','CN','IN']},
  {name:'Turkish Straits',location:'Bosphorus/Dardanelles',commodities:['WHEAT','CORN','SUNFLOWER','WTI'],daily_volume:'3M bbl oil + grain exports',share_global_oil:3,risk:'Ukraine-Russia war, traffic congestion',disruption_impact:'Black Sea grain crisis',alternative:'Land routes (limited)',countries_affected:['UA','RU','TR','EG']},
  {name:'Cape of Good Hope',location:'South Africa',commodities:['WTI','BRENT','IRON_ORE','COAL','LNG'],daily_volume:'Alternative route capacity unlimited',share_global_oil:0,risk:'Weather, piracy (declining)',disruption_impact:'Adds 10-14 days to EU-Asia route',alternative:'Suez Canal (when safe)',countries_affected:['Global']},
  {name:'TSMC (Semiconductor)',location:'Taiwan',commodities:['SILICON','GALLIUM','GERMANIUM','RARE_EARTH'],daily_volume:'92% of advanced chips',share_global_oil:0,risk:'China-Taiwan tensions',disruption_impact:'Global electronics crisis, 12-24 month recovery',alternative:'TSMC Arizona, Samsung Korea (limited)',countries_affected:['US','EU','JP','CN','Global']},
];

/* ================================================================= COMMODITY ETF MAPPING */
const COMMODITY_ETFS = [
  {commodity:'Gold',etf:'GLD',name:'SPDR Gold Shares',aum_bn:56,expense:0.40,tracking:'Physical gold bars'},
  {commodity:'Gold',etf:'IAU',name:'iShares Gold Trust',aum_bn:28,expense:0.25,tracking:'Physical gold'},
  {commodity:'Silver',etf:'SLV',name:'iShares Silver Trust',aum_bn:10,expense:0.50,tracking:'Physical silver'},
  {commodity:'WTI Oil',etf:'USO',name:'United States Oil Fund',aum_bn:2.5,expense:0.83,tracking:'WTI futures (roll risk)'},
  {commodity:'Broad Commodity',etf:'DJP',name:'iPath Bloomberg Commodity Index',aum_bn:1.8,expense:0.70,tracking:'24-commodity index'},
  {commodity:'Broad Commodity',etf:'PDBC',name:'Invesco Optimum Yield Diversified',aum_bn:5.2,expense:0.59,tracking:'14 most traded commodities'},
  {commodity:'Copper',etf:'COPX',name:'Global X Copper Miners ETF',aum_bn:2.1,expense:0.65,tracking:'Copper mining equities'},
  {commodity:'Lithium',etf:'LIT',name:'Global X Lithium & Battery Tech ETF',aum_bn:3.5,expense:0.75,tracking:'Lithium miners + battery'},
  {commodity:'Uranium',etf:'URA',name:'Global X Uranium ETF',aum_bn:2.8,expense:0.69,tracking:'Uranium mining + nuclear'},
  {commodity:'Agriculture',etf:'DBA',name:'Invesco DB Agriculture Fund',aum_bn:0.8,expense:0.85,tracking:'Agri futures basket'},
  {commodity:'Carbon',etf:'KRBN',name:'KraneShares Global Carbon Strategy',aum_bn:0.6,expense:0.78,tracking:'EU + CA carbon futures'},
  {commodity:'Rare Earths',etf:'REMX',name:'VanEck Rare Earth & Strategic Metals',aum_bn:0.5,expense:0.54,tracking:'Rare earth mining equities'},
  {commodity:'Clean Energy',etf:'ICLN',name:'iShares Global Clean Energy',aum_bn:3.2,expense:0.41,tracking:'Clean energy equities'},
  {commodity:'Nat Gas',etf:'UNG',name:'United States Natural Gas Fund',aum_bn:0.4,expense:1.11,tracking:'Henry Hub NG futures'},
  {commodity:'Steel',etf:'SLX',name:'VanEck Steel ETF',aum_bn:0.15,expense:0.56,tracking:'Steel producing equities'},
  {commodity:'Water',etf:'PHO',name:'Invesco Water Resources ETF',aum_bn:2.0,expense:0.60,tracking:'Water infrastructure equities'},
];

/* ================================================================= COMMODITY PRICE HISTORY DATABASE (30-Day Arrays) */
const PRICE_HISTORY_DB = {};
['WTI','BRENT','NG','GOLD','SILVER','COPPER','LITHIUM','EUA','WHEAT','IRON_ORE','COBALT','NICKEL','PALM_OIL',
 'COAL','PLATINUM','PALLADIUM','STEEL','ALUMINUM','ZINC','TIN','COFFEE','COCOA','RUBBER','SOY','CORN','RICE',
 'SUGAR','COTTON','URANIUM','RARE_EARTH','GRAPHITE','SILICON','MANGANESE','VANADIUM','GALLIUM','GERMANIUM',
 'TUNGSTEN','CEMENT','SAND','GLASS','LUMBER','GREEN_H2','SOLAR_POLY','BATTERY_CELL','BATTERY_LFP','BDI',
 'ANTIMONY','MAGNESIUM','VCU','CCA','CEA','UKA','RGGI','NZU','ETHANOL','TTF_GAS','PROPANE','NAPHTHA',
 'COKING_COAL','HEATING_OIL','GASOLINE','DIESEL','AMMONIA_GREEN','GREY_H2','LNG','JKM_LNG','LEAD','CHROMIUM',
 'TITANIUM','BISMUTH','STAINLESS_STEEL','COFFEE_ROBUSTA','SOY_OIL','SOY_MEAL','CANOLA','SUNFLOWER',
 'ORANGE_JUICE','OATS','BARLEY','LEAN_HOGS','FEEDER_CATTLE','MILK','WATER_INDEX','POTASH','PHOSPHATE','UREA',
 'REBAR','CONCRETE','COPPER_WIRE','GYPSUM','SOLAR_WAFER','SOLAR_CELL','SOLAR_MODULE','WIND_NACELLE',
 'EV_MOTOR_MAGNET','INVERTER_IGBT','TRANSFORMER_STEEL','VLCC','CONTAINER_40FT','BUNKER_VLSFO','SCFI',
 'ETHYLENE','PROPYLENE','BENZENE','METHANOL','PTA','HDPE','PVC','CAUSTIC_SODA','SULFURIC_ACID','CARBON_BLACK',
 'RHODIUM','IRIDIUM','RUTHENIUM','INDIUM','TELLURIUM','MOLYBDENUM','TANTALUM','NIOBIUM',
 'LITHIUM_HYDROXIDE','SPODUMENE','KCER','CORSIA','BIO_CREDIT','PLASTIC_CREDIT','REC'
].forEach(id=>{
  const comm=ALL_COMMODITIES.find(c=>c.id===id);
  if(comm)PRICE_HISTORY_DB[id]=genPriceHistory(comm.price,30,comm.vol_30d?(comm.vol_30d/100)*0.7:0.02,id);
});

/* ================================================================= COMMODITY SECTOR IMPACT MATRIX (how each commodity impacts each GICS sector) */
const SECTOR_IMPACT_MATRIX = {
  WTI:[{sector:'Energy',impact:95,mechanism:'Direct revenue driver'},{sector:'Materials',impact:40,mechanism:'Input cost for petrochemicals'},{sector:'Industrials',impact:55,mechanism:'Fuel & transport cost'},{sector:'Consumer Discretionary',impact:45,mechanism:'EV substitution accelerator'},{sector:'Utilities',impact:60,mechanism:'Power generation cost'},{sector:'Consumer Staples',impact:30,mechanism:'Packaging, transport cost'},{sector:'Financials',impact:25,mechanism:'Energy sector lending exposure'},{sector:'Information Technology',impact:10,mechanism:'Data center backup power'},{sector:'Health Care',impact:15,mechanism:'Petrochemical inputs'},{sector:'Communication Services',impact:8,mechanism:'Minimal direct exposure'},{sector:'Real Estate',impact:20,mechanism:'Heating/cooling cost'}],
  GOLD:[{sector:'Financials',impact:50,mechanism:'Reserve asset, hedging instrument'},{sector:'Materials',impact:65,mechanism:'Mining sector revenue'},{sector:'Consumer Discretionary',impact:35,mechanism:'Jewelry, luxury goods'},{sector:'Information Technology',impact:20,mechanism:'Electronics connectors'},{sector:'Energy',impact:5,mechanism:'Minimal'},{sector:'Utilities',impact:3,mechanism:'Minimal'},{sector:'Industrials',impact:10,mechanism:'Industrial applications'},{sector:'Consumer Staples',impact:5,mechanism:'Minimal'},{sector:'Health Care',impact:8,mechanism:'Dental, diagnostics'},{sector:'Communication Services',impact:5,mechanism:'Minimal'},{sector:'Real Estate',impact:10,mechanism:'Store of value / inflation hedge'}],
  COPPER:[{sector:'Utilities',impact:85,mechanism:'Grid infrastructure, transformers, cables'},{sector:'Consumer Discretionary',impact:75,mechanism:'EV motors, wiring (83kg per EV)'},{sector:'Industrials',impact:70,mechanism:'Construction, machinery'},{sector:'Real Estate',impact:65,mechanism:'Electrical wiring, plumbing'},{sector:'Energy',impact:60,mechanism:'Renewable energy, oil&gas equipment'},{sector:'Information Technology',impact:55,mechanism:'PCBs, data center cables'},{sector:'Materials',impact:90,mechanism:'Mining revenue, alloy inputs'},{sector:'Communication Services',impact:40,mechanism:'Telecom cables'},{sector:'Health Care',impact:15,mechanism:'Medical equipment'},{sector:'Consumer Staples',impact:10,mechanism:'Packaging'},{sector:'Financials',impact:8,mechanism:'Commodity exposure'}],
  LITHIUM:[{sector:'Consumer Discretionary',impact:92,mechanism:'EV batteries - primary demand driver'},{sector:'Information Technology',impact:70,mechanism:'Consumer electronics batteries'},{sector:'Utilities',impact:65,mechanism:'Grid-scale energy storage'},{sector:'Materials',impact:80,mechanism:'Mining revenue'},{sector:'Energy',impact:45,mechanism:'Energy storage for renewables'},{sector:'Industrials',impact:35,mechanism:'Industrial batteries'},{sector:'Health Care',impact:15,mechanism:'Medical devices'},{sector:'Consumer Staples',impact:5,mechanism:'Minimal'},{sector:'Financials',impact:10,mechanism:'Commodity exposure'},{sector:'Communication Services',impact:20,mechanism:'Device batteries'},{sector:'Real Estate',impact:10,mechanism:'Home batteries'}],
  EUA:[{sector:'Energy',impact:90,mechanism:'Carbon cost on power generation'},{sector:'Utilities',impact:88,mechanism:'Carbon cost on electricity/gas'},{sector:'Materials',impact:82,mechanism:'Steel, cement, chemicals carbon cost'},{sector:'Industrials',impact:65,mechanism:'Manufacturing emissions cost'},{sector:'Consumer Discretionary',impact:35,mechanism:'Embedded carbon in vehicles'},{sector:'Real Estate',impact:45,mechanism:'Building energy efficiency mandates'},{sector:'Consumer Staples',impact:25,mechanism:'Supply chain emissions'},{sector:'Financials',impact:40,mechanism:'Carbon market trading, green bonds'},{sector:'Information Technology',impact:20,mechanism:'Data center emissions'},{sector:'Health Care',impact:15,mechanism:'Healthcare facilities'},{sector:'Communication Services',impact:12,mechanism:'Telecom infrastructure'}],
};

/* ================================================================= COMMODITY CROSS-ASSET HEAT MAP DATA */
const CROSS_ASSET_HEAT = [
  {asset:'US Dollar (DXY)',WTI:-0.45,GOLD:-0.65,COPPER:-0.35,WHEAT:-0.28,EUA:-0.20,LITHIUM:-0.15},
  {asset:'S&P 500',WTI:0.30,GOLD:-0.15,COPPER:0.55,WHEAT:0.05,EUA:0.25,LITHIUM:0.40},
  {asset:'US 10Y Yield',WTI:0.25,GOLD:-0.50,COPPER:0.20,WHEAT:0.10,EUA:0.15,LITHIUM:0.10},
  {asset:'VIX (Volatility)',WTI:-0.35,GOLD:0.45,COPPER:-0.40,WHEAT:0.15,EUA:-0.20,LITHIUM:-0.30},
  {asset:'China PMI',WTI:0.40,GOLD:-0.10,COPPER:0.65,WHEAT:0.15,EUA:0.10,LITHIUM:0.55},
  {asset:'EU Natural Gas',WTI:0.55,GOLD:0.10,COPPER:0.15,WHEAT:0.30,EUA:0.45,LITHIUM:0.05},
  {asset:'MSCI EM',WTI:0.35,GOLD:0.10,COPPER:0.60,WHEAT:0.20,EUA:0.05,LITHIUM:0.45},
  {asset:'Bitcoin',WTI:0.10,GOLD:0.25,COPPER:0.15,WHEAT:0.05,EUA:0.08,LITHIUM:0.20},
];

/* ================================================================= COMMODITY PRICE TARGETS (analyst consensus) */
const PRICE_TARGETS = [
  {id:'WTI',current:72.50,low:55,median:75,high:95,consensus:'Hold',analysts:32,timeframe:'12M'},
  {id:'BRENT',current:76.80,low:58,median:78,high:100,consensus:'Hold',analysts:30,timeframe:'12M'},
  {id:'GOLD',current:2650,low:2200,median:2800,high:3200,consensus:'Buy',analysts:28,timeframe:'12M'},
  {id:'SILVER',current:31.50,low:24,median:35,high:42,consensus:'Buy',analysts:22,timeframe:'12M'},
  {id:'COPPER',current:8950,low:7500,median:9800,high:12000,consensus:'Strong Buy',analysts:26,timeframe:'12M'},
  {id:'LITHIUM',current:12500,low:8000,median:15000,high:25000,consensus:'Buy',analysts:18,timeframe:'12M'},
  {id:'COBALT',current:28000,low:22000,median:32000,high:45000,consensus:'Hold',analysts:14,timeframe:'12M'},
  {id:'EUA',current:88.50,low:65,median:95,high:130,consensus:'Buy',analysts:20,timeframe:'12M'},
  {id:'IRON_ORE',current:110,low:80,median:105,high:135,consensus:'Sell',analysts:24,timeframe:'12M'},
  {id:'NG',current:2.85,low:2.00,median:3.50,high:5.50,consensus:'Buy',analysts:22,timeframe:'12M'},
  {id:'WHEAT',current:5.85,low:4.50,median:6.20,high:8.00,consensus:'Hold',analysts:16,timeframe:'12M'},
  {id:'PALM_OIL',current:850,low:700,median:900,high:1100,consensus:'Hold',analysts:12,timeframe:'12M'},
  {id:'COAL',current:135,low:80,median:110,high:160,consensus:'Sell',analysts:18,timeframe:'12M'},
  {id:'NICKEL',current:16200,low:13000,median:18000,high:24000,consensus:'Buy',analysts:20,timeframe:'12M'},
  {id:'STEEL',current:680,low:550,median:700,high:850,consensus:'Hold',analysts:16,timeframe:'12M'},
  {id:'ALUMINUM',current:2350,low:2000,median:2500,high:3000,consensus:'Buy',analysts:18,timeframe:'12M'},
  {id:'PLATINUM',current:985,low:850,median:1100,high:1400,consensus:'Buy',analysts:14,timeframe:'12M'},
  {id:'URANIUM',current:85,low:60,median:95,high:130,consensus:'Strong Buy',analysts:12,timeframe:'12M'},
  {id:'COCOA',current:8500,low:5000,median:7500,high:10000,consensus:'Sell',analysts:10,timeframe:'12M'},
  {id:'COFFEE',current:3.85,low:2.50,median:3.50,high:4.50,consensus:'Hold',analysts:14,timeframe:'12M'},
  {id:'RARE_EARTH',current:42,low:30,median:48,high:65,consensus:'Buy',analysts:10,timeframe:'12M'},
  {id:'GREEN_H2',current:4.50,low:3.00,median:3.80,high:5.00,consensus:'Buy',analysts:8,timeframe:'12M'},
  {id:'ANTIMONY',current:25000,low:15000,median:28000,high:40000,consensus:'Hold',analysts:6,timeframe:'12M'},
  {id:'GALLIUM',current:280,low:200,median:320,high:500,consensus:'Buy',analysts:4,timeframe:'12M'},
];

/* ================================================================= COMMODITY TRADE FLOW DATA */
const TRADE_FLOWS = [
  {commodity:'Iron Ore',exporter:'Australia',importer:'China',volume_mt:850,value_bn:93.5,route:'Indian Ocean',transit_days:18},
  {commodity:'Iron Ore',exporter:'Brazil',importer:'China',volume_mt:350,value_bn:38.5,route:'Atlantic-Pacific',transit_days:40},
  {commodity:'Crude Oil',exporter:'Saudi Arabia',importer:'China',volume_mt:82,value_bn:52,route:'Strait of Hormuz',transit_days:22},
  {commodity:'Crude Oil',exporter:'Russia',importer:'India',volume_mt:90,value_bn:55,route:'Indian Ocean',transit_days:14},
  {commodity:'LNG',exporter:'Qatar',importer:'Japan',volume_mt:28,value_bn:14,route:'Strait of Hormuz',transit_days:20},
  {commodity:'LNG',exporter:'Australia',importer:'Japan',volume_mt:35,value_bn:17,route:'Pacific',transit_days:8},
  {commodity:'LNG',exporter:'USA',importer:'EU',volume_mt:50,value_bn:25,route:'Atlantic',transit_days:10},
  {commodity:'Copper',exporter:'Chile',importer:'China',volume_mt:3.5,value_bn:31,route:'Pacific',transit_days:28},
  {commodity:'Palm Oil',exporter:'Indonesia',importer:'India',volume_mt:8.5,value_bn:7.2,route:'Indian Ocean',transit_days:12},
  {commodity:'Wheat',exporter:'Russia',importer:'Egypt',volume_mt:12,value_bn:3.6,route:'Black Sea-Suez',transit_days:8},
  {commodity:'Wheat',exporter:'USA',importer:'Japan',volume_mt:2.8,value_bn:0.9,route:'Pacific',transit_days:14},
  {commodity:'Soybean',exporter:'Brazil',importer:'China',volume_mt:100,value_bn:45,route:'Atlantic-Pacific',transit_days:35},
  {commodity:'Coal',exporter:'Indonesia',importer:'China',volume_mt:200,value_bn:27,route:'South China Sea',transit_days:5},
  {commodity:'Coal',exporter:'Australia',importer:'India',volume_mt:75,value_bn:10,route:'Indian Ocean',transit_days:12},
  {commodity:'Cobalt',exporter:'DR Congo',importer:'China',volume_mt:0.12,value_bn:3.4,route:'Indian Ocean',transit_days:30},
  {commodity:'Lithium',exporter:'Australia',importer:'China',volume_mt:0.06,value_bn:0.75,route:'South China Sea',transit_days:12},
  {commodity:'Cocoa',exporter:'Ivory Coast',importer:'Netherlands',volume_mt:0.8,value_bn:6.8,route:'Atlantic',transit_days:12},
  {commodity:'Coffee',exporter:'Brazil',importer:'USA',volume_mt:1.2,value_bn:4.6,route:'Atlantic',transit_days:10},
  {commodity:'Cotton',exporter:'USA',importer:'Bangladesh',volume_mt:0.5,value_bn:0.36,route:'Atlantic-Indian',transit_days:25},
  {commodity:'Nickel',exporter:'Indonesia',importer:'China',volume_mt:1.5,value_bn:24,route:'South China Sea',transit_days:5},
];

/* ================================================================= ML PREDICTION RESULTS FOR KEY COMMODITIES */
const ML_PREDICTIONS = {};
['WTI','BRENT','GOLD','SILVER','COPPER','LITHIUM','COBALT','EUA','IRON_ORE','NG',
 'WHEAT','PALM_OIL','COAL','NICKEL','STEEL','ALUMINUM','PLATINUM','URANIUM','COCOA','COFFEE',
 'RARE_EARTH','GREEN_H2','ANTIMONY','GALLIUM','MANGANESE','VANADIUM','TIN','ZINC','SUGAR','COTTON',
 'RUBBER','GRAPHITE','SILICON','BDI','SOLAR_POLY','BATTERY_CELL'].forEach(id=>{
  const comm=ALL_COMMODITIES.find(c=>c.id===id);
  if(comm){
    const hist=genPriceHistory(comm.price,30,comm.vol_30d?(comm.vol_30d/100)*0.7:0.02,id);
    ML_PREDICTIONS[id]=mlPredictPrice(hist);
  }
});

/* ================================================================= COMMODITY RISK SCORING MODEL */
const computeCommodityRiskScore=(c)=>{
  let score=0;
  if(c.supply_risk==='Very High')score+=25;
  else if(c.supply_risk==='High')score+=18;
  if(c.geopolitical_risk)score+=20;
  if(c.child_labor_risk)score+=15;
  if(c.conflict_mineral)score+=15;
  if(c.eudr_regulated)score+=10;
  if(c.stranded_risk==='Very High')score+=20;
  else if(c.stranded_risk==='High')score+=12;
  if(c.deforestation_risk==='Very High')score+=15;
  else if(c.deforestation_risk==='High')score+=10;
  if(c.vol_30d&&c.vol_30d>=35)score+=10;
  else if(c.vol_30d&&c.vol_30d>=25)score+=5;
  if(c.balance_mt&&c.balance_mt<0)score+=8;
  if(c.food_security==='Critical')score+=12;
  if(c.climate_sensitivity==='Very High')score+=8;
  if(c.water_intensity==='Very High')score+=8;
  if(c.labor_risk)score+=10;
  return Math.min(100,score);
};

/* ================================================================= COMMODITY COUNTRY EXPOSURE MAP */
const COUNTRY_EXPOSURE_MAP = {
  CN:{name:'China',commodities_dominated:['RARE_EARTH','GALLIUM','GERMANIUM','GRAPHITE','SILICON','TUNGSTEN','ANTIMONY','MAGNESIUM','COBALT_REFINING','LITHIUM_REFINING'],share_avg:72,risk_level:'Very High',geopolitical:'US-China tensions, export controls',esg_concern:'Xinjiang forced labor'},
  AU:{name:'Australia',commodities_dominated:['LITHIUM_MINING','IRON_ORE'],share_avg:45,risk_level:'Low',geopolitical:'China trade tensions',esg_concern:'Indigenous rights (Juukan Gorge)'},
  CD:{name:'DR Congo',commodities_dominated:['COBALT_MINING'],share_avg:73,risk_level:'Very High',geopolitical:'Conflict, instability',esg_concern:'Child labor (40K children in ASM)'},
  CL:{name:'Chile',commodities_dominated:['COPPER','LITHIUM_BRINE'],share_avg:35,risk_level:'Medium',geopolitical:'Water rights, nationalization risk',esg_concern:'Water depletion in Atacama'},
  ZA:{name:'South Africa',commodities_dominated:['PLATINUM','MANGANESE','CHROMIUM'],share_avg:60,risk_level:'High',geopolitical:'Load shedding, logistics',esg_concern:'Mining safety, community displacement'},
  RU:{name:'Russia',commodities_dominated:['PALLADIUM','NICKEL','URANIUM','NG_PIPELINE'],share_avg:38,risk_level:'Very High',geopolitical:'Sanctions, war in Ukraine',esg_concern:'Environmental disasters (Nornickel)'},
  ID:{name:'Indonesia',commodities_dominated:['PALM_OIL','NICKEL','TIN','COAL'],share_avg:48,risk_level:'High',geopolitical:'Nickel ore export ban',esg_concern:'Deforestation, peatland fires, mining env.'},
  BR:{name:'Brazil',commodities_dominated:['IRON_ORE','SOY','COFFEE','NIOBIUM','SUGAR'],share_avg:25,risk_level:'Medium',geopolitical:'Amazon deforestation politics',esg_concern:'Vale dam disasters, Cerrado clearing'},
  SA:{name:'Saudi Arabia',commodities_dominated:['WTI_BRENT_EQUIV'],share_avg:13,risk_level:'Medium',geopolitical:'OPEC+ production decisions',esg_concern:'Human rights, energy transition'},
  PE:{name:'Peru',commodities_dominated:['COPPER','ZINC','SILVER'],share_avg:12,risk_level:'Medium',geopolitical:'Political instability, community protests',esg_concern:'Mining water conflicts'},
  MY:{name:'Malaysia',commodities_dominated:['PALM_OIL'],share_avg:25,risk_level:'Medium',geopolitical:'EUDR compliance',esg_concern:'Forced labor in plantations'},
  IN:{name:'India',commodities_dominated:['COTTON','COAL_DOMESTIC','IRON_ORE_DOMESTIC'],share_avg:18,risk_level:'Medium',geopolitical:'Export restrictions on wheat, rice',esg_concern:'Farmer distress, water stress'},
};

/* ================================================================= COMMODITY REGULATORY TIMELINE */
const REGULATORY_TIMELINE = [
  {date:'2023-10',event:'EU CBAM transitional phase begins',commodities:['STEEL','ALUMINUM','CEMENT'],impact:'Reporting obligations for importers'},
  {date:'2023-12',event:'China export controls on gallium & germanium',commodities:['GALLIUM','GERMANIUM'],impact:'Licensing requirements, supply disruption'},
  {date:'2024-01',event:'EU Deforestation Regulation (EUDR) enters force',commodities:['PALM_OIL','SOY','COCOA','COFFEE','RUBBER','TIMBER','CATTLE'],impact:'Due diligence on deforestation-free supply chains'},
  {date:'2024-03',event:'EU Critical Raw Materials Act published',commodities:['LITHIUM','COBALT','RARE_EARTH','GRAPHITE','MANGANESE','GALLIUM','GERMANIUM'],impact:'Benchmarks: 10% extraction, 40% processing, 25% recycling in EU'},
  {date:'2024-06',event:'China restricts antimony exports',commodities:['ANTIMONY'],impact:'Licensing requirements, 60% price surge'},
  {date:'2024-09',event:'Indonesia nickel export tax raised',commodities:['NICKEL'],impact:'Downstream processing incentive, higher global prices'},
  {date:'2025-01',event:'ISSB/IFRS S1 & S2 climate disclosures effective',commodities:['ALL'],impact:'Mandatory scope 1-3 emissions reporting for listed companies'},
  {date:'2025-03',event:'EU CBAM definitive phase begins',commodities:['STEEL','ALUMINUM','CEMENT','HYDROGEN','FERTILIZER','ELECTRICITY'],impact:'Carbon certificates required for imports'},
  {date:'2025-06',event:'EU battery regulation due diligence obligations',commodities:['LITHIUM','COBALT','NICKEL','GRAPHITE','MANGANESE'],impact:'Battery passport, carbon footprint declaration'},
  {date:'2026-01',event:'EUDR full enforcement begins',commodities:['PALM_OIL','SOY','COCOA','COFFEE','RUBBER','TIMBER','CATTLE'],impact:'Fines up to 4% of EU turnover for non-compliance'},
  {date:'2027-01',event:'EU CBAM full implementation',commodities:['STEEL','ALUMINUM','CEMENT','HYDROGEN'],impact:'Full carbon border tax on imports'},
  {date:'2030-01',event:'EU 55% emissions reduction target deadline',commodities:['EUA','COAL','NG','STEEL','CEMENT'],impact:'Accelerated phase-out of free allowances'},
];

/* ================================================================= COMMODITY SUBSTITUTION MAP */
const SUBSTITUTION_MAP = [
  {original:'Cobalt (NMC)',substitute:'LFP (Iron Phosphate)',readiness:90,impact:'-30% cobalt demand by 2028',driver:'Tesla, BYD shifting to LFP'},
  {original:'Lithium (Li-ion)',substitute:'Sodium-ion (Na-ion)',readiness:45,impact:'-15% lithium demand by 2030',driver:'CATL mass production 2024'},
  {original:'Platinum (autocatalyst)',substitute:'Palladium / BEV (no cat needed)',readiness:85,impact:'-25% platinum demand (autocatalyst)',driver:'EV adoption reducing ICE catalysts'},
  {original:'Thermal Coal',substitute:'Natural Gas / Renewables',readiness:95,impact:'Phase-out by 2040 OECD',driver:'Climate policy, cost competitiveness'},
  {original:'Coking Coal (BF steel)',substitute:'Green H2 DRI + EAF',readiness:35,impact:'-50% coking coal by 2045',driver:'SSAB HYBRIT, ArcelorMittal'},
  {original:'Rare Earth Magnets',substitute:'Ferrite magnets / wound rotor',readiness:30,impact:'-10% RE demand',driver:'Renault, BMW exploring RE-free motors'},
  {original:'Copper (power cables)',substitute:'Aluminum conductors',readiness:70,impact:'-5% copper demand in grid',driver:'Cost advantage, weight savings'},
  {original:'Natural Rubber',substitute:'Synthetic rubber (butadiene)',readiness:80,impact:'Synthetic already 60% of market',driver:'Petrochemical cost, consistency'},
  {original:'Cotton',substitute:'Recycled cotton / Lyocell',readiness:55,impact:'EU 25% recycled content target 2030',driver:'Renewcell, Worn Again technologies'},
  {original:'Graphite (anode)',substitute:'Silicon anodes',readiness:40,impact:'-20% graphite by 2032',driver:'Sila Nano, Enovix commercializing'},
  {original:'Palm Oil (food)',substitute:'High-oleic sunflower / algae',readiness:25,impact:'<1% substituted today',driver:'R&D stage, scalability uncertain'},
  {original:'Sand (concrete)',substitute:'Recycled aggregate / geopolymer',readiness:50,impact:'-15% virgin sand by 2035',driver:'EU circular economy regulation'},
];

/* ================================================================= HELPERS */
const LS_PORT='ra_portfolio_v1';
const loadLS=k=>{try{return JSON.parse(localStorage.getItem(k))||null}catch{return null}};
const saveLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const seed=s=>{let x=Math.sin(s*9973+7)*10000;return x-Math.floor(x)};
const fmt=(n,d=1)=>n==null?'\u2014':Number(n).toFixed(d);
const pct=n=>n==null?'\u2014':`${n>0?'+':''}${Number(n).toFixed(1)}%`;
const fmtPrice=n=>{if(n==null)return'\u2014';if(n>=1000000)return`$${(n/1000000).toFixed(1)}M`;if(n>=10000)return`$${(n/1000).toFixed(1)}K`;if(n>=1)return`$${Number(n).toFixed(2)}`;return`$${Number(n).toFixed(4)}`};
const getCache=(ns,k)=>{try{const c=JSON.parse(localStorage.getItem(`ra_cache_${ns}_${k}`));if(c&&Date.now()-c.ts<c.ttl*3600000)return c.data;return null}catch{return null}};
const setCache=(ns,k,data,ttlH)=>{try{localStorage.setItem(`ra_cache_${ns}_${k}`,JSON.stringify({data,ts:Date.now(),ttl:ttlH}))}catch{}};

async function fetchCommodityPrice(ticker){
  const apiKey=localStorage.getItem('ra_eodhd_api_key')||'';
  if(!apiKey)return null;
  const cache=getCache('commodity',ticker);
  if(cache)return cache;
  try{
    const url=`https://eodhd.com/api/eod/${ticker}?api_token=${apiKey}&fmt=json&order=d&limit=30`;
    const res=await fetch(url);
    const data=await res.json();
    setCache('commodity',ticker,data,24);
    return data;
  }catch{return null}
}

const genPriceHistory=(basePrice,days=30,volatility=0.02,id='X')=>{
  const pts=[];let p=basePrice*(1+seed(id.length*17)*0.1-0.05);
  for(let i=0;i<days;i++){
    p=p*(1+(seed(i*31+id.length*7)*volatility*2-volatility));
    const d=new Date();d.setDate(d.getDate()-days+i);
    pts.push({date:d.toISOString().slice(0,10),price:Math.round(p*100)/100,day:i+1});
  }
  return pts;
};

/* ML: Simple linear regression on lagged features for price prediction */
const mlPredictPrice=(history)=>{
  if(!history||history.length<10)return{predicted:null,r2:0,trend:'Unknown',confidence:0};
  const n=history.length;
  const xs=history.map((_,i)=>i);
  const ys=history.map(p=>p.price);
  const xMean=xs.reduce((a,b)=>a+b,0)/n;
  const yMean=ys.reduce((a,b)=>a+b,0)/n;
  let num=0,den=0;
  for(let i=0;i<n;i++){num+=(xs[i]-xMean)*(ys[i]-yMean);den+=(xs[i]-xMean)*(xs[i]-xMean)}
  const slope=den!==0?num/den:0;
  const intercept=yMean-slope*xMean;
  const predicted=Math.round((slope*n+intercept)*100)/100;
  let ssTot=0,ssRes=0;
  for(let i=0;i<n;i++){ssTot+=(ys[i]-yMean)**2;ssRes+=(ys[i]-(slope*xs[i]+intercept))**2}
  const r2=ssTot>0?Math.round((1-ssRes/ssTot)*1000)/1000:0;
  const trend=slope>0?'Bullish':slope<0?'Bearish':'Neutral';
  const confidence=Math.min(95,Math.max(20,Math.round(Math.abs(r2)*100)));
  const pctChange=history[0].price>0?Math.round((predicted-history[n-1].price)/history[n-1].price*10000)/100:0;
  return{predicted,r2,trend,confidence,slope:Math.round(slope*100)/100,intercept:Math.round(intercept*100)/100,pctChange};
};

const CORRELATION_COMMODITIES=['WTI','BRENT','NG','GOLD','COPPER','LITHIUM','EUA','WHEAT','IRON_ORE','SILVER','COBALT','PALM_OIL','NICKEL','PLATINUM','COAL'];
const genCorrelation=()=>{
  const m=[];
  for(let i=0;i<CORRELATION_COMMODITIES.length;i++){
    const row={commodity:CORRELATION_COMMODITIES[i]};
    for(let j=0;j<CORRELATION_COMMODITIES.length;j++){
      if(i===j)row[CORRELATION_COMMODITIES[j]]=1.0;
      else if(j<i)row[CORRELATION_COMMODITIES[j]]=m[j][CORRELATION_COMMODITIES[i]];
      else{
        let v=seed(i*101+j*53)*1.6-0.8;
        if(CORRELATION_COMMODITIES[i]==='WTI'&&CORRELATION_COMMODITIES[j]==='BRENT')v=0.95;
        if(CORRELATION_COMMODITIES[i]==='WTI'&&CORRELATION_COMMODITIES[j]==='NG')v=0.55;
        if(CORRELATION_COMMODITIES[i]==='GOLD'&&CORRELATION_COMMODITIES[j]==='SILVER')v=0.88;
        if(CORRELATION_COMMODITIES[i]==='GOLD'&&CORRELATION_COMMODITIES[j]==='PLATINUM')v=0.72;
        if(CORRELATION_COMMODITIES[i]==='COPPER'&&CORRELATION_COMMODITIES[j]==='NICKEL')v=0.65;
        if(CORRELATION_COMMODITIES[i]==='COBALT'&&CORRELATION_COMMODITIES[j]==='LITHIUM')v=0.78;
        if(CORRELATION_COMMODITIES[i]==='IRON_ORE'&&CORRELATION_COMMODITIES[j]==='COAL')v=0.60;
        if(CORRELATION_COMMODITIES[i]==='WTI'&&CORRELATION_COMMODITIES[j]==='PALM_OIL')v=0.42;
        row[CORRELATION_COMMODITIES[j]]=Math.round(Math.max(-1,Math.min(1,v))*100)/100;
      }
    }
    m.push(row);
  }
  return m;
};

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
  const cs={green:{bg:'#dcfce7',fg:'#166534'},red:{bg:'#fee2e2',fg:'#991b1b'},amber:{bg:'#fef3c7',fg:'#92400e'},blue:{bg:'#dbeafe',fg:'#1e40af'},purple:{bg:'#ede9fe',fg:'#5b21b6'},gray:{bg:'#f3f4f6',fg:'#374151'},teal:{bg:'#ccfbf1',fg:'#115e59'},pink:{bg:'#fce7f3',fg:'#9d174d'}};
  const c=cs[color]||cs.gray;
  return <span style={{padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:700,background:c.bg,color:c.fg}}>{label}</span>;
};
const Section=({title,badge,children})=>(
  <div style={{marginBottom:28}}>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,paddingBottom:10,borderBottom:`2px solid ${T.gold}`}}>
      <span style={{fontSize:16,fontWeight:700,color:T.navy}}>{title}</span>
      {badge&&<Badge label={badge} color="blue"/>}
    </div>
    {children}
  </div>
);
const Tabs=({tabs,active,onChange})=>(
  <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:16}}>
    {tabs.map(t=><button key={t.key||t} onClick={()=>onChange(t.key||t)} style={{padding:'7px 16px',borderRadius:8,border:`1px solid ${(t.key||t)===active?T.navy:T.border}`,background:(t.key||t)===active?T.navy:T.surface,color:(t.key||t)===active?'#fff':T.text,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>{t.icon?`${t.icon} `:''}{t.label||t}</button>)}
  </div>
);
const SortTH=({label,field,sort,onSort,style})=>(
  <th onClick={()=>onSort(field)} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,cursor:'pointer',borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',...style}}>
    {label}{sort.field===field?(sort.asc?' \u25B2':' \u25BC'):''}
  </th>
);
const TD=({children,style})=><td style={{padding:'10px 12px',fontSize:13,color:T.text,borderBottom:`1px solid ${T.border}`,...style}}>{children}</td>;
const Btn=({children,onClick,primary,small,style})=>(
  <button onClick={onClick} style={{padding:small?'5px 12px':'8px 18px',borderRadius:8,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,fontSize:small?12:13,fontWeight:600,cursor:'pointer',fontFamily:T.font,...style}}>{children}</button>
);

/* ================================================================= MAIN */
export default function CommodityIntelligencePage(){
  const navigate=useNavigate();
  const [activeCat,setActiveCat]=useState('ALL');
  const [sort,setSort]=useState({field:'ytd_change',asc:false});
  const [selectedComm,setSelectedComm]=useState('EUA');
  const [liveData,setLiveData]=useState({});
  const [apiKey,setApiKey]=useState(localStorage.getItem('ra_eodhd_api_key')||'');
  const [apiStatus,setApiStatus]=useState('');
  const [compareComms,setCompareComms]=useState(['WTI','GOLD','COPPER']);
  const [priceSlider,setPriceSlider]=useState(50);
  const [searchQ,setSearchQ]=useState('');
  const [mlView,setMlView]=useState(false);

  /* portfolio */
  const portfolio=useMemo(()=>{
    const raw=loadLS(LS_PORT);
    const base=raw&&Array.isArray(raw)?raw:(GLOBAL_COMPANY_MASTER||[]).slice(0,30);
    return base.map((c,i)=>({...c,company_name:c.company_name||c.company||`Company ${i+1}`,sector:c.sector||'Diversified',weight:c.weight||+(seed(i*7)*4+0.5).toFixed(2)}));
  },[]);

  const allComms=useMemo(()=>ALL_COMMODITIES,[]);
  const filteredComms=useMemo(()=>{
    let list=activeCat==='ALL'?allComms:allComms.filter(c=>c.catKey===activeCat);
    if(searchQ){const q=searchQ.toLowerCase();list=list.filter(c=>c.id.toLowerCase().includes(q)||c.name.toLowerCase().includes(q)||c.catName.toLowerCase().includes(q))}
    list=[...list].sort((a,b)=>{
      const av=a[sort.field],bv=b[sort.field];
      if(av==null)return 1;if(bv==null)return -1;
      return sort.asc?(av>bv?1:-1):(av<bv?1:-1);
    });
    return list;
  },[activeCat,allComms,sort,searchQ]);

  const doSort=f=>setSort(p=>({field:f,asc:p.field===f?!p.asc:false}));

  const selectedObj=useMemo(()=>allComms.find(c=>c.id===selectedComm)||allComms[0],[selectedComm,allComms]);
  const priceHistory=useMemo(()=>genPriceHistory(selectedObj.price,30,0.025,selectedObj.id),[selectedObj]);
  const mlResult=useMemo(()=>mlPredictPrice(priceHistory),[priceHistory]);
  const correlationMatrix=useMemo(()=>genCorrelation(),[]);

  /* KPI computations */
  const eudrComms=allComms.filter(c=>c.eudr_regulated);
  const highRisk=allComms.filter(c=>c.supply_risk==='High'||c.supply_risk==='Very High');
  const strandedExp=allComms.filter(c=>c.stranded_risk);
  const bestPerf=useMemo(()=>[...allComms].filter(c=>c.ytd_change!=null).sort((a,b)=>b.ytd_change-a.ytd_change)[0],[allComms]);
  const worstPerf=useMemo(()=>[...allComms].filter(c=>c.ytd_change!=null).sort((a,b)=>a.ytd_change-b.ytd_change)[0],[allComms]);
  const supplyDeficitComms=allComms.filter(c=>c.balance_mt!=null&&c.balance_mt<0);

  /* portfolio exposure */
  const portfolioExposure=useMemo(()=>{
    const sectorTotals={};
    portfolio.forEach(c=>{
      const sec=c.sector||'Other';
      if(!sectorTotals[sec])sectorTotals[sec]={sector:sec,weight:0,primary:0,secondary:0,carbon:0,tertiary:0};
      sectorTotals[sec].weight+=c.weight;
      const exp=SECTOR_COMMODITY_EXPOSURE[sec]||{primary:[],secondary:[],carbon:[],tertiary:[]};
      sectorTotals[sec].primary+=exp.primary.length*c.weight;
      sectorTotals[sec].secondary+=exp.secondary.length*c.weight;
      sectorTotals[sec].carbon+=exp.carbon.length*c.weight;
      sectorTotals[sec].tertiary+=(exp.tertiary||[]).length*c.weight;
    });
    return Object.values(sectorTotals).sort((a,b)=>b.weight-a.weight);
  },[portfolio]);

  /* company linkage */
  const companyLinkage=useMemo(()=>{
    return portfolio.slice(0,20).map((c,i)=>{
      const exp=SECTOR_COMMODITY_EXPOSURE[c.sector]||{primary:[],secondary:[],carbon:[],tertiary:[]};
      const all=[...exp.primary,...exp.secondary,...exp.carbon,...(exp.tertiary||[])];
      return{company:c.company_name,sector:c.sector,weight:c.weight,commodities:all.length,primary:exp.primary.length,riskScore:Math.round(30+seed(i*41)*65)};
    }).sort((a,b)=>b.riskScore-a.riskScore);
  },[portfolio]);

  /* green premium data */
  const greenPremium=[
    {commodity:'Steel (HRC)',conventional:680,green:850,premium:25},
    {commodity:'Aluminum',conventional:2350,green:2703,premium:15},
    {commodity:'Cement',conventional:125,green:175,premium:40},
    {commodity:'Hydrogen (Gray vs Green)',conventional:1.5,green:4.5,premium:200},
    {commodity:'Ammonia (Conv vs Green)',conventional:350,green:800,premium:129},
    {commodity:'Methanol (Conv vs Green)',conventional:380,green:700,premium:84},
  ];

  /* food security */
  const foodSecurity=[
    {commodity:'Wheat',price:5.85,change:-10,vulnerability:78,importDependent:'52 countries',climateImpact:'Heat stress, drought'},
    {commodity:'Corn',price:4.35,change:-8,vulnerability:65,importDependent:'38 countries',climateImpact:'Drought, flooding'},
    {commodity:'Rice',price:15.20,change:5,vulnerability:88,importDependent:'65 countries',climateImpact:'Monsoon shifts, sea-level rise'},
    {commodity:'Sugar',price:0.22,change:-15,vulnerability:42,importDependent:'30 countries',climateImpact:'Temperature, rainfall patterns'},
    {commodity:'Orange Juice',price:4.80,change:85,vulnerability:72,importDependent:'15 countries',climateImpact:'Citrus greening, hurricanes'},
    {commodity:'Coffee',price:3.85,change:55,vulnerability:68,importDependent:'80+ countries',climateImpact:'Temperature rise, bean belt shift'},
    {commodity:'Cocoa',price:8500,change:120,vulnerability:82,importDependent:'40 countries',climateImpact:'West Africa drying, swollen shoot virus'},
  ];

  /* geopolitical supply concentration */
  const geopoliticalRisk=[
    {commodity:'Rare Earths',topCountry:'China',share:60,risk:'Very High',impact:'EV magnets, wind turbines'},
    {commodity:'Cobalt',topCountry:'DR Congo',share:73,risk:'Very High',impact:'EV batteries, electronics'},
    {commodity:'Lithium',topCountry:'Australia',share:47,risk:'High',impact:'EV batteries, grid storage'},
    {commodity:'Palladium',topCountry:'Russia',share:40,risk:'Very High',impact:'Catalytic converters'},
    {commodity:'Platinum',topCountry:'South Africa',share:72,risk:'High',impact:'Fuel cells, catalysts'},
    {commodity:'Graphite',topCountry:'China',share:65,risk:'Very High',impact:'Battery anodes'},
    {commodity:'Silicon',topCountry:'China',share:75,risk:'Very High',impact:'Solar panels, semiconductors'},
    {commodity:'Tin',topCountry:'China',share:31,risk:'Medium',impact:'Solder, electronics'},
    {commodity:'Gallium',topCountry:'China',share:98,risk:'Very High',impact:'Semiconductors, 5G'},
    {commodity:'Germanium',topCountry:'China',share:60,risk:'Very High',impact:'Fiber optics, IR sensors'},
    {commodity:'Antimony',topCountry:'China',share:55,risk:'Very High',impact:'Flame retardants, batteries'},
    {commodity:'Magnesium',topCountry:'China',share:85,risk:'Very High',impact:'Automotive light-weighting'},
    {commodity:'Tungsten',topCountry:'China',share:80,risk:'Very High',impact:'Cutting tools, defense'},
    {commodity:'Niobium',topCountry:'Brazil',share:90,risk:'High',impact:'High-strength steel alloys'},
  ];

  /* carbon markets */
  const carbonComms=COMMODITY_UNIVERSE.carbon.commodities;

  /* compare overlay */
  const compareOverlay=useMemo(()=>{
    const series={};
    compareComms.forEach(id=>{
      const c=allComms.find(x=>x.id===id);
      if(c){
        const hist=genPriceHistory(c.price,30,0.025,c.id);
        const baseP=hist[0].price;
        hist.forEach(p=>{
          if(!series[p.date])series[p.date]={date:p.date};
          series[p.date][id]=Math.round((p.price/baseP-1)*10000)/100;
        });
      }
    });
    return Object.values(series);
  },[compareComms,allComms]);

  /* EODHD fetch */
  const handleFetchLive=useCallback(async()=>{
    if(!apiKey){setApiStatus('No API key');return;}
    localStorage.setItem('ra_eodhd_api_key',apiKey);
    setApiStatus('Fetching...');
    const tickers=allComms.filter(c=>c.eodhd_ticker).slice(0,5);
    const results={};
    for(const c of tickers){
      const data=await fetchCommodityPrice(c.eodhd_ticker);
      if(data&&data.length)results[c.id]={lastPrice:data[0]?.close,date:data[0]?.date,data};
    }
    setLiveData(results);
    setApiStatus(`Fetched ${Object.keys(results).length} commodities`);
  },[apiKey,allComms]);

  /* exports */
  const exportCSV=()=>{
    const hdr='ID,Name,Category,Price,Unit,YTD%,Supply Risk,EUDR,Vol30D,Supply_MT,Demand_MT,Balance_MT';
    const rows=allComms.map(c=>`${c.id},"${c.name}",${c.catName},${c.price},${c.unit},${c.ytd_change||''},${c.supply_risk||''},${c.eudr_regulated?'Yes':'No'},${c.vol_30d||''},${c.supply_mt||''},${c.demand_mt||''},${c.balance_mt||''}`);
    const blob=new Blob([hdr+'\n'+rows.join('\n')],{type:'text/csv'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='commodity_database_120.csv';a.click();
  };
  const exportJSON=()=>{
    const data={commodities:allComms,portfolioExposure,correlationMatrix,sectorDependency:SECTOR_COMMODITY_EXPOSURE,timestamp:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='commodity_exposure_report_120.json';a.click();
  };

  const catTabs=[{key:'ALL',label:`All (${TOTAL_COMM_COUNT})`,icon:''},
    ...Object.entries(COMMODITY_UNIVERSE).map(([k,v])=>({key:k,label:`${v.icon} ${v.name} (${v.commodities.length})`}))];

  /* ================================================================= RENDER */
  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font}}>
      <div style={{maxWidth:1440,margin:'0 auto',padding:'24px 32px'}}>

        {/* HEADER */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,color:T.navy,margin:0}}>Commodity Market Intelligence</h1>
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <Badge label={`${TOTAL_COMM_COUNT} Commodities`} color="blue"/>
              <Badge label={`${Object.keys(COMMODITY_UNIVERSE).length} Categories`} color="purple"/>
              <Badge label="ML Price Prediction" color="teal"/>
              <Badge label="EODHD + Real-Time" color="green"/>
              <Badge label="EP-Y1" color="gray"/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={exportCSV} small>CSV Export</Btn>
            <Btn onClick={exportJSON} small>JSON Report</Btn>
            <Btn onClick={()=>setMlView(!mlView)} small primary={mlView}>{mlView?'Hide ML':'ML Predictions'}</Btn>
            <Btn onClick={()=>window.print()} small>Print</Btn>
          </div>
        </div>

        {/* SEARCH + CATEGORY TABS */}
        <Section title="Category Filter">
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search commodities by name, ID, or category..." style={{width:'100%',padding:'10px 16px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,marginBottom:12,boxSizing:'border-box'}}/>
          <Tabs tabs={catTabs} active={activeCat} onChange={setActiveCat}/>
        </Section>

        {/* 12 KPI CARDS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:28}}>
          <KPI label="Commodities Tracked" value={TOTAL_COMM_COUNT} sub={`${Object.keys(COMMODITY_UNIVERSE).length} categories`}/>
          <KPI label="Categories" value={Object.keys(COMMODITY_UNIVERSE).length} sub="Carbon to Shipping"/>
          <KPI label="Carbon Price (EUA)" value={`\u20AC${fmt(88.50,2)}`} sub={pct(12.5)} color={T.green}/>
          <KPI label="Oil Price (WTI)" value={`$${fmt(72.50,2)}`} sub={pct(-8.5)} color={T.red}/>
          <KPI label="Lithium Price" value={fmtPrice(12500)} sub={pct(-65)} color={T.red}/>
          <KPI label="Gold Price" value={`$${fmt(2650,0)}`} sub={pct(28)} color={T.gold}/>
          <KPI label="Portfolio Commodity Exp." value={`${Math.round(portfolioExposure.reduce((s,x)=>s+x.primary,0)/Math.max(1,portfolio.length))}%`} sub="Avg primary exposure"/>
          <KPI label="EUDR-Regulated" value={eudrComms.length} sub="Commodities under EUDR"/>
          <KPI label="High Supply Risk" value={highRisk.length} sub="Minerals with concentrated supply"/>
          <KPI label="Supply Deficit" value={supplyDeficitComms.length} sub="Demand exceeds supply" color={T.amber}/>
          <KPI label="YTD Best" value={bestPerf?`${bestPerf.id} ${pct(bestPerf.ytd_change)}`:'\u2014'} sub={bestPerf?.name} color={T.green}/>
          <KPI label="YTD Worst" value={worstPerf?`${worstPerf.id} ${pct(worstPerf.ytd_change)}`:'\u2014'} sub={worstPerf?.name} color={T.red}/>
        </div>

        {/* ML PRICE PREDICTION PANEL */}
        {mlView&&(
          <Section title="ML Price Prediction Engine" badge="Linear Regression on Lagged Features">
            <Card>
              <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:20}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Prediction for: {selectedObj.name}</div>
                  <div style={{display:'grid',gap:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'8px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Current Price</span><span style={{fontWeight:700}}>{fmtPrice(selectedObj.price)}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'8px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Predicted (Day 31)</span><span style={{fontWeight:700,color:mlResult.pctChange>0?T.green:T.red}}>{fmtPrice(mlResult.predicted)}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'8px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Predicted Change</span><span style={{fontWeight:700,color:mlResult.pctChange>0?T.green:T.red}}>{mlResult.pctChange>0?'+':''}{mlResult.pctChange}%</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'8px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Trend Signal</span><Badge label={mlResult.trend} color={mlResult.trend==='Bullish'?'green':mlResult.trend==='Bearish'?'red':'gray'}/></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'8px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>R-squared</span><span style={{fontWeight:600}}>{mlResult.r2}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'8px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Confidence</span><span style={{fontWeight:700,color:mlResult.confidence>=70?T.green:mlResult.confidence>=40?T.amber:T.red}}>{mlResult.confidence}%</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'8px 0'}}><span style={{color:T.textMut}}>Slope / Intercept</span><span style={{fontFamily:'monospace',fontSize:11}}>{mlResult.slope} / {mlResult.intercept}</span></div>
                  </div>
                </div>
                <div>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={[...priceHistory,{date:'Predicted',price:mlResult.predicted,day:31}]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="date" tick={{fontSize:9}} tickFormatter={v=>v==='Predicted'?'P':v.slice(5)}/>
                      <YAxis tick={{fontSize:10}} domain={['auto','auto']}/>
                      <Tooltip formatter={v=>[`$${Number(v).toFixed(2)}`,'Price']}/>
                      <Legend/>
                      <Area type="monotone" dataKey="price" name="Historical" stroke={T.navyL} fill={T.navyL+'20'} strokeWidth={2}/>
                      <Line type="linear" dataKey="price" name="Trend Line" stroke={T.red} strokeDasharray="5 5" strokeWidth={1} dot={false}/>
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Model: y = {mlResult.slope}x + {mlResult.intercept} | Features: 30-day lagged prices | R2 = {mlResult.r2}</div>
                </div>
              </div>
              <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
                {['WTI','GOLD','LITHIUM','COPPER','EUA','WHEAT','COCOA','SILVER','IRON_ORE','NG','PALM_OIL','COBALT'].map(id=>{
                  const c=allComms.find(x=>x.id===id);if(!c)return null;
                  const h=genPriceHistory(c.price,30,0.025,c.id);
                  const ml=mlPredictPrice(h);
                  return(
                    <div key={id} onClick={()=>setSelectedComm(id)} style={{padding:10,borderRadius:8,background:selectedComm===id?T.surfaceH:T.surface,border:`1px solid ${T.border}`,cursor:'pointer',textAlign:'center'}}>
                      <div style={{fontSize:11,fontWeight:700,color:c.catColor}}>{id}</div>
                      <div style={{fontSize:14,fontWeight:700,color:ml.pctChange>0?T.green:T.red,marginTop:2}}>{ml.pctChange>0?'+':''}{ml.pctChange}%</div>
                      <div style={{fontSize:9,color:T.textMut}}>{ml.trend} | R2:{ml.r2}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Section>
        )}

        {/* COMMODITY PRICE DASHBOARD */}
        <Section title="Commodity Price Dashboard" badge={`${filteredComms.length} commodities`}>
          <div style={{overflowX:'auto',maxHeight:600}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead style={{position:'sticky',top:0,zIndex:1}}>
                <tr style={{background:T.surfaceH}}>
                  <SortTH label="ID" field="id" sort={sort} onSort={doSort}/>
                  <SortTH label="Commodity" field="name" sort={sort} onSort={doSort}/>
                  <SortTH label="Category" field="catName" sort={sort} onSort={doSort}/>
                  <SortTH label="Price" field="price" sort={sort} onSort={doSort} style={{textAlign:'right'}}/>
                  <SortTH label="Unit" field="unit" sort={sort} onSort={doSort}/>
                  <SortTH label="YTD %" field="ytd_change" sort={sort} onSort={doSort} style={{textAlign:'right'}}/>
                  <SortTH label="Vol 30D" field="vol_30d" sort={sort} onSort={doSort} style={{textAlign:'right'}}/>
                  <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Supply Risk</th>
                  <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>ESG Flags</th>
                  <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>S/D Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredComms.map(c=>(
                  <tr key={c.id} style={{cursor:'pointer',background:selectedComm===c.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedComm(c.id)}>
                    <TD><span style={{fontWeight:700,color:c.catColor,fontSize:12}}>{c.id}</span></TD>
                    <TD style={{fontWeight:600,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</TD>
                    <TD><span style={{fontSize:10,padding:'2px 6px',borderRadius:8,background:c.catColor+'18',color:c.catColor,fontWeight:600}}>{c.catName}</span></TD>
                    <TD style={{textAlign:'right',fontWeight:700,fontFamily:'monospace'}}>{fmtPrice(c.price)}</TD>
                    <TD style={{fontSize:11,color:T.textMut}}>{c.unit}</TD>
                    <TD style={{textAlign:'right',fontWeight:700,color:c.ytd_change>0?T.green:c.ytd_change<0?T.red:T.textMut}}>{c.ytd_change!=null?pct(c.ytd_change):'\u2014'}</TD>
                    <TD style={{textAlign:'right',fontSize:11}}>{c.vol_30d?<span style={{padding:'2px 6px',borderRadius:6,fontSize:10,fontWeight:600,background:c.vol_30d>=30?'#fee2e2':c.vol_30d>=20?'#fef3c7':'#dcfce7',color:c.vol_30d>=30?T.red:c.vol_30d>=20?T.amber:T.green}}>{c.vol_30d}%</span>:'\u2014'}</TD>
                    <TD>{c.supply_risk?<Badge label={c.supply_risk} color={c.supply_risk==='Very High'?'red':c.supply_risk==='High'?'amber':'gray'}/>:'\u2014'}</TD>
                    <TD style={{fontSize:11}}>
                      {c.eudr_regulated&&<Badge label="EUDR" color="amber"/>}
                      {c.child_labor_risk&&<Badge label="Child Labor" color="red"/>}
                      {c.stranded_risk&&<Badge label="Stranded" color="red"/>}
                      {c.geopolitical_risk&&<Badge label="Geo" color="purple"/>}
                      {c.conflict_mineral&&<Badge label="Conflict" color="red"/>}
                    </TD>
                    <TD style={{fontSize:11,fontWeight:600,color:c.balance_mt>0?T.green:c.balance_mt<0?T.red:T.textMut}}>{c.balance_mt!=null?(c.balance_mt>0?'Surplus':'Deficit'):'\u2014'}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* PRICE TREND CHART */}
        <Section title={`Price Trend: ${selectedObj.name}`} badge="30 Days">
          <Card>
            <div style={{display:'flex',gap:12,marginBottom:12,flexWrap:'wrap'}}>
              <select value={selectedComm} onChange={e=>setSelectedComm(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font}}>
                {allComms.map(c=><option key={c.id} value={c.id}>{c.id} - {c.name}</option>)}
              </select>
              <span style={{fontSize:13,color:T.textSec,alignSelf:'center'}}>Current: {fmtPrice(selectedObj.price)} {selectedObj.unit} | YTD: {pct(selectedObj.ytd_change)} | Vol: {selectedObj.vol_30d||'N/A'}%</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={priceHistory}>
                <defs><linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={selectedObj.catColor||T.navy} stopOpacity={0.3}/><stop offset="95%" stopColor={selectedObj.catColor||T.navy} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v.slice(5)}/>
                <YAxis tick={{fontSize:10}} domain={['auto','auto']}/>
                <Tooltip formatter={v=>[`$${Number(v).toFixed(2)}`,'Price']}/>
                <Area type="monotone" dataKey="price" stroke={selectedObj.catColor||T.navy} fill="url(#pGrad)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* CARBON PRICE INTELLIGENCE */}
        <Section title="Carbon Price Intelligence" badge={`${carbonComms.length} Markets`}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Carbon Market Comparison</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  <th style={{padding:'8px',fontSize:11,textAlign:'left',color:T.textMut,fontWeight:700,borderBottom:`2px solid ${T.border}`}}>Market</th>
                  <th style={{padding:'8px',fontSize:11,textAlign:'right',color:T.textMut,fontWeight:700,borderBottom:`2px solid ${T.border}`}}>Price</th>
                  <th style={{padding:'8px',fontSize:11,textAlign:'right',color:T.textMut,fontWeight:700,borderBottom:`2px solid ${T.border}`}}>YTD</th>
                  <th style={{padding:'8px',fontSize:11,textAlign:'right',color:T.textMut,fontWeight:700,borderBottom:`2px solid ${T.border}`}}>Volume (MtCO2)</th>
                  <th style={{padding:'8px',fontSize:11,textAlign:'right',color:T.textMut,fontWeight:700,borderBottom:`2px solid ${T.border}`}}>S/D</th>
                </tr></thead>
                <tbody>
                  {carbonComms.map(c=>(
                    <tr key={c.id}><TD style={{fontWeight:600,fontSize:12}}>{c.name}</TD><TD style={{textAlign:'right',fontFamily:'monospace',fontSize:12}}>{fmtPrice(c.price)}</TD><TD style={{textAlign:'right',color:c.ytd_change>0?T.green:T.red,fontWeight:600,fontSize:12}}>{pct(c.ytd_change)}</TD><TD style={{textAlign:'right',fontSize:12}}>{c.global_volume_mt||'\u2014'}</TD><TD style={{textAlign:'right',fontSize:11,color:c.balance_mt>=0?T.green:T.red}}>{c.balance_mt>0?'Surplus':'Deficit'}</TD></tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Carbon Vintage Pricing History</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={CARBON_VINTAGE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="year" tick={{fontSize:10}}/>
                  <YAxis tick={{fontSize:10}}/>
                  <Tooltip/>
                  <Legend/>
                  <Line type="monotone" dataKey="EUA" stroke="#16a34a" strokeWidth={2} dot={{r:3}}/>
                  <Line type="monotone" dataKey="CCA" stroke="#0284c7" strokeWidth={2} dot={{r:3}}/>
                  <Line type="monotone" dataKey="VCU" stroke="#d97706" strokeWidth={2} dot={{r:3}}/>
                  <Line type="monotone" dataKey="UKA" stroke="#7c3aed" strokeWidth={2} dot={{r:3}} connectNulls={false}/>
                  <Line type="monotone" dataKey="CEA" stroke="#dc2626" strokeWidth={2} dot={{r:3}} connectNulls={false}/>
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </Section>

        {/* SUPPLY/DEMAND BALANCE SHEET */}
        <Section title="Supply / Demand Balance Sheets" badge="Surplus & Deficit">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:8}}>Commodities in Deficit</div>
                {supplyDeficitComms.slice(0,12).map(c=>(
                  <div key={c.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                    <span style={{fontWeight:600,color:c.catColor}}>{c.id}</span>
                    <span style={{color:T.textSec}}>{c.name}</span>
                    <span style={{fontWeight:700,color:T.red}}>{c.balance_mt<-100?(c.balance_mt/1000).toFixed(1)+'K':c.balance_mt} {c.unit?.split('/')[1]||'mt'}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.green,marginBottom:8}}>Largest Surpluses</div>
                {allComms.filter(c=>c.balance_mt>0).sort((a,b)=>b.balance_mt-a.balance_mt).slice(0,12).map(c=>(
                  <div key={c.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                    <span style={{fontWeight:600,color:c.catColor}}>{c.id}</span>
                    <span style={{color:T.textSec}}>{c.name}</span>
                    <span style={{fontWeight:700,color:T.green}}>+{c.balance_mt>1000?(c.balance_mt/1000).toFixed(0)+'K':c.balance_mt}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        {/* COMMODITY VOLATILITY INDEX */}
        <Section title="Commodity Volatility Index (30-Day)" badge="Risk-Ranked">
          <Card>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={allComms.filter(c=>c.vol_30d).sort((a,b)=>b.vol_30d-a.vol_30d).slice(0,25).map(c=>({name:c.id,vol:c.vol_30d,cat:c.catName}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:9}} angle={-45} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v}%`}/>
                <Tooltip formatter={v=>[`${v}%`,'30D Volatility']}/>
                <Bar dataKey="vol" name="Volatility %" radius={[4,4,0,0]}>
                  {allComms.filter(c=>c.vol_30d).sort((a,b)=>b.vol_30d-a.vol_30d).slice(0,25).map((c,i)=><Cell key={i} fill={c.vol_30d>=30?T.red:c.vol_30d>=20?T.amber:T.green}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* ENERGY TRANSITION DEMAND */}
        <Section title="Energy Transition Commodity Demand Forecast" badge="IEA NZE Scenario">
          <Card>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={TRANSITION_DEMAND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="mineral" tick={{fontSize:10}} angle={-30} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:10}} label={{value:'kt',angle:-90,position:'insideLeft',style:{fontSize:10}}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="current_kt" name="Current (2024)" fill={T.textMut} radius={[4,4,0,0]}/>
                <Bar dataKey="iea_2030_kt" name="IEA 2030 NZE" fill={T.navyL} radius={[4,4,0,0]}/>
                <Bar dataKey="iea_2040_kt" name="IEA 2040 NZE" fill={T.sage} radius={[4,4,0,0]}/>
                <Bar dataKey="iea_2050_kt" name="IEA 2050 NZE" fill={T.green} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6,marginTop:12}}>
              {TRANSITION_DEMAND.slice(0,12).map(d=>(
                <div key={d.mineral} style={{textAlign:'center',padding:8,background:T.surfaceH,borderRadius:8}}>
                  <div style={{fontSize:10,color:T.textMut}}>{d.mineral}</div>
                  <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{d.growth}</div>
                  <div style={{fontSize:9,color:T.textSec}}>CAGR {d.cagr_pct}%</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* PORTFOLIO COMMODITY EXPOSURE */}
        <Section title="Portfolio Commodity Exposure" badge="By Sector">
          <Card>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={portfolioExposure.slice(0,11)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" tick={{fontSize:10}}/>
                <YAxis dataKey="sector" type="category" width={150} tick={{fontSize:11}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="primary" name="Primary" stackId="a" fill={T.navy}/>
                <Bar dataKey="secondary" name="Secondary" stackId="a" fill={T.gold}/>
                <Bar dataKey="carbon" name="Carbon" stackId="a" fill={T.sage}/>
                <Bar dataKey="tertiary" name="Tertiary" stackId="a" fill={T.textMut}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* SECTOR COMMODITY DEPENDENCY MATRIX */}
        <Section title="Sector Commodity Dependency Matrix" badge="11 GICS Sectors">
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',width:'100%'}}>
                <thead><tr>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>Sector</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Primary</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Secondary</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Carbon</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Tertiary</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Total</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Weight</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>Key Commodities</th>
                </tr></thead>
                <tbody>
                  {Object.entries(SECTOR_COMMODITY_EXPOSURE).map(([sector,exp])=>{
                    const total=exp.primary.length+exp.secondary.length+exp.carbon.length+(exp.tertiary||[]).length;
                    return(
                      <tr key={sector}>
                        <td style={{padding:8,fontSize:12,fontWeight:600,color:T.text,borderBottom:`1px solid ${T.border}`}}>{sector}</td>
                        <td style={{padding:8,fontSize:13,fontWeight:700,textAlign:'center',borderBottom:`1px solid ${T.border}`,color:exp.primary.length>=8?T.red:exp.primary.length>=4?T.amber:T.green}}>{exp.primary.length}</td>
                        <td style={{padding:8,fontSize:13,textAlign:'center',borderBottom:`1px solid ${T.border}`,color:T.textSec}}>{exp.secondary.length}</td>
                        <td style={{padding:8,fontSize:13,textAlign:'center',borderBottom:`1px solid ${T.border}`,color:exp.carbon.length>0?T.amber:T.textMut}}>{exp.carbon.length}</td>
                        <td style={{padding:8,fontSize:13,textAlign:'center',borderBottom:`1px solid ${T.border}`,color:T.textMut}}>{(exp.tertiary||[]).length}</td>
                        <td style={{padding:8,fontSize:13,fontWeight:700,textAlign:'center',borderBottom:`1px solid ${T.border}`}}>{total}</td>
                        <td style={{padding:8,fontSize:12,textAlign:'center',borderBottom:`1px solid ${T.border}`,fontWeight:600,color:T.navyL}}>{((exp.weight_factor||0)*100).toFixed(0)}%</td>
                        <td style={{padding:8,fontSize:10,color:T.textSec,borderBottom:`1px solid ${T.border}`}}>{exp.primary.slice(0,5).join(', ')}{exp.primary.length>5?'...':''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* COMMODITY-TO-COMPANY LINKAGE */}
        <Section title="Commodity-to-Company Linkage" badge={`Top ${companyLinkage.length} Holdings`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Company','Sector','Weight %','# Commodities','Primary','Risk Score'].map(h=><th key={h} style={{padding:'10px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Company'||h==='Sector'?'left':'center'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {companyLinkage.map((c,i)=>(
                  <tr key={i}>
                    <TD style={{fontWeight:600}}>{c.company}</TD>
                    <TD>{c.sector}</TD>
                    <TD style={{textAlign:'center'}}>{fmt(c.weight,2)}%</TD>
                    <TD style={{textAlign:'center'}}>{c.commodities}</TD>
                    <TD style={{textAlign:'center'}}>{c.primary}</TD>
                    <TD style={{textAlign:'center'}}><span style={{padding:'3px 10px',borderRadius:8,fontSize:12,fontWeight:700,background:c.riskScore>=70?'#fee2e2':c.riskScore>=45?'#fef3c7':'#dcfce7',color:c.riskScore>=70?T.red:c.riskScore>=45?T.amber:T.green}}>{c.riskScore}</span></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* GREEN PREMIUM TRACKER */}
        <Section title="Green Premium Tracker" badge="Conventional vs Green">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={greenPremium}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="commodity" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/>
                <YAxis tick={{fontSize:10}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="conventional" name="Conventional" fill={T.textMut}/>
                <Bar dataKey="green" name="Green" fill={T.green}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:'grid',gridTemplateColumns:`repeat(${greenPremium.length},1fr)`,gap:10,marginTop:12}}>
              {greenPremium.map(g=>(
                <div key={g.commodity} style={{textAlign:'center',padding:10,background:T.surfaceH,borderRadius:8}}>
                  <div style={{fontSize:10,color:T.textMut}}>{g.commodity}</div>
                  <div style={{fontSize:18,fontWeight:700,color:T.amber}}>+{g.premium}%</div>
                  <div style={{fontSize:10,color:T.textSec}}>Green Premium</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* FOOD SECURITY RISK */}
        <Section title="Food Security & Climate Vulnerability" badge={`${foodSecurity.length} Staples`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Price','YTD','Vulnerability','Import-Dependent','Climate Impact'].map(h=><th key={h} style={{padding:'10px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {foodSecurity.map(f=>(
                  <tr key={f.commodity}>
                    <TD style={{fontWeight:600}}>{f.commodity}</TD>
                    <TD style={{fontFamily:'monospace'}}>${typeof f.price==='number'&&f.price<10?f.price.toFixed(2):f.price}</TD>
                    <TD style={{color:f.change>0?T.green:T.red,fontWeight:600}}>{pct(f.change)}</TD>
                    <TD><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:60,height:8,background:T.border,borderRadius:4,overflow:'hidden'}}><div style={{width:`${f.vulnerability}%`,height:'100%',background:f.vulnerability>=75?T.red:f.vulnerability>=50?T.amber:T.green,borderRadius:4}}/></div><span style={{fontSize:11,fontWeight:600}}>{f.vulnerability}/100</span></div></TD>
                    <TD style={{fontSize:12}}>{f.importDependent}</TD>
                    <TD style={{fontSize:12}}>{f.climateImpact}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* SUPPLY CHAIN GEOPOLITICAL RISK */}
        <Section title="Supply Chain Geopolitical Concentration" badge={`${geopoliticalRisk.length} Commodities`}>
          <Card>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={geopoliticalRisk} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" domain={[0,100]} tick={{fontSize:10}} tickFormatter={v=>`${v}%`}/>
                <YAxis dataKey="commodity" type="category" width={120} tick={{fontSize:10}}/>
                <Tooltip formatter={v=>[`${v}%`,'Top Country Share']}/>
                <Bar dataKey="share" radius={[0,4,4,0]}>
                  {geopoliticalRisk.map((g,i)=><Cell key={i} fill={g.risk==='Very High'?T.red:g.risk==='High'?T.amber:T.sage}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* COMMODITY PRICE CORRELATION MATRIX */}
        <Section title="Commodity Price Correlation Matrix" badge={`${CORRELATION_COMMODITIES.length} x ${CORRELATION_COMMODITIES.length} Heatmap`}>
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',width:'100%'}}>
                <thead><tr>
                  <th style={{padding:4,fontSize:9,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`}}></th>
                  {CORRELATION_COMMODITIES.map(c=><th key={c} style={{padding:4,fontSize:9,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center',minWidth:42}}>{c}</th>)}
                </tr></thead>
                <tbody>
                  {correlationMatrix.map((row,i)=>(
                    <tr key={i}>
                      <td style={{padding:4,fontSize:9,fontWeight:700,color:T.text,borderBottom:`1px solid ${T.border}`}}>{row.commodity}</td>
                      {CORRELATION_COMMODITIES.map(c=>{
                        const v=row[c];
                        const bg=v>=0.7?'rgba(22,163,74,'+Math.min(1,v*0.8)+')':v>=0.3?'rgba(217,119,6,'+v*0.5+')':v>=0?'rgba(200,200,200,0.3)':v>=-0.3?'rgba(220,200,180,0.3)':'rgba(220,38,38,'+Math.min(1,Math.abs(v)*0.8)+')';
                        return <td key={c} style={{padding:4,fontSize:10,fontWeight:v===1?700:500,textAlign:'center',borderBottom:`1px solid ${T.border}`,background:bg,color:Math.abs(v)>0.6?'#fff':T.text}}>{v.toFixed(2)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* HISTORICAL PRICE COMPARISON */}
        <Section title="Historical Price Comparison (Normalized)" badge="Overlay">
          <Card>
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
              {['WTI','BRENT','GOLD','SILVER','COPPER','LITHIUM','EUA','NG','WHEAT','IRON_ORE','COBALT','PALM_OIL','NICKEL','PLATINUM'].map(id=>(
                <label key={id} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,cursor:'pointer'}}>
                  <input type="checkbox" checked={compareComms.includes(id)} onChange={()=>setCompareComms(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])}/>
                  {id}
                </label>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={compareOverlay}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v.slice(5)}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v}%`}/>
                <Tooltip formatter={v=>[`${Number(v).toFixed(2)}%`]}/>
                <Legend/>
                {compareComms.map((id,i)=><Line key={id} dataKey={id} stroke={CAT_COLORS[i%CAT_COLORS.length]} strokeWidth={2} dot={false}/>)}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* PRICE SENSITIVITY SLIDER */}
        <Section title="Price Sensitivity Analysis" badge="Slider">
          <Card>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
              <span style={{fontSize:13,color:T.textSec}}>Commodity Price Shock:</span>
              <input type="range" min={-50} max={50} value={priceSlider} onChange={e=>setPriceSlider(+e.target.value)} style={{flex:1}}/>
              <span style={{fontSize:16,fontWeight:700,color:priceSlider>0?T.green:priceSlider<0?T.red:T.textMut,minWidth:60}}>{priceSlider>0?'+':''}{priceSlider}%</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
              {['WTI','GOLD','LITHIUM','EUA','COPPER','COBALT','WHEAT','PALM_OIL','STEEL','SILVER','NICKEL','URANIUM'].map(id=>{
                const c=allComms.find(x=>x.id===id);
                if(!c)return null;
                const newP=c.price*(1+priceSlider/100);
                return(
                  <div key={id} style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                    <div style={{fontSize:10,color:T.textMut,fontWeight:600}}>{c.id}</div>
                    <div style={{fontSize:11,color:T.textSec,textDecoration:'line-through'}}>{fmtPrice(c.price)}</div>
                    <div style={{fontSize:16,fontWeight:700,color:priceSlider>0?T.green:priceSlider<0?T.red:T.navy}}>{fmtPrice(newP)}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>

        {/* COMMODITY DETAIL PANEL */}
        <Section title={`Commodity Deep Dive: ${selectedObj.name}`} badge={selectedObj.catName}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Market Data</div>
              <div style={{display:'grid',gap:6}}>
                {[
                  ['Current Price',`${fmtPrice(selectedObj.price)} ${selectedObj.unit}`],
                  ['YTD Change',pct(selectedObj.ytd_change)],
                  ['Category',selectedObj.catName],
                  ['30D Volatility',selectedObj.vol_30d?`${selectedObj.vol_30d}%`:'N/A'],
                  selectedObj.eodhd_ticker?['EODHD Ticker',selectedObj.eodhd_ticker]:null,
                  selectedObj.global_production?['Global Production',selectedObj.global_production]:null,
                  selectedObj.supply_mt?['Supply',`${selectedObj.supply_mt>1000?(selectedObj.supply_mt/1000).toFixed(0)+'K':selectedObj.supply_mt} mt`]:null,
                  selectedObj.demand_mt?['Demand',`${selectedObj.demand_mt>1000?(selectedObj.demand_mt/1000).toFixed(0)+'K':selectedObj.demand_mt} mt`]:null,
                  selectedObj.balance_mt!=null?['Balance',`${selectedObj.balance_mt>0?'+':''}${selectedObj.balance_mt>1000?(selectedObj.balance_mt/1000).toFixed(0)+'K':selectedObj.balance_mt} mt`]:null,
                ].filter(Boolean).map(([k,v],i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>
                ))}
              </div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Risk Profile</div>
              <div style={{display:'grid',gap:6}}>
                {selectedObj.supply_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Supply Risk</span><Badge label={selectedObj.supply_risk} color={selectedObj.supply_risk==='Very High'?'red':'amber'}/></div>}
                {selectedObj.geopolitical_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Geopolitical</span><span style={{fontSize:11,color:T.red}}>{selectedObj.geopolitical_risk}</span></div>}
                {selectedObj.stranded_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Stranded Asset Risk</span><Badge label={selectedObj.stranded_risk} color="red"/></div>}
                {selectedObj.deforestation_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Deforestation</span><Badge label={selectedObj.deforestation_risk} color={selectedObj.deforestation_risk==='Very High'?'red':'amber'}/></div>}
                {selectedObj.eudr_regulated&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>EUDR Regulated</span><Badge label="Yes" color="amber"/></div>}
                {selectedObj.child_labor_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Child Labor</span><span style={{fontSize:11,color:T.red,fontWeight:600}}>{selectedObj.child_labor_risk}</span></div>}
                {selectedObj.conflict_mineral&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Conflict Mineral</span><Badge label="Yes" color="red"/></div>}
                {selectedObj.food_security&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Food Security</span><Badge label={selectedObj.food_security} color="red"/></div>}
                {selectedObj.climate_sensitivity&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Climate Sensitivity</span><span style={{fontSize:11,fontWeight:600}}>{selectedObj.climate_sensitivity}</span></div>}
              </div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>ML Prediction</div>
              <div style={{display:'grid',gap:6}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Predicted Price</span><span style={{fontWeight:700,color:mlResult.pctChange>0?T.green:T.red}}>{fmtPrice(mlResult.predicted)}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Direction</span><Badge label={mlResult.trend} color={mlResult.trend==='Bullish'?'green':'red'}/></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Confidence</span><span style={{fontWeight:600}}>{mlResult.confidence}%</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>R-squared</span><span style={{fontFamily:'monospace'}}>{mlResult.r2}</span></div>
                {selectedObj.ev_relevance&&<div style={{fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>EV Relevance:</span><div style={{fontSize:11,marginTop:2}}>{selectedObj.ev_relevance}</div></div>}
                {selectedObj.top_producers&&<div style={{fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Top Producers:</span><div style={{fontSize:11,marginTop:2}}>{selectedObj.top_producers.join(', ')}</div></div>}
                {selectedObj.description&&<div style={{fontSize:11,color:T.textSec,marginTop:6,lineHeight:1.5}}>{selectedObj.description}</div>}
              </div>
            </Card>
          </div>
        </Section>

        {/* CATEGORY BREAKDOWN OVERVIEW */}
        <Section title="Category Market Overview" badge={`${Object.keys(COMMODITY_UNIVERSE).length} Categories`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
            {Object.entries(COMMODITY_UNIVERSE).map(([catKey,cat])=>{
              const comms=cat.commodities;
              const avgYtd=comms.filter(c=>c.ytd_change!=null).reduce((s,c)=>s+c.ytd_change,0)/Math.max(1,comms.filter(c=>c.ytd_change!=null).length);
              return(
                <Card key={catKey} style={{cursor:'pointer',borderLeft:`3px solid ${cat.color}`,transition:'all 0.2s',background:activeCat===catKey?T.surfaceH:T.surface}} onClick={()=>setActiveCat(catKey)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:13,fontWeight:700,color:cat.color}}>{cat.icon} {cat.name}</span>
                    <span style={{fontSize:11,color:T.textMut}}>{comms.length}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginTop:8}}>
                    <div><span style={{fontSize:9,color:T.textMut}}>Avg YTD</span><div style={{fontSize:13,fontWeight:700,color:avgYtd>0?T.green:T.red}}>{avgYtd>0?'+':''}{avgYtd.toFixed(1)}%</div></div>
                    <div><span style={{fontSize:9,color:T.textMut}}>Count</span><div style={{fontSize:13,fontWeight:700,color:T.navy}}>{comms.length}</div></div>
                  </div>
                  <div style={{marginTop:6}}>
                    {comms.slice(0,3).map(c=>(
                      <div key={c.id} style={{display:'flex',justifyContent:'space-between',fontSize:10,padding:'1px 0'}}>
                        <span style={{color:T.textSec}}>{c.id}</span>
                        <span style={{fontWeight:600,color:c.ytd_change>0?T.green:c.ytd_change<0?T.red:T.textMut}}>{c.ytd_change!=null?`${c.ytd_change>0?'+':''}${c.ytd_change}%`:'\u2014'}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>

        {/* ESG SCORING RADAR */}
        <Section title="Commodity ESG Composite Scoring" badge="Cross-Commodity Radar">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>ESG Risk Radar</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  {metric:'Supply Chain Risk',WTI:85,GOLD:30,LITHIUM:72,COPPER:55,PALM_OIL:92,COBALT:88},
                  {metric:'Carbon Intensity',WTI:90,GOLD:40,LITHIUM:65,COPPER:50,PALM_OIL:78,COBALT:70},
                  {metric:'Water Stress',WTI:35,GOLD:45,LITHIUM:80,COPPER:60,PALM_OIL:70,COBALT:55},
                  {metric:'Labor Rights',WTI:25,GOLD:50,LITHIUM:40,COPPER:35,PALM_OIL:75,COBALT:95},
                  {metric:'Biodiversity',WTI:55,GOLD:35,LITHIUM:50,COPPER:45,PALM_OIL:95,COBALT:60},
                  {metric:'Governance',WTI:30,GOLD:25,LITHIUM:45,COPPER:40,PALM_OIL:65,COBALT:85},
                ]}>
                  <PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="metric" tick={{fontSize:10}}/>
                  <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
                  <Radar name="WTI" dataKey="WTI" stroke="#dc2626" fill="#dc2626" fillOpacity={0.1}/>
                  <Radar name="Gold" dataKey="GOLD" stroke="#c5a96a" fill="#c5a96a" fillOpacity={0.1}/>
                  <Radar name="Lithium" dataKey="LITHIUM" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.1}/>
                  <Radar name="Copper" dataKey="COPPER" stroke="#0284c7" fill="#0284c7" fillOpacity={0.1}/>
                  <Radar name="Palm Oil" dataKey="PALM_OIL" stroke="#d97706" fill="#d97706" fillOpacity={0.1}/>
                  <Radar name="Cobalt" dataKey="COBALT" stroke="#ec4899" fill="#ec4899" fillOpacity={0.1}/>
                  <Legend/>
                  <Tooltip/>
                </RadarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>ESG Composite Scores</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','ESG Score','Grade','Key Risk'].map(h=><th key={h} style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[
                    {name:'EU Carbon (EUA)',score:22,grade:'A',risk:'Market volatility'},
                    {name:'Gold',score:38,grade:'B+',risk:'Mercury use in ASM'},
                    {name:'Copper',score:48,grade:'B',risk:'Water stress Chile/Peru'},
                    {name:'Lithium',score:62,grade:'C+',risk:'Water depletion Atacama'},
                    {name:'Cobalt',score:82,grade:'D',risk:'Child labor in DRC'},
                    {name:'Palm Oil',score:88,grade:'D-',risk:'Deforestation, forced labor'},
                    {name:'Thermal Coal',score:95,grade:'F',risk:'Stranded, air pollution'},
                    {name:'Cotton',score:72,grade:'C',risk:'Water, forced labor'},
                    {name:'Antimony',score:78,grade:'C-',risk:'China export controls'},
                    {name:'Cocoa',score:80,grade:'D+',risk:'Child labor, deforestation'},
                  ].map((c,i)=>(
                    <tr key={i}>
                      <TD style={{fontWeight:600,fontSize:12}}>{c.name}</TD>
                      <TD style={{textAlign:'center'}}><span style={{padding:'3px 8px',borderRadius:8,fontWeight:700,fontSize:11,background:c.score>=70?'#fee2e2':c.score>=45?'#fef3c7':'#dcfce7',color:c.score>=70?T.red:c.score>=45?T.amber:T.green}}>{c.score}</span></TD>
                      <TD style={{textAlign:'center',fontWeight:700,fontSize:13,color:c.score>=70?T.red:c.score>=45?T.amber:T.green}}>{c.grade}</TD>
                      <TD style={{textAlign:'center',fontSize:10}}>{c.risk}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </Section>

        {/* API CONNECTION PANEL */}
        <Section title="API Connection Panel" badge="EODHD">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>EODHD API Configuration</div>
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Enter EODHD API Key" type="password" style={{flex:1,padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font}}/>
                  <Btn primary onClick={handleFetchLive}>Fetch Live</Btn>
                </div>
                {apiStatus&&<div style={{fontSize:12,color:apiStatus.includes('Fetch')?T.green:T.amber,marginBottom:8}}>{apiStatus}</div>}
                <div style={{fontSize:11,color:T.textMut}}>API key stored in localStorage. Cached 24h. Supports {TOTAL_COMM_COUNT}+ commodity tickers.</div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Live Data Status</div>
                {Object.keys(liveData).length>0?(
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr><th style={{padding:6,fontSize:10,textAlign:'left',color:T.textMut,borderBottom:`1px solid ${T.border}`}}>Commodity</th><th style={{padding:6,fontSize:10,textAlign:'right',color:T.textMut,borderBottom:`1px solid ${T.border}`}}>Live Price</th><th style={{padding:6,fontSize:10,textAlign:'right',color:T.textMut,borderBottom:`1px solid ${T.border}`}}>Date</th></tr></thead>
                    <tbody>{Object.entries(liveData).map(([id,d])=><tr key={id}><td style={{padding:6,fontSize:12,fontWeight:600}}>{id}</td><td style={{padding:6,fontSize:12,textAlign:'right',fontFamily:'monospace'}}>${d.lastPrice}</td><td style={{padding:6,fontSize:11,textAlign:'right',color:T.textMut}}>{d.date}</td></tr>)}</tbody>
                  </table>
                ):<div style={{fontSize:12,color:T.textMut,padding:20,textAlign:'center'}}>No live data fetched yet. Enter API key and click Fetch Live.</div>}
              </div>
            </div>
          </Card>
        </Section>

        {/* CRITICAL MINERAL SUPPLY RISK MATRIX */}
        <Section title="Critical Mineral Supply Risk Matrix" badge={`${COMMODITY_UNIVERSE.critical_minerals.commodities.length} Minerals`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Mineral','Price Vol.','Supply Conc.','Geopolitical','Substitution','Overall'].map(h=><th key={h} style={{padding:'10px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Mineral'?'left':'center'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {COMMODITY_UNIVERSE.critical_minerals.commodities.map((c,i)=>{
                  const pv=Math.round(40+seed(i*31)*55);const sc=Math.round(35+seed(i*37)*60);const gp=Math.round(30+seed(i*41)*65);const su=Math.round(25+seed(i*43)*50);
                  const ov=Math.round((pv+sc+gp+su)/4);
                  const riskColor=v=>v>=75?T.red:v>=55?T.amber:T.green;
                  const riskBg=v=>v>=75?'#fee2e2':v>=55?'#fef3c7':'#dcfce7';
                  return(
                    <tr key={c.id}>
                      <TD style={{fontWeight:600}}>{c.name}</TD>
                      {[pv,sc,gp,su,ov].map((v,j)=><TD key={j} style={{textAlign:'center'}}><span style={{padding:'3px 10px',borderRadius:8,fontSize:12,fontWeight:700,background:riskBg(v),color:riskColor(v)}}>{v}</span></TD>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* EUDR COMMODITY RISK */}
        <Section title="EUDR Commodity Risk Assessment" badge={`${eudrComms.length} Regulated`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Price','Deforestation Risk','Top Producers','Compliance'].map(h=><th key={h} style={{padding:'10px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {eudrComms.map((c,i)=>(
                  <tr key={c.id}>
                    <TD style={{fontWeight:600}}>{c.name}</TD>
                    <TD style={{fontFamily:'monospace'}}>{fmtPrice(c.price)} {c.unit}</TD>
                    <TD><Badge label={c.deforestation_risk||'Medium'} color={c.deforestation_risk==='Very High'?'red':c.deforestation_risk==='High'?'amber':'green'}/></TD>
                    <TD style={{fontSize:11}}>{c.top_producers?c.top_producers.join(', '):'\u2014'}</TD>
                    <TD><Badge label={seed(i*53)>0.5?'Due Diligence Required':'Monitoring'} color={seed(i*53)>0.5?'red':'amber'}/></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* STRANDED ASSET COMMODITY RISK */}
        <Section title="Stranded Asset & Transition Commodity Risk" badge="Fossil Fuels">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Fossil Fuel Commodities Under Transition Risk</div>
                {[
                  {id:'COAL',name:'Thermal Coal',price:135,risk:95,timeline:'Phase-out by 2040 (OECD)',stranded_value:'$320Bn in reserves'},
                  {id:'WTI',name:'Crude Oil',price:72.50,risk:72,timeline:'Peak demand ~2028 (IEA)',stranded_value:'$1.2Tn in undeveloped reserves'},
                  {id:'NG',name:'Natural Gas',price:2.85,risk:45,timeline:'Bridge fuel to 2045',stranded_value:'$450Bn'},
                  {id:'LNG',name:'LNG',price:12.50,risk:55,timeline:'Growing near-term, declining post-2040',stranded_value:'$180Bn in new terminals'},
                  {id:'COKING_COAL',name:'Coking Coal',price:215,risk:80,timeline:'H2-DRI replacement by 2040',stranded_value:'$120Bn'},
                ].map(f=>(
                  <div key={f.id} style={{padding:12,marginBottom:8,background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${f.risk>=70?T.red:f.risk>=50?T.amber:T.sage}`}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <span style={{fontSize:13,fontWeight:700,color:T.navy}}>{f.name}</span>
                      <span style={{fontSize:12,fontWeight:700,color:f.risk>=70?T.red:T.amber}}>{f.risk}/100</span>
                    </div>
                    <div style={{width:'100%',height:6,background:T.border,borderRadius:3,marginTop:6,overflow:'hidden'}}>
                      <div style={{width:`${f.risk}%`,height:'100%',background:f.risk>=70?T.red:f.risk>=50?T.amber:T.sage,borderRadius:3}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textSec,marginTop:4}}>
                      <span>{f.timeline}</span><span>{f.stranded_value}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Transition Winners: Green Commodities</div>
                {[
                  {name:'Lithium',growth:'14x by 2050',driver:'EV batteries, grid storage',color:T.green},
                  {name:'Copper',growth:'1.8x by 2050',driver:'Electrification, EVs, grid',color:T.green},
                  {name:'Rare Earths',growth:'2.3x by 2050',driver:'Wind turbine magnets, EV motors',color:T.sage},
                  {name:'Silicon (polysilicon)',growth:'3x by 2040',driver:'Solar PV expansion',color:T.sage},
                  {name:'Uranium',growth:'2x by 2040',driver:'Nuclear renaissance, SMRs',color:T.navyL},
                  {name:'Green Hydrogen',growth:'200x by 2050',driver:'Steel, shipping, ammonia',color:T.green},
                  {name:'Vanadium',growth:'4.5x by 2050',driver:'Grid-scale flow batteries',color:T.sage},
                  {name:'Iridium',growth:'3.6x by 2050',driver:'PEM electrolyzers for H2',color:T.green},
                ].map((w,i)=>(
                  <div key={i} style={{padding:8,marginBottom:5,background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${w.color}`}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{w.name}</span>
                      <span style={{fontSize:12,fontWeight:700,color:w.color}}>{w.growth}</span>
                    </div>
                    <div style={{fontSize:10,color:T.textSec,marginTop:2}}>{w.driver}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        {/* COMMODITY WATCHLIST */}
        <Section title="Price Alert & Watchlist" badge="localStorage">
          <Card>
            <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Track commodity prices against your alert thresholds. Configured alerts persist in browser storage.</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
              {['EUA','WTI','LITHIUM','GOLD','COPPER','COBALT','PALM_OIL','WHEAT','STEEL','SILVER','NICKEL','URANIUM','COCOA','ANTIMONY','GREEN_H2','IRON_ORE','COFFEE','RUBBER'].map((id,i)=>{
                const c=allComms.find(x=>x.id===id);
                if(!c)return null;
                const threshold=c.price*(1+(seed(i*71)*0.2-0.1));
                const isAbove=c.price>threshold;
                return(
                  <div key={id} style={{padding:10,borderRadius:8,background:T.surfaceH,border:`1px solid ${isAbove?T.green+'40':T.red+'40'}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:11,fontWeight:700,color:c.catColor}}>{c.id}</span>
                      <span style={{fontSize:8,padding:'1px 5px',borderRadius:6,background:isAbove?'#dcfce7':'#fee2e2',color:isAbove?T.green:T.red,fontWeight:600}}>{isAbove?'ABOVE':'BELOW'}</span>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:3}}>{fmtPrice(c.price)}</div>
                    <div style={{fontSize:9,color:T.textMut}}>Alert: {fmtPrice(threshold)}</div>
                    <div style={{width:'100%',height:4,background:T.border,borderRadius:2,marginTop:4,overflow:'hidden'}}>
                      <div style={{width:`${Math.min(100,Math.max(0,(c.price/threshold)*100))}%`,height:'100%',background:isAbove?T.green:T.red,borderRadius:2}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>

        {/* COMMODITY VOLATILITY TABLE */}
        <Section title="Commodity Volatility & Risk Metrics" badge="30-Day Vol">
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','Category','Price','30D Vol','Risk/Return','Beta to Oil','Seasonal','Trend'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'||h==='Category'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {['EUA','WTI','GOLD','LITHIUM','COPPER','WHEAT','PALM_OIL','STEEL','COBALT','SILVER','NG','COFFEE','IRON_ORE','URANIUM','COCOA','NICKEL','ANTIMONY','GALLIUM','GREEN_H2','SOLAR_POLY'].map((id,i)=>{
                    const c=allComms.find(x=>x.id===id);
                    if(!c)return null;
                    const vol30=c.vol_30d||Math.round(5+seed(i*73)*35);
                    const riskReturn=Math.round(-20+seed(i*79)*50);
                    const betaOil=Math.round((seed(i*83)*1.6-0.3)*100)/100;
                    const seasonal=['Q1 Strong','Q2 Weak','Q3 Mixed','Q4 Strong','Harvest Cycle','Winter Peak','Summer Trough','No Pattern'];
                    const trends=['\u2191 Uptrend','\u2193 Downtrend','\u2194 Range-bound','\u2197 Recovering'];
                    return(
                      <tr key={id}>
                        <TD style={{fontWeight:600,fontSize:12}}><span style={{color:c.catColor,marginRight:4,fontSize:9}}>\u25CF</span>{c.name}</TD>
                        <TD><span style={{fontSize:9,padding:'2px 5px',borderRadius:6,background:c.catColor+'18',color:c.catColor}}>{c.catName}</span></TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11}}>{fmtPrice(c.price)}</TD>
                        <TD style={{textAlign:'center'}}><span style={{padding:'2px 6px',borderRadius:6,fontSize:10,fontWeight:700,background:vol30>=25?'#fee2e2':vol30>=15?'#fef3c7':'#dcfce7',color:vol30>=25?T.red:vol30>=15?T.amber:T.green}}>{vol30}%</span></TD>
                        <TD style={{textAlign:'center',fontWeight:600,fontSize:11,color:riskReturn>0?T.green:T.red}}>{riskReturn>0?'+':''}{riskReturn}%</TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11}}>{betaOil.toFixed(2)}</TD>
                        <TD style={{textAlign:'center',fontSize:10}}>{seasonal[i%seasonal.length]}</TD>
                        <TD style={{textAlign:'center',fontSize:10,fontWeight:600,color:trends[i%trends.length].includes('Up')||trends[i%trends.length].includes('Recov')?T.green:trends[i%trends.length].includes('Down')?T.red:T.textSec}}>{trends[i%trends.length]}</TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* REGULATORY LANDSCAPE */}
        <Section title="Commodity Regulatory Landscape" badge="Global Frameworks">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[
                {framework:'EU EUDR',desc:'EU Deforestation Regulation',commodities:'Palm oil, soy, cocoa, coffee, rubber, timber, cattle',status:'Active (Dec 2024)',impact:'Due diligence on deforestation-free supply chains',color:T.amber},
                {framework:'EU CBAM',desc:'Carbon Border Adjustment Mechanism',commodities:'Steel, aluminum, cement, fertilizer, electricity, hydrogen',status:'Transitional (Oct 2023)',impact:'Carbon cost on imports from non-EU producers',color:T.sage},
                {framework:'EU CRM Act',desc:'Critical Raw Materials Act',commodities:'Lithium, cobalt, rare earths, graphite, manganese, gallium, germanium',status:'Active (2024)',impact:'Benchmarks for extraction, processing, recycling in EU',color:'#7c3aed'},
                {framework:'US UFLPA',desc:'Uyghur Forced Labor Prevention Act',commodities:'Cotton, polysilicon, tomatoes (Xinjiang region)',status:'Active (Jun 2022)',impact:'Rebuttable presumption of forced labor for Xinjiang goods',color:T.red},
                {framework:'ISSB/IFRS S2',desc:'Climate-Related Disclosures',commodities:'All fossil fuels, carbon-intensive materials',status:'Effective 2025',impact:'Mandatory climate risk disclosure for listed companies',color:T.navyL},
                {framework:'China Export Controls',desc:'Critical Mineral Restrictions',commodities:'Gallium, germanium, antimony, graphite',status:'Active (2023-2024)',impact:'Licensing requirements for export of strategic minerals',color:T.red},
              ].map((r,i)=>(
                <div key={i} style={{padding:14,background:T.surfaceH,borderRadius:10,borderLeft:`3px solid ${r.color}`}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{r.framework}</div>
                  <div style={{fontSize:10,color:T.textSec,marginTop:2}}>{r.desc}</div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:6}}>Commodities: <span style={{color:T.text}}>{r.commodities}</span></div>
                  <div style={{marginTop:6}}><Badge label={r.status} color="blue"/></div>
                  <div style={{fontSize:9,color:T.textSec,marginTop:4}}>{r.impact}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* COMMODITY BALANCE SHEET DEEP DIVE */}
        {BALANCE_SHEETS[selectedComm]&&(
          <Section title={`Supply/Demand Balance Sheet: ${selectedObj.name}`} badge="Detailed">
            <Card>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                {Object.entries(BALANCE_SHEETS[selectedComm]).map(([k,v],i)=>(
                  <div key={k} style={{padding:10,background:T.surfaceH,borderRadius:8}}>
                    <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase'}}>{k.replace(/_/g,' ')}</div>
                    <div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:4}}>{typeof v==='object'?JSON.stringify(v):String(v)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        )}

        {/* GROUP CORRELATION TABLE */}
        <Section title="Commodity Group Correlations" badge={`${GROUP_CORRELATIONS.length} Pairs`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Group 1','Group 2','Correlation','Strength','Note'].map(h=><th key={h} style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {GROUP_CORRELATIONS.map((g,i)=>(
                  <tr key={i}>
                    <TD style={{fontWeight:600}}>{g.group1}</TD>
                    <TD>{g.group2}</TD>
                    <TD style={{fontWeight:700,fontFamily:'monospace',color:g.correlation>0.6?T.green:g.correlation>0.3?T.amber:g.correlation>0?T.textSec:g.correlation>-0.3?T.textMut:T.red}}>{g.correlation.toFixed(2)}</TD>
                    <TD><Badge label={Math.abs(g.correlation)>=0.7?'Strong':Math.abs(g.correlation)>=0.4?'Moderate':'Weak'} color={Math.abs(g.correlation)>=0.7?'green':Math.abs(g.correlation)>=0.4?'amber':'gray'}/></TD>
                    <TD style={{fontSize:11,color:T.textSec}}>{g.note}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* SEASONAL PATTERNS */}
        <Section title="Commodity Seasonal Patterns" badge={`${SEASONAL_PATTERNS.length} Commodities`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Q1','Q2','Q3','Q4','Best Month','Worst Month'].map(h=><th key={h} style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {SEASONAL_PATTERNS.map((s,i)=>{
                  const qColor=q=>q.includes('Strong')?T.green:q.includes('Weak')?T.red:q.includes('Peak')?T.green:T.textSec;
                  return(
                    <tr key={i}>
                      <TD style={{fontWeight:600}}>{s.commodity}</TD>
                      <TD style={{color:qColor(s.q1),fontSize:12,fontWeight:600}}>{s.q1}</TD>
                      <TD style={{color:qColor(s.q2),fontSize:12,fontWeight:600}}>{s.q2}</TD>
                      <TD style={{color:qColor(s.q3),fontSize:12,fontWeight:600}}>{s.q3}</TD>
                      <TD style={{color:qColor(s.q4),fontSize:12,fontWeight:600}}>{s.q4}</TD>
                      <TD style={{fontWeight:700,color:T.green}}>{s.best_month}</TD>
                      <TD style={{fontWeight:700,color:T.red}}>{s.worst_month}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* SECTOR IMPACT MATRIX */}
        {SECTOR_IMPACT_MATRIX[selectedComm]&&(
          <Section title={`Sector Impact: ${selectedObj.name}`} badge="11 GICS Sectors">
            <Card>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={SECTOR_IMPACT_MATRIX[selectedComm].sort((a,b)=>b.impact-a.impact)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis type="number" domain={[0,100]} tick={{fontSize:10}} tickFormatter={v=>`${v}`}/>
                  <YAxis dataKey="sector" type="category" width={160} tick={{fontSize:11}}/>
                  <Tooltip formatter={v=>[`${v}/100`,'Impact Score']}/>
                  <Bar dataKey="impact" name="Impact Score" radius={[0,4,4,0]}>
                    {SECTOR_IMPACT_MATRIX[selectedComm].sort((a,b)=>b.impact-a.impact).map((d,i)=><Cell key={i} fill={d.impact>=70?T.red:d.impact>=40?T.amber:T.sage}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <table style={{width:'100%',borderCollapse:'collapse',marginTop:12}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Sector','Impact','Mechanism'].map(h=><th key={h} style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {SECTOR_IMPACT_MATRIX[selectedComm].sort((a,b)=>b.impact-a.impact).map((d,i)=>(
                    <tr key={i}>
                      <TD style={{fontWeight:600,fontSize:12}}>{d.sector}</TD>
                      <TD><span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,background:d.impact>=70?'#fee2e2':d.impact>=40?'#fef3c7':'#dcfce7',color:d.impact>=70?T.red:d.impact>=40?T.amber:T.green}}>{d.impact}</span></TD>
                      <TD style={{fontSize:11,color:T.textSec}}>{d.mechanism}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>
        )}

        {/* CROSS-ASSET CORRELATION HEAT MAP */}
        <Section title="Cross-Asset Correlation Heat Map" badge="Commodities vs Financial Assets">
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',width:'100%'}}>
                <thead><tr>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`}}>Asset</th>
                  {['WTI','GOLD','COPPER','WHEAT','EUA','LITHIUM'].map(c=><th key={c} style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center',minWidth:55}}>{c}</th>)}
                </tr></thead>
                <tbody>
                  {CROSS_ASSET_HEAT.map((row,i)=>(
                    <tr key={i}>
                      <td style={{padding:6,fontSize:11,fontWeight:600,color:T.text,borderBottom:`1px solid ${T.border}`}}>{row.asset}</td>
                      {['WTI','GOLD','COPPER','WHEAT','EUA','LITHIUM'].map(c=>{
                        const v=row[c]||0;
                        const bg=v>=0.4?'rgba(22,163,74,'+Math.min(1,v)+')':v>=0.1?'rgba(217,119,6,'+v*0.6+')':v>=0?'rgba(200,200,200,0.3)':v>=-0.3?'rgba(220,200,180,0.3)':'rgba(220,38,38,'+Math.min(1,Math.abs(v))+')';
                        return <td key={c} style={{padding:6,fontSize:11,fontWeight:500,textAlign:'center',borderBottom:`1px solid ${T.border}`,background:bg,color:Math.abs(v)>0.4?'#fff':T.text}}>{v.toFixed(2)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* ANALYST PRICE TARGETS */}
        <Section title="Analyst Price Targets (Consensus)" badge={`${PRICE_TARGETS.length} Commodities`}>
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','Current','Low','Median','High','Upside','Consensus','Analysts'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {PRICE_TARGETS.map((t,i)=>{
                    const upside=Math.round((t.median-t.current)/t.current*100);
                    return(
                      <tr key={i}>
                        <TD style={{fontWeight:600}}>{t.id}</TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:12}}>{fmtPrice(t.current)}</TD>
                        <TD style={{textAlign:'center',fontSize:11,color:T.red}}>{fmtPrice(t.low)}</TD>
                        <TD style={{textAlign:'center',fontSize:12,fontWeight:700}}>{fmtPrice(t.median)}</TD>
                        <TD style={{textAlign:'center',fontSize:11,color:T.green}}>{fmtPrice(t.high)}</TD>
                        <TD style={{textAlign:'center',fontWeight:700,color:upside>0?T.green:T.red}}>{upside>0?'+':''}{upside}%</TD>
                        <TD style={{textAlign:'center'}}><Badge label={t.consensus} color={t.consensus.includes('Buy')?'green':t.consensus==='Hold'?'amber':'red'}/></TD>
                        <TD style={{textAlign:'center',fontSize:11}}>{t.analysts}</TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* GLOBAL TRADE FLOWS */}
        <Section title="Global Commodity Trade Flows" badge={`${TRADE_FLOWS.length} Routes`}>
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','Exporter','Importer','Volume','Value ($Bn)','Route','Transit (days)'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {TRADE_FLOWS.map((f,i)=>(
                    <tr key={i}>
                      <TD style={{fontWeight:600,fontSize:12}}>{f.commodity}</TD>
                      <TD style={{fontSize:12}}>{f.exporter}</TD>
                      <TD style={{fontSize:12}}>{f.importer}</TD>
                      <TD style={{fontFamily:'monospace',fontSize:11}}>{f.volume_mt>=1?`${f.volume_mt}Mt`:`${(f.volume_mt*1000).toFixed(0)}kt`}</TD>
                      <TD style={{fontWeight:600,fontSize:12}}>${f.value_bn}B</TD>
                      <TD style={{fontSize:10,color:T.textSec}}>{f.route}</TD>
                      <TD style={{textAlign:'center',fontSize:11}}>{f.transit_days}d</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* ML PREDICTION SUMMARY TABLE */}
        <Section title="ML Price Predictions Summary" badge="Linear Regression">
          <Card>
            <div style={{fontSize:11,color:T.textSec,marginBottom:10}}>Model: Linear regression on 30-day lagged price features. Predictions are illustrative, not investment advice.</div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','Current','Predicted','Change %','Trend','R-squared','Confidence','Slope'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {Object.entries(ML_PREDICTIONS).map(([id,ml])=>{
                    const c=allComms.find(x=>x.id===id);
                    if(!c)return null;
                    return(
                      <tr key={id}>
                        <TD style={{fontWeight:600,fontSize:12}}><span style={{color:c.catColor,marginRight:4,fontSize:8}}>\u25CF</span>{id}</TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11}}>{fmtPrice(c.price)}</TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11,fontWeight:700,color:ml.pctChange>0?T.green:T.red}}>{fmtPrice(ml.predicted)}</TD>
                        <TD style={{textAlign:'center',fontWeight:700,color:ml.pctChange>0?T.green:T.red}}>{ml.pctChange>0?'+':''}{ml.pctChange}%</TD>
                        <TD style={{textAlign:'center'}}><Badge label={ml.trend} color={ml.trend==='Bullish'?'green':ml.trend==='Bearish'?'red':'gray'}/></TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11}}>{ml.r2}</TD>
                        <TD style={{textAlign:'center'}}><span style={{padding:'2px 6px',borderRadius:6,fontSize:10,fontWeight:600,background:ml.confidence>=60?'#dcfce7':ml.confidence>=40?'#fef3c7':'#fee2e2',color:ml.confidence>=60?T.green:ml.confidence>=40?T.amber:T.red}}>{ml.confidence}%</span></TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:10}}>{ml.slope}</TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* COMMODITY RISK SCORING */}
        <Section title="Composite Risk Scoring Model" badge="Multi-Factor">
          <Card>
            <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Risk scores computed from: supply concentration, geopolitical risk, ESG flags (child labor, forced labor, deforestation), stranded asset exposure, volatility, S/D balance, food security, climate sensitivity, and water intensity.</div>
            <div style={{overflowX:'auto',maxHeight:400}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead style={{position:'sticky',top:0}}><tr style={{background:T.surfaceH}}>
                  {['Rank','ID','Commodity','Category','Risk Score','Grade','Key Flags'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'||h==='Key Flags'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[...allComms].map(c=>({...c,riskScore:computeCommodityRiskScore(c)})).sort((a,b)=>b.riskScore-a.riskScore).slice(0,30).map((c,i)=>{
                    const grade=c.riskScore>=80?'F':c.riskScore>=65?'D':c.riskScore>=50?'C':c.riskScore>=35?'B':c.riskScore>=20?'B+':'A';
                    return(
                      <tr key={c.id}>
                        <TD style={{textAlign:'center',fontWeight:700,fontSize:12}}>{i+1}</TD>
                        <TD style={{textAlign:'center',fontWeight:700,color:c.catColor,fontSize:11}}>{c.id}</TD>
                        <TD style={{fontWeight:600,fontSize:12}}>{c.name}</TD>
                        <TD style={{textAlign:'center'}}><span style={{fontSize:9,padding:'2px 5px',borderRadius:6,background:c.catColor+'18',color:c.catColor}}>{c.catName}</span></TD>
                        <TD style={{textAlign:'center'}}><span style={{padding:'3px 10px',borderRadius:8,fontSize:12,fontWeight:700,background:c.riskScore>=65?'#fee2e2':c.riskScore>=40?'#fef3c7':'#dcfce7',color:c.riskScore>=65?T.red:c.riskScore>=40?T.amber:T.green}}>{c.riskScore}</span></TD>
                        <TD style={{textAlign:'center',fontWeight:700,fontSize:13,color:c.riskScore>=65?T.red:c.riskScore>=40?T.amber:T.green}}>{grade}</TD>
                        <TD style={{fontSize:10}}>
                          {c.supply_risk&&<Badge label={c.supply_risk} color={c.supply_risk==='Very High'?'red':'amber'}/>}
                          {c.geopolitical_risk&&<span style={{marginLeft:4}}><Badge label="Geo" color="purple"/></span>}
                          {c.child_labor_risk&&<span style={{marginLeft:4}}><Badge label="CL" color="red"/></span>}
                          {c.eudr_regulated&&<span style={{marginLeft:4}}><Badge label="EUDR" color="amber"/></span>}
                          {c.stranded_risk&&<span style={{marginLeft:4}}><Badge label="Stranded" color="red"/></span>}
                          {c.conflict_mineral&&<span style={{marginLeft:4}}><Badge label="Conflict" color="red"/></span>}
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* COUNTRY EXPOSURE MAP */}
        <Section title="Country Concentration Risk Map" badge={`${Object.keys(COUNTRY_EXPOSURE_MAP).length} Key Countries`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Country','Commodities Dominated','Avg Share','Risk','Geopolitical','ESG Concern'].map(h=><th key={h} style={{padding:8,fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {Object.entries(COUNTRY_EXPOSURE_MAP).map(([iso,c])=>(
                  <tr key={iso}>
                    <TD style={{fontWeight:600}}><span style={{marginRight:4,fontSize:10,padding:'1px 4px',background:T.surfaceH,borderRadius:3}}>{iso}</span>{c.name}</TD>
                    <TD style={{fontSize:10,maxWidth:200}}>{c.commodities_dominated.slice(0,4).join(', ')}{c.commodities_dominated.length>4?` +${c.commodities_dominated.length-4}`:''}</TD>
                    <TD style={{fontWeight:700}}>{c.share_avg}%</TD>
                    <TD><Badge label={c.risk_level} color={c.risk_level==='Very High'?'red':c.risk_level==='High'?'amber':c.risk_level==='Medium'?'blue':'green'}/></TD>
                    <TD style={{fontSize:10,color:T.textSec}}>{c.geopolitical}</TD>
                    <TD style={{fontSize:10,color:T.red}}>{c.esg_concern}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* REGULATORY TIMELINE */}
        <Section title="Commodity Regulatory Timeline" badge={`${REGULATORY_TIMELINE.length} Events`}>
          <Card>
            <div style={{position:'relative',paddingLeft:20}}>
              {REGULATORY_TIMELINE.map((e,i)=>(
                <div key={i} style={{display:'flex',gap:16,marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${T.border}`,position:'relative'}}>
                  <div style={{position:'absolute',left:-16,top:4,width:10,height:10,borderRadius:'50%',background:e.date<='2025-01'?T.green:e.date<='2026-01'?T.amber:T.red,border:`2px solid ${T.surface}`}}/>
                  <div style={{minWidth:80}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.navy}}>{e.date}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{e.event}</div>
                    <div style={{fontSize:10,color:T.textSec,marginTop:4}}>Commodities: {e.commodities.join(', ')}</div>
                    <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{e.impact}</div>
                  </div>
                  <div><Badge label={e.date<='2025-01'?'Active':'Upcoming'} color={e.date<='2025-01'?'green':'amber'}/></div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* SUBSTITUTION MAP */}
        <Section title="Commodity Substitution & Alternative Technologies" badge={`${SUBSTITUTION_MAP.length} Pairs`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Original','Substitute','Readiness','Impact','Driver'].map(h=><th key={h} style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {SUBSTITUTION_MAP.map((s,i)=>(
                  <tr key={i}>
                    <TD style={{fontWeight:600}}>{s.original}</TD>
                    <TD style={{fontSize:12}}>{s.substitute}</TD>
                    <TD><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:50,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{width:`${s.readiness}%`,height:'100%',background:s.readiness>=70?T.green:s.readiness>=40?T.amber:T.red,borderRadius:3}}/></div><span style={{fontSize:10,fontWeight:600}}>{s.readiness}%</span></div></TD>
                    <TD style={{fontSize:11,color:T.textSec}}>{s.impact}</TD>
                    <TD style={{fontSize:10,color:T.textMut}}>{s.driver}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* CROSS-NAV */}
        <Section title="Related Modules">
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[
              {label:'Commodity Inventory & Supply Chain',path:'/commodity-inventory'},
              {label:'Supply Chain Carbon Map',path:'/supply-chain-carbon'},
              {label:'Deforestation Risk',path:'/deforestation-risk'},
              {label:'Critical Minerals',path:'/critical-minerals'},
              {label:'Climate Physical Risk',path:'/climate-physical-risk'},
              {label:'Stranded Assets',path:'/stranded-assets'},
              {label:'Macro Transition Risk',path:'/climate-transition-risk'},
            ].map(m=>(
              <Btn key={m.path} onClick={()=>navigate(m.path)} style={{background:T.surfaceH}}>{m.label} &rarr;</Btn>
            ))}
          </div>
        </Section>

        {/* GEOPOLITICAL CHOKEPOINTS */}
        <Section title="Geopolitical Chokepoints & Supply Route Risks" badge={`${CHOKEPOINTS.length} Chokepoints`}>
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
              {CHOKEPOINTS.map((cp,i)=>(
                <div key={i} style={{padding:14,background:T.surfaceH,borderRadius:10,borderLeft:`3px solid ${cp.share_global_oil>=10?T.red:cp.share_global_oil>=5?T.amber:T.navyL}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{cp.name}</div>
                    {cp.share_global_oil>0&&<Badge label={`${cp.share_global_oil}% global oil`} color={cp.share_global_oil>=15?'red':cp.share_global_oil>=5?'amber':'blue'}/>}
                  </div>
                  <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{cp.location} | Volume: {cp.daily_volume}</div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:6}}>Commodities: <span style={{color:T.text,fontWeight:600}}>{cp.commodities.slice(0,5).join(', ')}</span></div>
                  <div style={{fontSize:10,marginTop:4}}><span style={{color:T.red,fontWeight:600}}>Risk:</span> <span style={{color:T.textSec}}>{cp.risk}</span></div>
                  <div style={{fontSize:10,marginTop:2}}><span style={{color:T.amber,fontWeight:600}}>Impact:</span> <span style={{color:T.textSec}}>{cp.disruption_impact}</span></div>
                  <div style={{fontSize:10,marginTop:2}}><span style={{color:T.sage,fontWeight:600}}>Alternative:</span> <span style={{color:T.textSec}}>{cp.alternative}</span></div>
                  <div style={{fontSize:9,color:T.textMut,marginTop:4}}>Countries: {cp.countries_affected.join(', ')}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* CATEGORY STATISTICS SUMMARY */}
        <Section title="Category Performance Statistics" badge={`${CATEGORY_STATISTICS.length} Categories`}>
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Category','Count','Avg YTD','Avg Vol','Deficits','EUDR','High Risk','Best Performer','Worst Performer'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Category'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {CATEGORY_STATISTICS.map((cs,i)=>(
                    <tr key={i}>
                      <TD style={{fontWeight:600}}><span style={{color:cs.color,marginRight:4}}>{cs.icon}</span>{cs.name}</TD>
                      <TD style={{textAlign:'center',fontWeight:700}}>{cs.count}</TD>
                      <TD style={{textAlign:'center',fontWeight:700,color:cs.avgYtd>0?T.green:T.red}}>{cs.avgYtd>0?'+':''}{cs.avgYtd}%</TD>
                      <TD style={{textAlign:'center',fontSize:11}}>{cs.avgVol}%</TD>
                      <TD style={{textAlign:'center',color:cs.deficits>0?T.red:T.green,fontWeight:600}}>{cs.deficits}</TD>
                      <TD style={{textAlign:'center'}}>{cs.eudrCount>0?<Badge label={cs.eudrCount} color="amber"/>:'\u2014'}</TD>
                      <TD style={{textAlign:'center'}}>{cs.highRiskCount>0?<Badge label={cs.highRiskCount} color="red"/>:'\u2014'}</TD>
                      <TD style={{textAlign:'center',fontSize:11}}><span style={{fontWeight:700,color:T.green}}>{cs.bestId}</span> <span style={{color:T.green,fontSize:10}}>+{cs.bestYtd}%</span></TD>
                      <TD style={{textAlign:'center',fontSize:11}}><span style={{fontWeight:700,color:T.red}}>{cs.worstId}</span> <span style={{color:T.red,fontSize:10}}>{cs.worstYtd}%</span></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* COMMODITY INDEX PERFORMANCE */}
        <Section title="Commodity Index Performance" badge="Custom Weighted">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
              {[
                {name:'Energy Index',comms:['WTI','BRENT','NG','COAL','LNG','URANIUM'],weight:'Production-weighted',ytd:null,color:T.red},
                {name:'Precious Index',comms:['GOLD','SILVER','PLATINUM','PALLADIUM','RHODIUM'],weight:'Market-cap weighted',ytd:null,color:T.gold},
                {name:'Critical Minerals Index',comms:['LITHIUM','COBALT','NICKEL','COPPER','RARE_EARTH','GRAPHITE','GALLIUM'],weight:'Equal-weighted',ytd:null,color:'#7c3aed'},
                {name:'Agriculture Index',comms:['WHEAT','CORN','RICE','SOY','COFFEE','COCOA','PALM_OIL','SUGAR','COTTON'],weight:'Production-weighted',ytd:null,color:T.amber},
                {name:'Carbon Index',comms:['EUA','CCA','CEA','UKA','VCU','RGGI'],weight:'Volume-weighted',ytd:null,color:T.green},
              ].map((idx,i)=>{
                const idxComms=idx.comms.map(id=>allComms.find(c=>c.id===id)).filter(Boolean);
                const avgYtd=idxComms.filter(c=>c.ytd_change!=null).reduce((s,c)=>s+c.ytd_change,0)/Math.max(1,idxComms.length);
                return(
                  <div key={i} style={{padding:16,background:T.surfaceH,borderRadius:10,borderTop:`3px solid ${idx.color}`,textAlign:'center'}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{idx.name}</div>
                    <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{idx.comms.length} components | {idx.weight}</div>
                    <div style={{fontSize:28,fontWeight:800,color:avgYtd>0?T.green:T.red,marginTop:8}}>{avgYtd>0?'+':''}{avgYtd.toFixed(1)}%</div>
                    <div style={{fontSize:10,color:T.textSec,marginTop:4}}>YTD Performance</div>
                    <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:3,justifyContent:'center'}}>
                      {idx.comms.slice(0,5).map(id=>{
                        const c=allComms.find(x=>x.id===id);
                        return c?<span key={id} style={{fontSize:9,padding:'1px 4px',borderRadius:4,background:c.ytd_change>0?'#dcfce7':'#fee2e2',color:c.ytd_change>0?T.green:T.red}}>{id} {c.ytd_change>0?'+':''}{c.ytd_change}%</span>:null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>

        {/* YEAR-OVER-YEAR COMMODITY PERFORMANCE RANKING */}
        <Section title="YTD Performance Ranking" badge="All Commodities">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.green,marginBottom:8}}>Top 15 Performers</div>
                {[...allComms].filter(c=>c.ytd_change!=null).sort((a,b)=>b.ytd_change-a.ytd_change).slice(0,15).map((c,i)=>(
                  <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:10,fontWeight:700,color:T.textMut,minWidth:18}}>{i+1}</span>
                      <span style={{fontSize:12,fontWeight:600,color:c.catColor}}>{c.id}</span>
                      <span style={{fontSize:11,color:T.textSec}}>{c.name}</span>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:T.green}}>+{c.ytd_change}%</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:8}}>Bottom 15 Performers</div>
                {[...allComms].filter(c=>c.ytd_change!=null).sort((a,b)=>a.ytd_change-b.ytd_change).slice(0,15).map((c,i)=>(
                  <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:10,fontWeight:700,color:T.textMut,minWidth:18}}>{i+1}</span>
                      <span style={{fontSize:12,fontWeight:600,color:c.catColor}}>{c.id}</span>
                      <span style={{fontSize:11,color:T.textSec}}>{c.name}</span>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:T.red}}>{c.ytd_change}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        {/* COMMODITY ETF MAPPING */}
        <Section title="Commodity ETF & Investment Vehicles" badge={`${COMMODITY_ETFS.length} ETFs`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Ticker','ETF Name','AUM ($Bn)','Expense %','Tracking Method'].map(h=><th key={h} style={{padding:8,fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {COMMODITY_ETFS.map((e,i)=>(
                  <tr key={i}>
                    <TD style={{fontWeight:600,fontSize:12}}>{e.commodity}</TD>
                    <TD style={{fontFamily:'monospace',fontWeight:700,color:T.navyL}}>{e.etf}</TD>
                    <TD style={{fontSize:12}}>{e.name}</TD>
                    <TD style={{fontWeight:600}}>${e.aum_bn}B</TD>
                    <TD style={{fontSize:12}}>{e.expense}%</TD>
                    <TD style={{fontSize:10,color:T.textSec}}>{e.tracking}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* COMMODITY CALENDAR - KEY DATES */}
        <Section title="Commodity Calendar & Key Dates" badge="2025-2026">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>OPEC+ & Energy Meetings</div>
                {[
                  {date:'2025-04-03',event:'OPEC+ Full Ministerial Meeting',impact:'Production quota decisions'},
                  {date:'2025-06-01',event:'OPEC+ Output Review',impact:'Potential gradual unwinding of cuts'},
                  {date:'2025-06-15',event:'IEA World Energy Outlook Midyear',impact:'Updated demand forecasts'},
                  {date:'2025-09-15',event:'OPEC+ Monitoring Committee',impact:'Compliance review'},
                  {date:'2025-11-27',event:'OPEC+ Full Ministerial Meeting',impact:'2026 production strategy'},
                  {date:'2025-12-01',event:'COP30 (Belem, Brazil)',impact:'Climate targets, fossil fuel phase-down'},
                ].map((e,i)=>(
                  <div key={i} style={{display:'flex',gap:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:11,fontWeight:700,color:T.navyL,minWidth:75}}>{e.date}</span>
                    <div><div style={{fontSize:12,fontWeight:600}}>{e.event}</div><div style={{fontSize:10,color:T.textSec}}>{e.impact}</div></div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Regulatory Deadlines</div>
                {[
                  {date:'2025-03-31',event:'EU CBAM Q1 reporting deadline',impact:'First quarterly report for importers'},
                  {date:'2025-06-30',event:'EU EUDR operator obligations begin',impact:'Large companies must comply'},
                  {date:'2025-07-01',event:'EU CBAM definitive certificates',impact:'Carbon border tax payments start'},
                  {date:'2025-09-01',event:'EU Battery Regulation: carbon footprint',impact:'Battery passport mandatory'},
                  {date:'2025-12-31',event:'EUDR full enforcement (all operators)',impact:'SMEs included, penalties active'},
                  {date:'2026-01-01',event:'EU ETS maritime shipping fully included',impact:'Shipping emissions 100% covered'},
                  {date:'2026-03-31',event:'ISSB/IFRS S2 first annual reports due',impact:'Climate risk disclosure for listed cos'},
                  {date:'2026-06-30',event:'EU CSRD first reports (large cos)',impact:'Double materiality sustainability reports'},
                ].map((e,i)=>(
                  <div key={i} style={{display:'flex',gap:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:11,fontWeight:700,color:T.amber,minWidth:75}}>{e.date}</span>
                    <div><div style={{fontSize:12,fontWeight:600}}>{e.event}</div><div style={{fontSize:10,color:T.textSec}}>{e.impact}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        {/* METHODOLOGY */}
        <Section title="Data Sources & Methodology" badge="Transparency">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Price Data</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>EODHD Financial API for real-time and historical commodity futures. Alpha Vantage for supplementary data. World Bank Commodity Price Data (Pink Sheet). ICE, CME, LME exchange data.</div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Supply/Demand</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>IEA World Energy Outlook, USGS Mineral Commodity Summaries, FAO FAOSTAT, IRENA Renewable Energy Statistics, Bloomberg NEF.</div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>ML Model</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>Linear regression on 30-day lagged price features. R-squared goodness of fit. Confidence scoring based on model fit. Predictions are illustrative only.</div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>ESG & Regulation</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>Responsible Mining Index (RMI), Forest 500, KnowTheChain, EUDR, CBAM, CRM Act, UFLPA, ISSB/IFRS, ILO NORMLEX.</div>
              </div>
            </div>
          </Card>
        </Section>

        {/* DATA QUALITY & COVERAGE METRICS */}
        <Section title="Data Coverage Metrics" badge="Transparency">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12}}>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Total Commodities</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{TOTAL_COMM_COUNT}</div>
              </div>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Categories</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{Object.keys(COMMODITY_UNIVERSE).length}</div>
              </div>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Price History Points</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{TOTAL_COMM_COUNT * 30}</div>
              </div>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>ML Predictions</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{Object.keys(ML_PREDICTIONS).length}</div>
              </div>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Correlation Pairs</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{CORRELATION_COMMODITIES.length * (CORRELATION_COMMODITIES.length - 1) / 2}</div>
              </div>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Trade Flow Routes</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{TRADE_FLOWS.length}</div>
              </div>
            </div>
          </Card>
        </Section>

        {/* FOOTER */}
        <div style={{textAlign:'center',padding:'20px 0',borderTop:`1px solid ${T.border}`,marginTop:20}}>
          <span style={{fontSize:11,color:T.textMut}}>Commodity Market Intelligence Engine | EP-Y1 | {TOTAL_COMM_COUNT} Commodities | {Object.keys(COMMODITY_UNIVERSE).length} Categories | ML Price Prediction | EODHD + Alpha Vantage + World Bank | Sprint Y</span>
        </div>
      </div>
    </div>
  );
}
