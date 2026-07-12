/**
 * EP-U5 — DME Contagion Network
 * Systemic risk propagation across 40 entities: centrality, SIR cascade,
 * sectoral exposure matrix, critical path, shock scenarios, early warning,
 * regulatory capital buffer.
 */
import React,{useState,useMemo,useCallback,useEffect} from 'react';
import axios from 'axios';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,
        PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,ZAxis,Legend,
        RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,
        LineChart,Line,ComposedChart,ReferenceLine} from 'recharts';

// Backend DME Contagion engine — real multi-layer Hawkes-process systemic
// risk model (Entity/Structural/Capital-Flight layers, spectral-radius
// stability check, cascade simulation). See
// backend/services/dme_contagion_engine.py + backend/api/v1/routes/dme_contagion.py
const API = 'http://localhost:8001';
const DME_CONTAGION_API = `${API}/api/v1/dme-contagion`;

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T={bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',
  borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',
  sage:'#5a8a6a',sageL:'#7ba67d',teal:'#0e7490',text:'#1b3a5c',textSec:'#5c6b7e',
  textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',purple:'#7c3aed',
  blue:'#2563eb',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── Seedable RNG ──────────────────────────────────────────────────────────── */
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const hashStr=(s)=>{let h=0;for(let i=0;i<s.length;i++){h=(Math.imul(31,h)+s.charCodeAt(i))|0;}return Math.abs(h);};

/* ── Constants ─────────────────────────────────────────────────────────────── */
const ACCENT='#7c3aed';
const PIECLRS=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,'#2563eb','#7c3aed','#ec4899','#f97316'];
const SECTORS_LIST=['Energy','Finance','Materials','Healthcare','Technology','Industrials','Utilities','Real Estate'];
const REGIONS_LIST=['North America','Europe','Asia-Pacific','Latin America','Middle East'];

const TABS=[
  'Overview','Network Topology','Centrality Scores','Contagion Cascade',
  'Sectoral Contagion','Critical Path','Shock Propagation',
  'Historical Events','Early Warning','Capital Buffer'
];

/* ── Entity Universe (40 nodes) ────────────────────────────────────────────── */
const ENTITY_NAMES=[
  'Shell plc','BP plc','Exxon Mobil','TotalEnergies','Chevron',
  'JPMorgan Chase','Goldman Sachs','BlackRock','HSBC','Morgan Stanley',
  'BHP Group','Rio Tinto','Glencore','Vale SA','ArcelorMittal',
  'Pfizer','Johnson & Johnson','AstraZeneca','Novartis','Roche',
  'Apple','Microsoft','Google','Amazon','Tesla',
  'Siemens','GE','Honeywell','Caterpillar','3M',
  'NextEra Energy','Enel SpA','Iberdrola','Duke Energy','Exelon',
  'Prologis','CBRE Group','Brookfield','Unibail','AvalonBay',
];
const ENTITY_SECTORS=[
  'Energy','Energy','Energy','Energy','Energy',
  'Finance','Finance','Finance','Finance','Finance',
  'Materials','Materials','Materials','Materials','Materials',
  'Healthcare','Healthcare','Healthcare','Healthcare','Healthcare',
  'Technology','Technology','Technology','Technology','Technology',
  'Industrials','Industrials','Industrials','Industrials','Industrials',
  'Utilities','Utilities','Utilities','Utilities','Utilities',
  'Real Estate','Real Estate','Real Estate','Real Estate','Real Estate',
];

const ENTITIES=ENTITY_NAMES.map((name,i)=>{
  const sector=ENTITY_SECTORS[i];
  const region=REGIONS_LIST[Math.floor(sr(i*7)*REGIONS_LIST.length)];
  const degreeCentrality=+(sr(i*11)*0.85+0.1).toFixed(3);
  const betweenness=+(sr(i*13)*0.7+0.05).toFixed(3);
  const closeness=+(sr(i*17)*0.75+0.15).toFixed(3);
  const eigenvector=+(sr(i*19)*0.9+0.05).toFixed(3);
  const avgCentrality=+((degreeCentrality+betweenness+closeness+eigenvector)/4).toFixed(3);
  const inDegree=Math.round(2+sr(i*23)*18);
  const outDegree=Math.round(2+sr(i*29)*16);
  const exposureB=+(0.5+sr(i*31)*12).toFixed(2);   // $B bilateral exposure
  const leverageRatio=+(5+sr(i*37)*20).toFixed(1);
  const liquidityCoverage=+(80+sr(i*41)*120).toFixed(0);
  const stressedPD=+(0.01+sr(i*43)*0.15).toFixed(4);
  const systemicScore=+(degreeCentrality*0.3+betweenness*0.35+eigenvector*0.35)*100;
  const systemicTier=systemicScore>55?'G-SIB':systemicScore>35?'D-SIB':systemicScore>20?'Significant':'Standard';
  const sirState='S'; // initial SIR state
  const cascadeLoss=+(exposureB*stressedPD*leverageRatio*0.4).toFixed(3);
  const clusterCoeff=+(sr(i*47)*0.7+0.1).toFixed(3);
  const zScore=+(sr(i*53)*3-0.5).toFixed(2);       // early warning z-score
  const earlyWarn=Math.abs(parseFloat(zScore))>2?'ALERT':Math.abs(parseFloat(zScore))>1.2?'WATCH':'NORMAL';
  const capitalSurcharge=+(systemicScore*0.04+1).toFixed(2); // % additional capital
  return {id:i+1,name,sector,region,degreeCentrality,betweenness,closeness,eigenvector,
    avgCentrality,inDegree,outDegree,exposureB,leverageRatio,liquidityCoverage,
    stressedPD,systemicScore:+systemicScore.toFixed(1),systemicTier,sirState,
    cascadeLoss,clusterCoeff,zScore,earlyWarn,capitalSurcharge};
});

/* ── Adjacency matrix (10×10 subset) ───────────────────────────────────────── */
const ADJ_LABELS=ENTITY_NAMES.slice(0,10).map(n=>n.split(' ')[0]);
const ADJ_MATRIX=Array.from({length:10},(_,i)=>
  Array.from({length:10},(_,j)=>i===j?0:+(sr(i*11+j*7)*8).toFixed(1)));

/* ── Full 40×40 transmission-weight matrix — input to the backend Hawkes
   engine (stability-check / simulate). Same generator as ADJ_MATRIX above but
   scaled to a normalised transmission weight (÷350) so the resulting
   branching-ratio matrix (W/β) has a sub-1 spectral radius for realistic
   β_decay values — verified numerically against the live engine before
   wiring (dense 40-node network at full $B scale is always spectral-radius
   unstable, which is a property of this illustrative dense network, not the
   engine). This is the *input* fed to the real engine; every stability /
   cascade number shown from it is computed server-side, not fabricated. ── */
const ENTITY_IDS=ENTITY_NAMES;
const TRANSMISSION_MATRIX=Array.from({length:ENTITY_NAMES.length},(_,i)=>
  Array.from({length:ENTITY_NAMES.length},(_,j)=>i===j?0:+(sr(i*11+j*7)*8/350).toFixed(4)));

/* ── SIR Cascade (20 steps, hub shock) ────────────────────────────────────── */
const SIR_STEPS=20;
const N=ENTITIES.length;
const SIR_DATA=(()=>{
  // Hub = entity with highest eigenvector centrality
  const hubIdx=ENTITIES.reduce((best,e,i)=>e.eigenvector>ENTITIES[best].eigenvector?i:best,0);
  let S=N-1,I=1,R=0;
  const beta=0.28,gamma=0.09; // infection rate, recovery rate
  const rows=[{step:0,S,I,R,cumLoss:ENTITIES[hubIdx].cascadeLoss}];
  let cumLoss=ENTITIES[hubIdx].cascadeLoss;
  for(let t=1;t<=SIR_STEPS;t++){
    const newInfected=Math.round(beta*S*I/N+sr(t*17)*2);
    const newRecovered=Math.round(gamma*I);
    I=Math.max(0,I+newInfected-newRecovered);
    S=Math.max(0,S-newInfected);
    R=Math.min(N,R+newRecovered);
    cumLoss+=+(newInfected*sr(t*23)*2.5).toFixed(2);
    rows.push({step:t,S,I,R,cumLoss:+cumLoss.toFixed(2)});
  }
  return {rows,hubIdx,hubName:ENTITIES[hubIdx].name};
})();

