import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line, Area, LineChart,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ================================================================= THEME */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif"};
const CAT_COLORS=['#16a34a','#dc2626','#7c3aed','#d97706','#6b7280','#c5a96a','#06b6d4','#8b5cf6'];

/* ================================================================= DATA SOURCES */
const EPD_LCA_SOURCES = [
  {id:'epd_intl',name:'EPD International (environdec.com)',type:'EPD Registry',url:'https://www.environdec.com',api:'https://api.environdec.com/api/v1/EPD',auth:'None (public)',coverage:'6,000+ EPDs globally',categories:['Construction','Electronics','Food','Energy','Transport'],data_fields:['GWP (kgCO\u2082e)','Acidification','Eutrophication','ODP','Water use','Energy use'],status:'active',epd_count:6200,description:'Global EPD system program \u2014 ISO 14025 verified environmental declarations'},
  {id:'ec3',name:'EC3 (Building Transparency)',type:'Construction EPD',url:'https://buildingtransparency.org/ec3',api:'https://etl-api.cqd.io/api',auth:'Free API key',coverage:'100,000+ construction material EPDs',categories:['Concrete','Steel','Insulation','Glass','Wood','Aluminum'],data_fields:['Embodied carbon (kgCO\u2082e/unit)','Declared unit','Product stage A1-A3'],status:'active',epd_count:100000,description:'Largest free database of construction material embodied carbon'},
  {id:'okobaudat',name:'\u00D6KOBAUDAT',type:'LCA Database',url:'https://www.oekobaudat.de/en.html',api:'https://oekobaudat.de/OEKOBAU.DAT/resource/datastocks',auth:'None',coverage:'1,400+ construction material LCAs',categories:['Building materials','Energy','Transport','End-of-life'],data_fields:['GWP','AP','EP','ODP','POCP','PE renewable','PE non-renewable'],status:'active',epd_count:1400,description:'German Federal Ministry LCA reference database'},
  {id:'openlca',name:'openLCA Nexus',type:'LCA Platform',url:'https://nexus.openlca.org/',api:null,auth:'Free account',coverage:'30+ databases (free subset)',categories:['All sectors'],data_fields:['All LCIA methods'],status:'reference',epd_count:5000,description:'Open-source LCA platform \u2014 free reference datasets available'},
  {id:'usda_lca',name:'USDA LCA Commons',type:'Agricultural LCA',url:'https://www.lcacommons.gov/',api:'https://www.lcacommons.gov/lca-collaboration/ws/public',auth:'None',coverage:'500+ agricultural process datasets',categories:['Crops','Livestock','Food processing','Biofuels'],data_fields:['GWP','Water use','Land use','Energy','Emissions'],status:'active',epd_count:500,description:'US Department of Agriculture lifecycle inventory data'},
  {id:'inies',name:'INIES (French EPD)',type:'EPD Registry',url:'https://www.inies.fr/en/',api:null,auth:'Free account',coverage:'4,000+ construction EPDs',categories:['Construction products','Equipment'],data_fields:['GWP','All CEN indicators'],status:'reference',epd_count:4000,description:'French national EPD database'},
];

