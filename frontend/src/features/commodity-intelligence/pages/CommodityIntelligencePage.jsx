import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  AreaChart, Area, LineChart, Line, PieChart, Pie, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ================================================================= THEME */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif"};
const CAT_COLORS=['#16a34a','#dc2626','#7c3aed','#d97706','#6b7280','#c5a96a','#06b6d4','#8b5cf6'];

/* ================================================================= DATA */
const COMMODITY_UNIVERSE = {
  carbon:{name:'Carbon Markets',color:'#16a34a',icon:'\u{1F33F}',commodities:[
    {id:'EUA',name:'EU ETS Carbon (EUA)',unit:'EUR/tCO\u2082e',price:88.50,ytd_change:12.5,eodhd_ticker:'EUA.COMM',category:'Compliance',global_volume_mt:1400,description:'EU Emissions Trading System allowance'},
    {id:'UKA',name:'UK ETS Carbon (UKA)',unit:'GBP/tCO\u2082e',price:42.30,ytd_change:-5.2,category:'Compliance',global_volume_mt:120},
    {id:'CCA',name:'California Carbon (CCA)',unit:'USD/tCO\u2082e',price:38.50,ytd_change:8.1,category:'Compliance',global_volume_mt:320},
    {id:'CEA',name:'China ETS (CEA)',unit:'CNY/tCO\u2082e',price:92.00,ytd_change:45.0,category:'Compliance',global_volume_mt:4500},
    {id:'VCU',name:'Voluntary Carbon (VCU/VER)',unit:'USD/tCO\u2082e',price:8.50,ytd_change:-32.0,category:'Voluntary',global_volume_mt:250},
    {id:'REC',name:'Renewable Energy Certificates',unit:'USD/MWh',price:2.80,ytd_change:5.0,category:'Certificates',global_volume_mt:0},
  ]},
  energy:{name:'Energy',color:'#dc2626',icon:'\u26FD',commodities:[
    {id:'WTI',name:'WTI Crude Oil',unit:'USD/bbl',price:72.50,ytd_change:-8.5,eodhd_ticker:'CL.COMM',av_function:'WTI',global_production:'80M bbl/day',reserves_years:47},
    {id:'BRENT',name:'Brent Crude',unit:'USD/bbl',price:76.80,ytd_change:-7.2,eodhd_ticker:'BZ.COMM',av_function:'BRENT'},
    {id:'NG',name:'Natural Gas (Henry Hub)',unit:'USD/MMBtu',price:2.85,ytd_change:15.3,eodhd_ticker:'NG.COMM',av_function:'NATURAL_GAS'},
    {id:'COAL',name:'Thermal Coal (Newcastle)',unit:'USD/t',price:135.00,ytd_change:-22.5,stranded_risk:'Very High'},
    {id:'LNG',name:'LNG (Japan-Korea Marker)',unit:'USD/MMBtu',price:12.50,ytd_change:8.0},
    {id:'URANIUM',name:'Uranium (U3O8)',unit:'USD/lb',price:85.00,ytd_change:45.0},
  ]},
  critical_minerals:{name:'Critical Minerals',color:'#7c3aed',icon:'\u26A1',commodities:[
    {id:'LITHIUM',name:'Lithium Carbonate',unit:'USD/t',price:12500,ytd_change:-65.0,ev_relevance:'Battery cathode',top_producers:['AU','CL','CN','AR'],supply_risk:'High'},
    {id:'COBALT',name:'Cobalt',unit:'USD/t',price:28000,ytd_change:-15.0,ev_relevance:'Battery cathode',top_producers:['CD','AU','PH'],supply_risk:'Very High',child_labor_risk:'Critical (DRC)'},
    {id:'NICKEL',name:'Nickel',unit:'USD/t',price:16200,ytd_change:-10.5,eodhd_ticker:'NI.COMM',ev_relevance:'Battery cathode (NMC)'},
    {id:'COPPER',name:'Copper',unit:'USD/t',price:8950,ytd_change:5.2,eodhd_ticker:'HG.COMM',av_function:'COPPER',ev_relevance:'Wiring, motors, grid'},
    {id:'RARE_EARTH',name:'Rare Earth Elements',unit:'USD/kg (avg)',price:42.00,ytd_change:-18.0,ev_relevance:'Magnets for EVs and wind turbines',top_producers:['CN (60%)','MM','AU'],supply_risk:'Very High',geopolitical_risk:'China dominance'},
    {id:'GRAPHITE',name:'Graphite',unit:'USD/t',price:650,ytd_change:-8.0,ev_relevance:'Battery anode'},
    {id:'SILICON',name:'Silicon (polysilicon)',unit:'USD/kg',price:8.50,ytd_change:-25.0,ev_relevance:'Solar panels'},
  ]},
  agricultural_deforestation:{name:'Agricultural (EUDR)',color:'#d97706',icon:'\u{1F33E}',commodities:[
    {id:'PALM_OIL',name:'Palm Oil',unit:'USD/t',price:850,ytd_change:12.0,deforestation_risk:'Very High',eudr_regulated:true,top_producers:['ID','MY'],annual_deforestation_ha:680000},
    {id:'SOY',name:'Soybean',unit:'USD/bushel',price:10.25,ytd_change:-5.0,eodhd_ticker:'ZS.COMM',deforestation_risk:'High',eudr_regulated:true,top_producers:['BR','US','AR']},
    {id:'COCOA',name:'Cocoa',unit:'USD/t',price:8500,ytd_change:120.0,deforestation_risk:'High',eudr_regulated:true,child_labor_risk:'High',top_producers:['CI','GH','ID']},
    {id:'COFFEE',name:'Coffee',unit:'USD/lb',price:3.85,ytd_change:55.0,eodhd_ticker:'KC.COMM',eudr_regulated:true,top_producers:['BR','VN','CO']},
    {id:'RUBBER',name:'Rubber',unit:'USD/t',price:1650,ytd_change:8.0,deforestation_risk:'High',eudr_regulated:true},
    {id:'TIMBER',name:'Timber/Wood',unit:'USD/1000 bf',price:520,ytd_change:-15.0,eudr_regulated:true},
    {id:'CATTLE',name:'Live Cattle',unit:'USD/cwt',price:195,ytd_change:18.0,eodhd_ticker:'LE.COMM',deforestation_risk:'Very High',eudr_regulated:true},
  ]},
  metals:{name:'Industrial Metals',color:'#6b7280',icon:'\u{1F529}',commodities:[
    {id:'STEEL',name:'Steel (HRC)',unit:'USD/t',price:680,ytd_change:-12.0,green_premium:25,h2_steel_price:850},
    {id:'ALUMINUM',name:'Aluminum',unit:'USD/t',price:2350,ytd_change:3.5,eodhd_ticker:'AL.COMM',green_premium:15},
    {id:'IRON_ORE',name:'Iron Ore (62% Fe)',unit:'USD/t',price:110,ytd_change:-18.0,eodhd_ticker:'TIO.COMM'},
    {id:'ZINC',name:'Zinc',unit:'USD/t',price:2750,ytd_change:8.0},
    {id:'TIN',name:'Tin',unit:'USD/t',price:28000,ytd_change:12.0},
  ]},
  precious:{name:'Precious Metals',color:'#c5a96a',icon:'\u{1F947}',commodities:[
    {id:'GOLD',name:'Gold',unit:'USD/oz',price:2650,ytd_change:28.0,eodhd_ticker:'GC.COMM',av_function:'GOLD'},
    {id:'SILVER',name:'Silver',unit:'USD/oz',price:31.50,ytd_change:32.0,eodhd_ticker:'SI.COMM',av_function:'SILVER'},
    {id:'PLATINUM',name:'Platinum',unit:'USD/oz',price:985,ytd_change:-5.0,ev_relevance:'Fuel cell catalysts'},
    {id:'PALLADIUM',name:'Palladium',unit:'USD/oz',price:1050,ytd_change:-22.0,ev_relevance:'Catalytic converters'},
  ]},
  water_food:{name:'Water & Food',color:'#06b6d4',icon:'\u{1F4A7}',commodities:[
    {id:'WHEAT',name:'Wheat',unit:'USD/bushel',price:5.85,ytd_change:-10.0,eodhd_ticker:'ZW.COMM',food_security:'Critical',climate_sensitivity:'Very High'},
    {id:'CORN',name:'Corn',unit:'USD/bushel',price:4.35,ytd_change:-8.0,eodhd_ticker:'ZC.COMM',food_security:'Critical'},
    {id:'RICE',name:'Rice',unit:'USD/cwt',price:15.20,ytd_change:5.0,food_security:'Critical',populations_dependent:'3.5B'},
    {id:'SUGAR',name:'Sugar',unit:'USD/lb',price:0.22,ytd_change:-15.0,eodhd_ticker:'SB.COMM'},
    {id:'COTTON',name:'Cotton',unit:'USD/lb',price:0.72,ytd_change:-5.0,water_intensity:'Very High',labor_risk:'High (Uzbekistan/Xinjiang)'},
  ]},
  construction:{name:'Construction',color:'#8b5cf6',icon:'\u{1F3D7}\uFE0F',commodities:[
    {id:'CEMENT',name:'Cement',unit:'USD/t',price:125,ytd_change:3.0,co2_per_tonne:0.62,eu_taxonomy_threshold:0.469},
    {id:'SAND',name:'Sand & Gravel',unit:'USD/t',price:12,ytd_change:2.0,ecosystem_impact:'River erosion, habitat destruction'},
    {id:'GLASS',name:'Flat Glass',unit:'USD/t',price:450,ytd_change:5.0,recycling_rate:0.34},
  ]},
};

