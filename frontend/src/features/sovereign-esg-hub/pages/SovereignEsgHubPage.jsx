import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS=['Executive Dashboard','Country Comparison','Sovereign Bond Portfolio','Board Report'];
const PERIODS=['Q1 2026','Q2 2026','H1 2026','FY 2025','Trailing 12M'];
const REGIONS=['Europe','Asia-Pacific','Americas','Middle East & Africa','Frontier'];
const INCOME_GROUPS=['High Income','Upper Middle','Lower Middle','Low Income'];
const AUDIENCES=['Board','IC','Sovereign Desk','Regulator'];
const BOARD_SECTIONS=['Executive Summary','Sovereign Climate Risk Overview','Debt Sustainability Analysis','Central Bank Policy Landscape','Nature Risk & Biodiversity Exposure','Social Performance & SDG Alignment','Bond Portfolio Climate Metrics','Recommendations & Outlook'];
const SEVERITY=['Critical','High','Medium','Low'];
const SUB_MODULES=['Climate Risk','Debt Sustainability','Central Bank Policy','Nature Risk','Social Index'];
const RATING_AGENCIES=['S&P','Moody\'s','Fitch'];
const BOND_TYPES=['Green Sovereign','Sustainability-Linked','Conventional','Climate Transition'];
const NGFS_SCENARIOS=['Orderly Transition','Disorderly','Hot House World','Net Zero 2050','Delayed Transition','NDC Current Policies'];
const CB_TOOLS=['Climate Stress Test','Green Bond Framework','Taxonomy Alignment','Disclosure Mandate','Prudential Capital Adj','Collateral Haircuts','Climate Data Portal','Scenario Analysis'];
const SDG_GOALS=['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Clean Energy','Decent Work','Industry Innovation','Reduced Inequalities','Sustainable Cities','Responsible Consumption','Climate Action','Life Below Water','Life On Land','Peace & Justice','Partnerships'];

const COUNTRY_NAMES=[
  'United States','China','Japan','Germany','United Kingdom','France','India','Italy','Canada','South Korea',
  'Australia','Brazil','Spain','Mexico','Indonesia','Netherlands','Saudi Arabia','Turkey','Switzerland','Taiwan',
  'Poland','Sweden','Belgium','Norway','Austria','Ireland','Israel','Argentina','Thailand','Denmark',
  'Singapore','Malaysia','South Africa','Philippines','Colombia','Egypt','Chile','Finland','Czech Republic','Portugal',
  'Romania','New Zealand','Greece','Peru','Vietnam','Bangladesh','Pakistan','Nigeria','Kenya','Morocco',
  'Hungary','Ukraine','Qatar','UAE','Kuwait','Ghana','Tanzania','Ethiopia','Sri Lanka','Costa Rica',
  'Panama','Uruguay','Kazakhstan','Ivory Coast','Senegal','Rwanda','Jordan','Oman','Bahrain','Luxembourg',
  'Iceland','Croatia','Slovenia','Lithuania','Latvia','Estonia','Slovakia','Bulgaria','Serbia','Tunisia'
];

const ISO_CODES=[
  'US','CN','JP','DE','GB','FR','IN','IT','CA','KR','AU','BR','ES','MX','ID','NL','SA','TR','CH','TW',
  'PL','SE','BE','NO','AT','IE','IL','AR','TH','DK','SG','MY','ZA','PH','CO','EG','CL','FI','CZ','PT',
  'RO','NZ','GR','PE','VN','BD','PK','NG','KE','MA','HU','UA','QA','AE','KW','GH','TZ','ET','LK','CR',
  'PA','UY','KZ','CI','SN','RW','JO','OM','BH','LU','IS','HR','SI','LT','LV','EE','SK','BG','RS','TN'
];

// ── Generate 80 countries with deep data ──────────────────────────────────────
const COUNTRIES = Array.from({length:80},(_,i)=>{
  const name=COUNTRY_NAMES[i];
  const iso=ISO_CODES[i];
  const regionFixed=name==='United States'||name==='Canada'||name==='Brazil'||name==='Mexico'||name==='Argentina'||name==='Colombia'||name==='Chile'||name==='Peru'||name==='Costa Rica'||name==='Panama'||name==='Uruguay'?'Americas':
    name==='China'||name==='Japan'||name==='India'||name==='South Korea'||name==='Australia'||name==='Taiwan'||name==='Thailand'||name==='Singapore'||name==='Malaysia'||name==='Philippines'||name==='Indonesia'||name==='Vietnam'||name==='Bangladesh'||name==='Pakistan'||name==='New Zealand'||name==='Sri Lanka'||name==='Kazakhstan'?'Asia-Pacific':
    name==='Saudi Arabia'||name==='Turkey'||name==='Egypt'||name==='Nigeria'||name==='Kenya'||name==='Morocco'||name==='South Africa'||name==='Qatar'||name==='UAE'||name==='Kuwait'||name==='Ghana'||name==='Tanzania'||name==='Ethiopia'||name==='Ivory Coast'||name==='Senegal'||name==='Rwanda'||name==='Jordan'||name==='Oman'||name==='Bahrain'||name==='Tunisia'?'Middle East & Africa':'Europe';
  const incomeFixed=name==='India'||name==='Bangladesh'||name==='Pakistan'||name==='Nigeria'||name==='Kenya'||name==='Ghana'||name==='Tanzania'||name==='Ethiopia'||name==='Ivory Coast'||name==='Senegal'||name==='Rwanda'?'Lower Middle':
    name==='Brazil'||name==='Mexico'||name==='Turkey'||name==='Thailand'||name==='South Africa'||name==='Colombia'||name==='Egypt'||name==='Peru'||name==='Vietnam'||name==='Philippines'||name==='Argentina'||name==='Romania'||name==='Bulgaria'||name==='Serbia'?'Upper Middle':
    name==='United States'||name==='Japan'||name==='Germany'||name==='United Kingdom'||name==='France'||name==='Italy'||name==='Canada'||name==='Australia'||name==='South Korea'||name==='Netherlands'||name==='Switzerland'||name==='Singapore'||name==='Norway'||name==='Denmark'||name==='Sweden'||name==='Finland'||name==='Ireland'||name==='Luxembourg'||name==='Iceland'||name==='New Zealand'||name==='Qatar'||name==='UAE'||name==='Kuwait'||name==='Bahrain'?'High Income':'Lower Middle';
  const climateRisk=+(sr(i*7)*60+20).toFixed(1);
  const debtSustainability=+(sr(i*11)*50+30).toFixed(1);
  const cbMaturity=+(sr(i*13)*70+15).toFixed(1);
  const natureDependencyGDP=+(sr(i*17)*25+2).toFixed(1);
  const socialIndex=+(sr(i*19)*55+30).toFixed(1);
  const greenBondPct=+(sr(i*23)*18+0.5).toFixed(1);
  const ngfsCoverage=sr(i*29)>0.35;
  const physicalRisk=+(sr(i*31)*70+10).toFixed(1);
  const transitionRisk=+(sr(i*37)*65+15).toFixed(1);
  const sdgProgress=+(sr(i*41)*50+25).toFixed(1);
  const gbfCompliance=+(sr(i*43)*80+10).toFixed(1);
  const climateAdjYield=+(sr(i*47)*4+0.5).toFixed(2);
  const conventionalYield=+(+climateAdjYield*(1+sr(i*53)*0.3)).toFixed(2);
  const creditRating=RATING_AGENCIES[Math.floor(sr(i*59)*3)];
  const ratingGrade=['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B'][Math.floor(sr(i*61)*15)];
  const gdpBn=+(sr(i*67)*3000+10).toFixed(0);
  const debtToGDP=+(sr(i*71)*120+20).toFixed(1);
  const spreadBps=Math.floor(sr(i*73)*500+20);
  const natureAdjSpread=Math.floor(spreadBps*(1+sr(i*79)*0.25));
  const socialPremium=+(sr(i*83)*1.5-0.5).toFixed(2);
  const carbonIntensity=+(sr(i*89)*800+50).toFixed(0);
  const ndcTarget=Math.floor(sr(i*97)*50+20);
  const ndcProgress=Math.floor(ndcTarget*sr(i*101));
  const waterStress=+(sr(i*103)*80+5).toFixed(1);
  const biodiversityRisk=+(sr(i*107)*70+10).toFixed(1);
  const forestCoverPct=+(sr(i*109)*60+5).toFixed(1);
  const giniCoeff=+(sr(i*113)*0.4+0.2).toFixed(2);
  const hdi=+(sr(i*127)*0.4+0.5).toFixed(3);
  const compositeScore=+(climateRisk*0.25+debtSustainability*0.2+cbMaturity*0.15+socialIndex*0.2+(100-natureDependencyGDP*3)*0.1+sdgProgress*0.1).toFixed(1);
  // Extended data fields
  const cbTools=CB_TOOLS.filter((_,ci)=>sr(i*131+ci*7)>0.55);
  const ngfsScenario=NGFS_SCENARIOS[Math.floor(sr(i*137)*6)];
  const fiscalSpace=+(sr(i*139)*40+10).toFixed(1);
  const fossilFuelRevPct=+(sr(i*141)*35+1).toFixed(1);
  const renewableCapPct=+(sr(i*143)*50+2).toFixed(1);
  const climateFinancePledge=+(sr(i*149)*5+0.1).toFixed(1);
  const adaptationSpend=+(sr(i*151)*3+0.05).toFixed(2);
  const sovereignCDS=Math.floor(sr(i*153)*400+15);
  const fxReserveMonths=+(sr(i*157)*12+1).toFixed(1);
  const youthUnemplPct=+(sr(i*159)*30+3).toFixed(1);
  const genderGapIdx=+(sr(i*161)*0.3+0.5).toFixed(3);
  const sdgScores=Array.from({length:17},(_,si)=>+(sr(i*163+si*7)*60+20).toFixed(1));
  const quarterlyTrend=Array.from({length:4},(_,qi)=>({q:['Q2 25','Q3 25','Q4 25','Q1 26'][qi],climate:+(climateRisk+sr(i*167+qi*11)*8-4).toFixed(1),debt:+(debtSustainability+sr(i*173+qi*13)*6-3).toFixed(1),social:+(socialIndex+sr(i*179+qi*17)*5-2.5).toFixed(1)}));
  return {id:i,name,iso,region:regionFixed,income:incomeFixed,climateRisk,debtSustainability,cbMaturity,natureDependencyGDP,socialIndex,greenBondPct,ngfsCoverage,physicalRisk,transitionRisk,sdgProgress,gbfCompliance,climateAdjYield:+climateAdjYield,conventionalYield:+conventionalYield,creditRating,ratingGrade,gdpBn:+gdpBn,debtToGDP,spreadBps,natureAdjSpread,socialPremium,carbonIntensity:+carbonIntensity,ndcTarget,ndcProgress,waterStress,biodiversityRisk,forestCoverPct,giniCoeff,hdi,compositeScore:+compositeScore,cbTools,ngfsScenario,fiscalSpace,fossilFuelRevPct,renewableCapPct,climateFinancePledge,adaptationSpend,sovereignCDS,fxReserveMonths,youthUnemplPct,genderGapIdx,sdgScores,quarterlyTrend};
});

// ── 20 Alerts ─────────────────────────────────────────────────────────────────
const ALERT_TYPES=['Climate Risk Surge','Debt Sustainability Warning','CB Policy Downgrade','Nature Dependency Spike','Social Unrest Signal','Green Bond Mispricing','Physical Risk Escalation','Transition Risk Acceleration','SDG Regression','GBF Non-Compliance','Sovereign Spread Blowout','Rating Downgrade Watch','NDC Off-Track','Water Stress Critical','Biodiversity Collapse Risk','Fiscal Climate Gap','Carbon Intensity Outlier','Social Premium Inversion','Forest Cover Decline','Climate Litigation Risk'];

const ALERTS = Array.from({length:20},(_,i)=>{
  const country=COUNTRIES[Math.floor(sr(i*131)*80)];
  const type=ALERT_TYPES[i];
  const severity=SEVERITY[Math.floor(sr(i*137)*4)];
  const triggered=`2026-0${Math.floor(sr(i*139)*3+1)}-${String(Math.floor(sr(i*141)*28+1)).padStart(2,'0')}`;
  const impact=+(sr(i*143)*3+0.5).toFixed(1);
  const module=SUB_MODULES[Math.floor(sr(i*149)*5)];
  const detail=`${type} detected for ${country.name}. Score moved ${impact>1.5?'significantly':'moderately'} outside ${module} tolerance band. ${severity==='Critical'?'Immediate action required.':'Monitor and review at next cycle.'}`;
  return {id:i,country:country.name,iso:country.iso,type,severity,triggered,impact,module,resolved:sr(i*151)>0.65,detail};
});