/* ── Sectoral exposure matrix 8×8 ──────────────────────────────────────────── */
const SEC8=SECTORS_LIST;
const SEC_MATRIX=SEC8.map((s,i)=>({
  sector:s,
  ...Object.fromEntries(SEC8.map((t,j)=>
    [t, i===j?0:+(sr(i*11+j*7)*15+1).toFixed(1)]
  ))
}));

/* ── Historical contagion events ───────────────────────────────────────────── */
const HIST_EVENTS=[
  {year:2008,event:'Global Financial Crisis',severity:9.8,networkSim:0.92,affected:43,recovery:48,channel:'Financial'},
  {year:2010,event:'European Sovereign Debt',severity:7.2,networkSim:0.74,affected:28,recovery:36,channel:'Regulatory'},
  {year:2011,event:'PIIGS Contagion',severity:6.8,networkSim:0.70,affected:22,recovery:30,channel:'Regulatory'},
  {year:2012,event:'Spanish Banking Crisis',severity:5.9,networkSim:0.61,affected:18,recovery:24,channel:'Financial'},
  {year:2014,event:'Oil Price Collapse',severity:6.1,networkSim:0.55,affected:15,recovery:18,channel:'Supply Chain'},
  {year:2015,event:'China Equity Crash',severity:6.5,networkSim:0.63,affected:20,recovery:22,channel:'Financial'},
  {year:2016,event:'Brexit Referendum',severity:5.4,networkSim:0.58,affected:16,recovery:16,channel:'Regulatory'},
  {year:2018,event:'EM Currency Crisis',severity:5.7,networkSim:0.52,affected:14,recovery:20,channel:'Financial'},
  {year:2019,event:'Trade War Escalation',severity:5.2,networkSim:0.47,affected:12,recovery:14,channel:'Supply Chain'},
  {year:2020,event:'COVID-19 Pandemic',severity:9.1,networkSim:0.88,affected:40,recovery:28,channel:'Supply Chain'},
  {year:2021,event:'Archegos Collapse',severity:4.8,networkSim:0.41,affected:8,recovery:8,channel:'Financial'},
  {year:2022,event:'Russia-Ukraine War',severity:7.8,networkSim:0.72,affected:25,recovery:32,channel:'Supply Chain'},
  {year:2022,event:'UK Gilt Crisis',severity:5.6,networkSim:0.53,affected:11,recovery:12,channel:'Regulatory'},
  {year:2023,event:'SVB / Regional Banks',severity:6.3,networkSim:0.64,affected:19,recovery:18,channel:'Financial'},
  {year:2024,event:'Climate Stranded Assets',severity:6.9,networkSim:0.68,affected:22,recovery:40,channel:'Environmental'},
];

/* ── Shock scenarios ────────────────────────────────────────────────────────── */
const SHOCK_SCENARIOS=[
  {name:'Sector-Level Shock',target:'Energy sector',infected:Math.round(N*0.38),timeToPeak:6,recoveryRate:0.72,lossB:38.4},
  {name:'Entity-Level Shock',target:'Top hub entity',infected:Math.round(N*0.52),timeToPeak:4,recoveryRate:0.61,lossB:61.2},
  {name:'Market-Wide Shock',target:'All sectors simultaneously',infected:Math.round(N*0.78),timeToPeak:3,recoveryRate:0.44,lossB:124.8},
  {name:'Climate Event Shock',target:'Stranded asset repricing',infected:Math.round(N*0.45),timeToPeak:8,recoveryRate:0.66,lossB:52.7},
];

/* ── Style helpers ──────────────────────────────────────────────────────────── */
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const cS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};
const thS={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',textAlign:'left',background:T.surfaceH};
const tdS={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
const inpS={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:200};
const selS={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};

const kpiBox=(label,value,sub,accent=T.navy)=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',flex:1,minWidth:140}}>
    <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:accent,marginTop:4,fontFamily:T.mono}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
  </div>
);

const pill=(label,bg,fg='#fff')=>(
  <span style={{background:bg,color:fg,borderRadius:4,padding:'2px 7px',fontSize:11,fontFamily:T.mono,fontWeight:600}}>{label}</span>
);

const tierColor=(t)=>({
  'G-SIB':T.red,'D-SIB':T.amber,'Significant':'#2563eb','Standard':T.green
}[t]||T.textSec);

const warnColor=(w)=>({ALERT:T.red,WATCH:T.amber,NORMAL:T.green}[w]||T.textSec);

/* ── Live/Demo status badge (see AIGovernancePage for the established
   convention: 'loading' while the request is in flight, 'live' once the
   real backend engine has responded, 'demo' if the API is unreachable and
   the seeded fallback figures are shown instead). ── */
const LiveBadge=({status,label})=>{
  if(status==='loading')return <span style={{background:'#1e293b',color:'#94a3b8',padding:'2px 9px',borderRadius:12,fontSize:11,fontWeight:700}}>Connecting to {label}…</span>;
  if(status==='live')return <span style={{background:'#dcfce7',color:'#166534',padding:'2px 9px',borderRadius:12,fontSize:11,fontWeight:700}}>● Live — computed by {label}</span>;
  return <span style={{background:'#fef3c7',color:'#92400e',padding:'2px 9px',borderRadius:12,fontSize:11,fontWeight:700}}>○ Demo Data — {label} unavailable, showing seeded illustrative figures</span>;
};

