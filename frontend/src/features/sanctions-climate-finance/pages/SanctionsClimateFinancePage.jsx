import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const tabs=['Sanctions Landscape','Climate Finance Impact','Dual-Use Technology','Portfolio Compliance'];
const REGIMES=['OFAC SDN','EU Restrictive','UK Sanctions','UN Sanctions'];
const REGIME_COLORS=[T.red,T.navy,T.gold,T.sage];

const COUNTRIES_60=useMemoHelper();
function useMemoHelper(){
  const names=['Russia','Iran','China','North Korea','Syria','Myanmar','Venezuela','Cuba','Belarus','Zimbabwe',
    'Libya','Sudan','South Sudan','Yemen','Somalia','Eritrea','DRC Congo','CAR','Mali','Guinea',
    'Nicaragua','Turkey','UAE','Saudi Arabia','Qatar','Pakistan','India','Brazil','South Africa','Nigeria',
    'Kenya','Egypt','Morocco','Algeria','Tunisia','Lebanon','Iraq','Afghanistan','Uzbekistan','Kazakhstan',
    'Thailand','Vietnam','Indonesia','Philippines','Malaysia','Singapore','Japan','South Korea','Taiwan','Mexico',
    'Colombia','Chile','Argentina','Peru','Ecuador','Ethiopia','Tanzania','Ghana','Senegal','Mozambique'];
  return names;
}

const COMPANIES_100=[];
const COMP_NAMES=['Gazprom Energy','Rosneft Oil','CNPC Holdings','Sinopec Group','PetroChina','Lukoil','Novatek LNG',
  'Surgutneftegaz','Transneft Pipeline','NIOC Iran','PDVSA','Belarus Potash','ZTE Corp','Huawei Tech',
  'SMIC Semiconductor','Xiaomi Corp','DJI Drones','Megvii Tech','SenseTime AI','Hikvision','Dahua Tech',
  'iFlytek','ByteDance','Alibaba Cloud','Tencent','Baidu','Lenovo','BYD Auto','CATL Battery','LONGi Solar',
  'Jinko Solar','Trina Solar','JA Solar','Canadian Solar','First Solar','SunPower','Enphase','SolarEdge',
  'Vestas Wind','Siemens Gamesa','Goldwind','Envision','Nordex','Orsted','NextEra','Enel Green','Iberdrola',
  'EDF Renewables','TotalEnergies','Shell','BP','Equinor','Eni','Repsol','Petrobras','Saudi Aramco',
  'Qatar Energy','ADNOC','Kuwait Petro','Chevron','ExxonMobil','ConocoPhillips','Marathon Oil','Pioneer Natural',
  'Devon Energy','Diamondback','Coterra','Hess Corp','Occidental','Apache Corp','Murphy Oil','Vermilion',
  'Santos Ltd','Woodside','Origin Energy','AGL Energy','Fortescue','Rio Tinto','BHP Group','Vale SA',
  'Glencore','Anglo American','Freeport McMoRan','Southern Copper','Newmont','Barrick Gold','Nucor Steel',
  'ArcelorMittal','POSCO','Nippon Steel','JFE Holdings','Thyssenkrupp','Tata Steel','JSW Steel','SAIL India',
  'Norsk Hydro','Alcoa','Hindalco','Rusal','UC Rusal','Norilsk Nickel','MMC Norilsk','Polymetal','Alrosa'];

for(let i=0;i<100;i++){
  const s=sr(i*7+3);const s2=sr(i*11+5);const s3=sr(i*13+7);
  COMPANIES_100.push({
    id:i+1,name:COMP_NAMES[i]||`Company_${i+1}`,
    country:COUNTRIES_60[Math.floor(s*60)],
    sector:['Oil & Gas','Mining','Technology','Renewables','Utilities','Steel','Chemicals','Banking'][Math.floor(s2*8)],
    sdnMatch:s3<0.15,euSanctioned:s3<0.12||s<0.1,ukSanctioned:s3<0.1,unSanctioned:s3<0.05,
    exposureScore:Math.floor(s*100),revenue:Math.floor(s2*500+10)*100,
    climateFinanceBlocked:Math.floor(s3*200)*1e6,
    dualUseRisk:['High','Medium','Low','None'][Math.floor(s*4)],
    complianceStatus:['Clear','Enhanced DD','Restricted','Blocked'][Math.floor(s3*4)],
    secondaryRisk:Math.floor(s2*100),eddTriggers:Math.floor(s*5),
    lastScreened:`2026-0${Math.floor(s*3)+1}-${Math.floor(s2*28)+1<10?'0':''}${Math.floor(s2*28)+1}`
  });
}