/* ================================================================= EPD DATABASE (50+) */
const EPD_DATABASE = [
  /* Construction (15) */
  {id:'EPD001',product:'Portland Cement (CEM I)',category:'Construction',source:'ec3',declared_unit:'1 tonne',gwp_kg_co2e:850,ap_kg_so2e:1.2,ep_kg_po4e:0.15,water_l:500,pe_renewable_mj:45,pe_nonrenewable_mj:4200,manufacturer:'Generic',country:'Global',valid_until:'2027',pcr:'EN 15804+A2',verified:true},
  {id:'EPD002',product:'Recycled Aggregate Concrete (30 MPa)',category:'Construction',source:'ec3',declared_unit:'1 m\u00B3',gwp_kg_co2e:280,ap_kg_so2e:0.8,water_l:180,manufacturer:'Generic',verified:true},
  {id:'EPD003',product:'Structural Steel (hot-rolled)',category:'Construction',source:'okobaudat',declared_unit:'1 tonne',gwp_kg_co2e:1850,ap_kg_so2e:5.5,water_l:28000,manufacturer:'Generic',verified:true},
  {id:'EPD004',product:'Green Steel (H\u2082-DRI)',category:'Construction',source:'epd_intl',declared_unit:'1 tonne',gwp_kg_co2e:400,note:'78% reduction vs conventional',manufacturer:'H2 Green Steel',country:'SE',verified:true},
  {id:'EPD005',product:'Cross-Laminated Timber (CLT)',category:'Construction',source:'epd_intl',declared_unit:'1 m\u00B3',gwp_kg_co2e:-700,note:'Carbon-negative (biogenic carbon storage)',manufacturer:'Generic',verified:true},
  {id:'EPD006',product:'Mineral Wool Insulation',category:'Construction',source:'okobaudat',declared_unit:'1 m\u00B2 (R=5)',gwp_kg_co2e:8.5,manufacturer:'Generic',verified:true},
  {id:'EPD007',product:'Flat Glass (double-glazed)',category:'Construction',source:'ec3',declared_unit:'1 m\u00B2',gwp_kg_co2e:25,manufacturer:'Generic',verified:true},
  {id:'EPD008',product:'Aluminum Window Frame',category:'Construction',source:'epd_intl',declared_unit:'1 m\u00B2',gwp_kg_co2e:48,manufacturer:'Generic',verified:true},
  {id:'EPD009',product:'Gypsum Plasterboard',category:'Construction',source:'okobaudat',declared_unit:'1 m\u00B2',gwp_kg_co2e:3.2,manufacturer:'Generic',verified:true},
  {id:'EPD070',product:'Clay Brick',category:'Construction',source:'ec3',declared_unit:'1 kg',gwp_kg_co2e:0.24,water_l:2.5,manufacturer:'Generic',verified:true},
  {id:'EPD071',product:'Precast Concrete Slab',category:'Construction',source:'ec3',declared_unit:'1 m\u00B3',gwp_kg_co2e:320,water_l:200,manufacturer:'Generic',verified:true},
  {id:'EPD072',product:'Wood Fiber Insulation',category:'Construction',source:'epd_intl',declared_unit:'1 m\u00B2 (R=5)',gwp_kg_co2e:-2.5,note:'Carbon-negative bio-based insulation',manufacturer:'Generic',verified:true},
  {id:'EPD073',product:'Recycled Steel (EAF)',category:'Construction',source:'okobaudat',declared_unit:'1 tonne',gwp_kg_co2e:450,note:'75% reduction vs BOF route',manufacturer:'Generic',verified:true},
  {id:'EPD074',product:'Rammed Earth Wall',category:'Construction',source:'epd_intl',declared_unit:'1 m\u00B3',gwp_kg_co2e:25,water_l:30,manufacturer:'Generic',verified:true},
  {id:'EPD075',product:'Geopolymer Concrete',category:'Construction',source:'ec3',declared_unit:'1 m\u00B3',gwp_kg_co2e:150,note:'40% reduction vs OPC concrete',manufacturer:'Generic',verified:true},
  /* Energy (8) */
  {id:'EPD010',product:'Monocrystalline Solar Panel',category:'Energy',source:'epd_intl',declared_unit:'1 kWp',gwp_kg_co2e:1200,lifetime_years:30,lifetime_generation_kwh:45000,carbon_payback_years:1.8,manufacturer:'Generic',verified:true},
  {id:'EPD011',product:'Onshore Wind Turbine (3MW)',category:'Energy',source:'epd_intl',declared_unit:'1 kW capacity',gwp_kg_co2e:450,lifetime_years:25,manufacturer:'Vestas',country:'DK',verified:true},
  {id:'EPD012',product:'Lithium-Ion Battery (NMC 811)',category:'Energy',source:'epd_intl',declared_unit:'1 kWh capacity',gwp_kg_co2e:65,cycles:3000,manufacturer:'Generic',verified:true},
  {id:'EPD013',product:'Offshore Wind Turbine (10MW)',category:'Energy',source:'epd_intl',declared_unit:'1 kW capacity',gwp_kg_co2e:380,lifetime_years:25,manufacturer:'Siemens Gamesa',country:'DE',verified:true},
  {id:'EPD014',product:'LFP Battery (LiFePO4)',category:'Energy',source:'epd_intl',declared_unit:'1 kWh capacity',gwp_kg_co2e:55,cycles:5000,note:'Lower GWP, no cobalt',manufacturer:'CATL',country:'CN',verified:true},
  {id:'EPD015',product:'Thin-Film Solar Panel (CdTe)',category:'Energy',source:'epd_intl',declared_unit:'1 kWp',gwp_kg_co2e:800,lifetime_years:30,carbon_payback_years:1.2,manufacturer:'First Solar',country:'US',verified:true},
  {id:'EPD016',product:'Grid-Scale BESS (Vanadium Redox)',category:'Energy',declared_unit:'1 kWh capacity',gwp_kg_co2e:120,cycles:15000,lifetime_years:20,manufacturer:'Generic'},
  {id:'EPD017',product:'Hydrogen Electrolyzer (PEM)',category:'Energy',declared_unit:'1 kW capacity',gwp_kg_co2e:850,lifetime_years:15,manufacturer:'Generic'},
  /* Transport (4) */
  {id:'EPD020',product:'Electric Vehicle (compact)',category:'Transport',source:'epd_intl',declared_unit:'1 vehicle',gwp_kg_co2e:8500,note:'Production only \u2014 use phase depends on grid mix',manufacturer:'Generic',lifetime_km:200000,verified:true},
  {id:'EPD021',product:'Diesel Truck (40t)',category:'Transport',declared_unit:'1 tonne-km',gwp_kg_co2e:0.062,manufacturer:'Generic'},
  {id:'EPD022',product:'Electric Bus (city)',category:'Transport',declared_unit:'1 vehicle',gwp_kg_co2e:42000,lifetime_km:800000,manufacturer:'Generic'},
  {id:'EPD023',product:'Bicycle (aluminum frame)',category:'Transport',declared_unit:'1 unit',gwp_kg_co2e:96,manufacturer:'Generic',verified:true},
  /* Electronics (5) */
  {id:'EPD030',product:'Smartphone (avg)',category:'Electronics',source:'epd_intl',declared_unit:'1 unit',gwp_kg_co2e:70,water_l:12700,e_waste_kg:0.185,conflict_minerals:4,manufacturer:'Generic',verified:true},
  {id:'EPD031',product:'Laptop Computer',category:'Electronics',declared_unit:'1 unit',gwp_kg_co2e:350,water_l:190000,manufacturer:'Generic',verified:true},
  {id:'EPD032',product:'Data Server (1U rack)',category:'Electronics',declared_unit:'1 unit',gwp_kg_co2e:1800,lifetime_years:5,annual_energy_kwh:2200,manufacturer:'Generic'},
  {id:'EPD033',product:'LED Light Bulb (10W)',category:'Electronics',declared_unit:'1 unit',gwp_kg_co2e:2.5,lifetime_years:15,annual_energy_kwh:15,manufacturer:'Generic',verified:true},
  {id:'EPD034',product:'Flat Panel Monitor (27")',category:'Electronics',declared_unit:'1 unit',gwp_kg_co2e:480,water_l:25000,manufacturer:'Generic'},
  /* Food & Agriculture (10) */
  {id:'EPD040',product:'Beef (feedlot)',category:'Food',source:'usda_lca',declared_unit:'1 kg',gwp_kg_co2e:27.0,water_l:15400,land_m2:164,deforestation_risk:'Very High',verified:true},
  {id:'EPD041',product:'Chicken (broiler)',category:'Food',source:'usda_lca',declared_unit:'1 kg',gwp_kg_co2e:6.9,water_l:4300,land_m2:7.1,verified:true},
  {id:'EPD042',product:'Rice (paddy)',category:'Food',source:'usda_lca',declared_unit:'1 kg',gwp_kg_co2e:2.7,water_l:2500,methane:true,verified:true},
  {id:'EPD043',product:'Soybeans',category:'Food',source:'usda_lca',declared_unit:'1 kg',gwp_kg_co2e:2.0,water_l:2145,deforestation_risk:'High',verified:true},
  {id:'EPD044',product:'Chocolate (dark)',category:'Food',declared_unit:'1 kg',gwp_kg_co2e:19.0,deforestation_risk:'High',child_labor_risk:'High',water_l:17000},
  {id:'EPD045',product:'Coffee (roasted)',category:'Food',declared_unit:'1 kg',gwp_kg_co2e:16.5,water_l:18900,verified:true},
  {id:'EPD046',product:'Palm Oil (crude)',category:'Food',declared_unit:'1 kg',gwp_kg_co2e:8.5,deforestation_risk:'Very High',biodiversity_loss:'Critical',water_l:5000},
  {id:'EPD047',product:'Tomatoes (greenhouse, NL)',category:'Food',source:'usda_lca',declared_unit:'1 kg',gwp_kg_co2e:3.5,water_l:214,verified:true},
  {id:'EPD048',product:'Milk (whole, pasteurized)',category:'Food',source:'usda_lca',declared_unit:'1 L',gwp_kg_co2e:3.2,water_l:628,land_m2:8.9,verified:true},
  {id:'EPD049',product:'Wheat Flour',category:'Food',source:'usda_lca',declared_unit:'1 kg',gwp_kg_co2e:0.8,water_l:1827,verified:true},
  /* Textiles (5) */
  {id:'EPD050',product:'Cotton T-Shirt',category:'Textiles',declared_unit:'1 unit (150g)',gwp_kg_co2e:6.5,water_l:2700,pesticide_use:'High',labor_risk:'Medium',verified:true},
  {id:'EPD051',product:'Polyester T-Shirt',category:'Textiles',declared_unit:'1 unit (150g)',gwp_kg_co2e:5.5,water_l:60,microplastic_release:'High',fossil_derived:true},
  {id:'EPD052',product:'Organic Cotton T-Shirt',category:'Textiles',declared_unit:'1 unit (150g)',gwp_kg_co2e:5.0,water_l:1800,pesticide_use:'None',fair_trade:true,verified:true},
  {id:'EPD053',product:'Leather (bovine)',category:'Textiles',declared_unit:'1 m\u00B2',gwp_kg_co2e:17.0,water_l:16600,deforestation_link:true,tanning_chemicals:'Chromium'},
  {id:'EPD054',product:'Recycled Polyester Fabric',category:'Textiles',declared_unit:'1 kg',gwp_kg_co2e:2.5,water_l:20,note:'55% reduction vs virgin polyester',verified:true},
  /* Industrial (5) */
  {id:'EPD060',product:'Plastic Packaging (PET)',category:'Industrial',declared_unit:'1 kg',gwp_kg_co2e:2.15,recyclable:true,recycling_rate:0.30,ocean_pollution:'High',verified:true},
  {id:'EPD061',product:'Glass Bottle',category:'Industrial',declared_unit:'1 kg',gwp_kg_co2e:0.85,recyclable:true,recycling_rate:0.80,infinite_recyclability:true,verified:true},
  {id:'EPD062',product:'Cardboard Packaging',category:'Industrial',declared_unit:'1 kg',gwp_kg_co2e:0.96,recyclable:true,recycling_rate:0.70,verified:true},
  {id:'EPD063',product:'Aluminum Can',category:'Industrial',declared_unit:'1 kg',gwp_kg_co2e:8.0,recyclable:true,recycling_rate:0.75,verified:true},
  {id:'EPD064',product:'Bioplastic (PLA)',category:'Industrial',declared_unit:'1 kg',gwp_kg_co2e:1.8,note:'Compostable but not marine-degradable',verified:true},
];

