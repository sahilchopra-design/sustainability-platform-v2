import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ComposedChart, PieChart, Pie,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ================================================================= THEME */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif"};
const STAGE_COLORS=['#dc2626','#d97706','#0284c7','#16a34a','#7c3aed'];
const DIM_COLORS={finance:'#1b3a5c',esg:'#c5a96a',climate:'#16a34a'};

/* ================================================================= HELPERS */
const LS_PORT='ra_portfolio_v1';
const LS_SC='ra_commodity_supply_chains_v1';
const loadLS=k=>{try{return JSON.parse(localStorage.getItem(k))||null}catch{return null}};
const saveLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const seed=s=>{let x=Math.sin(s*9973+7)*10000;return x-Math.floor(x)};
const fmt=(n,d=1)=>n==null?'\u2014':Number(n).toFixed(d);
const pct=n=>n==null?'\u2014':`${Math.round(n)}%`;

/* ================================================================= SUPPLY CHAIN DATA */
const SUPPLY_CHAINS = {
  LITHIUM:{
    name:'Lithium',total_production_kt:130,reserves_kt:98000,reserves_years:754,unit:'USD/t',price:12500,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'AU',name:'Australia',share_pct:47,production_kt:61,type:'Hard rock (spodumene)',companies:['Pilbara Minerals','IGO Limited','Mineral Resources'],regions:['Western Australia (Greenbushes, Pilgangoora)'],source_type:'Mining',esg_risk:{env:72,social:35,governance:82},water_intensity:'High',carbon_intensity_kg_per_t:15000,price_at_stage:850,value_add_pct:7},
        {iso2:'CL',name:'Chile',share_pct:25,production_kt:32,type:'Brine',companies:['SQM','Albemarle'],regions:['Atacama Desert'],source_type:'Brine evaporation',esg_risk:{env:85,social:55,governance:70},water_intensity:'Very High (arid region)',carbon_intensity_kg_per_t:8000,price_at_stage:720,value_add_pct:6,indigenous_impact:'High'},
        {iso2:'CN',name:'China',share_pct:15,production_kt:19,type:'Hard rock + brine',companies:['Ganfeng Lithium','Tianqi Lithium'],regions:['Sichuan, Qinghai, Jiangxi'],source_type:'Mining + Brine',esg_risk:{env:68,social:42,governance:45},carbon_intensity_kg_per_t:18000,price_at_stage:900},
        {iso2:'AR',name:'Argentina',share_pct:6,production_kt:8,type:'Brine',companies:['Livent','Allkem'],regions:['Salta Province'],source_type:'Brine',esg_risk:{env:75,social:50,governance:55},indigenous_impact:'High',carbon_intensity_kg_per_t:7500,price_at_stage:680},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:65,capacity_kt:85,type:'Lithium hydroxide/carbonate',companies:['Ganfeng','Tianqi','BYD'],esg_risk:{env:60,social:40,governance:45},carbon_intensity_kg_per_t:5000,price_at_stage:4500,value_add_pct:36},
        {iso2:'CL',name:'Chile',share_pct:15,capacity_kt:20,type:'Lithium carbonate',esg_risk:{env:55,social:50,governance:70},carbon_intensity_kg_per_t:3000,price_at_stage:3800},
        {iso2:'AU',name:'Australia',share_pct:5,capacity_kt:7,type:'Spodumene concentrate to hydroxide',esg_risk:{env:40,social:30,governance:85},carbon_intensity_kg_per_t:4500,price_at_stage:5200},
        {iso2:'US',name:'USA',share_pct:3,capacity_kt:4,companies:['Albemarle (Silver Peak)'],esg_risk:{env:35,social:25,governance:90},carbon_intensity_kg_per_t:4000,price_at_stage:5500},
      ]},
      {stage:'Manufacturing',description:'Battery cell production',countries:[
        {iso2:'CN',name:'China',share_pct:77,capacity_gwh:900,companies:['CATL','BYD','EVE Energy'],esg_risk:{env:55,social:45,governance:50},carbon_intensity_kg_per_t:3500,price_at_stage:9500,value_add_pct:40},
        {iso2:'KR',name:'South Korea',share_pct:8,companies:['Samsung SDI','LG Energy','SK On'],esg_risk:{env:40,social:30,governance:80},carbon_intensity_kg_per_t:3000,price_at_stage:10500},
        {iso2:'JP',name:'Japan',share_pct:5,companies:['Panasonic'],esg_risk:{env:35,social:25,governance:85},carbon_intensity_kg_per_t:2800,price_at_stage:11000},
        {iso2:'US',name:'USA',share_pct:5,companies:['Tesla Gigafactory','Panasonic'],esg_risk:{env:38,social:28,governance:88},carbon_intensity_kg_per_t:2500,price_at_stage:11500},
        {iso2:'DE',name:'Germany',share_pct:3,companies:['CATL Erfurt','Samsung SDI Budapest'],esg_risk:{env:30,social:22,governance:90},carbon_intensity_kg_per_t:2200,price_at_stage:12000},
      ]},
      {stage:'End Use',applications:[
        {use:'EV Batteries',share_pct:74,growth_rate:25,companies:['Tesla','BYD','VW','Hyundai']},
        {use:'Consumer Electronics',share_pct:14,growth_rate:3},
        {use:'Energy Storage (grid)',share_pct:8,growth_rate:35},
        {use:'Industrial (ceramics, glass)',share_pct:4,growth_rate:1},
      ]},
      {stage:'End of Life',recycling_rate_pct:5,recycling_capacity_kt:6.5,recycling_leaders:['Redwood Materials (US)','Li-Cycle (CA)','Umicore (BE)','BRUNP (CN)'],circular_economy_potential:'High \u2014 battery recycling could supply 10% of lithium demand by 2030',recycling_carbon_saving_pct:70},
    ],
  },
  COBALT:{
    name:'Cobalt',total_production_kt:190,reserves_kt:7600,reserves_years:40,unit:'USD/t',price:28000,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'CD',name:'DR Congo',share_pct:73,production_kt:139,type:'Artisanal & industrial mining',companies:['Glencore','CMOC Group','Gecamines'],regions:['Katanga Province (Kolwezi, Likasi)'],source_type:'Mining (copper byproduct)',esg_risk:{env:80,social:92,governance:30},water_intensity:'High',carbon_intensity_kg_per_t:22000,child_labor_risk:'Critical \u2014 40K children in ASM',price_at_stage:8000,conflict_mineral:true},
        {iso2:'AU',name:'Australia',share_pct:3,production_kt:5.7,type:'Nickel byproduct',companies:['BHP Nickel West'],esg_risk:{env:45,social:30,governance:85},carbon_intensity_kg_per_t:12000,price_at_stage:12000},
        {iso2:'PH',name:'Philippines',share_pct:4,production_kt:7.6,type:'Nickel laterite byproduct',esg_risk:{env:70,social:55,governance:50},carbon_intensity_kg_per_t:16000,price_at_stage:9000},
        {iso2:'RU',name:'Russia',share_pct:4,production_kt:7.6,companies:['Nornickel'],esg_risk:{env:65,social:50,governance:35},carbon_intensity_kg_per_t:14000,price_at_stage:10000,sanctions_risk:'High'},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:72,capacity_kt:140,type:'Cobalt sulfate/oxide',companies:['Huayou Cobalt','GEM Co','Jinchuan Group'],esg_risk:{env:58,social:42,governance:45},carbon_intensity_kg_per_t:6000,price_at_stage:18000,value_add_pct:55},
        {iso2:'FI',name:'Finland',share_pct:8,capacity_kt:15,companies:['Umicore','Freeport Cobalt'],esg_risk:{env:30,social:20,governance:92},carbon_intensity_kg_per_t:3500,price_at_stage:22000},
        {iso2:'BE',name:'Belgium',share_pct:5,capacity_kt:9.5,companies:['Umicore'],esg_risk:{env:28,social:22,governance:90},carbon_intensity_kg_per_t:3200,price_at_stage:23000},
      ]},
      {stage:'Manufacturing',description:'Cathode material & battery cells',countries:[
        {iso2:'CN',name:'China',share_pct:75,companies:['CATL','BYD'],esg_risk:{env:52,social:40,governance:48},carbon_intensity_kg_per_t:3000,price_at_stage:25000},
        {iso2:'KR',name:'South Korea',share_pct:10,companies:['Samsung SDI','LG Chem'],esg_risk:{env:38,social:28,governance:82},carbon_intensity_kg_per_t:2500,price_at_stage:26500},
        {iso2:'JP',name:'Japan',share_pct:6,companies:['Panasonic','Sumitomo'],esg_risk:{env:35,social:25,governance:85},carbon_intensity_kg_per_t:2400,price_at_stage:27000},
      ]},
      {stage:'End Use',applications:[
        {use:'EV Batteries (NMC)',share_pct:40,growth_rate:20},
        {use:'Consumer Electronics',share_pct:30,growth_rate:2},
        {use:'Superalloys (aerospace)',share_pct:15,growth_rate:5},
        {use:'Industrial catalysts',share_pct:10,growth_rate:3},
        {use:'Other',share_pct:5,growth_rate:1},
      ]},
      {stage:'End of Life',recycling_rate_pct:12,recycling_capacity_kt:23,recycling_leaders:['Umicore (BE)','Redwood Materials (US)','BRUNP (CN)'],circular_economy_potential:'Moderate \u2014 cobalt recovery well-established but volume limited',recycling_carbon_saving_pct:65},
    ],
  },
  PALM_OIL:{
    name:'Palm Oil',total_production_kt:77000,reserves_kt:0,reserves_years:0,unit:'USD/t',price:850,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'ID',name:'Indonesia',share_pct:59,production_kt:45430,type:'Plantation farming',companies:['Sinar Mas (GAR)','Wilmar','Musim Mas','First Resources'],regions:['Sumatra (Riau, North Sumatra)','Kalimantan'],source_type:'Smallholder (40%) + Industrial plantation',esg_risk:{env:90,social:72,governance:40},water_intensity:'High',carbon_intensity_kg_per_t:3500,deforestation_ha_yr:450000,peatland_fire_risk:'Critical',biodiversity_impact:'Orangutan, tiger, elephant habitat loss',price_at_stage:320},
        {iso2:'MY',name:'Malaysia',share_pct:25,production_kt:19250,type:'Plantation farming',companies:['IOI Corp','KL Kepong','Sime Darby'],regions:['Sabah, Sarawak, Peninsular'],source_type:'Estate (70%) + Smallholder',esg_risk:{env:82,social:65,governance:55},carbon_intensity_kg_per_t:3200,deforestation_ha_yr:230000,labor_risk:'Forced labor allegations (migrant workers)',price_at_stage:350},
        {iso2:'TH',name:'Thailand',share_pct:4,production_kt:3080,esg_risk:{env:60,social:50,governance:60},price_at_stage:370},
        {iso2:'CO',name:'Colombia',share_pct:2,production_kt:1540,esg_risk:{env:55,social:60,governance:50},price_at_stage:400},
      ]},
      {stage:'Processing',countries:[
        {iso2:'ID',name:'Indonesia',share_pct:55,type:'Crude palm oil refining',companies:['Wilmar','Musim Mas'],esg_risk:{env:65,social:50,governance:45},carbon_intensity_kg_per_t:800,price_at_stage:580,value_add_pct:45},
        {iso2:'MY',name:'Malaysia',share_pct:30,type:'Refining, fractionation',companies:['IOI Loders Croklaan','Sime Darby'],esg_risk:{env:58,social:48,governance:60},carbon_intensity_kg_per_t:750,price_at_stage:600},
        {iso2:'NL',name:'Netherlands',share_pct:5,type:'Specialty fats, oleochemicals',companies:['Cargill','AAK'],esg_risk:{env:30,social:20,governance:90},carbon_intensity_kg_per_t:400,price_at_stage:720},
      ]},
      {stage:'Manufacturing',description:'Consumer products',countries:[
        {iso2:'Global',name:'Global',share_pct:100,companies:['Unilever','Nestle','P&G','Mars','PepsiCo','Mondelez'],esg_risk:{env:45,social:35,governance:75},carbon_intensity_kg_per_t:300,price_at_stage:850},
      ]},
      {stage:'End Use',applications:[
        {use:'Food products (cooking oil, margarine)',share_pct:68,growth_rate:3},
        {use:'Personal care & cosmetics',share_pct:12,growth_rate:4},
        {use:'Biofuel (biodiesel)',share_pct:12,growth_rate:8},
        {use:'Oleochemicals (detergents)',share_pct:8,growth_rate:2},
      ]},
      {stage:'End of Life',recycling_rate_pct:0,recycling_leaders:['N/A \u2014 consumed product'],circular_economy_potential:'Low for product; waste biomass (EFB) for energy',recycling_carbon_saving_pct:15},
    ],
  },
  STEEL:{
    name:'Steel',total_production_kt:1900000,reserves_kt:0,reserves_years:0,unit:'USD/t',price:680,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'AU',name:'Australia',share_pct:38,production_kt:900000,type:'Iron ore mining',companies:['BHP','Rio Tinto','Fortescue'],regions:['Pilbara, Western Australia'],source_type:'Open pit mining',esg_risk:{env:60,social:45,governance:85},water_intensity:'Moderate',carbon_intensity_kg_per_t:50,price_at_stage:110,indigenous_impact:'Juukan Gorge incident'},
        {iso2:'BR',name:'Brazil',share_pct:17,production_kt:400000,companies:['Vale'],regions:['Minas Gerais, Para'],esg_risk:{env:78,social:60,governance:50},carbon_intensity_kg_per_t:55,dam_risk:'Brumadinho disaster legacy',price_at_stage:105},
        {iso2:'CN',name:'China',share_pct:14,production_kt:330000,esg_risk:{env:70,social:45,governance:42},carbon_intensity_kg_per_t:65,price_at_stage:120},
        {iso2:'IN',name:'India',share_pct:9,production_kt:210000,companies:['NMDC','Tata Steel Mining'],esg_risk:{env:65,social:55,governance:55},carbon_intensity_kg_per_t:60,price_at_stage:100},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:54,capacity_kt:1030000,type:'Blast furnace (BF-BOF)',companies:['Baowu Steel','HBIS','Shagang'],esg_risk:{env:85,social:50,governance:45},carbon_intensity_kg_per_t:1800,price_at_stage:480,value_add_pct:70,eu_cbam_exposure:'High'},
        {iso2:'IN',name:'India',share_pct:7,capacity_kt:133000,companies:['Tata Steel','JSW Steel','SAIL'],esg_risk:{env:75,social:55,governance:60},carbon_intensity_kg_per_t:2100,price_at_stage:450},
        {iso2:'JP',name:'Japan',share_pct:5,capacity_kt:95000,companies:['Nippon Steel'],esg_risk:{env:45,social:25,governance:88},carbon_intensity_kg_per_t:1600,price_at_stage:550},
        {iso2:'US',name:'USA',share_pct:4,capacity_kt:76000,companies:['Nucor','US Steel'],esg_risk:{env:50,social:30,governance:85},carbon_intensity_kg_per_t:900,price_at_stage:600,note:'EAF steelmaking lower carbon'},
      ]},
      {stage:'Manufacturing',description:'Finished steel products',countries:[
        {iso2:'CN',name:'China',share_pct:55,companies:['CITIC Steel','Shougang'],esg_risk:{env:60,social:45,governance:48},carbon_intensity_kg_per_t:200,price_at_stage:650},
        {iso2:'EU',name:'EU',share_pct:12,companies:['ArcelorMittal','ThyssenKrupp','SSAB'],esg_risk:{env:35,social:25,governance:88},carbon_intensity_kg_per_t:150,price_at_stage:720,green_steel:'SSAB HYBRIT H2-steel'},
        {iso2:'US',name:'USA',share_pct:8,companies:['Nucor','Cleveland-Cliffs'],esg_risk:{env:40,social:28,governance:85},carbon_intensity_kg_per_t:120,price_at_stage:700},
      ]},
      {stage:'End Use',applications:[
        {use:'Construction (rebar, structural)',share_pct:52,growth_rate:2},
        {use:'Automotive',share_pct:12,growth_rate:1},
        {use:'Machinery & equipment',share_pct:15,growth_rate:3},
        {use:'Infrastructure (rail, bridges)',share_pct:12,growth_rate:4},
        {use:'Packaging (tin plate)',share_pct:4,growth_rate:1},
        {use:'Other',share_pct:5,growth_rate:2},
      ]},
      {stage:'End of Life',recycling_rate_pct:85,recycling_capacity_kt:600000,recycling_leaders:['Nucor (US)','ArcelorMittal','Tata Steel (UK)'],circular_economy_potential:'Very High \u2014 steel is the most recycled material globally',recycling_carbon_saving_pct:75},
    ],
  },
  COTTON:{
    name:'Cotton',total_production_kt:25000,reserves_kt:0,reserves_years:0,unit:'USD/lb',price:0.72,
    supply_chain:[
      {stage:'Extraction',countries:[
        {iso2:'IN',name:'India',share_pct:24,production_kt:6000,type:'Rainfed & irrigated farming',companies:['Smallholders (>10M farmers)'],regions:['Gujarat, Maharashtra, Telangana'],source_type:'Smallholder farming',esg_risk:{env:78,social:70,governance:45},water_intensity:'Very High (10,000L/kg)',carbon_intensity_kg_per_t:5000,pesticide_use:'High \u2014 16% of global insecticide use',farmer_suicide_risk:'Documented (debt crisis)',price_at_stage:0.55},
        {iso2:'CN',name:'China',share_pct:23,production_kt:5750,type:'Irrigated',companies:['XPCC (Xinjiang Production Corps)'],regions:['Xinjiang (85%)'],source_type:'State + private farms',esg_risk:{env:72,social:95,governance:30},water_intensity:'Very High',carbon_intensity_kg_per_t:4500,forced_labor_risk:'Critical \u2014 Uyghur forced labor (US UFLPA ban)',price_at_stage:0.60},
        {iso2:'US',name:'USA',share_pct:14,production_kt:3500,type:'Mechanized farming',companies:['Farm cooperatives'],regions:['Texas, Mississippi Delta, California'],source_type:'Large-scale mechanized',esg_risk:{env:55,social:30,governance:85},water_intensity:'High (irrigated)',carbon_intensity_kg_per_t:3800,price_at_stage:0.72},
        {iso2:'BR',name:'Brazil',share_pct:12,production_kt:3000,companies:['SLC Agricola'],regions:['Bahia, Mato Grosso'],esg_risk:{env:65,social:40,governance:60},carbon_intensity_kg_per_t:3500,deforestation_link:'Cerrado biome',price_at_stage:0.65},
        {iso2:'PK',name:'Pakistan',share_pct:5,production_kt:1250,esg_risk:{env:75,social:65,governance:40},water_intensity:'Very High (Indus Basin)',price_at_stage:0.50},
      ]},
      {stage:'Processing',countries:[
        {iso2:'CN',name:'China',share_pct:40,type:'Ginning, spinning, weaving',companies:['Various (Shandong, Zhejiang)'],esg_risk:{env:65,social:55,governance:42},carbon_intensity_kg_per_t:2500,price_at_stage:1.80,value_add_pct:60},
        {iso2:'BD',name:'Bangladesh',share_pct:15,type:'Garment manufacturing',companies:['Thousands of factories'],esg_risk:{env:72,social:80,governance:35},carbon_intensity_kg_per_t:3000,safety_risk:'Rana Plaza legacy \u2014 structural safety',price_at_stage:2.50},
        {iso2:'IN',name:'India',share_pct:15,type:'Spinning, weaving, dyeing',companies:['Arvind Ltd','Welspun India'],esg_risk:{env:68,social:60,governance:50},carbon_intensity_kg_per_t:2800,price_at_stage:2.20},
        {iso2:'VN',name:'Vietnam',share_pct:10,type:'Garment assembly',companies:['Various'],esg_risk:{env:55,social:50,governance:55},carbon_intensity_kg_per_t:2200,price_at_stage:3.00},
      ]},
      {stage:'Manufacturing',description:'Finished textile & apparel',countries:[
        {iso2:'CN',name:'China',share_pct:35,companies:['Shenzhou International','Crystal Group'],esg_risk:{env:55,social:48,governance:50},carbon_intensity_kg_per_t:1500,price_at_stage:8.00},
        {iso2:'BD',name:'Bangladesh',share_pct:15,companies:['RMG sector'],esg_risk:{env:68,social:72,governance:38},carbon_intensity_kg_per_t:2000,price_at_stage:6.00},
        {iso2:'VN',name:'Vietnam',share_pct:12,esg_risk:{env:50,social:45,governance:55},price_at_stage:7.50},
        {iso2:'TR',name:'Turkey',share_pct:6,esg_risk:{env:48,social:42,governance:58},price_at_stage:9.00},
      ]},
      {stage:'End Use',applications:[
        {use:'Apparel & fashion',share_pct:65,growth_rate:3},
        {use:'Home textiles (bedding, towels)',share_pct:20,growth_rate:2},
        {use:'Industrial textiles',share_pct:10,growth_rate:4},
        {use:'Medical textiles',share_pct:5,growth_rate:6},
      ]},
      {stage:'End of Life',recycling_rate_pct:12,recycling_capacity_kt:3000,recycling_leaders:['Renewcell (SE)','Worn Again (UK)','Circ (US)'],circular_economy_potential:'Growing \u2014 textile-to-textile recycling emerging, <1% of cotton recycled back to fiber',recycling_carbon_saving_pct:50},
    ],
  },
};

