import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#7c3aed';
const fmt=v=>typeof v==='number'?v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Company Readiness','ESRS Standards','Gap Analysis'];
const SECTORS=['All','Finance','Energy','Industrials','Technology','Consumer','Healthcare','Materials','Utilities','Real Estate','Telecom'];
const READINESS=['All','Compliant','Advanced','In Progress','Early Stage','Not Started'];
const PAGE_SIZE=15;
const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.green,T.red,'#0891b2','#be185d','#ea580c'];
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(22,163,74,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?T.green:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const readBadge=(r)=>{const m={Compliant:{bg:'rgba(22,163,74,0.12)',c:T.green},Advanced:{bg:'rgba(90,138,106,0.12)',c:T.sage},'In Progress':{bg:'rgba(197,169,106,0.15)',c:T.gold},'Early Stage':{bg:'rgba(217,119,6,0.12)',c:T.amber},'Not Started':{bg:'rgba(220,38,38,0.12)',c:T.red}};const s=m[r]||m['Early Stage'];return{background:s.bg,color:s.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

const ESRS_STANDARDS=[{id:'ESRS E1',name:'Climate Change',category:'Environment',dataPoints:82,mandatory:true},{id:'ESRS E2',name:'Pollution',category:'Environment',dataPoints:56,mandatory:false},{id:'ESRS E3',name:'Water & Marine Resources',category:'Environment',dataPoints:38,mandatory:false},{id:'ESRS E4',name:'Biodiversity & Ecosystems',category:'Environment',dataPoints:45,mandatory:false},{id:'ESRS E5',name:'Resource Use & Circular Economy',category:'Environment',dataPoints:42,mandatory:false},{id:'ESRS S1',name:'Own Workforce',category:'Social',dataPoints:91,mandatory:true},{id:'ESRS S2',name:'Workers in Value Chain',category:'Social',dataPoints:48,mandatory:false},{id:'ESRS S3',name:'Affected Communities',category:'Social',dataPoints:36,mandatory:false},{id:'ESRS S4',name:'Consumers & End-users',category:'Social',dataPoints:34,mandatory:false},{id:'ESRS G1',name:'Business Conduct',category:'Governance',dataPoints:28,mandatory:true},{id:'ESRS 1',name:'General Requirements',category:'Cross-cutting',dataPoints:65,mandatory:true},{id:'ESRS 2',name:'General Disclosures',category:'Cross-cutting',dataPoints:78,mandatory:true}];

const COMPANIES=(()=>{const names=['Siemens AG','SAP SE','Allianz SE','Deutsche Bank','BMW AG','BASF SE','Bayer AG','Volkswagen AG','Daimler Truck','Infineon Tech','Unilever plc','Shell plc','BP plc','HSBC Holdings','Nestle SA','Novartis AG','Roche Holding','AstraZeneca','GSK plc','Diageo plc','Rio Tinto plc','BHP Group','Glencore plc','Anglo American','TotalEnergies','Enel SpA','Iberdrola SA','Schneider Elec','Saint-Gobain','Danone SA','LVMH','LOreal SA','Pernod Ricard','Hermes Intl','Kering SA','Stellantis NV','Renault Group','Philips NV','ASML Holding','Adidas AG','Inditex SA','H&M Group','Volvo Group','Ericsson AB','Nokia Corp','Telefonica SA','Deutsche Telekom','Orange SA','Eiffage SA','Vinci SA','Bouygues SA','Engie SA','Veolia Environ','Air Liquide','Michelin SA','Peugeot SA','Safran SA','Thales SA','Leonardo SpA','Airbus SE','ABB Ltd','UBS Group','Credit Suisse','Swiss Re','Zurich Insurance','Adecco Group','Swatch Group','Geberit AG','Holcim Ltd','Sika AG','EDF Group','Orsted A/S','Vestas Wind','Novo Nordisk','Maersk','Carlsberg A/S','Coloplast','DSV Panalpina','Pandora A/S','ISS A/S'];
const secs=['Industrials','Technology','Finance','Finance','Industrials','Materials','Healthcare','Industrials','Industrials','Technology','Consumer','Energy','Energy','Finance','Consumer','Healthcare','Healthcare','Healthcare','Healthcare','Consumer','Materials','Materials','Materials','Materials','Energy','Utilities','Utilities','Industrials','Materials','Consumer','Consumer','Consumer','Consumer','Consumer','Consumer','Industrials','Industrials','Healthcare','Technology','Consumer','Consumer','Consumer','Industrials','Technology','Technology','Telecom','Telecom','Telecom','Industrials','Industrials','Industrials','Utilities','Utilities','Materials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Finance','Finance','Finance','Finance','Industrials','Consumer','Industrials','Materials','Materials','Utilities','Energy','Energy','Healthcare','Industrials','Consumer','Healthcare','Industrials','Consumer','Industrials'];
return names.map((n,i)=>({id:i+1,name:n,sector:secs[i],overallReadiness:Math.round(10+sr(i*7)*85),e1Score:Math.round(15+sr(i*11)*80),e2Score:Math.round(10+sr(i*13)*85),s1Score:Math.round(20+sr(i*17)*75),s2Score:Math.round(5+sr(i*19)*80),g1Score:Math.round(25+sr(i*23)*70),doubleMateriality:Math.round(10+sr(i*29)*85),gapCount:Math.round(sr(i*31)*45),dataPointsCovered:Math.round(100+sr(i*37)*543),totalDataPoints:643,automationRate:Math.round(10+sr(i*41)*80),assuranceReady:Math.round(5+sr(i*43)*90),taxonomyAlignment:Math.round(sr(i*47)*65),reportingDeadline:`202${5+Math.floor(sr(i*53)*2)}`,status:sr(i*7)<0.1?'Compliant':sr(i*7)<0.3?'Advanced':sr(i*7)<0.55?'In Progress':sr(i*7)<0.8?'Early Stage':'Not Started'}));})();

const TREND=Array.from({length:18},(_,i)=>({month:`${2024+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgReady:Math.round(20+i*3+sr(i*7)*8),compliant:Math.round(2+i*1.5+sr(i*11)*3),gapsFixed:Math.round(50+i*20+sr(i*13)*40)}));

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function CsrdEsrsAutomationPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[secF,setSecF]=useState('All');const[readF,setReadF]=useState('All');
  const[sortCol,setSortCol]=useState('overallReadiness');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(secF!=='All')d=d.filter(r=>r.sector===secF);if(readF!=='All')d=d.filter(r=>r.status===readF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,secF,readF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const kpis=useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return{avgReady:avg('overallReadiness'),avgAuto:avg('automationRate'),compliant:COMPANIES.filter(c=>c.status==='Compliant'||c.status==='Advanced').length,totalGaps:COMPANIES.reduce((s,c)=>s+c.gapCount,0),standards:ESRS_STANDARDS.length};},[]);
  const sectorChart=useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,avgReady:0,n:0};m[c.sector].avgReady+=c.overallReadiness;m[c.sector].n++;});return Object.values(m).map(s=>({...s,avgReady:Math.round(s.avgReady/s.n)}));},[]);
  const statusDist=useMemo(()=>{const m={};COMPANIES.forEach(c=>{m[c.status]=(m[c.status]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);
  const radarData=useMemo(()=>{const dims=['e1Score','e2Score','s1Score','s2Score','g1Score','doubleMateriality'];const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').replace(/(\d)/g,' $1').trim(),value:avg(d),fullMark:100}));},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(124,58,237,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Avg Readiness" value={kpis.avgReady+'%'} sub="80 companies" color={ACCENT}/><KPI label="Automation Rate" value={kpis.avgAuto+'%'} sub="data collection" color={T.navy}/>
      <KPI label="Compliant/Adv" value={kpis.compliant} sub="companies" color={T.green}/><KPI label="Total Gaps" value={fmt(kpis.totalGaps)} sub="across portfolio" color={T.red}/>
      <KPI label="ESRS Standards" value={kpis.standards} sub="tracked" color={T.gold}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Readiness by Sector</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={sectorChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/><Tooltip {...tip}/><Bar dataKey="avgReady" fill={ACCENT} radius={[4,4,0,0]} name="Readiness %"/></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Status Distribution</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{statusDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Readiness Trend</div>
        <ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={2}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="avgReady" stroke={ACCENT} fill="rgba(124,58,237,0.1)" name="Avg Readiness %"/><Area type="monotone" dataKey="compliant" stroke={T.green} fill="rgba(22,163,74,0.08)" name="Compliant #"/></AreaChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>ESRS Score Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Avg" dataKey="value" stroke={ACCENT} fill="rgba(124,58,237,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
  </>);

  const renderScreen=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search companies..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={secF} onChange={e=>{setSecF(e.target.value);setPage(1);}}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
      <select style={ss.select} value={readF} onChange={e=>{setReadF(e.target.value);setPage(1);}}>{READINESS.map(s=><option key={s}>{s}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} companies</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'csrd_readiness')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="name" label="Company" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="sector" label="Sector" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="overallReadiness" label="Readiness" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="e1Score" label="E1 Climate" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="s1Score" label="S1 Workforce" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="g1Score" label="G1 Conduct" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="gapCount" label="Gaps" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="status" label="Status" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={ss.td}>{r.sector}</td>
        <td style={ss.td}><span style={badge(r.overallReadiness,[25,50,70])}>{r.overallReadiness}%</span></td>
        <td style={ss.td}><span style={badge(r.e1Score,[25,50,70])}>{r.e1Score}%</span></td>
        <td style={ss.td}><span style={badge(r.s1Score,[25,50,70])}>{r.s1Score}%</span></td>
        <td style={ss.td}><span style={badge(r.g1Score,[25,50,70])}>{r.g1Score}%</span></td>
        <td style={{...ss.td,fontFamily:T.mono,color:r.gapCount>30?T.red:r.gapCount>15?T.amber:T.green}}>{r.gapCount}</td>
        <td style={ss.td}><span style={readBadge(r.status)}>{r.status}</span></td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['E2 Pollution',r.e2Score+'%'],['S2 Value Chain',r.s2Score+'%'],['Double Materiality',r.doubleMateriality+'%'],['Data Points',r.dataPointsCovered+'/'+r.totalDataPoints],['Automation Rate',r.automationRate+'%'],['Assurance Ready',r.assuranceReady+'%'],['Taxonomy Alignment',r.taxonomyAlignment+'%'],['Reporting Deadline',r.reportingDeadline]].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'E1',v:r.e1Score},{d:'E2',v:r.e2Score},{d:'S1',v:r.s1Score},{d:'S2',v:r.s2Score},{d:'G1',v:r.g1Score},{d:'DblMat',v:r.doubleMateriality}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(124,58,237,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'Readiness',v:r.overallReadiness},{n:'Automation',v:r.automationRate},{n:'Assurance',v:r.assuranceReady},{n:'Taxonomy',v:r.taxonomyAlignment},{n:'Dbl Materiality',v:r.doubleMateriality}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="n" type="category" tick={{fontSize:9,fill:T.textSec}} width={80}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderStandards=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>ESRS Standards Overview</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={ESRS_STANDARDS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="id" tick={{fontSize:9,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="dataPoints" fill={ACCENT} radius={[4,4,0,0]} name="Data Points"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={[{name:'Environment',value:5},{name:'Social',value:4},{name:'Governance',value:1},{name:'Cross-cutting',value:2}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,value})=>`${name}: ${value}`} labelLine={false} fontSize={10}>{[0,1,2,3].map(i=><Cell key={i} fill={PIECLRS[i]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>ID</th><th style={ss.th('','','')}>Standard</th><th style={ss.th('','','')}>Category</th><th style={ss.th('','','')}>Data Points</th><th style={ss.th('','','')}>Mandatory</th></tr></thead><tbody>
      {ESRS_STANDARDS.map(s=>(<tr key={s.id}><td style={{...ss.td,fontFamily:T.mono,fontWeight:600}}>{s.id}</td><td style={{...ss.td,fontWeight:600}}>{s.name}</td><td style={ss.td}><span style={{background:s.category==='Environment'?'rgba(22,163,74,0.1)':s.category==='Social'?'rgba(8,145,178,0.1)':s.category==='Governance'?'rgba(124,58,237,0.1)':'rgba(197,169,106,0.1)',color:s.category==='Environment'?T.green:s.category==='Social'?'#0891b2':s.category==='Governance'?ACCENT:T.gold,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>{s.category}</span></td><td style={{...ss.td,fontFamily:T.mono}}>{s.dataPoints}</td><td style={ss.td}><span style={{color:s.mandatory?T.green:T.textMut,fontWeight:600,fontSize:11}}>{s.mandatory?'Yes':'Materiality'}</span></td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(ESRS_STANDARDS,'esrs_standards')}>Export CSV</button></div>
  </div>);

  const renderGap=()=>{
    const gapData=COMPANIES.sort((a,b)=>b.gapCount-a.gapCount).slice(0,20);
    return(<div style={ss.card}>
      <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Gap Analysis</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <ResponsiveContainer width="100%" height={300}><BarChart data={gapData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="name" type="category" tick={{fontSize:8,fill:T.textSec}} width={100}/><Tooltip {...tip}/><Bar dataKey="gapCount" fill={T.red} radius={[0,4,4,0]} name="Gaps"/></BarChart></ResponsiveContainer>
        <ResponsiveContainer width="100%" height={300}><LineChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={2}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="gapsFixed" stroke={T.green} strokeWidth={2} name="Gaps Fixed (cumulative)"/></LineChart></ResponsiveContainer>
      </div>
      <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Company</th><th style={ss.th('','','')}>Gaps</th><th style={ss.th('','','')}>Readiness</th><th style={ss.th('','','')}>Coverage</th><th style={ss.th('','','')}>Status</th></tr></thead><tbody>
        {gapData.map(r=>(<tr key={r.id}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={{...ss.td,fontFamily:T.mono,color:T.red,fontWeight:600}}>{r.gapCount}</td><td style={ss.td}><span style={badge(r.overallReadiness,[25,50,70])}>{r.overallReadiness}%</span></td><td style={{...ss.td,fontFamily:T.mono}}>{r.dataPointsCovered}/{r.totalDataPoints}</td><td style={ss.td}><span style={readBadge(r.status)}>{r.status}</span></td></tr>))}
      </tbody></table></div>
      <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(gapData,'gap_analysis')}>Export CSV</button></div>
    </div>);
  };

  return(<div style={ss.wrap}>
    <div style={ss.header}>CSRD / ESRS Automation</div>
    <div style={ss.sub}>12 ESRS standards, double materiality assessment, gap analysis across 80 companies</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderScreen()}{tab===2&&renderStandards()}{tab===3&&renderGap()}
  </div>);
}