import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend, ScatterChart, Scatter
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11};

const TABS=['Asset Monitoring','Methane Intelligence','Deforestation Watch','Portfolio Satellite Overlay'];
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COUNTRIES=['United States','Brazil','China','India','Indonesia','Russia','Canada','Australia',
  'Nigeria','Saudi Arabia','Norway','Germany','United Kingdom','South Africa','Mexico','Argentina',
  'Colombia','DR Congo','Malaysia','Chile'];
const SAT_TYPES=['Optical Imaging','SAR Radar','Methane Spectral','Thermal Infrared','Multispectral'];
const ASSET_TYPES=['Coal Power Plant','Gas Power Plant','Oil Refinery','Iron Ore Mine','Copper Mine',
  'Cement Plant','Steel Mill','LNG Terminal','Palm Oil Mill','Cattle Ranch','Soy Farm','Pulp Mill',
  'Chemical Plant','Aluminium Smelter','Gold Mine','Solar Farm','Wind Farm','Biomass Plant',
  'Forest Reserve','Industrial Park'];
const OWNERS=['ExxonMobil','Shell','TotalEnergies','Chevron','BP','Glencore','BHP','Rio Tinto',
  'Vale','Saudi Aramco','Petrobras','CNOOC','Sinopec','Gazprom','Equinor','ArcelorMittal',
  'HeidelbergCement','Sinar Mas','JBS','Cargill','Wilmar','BASF','Dow Chemical','Nucor Steel',
  'Freeport-McMoRan','Barrick Gold','Vestas','NextEra','Enel','Iberdrola'];
const RISK_TIERS=['Critical','High','Medium','Low'];
const COMMODITIES=['Palm Oil','Soy','Cattle','Cocoa','Timber'];
const SECTORS_OG=['Upstream Production','Midstream Pipeline','LNG Processing',
  'Downstream Refining','Storage & Distribution'];

/* =================== DATA GENERATION =================== */
const ASSETS=Array.from({length:100},(_,i)=>{
  const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);const s4=sr(i*23);const s5=sr(i*31);
  const tier=s<0.1?'Critical':s<0.35?'High':s<0.7?'Medium':'Low';
  const anomalies=tier==='Critical'?Math.floor(8+s2*12):tier==='High'?Math.floor(4+s2*6):
    tier==='Medium'?Math.floor(1+s2*3):Math.floor(s2*2);
  const daysAgo=Math.floor(1+s3*14);
  const scanDate=new Date(2026,2,28-daysAgo);
  const baseEmission=50+sr(i*43)*200;
  return{
    id:i+1,
    asset:`${ASSET_TYPES[Math.floor(s4*ASSET_TYPES.length)]}-${String(i+1).padStart(3,'0')}`,
    assetType:ASSET_TYPES[Math.floor(s4*ASSET_TYPES.length)],
    owner:OWNERS[Math.floor(s5*OWNERS.length)],
    country:COUNTRIES[Math.floor(sr(i*37)*COUNTRIES.length)],
    satType:SAT_TYPES[Math.floor(sr(i*41)*SAT_TYPES.length)],
    lastScan:scanDate.toISOString().split('T')[0],
    anomalies,
    riskTier:tier,
    emissionsTrend:Array.from({length:12},(_,m)=>({
      month:MONTHS[m],
      value:parseFloat((baseEmission+sr((i+1)*(m+1)*3)*80-40).toFixed(1)),
      baseline:parseFloat((baseEmission*0.8).toFixed(1)),
    })),
    anomalyTimeline:Array.from({length:12},(_,m)=>({
      month:`M${m+1}`,
      count:Math.floor(sr((i+1)*(m+1)*7)*5),
      severity:sr((i+1)*(m+1)*11)<0.3?'High':'Normal',
    })),
    coverageHistory:Array.from({length:12},(_,m)=>({
      month:`M${m+1}`,
      passes:Math.floor(2+sr((i+1)*(m+1)*11)*8),
      resolution:parseFloat((1+sr((i+1)*(m+1)*17)*4).toFixed(1)),
    })),
    lat:parseFloat((-60+sr(i*53)*120).toFixed(2)),
    lon:parseFloat((-170+sr(i*59)*340).toFixed(2)),
    ndvi:parseFloat((0.2+sr(i*61)*0.6).toFixed(2)),
    thermalAnomaly:sr(i*67)>0.7,
    dataQuality:parseFloat((60+sr(i*71)*39).toFixed(0)),
  };
});

const METHANE_FACILITIES=Array.from({length:40},(_,i)=>{
  const s=sr(i*17);const s2=sr(i*23);const s3=sr(i*29);
  const leakRate=parseFloat((0.5+s*80).toFixed(2));
  const isSuperEmitter=leakRate>25;
  return{
    id:i+1,
    facility:`O&G-Facility-${String(i+1).padStart(3,'0')}`,
    operator:OWNERS[Math.floor(s2*10)],
    country:COUNTRIES[Math.floor(s3*10)],
    leakRate,
    isSuperEmitter,
    co2eGWP100:parseFloat((leakRate*28).toFixed(1)),
    co2eGWP20:parseFloat((leakRate*84).toFixed(1)),
    sector:SECTORS_OG[Math.floor(sr(i*37)*5)],
    sectorBenchmark:parseFloat((5+sr(i*43)*15).toFixed(1)),
    euCompliant:leakRate<10,
    detectionConfidence:parseFloat((70+sr(i*47)*29).toFixed(0)),
    plumeSizeKm2:parseFloat((0.01+sr(i*51)*2).toFixed(2)),
    windSpeed:parseFloat((2+sr(i*53)*12).toFixed(1)),
    monthlyLeaks:Array.from({length:12},(_,m)=>({
      month:MONTHS[m],
      detected:Math.floor(1+sr((i+1)*(m+1)*13)*8),
      rate:parseFloat((0.5+sr((i+1)*(m+1)*17)*40).toFixed(1)),
      plumes:Math.floor(sr((i+1)*(m+1)*19)*6),
    })),
    regulatoryHistory:[
      {date:'2025-06',action:'Initial Assessment',status:'Completed'},
      {date:'2025-09',action:leakRate>15?'Enforcement Warning':'Monitoring',status:leakRate>15?'Active':'Closed'},
      {date:'2026-01',action:isSuperEmitter?'Super-Emitter Flag':'Routine Check',status:isSuperEmitter?'Open':'Closed'},
    ],
  };
}).sort((a,b)=>b.leakRate-a.leakRate);

