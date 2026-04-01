import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Legend,Cell,LineChart,Line,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt1=n=>Number(n).toFixed(1);const fmt0=n=>Number(n).toFixed(0);
const scoreColor=v=>v>=70?T.green:v>=45?T.amber:T.red;
const riskColor=v=>v==='Low'?T.green:v==='Medium'?T.amber:v==='High'?T.red:'#7c3aed';
const statusColor=v=>v==='Complete'?T.green:v==='In Progress'?T.amber:v==='Not Started'?T.red:T.textMut;
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.goldL,T.sageL,T.red,T.amber,T.green,'#7c3aed'];

const FRAMEWORKS=['CSRD/ESRS','SFDR','ISSB/IFRS S1-S2','SEC Climate','TCFD','UK SDR','EU Taxonomy','CDP'];
const ENTITY_TYPES=['Asset Manager','Bank','Insurance','Pension Fund','Corporate','Sovereign'];
const RISK_LEVELS=['Low','Medium','High','Critical'];
const STATUSES=['Complete','In Progress','Not Started'];
const NAMES=['BlackRock Inc','Vanguard Group','State Street Corp','Fidelity Investments','JPMorgan AM','Goldman Sachs AM','Morgan Stanley IM','UBS Asset Mgmt','Deutsche Bank AG','BNP Paribas AM','Amundi SA','Schroders PLC','Legal & General','Aberdeen Standard','Invesco Ltd','T Rowe Price','Franklin Templeton','PIMCO LLC','AXA Investment','Allianz Global','Zurich Insurance','Swiss Re AG','Munich Re Group','Prudential PLC','Aviva Investors','M&G Investments','Nordea AM','SEB Investment','Handelsbanken AM','Danske Bank AM','Robeco SAM','Pictet AM','Lombard Odier','Candriam SA','NN Investment','APG Asset Mgmt','PGGM Investments','Ontario Teachers','CDPQ Canada','CalPERS Fund','CalSTRS Fund','NY State Common','Texas Teachers','Florida SBA','NBIM Norway','GIC Singapore','Temasek Holdings','ADIA Abu Dhabi','KIA Kuwait','QIA Qatar'];

const cardS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16};
const inputS={fontFamily:T.mono,fontSize:13,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,outline:'none',background:T.surface,color:T.text,width:260};
const btnS=(a)=>({fontFamily:T.font,fontSize:13,fontWeight:a?700:500,padding:'8px 18px',border:`1px solid ${a?T.gold:T.border}`,borderRadius:6,background:a?T.gold:T.surface,color:a?'#fff':T.text,cursor:'pointer'});
const thS={fontFamily:T.mono,fontSize:12,fontWeight:600,color:T.textSec,padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'};
const tdS={fontFamily:T.font,fontSize:13,color:T.text,padding:'10px 12px',borderBottom:`1px solid ${T.borderL}`};
const badgeS=(bg)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg});
const kpiBoxS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,textAlign:'center',flex:1,minWidth:140};
const kpiVal={fontFamily:T.mono,fontSize:26,fontWeight:700,color:T.navy};
const kpiLab={fontFamily:T.font,fontSize:11,color:T.textMut,marginTop:4,textTransform:'uppercase',letterSpacing:0.5};
const exportCSV=(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
const CT=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'10px 14px',fontFamily:T.font,fontSize:12}}><div style={{fontWeight:700,color:T.navy,marginBottom:4}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?fmt1(p.value):p.value}</div>)}</div>);};

const genData=(count)=>{const data=[];for(let i=0;i<count;i++){const s=idx=>sr(i*idx+idx);
  const framework=FRAMEWORKS[Math.floor(s(17)*FRAMEWORKS.length)];const entityType=ENTITY_TYPES[Math.floor(s(23)*ENTITY_TYPES.length)];
  const status=STATUSES[Math.floor(s(29)*STATUSES.length)];const risk=RISK_LEVELS[Math.floor(s(31)*RISK_LEVELS.length)];
  data.push({id:i+1,name:NAMES[i%NAMES.length]+(i>=NAMES.length?` ${Math.floor(i/NAMES.length)+1}`:''),
    framework,entityType,status,risk,region:['North America','Europe','Asia Pacific','LATAM','Middle East'][Math.floor(s(37)*5)],
    completionRate:Math.floor(10+s(41)*88),dataQuality:Math.floor(20+s(43)*78),gaps:Math.floor(s(47)*25),
    score:Math.floor(20+s(53)*75),automationRate:Math.floor(5+s(59)*90),auditReady:s(61)>0.5?'Yes':'No',
    timeline:Math.floor(10+s(67)*350),stakeholderScore:Math.floor(25+s(71)*70),
    envDisc:Math.floor(15+s(73)*83),socDisc:Math.floor(15+s(79)*83),govDisc:Math.floor(20+s(83)*78),
    dataPoints:Math.floor(50+s(89)*950),crossRef:Math.floor(s(97)*35),
    q1:Math.floor(10+s(101)*88),q2:Math.floor(15+s(103)*83),q3:Math.floor(20+s(107)*78),q4:Math.floor(22+s(109)*76),
    aum:Math.floor(10+s(113)*4990),employees:Math.floor(100+s(127)*49900),
  });}return data;};

