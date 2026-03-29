import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Constants ─────────────────────────────────────────── */
const TABS=['Peril Dashboard','Portfolio Loss Analysis','Event Scenario Builder','Reinsurance Structure'];
const PERILS=['Hurricane','Earthquake','Flood','Wildfire','Tornado','Hail','Winter Storm','Tsunami'];
const PERIL_COLORS=[T.navy,T.red,T.sage,'#e97706',T.navyL,T.gold,'#6366f1','#0891b2'];
const COUNTRIES=['United States','Japan','China','United Kingdom','Germany','Australia','Canada','Mexico','India','Brazil','France','Italy','Spain','Philippines','Indonesia','Thailand','Chile','New Zealand','Turkey','South Korea','Netherlands','Switzerland','Norway','Colombia','Peru','South Africa','Nigeria','Kenya','Vietnam','Bangladesh'];
const REGIONS=['North America','Europe','Asia Pacific','Latin America','Africa','Middle East'];
const ASSET_TYPES=['Commercial Property','Residential Property','Industrial','Infrastructure','Agriculture','Marine','Energy','Aviation'];
const OCCUPANCY=['Office','Retail','Warehouse','Manufacturing','Hospital','School','Hotel','Mixed Use'];
const CONSTRUCTION=['Steel Frame','Reinforced Concrete','Wood Frame','Masonry','Light Metal','Pre-Engineered'];

/* ── Seeded Data Generation ────────────────────────────── */
const ASSETS=Array.from({length:100},(_,i)=>{
  const s=sr(i*7+1);const s2=sr(i*7+2);const s3=sr(i*7+3);const s4=sr(i*7+4);const s5=sr(i*7+5);const s6=sr(i*7+6);const s7=sr(i*7+7);
  const country=COUNTRIES[Math.floor(s*COUNTRIES.length)];
  const region=country==='United States'||country==='Canada'||country==='Mexico'?'North America':country==='United Kingdom'||country==='Germany'||country==='France'||country==='Italy'||country==='Spain'||country==='Netherlands'||country==='Switzerland'||country==='Norway'?'Europe':country==='Japan'||country==='China'||country==='India'||country==='Philippines'||country==='Indonesia'||country==='Thailand'||country==='South Korea'||country==='Australia'||country==='New Zealand'||country==='Vietnam'||country==='Bangladesh'?'Asia Pacific':country==='Brazil'||country==='Mexico'||country==='Chile'||country==='Colombia'||country==='Peru'?'Latin America':country==='South Africa'||country==='Nigeria'||country==='Kenya'?'Africa':'Middle East';
  const tiv=Math.round(10+s2*490);
  const primaryPeril=PERILS[Math.floor(s3*PERILS.length)];
  const secondaryPeril=PERILS[Math.floor(s4*PERILS.length)];
  const assetType=ASSET_TYPES[Math.floor(s5*ASSET_TYPES.length)];
  const construction=CONSTRUCTION[Math.floor(s6*CONSTRUCTION.length)];
  const occupancy=OCCUPANCY[Math.floor(s7*OCCUPANCY.length)];
  const aal=+(tiv*0.002+s*tiv*0.008).toFixed(2);
  const pml100=+(tiv*0.15+s2*tiv*0.35).toFixed(1);
  const pml250=+(tiv*0.25+s3*tiv*0.45).toFixed(1);
  const pml500=+(tiv*0.35+s4*tiv*0.55).toFixed(1);
  const lat=+(s5*120-60).toFixed(2);const lon=+(s6*360-180).toFixed(2);
  const vulnerability=Math.round(30+s7*70);
  return {id:i+1,name:`Asset-${String(i+1).padStart(3,'0')}`,country,region,tiv,primaryPeril,secondaryPeril,assetType,construction,occupancy,aal,pml100,pml250,pml500,lat,lon,vulnerability};
});

const PERIL_STATS=PERILS.map((p,i)=>{
  const assets=ASSETS.filter(a=>a.primaryPeril===p);
  const totalTIV=assets.reduce((a,b)=>a+b.tiv,0);
  const totalAAL=assets.reduce((a,b)=>a+b.aal,0);
  const avgPML100=assets.length?assets.reduce((a,b)=>a+b.pml100,0)/assets.length:0;
  const avgPML250=assets.length?assets.reduce((a,b)=>a+b.pml250,0)/assets.length:0;
  const avgPML500=assets.length?assets.reduce((a,b)=>a+b.pml500,0)/assets.length:0;
  const eventCount=Math.round(5+sr(i*13)*25);
  const climateUplift=+(1.05+sr(i*17)*0.45).toFixed(2);
  return {peril:p,color:PERIL_COLORS[i],assetCount:assets.length,totalTIV:Math.round(totalTIV),totalAAL:+totalAAL.toFixed(1),avgPML100:+avgPML100.toFixed(1),avgPML250:+avgPML250.toFixed(1),avgPML500:+avgPML500.toFixed(1),eventCount,climateUplift,lossRatio:+(0.3+sr(i*19)*0.5).toFixed(2)};
});

