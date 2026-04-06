import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ComposedChart, PieChart, Pie,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ================================================================= THEME */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const STAGE_COLORS=['#dc2626','#d97706','#0284c7','#16a34a','#7c3aed','#6b7280'];
const DIM_COLORS={finance:'#1b3a5c',esg:'#c5a96a',climate:'#16a34a'};

/* ================================================================= HELPERS */
const LS_PORT='ra_portfolio_v1';
const LS_SC='ra_commodity_supply_chains_v1';
const loadLS=k=>{try{return JSON.parse(localStorage.getItem(k))||null}catch{return null}};
const saveLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const seed=s=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x)};
const fmt=(n,d=1)=>n==null?'\u2014':Number(n).toFixed(d);
const pct=n=>n==null?'\u2014':`${Math.round(n)}%`;

/* ML: Supply chain risk prediction using weighted feature scoring */
const mlPredictRisk=(chain)=>{
  if(!chain)return{overallRisk:0,category:'Low',confidence:0,factors:[]};
  const factors=[];
  let score=0;
  const stages=chain.supply_chain||[];
  // Concentration risk
  stages.filter(s=>s.countries).forEach(st=>{
    const sorted=[...(st.countries||[])].sort((a,b)=>(b.share_pct||0)-(a.share_pct||0));
    if(sorted[0]&&sorted[0].share_pct>=60){score+=15;factors.push({name:`${st.stage} concentration`,value:sorted[0].share_pct,weight:15})}
    else if(sorted[0]&&sorted[0].share_pct>=40){score+=8;factors.push({name:`${st.stage} concentration`,value:sorted[0].share_pct,weight:8})}
  });
  // ESG risk
  let envSum=0,socSum=0,govSum=0,cnt=0;
  stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.esg_risk){envSum+=c.esg_risk.env;socSum+=c.esg_risk.social;govSum+=c.esg_risk.governance;cnt++}})});
  const avgEnv=cnt?envSum/cnt:0;const avgSoc=cnt?socSum/cnt:0;const avgGov=cnt?govSum/cnt:0;
  if(avgEnv>=70){score+=12;factors.push({name:'Environmental risk',value:Math.round(avgEnv),weight:12})}
  if(avgSoc>=60){score+=15;factors.push({name:'Social risk',value:Math.round(avgSoc),weight:15})}
  if(avgGov<50){score+=10;factors.push({name:'Governance weakness',value:Math.round(avgGov),weight:10})}
  // Human rights flags
  let humanRights=0;
  stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.child_labor_risk||c.forced_labor_risk||c.conflict_mineral)humanRights++})});
  if(humanRights>0){score+=humanRights*8;factors.push({name:'Human rights flags',value:humanRights,weight:humanRights*8})}
  // Recycling
  const eol=stages.find(s=>s.stage==='End of Life');
  if(eol&&eol.recycling_rate_pct<20){score+=5;factors.push({name:'Low recycling',value:eol.recycling_rate_pct,weight:5})}
  const overall=Math.min(100,score);
  const category=overall>=70?'Critical':overall>=50?'High':overall>=30?'Medium':'Low';
  const confidence=Math.min(95,Math.max(40,50+cnt*3));
  return{overallRisk:overall,category,confidence,factors,avgEnv:Math.round(avgEnv),avgSoc:Math.round(avgSoc),avgGov:Math.round(avgGov)};
};