// ── 12 KPIs builder ───────────────────────────────────────────────────────────
const buildKpis=(periodIdx)=>{
  const p=periodIdx*7;
  return [
    {label:'Avg Sovereign Climate Risk',value:+(COUNTRIES.reduce((s,c)=>s+c.climateRisk,0)/80+sr(p)*3).toFixed(1),unit:'/ 100',delta:+(sr(p+1)*6-3).toFixed(1),good:false},
    {label:'Debt Sustainability Score',value:+(COUNTRIES.reduce((s,c)=>s+c.debtSustainability,0)/80+sr(p+2)*2).toFixed(1),unit:'/ 100',delta:+(sr(p+3)*4-1).toFixed(1),good:true},
    {label:'Central Bank Climate Maturity',value:+(COUNTRIES.reduce((s,c)=>s+c.cbMaturity,0)/80+sr(p+4)*3).toFixed(1),unit:'/ 100',delta:+(sr(p+5)*5-1).toFixed(1),good:true},
    {label:'Nature Dependency GDP %',value:+(COUNTRIES.reduce((s,c)=>s+c.natureDependencyGDP,0)/80+sr(p+6)*1.5).toFixed(1),unit:'%',delta:+(sr(p+7)*2-1.2).toFixed(1),good:false},
    {label:'Social Performance Index',value:+(COUNTRIES.reduce((s,c)=>s+c.socialIndex,0)/80+sr(p+8)*2).toFixed(1),unit:'/ 100',delta:+(sr(p+9)*3-0.5).toFixed(1),good:true},
    {label:'Green Sovereign Bond %',value:+(COUNTRIES.reduce((s,c)=>s+c.greenBondPct,0)/80+sr(p+10)*1).toFixed(1),unit:'%',delta:+(sr(p+11)*2-0.3).toFixed(1),good:true},
    {label:'NGFS Coverage',value:COUNTRIES.filter(c=>c.ngfsCoverage).length+Math.floor(sr(p+12)*5),unit:'/ 80',delta:Math.floor(sr(p+13)*4),good:true},
    {label:'Physical Risk Exposure',value:+(COUNTRIES.reduce((s,c)=>s+c.physicalRisk,0)/80+sr(p+14)*3).toFixed(1),unit:'/ 100',delta:+(sr(p+15)*4-1).toFixed(1),good:false},
    {label:'Transition Risk Exposure',value:+(COUNTRIES.reduce((s,c)=>s+c.transitionRisk,0)/80+sr(p+16)*2).toFixed(1),unit:'/ 100',delta:+(sr(p+17)*3-0.8).toFixed(1),good:false},
    {label:'SDG Progress',value:+(COUNTRIES.reduce((s,c)=>s+c.sdgProgress,0)/80+sr(p+18)*2).toFixed(1),unit:'/ 100',delta:+(sr(p+19)*3-0.5).toFixed(1),good:true},
    {label:'GBF Compliance',value:+(COUNTRIES.reduce((s,c)=>s+c.gbfCompliance,0)/80+sr(p+20)*4).toFixed(1),unit:'/ 100',delta:+(sr(p+21)*5-1).toFixed(1),good:true},
    {label:'Portfolio Climate-Adj Yield',value:+(COUNTRIES.reduce((s,c)=>s+c.climateAdjYield,0)/80+sr(p+22)*0.2).toFixed(2),unit:'%',delta:+(sr(p+23)*0.4-0.15).toFixed(2),good:true},
  ];
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},
  header:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20},
  title:{fontSize:22,fontWeight:700,color:T.navy,margin:0,letterSpacing:'-0.01em'},
  subtitle:{fontSize:13,color:T.textSec,marginTop:4,fontFamily:T.mono},
  badge:{fontSize:11,fontFamily:T.mono,padding:'2px 8px',borderRadius:4,fontWeight:600},
  tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},
  tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?T.gold:T.textSec,borderBottom:a?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',background:'none',border:'none',fontFamily:T.font,marginBottom:-2,transition:'all 0.15s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:16},
  cardTitle:{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12,display:'flex',alignItems:'center',gap:8},
  grid:(cols)=>({display:'grid',gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:14}),
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:14,textAlign:'center'},
  kpiVal:{fontSize:22,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textSec,marginTop:4},
  kpiDelta:(v,good)=>({fontSize:11,fontFamily:T.mono,fontWeight:600,marginTop:4,color:good?(v>=0?T.green:T.red):(v>=0?T.red:T.green)}),
  pill:(c)=>({display:'inline-block',fontSize:10,fontFamily:T.mono,padding:'2px 7px',borderRadius:10,fontWeight:600,color:'#fff',background:c}),
  select:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,cursor:'pointer'},
  btn:(primary)=>({padding:'7px 16px',borderRadius:6,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}),
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy,fontSize:11,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.03em'},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,fontSize:12,color:T.text},
  input:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,boxSizing:'border-box'},
  slider:{width:'100%',accentColor:T.gold},
  heatCell:(val,max)=>{const pct=val/max;const bg=pct>0.7?'rgba(220,38,38,0.15)':pct>0.4?'rgba(217,119,6,0.12)':'rgba(22,163,74,0.10)';return {background:bg,padding:'4px 8px',borderRadius:4,textAlign:'center',fontSize:11,fontFamily:T.mono,fontWeight:600}},
  tag:{display:'inline-block',fontSize:10,padding:'2px 6px',borderRadius:4,marginRight:4,marginBottom:2,fontFamily:T.mono},
  row:{display:'flex',gap:14,marginBottom:14},
  flex:{display:'flex',alignItems:'center',gap:8},
  mono:{fontFamily:T.mono,fontSize:12},
  progressBar:(pct,color)=>({position:'relative',height:6,borderRadius:3,background:T.border,overflow:'hidden',marginTop:4}),
  progressFill:(pct,color)=>({position:'absolute',top:0,left:0,height:'100%',width:`${Math.min(pct,100)}%`,borderRadius:3,background:color}),
};

const sevColor=(s)=>s==='Critical'?T.red:s==='High'?T.amber:s==='Medium'?T.gold:T.green;
const CHART_COLORS=[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red,T.green,T.teal,'#8b5cf6','#ec4899'];

