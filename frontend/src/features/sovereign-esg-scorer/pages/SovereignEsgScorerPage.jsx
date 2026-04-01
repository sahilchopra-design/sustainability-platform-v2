import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, Cell, Legend, LineChart, Line,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#0e7490',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',emerald:'#059669',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ─── Static Seeds ────────────────────────────────────────────────────────── */
const TABS=['Overview','E-Score','S-Score','G-Score','Trend Analysis','Provider Comparison','Portfolio Exposure'];
const REGIONS=['Africa','Asia-Pacific','Europe','Latin America','Middle East','North America'];
const RATING_TIERS=['AAA','AA','A','BBB','BB','B','CCC'];
const PROVIDERS=['S&P Global','Sustainalytics','Moody\'s ESG','MSCI','ISS','Bloomberg'];
const QUARTERS=['Q1-22','Q2-22','Q3-22','Q4-22','Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24'];

const COUNTRY_NAMES=[
  'Norway','Denmark','Sweden','Finland','Switzerland','Netherlands','Germany','New Zealand','Ireland','Austria',
  'United Kingdom','Canada','Australia','Singapore','Japan','Belgium','France','South Korea','Luxembourg','Iceland',
  'United States','Czech Republic','Israel','Estonia','Portugal','Spain','Poland','Italy','Latvia','Lithuania',
  'Slovenia','Slovakia','Hungary','Greece','Bulgaria','Romania','Croatia','Mexico','Brazil','Chile',
  'Colombia','Argentina','Peru','Costa Rica','Panama','Uruguay','China','India','Thailand','Malaysia',
  'Indonesia','Philippines','Vietnam','Bangladesh','Pakistan','South Africa','Nigeria','Kenya','Ghana','Morocco',
  'Egypt','Saudi Arabia','UAE','Qatar','Kuwait','Turkey','Jordan','Oman','Bahrain','Tunisia',
  'Kazakhstan','Rwanda','Ethiopia','Tanzania','Senegal','Ivory Coast','Sri Lanka','Nepal','Myanmar','Cambodia',
];

const ISO2=[
  'NO','DK','SE','FI','CH','NL','DE','NZ','IE','AT','GB','CA','AU','SG','JP','BE','FR','KR','LU','IS',
  'US','CZ','IL','EE','PT','ES','PL','IT','LV','LT','SI','SK','HU','GR','BG','RO','HR','MX','BR','CL',
  'CO','AR','PE','CR','PA','UY','CN','IN','TH','MY','ID','PH','VN','BD','PK','ZA','NG','KE','GH','MA',
  'EG','SA','AE','QA','KW','TR','JO','OM','BH','TN','KZ','RW','ET','TZ','SN','CI','LK','NP','MM','KH',
];

const REGION_MAP={
  'Norway':2,'Denmark':2,'Sweden':2,'Finland':2,'Switzerland':2,'Netherlands':2,'Germany':2,'New Zealand':1,'Ireland':2,'Austria':2,
  'United Kingdom':2,'Canada':5,'Australia':1,'Singapore':1,'Japan':1,'Belgium':2,'France':2,'South Korea':1,'Luxembourg':2,'Iceland':2,
  'United States':5,'Czech Republic':2,'Israel':4,'Estonia':2,'Portugal':2,'Spain':2,'Poland':2,'Italy':2,'Latvia':2,'Lithuania':2,
  'Slovenia':2,'Slovakia':2,'Hungary':2,'Greece':2,'Bulgaria':2,'Romania':2,'Croatia':2,'Mexico':3,'Brazil':3,'Chile':3,
  'Colombia':3,'Argentina':3,'Peru':3,'Costa Rica':3,'Panama':3,'Uruguay':3,'China':1,'India':1,'Thailand':1,'Malaysia':1,
  'Indonesia':1,'Philippines':1,'Vietnam':1,'Bangladesh':1,'Pakistan':1,'South Africa':0,'Nigeria':0,'Kenya':0,'Ghana':0,'Morocco':0,
  'Egypt':4,'Saudi Arabia':4,'UAE':4,'Qatar':4,'Kuwait':4,'Turkey':4,'Jordan':4,'Oman':4,'Bahrain':4,'Tunisia':0,
  'Kazakhstan':1,'Rwanda':0,'Ethiopia':0,'Tanzania':0,'Senegal':0,'Ivory Coast':0,'Sri Lanka':1,'Nepal':1,'Myanmar':1,'Cambodia':1,
};

const RATING_BASE={
  'Norway':0,'Denmark':0,'Sweden':0,'Finland':0,'Switzerland':0,'Netherlands':0,'Germany':0,'New Zealand':0,'Ireland':0,'Austria':0,
  'United Kingdom':1,'Canada':0,'Australia':0,'Singapore':0,'Japan':1,'Belgium':1,'France':1,'South Korea':1,'Luxembourg':0,'Iceland':1,
  'United States':1,'Czech Republic':2,'Israel':2,'Estonia':1,'Portugal':2,'Spain':2,'Poland':2,'Italy':2,'Latvia':2,'Lithuania':2,
  'Slovenia':2,'Slovakia':2,'Hungary':3,'Greece':3,'Bulgaria':3,'Romania':3,'Croatia':3,'Mexico':3,'Brazil':4,'Chile':2,
  'Colombia':4,'Argentina':5,'Peru':4,'Costa Rica':4,'Panama':3,'Uruguay':3,'China':3,'India':4,'Thailand':3,'Malaysia':3,
  'Indonesia':4,'Philippines':4,'Vietnam':4,'Bangladesh':5,'Pakistan':5,'South Africa':4,'Nigeria':5,'Kenya':5,'Ghana':4,'Morocco':4,
  'Egypt':5,'Saudi Arabia':3,'UAE':2,'Qatar':2,'Kuwait':2,'Turkey':4,'Jordan':4,'Oman':3,'Bahrain':3,'Tunisia':4,
  'Kazakhstan':4,'Rwanda':5,'Ethiopia':6,'Tanzania':6,'Senegal':5,'Ivory Coast':5,'Sri Lanka':5,'Nepal':6,'Myanmar':6,'Cambodia':5,
};