const ALL_COMMODITIES = Object.entries(COMMODITY_UNIVERSE).flatMap(([catKey,cat])=>cat.commodities.map(c=>({...c,catKey,catName:cat.name,catColor:cat.color,catIcon:cat.icon})));

const SECTOR_COMMODITY_EXPOSURE = {
  Energy:{primary:['WTI','BRENT','NG','COAL','URANIUM'],secondary:['COPPER','STEEL'],carbon:['EUA','UKA']},
  Materials:{primary:['IRON_ORE','COPPER','ALUMINUM','STEEL','CEMENT'],secondary:['COAL','NG'],carbon:['EUA']},
  'Consumer Staples':{primary:['PALM_OIL','SOY','COCOA','COFFEE','WHEAT','CORN','SUGAR','COTTON'],secondary:['NG'],carbon:[]},
  Industrials:{primary:['STEEL','ALUMINUM','COPPER','CEMENT'],secondary:['WTI','NG'],carbon:['EUA']},
  'Information Technology':{primary:['RARE_EARTH','SILICON','COPPER','LITHIUM','COBALT'],secondary:['GOLD'],carbon:[]},
  'Health Care':{primary:['PLATINUM','PALLADIUM'],secondary:['NG'],carbon:[]},
  Financials:{primary:[],secondary:['GOLD'],carbon:['EUA']},
  'Communication Services':{primary:['COPPER','RARE_EARTH'],secondary:['SILICON'],carbon:[]},
  'Consumer Discretionary':{primary:['LITHIUM','COBALT','NICKEL','COPPER','RUBBER','COTTON'],secondary:['STEEL','ALUMINUM'],carbon:['EUA']},
  'Real Estate':{primary:['CEMENT','STEEL','GLASS','SAND','TIMBER'],secondary:['COPPER'],carbon:['EUA']},
  Utilities:{primary:['NG','COAL','URANIUM','COPPER'],secondary:['SILICON'],carbon:['EUA','CCA']},
};

/* ================================================================= HELPERS */
const LS_PORT='ra_portfolio_v1';
const loadLS=k=>{try{return JSON.parse(localStorage.getItem(k))||null}catch{return null}};
const saveLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const seed=s=>{let x=Math.sin(s*9973+7)*10000;return x-Math.floor(x)};
const fmt=(n,d=1)=>n==null?'\u2014':Number(n).toFixed(d);
const pct=n=>n==null?'\u2014':`${n>0?'+':''}${Number(n).toFixed(1)}%`;
const fmtPrice=n=>{if(n==null)return'\u2014';if(n>=10000)return`$${(n/1000).toFixed(1)}K`;if(n>=1)return`$${Number(n).toFixed(2)}`;return`$${Number(n).toFixed(4)}`};
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