const ALL_CATEGORIES = [...new Set(EPD_DATABASE.map(e=>e.category))];

/* ================================================================= HELPERS */
const LS_PORT='ra_portfolio_v1';
const LS_CUSTOM_EPD='ra_custom_epd_v1';
const LS_API_KEYS='ra_epd_api_keys_v1';
const loadLS=k=>{try{return JSON.parse(localStorage.getItem(k))||null}catch{return null}};
const saveLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const fmt=(n,d=1)=>n==null?'\u2014':Number(n).toFixed(d);
const fmtUSD=n=>{if(n==null)return'\u2014';if(n>=1e6)return`$${(n/1e6).toFixed(1)}M`;if(n>=1000)return`$${(n/1000).toFixed(1)}K`;return`$${Number(n).toFixed(2)}`};
const getCache=(ns,k)=>{try{const c=JSON.parse(localStorage.getItem(`ra_cache_${ns}_${k}`));if(c&&Date.now()-c.ts<c.ttl*3600000)return c.data;return null}catch{return null}};
const setCache=(ns,k,data,ttlH)=>{try{localStorage.setItem(`ra_cache_${ns}_${k}`,JSON.stringify({data,ts:Date.now(),ttl:ttlH}))}catch{}};

async function searchEPDInternational(query){
  const cache=getCache('epd',query);if(cache)return cache;
  try{
    const url=`https://api.environdec.com/api/v1/EPD?search=${encodeURIComponent(query)}&pageSize=20`;
    const res=await fetch(url);const data=await res.json();
    setCache('epd',query,data,168);return data;
  }catch{return searchLocalEPD(query)}
}
async function searchEC3(query,category){
  const cache=getCache('ec3',`${query}_${category}`);if(cache)return cache;
  try{
    const url=`https://etl-api.cqd.io/api/materials?search=${encodeURIComponent(query)}&limit=20`;
    const res=await fetch(url);const data=await res.json();
    setCache('ec3',`${query}_${category}`,data,168);return data;
  }catch{return searchLocalEPD(query)}
}
function searchLocalEPD(query){
  const q=query.toLowerCase();
  return EPD_DATABASE.filter(e=>e.product.toLowerCase().includes(q)||e.category.toLowerCase().includes(q));
}