const COUNTRIES=COUNTRY_NAMES.map((name,i)=>{
  const s=i*13+5;
  const regionIdx=REGION_MAP[name]??i%6;
  const ratingIdx=Math.min((RATING_BASE[name]??i%7),6);
  const esgRating=RATING_TIERS[ratingIdx];
  const baseE=Math.max(10,Math.min(98,90-(ratingIdx*12)+sr(s)*15-7));
  const baseS=Math.max(10,Math.min(98,88-(ratingIdx*11)+sr(s+3)*14-6));
  const baseG=Math.max(10,Math.min(98,86-(ratingIdx*10)+sr(s+6)*16-7));
  const eScore=+baseE.toFixed(1);
  const sScore=+baseS.toFixed(1);
  const gScore=+baseG.toFixed(1);
  const totalEsg=+(eScore*0.33+sScore*0.33+gScore*0.34).toFixed(1);
  const gdpTrillions=regionIdx===5?+(sr(s+9)*20+0.5).toFixed(2):regionIdx===2?+(sr(s+10)*6+0.1).toFixed(2):+(sr(s+11)*3+0.05).toFixed(2);
  const population=regionIdx===1&&(name==='China'||name==='India')?+(sr(s+12)*800+400).toFixed(0):+(sr(s+13)*100+5).toFixed(0);
  const trend=ratingIdx<=1?'improving':ratingIdx>=5?'deteriorating':sr(s+14)>0.5?'improving':sr(s+14)>0.25?'stable':'deteriorating';
  const co2PerCapita=+(2+sr(s+15)*18).toFixed(2);
  const renewableSharePct=+(10+sr(s+16)*70).toFixed(1);
  const corruptionIndex=+(20+sr(s+17)*70).toFixed(1);
  const pressureFreedomIndex=+(20+sr(s+18)*75).toFixed(1);
  const giniCoefficient=+(0.25+sr(s+19)*0.4).toFixed(3);
  const healthcareIndex=+(30+sr(s+20)*65).toFixed(1);
  const educationIndex=+(25+sr(s+21)*70).toFixed(1);
  const quarterlyTrend=QUARTERS.map((q,qi)=>({
    q,
    esg:+(totalEsg+(sr(s+30+qi*7)-0.5)*8+(qi-6)*0.3).toFixed(1),
    e:+(eScore+(sr(s+31+qi*7)-0.5)*9+(qi-6)*0.25).toFixed(1),
    s:+(sScore+(sr(s+32+qi*7)-0.5)*7+(qi-6)*0.2).toFixed(1),
    g:+(gScore+(sr(s+33+qi*7)-0.5)*8+(qi-6)*0.22).toFixed(1),
  }));
  const providerScores=PROVIDERS.map((prov,pi)=>+(totalEsg+(sr(s+50+pi*11)-0.5)*16).toFixed(1));
  return {id:i,name,iso2:ISO2[i],region:REGIONS[regionIdx],gdpTrillions,population:+population,eScore,sScore,gScore,totalEsg,esgRating,trend,co2PerCapita,renewableSharePct,corruptionIndex,pressureFreedomIndex,giniCoefficient,healthcareIndex,educationIndex,quarterlyTrend,providerScores};
});

/* ─── Provider Divergence Dataset (top 20 countries × 6 providers) ─────── */
const PROVIDER_DATA=COUNTRIES.slice(0,20).map(c=>({
  name:c.name.length>12?c.name.slice(0,12)+'..':c.name,
  fullName:c.name,
  scores:c.providerScores,
  divergence:+(Math.max(...c.providerScores)-Math.min(...c.providerScores)).toFixed(1),
}));

