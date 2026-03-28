import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt=(v,d=1)=>v>=1e9?(v/1e9).toFixed(d)+'B':v>=1e6?(v/1e6).toFixed(d)+'M':v>=1e3?(v/1e3).toFixed(d)+'K':v.toFixed(d);
const pct=(v)=>(v*100).toFixed(1)+'%';

const TABS=['SAF Market Overview','Pathway Comparison','Mandate Tracker','Investment & Offtakes'];
const PATHWAYS=['HEFA','Fischer-Tropsch','AtJ','DSHC','Co-processing','e-Kerosene/PtL','Pyrolysis','Gasification'];
const PW_DESC={
  'HEFA':'Hydroprocessed Esters and Fatty Acids from waste fats/oils. Most mature pathway with ~80% of current SAF production.',
  'Fischer-Tropsch':'Gasification of biomass/waste followed by FT synthesis. Proven at scale in fossil fuels, adapting for bio-feedstocks.',
  'AtJ':'Alcohol-to-Jet converts ethanol/isobutanol to jet fuel. Leverages existing alcohol infrastructure.',
  'DSHC':'Direct Sugar to Hydrocarbons via fermentation. Novel biological conversion route.',
  'Co-processing':'Blending bio-feedstock into existing refinery hydroprocessing units. Lowest capex pathway.',
  'e-Kerosene/PtL':'Power-to-Liquid using green hydrogen + captured CO2. Highest GHG reduction potential but most expensive.',
  'Pyrolysis':'Thermal decomposition of biomass/waste plastics in oxygen-free environment. Emerging pathway.',
  'Gasification':'Thermochemical conversion of municipal solid waste or biomass to syngas then jet fuel.'
};
const PW_FEED={'HEFA':'Used cooking oil, tallow, camelina','Fischer-Tropsch':'Forestry residues, MSW, ag waste','AtJ':'Corn ethanol, cellulosic ethanol, isobutanol','DSHC':'Sugarcane, corn sugars, cellulosic sugars','Co-processing':'Vegetable oils, animal fats in refinery blend','e-Kerosene/PtL':'Green H2 + DAC CO2 (renewable electricity)','Pyrolysis':'Waste plastics, forestry residues, biosolids','Gasification':'MSW, wood chips, ag residues'};
const PW_CORSIA={HEFA:true,'Fischer-Tropsch':true,AtJ:true,DSHC:true,'Co-processing':true,'e-Kerosene/PtL':true,Pyrolysis:false,Gasification:true};
const PW_EURED={HEFA:true,'Fischer-Tropsch':true,AtJ:true,DSHC:true,'Co-processing':false,'e-Kerosene/PtL':true,Pyrolysis:false,Gasification:true};
const PW_GHG={HEFA:65,'Fischer-Tropsch':85,AtJ:70,DSHC:72,'Co-processing':50,'e-Kerosene/PtL':95,Pyrolysis:60,Gasification:80};
const PW_TRL={HEFA:9,'Fischer-Tropsch':7,AtJ:7,DSHC:6,'Co-processing':9,'e-Kerosene/PtL':5,Pyrolysis:5,Gasification:6};
const PW_COST={HEFA:1.8,'Fischer-Tropsch':3.2,AtJ:2.6,DSHC:3.5,'Co-processing':1.3,'e-Kerosene/PtL':5.5,Pyrolysis:2.9,Gasification:3.0};
const PW_CAP_2024={HEFA:4.2,'Fischer-Tropsch':0.3,AtJ:0.15,DSHC:0.02,'Co-processing':0.8,'e-Kerosene/PtL':0.01,Pyrolysis:0.05,Gasification:0.08};
const PW_CAP_2030={HEFA:15,'Fischer-Tropsch':4.5,AtJ:3.0,DSHC:0.8,'Co-processing':3.5,'e-Kerosene/PtL':2.0,Pyrolysis:1.5,Gasification:2.5};
const PW_INV={HEFA:8,'Fischer-Tropsch':18,AtJ:12,DSHC:6,'Co-processing':3,'e-Kerosene/PtL':45,Pyrolysis:8,Gasification:14};

const REGIONS=['North America','Europe','Asia-Pacific','Middle East','Latin America','Africa'];
const REG_SHARE=[0.35,0.30,0.18,0.10,0.05,0.02];
const REG_COLORS=[T.navy,T.sage,T.gold,T.navyL,T.goldL,T.sageL];

const genProducers=(n=60)=>{
  const names=['Neste','World Energy','Montana Renewables','Gevo','LanzaTech','Velocys','SkyNRG','TotalEnergies SAF','HIF Global','Fulcrum BioEnergy','Aemetis','Red Rock Biofuels','SG Preston','Topsoe SAF','Honeywell UOP','Sasol ecoFT','Nordic Electrofuel','Norsk e-Fuel','Synkero','Infinium','Shell SAF','bp Biojet','Repsol SAF','Eni Biojet','Preem Green','Phillips 66 SAF','Marathon SAF','Valero Renewable','CVR Partners','Calumet Specialty','AltAir Fuels','Biojet AS','Sundrop Fuels','GTI Energy','Swedish Biofuels','PBF Energy SAF','Chevron REG','Vertex Energy','Next Renewable','Pertamina Green','Petronas SAF','CEPSA Bio','Axens SAF','Versalis SAF','EcoCeres','Euglena','Cosmo Oil SAF','Idemitsu SAF','SK Energy SAF','GS Caltex SAF','S-Oil SAF','Indian Oil SAF','Bharat Petroleum SAF','Reliance Green','Sinopec SAF','PetroChina SAF','CNPC Bio','QatarEnergy SAF','ADNOC SAF','Aramco SAF'];
  const countries=['US','US','US','US','US','UK','NL','FR','CL','US','US','US','US','DK','US','ZA','NO','NO','NL','US','NL','UK','ES','IT','SE','US','US','US','US','US','US','NO','US','US','SE','US','US','US','CA','ID','MY','ES','FR','IT','HK','JP','JP','JP','KR','KR','KR','IN','IN','IN','CN','CN','CN','QA','AE','SA'];
  const pw=['HEFA','Co-processing','HEFA','AtJ','AtJ','Fischer-Tropsch','HEFA','HEFA','e-Kerosene/PtL','Gasification','HEFA','Gasification','HEFA','Fischer-Tropsch','HEFA','Fischer-Tropsch','e-Kerosene/PtL','e-Kerosene/PtL','e-Kerosene/PtL','e-Kerosene/PtL','HEFA','HEFA','HEFA','HEFA','HEFA','Co-processing','Co-processing','HEFA','Co-processing','HEFA','HEFA','HEFA','Gasification','Gasification','AtJ','Co-processing','HEFA','Pyrolysis','HEFA','HEFA','HEFA','HEFA','Fischer-Tropsch','HEFA','HEFA','DSHC','HEFA','HEFA','HEFA','HEFA','Co-processing','HEFA','HEFA','HEFA','HEFA','Co-processing','HEFA','HEFA','HEFA','HEFA'];
  return names.slice(0,n).map((name,i)=>{
    const s=sr(i*7+3);const s2=sr(i*13+7);const s3=sr(i*19+11);
    const cap=Math.round(50+s*1200);
    const opPct=s2>0.6?1:s2>0.3?0.5+s3*0.4:0;
    return {id:i,name,country:countries[i]||'US',pathway:pw[i]||PATHWAYS[i%8],capacity_kt:cap,operational_pct:opPct,feedstock:PW_FEED[pw[i]||'HEFA'],offtake_pct:Math.round(30+s3*65),expansion:s>0.5,investment_m:Math.round(cap*0.8+s2*500),stage:opPct>=0.9?'Operational':opPct>0?'Construction':'Planning',irr_est:8+s*9};
  });
};

