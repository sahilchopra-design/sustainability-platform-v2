import React, { useState, useMemo, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { EMISSION_FACTORS, GWP_VALUES, GRID_INTENSITY, SECTOR_BENCHMARKS, getGridIntensity, getSectorBenchmark } from '../../../data/referenceData';

/* ═══════════════════════════════════════════════════════════════════════════════
   GHG Protocol-Aligned Carbon Emission Calculator
   ─────────────────────────────────────────────────────────────────────────────
   Foundation module feeding: PCAF, SBTi, CSRD ESRS E1, SFDR PAI #1-3,
   Portfolio Temperature Score, CBAM, Carbon Budget
   Standards: GHG Protocol Corporate Standard (Rev. 2015), Scope 2 Guidance
   (2015), Corporate Value Chain (Scope 3) Standard (2013)
   ═══════════════════════════════════════════════════════════════════════════════ */

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ─── Shared tab list ─── */
const TABS = [
  { key:'boundary',  label:'Organizational Boundary' },
  { key:'scope1',    label:'Scope 1 \u2014 Direct' },
  { key:'scope2',    label:'Scope 2 \u2014 Energy Indirect' },
  { key:'scope3',    label:'Scope 3 \u2014 Value Chain' },
  { key:'gwp',       label:'GWP & Conversions' },
  { key:'summary',   label:'GHG Inventory Summary' },
  { key:'downstream', label:'Downstream Connections' },
];

/* ─── Reusable micro-components ─── */
const KPICard=({label,value,sub,color,trend})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'16px 20px',minWidth:170,flex:1}}>
    <div style={{fontFamily:T.font,fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>{label}</div>
    <div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:color||T.navy}}>{value}</div>
    {sub&&<div style={{fontFamily:T.font,fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
    {trend!=null&&<div style={{fontFamily:T.mono,fontSize:11,color:trend>=0?T.red:T.green,marginTop:2}}>{trend>=0?'+':''}{trend.toFixed(1)}% YoY</div>}
  </div>
);

const Badge=({label,color})=>(
  <span style={{display:'inline-block',fontFamily:T.mono,fontSize:10,fontWeight:600,color:color||T.navy,background:(color||T.navy)+'18',border:`1px solid ${(color||T.navy)}30`,borderRadius:4,padding:'2px 7px',marginLeft:4}}>{label}</span>
);

const Panel=({title,children,collapsible,defaultOpen=true,citation})=>{
  const [open,setOpen]=useState(defaultOpen);
  return(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:16,overflow:'hidden'}}>
      <div onClick={collapsible?()=>setOpen(!open):undefined} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderBottom:open?`1px solid ${T.border}`:'none',cursor:collapsible?'pointer':'default',background:T.surfaceH}}>
        <span style={{fontFamily:T.font,fontSize:14,fontWeight:700,color:T.navy}}>{title}</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {citation&&<span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{citation}</span>}
          {collapsible&&<span style={{fontFamily:T.mono,fontSize:12,color:T.textMut}}>{open?'\u25B2':'\u25BC'}</span>}
        </div>
      </div>
      {open&&<div style={{padding:'16px 20px'}}>{children}</div>}
    </div>
  );
};

const Inp=({label,value,onChange,type='text',unit,placeholder,width,disabled,style:sx})=>(
  <div style={{display:'inline-flex',flexDirection:'column',gap:2,...sx}}>
    {label&&<label style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{label}</label>}
    <div style={{display:'flex',alignItems:'center',gap:4}}>
      <input value={value} onChange={e=>onChange(type==='number'?parseFloat(e.target.value)||0:e.target.value)} type={type} placeholder={placeholder}
        disabled={disabled}
        style={{fontFamily:T.mono,fontSize:12,padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:4,background:disabled?T.surfaceH:T.surface,color:T.text,width:width||120,outline:'none'}} />
      {unit&&<span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>{unit}</span>}
    </div>
  </div>
);

const Sel=({label,value,onChange,options,width,disabled})=>(
  <div style={{display:'inline-flex',flexDirection:'column',gap:2}}>
    {label&&<label style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}
      style={{fontFamily:T.mono,fontSize:12,padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:4,background:disabled?T.surfaceH:T.surface,color:T.text,width:width||180}}>
      {options.map(o=><option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}>{typeof o==='string'?o:o.label}</option>)}
    </select>
  </div>
);

const Btn=({children,onClick,variant='primary',small,disabled,style:sx})=>{
  const bg=variant==='primary'?T.navy:variant==='gold'?T.gold:variant==='danger'?T.red:'transparent';
  const fg=variant==='ghost'?T.navy:'#fff';
  const bd=variant==='ghost'?`1px solid ${T.border}`:'none';
  return <button onClick={onClick} disabled={disabled} style={{fontFamily:T.font,fontSize:small?11:12,fontWeight:600,padding:small?'4px 10px':'7px 16px',borderRadius:6,background:disabled?T.textMut:bg,color:fg,border:bd,cursor:disabled?'not-allowed':'pointer',opacity:disabled?.6:1,...sx}}>{children}</button>;
};

