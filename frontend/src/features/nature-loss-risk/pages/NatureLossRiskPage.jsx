import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#16a34a';
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Company Assessment','TNFD LEAP','Biodiversity Footprint'];
const SECTORS=['All','Mining','Agriculture','Energy','Forestry','Construction','Chemicals','Food & Bev','Pharmaceuticals','Utilities'];
const DEPENDENCY=['All','Very High','High','Medium','Low'];
const PAGE_SIZE=12;

const COMPANIES=(()=>{const names=['BHP Group','Rio Tinto','Vale SA','Anglo American','Glencore plc','Newmont Corp','Barrick Gold','Freeport-McMoRan','Nutrien Ltd','Mosaic Co','Archer-Daniels','Bunge Ltd','Cargill Inc','Louis Dreyfus','Olam Group','Syngenta Group','BASF SE','Bayer AG','Corteva Agri.','FMC Corp','Nestlé SA','Unilever plc','Danone SA','Mondelez Intl','AB InBev','Procter & Gamble','L\'Oréal SA','Coca-Cola HBC','PepsiCo Inc','Tyson Foods','JBS SA','Marfrig Global','BRF SA','Smithfield Foods','Cosan SA','SLC Agrícola','Suzano SA','Klabin SA','CMPC Group','Stora Enso','UPM-Kymmene','Holcim Ltd','CRH plc','HeidelbergCement','Saint-Gobain','Veolia Environ','Suez SA','Enel SpA','Iberdrola SA','Duke Energy'];
  const secs=['Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Chemicals','Chemicals','Agriculture','Agriculture','Agriculture','Agriculture','Agriculture','Chemicals','Chemicals','Chemicals','Chemicals','Chemicals','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Agriculture','Agriculture','Agriculture','Agriculture','Agriculture','Agriculture','Forestry','Forestry','Forestry','Forestry','Forestry','Construction','Construction','Construction','Construction','Utilities','Utilities','Utilities','Utilities','Utilities'];
  return names.map((n,i)=>({id:i+1,name:n,sector:secs[i],natureDependency:Math.round(20+sr(i*7)*75),biodiversityFootprint:Math.round(10+sr(i*11)*80),tnfdLeapScore:Math.round(5+sr(i*13)*85),waterDependency:Math.round(15+sr(i*17)*80),soilDependency:Math.round(10+sr(i*19)*70),pollinationDep:Math.round(sr(i*23)*60),landUseImpact:Math.round(15+sr(i*29)*80),waterPollution:Math.round(10+sr(i*31)*75),airEmissions:Math.round(15+sr(i*37)*70),wasteGeneration:Math.round(10+sr(i*41)*65),habitatConversion:Math.round(sr(i*43)*55),speciesThreatened:Math.round(sr(i*47)*45),mitigationScore:Math.round(10+sr(i*53)*80),disclosureScore:Math.round(5+sr(i*59)*85),targetSetting:sr(i*61)<0.35?'Science-Based':sr(i*61)<0.6?'Qualitative':'None',dependencyRating:sr(i*7)<0.2?'Very High':sr(i*7)<0.45?'High':sr(i*7)<0.7?'Medium':'Low',overallRisk:Math.round(15+sr(i*67)*80)}));})();

const LEAP_PHASES=[{phase:'Locate',desc:'Interface with nature',avgScore:0},{phase:'Evaluate',desc:'Dependencies & impacts',avgScore:0},{phase:'Assess',desc:'Risks & opportunities',avgScore:0},{phase:'Prepare',desc:'Response & reporting',avgScore:0}];

const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,biodivLoss:Math.round(30+sr(i*7)*20),tnfdAdopters:Math.round(10+i*3+sr(i*11)*5),naturePositive:Math.round(5+i*2+sr(i*13)*3)}));