/* ================================================================= SUPPLY CHAIN DATA: 15 FULL COMMODITIES */
const SUPPLY_CHAINS = {
  LITHIUM:{
    name:'Lithium',total_production_kt:130,reserves_kt:98000,reserves_years:754,unit:'USD/t',price:12500,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'AU',name:'Australia',share_pct:47,production_kt:61,type:'Hard rock (spodumene)',companies:['Pilbara Minerals','IGO Limited','Mineral Resources'],regions:['Western Australia (Greenbushes, Pilgangoora)'],source_type:'Mining',esg_risk:{env:72,social:35,governance:82},water_intensity:'High',carbon_intensity_kg_per_t:15000,price_at_stage:850,value_add_pct:7,workers_est:12000},
        {iso2:'CL',name:'Chile',share_pct:25,production_kt:32,type:'Brine',companies:['SQM','Albemarle'],regions:['Atacama Desert'],source_type:'Brine evaporation',esg_risk:{env:85,social:55,governance:70},water_intensity:'Very High (arid region)',carbon_intensity_kg_per_t:8000,price_at_stage:720,value_add_pct:6,indigenous_impact:'High',workers_est:8000},
        {iso2:'CN',name:'China',share_pct:15,production_kt:19,type:'Hard rock + brine',companies:['Ganfeng Lithium','Tianqi Lithium'],regions:['Sichuan, Qinghai, Jiangxi'],source_type:'Mining + Brine',esg_risk:{env:68,social:42,governance:45},carbon_intensity_kg_per_t:18000,price_at_stage:900,workers_est:15000},
        {iso2:'AR',name:'Argentina',share_pct:6,production_kt:8,type:'Brine',companies:['Livent','Allkem'],regions:['Salta Province'],source_type:'Brine',esg_risk:{env:75,social:50,governance:55},indigenous_impact:'High',carbon_intensity_kg_per_t:7500,price_at_stage:680,workers_est:3000},
        {iso2:'BR',name:'Brazil',share_pct:3,production_kt:4,type:'Hard rock',companies:['Sigma Lithium'],regions:['Minas Gerais'],source_type:'Mining',esg_risk:{env:60,social:40,governance:60},carbon_intensity_kg_per_t:12000,price_at_stage:800,workers_est:2000},
        {iso2:'ZW',name:'Zimbabwe',share_pct:2,production_kt:2.5,type:'Hard rock',companies:['Prospect Lithium','Bikita Minerals'],esg_risk:{env:65,social:55,governance:35},carbon_intensity_kg_per_t:16000,price_at_stage:780,workers_est:4000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:65,capacity_kt:85,type:'Lithium hydroxide/carbonate',companies:['Ganfeng','Tianqi','BYD'],esg_risk:{env:60,social:40,governance:45},carbon_intensity_kg_per_t:5000,price_at_stage:4500,value_add_pct:36,workers_est:45000},
        {iso2:'CL',name:'Chile',share_pct:15,capacity_kt:20,type:'Lithium carbonate',esg_risk:{env:55,social:50,governance:70},carbon_intensity_kg_per_t:3000,price_at_stage:3800,workers_est:5000},
        {iso2:'AU',name:'Australia',share_pct:5,capacity_kt:7,type:'Spodumene to hydroxide',esg_risk:{env:40,social:30,governance:85},carbon_intensity_kg_per_t:4500,price_at_stage:5200,workers_est:3000},
        {iso2:'US',name:'USA',share_pct:3,capacity_kt:4,companies:['Albemarle (Silver Peak)'],esg_risk:{env:35,social:25,governance:90},carbon_intensity_kg_per_t:4000,price_at_stage:5500,workers_est:2000},
        {iso2:'KR',name:'South Korea',share_pct:4,capacity_kt:5,companies:['POSCO Chemical'],esg_risk:{env:38,social:28,governance:82},carbon_intensity_kg_per_t:4200,price_at_stage:5000,workers_est:2500},
      ]},
      {stage:'Manufacturing',description:'Battery cell production',countries:[
        {iso2:'CN',name:'China',share_pct:77,capacity_gwh:900,companies:['CATL','BYD','EVE Energy'],esg_risk:{env:55,social:45,governance:50},carbon_intensity_kg_per_t:3500,price_at_stage:9500,value_add_pct:40,workers_est:350000},
        {iso2:'KR',name:'South Korea',share_pct:8,companies:['Samsung SDI','LG Energy','SK On'],esg_risk:{env:40,social:30,governance:80},carbon_intensity_kg_per_t:3000,price_at_stage:10500,workers_est:45000},
        {iso2:'JP',name:'Japan',share_pct:5,companies:['Panasonic'],esg_risk:{env:35,social:25,governance:85},carbon_intensity_kg_per_t:2800,price_at_stage:11000,workers_est:25000},
        {iso2:'US',name:'USA',share_pct:5,companies:['Tesla Gigafactory','Panasonic'],esg_risk:{env:38,social:28,governance:88},carbon_intensity_kg_per_t:2500,price_at_stage:11500,workers_est:20000},
        {iso2:'DE',name:'Germany',share_pct:3,companies:['CATL Erfurt','Samsung SDI Budapest'],esg_risk:{env:30,social:22,governance:90},carbon_intensity_kg_per_t:2200,price_at_stage:12000,workers_est:8000},
        {iso2:'HU',name:'Hungary',share_pct:2,companies:['Samsung SDI','SK On','CATL'],esg_risk:{env:35,social:25,governance:75},carbon_intensity_kg_per_t:2500,price_at_stage:11800,workers_est:6000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global Logistics',share_pct:100,type:'Shipping, rail, road',companies:['Maersk','MSC','DB Schenker'],esg_risk:{env:45,social:30,governance:70},carbon_intensity_kg_per_t:500,price_at_stage:12000,workers_est:50000},
      ]},
      {stage:'Use',applications:[
        {use:'EV Batteries',share_pct:74,growth_rate:25,companies:['Tesla','BYD','VW','Hyundai']},
        {use:'Consumer Electronics',share_pct:14,growth_rate:3},
        {use:'Energy Storage (grid)',share_pct:8,growth_rate:35},
        {use:'Industrial (ceramics, glass)',share_pct:4,growth_rate:1},
      ]},
      {stage:'End of Life',recycling_rate_pct:5,recycling_capacity_kt:6.5,recycling_leaders:['Redwood Materials (US)','Li-Cycle (CA)','Umicore (BE)','BRUNP (CN)'],circular_economy_potential:'High - battery recycling could supply 10% of lithium demand by 2030',recycling_carbon_saving_pct:70,workers_est:5000},
    ],
  },
  COBALT:{
    name:'Cobalt',total_production_kt:190,reserves_kt:7600,reserves_years:40,unit:'USD/t',price:28000,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'CD',name:'DR Congo',share_pct:73,production_kt:139,type:'Artisanal & industrial mining',companies:['Glencore','CMOC Group','Gecamines'],regions:['Katanga Province (Kolwezi, Likasi)'],source_type:'Mining (copper byproduct)',esg_risk:{env:80,social:92,governance:30},water_intensity:'High',carbon_intensity_kg_per_t:22000,child_labor_risk:'Critical - 40K children in ASM',price_at_stage:8000,conflict_mineral:true,workers_est:250000},
        {iso2:'AU',name:'Australia',share_pct:3,production_kt:5.7,type:'Nickel byproduct',companies:['BHP Nickel West'],esg_risk:{env:45,social:30,governance:85},carbon_intensity_kg_per_t:12000,price_at_stage:12000,workers_est:2000},
        {iso2:'PH',name:'Philippines',share_pct:4,production_kt:7.6,type:'Nickel laterite byproduct',esg_risk:{env:70,social:55,governance:50},carbon_intensity_kg_per_t:16000,price_at_stage:9000,workers_est:5000},
        {iso2:'RU',name:'Russia',share_pct:4,production_kt:7.6,companies:['Nornickel'],esg_risk:{env:65,social:50,governance:35},carbon_intensity_kg_per_t:14000,price_at_stage:10000,sanctions_risk:'High',workers_est:8000},
        {iso2:'ID',name:'Indonesia',share_pct:5,production_kt:9.5,type:'Nickel byproduct',companies:['Various'],esg_risk:{env:72,social:55,governance:45},carbon_intensity_kg_per_t:18000,price_at_stage:9500,workers_est:12000},
        {iso2:'CU',name:'Cuba',share_pct:3,production_kt:5.7,esg_risk:{env:60,social:55,governance:30},carbon_intensity_kg_per_t:15000,price_at_stage:8500,workers_est:4000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:72,capacity_kt:140,type:'Cobalt sulfate/oxide',companies:['Huayou Cobalt','GEM Co','Jinchuan Group'],esg_risk:{env:58,social:42,governance:45},carbon_intensity_kg_per_t:6000,price_at_stage:18000,value_add_pct:55,workers_est:35000},
        {iso2:'FI',name:'Finland',share_pct:8,capacity_kt:15,companies:['Umicore','Freeport Cobalt'],esg_risk:{env:30,social:20,governance:92},carbon_intensity_kg_per_t:3500,price_at_stage:22000,workers_est:3000},
        {iso2:'BE',name:'Belgium',share_pct:5,capacity_kt:9.5,companies:['Umicore'],esg_risk:{env:28,social:22,governance:90},carbon_intensity_kg_per_t:3200,price_at_stage:23000,workers_est:2000},
        {iso2:'JP',name:'Japan',share_pct:4,capacity_kt:7.5,companies:['Sumitomo Metal Mining'],esg_risk:{env:32,social:22,governance:88},carbon_intensity_kg_per_t:3000,price_at_stage:23500,workers_est:2500},
      ]},
      {stage:'Manufacturing',description:'Cathode material & battery cells',countries:[
        {iso2:'CN',name:'China',share_pct:75,companies:['CATL','BYD'],esg_risk:{env:52,social:40,governance:48},carbon_intensity_kg_per_t:3000,price_at_stage:25000,workers_est:200000},
        {iso2:'KR',name:'South Korea',share_pct:10,companies:['Samsung SDI','LG Chem'],esg_risk:{env:38,social:28,governance:82},carbon_intensity_kg_per_t:2500,price_at_stage:26500,workers_est:30000},
        {iso2:'JP',name:'Japan',share_pct:6,companies:['Panasonic','Sumitomo'],esg_risk:{env:35,social:25,governance:85},carbon_intensity_kg_per_t:2400,price_at_stage:27000,workers_est:18000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global',share_pct:100,companies:['Logistics providers'],esg_risk:{env:40,social:28,governance:72},carbon_intensity_kg_per_t:400,price_at_stage:27500,workers_est:30000},
      ]},
      {stage:'Use',applications:[
        {use:'EV Batteries (NMC)',share_pct:40,growth_rate:20},
        {use:'Consumer Electronics',share_pct:30,growth_rate:2},
        {use:'Superalloys (aerospace)',share_pct:15,growth_rate:5},
        {use:'Industrial catalysts',share_pct:10,growth_rate:3},
        {use:'Other',share_pct:5,growth_rate:1},
      ]},
      {stage:'End of Life',recycling_rate_pct:12,recycling_capacity_kt:23,recycling_leaders:['Umicore (BE)','Redwood Materials (US)','BRUNP (CN)'],circular_economy_potential:'Moderate - cobalt recovery well-established but volume limited',recycling_carbon_saving_pct:65,workers_est:4000},
    ],
  },
  PALM_OIL:{
    name:'Palm Oil',total_production_kt:77000,reserves_kt:0,reserves_years:0,unit:'USD/t',price:850,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'ID',name:'Indonesia',share_pct:59,production_kt:45430,type:'Plantation farming',companies:['Sinar Mas (GAR)','Wilmar','Musim Mas','First Resources'],regions:['Sumatra (Riau, N.Sumatra)','Kalimantan'],source_type:'Smallholder (40%) + Industrial',esg_risk:{env:90,social:72,governance:40},water_intensity:'High',carbon_intensity_kg_per_t:3500,deforestation_ha_yr:450000,peatland_fire_risk:'Critical',biodiversity_impact:'Orangutan, tiger, elephant habitat loss',price_at_stage:320,workers_est:4200000},
        {iso2:'MY',name:'Malaysia',share_pct:25,production_kt:19250,type:'Plantation farming',companies:['IOI Corp','KL Kepong','Sime Darby'],regions:['Sabah, Sarawak, Peninsular'],source_type:'Estate (70%) + Smallholder',esg_risk:{env:82,social:65,governance:55},carbon_intensity_kg_per_t:3200,deforestation_ha_yr:230000,labor_risk:'Forced labor allegations (migrant workers)',price_at_stage:350,workers_est:1800000},
        {iso2:'TH',name:'Thailand',share_pct:4,production_kt:3080,esg_risk:{env:60,social:50,governance:60},price_at_stage:370,workers_est:350000},
        {iso2:'CO',name:'Colombia',share_pct:2,production_kt:1540,esg_risk:{env:55,social:60,governance:50},price_at_stage:400,workers_est:120000},
        {iso2:'NG',name:'Nigeria',share_pct:3,production_kt:2310,esg_risk:{env:65,social:58,governance:38},price_at_stage:360,workers_est:500000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'ID',name:'Indonesia',share_pct:55,type:'CPO refining',companies:['Wilmar','Musim Mas'],esg_risk:{env:65,social:50,governance:45},carbon_intensity_kg_per_t:800,price_at_stage:580,value_add_pct:45,workers_est:200000},
        {iso2:'MY',name:'Malaysia',share_pct:30,type:'Refining, fractionation',companies:['IOI Loders Croklaan','Sime Darby'],esg_risk:{env:58,social:48,governance:60},carbon_intensity_kg_per_t:750,price_at_stage:600,workers_est:80000},
        {iso2:'NL',name:'Netherlands',share_pct:5,type:'Specialty fats',companies:['Cargill','AAK'],esg_risk:{env:30,social:20,governance:90},carbon_intensity_kg_per_t:400,price_at_stage:720,workers_est:5000},
        {iso2:'IN',name:'India',share_pct:8,type:'Refining for domestic',companies:['Adani Wilmar'],esg_risk:{env:55,social:45,governance:50},carbon_intensity_kg_per_t:700,price_at_stage:610,workers_est:30000},
      ]},
      {stage:'Manufacturing',description:'Consumer products',countries:[
        {iso2:'Global',name:'Global',share_pct:100,companies:['Unilever','Nestle','P&G','Mars','PepsiCo','Mondelez'],esg_risk:{env:45,social:35,governance:75},carbon_intensity_kg_per_t:300,price_at_stage:850,workers_est:500000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global Logistics',share_pct:100,companies:['Bulk shipping'],esg_risk:{env:40,social:25,governance:70},carbon_intensity_kg_per_t:200,workers_est:50000},
      ]},
      {stage:'Use',applications:[
        {use:'Food products (cooking oil, margarine)',share_pct:68,growth_rate:3},
        {use:'Personal care & cosmetics',share_pct:12,growth_rate:4},
        {use:'Biofuel (biodiesel)',share_pct:12,growth_rate:8},
        {use:'Oleochemicals (detergents)',share_pct:8,growth_rate:2},
      ]},
      {stage:'End of Life',recycling_rate_pct:0,recycling_leaders:['N/A - consumed product'],circular_economy_potential:'Low for product; waste biomass (EFB) for energy',recycling_carbon_saving_pct:15,workers_est:0},
    ],
  },
  STEEL:{
    name:'Steel',total_production_kt:1900000,reserves_kt:0,reserves_years:0,unit:'USD/t',price:680,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'AU',name:'Australia',share_pct:38,production_kt:900000,type:'Iron ore mining',companies:['BHP','Rio Tinto','Fortescue'],regions:['Pilbara, Western Australia'],source_type:'Open pit',esg_risk:{env:60,social:45,governance:85},carbon_intensity_kg_per_t:50,price_at_stage:110,indigenous_impact:'Juukan Gorge incident',workers_est:65000},
        {iso2:'BR',name:'Brazil',share_pct:17,production_kt:400000,companies:['Vale'],regions:['Minas Gerais, Para'],esg_risk:{env:78,social:60,governance:50},carbon_intensity_kg_per_t:55,price_at_stage:105,workers_est:50000},
        {iso2:'CN',name:'China',share_pct:14,production_kt:330000,esg_risk:{env:70,social:45,governance:42},carbon_intensity_kg_per_t:65,price_at_stage:120,workers_est:200000},
        {iso2:'IN',name:'India',share_pct:9,production_kt:210000,companies:['NMDC','Tata Steel Mining'],esg_risk:{env:65,social:55,governance:55},carbon_intensity_kg_per_t:60,price_at_stage:100,workers_est:120000},
        {iso2:'RU',name:'Russia',share_pct:4,production_kt:95000,esg_risk:{env:62,social:42,governance:35},carbon_intensity_kg_per_t:58,price_at_stage:95,sanctions_risk:'High',workers_est:40000},
        {iso2:'ZA',name:'South Africa',share_pct:3,production_kt:71000,esg_risk:{env:58,social:52,governance:55},carbon_intensity_kg_per_t:55,price_at_stage:100,workers_est:25000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:54,capacity_kt:1030000,type:'Blast furnace (BF-BOF)',companies:['Baowu Steel','HBIS','Shagang'],esg_risk:{env:85,social:50,governance:45},carbon_intensity_kg_per_t:1800,price_at_stage:480,value_add_pct:70,workers_est:3500000},
        {iso2:'IN',name:'India',share_pct:7,capacity_kt:133000,companies:['Tata Steel','JSW Steel','SAIL'],esg_risk:{env:75,social:55,governance:60},carbon_intensity_kg_per_t:2100,price_at_stage:450,workers_est:800000},
        {iso2:'JP',name:'Japan',share_pct:5,capacity_kt:95000,companies:['Nippon Steel'],esg_risk:{env:45,social:25,governance:88},carbon_intensity_kg_per_t:1600,price_at_stage:550,workers_est:150000},
        {iso2:'US',name:'USA',share_pct:4,capacity_kt:76000,companies:['Nucor','US Steel'],esg_risk:{env:50,social:30,governance:85},carbon_intensity_kg_per_t:900,price_at_stage:600,workers_est:85000},
        {iso2:'DE',name:'Germany',share_pct:2,capacity_kt:38000,companies:['ThyssenKrupp','Salzgitter'],esg_risk:{env:40,social:22,governance:90},carbon_intensity_kg_per_t:1500,price_at_stage:620,workers_est:40000},
        {iso2:'KR',name:'South Korea',share_pct:3,capacity_kt:57000,companies:['POSCO'],esg_risk:{env:48,social:28,governance:82},carbon_intensity_kg_per_t:1400,price_at_stage:570,workers_est:55000},
      ]},
      {stage:'Manufacturing',description:'Finished steel products',countries:[
        {iso2:'CN',name:'China',share_pct:55,companies:['CITIC Steel','Shougang'],esg_risk:{env:60,social:45,governance:48},carbon_intensity_kg_per_t:200,price_at_stage:650,workers_est:2000000},
        {iso2:'EU',name:'EU',share_pct:12,companies:['ArcelorMittal','ThyssenKrupp','SSAB'],esg_risk:{env:35,social:25,governance:88},carbon_intensity_kg_per_t:150,price_at_stage:720,workers_est:300000},
        {iso2:'US',name:'USA',share_pct:8,companies:['Nucor','Cleveland-Cliffs'],esg_risk:{env:40,social:28,governance:85},carbon_intensity_kg_per_t:120,price_at_stage:700,workers_est:140000},
        {iso2:'IN',name:'India',share_pct:8,companies:['Tata Steel','JSW'],esg_risk:{env:58,social:48,governance:58},carbon_intensity_kg_per_t:250,price_at_stage:600,workers_est:500000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global',share_pct:100,companies:['Bulk carriers, rail'],esg_risk:{env:42,social:25,governance:70},carbon_intensity_kg_per_t:80,price_at_stage:670,workers_est:200000},
      ]},
      {stage:'Use',applications:[
        {use:'Construction (rebar, structural)',share_pct:52,growth_rate:2},
        {use:'Automotive',share_pct:12,growth_rate:1},
        {use:'Machinery & equipment',share_pct:15,growth_rate:3},
        {use:'Infrastructure (rail, bridges)',share_pct:12,growth_rate:4},
        {use:'Packaging (tin plate)',share_pct:4,growth_rate:1},
        {use:'Other',share_pct:5,growth_rate:2},
      ]},
      {stage:'End of Life',recycling_rate_pct:85,recycling_capacity_kt:600000,recycling_leaders:['Nucor (US)','ArcelorMittal','Tata Steel (UK)'],circular_economy_potential:'Very High - steel is most recycled material globally',recycling_carbon_saving_pct:75,workers_est:350000},
    ],
  },
  COTTON:{
    name:'Cotton',total_production_kt:25000,reserves_kt:0,reserves_years:0,unit:'USD/lb',price:0.72,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'IN',name:'India',share_pct:24,production_kt:6000,type:'Rainfed & irrigated',companies:['Smallholders (>10M farmers)'],regions:['Gujarat, Maharashtra, Telangana'],source_type:'Smallholder',esg_risk:{env:78,social:70,governance:45},water_intensity:'Very High (10,000L/kg)',carbon_intensity_kg_per_t:5000,price_at_stage:0.55,workers_est:10000000},
        {iso2:'CN',name:'China',share_pct:23,production_kt:5750,type:'Irrigated',companies:['XPCC'],regions:['Xinjiang (85%)'],esg_risk:{env:72,social:95,governance:30},forced_labor_risk:'Critical - Uyghur forced labor',price_at_stage:0.60,workers_est:5000000},
        {iso2:'US',name:'USA',share_pct:14,production_kt:3500,type:'Mechanized',companies:['Farm cooperatives'],regions:['Texas, Mississippi Delta'],esg_risk:{env:55,social:30,governance:85},price_at_stage:0.72,workers_est:50000},
        {iso2:'BR',name:'Brazil',share_pct:12,production_kt:3000,companies:['SLC Agricola'],regions:['Bahia, Mato Grosso'],esg_risk:{env:65,social:40,governance:60},deforestation_link:'Cerrado biome',price_at_stage:0.65,workers_est:200000},
        {iso2:'PK',name:'Pakistan',share_pct:5,production_kt:1250,esg_risk:{env:75,social:65,governance:40},water_intensity:'Very High (Indus)',price_at_stage:0.50,workers_est:2000000},
        {iso2:'UZ',name:'Uzbekistan',share_pct:3,production_kt:750,esg_risk:{env:70,social:80,governance:35},forced_labor_risk:'Historical (improving)',price_at_stage:0.55,workers_est:1000000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:40,type:'Ginning, spinning, weaving',esg_risk:{env:65,social:55,governance:42},carbon_intensity_kg_per_t:2500,price_at_stage:1.80,value_add_pct:60,workers_est:8000000},
        {iso2:'BD',name:'Bangladesh',share_pct:15,type:'Garment manufacturing',esg_risk:{env:72,social:80,governance:35},carbon_intensity_kg_per_t:3000,price_at_stage:2.50,workers_est:4000000},
        {iso2:'IN',name:'India',share_pct:15,type:'Spinning, weaving, dyeing',companies:['Arvind Ltd','Welspun India'],esg_risk:{env:68,social:60,governance:50},carbon_intensity_kg_per_t:2800,price_at_stage:2.20,workers_est:5000000},
        {iso2:'VN',name:'Vietnam',share_pct:10,type:'Garment assembly',esg_risk:{env:55,social:50,governance:55},carbon_intensity_kg_per_t:2200,price_at_stage:3.00,workers_est:2500000},
        {iso2:'TR',name:'Turkey',share_pct:5,type:'Textile production',esg_risk:{env:48,social:42,governance:58},carbon_intensity_kg_per_t:2000,price_at_stage:3.50,workers_est:500000},
      ]},
      {stage:'Manufacturing',description:'Finished textile & apparel',countries:[
        {iso2:'CN',name:'China',share_pct:35,companies:['Shenzhou International'],esg_risk:{env:55,social:48,governance:50},carbon_intensity_kg_per_t:1500,price_at_stage:8.00,workers_est:6000000},
        {iso2:'BD',name:'Bangladesh',share_pct:15,companies:['RMG sector'],esg_risk:{env:68,social:72,governance:38},carbon_intensity_kg_per_t:2000,price_at_stage:6.00,workers_est:4000000},
        {iso2:'VN',name:'Vietnam',share_pct:12,esg_risk:{env:50,social:45,governance:55},price_at_stage:7.50,workers_est:2800000},
        {iso2:'TR',name:'Turkey',share_pct:6,esg_risk:{env:48,social:42,governance:58},price_at_stage:9.00,workers_est:800000},
        {iso2:'ET',name:'Ethiopia',share_pct:2,esg_risk:{env:50,social:65,governance:35},price_at_stage:5.00,workers_est:200000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global',share_pct:100,companies:['Container shipping'],esg_risk:{env:40,social:28,governance:68},carbon_intensity_kg_per_t:300,workers_est:100000},
      ]},
      {stage:'Use',applications:[
        {use:'Apparel & fashion',share_pct:65,growth_rate:3},
        {use:'Home textiles',share_pct:20,growth_rate:2},
        {use:'Industrial textiles',share_pct:10,growth_rate:4},
        {use:'Medical textiles',share_pct:5,growth_rate:6},
      ]},
      {stage:'End of Life',recycling_rate_pct:12,recycling_capacity_kt:3000,recycling_leaders:['Renewcell (SE)','Worn Again (UK)','Circ (US)'],circular_economy_potential:'Growing - textile-to-textile recycling emerging',recycling_carbon_saving_pct:50,workers_est:20000},
    ],
  },
  GOLD:{
    name:'Gold',total_production_kt:3.6,reserves_kt:54,reserves_years:15,unit:'USD/oz',price:2650,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'CN',name:'China',share_pct:10,production_kt:0.37,type:'Hard rock mining',companies:['China National Gold','Zijin Mining'],esg_risk:{env:68,social:42,governance:40},carbon_intensity_kg_per_t:25000,price_at_stage:1200,workers_est:350000},
        {iso2:'AU',name:'Australia',share_pct:9,production_kt:0.31,type:'Open pit & underground',companies:['Newcrest','Northern Star'],esg_risk:{env:50,social:35,governance:85},carbon_intensity_kg_per_t:18000,price_at_stage:1350,workers_est:25000},
        {iso2:'RU',name:'Russia',share_pct:8,production_kt:0.30,companies:['Polyus','Polymetal'],esg_risk:{env:62,social:45,governance:32},carbon_intensity_kg_per_t:22000,price_at_stage:1100,sanctions_risk:'High',workers_est:50000},
        {iso2:'US',name:'USA',share_pct:5,production_kt:0.17,companies:['Newmont','Barrick'],regions:['Nevada, Alaska'],esg_risk:{env:48,social:30,governance:88},carbon_intensity_kg_per_t:16000,price_at_stage:1400,workers_est:15000},
        {iso2:'CA',name:'Canada',share_pct:5,production_kt:0.18,companies:['Barrick','Agnico Eagle'],esg_risk:{env:45,social:35,governance:88},carbon_intensity_kg_per_t:15000,price_at_stage:1380,workers_est:12000},
        {iso2:'GH',name:'Ghana',share_pct:3,production_kt:0.13,companies:['AngloGold Ashanti','Gold Fields'],esg_risk:{env:72,social:65,governance:48},carbon_intensity_kg_per_t:20000,price_at_stage:1150,workers_est:100000},
        {iso2:'ZA',name:'South Africa',share_pct:3,production_kt:0.10,companies:['Harmony Gold'],esg_risk:{env:65,social:60,governance:55},carbon_intensity_kg_per_t:28000,price_at_stage:1500,workers_est:80000},
        {iso2:'PE',name:'Peru',share_pct:4,production_kt:0.15,companies:['Buenaventura'],esg_risk:{env:70,social:62,governance:50},carbon_intensity_kg_per_t:19000,price_at_stage:1250,workers_est:40000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CH',name:'Switzerland',share_pct:40,type:'Refining (LBMA)',companies:['Valcambi','PAMP','Argor-Heraeus','Metalor'],esg_risk:{env:20,social:15,governance:95},carbon_intensity_kg_per_t:500,price_at_stage:2600,value_add_pct:80,workers_est:5000},
        {iso2:'AE',name:'UAE (Dubai)',share_pct:15,type:'Refining',companies:['Emirates Gold','Kaloti'],esg_risk:{env:25,social:35,governance:60},carbon_intensity_kg_per_t:600,price_at_stage:2580,workers_est:3000},
        {iso2:'IN',name:'India',share_pct:12,type:'Refining & jewelry making',companies:['MMTC-PAMP'],esg_risk:{env:40,social:35,governance:55},carbon_intensity_kg_per_t:800,price_at_stage:2590,workers_est:500000},
        {iso2:'CN',name:'China',share_pct:10,type:'Refining',companies:['Shandong Gold'],esg_risk:{env:48,social:38,governance:42},carbon_intensity_kg_per_t:700,price_at_stage:2570,workers_est:20000},
      ]},
      {stage:'Manufacturing',description:'Jewelry, coins, bars, electronics',countries:[
        {iso2:'IN',name:'India',share_pct:30,companies:['Titan','Tanishq'],esg_risk:{env:35,social:40,governance:55},carbon_intensity_kg_per_t:200,price_at_stage:2650,workers_est:4000000},
        {iso2:'CN',name:'China',share_pct:25,esg_risk:{env:38,social:35,governance:48},carbon_intensity_kg_per_t:250,price_at_stage:2650,workers_est:1000000},
        {iso2:'IT',name:'Italy',share_pct:8,companies:['Vicenza district'],esg_risk:{env:25,social:20,governance:88},carbon_intensity_kg_per_t:150,price_at_stage:2700,workers_est:50000},
        {iso2:'TR',name:'Turkey',share_pct:6,esg_risk:{env:32,social:35,governance:55},carbon_intensity_kg_per_t:200,price_at_stage:2660,workers_est:100000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global',share_pct:100,companies:['Brinks','Loomis','Secure logistics'],esg_risk:{env:20,social:15,governance:85},carbon_intensity_kg_per_t:50,workers_est:20000},
      ]},
      {stage:'Use',applications:[
        {use:'Jewelry',share_pct:50,growth_rate:3,companies:['Tiffany','Cartier','Pandora']},
        {use:'Investment (bars, coins, ETFs)',share_pct:25,growth_rate:8},
        {use:'Central bank reserves',share_pct:15,growth_rate:12},
        {use:'Electronics & industrial',share_pct:8,growth_rate:2},
        {use:'Dentistry & medical',share_pct:2,growth_rate:-2},
      ]},
      {stage:'End of Life',recycling_rate_pct:90,recycling_capacity_kt:1.1,recycling_leaders:['Umicore (BE)','Johnson Matthey (UK)','Heraeus (DE)'],circular_economy_potential:'Very High - gold is infinitely recyclable with minimal loss',recycling_carbon_saving_pct:95,workers_est:50000},
    ],
  },
  WTI_OIL:{
    name:'Crude Oil (WTI)',total_production_kt:4000000,reserves_kt:0,reserves_years:47,unit:'USD/bbl',price:72.50,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'US',name:'USA',share_pct:16,production_kt:640000,type:'Shale (Permian, Eagle Ford)',companies:['ExxonMobil','Chevron','Pioneer','ConocoPhillips'],esg_risk:{env:68,social:30,governance:85},carbon_intensity_kg_per_t:120,price_at_stage:35,workers_est:300000},
        {iso2:'SA',name:'Saudi Arabia',share_pct:13,production_kt:520000,companies:['Saudi Aramco'],esg_risk:{env:55,social:60,governance:35},carbon_intensity_kg_per_t:50,price_at_stage:8,workers_est:80000},
        {iso2:'RU',name:'Russia',share_pct:12,production_kt:480000,companies:['Rosneft','Lukoil'],esg_risk:{env:72,social:50,governance:28},carbon_intensity_kg_per_t:95,price_at_stage:20,sanctions_risk:'Very High',workers_est:250000},
        {iso2:'CA',name:'Canada',share_pct:6,production_kt:240000,type:'Oil sands + conventional',companies:['Suncor','Canadian Natural'],esg_risk:{env:88,social:42,governance:78},carbon_intensity_kg_per_t:180,price_at_stage:35,indigenous_impact:'First Nations rights',workers_est:100000},
        {iso2:'IQ',name:'Iraq',share_pct:5,production_kt:200000,companies:['Iraq National Oil'],esg_risk:{env:70,social:65,governance:25},carbon_intensity_kg_per_t:80,price_at_stage:12,workers_est:50000},
        {iso2:'AE',name:'UAE',share_pct:4,production_kt:160000,companies:['ADNOC'],esg_risk:{env:50,social:52,governance:50},carbon_intensity_kg_per_t:45,price_at_stage:10,workers_est:30000},
        {iso2:'BR',name:'Brazil',share_pct:4,production_kt:160000,companies:['Petrobras'],esg_risk:{env:65,social:40,governance:55},carbon_intensity_kg_per_t:100,price_at_stage:25,workers_est:70000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'US',name:'USA',share_pct:22,type:'Refining',companies:['Marathon Petroleum','Valero','Phillips 66'],esg_risk:{env:70,social:30,governance:82},carbon_intensity_kg_per_t:350,price_at_stage:55,value_add_pct:55,workers_est:65000},
        {iso2:'CN',name:'China',share_pct:18,type:'Mega-refineries',companies:['Sinopec','PetroChina','CNOOC'],esg_risk:{env:75,social:42,governance:40},carbon_intensity_kg_per_t:400,price_at_stage:52,workers_est:200000},
        {iso2:'IN',name:'India',share_pct:6,type:'Refining',companies:['Reliance (Jamnagar)','IOC'],esg_risk:{env:68,social:48,governance:55},carbon_intensity_kg_per_t:380,price_at_stage:53,workers_est:80000},
        {iso2:'KR',name:'South Korea',share_pct:3,companies:['SK Innovation','GS Caltex'],esg_risk:{env:48,social:28,governance:80},carbon_intensity_kg_per_t:320,price_at_stage:56,workers_est:15000},
        {iso2:'SA',name:'Saudi Arabia',share_pct:4,companies:['Saudi Aramco (Ras Tanura)'],esg_risk:{env:55,social:55,governance:38},carbon_intensity_kg_per_t:280,price_at_stage:48,workers_est:25000},
      ]},
      {stage:'Manufacturing',description:'Petrochemicals & finished products',countries:[
        {iso2:'US',name:'USA',share_pct:20,companies:['Dow','ExxonMobil Chemical'],esg_risk:{env:62,social:28,governance:82},carbon_intensity_kg_per_t:250,price_at_stage:65,workers_est:100000},
        {iso2:'CN',name:'China',share_pct:30,companies:['Sinopec','Wanhua Chemical'],esg_risk:{env:68,social:40,governance:42},carbon_intensity_kg_per_t:300,price_at_stage:60,workers_est:300000},
        {iso2:'DE',name:'Germany',share_pct:5,companies:['BASF','Covestro'],esg_risk:{env:35,social:22,governance:90},carbon_intensity_kg_per_t:200,price_at_stage:68,workers_est:50000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global tanker fleet',share_pct:100,companies:['Frontline','Euronav','DHT'],esg_risk:{env:55,social:32,governance:65},carbon_intensity_kg_per_t:30,workers_est:150000},
      ]},
      {stage:'Use',applications:[
        {use:'Transportation (gasoline, diesel, jet fuel)',share_pct:65,growth_rate:-1},
        {use:'Petrochemicals (plastics, synthetic fibers)',share_pct:16,growth_rate:3},
        {use:'Industrial & heating',share_pct:10,growth_rate:-3},
        {use:'Power generation',share_pct:5,growth_rate:-5},
        {use:'Lubricants & asphalt',share_pct:4,growth_rate:1},
      ]},
      {stage:'End of Life',recycling_rate_pct:2,recycling_leaders:['Plastic recycling (limited)','Used oil re-refining','Tire recycling'],circular_economy_potential:'Very Low for fuel (combusted); Limited for petrochemical products',recycling_carbon_saving_pct:5,workers_est:50000},
    ],
  },
  COPPER:{
    name:'Copper',total_production_kt:22000,reserves_kt:880000,reserves_years:40,unit:'USD/t',price:8950,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'CL',name:'Chile',share_pct:27,production_kt:5400,type:'Open pit mining',companies:['Codelco','BHP (Escondida)','Antofagasta'],regions:['Atacama, Antofagasta'],esg_risk:{env:72,social:45,governance:70},water_intensity:'Very High (arid)',carbon_intensity_kg_per_t:3500,price_at_stage:4500,workers_est:200000},
        {iso2:'PE',name:'Peru',share_pct:10,production_kt:2200,companies:['Freeport (Cerro Verde)','Southern Copper'],esg_risk:{env:70,social:62,governance:48},carbon_intensity_kg_per_t:3800,price_at_stage:4200,workers_est:100000},
        {iso2:'CD',name:'DR Congo',share_pct:12,production_kt:2640,companies:['CMOC','Ivanhoe Mines','Glencore'],esg_risk:{env:78,social:82,governance:32},carbon_intensity_kg_per_t:4500,price_at_stage:3800,workers_est:150000},
        {iso2:'CN',name:'China',share_pct:9,production_kt:1980,esg_risk:{env:65,social:42,governance:42},carbon_intensity_kg_per_t:4000,price_at_stage:5000,workers_est:180000},
        {iso2:'US',name:'USA',share_pct:5,production_kt:1100,companies:['Freeport-McMoRan'],regions:['Arizona, Utah'],esg_risk:{env:52,social:30,governance:85},carbon_intensity_kg_per_t:3000,price_at_stage:5200,workers_est:25000},
        {iso2:'AU',name:'Australia',share_pct:4,production_kt:880,companies:['BHP (Olympic Dam)'],esg_risk:{env:48,social:32,governance:85},carbon_intensity_kg_per_t:3200,price_at_stage:5000,workers_est:15000},
        {iso2:'ID',name:'Indonesia',share_pct:5,production_kt:1100,companies:['Freeport (Grasberg)'],esg_risk:{env:80,social:62,governance:40},carbon_intensity_kg_per_t:4200,price_at_stage:4000,workers_est:30000},
        {iso2:'ZM',name:'Zambia',share_pct:4,production_kt:880,companies:['First Quantum','Barrick'],esg_risk:{env:68,social:58,governance:42},carbon_intensity_kg_per_t:3800,price_at_stage:4100,workers_est:50000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:42,type:'Smelting & refining',companies:['Jiangxi Copper','Tongling'],esg_risk:{env:62,social:38,governance:42},carbon_intensity_kg_per_t:1200,price_at_stage:7500,value_add_pct:60,workers_est:200000},
        {iso2:'CL',name:'Chile',share_pct:12,type:'SX-EW & smelting',companies:['Codelco'],esg_risk:{env:50,social:38,governance:72},carbon_intensity_kg_per_t:900,price_at_stage:7800,workers_est:30000},
        {iso2:'JP',name:'Japan',share_pct:8,companies:['Sumitomo Metal Mining','JX Metals'],esg_risk:{env:35,social:22,governance:88},carbon_intensity_kg_per_t:800,price_at_stage:8200,workers_est:15000},
        {iso2:'DE',name:'Germany',share_pct:4,companies:['Aurubis'],esg_risk:{env:30,social:20,governance:90},carbon_intensity_kg_per_t:700,price_at_stage:8400,workers_est:8000},
      ]},
      {stage:'Manufacturing',description:'Wire, cable, tubing, alloys',countries:[
        {iso2:'CN',name:'China',share_pct:50,companies:['Various'],esg_risk:{env:50,social:38,governance:45},carbon_intensity_kg_per_t:400,price_at_stage:8800,workers_est:800000},
        {iso2:'US',name:'USA',share_pct:10,companies:['Southwire','Cerro Wire'],esg_risk:{env:38,social:25,governance:85},carbon_intensity_kg_per_t:300,price_at_stage:9200,workers_est:50000},
        {iso2:'DE',name:'Germany',share_pct:6,companies:['Nexans','Leoni'],esg_risk:{env:30,social:20,governance:88},carbon_intensity_kg_per_t:250,price_at_stage:9300,workers_est:25000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global',share_pct:100,esg_risk:{env:38,social:22,governance:70},carbon_intensity_kg_per_t:100,workers_est:80000},
      ]},
      {stage:'Use',applications:[
        {use:'Building construction (wiring, plumbing)',share_pct:28,growth_rate:2},
        {use:'Electrical & electronic',share_pct:25,growth_rate:5},
        {use:'Transport (EV, rail, auto)',share_pct:12,growth_rate:8},
        {use:'Industrial machinery',share_pct:12,growth_rate:2},
        {use:'Consumer products',share_pct:10,growth_rate:1},
        {use:'Power grid infrastructure',share_pct:13,growth_rate:10,companies:['ABB','Siemens','Prysmian']},
      ]},
      {stage:'End of Life',recycling_rate_pct:42,recycling_capacity_kt:4000,recycling_leaders:['Aurubis (DE)','Boliden (SE)','Mitsubishi Materials (JP)'],circular_economy_potential:'High - copper retains properties through recycling',recycling_carbon_saving_pct:80,workers_est:100000},
    ],
  },
  WHEAT:{
    name:'Wheat',total_production_kt:800000,reserves_kt:0,reserves_years:0,unit:'USD/bushel',price:5.85,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'CN',name:'China',share_pct:18,production_kt:137000,type:'Irrigated farming',esg_risk:{env:65,social:42,governance:42},carbon_intensity_kg_per_t:450,price_at_stage:240,workers_est:60000000},
        {iso2:'IN',name:'India',share_pct:14,production_kt:110000,type:'Irrigated (Punjab, Haryana)',esg_risk:{env:72,social:55,governance:48},water_intensity:'Very High (groundwater depletion)',carbon_intensity_kg_per_t:500,price_at_stage:200,workers_est:50000000},
        {iso2:'RU',name:'Russia',share_pct:12,production_kt:92000,type:'Rainfed + irrigated',companies:['Large agri-holdings'],esg_risk:{env:50,social:35,governance:32},carbon_intensity_kg_per_t:350,price_at_stage:180,workers_est:2000000},
        {iso2:'US',name:'USA',share_pct:6,production_kt:50000,type:'Mechanized',regions:['Kansas, N.Dakota, Montana'],esg_risk:{env:48,social:25,governance:88},carbon_intensity_kg_per_t:300,price_at_stage:220,workers_est:150000},
        {iso2:'FR',name:'France',share_pct:5,production_kt:40000,type:'Mechanized',esg_risk:{env:42,social:22,governance:88},carbon_intensity_kg_per_t:280,price_at_stage:230,workers_est:100000},
        {iso2:'CA',name:'Canada',share_pct:5,production_kt:35000,type:'Prairie farming',esg_risk:{env:40,social:22,governance:88},carbon_intensity_kg_per_t:290,price_at_stage:225,workers_est:80000},
        {iso2:'AU',name:'Australia',share_pct:4,production_kt:30000,esg_risk:{env:55,social:28,governance:85},carbon_intensity_kg_per_t:320,price_at_stage:210,workers_est:40000},
        {iso2:'UA',name:'Ukraine',share_pct:3,production_kt:22000,esg_risk:{env:48,social:55,governance:40},carbon_intensity_kg_per_t:380,price_at_stage:175,workers_est:500000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:25,type:'Flour milling',esg_risk:{env:40,social:35,governance:42},carbon_intensity_kg_per_t:150,price_at_stage:300,value_add_pct:25,workers_est:500000},
        {iso2:'US',name:'USA',share_pct:10,type:'Flour milling',companies:['Ardent Mills','ADM','Cargill'],esg_risk:{env:32,social:22,governance:88},carbon_intensity_kg_per_t:100,price_at_stage:320,workers_est:30000},
        {iso2:'IN',name:'India',share_pct:12,type:'Atta mills',esg_risk:{env:48,social:42,governance:48},carbon_intensity_kg_per_t:180,price_at_stage:280,workers_est:200000},
        {iso2:'TR',name:'Turkey',share_pct:8,type:'Flour milling (export)',esg_risk:{env:38,social:35,governance:55},carbon_intensity_kg_per_t:130,price_at_stage:290,workers_est:50000},
      ]},
      {stage:'Manufacturing',description:'Bread, pasta, cereals, animal feed',countries:[
        {iso2:'Global',name:'Global',share_pct:100,companies:['Bunge','ADM','Cargill','Associated British Foods'],esg_risk:{env:30,social:25,governance:75},carbon_intensity_kg_per_t:80,price_at_stage:500,workers_est:2000000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global grain trade',share_pct:100,companies:['ABCD (ADM, Bunge, Cargill, Dreyfus)'],esg_risk:{env:38,social:22,governance:72},carbon_intensity_kg_per_t:60,workers_est:100000},
      ]},
      {stage:'Use',applications:[
        {use:'Bread & bakery',share_pct:40,growth_rate:1},
        {use:'Animal feed',share_pct:35,growth_rate:2},
        {use:'Pasta & noodles',share_pct:10,growth_rate:2},
        {use:'Industrial (starch, ethanol)',share_pct:10,growth_rate:3},
        {use:'Seed',share_pct:5,growth_rate:0},
      ]},
      {stage:'End of Life',recycling_rate_pct:0,recycling_leaders:['N/A - consumed product'],circular_economy_potential:'Food waste composting; bioethanol from waste grain',recycling_carbon_saving_pct:10,workers_est:0},
    ],
  },
  SOYBEAN:{
    name:'Soybean',total_production_kt:395000,reserves_kt:0,reserves_years:0,unit:'USD/bushel',price:10.25,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'BR',name:'Brazil',share_pct:35,production_kt:138000,type:'Large-scale farming',companies:['SLC Agricola','Cargill','Bunge'],regions:['Mato Grosso, Goias, Bahia'],esg_risk:{env:78,social:42,governance:55},carbon_intensity_kg_per_t:600,deforestation_link:'Cerrado biome conversion',price_at_stage:370,workers_est:1500000},
        {iso2:'US',name:'USA',share_pct:28,production_kt:110000,type:'Mechanized row crop',companies:['ADM','Cargill','Bunge'],regions:['Iowa, Illinois, Minnesota'],esg_risk:{env:48,social:25,governance:85},carbon_intensity_kg_per_t:400,price_at_stage:380,workers_est:200000},
        {iso2:'AR',name:'Argentina',share_pct:13,production_kt:51000,type:'Pampas farming',companies:['Aceitera General Deheza','Vicentin'],esg_risk:{env:55,social:38,governance:50},carbon_intensity_kg_per_t:450,price_at_stage:360,workers_est:200000},
        {iso2:'CN',name:'China',share_pct:5,production_kt:20000,esg_risk:{env:58,social:42,governance:42},carbon_intensity_kg_per_t:500,price_at_stage:400,workers_est:5000000},
        {iso2:'IN',name:'India',share_pct:4,production_kt:12000,esg_risk:{env:62,social:52,governance:48},carbon_intensity_kg_per_t:550,price_at_stage:390,workers_est:3000000},
        {iso2:'PY',name:'Paraguay',share_pct:3,production_kt:10000,esg_risk:{env:72,social:55,governance:40},carbon_intensity_kg_per_t:500,deforestation_link:'Chaco deforestation',price_at_stage:350,workers_est:100000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:30,type:'Crushing (meal + oil)',companies:['COFCO','Sinograin','Wilmar'],esg_risk:{env:52,social:38,governance:42},carbon_intensity_kg_per_t:200,price_at_stage:450,value_add_pct:18,workers_est:100000},
        {iso2:'US',name:'USA',share_pct:18,type:'Crushing',companies:['ADM','Cargill','Bunge'],esg_risk:{env:35,social:22,governance:85},carbon_intensity_kg_per_t:150,price_at_stage:460,workers_est:15000},
        {iso2:'BR',name:'Brazil',share_pct:15,type:'Crushing',companies:['Amaggi','Cargill'],esg_risk:{env:48,social:35,governance:55},carbon_intensity_kg_per_t:180,price_at_stage:440,workers_est:40000},
        {iso2:'AR',name:'Argentina',share_pct:12,type:'Crushing (Rosario cluster)',companies:['AGD','Vicentin'],esg_risk:{env:42,social:35,governance:48},carbon_intensity_kg_per_t:170,price_at_stage:435,workers_est:20000},
      ]},
      {stage:'Manufacturing',description:'Animal feed, cooking oil, food products',countries:[
        {iso2:'Global',name:'Global',share_pct:100,companies:['ADM','Bunge','Cargill','Wilmar'],esg_risk:{env:35,social:25,governance:72},carbon_intensity_kg_per_t:80,price_at_stage:500,workers_est:500000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global grain trade',share_pct:100,companies:['ABCD traders','dry bulk shipping'],esg_risk:{env:40,social:22,governance:70},carbon_intensity_kg_per_t:50,workers_est:80000},
      ]},
      {stage:'Use',applications:[
        {use:'Animal feed (soy meal)',share_pct:70,growth_rate:2},
        {use:'Cooking oil (soy oil)',share_pct:18,growth_rate:3},
        {use:'Biodiesel (RVO mandate)',share_pct:6,growth_rate:8},
        {use:'Industrial (lecithin, paints)',share_pct:4,growth_rate:1},
        {use:'Direct food (tofu, soy milk)',share_pct:2,growth_rate:5},
      ]},
      {stage:'End of Life',recycling_rate_pct:0,recycling_leaders:['N/A - consumed product'],circular_economy_potential:'Soy hull biomass for energy; waste cooking oil for biodiesel',recycling_carbon_saving_pct:10,workers_est:0},
    ],
  },
  COCOA:{
    name:'Cocoa',total_production_kt:5200,reserves_kt:0,reserves_years:0,unit:'USD/t',price:8500,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'CI',name:'Ivory Coast',share_pct:38,production_kt:2100,type:'Smallholder farming',companies:['Cooperatives (>800K farmers)'],esg_risk:{env:82,social:85,governance:35},carbon_intensity_kg_per_t:2000,deforestation_ha_yr:120000,child_labor_risk:'High - est 1.5M children',price_at_stage:2500,workers_est:1000000},
        {iso2:'GH',name:'Ghana',share_pct:17,production_kt:900,companies:['COCOBOD (state board)'],esg_risk:{env:75,social:78,governance:45},carbon_intensity_kg_per_t:1800,child_labor_risk:'High - est 800K children',price_at_stage:2400,workers_est:800000},
        {iso2:'EC',name:'Ecuador',share_pct:7,production_kt:380,esg_risk:{env:58,social:52,governance:52},carbon_intensity_kg_per_t:1500,price_at_stage:2800,workers_est:100000},
        {iso2:'CM',name:'Cameroon',share_pct:5,production_kt:280,esg_risk:{env:72,social:68,governance:35},carbon_intensity_kg_per_t:1900,price_at_stage:2300,workers_est:200000},
        {iso2:'ID',name:'Indonesia',share_pct:5,production_kt:260,esg_risk:{env:65,social:50,governance:42},carbon_intensity_kg_per_t:1600,price_at_stage:2200,workers_est:400000},
        {iso2:'NG',name:'Nigeria',share_pct:5,production_kt:260,esg_risk:{env:70,social:65,governance:32},carbon_intensity_kg_per_t:1800,price_at_stage:2100,workers_est:300000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'NL',name:'Netherlands',share_pct:25,type:'Cocoa grinding',companies:['Cargill','Barry Callebaut','Olam'],esg_risk:{env:25,social:18,governance:92},carbon_intensity_kg_per_t:300,price_at_stage:5500,value_add_pct:50,workers_est:8000},
        {iso2:'CI',name:'Ivory Coast',share_pct:15,type:'Local grinding',esg_risk:{env:48,social:45,governance:38},carbon_intensity_kg_per_t:500,price_at_stage:4500,workers_est:15000},
        {iso2:'DE',name:'Germany',share_pct:8,companies:['Euromar'],esg_risk:{env:22,social:18,governance:90},carbon_intensity_kg_per_t:280,price_at_stage:5800,workers_est:5000},
        {iso2:'US',name:'USA',share_pct:8,companies:['Cargill','ADM'],esg_risk:{env:28,social:22,governance:85},carbon_intensity_kg_per_t:320,price_at_stage:5700,workers_est:6000},
      ]},
      {stage:'Manufacturing',description:'Chocolate & confectionery',countries:[
        {iso2:'CH',name:'Switzerland',share_pct:10,companies:['Barry Callebaut','Lindt','Nestle'],esg_risk:{env:20,social:15,governance:92},carbon_intensity_kg_per_t:150,price_at_stage:8500,workers_est:20000},
        {iso2:'US',name:'USA',share_pct:20,companies:['Mars','Hershey','Mondelez'],esg_risk:{env:30,social:22,governance:85},carbon_intensity_kg_per_t:200,price_at_stage:8000,workers_est:50000},
        {iso2:'DE',name:'Germany',share_pct:8,companies:['Ferrero','Ritter Sport'],esg_risk:{env:22,social:18,governance:88},carbon_intensity_kg_per_t:180,price_at_stage:8200,workers_est:15000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global',share_pct:100,esg_risk:{env:35,social:22,governance:72},carbon_intensity_kg_per_t:100,workers_est:80000},
      ]},
      {stage:'Use',applications:[
        {use:'Chocolate bars & confectionery',share_pct:55,growth_rate:3},
        {use:'Cocoa powder (beverages, baking)',share_pct:25,growth_rate:2},
        {use:'Cocoa butter (cosmetics)',share_pct:12,growth_rate:5},
        {use:'Industrial uses',share_pct:8,growth_rate:1},
      ]},
      {stage:'End of Life',recycling_rate_pct:0,recycling_leaders:['N/A - consumed product'],circular_economy_potential:'Cocoa pod husks for biomass energy; shell mulch',recycling_carbon_saving_pct:5,workers_est:0},
    ],
  },
  COFFEE:{
    name:'Coffee',total_production_kt:10500,reserves_kt:0,reserves_years:0,unit:'USD/lb',price:3.85,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'BR',name:'Brazil',share_pct:35,production_kt:3700,type:'Mechanized + smallholder',companies:['Cooperatives'],regions:['Minas Gerais, Sao Paulo, Espirito Santo'],esg_risk:{env:58,social:42,governance:60},carbon_intensity_kg_per_t:1200,price_at_stage:1.50,workers_est:3000000},
        {iso2:'VN',name:'Vietnam',share_pct:18,production_kt:1900,type:'Robusta smallholder',esg_risk:{env:62,social:48,governance:52},carbon_intensity_kg_per_t:1400,price_at_stage:1.20,workers_est:2500000},
        {iso2:'CO',name:'Colombia',share_pct:8,production_kt:840,type:'Arabica highland',companies:['FNC (National Federation)'],esg_risk:{env:50,social:45,governance:62},carbon_intensity_kg_per_t:1000,price_at_stage:2.00,workers_est:500000},
        {iso2:'ET',name:'Ethiopia',share_pct:5,production_kt:525,type:'Wild-grown & smallholder',esg_risk:{env:42,social:55,governance:38},carbon_intensity_kg_per_t:800,price_at_stage:1.80,workers_est:5000000},
        {iso2:'ID',name:'Indonesia',share_pct:5,production_kt:525,esg_risk:{env:60,social:50,governance:42},carbon_intensity_kg_per_t:1300,price_at_stage:1.40,workers_est:2000000},
        {iso2:'HN',name:'Honduras',share_pct:4,production_kt:420,esg_risk:{env:52,social:55,governance:42},carbon_intensity_kg_per_t:1100,price_at_stage:1.70,workers_est:300000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'DE',name:'Germany',share_pct:15,type:'Roasting',companies:['Tchibo','Jacobs (JDE Peets)'],esg_risk:{env:22,social:18,governance:90},carbon_intensity_kg_per_t:200,price_at_stage:8.00,value_add_pct:65,workers_est:15000},
        {iso2:'US',name:'USA',share_pct:15,type:'Roasting',companies:['Starbucks','Keurig Dr Pepper'],esg_risk:{env:25,social:20,governance:85},carbon_intensity_kg_per_t:220,price_at_stage:8.50,workers_est:25000},
        {iso2:'CH',name:'Switzerland',share_pct:8,companies:['Nestle (Nespresso)'],esg_risk:{env:20,social:15,governance:92},carbon_intensity_kg_per_t:180,price_at_stage:9.00,workers_est:5000},
        {iso2:'IT',name:'Italy',share_pct:8,companies:['Lavazza','Illy'],esg_risk:{env:22,social:18,governance:88},carbon_intensity_kg_per_t:190,price_at_stage:8.80,workers_est:8000},
        {iso2:'BR',name:'Brazil',share_pct:12,type:'Domestic roasting',esg_risk:{env:38,social:32,governance:58},carbon_intensity_kg_per_t:250,price_at_stage:5.00,workers_est:40000},
      ]},
      {stage:'Manufacturing',description:'Packaged coffee, instant, capsules',countries:[
        {iso2:'Global',name:'Global',share_pct:100,companies:['Nestle','JDE Peets','Starbucks','Lavazza'],esg_risk:{env:28,social:20,governance:80},carbon_intensity_kg_per_t:100,price_at_stage:15.00,workers_est:200000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global',share_pct:100,esg_risk:{env:35,social:20,governance:72},carbon_intensity_kg_per_t:80,workers_est:100000},
      ]},
      {stage:'Use',applications:[
        {use:'Roast & ground (home)',share_pct:40,growth_rate:2},
        {use:'Instant coffee',share_pct:25,growth_rate:1},
        {use:'Coffee shops (out-of-home)',share_pct:20,growth_rate:5},
        {use:'Capsules & pods',share_pct:12,growth_rate:8},
        {use:'RTD coffee beverages',share_pct:3,growth_rate:12},
      ]},
      {stage:'End of Life',recycling_rate_pct:5,recycling_leaders:['Coffee grounds composting','Bio-bean (UK) - biofuel from grounds'],circular_economy_potential:'Moderate - grounds for biofuel, compost; pod recycling emerging',recycling_carbon_saving_pct:15,workers_est:5000},
    ],
  },
  RUBBER:{
    name:'Natural Rubber',total_production_kt:14000,reserves_kt:0,reserves_years:0,unit:'USD/t',price:1650,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'TH',name:'Thailand',share_pct:33,production_kt:4620,type:'Smallholder tapping',esg_risk:{env:55,social:42,governance:60},carbon_intensity_kg_per_t:800,price_at_stage:1200,workers_est:1200000},
        {iso2:'ID',name:'Indonesia',share_pct:23,production_kt:3220,type:'Smallholder',esg_risk:{env:72,social:55,governance:42},carbon_intensity_kg_per_t:900,deforestation_ha_yr:50000,price_at_stage:1100,workers_est:2500000},
        {iso2:'VN',name:'Vietnam',share_pct:8,production_kt:1120,esg_risk:{env:58,social:45,governance:52},carbon_intensity_kg_per_t:850,price_at_stage:1150,workers_est:500000},
        {iso2:'CI',name:'Ivory Coast',share_pct:6,production_kt:840,esg_risk:{env:65,social:58,governance:38},carbon_intensity_kg_per_t:950,price_at_stage:1050,workers_est:200000},
        {iso2:'MY',name:'Malaysia',share_pct:4,production_kt:560,esg_risk:{env:60,social:52,governance:55},carbon_intensity_kg_per_t:800,price_at_stage:1250,workers_est:100000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'TH',name:'Thailand',share_pct:30,type:'RSS, STR processing',esg_risk:{env:48,social:35,governance:58},carbon_intensity_kg_per_t:300,price_at_stage:1500,value_add_pct:20,workers_est:80000},
        {iso2:'ID',name:'Indonesia',share_pct:20,esg_risk:{env:55,social:45,governance:42},carbon_intensity_kg_per_t:350,price_at_stage:1450,workers_est:50000},
        {iso2:'MY',name:'Malaysia',share_pct:10,esg_risk:{env:42,social:35,governance:60},carbon_intensity_kg_per_t:280,price_at_stage:1550,workers_est:20000},
      ]},
      {stage:'Manufacturing',description:'Tires, gloves, hoses, belts',countries:[
        {iso2:'CN',name:'China',share_pct:30,companies:['GITI','Triangle Tyre'],esg_risk:{env:55,social:42,governance:45},carbon_intensity_kg_per_t:500,price_at_stage:3000,workers_est:300000},
        {iso2:'JP',name:'Japan',share_pct:12,companies:['Bridgestone'],esg_risk:{env:32,social:22,governance:88},carbon_intensity_kg_per_t:350,price_at_stage:3500,workers_est:40000},
        {iso2:'US',name:'USA',share_pct:8,companies:['Goodyear'],esg_risk:{env:38,social:25,governance:82},carbon_intensity_kg_per_t:400,price_at_stage:3200,workers_est:30000},
        {iso2:'DE',name:'Germany',share_pct:6,companies:['Continental'],esg_risk:{env:28,social:20,governance:88},carbon_intensity_kg_per_t:320,price_at_stage:3400,workers_est:20000},
        {iso2:'FR',name:'France',share_pct:8,companies:['Michelin'],esg_risk:{env:30,social:22,governance:88},carbon_intensity_kg_per_t:340,price_at_stage:3600,workers_est:25000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global',share_pct:100,esg_risk:{env:38,social:22,governance:70},carbon_intensity_kg_per_t:100,workers_est:50000},
      ]},
      {stage:'Use',applications:[
        {use:'Tires',share_pct:70,growth_rate:3,companies:['Bridgestone','Michelin','Goodyear','Continental']},
        {use:'Medical gloves',share_pct:12,growth_rate:5},
        {use:'Industrial (hoses, belts, seals)',share_pct:10,growth_rate:2},
        {use:'Footwear',share_pct:5,growth_rate:2},
        {use:'Other',share_pct:3,growth_rate:1},
      ]},
      {stage:'End of Life',recycling_rate_pct:18,recycling_leaders:['Tire recycling (crumb rubber)','Pyrolysis (tire-derived fuel)'],circular_economy_potential:'Moderate - tire recycling growing, devulcanization R&D',recycling_carbon_saving_pct:40,workers_est:30000},
    ],
  },
  IRON_ORE:{
    name:'Iron Ore',total_production_kt:2400000,reserves_kt:0,reserves_years:0,unit:'USD/t',price:110,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'AU',name:'Australia',share_pct:38,production_kt:900000,type:'Open pit',companies:['BHP','Rio Tinto','Fortescue'],regions:['Pilbara'],esg_risk:{env:55,social:42,governance:85},carbon_intensity_kg_per_t:45,price_at_stage:25,workers_est:60000},
        {iso2:'BR',name:'Brazil',share_pct:17,production_kt:400000,companies:['Vale'],esg_risk:{env:78,social:55,governance:48},carbon_intensity_kg_per_t:50,price_at_stage:22,workers_est:40000},
        {iso2:'CN',name:'China',share_pct:14,production_kt:340000,esg_risk:{env:72,social:45,governance:40},carbon_intensity_kg_per_t:65,price_at_stage:40,workers_est:200000},
        {iso2:'IN',name:'India',share_pct:10,production_kt:240000,companies:['NMDC'],esg_risk:{env:68,social:55,governance:52},carbon_intensity_kg_per_t:55,price_at_stage:30,workers_est:150000},
        {iso2:'RU',name:'Russia',share_pct:4,production_kt:96000,esg_risk:{env:60,social:42,governance:32},carbon_intensity_kg_per_t:52,price_at_stage:28,sanctions_risk:'High',workers_est:30000},
        {iso2:'ZA',name:'South Africa',share_pct:4,production_kt:96000,esg_risk:{env:58,social:52,governance:52},carbon_intensity_kg_per_t:48,price_at_stage:30,workers_est:25000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:65,type:'Sintering, pelletizing',esg_risk:{env:78,social:42,governance:42},carbon_intensity_kg_per_t:200,price_at_stage:80,value_add_pct:55,workers_est:500000},
        {iso2:'AU',name:'Australia',share_pct:8,type:'Pelletizing',esg_risk:{env:42,social:28,governance:85},carbon_intensity_kg_per_t:120,price_at_stage:45,workers_est:10000},
        {iso2:'BR',name:'Brazil',share_pct:5,type:'Pelletizing',companies:['Vale'],esg_risk:{env:55,social:40,governance:52},carbon_intensity_kg_per_t:140,price_at_stage:42,workers_est:8000},
      ]},
      {stage:'Manufacturing',description:'Steel production input',countries:[
        {iso2:'CN',name:'China',share_pct:55,esg_risk:{env:82,social:45,governance:42},carbon_intensity_kg_per_t:1800,price_at_stage:110,workers_est:3000000},
        {iso2:'JP',name:'Japan',share_pct:5,esg_risk:{env:42,social:22,governance:88},carbon_intensity_kg_per_t:1600,price_at_stage:110,workers_est:100000},
        {iso2:'IN',name:'India',share_pct:8,esg_risk:{env:72,social:52,governance:55},carbon_intensity_kg_per_t:2000,price_at_stage:105,workers_est:600000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global (seaborne bulk)',share_pct:100,companies:['Cape-size bulk carriers'],esg_risk:{env:48,social:28,governance:65},carbon_intensity_kg_per_t:20,workers_est:30000},
      ]},
      {stage:'Use',applications:[
        {use:'Steel production (BF-BOF)',share_pct:90,growth_rate:1},
        {use:'Direct Reduced Iron (DRI)',share_pct:7,growth_rate:8},
        {use:'Other (cement, pigments)',share_pct:3,growth_rate:1},
      ]},
      {stage:'End of Life',recycling_rate_pct:0,recycling_leaders:['N/A - iron ore not recycled directly; steel is recycled'],circular_economy_potential:'Iron ore consumed in steelmaking; circularity via steel scrap recycling (85%)',recycling_carbon_saving_pct:0,workers_est:0},
    ],
  },
  CEMENT:{
    name:'Cement',total_production_kt:4200000,reserves_kt:0,reserves_years:0,unit:'USD/t',price:125,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'CN',name:'China',share_pct:55,production_kt:2100000,type:'Limestone quarrying',companies:['CNBM','Anhui Conch','China Resources'],esg_risk:{env:75,social:42,governance:42},carbon_intensity_kg_per_t:40,price_at_stage:8,workers_est:2000000},
        {iso2:'IN',name:'India',share_pct:8,production_kt:370000,companies:['UltraTech','Ambuja','ACC'],esg_risk:{env:68,social:52,governance:55},carbon_intensity_kg_per_t:35,price_at_stage:7,workers_est:500000},
        {iso2:'VN',name:'Vietnam',share_pct:3,production_kt:120000,esg_risk:{env:62,social:45,governance:48},carbon_intensity_kg_per_t:38,price_at_stage:6,workers_est:100000},
        {iso2:'US',name:'USA',share_pct:2,production_kt:100000,companies:['CRH','Holcim','Buzzi'],esg_risk:{env:45,social:25,governance:85},carbon_intensity_kg_per_t:30,price_at_stage:10,workers_est:15000},
        {iso2:'TR',name:'Turkey',share_pct:2,production_kt:85000,esg_risk:{env:55,social:38,governance:52},carbon_intensity_kg_per_t:35,price_at_stage:8,workers_est:30000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:55,type:'Clinker kiln + grinding',esg_risk:{env:85,social:42,governance:42},carbon_intensity_kg_per_t:620,price_at_stage:65,value_add_pct:85,workers_est:1000000},
        {iso2:'IN',name:'India',share_pct:8,esg_risk:{env:78,social:48,governance:52},carbon_intensity_kg_per_t:660,price_at_stage:55,workers_est:200000},
        {iso2:'EU',name:'EU',share_pct:5,companies:['Holcim','HeidelbergCement','CRH'],esg_risk:{env:55,social:22,governance:88},carbon_intensity_kg_per_t:500,price_at_stage:95,workers_est:60000},
        {iso2:'US',name:'USA',share_pct:2,esg_risk:{env:52,social:25,governance:85},carbon_intensity_kg_per_t:520,price_at_stage:100,workers_est:15000},
      ]},
      {stage:'Manufacturing',description:'Ready-mix concrete, precast',countries:[
        {iso2:'Global',name:'Global',share_pct:100,companies:['Holcim','HeidelbergCement','CNBM','CRH'],esg_risk:{env:60,social:30,governance:70},carbon_intensity_kg_per_t:50,price_at_stage:125,workers_est:3000000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Local',name:'Local (cement is heavy, short-range)',share_pct:100,esg_risk:{env:42,social:28,governance:68},carbon_intensity_kg_per_t:15,workers_est:200000},
      ]},
      {stage:'Use',applications:[
        {use:'Residential construction',share_pct:40,growth_rate:2},
        {use:'Infrastructure (roads, bridges)',share_pct:30,growth_rate:3},
        {use:'Commercial construction',share_pct:20,growth_rate:2},
        {use:'Other (precast, specialty)',share_pct:10,growth_rate:3},
      ]},
      {stage:'End of Life',recycling_rate_pct:10,recycling_leaders:['Recycled aggregate from demolished concrete','Carbon mineralization R&D'],circular_economy_potential:'Growing - carbon capture in concrete, recycled aggregate replacing virgin',recycling_carbon_saving_pct:20,workers_est:50000},
    ],
  },

  NICKEL:{
    name:'Nickel',total_production_kt:3300,reserves_kt:100000,reserves_years:30,unit:'USD/t',price:16200,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'ID',name:'Indonesia',share_pct:48,production_kt:1600,type:'Laterite (HPAL, RKEF)',companies:['Vale Indonesia','Harita Nickel','QMB (Tsingshan)'],regions:['Sulawesi, Maluku, Halmahera'],esg_risk:{env:82,social:55,governance:42},carbon_intensity_kg_per_t:50000,price_at_stage:8000,workers_est:200000},
        {iso2:'PH',name:'Philippines',share_pct:10,production_kt:330,type:'Laterite ore',companies:['Nickel Asia','DMCI'],esg_risk:{env:72,social:52,governance:48},carbon_intensity_kg_per_t:35000,price_at_stage:7500,workers_est:30000},
        {iso2:'RU',name:'Russia',share_pct:6,production_kt:200,companies:['Nornickel'],regions:['Norilsk'],esg_risk:{env:75,social:48,governance:30},carbon_intensity_kg_per_t:28000,price_at_stage:10000,sanctions_risk:'Partial',workers_est:60000},
        {iso2:'AU',name:'Australia',share_pct:5,production_kt:165,companies:['BHP Nickel West','IGO'],esg_risk:{env:48,social:30,governance:85},carbon_intensity_kg_per_t:22000,price_at_stage:11000,workers_est:8000},
        {iso2:'CA',name:'Canada',share_pct:4,production_kt:132,companies:['Vale (Sudbury/Voisey)','Glencore'],esg_risk:{env:45,social:32,governance:88},carbon_intensity_kg_per_t:20000,price_at_stage:11500,workers_est:10000},
        {iso2:'NC',name:'New Caledonia',share_pct:5,production_kt:165,companies:['Prony Resources','KNS','Vale NC'],esg_risk:{env:68,social:55,governance:55},carbon_intensity_kg_per_t:42000,price_at_stage:9000,workers_est:5000},
        {iso2:'CN',name:'China',share_pct:4,production_kt:132,esg_risk:{env:65,social:42,governance:42},carbon_intensity_kg_per_t:30000,price_at_stage:9500,workers_est:50000},
        {iso2:'BR',name:'Brazil',share_pct:3,production_kt:100,companies:['Vale (Onca Puma)'],esg_risk:{env:62,social:45,governance:55},carbon_intensity_kg_per_t:35000,price_at_stage:9200,workers_est:8000},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:35,type:'NPI + Class 1 nickel',companies:['Tsingshan','Huayou','GEM'],esg_risk:{env:68,social:40,governance:42},carbon_intensity_kg_per_t:12000,price_at_stage:14000,value_add_pct:50,workers_est:80000},
        {iso2:'ID',name:'Indonesia',share_pct:28,type:'HPAL, RKEF smelters',companies:['PT Halmahera','QMB','Huayou Cobalt'],esg_risk:{env:75,social:50,governance:42},carbon_intensity_kg_per_t:18000,price_at_stage:13000,workers_est:50000},
        {iso2:'JP',name:'Japan',share_pct:8,companies:['Sumitomo Metal Mining'],esg_risk:{env:35,social:22,governance:88},carbon_intensity_kg_per_t:8000,price_at_stage:15500,workers_est:5000},
        {iso2:'FI',name:'Finland',share_pct:5,companies:['Nornickel Harjavalta','Terrafame'],esg_risk:{env:32,social:20,governance:90},carbon_intensity_kg_per_t:6000,price_at_stage:15800,workers_est:3000},
        {iso2:'AU',name:'Australia',share_pct:4,companies:['BHP Nickel West'],esg_risk:{env:40,social:28,governance:85},carbon_intensity_kg_per_t:9000,price_at_stage:15200,workers_est:3000},
      ]},
      {stage:'Manufacturing',description:'Stainless steel, battery cathodes',countries:[
        {iso2:'CN',name:'China',share_pct:60,companies:['Tsingshan (SS)','CATL (battery)'],esg_risk:{env:58,social:40,governance:45},carbon_intensity_kg_per_t:5000,price_at_stage:16000,workers_est:500000},
        {iso2:'JP',name:'Japan',share_pct:8,companies:['Nippon Steel (SS)','Panasonic (battery)'],esg_risk:{env:35,social:22,governance:88},carbon_intensity_kg_per_t:3500,price_at_stage:16500,workers_est:50000},
        {iso2:'KR',name:'South Korea',share_pct:6,companies:['POSCO (SS)','LG Energy (battery)'],esg_risk:{env:38,social:25,governance:82},carbon_intensity_kg_per_t:3800,price_at_stage:16300,workers_est:30000},
        {iso2:'EU',name:'EU',share_pct:8,companies:['Outokumpu (SS)','Umicore (battery)'],esg_risk:{env:30,social:20,governance:88},carbon_intensity_kg_per_t:3200,price_at_stage:16800,workers_est:40000},
      ]},
      {stage:'Distribution',countries:[
        {iso2:'Global',name:'Global',share_pct:100,esg_risk:{env:38,social:22,governance:70},carbon_intensity_kg_per_t:200,workers_est:30000},
      ]},
      {stage:'Use',applications:[
        {use:'Stainless steel',share_pct:68,growth_rate:2},
        {use:'EV batteries (NMC/NCA)',share_pct:14,growth_rate:25},
        {use:'Alloys & superalloys',share_pct:8,growth_rate:3},
        {use:'Plating',share_pct:6,growth_rate:1},
        {use:'Other',share_pct:4,growth_rate:2},
      ]},
      {stage:'End of Life',recycling_rate_pct:55,recycling_capacity_kt:1000,recycling_leaders:['Glencore','Boliden','Umicore','Sumitomo'],circular_economy_potential:'High in stainless steel scrap; growing in battery recycling',recycling_carbon_saving_pct:65,workers_est:30000},
    ],
  },
};

