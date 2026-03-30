import React, { useState, useMemo, useCallback } from 'react';
import { EMISSION_FACTORS, GWP_VALUES, GRID_INTENSITY, SECTOR_BENCHMARKS, CARBON_PRICES, NGFS_SCENARIOS, TEMPERATURE_PATHWAYS, getGridIntensity, getSectorBenchmark, getNGFSScenario } from '../../../data/referenceData';
import { SECURITY_UNIVERSE, MOCK_PORTFOLIO } from '../../../data/securityUniverse';

/* ═══════════════════════════════════════════════════════════════════════════════
 * Integrated Carbon Emissions Module — Master Control Room
 * Aggregates all carbon/emissions data across 12 source modules into one view.
 * 2,500+ lines | 8 tabs | 30+ useState hooks
 * ═══════════════════════════════════════════════════════════════════════════════ */

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const pick=(arr,seed)=>arr[Math.floor(sr(seed)*arr.length)];
const range=(min,max,seed)=>+(min+sr(seed)*(max-min)).toFixed(2);
const rangeInt=(min,max,seed)=>Math.floor(min+sr(seed)*(max-min+1));
const fmt=(n)=>{if(n==null)return'--';if(Math.abs(n)>=1e9)return(n/1e9).toFixed(1)+'B';if(Math.abs(n)>=1e6)return(n/1e6).toFixed(1)+'M';if(Math.abs(n)>=1e3)return(n/1e3).toFixed(1)+'K';return typeof n==='number'?n.toFixed(1):n;};
const fmtPct=(n)=>n!=null?(n>=0?'+':'')+n.toFixed(1)+'%':'--';
const fmtCO2=(n)=>{if(n==null)return'--';if(Math.abs(n)>=1e9)return(n/1e9).toFixed(2)+' GtCO2e';if(Math.abs(n)>=1e6)return(n/1e6).toFixed(2)+' MtCO2e';if(Math.abs(n)>=1e3)return(n/1e3).toFixed(1)+' ktCO2e';return n.toFixed(0)+' tCO2e';};

const TABS=['Consolidated Dashboard','Scope Waterfall','Portfolio Carbon Analytics','Regulatory Mapping','Carbon Pricing & Cost','Pathway & Budget','Data Quality & Lineage','Report Generator & Export'];

/* ─── Pre-compute portfolio emissions data ─────────────────────────────────── */
function buildPortfolioEmissions(){
  const holdings=MOCK_PORTFOLIO.holdings||[];
  const equities=SECURITY_UNIVERSE.filter(s=>s.assetType==='Equity');
  const eqMap={};equities.forEach(e=>{eqMap[e.id]=e;});
  const rows=[];
  holdings.slice(0,150).forEach((h,i)=>{
    const sec=eqMap[h.securityId];
    if(!sec)return;
    const seed=i*13+5000;
    const s1=sec.scope1||Math.round(range(1000,5e6,seed));
    const s2=sec.scope2||Math.round(range(500,2e6,seed+1));
    const s3=sec.scope3||Math.round(range(5000,50e6,seed+2));
    const total=s1+s2+s3;
    const weight=h.weightPct||range(0.1,3.5,seed+3);
    const mktVal=h.marketValueMn||range(10,1500,seed+4);
    const intensity=sec.carbonIntensity||+(total/(Math.max(sec.revenueBn||1,0.01)*1e6)*1e6).toFixed(1);
    const waci_contrib=+(weight/100*intensity).toFixed(2);
    const temp=sec.temperatureScore||range(1.3,3.8,seed+5);
    const sbti=sec.sbtiStatus||pick(['Committed','Target Set \u2014 1.5\u00B0C','Target Set \u2014 WB2C','None'],seed+6);
    const dqs=rangeInt(1,5,seed+7);
    const country=sec.country||'US';
    const sector=sec.sector||'Industrials';
    const financedEm=Math.round(total*(weight/100));
    const carbonCostEU=+(financedEm*65.2/1000).toFixed(1);
    const greenRev=sec.greenRevenuePct||range(0,60,seed+8);
    const yoyReduction=range(-15,8,seed+9);
    rows.push({
      id:sec.id,ticker:sec.ticker||h.ticker,name:sec.name||h.name,sector,country,
      weight,mktVal,s1,s2,s3,total,intensity,waci_contrib,temp,sbti,dqs,
      financedEm,carbonCostEU,greenRev,yoyReduction,
      msciRating:sec.msciRating||'BBB',cdpScore:sec.cdpScore||'B',
      netZeroYear:sec.netZeroYear||2050,
      scope2Market:Math.round(s2*range(0.6,1.1,seed+10)),
      quarterlyTrend:Array.from({length:12},(_,q)=>Math.round(total*(1+range(-0.15,0.05,seed+100+q)))),
    });
  });
  return rows;
}

/* ─── Reusable components ──────────────────────────────────────────────────── */
function KPICard({label,value,sub,color,trend,icon}){
  return(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'14px 16px',display:'flex',flexDirection:'column',gap:4,minWidth:0}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</span>
        {icon&&<span style={{fontSize:14}}>{icon}</span>}
      </div>
      <div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:color||T.navy,lineHeight:1.1}}>{value}</div>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        {trend!=null&&<span style={{fontFamily:T.mono,fontSize:11,color:trend>=0?T.green:T.red,fontWeight:600}}>{trend>=0?'\u25B2':'\u25BC'}{Math.abs(trend).toFixed(1)}%</span>}
        {sub&&<span style={{fontSize:11,color:T.textSec}}>{sub}</span>}
      </div>
    </div>
  );
}

function Badge({text,color}){
  const bg=color===T.green?'#dcfce7':color===T.amber?'#fef3c7':color===T.red?'#fee2e2':T.surfaceH;
  return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontFamily:T.mono,fontWeight:600,color:color||T.textSec,background:bg}}>{text}</span>;
}

function Panel({title,children,actions}){
  return(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,overflow:'hidden',marginBottom:16}}>
      {title&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:`1px solid ${T.border}`,background:T.surfaceH}}>
        <span style={{fontFamily:T.font,fontSize:13,fontWeight:600,color:T.navy}}>{title}</span>
        {actions&&<div style={{display:'flex',gap:8}}>{actions}</div>}
      </div>}
      <div style={{padding:16}}>{children}</div>
    </div>
  );
}

function DQSBadge({score}){
  const color=score<=2?T.green:score===3?T.amber:T.red;
  return <Badge text={`DQS ${score}`} color={color}/>;
}

function AlertCard({severity,title,message,time}){
  const color=severity==='critical'?T.red:severity==='warning'?T.amber:T.green;
  return(
    <div style={{padding:'10px 14px',borderLeft:`3px solid ${color}`,background:T.surface,borderRadius:'0 6px 6px 0',marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:600,color}}>{title}</span>
        <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{time}</span>
      </div>
      <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{message}</div>
    </div>
  );
}

function ScopeBar({s1,s2,s3,width}){
  const tot=s1+s2+s3;if(!tot)return null;
  const w1=(s1/tot*100),w2=(s2/tot*100),w3=(s3/tot*100);
  return(
    <div style={{display:'flex',height:8,borderRadius:4,overflow:'hidden',width:width||'100%',background:T.surfaceH}}>
      <div style={{width:`${w1}%`,background:T.navy}} title={`Scope 1: ${fmt(s1)}`}/>
      <div style={{width:`${w2}%`,background:T.gold}} title={`Scope 2: ${fmt(s2)}`}/>
      <div style={{width:`${w3}%`,background:T.sage}} title={`Scope 3: ${fmt(s3)}`}/>
    </div>
  );
}

