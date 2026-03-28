import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS=['Executive Dashboard','Unified Supplier View','Engagement & Action','Board Report'];
const PERIODS=['Q1 2026','Q2 2026','H1 2026','FY 2025','Trailing 12M'];
const COUNTRIES=['China','India','Vietnam','Brazil','Germany','Mexico','Indonesia','Thailand','Bangladesh','Turkey','USA','Japan','South Korea','Italy','Poland','Malaysia','Philippines','Colombia','Peru','Morocco'];
const REGIONS=['APAC','EMEA','LATAM','North America'];
const TIERS=['Tier 1','Tier 2','Tier 3'];
const CATEGORIES=['Raw Materials','Components','Assembly','Logistics','Packaging','Services','Chemicals','Textiles','Electronics','Agriculture'];
const CERT_TYPES=['ISO 14001','SA8000','FSC','RSPO','RJC','Fair Trade','B Corp','SBTi Committed','CDP Disclosed','GRS Certified'];
const MINERALS=['Tin','Tantalum','Tungsten','Gold','Cobalt','Lithium','Nickel','Copper'];
const COMMODITIES=['Palm Oil','Soy','Beef','Cocoa','Coffee','Rubber','Timber','Paper & Pulp'];
const ENGAGEMENT_STAGES=['Identified','Contacted','Assessing','Action Plan','Implementing','Monitoring','Completed'];
const ENGAGEMENT_DIMS=['Scope 3 Reduction','Deforestation Free','Conflict Mineral Due Diligence','Resilience Building','General ESG Improvement'];
const ALERT_TYPES=['Scope 3 Spike','Deforestation Alert','Conflict Mineral Flag','Resilience Breach','Certification Lapse','DQS Drop','Corrective Action Overdue','Supplier Non-Response','Regulatory Non-Compliance','Concentration Risk','Geographic Risk','Modern Slavery Indicator','Water Stress Trigger','Carbon Intensity Outlier','Audit Failure'];
const SEVERITY=['Critical','High','Medium','Low'];
const BOARD_SECTIONS=['Executive Summary','Scope 3 Emissions Performance','Supplier Engagement Progress','Deforestation & Land Use','Conflict Minerals Compliance','Supply Chain Resilience','Regulatory Compliance Status','Recommendations & Next Steps'];
const AUDIENCES=['Board','Procurement','Risk','Regulator'];
const REGULATIONS=['CSDDD','EUDR','CRMA','UK MSA'];
const SCOPE3_CATS=['Cat 1 Purchased Goods','Cat 2 Capital Goods','Cat 3 Fuel & Energy','Cat 4 Upstream Transport','Cat 5 Waste','Cat 6 Business Travel','Cat 7 Employee Commuting','Cat 8 Upstream Leased'];

const SUPPLIER_NAMES=[
  'Shenzhen MegaTech','Mumbai Steel Works','Hanoi Textiles','Sao Paulo Chemicals','Berlin Precision','Monterrey Auto Parts','Jakarta Timber Co','Bangkok Electronics','Dhaka Garments','Istanbul Metals',
  'Shanghai Semicon','Delhi Packaging','Ho Chi Minh Plastics','Rio Components','Frankfurt Logistik','Guadalajara Assembly','Surabaya Palm Oil','Chiang Mai Rubber','Chittagong Shipping','Ankara Ceramics',
  'Guangzhou Batteries','Pune Pharma','Da Nang Seafood','Belo Horizonte Mining','Munich Optics','Tijuana Cables','Bandung Coffee','Phuket Resins','Sylhet Tea Corp','Izmir Textiles',
  'Beijing AI Chips','Kolkata Jute Mills','Saigon Footwear','Manaus Rubber','Stuttgart Motors','Juarez Electronics','Medan Cocoa','Rayong Petrochemicals','Comilla Knitwear','Bursa Automotive',
  'Tianjin Solar','Ahmedabad Cotton','Haiphong Furniture','Curitiba Agri','Hamburg Chemicals','Leon Manufacturing','Semarang Wood','Nakhon Steel','Narayanganj Denim','Kayseri Machinery',
  'Wuhan Biotech','Surat Diamond','Hue Ceramics','Campinas Sugar','Essen Engineering','Queretaro Aerospace','Makassar Nickel','Udon Thani Rice','Rajshahi Silk','Adana Food Processing',
  'Chengdu Lithium','Nagpur Minerals','Can Tho Rice','Goiania Soy','Dusseldorf Pharma','Puebla Glass','Balikpapan Coal','Chonburi Plastics','Bogra Leather','Gaziantep Steel',
  'Hangzhou Fintech','Indore Polymers','Nha Trang Salt','Porto Alegre Leather','Cologne Fragrances','Saltillo Iron','Pontianak Rubber','Hat Yai Canning','Jessore Shrimp','Konya Aluminium',
  'Dalian Shipping','Jaipur Gems','Quy Nhon Marble','Recife Electronics','Bonn Renewables','Hermosillo Copper','Palembang Tin','Khon Kaen Sugar','Faridpur Ceramics','Denizli Yarn',
  'Xiamen Port Services','Lucknow Dairy','Phan Thiet Sand','Florianopolis Tech','Mannheim Robotics','Chihuahua Silver','Jambi Crude','Hua Hin Tourism','Mymensingh Fisheries','Trabzon Hazelnut',
  'Ningbo Containers','Bhopal Agrochem','Buon Ma Thuot Coffee','Salvador Petrochemicals','Karlsruhe Sensors','Toluca Polymers','Manado Coconut','Pattaya Marine','Tangail Garments','Samsun Tobacco',
  'Foshan Ceramics','Visakhapatnam Port','Long Xuyen Catfish','Natal Wind Energy','Aachen Lasers','Durango Timber','Ambon Clove','Saraburi Cement','Narsingdi Weaving','Eskisehir Tiles',
  'Hefei Displays','Coimbatore Textiles','Rach Gia Seafood','Fortaleza Solar','Leipzig Automotive','Aguascalientes Steel','Sorong LNG','Kanchanaburi Mining','Brahmanbaria Jute','Malatya Copper',
  'Kunming Rare Earth','Kanpur Leather','My Tho Fruit','Brasilia Consulting','Dresden Semiconductors','Morelia Avocado','Jayapura Gold','Lopburi Poultry','Sirajganj Textiles','Mersin Shipping',
  'Zhuhai Drones','Varanasi Silk','Cam Ranh Naval','Uberlandia Grain','Nuremberg Tooling','Celaya Plastics','Ternate Spice','Nonthaburi Pharma','Pabna Cotton','Diyarbakir Marble',
  'Suzhou Nanotech','Trichy Cement','Vung Tau Oil','Ribeirao Steel','Augsburg Mech','San Luis Mining','Kupang Seaweed','Phitsanulok Agri','Rangpur Tobacco','Zonguldak Coal',
  'Qingdao Brewing','Madurai Granite','Tuy Hoa Wind','Joinville Compressors','Freiburg Solar','Torreon Textiles','Samarinda Timber','Lampang Ceramics','Khulna Shipyard','Kastamonu Paper',
  'Nanjing Pharma','Vijayawada Rice','Pleiku Rubber','Londrina Coffee','Heidelberg Print','Mazatlan Fishing','Bontang Fertilizer','Tak Mining','Barisal Salt','Ordu Hazelnuts',
  'Changsha AI','Mysore Software','Da Lat Flowers','Santos Port','Ulm Engineering','Irapuato Agri','Tarakan Shrimp','Roi Et Jasmine','Dinajpur Wheat','Rize Tea',
  'Dongguan PCB','Guwahati Oil','Kon Tum Timber','Vitoria Steel','Regensburg Optics','Colima Banana','Merauke Sugar','Sukhothai Heritage','Kushtia Jute','Bolu Cement'
];

// ── Generate 200 suppliers ────────────────────────────────────────────────────
const SUPPLIERS = Array.from({length:200},(_,i)=>{
  const country=COUNTRIES[Math.floor(sr(i*7)*COUNTRIES.length)];
  const region=country==='USA'?'North America':country==='Germany'||country==='Italy'||country==='Poland'||country==='Turkey'||country==='Morocco'?'EMEA':country==='Brazil'||country==='Colombia'||country==='Peru'||country==='Mexico'?'LATAM':'APAC';
  const tier=TIERS[Math.floor(sr(i*11)*TIERS.length)];
  const cat=CATEGORIES[Math.floor(sr(i*13)*CATEGORIES.length)];
  const esgScore=Math.floor(sr(i*17)*40+40);
  const scope3=+(sr(i*19)*500+10).toFixed(1);
  const dqs=Math.floor(sr(i*23)*60+30);
  const deforestRisk=+(sr(i*29)*100).toFixed(1);
  const mineralExp=+(sr(i*31)*100).toFixed(1);
  const resilience=Math.floor(sr(i*37)*50+40);
  const certs=CERT_TYPES.filter((_,ci)=>sr(i*41+ci*7)>0.6);
  const engaged=sr(i*43)>0.35;
  const highRisk=esgScore<55||deforestRisk>70||mineralExp>75||resilience<50;
  const corrective=Math.floor(sr(i*47)*5);
  const spend=+(sr(i*53)*5+0.1).toFixed(2);
  const commodities=COMMODITIES.filter((_,ci)=>sr(i*59+ci*11)>0.75);
  const minerals=MINERALS.filter((_,mi)=>sr(i*61+mi*13)>0.7);
  const scope3Cat=SCOPE3_CATS[Math.floor(sr(i*67)*SCOPE3_CATS.length)];
  const emissionIntensity=+(sr(i*71)*300+50).toFixed(1);
  const reductionTarget=engaged?Math.floor(sr(i*73)*30+10):0;
  const reductionAchieved=engaged?Math.floor(reductionTarget*sr(i*79)):0;
  const satelMonitored=sr(i*83)>0.4;
  const smelterAudited=sr(i*89)>0.45;
  const disruptionProb=+(sr(i*97)*60+5).toFixed(1);
  const altSuppliers=Math.floor(sr(i*101)*4);
  const leadTimeDays=Math.floor(sr(i*103)*90+14);
  return{
    id:i,name:SUPPLIER_NAMES[i],country,region,tier,category:cat,
    esgScore,scope3MtCO2e:scope3,scope3Cat,dqs,deforestationRisk:deforestRisk,
    mineralExposure:mineralExp,resilienceScore:resilience,
    certifications:certs,certCount:certs.length,engaged,highRisk,
    correctiveActions:corrective,annualSpendM:spend,
    commodities,minerals,
    eudrCompliant:sr(i*107)>0.3,crmaCompliant:sr(i*109)>0.4,
    lastAudit:`2025-${String(Math.floor(sr(i*113)*12)+1).padStart(2,'0')}-${String(Math.floor(sr(i*127)*28)+1).padStart(2,'0')}`,
    carbonIntensity:+(sr(i*131)*200+20).toFixed(1),
    emissionIntensity,reductionTarget,reductionAchieved,
    waterStress:sr(i*137)>0.65,modernSlaveryRisk:sr(i*139)>0.85,
    satelMonitored,smelterAudited,disruptionProb,altSuppliers,leadTimeDays,
  };
});