const genQuarters=()=>{
  const q=[];
  for(let y=2020;y<=2025;y++)for(let qi=1;qi<=4;qi++){
    if(y===2025&&qi>4)break;
    const idx=q.length;const s=sr(idx*11+5);
    const base=0.1+idx*0.035+s*0.02;
    const price=2800-idx*25+s*300;
    q.push({label:`Q${qi} ${y}`,year:y,quarter:qi,production_mt:+(base).toFixed(3),price_usd_t:Math.round(price),hefa_price:Math.round(price*0.65+s*100),ft_price:Math.round(price*1.1+s*120),atj_price:Math.round(price*0.9+s*80),ptl_price:Math.round(price*1.8+s*200),jet_price:Math.round(650+s*80)});
  }
  for(let y=2026;y<=2035;y++){
    const idx=q.length;const s=sr(idx*11+5);
    const base=0.8+((y-2025)*0.95)+s*0.3;
    const price=2200-((y-2025)*80)+s*150;
    q.push({label:`${y}`,year:y,quarter:0,production_mt:+(base).toFixed(2),price_usd_t:Math.round(price),hefa_price:Math.round(price*0.6+s*80),ft_price:Math.round(price*0.95+s*100),atj_price:Math.round(price*0.8+s*70),ptl_price:Math.round(price*1.5+s*150),jet_price:Math.round(700+s*60),projected:true});
  }
  return q;
};

const MANDATES=[
  {country:'EU (ReFuelEU)',code:'EU',type:'Blending Obligation',current:2,t2030:6,t2050:70,enforcement:'Fuel supplier obligation',penalty:'EUR 2x price difference',sub_fossil:0,sub_efuel_2030:1.2,sub_efuel_2050:35},
  {country:'United Kingdom',code:'GB',type:'Blending Mandate',current:0,t2030:10,t2050:50,enforcement:'SAF mandate + buy-out',penalty:'GBP buy-out price per litre',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'United States',code:'US',type:'Tax Credit (IRA)',current:0,t2030:3,t2050:100,enforcement:'SAF blenders tax credit $1.25-1.75/gal',penalty:'N/A (incentive-based)',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'France',code:'FR',type:'Blending Mandate',current:1,t2030:5,t2050:50,enforcement:'Fuel supplier obligation via ReFuelEU',penalty:'Tax + EU penalty',sub_fossil:0,sub_efuel_2030:0.5,sub_efuel_2050:0},
  {country:'Germany',code:'DE',type:'GHG Quota',current:0.5,t2030:6,t2050:70,enforcement:'GHG reduction quota for fuel suppliers',penalty:'EUR 470/tCO2 shortfall',sub_fossil:0,sub_efuel_2030:2,sub_efuel_2050:0},
  {country:'Sweden',code:'SE',type:'GHG Reduction',current:1.7,t2030:6,t2050:100,enforcement:'Fuel supplier emission reduction',penalty:'SEK shortfall penalty',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Norway',code:'NO',type:'Blending Mandate',current:0.5,t2030:30,t2050:100,enforcement:'Aviation fuel sales obligation',penalty:'NOK penalty per litre',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Netherlands',code:'NL',type:'Blending Obligation',current:0,t2030:6,t2050:70,enforcement:'Aligned with ReFuelEU',penalty:'EU penalty framework',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Japan',code:'JP',type:'Voluntary Target',current:0,t2030:10,t2050:100,enforcement:'Airline voluntary commitment',penalty:'Reputational / CORSIA',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'South Korea',code:'KR',type:'Blending Mandate',current:0,t2030:5,t2050:40,enforcement:'Planned fuel supplier obligation',penalty:'Under development',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'India',code:'IN',type:'Blending Target',current:0,t2030:1,t2050:5,enforcement:'National biofuel policy',penalty:'Under development',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Singapore',code:'SG',type:'Levy + Target',current:0,t2030:3,t2050:15,enforcement:'SAF levy on departing flights',penalty:'Levy non-compliance fine',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Canada',code:'CA',type:'Clean Fuel Standard',current:0,t2030:2,t2050:10,enforcement:'Clean Fuel Regulation credits',penalty:'CAD credit shortfall',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Brazil',code:'BR',type:'RenovaBio',current:0,t2030:1,t2050:10,enforcement:'CBio credit system',penalty:'CBio compliance penalty',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Australia',code:'AU',type:'Voluntary Framework',current:0,t2030:0,t2050:5,enforcement:'Industry voluntary (no mandate yet)',penalty:'None',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'China',code:'CN',type:'Five-Year Plan Target',current:0,t2030:2,t2050:20,enforcement:'State-directed production targets',penalty:'State planning compliance',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'UAE',code:'AE',type:'Voluntary Target',current:0,t2030:1,t2050:10,enforcement:'National aviation decarbonisation strategy',penalty:'None',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Saudi Arabia',code:'SA',type:'Vision 2030 Target',current:0,t2030:0.5,t2050:5,enforcement:'NEOM green hydrogen / SAF',penalty:'None',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Finland',code:'FI',type:'Blending Obligation',current:0,t2030:6,t2050:70,enforcement:'Aligned with ReFuelEU',penalty:'EU penalty framework',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Spain',code:'ES',type:'Blending Obligation',current:0,t2030:6,t2050:70,enforcement:'Aligned with ReFuelEU',penalty:'EU penalty framework',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Italy',code:'IT',type:'Blending Obligation',current:0,t2030:6,t2050:70,enforcement:'Aligned with ReFuelEU',penalty:'EU penalty framework',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Denmark',code:'DK',type:'Blending Obligation',current:0,t2030:6,t2050:70,enforcement:'Aligned with ReFuelEU + national top-up',penalty:'EU penalty + DKK levy',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Indonesia',code:'ID',type:'Biojet B5 Target',current:0,t2030:5,t2050:20,enforcement:'Palm oil SAF blending pilot',penalty:'Under development',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Malaysia',code:'MY',type:'Voluntary Target',current:0,t2030:1,t2050:8,enforcement:'National aviation fuel roadmap',penalty:'None',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
  {country:'Thailand',code:'TH',type:'Pilot Programme',current:0,t2030:1,t2050:5,enforcement:'BCG economy policy',penalty:'None',sub_fossil:0,sub_efuel_2030:0,sub_efuel_2050:0},
];

const REFUELEU_TIMELINE=[
  {year:2025,milestone:'2% SAF mandate begins (ReFuelEU Aviation enters force)',pct:2},
  {year:2030,milestone:'6% SAF mandate, of which 1.2% synthetic (e-kerosene)',pct:6},
  {year:2032,milestone:'6% SAF maintained, review of synthetic sub-quota',pct:6},
  {year:2035,milestone:'20% SAF mandate, of which 5% synthetic',pct:20},
  {year:2040,milestone:'34% SAF mandate, of which 10% synthetic',pct:34},
  {year:2045,milestone:'42% SAF mandate, of which 15% synthetic',pct:42},
  {year:2050,milestone:'70% SAF mandate, of which 35% synthetic',pct:70},
];

const genAgreements=(n=30)=>{
  const airlines=['United Airlines','Delta Air Lines','American Airlines','Lufthansa Group','Air France-KLM','British Airways','Singapore Airlines','Qantas','ANA Holdings','Japan Airlines','Emirates','Cathay Pacific','SAS Scandinavian','KLM Royal Dutch','Southwest Airlines','JetBlue','Alaska Airlines','Ryanair','easyJet','Finnair','Etihad Airways','Qatar Airways','Korean Air','All Nippon','Virgin Atlantic','Air Canada','LATAM Airlines','IndiGo','China Southern','Cathay Pacific'];
  const producers=['Neste','World Energy','Montana Renewables','Gevo','LanzaTech','SkyNRG','TotalEnergies SAF','Shell SAF','bp Biojet','Fulcrum BioEnergy','Aemetis','Velocys','HIF Global','Infinium','Nordic Electrofuel','Phillips 66 SAF','Preem Green','Honeywell UOP','Repsol SAF','Eni Biojet','Marathon SAF','Chevron REG','Vertex Energy','Next Renewable','Axens SAF','EcoCeres','Euglena','SK Energy SAF','Sinopec SAF','ADNOC SAF'];
  return Array.from({length:n},(_,i)=>{
    const s=sr(i*17+9);const s2=sr(i*23+13);
    const vol=Math.round(20+s*280);const dur=Math.round(3+s2*12);
    const start=2023+Math.round(s*3);
    return {id:i,airline:airlines[i],producer:producers[i],volume_kt_yr:vol,duration_yr:dur,start_year:start,end_year:start+dur,price_structure:s>0.6?'Fixed premium':'Index-linked',price_est:Math.round(1800+s2*1200),status:s2>0.3?'Active':'Signed'};
  });
};

const Card=({children,style})=><div style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:20,...style}}>{children}</div>;
const KPI=({label,value,sub,color})=><Card style={{textAlign:'center',minWidth:130,flex:'1 1 0'}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.font,marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</Card>;
const Badge=({children,color})=><span style={{display:'inline-block',padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:600,background:color||T.sage,color:'#fff',marginLeft:4}}>{children}</span>;

const ToolTipC=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:10,fontSize:12,fontFamily:T.font}}>
    <div style={{fontWeight:600,marginBottom:4,color:T.navy}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||T.textSec}}>{p.name}: {typeof p.value==='number'?p.value.toLocaleString():p.value}</div>)}
  </div>;
};