const OEP_CURVES=PERILS.map((p,pi)=>{
  return [10,25,50,100,200,250,500,1000].map(rp=>{
    const base=PERIL_STATS[pi].totalTIV;
    const factor=0.02+Math.log10(rp)*0.08+sr(pi*31+rp)*0.03;
    return {rp,loss:Math.round(base*factor),peril:p};
  });
});

const AEP_CURVES=PERILS.map((p,pi)=>{
  return [10,25,50,100,200,250,500,1000].map(rp=>{
    const base=PERIL_STATS[pi].totalTIV;
    const factor=0.015+Math.log10(rp)*0.06+sr(pi*37+rp)*0.02;
    return {rp,loss:Math.round(base*factor),peril:p};
  });
});

const HISTORICAL_LOSSES=Array.from({length:20},(_,i)=>{
  const year=2005+i;
  return {year:String(year),actual:Math.round(50+sr(i*41)*400),modelled:Math.round(60+sr(i*43)*380),insured:Math.round(30+sr(i*47)*250)};
});

/* ── Scenario data ────────────────────────────────────── */
const SEVERITY_LEVELS=['Minor (Cat 1-2)','Moderate (Cat 3)','Severe (Cat 4)','Extreme (Cat 5)','Mega Event'];
const SCENARIO_LOCATIONS=['Florida, US','California, US','Tokyo, Japan','London, UK','Sydney, AU','Mumbai, India','Houston, US','Manila, PH','Shanghai, CN','Mexico City, MX'];
const CLIMATE_SSP=['SSP1-2.6 (Low)','SSP2-4.5 (Medium)','SSP3-7.0 (High)','SSP5-8.5 (Very High)'];

/* ── Reinsurance data ─────────────────────────────────── */
const TREATY_TYPES=['Quota Share','Surplus','Excess of Loss','Cat XL','Stop Loss','Aggregate XL'];
const REINSURERS=['Munich Re','Swiss Re','Hannover Re','SCOR','Berkshire','Lloyd\'s','RenaissanceRe','Everest Re','PartnerRe','Arch Capital','Transatlantic','Odyssey Re','Fairfax','Markel','Axis Capital','RGA','Korean Re','China Re','General Re','Tokio Millennium'];
const TREATIES=Array.from({length:40},(_,i)=>{
  const s1=sr(i*53+1);const s2=sr(i*53+2);const s3=sr(i*53+3);const s4=sr(i*53+4);const s5=sr(i*53+5);
  const type=TREATY_TYPES[Math.floor(s1*TREATY_TYPES.length)];
  const reinsurer=REINSURERS[Math.floor(s2*REINSURERS.length)];
  const peril=PERILS[Math.floor(s3*PERILS.length)];
  const limit=Math.round(50+s4*450);
  const retention=Math.round(5+s1*limit*0.3);
  const premium=+(limit*0.02+s5*limit*0.06).toFixed(1);
  const lossRatio=+(0.25+s2*0.55).toFixed(2);
  const ceded=+(premium*0.6+s3*premium*0.3).toFixed(1);
  const recovery=+(premium*lossRatio*0.8).toFixed(1);
  const rateOnLine=+(premium/limit*100).toFixed(2);
  const inception=`${2024-(Math.floor(s4*3))}-${String(1+Math.floor(s5*12)).padStart(2,'0')}-01`;
  const expiry=`${2025+Math.floor(s1*2)}-${String(1+Math.floor(s2*12)).padStart(2,'0')}-01`;
  return {id:i+1,name:`Treaty-${String(i+1).padStart(2,'0')}`,type,reinsurer,peril,limit,retention,premium,lossRatio,ceded,recovery,rateOnLine,inception,expiry,status:s3>0.3?'Active':'Expired',climateAdjFactor:+(1.0+s4*0.35).toFixed(2)};
});

const LAYER_STRUCTURE=[
  {layer:'Layer 1 (Working)',attachment:0,limit:50,premium:12.5,expectedLoss:8.2,rateOnLine:25.0,reinstatements:2},
  {layer:'Layer 2',attachment:50,limit:100,premium:8.4,expectedLoss:4.1,rateOnLine:8.4,reinstatements:2},
  {layer:'Layer 3',attachment:150,limit:150,premium:5.2,expectedLoss:2.0,rateOnLine:3.5,reinstatements:1},
  {layer:'Layer 4',attachment:300,limit:200,premium:3.1,expectedLoss:0.8,rateOnLine:1.55,reinstatements:1},
  {layer:'Layer 5 (Remote)',attachment:500,limit:500,premium:2.8,expectedLoss:0.3,rateOnLine:0.56,reinstatements:0},
  {layer:'Industry Loss Warranty',attachment:0,limit:100,premium:4.2,expectedLoss:1.5,rateOnLine:4.2,reinstatements:1},
];