// ── 12 KPIs ────────────────────────────────────────────────────────────────────
const buildKPIs=(period)=>{
  const pi=PERIODS.indexOf(period);
  const totalScope3=SUPPLIERS.reduce((a,s)=>a+s.scope3MtCO2e,0);
  const engagedCount=SUPPLIERS.filter(s=>s.engaged).length;
  const avgDqs=+(SUPPLIERS.reduce((a,s)=>a+s.dqs,0)/200).toFixed(1);
  const eudrPct=+((SUPPLIERS.filter(s=>s.eudrCompliant).length/200)*100).toFixed(1);
  const avgMineral=+(SUPPLIERS.reduce((a,s)=>a+s.mineralExposure,0)/200).toFixed(1);
  const avgResilience=+(SUPPLIERS.reduce((a,s)=>a+s.resilienceScore,0)/200).toFixed(1);
  const openCorr=SUPPLIERS.reduce((a,s)=>a+s.correctiveActions,0);
  const highRiskCount=SUPPLIERS.filter(s=>s.highRisk).length;
  const certCov=+((SUPPLIERS.filter(s=>s.certCount>0).length/200)*100).toFixed(1);
  const costAtRisk=+(SUPPLIERS.filter(s=>s.highRisk).reduce((a,s)=>a+s.annualSpendM,0)).toFixed(1);
  const defoHa=+(SUPPLIERS.reduce((a,s)=>a+s.deforestationRisk*12,0)).toFixed(0);
  const concIdx=+(sr(pi*111)*0.3+0.45).toFixed(2);
  return[
    {label:'Total Scope 3',value:`${(totalScope3*(1-pi*0.02)).toFixed(0)}`,unit:'MtCO2e',delta:-(pi*1.8+sr(pi*3)*2).toFixed(1),color:T.navy},
    {label:'Suppliers Engaged',value:engagedCount+Math.floor(pi*3),unit:'of 200',delta:+(pi*1.5+sr(pi*5)*1).toFixed(1),color:T.sage},
    {label:'Data Quality Score',value:(avgDqs+pi*0.8).toFixed(1),unit:'/100',delta:+(pi*0.4).toFixed(1),color:T.gold},
    {label:'EUDR Compliance',value:(eudrPct+pi*1.2).toFixed(1),unit:'%',delta:+(pi*1.2).toFixed(1),color:T.green},
    {label:'Conflict Mineral Risk',value:(avgMineral-pi*0.5).toFixed(1),unit:'/100',delta:-(pi*0.5).toFixed(1),color:T.red},
    {label:'Resilience Index',value:(avgResilience+pi*0.6).toFixed(1),unit:'/100',delta:+(pi*0.6).toFixed(1),color:T.teal},
    {label:'Corrective Actions Open',value:openCorr-Math.floor(pi*8),unit:'items',delta:-(pi*1.3).toFixed(1),color:T.amber},
    {label:'High-Risk Suppliers',value:highRiskCount-Math.floor(pi*2),unit:'suppliers',delta:-(pi*0.9).toFixed(1),color:T.red},
    {label:'Certification Coverage',value:(certCov+pi*0.7).toFixed(1),unit:'%',delta:+(pi*0.7).toFixed(1),color:T.sage},
    {label:'Cost-at-Risk',value:`$${(costAtRisk*(1-pi*0.03)).toFixed(1)}`,unit:'M',delta:-(pi*1.1).toFixed(1),color:T.amber},
    {label:'Deforestation Exposure',value:defoHa,unit:'hectares',delta:-(pi*2.5).toFixed(1),color:T.red},
    {label:'Mineral Concentration',value:concIdx,unit:'HHI',delta:-(pi*0.02).toFixed(2),color:T.navy},
  ];
};

// ── Sub-module cards ──────────────────────────────────────────────────────────
const SUB_MODULES=[
  {key:'AP1',title:'Supply Chain Scope 3 Tracker',path:'/supply-chain-esg/scope3',desc:'Category 1-8 upstream Scope 3 tracking with 200 supplier nodes',stat:`${SUPPLIERS.reduce((a,s)=>a+s.scope3MtCO2e,0).toFixed(0)} MtCO2e total`,color:T.navy},
  {key:'AP2',title:'Supplier ESG Engagement',path:'/supply-chain-esg/engagement',desc:'CDP-style supplier questionnaires, scoring & engagement pipeline',stat:`${SUPPLIERS.filter(s=>s.engaged).length} engaged`,color:T.sage},
  {key:'AP3',title:'Deforestation & Land Use',path:'/supply-chain-esg/deforestation',desc:'EUDR compliance, satellite monitoring, commodity traceability',stat:`${SUPPLIERS.filter(s=>s.eudrCompliant).length} EUDR compliant`,color:T.green},
  {key:'AP4',title:'Conflict Minerals Intelligence',path:'/supply-chain-esg/conflict-minerals',desc:'3TG+Cobalt due diligence, smelter mapping, CRMA compliance',stat:`${SUPPLIERS.filter(s=>s.minerals.length>0).length} mineral-exposed`,color:T.amber},
  {key:'AP5',title:'Supply Chain Resilience',path:'/supply-chain-esg/resilience',desc:'Climate risk, geographic concentration, disruption scenario modeling',stat:`Avg resilience ${(SUPPLIERS.reduce((a,s)=>a+s.resilienceScore,0)/200).toFixed(0)}/100`,color:T.teal},
];

// ── Radar data ────────────────────────────────────────────────────────────────
const RADAR_DATA=[
  {dim:'Scope 3 Mgmt',score:72,benchmark:65},
  {dim:'Supplier Engage',score:68,benchmark:60},
  {dim:'Deforestation',score:74,benchmark:58},
  {dim:'Conflict Min.',score:61,benchmark:55},
  {dim:'Resilience',score:66,benchmark:62},
  {dim:'Data Quality',score:70,benchmark:64},
  {dim:'Certification',score:63,benchmark:59},
  {dim:'Regulatory',score:77,benchmark:70},
];

// ── Top risks & improvements ──────────────────────────────────────────────────
const TOP_RISKS=[
  {item:'Palm oil supply chain deforestation exposure in SE Asia',score:92,module:'Deforestation'},
  {item:'Cobalt concentration risk — 68% from 3 suppliers',score:88,module:'Conflict Minerals'},
  {item:'Tier 2 supplier data quality gap (avg DQS 38)',score:85,module:'Scope 3'},
  {item:'CSDDD due diligence coverage only 41% of value chain',score:82,module:'Engagement'},
  {item:'Single-source dependency for rare earth components',score:79,module:'Resilience'},
];
const TOP_IMPROVEMENTS=[
  {item:'EUDR compliance improved 12pp QoQ across palm oil chain',score:'+12%',module:'Deforestation'},
  {item:'Scope 3 Cat 1 emissions reduced 8.2% via supplier programs',score:'-8.2%',module:'Scope 3'},
  {item:'22 new suppliers achieved ISO 14001 certification',score:'+22',module:'Engagement'},
  {item:'Conflict mineral smelter audit coverage up to 94%',score:'94%',module:'Conflict Minerals'},
  {item:'Geographic diversification index improved 0.08 HHI',score:'-0.08',module:'Resilience'},
];

// ── 25 Alerts ─────────────────────────────────────────────────────────────────
const INIT_ALERTS=Array.from({length:25},(_,i)=>{
  const sup=SUPPLIERS[Math.floor(sr(i*123)*200)];
  const typ=ALERT_TYPES[Math.floor(sr(i*456)*ALERT_TYPES.length)];
  const sev=SEVERITY[Math.floor(sr(i*789)*4)];
  return{id:i,type:typ,severity:sev,supplier:sup.name,country:sup.country,description:`${typ}: ${sup.name} (${sup.country}) — ${sev.toLowerCase()} priority. ${sr(i*321)>0.5?'Immediate action required.':'Review within 7 days.'}`,timestamp:`2026-03-${String(Math.floor(sr(i*654)*28)+1).padStart(2,'0')} ${String(Math.floor(sr(i*987)*12)+8).padStart(2,'0')}:${String(Math.floor(sr(i*111)*60)).padStart(2,'0')}`,dismissed:false};
});

// ── 60 Engagements ────────────────────────────────────────────────────────────
const ENGAGEMENTS=Array.from({length:60},(_,i)=>{
  const sup=SUPPLIERS[Math.floor(sr(i*201)*200)];
  const dim=ENGAGEMENT_DIMS[Math.floor(sr(i*301)*ENGAGEMENT_DIMS.length)];
  const stage=ENGAGEMENT_STAGES[Math.floor(sr(i*401)*ENGAGEMENT_STAGES.length)];
  const priority=Math.floor(sr(i*501)*100);
  const actions=Math.floor(sr(i*901)*8)+1;
  const actionsComplete=Math.floor(sr(i*1001)*actions);
  return{id:i,supplier:sup.name,supplierId:sup.id,country:sup.country,tier:sup.tier,dimension:dim,stage,stageIdx:ENGAGEMENT_STAGES.indexOf(stage),priority,startDate:`2025-${String(Math.floor(sr(i*601)*12)+1).padStart(2,'0')}-01`,targetDate:`2026-${String(Math.floor(sr(i*701)*12)+1).padStart(2,'0')}-01`,owner:['Procurement','Sustainability','Risk','Compliance'][Math.floor(sr(i*801)*4)],actions,actionsComplete,effectiveness:Math.floor(sr(i*1101)*40+50),cost:+(sr(i*1201)*50+5).toFixed(1),notes:`${dim} engagement with ${sup.name}. Current stage: ${stage}. ${actionsComplete}/${actions} actions complete.`};
});

// ── Engagement effectiveness trend ────────────────────────────────────────────
const ENG_TREND=Array.from({length:12},(_,i)=>({
  month:['Apr 25','May 25','Jun 25','Jul 25','Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26'][i],
  effectiveness:Math.floor(55+sr(i*17)*15+i*1.2),
  engagements:Math.floor(30+sr(i*19)*20+i*2),
  completionRate:Math.floor(40+sr(i*23)*10+i*2.5),
}));

// ── Commodity traceability matrix ──────────────────────────────────────────────
const COMMODITY_TRACE=COMMODITIES.map((com,ci)=>{
  const exposed=SUPPLIERS.filter(s=>s.commodities.includes(com));
  const eudrComp=exposed.filter(s=>s.eudrCompliant).length;
  const satMon=exposed.filter(s=>s.satelMonitored).length;
  return{commodity:com,suppliers:exposed.length,eudrCompliant:eudrComp,eudrPct:exposed.length>0?+((eudrComp/exposed.length)*100).toFixed(0):0,satelliteMonitored:satMon,avgDeforest:exposed.length>0?+(exposed.reduce((a,s)=>a+s.deforestationRisk,0)/exposed.length).toFixed(1):0,highRisk:exposed.filter(s=>s.deforestationRisk>70).length};
});

// ── Mineral supply chain data ─────────────────────────────────────────────────
const MINERAL_CHAIN=MINERALS.map((min,mi)=>{
  const exposed=SUPPLIERS.filter(s=>s.minerals.includes(min));
  const audited=exposed.filter(s=>s.smelterAudited).length;
  const crmaComp=exposed.filter(s=>s.crmaCompliant).length;
  const topCountry=exposed.length>0?exposed.reduce((acc,s)=>{acc[s.country]=(acc[s.country]||0)+1;return acc;},{}):{};
  const topC=Object.entries(topCountry).sort((a,b)=>b[1]-a[1])[0];
  return{mineral:min,suppliers:exposed.length,audited,auditPct:exposed.length>0?+((audited/exposed.length)*100).toFixed(0):0,crmaCompliant:crmaComp,avgExposure:exposed.length>0?+(exposed.reduce((a,s)=>a+s.mineralExposure,0)/exposed.length).toFixed(1):0,topSource:topC?topC[0]:'N/A',concentration:exposed.length>0?+(1/exposed.length*100).toFixed(0):0};
});