export default function SustainableAviationFuelPage(){
  const [tab,setTab]=useState(0);
  const [selProducer,setSelProducer]=useState(null);
  const [selPathway,setSelPathway]=useState(null);
  const [selMandate,setSelMandate]=useState(null);
  const [selProject,setSelProject]=useState(null);
  const [calcAirline,setCalcAirline]=useState('');
  const [calcFuel,setCalcFuel]=useState(100000);
  const [pricePremium,setPricePremium]=useState(1500);
  const [carbonPrice,setCarbonPrice]=useState(80);
  const [sortCol,setSortCol]=useState('capacity_kt');
  const [sortDir,setSortDir]=useState(-1);
  const [mandateSort,setMandateSort]=useState('t2030');
  const [mandateSortDir,setMandateSortDir]=useState(-1);

  const producers=useMemo(()=>genProducers(60),[]);
  const quarters=useMemo(()=>genQuarters(),[]);
  const agreements=useMemo(()=>genAgreements(30),[]);

  const totalProd=useMemo(()=>producers.reduce((a,p)=>a+p.capacity_kt*p.operational_pct,0),[producers]);
  const totalCap=useMemo(()=>producers.reduce((a,p)=>a+p.capacity_kt,0),[producers]);
  const totalInv=useMemo(()=>producers.reduce((a,p)=>a+p.investment_m,0),[producers]);
  const operational=useMemo(()=>producers.filter(p=>p.stage==='Operational').length,[producers]);

  const sortedProducers=useMemo(()=>{
    return [...producers].sort((a,b)=>(a[sortCol]>b[sortCol]?1:-1)*sortDir);
  },[producers,sortCol,sortDir]);

  const sortedMandates=useMemo(()=>{
    return [...MANDATES].sort((a,b)=>(a[mandateSort]>b[mandateSort]?1:-1)*mandateSortDir);
  },[mandateSort,mandateSortDir]);

  const regionDonut=useMemo(()=>REGIONS.map((r,i)=>({name:r,value:Math.round(REG_SHARE[i]*totalProd)})),[totalProd]);

  const radarData=useMemo(()=>{
    return ['Cost Competitiveness','Scalability','Feedstock Availability','GHG Reduction','Technology Readiness','Certification'].map((dim,di)=>{
      const obj={dimension:dim};
      PATHWAYS.forEach((pw,pi)=>{
        const s=sr(di*8+pi*3+1);
        if(di===0)obj[pw]=Math.round(100-PW_COST[pw]*15+s*5);
        else if(di===1)obj[pw]=Math.round(PW_CAP_2030[pw]/15*70+s*10);
        else if(di===2)obj[pw]=Math.round(40+s*55);
        else if(di===3)obj[pw]=PW_GHG[pw];
        else if(di===4)obj[pw]=PW_TRL[pw]*10;
        else obj[pw]=PW_CORSIA[pw]?80+Math.round(s*20):30+Math.round(s*20);
      });
      return obj;
    });
  },[]);

  const costProjections=useMemo(()=>{
    return Array.from({length:12},(_,i)=>{
      const yr=2024+i;const obj={year:yr};
      PATHWAYS.forEach((pw,pi)=>{
        const base=PW_COST[pw];const decline=0.04+sr(pi*3+i)*0.02;
        obj[pw]=+(base*Math.pow(1-decline,i)).toFixed(2);
      });
      obj['Jet A-1']=+(0.65+sr(i*5)*0.1).toFixed(2);
      return obj;
    });
  },[]);

  const investmentFlow=useMemo(()=>{
    return Array.from({length:10},(_,i)=>{
      const yr=2019+i;const obj={year:yr};let total=0;
      PATHWAYS.forEach((pw,pi)=>{
        const base=PW_INV[pw]/10;const growth=1+i*0.3+sr(i*8+pi)*0.5;
        const val=+(base*growth).toFixed(1);
        obj[pw]=val;total+=val;
      });
      obj.total=+total.toFixed(1);
      return obj;
    });
  },[]);

  const handleSort=useCallback((col)=>{
    if(sortCol===col)setSortDir(d=>d*-1);
    else{setSortCol(col);setSortDir(-1);}
  },[sortCol]);

  const handleMandateSort=useCallback((col)=>{
    if(mandateSort===col)setMandateSortDir(d=>d*-1);
    else{setMandateSort(col);setMandateSortDir(-1);}
  },[mandateSort]);

  const exportCSV=useCallback(()=>{
    const hdr=['Name','Country','Pathway','Capacity (kt)','Stage','Investment ($M)','IRR Est (%)','Offtake (%)'];
    const rows=producers.map(p=>[p.name,p.country,p.pathway,p.capacity_kt,p.stage,p.investment_m,p.irr_est.toFixed(1),p.offtake_pct].join(','));
    const csv=[hdr.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='saf_investment_pipeline.csv';a.click();URL.revokeObjectURL(url);
  },[producers]);

  const calcMandateCost=useCallback(()=>{
    if(!calcFuel)return[];
    return MANDATES.filter(m=>m.t2030>0).slice(0,10).map(m=>{
      const safNeeded=calcFuel*(m.t2030/100);const premCost=safNeeded*pricePremium;const carbonSaved=safNeeded*0.003*80;
      return {country:m.country,mandate_pct:m.t2030,saf_needed_t:Math.round(safNeeded),premium_cost:Math.round(premCost),carbon_offset_value:Math.round(carbonSaved*carbonPrice/80),net_cost:Math.round(premCost-carbonSaved*carbonPrice/80)};
    });
  },[calcFuel,pricePremium,carbonPrice]);

  const irrSensitivity=useMemo(()=>{
    const premiums=[800,1000,1200,1500,1800,2000,2500];
    const cprices=[40,60,80,100,120,150];
    return premiums.map(prem=>({premium:prem,...Object.fromEntries(cprices.map(cp=>[`cp_${cp}`,(5+prem/500+cp/80+sr(prem+cp)*2).toFixed(1)]))}));
  },[]);

  const PW_COLORS=[T.navy,T.sage,T.gold,T.navyL,T.goldL,T.sageL,T.amber,T.red];

  const tabStyle=(i)=>({padding:'10px 20px',cursor:'pointer',fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',border:'none',fontFamily:T.font,fontSize:13,transition:'all 0.15s'});

  // --- RENDER ---
  return <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
    <div style={{maxWidth:1400,margin:'0 auto'}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Sustainable Aviation Fuel (SAF) Market Intelligence</h1>
        <p style={{color:T.textSec,margin:'6px 0 0',fontSize:14}}>SAF production, certification, pricing, investment, and mandate tracking -- EP-AN4</p>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,marginBottom:24}}>
        {TABS.map((t,i)=><button key={i} style={tabStyle(i)} onClick={()=>{setTab(i);setSelProducer(null);setSelPathway(null);setSelMandate(null);setSelProject(null);}}>{t}</button>)}
      </div>

      {/* ========== TAB 0: SAF Market Overview ========== */}
      {tab===0&&<div>
        {/* 8 KPIs */}
        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:24}}>
          <KPI label="Global Production" value={fmt(totalProd*1000,1)+' kt'} sub="2025 estimate" color={T.sage}/>
          <KPI label="% of Jet Fuel" value={pct(totalProd/300000)} sub="of ~300Mt total" color={T.navy}/>
          <KPI label="Avg Price Premium" value={'$'+Math.round(quarters[quarters.length-6]?.price_usd_t||2000)+'/t'} sub="over Jet A-1" color={T.gold}/>
          <KPI label="Mandate Coverage" value={MANDATES.filter(m=>m.t2030>0).length+' countries'} sub="with 2030 targets" color={T.navyL}/>
          <KPI label="Announced Capacity" value={fmt(totalCap*1000,0)+' kt'} sub="all stages" color={T.sage}/>
          <KPI label="Total Investment" value={'$'+fmt(totalInv*1e6,1)} sub="committed + planned" color={T.gold}/>
          <KPI label="Pathway Diversity" value={PATHWAYS.length+' certified'} sub="CORSIA-eligible" color={T.navy}/>
          <KPI label="Operational Projects" value={operational+'/'+producers.length} sub="facilities running" color={T.green}/>
        </div>

        {/* Production Growth + Price Trend */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>SAF Production Growth (Mt) -- 2020-2035 (projected)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={quarters.filter(q=>q.quarter===0||q.year<=2025)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="label" tick={{fontSize:10,fill:T.textSec}} interval={2}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,'auto']}/>
                <Tooltip content={<ToolTipC/>}/>
                <Area type="monotone" dataKey="production_mt" stroke={T.sage} fill={T.sage} fillOpacity={0.3} name="Production (Mt)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>SAF Price Trend by Pathway ($/t)</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={quarters.filter(q=>q.year>=2022)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="label" tick={{fontSize:10,fill:T.textSec}} interval={3}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip content={<ToolTipC/>}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Line type="monotone" dataKey="hefa_price" stroke={T.navy} name="HEFA" dot={false} strokeWidth={2}/>
                <Line type="monotone" dataKey="ft_price" stroke={T.sage} name="Fischer-Tropsch" dot={false}/>
                <Line type="monotone" dataKey="atj_price" stroke={T.gold} name="AtJ" dot={false}/>
                <Line type="monotone" dataKey="ptl_price" stroke={T.red} name="e-Kerosene/PtL" dot={false}/>
                <Line type="monotone" dataKey="jet_price" stroke={T.textMut} name="Jet A-1" dot={false} strokeDasharray="5 5"/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Regional Share + Demand/Supply Gap */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>Regional Production Share</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={regionDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:T.textMut}} style={{fontSize:10}}>
                  {regionDonut.map((_,i)=><Cell key={i} fill={REG_COLORS[i]}/>)}
                </Pie>
                <Tooltip content={<ToolTipC/>}/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>Demand vs Supply Gap Analysis</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[2025,2027,2030,2035].map(y=>{const dem=y===2025?2:y===2027?8:y===2030?30:80;const sup=y===2025?0.6:y===2027?3:y===2030?15:45;return {year:y,demand:dem,supply:sup,gap:dem-sup};})}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Mt',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                <Tooltip content={<ToolTipC/>}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="demand" fill={T.navy} name="Mandate Demand (Mt)" radius={[4,4,0,0]}/>
                <Bar dataKey="supply" fill={T.sage} name="Projected Supply (Mt)" radius={[4,4,0,0]}/>
                <Bar dataKey="gap" fill={T.red} name="Supply Gap (Mt)" radius={[4,4,0,0]} fillOpacity={0.6}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Producers Table */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>Top SAF Producers (click row for details)</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {[{k:'name',l:'Producer'},{k:'country',l:'Country'},{k:'pathway',l:'Pathway'},{k:'capacity_kt',l:'Capacity (kt)'},{k:'stage',l:'Stage'},{k:'offtake_pct',l:'Offtake %'},{k:'investment_m',l:'Inv ($M)'}].map(c=>
                  <th key={c.k} onClick={()=>handleSort(c.k)} style={{padding:'8px 10px',textAlign:'left',cursor:'pointer',color:T.textSec,fontWeight:600,userSelect:'none',whiteSpace:'nowrap'}}>{c.l}{sortCol===c.k?(sortDir>0?' ^':' v'):''}</th>)}
              </tr></thead>
              <tbody>{sortedProducers.slice(0,15).map(p=><tr key={p.id} onClick={()=>setSelProducer(selProducer?.id===p.id?null:p)} style={{borderBottom:`1px solid ${T.borderL}`,cursor:'pointer',background:selProducer?.id===p.id?T.surfaceH:'transparent',transition:'background 0.1s'}}>
                <td style={{padding:'8px 10px',fontWeight:600}}>{p.name}</td>
                <td style={{padding:'8px 10px'}}>{p.country}</td>
                <td style={{padding:'8px 10px'}}><Badge color={PATHWAYS.indexOf(p.pathway)%2===0?T.sage:T.navyL}>{p.pathway}</Badge></td>
                <td style={{padding:'8px 10px',fontFamily:T.mono}}>{p.capacity_kt.toLocaleString()}</td>
                <td style={{padding:'8px 10px'}}><Badge color={p.stage==='Operational'?T.green:p.stage==='Construction'?T.amber:T.textMut}>{p.stage}</Badge></td>
                <td style={{padding:'8px 10px',fontFamily:T.mono}}>{p.offtake_pct}%</td>
                <td style={{padding:'8px 10px',fontFamily:T.mono}}>${p.investment_m.toLocaleString()}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>

        {/* Producer Detail Panel */}
        {selProducer&&<Card style={{marginBottom:24,borderLeft:`4px solid ${T.gold}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{margin:0,fontSize:18,color:T.navy}}>{selProducer.name}</h3>
            <button onClick={()=>setSelProducer(null)} style={{background:'none',border:'none',cursor:'pointer',color:T.textMut,fontSize:18}}>x</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
            <div><div style={{fontSize:11,color:T.textMut}}>Country</div><div style={{fontWeight:600}}>{selProducer.country}</div></div>
            <div><div style={{fontSize:11,color:T.textMut}}>Pathway</div><div style={{fontWeight:600}}>{selProducer.pathway}</div></div>
            <div><div style={{fontSize:11,color:T.textMut}}>Capacity</div><div style={{fontWeight:600,fontFamily:T.mono}}>{selProducer.capacity_kt.toLocaleString()} kt/yr</div></div>
            <div><div style={{fontSize:11,color:T.textMut}}>Stage</div><Badge color={selProducer.stage==='Operational'?T.green:T.amber}>{selProducer.stage}</Badge></div>
            <div><div style={{fontSize:11,color:T.textMut}}>Feedstock</div><div style={{fontWeight:500,fontSize:12}}>{selProducer.feedstock}</div></div>
            <div><div style={{fontSize:11,color:T.textMut}}>Offtake Secured</div><div style={{fontWeight:600,fontFamily:T.mono}}>{selProducer.offtake_pct}%</div></div>
            <div><div style={{fontSize:11,color:T.textMut}}>Investment</div><div style={{fontWeight:600,fontFamily:T.mono}}>${selProducer.investment_m.toLocaleString()}M</div></div>
            <div><div style={{fontSize:11,color:T.textMut}}>IRR Estimate</div><div style={{fontWeight:600,fontFamily:T.mono,color:selProducer.irr_est>12?T.green:T.amber}}>{selProducer.irr_est.toFixed(1)}%</div></div>
          </div>
          <div style={{marginTop:16,padding:12,background:T.surfaceH,borderRadius:8}}>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Expansion Plans</div>
            <div style={{fontSize:12,color:T.textSec}}>{selProducer.expansion?`Phase 2 expansion planned: +${Math.round(selProducer.capacity_kt*0.6)} kt/yr additional capacity. Feedstock diversification into ${selProducer.pathway==='HEFA'?'camelina and algal oils':'next-gen waste streams'}. Target COD: ${2026+Math.round(sr(selProducer.id*3)*3)}.`:'No near-term expansion announced. Focused on optimising current operations and securing additional offtake agreements.'}</div>
          </div>
          <div style={{marginTop:12,padding:12,background:T.surfaceH,borderRadius:8}}>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Offtake Agreements</div>
            {agreements.filter(a=>a.producer===selProducer.name||sr(selProducer.id+a.id)>0.85).slice(0,3).map((a,i)=>
              <div key={i} style={{fontSize:12,color:T.textSec,marginBottom:4}}>-- {a.airline}: {a.volume_kt_yr} kt/yr, {a.duration_yr}-year deal ({a.start_year}-{a.end_year}), {a.price_structure}</div>
            )}
          </div>
        </Card>}
      </div>}

      {/* ========== TAB 1: Pathway Comparison ========== */}
      {tab===1&&<div>
        {/* Radar Chart */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>8 SAF Pathways -- Multi-Dimensional Comparison</div>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData} outerRadius={140}>
              <PolarGrid stroke={T.borderL}/>
              <PolarAngleAxis dataKey="dimension" tick={{fontSize:11,fill:T.textSec}}/>
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/>
              {PATHWAYS.map((pw,i)=><Radar key={pw} name={pw} dataKey={pw} stroke={PW_COLORS[i]} fill={PW_COLORS[i]} fillOpacity={selPathway===pw?0.35:0.05} strokeWidth={selPathway===pw?3:1} style={{cursor:'pointer'}}/>)}
              <Legend wrapperStyle={{fontSize:11}} onClick={(e)=>setSelPathway(selPathway===e.value?null:e.value)}/>
              <Tooltip content={<ToolTipC/>}/>
            </RadarChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:T.textMut,textAlign:'center',marginTop:4}}>Click legend to highlight a pathway</div>
        </Card>

        {/* Pathway Cards Grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
          {PATHWAYS.map((pw,i)=><Card key={pw} style={{cursor:'pointer',border:selPathway===pw?`2px solid ${T.gold}`:`1px solid ${T.border}`,transition:'border 0.15s'}} onClick={()=>setSelPathway(selPathway===pw?null:pw)}>
            <div style={{fontWeight:700,fontSize:13,color:T.navy,marginBottom:6}}>{pw}</div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:8,minHeight:48}}>{PW_DESC[pw].slice(0,120)}...</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:11}}>
              <div><span style={{color:T.textMut}}>Cost:</span> <span style={{fontFamily:T.mono,fontWeight:600}}>${PW_COST[pw]}/L</span></div>
              <div><span style={{color:T.textMut}}>TRL:</span> <span style={{fontFamily:T.mono,fontWeight:600}}>{PW_TRL[pw]}/9</span></div>
              <div><span style={{color:T.textMut}}>GHG:</span> <span style={{fontFamily:T.mono,fontWeight:600,color:T.green}}>-{PW_GHG[pw]}%</span></div>
              <div><span style={{color:T.textMut}}>2024:</span> <span style={{fontFamily:T.mono}}>{PW_CAP_2024[pw]}Mt</span></div>
              <div><span style={{color:T.textMut}}>2030:</span> <span style={{fontFamily:T.mono}}>{PW_CAP_2030[pw]}Mt</span></div>
              <div><span style={{color:T.textMut}}>Inv:</span> <span style={{fontFamily:T.mono}}>${PW_INV[pw]}B</span></div>
            </div>
            <div style={{marginTop:6,display:'flex',gap:4}}>
              {PW_CORSIA[pw]&&<Badge color={T.sage}>CORSIA</Badge>}
              {PW_EURED[pw]&&<Badge color={T.navyL}>EU RED III</Badge>}
            </div>
          </Card>)}
        </div>

        {/* Pathway Deep-Dive */}
        {selPathway&&<Card style={{marginBottom:24,borderLeft:`4px solid ${T.gold}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{margin:0,fontSize:18,color:T.navy}}>{selPathway} -- Technical Deep-Dive</h3>
            <button onClick={()=>setSelPathway(null)} style={{background:'none',border:'none',cursor:'pointer',color:T.textMut,fontSize:18}}>x</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Description</div>
              <p style={{fontSize:12,color:T.textSec,margin:0,lineHeight:1.6}}>{PW_DESC[selPathway]}</p>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginTop:12,marginBottom:6}}>Primary Feedstock</div>
              <p style={{fontSize:12,color:T.textSec,margin:0}}>{PW_FEED[selPathway]}</p>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginTop:12,marginBottom:6}}>Certification Status</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <Badge color={PW_CORSIA[selPathway]?T.green:T.red}>{PW_CORSIA[selPathway]?'CORSIA Eligible':'CORSIA Pending'}</Badge>
                <Badge color={PW_EURED[selPathway]?T.green:T.red}>{PW_EURED[selPathway]?'EU RED III Compliant':'EU RED III N/A'}</Badge>
                <Badge color={T.navyL}>ASTM D7566</Badge>
              </div>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginTop:12,marginBottom:6}}>Process Description</div>
              <p style={{fontSize:12,color:T.textSec,margin:0,lineHeight:1.6}}>
                {selPathway==='HEFA'&&'Feedstock (fats/oils) undergoes hydrotreating with hydrogen to remove oxygen, followed by isomerisation and distillation. Conversion efficiency: ~70-80%. Co-products: renewable diesel, naphtha, propane.'}
                {selPathway==='Fischer-Tropsch'&&'Biomass gasification produces syngas (CO+H2), cleaned and conditioned, then passed over FT catalyst to produce long-chain hydrocarbons. Hydrocracking and distillation yield jet fuel. Efficiency: ~40-50%. Co-products: renewable diesel, waxes.'}
                {selPathway==='AtJ'&&'Ethanol/isobutanol dehydrated to olefins, then oligomerised to jet-range hydrocarbons, followed by hydrogenation. Efficiency: ~55-65%. Co-products: renewable gasoline.'}
                {selPathway==='DSHC'&&'Engineered microorganisms ferment sugars directly to farnesene (C15 hydrocarbon), which is hydrogenated to farnesane. Efficiency: ~30-40%. Co-products: specialty chemicals.'}
                {selPathway==='Co-processing'&&'Bio-feedstock (5-10% blend) processed alongside fossil crude in existing refinery hydrotreater. Lowest capital requirement. Efficiency: ~85%. Limited to ~5% SAF blend due to refinery constraints.'}
                {selPathway==='e-Kerosene/PtL'&&'Green hydrogen from electrolysis combined with CO2 (DAC or point-source) via reverse water-gas shift + FT synthesis or methanol pathway. Efficiency: ~35-45%. Co-products: e-diesel, e-naphtha. Requires abundant cheap renewable electricity.'}
                {selPathway==='Pyrolysis'&&'Thermal decomposition at 400-600C in absence of oxygen produces bio-oil, upgraded via catalytic hydrotreatment to jet fuel. Efficiency: ~35-50%. Co-products: biochar, syngas.'}
                {selPathway==='Gasification'&&'Waste/biomass gasified at 800-1200C to syngas, cleaned and conditioned, then converted via FT or methanol-to-jet. Efficiency: ~40-50%. Co-products: renewable diesel, electricity.'}
              </p>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Key Metrics</div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <tbody>
                  {[['Production Cost',`$${PW_COST[selPathway]}/litre`],['GHG Reduction',`${PW_GHG[selPathway]}% vs fossil jet`],['TRL Level',`${PW_TRL[selPathway]}/9`],['2024 Production',`${PW_CAP_2024[selPathway]} Mt`],['2030 Projected Capacity',`${PW_CAP_2030[selPathway]} Mt`],['Investment Required',`$${PW_INV[selPathway]}B by 2030`],['CORSIA Eligible',PW_CORSIA[selPathway]?'Yes':'Pending'],['EU RED III',PW_EURED[selPathway]?'Compliant':'Not yet']].map(([k,v],ri)=>
                    <tr key={ri} style={{borderBottom:`1px solid ${T.borderL}`}}>
                      <td style={{padding:'6px 8px',color:T.textMut}}>{k}</td>
                      <td style={{padding:'6px 8px',fontWeight:600,fontFamily:T.mono}}>{v}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginTop:16,marginBottom:6}}>Feedstock Competition Risk</div>
              <p style={{fontSize:12,color:T.textSec,margin:0,lineHeight:1.6}}>
                {selPathway==='HEFA'?'HIGH: Used cooking oil supply is constrained (~10Mt global). Growing competition from renewable diesel (HVO) sector. Fraud risk in UCO supply chains (virgin palm oil disguised as waste). Need to diversify to purpose-grown oilseeds (camelina, jatropha) and algae.':
                selPathway==='e-Kerosene/PtL'?'LOW: Green hydrogen and CO2 are theoretically unlimited but currently expensive. Key constraint is renewable electricity availability and electrolyser capacity scale-up.':
                'MODERATE: Feedstock availability varies by region. Competition with other biofuel/biochemical uses. Long-term supply contracts recommended.'}
              </p>
            </div>
          </div>
        </Card>}

        {/* Cost Projection Lines */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>Pathway Cost Projections 2024-2035 ($/litre)</div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={costProjections}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,6]} label={{value:'$/litre',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
              <Tooltip content={<ToolTipC/>}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              {PATHWAYS.map((pw,i)=><Line key={pw} type="monotone" dataKey={pw} stroke={PW_COLORS[i]} name={pw} dot={false} strokeWidth={selPathway===pw?3:1}/>)}
              <Line type="monotone" dataKey="Jet A-1" stroke={T.textMut} name="Jet A-1 (fossil)" dot={false} strokeDasharray="5 5" strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>}

      {/* ========== TAB 2: Mandate Tracker ========== */}
      {tab===2&&<div>
        {/* Mandate comparison bar chart */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>SAF Mandate Comparison -- 2030 Targets (%)</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={MANDATES.filter(m=>m.t2030>0).sort((a,b)=>b.t2030-a.t2030)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} domain={[0,35]}/>
              <YAxis type="category" dataKey="country" tick={{fontSize:10,fill:T.textSec}} width={130}/>
              <Tooltip content={<ToolTipC/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="t2030" fill={T.navy} name="2030 Target %" radius={[0,4,4,0]}/>
              <Bar dataKey="current" fill={T.sage} name="Current %" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Mandate Table */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>25 Countries -- SAF Mandate Details (click for detail)</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {[{k:'country',l:'Country'},{k:'type',l:'Mandate Type'},{k:'current',l:'Current %'},{k:'t2030',l:'2030 %'},{k:'t2050',l:'2050 %'},{k:'enforcement',l:'Enforcement'},{k:'penalty',l:'Penalty'}].map(c=>
                  <th key={c.k} onClick={()=>handleMandateSort(c.k)} style={{padding:'8px 10px',textAlign:'left',cursor:'pointer',color:T.textSec,fontWeight:600,userSelect:'none',whiteSpace:'nowrap',fontSize:11}}>{c.l}{mandateSort===c.k?(mandateSortDir>0?' ^':' v'):''}</th>)}
              </tr></thead>
              <tbody>{sortedMandates.map((m,i)=><tr key={i} onClick={()=>setSelMandate(selMandate?.country===m.country?null:m)} style={{borderBottom:`1px solid ${T.borderL}`,cursor:'pointer',background:selMandate?.country===m.country?T.surfaceH:'transparent'}}>
                <td style={{padding:'8px 10px',fontWeight:600}}>{m.country}</td>
                <td style={{padding:'8px 10px'}}><Badge color={m.type.includes('Blending')?T.sage:m.type.includes('Tax')?T.gold:T.navyL}>{m.type}</Badge></td>
                <td style={{padding:'8px 10px',fontFamily:T.mono}}>{m.current}%</td>
                <td style={{padding:'8px 10px',fontFamily:T.mono,fontWeight:700,color:m.t2030>=6?T.green:m.t2030>0?T.amber:T.textMut}}>{m.t2030}%</td>
                <td style={{padding:'8px 10px',fontFamily:T.mono,color:m.t2050>=50?T.green:T.textSec}}>{m.t2050}%</td>
                <td style={{padding:'8px 10px',fontSize:11,color:T.textSec}}>{m.enforcement.slice(0,40)}{m.enforcement.length>40?'...':''}</td>
                <td style={{padding:'8px 10px',fontSize:11,color:T.textSec}}>{m.penalty.slice(0,35)}{m.penalty.length>35?'...':''}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>

        {selMandate&&<Card style={{marginBottom:24,borderLeft:`4px solid ${T.gold}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{margin:0,fontSize:16,color:T.navy}}>{selMandate.country} -- Mandate Detail</h3>
            <button onClick={()=>setSelMandate(null)} style={{background:'none',border:'none',cursor:'pointer',color:T.textMut,fontSize:18}}>x</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,fontSize:12}}>
            <div><div style={{color:T.textMut}}>Type</div><div style={{fontWeight:600}}>{selMandate.type}</div></div>
            <div><div style={{color:T.textMut}}>Current Mandate</div><div style={{fontWeight:600,fontFamily:T.mono}}>{selMandate.current}%</div></div>
            <div><div style={{color:T.textMut}}>2030 Target</div><div style={{fontWeight:700,fontFamily:T.mono,color:T.green}}>{selMandate.t2030}%</div></div>
            <div><div style={{color:T.textMut}}>2050 Target</div><div style={{fontWeight:700,fontFamily:T.mono,color:T.navy}}>{selMandate.t2050}%</div></div>
          </div>
          <div style={{marginTop:12}}><span style={{fontSize:12,color:T.textMut}}>Enforcement: </span><span style={{fontSize:12}}>{selMandate.enforcement}</span></div>
          <div style={{marginTop:6}}><span style={{fontSize:12,color:T.textMut}}>Penalty: </span><span style={{fontSize:12}}>{selMandate.penalty}</span></div>
        </Card>}

        {/* ReFuelEU Timeline */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:16,color:T.navy}}>ReFuelEU Aviation -- Mandate Timeline (2025-2050)</div>
          <div style={{display:'flex',gap:0,alignItems:'end',justifyContent:'center',height:200,position:'relative',paddingBottom:40}}>
            {REFUELEU_TIMELINE.map((m,i)=>{
              const h=m.pct/70*160;
              return <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1,position:'relative'}}>
                <div style={{fontSize:10,fontWeight:700,color:T.navy,marginBottom:4}}>{m.pct}%</div>
                <div style={{width:40,height:h,background:`linear-gradient(180deg, ${T.gold} 0%, ${T.sage} 100%)`,borderRadius:'4px 4px 0 0',transition:'height 0.3s'}}/>
                <div style={{fontSize:10,fontWeight:600,color:T.textSec,marginTop:6}}>{m.year}</div>
                <div style={{fontSize:9,color:T.textMut,textAlign:'center',marginTop:2,maxWidth:100,lineHeight:1.3}}>{m.milestone.slice(0,50)}{m.milestone.length>50?'...':''}</div>
              </div>;
            })}
          </div>
        </Card>

        {/* Compliance Cost Calculator */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:16,color:T.navy}}>Compliance Cost Calculator</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16}}>
            <div>
              <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>Airline / Fuel Uplift</label>
              <input value={calcAirline} onChange={e=>setCalcAirline(e.target.value)} placeholder="Airline name" style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}/>
            </div>
            <div>
              <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>Annual Fuel (tonnes): {calcFuel.toLocaleString()}</label>
              <input type="range" min={10000} max={5000000} step={10000} value={calcFuel} onChange={e=>setCalcFuel(+e.target.value)} style={{width:'100%'}}/>
            </div>
            <div>
              <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>SAF Premium ($/t): ${pricePremium}</label>
              <input type="range" min={500} max={4000} step={100} value={pricePremium} onChange={e=>setPricePremium(+e.target.value)} style={{width:'100%'}}/>
            </div>
          </div>
          {calcFuel>0&&<div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{padding:'6px 10px',textAlign:'left',color:T.textSec}}>Jurisdiction</th>
                <th style={{padding:'6px 10px',textAlign:'right',color:T.textSec}}>2030 Mandate</th>
                <th style={{padding:'6px 10px',textAlign:'right',color:T.textSec}}>SAF Needed (t)</th>
                <th style={{padding:'6px 10px',textAlign:'right',color:T.textSec}}>Premium Cost ($)</th>
                <th style={{padding:'6px 10px',textAlign:'right',color:T.textSec}}>Carbon Value ($)</th>
                <th style={{padding:'6px 10px',textAlign:'right',color:T.textSec}}>Net Cost ($)</th>
              </tr></thead>
              <tbody>{calcMandateCost().map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'6px 10px',fontWeight:600}}>{r.country}</td>
                <td style={{padding:'6px 10px',textAlign:'right',fontFamily:T.mono}}>{r.mandate_pct}%</td>
                <td style={{padding:'6px 10px',textAlign:'right',fontFamily:T.mono}}>{r.saf_needed_t.toLocaleString()}</td>
                <td style={{padding:'6px 10px',textAlign:'right',fontFamily:T.mono,color:T.red}}>${r.premium_cost.toLocaleString()}</td>
                <td style={{padding:'6px 10px',textAlign:'right',fontFamily:T.mono,color:T.green}}>${r.carbon_offset_value.toLocaleString()}</td>
                <td style={{padding:'6px 10px',textAlign:'right',fontFamily:T.mono,fontWeight:700}}>${r.net_cost.toLocaleString()}</td>
              </tr>)}</tbody>
            </table>
          </div>}
          <div style={{marginTop:12,fontSize:11,color:T.textMut}}>Note: Costs are indicative estimates based on 2030 mandate levels. Actual costs depend on SAF availability, market dynamics, and regulatory evolution.</div>
        </Card>

        {/* Penalty Risk Assessment */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>Penalty Risk Assessment</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {MANDATES.filter(m=>m.penalty!=='None'&&m.penalty!=='N/A (incentive-based)').slice(0,9).map((m,i)=>{
              const risk=m.t2030>=6?'High':m.t2030>=2?'Medium':'Low';
              return <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${risk==='High'?T.red:risk==='Medium'?T.amber:T.green}`}}>
                <div style={{fontWeight:600,fontSize:12,color:T.navy}}>{m.country}</div>
                <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{m.penalty}</div>
                <Badge color={risk==='High'?T.red:risk==='Medium'?T.amber:T.green}>{risk} Risk</Badge>
              </div>;
            })}
          </div>
        </Card>
      </div>}

      {/* ========== TAB 3: Investment & Offtakes ========== */}
      {tab===3&&<div>
        {/* Investment Flow Area Chart */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>Annual SAF Investment by Pathway ($B)</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={investmentFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'$B',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
              <Tooltip content={<ToolTipC/>}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              {PATHWAYS.map((pw,i)=><Area key={pw} type="monotone" dataKey={pw} stackId="1" stroke={PW_COLORS[i]} fill={PW_COLORS[i]} fillOpacity={0.7} name={pw}/>)}
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Offtake Coverage + KPIs */}
        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:24}}>
          <KPI label="Total Projects" value={producers.length} sub="across 8 pathways" color={T.navy}/>
          <KPI label="Operational" value={producers.filter(p=>p.stage==='Operational').length} color={T.green}/>
          <KPI label="Construction" value={producers.filter(p=>p.stage==='Construction').length} color={T.amber}/>
          <KPI label="Planning" value={producers.filter(p=>p.stage==='Planning').length} color={T.textMut}/>
          <KPI label="Total Committed" value={'$'+fmt(totalInv*1e6,1)} color={T.gold}/>
          <KPI label="Avg Offtake" value={Math.round(producers.reduce((a,p)=>a+p.offtake_pct,0)/producers.length)+'%'} sub="secured" color={T.sage}/>
          <KPI label="Agreements" value={agreements.length} sub="airline deals" color={T.navyL}/>
          <KPI label="Avg IRR" value={(producers.reduce((a,p)=>a+p.irr_est,0)/producers.length).toFixed(1)+'%'} color={T.gold}/>
        </div>

        {/* Project Pipeline */}
        <Card style={{marginBottom:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:14,color:T.navy}}>SAF Investment Pipeline -- 60 Projects (click for detail)</div>
            <button onClick={exportCSV} style={{padding:'6px 14px',background:T.navy,color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontFamily:T.font}}>Export CSV</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,maxHeight:500,overflowY:'auto'}}>
            {producers.map(p=><div key={p.id} onClick={()=>setSelProject(selProject?.id===p.id?null:p)} style={{padding:14,borderRadius:8,border:selProject?.id===p.id?`2px solid ${T.gold}`:`1px solid ${T.border}`,cursor:'pointer',background:selProject?.id===p.id?T.surfaceH:T.surface,transition:'all 0.15s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontWeight:700,fontSize:13,color:T.navy}}>{p.name}</span>
                <Badge color={p.stage==='Operational'?T.green:p.stage==='Construction'?T.amber:T.textMut}>{p.stage}</Badge>
              </div>
              <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>{p.country} -- {p.pathway}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:11}}>
                <div><span style={{color:T.textMut}}>Cap:</span> <span style={{fontFamily:T.mono}}>{p.capacity_kt}kt</span></div>
                <div><span style={{color:T.textMut}}>Inv:</span> <span style={{fontFamily:T.mono}}>${p.investment_m}M</span></div>
                <div><span style={{color:T.textMut}}>IRR:</span> <span style={{fontFamily:T.mono,color:p.irr_est>12?T.green:T.amber}}>{p.irr_est.toFixed(1)}%</span></div>
                <div><span style={{color:T.textMut}}>Offtake:</span> <span style={{fontFamily:T.mono}}>{p.offtake_pct}%</span></div>
              </div>
              {/* Offtake bar */}
              <div style={{marginTop:6,height:4,background:T.borderL,borderRadius:2}}>
                <div style={{height:4,background:p.offtake_pct>70?T.green:p.offtake_pct>40?T.gold:T.red,borderRadius:2,width:`${p.offtake_pct}%`,transition:'width 0.3s'}}/>
              </div>
            </div>)}
          </div>
        </Card>

        {/* Project Detail */}
        {selProject&&<Card style={{marginBottom:24,borderLeft:`4px solid ${T.gold}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{margin:0,fontSize:18,color:T.navy}}>{selProject.name} -- Project Detail</h3>
            <button onClick={()=>setSelProject(null)} style={{background:'none',border:'none',cursor:'pointer',color:T.textMut,fontSize:18}}>x</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,fontSize:12}}>
            <div><div style={{color:T.textMut}}>Country</div><div style={{fontWeight:600}}>{selProject.country}</div></div>
            <div><div style={{color:T.textMut}}>Pathway</div><div style={{fontWeight:600}}>{selProject.pathway}</div></div>
            <div><div style={{color:T.textMut}}>Capacity</div><div style={{fontWeight:600,fontFamily:T.mono}}>{selProject.capacity_kt} kt/yr</div></div>
            <div><div style={{color:T.textMut}}>Stage</div><Badge color={selProject.stage==='Operational'?T.green:T.amber}>{selProject.stage}</Badge></div>
            <div><div style={{color:T.textMut}}>Investment</div><div style={{fontWeight:600,fontFamily:T.mono}}>${selProject.investment_m}M</div></div>
            <div><div style={{color:T.textMut}}>IRR Estimate</div><div style={{fontWeight:600,fontFamily:T.mono,color:selProject.irr_est>12?T.green:T.amber}}>{selProject.irr_est.toFixed(1)}%</div></div>
            <div><div style={{color:T.textMut}}>Offtake Secured</div><div style={{fontWeight:600,fontFamily:T.mono}}>{selProject.offtake_pct}%</div></div>
            <div><div style={{color:T.textMut}}>Feedstock</div><div style={{fontWeight:500}}>{selProject.feedstock}</div></div>
          </div>
        </Card>}

        {/* Airline Purchase Agreements */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>Airline SAF Purchase Agreements (30 deals)</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Airline','Producer','Volume (kt/yr)','Duration','Period','Price Structure','Est. Price ($/t)','Status'].map(h=>
                  <th key={h} style={{padding:'8px 10px',textAlign:'left',color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}
              </tr></thead>
              <tbody>{agreements.map(a=><tr key={a.id} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'6px 10px',fontWeight:600}}>{a.airline}</td>
                <td style={{padding:'6px 10px'}}>{a.producer}</td>
                <td style={{padding:'6px 10px',fontFamily:T.mono}}>{a.volume_kt_yr}</td>
                <td style={{padding:'6px 10px',fontFamily:T.mono}}>{a.duration_yr} yr</td>
                <td style={{padding:'6px 10px',fontSize:11}}>{a.start_year}-{a.end_year}</td>
                <td style={{padding:'6px 10px'}}><Badge color={a.price_structure==='Fixed premium'?T.sage:T.navyL}>{a.price_structure}</Badge></td>
                <td style={{padding:'6px 10px',fontFamily:T.mono}}>${a.price_est.toLocaleString()}</td>
                <td style={{padding:'6px 10px'}}><Badge color={a.status==='Active'?T.green:T.gold}>{a.status}</Badge></td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>

        {/* IRR Sensitivity Matrix */}
        <Card style={{marginBottom:24}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:8,color:T.navy}}>Project Financing Model -- IRR Sensitivity</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>SAF Price Premium ($/t): ${pricePremium}</label>
              <input type="range" min={500} max={4000} step={100} value={pricePremium} onChange={e=>setPricePremium(+e.target.value)} style={{width:'100%'}}/>
            </div>
            <div>
              <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:4}}>Carbon Price ($/tCO2): ${carbonPrice}</label>
              <input type="range" min={20} max={200} step={10} value={carbonPrice} onChange={e=>setCarbonPrice(+e.target.value)} style={{width:'100%'}}/>
            </div>
          </div>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>IRR (%) by Premium x Carbon Price</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{padding:'6px 8px',textAlign:'left',color:T.textSec}}>Premium $/t</th>
                {[40,60,80,100,120,150].map(cp=><th key={cp} style={{padding:'6px 8px',textAlign:'center',color:T.textSec}}>CO2 ${cp}</th>)}
              </tr></thead>
              <tbody>{irrSensitivity.map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'6px 8px',fontWeight:600,fontFamily:T.mono}}>${r.premium}</td>
                {[40,60,80,100,120,150].map(cp=>{const v=parseFloat(r[`cp_${cp}`]);return <td key={cp} style={{padding:'6px 8px',textAlign:'center',fontFamily:T.mono,fontWeight:600,color:v>12?T.green:v>8?T.gold:T.red}}>{v}%</td>;})}
              </tr>)}</tbody>
            </table>
          </div>
          <div style={{marginTop:12,fontSize:11,color:T.textMut}}>IRR estimates assume HEFA pathway, 200kt capacity, 20-year project life. Higher premium and carbon prices improve project economics. IRR above 12% generally considered investable for infrastructure projects.</div>
        </Card>

        {/* Offtake Coverage */}
        <Card>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:T.navy}}>Offtake Coverage Analysis</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[
              {range:'0-20%',count:producers.filter(p=>p.offtake_pct<20).length},
              {range:'20-40%',count:producers.filter(p=>p.offtake_pct>=20&&p.offtake_pct<40).length},
              {range:'40-60%',count:producers.filter(p=>p.offtake_pct>=40&&p.offtake_pct<60).length},
              {range:'60-80%',count:producers.filter(p=>p.offtake_pct>=60&&p.offtake_pct<80).length},
              {range:'80-100%',count:producers.filter(p=>p.offtake_pct>=80).length},
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="range" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Projects',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
              <Tooltip content={<ToolTipC/>}/>
              <Bar dataKey="count" name="# Projects" radius={[4,4,0,0]}>
                {[T.red,T.amber,T.gold,T.sage,T.green].map((c,i)=><Cell key={i} fill={c}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:T.textMut,textAlign:'center',marginTop:4}}>Distribution of 60 SAF projects by % of output covered by offtake agreements</div>
        </Card>
      </div>}
    </div>
  </div>;
}
