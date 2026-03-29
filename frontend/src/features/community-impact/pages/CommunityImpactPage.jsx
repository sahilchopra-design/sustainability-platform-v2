import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#059669';
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Project Assessment','Grievance Tracker','Benefit Sharing'];
const TYPES=['All','Mining','Energy','Infrastructure','Agriculture','Forestry','Water','Industrial'];
const STATUSES=['All','Active','Completed','Under Review','Suspended'];
const PAGE_SIZE=12;

const PROJECTS=(()=>{
  const names=['Cerro Verde Mine','Oyu Tolgoi','Simandou Iron','Quellaveco Copper','Reko Diq Gold','Kamoa-Kakula','Trans Mountain Pipeline','Coastal GasLink','Nord Stream Extension','Mekong Dam Cascade','Belo Monte Dam','Adani Port Complex','Thar Coal Block','Hambantota Port','Jakarta Flood Wall','Lagos Light Rail','Nairobi Expressway','Addis Ababa LRT','Bogota Metro Line','Lima Metro Line 2','Santiago Highway','Mumbai Metro III','Delhi-Mumbai Corridor','Dhaka Metro','Hanoi Metro','Manila Subway','Ho Chi Minh Metro','Kunming-Bangkok Rail','Java Fast Train','Singapore-KL HSR','Amazon Soy Corridor','Cerrado Conservation','Palm Oil Expansion','Rubber Plantation','Coffee Cooperative','Cocoa Agroforestry','Great Green Wall','Sahel Irrigation','Niger Delta Cleanup','Lake Chad Restoration','Sundarbans Protection','Coral Triangle','Great Barrier Reef','Maldives Sea Wall','Pacific Resilience','Caribbean Hurricane','Fiji Climate Hub','Tonga Recovery','Samoa Coastal','Vanuatu Adaptation','Marshall Islands','Kiribati Adaptation','Tuvalu Rising Seas','Solomon Islands','Papua LNG Project','Timor Sea Project','Myanmar Pipeline','Laos Battery Hub','Cambodia Solar Park','Vietnam Wind Farm'];
  const types=['Mining','Mining','Mining','Mining','Mining','Mining','Energy','Energy','Energy','Energy','Energy','Infrastructure','Mining','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Agriculture','Forestry','Agriculture','Agriculture','Agriculture','Agriculture','Forestry','Water','Industrial','Water','Forestry','Water','Water','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Infrastructure','Energy','Energy','Energy','Energy','Energy','Energy'];
  return names.map((n,i)=>({id:i+1,name:n,type:types[i]||'Infrastructure',status:sr(i*7)<0.5?'Active':sr(i*7)<0.7?'Completed':sr(i*7)<0.9?'Under Review':'Suspended',fpicScore:Math.round(20+sr(i*11)*75),benefitSharing:Math.round(10+sr(i*13)*80),grievanceMech:Math.round(15+sr(i*17)*80),communityEngagement:Math.round(20+sr(i*19)*75),livelihoods:Math.round(15+sr(i*23)*80),displacement:Math.round(sr(i*29)*60),culturalHeritage:Math.round(25+sr(i*31)*70),healthImpact:Math.round(10+sr(i*37)*65),educationAccess:Math.round(30+sr(i*41)*65),waterAccess:Math.round(20+sr(i*43)*75),jobsCreated:Math.round(50+sr(i*47)*4950),investmentLocal:Math.round(1+sr(i*53)*99),grievancesOpen:Math.round(sr(i*59)*45),grievancesResolved:Math.round(sr(i*61)*80),resolutionTime:Math.round(5+sr(i*67)*90),communityScore:Math.round(20+sr(i*71)*75),overallRating:sr(i*7)<0.2?'Excellent':sr(i*7)<0.4?'Good':sr(i*7)<0.65?'Adequate':sr(i*7)<0.85?'Poor':'Critical'}));})();

const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,newGrievances:Math.round(5+sr(i*7)*20),resolved:Math.round(3+sr(i*11)*18),escalated:Math.round(1+sr(i*13)*8),investment:Math.round(10+sr(i*17)*50)}));