const CLIMATE_PROJECTS=[
  {id:1,name:'Russia Gas Transition Program',country:'Russia',type:'Gas-to-Renewable',valueMn:4500,status:'Blocked',regime:'OFAC SDN',redirected:'Turkey/India',emissions:'12.4 MtCO2e avoided lost'},
  {id:2,name:'Iran Solar Mega-Park',country:'Iran',type:'Solar PV',valueMn:2200,status:'Blocked',regime:'OFAC/EU',redirected:'None',emissions:'3.1 MtCO2e avoided lost'},
  {id:3,name:'Myanmar Hydropower',country:'Myanmar',type:'Hydro',valueMn:1800,status:'Blocked',regime:'EU/UK',redirected:'China',emissions:'2.8 MtCO2e avoided lost'},
  {id:4,name:'Venezuela Wind Farm',country:'Venezuela',type:'Wind',valueMn:900,status:'Blocked',regime:'OFAC',redirected:'Colombia',emissions:'1.2 MtCO2e avoided lost'},
  {id:5,name:'Cuba Solar Deployment',country:'Cuba',type:'Solar PV',valueMn:350,status:'Blocked',regime:'OFAC',redirected:'None',emissions:'0.5 MtCO2e avoided lost'},
  {id:6,name:'Syria Grid Rebuild',country:'Syria',type:'Grid Modernization',valueMn:3200,status:'Blocked',regime:'EU/OFAC',redirected:'None',emissions:'4.2 MtCO2e avoided lost'},
  {id:7,name:'North Korea Energy',country:'North Korea',type:'Mixed Renewable',valueMn:500,status:'Blocked',regime:'UN/All',redirected:'None',emissions:'0.8 MtCO2e avoided lost'},
  {id:8,name:'Belarus Wind Farm',country:'Belarus',type:'Wind',valueMn:650,status:'Restricted',regime:'EU/UK',redirected:'Kazakhstan',emissions:'0.9 MtCO2e avoided lost'},
  {id:9,name:'Sudan Solar Mini-Grid',country:'Sudan',type:'Solar Mini-Grid',valueMn:180,status:'Humanitarian Exemption',regime:'OFAC',redirected:'N/A',emissions:'0.3 MtCO2e'},
  {id:10,name:'Yemen Climate Adapt',country:'Yemen',type:'Adaptation',valueMn:120,status:'Humanitarian Exemption',regime:'OFAC',redirected:'N/A',emissions:'N/A - Adaptation'},
  {id:11,name:'Zimbabwe Geothermal',country:'Zimbabwe',type:'Geothermal',valueMn:400,status:'Restricted',regime:'OFAC/EU',redirected:'China',emissions:'0.6 MtCO2e avoided lost'},
  {id:12,name:'Libya Grid Stabilization',country:'Libya',type:'Grid+Storage',valueMn:1100,status:'Restricted',regime:'UN/EU',redirected:'Turkey',emissions:'1.5 MtCO2e avoided lost'},
  {id:13,name:'DRC Cobalt Green Mining',country:'DRC Congo',type:'Green Mining',valueMn:750,status:'Restricted',regime:'EU',redirected:'None',emissions:'0.4 MtCO2e'},
  {id:14,name:'Eritrea Wind Corridor',country:'Eritrea',type:'Wind',valueMn:200,status:'Blocked',regime:'UN',redirected:'None',emissions:'0.3 MtCO2e avoided lost'},
  {id:15,name:'Somalia Adaptation Fund',country:'Somalia',type:'Adaptation',valueMn:80,status:'Humanitarian Exemption',regime:'UN/OFAC',redirected:'N/A',emissions:'N/A - Adaptation'},
];

const DUAL_USE_TECH=[
  {tech:'Nuclear SMR Components',category:'Nuclear',controlRegime:'NSG/Wassenaar',chinaRestricted:true,russiaRestricted:true,greenApp:'Zero-carbon baseload',entityListCo:12,priceImpact:'+35%'},
  {tech:'Advanced Li-ion Cells >300Wh/kg',category:'Batteries',controlRegime:'Wassenaar/EAR',chinaRestricted:false,russiaRestricted:true,greenApp:'EV & grid storage',entityListCo:8,priceImpact:'+15%'},
  {tech:'AI Grid Management Software',category:'AI/ML',controlRegime:'EAR',chinaRestricted:true,russiaRestricted:true,greenApp:'Smart grid optimization',entityListCo:22,priceImpact:'+25%'},
  {tech:'Satellite Earth Observation',category:'Space/Remote Sensing',controlRegime:'ITAR/EAR',chinaRestricted:true,russiaRestricted:true,greenApp:'Climate monitoring',entityListCo:6,priceImpact:'+40%'},
  {tech:'Carbon Capture Membranes',category:'Advanced Materials',controlRegime:'EAR',chinaRestricted:false,russiaRestricted:true,greenApp:'CCS/CCUS',entityListCo:3,priceImpact:'+20%'},
  {tech:'Quantum Computing Chips',category:'Semiconductors',controlRegime:'EAR/Entity List',chinaRestricted:true,russiaRestricted:true,greenApp:'Materials discovery',entityListCo:15,priceImpact:'+50%'},
  {tech:'High-Purity Silicon Wafers',category:'Semiconductors',controlRegime:'EAR',chinaRestricted:true,russiaRestricted:true,greenApp:'Solar PV manufacturing',entityListCo:18,priceImpact:'+22%'},
  {tech:'Rare Earth Magnets (NdFeB)',category:'Materials',controlRegime:'None/Strategic',chinaRestricted:false,russiaRestricted:false,greenApp:'Wind turbines & EVs',entityListCo:0,priceImpact:'N/A'},
  {tech:'Solid-State Battery Tech',category:'Batteries',controlRegime:'EAR (emerging)',chinaRestricted:false,russiaRestricted:true,greenApp:'Next-gen storage',entityListCo:2,priceImpact:'+18%'},
  {tech:'Hydrogen Electrolyzer Stacks',category:'Clean Energy',controlRegime:'EAR (review)',chinaRestricted:false,russiaRestricted:true,greenApp:'Green hydrogen',entityListCo:1,priceImpact:'+12%'},
  {tech:'GaN Power Semiconductors',category:'Semiconductors',controlRegime:'EAR',chinaRestricted:true,russiaRestricted:true,greenApp:'EV inverters, solar',entityListCo:9,priceImpact:'+30%'},
  {tech:'Perovskite Solar IP',category:'Advanced Materials',controlRegime:'None/Patent',chinaRestricted:false,russiaRestricted:false,greenApp:'Next-gen solar',entityListCo:0,priceImpact:'N/A'},
  {tech:'Flow Battery Vanadium Tech',category:'Batteries',controlRegime:'Strategic mineral',chinaRestricted:false,russiaRestricted:true,greenApp:'Grid-scale storage',entityListCo:1,priceImpact:'+8%'},
  {tech:'Thermal Energy Storage',category:'Clean Energy',controlRegime:'None',chinaRestricted:false,russiaRestricted:false,greenApp:'Industrial heat decarbonization',entityListCo:0,priceImpact:'N/A'},
  {tech:'Autonomous Drone Inspection',category:'AI/Robotics',controlRegime:'ITAR/EAR',chinaRestricted:true,russiaRestricted:true,greenApp:'Wind/solar inspection',entityListCo:14,priceImpact:'+28%'},
];