const FOREST_ZONES=Array.from({length:30},(_,i)=>{
  const s=sr(i*11);const s2=sr(i*19);const s3=sr(i*23);const s4=sr(i*29);
  const hectaresLost=parseFloat((50+s*4950).toFixed(0));
  const severity=hectaresLost>3000?'Critical':hectaresLost>1500?'High':hectaresLost>500?'Medium':'Low';
  const regions=['Amazon Basin','Borneo Lowlands','Congo Basin','Cerrado','Chaco',
    'Sumatra','Papua','Mekong Delta','West Africa','Central America'];
  const countries=['Brazil','Indonesia','DR Congo','Argentina','Colombia',
    'Malaysia','Papua New Guinea','Vietnam','Ghana','Guatemala'];
  return{
    id:i+1,
    zone:`Zone-${String(i+1).padStart(3,'0')}`,
    region:regions[Math.floor(s2*10)],
    country:countries[Math.floor(s3*10)],
    commodity:COMMODITIES[Math.floor(s4*COMMODITIES.length)],
    hectaresLost,
    monthlyRate:parseFloat((hectaresLost/12).toFixed(1)),
    severity,
    eudrCompliant:hectaresLost<500,
    linkedCompanies:Array.from({length:Math.floor(2+sr(i*31)*4)},(_,j)=>
      OWNERS[Math.floor(sr((i+1)*(j+1)*37)*OWNERS.length)]),
    treeCoverPct:parseFloat((30+sr(i*41)*60).toFixed(1)),
    biomassCarbon:parseFloat((50+sr(i*43)*200).toFixed(0)),
    fireHotspots:Math.floor(sr(i*47)*25),
    monthlyTrend:Array.from({length:12},(_,m)=>({
      month:MONTHS[m],
      loss:parseFloat((10+sr((i+1)*(m+1)*7)*500).toFixed(0)),
      fires:Math.floor(sr((i+1)*(m+1)*11)*10),
    })),
    regulatoryAction:severity==='Critical'?'Immediate Investigation Required':
      severity==='High'?'Enhanced Monitoring':severity==='Medium'?'Standard Review':'No Action',
    supplyChainRisk:severity==='Critical'?92:severity==='High'?74:severity==='Medium'?48:22,
  };
});

const PORTFOLIO_COMPANIES=Array.from({length:30},(_,i)=>{
  const s=sr(i*13);const s2=sr(i*17);const s3=sr(i*23);const s4=sr(i*29);
  const reportedEmissions=parseFloat((100+s*900).toFixed(0));
  const satelliteEmissions=parseFloat((reportedEmissions*(0.85+s2*0.6)).toFixed(0));
  const discrepancy=parseFloat((((satelliteEmissions-reportedEmissions)/reportedEmissions)*100).toFixed(1));
  const sectors=['Oil & Gas','Mining','Utilities','Materials','Agriculture','Industrials'];
  return{
    id:i+1,
    company:OWNERS[i%OWNERS.length],
    sector:sectors[Math.floor(s3*6)],
    hasSatMonitoring:s4>0.2,
    satRiskScore:parseFloat((10+sr(i*31)*80).toFixed(0)),
    reportedEmissions,
    satelliteEmissions,
    discrepancy,
    flagged:discrepancy>20,
    coverageGap:s4<=0.2,
    recommendation:discrepancy>30?'Engage: Major discrepancy \u2014 request restatement':
      discrepancy>20?'Monitor: Elevated discrepancy \u2014 enhanced due diligence':
      discrepancy>10?'Watch: Moderate variance \u2014 routine follow-up':
      'Acceptable: Within tolerance',
    weight:parseFloat((1+sr(i*37)*8).toFixed(1)),
    scope1:parseFloat((reportedEmissions*0.6).toFixed(0)),
    scope2:parseFloat((reportedEmissions*0.25).toFixed(0)),
    scope3est:parseFloat((reportedEmissions*0.15).toFixed(0)),
    lastVerified:new Date(2025,Math.floor(6+sr(i*41)*5),Math.floor(1+sr(i*43)*27)).toISOString().split('T')[0],
    dataSource:s4>0.5?'Sentinel-5P':s4>0.3?'GHGSat':'Landsat-9',
  };
});

/* =================== HELPER COMPONENTS =================== */
const tierColor=t=>t==='Critical'?T.red:t==='High'?T.amber:t==='Medium'?T.gold:T.green;
const sevColor=s=>s==='Critical'?T.red:s==='High'?T.amber:s==='Medium'?T.gold:T.green;

const Card=({children,style})=>(
  <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,...style}}>
    {children}
  </div>
);

const Badge=({label,color})=>(
  <span style={{display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,
    fontWeight:600,background:`${color}18`,color,fontFamily:T.font}}>{label}</span>
);

const Stat=({label,value,sub,color})=>(
  <div style={{textAlign:'center'}}>
    <div style={{fontSize:11,color:T.textMut,fontFamily:T.font,marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:T.textSec,marginTop:2}}>{sub}</div>}
  </div>
);

const MiniBar=({value,max,color})=>(
  <div style={{display:'flex',alignItems:'center',gap:6}}>
    <div style={{width:50,height:6,borderRadius:3,background:T.bg,overflow:'hidden'}}>
      <div style={{width:`${Math.min((value/max)*100,100)}%`,height:'100%',borderRadius:3,background:color||T.sage}}/>
    </div>
    <span style={{fontFamily:T.mono,fontSize:10}}>{value}</span>
  </div>
);

const FilterBar=({filters})=>(
  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
    {Object.entries(filters).map(([key,{options,value,setter}])=>(
      <select key={key} value={value} onChange={e=>setter(e.target.value)}
        style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,
          fontFamily:T.font,color:T.text,background:T.surface,cursor:'pointer'}}>
        <option value="">{key}</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    ))}
  </div>
);

const SectionTitle=({children})=>(
  <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.font}}>{children}</div>
);