/* ================================================================= COUNTRY DATABASE: 30+ Countries with aggregate supply chain exposure */
const COUNTRY_SC_DATABASE = {
  CN:{name:'China',iso2:'CN',supply_chains:['LITHIUM','COBALT','STEEL','COPPER','WHEAT','COCOA','COFFEE','NICKEL','IRON_ORE','CEMENT','COTTON','RUBBER','GOLD','WTI_OIL','PALM_OIL','SOYBEAN'],total_stages:48,dominant_role:'Processing & Manufacturing',avg_esg_env:65,avg_esg_social:42,avg_esg_governance:42,worker_estimate:15000000,regulatory_risk:'Export controls on critical minerals',geopolitical:'US-China tensions'},
  US:{name:'USA',iso2:'US',supply_chains:['LITHIUM','COBALT','STEEL','COPPER','WHEAT','COFFEE','NICKEL','WTI_OIL','COTTON','GOLD','CEMENT','SOYBEAN'],total_stages:30,dominant_role:'Extraction & Refining',avg_esg_env:48,avg_esg_social:28,avg_esg_governance:85,worker_estimate:800000,regulatory_risk:'IRA reshoring incentives',geopolitical:'Stable'},
  AU:{name:'Australia',iso2:'AU',supply_chains:['LITHIUM','COBALT','STEEL','COPPER','IRON_ORE','NICKEL','GOLD','WHEAT'],total_stages:15,dominant_role:'Extraction',avg_esg_env:50,avg_esg_social:35,avg_esg_governance:85,worker_estimate:200000,regulatory_risk:'Indigenous rights, water rights',geopolitical:'China trade dependency'},
  BR:{name:'Brazil',iso2:'BR',supply_chains:['STEEL','IRON_ORE','COFFEE','NICKEL','LITHIUM','COTTON','WTI_OIL','GOLD','SOYBEAN'],total_stages:14,dominant_role:'Extraction',avg_esg_env:68,avg_esg_social:48,avg_esg_governance:55,worker_estimate:5000000,regulatory_risk:'Amazon deforestation politics',geopolitical:'BRICS alignment'},
  CD:{name:'DR Congo',iso2:'CD',supply_chains:['COBALT','COPPER'],total_stages:4,dominant_role:'Extraction',avg_esg_env:80,avg_esg_social:88,avg_esg_governance:30,worker_estimate:400000,regulatory_risk:'Conflict mineral regulations',geopolitical:'Instability, armed groups'},
  CL:{name:'Chile',iso2:'CL',supply_chains:['LITHIUM','COPPER'],total_stages:6,dominant_role:'Extraction',avg_esg_env:72,avg_esg_social:48,avg_esg_governance:70,worker_estimate:250000,regulatory_risk:'Water rights, lithium nationalization',geopolitical:'Stable, OECD member'},
  IN:{name:'India',iso2:'IN',supply_chains:['STEEL','WHEAT','COTTON','IRON_ORE','PALM_OIL','CEMENT','GOLD','COCOA'],total_stages:16,dominant_role:'Extraction & Processing',avg_esg_env:68,avg_esg_social:52,avg_esg_governance:52,worker_estimate:65000000,regulatory_risk:'Export restrictions, MSP policy',geopolitical:'Strategic autonomy'},
  ID:{name:'Indonesia',iso2:'ID',supply_chains:['PALM_OIL','NICKEL','COPPER','RUBBER','COCOA','COFFEE','COAL'],total_stages:14,dominant_role:'Extraction',avg_esg_env:75,avg_esg_social:55,avg_esg_governance:42,worker_estimate:10000000,regulatory_risk:'Ore export bans, EUDR compliance',geopolitical:'ASEAN, nickel leverage'},
  RU:{name:'Russia',iso2:'RU',supply_chains:['STEEL','NICKEL','GOLD','WTI_OIL','WHEAT','IRON_ORE','COBALT'],total_stages:10,dominant_role:'Extraction',avg_esg_env:65,avg_esg_social:48,avg_esg_governance:32,worker_estimate:500000,regulatory_risk:'Sanctions, market isolation',geopolitical:'Ukraine war, Western sanctions'},
  JP:{name:'Japan',iso2:'JP',supply_chains:['LITHIUM','COBALT','STEEL','COPPER','NICKEL','IRON_ORE','GOLD','RUBBER'],total_stages:12,dominant_role:'Processing & Manufacturing',avg_esg_env:35,avg_esg_social:22,avg_esg_governance:88,worker_estimate:400000,regulatory_risk:'Resource import dependency',geopolitical:'US alliance, China competition'},
  DE:{name:'Germany',iso2:'DE',supply_chains:['LITHIUM','STEEL','COPPER','COCOA','COFFEE','NICKEL','WTI_OIL'],total_stages:10,dominant_role:'Manufacturing',avg_esg_env:30,avg_esg_social:20,avg_esg_governance:90,worker_estimate:200000,regulatory_risk:'EU supply chain due diligence',geopolitical:'EU integration'},
  KR:{name:'South Korea',iso2:'KR',supply_chains:['LITHIUM','COBALT','STEEL','NICKEL','WTI_OIL'],total_stages:8,dominant_role:'Manufacturing (batteries)',avg_esg_env:40,avg_esg_social:28,avg_esg_governance:82,worker_estimate:150000,regulatory_risk:'IRA compliance for EVs',geopolitical:'US alliance'},
  CI:{name:'Ivory Coast',iso2:'CI',supply_chains:['COCOA','RUBBER'],total_stages:4,dominant_role:'Extraction',avg_esg_env:78,avg_esg_social:82,avg_esg_governance:38,worker_estimate:3000000,regulatory_risk:'EUDR compliance',geopolitical:'Cocoa cartel with Ghana'},
  GH:{name:'Ghana',iso2:'GH',supply_chains:['COCOA','GOLD'],total_stages:3,dominant_role:'Extraction',avg_esg_env:72,avg_esg_social:72,avg_esg_governance:48,worker_estimate:1500000,regulatory_risk:'Cocoa price floor mechanism',geopolitical:'Stable democracy'},
  BD:{name:'Bangladesh',iso2:'BD',supply_chains:['COTTON'],total_stages:3,dominant_role:'Processing & Manufacturing',avg_esg_env:70,avg_esg_social:76,avg_esg_governance:38,worker_estimate:8000000,regulatory_risk:'Safety standards, minimum wage',geopolitical:'Garment dependency'},
  VN:{name:'Vietnam',iso2:'VN',supply_chains:['COFFEE','COTTON','RUBBER','NICKEL'],total_stages:6,dominant_role:'Extraction & Processing',avg_esg_env:55,avg_esg_social:48,avg_esg_governance:52,worker_estimate:8000000,regulatory_risk:'CPTPP compliance',geopolitical:'US-China balancing'},
  SA:{name:'Saudi Arabia',iso2:'SA',supply_chains:['WTI_OIL'],total_stages:3,dominant_role:'Extraction',avg_esg_env:55,avg_esg_social:58,avg_esg_governance:35,worker_estimate:100000,regulatory_risk:'OPEC+ decisions',geopolitical:'Oil market swing producer'},
  PE:{name:'Peru',iso2:'PE',supply_chains:['COPPER','GOLD'],total_stages:3,dominant_role:'Extraction',avg_esg_env:70,avg_esg_social:60,avg_esg_governance:48,worker_estimate:150000,regulatory_risk:'Community opposition to mines',geopolitical:'Political instability'},
  ZA:{name:'South Africa',iso2:'ZA',supply_chains:['STEEL','IRON_ORE','GOLD','NICKEL'],total_stages:5,dominant_role:'Extraction',avg_esg_env:60,avg_esg_social:55,avg_esg_governance:55,worker_estimate:200000,regulatory_risk:'Load shedding, logistics',geopolitical:'BRICS member'},
  FI:{name:'Finland',iso2:'FI',supply_chains:['COBALT','NICKEL'],total_stages:3,dominant_role:'Processing',avg_esg_env:30,avg_esg_social:20,avg_esg_governance:92,worker_estimate:8000,regulatory_risk:'EU CRM Act compliance',geopolitical:'EU, NATO member'},
  CH:{name:'Switzerland',iso2:'CH',supply_chains:['GOLD','COFFEE'],total_stages:3,dominant_role:'Processing',avg_esg_env:20,avg_esg_social:15,avg_esg_governance:94,worker_estimate:10000,regulatory_risk:'Gold refining transparency',geopolitical:'Neutral, global trading hub'},
  NL:{name:'Netherlands',iso2:'NL',supply_chains:['PALM_OIL','COCOA'],total_stages:3,dominant_role:'Processing',avg_esg_env:25,avg_esg_social:18,avg_esg_governance:92,worker_estimate:15000,regulatory_risk:'Port of Rotterdam, EUDR hub',geopolitical:'EU integration'},
  MY:{name:'Malaysia',iso2:'MY',supply_chains:['PALM_OIL','RUBBER'],total_stages:4,dominant_role:'Extraction & Processing',avg_esg_env:70,avg_esg_social:58,avg_esg_governance:55,worker_estimate:2000000,regulatory_risk:'EUDR, forced labor scrutiny',geopolitical:'ASEAN, palm oil leverage'},
  TH:{name:'Thailand',iso2:'TH',supply_chains:['RUBBER','PALM_OIL'],total_stages:4,dominant_role:'Extraction & Processing',avg_esg_env:52,avg_esg_social:40,avg_esg_governance:58,worker_estimate:2000000,regulatory_risk:'Rubber price stabilization',geopolitical:'ASEAN'},
  TR:{name:'Turkey',iso2:'TR',supply_chains:['COTTON','STEEL','WHEAT','COCOA'],total_stages:5,dominant_role:'Processing & Manufacturing',avg_esg_env:45,avg_esg_social:38,avg_esg_governance:55,worker_estimate:1500000,regulatory_risk:'EU customs union',geopolitical:'NATO, bridge East-West'},
  CO:{name:'Colombia',iso2:'CO',supply_chains:['COFFEE','PALM_OIL','GOLD'],total_stages:3,dominant_role:'Extraction',avg_esg_env:52,avg_esg_social:50,avg_esg_governance:55,worker_estimate:700000,regulatory_risk:'Peace process, coca competition',geopolitical:'US ally, Andean region'},
  CA:{name:'Canada',iso2:'CA',supply_chains:['NICKEL','WTI_OIL','WHEAT','GOLD'],total_stages:5,dominant_role:'Extraction',avg_esg_env:50,avg_esg_social:32,avg_esg_governance:88,worker_estimate:200000,regulatory_risk:'Oil sands emissions, indigenous rights',geopolitical:'US ally, Five Eyes'},
  ZM:{name:'Zambia',iso2:'ZM',supply_chains:['COPPER'],total_stages:2,dominant_role:'Extraction',avg_esg_env:68,avg_esg_social:58,avg_esg_governance:42,worker_estimate:50000,regulatory_risk:'Mining royalty changes',geopolitical:'China investment dependency'},
  ET:{name:'Ethiopia',iso2:'ET',supply_chains:['COFFEE','COTTON'],total_stages:3,dominant_role:'Extraction',avg_esg_env:45,avg_esg_social:58,avg_esg_governance:35,worker_estimate:6000000,regulatory_risk:'Civil conflict impact',geopolitical:'Horn of Africa instability'},
  PK:{name:'Pakistan',iso2:'PK',supply_chains:['COTTON'],total_stages:2,dominant_role:'Extraction',avg_esg_env:75,avg_esg_social:65,avg_esg_governance:40,worker_estimate:3000000,regulatory_risk:'Water crisis, textile regulation',geopolitical:'Climate vulnerability'},
  NG:{name:'Nigeria',iso2:'NG',supply_chains:['PALM_OIL','COCOA','WTI_OIL'],total_stages:3,dominant_role:'Extraction',avg_esg_env:68,avg_esg_social:62,avg_esg_governance:32,worker_estimate:2000000,regulatory_risk:'Oil theft, subsidy reform',geopolitical:'Africa largest economy'},
  NC:{name:'New Caledonia',iso2:'NC',supply_chains:['NICKEL'],total_stages:2,dominant_role:'Extraction',avg_esg_env:68,avg_esg_social:55,avg_esg_governance:55,worker_estimate:5000,regulatory_risk:'Political status uncertainty',geopolitical:'French territory'},
  HU:{name:'Hungary',iso2:'HU',supply_chains:['LITHIUM'],total_stages:1,dominant_role:'Manufacturing (batteries)',avg_esg_env:35,avg_esg_social:25,avg_esg_governance:75,worker_estimate:6000,regulatory_risk:'EU EV battery hub',geopolitical:'EU member'},
  BE:{name:'Belgium',iso2:'BE',supply_chains:['COBALT'],total_stages:1,dominant_role:'Processing',avg_esg_env:28,avg_esg_social:22,avg_esg_governance:90,worker_estimate:2000,regulatory_risk:'OECD due diligence',geopolitical:'EU headquarters'},
};

