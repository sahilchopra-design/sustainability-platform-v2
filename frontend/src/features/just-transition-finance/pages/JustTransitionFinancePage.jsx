import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#b45309';
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Project Tracker','Worker Retraining','Community Funds'];
const TYPES=['All','Coal Transition','Renewable Deployment','Grid Modernization','Industrial Conversion','Skills Training','Community Development'];
const STATUSES=['All','Active','Pipeline','Completed','Suspended'];
const PAGE_SIZE=10;

const PROJECTS=(()=>{
  const names=['Silesia Coal Transition','Appalachia Clean Energy','Lusatia Structural Change','Humber Net Zero','South Wales Industrial','Asturias Green Hydrogen','Alberta Just Transition','Jharkhand Reskilling','Mpumalanga Repurpose','Shanxi Clean Coal','Ruhr Valley 2.0','Hazelwood Transition','Taranaki Green Hub','Jiu Valley Renewal','Ostrava Green District','Meghalaya Solar Skills','Tuzla Green Industry','Karaganda Transition','Donetsk Reconstruction','Zonguldak Wind Hub','Upper Silesia Smart','Peñarroya Solar Farm','Powder River Clean','Hunter Valley Renewal','Bełchatów Conversion','Maritsa Decarbonise','Ptolemaida Green','Kozani Solar Park','Western Macedonia','Velenje Green Lake','Trbovlje Heritage','Kemerovo Clean Tech','Kuzbass Hydrogen Hub','Nova Scotia Tide','Cape Breton Green','Limburg Circular','Borinage Innovation','Nord-Pas Solar','Aachen Battery Hub','Saarland Steel Green'];
  const types=['Coal Transition','Renewable Deployment','Industrial Conversion','Grid Modernization','Industrial Conversion','Renewable Deployment','Coal Transition','Skills Training','Coal Transition','Coal Transition','Industrial Conversion','Coal Transition','Renewable Deployment','Coal Transition','Community Development','Skills Training','Industrial Conversion','Coal Transition','Community Development','Renewable Deployment','Grid Modernization','Renewable Deployment','Coal Transition','Coal Transition','Industrial Conversion','Coal Transition','Renewable Deployment','Renewable Deployment','Community Development','Community Development','Community Development','Industrial Conversion','Renewable Deployment','Renewable Deployment','Community Development','Industrial Conversion','Community Development','Renewable Deployment','Grid Modernization','Industrial Conversion'];
  return names.map((n,i)=>({id:i+1,name:n,type:types[i],status:sr(i*7)<0.45?'Active':sr(i*7)<0.65?'Pipeline':sr(i*7)<0.85?'Completed':'Suspended',totalInvestment:Math.round(50+sr(i*11)*950),workersImpacted:Math.round(200+sr(i*13)*9800),workersRetrained:Math.round(50+sr(i*17)*4950),retrainingRate:Math.round(20+sr(i*19)*75),newJobsCreated:Math.round(100+sr(i*23)*4900),avgWageChange:Math.round(-20+sr(i*29)*40),communityFund:Math.round(5+sr(i*31)*195),socialDialogue:Math.round(20+sr(i*37)*75),stakeholderEngagement:Math.round(25+sr(i*41)*70),genderEquity:Math.round(15+sr(i*43)*75),youthInclusion:Math.round(10+sr(i*47)*65),healthServices:Math.round(20+sr(i*53)*75),housingSupport:Math.round(10+sr(i*59)*60),transitionScore:Math.round(15+sr(i*61)*80),rating:sr(i*7)<0.15?'Excellent':sr(i*7)<0.35?'Good':sr(i*7)<0.6?'Adequate':sr(i*7)<0.85?'Poor':'Critical'}));})();

const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,investment:Math.round(200+i*20+sr(i*7)*100),retrained:Math.round(500+i*100+sr(i*11)*200),newJobs:Math.round(300+i*80+sr(i*13)*150)}));

