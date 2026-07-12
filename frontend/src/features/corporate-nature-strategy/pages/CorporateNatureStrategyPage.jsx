import React,{useState,useMemo,useEffect} from 'react';
import axios from 'axios';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,ZAxis} from 'recharts';
const T={bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
// Backend E80 Corporate Nature Strategy & SBTN engine (SBTN v1.1 5-step / TNFD
// v1.0 LEAP disclosure / EU NRL 2024/1991 / GBF Target 3 30x30 / ENCORE v2.1).
// See backend/services/corporate_nature_strategy_engine.py + backend/api/v1/routes/corporate_nature_strategy.py
const API=process.env.REACT_APP_BACKEND_URL||'http://localhost:8001';const NATURE_API=`${API}/api/v1/corporate-nature-strategy`;
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899','#06b6d4'];const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:12},labelStyle:{color:T.navy,fontWeight:600}};const PAGE=12;const TABS=['Strategy Dashboard','Company Assessment','TNFD Alignment','Action Tracker'];
const F1=['Agriculture','Mining','Food & Bev','Chemicals','Pharma','Forestry','Tourism','Construction'];const F2=['North America','Europe','Asia-Pacific','Latin America','Africa','Oceania'];
const ITEMS=Array.from({length:55},(_,i)=>({id:i+1,name:'Nature Strategy '+(i+1),sector:F1[Math.floor(sr(i*3)*F1.length)],region:F2[Math.floor(sr(i*7)*F2.length)],score:+(sr(i*11)*40+50).toFixed(1),rating:['AAA','AA','A','BBB','BB','B'][Math.floor(sr(i*13)*6)],coverage:+(sr(i*17)*30+60).toFixed(1),risk:+(sr(i*19)*50+10).toFixed(1),compliance:+(sr(i*23)*40+50).toFixed(1),impact:+(sr(i*29)*60+20).toFixed(1),trend:sr(i*31)>0.5?'Improving':'Stable',quality:['High','Medium','Low'][Math.floor(sr(i*37)*3)],value:+(sr(i*41)*5000+100).toFixed(0),pct1:+(sr(i*43)*40+20).toFixed(1),pct2:+(sr(i*47)*30+15).toFixed(1),flag1:sr(i*53)>0.3,flag2:sr(i*59)>0.35}));const TS=Array.from({length:12},(_,i)=>({period:''+(2015+i),v1:+(sr(i*61)*30+40).toFixed(1),v2:+(sr(i*67)*20+30).toFixed(1),v3:+(sr(i*71)*15+10).toFixed(1)}));const exportCSV=(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};

// ---------------------------------------------------------------------------
// Live-API mapping — translate each locally-seeded "Nature Strategy N" row into
// the POST /full-assessment request shape CorporateNatureStrategyEngine expects
// (NatureFullAssessmentRequest: sectors/locations/current_targets/disclosures +
// governance_data/strategy_data/risk_data/metrics_data + operations/
// supply_chain_countries/portfolio_locations + operations_data), then map the
// engine's real component_scores/nature_strategy_score/maturity_tier back onto
// the display fields. No new randomness is introduced: every disclosure
// boolean below is deterministically derived from the item's existing seeded
// fields (same convention as AI Governance's sysToApiPayload).
// ---------------------------------------------------------------------------
const SECTOR_TO_ENGINE_KEY={'Agriculture':'agriculture_and_forestry','Forestry':'agriculture_and_forestry','Mining':'mining_and_materials','Food & Bev':'food_and_beverage','Chemicals':'chemicals','Pharma':'pharmaceuticals_and_healthcare','Tourism':'tourism_and_hospitality','Construction':'construction_and_real_estate'};
const REGION_TO_COUNTRY={'North America':'US','Europe':'DE','Asia-Pacific':'SG','Latin America':'BR','Africa':'ZA','Oceania':'AU'};
const SECTOR_TO_LAND_USE={'Agriculture':'extensive_agriculture','Forestry':'plantation_forestry','Mining':'mining_quarrying','Food & Bev':'intensive_agriculture','Chemicals':'urban_built_up','Pharma':'urban_built_up','Tourism':'lightly_used_natural','Construction':'urban_built_up'};
const SECTOR_TO_HABITAT={'Agriculture':'agricultural_land','Forestry':'forests','Mining':'rocky_habitats','Food & Bev':'agricultural_land','Chemicals':'urban_green_infrastructure','Pharma':'urban_green_infrastructure','Tourism':'marine_and_coastal','Construction':'urban_green_infrastructure'};
// TNFD 14-metric field keys (must match `metric.lower().replace(' ','_')` in
// TNFD_DISCLOSURE_REQUIREMENTS so the engine recognises them as disclosed).
const TNFD_GOV_KEYS=['board_oversight','management_responsibilities','policies_and_commitments'];
const TNFD_STRAT_KEYS=['nature-related_risks_and_opportunities','business_model_impacts','scenario_analysis','transition_planning'];
const TNFD_RISK_KEYS=['risk_identification_processes','risk_prioritisation','integration_into_enterprise_risk'];
const TNFD_METRIC_KEYS=['land/water/ocean_use_metrics','biodiversity_footprint','ecosystem_services_dependency','targets_and_progress'];
// Turn a 0-100 "disclosure completeness" figure into booleans over an ordered
// key list — e.g. compliance=70 -> first 70% of keys marked disclosed=true.
const keysToBooleans=(keys,pct)=>{const n=Math.round((pct/100)*keys.length);return Object.fromEntries(keys.map((k,i)=>[k,i<n]));};
const itemToNaturePayload=(item)=>{
  const engineSector=SECTOR_TO_ENGINE_KEY[item.sector]||'financial_services';
  const country=REGION_TO_COUNTRY[item.region]||'US';
  const landUse=SECTOR_TO_LAND_USE[item.sector]||'intensive_agriculture';
  const habitat=SECTOR_TO_HABITAT[item.sector]||'agricultural_land';
  const areaHa=Math.round(item.value*0.6+item.pct1*8);
  const disclosures={
    sbtn_materiality_screening:item.flag2,
    leap_locate_complete:item.flag1,
    encore_dependency_assessment:item.coverage>65,
    state_of_nature_report:item.coverage>78,
    scenario_analysis_nature:item.compliance>72,
    msa_footprint_calculated:item.quality==='High',
    biodiversity_footprint:item.pct1>35,
    water_metrics_disclosed:item.pct2>28,
    tnfd_disclosure:item.flag1,
    annual_progress_report:item.trend==='Improving',
    third_party_verification:item.quality==='High'&&item.flag2,
  };
  return {
    entity_id:`NATURE-${item.id}`,
    sectors:[engineSector],
    locations:[{lat:0,lng:0,country,area_ha:areaHa,site_name:item.name+' Site 1',land_use_type:landUse,protected_area_overlap:item.pct1>50,degradation_level:Math.min(1,item.risk/100)}],
    current_targets:item.flag2?[{framework:'SBTN',type:'land',description:'Science-based land target',target_year:2030,baseline_year:2020}]:[],
    disclosures,
    governance_data:keysToBooleans(TNFD_GOV_KEYS,item.compliance),
    strategy_data:{...keysToBooleans(TNFD_STRAT_KEYS,item.compliance),leap_approach:item.flag1},
    risk_data:keysToBooleans(TNFD_RISK_KEYS,item.compliance),
    metrics_data:keysToBooleans(TNFD_METRIC_KEYS,item.compliance),
    operations:[{site_name:item.name+' Site 1',country,area_ha:areaHa,habitat_types:[habitat],degradation_level:Math.min(1,item.risk/100),restoration_plan_filed:item.trend==='Improving'}],
    supply_chain_countries:[country],
    portfolio_locations:[{country,exposure_m:item.value,asset_type:'land',asset_name:item.name}],
    operations_data:{annual_revenue_m:item.value,operational_area_ha:areaHa},
  };
};
// Merge one /full-assessment response back onto the seeded item's display
// fields — real engine outputs replace the sr()-seeded placeholders.
const RATING_BY_TIER={leading:'AAA',advanced:'AA',developing:'A',early:'BB',minimal:'B'};
const mergeNatureResult=(item,res)=>{
  if(!res)return item;
  const cs=res.component_scores||{};
  const tnfd=res.tnfd_result||{};
  const totalMetrics=tnfd.total_metrics_assessed||14;
  const gapsCount=(tnfd.mandatory_gaps_count||0)+(tnfd.optional_gaps_count||0);
  return {
    ...item,
    score:res.nature_strategy_score,
    rating:RATING_BY_TIER[res.maturity_tier]||item.rating,
    coverage:+(((totalMetrics-gapsCount)/totalMetrics)*100).toFixed(1),
    risk:+Math.max(0,100-res.nature_strategy_score).toFixed(1),
    compliance:cs.tnfd_score!=null?cs.tnfd_score:item.compliance,
    impact:+Math.min(100,(res.encore_result?.total_financial_exposure_m_usd)||item.impact).toFixed(1),
    trend:(res.priority_actions||[]).length<=1?'Improving':'Stable',
    quality:res.maturity_tier==='leading'||res.maturity_tier==='advanced'?'High':res.maturity_tier==='developing'?'Medium':'Low',
    pct1:cs.sbtn_score!=null?cs.sbtn_score:item.pct1,
    pct2:res.gbf_result?.portfolio_protected_zone_pct!=null?res.gbf_result.portfolio_protected_zone_pct:item.pct2,
    flag1:cs.tnfd_score!=null?cs.tnfd_score>=60:item.flag1,
    flag2:cs.sbtn_score!=null?cs.sbtn_score>=60:item.flag2,
    _live:true,
    _liveResult:res,
  };
};
export default function CorporateNatureStrategyPage(){const [tab,setTab]=useState(0);const [search,setSearch]=useState('');const [sortCol,setSortCol]=useState('score');const [sortDir,setSortDir]=useState('desc');const [page,setPage]=useState(0);const [expanded,setExpanded]=useState(null);const [f1,sf1]=useState('All');const [f2,sf2]=useState('All');

// --- Live backend wiring (E80 Corporate Nature Strategy engine) ---------
// Runs POST /full-assessment for each of the 55 seeded companies and merges
// the engine's real SBTN/TNFD/NRL/GBF/ENCORE composite scores back onto the
// display fields. Falls back to the seeded (sr() PRNG) figures, clearly
// labeled "Demo Data", if the API is unreachable or the calls fail.
const [liveResults,setLiveResults]=useState(null);
const [liveStatus,setLiveStatus]=useState('loading'); // 'loading' | 'live' | 'partial' | 'demo'
useEffect(()=>{
  let cancelled=false;
  (async()=>{
    try{
      const settled=await Promise.allSettled(ITEMS.map(item=>axios.post(`${NATURE_API}/full-assessment`,itemToNaturePayload(item),{timeout:15000})));
      if(cancelled)return;
      const byId={};let okCount=0;
      settled.forEach((r,i)=>{
        if(r.status==='fulfilled'&&r.value?.data?.nature_strategy_assessment){
          byId[ITEMS[i].id]=r.value.data.nature_strategy_assessment;okCount++;
        }
      });
      if(okCount===0){setLiveStatus('demo');setLiveResults(null);}
      else{setLiveResults(byId);setLiveStatus(okCount===ITEMS.length?'live':'partial');}
    }catch(e){if(!cancelled){setLiveStatus('demo');setLiveResults(null);}}
  })();
  return()=>{cancelled=true;};
},[]);

// Merge live engine results onto the seeded inventory, matched by item id.
// Items the API didn't return for (partial failure) keep seeded demo values.
const enrichedItems=useMemo(()=>{
  if(!liveResults)return ITEMS;
  return ITEMS.map(item=>mergeNatureResult(item,liveResults[item.id]));
},[liveResults]);

const filtered=useMemo(()=>{let d=[...enrichedItems];if(search)d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));if(f1!=='All')d=d.filter(x=>x.sector===f1);if(f2!=='All')d=d.filter(x=>x.region===f2);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));return d;},[enrichedItems,search,sortCol,sortDir,f1,f2]);const paged=filtered.slice(page*PAGE,page*PAGE+PAGE);const totalPages=Math.ceil(filtered.length/PAGE);const doSort=col=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(0);};
const SH=({col,label,w})=><th onClick={()=>doSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,width:w,userSelect:'none',whiteSpace:'nowrap'}}>{label}{sortCol===col?(sortDir==='asc'?' \u25B2':' \u25BC'):''}</th>;
const Pg=()=><div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14}}><button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1,fontSize:12}}>Prev</button>{Array.from({length:Math.min(totalPages,7)},(_,i)=>{const p=totalPages<=7?i:page<3?i:page>totalPages-4?totalPages-7+i:page-3+i;return <button key={p} onClick={()=>setPage(p)} style={{padding:'6px 12px',border:`1px solid ${page===p?T.gold:T.border}`,borderRadius:6,background:page===p?T.gold:'transparent',color:page===p?'#fff':T.text,cursor:'pointer',fontWeight:page===p?700:400,fontSize:12}}>{p+1}</button>;})}<button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page>=totalPages-1?'default':'pointer',opacity:page>=totalPages-1?0.4:1,fontSize:12}}>Next</button></div>;
const kpis=useMemo(()=>{const n=filtered.length||1;return[{l:'Companies',v:filtered.length},{l:'Avg Score',v:(filtered.reduce((s,x)=>s+parseFloat(x.score),0)/n).toFixed(1)},{l:'Avg Coverage',v:(filtered.reduce((s,x)=>s+parseFloat(x.coverage),0)/n).toFixed(1)+'%'},{l:'Avg Risk',v:(filtered.reduce((s,x)=>s+parseFloat(x.risk),0)/n).toFixed(1)},{l:'Aligned',v:filtered.filter(x=>parseFloat(x.compliance)>70).length}];},[filtered]);
const d1=useMemo(()=>{const m={};F1.forEach(s=>m[s]=0);filtered.forEach(x=>m[x.sector]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value}));},[filtered]);const d2=useMemo(()=>{const m={};F2.forEach(r=>m[r]=0);filtered.forEach(x=>m[x.region]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({name,value}));},[filtered]);
const renderDash=()=>(<div><div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>{kpis.map((k,i)=><div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{k.l}</div><div style={{fontSize:24,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div></div>)}</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Nature Strategy Trend</div><ResponsiveContainer width="100%" height={280}><AreaChart data={TS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="period" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Area type="monotone" dataKey="v1" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="TNFD Score"/><Area type="monotone" dataKey="v2" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Biodiversity Index"/></AreaChart></ResponsiveContainer></div>
<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Sector Distribution</div><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={d1} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{d1.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div></div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Regional Breakdown</div><ResponsiveContainer width="100%" height={260}><BarChart data={d2} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="name" type="category" width={100} tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={T.sage} radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div>
<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Dependency Trend</div><ResponsiveContainer width="100%" height={260}><LineChart data={TS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="period" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="v3" stroke={T.red} strokeWidth={2} name="Nature Dependency"/></LineChart></ResponsiveContainer></div></div>
<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Score vs Risk</div><ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Score" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="Risk" tick={{fontSize:10,fill:T.textMut}}/><ZAxis dataKey="z" range={[40,400]}/><Tooltip {...tip}/><Scatter data={filtered.map(x=>({name:x.name,x:parseFloat(x.score),y:parseFloat(x.risk),z:parseFloat(x.value)/50}))} fill={T.navy} fillOpacity={0.5}/></ScatterChart></ResponsiveContainer></div></div>);
const renderTable=()=>(<div><div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}><input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search companies..." style={{flex:1,minWidth:200,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}/><select value={f1} onChange={e=>{sf1(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Sectors</option>{F1.map(s=><option key={s} value={s}>{s}</option>)}</select><select value={f2} onChange={e=>{sf2(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Regions</option>{F2.map(r=><option key={r} value={r}>{r}</option>)}</select><button onClick={()=>exportCSV(filtered,'nature_strategy.csv')} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button></div>
<div style={{fontSize:12,color:T.textMut,marginBottom:8,fontFamily:T.mono}}>{filtered.length} companies | Page {page+1}/{totalPages}</div>
<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{background:T.surfaceH}}><SH col="name" label="Company" w="150px"/><SH col="score" label="Score"/><SH col="rating" label="Rating"/><SH col="coverage" label="Coverage %"/><SH col="risk" label="Risk"/><SH col="compliance" label="TNFD Score"/><SH col="impact" label="Impact"/><SH col="value" label="Revenue"/><SH col="trend" label="Trend"/></tr></thead>
<tbody>{paged.map(item=>(<React.Fragment key={item.id}><tr onClick={()=>setExpanded(expanded===item.id?null:item.id)} style={{cursor:'pointer',background:expanded===item.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}><td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{expanded===item.id?'\u25BC':'\u25B6'} {item.name} <span title={item._live?'Live \u2014 engine-computed':'Demo Data \u2014 API unavailable'} style={{marginLeft:6,fontSize:9,fontWeight:700,color:item._live?'#166534':'#92400e'}}>{item._live?'\u25CF LIVE':'\u25CB DEMO'}</span></td><td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(item.score)>70?T.green:T.navy}}>{item.score}</td><td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:T.surfaceH,color:T.navy}}>{item.rating}</span></td><td style={{padding:'10px 8px',fontFamily:T.mono}}>{item.coverage}%</td><td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(item.risk)>35?T.red:T.green}}>{item.risk}</td><td style={{padding:'10px 8px',fontFamily:T.mono}}>{item.compliance}</td><td style={{padding:'10px 8px',fontFamily:T.mono}}>{item.impact}</td><td style={{padding:'10px 8px',fontFamily:T.mono}}>{fmt(parseFloat(item.value))}</td><td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:item.trend==='Improving'?'#d1fae5':'#fef3c7',color:item.trend==='Improving'?'#065f46':'#92400e'}}>{item.trend}</span></td></tr>
{expanded===item.id&&(<tr><td colSpan={9} style={{padding:20,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}><div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Details</div>{[['Sector',item.sector],['Region',item.region],['Quality',item.quality],['Biodiversity Dep',item.pct1+'%'],['Ecosystem Service',item.pct2+'%'],['TNFD Aligned',item.flag1?'Yes':'No'],['SBTN Committed',item.flag2?'Yes':'No']].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>)}</div><div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Analysis {item._live&&<span style={{fontSize:9,fontWeight:700,color:'#166534'}}>● LIVE ENGINE OUTPUT</span>}</div><div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>{item._live&&item._liveResult?(<><p>{item._liveResult.maturity_description}</p><p><b>Investor signal:</b> {item._liveResult.investor_signal}</p>{item._liveResult.priority_actions?.length>0&&<p><b>Priority actions:</b> {item._liveResult.priority_actions.join('; ')}</p>}{item._liveResult.regulatory_flags?.length>0&&<p><b>Regulatory flags:</b> {item._liveResult.regulatory_flags.join('; ')}</p>}</>):(<><p>Nature strategy assessment for {item.name} with score {item.score} and {item.quality} data quality.</p><p>Risk level at {item.risk} with TNFD alignment at {item.compliance}.</p></>)}</div></div><div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Profile</div><ResponsiveContainer width="100%" height={200}><RadarChart data={[{m:'Score',v:parseFloat(item.score)},{m:'Coverage',v:parseFloat(item.coverage)},{m:'TNFD',v:parseFloat(item.compliance)},{m:'Impact',v:parseFloat(item.impact)},{m:'Low Risk',v:100-parseFloat(item.risk)},{m:'Quality',v:item.quality==='High'?90:item.quality==='Medium'?60:30}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:9}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/></RadarChart></ResponsiveContainer></div></div></td></tr>)}</React.Fragment>))}</tbody></table></div><Pg/></div>);
const renderTNFD=()=>(<div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>TNFD Score by Sector</div><ResponsiveContainer width="100%" height={280}><BarChart data={F1.map(s=>{const cs=filtered.filter(x=>x.sector===s);return{name:s.slice(0,12),avg:cs.length?(cs.reduce((sum,x)=>sum+parseFloat(x.score),0)/cs.length).toFixed(1):0};}).filter(d=>d.avg>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-45} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="avg" fill={T.navy} radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Alignment Evolution</div><ResponsiveContainer width="100%" height={280}><AreaChart data={TS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="period" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Area type="monotone" dataKey="v1" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="TNFD Score"/><Area type="monotone" dataKey="v2" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="SBTN Progress"/><Area type="monotone" dataKey="v3" stroke={T.sage} fill={T.sage} fillOpacity={0.15} name="Disclosure"/></AreaChart></ResponsiveContainer></div></div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Region Composition</div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={d2} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{d2.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/><Legend/></PieChart></ResponsiveContainer></div><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Score vs Coverage</div><ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Scatter data={filtered.slice(0,30).map(x=>({name:x.name,x:parseFloat(x.score),y:parseFloat(x.coverage)}))} fill={T.gold} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer></div></div></div>);
const renderActions=()=>(<div><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>{kpis.slice(0,4).map((k,i)=><div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:22,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div></div>)}</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Action Comparison</div><ResponsiveContainer width="100%" height={280}><BarChart data={filtered.slice(0,12).map(item=>({name:item.name.slice(0,10),score:parseFloat(item.score),risk:parseFloat(item.risk)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-45} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Bar dataKey="score" fill={T.navy} name="Score" radius={[4,4,0,0]}/><Bar dataKey="risk" fill={T.red} name="Risk" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Timeline</div><ResponsiveContainer width="100%" height={280}><LineChart data={TS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="period" tick={{fontSize:10,fill:T.textMut}}/><YAxis yAxisId="l" tick={{fontSize:10,fill:T.textMut}}/><YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Line yAxisId="l" type="monotone" dataKey="v1" stroke={T.navy} strokeWidth={2} name="Score"/><Line yAxisId="r" type="monotone" dataKey="v3" stroke={T.gold} strokeWidth={2} name="Dependency"/></LineChart></ResponsiveContainer></div></div></div>);
const StatusBadge=()=>{
  const cfg={
    loading:{label:'Connecting to Nature Strategy Engine…',color:'#5c6b7e',bg:'#eef1f6'},
    live:{label:'● Live — scores computed by /api/v1/corporate-nature-strategy engine (SBTN v1.1 · TNFD v1.0 · EU NRL 2024/1991 · GBF Target 3 · ENCORE v2.1)',color:'#166534',bg:'#dcfce7'},
    partial:{label:'◐ Live (partial) — some companies fell back to Demo Data; Nature Strategy API returned incomplete results',color:'#92400e',bg:'#fef3c7'},
    demo:{label:'○ Demo Data — Nature Strategy API unavailable, showing seeded illustrative figures',color:'#92400e',bg:'#fef3c7'},
  }[liveStatus]||{};
  return <span style={{display:'inline-block',padding:'4px 10px',borderRadius:12,fontSize:11,fontWeight:700,color:cfg.color,background:cfg.bg}}>{cfg.label}</span>;
};
return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}><div style={{marginBottom:24}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>Nature-Related Strategy</div><h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:'4px 0 0'}}>Corporate Nature Strategy</h1><div style={{width:40,height:3,background:T.gold,borderRadius:2,marginTop:6}}/><div style={{marginTop:10}}><StatusBadge/></div></div><div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>{TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font}}>{t}</button>)}</div>{tab===0&&renderDash()}{tab===1&&renderTable()}{tab===2&&renderTNFD()}{tab===3&&renderActions()}</div>);}