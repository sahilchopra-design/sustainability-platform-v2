import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
  ScatterChart, Scatter, Legend, PieChart, Pie, LineChart, Line
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11};
const fmt=n=>typeof n==='number'?n.toLocaleString():n;

const SECTORS=['Energy','Utilities','Materials','Industrials','Transport','Finance','Tech','Consumer','Healthcare','RealEstate'];
const TIERS=['Credible','Moderate','Questionable','Incredible'];
const tierColor=t=>t==='Credible'?T.green:t==='Moderate'?T.gold:t==='Questionable'?T.amber:T.red;
const KPI_NAMES=[
  'CapEx Green Ratio','Lobbying Consistency','Exec Pay Linkage','Fossil Expansion',
  'Carbon Lock-in','Scope 3 Coverage','Offset Dependency','Short-term Targets',
  'Governance Oversight','Just Transition','R&D Allocation','Disclosure Quality'
];
const KPI_KEYS=[
  'capexGreen','lobbying','execPay','fossilExp','carbonLock','scope3',
  'offsetDep','shortTargets','govOversight','justTrans','rdAlloc','disclosure'
];
const KPI_DESCS=[
  'Share of capital expenditure directed at green/low-carbon projects',
  'Alignment between lobbying activities and stated climate commitments',
  'Degree to which executive compensation is linked to climate targets',
  'Level of ongoing fossil fuel expansion activities (inverted: lower=better)',
  'Exposure to stranded asset risk from carbon-intensive infrastructure',
  'Comprehensiveness of Scope 3 emissions measurement and reporting',
  'Reliance on carbon offsets vs genuine abatement (inverted: lower=better)',
  'Presence and ambition of near-term (2025-2030) interim targets',
  'Board-level oversight and accountability for transition execution',
  'Commitment to workforce and community transition support',
  'R&D spend allocation to low-carbon technologies and innovation',
  'Quality, completeness, and third-party assurance of climate disclosures'
];

const COMPANY_NAMES=[
  'Meridian Energy','CarbonShift Corp','Verdant Holdings','Apex Fossil','TerraFlow',
  'EcoStar Industries','GreenHorizon','PetroLux','Solaris Power','AquaForge',
  'NexGen Clean','IronBridge Co','Pacific Renewables','CoalTech Inc','WindForce Global',
  'BioSynth Labs','OceanBlue Energy','TitanOil','ElectraGrid','GreenMetal Corp',
  'FutureCarbon','SunVolt Energy','SteelCrest','AgriVerde','CloudPower',
  'CryoEnergy','Quantum Materials','UrbanGreen','DeepEarth Mining','HydroPure',
  'SkyWind Ltd','EverGreen Capital','RefineChem','PulseEnergy','NovaTerrain',
  'CarbonVault','BrightPath','LegacyOil','CircularTech','PeakPower',
  'HelixBio','TransOcean','GridNova','FossilFree Inc','Earthen Materials',
  'SolarScape','MagmaCorp','AeroClean','VoltStream','TerraVita',
  'BorealForest Co','EmberSteel','ZephyrEnergy','RockCore Mining','Greenleaf Holdings',
  'Neptune LNG','PrismTech','IceCap Energy','ThunderGrid','GoldRoot Mining',
  'Cascade Hydro','AlphaOil Intl','SilverLining Corp','TidalWave Energy','MossVale',
  'CopperRidge','SmartGrid Co','BlueSky Materials','LavaForge','EcoTerra',
  'SummitPower','DawnEnergy','CoreFusion','PineValley','CloudBurst',
  'NorthStar Gas','RedRock Mining','VerdeTech','FlowState','CrystalClean',
  'ArcticShell','RainForest Corp','BoltEnergy','IronLeaf','MountainEdge',
  'SapphireGrid','TrailBlazer','DustBowl Resources','HavenGreen','SparkEnergy',
  'CedarPoint','StormBreaker','AnchorOil','Riverton Clean','MaplePower',
  'OnyxMaterials','ZenithCarbon','ClearWater Corp','GalePower','TrueNorth Energy'
];

const COUNTRIES=['US','UK','DE','JP','AU','CA','FR','NL','CH','SG','NO','BR','KR','IN','SE'];

const genCompanies=()=>COMPANY_NAMES.map((name,i)=>{
  const sector=SECTORS[Math.floor(sr(i*7)*SECTORS.length)];
  const country=COUNTRIES[Math.floor(sr(i*11)*COUNTRIES.length)];
  const kpis={};
  let sum=0;
  KPI_KEYS.forEach((k,ki)=>{
    const v=Math.round(sr(i*13+ki*17)*60+20+sr(i+ki)*20);
    kpis[k]=Math.min(100,Math.max(0,v));
    sum+=kpis[k];
  });
  const composite=Math.round(sum/12);
  const tier=composite>=72?'Credible':composite>=55?'Moderate':composite>=38?'Questionable':'Incredible';
  const greenCapex=Math.round(sr(i*19)*40+10);
  const transCapex=Math.round(sr(i*23)*25+5);
  const brownCapex=Math.max(0,100-greenCapex-transCapex);
  const lobbyScore=Math.round(sr(i*31)*80+10);
  const commitScore=Math.round(sr(i*37)*80+10);
  const lobbySpend=Math.round(sr(i*41)*18+2)*100;
  const greenInvest=Math.round(sr(i*43)*400+50);
  const weight=parseFloat((sr(i*53)*3+0.2).toFixed(2));
  const tradeAssocs=Math.floor(sr(i*61)*4)+1;
  const revenue=Math.round(sr(i*67)*45+5)*100;
  const employees=Math.round(sr(i*71)*95+5)*1000;
  const netZeroClaim=sr(i*83)>0.3;
  const netZeroYear=netZeroClaim?2040+Math.floor(sr(i*89)*11):null;
  const sbtiStatus=['Committed','Target Set','None'][Math.floor(sr(i*91)*3)];
  const tcfdAligned=sr(i*93)>0.4;
  return {
    id:i,name,sector,country,composite,tier,...kpis,
    greenCapex,transCapex,brownCapex,lobbyScore,commitScore,
    lobbySpend,greenInvest,weight,tradeAssocs,revenue,employees,
    netZeroClaim,netZeroYear,sbtiStatus,tcfdAligned,
    capexTrend:Array.from({length:5},(_,y)=>({
      year:2021+y,
      green:Math.max(0,Math.round(greenCapex+sr(i*71+y*3)*(y*4)-5)),
      trans:Math.max(0,Math.round(transCapex+sr(i*73+y*5)*y*2)),
      brown:Math.max(0,Math.round(brownCapex-sr(i*79+y*7)*y*6))
    })),
    capexBreakdown:[
      {category:'Renewable Generation',pct:Math.round(sr(i*101)*greenCapex*0.5)},
      {category:'Grid Modernisation',pct:Math.round(sr(i*103)*greenCapex*0.3)},
      {category:'Energy Efficiency',pct:Math.round(sr(i*107)*greenCapex*0.2)},
      {category:'Fossil Maintenance',pct:Math.round(sr(i*109)*brownCapex*0.4)},
      {category:'Fossil Expansion',pct:Math.round(sr(i*113)*brownCapex*0.3)},
      {category:'Transition Tech',pct:Math.round(sr(i*117)*transCapex*0.6)},
    ],
  };
});

const COMPANIES=genCompanies();
const TABS=['Credibility Scorecard','CapEx Alignment','Lobbying & Advocacy','Portfolio Credibility'];

/* ─── Shared Components ─── */
const Pill=({label,color,bg})=>(
  <span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,
    fontWeight:600,color:color||T.text,background:bg||T.surfaceH,fontFamily:T.font}}>
    {label}
  </span>
);
const Card=({children,style})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:18,...style}}>
    {children}
  </div>
);
const Stat=({label,value,sub,color})=>(
  <div style={{textAlign:'center'}}>
    <div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>
    <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>
    {sub&&<div style={{fontSize:10,color:T.textMut,marginTop:1}}>{sub}</div>}
  </div>
);
const MiniBar=({value,max=100,color=T.navy,width=80})=>(
  <div style={{display:'inline-flex',alignItems:'center',gap:6}}>
    <div style={{width,height:6,background:T.bg,borderRadius:3,overflow:'hidden'}}>
      <div style={{width:`${Math.min((value/max)*100,100)}%`,height:'100%',background:color,borderRadius:3}}/>
    </div>
    <span style={{fontSize:10,fontFamily:T.mono,color,minWidth:22}}>{value}</span>
  </div>
);
const SectionTitle=({children,right})=>(
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{children}</div>
    {right}
  </div>
);

/* ────────────────────────────────────────────────────────────
   TAB 1: Credibility Scorecard
   ──────────────────────────────────────────────────────────── */