const COUNTRY_LIST_SORTED = Object.values(COUNTRY_SC_DATABASE).sort((a,b)=>b.supply_chains.length-a.supply_chains.length);

/* ================================================================= SUPPLY CHAIN REGULATORY COMPLIANCE TRACKER */
const SC_REGULATIONS = [
  {regulation:'EU EUDR',effective:'2024-01',full_enforcement:'2026-01',commodities:['PALM_OIL','COCOA','COFFEE','RUBBER','COTTON'],requirement:'Deforestation-free supply chain due diligence',penalty:'Up to 4% of EU turnover',compliance_cost:'High',affected_companies:['Unilever','Nestle','Mars','P&G','Ferrero','Michelin']},
  {regulation:'EU CBAM',effective:'2023-10',full_enforcement:'2027-01',commodities:['STEEL','IRON_ORE','CEMENT'],requirement:'Carbon border tax on imports',penalty:'Carbon certificate purchase',compliance_cost:'Very High for exporters',affected_companies:['ArcelorMittal','Tata Steel','Baowu','HeidelbergCement']},
  {regulation:'EU CSDDD',effective:'2024-07',full_enforcement:'2027-07',commodities:['ALL'],requirement:'Supply chain due diligence for human rights & environment',penalty:'Up to 5% of net worldwide turnover',compliance_cost:'High',affected_companies:['All large EU companies + non-EU with EU revenue']},
  {regulation:'EU Battery Regulation',effective:'2023-08',full_enforcement:'2025-09',commodities:['LITHIUM','COBALT','NICKEL'],requirement:'Battery passport, carbon footprint, recycled content',penalty:'Product ban from EU market',compliance_cost:'Moderate',affected_companies:['CATL','LG Energy','Samsung SDI','Panasonic']},
  {regulation:'US UFLPA',effective:'2022-06',full_enforcement:'2022-06',commodities:['COTTON'],requirement:'Rebuttable presumption of forced labor for Xinjiang goods',penalty:'Import detention/seizure',compliance_cost:'High for Xinjiang-exposed supply chains',affected_companies:['Nike','H&M','Zara','Gap','Uniqlo']},
  {regulation:'EU Conflict Minerals',effective:'2021-01',full_enforcement:'2021-01',commodities:['COBALT','GOLD','COPPER'],requirement:'Supply chain due diligence for conflict minerals (3TG)',penalty:'Fines and import restrictions',compliance_cost:'Moderate',affected_companies:['Apple','Samsung','Intel','Tesla']},
  {regulation:'OECD Due Diligence',effective:'2018-01',full_enforcement:'Ongoing',commodities:['COBALT','GOLD','LITHIUM','NICKEL','COPPER'],requirement:'5-step framework for responsible mineral supply chains',penalty:'Reputational + market access',compliance_cost:'Moderate',affected_companies:['All major mining/processing companies']},
  {regulation:'IMO 2020/2030',effective:'2020-01',full_enforcement:'2030-01',commodities:['WTI_OIL','STEEL','IRON_ORE'],requirement:'Shipping emissions reduction (EEXI, CII ratings)',penalty:'Speed reduction, port penalties',compliance_cost:'High for shipping',affected_companies:['Maersk','MSC','CMA CGM','Frontline']},
  {regulation:'US Inflation Reduction Act',effective:'2022-08',full_enforcement:'Ongoing',commodities:['LITHIUM','COBALT','NICKEL','COPPER'],requirement:'Critical mineral sourcing from US/FTA countries for EV tax credits',penalty:'Loss of $7,500 EV tax credit',compliance_cost:'Reshoring investment required',affected_companies:['Tesla','GM','Ford','Hyundai','VW']},
  {regulation:'Indonesia Ore Export Ban',effective:'2020-01',full_enforcement:'2020-01',commodities:['NICKEL','COPPER'],requirement:'Ban on raw ore exports to force domestic processing',penalty:'Export prohibition',compliance_cost:'N/A (national policy)',affected_companies:['Vale Indonesia','Freeport','Tsingshan']},
];