const badge=(val,thresholds)=>{const[lo,mid,hi]=thresholds;const bg=val>=hi?'rgba(220,38,38,0.12)':val>=mid?'rgba(217,119,6,0.12)':val>=lo?'rgba(197,169,106,0.12)':'rgba(22,163,74,0.12)';const c=val>=hi?T.red:val>=mid?T.amber:val>=lo?T.gold:T.green;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const dBadge=(r)=>{const m={'Very High':{bg:'rgba(220,38,38,0.12)',c:T.red},High:{bg:'rgba(217,119,6,0.12)',c:T.amber},Medium:{bg:'rgba(197,169,106,0.15)',c:T.gold},Low:{bg:'rgba(22,163,74,0.12)',c:T.green}};return{background:(m[r]||m.Medium).bg,color:(m[r]||m.Medium).c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

export default function NatureLossRiskPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sectorF,setSectorF]=useState('All');const[depF,setDepF]=useState('All');const[sortCol,setSortCol]=useState('overallRisk');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[selected,setSelected]=useState(null);
  const[lSearch,setLSearch]=useState('');const[lSort,setLSort]=useState('tnfdLeapScore');const[lDir,setLDir]=useState('desc');const[lPage,setLPage]=useState(1);
  const[bSearch,setBSearch]=useState('');const[bSort,setBSort]=useState('biodiversityFootprint');const[bDir,setBDir]=useState('desc');const[bPage,setBPage]=useState(1);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);if(depF!=='All')d=d.filter(r=>r.dependencyRating===depF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,depF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);const tP=Math.ceil(filtered.length/PAGE_SIZE);

  const leapData=useMemo(()=>{let d=filtered.map(r=>({name:r.name,sector:r.sector,tnfdLeapScore:r.tnfdLeapScore,disclosureScore:r.disclosureScore,mitigationScore:r.mitigationScore,targetSetting:r.targetSetting}));if(lSearch)d=d.filter(r=>r.name.toLowerCase().includes(lSearch.toLowerCase()));d.sort((a,b)=>lDir==='asc'?(a[lSort]>b[lSort]?1:-1):(a[lSort]<b[lSort]?1:-1));return d;},[filtered,lSearch,lSort,lDir]);
  const lPaged=useMemo(()=>leapData.slice((lPage-1)*PAGE_SIZE,lPage*PAGE_SIZE),[leapData,lPage]);const lTP=Math.ceil(leapData.length/PAGE_SIZE);

  const bioData=useMemo(()=>{let d=filtered.map(r=>({name:r.name,sector:r.sector,biodiversityFootprint:r.biodiversityFootprint,landUseImpact:r.landUseImpact,waterPollution:r.waterPollution,habitatConversion:r.habitatConversion,speciesThreatened:r.speciesThreatened}));if(bSearch)d=d.filter(r=>r.name.toLowerCase().includes(bSearch.toLowerCase()));d.sort((a,b)=>bDir==='asc'?(a[bSort]>b[bSort]?1:-1):(a[bSort]<b[bSort]?1:-1));return d;},[filtered,bSearch,bSort,bDir]);
  const bPaged=useMemo(()=>bioData.slice((bPage-1)*PAGE_SIZE,bPage*PAGE_SIZE),[bioData,bPage]);const bTP=Math.ceil(bioData.length/PAGE_SIZE);

  const doSort=(c)=>{if(sortCol===c)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(c);setSortDir('desc');}setPage(1);};
  const doLSort=(c)=>{if(lSort===c)setLDir(d=>d==='asc'?'desc':'asc');else{setLSort(c);setLDir('desc');}setLPage(1);};
  const doBSort=(c)=>{if(bSort===c)setBDir(d=>d==='asc'?'desc':'asc');else{setBSort(c);setBDir('desc');}setBPage(1);};

  const stats=useMemo(()=>({total:filtered.length,avgDep:(filtered.reduce((s,r)=>s+r.natureDependency,0)/filtered.length||0).toFixed(1),avgBio:(filtered.reduce((s,r)=>s+r.biodiversityFootprint,0)/filtered.length||0).toFixed(1),avgTNFD:(filtered.reduce((s,r)=>s+r.tnfdLeapScore,0)/filtered.length||0).toFixed(1),veryHigh:filtered.filter(r=>r.dependencyRating==='Very High').length,scienceBased:filtered.filter(r=>r.targetSetting==='Science-Based').length}),[filtered]);

  const depDist=useMemo(()=>{const o=['Very High','High','Medium','Low'];const m={};filtered.forEach(r=>{m[r.dependencyRating]=(m[r.dependencyRating]||0)+1;});return o.filter(k=>m[k]).map(k=>({name:k,value:m[k]}));},[filtered]);
  const sectorAvg=useMemo(()=>{const m={};filtered.forEach(r=>{if(!m[r.sector])m[r.sector]={s:0,c:0};m[r.sector].s+=r.overallRisk;m[r.sector].c++;});return Object.entries(m).map(([k,v])=>({sector:k,avg:+(v.s/v.c).toFixed(1)})).sort((a,b)=>b.avg-a.avg);},[filtered]);

  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const k=Object.keys(data[0]);const csv=[k.join(','),...data.map(r=>k.map(c=>`"${r[c]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);},[]);

  const si=(col,cur,dir)=>cur===col?(dir==='asc'?' ▲':' ▼'):' ○';
  const th={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left'};
  const td_={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inp={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const sel_={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnS=(a)=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer'});
  const pb_={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};

  const Panel=({item,onClose})=>{if(!item)return null;return(<div style={{position:'fixed',top:0,right:0,width:420,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}>
    <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{item.name}</div><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button></div>
    <div style={{padding:'16px 24px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      {[['Nature Dependency',item.natureDependency],['Biodiversity FP',item.biodiversityFootprint],['TNFD LEAP',item.tnfdLeapScore],['Water Dep.',item.waterDependency],['Soil Dep.',item.soilDependency],['Pollination',item.pollinationDep],['Land Use Impact',item.landUseImpact],['Water Pollution',item.waterPollution],['Air Emissions',item.airEmissions],['Waste Gen.',item.wasteGeneration],['Habitat Conv.',item.habitatConversion],['Species Threat.',item.speciesThreatened],['Mitigation',item.mitigationScore],['Disclosure',item.disclosureScore],['Target Setting',item.targetSetting],['Overall Risk',item.overallRisk]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
    </div><span style={dBadge(item.dependencyRating)}>{item.dependencyRating}</span>
    <div style={{height:180,marginTop:12}}><ResponsiveContainer width="100%" height="100%"><RadarChart data={[{d:'Water',v:item.waterDependency},{d:'Soil',v:item.soilDependency},{d:'Pollination',v:item.pollinationDep},{d:'Land Use',v:item.landUseImpact},{d:'Habitat',v:item.habitatConversion},{d:'Species',v:item.speciesThreatened}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2}/></RadarChart></ResponsiveContainer></div>
    </div></div>);};

  return(<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.border}`,background:T.surface}}><div style={{fontSize:20,fontWeight:700,color:T.navy}}>Nature Loss & Biodiversity Risk</div><div style={{fontSize:12,color:T.textSec,marginTop:2,fontFamily:T.mono}}>TNFD LEAP &middot; Nature Dependency &middot; {COMPANIES.length} Companies</div></div>
    <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:28}}>{TABS.map((t,i)=>(<button key={i} onClick={()=>{setTab(i);setSelected(null);}} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',background:'none',color:tab===i?ACCENT:T.textSec,fontWeight:tab===i?700:400,fontSize:12,cursor:'pointer'}}>{t}</button>))}</div>
    <div style={{padding:'20px 28px'}}>

    {tab===0&&(<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:20}}>
        {[['Companies',stats.total,T.navy],['Avg Dependency',stats.avgDep,ACCENT],['Avg Biodiv FP',stats.avgBio,T.red],['Avg TNFD',stats.avgTNFD,T.gold],['Very High Dep.',stats.veryHigh,T.amber],['Science-Based',stats.scienceBased,T.green]].map(([l,v,c],i)=>(<div key={i} style={card}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:16}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Nature Risk Trend (24M)</div>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:9}}/><Tooltip {...tip}/><Area type="monotone" dataKey="tnfdAdopters" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} name="TNFD Adopters"/><Area type="monotone" dataKey="naturePositive" stroke={T.sage} fill={T.sage} fillOpacity={0.1} name="Nature Positive"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Dependency Rating</div>
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={depDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({name,value})=>`${name}: ${value}`} style={{fontSize:9}}>{depDist.map((_,i)=>(<Cell key={i} fill={[T.red,T.amber,T.gold,T.green][i%4]}/>))}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Sector Risk</div>
          <ResponsiveContainer width="100%" height={220}><BarChart data={sectorAvg} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9}} domain={[0,100]}/><YAxis dataKey="sector" type="category" tick={{fontSize:8}} width={80}/><Tooltip {...tip}/><Bar dataKey="avg" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>)}

    {tab===1&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search..." style={inp}/>
        <select value={sectorF} onChange={e=>{setSectorF(e.target.value);setPage(1);}} style={sel_}>{SECTORS.map(s=>(<option key={s}>{s}</option>))}</select>
        <select value={depF} onChange={e=>{setDepF(e.target.value);setPage(1);}} style={sel_}>{DEPENDENCY.map(r=>(<option key={r}>{r}</option>))}</select>
        <button onClick={()=>exportCSV(filtered,'nature_loss_risk.csv')} style={btnS(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length}</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Company'],['sector','Sector'],['natureDependency','Dependency'],['biodiversityFootprint','Biodiv.FP'],['tnfdLeapScore','TNFD'],['overallRisk','Risk'],['mitigationScore','Mitigation'],['disclosureScore','Disclosure'],['dependencyRating','Rating']].map(([k,l])=>(<th key={k} onClick={()=>doSort(k)} style={th}>{l}{si(k,sortCol,sortDir)}</th>))}
        </tr></thead><tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
          <td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.sector}</td>
          <td style={td_}><span style={badge(r.natureDependency,[25,50,70])}>{r.natureDependency}</span></td>
          <td style={td_}><span style={badge(r.biodiversityFootprint,[25,50,70])}>{r.biodiversityFootprint}</span></td>
          <td style={td_}>{r.tnfdLeapScore}</td><td style={td_}><span style={badge(r.overallRisk,[25,50,70])}>{r.overallRisk}</span></td>
          <td style={td_}>{r.mitigationScore}</td><td style={td_}>{r.disclosureScore}</td>
          <td style={td_}><span style={dBadge(r.dependencyRating)}>{r.dependencyRating}</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pb_}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {page}/{tP}</span><button disabled={page>=tP} onClick={()=>setPage(p=>p+1)} style={pb_}>Next</button></div>
      <Panel item={selected} onClose={()=>setSelected(null)}/>
    </div>)}

    {tab===2&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={lSearch} onChange={e=>{setLSearch(e.target.value);setLPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(leapData,'tnfd_leap.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{leapData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Company'],['sector','Sector'],['tnfdLeapScore','LEAP Score'],['disclosureScore','Disclosure'],['mitigationScore','Mitigation'],['targetSetting','Target']].map(([k,l])=>(<th key={k} onClick={()=>doLSort(k)} style={th}>{l}{si(k,lSort,lDir)}</th>))}
        </tr></thead><tbody>{lPaged.map((r,i)=>(<tr key={i}><td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.sector}</td><td style={td_}><span style={badge(r.tnfdLeapScore,[25,50,70])}>{r.tnfdLeapScore}</span></td><td style={td_}>{r.disclosureScore}</td><td style={td_}>{r.mitigationScore}</td><td style={td_}><span style={{color:r.targetSetting==='Science-Based'?T.green:r.targetSetting==='Qualitative'?T.gold:T.textMut}}>{r.targetSetting}</span></td></tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={lPage<=1} onClick={()=>setLPage(p=>p-1)} style={pb_}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {lPage}/{lTP}</span><button disabled={lPage>=lTP} onClick={()=>setLPage(p=>p+1)} style={pb_}>Next</button></div>
    </div>)}

    {tab===3&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={bSearch} onChange={e=>{setBSearch(e.target.value);setBPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(bioData,'biodiversity_footprint.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{bioData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Company'],['sector','Sector'],['biodiversityFootprint','Biodiv.FP'],['landUseImpact','Land Use'],['waterPollution','Water Poll.'],['habitatConversion','Habitat'],['speciesThreatened','Species']].map(([k,l])=>(<th key={k} onClick={()=>doBSort(k)} style={th}>{l}{si(k,bSort,bDir)}</th>))}
        </tr></thead><tbody>{bPaged.map((r,i)=>(<tr key={i}><td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.sector}</td><td style={td_}><span style={badge(r.biodiversityFootprint,[25,50,70])}>{r.biodiversityFootprint}</span></td><td style={td_}>{r.landUseImpact}</td><td style={td_}>{r.waterPollution}</td><td style={td_}>{r.habitatConversion}</td><td style={td_}>{r.speciesThreatened}</td></tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={bPage<=1} onClick={()=>setBPage(p=>p-1)} style={pb_}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {bPage}/{bTP}</span><button disabled={bPage>=bTP} onClick={()=>setBPage(p=>p+1)} style={pb_}>Next</button></div>
      <div style={{...card,marginTop:16}}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Footprint vs Species Threatened</div>
        <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Biodiversity FP" tick={{fontSize:9}}/><YAxis dataKey="y" name="Species" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={bioData.map(r=>({name:r.name,x:r.biodiversityFootprint,y:r.speciesThreatened}))} fill={ACCENT} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
      </div>
    </div>)}

    </div>
  </div>);
}