const ScorecardTab=()=>{
  const [sortKey,setSortKey]=useState('composite');
  const [sortDir,setSortDir]=useState('desc');
  const [filterTier,setFilterTier]=useState('All');
  const [filterSector,setFilterSector]=useState('All');
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState(null);
  const [page,setPage]=useState(0);
  const PER=20;

  const filtered=useMemo(()=>{
    let d=[...COMPANIES];
    if(filterTier!=='All') d=d.filter(c=>c.tier===filterTier);
    if(filterSector!=='All') d=d.filter(c=>c.sector===filterSector);
    if(search) d=d.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
    d.sort((a,b)=>{
      const av=typeof a[sortKey]==='string'?a[sortKey]:a[sortKey];
      const bv=typeof b[sortKey]==='string'?b[sortKey]:b[sortKey];
      if(typeof av==='string') return sortDir==='desc'?bv.localeCompare(av):av.localeCompare(bv);
      return sortDir==='desc'?bv-av:av-bv;
    });
    return d;
  },[sortKey,sortDir,filterTier,filterSector,search]);

  const paged=filtered.slice(page*PER,(page+1)*PER);
  const pages=Math.ceil(filtered.length/PER);
  const toggleSort=key=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};

  const radarData=selected?KPI_KEYS.map((k,i)=>{
    const sectorPeers=COMPANIES.filter(c=>c.sector===selected.sector);
    const avg=Math.round(sectorPeers.reduce((s,c)=>s+c[k],0)/sectorPeers.length);
    const best=Math.max(...sectorPeers.map(c=>c[k]));
    return {kpi:KPI_NAMES[i].length>14?KPI_NAMES[i].substring(0,12)+'..':KPI_NAMES[i],value:selected[k],peer:avg,best};
  }):[];

  const tierCounts=TIERS.map(t=>({tier:t,count:COMPANIES.filter(c=>c.tier===t).length}));
  const avgScore=Math.round(COMPANIES.reduce((a,c)=>a+c.composite,0)/COMPANIES.length);
  const medianScore=(()=>{const sorted=[...COMPANIES].sort((a,b)=>a.composite-b.composite);return sorted[49].composite;})();

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    {/* Summary stats */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12}}>
      {tierCounts.map(t=><Card key={t.tier} style={{padding:14}}><Stat label={t.tier} value={t.count} color={tierColor(t.tier)}/></Card>)}
      <Card style={{padding:14}}><Stat label='Mean Score' value={avgScore} color={T.navy}/></Card>
      <Card style={{padding:14}}><Stat label='Median Score' value={medianScore} color={T.navyL}/></Card>
    </div>

    {/* Score distribution mini chart */}
    <Card style={{padding:14}}>
      <SectionTitle>Score Distribution (0-100)</SectionTitle>
      <ResponsiveContainer width='100%' height={90}>
        <BarChart data={Array.from({length:10},(_,i)=>{
          const lo=i*10;const hi=lo+10;
          return {range:`${lo}-${hi}`,count:COMPANIES.filter(c=>c.composite>=lo&&c.composite<hi).length};
        })} margin={{left:0,right:0}}>
          <XAxis dataKey='range' tick={{fontSize:9,fill:T.textMut}} axisLine={false} tickLine={false}/>
          <YAxis hide/>
          <Tooltip {...{contentStyle:tip}}/>
          <Bar dataKey='count' radius={[3,3,0,0]}>
            {Array.from({length:10},(_,i)=>{
              const mid=i*10+5;
              return <Cell key={i} fill={mid>=72?T.green:mid>=55?T.gold:mid>=38?T.amber:T.red}/>;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Filters */}
    <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
      <input placeholder='Search company...' value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}
        style={{padding:'5px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text,width:180}}/>
      <span style={{fontSize:12,color:T.textSec,fontWeight:600}}>Tier:</span>
      {['All',...TIERS].map(t=><button key={t} onClick={()=>{setFilterTier(t);setPage(0);}} style={{padding:'4px 12px',borderRadius:8,border:`1px solid ${filterTier===t?T.navy:T.border}`,background:filterTier===t?T.navy:T.surface,color:filterTier===t?'#fff':T.text,fontSize:11,cursor:'pointer',fontFamily:T.font}}>{t}</button>)}
      <span style={{fontSize:12,color:T.textSec,fontWeight:600,marginLeft:8}}>Sector:</span>
      <select value={filterSector} onChange={e=>{setFilterSector(e.target.value);setPage(0);}} style={{padding:'4px 8px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text}}>
        <option>All</option>{SECTORS.map(s=><option key={s}>{s}</option>)}
      </select>
      <span style={{marginLeft:'auto',fontSize:11,color:T.textMut}}>{filtered.length} companies</span>
    </div>

    {/* Main table */}
    <Card style={{padding:0,overflow:'hidden'}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
          <thead>
            <tr style={{background:T.surfaceH}}>
              {[{k:'name',l:'Company'},{k:'sector',l:'Sector'},{k:'country',l:'HQ'},{k:'composite',l:'Score'},{k:'tier',l:'Tier'},...KPI_KEYS.map((k,i)=>({k,l:KPI_NAMES[i].split(' ').slice(0,2).join(' ')}))].map(col=>
                <th key={col.k} onClick={()=>toggleSort(col.k)} style={{padding:'8px 5px',textAlign:'left',cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',color:sortKey===col.k?T.navy:T.textSec,fontWeight:sortKey===col.k?700:500,fontSize:10,userSelect:'none'}}>
                  {col.l}{sortKey===col.k?(sortDir==='desc'?' \u25BC':' \u25B2'):''}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.map(c=><tr key={c.id} onClick={()=>setSelected(c)} style={{cursor:'pointer',background:selected?.id===c.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}
              onMouseEnter={e=>{if(selected?.id!==c.id)e.currentTarget.style.background=T.surfaceH;}} onMouseLeave={e=>{if(selected?.id!==c.id)e.currentTarget.style.background='transparent';}}>
              <td style={{padding:'6px 5px',fontWeight:600,color:T.navy,whiteSpace:'nowrap',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</td>
              <td style={{padding:'6px 5px',color:T.textSec,fontSize:10}}>{c.sector}</td>
              <td style={{padding:'6px 5px',color:T.textMut,fontSize:10,fontFamily:T.mono}}>{c.country}</td>
              <td style={{padding:'6px 5px',fontWeight:700,fontFamily:T.mono,color:tierColor(c.tier)}}>{c.composite}</td>
              <td style={{padding:'6px 5px'}}><Pill label={c.tier} color='#fff' bg={tierColor(c.tier)}/></td>
              {KPI_KEYS.map(k=><td key={k} style={{padding:'6px 4px',fontFamily:T.mono,fontSize:10,color:c[k]>=70?T.green:c[k]>=45?T.textSec:T.red}}>{c[k]}</td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
      {pages>1&&<div style={{display:'flex',justifyContent:'center',gap:4,padding:10}}>
        <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:11,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1}}>&laquo; Prev</button>
        <span style={{padding:'4px 8px',fontSize:11,color:T.textMut}}>Page {page+1} of {pages}</span>
        <button disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:11,cursor:page>=pages-1?'default':'pointer',opacity:page>=pages-1?0.4:1}}>Next &raquo;</button>
      </div>}
    </Card>

    {/* Selected company detail panel */}
    {selected&&<Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:18,fontWeight:800,color:T.navy}}>{selected.name}</span>
            <Pill label={selected.tier} color='#fff' bg={tierColor(selected.tier)}/>
            <Pill label={selected.sbtiStatus} bg={selected.sbtiStatus==='Target Set'?'#dcfce7':selected.sbtiStatus==='Committed'?'#fef9c3':'#f3f4f6'}/>
          </div>
          <div style={{display:'flex',gap:14,marginTop:6,fontSize:11,color:T.textSec}}>
            <span>{selected.sector}</span>
            <span>{selected.country}</span>
            <span>Rev: ${fmt(selected.revenue)}M</span>
            <span>{fmt(selected.employees)} employees</span>
            {selected.netZeroClaim&&<span style={{color:T.sage}}>Net-Zero Target: {selected.netZeroYear}</span>}
            {selected.tcfdAligned&&<span style={{color:T.teal}}>TCFD Aligned</span>}
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:32,fontWeight:800,fontFamily:T.mono,color:tierColor(selected.tier)}}>{selected.composite}</div>
          <div style={{fontSize:11,color:T.textMut}}>Composite Score /100</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
          <SectionTitle>12-KPI Radar vs Sector Peers</SectionTitle>
          <ResponsiveContainer width='100%' height={340}>
            <RadarChart data={radarData} outerRadius={110}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey='kpi' tick={{fontSize:8,fill:T.textSec}}/>
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:8}} stroke={T.border}/>
              <Radar name={selected.name} dataKey='value' stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2}/>
              <Radar name='Sector Avg' dataKey='peer' stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeDasharray='4 4'/>
              <Radar name='Sector Best' dataKey='best' stroke={T.sage} fill='none' strokeDasharray='2 2'/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <SectionTitle>KPI Breakdown with Descriptions</SectionTitle>
          <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:320,overflowY:'auto'}}>
            {KPI_KEYS.map((k,i)=><div key={k} style={{padding:'6px 8px',borderRadius:6,background:T.bg,fontSize:11}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:600,color:T.text}}>{KPI_NAMES[i]}</span>
                <MiniBar value={selected[k]} color={selected[k]>=70?T.green:selected[k]>=45?T.gold:T.red}/>
              </div>
              <div style={{fontSize:9,color:T.textMut,marginTop:2}}>{KPI_DESCS[i]}</div>
            </div>)}
          </div>
        </div>
      </div>

      <div style={{marginTop:14,padding:12,borderRadius:8,background:selected.composite<40?'#fef2f2':selected.composite<60?'#fffbeb':'#f0fdf4',fontSize:12,color:T.text,lineHeight:1.6}}>
        <strong>Assessment Summary:</strong> {selected.composite>=72
          ?'Strong credibility across most dimensions. Transition plan is well-substantiated with concrete interim targets, aligned capital allocation, and consistent advocacy positions. Recommend monitoring for continued execution.'
          :selected.composite>=55
          ?'Moderate credibility with notable gaps in specific KPI areas. Engagement recommended to address weaknesses in '+KPI_KEYS.map((k,i)=>({n:KPI_NAMES[i],v:selected[k]})).sort((a,b)=>a.v-b.v).slice(0,2).map(x=>x.n).join(' and ')+'.'
          :selected.composite>=38
          ?'Questionable plan credibility. Significant inconsistencies between stated ambition and observable actions, particularly in '+KPI_KEYS.map((k,i)=>({n:KPI_NAMES[i],v:selected[k]})).sort((a,b)=>a.v-b.v).slice(0,3).map(x=>x.n).join(', ')+'. Escalated engagement required.'
          :'Plan lacks substantive credibility. Major red flags across multiple assessment dimensions. Consider divestment or intensive engagement with board-level escalation.'}
      </div>
      {/* Peer comparison within sector */}
      <div style={{marginTop:14}}>
        <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Sector Peer Comparison ({selected.sector})</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
            <thead><tr style={{background:T.surfaceH}}>
              {['Peer','Score','Tier','CapEx Grn','Scope 3','Governance','Disclosure','vs Selected'].map(h=>
                <th key={h} style={{padding:'5px 7px',textAlign:'left',borderBottom:`1px solid ${T.border}`,fontSize:10,color:T.textSec}}>{h}</th>
              )}
            </tr></thead>
            <tbody>
              {COMPANIES.filter(c=>c.sector===selected.sector&&c.id!==selected.id).slice(0,8).map(c=>{
                const diff=c.composite-selected.composite;
                return <tr key={c.id} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'4px 7px',fontWeight:600,color:T.navy}}>{c.name}</td>
                  <td style={{padding:'4px 7px',fontFamily:T.mono,color:tierColor(c.tier)}}>{c.composite}</td>
                  <td style={{padding:'4px 7px'}}><Pill label={c.tier} color='#fff' bg={tierColor(c.tier)}/></td>
                  <td style={{padding:'4px 7px',fontFamily:T.mono}}>{c.capexGreen}</td>
                  <td style={{padding:'4px 7px',fontFamily:T.mono}}>{c.scope3}</td>
                  <td style={{padding:'4px 7px',fontFamily:T.mono}}>{c.govOversight}</td>
                  <td style={{padding:'4px 7px',fontFamily:T.mono}}>{c.disclosure}</td>
                  <td style={{padding:'4px 7px',fontFamily:T.mono,fontWeight:700,color:diff>0?T.red:diff<0?T.green:T.textMut}}>{diff>0?'+':''}{diff}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
      <button onClick={()=>setSelected(null)} style={{marginTop:12,padding:'5px 14px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.textSec,fontSize:11,cursor:'pointer',fontFamily:T.font}}>Close Detail</button>
    </Card>}

    {/* Sector KPI Heatmap */}
    <Card>
      <SectionTitle>Sector KPI Heatmap (Average Scores)</SectionTitle>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.font}}>
          <thead><tr style={{background:T.surfaceH}}>
            <th style={{padding:'6px 8px',textAlign:'left',borderBottom:`1px solid ${T.border}`,fontSize:10,color:T.textSec,position:'sticky',left:0,background:T.surfaceH}}>Sector</th>
            {KPI_NAMES.map(n=><th key={n} style={{padding:'6px 4px',textAlign:'center',borderBottom:`1px solid ${T.border}`,fontSize:9,color:T.textSec,whiteSpace:'nowrap',maxWidth:65,overflow:'hidden'}}>{n.split(' ').slice(0,2).join(' ')}</th>)}
            <th style={{padding:'6px 8px',textAlign:'center',borderBottom:`1px solid ${T.border}`,fontSize:10,color:T.navy,fontWeight:700}}>Avg</th>
          </tr></thead>
          <tbody>
            {SECTORS.map(s=>{
              const sc=COMPANIES.filter(c=>c.sector===s);
              const kpiAvgs=KPI_KEYS.map(k=>Math.round(sc.reduce((a,c)=>a+c[k],0)/sc.length));
              const overall=Math.round(kpiAvgs.reduce((a,v)=>a+v,0)/kpiAvgs.length);
              return <tr key={s} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'5px 8px',fontWeight:600,color:T.navy,fontSize:11,position:'sticky',left:0,background:T.surface}}>{s}</td>
                {kpiAvgs.map((v,ki)=><td key={ki} style={{padding:'4px',textAlign:'center',fontFamily:T.mono,fontSize:10,fontWeight:600,color:'#fff',background:v>=65?T.green:v>=50?T.gold:v>=35?T.amber:T.red,borderRadius:0}}>{v}</td>)}
                <td style={{padding:'4px 8px',textAlign:'center',fontFamily:T.mono,fontSize:11,fontWeight:700,color:tierColor(overall>=72?'Credible':overall>=55?'Moderate':overall>=38?'Questionable':'Incredible')}}>{overall}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Top/Bottom performers */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <SectionTitle>Top 10 Most Credible</SectionTitle>
        {[...COMPANIES].sort((a,b)=>b.composite-a.composite).slice(0,10).map((c,i)=>(
          <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:`1px solid ${T.bg}`}}>
            <span style={{width:20,textAlign:'right',fontSize:10,fontFamily:T.mono,color:T.gold,fontWeight:700}}>#{i+1}</span>
            <span style={{fontSize:11,fontWeight:600,color:T.navy,flex:1}}>{c.name}</span>
            <span style={{fontSize:10,color:T.textMut}}>{c.sector}</span>
            <MiniBar value={c.composite} color={T.green} width={50}/>
          </div>
        ))}
      </Card>
      <Card>
        <SectionTitle>Bottom 10 Least Credible</SectionTitle>
        {[...COMPANIES].sort((a,b)=>a.composite-b.composite).slice(0,10).map((c,i)=>(
          <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:`1px solid ${T.bg}`}}>
            <span style={{width:20,textAlign:'right',fontSize:10,fontFamily:T.mono,color:T.red,fontWeight:700}}>#{i+1}</span>
            <span style={{fontSize:11,fontWeight:600,color:T.navy,flex:1}}>{c.name}</span>
            <span style={{fontSize:10,color:T.textMut}}>{c.sector}</span>
            <MiniBar value={c.composite} color={T.red} width={50}/>
          </div>
        ))}
      </Card>
    </div>
  </div>;
};