// ── Disruption scenarios ──────────────────────────────────────────────────────
const DISRUPTION_SCENARIOS=[
  {scenario:'SE Asia Typhoon Season',probability:72,impact:'$84M supply disruption',affectedSuppliers:48,mitigationStatus:'Partial',regions:['APAC']},
  {scenario:'China-Taiwan Strait Escalation',probability:18,impact:'$210M semiconductor supply',affectedSuppliers:35,mitigationStatus:'Planning',regions:['APAC']},
  {scenario:'EU Carbon Border Adjustment',probability:95,impact:'$12M additional costs',affectedSuppliers:120,mitigationStatus:'Active',regions:['EMEA']},
  {scenario:'Brazilian Amazon Dry Season',probability:65,impact:'$28M commodity disruption',affectedSuppliers:22,mitigationStatus:'Monitoring',regions:['LATAM']},
  {scenario:'Turkish Earthquake Zone Risk',probability:35,impact:'$15M manufacturing',affectedSuppliers:18,mitigationStatus:'Partial',regions:['EMEA']},
  {scenario:'Bangladesh Flooding & Monsoon',probability:80,impact:'$22M textile supply',affectedSuppliers:15,mitigationStatus:'Active',regions:['APAC']},
];

// ── Tier 2 visibility gap analysis ────────────────────────────────────────────
const TIER_VISIBILITY=[
  {tier:'Tier 1',total:SUPPLIERS.filter(s=>s.tier==='Tier 1').length,dataComplete:Math.floor(SUPPLIERS.filter(s=>s.tier==='Tier 1').length*0.94),avgDqs:Math.floor(SUPPLIERS.filter(s=>s.tier==='Tier 1').reduce((a,s)=>a+s.dqs,0)/Math.max(1,SUPPLIERS.filter(s=>s.tier==='Tier 1').length))},
  {tier:'Tier 2',total:SUPPLIERS.filter(s=>s.tier==='Tier 2').length,dataComplete:Math.floor(SUPPLIERS.filter(s=>s.tier==='Tier 2').length*0.67),avgDqs:Math.floor(SUPPLIERS.filter(s=>s.tier==='Tier 2').reduce((a,s)=>a+s.dqs,0)/Math.max(1,SUPPLIERS.filter(s=>s.tier==='Tier 2').length))},
  {tier:'Tier 3',total:SUPPLIERS.filter(s=>s.tier==='Tier 3').length,dataComplete:Math.floor(SUPPLIERS.filter(s=>s.tier==='Tier 3').length*0.38),avgDqs:Math.floor(SUPPLIERS.filter(s=>s.tier==='Tier 3').reduce((a,s)=>a+s.dqs,0)/Math.max(1,SUPPLIERS.filter(s=>s.tier==='Tier 3').length))},
];

// ── Scope 3 category breakdown ────────────────────────────────────────────────
const SCOPE3_BREAKDOWN=SCOPE3_CATS.map((cat,ci)=>{
  const sups=SUPPLIERS.filter(s=>s.scope3Cat===cat);
  return{category:cat.replace('Cat ','').split(' ').slice(1).join(' '),emissions:+sups.reduce((a,s)=>a+s.scope3MtCO2e,0).toFixed(0),suppliers:sups.length,avgIntensity:sups.length>0?+(sups.reduce((a,s)=>a+s.emissionIntensity,0)/sups.length).toFixed(0):0};
});

// ── Board report data ─────────────────────────────────────────────────────────
const REPORT_CONTENT={
  'Executive Summary':{text:'Supply chain ESG performance shows material improvement across all five dimensions. Scope 3 emissions reduced 6.4% YoY with 128 suppliers now actively engaged. EUDR compliance on track at 71% with full coverage expected by Q4 2026. Key risks remain in cobalt concentration and Tier 2 data quality. Overall maturity score advanced from 61 to 68, placing the organization in the top quartile of peer group.',maturity:68},
  'Scope 3 Emissions Performance':{text:'Total upstream Scope 3 (Cat 1-8) stands at 51,240 MtCO2e, down from 54,750 MtCO2e in the prior year. Category 1 (Purchased Goods) represents 62% of total. 45 supplier-specific reduction targets set under SBTi FLAG guidance. Data quality improved to avg DQS 62 from 54. Tier 1 coverage at 94%, Tier 2 at 67%. 18 suppliers have verified science-based targets.',maturity:64},
  'Supplier Engagement Progress':{text:'128 of 200 tracked suppliers are actively engaged across ESG dimensions. CDP Supply Chain program response rate at 72%. Average supplier ESG score improved 4.2 points to 63.8. 22 new ISO 14001 certifications achieved. Engagement pipeline healthy with 60 active programs across Scope 3, deforestation, minerals, and resilience dimensions.',maturity:71},
  'Deforestation & Land Use':{text:'EUDR compliance at 71% across palm oil, soy, cocoa, coffee, rubber, and timber commodities. Satellite monitoring covers 89% of high-risk sourcing regions. 12 suppliers transitioned to certified deforestation-free supply. Remaining gaps concentrated in Tier 2 soy suppliers in LATAM. Geolocation data collected for 78% of direct commodity sourcing.',maturity:66},
  'Conflict Minerals Compliance':{text:'3TG+Cobalt due diligence covers 94% of identified smelters. CRMA compliance at 78% with gap remediation on track for Q3 2026. Cobalt concentration risk elevated — 3 suppliers account for 68% of supply. Lithium traceability program launched for 15 battery-chain suppliers. Independent third-party audits completed for 82 smelters.',maturity:62},
  'Supply Chain Resilience':{text:'Average resilience score 65/100, up from 61. Climate physical risk mapping completed for all Tier 1 suppliers. 8 single-source dependencies identified and mitigation plans in progress. Geographic concentration improved with HHI dropping from 0.52 to 0.47. Business continuity plans verified for top 50 suppliers by spend.',maturity:65},
  'Regulatory Compliance Status':{text:'CSDDD: Due diligence framework covers 41% of value chain (target 80% by 2027). EUDR: 71% compliant with phased implementation. CRMA: 78% smelter coverage with independent audits. UK MSA: Statement published, enhanced due diligence for 35 high-risk suppliers. Gap analysis completed for all four regulatory frameworks.',maturity:59},
  'Recommendations & Next Steps':{text:'1) Accelerate Tier 2 data collection — target DQS 70+ by Q4. 2) Diversify cobalt sourcing — add 2 new suppliers by Q3. 3) Expand EUDR satellite monitoring to 100% of sourcing areas. 4) Launch CSDDD value chain mapping phase 2. 5) Implement real-time resilience monitoring for top 50 suppliers. 6) Establish quarterly supplier ESG review cadence.',maturity:72},
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text},
  header:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20},
  h1:{fontSize:26,fontWeight:700,color:T.navy,margin:0},
  subtitle:{fontSize:13,color:T.textSec,marginTop:4},
  badge:{display:'inline-block',fontSize:10,fontWeight:600,fontFamily:T.mono,padding:'2px 8px',borderRadius:4,marginLeft:8},
  tabs:{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:20},
  tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?T.navy:T.textSec,borderBottom:a?`3px solid ${T.gold}`:'3px solid transparent',cursor:'pointer',background:'none',border:'none',fontFamily:T.font,marginBottom:-2}),
  card:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:18,marginBottom:16},
  kpiGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:20},
  kpiCard:(c)=>({background:T.surface,borderRadius:8,border:`1px solid ${T.border}`,borderLeft:`4px solid ${c}`,padding:'14px 16px'}),
  kpiLabel:{fontSize:11,color:T.textSec,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5},
  kpiVal:{fontSize:22,fontWeight:700,color:T.navy,marginTop:4},
  kpiUnit:{fontSize:11,color:T.textMut,marginLeft:4},
  kpiDelta:(v)=>({fontSize:11,fontWeight:600,color:v<0?T.green:v>0?T.red:T.textMut,marginTop:4}),
  row:{display:'flex',gap:16,marginBottom:16},
  col:(f)=>({flex:f||1,minWidth:0}),
  sectionTitle:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12},
  subTitle:{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,fontWeight:600,color:T.textSec,fontSize:11,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5,position:'sticky',top:0,background:T.surface,whiteSpace:'nowrap'},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:180},
  pill:(bg,fg)=>({display:'inline-block',fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:10,background:bg,color:fg}),
  select:{fontSize:12,padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontFamily:T.font},
  input:{fontSize:12,padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontFamily:T.font,width:180},
  btn:(primary)=>({fontSize:12,fontWeight:600,padding:'7px 16px',borderRadius:6,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,cursor:'pointer',fontFamily:T.font}),
  alertCard:(sev)=>({background:sev==='Critical'?'#fef2f2':sev==='High'?'#fffbeb':T.surface,borderRadius:8,border:`1px solid ${sev==='Critical'?'#fecaca':sev==='High'?'#fde68a':T.border}`,padding:'10px 14px',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}),
  sevBadge:(sev)=>{const m={Critical:{bg:'#dc2626',fg:'#fff'},High:{bg:'#d97706',fg:'#fff'},Medium:{bg:'#2563eb',fg:'#fff'},Low:{bg:T.textMut,fg:'#fff'}};const c=m[sev]||m.Low;return{display:'inline-block',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:4,background:c.bg,color:c.fg}},
  toggle:(a)=>({display:'inline-block',fontSize:11,fontWeight:a?700:500,padding:'5px 12px',borderRadius:16,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,cursor:'pointer',border:`1px solid ${a?T.navy:T.border}`,marginRight:6,fontFamily:T.font}),
  panel:{background:T.surfaceH,borderRadius:10,border:`1px solid ${T.borderL}`,padding:18,marginTop:12},
  maturityBar:()=>({height:8,borderRadius:4,background:T.border,position:'relative',overflow:'hidden'}),
  maturityFill:(v)=>({height:'100%',borderRadius:4,width:`${v}%`,background:v>=70?T.green:v>=50?T.amber:T.red}),
  checkbox:{width:14,height:14,accentColor:T.navy,cursor:'pointer'},
  scrollBox:{maxHeight:400,overflowY:'auto'},
  printArea:{fontFamily:T.font,color:T.text,lineHeight:1.6},
};

const PIE_COLORS=[T.navy,T.sage,T.gold,T.red,T.amber,T.teal,T.navyL,T.goldL,T.sageL,'#8b5cf6'];