const COMMODITY_LIST=Object.entries(SUPPLY_CHAINS).map(([id,c])=>({id,name:c.name,price:c.price,unit:c.unit,stages:c.supply_chain.length,countries:c.supply_chain.reduce((s,st)=>(st.countries?s+st.countries.length:s),0)}));

const SECTOR_COMMODITY_MAP={
  Energy:['STEEL'],Materials:['STEEL','LITHIUM','COBALT','COPPER'],
  'Consumer Staples':['PALM_OIL','COTTON'],'Consumer Discretionary':['LITHIUM','COBALT','COTTON'],
  'Information Technology':['LITHIUM','COBALT'],Industrials:['STEEL'],
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
  const cs={green:{bg:'#dcfce7',fg:'#166534'},red:{bg:'#fee2e2',fg:'#991b1b'},amber:{bg:'#fef3c7',fg:'#92400e'},blue:{bg:'#dbeafe',fg:'#1e40af'},purple:{bg:'#ede9fe',fg:'#5b21b6'},gray:{bg:'#f3f4f6',fg:'#374151'}};
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

  const doSort=f=>setSort(p=>({field:f,asc:p.field===f?!p.asc:false}));

  /* KPIs */
  const totalCountries=useMemo(()=>{
    const s=new Set();
    stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>s.add(c.iso2||c.name))});
    return s.size;
  },[stages]);
  const totalCompanies=useMemo(()=>{
    let n=0;
    stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.companies)n+=c.companies.length})});
    return n;
  },[stages]);
  const avgESG=(dim)=>{
    let sum=0,count=0;
    stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.esg_risk&&c.esg_risk[dim]!=null){sum+=c.esg_risk[dim];count++}})});
    return count?Math.round(sum/count):0;
  };
  const recyclingRate=stages.find(s=>s.stage==='End of Life')?.recycling_rate_pct||0;
  const avgCarbon=useMemo(()=>{
    let sum=0,count=0;
    stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.carbon_intensity_kg_per_t){sum+=c.carbon_intensity_kg_per_t;count++}})});
    return count?Math.round(sum/count):0;
  },[stages]);
  const childLaborStages=useMemo(()=>{
    let n=0;
    stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.child_labor_risk||c.forced_labor_risk)n++})});
    return n;
  },[stages]);

  /* concentration risk */
  const concentrationData=useMemo(()=>{
    return stages.filter(s=>s.countries).map((st,i)=>{
      const sorted=[...(st.countries||[])].sort((a,b)=>(b.share_pct||0)-(a.share_pct||0));
      const top=sorted[0];
      return{stage:st.stage,topCountry:top?.name||'N/A',topShare:top?.share_pct||0,hhi:sorted.reduce((s,c)=>s+Math.pow(c.share_pct||0,2),0)};
    });
  },[stages]);

  /* ESG heatmap data */
  const esgHeatmap=useMemo(()=>{
    return stages.filter(s=>s.countries).map(st=>{
      const envAvg=st.countries.reduce((s,c)=>s+(c.esg_risk?.env||0),0)/Math.max(1,st.countries.length);
      const socAvg=st.countries.reduce((s,c)=>s+(c.esg_risk?.social||0),0)/Math.max(1,st.countries.length);
      const govAvg=st.countries.reduce((s,c)=>s+(c.esg_risk?.governance||0),0)/Math.max(1,st.countries.length);
      return{stage:st.stage,Environmental:Math.round(envAvg),Social:Math.round(socAvg),Governance:Math.round(govAvg)};
    });
  },[stages]);

  /* carbon waterfall */
  const carbonWaterfall=useMemo(()=>{
    let cumulative=0;
    return stages.filter(s=>s.countries).map(st=>{
      const avg=st.countries.reduce((s,c)=>s+(c.carbon_intensity_kg_per_t||0),0)/Math.max(1,st.countries.length);
      cumulative+=avg;
      return{stage:st.stage,stageCarbon:Math.round(avg),cumulative:Math.round(cumulative)};
    });
  },[stages]);

  /* water footprint */
  const waterData=useMemo(()=>{
    return stages.filter(s=>s.countries).map(st=>{
      const intensities={'Very High':90,'Very High (arid region)':95,'High':70,'High (irrigated)':65,'Moderate':40,'Low':20};
      const avg=st.countries.reduce((s,c)=>{
        const wi=c.water_intensity;
        return s+(intensities[wi]||30);
      },0)/Math.max(1,st.countries.length);
      return{stage:st.stage,intensity:Math.round(avg)};
    });
  },[stages]);

  /* portfolio exposure */
  const portfolioRisk=useMemo(()=>{
    return portfolio.slice(0,15).map((c,i)=>{
      const sectorComms=SECTOR_COMMODITY_MAP[c.sector]||[];
      const exposed=sectorComms.includes(selectedComm);
      return{company:c.company_name,sector:c.sector,weight:c.weight,exposed,riskScore:exposed?Math.round(40+seed(i*53)*55):Math.round(seed(i*59)*30),exposureType:exposed?'Direct':'Indirect'};
    }).sort((a,b)=>b.riskScore-a.riskScore);
  },[portfolio,selectedComm]);

  /* sorted countries for current stage */
  const sortedCountries=useMemo(()=>{
    if(!currentStage?.countries)return[];
    return[...currentStage.countries].sort((a,b)=>{
      const av=a[sort.field],bv=b[sort.field];
      if(av==null)return 1;if(bv==null)return -1;
      return sort.asc?(av>bv?1:-1):(av<bv?1:-1);
    });
  },[currentStage,sort]);

  /* compare data */
  const compareChain=SUPPLY_CHAINS[compareComm];

  /* exports */
  const exportCSV=()=>{
    const rows=['Commodity,Stage,Country,Share%,Companies,ESG_Env,ESG_Social,ESG_Gov,Carbon_kg_per_t'];
    Object.entries(SUPPLY_CHAINS).forEach(([id,ch])=>{
      ch.supply_chain.forEach(st=>{
        if(st.countries)st.countries.forEach(c=>{
          rows.push(`${ch.name},${st.stage},"${c.name}",${c.share_pct||''},"${(c.companies||[]).join('; ')}",${c.esg_risk?.env||''},${c.esg_risk?.social||''},${c.esg_risk?.governance||''},${c.carbon_intensity_kg_per_t||''}`);
        });
      });
    });
    const blob=new Blob([rows.join('\n')],{type:'text/csv'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='supply_chain_map.csv';a.click();
  };
  const exportJSON=()=>{
    const blob=new Blob([JSON.stringify({chains:SUPPLY_CHAINS,timestamp:new Date().toISOString()},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='esg_assessment.json';a.click();
  };

  /* ================================================================= RENDER */
  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font}}>
      <div style={{maxWidth:1440,margin:'0 auto',padding:'24px 32px'}}>

        {/* HEADER */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,color:T.navy,margin:0}}>Global Commodity Inventory & Supply Chain</h1>
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <Badge label="5 Commodities" color="blue"/>
              <Badge label="5 Stages" color="purple"/>
              <Badge label="Country\u2192Source" color="green"/>
              <Badge label="ESG at Every Stage" color="amber"/>
              <Badge label="EP-Y2" color="gray"/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={exportCSV} small>CSV Export</Btn>
            <Btn onClick={exportJSON} small>JSON Report</Btn>
            <Btn onClick={()=>window.print()} small>Print</Btn>
          </div>
        </div>

        {/* COMMODITY SELECTOR */}
        <Section title="Commodity Selector">
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {COMMODITY_LIST.map(c=>(
              <button key={c.id} onClick={()=>{setSelectedComm(c.id);setSelectedStage(0)}} style={{padding:'10px 20px',borderRadius:10,border:`2px solid ${selectedComm===c.id?T.navy:T.border}`,background:selectedComm===c.id?T.navy:T.surface,color:selectedComm===c.id?'#fff':T.text,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:T.font}}>
                {c.name} <span style={{fontSize:11,opacity:0.7}}>({c.stages} stages, {c.countries} countries)</span>
              </button>
            ))}
          </div>
        </Section>

        {/* 10 KPI CARDS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:28}}>
          <KPI label="Supply Chain Stages" value={stages.length} sub={stageNames.join(' \u2192 ')}/>
          <KPI label="Countries Involved" value={totalCountries} sub="Across all stages"/>
          <KPI label="Companies Mapped" value={totalCompanies} sub="Extraction to recycling"/>
          <KPI label="Extraction Risk" value={avgESG('env')} sub="Avg Environmental" color={avgESG('env')>=60?T.red:T.amber}/>
          <KPI label="Processing Risk" value={avgESG('social')} sub="Avg Social" color={avgESG('social')>=60?T.red:T.amber}/>
          <KPI label="Manufacturing Risk" value={avgESG('governance')} sub="Avg Governance" color={avgESG('governance')<50?T.red:T.sage}/>
          <KPI label="Recycling Rate" value={`${recyclingRate}%`} sub={recyclingRate>=50?'Strong circular':'Needs improvement'} color={recyclingRate>=50?T.green:T.red}/>
          <KPI label="Carbon Intensity" value={`${(avgCarbon/1000).toFixed(1)}t`} sub="Avg kgCO\u2082/t across stages"/>
          <KPI label="Water Intensity" value={waterData[0]?.intensity>=70?'High':'Moderate'} sub="Extraction stage"/>
          <KPI label="Child/Forced Labor" value={childLaborStages} sub="Flagged stage-country pairs" color={childLaborStages>0?T.red:T.green}/>
        </div>

        {/* SUPPLY CHAIN FLOW */}
        <Section title="Supply Chain Flow Visualization" badge={chain?.name}>
          <Card>
            <div style={{display:'flex',gap:4,alignItems:'stretch',overflowX:'auto'}}>
              {stages.map((st,i)=>{
                const isActive=i===selectedStage;
                const countryCt=st.countries?.length||0;
                const companyCt=st.countries?.reduce((s,c)=>s+(c.companies?.length||0),0)||0;
                return(
                  <React.Fragment key={i}>
                    <div onClick={()=>setSelectedStage(i)} style={{flex:1,minWidth:180,padding:16,borderRadius:10,border:`2px solid ${isActive?STAGE_COLORS[i]:T.border}`,background:isActive?STAGE_COLORS[i]+'12':T.surface,cursor:'pointer',transition:'all 0.2s'}}>
                      <div style={{fontSize:11,fontWeight:700,color:STAGE_COLORS[i],textTransform:'uppercase',letterSpacing:0.5}}>{st.stage}</div>
                      {st.description&&<div style={{fontSize:10,color:T.textMut,marginTop:2}}>{st.description}</div>}
                      {st.countries&&<div style={{marginTop:8}}>
                        <div style={{fontSize:11,color:T.textSec}}>{countryCt} countries, {companyCt} companies</div>
                        <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
                          {st.countries.slice(0,3).map(c=><span key={c.iso2||c.name} style={{fontSize:10,padding:'1px 6px',borderRadius:4,background:T.surfaceH,color:T.text}}>{c.iso2||c.name.slice(0,2)} {c.share_pct?`${c.share_pct}%`:''}</span>)}
                          {st.countries.length>3&&<span style={{fontSize:10,color:T.textMut}}>+{st.countries.length-3} more</span>}
                        </div>
                      </div>}
                      {st.applications&&<div style={{marginTop:8,fontSize:11,color:T.textSec}}>{st.applications.length} end uses</div>}
                      {st.recycling_rate_pct!=null&&<div style={{marginTop:8,fontSize:11}}><span style={{fontWeight:700,color:st.recycling_rate_pct>=50?T.green:T.red}}>{st.recycling_rate_pct}%</span> recycling</div>}
                    </div>
                    {i<stages.length-1&&<div style={{display:'flex',alignItems:'center',color:T.textMut,fontSize:18}}>\u2192</div>}
                  </React.Fragment>
                );
              })}
            </div>
          </Card>
        </Section>

        {/* COUNTRY-LEVEL SUPPLY MAP TABLE */}
        {currentStage?.countries&&(
          <Section title={`${currentStage.stage} Stage \u2014 Country Breakdown`} badge={`${currentStage.countries.length} countries`}>
            <Card>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:T.surfaceH}}>
                    <SortTH label="Country" field="name" sort={sort} onSort={doSort}/>
                    <SortTH label="Share %" field="share_pct" sort={sort} onSort={doSort} style={{textAlign:'right'}}/>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Type</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Companies</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Env Risk</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Social Risk</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Governance</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>CO\u2082 (kg/t)</th>
                    <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Flags</th>
                  </tr></thead>
                  <tbody>
                    {sortedCountries.map((c,i)=>(
                      <tr key={i}>
                        <TD style={{fontWeight:600}}>{c.iso2&&<span style={{marginRight:4,fontSize:10,padding:'1px 4px',background:T.surfaceH,borderRadius:3}}>{c.iso2}</span>}{c.name}</TD>
                        <TD style={{textAlign:'right',fontWeight:700}}>{c.share_pct!=null?`${c.share_pct}%`:'\u2014'}</TD>
                        <TD style={{fontSize:12}}>{c.type||c.source_type||'\u2014'}</TD>
                        <TD style={{fontSize:11}}>{c.companies?c.companies.slice(0,3).join(', ')+(c.companies.length>3?` +${c.companies.length-3}`:''):'\u2014'}</TD>
                        <TD>{c.esg_risk?<RiskBar value={c.esg_risk.env}/>:'\u2014'}</TD>
                        <TD>{c.esg_risk?<RiskBar value={c.esg_risk.social}/>:'\u2014'}</TD>
                        <TD>{c.esg_risk?<RiskBar value={c.esg_risk.governance} />:'\u2014'}</TD>
                        <TD style={{fontFamily:'monospace',fontSize:12}}>{c.carbon_intensity_kg_per_t?`${(c.carbon_intensity_kg_per_t/1000).toFixed(1)}K`:'\u2014'}</TD>
                        <TD>
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

        {/* 3-DIMENSIONAL STAGE ASSESSMENT */}
        {currentStage?.countries&&(
          <Section title={`3-Dimensional Assessment: ${currentStage.stage}`} badge="Finance | ESG | Climate">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
              {/* Financial */}
              <Card style={{borderTop:`3px solid ${DIM_COLORS.finance}`}}>
                <div style={{fontSize:14,fontWeight:700,color:DIM_COLORS.finance,marginBottom:12}}>Financial Dimension</div>
                {currentStage.countries.slice(0,4).map((c,i)=>(
                  <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:12,fontWeight:600}}>{c.name}</div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginTop:4}}>
                      <span>Price at stage: {c.price_at_stage?`$${c.price_at_stage}`:'\u2014'}</span>
                      <span>Value-add: {c.value_add_pct?`${c.value_add_pct}%`:'\u2014'}</span>
                    </div>
                    <div style={{fontSize:11,color:T.textMut,marginTop:2}}>Share: {c.share_pct||0}% | Type: {c.type||c.source_type||'N/A'}</div>
                  </div>
                ))}
              </Card>
              {/* ESG */}
              <Card style={{borderTop:`3px solid ${DIM_COLORS.esg}`}}>
                <div style={{fontSize:14,fontWeight:700,color:DIM_COLORS.esg,marginBottom:12}}>ESG Dimension</div>
                {currentStage.countries.slice(0,4).map((c,i)=>(
                  <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:12,fontWeight:600}}>{c.name}</div>
                    {c.esg_risk?(
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginTop:6}}>
                        <div><span style={{fontSize:10,color:T.textMut}}>Env</span><RiskBar value={c.esg_risk.env}/></div>
                        <div><span style={{fontSize:10,color:T.textMut}}>Social</span><RiskBar value={c.esg_risk.social}/></div>
                        <div><span style={{fontSize:10,color:T.textMut}}>Gov</span><RiskBar value={c.esg_risk.governance}/></div>
                      </div>
                    ):<div style={{fontSize:11,color:T.textMut,marginTop:4}}>No ESG data</div>}
                    {(c.child_labor_risk||c.forced_labor_risk||c.indigenous_impact)&&(
                      <div style={{marginTop:4,display:'flex',gap:4,flexWrap:'wrap'}}>
                        {c.child_labor_risk&&<Badge label={`Child Labor: ${c.child_labor_risk}`} color="red"/>}
                        {c.forced_labor_risk&&<Badge label={`Forced Labor: ${c.forced_labor_risk}`} color="red"/>}
                        {c.indigenous_impact&&<Badge label={`Indigenous: ${c.indigenous_impact}`} color="amber"/>}
                      </div>
                    )}
                  </div>
                ))}
              </Card>
              {/* Climate/Nature */}
              <Card style={{borderTop:`3px solid ${DIM_COLORS.climate}`}}>
                <div style={{fontSize:14,fontWeight:700,color:DIM_COLORS.climate,marginBottom:12}}>Climate / Nature Dimension</div>
                {currentStage.countries.slice(0,4).map((c,i)=>(
                  <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:12,fontWeight:600}}>{c.name}</div>
                    <div style={{fontSize:11,marginTop:4}}>
                      {c.carbon_intensity_kg_per_t&&<div style={{color:T.textSec}}>Carbon: <span style={{fontWeight:600,color:c.carbon_intensity_kg_per_t>10000?T.red:T.amber}}>{(c.carbon_intensity_kg_per_t/1000).toFixed(1)}t CO\u2082/t</span></div>}
                      {c.water_intensity&&<div style={{color:T.textSec}}>Water: <span style={{fontWeight:600}}>{c.water_intensity}</span></div>}
                      {c.deforestation_ha_yr&&<div style={{color:T.red}}>Deforestation: {(c.deforestation_ha_yr/1000).toFixed(0)}K ha/yr</div>}
                      {c.biodiversity_impact&&<div style={{color:T.amber,fontSize:10}}>{c.biodiversity_impact}</div>}
                      {c.peatland_fire_risk&&<div style={{color:T.red,fontSize:10}}>Peatland fire: {c.peatland_fire_risk}</div>}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </Section>
        )}

        {/* CONCENTRATION RISK */}
        <Section title="Supply Concentration Risk by Stage" badge="HHI & Top Country">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={concentrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="stage" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}} domain={[0,100]}/>
                <Tooltip formatter={v=>[`${v}%`,'Top Country Share']}/>
                <Legend/>
                <Bar dataKey="topShare" name="Top Country Share %" radius={[4,4,0,0]}>
                  {concentrationData.map((_,i)=><Cell key={i} fill={STAGE_COLORS[i%STAGE_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:'grid',gridTemplateColumns:`repeat(${concentrationData.length},1fr)`,gap:8,marginTop:12}}>
              {concentrationData.map((d,i)=>(
                <div key={i} style={{textAlign:'center',padding:10,background:T.surfaceH,borderRadius:8}}>
                  <div style={{fontSize:11,color:T.textMut}}>{d.stage}</div>
                  <div style={{fontSize:16,fontWeight:700,color:d.topShare>=60?T.red:d.topShare>=40?T.amber:T.green}}>{d.topCountry}</div>
                  <div style={{fontSize:12,fontWeight:600}}>{d.topShare}%</div>
                  <div style={{fontSize:10,color:T.textMut}}>HHI: {Math.round(d.hhi)}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ESG RISK HEATMAP */}
        <Section title="ESG Risk Heatmap: Stages x Dimensions" badge="Color-Coded">
          <Card>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={esgHeatmap}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="stage" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}} domain={[0,100]}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="Environmental" fill="#dc2626" radius={[4,4,0,0]}/>
                <Bar dataKey="Social" fill="#d97706" radius={[4,4,0,0]}/>
                <Bar dataKey="Governance" fill="#0284c7" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{overflowX:'auto',marginTop:12}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  <th style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>Stage</th>
                  <th style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Environmental</th>
                  <th style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Social</th>
                  <th style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Governance</th>
                </tr></thead>
                <tbody>
                  {esgHeatmap.map((row,i)=>(
                    <tr key={i}>
                      <TD style={{fontWeight:600}}>{row.stage}</TD>
                      {['Environmental','Social','Governance'].map(dim=>{
                        const v=row[dim];
                        const bg=v>=70?'#fee2e2':v>=50?'#fef3c7':'#dcfce7';
                        const fg=v>=70?T.red:v>=50?T.amber:T.green;
                        return <TD key={dim} style={{textAlign:'center'}}><span style={{padding:'4px 12px',borderRadius:8,background:bg,color:fg,fontWeight:700,fontSize:13}}>{v}</span></TD>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* CARBON INTENSITY WATERFALL */}
        <Section title="Carbon Intensity Waterfall" badge="Cumulative kgCO\u2082/t">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={carbonWaterfall}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="stage" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}} label={{value:'kgCO\u2082/t',angle:-90,position:'insideLeft',style:{fontSize:10}}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="stageCarbon" name="Stage Carbon" fill={T.amber} radius={[4,4,0,0]}/>
                <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke={T.red} strokeWidth={2} dot={{r:4}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* WATER FOOTPRINT */}
        <Section title="Water Footprint by Stage" badge="Intensity Index">
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

        {/* CHILD LABOR & HUMAN RIGHTS */}
        <Section title="Child Labor & Human Rights Risk Map" badge="Flagged Stages">
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Stage','Country','Risk Type','Severity','Detail'].map(h=><th key={h} style={{padding:'10px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {Object.entries(SUPPLY_CHAINS).flatMap(([id,ch])=>
                  ch.supply_chain.flatMap(st=>(st.countries||[]).filter(c=>c.child_labor_risk||c.forced_labor_risk||c.labor_risk||c.conflict_mineral).map((c,i)=>({commodity:ch.name,stage:st.stage,country:c.name,childLabor:c.child_labor_risk,forcedLabor:c.forced_labor_risk,laborRisk:c.labor_risk,conflict:c.conflict_mineral})))
                ).map((r,i)=>(
                  <tr key={i}>
                    <TD style={{fontWeight:600}}>{r.commodity}</TD>
                    <TD>{r.stage}</TD>
                    <TD>{r.country}</TD>
                    <TD>{r.childLabor?'Child Labor':r.forcedLabor?'Forced Labor':r.conflict?'Conflict Mineral':'Labor Risk'}</TD>
                    <TD><Badge label={r.childLabor||r.forcedLabor?'Critical':'High'} color="red"/></TD>
                    <TD style={{fontSize:11}}>{r.childLabor||r.forcedLabor||r.laborRisk||'Conflict mineral flagged'}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* RECYCLING & CIRCULAR ECONOMY */}
        {stages.find(s=>s.stage==='End of Life')&&(
          <Section title="Recycling & Circular Economy" badge={`${chain.name}`}>
            <Card>
              {(()=>{
                const eol=stages.find(s=>s.stage==='End of Life');
                return(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                    <div style={{textAlign:'center',padding:20,background:T.surfaceH,borderRadius:10}}>
                      <div style={{fontSize:11,color:T.textMut}}>Recycling Rate</div>
                      <div style={{fontSize:36,fontWeight:800,color:eol.recycling_rate_pct>=50?T.green:eol.recycling_rate_pct>=20?T.amber:T.red}}>{eol.recycling_rate_pct}%</div>
                      {eol.recycling_capacity_kt&&<div style={{fontSize:12,color:T.textSec}}>Capacity: {eol.recycling_capacity_kt} kt</div>}
                    </div>
                    <div style={{padding:16}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Recycling Leaders</div>
                      {(eol.recycling_leaders||[]).map((l,i)=><div key={i} style={{fontSize:12,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}>{l}</div>)}
                    </div>
                    <div style={{padding:16}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Circular Economy Potential</div>
                      <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>{eol.circular_economy_potential}</div>
                      {eol.recycling_carbon_saving_pct&&<div style={{marginTop:8,fontSize:12}}>Carbon savings: <span style={{fontWeight:700,color:T.green}}>{eol.recycling_carbon_saving_pct}%</span> vs virgin material</div>}
                    </div>
                  </div>
                );
              })()}
            </Card>
          </Section>
        )}

        {/* PORTFOLIO EXPOSURE TO SUPPLY CHAIN RISKS */}
        <Section title="Portfolio Exposure to Supply Chain Risks" badge={`${chain.name}`}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Company','Sector','Weight %','Exposure','Risk Score'].map(h=><th key={h} style={{padding:'10px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Company'||h==='Sector'?'left':'center'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {portfolioRisk.slice(0,12).map((c,i)=>(
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

        {/* COMMODITY COMPARISON SIDE BY SIDE */}
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
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div style={{fontSize:11,color:T.textMut}}>Production: <span style={{fontWeight:600,color:T.text}}>{ch.total_production_kt} kt</span></div>
                  <div style={{fontSize:11,color:T.textMut}}>Price: <span style={{fontWeight:600,color:T.text}}>${ch.price}/{ch.unit?.split('/')[1]||'unit'}</span></div>
                  <div style={{fontSize:11,color:T.textMut}}>Reserves: <span style={{fontWeight:600,color:T.text}}>{ch.reserves_years?`${ch.reserves_years} yrs`:'N/A'}</span></div>
                  <div style={{fontSize:11,color:T.textMut}}>Stages: <span style={{fontWeight:600,color:T.text}}>{ch.supply_chain.length}</span></div>
                </div>
                <div style={{marginTop:12}}>
                  {ch.supply_chain.filter(s=>s.countries).map((st,i)=>{
                    const top=st.countries.sort((a,b)=>(b.share_pct||0)-(a.share_pct||0))[0];
                    return <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                      <span style={{fontWeight:600,color:STAGE_COLORS[i]}}>{st.stage}</span>
                      <span>{top?.name} ({top?.share_pct}%)</span>
                    </div>;
                  })}
                </div>
              </Card>
            ):null)}
          </div>
        </Section>

        {/* DATA INPUT */}
        <Section title="Custom Supply Chain Data" badge="Persist to localStorage">
          <Card>
            <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Override country shares or add custom supply chain data. Changes persist to <code>ra_commodity_supply_chains_v1</code>.</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:8,alignItems:'end'}}>
              <div><div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Commodity</div><select id="cd_comm" style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12}}>{COMMODITY_LIST.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Stage</div><select id="cd_stage" style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12}}>{['Extraction','Processing','Manufacturing','End Use','End of Life'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
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

        {/* END USE APPLICATION BREAKDOWN */}
        {stages.find(s=>s.stage==='End Use')&&(
          <Section title="End Use Application Breakdown" badge={chain.name}>
            <Card>
              {(()=>{
                const euStage=stages.find(s=>s.stage==='End Use');
                return(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                    <div>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={(euStage.applications||[]).map((a,i)=>({name:a.use,value:a.share_pct}))} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine>
                            {(euStage.applications||[]).map((_,i)=><Cell key={i} fill={STAGE_COLORS[i%STAGE_COLORS.length]}/>)}
                          </Pie>
                          <Tooltip/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead><tr style={{background:T.surfaceH}}>
                          {['Application','Share %','Growth Rate','Key Companies'].map(h=><th key={h} style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {(euStage.applications||[]).map((a,i)=>(
                            <tr key={i}>
                              <TD style={{fontWeight:600}}>{a.use}</TD>
                              <TD><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:50,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{width:`${a.share_pct}%`,height:'100%',background:STAGE_COLORS[i%STAGE_COLORS.length],borderRadius:3}}/></div><span style={{fontSize:11,fontWeight:600}}>{a.share_pct}%</span></div></TD>
                              <TD style={{color:a.growth_rate>=20?T.green:a.growth_rate>=5?T.amber:T.textSec,fontWeight:600}}>{a.growth_rate?`+${a.growth_rate}%/yr`:'\u2014'}</TD>
                              <TD style={{fontSize:11}}>{a.companies?a.companies.join(', '):'\u2014'}</TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </Card>
          </Section>
        )}

        {/* SUPPLY CHAIN COST WATERFALL */}
        <Section title="Value Chain Cost Buildup" badge="Price at Each Stage">
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
                      <YAxis tick={{fontSize:10}} label={{value:chain.unit||'$',angle:-90,position:'insideLeft',style:{fontSize:10}}}/>
                      <Tooltip formatter={v=>[`$${v}`,'Avg Price at Stage']}/>
                      <Bar dataKey="avgPrice" name="Avg Price" radius={[4,4,0,0]}>
                        {priceStages.map((_,i)=><Cell key={i} fill={STAGE_COLORS[i%STAGE_COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{display:'grid',gridTemplateColumns:`repeat(${priceStages.length},1fr)`,gap:8,marginTop:12}}>
                    {priceStages.map((p,i)=>{
                      const margin=i>0?Math.round((p.avgPrice-priceStages[i-1].avgPrice)/priceStages[i-1].avgPrice*100):0;
                      return(
                        <div key={i} style={{textAlign:'center',padding:10,background:T.surfaceH,borderRadius:8}}>
                          <div style={{fontSize:10,color:T.textMut}}>{p.stage}</div>
                          <div style={{fontSize:18,fontWeight:700,color:T.navy}}>${p.avgPrice.toLocaleString()}</div>
                          {i>0&&<div style={{fontSize:11,color:T.green}}>+{margin}% value-add</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ):<div style={{padding:20,textAlign:'center',color:T.textMut}}>No price-at-stage data available for {chain.name}</div>;
            })()}
          </Card>
        </Section>

        {/* RADAR CHART: ESG COMPARISON ACROSS COMMODITIES */}
        <Section title="ESG Risk Comparison Across Commodities" badge="Radar">
          <Card>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={Object.entries(SUPPLY_CHAINS).map(([id,ch])=>{
                let envSum=0,socSum=0,govSum=0,cnt=0;
                ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.esg_risk){envSum+=c.esg_risk.env;socSum+=c.esg_risk.social;govSum+=c.esg_risk.governance;cnt++}})});
                return{commodity:ch.name,Environmental:cnt?Math.round(envSum/cnt):0,Social:cnt?Math.round(socSum/cnt):0,Governance:cnt?Math.round(govSum/cnt):0};
              })}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="commodity" tick={{fontSize:11}}/>
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
                <Radar name="Environmental" dataKey="Environmental" stroke="#dc2626" fill="#dc2626" fillOpacity={0.2}/>
                <Radar name="Social" dataKey="Social" stroke="#d97706" fill="#d97706" fillOpacity={0.2}/>
                <Radar name="Governance" dataKey="Governance" stroke="#0284c7" fill="#0284c7" fillOpacity={0.2}/>
                <Legend/>
                <Tooltip/>
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* DEFORESTATION LINKAGE TABLE */}
        <Section title="Deforestation & Biodiversity Linkage" badge="EUDR Focus">
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Stage','Country','Deforestation (ha/yr)','Biodiversity Impact','Peatland Risk','EUDR Status'].map(h=><th key={h} style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
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
                    <TD>{r.peatland?<Badge label={r.peatland} color="red"/>:'\u2014'}</TD>
                    <TD><Badge label={['PALM_OIL','COCOA','COFFEE','SOY','RUBBER','TIMBER','CATTLE'].some(x=>r.commodity.toUpperCase().includes(x.replace('_',' ')))?'EUDR Regulated':'Not Regulated'} color={['PALM_OIL','COCOA','COFFEE','SOY'].some(x=>r.commodity.toUpperCase().includes(x.replace('_',' ')))?'amber':'gray'}/></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* COMMODITY SUMMARY CARDS */}
        <Section title="All Commodities Summary" badge={`${COMMODITY_LIST.length} commodities`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
            {COMMODITY_LIST.map(c=>{
              const ch=SUPPLY_CHAINS[c.id];
              const eolStage=ch.supply_chain.find(s=>s.stage==='End of Life');
              let avgEnv=0,cnt=0;
              ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(x=>{if(x.esg_risk){avgEnv+=x.esg_risk.env;cnt++}})});
              avgEnv=cnt?Math.round(avgEnv/cnt):0;
              return(
                <Card key={c.id} style={{cursor:'pointer',borderTop:`3px solid ${STAGE_COLORS[COMMODITY_LIST.indexOf(c)%STAGE_COLORS.length]}`,transition:'all 0.2s'}} onClick={()=>{setSelectedComm(c.id);setSelectedStage(0);window.scrollTo({top:0,behavior:'smooth'})}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>{ch.name}</div>
                  <div style={{display:'grid',gap:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:T.textMut}}>Production</span><span style={{fontWeight:600}}>{ch.total_production_kt.toLocaleString()} kt</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:T.textMut}}>Stages</span><span style={{fontWeight:600}}>{c.stages}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:T.textMut}}>Countries</span><span style={{fontWeight:600}}>{c.countries}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:T.textMut}}>Avg Env Risk</span><span style={{fontWeight:700,color:avgEnv>=60?T.red:T.amber}}>{avgEnv}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:T.textMut}}>Recycling</span><span style={{fontWeight:600,color:eolStage?.recycling_rate_pct>=50?T.green:T.red}}>{eolStage?.recycling_rate_pct||0}%</span></div>
                    {ch.reserves_years>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:T.textMut}}>Reserves</span><span style={{fontWeight:600}}>{ch.reserves_years} yrs</span></div>}
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>

        {/* METHODOLOGY */}
        <Section title="Methodology & Data Sources" badge="Transparency">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>ESG Risk Scoring</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>
                  Environmental (E), Social (S), and Governance (G) risk scores range 0-100 where higher = greater risk. Scores are derived from country-level indicators, industry benchmarks, and company-specific disclosures. Environmental covers carbon intensity, water use, deforestation, pollution. Social covers labor rights, child labor, community impact, indigenous rights. Governance covers transparency, regulatory compliance, corruption indices.
                </div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Supply Chain Mapping</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>
                  Five lifecycle stages: Extraction, Processing/Refining, Manufacturing, End Use, End of Life. Country shares based on USGS, IEA, FAO, and industry reports. Company identification from annual reports, trade databases, and sustainability disclosures. Production volumes from latest available year data (2023-2024).
                </div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Carbon & Water Intensity</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>
                  Carbon intensity (kgCO2/tonne) based on lifecycle analysis studies, IEA data, and Ecoinvent database. Covers Scope 1 and 2 emissions at each stage. Water intensity qualitative assessment based on Aqueduct Water Risk Atlas and industry studies. Cumulative lifecycle carbon calculated by summing weighted average across stages.
                </div>
              </div>
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

        {/* CERTIFICATION & STANDARDS TRACKER */}
        <Section title="Certification & Responsible Sourcing Standards" badge="By Commodity">
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Standard','Coverage','Adoption Rate','Key Requirements','Verification'].map(h=><th key={h} style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  {commodity:'Lithium',standard:'IRMA (Initiative for Responsible Mining)',coverage:'Global',adoption:'12%',requirements:'Business integrity, community, labour, environment, mining lifecycle',verification:'Third-party audit'},
                  {commodity:'Cobalt',standard:'RMI RMAP (Responsible Minerals Assurance)',coverage:'Global',adoption:'35%',requirements:'Conflict-free sourcing, child labor due diligence, OECD guidance',verification:'Independent audit + traceability'},
                  {commodity:'Palm Oil',standard:'RSPO (Roundtable on Sustainable Palm Oil)',coverage:'Global',adoption:'19%',requirements:'No deforestation, no peat, FPIC for indigenous communities',verification:'RSPO certification audits'},
                  {commodity:'Palm Oil',standard:'NDPE (No Deforestation, No Peat, No Exploitation)',coverage:'Corporate',adoption:'83% of refiners',requirements:'Zero deforestation, peatland protection, labor standards',verification:'Satellite monitoring + grievance'},
                  {commodity:'Cotton',standard:'BCI (Better Cotton Initiative)',coverage:'Global',adoption:'22%',requirements:'Water stewardship, soil health, decent work, crop protection',verification:'Third-party verification'},
                  {commodity:'Steel',standard:'ResponsibleSteel',coverage:'Global',adoption:'8%',requirements:'GHG emissions, water, biodiversity, community, human rights, labor',verification:'Site-level certification'},
                  {commodity:'Steel',standard:'SBTi Steel Sector',coverage:'Global',adoption:'15% of major producers',requirements:'1.5C-aligned emissions reduction targets, scope 1-3',verification:'SBTi validation'},
                  {commodity:'Cobalt',standard:'OECD Due Diligence Guidance',coverage:'OECD+',adoption:'Mandatory (EU)',requirements:'5-step due diligence for conflict minerals, supply chain transparency',verification:'Government reporting'},
                ].map((r,i)=>(
                  <tr key={i}>
                    <TD style={{fontWeight:600}}>{r.commodity}</TD>
                    <TD style={{fontSize:12}}>{r.standard}</TD>
                    <TD style={{fontSize:11}}>{r.coverage}</TD>
                    <TD style={{fontWeight:700,color:parseFloat(r.adoption)>=30?T.green:parseFloat(r.adoption)>=15?T.amber:T.red}}>{r.adoption}</TD>
                    <TD style={{fontSize:10,color:T.textSec,maxWidth:200}}>{r.requirements}</TD>
                    <TD style={{fontSize:11}}><Badge label={r.verification.includes('Third-party')?'Third-Party':r.verification.includes('Satellite')?'Satellite':'Self-Report'} color={r.verification.includes('Third-party')?'green':r.verification.includes('Independent')?'green':'amber'}/></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* ALTERNATIVE SOURCING & SUBSTITUTION */}
        <Section title="Alternative Sourcing & Substitution Potential" badge="Transition Resilience">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
              {[
                {commodity:'Lithium',substitutes:['Sodium-ion (Na-ion) batteries','Solid-state batteries'],timeline:'2026-2030',readiness:45,impact:'Could reduce Li demand 15-20%'},
                {commodity:'Cobalt',substitutes:['LFP batteries (cobalt-free)','High-nickel NMC (low cobalt)'],timeline:'2024-2027',readiness:72,impact:'LFP already 60% of Chinese EV market'},
                {commodity:'Palm Oil',substitutes:['Algae-based oils','Microbial oils','Yeast fermentation'],timeline:'2028-2035',readiness:18,impact:'Currently <0.1% of market; scalability uncertain'},
                {commodity:'Steel',substitutes:['Green hydrogen DRI','Electric arc furnace (scrap)','Carbon capture (CCS)'],timeline:'2025-2035',readiness:35,impact:'SSAB HYBRIT delivering fossil-free steel 2026'},
                {commodity:'Cotton',substitutes:['Recycled cotton','Lyocell (wood pulp)','Hemp fiber','Polyester from PET bottles'],timeline:'2024-2030',readiness:55,impact:'Recycled content targets 25% by 2030 (EU)'},
              ].map((c,i)=>(
                <div key={i} style={{padding:14,background:T.surfaceH,borderRadius:10,borderTop:`3px solid ${STAGE_COLORS[i%STAGE_COLORS.length]}`}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>{c.commodity}</div>
                  <div style={{fontSize:11,color:T.textMut,marginBottom:6}}>Substitutes:</div>
                  {c.substitutes.map((s,j)=><div key={j} style={{fontSize:11,padding:'3px 0',color:T.textSec,borderBottom:`1px solid ${T.border}`}}>{s}</div>)}
                  <div style={{marginTop:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:4}}><span style={{color:T.textMut}}>Readiness</span><span style={{fontWeight:700}}>{c.readiness}%</span></div>
                    <div style={{width:'100%',height:6,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{width:`${c.readiness}%`,height:'100%',background:c.readiness>=60?T.green:c.readiness>=30?T.amber:T.red,borderRadius:3}}/></div>
                  </div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:6}}>Timeline: {c.timeline}</div>
                  <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{c.impact}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* FULL SUPPLY CHAIN STATISTICS TABLE */}
        <Section title="Cross-Commodity Statistics" badge="Comparative">
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','Production (kt)','Reserves (yrs)','#Stages','#Countries','#Companies','Recycling %','Avg Env Risk','Avg Social Risk','Avg Carbon (t/t)'].map(h=><th key={h} style={{padding:8,fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'?'left':'center',whiteSpace:'nowrap'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {Object.entries(SUPPLY_CHAINS).map(([id,ch])=>{
                    const sts=ch.supply_chain;
                    const ctrySet=new Set();let compCt=0,envSum=0,socSum=0,carbSum=0,cnt=0;
                    sts.forEach(st=>{if(st.countries)st.countries.forEach(c=>{ctrySet.add(c.iso2||c.name);if(c.companies)compCt+=c.companies.length;if(c.esg_risk){envSum+=c.esg_risk.env;socSum+=c.esg_risk.social;cnt++}if(c.carbon_intensity_kg_per_t)carbSum+=c.carbon_intensity_kg_per_t})});
                    const eol=sts.find(s=>s.stage==='End of Life');
                    return(
                      <tr key={id} style={{cursor:'pointer',background:selectedComm===id?T.surfaceH:'transparent'}} onClick={()=>{setSelectedComm(id);setSelectedStage(0);window.scrollTo({top:0,behavior:'smooth'})}}>
                        <TD style={{fontWeight:700}}>{ch.name}</TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace'}}>{ch.total_production_kt.toLocaleString()}</TD>
                        <TD style={{textAlign:'center'}}>{ch.reserves_years||'\u2014'}</TD>
                        <TD style={{textAlign:'center'}}>{sts.length}</TD>
                        <TD style={{textAlign:'center'}}>{ctrySet.size}</TD>
                        <TD style={{textAlign:'center'}}>{compCt}</TD>
                        <TD style={{textAlign:'center',fontWeight:700,color:eol?.recycling_rate_pct>=50?T.green:eol?.recycling_rate_pct>=15?T.amber:T.red}}>{eol?.recycling_rate_pct||0}%</TD>
                        <TD style={{textAlign:'center'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,background:cnt&&envSum/cnt>=60?'#fee2e2':'#fef3c7',color:cnt&&envSum/cnt>=60?T.red:T.amber}}>{cnt?Math.round(envSum/cnt):0}</span></TD>
                        <TD style={{textAlign:'center'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,background:cnt&&socSum/cnt>=60?'#fee2e2':'#fef3c7',color:cnt&&socSum/cnt>=60?T.red:T.amber}}>{cnt?Math.round(socSum/cnt):0}</span></TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:11}}>{cnt?(carbSum/cnt/1000).toFixed(1):'\u2014'}</TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* FOOTER */}
        <div style={{textAlign:'center',padding:'20px 0',borderTop:`1px solid ${T.border}`,marginTop:20}}>
          <span style={{fontSize:11,color:T.textMut}}>Global Commodity Inventory & Supply Chain Mapper | EP-Y2 | 5 Commodities Full Depth | 5 Stages | ESG at Every Stage | Sprint Y</span>
        </div>
      </div>
    </div>
  );
}