/* ─── Portfolio exposure: 30 holdings ──────────────────────────────────── */
const PORTFOLIO=Array.from({length:30},(_,i)=>{
  const c=COUNTRIES[Math.floor(sr(i*17)*60)];
  return {
    id:i,country:c.name,iso2:c.iso2,esgRating:c.esgRating,totalEsg:c.totalEsg,
    weightPct:+(sr(i*19)*8+0.5).toFixed(2),
    exposureM:+(sr(i*23)*500+10).toFixed(1),
    benchmarkWeight:+(sr(i*29)*6+0.3).toFixed(2),
    activeWeight:+(sr(i*31)*4-2).toFixed(2),
    trend:c.trend,
  };
});

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},
  header:{background:T.navy,borderRadius:8,padding:'18px 24px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'},
  title:{fontSize:22,fontWeight:700,color:'#fff',margin:0,letterSpacing:'-0.01em'},
  subtitle:{fontSize:12,color:'rgba(255,255,255,0.6)',marginTop:4,fontFamily:T.mono},
  badge:{fontSize:11,fontFamily:T.mono,padding:'3px 10px',borderRadius:4,fontWeight:700,background:T.gold,color:T.navy},
  tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},
  tab:(a)=>({padding:'10px 18px',fontSize:13,fontWeight:a?700:500,color:a?T.gold:T.textSec,borderBottom:a?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',background:'none',border:'none',fontFamily:T.font,marginBottom:-2,transition:'all 0.15s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:16},
  cardTitle:{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12,display:'flex',alignItems:'center',gap:8,borderBottom:`1px solid ${T.border}`,paddingBottom:8},
  grid:(cols)=>({display:'grid',gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:14}),
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:14,textAlign:'center'},
  kpiVal:{fontSize:24,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textSec,marginTop:4},
  kpiDelta:(v,good)=>({fontSize:11,fontFamily:T.mono,fontWeight:600,marginTop:4,color:good?(v>=0?T.green:T.red):(v>=0?T.red:T.green)}),
  select:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,cursor:'pointer'},
  btn:(a)=>({padding:'7px 14px',borderRadius:6,border:a?'none':`1px solid ${T.border}`,background:a?T.navy:T.surface,color:a?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}),
  table:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy,fontSize:11,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.04em',cursor:'pointer',userSelect:'none'},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,fontSize:12,color:T.text},
  pill:(c)=>({display:'inline-block',fontSize:10,fontFamily:T.mono,padding:'2px 8px',borderRadius:10,fontWeight:700,color:'#fff',background:c}),
  input:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,width:'100%',boxSizing:'border-box'},
  row:{display:'flex',gap:14,marginBottom:14,alignItems:'stretch'},
  flex:{display:'flex',alignItems:'center',gap:8},
  mono:{fontFamily:T.mono,fontSize:12},
  bar:(pct,color)=>(<div style={{height:6,borderRadius:3,background:T.border,overflow:'hidden',marginTop:4}}><div style={{height:'100%',width:`${Math.min(pct,100)}%`,background:color,borderRadius:3}}/></div>),
};

const ratingColor=(r)=>r==='AAA'?T.emerald:r==='AA'?T.teal:r==='A'?T.navyL:r==='BBB'?T.amber:r==='BB'?'#ea580c':r==='B'?T.red:'#9f1239';
const trendIcon=(t)=>t==='improving'?'▲':t==='deteriorating'?'▼':'●';
const trendColor=(t)=>t==='improving'?T.green:t==='deteriorating'?T.red:T.amber;
const CHART_COLORS=[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red,T.teal,T.emerald,'#8b5cf6','#ec4899'];