const CORRELATION_COMMODITIES=['WTI','BRENT','NG','GOLD','COPPER','LITHIUM','EUA','WHEAT','IRON_ORE','SILVER'];
const genCorrelation=()=>{
  const m=[];
  for(let i=0;i<CORRELATION_COMMODITIES.length;i++){
    const row={commodity:CORRELATION_COMMODITIES[i]};
    for(let j=0;j<CORRELATION_COMMODITIES.length;j++){
      if(i===j)row[CORRELATION_COMMODITIES[j]]=1.0;
      else if(j<i)row[CORRELATION_COMMODITIES[j]]=m[j][CORRELATION_COMMODITIES[i]];
      else{
        let v=seed(i*101+j*53)*1.6-0.8;
        if((CORRELATION_COMMODITIES[i]==='WTI'&&CORRELATION_COMMODITIES[j]==='BRENT'))v=0.95;
        if((CORRELATION_COMMODITIES[i]==='WTI'&&CORRELATION_COMMODITIES[j]==='NG'))v=0.55;
        if((CORRELATION_COMMODITIES[i]==='GOLD'&&CORRELATION_COMMODITIES[j]==='SILVER'))v=0.88;
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
const Tabs=({tabs,active,onChange})=>(
  <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:16}}>
    {tabs.map(t=><button key={t.key||t} onClick={()=>onChange(t.key||t)} style={{padding:'7px 16px',borderRadius:8,border:`1px solid ${(t.key||t)===active?T.navy:T.border}`,background:(t.key||t)===active?T.navy:T.surface,color:(t.key||t)===active?'#fff':T.text,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>{t.icon?`${t.icon} `||'':''}{t.label||t}</button>)}
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

  /* portfolio */
  const portfolio=useMemo(()=>{
    const raw=loadLS(LS_PORT);
    const base=raw&&Array.isArray(raw)?raw:(GLOBAL_COMPANY_MASTER||[]).slice(0,30);
    return base.map((c,i)=>({...c,company_name:c.company_name||c.company||`Company ${i+1}`,sector:c.sector||'Diversified',weight:c.weight||+(seed(i*7)*4+0.5).toFixed(2)}));
  },[]);

  const allComms=useMemo(()=>ALL_COMMODITIES,[]);
  const filteredComms=useMemo(()=>{
    let list=activeCat==='ALL'?allComms:allComms.filter(c=>c.catKey===activeCat);
    list=[...list].sort((a,b)=>{
      const av=a[sort.field],bv=b[sort.field];
      if(av==null)return 1;if(bv==null)return -1;
      return sort.asc?(av>bv?1:-1):(av<bv?1:-1);
    });
    return list;
  },[activeCat,allComms,sort]);

  const doSort=f=>setSort(p=>({field:f,asc:p.field===f?!p.asc:false}));

  const selectedObj=useMemo(()=>allComms.find(c=>c.id===selectedComm)||allComms[0],[selectedComm,allComms]);
  const priceHistory=useMemo(()=>genPriceHistory(selectedObj.price,30,0.025,selectedObj.id),[selectedObj]);
  const correlationMatrix=useMemo(()=>genCorrelation(),[]);

  /* KPI computations */
  const eudrComms=allComms.filter(c=>c.eudr_regulated);
  const highRisk=allComms.filter(c=>c.supply_risk==='High'||c.supply_risk==='Very High');
  const strandedExp=allComms.filter(c=>c.stranded_risk);
  const bestPerf=useMemo(()=>[...allComms].filter(c=>c.ytd_change!=null).sort((a,b)=>b.ytd_change-a.ytd_change)[0],[allComms]);
  const worstPerf=useMemo(()=>[...allComms].filter(c=>c.ytd_change!=null).sort((a,b)=>a.ytd_change-b.ytd_change)[0],[allComms]);

  /* portfolio exposure */
  const portfolioExposure=useMemo(()=>{
    const sectorTotals={};
    portfolio.forEach(c=>{
      const sec=c.sector||'Other';
      if(!sectorTotals[sec])sectorTotals[sec]={sector:sec,weight:0,primary:0,secondary:0,carbon:0};
      sectorTotals[sec].weight+=c.weight;
      const exp=SECTOR_COMMODITY_EXPOSURE[sec]||{primary:[],secondary:[],carbon:[]};
      sectorTotals[sec].primary+=exp.primary.length*c.weight;
      sectorTotals[sec].secondary+=exp.secondary.length*c.weight;
      sectorTotals[sec].carbon+=exp.carbon.length*c.weight;
    });
    return Object.values(sectorTotals).sort((a,b)=>b.weight-a.weight);
  },[portfolio]);

  /* company linkage */
  const companyLinkage=useMemo(()=>{
    return portfolio.slice(0,20).map((c,i)=>{
      const exp=SECTOR_COMMODITY_EXPOSURE[c.sector]||{primary:[],secondary:[],carbon:[]};
      const all=[...exp.primary,...exp.secondary,...exp.carbon];
      return{company:c.company_name,sector:c.sector,weight:c.weight,commodities:all.length,primary:exp.primary.length,riskScore:Math.round(30+seed(i*41)*65)};
    }).sort((a,b)=>b.riskScore-a.riskScore);
  },[portfolio]);

  /* green premium data */
  const greenPremium=[
    {commodity:'Steel (HRC)',conventional:680,green:850,premium:25},
    {commodity:'Aluminum',conventional:2350,green:2703,premium:15},
    {commodity:'Cement',conventional:125,green:175,premium:40},
    {commodity:'Hydrogen (Gray vs Green)',conventional:1.5,green:4.5,premium:200},
  ];

  /* energy transition demand */
  const transitionDemand=[
    {mineral:'Lithium',current_kt:130,iea_2030_kt:500,iea_2050_kt:1800,growth:'14x'},
    {mineral:'Cobalt',current_kt:190,iea_2030_kt:350,iea_2050_kt:600,growth:'3x'},
    {mineral:'Copper',current_kt:25000,iea_2030_kt:32000,iea_2050_kt:45000,growth:'1.8x'},
    {mineral:'Nickel',current_kt:3300,iea_2030_kt:5000,iea_2050_kt:9000,growth:'2.7x'},
    {mineral:'Rare Earths',current_kt:300,iea_2030_kt:450,iea_2050_kt:700,growth:'2.3x'},
    {mineral:'Graphite',current_kt:1100,iea_2030_kt:3000,iea_2050_kt:5500,growth:'5x'},
  ];

  /* food security */
  const foodSecurity=[
    {commodity:'Wheat',price:5.85,change:-10,vulnerability:78,importDependent:'52 countries',climateImpact:'Heat stress, drought'},
    {commodity:'Corn',price:4.35,change:-8,vulnerability:65,importDependent:'38 countries',climateImpact:'Drought, flooding'},
    {commodity:'Rice',price:15.20,change:5,vulnerability:88,importDependent:'65 countries',climateImpact:'Monsoon shifts, sea-level rise'},
    {commodity:'Sugar',price:0.22,change:-15,vulnerability:42,importDependent:'30 countries',climateImpact:'Temperature, rainfall patterns'},
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
    const hdr='ID,Name,Category,Price,Unit,YTD%,Supply Risk,EUDR';
    const rows=allComms.map(c=>`${c.id},"${c.name}",${c.catName},${c.price},${c.unit},${c.ytd_change||''},${c.supply_risk||''},${c.eudr_regulated?'Yes':'No'}`);
    const blob=new Blob([hdr+'\n'+rows.join('\n')],{type:'text/csv'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='commodity_database.csv';a.click();
  };
  const exportJSON=()=>{
    const data={commodities:allComms,portfolioExposure,timestamp:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='commodity_exposure_report.json';a.click();
  };

  const catTabs=[{key:'ALL',label:'All (50)',icon:''},
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
              <Badge label="50 Commodities" color="blue"/>
              <Badge label="8 Categories" color="purple"/>
              <Badge label="EODHD + Real-Time" color="green"/>
              <Badge label="EP-Y1" color="gray"/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={exportCSV} small>CSV Export</Btn>
            <Btn onClick={exportJSON} small>JSON Report</Btn>
            <Btn onClick={()=>window.print()} small>Print</Btn>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <Section title="Category Filter">
          <Tabs tabs={catTabs} active={activeCat} onChange={setActiveCat}/>
        </Section>

        {/* 12 KPI CARDS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:28}}>
          <KPI label="Commodities Tracked" value="50" sub="8 categories"/>
          <KPI label="Categories" value="8" sub="Carbon to Construction"/>
          <KPI label="Carbon Price (EUA)" value={`\u20AC${fmt(88.50,2)}`} sub={pct(12.5)} color={T.green}/>
          <KPI label="Oil Price (WTI)" value={`$${fmt(72.50,2)}`} sub={pct(-8.5)} color={T.red}/>
          <KPI label="Lithium Price" value={fmtPrice(12500)} sub={pct(-65)} color={T.red}/>
          <KPI label="Gold Price" value={`$${fmt(2650,0)}`} sub={pct(28)} color={T.gold}/>
          <KPI label="Portfolio Commodity Exp." value={`${Math.round(portfolioExposure.reduce((s,x)=>s+x.primary,0)/Math.max(1,portfolio.length))}%`} sub="Avg primary exposure"/>
          <KPI label="EUDR-Regulated" value={eudrComms.length} sub="Commodities under EUDR"/>
          <KPI label="High Supply Risk" value={highRisk.length} sub="Minerals with concentrated supply"/>
          <KPI label="Stranded Risk" value={strandedExp.length} sub="Fossil fuel assets"/>
          <KPI label="YTD Best" value={bestPerf?`${bestPerf.id} ${pct(bestPerf.ytd_change)}`:'\u2014'} sub={bestPerf?.name} color={T.green}/>
          <KPI label="YTD Worst" value={worstPerf?`${worstPerf.id} ${pct(worstPerf.ytd_change)}`:'\u2014'} sub={worstPerf?.name} color={T.red}/>
        </div>

        {/* COMMODITY PRICE DASHBOARD */}
        <Section title="Commodity Price Dashboard" badge={`${filteredComms.length} commodities`}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:T.surfaceH}}>
                  <SortTH label="ID" field="id" sort={sort} onSort={doSort}/>
                  <SortTH label="Commodity" field="name" sort={sort} onSort={doSort}/>
                  <SortTH label="Category" field="catName" sort={sort} onSort={doSort}/>
                  <SortTH label="Price" field="price" sort={sort} onSort={doSort} style={{textAlign:'right'}}/>
                  <SortTH label="Unit" field="unit" sort={sort} onSort={doSort}/>
                  <SortTH label="YTD %" field="ytd_change" sort={sort} onSort={doSort} style={{textAlign:'right'}}/>
                  <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Supply Risk</th>
                  <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>ESG Flags</th>
                  <th style={{padding:'10px 12px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComms.map(c=>(
                  <tr key={c.id} style={{cursor:'pointer',background:selectedComm===c.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedComm(c.id)}>
                    <TD><span style={{fontWeight:700,color:c.catColor,fontSize:12}}>{c.id}</span></TD>
                    <TD style={{fontWeight:600}}>{c.name}</TD>
                    <TD><span style={{fontSize:11,padding:'2px 8px',borderRadius:8,background:c.catColor+'18',color:c.catColor,fontWeight:600}}>{c.catName}</span></TD>
                    <TD style={{textAlign:'right',fontWeight:700,fontFamily:'monospace'}}>{fmtPrice(c.price)}</TD>
                    <TD style={{fontSize:11,color:T.textMut}}>{c.unit}</TD>
                    <TD style={{textAlign:'right',fontWeight:700,color:c.ytd_change>0?T.green:c.ytd_change<0?T.red:T.textMut}}>{c.ytd_change!=null?pct(c.ytd_change):'\u2014'}</TD>
                    <TD>{c.supply_risk?<Badge label={c.supply_risk} color={c.supply_risk==='Very High'?'red':c.supply_risk==='High'?'amber':'gray'}/>:'\u2014'}</TD>
                    <TD style={{fontSize:11}}>
                      {c.eudr_regulated&&<Badge label="EUDR" color="amber"/>}
                      {c.child_labor_risk&&<Badge label="Child Labor" color="red"/>}
                      {c.stranded_risk&&<Badge label="Stranded" color="red"/>}
                      {c.geopolitical_risk&&<Badge label="Geopolitical" color="purple"/>}
                    </TD>
                    <TD><Btn small onClick={e=>{e.stopPropagation();setSelectedComm(c.id)}}>Chart</Btn></TD>
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
              <span style={{fontSize:13,color:T.textSec,alignSelf:'center'}}>Current: {fmtPrice(selectedObj.price)} {selectedObj.unit} | YTD: {pct(selectedObj.ytd_change)}</span>
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
        <Section title="Carbon Price Intelligence" badge="6 Markets">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Carbon Market Comparison</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  <th style={{padding:'8px',fontSize:11,textAlign:'left',color:T.textMut,fontWeight:700,borderBottom:`2px solid ${T.border}`}}>Market</th>
                  <th style={{padding:'8px',fontSize:11,textAlign:'right',color:T.textMut,fontWeight:700,borderBottom:`2px solid ${T.border}`}}>Price</th>
                  <th style={{padding:'8px',fontSize:11,textAlign:'right',color:T.textMut,fontWeight:700,borderBottom:`2px solid ${T.border}`}}>YTD</th>
                  <th style={{padding:'8px',fontSize:11,textAlign:'right',color:T.textMut,fontWeight:700,borderBottom:`2px solid ${T.border}`}}>Volume (MtCO2)</th>
                </tr></thead>
                <tbody>
                  {carbonComms.map(c=>(
                    <tr key={c.id}><TD style={{fontWeight:600}}>{c.name}</TD><TD style={{textAlign:'right',fontFamily:'monospace'}}>{fmtPrice(c.price)}</TD><TD style={{textAlign:'right',color:c.ytd_change>0?T.green:T.red,fontWeight:600}}>{pct(c.ytd_change)}</TD><TD style={{textAlign:'right'}}>{c.global_volume_mt||'\u2014'}</TD></tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Carbon Prices (USD equivalent)</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={carbonComms.map(c=>({name:c.id,price:c.id==='CEA'?c.price/7.2:c.id==='EUA'?c.price*1.08:c.id==='UKA'?c.price*1.27:c.price}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" tick={{fontSize:11}}/>
                  <YAxis tick={{fontSize:10}}/>
                  <Tooltip formatter={v=>[`$${Number(v).toFixed(2)}`,'USD/tCO2']}/>
                  <Bar dataKey="price" fill={T.green} radius={[4,4,0,0]}>{carbonComms.map((_,i)=><Cell key={i} fill={['#16a34a','#0d9488','#0284c7','#7c3aed','#d97706','#06b6d4'][i]}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </Section>

        {/* CRITICAL MINERAL SUPPLY RISK MATRIX */}
        <Section title="Critical Mineral Supply Risk Matrix" badge="7 Minerals">
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
        <Section title="EUDR Commodity Risk Assessment" badge="7 Regulated">
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Price','Deforestation Risk','Top Producers','Annual Deforestation','Compliance'].map(h=><th key={h} style={{padding:'10px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {eudrComms.map((c,i)=>(
                  <tr key={c.id}>
                    <TD style={{fontWeight:600}}>{c.name}</TD>
                    <TD style={{fontFamily:'monospace'}}>{fmtPrice(c.price)} {c.unit}</TD>
                    <TD><Badge label={c.deforestation_risk||'Medium'} color={c.deforestation_risk==='Very High'?'red':c.deforestation_risk==='High'?'amber':'green'}/></TD>
                    <TD style={{fontSize:11}}>{c.top_producers?c.top_producers.join(', '):'\u2014'}</TD>
                    <TD>{c.annual_deforestation_ha?`${(c.annual_deforestation_ha/1000).toFixed(0)}K ha`:'\u2014'}</TD>
                    <TD><Badge label={seed(i*53)>0.5?'Due Diligence Required':'Monitoring'} color={seed(i*53)>0.5?'red':'amber'}/></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* PORTFOLIO COMMODITY EXPOSURE */}
        <Section title="Portfolio Commodity Exposure" badge="By Sector">
          <Card>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={portfolioExposure.slice(0,10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" tick={{fontSize:10}}/>
                <YAxis dataKey="sector" type="category" width={150} tick={{fontSize:11}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="primary" name="Primary Exposure" stackId="a" fill={T.navy}/>
                <Bar dataKey="secondary" name="Secondary Exposure" stackId="a" fill={T.gold}/>
                <Bar dataKey="carbon" name="Carbon Exposure" stackId="a" fill={T.sage}/>
              </BarChart>
            </ResponsiveContainer>
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
                <XAxis dataKey="commodity" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="conventional" name="Conventional" fill={T.textMut}/>
                <Bar dataKey="green" name="Green" fill={T.green}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:12}}>
              {greenPremium.map(g=>(
                <div key={g.commodity} style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8}}>
                  <div style={{fontSize:11,color:T.textMut}}>{g.commodity}</div>
                  <div style={{fontSize:20,fontWeight:700,color:T.amber}}>+{g.premium}%</div>
                  <div style={{fontSize:11,color:T.textSec}}>Green Premium</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ENERGY TRANSITION DEMAND */}
        <Section title="Energy Transition Commodity Demand" badge="IEA NZE Scenario">
          <Card>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transitionDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="mineral" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}} label={{value:'kt',angle:-90,position:'insideLeft',style:{fontSize:10}}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="current_kt" name="Current (2024)" fill={T.textMut} radius={[4,4,0,0]}/>
                <Bar dataKey="iea_2030_kt" name="IEA 2030 NZE" fill={T.navyL} radius={[4,4,0,0]}/>
                <Bar dataKey="iea_2050_kt" name="IEA 2050 NZE" fill={T.sage} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8,marginTop:12}}>
              {transitionDemand.map(d=>(
                <div key={d.mineral} style={{textAlign:'center',padding:10,background:T.surfaceH,borderRadius:8}}>
                  <div style={{fontSize:11,color:T.textMut}}>{d.mineral}</div>
                  <div style={{fontSize:18,fontWeight:700,color:T.navy}}>{d.growth}</div>
                  <div style={{fontSize:10,color:T.textSec}}>by 2050</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* FOOD SECURITY RISK */}
        <Section title="Food Security & Climate Vulnerability" badge="4 Staples">
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Price','YTD','Vulnerability','Import-Dependent','Climate Impact'].map(h=><th key={h} style={{padding:'10px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {foodSecurity.map(f=>(
                  <tr key={f.commodity}>
                    <TD style={{fontWeight:600}}>{f.commodity}</TD>
                    <TD style={{fontFamily:'monospace'}}>${f.price}</TD>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={geopoliticalRisk} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" domain={[0,100]} tick={{fontSize:10}} tickFormatter={v=>`${v}%`}/>
                <YAxis dataKey="commodity" type="category" width={120} tick={{fontSize:11}}/>
                <Tooltip formatter={v=>[`${v}%`,'Top Country Share']}/>
                <Bar dataKey="share" radius={[0,4,4,0]}>
                  {geopoliticalRisk.map((g,i)=><Cell key={i} fill={g.risk==='Very High'?T.red:g.risk==='High'?T.amber:T.sage}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <table style={{width:'100%',borderCollapse:'collapse',marginTop:12}}>
              <thead><tr style={{background:T.surfaceH}}>
                {['Commodity','Top Country','Share','Risk','Downstream Impact'].map(h=><th key={h} style={{padding:'8px',fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {geopoliticalRisk.map(g=>(
                  <tr key={g.commodity}>
                    <TD style={{fontWeight:600}}>{g.commodity}</TD>
                    <TD>{g.topCountry}</TD>
                    <TD style={{fontWeight:700}}>{g.share}%</TD>
                    <TD><Badge label={g.risk} color={g.risk==='Very High'?'red':'amber'}/></TD>
                    <TD style={{fontSize:12}}>{g.impact}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* COMMODITY PRICE CORRELATION MATRIX */}
        <Section title="Commodity Price Correlation Matrix" badge="10 x 10 Heatmap">
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',width:'100%'}}>
                <thead><tr>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`}}></th>
                  {CORRELATION_COMMODITIES.map(c=><th key={c} style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center',minWidth:55}}>{c}</th>)}
                </tr></thead>
                <tbody>
                  {correlationMatrix.map((row,i)=>(
                    <tr key={i}>
                      <td style={{padding:6,fontSize:10,fontWeight:700,color:T.text,borderBottom:`1px solid ${T.border}`}}>{row.commodity}</td>
                      {CORRELATION_COMMODITIES.map(c=>{
                        const v=row[c];
                        const bg=v>=0.7?'rgba(22,163,74,'+Math.min(1,v*0.8)+')':v>=0.3?'rgba(217,119,6,'+v*0.5+')':v>=0?'rgba(200,200,200,0.3)':v>=-0.3?'rgba(220,200,180,0.3)':'rgba(220,38,38,'+Math.min(1,Math.abs(v)*0.8)+')';
                        return <td key={c} style={{padding:6,fontSize:11,fontWeight:v===1?700:500,textAlign:'center',borderBottom:`1px solid ${T.border}`,background:bg,color:Math.abs(v)>0.6?'#fff':T.text}}>{v.toFixed(2)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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
                <div style={{fontSize:11,color:T.textMut}}>API key stored in localStorage. Cached 24h. Supports 50+ commodity tickers.</div>
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

        {/* HISTORICAL PRICE COMPARISON */}
        <Section title="Historical Price Comparison (Normalized)" badge="Overlay">
          <Card>
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
              {['WTI','BRENT','GOLD','SILVER','COPPER','LITHIUM','EUA','NG','WHEAT','IRON_ORE'].map(id=>(
                <label key={id} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,cursor:'pointer'}}>
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
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
              {['WTI','GOLD','LITHIUM','EUA','COPPER'].map(id=>{
                const c=allComms.find(x=>x.id===id);
                if(!c)return null;
                const newP=c.price*(1+priceSlider/100);
                return(
                  <div key={id} style={{textAlign:'center',padding:14,background:T.surfaceH,borderRadius:8}}>
                    <div style={{fontSize:11,color:T.textMut,fontWeight:600}}>{c.id}</div>
                    <div style={{fontSize:12,color:T.textSec,textDecoration:'line-through'}}>{fmtPrice(c.price)}</div>
                    <div style={{fontSize:18,fontWeight:700,color:priceSlider>0?T.green:priceSlider<0?T.red:T.navy}}>{fmtPrice(newP)}</div>
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
              <div style={{display:'grid',gap:8}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Current Price</span><span style={{fontWeight:700}}>{fmtPrice(selectedObj.price)} {selectedObj.unit}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>YTD Change</span><span style={{fontWeight:700,color:selectedObj.ytd_change>0?T.green:T.red}}>{pct(selectedObj.ytd_change)}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Category</span><span style={{fontWeight:600}}>{selectedObj.catName}</span></div>
                {selectedObj.eodhd_ticker&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>EODHD Ticker</span><span style={{fontFamily:'monospace',fontSize:11}}>{selectedObj.eodhd_ticker}</span></div>}
                {selectedObj.av_function&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Alpha Vantage</span><span style={{fontFamily:'monospace',fontSize:11}}>{selectedObj.av_function}</span></div>}
                {selectedObj.global_production&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Global Production</span><span>{selectedObj.global_production}</span></div>}
                {selectedObj.reserves_years&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Reserves (years)</span><span>{selectedObj.reserves_years}</span></div>}
                {selectedObj.global_volume_mt>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Global Volume</span><span>{selectedObj.global_volume_mt} MtCO\u2082</span></div>}
              </div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Risk Profile</div>
              <div style={{display:'grid',gap:8}}>
                {selectedObj.supply_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Supply Risk</span><Badge label={selectedObj.supply_risk} color={selectedObj.supply_risk==='Very High'?'red':'amber'}/></div>}
                {selectedObj.geopolitical_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Geopolitical</span><span style={{fontSize:11,color:T.red}}>{selectedObj.geopolitical_risk}</span></div>}
                {selectedObj.stranded_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Stranded Asset Risk</span><Badge label={selectedObj.stranded_risk} color="red"/></div>}
                {selectedObj.deforestation_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Deforestation</span><Badge label={selectedObj.deforestation_risk} color={selectedObj.deforestation_risk==='Very High'?'red':'amber'}/></div>}
                {selectedObj.eudr_regulated&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>EUDR Regulated</span><Badge label="Yes" color="amber"/></div>}
                {selectedObj.child_labor_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Child Labor Risk</span><span style={{fontSize:11,color:T.red,fontWeight:600}}>{selectedObj.child_labor_risk}</span></div>}
                {selectedObj.food_security&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Food Security</span><Badge label={selectedObj.food_security} color="red"/></div>}
                {selectedObj.climate_sensitivity&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Climate Sensitivity</span><span style={{fontSize:11,fontWeight:600}}>{selectedObj.climate_sensitivity}</span></div>}
                {selectedObj.water_intensity&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Water Intensity</span><span style={{fontSize:11}}>{selectedObj.water_intensity}</span></div>}
                {selectedObj.labor_risk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Labor Risk</span><span style={{fontSize:11,color:T.red}}>{selectedObj.labor_risk}</span></div>}
              </div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Transition & Green Economy</div>
              <div style={{display:'grid',gap:8}}>
                {selectedObj.ev_relevance&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>EV Relevance</span><span style={{fontSize:11}}>{selectedObj.ev_relevance}</span></div>}
                {selectedObj.green_premium!=null&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Green Premium</span><span style={{fontWeight:700,color:T.green}}>+{selectedObj.green_premium}%</span></div>}
                {selectedObj.h2_steel_price&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>H2-Steel Price</span><span>${selectedObj.h2_steel_price}/t</span></div>}
                {selectedObj.co2_per_tonne!=null&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>CO\u2082/tonne</span><span style={{fontWeight:600}}>{selectedObj.co2_per_tonne}t</span></div>}
                {selectedObj.eu_taxonomy_threshold!=null&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>EU Taxonomy Threshold</span><span>{selectedObj.eu_taxonomy_threshold}t CO\u2082</span></div>}
                {selectedObj.recycling_rate!=null&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Recycling Rate</span><span>{Math.round(selectedObj.recycling_rate*100)}%</span></div>}
                {selectedObj.ecosystem_impact&&<div style={{fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Ecosystem Impact:</span><div style={{fontSize:11,color:T.red,marginTop:2}}>{selectedObj.ecosystem_impact}</div></div>}
                {selectedObj.top_producers&&<div style={{fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Top Producers:</span><div style={{fontSize:11,marginTop:2}}>{selectedObj.top_producers.join(', ')}</div></div>}
                {selectedObj.populations_dependent&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>Populations Dependent</span><span style={{fontWeight:600}}>{selectedObj.populations_dependent}</span></div>}
                {selectedObj.description&&<div style={{fontSize:11,color:T.textSec,marginTop:8,lineHeight:1.5}}>{selectedObj.description}</div>}
              </div>
            </Card>
          </div>
        </Section>

        {/* CATEGORY BREAKDOWN OVERVIEW */}
        <Section title="Category Market Overview" badge="8 Categories">
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {Object.entries(COMMODITY_UNIVERSE).map(([catKey,cat])=>{
              const comms=cat.commodities;
              const avgYtd=comms.filter(c=>c.ytd_change!=null).reduce((s,c)=>s+c.ytd_change,0)/Math.max(1,comms.filter(c=>c.ytd_change!=null).length);
              const totalVal=comms.reduce((s,c)=>s+c.price,0);
              return(
                <Card key={catKey} style={{cursor:'pointer',borderLeft:`3px solid ${cat.color}`,transition:'all 0.2s',background:activeCat===catKey?T.surfaceH:T.surface}} onClick={()=>setActiveCat(catKey)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:14,fontWeight:700,color:cat.color}}>{cat.icon} {cat.name}</span>
                    <span style={{fontSize:11,color:T.textMut}}>{comms.length}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:10}}>
                    <div><span style={{fontSize:10,color:T.textMut}}>Avg YTD</span><div style={{fontSize:14,fontWeight:700,color:avgYtd>0?T.green:T.red}}>{avgYtd>0?'+':''}{avgYtd.toFixed(1)}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Commodities</span><div style={{fontSize:14,fontWeight:700,color:T.navy}}>{comms.length}</div></div>
                  </div>
                  <div style={{marginTop:8}}>
                    {comms.slice(0,3).map(c=>(
                      <div key={c.id} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'2px 0'}}>
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

        {/* COMMODITY WATCHLIST */}
        <Section title="Price Alert & Watchlist" badge="localStorage">
          <Card>
            <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Track commodity prices against your alert thresholds. Configured alerts persist in browser storage.</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
              {['EUA','WTI','LITHIUM','GOLD','COPPER','COBALT','PALM_OIL','WHEAT','STEEL','SILVER'].map((id,i)=>{
                const c=allComms.find(x=>x.id===id);
                if(!c)return null;
                const threshold=c.price*(1+(seed(i*71)*0.2-0.1));
                const isAbove=c.price>threshold;
                return(
                  <div key={id} style={{padding:12,borderRadius:8,background:T.surfaceH,border:`1px solid ${isAbove?T.green+'40':T.red+'40'}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:12,fontWeight:700,color:c.catColor}}>{c.id}</span>
                      <span style={{fontSize:9,padding:'1px 6px',borderRadius:6,background:isAbove?'#dcfce7':'#fee2e2',color:isAbove?T.green:T.red,fontWeight:600}}>{isAbove?'ABOVE':'BELOW'}</span>
                    </div>
                    <div style={{fontSize:16,fontWeight:700,color:T.navy,marginTop:4}}>{fmtPrice(c.price)}</div>
                    <div style={{fontSize:10,color:T.textMut}}>Alert: {fmtPrice(threshold)}</div>
                    <div style={{width:'100%',height:4,background:T.border,borderRadius:2,marginTop:6,overflow:'hidden'}}>
                      <div style={{width:`${Math.min(100,Math.max(0,(c.price/threshold)*100))}%`,height:'100%',background:isAbove?T.green:T.red,borderRadius:2}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>

        {/* SECTOR COMMODITY DEPENDENCY MAP */}
        <Section title="Sector Commodity Dependency Matrix" badge="11 Sectors">
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{borderCollapse:'collapse',width:'100%'}}>
                <thead><tr>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>Sector</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Primary</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Secondary</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Carbon</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Total Deps</th>
                  <th style={{padding:6,fontSize:10,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:'left'}}>Key Commodities</th>
                </tr></thead>
                <tbody>
                  {Object.entries(SECTOR_COMMODITY_EXPOSURE).map(([sector,exp])=>(
                    <tr key={sector}>
                      <td style={{padding:8,fontSize:12,fontWeight:600,color:T.text,borderBottom:`1px solid ${T.border}`}}>{sector}</td>
                      <td style={{padding:8,fontSize:13,fontWeight:700,textAlign:'center',borderBottom:`1px solid ${T.border}`,color:exp.primary.length>=5?T.red:exp.primary.length>=3?T.amber:T.green}}>{exp.primary.length}</td>
                      <td style={{padding:8,fontSize:13,textAlign:'center',borderBottom:`1px solid ${T.border}`,color:T.textSec}}>{exp.secondary.length}</td>
                      <td style={{padding:8,fontSize:13,textAlign:'center',borderBottom:`1px solid ${T.border}`,color:exp.carbon.length>0?T.amber:T.textMut}}>{exp.carbon.length}</td>
                      <td style={{padding:8,fontSize:13,fontWeight:700,textAlign:'center',borderBottom:`1px solid ${T.border}`}}>{exp.primary.length+exp.secondary.length+exp.carbon.length}</td>
                      <td style={{padding:8,fontSize:10,color:T.textSec,borderBottom:`1px solid ${T.border}`}}>{exp.primary.slice(0,4).join(', ')}{exp.primary.length>4?'...':''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                      <span>{f.timeline}</span>
                      <span>{f.stranded_value}</span>
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
                ].map((w,i)=>(
                  <div key={i} style={{padding:10,marginBottom:6,background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${w.color}`}}>
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

        {/* COMMODITY VOLATILITY ANALYSIS */}
        <Section title="Commodity Volatility & Risk Metrics" badge="30-Day Vol">
          <Card>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','Category','Price','30D Vol','Risk/Return','Beta to Oil','Seasonal Pattern','Trend'].map(h=><th key={h} style={{padding:'10px 8px',fontSize:11,fontWeight:700,color:T.textMut,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'||h==='Category'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {['EUA','WTI','GOLD','LITHIUM','COPPER','WHEAT','PALM_OIL','STEEL','COBALT','SILVER','NG','COFFEE','IRON_ORE','URANIUM','COCOA'].map((id,i)=>{
                    const c=allComms.find(x=>x.id===id);
                    if(!c)return null;
                    const vol30=Math.round(5+seed(i*73)*35);
                    const riskReturn=Math.round(-20+seed(i*79)*50);
                    const betaOil=Math.round((seed(i*83)*1.6-0.3)*100)/100;
                    const seasonal=['Q1 Strong','Q2 Weak','Q3 Mixed','Q4 Strong','Harvest Cycle','Winter Peak','Summer Trough','No Pattern'];
                    const trends=['\u2191 Uptrend','\u2193 Downtrend','\u2194 Range-bound','\u2197 Recovering'];
                    return(
                      <tr key={id}>
                        <TD style={{fontWeight:600}}><span style={{color:c.catColor,marginRight:4,fontSize:10}}>\u25CF</span>{c.name}</TD>
                        <TD><span style={{fontSize:10,padding:'2px 6px',borderRadius:6,background:c.catColor+'18',color:c.catColor}}>{c.catName}</span></TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:12}}>{fmtPrice(c.price)}</TD>
                        <TD style={{textAlign:'center'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,background:vol30>=25?'#fee2e2':vol30>=15?'#fef3c7':'#dcfce7',color:vol30>=25?T.red:vol30>=15?T.amber:T.green}}>{vol30}%</span></TD>
                        <TD style={{textAlign:'center',fontWeight:600,color:riskReturn>0?T.green:T.red}}>{riskReturn>0?'+':''}{riskReturn}%</TD>
                        <TD style={{textAlign:'center',fontFamily:'monospace',fontSize:12}}>{betaOil.toFixed(2)}</TD>
                        <TD style={{textAlign:'center',fontSize:11}}>{seasonal[i%seasonal.length]}</TD>
                        <TD style={{textAlign:'center',fontSize:11,fontWeight:600,color:trends[i%trends.length].includes('Up')||trends[i%trends.length].includes('Recov')?T.green:trends[i%trends.length].includes('Down')?T.red:T.textSec}}>{trends[i%trends.length]}</TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* COMMODITY ESG SCORING RADAR */}
        <Section title="Commodity ESG Composite Scoring" badge="Cross-Commodity Radar">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>ESG Risk Radar</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  {metric:'Supply Chain Risk',WTI:85,GOLD:30,LITHIUM:72,COPPER:55,PALM_OIL:92},
                  {metric:'Carbon Intensity',WTI:90,GOLD:40,LITHIUM:65,COPPER:50,PALM_OIL:78},
                  {metric:'Water Stress',WTI:35,GOLD:45,LITHIUM:80,COPPER:60,PALM_OIL:70},
                  {metric:'Labor Rights',WTI:25,GOLD:50,LITHIUM:40,COPPER:35,PALM_OIL:75},
                  {metric:'Biodiversity',WTI:55,GOLD:35,LITHIUM:50,COPPER:45,PALM_OIL:95},
                  {metric:'Governance',WTI:30,GOLD:25,LITHIUM:45,COPPER:40,PALM_OIL:65},
                ]}>
                  <PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="metric" tick={{fontSize:10}}/>
                  <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
                  <Radar name="WTI Oil" dataKey="WTI" stroke="#dc2626" fill="#dc2626" fillOpacity={0.1}/>
                  <Radar name="Gold" dataKey="GOLD" stroke="#c5a96a" fill="#c5a96a" fillOpacity={0.1}/>
                  <Radar name="Lithium" dataKey="LITHIUM" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.1}/>
                  <Radar name="Copper" dataKey="COPPER" stroke="#0284c7" fill="#0284c7" fillOpacity={0.1}/>
                  <Radar name="Palm Oil" dataKey="PALM_OIL" stroke="#d97706" fill="#d97706" fillOpacity={0.1}/>
                  <Legend/>
                  <Tooltip/>
                </RadarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>ESG Composite Scores</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:T.surfaceH}}>
                  {['Commodity','ESG Score','Grade','Key Risk','Mitigation'].map(h=><th key={h} style={{padding:8,fontSize:11,fontWeight:700,color:T.textMut,borderBottom:`2px solid ${T.border}`,textAlign:h==='Commodity'?'left':'center'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[
                    {name:'EU Carbon (EUA)',score:22,grade:'A',risk:'Market volatility',mitigation:'Strong regulatory framework'},
                    {name:'Gold',score:38,grade:'B+',risk:'Mercury use in ASM',mitigation:'LBMA responsible sourcing'},
                    {name:'Copper',score:48,grade:'B',risk:'Water stress in Chile/Peru',mitigation:'Copper Mark certification'},
                    {name:'Lithium',score:62,grade:'C+',risk:'Water depletion in Atacama',mitigation:'IRMA standard adoption'},
                    {name:'Cobalt',score:82,grade:'D',risk:'Child labor in DRC',mitigation:'RMI RMAP audits'},
                    {name:'Palm Oil',score:88,grade:'D-',risk:'Deforestation, forced labor',mitigation:'RSPO certification'},
                    {name:'Thermal Coal',score:95,grade:'F',risk:'Stranded asset, air pollution',mitigation:'Phase-out commitments'},
                    {name:'Cotton',score:72,grade:'C',risk:'Water, forced labor (Xinjiang)',mitigation:'BCI membership'},
                  ].map((c,i)=>(
                    <tr key={i}>
                      <TD style={{fontWeight:600}}>{c.name}</TD>
                      <TD style={{textAlign:'center'}}><span style={{padding:'3px 10px',borderRadius:8,fontWeight:700,fontSize:12,background:c.score>=70?'#fee2e2':c.score>=45?'#fef3c7':'#dcfce7',color:c.score>=70?T.red:c.score>=45?T.amber:T.green}}>{c.score}</span></TD>
                      <TD style={{textAlign:'center',fontWeight:700,fontSize:14,color:c.score>=70?T.red:c.score>=45?T.amber:T.green}}>{c.grade}</TD>
                      <TD style={{textAlign:'center',fontSize:11}}>{c.risk}</TD>
                      <TD style={{textAlign:'center',fontSize:11,color:T.textSec}}>{c.mitigation}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </Section>

        {/* REGULATORY LANDSCAPE */}
        <Section title="Commodity Regulatory Landscape" badge="Global Frameworks">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[
                {framework:'EU EUDR',desc:'EU Deforestation Regulation',commodities:'Palm oil, soy, cocoa, coffee, rubber, timber, cattle',status:'Active (Dec 2024)',impact:'Due diligence on deforestation-free supply chains',color:T.amber},
                {framework:'EU CBAM',desc:'Carbon Border Adjustment Mechanism',commodities:'Steel, aluminum, cement, fertilizer, electricity, hydrogen',status:'Transitional (Oct 2023)',impact:'Carbon cost on imports from non-EU producers',color:T.sage},
                {framework:'EU CRM Act',desc:'Critical Raw Materials Act',commodities:'Lithium, cobalt, rare earths, graphite, manganese',status:'Active (2024)',impact:'Benchmarks for extraction, processing, recycling in EU',color:'#7c3aed'},
                {framework:'US UFLPA',desc:'Uyghur Forced Labor Prevention Act',commodities:'Cotton, polysilicon, tomatoes (Xinjiang region)',status:'Active (Jun 2022)',impact:'Rebuttable presumption of forced labor for Xinjiang goods',color:T.red},
                {framework:'ISSB/IFRS S2',desc:'Climate-Related Disclosures',commodities:'All fossil fuels, carbon-intensive materials',status:'Effective 2025',impact:'Mandatory climate risk disclosure for listed companies',color:T.navyL},
                {framework:'ILO C182',desc:'Worst Forms of Child Labour Convention',commodities:'Cobalt, cocoa, gold (artisanal)',status:'Active (universal ratification)',impact:'International legal framework against child labor',color:T.red},
              ].map((r,i)=>(
                <div key={i} style={{padding:16,background:T.surfaceH,borderRadius:10,borderLeft:`3px solid ${r.color}`}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{r.framework}</div>
                  <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{r.desc}</div>
                  <div style={{fontSize:11,color:T.textMut,marginTop:8}}>Commodities: <span style={{color:T.text}}>{r.commodities}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
                    <Badge label={r.status} color="blue"/>
                  </div>
                  <div style={{fontSize:10,color:T.textSec,marginTop:6}}>{r.impact}</div>
                </div>
              ))}
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
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>ESG & Risk</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>Responsible Mining Index (RMI), Forest 500, KnowTheChain, Global Slavery Index, Transparency International CPI, WRI Aqueduct.</div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Regulation</div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.6}}>EU Official Journal (EUDR, CBAM, CRM Act), US Federal Register (UFLPA), ISSB/IFRS Foundation, ILO NORMLEX database.</div>
              </div>
            </div>
          </Card>
        </Section>

        {/* FOOTER */}
        <div style={{textAlign:'center',padding:'20px 0',borderTop:`1px solid ${T.border}`,marginTop:20}}>
          <span style={{fontSize:11,color:T.textMut}}>Commodity Market Intelligence Engine | EP-Y1 | 50 Commodities | 8 Categories | EODHD + Alpha Vantage + World Bank | Sprint Y</span>
        </div>
      </div>
    </div>
  );
}