/* ── Styles ────────────────────────────────────────────── */
const S={
  page:{fontFamily:T.font,background:T.bg,color:T.text,minHeight:'100vh',padding:'24px'},
  header:{marginBottom:20},
  h1:{fontSize:22,fontWeight:700,margin:0,color:T.navy},
  sub:{fontSize:13,color:T.textSec,marginTop:4,fontFamily:T.mono},
  tabs:{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:20},
  tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?T.gold:T.textSec,borderBottom:a?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',background:'none',border:'none',fontFamily:T.font,marginBottom:-2}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:16},
  cardTitle:{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12,display:'flex',alignItems:'center',gap:8},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12},
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:14,textAlign:'center'},
  kpiVal:{fontSize:22,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLbl:{fontSize:11,color:T.textSec,marginTop:4},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap'},
  badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:c===T.red?'#fef2f2':c===T.amber?'#fffbeb':c===T.green?'#f0fdf4':c===T.navy?'#eff6ff':'#f5f3ff',color:c}),
  btn:(a)=>({padding:'6px 14px',fontSize:12,fontWeight:600,borderRadius:6,border:a?'none':`1px solid ${T.border}`,background:a?T.navy:T.surface,color:a?'#fff':T.text,cursor:'pointer',fontFamily:T.font}),
  slider:{width:'100%',accentColor:T.gold},
  select:{padding:'6px 10px',fontSize:12,borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontFamily:T.font},
  scroll:{maxHeight:420,overflowY:'auto'},
  dot:(c)=>({width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}),
  perilBar:{height:6,borderRadius:3,background:T.border,marginTop:4},
  perilFill:(w,c)=>({height:6,borderRadius:3,background:c,width:`${w}%`,transition:'width 0.3s'}),
  chip:(a)=>({display:'inline-block',padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:a?'none':`1px solid ${T.border}`,cursor:'pointer',marginRight:4}),
};