// ── Component ─────────────────────────────────────────────────────────────────
export default function SupplyChainEsgHubPage(){
  const [tab,setTab]=useState(0);
  const [period,setPeriod]=useState('Q1 2026');
  const [alerts,setAlerts]=useState(INIT_ALERTS);
  const [selSupplier,setSelSupplier]=useState(null);
  const [filterTier,setFilterTier]=useState('All');
  const [filterRegion,setFilterRegion]=useState('All');
  const [filterRisk,setFilterRisk]=useState('All');
  const [filterCat,setFilterCat]=useState('All');
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('esgScore');
  const [sortDir,setSortDir]=useState('desc');
  const [engFilter,setEngFilter]=useState('All');
  const [engDim,setEngDim]=useState('All');
  const [engOwner,setEngOwner]=useState('All');
  const [boardAudience,setBoardAudience]=useState('Board');
  const [boardDateFrom,setBoardDateFrom]=useState('2025-10-01');
  const [boardDateTo,setBoardDateTo]=useState('2026-03-28');
  const [boardSections,setBoardSections]=useState(BOARD_SECTIONS.reduce((a,sec)=>({...a,[sec]:true}),{}));
  const [alertFilter,setAlertFilter]=useState('All');
  const [showScope3Detail,setShowScope3Detail]=useState(false);

  const kpis=useMemo(()=>buildKPIs(period),[period]);
  const dismissAlert=useCallback((id)=>{setAlerts(a=>a.map(al=>al.id===id?{...al,dismissed:true}:al));},[]);

  const filteredSuppliers=useMemo(()=>{
    let list=[...SUPPLIERS];
    if(filterTier!=='All') list=list.filter(s=>s.tier===filterTier);
    if(filterRegion!=='All') list=list.filter(s=>s.region===filterRegion);
    if(filterRisk==='High') list=list.filter(s=>s.highRisk);
    if(filterRisk==='Low') list=list.filter(s=>!s.highRisk);
    if(filterCat!=='All') list=list.filter(s=>s.category===filterCat);
    if(search) list=list.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.country.toLowerCase().includes(search.toLowerCase()));
    list.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];if(typeof av==='number') return sortDir==='asc'?av-bv:bv-av;return sortDir==='asc'?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));});
    return list;
  },[filterTier,filterRegion,filterRisk,filterCat,search,sortCol,sortDir]);

  const filteredEngagements=useMemo(()=>{
    let list=[...ENGAGEMENTS];
    if(engFilter!=='All') list=list.filter(e=>e.stage===engFilter);
    if(engDim!=='All') list=list.filter(e=>e.dimension===engDim);
    if(engOwner!=='All') list=list.filter(e=>e.owner===engOwner);
    return list.sort((a,b)=>b.priority-a.priority);
  },[engFilter,engDim,engOwner]);

  const visibleAlerts=useMemo(()=>{
    let list=alerts.filter(a=>!a.dismissed);
    if(alertFilter!=='All') list=list.filter(a=>a.severity===alertFilter);
    return list;
  },[alerts,alertFilter]);

  const regionDist=useMemo(()=>REGIONS.map(r=>({name:r,count:SUPPLIERS.filter(s=>s.region===r).length,scope3:+SUPPLIERS.filter(s=>s.region===r).reduce((a,s)=>a+s.scope3MtCO2e,0).toFixed(0)})),[]);
  const tierDist=useMemo(()=>TIERS.map(t=>({name:t,count:SUPPLIERS.filter(s=>s.tier===t).length,avgEsg:+(SUPPLIERS.filter(s=>s.tier===t).reduce((a,s)=>a+s.esgScore,0)/Math.max(1,SUPPLIERS.filter(s=>s.tier===t).length)).toFixed(1)})),[]);
  const catDist=useMemo(()=>CATEGORIES.map(c=>({name:c,count:SUPPLIERS.filter(s=>s.category===c).length})).sort((a,b)=>b.count-a.count),[]);
  const stagePipeline=useMemo(()=>ENGAGEMENT_STAGES.map(st=>({stage:st,count:ENGAGEMENTS.filter(e=>e.stage===st).length})),[]);
  const dimBreakdown=useMemo(()=>ENGAGEMENT_DIMS.map(d=>({name:d,count:ENGAGEMENTS.filter(e=>e.dimension===d).length})),[]);
  const concRisk=useMemo(()=>{
    const byCountry={};SUPPLIERS.forEach(s=>{byCountry[s.country]=(byCountry[s.country]||0)+s.annualSpendM;});
    return Object.entries(byCountry).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,spend])=>({name,spend:+spend.toFixed(1)}));
  },[]);
  const regCompliance=useMemo(()=>REGULATIONS.map(r=>{
    const field=r==='CSDDD'?'engaged':r==='EUDR'?'eudrCompliant':r==='CRMA'?'crmaCompliant':'engaged';
    const pct=+((SUPPLIERS.filter(s=>s[field]).length/200)*100).toFixed(1);
    return{reg:r,compliance:pct,target:r==='CSDDD'?80:r==='EUDR'?100:r==='CRMA'?95:100};
  }),[]);
  const resourceAlloc=useMemo(()=>[
    {area:'Scope 3 Programs',current:35,recommended:30},{area:'Supplier Engagement',current:25,recommended:28},
    {area:'Deforestation Monitoring',current:15,recommended:18},{area:'Conflict Mineral Audits',current:12,recommended:14},
    {area:'Resilience Building',current:13,recommended:10},
  ],[]);
  const supplierEngagements=useMemo(()=>selSupplier?ENGAGEMENTS.filter(e=>e.supplierId===selSupplier.id):[], [selSupplier]);

  const handleSort=(col)=>{if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  // ── Tab 1: Executive Dashboard ──────────────────────────────────────────────
  const renderDashboard=()=>(
    <>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <span style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>PERIOD</span>
        {PERIODS.map(p=><button key={p} style={s.toggle(period===p)} onClick={()=>setPeriod(p)}>{p}</button>)}
      </div>

      <div style={s.kpiGrid}>
        {kpis.map((k,i)=>(
          <div key={i} style={s.kpiCard(k.color)}>
            <div style={s.kpiLabel}>{k.label}</div>
            <div style={s.kpiVal}>{k.value}<span style={s.kpiUnit}>{k.unit}</span></div>
            <div style={s.kpiDelta(k.delta)}>{k.delta>0?'+':''}{k.delta}% vs prior</div>
          </div>
        ))}
      </div>

      <div style={s.sectionTitle}>Sub-Module Overview</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12,marginBottom:20}}>
        {SUB_MODULES.map(m=>(
          <div key={m.key} style={{...s.card,borderLeft:`4px solid ${m.color}`,cursor:'pointer'}} title={`Navigate to ${m.path}`}>
            <div style={{fontSize:10,fontFamily:T.mono,color:m.color,marginBottom:4}}>{m.key}</div>
            <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{m.title}</div>
            <div style={{fontSize:11,color:T.textSec,margin:'6px 0'}}>{m.desc}</div>
            <div style={{fontSize:13,fontWeight:700,color:m.color}}>{m.stat}</div>
          </div>
        ))}
      </div>

      {/* Scope 3 emissions trend */}
      <div style={s.card}>
        <div style={s.subTitle}>Scope 3 Emissions Trend (Quarterly)</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={Array.from({length:8},(_,i)=>({quarter:['Q2 24','Q3 24','Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'][i],total:Math.floor(56000-i*620+sr(i*23)*800),cat1:Math.floor(34000-i*380+sr(i*29)*500),cat4:Math.floor(8200-i*95+sr(i*31)*200),other:Math.floor(13800-i*145+sr(i*37)*300),target:Math.floor(54000-i*750)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}} formatter={v=>`${v.toLocaleString()} MtCO2e`}/>
            <Area type="monotone" dataKey="cat1" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.4} name="Cat 1 Purchased"/>
            <Area type="monotone" dataKey="cat4" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.4} name="Cat 4 Transport"/>
            <Area type="monotone" dataKey="other" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.3} name="Other Categories"/>
            <Line type="monotone" dataKey="target" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Reduction Target"/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Scope 3 category breakdown */}
      <div style={s.row}>
        <div style={{...s.card,...s.col(1)}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={s.subTitle}>Scope 3 by Category</div>
            <button style={s.btn(false)} onClick={()=>setShowScope3Detail(!showScope3Detail)}>{showScope3Detail?'Hide':'Detail'}</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SCOPE3_BREAKDOWN}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="category" tick={{fontSize:9,fill:T.textSec}} angle={-15} textAnchor="end" height={50}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
              <Bar dataKey="emissions" fill={T.navy} radius={[4,4,0,0]} name="MtCO2e"/>
            </BarChart>
          </ResponsiveContainer>
          {showScope3Detail&&(
            <table style={{...s.table,marginTop:8}}>
              <thead><tr><th style={s.th}>Category</th><th style={s.th}>Emissions</th><th style={s.th}>Suppliers</th><th style={s.th}>Avg Intensity</th></tr></thead>
              <tbody>{SCOPE3_BREAKDOWN.map((c,i)=>(
                <tr key={i}><td style={s.td}>{c.category}</td><td style={{...s.td,fontWeight:600}}>{c.emissions} MtCO2e</td><td style={s.td}>{c.suppliers}</td><td style={s.td}>{c.avgIntensity}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div style={{...s.card,...s.col(1)}}>
          <div style={s.subTitle}>Supply Chain Risk Radar</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
              <Radar name="Current" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.3}/>
              <Radar name="Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/>
              <Legend wrapperStyle={{fontSize:11}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risks + improvements */}
      <div style={s.row}>
        <div style={{...s.card,...s.col(1)}}>
          <div style={s.subTitle}>Top 5 Risks</div>
          {TOP_RISKS.map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:i<4?`1px solid ${T.border}`:'none'}}>
              <div style={{fontSize:12,color:T.text,flex:1}}>{r.item}</div>
              <span style={s.pill('#fef2f2',T.red)}>{r.score}</span>
              <span style={{fontSize:10,color:T.textMut,marginLeft:8,width:90,textAlign:'right'}}>{r.module}</span>
            </div>
          ))}
        </div>
        <div style={{...s.card,...s.col(1)}}>
          <div style={s.subTitle}>Top 5 Improvements</div>
          {TOP_IMPROVEMENTS.map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:i<4?`1px solid ${T.border}`:'none'}}>
              <div style={{fontSize:12,color:T.text,flex:1}}>{r.item}</div>
              <span style={s.pill('#f0fdf4',T.green)}>{r.score}</span>
              <span style={{fontSize:10,color:T.textMut,marginLeft:8,width:90,textAlign:'right'}}>{r.module}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commodity traceability + mineral chain */}
      <div style={s.row}>
        <div style={{...s.card,...s.col(1)}}>
          <div style={s.subTitle}>Commodity Traceability (EUDR)</div>
          <div style={{maxHeight:220,overflowY:'auto'}}>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Commodity</th><th style={s.th}>Suppliers</th><th style={s.th}>EUDR %</th><th style={s.th}>Satellite</th><th style={s.th}>Avg Risk</th><th style={s.th}>High Risk</th></tr></thead>
              <tbody>{COMMODITY_TRACE.map((c,i)=>(
                <tr key={i}><td style={{...s.td,fontWeight:600}}>{c.commodity}</td><td style={s.td}>{c.suppliers}</td><td style={{...s.td,fontWeight:600,color:c.eudrPct>=80?T.green:c.eudrPct>=50?T.amber:T.red}}>{c.eudrPct}%</td><td style={s.td}>{c.satelliteMonitored}</td><td style={{...s.td,color:c.avgDeforest>60?T.red:c.avgDeforest>30?T.amber:T.green}}>{c.avgDeforest}</td><td style={{...s.td,color:c.highRisk>0?T.red:T.green}}>{c.highRisk}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={{...s.card,...s.col(1)}}>
          <div style={s.subTitle}>Mineral Supply Chain (CRMA)</div>
          <div style={{maxHeight:220,overflowY:'auto'}}>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Mineral</th><th style={s.th}>Suppliers</th><th style={s.th}>Audit %</th><th style={s.th}>CRMA</th><th style={s.th}>Top Source</th><th style={s.th}>Conc.</th></tr></thead>
              <tbody>{MINERAL_CHAIN.map((m,i)=>(
                <tr key={i}><td style={{...s.td,fontWeight:600}}>{m.mineral}</td><td style={s.td}>{m.suppliers}</td><td style={{...s.td,fontWeight:600,color:m.auditPct>=80?T.green:m.auditPct>=50?T.amber:T.red}}>{m.auditPct}%</td><td style={s.td}>{m.crmaCompliant}</td><td style={s.td}>{m.topSource}</td><td style={{...s.td,color:m.concentration>25?T.red:T.green}}>{m.concentration}%</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Disruption scenarios */}
      <div style={s.card}>
        <div style={s.subTitle}>Disruption Scenarios & Resilience</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {DISRUPTION_SCENARIOS.map((ds,i)=>(
            <div key={i} style={{padding:12,borderRadius:8,border:`1px solid ${ds.probability>60?'#fecaca':ds.probability>30?'#fde68a':T.border}`,background:ds.probability>60?'#fef2f2':ds.probability>30?'#fffbeb':T.surface}}>
              <div style={{fontSize:12,fontWeight:700,color:T.navy}}>{ds.scenario}</div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                <div><span style={{fontSize:10,color:T.textMut}}>Probability</span><div style={{fontSize:14,fontWeight:700,color:ds.probability>60?T.red:ds.probability>30?T.amber:T.green}}>{ds.probability}%</div></div>
                <div><span style={{fontSize:10,color:T.textMut}}>Impact</span><div style={{fontSize:11,fontWeight:600,color:T.navy}}>{ds.impact}</div></div>
              </div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>Affected: {ds.affectedSuppliers} suppliers | Regions: {ds.regions.join(', ')}</div>
              <div style={{marginTop:4}}><span style={s.pill(ds.mitigationStatus==='Active'?'#f0fdf4':ds.mitigationStatus==='Partial'?'#fffbeb':'#f0f9ff',ds.mitigationStatus==='Active'?T.green:ds.mitigationStatus==='Partial'?T.amber:T.navyL)}>{ds.mitigationStatus}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier visibility gap */}
      <div style={s.card}>
        <div style={s.subTitle}>Data Visibility by Tier</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          {TIER_VISIBILITY.map((tv,i)=>(
            <div key={i} style={{textAlign:'center',padding:12,borderRadius:8,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{tv.tier}</div>
              <div style={{fontSize:11,color:T.textSec}}>{tv.total} suppliers</div>
              <div style={{marginTop:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Data Complete</div>
                <div style={{width:'100%',height:8,borderRadius:4,background:T.border,marginTop:4,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:4,width:`${(tv.dataComplete/tv.total)*100}%`,background:tv.dataComplete/tv.total>0.8?T.green:tv.dataComplete/tv.total>0.5?T.amber:T.red}}/>
                </div>
                <div style={{fontSize:11,fontWeight:600,marginTop:2}}>{tv.dataComplete}/{tv.total} ({((tv.dataComplete/tv.total)*100).toFixed(0)}%)</div>
              </div>
              <div style={{marginTop:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Avg DQS</div>
                <div style={{fontSize:16,fontWeight:700,color:tv.avgDqs>=60?T.green:tv.avgDqs>=45?T.amber:T.red}}>{tv.avgDqs}/100</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Region + tier charts */}
      <div style={s.row}>
        <div style={{...s.card,...s.col(1)}}>
          <div style={s.subTitle}>Scope 3 by Region</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={regionDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:11,fill:T.text}} width={90}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
              <Bar dataKey="scope3" fill={T.navy} radius={[0,4,4,0]} name="Scope 3 MtCO2e"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...s.card,...s.col(1)}}>
          <div style={s.subTitle}>Supplier Distribution by Tier</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tierDist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:T.text}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
              <Bar dataKey="count" fill={T.sage} radius={[4,4,0,0]} name="Suppliers"/>
              <Bar dataKey="avgEsg" fill={T.gold} radius={[4,4,0,0]} name="Avg ESG"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div style={{...s.card,marginBottom:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={s.subTitle}>Alerts ({visibleAlerts.length})</div>
          <div style={{display:'flex',gap:6}}>
            {['All',...SEVERITY].map(sv=><button key={sv} style={s.toggle(alertFilter===sv)} onClick={()=>setAlertFilter(sv)}>{sv}</button>)}
          </div>
        </div>
        <div style={s.scrollBox}>
          {visibleAlerts.map(al=>(
            <div key={al.id} style={s.alertCard(al.severity)}>
              <div style={{flex:1}}>
                <span style={s.sevBadge(al.severity)}>{al.severity}</span>
                <span style={{fontSize:11,fontWeight:600,color:T.navy,marginLeft:8}}>{al.type}</span>
                <span style={{fontSize:11,color:T.textSec,marginLeft:8}}>{al.supplier} ({al.country})</span>
                <div style={{fontSize:11,color:T.textMut,marginTop:4}}>{al.description}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{al.timestamp}</span>
                <button style={s.btn(false)} onClick={()=>dismissAlert(al.id)}>Dismiss</button>
              </div>
            </div>
          ))}
          {visibleAlerts.length===0&&<div style={{textAlign:'center',padding:20,color:T.textMut,fontSize:13}}>No active alerts</div>}
        </div>
      </div>
    </>
  );

  // ── Tab 2: Unified Supplier View ────────────────────────────────────────────
  const renderSuppliers=()=>(
    <>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input style={s.input} placeholder="Search supplier or country..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={s.select} value={filterTier} onChange={e=>setFilterTier(e.target.value)}>
          <option value="All">All Tiers</option>{TIERS.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select style={s.select} value={filterRegion} onChange={e=>setFilterRegion(e.target.value)}>
          <option value="All">All Regions</option>{REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select style={s.select} value={filterRisk} onChange={e=>setFilterRisk(e.target.value)}>
          <option value="All">All Risk</option><option value="High">High Risk</option><option value="Low">Low Risk</option>
        </select>
        <select style={s.select} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option value="All">All Categories</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filteredSuppliers.length} suppliers</span>
      </div>

      <div style={s.row}>
        <div style={{...s.card,...s.col(1)}}>
          <div style={s.subTitle}>Spend Concentration by Country (Top 10)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={concRisk} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} unit="M"/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.text}} width={80}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}} formatter={v=>`$${v}M`}/>
              <Bar dataKey="spend" fill={T.gold} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...s.card,...s.col(1)}}>
          <div style={s.subTitle}>Supplier Category Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={catDist} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {catDist.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional ESG heatmap summary */}
      <div style={s.card}>
        <div style={s.subTitle}>Regional ESG Summary</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {REGIONS.map(r=>{
            const rs=SUPPLIERS.filter(s=>s.region===r);
            const avgE=rs.length?+(rs.reduce((a,s)=>a+s.esgScore,0)/rs.length).toFixed(1):0;
            const avgR=rs.length?+(rs.reduce((a,s)=>a+s.resilienceScore,0)/rs.length).toFixed(1):0;
            const hrPct=rs.length?+((rs.filter(s=>s.highRisk).length/rs.length)*100).toFixed(0):0;
            return(
              <div key={r} style={{padding:12,borderRadius:8,border:`1px solid ${T.border}`,textAlign:'center'}}>
                <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{r}</div>
                <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{rs.length} suppliers</div>
                <div style={{display:'flex',justifyContent:'space-around',marginTop:8}}>
                  <div><div style={{fontSize:10,color:T.textMut}}>ESG Avg</div><div style={{fontSize:14,fontWeight:700,color:avgE>=65?T.green:avgE>=50?T.amber:T.red}}>{avgE}</div></div>
                  <div><div style={{fontSize:10,color:T.textMut}}>Resilience</div><div style={{fontSize:14,fontWeight:700,color:avgR>=65?T.green:avgR>=50?T.amber:T.red}}>{avgR}</div></div>
                  <div><div style={{fontSize:10,color:T.textMut}}>High Risk</div><div style={{fontSize:14,fontWeight:700,color:hrPct>30?T.red:hrPct>15?T.amber:T.green}}>{hrPct}%</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{...s.card,padding:0,overflow:'hidden'}}>
        <div style={{maxHeight:480,overflowY:'auto'}}>
          <table style={s.table}>
            <thead>
              <tr>
                {[{k:'name',l:'Supplier'},{k:'country',l:'Country'},{k:'tier',l:'Tier'},{k:'category',l:'Category'},{k:'esgScore',l:'ESG'},{k:'scope3MtCO2e',l:'Scope 3'},{k:'dqs',l:'DQS'},{k:'deforestationRisk',l:'Deforest'},{k:'mineralExposure',l:'Mineral'},{k:'resilienceScore',l:'Resilience'},{k:'certCount',l:'Certs'},{k:'annualSpendM',l:'Spend $M'}].map(c=>(
                  <th key={c.k} style={{...s.th,cursor:'pointer'}} onClick={()=>handleSort(c.k)}>
                    {c.l}{sortCol===c.k?(sortDir==='asc'?' ▲':' ▼'):''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.slice(0,100).map(sup=>(
                <tr key={sup.id} style={{cursor:'pointer',background:selSupplier?.id===sup.id?T.surfaceH:'transparent'}} onClick={()=>setSelSupplier(selSupplier?.id===sup.id?null:sup)}>
                  <td style={{...s.td,fontWeight:600,maxWidth:160}}>{sup.name}{sup.highRisk&&<span style={{...s.badge,background:'#fef2f2',color:T.red}}>HIGH</span>}</td>
                  <td style={s.td}>{sup.country}</td>
                  <td style={s.td}>{sup.tier}</td>
                  <td style={s.td}>{sup.category}</td>
                  <td style={{...s.td,fontWeight:600,color:sup.esgScore>=70?T.green:sup.esgScore>=50?T.amber:T.red}}>{sup.esgScore}</td>
                  <td style={s.td}>{sup.scope3MtCO2e}</td>
                  <td style={{...s.td,color:sup.dqs>=70?T.green:sup.dqs>=50?T.amber:T.red}}>{sup.dqs}</td>
                  <td style={{...s.td,color:sup.deforestationRisk>70?T.red:sup.deforestationRisk>40?T.amber:T.green}}>{sup.deforestationRisk}</td>
                  <td style={{...s.td,color:sup.mineralExposure>75?T.red:sup.mineralExposure>40?T.amber:T.green}}>{sup.mineralExposure}</td>
                  <td style={{...s.td,color:sup.resilienceScore>=70?T.green:sup.resilienceScore>=50?T.amber:T.red}}>{sup.resilienceScore}</td>
                  <td style={s.td}>{sup.certCount}</td>
                  <td style={s.td}>${sup.annualSpendM}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSuppliers.length>100&&<div style={{textAlign:'center',padding:8,fontSize:11,color:T.textMut}}>Showing 100 of {filteredSuppliers.length} — refine filters</div>}
      </div>

      {/* Supplier risk matrix summary */}
      <div style={s.card}>
        <div style={s.subTitle}>Supplier Risk Matrix — ESG Score vs Spend</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={[
            {bucket:'ESG 80+',lowSpend:SUPPLIERS.filter(s=>s.esgScore>=80&&s.annualSpendM<2).length,midSpend:SUPPLIERS.filter(s=>s.esgScore>=80&&s.annualSpendM>=2&&s.annualSpendM<4).length,highSpend:SUPPLIERS.filter(s=>s.esgScore>=80&&s.annualSpendM>=4).length},
            {bucket:'ESG 60-79',lowSpend:SUPPLIERS.filter(s=>s.esgScore>=60&&s.esgScore<80&&s.annualSpendM<2).length,midSpend:SUPPLIERS.filter(s=>s.esgScore>=60&&s.esgScore<80&&s.annualSpendM>=2&&s.annualSpendM<4).length,highSpend:SUPPLIERS.filter(s=>s.esgScore>=60&&s.esgScore<80&&s.annualSpendM>=4).length},
            {bucket:'ESG 40-59',lowSpend:SUPPLIERS.filter(s=>s.esgScore>=40&&s.esgScore<60&&s.annualSpendM<2).length,midSpend:SUPPLIERS.filter(s=>s.esgScore>=40&&s.esgScore<60&&s.annualSpendM>=2&&s.annualSpendM<4).length,highSpend:SUPPLIERS.filter(s=>s.esgScore>=40&&s.esgScore<60&&s.annualSpendM>=4).length},
            {bucket:'ESG <40',lowSpend:SUPPLIERS.filter(s=>s.esgScore<40&&s.annualSpendM<2).length,midSpend:SUPPLIERS.filter(s=>s.esgScore<40&&s.annualSpendM>=2&&s.annualSpendM<4).length,highSpend:SUPPLIERS.filter(s=>s.esgScore<40&&s.annualSpendM>=4).length},
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="bucket" tick={{fontSize:11,fill:T.text}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
            <Bar dataKey="lowSpend" stackId="a" fill={T.sage} name="Spend <$2M"/>
            <Bar dataKey="midSpend" stackId="a" fill={T.gold} name="Spend $2-4M"/>
            <Bar dataKey="highSpend" stackId="a" fill={T.red} name="Spend >$4M"/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cross-module supplier panel */}
      {selSupplier&&(
        <div style={s.panel}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{selSupplier.name}</div>
              <div style={{fontSize:12,color:T.textSec}}>{selSupplier.country} | {selSupplier.region} | {selSupplier.tier} | {selSupplier.category} | Spend: ${selSupplier.annualSpendM}M</div>
            </div>
            <button style={s.btn(false)} onClick={()=>setSelSupplier(null)}>Close</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginTop:16}}>
            <div style={s.kpiCard(T.navy)}>
              <div style={s.kpiLabel}>Scope 3</div>
              <div style={{fontSize:18,fontWeight:700,color:T.navy}}>{selSupplier.scope3MtCO2e}</div>
              <div style={{fontSize:10,color:T.textMut}}>MtCO2e | {selSupplier.scope3Cat}</div>
              <div style={{fontSize:10,color:T.textMut}}>Intensity: {selSupplier.emissionIntensity} | DQS: {selSupplier.dqs}</div>
              {selSupplier.reductionTarget>0&&<div style={{fontSize:10,color:T.green}}>Target: -{selSupplier.reductionTarget}% | Achieved: -{selSupplier.reductionAchieved}%</div>}
            </div>
            <div style={s.kpiCard(T.sage)}>
              <div style={s.kpiLabel}>ESG Score</div>
              <div style={{fontSize:18,fontWeight:700,color:selSupplier.esgScore>=70?T.green:selSupplier.esgScore>=50?T.amber:T.red}}>{selSupplier.esgScore}/100</div>
              <div style={{fontSize:10,color:T.textMut}}>{selSupplier.engaged?'Engaged':'Not Engaged'}</div>
              <div style={{fontSize:10,color:T.textMut}}>Corrective: {selSupplier.correctiveActions} open</div>
            </div>
            <div style={s.kpiCard(T.green)}>
              <div style={s.kpiLabel}>Deforestation</div>
              <div style={{fontSize:18,fontWeight:700,color:selSupplier.deforestationRisk>70?T.red:T.green}}>Risk: {selSupplier.deforestationRisk}</div>
              <div style={{fontSize:10,color:T.textMut}}>EUDR: {selSupplier.eudrCompliant?'Compliant':'Gap'}</div>
              <div style={{fontSize:10,color:T.textMut}}>Satellite: {selSupplier.satelMonitored?'Monitored':'No coverage'}</div>
              <div style={{fontSize:10,color:T.textMut}}>{selSupplier.commodities.join(', ')||'No commodities'}</div>
            </div>
            <div style={s.kpiCard(T.amber)}>
              <div style={s.kpiLabel}>Conflict Minerals</div>
              <div style={{fontSize:18,fontWeight:700,color:selSupplier.mineralExposure>75?T.red:T.amber}}>Exp: {selSupplier.mineralExposure}</div>
              <div style={{fontSize:10,color:T.textMut}}>CRMA: {selSupplier.crmaCompliant?'Compliant':'Gap'}</div>
              <div style={{fontSize:10,color:T.textMut}}>Smelter: {selSupplier.smelterAudited?'Audited':'Pending'}</div>
              <div style={{fontSize:10,color:T.textMut}}>{selSupplier.minerals.join(', ')||'No minerals'}</div>
            </div>
            <div style={s.kpiCard(T.teal)}>
              <div style={s.kpiLabel}>Resilience</div>
              <div style={{fontSize:18,fontWeight:700,color:selSupplier.resilienceScore>=70?T.green:selSupplier.resilienceScore>=50?T.amber:T.red}}>{selSupplier.resilienceScore}/100</div>
              <div style={{fontSize:10,color:T.textMut}}>Disruption Prob: {selSupplier.disruptionProb}%</div>
              <div style={{fontSize:10,color:T.textMut}}>Alt Suppliers: {selSupplier.altSuppliers} | Lead: {selSupplier.leadTimeDays}d</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginTop:16}}>
            <div>
              <div style={s.subTitle}>Certifications ({selSupplier.certCount})</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {selSupplier.certifications.length>0?selSupplier.certifications.map(c=><span key={c} style={s.pill('#f0fdf4',T.green)}>{c}</span>):<span style={{fontSize:12,color:T.textMut}}>No certifications</span>}
              </div>
            </div>
            <div>
              <div style={s.subTitle}>Status Flags</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {selSupplier.highRisk&&<span style={s.pill('#fef2f2',T.red)}>High Risk</span>}
                {selSupplier.waterStress&&<span style={s.pill('#eff6ff','#2563eb')}>Water Stress</span>}
                {selSupplier.modernSlaveryRisk&&<span style={s.pill('#fef2f2',T.red)}>Modern Slavery Flag</span>}
                {selSupplier.correctiveActions>0&&<span style={s.pill('#fffbeb',T.amber)}>{selSupplier.correctiveActions} Corrective Actions</span>}
                {!selSupplier.engaged&&<span style={s.pill(T.surfaceH,T.textMut)}>Not Engaged</span>}
              </div>
            </div>
            <div>
              <div style={s.subTitle}>Active Engagements ({supplierEngagements.length})</div>
              {supplierEngagements.length>0?supplierEngagements.map(e=>(
                <div key={e.id} style={{fontSize:11,padding:'3px 0',borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontWeight:600}}>{e.dimension}</span> — {e.stage} ({e.actionsComplete}/{e.actions} done)
                </div>
              )):<div style={{fontSize:12,color:T.textMut}}>No active engagements</div>}
            </div>
          </div>
          <div style={{marginTop:12,fontSize:11,fontFamily:T.mono,color:T.textMut}}>Last Audit: {selSupplier.lastAudit} | Carbon Intensity: {selSupplier.carbonIntensity} tCO2e/$M</div>
        </div>
      )}
    </>
  );

  // ── Tab 3: Engagement & Action ──────────────────────────────────────────────
  const renderEngagement=()=>(
    <>
      <div style={s.card}>
        <div style={s.subTitle}>Engagement Pipeline by Stage</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stagePipeline}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="stage" tick={{fontSize:10,fill:T.text}} angle={-20} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
            <Bar dataKey="count" fill={T.sage} radius={[4,4,0,0]} name="Engagements"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={s.row}>
        <div style={{...s.card,...s.col(1)}}>
          <div style={s.subTitle}>By Dimension</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={dimBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {dimBreakdown.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{...s.card,...s.col(1.5)}}>
          <div style={s.subTitle}>Engagement Effectiveness Over Time</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ENG_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
              <Line type="monotone" dataKey="effectiveness" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Effectiveness %"/>
              <Line type="monotone" dataKey="engagements" stroke={T.gold} strokeWidth={2} dot={{r:3}} name="Active Count"/>
              <Line type="monotone" dataKey="completionRate" stroke={T.green} strokeWidth={2} dot={{r:3}} name="Completion %"/>
              <Legend wrapperStyle={{fontSize:11}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.subTitle}>Resource Allocation Recommendations</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={resourceAlloc} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} unit="%"/>
            <YAxis dataKey="area" type="category" tick={{fontSize:10,fill:T.text}} width={140}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
            <Bar dataKey="current" fill={T.navyL} radius={[0,4,4,0]} name="Current %"/>
            <Bar dataKey="recommended" fill={T.gold} radius={[0,4,4,0]} name="Recommended %"/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'center'}}>
        <select style={s.select} value={engFilter} onChange={e=>setEngFilter(e.target.value)}>
          <option value="All">All Stages</option>{ENGAGEMENT_STAGES.map(st=><option key={st} value={st}>{st}</option>)}
        </select>
        <select style={s.select} value={engDim} onChange={e=>setEngDim(e.target.value)}>
          <option value="All">All Dimensions</option>{ENGAGEMENT_DIMS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select style={s.select} value={engOwner} onChange={e=>setEngOwner(e.target.value)}>
          <option value="All">All Owners</option>{['Procurement','Sustainability','Risk','Compliance'].map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filteredEngagements.length} engagements</span>
      </div>

      <div style={{...s.card,padding:0,overflow:'hidden'}}>
        <div style={{maxHeight:420,overflowY:'auto'}}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Priority</th><th style={s.th}>Supplier</th><th style={s.th}>Country</th><th style={s.th}>Tier</th>
                <th style={s.th}>Dimension</th><th style={s.th}>Stage</th><th style={s.th}>Progress</th>
                <th style={s.th}>Owner</th><th style={s.th}>Effect.</th><th style={s.th}>Cost $K</th><th style={s.th}>Target</th>
              </tr>
            </thead>
            <tbody>
              {filteredEngagements.map(eng=>(
                <tr key={eng.id}>
                  <td style={{...s.td,fontWeight:700,color:eng.priority>=80?T.red:eng.priority>=50?T.amber:T.green}}>{eng.priority}</td>
                  <td style={{...s.td,fontWeight:600}}>{eng.supplier}</td>
                  <td style={s.td}>{eng.country}</td>
                  <td style={s.td}>{eng.tier}</td>
                  <td style={s.td}>{eng.dimension}</td>
                  <td style={s.td}><span style={s.pill(eng.stageIdx>=5?'#f0fdf4':eng.stageIdx>=3?'#fffbeb':'#f0f9ff',eng.stageIdx>=5?T.green:eng.stageIdx>=3?T.amber:T.navyL)}>{eng.stage}</span></td>
                  <td style={s.td}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:60,height:6,borderRadius:3,background:T.border,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${eng.actions>0?(eng.actionsComplete/eng.actions)*100:0}%`,borderRadius:3,background:T.sage}}/>
                      </div>
                      <span style={{fontSize:10,color:T.textMut}}>{eng.actionsComplete}/{eng.actions}</span>
                    </div>
                  </td>
                  <td style={s.td}>{eng.owner}</td>
                  <td style={{...s.td,fontWeight:600,color:eng.effectiveness>=75?T.green:eng.effectiveness>=60?T.amber:T.red}}>{eng.effectiveness}%</td>
                  <td style={s.td}>${eng.cost}K</td>
                  <td style={{...s.td,fontSize:10,fontFamily:T.mono}}>{eng.targetDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action item summary */}
      <div style={{...s.card,marginTop:16}}>
        <div style={s.subTitle}>Action Item Summary</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
          {[
            {label:'Total Actions',val:ENGAGEMENTS.reduce((a,e)=>a+e.actions,0),color:T.navy},
            {label:'Completed',val:ENGAGEMENTS.reduce((a,e)=>a+e.actionsComplete,0),color:T.green},
            {label:'In Progress',val:ENGAGEMENTS.reduce((a,e)=>a+(e.actions-e.actionsComplete),0),color:T.amber},
            {label:'Overdue',val:Math.floor(ENGAGEMENTS.reduce((a,e)=>a+(e.actions-e.actionsComplete),0)*0.18),color:T.red},
            {label:'Total Investment',val:`$${(ENGAGEMENTS.reduce((a,e)=>a+e.cost,0)/1000).toFixed(1)}M`,color:T.gold},
          ].map((m,i)=>(
            <div key={i} style={s.kpiCard(m.color)}>
              <div style={s.kpiLabel}>{m.label}</div>
              <div style={{fontSize:20,fontWeight:700,color:m.color}}>{m.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority scoring methodology */}
      <div style={s.card}>
        <div style={s.subTitle}>Priority Scoring — Multi-Factor Breakdown</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Priority = f(ESG Risk, Spend Materiality, Regulatory Exposure, Engagement Gap, Disruption Probability)</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
          {[
            {factor:'ESG Risk Weight',val:'30%',desc:'Inverse of supplier ESG score'},
            {factor:'Spend Materiality',val:'25%',desc:'Annual spend as % of total'},
            {factor:'Regulatory Exposure',val:'20%',desc:'CSDDD/EUDR/CRMA gap count'},
            {factor:'Engagement Gap',val:'15%',desc:'Unengaged high-risk suppliers'},
            {factor:'Disruption Prob.',val:'10%',desc:'Climate & geopolitical risk'},
          ].map((f,i)=>(
            <div key={i} style={{padding:10,borderRadius:8,border:`1px solid ${T.border}`,textAlign:'center'}}>
              <div style={{fontSize:11,fontWeight:700,color:T.navy}}>{f.factor}</div>
              <div style={{fontSize:18,fontWeight:800,color:T.gold,margin:'6px 0'}}>{f.val}</div>
              <div style={{fontSize:10,color:T.textMut}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage progression area chart */}
      <div style={s.card}>
        <div style={s.subTitle}>Engagement Stage Progression (12 months)</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={Array.from({length:12},(_,i)=>{
            const base=60;
            return{month:['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'][i],
              completed:Math.floor(5+i*1.8+sr(i*31)*3),monitoring:Math.floor(8+sr(i*37)*4),implementing:Math.floor(10+sr(i*41)*5),
              planning:Math.floor(12+sr(i*43)*4-i*0.3),early:Math.floor(25-i*1.2+sr(i*47)*3)};
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="month" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
            <Area type="monotone" dataKey="completed" stackId="1" stroke={T.green} fill={T.green} fillOpacity={0.6} name="Completed"/>
            <Area type="monotone" dataKey="monitoring" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.5} name="Monitoring"/>
            <Area type="monotone" dataKey="implementing" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.5} name="Implementing"/>
            <Area type="monotone" dataKey="planning" stackId="1" stroke={T.amber} fill={T.amber} fillOpacity={0.4} name="Planning"/>
            <Area type="monotone" dataKey="early" stackId="1" stroke={T.navyL} fill={T.navyL} fillOpacity={0.3} name="Early Stage"/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Owner breakdown area chart */}
      <div style={s.card}>
        <div style={s.subTitle}>Engagements by Owner & Dimension</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={['Procurement','Sustainability','Risk','Compliance'].map(o=>({owner:o,...ENGAGEMENT_DIMS.reduce((acc,d)=>({...acc,[d.split(' ')[0]]:ENGAGEMENTS.filter(e=>e.owner===o&&e.dimension===d).length}),{})}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="owner" tick={{fontSize:11,fill:T.text}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
            {ENGAGEMENT_DIMS.map((d,i)=><Bar key={d} dataKey={d.split(' ')[0]} stackId="a" fill={PIE_COLORS[i]} name={d}/>)}
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  // ── Tab 4: Board Report ─────────────────────────────────────────────────────
  const renderBoardReport=()=>{
    const maturityOverall=Math.floor(Object.values(REPORT_CONTENT).reduce((a,v)=>a+v.maturity,0)/BOARD_SECTIONS.length);
    return(
      <>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <label style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>FROM</label>
          <input type="date" style={s.input} value={boardDateFrom} onChange={e=>setBoardDateFrom(e.target.value)}/>
          <label style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>TO</label>
          <input type="date" style={s.input} value={boardDateTo} onChange={e=>setBoardDateTo(e.target.value)}/>
          <span style={{fontSize:11,color:T.textSec,fontFamily:T.mono,marginLeft:12}}>AUDIENCE</span>
          {AUDIENCES.map(a=><button key={a} style={s.toggle(boardAudience===a)} onClick={()=>setBoardAudience(a)}>{a}</button>)}
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <button style={s.btn(false)} onClick={()=>{
              const rows=[['Section','Maturity','Content']];
              BOARD_SECTIONS.filter(sec=>boardSections[sec]).forEach(sec=>{rows.push([sec,REPORT_CONTENT[sec].maturity,REPORT_CONTENT[sec].text.replace(/,/g,';')]);});
              const csv=rows.map(r=>r.join(',')).join('\n');
              const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
              const a=document.createElement('a');a.href=url;a.download=`supply_chain_esg_board_report_${boardAudience.toLowerCase()}.csv`;a.click();
            }}>Export CSV</button>
            <button style={s.btn(true)} onClick={()=>window.print()}>Print Preview</button>
          </div>
        </div>

        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div>
              <div style={s.sectionTitle}>Supply Chain ESG Maturity Score</div>
              <div style={{fontSize:11,color:T.textSec}}>Period: {boardDateFrom} to {boardDateTo} | Audience: {boardAudience}</div>
            </div>
            <div style={{fontSize:36,fontWeight:800,color:maturityOverall>=70?T.green:maturityOverall>=50?T.amber:T.red}}>{maturityOverall}<span style={{fontSize:16,color:T.textMut}}>/100</span></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {BOARD_SECTIONS.map(sec=>(
              <div key={sec} style={{padding:8}}>
                <div style={{fontSize:10,color:T.textSec,marginBottom:4}}>{sec}</div>
                <div style={s.maturityBar()}><div style={s.maturityFill(REPORT_CONTENT[sec].maturity)}/></div>
                <div style={{fontSize:11,fontWeight:600,color:REPORT_CONTENT[sec].maturity>=70?T.green:REPORT_CONTENT[sec].maturity>=50?T.amber:T.red,marginTop:2}}>{REPORT_CONTENT[sec].maturity}%</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.subTitle}>Regulatory Compliance Status</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
            {regCompliance.map(rc=>(
              <div key={rc.reg} style={{textAlign:'center'}}>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>{rc.reg}</div>
                <div style={{position:'relative',width:80,height:80,margin:'0 auto'}}>
                  <svg width={80} height={80} viewBox="0 0 80 80">
                    <circle cx={40} cy={40} r={34} fill="none" stroke={T.border} strokeWidth={6}/>
                    <circle cx={40} cy={40} r={34} fill="none" stroke={rc.compliance>=80?T.green:rc.compliance>=50?T.amber:T.red} strokeWidth={6} strokeDasharray={`${rc.compliance*2.136} ${213.6-rc.compliance*2.136}`} strokeDashoffset={53.4} strokeLinecap="round"/>
                    <text x={40} y={44} textAnchor="middle" fontSize={14} fontWeight={700} fill={T.navy}>{rc.compliance}%</text>
                  </svg>
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Target: {rc.target}%</div>
                <div style={{fontSize:10,color:rc.compliance>=rc.target?T.green:T.amber,marginTop:2}}>{rc.compliance>=rc.target?'On Track':'Gap: '+(rc.target-rc.compliance).toFixed(1)+'pp'}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.row}>
          <div style={{...s.card,...s.col(1)}}>
            <div style={s.subTitle}>Peer Benchmark Comparison</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
                <Radar name="Our Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25}/>
                <Radar name="Peer Avg" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/>
                <Legend wrapperStyle={{fontSize:11}}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{...s.card,...s.col(1)}}>
            <div style={s.subTitle}>Maturity Trend</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={Array.from({length:6},(_,i)=>({quarter:['Q3 25','Q4 25','Q1 26','Q2 26','Q3 26','Q4 26'][i],maturity:Math.floor(54+i*3.2+sr(i*77)*2),target:70}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="quarter" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis domain={[40,85]} tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
                <Area type="monotone" dataKey="maturity" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} name="Maturity"/>
                <Area type="monotone" dataKey="target" stroke={T.gold} fill="none" strokeWidth={2} strokeDasharray="5 5" name="Target"/>
                <Legend wrapperStyle={{fontSize:11}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key metrics summary for board */}
        <div style={s.card}>
          <div style={s.subTitle}>Key Performance Indicators — {boardAudience} View</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
            {[
              {l:'Scope 3 Total',v:'51,240',u:'MtCO2e',d:'-6.4%',c:T.navy},
              {l:'Suppliers Engaged',v:'128',u:'/200',d:'+18%',c:T.sage},
              {l:'EUDR Compliance',v:'71%',u:'',d:'+12pp',c:T.green},
              {l:'Smelter Coverage',v:'94%',u:'',d:'+8pp',c:T.amber},
              {l:'Resilience Score',v:'65',u:'/100',d:'+4pts',c:T.teal},
              {l:'Cost-at-Risk',v:'$142M',u:'',d:'-11%',c:T.red},
            ].map((k,i)=>(
              <div key={i} style={{textAlign:'center',padding:10,borderRadius:8,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:k.c,marginTop:4}}>{k.v}<span style={{fontSize:10,color:T.textMut}}>{k.u}</span></div>
                <div style={{fontSize:10,fontWeight:600,color:T.green,marginTop:2}}>{k.d} YoY</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={s.subTitle}>Report Sections</div>
            <div style={{display:'flex',gap:6}}>
              <button style={s.btn(false)} onClick={()=>setBoardSections(BOARD_SECTIONS.reduce((a,sec)=>({...a,[sec]:true}),{}))}>Select All</button>
              <button style={s.btn(false)} onClick={()=>setBoardSections(BOARD_SECTIONS.reduce((a,sec)=>({...a,[sec]:false}),{}))}>Clear All</button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:16}}>
            {BOARD_SECTIONS.map(sec=>(
              <label key={sec} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,cursor:'pointer',padding:'4px 0'}}>
                <input type="checkbox" checked={boardSections[sec]} onChange={()=>setBoardSections(p=>({...p,[sec]:!p[sec]}))} style={s.checkbox}/>
                {sec}
              </label>
            ))}
          </div>
        </div>

        <div style={s.printArea}>
          {BOARD_SECTIONS.filter(sec=>boardSections[sec]).map(sec=>(
            <div key={sec} style={{...s.card,pageBreakInside:'avoid'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:15,fontWeight:700,color:T.navy}}>{sec}</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>Maturity</span>
                  <div style={{width:80,...s.maturityBar()}}><div style={s.maturityFill(REPORT_CONTENT[sec].maturity)}/></div>
                  <span style={{fontSize:11,fontWeight:700,color:REPORT_CONTENT[sec].maturity>=70?T.green:REPORT_CONTENT[sec].maturity>=50?T.amber:T.red}}>{REPORT_CONTENT[sec].maturity}%</span>
                </div>
              </div>
              <div style={{fontSize:12,color:T.textSec,lineHeight:1.7}}>{REPORT_CONTENT[sec].text}</div>
              {boardAudience==='Board'&&sec==='Executive Summary'&&(
                <div style={{marginTop:12,padding:12,background:T.surfaceH,borderRadius:8,fontSize:11,color:T.navy}}>
                  <strong>Board Action Required:</strong> Approve Q2 budget allocation of $2.8M for CSDDD value chain mapping Phase 2 and cobalt diversification program. Review updated supplier engagement KPIs for FY 2026 target setting.
                </div>
              )}
              {boardAudience==='Procurement'&&sec==='Supplier Engagement Progress'&&(
                <div style={{marginTop:12,padding:12,background:'#eff6ff',borderRadius:8,fontSize:11,color:T.navyL}}>
                  <strong>Procurement Focus:</strong> 72 suppliers have not responded to ESG questionnaires within SLA. Recommend escalation for 18 strategic suppliers with annual spend exceeding $3M. Supplier consolidation opportunity identified: 12 overlapping Category 1 suppliers could be reduced to 8.
                </div>
              )}
              {boardAudience==='Risk'&&sec==='Supply Chain Resilience'&&(
                <div style={{marginTop:12,padding:12,background:'#fffbeb',borderRadius:8,fontSize:11,color:T.amber}}>
                  <strong>Risk Committee Note:</strong> 6 disruption scenarios modeled with aggregate P50 impact of $142M. Recommend increasing supply chain insurance coverage from $80M to $120M. Single-source dependencies for 8 critical components require board-level risk acceptance or mitigation approval.
                </div>
              )}
              {boardAudience==='Regulator'&&(
                <div style={{marginTop:8,padding:8,background:'#f0fdf4',borderRadius:6,fontSize:10,color:T.green}}>
                  Regulatory evidence reference: Documented in ESG Data Management System. Audit trail ID: SCE-{sec.replace(/\s+/g,'-').toUpperCase()}-2026. Third-party verification pending for Q2 submission.
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Audience-specific supplementary data */}
        {boardAudience==='Board'&&(
          <div style={s.card}>
            <div style={s.subTitle}>Board Decision Matrix</div>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Decision Item</th><th style={s.th}>Budget</th><th style={s.th}>Timeline</th><th style={s.th}>Risk if Deferred</th><th style={s.th}>Recommendation</th></tr></thead>
              <tbody>
                {[
                  {item:'CSDDD Phase 2 Mapping',budget:'$2.8M',timeline:'Q2-Q4 2026',risk:'Non-compliance by 2027 deadline',rec:'Approve'},
                  {item:'Cobalt Diversification',budget:'$1.2M',timeline:'Q2-Q3 2026',risk:'68% concentration exposure',rec:'Approve'},
                  {item:'Satellite Monitoring Expansion',budget:'$0.8M',timeline:'Q3 2026',risk:'EUDR audit gap',rec:'Approve'},
                  {item:'Tier 2 Data Platform',budget:'$1.5M',timeline:'Q3-Q4 2026',risk:'Scope 3 accuracy deficit',rec:'Defer to Q3 review'},
                ].map((d,i)=>(
                  <tr key={i}><td style={{...s.td,fontWeight:600}}>{d.item}</td><td style={s.td}>{d.budget}</td><td style={s.td}>{d.timeline}</td><td style={{...s.td,color:T.red}}>{d.risk}</td><td style={s.td}><span style={s.pill(d.rec==='Approve'?'#f0fdf4':'#fffbeb',d.rec==='Approve'?T.green:T.amber)}>{d.rec}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {boardAudience==='Risk'&&(
          <div style={s.card}>
            <div style={s.subTitle}>Risk Register — Supply Chain ESG</div>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Risk ID</th><th style={s.th}>Risk Description</th><th style={s.th}>Likelihood</th><th style={s.th}>Impact</th><th style={s.th}>Residual</th><th style={s.th}>Mitigation</th><th style={s.th}>Owner</th></tr></thead>
              <tbody>
                {[
                  {id:'SCR-001',desc:'Cobalt supply concentration',like:'High',impact:'$210M',residual:'High',mit:'Diversification program',owner:'Procurement'},
                  {id:'SCR-002',desc:'EUDR non-compliance penalties',like:'Medium',impact:'$45M',residual:'Medium',mit:'Compliance acceleration',owner:'Legal'},
                  {id:'SCR-003',desc:'Tier 2 modern slavery exposure',like:'Medium',impact:'Reputational',residual:'Medium',mit:'Enhanced due diligence',owner:'Compliance'},
                  {id:'SCR-004',desc:'SE Asia climate disruption',like:'High',impact:'$84M',residual:'Medium',mit:'BCP & dual sourcing',owner:'Operations'},
                  {id:'SCR-005',desc:'CSDDD litigation exposure',like:'Low',impact:'$120M+',residual:'High',mit:'Value chain mapping',owner:'Legal'},
                  {id:'SCR-006',desc:'Carbon pricing pass-through',like:'High',impact:'$12M/yr',residual:'Low',mit:'Supplier engagement',owner:'Sustainability'},
                  {id:'SCR-007',desc:'Deforestation-linked brand risk',like:'Medium',impact:'Reputational',residual:'Low',mit:'Satellite monitoring',owner:'Sustainability'},
                ].map((r,i)=>(
                  <tr key={i}>
                    <td style={{...s.td,fontFamily:T.mono,fontWeight:600}}>{r.id}</td>
                    <td style={{...s.td,maxWidth:200}}>{r.desc}</td>
                    <td style={{...s.td,color:r.like==='High'?T.red:r.like==='Medium'?T.amber:T.green}}>{r.like}</td>
                    <td style={{...s.td,fontWeight:600}}>{r.impact}</td>
                    <td style={s.td}><span style={s.pill(r.residual==='High'?'#fef2f2':r.residual==='Medium'?'#fffbeb':'#f0fdf4',r.residual==='High'?T.red:r.residual==='Medium'?T.amber:T.green)}>{r.residual}</span></td>
                    <td style={s.td}>{r.mit}</td>
                    <td style={s.td}>{r.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {boardAudience==='Procurement'&&(
          <div style={s.card}>
            <div style={s.subTitle}>Procurement Action Items</div>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Action</th><th style={s.th}>Suppliers Affected</th><th style={s.th}>Deadline</th><th style={s.th}>Status</th></tr></thead>
              <tbody>
                {[
                  {action:'Issue EUDR compliance notices to non-compliant suppliers',affected:SUPPLIERS.filter(s=>!s.eudrCompliant).length,deadline:'2026-04-15',status:'Pending'},
                  {action:'Re-negotiate contracts with ESG performance clauses',affected:45,deadline:'2026-06-30',status:'In Progress'},
                  {action:'Onboard 2 alternative cobalt suppliers',affected:3,deadline:'2026-09-30',status:'Planning'},
                  {action:'Complete CDP supply chain questionnaire follow-ups',affected:72,deadline:'2026-04-30',status:'Active'},
                  {action:'Update supplier code of conduct (CSDDD alignment)',affected:200,deadline:'2026-05-31',status:'Drafting'},
                ].map((a,i)=>(
                  <tr key={i}><td style={{...s.td,fontWeight:600}}>{a.action}</td><td style={s.td}>{a.affected}</td><td style={{...s.td,fontFamily:T.mono}}>{a.deadline}</td><td style={s.td}><span style={s.pill(a.status==='Active'||a.status==='In Progress'?'#f0fdf4':'#fffbeb',a.status==='Active'||a.status==='In Progress'?T.green:T.amber)}>{a.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {boardAudience==='Regulator'&&(
          <div style={s.card}>
            <div style={s.subTitle}>Regulatory Submission Checklist</div>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Regulation</th><th style={s.th}>Requirement</th><th style={s.th}>Due Date</th><th style={s.th}>Status</th><th style={s.th}>Evidence</th></tr></thead>
              <tbody>
                {[
                  {reg:'CSDDD',req:'Human rights & environmental due diligence plan',due:'2027-07-26',status:'In Progress',evidence:'DD Framework v2.1'},
                  {reg:'CSDDD',req:'Value chain mapping documentation',due:'2027-07-26',status:'Phase 1 Complete',evidence:'41% coverage documented'},
                  {reg:'EUDR',req:'Due diligence statements for 6 commodities',due:'2026-12-30',status:'71% Complete',evidence:'Geolocation data for 78% of sourcing'},
                  {reg:'CRMA',req:'Strategic raw materials supply chain audit',due:'2027-05-01',status:'On Track',evidence:'94% smelter audit coverage'},
                  {reg:'UK MSA',req:'Annual Modern Slavery Act statement',due:'2026-06-30',status:'Published',evidence:'Enhanced DD for 35 suppliers'},
                  {reg:'EUDR',req:'Satellite monitoring evidence package',due:'2026-12-30',status:'Partial',evidence:'89% high-risk area coverage'},
                ].map((r,i)=>(
                  <tr key={i}>
                    <td style={{...s.td,fontWeight:600}}>{r.reg}</td>
                    <td style={{...s.td,maxWidth:220}}>{r.req}</td>
                    <td style={{...s.td,fontFamily:T.mono}}>{r.due}</td>
                    <td style={s.td}><span style={s.pill(r.status==='Published'||r.status==='On Track'?'#f0fdf4':r.status.includes('Complete')?'#eff6ff':'#fffbeb',r.status==='Published'||r.status==='On Track'?T.green:r.status.includes('Complete')?T.navyL:T.amber)}>{r.status}</span></td>
                    <td style={{...s.td,fontSize:10}}>{r.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Certification coverage chart */}
        <div style={s.card}>
          <div style={s.subTitle}>Certification Coverage by Type</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CERT_TYPES.map(ct=>({cert:ct,count:SUPPLIERS.filter(s=>s.certifications.includes(ct)).length,pct:+((SUPPLIERS.filter(s=>s.certifications.includes(ct)).length/200)*100).toFixed(1)}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="cert" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={60}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
              <Bar dataKey="count" fill={T.sage} radius={[4,4,0,0]} name="Suppliers"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Report metadata footer */}
        <div style={{...s.card,background:T.surfaceH,marginTop:8}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,fontFamily:T.mono,color:T.textMut}}>
            <span>Generated: 2026-03-28 | Audience: {boardAudience} | Period: {boardDateFrom} to {boardDateTo}</span>
            <span>Supply Chain ESG Hub v2.1 | Data Quality: {(SUPPLIERS.reduce((a,s)=>a+s.dqs,0)/200).toFixed(0)}/100 avg DQS | {BOARD_SECTIONS.filter(sec=>boardSections[sec]).length}/{BOARD_SECTIONS.length} sections included</span>
          </div>
        </div>
      </>
    );
  };

  // ── Main Render ─────────────────────────────────────────────────────────────
  return(
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.h1}>
            Supply Chain ESG Intelligence Hub
            <span style={{...s.badge,background:T.navy,color:'#fff'}}>EP-AP6</span>
          </div>
          <div style={s.subtitle}>
            Executive dashboard aggregating Scope 3, Supplier Engagement, Deforestation, Conflict Minerals & Resilience
            <span style={{fontFamily:T.mono,marginLeft:8,color:T.textMut}}>200 suppliers | 12 KPIs | 5 sub-modules | {alerts.filter(a=>!a.dismissed).length} active alerts</span>
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>LAST SYNC 2026-03-28 08:14 UTC</span>
          <span style={{width:8,height:8,borderRadius:'50%',background:T.green,display:'inline-block'}}/>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map((t,i)=><button key={t} style={s.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0&&renderDashboard()}
      {tab===1&&renderSuppliers()}
      {tab===2&&renderEngagement()}
      {tab===3&&renderBoardReport()}
    </div>
  );
}
