import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, Cell, Legend, ComposedChart, ReferenceLine, LineChart, Line,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#0e7490',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',emerald:'#059669',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ─── Statics ─────────────────────────────────────────────────────────────── */
const TABS=['Risk Overview','Hazard Matrix','GDP at Risk','Infrastructure Vulnerability','Forward Scenarios','NGFS Alignment','Country Profiles'];
const HAZARDS=['Flood','Drought','Heat Stress','Cyclone','Sea Level Rise','Wildfire'];
const NGFS_SCENARIOS=['Current Policies','NDC Scenario','1.5C Orderly','Disorderly Transition','Hot House World'];
const INFRA_SECTORS=['Ports','Roads','Energy Grid','Water Systems','Agriculture'];
const REGIONS_LIST=['Africa','Asia-Pacific','Europe','Latin America','Middle East','North America','South Asia'];

const COUNTRY_NAMES=[
  'Bangladesh','Vietnam','Philippines','Myanmar','Cambodia','Mozambique','Madagascar','Pakistan','India','Indonesia',
  'Thailand','Haiti','Honduras','Guatemala','El Salvador','Nicaragua','Nepal','Sri Lanka','Fiji','Maldives',
  'Egypt','Morocco','Tunisia','Algeria','Nigeria','Kenya','Ghana','Ethiopia','Tanzania','Senegal',
  'Iran','Iraq','Saudi Arabia','UAE','Kuwait','Bahrain','Qatar','Oman','Turkey','Jordan',
  'Brazil','Colombia','Peru','Ecuador','Bolivia','Paraguay','Venezuela','Dominican Republic','Cuba','Jamaica',
  'China','Japan','South Korea','Taiwan','Malaysia','Singapore','New Zealand','Australia','Mexico','Argentina',
  'South Africa','Zimbabwe','Zambia','Angola','Cameroon','Uganda','Sudan','Yemen','Syria','Libya',
  'Germany','France','United Kingdom','Italy','Spain','Poland','Netherlands','Belgium','Portugal','Greece',
];

const REGION_MAP_PHY={
  'Bangladesh':6,'Vietnam':1,'Philippines':1,'Myanmar':1,'Cambodia':1,'Mozambique':0,'Madagascar':0,'Pakistan':6,'India':6,'Indonesia':1,
  'Thailand':1,'Haiti':3,'Honduras':3,'Guatemala':3,'El Salvador':3,'Nicaragua':3,'Nepal':6,'Sri Lanka':6,'Fiji':1,'Maldives':6,
  'Egypt':4,'Morocco':4,'Tunisia':4,'Algeria':4,'Nigeria':0,'Kenya':0,'Ghana':0,'Ethiopia':0,'Tanzania':0,'Senegal':0,
  'Iran':4,'Iraq':4,'Saudi Arabia':4,'UAE':4,'Kuwait':4,'Bahrain':4,'Qatar':4,'Oman':4,'Turkey':4,'Jordan':4,
  'Brazil':3,'Colombia':3,'Peru':3,'Ecuador':3,'Bolivia':3,'Paraguay':3,'Venezuela':3,'Dominican Republic':3,'Cuba':3,'Jamaica':3,
  'China':1,'Japan':1,'South Korea':1,'Taiwan':1,'Malaysia':1,'Singapore':1,'New Zealand':1,'Australia':1,'Mexico':5,'Argentina':3,
  'South Africa':0,'Zimbabwe':0,'Zambia':0,'Angola':0,'Cameroon':0,'Uganda':0,'Sudan':0,'Yemen':4,'Syria':4,'Libya':4,
  'Germany':2,'France':2,'United Kingdom':2,'Italy':2,'Spain':2,'Poland':2,'Netherlands':2,'Belgium':2,'Portugal':2,'Greece':2,
};