const DATA=genData(50);const TABS=['Disclosure Overview','Compliance Status','Gap Analysis','Timeline Tracking'];const PAGE_SIZE=12;

export default function DisclosureHubPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sortCol,setSortCol]=useState('completionRate');const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(0);const[expanded,setExpanded]=useState(null);const[fFw,setFFw]=useState('All');const[fType,setFType]=useState('All');const[fStatus,setFStatus]=useState('All');

  const filtered=useMemo(()=>{let d=[...DATA];if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)||r.framework.toLowerCase().includes(s)||r.region.toLowerCase().includes(s));}
    if(fFw!=='All')d=d.filter(r=>r.framework===fFw);if(fType!=='All')d=d.filter(r=>r.entityType===fType);if(fStatus!=='All')d=d.filter(r=>r.status===fStatus);
    d.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];if(av==null)return 1;if(bv==null)return -1;return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});return d;},[search,sortCol,sortDir,fFw,fType,fStatus]);

  const paged=useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const toggleSort=(c)=>{if(sortCol===c)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(c);setSortDir('desc');}setPage(0);};
  const sortArrow=(c)=>sortCol===c?(sortDir==='asc'?' \u25B2':' \u25BC'):'';

  const kpis=useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgCompletion:0,avgQuality:0,totalGaps:0,auditReady:0,avgAuto:0};
    return{count:d.length,avgCompletion:d.reduce((a,r)=>a+r.completionRate,0)/d.length,avgQuality:d.reduce((a,r)=>a+r.dataQuality,0)/d.length,totalGaps:d.reduce((a,r)=>a+r.gaps,0),auditReady:d.filter(r=>r.auditReady==='Yes').length,avgAuto:d.reduce((a,r)=>a+r.automationRate,0)/d.length};},[filtered]);

  const fwDist=useMemo(()=>{const m={};filtered.forEach(r=>{m[r.framework]=(m[r.framework]||0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value})).sort((a,b)=>b.value-a.value);},[filtered]);
  const statusDist=useMemo(()=>STATUSES.map(s=>({name:s,value:filtered.filter(r=>r.status===s).length})),[filtered]);
  const radarData=useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;
    return[{axis:'Completion',value:avg('completionRate')},{axis:'Data Quality',value:avg('dataQuality')},{axis:'Automation',value:avg('automationRate')},{axis:'Env Disc',value:avg('envDisc')},{axis:'Soc Disc',value:avg('socDisc')},{axis:'Gov Disc',value:avg('govDisc')}];},[filtered]);
  const fwCompletion=useMemo(()=>FRAMEWORKS.map(f=>{const items=filtered.filter(r=>r.framework===f);if(!items.length)return null;return{name:f.length>14?f.slice(0,14)+'..':f,completion:items.reduce((a,r)=>a+r.completionRate,0)/items.length,quality:items.reduce((a,r)=>a+r.dataQuality,0)/items.length};}).filter(Boolean),[filtered]);
  const trendData=useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,completion:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length||1)})),[filtered]);

  const renderKPIs=()=>(<div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
    <div style={kpiBoxS}><div style={kpiVal}>{kpis.count}</div><div style={kpiLab}>Entities</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:scoreColor(kpis.avgCompletion)}}>{fmt1(kpis.avgCompletion)}%</div><div style={kpiLab}>Avg Completion</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt1(kpis.avgQuality)}%</div><div style={kpiLab}>Avg Data Quality</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{kpis.totalGaps}</div><div style={kpiLab}>Total Gaps</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:T.green}}>{kpis.auditReady}</div><div style={kpiLab}>Audit Ready</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt1(kpis.avgAuto)}%</div><div style={kpiLab}>Avg Automation</div></div>
  </div>);

  const renderFilters=()=>(<div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
    <input style={inputS} placeholder="Search entities, frameworks..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
    <select style={{...inputS,width:170}} value={fFw} onChange={e=>{setFFw(e.target.value);setPage(0);}}><option value="All">All Frameworks</option>{FRAMEWORKS.map(f=><option key={f}>{f}</option>)}</select>
    <select style={{...inputS,width:160}} value={fType} onChange={e=>{setFType(e.target.value);setPage(0);}}><option value="All">All Types</option>{ENTITY_TYPES.map(t=><option key={t}>{t}</option>)}</select>
    <select style={{...inputS,width:140}} value={fStatus} onChange={e=>{setFStatus(e.target.value);setPage(0);}}><option value="All">All Status</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
    <button style={{...btnS(false),marginLeft:'auto'}} onClick={()=>exportCSV(filtered,'disclosure_hub.csv')}>Export CSV</button>
  </div>);

  const renderPagination=()=>(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,fontFamily:T.mono,fontSize:12,color:T.textSec}}>
    <span>{page*PAGE_SIZE+1}-{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
    <div style={{display:'flex',gap:4}}><button style={btnS(false)} disabled={page===0} onClick={()=>setPage(p=>p-1)}>Prev</button>
      {Array.from({length:Math.min(totalPages,7)},(_,i)=>{let pg=i;if(totalPages>7){if(page<4)pg=i;else if(page>=totalPages-3)pg=totalPages-7+i;else pg=page-3+i;}return <button key={pg} style={btnS(pg===page)} onClick={()=>setPage(pg)}>{pg+1}</button>;})}
      <button style={btnS(false)} disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderExpanded=(r)=>(<tr key={`exp-${r.id}`}><td colSpan={99} style={{background:T.surfaceH,padding:20,borderBottom:`1px solid ${T.border}`}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>ENTITY DETAILS</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Type:</strong> {r.entityType}</div><div><strong>Region:</strong> {r.region}</div><div><strong>AUM:</strong> ${r.aum}M</div>
          <div><strong>Employees:</strong> {r.employees.toLocaleString()}</div><div><strong>Framework:</strong> {r.framework}</div><div><strong>Status:</strong> <span style={{color:statusColor(r.status)}}>{r.status}</span></div></div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>DISCLOSURE METRICS</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Completion:</strong> <span style={{color:scoreColor(r.completionRate),fontWeight:700}}>{r.completionRate}%</span></div>
          <div><strong>Data Quality:</strong> {r.dataQuality}%</div><div><strong>Gaps:</strong> <span style={{color:r.gaps>10?T.red:T.amber}}>{r.gaps}</span></div>
          <div><strong>Automation:</strong> {r.automationRate}%</div><div><strong>Audit Ready:</strong> <span style={{color:r.auditReady==='Yes'?T.green:T.red}}>{r.auditReady}</span></div>
          <div><strong>Data Points:</strong> {r.dataPoints}</div><div><strong>Cross-Ref:</strong> {r.crossRef}</div></div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>PILLAR DISCLOSURE</div>
        <div style={{fontSize:13,lineHeight:1.8,marginBottom:8}}><div><strong>Env Disclosure:</strong> {r.envDisc}%</div><div><strong>Social Disclosure:</strong> {r.socDisc}%</div><div><strong>Gov Disclosure:</strong> {r.govDisc}%</div>
          <div><strong>Timeline:</strong> {r.timeline} days</div><div><strong>Stakeholder Score:</strong> {r.stakeholderScore}</div><div><strong>Risk:</strong> <span style={{color:riskColor(r.risk)}}>{r.risk}</span></div></div>
        <ResponsiveContainer width="100%" height={100}><LineChart data={[{q:'Q1',s:r.q1},{q:'Q2',s:r.q2},{q:'Q3',s:r.q3},{q:'Q4',s:r.q4}]}><XAxis dataKey="q" tick={{fontSize:10}}/><YAxis domain={[0,100]} tick={{fontSize:9}}/><Line type="monotone" dataKey="s" stroke={T.navy} strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer></div>
    </div>
  </td></tr>);

  const renderTable=(cols)=>(<div style={{...cardS,overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{cols.map(([k,l])=><th key={k} style={thS} onClick={()=>toggleSort(k)}>{l}{sortArrow(k)}</th>)}</tr></thead>
    <tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        {cols.map(([k])=>{const v=r[k];if(k==='name')return <td key={k} style={{...tdS,fontWeight:600,color:T.navy}}>{v}</td>;if(k==='risk')return <td key={k} style={tdS}><span style={badgeS(riskColor(v))}>{v}</span></td>;if(k==='status')return <td key={k} style={{...tdS,color:statusColor(v),fontWeight:600}}>{v}</td>;if(k==='completionRate'||k==='score')return <td key={k} style={{...tdS,fontWeight:700,color:scoreColor(v)}}>{v}%</td>;if(k==='auditReady')return <td key={k} style={{...tdS,color:v==='Yes'?T.green:T.red,fontWeight:600}}>{v}</td>;if(typeof v==='number')return <td key={k} style={{...tdS,fontFamily:T.mono}}>{v}</td>;return <td key={k} style={tdS}>{v}</td>;})}
      </tr>{expanded===r.id&&renderExpanded(r)}
    </React.Fragment>))}</tbody></table>{renderPagination()}
  </div>);

  const renderTab0=()=>(<>{renderKPIs()}{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>FRAMEWORK DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={fwDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
          {fwDist.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>STATUS BREAKDOWN</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={statusDist}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>{statusDist.map((e,i)=><Cell key={i} fill={[T.green,T.amber,T.red][i]}/>)}</Bar></BarChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>COMPLETION vs DATA QUALITY</div>
      <ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="Completion%" tick={{fontSize:11}}/><YAxis dataKey="y" name="Data Quality%" tick={{fontSize:11}}/>
        <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>Completion:{d.x}% Quality:{d.y}%</div></div>}}/>
        <Scatter data={filtered.map(r=>({n:r.name,x:r.completionRate,y:r.dataQuality}))} fill={T.navy}/></ScatterChart></ResponsiveContainer></div>
    {renderTable([['name','Entity'],['framework','Framework'],['entityType','Type'],['completionRate','Compl%'],['dataQuality','Quality%'],['gaps','Gaps'],['status','Status'],['auditReady','Audit']])}
  </>);

  const renderTab1=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>DISCLOSURE RADAR</div>
        <ResponsiveContainer width="100%" height={300}><RadarChart data={radarData}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="axis" tick={{fontSize:11}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:10}}/>
          <Radar name="Avg" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/><Tooltip/></RadarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>COMPLETION BY FRAMEWORK</div>
        <ResponsiveContainer width="100%" height={300}><BarChart data={fwCompletion}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={55}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip content={<CT/>}/><Legend/>
          <Bar dataKey="completion" name="Completion%" fill={T.sage} radius={[2,2,0,0]}/><Bar dataKey="quality" name="Quality%" fill={T.gold} radius={[2,2,0,0]}/></BarChart></ResponsiveContainer></div>
    </div>
    {renderTable([['name','Entity'],['completionRate','Compl%'],['dataQuality','Quality%'],['automationRate','Auto%'],['envDisc','Env%'],['socDisc','Soc%'],['govDisc','Gov%'],['risk','Risk']])}
  </>);

  const renderTab2=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>GAPS BY FRAMEWORK</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={FRAMEWORKS.map(f=>{const items=filtered.filter(r=>r.framework===f);return{name:f.length>14?f.slice(0,14)+'..':f,gaps:items.reduce((a,r)=>a+r.gaps,0)};}).filter(d=>d.gaps>0)} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" width={110} tick={{fontSize:10}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="gaps" name="Total Gaps" fill={T.red} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>RISK DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.risk===l).length})).filter(d=>d.value>0)} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label>
          {RISK_LEVELS.map((_,i)=><Cell key={i} fill={[T.green,T.amber,T.red,'#7c3aed'][i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
    </div>
    {renderTable([['name','Entity'],['gaps','Gaps'],['crossRef','Cross-Ref'],['dataPoints','Data Pts'],['stakeholderScore','Stakeholder'],['score','Score'],['risk','Risk'],['status','Status']])}
  </>);

  const renderTab3=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>COMPLETION TREND</div>
        <ResponsiveContainer width="100%" height={280}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="quarter" tick={{fontSize:12}}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Line type="monotone" dataKey="completion" stroke={T.navy} strokeWidth={2} dot={{r:4}} name="Avg Completion%"/></LineChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>TIMELINE DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={280}><AreaChart data={[...filtered].sort((a,b)=>a.timeline-b.timeline).map((r,i)=>({rank:i+1,days:r.timeline}))}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="rank" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Area type="monotone" dataKey="days" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Days to Deadline"/></AreaChart></ResponsiveContainer></div>
    </div>
    {renderTable([['name','Entity'],['q1','Q1%'],['q2','Q2%'],['q3','Q3%'],['q4','Q4%'],['timeline','Timeline(d)'],['automationRate','Auto%'],['status','Status']])}
  </>);

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}><div style={{maxWidth:1400,margin:'0 auto'}}>
    <div style={{marginBottom:20}}><h1 style={{fontFamily:T.font,fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Disclosure Management Hub</h1><p style={{fontFamily:T.font,fontSize:13,color:T.textSec,marginTop:2}}>Regulatory disclosure tracking across {DATA.length} entities and {FRAMEWORKS.length} frameworks</p></div>
    <div style={{display:'flex',gap:6,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
      {TABS.map((t,i)=><button key={i} style={btnS(tab===i)} onClick={()=>{setTab(i);setPage(0);setExpanded(null);}}>{t}</button>)}</div>
    {tab===0&&renderTab0()}{tab===1&&renderTab1()}{tab===2&&renderTab2()}{tab===3&&renderTab3()}
  </div></div>);
}