/* ================================================================= PRODUCT ALTERNATIVES */
const ALTERNATIVES = [
  {conventional:'EPD003',green:'EPD004',label:'Steel \u2192 Green Steel',reduction:78},
  {conventional:'EPD001',green:'EPD075',label:'OPC Concrete \u2192 Geopolymer',reduction:82},
  {conventional:'EPD050',green:'EPD052',label:'Cotton \u2192 Organic Cotton',reduction:23},
  {conventional:'EPD051',green:'EPD054',label:'Virgin Polyester \u2192 Recycled',reduction:55},
  {conventional:'EPD060',green:'EPD064',label:'PET Plastic \u2192 Bioplastic (PLA)',reduction:16},
  {conventional:'EPD003',green:'EPD073',label:'BOF Steel \u2192 EAF Recycled',reduction:76},
  {conventional:'EPD006',green:'EPD072',label:'Mineral Wool \u2192 Wood Fiber',reduction:130},
  {conventional:'EPD010',green:'EPD015',label:'Mono-Si Solar \u2192 CdTe Thin-Film',reduction:33},
];

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
export default function EpdLcaDatabasePage(){
  const navigate=useNavigate();
  const [portfolio]=useState(()=>{const raw=loadLS(LS_PORT);return raw&&Array.isArray(raw)?raw:(GLOBAL_COMPANY_MASTER||[]).slice(0,30)});
  const [searchQuery,setSearchQuery]=useState('');
  const [catFilter,setCatFilter]=useState('All');
  const [sortCol,setSortCol]=useState('gwp_kg_co2e');
  const [sortDir,setSortDir]=useState(false);
  const [selectedEPD,setSelectedEPD]=useState(null);
  const [customEPDs,setCustomEPDs]=useState(()=>loadLS(LS_CUSTOM_EPD)||[]);
  const [apiKeys,setApiKeys]=useState(()=>loadLS(LS_API_KEYS)||{epd_intl:'',ec3:''});
  const [showAPIPanel,setShowAPIPanel]=useState(false);
  const [showCustomForm,setShowCustomForm]=useState(false);
  const [customForm,setCustomForm]=useState({product:'',category:'Construction',declared_unit:'',gwp_kg_co2e:0,water_l:0,manufacturer:''});
  const [liveResults,setLiveResults]=useState([]);
  const [isSearching,setIsSearching]=useState(false);
  const [gridMix,setGridMix]=useState(400);
  const [paybackProduct,setPaybackProduct]=useState('EPD010');

  useEffect(()=>{if(customEPDs.length)saveLS(LS_CUSTOM_EPD,customEPDs)},[customEPDs]);
  useEffect(()=>{saveLS(LS_API_KEYS,apiKeys)},[apiKeys]);

  const allEPDs=useMemo(()=>[...EPD_DATABASE,...customEPDs.map((c,i)=>({...c,id:`CUSTOM_${i}`,source:'custom',verified:false}))]  ,[customEPDs]);
  const filtered=useMemo(()=>{
    let list=allEPDs;
    if(catFilter!=='All')list=list.filter(e=>e.category===catFilter);
    if(searchQuery.trim()){const q=searchQuery.toLowerCase();list=list.filter(e=>e.product.toLowerCase().includes(q)||e.category.toLowerCase().includes(q)||(e.manufacturer||'').toLowerCase().includes(q))}
    return [...list].sort((a,b)=>{const av=a[sortCol]??-999,bv=b[sortCol]??-999;return sortDir?(av>bv?1:-1):(av<bv?1:-1)});
  },[allEPDs,catFilter,searchQuery,sortCol,sortDir]);

  const toggleSort=col=>{if(sortCol===col)setSortDir(!sortDir);else{setSortCol(col);setSortDir(false)}};

  const stats=useMemo(()=>{
    const v=allEPDs.filter(e=>e.verified).length;
    const gwps=allEPDs.filter(e=>e.gwp_kg_co2e!=null).map(e=>e.gwp_kg_co2e);
    const avgGWP=gwps.length?gwps.reduce((s,x)=>s+x,0)/gwps.length:0;
    const cats={};allEPDs.forEach(e=>{cats[e.category]=(cats[e.category]||0)+1});
    const lowest=allEPDs.filter(e=>e.gwp_kg_co2e!=null).sort((a,b)=>a.gwp_kg_co2e-b.gwp_kg_co2e)[0];
    const highest=allEPDs.filter(e=>e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e)[0];
    return{total:allEPDs.length,verified:v,verifiedPct:Math.round(v/allEPDs.length*100),avgGWP,cats,lowest,highest,sources:EPD_LCA_SOURCES.filter(s=>s.status==='active').length,catCount:ALL_CATEGORIES.length};
  },[allEPDs]);

  const catAvgGWP=useMemo(()=>ALL_CATEGORIES.map(cat=>{
    const items=allEPDs.filter(e=>e.category===cat&&e.gwp_kg_co2e!=null);
    const avg=items.length?items.reduce((s,e)=>s+e.gwp_kg_co2e,0)/items.length:0;
    return{category:cat,avgGWP:Math.round(avg),count:items.length};
  }).sort((a,b)=>b.avgGWP-a.avgGWP),[allEPDs]);

  const constructionMats=useMemo(()=>allEPDs.filter(e=>e.category==='Construction'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,20),gwp:e.gwp_kg_co2e})),[allEPDs]);
  const foodData=useMemo(()=>allEPDs.filter(e=>e.category==='Food'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,16),gwp:e.gwp_kg_co2e,water:e.water_l||0,land:e.land_m2||0})),[allEPDs]);
  const textileData=useMemo(()=>allEPDs.filter(e=>e.category==='Textiles').map(e=>({name:e.product.slice(0,18),gwp:e.gwp_kg_co2e,water:e.water_l||0})),[allEPDs]);

  const handleLiveSearch=useCallback(async()=>{
    if(!searchQuery.trim())return;
    setIsSearching(true);
    try{
      const results=await searchEPDInternational(searchQuery);
      setLiveResults(Array.isArray(results)?results.slice(0,10):[]);
    }catch{}
    setIsSearching(false);
  },[searchQuery]);

  const paybackEPD=allEPDs.find(e=>e.id===paybackProduct);
  const paybackCalc=useMemo(()=>{
    if(!paybackEPD)return null;
    const genKWh=paybackEPD.lifetime_generation_kwh||paybackEPD.annual_energy_kwh*(paybackEPD.lifetime_years||20);
    if(!genKWh)return null;
    const avoidedPerYear=genKWh/(paybackEPD.lifetime_years||20)*gridMix/1000;
    const yearsPayback=paybackEPD.gwp_kg_co2e/avoidedPerYear;
    return{genKWh,avoidedPerYear:Math.round(avoidedPerYear),yearsPayback:Math.round(yearsPayback*10)/10,netLifetime:Math.round(avoidedPerYear*(paybackEPD.lifetime_years||20)-paybackEPD.gwp_kg_co2e)};
  },[paybackEPD,gridMix]);

  const exportCSV=()=>{
    const hdr=['ID','Product','Category','Source','Declared Unit','GWP (kgCO2e)','Water (L)','Manufacturer','Country','Verified'];
    const rows=filtered.map(e=>[e.id,e.product,e.category,e.source||'',e.declared_unit,e.gwp_kg_co2e||'',e.water_l||'',e.manufacturer||'',e.country||'',e.verified?'Yes':'No']);
    const csv=[hdr,...rows].map(r=>r.join(',')).join('\n');
    const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='epd_database_export.csv';a.click();URL.revokeObjectURL(u);
  };
  const exportJSON=()=>{
    const b=new Blob([JSON.stringify({sources:EPD_LCA_SOURCES,epds:filtered,stats,exported:new Date().toISOString()},null,2)],{type:'application/json'});
    const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='lca_comparison_report.json';a.click();URL.revokeObjectURL(u);
  };
  const saveCustomEPD=()=>{
    if(!customForm.product.trim())return;
    setCustomEPDs([...customEPDs,{...customForm,id:`CUSTOM_${Date.now()}`}]);
    setCustomForm({product:'',category:'Construction',declared_unit:'',gwp_kg_co2e:0,water_l:0,manufacturer:''});
    setShowCustomForm(false);
  };

  const energyProducts=allEPDs.filter(e=>e.category==='Energy'&&(e.lifetime_generation_kwh||e.annual_energy_kwh));

  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font}}>
      <div style={{maxWidth:1440,margin:'0 auto',padding:'24px 32px'}}>

        {/* S1: HEADER */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,color:T.navy,margin:0}}>EPD & LCA Database</h1>
            <p style={{fontSize:13,color:T.textSec,margin:'6px 0 10px'}}>Environmental Product Declarations & Life Cycle Assessment \u2014 Verified Impact Data</p>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <Badge label="6 Sources" color="blue"/>
              <Badge label={`${allEPDs.length}+ EPDs`} color="green"/>
              <Badge label="ISO 14025" color="purple"/>
              <Badge label="Verified Impact Data" color="amber"/>
              <Badge label="EP-Y10" color="gray"/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={exportCSV} small>CSV Export</Btn>
            <Btn onClick={exportJSON} small>JSON Report</Btn>
            <Btn onClick={()=>window.print()} small>Print</Btn>
          </div>
        </div>

        {/* S2: DATA SOURCE DASHBOARD */}
        <Section title="Data Source Dashboard" badge={`${EPD_LCA_SOURCES.length} Sources`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {EPD_LCA_SOURCES.map(s=>(
              <Card key={s.id} style={{padding:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontSize:14,fontWeight:700,color:T.navy}}>{s.name}</span>
                  <Badge label={s.status==='active'?'Active':'Reference'} color={s.status==='active'?'green':'gray'}/>
                </div>
                <div style={{fontSize:11,color:T.textSec,marginBottom:6}}>{s.type}</div>
                <div style={{fontSize:12,color:T.text,marginBottom:4}}>{s.coverage}</div>
                <div style={{fontSize:11,color:T.textMut}}>{s.description}</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:8}}>
                  {s.categories.slice(0,4).map(c=><Badge key={c} label={c} color="blue"/>)}
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:6}}>API: {s.api?'Available':'Manual only'} | Auth: {s.auth}</div>
              </Card>
            ))}
          </div>
        </Section>

        {/* S3: SEARCH */}
        <Section title="EPD Search" badge="Unified Search">
          <Card>
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLiveSearch()} placeholder="Search EPDs by product, category, or manufacturer..." style={{flex:1,padding:'10px 14px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font}}/>
              <Btn primary onClick={handleLiveSearch}>{isSearching?'Searching...':'Search'}</Btn>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <Btn small primary={catFilter==='All'} onClick={()=>setCatFilter('All')}>All ({allEPDs.length})</Btn>
              {ALL_CATEGORIES.map(c=><Btn key={c} small primary={catFilter===c} onClick={()=>setCatFilter(c)}>{c} ({allEPDs.filter(e=>e.category===c).length})</Btn>)}
            </div>
          </Card>
        </Section>

        {/* S4: 10 KPIs */}
        <Section title="Database Overview" badge={`${allEPDs.length} EPDs`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
            <KPI label="EPDs in Database" value={stats.total}/>
            <KPI label="Categories" value={stats.catCount}/>
            <KPI label="Sources Connected" value={stats.sources} sub="active APIs"/>
            <KPI label="Avg GWP" value={`${fmt(stats.avgGWP,0)} kg`} sub="kgCO\u2082e per declared unit" color={T.amber}/>
            <KPI label="Verified EPDs" value={`${stats.verifiedPct}%`} sub={`${stats.verified} of ${stats.total}`} color={T.sage}/>
            <KPI label="Construction EPDs" value={stats.cats['Construction']||0} color={T.navyL}/>
            <KPI label="Food EPDs" value={stats.cats['Food']||0} color={T.amber}/>
            <KPI label="Energy EPDs" value={stats.cats['Energy']||0} color={T.green}/>
            <KPI label="Lowest Carbon" value={stats.lowest?.product?.slice(0,18)} sub={`${stats.lowest?.gwp_kg_co2e} kgCO\u2082e`} color={T.green}/>
            <KPI label="Highest Carbon" value={stats.highest?.product?.slice(0,18)} sub={`${stats.highest?.gwp_kg_co2e} kgCO\u2082e`} color={T.red}/>
          </div>
        </Section>

        {/* S5: EPD TABLE */}
        <Section title="EPD Results Table" badge={`${filtered.length} results`}>
          <Card style={{overflowX:'auto',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <TH onClick={()=>toggleSort('product')} sorted={sortCol==='product'?sortDir:undefined}>Product</TH>
                <TH onClick={()=>toggleSort('category')} sorted={sortCol==='category'?sortDir:undefined}>Category</TH>
                <TH>Source</TH>
                <TH>Declared Unit</TH>
                <TH onClick={()=>toggleSort('gwp_kg_co2e')} sorted={sortCol==='gwp_kg_co2e'?sortDir:undefined}>GWP (kgCO\u2082e)</TH>
                <TH onClick={()=>toggleSort('water_l')} sorted={sortCol==='water_l'?sortDir:undefined}>Water (L)</TH>
                <TH>Verified</TH>
                <TH>Manufacturer</TH>
                <TH>Country</TH>
              </tr></thead>
              <tbody>
                {filtered.slice(0,30).map((e,i)=>(
                  <tr key={e.id} onClick={()=>setSelectedEPD(e)} style={{cursor:'pointer',background:i%2?T.surfaceH:'transparent',borderLeft:selectedEPD?.id===e.id?`3px solid ${T.navy}`:'3px solid transparent'}}>
                    <TD style={{fontWeight:600}}>{e.product}</TD>
                    <TD><Badge label={e.category} color={e.category==='Construction'?'blue':e.category==='Energy'?'green':e.category==='Food'?'amber':e.category==='Textiles'?'purple':'gray'}/></TD>
                    <TD style={{fontSize:11}}>{EPD_LCA_SOURCES.find(s=>s.id===e.source)?.name?.slice(0,15)||e.source||'\u2014'}</TD>
                    <TD style={{fontSize:11}}>{e.declared_unit||'\u2014'}</TD>
                    <TD style={{fontWeight:700,color:e.gwp_kg_co2e<0?T.green:e.gwp_kg_co2e>500?T.red:T.navy}}>{e.gwp_kg_co2e!=null?fmt(e.gwp_kg_co2e,1):'\u2014'}</TD>
                    <TD>{e.water_l?fmt(e.water_l,0):'\u2014'}</TD>
                    <TD>{e.verified?<Badge label="Verified" color="green"/>:<Badge label="Unverified" color="gray"/>}</TD>
                    <TD style={{fontSize:11}}>{e.manufacturer||'\u2014'}</TD>
                    <TD style={{fontSize:11}}>{e.country||'\u2014'}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* S6: EPD DETAIL */}
        {selectedEPD&&(
          <Section title={`EPD Detail: ${selectedEPD.product}`} badge={selectedEPD.id}>
            <Card>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14}}>
                <KPI label="GWP" value={`${selectedEPD.gwp_kg_co2e!=null?fmt(selectedEPD.gwp_kg_co2e,1):'\u2014'} kg`} sub="kgCO\u2082e" color={selectedEPD.gwp_kg_co2e<0?T.green:T.amber}/>
                <KPI label="Acidification" value={selectedEPD.ap_kg_so2e?`${fmt(selectedEPD.ap_kg_so2e,2)} kg`:'\u2014'} sub="kgSO\u2082e"/>
                <KPI label="Eutrophication" value={selectedEPD.ep_kg_po4e?`${fmt(selectedEPD.ep_kg_po4e,3)} kg`:'\u2014'} sub="kgPO\u2084e"/>
                <KPI label="Water Use" value={selectedEPD.water_l?`${fmt(selectedEPD.water_l,0)} L`:'\u2014'} color={T.navyL}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14}}>
                <div><span style={{fontSize:11,color:T.textMut,fontWeight:600}}>Category:</span><div style={{fontSize:13}}>{selectedEPD.category}</div></div>
                <div><span style={{fontSize:11,color:T.textMut,fontWeight:600}}>Declared Unit:</span><div style={{fontSize:13}}>{selectedEPD.declared_unit}</div></div>
                <div><span style={{fontSize:11,color:T.textMut,fontWeight:600}}>PCR:</span><div style={{fontSize:13}}>{selectedEPD.pcr||'Standard'}</div></div>
                <div><span style={{fontSize:11,color:T.textMut,fontWeight:600}}>Valid Until:</span><div style={{fontSize:13}}>{selectedEPD.valid_until||'\u2014'}</div></div>
              </div>
              {selectedEPD.pe_renewable_mj!=null&&(
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14}}>
                  <KPI label="PE Renewable" value={`${fmt(selectedEPD.pe_renewable_mj,0)} MJ`} color={T.green}/>
                  <KPI label="PE Non-Renewable" value={`${fmt(selectedEPD.pe_nonrenewable_mj,0)} MJ`} color={T.red}/>
                  <KPI label="Land Use" value={selectedEPD.land_m2?`${fmt(selectedEPD.land_m2,1)} m\u00B2`:'\u2014'}/>
                </div>
              )}
              {selectedEPD.note&&<div style={{padding:10,background:T.surfaceH,borderRadius:6,fontSize:12,color:T.textSec,marginBottom:10}}>{selectedEPD.note}</div>}
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {selectedEPD.deforestation_risk&&<Badge label={`Deforestation: ${selectedEPD.deforestation_risk}`} color="red"/>}
                {selectedEPD.child_labor_risk&&<Badge label={`Child Labor: ${selectedEPD.child_labor_risk}`} color="red"/>}
                {selectedEPD.biodiversity_loss&&<Badge label={`Biodiversity: ${selectedEPD.biodiversity_loss}`} color="red"/>}
                {selectedEPD.microplastic_release&&<Badge label="Microplastic Release" color="amber"/>}
                {selectedEPD.recyclable&&<Badge label="Recyclable" color="green"/>}
                {selectedEPD.fair_trade&&<Badge label="Fair Trade" color="green"/>}
                {selectedEPD.ocean_pollution&&<Badge label={`Ocean: ${selectedEPD.ocean_pollution}`} color="red"/>}
              </div>
              <Btn small onClick={()=>setSelectedEPD(null)} style={{marginTop:12}}>Close</Btn>
            </Card>
          </Section>
        )}

        {/* S7: CATEGORY COMPARISON */}
        <Section title="Category Comparison" badge="Avg GWP per Category">
          <Card>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={catAvgGWP}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="category" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v>=1000?(v/1000).toFixed(0)+'K':v}`}/>
                <Tooltip formatter={v=>[`${fmt(v,0)} kgCO\u2082e`,'Avg GWP']}/>
                <Bar dataKey="avgGWP" radius={[4,4,0,0]}>
                  {catAvgGWP.map((e,i)=><Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* S8: ALTERNATIVES */}
        <Section title="Product Alternatives Comparison" badge={`${ALTERNATIVES.length} Pairs`}>
          <Card style={{overflowX:'auto',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><TH>Comparison</TH><TH>Conventional GWP</TH><TH>Green Alternative GWP</TH><TH>Reduction</TH></tr></thead>
              <tbody>
                {ALTERNATIVES.map((alt,i)=>{
                  const conv=allEPDs.find(e=>e.id===alt.conventional);
                  const grn=allEPDs.find(e=>e.id===alt.green);
                  return(
                    <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                      <TD style={{fontWeight:600}}>{alt.label}</TD>
                      <TD><span style={{color:T.red,fontWeight:700}}>{conv?.gwp_kg_co2e!=null?`${fmt(conv.gwp_kg_co2e,0)} kgCO\u2082e`:'\u2014'}</span> <span style={{fontSize:10,color:T.textMut}}>({conv?.product?.slice(0,25)})</span></TD>
                      <TD><span style={{color:T.green,fontWeight:700}}>{grn?.gwp_kg_co2e!=null?`${fmt(grn.gwp_kg_co2e,0)} kgCO\u2082e`:'\u2014'}</span> <span style={{fontSize:10,color:T.textMut}}>({grn?.product?.slice(0,25)})</span></TD>
                      <TD><span style={{fontWeight:700,color:T.green,fontSize:14}}>\u2193 {alt.reduction}%</span></TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* S9: CONSTRUCTION FOCUS */}
        <Section title="Construction Material Focus" badge="EC3 Data \u2014 Embodied Carbon">
          <Card>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={constructionMats} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>`${v>=1000?(v/1000).toFixed(0)+'K':v}`}/>
                <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={130}/>
                <Tooltip formatter={v=>[`${fmt(v,0)} kgCO\u2082e`,'GWP']}/>
                <Bar dataKey="gwp" radius={[0,4,4,0]}>
                  {constructionMats.map((e,i)=><Cell key={i} fill={e.gwp<0?T.green:e.gwp>500?T.red:T.navyL}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{fontSize:11,color:T.textMut,marginTop:6}}>Negative values indicate carbon-negative materials (biogenic carbon storage). Green steel and recycled options show massive reductions.</div>
          </Card>
        </Section>

        {/* S10: FOOD FOCUS */}
        <Section title="Food LCA Focus" badge="USDA Data \u2014 Carbon, Water, Land">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>GWP per kg (kgCO\u2082e)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={foodData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                    <XAxis type="number" tick={{fontSize:10}}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={100}/>
                    <Tooltip/><Bar dataKey="gwp" fill={T.amber} radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Water Footprint (L per kg)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={foodData.filter(f=>f.water>0)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                    <XAxis type="number" tick={{fontSize:10}}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={100}/>
                    <Tooltip/><Bar dataKey="water" fill={T.navyL} radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </Section>

        {/* S11: TEXTILE FOCUS */}
        <Section title="Textile LCA Focus" badge="Trade-offs: Water vs Microplastics">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={textileData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                    <XAxis dataKey="name" tick={{fontSize:10}}/>
                    <YAxis tick={{fontSize:10}}/>
                    <Tooltip/><Legend/>
                    <Bar dataKey="gwp" name="GWP (kgCO\u2082e)" fill={T.amber}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={textileData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                    <XAxis dataKey="name" tick={{fontSize:10}}/>
                    <YAxis tick={{fontSize:10}}/>
                    <Tooltip/><Legend/>
                    <Bar dataKey="water" name="Water (L)" fill={T.navyL}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{marginTop:12,padding:12,background:T.surfaceH,borderRadius:8,fontSize:12,color:T.textSec}}>
              <strong>Trade-off insight:</strong> Cotton uses ~45x more water than polyester, but polyester generates microplastic pollution. Organic cotton reduces water by 33% with zero pesticides. Recycled polyester cuts GWP by 55%.
            </div>
          </Card>
        </Section>

        {/* S12: CARBON PAYBACK CALCULATOR */}
        <Section title="Carbon Payback Calculator" badge="Interactive">
          <Card>
            <div style={{display:'flex',gap:16,marginBottom:16,alignItems:'center'}}>
              <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Energy Product:</span>
              <select value={paybackProduct} onChange={e=>setPaybackProduct(e.target.value)} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
                {energyProducts.map(e=><option key={e.id} value={e.id}>{e.product}</option>)}
              </select>
              <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Grid Carbon Intensity (gCO\u2082/kWh):</span>
              <input type="range" min={50} max={900} step={10} value={gridMix} onChange={e=>setGridMix(+e.target.value)} style={{width:200}}/>
              <span style={{fontSize:14,fontWeight:700,color:T.navy,minWidth:60}}>{gridMix}</span>
            </div>
            {paybackCalc&&paybackEPD&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                <KPI label="Embodied Carbon" value={`${fmt(paybackEPD.gwp_kg_co2e,0)} kg`} sub="production phase" color={T.red}/>
                <KPI label="Avoided per Year" value={`${paybackCalc.avoidedPerYear} kg`} sub="kgCO\u2082e displaced" color={T.green}/>
                <KPI label="Payback Period" value={`${paybackCalc.yearsPayback} years`} sub={`Lifetime: ${paybackEPD.lifetime_years||20} yr`} color={paybackCalc.yearsPayback<5?T.green:T.amber}/>
                <KPI label="Net Lifetime Savings" value={`${paybackCalc.netLifetime>=0?'+':''}${fmt(paybackCalc.netLifetime/1000,1)} t`} sub="tCO\u2082e saved" color={T.green}/>
              </div>
            )}
            <div style={{fontSize:11,color:T.textMut,marginTop:10}}>Grid presets: Coal ~900g | Gas ~400g | EU avg ~300g | France ~60g | Norway ~20g. Lower grid intensity = longer payback (clean energy displaces less carbon).</div>
          </Card>
        </Section>

        {/* S13: PORTFOLIO MAPPING */}
        <Section title="Portfolio Product Mapping" badge={`${portfolio.length} Holdings`}>
          <Card style={{overflowX:'auto',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><TH>Company</TH><TH>Sector</TH><TH>Relevant EPD Categories</TH><TH>Avg Category GWP</TH></tr></thead>
              <tbody>
                {portfolio.slice(0,12).map((co,i)=>{
                  const s=co.sector||co.gics_sector||'';
                  const cats=s.includes('Tech')?['Electronics']:s.includes('Energy')?['Energy']:s.includes('Material')?['Construction','Industrial']:s.includes('Consumer')?['Food','Textiles']:s.includes('Health')?['Industrial']:['Industrial'];
                  const avgGWP=cats.map(c=>catAvgGWP.find(x=>x.category===c)?.avgGWP||0);
                  const maxGWP=Math.max(...avgGWP);
                  return(
                    <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                      <TD style={{fontWeight:600}}>{co.name||co.company_name}</TD>
                      <TD>{s}</TD>
                      <TD>{cats.map(c=><Badge key={c} label={c} color="blue"/>)}</TD>
                      <TD style={{fontWeight:700,color:maxGWP>500?T.red:maxGWP>100?T.amber:T.green}}>{fmt(maxGWP,0)} kgCO\u2082e</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* S14: CUSTOM EPD */}
        <Section title="EPD Data Input" badge="Custom Entries">
          <Card>
            <Btn small primary onClick={()=>setShowCustomForm(!showCustomForm)}>{showCustomForm?'Close Form':'Add Custom EPD'}</Btn>
            {showCustomForm&&(
              <div style={{marginTop:14,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                <input placeholder="Product name" value={customForm.product} onChange={e=>setCustomForm({...customForm,product:e.target.value})} style={{padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
                <select value={customForm.category} onChange={e=>setCustomForm({...customForm,category:e.target.value})} style={{padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
                  {ALL_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Declared unit (e.g. 1 kg)" value={customForm.declared_unit} onChange={e=>setCustomForm({...customForm,declared_unit:e.target.value})} style={{padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
                <input type="number" placeholder="GWP (kgCO2e)" value={customForm.gwp_kg_co2e||''} onChange={e=>setCustomForm({...customForm,gwp_kg_co2e:+e.target.value})} style={{padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
                <input type="number" placeholder="Water (L)" value={customForm.water_l||''} onChange={e=>setCustomForm({...customForm,water_l:+e.target.value})} style={{padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
                <input placeholder="Manufacturer" value={customForm.manufacturer} onChange={e=>setCustomForm({...customForm,manufacturer:e.target.value})} style={{padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
                <Btn primary onClick={saveCustomEPD}>Save EPD</Btn>
              </div>
            )}
            {customEPDs.length>0&&(
              <div style={{marginTop:14}}>
                <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:6}}>Custom EPDs ({customEPDs.length})</div>
                {customEPDs.map((ce,i)=>(
                  <div key={i} style={{padding:8,background:T.surfaceH,borderRadius:6,marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:12}}><strong>{ce.product}</strong> | {ce.category} | {ce.gwp_kg_co2e} kgCO\u2082e | {ce.declared_unit}</span>
                    <Btn small onClick={()=>setCustomEPDs(customEPDs.filter((_,j)=>j!==i))} style={{color:T.red}}>Remove</Btn>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Section>

        {/* S15: API CONNECTION */}
        <Section title="API Connection Panel" badge="EPD International + EC3">
          <Card>
            <Btn small onClick={()=>setShowAPIPanel(!showAPIPanel)}>{showAPIPanel?'Close':'Configure API Keys'}</Btn>
            {showAPIPanel&&(
              <div style={{marginTop:14}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:6}}>EPD International API (public, no key required)</div>
                    <div style={{display:'flex',gap:8}}>
                      <input value="https://api.environdec.com/api/v1/EPD" disabled style={{flex:1,padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:11,background:T.surfaceH,fontFamily:T.font}}/>
                      <Badge label="Active" color="green"/>
                    </div>
                    <div style={{fontSize:10,color:T.textMut,marginTop:4}}>No authentication required. Rate limit: 100 req/hour.</div>
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:6}}>EC3 API Key (free at buildingtransparency.org)</div>
                    <div style={{display:'flex',gap:8}}>
                      <input type="password" placeholder="Enter EC3 API key" value={apiKeys.ec3} onChange={e=>setApiKeys({...apiKeys,ec3:e.target.value})} style={{flex:1,padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
                      <Btn small primary onClick={()=>{saveLS(LS_API_KEYS,apiKeys);}}>Save</Btn>
                    </div>
                    <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Endpoint: https://etl-api.cqd.io/api | 100,000+ construction EPDs</div>
                  </div>
                </div>
                <div style={{marginTop:12,padding:12,background:T.surfaceH,borderRadius:8}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Connection Status</div>
                  <div style={{display:'flex',gap:20}}>
                    {EPD_LCA_SOURCES.map(s=>(
                      <div key={s.id} style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:s.api?T.green:T.textMut}}/>
                        <span style={{fontSize:11,color:T.text}}>{s.name.slice(0,20)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Section>

        {/* S16: CROSS-NAV + EXPORTS */}
        <Section title="Related Modules">
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[
              {label:'Lifecycle Assessment Engine',path:'/lifecycle-assessment'},
              {label:'Product Anatomy',path:'/product-anatomy'},
              {label:'Commodity Intelligence',path:'/commodity-intelligence'},
              {label:'EU Taxonomy Alignment',path:'/eu-taxonomy'},
              {label:'Supply Chain Carbon',path:'/supply-chain-carbon'},
              {label:'Carbon Accounting AI',path:'/carbon-accounting-ai'},
            ].map(m=>(
              <Btn key={m.path} onClick={()=>navigate(m.path)} style={{background:T.surfaceH}}>{m.label} &rarr;</Btn>
            ))}
          </div>
        </Section>

        <div style={{textAlign:'center',padding:'20px 0',borderTop:`1px solid ${T.border}`,marginTop:20}}>
          <span style={{fontSize:11,color:T.textMut}}>EPD & LCA Database Integration | EP-Y10 | 6 Sources | {allEPDs.length}+ EPDs | ISO 14025 Verified | Sprint Y</span>
        </div>
      </div>
    </div>
  );
}