const COUNTRIES_PHY=COUNTRY_NAMES.map((name,i)=>{
  const s=i*17+7;
  const regionIdx=REGION_MAP_PHY[name]??i%7;
  /* Hazard scores: regional biases */
  const floodBase=regionIdx===6?6+sr(s)*3:regionIdx===1?5+sr(s+1)*4:regionIdx===0?4+sr(s+2)*4:2+sr(s+3)*5;
  const droughtBase=regionIdx===4?7+sr(s+4)*2:regionIdx===0?5+sr(s+5)*3:regionIdx===6?4+sr(s+6)*3:1+sr(s+7)*5;
  const heatBase=regionIdx===4?8+sr(s+8)*1.5:regionIdx===6?6+sr(s+9)*2:regionIdx===0?5+sr(s+10)*3:1+sr(s+11)*5;
  const cycloneBase=regionIdx===1?6+sr(s+12)*3:regionIdx===3?5+sr(s+13)*3:regionIdx===6?4+sr(s+14)*3:0.5+sr(s+15)*4;
  const seaBase=regionIdx===6?7+sr(s+16)*2:regionIdx===1?5+sr(s+17)*3:regionIdx===0?3+sr(s+18)*4:0.5+sr(s+19)*4;
  const wildfireBase=regionIdx===2?4+sr(s+20)*3:regionIdx===1?3+sr(s+21)*4:1+sr(s+22)*5;
  const floodRisk=+Math.min(10,floodBase).toFixed(1);
  const droughtRisk=+Math.min(10,droughtBase).toFixed(1);
  const heatStressRisk=+Math.min(10,heatBase).toFixed(1);
  const cycloneRisk=+Math.min(10,cycloneBase).toFixed(1);
  const seaLevelRiskRating=+Math.min(10,seaBase).toFixed(1);
  const wildfireRisk=+Math.min(10,wildfireBase).toFixed(1);
  const compositePhysicalRisk=+((floodRisk+droughtRisk+heatStressRisk+cycloneRisk+seaLevelRiskRating+wildfireRisk)/6*10).toFixed(1);
  const gdpAtRisk2030Pct=+(1+compositePhysicalRisk*0.3+sr(s+23)*4).toFixed(1);
  const gdpAtRisk2050Pct=+(gdpAtRisk2030Pct*1.8+sr(s+24)*3).toFixed(1);
  const agricultureExposurePct=+(10+compositePhysicalRisk*2+sr(s+25)*15).toFixed(1);
  const coastalPopExposedM=+(sr(s+26)*80+0.5).toFixed(1);
  const infrastructureVulnerabilityScore=+Math.min(100,(compositePhysicalRisk*8+sr(s+27)*25)).toFixed(1);
  const adaptationCapacity=+(95-(compositePhysicalRisk*6)-(regionIdx>=4?15:0)+sr(s+28)*20).toFixed(1);
  const climateVulnerabilityIndex=+(100-adaptationCapacity+compositePhysicalRisk*2).toFixed(1);
  /* Scenario data */
  const scenario2030RCP26=+(gdpAtRisk2030Pct*0.6).toFixed(1);
  const scenario2030RCP45=+(gdpAtRisk2030Pct*0.85).toFixed(1);
  const scenario2030RCP85=+(gdpAtRisk2030Pct*1.4).toFixed(1);
  const lossAndDamageEstimateBnUSD=+(compositePhysicalRisk*sr(s+29)*20+1).toFixed(1);
  const adaptationFinancingNeedBnUSD=+(compositePhysicalRisk*sr(s+30)*15+0.5).toFixed(1);
  /* Infrastructure per sector */
  const infraScores=INFRA_SECTORS.reduce((a,sec,si)=>({...a,[sec]:+Math.min(100,(infrastructureVulnerabilityScore+sr(s+31+si)*30-15)).toFixed(1)}),{});
  return {
    id:i,name,region:REGIONS_LIST[regionIdx],floodRisk,droughtRisk,heatStressRisk,cycloneRisk,seaLevelRiskRating,wildfireRisk,
    compositePhysicalRisk,gdpAtRisk2030Pct,gdpAtRisk2050Pct,agricultureExposurePct,coastalPopExposedM,
    infrastructureVulnerabilityScore,adaptationCapacity:+Math.max(5,Math.min(95,adaptationCapacity)).toFixed(1),
    climateVulnerabilityIndex:+Math.min(100,climateVulnerabilityIndex).toFixed(1),
    scenario2030RCP26,scenario2030RCP45,scenario2030RCP85,lossAndDamageEstimateBnUSD,adaptationFinancingNeedBnUSD,
    infraScores,
  };
});

/* ─── NGFS Scenario Data: 5 economies × 5 scenarios, 2020-2050 ────────────── */
const NGFS_ECONOMIES=['United States','China','India','Germany','Brazil'];
const NGFS_YEARS=['2020','2025','2030','2035','2040','2045','2050'];
const NGFS_DATA=NGFS_ECONOMIES.map((eco,ei)=>{
  const base=COUNTRIES_PHY.find(c=>c.name===eco)||COUNTRIES_PHY[ei];
  return {
    economy:eco,
    scenarios:NGFS_SCENARIOS.map((scen,si)=>({
      scenario:scen,
      gdpImpact:NGFS_YEARS.map((yr,yi)=>({
        year:yr,
        impact:+((si*0.8+yi*0.5+(base?.compositePhysicalRisk||50)/20)*(-1)+(sr(ei*13+si*7+yi*3)-0.5)*2).toFixed(2),
      })),
    })),
  };
});