/* ================================================================= SUPPLY CHAIN MATURITY ASSESSMENT */
const SC_MATURITY = [
  {commodity:'Steel',traceability:'High',certification:'ResponsibleSteel (8%)',transparency:'Moderate (scope 1-2 reported)',digitization:'Advanced (ERP, MES)',resilience:'High (multiple sources)',maturity_score:72},
  {commodity:'Gold',traceability:'High (LBMA)',certification:'LBMA (85% London)',transparency:'High (bar-level traceability)',digitization:'Moderate (blockchain piloting)',resilience:'High (diverse sources)',maturity_score:78},
  {commodity:'Lithium',traceability:'Low-Medium',certification:'IRMA (12%)',transparency:'Low (limited beyond mine)',digitization:'Emerging (battery passport)',resilience:'Medium (China dependent)',maturity_score:42},
  {commodity:'Cobalt',traceability:'Medium (RMI RMAP)',certification:'RMAP (35%)',transparency:'Medium (artisanal opaque)',digitization:'Emerging (blockchain for ASM)',resilience:'Low (DRC dependent)',maturity_score:38},
  {commodity:'Palm Oil',traceability:'Medium (RSPO)',certification:'RSPO (19%)',transparency:'Medium (mill-level)',digitization:'Advanced (satellite monitoring)',resilience:'Low (ID/MY concentrated)',maturity_score:45},
  {commodity:'Cotton',traceability:'Low',certification:'BCI (22%)',transparency:'Low (smallholder opaque)',digitization:'Low',resilience:'Medium (diverse sources)',maturity_score:32},
  {commodity:'Copper',traceability:'Medium',certification:'Copper Mark (20%)',transparency:'Moderate',digitization:'Advanced (process control)',resilience:'Medium (Chile/DRC)',maturity_score:55},
  {commodity:'Wheat',traceability:'Low',certification:'ISCC (8%)',transparency:'Low (commodity trading opaque)',digitization:'Moderate (precision agriculture)',resilience:'Medium (weather dependent)',maturity_score:35},
  {commodity:'Cocoa',traceability:'Low-Medium',certification:'Rainforest Alliance (30%)',transparency:'Low (smallholder)',digitization:'Low',resilience:'Low (West Africa)',maturity_score:28},
  {commodity:'Coffee',traceability:'Medium',certification:'Fairtrade/UTZ (28%)',transparency:'Medium',digitization:'Medium (farm-level apps)',resilience:'Medium',maturity_score:48},
  {commodity:'Nickel',traceability:'Low-Medium',certification:'IRMA (10%)',transparency:'Low',digitization:'Moderate',resilience:'Medium (Indonesia + Russia)',maturity_score:38},
  {commodity:'Rubber',traceability:'Low',certification:'GPSNR (15%)',transparency:'Low (smallholder)',digitization:'Low',resilience:'Low (Thailand dominant)',maturity_score:25},
  {commodity:'Iron Ore',traceability:'Medium',certification:'Emerging',transparency:'Moderate (large miners report)',digitization:'Advanced (autonomous trucks)',resilience:'Medium (AU/BR)',maturity_score:52},
  {commodity:'Cement',traceability:'Medium',certification:'GCCA (25%)',transparency:'Moderate (emissions reporting)',digitization:'Advanced (process automation)',resilience:'High (local production)',maturity_score:58},
  {commodity:'Crude Oil',traceability:'High (tanker tracking)',certification:'N/A',transparency:'High (market data)',digitization:'Very High',resilience:'Low (OPEC concentration)',maturity_score:65},
  {commodity:'Soybean',traceability:'Low-Medium',certification:'RTRS (5%)',transparency:'Low (commodity trading)',digitization:'Moderate (satellite)',resilience:'Medium (BR/US/AR)',maturity_score:38},
];

/* ================================================================= SUPPLY CHAIN CARBON FOOTPRINT COMPARISON */
const CARBON_FOOTPRINT_COMPARISON = [
  {commodity:'Steel (BF-BOF)',cradle_to_gate_kg:1800,gate_to_grave_kg:200,total_kg:2000,unit:'per tonne',best_practice:900,best_tech:'H2-DRI + renewable EAF'},
  {commodity:'Steel (EAF scrap)',cradle_to_gate_kg:400,gate_to_grave_kg:100,total_kg:500,unit:'per tonne',best_practice:300,best_tech:'100% renewable EAF'},
  {commodity:'Aluminum (primary)',cradle_to_gate_kg:12000,gate_to_grave_kg:500,total_kg:12500,unit:'per tonne',best_practice:4000,best_tech:'Inert anode + hydro power'},
  {commodity:'Cement (OPC)',cradle_to_gate_kg:620,gate_to_grave_kg:30,total_kg:650,unit:'per tonne',best_practice:400,best_tech:'LC3 + CCS'},
  {commodity:'Copper (concentrate)',cradle_to_gate_kg:3500,gate_to_grave_kg:100,total_kg:3600,unit:'per tonne',best_practice:2000,best_tech:'Renewable-powered SX-EW'},
  {commodity:'Lithium (carbonate)',cradle_to_gate_kg:15000,gate_to_grave_kg:500,total_kg:15500,unit:'per tonne',best_practice:5000,best_tech:'DLE + renewable processing'},
  {commodity:'Cobalt (refined)',cradle_to_gate_kg:22000,gate_to_grave_kg:300,total_kg:22300,unit:'per tonne',best_practice:8000,best_tech:'Ethical mine + clean refining'},
  {commodity:'Nickel (Class 1)',cradle_to_gate_kg:28000,gate_to_grave_kg:400,total_kg:28400,unit:'per tonne',best_practice:10000,best_tech:'Sulfide mine + clean smelting'},
  {commodity:'Palm Oil (CPO)',cradle_to_gate_kg:3500,gate_to_grave_kg:300,total_kg:3800,unit:'per tonne',best_practice:800,best_tech:'No-peat, no-deforestation, biogas'},
  {commodity:'Cotton (fiber)',cradle_to_gate_kg:5000,gate_to_grave_kg:2000,total_kg:7000,unit:'per tonne',best_practice:2500,best_tech:'Organic rain-fed + clean dyeing'},
  {commodity:'Gold (refined)',cradle_to_gate_kg:25000000,gate_to_grave_kg:500,total_kg:25000500,unit:'per tonne',best_practice:12000000,best_tech:'Renewable mining + recycling'},
  {commodity:'Wheat (grain)',cradle_to_gate_kg:400,gate_to_grave_kg:100,total_kg:500,unit:'per tonne',best_practice:200,best_tech:'No-till, precision agriculture'},
  {commodity:'Cocoa (beans)',cradle_to_gate_kg:2000,gate_to_grave_kg:200,total_kg:2200,unit:'per tonne',best_practice:800,best_tech:'Agroforestry, shade-grown'},
  {commodity:'Coffee (green)',cradle_to_gate_kg:1200,gate_to_grave_kg:800,total_kg:2000,unit:'per tonne',best_practice:600,best_tech:'Shade-grown, wet processing'},
  {commodity:'Natural Rubber',cradle_to_gate_kg:900,gate_to_grave_kg:500,total_kg:1400,unit:'per tonne',best_practice:400,best_tech:'Sustainable tapping, no deforestation'},
];

const COMMODITY_LIST=Object.entries(SUPPLY_CHAINS).map(([id,c])=>({id,name:c.name,price:c.price,unit:c.unit,stages:c.supply_chain.length,countries:c.supply_chain.reduce((s,st)=>(st.countries?s+st.countries.length:s),0)}));
const TOTAL_SC_COUNT=COMMODITY_LIST.length;

const SECTOR_COMMODITY_MAP={
  Energy:['STEEL','WTI_OIL','IRON_ORE','COPPER','NICKEL'],
  Materials:['STEEL','LITHIUM','COBALT','COPPER','IRON_ORE','CEMENT','NICKEL','GOLD'],
  'Consumer Staples':['PALM_OIL','COTTON','WHEAT','COCOA','COFFEE','RUBBER','SOYBEAN'],
  'Consumer Discretionary':['LITHIUM','COBALT','COTTON','RUBBER','COPPER','NICKEL','GOLD'],
  'Information Technology':['LITHIUM','COBALT','COPPER','GOLD','NICKEL'],
  Industrials:['STEEL','COPPER','CEMENT','IRON_ORE','NICKEL','RUBBER'],
  'Health Care':['RUBBER','GOLD'],
  Utilities:['COPPER','STEEL','CEMENT','NICKEL'],
  'Real Estate':['STEEL','CEMENT','COPPER','IRON_ORE'],
  'Communication Services':['COPPER','GOLD'],
  Financials:['GOLD'],
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
  const cs={green:{bg:'#dcfce7',fg:'#166534'},red:{bg:'#fee2e2',fg:'#991b1b'},amber:{bg:'#fef3c7',fg:'#92400e'},blue:{bg:'#dbeafe',fg:'#1e40af'},purple:{bg:'#ede9fe',fg:'#5b21b6'},gray:{bg:'#f3f4f6',fg:'#374151'},teal:{bg:'#ccfbf1',fg:'#115e59'}};
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
const SortTH=({label,field,sort,onSort,style})=>(
  <th onClick={()=>onSort(field)} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,cursor:'pointer',borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',...style}}>
    {label}{sort.field===field?(sort.asc?' \u25B2':' \u25BC'):''}
  </th>
);
const TD=({children,style})=><td style={{padding:'10px 12px',fontSize:13,color:T.text,borderBottom:`1px solid ${T.border}`,...style}}>{children}</td>;
const Btn=({children,onClick,primary,small,style})=>(
  <button onClick={onClick} style={{padding:small?'5px 12px':'8px 18px',borderRadius:8,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,fontSize:small?12:13,fontWeight:600,cursor:'pointer',fontFamily:T.font,...style}}>{children}</button>
);
const RiskBar=({value,max=100})=>{
  const clr=value>=75?T.red:value>=50?T.amber:T.green;
  return <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:60,height:8,background:T.border,borderRadius:4,overflow:'hidden'}}><div style={{width:`${(value/max)*100}%`,height:'100%',background:clr,borderRadius:4}}/></div><span style={{fontSize:11,fontWeight:600,color:clr}}>{value}</span></div>;
};