/* ── Component ─────────────────────────────────────────── */
export default function CatastropheModellingPage(){
  const [tab,setTab]=useState(0);
  const [selectedPeril,setSelectedPeril]=useState('All');
  const [selectedRegion,setSelectedRegion]=useState('All');
  const [sortCol,setSortCol]=useState('tiv');
  const [sortDir,setSortDir]=useState('desc');
  const [assetPage,setAssetPage]=useState(0);
  const [curvePeril,setCurvePeril]=useState(0);
  const [curveType,setCurveType]=useState('OEP');
  const [scenarioPeril,setScenarioPeril]=useState(0);
  const [scenarioSeverity,setScenarioSeverity]=useState(3);
  const [scenarioLocation,setScenarioLocation]=useState(0);
  const [climateUplift,setClimateUplift]=useState(20);
  const [ssp,setSsp]=useState(1);
  const [varConfidence,setVarConfidence]=useState(99);
  const [treatyFilter,setTreatyFilter]=useState('All');
  const [treatySort,setTreatySort]=useState('premium');
  const [reinPage,setReinPage]=useState(0);
  const [expandedLayer,setExpandedLayer]=useState(null);

  /* ── Derived ──────────────────────────────────────── */
  const filteredAssets=useMemo(()=>{
    let f=[...ASSETS];
    if(selectedPeril!=='All')f=f.filter(a=>a.primaryPeril===selectedPeril);
    if(selectedRegion!=='All')f=f.filter(a=>a.region===selectedRegion);
    f.sort((a,b)=>sortDir==='asc'?a[sortCol]-b[sortCol]:b[sortCol]-a[sortCol]);
    return f;
  },[selectedPeril,selectedRegion,sortCol,sortDir]);

  const portfolioStats=useMemo(()=>{
    const totalTIV=ASSETS.reduce((a,b)=>a+b.tiv,0);
    const totalAAL=ASSETS.reduce((a,b)=>a+b.aal,0);
    const avgPML100=ASSETS.reduce((a,b)=>a+b.pml100,0)/ASSETS.length;
    const avgVulnerability=ASSETS.reduce((a,b)=>a+b.vulnerability,0)/ASSETS.length;
    const sorted=[...ASSETS].sort((a,b)=>b.pml500-a.pml500);
    const var99=sorted[Math.floor(ASSETS.length*0.01)]?.pml500||0;
    const tvar99=sorted.slice(0,Math.floor(ASSETS.length*0.01)+1).reduce((a,b)=>a+b.pml500,0)/(Math.floor(ASSETS.length*0.01)+1);
    return {totalTIV,totalAAL:+totalAAL.toFixed(1),avgPML100:+avgPML100.toFixed(1),avgVulnerability:Math.round(avgVulnerability),var99:+var99.toFixed(1),tvar99:+tvar99.toFixed(1),assetCount:ASSETS.length,countryCount:new Set(ASSETS.map(a=>a.country)).size};
  },[]);

  const scenarioLoss=useMemo(()=>{
    const baseLoss=portfolioStats.totalTIV*(0.02+scenarioSeverity*0.06);
    const locationMultiplier=0.6+sr(scenarioLocation*71)*0.8;
    const perilMultiplier=0.7+sr(scenarioPeril*67)*0.6;
    const climateMultiplier=1+climateUplift/100;
    const sspMultiplier=[1.0,1.15,1.35,1.6][ssp];
    const gross=Math.round(baseLoss*locationMultiplier*perilMultiplier*climateMultiplier*sspMultiplier);
    const ceded=Math.round(gross*0.45);
    const net=gross-ceded;
    return {gross,ceded,net,affectedAssets:Math.round(10+scenarioSeverity*18),claimsEstimate:Math.round(gross*0.7),biLoss:Math.round(gross*0.15)};
  },[scenarioPeril,scenarioSeverity,scenarioLocation,climateUplift,ssp,portfolioStats.totalTIV]);

  const lossDistribution=useMemo(()=>{
    const buckets=[0,50,100,150,200,250,300,350,400,450,500];
    return buckets.map((b,i)=>{
      const count=ASSETS.filter(a=>a.pml100>=b&&a.pml100<(buckets[i+1]||999)).length;
      return {range:`${b}-${buckets[i+1]||'500+'}`,count,cumulative:ASSETS.filter(a=>a.pml100<=b).length};
    });
  },[]);

  const regionExposure=useMemo(()=>{
    return REGIONS.map(r=>{
      const assets=ASSETS.filter(a=>a.region===r);
      return {region:r,tiv:assets.reduce((a,b)=>a+b.tiv,0),aal:+assets.reduce((a,b)=>a+b.aal,0).toFixed(1),count:assets.length};
    }).sort((a,b)=>b.tiv-a.tiv);
  },[]);

  const filteredTreaties=useMemo(()=>{
    let f=[...TREATIES];
    if(treatyFilter!=='All')f=f.filter(t=>t.type===treatyFilter);
    f.sort((a,b)=>b[treatySort]-a[treatySort]);
    return f;
  },[treatyFilter,treatySort]);

  const scenarioCascade=useMemo(()=>{
    return Array.from({length:8},(_,i)=>{
      const day=i*3+1;
      const factor=Math.min(1,i/7);
      return {day:`Day ${day}`,grossLoss:Math.round(scenarioLoss.gross*factor),insuredLoss:Math.round(scenarioLoss.gross*factor*0.7),biLoss:Math.round(scenarioLoss.biLoss*factor),ceded:Math.round(scenarioLoss.ceded*factor)};
    });
  },[scenarioLoss]);

  const PAGE_SIZE=15;
  const assetPages=Math.ceil(filteredAssets.length/PAGE_SIZE);
  const pagedAssets=filteredAssets.slice(assetPage*PAGE_SIZE,(assetPage+1)*PAGE_SIZE);
  const treatyPages=Math.ceil(filteredTreaties.length/PAGE_SIZE);
  const pagedTreaties=filteredTreaties.slice(reinPage*PAGE_SIZE,(reinPage+1)*PAGE_SIZE);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  /* ── Tab 1: Peril Dashboard ──────────────────────── */
  const renderPerilDashboard=()=>(
    <div>
      <div style={S.grid4}>
        {[{l:'Total TIV',v:`$${(portfolioStats.totalTIV/1000).toFixed(1)}B`},{l:'Portfolio AAL',v:`$${portfolioStats.totalAAL}M`},{l:'Assets',v:portfolioStats.assetCount},{l:'Countries',v:portfolioStats.countryCount},{l:'Avg PML 1-in-100',v:`$${portfolioStats.avgPML100}M`},{l:'Avg Vulnerability',v:`${portfolioStats.avgVulnerability}/100`},{l:'VaR 99%',v:`$${portfolioStats.var99}M`},{l:'TVaR 99%',v:`$${portfolioStats.tvar99}M`}].map((k,i)=>(
          <div key={i} style={S.kpi}><div style={S.kpiVal}>{k.v}</div><div style={S.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={{...S.grid2,marginTop:16}}>
        <div style={S.card}>
          <div style={S.cardTitle}>AAL by Peril</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={PERIL_STATS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="peril" tick={{fontSize:10}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Bar dataKey="totalAAL" name="AAL ($M)">{PERIL_STATS.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Exceedance Probability Curve — {PERILS[curvePeril]}</div>
          <div style={{display:'flex',gap:4,marginBottom:10,flexWrap:'wrap'}}>
            {PERILS.map((p,i)=><button key={p} style={S.chip(i===curvePeril)} onClick={()=>setCurvePeril(i)}>{p}</button>)}
          </div>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            {['OEP','AEP'].map(t=><button key={t} style={S.btn(curveType===t)} onClick={()=>setCurveType(t)}>{t}</button>)}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={curveType==='OEP'?OEP_CURVES[curvePeril]:AEP_CURVES[curvePeril]}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="rp" tick={{fontSize:10}} label={{value:'Return Period (years)',position:'insideBottom',offset:-5,fontSize:10}}/><YAxis tick={{fontSize:10}} label={{value:'Loss ($M)',angle:-90,position:'insideLeft',fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Line type="monotone" dataKey="loss" stroke={PERIL_COLORS[curvePeril]} strokeWidth={2} dot={{r:4}}/></LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Peril Summary Table</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{['Peril','Assets','TIV ($M)','AAL ($M)','PML 100yr','PML 250yr','PML 500yr','Events','Climate Uplift','Loss Ratio'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{PERIL_STATS.map((p,i)=>(
              <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                <td style={S.td}><span style={{...S.dot(p.color),marginRight:6}}/>{p.peril}</td>
                <td style={S.td}>{p.assetCount}</td>
                <td style={S.td}>{p.totalTIV.toLocaleString()}</td>
                <td style={S.td}>{p.totalAAL}</td>
                <td style={S.td}>{p.avgPML100}</td>
                <td style={S.td}>{p.avgPML250}</td>
                <td style={S.td}>{p.avgPML500}</td>
                <td style={S.td}>{p.eventCount}</td>
                <td style={S.td}><span style={S.badge(p.climateUplift>1.3?T.red:p.climateUplift>1.15?T.amber:T.green)}>{(p.climateUplift*100-100).toFixed(0)}%</span></td>
                <td style={S.td}><span style={S.badge(p.lossRatio>0.6?T.red:p.lossRatio>0.4?T.amber:T.green)}>{(p.lossRatio*100).toFixed(0)}%</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Historical vs Modelled Losses (2005-2024)</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={HISTORICAL_LOSSES}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Legend wrapperStyle={{fontSize:11}}/><Area type="monotone" dataKey="actual" name="Actual Loss" stroke={T.red} fill={T.red} fillOpacity={0.15}/><Area type="monotone" dataKey="modelled" name="Modelled Loss" stroke={T.navy} fill={T.navy} fillOpacity={0.15}/><Area type="monotone" dataKey="insured" name="Insured Loss" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/></AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Regional Exposure Distribution</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={regionExposure} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10}}/><YAxis dataKey="region" type="category" tick={{fontSize:10}} width={100}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="tiv" name="TIV ($M)" fill={T.navy}/><Bar dataKey="aal" name="AAL ($M)" fill={T.gold}/></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  /* ── Tab 2: Portfolio Loss Analysis ──────────────── */
  const renderPortfolioLoss=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <select style={S.select} value={selectedPeril} onChange={e=>{setSelectedPeril(e.target.value);setAssetPage(0);}}>
          <option value="All">All Perils</option>{PERILS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <select style={S.select} value={selectedRegion} onChange={e=>{setSelectedRegion(e.target.value);setAssetPage(0);}}>
          <option value="All">All Regions</option>{REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{fontSize:12,color:T.textSec}}>{filteredAssets.length} assets | TIV ${filteredAssets.reduce((a,b)=>a+b.tiv,0).toLocaleString()}M</span>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Loss Distribution (PML 1-in-100)</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={lossDistribution}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="range" tick={{fontSize:9}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Bar dataKey="count" name="Asset Count" fill={T.navy}>{lossDistribution.map((e,i)=><Cell key={i} fill={i>6?T.red:i>4?T.amber:T.sage}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Tail Risk Metrics</div>
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <span style={{fontSize:11,color:T.textSec}}>Confidence Level:</span>
            {[95,99,99.5].map(c=><button key={c} style={S.btn(varConfidence===c)} onClick={()=>setVarConfidence(c)}>{c}%</button>)}
          </div>
          <div style={S.grid2}>
            {[{l:`VaR ${varConfidence}%`,v:`$${(portfolioStats.var99*(varConfidence/99)).toFixed(1)}M`,d:'Maximum probable loss at confidence level'},{l:`TVaR ${varConfidence}%`,v:`$${(portfolioStats.tvar99*(varConfidence/99)).toFixed(1)}M`,d:'Average loss exceeding VaR'},{l:'Standard Deviation',v:`$${(portfolioStats.totalAAL*0.6).toFixed(1)}M`,d:'Volatility of annual losses'},{l:'Max Single Event',v:`$${(portfolioStats.var99*1.8).toFixed(1)}M`,d:'Worst-case single event loss'}].map((m,i)=>(
              <div key={i} style={{...S.kpi,textAlign:'left',padding:12}}>
                <div style={{fontSize:11,color:T.textSec}}>{m.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{m.v}</div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{m.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Asset Portfolio ({filteredAssets.length} assets)</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{[['name','Asset'],['country','Country'],['assetType','Type'],['primaryPeril','Primary Peril'],['tiv','TIV ($M)'],['aal','AAL ($M)'],['pml100','PML 100yr'],['pml250','PML 250yr'],['pml500','PML 500yr'],['vulnerability','Vuln.']].map(([k,h])=>(
              <th key={k} style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort(k)}>{h}{sortCol===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
            ))}</tr></thead>
            <tbody>{pagedAssets.map((a,i)=>(
              <tr key={a.id} style={{background:i%2?T.surfaceH:'transparent'}}>
                <td style={S.td}>{a.name}</td><td style={S.td}>{a.country}</td><td style={S.td}>{a.assetType}</td>
                <td style={S.td}><span style={S.badge(PERIL_COLORS[PERILS.indexOf(a.primaryPeril)])}>{a.primaryPeril}</span></td>
                <td style={{...S.td,fontWeight:600}}>{a.tiv}</td><td style={S.td}>{a.aal}</td>
                <td style={S.td}>{a.pml100}</td><td style={S.td}>{a.pml250}</td><td style={S.td}>{a.pml500}</td>
                <td style={S.td}><span style={S.badge(a.vulnerability>70?T.red:a.vulnerability>40?T.amber:T.green)}>{a.vulnerability}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:8,marginTop:10,alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:T.textSec}}>Page {assetPage+1} of {assetPages}</span>
          <div style={{display:'flex',gap:4}}>
            <button style={S.btn(false)} disabled={assetPage===0} onClick={()=>setAssetPage(p=>p-1)}>← Prev</button>
            <button style={S.btn(false)} disabled={assetPage>=assetPages-1} onClick={()=>setAssetPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>TIV vs AAL Scatter (Size = Vulnerability)</div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="tiv" name="TIV ($M)" tick={{fontSize:10}}/><YAxis dataKey="aal" name="AAL ($M)" tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}} formatter={(v,n)=>[`$${v}M`,n]}/><Scatter data={filteredAssets.slice(0,80)} fill={T.navy} fillOpacity={0.6}/></ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  /* ── Tab 3: Event Scenario Builder ───────────────── */
  const renderScenarioBuilder=()=>(
    <div>
      <div style={S.grid3}>
        <div style={S.card}>
          <div style={S.cardTitle}>Scenario Configuration</div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Peril</label>
            <select style={{...S.select,width:'100%'}} value={scenarioPeril} onChange={e=>setScenarioPeril(+e.target.value)}>
              {PERILS.map((p,i)=><option key={p} value={i}>{p}</option>)}
            </select>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Severity: {SEVERITY_LEVELS[scenarioSeverity]}</label>
            <input type="range" min={0} max={4} value={scenarioSeverity} onChange={e=>setScenarioSeverity(+e.target.value)} style={S.slider}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Location</label>
            <select style={{...S.select,width:'100%'}} value={scenarioLocation} onChange={e=>setScenarioLocation(+e.target.value)}>
              {SCENARIO_LOCATIONS.map((l,i)=><option key={l} value={i}>{l}</option>)}
            </select>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>Climate Uplift: +{climateUplift}%</label>
            <input type="range" min={0} max={100} value={climateUplift} onChange={e=>setClimateUplift(+e.target.value)} style={S.slider}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:T.textSec,display:'block',marginBottom:4}}>SSP Pathway</label>
            <select style={{...S.select,width:'100%'}} value={ssp} onChange={e=>setSsp(+e.target.value)}>
              {CLIMATE_SSP.map((s,i)=><option key={s} value={i}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Scenario Impact Summary</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{l:'Gross Loss',v:`$${scenarioLoss.gross.toLocaleString()}M`,c:T.red},{l:'Ceded Loss',v:`$${scenarioLoss.ceded.toLocaleString()}M`,c:T.navy},{l:'Net Loss',v:`$${scenarioLoss.net.toLocaleString()}M`,c:T.amber},{l:'Affected Assets',v:scenarioLoss.affectedAssets,c:T.sage},{l:'Claims Estimate',v:`$${scenarioLoss.claimsEstimate.toLocaleString()}M`,c:T.gold},{l:'BI Loss',v:`$${scenarioLoss.biLoss.toLocaleString()}M`,c:T.navyL}].map((m,i)=>(
              <div key={i} style={{padding:10,background:T.surfaceH,borderRadius:6,borderLeft:`3px solid ${m.c}`}}>
                <div style={{fontSize:10,color:T.textSec}}>{m.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:m.c,fontFamily:T.mono}}>{m.v}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:10,background:'#fef2f2',borderRadius:6,fontSize:11,color:T.red}}>
            ⚠ Climate change uplift adds +{climateUplift}% to baseline loss under {CLIMATE_SSP[ssp]}. Net retention: ${scenarioLoss.net.toLocaleString()}M ({((scenarioLoss.net/scenarioLoss.gross)*100).toFixed(1)}% of gross).
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Severity Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SEVERITY_LEVELS.map((s,i)=>({severity:s.split(' ')[0],gross:Math.round(scenarioLoss.gross*(0.2+i*0.2)),probability:+(100/(2+i*3)).toFixed(1)}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="severity" tick={{fontSize:9}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Bar dataKey="gross" name="Gross Loss ($M)" fill={T.red}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Loss Cascade Timeline — {PERILS[scenarioPeril]} at {SCENARIO_LOCATIONS[scenarioLocation]}</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={scenarioCascade}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="day" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Legend wrapperStyle={{fontSize:11}}/><Area type="monotone" dataKey="grossLoss" name="Gross Loss ($M)" stroke={T.red} fill={T.red} fillOpacity={0.2}/><Area type="monotone" dataKey="insuredLoss" name="Insured Loss ($M)" stroke={T.navy} fill={T.navy} fillOpacity={0.15}/><Area type="monotone" dataKey="biLoss" name="BI Loss ($M)" stroke={T.amber} fill={T.amber} fillOpacity={0.15}/><Area type="monotone" dataKey="ceded" name="Ceded ($M)" stroke={T.sage} fill={T.sage} fillOpacity={0.15}/></AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Climate Change Factor by Peril</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={PERIL_STATS.map(p=>({peril:p.peril,current:100,uplift:Math.round((p.climateUplift-1)*100*(1+climateUplift/100))}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="peril" tick={{fontSize:9}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="current" name="Baseline" stackId="a" fill={T.navy}/><Bar dataKey="uplift" name="Climate Uplift" stackId="a" fill={T.red}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Multi-Year Projection ({CLIMATE_SSP[ssp]})</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[2025,2030,2035,2040,2045,2050].map(y=>{
              const factor=1+(y-2025)*([0.005,0.01,0.018,0.025][ssp]);
              return {year:y,aal:Math.round(portfolioStats.totalAAL*factor),pml:Math.round(portfolioStats.var99*factor)};
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Legend wrapperStyle={{fontSize:11}}/><Line type="monotone" dataKey="aal" name="Projected AAL ($M)" stroke={T.navy} strokeWidth={2}/><Line type="monotone" dataKey="pml" name="Projected PML ($M)" stroke={T.red} strokeWidth={2} strokeDasharray="5 5"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ── Tab 4: Reinsurance Structure ────────────────── */
  const renderReinsurance=()=>(
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Reinsurance Layer Structure</div>
        <div style={{display:'flex',flexDirection:'column',gap:2,marginBottom:16}}>
          {LAYER_STRUCTURE.map((l,i)=>{
            const width=Math.min(100,l.limit/5);
            return (
              <div key={i} style={{cursor:'pointer'}} onClick={()=>setExpandedLayer(expandedLayer===i?null:i)}>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:8,background:expandedLayer===i?T.surfaceH:T.surface,borderRadius:6,border:`1px solid ${T.border}`}}>
                  <div style={{width:140,fontSize:11,fontWeight:600}}>{l.layer}</div>
                  <div style={{flex:1}}>
                    <div style={{height:20,borderRadius:4,background:T.border,position:'relative'}}>
                      <div style={{height:20,borderRadius:4,background:`linear-gradient(90deg,${T.navy},${T.navyL})`,width:`${width}%`,display:'flex',alignItems:'center',paddingLeft:6}}>
                        <span style={{fontSize:9,color:'#fff',fontFamily:T.mono}}>${l.limit}M xs ${l.attachment}M</span>
                      </div>
                    </div>
                  </div>
                  <div style={{width:80,fontSize:11,fontFamily:T.mono,textAlign:'right'}}>${l.premium}M</div>
                  <div style={{width:80,fontSize:11,textAlign:'right'}}><span style={S.badge(l.rateOnLine>10?T.red:l.rateOnLine>3?T.amber:T.green)}>{l.rateOnLine}% ROL</span></div>
                </div>
                {expandedLayer===i&&(
                  <div style={{padding:12,background:T.surfaceH,borderRadius:'0 0 6px 6px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,fontSize:11}}>
                    <div><span style={{color:T.textSec}}>Expected Loss:</span> <strong>${l.expectedLoss}M</strong></div>
                    <div><span style={{color:T.textSec}}>Rate on Line:</span> <strong>{l.rateOnLine}%</strong></div>
                    <div><span style={{color:T.textSec}}>Reinstatements:</span> <strong>{l.reinstatements}</strong></div>
                    <div><span style={{color:T.textSec}}>Loss Ratio:</span> <strong>{((l.expectedLoss/l.premium)*100).toFixed(1)}%</strong></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <select style={S.select} value={treatyFilter} onChange={e=>{setTreatyFilter(e.target.value);setReinPage(0);}}>
          <option value="All">All Types</option>{TREATY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:T.textSec}}>Sort:</span>
        {['premium','limit','lossRatio','rateOnLine'].map(s=><button key={s} style={S.btn(treatySort===s)} onClick={()=>setTreatySort(s)}>{s==='rateOnLine'?'ROL':s.charAt(0).toUpperCase()+s.slice(1)}</button>)}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Treaty Portfolio ({filteredTreaties.length} treaties)</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{['Treaty','Type','Reinsurer','Peril','Limit ($M)','Retention ($M)','Premium ($M)','ROL','Loss Ratio','Climate Adj','Status'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{pagedTreaties.map((t,i)=>(
              <tr key={t.id} style={{background:i%2?T.surfaceH:'transparent'}}>
                <td style={S.td}>{t.name}</td><td style={S.td}>{t.type}</td><td style={S.td}>{t.reinsurer}</td>
                <td style={S.td}><span style={S.badge(PERIL_COLORS[PERILS.indexOf(t.peril)]||T.navy)}>{t.peril}</span></td>
                <td style={{...S.td,fontWeight:600}}>{t.limit}</td><td style={S.td}>{t.retention}</td><td style={S.td}>{t.premium}</td>
                <td style={S.td}>{t.rateOnLine}%</td>
                <td style={S.td}><span style={S.badge(t.lossRatio>0.6?T.red:t.lossRatio>0.4?T.amber:T.green)}>{(t.lossRatio*100).toFixed(0)}%</span></td>
                <td style={S.td}><span style={S.badge(t.climateAdjFactor>1.25?T.red:t.climateAdjFactor>1.1?T.amber:T.green)}>x{t.climateAdjFactor}</span></td>
                <td style={S.td}><span style={S.badge(t.status==='Active'?T.green:T.textMut)}>{t.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:8,marginTop:10,alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:T.textSec}}>Page {reinPage+1} of {treatyPages}</span>
          <div style={{display:'flex',gap:4}}>
            <button style={S.btn(false)} disabled={reinPage===0} onClick={()=>setReinPage(p=>p-1)}>← Prev</button>
            <button style={S.btn(false)} disabled={reinPage>=treatyPages-1} onClick={()=>setReinPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Ceded Premium by Type</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={TREATY_TYPES.map(t=>{
              const treaties=TREATIES.filter(tr=>tr.type===t);
              return {type:t,premium:+treaties.reduce((a,b)=>a+b.premium,0).toFixed(1),recovery:+treaties.reduce((a,b)=>a+b.recovery,0).toFixed(1)};
            })}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:9}} angle={-15} textAnchor="end" height={50}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="premium" name="Premium ($M)" fill={T.navy}/><Bar dataKey="recovery" name="Recovery ($M)" fill={T.sage}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Reinsurer Concentration</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={REINSURERS.slice(0,10).map(r=>{
              const treaties=TREATIES.filter(t=>t.reinsurer===r);
              return {reinsurer:r.split(' ')[0],limit:treaties.reduce((a,b)=>a+b.limit,0),count:treaties.length};
            }).sort((a,b)=>b.limit-a.limit)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10}}/><YAxis dataKey="reinsurer" type="category" tick={{fontSize:10}} width={80}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Bar dataKey="limit" name="Total Limit ($M)" fill={T.gold}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>Catastrophe Modelling & Peril Analytics</h1>
        <div style={S.sub}>EP-AR1 · {ASSETS.length} insured assets · {PERILS.length} perils · {COUNTRIES.length} countries · AAL/PML/OEP/AEP analytics</div>
      </div>
      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>
      {tab===0&&renderPerilDashboard()}
      {tab===1&&renderPortfolioLoss()}
      {tab===2&&renderScenarioBuilder()}
      {tab===3&&renderReinsurance()}
    </div>
  );
}