/* ─── Infrastructure vulnerability: 20 countries × 5 sectors ─────────────── */
const INFRA_COUNTRIES=COUNTRIES_PHY.slice(0,20);

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},
  header:{background:T.navy,borderRadius:8,padding:'18px 24px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'},
  title:{fontSize:22,fontWeight:700,color:'#fff',margin:0,letterSpacing:'-0.01em'},
  subtitle:{fontSize:12,color:'rgba(255,255,255,0.6)',marginTop:4,fontFamily:T.mono},
  badge:{fontSize:11,fontFamily:T.mono,padding:'3px 10px',borderRadius:4,fontWeight:700,background:'#7c3aed',color:'#fff'},
  tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},
  tab:(a)=>({padding:'10px 18px',fontSize:13,fontWeight:a?700:500,color:a?T.gold:T.textSec,borderBottom:a?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',background:'none',border:'none',fontFamily:T.font,marginBottom:-2,transition:'all 0.15s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:16},
  cardTitle:{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12,display:'flex',alignItems:'center',gap:8,borderBottom:`1px solid ${T.border}`,paddingBottom:8},
  grid:(cols)=>({display:'grid',gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:14}),
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:14,textAlign:'center'},
  kpiVal:{fontSize:24,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textSec,marginTop:4},
  select:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,cursor:'pointer'},
  btn:(a)=>({padding:'7px 14px',borderRadius:6,border:a?'none':`1px solid ${T.border}`,background:a?T.navy:T.surface,color:a?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}),
  table:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy,fontSize:11,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.04em',cursor:'pointer',userSelect:'none'},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,fontSize:12,color:T.text},
  row:{display:'flex',gap:14,marginBottom:14,alignItems:'stretch'},
  flex:{display:'flex',alignItems:'center',gap:8},
  mono:{fontFamily:T.mono,fontSize:12},
  input:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,width:'100%',boxSizing:'border-box'},
};

const hazardColor=(val)=>val>=8?'#dc2626':val>=6?'#ea580c':val>=4?'#d97706':val>=2?'#ca8a04':'#16a34a';
const hazardBg=(val)=>val>=8?'rgba(220,38,38,0.15)':val>=6?'rgba(234,88,12,0.12)':val>=4?'rgba(217,119,6,0.12)':val>=2?'rgba(202,138,4,0.1)':'rgba(22,163,74,0.10)';
const riskColor=(v)=>v>=70?T.red:v>=50?T.amber:v>=30?T.gold:T.green;
const CHART_COLORS=[T.navy,T.red,T.emerald,T.amber,T.teal,T.gold,T.navyL,T.sage,'#8b5cf6','#ec4899'];
const SCENARIO_COLORS={'Current Policies':T.red,'NDC Scenario':T.amber,'1.5C Orderly':T.emerald,'Disorderly Transition':T.gold,'Hot House World':'#7c3aed'};