const badge=(val,thresholds)=>{const[lo,mid,hi]=thresholds;const bg=val>=hi?'rgba(22,163,74,0.12)':val>=mid?'rgba(197,169,106,0.12)':val>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=val>=hi?T.green:val>=mid?T.gold:val>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const rBadge=(r)=>{const m={Excellent:{bg:'rgba(22,163,74,0.12)',c:T.green},Good:{bg:'rgba(90,138,106,0.12)',c:T.sage},Adequate:{bg:'rgba(197,169,106,0.15)',c:T.gold},Poor:{bg:'rgba(217,119,6,0.12)',c:T.amber},Critical:{bg:'rgba(220,38,38,0.12)',c:T.red}};const s=m[r]||m.Adequate;return{background:s.bg,color:s.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

export default function CommunityImpactPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[typeF,setTypeF]=useState('All');const[statusF,setStatusF]=useState('All');const[sortCol,setSortCol]=useState('communityScore');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[selected,setSelected]=useState(null);
  const[gSearch,setGSearch]=useState('');const[gSort,setGSort]=useState('grievancesOpen');const[gDir,setGDir]=useState('desc');const[gPage,setGPage]=useState(1);
  const[bSearch,setBSearch]=useState('');const[bSort,setBSort]=useState('benefitSharing');const[bDir,setBDir]=useState('desc');const[bPage,setBPage]=useState(1);

  const filtered=useMemo(()=>{let d=[...PROJECTS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(typeF!=='All')d=d.filter(r=>r.type===typeF);if(statusF!=='All')d=d.filter(r=>r.status===statusF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,typeF,statusF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);const tP=Math.ceil(filtered.length/PAGE_SIZE);
  const gData=useMemo(()=>{let d=filtered.map(r=>({name:r.name,type:r.type,grievancesOpen:r.grievancesOpen,grievancesResolved:r.grievancesResolved,resolutionTime:r.resolutionTime,grievanceMech:r.grievanceMech}));if(gSearch)d=d.filter(r=>r.name.toLowerCase().includes(gSearch.toLowerCase()));d.sort((a,b)=>gDir==='asc'?(a[gSort]>b[gSort]?1:-1):(a[gSort]<b[gSort]?1:-1));return d;},[filtered,gSearch,gSort,gDir]);
  const gPaged=useMemo(()=>gData.slice((gPage-1)*PAGE_SIZE,gPage*PAGE_SIZE),[gData,gPage]);const gTP=Math.ceil(gData.length/PAGE_SIZE);
  const bData=useMemo(()=>{let d=filtered.map(r=>({name:r.name,type:r.type,benefitSharing:r.benefitSharing,jobsCreated:r.jobsCreated,investmentLocal:r.investmentLocal,livelihoods:r.livelihoods,educationAccess:r.educationAccess}));if(bSearch)d=d.filter(r=>r.name.toLowerCase().includes(bSearch.toLowerCase()));d.sort((a,b)=>bDir==='asc'?(a[bSort]>b[bSort]?1:-1):(a[bSort]<b[bSort]?1:-1));return d;},[filtered,bSearch,bSort,bDir]);
  const bPaged=useMemo(()=>bData.slice((bPage-1)*PAGE_SIZE,bPage*PAGE_SIZE),[bData,bPage]);const bTP=Math.ceil(bData.length/PAGE_SIZE);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(1);};
  const doGSort=(col)=>{if(gSort===col)setGDir(d=>d==='asc'?'desc':'asc');else{setGSort(col);setGDir('desc');}setGPage(1);};
  const doBSort=(col)=>{if(bSort===col)setBDir(d=>d==='asc'?'desc':'asc');else{setBSort(col);setBDir('desc');}setBPage(1);};

  const stats=useMemo(()=>({total:filtered.length,avgScore:(filtered.reduce((s,r)=>s+r.communityScore,0)/filtered.length||0).toFixed(1),avgFPIC:(filtered.reduce((s,r)=>s+r.fpicScore,0)/filtered.length||0).toFixed(1),totalJobs:filtered.reduce((s,r)=>s+r.jobsCreated,0),openGrievances:filtered.reduce((s,r)=>s+r.grievancesOpen,0),excellent:filtered.filter(r=>r.overallRating==='Excellent'||r.overallRating==='Good').length}),[filtered]);
  const typeDist=useMemo(()=>{const m={};filtered.forEach(r=>{m[r.type]=(m[r.type]||0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v})).sort((a,b)=>b.value-a.value);},[filtered]);
  const ratingDist=useMemo(()=>{const o=['Excellent','Good','Adequate','Poor','Critical'];const m={};filtered.forEach(r=>{m[r.overallRating]=(m[r.overallRating]||0)+1;});return o.filter(k=>m[k]).map(k=>({name:k,value:m[k]}));},[filtered]);

  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const k=Object.keys(data[0]);const csv=[k.join(','),...data.map(r=>k.map(c=>`"${r[c]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);},[]);

  const si=(col,cur,dir)=>cur===col?(dir==='asc'?' ▲':' ▼'):' ○';
  const th={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left'};
  const td_={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inp={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const sel_={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnS=(a)=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer'});
  const pb={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};

  const Panel=({item,onClose})=>{if(!item)return null;return(<div style={{position:'fixed',top:0,right:0,width:420,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}>
    <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{item.name}</div><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button></div>
    <div style={{padding:'16px 24px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        {[['FPIC Score',item.fpicScore],['Benefit Sharing',item.benefitSharing+'%'],['Grievance Mech.',item.grievanceMech],['Community Engage.',item.communityEngagement],['Livelihoods',item.livelihoods],['Displacement Risk',item.displacement],['Cultural Heritage',item.culturalHeritage],['Health Impact',item.healthImpact],['Education Access',item.educationAccess],['Water Access',item.waterAccess],['Jobs Created',item.jobsCreated],['Local Investment',item.investmentLocal+'%'],['Open Grievances',item.grievancesOpen],['Resolved',item.grievancesResolved+'%'],['Resolution Time',item.resolutionTime+' days'],['Community Score',item.communityScore]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
      </div>
      <span style={rBadge(item.overallRating)}>{item.overallRating}</span>
      <div style={{height:200,marginTop:16}}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={[{d:'FPIC',v:item.fpicScore},{d:'Benefits',v:item.benefitSharing},{d:'Grievance',v:item.grievanceMech},{d:'Engagement',v:item.communityEngagement},{d:'Livelihoods',v:item.livelihoods},{d:'Heritage',v:item.culturalHeritage}]}>
            <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>);};

  return(<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.border}`,background:T.surface}}><div style={{fontSize:20,fontWeight:700,color:T.navy}}>Community Impact Assessment</div><div style={{fontSize:12,color:T.textSec,marginTop:2,fontFamily:T.mono}}>FPIC &middot; Benefit Sharing &middot; Grievance Mechanisms &middot; {PROJECTS.length} Projects</div></div>
    <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:28}}>{TABS.map((t,i)=>(<button key={i} onClick={()=>{setTab(i);setSelected(null);}} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',background:'none',color:tab===i?ACCENT:T.textSec,fontWeight:tab===i?700:400,fontSize:12,cursor:'pointer'}}>{t}</button>))}</div>
    <div style={{padding:'20px 28px'}}>

    {tab===0&&(<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:20}}>
        {[['Projects',stats.total,T.navy],['Avg Score',stats.avgScore,ACCENT],['Avg FPIC',stats.avgFPIC,T.sage],['Total Jobs',stats.totalJobs.toLocaleString(),T.gold],['Open Grievances',stats.openGrievances,T.red],['Good/Excellent',stats.excellent,T.green]].map(([l,v,c],i)=>(<div key={i} style={card}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Grievance Trend (24M)</div>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:9}}/><Tooltip {...tip}/><Area type="monotone" dataKey="newGrievances" stroke={T.red} fill={T.red} fillOpacity={0.15} name="New"/><Area type="monotone" dataKey="resolved" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} name="Resolved"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Rating Distribution</div>
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={ratingDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({name,value})=>`${name}: ${value}`} style={{fontSize:9}}>{ratingDist.map((_,i)=>(<Cell key={i} fill={[T.green,T.sage,T.gold,T.amber,T.red][i%5]}/>))}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Project Types</div>
          <ResponsiveContainer width="100%" height={220}><BarChart data={typeDist} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9}}/><YAxis dataKey="name" type="category" tick={{fontSize:9}} width={80}/><Tooltip {...tip}/><Bar dataKey="value" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>)}

    {tab===1&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search projects..." style={inp}/>
        <select value={typeF} onChange={e=>{setTypeF(e.target.value);setPage(1);}} style={sel_}>{TYPES.map(s=>(<option key={s}>{s}</option>))}</select>
        <select value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}} style={sel_}>{STATUSES.map(s=>(<option key={s}>{s}</option>))}</select>
        <button onClick={()=>exportCSV(filtered,'community_impact.csv')} style={btnS(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length} projects</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Project'],['type','Type'],['status','Status'],['communityScore','Score'],['fpicScore','FPIC'],['benefitSharing','Benefits%'],['grievanceMech','Grievance'],['communityEngagement','Engagement'],['displacement','Displace.'],['overallRating','Rating']].map(([k,l])=>(<th key={k} onClick={()=>doSort(k)} style={th}>{l}{si(k,sortCol,sortDir)}</th>))}
        </tr></thead><tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
          <td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.type}</td><td style={td_}>{r.status}</td>
          <td style={td_}><span style={badge(r.communityScore,[25,50,70])}>{r.communityScore}</span></td>
          <td style={td_}>{r.fpicScore}</td><td style={td_}>{r.benefitSharing}%</td><td style={td_}>{r.grievanceMech}</td>
          <td style={td_}>{r.communityEngagement}</td><td style={td_}><span style={badge(100-r.displacement,[30,55,75])}>{r.displacement}</span></td>
          <td style={td_}><span style={rBadge(r.overallRating)}>{r.overallRating}</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {page}/{tP}</span><button disabled={page>=tP} onClick={()=>setPage(p=>p+1)} style={pb}>Next</button></div>
      <Panel item={selected} onClose={()=>setSelected(null)}/>
    </div>)}

    {tab===2&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={gSearch} onChange={e=>{setGSearch(e.target.value);setGPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(gData,'grievances.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{gData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Project'],['type','Type'],['grievancesOpen','Open'],['grievancesResolved','Resolved%'],['resolutionTime','Avg Days'],['grievanceMech','Mechanism Score']].map(([k,l])=>(<th key={k} onClick={()=>doGSort(k)} style={th}>{l}{si(k,gSort,gDir)}</th>))}
        </tr></thead><tbody>{gPaged.map((r,i)=>(<tr key={i}><td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.type}</td><td style={td_}><span style={{color:r.grievancesOpen>20?T.red:r.grievancesOpen>10?T.amber:T.green,fontWeight:700}}>{r.grievancesOpen}</span></td><td style={td_}>{r.grievancesResolved}%</td><td style={td_}>{r.resolutionTime}d</td><td style={td_}><span style={badge(r.grievanceMech,[25,50,70])}>{r.grievanceMech}</span></td></tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={gPage<=1} onClick={()=>setGPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {gPage}/{gTP}</span><button disabled={gPage>=gTP} onClick={()=>setGPage(p=>p+1)} style={pb}>Next</button></div>
    </div>)}

    {tab===3&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={bSearch} onChange={e=>{setBSearch(e.target.value);setBPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(bData,'benefit_sharing.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{bData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Project'],['type','Type'],['benefitSharing','Benefit%'],['jobsCreated','Jobs'],['investmentLocal','Local Invest%'],['livelihoods','Livelihood Score'],['educationAccess','Education']].map(([k,l])=>(<th key={k} onClick={()=>doBSort(k)} style={th}>{l}{si(k,bSort,bDir)}</th>))}
        </tr></thead><tbody>{bPaged.map((r,i)=>(<tr key={i}><td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.type}</td><td style={td_}><span style={badge(r.benefitSharing,[20,50,70])}>{r.benefitSharing}%</span></td><td style={td_}>{r.jobsCreated.toLocaleString()}</td><td style={td_}>{r.investmentLocal}%</td><td style={td_}>{r.livelihoods}</td><td style={td_}>{r.educationAccess}</td></tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={bPage<=1} onClick={()=>setBPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {bPage}/{bTP}</span><button disabled={bPage>=bTP} onClick={()=>setBPage(p=>p+1)} style={pb}>Next</button></div>
      <div style={{...card,marginTop:16}}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Jobs Created vs Benefit Sharing</div>
        <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Benefit %" tick={{fontSize:9}}/><YAxis dataKey="y" name="Jobs" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={bData.map(r=>({name:r.name,x:r.benefitSharing,y:r.jobsCreated}))} fill={ACCENT} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
      </div>
    </div>)}

    </div>
  </div>);
}