const TH=({children,w})=><th style={{fontFamily:T.font,fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',padding:'8px 10px',borderBottom:`1px solid ${T.border}`,width:w,whiteSpace:'nowrap',textTransform:'uppercase',letterSpacing:'.04em'}}>{children}</th>;
const TD=({children,mono,color,align})=><td style={{fontFamily:mono?T.mono:T.font,fontSize:12,color:color||T.text,padding:'7px 10px',borderBottom:`1px solid ${T.border}`,textAlign:align||'left'}}>{children}</td>;

const InfoBox=({text,type='info'})=>{
  const c=type==='warn'?T.amber:type==='error'?T.red:T.navyL;
  return <div style={{fontFamily:T.font,fontSize:12,color:c,background:c+'10',border:`1px solid ${c}30`,borderRadius:6,padding:'10px 14px',marginBottom:12}}>{text}</div>;
};

const formatN=(n,d=1)=>{if(n==null||isNaN(n))return'\u2014';if(Math.abs(n)>=1e6)return(n/1e6).toFixed(d)+'M';if(Math.abs(n)>=1e3)return(n/1e3).toFixed(d)+'k';return n.toFixed(d);};
const fmtCO2=(t)=>{if(t==null||isNaN(t))return'\u2014';if(t>=1e6)return(t/1e6).toFixed(2)+' MtCO2e';if(t>=1e3)return(t/1e3).toFixed(2)+' ktCO2e';return t.toFixed(2)+' tCO2e';};

const COLORS=[T.navy,T.gold,T.sage,'#8b5cf6','#0ea5e9','#f59e0b','#ef4444','#10b981','#6366f1','#ec4899','#14b8a6','#f97316','#a855f7','#06b6d4','#84cc16'];

/* ═══════════════════════════════════════════════════════════════════════════════
   INITIAL DATA — demo entities, scope1/2/3 entries
   ═══════════════════════════════════════════════════════════════════════════════ */

const BOUNDARY_APPROACHES=[
  {value:'equity',label:'Equity Share',desc:'Consolidate based on % economic interest in each entity'},
  {value:'operational',label:'Operational Control',desc:'100% of emissions from entities where the company has operational control'},
  {value:'financial',label:'Financial Control',desc:'100% of emissions from entities where the company has financial control'},
];

const initEntities=()=>[
  {id:1,name:'Apex Holdings Ltd (Parent)',country:'GB',ownership:100,include:true,isParent:true},
  {id:2,name:'Apex Manufacturing GmbH',country:'DE',ownership:100,include:true,isParent:false},
  {id:3,name:'Apex Technologies Inc.',country:'US',ownership:75,include:true,isParent:false},
  {id:4,name:'Apex India Pvt Ltd',country:'IN',ownership:51,include:true,isParent:false},
  {id:5,name:'GreenField JV Pty Ltd',country:'AU',ownership:30,include:false,isParent:false},
];

const FUEL_TYPES=[
  {value:'naturalGas_kWh',label:'Natural Gas (kWh)',unit:'kWh'},
  {value:'diesel_kWh',label:'Diesel (kWh)',unit:'kWh'},
  {value:'coal_kWh',label:'Coal (kWh)',unit:'kWh'},
  {value:'lpg_kWh',label:'LPG (kWh)',unit:'kWh'},
  {value:'fuelOil_kWh',label:'Fuel Oil (kWh)',unit:'kWh'},
  {value:'biogas_kWh',label:'Biogas (kWh)',unit:'kWh'},
  {value:'biomass_kWh',label:'Biomass (kWh)',unit:'kWh'},
  {value:'naturalGas_m3',label:'Natural Gas (m\u00B3)',unit:'m\u00B3'},
  {value:'diesel_litre',label:'Diesel (litres)',unit:'litres'},
  {value:'petrol_litre',label:'Petrol (litres)',unit:'litres'},
];

const VEHICLE_TYPES=[
  {value:'petrolCar',label:'Petrol Car'},
  {value:'dieselCar',label:'Diesel Car'},
  {value:'hybridCar',label:'Hybrid Car'},
  {value:'electricCar',label:'Electric Car'},
  {value:'bus',label:'Bus / Coach'},
  {value:'taxi',label:'Taxi'},
  {value:'trainNational',label:'National Rail'},
  {value:'motorbike',label:'Motorbike'},
];

const INDUSTRY_PROCESSES=[
  {value:'cement',label:'Cement (Clinker)',ef:830,unit:'kgCO2e/t',source:'GCCA / DEFRA 2023'},
  {value:'steel_primary',label:'Steel (BF-BOF)',ef:1850,unit:'kgCO2e/t',source:'worldsteel / DEFRA 2023'},
  {value:'steel_eaf',label:'Steel (EAF)',ef:410,unit:'kgCO2e/t',source:'worldsteel / DEFRA 2023'},
  {value:'aluminium',label:'Aluminium (Primary)',ef:8400,unit:'kgCO2e/t',source:'IAI / DEFRA 2023'},
  {value:'chemicals',label:'Chemicals (Average)',ef:2100,unit:'kgCO2e/t',source:'DEFRA 2023'},
  {value:'glass',label:'Glass (Flat)',ef:910,unit:'kgCO2e/t',source:'DEFRA 2023'},
  {value:'paper',label:'Paper (Virgin)',ef:920,unit:'kgCO2e/t',source:'DEFRA 2023'},
  {value:'plastics',label:'Plastics (Average)',ef:3100,unit:'kgCO2e/t',source:'DEFRA 2023'},
];

const REFRIGERANT_TYPES=[
  {value:'HFC_134a',label:'R-134a (HFC-134a)',gwp:GWP_VALUES.HFC_134a},
  {value:'HFC_32',label:'R-32 (HFC-32)',gwp:GWP_VALUES.HFC_32},
  {value:'HFC_125',label:'R-410A (HFC-125/32 blend)',gwp:2088},
  {value:'HFC_227ea',label:'R-227ea',gwp:GWP_VALUES.HFC_227ea},
  {value:'SF6',label:'SF\u2086 (Switchgear)',gwp:GWP_VALUES.SF6},
  {value:'HFC_23',label:'HFC-23',gwp:GWP_VALUES.HFC_23},
  {value:'HFC_143a',label:'R-143a',gwp:GWP_VALUES.HFC_143a},
  {value:'HFC_245fa',label:'R-245fa',gwp:GWP_VALUES.HFC_245fa},
];

/* ─── Waste disposal methods (Scope 3 Cat 5) ─── */
const WASTE_TYPES=[
  {value:'landfill_mixed',label:'Landfill (Mixed Waste)',ef:0.587,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'landfill_organic',label:'Landfill (Organic/Food)',ef:0.623,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'incineration',label:'Incineration (w/ energy recovery)',ef:0.021,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'incineration_no_er',label:'Incineration (w/o energy recovery)',ef:0.467,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'recycling_paper',label:'Recycling \u2014 Paper/Cardboard',ef:0.021,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'recycling_plastics',label:'Recycling \u2014 Plastics',ef:0.021,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'recycling_metals',label:'Recycling \u2014 Metals',ef:0.021,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'recycling_glass',label:'Recycling \u2014 Glass',ef:0.021,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'composting',label:'Composting',ef:0.010,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'anaerobic_digestion',label:'Anaerobic Digestion',ef:0.010,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'hazardous',label:'Hazardous Waste Treatment',ef:0.850,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'construction',label:'Construction & Demolition',ef:0.014,unit:'tCO2e/t',source:'DEFRA 2023'},
  {value:'electronics',label:'WEEE / E-waste',ef:0.035,unit:'tCO2e/t',source:'DEFRA 2023'},
];

/* ─── Freight transport modes (Scope 3 Cat 4/9) ─── */
const FREIGHT_MODES=[
  {value:'road_hgv',label:'Road \u2014 HGV (articulated)',ef:0.10480,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
  {value:'road_lgv',label:'Road \u2014 LGV (van)',ef:0.58350,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
  {value:'road_rigid',label:'Road \u2014 Rigid HGV',ef:0.15580,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
  {value:'rail_freight',label:'Rail Freight',ef:0.02580,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
  {value:'sea_container',label:'Sea \u2014 Container Ship',ef:0.01618,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
  {value:'sea_bulk',label:'Sea \u2014 Bulk Carrier',ef:0.00500,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
  {value:'sea_tanker',label:'Sea \u2014 Tanker',ef:0.00750,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
  {value:'air_freight',label:'Air Freight',ef:1.12780,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
  {value:'air_long',label:'Air Freight (Long Haul)',ef:0.60230,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
  {value:'barge',label:'Inland Waterway / Barge',ef:0.03130,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
  {value:'pipeline',label:'Pipeline (liquids/gas)',ef:0.01100,unit:'kgCO2e/tonne-km',source:'DEFRA 2023'},
];

/* ─── Commute mode split options (Scope 3 Cat 7) ─── */
const COMMUTE_MODES=[
  {value:'car_solo',label:'Car (Solo Driver)',ef:0.17050,unit:'kgCO2e/km',pct:45,source:'DEFRA 2023'},
  {value:'car_pool',label:'Car (Carpool 2+)',ef:0.08525,unit:'kgCO2e/km',pct:10,source:'DEFRA 2023 / 2-person'},
  {value:'bus_transit',label:'Bus / Public Transit',ef:0.08200,unit:'kgCO2e/km',pct:15,source:'DEFRA 2023'},
  {value:'rail_metro',label:'Rail / Metro',ef:0.03570,unit:'kgCO2e/km',pct:12,source:'DEFRA 2023'},
  {value:'cycle_walk',label:'Cycling / Walking',ef:0.00000,unit:'kgCO2e/km',pct:8,source:'Zero emission'},
  {value:'ev_car',label:'Electric Car',ef:0.04650,unit:'kgCO2e/km',pct:5,source:'DEFRA 2023'},
  {value:'motorbike',label:'Motorbike / Scooter',ef:0.10330,unit:'kgCO2e/km',pct:3,source:'DEFRA 2023'},
  {value:'wfh',label:'Work from Home',ef:0.00300,unit:'kgCO2e/day',pct:2,source:'IEA estimate'},
];

/* ─── Business travel modes (Scope 3 Cat 6) ─── */
const BIZ_TRAVEL_MODES=[
  {value:'flight_short_eco',label:'Short-Haul Flight (Economy)',ef:0.25500,unit:'kgCO2e/pkm',source:'DEFRA 2023 incl RFI'},
  {value:'flight_long_eco',label:'Long-Haul Flight (Economy)',ef:0.19500,unit:'kgCO2e/pkm',source:'DEFRA 2023 incl RFI'},
  {value:'flight_long_biz',label:'Long-Haul Flight (Business)',ef:0.42800,unit:'kgCO2e/pkm',source:'DEFRA 2023 incl RFI'},
  {value:'flight_long_first',label:'Long-Haul Flight (First)',ef:0.58600,unit:'kgCO2e/pkm',source:'DEFRA 2023 incl RFI'},
  {value:'train_national',label:'National Rail',ef:0.03570,unit:'kgCO2e/pkm',source:'DEFRA 2023'},
  {value:'train_intl',label:'International Rail (Eurostar)',ef:0.00600,unit:'kgCO2e/pkm',source:'DEFRA 2023'},
  {value:'taxi_standard',label:'Taxi / Ride-hail',ef:0.14900,unit:'kgCO2e/pkm',source:'DEFRA 2023'},
  {value:'rental_car',label:'Rental Car (Average)',ef:0.17050,unit:'kgCO2e/pkm',source:'DEFRA 2023'},
  {value:'hotel_night',label:'Hotel Night (Average)',ef:20.6,unit:'kgCO2e/night',source:'DEFRA 2023 / Cornell study'},
];

/* ─── Spend-based sector breakdowns (more granular EXIOBASE) ─── */
const SPEND_SECTORS=[
  {value:'manufacturing_general',label:'Manufacturing (General)',ef:0.42,source:'EXIOBASE 3.8.2'},
  {value:'food_agriculture',label:'Food & Agriculture',ef:0.58,source:'EXIOBASE 3.8.2'},
  {value:'chemicals_pharma',label:'Chemicals & Pharmaceuticals',ef:0.51,source:'EXIOBASE 3.8.2'},
  {value:'machinery_equipment',label:'Machinery & Equipment',ef:0.55,source:'EXIOBASE 3.8.2'},
  {value:'electronics_it',label:'Electronics & IT',ef:0.38,source:'EXIOBASE 3.8.2'},
  {value:'textiles_apparel',label:'Textiles & Apparel',ef:0.62,source:'EXIOBASE 3.8.2'},
  {value:'paper_printing',label:'Paper & Printing',ef:0.45,source:'EXIOBASE 3.8.2'},
  {value:'metals_mining',label:'Metals & Mining',ef:0.72,source:'EXIOBASE 3.8.2'},
  {value:'construction',label:'Construction Services',ef:0.48,source:'EXIOBASE 3.8.2'},
  {value:'professional_services',label:'Professional Services',ef:0.18,source:'USEEIO v2.0'},
  {value:'financial_services',label:'Financial Services',ef:0.12,source:'USEEIO v2.0'},
  {value:'transport_logistics',label:'Transport & Logistics',ef:0.52,source:'EXIOBASE 3.8.2'},
  {value:'utilities_energy',label:'Utilities & Energy Services',ef:0.68,source:'EXIOBASE 3.8.2'},
  {value:'real_estate',label:'Real Estate Services',ef:0.25,source:'USEEIO v2.0'},
  {value:'healthcare',label:'Healthcare Services',ef:0.32,source:'USEEIO v2.0'},
  {value:'education',label:'Education Services',ef:0.15,source:'USEEIO v2.0'},
  {value:'hospitality',label:'Hospitality & Tourism',ef:0.35,source:'EXIOBASE 3.8.2'},
  {value:'media_telecom',label:'Media & Telecommunications',ef:0.22,source:'USEEIO v2.0'},
];

/* ─── Capital goods sub-categories (Cat 2) ─── */
const CAPITAL_GOODS_TYPES=[
  {value:'buildings',label:'Buildings & Facilities',ef:0.65,source:'EXIOBASE'},
  {value:'machinery',label:'Production Machinery',ef:0.55,source:'EXIOBASE'},
  {value:'vehicles',label:'Vehicles & Transport Equipment',ef:0.48,source:'EXIOBASE'},
  {value:'it_equipment',label:'IT & Office Equipment',ef:0.38,source:'EXIOBASE'},
  {value:'furniture',label:'Furniture & Fixtures',ef:0.42,source:'EXIOBASE'},
  {value:'lab_equipment',label:'Lab / Scientific Equipment',ef:0.50,source:'EXIOBASE'},
  {value:'renewable_assets',label:'Renewable Energy Assets',ef:0.35,source:'IEA LCA'},
];

/* ─── Energy product lifecycle (Cat 3: Fuel & Energy Related) ─── */
const FUEL_LIFECYCLE_FACTORS={
  naturalGas_wtt:{factor:0.03382,unit:'kgCO2e/kWh',source:'DEFRA 2023 WTT',desc:'Well-to-tank natural gas'},
  diesel_wtt:{factor:0.06328,unit:'kgCO2e/kWh',source:'DEFRA 2023 WTT',desc:'Well-to-tank diesel'},
  electricity_td_loss_pct:{factor:7.5,unit:'%',source:'IEA / national grid data',desc:'Average T&D loss percentage'},
  coal_wtt:{factor:0.04140,unit:'kgCO2e/kWh',source:'DEFRA 2023 WTT',desc:'Well-to-tank coal'},
  petrol_wtt:{factor:0.05861,unit:'kgCO2e/kWh',source:'DEFRA 2023 WTT',desc:'Well-to-tank petrol'},
  lpg_wtt:{factor:0.02311,unit:'kgCO2e/kWh',source:'DEFRA 2023 WTT',desc:'Well-to-tank LPG'},
};

/* ─── Sold product energy use profiles (Cat 11) ─── */
const PRODUCT_USE_PROFILES=[
  {value:'laptop',label:'Laptop Computer',annualKwh:50,lifetimeYears:5,source:'Energy Star / EU Ecodesign'},
  {value:'desktop',label:'Desktop Computer',annualKwh:200,lifetimeYears:5,source:'Energy Star'},
  {value:'server',label:'Server (rack)',annualKwh:4380,lifetimeYears:5,source:'ASHRAE'},
  {value:'ev_car',label:'Electric Vehicle',annualKwh:3500,lifetimeYears:12,source:'EPA / DEFRA'},
  {value:'heat_pump',label:'Heat Pump (residential)',annualKwh:4000,lifetimeYears:15,source:'EST'},
  {value:'washing_machine',label:'Washing Machine',annualKwh:150,lifetimeYears:10,source:'EU Energy Label'},
  {value:'refrigerator',label:'Refrigerator',annualKwh:250,lifetimeYears:12,source:'EU Energy Label'},
  {value:'led_bulb',label:'LED Light Bulb',annualKwh:10,lifetimeYears:15,source:'DOE'},
  {value:'smartphone',label:'Smartphone',annualKwh:5,lifetimeYears:3,source:'IEA'},
  {value:'data_center',label:'Data Center (per rack)',annualKwh:35040,lifetimeYears:10,source:'Uptime Institute'},
];

/* ─── End-of-life disposal methods (Cat 12) ─── */
const EOL_METHODS=[
  {value:'landfill',label:'Landfill',ef:0.587,source:'DEFRA 2023'},
  {value:'incineration',label:'Incineration',ef:0.021,source:'DEFRA 2023'},
  {value:'recycling',label:'Recycling',ef:0.021,source:'DEFRA 2023'},
  {value:'composting',label:'Composting',ef:0.010,source:'DEFRA 2023'},
  {value:'reuse',label:'Reuse / Refurbishment',ef:0.005,source:'Estimate'},
];

/* ─── PCAF asset class mapping (Cat 15) ─── */
const PCAF_ASSET_CLASSES=[
  {value:'listed_equity',label:'Listed Equity & Corporate Bonds',method:'EVIC-based attribution',dqs_typical:2},
  {value:'business_loans',label:'Business Loans & Unlisted Equity',method:'Revenue/Balance sheet-based',dqs_typical:3},
  {value:'project_finance',label:'Project Finance',method:'Project-level emissions',dqs_typical:2},
  {value:'commercial_re',label:'Commercial Real Estate',method:'Floor area \u00D7 EPC rating',dqs_typical:3},
  {value:'mortgages',label:'Residential Mortgages',method:'EPC-based / national avg',dqs_typical:4},
  {value:'motor_vehicles',label:'Motor Vehicle Loans',method:'Vehicle type \u00D7 mileage',dqs_typical:4},
  {value:'sovereign',label:'Sovereign Debt',method:'National emissions / GDP',dqs_typical:2},
];

/* ─── Scope 3 category-specific guidance text ─── */
const SCOPE3_GUIDANCE={
  cat1:'Use supplier-specific data where available (DQS 1-2). For remaining spend, apply EXIOBASE sector-average factors. Prioritize top suppliers by spend volume. GHG Protocol recommends hybrid approach combining supplier data with spend-based estimates.',
  cat2:'Capital goods emissions are typically amortized over the useful life of the asset. Include embodied carbon from manufacturing. For buildings, use lifecycle assessment (LCA) data. For IT equipment, use manufacturer Product Carbon Footprints (PCFs) where available.',
  cat3:'Includes: (a) upstream emissions from purchased fuels (well-to-tank), (b) upstream emissions from purchased electricity (generation losses), (c) T&D losses from delivered electricity. Use DEFRA WTT factors for fuels and national grid loss factors for electricity.',
  cat4:'Calculate using: distance (km) \u00D7 weight (tonnes) \u00D7 mode-specific emission factor. Prioritize activity-based data from logistics providers. For spend-based, use transport sector EFs. Consider multimodal journeys.',
  cat5:'Categorize waste by type (general, organic, recyclable, hazardous) and disposal method (landfill, incineration, recycling, composting). Use waste audit data where available. Apply disposal-specific emission factors.',
  cat6:'Track by travel mode: air (short/long haul, class), rail, rental car, taxi, hotel nights. Use distance-based factors from DEFRA. For air travel, include Radiative Forcing Index (RFI = 1.9x). Consider offsetting programs.',
  cat7:'FTE \u00D7 avg one-way distance \u00D7 2 (round trip) \u00D7 working days \u00D7 mode-specific EF. Survey employees for mode split or use national transport statistics. Include WFH emissions where applicable.',
  cat8:'For leased offices: floor area (m\u00B2) \u00D7 energy intensity (kWh/m\u00B2) \u00D7 grid emission factor. Use EPC ratings or actual energy data where available. Distinguish between full-building and partial leases.',
  cat9:'Similar to Category 4 but for outbound logistics. Include warehousing emissions at distribution centres. Use customer delivery data where available.',
  cat10:'Applies to companies selling intermediate products. Calculate processing energy \u00D7 grid factor for downstream manufacturing. Often requires engagement with customers.',
  cat11:'Lifetime energy use: annual energy consumption (kWh) \u00D7 product lifetime (years) \u00D7 number of products sold \u00D7 grid emission factor (use-phase country). Critical for electronics, vehicles, appliances.',
  cat12:'Product weight \u00D7 disposal method EF. Consider product composition (materials mix) and likely disposal pathway by market. Use national waste statistics for disposal method split.',
  cat13:'Similar methodology to Category 8 but for assets owned by the reporting company and leased to others. Include full building energy if company owns the asset.',
  cat14:'For franchisors: aggregate Scope 1 + Scope 2 emissions from all franchise operations. Use franchise-specific data or estimate from revenue \u00D7 sector intensity. Ensure no double-counting with Scope 1/2.',
  cat15:'Links to PCAF methodology. For listed equity: EVIC-based attribution. For corporate bonds: use outstanding amount. For project finance: use project-level emissions. Calculate: (Outstanding / EVIC) \u00D7 Company Emissions.',
};

/* ─── Historical emissions for YoY comparison (demo) ─── */
const HISTORICAL_EMISSIONS=(seed)=>{
  const years=[2020,2021,2022,2023,2024];
  return years.map((y,i)=>({
    year:y,
    scope1:42000*(1-0.03*i+sr(seed+i*3)*0.02),
    scope2_loc:18000*(1-0.05*i+sr(seed+i*5)*0.02),
    scope2_mkt:18000*(1-0.08*i+sr(seed+i*7)*0.02),
    scope3:85000*(1+0.02*i-sr(seed+i*11)*0.03),
  }));
};

/* ─── District heating / cooling factors by country ─── */
const DISTRICT_HEATING_EFS=[
  {country:'GB',label:'UK District Heating',ef:0.180,unit:'kgCO2e/kWh',source:'DEFRA 2023'},
  {country:'DE',label:'Germany Fernw\u00E4rme',ef:0.165,unit:'kgCO2e/kWh',source:'UBA 2023'},
  {country:'SE',label:'Sweden District Heating',ef:0.040,unit:'kgCO2e/kWh',source:'Energimyndigheten'},
  {country:'DK',label:'Denmark District Heating',ef:0.085,unit:'kgCO2e/kWh',source:'Energinet'},
  {country:'FI',label:'Finland District Heating',ef:0.130,unit:'kgCO2e/kWh',source:'Statistics Finland'},
  {country:'FR',label:'France Chauffage Urbain',ef:0.110,unit:'kgCO2e/kWh',source:'ADEME'},
  {country:'US',label:'US District Heating (avg)',ef:0.200,unit:'kgCO2e/kWh',source:'DOE estimate'},
  {country:'CN',label:'China District Heating',ef:0.310,unit:'kgCO2e/kWh',source:'China Building Energy'},
];

/* ─── Currency conversion rates for spend-based (illustrative) ─── */
const EXCHANGE_RATES=[
  {from:'EUR',to:'USD',rate:1.09,source:'ECB Mar 2026'},
  {from:'GBP',to:'USD',rate:1.27,source:'ECB Mar 2026'},
  {from:'JPY',to:'USD',rate:0.0067,source:'ECB Mar 2026'},
  {from:'CHF',to:'USD',rate:1.13,source:'ECB Mar 2026'},
  {from:'CNY',to:'USD',rate:0.138,source:'ECB Mar 2026'},
  {from:'INR',to:'USD',rate:0.0119,source:'ECB Mar 2026'},
  {from:'AUD',to:'USD',rate:0.65,source:'ECB Mar 2026'},
  {from:'CAD',to:'USD',rate:0.74,source:'ECB Mar 2026'},
  {from:'KRW',to:'USD',rate:0.00074,source:'ECB Mar 2026'},
  {from:'BRL',to:'USD',rate:0.18,source:'ECB Mar 2026'},
];

const initScope1Stationary=()=>[
  {id:1,desc:'HQ Office Gas Heating',fuel:'naturalGas_kWh',qty:850000,note:'Annual gas consumption'},
  {id:2,desc:'Backup Generator',fuel:'diesel_litre',qty:12000,note:'Emergency diesel genset'},
  {id:3,desc:'Factory Boiler (DE)',fuel:'naturalGas_kWh',qty:2400000,note:'Process steam'},
  {id:4,desc:'Warehouse Heating',fuel:'lpg_kWh',qty:180000,note:''},
  {id:5,desc:'India Office Generator',fuel:'diesel_litre',qty:8500,note:'Grid backup'},
];

const initScope1Mobile=()=>[
  {id:1,desc:'Company Cars (Petrol)',vehicle:'petrolCar',distance:480000,fleetSize:12,note:'Sales fleet'},
  {id:2,desc:'Delivery Vans (Diesel)',vehicle:'dieselCar',distance:320000,fleetSize:8,note:'Last-mile delivery'},
  {id:3,desc:'Executive Hybrid Fleet',vehicle:'hybridCar',distance:120000,fleetSize:4,note:'Management vehicles'},
];

const initScope1Process=()=>[
  {id:1,desc:'Cement Clinker Production',industry:'cement',qty:45000,note:'Annual clinker output'},
];

const initScope1Fugitive=()=>[
  {id:1,desc:'Building HVAC System',refrigerant:'HFC_125',charge:85,leakRate:5,note:'R-410A in office AC'},
  {id:2,desc:'Electrical Switchgear',refrigerant:'SF6',charge:12,leakRate:1,note:'HV switch insulation'},
];

const initScope2Facilities=()=>[
  {id:1,name:'UK HQ (London)',country:'GB',elecKwh:1200000,recKwh:600000,ppaKwh:0,supplierEf:null,residualEf:null,heatKwh:80000,heatEf:0.18,coolKwh:0},
  {id:2,name:'US Manufacturing (Ohio)',country:'US',elecKwh:3500000,recKwh:0,ppaKwh:3500000,supplierEf:0.01,residualEf:null,heatKwh:200000,heatEf:0.20,coolKwh:150000},
  {id:3,name:'India Office (Mumbai)',country:'IN',elecKwh:450000,recKwh:0,ppaKwh:0,supplierEf:null,residualEf:0.72,heatKwh:0,heatEf:0,coolKwh:120000},
];

const SCOPE3_CATEGORIES=[
  {num:1,name:'Purchased Goods & Services',key:'cat1',spendKey:'cat1_purchased_goods',desc:'All upstream Scope 3 emissions from purchased goods & services'},
  {num:2,name:'Capital Goods',key:'cat2',spendKey:'cat2_capital_goods',desc:'Emissions from production of capital goods purchased or acquired'},
  {num:3,name:'Fuel & Energy Related Activities',key:'cat3',spendKey:'cat3_fuel_energy',desc:'Upstream extraction, production, and transportation of fuels; T&D losses'},
  {num:4,name:'Upstream Transportation & Distribution',key:'cat4',spendKey:'cat4_upstream_transport',desc:'Transport and distribution of purchased products between Tier 1 suppliers and company'},
  {num:5,name:'Waste Generated in Operations',key:'cat5',spendKey:'cat5_waste',desc:'Disposal and treatment of waste generated in operations'},
  {num:6,name:'Business Travel',key:'cat6',spendKey:'cat6_business_travel',desc:'Employee travel for business activities in non-owned vehicles'},
  {num:7,name:'Employee Commuting',key:'cat7',spendKey:'cat7_commuting',desc:'Employee travel between homes and worksites'},
  {num:8,name:'Upstream Leased Assets',key:'cat8',spendKey:'cat8_upstream_leased',desc:'Emissions from operation of leased assets not in Scope 1/2'},
  {num:9,name:'Downstream Transportation & Distribution',key:'cat9',spendKey:'cat9_downstream_transport',desc:'Transport of sold products between company and end consumer'},
  {num:10,name:'Processing of Sold Products',key:'cat10',spendKey:null,desc:'Processing by third parties of intermediate products sold'},
  {num:11,name:'Use of Sold Products',key:'cat11',spendKey:'cat11_use_of_product',desc:'End use of goods and services sold by the company'},
  {num:12,name:'End-of-Life Treatment of Sold Products',key:'cat12',spendKey:'cat12_end_of_life',desc:'Waste disposal and treatment of sold products at end of life'},
  {num:13,name:'Downstream Leased Assets',key:'cat13',spendKey:null,desc:'Emissions from operation of assets owned but leased to others'},
  {num:14,name:'Franchises',key:'cat14',spendKey:null,desc:'Emissions from operation of franchises not in Scope 1/2'},
  {num:15,name:'Investments',key:'cat15',spendKey:'cat15_investments',desc:'Emissions from investments (equity, debt, project finance) — links to PCAF'},
];

const initScope3Data=()=>{
  const d={};
  SCOPE3_CATEGORIES.forEach(c=>{
    const on=[1,2,4,5,6,7,15].includes(c.num);
    d[c.key]={
      enabled:on,
      methodology:c.spendKey?'spend':'activity',
      dqs:c.spendKey?4:3,
      spend:0,activity:0,activityUnit:'',customEf:0,customEfSource:'',
      notes:'',
    };
  });
  // Pre-load demo data
  d.cat1={...d.cat1,enabled:true,methodology:'spend',spend:28500000,dqs:4,notes:'All purchased goods FY2024'};
  d.cat2={...d.cat2,enabled:true,methodology:'spend',spend:4200000,dqs:4,notes:'Machinery & IT equipment'};
  d.cat4={...d.cat4,enabled:true,methodology:'spend',spend:3100000,dqs:4,notes:'Inbound logistics'};
  d.cat5={...d.cat5,enabled:true,methodology:'spend',spend:620000,dqs:4,notes:'Waste management contracts'};
  d.cat6={...d.cat6,enabled:true,methodology:'spend',spend:1850000,dqs:3,notes:'Flights, hotels, ground transport'};
  d.cat7={...d.cat7,enabled:true,methodology:'activity',activity:850,activityUnit:'FTE',customEf:1.2,customEfSource:'UK avg commute 1.2 tCO2e/FTE (DEFRA)',dqs:3,notes:'850 FTE avg commute'};
  d.cat15={...d.cat15,enabled:true,methodology:'spend',spend:120000000,dqs:5,notes:'Listed equity & corporate debt portfolio'};
  return d;
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function CarbonCalculatorPage(){
  const [tab,setTab]=useState('boundary');

  /* ─── Company-level info ─── */
  const [companyName,setCompanyName]=useState('Apex Holdings Ltd');
  const [reportingYear,setReportingYear]=useState(2024);
  const [baseYear,setBaseYear]=useState(2020);
  const [revenue,setRevenue]=useState(185000000);
  const [employees,setEmployees]=useState(850);
  const [sector,setSector]=useState('2010');

  /* ─── Tab 1: Organizational Boundary ─── */
  const [boundaryApproach,setBoundaryApproach]=useState('operational');
  const [entities,setEntities]=useState(initEntities);
  const nextEntityId=useRef(6);

  /* ─── Tab 2: Scope 1 ─── */
  const [stationary,setStationary]=useState(initScope1Stationary);
  const [mobile,setMobile]=useState(initScope1Mobile);
  const [process,setProcess]=useState(initScope1Process);
  const [fugitive,setFugitive]=useState(initScope1Fugitive);
  const nextS1Id=useRef(20);

  /* ─── Tab 3: Scope 2 ─── */
  const [facilities,setFacilities]=useState(initScope2Facilities);
  const nextFacId=useRef(4);

  /* ─── Tab 4: Scope 3 ─── */
  const [scope3,setScope3]=useState(initScope3Data);

  /* ─── Tab 5: GWP ─── */
  const [convFrom,setConvFrom]=useState(1);
  const [convFromUnit,setConvFromUnit]=useState('tCO2e');
  const [convToUnit,setConvToUnit]=useState('ktCO2e');
  const [baseYearEmissions,setBaseYearEmissions]=useState(42000);
  const [structuralChange,setStructuralChange]=useState(3500);
  const [structuralType,setStructuralType]=useState('acquisition');

  /* ═══════════════════════════════════════════════════════════════════════════
     CALCULATIONS
     ═══════════════════════════════════════════════════════════════════════════ */

  /* --- Scope 1 Stationary --- */
  const calcStationary=useCallback((item)=>{
    const ef=EMISSION_FACTORS.energy[item.fuel];
    if(!ef)return 0;
    return (item.qty*ef.factor)/1000; // kgCO2e -> tCO2e
  },[]);

  const scope1StationaryTotal=useMemo(()=>stationary.reduce((s,i)=>s+calcStationary(i),0),[stationary,calcStationary]);

  /* --- Scope 1 Mobile --- */
  const calcMobile=useCallback((item)=>{
    const ef=EMISSION_FACTORS.transport[item.vehicle];
    if(!ef)return 0;
    return (item.distance*(item.fleetSize||1)*ef.factor)/1e6; // gCO2e -> tCO2e
  },[]);

  const scope1MobileTotal=useMemo(()=>mobile.reduce((s,i)=>s+calcMobile(i),0),[mobile,calcMobile]);

  /* --- Scope 1 Process --- */
  const calcProcess=useCallback((item)=>{
    const p=INDUSTRY_PROCESSES.find(x=>x.value===item.industry);
    if(!p)return 0;
    return (item.qty*p.ef)/1000; // kgCO2e -> tCO2e
  },[]);

  const scope1ProcessTotal=useMemo(()=>process.reduce((s,i)=>s+calcProcess(i),0),[process,calcProcess]);

  /* --- Scope 1 Fugitive --- */
  const calcFugitive=useCallback((item)=>{
    const ref=REFRIGERANT_TYPES.find(r=>r.value===item.refrigerant);
    if(!ref)return 0;
    return (item.charge*(item.leakRate/100)*ref.gwp)/1000; // kgCO2e -> tCO2e
  },[]);

  const scope1FugitiveTotal=useMemo(()=>fugitive.reduce((s,i)=>s+calcFugitive(i),0),[fugitive,calcFugitive]);

  const scope1Total=useMemo(()=>scope1StationaryTotal+scope1MobileTotal+scope1ProcessTotal+scope1FugitiveTotal,[scope1StationaryTotal,scope1MobileTotal,scope1ProcessTotal,scope1FugitiveTotal]);

  /* --- Scope 2 Location-Based --- */
  const calcS2Location=useCallback((f)=>{
    const gi=GRID_INTENSITY.find(g=>g.iso2===f.country);
    const elecFactor=gi?gi.gCO2_kWh:400;
    const elecT=(f.elecKwh*elecFactor)/1e6;
    const heatT=(f.heatKwh*(f.heatEf||0.18))/1000;
    const coolT=(f.coolKwh*elecFactor)/1e6;
    return elecT+heatT+coolT;
  },[]);

  /* --- Scope 2 Market-Based --- */
  const calcS2Market=useCallback((f)=>{
    const gi=GRID_INTENSITY.find(g=>g.iso2===f.country);
    const gridF=gi?gi.gCO2_kWh:400;
    let remainKwh=f.elecKwh;
    let mktT=0;
    // REC/GO certificates -> zero emissions for covered portion
    if(f.recKwh>0){
      remainKwh-=Math.min(f.recKwh,remainKwh);
    }
    // PPA with supplier-specific EF
    if(f.ppaKwh>0&&f.supplierEf!=null){
      const ppaCover=Math.min(f.ppaKwh,remainKwh);
      mktT+=(ppaCover*f.supplierEf*1000)/1e6; // supplierEf in kgCO2e/kWh -> t
      remainKwh-=ppaCover;
    }
    // Residual mix for uncovered portion
    if(remainKwh>0){
      const resFactor=f.residualEf!=null?f.residualEf*1000:gridF; // residualEf in kgCO2e/kWh
      mktT+=(remainKwh*resFactor)/1e6;
    }
    // Heat and cooling same as location-based
    mktT+=(f.heatKwh*(f.heatEf||0.18))/1000;
    mktT+=(f.coolKwh*gridF)/1e6;
    return mktT;
  },[]);

  const scope2LocationTotal=useMemo(()=>facilities.reduce((s,f)=>s+calcS2Location(f),0),[facilities,calcS2Location]);
  const scope2MarketTotal=useMemo(()=>facilities.reduce((s,f)=>s+calcS2Market(f),0),[facilities,calcS2Market]);

  const renewableKwh=useMemo(()=>facilities.reduce((s,f)=>s+(f.recKwh||0)+(f.ppaKwh||0),0),[facilities]);
  const totalElecKwh=useMemo(()=>facilities.reduce((s,f)=>s+(f.elecKwh||0),0),[facilities]);
  const renewablePct=totalElecKwh>0?(renewableKwh/totalElecKwh*100):0;

  /* --- Scope 3 --- */
  const calcScope3Cat=useCallback((catKey)=>{
    const catMeta=SCOPE3_CATEGORIES.find(c=>c.key===catKey);
    const d=scope3[catKey];
    if(!d||!d.enabled)return 0;
    if(d.methodology==='spend'&&d.spend>0){
      const spendEf=catMeta?.spendKey?EMISSION_FACTORS.scope3_spend[catMeta.spendKey]:null;
      if(spendEf)return(d.spend*spendEf.factor)/1000; // kgCO2e -> tCO2e
      return 0;
    }
    if(d.methodology==='activity'&&d.activity>0&&d.customEf>0){
      return d.activity*d.customEf; // already in tCO2e
    }
    if(d.methodology==='supplier'&&d.activity>0&&d.customEf>0){
      return d.activity*d.customEf;
    }
    return 0;
  },[scope3]);

  const scope3Totals=useMemo(()=>{
    const t={};
    let sum=0;
    SCOPE3_CATEGORIES.forEach(c=>{
      const v=calcScope3Cat(c.key);
      t[c.key]=v;
      sum+=v;
    });
    return{byCat:t,total:sum};
  },[calcScope3Cat]);

  const scope3DqsAvg=useMemo(()=>{
    let wSum=0,wCount=0;
    SCOPE3_CATEGORIES.forEach(c=>{
      const d=scope3[c.key];
      if(d&&d.enabled&&scope3Totals.byCat[c.key]>0){
        wSum+=d.dqs*scope3Totals.byCat[c.key];
        wCount+=scope3Totals.byCat[c.key];
      }
    });
    return wCount>0?(wSum/wCount):0;
  },[scope3,scope3Totals]);

  /* --- Grand totals --- */
  const grandTotal=scope1Total+scope2LocationTotal+scope3Totals.total;
  const grandTotalMarket=scope1Total+scope2MarketTotal+scope3Totals.total;
  const intensityRevenue=revenue>0?(grandTotal/(revenue/1e6)):0;
  const intensityEmployee=employees>0?(grandTotal/employees):0;

  /* --- Sector benchmark --- */
  const sectorBench=useMemo(()=>SECTOR_BENCHMARKS.find(s=>s.gics===sector),[sector]);

  /* ═══════════════════════════════════════════════════════════════════════════
     DATA VALIDATION
     ═══════════════════════════════════════════════════════════════════════════ */
  const validationIssues=useMemo(()=>{
    const issues=[];
    stationary.forEach(i=>{if(!i.fuel||!i.qty)issues.push({type:'error',msg:`Scope 1 Stationary "${i.desc}": missing fuel type or quantity`});});
    facilities.forEach(f=>{if(!f.country||!f.elecKwh)issues.push({type:'error',msg:`Scope 2 "${f.name}": missing country or electricity data`});});
    const enabledCats=SCOPE3_CATEGORIES.filter(c=>scope3[c.key]?.enabled);
    if(enabledCats.length<3)issues.push({type:'warn',msg:'Less than 3 Scope 3 categories enabled \u2014 GHG Protocol recommends including all material categories'});
    enabledCats.forEach(c=>{
      const d=scope3[c.key];
      if(d.methodology==='spend'&&!d.spend)issues.push({type:'warn',msg:`Scope 3 Cat ${c.num}: enabled but no spend data entered`});
      if(d.dqs>=4)issues.push({type:'info',msg:`Scope 3 Cat ${c.num}: DQS ${d.dqs} \u2014 consider upgrading to activity-based methodology`});
    });
    SCOPE3_CATEGORIES.forEach(c=>{
      if(scope3[c.key]?.enabled&&scope3Totals.total>0){
        const pct=(scope3Totals.byCat[c.key]/scope3Totals.total)*100;
        if(pct>40)issues.push({type:'warn',msg:`Scope 3 Cat ${c.num} is ${pct.toFixed(0)}% of total Scope 3 \u2014 verify data quality`});
      }
    });
    return issues;
  },[stationary,facilities,scope3,scope3Totals]);

  /* ═══════════════════════════════════════════════════════════════════════════
     HELPER: Entity updaters
     ═══════════════════════════════════════════════════════════════════════════ */
  const updateEntity=(id,field,val)=>setEntities(es=>es.map(e=>e.id===id?{...e,[field]:val}:e));
  const addEntity=()=>{setEntities(es=>[...es,{id:nextEntityId.current++,name:'New Entity',country:'GB',ownership:50,include:true,isParent:false}]);};
  const removeEntity=(id)=>setEntities(es=>es.filter(e=>e.id!==id));

  const updateStationary=(id,field,val)=>setStationary(xs=>xs.map(x=>x.id===id?{...x,[field]:val}:x));
  const addStationary=()=>{setStationary(xs=>[...xs,{id:nextS1Id.current++,desc:'New Source',fuel:'naturalGas_kWh',qty:0,note:''}]);};
  const removeStationary=(id)=>setStationary(xs=>xs.filter(x=>x.id!==id));

  const updateMobile=(id,field,val)=>setMobile(xs=>xs.map(x=>x.id===id?{...x,[field]:val}:x));
  const addMobile=()=>{setMobile(xs=>[...xs,{id:nextS1Id.current++,desc:'New Vehicle',vehicle:'petrolCar',distance:0,fleetSize:1,note:''}]);};
  const removeMobile=(id)=>setMobile(xs=>xs.filter(x=>x.id!==id));

  const updateProcess=(id,field,val)=>setProcess(xs=>xs.map(x=>x.id===id?{...x,[field]:val}:x));
  const addProcess=()=>{setProcess(xs=>[...xs,{id:nextS1Id.current++,desc:'New Process',industry:'cement',qty:0,note:''}]);};
  const removeProcess=(id)=>setProcess(xs=>xs.filter(x=>x.id!==id));

  const updateFugitive=(id,field,val)=>setFugitive(xs=>xs.map(x=>x.id===id?{...x,[field]:val}:x));
  const addFugitive=()=>{setFugitive(xs=>[...xs,{id:nextS1Id.current++,desc:'New Source',refrigerant:'HFC_134a',charge:0,leakRate:5,note:''}]);};
  const removeFugitive=(id)=>setFugitive(xs=>xs.filter(x=>x.id!==id));

  const updateFacility=(id,field,val)=>setFacilities(xs=>xs.map(x=>x.id===id?{...x,[field]:val}:x));
  const addFacility=()=>{setFacilities(xs=>[...xs,{id:nextFacId.current++,name:'New Facility',country:'GB',elecKwh:0,recKwh:0,ppaKwh:0,supplierEf:null,residualEf:null,heatKwh:0,heatEf:0.18,coolKwh:0}]);};
  const removeFacility=(id)=>setFacilities(xs=>xs.filter(x=>x.id!==id));

  const updateScope3=(catKey,field,val)=>setScope3(s=>({...s,[catKey]:{...s[catKey],[field]:val}}));

  /* ═══════════════════════════════════════════════════════════════════════════
     EXPORT HELPERS
     ═══════════════════════════════════════════════════════════════════════════ */
  const buildInventoryJSON=useCallback(()=>{
    return{
      company:companyName,reportingYear,baseYear,
      boundary:{approach:boundaryApproach,entities:entities.filter(e=>e.include)},
      scope1:{stationary:scope1StationaryTotal,mobile:scope1MobileTotal,process:scope1ProcessTotal,fugitive:scope1FugitiveTotal,total:scope1Total},
      scope2:{locationBased:scope2LocationTotal,marketBased:scope2MarketTotal,renewablePct},
      scope3:{byCat:scope3Totals.byCat,total:scope3Totals.total,dqsAvg:scope3DqsAvg},
      totals:{grandTotal_locationBased:grandTotal,grandTotal_marketBased:grandTotalMarket,intensityRevenue,intensityEmployee},
      metadata:{standard:'GHG Protocol Corporate Standard (Rev. 2015)',generatedAt:new Date().toISOString()},
    };
  },[companyName,reportingYear,baseYear,boundaryApproach,entities,scope1StationaryTotal,scope1MobileTotal,scope1ProcessTotal,scope1FugitiveTotal,scope1Total,scope2LocationTotal,scope2MarketTotal,renewablePct,scope3Totals,scope3DqsAvg,grandTotal,grandTotalMarket,intensityRevenue,intensityEmployee]);

  const downloadCSV=useCallback(()=>{
    const rows=[['Scope','Category','Source','tCO2e']];
    stationary.forEach(i=>rows.push(['Scope 1','Stationary Combustion',i.desc,calcStationary(i).toFixed(2)]));
    mobile.forEach(i=>rows.push(['Scope 1','Mobile Combustion',i.desc,calcMobile(i).toFixed(2)]));
    process.forEach(i=>rows.push(['Scope 1','Process Emissions',i.desc,calcProcess(i).toFixed(2)]));
    fugitive.forEach(i=>rows.push(['Scope 1','Fugitive Emissions',i.desc,calcFugitive(i).toFixed(2)]));
    facilities.forEach(f=>{
      rows.push(['Scope 2','Location-Based',f.name,calcS2Location(f).toFixed(2)]);
      rows.push(['Scope 2','Market-Based',f.name,calcS2Market(f).toFixed(2)]);
    });
    SCOPE3_CATEGORIES.forEach(c=>{
      if(scope3[c.key]?.enabled)rows.push(['Scope 3',`Cat ${c.num}: ${c.name}`,'',scope3Totals.byCat[c.key].toFixed(2)]);
    });
    rows.push(['TOTAL','Grand Total (Location-Based)','',grandTotal.toFixed(2)]);
    const csv=rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`GHG_Inventory_${companyName.replace(/\s+/g,'_')}_FY${reportingYear}.csv`;a.click();
    URL.revokeObjectURL(url);
  },[stationary,mobile,process,fugitive,facilities,scope3,scope3Totals,grandTotal,companyName,reportingYear,calcStationary,calcMobile,calcProcess,calcFugitive,calcS2Location,calcS2Market]);

  const downloadJSON=useCallback(()=>{
    const json=JSON.stringify(buildInventoryJSON(),null,2);
    const blob=new Blob([json],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`GHG_Inventory_${companyName.replace(/\s+/g,'_')}_FY${reportingYear}.json`;a.click();
    URL.revokeObjectURL(url);
  },[buildInventoryJSON,companyName,reportingYear]);

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 1: ORGANIZATIONAL BOUNDARY
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderBoundary=()=>(
    <div>
      <Panel title="GHG Protocol Consolidation Approach" citation="GHG Protocol Corporate Standard, Chapter 3">
        <InfoBox text="Per GHG Protocol Corporate Standard, Chapter 3: Setting Organizational Boundaries \u2014 Companies shall select and consistently apply one of three consolidation approaches." />
        <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
          {BOUNDARY_APPROACHES.map(a=>(
            <div key={a.value} onClick={()=>setBoundaryApproach(a.value)}
              style={{flex:1,minWidth:200,padding:'16px 20px',borderRadius:8,border:`2px solid ${boundaryApproach===a.value?T.navy:T.border}`,background:boundaryApproach===a.value?T.navy+'08':T.surface,cursor:'pointer'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${boundaryApproach===a.value?T.navy:T.textMut}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {boundaryApproach===a.value&&<div style={{width:10,height:10,borderRadius:'50%',background:T.navy}} />}
                </div>
                <span style={{fontFamily:T.font,fontSize:13,fontWeight:700,color:T.navy}}>{a.label}</span>
              </div>
              <div style={{fontFamily:T.font,fontSize:11,color:T.textSec,marginLeft:26}}>{a.desc}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Entity Structure" citation="\u00A7 3.1 Organizational Boundaries">
        <div style={{display:'flex',gap:12,marginBottom:16}}>
          <Inp label="Company Name" value={companyName} onChange={setCompanyName} width={240} />
          <Inp label="Reporting Year" value={reportingYear} onChange={setReportingYear} type="number" width={90} />
          <Inp label="Base Year" value={baseYear} onChange={setBaseYear} type="number" width={90} />
          <Inp label="Revenue (USD)" value={revenue} onChange={setRevenue} type="number" width={150} unit="$" />
          <Inp label="Employees" value={employees} onChange={setEmployees} type="number" width={90} />
          <Sel label="GICS Sector" value={sector} onChange={setSector} width={220}
            options={SECTOR_BENCHMARKS.map(s=>({value:s.gics,label:`${s.gics} \u2014 ${s.sector}`}))} />
        </div>

        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH w={30}>#</TH><TH>Entity Name</TH><TH w={80}>Country</TH><TH w={90}>Ownership %</TH>
              <TH w={100}>Included</TH><TH w={120}>Allocation</TH><TH w={60}></TH>
            </tr></thead>
            <tbody>
              {entities.map((e,i)=>{
                const alloc=boundaryApproach==='equity'?e.ownership:e.include?100:0;
                return(
                  <tr key={e.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <TD mono>{i+1}</TD>
                    <TD>
                      <input value={e.name} onChange={ev=>updateEntity(e.id,'name',ev.target.value)}
                        style={{fontFamily:T.font,fontSize:12,border:'none',background:'transparent',color:T.text,width:'100%',outline:'none'}} />
                      {e.isParent&&<Badge label="Parent" color={T.navy} />}
                    </TD>
                    <TD>
                      <select value={e.country} onChange={ev=>updateEntity(e.id,'country',ev.target.value)}
                        style={{fontFamily:T.mono,fontSize:11,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',background:T.surface}}>
                        {GRID_INTENSITY.map(g=><option key={g.iso2} value={g.iso2}>{g.iso2}</option>)}
                      </select>
                    </TD>
                    <TD mono>
                      <input type="number" value={e.ownership} onChange={ev=>updateEntity(e.id,'ownership',parseFloat(ev.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:50,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />%
                    </TD>
                    <TD>
                      <input type="checkbox" checked={e.include} onChange={ev=>updateEntity(e.id,'include',ev.target.checked)} />
                      <span style={{fontFamily:T.mono,fontSize:10,color:e.include?T.green:T.textMut,marginLeft:4}}>{e.include?'Yes':'No'}</span>
                    </TD>
                    <TD mono color={alloc>0?T.navy:T.textMut}>{alloc}%</TD>
                    <TD>{!e.isParent&&<Btn small variant="danger" onClick={()=>removeEntity(e.id)}>\u2715</Btn>}</TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:12}}><Btn small variant="ghost" onClick={addEntity}>+ Add Entity</Btn></div>
      </Panel>

      <Panel title="Consolidation Preview" collapsible defaultOpen={true}>
        {boundaryApproach==='equity'&&(
          <InfoBox type="warn" text={`Under Equity Share approach, each entity contributes emissions proportional to ownership %. E.g., "${entities.find(e=>e.ownership<100&&e.ownership>0)?.name||'Entity X'}" at ${entities.find(e=>e.ownership<100&&e.ownership>0)?.ownership||30}% ownership contributes ${entities.find(e=>e.ownership<100&&e.ownership>0)?.ownership||30}% of its emissions.`} />
        )}
        <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
          {entities.filter(e=>boundaryApproach==='equity'?e.ownership>0:e.include).map(e=>{
            const alloc=boundaryApproach==='equity'?e.ownership:100;
            return(
              <div key={e.id} style={{padding:'12px 16px',borderRadius:8,border:`2px solid ${T.navy}30`,background:T.navy+'06',minWidth:180}}>
                <div style={{fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy}}>{e.name}</div>
                <div style={{fontFamily:T.mono,fontSize:11,color:T.textSec,marginTop:4}}>Country: {e.country} | Ownership: {e.ownership}%</div>
                <div style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.sage,marginTop:4}}>Allocation: {alloc}%</div>
              </div>
            );
          })}
        </div>
        {entities.filter(e=>!e.include&&boundaryApproach!=='equity').length>0&&(
          <div style={{marginTop:12}}>
            <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.textMut,marginBottom:6}}>Excluded Entities:</div>
            {entities.filter(e=>!e.include&&boundaryApproach!=='equity').map(e=>(
              <span key={e.id} style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginRight:12}}>{e.name} ({e.ownership}%)</span>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 2: SCOPE 1 — DIRECT EMISSIONS
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderScope1=()=>{
    const breakdownData=[
      {name:'Stationary',value:scope1StationaryTotal},
      {name:'Mobile',value:scope1MobileTotal},
      {name:'Process',value:scope1ProcessTotal},
      {name:'Fugitive',value:scope1FugitiveTotal},
    ].filter(d=>d.value>0);

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
          <KPICard label="Scope 1 Total" value={fmtCO2(scope1Total)} color={T.navy} />
          <KPICard label="Stationary Combustion" value={fmtCO2(scope1StationaryTotal)} sub={`${scope1Total>0?(scope1StationaryTotal/scope1Total*100).toFixed(1):0}%`} color={T.gold} />
          <KPICard label="Mobile Combustion" value={fmtCO2(scope1MobileTotal)} sub={`${scope1Total>0?(scope1MobileTotal/scope1Total*100).toFixed(1):0}%`} color={T.sage} />
          <KPICard label="Process + Fugitive" value={fmtCO2(scope1ProcessTotal+scope1FugitiveTotal)} color={T.navyL} />
        </div>

        {/* 2a. Stationary Combustion */}
        <Panel title="2a. Stationary Combustion" collapsible citation="GHG Protocol Ch 4 \u2014 Stationary Sources">
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH w={30}>#</TH><TH>Description</TH><TH w={180}>Fuel Type</TH><TH w={120}>Consumption</TH>
              <TH w={100}>EF</TH><TH w={80}>Source</TH><TH w={100}>tCO2e</TH><TH w={40}></TH>
            </tr></thead>
            <tbody>
              {stationary.map((item,i)=>{
                const ef=EMISSION_FACTORS.energy[item.fuel];
                const tco2=calcStationary(item);
                return(
                  <tr key={item.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <TD mono>{i+1}</TD>
                    <TD>
                      <input value={item.desc} onChange={e=>updateStationary(item.id,'desc',e.target.value)}
                        style={{fontFamily:T.font,fontSize:12,border:'none',background:'transparent',width:'100%',outline:'none',color:T.text}} />
                    </TD>
                    <TD>
                      <select value={item.fuel} onChange={e=>updateStationary(item.id,'fuel',e.target.value)}
                        style={{fontFamily:T.mono,fontSize:11,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',width:'100%'}}>
                        {FUEL_TYPES.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </TD>
                    <TD>
                      <input type="number" value={item.qty} onChange={e=>updateStationary(item.id,'qty',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:80,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                      <span style={{fontFamily:T.mono,fontSize:9,color:T.textMut,marginLeft:4}}>{FUEL_TYPES.find(f=>f.value===item.fuel)?.unit}</span>
                    </TD>
                    <TD mono>{ef?ef.factor:'\u2014'}</TD>
                    <TD><span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{ef?.source||''}</span></TD>
                    <TD mono color={T.navy}>{tco2.toFixed(2)}</TD>
                    <TD><Btn small variant="danger" onClick={()=>removeStationary(item.id)}>\u2715</Btn></TD>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:T.navy+'08'}}>
                <td colSpan={6} style={{padding:'8px 10px',fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,textAlign:'right'}}>Subtotal Stationary:</td>
                <TD mono color={T.navy}>{scope1StationaryTotal.toFixed(2)}</TD>
                <TD></TD>
              </tr>
            </tfoot>
          </table>
          <div style={{marginTop:10}}><Btn small variant="ghost" onClick={addStationary}>+ Add Stationary Source</Btn></div>
        </Panel>

        {/* 2b. Mobile Combustion */}
        <Panel title="2b. Mobile Combustion" collapsible citation="GHG Protocol Ch 4 \u2014 Mobile Sources">
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH w={30}>#</TH><TH>Description</TH><TH w={160}>Vehicle Type</TH><TH w={110}>Distance (km)</TH>
              <TH w={80}>Fleet Size</TH><TH w={90}>EF (gCO2e/km)</TH><TH w={100}>tCO2e</TH><TH w={40}></TH>
            </tr></thead>
            <tbody>
              {mobile.map((item,i)=>{
                const ef=EMISSION_FACTORS.transport[item.vehicle];
                const tco2=calcMobile(item);
                return(
                  <tr key={item.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <TD mono>{i+1}</TD>
                    <TD>
                      <input value={item.desc} onChange={e=>updateMobile(item.id,'desc',e.target.value)}
                        style={{fontFamily:T.font,fontSize:12,border:'none',background:'transparent',width:'100%',outline:'none',color:T.text}} />
                    </TD>
                    <TD>
                      <select value={item.vehicle} onChange={e=>updateMobile(item.id,'vehicle',e.target.value)}
                        style={{fontFamily:T.mono,fontSize:11,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',width:'100%'}}>
                        {VEHICLE_TYPES.map(v=><option key={v.value} value={v.value}>{v.label}</option>)}
                      </select>
                    </TD>
                    <TD>
                      <input type="number" value={item.distance} onChange={e=>updateMobile(item.id,'distance',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:80,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD>
                      <input type="number" value={item.fleetSize} onChange={e=>updateMobile(item.id,'fleetSize',parseInt(e.target.value)||1)}
                        style={{fontFamily:T.mono,fontSize:12,width:50,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD mono>{ef?ef.factor:'\u2014'}</TD>
                    <TD mono color={T.navy}>{tco2.toFixed(2)}</TD>
                    <TD><Btn small variant="danger" onClick={()=>removeMobile(item.id)}>\u2715</Btn></TD>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:T.navy+'08'}}>
                <td colSpan={6} style={{padding:'8px 10px',fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,textAlign:'right'}}>Subtotal Mobile:</td>
                <TD mono color={T.navy}>{scope1MobileTotal.toFixed(2)}</TD>
                <TD></TD>
              </tr>
            </tfoot>
          </table>
          <div style={{marginTop:10}}><Btn small variant="ghost" onClick={addMobile}>+ Add Vehicle / Fleet</Btn></div>
        </Panel>

        {/* 2c. Process Emissions */}
        <Panel title="2c. Process Emissions" collapsible citation="GHG Protocol Ch 4 \u2014 Process Emissions">
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH w={30}>#</TH><TH>Description</TH><TH w={180}>Industry / Process</TH>
              <TH w={120}>Production (t)</TH><TH w={100}>EF (kgCO2e/t)</TH><TH w={80}>Source</TH><TH w={100}>tCO2e</TH><TH w={40}></TH>
            </tr></thead>
            <tbody>
              {process.map((item,i)=>{
                const p=INDUSTRY_PROCESSES.find(x=>x.value===item.industry);
                const tco2=calcProcess(item);
                return(
                  <tr key={item.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <TD mono>{i+1}</TD>
                    <TD>
                      <input value={item.desc} onChange={e=>updateProcess(item.id,'desc',e.target.value)}
                        style={{fontFamily:T.font,fontSize:12,border:'none',background:'transparent',width:'100%',outline:'none',color:T.text}} />
                    </TD>
                    <TD>
                      <select value={item.industry} onChange={e=>updateProcess(item.id,'industry',e.target.value)}
                        style={{fontFamily:T.mono,fontSize:11,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',width:'100%'}}>
                        {INDUSTRY_PROCESSES.map(p2=><option key={p2.value} value={p2.value}>{p2.label}</option>)}
                      </select>
                    </TD>
                    <TD>
                      <input type="number" value={item.qty} onChange={e=>updateProcess(item.id,'qty',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:80,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD mono>{p?p.ef:'\u2014'}</TD>
                    <TD><span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{p?.source||''}</span></TD>
                    <TD mono color={T.navy}>{tco2.toFixed(2)}</TD>
                    <TD><Btn small variant="danger" onClick={()=>removeProcess(item.id)}>\u2715</Btn></TD>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:T.navy+'08'}}>
                <td colSpan={6} style={{padding:'8px 10px',fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,textAlign:'right'}}>Subtotal Process:</td>
                <TD mono color={T.navy}>{scope1ProcessTotal.toFixed(2)}</TD>
                <TD></TD>
              </tr>
            </tfoot>
          </table>
          <div style={{marginTop:10}}><Btn small variant="ghost" onClick={addProcess}>+ Add Process Source</Btn></div>
        </Panel>

        {/* 2d. Fugitive Emissions */}
        <Panel title="2d. Fugitive Emissions" collapsible citation="GHG Protocol Ch 4 \u2014 Fugitive Emissions">
          <InfoBox text="Fugitive emissions = Charge (kg) \u00D7 Leak Rate (%) \u00D7 GWP. GWP values from IPCC AR6 WG1, Chapter 7, Table 7.15." />
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH w={30}>#</TH><TH>Description</TH><TH w={180}>Refrigerant</TH>
              <TH w={90}>Charge (kg)</TH><TH w={90}>Leak Rate %</TH><TH w={80}>GWP-100</TH><TH w={100}>tCO2e</TH><TH w={40}></TH>
            </tr></thead>
            <tbody>
              {fugitive.map((item,i)=>{
                const ref=REFRIGERANT_TYPES.find(r=>r.value===item.refrigerant);
                const tco2=calcFugitive(item);
                return(
                  <tr key={item.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <TD mono>{i+1}</TD>
                    <TD>
                      <input value={item.desc} onChange={e=>updateFugitive(item.id,'desc',e.target.value)}
                        style={{fontFamily:T.font,fontSize:12,border:'none',background:'transparent',width:'100%',outline:'none',color:T.text}} />
                    </TD>
                    <TD>
                      <select value={item.refrigerant} onChange={e=>updateFugitive(item.id,'refrigerant',e.target.value)}
                        style={{fontFamily:T.mono,fontSize:11,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',width:'100%'}}>
                        {REFRIGERANT_TYPES.map(r=><option key={r.value} value={r.value}>{r.label} (GWP: {r.gwp.toLocaleString()})</option>)}
                      </select>
                    </TD>
                    <TD>
                      <input type="number" value={item.charge} onChange={e=>updateFugitive(item.id,'charge',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:60,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD>
                      <input type="number" value={item.leakRate} onChange={e=>updateFugitive(item.id,'leakRate',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:50,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD mono>{ref?ref.gwp.toLocaleString():'\u2014'}</TD>
                    <TD mono color={T.navy}>{tco2.toFixed(4)}</TD>
                    <TD><Btn small variant="danger" onClick={()=>removeFugitive(item.id)}>\u2715</Btn></TD>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:T.navy+'08'}}>
                <td colSpan={6} style={{padding:'8px 10px',fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,textAlign:'right'}}>Subtotal Fugitive:</td>
                <TD mono color={T.navy}>{scope1FugitiveTotal.toFixed(4)}</TD>
                <TD></TD>
              </tr>
            </tfoot>
          </table>
          <div style={{marginTop:10}}><Btn small variant="ghost" onClick={addFugitive}>+ Add Fugitive Source</Btn></div>
        </Panel>

        {/* Scope 1 Breakdown Chart */}
        <Panel title="Scope 1 Breakdown">
          <div style={{height:280}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} layout="vertical" margin={{left:100,right:40,top:10,bottom:10}}>
                <XAxis type="number" tick={{fontFamily:T.mono,fontSize:10}} />
                <YAxis type="category" dataKey="name" tick={{fontFamily:T.font,fontSize:11}} width={90} />
                <Tooltip formatter={v=>[v.toFixed(2)+' tCO2e']} contentStyle={{fontFamily:T.mono,fontSize:11}} />
                <Bar dataKey="value" fill={T.navy} radius={[0,4,4,0]}>
                  {breakdownData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Scope 1 EF Quick Reference */}
        <Panel title="Scope 1 Emission Factor Quick Reference" collapsible defaultOpen={false} citation="DEFRA 2023 / IPCC AR6">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Stationary Combustion (kgCO2e per unit)</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><TH>Fuel</TH><TH w={80}>EF</TH><TH w={80}>Unit</TH></tr></thead>
                <tbody>
                  {Object.entries(EMISSION_FACTORS.energy).map(([key,val],i)=>(
                    <tr key={key} style={{background:i%2===0?T.surface:T.surfaceH}}>
                      <TD>{key.replace(/_/g,' ')}</TD>
                      <TD mono>{val.factor}</TD>
                      <TD mono>{val.unit}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div style={{fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Mobile Combustion (gCO2e per passenger-km)</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><TH>Vehicle</TH><TH w={80}>EF</TH></tr></thead>
                <tbody>
                  {VEHICLE_TYPES.map((v,i)=>{
                    const ef=EMISSION_FACTORS.transport[v.value];
                    return(
                      <tr key={v.value} style={{background:i%2===0?T.surface:T.surfaceH}}>
                        <TD>{v.label}</TD>
                        <TD mono>{ef?ef.factor:'\u2014'}</TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{marginTop:12}}>
                <div style={{fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Process Emissions (kgCO2e per tonne)</div>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr><TH>Industry</TH><TH w={80}>EF</TH></tr></thead>
                  <tbody>
                    {INDUSTRY_PROCESSES.map((p,i)=>(
                      <tr key={p.value} style={{background:i%2===0?T.surface:T.surfaceH}}>
                        <TD>{p.label}</TD>
                        <TD mono color={p.ef>2000?T.red:p.ef>1000?T.amber:T.text}>{p.ef.toLocaleString()}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:12}}>
                <div style={{fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Fugitive (GWP-100 values)</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {REFRIGERANT_TYPES.map(r=>(
                    <div key={r.value} style={{padding:'3px 8px',background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:4,fontFamily:T.mono,fontSize:10}}>
                      <span style={{color:T.navy}}>{r.label.split('(')[0].trim()}</span>: <span style={{color:r.gwp>10000?T.red:r.gwp>1000?T.amber:T.green}}>{r.gwp.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Scope 1 Reduction Opportunities */}
        <Panel title="Scope 1 Reduction Opportunity Analysis" collapsible defaultOpen={false}>
          <InfoBox text="Based on current Scope 1 composition, the following reduction pathways are identified. Prioritize by cost-effectiveness ($/tCO2e abated) and implementation timeline." />
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><TH>Source</TH><TH>Current tCO2e</TH><TH>Reduction Pathway</TH><TH>Potential Reduction</TH><TH>Typical Cost</TH><TH>Timeline</TH></tr></thead>
            <tbody>
              {[
                {src:'Natural Gas Heating',cur:scope1StationaryTotal>0?'Primary stationary source':'\u2014',path:'Electrification (heat pumps)',red:'60-90%',cost:'$50-150/tCO2e',time:'2-4 years'},
                {src:'Diesel Generators',cur:'Backup power',path:'Battery storage + solar',red:'70-100%',cost:'$80-200/tCO2e',time:'1-3 years'},
                {src:'Fleet Vehicles',cur:scope1MobileTotal>0?'Fleet emissions':'\u2014',path:'EV transition',red:'50-80%',cost:'$20-80/tCO2e',time:'3-7 years'},
                {src:'Process Emissions',cur:scope1ProcessTotal>0?'Industrial process':'\u2014',path:'Process efficiency + CCS',red:'20-50%',cost:'$40-120/tCO2e',time:'5-10 years'},
                {src:'Refrigerants',cur:scope1FugitiveTotal>0?'HVAC/switchgear':'\u2014',path:'Low-GWP alternatives (R-32, R-290)',red:'60-80%',cost:'$10-50/tCO2e',time:'1-5 years'},
                {src:'SF6 Switchgear',cur:'Electrical',path:'SF6-free alternatives (vacuum, clean air)',red:'100%',cost:'$20-60/tCO2e',time:'3-8 years'},
              ].map((row,i)=>(
                <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <TD><strong>{row.src}</strong></TD>
                  <TD><span style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{row.cur}</span></TD>
                  <TD>{row.path}</TD>
                  <TD><Badge label={row.red} color={T.green} /></TD>
                  <TD><span style={{fontFamily:T.mono,fontSize:11,color:T.textSec}}>{row.cost}</span></TD>
                  <TD><span style={{fontFamily:T.mono,fontSize:11,color:T.textSec}}>{row.time}</span></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 3: SCOPE 2 — ENERGY INDIRECT
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderScope2=()=>{
    const comparisonData=facilities.map(f=>({
      name:f.name.length>18?f.name.slice(0,18)+'...':f.name,
      'Location-Based':calcS2Location(f),
      'Market-Based':calcS2Market(f),
    }));

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
          <KPICard label="Location-Based Total" value={fmtCO2(scope2LocationTotal)} color={T.navy} />
          <KPICard label="Market-Based Total" value={fmtCO2(scope2MarketTotal)} color={T.sage} />
          <KPICard label="Renewable Share" value={renewablePct.toFixed(1)+'%'} sub={`${formatN(renewableKwh)} / ${formatN(totalElecKwh)} kWh`} color={T.green} />
          <KPICard label="Market vs Location" value={(scope2LocationTotal>0?((scope2MarketTotal/scope2LocationTotal-1)*100).toFixed(1):0)+'%'} sub="Savings from procurement" color={scope2MarketTotal<scope2LocationTotal?T.green:T.red} />
        </div>

        {/* 3a. Location-Based */}
        <Panel title="3a. Location-Based Method" collapsible citation="Scope 2 Guidance (2015), Ch 6">
          <InfoBox text="Location-based method uses average grid emission factors for electricity delivered through the grid. Per GHG Protocol Scope 2 Guidance (2015), both location-based and market-based results must be reported." />
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH w={30}>#</TH><TH>Facility</TH><TH w={70}>Country</TH><TH w={120}>Electricity (kWh)</TH>
              <TH w={100}>Grid EF (gCO2/kWh)</TH><TH w={90}>Heat (kWh)</TH><TH w={90}>Cooling (kWh)</TH><TH w={100}>tCO2e</TH><TH w={40}></TH>
            </tr></thead>
            <tbody>
              {facilities.map((f,i)=>{
                const gi=GRID_INTENSITY.find(g=>g.iso2===f.country);
                const tco2=calcS2Location(f);
                return(
                  <tr key={f.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <TD mono>{i+1}</TD>
                    <TD>
                      <input value={f.name} onChange={e=>updateFacility(f.id,'name',e.target.value)}
                        style={{fontFamily:T.font,fontSize:12,border:'none',background:'transparent',width:'100%',outline:'none',color:T.text}} />
                    </TD>
                    <TD>
                      <select value={f.country} onChange={e=>updateFacility(f.id,'country',e.target.value)}
                        style={{fontFamily:T.mono,fontSize:11,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px'}}>
                        {GRID_INTENSITY.map(g=><option key={g.iso2} value={g.iso2}>{g.iso2} ({g.gCO2_kWh})</option>)}
                      </select>
                    </TD>
                    <TD>
                      <input type="number" value={f.elecKwh} onChange={e=>updateFacility(f.id,'elecKwh',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:90,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD mono>{gi?`${gi.gCO2_kWh} (${gi.primary.split('+')[0].trim()})`:'\u2014'}</TD>
                    <TD>
                      <input type="number" value={f.heatKwh} onChange={e=>updateFacility(f.id,'heatKwh',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:70,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD>
                      <input type="number" value={f.coolKwh} onChange={e=>updateFacility(f.id,'coolKwh',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:70,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD mono color={T.navy}>{tco2.toFixed(2)}</TD>
                    <TD><Btn small variant="danger" onClick={()=>removeFacility(f.id)}>\u2715</Btn></TD>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:T.navy+'08'}}>
                <td colSpan={7} style={{padding:'8px 10px',fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,textAlign:'right'}}>Total Location-Based:</td>
                <TD mono color={T.navy}>{scope2LocationTotal.toFixed(2)}</TD>
                <TD></TD>
              </tr>
            </tfoot>
          </table>
        </Panel>

        {/* 3b. Market-Based */}
        <Panel title="3b. Market-Based Method" collapsible citation="Scope 2 Guidance (2015), Ch 7">
          <InfoBox text="Market-based method uses supplier-specific EFs, RECs/GOs, PPAs, and residual mix factors. Hierarchy: (1) Energy attribute certificates, (2) Direct contracts / PPAs, (3) Supplier-specific EF, (4) Residual mix factor, (5) Grid average." />
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH w={30}>#</TH><TH>Facility</TH><TH w={100}>REC/GO (kWh)</TH>
              <TH w={100}>PPA (kWh)</TH><TH w={90}>PPA EF (kg/kWh)</TH><TH w={100}>Residual EF</TH><TH w={100}>Market tCO2e</TH>
            </tr></thead>
            <tbody>
              {facilities.map((f,i)=>{
                const tco2=calcS2Market(f);
                return(
                  <tr key={f.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <TD mono>{i+1}</TD>
                    <TD>{f.name}</TD>
                    <TD>
                      <input type="number" value={f.recKwh} onChange={e=>updateFacility(f.id,'recKwh',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:80,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                      {f.recKwh>0&&<Badge label={`${(f.recKwh/f.elecKwh*100).toFixed(0)}%`} color={T.green} />}
                    </TD>
                    <TD>
                      <input type="number" value={f.ppaKwh} onChange={e=>updateFacility(f.id,'ppaKwh',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:80,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD>
                      <input type="number" value={f.supplierEf||''} onChange={e=>updateFacility(f.id,'supplierEf',parseFloat(e.target.value)||null)}
                        style={{fontFamily:T.mono,fontSize:12,width:60,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} placeholder="\u2014" />
                    </TD>
                    <TD>
                      <input type="number" value={f.residualEf||''} onChange={e=>updateFacility(f.id,'residualEf',parseFloat(e.target.value)||null)}
                        style={{fontFamily:T.mono,fontSize:12,width:60,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} placeholder="grid avg" />
                    </TD>
                    <TD mono color={T.sage}>{tco2.toFixed(2)}</TD>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:T.sage+'10'}}>
                <td colSpan={6} style={{padding:'8px 10px',fontFamily:T.font,fontSize:12,fontWeight:700,color:T.sage,textAlign:'right'}}>Total Market-Based:</td>
                <TD mono color={T.sage}>{scope2MarketTotal.toFixed(2)}</TD>
              </tr>
            </tfoot>
          </table>
          <div style={{marginTop:10}}><Btn small variant="ghost" onClick={addFacility}>+ Add Facility</Btn></div>
        </Panel>

        {/* Comparison Chart */}
        <Panel title="Location-Based vs Market-Based Comparison">
          <div style={{height:280}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{left:20,right:20,top:10,bottom:40}}>
                <XAxis dataKey="name" tick={{fontFamily:T.font,fontSize:10,angle:-15}} interval={0} />
                <YAxis tick={{fontFamily:T.mono,fontSize:10}} />
                <Tooltip formatter={v=>[v.toFixed(2)+' tCO2e']} contentStyle={{fontFamily:T.mono,fontSize:11}} />
                <Legend wrapperStyle={{fontFamily:T.font,fontSize:11}} />
                <Bar dataKey="Location-Based" fill={T.navy} radius={[4,4,0,0]} />
                <Bar dataKey="Market-Based" fill={T.sage} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* 3c. Additional Energy Types */}
        <Panel title="3c. Additional Energy Purchases" collapsible defaultOpen={false} citation="Scope 2 Guidance Ch 6.4">
          <InfoBox text="In addition to electricity, Scope 2 includes purchased heat, steam, and cooling. District heating emission factors vary significantly by country and energy source." />
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH>Facility</TH><TH w={120}>Heat/Steam (kWh)</TH><TH w={120}>Heat EF (kgCO2e/kWh)</TH>
              <TH w={120}>Cooling (kWh)</TH><TH w={100}>Heat tCO2e</TH><TH w={100}>Cool tCO2e</TH>
            </tr></thead>
            <tbody>
              {facilities.map((f,i)=>{
                const gi=GRID_INTENSITY.find(g=>g.iso2===f.country);
                const heatT=(f.heatKwh*(f.heatEf||0.18))/1000;
                const coolT=(f.coolKwh*(gi?gi.gCO2_kWh:400))/1e6;
                return(
                  <tr key={f.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <TD>{f.name}</TD>
                    <TD>
                      <input type="number" value={f.heatKwh} onChange={e=>updateFacility(f.id,'heatKwh',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:90,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD>
                      <input type="number" value={f.heatEf||0.18} onChange={e=>updateFacility(f.id,'heatEf',parseFloat(e.target.value)||0.18)} step="0.01"
                        style={{fontFamily:T.mono,fontSize:12,width:70,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                      {DISTRICT_HEATING_EFS.find(dh=>dh.country===f.country)&&(
                        <span style={{fontFamily:T.mono,fontSize:9,color:T.textMut,marginLeft:4}}>
                          Default: {DISTRICT_HEATING_EFS.find(dh=>dh.country===f.country)?.ef}
                        </span>
                      )}
                    </TD>
                    <TD>
                      <input type="number" value={f.coolKwh} onChange={e=>updateFacility(f.id,'coolKwh',parseFloat(e.target.value)||0)}
                        style={{fontFamily:T.mono,fontSize:12,width:90,border:`1px solid ${T.border}`,borderRadius:3,padding:'2px 4px',textAlign:'right'}} />
                    </TD>
                    <TD mono>{heatT.toFixed(2)}</TD>
                    <TD mono>{coolT.toFixed(4)}</TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{marginTop:12}}>
            <div style={{fontFamily:T.font,fontSize:11,fontWeight:600,color:T.navy,marginBottom:6}}>Country-specific district heating factors:</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {DISTRICT_HEATING_EFS.map(dh=>(
                <div key={dh.country} style={{padding:'3px 8px',background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:4,fontFamily:T.mono,fontSize:10}}>
                  <span style={{color:T.navy}}>{dh.label}</span>: <span style={{color:T.sage}}>{dh.ef}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Scope 2 Quality Instrument Hierarchy */}
        <Panel title="Market-Based Instrument Hierarchy" collapsible defaultOpen={false} citation="Scope 2 Guidance, Table 6.1">
          <InfoBox text="The GHG Protocol Scope 2 Guidance specifies a hierarchy of contractual instruments. Apply in order until all purchased electricity is accounted for." />
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><TH>Priority</TH><TH>Instrument Type</TH><TH>Description</TH><TH w={80}>EF Impact</TH></tr></thead>
            <tbody>
              {[
                {pri:1,type:'Energy Attribute Certificates (EACs)',desc:'RECs (North America), GOs (Europe), I-RECs (Global). Purchased and retired. Must be from same market/grid as consumption.',ef:'Zero'},
                {pri:2,type:'Direct Contracts / PPAs',desc:'Power Purchase Agreements with specific generators. Virtual PPAs (financial) or physical PPAs. Use generator-specific EF.',ef:'Generator EF'},
                {pri:3,type:'Supplier/Utility Specific',desc:'Green tariff or certified renewable supply from utility. Must be backed by retired EACs.',ef:'Tariff EF'},
                {pri:4,type:'Residual Mix',desc:'Grid residual mix factor after EACs are removed from the grid mix. Typically higher than grid average.',ef:'Residual mix'},
                {pri:5,type:'Grid Average (Fallback)',desc:'National or sub-national grid average. Used only when no other instrument applies.',ef:'Grid avg'},
              ].map((row,i)=>(
                <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <TD mono>{row.pri}</TD>
                  <TD><strong>{row.type}</strong></TD>
                  <TD><span style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{row.desc}</span></TD>
                  <TD><Badge label={row.ef} color={row.pri<=2?T.green:row.pri<=3?T.sage:T.amber} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Renewable Energy Procurement Tracker */}
        <Panel title="Renewable Energy Procurement Summary" collapsible defaultOpen={true}>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:12}}>
            {facilities.map(f=>{
              const totalRenew=(f.recKwh||0)+(f.ppaKwh||0);
              const pct=f.elecKwh>0?(totalRenew/f.elecKwh*100):0;
              return(
                <div key={f.id} style={{flex:1,minWidth:200,padding:'12px 16px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface}}>
                  <div style={{fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,marginBottom:4}}>{f.name}</div>
                  <div style={{fontFamily:T.mono,fontSize:11,color:T.textSec}}>Total: {(f.elecKwh/1e6).toFixed(2)} GWh</div>
                  <div style={{display:'flex',gap:8,marginTop:6}}>
                    {f.recKwh>0&&<Badge label={`REC: ${(f.recKwh/1e6).toFixed(2)} GWh`} color={T.green} />}
                    {f.ppaKwh>0&&<Badge label={`PPA: ${(f.ppaKwh/1e6).toFixed(2)} GWh`} color={T.sage} />}
                  </div>
                  <div style={{marginTop:6,height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.min(pct,100)}%`,background:pct>=100?T.green:pct>=50?T.sage:T.amber,borderRadius:3}} />
                  </div>
                  <div style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:pct>=100?T.green:T.navy,marginTop:4}}>{pct.toFixed(1)}% renewable</div>
                </div>
              );
            })}
          </div>
          <div style={{padding:'10px 14px',background:T.green+'08',border:`1px solid ${T.green}20`,borderRadius:6}}>
            <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.green}}>
              RE100 Progress: {renewablePct.toFixed(1)}% of total electricity from renewable sources
            </div>
            <div style={{fontFamily:T.font,fontSize:11,color:T.textSec,marginTop:2}}>
              Target: 60% by 2030, 90% by 2040, 100% by 2050 (RE100 member pathway)
            </div>
          </div>
        </Panel>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 4: SCOPE 3 — VALUE CHAIN
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderScope3=()=>{
    const catBarData=SCOPE3_CATEGORIES.filter(c=>scope3[c.key]?.enabled&&scope3Totals.byCat[c.key]>0)
      .map(c=>({name:`Cat ${c.num}`,fullName:c.name,value:scope3Totals.byCat[c.key],pct:scope3Totals.total>0?(scope3Totals.byCat[c.key]/scope3Totals.total*100):0}));

    const relevantCats=SCOPE3_CATEGORIES.filter(c=>{
      if(!scope3[c.key]?.enabled)return false;
      const pct=scope3Totals.total>0?(scope3Totals.byCat[c.key]/scope3Totals.total*100):0;
      return pct>=5;
    });

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
          <KPICard label="Scope 3 Total" value={fmtCO2(scope3Totals.total)} color={T.navy} />
          <KPICard label="Categories Enabled" value={`${SCOPE3_CATEGORIES.filter(c=>scope3[c.key]?.enabled).length} / 15`} color={T.gold} />
          <KPICard label="Weighted DQS" value={scope3DqsAvg.toFixed(1)} sub={scope3DqsAvg<=2?'Good':scope3DqsAvg<=3?'Moderate':'Needs Improvement'} color={scope3DqsAvg<=2?T.green:scope3DqsAvg<=3?T.amber:T.red} />
          <KPICard label="Material Categories (\u22655%)" value={relevantCats.length.toString()} sub={relevantCats.map(c=>`Cat ${c.num}`).join(', ')} color={T.navyL} />
        </div>

        <InfoBox text="GHG Protocol Corporate Value Chain (Scope 3) Standard requires disclosure of all 15 categories. Categories may be excluded only with justification per the relevance assessment criteria (Chapter 3)." />

        {SCOPE3_CATEGORIES.map(cat=>{
          const d=scope3[cat.key];
          const tco2=scope3Totals.byCat[cat.key];
          const pct=scope3Totals.total>0?(tco2/scope3Totals.total*100):0;
          const spendEf=cat.spendKey?EMISSION_FACTORS.scope3_spend[cat.spendKey]:null;

          return(
            <Panel key={cat.key} title={`Category ${cat.num}: ${cat.name}`} collapsible defaultOpen={d.enabled&&tco2>0}
              citation={`Scope 3 Standard, Ch ${cat.num+4}`}>
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
                <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
                  <input type="checkbox" checked={d.enabled} onChange={e=>updateScope3(cat.key,'enabled',e.target.checked)} />
                  <span style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:d.enabled?T.navy:T.textMut}}>Include in Inventory</span>
                </label>
                {d.enabled&&tco2>0&&<Badge label={`${pct.toFixed(1)}% of Scope 3`} color={pct>=5?T.navy:T.textMut} />}
                {d.enabled&&pct>=5&&<Badge label="Material" color={T.amber} />}
                {d.enabled&&d.dqs>=4&&<Badge label={`DQS ${d.dqs}`} color={T.red} />}
                {!d.enabled&&<Badge label="Excluded" color={T.textMut} />}
              </div>

              {d.enabled&&(
                <div>
                  <div style={{fontFamily:T.font,fontSize:11,color:T.textSec,marginBottom:10}}>{cat.desc}</div>

                  <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:12}}>
                    <Sel label="Methodology" value={d.methodology} onChange={v=>updateScope3(cat.key,'methodology',v)}
                      options={[
                        {value:'spend',label:'Spend-Based (EXIOBASE)'},
                        {value:'activity',label:'Activity-Based'},
                        {value:'supplier',label:'Supplier-Specific'},
                      ]} width={200} />

                    <Sel label="Data Quality Score" value={d.dqs} onChange={v=>updateScope3(cat.key,'dqs',parseInt(v))}
                      options={[1,2,3,4,5].map(n=>({value:n,label:`DQS ${n} \u2014 ${n===1?'Verified':n===2?'Reported':n===3?'Activity-based':n===4?'Spend-based':'Proxy'}`}))} width={280} />
                  </div>

                  {d.methodology==='spend'&&(
                    <div style={{display:'flex',gap:16,alignItems:'flex-end',flexWrap:'wrap'}}>
                      <Inp label="Annual Spend (USD)" value={d.spend} onChange={v=>updateScope3(cat.key,'spend',v)} type="number" unit="$" width={150} />
                      {spendEf&&<div style={{fontFamily:T.mono,fontSize:11,color:T.textSec,paddingBottom:8}}>EF: {spendEf.factor} {spendEf.unit} ({spendEf.source})</div>}
                      <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.navy,paddingBottom:6}}>= {tco2.toFixed(2)} tCO2e</div>
                    </div>
                  )}

                  {(d.methodology==='activity'||d.methodology==='supplier')&&(
                    <div style={{display:'flex',gap:16,alignItems:'flex-end',flexWrap:'wrap'}}>
                      <Inp label="Activity Data" value={d.activity} onChange={v=>updateScope3(cat.key,'activity',v)} type="number" width={120} />
                      <Inp label="Unit" value={d.activityUnit} onChange={v=>updateScope3(cat.key,'activityUnit',v)} width={80} />
                      <Inp label="Emission Factor (tCO2e/unit)" value={d.customEf} onChange={v=>updateScope3(cat.key,'customEf',v)} type="number" width={150} />
                      <Inp label="EF Source" value={d.customEfSource} onChange={v=>updateScope3(cat.key,'customEfSource',v)} width={250} />
                      <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.navy,paddingBottom:6}}>= {tco2.toFixed(2)} tCO2e</div>
                    </div>
                  )}

                  <div style={{marginTop:8}}>
                    <Inp label="Notes" value={d.notes} onChange={v=>updateScope3(cat.key,'notes',v)} width={500} placeholder="Data source, assumptions, exclusions..." />
                  </div>

                  {/* Per-category guidance box */}
                  {SCOPE3_GUIDANCE[cat.key]&&(
                    <div style={{marginTop:10,padding:'10px 14px',background:T.navy+'06',border:`1px solid ${T.navy}15`,borderRadius:6}}>
                      <div style={{fontFamily:T.font,fontSize:11,fontWeight:600,color:T.navy,marginBottom:4}}>Methodology Guidance (Cat {cat.num}):</div>
                      <div style={{fontFamily:T.font,fontSize:11,color:T.textSec,lineHeight:1.5}}>{SCOPE3_GUIDANCE[cat.key]}</div>
                    </div>
                  )}

                  {/* Cat 4/9: Freight transport detail */}
                  {(cat.num===4||cat.num===9)&&d.methodology==='activity'&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Freight Transport Emission Factors (DEFRA 2023):</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {FREIGHT_MODES.map(fm=>(
                          <div key={fm.value} style={{padding:'4px 8px',background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:4,fontFamily:T.mono,fontSize:10}}>
                            <span style={{color:T.navy}}>{fm.label}</span>: <span style={{color:T.sage}}>{fm.ef} {fm.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cat 5: Waste type reference */}
                  {cat.num===5&&d.methodology==='activity'&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Waste Disposal Emission Factors (DEFRA 2023):</div>
                      <table style={{borderCollapse:'collapse',width:'100%'}}>
                        <thead><tr><TH>Disposal Method</TH><TH w={100}>EF (tCO2e/t)</TH><TH w={120}>Source</TH></tr></thead>
                        <tbody>
                          {WASTE_TYPES.map((wt,wi)=>(
                            <tr key={wt.value} style={{background:wi%2===0?T.surface:T.surfaceH}}>
                              <TD>{wt.label}</TD><TD mono>{wt.ef}</TD><TD><span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{wt.source}</span></TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Cat 6: Business travel modes */}
                  {cat.num===6&&d.methodology==='activity'&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Business Travel Emission Factors (DEFRA 2023, incl. RFI for flights):</div>
                      <table style={{borderCollapse:'collapse',width:'100%'}}>
                        <thead><tr><TH>Travel Mode</TH><TH w={120}>EF</TH><TH w={100}>Unit</TH><TH w={120}>Source</TH></tr></thead>
                        <tbody>
                          {BIZ_TRAVEL_MODES.map((bt,bi)=>(
                            <tr key={bt.value} style={{background:bi%2===0?T.surface:T.surfaceH}}>
                              <TD>{bt.label}</TD><TD mono>{bt.ef}</TD><TD mono>{bt.unit}</TD><TD><span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{bt.source}</span></TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Cat 7: Commute mode split */}
                  {cat.num===7&&d.methodology==='activity'&&(
                    <div style={{marginTop:12}}>
                      <InfoBox type="info" text="Activity-based commuting: FTE count \u00D7 average one-way distance \u00D7 2 (round trip) \u00D7 working days/year \u00D7 mode-specific EF. Default: 1.2 tCO2e/FTE/year (UK average from DEFRA 2023 business travel guidance)." />
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Commute Mode Split (Typical UK Distribution):</div>
                      <table style={{borderCollapse:'collapse',width:'100%'}}>
                        <thead><tr><TH>Mode</TH><TH w={100}>EF</TH><TH w={100}>Unit</TH><TH w={80}>Typical %</TH><TH w={120}>Source</TH></tr></thead>
                        <tbody>
                          {COMMUTE_MODES.map((cm,ci)=>(
                            <tr key={cm.value} style={{background:ci%2===0?T.surface:T.surfaceH}}>
                              <TD>{cm.label}</TD><TD mono>{cm.ef.toFixed(5)}</TD><TD mono>{cm.unit}</TD><TD mono>{cm.pct}%</TD>
                              <TD><span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{cm.source}</span></TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Cat 3: Fuel lifecycle WTT factors */}
                  {cat.num===3&&d.enabled&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Fuel Lifecycle (Well-to-Tank) Emission Factors:</div>
                      <table style={{borderCollapse:'collapse',width:'100%'}}>
                        <thead><tr><TH>Fuel / Factor</TH><TH w={100}>EF</TH><TH w={100}>Unit</TH><TH>Description</TH></tr></thead>
                        <tbody>
                          {Object.entries(FUEL_LIFECYCLE_FACTORS).map(([k,v],fi)=>(
                            <tr key={k} style={{background:fi%2===0?T.surface:T.surfaceH}}>
                              <TD>{k.replace(/_/g,' ')}</TD><TD mono>{v.factor}</TD><TD mono>{v.unit}</TD>
                              <TD><span style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{v.desc}</span></TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Cat 11: Product use profiles */}
                  {cat.num===11&&d.methodology==='activity'&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Typical Product Lifetime Energy Use Profiles:</div>
                      <table style={{borderCollapse:'collapse',width:'100%'}}>
                        <thead><tr><TH>Product</TH><TH w={100}>Annual kWh</TH><TH w={80}>Lifetime (yr)</TH><TH w={100}>Total kWh</TH><TH w={120}>Source</TH></tr></thead>
                        <tbody>
                          {PRODUCT_USE_PROFILES.map((p,pi)=>(
                            <tr key={p.value} style={{background:pi%2===0?T.surface:T.surfaceH}}>
                              <TD>{p.label}</TD><TD mono>{p.annualKwh.toLocaleString()}</TD><TD mono>{p.lifetimeYears}</TD>
                              <TD mono>{(p.annualKwh*p.lifetimeYears).toLocaleString()}</TD>
                              <TD><span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{p.source}</span></TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Cat 12: End-of-life methods */}
                  {cat.num===12&&d.enabled&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>End-of-Life Disposal Methods & Factors:</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                        {EOL_METHODS.map(eol=>(
                          <div key={eol.value} style={{padding:'6px 10px',background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:6,minWidth:140}}>
                            <div style={{fontFamily:T.font,fontSize:11,fontWeight:600,color:T.navy}}>{eol.label}</div>
                            <div style={{fontFamily:T.mono,fontSize:11,color:T.sage}}>{eol.ef} tCO2e/t</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cat 15: PCAF asset classes */}
                  {cat.num===15&&d.enabled&&(
                    <div style={{marginTop:12}}>
                      <InfoBox type="info" text="Category 15 (Investments) links to PCAF Financed Emissions module. For portfolio-level attribution, use the PCAF methodology (GHG/EVIC or GHG/Outstanding) via the PCAF Financed Emissions module." />
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>PCAF Asset Class Attribution Methods:</div>
                      <table style={{borderCollapse:'collapse',width:'100%'}}>
                        <thead><tr><TH>Asset Class</TH><TH>Attribution Method</TH><TH w={80}>Typical DQS</TH></tr></thead>
                        <tbody>
                          {PCAF_ASSET_CLASSES.map((ac,ai)=>(
                            <tr key={ac.value} style={{background:ai%2===0?T.surface:T.surfaceH}}>
                              <TD>{ac.label}</TD><TD>{ac.method}</TD>
                              <TD><Badge label={`DQS ${ac.dqs_typical}`} color={ac.dqs_typical<=2?T.green:ac.dqs_typical<=3?T.amber:T.red} /></TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Cat 1: Spend sector breakdown */}
                  {cat.num===1&&d.methodology==='spend'&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Spend-Based Sector Emission Factors (kgCO2e per $ spent):</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:6}}>
                        {SPEND_SECTORS.map(ss=>(
                          <div key={ss.value} style={{padding:'4px 8px',background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:4,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontFamily:T.font,fontSize:11,color:T.text}}>{ss.label}</span>
                            <span style={{fontFamily:T.mono,fontSize:11,fontWeight:600,color:T.sage}}>{ss.ef}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cat 2: Capital goods types */}
                  {cat.num===2&&d.methodology==='spend'&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontFamily:T.font,fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Capital Goods Sub-Categories (kgCO2e per $ spent):</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {CAPITAL_GOODS_TYPES.map(cg=>(
                          <div key={cg.value} style={{padding:'4px 8px',background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:4,fontFamily:T.mono,fontSize:10}}>
                            <span style={{color:T.navy}}>{cg.label}</span>: <span style={{color:T.sage}}>{cg.ef} kgCO2e/$</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Panel>
          );
        })}

        {/* Scope 3 Summary Chart */}
        <Panel title="Scope 3 Category Breakdown">
          <div style={{height:Math.max(280,catBarData.length*30+60)}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catBarData} layout="vertical" margin={{left:60,right:60,top:10,bottom:10}}>
                <XAxis type="number" tick={{fontFamily:T.mono,fontSize:10}} />
                <YAxis type="category" dataKey="name" tick={{fontFamily:T.mono,fontSize:10}} width={55} />
                <Tooltip formatter={(v,name,props)=>[`${v.toFixed(2)} tCO2e (${props.payload.pct.toFixed(1)}%)`,props.payload.fullName]} contentStyle={{fontFamily:T.mono,fontSize:11}} />
                <Bar dataKey="value" radius={[0,4,4,0]}>
                  {catBarData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 5: GWP & UNIT CONVERSIONS
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderGWP=()=>{
    const gwpEntries=Object.entries(GWP_VALUES).filter(([k])=>!k.includes('GWP20'));
    const gwp20Entries=Object.entries(GWP_VALUES).filter(([k])=>k.includes('GWP20'));

    const UNIT_CONVERSIONS={
      'tCO2e_to_ktCO2e':0.001,
      'tCO2e_to_MtCO2e':0.000001,
      'tCO2e_to_GtCO2e':0.000000001,
      'ktCO2e_to_tCO2e':1000,
      'ktCO2e_to_MtCO2e':0.001,
      'ktCO2e_to_GtCO2e':0.000001,
      'MtCO2e_to_tCO2e':1000000,
      'MtCO2e_to_ktCO2e':1000,
      'MtCO2e_to_GtCO2e':0.001,
      'GtCO2e_to_tCO2e':1000000000,
      'GtCO2e_to_ktCO2e':1000000,
      'GtCO2e_to_MtCO2e':1000,
      'kg_to_tonnes':0.001,
      'tonnes_to_kg':1000,
      'litres_to_m3':0.001,
      'm3_to_litres':1000,
    };
    const convKey=`${convFromUnit}_to_${convToUnit}`;
    const convFactor=UNIT_CONVERSIONS[convKey]||1;
    const convResult=convFrom*convFactor;

    const changePct=baseYearEmissions>0?(structuralChange/baseYearEmissions*100):0;
    const needsRecalc=Math.abs(changePct)>5;
    const adjustedBaseYear=baseYearEmissions+(structuralType==='acquisition'?structuralChange:-structuralChange);

    return(
      <div>
        {/* GWP-100 Table */}
        <Panel title="IPCC AR6 Global Warming Potentials (GWP-100)" citation="IPCC AR6 WG1, Chapter 7, Table 7.15">
          <InfoBox text="GWP-100 values convert non-CO2 greenhouse gases to CO2-equivalent. These values are used throughout the GHG Protocol framework for all emissions calculations. Source: IPCC Sixth Assessment Report (2021)." />
          <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:300}}>
              <div style={{fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>GWP-100 Year Values</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><TH>Gas</TH><TH w={80}>Formula</TH><TH w={100}>GWP-100</TH><TH>Category</TH></tr></thead>
                <tbody>
                  {gwpEntries.map(([key,val],i)=>{
                    const cat=key.startsWith('HFC')?'HFC':key.startsWith('C')||key==='c_C4F8'||key==='CF4'?'PFC':key==='NF3'?'Other F-gas':'Core';
                    return(
                      <tr key={key} style={{background:i%2===0?T.surface:T.surfaceH}}>
                        <TD>{key.replace(/_/g,' ').replace('fossil','(fossil)').replace('biogenic','(biogenic)')}</TD>
                        <TD mono>{key.replace('HFC_','HFC-').replace('CH4_fossil','CH\u2084').replace('CH4_biogenic','CH\u2084').replace('N2O','N\u2082O').replace('SF6','SF\u2086').replace('NF3','NF\u2083').replace('CF4','CF\u2084').replace('C2F6','C\u2082F\u2086').replace('C3F8','C\u2083F\u2088').replace('c_C4F8','c-C\u2084F\u2088')}</TD>
                        <TD mono color={val>1000?T.red:val>100?T.amber:T.text}>{val.toLocaleString()}</TD>
                        <TD><Badge label={cat} color={cat==='Core'?T.navy:cat==='HFC'?T.gold:cat==='PFC'?T.sage:T.navyL} /></TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{flex:0,minWidth:250}}>
              <div style={{fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>GWP-20 Year Values (Short-horizon)</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><TH>Gas</TH><TH w={100}>GWP-20</TH></tr></thead>
                <tbody>
                  {gwp20Entries.map(([key,val],i)=>(
                    <tr key={key} style={{background:i%2===0?T.surface:T.surfaceH}}>
                      <TD>{key.replace('_GWP20','').replace(/_/g,' ')}</TD>
                      <TD mono color={T.red}>{val}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              <InfoBox type="info" text="GWP-20 shows methane's much stronger short-term warming effect. Important for near-term climate strategy and ISSB S2 reporting." />
            </div>
          </div>
        </Panel>

        {/* Unit Converter */}
        <Panel title="Unit Converter Tool">
          <div style={{display:'flex',gap:16,alignItems:'flex-end',flexWrap:'wrap',marginBottom:16}}>
            <Inp label="Value" value={convFrom} onChange={setConvFrom} type="number" width={120} />
            <Sel label="From" value={convFromUnit} onChange={setConvFromUnit}
              options={['tCO2e','ktCO2e','MtCO2e','GtCO2e','kg','tonnes','litres','m3']} width={130} />
            <div style={{fontFamily:T.mono,fontSize:18,color:T.gold,paddingBottom:6}}>\u2192</div>
            <Sel label="To" value={convToUnit} onChange={setConvToUnit}
              options={['tCO2e','ktCO2e','MtCO2e','GtCO2e','kg','tonnes','litres','m3']} width={130} />
            <div style={{padding:'6px 16px',background:T.navy+'08',borderRadius:6,fontFamily:T.mono,fontSize:16,fontWeight:700,color:T.navy}}>
              = {convResult.toLocaleString(undefined,{maximumFractionDigits:6})} {convToUnit}
            </div>
          </div>
        </Panel>

        {/* Base Year Recalculation */}
        <Panel title="Base Year Recalculation Tool" citation="GHG Protocol Corporate Standard, Ch 5">
          <InfoBox text="Per GHG Protocol Chapter 5: If structural changes (mergers, acquisitions, divestitures) result in >5% change to the base year inventory, the base year must be recalculated. Organic growth or decline does NOT trigger recalculation." />
          <div style={{display:'flex',gap:16,alignItems:'flex-end',flexWrap:'wrap',marginBottom:16}}>
            <Inp label="Base Year Emissions (tCO2e)" value={baseYearEmissions} onChange={setBaseYearEmissions} type="number" width={160} />
            <Sel label="Change Type" value={structuralType} onChange={setStructuralType}
              options={[{value:'acquisition',label:'Acquisition / Merger'},{value:'divestiture',label:'Divestiture / Outsourcing'}]} width={200} />
            <Inp label="Emissions Change (tCO2e)" value={structuralChange} onChange={setStructuralChange} type="number" width={160} />
          </div>
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            <div style={{padding:'12px 16px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface}}>
              <div style={{fontFamily:T.font,fontSize:11,color:T.textMut}}>Change vs Base Year</div>
              <div style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:Math.abs(changePct)>5?T.red:T.green}}>{changePct.toFixed(1)}%</div>
              {needsRecalc?<Badge label="Recalculation Required" color={T.red} />:<Badge label="No Recalculation Needed" color={T.green} />}
            </div>
            {needsRecalc&&(
              <div style={{padding:'12px 16px',borderRadius:8,border:`1px solid ${T.navy}30`,background:T.navy+'06'}}>
                <div style={{fontFamily:T.font,fontSize:11,color:T.textMut}}>Adjusted Base Year</div>
                <div style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:T.navy}}>{formatN(adjustedBaseYear)} tCO2e</div>
                <div style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>Original: {formatN(baseYearEmissions)} | {structuralType==='acquisition'?'+':'-'}{formatN(structuralChange)}</div>
              </div>
            )}
          </div>
        </Panel>

        {renderCurrencyConverter()}
        {renderEFSourceReference()}
        {renderMaterialsReference()}
        {renderTransportReference()}
      </div>
    );
  };

  /* ─── Currency conversion sub-render (for GWP tab) ─── */
  const renderCurrencyConverter=()=>(
    <Panel title="Currency Conversion for Spend-Based Calculations" collapsible defaultOpen={false} citation="ECB / BIS March 2026">
      <InfoBox text="For Scope 3 spend-based calculations, all spend must be converted to a consistent currency (USD recommended). Apply exchange rates at the average rate for the reporting period." />
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr><TH>Currency</TH><TH w={100}>Rate to USD</TH><TH w={150}>Source</TH><TH w={140}>Example: 1M \u2192 USD</TH></tr></thead>
        <tbody>
          {EXCHANGE_RATES.map((er,i)=>(
            <tr key={er.from} style={{background:i%2===0?T.surface:T.surfaceH}}>
              <TD>{er.from}</TD>
              <TD mono>{er.rate}</TD>
              <TD><span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{er.source}</span></TD>
              <TD mono color={T.navy}>${(1000000*er.rate).toLocaleString(undefined,{maximumFractionDigits:0})}</TD>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );

  /* ─── EF Source Reference sub-render (for GWP tab) ─── */
  const renderEFSourceReference=()=>(
    <Panel title="Emission Factor Sources & Methodology Hierarchy" collapsible defaultOpen={false}>
      <InfoBox text="GHG Protocol establishes a hierarchy for emission factor selection. Prefer supplier-specific > national > sector average > global default." />
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr><TH>Priority</TH><TH>Source Type</TH><TH>Example</TH><TH>Applicable Scope</TH><TH w={80}>Typical DQS</TH></tr></thead>
        <tbody>
          {[
            {pri:1,type:'Supplier-Specific / Measured',ex:'Direct metering, stack testing, CEMS',scope:'Scope 1',dqs:1},
            {pri:2,type:'Verified / Audited Factors',ex:'Third-party assured per ISO 14064',scope:'All',dqs:1},
            {pri:3,type:'National Inventory Factors',ex:'UK DEFRA GHG Conversion Factors 2023',scope:'All',dqs:2},
            {pri:4,type:'National Grid Factor',ex:'Ember country grid intensity (gCO2/kWh)',scope:'Scope 2',dqs:2},
            {pri:5,type:'Technology-Specific LCA',ex:'EPD, PEF, ISO 14040/44 compliant LCA',scope:'Scope 3',dqs:2},
            {pri:6,type:'Sector Average Activity-Based',ex:'IEA sector benchmarks, worldsteel, GCCA',scope:'Scope 1/3',dqs:3},
            {pri:7,type:'Multi-Regional IO Model',ex:'EXIOBASE 3.8.2, GTAP, WIOD',scope:'Scope 3',dqs:4},
            {pri:8,type:'National IO Model',ex:'USEEIO v2.0 (EPA), BEIS supply-chain factors',scope:'Scope 3',dqs:4},
            {pri:9,type:'Sector Proxy / Estimate',ex:'PCAF DQS 5, CDP sector averages',scope:'Scope 3',dqs:5},
          ].map((row,i)=>(
            <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
              <TD mono>{row.pri}</TD>
              <TD>{row.type}</TD>
              <TD><span style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{row.ex}</span></TD>
              <TD><Badge label={row.scope} color={T.navy} /></TD>
              <TD><Badge label={`DQS ${row.dqs}`} color={row.dqs<=2?T.green:row.dqs<=3?T.amber:T.red} /></TD>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );

  /* ─── Materials / Industrial EF reference sub-render (for GWP tab) ─── */
  const renderMaterialsReference=()=>(
    <Panel title="Materials & Industrial Emission Factors" collapsible defaultOpen={false} citation="DEFRA 2023 / Industry LCA Sources">
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr><TH>Material</TH><TH w={120}>EF (kgCO2e/t)</TH><TH w={200}>Source</TH></tr></thead>
        <tbody>
          {Object.entries(EMISSION_FACTORS.materials).map(([key,val],i)=>(
            <tr key={key} style={{background:i%2===0?T.surface:T.surfaceH}}>
              <TD>{key.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase())}</TD>
              <TD mono color={val.factor>5000?T.red:val.factor>1000?T.amber:T.green}>{val.factor.toLocaleString()}</TD>
              <TD><span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{val.source}</span></TD>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );

  /* ─── Transport EF reference sub-render (for GWP tab) ─── */
  const renderTransportReference=()=>(
    <Panel title="Transport Emission Factors (Passenger)" collapsible defaultOpen={false} citation="DEFRA 2023">
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr><TH>Mode</TH><TH w={100}>EF</TH><TH w={100}>Unit</TH><TH w={150}>Source</TH><TH>Note</TH></tr></thead>
        <tbody>
          {Object.entries(EMISSION_FACTORS.transport).map(([key,val],i)=>(
            <tr key={key} style={{background:i%2===0?T.surface:T.surfaceH}}>
              <TD>{key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())}</TD>
              <TD mono>{val.factor}</TD>
              <TD mono>{val.unit}</TD>
              <TD><span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{val.source}</span></TD>
              <TD><span style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{val.note||'\u2014'}</span></TD>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 6: GHG INVENTORY SUMMARY
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderSummary=()=>{
    const scopeData=[
      {name:'Scope 1',value:scope1Total},
      {name:'Scope 2 (L)',value:scope2LocationTotal},
      {name:'Scope 3',value:scope3Totals.total},
    ];
    const donutData=scopeData.filter(d=>d.value>0);
    const donutColors=[T.navy,T.sage,'#8b5cf6'];

    const fullInventory=[
      {scope:'Scope 1',cat:'Stationary Combustion',tco2:scope1StationaryTotal},
      {scope:'Scope 1',cat:'Mobile Combustion',tco2:scope1MobileTotal},
      {scope:'Scope 1',cat:'Process Emissions',tco2:scope1ProcessTotal},
      {scope:'Scope 1',cat:'Fugitive Emissions',tco2:scope1FugitiveTotal},
      {scope:'Scope 2',cat:'Location-Based',tco2:scope2LocationTotal},
      {scope:'Scope 2',cat:'Market-Based',tco2:scope2MarketTotal},
      ...SCOPE3_CATEGORIES.filter(c=>scope3[c.key]?.enabled).map(c=>({scope:'Scope 3',cat:`Cat ${c.num}: ${c.name}`,tco2:scope3Totals.byCat[c.key]})),
    ];

    const stackedBarData=[
      {name:'Scope 1',Stationary:scope1StationaryTotal,Mobile:scope1MobileTotal,Process:scope1ProcessTotal,Fugitive:scope1FugitiveTotal},
    ];

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
          <KPICard label="Grand Total (Location-Based)" value={fmtCO2(grandTotal)} color={T.navy} />
          <KPICard label="Grand Total (Market-Based)" value={fmtCO2(grandTotalMarket)} color={T.sage} />
          <KPICard label="Intensity (tCO2e/$M Revenue)" value={intensityRevenue.toFixed(1)} sub={sectorBench?`Sector median: ${sectorBench.medianIntensity}`:''} color={sectorBench&&intensityRevenue<sectorBench.medianIntensity?T.green:T.amber} />
          <KPICard label="Intensity (tCO2e/Employee)" value={intensityEmployee.toFixed(1)} color={T.navyL} />
        </div>

        {/* Scope Breakdown Charts */}
        <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
          <Panel title="Emissions by Scope (tCO2e)">
            <div style={{height:280}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scopeData} margin={{left:20,right:20,top:10,bottom:10}}>
                  <XAxis dataKey="name" tick={{fontFamily:T.font,fontSize:11}} />
                  <YAxis tick={{fontFamily:T.mono,fontSize:10}} />
                  <Tooltip formatter={v=>[v.toFixed(2)+' tCO2e']} contentStyle={{fontFamily:T.mono,fontSize:11}} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {scopeData.map((_,i)=><Cell key={i} fill={donutColors[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Scope Distribution (%)">
            <div style={{height:280}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    label={({name,percent})=>`${name}: ${(percent*100).toFixed(1)}%`}
                    labelLine={{stroke:T.textMut,strokeWidth:1}}>
                    {donutData.map((_,i)=><Cell key={i} fill={donutColors[i]} />)}
                  </Pie>
                  <Tooltip formatter={v=>[v.toFixed(2)+' tCO2e']} contentStyle={{fontFamily:T.mono,fontSize:11}} />
                  <Legend wrapperStyle={{fontFamily:T.font,fontSize:11}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Sector Benchmark Comparison */}
        {sectorBench&&(
          <Panel title="Sector Benchmark Comparison" citation={`GICS ${sector} \u2014 ${sectorBench.sector}`}>
            <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:12}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontFamily:T.font,fontSize:11,color:T.textMut,marginBottom:4}}>Your Intensity (tCO2e/$M Revenue)</div>
                <div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:intensityRevenue<sectorBench.medianIntensity?T.green:T.red}}>{intensityRevenue.toFixed(1)}</div>
              </div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontFamily:T.font,fontSize:11,color:T.textMut,marginBottom:4}}>Sector Median</div>
                <div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:T.textSec}}>{sectorBench.medianIntensity}</div>
              </div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontFamily:T.font,fontSize:11,color:T.textMut,marginBottom:4}}>Paris-Aligned 2030 Target</div>
                <div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:T.green}}>{sectorBench.parisTarget2030}</div>
              </div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontFamily:T.font,fontSize:11,color:T.textMut,marginBottom:4}}>SBTi Method</div>
                <div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:T.navy}}>{sectorBench.sbtiMethod}</div>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>Required decarb rate: {sectorBench.decarbRate}% p.a.</div>
              </div>
            </div>
            {/* Visual comparison bar */}
            <div style={{marginTop:12}}>
              <div style={{fontFamily:T.font,fontSize:11,color:T.textSec,marginBottom:4}}>Position vs Sector</div>
              <div style={{position:'relative',height:32,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`,overflow:'hidden'}}>
                {/* Paris target marker */}
                <div style={{position:'absolute',left:`${Math.min((sectorBench.parisTarget2030/Math.max(sectorBench.medianIntensity*1.5,intensityRevenue*1.2))*100,95)}%`,top:0,bottom:0,width:2,background:T.green,zIndex:2}} />
                {/* Sector median marker */}
                <div style={{position:'absolute',left:`${Math.min((sectorBench.medianIntensity/Math.max(sectorBench.medianIntensity*1.5,intensityRevenue*1.2))*100,95)}%`,top:0,bottom:0,width:2,background:T.amber,zIndex:2}} />
                {/* Company position */}
                <div style={{position:'absolute',left:`${Math.min((intensityRevenue/Math.max(sectorBench.medianIntensity*1.5,intensityRevenue*1.2))*100,95)}%`,top:4,width:24,height:24,borderRadius:'50%',background:T.navy,border:`2px solid ${T.surface}`,zIndex:3,transform:'translateX(-12px)'}} />
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                <span style={{fontFamily:T.mono,fontSize:9,color:T.green}}>Paris Target ({sectorBench.parisTarget2030})</span>
                <span style={{fontFamily:T.mono,fontSize:9,color:T.amber}}>Sector Median ({sectorBench.medianIntensity})</span>
              </div>
            </div>
          </Panel>
        )}

        {/* Full Inventory Table */}
        <Panel title="Full GHG Inventory Table">
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><TH>Scope</TH><TH>Category / Source</TH><TH w={120}>tCO2e</TH><TH w={80}>% of Total</TH></tr></thead>
            <tbody>
              {fullInventory.map((row,i)=>(
                <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <TD><Badge label={row.scope} color={row.scope==='Scope 1'?T.navy:row.scope==='Scope 2'?T.sage:'#8b5cf6'} /></TD>
                  <TD>{row.cat}</TD>
                  <TD mono>{row.tco2.toFixed(2)}</TD>
                  <TD mono color={T.textSec}>{grandTotal>0?(row.tco2/grandTotal*100).toFixed(1):'0.0'}%</TD>
                </tr>
              ))}
              <tr style={{background:T.navy+'08'}}>
                <td colSpan={2} style={{padding:'10px',fontFamily:T.font,fontSize:13,fontWeight:700,color:T.navy}}>GRAND TOTAL (Location-Based)</td>
                <TD mono color={T.navy}><strong>{grandTotal.toFixed(2)}</strong></TD>
                <TD mono>100.0%</TD>
              </tr>
            </tbody>
          </table>
        </Panel>

        {/* Year-on-Year Comparison (Historical) */}
        <Panel title="Year-on-Year Emissions Trend" collapsible defaultOpen={true}>
          <InfoBox text="Historical emissions trajectory based on base year data. Actual reporting year data from this calculator is shown alongside modelled historical estimates for trend analysis." />
          {(()=>{
            const hist=HISTORICAL_EMISSIONS(42);
            const yoyData=hist.map(h=>({year:h.year,'Scope 1':Math.round(h.scope1),'Scope 2 (Loc)':Math.round(h.scope2_loc),'Scope 3':Math.round(h.scope3),Total:Math.round(h.scope1+h.scope2_loc+h.scope3)}));
            // Override the current year with actual calculated data
            const currentIdx=yoyData.findIndex(d=>d.year===reportingYear);
            if(currentIdx>=0){yoyData[currentIdx]={'Scope 1':Math.round(scope1Total),'Scope 2 (Loc)':Math.round(scope2LocationTotal),'Scope 3':Math.round(scope3Totals.total),Total:Math.round(grandTotal),year:reportingYear};}
            return(
              <div>
                <div style={{height:300,marginBottom:16}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yoyData} margin={{left:20,right:20,top:10,bottom:10}}>
                      <XAxis dataKey="year" tick={{fontFamily:T.mono,fontSize:11}} />
                      <YAxis tick={{fontFamily:T.mono,fontSize:10}} />
                      <Tooltip formatter={v=>[v.toLocaleString()+' tCO2e']} contentStyle={{fontFamily:T.mono,fontSize:11}} />
                      <Legend wrapperStyle={{fontFamily:T.font,fontSize:11}} />
                      <Bar dataKey="Scope 1" stackId="a" fill={T.navy} />
                      <Bar dataKey="Scope 2 (Loc)" stackId="a" fill={T.sage} />
                      <Bar dataKey="Scope 3" stackId="a" fill="#8b5cf6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>
                    <TH>Year</TH><TH>Scope 1</TH><TH>Scope 2 (Loc)</TH><TH>Scope 3</TH><TH>Total</TH><TH>YoY Change</TH>
                  </tr></thead>
                  <tbody>
                    {yoyData.map((row,i)=>{
                      const prev=i>0?yoyData[i-1].Total:null;
                      const yoy=prev?((row.Total-prev)/prev*100):null;
                      return(
                        <tr key={row.year} style={{background:row.year===reportingYear?T.gold+'15':i%2===0?T.surface:T.surfaceH}}>
                          <TD mono>{row.year}{row.year===reportingYear?' (Current)':''}</TD>
                          <TD mono>{row['Scope 1'].toLocaleString()}</TD>
                          <TD mono>{row['Scope 2 (Loc)'].toLocaleString()}</TD>
                          <TD mono>{row['Scope 3'].toLocaleString()}</TD>
                          <TD mono color={T.navy}><strong>{row.Total.toLocaleString()}</strong></TD>
                          <TD mono color={yoy!=null?(yoy<0?T.green:T.red):T.textMut}>
                            {yoy!=null?`${yoy>0?'+':''}${yoy.toFixed(1)}%`:'\u2014'}
                          </TD>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </Panel>

        {/* Grid Intensity Reference Table */}
        <Panel title="Grid Emission Factors Reference (50 Countries)" collapsible defaultOpen={false} citation="Ember Global Electricity Review 2024">
          <div style={{maxHeight:400,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
                <TH>Country</TH><TH w={50}>ISO</TH><TH w={100}>gCO2/kWh</TH><TH>Primary Source</TH>
                <TH w={80}>Category</TH>
              </tr></thead>
              <tbody>
                {GRID_INTENSITY.map((g,i)=>{
                  const cat=g.gCO2_kWh<100?'Very Low':g.gCO2_kWh<200?'Low':g.gCO2_kWh<400?'Medium':g.gCO2_kWh<600?'Higher':'High';
                  const catCol=g.gCO2_kWh<100?T.green:g.gCO2_kWh<200?'#16a34a':g.gCO2_kWh<400?T.amber:g.gCO2_kWh<600?'#ea580c':T.red;
                  return(
                    <tr key={g.iso2} style={{background:i%2===0?T.surface:T.surfaceH}}>
                      <TD>{g.country}</TD>
                      <TD mono>{g.iso2}</TD>
                      <TD mono color={catCol}>{g.gCO2_kWh}</TD>
                      <TD><span style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{g.primary}</span></TD>
                      <TD><Badge label={cat} color={catCol} /></TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Scope 3 DQS Detailed Summary */}
        <Panel title="Scope 3 Data Quality Score (DQS) Summary" collapsible defaultOpen={false} citation="PCAF Global Standard / GHG Protocol">
          <InfoBox text="DQS ranges from 1 (highest quality \u2014 audited/verified) to 5 (lowest \u2014 sector average proxy). GHG Protocol recommends improving data quality over time. Target: weighted average DQS \u2264 3.0." />
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH>Category</TH><TH w={60}>DQS</TH><TH>Methodology</TH><TH w={100}>tCO2e</TH><TH w={80}>% of S3</TH><TH>Recommendation</TH>
            </tr></thead>
            <tbody>
              {SCOPE3_CATEGORIES.filter(c=>scope3[c.key]?.enabled).map((c,i)=>{
                const d=scope3[c.key];
                const tco2=scope3Totals.byCat[c.key];
                const pct=scope3Totals.total>0?(tco2/scope3Totals.total*100):0;
                const rec=d.dqs>=4&&pct>=5?'Upgrade to activity-based':d.dqs>=3&&pct>=10?'Engage suppliers for specific data':d.dqs<=2?'Maintain current quality':'Acceptable for materiality level';
                return(
                  <tr key={c.key} style={{background:i%2===0?T.surface:T.surfaceH}}>
                    <TD>Cat {c.num}: {c.name}</TD>
                    <TD><Badge label={`DQS ${d.dqs}`} color={d.dqs<=2?T.green:d.dqs<=3?T.amber:T.red} /></TD>
                    <TD>{d.methodology==='spend'?'Spend-Based (EXIOBASE)':d.methodology==='activity'?'Activity-Based':'Supplier-Specific'}</TD>
                    <TD mono>{tco2.toFixed(0)}</TD>
                    <TD mono>{pct.toFixed(1)}%</TD>
                    <TD><span style={{fontFamily:T.font,fontSize:11,color:d.dqs>=4&&pct>=5?T.red:T.textSec}}>{rec}</span></TD>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:T.navy+'08'}}>
                <td style={{padding:'8px 10px',fontFamily:T.font,fontSize:12,fontWeight:700,color:T.navy}}>Weighted Average</td>
                <td style={{padding:'8px 10px'}}><Badge label={`DQS ${scope3DqsAvg.toFixed(1)}`} color={scope3DqsAvg<=2?T.green:scope3DqsAvg<=3?T.amber:T.red} /></td>
                <td colSpan={4} style={{padding:'8px 10px',fontFamily:T.font,fontSize:11,color:T.textSec}}>
                  {scope3DqsAvg<=3?'Meets recommended threshold (\u2264 3.0)':'Above recommended threshold \u2014 prioritize data quality improvements for material categories'}
                </td>
              </tr>
            </tfoot>
          </table>
        </Panel>

        {/* Intensity Metrics Detailed */}
        <Panel title="Intensity Metrics & Benchmarking" collapsible defaultOpen={true}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><TH>Metric</TH><TH w={120}>Value</TH><TH w={100}>Unit</TH><TH>Context</TH></tr></thead>
            <tbody>
              <tr style={{background:T.surface}}>
                <TD>Carbon Intensity (Revenue)</TD>
                <TD mono color={T.navy}>{intensityRevenue.toFixed(1)}</TD>
                <TD mono>tCO2e/$M</TD>
                <TD>{sectorBench?`Sector median: ${sectorBench.medianIntensity} tCO2e/$M (${sectorBench.sector})`:'\u2014'}</TD>
              </tr>
              <tr style={{background:T.surfaceH}}>
                <TD>Carbon Intensity (Employee)</TD>
                <TD mono color={T.navy}>{intensityEmployee.toFixed(1)}</TD>
                <TD mono>tCO2e/FTE</TD>
                <TD>Global average (services): ~5-15 tCO2e/FTE; Industrial: 30-200 tCO2e/FTE</TD>
              </tr>
              <tr style={{background:T.surface}}>
                <TD>Scope 1+2 Intensity</TD>
                <TD mono color={T.navy}>{revenue>0?((scope1Total+scope2LocationTotal)/(revenue/1e6)).toFixed(1):'\u2014'}</TD>
                <TD mono>tCO2e/$M</TD>
                <TD>Direct operational intensity (excl. value chain)</TD>
              </tr>
              <tr style={{background:T.surfaceH}}>
                <TD>Scope 3 Share</TD>
                <TD mono color={'#8b5cf6'}>{grandTotal>0?(scope3Totals.total/grandTotal*100).toFixed(1):0}%</TD>
                <TD mono>%</TD>
                <TD>Typical: 70-90% for financial services, 60-80% for manufacturing</TD>
              </tr>
              <tr style={{background:T.surface}}>
                <TD>Market-Based Savings</TD>
                <TD mono color={T.green}>{scope2LocationTotal>0?((1-scope2MarketTotal/scope2LocationTotal)*100).toFixed(1):0}%</TD>
                <TD mono>%</TD>
                <TD>Reduction achieved through renewable energy procurement</TD>
              </tr>
              <tr style={{background:T.surfaceH}}>
                <TD>Renewable Electricity Share</TD>
                <TD mono color={T.green}>{renewablePct.toFixed(1)}</TD>
                <TD mono>%</TD>
                <TD>RE100 target: 100% renewable by 2050 (interim: 60% by 2030)</TD>
              </tr>
            </tbody>
          </table>
        </Panel>

        {/* District Heating Reference */}
        <Panel title="District Heating Emission Factors by Country" collapsible defaultOpen={false}>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {DISTRICT_HEATING_EFS.map(dh=>(
              <div key={dh.country} style={{padding:'8px 12px',background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:6,minWidth:160}}>
                <div style={{fontFamily:T.font,fontSize:11,fontWeight:600,color:T.navy}}>{dh.label}</div>
                <div style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.sage}}>{dh.ef} kgCO2e/kWh</div>
                <div style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>{dh.source}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Data Validation */}
        {validationIssues.length>0&&(
          <Panel title={`Data Validation (${validationIssues.length} items)`} collapsible>
            {validationIssues.map((issue,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                <Badge label={issue.type.toUpperCase()} color={issue.type==='error'?T.red:issue.type==='warn'?T.amber:T.navyL} />
                <span style={{fontFamily:T.font,fontSize:12,color:T.text}}>{issue.msg}</span>
              </div>
            ))}
          </Panel>
        )}

        {/* Export Section */}
        <Panel title="Export GHG Inventory">
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <Btn onClick={downloadCSV}>Download CSV</Btn>
            <Btn variant="gold" onClick={downloadJSON}>Download JSON (Structured)</Btn>
            <Btn variant="ghost" onClick={()=>{
              const cdp=buildInventoryJSON();
              cdp.metadata.format='CDP Climate Change C6/C7';
              cdp.metadata.note='Aligned with CDP questionnaire sections C6 (Emissions data) and C7 (Emissions breakdown)';
              const blob=new Blob([JSON.stringify(cdp,null,2)],{type:'application/json'});
              const url=URL.createObjectURL(blob);
              const a=document.createElement('a');a.href=url;a.download=`CDP_Format_${companyName.replace(/\s+/g,'_')}_FY${reportingYear}.json`;a.click();
              URL.revokeObjectURL(url);
            }}>CDP-Format Export (C6/C7)</Btn>
          </div>
          <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginTop:8}}>CSV: Full inventory table | JSON: Structured data for downstream modules | CDP: Aligned with CDP Climate Change questionnaire C6.1-C6.5, C7.1a-C7.9b</div>
        </Panel>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     TAB 7: DOWNSTREAM CONNECTIONS
     ═══════════════════════════════════════════════════════════════════════════ */
  const renderDownstream=()=>{
    const connections=[
      {
        id:'pcaf',module:'PCAF Financed Emissions',icon:'\uD83C\uDFE6',color:'#0c4a6e',
        desc:'Scope 3 Category 15 data feeds into financed emissions attribution via PCAF methodology',
        fields:['scope3.byCat.cat15 (tCO2e)','company.evic','company.revenue','boundary.approach'],
        format:'JSON: {investee_emissions, attribution_factor, asset_class}',
        path:'/pcaf-financed-emissions',
      },
      {
        id:'sbti',module:'SBTi Target Setter',icon:'\uD83C\uDFAF',color:'#059669',
        desc:'Total emissions inventory serves as the baseline for science-based target setting',
        fields:['scope1.total','scope2.locationBased','scope2.marketBased','scope3.total','scope3.byCat','company.sector'],
        format:'JSON: {base_year_emissions, sector, target_type, time_horizon}',
        path:'/decarbonisation-roadmap',
      },
      {
        id:'csrd',module:'CSRD ESRS E1 Disclosure',icon:'\uD83D\uDCCB',color:'#7c3aed',
        desc:'Scope 1/2/3 data maps directly to ESRS E1-6 disclosure datapoints for EU reporting',
        fields:['scope1.total (E1-6 para 44)','scope2.locationBased (E1-6 para 46)','scope2.marketBased (E1-6 para 47)','scope3.byCat (E1-6 para 51)'],
        format:'XBRL/JSON: {esrs_e1_6_datapoints}',
        path:'/csrd-esrs-automation',
      },
      {
        id:'sfdr',module:'SFDR PAI #1-3',icon:'\uD83D\uDCCA',color:'#0ea5e9',
        desc:'Portfolio-level GHG metrics: PAI #1 (Total GHG), #2 (Carbon Footprint), #3 (GHG Intensity)',
        fields:['scope1.total','scope2.total','scope3.total','company.evic','portfolio.nav'],
        format:'JSON: {pai_1_total_ghg, pai_2_carbon_footprint_per_m, pai_3_ghg_intensity}',
        path:'/sfdr-art9',
      },
      {
        id:'temp',module:'Portfolio Temperature Score',icon:'\uD83C\uDF21\uFE0F',color:'#f59e0b',
        desc:'Emission trajectory data feeds into implied temperature rise calculation',
        fields:['scope1.total','scope2.total','scope3.total','base_year','base_year_emissions','sector.decarbRate'],
        format:'JSON: {emission_trajectory, sector_pathway, implied_temperature_rise}',
        path:'/portfolio-temperature-score',
      },
      {
        id:'cbam',module:'CBAM Compliance',icon:'\uD83C\uDDEA\uD83C\uDDFA',color:'#dc2626',
        desc:'Scope 1 emissions of imported goods = embedded emissions for EU CBAM reporting',
        fields:['scope1.process (tCO2e per product)','scope1.stationary (allocated)','product.cn_code','product.origin_country'],
        format:'JSON: {embedded_emissions_per_tonne, product_code, origin, cbam_certificates_required}',
        path:'/cbam-compliance',
      },
      {
        id:'budget',module:'Carbon Budget',icon:'\uD83C\uDF0D',color:'#16a34a',
        desc:'Total emissions vs remaining 1.5/2.0\u00B0C global carbon budget allocation',
        fields:['totals.grandTotal','company.revenue','company.sector','ipcc.remaining_budget'],
        format:'JSON: {company_budget_share, years_remaining, overshoot_risk}',
        path:'/carbon-budget',
      },
    ];

    return(
      <div>
        <Panel title="Data Flow Architecture" citation="GHG Protocol \u2192 Downstream Module Integration">
          <InfoBox text="This Carbon Calculator is the foundation data source for 7 downstream climate modules. Each module consumes specific fields from the GHG inventory via structured JSON payloads." />

          {/* Visual flow */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24,flexWrap:'wrap',gap:16}}>
            <div style={{padding:'16px 24px',borderRadius:12,background:T.navy,color:'#fff',fontFamily:T.font,fontSize:14,fontWeight:700,textAlign:'center',minWidth:180}}>
              GHG Protocol<br />Carbon Calculator
              <div style={{fontFamily:T.mono,fontSize:10,color:T.goldL,marginTop:4}}>{fmtCO2(grandTotal)}</div>
            </div>
            <div style={{fontFamily:T.mono,fontSize:24,color:T.gold}}>\u2192</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {connections.map(c=>(
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:c.color}} />
                  <span style={{fontFamily:T.font,fontSize:11,color:T.text}}>{c.module}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Connection Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(400px,1fr))',gap:16}}>
          {connections.map(c=>(
            <div key={c.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',background:c.color+'10',borderBottom:`2px solid ${c.color}30`,display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20}}>{c.icon}</span>
                <div>
                  <div style={{fontFamily:T.font,fontSize:13,fontWeight:700,color:T.navy}}>{c.module}</div>
                  <div style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{c.desc}</div>
                </div>
              </div>
              <div style={{padding:'12px 16px'}}>
                <div style={{fontFamily:T.font,fontSize:11,fontWeight:600,color:T.textMut,marginBottom:6}}>Fields Consumed:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>
                  {c.fields.map((f,i)=><span key={i} style={{fontFamily:T.mono,fontSize:10,background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:4,padding:'2px 6px',color:T.text}}>{f}</span>)}
                </div>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:10}}>{c.format}</div>
                <Btn small variant="ghost" onClick={()=>{
                  const payload=buildInventoryJSON();
                  payload.metadata.targetModule=c.module;
                  payload.metadata.exportedFields=c.fields;
                  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
                  const url=URL.createObjectURL(blob);
                  const a=document.createElement('a');a.href=url;a.download=`Export_to_${c.id.toUpperCase()}_${reportingYear}.json`;a.click();
                  URL.revokeObjectURL(url);
                }}>Export to {c.module}</Btn>
              </div>
            </div>
          ))}
        </div>

        {/* Regulatory Alignment Matrix */}
        <Panel title="Regulatory Alignment Matrix" collapsible defaultOpen={true}>
          <InfoBox text="This GHG inventory data maps to mandatory disclosure requirements across multiple regulatory frameworks. The table below shows which inventory fields satisfy which regulation." />
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH>Regulation</TH><TH>Requirement</TH><TH>Data Source from Calculator</TH><TH w={80}>Status</TH>
            </tr></thead>
            <tbody>
              {[
                {reg:'EU CSRD (ESRS E1)',req:'E1-6 para 44: Gross Scope 1 GHG emissions',src:'scope1.total',ready:scope1Total>0},
                {reg:'EU CSRD (ESRS E1)',req:'E1-6 para 46: Gross Scope 2 GHG (location-based)',src:'scope2.locationBased',ready:scope2LocationTotal>0},
                {reg:'EU CSRD (ESRS E1)',req:'E1-6 para 47: Gross Scope 2 GHG (market-based)',src:'scope2.marketBased',ready:scope2MarketTotal>0},
                {reg:'EU CSRD (ESRS E1)',req:'E1-6 para 51: Gross Scope 3 GHG by category',src:'scope3.byCat.*',ready:scope3Totals.total>0},
                {reg:'EU CSRD (ESRS E1)',req:'E1-6 para 53: GHG intensity per net revenue',src:'totals.intensityRevenue',ready:intensityRevenue>0},
                {reg:'SFDR RTS',req:'PAI #1: GHG emissions (Scope 1+2+3)',src:'scope1+scope2+scope3',ready:grandTotal>0},
                {reg:'SFDR RTS',req:'PAI #2: Carbon footprint (per EUR M invested)',src:'totals.grandTotal / investmentValue',ready:grandTotal>0},
                {reg:'SFDR RTS',req:'PAI #3: GHG intensity of investee companies',src:'totals.intensityRevenue',ready:intensityRevenue>0},
                {reg:'SEC Climate Rule',req:'Scope 1 emissions disclosure (all registrants)',src:'scope1.total',ready:scope1Total>0},
                {reg:'SEC Climate Rule',req:'Scope 2 emissions disclosure (all registrants)',src:'scope2.locationBased + scope2.marketBased',ready:scope2LocationTotal>0},
                {reg:'SEC Climate Rule',req:'Scope 3 if material (LAF/AF only, if > 1% of total)',src:'scope3.total (if material)',ready:scope3Totals.total>0},
                {reg:'ISSB S2',req:'S2.29: Scope 1+2 absolute emissions',src:'scope1.total + scope2.*',ready:scope1Total>0},
                {reg:'ISSB S2',req:'S2.29: Scope 3 emissions by category',src:'scope3.byCat.*',ready:scope3Totals.total>0},
                {reg:'CDP Climate',req:'C6.1: Scope 1 by business division/facility',src:'scope1.* (disaggregated by entity)',ready:scope1Total>0},
                {reg:'CDP Climate',req:'C6.3: Scope 2 location-based & market-based',src:'scope2.locationBased + scope2.marketBased',ready:scope2LocationTotal>0},
                {reg:'CDP Climate',req:'C6.5: Scope 3 by category with methodology',src:'scope3.byCat.* + methodology + DQS',ready:scope3Totals.total>0},
                {reg:'UK SDR',req:'Sustainability entity report: GHG metrics',src:'scope1 + scope2 + scope3',ready:grandTotal>0},
                {reg:'EU CBAM',req:'Embedded emissions per product (Scope 1)',src:'scope1.process (per tonne product)',ready:scope1ProcessTotal>0},
                {reg:'SBTi Validation',req:'Base year emissions inventory (all scopes)',src:'Full GHG inventory + base year',ready:grandTotal>0&&baseYear>0},
                {reg:'PCAF Standard',req:'Scope 3 Cat 15 for financed emissions',src:'scope3.byCat.cat15',ready:scope3Totals.byCat.cat15>0},
                {reg:'TCFD/TNFD',req:'Metrics & Targets: GHG emissions Scope 1/2/3',src:'Full inventory',ready:grandTotal>0},
              ].map((row,i)=>(
                <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <TD><Badge label={row.reg} color={T.navy} /></TD>
                  <TD>{row.req}</TD>
                  <TD><span style={{fontFamily:T.mono,fontSize:10,color:T.textSec}}>{row.src}</span></TD>
                  <TD>
                    {row.ready?
                      <Badge label="Ready" color={T.green} />:
                      <Badge label="Missing Data" color={T.red} />
                    }
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Methodology Comparison: Spend vs Activity vs Supplier */}
        <Panel title="Methodology Comparison Guide" collapsible defaultOpen={false}>
          <InfoBox text="The GHG Protocol Scope 3 Standard allows three calculation approaches. Higher-quality approaches yield more actionable data for decarbonization but require more effort to collect." />
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <TH>Dimension</TH><TH>Spend-Based</TH><TH>Activity-Based</TH><TH>Supplier-Specific</TH>
            </tr></thead>
            <tbody>
              {[
                {dim:'Data Required',spend:'$ spent by category',activity:'Physical quantities (kg, km, kWh)',supplier:'Supplier product-level emissions'},
                {dim:'Emission Factors',spend:'EXIOBASE / USEEIO (kgCO2e/$)',activity:'DEFRA / national EFs (kgCO2e/unit)',supplier:'Supplier EPDs / PCFs'},
                {dim:'Typical DQS',spend:'4 (Economic)',activity:'3 (Physical)',supplier:'1-2 (Specific)'},
                {dim:'Data Availability',spend:'High (spend data readily available)',activity:'Medium (requires operational data)',supplier:'Low (requires supplier engagement)'},
                {dim:'Accuracy',spend:'Low (sector averages)',activity:'Medium (activity-specific)',supplier:'High (product-specific)'},
                {dim:'Actionability',spend:'Low (cannot identify reduction levers)',activity:'Medium (identifies high-emission activities)',supplier:'High (identifies supplier-specific hotspots)'},
                {dim:'Cost to Implement',spend:'Low',activity:'Medium',supplier:'High'},
                {dim:'GHG Protocol Recommendation',spend:'Screening / initial estimate',activity:'Preferred for material categories',supplier:'Best practice for top suppliers'},
                {dim:'Use Case',spend:'All 15 categories initially',activity:'Categories 4-7 (transport, travel, commuting)',supplier:'Category 1 (top 20 suppliers)'},
                {dim:'Improvement Path',spend:'Start here \u2192 prioritize material categories',activity:'Upgrade from spend-based',supplier:'Engage key suppliers'},
              ].map((row,i)=>(
                <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <TD><strong>{row.dim}</strong></TD>
                  <TD><span style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{row.spend}</span></TD>
                  <TD><span style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{row.activity}</span></TD>
                  <TD><span style={{fontFamily:T.font,fontSize:11,color:T.textSec}}>{row.supplier}</span></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* GHG Protocol Completeness Checklist */}
        <Panel title="GHG Protocol Completeness Checklist" collapsible defaultOpen={false}>
          {(()=>{
            const checks=[
              {item:'Organizational boundary defined',done:boundaryApproach!=='',ref:'Ch 3'},
              {item:'Consolidation approach selected',done:true,ref:'Ch 3.1'},
              {item:'All entities listed with ownership %',done:entities.length>=2,ref:'Ch 3.2'},
              {item:'Base year identified',done:baseYear>0&&baseYear<reportingYear,ref:'Ch 5'},
              {item:'Scope 1: Stationary combustion',done:stationary.length>0&&scope1StationaryTotal>0,ref:'Ch 4.2'},
              {item:'Scope 1: Mobile combustion',done:mobile.length>0,ref:'Ch 4.2'},
              {item:'Scope 1: Process emissions assessed',done:process.length>0||true,ref:'Ch 4.2'},
              {item:'Scope 1: Fugitive emissions assessed',done:fugitive.length>0,ref:'Ch 4.2'},
              {item:'Scope 2: Location-based reported',done:scope2LocationTotal>0,ref:'S2 Guidance Ch 6'},
              {item:'Scope 2: Market-based reported',done:scope2MarketTotal>=0,ref:'S2 Guidance Ch 7'},
              {item:'Scope 2: Dual reporting (both methods)',done:scope2LocationTotal>0,ref:'S2 Guidance Ch 4'},
              {item:'Scope 3: Relevance assessment completed',done:SCOPE3_CATEGORIES.filter(c=>scope3[c.key]?.enabled).length>=3,ref:'S3 Standard Ch 3'},
              {item:'Scope 3: All material categories included',done:SCOPE3_CATEGORIES.filter(c=>scope3[c.key]?.enabled).length>=5,ref:'S3 Standard Ch 3'},
              {item:'Scope 3: Data quality assessed',done:scope3DqsAvg>0,ref:'S3 Standard Ch 4'},
              {item:'Sector benchmark comparison',done:!!sectorBench,ref:'Best practice'},
              {item:'Intensity metrics calculated',done:intensityRevenue>0,ref:'Ch 9'},
              {item:'Revenue denominator provided',done:revenue>0,ref:'Ch 9'},
              {item:'Employee count provided',done:employees>0,ref:'Best practice'},
            ];
            const doneCt=checks.filter(c=>c.done).length;
            return(
              <div>
                <div style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>
                  Completeness: {doneCt}/{checks.length} ({(doneCt/checks.length*100).toFixed(0)}%)
                </div>
                <div style={{height:8,background:T.surfaceH,borderRadius:4,marginBottom:16,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(doneCt/checks.length*100)}%`,background:doneCt===checks.length?T.green:doneCt/checks.length>=0.8?T.amber:T.red,borderRadius:4,transition:'width 0.3s'}} />
                </div>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr><TH w={30}></TH><TH>Checklist Item</TH><TH w={120}>GHG Protocol Ref</TH></tr></thead>
                  <tbody>
                    {checks.map((c,i)=>(
                      <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
                        <TD><span style={{color:c.done?T.green:T.red,fontFamily:T.mono,fontSize:14}}>{c.done?'\u2713':'\u2717'}</span></TD>
                        <TD>{c.item}</TD>
                        <TD><span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>{c.ref}</span></TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </Panel>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font}}>
      {/* Header */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:'16px 32px',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <div>
            <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,letterSpacing:'.08em',textTransform:'uppercase'}}>Carbon Calculator / GHG Protocol</div>
            <h1 style={{fontFamily:T.font,fontSize:22,fontWeight:800,color:T.navy,margin:'4px 0 0'}}>GHG Protocol Carbon Emission Calculator</h1>
          </div>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>FY{reportingYear} | {companyName}</div>
              <div style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.navy}}>{fmtCO2(grandTotal)}</div>
            </div>
            <div style={{width:1,height:32,background:T.border}} />
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>Scope 1 | 2 (L) | 3</div>
              <div style={{fontFamily:T.mono,fontSize:11}}>
                <span style={{color:T.navy}}>{fmtCO2(scope1Total)}</span>
                <span style={{color:T.textMut}}> | </span>
                <span style={{color:T.sage}}>{fmtCO2(scope2LocationTotal)}</span>
                <span style={{color:T.textMut}}> | </span>
                <span style={{color:'#8b5cf6'}}>{fmtCO2(scope3Totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginTop:8,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{
                fontFamily:T.font,fontSize:12,fontWeight:tab===t.key?700:500,color:tab===t.key?T.navy:T.textSec,
                padding:'10px 18px',border:'none',borderBottom:tab===t.key?`2px solid ${T.gold}`:'2px solid transparent',
                background:'transparent',cursor:'pointer',whiteSpace:'nowrap',marginBottom:-2,
                transition:'all 0.15s ease',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 32px'}}>
        {tab==='boundary'&&renderBoundary()}
        {tab==='scope1'&&renderScope1()}
        {tab==='scope2'&&renderScope2()}
        {tab==='scope3'&&renderScope3()}
        {tab==='gwp'&&renderGWP()}
        {tab==='summary'&&renderSummary()}
        {tab==='downstream'&&renderDownstream()}
      </div>

      {/* Footer Status Bar */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:T.navy,padding:'6px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:100}}>
        <div style={{display:'flex',gap:16}}>
          <span style={{fontFamily:T.mono,fontSize:10,color:T.goldL}}>GHG PROTOCOL CORPORATE STANDARD (2015)</span>
          <span style={{fontFamily:T.mono,fontSize:10,color:'#fff8'}}>|</span>
          <span style={{fontFamily:T.mono,fontSize:10,color:'#fff8'}}>SCOPE 2 GUIDANCE (2015)</span>
          <span style={{fontFamily:T.mono,fontSize:10,color:'#fff8'}}>|</span>
          <span style={{fontFamily:T.mono,fontSize:10,color:'#fff8'}}>SCOPE 3 STANDARD (2013)</span>
        </div>
        <div style={{display:'flex',gap:12}}>
          <span style={{fontFamily:T.mono,fontSize:10,color:validationIssues.filter(i=>i.type==='error').length>0?T.red:'#fff8'}}>
            {validationIssues.filter(i=>i.type==='error').length} errors
          </span>
          <span style={{fontFamily:T.mono,fontSize:10,color:validationIssues.filter(i=>i.type==='warn').length>0?T.amber:'#fff8'}}>
            {validationIssues.filter(i=>i.type==='warn').length} warnings
          </span>
          <span style={{fontFamily:T.mono,fontSize:10,color:T.goldL}}>EF: DEFRA 2023 | GWP: IPCC AR6 | Grid: Ember 2024</span>
        </div>
      </div>
    </div>
  );
}