export default function SovereignPhysicalRiskPage(){
  const [tab,setTab]=useState(0);
  const [sortCol,setSortCol]=useState('compositePhysicalRisk');
  const [sortAsc,setSortAsc]=useState(false);
  const [regionFilter,setRegionFilter]=useState('All');
  const [searchQ,setSearchQ]=useState('');
  const [selCountry,setSelCountry]=useState(COUNTRIES_PHY[0]);
  const [selNGFS,setSelNGFS]=useState('China');
  const [selHazard,setSelHazard]=useState('Flood');
  const [scenarioView,setScenarioView]=useState('2030');
  const [infraCountry,setInfraCountry]=useState(COUNTRIES_PHY[0].name);

  const filtered=useMemo(()=>{
    let d=[...COUNTRIES_PHY];
    if(regionFilter!=='All') d=d.filter(c=>c.region===regionFilter);
    if(searchQ) d=d.filter(c=>c.name.toLowerCase().includes(searchQ.toLowerCase()));
    d.sort((a,b)=>sortAsc?(a[sortCol]-b[sortCol]):(b[sortCol]-a[sortCol]));
    return d;
  },[regionFilter,searchQ,sortCol,sortAsc]);

  const handleSort=useCallback((col)=>{
    if(sortCol===col) setSortAsc(s=>!s);
    else { setSortCol(col); setSortAsc(false); }
  },[sortCol]);

  const radarData=useMemo(()=>{
    if(!selCountry) return [];
    return [
      {subject:'Flood',value:selCountry.floodRisk*10,fullMark:100},
      {subject:'Drought',value:selCountry.droughtRisk*10,fullMark:100},
      {subject:'Heat Stress',value:selCountry.heatStressRisk*10,fullMark:100},
      {subject:'Cyclone',value:selCountry.cycloneRisk*10,fullMark:100},
      {subject:'Sea Level',value:selCountry.seaLevelRiskRating*10,fullMark:100},
      {subject:'Wildfire',value:selCountry.wildfireRisk*10,fullMark:100},
      {subject:'Adaptation',value:selCountry.adaptationCapacity,fullMark:100},
      {subject:'Infra Vuln',value:selCountry.infrastructureVulnerabilityScore,fullMark:100},
    ];
  },[selCountry]);

  const infraRadarData=useMemo(()=>{
    const c=COUNTRIES_PHY.find(x=>x.name===infraCountry)||COUNTRIES_PHY[0];
    return INFRA_SECTORS.map(sec=>({subject:sec,value:c.infraScores[sec],fullMark:100}));
  },[infraCountry]);

  const selNGFSData=useMemo(()=>NGFS_DATA.find(d=>d.economy===selNGFS)||NGFS_DATA[0],[selNGFS]);

  /* ── Tab 0: Risk Overview ────────────────────────────────────────────────── */
  const renderOverview=()=>{
    const topRisk=[...COUNTRIES_PHY].sort((a,b)=>b.compositePhysicalRisk-a.compositePhysicalRisk).slice(0,15).map(c=>({name:c.name.length>10?c.name.slice(0,10)+'..':c.name,risk:c.compositePhysicalRisk,adapt:c.adaptationCapacity}));
    const byRegion=REGIONS_LIST.map(r=>{
      const rc=COUNTRIES_PHY.filter(c=>c.region===r);
      return {name:r.length>12?r.slice(0,12)+'..':r,risk:+(rc.reduce((s,c)=>s+c.compositePhysicalRisk,0)/Math.max(1,rc.length)).toFixed(1),adapt:+(rc.reduce((s,c)=>s+c.adaptationCapacity,0)/Math.max(1,rc.length)).toFixed(1),count:rc.length};
    });
    const kpis=[
      {l:'Universe',v:'70 countries'},{l:'High Risk (>70)',v:COUNTRIES_PHY.filter(c=>c.compositePhysicalRisk>70).length},
      {l:'Avg Composite Risk',v:(COUNTRIES_PHY.reduce((s,c)=>s+c.compositePhysicalRisk,0)/70).toFixed(1)},
      {l:'Avg Adaptation Cap',v:(COUNTRIES_PHY.reduce((s,c)=>s+c.adaptationCapacity,0)/70).toFixed(1)},
      {l:'Total L&D Est $B',v:(COUNTRIES_PHY.reduce((s,c)=>s+c.lossAndDamageEstimateBnUSD,0)/1000).toFixed(1)+'T'},
      {l:'Total Adapt Need $B',v:(COUNTRIES_PHY.reduce((s,c)=>s+c.adaptationFinancingNeedBnUSD,0)/1000).toFixed(1)+'T'},
      {l:'Coastal Pop Exposed',v:(COUNTRIES_PHY.reduce((s,c)=>s+c.coastalPopExposedM,0)).toFixed(0)+'M'},
      {l:'Avg GDP@Risk 2050',v:(COUNTRIES_PHY.reduce((s,c)=>s+c.gdpAtRisk2050Pct,0)/70).toFixed(1)+'%'},
    ];
    return (<>
      <div style={S.grid(4)}>
        {kpis.map((k,i)=>(<div key={i} style={S.kpi}>
          <div style={S.kpiLabel}>{k.l}</div>
          <div style={S.kpiVal}>{k.v}</div>
        </div>))}
      </div>
      <div style={{...S.row,marginTop:14}}>
        <div style={{...S.card,flex:2}}>
          <div style={S.cardTitle}>Top 15 Highest Physical Risk Countries</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topRisk} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:T.textSec}} width={70}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="risk" name="Composite Risk" radius={[0,4,4,0]}>
                {topRisk.map((d,i)=>(<Cell key={i} fill={riskColor(d.risk)}/>))}
              </Bar>
              <Bar dataKey="adapt" name="Adaptation Cap." fill={T.emerald} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Regional Risk vs Adaptation</div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={byRegion}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} interval={0}/>
              <YAxis tick={{fontSize:9,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="risk" name="Avg Risk" fill={T.red} opacity={0.75} radius={[3,3,0,0]}/>
              <Line type="monotone" dataKey="adapt" name="Avg Adapt Cap" stroke={T.emerald} strokeWidth={2} dot={{r:4}}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>Full Country Risk Rankings</span>
          <div style={S.flex}>
            <input style={{...S.input,width:160}} placeholder="Search..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
            <select style={S.select} value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
              <option value="All">All Regions</option>
              {REGIONS_LIST.map(r=>(<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead><tr>
              {[['name','Country'],['region','Region'],['compositePhysicalRisk','Composite'],['floodRisk','Flood'],['droughtRisk','Drought'],['heatStressRisk','Heat'],['cycloneRisk','Cyclone'],['seaLevelRiskRating','Sea Lvl'],['wildfireRisk','Wildfire'],['adaptationCapacity','Adapt Cap'],['gdpAtRisk2030Pct','GDP@Risk30'],['gdpAtRisk2050Pct','GDP@Risk50']].map(([c,l])=>(<th key={c} style={S.th} onClick={()=>handleSort(c)}>{l}{sortCol===c?(sortAsc?' ▲':' ▼'):''}</th>))}
            </tr></thead>
            <tbody>
              {filtered.slice(0,25).map(c=>(<tr key={c.id} style={{background:selCountry?.id===c.id?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelCountry(c)}>
                <td style={{...S.td,fontWeight:600}}>{c.name}</td>
                <td style={{...S.td,fontSize:11,color:T.textSec}}>{c.region}</td>
                <td style={{...S.td,fontFamily:T.mono,fontWeight:700,color:riskColor(c.compositePhysicalRisk)}}>{c.compositePhysicalRisk}</td>
                {[c.floodRisk,c.droughtRisk,c.heatStressRisk,c.cycloneRisk,c.seaLevelRiskRating,c.wildfireRisk].map((v,vi)=>(<td key={vi} style={{...S.td,fontFamily:T.mono,fontWeight:600,background:hazardBg(v),color:hazardColor(v)}}>{v}</td>))}
                <td style={{...S.td,fontFamily:T.mono,color:c.adaptationCapacity>60?T.green:c.adaptationCapacity>40?T.amber:T.red}}>{c.adaptationCapacity}</td>
                <td style={{...S.td,fontFamily:T.mono,color:T.amber}}>{c.gdpAtRisk2030Pct}%</td>
                <td style={{...S.td,fontFamily:T.mono,color:T.red,fontWeight:700}}>{c.gdpAtRisk2050Pct}%</td>
              </tr>))}
            </tbody>
          </table>
        </div>
        <div style={{fontSize:11,color:T.textMut,marginTop:8}}>Showing {Math.min(filtered.length,25)} of {filtered.length} countries</div>
      </div>
    </>);
  };

  /* ── Tab 1: Hazard Matrix ────────────────────────────────────────────────── */
  const renderHazardMatrix=()=>{
    const top25=[...COUNTRIES_PHY].sort((a,b)=>b.compositePhysicalRisk-a.compositePhysicalRisk).slice(0,25);
    const cphyLen=COUNTRIES_PHY.length||1;
    const hazardAvg=HAZARDS.map(h=>({hazard:h,global:+(COUNTRIES_PHY.reduce((s,c)=>s+c[h.toLowerCase().replace(' ','')+'Risk']||s+c[Object.keys(c).find(k=>k.includes(h.toLowerCase().split(' ')[0]))||'floodRisk'],0)/cphyLen).toFixed(1)}));
    const hazardKey={Flood:'floodRisk',Drought:'droughtRisk','Heat Stress':'heatStressRisk',Cyclone:'cycloneRisk','Sea Level Rise':'seaLevelRiskRating',Wildfire:'wildfireRisk'};
    const globalHazardAvg=HAZARDS.map(h=>({name:h,avg:+(COUNTRIES_PHY.reduce((s,c)=>s+c[hazardKey[h]],0)/cphyLen).toFixed(1)}));
    return (<>
      <div style={S.card}>
        <div style={S.cardTitle}>Hazard Risk Heatmap — Top 25 Countries</div>
        <div style={{overflowX:'auto'}}>
          <table style={{...S.table,fontSize:11}}>
            <thead><tr>
              <th style={{...S.th,width:120}}>Country</th>
              {HAZARDS.map(h=>(<th key={h} style={{...S.th,textAlign:'center'}}>{h}</th>))}
              <th style={S.th}>Composite</th>
            </tr></thead>
            <tbody>
              {top25.map(c=>(<tr key={c.id} style={{cursor:'pointer'}} onClick={()=>setSelCountry(c)}>
                <td style={{...S.td,fontWeight:600,fontSize:11}}>{c.name}</td>
                {HAZARDS.map(h=>(<td key={h} style={{...S.td,fontFamily:T.mono,fontWeight:700,background:hazardBg(c[hazardKey[h]]),color:hazardColor(c[hazardKey[h]]),textAlign:'center'}}>{c[hazardKey[h]]}</td>))}
                <td style={{...S.td,fontFamily:T.mono,fontWeight:700,color:riskColor(c.compositePhysicalRisk)}}>{c.compositePhysicalRisk}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Global Average Hazard Scores</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={globalHazardAvg}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
              <YAxis domain={[0,10]} tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Bar dataKey="avg" name="Avg Score (0-10)">
                {globalHazardAvg.map((d,i)=>(<Cell key={i} fill={hazardColor(d.avg)}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Hazard Exposure by Region</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={REGIONS_LIST.map(r=>{const rc=COUNTRIES_PHY.filter(c=>c.region===r);const hazardKey2={Flood:'floodRisk',Drought:'droughtRisk','Heat Stress':'heatStressRisk',Cyclone:'cycloneRisk'};return {name:r.length>8?r.slice(0,8)+'..':r,...Object.entries(hazardKey2).reduce((a,[h,k])=>({...a,[h]:+(rc.reduce((s,c)=>s+c[k],0)/Math.max(1,rc.length)).toFixed(1)}),{})};})} barGap={1}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} interval={0}/>
              <YAxis domain={[0,10]} tick={{fontSize:9,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="Flood" fill={T.navyL} radius={[2,2,0,0]}/>
              <Bar dataKey="Drought" fill={T.amber} radius={[2,2,0,0]}/>
              <Bar dataKey="Heat Stress" fill={T.red} radius={[2,2,0,0]}/>
              <Bar dataKey="Cyclone" fill={T.teal} radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>);
  };

  /* ── Tab 2: GDP at Risk ──────────────────────────────────────────────────── */
  const renderGdpAtRisk=()=>{
    const gdpData=[...COUNTRIES_PHY].sort((a,b)=>b.gdpAtRisk2050Pct-a.gdpAtRisk2050Pct).slice(0,18).map(c=>({
      name:c.name.length>9?c.name.slice(0,9)+'..':c.name,
      rcp26:c.scenario2030RCP26,
      rcp45:c.scenario2030RCP45,
      rcp85:c.scenario2030RCP85,
      y2050:c.gdpAtRisk2050Pct,
    }));
    const scatterData=COUNTRIES_PHY.map(c=>({x:c.adaptationCapacity,y:c.gdpAtRisk2050Pct,z:c.lossAndDamageEstimateBnUSD,name:c.name}));
    return (<>
      <div style={S.card}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>GDP at Risk by Scenario — Top 18 Countries (%)</span>
          <div style={S.flex}>
            <button style={S.btn(scenarioView==='2030')} onClick={()=>setScenarioView('2030')}>2030</button>
            <button style={S.btn(scenarioView==='2050')} onClick={()=>setScenarioView('2050')}>2050</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={gdpData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'GDP at Risk (%)',angle:-90,position:'insideLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            {scenarioView==='2030'?(<>
              <Bar dataKey="rcp26" name="RCP 2.6" fill={T.emerald} radius={[3,3,0,0]}/>
              <Bar dataKey="rcp45" name="RCP 4.5" fill={T.amber} radius={[3,3,0,0]}/>
              <Bar dataKey="rcp85" name="RCP 8.5" fill={T.red} radius={[3,3,0,0]}/>
            </>):(<Bar dataKey="y2050" name="GDP@Risk 2050" fill='#7c3aed' radius={[3,3,0,0]}/>)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Adaptation Capacity vs GDP at Risk 2050 (bubble = L&D estimate)</div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="x" name="Adaptation Cap" tick={{fontSize:10,fill:T.textSec}} label={{value:'Adaptation Capacity',position:'insideBottom',offset:-5,fontSize:10}}/>
            <YAxis dataKey="y" name="GDP@Risk%" tick={{fontSize:10,fill:T.textSec}} label={{value:'GDP at Risk 2050 %',angle:-90,position:'insideLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}} content={({payload})=>{
              if(!payload?.length) return null;
              const d=payload[0]?.payload;
              return (<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'6px 10px',fontSize:10}}>
                <div style={{fontWeight:700}}>{d?.name}</div>
                <div>Adapt Cap: {d?.x} | GDP@Risk: {d?.y}%</div>
                <div>L&D: ${d?.z}B</div>
              </div>);
            }}/>
            <Scatter name="Countries" data={scatterData} fill={T.red} opacity={0.7}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </>);
  };

  /* ── Tab 3: Infrastructure Vulnerability ─────────────────────────────────── */
  const renderInfrastructure=()=>{
    const infraKey='Ports';
    const infraBar=INFRA_COUNTRIES.map(c=>({name:c.name.length>9?c.name.slice(0,9)+'..':c.name,...INFRA_SECTORS.reduce((a,sec)=>({...a,[sec]:c.infraScores[sec]}),{})}));
    const selInfraC=COUNTRIES_PHY.find(c=>c.name===infraCountry)||COUNTRIES_PHY[0];
    return (<>
      <div style={{...S.flex,marginBottom:14}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Country:</span>
        <select style={S.select} value={infraCountry} onChange={e=>setInfraCountry(e.target.value)}>
          {INFRA_COUNTRIES.map(c=>(<option key={c.id} value={c.name}>{c.name}</option>))}
        </select>
      </div>
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>{selInfraC.name} — Infrastructure Vulnerability Radar</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={infraRadarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="subject" tick={{fontSize:11,fill:T.textSec}}/>
              <PolarRadiusAxis domain={[0,100]} tick={{fontSize:8,fill:T.textMut}}/>
              <Radar name={selInfraC.name} dataKey="value" stroke={T.red} fill={T.red} fillOpacity={0.2}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>{selInfraC.name} — Sector Scores</div>
          {INFRA_SECTORS.map(sec=>(<div key={sec} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:12,fontWeight:600,color:T.navy}}>{sec}</span>
              <span style={{fontFamily:T.mono,fontWeight:700,color:riskColor(selInfraC.infraScores[sec]),fontSize:13}}>{selInfraC.infraScores[sec]}</span>
            </div>
            <div style={{height:8,borderRadius:4,background:T.border,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${selInfraC.infraScores[sec]}%`,background:riskColor(selInfraC.infraScores[sec]),borderRadius:4}}/>
            </div>
          </div>))}
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Infrastructure Vulnerability Heatmap — Top 20 Countries</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead><tr>
              <th style={{...S.th,width:110}}>Country</th>
              {INFRA_SECTORS.map(s=>(<th key={s} style={{...S.th,textAlign:'center'}}>{s}</th>))}
              <th style={S.th}>Composite Risk</th>
            </tr></thead>
            <tbody>
              {INFRA_COUNTRIES.map(c=>(<tr key={c.id} style={{cursor:'pointer'}} onClick={()=>setSelCountry(c)}>
                <td style={{...S.td,fontWeight:600,fontSize:11}}>{c.name}</td>
                {INFRA_SECTORS.map(sec=>(<td key={sec} style={{...S.td,fontFamily:T.mono,fontWeight:700,background:hazardBg(c.infraScores[sec]/10),color:riskColor(c.infraScores[sec]),textAlign:'center'}}>{c.infraScores[sec]}</td>))}
                <td style={{...S.td,fontFamily:T.mono,fontWeight:700,color:riskColor(c.compositePhysicalRisk)}}>{c.compositePhysicalRisk}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </>);
  };

  /* ── Tab 4: Forward Scenarios ────────────────────────────────────────────── */
  const renderScenarios=()=>{
    const scenData=NGFS_SCENARIOS.map(scen=>({
      name:scen.length>16?scen.slice(0,16)+'..':scen,
      fullName:scen,
      avgGdpImpact2050:+(COUNTRIES_PHY.reduce((s,c,ci)=>{
        const mult=scen==='Current Policies'?1.0:scen==='NDC Scenario'?0.7:scen==='1.5C Orderly'?0.4:scen==='Disorderly Transition'?0.85:'Hot House World'===scen?1.2:0.9;
        return s+c.gdpAtRisk2050Pct*mult;
      },0)/70).toFixed(1),
      atRisk:COUNTRIES_PHY.filter(c=>c.gdpAtRisk2050Pct>10).length,
    }));
    return (<>
      <div style={S.card}>
        <div style={S.cardTitle}>NGFS Scenario GDP Impact Comparison (avg % GDP at risk 2050)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={scenData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Avg GDP at Risk %',angle:-90,position:'insideLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
            <Bar dataKey="avgGdpImpact2050" name="Avg GDP@Risk 2050 %">
              {scenData.map((d,i)=>(<Cell key={i} fill={Object.values(SCENARIO_COLORS)[i]}/>))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{...S.flex,marginBottom:14}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Economy:</span>
        <select style={S.select} value={selNGFS} onChange={e=>setSelNGFS(e.target.value)}>
          {NGFS_ECONOMIES.map(e=>(<option key={e} value={e}>{e}</option>))}
        </select>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>NGFS Scenario GDP Impact Trajectory — {selNGFS} (% loss)</div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" type="category" allowDuplicatedCategory={false} tick={{fontSize:10,fill:T.textSec}} data={NGFS_YEARS.map(y=>({year:y}))}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'GDP Impact %',angle:-90,position:'insideLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <ReferenceLine y={0} stroke={T.border} strokeWidth={2}/>
            {selNGFSData.scenarios.map(scen=>(<Line key={scen.scenario} type="monotone" data={scen.gdpImpact} dataKey="impact" name={scen.scenario} stroke={SCENARIO_COLORS[scen.scenario]} strokeWidth={2} dot={false}/>))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Scenario Comparison — All 5 Economies × Scenarios (2050 GDP Impact %)</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Economy</th>
              {NGFS_SCENARIOS.map(s=>(<th key={s} style={S.th}>{s.length>14?s.slice(0,14)+'..':s}</th>))}
            </tr></thead>
            <tbody>
              {NGFS_DATA.map(eco=>(<tr key={eco.economy}>
                <td style={{...S.td,fontWeight:600}}>{eco.economy}</td>
                {eco.scenarios.map(scen=>{
                  const v=scen.gdpImpact[scen.gdpImpact.length-1].impact;
                  return (<td key={scen.scenario} style={{...S.td,fontFamily:T.mono,fontWeight:700,color:v<-5?T.red:v<-2?T.amber:v<0?T.gold:T.green}}>{v>0?'+':''}{v}%</td>);
                })}
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </>);
  };

  /* ── Tab 5: NGFS Alignment ───────────────────────────────────────────────── */
  const renderNgfs=()=>{
    const areaData=NGFS_YEARS.map((yr,yi)=>({
      year:yr,
      ...NGFS_SCENARIOS.reduce((a,scen,si)=>({...a,[scen]:+((yi+1)*(si===0?2.2:si===1?1.5:si===2?0.8:si===3?1.8:2.8)).toFixed(2)}),{}),
    }));
    return (<>
      <div style={S.card}>
        <div style={S.cardTitle}>NGFS Scenario Physical Risk Trajectories (Global Avg Physical Risk Score)</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={areaData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Avg Risk Score',angle:-90,position:'insideLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            {NGFS_SCENARIOS.map(scen=>(<Area key={scen} type="monotone" dataKey={scen} stroke={SCENARIO_COLORS[scen]} fill={SCENARIO_COLORS[scen]} fillOpacity={0.12} strokeWidth={2}/>))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={S.grid(5)}>
        {NGFS_SCENARIOS.map(scen=>(<div key={scen} style={{...S.kpi,borderTop:`4px solid ${SCENARIO_COLORS[scen]}`}}>
          <div style={S.kpiLabel}>{scen}</div>
          <div style={{...S.kpiVal,color:SCENARIO_COLORS[scen],fontSize:18}}>
            {scen==='Current Policies'?'3.5°C':scen==='NDC Scenario'?'2.5°C':scen==='1.5C Orderly'?'1.5°C':scen==='Disorderly Transition'?'1.8°C':'4°C+'}
          </div>
          <div style={{fontSize:10,color:T.textMut,marginTop:3}}>
            {scen==='Current Policies'?'High physical risk':scen==='NDC Scenario'?'Moderate risk':scen==='1.5C Orderly'?'Lowest risk':scen==='Disorderly Transition'?'Elevated transition':'Catastrophic'}
          </div>
        </div>))}
      </div>
    </>);
  };

  /* ── Tab 6: Country Profiles ─────────────────────────────────────────────── */
  const renderProfiles=()=>{
    return (<>
      <div style={{...S.flex,marginBottom:14}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Country:</span>
        <select style={S.select} value={selCountry.name} onChange={e=>setSelCountry(COUNTRIES_PHY.find(c=>c.name===e.target.value)||COUNTRIES_PHY[0])}>
          {COUNTRIES_PHY.map(c=>(<option key={c.id} value={c.name}>{c.name}</option>))}
        </select>
      </div>
      <div style={S.row}>
        <div style={{...S.card,flex:1,borderLeft:`4px solid ${riskColor(selCountry.compositePhysicalRisk)}`}}>
          <div style={S.cardTitle}>{selCountry.name} — Complete Risk Profile</div>
          <div style={S.grid(3)}>
            {[['Composite Risk',selCountry.compositePhysicalRisk,riskColor(selCountry.compositePhysicalRisk)],['Adaptation Cap',selCountry.adaptationCapacity,selCountry.adaptationCapacity>60?T.green:selCountry.adaptationCapacity>40?T.amber:T.red],['Vuln Index',selCountry.climateVulnerabilityIndex,riskColor(selCountry.climateVulnerabilityIndex)],['GDP@Risk 30',`${selCountry.gdpAtRisk2030Pct}%`,T.amber],['GDP@Risk 50',`${selCountry.gdpAtRisk2050Pct}%`,T.red],['Infra Vuln',selCountry.infrastructureVulnerabilityScore,riskColor(selCountry.infrastructureVulnerabilityScore)],['Coastal Pop',`${selCountry.coastalPopExposedM}M`,T.navyL],['Agri Exposure',`${selCountry.agricultureExposurePct}%`,T.amber],['L&D Est $B',`$${selCountry.lossAndDamageEstimateBnUSD}B`,T.red]].map(([l,v,c])=>(<div key={l} style={{background:T.surfaceH,borderRadius:6,padding:'8px 10px',textAlign:'center'}}>
              <div style={{fontSize:10,color:T.textSec}}>{l}</div>
              <div style={{fontFamily:T.mono,fontSize:16,fontWeight:700,color:c||T.navy,marginTop:2}}>{v}</div>
            </div>))}
          </div>
        </div>
        <div style={{...S.card,width:300}}>
          <div style={S.cardTitle}>Multi-Hazard Radar</div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="subject" tick={{fontSize:9,fill:T.textSec}}/>
              <PolarRadiusAxis domain={[0,100]} tick={{fontSize:7,fill:T.textMut}}/>
              <Radar name={selCountry.name} dataKey="value" stroke={riskColor(selCountry.compositePhysicalRisk)} fill={riskColor(selCountry.compositePhysicalRisk)} fillOpacity={0.2}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Hazard Breakdown vs Global Average</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={HAZARDS.map(h=>{const key={Flood:'floodRisk',Drought:'droughtRisk','Heat Stress':'heatStressRisk',Cyclone:'cycloneRisk','Sea Level Rise':'seaLevelRiskRating',Wildfire:'wildfireRisk'}[h];return {name:h,country:selCountry[key],global:+(COUNTRIES_PHY.reduce((s,c)=>s+c[key],0)/70).toFixed(1)};})}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
            <YAxis domain={[0,10]} tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="country" name={selCountry.name} fill={T.red} opacity={0.8} radius={[4,4,0,0]}/>
            <Bar dataKey="global" name="Global Avg" fill={T.navyL} opacity={0.6} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Scenario GDP Impact 2030</div>
        <div style={S.grid(3)}>
          {[['RCP 2.6',selCountry.scenario2030RCP26,T.emerald],['RCP 4.5',selCountry.scenario2030RCP45,T.amber],['RCP 8.5',selCountry.scenario2030RCP85,T.red]].map(([l,v,c])=>(<div key={l} style={{...S.kpi,borderLeft:`4px solid ${c}`}}>
            <div style={S.kpiLabel}>{l} Scenario</div>
            <div style={{...S.kpiVal,color:c}}>{v}%</div>
            <div style={{fontSize:11,color:T.textMut}}>GDP at risk 2030</div>
          </div>))}
        </div>
      </div>
    </>);
  };

  const tabContent=[renderOverview,renderHazardMatrix,renderGdpAtRisk,renderInfrastructure,renderScenarios,renderNgfs,renderProfiles];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={{...S.flex,gap:12}}>
            <span style={S.badge}>EP-AX3</span>
            <h1 style={S.title}>Sovereign Physical Climate Risk</h1>
          </div>
          <div style={S.subtitle}>70-country physical risk universe · Hazard matrix · NGFS scenarios · Infrastructure vulnerability · GDP at risk</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:T.mono,fontSize:11,color:'rgba(255,255,255,0.5)'}}>Last updated: 2026-04-01 09:00 UTC</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2}}>SPRINT AX · PHYSICAL RISK INTELLIGENCE</div>
        </div>
      </div>
      <div style={S.tabs}>
        {TABS.map((t,i)=>(<button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}
      </div>
      {tabContent[tab]()}
    </div>
  );
}