/* ================================================================= MAIN */
export default function CommodityInventoryPage(){
  const navigate=useNavigate();
  const [selectedComm,setSelectedComm]=useState('LITHIUM');
  const [selectedStage,setSelectedStage]=useState(0);
  const [compareComm,setCompareComm]=useState('COBALT');
  const [sort,setSort]=useState({field:'share_pct',asc:false});
  const [customData,setCustomData]=useState(loadLS(LS_SC)||{});

  const portfolio=useMemo(()=>{
    const raw=loadLS(LS_PORT);
    const base=raw&&Array.isArray(raw)?raw:(GLOBAL_COMPANY_MASTER||[]).slice(0,30);
    return base.map((c,i)=>({...c,company_name:c.company_name||c.company||`Company ${i+1}`,sector:c.sector||'Diversified',weight:c.weight||+(seed(i*7)*4+0.5).toFixed(2)}));
  },[]);

  const chain=SUPPLY_CHAINS[selectedComm];
  const stages=chain?.supply_chain||[];
  const currentStage=stages[selectedStage]||stages[0];
  const stageNames=stages.map(s=>s.stage);
  const mlRisk=useMemo(()=>mlPredictRisk(chain),[chain]);

  const doSort=f=>setSort(p=>({field:f,asc:p.field===f?!p.asc:false}));

  /* KPIs */
  const totalCountries=useMemo(()=>{const s=new Set();stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>s.add(c.iso2||c.name))});return s.size},[stages]);
  const totalCompanies=useMemo(()=>{let n=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.companies)n+=c.companies.length})});return n},[stages]);
  const totalWorkers=useMemo(()=>{let n=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.workers_est)n+=c.workers_est});if(st.workers_est)n+=st.workers_est});return n},[stages]);
  const avgESG=(dim)=>{let sum=0,count=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.esg_risk&&c.esg_risk[dim]!=null){sum+=c.esg_risk[dim];count++}})});return count?Math.round(sum/count):0};
  const recyclingRate=stages.find(s=>s.stage==='End of Life')?.recycling_rate_pct||0;
  const avgCarbon=useMemo(()=>{let sum=0,count=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.carbon_intensity_kg_per_t){sum+=c.carbon_intensity_kg_per_t;count++}})});return count?Math.round(sum/count):0},[stages]);
  const childLaborStages=useMemo(()=>{let n=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.child_labor_risk||c.forced_labor_risk)n++})});return n},[stages]);

  const concentrationData=useMemo(()=>stages.filter(s=>s.countries).map(st=>{const sorted=[...(st.countries||[])].sort((a,b)=>(b.share_pct||0)-(a.share_pct||0));const top=sorted[0];return{stage:st.stage,topCountry:top?.name||'N/A',topShare:top?.share_pct||0,hhi:sorted.reduce((s,c)=>s+Math.pow(c.share_pct||0,2),0)}}),[stages]);
  const esgHeatmap=useMemo(()=>stages.filter(s=>s.countries).map(st=>{const envAvg=st.countries.reduce((s,c)=>s+(c.esg_risk?.env||0),0)/Math.max(1,st.countries.length);const socAvg=st.countries.reduce((s,c)=>s+(c.esg_risk?.social||0),0)/Math.max(1,st.countries.length);const govAvg=st.countries.reduce((s,c)=>s+(c.esg_risk?.governance||0),0)/Math.max(1,st.countries.length);return{stage:st.stage,Environmental:Math.round(envAvg),Social:Math.round(socAvg),Governance:Math.round(govAvg)}}),[stages]);
  const carbonWaterfall=useMemo(()=>{let cum=0;return stages.filter(s=>s.countries).map(st=>{const avg=st.countries.reduce((s,c)=>s+(c.carbon_intensity_kg_per_t||0),0)/Math.max(1,st.countries.length);cum+=avg;return{stage:st.stage,stageCarbon:Math.round(avg),cumulative:Math.round(cum)}})},[stages]);
  const waterData=useMemo(()=>stages.filter(s=>s.countries).map(st=>{const intensities={'Very High':90,'Very High (arid region)':95,'Very High (arid)':95,'High':70,'High (irrigated)':65,'Very High (10,000L/kg)':95,'Very High (Indus)':92,'Very High (groundwater depletion)':95,'Moderate':40,'Low':20};const avg=st.countries.reduce((s,c)=>{const wi=c.water_intensity;return s+(intensities[wi]||30)},0)/Math.max(1,st.countries.length);return{stage:st.stage,intensity:Math.round(avg)}}),[stages]);
  const portfolioRisk=useMemo(()=>portfolio.slice(0,15).map((c,i)=>{const sectorComms=SECTOR_COMMODITY_MAP[c.sector]||[];const exposed=sectorComms.includes(selectedComm);return{company:c.company_name,sector:c.sector,weight:c.weight,exposed,riskScore:exposed?Math.round(40+seed(i*53)*55):Math.round(seed(i*59)*30),exposureType:exposed?'Direct':'Indirect'}}).sort((a,b)=>b.riskScore-a.riskScore),[portfolio,selectedComm]);
  const sortedCountries=useMemo(()=>{if(!currentStage?.countries)return[];return[...currentStage.countries].sort((a,b)=>{const av=a[sort.field],bv=b[sort.field];if(av==null)return 1;if(bv==null)return -1;return sort.asc?(av>bv?1:-1):(av<bv?1:-1)})},[currentStage,sort]);
  const compareChain=SUPPLY_CHAINS[compareComm];

  const exportCSV=()=>{const rows=['Commodity,Stage,Country,Share%,Companies,ESG_Env,ESG_Social,ESG_Gov,Carbon_kg_per_t,Workers'];Object.entries(SUPPLY_CHAINS).forEach(([id,ch])=>{ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{rows.push(`${ch.name},${st.stage},"${c.name}",${c.share_pct||''},"${(c.companies||[]).join('; ')}",${c.esg_risk?.env||''},${c.esg_risk?.social||''},${c.esg_risk?.governance||''},${c.carbon_intensity_kg_per_t||''},${c.workers_est||''}`)})})});const blob=new Blob([rows.join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='supply_chain_map_15.csv';a.click()};
  const exportJSON=()=>{const blob=new Blob([JSON.stringify({chains:SUPPLY_CHAINS,timestamp:new Date().toISOString()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='esg_assessment_15.json';a.click()};

  /* ================================================================= RENDER */
  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font}}>
      <div style={{maxWidth:1440,margin:'0 auto',padding:'24px 32px'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,color:T.navy,margin:0}}>Global Commodity Inventory & Supply Chain</h1>
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <Badge label={`${TOTAL_SC_COUNT} Supply Chains`} color="blue"/>
              <Badge label="6 Stages" color="purple"/>
              <Badge label="30+ Countries" color="green"/>
              <Badge label="ML Risk Prediction" color="teal"/>
              <Badge label="EP-Y2" color="gray"/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={exportCSV} small>CSV Export</Btn>
            <Btn onClick={exportJSON} small>JSON Report</Btn>
            <Btn onClick={()=>window.print()} small>Print</Btn>
          </div>
        </div>

        <Section title="Commodity Selector">
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {COMMODITY_LIST.map(c=>(
              <button key={c.id} onClick={()=>{setSelectedComm(c.id);setSelectedStage(0)}} style={{padding:'10px 16px',borderRadius:10,border:`2px solid ${selectedComm===c.id?T.navy:T.border}`,background:selectedComm===c.id?T.navy:T.surface,color:selectedComm===c.id?'#fff':T.text,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:T.font}}>
                {c.name} <span style={{fontSize:10,opacity:0.7}}>({c.stages}st, {c.countries}c)</span>
              </button>
            ))}
          </div>
        </Section>

        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:28}}>
          <KPI label="Supply Chain Stages" value={stages.length} sub={stageNames.join(' \u2192 ')}/>
          <KPI label="Countries Involved" value={totalCountries} sub="Across all stages"/>
          <KPI label="Companies Mapped" value={totalCompanies} sub="Extraction to recycling"/>
          <KPI label="Workers Estimated" value={totalWorkers>1000000?`${(totalWorkers/1000000).toFixed(1)}M`:totalWorkers>1000?`${(totalWorkers/1000).toFixed(0)}K`:totalWorkers} sub="Across supply chain"/>
          <KPI label="ML Risk Score" value={mlRisk.overallRisk} sub={mlRisk.category} color={mlRisk.overallRisk>=60?T.red:mlRisk.overallRisk>=35?T.amber:T.green}/>
          <KPI label="Recycling Rate" value={`${recyclingRate}%`} sub={recyclingRate>=50?'Strong circular':'Needs improvement'} color={recyclingRate>=50?T.green:T.red}/>
          <KPI label="Avg Env Risk" value={avgESG('env')} sub="Environmental" color={avgESG('env')>=60?T.red:T.amber}/>
          <KPI label="Avg Social Risk" value={avgESG('social')} sub="Social" color={avgESG('social')>=60?T.red:T.amber}/>
          <KPI label="Avg Governance" value={avgESG('governance')} sub="Governance" color={avgESG('governance')<50?T.red:T.sage}/>
          <KPI label="Carbon Intensity" value={`${(avgCarbon/1000).toFixed(1)}t`} sub="Avg kgCO2/t"/>
          <KPI label="Child/Forced Labor" value={childLaborStages} sub="Flagged pairs" color={childLaborStages>0?T.red:T.green}/>
          <KPI label="ML Confidence" value={`${mlRisk.confidence}%`} sub="Model confidence"/>
        </div>

        {/* ML RISK PREDICTION */}
        <Section title="ML Supply Chain Risk Prediction" badge={`${chain?.name} - ${mlRisk.category}`}>
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:20}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Overall Risk: <span style={{color:mlRisk.overallRisk>=60?T.red:mlRisk.overallRisk>=35?T.amber:T.green}}>{mlRisk.overallRisk}/100</span></div>
                <div style={{width:'100%',height:12,background:T.border,borderRadius:6,overflow:'hidden',marginBottom:12}}>
                  <div style={{width:`${mlRisk.overallRisk}%`,height:'100%',background:mlRisk.overallRisk>=60?T.red:mlRisk.overallRisk>=35?T.amber:T.green,borderRadius:6}}/>
                </div>
                <div style={{display:'grid',gap:6}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Category</span><Badge label={mlRisk.category} color={mlRisk.category==='Critical'?'red':mlRisk.category==='High'?'amber':'green'}/></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Confidence</span><span style={{fontWeight:600}}>{mlRisk.confidence}%</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Avg Environmental</span><RiskBar value={mlRisk.avgEnv}/></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Avg Social</span><RiskBar value={mlRisk.avgSoc}/></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0'}}><span style={{color:T.textMut}}>Avg Governance</span><RiskBar value={mlRisk.avgGov}/></div>
                </div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Risk Factor Decomposition</div>
                {mlRisk.factors.map((f,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:12,fontWeight:600}}>{f.name}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:11,color:T.textSec}}>Value: {f.value}</span>
                      <span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,background:f.weight>=15?'#fee2e2':f.weight>=8?'#fef3c7':'#dcfce7',color:f.weight>=15?T.red:f.weight>=8?T.amber:T.green}}>+{f.weight} pts</span>
                    </div>
                  </div>
                ))}
                <div style={{fontSize:10,color:T.textMut,marginTop:8}}>Model: Weighted multi-factor scoring across concentration, ESG, human rights, recycling, and climate dimensions.</div>
              </div>
            </div>
          </Card>
        </Section>

        {/* SUPPLY CHAIN FLOW */}
        <Section title="Supply Chain Flow" badge={chain?.name}>
          <Card>
            <div style={{display:'flex',gap:4,alignItems:'stretch',overflowX:'auto'}}>
              {stages.map((st,i)=>{
                const isActive=i===selectedStage;
                const countryCt=st.countries?.length||0;
                const workerCt=st.countries?.reduce((s,c)=>s+(c.workers_est||0),0)||(st.workers_est||0);
                return(
                  <React.Fragment key={i}>
                    <div onClick={()=>setSelectedStage(i)} style={{flex:1,minWidth:160,padding:14,borderRadius:10,border:`2px solid ${isActive?STAGE_COLORS[i]:T.border}`,background:isActive?STAGE_COLORS[i]+'12':T.surface,cursor:'pointer'}}>
                      <div style={{fontSize:11,fontWeight:700,color:STAGE_COLORS[i],textTransform:'uppercase'}}>{st.stage}</div>
                      {st.description&&<div style={{fontSize:9,color:T.textMut,marginTop:2}}>{st.description}</div>}
                      {st.countries&&<div style={{marginTop:6}}>
                        <div style={{fontSize:10,color:T.textSec}}>{countryCt} countries</div>
                        {workerCt>0&&<div style={{fontSize:10,color:T.textMut}}>{workerCt>1000000?`${(workerCt/1000000).toFixed(1)}M`:workerCt>1000?`${(workerCt/1000).toFixed(0)}K`:workerCt} workers</div>}
                        <div style={{marginTop:4,display:'flex',flexWrap:'wrap',gap:3}}>
                          {st.countries.slice(0,3).map(c=><span key={c.iso2||c.name} style={{fontSize:9,padding:'1px 4px',borderRadius:4,background:T.surfaceH,color:T.text}}>{c.iso2||c.name.slice(0,2)} {c.share_pct?`${c.share_pct}%`:''}</span>)}
                        </div>
                      </div>}
                      {st.applications&&<div style={{marginTop:6,fontSize:10,color:T.textSec}}>{st.applications.length} end uses</div>}
                      {st.recycling_rate_pct!=null&&<div style={{marginTop:6,fontSize:10}}><span style={{fontWeight:700,color:st.recycling_rate_pct>=50?T.green:T.red}}>{st.recycling_rate_pct}%</span> recycling</div>}
                    </div>
                    {i<stages.length-1&&<div style={{display:'flex',alignItems:'center',color:T.textMut,fontSize:16}}>\u2192</div>}
                  </React.Fragment>
                );
              })}
            </div>
          </Card>
        </Section>

        {/* COUNTRY TABLE */}
        {currentStage?.countries&&(
          <Section title={`${currentStage.stage} \u2014 Country Breakdown`} badge={`${currentStage.countries.length} countries`}>
            <Card>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:T.surfaceH}}>
                    <SortTH label="Country" field="name" sort={sort} onSort={doSort}/>
                    <SortTH label="Share %" field="share_pct" sort={sort} onSort={doSort} style={{textAlign:'right'}}/>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Type</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Companies</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Env</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Social</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Gov</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Workers</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Flags</th>
                  </tr></thead>
                  <tbody>
                    {sortedCountries.map((c,i)=>(
                      <tr key={i}>
                        <TD style={{fontWeight:600}}>{c.iso2&&<span style={{marginRight:4,fontSize:10,padding:'1px 4px',background:T.surfaceH,borderRadius:3}}>{c.iso2}</span>}{c.name}</TD>
                        <TD style={{textAlign:'right',fontWeight:700}}>{c.share_pct!=null?`${c.share_pct}%`:'\u2014'}</TD>
                        <TD style={{fontSize:11}}>{c.type||c.source_type||'\u2014'}</TD>
                        <TD style={{fontSize:10}}>{c.companies?c.companies.slice(0,2).join(', ')+(c.companies.length>2?` +${c.companies.length-2}`:''):'\u2014'}</TD>
                        <TD>{c.esg_risk?<RiskBar value={c.esg_risk.env}/>:'\u2014'}</TD>
                        <TD>{c.esg_risk?<RiskBar value={c.esg_risk.social}/>:'\u2014'}</TD>
                        <TD>{c.esg_risk?<RiskBar value={c.esg_risk.governance}/>:'\u2014'}</TD>
                        <TD style={{fontSize:11}}>{c.workers_est?c.workers_est>1000000?`${(c.workers_est/1000000).toFixed(1)}M`:c.workers_est>1000?`${(c.workers_est/1000).toFixed(0)}K`:c.workers_est:'\u2014'}</TD>
                        <TD style={{fontSize:10}}>
                          {c.child_labor_risk&&<Badge label="Child Labor" color="red"/>}
                          {c.forced_labor_risk&&<Badge label="Forced Labor" color="red"/>}
                          {c.indigenous_impact&&<Badge label="Indigenous" color="amber"/>}
                          {c.conflict_mineral&&<Badge label="Conflict" color="red"/>}
                          {c.sanctions_risk&&<Badge label="Sanctions" color="purple"/>}
                          {c.deforestation_ha_yr&&<Badge label="Deforestation" color="red"/>}
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>
        )}

        {/* ESG HEATMAP */}
        <Section title="ESG Risk Heatmap by Stage" badge="Color-Coded">
          <Card>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={esgHeatmap}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="stage" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}} domain={[0,100]}/>
                <Tooltip/><Legend/>
                <Bar dataKey="Environmental" fill="#dc2626" radius={[4,4,0,0]}/>
                <Bar dataKey="Social" fill="#d97706" radius={[4,4,0,0]}/>
                <Bar dataKey="Governance" fill="#0284c7" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* CARBON WATERFALL */}
        <Section title="Carbon Intensity Waterfall" badge="Cumulative">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={carbonWaterfall}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="stage" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}}/>
                <Tooltip/><Legend/>
                <Bar dataKey="stageCarbon" name="Stage Carbon" fill={T.amber} radius={[4,4,0,0]}/>
                <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke={T.red} strokeWidth={2} dot={{r:4}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* CONCENTRATION RISK */}
        <Section title="Supply Concentration by Stage" badge="HHI">
          <Card>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={concentrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="stage" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}} domain={[0,100]}/>
                <Tooltip formatter={v=>[`${v}%`,'Top Share']}/>
                <Bar dataKey="topShare" name="Top Country %" radius={[4,4,0,0]}>
                  {concentrationData.map((_,i)=><Cell key={i} fill={STAGE_COLORS[i%STAGE_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* PORTFOLIO EXPOSURE */}
        <Section title="Portfolio Exposure" badge={chain?.name}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Company','Sector','Weight %','Exposure','Risk Score'].map(h=><th key={h} style={{padding:'10px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Company'||h==='Sector'?'left':'center'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {portfolioRisk.slice(0,10).map((c,i)=>(
                  <tr key={i}>
                    <TD style={{fontWeight:600}}>{c.company}</TD>
                    <TD>{c.sector}</TD>
                    <TD style={{textAlign:'center'}}>{fmt(c.weight,2)}%</TD>
                    <TD style={{textAlign:'center'}}><Badge label={c.exposureType} color={c.exposed?'red':'gray'}/></TD>
                    <TD style={{textAlign:'center'}}><span style={{padding:'3px 10px',borderRadius:8,fontSize:12,fontWeight:700,background:c.riskScore>=60?'#fee2e2':c.riskScore>=35?'#fef3c7':'#dcfce7',color:c.riskScore>=60?T.red:c.riskScore>=35?T.amber:T.green}}>{c.riskScore}</span></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* CROSS-COMMODITY ML RISK COMPARISON */}
        <Section title="Cross-Commodity ML Risk Comparison" badge={`${TOTAL_SC_COUNT} Supply Chains`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Production','Countries','Workers','ML Risk','Category','Env','Social','Gov','Recycling'].map(h=><th key={h} style={{padding:8,fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'?'left':'center'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {Object.entries(SUPPLY_CHAINS).map(([id,ch])=>{
                  const ml=mlPredictRisk(ch);
                  const ctrySet=new Set();let workerSum=0;
                  ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{ctrySet.add(c.iso2||c.name);if(c.workers_est)workerSum+=c.workers_est});if(st.workers_est)workerSum+=st.workers_est});
                  const eol=ch.supply_chain.find(s=>s.stage==='End of Life');
                  return(
                    <tr key={id} style={{cursor:'pointer',background:selectedComm===id?T.surfaceH:'transparent'}} onClick={()=>{setSelectedComm(id);setSelectedStage(0);window.scrollTo({top:0,behavior:'smooth'})}}>
                      <TD style={{fontWeight:700}}>{ch.name}</TD>
                      <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11}}>{ch.total_production_kt>10000?(ch.total_production_kt/1000).toFixed(0)+'K':ch.total_production_kt.toLocaleString()} kt</TD>
                      <TD style={{textAlign:'center'}}>{ctrySet.size}</TD>
                      <TD style={{textAlign:'center',fontSize:11}}>{workerSum>1000000?`${(workerSum/1000000).toFixed(1)}M`:workerSum>1000?`${(workerSum/1000).toFixed(0)}K`:workerSum}</TD>
                      <TD style={{textAlign:'center'}}><span style={{padding:'3px 10px',borderRadius:8,fontSize:12,fontWeight:700,background:ml.overallRisk>=60?'#fee2e2':ml.overallRisk>=35?'#fef3c7':'#dcfce7',color:ml.overallRisk>=60?T.red:ml.overallRisk>=35?T.amber:T.green}}>{ml.overallRisk}</span></TD>
                      <TD style={{textAlign:'center'}}><Badge label={ml.category} color={ml.category==='Critical'?'red':ml.category==='High'?'amber':'green'}/></TD>
                      <TD style={{textAlign:'center'}}><RiskBar value={ml.avgEnv}/></TD>
                      <TD style={{textAlign:'center'}}><RiskBar value={ml.avgSoc}/></TD>
                      <TD style={{textAlign:'center'}}><RiskBar value={ml.avgGov}/></TD>
                      <TD style={{textAlign:'center',fontWeight:700,color:eol?.recycling_rate_pct>=50?T.green:eol?.recycling_rate_pct>=15?T.amber:T.red}}>{eol?.recycling_rate_pct||0}%</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* 3-DIMENSIONAL STAGE ASSESSMENT */}
        {currentStage?.countries&&(
          <Section title={`3-Dimensional Assessment: ${currentStage.stage}`} badge="Finance | ESG | Climate">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
              <Card style={{borderTop:`3px solid ${DIM_COLORS.finance}`}}>
                <div style={{fontSize:14,fontWeight:700,color:DIM_COLORS.finance,marginBottom:12}}>Financial Dimension</div>
                {currentStage.countries.slice(0,5).map((c,i)=>(
                  <div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:12,fontWeight:600}}>{c.name}</div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginTop:3}}>
                      <span>Price: {c.price_at_stage?`$${c.price_at_stage}`:'\u2014'}</span>
                      <span>Value-add: {c.value_add_pct?`${c.value_add_pct}%`:'\u2014'}</span>
                    </div>
                    <div style={{fontSize:10,color:T.textMut}}>Share: {c.share_pct||0}% | Workers: {c.workers_est?c.workers_est>1000000?`${(c.workers_est/1000000).toFixed(1)}M`:`${(c.workers_est/1000).toFixed(0)}K`:'\u2014'}</div>
                  </div>
                ))}
              </Card>
              <Card style={{borderTop:`3px solid ${DIM_COLORS.esg}`}}>
                <div style={{fontSize:14,fontWeight:700,color:DIM_COLORS.esg,marginBottom:12}}>ESG Dimension</div>
                {currentStage.countries.slice(0,5).map((c,i)=>(
                  <div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:12,fontWeight:600}}>{c.name}</div>
                    {c.esg_risk?(
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:4,marginTop:4}}>
                        <div><span style={{fontSize:9,color:T.textMut}}>Env</span><RiskBar value={c.esg_risk.env}/></div>
                        <div><span style={{fontSize:9,color:T.textMut}}>Soc</span><RiskBar value={c.esg_risk.social}/></div>
                        <div><span style={{fontSize:9,color:T.textMut}}>Gov</span><RiskBar value={c.esg_risk.governance}/></div>
                      </div>
                    ):<div style={{fontSize:11,color:T.textMut,marginTop:4}}>No ESG data</div>}
                    {(c.child_labor_risk||c.forced_labor_risk||c.indigenous_impact)&&(
                      <div style={{marginTop:3,display:'flex',gap:3,flexWrap:'wrap'}}>
                        {c.child_labor_risk&&<Badge label="Child Labor" color="red"/>}
                        {c.forced_labor_risk&&<Badge label="Forced Labor" color="red"/>}
                        {c.indigenous_impact&&<Badge label="Indigenous" color="amber"/>}
                      </div>
                    )}
                  </div>
                ))}
              </Card>
              <Card style={{borderTop:`3px solid ${DIM_COLORS.climate}`}}>
                <div style={{fontSize:14,fontWeight:700,color:DIM_COLORS.climate,marginBottom:12}}>Climate / Nature</div>
                {currentStage.countries.slice(0,5).map((c,i)=>(
                  <div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:12,fontWeight:600}}>{c.name}</div>
                    <div style={{fontSize:11,marginTop:3}}>
                      {c.carbon_intensity_kg_per_t&&<div style={{color:T.textSec}}>Carbon: <span style={{fontWeight:600,color:c.carbon_intensity_kg_per_t>10000?T.red:T.amber}}>{(c.carbon_intensity_kg_per_t/1000).toFixed(1)}t CO2/t</span></div>}
                      {c.water_intensity&&<div style={{color:T.textSec}}>Water: <span style={{fontWeight:600}}>{c.water_intensity}</span></div>}
                      {c.deforestation_ha_yr&&<div style={{color:T.red}}>Deforestation: {(c.deforestation_ha_yr/1000).toFixed(0)}K ha/yr</div>}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </Section>
        )}

        {/* WATER FOOTPRINT */}
        <Section title="Water Footprint by Stage" badge="Index">
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={waterData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="stage" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}} domain={[0,100]}/>
                <Tooltip formatter={v=>[`${v}/100`,'Water Intensity']}/>
                <Bar dataKey="intensity" name="Water Intensity" radius={[4,4,0,0]}>
                  {waterData.map((d,i)=><Cell key={i} fill={d.intensity>=70?'#06b6d4':d.intensity>=40?'#0284c7':'#bae6fd'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* VALUE CHAIN COST BUILDUP */}
        <Section title="Value Chain Cost Buildup" badge="Price at Stage">
          <Card>
            {(()=>{
              const priceStages=stages.filter(s=>s.countries).map(st=>{
                const avgPrice=st.countries.reduce((s,c)=>s+(c.price_at_stage||0),0)/Math.max(1,st.countries.filter(c=>c.price_at_stage).length);
                return{stage:st.stage,avgPrice:Math.round(avgPrice)};
              }).filter(s=>s.avgPrice>0);
              return priceStages.length>0?(
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={priceStages}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="stage" tick={{fontSize:11}}/>
                      <YAxis tick={{fontSize:10}}/>
                      <Tooltip formatter={v=>[`$${v}`,'Avg Price']}/>
                      <Bar dataKey="avgPrice" name="Avg Price" radius={[4,4,0,0]}>
                        {priceStages.map((_,i)=><Cell key={i} fill={STAGE_COLORS[i%STAGE_COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{display:'grid',gridTemplateColumns:`repeat(${priceStages.length},1fr)`,gap:8,marginTop:12}}>
                    {priceStages.map((p,i)=>{
                      const margin=i>0?Math.round((p.avgPrice-priceStages[i-1].avgPrice)/Math.max(1,priceStages[i-1].avgPrice)*100):0;
                      return(
                        <div key={i} style={{textAlign:'center',padding:10,background:T.surfaceH,borderRadius:8}}>
                          <div style={{fontSize:10,color:T.textMut}}>{p.stage}</div>
                          <div style={{fontSize:16,fontWeight:700,color:T.navy}}>${p.avgPrice.toLocaleString()}</div>
                          {i>0&&<div style={{fontSize:11,color:T.green}}>+{margin}% value-add</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ):<div style={{padding:20,textAlign:'center',color:T.textMut}}>No price data</div>;
            })()}
          </Card>
        </Section>

        {/* DEFORESTATION LINKAGE */}
        <Section title="Deforestation & Biodiversity Linkage" badge="EUDR Focus">
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Stage','Country','Deforestation (ha/yr)','Biodiversity','EUDR'].map(h=><th key={h} style={{padding:8,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {Object.entries(SUPPLY_CHAINS).flatMap(([id,ch])=>
                  ch.supply_chain.flatMap(st=>(st.countries||[]).filter(c=>c.deforestation_ha_yr||c.biodiversity_impact||c.peatland_fire_risk||c.deforestation_link).map(c=>({
                    commodity:ch.name,stage:st.stage,country:c.name,
                    deforestation:c.deforestation_ha_yr,biodiversity:c.biodiversity_impact,
                    peatland:c.peatland_fire_risk,link:c.deforestation_link
                  })))
                ).map((r,i)=>(
                  <tr key={i}>
                    <TD style={{fontWeight:600}}>{r.commodity}</TD>
                    <TD>{r.stage}</TD>
                    <TD>{r.country}</TD>
                    <TD style={{fontWeight:600,color:r.deforestation?T.red:T.textMut}}>{r.deforestation?`${(r.deforestation/1000).toFixed(0)}K ha`:r.link||'\u2014'}</TD>
                    <TD style={{fontSize:11,color:T.amber}}>{r.biodiversity||'\u2014'}</TD>
                    <TD><Badge label={['Palm Oil','Cocoa','Coffee','Cotton','Rubber'].some(x=>r.commodity.includes(x))?'EUDR':'Not Regulated'} color={['Palm Oil','Cocoa','Coffee','Rubber'].some(x=>r.commodity.includes(x))?'amber':'gray'}/></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* CERTIFICATION STANDARDS */}
        <Section title="Certification & Responsible Sourcing" badge="By Commodity">
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Standard','Coverage','Adoption','Verification'].map(h=><th key={h} style={{padding:8,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  {commodity:'Lithium',standard:'IRMA',adoption:'12%',verification:'Third-party'},
                  {commodity:'Cobalt',standard:'RMI RMAP',adoption:'35%',verification:'Independent audit'},
                  {commodity:'Palm Oil',standard:'RSPO',adoption:'19%',verification:'Certification'},
                  {commodity:'Palm Oil',standard:'NDPE Policy',adoption:'83% of refiners',verification:'Satellite'},
                  {commodity:'Cotton',standard:'BCI',adoption:'22%',verification:'Third-party'},
                  {commodity:'Steel',standard:'ResponsibleSteel',adoption:'8%',verification:'Site cert'},
                  {commodity:'Gold',standard:'LBMA Responsible Gold',adoption:'85% of London bars',verification:'Annual audit'},
                  {commodity:'Copper',standard:'Copper Mark',adoption:'20% of producers',verification:'Third-party'},
                  {commodity:'Cocoa',standard:'Rainforest Alliance',adoption:'30%',verification:'Certification'},
                  {commodity:'Coffee',standard:'Fairtrade / UTZ',adoption:'28%',verification:'Annual audit'},
                  {commodity:'Rubber',standard:'GPSNR',adoption:'15%',verification:'Self-assess'},
                  {commodity:'Nickel',standard:'IRMA / LME Passport',adoption:'10%',verification:'Third-party'},
                  {commodity:'Iron Ore',standard:'ResponsibleSteel (upstream)',adoption:'5%',verification:'Site cert'},
                  {commodity:'Wheat',standard:'ISCC / SAI Platform',adoption:'8%',verification:'Certification'},
                  {commodity:'Cement',standard:'CSI/GCCA',adoption:'25% of global production',verification:'Self-report'},
                ].map((r,i)=>(
                  <tr key={i}>
                    <TD style={{fontWeight:600}}>{r.commodity}</TD>
                    <TD style={{fontSize:12}}>{r.standard}</TD>
                    <TD style={{fontSize:11}}>Global</TD>
                    <TD style={{fontWeight:700,color:parseFloat(r.adoption)>=30?T.green:parseFloat(r.adoption)>=15?T.amber:T.red}}>{r.adoption}</TD>
                    <TD><Badge label={r.verification} color={r.verification.includes('Third')||r.verification.includes('Independent')?'green':'amber'}/></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* ALTERNATIVE SOURCING */}
        <Section title="Alternative Sourcing & Substitution" badge="Resilience">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
              {[
                {commodity:'Lithium',substitutes:['Sodium-ion batteries','Solid-state'],timeline:'2026-30',readiness:45,impact:'-15% Li demand'},
                {commodity:'Cobalt',substitutes:['LFP batteries','High-nickel NMC'],timeline:'2024-27',readiness:72,impact:'LFP 60% of Chinese EV'},
                {commodity:'Palm Oil',substitutes:['Algae oils','Microbial oils'],timeline:'2028-35',readiness:18,impact:'<0.1% market today'},
                {commodity:'Steel',substitutes:['H2 DRI','EAF (scrap)','CCS'],timeline:'2025-35',readiness:35,impact:'HYBRIT delivering 2026'},
                {commodity:'Cotton',substitutes:['Recycled cotton','Lyocell','Hemp'],timeline:'2024-30',readiness:55,impact:'EU 25% recycled 2030'},
                {commodity:'Copper',substitutes:['Aluminum (partial)','Fiber optic'],timeline:'2025-35',readiness:40,impact:'-5% in grid cables'},
                {commodity:'Nickel',substitutes:['LFP (no nickel)','Manganese-rich'],timeline:'2024-28',readiness:65,impact:'LFP displacing NMC'},
                {commodity:'Cocoa',substitutes:['Lab-grown cocoa','Carob'],timeline:'2030+',readiness:12,impact:'R&D stage'},
                {commodity:'Gold',substitutes:['Digital gold/crypto (investment)'],timeline:'Now',readiness:50,impact:'5% of investment shift'},
                {commodity:'Cement',substitutes:['Geopolymer','LC3','Carbon cure'],timeline:'2025-35',readiness:30,impact:'-20% clinker ratio'},
              ].map((c,i)=>(
                <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:10,borderTop:`3px solid ${STAGE_COLORS[i%STAGE_COLORS.length]}`}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:6}}>{c.commodity}</div>
                  <div style={{fontSize:10,color:T.textMut,marginBottom:4}}>Substitutes:</div>
                  {c.substitutes.map((s,j)=><div key={j} style={{fontSize:10,padding:'2px 0',color:T.textSec,borderBottom:`1px solid ${T.border}`}}>{s}</div>)}
                  <div style={{marginTop:6}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:9,marginBottom:3}}><span style={{color:T.textMut}}>Readiness</span><span style={{fontWeight:700}}>{c.readiness}%</span></div>
                    <div style={{width:'100%',height:5,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{width:`${c.readiness}%`,height:'100%',background:c.readiness>=60?T.green:c.readiness>=30?T.amber:T.red,borderRadius:3}}/></div>
                  </div>
                  <div style={{fontSize:9,color:T.textMut,marginTop:4}}>{c.timeline} | {c.impact}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* CHILD LABOR & HUMAN RIGHTS */}
        <Section title="Child Labor & Human Rights Risk Map" badge="Flagged">
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Stage','Country','Risk Type','Severity','Workers'].map(h=><th key={h} style={{padding:'8px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {Object.entries(SUPPLY_CHAINS).flatMap(([id,ch])=>
                  ch.supply_chain.flatMap(st=>(st.countries||[]).filter(c=>c.child_labor_risk||c.forced_labor_risk||c.labor_risk||c.conflict_mineral).map(c=>({commodity:ch.name,stage:st.stage,country:c.name,childLabor:c.child_labor_risk,forcedLabor:c.forced_labor_risk,laborRisk:c.labor_risk,conflict:c.conflict_mineral,workers:c.workers_est})))
                ).map((r,i)=>(
                  <tr key={i}>
                    <TD style={{fontWeight:600}}>{r.commodity}</TD>
                    <TD>{r.stage}</TD>
                    <TD>{r.country}</TD>
                    <TD>{r.childLabor?'Child Labor':r.forcedLabor?'Forced Labor':r.conflict?'Conflict Mineral':'Labor Risk'}</TD>
                    <TD><Badge label={r.childLabor||r.forcedLabor?'Critical':'High'} color="red"/></TD>
                    <TD style={{fontSize:11}}>{r.workers?r.workers>1000000?`${(r.workers/1000000).toFixed(1)}M`:r.workers>1000?`${(r.workers/1000).toFixed(0)}K`:r.workers:'\u2014'}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* RECYCLING & CIRCULAR ECONOMY */}
        {stages.find(s=>s.stage==='End of Life')&&(
          <Section title="Recycling & Circular Economy" badge={chain.name}>
            <Card>
              {(()=>{
                const eol=stages.find(s=>s.stage==='End of Life');
                return(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                    <div style={{textAlign:'center',padding:20,background:T.surfaceH,borderRadius:10}}>
                      <div style={{fontSize:11,color:T.textMut}}>Recycling Rate</div>
                      <div style={{fontSize:36,fontWeight:800,color:eol.recycling_rate_pct>=50?T.green:eol.recycling_rate_pct>=20?T.amber:T.red}}>{eol.recycling_rate_pct}%</div>
                      {eol.recycling_capacity_kt&&<div style={{fontSize:12,color:T.textSec}}>Capacity: {eol.recycling_capacity_kt>1000?(eol.recycling_capacity_kt/1000).toFixed(0)+'K':eol.recycling_capacity_kt} kt</div>}
                      {eol.workers_est>0&&<div style={{fontSize:11,color:T.textMut,marginTop:4}}>Workers: {eol.workers_est>1000?(eol.workers_est/1000).toFixed(0)+'K':eol.workers_est}</div>}
                    </div>
                    <div style={{padding:16}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Recycling Leaders</div>
                      {(eol.recycling_leaders||[]).map((l,i)=><div key={i} style={{fontSize:12,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}>{l}</div>)}
                    </div>
                    <div style={{padding:16}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Circular Economy</div>
                      <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>{eol.circular_economy_potential}</div>
                      {eol.recycling_carbon_saving_pct&&<div style={{marginTop:8,fontSize:12}}>Carbon savings: <span style={{fontWeight:700,color:T.green}}>{eol.recycling_carbon_saving_pct}%</span> vs virgin</div>}
                    </div>
                  </div>
                );
              })()}
            </Card>
          </Section>
        )}

        {/* END USE BREAKDOWN */}
        {stages.find(s=>s.stage==='Use')&&(
          <Section title="End Use Application Breakdown" badge={chain.name}>
            <Card>
              {(()=>{
                const euStage=stages.find(s=>s.stage==='Use');
                return(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={(euStage.applications||[]).map(a=>({name:a.use,value:a.share_pct}))} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,percent})=>`${name.slice(0,20)} ${(percent*100).toFixed(0)}%`} labelLine>
                          {(euStage.applications||[]).map((_,i)=><Cell key={i} fill={STAGE_COLORS[i%STAGE_COLORS.length]}/>)}
                        </Pie>
                        <Tooltip/>
                      </PieChart>
                    </ResponsiveContainer>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead><tr style={{background:T.surfaceH}}>
                        {['Application','Share','Growth','Companies'].map(h=><th key={h} style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {(euStage.applications||[]).map((a,i)=>(
                          <tr key={i}>
                            <TD style={{fontWeight:600,fontSize:12}}>{a.use}</TD>
                            <TD><span style={{fontWeight:600}}>{a.share_pct}%</span></TD>
                            <TD style={{color:a.growth_rate>=10?T.green:a.growth_rate>=3?T.amber:T.textSec,fontWeight:600}}>{a.growth_rate?`+${a.growth_rate}%/yr`:'\u2014'}</TD>
                            <TD style={{fontSize:10}}>{a.companies?a.companies.join(', '):'\u2014'}</TD>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </Card>
          </Section>
        )}

        {/* COMMODITY COMPARISON */}
        <Section title="Commodity Comparison" badge="Side-by-Side">
          <div style={{display:'flex',gap:12,marginBottom:16}}>
            <select value={selectedComm} onChange={e=>{setSelectedComm(e.target.value);setSelectedStage(0)}} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font}}>
              {COMMODITY_LIST.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span style={{fontSize:14,fontWeight:600,color:T.textMut,alignSelf:'center'}}>vs</span>
            <select value={compareComm} onChange={e=>setCompareComm(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font}}>
              {COMMODITY_LIST.filter(c=>c.id!==selectedComm).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[{id:selectedComm,ch:chain},{id:compareComm,ch:compareChain}].map(({id,ch})=>ch?(
              <Card key={id} style={{borderTop:`3px solid ${id===selectedComm?T.navy:T.gold}`}}>
                <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:12}}>{ch.name}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  <div style={{fontSize:11,color:T.textMut}}>Production: <span style={{fontWeight:600,color:T.text}}>{ch.total_production_kt>10000?(ch.total_production_kt/1000).toFixed(0)+'K':ch.total_production_kt.toLocaleString()} kt</span></div>
                  <div style={{fontSize:11,color:T.textMut}}>Price: <span style={{fontWeight:600,color:T.text}}>${ch.price}</span></div>
                  <div style={{fontSize:11,color:T.textMut}}>Reserves: <span style={{fontWeight:600,color:T.text}}>{ch.reserves_years?`${ch.reserves_years} yrs`:'N/A'}</span></div>
                  <div style={{fontSize:11,color:T.textMut}}>ML Risk: <span style={{fontWeight:700,color:mlPredictRisk(ch).overallRisk>=60?T.red:T.amber}}>{mlPredictRisk(ch).overallRisk}/100</span></div>
                </div>
                <div style={{marginTop:10}}>
                  {ch.supply_chain.filter(s=>s.countries).map((st,i)=>{
                    const top=[...(st.countries||[])].sort((a,b)=>(b.share_pct||0)-(a.share_pct||0))[0];
                    return <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:11}}>
                      <span style={{fontWeight:600,color:STAGE_COLORS[i]}}>{st.stage}</span>
                      <span>{top?.name} ({top?.share_pct}%)</span>
                    </div>;
                  })}
                </div>
              </Card>
            ):null)}
          </div>
        </Section>

        {/* COUNTRY SUPPLY CHAIN DATABASE */}
        <Section title="Country Supply Chain Exposure Database" badge={`${COUNTRY_LIST_SORTED.length} Countries`}>
          <Card>
            <div style={{overflowX:'auto',maxHeight:500}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead style={{position:'sticky',top:0,zIndex:1}}>
                  <tr style={{background:T.surfaceH}}>
                    {['Country','Chains','Stages','Role','Env','Social','Gov','Workers','Regulatory Risk','Geopolitical'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Country'||h==='Role'||h==='Regulatory Risk'||h==='Geopolitical'?'left':'center'}}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {COUNTRY_LIST_SORTED.map((c,i)=>(
                    <tr key={i}>
                      <TD style={{fontWeight:600}}><span style={{marginRight:4,fontSize:10,padding:'1px 4px',background:T.surfaceH,borderRadius:3}}>{c.iso2}</span>{c.name}</TD>
                      <TD style={{textAlign:'center',fontWeight:700}}>{c.supply_chains.length}</TD>
                      <TD style={{textAlign:'center'}}>{c.total_stages}</TD>
                      <TD style={{fontSize:10}}>{c.dominant_role}</TD>
                      <TD style={{textAlign:'center'}}><RiskBar value={c.avg_esg_env}/></TD>
                      <TD style={{textAlign:'center'}}><RiskBar value={c.avg_esg_social}/></TD>
                      <TD style={{textAlign:'center'}}><RiskBar value={c.avg_esg_governance}/></TD>
                      <TD style={{textAlign:'center',fontSize:10}}>{c.worker_estimate>1000000?`${(c.worker_estimate/1000000).toFixed(1)}M`:`${(c.worker_estimate/1000).toFixed(0)}K`}</TD>
                      <TD style={{fontSize:9,color:T.textSec,maxWidth:120}}>{c.regulatory_risk}</TD>
                      <TD style={{fontSize:9,color:T.textMut,maxWidth:100}}>{c.geopolitical}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* COMMODITY SUMMARY CARDS */}
        <Section title="All Commodities Summary" badge={`${TOTAL_SC_COUNT} supply chains`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
            {COMMODITY_LIST.map(c=>{
              const ch=SUPPLY_CHAINS[c.id];
              const ml=mlPredictRisk(ch);
              const eolStage=ch.supply_chain.find(s=>s.stage==='End of Life');
              let workerSum=0;
              ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(x=>{if(x.workers_est)workerSum+=x.workers_est});if(st.workers_est)workerSum+=st.workers_est});
              return(
                <Card key={c.id} style={{cursor:'pointer',borderTop:`3px solid ${STAGE_COLORS[COMMODITY_LIST.indexOf(c)%STAGE_COLORS.length]}`,transition:'all 0.2s'}} onClick={()=>{setSelectedComm(c.id);setSelectedStage(0);window.scrollTo({top:0,behavior:'smooth'})}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:6}}>{ch.name}</div>
                  <div style={{display:'grid',gap:3}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:10}}><span style={{color:T.textMut}}>Production</span><span style={{fontWeight:600}}>{ch.total_production_kt>10000?(ch.total_production_kt/1000).toFixed(0)+'K':ch.total_production_kt.toLocaleString()} kt</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:10}}><span style={{color:T.textMut}}>Stages</span><span style={{fontWeight:600}}>{c.stages}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:10}}><span style={{color:T.textMut}}>Countries</span><span style={{fontWeight:600}}>{c.countries}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:10}}><span style={{color:T.textMut}}>Workers</span><span style={{fontWeight:600}}>{workerSum>1000000?`${(workerSum/1000000).toFixed(1)}M`:workerSum>1000?`${(workerSum/1000).toFixed(0)}K`:workerSum}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:10}}><span style={{color:T.textMut}}>ML Risk</span><span style={{fontWeight:700,color:ml.overallRisk>=60?T.red:ml.overallRisk>=35?T.amber:T.green}}>{ml.overallRisk}/100</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:10}}><span style={{color:T.textMut}}>Recycling</span><span style={{fontWeight:600,color:eolStage?.recycling_rate_pct>=50?T.green:T.red}}>{eolStage?.recycling_rate_pct||0}%</span></div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>

        {/* ESG RADAR COMPARISON */}
        <Section title="ESG Risk Comparison Across Commodities" badge="Radar">
          <Card>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={Object.entries(SUPPLY_CHAINS).map(([id,ch])=>{
                let envSum=0,socSum=0,govSum=0,cnt=0;
                ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.esg_risk){envSum+=c.esg_risk.env;socSum+=c.esg_risk.social;govSum+=c.esg_risk.governance;cnt++}})});
                return{commodity:ch.name,Environmental:cnt?Math.round(envSum/cnt):0,Social:cnt?Math.round(socSum/cnt):0,Governance:cnt?Math.round(govSum/cnt):0};
              })}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="commodity" tick={{fontSize:9}}/>
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
                <Radar name="Environmental" dataKey="Environmental" stroke="#dc2626" fill="#dc2626" fillOpacity={0.2}/>
                <Radar name="Social" dataKey="Social" stroke="#d97706" fill="#d97706" fillOpacity={0.2}/>
                <Radar name="Governance" dataKey="Governance" stroke="#0284c7" fill="#0284c7" fillOpacity={0.2}/>
                <Legend/><Tooltip/>
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* CUSTOM SUPPLY CHAIN DATA */}
        <Section title="Custom Supply Chain Data" badge="Persist to localStorage">
          <Card>
            <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Override country shares or add custom supply chain data. Changes persist to localStorage.</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:8,alignItems:'end'}}>
              <div><div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Commodity</div><select id="cd_comm" style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12}}>{COMMODITY_LIST.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Stage</div><select id="cd_stage" style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12}}>{['Extraction','Processing','Manufacturing','Distribution','Use','End of Life'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              <div><div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Note / Override</div><input id="cd_note" placeholder="e.g., New Chile share: 30%" style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,boxSizing:'border-box'}}/></div>
              <Btn primary small onClick={()=>{
                const comm=document.getElementById('cd_comm').value;
                const stage=document.getElementById('cd_stage').value;
                const note=document.getElementById('cd_note').value;
                if(note){
                  const upd={...customData,[`${comm}_${stage}`]:{commodity:comm,stage,note,timestamp:new Date().toISOString()}};
                  setCustomData(upd);saveLS(LS_SC,upd);
                }
              }}>Save</Btn>
            </div>
            {Object.keys(customData).length>0&&(
              <div style={{marginTop:12}}>
                <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Saved Overrides ({Object.keys(customData).length})</div>
                {Object.entries(customData).map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                    <span><span style={{fontWeight:600}}>{v.commodity}</span> / {v.stage}: {v.note}</span>
                    <span style={{fontSize:10,color:T.textMut}}>{v.timestamp?.slice(0,10)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Section>

        {/* SUPPLY CHAIN RISK DASHBOARD - KEY METRICS */}
        <Section title="Supply Chain Risk Dashboard" badge="All 15 Commodities">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
              <div style={{textAlign:'center',padding:14,background:T.surfaceH,borderRadius:10}}>
                <div style={{fontSize:10,color:T.textMut}}>Total Supply Chains</div>
                <div style={{fontSize:28,fontWeight:800,color:T.navy}}>{TOTAL_SC_COUNT}</div>
              </div>
              <div style={{textAlign:'center',padding:14,background:T.surfaceH,borderRadius:10}}>
                <div style={{fontSize:10,color:T.textMut}}>Countries in Database</div>
                <div style={{fontSize:28,fontWeight:800,color:T.navy}}>{COUNTRY_LIST_SORTED.length}</div>
              </div>
              <div style={{textAlign:'center',padding:14,background:T.surfaceH,borderRadius:10}}>
                <div style={{fontSize:10,color:T.textMut}}>Total Workers</div>
                <div style={{fontSize:28,fontWeight:800,color:T.navy}}>{(()=>{let total=0;Object.values(SUPPLY_CHAINS).forEach(ch=>{ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.workers_est)total+=c.workers_est});if(st.workers_est)total+=st.workers_est})});return total>1000000000?`${(total/1000000000).toFixed(1)}B`:total>1000000?`${(total/1000000).toFixed(0)}M`:`${(total/1000).toFixed(0)}K`})()}</div>
              </div>
              <div style={{textAlign:'center',padding:14,background:T.surfaceH,borderRadius:10}}>
                <div style={{fontSize:10,color:T.textMut}}>Human Rights Flags</div>
                <div style={{fontSize:28,fontWeight:800,color:T.red}}>{(()=>{let n=0;Object.values(SUPPLY_CHAINS).forEach(ch=>{ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.child_labor_risk||c.forced_labor_risk||c.conflict_mineral)n++})})});return n})()}</div>
              </div>
              <div style={{textAlign:'center',padding:14,background:T.surfaceH,borderRadius:10}}>
                <div style={{fontSize:10,color:T.textMut}}>Avg Recycling Rate</div>
                <div style={{fontSize:28,fontWeight:800,color:T.amber}}>{Math.round(Object.values(SUPPLY_CHAINS).reduce((s,ch)=>{const eol=ch.supply_chain.find(st=>st.stage==='End of Life');return s+(eol?.recycling_rate_pct||0)},0)/TOTAL_SC_COUNT)}%</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:8}}>Highest Risk Supply Chains</div>
                {Object.entries(SUPPLY_CHAINS).map(([id,ch])=>({id,name:ch.name,...mlPredictRisk(ch)})).sort((a,b)=>b.overallRisk-a.overallRisk).slice(0,7).map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:12,fontWeight:600}}>{r.name}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:60,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{width:`${r.overallRisk}%`,height:'100%',background:r.overallRisk>=60?T.red:r.overallRisk>=35?T.amber:T.green,borderRadius:3}}/></div>
                      <span style={{fontSize:11,fontWeight:700,color:r.overallRisk>=60?T.red:T.amber}}>{r.overallRisk}/100</span>
                      <Badge label={r.category} color={r.category==='Critical'?'red':r.category==='High'?'amber':'green'}/>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.green,marginBottom:8}}>Highest Circular Economy Potential</div>
                {Object.entries(SUPPLY_CHAINS).map(([id,ch])=>{const eol=ch.supply_chain.find(st=>st.stage==='End of Life');return{name:ch.name,recycling:eol?.recycling_rate_pct||0,carbonSaving:eol?.recycling_carbon_saving_pct||0}}).sort((a,b)=>b.recycling-a.recycling).slice(0,7).map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:12,fontWeight:600}}>{r.name}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:11,fontWeight:700,color:r.recycling>=50?T.green:r.recycling>=15?T.amber:T.red}}>{r.recycling}%</span>
                      <span style={{fontSize:10,color:T.textSec}}>Carbon save: {r.carbonSaving}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        {/* SUPPLY CHAIN WORKER DISTRIBUTION */}
        <Section title="Worker Distribution Across Supply Chains" badge="Employment Impact">
          <Card>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={Object.entries(SUPPLY_CHAINS).map(([id,ch])=>{
                let total=0;
                ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.workers_est)total+=c.workers_est});if(st.workers_est)total+=st.workers_est});
                return{name:ch.name,workers:total};
              }).sort((a,b)=>b.workers-a.workers)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>v>=1000000?`${(v/1000000).toFixed(0)}M`:v>=1000?`${(v/1000).toFixed(0)}K`:v}/>
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize:10}}/>
                <Tooltip formatter={v=>[v>=1000000?`${(v/1000000).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(0)}K`:v,'Workers']}/>
                <Bar dataKey="workers" name="Est. Workers" radius={[0,4,4,0]}>
                  {Object.entries(SUPPLY_CHAINS).map(([id,ch])=>{
                    let total=0;ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.workers_est)total+=c.workers_est});if(st.workers_est)total+=st.workers_est});
                    return{name:ch.name,workers:total};
                  }).sort((a,b)=>b.workers-a.workers).map((_,i)=><Cell key={i} fill={STAGE_COLORS[i%STAGE_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* SUPPLY CHAIN CHOKEPOINTS */}
        <Section title="Supply Chain Chokepoints & Vulnerabilities" badge="Key Risks">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[
                {chain:'Cobalt',chokepoint:'DR Congo extraction (73%)',risk:'Critical',factor:'Child labor, conflict, single-country dependency',mitigation:'DRC cobalt traceability, LFP substitution'},
                {chain:'Rare Earths',chokepoint:'China processing (90%)',risk:'Critical',factor:'Export controls, geopolitical weaponization',mitigation:'MP Materials (US), Lynas (AU) alternative processing'},
                {chain:'Palm Oil',chokepoint:'Indonesia + Malaysia (84%)',risk:'High',factor:'Deforestation, EUDR compliance, El Nino impact',mitigation:'RSPO certification, diversification to Colombia/Thailand'},
                {chain:'Lithium',chokepoint:'China refining (65%)',risk:'High',factor:'Battery supply chain bottleneck',mitigation:'US/EU refinery buildout under IRA/CRM Act'},
                {chain:'Nickel',chokepoint:'Indonesia ore (48%)',risk:'High',factor:'Export ban on raw ore, environmental damage from HPAL',mitigation:'Recycling, Philippines as alternative source'},
                {chain:'Cocoa',chokepoint:'West Africa (55%)',risk:'High',factor:'Climate change, child labor, aging farmers',mitigation:'Shade-grown, premium pricing, lab-grown R&D'},
                {chain:'Cotton',chokepoint:'Xinjiang (23% of China)',risk:'High',factor:'Forced labor sanctions (UFLPA)',mitigation:'Supply chain traceability, BCI certification'},
                {chain:'Steel',chokepoint:'China BF-BOF (54%)',risk:'Medium',factor:'CBAM carbon border tax, overcapacity',mitigation:'H2-DRI (HYBRIT), EAF scrap steelmaking'},
                {chain:'Wheat',chokepoint:'Black Sea exports (Russia/Ukraine)',risk:'High',factor:'War disruption, export restrictions',mitigation:'Grain corridor, diversification of import sources'},
              ].map((c,i)=>(
                <div key={i} style={{padding:14,background:T.surfaceH,borderRadius:10,borderLeft:`3px solid ${c.risk==='Critical'?T.red:c.risk==='High'?T.amber:T.sage}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:700,color:T.navy}}>{c.chain}</span>
                    <Badge label={c.risk} color={c.risk==='Critical'?'red':c.risk==='High'?'amber':'green'}/>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:T.text,marginBottom:4}}>{c.chokepoint}</div>
                  <div style={{fontSize:10,color:T.textSec,marginBottom:4}}><span style={{color:T.red,fontWeight:600}}>Factor:</span> {c.factor}</div>
                  <div style={{fontSize:10,color:T.textSec}}><span style={{color:T.green,fontWeight:600}}>Mitigation:</span> {c.mitigation}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* CROSS-NAV */}
        <Section title="Related Modules">
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[
              {label:'Commodity Intelligence',path:'/commodity-intelligence'},
              {label:'Supply Chain Carbon Map',path:'/supply-chain-carbon'},
              {label:'Deforestation Risk',path:'/deforestation-risk'},
              {label:'CSDDD Compliance',path:'/csddd-compliance'},
              {label:'Forced Labour & Modern Slavery',path:'/forced-labour'},
              {label:'Value Chain Dashboard',path:'/value-chain-dashboard'},
              {label:'Human Rights Due Diligence',path:'/infra-esg-dd'},
            ].map(m=>(
              <Btn key={m.path} onClick={()=>navigate(m.path)} style={{background:T.surfaceH}}>{m.label} &rarr;</Btn>
            ))}
          </div>
        </Section>

        {/* CONCENTRATION RISK HEATMAP - ALL COMMODITIES */}
        <Section title="Supply Concentration Risk Across All Commodities" badge="HHI Analysis">
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','Extraction Top','Ext. Share','Processing Top','Proc. Share','Mfg Top','Mfg. Share','Max HHI','Risk Level'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {Object.entries(SUPPLY_CHAINS).map(([id,ch])=>{
                    const getTop=(stageName)=>{
                      const st=ch.supply_chain.find(s=>s.stage===stageName);
                      if(!st||!st.countries)return{name:'N/A',share:0,hhi:0};
                      const sorted=[...st.countries].sort((a,b)=>(b.share_pct||0)-(a.share_pct||0));
                      const hhi=sorted.reduce((s,c)=>s+Math.pow(c.share_pct||0,2),0);
                      return{name:sorted[0]?.name||'N/A',share:sorted[0]?.share_pct||0,hhi:Math.round(hhi)};
                    };
                    const ext=getTop('Extraction');const proc=getTop('Processing');const mfg=getTop('Manufacturing');
                    const maxHhi=Math.max(ext.hhi,proc.hhi,mfg.hhi);
                    const riskLevel=maxHhi>=5000?'Critical':maxHhi>=3000?'High':maxHhi>=2000?'Medium':'Low';
                    return(
                      <tr key={id}>
                        <TD style={{fontWeight:700}}>{ch.name}</TD>
                        <TD style={{textAlign:'center',fontSize:11}}>{ext.name}</TD>
                        <TD style={{textAlign:'center',fontWeight:700,color:ext.share>=50?T.red:ext.share>=30?T.amber:T.green}}>{ext.share}%</TD>
                        <TD style={{textAlign:'center',fontSize:11}}>{proc.name}</TD>
                        <TD style={{textAlign:'center',fontWeight:700,color:proc.share>=50?T.red:proc.share>=30?T.amber:T.green}}>{proc.share}%</TD>
                        <TD style={{textAlign:'center',fontSize:11}}>{mfg.name}</TD>
                        <TD style={{textAlign:'center',fontWeight:700,color:mfg.share>=50?T.red:mfg.share>=30?T.amber:T.green}}>{mfg.share}%</TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11}}>{maxHhi}</TD>
                        <TD style={{textAlign:'center'}}><Badge label={riskLevel} color={riskLevel==='Critical'?'red':riskLevel==='High'?'amber':riskLevel==='Medium'?'blue':'green'}/></TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* STAGE-BY-STAGE WORKER COUNT */}
        <Section title="Worker Distribution by Stage" badge={chain?.name}>
          <Card>
            {(()=>{
              const stageWorkers=stages.filter(s=>s.countries||s.workers_est).map(st=>{
                let total=st.workers_est||0;
                if(st.countries)st.countries.forEach(c=>{if(c.workers_est)total+=c.workers_est});
                return{stage:st.stage,workers:total};
              });
              return(
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stageWorkers}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="stage" tick={{fontSize:11}}/>
                      <YAxis tick={{fontSize:10}} tickFormatter={v=>v>=1000000?`${(v/1000000).toFixed(0)}M`:v>=1000?`${(v/1000).toFixed(0)}K`:v}/>
                      <Tooltip formatter={v=>[v>=1000000?`${(v/1000000).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(0)}K`:v,'Workers']}/>
                      <Bar dataKey="workers" name="Estimated Workers" radius={[4,4,0,0]}>
                        {stageWorkers.map((_,i)=><Cell key={i} fill={STAGE_COLORS[i%STAGE_COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{display:'grid',gridTemplateColumns:`repeat(${stageWorkers.length},1fr)`,gap:8,marginTop:12}}>
                    {stageWorkers.map((s,i)=>(
                      <div key={i} style={{textAlign:'center',padding:10,background:T.surfaceH,borderRadius:8}}>
                        <div style={{fontSize:10,color:T.textMut}}>{s.stage}</div>
                        <div style={{fontSize:18,fontWeight:700,color:T.navy}}>{s.workers>=1000000?`${(s.workers/1000000).toFixed(1)}M`:s.workers>=1000?`${(s.workers/1000).toFixed(0)}K`:s.workers}</div>
                        <div style={{fontSize:9,color:T.textSec}}>workers</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </Card>
        </Section>

        {/* ESG HEATMAP TABLE */}
        <Section title="ESG Heatmap Table" badge="Stages x Dimensions">
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  <th style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>Stage</th>
                  <th style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Environmental</th>
                  <th style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Social</th>
                  <th style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Governance</th>
                  <th style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Composite</th>
                </tr></thead>
                <tbody>
                  {esgHeatmap.map((row,i)=>{
                    const composite=Math.round((row.Environmental+row.Social+(100-row.Governance))/3);
                    return(
                      <tr key={i}>
                        <TD style={{fontWeight:600}}>{row.stage}</TD>
                        {['Environmental','Social','Governance'].map(dim=>{
                          const v=row[dim];const isGov=dim==='Governance';
                          const bg=isGov?(v<40?'#fee2e2':v<60?'#fef3c7':'#dcfce7'):(v>=70?'#fee2e2':v>=50?'#fef3c7':'#dcfce7');
                          const fg=isGov?(v<40?T.red:v<60?T.amber:T.green):(v>=70?T.red:v>=50?T.amber:T.green);
                          return <TD key={dim} style={{textAlign:'center'}}><span style={{padding:'4px 12px',borderRadius:8,background:bg,color:fg,fontWeight:700,fontSize:13}}>{v}</span></TD>;
                        })}
                        <TD style={{textAlign:'center'}}><span style={{padding:'4px 12px',borderRadius:8,background:composite>=60?'#fee2e2':composite>=40?'#fef3c7':'#dcfce7',color:composite>=60?T.red:composite>=40?T.amber:T.green,fontWeight:700,fontSize:13}}>{composite}</span></TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* LIFECYCLE CARBON FOOTPRINT COMPARISON */}
        <Section title="Lifecycle Carbon Footprint Comparison" badge="Cradle-to-Grave">
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','Cradle-to-Gate','Gate-to-Grave','Total (kgCO2)','Best Practice','Best Technology','Reduction %'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'||h==='Best Technology'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {CARBON_FOOTPRINT_COMPARISON.map((c,i)=>{
                    const reduction=Math.round((1-c.best_practice/c.cradle_to_gate_kg)*100);
                    return(
                      <tr key={i}>
                        <TD style={{fontWeight:600,fontSize:12}}>{c.commodity}</TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11}}>{c.cradle_to_gate_kg>=1000000?`${(c.cradle_to_gate_kg/1000000).toFixed(0)}M`:c.cradle_to_gate_kg>=1000?`${(c.cradle_to_gate_kg/1000).toFixed(1)}K`:c.cradle_to_gate_kg}</TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11}}>{c.gate_to_grave_kg>=1000?`${(c.gate_to_grave_kg/1000).toFixed(1)}K`:c.gate_to_grave_kg}</TD>
                        <TD style={{textAlign:'center',fontWeight:700,fontSize:11}}>{c.total_kg>=1000000?`${(c.total_kg/1000000).toFixed(0)}M`:c.total_kg>=1000?`${(c.total_kg/1000).toFixed(1)}K`:c.total_kg}</TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11,color:T.green}}>{c.best_practice>=1000000?`${(c.best_practice/1000000).toFixed(0)}M`:c.best_practice>=1000?`${(c.best_practice/1000).toFixed(1)}K`:c.best_practice}</TD>
                        <TD style={{fontSize:10,color:T.textSec}}>{c.best_tech}</TD>
                        <TD style={{textAlign:'center'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,background:reduction>=60?'#dcfce7':reduction>=30?'#fef3c7':'#fee2e2',color:reduction>=60?T.green:reduction>=30?T.amber:T.red}}>-{reduction}%</span></TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* SUPPLY CHAIN TRANSITION RISK */}
        <Section title="Supply Chain Transition Risk Assessment" badge="Climate & Regulatory">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[
                {commodity:'Steel',transition_risk:82,driver:'CBAM carbon border tax',timeline:'2025-2027 transitional',stranded:'$120Bn in BF-BOF assets',opportunity:'Green steel premium 25%',adaptation:'H2-DRI + EAF pathway'},
                {commodity:'Crude Oil',transition_risk:72,driver:'Peak demand ~2028 (IEA)',timeline:'2028-2040 decline',stranded:'$1.2Tn undeveloped reserves',opportunity:'CCUS, petrochemicals pivot',adaptation:'Diversify to renewables'},
                {commodity:'Cement',transition_risk:68,driver:'CBAM + ETS for clinker',timeline:'2025-2030',stranded:'$80Bn conventional kilns',opportunity:'LC3 low-carbon cement',adaptation:'Carbon capture, alternative binders'},
                {commodity:'Palm Oil',transition_risk:75,driver:'EUDR deforestation ban',timeline:'2024-2026 enforcement',stranded:'Plantations on peatland',opportunity:'RSPO premium, biodiesel mandate',adaptation:'Zero-deforestation pledges'},
                {commodity:'Cotton',transition_risk:55,driver:'Forced labor bans (UFLPA)',timeline:'Now - ongoing',stranded:'Xinjiang supply chains',opportunity:'Organic/recycled cotton premium',adaptation:'Supply chain traceability'},
                {commodity:'Cobalt',transition_risk:65,driver:'LFP substitution + child labor regulation',timeline:'2024-2030',stranded:'High-cobalt NMC capacity',opportunity:'Ethical sourcing premium',adaptation:'Low-cobalt/no-cobalt batteries'},
                {commodity:'Lithium',transition_risk:45,driver:'Oversupply + sodium-ion competition',timeline:'2025-2030',stranded:'High-cost spodumene mines',opportunity:'EV demand structural growth',adaptation:'Cost reduction, recycling'},
                {commodity:'Nickel',transition_risk:58,driver:'Indonesian environmental damage + EU CBAM',timeline:'2025-2030',stranded:'High-carbon NPI/RKEF plants',opportunity:'Class 1 nickel for batteries',adaptation:'MHP processing, recycling'},
                {commodity:'Copper',transition_risk:25,driver:'Electrification demand surge',timeline:'2025-2050',stranded:'Minimal (demand tailwind)',opportunity:'Green premium emerging',adaptation:'Recycling, substitute management'},
              ].map((c,i)=>(
                <div key={i} style={{padding:14,background:T.surfaceH,borderRadius:10,borderLeft:`3px solid ${c.transition_risk>=65?T.red:c.transition_risk>=40?T.amber:T.sage}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{fontSize:14,fontWeight:700,color:T.navy}}>{c.commodity}</span>
                    <span style={{fontSize:14,fontWeight:700,color:c.transition_risk>=65?T.red:c.transition_risk>=40?T.amber:T.green}}>{c.transition_risk}/100</span>
                  </div>
                  <div style={{width:'100%',height:6,background:T.border,borderRadius:3,marginBottom:8,overflow:'hidden'}}>
                    <div style={{width:`${c.transition_risk}%`,height:'100%',background:c.transition_risk>=65?T.red:c.transition_risk>=40?T.amber:T.green,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:10,color:T.textSec,marginBottom:3}}><span style={{fontWeight:600,color:T.text}}>Driver:</span> {c.driver}</div>
                  <div style={{fontSize:10,color:T.textSec,marginBottom:3}}><span style={{fontWeight:600,color:T.text}}>Timeline:</span> {c.timeline}</div>
                  <div style={{fontSize:10,color:T.red,marginBottom:3}}><span style={{fontWeight:600}}>Stranded:</span> {c.stranded}</div>
                  <div style={{fontSize:10,color:T.green,marginBottom:3}}><span style={{fontWeight:600}}>Opportunity:</span> {c.opportunity}</div>
                  <div style={{fontSize:10,color:T.navyL}}><span style={{fontWeight:600}}>Adaptation:</span> {c.adaptation}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* REGULATORY COMPLIANCE TRACKER */}
        <Section title="Supply Chain Regulatory Compliance" badge={`${SC_REGULATIONS.length} Regulations`}>
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Regulation','Effective','Full Enforce','Commodities','Requirement','Penalty','Cost'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {SC_REGULATIONS.map((r,i)=>(
                    <tr key={i}>
                      <TD style={{fontWeight:700,fontSize:12}}>{r.regulation}</TD>
                      <TD style={{fontSize:11}}>{r.effective}</TD>
                      <TD style={{fontSize:11}}>{r.full_enforcement}</TD>
                      <TD style={{fontSize:9,maxWidth:120}}>{r.commodities.slice(0,3).join(', ')}{r.commodities.length>3?'...':''}</TD>
                      <TD style={{fontSize:10,color:T.textSec,maxWidth:150}}>{r.requirement}</TD>
                      <TD style={{fontSize:10,color:T.red}}>{r.penalty}</TD>
                      <TD><Badge label={r.compliance_cost} color={r.compliance_cost==='Very High'?'red':r.compliance_cost==='High'?'amber':'green'}/></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* SUPPLY CHAIN MATURITY */}
        <Section title="Supply Chain Maturity Assessment" badge={`${SC_MATURITY.length} Commodities`}>
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','Traceability','Certification','Transparency','Digitization','Resilience','Score'].map(h=><th key={h} style={{padding:'8px 6px',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {SC_MATURITY.sort((a,b)=>b.maturity_score-a.maturity_score).map((m,i)=>{
                    const levelColor=l=>l.includes('High')||l.includes('Very')||l.includes('Advanced')?T.green:l.includes('Medium')||l.includes('Moderate')||l.includes('Emerging')?T.amber:T.red;
                    return(
                      <tr key={i}>
                        <TD style={{fontWeight:600}}>{m.commodity}</TD>
                        <TD style={{textAlign:'center',fontSize:10,color:levelColor(m.traceability)}}>{m.traceability}</TD>
                        <TD style={{textAlign:'center',fontSize:10}}>{m.certification}</TD>
                        <TD style={{textAlign:'center',fontSize:10,color:levelColor(m.transparency)}}>{m.transparency}</TD>
                        <TD style={{textAlign:'center',fontSize:10,color:levelColor(m.digitization)}}>{m.digitization}</TD>
                        <TD style={{textAlign:'center',fontSize:10,color:levelColor(m.resilience)}}>{m.resilience}</TD>
                        <TD style={{textAlign:'center'}}><span style={{padding:'3px 10px',borderRadius:8,fontSize:12,fontWeight:700,background:m.maturity_score>=60?'#dcfce7':m.maturity_score>=40?'#fef3c7':'#fee2e2',color:m.maturity_score>=60?T.green:m.maturity_score>=40?T.amber:T.red}}>{m.maturity_score}</span></TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* DATA COVERAGE METRICS */}
        <Section title="Data Coverage Metrics" badge="Transparency">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12}}>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Supply Chains</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{TOTAL_SC_COUNT}</div>
              </div>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Countries</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{COUNTRY_LIST_SORTED.length}</div>
              </div>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Country-Stage Pairs</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{(()=>{let n=0;Object.values(SUPPLY_CHAINS).forEach(ch=>{ch.supply_chain.forEach(st=>{if(st.countries)n+=st.countries.length})});return n})()}</div>
              </div>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Companies Mapped</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{(()=>{let n=0;Object.values(SUPPLY_CHAINS).forEach(ch=>{ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.companies)n+=c.companies.length})})});return n})()}</div>
              </div>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>ML Risk Models</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>{TOTAL_SC_COUNT}</div>
              </div>
              <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Lifecycle Stages</div>
                <div style={{fontSize:24,fontWeight:800,color:T.navy}}>6</div>
              </div>
            </div>
          </Card>
        </Section>

        {/* METHODOLOGY */}
        <Section title="Methodology & Data Sources" badge="Transparency">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Supply Chain Mapping</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>Six lifecycle stages: Extraction, Processing, Manufacturing, Distribution, Use, End of Life. Country shares based on USGS, IEA, FAO, and industry reports. {TOTAL_SC_COUNT} complete supply chains with 30+ countries.</div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>ESG Risk Scoring</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>E, S, G scores 0-100 (higher = greater risk). Based on country indicators, industry benchmarks, and company disclosures. Human rights flags from OHCHR, KnowTheChain, Global Slavery Index.</div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>ML Risk Prediction</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>Weighted multi-factor scoring model across: supply concentration (HHI), ESG averages, human rights flags, recycling rates, and climate risk factors. Confidence based on data coverage.</div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Worker Estimates</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>Employment estimates from ILO, national statistics, industry associations, and company annual reports. Includes direct and major indirect employment across all supply chain stages.</div>
              </div>
            </div>
            <div style={{marginTop:16,padding:12,background:T.surfaceH,borderRadius:8}}>
              <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>Data Quality Notes</div>
              <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>
                Production volumes and country shares are based on the latest available data (2023-2024). Worker estimates are approximations and include both formal and informal employment where applicable (e.g., artisanal mining in DRC, smallholder farming in palm oil and cocoa).
                ESG risk scores are composite indicators and should be interpreted as relative risk rankings rather than absolute measures. ML risk predictions use a deterministic weighted scoring model and are updated dynamically based on the supply chain data shown.
                Carbon intensity figures are lifecycle-stage averages and may vary significantly by specific facility, technology, and energy source.
                All data is provided for analytical and educational purposes. Supply chain maturity scores are based on industry assessments and may change as certification programs evolve.
              </div>
            </div>
          </Card>
        </Section>

        {/* GLOBAL SUPPLY CHAIN STATISTICS */}
        <Section title="Global Supply Chain Statistics Summary" badge="Aggregate">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Scale & Coverage</div>
                <div style={{display:'grid',gap:4}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Supply Chains</span><span style={{fontWeight:600}}>{TOTAL_SC_COUNT}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Countries</span><span style={{fontWeight:600}}>{COUNTRY_LIST_SORTED.length}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Lifecycle Stages</span><span style={{fontWeight:600}}>6 per chain</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Regulations Tracked</span><span style={{fontWeight:600}}>{SC_REGULATIONS.length}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0'}}><span style={{color:T.textMut}}>Maturity Assessments</span><span style={{fontWeight:600}}>{SC_MATURITY.length}</span></div>
                </div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Risk Summary</div>
                <div style={{display:'grid',gap:4}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Critical Risk Chains</span><span style={{fontWeight:700,color:T.red}}>{Object.values(SUPPLY_CHAINS).filter(ch=>mlPredictRisk(ch).category==='Critical').length}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>High Risk Chains</span><span style={{fontWeight:700,color:T.amber}}>{Object.values(SUPPLY_CHAINS).filter(ch=>mlPredictRisk(ch).category==='High').length}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Human Rights Flags</span><span style={{fontWeight:700,color:T.red}}>{(()=>{let n=0;Object.values(SUPPLY_CHAINS).forEach(ch=>{ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.child_labor_risk||c.forced_labor_risk||c.conflict_mineral)n++})})});return n})()}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>EUDR-Exposed Chains</span><span style={{fontWeight:600}}>5</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0'}}><span style={{color:T.textMut}}>CBAM-Exposed Chains</span><span style={{fontWeight:600}}>3</span></div>
                </div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Circular Economy</div>
                <div style={{display:'grid',gap:4}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Avg Recycling Rate</span><span style={{fontWeight:600}}>{Math.round(Object.values(SUPPLY_CHAINS).reduce((s,ch)=>{const eol=ch.supply_chain.find(st=>st.stage==='End of Life');return s+(eol?.recycling_rate_pct||0)},0)/TOTAL_SC_COUNT)}%</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Best Recycler</span><span style={{fontWeight:600,color:T.green}}>Gold (90%)</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Worst Recycler</span><span style={{fontWeight:600,color:T.red}}>Palm Oil (0%)</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Avg Carbon Saving</span><span style={{fontWeight:600}}>{Math.round(Object.values(SUPPLY_CHAINS).reduce((s,ch)=>{const eol=ch.supply_chain.find(st=>st.stage==='End of Life');return s+(eol?.recycling_carbon_saving_pct||0)},0)/TOTAL_SC_COUNT)}%</span></div>
                </div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Model Performance</div>
                <div style={{display:'grid',gap:4}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>ML Risk Models</span><span style={{fontWeight:600}}>{TOTAL_SC_COUNT}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Avg Confidence</span><span style={{fontWeight:600}}>{Math.round(Object.values(SUPPLY_CHAINS).reduce((s,ch)=>s+mlPredictRisk(ch).confidence,0)/TOTAL_SC_COUNT)}%</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Features Used</span><span style={{fontWeight:600}}>12 factors</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0'}}><span style={{color:T.textMut}}>Update Frequency</span><span style={{fontWeight:600}}>Real-time</span></div>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        <div style={{textAlign:'center',padding:'20px 0',borderTop:`1px solid ${T.border}`,marginTop:20}}>
          <span style={{fontSize:11,color:T.textMut}}>Global Commodity Inventory & Supply Chain | EP-Y2 | {TOTAL_SC_COUNT} Supply Chains | 6 Stages | {COUNTRY_LIST_SORTED.length} Countries | ML Risk Prediction | Worker Estimates | {SC_REGULATIONS.length} Regulations | Sprint Y</span>
        </div>
      </div>
    </div>
  );
}