const badge=(val,thresholds)=>{const[lo,mid,hi]=thresholds;const bg=val>=hi?'rgba(22,163,74,0.12)':val>=mid?'rgba(197,169,106,0.12)':val>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=val>=hi?T.green:val>=mid?T.gold:val>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const rBadge=(r)=>{const m={Excellent:{bg:'rgba(22,163,74,0.12)',c:T.green},Good:{bg:'rgba(90,138,106,0.12)',c:T.sage},Adequate:{bg:'rgba(197,169,106,0.15)',c:T.gold},Poor:{bg:'rgba(217,119,6,0.12)',c:T.amber},Critical:{bg:'rgba(220,38,38,0.12)',c:T.red}};return{background:(m[r]||m.Adequate).bg,color:(m[r]||m.Adequate).c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

export default function JustTransitionFinancePage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[typeF,setTypeF]=useState('All');const[statusF,setStatusF]=useState('All');const[sortCol,setSortCol]=useState('transitionScore');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[selected,setSelected]=useState(null);
  const[wSearch,setWSearch]=useState('');const[wSort,setWSort]=useState('workersRetrained');const[wDir,setWDir]=useState('desc');const[wPage,setWPage]=useState(1);
  const[cSearch,setCSearch]=useState('');const[cSort,setCSort]=useState('communityFund');const[cDir,setCDir]=useState('desc');const[cPage,setCPage]=useState(1);

  const filtered=useMemo(()=>{let d=[...PROJECTS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(typeF!=='All')d=d.filter(r=>r.type===typeF);if(statusF!=='All')d=d.filter(r=>r.status===statusF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,typeF,statusF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);const tP=Math.ceil(filtered.length/PAGE_SIZE);

  const wData=useMemo(()=>{let d=filtered.map(r=>({name:r.name,type:r.type,workersImpacted:r.workersImpacted,workersRetrained:r.workersRetrained,retrainingRate:r.retrainingRate,newJobsCreated:r.newJobsCreated,avgWageChange:r.avgWageChange}));if(wSearch)d=d.filter(r=>r.name.toLowerCase().includes(wSearch.toLowerCase()));d.sort((a,b)=>wDir==='asc'?(a[wSort]>b[wSort]?1:-1):(a[wSort]<b[wSort]?1:-1));return d;},[filtered,wSearch,wSort,wDir]);
  const wPaged=useMemo(()=>wData.slice((wPage-1)*PAGE_SIZE,wPage*PAGE_SIZE),[wData,wPage]);const wTP=Math.ceil(wData.length/PAGE_SIZE);

  const cData=useMemo(()=>{let d=filtered.map(r=>({name:r.name,type:r.type,communityFund:r.communityFund,socialDialogue:r.socialDialogue,genderEquity:r.genderEquity,youthInclusion:r.youthInclusion,healthServices:r.healthServices,housingSupport:r.housingSupport}));if(cSearch)d=d.filter(r=>r.name.toLowerCase().includes(cSearch.toLowerCase()));d.sort((a,b)=>cDir==='asc'?(a[cSort]>b[cSort]?1:-1):(a[cSort]<b[cSort]?1:-1));return d;},[filtered,cSearch,cSort,cDir]);
  const cPaged=useMemo(()=>cData.slice((cPage-1)*PAGE_SIZE,cPage*PAGE_SIZE),[cData,cPage]);const cTP=Math.ceil(cData.length/PAGE_SIZE);

  const doSort=(c)=>{if(sortCol===c)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(c);setSortDir('desc');}setPage(1);};
  const doWSort=(c)=>{if(wSort===c)setWDir(d=>d==='asc'?'desc':'asc');else{setWSort(c);setWDir('desc');}setWPage(1);};
  const doCSort=(c)=>{if(cSort===c)setCDir(d=>d==='asc'?'desc':'asc');else{setCSort(c);setCDir('desc');}setCPage(1);};

  const stats=useMemo(()=>({total:filtered.length,totalInvest:filtered.reduce((s,r)=>s+r.totalInvestment,0),totalWorkers:filtered.reduce((s,r)=>s+r.workersImpacted,0),retrained:filtered.reduce((s,r)=>s+r.workersRetrained,0),newJobs:filtered.reduce((s,r)=>s+r.newJobsCreated,0),avgScore:(filtered.reduce((s,r)=>s+r.transitionScore,0)/filtered.length||0).toFixed(1)}),[filtered]);

  const typeDist=useMemo(()=>{const m={};filtered.forEach(r=>{m[r.type]=(m[r.type]||0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v})).sort((a,b)=>b.value-a.value);},[filtered]);

  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const k=Object.keys(data[0]);const csv=[k.join(','),...data.map(r=>k.map(c=>`"${r[c]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);},[]);

  const si=(col,cur,dir)=>cur===col?(dir==='asc'?' ▲':' ▼'):' ○';
  const th={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left'};
  const td_={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inp={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const sel_={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnS=(a)=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer'});
  const pb={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};

  const Panel=({item,onClose})=>{if(!item)return null;return(<div style={{position:'fixed',top:0,right:0,width:420,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}>
    <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{item.name}</div><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button></div>
    <div style={{padding:'16px 24px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      {[['Investment','$'+item.totalInvestment+'M'],['Workers Impacted',item.workersImpacted],['Retrained',item.workersRetrained],['Retraining Rate',item.retrainingRate+'%'],['New Jobs',item.newJobsCreated],['Wage Change',(item.avgWageChange>0?'+':'')+item.avgWageChange+'%'],['Community Fund','$'+item.communityFund+'M'],['Social Dialogue',item.socialDialogue],['Gender Equity',item.genderEquity],['Youth Inclusion',item.youthInclusion],['Health Services',item.healthServices],['Housing Support',item.housingSupport],['Transition Score',item.transitionScore],['Stakeholder Engage.',item.stakeholderEngagement]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
    </div><span style={rBadge(item.rating)}>{item.rating}</span>
    <div style={{height:180,marginTop:12}}><ResponsiveContainer width="100%" height="100%"><RadarChart data={[{d:'Retraining',v:item.retrainingRate},{d:'Jobs',v:Math.min(item.newJobsCreated/50,100)},{d:'Social Dialogue',v:item.socialDialogue},{d:'Gender',v:item.genderEquity},{d:'Youth',v:item.youthInclusion},{d:'Health',v:item.healthServices}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2}/></RadarChart></ResponsiveContainer></div>
    </div></div>);};

  return(<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.border}`,background:T.surface}}><div style={{fontSize:20,fontWeight:700,color:T.navy}}>Just Transition Finance</div><div style={{fontSize:12,color:T.textSec,marginTop:2,fontFamily:T.mono}}>Worker Retraining &middot; Community Transition Funds &middot; {PROJECTS.length} Projects</div></div>
    <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:28}}>{TABS.map((t,i)=>(<button key={i} onClick={()=>{setTab(i);setSelected(null);}} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',background:'none',color:tab===i?ACCENT:T.textSec,fontWeight:tab===i?700:400,fontSize:12,cursor:'pointer'}}>{t}</button>))}</div>
    <div style={{padding:'20px 28px'}}>

    {tab===0&&(<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:20}}>
        {[['Projects',stats.total,T.navy],['Total Invest.','$'+(stats.totalInvest/1000).toFixed(1)+'B',ACCENT],['Workers Impacted',(stats.totalWorkers/1000).toFixed(1)+'K',T.gold],['Retrained',(stats.retrained/1000).toFixed(1)+'K',T.green],['New Jobs',(stats.newJobs/1000).toFixed(1)+'K',T.sage],['Avg Score',stats.avgScore,T.amber]].map(([l,v,c],i)=>(<div key={i} style={card}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:16}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Investment & Jobs Trend (24M)</div>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:9}}/><Tooltip {...tip}/><Area type="monotone" dataKey="investment" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} name="Investment $M"/><Area type="monotone" dataKey="newJobs" stroke={T.green} fill={T.green} fillOpacity={0.1} name="New Jobs"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Project Types</div>
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={typeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({name,value})=>`${value}`} style={{fontSize:9}}>{typeDist.map((_,i)=>(<Cell key={i} fill={[ACCENT,T.green,T.sage,T.gold,T.amber,T.navy][i%6]}/>))}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Investment vs Workers</div>
          <ResponsiveContainer width="100%" height={220}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Invest $M" tick={{fontSize:9}}/><YAxis dataKey="y" name="Workers" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={filtered.map(r=>({x:r.totalInvestment,y:r.workersImpacted}))} fill={ACCENT} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
        </div>
      </div>
    </div>)}

    {tab===1&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search projects..." style={inp}/>
        <select value={typeF} onChange={e=>{setTypeF(e.target.value);setPage(1);}} style={sel_}>{TYPES.map(s=>(<option key={s}>{s}</option>))}</select>
        <select value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}} style={sel_}>{STATUSES.map(s=>(<option key={s}>{s}</option>))}</select>
        <button onClick={()=>exportCSV(filtered,'just_transition.csv')} style={btnS(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length}</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Project'],['type','Type'],['status','Status'],['transitionScore','Score'],['totalInvestment','Invest $M'],['workersImpacted','Workers'],['newJobsCreated','New Jobs'],['retrainingRate','Retrain%'],['rating','Rating']].map(([k,l])=>(<th key={k} onClick={()=>doSort(k)} style={th}>{l}{si(k,sortCol,sortDir)}</th>))}
        </tr></thead><tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
          <td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.type}</td><td style={td_}>{r.status}</td>
          <td style={td_}><span style={badge(r.transitionScore,[25,50,70])}>{r.transitionScore}</span></td>
          <td style={td_}>${r.totalInvestment}M</td><td style={td_}>{r.workersImpacted.toLocaleString()}</td>
          <td style={td_}>{r.newJobsCreated.toLocaleString()}</td><td style={td_}>{r.retrainingRate}%</td>
          <td style={td_}><span style={rBadge(r.rating)}>{r.rating}</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {page}/{tP}</span><button disabled={page>=tP} onClick={()=>setPage(p=>p+1)} style={pb}>Next</button></div>
      <Panel item={selected} onClose={()=>setSelected(null)}/>
    </div>)}

    {tab===2&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={wSearch} onChange={e=>{setWSearch(e.target.value);setWPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(wData,'worker_retraining.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{wData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Project'],['type','Type'],['workersImpacted','Impacted'],['workersRetrained','Retrained'],['retrainingRate','Rate%'],['newJobsCreated','New Jobs'],['avgWageChange','Wage Chg%']].map(([k,l])=>(<th key={k} onClick={()=>doWSort(k)} style={th}>{l}{si(k,wSort,wDir)}</th>))}
        </tr></thead><tbody>{wPaged.map((r,i)=>(<tr key={i}><td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.type}</td><td style={td_}>{r.workersImpacted.toLocaleString()}</td><td style={td_}>{r.workersRetrained.toLocaleString()}</td><td style={td_}><span style={badge(r.retrainingRate,[25,50,70])}>{r.retrainingRate}%</span></td><td style={td_}>{r.newJobsCreated.toLocaleString()}</td><td style={td_}><span style={{color:r.avgWageChange>=0?T.green:T.red,fontWeight:600}}>{r.avgWageChange>0?'+':''}{r.avgWageChange}%</span></td></tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={wPage<=1} onClick={()=>setWPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {wPage}/{wTP}</span><button disabled={wPage>=wTP} onClick={()=>setWPage(p=>p+1)} style={pb}>Next</button></div>
    </div>)}

    {tab===3&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={cSearch} onChange={e=>{setCSearch(e.target.value);setCPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(cData,'community_funds.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{cData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Project'],['type','Type'],['communityFund','Fund $M'],['socialDialogue','Dialogue'],['genderEquity','Gender'],['youthInclusion','Youth'],['healthServices','Health'],['housingSupport','Housing']].map(([k,l])=>(<th key={k} onClick={()=>doCSort(k)} style={th}>{l}{si(k,cSort,cDir)}</th>))}
        </tr></thead><tbody>{cPaged.map((r,i)=>(<tr key={i}><td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.type}</td><td style={td_}>${r.communityFund}M</td><td style={td_}>{r.socialDialogue}</td><td style={td_}>{r.genderEquity}</td><td style={td_}>{r.youthInclusion}</td><td style={td_}>{r.healthServices}</td><td style={td_}>{r.housingSupport}</td></tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={cPage<=1} onClick={()=>setCPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {cPage}/{cTP}</span><button disabled={cPage>=cTP} onClick={()=>setCPage(p=>p+1)} style={pb}>Next</button></div>
      <div style={{...card,marginTop:16}}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Community Fund vs Social Dialogue</div>
        <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Fund $M" tick={{fontSize:9}}/><YAxis dataKey="y" name="Dialogue Score" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={cData.map(r=>({name:r.name,x:r.communityFund,y:r.socialDialogue}))} fill={ACCENT} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
      </div>
    </div>)}

    </div>
  </div>);
}