export default function SanctionsClimateFinancePage(){
  const [tab,setTab]=useState(0);
  const [selCountry,setSelCountry]=useState(null);
  const [selRegime,setSelRegime]=useState('All');
  const [selSector,setSelSector]=useState('All');
  const [searchTerm,setSearchTerm]=useState('');
  const [sortCol,setSortCol]=useState('exposureScore');
  const [sortDir,setSortDir]=useState('desc');
  const [compPage,setCompPage]=useState(0);
  const [selTech,setSelTech]=useState(null);

  const countryData=useMemo(()=>{
    return COUNTRIES_60.map((c,i)=>{
      const s=sr(i*17+11);const s2=sr(i*23+7);const s3=sr(i*31+3);const s4=sr(i*37+13);
      return{
        name:c,ofac:s<0.2,eu:s2<0.25,uk:s3<0.2,un:s4<0.1,
        regimeCount:(s<0.2?1:0)+(s2<0.25?1:0)+(s3<0.2?1:0)+(s4<0.1?1:0),
        climateFinanceMn:Math.floor(sr(i*41+5)*5000),
        blockedMn:Math.floor(sr(i*43+9)*2000),
        companiesExposed:Math.floor(sr(i*47+11)*50),
        riskScore:Math.floor(sr(i*53+17)*100),
        transactionsScreened:Math.floor(sr(i*59+19)*10000),
        humanitarianExempt:s4<0.15
      };
    }).sort((a,b)=>b.regimeCount-a.regimeCount);
  },[]);

  const sanctionedCountries=useMemo(()=>countryData.filter(c=>c.regimeCount>0),[countryData]);
  const regimeBreakdown=useMemo(()=>{
    const ofac=countryData.filter(c=>c.ofac).length;
    const eu=countryData.filter(c=>c.eu).length;
    const uk=countryData.filter(c=>c.uk).length;
    const un=countryData.filter(c=>c.un).length;
    return[{name:'OFAC SDN',value:ofac},{name:'EU Restrictive',value:eu},{name:'UK Sanctions',value:uk},{name:'UN Sanctions',value:un}];
  },[countryData]);

  const filteredCompanies=useMemo(()=>{
    let f=COMPANIES_100;
    if(selRegime!=='All'){
      if(selRegime==='OFAC')f=f.filter(c=>c.sdnMatch);
      else if(selRegime==='EU')f=f.filter(c=>c.euSanctioned);
      else if(selRegime==='UK')f=f.filter(c=>c.ukSanctioned);
      else if(selRegime==='UN')f=f.filter(c=>c.unSanctioned);
    }
    if(selSector!=='All')f=f.filter(c=>c.sector===selSector);
    if(searchTerm)f=f.filter(c=>c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    f=[...f].sort((a,b)=>sortDir==='desc'?b[sortCol]-a[sortCol]:a[sortCol]-b[sortCol]);
    return f;
  },[selRegime,selSector,searchTerm,sortCol,sortDir]);

  const blockedByStatus=useMemo(()=>{
    const map={Blocked:0,Restricted:0,'Humanitarian Exemption':0};
    CLIMATE_PROJECTS.forEach(p=>{map[p.status]=(map[p.status]||0)+p.valueMn;});
    return Object.entries(map).map(([k,v])=>({name:k,value:v}));
  },[]);

  const blockedByType=useMemo(()=>{
    const map={};
    CLIMATE_PROJECTS.forEach(p=>{map[p.type]=(map[p.type]||0)+p.valueMn;});
    return Object.entries(map).map(([k,v])=>({name:k,value:v})).sort((a,b)=>b.value-a.value);
  },[]);

  const redirectedFlows=useMemo(()=>{
    const map={};
    CLIMATE_PROJECTS.filter(p=>p.redirected&&p.redirected!=='None'&&p.redirected!=='N/A').forEach(p=>{
      p.redirected.split('/').forEach(r=>{map[r.trim()]=(map[r.trim()]||0)+p.valueMn;});
    });
    return Object.entries(map).map(([k,v])=>({name:k,value:v})).sort((a,b)=>b.value-a.value);
  },[]);

  const techByCategory=useMemo(()=>{
    const map={};
    DUAL_USE_TECH.forEach(t=>{map[t.category]=(map[t.category]||0)+1;});
    return Object.entries(map).map(([k,v])=>({name:k,value:v}));
  },[]);

  const entityListByCat=useMemo(()=>{
    const map={};
    DUAL_USE_TECH.forEach(t=>{map[t.category]=(map[t.category]||0)+t.entityListCo;});
    return Object.entries(map).map(([k,v])=>({category:k,entities:v})).sort((a,b)=>b.entities-a.entities);
  },[]);

  const complianceSummary=useMemo(()=>{
    const map={Clear:0,'Enhanced DD':0,Restricted:0,Blocked:0};
    COMPANIES_100.forEach(c=>{map[c.complianceStatus]=(map[c.complianceStatus]||0)+1;});
    return Object.entries(map).map(([k,v])=>({name:k,value:v}));
  },[]);

  const sectorExposure=useMemo(()=>{
    const map={};
    COMPANIES_100.forEach(c=>{
      if(!map[c.sector])map[c.sector]={sector:c.sector,totalExposure:0,count:0,sdnCount:0};
      map[c.sector].totalExposure+=c.exposureScore;
      map[c.sector].count+=1;
      if(c.sdnMatch)map[c.sector].sdnCount+=1;
    });
    return Object.values(map).map(v=>({...v,avgExposure:Math.round(v.totalExposure/v.count)})).sort((a,b)=>b.avgExposure-a.avgExposure);
  },[]);

  const radarData=useMemo(()=>{
    return REGIMES.map((r,i)=>{
      const cnt=r==='OFAC SDN'?COMPANIES_100.filter(c=>c.sdnMatch).length:
        r==='EU Restrictive'?COMPANIES_100.filter(c=>c.euSanctioned).length:
        r==='UK Sanctions'?COMPANIES_100.filter(c=>c.ukSanctioned).length:
        COMPANIES_100.filter(c=>c.unSanctioned).length;
      return{regime:r,companies:cnt,countries:regimeBreakdown[i].value,
        blockedFinance:Math.floor(sr(i*67+23)*5000),riskScore:Math.floor(sr(i*71+29)*100)};
    });
  },[regimeBreakdown]);

  const quarterlyTrend=useMemo(()=>{
    const quarters=['Q1 2024','Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026'];
    return quarters.map((q,i)=>({
      quarter:q,
      sanctionedEntities:Math.floor(sr(i*83+31)*50)+120+i*8,
      blockedFinanceBn:+(sr(i*89+37)*5+8+i*0.5).toFixed(1),
      screeningVolume:Math.floor(sr(i*97+41)*5000)+15000+i*2000,
      newDesignations:Math.floor(sr(i*101+43)*30)+5
    }));
  },[]);

  const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.navyL,T.goldL,T.sageL];
  const STATUS_COLORS={Clear:T.green,'Enhanced DD':T.amber,Restricted:T.gold,Blocked:T.red};
  const sectors=[...new Set(COMPANIES_100.map(c=>c.sector))];
  const PAGE_SIZE=15;

  const handleSort=(col)=>{
    if(sortCol===col)setSortDir(d=>d==='desc'?'asc':'desc');
    else{setSortCol(col);setSortDir('desc');}
  };

  const exportCSV=()=>{
    const headers=['Name','Country','Sector','SDN Match','EU Sanctioned','UK Sanctioned','UN Sanctioned','Exposure Score','Revenue $M','Compliance Status','Secondary Risk %','EDD Triggers','Last Screened'];
    const rows=filteredCompanies.map(c=>[c.name,c.country,c.sector,c.sdnMatch?'YES':'NO',c.euSanctioned?'YES':'NO',c.ukSanctioned?'YES':'NO',c.unSanctioned?'YES':'NO',c.exposureScore,c.revenue/1e6,c.complianceStatus,c.secondaryRisk,c.eddTriggers,c.lastScreened].join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='sanctions_screening_report.csv';a.click();URL.revokeObjectURL(url);
  };

  const sty={
    wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px'},
    header:{marginBottom:'24px'},
    title:{fontSize:'28px',fontWeight:700,color:T.navy,margin:0,letterSpacing:'-0.5px'},
    subtitle:{fontSize:'13px',color:T.textSec,marginTop:'4px',fontFamily:T.mono},
    tabs:{display:'flex',gap:'2px',background:T.border,borderRadius:'10px',padding:'3px',marginBottom:'24px'},
    tab:(a)=>({padding:'10px 20px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:a?600:400,background:a?T.surface:'transparent',color:a?T.navy:T.textSec,fontFamily:T.font,transition:'all 0.2s'}),
    card:{background:T.surface,borderRadius:'12px',border:`1px solid ${T.border}`,padding:'20px',marginBottom:'16px'},
    cardTitle:{fontSize:'15px',fontWeight:600,color:T.navy,marginBottom:'12px'},
    kpi:{display:'inline-block',background:T.surfaceH,borderRadius:'8px',padding:'12px 18px',margin:'4px',minWidth:'140px',textAlign:'center'},
    kpiVal:{fontSize:'22px',fontWeight:700,color:T.navy,fontFamily:T.mono},
    kpiLbl:{fontSize:'11px',color:T.textMut,marginTop:'2px'},
    grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'},
    grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px'},
    input:{padding:'8px 12px',borderRadius:'6px',border:`1px solid ${T.border}`,fontSize:'13px',fontFamily:T.font,outline:'none',width:'220px'},
    select:{padding:'8px 12px',borderRadius:'6px',border:`1px solid ${T.border}`,fontSize:'13px',fontFamily:T.font,background:T.surface},
    table:{width:'100%',borderCollapse:'collapse',fontSize:'12px'},
    th:{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,cursor:'pointer',fontSize:'11px',fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.5px'},
    td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.text,fontSize:'12px'},
    badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,color:'#fff',background:c}),
    btn:{padding:'8px 16px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:600,fontFamily:T.font},
    btnPrimary:{background:T.navy,color:'#fff'},
    btnGold:{background:T.gold,color:'#fff'},
    tag:(active)=>({display:'inline-block',padding:'4px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:500,cursor:'pointer',background:active?T.navy:T.surfaceH,color:active?'#fff':T.textSec,border:`1px solid ${active?T.navy:T.border}`,margin:'2px'}),
    alert:{padding:'10px 14px',borderRadius:'8px',border:`1px solid ${T.red}22`,background:`${T.red}08`,fontSize:'12px',color:T.red,marginBottom:'8px'},
    progressBar:(pct,color)=>({height:'6px',borderRadius:'3px',background:T.surfaceH,position:'relative',overflow:'hidden',width:'100%'}),
    progressFill:(pct,color)=>({height:'100%',borderRadius:'3px',background:color,width:`${Math.min(pct,100)}%`,transition:'width 0.3s'}),
    mono:{fontFamily:T.mono,fontSize:'11px'},
    row:{display:'flex',gap:'12px',alignItems:'center',flexWrap:'wrap',marginBottom:'12px'},
    chip:(c)=>({display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,background:`${c}15`,color:c,border:`1px solid ${c}30`}),
  };

  const renderTab0=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Sanctioned Countries',v:sanctionedCountries.length},{l:'Total Regimes Active',v:regimeBreakdown.reduce((a,b)=>a+b.value,0)},{l:'Companies Exposed',v:COMPANIES_100.filter(c=>c.sdnMatch||c.euSanctioned||c.ukSanctioned||c.unSanctioned).length},{l:'Climate Finance Blocked',v:'$14.7B'},{l:'Quarterly Screening Vol',v:'127K'},{l:'New Designations Q1',v:quarterlyTrend[quarterlyTrend.length-1].newDesignations}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Sanctions Regime Coverage</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={regimeBreakdown} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
              {regimeBreakdown.map((e,i)=>(<Cell key={i} fill={REGIME_COLORS[i]}/>))}
            </Pie><Tooltip/><Legend/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Quarterly Sanctions Trend</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={quarterlyTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" height={50}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}}/>
              <Line type="monotone" dataKey="sanctionedEntities" stroke={T.red} strokeWidth={2} name="Sanctioned Entities"/>
              <Line type="monotone" dataKey="newDesignations" stroke={T.gold} strokeWidth={2} name="New Designations"/>
              <Legend wrapperStyle={{fontSize:11}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Geopolitical Risk Radar by Regime</div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}><PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="regime" tick={{fontSize:11,fill:T.textSec}}/>
            <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/>
            <Radar name="Companies" dataKey="companies" stroke={T.red} fill={T.red} fillOpacity={0.2}/>
            <Radar name="Countries" dataKey="countries" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
            <Radar name="Risk Score" dataKey="riskScore" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={sty.cardTitle}>Country Sanctions Matrix (60 Countries)</div>
          <div style={sty.mono}>{sanctionedCountries.length} under sanctions</div>
        </div>
        <div style={{maxHeight:'400px',overflowY:'auto'}}>
          <table style={sty.table}>
            <thead><tr>
              <th style={sty.th}>Country</th><th style={sty.th}>OFAC</th><th style={sty.th}>EU</th><th style={sty.th}>UK</th><th style={sty.th}>UN</th>
              <th style={sty.th}>Risk Score</th><th style={sty.th}>Climate $M Blocked</th><th style={sty.th}>Companies</th>
            </tr></thead>
            <tbody>{countryData.map((c,i)=>(
              <tr key={i} style={{background:selCountry===c.name?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelCountry(selCountry===c.name?null:c.name)}>
                <td style={{...sty.td,fontWeight:600}}>{c.name}</td>
                <td style={sty.td}>{c.ofac?<span style={sty.badge(T.red)}>SDN</span>:<span style={{color:T.textMut}}>-</span>}</td>
                <td style={sty.td}>{c.eu?<span style={sty.badge(T.navy)}>EU</span>:<span style={{color:T.textMut}}>-</span>}</td>
                <td style={sty.td}>{c.uk?<span style={sty.badge(T.gold)}>UK</span>:<span style={{color:T.textMut}}>-</span>}</td>
                <td style={sty.td}>{c.un?<span style={sty.badge(T.sage)}>UN</span>:<span style={{color:T.textMut}}>-</span>}</td>
                <td style={sty.td}><div style={{display:'flex',alignItems:'center',gap:'6px'}}><div style={sty.progressBar()}><div style={sty.progressFill(c.riskScore,c.riskScore>70?T.red:c.riskScore>40?T.amber:T.green)}/></div><span style={sty.mono}>{c.riskScore}</span></div></td>
                <td style={{...sty.td,...sty.mono}}>{c.blockedMn>0?`$${c.blockedMn}M`:'-'}</td>
                <td style={{...sty.td,...sty.mono}}>{c.companiesExposed}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {selCountry&&(()=>{
        const cd=countryData.find(c=>c.name===selCountry);
        const cos=COMPANIES_100.filter(c=>c.country===selCountry);
        return(
          <div style={{...sty.card,borderLeft:`4px solid ${T.gold}`}}>
            <div style={sty.cardTitle}>{selCountry} - Detailed Profile</div>
            <div style={sty.row}>
              {[{l:'OFAC',v:cd.ofac?'YES':'NO'},{l:'EU',v:cd.eu?'YES':'NO'},{l:'UK',v:cd.uk?'YES':'NO'},{l:'UN',v:cd.un?'YES':'NO'},{l:'Risk Score',v:cd.riskScore},{l:'Blocked $M',v:cd.blockedMn},{l:'Companies',v:cos.length},{l:'Humanitarian Exempt',v:cd.humanitarianExempt?'YES':'NO'}].map((k,i)=>(
                <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
              ))}
            </div>
            {cos.length>0&&(<table style={sty.table}><thead><tr><th style={sty.th}>Company</th><th style={sty.th}>Sector</th><th style={sty.th}>Exposure</th><th style={sty.th}>Status</th></tr></thead>
              <tbody>{cos.map((c,i)=>(<tr key={i}><td style={sty.td}>{c.name}</td><td style={sty.td}>{c.sector}</td><td style={{...sty.td,...sty.mono}}>{c.exposureScore}</td><td style={sty.td}><span style={sty.badge(STATUS_COLORS[c.complianceStatus]||T.textMut)}>{c.complianceStatus}</span></td></tr>))}</tbody></table>)}
          </div>
        );
      })()}
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Total Blocked Value',v:'$16.0B'},{l:'Projects Affected',v:CLIMATE_PROJECTS.length},{l:'Emissions Impact',v:'28.0 MtCO2e'},{l:'Humanitarian Exemptions',v:CLIMATE_PROJECTS.filter(p=>p.status==='Humanitarian Exemption').length},{l:'Redirected Capital',v:'$7.1B'}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Blocked Climate Finance by Status</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={blockedByStatus} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({name,value})=>`${name}: $${value}M`}>
              {blockedByStatus.map((e,i)=>(<Cell key={i} fill={[T.red,T.amber,T.sage][i]}/>))}
            </Pie><Tooltip formatter={(v)=>`$${v}M`}/><Legend wrapperStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Blocked by Project Type</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={blockedByType} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={130}/>
              <Tooltip formatter={(v)=>`$${v}M`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="value" fill={T.navy} radius={[0,4,4,0]} name="Value $M"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Redirected Capital Flows</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={redirectedFlows}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip formatter={(v)=>`$${v}M`} contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="value" fill={T.gold} radius={[4,4,0,0]} name="Redirected $M"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Climate Projects Affected by Sanctions</div>
        <div style={{maxHeight:'500px',overflowY:'auto'}}>
          <table style={sty.table}>
            <thead><tr>
              <th style={sty.th}>Project</th><th style={sty.th}>Country</th><th style={sty.th}>Type</th><th style={sty.th}>Value $M</th>
              <th style={sty.th}>Status</th><th style={sty.th}>Regime</th><th style={sty.th}>Redirected To</th><th style={sty.th}>Emissions Impact</th>
            </tr></thead>
            <tbody>{CLIMATE_PROJECTS.map((p,i)=>(
              <tr key={i}>
                <td style={{...sty.td,fontWeight:600}}>{p.name}</td>
                <td style={sty.td}>{p.country}</td>
                <td style={sty.td}>{p.type}</td>
                <td style={{...sty.td,...sty.mono}}>${p.valueMn.toLocaleString()}</td>
                <td style={sty.td}><span style={sty.badge(p.status==='Blocked'?T.red:p.status==='Restricted'?T.amber:T.sage)}>{p.status}</span></td>
                <td style={{...sty.td,...sty.mono}}>{p.regime}</td>
                <td style={sty.td}>{p.redirected}</td>
                <td style={{...sty.td,fontSize:'11px'}}>{p.emissions}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Screening Volume Trend</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={quarterlyTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Line type="monotone" dataKey="screeningVolume" stroke={T.sage} strokeWidth={2} name="Screenings"/>
            <Line type="monotone" dataKey="blockedFinanceBn" stroke={T.red} strokeWidth={2} name="Blocked $Bn" yAxisId="right"/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Controlled Technologies',v:DUAL_USE_TECH.length},{l:'Entity List Companies',v:DUAL_USE_TECH.reduce((a,b)=>a+b.entityListCo,0)},{l:'China Restricted',v:DUAL_USE_TECH.filter(t=>t.chinaRestricted).length},{l:'Russia Restricted',v:DUAL_USE_TECH.filter(t=>t.russiaRestricted).length},{l:'Green Tech Overlap',v:`${Math.round(DUAL_USE_TECH.filter(t=>t.greenApp).length/DUAL_USE_TECH.length*100)}%`}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Technologies by Category</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={techByCategory} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
              {techByCategory.map((e,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}
            </Pie><Tooltip/><Legend wrapperStyle={{fontSize:10}}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Entity List Companies by Category</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={entityListByCat} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="category" type="category" tick={{fontSize:10,fill:T.textSec}} width={130}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="entities" fill={T.red} radius={[0,4,4,0]} name="Entity List Cos"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Dual-Use Technology Export Controls</div>
        <div style={{maxHeight:'500px',overflowY:'auto'}}>
          <table style={sty.table}>
            <thead><tr>
              <th style={sty.th}>Technology</th><th style={sty.th}>Category</th><th style={sty.th}>Control Regime</th>
              <th style={sty.th}>China</th><th style={sty.th}>Russia</th><th style={sty.th}>Green Application</th>
              <th style={sty.th}>Entity List Cos</th><th style={sty.th}>Price Impact</th>
            </tr></thead>
            <tbody>{DUAL_USE_TECH.map((t,i)=>(
              <tr key={i} style={{background:selTech===i?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelTech(selTech===i?null:i)}>
                <td style={{...sty.td,fontWeight:600}}>{t.tech}</td>
                <td style={sty.td}>{t.category}</td>
                <td style={{...sty.td,...sty.mono}}>{t.controlRegime}</td>
                <td style={sty.td}>{t.chinaRestricted?<span style={sty.badge(T.red)}>RESTRICTED</span>:<span style={sty.chip(T.green)}>Open</span>}</td>
                <td style={sty.td}>{t.russiaRestricted?<span style={sty.badge(T.red)}>RESTRICTED</span>:<span style={sty.chip(T.green)}>Open</span>}</td>
                <td style={{...sty.td,fontSize:'11px'}}>{t.greenApp}</td>
                <td style={{...sty.td,...sty.mono,fontWeight:600}}>{t.entityListCo}</td>
                <td style={{...sty.td,...sty.mono,color:t.priceImpact!=='N/A'?T.red:T.textMut}}>{t.priceImpact}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {selTech!==null&&(()=>{
        const t=DUAL_USE_TECH[selTech];
        return(
          <div style={{...sty.card,borderLeft:`4px solid ${T.red}`}}>
            <div style={sty.cardTitle}>{t.tech} - Detailed Analysis</div>
            <div style={sty.grid3}>
              <div><div style={{fontSize:'11px',color:T.textMut}}>Control Regime</div><div style={{fontSize:'14px',fontWeight:600,color:T.navy}}>{t.controlRegime}</div></div>
              <div><div style={{fontSize:'11px',color:T.textMut}}>Green Application</div><div style={{fontSize:'14px',fontWeight:600,color:T.sage}}>{t.greenApp}</div></div>
              <div><div style={{fontSize:'11px',color:T.textMut}}>Entity List Exposure</div><div style={{fontSize:'14px',fontWeight:600,color:T.red}}>{t.entityListCo} companies</div></div>
            </div>
            <div style={{marginTop:'12px',padding:'10px',background:T.surfaceH,borderRadius:'8px',fontSize:'12px',color:T.textSec}}>
              <strong>Geopolitical Impact:</strong> {t.chinaRestricted&&t.russiaRestricted?'Full dual-restriction in place. Supply chain rerouting required for both China and Russia markets. Alternative sourcing from allied nations recommended.':t.chinaRestricted?'China-restricted. Major impact on manufacturing supply chains. Friendshoring to Japan/South Korea/Taiwan alternatives.':t.russiaRestricted?'Russia-restricted only. Limited market impact. Focus on European energy transition applications.':'No current restrictions. Monitor for emerging controls.'}
            </div>
          </div>
        );
      })()}
    </div>
  );

  const renderTab3=()=>{
    const pagedCompanies=filteredCompanies.slice(compPage*PAGE_SIZE,(compPage+1)*PAGE_SIZE);
    const totalPages=Math.ceil(filteredCompanies.length/PAGE_SIZE);
    return(
      <div>
        <div style={sty.row}>
          {[{l:'Companies Screened',v:100},{l:'SDN Matches',v:COMPANIES_100.filter(c=>c.sdnMatch).length},{l:'Enhanced DD Required',v:COMPANIES_100.filter(c=>c.complianceStatus==='Enhanced DD').length},{l:'Blocked',v:COMPANIES_100.filter(c=>c.complianceStatus==='Blocked').length},{l:'Clear',v:COMPANIES_100.filter(c=>c.complianceStatus==='Clear').length},{l:'Avg Exposure Score',v:Math.round(COMPANIES_100.reduce((a,c)=>a+c.exposureScore,0)/100)}].map((k,i)=>(
            <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
          ))}
        </div>
        <div style={sty.grid2}>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Compliance Status Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={complianceSummary} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                {complianceSummary.map((e,i)=>(<Cell key={i} fill={[T.green,T.amber,T.gold,T.red][i]}/>))}
              </Pie><Tooltip/><Legend wrapperStyle={{fontSize:11}}/></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Sector Exposure Analysis</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorExposure}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
                <Bar dataKey="avgExposure" fill={T.navy} radius={[4,4,0,0]} name="Avg Exposure"/>
                <Bar dataKey="sdnCount" fill={T.red} radius={[4,4,0,0]} name="SDN Matches"/>
                <Legend wrapperStyle={{fontSize:11}}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={sty.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',flexWrap:'wrap',gap:'8px'}}>
            <div style={sty.cardTitle}>Portfolio Screening Results</div>
            <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
              <input style={sty.input} placeholder="Search company..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
              <select style={sty.select} value={selRegime} onChange={e=>setSelRegime(e.target.value)}>
                <option value="All">All Regimes</option><option value="OFAC">OFAC SDN</option><option value="EU">EU</option><option value="UK">UK</option><option value="UN">UN</option>
              </select>
              <select style={sty.select} value={selSector} onChange={e=>setSelSector(e.target.value)}>
                <option value="All">All Sectors</option>{sectors.map(s=>(<option key={s} value={s}>{s}</option>))}
              </select>
              <button style={{...sty.btn,...sty.btnGold}} onClick={exportCSV}>Export CSV</button>
            </div>
          </div>
          <div style={{fontSize:'12px',color:T.textMut,marginBottom:'8px'}}>{filteredCompanies.length} companies | Page {compPage+1} of {totalPages}</div>
          <div style={{overflowX:'auto'}}>
            <table style={sty.table}>
              <thead><tr>
                <th style={sty.th} onClick={()=>handleSort('name')}>Company</th>
                <th style={sty.th}>Country</th><th style={sty.th}>Sector</th>
                <th style={sty.th}>SDN</th><th style={sty.th}>EU</th><th style={sty.th}>UK</th><th style={sty.th}>UN</th>
                <th style={sty.th} onClick={()=>handleSort('exposureScore')}>Exposure {sortCol==='exposureScore'?(sortDir==='desc'?'v':'^'):''}</th>
                <th style={sty.th} onClick={()=>handleSort('secondaryRisk')}>2ndary Risk %</th>
                <th style={sty.th}>Status</th><th style={sty.th}>EDD Triggers</th><th style={sty.th}>Last Screened</th>
              </tr></thead>
              <tbody>{pagedCompanies.map((c,i)=>(
                <tr key={i} style={{background:i%2===0?'transparent':T.surfaceH}}>
                  <td style={{...sty.td,fontWeight:600}}>{c.name}</td>
                  <td style={sty.td}>{c.country}</td>
                  <td style={sty.td}>{c.sector}</td>
                  <td style={sty.td}>{c.sdnMatch?<span style={sty.badge(T.red)}>HIT</span>:'-'}</td>
                  <td style={sty.td}>{c.euSanctioned?<span style={sty.badge(T.navy)}>YES</span>:'-'}</td>
                  <td style={sty.td}>{c.ukSanctioned?<span style={sty.badge(T.gold)}>YES</span>:'-'}</td>
                  <td style={sty.td}>{c.unSanctioned?<span style={sty.badge(T.sage)}>YES</span>:'-'}</td>
                  <td style={sty.td}><div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{...sty.progressBar(),width:'60px'}}><div style={sty.progressFill(c.exposureScore,c.exposureScore>70?T.red:c.exposureScore>40?T.amber:T.green)}/></div><span style={sty.mono}>{c.exposureScore}</span></div></td>
                  <td style={{...sty.td,...sty.mono}}>{c.secondaryRisk}%</td>
                  <td style={sty.td}><span style={sty.badge(STATUS_COLORS[c.complianceStatus]||T.textMut)}>{c.complianceStatus}</span></td>
                  <td style={{...sty.td,...sty.mono}}>{c.eddTriggers}</td>
                  <td style={{...sty.td,...sty.mono}}>{c.lastScreened}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:'4px',marginTop:'12px'}}>
            <button style={{...sty.btn,background:T.surfaceH,color:T.navy}} disabled={compPage===0} onClick={()=>setCompPage(p=>p-1)}>Prev</button>
            {Array.from({length:Math.min(totalPages,7)},(_, i)=>(
              <button key={i} style={{...sty.btn,background:compPage===i?T.navy:T.surfaceH,color:compPage===i?'#fff':T.navy}} onClick={()=>setCompPage(i)}>{i+1}</button>
            ))}
            <button style={{...sty.btn,background:T.surfaceH,color:T.navy}} disabled={compPage>=totalPages-1} onClick={()=>setCompPage(p=>p+1)}>Next</button>
          </div>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Sanctions Screening Workflow</div>
          <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
            {['1. Initial SDN Screening','2. Extended Regime Check (EU/UK/UN)','3. Beneficial Ownership Analysis','4. Secondary Sanctions Assessment','5. Enhanced Due Diligence','6. Compliance Committee Review','7. Board Escalation (if High Risk)'].map((step,i)=>(
              <div key={i} style={{padding:'10px 16px',background:T.surfaceH,borderRadius:'8px',fontSize:'12px',fontWeight:500,color:T.navy,display:'flex',alignItems:'center',gap:'8px'}}>
                <span style={{width:'24px',height:'24px',borderRadius:'50%',background:T.navy,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700}}>{i+1}</span>
                {step.slice(3)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={sty.wrap}>
      <div style={sty.header}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h1 style={sty.title}>Sanctions & Climate Finance</h1><p style={sty.subtitle}>EP-AV1 // Geopolitical sanctions overlay on climate finance flows // {COMPANIES_100.length} companies, {COUNTRIES_60.length} countries</p></div>
          <div style={{...sty.mono,color:T.textMut}}>Updated: 2026-03-29</div>
        </div>
      </div>
      <div style={sty.tabs}>{tabs.map((t,i)=>(<button key={i} style={sty.tab(tab===i)} onClick={()=>{setTab(i);setCompPage(0);}}>{t}</button>))}</div>
      {tab===0&&renderTab0()}
      {tab===1&&renderTab1()}
      {tab===2&&renderTab2()}
      {tab===3&&renderTab3()}
    </div>
  );
}