function BarChart({data,maxVal,color,label,height}){
  const mx=maxVal||Math.max(...data.map(d=>d.value),1);
  return(
    <div style={{display:'flex',flexDirection:'column',gap:4}}>
      {label&&<div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:4}}>{label}</div>}
      <div style={{display:'flex',alignItems:'flex-end',gap:2,height:height||120}}>
        {data.map((d,i)=>(
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:'100%'}}>
            <div style={{width:'100%',background:d.color||color||T.navy,borderRadius:'3px 3px 0 0',height:`${(d.value/mx)*100}%`,minHeight:d.value>0?2:0,transition:'height 0.3s'}} title={`${d.label}: ${fmt(d.value)}`}/>
            {d.label&&<div style={{fontSize:8,fontFamily:T.mono,color:T.textMut,marginTop:2,textAlign:'center',overflow:'hidden',whiteSpace:'nowrap',maxWidth:40}}>{d.label}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterBar({filters,activeFilters,onToggle}){
  return(
    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
      {filters.map(f=>(
        <button key={f.key} onClick={()=>onToggle(f.key)} style={{padding:'4px 10px',borderRadius:4,fontSize:11,fontFamily:T.mono,border:`1px solid ${activeFilters.includes(f.key)?T.gold:T.border}`,background:activeFilters.includes(f.key)?T.goldL+'30':T.surface,color:activeFilters.includes(f.key)?T.navy:T.textSec,cursor:'pointer',fontWeight:activeFilters.includes(f.key)?600:400}}>{f.label}</button>
      ))}
    </div>
  );
}

function Btn({children,onClick,primary,small,disabled}){
  return(
    <button onClick={onClick} disabled={disabled} style={{padding:small?'4px 10px':'8px 16px',borderRadius:6,fontSize:small?11:12,fontFamily:T.font,fontWeight:600,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.navy,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1}}>{children}</button>
  );
}

function TabBar({tabs,active,onChange}){
  return(
    <div style={{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:20,overflowX:'auto'}}>
      {tabs.map((t,i)=>(
        <button key={i} onClick={()=>onChange(i)} style={{padding:'10px 18px',fontSize:12,fontFamily:T.font,fontWeight:active===i?700:400,color:active===i?T.navy:T.textSec,background:'transparent',border:'none',borderBottom:active===i?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',whiteSpace:'nowrap',marginBottom:-2}}>{t}</button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */
export default function IntegratedCarbonEmissionsPage(){
  // ── Tab state ──
  const [activeTab,setActiveTab]=useState(0);

  // ── Tab 1: Dashboard state ──
  const [dashPeriod,setDashPeriod]=useState('YTD');
  const [dashAudience,setDashAudience]=useState('Technical');

  // ── Tab 2: Waterfall state ──
  const [waterfallYear,setWaterfallYear]=useState('2025');
  const [waterfallCompare,setWaterfallCompare]=useState(false);
  const [waterfallDrill,setWaterfallDrill]=useState(null);

  // ── Tab 3: Portfolio state ──
  const [portSort,setPortSort]=useState('total');
  const [portSortDir,setPortSortDir]=useState('desc');
  const [portPage,setPortPage]=useState(0);
  const [portSectorFilter,setPortSectorFilter]=useState('All');
  const [portCountryFilter,setPortCountryFilter]=useState('All');
  const [portSbtiFilter,setPortSbtiFilter]=useState('All');
  const [portTempRange,setPortTempRange]=useState([0,5]);
  const [portSelected,setPortSelected]=useState([]);
  const [portDetailId,setPortDetailId]=useState(null);

  // ── Tab 4: Regulatory state ──
  const [regFramework,setRegFramework]=useState('All');
  const [regDetailCell,setRegDetailCell]=useState(null);

  // ── Tab 5: Carbon pricing state ──
  const [priceScenario,setPriceScenario]=useState('EU_ETS');
  const [customPrice,setCustomPrice]=useState(100);
  const [ngfsSelected,setNgfsSelected]=useState('net_zero_2050');

  // ── Tab 6: Pathway state ──
  const [pathwayBudget,setPathwayBudget]=useState('1.5C_50pct');
  const [pathwayView,setPathwayView]=useState('trajectory');

  // ── Tab 7: DQ state ──
  const [dqScope,setDqScope]=useState('All');
  const [dqSort,setDqSort]=useState('dqs');

  // ── Tab 8: Report state ──
  const [rptTemplate,setRptTemplate]=useState('GHG Inventory');
  const [rptDateRange,setRptDateRange]=useState('FY2024');
  const [rptScope,setRptScope]=useState('Full portfolio');
  const [rptDetail,setRptDetail]=useState('Standard');
  const [rptFormat,setRptFormat]=useState('PDF-ready');
  const [rptInclude,setRptInclude]=useState(['charts','tables','methodology','lineage']);

  // ── Pre-compute data ──
  const portfolioData=useMemo(()=>buildPortfolioEmissions(),[]);

  const aggTotals=useMemo(()=>{
    const d=portfolioData;
    const totalS1=d.reduce((a,r)=>a+r.s1,0);
    const totalS2=d.reduce((a,r)=>a+r.s2,0);
    const totalS2Market=d.reduce((a,r)=>a+r.scope2Market,0);
    const totalS3=d.reduce((a,r)=>a+r.s3,0);
    const totalGHG=totalS1+totalS2+totalS3;
    const totalWeight=d.reduce((a,r)=>a+r.weight,0);
    const totalMktVal=d.reduce((a,r)=>a+r.mktVal,0);
    const waci=d.reduce((a,r)=>a+r.waci_contrib,0);
    const avgTemp=d.reduce((a,r)=>a+r.temp*r.weight,0)/Math.max(totalWeight,1);
    const sbtiOnTrack=d.filter(r=>r.sbti.includes('Target Set')||r.sbti==='Committed').length;
    const sbtiPct=+(sbtiOnTrack/d.length*100).toFixed(1);
    const financedTotal=d.reduce((a,r)=>a+r.financedEm,0);
    const avoidedEm=Math.round(totalGHG*0.08);
    const netImpact=totalGHG-avoidedEm;
    const carbonIntensity=+(totalGHG/(totalMktVal*1e6)*1e6).toFixed(1);
    const carbonFootprint=+(financedTotal/(totalMktVal)).toFixed(2);
    const avgGreenRev=+(d.reduce((a,r)=>a+r.greenRev,0)/d.length).toFixed(1);
    const avgYoY=+(d.reduce((a,r)=>a+r.yoyReduction,0)/d.length).toFixed(1);
    const budgetUsedPct=+(financedTotal/((TEMPERATURE_PATHWAYS.budgets_GtCO2['1.5C_50pct']*1e9)*0.00001)*100).toFixed(2);
    const budgetRemaining=+(100-budgetUsedPct).toFixed(2);
    return{totalS1,totalS2,totalS2Market,totalS3,totalGHG,waci,avgTemp,sbtiPct,financedTotal,avoidedEm,netImpact,carbonIntensity,carbonFootprint,avgGreenRev,avgYoY,budgetRemaining,totalMktVal};
  },[portfolioData]);

  // Sector aggregation
  const sectorAgg=useMemo(()=>{
    const m={};
    portfolioData.forEach(r=>{
      if(!m[r.sector])m[r.sector]={sector:r.sector,s1:0,s2:0,s3:0,total:0,count:0,weight:0,avgTemp:0};
      m[r.sector].s1+=r.s1;m[r.sector].s2+=r.s2;m[r.sector].s3+=r.s3;m[r.sector].total+=r.total;
      m[r.sector].count++;m[r.sector].weight+=r.weight;m[r.sector].avgTemp+=r.temp;
    });
    Object.values(m).forEach(v=>{v.avgTemp=+(v.avgTemp/v.count).toFixed(2);});
    return Object.values(m).sort((a,b)=>b.total-a.total);
  },[portfolioData]);

  // Country aggregation
  const countryAgg=useMemo(()=>{
    const m={};
    portfolioData.forEach(r=>{
      if(!m[r.country])m[r.country]={country:r.country,total:0,count:0};
      m[r.country].total+=r.total;m[r.country].count++;
    });
    return Object.values(m).sort((a,b)=>b.total-a.total);
  },[portfolioData]);

  // ── Quarterly trend aggregation (12 quarters) ──
  const quarterlyTrend=useMemo(()=>{
    return Array.from({length:12},(_,q)=>{
      const qS1=portfolioData.reduce((a,r)=>a+Math.round(r.s1*(1+range(-0.12,0.03,q*7+100))),0);
      const qS2=portfolioData.reduce((a,r)=>a+Math.round(r.s2*(1+range(-0.10,0.04,q*7+200))),0);
      const qS3=portfolioData.reduce((a,r)=>a+Math.round(r.s3*(1+range(-0.08,0.05,q*7+300))),0);
      return{quarter:`Q${(q%4)+1} ${2023+Math.floor(q/4)}`,s1:qS1,s2:qS2,s3:qS3,total:qS1+qS2+qS3};
    });
  },[portfolioData]);

  // ── Alerts ──
  const alerts=useMemo(()=>[
    {severity:'critical',title:'SBTi Target Off-Track',message:'Portfolio absolute emissions +2.3% vs -4.2% annual target. 7 holdings exceeded sector pathway.',time:'2h ago'},
    {severity:'critical',title:'CBAM Reporting Deadline',message:'EU CBAM transitional period Phase 3 report due 31 Jan 2026. 12 holdings with CBAM exposure not yet assessed.',time:'3h ago'},
    {severity:'warning',title:'DQS Deterioration',message:'Average data quality score degraded from 2.4 to 2.8 after Q3 data refresh. 18 holdings downgraded to estimated data.',time:'5h ago'},
    {severity:'warning',title:'Scope 3 Coverage Gap',message:'Category 15 (investments) coverage dropped to 42%. 23 financial holdings missing financed emissions data.',time:'6h ago'},
    {severity:'warning',title:'Temperature Overshoot',message:'Portfolio implied temperature 2.4\u00B0C exceeds 1.5\u00B0C Paris target. Energy sector contributing 0.6\u00B0C overshoot.',time:'8h ago'},
    {severity:'warning',title:'Carbon Price Surge',message:'EU ETS price rose 12% to \u20AC73/tCO2e this month. Portfolio carbon cost exposure increased by $4.2M annually.',time:'12h ago'},
    {severity:'info',title:'CSRD E1 Data Ready',message:'All mandatory ESRS E1 datapoints populated for 89% of portfolio. 16 holdings pending Scope 3 verification.',time:'1d ago'},
    {severity:'info',title:'CDP Submission Window',message:'CDP Climate Change 2026 questionnaire opens 1 Apr. Pre-populated responses available for review.',time:'1d ago'},
    {severity:'info',title:'Engagement Update',message:'Shell plc responded to climate engagement letter. Committed to update methane reduction targets by Q2 2026.',time:'2d ago'},
    {severity:'info',title:'Assurance Progress',message:'ISAE 3410 limited assurance completed for Scope 1 & 2. Scope 3 reasonable assurance scheduled for Q2.',time:'3d ago'},
  ],[]);

  // ── Regulatory mapping data ──
  const regMapping=useMemo(()=>[
    {dataPoint:'Scope 1 (Direct)',ghgProtocol:'Chapter 4',csrd:'E1-6 DR 01',sfdr:'PAI #1 (i)',tcfd:'Metrics & Targets',cdp:'C6.1',sec:'Item 1500',ukSdr:'Core metric',value:fmtCO2(aggTotals.totalS1),dqs:2},
    {dataPoint:'Scope 2 (Location)',ghgProtocol:'Scope 2 Guidance',csrd:'E1-6 DR 02',sfdr:'PAI #1 (ii)',tcfd:'Metrics & Targets',cdp:'C6.3',sec:'Item 1500',ukSdr:'Core metric',value:fmtCO2(aggTotals.totalS2),dqs:2},
    {dataPoint:'Scope 2 (Market)',ghgProtocol:'Scope 2 Guidance',csrd:'E1-6 DR 03',sfdr:'PAI #1 (ii)',tcfd:'Metrics & Targets',cdp:'C6.3',sec:'Item 1500',ukSdr:'Core metric',value:fmtCO2(aggTotals.totalS2Market),dqs:2},
    {dataPoint:'Scope 3 (Total)',ghgProtocol:'Scope 3 Standard',csrd:'E1-6 DR 04',sfdr:'PAI #1 (iii)',tcfd:'Metrics & Targets',cdp:'C6.5',sec:'Item 1504',ukSdr:'Enhanced',value:fmtCO2(aggTotals.totalS3),dqs:3},
    {dataPoint:'Total GHG',ghgProtocol:'Ch 4+Scope 2+3',csrd:'E1-6 (aggregate)',sfdr:'PAI #1 (total)',tcfd:'Metrics & Targets',cdp:'C6.1-C6.5',sec:'Item 1500-1504',ukSdr:'Core metric',value:fmtCO2(aggTotals.totalGHG),dqs:3},
    {dataPoint:'Carbon Intensity',ghgProtocol:'Chapter 8',csrd:'E1-7',sfdr:'PAI #3',tcfd:'Metrics',cdp:'C6.10',sec:'Item 1502',ukSdr:'Core metric',value:aggTotals.carbonIntensity+' tCO2e/$M',dqs:2},
    {dataPoint:'WACI',ghgProtocol:'\u2014',csrd:'E1-7 (portfolio)',sfdr:'PAI #2',tcfd:'Metrics & Targets',cdp:'\u2014',sec:'Item 1502',ukSdr:'Core metric',value:aggTotals.waci.toFixed(1)+' tCO2e/$M',dqs:2},
    {dataPoint:'Financed Emissions',ghgProtocol:'Cat 15',csrd:'E1-6 DR 05',sfdr:'PAI #1 (financed)',tcfd:'Metrics',cdp:'C-FS14.1',sec:'\u2014',ukSdr:'Enhanced',value:fmtCO2(aggTotals.financedTotal),dqs:3},
    {dataPoint:'Avoided Emissions',ghgProtocol:'\u2014',csrd:'E1-8',sfdr:'\u2014',tcfd:'Opportunities',cdp:'C-CO2.2a',sec:'\u2014',ukSdr:'\u2014',value:fmtCO2(aggTotals.avoidedEm),dqs:4},
    {dataPoint:'Temperature Score',ghgProtocol:'\u2014',csrd:'E1-9',sfdr:'\u2014',tcfd:'Strategy',cdp:'C12.3',sec:'\u2014',ukSdr:'Core metric',value:aggTotals.avgTemp.toFixed(1)+'\u00B0C',dqs:3},
    {dataPoint:'SBTi Alignment',ghgProtocol:'\u2014',csrd:'E1-4',sfdr:'\u2014',tcfd:'Strategy',cdp:'C4.1',sec:'Item 1501',ukSdr:'Required',value:aggTotals.sbtiPct+'%',dqs:1},
    {dataPoint:'Net Zero Target',ghgProtocol:'\u2014',csrd:'E1-4 (b)',sfdr:'\u2014',tcfd:'Strategy',cdp:'C4.2',sec:'Item 1501',ukSdr:'Required',value:'2050',dqs:1},
    {dataPoint:'Carbon Budget Remaining',ghgProtocol:'\u2014',csrd:'E1-5',sfdr:'\u2014',tcfd:'Strategy',cdp:'C12.1',sec:'\u2014',ukSdr:'Enhanced',value:aggTotals.budgetRemaining+'%',dqs:3},
    {dataPoint:'Fossil Fuel Exposure',ghgProtocol:'\u2014',csrd:'E1-10',sfdr:'PAI #4',tcfd:'Metrics',cdp:'C-OG1.5',sec:'Item 1503',ukSdr:'Core metric',value:'14.2%',dqs:1},
    {dataPoint:'Energy Consumption',ghgProtocol:'Ch 4 (energy)',csrd:'E1-5 DR 01',sfdr:'\u2014',tcfd:'Metrics',cdp:'C8.2a',sec:'\u2014',ukSdr:'\u2014',value:'12.4 TWh',dqs:2},
    {dataPoint:'Renewable Energy %',ghgProtocol:'\u2014',csrd:'E1-5 DR 02',sfdr:'\u2014',tcfd:'Metrics',cdp:'C8.2d',sec:'\u2014',ukSdr:'\u2014',value:'34.6%',dqs:2},
    {dataPoint:'Green Revenue',ghgProtocol:'\u2014',csrd:'E1-9 (revenue)',sfdr:'Art 9 (taxonomy)',tcfd:'Opportunities',cdp:'C-CO2.4',sec:'\u2014',ukSdr:'Core metric',value:aggTotals.avgGreenRev.toFixed(1)+'%',dqs:2},
    {dataPoint:'Carbon Removal',ghgProtocol:'\u2014',csrd:'E1-8 (removal)',sfdr:'\u2014',tcfd:'Opportunities',cdp:'C4.3b',sec:'\u2014',ukSdr:'\u2014',value:'12,400 tCO2e',dqs:4},
    {dataPoint:'Internal Carbon Price',ghgProtocol:'\u2014',csrd:'E1-3 (c)',sfdr:'\u2014',tcfd:'Risk Mgmt',cdp:'C11.3',sec:'\u2014',ukSdr:'\u2014',value:'$85/tCO2e',dqs:1},
    {dataPoint:'Methane Emissions',ghgProtocol:'Ch 4 (CH4)',csrd:'E1-6 DR 06',sfdr:'\u2014',tcfd:'Metrics',cdp:'C7.1b',sec:'Item 1500',ukSdr:'\u2014',value:'245 ktCH4',dqs:3},
  ],[aggTotals]);

  // ── Filtered portfolio ──
  const filteredPortfolio=useMemo(()=>{
    let d=[...portfolioData];
    if(portSectorFilter!=='All')d=d.filter(r=>r.sector===portSectorFilter);
    if(portCountryFilter!=='All')d=d.filter(r=>r.country===portCountryFilter);
    if(portSbtiFilter!=='All')d=d.filter(r=>r.sbti===portSbtiFilter);
    d=d.filter(r=>r.temp>=portTempRange[0]&&r.temp<=portTempRange[1]);
    d.sort((a,b)=>{
      const mul=portSortDir==='desc'?-1:1;
      return mul*((a[portSort]||0)-(b[portSort]||0));
    });
    return d;
  },[portfolioData,portSectorFilter,portCountryFilter,portSbtiFilter,portTempRange,portSort,portSortDir]);

  const sectors=[...new Set(portfolioData.map(r=>r.sector))].sort();
  const countries=[...new Set(portfolioData.map(r=>r.country))].sort();
  const sbtiStatuses=[...new Set(portfolioData.map(r=>r.sbti))].sort();
  const PAGE_SIZE=25;
  const totalPages=Math.ceil(filteredPortfolio.length/PAGE_SIZE);
  const pagedPortfolio=filteredPortfolio.slice(portPage*PAGE_SIZE,(portPage+1)*PAGE_SIZE);

  // ── Carbon pricing scenarios ──
  const pricingData=useMemo(()=>{
    const scenarioPrice=priceScenario==='custom'?customPrice:
      priceScenario==='EU_ETS'?CARBON_PRICES.compliance.EU_ETS.price:
      priceScenario==='UK_ETS'?CARBON_PRICES.compliance.UK_ETS.price:
      priceScenario==='NGFS_NZ'?CARBON_PRICES.ngfs_2030.net_zero_2050:
      priceScenario==='RGGI'?CARBON_PRICES.compliance.RGGI.price:
      CARBON_PRICES.compliance.California.price;
    const holdings=portfolioData.map(r=>{
      const cost=+(r.financedEm*scenarioPrice/1000).toFixed(1);
      const ebitda=r.mktVal*range(0.08,0.25,r.s1%10000);
      const costPctEbitda=+(cost/(ebitda*1000)*100).toFixed(2);
      return{...r,carbonCost:cost,ebitda,costPctEbitda};
    }).sort((a,b)=>b.carbonCost-a.carbonCost);
    const totalCost=holdings.reduce((a,r)=>a+r.carbonCost,0);
    return{holdings,totalCost,scenarioPrice};
  },[portfolioData,priceScenario,customPrice]);

  // ── Pathway data ──
  const pathwayData=useMemo(()=>{
    const budget=TEMPERATURE_PATHWAYS.budgets_GtCO2[pathwayBudget]||500;
    const annualGlobal=TEMPERATURE_PATHWAYS.annual_global_emissions_2023_GtCO2;
    const yearsRemaining=Math.round(budget/annualGlobal);
    const exhaustionYear=2023+yearsRemaining;
    const portfolioShare=aggTotals.totalMktVal/(80e6);
    const portfolioBudget=+(budget*portfolioShare).toFixed(4);
    const portfolioAnnual=+(aggTotals.totalGHG/1e9).toFixed(6);
    const portfolioYearsLeft=portfolioBudget>0?Math.round(portfolioBudget/portfolioAnnual):999;
    const reductionNeeded=+((1-portfolioBudget/(portfolioAnnual*(2050-2025)))*100).toFixed(1);
    return{budget,annualGlobal,yearsRemaining,exhaustionYear,portfolioShare,portfolioBudget,portfolioAnnual,portfolioYearsLeft,reductionNeeded};
  },[pathwayBudget,aggTotals]);

  // ── DQ data ──
  const dqData=useMemo(()=>{
    let d=[...portfolioData];
    if(dqScope!=='All'){
      const scopeNum=parseInt(dqScope);
      d=d.filter(r=>r.dqs===scopeNum);
    }
    if(dqSort==='dqs')d.sort((a,b)=>b.dqs-a.dqs);
    else if(dqSort==='total')d.sort((a,b)=>b.total-a.total);
    const hist=[0,0,0,0,0];d.forEach(r=>hist[r.dqs-1]++);
    const avgDqs=+(d.reduce((a,r)=>a+r.dqs,0)/d.length).toFixed(1);
    const bySource={CDP:Math.round(d.length*0.35),AnnualReport:Math.round(d.length*0.25),Estimated:Math.round(d.length*0.22),Proxy:Math.round(d.length*0.18)};
    return{holdings:d,hist,avgDqs,bySource};
  },[portfolioData,dqScope,dqSort]);

  // Detail panel for portfolio
  const detailHolding=portDetailId?portfolioData.find(r=>r.id===portDetailId):null;

  /* ═══════════════════════════════════════════════════════════════════════════
   * TAB RENDERERS
   * ═══════════════════════════════════════════════════════════════════════════ */

  // ── TAB 1: Consolidated Dashboard ──
  const renderDashboard=()=>(
    <div>
      {/* Period selector & audience toggle */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',gap:4}}>
          {['Q4 2025','YTD','1Y','3Y','Base Year'].map(p=>(
            <button key={p} onClick={()=>setDashPeriod(p)} style={{padding:'5px 12px',borderRadius:4,fontSize:11,fontFamily:T.mono,border:`1px solid ${dashPeriod===p?T.gold:T.border}`,background:dashPeriod===p?T.gold+'20':T.surface,color:T.navy,cursor:'pointer',fontWeight:dashPeriod===p?700:400}}>{p}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:4}}>
          {['Board Pack','Technical','Regulator'].map(a=>(
            <button key={a} onClick={()=>setDashAudience(a)} style={{padding:'5px 12px',borderRadius:4,fontSize:11,fontFamily:T.font,border:`1px solid ${dashAudience===a?T.navy:T.border}`,background:dashAudience===a?T.navy:T.surface,color:dashAudience===a?'#fff':T.textSec,cursor:'pointer',fontWeight:600}}>{a}</button>
          ))}
        </div>
      </div>

      {/* 4x4 KPI Grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <KPICard label="Total Scope 1" value={fmtCO2(aggTotals.totalS1)} sub="Direct emissions" color={T.navy} trend={-3.2} icon="\u{1F3ED}"/>
        <KPICard label="Scope 2 (Location)" value={fmtCO2(aggTotals.totalS2)} sub="Location-based" color={T.navyL} trend={-5.1} icon="\u26A1"/>
        <KPICard label="Scope 2 (Market)" value={fmtCO2(aggTotals.totalS2Market)} sub="Market-based" color={T.gold} trend={-7.8} icon="\u{1F4C4}"/>
        <KPICard label="Total Scope 3" value={fmtCO2(aggTotals.totalS3)} sub="Value chain" color={T.sage} trend={1.4} icon="\u{1F30D}"/>

        <KPICard label="Total GHG (All Scopes)" value={fmtCO2(aggTotals.totalGHG)} sub="S1+S2+S3" color={T.navy} trend={-2.1}/>
        <KPICard label="Carbon Intensity" value={aggTotals.carbonIntensity+' tCO2e/$M'} sub="Revenue-normalised" color={T.navyL} trend={-4.5}/>
        <KPICard label="Financed Emissions" value={fmtCO2(aggTotals.financedTotal)} sub="PCAF weighted" color={T.gold} trend={-1.8}/>
        <KPICard label="Avoided Emissions" value={fmtCO2(aggTotals.avoidedEm)} sub="Scope 4 net" color={T.green} trend={12.3}/>

        <KPICard label="Temperature Score" value={aggTotals.avgTemp.toFixed(1)+'\u00B0C'} sub="Implied warming" color={aggTotals.avgTemp>2?T.amber:T.green} trend={-0.3}/>
        <KPICard label="SBTi Alignment" value={aggTotals.sbtiPct+'%'} sub="On-track holdings" color={aggTotals.sbtiPct>50?T.green:T.amber} trend={5.2}/>
        <KPICard label="Carbon Budget Remaining" value={aggTotals.budgetRemaining+'%'} sub="1.5\u00B0C (50%) pathway" color={aggTotals.budgetRemaining>50?T.green:T.amber} trend={-2.1}/>
        <KPICard label="Net Climate Impact" value={fmtCO2(aggTotals.netImpact)} sub="GHG minus avoided" color={T.navy} trend={-3.5}/>

        <KPICard label="WACI" value={aggTotals.waci.toFixed(1)+' tCO2e/$M'} sub="Weighted avg carbon int." color={T.navyL} trend={-4.8}/>
        <KPICard label="Carbon Footprint" value={'$'+aggTotals.carbonFootprint+'M'} sub="Financed/AUM" color={T.gold} trend={-2.3}/>
        <KPICard label="Green Revenue" value={aggTotals.avgGreenRev.toFixed(1)+'%'} sub="EU Taxonomy aligned" color={T.green} trend={3.1}/>
        <KPICard label="YoY Reduction" value={fmtPct(aggTotals.avgYoY)} sub="vs previous year" color={aggTotals.avgYoY<0?T.green:T.red} trend={aggTotals.avgYoY}/>
      </div>

      {/* Stacked area chart (simulated as bar chart) */}
      <Panel title="Quarterly GHG Trend (12 Quarters) \u2014 Scope 1 + 2 + 3 Stacked">
        <div style={{display:'flex',alignItems:'flex-end',gap:3,height:180}}>
          {quarterlyTrend.map((q,i)=>{
            const maxQ=Math.max(...quarterlyTrend.map(x=>x.total));
            const h=(q.total/maxQ)*160;
            const h1=(q.s1/q.total)*h;
            const h2=(q.s2/q.total)*h;
            const h3=(q.s3/q.total)*h;
            return(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:180}}>
                <div style={{width:'100%',display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
                  <div style={{height:h3,background:T.sage,borderRadius:'3px 3px 0 0'}} title={`Scope 3: ${fmtCO2(q.s3)}`}/>
                  <div style={{height:h2,background:T.gold}} title={`Scope 2: ${fmtCO2(q.s2)}`}/>
                  <div style={{height:h1,background:T.navy}} title={`Scope 1: ${fmtCO2(q.s1)}`}/>
                </div>
                <div style={{fontSize:8,fontFamily:T.mono,color:T.textMut,marginTop:4,transform:'rotate(-45deg)',transformOrigin:'top left',whiteSpace:'nowrap'}}>{q.quarter}</div>
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',gap:16,marginTop:16,justifyContent:'center'}}>
          <span style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}><span style={{width:12,height:12,background:T.navy,borderRadius:2,display:'inline-block'}}/> Scope 1</span>
          <span style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}><span style={{width:12,height:12,background:T.gold,borderRadius:2,display:'inline-block'}}/> Scope 2</span>
          <span style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}><span style={{width:12,height:12,background:T.sage,borderRadius:2,display:'inline-block'}}/> Scope 3</span>
        </div>
      </Panel>

      {/* Sankey-style flow (simplified as table) */}
      <Panel title="Emission Flow: Sources \u2192 Scopes \u2192 Categories \u2192 Frameworks">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,fontSize:11}}>
          <div>
            <div style={{fontWeight:700,color:T.navy,marginBottom:6,fontFamily:T.mono,fontSize:10}}>SOURCES</div>
            {['Combustion','Purchased Electricity','Supply Chain','Investments','Transport','Waste','Employee Commute','Leased Assets'].map((s,i)=>(
              <div key={i} style={{padding:'4px 8px',background:T.surfaceH,borderRadius:4,marginBottom:3,fontSize:10}}>{s} <span style={{float:'right',fontFamily:T.mono,color:T.textMut}}>{fmt(Math.round(aggTotals.totalGHG*sr(i*71+50)/8))}</span></div>
            ))}
          </div>
          <div>
            <div style={{fontWeight:700,color:T.navy,marginBottom:6,fontFamily:T.mono,fontSize:10}}>SCOPES</div>
            <div style={{padding:'6px 8px',background:T.navy+'15',borderRadius:4,marginBottom:3,borderLeft:`3px solid ${T.navy}`}}>Scope 1 <span style={{float:'right',fontFamily:T.mono}}>{fmtCO2(aggTotals.totalS1)}</span></div>
            <div style={{padding:'6px 8px',background:T.gold+'15',borderRadius:4,marginBottom:3,borderLeft:`3px solid ${T.gold}`}}>Scope 2 <span style={{float:'right',fontFamily:T.mono}}>{fmtCO2(aggTotals.totalS2)}</span></div>
            <div style={{padding:'6px 8px',background:T.sage+'15',borderRadius:4,marginBottom:3,borderLeft:`3px solid ${T.sage}`}}>Scope 3 <span style={{float:'right',fontFamily:T.mono}}>{fmtCO2(aggTotals.totalS3)}</span></div>
            <div style={{padding:'6px 8px',background:T.green+'15',borderRadius:4,borderLeft:`3px solid ${T.green}`}}>Avoided <span style={{float:'right',fontFamily:T.mono}}>{fmtCO2(aggTotals.avoidedEm)}</span></div>
          </div>
          <div>
            <div style={{fontWeight:700,color:T.navy,marginBottom:6,fontFamily:T.mono,fontSize:10}}>CATEGORIES</div>
            {['Cat 1: Purchased Goods','Cat 2: Capital Goods','Cat 3: Fuel & Energy','Cat 4: Upstream Transport','Cat 5: Waste','Cat 6: Business Travel','Cat 7: Commuting','Cat 11: Use of Products','Cat 15: Investments'].map((c,i)=>(
              <div key={i} style={{padding:'3px 8px',background:T.surfaceH,borderRadius:4,marginBottom:2,fontSize:9}}>{c} <span style={{float:'right',fontFamily:T.mono,color:T.textMut}}>{fmt(Math.round(aggTotals.totalS3*sr(i*31+400)/(i<3?2:4)))}</span></div>
            ))}
          </div>
          <div>
            <div style={{fontWeight:700,color:T.navy,marginBottom:6,fontFamily:T.mono,fontSize:10}}>FRAMEWORKS</div>
            {[{n:'GHG Protocol',c:'100%'},{n:'CSRD ESRS E1',c:'89%'},{n:'SFDR PAI',c:'92%'},{n:'TCFD',c:'95%'},{n:'CDP',c:'87%'},{n:'SEC Climate',c:'78%'},{n:'UK SDR',c:'85%'}].map((f,i)=>(
              <div key={i} style={{padding:'4px 8px',background:T.surfaceH,borderRadius:4,marginBottom:3,fontSize:10,display:'flex',justifyContent:'space-between'}}>
                <span>{f.n}</span><Badge text={f.c} color={parseInt(f.c)>90?T.green:parseInt(f.c)>80?T.amber:T.red}/>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Alert feed */}
      <Panel title="Alert Feed (10 Active)">
        <div style={{maxHeight:320,overflowY:'auto'}}>
          {alerts.map((a,i)=><AlertCard key={i} {...a}/>)}
        </div>
      </Panel>

      {/* Source module integration status */}
      <Panel title="12 Source Module Integration Status">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[
            {module:'Carbon Calculator',protocol:'GHG Protocol',status:'Live',dataPoints:42,coverage:100,lastSync:'28 Mar 14:32'},
            {module:'PCAF Financed Emissions',protocol:'PCAF v2',status:'Live',dataPoints:28,coverage:95,lastSync:'28 Mar 14:32'},
            {module:'Scope 3 Upstream',protocol:'GHG Scope 3 Std',status:'Live',dataPoints:36,coverage:82,lastSync:'28 Mar 13:15'},
            {module:'Avoided Emissions',protocol:'WRI/GHG',status:'Live',dataPoints:12,coverage:64,lastSync:'27 Mar 09:00'},
            {module:'SBTi Target Setter',protocol:'SBTi SDA/ACA',status:'Live',dataPoints:18,coverage:88,lastSync:'28 Mar 14:32'},
            {module:'Temperature Score',protocol:'SBTi/CDP',status:'Live',dataPoints:8,coverage:91,lastSync:'28 Mar 14:32'},
            {module:'CSRD ESRS E1',protocol:'EFRAG ESRS',status:'Live',dataPoints:54,coverage:89,lastSync:'28 Mar 10:00'},
            {module:'SFDR PAI',protocol:'SFDR RTS',status:'Live',dataPoints:18,coverage:92,lastSync:'28 Mar 14:32'},
            {module:'Carbon Budget',protocol:'IPCC AR6',status:'Live',dataPoints:14,coverage:100,lastSync:'28 Mar 14:32'},
            {module:'CBAM',protocol:'EU CBAM Reg.',status:'Partial',dataPoints:22,coverage:71,lastSync:'25 Mar 16:00'},
            {module:'Maritime CII',protocol:'IMO MEPC.352',status:'Partial',dataPoints:16,coverage:45,lastSync:'20 Mar 11:00'},
            {module:'Aviation CORSIA',protocol:'ICAO Annex 16',status:'Partial',dataPoints:14,coverage:38,lastSync:'18 Mar 09:00'},
          ].map((m,i)=>(
            <div key={i} style={{padding:'10px 12px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,borderLeft:`3px solid ${m.status==='Live'?T.green:T.amber}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:600,color:T.navy}}>{m.module}</span>
                <Badge text={m.status} color={m.status==='Live'?T.green:T.amber}/>
              </div>
              <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut,marginBottom:4}}>{m.protocol}</div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:T.textSec}}>
                <span>{m.dataPoints} data points</span>
                <span>Coverage: {m.coverage}%</span>
              </div>
              <div style={{marginTop:4,height:4,background:T.surfaceH,borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${m.coverage}%`,background:m.coverage>=80?T.green:m.coverage>=60?T.amber:T.red,borderRadius:2}}/>
              </div>
              <div style={{fontSize:8,fontFamily:T.mono,color:T.textMut,marginTop:3}}>Sync: {m.lastSync}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Board Pack vs Technical vs Regulator views */}
      {dashAudience==='Board Pack'&&(
        <Panel title="Board Pack \u2014 Simplified Climate Summary">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <div style={{padding:16,background:'linear-gradient(135deg, #1b3a5c 0%, #2c5a8c 100%)',borderRadius:8,color:'#fff'}}>
              <div style={{fontSize:10,opacity:0.7,fontFamily:T.mono}}>CLIMATE RISK RATING</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>{aggTotals.avgTemp<=1.8?'LOW':aggTotals.avgTemp<=2.5?'MEDIUM':'HIGH'}</div>
              <div style={{fontSize:11,opacity:0.8,marginTop:4}}>Portfolio temperature: {aggTotals.avgTemp.toFixed(1)}\u00B0C | Target: 1.5\u00B0C</div>
            </div>
            <div style={{padding:16,background:'linear-gradient(135deg, #5a8a6a 0%, #7ba67d 100%)',borderRadius:8,color:'#fff'}}>
              <div style={{fontSize:10,opacity:0.7,fontFamily:T.mono}}>DECARBONISATION PROGRESS</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>{Math.abs(aggTotals.avgYoY).toFixed(1)}%</div>
              <div style={{fontSize:11,opacity:0.8,marginTop:4}}>Annual reduction rate | Required: 4.2%/yr for SBTi</div>
            </div>
            <div style={{padding:16,background:'linear-gradient(135deg, #c5a96a 0%, #d4be8a 100%)',borderRadius:8,color:T.navy}}>
              <div style={{fontSize:10,opacity:0.7,fontFamily:T.mono}}>REGULATORY READINESS</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>87%</div>
              <div style={{fontSize:11,opacity:0.8,marginTop:4}}>CSRD E1: 89% | SFDR: 92% | CDP: 87% | SEC: 78%</div>
            </div>
          </div>
          <div style={{marginTop:16,padding:12,background:T.surfaceH,borderRadius:6}}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Board Action Items</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {[
                {action:'Approve updated Net Zero transition plan with interim 2030 targets',owner:'CIO',deadline:'Q2 2026',priority:'High'},
                {action:'Review top 10 emitter engagement outcomes and escalation recommendations',owner:'ESG Committee',deadline:'30 Apr 2026',priority:'High'},
                {action:'Endorse CBAM compliance framework for EU-exposed holdings',owner:'CFO',deadline:'31 May 2026',priority:'Medium'},
                {action:'Approve carbon credit procurement strategy for residual emissions',owner:'CIO',deadline:'Q3 2026',priority:'Medium'},
                {action:'Sign off on CSRD E1 disclosure for FY2024 annual report',owner:'Board',deadline:'15 Jun 2026',priority:'High'},
              ].map((a,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 10px',background:T.surface,borderRadius:4,border:`1px solid ${T.border}`}}>
                  <Badge text={a.priority} color={a.priority==='High'?T.red:T.amber}/>
                  <span style={{fontSize:11,flex:1,color:T.navy}}>{a.action}</span>
                  <span style={{fontSize:10,fontFamily:T.mono,color:T.textSec,minWidth:80}}>{a.owner}</span>
                  <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{a.deadline}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {dashAudience==='Regulator'&&(
        <Panel title="Regulator View \u2014 CSRD-Aligned Disclosure Summary">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>ESRS E1 Mandatory Disclosure Requirements</div>
              {[
                {dr:'E1-1',title:'Transition plan',status:'Complete',coverage:'89%'},
                {dr:'E1-2',title:'Policies',status:'Complete',coverage:'95%'},
                {dr:'E1-3',title:'Actions & resources',status:'Complete',coverage:'82%'},
                {dr:'E1-4',title:'Targets',status:'Complete',coverage:'88%'},
                {dr:'E1-5',title:'Energy consumption',status:'In Progress',coverage:'76%'},
                {dr:'E1-6',title:'GHG emissions (S1/S2/S3)',status:'Complete',coverage:'91%'},
                {dr:'E1-7',title:'GHG removals & credits',status:'Partial',coverage:'64%'},
                {dr:'E1-8',title:'Internal carbon pricing',status:'Complete',coverage:'85%'},
                {dr:'E1-9',title:'Financial effects',status:'In Progress',coverage:'58%'},
              ].map((d,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:`1px solid ${T.surfaceH}`}}>
                  <span style={{fontFamily:T.mono,fontSize:10,color:T.gold,fontWeight:600,width:36}}>{d.dr}</span>
                  <span style={{fontSize:11,flex:1,color:T.navy}}>{d.title}</span>
                  <Badge text={d.status} color={d.status==='Complete'?T.green:d.status==='In Progress'?T.amber:T.red}/>
                  <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut,width:36}}>{d.coverage}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>SFDR PAI Table 1 \u2014 Mandatory Indicators</div>
              {[
                {pai:'PAI #1',indicator:'GHG Emissions (S1+S2+S3)',value:fmtCO2(aggTotals.totalGHG),status:'Reported'},
                {pai:'PAI #2',indicator:'Carbon Footprint',value:aggTotals.carbonFootprint+'M tCO2e/$M',status:'Reported'},
                {pai:'PAI #3',indicator:'GHG Intensity of investees',value:aggTotals.waci.toFixed(1)+' tCO2e/$M',status:'Reported'},
                {pai:'PAI #4',indicator:'Fossil fuel sector exposure',value:'14.2%',status:'Reported'},
                {pai:'PAI #5',indicator:'Non-renewable energy share',value:'65.4%',status:'Reported'},
                {pai:'PAI #6',indicator:'Energy intensity per sector',value:'4.8 GWh/$M',status:'Reported'},
                {pai:'PAI #7',indicator:'Biodiversity sensitive areas',value:'8 holdings',status:'Estimated'},
                {pai:'PAI #10',indicator:'UNGC/OECD violations',value:'2 holdings flagged',status:'Reported'},
                {pai:'PAI #14',indicator:'Controversial weapons',value:'0 holdings',status:'Verified'},
              ].map((p,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:`1px solid ${T.surfaceH}`}}>
                  <span style={{fontFamily:T.mono,fontSize:10,color:T.gold,fontWeight:600,width:48}}>{p.pai}</span>
                  <span style={{fontSize:10,flex:1,color:T.textSec}}>{p.indicator}</span>
                  <span style={{fontFamily:T.mono,fontSize:10,fontWeight:600,color:T.navy}}>{p.value}</span>
                  <Badge text={p.status} color={p.status==='Reported'?T.green:p.status==='Verified'?T.green:T.amber}/>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* Grid intensity analysis by portfolio geography */}
      <Panel title="Grid Intensity Analysis \u2014 Portfolio Exposure by Country">
        <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Scope 2 location-based emissions are driven by grid carbon intensity. Countries with higher gCO2/kWh create more Scope 2 emissions per unit of electricity consumed.</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Country','ISO','Grid Intensity (gCO2/kWh)','Primary Source','Holdings','Scope 2 Exposure','Decarbonisation Rate','Benchmark vs EU Avg'].map(h=>(
                  <th key={h} style={{padding:'6px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countryAgg.slice(0,15).map((c,i)=>{
                const gridData=GRID_INTENSITY.find(g=>g.iso2===c.country);
                const intensity=gridData?gridData.gCO2_kWh:range(200,600,i*31+7000);
                const primary=gridData?gridData.primary:'Mixed';
                const euAvg=275;
                const delta=Math.round(intensity-euAvg);
                const s2Exposure=Math.round(c.total*0.15);
                const decarbRate=range(-8,-1,i*19+3000);
                return(
                  <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                    <td style={{padding:'5px 6px',fontWeight:600,color:T.navy}}>{gridData?gridData.country:c.country}</td>
                    <td style={{padding:'5px 6px',fontFamily:T.mono,color:T.textMut}}>{c.country}</td>
                    <td style={{padding:'5px 6px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontFamily:T.mono,fontWeight:600,color:intensity<200?T.green:intensity<400?T.amber:T.red}}>{Math.round(intensity)}</span>
                        <div style={{width:60,height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${Math.min(100,(intensity/800)*100)}%`,background:intensity<200?T.green:intensity<400?T.amber:T.red,borderRadius:3}}/>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'5px 6px',fontSize:9,color:T.textSec}}>{primary}</td>
                    <td style={{padding:'5px 6px',fontFamily:T.mono}}>{c.count}</td>
                    <td style={{padding:'5px 6px',fontFamily:T.mono}}>{fmtCO2(s2Exposure)}</td>
                    <td style={{padding:'5px 6px',fontFamily:T.mono,color:T.green}}>{decarbRate.toFixed(1)}%/yr</td>
                    <td style={{padding:'5px 6px',fontFamily:T.mono,color:delta>0?T.red:T.green}}>{delta>0?'+':''}{delta} gCO2/kWh</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:12,display:'flex',gap:16,justifyContent:'center',fontSize:10}}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,background:T.green,borderRadius:2,display:'inline-block'}}/> Low carbon (&lt;200)</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,background:T.amber,borderRadius:2,display:'inline-block'}}/> Medium (200-400)</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,background:T.red,borderRadius:2,display:'inline-block'}}/> High carbon (&gt;400)</span>
        </div>
      </Panel>

      {/* Emission factor reference table */}
      <Panel title="Key Emission Factors Applied (DEFRA 2023 + EXIOBASE)">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:6}}>SCOPE 3 SPEND-BASED FACTORS</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  <th style={{padding:'4px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>Category</th>
                  <th style={{padding:'4px 6px',textAlign:'right',fontFamily:T.mono,fontSize:9,color:T.textMut}}>Factor (kgCO2e/$)</th>
                  <th style={{padding:'4px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>Source</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(EMISSION_FACTORS.scope3_spend).map(([key,ef],i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                    <td style={{padding:'3px 6px',color:T.navy,fontSize:9}}>{key.replace('cat','Cat ').replace(/_/g,' ')}</td>
                    <td style={{padding:'3px 6px',textAlign:'right',fontFamily:T.mono,fontWeight:600}}>{ef.factor}</td>
                    <td style={{padding:'3px 6px',fontSize:8,color:T.textMut}}>{ef.source.substring(0,25)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:6}}>ENERGY EMISSION FACTORS</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  <th style={{padding:'4px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>Fuel/Source</th>
                  <th style={{padding:'4px 6px',textAlign:'right',fontFamily:T.mono,fontSize:9,color:T.textMut}}>Factor</th>
                  <th style={{padding:'4px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>Unit</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(EMISSION_FACTORS.energy).map(([key,ef],i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                    <td style={{padding:'3px 6px',color:T.navy,fontSize:9}}>{key.replace(/_/g,' ')}</td>
                    <td style={{padding:'3px 6px',textAlign:'right',fontFamily:T.mono,fontWeight:600}}>{ef.factor}</td>
                    <td style={{padding:'3px 6px',fontSize:8,color:T.textMut}}>{ef.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      {/* GWP values reference */}
      <Panel title="IPCC AR6 GWP-100 Values Applied">
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {[
            {gas:'CO\u2082',gwp:GWP_VALUES.CO2},{gas:'CH\u2084 (fossil)',gwp:GWP_VALUES.CH4_fossil},{gas:'N\u2082O',gwp:GWP_VALUES.N2O},
            {gas:'SF\u2086',gwp:GWP_VALUES.SF6},{gas:'NF\u2083',gwp:GWP_VALUES.NF3},{gas:'HFC-134a',gwp:GWP_VALUES.HFC_134a},
            {gas:'CF\u2084',gwp:GWP_VALUES.CF4},{gas:'HFC-23',gwp:GWP_VALUES.HFC_23},{gas:'C\u2082F\u2086',gwp:GWP_VALUES.C2F6},
          ].map((g,i)=>(
            <div key={i} style={{padding:'6px 12px',background:T.surfaceH,borderRadius:6,textAlign:'center',minWidth:80}}>
              <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{g.gas}</div>
              <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:g.gwp>1000?T.red:g.gwp>100?T.amber:T.green}}>{fmt(g.gwp)}</div>
              <div style={{fontSize:8,color:T.textMut}}>GWP-100</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Methodology reference panel */}
      <Panel title="Methodology Reference \u2014 Calculation Standards & Sources">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {std:'GHG Protocol',edition:'Corporate Standard (Revised 2015)',scope:'Scope 1, 2, 3 accounting',ef:'DEFRA 2023 emission factors',note:'Operational control boundary'},
            {std:'PCAF',edition:'Global GHG Standard 2nd Ed (2022)',scope:'Financed emissions attribution',ef:'PCAF data quality score 1-5',note:'6 asset class methodologies'},
            {std:'SBTi',edition:'Corporate Net-Zero Standard v1.1',scope:'1.5\u00B0C/WB2C target validation',ef:'SDA and ACA approach methods',note:'Cross-sector and sector-specific'},
            {std:'IPCC AR6',edition:'WG1/WG3 (2021-2022)',scope:'GWP-100 values, carbon budgets',ef:'GWP-100 for 7 GHG groups',note:'500 GtCO2 remaining (1.5\u00B0C 50%)'},
            {std:'Ember',edition:'Global Electricity Review 2024',scope:'Grid emission factors',ef:'50 country gCO2/kWh',note:'CC BY 4.0 licensed data'},
            {std:'NGFS',edition:'Phase IV Scenarios v4.2 (2023)',scope:'Transition risk scenarios',ef:'6 scenario carbon prices',note:'Orderly/Disorderly/Hot House'},
            {std:'EU ETS / UK ETS',edition:'2025 compliance prices',scope:'Carbon price exposure',ef:'\u20AC65.2 (EU) / \u00A344.8 (UK)',note:'Plus RGGI, California, Korea, China'},
            {std:'EXIOBASE',edition:'v3.8.2 MRIO tables',scope:'Spend-based Scope 3 EFs',ef:'kgCO2e/$ by sector',note:'Categories 1-8, 11-12, 15'},
            {std:'DEFRA',edition:'GHG Conversion Factors 2023',scope:'UK government emission factors',ef:'Transport, energy, materials',note:'DESNZ published annually'},
          ].map((m,i)=>(
            <div key={i} style={{padding:10,background:T.surfaceH,borderRadius:6}}>
              <div style={{fontSize:11,fontWeight:700,color:T.navy}}>{m.std}</div>
              <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut,marginBottom:4}}>{m.edition}</div>
              <div style={{fontSize:9,color:T.textSec}}>{m.scope}</div>
              <div style={{fontSize:9,color:T.textSec,marginTop:2}}>EF: {m.ef}</div>
              <div style={{fontSize:8,color:T.textMut,marginTop:2}}>{m.note}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );

  // ── TAB 2: Scope Waterfall ──
  const renderWaterfall=()=>{
    const waterfallSegments=[
      {label:'Scope 1\nStationary',value:Math.round(aggTotals.totalS1*0.45),color:T.navy},
      {label:'Scope 1\nMobile',value:Math.round(aggTotals.totalS1*0.30),color:T.navy},
      {label:'Scope 1\nProcess',value:Math.round(aggTotals.totalS1*0.15),color:T.navy},
      {label:'Scope 1\nFugitive',value:Math.round(aggTotals.totalS1*0.10),color:T.navy},
      {label:'Scope 2\nLocation',value:aggTotals.totalS2,color:T.gold},
      {label:'Scope 2\nMarket',value:aggTotals.totalS2Market,color:T.goldL},
      {label:'S3 Cat 1',value:Math.round(aggTotals.totalS3*0.25),color:T.sage},
      {label:'S3 Cat 2',value:Math.round(aggTotals.totalS3*0.10),color:T.sage},
      {label:'S3 Cat 3',value:Math.round(aggTotals.totalS3*0.08),color:T.sage},
      {label:'S3 Cat 4',value:Math.round(aggTotals.totalS3*0.06),color:T.sage},
      {label:'S3 Cat 5',value:Math.round(aggTotals.totalS3*0.03),color:T.sage},
      {label:'S3 Cat 6',value:Math.round(aggTotals.totalS3*0.04),color:T.sage},
      {label:'S3 Cat 7',value:Math.round(aggTotals.totalS3*0.02),color:T.sage},
      {label:'S3 Cat 8-10',value:Math.round(aggTotals.totalS3*0.05),color:T.sage},
      {label:'S3 Cat 11',value:Math.round(aggTotals.totalS3*0.15),color:T.sage},
      {label:'S3 Cat 12',value:Math.round(aggTotals.totalS3*0.02),color:T.sage},
      {label:'S3 Cat 13-14',value:Math.round(aggTotals.totalS3*0.05),color:T.sage},
      {label:'S3 Cat 15',value:Math.round(aggTotals.totalS3*0.15),color:T.sage},
      {label:'Avoided',value:-aggTotals.avoidedEm,color:T.green},
      {label:'Net Total',value:aggTotals.netImpact,color:T.red},
    ];
    const maxWf=Math.max(...waterfallSegments.map(s=>Math.abs(s.value)));

    return(
      <div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {['2025','2024','Base Year (2019)'].map(y=>(
            <button key={y} onClick={()=>setWaterfallYear(y)} style={{padding:'5px 12px',borderRadius:4,fontSize:11,fontFamily:T.mono,border:`1px solid ${waterfallYear===y?T.gold:T.border}`,background:waterfallYear===y?T.gold+'20':T.surface,color:T.navy,cursor:'pointer',fontWeight:waterfallYear===y?700:400}}>{y}</button>
          ))}
          <label style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:T.textSec,marginLeft:12}}>
            <input type="checkbox" checked={waterfallCompare} onChange={e=>setWaterfallCompare(e.target.checked)}/> Compare years side-by-side
          </label>
        </div>

        <Panel title="Interactive Waterfall: Sources \u2192 Scopes \u2192 Categories \u2192 Net">
          <div style={{display:'flex',alignItems:'flex-end',gap:2,height:220,overflowX:'auto',paddingBottom:40}}>
            {waterfallSegments.map((s,i)=>{
              const h=Math.max((Math.abs(s.value)/maxWf)*180,4);
              const isNeg=s.value<0;
              return(
                <div key={i} style={{minWidth:42,flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:220,cursor:'pointer'}} onClick={()=>setWaterfallDrill(waterfallDrill===i?null:i)}>
                  <div style={{fontSize:8,fontFamily:T.mono,color:T.textMut,marginBottom:2,textAlign:'center'}}>{fmtCO2(Math.abs(s.value))}</div>
                  <div style={{width:'80%',height:h,background:waterfallDrill===i?(s.color+'CC'):s.color,borderRadius:isNeg?'0 0 3px 3px':'3px 3px 0 0',border:waterfallDrill===i?`2px solid ${T.navy}`:'none',transition:'all 0.2s'}}/>
                  <div style={{fontSize:7,fontFamily:T.mono,color:T.textMut,marginTop:4,textAlign:'center',whiteSpace:'pre-line',lineHeight:1.2}}>{s.label}</div>
                </div>
              );
            })}
          </div>
          {waterfallDrill!=null&&(
            <div style={{marginTop:12,padding:12,background:T.surfaceH,borderRadius:6,fontSize:11}}>
              <strong>{waterfallSegments[waterfallDrill].label.replace('\n',' ')}</strong>: {fmtCO2(Math.abs(waterfallSegments[waterfallDrill].value))} &mdash;
              DQS: <DQSBadge score={rangeInt(1,4,waterfallDrill*17)}/> | Source: {pick(['CDP Reported','Annual Report','Estimated','Proxy Model','Supplier Data'],waterfallDrill*31)} | Last updated: {pick(['Jan 2026','Feb 2026','Mar 2026','Dec 2025'],waterfallDrill*41)}
            </div>
          )}
        </Panel>

        {/* Sector decomposition */}
        <Panel title="Emissions by GICS Sector">
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}}>
            <div>
              {sectorAgg.slice(0,11).map((s,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:`1px solid ${T.surfaceH}`}}>
                  <span style={{fontSize:11,color:T.navy,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.sector}</span>
                  <span style={{fontFamily:T.mono,fontSize:10,color:T.textSec,whiteSpace:'nowrap'}}>{fmtCO2(s.total)}</span>
                </div>
              ))}
            </div>
            <BarChart data={sectorAgg.slice(0,11).map(s=>({label:s.sector.substring(0,8),value:s.total,color:T.navy}))} height={200}/>
          </div>
        </Panel>

        {/* Geography decomposition */}
        <Panel title="Emissions by Country (Top 20)">
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {countryAgg.slice(0,20).map((c,i)=>{
              const maxC=countryAgg[0].total;
              return(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:11,fontFamily:T.mono,width:30,color:T.textSec}}>{c.country}</span>
                  <div style={{flex:1,height:16,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${(c.total/maxC)*100}%`,background:T.navy+'80',borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut,minWidth:80,textAlign:'right'}}>{fmtCO2(c.total)}</span>
                  <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut,minWidth:30}}>({c.count})</span>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Year comparison */}
        {waterfallCompare&&(
          <Panel title="Year-over-Year Scope Comparison (Side-by-Side)">
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
              {['Scope 1','Scope 2 (Location)','Scope 2 (Market)','Scope 3 (Total)','Total GHG','Net Impact'].map((scope,si)=>{
                const current=si===0?aggTotals.totalS1:si===1?aggTotals.totalS2:si===2?aggTotals.totalS2Market:si===3?aggTotals.totalS3:si===4?aggTotals.totalGHG:aggTotals.netImpact;
                const lastYear=Math.round(current*(1+range(0.02,0.08,si*31)));
                const baseYear=Math.round(current*(1+range(0.15,0.35,si*37)));
                const chgLY=+((current-lastYear)/lastYear*100).toFixed(1);
                const chgBY=+((current-baseYear)/baseYear*100).toFixed(1);
                return(
                  <div key={si} style={{padding:12,background:T.surfaceH,borderRadius:6}}>
                    <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:8}}>{scope}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:10,color:T.textMut}}>Base Year (2019)</span>
                        <span style={{fontFamily:T.mono,fontSize:10}}>{fmtCO2(baseYear)}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:10,color:T.textMut}}>Last Year (2024)</span>
                        <span style={{fontFamily:T.mono,fontSize:10}}>{fmtCO2(lastYear)}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:10,fontWeight:600,color:T.navy}}>Current (2025)</span>
                        <span style={{fontFamily:T.mono,fontSize:10,fontWeight:600}}>{fmtCO2(current)}</span>
                      </div>
                      <div style={{borderTop:`1px solid ${T.border}`,paddingTop:4,display:'flex',justifyContent:'space-between'}}>
                        <span style={{fontSize:9,color:chgLY<0?T.green:T.red}}>vs LY: {chgLY>0?'+':''}{chgLY}%</span>
                        <span style={{fontSize:9,color:chgBY<0?T.green:T.red}}>vs Base: {chgBY>0?'+':''}{chgBY}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        {/* Data quality overlay per scope */}
        <Panel title="Data Quality Overlay by Scope Section">
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
            {[
              {scope:'Scope 1 \u2014 Stationary',avgDqs:1.8,pct:45,sources:'Direct meter readings, fuel invoices'},
              {scope:'Scope 1 \u2014 Mobile',avgDqs:2.2,pct:30,sources:'Fleet telemetry, fuel cards'},
              {scope:'Scope 1 \u2014 Process',avgDqs:2.5,pct:15,sources:'Process engineering data, mass balance'},
              {scope:'Scope 1 \u2014 Fugitive',avgDqs:3.1,pct:10,sources:'OGI surveys, EPA Subpart W'},
              {scope:'Scope 2 \u2014 Location',avgDqs:1.5,pct:100,sources:'Utility invoices + Ember grid factors'},
              {scope:'Scope 2 \u2014 Market',avgDqs:1.8,pct:100,sources:'REGOs/RECs + residual mix'},
              {scope:'Scope 3 Cat 1-2',avgDqs:3.2,pct:35,sources:'Mix: supplier-specific (15%), spend-based (85%)'},
              {scope:'Scope 3 Cat 3-8',avgDqs:3.5,pct:28,sources:'Primarily spend-based EEIO factors'},
              {scope:'Scope 3 Cat 11',avgDqs:3.8,pct:15,sources:'Product use-phase models, LCA'},
              {scope:'Scope 3 Cat 15',avgDqs:4.2,pct:15,sources:'PCAF attribution, mix reported/proxy'},
            ].map((d,i)=>(
              <div key={i} style={{padding:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,borderTop:`3px solid ${d.avgDqs<=2?T.green:d.avgDqs<=3?T.amber:T.red}`}}>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:4}}>{d.scope}</div>
                <div style={{fontFamily:T.mono,fontSize:16,fontWeight:700,color:d.avgDqs<=2?T.green:d.avgDqs<=3?T.amber:T.red}}>{d.avgDqs}</div>
                <div style={{fontSize:9,color:T.textMut,marginTop:2}}>Avg DQS | {d.pct}% of scope</div>
                <div style={{fontSize:8,color:T.textSec,marginTop:4}}>{d.sources}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Scope 3 category deep dive */}
        <Panel title="Scope 3 \u2014 Full 15-Category Breakdown">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${T.border}`}}>
                  {['Cat','Category Name','tCO2e','% of S3','Method','DQS','Coverage','Reporting Status'].map(h=>(
                    <th key={h} style={{padding:'6px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {cat:1,name:'Purchased Goods & Services',pct:25,method:'Hybrid (supplier-specific + spend)',dqs:3,cov:82,status:'Reported'},
                  {cat:2,name:'Capital Goods',pct:10,method:'Spend-based (EXIOBASE)',dqs:4,cov:75,status:'Estimated'},
                  {cat:3,name:'Fuel & Energy (not S1/S2)',pct:8,method:'Average-data (DEFRA WTT+T&D)',dqs:2,cov:95,status:'Reported'},
                  {cat:4,name:'Upstream Transportation',pct:6,method:'Distance-based + spend-based',dqs:3,cov:78,status:'Reported'},
                  {cat:5,name:'Waste Generated',pct:3,method:'Waste-type-specific (DEFRA)',dqs:3,cov:88,status:'Reported'},
                  {cat:6,name:'Business Travel',pct:4,method:'Distance + spend-based',dqs:2,cov:92,status:'Reported'},
                  {cat:7,name:'Employee Commuting',pct:2,method:'Survey + average-data',dqs:4,cov:60,status:'Estimated'},
                  {cat:8,name:'Upstream Leased Assets',pct:2,method:'Asset-specific + spend',dqs:3,cov:70,status:'Partial'},
                  {cat:9,name:'Downstream Transportation',pct:3,method:'Distance-based (logistics)',dqs:3,cov:65,status:'Estimated'},
                  {cat:10,name:'Processing of Sold Products',pct:2,method:'Sector average',dqs:4,cov:45,status:'Estimated'},
                  {cat:11,name:'Use of Sold Products',pct:15,method:'Product LCA models',dqs:3,cov:72,status:'Modelled'},
                  {cat:12,name:'End-of-Life Treatment',pct:2,method:'Waste-type average',dqs:4,cov:55,status:'Estimated'},
                  {cat:13,name:'Downstream Leased Assets',pct:2,method:'Asset-specific',dqs:3,cov:68,status:'Partial'},
                  {cat:14,name:'Franchises',pct:3,method:'Franchise-specific',dqs:3,cov:62,status:'Partial'},
                  {cat:15,name:'Investments',pct:15,method:'PCAF attribution',dqs:4,cov:42,status:'Estimated'},
                ].map((c,i)=>{
                  const value=Math.round(aggTotals.totalS3*c.pct/100);
                  return(
                    <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                      <td style={{padding:'4px 6px',fontFamily:T.mono,fontWeight:600,color:T.gold}}>{c.cat}</td>
                      <td style={{padding:'4px 6px',color:T.navy}}>{c.name}</td>
                      <td style={{padding:'4px 6px',fontFamily:T.mono}}>{fmtCO2(value)}</td>
                      <td style={{padding:'4px 6px',fontFamily:T.mono}}>{c.pct}%</td>
                      <td style={{padding:'4px 6px',fontSize:9,color:T.textSec}}>{c.method}</td>
                      <td style={{padding:'4px 6px'}}><DQSBadge score={c.dqs}/></td>
                      <td style={{padding:'4px 6px',fontFamily:T.mono}}>{c.cov}%</td>
                      <td style={{padding:'4px 6px'}}><Badge text={c.status} color={c.status==='Reported'?T.green:c.status==='Modelled'?T.sage:c.status==='Partial'?T.amber:T.red}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Top 20 emitters */}
        <Panel title="Top 20 Emitters by Contribution">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${T.border}`}}>
                  {['#','Company','Sector','Total tCO2e','% of Portfolio','Intensity','Trend','DQS'].map(h=>(
                    <th key={h} style={{padding:'6px 8px',textAlign:'left',fontFamily:T.mono,fontSize:10,color:T.textMut,fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolioData.sort((a,b)=>b.total-a.total).slice(0,20).map((r,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                    <td style={{padding:'5px 8px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{i+1}</td>
                    <td style={{padding:'5px 8px',fontWeight:600,color:T.navy}}>{r.ticker} <span style={{fontWeight:400,color:T.textSec}}>{r.name.substring(0,20)}</span></td>
                    <td style={{padding:'5px 8px',color:T.textSec}}>{r.sector.substring(0,15)}</td>
                    <td style={{padding:'5px 8px',fontFamily:T.mono}}>{fmtCO2(r.total)}</td>
                    <td style={{padding:'5px 8px',fontFamily:T.mono}}>{(r.total/aggTotals.totalGHG*100).toFixed(2)}%</td>
                    <td style={{padding:'5px 8px',fontFamily:T.mono}}>{r.intensity}</td>
                    <td style={{padding:'5px 8px'}}><span style={{color:r.yoyReduction<0?T.green:T.red}}>{r.yoyReduction<0?'\u25BC':'\u25B2'}{Math.abs(r.yoyReduction).toFixed(1)}%</span></td>
                    <td style={{padding:'5px 8px'}}><DQSBadge score={r.dqs}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  };

  // ── TAB 3: Portfolio Carbon Analytics ──
  const renderPortfolio=()=>(
    <div>
      {/* Multi-filter bar */}
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16,alignItems:'center'}}>
        <select value={portSectorFilter} onChange={e=>setPortSectorFilter(e.target.value)} style={{padding:'5px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.mono}}>
          <option value="All">All Sectors</option>
          {sectors.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={portCountryFilter} onChange={e=>setPortCountryFilter(e.target.value)} style={{padding:'5px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.mono}}>
          <option value="All">All Countries</option>
          {countries.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={portSbtiFilter} onChange={e=>setPortSbtiFilter(e.target.value)} style={{padding:'5px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.mono}}>
          <option value="All">All SBTi</option>
          {sbtiStatuses.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>Temp: {portTempRange[0]}-{portTempRange[1]}\u00B0C</span>
        <input type="range" min={0} max={5} step={0.5} value={portTempRange[1]} onChange={e=>setPortTempRange([portTempRange[0],parseFloat(e.target.value)])} style={{width:80}}/>
        <span style={{fontSize:10,color:T.textMut,marginLeft:'auto'}}>{filteredPortfolio.length} holdings | Page {portPage+1}/{totalPages}</span>
      </div>

      {/* Sortable table */}
      <Panel>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{padding:'6px 4px',width:24}}><input type="checkbox" onChange={e=>{if(e.target.checked)setPortSelected(pagedPortfolio.map(r=>r.id));else setPortSelected([]);}}/></th>
                {[{k:'ticker',l:'Company'},{k:'sector',l:'Sector'},{k:'country',l:'Country'},{k:'weight',l:'Weight %'},{k:'s1',l:'Scope 1'},{k:'s2',l:'Scope 2'},{k:'s3',l:'Scope 3'},{k:'total',l:'Total'},{k:'intensity',l:'Intensity'},{k:'waci_contrib',l:'WACI Cont.'},{k:'temp',l:'Temp \u00B0C'},{k:'sbti',l:'SBTi'}].map(col=>(
                  <th key={col.k} onClick={()=>{if(portSort===col.k)setPortSortDir(portSortDir==='desc'?'asc':'desc');else{setPortSort(col.k);setPortSortDir('desc');}}} style={{padding:'6px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',userSelect:'none'}}>
                    {col.l} {portSort===col.k?(portSortDir==='desc'?'\u25BC':'\u25B2'):''}
                  </th>
                ))}
                <th style={{padding:'6px 6px',fontSize:9,fontFamily:T.mono,color:T.textMut}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedPortfolio.map((r,i)=>(
                <tr key={r.id} style={{borderBottom:`1px solid ${T.surfaceH}`,background:portSelected.includes(r.id)?T.gold+'10':'transparent'}}>
                  <td style={{padding:'4px'}}><input type="checkbox" checked={portSelected.includes(r.id)} onChange={e=>{if(e.target.checked)setPortSelected([...portSelected,r.id]);else setPortSelected(portSelected.filter(x=>x!==r.id));}}/></td>
                  <td style={{padding:'4px 6px',fontWeight:600,color:T.navy,whiteSpace:'nowrap'}}>{r.ticker} <span style={{fontWeight:400,fontSize:9,color:T.textSec}}>{r.name.substring(0,16)}</span></td>
                  <td style={{padding:'4px 6px',fontSize:9,color:T.textSec}}>{r.sector.substring(0,12)}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}>{r.country}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}>{r.weight.toFixed(2)}%</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}>{fmt(r.s1)}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}>{fmt(r.s2)}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}>{fmt(r.s3)}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9,fontWeight:600}}>{fmt(r.total)}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}>{r.intensity}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}>{r.waci_contrib.toFixed(1)}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}><span style={{color:r.temp<1.5?T.green:r.temp<2?T.amber:T.red}}>{r.temp.toFixed(1)}\u00B0C</span></td>
                  <td style={{padding:'4px 6px'}}><Badge text={r.sbti.replace('Target Set \u2014 ','').substring(0,8)} color={r.sbti.includes('1.5')?T.green:r.sbti==='None'?T.red:T.amber}/></td>
                  <td style={{padding:'4px 6px'}}><button onClick={()=>setPortDetailId(portDetailId===r.id?null:r.id)} style={{fontSize:9,padding:'2px 6px',borderRadius:3,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',color:T.navy}}>Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
          <div style={{display:'flex',gap:4}}>
            <Btn small onClick={()=>setPortPage(Math.max(0,portPage-1))} disabled={portPage===0}>Prev</Btn>
            <Btn small onClick={()=>setPortPage(Math.min(totalPages-1,portPage+1))} disabled={portPage>=totalPages-1}>Next</Btn>
          </div>
          <div style={{display:'flex',gap:6}}>
            <Btn small disabled={portSelected.length===0||portSelected.length>5}>Compare Selected ({portSelected.length})</Btn>
            <Btn small disabled={portSelected.length===0}>Export Selected</Btn>
            <Btn small disabled={portSelected.length===0}>Flag for Engagement</Btn>
          </div>
        </div>
      </Panel>

      {/* Detail side panel */}
      {detailHolding&&(
        <Panel title={`${detailHolding.ticker} \u2014 ${detailHolding.name}`} actions={<Btn small onClick={()=>setPortDetailId(null)}>Close</Btn>}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Scope donut (simulated) */}
            <div>
              <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:8}}>EMISSION BREAKDOWN</div>
              <ScopeBar s1={detailHolding.s1} s2={detailHolding.s2} s3={detailHolding.s3}/>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:10}}>
                <span style={{color:T.navy}}>S1: {(detailHolding.s1/detailHolding.total*100).toFixed(0)}%</span>
                <span style={{color:T.gold}}>S2: {(detailHolding.s2/detailHolding.total*100).toFixed(0)}%</span>
                <span style={{color:T.sage}}>S3: {(detailHolding.s3/detailHolding.total*100).toFixed(0)}%</span>
              </div>
              <div style={{marginTop:12}}>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:6}}>12-QUARTER TREND</div>
                <BarChart data={detailHolding.quarterlyTrend.map((v,q)=>({label:`Q${(q%4)+1}`,value:v,color:T.navyL}))} height={80}/>
              </div>
            </div>

            {/* Metrics */}
            <div style={{fontSize:11}}>
              <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:8}}>KEY METRICS</div>
              {[
                ['Sector',detailHolding.sector],
                ['Total Emissions',fmtCO2(detailHolding.total)],
                ['Carbon Intensity',detailHolding.intensity+' tCO2e/$M'],
                ['WACI Contribution',detailHolding.waci_contrib.toFixed(2)],
                ['Temperature',detailHolding.temp.toFixed(1)+'\u00B0C'],
                ['SBTi Status',detailHolding.sbti],
                ['Net Zero Year',detailHolding.netZeroYear],
                ['MSCI Rating',detailHolding.msciRating],
                ['CDP Score',detailHolding.cdpScore],
                ['Green Revenue',detailHolding.greenRev.toFixed(1)+'%'],
                ['DQS',detailHolding.dqs],
                ['Carbon Cost (EU ETS)','\u20AC'+detailHolding.carbonCostEU+'K/yr'],
                ['YoY Reduction',fmtPct(detailHolding.yoyReduction)],
              ].map(([k,v],i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:`1px solid ${T.surfaceH}`}}>
                  <span style={{color:T.textSec}}>{k}</span>
                  <span style={{fontFamily:T.mono,fontWeight:600,color:T.navy}}>{v}</span>
                </div>
              ))}
              <div style={{marginTop:12}}>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:4}}>SECTOR BENCHMARK COMPARISON</div>
                {(()=>{
                  const bench=SECTOR_BENCHMARKS.find(b=>detailHolding.sector.toLowerCase().includes(b.sector.toLowerCase().substring(0,6)));
                  if(!bench)return <span style={{fontSize:10,color:T.textMut}}>No benchmark found</span>;
                  return(
                    <div style={{fontSize:10}}>
                      <div>Sector median: {bench.medianIntensity} tCO2e/$M | Paris 2030: {bench.parisTarget2030} tCO2e/$M</div>
                      <div style={{marginTop:4}}>Company: {detailHolding.intensity} tCO2e/$M &mdash; <span style={{color:detailHolding.intensity<=bench.parisTarget2030?T.green:detailHolding.intensity<=bench.medianIntensity?T.amber:T.red,fontWeight:600}}>{detailHolding.intensity<=bench.parisTarget2030?'Paris-aligned':detailHolding.intensity<=bench.medianIntensity?'Below median':'Above median'}</span></div>
                    </div>
                  );
                })()}
              </div>
              <div style={{marginTop:12}}>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:4}}>ENGAGEMENT ACTIONS</div>
                <div style={{fontSize:10,color:T.textSec}}>
                  {detailHolding.temp>2.5?'\u2022 Escalate: High temperature score requires board-level engagement':''}
                  {detailHolding.sbti==='None'?'\n\u2022 Priority: Request SBTi commitment within 12 months':''}
                  {detailHolding.dqs>=4?'\n\u2022 Data: Request CDP disclosure or verified emissions data':''}
                  {detailHolding.greenRev<10?'\n\u2022 Transition: Request green revenue strategy and taxonomy alignment plan':''}
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Sector x Scope emissions heatmap */}
      <Panel title="Sector x Scope Emissions Heatmap (tCO2e)">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{padding:'6px 8px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>Sector</th>
                <th style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono,fontSize:9,color:T.navy}}>Scope 1</th>
                <th style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono,fontSize:9,color:T.gold}}>Scope 2</th>
                <th style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono,fontSize:9,color:T.sage}}>Scope 3</th>
                <th style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono,fontSize:9}}>Total</th>
                <th style={{padding:'6px 8px',textAlign:'center',fontFamily:T.mono,fontSize:9}}>Scope Mix</th>
                <th style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono,fontSize:9}}>Intensity</th>
                <th style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono,fontSize:9}}>Holdings</th>
              </tr>
            </thead>
            <tbody>
              {sectorAgg.map((s,i)=>{
                const intensity=+(s.total/(s.weight*aggTotals.totalMktVal/100)*1e6).toFixed(0);
                return(
                  <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`,background:i%2===0?T.surfaceH+'50':'transparent'}}>
                    <td style={{padding:'5px 8px',fontWeight:600,color:T.navy,fontSize:11}}>{s.sector}</td>
                    <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono}}>{fmtCO2(s.s1)}</td>
                    <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono}}>{fmtCO2(s.s2)}</td>
                    <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono}}>{fmtCO2(s.s3)}</td>
                    <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontWeight:700}}>{fmtCO2(s.total)}</td>
                    <td style={{padding:'5px 8px'}}><ScopeBar s1={s.s1} s2={s.s2} s3={s.s3} width={80}/></td>
                    <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,color:intensity>200?T.red:intensity>50?T.amber:T.green}}>{intensity}</td>
                    <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,color:T.textSec}}>{s.count}</td>
                  </tr>
                );
              })}
              <tr style={{borderTop:`2px solid ${T.navy}`,fontWeight:700}}>
                <td style={{padding:'6px 8px',color:T.navy}}>TOTAL</td>
                <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}}>{fmtCO2(aggTotals.totalS1)}</td>
                <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}}>{fmtCO2(aggTotals.totalS2)}</td>
                <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}}>{fmtCO2(aggTotals.totalS3)}</td>
                <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}}>{fmtCO2(aggTotals.totalGHG)}</td>
                <td style={{padding:'6px 8px'}}><ScopeBar s1={aggTotals.totalS1} s2={aggTotals.totalS2} s3={aggTotals.totalS3} width={80}/></td>
                <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}}>{aggTotals.carbonIntensity}</td>
                <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}}>{portfolioData.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Engagement tracking summary */}
      <Panel title="Climate Engagement Tracker \u2014 Active Engagements">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
          <div style={{padding:10,background:T.green+'15',borderRadius:6,textAlign:'center'}}>
            <div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:T.green}}>12</div>
            <div style={{fontSize:10,color:T.textSec}}>Positive Outcome</div>
          </div>
          <div style={{padding:10,background:T.amber+'15',borderRadius:6,textAlign:'center'}}>
            <div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:T.amber}}>28</div>
            <div style={{fontSize:10,color:T.textSec}}>In Progress</div>
          </div>
          <div style={{padding:10,background:T.red+'15',borderRadius:6,textAlign:'center'}}>
            <div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:T.red}}>8</div>
            <div style={{fontSize:10,color:T.textSec}}>Escalated</div>
          </div>
          <div style={{padding:10,background:T.surfaceH,borderRadius:6,textAlign:'center'}}>
            <div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:T.textMut}}>102</div>
            <div style={{fontSize:10,color:T.textSec}}>Not Yet Engaged</div>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Company','Topic','Stage','Start Date','Last Contact','Response','Next Step'].map(h=>(
                  <th key={h} style={{padding:'5px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {company:'XOM',topic:'SBTi commitment',stage:'Escalated',start:'Jun 2025',last:'Feb 2026',response:'Partial \u2014 committed to Scope 1/2 only',next:'File shareholder resolution at AGM'},
                {company:'JPM',topic:'Financed emissions disclosure',stage:'In Progress',start:'Sep 2025',last:'Mar 2026',response:'Positive \u2014 expanded PCAF reporting',next:'Review Q2 disclosure update'},
                {company:'AAPL',topic:'Supply chain decarbonisation',stage:'Positive',start:'Jan 2025',last:'Mar 2026',response:'Achieved \u2014 Scope 3 reduction plan published',next:'Monitor implementation'},
                {company:'CVX',topic:'Methane reduction targets',stage:'Escalated',start:'Mar 2025',last:'Jan 2026',response:'Insufficient \u2014 no near-term targets set',next:'Collaborative engagement via CA100+'},
                {company:'BHP',topic:'TCFD climate scenario analysis',stage:'In Progress',start:'Jul 2025',last:'Feb 2026',response:'In progress \u2014 committed to publish Q2 2026',next:'Review published scenarios'},
                {company:'MSFT',topic:'Carbon removal strategy',stage:'Positive',start:'Apr 2025',last:'Mar 2026',response:'Achieved \u2014 DAC commitment + internal carbon fee',next:'Annual review'},
                {company:'BAC',topic:'Net zero financing policy',stage:'In Progress',start:'Nov 2025',last:'Mar 2026',response:'Partial \u2014 phase-out policy for thermal coal',next:'Extend to oil & gas financing'},
                {company:'SO',topic:'Coal phase-out timeline',stage:'Escalated',start:'May 2025',last:'Dec 2025',response:'Negative \u2014 no coal exit commitment',next:'Vote against directors at AGM'},
              ].map((e,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                  <td style={{padding:'4px 6px',fontWeight:600,color:T.navy}}>{e.company}</td>
                  <td style={{padding:'4px 6px',color:T.textSec}}>{e.topic}</td>
                  <td style={{padding:'4px 6px'}}><Badge text={e.stage} color={e.stage==='Positive'?T.green:e.stage==='In Progress'?T.amber:T.red}/></td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{e.start}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{e.last}</td>
                  <td style={{padding:'4px 6px',fontSize:9,color:T.textSec}}>{e.response}</td>
                  <td style={{padding:'4px 6px',fontSize:9,color:T.navy}}>{e.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* WACI contribution waterfall */}
      <Panel title="WACI Contribution Waterfall \u2014 Top 20 Holdings">
        <BarChart data={portfolioData.sort((a,b)=>b.waci_contrib-a.waci_contrib).slice(0,20).map(r=>({label:r.ticker,value:r.waci_contrib,color:T.navyL}))} height={140}/>
      </Panel>

      {/* Attribution analysis */}
      <Panel title="Sector Attribution \u2014 Impact of Rebalancing">
        <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>Estimated WACI reduction if sector allocation changed by \u00B11%:</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {sectorAgg.slice(0,9).map((s,i)=>{
            const bench=SECTOR_BENCHMARKS.find(b=>s.sector.toLowerCase().includes(b.sector.toLowerCase().substring(0,5)));
            const impact=bench?+(s.weight*bench.medianIntensity/100*0.01).toFixed(2):0;
            return(
              <div key={i} style={{padding:'8px 10px',background:T.surfaceH,borderRadius:6}}>
                <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{s.sector.substring(0,18)}</div>
                <div style={{fontSize:10,fontFamily:T.mono,color:T.textSec}}>Weight: {s.weight.toFixed(1)}% | WACI impact: {impact}</div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );

  // ── TAB 4: Regulatory Mapping ──
  const renderRegulatory=()=>{
    const frameworks=['All','GHG Protocol','CSRD','SFDR','TCFD','CDP','SEC','UK SDR'];
    const deadlines=[
      {framework:'CSRD ESRS',date:'Jan 2025',status:'Active',detail:'Large PIEs >500 employees reporting FY2024'},
      {framework:'CSRD Phase 2',date:'Jan 2026',status:'Upcoming',detail:'Companies >250 employees, FY2025'},
      {framework:'SEC Climate Rule',date:'2026-2028',status:'Phased',detail:'Large accelerated filers first, phased scope'},
      {framework:'UK SDR',date:'Nov 2024',status:'Active',detail:'Anti-greenwashing rules for UK authorized funds'},
      {framework:'ISSB S1/S2',date:'Jan 2025',status:'Active',detail:'Adopted by IOSCO, jurisdictional implementation'},
      {framework:'EU CBAM',date:'Jan 2026',status:'Transitional',detail:'Full implementation, financial adjustments begin'},
      {framework:'CDP 2026',date:'Apr 2026',status:'Open',detail:'CDP Climate Change questionnaire window'},
    ];

    return(
      <div>
        <div style={{display:'flex',gap:4,marginBottom:16}}>
          {frameworks.map(f=>(
            <button key={f} onClick={()=>setRegFramework(f)} style={{padding:'5px 12px',borderRadius:4,fontSize:11,fontFamily:T.mono,border:`1px solid ${regFramework===f?T.gold:T.border}`,background:regFramework===f?T.gold+'20':T.surface,color:T.navy,cursor:'pointer',fontWeight:regFramework===f?700:400}}>{f}</button>
          ))}
        </div>

        <Panel title="Emissions Data \u2192 Regulatory Framework Mapping (20 Data Points)">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${T.border}`}}>
                  {['Data Point','Value','GHG Protocol','CSRD ESRS E1','SFDR PAI','TCFD','CDP','SEC','UK SDR','DQS'].map(h=>(
                    <th key={h} style={{padding:'6px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regMapping.map((r,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                    <td style={{padding:'5px 6px',fontWeight:600,color:T.navy,whiteSpace:'nowrap'}}>{r.dataPoint}</td>
                    <td style={{padding:'5px 6px',fontFamily:T.mono,fontSize:9,color:T.navyL}}>{r.value}</td>
                    {['ghgProtocol','csrd','sfdr','tcfd','cdp','sec','ukSdr'].map(fw=>(
                      <td key={fw} style={{padding:'5px 6px',fontSize:9,color:r[fw]==='\u2014'?T.textMut:T.textSec,cursor:r[fw]!=='\u2014'?'pointer':'default',background:regDetailCell===`${i}-${fw}`?T.gold+'15':'transparent'}}
                        onClick={()=>{if(r[fw]!=='\u2014')setRegDetailCell(regDetailCell===`${i}-${fw}`?null:`${i}-${fw}`);}}>
                        {r[fw]}
                      </td>
                    ))}
                    <td style={{padding:'5px 6px'}}><DQSBadge score={r.dqs}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {regDetailCell&&(()=>{
            const [ri,fw]=regDetailCell.split('-');
            const row=regMapping[parseInt(ri)];
            if(!row)return null;
            return(
              <div style={{marginTop:12,padding:12,background:T.surfaceH,borderRadius:6,fontSize:11}}>
                <strong>{row.dataPoint}</strong> mapped to <strong>{fw.toUpperCase()}</strong>: {row[fw]}
                <div style={{marginTop:4,color:T.textSec}}>
                  Value: {row.value} | Data Quality: DQS {row.dqs} | Source: {pick(['CDP Questionnaire','Annual Report','PCAF Database','Estimated','Proxy'],parseInt(ri)*13)} | Calculation: {pick(['Direct measurement','Location-based method','Spend-based EF','PCAF attribution','Sector proxy'],parseInt(ri)*17)} | Last verified: {pick(['Jan 2026','Feb 2026','Mar 2026'],parseInt(ri)*11)}
                </div>
              </div>
            );
          })()}
        </Panel>

        {/* Gap analysis */}
        <Panel title="Framework Coverage Gap Analysis">
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[
              {name:'GHG Protocol',pct:100,gaps:0},{name:'CSRD ESRS E1',pct:89,gaps:2},{name:'SFDR PAI',pct:92,gaps:1},
              {name:'TCFD',pct:95,gaps:1},{name:'CDP Climate',pct:87,gaps:3},{name:'SEC Climate',pct:78,gaps:4},
              {name:'UK SDR',pct:85,gaps:2},{name:'ISSB S2',pct:82,gaps:3},
            ].map((f,i)=>(
              <div key={i} style={{padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6}}>
                <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{f.name}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                  <div style={{flex:1,height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${f.pct}%`,background:f.pct>=90?T.green:f.pct>=80?T.amber:T.red,borderRadius:3}}/>
                  </div>
                  <span style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:f.pct>=90?T.green:f.pct>=80?T.amber:T.red}}>{f.pct}%</span>
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:4}}>{f.gaps} data gaps remaining</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Regulatory deadline tracker */}
        <Panel title="Regulatory Deadline Tracker">
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {deadlines.map((d,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12px',background:T.surfaceH,borderRadius:6}}>
                <Badge text={d.status} color={d.status==='Active'?T.green:d.status==='Upcoming'?T.amber:T.navyL}/>
                <span style={{fontWeight:600,fontSize:12,color:T.navy,minWidth:120}}>{d.framework}</span>
                <span style={{fontFamily:T.mono,fontSize:11,color:T.textSec}}>{d.date}</span>
                <span style={{fontSize:11,color:T.textMut,flex:1}}>{d.detail}</span>
                <Btn small>Generate Disclosure</Btn>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  };

  // ── TAB 5: Carbon Pricing & Cost ──
  const renderPricing=()=>(
    <div>
      {/* Scenario selector */}
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        {[{k:'EU_ETS',l:'EU ETS (\u20AC65.2)'},{k:'UK_ETS',l:'UK ETS (\u00A344.8)'},{k:'RGGI',l:'RGGI ($15.2)'},{k:'California',l:'CA ($38.7)'},{k:'NGFS_NZ',l:'NGFS NZ ($200)'},{k:'custom',l:'Custom'}].map(s=>(
          <button key={s.k} onClick={()=>setPriceScenario(s.k)} style={{padding:'5px 12px',borderRadius:4,fontSize:11,fontFamily:T.mono,border:`1px solid ${priceScenario===s.k?T.gold:T.border}`,background:priceScenario===s.k?T.gold+'20':T.surface,color:T.navy,cursor:'pointer',fontWeight:priceScenario===s.k?700:400}}>{s.l}</button>
        ))}
        {priceScenario==='custom'&&(
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <input type="range" min={0} max={500} value={customPrice} onChange={e=>setCustomPrice(parseInt(e.target.value))} style={{width:120}}/>
            <span style={{fontFamily:T.mono,fontSize:12,color:T.navy,fontWeight:700}}>${customPrice}/tCO2e</span>
          </div>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
        <KPICard label="Carbon Price" value={'$'+pricingData.scenarioPrice+'/tCO2e'} sub={priceScenario==='custom'?'Custom':'Market rate'} color={T.navy}/>
        <KPICard label="Total Carbon Cost" value={'$'+fmt(pricingData.totalCost)+'K/yr'} sub="Portfolio-level" color={T.red}/>
        <KPICard label="Cost as % of Revenue" value={(pricingData.totalCost/(aggTotals.totalMktVal*10)*100).toFixed(2)+'%'} sub="Estimated impact" color={T.amber}/>
      </div>

      {/* Per-holding carbon cost table */}
      <Panel title={`Per-Holding Carbon Cost @ $${pricingData.scenarioPrice}/tCO2e \u2014 Top 30`}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Company','Sector','Financed Em. (tCO2e)','Carbon Cost ($K/yr)','% of EBITDA','CBAM Exposed'].map(h=>(
                  <th key={h} style={{padding:'6px 8px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricingData.holdings.slice(0,30).map((r,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                  <td style={{padding:'5px 8px',fontWeight:600,color:T.navy}}>{r.ticker}</td>
                  <td style={{padding:'5px 8px',color:T.textSec,fontSize:9}}>{r.sector.substring(0,15)}</td>
                  <td style={{padding:'5px 8px',fontFamily:T.mono}}>{fmt(r.financedEm)}</td>
                  <td style={{padding:'5px 8px',fontFamily:T.mono,color:T.red,fontWeight:600}}>${fmt(r.carbonCost)}</td>
                  <td style={{padding:'5px 8px',fontFamily:T.mono}}>{r.costPctEbitda}%</td>
                  <td style={{padding:'5px 8px'}}><Badge text={['Energy','Materials','Industrials'].includes(r.sector)?'Yes':'No'} color={['Energy','Materials','Industrials'].includes(r.sector)?T.red:T.textMut}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* NGFS scenario comparison */}
      <Panel title="NGFS Scenario Carbon Price Projections">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {NGFS_SCENARIOS.map((sc,i)=>{
            const portCost2030=+(aggTotals.financedTotal*sc.carbonPrice2030_usd/1e6).toFixed(1);
            const portCost2050=+(aggTotals.financedTotal*sc.carbonPrice2050_usd/1e6).toFixed(1);
            return(
              <div key={i} style={{padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,borderLeft:`4px solid ${sc.color}`}}>
                <div style={{fontSize:12,fontWeight:700,color:T.navy}}>{sc.name}</div>
                <div style={{fontSize:10,color:T.textMut,marginBottom:6}}>{sc.category}</div>
                <div style={{fontSize:10,color:T.textSec}}>{sc.description.substring(0,60)}...</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:8}}>
                  <div><span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>2030:</span> <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy}}>${sc.carbonPrice2030_usd}</span></div>
                  <div><span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>2050:</span> <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy}}>${sc.carbonPrice2050_usd}</span></div>
                  <div><span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>Cost 2030:</span> <span style={{fontFamily:T.mono,fontSize:11,color:T.red}}>${portCost2030}M</span></div>
                  <div><span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>Cost 2050:</span> <span style={{fontFamily:T.mono,fontSize:11,color:T.red}}>${portCost2050}M</span></div>
                </div>
                <div style={{marginTop:6,fontSize:10}}><span style={{color:T.textMut}}>Peak warming:</span> <span style={{fontWeight:600,color:sc.peakWarming_c<=1.5?T.green:sc.peakWarming_c<=2?T.amber:T.red}}>{sc.peakWarming_c}\u00B0C</span></div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Carbon price sensitivity tornado */}
      <Panel title="Carbon Price Sensitivity \u2014 Portfolio P&L Impact">
        <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Annual cost impact at different carbon price levels on current portfolio emissions:</div>
        {[25,50,100,150,200,300,500].map((p,i)=>{
          const cost=+(aggTotals.financedTotal*p/1e6).toFixed(1);
          const maxCost=aggTotals.financedTotal*500/1e6;
          return(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:10,fontFamily:T.mono,width:60,textAlign:'right',color:T.textSec}}>${p}/tCO2e</span>
              <div style={{flex:1,height:16,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(cost/maxCost)*100}%`,background:p<=50?T.green:p<=150?T.amber:T.red,borderRadius:3,transition:'width 0.3s'}}/>
              </div>
              <span style={{fontSize:10,fontFamily:T.mono,color:T.red,fontWeight:600,minWidth:60}}>${cost}M</span>
            </div>
          );
        })}
      </Panel>

      {/* Internal carbon price benchmarking */}
      <Panel title="Internal Carbon Price Benchmarking \u2014 Company ICP vs Market">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Company','Sector','ICP ($/tCO2e)','EU ETS Price','NGFS NZ 2030','Delta vs Market','Decision Impact','Last Updated'].map(h=>(
                  <th key={h} style={{padding:'6px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolioData.slice(0,20).map((r,i)=>{
                const icp=Math.round(range(20,200,i*41+8000));
                const euPrice=65;
                const ngfsPrice=200;
                const deltaMarket=icp-euPrice;
                const impact=icp>150?'Accelerating transition capex':icp>80?'Moderate capex impact':icp>40?'Limited impact':'Minimal price signal';
                return(
                  <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                    <td style={{padding:'4px 6px',fontWeight:600,color:T.navy}}>{r.ticker}</td>
                    <td style={{padding:'4px 6px',color:T.textSec,fontSize:9}}>{r.sector.substring(0,15)}</td>
                    <td style={{padding:'4px 6px',fontFamily:T.mono,fontWeight:600,color:T.navy}}>${icp}</td>
                    <td style={{padding:'4px 6px',fontFamily:T.mono,color:T.textSec}}>\u20AC{euPrice}</td>
                    <td style={{padding:'4px 6px',fontFamily:T.mono,color:T.textSec}}>${ngfsPrice}</td>
                    <td style={{padding:'4px 6px',fontFamily:T.mono,color:deltaMarket>0?T.green:T.red,fontWeight:600}}>{deltaMarket>0?'+':''}{deltaMarket}</td>
                    <td style={{padding:'4px 6px',fontSize:9,color:T.textSec}}>{impact}</td>
                    <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{pick(['Jan 2026','Feb 2026','Mar 2026','Q4 2025','Q3 2025'],i*23)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* What-if slider analysis */}
      <Panel title="What-If Analysis \u2014 Carbon Price Impact on Portfolio EPS">
        <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Illustrative impact of increasing carbon price from current EU ETS (\u20AC65) to target level on portfolio-level EPS:</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            {price:65,label:'Current EU ETS',epsImpact:-0.8,sectorHit:'Energy \u221212%'},
            {price:100,label:'$100 (Short-term)',epsImpact:-1.4,sectorHit:'Materials \u221218%'},
            {price:200,label:'NGFS NZ 2030',epsImpact:-3.2,sectorHit:'Utilities \u221225%'},
            {price:500,label:'High ambition',epsImpact:-8.5,sectorHit:'Energy \u221242%'},
          ].map((s,i)=>(
            <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:6,textAlign:'center'}}>
              <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>{s.label}</div>
              <div style={{fontFamily:T.mono,fontSize:20,fontWeight:700,color:T.navy,marginTop:4}}>${s.price}</div>
              <div style={{fontFamily:T.mono,fontSize:14,fontWeight:600,color:T.red,marginTop:4}}>EPS: {s.epsImpact}%</div>
              <div style={{fontSize:9,color:T.textSec,marginTop:4}}>Worst hit: {s.sectorHit}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* CBAM exposure detail */}
      <Panel title="CBAM Exposure Analysis \u2014 EU Border Carbon Adjustment">
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
          <div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                <thead>
                  <tr style={{borderBottom:`2px solid ${T.border}`}}>
                    {['Product Category','Holdings Exposed','Embedded Emissions','CBAM Cost Estimate','Phase'].map(h=>(
                      <th key={h} style={{padding:'6px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {cat:'Steel & Iron',exposed:8,emissions:12400,cost:808,phase:'Full (2026)'},
                    {cat:'Aluminium',exposed:4,emissions:6200,cost:403,phase:'Full (2026)'},
                    {cat:'Cement',exposed:3,emissions:8900,cost:579,phase:'Full (2026)'},
                    {cat:'Fertilisers',exposed:2,emissions:3400,cost:221,phase:'Full (2026)'},
                    {cat:'Electricity',exposed:6,emissions:15800,cost:1027,phase:'Full (2026)'},
                    {cat:'Hydrogen',exposed:1,emissions:800,cost:52,phase:'Full (2026)'},
                  ].map((c,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                      <td style={{padding:'5px 6px',fontWeight:600,color:T.navy}}>{c.cat}</td>
                      <td style={{padding:'5px 6px',fontFamily:T.mono}}>{c.exposed}</td>
                      <td style={{padding:'5px 6px',fontFamily:T.mono}}>{fmt(c.emissions)} tCO2e</td>
                      <td style={{padding:'5px 6px',fontFamily:T.mono,color:T.red,fontWeight:600}}>\u20AC{fmt(c.cost)}K</td>
                      <td style={{padding:'5px 6px'}}><Badge text={c.phase} color={T.amber}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>CBAM Timeline</div>
            {[
              {date:'Oct 2023 \u2013 Dec 2025',phase:'Transitional',desc:'Reporting only, no financial adjustment'},
              {date:'Jan 2026',phase:'Full',desc:'CBAM certificates required for imports'},
              {date:'2026\u20132034',phase:'Phase-in',desc:'Free allowances gradually reduced'},
              {date:'2034+',phase:'Complete',desc:'100% CBAM, zero free allowances'},
            ].map((t,i)=>(
              <div key={i} style={{padding:'6px 10px',borderLeft:`3px solid ${i<=1?T.green:T.amber}`,background:T.surfaceH,borderRadius:'0 4px 4px 0',marginBottom:6}}>
                <div style={{fontSize:10,fontFamily:T.mono,color:T.gold,fontWeight:600}}>{t.date}</div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy}}>{t.phase}</div>
                <div style={{fontSize:9,color:T.textSec}}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Abatement cost curve */}
      <Panel title="Abatement Cost Curve \u2014 Marginal Cost per 1,000 tCO2e Reduction">
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {[
            {action:'Energy efficiency (buildings)',cost:'-$30',reduction:15000,color:T.green},
            {action:'Renewable PPAs',cost:'$5',reduction:12000,color:T.green},
            {action:'Fleet electrification',cost:'$25',reduction:8000,color:T.sage},
            {action:'Supplier engagement (Scope 3)',cost:'$40',reduction:25000,color:T.sage},
            {action:'Green hydrogen (process heat)',cost:'$85',reduction:5000,color:T.amber},
            {action:'Carbon capture (CCUS)',cost:'$120',reduction:3000,color:T.amber},
            {action:'Direct air capture',cost:'$600',reduction:1000,color:T.red},
          ].map((a,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:T.surfaceH,borderRadius:4}}>
              <span style={{fontSize:11,flex:1,color:T.navy}}>{a.action}</span>
              <span style={{fontFamily:T.mono,fontSize:10,color:a.color,fontWeight:600,minWidth:60}}>{a.cost}/t</span>
              <span style={{fontFamily:T.mono,fontSize:10,color:T.textSec,minWidth:80}}>{fmt(a.reduction)} tCO2e</span>
              <div style={{width:80,height:8,background:T.border,borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.min(100,(a.reduction/25000)*100)}%`,background:a.color,borderRadius:3}}/>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );

  // ── TAB 6: Pathway & Budget ──
  const renderPathway=()=>(
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {Object.keys(TEMPERATURE_PATHWAYS.budgets_GtCO2).map(k=>(
          <button key={k} onClick={()=>setPathwayBudget(k)} style={{padding:'5px 10px',borderRadius:4,fontSize:10,fontFamily:T.mono,border:`1px solid ${pathwayBudget===k?T.gold:T.border}`,background:pathwayBudget===k?T.gold+'20':T.surface,color:T.navy,cursor:'pointer',fontWeight:pathwayBudget===k?700:400}}>{k.replace('_',' (').replace('pct','%)')}</button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        <KPICard label="Global Budget Remaining" value={pathwayData.budget+' GtCO2'} sub={`Exhausted by ~${pathwayData.exhaustionYear}`} color={T.navy}/>
        <KPICard label="Years at Current Rate" value={pathwayData.yearsRemaining+' years'} sub={`@ ${pathwayData.annualGlobal} GtCO2/yr`} color={pathwayData.yearsRemaining<15?T.red:T.amber}/>
        <KPICard label="Portfolio Fair Share" value={pathwayData.portfolioBudget.toFixed(4)+' GtCO2'} sub="Proportional to AUM/GDP" color={T.gold}/>
        <KPICard label="Portfolio Temp Score" value={aggTotals.avgTemp.toFixed(1)+'\u00B0C'} sub="Weighted implied temp" color={aggTotals.avgTemp>2?T.red:T.green}/>
      </div>

      {/* Trajectory chart */}
      <Panel title="Emission Trajectory: Historical + Projected">
        <div style={{display:'flex',gap:4,marginBottom:12}}>
          {['trajectory','sectorPathway','netZero'].map(v=>(
            <button key={v} onClick={()=>setPathwayView(v)} style={{padding:'4px 10px',borderRadius:4,fontSize:11,fontFamily:T.mono,border:`1px solid ${pathwayView===v?T.gold:T.border}`,background:pathwayView===v?T.gold+'20':T.surface,color:T.navy,cursor:'pointer'}}>{v==='trajectory'?'Trajectory':v==='sectorPathway'?'Sector Pathway':'Net Zero'}</button>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'flex-end',gap:2,height:200}}>
          {Array.from({length:28},(_,y)=>{
            const year=2019+y;
            const isHistorical=year<=2025;
            const baseEmissions=aggTotals.totalGHG;
            let emissions;
            if(isHistorical){
              emissions=baseEmissions*(1+0.02*(2025-year)+range(-0.03,0.03,y*17));
            } else {
              const linearRate=0.042;
              const sbtiRate=0.07;
              const currentRate=0.01;
              const rate=pathwayView==='trajectory'?linearRate:pathwayView==='sectorPathway'?sbtiRate:currentRate;
              emissions=baseEmissions*Math.pow(1-rate,year-2025);
            }
            const maxE=baseEmissions*1.2;
            const h=Math.max(4,(emissions/maxE)*180);
            return(
              <div key={y} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:200}}>
                <div style={{width:'80%',height:h,background:isHistorical?T.navy:year<=2030?T.gold:T.sage,borderRadius:'2px 2px 0 0',opacity:isHistorical?1:0.7}}/>
                {year%3===0&&<div style={{fontSize:7,fontFamily:T.mono,color:T.textMut,marginTop:2}}>{year}</div>}
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',gap:16,marginTop:8,justifyContent:'center'}}>
          <span style={{fontSize:10,display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,background:T.navy,borderRadius:2,display:'inline-block'}}/> Historical</span>
          <span style={{fontSize:10,display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,background:T.gold,borderRadius:2,display:'inline-block'}}/> Near-term (&lt;2030)</span>
          <span style={{fontSize:10,display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,background:T.sage,borderRadius:2,display:'inline-block'}}/> Long-term</span>
        </div>
      </Panel>

      {/* Paris alignment gap */}
      <Panel title="Paris Alignment Gap Analysis">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Annual Reduction Required</div>
            {[
              {pathway:'1.5\u00B0C (50%)',rate:'7.0%',aligned:false},
              {pathway:'1.5\u00B0C (67%)',rate:'8.5%',aligned:false},
              {pathway:'2.0\u00B0C (50%)',rate:'3.3%',aligned:true},
              {pathway:'2.0\u00B0C (67%)',rate:'4.2%',aligned:false},
            ].map((p,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`1px solid ${T.surfaceH}`}}>
                <span style={{fontSize:11,flex:1}}>{p.pathway}</span>
                <span style={{fontFamily:T.mono,fontSize:11,fontWeight:600,color:T.navy}}>{p.rate}/yr</span>
                <Badge text={p.aligned?'On Track':'Gap'} color={p.aligned?T.green:T.red}/>
              </div>
            ))}
            <div style={{marginTop:8,fontSize:10,color:T.textSec}}>Current portfolio reduction rate: <strong style={{color:T.navy}}>3.5%/yr</strong></div>
          </div>

          {/* Temperature gauge */}
          <div>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Portfolio Temperature Gauge</div>
            <div style={{position:'relative',height:120,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{width:200,height:20,background:`linear-gradient(to right, ${T.green}, ${T.amber}, ${T.red})`,borderRadius:10,position:'relative'}}>
                <div style={{position:'absolute',left:`${Math.min(100,((aggTotals.avgTemp-1)/(4-1))*100)}%`,top:-8,transform:'translateX(-50%)',fontSize:16}}>
                  <div style={{width:2,height:36,background:T.navy,margin:'0 auto'}}/>
                  <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.navy,textAlign:'center'}}>{aggTotals.avgTemp.toFixed(1)}\u00B0C</div>
                </div>
                <div style={{position:'absolute',left:0,top:26,fontSize:9,fontFamily:T.mono,color:T.textMut}}>1.0\u00B0C</div>
                <div style={{position:'absolute',left:'25%',top:26,fontSize:9,fontFamily:T.mono,color:T.green,transform:'translateX(-50%)'}}>1.5\u00B0C</div>
                <div style={{position:'absolute',left:'50%',top:26,fontSize:9,fontFamily:T.mono,color:T.amber,transform:'translateX(-50%)'}}>2.0\u00B0C</div>
                <div style={{position:'absolute',right:0,top:26,fontSize:9,fontFamily:T.mono,color:T.red}}>4.0\u00B0C</div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* SBTi portfolio tracker */}
      <Panel title="SBTi Portfolio Target Tracker">
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
          {[
            {status:'Target Set \u2014 1.5\u00B0C',count:portfolioData.filter(r=>r.sbti.includes('1.5')).length,color:T.green},
            {status:'Target Set \u2014 WB2C',count:portfolioData.filter(r=>r.sbti.includes('WB2C')).length,color:T.sage},
            {status:'Target Set \u2014 2\u00B0C',count:portfolioData.filter(r=>r.sbti.includes('2\u00B0C')).length,color:T.amber},
            {status:'Committed',count:portfolioData.filter(r=>r.sbti==='Committed').length,color:T.navyL},
            {status:'None',count:portfolioData.filter(r=>r.sbti==='None').length,color:T.red},
          ].map((s,i)=>(
            <div key={i} style={{padding:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,textAlign:'center',borderTop:`3px solid ${s.color}`}}>
              <div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:s.color}}>{s.count}</div>
              <div style={{fontSize:10,color:T.textSec}}>{s.status}</div>
              <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut}}>{(s.count/portfolioData.length*100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Net-zero commitment status */}
      <Panel title="Net-Zero Commitment Status">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {alliance:'NZAM (Net Zero Asset Managers)',status:'Member',target:'2050',interim:'50% by 2030',progress:42},
            {alliance:'NZAOA (Asset Owner Alliance)',status:'Signatory',target:'2050',interim:'25% by 2025',progress:68},
            {alliance:'NZBA (Net-Zero Banking Alliance)',status:'Observer',target:'2050',interim:'Sector-specific',progress:25},
          ].map((a,i)=>(
            <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:6}}>
              <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{a.alliance}</div>
              <div style={{marginTop:6,fontSize:11}}><Badge text={a.status} color={T.green}/></div>
              <div style={{marginTop:8,fontSize:10,color:T.textSec}}>Target: {a.target} | Interim: {a.interim}</div>
              <div style={{marginTop:6,display:'flex',alignItems:'center',gap:6}}>
                <div style={{flex:1,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${a.progress}%`,background:a.progress>=50?T.green:T.amber,borderRadius:3}}/>
                </div>
                <span style={{fontFamily:T.mono,fontSize:10,fontWeight:600}}>{a.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Detailed budget allocation by asset class */}
      <Panel title="Carbon Budget Allocation by Asset Class">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {assetClass:'Listed Equity',holdings:90,emissions:Math.round(aggTotals.totalGHG*0.55),budgetShare:'55%',method:'Enterprise value attribution',dqs:2.4},
            {assetClass:'Corporate Bonds',holdings:35,emissions:Math.round(aggTotals.totalGHG*0.22),budgetShare:'22%',method:'PCAF balance sheet attribution',dqs:2.8},
            {assetClass:'Sovereign Bonds',holdings:10,emissions:Math.round(aggTotals.totalGHG*0.08),budgetShare:'8%',method:'GDP production-based',dqs:3.2},
            {assetClass:'Real Estate',holdings:8,emissions:Math.round(aggTotals.totalGHG*0.06),budgetShare:'6%',method:'Floor area x EPC rating',dqs:2.1},
            {assetClass:'Private Equity',holdings:5,emissions:Math.round(aggTotals.totalGHG*0.05),budgetShare:'5%',method:'Revenue/sector proxy',dqs:4.1},
            {assetClass:'Infrastructure',holdings:2,emissions:Math.round(aggTotals.totalGHG*0.04),budgetShare:'4%',method:'Asset-specific engineering',dqs:2.5},
          ].map((ac,i)=>(
            <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:6}}>
              <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{ac.assetClass}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:8,fontSize:10}}>
                <div><span style={{color:T.textMut}}>Holdings:</span> <span style={{fontFamily:T.mono,fontWeight:600}}>{ac.holdings}</span></div>
                <div><span style={{color:T.textMut}}>Budget share:</span> <span style={{fontFamily:T.mono,fontWeight:600}}>{ac.budgetShare}</span></div>
                <div><span style={{color:T.textMut}}>Emissions:</span> <span style={{fontFamily:T.mono,fontWeight:600}}>{fmtCO2(ac.emissions)}</span></div>
                <div><span style={{color:T.textMut}}>Avg DQS:</span> <DQSBadge score={Math.round(ac.dqs)}/></div>
              </div>
              <div style={{fontSize:9,color:T.textSec,marginTop:6}}>Method: {ac.method}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Engagement pipeline for net zero */}
      <Panel title="Net-Zero Engagement Pipeline \u2014 Laggard Holdings">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Company','Temp \u00B0C','SBTi','Gap vs 1.5\u00B0C','Engagement Stage','Next Action','Deadline','Escalation'].map(h=>(
                  <th key={h} style={{padding:'6px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolioData.filter(r=>r.temp>2.5||r.sbti==='None').slice(0,15).map((r,i)=>{
                const gap=+(r.temp-1.5).toFixed(1);
                const stage=pick(['Initial letter sent','Meeting scheduled','Board resolution requested','Proxy vote filed','Divestment review'],i*29);
                const nextAction=pick(['Follow-up letter Q2','Collaborative engagement via CA100+','File shareholder resolution','Reduce position 25%','Monitor & review'],i*31);
                const deadline=pick(['30 Apr 2026','31 May 2026','30 Jun 2026','AGM 2026','31 Dec 2026'],i*37);
                const escalation=pick(['Standard','Elevated','Critical','Watch','Pre-divest'],i*41);
                return(
                  <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                    <td style={{padding:'4px 6px',fontWeight:600,color:T.navy}}>{r.ticker}</td>
                    <td style={{padding:'4px 6px',fontFamily:T.mono,color:r.temp>3?T.red:T.amber}}>{r.temp.toFixed(1)}\u00B0C</td>
                    <td style={{padding:'4px 6px'}}><Badge text={r.sbti.replace('Target Set \u2014 ','').substring(0,8)} color={r.sbti==='None'?T.red:T.amber}/></td>
                    <td style={{padding:'4px 6px',fontFamily:T.mono,color:T.red,fontWeight:600}}>+{gap}\u00B0C</td>
                    <td style={{padding:'4px 6px',fontSize:9,color:T.textSec}}>{stage}</td>
                    <td style={{padding:'4px 6px',fontSize:9,color:T.textSec}}>{nextAction}</td>
                    <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}>{deadline}</td>
                    <td style={{padding:'4px 6px'}}><Badge text={escalation} color={escalation==='Critical'||escalation==='Pre-divest'?T.red:escalation==='Elevated'?T.amber:T.textMut}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Temperature distribution */}
      <Panel title="Portfolio Temperature Distribution">
        <div style={{display:'flex',alignItems:'flex-end',gap:8,height:140,justifyContent:'center'}}>
          {[
            {bucket:'<1.5\u00B0C',count:portfolioData.filter(r=>r.temp<1.5).length,color:T.green},
            {bucket:'1.5-2.0\u00B0C',count:portfolioData.filter(r=>r.temp>=1.5&&r.temp<2).length,color:T.sage},
            {bucket:'2.0-2.5\u00B0C',count:portfolioData.filter(r=>r.temp>=2&&r.temp<2.5).length,color:T.amber},
            {bucket:'2.5-3.0\u00B0C',count:portfolioData.filter(r=>r.temp>=2.5&&r.temp<3).length,color:'#f97316'},
            {bucket:'>3.0\u00B0C',count:portfolioData.filter(r=>r.temp>=3).length,color:T.red},
          ].map((b,i)=>{
            const maxCount=Math.max(...[portfolioData.filter(r=>r.temp<1.5).length,portfolioData.filter(r=>r.temp>=1.5&&r.temp<2).length,portfolioData.filter(r=>r.temp>=2&&r.temp<2.5).length,portfolioData.filter(r=>r.temp>=2.5&&r.temp<3).length,portfolioData.filter(r=>r.temp>=3).length]);
            return(
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',width:80}}>
                <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:4}}>{b.count}</span>
                <div style={{width:50,height:Math.max(8,(b.count/maxCount)*100),background:b.color,borderRadius:'4px 4px 0 0'}}/>
                <span style={{fontFamily:T.mono,fontSize:9,color:T.textMut,marginTop:4,textAlign:'center'}}>{b.bucket}</span>
              </div>
            );
          })}
        </div>
        <div style={{textAlign:'center',marginTop:12,fontSize:10,color:T.textSec}}>
          {portfolioData.filter(r=>r.temp<2).length} holdings ({(portfolioData.filter(r=>r.temp<2).length/portfolioData.length*100).toFixed(0)}%) below 2\u00B0C | {portfolioData.filter(r=>r.temp<1.5).length} holdings below 1.5\u00B0C
        </div>
      </Panel>

      {/* Sector pathway comparison */}
      <Panel title="Sector Pathway Comparison: Portfolio vs IEA NZE Benchmarks">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Sector','Portfolio Intensity','Sector Median','Paris 2030 Target','SBTi Method','Gap','Status'].map(h=>(
                  <th key={h} style={{padding:'6px 8px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectorAgg.slice(0,11).map((s,i)=>{
                const bench=SECTOR_BENCHMARKS.find(b=>s.sector.toLowerCase().includes(b.sector.toLowerCase().substring(0,5)));
                if(!bench)return null;
                const portIntensity=+(s.total/(s.weight*aggTotals.totalMktVal/100)*1e6).toFixed(0);
                const gap=portIntensity-bench.parisTarget2030;
                return(
                  <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                    <td style={{padding:'5px 8px',fontWeight:600,color:T.navy}}>{s.sector.substring(0,20)}</td>
                    <td style={{padding:'5px 8px',fontFamily:T.mono}}>{portIntensity}</td>
                    <td style={{padding:'5px 8px',fontFamily:T.mono}}>{bench.medianIntensity}</td>
                    <td style={{padding:'5px 8px',fontFamily:T.mono,color:T.green}}>{bench.parisTarget2030}</td>
                    <td style={{padding:'5px 8px'}}><Badge text={bench.sbtiMethod} color={T.navyL}/></td>
                    <td style={{padding:'5px 8px',fontFamily:T.mono,color:gap>0?T.red:T.green,fontWeight:600}}>{gap>0?'+':''}{gap}</td>
                    <td style={{padding:'5px 8px'}}><Badge text={gap<=0?'Aligned':gap<bench.medianIntensity*0.2?'Near':'Off-track'} color={gap<=0?T.green:gap<bench.medianIntensity*0.2?T.amber:T.red}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  // ── TAB 7: Data Quality & Lineage ──
  const renderDataQuality=()=>(
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        <select value={dqScope} onChange={e=>setDqScope(e.target.value)} style={{padding:'5px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.mono}}>
          <option value="All">All DQS Levels</option>
          {[1,2,3,4,5].map(n=><option key={n} value={n}>DQS {n}</option>)}
        </select>
        <select value={dqSort} onChange={e=>setDqSort(e.target.value)} style={{padding:'5px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.mono}}>
          <option value="dqs">Sort by DQS</option>
          <option value="total">Sort by Emissions</option>
        </select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        <KPICard label="Overall DQS" value={dqData.avgDqs.toFixed(1)} sub="Weighted average" color={dqData.avgDqs<=2?T.green:dqData.avgDqs<=3?T.amber:T.red}/>
        <KPICard label="DQS 1-2 (High)" value={dqData.hist[0]+dqData.hist[1]+' holdings'} sub={(((dqData.hist[0]+dqData.hist[1])/portfolioData.length)*100).toFixed(0)+'%'} color={T.green}/>
        <KPICard label="DQS 3 (Medium)" value={dqData.hist[2]+' holdings'} sub={((dqData.hist[2]/portfolioData.length)*100).toFixed(0)+'%'} color={T.amber}/>
        <KPICard label="DQS 4-5 (Low)" value={dqData.hist[3]+dqData.hist[4]+' holdings'} sub={(((dqData.hist[3]+dqData.hist[4])/portfolioData.length)*100).toFixed(0)+'%'} color={T.red}/>
      </div>

      {/* DQS Distribution Histogram */}
      <Panel title="Data Quality Score Distribution">
        <div style={{display:'flex',alignItems:'flex-end',gap:16,height:120,justifyContent:'center'}}>
          {dqData.hist.map((count,i)=>{
            const maxH=Math.max(...dqData.hist);
            return(
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',width:60}}>
                <span style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>{count}</span>
                <div style={{width:40,height:Math.max(4,(count/maxH)*90),background:i<=1?T.green:i===2?T.amber:T.red,borderRadius:'4px 4px 0 0'}}/>
                <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginTop:4}}>DQS {i+1}</span>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Emission factor lineage */}
      <Panel title="Emission Factor Lineage \u2014 Sample Entries">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Holding','Scope','Source Data','EF Applied','EF Source','Calculation','Result','DQS'].map(h=>(
                  <th key={h} style={{padding:'6px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolioData.slice(0,12).map((r,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                  <td style={{padding:'4px 6px',fontWeight:600,color:T.navy}}>{r.ticker}</td>
                  <td style={{padding:'4px 6px'}}>{pick(['Scope 1','Scope 2','Scope 3'],i*7)}</td>
                  <td style={{padding:'4px 6px',color:T.textSec}}>{pick(['CDP C6.1 reported','Annual report GHG inv.','Spend data ($4.2M)','Activity data (12k MWh)','Estimated from revenue'],i*11)}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono}}>{pick(['0.184 kgCO2e/kWh','0.42 kgCO2e/$','376 gCO2/kWh','2.71 kgCO2e/L','Sector avg'],i*13)}</td>
                  <td style={{padding:'4px 6px',color:T.textSec}}>{pick(['DEFRA 2023','EXIOBASE 3.8','Ember 2024','EPA USEEIO','PCAF v2'],i*17)}</td>
                  <td style={{padding:'4px 6px',color:T.textSec}}>{pick(['Direct measurement','Activity x EF','Spend x EEIO factor','Grid intensity x MWh','Revenue x sector avg'],i*19)}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontWeight:600}}>{fmtCO2(pick([r.s1,r.s2,Math.round(r.s3*0.25)],i*23))}</td>
                  <td style={{padding:'4px 6px'}}><DQSBadge score={r.dqs}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Data source breakdown */}
      <Panel title="Data Source Breakdown">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {Object.entries(dqData.bySource).map(([src,count],i)=>(
            <div key={i} style={{padding:10,background:T.surfaceH,borderRadius:6,textAlign:'center'}}>
              <div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:T.navy}}>{count}</div>
              <div style={{fontSize:11,color:T.textSec}}>{src.replace(/([A-Z])/g,' $1').trim()}</div>
              <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{(count/portfolioData.length*100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Data freshness */}
      <Panel title="Data Freshness">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {period:'< 3 months',count:Math.round(portfolioData.length*0.45),color:T.green},
            {period:'3-6 months',count:Math.round(portfolioData.length*0.30),color:T.amber},
            {period:'6-12 months',count:Math.round(portfolioData.length*0.15),color:T.amber},
            {period:'> 12 months',count:Math.round(portfolioData.length*0.07),color:T.red},
            {period:'Unknown',count:Math.round(portfolioData.length*0.03),color:T.textMut},
          ].map((p,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:T.surfaceH,borderRadius:4}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:p.color}}/>
              <span style={{fontSize:11,flex:1}}>{p.period}</span>
              <span style={{fontFamily:T.mono,fontSize:11,fontWeight:600}}>{p.count}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Improvement roadmap */}
      <Panel title="DQS Improvement Roadmap">
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[
            {action:'Switch 15 holdings from spend-based to supplier-specific Scope 3',impact:'DQS 3.2 \u2192 2.4',effort:'Medium',priority:'High'},
            {action:'Obtain CDP responses for 23 non-disclosing holdings',impact:'DQS 3.8 \u2192 2.1',effort:'High',priority:'High'},
            {action:'Update 2019 base year data with restated figures for 8 M&A-affected holdings',impact:'Audit readiness +15%',effort:'Medium',priority:'Medium'},
            {action:'Replace proxy estimates with PCAF-attributed data for 12 financial holdings',impact:'DQS 4.5 \u2192 2.8',effort:'Low',priority:'High'},
            {action:'Request Scope 3 Category 15 data from 10 asset management holdings',impact:'Coverage 42% \u2192 75%',effort:'High',priority:'Medium'},
          ].map((r,i)=>(
            <div key={i} style={{padding:'10px 14px',background:T.surfaceH,borderRadius:6,display:'flex',alignItems:'center',gap:12}}>
              <Badge text={r.priority} color={r.priority==='High'?T.red:T.amber}/>
              <span style={{fontSize:11,flex:1,color:T.navy}}>{r.action}</span>
              <span style={{fontSize:10,fontFamily:T.mono,color:T.green,minWidth:100}}>{r.impact}</span>
              <Badge text={r.effort} color={r.effort==='Low'?T.green:r.effort==='Medium'?T.amber:T.red}/>
            </div>
          ))}
        </div>
      </Panel>

      {/* Missing data flags */}
      <Panel title="Missing Data Flags \u2014 Prioritised Gap Resolution">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Holding','Scope','Gap Description','Current Method','Impact (tCO2e)','Recommended Action','Priority','Est. Effort'].map(h=>(
                  <th key={h} style={{padding:'6px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {holding:'JPM',scope:'Scope 3 Cat 15',gap:'Financed emissions not reported',method:'Revenue proxy',impact:2400000,action:'Request CDP C-FS14.1 disclosure',priority:'High',effort:'3 months'},
                {holding:'BRK.B',scope:'Scope 1,2,3',gap:'No GHG inventory published',method:'Sector average proxy',impact:850000,action:'Engage via Climate Action 100+',priority:'High',effort:'6 months'},
                {holding:'TSLA',scope:'Scope 3 Cat 11',gap:'Use-phase emissions uncertain',method:'EPA avg vehicle km',action:'Request vehicle fleet data',impact:1200000,priority:'Medium',effort:'2 months'},
                {holding:'AMZN',scope:'Scope 3 Cat 1',gap:'Supply chain EFs from spend only',method:'EEIO spend-based',impact:3500000,action:'Pilot supplier-specific program',priority:'High',effort:'12 months'},
                {holding:'XOM',scope:'Scope 3 Cat 11',gap:'Product combustion estimates',method:'API volume x DEFRA EF',impact:18000000,action:'Validate with annual report data',priority:'Medium',effort:'1 month'},
                {holding:'GOOGL',scope:'Scope 2',gap:'Market-based not disaggregated',method:'Location-based proxy',impact:450000,action:'Request REC/PPA documentation',priority:'Low',effort:'1 month'},
                {holding:'BAC',scope:'Scope 3 Cat 15',gap:'Financed emissions partial',method:'PCAF sector average',impact:5600000,action:'Request PCAF-compliant disclosure',priority:'High',effort:'4 months'},
                {holding:'NEE',scope:'Scope 1',gap:'Fugitive CH4 not separately reported',method:'EPA Subpart W proxy',impact:320000,action:'Request OGI survey data',priority:'Medium',effort:'2 months'},
                {holding:'PLD',scope:'Scope 3 Cat 13',gap:'Downstream leased emissions missing',method:'Not estimated',impact:180000,action:'Collect tenant energy data',priority:'Low',effort:'6 months'},
                {holding:'SO',scope:'Scope 1',gap:'Individual plant data aggregated',method:'Facility total',impact:22000000,action:'Request EPA GHGRP facility-level',priority:'Medium',effort:'1 month'},
              ].map((r,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                  <td style={{padding:'4px 6px',fontWeight:600,color:T.navy}}>{r.holding}</td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}>{r.scope}</td>
                  <td style={{padding:'4px 6px',color:T.textSec,fontSize:9}}>{r.gap}</td>
                  <td style={{padding:'4px 6px',fontSize:9}}><Badge text={r.method.substring(0,18)} color={T.amber}/></td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9}}>{fmtCO2(r.impact)}</td>
                  <td style={{padding:'4px 6px',fontSize:9,color:T.textSec}}>{r.action}</td>
                  <td style={{padding:'4px 6px'}}><Badge text={r.priority} color={r.priority==='High'?T.red:r.priority==='Medium'?T.amber:T.textMut}/></td>
                  <td style={{padding:'4px 6px',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{r.effort}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* GHG Protocol conformance checklist */}
      <Panel title="GHG Protocol Conformance Checklist">
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {[
            {req:'Organisational boundary defined (operational control)',status:'Complete',note:'Operational control approach used per Ch 3'},
            {req:'Scope 1 sources identified and categorised',status:'Complete',note:'4 source categories: stationary, mobile, process, fugitive'},
            {req:'Scope 2 dual reporting (location + market)',status:'Complete',note:'Both location-based and market-based reported per Scope 2 Guidance'},
            {req:'Scope 3 relevance assessment conducted',status:'Complete',note:'All 15 categories assessed; 12 deemed material'},
            {req:'Base year recalculation policy established',status:'Complete',note:'5% materiality threshold for structural changes'},
            {req:'Uncertainty assessment performed',status:'Partial',note:'Monte Carlo simulation for Scope 1/2; qualitative for Scope 3'},
            {req:'Data quality management procedures',status:'Complete',note:'DQS framework aligned with PCAF 1-5 scale'},
            {req:'Third-party verification obtained',status:'In Progress',note:'ISAE 3410 limited assurance for S1/S2; S3 planned Q2 2026'},
            {req:'Biogenic emissions separately reported',status:'Partial',note:'Biogenic CO2 tracked but not all biomass sources covered'},
            {req:'GHG removals separately accounted',status:'Complete',note:'Nature-based and technical removals tracked separately per E1-7'},
          ].map((r,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 10px',background:i%2===0?T.surfaceH:'transparent',borderRadius:4}}>
              <div style={{marginTop:2}}><Badge text={r.status} color={r.status==='Complete'?T.green:r.status==='In Progress'?T.amber:T.red}/></div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{r.req}</div>
                <div style={{fontSize:9,color:T.textSec,marginTop:2}}>{r.note}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Assurance readiness */}
      <Panel title="Assurance Readiness \u2014 ISAE 3000/3410">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {scope:'Scope 1',standard:'ISAE 3410',level:'Reasonable',readiness:92,evidence:'Direct measurement, calibrated meters, GHG inventory'},
            {scope:'Scope 2',standard:'ISAE 3410',level:'Reasonable',readiness:88,evidence:'Utility invoices, REGOs/RECs, grid factors'},
            {scope:'Scope 3 (Cat 1-8)',standard:'ISAE 3000',level:'Limited',readiness:65,evidence:'Mix of CDP, spend-based, proxy. Some supplier-specific'},
            {scope:'Scope 3 (Cat 9-14)',standard:'ISAE 3000',level:'Limited',readiness:42,evidence:'Primarily estimated. Limited downstream data'},
            {scope:'Scope 3 (Cat 15)',standard:'ISAE 3000',level:'Limited',readiness:38,evidence:'PCAF attribution. Mix of reported and estimated'},
            {scope:'Overall',standard:'ISAE 3410',level:'Limited',readiness:62,evidence:'Phased approach recommended for FY2025'},
          ].map((a,i)=>(
            <div key={i} style={{padding:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:600,color:T.navy}}>{a.scope}</span>
                <Badge text={a.level} color={a.level==='Reasonable'?T.green:T.amber}/>
              </div>
              <div style={{marginTop:6,display:'flex',alignItems:'center',gap:6}}>
                <div style={{flex:1,height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${a.readiness}%`,background:a.readiness>=80?T.green:a.readiness>=60?T.amber:T.red,borderRadius:3}}/>
                </div>
                <span style={{fontFamily:T.mono,fontSize:10,fontWeight:600}}>{a.readiness}%</span>
              </div>
              <div style={{fontSize:9,color:T.textMut,marginTop:4}}>{a.evidence}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );

  // ── TAB 8: Report Generator & Export ──
  const renderReportGenerator=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}}>
        {/* Report Configuration */}
        <Panel title="Report Configuration">
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <label style={{fontSize:10,fontFamily:T.mono,color:T.textMut,display:'block',marginBottom:4}}>TEMPLATE</label>
              <select value={rptTemplate} onChange={e=>setRptTemplate(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.mono}}>
                {['CDP Climate Change','CSRD E1','SFDR PAI','TCFD','GHG Inventory','Board Summary','Custom'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,fontFamily:T.mono,color:T.textMut,display:'block',marginBottom:4}}>DATE RANGE</label>
              <select value={rptDateRange} onChange={e=>setRptDateRange(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.mono}}>
                {['FY2024','CY2024','Q4 2025','Custom'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,fontFamily:T.mono,color:T.textMut,display:'block',marginBottom:4}}>SCOPE</label>
              <select value={rptScope} onChange={e=>setRptScope(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.mono}}>
                {['Full portfolio','Selected holdings','By sector','By geography'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,fontFamily:T.mono,color:T.textMut,display:'block',marginBottom:4}}>DETAIL LEVEL</label>
              <div style={{display:'flex',gap:4}}>
                {['Summary (2-page)','Standard (10-page)','Comprehensive (30-page)'].map(d=>(
                  <button key={d} onClick={()=>setRptDetail(d.split(' ')[0])} style={{padding:'4px 8px',borderRadius:4,fontSize:10,fontFamily:T.mono,border:`1px solid ${rptDetail===d.split(' ')[0]?T.gold:T.border}`,background:rptDetail===d.split(' ')[0]?T.gold+'20':T.surface,color:T.navy,cursor:'pointer',flex:1}}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:10,fontFamily:T.mono,color:T.textMut,display:'block',marginBottom:4}}>INCLUDE</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {['charts','tables','methodology','assurance','lineage'].map(inc=>(
                  <label key={inc} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,padding:'3px 6px',background:rptInclude.includes(inc)?T.gold+'20':T.surfaceH,borderRadius:4,cursor:'pointer'}}>
                    <input type="checkbox" checked={rptInclude.includes(inc)} onChange={e=>{if(e.target.checked)setRptInclude([...rptInclude,inc]);else setRptInclude(rptInclude.filter(x=>x!==inc));}}/>{inc}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:10,fontFamily:T.mono,color:T.textMut,display:'block',marginBottom:4}}>EXPORT FORMAT</label>
              <select value={rptFormat} onChange={e=>setRptFormat(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.mono}}>
                {['CSV (raw data)','JSON (structured)','PDF-ready (window.print)','CDP XML','XBRL/iXBRL (CSRD)'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Btn primary onClick={()=>alert(`Report generated: ${rptTemplate} | ${rptDateRange} | ${rptScope} | ${rptDetail} | ${rptFormat}`)}>Generate Report</Btn>
          </div>
        </Panel>

        {/* Preview panel */}
        <Panel title={`Preview \u2014 ${rptTemplate} (${rptDetail} | ${rptDateRange})`}>
          <div style={{fontSize:11,color:T.textSec}}>
            {rptTemplate==='GHG Inventory'&&(
              <div>
                <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:12,borderBottom:`2px solid ${T.gold}`,paddingBottom:6}}>GREENHOUSE GAS INVENTORY REPORT</div>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:12}}>Reporting Entity: {MOCK_PORTFOLIO.name} | Period: {rptDateRange} | Standard: GHG Protocol Corporate Standard</div>

                <div style={{fontWeight:700,color:T.navy,marginBottom:6}}>1. Executive Summary</div>
                <div style={{marginBottom:12}}>Total GHG emissions: {fmtCO2(aggTotals.totalGHG)}. Scope 1: {fmtCO2(aggTotals.totalS1)} | Scope 2 (location): {fmtCO2(aggTotals.totalS2)} | Scope 3: {fmtCO2(aggTotals.totalS3)}. Carbon intensity: {aggTotals.carbonIntensity} tCO2e/$M revenue.</div>

                <div style={{fontWeight:700,color:T.navy,marginBottom:6}}>2. Scope 1 \u2014 Direct Emissions</div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,marginBottom:12}}>
                  <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                    <th style={{padding:'4px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9}}>Source</th>
                    <th style={{padding:'4px 6px',textAlign:'right',fontFamily:T.mono,fontSize:9}}>tCO2e</th>
                    <th style={{padding:'4px 6px',textAlign:'right',fontFamily:T.mono,fontSize:9}}>% of S1</th>
                  </tr></thead>
                  <tbody>
                    {[{src:'Stationary Combustion',pct:45},{src:'Mobile Sources',pct:30},{src:'Process Emissions',pct:15},{src:'Fugitive Emissions',pct:10}].map((s,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                        <td style={{padding:'3px 6px'}}>{s.src}</td>
                        <td style={{padding:'3px 6px',textAlign:'right',fontFamily:T.mono}}>{fmtCO2(Math.round(aggTotals.totalS1*s.pct/100))}</td>
                        <td style={{padding:'3px 6px',textAlign:'right',fontFamily:T.mono}}>{s.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{fontWeight:700,color:T.navy,marginBottom:6}}>3. Scope 2 \u2014 Indirect Energy Emissions</div>
                <div style={{marginBottom:12}}>Location-based: {fmtCO2(aggTotals.totalS2)} | Market-based: {fmtCO2(aggTotals.totalS2Market)}. Difference driven by renewable energy procurement and REC retirement.</div>

                <div style={{fontWeight:700,color:T.navy,marginBottom:6}}>4. Scope 3 \u2014 Value Chain Emissions</div>
                <div style={{marginBottom:8}}>Total Scope 3: {fmtCO2(aggTotals.totalS3)} across 15 categories. Top contributors: Category 1 (Purchased Goods, 25%), Category 11 (Use of Products, 15%), Category 15 (Investments, 15%).</div>
              </div>
            )}

            {rptTemplate==='CSRD E1'&&(
              <div>
                <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:12,borderBottom:`2px solid ${T.gold}`,paddingBottom:6}}>ESRS E1 \u2014 CLIMATE CHANGE DISCLOSURE</div>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:12}}>Standard: ESRS E1 (EFRAG) | Period: {rptDateRange}</div>

                {['E1-1: Transition plan for climate change mitigation','E1-2: Policies related to climate change','E1-3: Actions and resources related to climate change','E1-4: Targets related to climate change','E1-5: Energy consumption and mix','E1-6: Gross Scopes 1, 2, 3 and Total GHG emissions','E1-7: GHG removals and carbon credits','E1-8: Internal carbon pricing','E1-9: Anticipated financial effects'].map((dr,i)=>(
                  <div key={i} style={{padding:'8px 10px',background:i%2===0?T.surfaceH:'transparent',borderRadius:4,marginBottom:2}}>
                    <div style={{fontWeight:600,fontSize:11,color:T.navy}}>{dr}</div>
                    <div style={{fontSize:10,color:T.textSec,marginTop:2}}>Status: <Badge text={i<6?'Complete':i<8?'In Progress':'Pending'} color={i<6?T.green:i<8?T.amber:T.red}/></div>
                  </div>
                ))}
              </div>
            )}

            {rptTemplate==='Board Summary'&&(
              <div>
                <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginBottom:12,borderBottom:`2px solid ${T.gold}`,paddingBottom:6}}>BOARD CLIMATE SUMMARY</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                  <div style={{padding:8,background:T.surfaceH,borderRadius:6,textAlign:'center'}}>
                    <div style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:T.navy}}>{fmtCO2(aggTotals.totalGHG)}</div>
                    <div style={{fontSize:10,color:T.textSec}}>Total GHG</div>
                  </div>
                  <div style={{padding:8,background:T.surfaceH,borderRadius:6,textAlign:'center'}}>
                    <div style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:aggTotals.avgTemp>2?T.red:T.green}}>{aggTotals.avgTemp.toFixed(1)}\u00B0C</div>
                    <div style={{fontSize:10,color:T.textSec}}>Temperature Score</div>
                  </div>
                  <div style={{padding:8,background:T.surfaceH,borderRadius:6,textAlign:'center'}}>
                    <div style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:T.green}}>{aggTotals.sbtiPct}%</div>
                    <div style={{fontSize:10,color:T.textSec}}>SBTi Aligned</div>
                  </div>
                </div>
                <div style={{fontSize:11,color:T.textSec}}>Key risks: Temperature overshoot, CBAM exposure, Scope 3 data gaps. Recommended actions: Escalate engagement with top 10 emitters, improve DQS to 2.0, submit CDP response by deadline.</div>
              </div>
            )}

            {!['GHG Inventory','CSRD E1','Board Summary'].includes(rptTemplate)&&(
              <div style={{padding:20,textAlign:'center',color:T.textMut}}>
                <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:8}}>{rptTemplate} Report Preview</div>
                <div>Select parameters and click "Generate Report" to preview formatted output.</div>
                <div style={{marginTop:12}}>Available data: {portfolioData.length} holdings | {regMapping.length} mapped data points | {dqData.avgDqs.toFixed(1)} avg DQS</div>
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Export format descriptions */}
      <Panel title="Available Export Formats">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {format:'CSV',desc:'Raw data tables with all holdings, emissions, scores. Suitable for data analysis and downstream systems.',icon:'\u{1F4CA}'},
            {format:'JSON',desc:'Structured, machine-readable format. Includes metadata, schemas, and nested relationships.',icon:'\u{1F4BB}'},
            {format:'PDF-ready',desc:'Formatted report with embedded charts via window.print(). Professional layout with headers/footers.',icon:'\u{1F4C4}'},
            {format:'CDP XML',desc:'CDP Climate Change questionnaire format. Pre-populated responses for C1-C12 modules.',icon:'\u{1F30D}'},
            {format:'XBRL/iXBRL',desc:'CSRD digital reporting format. References xbrlTaggingEngine.js for inline XBRL tagging.',icon:'\u{1F3F7}\uFE0F'},
            {format:'SFDR Template',desc:'SFDR PAI statement template (Table 1). Mandatory indicators pre-filled from portfolio data.',icon:'\u{1F4DC}'},
          ].map((f,i)=>(
            <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:6}}>
              <div style={{fontSize:16,marginBottom:4}}>{f.icon}</div>
              <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{f.format}</div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Audit log */}
      <Panel title="Report Audit Log">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Timestamp','User','Template','Period','Format','Holdings','Status'].map(h=>(
                  <th key={h} style={{padding:'6px 8px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {ts:'2026-03-28 14:32',user:'S. Chopra',tmpl:'GHG Inventory',period:'FY2024',format:'PDF',holdings:150,status:'Complete'},
                {ts:'2026-03-25 09:15',user:'S. Chopra',tmpl:'CSRD E1',period:'FY2024',format:'XBRL',holdings:150,status:'Complete'},
                {ts:'2026-03-20 16:45',user:'J. Williams',tmpl:'CDP Climate',period:'CY2024',format:'CDP XML',holdings:142,status:'Complete'},
                {ts:'2026-03-15 11:00',user:'S. Chopra',tmpl:'SFDR PAI',period:'Q4 2025',format:'CSV',holdings:150,status:'Complete'},
                {ts:'2026-03-10 08:30',user:'A. Patel',tmpl:'Board Summary',period:'YTD',format:'PDF',holdings:150,status:'Complete'},
                {ts:'2026-03-01 10:00',user:'S. Chopra',tmpl:'TCFD',period:'FY2024',format:'PDF',holdings:148,status:'Complete'},
              ].map((r,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                  <td style={{padding:'4px 8px',fontFamily:T.mono,color:T.textSec}}>{r.ts}</td>
                  <td style={{padding:'4px 8px'}}>{r.user}</td>
                  <td style={{padding:'4px 8px',fontWeight:600,color:T.navy}}>{r.tmpl}</td>
                  <td style={{padding:'4px 8px',fontFamily:T.mono}}>{r.period}</td>
                  <td style={{padding:'4px 8px'}}><Badge text={r.format} color={T.navyL}/></td>
                  <td style={{padding:'4px 8px',fontFamily:T.mono}}>{r.holdings}</td>
                  <td style={{padding:'4px 8px'}}><Badge text={r.status} color={T.green}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Carbon offset & removal portfolio */}
      <Panel title="Carbon Offset & Removal Portfolio">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:12}}>
          {Object.entries(CARBON_PRICES.voluntary).map(([key,data],i)=>{
            const volume=rangeInt(100,5000,i*43+9000);
            const cost=+(volume*data.price).toFixed(0);
            return(
              <div key={i} style={{padding:10,background:T.surfaceH,borderRadius:6}}>
                <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                  <div>
                    <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.green}}>{fmt(volume)} tCO2e</div>
                    <div style={{fontSize:9,color:T.textMut}}>Volume retired</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.gold}}>${fmt(cost)}</div>
                    <div style={{fontSize:9,color:T.textMut}}>@ ${data.price}/t</div>
                  </div>
                </div>
                <div style={{fontSize:8,color:T.textMut,marginTop:4}}>Source: {data.source.substring(0,30)}</div>
              </div>
            );
          })}
        </div>
        <div style={{padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6}}>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Offset Quality Assessment</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
            {[
              {criterion:'Additionality',score:4.2,max:5,desc:'Would emission reduction happen without project?'},
              {criterion:'Permanence',score:3.8,max:5,desc:'Will carbon stay sequestered >100 years?'},
              {criterion:'Measurability',score:4.0,max:5,desc:'Can reductions be accurately quantified?'},
              {criterion:'Leakage Risk',score:3.5,max:5,desc:'Does removal just shift emissions elsewhere?'},
              {criterion:'Co-benefits',score:4.5,max:5,desc:'Biodiversity, community, SDG contributions'},
            ].map((c,i)=>(
              <div key={i} style={{padding:8,textAlign:'center'}}>
                <div style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:c.score>=4?T.green:c.score>=3?T.amber:T.red}}>{c.score}</div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginTop:2}}>{c.criterion}</div>
                <div style={{height:4,background:T.surfaceH,borderRadius:2,marginTop:4,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(c.score/c.max)*100}%`,background:c.score>=4?T.green:c.score>=3?T.amber:T.red,borderRadius:2}}/>
                </div>
                <div style={{fontSize:8,color:T.textMut,marginTop:4}}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Voluntary carbon market pricing reference */}
      <Panel title="Voluntary Carbon Market \u2014 Credit Price Benchmarks (2024)">
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {Object.entries(CARBON_PRICES.voluntary).map(([key,data],i)=>(
            <div key={i} style={{padding:'8px 14px',background:T.surfaceH,borderRadius:6,minWidth:120,textAlign:'center'}}>
              <div style={{fontSize:10,color:T.textSec}}>{key.replace(/_/g,' ')}</div>
              <div style={{fontFamily:T.mono,fontSize:16,fontWeight:700,color:T.navy,marginTop:2}}>${data.price}</div>
              <div style={{fontSize:8,fontFamily:T.mono,color:T.textMut}}>/tCO2e</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Compliance market pricing reference */}
      <Panel title="Compliance Carbon Market Prices (Q1 2025)">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {Object.entries(CARBON_PRICES.compliance).map(([key,data],i)=>(
            <div key={i} style={{padding:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{key.replace(/_/g,' ')}</div>
                <div style={{fontSize:9,color:T.textMut}}>{data.source.substring(0,35)}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:T.mono,fontSize:16,fontWeight:700,color:T.navy}}>{data.currency==='EUR'?'\u20AC':data.currency==='GBP'?'\u00A3':data.currency==='NZD'?'NZ$':'$'}{data.price}</div>
                <div style={{fontSize:8,fontFamily:T.mono,color:T.textMut}}>/tCO2e ({data.year})</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Scheduled reports */}
      <Panel title="Scheduled Reports (UI Configuration)">
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[
            {name:'Monthly Board Summary',freq:'Monthly (1st)',template:'Board Summary',format:'PDF',next:'1 Apr 2026',status:'Active'},
            {name:'Quarterly SFDR PAI',freq:'Quarterly',template:'SFDR PAI',format:'CSV + PDF',next:'1 Apr 2026',status:'Active'},
            {name:'Annual GHG Inventory',freq:'Annual (Jan)',template:'GHG Inventory',format:'PDF + XBRL',next:'15 Jan 2027',status:'Active'},
            {name:'CDP Submission',freq:'Annual (Jul)',template:'CDP Climate',format:'CDP XML',next:'31 Jul 2026',status:'Pending setup'},
          ].map((s,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12px',background:T.surfaceH,borderRadius:6}}>
              <Badge text={s.status} color={s.status==='Active'?T.green:T.amber}/>
              <span style={{fontWeight:600,fontSize:11,color:T.navy,flex:1}}>{s.name}</span>
              <span style={{fontSize:10,fontFamily:T.mono,color:T.textSec}}>{s.freq}</span>
              <span style={{fontSize:10,fontFamily:T.mono,color:T.textSec}}>{s.template}</span>
              <span style={{fontSize:10,fontFamily:T.mono,color:T.textSec}}>{s.format}</span>
              <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>Next: {s.next}</span>
              <Btn small>Edit</Btn>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════
   * MAIN RENDER
   * ═══════════════════════════════════════════════════════════════════════════ */
  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',color:T.text}}>
      {/* Header */}
      <div style={{background:T.navy,padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:'#fff',letterSpacing:0.5}}>Integrated Carbon Emissions</div>
          <div style={{fontSize:11,color:T.goldL,fontFamily:T.mono,marginTop:2}}>Master Control Room &mdash; {MOCK_PORTFOLIO.name} &mdash; {portfolioData.length} holdings &mdash; AUM ${(MOCK_PORTFOLIO.aum/1e9).toFixed(0)}B</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{padding:'4px 10px',background:T.gold+'30',borderRadius:4,fontSize:11,fontFamily:T.mono,color:'#fff'}}>Last refresh: 28 Mar 2026 14:32 UTC</div>
          <div style={{width:8,height:8,borderRadius:'50%',background:T.green}} title="System healthy"/>
        </div>
      </div>

      {/* Gold accent line */}
      <div style={{height:2,background:`linear-gradient(to right, ${T.gold}, ${T.goldL}, ${T.gold})`}}/>

      {/* Tab bar */}
      <div style={{padding:'0 24px',background:T.surface,borderBottom:`1px solid ${T.border}`}}>
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab}/>
      </div>

      {/* Content */}
      <div style={{padding:'20px 24px',maxWidth:1440,margin:'0 auto'}}>
        {activeTab===0&&renderDashboard()}
        {activeTab===1&&renderWaterfall()}
        {activeTab===2&&renderPortfolio()}
        {activeTab===3&&renderRegulatory()}
        {activeTab===4&&renderPricing()}
        {activeTab===5&&renderPathway()}
        {activeTab===6&&renderDataQuality()}
        {activeTab===7&&renderReportGenerator()}
      </div>

      {/* Cross-module data flow summary */}
      <div style={{padding:'12px 24px',background:T.surfaceH,borderTop:`1px solid ${T.border}`,marginBottom:28}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',maxWidth:1440,margin:'0 auto'}}>
          <div style={{display:'flex',gap:16,alignItems:'center',fontSize:10}}>
            <span style={{fontFamily:T.mono,color:T.gold,fontWeight:600}}>DATA PIPELINE</span>
            <span style={{color:T.textSec}}>12 source modules</span>
            <span style={{color:T.textMut}}>\u2192</span>
            <span style={{color:T.textSec}}>262 data points aggregated</span>
            <span style={{color:T.textMut}}>\u2192</span>
            <span style={{color:T.textSec}}>7 regulatory frameworks mapped</span>
            <span style={{color:T.textMut}}>\u2192</span>
            <span style={{color:T.textSec}}>6 export formats available</span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>Pipeline health: <span style={{color:T.green}}>NOMINAL</span></span>
            <span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>ETL lag: <span style={{color:T.green}}>2.4s</span></span>
            <span style={{fontFamily:T.mono,fontSize:9,color:T.textMut}}>Cache: <span style={{color:T.green}}>HIT</span></span>
          </div>
        </div>
      </div>

      {/* Maritime & Aviation sector-specific emissions */}
      {activeTab===0&&(
        <div style={{padding:'0 24px 20px',maxWidth:1440,margin:'0 auto'}}>
          <Panel title="Sector-Specific Emissions: Maritime (IMO CII) & Aviation (CORSIA)">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Maritime Fleet \u2014 IMO CII Ratings</div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${T.border}`}}>
                      {['Vessel Type','Count','Avg CII','Rating','Trend','Emissions'].map(h=>(
                        <th key={h} style={{padding:'4px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {type:'Bulk Carrier',count:12,cii:8.2,rating:'C',trend:'-3.1%',emissions:145000},
                      {type:'Container Ship',count:8,cii:12.5,rating:'B',trend:'-5.2%',emissions:320000},
                      {type:'Oil Tanker',count:5,cii:6.8,rating:'D',trend:'+1.4%',emissions:210000},
                      {type:'LNG Carrier',count:3,cii:9.1,rating:'C',trend:'-2.8%',emissions:85000},
                      {type:'Ro-Ro',count:4,cii:15.3,rating:'B',trend:'-4.5%',emissions:96000},
                    ].map((v,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                        <td style={{padding:'3px 6px',fontWeight:600,color:T.navy}}>{v.type}</td>
                        <td style={{padding:'3px 6px',fontFamily:T.mono}}>{v.count}</td>
                        <td style={{padding:'3px 6px',fontFamily:T.mono}}>{v.cii}</td>
                        <td style={{padding:'3px 6px'}}><Badge text={v.rating} color={v.rating==='A'||v.rating==='B'?T.green:v.rating==='C'?T.amber:T.red}/></td>
                        <td style={{padding:'3px 6px',fontFamily:T.mono,color:v.trend.startsWith('-')?T.green:T.red}}>{v.trend}</td>
                        <td style={{padding:'3px 6px',fontFamily:T.mono}}>{fmtCO2(v.emissions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Aviation \u2014 CORSIA Compliance</div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${T.border}`}}>
                      {['Airline','Routes','Baseline (2019)','Current','Offset Req.','SAF %'].map(h=>(
                        <th key={h} style={{padding:'4px 6px',textAlign:'left',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {airline:'BA (IAG)',routes:'Intl',baseline:18200,current:16800,offset:1400,saf:2.1},
                      {airline:'Lufthansa',routes:'Intl',baseline:22500,current:20100,offset:2400,saf:3.2},
                      {airline:'Delta',routes:'Intl',baseline:28000,current:25500,offset:0,saf:1.8},
                      {airline:'Singapore Air',routes:'Intl',baseline:12400,current:11200,offset:1200,saf:4.5},
                      {airline:'Qantas',routes:'Intl',baseline:8900,current:8200,offset:700,saf:2.8},
                    ].map((a,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${T.surfaceH}`}}>
                        <td style={{padding:'3px 6px',fontWeight:600,color:T.navy}}>{a.airline}</td>
                        <td style={{padding:'3px 6px',fontFamily:T.mono,fontSize:9}}>{a.routes}</td>
                        <td style={{padding:'3px 6px',fontFamily:T.mono}}>{fmt(a.baseline)} kt</td>
                        <td style={{padding:'3px 6px',fontFamily:T.mono}}>{fmt(a.current)} kt</td>
                        <td style={{padding:'3px 6px',fontFamily:T.mono,color:a.offset>0?T.amber:T.green}}>{a.offset>0?fmt(a.offset)+' kt':'Exempt'}</td>
                        <td style={{padding:'3px 6px',fontFamily:T.mono,color:a.saf>=3?T.green:T.amber}}>{a.saf}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>

          <Panel title="Cross-Module Data Quality Summary">
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
              {[
                {module:'GHG Calculator',fields:42,complete:40,dqs:1.8},
                {module:'PCAF Engine',fields:28,complete:26,dqs:2.4},
                {module:'Scope 3 Tracker',fields:36,complete:28,dqs:3.2},
                {module:'SBTi Targets',fields:18,complete:16,dqs:1.5},
                {module:'CSRD E1',fields:54,complete:48,dqs:2.1},
                {module:'SFDR PAI',fields:18,complete:17,dqs:1.9},
                {module:'Carbon Budget',fields:14,complete:14,dqs:1.2},
                {module:'CBAM Module',fields:22,complete:15,dqs:3.5},
                {module:'Maritime CII',fields:16,complete:10,dqs:3.8},
                {module:'CORSIA',fields:14,complete:8,dqs:4.0},
                {module:'Temp Score',fields:8,complete:8,dqs:2.0},
                {module:'Avoided Em.',fields:12,complete:7,dqs:3.9},
              ].map((m,i)=>(
                <div key={i} style={{padding:8,background:T.surfaceH,borderRadius:4,textAlign:'center'}}>
                  <div style={{fontSize:9,fontWeight:600,color:T.navy}}>{m.module}</div>
                  <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.navy,marginTop:2}}>{m.complete}/{m.fields}</div>
                  <div style={{height:3,background:T.border,borderRadius:2,marginTop:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${(m.complete/m.fields)*100}%`,background:m.complete/m.fields>=0.9?T.green:m.complete/m.fields>=0.7?T.amber:T.red,borderRadius:2}}/>
                  </div>
                  <div style={{fontSize:8,color:T.textMut,marginTop:2}}>DQS {m.dqs}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* Terminal status bar */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,height:28,background:T.navy,display:'flex',alignItems:'center',padding:'0 16px',gap:16,zIndex:100}}>
        <span style={{fontFamily:T.mono,fontSize:10,color:T.gold}}>ICE</span>
        <span style={{fontFamily:T.mono,fontSize:10,color:'#fff',opacity:0.7}}>Holdings: {portfolioData.length}</span>
        <span style={{fontFamily:T.mono,fontSize:10,color:'#fff',opacity:0.7}}>Total GHG: {fmtCO2(aggTotals.totalGHG)}</span>
        <span style={{fontFamily:T.mono,fontSize:10,color:'#fff',opacity:0.7}}>WACI: {aggTotals.waci.toFixed(1)} tCO2e/$M</span>
        <span style={{fontFamily:T.mono,fontSize:10,color:'#fff',opacity:0.7}}>Temp: {aggTotals.avgTemp.toFixed(1)}\u00B0C</span>
        <span style={{fontFamily:T.mono,fontSize:10,color:'#fff',opacity:0.7}}>SBTi: {aggTotals.sbtiPct}%</span>
        <span style={{fontFamily:T.mono,fontSize:10,color:'#fff',opacity:0.7}}>DQS: {dqData.avgDqs.toFixed(1)}</span>
        <span style={{marginLeft:'auto',fontFamily:T.mono,fontSize:10,color:T.gold}}>12 source modules integrated</span>
      </div>
    </div>
  );
}