/* =================== MAIN COMPONENT =================== */
export default function SatelliteClimateMonitorPage(){
  const [tab,setTab]=useState(0);
  const [selectedAsset,setSelectedAsset]=useState(null);
  const [filterCountry,setFilterCountry]=useState('');
  const [filterType,setFilterType]=useState('');
  const [filterTier,setFilterTier]=useState('');
  const [filterSat,setFilterSat]=useState('');
  const [selectedFacility,setSelectedFacility]=useState(null);
  const [methaneAlertThreshold,setMethaneAlertThreshold]=useState(25);
  const [selectedZone,setSelectedZone]=useState(null);
  const [filterCommodity,setFilterCommodity]=useState('');
  const [assetSearch,setAssetSearch]=useState('');
  const [sortField,setSortField]=useState('anomalies');
  const [sortDir,setSortDir]=useState('desc');
  const [flaggedAssets,setFlaggedAssets]=useState({});

  const filteredAssets=useMemo(()=>{
    let result=ASSETS.filter(a=>{
      if(filterCountry&&a.country!==filterCountry)return false;
      if(filterType&&a.assetType!==filterType)return false;
      if(filterTier&&a.riskTier!==filterTier)return false;
      if(filterSat&&a.satType!==filterSat)return false;
      if(assetSearch&&!a.asset.toLowerCase().includes(assetSearch.toLowerCase())&&
        !a.owner.toLowerCase().includes(assetSearch.toLowerCase()))return false;
      return true;
    });
    result.sort((a,b)=>{
      const av=a[sortField],bv=b[sortField];
      if(typeof av==='number')return sortDir==='desc'?bv-av:av-bv;
      return sortDir==='desc'?String(bv).localeCompare(String(av)):String(av).localeCompare(String(bv));
    });
    return result;
  },[filterCountry,filterType,filterTier,filterSat,assetSearch,sortField,sortDir]);

  const filteredZones=useMemo(()=>FOREST_ZONES.filter(z=>{
    if(filterCommodity&&z.commodity!==filterCommodity)return false;
    return true;
  }),[filterCommodity]);

  const summaryStats=useMemo(()=>{
    const critical=ASSETS.filter(a=>a.riskTier==='Critical').length;
    const high=ASSETS.filter(a=>a.riskTier==='High').length;
    const medium=ASSETS.filter(a=>a.riskTier==='Medium').length;
    const totalAnomalies=ASSETS.reduce((s,a)=>s+a.anomalies,0);
    const superEmitters=METHANE_FACILITIES.filter(f=>f.isSuperEmitter).length;
    const avgDataQuality=parseFloat((ASSETS.reduce((s,a)=>s+a.dataQuality,0)/100).toFixed(0));
    return{critical,high,medium,totalAnomalies,superEmitters,avgDataQuality};
  },[]);

  const methaneMonthlyAgg=useMemo(()=>{
    return MONTHS.map((m,mi)=>{
      const total=METHANE_FACILITIES.reduce((s,f)=>s+f.monthlyLeaks[mi].detected,0);
      const avgRate=parseFloat((METHANE_FACILITIES.reduce((s,f)=>s+f.monthlyLeaks[mi].rate,0)/40).toFixed(1));
      const totalPlumes=METHANE_FACILITIES.reduce((s,f)=>s+f.monthlyLeaks[mi].plumes,0);
      return{month:m,totalLeaks:total,avgRate,totalPlumes};
    });
  },[]);

  const sectorBenchmarks=useMemo(()=>{
    return SECTORS_OG.map(sec=>{
      const facs=METHANE_FACILITIES.filter(f=>f.sector===sec);
      const avg=facs.length?parseFloat((facs.reduce((s,f)=>s+f.leakRate,0)/facs.length).toFixed(1)):0;
      const max=facs.length?parseFloat(Math.max(...facs.map(f=>f.leakRate)).toFixed(1)):0;
      return{sector:sec,avgLeakRate:avg,maxLeakRate:max,facilityCount:facs.length};
    });
  },[]);

  const deforestationByComm=useMemo(()=>{
    return COMMODITIES.map(c=>{
      const zones=FOREST_ZONES.filter(z=>z.commodity===c);
      const total=zones.reduce((s,z)=>s+z.hectaresLost,0);
      const avgSeverity=zones.length?parseFloat((zones.reduce((s,z)=>s+z.supplyChainRisk,0)/zones.length).toFixed(0)):0;
      return{commodity:c,totalHectares:total,zones:zones.length,avgRisk:avgSeverity};
    });
  },[]);

  const riskTierDistribution=useMemo(()=>RISK_TIERS.map(t=>({
    tier:t,count:ASSETS.filter(a=>a.riskTier===t).length,
    anomalies:ASSETS.filter(a=>a.riskTier===t).reduce((s,a)=>s+a.anomalies,0),
  })),[]);

  const countryDistribution=useMemo(()=>{
    const counts={};
    ASSETS.forEach(a=>{counts[a.country]=(counts[a.country]||0)+1;});
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([c,n])=>({country:c,count:n}));
  },[]);

  const portfolioGapCount=PORTFOLIO_COMPANIES.filter(c=>c.coverageGap).length;
  const portfolioFlaggedCount=PORTFOLIO_COMPANIES.filter(c=>c.flagged).length;

  const handleExportCSV=useCallback(()=>{
    const headers=['Company','Sector','Weight %','Reported Emissions (ktCO2e)','Satellite Emissions (ktCO2e)',
      'Discrepancy %','Sat Risk Score','Scope 1','Scope 2','Scope 3 Est','Data Source','Last Verified','Flagged','Recommendation'];
    const rows=PORTFOLIO_COMPANIES.map(c=>[c.company,c.sector,c.weight,c.reportedEmissions,
      c.satelliteEmissions,c.discrepancy,c.satRiskScore,c.scope1,c.scope2,c.scope3est,
      c.dataSource,c.lastVerified,c.flagged?'Yes':'No',c.recommendation]);
    const csv=[headers,...rows].map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='satellite_risk_report.csv';a.click();
    URL.revokeObjectURL(url);
  },[]);

  const handleFlagAsset=useCallback((assetId)=>{
    setFlaggedAssets(prev=>({...prev,[assetId]:!prev[assetId]}));
  },[]);

  /* =================== TAB 1: Asset Monitoring =================== */
  const renderAssetMonitoring=()=>(
    <div>
      {/* Summary KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:24}}>
        <Card><Stat label="Monitored Assets" value="100" sub="across 20 countries"/></Card>
        <Card><Stat label="Critical Tier" value={summaryStats.critical} color={T.red} sub="immediate attention"/></Card>
        <Card><Stat label="High Tier" value={summaryStats.high} color={T.amber} sub="elevated risk"/></Card>
        <Card><Stat label="Total Anomalies" value={summaryStats.totalAnomalies} color={T.gold} sub="last 30 days"/></Card>
        <Card><Stat label="Satellite Types" value="5" sub="optical/SAR/methane/thermal/multi"/></Card>
        <Card><Stat label="Avg Data Quality" value={`${summaryStats.avgDataQuality}%`} color={T.sage} sub="confidence score"/></Card>
      </div>

      {/* Risk Tier Distribution + Country Distribution */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <Card>
          <SectionTitle>Risk Tier Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={riskTierDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="tier" tick={{fontSize:10,fill:T.textMut}} axisLine={false}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}} axisLine={false}/>
              <Tooltip contentStyle={tip}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="count" name="Assets" radius={[4,4,0,0]}>
                {riskTierDistribution.map((e,i)=><Cell key={i} fill={tierColor(e.tier)}/>)}
              </Bar>
              <Bar dataKey="anomalies" name="Anomalies" radius={[4,4,0,0]} fill={T.navyL} opacity={0.6}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>Top 10 Countries by Asset Count</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={countryDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:9,fill:T.textMut}} axisLine={false}/>
              <YAxis dataKey="country" type="category" tick={{fontSize:9,fill:T.textMut}} width={100} axisLine={false}/>
              <Tooltip contentStyle={tip}/>
              <Bar dataKey="count" name="Assets" radius={[0,4,4,0]} fill={T.sage}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Search and Filters */}
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
        <input type="text" placeholder="Search asset or owner..." value={assetSearch} onChange={e=>setAssetSearch(e.target.value)}
          style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,
            color:T.text,background:T.surface,width:220}}/>
        <select value={sortField} onChange={e=>setSortField(e.target.value)}
          style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface}}>
          <option value="anomalies">Sort: Anomalies</option>
          <option value="riskTier">Sort: Risk Tier</option>
          <option value="lastScan">Sort: Last Scan</option>
          <option value="dataQuality">Sort: Data Quality</option>
        </select>
        <button onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')}
          style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,
            color:T.text,background:T.surface,cursor:'pointer'}}>{sortDir==='desc'?'Desc':'Asc'}</button>
      </div>
      <FilterBar filters={{
        'Country':{options:COUNTRIES,value:filterCountry,setter:setFilterCountry},
        'Asset Type':{options:[...new Set(ASSET_TYPES)],value:filterType,setter:setFilterType},
        'Risk Tier':{options:RISK_TIERS,value:filterTier,setter:setFilterTier},
        'Satellite Type':{options:SAT_TYPES,value:filterSat,setter:setFilterSat},
      }}/>

      <div style={{display:'grid',gridTemplateColumns:selectedAsset?'3fr 2fr':'1fr',gap:20}}>
        {/* Asset Table */}
        <Card style={{overflowX:'auto'}}>
          <SectionTitle>Asset Monitoring Table ({filteredAssets.length} assets)</SectionTitle>
          <div style={{maxHeight:520,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
              <thead>
                <tr style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                  {['#','Asset','Owner','Country','Sat Type','Last Scan','Anom.','Quality','Risk','Flag'].map(h=>
                    <th key={h} style={{padding:'8px 5px',borderBottom:`2px solid ${T.border}`,textAlign:'left',
                      color:T.textSec,fontWeight:600,fontSize:10,whiteSpace:'nowrap'}}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(a=>(
                  <tr key={a.id} onClick={()=>setSelectedAsset(a)}
                    style={{cursor:'pointer',background:selectedAsset?.id===a.id?T.surfaceH:'transparent',
                      borderBottom:`1px solid ${T.border}22`}}
                    onMouseEnter={e=>{if(selectedAsset?.id!==a.id)e.currentTarget.style.background=T.surfaceH}}
                    onMouseLeave={e=>{if(selectedAsset?.id!==a.id)e.currentTarget.style.background='transparent'}}>
                    <td style={{padding:'6px 5px',color:T.textMut}}>{a.id}</td>
                    <td style={{padding:'6px 5px',fontWeight:600,color:T.navy,maxWidth:130,overflow:'hidden',
                      textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.asset}</td>
                    <td style={{padding:'6px 5px',color:T.textSec,maxWidth:90,overflow:'hidden',
                      textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.owner}</td>
                    <td style={{padding:'6px 5px',color:T.textSec,fontSize:10}}>{a.country}</td>
                    <td style={{padding:'6px 5px'}}><Badge label={a.satType} color={T.navyL}/></td>
                    <td style={{padding:'6px 5px',fontFamily:T.mono,fontSize:10}}>{a.lastScan}</td>
                    <td style={{padding:'6px 5px',fontFamily:T.mono,fontWeight:600,
                      color:a.anomalies>5?T.red:a.anomalies>2?T.amber:T.text}}>{a.anomalies}</td>
                    <td style={{padding:'6px 5px'}}><MiniBar value={a.dataQuality} max={100}
                      color={a.dataQuality>80?T.green:a.dataQuality>60?T.gold:T.red}/></td>
                    <td style={{padding:'6px 5px'}}><Badge label={a.riskTier} color={tierColor(a.riskTier)}/></td>
                    <td style={{padding:'6px 5px'}}>
                      {flaggedAssets[a.id]&&<span style={{color:T.red,fontWeight:700,fontSize:10}}>FLAGGED</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail Panel */}
        {selectedAsset&&(
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.font}}>{selectedAsset.asset}</div>
                <div style={{fontSize:12,color:T.textSec,marginTop:4}}>
                  {selectedAsset.owner} | {selectedAsset.country}
                </div>
              </div>
              <Badge label={selectedAsset.riskTier} color={tierColor(selectedAsset.riskTier)}/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
              {[
                {l:'Anomalies',v:selectedAsset.anomalies,c:T.red},
                {l:'NDVI',v:selectedAsset.ndvi,c:T.sage},
                {l:'Data Quality',v:`${selectedAsset.dataQuality}%`,c:T.navy},
                {l:'Thermal',v:selectedAsset.thermalAnomaly?'ALERT':'Normal',
                  c:selectedAsset.thermalAnomaly?T.red:T.green},
              ].map(({l,v,c})=>(
                <div key={l} style={{background:T.bg,borderRadius:8,padding:8,textAlign:'center'}}>
                  <div style={{fontSize:9,color:T.textMut}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:700,color:c,fontFamily:T.mono}}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>
              12-Month Emissions (ktCO2e)
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={selectedAsset.emissionsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" tick={{fontSize:8,fill:T.textMut}} axisLine={false}/>
                <YAxis tick={{fontSize:8,fill:T.textMut}} axisLine={false}/>
                <Tooltip contentStyle={tip}/>
                <Area type="monotone" dataKey="baseline" fill="none" stroke={T.gold} strokeDasharray="4 4" strokeWidth={1}/>
                <Area type="monotone" dataKey="value" fill={`${T.sage}25`} stroke={T.sage} strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>

            <div style={{fontSize:12,fontWeight:600,color:T.navy,margin:'14px 0 6px'}}>Anomaly Timeline</div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={selectedAsset.anomalyTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" tick={{fontSize:8,fill:T.textMut}} axisLine={false}/>
                <YAxis tick={{fontSize:8,fill:T.textMut}} axisLine={false}/>
                <Tooltip contentStyle={tip}/>
                <Bar dataKey="count" radius={[3,3,0,0]}>
                  {selectedAsset.anomalyTimeline.map((e,i)=>(
                    <Cell key={i} fill={e.count>3?T.red:e.count>1?T.amber:T.sage}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{fontSize:12,fontWeight:600,color:T.navy,margin:'14px 0 6px'}}>
              Satellite Coverage (passes/month)
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={selectedAsset.coverageHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" tick={{fontSize:8,fill:T.textMut}} axisLine={false}/>
                <YAxis tick={{fontSize:8,fill:T.textMut}} axisLine={false}/>
                <Tooltip contentStyle={tip}/>
                <Line type="monotone" dataKey="passes" stroke={T.gold} strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="resolution" stroke={T.navyL} strokeWidth={1}
                  strokeDasharray="3 3" dot={false}/>
              </LineChart>
            </ResponsiveContainer>

            <div style={{display:'flex',gap:6,marginTop:14}}>
              <div style={{flex:1,fontSize:10,color:T.textMut,background:T.bg,borderRadius:6,padding:8}}>
                <strong style={{color:T.text}}>Coordinates:</strong> {selectedAsset.lat}, {selectedAsset.lon}
              </div>
              <div style={{flex:1,fontSize:10,color:T.textMut,background:T.bg,borderRadius:6,padding:8}}>
                <strong style={{color:T.text}}>Sat Type:</strong> {selectedAsset.satType}
              </div>
            </div>

            <button onClick={()=>handleFlagAsset(selectedAsset.id)}
              style={{marginTop:14,width:'100%',padding:'10px 0',borderRadius:8,border:'none',
                background:flaggedAssets[selectedAsset.id]?T.sage:T.red,color:'#fff',fontWeight:700,
                fontSize:12,fontFamily:T.font,cursor:'pointer'}}>
              {flaggedAssets[selectedAsset.id]?'Remove Flag':'Flag for Investigation'}
            </button>
          </Card>
        )}
      </div>
    </div>
  );

  /* =================== TAB 2: Methane Intelligence =================== */
  const renderMethaneIntelligence=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:24}}>
        <Card><Stat label="O&G Facilities" value="40" sub="monitored globally"/></Card>
        <Card><Stat label="Super-Emitters" value={summaryStats.superEmitters} color={T.red} sub=">25 t/hr"/></Card>
        <Card><Stat label="Avg Leak Rate" value={`${(METHANE_FACILITIES.reduce((s,f)=>s+f.leakRate,0)/40).toFixed(1)}`} sub="t CH4/hr"/></Card>
        <Card><Stat label="EU Non-Compliant" value={METHANE_FACILITIES.filter(f=>!f.euCompliant).length} color={T.amber} sub=">10 t/hr limit"/></Card>
        <Card><Stat label="GWP-20 Total" value={`${(METHANE_FACILITIES.reduce((s,f)=>s+f.co2eGWP20,0)/1000).toFixed(0)}k`} sub="tCO2e/hr"/></Card>
        <Card><Stat label="Total Plume Area" value={`${METHANE_FACILITIES.reduce((s,f)=>s+f.plumeSizeKm2,0).toFixed(1)}`} sub="km2 detected"/></Card>
      </div>

      {/* Alert threshold */}
      <Card style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <span style={{fontSize:12,fontWeight:600,color:T.navy,fontFamily:T.font}}>
            Alert Threshold (t CH4/hr):
          </span>
          <input type="range" min={5} max={50} step={1} value={methaneAlertThreshold}
            onChange={e=>setMethaneAlertThreshold(+e.target.value)} style={{flex:1,maxWidth:300}}/>
          <span style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.red}}>
            {methaneAlertThreshold}
          </span>
          <span style={{fontSize:11,color:T.textMut}}>
            ({METHANE_FACILITIES.filter(f=>f.leakRate>=methaneAlertThreshold).length} above)
          </span>
          <div style={{fontSize:11,color:T.textSec,marginLeft:16}}>
            EU Methane Regulation 2024 limit: <strong style={{color:T.red}}>10 t/hr</strong> |
            Super-emitter: <strong style={{color:T.red}}>25 t/hr</strong>
          </div>
        </div>
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        {/* Rankings */}
        <Card>
          <SectionTitle>CH4 Leak Rate Rankings (Top 20)</SectionTitle>
          <div style={{maxHeight:400,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
              <thead>
                <tr>
                  {['#','Facility','Operator','Rate','GWP-100','GWP-20','Plume','EU'].map(h=>
                    <th key={h} style={{padding:'6px 4px',borderBottom:`2px solid ${T.border}`,
                      textAlign:'left',color:T.textSec,fontWeight:600,fontSize:10}}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {METHANE_FACILITIES.slice(0,20).map((f,i)=>(
                  <tr key={f.id} onClick={()=>setSelectedFacility(f)}
                    style={{cursor:'pointer',
                      background:selectedFacility?.id===f.id?T.surfaceH:'transparent',
                      borderBottom:`1px solid ${T.border}22`}}
                    onMouseEnter={e=>{if(selectedFacility?.id!==f.id)e.currentTarget.style.background=T.surfaceH}}
                    onMouseLeave={e=>{if(selectedFacility?.id!==f.id)e.currentTarget.style.background='transparent'}}>
                    <td style={{padding:'5px 4px',fontWeight:700,color:i<3?T.red:T.text}}>{i+1}</td>
                    <td style={{padding:'5px 4px',fontWeight:600,color:T.navy}}>{f.facility}</td>
                    <td style={{padding:'5px 4px',color:T.textSec,fontSize:10}}>{f.operator}</td>
                    <td style={{padding:'5px 4px',fontFamily:T.mono,fontWeight:700,
                      color:f.leakRate>=methaneAlertThreshold?T.red:T.text}}>{f.leakRate}</td>
                    <td style={{padding:'5px 4px',fontFamily:T.mono,fontSize:10}}>{f.co2eGWP100}</td>
                    <td style={{padding:'5px 4px',fontFamily:T.mono,fontSize:10}}>{f.co2eGWP20}</td>
                    <td style={{padding:'5px 4px',fontFamily:T.mono,fontSize:10}}>{f.plumeSizeKm2}</td>
                    <td style={{padding:'5px 4px'}}>
                      <Badge label={f.euCompliant?'OK':'Fail'} color={f.euCompliant?T.green:T.red}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sector Benchmarks */}
        <Card>
          <SectionTitle>Sector Benchmarks (Avg vs Max Leak Rate)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sectorBenchmarks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:9,fill:T.textMut}} axisLine={false}/>
              <YAxis dataKey="sector" type="category" tick={{fontSize:9,fill:T.textMut}} width={130} axisLine={false}/>
              <Tooltip contentStyle={tip}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="avgLeakRate" name="Avg (t/hr)" radius={[0,4,4,0]} fill={T.gold}/>
              <Bar dataKey="maxLeakRate" name="Max (t/hr)" radius={[0,4,4,0]} fill={T.red} opacity={0.7}/>
            </BarChart>
          </ResponsiveContainer>

          <div style={{fontSize:12,fontWeight:600,color:T.navy,margin:'16px 0 8px',fontFamily:T.font}}>
            GWP Conversion Reference
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
            <thead>
              <tr>
                {['Metric','Factor','Description'].map(h=>(
                  <th key={h} style={{padding:'6px',borderBottom:`2px solid ${T.border}`,textAlign:'left',
                    color:T.textSec,fontWeight:600,fontSize:10}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{borderBottom:`1px solid ${T.border}22`}}>
                <td style={{padding:'5px 6px'}}>GWP-100</td>
                <td style={{padding:'5px 6px',fontFamily:T.mono,fontWeight:700}}>28x</td>
                <td style={{padding:'5px 6px',color:T.textSec}}>100-year global warming potential (IPCC AR5)</td>
              </tr>
              <tr style={{borderBottom:`1px solid ${T.border}22`}}>
                <td style={{padding:'5px 6px'}}>GWP-20</td>
                <td style={{padding:'5px 6px',fontFamily:T.mono,fontWeight:700,color:T.red}}>84x</td>
                <td style={{padding:'5px 6px',color:T.textSec}}>20-year global warming potential (short-term impact)</td>
              </tr>
              <tr>
                <td style={{padding:'5px 6px'}}>EU Reg 2024</td>
                <td style={{padding:'5px 6px',fontFamily:T.mono,fontWeight:700,color:T.amber}}>10 t/hr</td>
                <td style={{padding:'5px 6px',color:T.textSec}}>EU Methane Regulation mandatory threshold</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card style={{marginBottom:20}}>
        <SectionTitle>Detected Leaks Over 12 Months (All 40 Facilities)</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={methaneMonthlyAgg}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} axisLine={false}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} axisLine={false}/>
            <Tooltip contentStyle={tip}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Area type="monotone" dataKey="totalLeaks" name="Total Leaks" fill={`${T.red}20`}
              stroke={T.red} strokeWidth={2}/>
            <Area type="monotone" dataKey="avgRate" name="Avg Rate (t/hr)" fill={`${T.gold}15`}
              stroke={T.gold} strokeWidth={2}/>
            <Area type="monotone" dataKey="totalPlumes" name="Total Plumes" fill={`${T.navyL}15`}
              stroke={T.navyL} strokeWidth={1.5}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Selected Facility Detail */}
      {selectedFacility&&(
        <Card>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.font}}>
                {selectedFacility.facility}
              </div>
              <div style={{fontSize:12,color:T.textSec,marginTop:2}}>
                {selectedFacility.operator} | {selectedFacility.sector} | {selectedFacility.country}
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              {selectedFacility.isSuperEmitter&&<Badge label="SUPER-EMITTER" color={T.red}/>}
              <Badge label={selectedFacility.euCompliant?'EU Compliant':'EU Non-Compliant'}
                color={selectedFacility.euCompliant?T.green:T.red}/>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
            {[
              {l:'Leak Rate',v:`${selectedFacility.leakRate} t/hr`,c:T.red},
              {l:'CO2e GWP-100',v:selectedFacility.co2eGWP100,c:T.navy},
              {l:'CO2e GWP-20',v:selectedFacility.co2eGWP20,c:T.amber},
              {l:'Plume Size',v:`${selectedFacility.plumeSizeKm2} km2`,c:T.navyL},
              {l:'Confidence',v:`${selectedFacility.detectionConfidence}%`,c:T.sage},
            ].map(({l,v,c})=>(
              <div key={l} style={{background:T.bg,borderRadius:8,padding:10,textAlign:'center'}}>
                <div style={{fontSize:9,color:T.textMut}}>{l}</div>
                <div style={{fontSize:15,fontWeight:700,color:c,fontFamily:T.mono}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Monthly Leak Trend</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={selectedFacility.monthlyLeaks}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="month" tick={{fontSize:8,fill:T.textMut}} axisLine={false}/>
                  <YAxis tick={{fontSize:8,fill:T.textMut}} axisLine={false}/>
                  <Tooltip contentStyle={tip}/>
                  <Legend wrapperStyle={{fontSize:9}}/>
                  <Line type="monotone" dataKey="detected" name="Leaks" stroke={T.red}
                    strokeWidth={2} dot={{r:2}}/>
                  <Line type="monotone" dataKey="rate" name="Rate" stroke={T.gold}
                    strokeWidth={2} dot={{r:2}}/>
                  <Line type="monotone" dataKey="plumes" name="Plumes" stroke={T.navyL}
                    strokeWidth={1.5} dot={{r:2}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Regulatory History</div>
              {selectedFacility.regulatoryHistory.map((r,i)=>(
                <div key={i} style={{padding:8,marginBottom:6,borderRadius:6,background:T.bg,
                  borderLeft:`3px solid ${r.status==='Active'||r.status==='Open'?T.red:T.green}`}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.navy}}>{r.action}</div>
                  <div style={{fontSize:9,color:T.textMut,marginTop:2}}>
                    {r.date} | <Badge label={r.status} color={r.status==='Active'||r.status==='Open'?T.amber:T.green}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  /* =================== TAB 3: Deforestation Watch =================== */
  const renderDeforestationWatch=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:24}}>
        <Card><Stat label="Monitoring Zones" value="30" sub="across 10 regions"/></Card>
        <Card><Stat label="Critical Zones" value={FOREST_ZONES.filter(z=>z.severity==='Critical').length}
          color={T.red} sub=">3000 ha lost"/></Card>
        <Card><Stat label="Total Ha Lost" value={`${(FOREST_ZONES.reduce((s,z)=>s+z.hectaresLost,0)/1000).toFixed(0)}k`}
          color={T.amber} sub="trailing 12 months"/></Card>
        <Card><Stat label="EUDR Non-Compliant" value={FOREST_ZONES.filter(z=>!z.eudrCompliant).length}
          color={T.red} sub=">500 ha threshold"/></Card>
        <Card><Stat label="Fire Hotspots" value={FOREST_ZONES.reduce((s,z)=>s+z.fireHotspots,0)}
          color={T.amber} sub="detected across zones"/></Card>
        <Card><Stat label="Linked Companies"
          value={[...new Set(FOREST_ZONES.flatMap(z=>z.linkedCompanies))].length}
          sub="supply chain exposure"/></Card>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <select value={filterCommodity} onChange={e=>setFilterCommodity(e.target.value)}
          style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,
            fontFamily:T.font,color:T.text,background:T.surface}}>
          <option value="">All Commodities</option>
          {COMMODITIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <Card>
          <SectionTitle>Commodity-Linked Deforestation</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deforestationByComm}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="commodity" tick={{fontSize:10,fill:T.textMut}} axisLine={false}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}} axisLine={false}/>
              <Tooltip contentStyle={tip}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="totalHectares" name="Hectares Lost" radius={[4,4,0,0]}>
                {deforestationByComm.map((e,i)=>(
                  <Cell key={i} fill={[T.red,T.amber,T.gold,T.sage,T.navyL][i]}/>
                ))}
              </Bar>
              <Bar dataKey="avgRisk" name="Avg Supply Chain Risk" radius={[4,4,0,0]}
                fill={T.navyL} opacity={0.5}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Monthly Deforestation Rate (All Zones)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHS.map((m,mi)=>({
              month:m,
              totalLoss:FOREST_ZONES.reduce((s,z)=>s+z.monthlyTrend[mi].loss,0),
              fires:FOREST_ZONES.reduce((s,z)=>s+z.monthlyTrend[mi].fires,0),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} axisLine={false}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}} axisLine={false}/>
              <Tooltip contentStyle={tip}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Area type="monotone" dataKey="totalLoss" name="Hectares Lost" fill={`${T.red}18`}
                stroke={T.red} strokeWidth={2}/>
              <Area type="monotone" dataKey="fires" name="Fire Alerts" fill={`${T.amber}15`}
                stroke={T.amber} strokeWidth={1.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Supply chain exposure per company */}
      <Card style={{marginBottom:20}}>
        <SectionTitle>High-Risk Supply Chain Exposure by Company</SectionTitle>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {(() => {
            const companyExposure={};
            FOREST_ZONES.forEach(z=>{
              z.linkedCompanies.forEach(c=>{
                if(!companyExposure[c])companyExposure[c]={zones:0,hectares:0,maxSeverity:'Low'};
                companyExposure[c].zones+=1;
                companyExposure[c].hectares+=z.hectaresLost;
                const sev=['Low','Medium','High','Critical'];
                if(sev.indexOf(z.severity)>sev.indexOf(companyExposure[c].maxSeverity)){
                  companyExposure[c].maxSeverity=z.severity;
                }
              });
            });
            return Object.entries(companyExposure).sort((a,b)=>b[1].hectares-a[1].hectares)
              .slice(0,12).map(([company,data])=>(
                <div key={company} style={{background:T.bg,borderRadius:8,padding:10,minWidth:160,
                  border:`1px solid ${sevColor(data.maxSeverity)}30`,flex:'1 1 160px'}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.navy}}>{company}</div>
                  <div style={{fontSize:10,color:T.textSec,marginTop:2}}>
                    {data.zones} zones | {data.hectares.toLocaleString()} ha
                  </div>
                  <Badge label={data.maxSeverity} color={sevColor(data.maxSeverity)}/>
                </div>
              ));
          })()}
        </div>
      </Card>

      {/* Zone Table + Detail */}
      <div style={{display:'grid',gridTemplateColumns:selectedZone?'1fr 1fr':'1fr',gap:20}}>
        <Card>
          <SectionTitle>Forest Monitoring Zones ({filteredZones.length})</SectionTitle>
          <div style={{maxHeight:420,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
              <thead>
                <tr>
                  {['Zone','Region','Country','Commodity','Ha Lost','Fires','Severity','EUDR'].map(h=>
                    <th key={h} style={{padding:'6px 4px',borderBottom:`2px solid ${T.border}`,
                      textAlign:'left',color:T.textSec,fontWeight:600,fontSize:10,whiteSpace:'nowrap'}}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredZones.map(z=>(
                  <tr key={z.id} onClick={()=>setSelectedZone(z)}
                    style={{cursor:'pointer',background:selectedZone?.id===z.id?T.surfaceH:'transparent',
                      borderBottom:`1px solid ${T.border}22`}}
                    onMouseEnter={e=>{if(selectedZone?.id!==z.id)e.currentTarget.style.background=T.surfaceH}}
                    onMouseLeave={e=>{if(selectedZone?.id!==z.id)e.currentTarget.style.background='transparent'}}>
                    <td style={{padding:'5px 4px',fontWeight:600,color:T.navy}}>{z.zone}</td>
                    <td style={{padding:'5px 4px',color:T.textSec,fontSize:10}}>{z.region}</td>
                    <td style={{padding:'5px 4px',color:T.textSec,fontSize:10}}>{z.country}</td>
                    <td style={{padding:'5px 4px'}}><Badge label={z.commodity} color={T.navyL}/></td>
                    <td style={{padding:'5px 4px',fontFamily:T.mono,fontWeight:700,
                      color:z.hectaresLost>3000?T.red:z.hectaresLost>1000?T.amber:T.text}}>
                      {z.hectaresLost.toLocaleString()}
                    </td>
                    <td style={{padding:'5px 4px',fontFamily:T.mono,
                      color:z.fireHotspots>15?T.red:T.text}}>{z.fireHotspots}</td>
                    <td style={{padding:'5px 4px'}}><Badge label={z.severity} color={sevColor(z.severity)}/></td>
                    <td style={{padding:'5px 4px'}}>
                      <Badge label={z.eudrCompliant?'Pass':'Fail'} color={z.eudrCompliant?T.green:T.red}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {selectedZone&&(
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.font}}>
                  {selectedZone.zone}
                </div>
                <div style={{fontSize:12,color:T.textSec,marginTop:2}}>
                  {selectedZone.region} | {selectedZone.country}
                </div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <Badge label={selectedZone.severity} color={sevColor(selectedZone.severity)}/>
                <Badge label={selectedZone.eudrCompliant?'EUDR Pass':'EUDR Fail'}
                  color={selectedZone.eudrCompliant?T.green:T.red}/>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
              {[
                {l:'Affected Area',v:`${selectedZone.hectaresLost.toLocaleString()} ha`,c:T.red},
                {l:'Tree Cover',v:`${selectedZone.treeCoverPct}%`,c:T.sage},
                {l:'Biomass Carbon',v:`${selectedZone.biomassCarbon} tC/ha`,c:T.navy},
                {l:'Supply Risk',v:`${selectedZone.supplyChainRisk}/100`,
                  c:selectedZone.supplyChainRisk>70?T.red:T.amber},
              ].map(({l,v,c})=>(
                <div key={l} style={{background:T.bg,borderRadius:8,padding:8,textAlign:'center'}}>
                  <div style={{fontSize:9,color:T.textMut}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:700,color:c,fontFamily:T.mono}}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Linked Companies</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
              {selectedZone.linkedCompanies.map((c,i)=><Badge key={i} label={c} color={T.navyL}/>)}
            </div>

            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>
              Monthly Deforestation + Fire Alerts
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={selectedZone.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" tick={{fontSize:8,fill:T.textMut}} axisLine={false}/>
                <YAxis tick={{fontSize:8,fill:T.textMut}} axisLine={false}/>
                <Tooltip contentStyle={tip}/>
                <Legend wrapperStyle={{fontSize:9}}/>
                <Bar dataKey="loss" name="Ha Lost" radius={[3,3,0,0]}>
                  {selectedZone.monthlyTrend.map((e,i)=>(
                    <Cell key={i} fill={e.loss>300?T.red:e.loss>150?T.amber:T.sage}/>
                  ))}
                </Bar>
                <Bar dataKey="fires" name="Fire Alerts" radius={[3,3,0,0]} fill={T.gold} opacity={0.7}/>
              </BarChart>
            </ResponsiveContainer>

            <div style={{marginTop:14,padding:12,borderRadius:8,
              background:`${sevColor(selectedZone.severity)}08`,
              border:`1px solid ${sevColor(selectedZone.severity)}25`}}>
              <div style={{fontSize:11,fontWeight:700,color:sevColor(selectedZone.severity),marginBottom:4}}>
                Regulatory Action Required
              </div>
              <div style={{fontSize:12,color:T.text}}>{selectedZone.regulatoryAction}</div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>
                Commodity: {selectedZone.commodity} | Monthly rate: {selectedZone.monthlyRate} ha/mo
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  /* =================== TAB 4: Portfolio Satellite Overlay =================== */
  const renderPortfolioOverlay=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:24}}>
        <Card><Stat label="Portfolio Cos" value="30" sub="satellite overlay"/></Card>
        <Card><Stat label="Coverage Gaps" value={portfolioGapCount} color={T.amber}
          sub="no monitoring"/></Card>
        <Card><Stat label="Discrepancy Flags" value={portfolioFlaggedCount} color={T.red}
          sub=">20% variance"/></Card>
        <Card><Stat label="Avg Sat Risk" value={`${(PORTFOLIO_COMPANIES.reduce((s,c)=>s+c.satRiskScore,0)/30).toFixed(0)}`}
          color={T.navy} sub="composite"/></Card>
        <Card><Stat label="Max Discrepancy"
          value={`${Math.max(...PORTFOLIO_COMPANIES.map(c=>c.discrepancy)).toFixed(0)}%`}
          color={T.red} sub="worst variance"/></Card>
        <Card><Stat label="Avg Weight"
          value={`${(PORTFOLIO_COMPANIES.reduce((s,c)=>s+c.weight,0)/30).toFixed(1)}%`}
          sub="per company"/></Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        {/* Scatter */}
        <Card>
          <SectionTitle>Satellite vs Reported Emissions (30 Companies)</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="reportedEmissions" name="Reported" tick={{fontSize:9,fill:T.textMut}}
                axisLine={false} label={{value:'Reported (ktCO2e)',position:'bottom',fontSize:10,fill:T.textMut}}/>
              <YAxis dataKey="satelliteEmissions" name="Satellite" tick={{fontSize:9,fill:T.textMut}}
                axisLine={false} label={{value:'Satellite (ktCO2e)',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={tip}
                formatter={(v,n)=>[`${v} ktCO2e`,n==='reportedEmissions'?'Reported':'Satellite']}/>
              <Scatter data={PORTFOLIO_COMPANIES}>
                {PORTFOLIO_COMPANIES.map((c,i)=>(
                  <Cell key={i} fill={c.flagged?T.red:c.discrepancy>10?T.amber:T.sage}/>
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:6}}>
            {[{l:'Flagged (>20%)',c:T.red},{l:'Elevated (10-20%)',c:T.amber},{l:'Acceptable',c:T.sage}].map(({l,c})=>(
              <span key={l} style={{fontSize:10,color:T.textMut,display:'flex',alignItems:'center',gap:4}}>
                <span style={{width:8,height:8,borderRadius:4,background:c,display:'inline-block'}}/>
                {l}
              </span>
            ))}
          </div>
        </Card>

        {/* Coverage Gap */}
        <Card>
          <SectionTitle>Coverage Gap Analysis</SectionTitle>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div style={{background:T.bg,borderRadius:10,padding:16,textAlign:'center'}}>
              <div style={{fontSize:32,fontWeight:700,color:T.green,fontFamily:T.mono}}>
                {30-portfolioGapCount}
              </div>
              <div style={{fontSize:11,color:T.textSec}}>Monitored</div>
            </div>
            <div style={{background:`${T.amber}08`,borderRadius:10,padding:16,textAlign:'center'}}>
              <div style={{fontSize:32,fontWeight:700,color:T.amber,fontFamily:T.mono}}>
                {portfolioGapCount}
              </div>
              <div style={{fontSize:11,color:T.textSec}}>Coverage Gaps</div>
            </div>
          </div>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>
            Companies Without Satellite Monitoring:
          </div>
          <div style={{maxHeight:180,overflowY:'auto'}}>
            {PORTFOLIO_COMPANIES.filter(c=>c.coverageGap).map(c=>(
              <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'6px 8px',borderBottom:`1px solid ${T.border}22`,fontSize:11}}>
                <span style={{fontWeight:600,color:T.navy}}>{c.company}</span>
                <span style={{color:T.textSec}}>{c.sector} | {c.weight}%</span>
                <Badge label="No Coverage" color={T.amber}/>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Full Table */}
      <Card style={{marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <SectionTitle>Portfolio Satellite Risk Assessment</SectionTitle>
          <button onClick={handleExportCSV}
            style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${T.sage}`,background:'transparent',
              color:T.sage,fontWeight:600,fontSize:12,fontFamily:T.font,cursor:'pointer'}}>
            Export Satellite Risk Report CSV
          </button>
        </div>
        <div style={{overflowX:'auto',maxHeight:480}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
            <thead>
              <tr style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                {['Company','Sector','Wt%','Monitoring','Risk','Reported','Satellite','Disc.',
                  'Scope 1','Scope 2','Source','Flag','Action'].map(h=>
                  <th key={h} style={{padding:'7px 4px',borderBottom:`2px solid ${T.border}`,
                    textAlign:'left',color:T.textSec,fontWeight:600,fontSize:10,whiteSpace:'nowrap'}}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {PORTFOLIO_COMPANIES.map(c=>(
                <tr key={c.id} style={{borderBottom:`1px solid ${T.border}22`}}>
                  <td style={{padding:'6px 4px',fontWeight:600,color:T.navy}}>{c.company}</td>
                  <td style={{padding:'6px 4px',color:T.textSec,fontSize:10}}>{c.sector}</td>
                  <td style={{padding:'6px 4px',fontFamily:T.mono,fontSize:10}}>{c.weight}</td>
                  <td style={{padding:'6px 4px'}}>
                    <Badge label={c.hasSatMonitoring?'Active':'None'}
                      color={c.hasSatMonitoring?T.green:T.amber}/>
                  </td>
                  <td style={{padding:'6px 4px'}}>
                    <MiniBar value={c.satRiskScore} max={100}
                      color={c.satRiskScore>70?T.red:c.satRiskScore>40?T.amber:T.sage}/>
                  </td>
                  <td style={{padding:'6px 4px',fontFamily:T.mono,fontSize:10}}>{c.reportedEmissions}</td>
                  <td style={{padding:'6px 4px',fontFamily:T.mono,fontSize:10}}>{c.satelliteEmissions}</td>
                  <td style={{padding:'6px 4px',fontFamily:T.mono,fontWeight:700,fontSize:10,
                    color:c.discrepancy>20?T.red:c.discrepancy>10?T.amber:T.text}}>
                    {c.discrepancy>0?'+':''}{c.discrepancy}%
                  </td>
                  <td style={{padding:'6px 4px',fontFamily:T.mono,fontSize:10}}>{c.scope1}</td>
                  <td style={{padding:'6px 4px',fontFamily:T.mono,fontSize:10}}>{c.scope2}</td>
                  <td style={{padding:'6px 4px',fontSize:10}}><Badge label={c.dataSource} color={T.navyL}/></td>
                  <td style={{padding:'6px 4px'}}>
                    {c.flagged&&<Badge label="FLAGGED" color={T.red}/>}
                  </td>
                  <td style={{padding:'6px 4px',fontSize:9,
                    color:c.discrepancy>20?T.red:T.textSec,maxWidth:140,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {c.recommendation.split(':')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Discrepancy Distribution + Recommendations */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20}}>
        <Card>
          <SectionTitle>Satellite-Reported Discrepancy Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[...PORTFOLIO_COMPANIES].sort((a,b)=>b.discrepancy-a.discrepancy)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="company" tick={{fontSize:7,fill:T.textMut,angle:-45,textAnchor:'end'}}
                height={80} axisLine={false}/>
              <YAxis tick={{fontSize:9,fill:T.textMut}} axisLine={false}
                label={{value:'Discrepancy %',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={tip}/>
              <Bar dataKey="discrepancy" name="Discrepancy %" radius={[4,4,0,0]}>
                {[...PORTFOLIO_COMPANIES].sort((a,b)=>b.discrepancy-a.discrepancy).map((c,i)=>(
                  <Cell key={i} fill={c.discrepancy>20?T.red:c.discrepancy>10?T.amber:T.sage}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Investment Action Summary</SectionTitle>
          {['Engage','Monitor','Watch','Acceptable'].map(action=>{
            const count=PORTFOLIO_COMPANIES.filter(c=>c.recommendation.startsWith(action)).length;
            const color=action==='Engage'?T.red:action==='Monitor'?T.amber:action==='Watch'?T.gold:T.green;
            return(
              <div key={action} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',
                borderBottom:`1px solid ${T.border}22`}}>
                <div style={{width:40,height:40,borderRadius:8,background:`${color}15`,display:'flex',
                  alignItems:'center',justifyContent:'center',fontWeight:700,fontFamily:T.mono,
                  color,fontSize:18}}>{count}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:T.navy}}>{action}</div>
                  <div style={{fontSize:10,color:T.textSec}}>
                    {action==='Engage'?'Major discrepancy \u2014 request restatement':
                      action==='Monitor'?'Elevated \u2014 enhanced due diligence':
                      action==='Watch'?'Moderate variance \u2014 follow-up':
                      'Within tolerance'}
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{marginTop:16,padding:10,borderRadius:8,background:T.bg,fontSize:10,color:T.textSec}}>
            Data sources: Sentinel-5P, GHGSat, Landsat-9. Last updated: 2026-03-28.
            Satellite emissions may include scope 1 and partial scope 2 only.
          </div>
        </Card>
      </div>
    </div>
  );

  /* =================== MAIN RENDER =================== */
  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
      {/* Header */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:'20px 32px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <span style={{fontSize:22,fontWeight:800,color:T.navy}}>Satellite Climate Intelligence Monitor</span>
          <Badge label="EP-AM2" color={T.sage}/>
          <Badge label="LIVE" color={T.green}/>
        </div>
        <div style={{fontSize:13,color:T.textSec}}>
          Satellite-derived environmental data for investment-grade climate analytics |
          100 assets | 20 countries | 5 satellite data types
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,background:T.surface,borderBottom:`1px solid ${T.border}`,
        padding:'0 32px',overflowX:'auto'}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>{setTab(i);setSelectedAsset(null);setSelectedFacility(null);setSelectedZone(null);}}
            style={{padding:'12px 20px',fontSize:13,fontWeight:tab===i?700:500,
              color:tab===i?T.navy:T.textMut,background:'transparent',border:'none',
              borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',
              cursor:'pointer',fontFamily:T.font,transition:'all 0.15s',whiteSpace:'nowrap'}}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{padding:'24px 32px',maxWidth:1480,margin:'0 auto'}}>
        {tab===0&&renderAssetMonitoring()}
        {tab===1&&renderMethaneIntelligence()}
        {tab===2&&renderDeforestationWatch()}
        {tab===3&&renderPortfolioOverlay()}
      </div>
    </div>
  );
}