// ── Component ─────────────────────────────────────────────────────────────────
export default function SovereignEsgHubPage(){
  const [tab,setTab]=useState(0);
  const [period,setPeriod]=useState(0);
  const [selCountry,setSelCountry]=useState(null);
  const [regionFilter,setRegionFilter]=useState('All');
  const [incomeFilter,setIncomeFilter]=useState('All');
  const [sortCol,setSortCol]=useState('compositeScore');
  const [sortAsc,setSortAsc]=useState(false);
  const [searchQ,setSearchQ]=useState('');
  const [maxClimateRisk,setMaxClimateRisk]=useState(80);
  const [minSocialScore,setMinSocialScore]=useState(20);
  const [maxDebtGDP,setMaxDebtGDP]=useState(100);
  const [minGreenBond,setMinGreenBond]=useState(0);
  const [boardAudience,setBoardAudience]=useState('Board');
  const [boardDateFrom,setBoardDateFrom]=useState('2026-01-01');
  const [boardDateTo,setBoardDateTo]=useState('2026-03-28');
  const [boardSections,setBoardSections]=useState(BOARD_SECTIONS.reduce((a,s)=>({...a,[s]:true}),{}));
  const [expandedAlert,setExpandedAlert]=useState(null);
  const [compareList,setCompareList]=useState([]);
  const [portfolioView,setPortfolioView]=useState('table');
  const [bondTypeFilter,setBondTypeFilter]=useState('All');

  const kpis=useMemo(()=>buildKpis(period),[period]);

  const filtered=useMemo(()=>{
    let d=[...COUNTRIES];
    if(regionFilter!=='All') d=d.filter(c=>c.region===regionFilter);
    if(incomeFilter!=='All') d=d.filter(c=>c.income===incomeFilter);
    if(searchQ) d=d.filter(c=>c.name.toLowerCase().includes(searchQ.toLowerCase())||c.iso.toLowerCase().includes(searchQ.toLowerCase()));
    d.sort((a,b)=>sortAsc?(a[sortCol]-b[sortCol]):(b[sortCol]-a[sortCol]));
    return d;
  },[regionFilter,incomeFilter,searchQ,sortCol,sortAsc]);

  const portfolioFiltered=useMemo(()=>{
    return COUNTRIES.filter(c=>c.climateRisk<=maxClimateRisk&&c.socialIndex>=minSocialScore&&c.debtToGDP<=maxDebtGDP&&c.greenBondPct>=minGreenBond);
  },[maxClimateRisk,minSocialScore,maxDebtGDP,minGreenBond]);

  const regionAgg=useMemo(()=>{
    const map={};
    REGIONS.forEach(r=>{
      const rc=COUNTRIES.filter(c=>c.region===r);
      if(!rc.length) return;
      map[r]={count:rc.length,avgClimate:+(rc.reduce((s,c)=>s+c.climateRisk,0)/rc.length).toFixed(1),avgDebt:+(rc.reduce((s,c)=>s+c.debtSustainability,0)/rc.length).toFixed(1),avgCB:+(rc.reduce((s,c)=>s+c.cbMaturity,0)/rc.length).toFixed(1),avgNature:+(rc.reduce((s,c)=>s+c.natureDependencyGDP,0)/rc.length).toFixed(1),avgSocial:+(rc.reduce((s,c)=>s+c.socialIndex,0)/rc.length).toFixed(1),avgSpread:+(rc.reduce((s,c)=>s+c.spreadBps,0)/rc.length).toFixed(0),avgGreen:+(rc.reduce((s,c)=>s+c.greenBondPct,0)/rc.length).toFixed(1)};
    });
    return map;
  },[]);

  const handleSort=useCallback((col)=>{
    if(sortCol===col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  },[sortCol,sortAsc]);

  const toggleBoardSection=useCallback((s)=>setBoardSections(p=>({...p,[s]:!p[s]})),[]);

  const toggleCompare=useCallback((id)=>{
    setCompareList(p=>p.includes(id)?p.filter(x=>x!==id):p.length<5?[...p,id]:p);
  },[]);

  const handleExportCSV=useCallback(()=>{
    const headers=['Country','ISO','Region','Income','Climate Risk','Debt Sustainability','CB Maturity','Nature Dep GDP%','Social Index','Green Bond%','Physical Risk','Transition Risk','SDG Progress','GBF Compliance','Composite Score','Spread (bps)','Credit Rating','Debt/GDP','Carbon Intensity','NDC Target','NDC Progress','Water Stress','HDI','Gini'];
    const rows=filtered.map(c=>[c.name,c.iso,c.region,c.income,c.climateRisk,c.debtSustainability,c.cbMaturity,c.natureDependencyGDP,c.socialIndex,c.greenBondPct,c.physicalRisk,c.transitionRisk,c.sdgProgress,c.gbfCompliance,c.compositeScore,c.spreadBps,c.ratingGrade,c.debtToGDP,c.carbonIntensity,c.ndcTarget,c.ndcProgress,c.waterStress,c.hdi,c.giniCoeff].join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='sovereign_esg_hub_export.csv';a.click();URL.revokeObjectURL(url);
  },[filtered]);

  // ── Tab 1: Executive Dashboard ──────────────────────────────────────────────
  const renderExecutiveDashboard=()=>{
    const topRisks=[...COUNTRIES].sort((a,b)=>b.climateRisk-a.climateRisk).slice(0,8);
    const topImprovements=[...COUNTRIES].sort((a,b)=>b.compositeScore-a.compositeScore).slice(0,8);
    const regionBarData=REGIONS.map(r=>{
      const rc=COUNTRIES.filter(c=>c.region===r);
      if(!rc.length) return null;
      return {name:r.length>14?r.substring(0,14)+'..':r,climate:+(rc.reduce((s,c)=>s+c.climateRisk,0)/rc.length).toFixed(1),debt:+(rc.reduce((s,c)=>s+c.debtSustainability,0)/rc.length).toFixed(1),social:+(rc.reduce((s,c)=>s+c.socialIndex,0)/rc.length).toFixed(1),nature:+(rc.reduce((s,c)=>s+c.natureDependencyGDP,0)/rc.length).toFixed(1)};
    }).filter(Boolean);
    const incomeBreak=INCOME_GROUPS.map(g=>({name:g,count:COUNTRIES.filter(c=>c.income===g).length}));
    const trendData=Array.from({length:6},(_,i)=>({month:['Oct','Nov','Dec','Jan','Feb','Mar'][i],climateRisk:+(40+sr(i*211)*8).toFixed(1),debtSust:+(52+sr(i*223)*6).toFixed(1),social:+(48+sr(i*229)*7).toFixed(1),greenBond:+(8+sr(i*233)*3).toFixed(1)}));
    const heatmapCountries=COUNTRIES.slice(0,20);
    const cbMaturityDist=[{name:'Advanced (>70)',count:COUNTRIES.filter(c=>c.cbMaturity>70).length},{name:'Developing (40-70)',count:COUNTRIES.filter(c=>c.cbMaturity>=40&&c.cbMaturity<=70).length},{name:'Early (<40)',count:COUNTRIES.filter(c=>c.cbMaturity<40).length}];
    const ngfsAdoption=NGFS_SCENARIOS.map((s,i)=>({name:s.length>16?s.substring(0,16)+'..':s,count:COUNTRIES.filter(c=>c.ngfsScenario===s).length}));
    const fossilVsRenew=REGIONS.map(r=>{
      const rc=COUNTRIES.filter(c=>c.region===r);
      if(!rc.length) return null;
      return {name:r.length>12?r.substring(0,12)+'..':r,fossil:+(rc.reduce((s,c)=>s+c.fossilFuelRevPct,0)/rc.length).toFixed(1),renewable:+(rc.reduce((s,c)=>s+c.renewableCapPct,0)/rc.length).toFixed(1)};
    }).filter(Boolean);

    return (<>
      {/* Period Toggle */}
      <div style={{...S.flex,marginBottom:16,justifyContent:'space-between'}}>
        <div style={S.flex}>
          <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Period:</span>
          {PERIODS.map((p,i)=>(<button key={p} onClick={()=>setPeriod(i)} style={{...S.btn(period===i),fontSize:11,padding:'5px 12px'}}>{p}</button>))}
        </div>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Last updated: 2026-03-28T09:15:00Z</span>
      </div>

      {/* 12 KPIs */}
      <div style={S.grid(4)}>
        {kpis.map((k,i)=>(<div key={i} style={S.kpi}>
          <div style={S.kpiLabel}>{k.label}</div>
          <div style={S.kpiVal}>{k.value}<span style={{fontSize:12,color:T.textMut,marginLeft:4}}>{k.unit}</span></div>
          <div style={S.kpiDelta(+k.delta,k.good)}>{+k.delta>=0?'+':''}{k.delta} vs prev</div>
        </div>))}
      </div>

      {/* Sub-module summary cards */}
      <div style={{...S.grid(5),marginTop:18}}>
        {SUB_MODULES.map((m,i)=>{
          const atRisk=COUNTRIES.filter(c=>m==='Climate Risk'?c.climateRisk>60:m==='Debt Sustainability'?c.debtSustainability<40:m==='Central Bank Policy'?c.cbMaturity<35:m==='Nature Risk'?c.natureDependencyGDP>15:c.socialIndex<40);
          const avg=+(COUNTRIES.reduce((s,c)=>s+(m==='Climate Risk'?c.climateRisk:m==='Debt Sustainability'?c.debtSustainability:m==='Central Bank Policy'?c.cbMaturity:m==='Nature Risk'?c.natureDependencyGDP:c.socialIndex),0)/80).toFixed(1);
          const trend=+(sr(i*199)*4-2).toFixed(1);
          return (<div key={m} style={{...S.card,borderLeft:`3px solid ${CHART_COLORS[i]}`}}>
            <div style={{fontSize:12,fontWeight:700,color:CHART_COLORS[i],marginBottom:6}}>{m}</div>
            <div style={{fontSize:20,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{avg}</div>
            <div style={{fontSize:11,color:T.textMut,marginTop:2}}>Avg across 80 countries</div>
            <div style={{fontSize:11,color:T.red,marginTop:4,fontWeight:600}}>{atRisk.length} at risk</div>
            <div style={{fontSize:10,color:trend>=0?(m==='Climate Risk'||m==='Nature Risk'?T.red:T.green):(m==='Climate Risk'||m==='Nature Risk'?T.green:T.red),fontFamily:T.mono,marginTop:2}}>{trend>=0?'+':''}{trend} QoQ</div>
          </div>);
        })}
      </div>

      <div style={S.row}>
        {/* Regional comparison bar chart */}
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Regional Sovereign Risk Comparison</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={regionBarData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="climate" name="Climate Risk" fill={T.red} radius={[3,3,0,0]}/>
              <Bar dataKey="debt" name="Debt Sust." fill={T.navy} radius={[3,3,0,0]}/>
              <Bar dataKey="social" name="Social Index" fill={T.sage} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Income group + CB maturity */}
        <div style={{width:300,display:'flex',flexDirection:'column',gap:14}}>
          <div style={S.card}>
            <div style={S.cardTitle}>Income Group Distribution</div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={incomeBreak} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="count" nameKey="name" label={({name,count})=>`${count}`} labelLine={false} style={{fontSize:9}}>
                  {incomeBreak.map((_,i)=>(<Cell key={i} fill={CHART_COLORS[i]}/>))}
                </Pie>
                <Tooltip contentStyle={{fontSize:10}}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,justifyContent:'center'}}>
              {incomeBreak.map((g,i)=>(<span key={i} style={{fontSize:9,color:CHART_COLORS[i],fontFamily:T.mono}}>{g.name}: {g.count}</span>))}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>CB Climate Maturity</div>
            {cbMaturityDist.map((d,i)=>(<div key={i} style={{marginBottom:6}}>
              <div style={{...S.flex,justifyContent:'space-between',fontSize:11}}><span>{d.name}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{d.count}</span></div>
              <div style={S.progressBar(0)}><div style={S.progressFill(d.count/80*100,[T.green,T.gold,T.red][i])}/></div>
            </div>))}
          </div>
        </div>
      </div>

      {/* Trend chart + Fossil vs Renewable */}
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>6-Month Sovereign ESG Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Area type="monotone" dataKey="climateRisk" name="Climate Risk" stroke={T.red} fill={T.red} fillOpacity={0.08} strokeWidth={2}/>
              <Area type="monotone" dataKey="debtSust" name="Debt Sust." stroke={T.navy} fill={T.navy} fillOpacity={0.08} strokeWidth={2}/>
              <Area type="monotone" dataKey="social" name="Social" stroke={T.sage} fill={T.sage} fillOpacity={0.08} strokeWidth={2}/>
              <Area type="monotone" dataKey="greenBond" name="Green Bond %" stroke={T.gold} fill={T.gold} fillOpacity={0.08} strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,width:340}}>
          <div style={S.cardTitle}>Fossil Fuel vs Renewable by Region</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fossilVsRenew} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} unit="%"/>
              <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={90}/>
              <Tooltip contentStyle={{fontSize:11}}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="fossil" name="Fossil Rev %" fill={T.red} radius={[0,3,3,0]}/>
              <Bar dataKey="renewable" name="Renewable Cap %" fill={T.green} radius={[0,3,3,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NGFS Scenario Adoption */}
      <div style={S.card}>
        <div style={S.cardTitle}>NGFS Scenario Adoption Distribution</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={ngfsAdoption}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11}}/>
            <Bar dataKey="count" name="Countries" fill={T.navyL} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SDG Progress Breakdown by Region */}
      <div style={S.card}>
        <div style={S.cardTitle}>SDG Progress Breakdown by Region</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Region</th>
              {['Climate Action','Clean Energy','Clean Water','Decent Work','No Poverty','Gender Eq.','Health','Education'].map(g=>(<th key={g} style={{...S.th,fontSize:9}}>{g}</th>))}
              <th style={S.th}>Overall</th>
            </tr></thead>
            <tbody>
              {REGIONS.map((r,ri)=>{
                const rc=COUNTRIES.filter(c=>c.region===r);
                if(!rc.length) return null;
                const sdgAvgs=[12,6,5,7,0,4,2,3].map(si=>+(rc.reduce((s,c)=>s+c.sdgScores[si],0)/rc.length).toFixed(1));
                const overall=+(sdgAvgs.reduce((s,v)=>s+v,0)/sdgAvgs.length).toFixed(1);
                return (<tr key={r}><td style={{...S.td,fontWeight:600}}>{r}</td>
                  {sdgAvgs.map((v,vi)=>(<td key={vi} style={{...S.td,...S.heatCell(100-v,100)}}>{v}</td>))}
                  <td style={{...S.td,fontWeight:700,fontFamily:T.mono}}>{overall}</td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Climate Finance Flows */}
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Climate Finance Pledges vs Adaptation Spend</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REGIONS.map(r=>{const rc=COUNTRIES.filter(c=>c.region===r);if(!rc.length) return null;return {name:r.length>14?r.substring(0,14)+'..':r,pledge:+(rc.reduce((s,c)=>s+c.climateFinancePledge,0)/rc.length).toFixed(1),adaptation:+(rc.reduce((s,c)=>s+c.adaptationSpend,0)/rc.length).toFixed(2)};}).filter(Boolean)} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} unit="% GDP"/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="pledge" name="Climate Finance Pledge" fill={T.gold} radius={[3,3,0,0]}/>
              <Bar dataKey="adaptation" name="Adaptation Spend" fill={T.sage} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,width:340}}>
          <div style={S.cardTitle}>Renewable vs Fossil Revenue Mix</div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:8}}>Average across 80 sovereigns</div>
          {[
            {l:'Fossil Fuel Revenue',v:+(COUNTRIES.reduce((s,c)=>s+c.fossilFuelRevPct,0)/80).toFixed(1),c:T.red},
            {l:'Renewable Capacity',v:+(COUNTRIES.reduce((s,c)=>s+c.renewableCapPct,0)/80).toFixed(1),c:T.green},
            {l:'Climate Finance Pledge',v:+(COUNTRIES.reduce((s,c)=>s+c.climateFinancePledge,0)/80).toFixed(1),c:T.gold},
            {l:'Adaptation Spend',v:+(COUNTRIES.reduce((s,c)=>s+c.adaptationSpend,0)/80).toFixed(2),c:T.sage},
          ].map((m,i)=>(<div key={i} style={{marginBottom:8}}>
            <div style={{...S.flex,justifyContent:'space-between',fontSize:11}}><span>{m.l}</span><span style={{fontFamily:T.mono,fontWeight:700,color:m.c}}>{m.v}%</span></div>
            <div style={{position:'relative',height:6,borderRadius:3,background:T.border,overflow:'hidden',marginTop:2}}><div style={{position:'absolute',top:0,left:0,height:'100%',width:`${Math.min(m.v*2,100)}%`,borderRadius:3,background:m.c,opacity:0.7}}/></div>
          </div>))}
          <div style={{marginTop:12,fontSize:10,color:T.textMut,fontFamily:T.mono}}>
            High fossil dependency ({'>'}20%): {COUNTRIES.filter(c=>c.fossilFuelRevPct>20).length} sovereigns
          </div>
        </div>
      </div>

      {/* Water Stress & Biodiversity Risk Distribution */}
      <div style={S.card}>
        <div style={S.cardTitle}>Water Stress & Biodiversity Risk — Top 20 Most Exposed</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[...COUNTRIES].sort((a,b)=>b.waterStress-a.waterStress).slice(0,20).map(c=>({name:c.iso,water:c.waterStress,biodiversity:c.biodiversityRisk,forest:c.forestCoverPct}))} barGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="water" name="Water Stress" fill={T.navyL} radius={[3,3,0,0]}/>
            <Bar dataKey="biodiversity" name="Biodiversity Risk" fill={T.sage} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* NDC Progress Tracker */}
      <div style={S.card}>
        <div style={S.cardTitle}>NDC Progress Tracker — Selected Sovereigns</div>
        <div style={S.grid(4)}>
          {[...COUNTRIES].sort((a,b)=>(b.ndcTarget-b.ndcProgress)-(a.ndcTarget-a.ndcProgress)).slice(0,12).map(c=>{
            const pct=c.ndcTarget>0?Math.floor(c.ndcProgress/c.ndcTarget*100):0;
            return (<div key={c.id} style={{background:T.surfaceH,borderRadius:6,padding:10}}>
              <div style={{...S.flex,justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:600}}>{c.iso} {c.name}</span>
                <span style={{fontSize:10,fontFamily:T.mono,color:pct>60?T.green:pct>30?T.amber:T.red}}>{pct}%</span>
              </div>
              <div style={{fontSize:10,color:T.textMut,marginTop:2}}>Target: {c.ndcTarget}% | Achieved: {c.ndcProgress}%</div>
              <div style={{position:'relative',height:5,borderRadius:3,background:T.border,overflow:'hidden',marginTop:4}}>
                <div style={{position:'absolute',top:0,left:0,height:'100%',width:`${pct}%`,borderRadius:3,background:pct>60?T.green:pct>30?T.amber:T.red}}/>
              </div>
            </div>);
          })}
        </div>
      </div>

      {/* Sovereign risk heatmap */}
      <div style={S.card}>
        <div style={S.cardTitle}>Sovereign Risk Heatmap — Top 20 Economies</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Country</th><th style={S.th}>Climate</th><th style={S.th}>Debt</th><th style={S.th}>CB Policy</th><th style={S.th}>Nature</th><th style={S.th}>Social</th><th style={S.th}>Physical</th><th style={S.th}>Transition</th><th style={S.th}>CDS</th><th style={S.th}>Composite</th>
            </tr></thead>
            <tbody>
              {heatmapCountries.map(c=>(<tr key={c.id}>
                <td style={S.td}><span style={{fontWeight:600}}>{c.iso}</span> {c.name}</td>
                <td style={{...S.td,...S.heatCell(c.climateRisk,100)}}>{c.climateRisk}</td>
                <td style={{...S.td,...S.heatCell(100-c.debtSustainability,100)}}>{c.debtSustainability}</td>
                <td style={{...S.td,...S.heatCell(100-c.cbMaturity,100)}}>{c.cbMaturity}</td>
                <td style={{...S.td,...S.heatCell(c.natureDependencyGDP,30)}}>{c.natureDependencyGDP}%</td>
                <td style={{...S.td,...S.heatCell(100-c.socialIndex,100)}}>{c.socialIndex}</td>
                <td style={{...S.td,...S.heatCell(c.physicalRisk,100)}}>{c.physicalRisk}</td>
                <td style={{...S.td,...S.heatCell(c.transitionRisk,100)}}>{c.transitionRisk}</td>
                <td style={{...S.td,fontFamily:T.mono,fontSize:11}}>{c.sovereignCDS}</td>
                <td style={{...S.td,fontWeight:700,fontFamily:T.mono}}>{c.compositeScore}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top risks + top performers */}
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}><span style={S.pill(T.red)}>RISK</span> Highest Climate Risk Sovereigns</div>
          <table style={S.table}><thead><tr><th style={S.th}>Country</th><th style={S.th}>Climate</th><th style={S.th}>Physical</th><th style={S.th}>Transition</th><th style={S.th}>Rating</th><th style={S.th}>CDS</th></tr></thead>
            <tbody>{topRisks.map(c=>(<tr key={c.id}><td style={S.td}>{c.name}</td><td style={{...S.td,fontWeight:700,color:T.red,fontFamily:T.mono}}>{c.climateRisk}</td><td style={S.td}>{c.physicalRisk}</td><td style={S.td}>{c.transitionRisk}</td><td style={S.td}>{c.ratingGrade}</td><td style={{...S.td,fontFamily:T.mono}}>{c.sovereignCDS}</td></tr>))}</tbody>
          </table>
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}><span style={S.pill(T.green)}>TOP</span> Highest Composite Score</div>
          <table style={S.table}><thead><tr><th style={S.th}>Country</th><th style={S.th}>Composite</th><th style={S.th}>SDG</th><th style={S.th}>GBF</th><th style={S.th}>Green Bond %</th><th style={S.th}>HDI</th></tr></thead>
            <tbody>{topImprovements.map(c=>(<tr key={c.id}><td style={S.td}>{c.name}</td><td style={{...S.td,fontWeight:700,color:T.green,fontFamily:T.mono}}>{c.compositeScore}</td><td style={S.td}>{c.sdgProgress}</td><td style={S.td}>{c.gbfCompliance}</td><td style={S.td}>{c.greenBondPct}%</td><td style={{...S.td,fontFamily:T.mono}}>{c.hdi}</td></tr>))}</tbody>
          </table>
        </div>
      </div>

      {/* Active alerts with expand */}
      <div style={S.card}>
        <div style={S.cardTitle}>Active Sovereign Alerts ({ALERTS.filter(a=>!a.resolved).length})</div>
        <table style={S.table}><thead><tr><th style={S.th}>Severity</th><th style={S.th}>Country</th><th style={S.th}>Alert Type</th><th style={S.th}>Module</th><th style={S.th}>Impact</th><th style={S.th}>Triggered</th><th style={S.th}>Status</th><th style={S.th}></th></tr></thead>
          <tbody>{ALERTS.filter(a=>!a.resolved).map(a=>(<React.Fragment key={a.id}>
            <tr>
              <td style={S.td}><span style={S.pill(sevColor(a.severity))}>{a.severity}</span></td>
              <td style={S.td}>{a.country} ({a.iso})</td>
              <td style={S.td}>{a.type}</td>
              <td style={S.td}>{a.module}</td>
              <td style={{...S.td,fontFamily:T.mono}}>{a.impact}x</td>
              <td style={{...S.td,fontFamily:T.mono}}>{a.triggered}</td>
              <td style={S.td}><span style={S.pill(T.amber)}>Open</span></td>
              <td style={S.td}><button style={{...S.btn(false),fontSize:10,padding:'2px 8px'}} onClick={()=>setExpandedAlert(expandedAlert===a.id?null:a.id)}>{expandedAlert===a.id?'Hide':'Detail'}</button></td>
            </tr>
            {expandedAlert===a.id&&<tr><td colSpan={8} style={{...S.td,background:T.surfaceH,fontSize:11,color:T.textSec,padding:12}}>{a.detail}</td></tr>}
          </React.Fragment>))}</tbody>
        </table>
      </div>
    </>);
  };

  // ── Tab 2: Country Comparison ───────────────────────────────────────────────
  const renderCountryComparison=()=>{
    const selC=selCountry!==null?COUNTRIES.find(c=>c.id===selCountry):null;
    const peers=selC?COUNTRIES.filter(c=>c.region===selC.region&&c.id!==selC.id).slice(0,6):[];
    const radarData=selC?SUB_MODULES.map(m=>({dim:m,country:m==='Climate Risk'?selC.climateRisk:m==='Debt Sustainability'?selC.debtSustainability:m==='Central Bank Policy'?selC.cbMaturity:m==='Nature Risk'?100-selC.natureDependencyGDP*3:selC.socialIndex,regional:regionAgg[selC.region]?+(m==='Climate Risk'?regionAgg[selC.region].avgClimate:m==='Debt Sustainability'?regionAgg[selC.region].avgDebt:m==='Central Bank Policy'?regionAgg[selC.region].avgCB:m==='Nature Risk'?100-regionAgg[selC.region].avgNature*3:regionAgg[selC.region].avgSocial).toFixed(1):50})):[];
    const compareCountries=COUNTRIES.filter(c=>compareList.includes(c.id));
    const compareRadar=compareCountries.length>0?SUB_MODULES.map(m=>{
      const row={dim:m};
      compareCountries.forEach(c=>{row[c.iso]=m==='Climate Risk'?c.climateRisk:m==='Debt Sustainability'?c.debtSustainability:m==='Central Bank Policy'?c.cbMaturity:m==='Nature Risk'?100-c.natureDependencyGDP*3:c.socialIndex;});
      return row;
    }):[];

    return (<>
      {/* Filters */}
      <div style={{...S.flex,marginBottom:16,flexWrap:'wrap',gap:10}}>
        <input style={{...S.input,width:220}} placeholder="Search country or ISO code..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
        <select style={S.select} value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
          <option value="All">All Regions</option>
          {REGIONS.map(r=>(<option key={r} value={r}>{r}</option>))}
        </select>
        <select style={S.select} value={incomeFilter} onChange={e=>setIncomeFilter(e.target.value)}>
          <option value="All">All Income Groups</option>
          {INCOME_GROUPS.map(g=>(<option key={g} value={g}>{g}</option>))}
        </select>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} countries | {compareList.length} selected for compare</span>
        {compareList.length>0&&<button style={{...S.btn(false),fontSize:10}} onClick={()=>setCompareList([])}>Clear Compare</button>}
      </div>

      {/* Regional aggregates */}
      <div style={{...S.grid(5),marginBottom:16}}>
        {REGIONS.map((r,i)=>{
          const agg=regionAgg[r];
          if(!agg) return null;
          return (<div key={r} style={{...S.card,borderTop:`3px solid ${CHART_COLORS[i]}`,padding:12,cursor:'pointer'}} onClick={()=>setRegionFilter(regionFilter===r?'All':r)}>
            <div style={{fontSize:12,fontWeight:700,color:CHART_COLORS[i]}}>{r}</div>
            <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{agg.count} countries</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginTop:8,fontSize:10,fontFamily:T.mono}}>
              <div>Climate: <b>{agg.avgClimate}</b></div>
              <div>Debt: <b>{agg.avgDebt}</b></div>
              <div>CB: <b>{agg.avgCB}</b></div>
              <div>Social: <b>{agg.avgSocial}</b></div>
              <div>Spread: <b>{agg.avgSpread}</b></div>
              <div>Green: <b>{agg.avgGreen}%</b></div>
            </div>
          </div>);
        })}
      </div>

      {/* Multi-country compare radar */}
      {compareCountries.length>=2&&(<div style={S.card}>
        <div style={S.cardTitle}>Multi-Country Comparison Radar ({compareCountries.map(c=>c.iso).join(', ')})</div>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={compareRadar}>
            <PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
            <PolarRadiusAxis tick={{fontSize:9}} domain={[0,100]}/>
            {compareCountries.map((c,ci)=>(<Radar key={c.id} name={c.iso} dataKey={c.iso} stroke={CHART_COLORS[ci%10]} fill={CHART_COLORS[ci%10]} fillOpacity={0.1}/>))}
            <Legend wrapperStyle={{fontSize:10}}/>
          </RadarChart>
        </ResponsiveContainer>
        <div style={{overflowX:'auto',marginTop:8}}>
          <table style={S.table}><thead><tr><th style={S.th}>Metric</th>{compareCountries.map(c=>(<th key={c.id} style={{...S.th,color:CHART_COLORS[compareList.indexOf(c.id)%10]}}>{c.iso}</th>))}</tr></thead>
            <tbody>{['climateRisk','debtSustainability','cbMaturity','socialIndex','greenBondPct','spreadBps','carbonIntensity','hdi'].map(m=>(<tr key={m}><td style={{...S.td,fontWeight:600}}>{m.replace(/([A-Z])/g,' $1').trim()}</td>{compareCountries.map(c=>(<td key={c.id} style={{...S.td,fontFamily:T.mono}}>{c[m]}</td>))}</tr>))}</tbody>
          </table>
        </div>
      </div>)}

      <div style={S.row}>
        {/* Country table */}
        <div style={{...S.card,flex:2,overflowX:'auto'}}>
          <div style={S.cardTitle}>Unified Country Scorecard</div>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}></th>
              {[{k:'name',l:'Country'},{k:'region',l:'Region'},{k:'climateRisk',l:'Climate'},{k:'debtSustainability',l:'Debt'},{k:'cbMaturity',l:'CB'},{k:'natureDependencyGDP',l:'Nature%'},{k:'socialIndex',l:'Social'},{k:'sdgProgress',l:'SDG'},{k:'greenBondPct',l:'Green%'},{k:'compositeScore',l:'Composite'}].map(c=>(
                <th key={c.k} style={{...S.th,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>typeof COUNTRIES[0][c.k]==='number'&&handleSort(c.k)}>{c.l}{sortCol===c.k?(sortAsc?' \u2191':' \u2193'):''}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.slice(0,40).map(c=>(<tr key={c.id} style={{background:selCountry===c.id?T.surfaceH:compareList.includes(c.id)?'rgba(197,169,106,0.06)':'transparent',cursor:'pointer'}} onClick={()=>setSelCountry(c.id)}>
                <td style={S.td}><input type="checkbox" checked={compareList.includes(c.id)} onChange={e=>{e.stopPropagation();toggleCompare(c.id);}} style={{accentColor:T.gold}}/></td>
                <td style={{...S.td,fontWeight:600}}><span style={{marginRight:4,fontFamily:T.mono,fontSize:10}}>{c.iso}</span>{c.name}</td>
                <td style={S.td}><span style={{...S.tag,background:regionFilter===c.region?'rgba(27,58,92,0.1)':'transparent',color:T.textSec,fontSize:9}}>{c.region}</span></td>
                <td style={{...S.td,...S.heatCell(c.climateRisk,100)}}>{c.climateRisk}</td>
                <td style={{...S.td,...S.heatCell(100-c.debtSustainability,100)}}>{c.debtSustainability}</td>
                <td style={{...S.td,...S.heatCell(100-c.cbMaturity,100)}}>{c.cbMaturity}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{c.natureDependencyGDP}%</td>
                <td style={{...S.td,...S.heatCell(100-c.socialIndex,100)}}>{c.socialIndex}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{c.sdgProgress}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{c.greenBondPct}%</td>
                <td style={{...S.td,fontWeight:700,fontFamily:T.mono,color:c.compositeScore>50?T.navy:T.red}}>{c.compositeScore}</td>
              </tr>))}
            </tbody>
          </table>
          {filtered.length>40&&<div style={{fontSize:11,color:T.textMut,padding:8,textAlign:'center'}}>Showing 40 of {filtered.length} countries</div>}
        </div>

        {/* Cross-module detail panel */}
        {selC&&(<div style={{...S.card,width:400,position:'sticky',top:24,maxHeight:'85vh',overflowY:'auto'}}>
          <div style={{...S.cardTitle,fontSize:16}}>{selC.iso} — {selC.name}</div>
          <div style={{...S.flex,gap:6,marginBottom:12,flexWrap:'wrap'}}>
            <span style={{...S.tag,background:'rgba(27,58,92,0.1)',color:T.navy}}>{selC.region}</span>
            <span style={{...S.tag,background:'rgba(197,169,106,0.1)',color:T.gold}}>{selC.income}</span>
            <span style={{...S.tag,background:'rgba(90,138,106,0.1)',color:T.sage}}>{selC.ratingGrade} ({selC.creditRating})</span>
            {selC.ngfsCoverage&&<span style={{...S.tag,background:'rgba(22,163,74,0.1)',color:T.green}}>NGFS</span>}
          </div>

          {/* Radar chart */}
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/>
              <PolarRadiusAxis tick={{fontSize:8}} domain={[0,100]}/>
              <Radar name={selC.name} dataKey="country" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
              <Radar name="Regional Avg" dataKey="regional" stroke={T.gold} fill={T.gold} fillOpacity={0.1}/>
              <Legend wrapperStyle={{fontSize:9}}/>
            </RadarChart>
          </ResponsiveContainer>

          {/* Quarterly trend mini-chart */}
          <div style={{marginTop:8}}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>Quarterly Trend</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={selC.quarterlyTrend}>
                <XAxis dataKey="q" tick={{fontSize:9,fill:T.textSec}}/>
                <YAxis tick={{fontSize:9,fill:T.textSec}} domain={['auto','auto']}/>
                <Tooltip contentStyle={{fontSize:10}}/>
                <Line type="monotone" dataKey="climate" name="Climate" stroke={T.red} strokeWidth={1.5} dot={{r:2}}/>
                <Line type="monotone" dataKey="debt" name="Debt" stroke={T.navy} strokeWidth={1.5} dot={{r:2}}/>
                <Line type="monotone" dataKey="social" name="Social" stroke={T.sage} strokeWidth={1.5} dot={{r:2}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Key metrics grid */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:8}}>
            {[
              {l:'Climate Risk',v:selC.climateRisk,u:'/100',c:selC.climateRisk>60?T.red:T.green},
              {l:'Debt Sustainability',v:selC.debtSustainability,u:'/100',c:selC.debtSustainability<40?T.red:T.green},
              {l:'CB Maturity',v:selC.cbMaturity,u:'/100',c:selC.cbMaturity<35?T.amber:T.green},
              {l:'Nature Dep GDP',v:selC.natureDependencyGDP,u:'%',c:selC.natureDependencyGDP>15?T.red:T.green},
              {l:'Social Index',v:selC.socialIndex,u:'/100',c:selC.socialIndex<40?T.red:T.green},
              {l:'Green Bond %',v:selC.greenBondPct,u:'%',c:T.navy},
              {l:'GDP (Bn USD)',v:selC.gdpBn,u:'B',c:T.navy},
              {l:'Debt/GDP',v:selC.debtToGDP,u:'%',c:selC.debtToGDP>80?T.red:T.green},
              {l:'Carbon Intensity',v:selC.carbonIntensity,u:'tCO2/M$',c:selC.carbonIntensity>400?T.red:T.green},
              {l:'NDC Progress',v:`${selC.ndcProgress}/${selC.ndcTarget}`,u:'%',c:selC.ndcProgress/Math.max(selC.ndcTarget,1)<0.5?T.red:T.green},
              {l:'Water Stress',v:selC.waterStress,u:'/100',c:selC.waterStress>60?T.red:T.green},
              {l:'HDI',v:selC.hdi,u:'',c:selC.hdi>0.7?T.green:T.amber},
              {l:'Sovereign CDS',v:selC.sovereignCDS,u:'bps',c:selC.sovereignCDS>200?T.red:T.green},
              {l:'FX Reserves',v:selC.fxReserveMonths,u:'months',c:selC.fxReserveMonths<3?T.red:T.green},
              {l:'Fiscal Space',v:selC.fiscalSpace,u:'%',c:T.navy},
              {l:'Renewable Cap',v:selC.renewableCapPct,u:'%',c:selC.renewableCapPct>25?T.green:T.amber},
              {l:'Youth Unempl.',v:selC.youthUnemplPct,u:'%',c:selC.youthUnemplPct>20?T.red:T.green},
              {l:'Gender Gap',v:selC.genderGapIdx,u:'',c:selC.genderGapIdx>0.7?T.green:T.red},
            ].map((m,i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:6}}>
              <div style={{fontSize:9,color:T.textMut}}>{m.l}</div>
              <div style={{fontSize:14,fontWeight:700,color:m.c,fontFamily:T.mono}}>{m.v}<span style={{fontSize:9,color:T.textMut,marginLeft:2}}>{m.u}</span></div>
            </div>))}
          </div>

          {/* CB Tools */}
          <div style={{marginTop:10}}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>CB Climate Tools Adopted ({selC.cbTools.length}/{CB_TOOLS.length})</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
              {CB_TOOLS.map(t=>(<span key={t} style={{...S.tag,background:selC.cbTools.includes(t)?'rgba(22,163,74,0.1)':'rgba(154,163,174,0.1)',color:selC.cbTools.includes(t)?T.green:T.textMut,fontSize:9}}>{t}</span>))}
            </div>
          </div>

          {/* Peer comparison */}
          <div style={{marginTop:10}}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>Peer Comparison ({selC.region})</div>
            <table style={S.table}><thead><tr><th style={S.th}>Country</th><th style={S.th}>Comp.</th><th style={S.th}>Climate</th><th style={S.th}>Social</th><th style={S.th}>Spread</th></tr></thead>
              <tbody>
                <tr style={{background:T.surfaceH}}><td style={{...S.td,fontWeight:700}}>{selC.name}</td><td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{selC.compositeScore}</td><td style={S.td}>{selC.climateRisk}</td><td style={S.td}>{selC.socialIndex}</td><td style={{...S.td,fontFamily:T.mono}}>{selC.spreadBps}</td></tr>
                {peers.map(p=>(<tr key={p.id}><td style={S.td}>{p.name}</td><td style={{...S.td,fontFamily:T.mono}}>{p.compositeScore}</td><td style={S.td}>{p.climateRisk}</td><td style={S.td}>{p.socialIndex}</td><td style={{...S.td,fontFamily:T.mono}}>{p.spreadBps}</td></tr>))}
              </tbody>
            </table>
          </div>

          {/* SDG Scores radar */}
          <div style={{marginTop:10}}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>SDG Performance (Selected Goals)</div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={['Climate Action','Clean Energy','Clean Water','Decent Work','No Poverty','Health','Education','Industry'].map((g,gi)=>({goal:g.length>10?g.substring(0,10)+'..':g,score:selC.sdgScores[[12,6,5,7,0,2,3,8][gi]]}))}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="goal" tick={{fontSize:8,fill:T.textSec}}/>
                <PolarRadiusAxis tick={{fontSize:7}} domain={[0,100]}/>
                <Radar dataKey="score" stroke={T.sage} fill={T.sage} fillOpacity={0.2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Energy transition snapshot */}
          <div style={{marginTop:10}}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>Energy Transition Snapshot</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[
                {l:'Fossil Rev',v:selC.fossilFuelRevPct+'%',c:selC.fossilFuelRevPct>20?T.red:T.green},
                {l:'Renewable Cap',v:selC.renewableCapPct+'%',c:selC.renewableCapPct>25?T.green:T.amber},
                {l:'Climate Pledge',v:selC.climateFinancePledge+'%',c:T.gold},
                {l:'Adaptation',v:selC.adaptationSpend+'%',c:T.sage},
              ].map((m,i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:4,padding:4,textAlign:'center'}}>
                <div style={{fontSize:9,color:T.textMut}}>{m.l}</div>
                <div style={{fontSize:12,fontWeight:700,color:m.c,fontFamily:T.mono}}>{m.v}</div>
              </div>))}
            </div>
          </div>

          {/* Country alerts */}
          <div style={{marginTop:10}}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>Country Alerts</div>
            {ALERTS.filter(a=>a.iso===selC.iso).length===0?<div style={{fontSize:11,color:T.textMut}}>No active alerts for this sovereign</div>:
            ALERTS.filter(a=>a.iso===selC.iso).map(a=>(<div key={a.id} style={{background:T.surfaceH,borderRadius:6,padding:8,marginBottom:4,borderLeft:`3px solid ${sevColor(a.severity)}`}}>
              <div style={{fontSize:11,fontWeight:600}}>{a.type}</div>
              <div style={{fontSize:10,color:T.textMut}}>{a.severity} | {a.module} | {a.triggered}</div>
            </div>))}
          </div>
        </div>)}
      </div>

      {/* Income group cross-tab analysis */}
      <div style={S.card}>
        <div style={S.cardTitle}>Income Group Cross-Tab Analysis</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Income Group</th><th style={S.th}>Count</th><th style={S.th}>Avg Climate</th><th style={S.th}>Avg Debt Sust.</th><th style={S.th}>Avg CB Maturity</th><th style={S.th}>Avg Social</th><th style={S.th}>Avg Green %</th><th style={S.th}>Avg CDS</th><th style={S.th}>Avg HDI</th></tr></thead>
          <tbody>
            {INCOME_GROUPS.map((g,gi)=>{
              const gc=COUNTRIES.filter(c=>c.income===g);
              if(!gc.length) return null;
              return (<tr key={g}>
                <td style={{...S.td,fontWeight:600}}>{g}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{gc.length}</td>
                <td style={{...S.td,...S.heatCell(gc.reduce((s,c)=>s+c.climateRisk,0)/gc.length,100)}}>{(gc.reduce((s,c)=>s+c.climateRisk,0)/gc.length).toFixed(1)}</td>
                <td style={S.td}>{(gc.reduce((s,c)=>s+c.debtSustainability,0)/gc.length).toFixed(1)}</td>
                <td style={S.td}>{(gc.reduce((s,c)=>s+c.cbMaturity,0)/gc.length).toFixed(1)}</td>
                <td style={S.td}>{(gc.reduce((s,c)=>s+c.socialIndex,0)/gc.length).toFixed(1)}</td>
                <td style={S.td}>{(gc.reduce((s,c)=>s+c.greenBondPct,0)/gc.length).toFixed(1)}%</td>
                <td style={{...S.td,fontFamily:T.mono}}>{(gc.reduce((s,c)=>s+c.sovereignCDS,0)/gc.length).toFixed(0)}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{(gc.reduce((s,c)=>s+c.hdi,0)/gc.length).toFixed(3)}</td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>

      {/* Transition readiness scatter */}
      <div style={S.card}>
        <div style={S.cardTitle}>Transition Readiness: Renewable Capacity vs Fossil Dependency</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[...COUNTRIES].sort((a,b)=>b.fossilFuelRevPct-a.fossilFuelRevPct).slice(0,20).map(c=>({name:c.iso,fossil:c.fossilFuelRevPct,renewable:c.renewableCapPct}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} unit="%"/>
            <Tooltip contentStyle={{fontSize:11}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="fossil" name="Fossil Rev %" fill={T.red} radius={[3,3,0,0]}/>
            <Bar dataKey="renewable" name="Renewable Cap %" fill={T.green} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>);
  };

  // ── Tab 3: Sovereign Bond Portfolio ─────────────────────────────────────────
  const renderBondPortfolio=()=>{
    const yieldComparison=REGIONS.map(r=>{
      const rc=COUNTRIES.filter(c=>c.region===r);
      if(!rc.length) return null;
      return {name:r.length>14?r.substring(0,14)+'..':r,conventional:+(rc.reduce((s,c)=>s+c.conventionalYield,0)/rc.length).toFixed(2),climateAdj:+(rc.reduce((s,c)=>s+c.climateAdjYield,0)/rc.length).toFixed(2),natureAdj:+(rc.reduce((s,c)=>s+c.natureAdjSpread,0)/rc.length).toFixed(0)};
    }).filter(Boolean);
    const bondTypeData=BOND_TYPES.map((bt,i)=>({name:bt,value:Math.floor(sr(i*251)*30+5),pct:+(sr(i*257)*25+5).toFixed(1)}));
    const totalAllocated=portfolioFiltered.length;
    const avgYield=portfolioFiltered.length?+(portfolioFiltered.reduce((s,c)=>s+c.climateAdjYield,0)/portfolioFiltered.length).toFixed(2):0;
    const avgRisk=portfolioFiltered.length?+(portfolioFiltered.reduce((s,c)=>s+c.climateRisk,0)/portfolioFiltered.length).toFixed(1):0;
    const avgSocial=portfolioFiltered.length?+(portfolioFiltered.reduce((s,c)=>s+c.socialIndex,0)/portfolioFiltered.length).toFixed(1):0;
    const avgCarbon=portfolioFiltered.length?+(portfolioFiltered.reduce((s,c)=>s+c.carbonIntensity,0)/portfolioFiltered.length).toFixed(0):0;
    const rebalancingRecs=[
      {action:'Reduce',country:'Turkey',reason:'Climate risk exceeds threshold',impact:'-12 bps spread',urgency:'High'},
      {action:'Increase',country:'Norway',reason:'Strong composite + green bond leader',impact:'+8 bps yield',urgency:'Medium'},
      {action:'Reduce',country:'Nigeria',reason:'Debt sustainability concern',impact:'-18 bps spread',urgency:'Critical'},
      {action:'Increase',country:'Chile',reason:'Top nature + social performance',impact:'+5 bps yield',urgency:'Low'},
      {action:'Reduce',country:'Argentina',reason:'Transition risk acceleration',impact:'-25 bps spread',urgency:'High'},
      {action:'Increase',country:'Denmark',reason:'CB maturity leader + SDG progress',impact:'+3 bps yield',urgency:'Low'},
      {action:'Hold',country:'Japan',reason:'Stable composite, moderate climate risk',impact:'Neutral',urgency:'Low'},
      {action:'Reduce',country:'Egypt',reason:'Water stress + social premium inversion',impact:'-15 bps spread',urgency:'Medium'},
    ];
    const spreadData=COUNTRIES.slice(0,25).map(c=>({name:c.iso,conventional:c.spreadBps,natureAdj:c.natureAdjSpread,diff:c.natureAdjSpread-c.spreadBps}));
    const yieldVsRisk=COUNTRIES.map(c=>({name:c.iso,yield:c.climateAdjYield,risk:c.climateRisk,social:c.socialIndex}));
    const ratingDistribution=['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B'].map(g=>({name:g,count:COUNTRIES.filter(c=>c.ratingGrade===g).length})).filter(d=>d.count>0);

    return (<>
      {/* Portfolio summary KPIs */}
      <div style={S.grid(6)}>
        {[
          {l:'Eligible Sovereigns',v:totalAllocated,u:'/80'},
          {l:'Avg Climate-Adj Yield',v:avgYield,u:'%'},
          {l:'Avg Climate Risk',v:avgRisk,u:'/100'},
          {l:'Avg Social Score',v:avgSocial,u:'/100'},
          {l:'Avg Carbon Intensity',v:avgCarbon,u:'tCO2'},
          {l:'Green Bond Alloc.',v:+(portfolioFiltered.reduce((s,c)=>s+c.greenBondPct,0)/Math.max(portfolioFiltered.length,1)).toFixed(1),u:'%'},
        ].map((k,i)=>(<div key={i} style={S.kpi}>
          <div style={S.kpiLabel}>{k.l}</div>
          <div style={{...S.kpiVal,fontSize:18}}>{k.v}<span style={{fontSize:11,color:T.textMut,marginLeft:4}}>{k.u}</span></div>
        </div>))}
      </div>

      {/* Constraint sliders */}
      <div style={{...S.card,marginTop:16}}>
        <div style={S.cardTitle}>Optimal Allocation Constraints</div>
        <div style={S.grid(4)}>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Max Climate Risk: <b style={{fontFamily:T.mono}}>{maxClimateRisk}</b></div>
            <input type="range" min={20} max={100} value={maxClimateRisk} onChange={e=>setMaxClimateRisk(+e.target.value)} style={S.slider}/>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Min Social Score: <b style={{fontFamily:T.mono}}>{minSocialScore}</b></div>
            <input type="range" min={0} max={80} value={minSocialScore} onChange={e=>setMinSocialScore(+e.target.value)} style={S.slider}/>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Max Debt/GDP %: <b style={{fontFamily:T.mono}}>{maxDebtGDP}</b></div>
            <input type="range" min={20} max={200} value={maxDebtGDP} onChange={e=>setMaxDebtGDP(+e.target.value)} style={S.slider}/>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Min Green Bond %: <b style={{fontFamily:T.mono}}>{minGreenBond}</b></div>
            <input type="range" min={0} max={20} value={minGreenBond} onChange={e=>setMinGreenBond(+e.target.value)} style={S.slider}/>
          </div>
        </div>
        <div style={{fontSize:11,color:T.textMut,marginTop:8,fontFamily:T.mono}}>Constraint filtering: {portfolioFiltered.length} of 80 sovereigns eligible</div>
      </div>

      <div style={S.row}>
        {/* Yield comparison chart */}
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Climate-Adjusted vs Conventional Yield by Region</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yieldComparison} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} unit="%"/>
              <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="conventional" name="Conventional Yield" fill={T.textMut} radius={[3,3,0,0]}/>
              <Bar dataKey="climateAdj" name="Climate-Adj Yield" fill={T.navy} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bond type + rating dist */}
        <div style={{width:320,display:'flex',flexDirection:'column',gap:14}}>
          <div style={S.card}>
            <div style={S.cardTitle}>Bond Type Allocation</div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={bondTypeData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" nameKey="name" label={({pct})=>`${pct}%`} labelLine={false} style={{fontSize:9}}>
                  {bondTypeData.map((_,i)=>(<Cell key={i} fill={CHART_COLORS[i]}/>))}
                </Pie>
                <Tooltip contentStyle={{fontSize:10}}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,justifyContent:'center'}}>
              {bondTypeData.map((b,i)=>(<span key={i} style={{fontSize:9,color:CHART_COLORS[i],fontFamily:T.mono}}>{b.name}: {b.pct}%</span>))}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Rating Distribution</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={ratingDistribution}>
                <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} interval={0}/>
                <YAxis tick={{fontSize:9,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontSize:10}}/>
                <Bar dataKey="count" fill={T.navyL} radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Nature-adjusted spread chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>Nature-Adjusted Spread vs Conventional (Top 25)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={spreadData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} unit=" bps"/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="conventional" name="Conventional" fill={T.textMut} radius={[3,3,0,0]}/>
            <Bar dataKey="natureAdj" name="Nature-Adj" fill={T.sage} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Social premium distribution */}
      <div style={S.card}>
        <div style={S.cardTitle}>Social Premium Distribution (Top 30)</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={COUNTRIES.slice(0,30).map(c=>({name:c.iso,premium:c.socialPremium,social:c.socialIndex}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            <Area type="monotone" dataKey="premium" name="Social Premium (%)" stroke={T.sage} fill={T.sage} fillOpacity={0.2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Yield vs Risk scatter approximation using bar chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>Climate-Adjusted Yield vs Climate Risk (Top 30)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={yieldVsRisk.slice(0,30)} barGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} interval={0}/>
            <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textSec}} unit="%"/>
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:10}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar yAxisId="left" dataKey="yield" name="Climate-Adj Yield %" fill={T.navy} radius={[3,3,0,0]}/>
            <Line yAxisId="right" type="monotone" dataKey="risk" name="Climate Risk" stroke={T.red} strokeWidth={2} dot={{r:2}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Portfolio risk decomposition */}
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Portfolio Risk Decomposition</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={[
              {dim:'Physical Risk',value:portfolioFiltered.length?+(portfolioFiltered.reduce((s,c)=>s+c.physicalRisk,0)/portfolioFiltered.length).toFixed(1):0},
              {dim:'Transition Risk',value:portfolioFiltered.length?+(portfolioFiltered.reduce((s,c)=>s+c.transitionRisk,0)/portfolioFiltered.length).toFixed(1):0},
              {dim:'Nature Risk',value:portfolioFiltered.length?+(portfolioFiltered.reduce((s,c)=>s+c.natureDependencyGDP*3,0)/portfolioFiltered.length).toFixed(1):0},
              {dim:'Social Risk',value:portfolioFiltered.length?+(100-portfolioFiltered.reduce((s,c)=>s+c.socialIndex,0)/portfolioFiltered.length).toFixed(1):0},
              {dim:'Debt Risk',value:portfolioFiltered.length?+(100-portfolioFiltered.reduce((s,c)=>s+c.debtSustainability,0)/portfolioFiltered.length).toFixed(1):0},
              {dim:'Carbon Int.',value:portfolioFiltered.length?+(portfolioFiltered.reduce((s,c)=>s+c.carbonIntensity,0)/portfolioFiltered.length/10).toFixed(1):0},
            ]}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
              <PolarRadiusAxis tick={{fontSize:9}} domain={[0,100]}/>
              <Radar dataKey="value" stroke={T.red} fill={T.red} fillOpacity={0.15}/>
              <Tooltip contentStyle={{fontSize:11}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>CDS Spread Distribution (Eligible Portfolio)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              {range:'0-50',count:portfolioFiltered.filter(c=>c.sovereignCDS<=50).length},
              {range:'51-100',count:portfolioFiltered.filter(c=>c.sovereignCDS>50&&c.sovereignCDS<=100).length},
              {range:'101-200',count:portfolioFiltered.filter(c=>c.sovereignCDS>100&&c.sovereignCDS<=200).length},
              {range:'201-300',count:portfolioFiltered.filter(c=>c.sovereignCDS>200&&c.sovereignCDS<=300).length},
              {range:'300+',count:portfolioFiltered.filter(c=>c.sovereignCDS>300).length},
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="range" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11}}/>
              <Bar dataKey="count" name="Sovereigns" fill={T.navyL} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Eligible portfolio table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Eligible Sovereign Portfolio ({portfolioFiltered.length} countries)</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Country</th><th style={S.th}>Rating</th><th style={S.th}>Climate</th><th style={S.th}>Social</th>
              <th style={S.th}>Debt/GDP</th><th style={S.th}>Conv. Yield</th><th style={S.th}>Climate-Adj</th><th style={S.th}>Spread</th>
              <th style={S.th}>Nature-Adj</th><th style={S.th}>Green %</th><th style={S.th}>Social Prem.</th><th style={S.th}>CDS</th>
            </tr></thead>
            <tbody>{portfolioFiltered.slice(0,30).map(c=>(<tr key={c.id}>
              <td style={{...S.td,fontWeight:600}}>{c.iso} {c.name}</td>
              <td style={S.td}>{c.ratingGrade}</td>
              <td style={{...S.td,...S.heatCell(c.climateRisk,100)}}>{c.climateRisk}</td>
              <td style={{...S.td,...S.heatCell(100-c.socialIndex,100)}}>{c.socialIndex}</td>
              <td style={{...S.td,fontFamily:T.mono}}>{c.debtToGDP}%</td>
              <td style={{...S.td,fontFamily:T.mono}}>{c.conventionalYield}%</td>
              <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{c.climateAdjYield}%</td>
              <td style={{...S.td,fontFamily:T.mono}}>{c.spreadBps}</td>
              <td style={{...S.td,fontFamily:T.mono}}>{c.natureAdjSpread}</td>
              <td style={S.td}>{c.greenBondPct}%</td>
              <td style={{...S.td,fontFamily:T.mono,color:c.socialPremium>0?T.green:T.red}}>{c.socialPremium>0?'+':''}{c.socialPremium}%</td>
              <td style={{...S.td,fontFamily:T.mono}}>{c.sovereignCDS}</td>
            </tr>))}</tbody>
          </table>
        </div>
        {portfolioFiltered.length>30&&<div style={{fontSize:11,color:T.textMut,padding:8,textAlign:'center'}}>Showing 30 of {portfolioFiltered.length}</div>}
      </div>

      {/* Debt vulnerability analysis */}
      <div style={S.card}>
        <div style={S.cardTitle}>Debt Vulnerability Analysis — Portfolio Sovereigns</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Country</th><th style={S.th}>Debt/GDP</th><th style={S.th}>Debt Sust.</th><th style={S.th}>CDS</th><th style={S.th}>FX Reserves</th><th style={S.th}>Fiscal Space</th><th style={S.th}>Rating</th><th style={S.th}>Risk Flag</th></tr></thead>
            <tbody>{[...portfolioFiltered].sort((a,b)=>b.debtToGDP-a.debtToGDP).slice(0,15).map(c=>{
              const flag=c.debtToGDP>100?'Critical':c.debtToGDP>70?'Elevated':c.fxReserveMonths<3?'FX Risk':'Normal';
              return (<tr key={c.id}>
                <td style={{...S.td,fontWeight:600}}>{c.iso} {c.name}</td>
                <td style={{...S.td,fontFamily:T.mono,fontWeight:700,color:c.debtToGDP>100?T.red:c.debtToGDP>70?T.amber:T.green}}>{c.debtToGDP}%</td>
                <td style={{...S.td,...S.heatCell(100-c.debtSustainability,100)}}>{c.debtSustainability}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{c.sovereignCDS}</td>
                <td style={{...S.td,fontFamily:T.mono,color:c.fxReserveMonths<3?T.red:T.green}}>{c.fxReserveMonths}m</td>
                <td style={{...S.td,fontFamily:T.mono}}>{c.fiscalSpace}%</td>
                <td style={S.td}>{c.ratingGrade}</td>
                <td style={S.td}><span style={S.pill(flag==='Critical'?T.red:flag==='Elevated'?T.amber:flag==='FX Risk'?T.gold:T.green)}>{flag}</span></td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>

      {/* Climate-adjusted attribution */}
      <div style={S.row}>
        <div style={{...S.card,flex:1}}>
          <div style={S.cardTitle}>Climate Pricing Gap by Region</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={REGIONS.map(r=>{
              const rc=portfolioFiltered.filter(c=>c.region===r);
              if(!rc.length) return null;
              const convAvg=+(rc.reduce((s,c)=>s+c.conventionalYield,0)/rc.length).toFixed(2);
              const climAvg=+(rc.reduce((s,c)=>s+c.climateAdjYield,0)/rc.length).toFixed(2);
              return {name:r.length>12?r.substring(0,12)+'..':r,gap:+(convAvg-climAvg).toFixed(2),natureGap:+((rc.reduce((s,c)=>s+c.natureAdjSpread-c.spreadBps,0)/rc.length)).toFixed(0)};
            }).filter(Boolean)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11}}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="gap" name="Yield Gap (%)" fill={T.amber} radius={[3,3,0,0]}/>
              <Bar dataKey="natureGap" name="Nature Spread Gap (bps)" fill={T.sage} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...S.card,width:300}}>
          <div style={S.cardTitle}>Portfolio Constraint Summary</div>
          {[
            {l:'Max Climate Risk Filter',v:maxClimateRisk,max:100},
            {l:'Min Social Score Filter',v:minSocialScore,max:80},
            {l:'Max Debt/GDP Filter',v:maxDebtGDP,max:200},
            {l:'Min Green Bond % Filter',v:minGreenBond,max:20},
          ].map((f,fi)=>(<div key={fi} style={{marginBottom:10}}>
            <div style={{...S.flex,justifyContent:'space-between',fontSize:11}}>
              <span>{f.l}</span><span style={{fontFamily:T.mono,fontWeight:700}}>{f.v}</span>
            </div>
            <div style={{position:'relative',height:5,borderRadius:3,background:T.border,overflow:'hidden',marginTop:3}}>
              <div style={{position:'absolute',top:0,left:0,height:'100%',width:`${f.v/f.max*100}%`,borderRadius:3,background:T.navy}}/>
            </div>
          </div>))}
          <div style={{marginTop:10,padding:8,background:T.surfaceH,borderRadius:6,fontSize:11,color:T.textSec}}>
            <b>{portfolioFiltered.length}</b> of 80 sovereigns pass all filters. Average composite: <b style={{fontFamily:T.mono}}>{portfolioFiltered.length?+(portfolioFiltered.reduce((s,c)=>s+c.compositeScore,0)/portfolioFiltered.length).toFixed(1):0}</b>
          </div>
        </div>
      </div>

      {/* Rebalancing recommendations */}
      <div style={S.card}>
        <div style={S.cardTitle}>Rebalancing Recommendations</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Action</th><th style={S.th}>Country</th><th style={S.th}>Reason</th><th style={S.th}>Impact</th><th style={S.th}>Urgency</th></tr></thead>
          <tbody>{rebalancingRecs.map((r,i)=>(<tr key={i}>
            <td style={S.td}><span style={S.pill(r.action==='Reduce'?T.red:r.action==='Increase'?T.green:T.amber)}>{r.action}</span></td>
            <td style={{...S.td,fontWeight:600}}>{r.country}</td>
            <td style={S.td}>{r.reason}</td>
            <td style={{...S.td,fontFamily:T.mono}}>{r.impact}</td>
            <td style={S.td}><span style={S.pill(sevColor(r.urgency))}>{r.urgency}</span></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>);
  };

  // ── Tab 4: Board Report ─────────────────────────────────────────────────────
  const renderBoardReport=()=>{
    const qDelta=(seed)=>+(sr(seed)*8-4).toFixed(1);
    const activeAlerts=ALERTS.filter(a=>!a.resolved).length;
    const critAlerts=ALERTS.filter(a=>!a.resolved&&a.severity==='Critical').length;
    const avgComposite=+(COUNTRIES.reduce((s,c)=>s+c.compositeScore,0)/80).toFixed(1);
    const greenBondTotal=+(COUNTRIES.reduce((s,c)=>s+c.greenBondPct,0)/80).toFixed(1);
    const ngfsCount=COUNTRIES.filter(c=>c.ngfsCoverage).length;

    const sectionContent={
      'Executive Summary':{text:`Sovereign ESG portfolio covers 80 countries across ${REGIONS.length} regions. Composite score: ${avgComposite}/100 (${qDelta(301)>=0?'+':''}${qDelta(301)} QoQ). ${activeAlerts} active alerts, ${critAlerts} critical. Green sovereign bond allocation at ${greenBondTotal}%. NGFS coverage: ${ngfsCount}/80 central banks. Portfolio climate-adjusted yield spread of ${(COUNTRIES.reduce((s,c)=>s+c.conventionalYield-c.climateAdjYield,0)/80).toFixed(2)}% indicates systematic climate risk pricing gap.`,metrics:[{l:'Countries Monitored',v:80},{l:'Active Alerts',v:activeAlerts},{l:'Composite Score',v:avgComposite},{l:'NGFS Coverage',v:ngfsCount}]},
      'Sovereign Climate Risk Overview':{text:`Average sovereign climate risk score: ${(COUNTRIES.reduce((s,c)=>s+c.climateRisk,0)/80).toFixed(1)}/100. Physical risk dominates in Asia-Pacific (avg ${regionAgg['Asia-Pacific']?.avgClimate||'N/A'}), while transition risk concentrates in fossil-dependent economies. ${COUNTRIES.filter(c=>c.climateRisk>70).length} countries exceed high-risk threshold. Average carbon intensity across portfolio: ${(COUNTRIES.reduce((s,c)=>s+c.carbonIntensity,0)/80).toFixed(0)} tCO2/M$ GDP. NDC progress varies significantly: ${COUNTRIES.filter(c=>c.ndcProgress/Math.max(c.ndcTarget,1)>0.6).length} sovereigns on track.`,metrics:[{l:'Avg Climate Risk',v:(COUNTRIES.reduce((s,c)=>s+c.climateRisk,0)/80).toFixed(1)},{l:'High Risk Count',v:COUNTRIES.filter(c=>c.climateRisk>70).length},{l:'Avg Carbon Int.',v:(COUNTRIES.reduce((s,c)=>s+c.carbonIntensity,0)/80).toFixed(0)},{l:'QoQ Delta',v:qDelta(311)}]},
      'Debt Sustainability Analysis':{text:`Portfolio-weighted debt sustainability at ${(COUNTRIES.reduce((s,c)=>s+c.debtSustainability,0)/80).toFixed(1)}/100. ${COUNTRIES.filter(c=>c.debtToGDP>100).length} sovereigns with debt/GDP exceeding 100%. Average sovereign CDS spread: ${(COUNTRIES.reduce((s,c)=>s+c.sovereignCDS,0)/80).toFixed(0)} bps. FX reserve coverage averaging ${(COUNTRIES.reduce((s,c)=>s+c.fxReserveMonths,0)/80).toFixed(1)} months of imports. Fiscal climate gap analysis identifies ${COUNTRIES.filter(c=>c.fiscalSpace<20).length} sovereigns with limited adaptation funding capacity.`,metrics:[{l:'Avg Debt Sust.',v:(COUNTRIES.reduce((s,c)=>s+c.debtSustainability,0)/80).toFixed(1)},{l:'Debt/GDP > 100%',v:COUNTRIES.filter(c=>c.debtToGDP>100).length},{l:'Avg CDS Spread',v:(COUNTRIES.reduce((s,c)=>s+c.sovereignCDS,0)/80).toFixed(0)+' bps'},{l:'QoQ Delta',v:qDelta(321)}]},
      'Central Bank Policy Landscape':{text:`Central bank climate maturity averaging ${(COUNTRIES.reduce((s,c)=>s+c.cbMaturity,0)/80).toFixed(1)}/100. ${ngfsCount} of 80 central banks in NGFS network. Europe leads with highest average maturity. ${COUNTRIES.filter(c=>c.cbMaturity>70).length} central banks rated Advanced. Climate stress testing adopted by ${COUNTRIES.filter(c=>c.cbTools.includes('Climate Stress Test')).length} institutions. Green bond frameworks established in ${COUNTRIES.filter(c=>c.cbTools.includes('Green Bond Framework')).length} jurisdictions.`,metrics:[{l:'Avg CB Maturity',v:(COUNTRIES.reduce((s,c)=>s+c.cbMaturity,0)/80).toFixed(1)},{l:'NGFS Members',v:ngfsCount},{l:'Stress Test Adopted',v:COUNTRIES.filter(c=>c.cbTools.includes('Climate Stress Test')).length},{l:'Advanced CB',v:COUNTRIES.filter(c=>c.cbMaturity>70).length}]},
      'Nature Risk & Biodiversity Exposure':{text:`Average nature dependency at ${(COUNTRIES.reduce((s,c)=>s+c.natureDependencyGDP,0)/80).toFixed(1)}% of GDP. ${COUNTRIES.filter(c=>c.natureDependencyGDP>15).length} countries with high nature dependency. Water stress critical in ${COUNTRIES.filter(c=>c.waterStress>60).length} sovereigns. GBF compliance averaging ${(COUNTRIES.reduce((s,c)=>s+c.gbfCompliance,0)/80).toFixed(1)}/100. Biodiversity risk score: ${(COUNTRIES.reduce((s,c)=>s+c.biodiversityRisk,0)/80).toFixed(1)}/100. Forest cover ranges from ${Math.min(...COUNTRIES.map(c=>c.forestCoverPct)).toFixed(1)}% to ${Math.max(...COUNTRIES.map(c=>c.forestCoverPct)).toFixed(1)}%.`,metrics:[{l:'Avg Nature Dep',v:(COUNTRIES.reduce((s,c)=>s+c.natureDependencyGDP,0)/80).toFixed(1)+'%'},{l:'Water Stress Crit.',v:COUNTRIES.filter(c=>c.waterStress>60).length},{l:'Avg GBF',v:(COUNTRIES.reduce((s,c)=>s+c.gbfCompliance,0)/80).toFixed(1)},{l:'Avg Biodiversity',v:(COUNTRIES.reduce((s,c)=>s+c.biodiversityRisk,0)/80).toFixed(1)}]},
      'Social Performance & SDG Alignment':{text:`Social performance index at ${(COUNTRIES.reduce((s,c)=>s+c.socialIndex,0)/80).toFixed(1)}/100 (${qDelta(351)>=0?'+':''}${qDelta(351)} QoQ). SDG progress at ${(COUNTRIES.reduce((s,c)=>s+c.sdgProgress,0)/80).toFixed(1)}/100. ${COUNTRIES.filter(c=>c.giniCoeff>0.45).length} countries with high inequality (Gini > 0.45). Average HDI: ${(COUNTRIES.reduce((s,c)=>s+c.hdi,0)/80).toFixed(3)}. Youth unemployment averages ${(COUNTRIES.reduce((s,c)=>s+c.youthUnemplPct,0)/80).toFixed(1)}%. Gender gap index: ${(COUNTRIES.reduce((s,c)=>s+c.genderGapIdx,0)/80).toFixed(3)}.`,metrics:[{l:'Avg Social Index',v:(COUNTRIES.reduce((s,c)=>s+c.socialIndex,0)/80).toFixed(1)},{l:'Avg SDG',v:(COUNTRIES.reduce((s,c)=>s+c.sdgProgress,0)/80).toFixed(1)},{l:'High Inequality',v:COUNTRIES.filter(c=>c.giniCoeff>0.45).length},{l:'Avg HDI',v:(COUNTRIES.reduce((s,c)=>s+c.hdi,0)/80).toFixed(3)}]},
      'Bond Portfolio Climate Metrics':{text:`Climate-adjusted yield averaging ${(COUNTRIES.reduce((s,c)=>s+c.climateAdjYield,0)/80).toFixed(2)}% vs conventional ${(COUNTRIES.reduce((s,c)=>s+c.conventionalYield,0)/80).toFixed(2)}%. Nature-adjusted spread premium: ${(COUNTRIES.reduce((s,c)=>s+c.natureAdjSpread-c.spreadBps,0)/80).toFixed(0)} bps average. Social premium ranges from ${Math.min(...COUNTRIES.map(c=>c.socialPremium))} to ${Math.max(...COUNTRIES.map(c=>c.socialPremium))}%. Green sovereign bond average allocation: ${greenBondTotal}%. Recommended green bond increase: +2-3 percentage points to align with Paris trajectory.`,metrics:[{l:'Avg Clim-Adj Yield',v:(COUNTRIES.reduce((s,c)=>s+c.climateAdjYield,0)/80).toFixed(2)+'%'},{l:'Nature Spread',v:(COUNTRIES.reduce((s,c)=>s+c.natureAdjSpread-c.spreadBps,0)/80).toFixed(0)+' bps'},{l:'Green Bond Avg',v:greenBondTotal+'%'},{l:'Avg Spread',v:(COUNTRIES.reduce((s,c)=>s+c.spreadBps,0)/80).toFixed(0)+' bps'}]},
      'Recommendations & Outlook':{text:`Rebalancing required for ${critAlerts} critical exposures. Increase allocation to green sovereign bonds (+2-3% recommended). Monitor frontier market debt sustainability. Strengthen NGFS engagement for non-member central banks. Key watch: physical risk escalation in Asia-Pacific, transition risk in ME&A economies. Recommend quarterly sovereign ESG stress test incorporating NGFS Disorderly scenario. Enhance nature risk pricing methodology for sovereign spread models.`,metrics:[{l:'Critical Actions',v:critAlerts},{l:'Recommended Inc.',v:'+2-3%'},{l:'Watch Regions',v:'2'},{l:'Review Cycle',v:'Quarterly'}]},
    };

    return (<>
      {/* Controls */}
      <div style={{...S.flex,marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div style={S.flex}>
          <label style={{fontSize:11,color:T.textSec}}>From:</label>
          <input type="date" value={boardDateFrom} onChange={e=>setBoardDateFrom(e.target.value)} style={{...S.input,width:140}}/>
        </div>
        <div style={S.flex}>
          <label style={{fontSize:11,color:T.textSec}}>To:</label>
          <input type="date" value={boardDateTo} onChange={e=>setBoardDateTo(e.target.value)} style={{...S.input,width:140}}/>
        </div>
        <select style={S.select} value={boardAudience} onChange={e=>setBoardAudience(e.target.value)}>
          {AUDIENCES.map(a=>(<option key={a} value={a}>{a}</option>))}
        </select>
        <button style={S.btn(false)} onClick={handleExportCSV}>Export CSV</button>
        <button style={S.btn(false)} onClick={()=>window.print()}>Print Preview</button>
      </div>

      {/* Section toggles */}
      <div style={{...S.card,marginBottom:16}}>
        <div style={S.cardTitle}>Report Sections</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {BOARD_SECTIONS.map(s=>(<label key={s} style={{...S.flex,fontSize:12,cursor:'pointer',padding:'4px 8px',borderRadius:6,background:boardSections[s]?'rgba(27,58,92,0.08)':T.surfaceH}}>
            <input type="checkbox" checked={boardSections[s]} onChange={()=>toggleBoardSection(s)} style={{accentColor:T.navy}}/>
            {s}
          </label>))}
        </div>
      </div>

      {/* Audience + metadata badges */}
      <div style={{...S.flex,marginBottom:16,flexWrap:'wrap'}}>
        <span style={{...S.badge,background:'rgba(27,58,92,0.08)',color:T.navy}}>Audience: {boardAudience}</span>
        <span style={{...S.badge,background:'rgba(197,169,106,0.08)',color:T.gold}}>Period: {boardDateFrom} to {boardDateTo}</span>
        <span style={{...S.badge,background:'rgba(90,138,106,0.08)',color:T.sage}}>{BOARD_SECTIONS.filter(s=>boardSections[s]).length}/{BOARD_SECTIONS.length} sections</span>
        <span style={{...S.badge,background:'rgba(220,38,38,0.08)',color:T.red}}>{ALERTS.filter(a=>!a.resolved&&a.severity==='Critical').length} critical alerts</span>
      </div>

      {/* Report sections */}
      {BOARD_SECTIONS.filter(s=>boardSections[s]).map((section,idx)=>{
        const content=sectionContent[section];
        return (<div key={section} style={{...S.card,borderLeft:`3px solid ${CHART_COLORS[idx%CHART_COLORS.length]}`,marginBottom:14}}>
          <div style={{...S.cardTitle,fontSize:15}}>
            <span style={{fontFamily:T.mono,fontSize:12,color:T.textMut,minWidth:28}}>{String(idx+1).padStart(2,'0')}</span>
            {section}
          </div>
          <p style={{fontSize:12,color:T.textSec,lineHeight:1.7,margin:'0 0 12px 0'}}>{content.text}</p>

          {/* Quarterly delta metrics */}
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {content.metrics.map((m,mi)=>(<div key={mi} style={{background:T.surfaceH,borderRadius:6,padding:'8px 14px',minWidth:110}}>
              <div style={{fontSize:10,color:T.textMut}}>{m.l}</div>
              <div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{m.v}</div>
              {typeof m.v==='number'&&<div style={{fontSize:10,color:qDelta(idx*100+mi*10)>=0?T.green:T.red,fontFamily:T.mono}}>Q/Q: {qDelta(idx*100+mi*10)>=0?'+':''}{qDelta(idx*100+mi*10)}</div>}
            </div>))}
          </div>

          {/* Audience-specific annotations */}
          {boardAudience==='Regulator'&&section==='Executive Summary'&&<div style={{marginTop:10,padding:8,borderRadius:6,background:'rgba(220,38,38,0.05)',border:`1px solid rgba(220,38,38,0.15)`,fontSize:11,color:T.red}}>Regulatory Note: TCFD/TNFD alignment status and NGFS scenario coverage details available upon request. Compliance with SFDR Article 4 PAI indicators for sovereign exposures tracked separately.</div>}
          {boardAudience==='Sovereign Desk'&&section==='Bond Portfolio Climate Metrics'&&<div style={{marginTop:10,padding:8,borderRadius:6,background:'rgba(27,58,92,0.05)',border:`1px solid rgba(27,58,92,0.15)`,fontSize:11,color:T.navy}}>Desk Note: Climate-adjusted spreads incorporate NGFS Orderly Transition scenario. Nature-adjusted figures use TNFD LEAP methodology. Social premium calculated using UNDP HDI and World Bank Gini decomposition.</div>}
          {boardAudience==='IC'&&section==='Debt Sustainability Analysis'&&<div style={{marginTop:10,padding:8,borderRadius:6,background:'rgba(217,119,6,0.05)',border:`1px solid rgba(217,119,6,0.15)`,fontSize:11,color:T.amber}}>IC Note: Stress-tested debt sustainability projections under NGFS Disorderly scenario show {COUNTRIES.filter(c=>c.debtSustainability<35).length} additional sovereigns breaching sustainability thresholds by 2030.</div>}
          {boardAudience==='Board'&&section==='Recommendations & Outlook'&&<div style={{marginTop:10,padding:8,borderRadius:6,background:'rgba(90,138,106,0.05)',border:`1px solid rgba(90,138,106,0.15)`,fontSize:11,color:T.sage}}>Board Action: Approve revised sovereign ESG policy limits. Endorse increased green sovereign allocation. Schedule quarterly review of frontier market exposures.</div>}
        </div>);
      })}

      {/* Board-level trend visualization */}
      <div style={S.card}>
        <div style={S.cardTitle}>Quarterly Composite Score Trend by Region</div>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={Array.from({length:4},(_,qi)=>({quarter:['Q2 25','Q3 25','Q4 25','Q1 26'][qi],...REGIONS.reduce((acc,r,ri)=>{const rc=COUNTRIES.filter(c=>c.region===r);if(!rc.length) return acc;acc[r.substring(0,8)]=+(rc.reduce((s,c)=>s+c.compositeScore,0)/rc.length+sr(qi*271+ri*37)*5-2.5).toFixed(1);return acc;},{})}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} domain={['auto','auto']}/>
            <Tooltip contentStyle={{fontSize:10,fontFamily:T.font}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            {REGIONS.map((r,ri)=>(<Line key={r} type="monotone" dataKey={r.substring(0,8)} name={r} stroke={CHART_COLORS[ri]} strokeWidth={2} dot={{r:3}}/>))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Risk concentration heatmap for board */}
      <div style={S.card}>
        <div style={S.cardTitle}>Risk Concentration Summary</div>
        <div style={S.grid(5)}>
          {[
            {l:'High Climate Risk (>60)',v:COUNTRIES.filter(c=>c.climateRisk>60).length,c:T.red},
            {l:'Low Debt Sust. (<40)',v:COUNTRIES.filter(c=>c.debtSustainability<40).length,c:T.amber},
            {l:'CB Early Stage (<40)',v:COUNTRIES.filter(c=>c.cbMaturity<40).length,c:T.gold},
            {l:'High Nature Dep (>15%)',v:COUNTRIES.filter(c=>c.natureDependencyGDP>15).length,c:T.sage},
            {l:'Low Social (<40)',v:COUNTRIES.filter(c=>c.socialIndex<40).length,c:T.navyL},
          ].map((m,i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:10,textAlign:'center',borderTop:`3px solid ${m.c}`}}>
            <div style={{fontSize:24,fontWeight:700,color:m.c,fontFamily:T.mono}}>{m.v}</div>
            <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{m.l}</div>
          </div>))}
        </div>
      </div>

      {/* Appendix: Full alert log */}
      <div style={S.card}>
        <div style={S.cardTitle}>Appendix: Alert Log ({boardDateFrom} to {boardDateTo})</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>#</th><th style={S.th}>Severity</th><th style={S.th}>Country</th><th style={S.th}>Type</th><th style={S.th}>Module</th><th style={S.th}>Impact</th><th style={S.th}>Date</th><th style={S.th}>Status</th></tr></thead>
          <tbody>{ALERTS.map((a,i)=>(<tr key={a.id}>
            <td style={{...S.td,fontFamily:T.mono}}>{String(i+1).padStart(2,'0')}</td>
            <td style={S.td}><span style={S.pill(sevColor(a.severity))}>{a.severity}</span></td>
            <td style={S.td}>{a.country} ({a.iso})</td>
            <td style={S.td}>{a.type}</td>
            <td style={S.td}>{a.module}</td>
            <td style={{...S.td,fontFamily:T.mono}}>{a.impact}x</td>
            <td style={{...S.td,fontFamily:T.mono}}>{a.triggered}</td>
            <td style={S.td}><span style={S.pill(a.resolved?T.green:T.amber)}>{a.resolved?'Resolved':'Open'}</span></td>
          </tr>))}</tbody>
        </table>
      </div>

      {/* Regional summary for board */}
      <div style={S.card}>
        <div style={S.cardTitle}>Regional Summary</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Region</th><th style={S.th}>Countries</th><th style={S.th}>Avg Climate</th><th style={S.th}>Avg Debt</th><th style={S.th}>Avg CB</th><th style={S.th}>Avg Social</th><th style={S.th}>Avg Spread</th><th style={S.th}>Green Bond</th></tr></thead>
          <tbody>{REGIONS.map(r=>{const agg=regionAgg[r];if(!agg) return null;return (<tr key={r}><td style={{...S.td,fontWeight:600}}>{r}</td><td style={{...S.td,fontFamily:T.mono}}>{agg.count}</td><td style={{...S.td,...S.heatCell(agg.avgClimate,100)}}>{agg.avgClimate}</td><td style={{...S.td,...S.heatCell(100-agg.avgDebt,100)}}>{agg.avgDebt}</td><td style={S.td}>{agg.avgCB}</td><td style={S.td}>{agg.avgSocial}</td><td style={{...S.td,fontFamily:T.mono}}>{agg.avgSpread} bps</td><td style={S.td}>{agg.avgGreen}%</td></tr>);})}</tbody>
        </table>
      </div>

      {/* Methodology note */}
      <div style={{...S.card,background:T.surfaceH}}>
        <div style={{...S.cardTitle,fontSize:12}}>Methodology & Data Sources</div>
        <div style={{fontSize:11,color:T.textSec,lineHeight:1.7}}>
          Climate risk scores derived from NGFS scenarios (Orderly Transition, Disorderly, Hot House) with physical and transition risk decomposition. Debt sustainability uses IMF/World Bank DSA framework with climate overlay. Central bank maturity scored against NGFS membership, climate stress test adoption, green bond framework, and disclosure requirements. Nature dependency uses ENCORE/TNFD LEAP methodology with IBAT biodiversity overlays. Social index combines UNDP HDI, World Bank Gini coefficient, ILO youth unemployment, WEF Gender Gap Index, and SDG Tracker progress scores. Green bond data from Climate Bonds Initiative sovereign tracker. All scores normalized to 0-100 scale with quarterly recalibration. Sovereign CDS data from Bloomberg and Refinitiv.
        </div>
      </div>

      {/* Disclosure & signoff */}
      <div style={{...S.card,background:T.surfaceH,borderLeft:`3px solid ${T.gold}`}}>
        <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>
          Report generated: {new Date().toISOString().slice(0,10)} | Classification: {boardAudience==='Board'?'Board Confidential':boardAudience==='Regulator'?'Regulatory Submission':'Internal Use Only'} | Prepared by: Sovereign ESG Intelligence Hub (EP-AQ6) | Data vintage: Q1 2026
        </div>
      </div>
    </>);
  };

  // ── Main Render ─────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Sovereign ESG Intelligence Hub</h1>
          <div style={S.subtitle}>EP-AQ6 | 80 countries | 12 KPIs | 5 sub-modules aggregated | {new Date().toISOString().slice(0,10)}</div>
        </div>
        <div style={S.flex}>
          <span style={{...S.badge,background:'rgba(22,163,74,0.1)',color:T.green}}>LIVE</span>
          <span style={{...S.badge,background:'rgba(27,58,92,0.08)',color:T.navy}}>Sprint AQ</span>
          <button style={S.btn(false)} onClick={handleExportCSV}>Export All</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={S.tabs}>
        {TABS.map((t,i)=>(<button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}
      </div>

      {tab===0&&renderExecutiveDashboard()}
      {tab===1&&renderCountryComparison()}
      {tab===2&&renderBondPortfolio()}
      {tab===3&&renderBoardReport()}
    </div>
  );
}