export default function SovereignEsgScorerPage(){
  const [tab,setTab]=useState(0);
  const [regionFilter,setRegionFilter]=useState('All');
  const [ratingFilter,setRatingFilter]=useState('All');
  const [sortCol,setSortCol]=useState('totalEsg');
  const [sortAsc,setSortAsc]=useState(false);
  const [searchQ,setSearchQ]=useState('');
  const [selCountry,setSelCountry]=useState(COUNTRIES[0]);
  const [selProvider,setSelProvider]=useState('All');
  const [showBottom,setShowBottom]=useState(false);
  const [portfolioSort,setPortfolioSort]=useState('exposureM');
  const [portfolioSortAsc,setPortfolioSortAsc]=useState(false);

  const filtered=useMemo(()=>{
    let d=[...COUNTRIES];
    if(regionFilter!=='All') d=d.filter(c=>c.region===regionFilter);
    if(ratingFilter!=='All') d=d.filter(c=>c.esgRating===ratingFilter);
    if(searchQ) d=d.filter(c=>c.name.toLowerCase().includes(searchQ.toLowerCase())||c.iso2.toLowerCase().includes(searchQ.toLowerCase()));
    d.sort((a,b)=>sortAsc?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]>b[sortCol]?-1:1));
    return d;
  },[regionFilter,ratingFilter,searchQ,sortCol,sortAsc]);

  const handleSort=useCallback((col)=>{
    if(sortCol===col) setSortAsc(s=>!s);
    else { setSortCol(col); setSortAsc(false); }
  },[sortCol]);

  const radarData=useMemo(()=>{
    if(!selCountry) return [];
    return [
      {subject:'E-Score',value:selCountry.eScore,fullMark:100},
      {subject:'S-Score',value:selCountry.sScore,fullMark:100},
      {subject:'G-Score',value:selCountry.gScore,fullMark:100},
      {subject:'Renewables',value:selCountry.renewableSharePct,fullMark:100},
      {subject:'Anti-Corrupt',value:selCountry.corruptionIndex,fullMark:100},
      {subject:'Healthcare',value:selCountry.healthcareIndex,fullMark:100},
      {subject:'Education',value:selCountry.educationIndex,fullMark:100},
    ];
  },[selCountry]);

  const top20=useMemo(()=>[...COUNTRIES].sort((a,b)=>b.totalEsg-a.totalEsg).slice(0,20),[]);
  const bottom20=useMemo(()=>[...COUNTRIES].sort((a,b)=>a.totalEsg-b.totalEsg).slice(0,20),[]);
  const rankingData=useMemo(()=>(showBottom?bottom20:top20).map(c=>({name:c.name.length>12?c.name.slice(0,12)+'..':c.name,esg:c.totalEsg,e:c.eScore,s:c.sScore,g:c.gScore})),[showBottom,top20,bottom20]);

  const scatterData=useMemo(()=>COUNTRIES.map(c=>({x:c.gdpTrillions,y:c.totalEsg,z:c.population,name:c.name,rating:c.esgRating,fill:ratingColor(c.esgRating)})),[]);

  const providerDivergence=useMemo(()=>{
    return PROVIDER_DATA.map(p=>({name:p.name,...PROVIDERS.reduce((a,pr,pi)=>({...a,[pr]:p.scores[pi]}),{}),divergence:p.divergence}));
  },[]);

  const portfolioFiltered=useMemo(()=>{
    return [...PORTFOLIO].sort((a,b)=>portfolioSortAsc?(a[portfolioSort]-b[portfolioSort]):(b[portfolioSort]-a[portfolioSort]));
  },[portfolioSort,portfolioSortAsc]);

  const handlePortSort=useCallback((col)=>{
    if(portfolioSort===col) setPortfolioSortAsc(s=>!s);
    else { setPortfolioSort(col); setPortfolioSortAsc(false); }
  },[portfolioSort]);

  /* ── Tab 0: Overview ─────────────────────────────────────────────────────── */
  const renderOverview=()=>{
    const byRegion=REGIONS.map(r=>{
      const rc=COUNTRIES.filter(c=>c.region===r);
      return {name:r.length>14?r.slice(0,14)+'..':r,avgEsg:+(rc.reduce((s,c)=>s+c.totalEsg,0)/rc.length).toFixed(1),avgE:+(rc.reduce((s,c)=>s+c.eScore,0)/rc.length).toFixed(1),avgS:+(rc.reduce((s,c)=>s+c.sScore,0)/rc.length).toFixed(1),avgG:+(rc.reduce((s,c)=>s+c.gScore,0)/rc.length).toFixed(1),count:rc.length};
    });
    const ratingDist=RATING_TIERS.map(r=>({name:r,count:COUNTRIES.filter(c=>c.esgRating===r).length,color:ratingColor(r)}));
    const kpis=[
      {label:'Universe',value:'60',unit:'countries',delta:'+4 QoQ',good:true},
      {label:'Avg ESG Score',value:(COUNTRIES.reduce((s,c)=>s+c.totalEsg,0)/60).toFixed(1),unit:'/100',delta:'+1.2',good:true},
      {label:'AAA/AA Rated',value:COUNTRIES.filter(c=>c.esgRating==='AAA'||c.esgRating==='AA').length,unit:'ctys',delta:'+2',good:true},
      {label:'Deteriorating',value:COUNTRIES.filter(c=>c.trend==='deteriorating').length,unit:'ctys',delta:'+3',good:false},
      {label:'Avg E-Score',value:(COUNTRIES.reduce((s,c)=>s+c.eScore,0)/60).toFixed(1),unit:'/100',delta:'+0.8',good:true},
      {label:'Avg S-Score',value:(COUNTRIES.reduce((s,c)=>s+c.sScore,0)/60).toFixed(1),unit:'/100',delta:'+1.4',good:true},
      {label:'Avg G-Score',value:(COUNTRIES.reduce((s,c)=>s+c.gScore,0)/60).toFixed(1),unit:'/100',delta:'-0.3',good:false},
      {label:'Avg Renewables',value:(COUNTRIES.reduce((s,c)=>s+c.renewableSharePct,0)/60).toFixed(1),unit:'%',delta:'+2.1',good:true},
    ];
    return (<>
      <div style={S.grid(4)}>
        {kpis.map((k,i)=>(<div key={i} style={S.kpi}>
          <div style={S.kpiLabel}>{k.label}</div>
          <div style={S.kpiVal}>{k.value}<span style={{fontSize:12,color:T.textMut,marginLeft:4}}>{k.unit}</span></div>
          <div style={S.kpiDelta(parseFloat(k.delta),k.good)}>{k.delta}</div>
        </div>))}
      </div>

      <div style={{...S.row,marginTop:14}}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Regional ESG Breakdown</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byRegion} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
              <YAxis domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="avgE" name="E-Score" fill={T.emerald} radius={[3,3,0,0]}/>
              <Bar dataKey="avgS" name="S-Score" fill={T.navyL} radius={[3,3,0,0]}/>
              <Bar dataKey="avgG" name="G-Score" fill={T.gold} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,width:280}}>
          <div style={S.cardTitle}>Rating Distribution</div>
          {ratingDist.map(r=>(<div key={r.name} style={{marginBottom:10}}>
            <div style={{...S.flex,justifyContent:'space-between',marginBottom:2}}>
              <span style={{...S.pill(ratingColor(r.name)),fontSize:11}}>{r.name}</span>
              <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy}}>{r.count}</span>
            </div>
            {S.bar(r.count/60*100,ratingColor(r.name))}
          </div>))}
        </div>
      </div>

      <div style={S.card}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>Country Overview Table</span>
          <div style={S.flex}>
            <input style={{...S.input,width:180}} placeholder="Search country..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
            <select style={S.select} value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
              <option value="All">All Regions</option>
              {REGIONS.map(r=>(<option key={r} value={r}>{r}</option>))}
            </select>
            <select style={S.select} value={ratingFilter} onChange={e=>setRatingFilter(e.target.value)}>
              <option value="All">All Ratings</option>
              {RATING_TIERS.map(r=>(<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                {[['name','Country'],['iso2','ISO'],['region','Region'],['esgRating','Rating'],['totalEsg','ESG'],['eScore','E'],['sScore','S'],['gScore','G'],['trend','Trend'],['renewableSharePct','RE%'],['co2PerCapita','CO₂/cap']].map(([col,label])=>(
                  <th key={col} style={S.th} onClick={()=>handleSort(col)}>{label}{sortCol===col?(sortAsc?' ▲':' ▼'):''}</th>
                ))}
                <th style={S.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,30).map(c=>(<tr key={c.id} style={{background:selCountry?.id===c.id?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelCountry(c)}>
                <td style={{...S.td,fontWeight:600}}>{c.name}</td>
                <td style={{...S.td,fontFamily:T.mono,fontSize:11}}>{c.iso2}</td>
                <td style={S.td}><span style={{fontSize:10,color:T.textSec}}>{c.region}</span></td>
                <td style={S.td}><span style={{...S.pill(ratingColor(c.esgRating)),fontSize:10}}>{c.esgRating}</span></td>
                <td style={{...S.td,fontFamily:T.mono,fontWeight:700,color:T.navy}}>{c.totalEsg}</td>
                <td style={{...S.td,fontFamily:T.mono,color:T.emerald}}>{c.eScore}</td>
                <td style={{...S.td,fontFamily:T.mono,color:T.navyL}}>{c.sScore}</td>
                <td style={{...S.td,fontFamily:T.mono,color:T.amber}}>{c.gScore}</td>
                <td style={S.td}><span style={{color:trendColor(c.trend),fontWeight:700,fontSize:12}}>{trendIcon(c.trend)}</span></td>
                <td style={{...S.td,fontFamily:T.mono}}>{c.renewableSharePct}%</td>
                <td style={{...S.td,fontFamily:T.mono}}>{c.co2PerCapita}t</td>
                <td style={S.td}><button style={{...S.btn(false),fontSize:10,padding:'3px 8px'}} onClick={e=>{e.stopPropagation();setSelCountry(c);setTab(1);}}>Detail</button></td>
              </tr>))}
            </tbody>
          </table>
        </div>
        <div style={{fontSize:11,color:T.textMut,marginTop:8}}>Showing {Math.min(filtered.length,30)} of {filtered.length} countries</div>
      </div>
    </>);
  };

  /* ── Tab 1: E-Score ──────────────────────────────────────────────────────── */
  const renderEScore=()=>{
    const eTop=([...COUNTRIES].sort((a,b)=>b.eScore-a.eScore).slice(0,15)).map(c=>({name:c.name.length>10?c.name.slice(0,10)+'..':c.name,e:c.eScore,re:c.renewableSharePct,co2:c.co2PerCapita}));
    const co2Scatter=COUNTRIES.map(c=>({x:c.co2PerCapita,y:c.eScore,name:c.name,rating:c.esgRating}));
    const renews=REGIONS.map(r=>{const rc=COUNTRIES.filter(c=>c.region===r);return {name:r.length>12?r.slice(0,12)+'..':r,renewable:+(rc.reduce((s,c)=>s+c.renewableSharePct,0)/rc.length).toFixed(1),co2:+(rc.reduce((s,c)=>s+c.co2PerCapita,0)/rc.length).toFixed(2)};});
    return (<>
      <div style={S.row}>
        <div style={{...S.card,flex:2}}>
          <div style={S.cardTitle}>Top 15 E-Score Countries</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={eTop} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={80}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Bar dataKey="e" name="E-Score" fill={T.emerald} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Renewable Energy Share by Region</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={renews}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Bar dataKey="renewable" name="Renewable %" fill={T.sage} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>CO₂ per Capita vs E-Score (scatter by rating)</div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="x" name="CO₂/cap" unit="t" tick={{fontSize:10,fill:T.textSec}} label={{value:'CO₂ per Capita (t)',position:'insideBottom',offset:-5,fontSize:11}}/>
            <YAxis dataKey="y" name="E-Score" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}} label={{value:'E-Score',angle:-90,position:'insideLeft',fontSize:11}}/>
            <Tooltip cursor={{strokeDasharray:'3 3'}} contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}} formatter={(v,n)=>[v,n]}/>
            {RATING_TIERS.map(r=>(<Scatter key={r} name={r} data={co2Scatter.filter(d=>d.rating===r)} fill={ratingColor(r)}/>))}
            <Legend wrapperStyle={{fontSize:11}}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </>);
  };

  /* ── Tab 2: S-Score ──────────────────────────────────────────────────────── */
  const renderSScore=()=>{
    const sTop=([...COUNTRIES].sort((a,b)=>b.sScore-a.sScore).slice(0,15)).map(c=>({name:c.name.length>10?c.name.slice(0,10)+'..':c.name,s:c.sScore,health:c.healthcareIndex,edu:c.educationIndex}));
    const giniData=REGIONS.map(r=>{const rc=COUNTRIES.filter(c=>c.region===r);return {name:r.length>12?r.slice(0,12)+'..':r,gini:+(rc.reduce((s,c)=>s+c.giniCoefficient,0)/rc.length).toFixed(3),press:+(rc.reduce((s,c)=>s+c.pressureFreedomIndex,0)/rc.length).toFixed(1),health:+(rc.reduce((s,c)=>s+c.healthcareIndex,0)/rc.length).toFixed(1)};});
    return (<>
      <div style={S.row}>
        <div style={{...S.card,flex:2}}>
          <div style={S.cardTitle}>Top 15 S-Score Countries</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sTop}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
              <YAxis domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="s" name="S-Score" fill={T.navyL} radius={[4,4,0,0]}/>
              <Bar dataKey="health" name="Healthcare" fill={T.sage} radius={[4,4,0,0]}/>
              <Bar dataKey="edu" name="Education" fill={T.gold} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Regional Social Metrics</div>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Region</th>
              <th style={S.th}>Gini</th>
              <th style={S.th}>Press</th>
              <th style={S.th}>Health</th>
            </tr></thead>
            <tbody>
              {giniData.map(r=>(<tr key={r.name}>
                <td style={S.td}>{r.name}</td>
                <td style={{...S.td,fontFamily:T.mono,color:r.gini>0.45?T.red:r.gini>0.35?T.amber:T.green}}>{r.gini}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{r.press}</td>
                <td style={{...S.td,fontFamily:T.mono,color:r.health>60?T.green:r.health>40?T.amber:T.red}}>{r.health}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Press Freedom vs Social Score (scatter)</div>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="x" name="Press Freedom" tick={{fontSize:10,fill:T.textSec}} label={{value:'Press Freedom Index',position:'insideBottom',offset:-5,fontSize:11}}/>
            <YAxis dataKey="y" name="S-Score" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
            <Scatter name="Countries" data={COUNTRIES.map(c=>({x:c.pressureFreedomIndex,y:c.sScore,name:c.name}))} fill={T.navyL} opacity={0.75}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </>);
  };

  /* ── Tab 3: G-Score ──────────────────────────────────────────────────────── */
  const renderGScore=()=>{
    const gTop=([...COUNTRIES].sort((a,b)=>b.gScore-a.gScore).slice(0,15)).map(c=>({name:c.name.length>10?c.name.slice(0,10)+'..':c.name,g:c.gScore,corrupt:c.corruptionIndex}));
    const corruptScatter=COUNTRIES.map(c=>({x:c.corruptionIndex,y:c.gScore,name:c.name,rating:c.esgRating}));
    return (<>
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Top 15 Governance Scores</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={gTop} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={80}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="g" name="G-Score" fill={T.gold} radius={[0,4,4,0]}/>
              <Bar dataKey="corrupt" name="Anti-Corruption" fill={T.amber} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Corruption Index vs G-Score</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="x" name="Corruption Index" tick={{fontSize:10,fill:T.textSec}} label={{value:'Corruption Index',position:'insideBottom',offset:-5,fontSize:11}}/>
              <YAxis dataKey="y" name="G-Score" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              {RATING_TIERS.map(r=>(<Scatter key={r} name={r} data={corruptScatter.filter(d=>d.rating===r)} fill={ratingColor(r)} opacity={0.8}/>))}
              <Legend wrapperStyle={{fontSize:11}}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>);
  };

  /* ── Tab 4: Trend Analysis ───────────────────────────────────────────────── */
  const renderTrends=()=>{
    const topTrendCountries=COUNTRIES.slice(0,10);
    const areaData=QUARTERS.map((q,qi)=>({q,...topTrendCountries.reduce((a,c)=>({...a,[c.name.slice(0,6)]:c.quarterlyTrend[qi].esg}),{})}));
    const improving=COUNTRIES.filter(c=>c.trend==='improving').length;
    const stable=COUNTRIES.filter(c=>c.trend==='stable').length;
    const deteriorating=COUNTRIES.filter(c=>c.trend==='deteriorating').length;
    return (<>
      <div style={S.grid(3)}>
        {[{label:'Improving',val:improving,color:T.green},{label:'Stable',val:stable,color:T.amber},{label:'Deteriorating',val:deteriorating,color:T.red}].map(m=>(<div key={m.label} style={{...S.kpi,borderLeft:`4px solid ${m.color}`}}>
          <div style={S.kpiLabel}>{m.label}</div>
          <div style={{...S.kpiVal,color:m.color}}>{m.val}</div>
          <div style={{fontSize:11,color:T.textMut}}>{(m.val/60*100).toFixed(0)}% of universe</div>
        </div>))}
      </div>
      <div style={{...S.card,marginTop:14}}>
        <div style={S.cardTitle}>12-Quarter ESG Trend — Top 10 Countries</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={areaData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="q" tick={{fontSize:9,fill:T.textSec}} interval={1}/>
            <YAxis domain={[40,100]} tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            {topTrendCountries.map((c,i)=>(<Line key={c.name} type="monotone" dataKey={c.name.slice(0,6)} stroke={CHART_COLORS[i%10]} dot={false} strokeWidth={2}/>))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{...S.card,marginTop:0}}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>Country Trend Details</span>
        </div>
        <table style={S.table}>
          <thead><tr>
            {[['name','Country'],['esgRating','Rating'],['totalEsg','Current ESG'],['trend','Trend'],['eScore','E'],['sScore','S'],['gScore','G']].map(([c,l])=>(<th key={c} style={S.th}>{l}</th>))}
          </tr></thead>
          <tbody>
            {COUNTRIES.filter(c=>c.trend==='deteriorating').slice(0,10).map(c=>(<tr key={c.id}>
              <td style={{...S.td,fontWeight:600}}>{c.name}</td>
              <td style={S.td}><span style={S.pill(ratingColor(c.esgRating))}>{c.esgRating}</span></td>
              <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{c.totalEsg}</td>
              <td style={S.td}><span style={{color:T.red,fontWeight:700}}>▼ Deteriorating</span></td>
              <td style={{...S.td,fontFamily:T.mono,color:T.emerald}}>{c.eScore}</td>
              <td style={{...S.td,fontFamily:T.mono,color:T.navyL}}>{c.sScore}</td>
              <td style={{...S.td,fontFamily:T.mono,color:T.amber}}>{c.gScore}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </>);
  };

  /* ── Tab 5: Provider Comparison ─────────────────────────────────────────── */
  const renderProviders=()=>{
    const barData=PROVIDER_DATA.slice(0,10).map(p=>({name:p.name,...PROVIDERS.reduce((a,pr,pi)=>({...a,[pr]:p.scores[pi]}),{})}));
    const divData=[...PROVIDER_DATA].sort((a,b)=>b.divergence-a.divergence).slice(0,10).map(p=>({name:p.name,divergence:p.divergence}));
    return (<>
      <div style={S.card}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>Provider Score Comparison — Top 20 Countries</span>
          <select style={S.select} value={selProvider} onChange={e=>setSelProvider(e.target.value)}>
            <option value="All">All Providers</option>
            {PROVIDERS.map(p=>(<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Country</th>
              {PROVIDERS.map(p=>(<th key={p} style={S.th}>{p}</th>))}
              <th style={S.th}>Divergence</th>
            </tr></thead>
            <tbody>
              {providerDivergence.map((row,i)=>(<tr key={i}>
                <td style={{...S.td,fontWeight:600}}>{row.name.replace('..','')}</td>
                {PROVIDERS.map(p=>(<td key={p} style={{...S.td,fontFamily:T.mono,color:row[p]>70?T.green:row[p]>50?T.amber:T.red,fontWeight:600}}>{row[p]}</td>))}
                <td style={{...S.td,fontFamily:T.mono,fontWeight:700,color:row.divergence>12?T.red:row.divergence>7?T.amber:T.green}}>{row.divergence}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Provider Score Spread — First 10 Countries</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
              <YAxis domain={[20,100]} tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              {PROVIDERS.map((p,i)=>(<Bar key={p} dataKey={p} fill={CHART_COLORS[i]} radius={[2,2,0,0]}/>))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,width:320}}>
          <div style={S.cardTitle}>Highest Divergence Countries</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={divData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:T.textSec}} width={80}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Bar dataKey="divergence" name="Max Divergence" fill={T.red} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>);
  };

  /* ── Tab 6: Portfolio Exposure ───────────────────────────────────────────── */
  const renderPortfolio=()=>{
    const portByRating=RATING_TIERS.map(r=>{
      const holdings=PORTFOLIO.filter(h=>h.esgRating===r);
      return {name:r,count:holdings.length,exposure:+(holdings.reduce((s,h)=>s+h.exposureM,0)).toFixed(1),weight:+(holdings.reduce((s,h)=>s+h.weightPct,0)).toFixed(2)};
    });
    const totalExposure=PORTFOLIO.reduce((s,h)=>s+h.exposureM,0);
    return (<>
      <div style={S.grid(4)}>
        {[{label:'Total Holdings',val:30,unit:'countries'},{label:'Total Exposure',val:`$${(totalExposure/1000).toFixed(1)}B`},{label:'Avg ESG Score',val:(PORTFOLIO.reduce((s,h)=>s+h.totalEsg,0)/30).toFixed(1)},{label:'AAA/AA Weight',val:`${(portByRating.filter(r=>r.name==='AAA'||r.name==='AA').reduce((s,r)=>s+r.weight,0)).toFixed(1)}%`}].map((k,i)=>(<div key={i} style={S.kpi}>
          <div style={S.kpiLabel}>{k.label}</div>
          <div style={S.kpiVal}>{k.val}</div>
        </div>))}
      </div>
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Exposure by Rating Tier ($M)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={portByRating}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Bar dataKey="exposure" name="Exposure ($M)">
                {portByRating.map((r,i)=>(<Cell key={i} fill={ratingColor(r.name)}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Active Weight Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[...PORTFOLIO].sort((a,b)=>Math.abs(b.activeWeight)-Math.abs(a.activeWeight)).slice(0,12).map(h=>({name:h.iso2,active:h.activeWeight}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:6}}/>
              <Bar dataKey="active" name="Active Weight %">
                {[...PORTFOLIO].sort((a,b)=>Math.abs(b.activeWeight)-Math.abs(a.activeWeight)).slice(0,12).map((h,i)=>(<Cell key={i} fill={h.activeWeight>=0?T.green:T.red}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>Portfolio Holdings</span>
        </div>
        <table style={S.table}>
          <thead><tr>
            {[['country','Country'],['iso2','ISO'],['esgRating','Rating'],['totalEsg','ESG Score'],['exposureM','Exposure $M'],['weightPct','Weight %'],['benchmarkWeight','Benchmark %'],['activeWeight','Active Wt'],['trend','Trend']].map(([c,l])=>(<th key={c} style={S.th} onClick={()=>handlePortSort(c)}>{l}{portfolioSort===c?(portfolioSortAsc?' ▲':' ▼'):''}</th>))}
          </tr></thead>
          <tbody>
            {portfolioFiltered.map(h=>(<tr key={h.id}>
              <td style={{...S.td,fontWeight:600}}>{h.country}</td>
              <td style={{...S.td,fontFamily:T.mono,fontSize:11}}>{h.iso2}</td>
              <td style={S.td}><span style={S.pill(ratingColor(h.esgRating))}>{h.esgRating}</span></td>
              <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{h.totalEsg}</td>
              <td style={{...S.td,fontFamily:T.mono}}>${h.exposureM}M</td>
              <td style={{...S.td,fontFamily:T.mono}}>{h.weightPct}%</td>
              <td style={{...S.td,fontFamily:T.mono}}>{h.benchmarkWeight}%</td>
              <td style={{...S.td,fontFamily:T.mono,color:h.activeWeight>=0?T.green:T.red,fontWeight:700}}>{h.activeWeight>=0?'+':''}{h.activeWeight}%</td>
              <td style={S.td}><span style={{color:trendColor(h.trend),fontWeight:700}}>{trendIcon(h.trend)}</span></td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </>);
  };

  /* ── Country Detail Panel (sidebar) ─────────────────────────────────────── */
  const renderCountryPanel=()=>{
    if(!selCountry) return null;
    return (<div style={{...S.card,borderLeft:`4px solid ${ratingColor(selCountry.esgRating)}`,marginBottom:0}}>
      <div style={{...S.flex,justifyContent:'space-between',marginBottom:10}}>
        <div>
          <span style={{fontSize:16,fontWeight:700,color:T.navy}}>{selCountry.name}</span>
          <span style={{fontFamily:T.mono,fontSize:11,color:T.textSec,marginLeft:8}}>{selCountry.iso2}</span>
          <span style={{...S.pill(ratingColor(selCountry.esgRating)),marginLeft:8}}>{selCountry.esgRating}</span>
        </div>
        <span style={{color:trendColor(selCountry.trend),fontWeight:700,fontSize:14}}>{trendIcon(selCountry.trend)} {selCountry.trend}</span>
      </div>
      <div style={S.grid(4)}>
        {[['ESG',selCountry.totalEsg,'',T.navy],['E-Score',selCountry.eScore,'',T.emerald],['S-Score',selCountry.sScore,'',T.navyL],['G-Score',selCountry.gScore,'',T.gold],['CO₂/cap',selCountry.co2PerCapita,'t',''],['Renew',selCountry.renewableSharePct,'%',T.sage],['Healthcare',selCountry.healthcareIndex,'',T.teal],['Education',selCountry.educationIndex,'',T.navyL]].map(([l,v,u,c])=>(<div key={l} style={{textAlign:'center',padding:8}}>
          <div style={{fontSize:10,color:T.textMut}}>{l}</div>
          <div style={{fontFamily:T.mono,fontWeight:700,color:c||T.navy,fontSize:16}}>{v}<span style={{fontSize:10,color:T.textMut}}>{u}</span></div>
        </div>))}
      </div>
      <div style={{marginTop:12}}>
        <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:6}}>Radar Profile</div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="subject" tick={{fontSize:10,fill:T.textSec}}/>
            <PolarRadiusAxis domain={[0,100]} tick={{fontSize:8,fill:T.textMut}}/>
            <Radar name={selCountry.name} dataKey="value" stroke={ratingColor(selCountry.esgRating)} fill={ratingColor(selCountry.esgRating)} fillOpacity={0.25}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>);
  };

  const tabContent=[renderOverview,renderEScore,renderSScore,renderGScore,renderTrends,renderProviders,renderPortfolio];

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={{...S.flex,gap:12}}>
            <span style={S.badge}>EP-AX1</span>
            <h1 style={S.title}>Sovereign ESG Scorer</h1>
          </div>
          <div style={S.subtitle}>60-country sovereign ESG rating universe · E/S/G decomposition · 6-provider comparison · Bloomberg terminal</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:T.mono,fontSize:11,color:'rgba(255,255,255,0.5)'}}>Last updated: 2026-04-01 09:00 UTC</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2}}>SPRINT AX · SOVEREIGN INTELLIGENCE</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {TABS.map((t,i)=>(<button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}
      </div>

      {/* Layout */}
      <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
        <div style={{flex:1,minWidth:0}}>
          {tabContent[tab]()}
        </div>
        {tab!==6&&(<div style={{width:340,flexShrink:0}}>
          <div style={{...S.card,borderBottom:`3px solid ${T.gold}`,marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>GDP vs ESG (Bubble = Population)</div>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="x" name="GDP $T" tick={{fontSize:8,fill:T.textSec}} label={{value:'GDP ($T)',position:'insideBottom',offset:-4,fontSize:9}}/>
                <YAxis dataKey="y" name="ESG" domain={[0,100]} tick={{fontSize:8,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontSize:10,fontFamily:T.font,borderRadius:6}} content={({payload})=>{
                  if(!payload?.length) return null;
                  const d=payload[0]?.payload;
                  return (<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'6px 10px',fontSize:10}}>
                    <div style={{fontWeight:700}}>{d?.name}</div>
                    <div>GDP: ${d?.x}T | ESG: {d?.y}</div>
                    <div>Pop: {d?.z}M</div>
                  </div>);
                }}/>
                {RATING_TIERS.map(r=>(<Scatter key={r} name={r} data={scatterData.filter(d=>d.rating===r)} fill={ratingColor(r)} opacity={0.8}/>))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {renderCountryPanel()}
        </div>)}
      </div>
    </div>
  );
}