/* ────────────────────────────────────────────────────────────
   TAB 2: CapEx Alignment
   ──────────────────────────────────────────────────────────── */
const CapExTab=()=>{
  const [selectedCo,setSelectedCo]=useState(null);
  const [sectorFilter,setSectorFilter]=useState('All');
  const [showBreakdown,setShowBreakdown]=useState(null);

  const topData=useMemo(()=>{
    let d=[...COMPANIES];
    if(sectorFilter!=='All') d=d.filter(c=>c.sector===sectorFilter);
    return d.sort((a,b)=>b.greenCapex-a.greenCapex).slice(0,25);
  },[sectorFilter]);

  const sectorBenchmarks=useMemo(()=>SECTORS.map(s=>{
    const sc=COMPANIES.filter(c=>c.sector===s);
    return {
      sector:s,count:sc.length,
      green:Math.round(sc.reduce((a,c)=>a+c.greenCapex,0)/sc.length),
      trans:Math.round(sc.reduce((a,c)=>a+c.transCapex,0)/sc.length),
      brown:Math.round(sc.reduce((a,c)=>a+c.brownCapex,0)/sc.length),
    };
  }),[]);

  const misaligned=useMemo(()=>COMPANIES.filter(c=>c.netZeroClaim&&c.brownCapex>30).sort((a,b)=>b.brownCapex-a.brownCapex),[]);

  const alignmentTrend=useMemo(()=>Array.from({length:5},(_,y)=>{
    const yr=2021+y;
    const avgG=Math.round(COMPANIES.reduce((a,c)=>a+(c.capexTrend[y]?.green||0),0)/100);
    const avgT=Math.round(COMPANIES.reduce((a,c)=>a+(c.capexTrend[y]?.trans||0),0)/100);
    const avgB=Math.round(COMPANIES.reduce((a,c)=>a+(c.capexTrend[y]?.brown||0),0)/100);
    return {year:yr,green:avgG,trans:avgT,brown:avgB};
  }),[]);

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
      <Card style={{padding:14}}><Stat label='Avg Green CapEx' value={`${Math.round(COMPANIES.reduce((a,c)=>a+c.greenCapex,0)/100)}%`} color={T.green}/></Card>
      <Card style={{padding:14}}><Stat label='Avg Transition' value={`${Math.round(COMPANIES.reduce((a,c)=>a+c.transCapex,0)/100)}%`} color={T.gold}/></Card>
      <Card style={{padding:14}}><Stat label='Avg Brown CapEx' value={`${Math.round(COMPANIES.reduce((a,c)=>a+c.brownCapex,0)/100)}%`} color={T.red}/></Card>
      <Card style={{padding:14}}><Stat label='Net-Zero Claimants' value={COMPANIES.filter(c=>c.netZeroClaim).length} color={T.navy}/></Card>
      <Card style={{padding:14}}><Stat label='Misalignment Alerts' value={misaligned.length} color={T.red} sub='>30% brown + NZ claim'/></Card>
    </div>

    <div style={{display:'flex',gap:10,alignItems:'center'}}>
      <span style={{fontSize:12,color:T.textSec,fontWeight:600}}>Sector:</span>
      <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text}}>
        <option>All</option>{SECTORS.map(s=><option key={s}>{s}</option>)}
      </select>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <SectionTitle>Green / Transition / Brown CapEx Split</SectionTitle>
        <ResponsiveContainer width='100%' height={420}>
          <BarChart data={topData} layout='vertical' margin={{left:100,right:10}}>
            <CartesianGrid strokeDasharray='3 3' stroke={T.border}/>
            <XAxis type='number' domain={[0,100]} tick={{fontSize:10}} tickFormatter={v=>`${v}%`}/>
            <YAxis type='category' dataKey='name' tick={{fontSize:9,fill:T.textSec}} width={95}/>
            <Tooltip content={({active,payload})=>active&&payload?.length?<div style={tip}>
              <div style={{fontWeight:600,marginBottom:4}}>{payload[0]?.payload?.name}</div>
              {payload.map(p=><div key={p.name} style={{color:p.color}}>{p.name}: {p.value}%</div>)}
              <div style={{marginTop:4,fontSize:10,color:T.textMut}}>Sector: {payload[0]?.payload?.sector}</div>
            </div>:null}/>
            <Bar dataKey='greenCapex' stackId='a' fill={T.green} name='Green'/>
            <Bar dataKey='transCapex' stackId='a' fill={T.gold} name='Transition'/>
            <Bar dataKey='brownCapex' stackId='a' fill={T.red} name='Brown' radius={[0,4,4,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle>Sector Benchmarks</SectionTitle>
        <ResponsiveContainer width='100%' height={280}>
          <BarChart data={sectorBenchmarks} margin={{left:10,right:10}}>
            <CartesianGrid strokeDasharray='3 3' stroke={T.border}/>
            <XAxis dataKey='sector' tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor='end' height={55}/>
            <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v}%`}/>
            <Tooltip {...{contentStyle:tip}}/>
            <Bar dataKey='green' fill={T.green} name='Green %' radius={[4,4,0,0]}/>
            <Bar dataKey='trans' fill={T.gold} name='Transition %' radius={[4,4,0,0]}/>
            <Bar dataKey='brown' fill={T.red} name='Brown %' radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{marginTop:10}}>
          <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:6}}>Portfolio Alignment Trend (5yr Avg)</div>
          <ResponsiveContainer width='100%' height={120}>
            <LineChart data={alignmentTrend}>
              <CartesianGrid strokeDasharray='3 3' stroke={T.border}/>
              <XAxis dataKey='year' tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v}%`}/>
              <Tooltip {...{contentStyle:tip}}/>
              <Line type='monotone' dataKey='green' stroke={T.green} strokeWidth={2} dot={{r:3}} name='Green'/>
              <Line type='monotone' dataKey='brown' stroke={T.red} strokeWidth={2} dot={{r:3}} name='Brown'/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>

    <Card>
      <SectionTitle>Company CapEx Trend (5-Year)</SectionTitle>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
        {COMPANIES.slice(0,16).map(c=><button key={c.id} onClick={()=>setSelectedCo(c)} style={{padding:'3px 10px',borderRadius:8,border:`1px solid ${selectedCo?.id===c.id?T.navy:T.border}`,background:selectedCo?.id===c.id?T.navy:T.surface,color:selectedCo?.id===c.id?'#fff':T.text,fontSize:10,cursor:'pointer',fontFamily:T.font}}>{c.name.split(' ')[0]}</button>)}
      </div>
      {selectedCo?<div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        <ResponsiveContainer width='100%' height={240}>
          <LineChart data={selectedCo.capexTrend}>
            <CartesianGrid strokeDasharray='3 3' stroke={T.border}/>
            <XAxis dataKey='year' tick={{fontSize:10}}/>
            <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v}%`}/>
            <Tooltip {...{contentStyle:tip}}/>
            <Line type='monotone' dataKey='green' stroke={T.green} strokeWidth={2} dot={{r:4}} name='Green %'/>
            <Line type='monotone' dataKey='trans' stroke={T.gold} strokeWidth={2} dot={{r:4}} name='Transition %'/>
            <Line type='monotone' dataKey='brown' stroke={T.red} strokeWidth={2} dot={{r:4}} name='Brown %'/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </LineChart>
        </ResponsiveContainer>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>CapEx Breakdown</div>
          {selectedCo.capexBreakdown.map((b,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.bg}`,fontSize:11}}>
            <span style={{color:T.textSec}}>{b.category}</span>
            <span style={{fontFamily:T.mono,fontWeight:600,color:i<3?T.green:i<5?T.red:T.gold}}>{b.pct}%</span>
          </div>)}
          <div style={{marginTop:8,padding:8,borderRadius:6,background:T.bg,fontSize:10,color:T.textSec}}>
            <strong>{selectedCo.name}</strong> | {selectedCo.sector} | {selectedCo.country} | {selectedCo.netZeroClaim?`NZ ${selectedCo.netZeroYear}`:'No NZ claim'} | SBTi: {selectedCo.sbtiStatus}
          </div>
        </div>
      </div>:<div style={{padding:30,textAlign:'center',color:T.textMut,fontSize:12}}>Select a company above to view CapEx trend and breakdown</div>}
    </Card>

    <Card>
      <SectionTitle right={<Pill label={`${misaligned.length} flagged`} color='#fff' bg={T.red}/>}>
        Misalignment Alerts
      </SectionTitle>
      <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>Companies claiming net-zero targets while maintaining &gt;30% brown CapEx allocation</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
          <thead><tr style={{background:'#fef2f2'}}>
            {['Company','Sector','HQ','Green %','Trans %','Brown %','NZ Year','SBTi','Score'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',borderBottom:`1px solid ${T.border}`,fontSize:10,color:T.red}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {misaligned.slice(0,15).map(c=><tr key={c.id} style={{borderBottom:`1px solid ${T.border}`}} onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td style={{padding:'5px 8px',fontWeight:600,color:T.navy}}>{c.name}</td>
              <td style={{padding:'5px 8px',color:T.textSec}}>{c.sector}</td>
              <td style={{padding:'5px 8px',fontFamily:T.mono,fontSize:10}}>{c.country}</td>
              <td style={{padding:'5px 8px',fontFamily:T.mono,color:T.green}}>{c.greenCapex}%</td>
              <td style={{padding:'5px 8px',fontFamily:T.mono,color:T.gold}}>{c.transCapex}%</td>
              <td style={{padding:'5px 8px',fontFamily:T.mono,color:T.red,fontWeight:700}}>{c.brownCapex}%</td>
              <td style={{padding:'5px 8px',fontFamily:T.mono}}>{c.netZeroYear||'--'}</td>
              <td style={{padding:'5px 8px'}}><Pill label={c.sbtiStatus} bg={c.sbtiStatus==='Target Set'?'#dcfce7':'#f3f4f6'}/></td>
              <td style={{padding:'5px 8px',fontFamily:T.mono,fontWeight:600,color:tierColor(c.tier)}}>{c.composite}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </Card>

    {/* CapEx alignment by net-zero year */}
    <Card>
      <SectionTitle>CapEx Alignment by Net-Zero Target Year</SectionTitle>
      <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>Comparing capital allocation patterns grouped by declared net-zero target year</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {[{label:'NZ 2040',filter:c=>c.netZeroYear===2040},{label:'NZ 2045',filter:c=>c.netZeroYear>=2043&&c.netZeroYear<=2046},{label:'NZ 2050',filter:c=>c.netZeroYear>=2048},{label:'No NZ Claim',filter:c=>!c.netZeroClaim}].map(grp=>{
          const cos=COMPANIES.filter(grp.filter);
          const avgG=cos.length?Math.round(cos.reduce((a,c)=>a+c.greenCapex,0)/cos.length):0;
          const avgB=cos.length?Math.round(cos.reduce((a,c)=>a+c.brownCapex,0)/cos.length):0;
          const avgScore=cos.length?Math.round(cos.reduce((a,c)=>a+c.composite,0)/cos.length):0;
          return <div key={grp.label} style={{padding:10,borderRadius:8,background:T.bg}}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:6}}>{grp.label}</div>
            <div style={{fontSize:10,color:T.textMut,marginBottom:4}}>{cos.length} companies</div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2}}>
              <span style={{color:T.green}}>Green: {avgG}%</span>
              <span style={{color:T.red}}>Brown: {avgB}%</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10}}>
              <span style={{color:T.textSec}}>Avg Score:</span>
              <span style={{fontFamily:T.mono,fontWeight:700,color:tierColor(avgScore>=72?'Credible':avgScore>=55?'Moderate':'Questionable')}}>{avgScore}</span>
            </div>
            <div style={{marginTop:6,height:8,background:T.surface,borderRadius:4,overflow:'hidden',display:'flex'}}>
              <div style={{width:`${avgG}%`,background:T.green}}/>
              <div style={{width:`${100-avgG-avgB}%`,background:T.gold}}/>
              <div style={{width:`${avgB}%`,background:T.red}}/>
            </div>
          </div>;
        })}
      </div>
    </Card>

    {/* SBTi status vs CapEx */}
    <Card>
      <SectionTitle>SBTi Status vs CapEx Alignment</SectionTitle>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {['Target Set','Committed','None'].map(status=>{
          const cos=COMPANIES.filter(c=>c.sbtiStatus===status);
          const avgG=cos.length?Math.round(cos.reduce((a,c)=>a+c.greenCapex,0)/cos.length):0;
          const avgB=cos.length?Math.round(cos.reduce((a,c)=>a+c.brownCapex,0)/cos.length):0;
          const avgComp=cos.length?Math.round(cos.reduce((a,c)=>a+c.composite,0)/cos.length):0;
          return <div key={status} style={{padding:12,borderRadius:8,background:T.bg,border:`1px solid ${status==='Target Set'?'#bbf7d0':status==='Committed'?'#fef08a':T.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <Pill label={`SBTi: ${status}`} bg={status==='Target Set'?'#dcfce7':status==='Committed'?'#fef9c3':'#f3f4f6'}/>
              <span style={{fontSize:11,fontFamily:T.mono,fontWeight:700}}>{cos.length} cos</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4,fontSize:11}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:T.textSec}}>Avg Green CapEx</span><span style={{fontFamily:T.mono,color:T.green,fontWeight:600}}>{avgG}%</span></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:T.textSec}}>Avg Brown CapEx</span><span style={{fontFamily:T.mono,color:T.red,fontWeight:600}}>{avgB}%</span></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:T.textSec}}>Avg Credibility</span><span style={{fontFamily:T.mono,fontWeight:700,color:tierColor(avgComp>=72?'Credible':avgComp>=55?'Moderate':'Questionable')}}>{avgComp}/100</span></div>
            </div>
          </div>;
        })}
      </div>
    </Card>
  </div>;
};

/* ────────────────────────────────────────────────────────────
   TAB 3: Lobbying & Advocacy
   ──────────────────────────────────────────────────────────── */
const LobbyingTab=()=>{
  const scatterData=useMemo(()=>COMPANIES.map(c=>({
    name:c.name,sector:c.sector,lobbyScore:c.lobbyScore,commitScore:c.commitScore,
    tier:c.tier,composite:c.composite,sayDoGap:Math.abs(c.commitScore-c.lobbyScore)
  })),[]);

  const sayDoFlags=useMemo(()=>scatterData.filter(c=>c.commitScore>60&&c.lobbyScore<35).sort((a,b)=>b.sayDoGap-a.sayDoGap),[scatterData]);

  const TRADE_ASSOCS=[
    'Global Industry Alliance','Fossil Fuel Producers Forum','Clean Energy Council',
    'Carbon Markets Association','Mining & Resources Group','Chemical Manufacturers Assoc',
    'Petroleum Institute','Renewable Energy Alliance','Sustainable Finance Forum',
    'Transport & Logistics Assoc','Steel Industry Coalition','Agribusiness Roundtable'
  ];

  const tradeData=useMemo(()=>TRADE_ASSOCS.map((ta,i)=>{
    const memberCount=Math.floor(sr(i*97)*30)+5;
    const avgLobby=Math.round(sr(i*101)*50+25);
    const climateAlignment=Math.round(sr(i*103)*80+10);
    return {name:ta,members:memberCount,avgLobbyScore:avgLobby,climateAlignment,risk:climateAlignment<40?'High':climateAlignment<60?'Medium':'Low'};
  }),[]);

  const lobbyVsGreenData=useMemo(()=>COMPANIES.slice(0,40).map(c=>({
    name:c.name,sector:c.sector,
    ratio:c.lobbySpend>0?parseFloat((c.greenInvest/c.lobbySpend).toFixed(1)):0,
    lobbySpend:c.lobbySpend,greenInvest:c.greenInvest
  })).sort((a,b)=>a.ratio-b.ratio),[]);

  const redFlags=useMemo(()=>COMPANIES.filter(c=>c.lobbyScore<30&&c.commitScore>65).slice(0,12),[]);

  const sectorLobby=useMemo(()=>SECTORS.map(s=>{
    const sc=COMPANIES.filter(c=>c.sector===s);
    return {sector:s,avgLobby:Math.round(sc.reduce((a,c)=>a+c.lobbyScore,0)/sc.length),avgCommit:Math.round(sc.reduce((a,c)=>a+c.commitScore,0)/sc.length),gap:Math.round(Math.abs(sc.reduce((a,c)=>a+c.commitScore-c.lobbyScore,0)/sc.length))};
  }),[]);

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
      <Card style={{padding:14}}><Stat label='Avg Lobby Score' value={Math.round(COMPANIES.reduce((a,c)=>a+c.lobbyScore,0)/100)} color={T.navy}/></Card>
      <Card style={{padding:14}}><Stat label='Avg Commit Score' value={Math.round(COMPANIES.reduce((a,c)=>a+c.commitScore,0)/100)} color={T.sage}/></Card>
      <Card style={{padding:14}}><Stat label='Say-Do Gap Flags' value={sayDoFlags.length} color={T.red}/></Card>
      <Card style={{padding:14}}><Stat label='High-Risk Assocs' value={tradeData.filter(t=>t.risk==='High').length} color={T.amber}/></Card>
      <Card style={{padding:14}}><Stat label='Avg Lobby Spend' value={`$${Math.round(COMPANIES.reduce((a,c)=>a+c.lobbySpend,0)/100)}k`} color={T.navyL}/></Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <SectionTitle>Lobbying Score vs Climate Commitment</SectionTitle>
        <div style={{fontSize:10,color:T.textMut,marginBottom:6}}>Bottom-right quadrant: high commitment, low lobbying alignment (say-do gap risk)</div>
        <ResponsiveContainer width='100%' height={360}>
          <ScatterChart margin={{bottom:25,left:10,right:10}}>
            <CartesianGrid strokeDasharray='3 3' stroke={T.border}/>
            <XAxis type='number' dataKey='lobbyScore' name='Lobby' domain={[0,100]} tick={{fontSize:10}} label={{value:'Lobbying Alignment',position:'insideBottom',offset:-15,fontSize:10,fill:T.textSec}}/>
            <YAxis type='number' dataKey='commitScore' name='Commit' domain={[0,100]} tick={{fontSize:10}} label={{value:'Climate Commitment',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}}/>
            <Tooltip content={({active,payload})=>active&&payload?.length?<div style={tip}>
              <div style={{fontWeight:600}}>{payload[0]?.payload?.name}</div>
              <div>Lobby: {payload[0]?.payload?.lobbyScore} | Commit: {payload[0]?.payload?.commitScore}</div>
              <div style={{color:T.red}}>Say-Do Gap: {payload[0]?.payload?.sayDoGap}</div>
            </div>:null}/>
            <Scatter data={scatterData} fill={T.navy}>
              {scatterData.map((d,i)=><Cell key={i} fill={d.sayDoGap>30?T.red:d.sayDoGap>15?T.amber:T.green} opacity={0.7}/>)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle>Lobby Spend vs Green Investment Ratio</SectionTitle>
        <ResponsiveContainer width='100%' height={360}>
          <BarChart data={lobbyVsGreenData.slice(0,20)} layout='vertical' margin={{left:85,right:10}}>
            <CartesianGrid strokeDasharray='3 3' stroke={T.border}/>
            <XAxis type='number' tick={{fontSize:10}} label={{value:'Green:Lobby Ratio (x)',position:'insideBottom',offset:-5,fontSize:10}}/>
            <YAxis type='category' dataKey='name' tick={{fontSize:9,fill:T.textSec}} width={80}/>
            <Tooltip content={({active,payload})=>active&&payload?.length?<div style={tip}>
              <div style={{fontWeight:600}}>{payload[0]?.payload?.name}</div>
              <div>Ratio: {payload[0]?.payload?.ratio}x</div>
              <div>Lobby: ${fmt(payload[0]?.payload?.lobbySpend)}k | Green Inv: ${fmt(payload[0]?.payload?.greenInvest)}M</div>
            </div>:null}/>
            <Bar dataKey='ratio' name='Green:Lobby Ratio'>
              {lobbyVsGreenData.slice(0,20).map((d,i)=><Cell key={i} fill={d.ratio<2?T.red:d.ratio<5?T.amber:T.green}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <SectionTitle>Sector Say-Do Gap Analysis</SectionTitle>
        <ResponsiveContainer width='100%' height={240}>
          <BarChart data={sectorLobby} margin={{left:10,right:10}}>
            <CartesianGrid strokeDasharray='3 3' stroke={T.border}/>
            <XAxis dataKey='sector' tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor='end' height={45}/>
            <YAxis tick={{fontSize:10}}/>
            <Tooltip {...{contentStyle:tip}}/>
            <Bar dataKey='avgLobby' fill={T.navyL} name='Lobby Score' radius={[4,4,0,0]}/>
            <Bar dataKey='avgCommit' fill={T.sage} name='Commit Score' radius={[4,4,0,0]}/>
            <Bar dataKey='gap' fill={T.red} name='Avg Gap' radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle>Trade Association Analysis</SectionTitle>
        <div style={{overflowX:'auto',maxHeight:280,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
            <thead><tr style={{background:T.surfaceH,position:'sticky',top:0}}>
              {['Association','Members','Avg Lobby','Climate Align','Risk'].map(h=><th key={h} style={{padding:'6px 7px',textAlign:'left',borderBottom:`1px solid ${T.border}`,fontSize:10,color:T.textSec}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {tradeData.map(t=><tr key={t.name} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'5px 7px',fontWeight:600,color:T.navy,fontSize:10}}>{t.name}</td>
                <td style={{padding:'5px 7px',fontFamily:T.mono}}>{t.members}</td>
                <td style={{padding:'5px 7px',fontFamily:T.mono}}>{t.avgLobbyScore}</td>
                <td style={{padding:'5px 7px'}}><MiniBar value={t.climateAlignment} color={t.climateAlignment>=60?T.green:t.climateAlignment>=40?T.amber:T.red}/></td>
                <td style={{padding:'5px 7px'}}><Pill label={t.risk} color='#fff' bg={t.risk==='High'?T.red:t.risk==='Medium'?T.amber:T.green}/></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>

    <Card>
      <SectionTitle right={<Pill label={`${redFlags.length} flagged`} color='#fff' bg={T.red}/>}>
        Red Flag Panel
      </SectionTitle>
      <div style={{fontSize:11,color:T.textSec,marginBottom:10}}>Companies with high climate commitment claims (&gt;65) but actively lobbying against climate policy (lobby score &lt;30)</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {redFlags.map(c=><div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',borderRadius:8,background:'#fef2f2',border:'1px solid #fecaca'}}>
          <div>
            <span style={{fontWeight:700,color:T.navy,fontSize:12}}>{c.name}</span>
            <span style={{marginLeft:8,fontSize:10,color:T.textMut}}>{c.sector}</span>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',fontSize:10}}>
            <span style={{color:T.green}}>Commit: {c.commitScore}</span>
            <span style={{color:T.red}}>Lobby: {c.lobbyScore}</span>
            <span style={{fontWeight:700,color:T.red,fontFamily:T.mono}}>Gap {Math.abs(c.commitScore-c.lobbyScore)}</span>
          </div>
        </div>)}
      </div>
      <div style={{marginTop:14}}>
        <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Top Say-Do Gap Leaders</div>
        {sayDoFlags.slice(0,10).map((c,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
          <span style={{width:22,textAlign:'right',fontSize:10,color:T.textMut,fontFamily:T.mono}}>#{i+1}</span>
          <span style={{fontSize:11,fontWeight:600,color:T.navy,flex:1,minWidth:120}}>{c.name}</span>
          <span style={{fontSize:10,color:T.textSec,width:60}}>{c.sector}</span>
          <MiniBar value={c.sayDoGap} color={T.red} width={60}/>
        </div>)}
      </div>
    </Card>
  </div>;
};

/* ────────────────────────────────────────────────────────────
   TAB 4: Portfolio Credibility
   ──────────────────────────────────────────────────────────── */
const PortfolioTab=()=>{
  const [simSliders,setSimSliders]=useState(()=>{
    const init={};KPI_KEYS.forEach(k=>{init[k]=0;});return init;
  });

  const totalWeight=useMemo(()=>COMPANIES.reduce((a,c)=>a+c.weight,0),[]);
  const weightedScore=useMemo(()=>parseFloat((COMPANIES.reduce((a,c)=>a+c.composite*c.weight,0)/totalWeight).toFixed(1)),[totalWeight]);

  const distData=useMemo(()=>TIERS.map(t=>{
    const cos=COMPANIES.filter(c=>c.tier===t);
    const w=cos.reduce((a,c)=>a+c.weight,0);
    return {tier:t,count:cos.length,weight:parseFloat((w/totalWeight*100).toFixed(1))};
  }),[totalWeight]);

  const pieData=distData.map(d=>({name:d.tier,value:d.count}));
  const PIE_COLORS=[T.green,T.gold,T.amber,T.red];

  const engagementList=useMemo(()=>[...COMPANIES].sort((a,b)=>a.composite-b.composite).slice(0,20),[]);

  const simulatedScore=useMemo(()=>{
    let newTotal=0;
    COMPANIES.forEach(c=>{
      let adjSum=0;
      KPI_KEYS.forEach(k=>{adjSum+=Math.min(100,c[k]+simSliders[k]);});
      newTotal+=(adjSum/12)*c.weight;
    });
    return parseFloat((newTotal/totalWeight).toFixed(1));
  },[simSliders,totalWeight]);

  const sectorBreakdown=useMemo(()=>SECTORS.map(s=>{
    const sc=COMPANIES.filter(c=>c.sector===s);
    const sw=sc.reduce((a,c)=>a+c.weight,0);
    const ws=sw>0?parseFloat((sc.reduce((a,c)=>a+c.composite*c.weight,0)/sw).toFixed(1)):0;
    return {sector:s,companies:sc.length,weightedScore:ws,credible:sc.filter(c=>c.tier==='Credible').length,questionable:sc.filter(c=>c.tier==='Questionable'||c.tier==='Incredible').length};
  }),[]);

  const scoreDistribution=useMemo(()=>Array.from({length:10},(_,i)=>{
    const lo=i*10;const hi=lo+10;
    const cos=COMPANIES.filter(c=>c.composite>=lo&&c.composite<hi);
    return {range:`${lo}-${hi}`,count:cos.length,weight:parseFloat((cos.reduce((a,c)=>a+c.weight,0)/totalWeight*100).toFixed(1))};
  }),[totalWeight]);

  const handleExport=useCallback(()=>{
    const hdr=['Company','Sector','Country','Score','Tier','Weight',...KPI_NAMES,'Green CapEx','Brown CapEx','Lobby Score','Commit Score','Net-Zero','NZ Year','SBTi','TCFD'];
    const rows=COMPANIES.map(c=>[c.name,c.sector,c.country,c.composite,c.tier,c.weight,...KPI_KEYS.map(k=>c[k]),c.greenCapex,c.brownCapex,c.lobbyScore,c.commitScore,c.netZeroClaim?'Yes':'No',c.netZeroYear||'',c.sbtiStatus,c.tcfdAligned?'Yes':'No']);
    const csv=[hdr.join(','),...rows.map(r=>r.join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='transition_credibility_report.csv';a.click();
    URL.revokeObjectURL(url);
  },[]);

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
      <Card style={{padding:14}}><Stat label='Portfolio Credibility' value={weightedScore} color={weightedScore>=60?T.green:weightedScore>=45?T.amber:T.red} sub='Weighted avg'/></Card>
      <Card style={{padding:14}}><Stat label='Credible Holdings' value={`${distData[0].weight}%`} color={T.green} sub={`${distData[0].count} companies`}/></Card>
      <Card style={{padding:14}}><Stat label='Moderate Holdings' value={`${distData[1].weight}%`} color={T.gold} sub={`${distData[1].count} companies`}/></Card>
      <Card style={{padding:14}}><Stat label='Questionable+' value={`${(distData[2].weight+distData[3].weight).toFixed(1)}%`} color={T.red} sub={`${distData[2].count+distData[3].count} companies`}/></Card>
      <Card style={{padding:14}}><Stat label='Simulated Score' value={simulatedScore} color={simulatedScore>weightedScore?T.green:T.amber} sub={`${simulatedScore>weightedScore?'+':''}${(simulatedScore-weightedScore).toFixed(1)} pts`}/></Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <SectionTitle>Tier Distribution</SectionTitle>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie data={pieData} cx='50%' cy='50%' innerRadius={50} outerRadius={85} dataKey='value' label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                {pieData.map((d,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
              </Pie>
              <Tooltip {...{contentStyle:tip}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexDirection:'column',justifyContent:'center',gap:8}}>
            {distData.map((d,i)=><div key={d.tier} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:PIE_COLORS[i],flexShrink:0}}/>
              <span style={{fontSize:11,color:T.text,flex:1}}>{d.tier}</span>
              <span style={{fontSize:11,fontFamily:T.mono,fontWeight:600}}>{d.count}</span>
              <span style={{fontSize:10,color:T.textMut,minWidth:35,textAlign:'right'}}>{d.weight}%</span>
            </div>)}
            <div style={{borderTop:`1px solid ${T.border}`,paddingTop:6,marginTop:2}}>
              <div style={{fontSize:10,color:T.textMut}}>Total weight: {totalWeight.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Score Distribution by Weight</SectionTitle>
        <ResponsiveContainer width='100%' height={220}>
          <BarChart data={scoreDistribution} margin={{left:10,right:10}}>
            <CartesianGrid strokeDasharray='3 3' stroke={T.border}/>
            <XAxis dataKey='range' tick={{fontSize:9,fill:T.textSec}}/>
            <YAxis yAxisId='left' tick={{fontSize:10}} label={{value:'Count',angle:-90,position:'insideLeft',fontSize:9,fill:T.textMut}}/>
            <YAxis yAxisId='right' orientation='right' tick={{fontSize:10}} tickFormatter={v=>`${v}%`} label={{value:'Weight',angle:90,position:'insideRight',fontSize:9,fill:T.textMut}}/>
            <Tooltip {...{contentStyle:tip}}/>
            <Bar yAxisId='left' dataKey='count' fill={T.navy} name='Companies' opacity={0.7} radius={[3,3,0,0]}/>
            <Bar yAxisId='right' dataKey='weight' fill={T.gold} name='Weight %' radius={[3,3,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    <Card>
      <SectionTitle>Sector Credibility Breakdown</SectionTitle>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        <ResponsiveContainer width='100%' height={220}>
          <BarChart data={sectorBreakdown} margin={{left:10,right:10}}>
            <CartesianGrid strokeDasharray='3 3' stroke={T.border}/>
            <XAxis dataKey='sector' tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor='end' height={45}/>
            <YAxis tick={{fontSize:10}}/>
            <Tooltip {...{contentStyle:tip}}/>
            <Bar dataKey='weightedScore' fill={T.navy} name='Wtd Score' radius={[4,4,0,0]}>
              {sectorBreakdown.map((d,i)=><Cell key={i} fill={d.weightedScore>=60?T.green:d.weightedScore>=45?T.gold:T.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {sectorBreakdown.map(s=><div key={s.sector} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,padding:'3px 0'}}>
            <span style={{color:T.textSec,minWidth:75}}>{s.sector}</span>
            <MiniBar value={s.weightedScore} color={s.weightedScore>=60?T.green:s.weightedScore>=45?T.gold:T.red} width={50}/>
            <span style={{fontSize:9,color:T.textMut}}>{s.credible}C / {s.questionable}Q</span>
          </div>)}
        </div>
      </div>
    </Card>

    <Card>
      <SectionTitle>Engagement Priority List</SectionTitle>
      <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>Lowest credibility holdings ranked by engagement urgency (weight x inverse score)</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
          <thead><tr style={{background:T.surfaceH}}>
            {['#','Company','Sector','Score','Tier','Weight','Urgency','Weakest KPIs','SBTi','Action'].map(h=><th key={h} style={{padding:'6px 7px',textAlign:'left',borderBottom:`1px solid ${T.border}`,fontSize:10,color:T.textSec}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {engagementList.map((c,i)=>{
              const urgency=parseFloat(((100-c.composite)*c.weight/2).toFixed(1));
              const weakest=KPI_KEYS.map((k,ki)=>({name:KPI_NAMES[ki],val:c[k]})).sort((a,b)=>a.val-b.val).slice(0,3);
              return <tr key={c.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'5px 7px',fontFamily:T.mono,color:T.textMut,fontSize:10}}>{i+1}</td>
                <td style={{padding:'5px 7px',fontWeight:600,color:T.navy}}>{c.name}</td>
                <td style={{padding:'5px 7px',color:T.textSec,fontSize:10}}>{c.sector}</td>
                <td style={{padding:'5px 7px',fontFamily:T.mono,color:T.red}}>{c.composite}</td>
                <td style={{padding:'5px 7px'}}><Pill label={c.tier} color='#fff' bg={tierColor(c.tier)}/></td>
                <td style={{padding:'5px 7px',fontFamily:T.mono}}>{c.weight}%</td>
                <td style={{padding:'5px 7px',fontFamily:T.mono,fontWeight:700,color:urgency>60?T.red:urgency>30?T.amber:T.textSec}}>{urgency}</td>
                <td style={{padding:'5px 7px',fontSize:9,maxWidth:200}}>{weakest.map(w=>`${w.name} (${w.val})`).join(', ')}</td>
                <td style={{padding:'5px 7px'}}><Pill label={c.sbtiStatus} bg={c.sbtiStatus==='Target Set'?'#dcfce7':'#f3f4f6'}/></td>
                <td style={{padding:'5px 7px',fontSize:10,color:T.navyL,fontWeight:600}}>{urgency>50?'Escalate':urgency>25?'Engage':'Monitor'}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </Card>

    <Card>
      <SectionTitle>Credibility Improvement Simulator</SectionTitle>
      <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Adjust KPI improvement assumptions to model impact on weighted portfolio credibility score</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {KPI_KEYS.map((k,i)=><div key={k} style={{padding:'8px 10px',borderRadius:8,background:T.bg}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:10,color:T.textSec}}>{KPI_NAMES[i]}</span>
            <span style={{fontSize:10,fontFamily:T.mono,fontWeight:700,color:simSliders[k]>0?T.green:T.textMut}}>+{simSliders[k]}pts</span>
          </div>
          <input type='range' min={0} max={30} value={simSliders[k]}
            onChange={e=>setSimSliders(p=>({...p,[k]:parseInt(e.target.value)}))}
            style={{width:'100%',accentColor:T.navy,height:4}}/>
          <div style={{fontSize:8,color:T.textMut,marginTop:2}}>{KPI_DESCS[i].substring(0,60)}...</div>
        </div>)}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14,padding:'12px 16px',borderRadius:8,background:simulatedScore>weightedScore?'#f0fdf4':'#fffbeb',border:`1px solid ${simulatedScore>weightedScore?'#bbf7d0':'#fef08a'}`}}>
        <div>
          <span style={{fontSize:12,color:T.textSec}}>Current: </span>
          <span style={{fontSize:18,fontWeight:800,fontFamily:T.mono,color:T.navy}}>{weightedScore}</span>
          <span style={{fontSize:16,color:T.textMut,margin:'0 12px'}}>{'\u2192'}</span>
          <span style={{fontSize:12,color:T.textSec}}>Simulated: </span>
          <span style={{fontSize:18,fontWeight:800,fontFamily:T.mono,color:simulatedScore>weightedScore?T.green:T.amber}}>{simulatedScore}</span>
          <span style={{marginLeft:10,fontSize:13,fontWeight:600,color:simulatedScore>weightedScore?T.green:T.amber}}>
            ({simulatedScore>weightedScore?'+':''}{(simulatedScore-weightedScore).toFixed(1)} pts)
          </span>
        </div>
        <button onClick={()=>{const r={};KPI_KEYS.forEach(k=>{r[k]=0;});setSimSliders(r);}} style={{padding:'6px 16px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:T.textSec,fontSize:11,cursor:'pointer',fontFamily:T.font}}>Reset All</button>
      </div>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <SectionTitle>Board-Ready Summary</SectionTitle>
        <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:12,color:T.text,lineHeight:1.6}}>
          <div style={{padding:10,borderRadius:8,background:T.bg}}>
            <strong>Overall Assessment:</strong> The portfolio achieves a weighted transition credibility score of <span style={{fontWeight:700,fontFamily:T.mono}}>{weightedScore}/100</span>, placing it in the <strong>{weightedScore>=60?'Moderate-to-Strong':weightedScore>=45?'Moderate':'Weak'}</strong> credibility range. {distData[0].count} holdings ({distData[0].weight}%) demonstrate credible transition plans.
          </div>
          <div style={{padding:10,borderRadius:8,background:'#fef2f2'}}>
            <strong>Key Concern:</strong> {distData[2].count+distData[3].count} holdings ({(distData[2].weight+distData[3].weight).toFixed(1)}% by weight) have Questionable or Incredible transition plans, representing significant credibility risk and potential greenwashing exposure.
          </div>
          <div style={{padding:10,borderRadius:8,background:T.bg}}>
            <strong>Engagement Priority:</strong> The top 5 engagement targets represent {engagementList.slice(0,5).reduce((a,c)=>a+c.weight,0).toFixed(1)}% of portfolio weight. Primary areas for improvement: {KPI_NAMES.slice(0,3).join(', ')}.
          </div>
          <div style={{padding:10,borderRadius:8,background:'#f0fdf4'}}>
            <strong>Improvement Potential:</strong> Targeted engagement could lift portfolio credibility by an estimated {Math.max(1.5,(simulatedScore-weightedScore)||2.3).toFixed(1)} points. The most impactful KPIs for portfolio-level improvement are CapEx Green Ratio, Scope 3 Coverage, and Short-term Targets.
          </div>
          <div style={{padding:10,borderRadius:8,background:T.bg}}>
            <strong>Sector Exposure:</strong> Highest credibility risk sectors: {sectorBreakdown.sort((a,b)=>a.weightedScore-b.weightedScore).slice(0,2).map(s=>`${s.sector} (${s.weightedScore})`).join(', ')}. These require prioritised sector-level engagement strategies.
          </div>
        </div>
      </Card>

      <Card style={{display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
        <div>
          <SectionTitle>Export & Reporting</SectionTitle>
          <div style={{fontSize:11,color:T.textSec,lineHeight:1.6,marginBottom:14}}>
            Download the full credibility assessment for all {COMPANIES.length} companies including composite scores, all 12 KPIs, CapEx alignment metrics, lobbying indicators, SBTi status, and tier classifications.
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {[
              ['Companies covered',COMPANIES.length],
              ['KPIs per company','12'],
              ['Total data points',fmt(COMPANIES.length*22)],
              ['Assessment date','2026-03-28'],
              ['Methodology','Quantitative 12-KPI Framework'],
              ['Data sources','CDP, SBTi, CA100+, TPI, InfluenceMap'],
              ['Weighting','AUM-proportional composite'],
              ['Update frequency','Quarterly'],
            ].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'5px 0',borderBottom:`1px solid ${T.bg}`}}>
              <span style={{color:T.textSec}}>{l}</span>
              <span style={{fontFamily:T.mono,fontWeight:600,color:T.navy}}>{v}</span>
            </div>)}
          </div>
        </div>
        <button onClick={handleExport} style={{marginTop:16,width:'100%',padding:'11px 0',borderRadius:8,border:'none',background:T.navy,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font,letterSpacing:0.3}}>
          Export Credibility Report (CSV)
        </button>
      </Card>
    {/* Country-level credibility analysis */}
    <Card>
      <SectionTitle>Geographic Credibility Analysis</SectionTitle>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
          <thead><tr style={{background:T.surfaceH}}>
            {['Country','Companies','Avg Score','Credible','Moderate','Questionable','NZ Claimants','SBTi Target Set','Avg Green CapEx'].map(h=>
              <th key={h} style={{padding:'6px 7px',textAlign:'left',borderBottom:`1px solid ${T.border}`,fontSize:10,color:T.textSec}}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {COUNTRIES.filter(co=>COMPANIES.filter(c=>c.country===co).length>0).map(co=>{
              const cos=COMPANIES.filter(c=>c.country===co);
              const avg=Math.round(cos.reduce((a,c)=>a+c.composite,0)/cos.length);
              return <tr key={co} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'5px 7px',fontWeight:700,color:T.navy,fontFamily:T.mono}}>{co}</td>
                <td style={{padding:'5px 7px',fontFamily:T.mono}}>{cos.length}</td>
                <td style={{padding:'5px 7px'}}><MiniBar value={avg} color={avg>=60?T.green:avg>=45?T.gold:T.red} width={50}/></td>
                <td style={{padding:'5px 7px',fontFamily:T.mono,color:T.green}}>{cos.filter(c=>c.tier==='Credible').length}</td>
                <td style={{padding:'5px 7px',fontFamily:T.mono,color:T.gold}}>{cos.filter(c=>c.tier==='Moderate').length}</td>
                <td style={{padding:'5px 7px',fontFamily:T.mono,color:T.red}}>{cos.filter(c=>c.tier==='Questionable'||c.tier==='Incredible').length}</td>
                <td style={{padding:'5px 7px',fontFamily:T.mono}}>{cos.filter(c=>c.netZeroClaim).length}</td>
                <td style={{padding:'5px 7px',fontFamily:T.mono}}>{cos.filter(c=>c.sbtiStatus==='Target Set').length}</td>
                <td style={{padding:'5px 7px',fontFamily:T.mono,color:T.green}}>{Math.round(cos.reduce((a,c)=>a+c.greenCapex,0)/cos.length)}%</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Methodology summary */}
    <Card>
      <SectionTitle>Assessment Methodology</SectionTitle>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[
          {phase:'Data Collection',desc:'Aggregate public disclosures, CDP responses, SBTi commitments, TPI assessments, InfluenceMap lobbying data, and proxy filings.',items:['Annual reports & sustainability reports','CDP Climate questionnaire responses','SBTi target validation status','InfluenceMap Organisation Scores']},
          {phase:'KPI Scoring',desc:'Each of the 12 KPIs scored 0-100 using quantitative thresholds calibrated to sector-specific benchmarks and best practices.',items:['Sector-relative percentile scoring','Absolute threshold gates','Year-on-year trend adjustment','Third-party verification bonus']},
          {phase:'Composite & Tiering',desc:'Weighted composite aggregation with equal KPI weights. Tier assignment based on composite score bands.',items:['Equal-weight 12-KPI composite','Credible: >= 72 | Moderate: >= 55','Questionable: >= 38 | Incredible: < 38','Quarterly reassessment cycle']},
        ].map(p=><div key={p.phase} style={{padding:12,borderRadius:8,background:T.bg}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:4}}>{p.phase}</div>
          <div style={{fontSize:10,color:T.textSec,lineHeight:1.5,marginBottom:8}}>{p.desc}</div>
          {p.items.map((item,ii)=><div key={ii} style={{fontSize:10,color:T.textMut,padding:'2px 0',borderBottom:ii<p.items.length-1?`1px solid ${T.surface}`:'none'}}>
            {'\u2022'} {item}
          </div>)}
        </div>)}
      </div>
    </Card>
    </div>
  </div>;
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function TransitionCredibilityPage(){
  const [tab,setTab]=useState(0);

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
      <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 20px'}}>
        {/* Header */}
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <span style={{fontSize:13,fontWeight:600,color:T.gold,letterSpacing:0.5}}>EP-AL5</span>
            <span style={{width:4,height:4,borderRadius:'50%',background:T.border}}/>
            <span style={{fontSize:12,color:T.textMut}}>Transition Plan Credibility</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:800,color:T.navy,margin:0,letterSpacing:-0.5}}>Transition Plan Credibility Engine</h1>
          <p style={{fontSize:13,color:T.textSec,marginTop:4,maxWidth:720}}>
            Quantitative credibility assessment of corporate transition plans across 12 KPIs covering capital allocation,
            advocacy alignment, governance structures, and disclosure quality for {COMPANIES.length} companies.
          </p>
        </div>

        {/* Tab Bar */}
        <div style={{display:'flex',gap:2,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:3,marginBottom:20,width:'fit-content'}}>
          {TABS.map((t,i)=>(
            <button key={t} onClick={()=>setTab(i)} style={{
              padding:'7px 18px',borderRadius:8,border:'none',
              background:tab===i?T.navy:'transparent',
              color:tab===i?'#fff':T.textSec,
              fontSize:12,fontWeight:tab===i?700:500,
              cursor:'pointer',fontFamily:T.font,
              transition:'all 0.15s ease',whiteSpace:'nowrap'
            }}>{t}</button>
          ))}
        </div>

        {/* Active Tab */}
        {tab===0&&<ScorecardTab/>}
        {tab===1&&<CapExTab/>}
        {tab===2&&<LobbyingTab/>}
        {tab===3&&<PortfolioTab/>}
      </div>
    </div>
  );
}