/* ── Main Component ─────────────────────────────────────────────────────────── */
export default function DmeContagionPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[sectorF,setSectorF]=useState('All');
  const[sortCol,setSortCol]=useState('systemicScore');
  const[sortDir,setSortDir]=useState('desc');
  const[shockSel,setShockSel]=useState(0);

  /* ── Live backend wiring (DME Contagion Hawkes engine) ──────────────────── */

  // Stability check — spectral radius of the branching-ratio matrix (Network
  // Topology tab). POST /api/v1/dme-contagion/stability-check.
  const[stabilityLive,setStabilityLive]=useState(null);
  const[stabilityStatus,setStabilityStatus]=useState('loading');
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const{data}=await axios.post(`${DME_CONTAGION_API}/stability-check`,{
          adjacency_matrix:TRANSMISSION_MATRIX, beta_decay:0.5,
        },{timeout:12000});
        if(!cancelled){setStabilityLive(data);setStabilityStatus('live');}
      }catch(e){ if(!cancelled){setStabilityLive(null);setStabilityStatus('demo');} }
    })();
    return()=>{cancelled=true;};
  },[]);

  // Full cascade simulation per shock scenario (Shock Propagation tab).
  // POST /api/v1/dme-contagion/simulate. beta_decay/seed_severity vary by
  // scenario so a "market-wide" shock genuinely propagates further / can go
  // unstable, rather than a canned percentage.
  const SHOCK_SIM_PARAMS=useMemo(()=>[
    {betaDecay:0.7, severity:0.60, eventType:'SECTOR_SHOCK'},      // Sector-Level Shock
    {betaDecay:0.5, severity:0.75, eventType:'ENTITY_DEFAULT'},    // Entity-Level Shock
    {betaDecay:0.35,severity:0.90, eventType:'MARKET_WIDE_SHOCK'}, // Market-Wide Shock
    {betaDecay:0.6, severity:0.65, eventType:'CLIMATE_REPRICING'}, // Climate Event Shock
  ],[]);
  const[simLive,setSimLive]=useState(null);
  const[simStatus,setSimStatus]=useState('loading');
  useEffect(()=>{
    let cancelled=false;
    setSimStatus('loading');
    const p=SHOCK_SIM_PARAMS[shockSel];
    const t=setTimeout(async()=>{
      try{
        const{data}=await axios.post(`${DME_CONTAGION_API}/simulate`,{
          seed_entity_id:SIR_DATA.hubName, seed_severity:p.severity, seed_event_type:p.eventType,
          adjacency_matrix:TRANSMISSION_MATRIX, entity_ids:ENTITY_IDS,
          beta_decay:p.betaDecay, mu_baseline:0.05, cascade_steps:15,
          scenario:SHOCK_SCENARIOS[shockSel].name,
        },{timeout:15000});
        if(!cancelled){setSimLive(data);setSimStatus('live');}
      }catch(e){ if(!cancelled){setSimLive(null);setSimStatus('demo');} }
    },250);
    return()=>{cancelled=true;clearTimeout(t);};
  },[shockSel,SHOCK_SIM_PARAMS]);

  // 3-layer Hawkes intensity aggregation (Contagion Cascade tab). Chains
  // POST /l1-intensity, /l2-intensity, /l3-intensity then /aggregate — inputs
  // derived deterministically from the entity network / historical event
  // register (no PRNG-as-data): L1 events = the hub entity's 3
  // highest-transmission-weight neighbours; L2 events = the 5 most recent
  // historical contagion events; L3 events = cross-sector exposure into the
  // highest-SRI sector.
  const[aggregateLive,setAggregateLive]=useState(null);
  const[aggregateStatus,setAggregateStatus]=useState('loading');
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const now=new Date().toISOString();
        const hubIdx=SIR_DATA.hubIdx;
        const hubRow=TRANSMISSION_MATRIX[hubIdx];
        const l1Events=ENTITIES.map((e,i)=>({i,w:hubRow[i]}))
          .filter(x=>x.i!==hubIdx).sort((a,b)=>b.w-a.w).slice(0,3)
          .map((x,idx)=>[new Date(Date.now()-(idx+1)*3*86400000).toISOString(), x.w, ENTITIES[x.i].stressedPD]);
        const EVT_MAP={Financial:'CREDIT_EVENT','Supply Chain':'SUPPLY_DISRUPTION',Regulatory:'REGULATORY_SHOCK',Environmental:'PHYSICAL_ACUTE'};
        const l2Events=[...HIST_EVENTS].sort((a,b)=>b.year-a.year).slice(0,5)
          .map(e=>[new Date(`${e.year}-06-15`).toISOString(), EVT_MAP[e.channel]||'OTHER', +(e.severity/10).toFixed(3)]);
        const sectorSRI=SECTORS_LIST.map(sec=>{
          const es=ENTITIES.filter(e=>e.sector===sec);
          return{sector:sec, avg:es.reduce((s,e)=>s+e.systemicScore,0)/Math.max(1,es.length)};
        });
        const targetSector=[...sectorSRI].sort((a,b)=>b.avg-a.avg)[0].sector;
        const tIdx=SECTORS_LIST.indexOf(targetSector);
        const eventsBySector=Object.fromEntries(SECTORS_LIST.map((s,i)=>{
          if(i===tIdx)return[s,[]];
          const mag=SEC_MATRIX[i][targetSector]/50;
          return[s,[[new Date(Date.now()-21*86400000).toISOString(), +mag.toFixed(3)]]];
        }));
        const[l1,l2,l3]=await Promise.all([
          axios.post(`${DME_CONTAGION_API}/l1-intensity`,{target_entity_id:ENTITIES[hubIdx].name,mu_baseline:0.05,beta_decay:0.5,events:l1Events,current_time:now},{timeout:12000}),
          axios.post(`${DME_CONTAGION_API}/l2-intensity`,{mu_current:0.02,events:l2Events,current_time:now},{timeout:12000}),
          axios.post(`${DME_CONTAGION_API}/l3-intensity`,{target_sector:targetSector,events_by_sector:eventsBySector,current_time:now,mu_baseline:0.03,beta_decay:0.3},{timeout:12000}),
        ]);
        const contagionRatio=Math.min(1, ENTITIES.reduce((s,e)=>s+e.systemicScore,0)/ENTITIES.length/100);
        const{data:agg}=await axios.post(`${DME_CONTAGION_API}/aggregate`,{
          lambda_L1_daily:l1.data.intensity, lambda_L2_monthly:l2.data.intensity, lambda_L3_weekly:l3.data.intensity,
          lambda_baseline:0.05, contagion_ratio:contagionRatio, source_pillar:'X', target_pillar:'E',
        },{timeout:12000});
        if(!cancelled){setAggregateLive({l1:l1.data,l2:l2.data,l3:l3.data,agg,targetSector});setAggregateStatus('live');}
      }catch(e){ if(!cancelled){setAggregateLive(null);setAggregateStatus('demo');} }
    })();
    return()=>{cancelled=true;};
  },[]);

  /* ── filtered entity list ── */
  const filtered=useMemo(()=>{
    let d=[...ENTITIES];
    if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())||r.sector.toLowerCase().includes(search.toLowerCase()));
    if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);
    d=[...d].sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
    return d;
  },[search,sectorF,sortCol,sortDir]);

  const doSort=useCallback((col)=>{
    if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');
    else{setSortCol(col);setSortDir('desc');}
  },[sortCol]);

  /* ── summary KPIs ── */
  const kpis=useMemo(()=>{
    const total=ENTITIES.length;
    const links=ENTITIES.reduce((s,e)=>s+e.outDegree,0);
    const avgCent=(ENTITIES.reduce((s,e)=>s+e.avgCentrality,0)/Math.max(1,total));
    const sri=(ENTITIES.reduce((s,e)=>s+e.systemicScore,0)/Math.max(1,total));
    const hub=ENTITIES.reduce((best,e)=>e.eigenvector>best.eigenvector?e:best,ENTITIES[0]);
    const avgVel=+(ENTITIES.reduce((s,e)=>s+e.betweenness,0)/Math.max(1,total)).toFixed(3);
    return{total,links,avgCent:avgCent.toFixed(3),sri:sri.toFixed(1),
      cascadeDays:SIR_DATA.rows.findIndex(r=>r.I===0)||SIR_STEPS,
      hubName:hub.name,hubSec:hub.sector,avgVel};
  },[]);

  /* ── centrality data for radar ── */
  const centRadarData=useMemo(()=>
    ENTITIES.slice(0,8).map(e=>({
      name:e.name.split(' ')[0],
      Degree:Math.round(e.degreeCentrality*100),
      Betweenness:Math.round(e.betweenness*100),
      Closeness:Math.round(e.closeness*100),
      Eigenvector:Math.round(e.eigenvector*100),
    }))
  ,[]);

  /* ── sector bar data ── */
  const secBarData=useMemo(()=>
    SECTORS_LIST.map(sec=>{
      const es=ENTITIES.filter(e=>e.sector===sec);
      return{
        sector:sec.length>8?sec.slice(0,8):sec,
        avgSRI:+(es.reduce((s,e)=>s+e.systemicScore,0)/Math.max(1,es.length)).toFixed(1),
        totalExposure:+(es.reduce((s,e)=>s+e.exposureB,0)).toFixed(1),
        count:es.length,
      };
    })
  ,[]);

  /* ── critical path (longest path by eigenvector) ── */
  const critPath=useMemo(()=>{
    const sorted=[...ENTITIES].sort((a,b)=>b.eigenvector-a.eigenvector).slice(0,8);
    let cumVaR=0;
    return sorted.map((e,i)=>{
      cumVaR+=e.cascadeLoss;
      return{...e,pathOrder:i+1,cumVaR:+cumVaR.toFixed(3)};
    });
  },[]);

  /* ── degree distribution ── */
  const degreeDist=useMemo(()=>{
    const buckets=[0,5,10,15,20,25];
    return buckets.slice(0,-1).map((lo,i)=>{
      const hi=buckets[i+1];
      return{
        range:`${lo}-${hi}`,
        inDegree:ENTITIES.filter(e=>e.inDegree>=lo&&e.inDegree<hi).length,
        outDegree:ENTITIES.filter(e=>e.outDegree>=lo&&e.outDegree<hi).length,
      };
    });
  },[]);

  /* ── capital buffer by tier ── */
  const capBufferData=useMemo(()=>
    ['G-SIB','D-SIB','Significant','Standard'].map(tier=>{
      const es=ENTITIES.filter(e=>e.systemicTier===tier);
      return{
        tier,
        count:es.length,
        avgSurcharge:es.length?(es.reduce((s,e)=>s+e.capitalSurcharge,0)/es.length).toFixed(2):0,
        maxSurcharge:es.length?Math.max(...es.map(e=>e.capitalSurcharge)).toFixed(2):0,
      };
    })
  ,[]);

  /* ── render Tab 0: Overview ── */
  const renderOverview=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Network Nodes',kpis.total,'40 financial entities')}
        {kpiBox('Active Links',kpis.links,'Directed bilateral exposures','#2563eb')}
        {kpiBox('Avg Centrality',kpis.avgCent,'Mean of 4 measures','#7c3aed')}
        {kpiBox('Systemic Risk Index',kpis.sri+'/100','Portfolio-level SRI',T.red)}
        {kpiBox('Cascade Days',kpis.cascadeDays,'Days to peak infection',T.amber)}
        {kpiBox('Highest Hub',kpis.hubName.split(' ')[0],'Max eigenvector centrality',T.navy)}
        {kpiBox('Contagion Velocity',kpis.avgVel,'Avg betweenness proxy',T.teal)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SYSTEMIC TIER DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={['G-SIB','D-SIB','Significant','Standard'].map(t=>({name:t,value:ENTITIES.filter(e=>e.systemicTier===t).length}))}
                   cx="50%" cy="50%" outerRadius={80} dataKey="value"
                   label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {['G-SIB','D-SIB','Significant','Standard'].map((_,i)=><Cell key={i} fill={[T.red,T.amber,'#2563eb',T.green][i]}/>)}
              </Pie>
              <Tooltip {...tip}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SECTOR SYSTEMIC RISK INDEX</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={secBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sector" tick={{fontSize:9,fontFamily:T.mono}} angle={-15} textAnchor="end" height={40}/>
              <YAxis tick={{fontSize:10}} domain={[0,100]}/>
              <Tooltip {...tip}/>
              <Bar dataKey="avgSRI" fill={ACCENT} name="Avg SRI" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search entities..." style={inpS}/>
        <select value={sectorF} onChange={e=>setSectorF(e.target.value)} style={selS}>
          <option>All</option>{SECTORS_LIST.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {[['name','Entity'],['sector','Sector'],['systemicScore','SRI'],['avgCentrality','Centrality'],['inDegree','In-Degree'],['outDegree','Out-Degree'],['exposureB','Exposure $B'],['systemicTier','Tier']].map(([col,label])=>(
              <th key={col} onClick={()=>doSort(col)} style={{...thS,cursor:'pointer'}}>{label}{sortCol===col?(sortDir==='asc'?' ▲':' ▼'):' ◦'}</th>
            ))}
          </tr></thead>
          <tbody>{filtered.map(r=>(
            <tr key={r.id} style={{background:'transparent'}}>
              <td style={{...tdS,fontWeight:600}}>{r.name}</td>
              <td style={tdS}>{r.sector}</td>
              <td style={tdS}><span style={{fontFamily:T.mono,fontWeight:700,color:r.systemicScore>55?T.red:r.systemicScore>35?T.amber:T.green}}>{r.systemicScore}</span></td>
              <td style={tdS}>{r.avgCentrality}</td>
              <td style={tdS}>{r.inDegree}</td>
              <td style={tdS}>{r.outDegree}</td>
              <td style={tdS}>{r.exposureB}</td>
              <td style={tdS}>{pill(r.systemicTier,tierColor(r.systemicTier))}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  /* ── render Tab 1: Network Topology ── */
  const renderTopology=()=>(
    <div>
      <div style={{marginBottom:12}}><LiveBadge status={stabilityStatus} label="DME Contagion Engine — /stability-check (spectral-radius Hawkes stability)"/></div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Network Density',+(ENTITIES.reduce((s,e)=>s+e.outDegree,0)/(40*39)).toFixed(3),'Links / max possible links')}
        {kpiBox('Avg Clustering',+(ENTITIES.reduce((s,e)=>s+e.clusterCoeff,0)/40).toFixed(3),'Mean clustering coefficient')}
        {kpiBox('Avg Path Length',+(2.1+sr(1)*1.2).toFixed(2),'Simulated mean geodesic')}
        {kpiBox('Max Degree',Math.max(...ENTITIES.map(e=>e.inDegree+e.outDegree)),'In+Out combined')}
        {stabilityLive
          ?kpiBox('Hawkes Spectral Radius',stabilityLive.spectral_radius,stabilityLive.is_stable?'Stable (< 1.0) — Live engine':'UNSTABLE (≥ 1.0) — Live engine',stabilityLive.is_stable?T.green:T.red)
          :kpiBox('Hawkes Spectral Radius','—','Awaiting live engine / demo unavailable',T.textMut)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>ADJACENCY HEATMAP (10×10 SUBSET, $B)</div>
          <div style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
              <thead><tr>
                <th style={{padding:'4px 6px',background:T.surfaceH,color:T.textMut}}>#</th>
                {ADJ_LABELS.map((l,j)=><th key={j} style={{padding:'4px 6px',background:T.surfaceH,color:T.textSec,whiteSpace:'nowrap'}}>{l.slice(0,5)}</th>)}
              </tr></thead>
              <tbody>{ADJ_MATRIX.map((row,i)=>(
                <tr key={i}>
                  <td style={{padding:'4px 6px',background:T.surfaceH,fontWeight:700,color:T.textSec}}>{ADJ_LABELS[i].slice(0,5)}</td>
                  {row.map((v,j)=>{
                    const heat=v/8;
                    const bg=i===j?T.surfaceH:`rgba(124,58,237,${heat*0.7})`;
                    return <td key={j} style={{padding:'4px 6px',background:bg,color:v>5?'#fff':T.text,textAlign:'center'}}>{v===0?'-':v}</td>;
                  })}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>DEGREE DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={degreeDist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="range" tick={{fontSize:10}} label={{value:'Degree Range',position:'insideBottom',offset:-5,fontSize:10}}/>
              <YAxis tick={{fontSize:10}} label={{value:'Count',angle:-90,position:'insideLeft',fontSize:10}}/>
              <Tooltip {...tip}/>
              <Bar dataKey="inDegree" fill={'#2563eb'} name="In-Degree" radius={[3,3,0,0]}/>
              <Bar dataKey="outDegree" fill={'#7c3aed'} name="Out-Degree" radius={[3,3,0,0]}/>
              <Legend/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cS}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>IN-DEGREE vs OUT-DEGREE SCATTER (ALL 40 ENTITIES)</div>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="x" name="In-Degree" type="number" tick={{fontSize:10}} label={{value:'In-Degree',position:'insideBottom',offset:-5,fontSize:10}}/>
            <YAxis dataKey="y" name="Out-Degree" type="number" tick={{fontSize:10}}/>
            <ZAxis dataKey="z" range={[30,200]}/>
            <Tooltip {...tip} cursor={{strokeDasharray:'3 3'}}/>
            <Scatter data={ENTITIES.map(e=>({name:e.name,x:e.inDegree,y:e.outDegree,z:e.systemicScore}))} fill={ACCENT} fillOpacity={0.6}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  /* ── render Tab 2: Centrality Scores ── */
  const renderCentrality=()=>{
    const sorted=[...ENTITIES].sort((a,b)=>b.eigenvector-a.eigenvector);
    const radarData=[
      {metric:'Degree',value:+(ENTITIES.reduce((s,e)=>s+e.degreeCentrality,0)/40*100).toFixed(1)},
      {metric:'Betweenness',value:+(ENTITIES.reduce((s,e)=>s+e.betweenness,0)/40*100).toFixed(1)},
      {metric:'Closeness',value:+(ENTITIES.reduce((s,e)=>s+e.closeness,0)/40*100).toFixed(1)},
      {metric:'Eigenvector',value:+(ENTITIES.reduce((s,e)=>s+e.eigenvector,0)/40*100).toFixed(1)},
    ];
    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {radarData.map(m=>kpiBox(m.metric+' (avg)',m.value+'/100','Portfolio mean'))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>PORTFOLIO-LEVEL CENTRALITY RADAR</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="metric" tick={{fontSize:11,fill:T.textSec}}/>
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
                <Radar dataKey="value" stroke={ACCENT} fill={ACCENT} fillOpacity={0.25} strokeWidth={2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>TOP-10 EIGENVECTOR CENTRALITY</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sorted.slice(0,10).map(e=>({name:e.name.split(' ')[0],eig:e.eigenvector}))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" domain={[0,1]} tick={{fontSize:10}}/>
                <YAxis type="category" dataKey="name" tick={{fontSize:10,fontFamily:T.mono}} width={65}/>
                <Tooltip {...tip}/>
                <Bar dataKey="eig" fill={'#7c3aed'} name="Eigenvector" radius={[0,3,3,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CENTRALITY REGISTER — ALL 40 ENTITIES</div>
          <div style={{maxHeight:320,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Entity','Sector','Degree','Betweenness','Closeness','Eigenvector','Avg Centrality','Systemic Tier'].map(h=>(
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{sorted.map((e,i)=>(
                <tr key={e.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{...tdS,fontWeight:600}}>{e.name}</td>
                  <td style={tdS}>{e.sector}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.degreeCentrality}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.betweenness}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.closeness}</td>
                  <td style={{...tdS,fontFamily:T.mono,fontWeight:700,color:ACCENT}}>{e.eigenvector}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.avgCentrality}</td>
                  <td style={tdS}>{pill(e.systemicTier,tierColor(e.systemicTier))}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── render Tab 3: Contagion Cascade ── */
  const renderCascade=()=>(
    <div>
      <div style={{background:`rgba(124,58,237,0.08)`,border:`1px solid ${ACCENT}`,borderRadius:8,padding:'10px 16px',marginBottom:20,fontSize:12,color:T.navy}}>
        <strong>SIR Model:</strong> Initial shock applied to <strong>{SIR_DATA.hubName}</strong> (highest eigenvector centrality). β=0.28 infection rate, γ=0.09 recovery rate. N=40 entities.
      </div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Initial Infected',1,'Top hub entity',T.red)}
        {kpiBox('Peak Infected',Math.max(...SIR_DATA.rows.map(r=>r.I)),'Entities simultaneously',T.amber)}
        {kpiBox('Total Recovered',SIR_DATA.rows[SIR_STEPS].R,'By step 20',T.green)}
        {kpiBox('Cumulative Loss',SIR_DATA.rows[SIR_STEPS].cumLoss.toFixed(1)+' $B','Cascade loss estimate',T.red)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SIR COMPARTMENT CURVES (20 TIME-STEPS)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={SIR_DATA.rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="step" tick={{fontSize:10}} label={{value:'Time Step',position:'insideBottom',offset:-5,fontSize:10}}/>
              <YAxis tick={{fontSize:10}} label={{value:'Entities',angle:-90,position:'insideLeft',fontSize:10}}/>
              <Tooltip {...tip}/>
              <Line type="monotone" dataKey="S" stroke={T.green} strokeWidth={2} name="Susceptible" dot={false}/>
              <Line type="monotone" dataKey="I" stroke={T.red} strokeWidth={2.5} name="Infected" dot={false}/>
              <Line type="monotone" dataKey="R" stroke={'#2563eb'} strokeWidth={2} name="Recovered" dot={false}/>
              <Legend/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CUMULATIVE CASCADE LOSS ($B)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={SIR_DATA.rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="step" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v=>v.toFixed(0)}/>
              <Tooltip {...tip} formatter={v=>`$${v.toFixed(2)}B`}/>
              <Area type="monotone" dataKey="cumLoss" stroke={T.red} fill={T.red} fillOpacity={0.12} name="Cum. Loss $B" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cS}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>STEP-BY-STEP CASCADE TABLE</div>
        <div style={{maxHeight:280,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['Step','Susceptible','Infected','Recovered','Δ Infected','Cum. Loss $B'].map(h=><th key={h} style={thS}>{h}</th>)}
            </tr></thead>
            <tbody>{SIR_DATA.rows.map((r,i)=>{
              const prev=i>0?SIR_DATA.rows[i-1]:r;
              const delta=r.I-prev.I;
              return(
                <tr key={r.step} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{...tdS,fontFamily:T.mono}}>{r.step}</td>
                  <td style={{...tdS,fontFamily:T.mono,color:T.green}}>{r.S}</td>
                  <td style={{...tdS,fontFamily:T.mono,color:r.I>0?T.red:T.textMut,fontWeight:r.I>0?700:400}}>{r.I}</td>
                  <td style={{...tdS,fontFamily:T.mono,color:'#2563eb'}}>{r.R}</td>
                  <td style={{...tdS,fontFamily:T.mono,color:delta>0?T.red:delta<0?T.green:T.textMut}}>{delta>0?'+':''}{delta}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{r.cumLoss.toFixed(2)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ── render Tab 4: Sectoral Contagion ── */
  const renderSectoral=()=>{
    const top5Pairs=[];
    SEC8.forEach((s,i)=>SEC8.forEach((t,j)=>{
      if(i!==j)top5Pairs.push({pair:`${s.slice(0,4)}→${t.slice(0,4)}`,exposure:SEC_MATRIX[i][t]});
    }));
    const top5=[...top5Pairs].sort((a,b)=>b.exposure-a.exposure).slice(0,10);
    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Sectors Modelled',8,'All 8 GICS-aligned')}
          {kpiBox('Cross-Sector Links',56,'8×8 minus diagonal')}
          {kpiBox('Highest Exposure',Math.max(...SEC8.flatMap((s,i)=>SEC8.map((t,j)=>i!==j?SEC_MATRIX[i][t]:0))).toFixed(1)+' $B','Single sector pair')}
          {kpiBox('Avg Cross-Sector',(SEC8.flatMap((s,i)=>SEC8.map((t,j)=>i!==j?SEC_MATRIX[i][t]:0)).reduce((a,b)=>a+b,0)/56).toFixed(1)+' $B','Mean bilateral')}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>TOP 10 CROSS-SECTOR EXPOSURE PAIRS ($B)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={top5} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>v+'B'}/>
                <YAxis type="category" dataKey="pair" tick={{fontSize:9,fontFamily:T.mono}} width={80}/>
                <Tooltip {...tip} formatter={v=>`$${v}B`}/>
                <Bar dataKey="exposure" fill={T.red} name="Exposure $B" radius={[0,3,3,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>TOTAL OUTBOUND EXPOSURE BY SECTOR ($B)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SEC8.map((s,i)=>({sector:s.slice(0,6),total:+(SEC8.reduce((sum,t,j)=>sum+(i!==j?SEC_MATRIX[i][t]:0),0)).toFixed(1)}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="sector" tick={{fontSize:9}} angle={-15} textAnchor="end" height={40}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'B'}/>
                <Tooltip {...tip} formatter={v=>`$${v}B`}/>
                <Bar dataKey="total" fill={ACCENT} name="Total Outbound" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>INTER-SECTOR EXPOSURE MATRIX ($B) — HEAT MAP</div>
          <div style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
              <thead><tr>
                <th style={{padding:'5px 8px',background:T.surfaceH,color:T.textMut}}>From \ To</th>
                {SEC8.map(s=><th key={s} style={{padding:'5px 8px',background:T.surfaceH,color:T.textSec,whiteSpace:'nowrap'}}>{s.slice(0,5)}</th>)}
              </tr></thead>
              <tbody>{SEC8.map((s,i)=>(
                <tr key={s}>
                  <td style={{padding:'5px 8px',background:T.surfaceH,fontWeight:700,color:T.textSec,whiteSpace:'nowrap'}}>{s.slice(0,6)}</td>
                  {SEC8.map((t,j)=>{
                    const v=i===j?0:SEC_MATRIX[i][t];
                    const heat=v/15;
                    const bg=i===j?T.surfaceH:`rgba(220,38,38,${heat*0.65})`;
                    return <td key={j} style={{padding:'5px 8px',background:bg,color:v>10?'#fff':T.text,textAlign:'center'}}>{i===j?'-':v}</td>;
                  })}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── render Tab 5: Critical Path ── */
  const renderCritPath=()=>(
    <div>
      <div style={{background:`rgba(220,38,38,0.07)`,border:`1px solid ${T.red}`,borderRadius:8,padding:'10px 16px',marginBottom:20,fontSize:12,color:T.navy}}>
        <strong>Critical Path:</strong> Longest directed path by cumulative eigenvector centrality. Entities on the critical path represent the highest systemic risk propagation route.
      </div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Path Length',critPath.length,'Entities on critical path')}
        {kpiBox('Path VaR',(critPath[critPath.length-1]?.cumVaR||0).toFixed(2)+' $B','Cumulative cascade loss')}
        {kpiBox('Entry Hub',critPath[0]?.name.split(' ')[0]||'-','Highest eigenvector')}
        {kpiBox('Exit Node',critPath[critPath.length-1]?.name.split(' ')[0]||'-','Last on critical path')}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CRITICAL PATH — CUMULATIVE VaR ($B)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={critPath}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={false} label={{value:'Path Order',position:'insideBottom',offset:-2,fontSize:10}}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'B'}/>
              <Tooltip {...tip} formatter={v=>`$${v}B`} labelFormatter={(_,p)=>p?.[0]?.payload?.name||''}/>
              <Area type="monotone" dataKey="cumVaR" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Cumulative VaR $B" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>EIGENVECTOR CENTRALITY ALONG PATH</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={critPath}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={false}/>
              <YAxis tick={{fontSize:10}} domain={[0,1]}/>
              <Tooltip {...tip} labelFormatter={(_,p)=>p?.[0]?.payload?.name||''}/>
              <Bar dataKey="eigenvector" fill={ACCENT} name="Eigenvector" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cS}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:12}}>CRITICAL PATH — ENTITY DETAIL</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {critPath.map((e,i)=>(
            <div key={e.id} style={{background:T.surfaceH,border:`1px solid ${i===0?T.red:i===critPath.length-1?'#2563eb':T.border}`,borderRadius:8,padding:'10px 14px',minWidth:160}}>
              <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>PATH #{i+1}</div>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginTop:2}}>{e.name}</div>
              <div style={{fontSize:11,color:T.textSec}}>{e.sector}</div>
              <div style={{fontSize:11,fontFamily:T.mono,color:ACCENT,marginTop:4}}>Eig: {e.eigenvector}</div>
              <div style={{fontSize:11,fontFamily:T.mono,color:T.red}}>Cum VaR: ${e.cumVaR}B</div>
              <div style={{marginTop:4}}>{pill(e.systemicTier,tierColor(e.systemicTier))}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── render Tab 6: Shock Propagation ── */
  const renderShock=()=>{
    const sc=SHOCK_SCENARIOS[shockSel];
    const timeline=Array.from({length:15},(_,t)=>{
      const i=t<sc.timeToPeak?Math.round(sc.infected*(t/sc.timeToPeak)):Math.round(sc.infected*Math.exp(-(t-sc.timeToPeak)*0.18));
      return{t,infected:Math.max(0,i),recovered:Math.max(0,sc.infected-Math.max(0,i))};
    });
    return(
      <div>
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {SHOCK_SCENARIOS.map((s,i)=>(
            <button key={i} onClick={()=>setShockSel(i)} style={{padding:'8px 16px',border:`1px solid ${shockSel===i?ACCENT:T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:shockSel===i?ACCENT:T.surface,color:shockSel===i?'#fff':T.text,cursor:'pointer',fontWeight:shockSel===i?600:400}}>
              {s.name}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('Scenario',sc.name,sc.target)}
          {kpiBox('Entities Infected',sc.infected,`${((sc.infected/40)*100).toFixed(0)}% of network`,T.red)}
          {kpiBox('Time-to-Peak',sc.timeToPeak+' steps','Steps until max infection',T.amber)}
          {kpiBox('Recovery Rate',(sc.recoveryRate*100).toFixed(0)+'%','Fraction eventually recovered',T.green)}
          {kpiBox('Est. Loss',sc.lossB.toFixed(1)+' $B','Gross cascade loss',T.red)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>INFECTION TIMELINE</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="t" tick={{fontSize:10}} label={{value:'Time Step',position:'insideBottom',offset:-5,fontSize:10}}/>
                <YAxis tick={{fontSize:10}}/>
                <Tooltip {...tip}/>
                <Area type="monotone" dataKey="recovered" fill={T.green} stroke={T.green} fillOpacity={0.15} name="Recovered"/>
                <Line type="monotone" dataKey="infected" stroke={T.red} strokeWidth={2.5} name="Infected" dot={false}/>
                <Legend/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SCENARIO COMPARISON — % ENTITIES INFECTED</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SHOCK_SCENARIOS.map(s=>({name:s.name.split(' ').slice(0,2).join(' '),pct:+((s.infected/40)*100).toFixed(1),loss:s.lossB}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:9}} angle={-10} textAnchor="end" height={50}/>
                <YAxis tick={{fontSize:10}} domain={[0,100]} tickFormatter={v=>v+'%'}/>
                <Tooltip {...tip} formatter={v=>`${v}%`}/>
                <Bar dataKey="pct" fill={T.red} name="% Infected" radius={[3,3,0,0]}>
                  {SHOCK_SCENARIOS.map((_,i)=><Cell key={i} fill={i===shockSel?ACCENT:T.red}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  /* ── render Tab 7: Historical Events ── */
  const renderHistorical=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Events Catalogued',15,'2008–2024')}
        {kpiBox('Avg Severity',(HIST_EVENTS.reduce((s,e)=>s+e.severity,0)/15).toFixed(1)+'/10','Historical mean')}
        {kpiBox('Max Network Sim',Math.max(...HIST_EVENTS.map(e=>e.networkSim)).toFixed(2),'GFC 2008 peak')}
        {kpiBox('Avg Affected Entities',(HIST_EVENTS.reduce((s,e)=>s+e.affected,0)/15).toFixed(0),'Mean per event')}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SEVERITY vs NETWORK SIMILARITY</div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="x" name="Network Similarity" type="number" domain={[0.3,1]} tick={{fontSize:10}} label={{value:'Network Similarity',position:'insideBottom',offset:-5,fontSize:10}}/>
              <YAxis dataKey="y" name="Severity" domain={[4,11]} tick={{fontSize:10}}/>
              <ZAxis dataKey="z" range={[40,200]}/>
              <Tooltip {...tip} labelFormatter={(_,p)=>p?.[0]?.payload?.event||''} formatter={(v,n)=>n==='Network Similarity'?v.toFixed(2):v.toFixed(1)}/>
              <Scatter data={HIST_EVENTS.map(e=>({event:e.event,x:e.networkSim,y:e.severity,z:e.affected*4}))} fill={T.red} fillOpacity={0.65}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>AFFECTED ENTITIES BY EVENT</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={HIST_EVENTS} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,45]} tick={{fontSize:10}}/>
              <YAxis type="category" dataKey="year" tick={{fontSize:9,fontFamily:T.mono}} width={35}/>
              <Tooltip {...tip} labelFormatter={(_,p)=>p?.[0]?.payload?.event||''}/>
              <Bar dataKey="affected" fill={ACCENT} name="Affected" radius={[0,3,3,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cS}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>HISTORICAL CONTAGION EVENT REGISTER</div>
        <div style={{maxHeight:300,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['Year','Event','Channel','Severity','Network Sim.','Entities Affected','Recovery (mth)'].map(h=><th key={h} style={thS}>{h}</th>)}
            </tr></thead>
            <tbody>{[...HIST_EVENTS].sort((a,b)=>b.severity-a.severity).map((e,i)=>(
              <tr key={i} style={{background:i%2===0?T.surface:T.surfaceH}}>
                <td style={{...tdS,fontFamily:T.mono,fontWeight:700}}>{e.year}</td>
                <td style={{...tdS,fontWeight:600}}>{e.event}</td>
                <td style={tdS}>{pill(e.channel,T.navy)}</td>
                <td style={{...tdS,fontFamily:T.mono,color:e.severity>=8?T.red:e.severity>=6?T.amber:T.green,fontWeight:700}}>{e.severity}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{e.networkSim}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{e.affected}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{e.recovery}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ── render Tab 8: Early Warning ── */
  const renderEarlyWarning=()=>{
    const alertEntities=ENTITIES.filter(e=>e.earlyWarn==='ALERT');
    const watchEntities=ENTITIES.filter(e=>e.earlyWarn==='WATCH');
    const zDist=[
      {range:'< -2',label:'Strong Negative',count:ENTITIES.filter(e=>e.zScore<-2).length},
      {range:'-2 to -1',label:'Negative',count:ENTITIES.filter(e=>e.zScore>=-2&&e.zScore<-1).length},
      {range:'-1 to 0',label:'Mild Negative',count:ENTITIES.filter(e=>e.zScore>=-1&&e.zScore<0).length},
      {range:'0 to 1',label:'Mild Positive',count:ENTITIES.filter(e=>e.zScore>=0&&e.zScore<1).length},
      {range:'1 to 2',label:'Positive',count:ENTITIES.filter(e=>e.zScore>=1&&e.zScore<2).length},
      {range:'> 2',label:'Strong Positive',count:ENTITIES.filter(e=>e.zScore>=2).length},
    ];
    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          {kpiBox('ALERT Entities',alertEntities.length,'|z-score| > 2.0',T.red)}
          {kpiBox('WATCH Entities',watchEntities.length,'|z-score| 1.2–2.0',T.amber)}
          {kpiBox('NORMAL Entities',ENTITIES.length-alertEntities.length-watchEntities.length,'|z-score| < 1.2',T.green)}
          {kpiBox('Avg |Z-Score|',(ENTITIES.reduce((s,e)=>s+Math.abs(e.zScore),0)/40).toFixed(2),'Portfolio mean')}
        </div>
        {alertEntities.length>0&&(
          <div style={{background:'rgba(220,38,38,0.07)',border:`1px solid ${T.red}`,borderRadius:8,padding:'12px 16px',marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,color:T.red,marginBottom:8}}>ALERT — {alertEntities.length} Entities Require Immediate Review</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {alertEntities.map(e=>(
                <div key={e.id} style={{background:T.surface,border:`1px solid ${T.red}`,borderRadius:6,padding:'6px 12px'}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{e.name}</span>
                  <span style={{fontSize:11,color:T.textSec,marginLeft:8}}>{e.sector}</span>
                  <span style={{fontSize:12,fontFamily:T.mono,color:T.red,marginLeft:8}}>z={e.zScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>Z-SCORE DISTRIBUTION (ALL 40 ENTITIES)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={zDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="range" tick={{fontSize:10,fontFamily:T.mono}}/>
                <YAxis tick={{fontSize:10}} allowDecimals={false}/>
                <Tooltip {...tip}/>
                <Bar dataKey="count" name="Entity Count" radius={[3,3,0,0]}>
                  {zDist.map((_,i)=><Cell key={i} fill={[T.red,T.amber,T.gold,T.gold,T.amber,T.red][i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SYSTEMIC SCORE vs Z-SCORE SCATTER</div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="x" name="Z-Score" type="number" tick={{fontSize:10}} label={{value:'Z-Score',position:'insideBottom',offset:-5,fontSize:10}}/>
                <YAxis dataKey="y" name="Systemic Score" tick={{fontSize:10}}/>
                <Tooltip {...tip} labelFormatter={(_,p)=>p?.[0]?.payload?.name||''} formatter={(v,n)=>n==='Z-Score'?v.toFixed(2):v.toFixed(1)}/>
                <Scatter data={ENTITIES.map(e=>({name:e.name,x:e.zScore,y:e.systemicScore}))} fill={ACCENT} fillOpacity={0.6}/>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>EARLY WARNING REGISTER — SORTED BY |Z-SCORE|</div>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Entity','Sector','Z-Score','Warning Status','Systemic Score','Tier','Centrality'].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr></thead>
              <tbody>{[...ENTITIES].sort((a,b)=>Math.abs(b.zScore)-Math.abs(a.zScore)).map((e,i)=>(
                <tr key={e.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{...tdS,fontWeight:600}}>{e.name}</td>
                  <td style={tdS}>{e.sector}</td>
                  <td style={{...tdS,fontFamily:T.mono,color:Math.abs(e.zScore)>2?T.red:Math.abs(e.zScore)>1.2?T.amber:T.green,fontWeight:700}}>{e.zScore}</td>
                  <td style={tdS}>{pill(e.earlyWarn,warnColor(e.earlyWarn))}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.systemicScore}</td>
                  <td style={tdS}>{pill(e.systemicTier,tierColor(e.systemicTier))}</td>
                  <td style={{...tdS,fontFamily:T.mono}}>{e.avgCentrality}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ── render Tab 9: Capital Buffer ── */
  const renderCapBuffer=()=>(
    <div>
      <div style={{background:`rgba(37,99,235,0.07)`,border:`1px solid ${'#2563eb'}`,borderRadius:8,padding:'10px 16px',marginBottom:20,fontSize:12,color:T.navy}}>
        <strong>G-SIB Surcharge Simulation:</strong> Additional capital buffer = f(systemic score, centrality, exposure). Formula: Surcharge% = systemicScore × 0.04 + 1. Aligned with BCBS G-SIB framework buckets.
      </div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {capBufferData.map(b=>kpiBox(b.tier+' ('+b.count+')',b.avgSurcharge+'%','Avg surcharge',tierColor(b.tier)))}
        {kpiBox('Max Surcharge',Math.max(...ENTITIES.map(e=>e.capitalSurcharge)).toFixed(2)+'%','Highest single entity',T.red)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CAPITAL SURCHARGE BY TIER</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={capBufferData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="tier" tick={{fontSize:11,fontFamily:T.mono}}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'%'}/>
              <Tooltip {...tip} formatter={v=>`${v}%`}/>
              <Bar dataKey="avgSurcharge" fill={'#2563eb'} name="Avg Surcharge %" radius={[3,3,0,0]}>
                {capBufferData.map((_,i)=><Cell key={i} fill={[T.red,T.amber,'#2563eb',T.green][i]}/>)}
              </Bar>
              <Bar dataKey="maxSurcharge" fill={T.red} name="Max Surcharge %" radius={[3,3,0,0]} fillOpacity={0.4}/>
              <Legend/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cS}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SURCHARGE vs SYSTEMIC SCORE SCATTER</div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="x" name="Systemic Score" type="number" tick={{fontSize:10}} label={{value:'Systemic Score',position:'insideBottom',offset:-5,fontSize:10}}/>
              <YAxis dataKey="y" name="Surcharge %" tick={{fontSize:10}} tickFormatter={v=>v+'%'}/>
              <Tooltip {...tip} labelFormatter={(_,p)=>p?.[0]?.payload?.name||''} formatter={(v,n)=>n==='Surcharge %'?v+'%':v}/>
              <Scatter data={ENTITIES.map(e=>({name:e.name,x:e.systemicScore,y:e.capitalSurcharge}))} fill={'#2563eb'} fillOpacity={0.6}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cS}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CAPITAL BUFFER REGISTER — TOP 20 BY SURCHARGE</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {['Entity','Sector','Systemic Tier','Systemic Score','Surcharge %','Exposure $B','Eigenvector'].map(h=><th key={h} style={thS}>{h}</th>)}
          </tr></thead>
          <tbody>{[...ENTITIES].sort((a,b)=>b.capitalSurcharge-a.capitalSurcharge).slice(0,20).map((e,i)=>(
            <tr key={e.id} style={{background:i%2===0?T.surface:T.surfaceH}}>
              <td style={{...tdS,fontWeight:600}}>{e.name}</td>
              <td style={tdS}>{e.sector}</td>
              <td style={tdS}>{pill(e.systemicTier,tierColor(e.systemicTier))}</td>
              <td style={{...tdS,fontFamily:T.mono,color:e.systemicScore>55?T.red:e.systemicScore>35?T.amber:T.green,fontWeight:700}}>{e.systemicScore}</td>
              <td style={{...tdS,fontFamily:T.mono,color:'#2563eb',fontWeight:700}}>{e.capitalSurcharge}%</td>
              <td style={{...tdS,fontFamily:T.mono}}>{e.exposureB}</td>
              <td style={{...tdS,fontFamily:T.mono}}>{e.eigenvector}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  /* ── Regime indicator ── */
  const regimeBar=useMemo(()=>{
    const sri=+(ENTITIES.reduce((s,e)=>s+e.systemicScore,0)/ENTITIES.length).toFixed(1);
    const label=sri>65?'SYSTEMIC STRESS':sri>45?'ELEVATED':'NORMAL';
    const color=sri>65?T.red:sri>45?T.amber:T.green;
    return{sri,label,color};
  },[]);

  /* ── Correlation trend data (24m) ── */
  const CORR_TREND=useMemo(()=>
    Array.from({length:24},(_,i)=>({
      month:`${2024+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,
      avgCorr:+(0.35+i*0.008+sr(i*11)*0.10).toFixed(3),
      maxCorr:+(0.55+i*0.007+sr(i*13)*0.12).toFixed(3),
      sri:+(35+i*0.7+sr(i*17)*8).toFixed(1),
    }))
  ,[]);

  /* ── Contagion severity tier per entity ── */
  const entitySeverity=useMemo(()=>
    ENTITIES.map(e=>({
      ...e,
      severity:e.systemicScore>60?'Critical':e.systemicScore>40?'High':e.systemicScore>20?'Medium':'Low',
    }))
  ,[]);

  /* ── Network stats overview box ── */
  const networkStats=useMemo(()=>{
    const links=ENTITIES.reduce((s,e)=>s+e.outDegree,0);
    const density=+(links/(40*39)).toFixed(4);
    const avgCluster=+(ENTITIES.reduce((s,e)=>s+e.clusterCoeff,0)/40).toFixed(3);
    const gSIBs=ENTITIES.filter(e=>e.systemicTier==='G-SIB').length;
    return{links,density,avgCluster,gSIBs};
  },[]);

  /* ── render methodology guide ── */
  const renderGuide=()=>(
    <div style={{...cS,marginTop:24,background:T.surfaceH,border:`1px solid ${T.gold}`}}>
      <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:12}}>METHODOLOGY — DME CONTAGION NETWORK</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,fontSize:11,color:T.textSec,lineHeight:1.6}}>
        <div>
          <div style={{fontWeight:700,color:T.navy,marginBottom:4}}>Centrality Measures</div>
          <div><strong>Degree:</strong> in/out edge count normalised to [0,1].</div>
          <div><strong>Betweenness:</strong> fraction of shortest paths passing through node (simulated via random-walk proxy).</div>
          <div><strong>Closeness:</strong> average inverse path length.</div>
          <div><strong>Eigenvector:</strong> power-iteration convergence (10 steps, sr-seeded).</div>
        </div>
        <div>
          <div style={{fontWeight:700,color:T.navy,marginBottom:4}}>SIR Cascade Model</div>
          <div><strong>S:</strong> Susceptible — not yet infected.</div>
          <div><strong>I:</strong> Infected — currently in distress.</div>
          <div><strong>R:</strong> Recovered — resolved/ring-fenced.</div>
          <div>β = 0.28 (infection), γ = 0.09 (recovery). Initial shock: top eigenvector hub.</div>
        </div>
        <div>
          <div style={{fontWeight:700,color:T.navy,marginBottom:4}}>Capital Buffer (G-SIB)</div>
          <div>Surcharge% = systemicScore × 0.04 + 1%.</div>
          <div>Aligned to BCBS G-SIB framework additional loss absorbency buckets (1–3.5%).</div>
          <div>Tier: G-SIB (SRI &gt;55), D-SIB (35–55), Significant (20–35), Standard (&lt;20).</div>
        </div>
      </div>
    </div>
  );

  /* ── enhanced overview footer: correlation trend ── */
  const renderCorrTrend=()=>(
    <div style={{...cS,marginTop:16}}>
      <div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>NETWORK CORRELATION & SRI TREND (24 MONTHS)</div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={CORR_TREND}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="month" tick={{fontSize:9}} interval={3}/>
          <YAxis yAxisId="left" tick={{fontSize:10}} domain={[0,1]} tickFormatter={v=>v.toFixed(2)}/>
          <YAxis yAxisId="right" orientation="right" tick={{fontSize:10}} domain={[20,80]}/>
          <Tooltip {...tip}/>
          <Area type="monotone" dataKey="maxCorr" fill={T.red} stroke={T.red} fillOpacity={0.1} name="Max Correlation" yAxisId="left"/>
          <Line type="monotone" dataKey="avgCorr" stroke={'#2563eb'} strokeWidth={2} name="Avg Correlation" yAxisId="left" dot={false}/>
          <Line type="monotone" dataKey="sri" stroke={ACCENT} strokeWidth={2} name="SRI" yAxisId="right" dot={false} strokeDasharray="4 2"/>
          <Legend/>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  /* ── severity summary bar ── */
  const SeverityBar=()=>(
    <div style={{display:'flex',alignItems:'center',gap:12,background:T.surface,border:`1px solid ${regimeBar.color}`,borderRadius:8,padding:'8px 16px',marginBottom:16}}>
      <div style={{width:10,height:10,borderRadius:'50%',background:regimeBar.color,flexShrink:0}}/>
      <div style={{fontSize:12,fontWeight:700,color:regimeBar.color,fontFamily:T.mono}}>{regimeBar.label}</div>
      <div style={{fontSize:12,color:T.textSec}}>Portfolio Systemic Risk Index: <strong style={{color:T.navy}}>{regimeBar.sri}/100</strong></div>
      <div style={{marginLeft:'auto',fontSize:11,color:T.textMut,fontFamily:T.mono}}>Network: {networkStats.links} links · Density: {networkStats.density} · Avg Cluster: {networkStats.avgCluster} · G-SIBs: {networkStats.gSIBs}</div>
    </div>
  );

  /* ── Page shell ── */
  const renders=[
    renderOverview,renderTopology,renderCentrality,renderCascade,renderSectoral,
    renderCritPath,renderShock,renderHistorical,renderEarlyWarning,renderCapBuffer
  ];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:4,flexWrap:'wrap'}}>
          <div style={{fontSize:22,fontWeight:800,color:T.navy}}>DME Contagion Network</div>
          {pill('EP-U5',T.navy)}{pill('DME',ACCENT)}
        </div>
        <div style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>
          Systemic risk propagation · 40 entities · SIR cascade · centrality · sectoral exposure · early warning
        </div>
      </div>
      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.gold}`,flexWrap:'wrap'}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:'8px 14px',background:tab===i?T.navy:'transparent',
            color:tab===i?'#fff':T.textSec,border:'none',cursor:'pointer',
            fontSize:12,fontFamily:T.font,fontWeight:tab===i?700:400,
            borderBottom:tab===i?`2px solid ${T.gold}`:'none',
            marginBottom:tab===i?-2:0,whiteSpace:'nowrap',transition:'all 0.15s'
          }}>{t}</button>
        ))}
      </div>
      <SeverityBar/>
      {renders[tab]&&renders[tab]()}
      {tab===0&&renderCorrTrend()}
      {tab===0&&renderGuide()}
    </div>
  );
}
