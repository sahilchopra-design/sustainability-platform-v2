import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#b45309';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Project Screening','Worker Programs','Indicators'];
const TYPES=['All','Coal Transition','Renewable Energy','Community Fund','Worker Retraining','Infrastructure','Economic Diversification','Clean Transport','Green Buildings','Social Enterprise','Land Remediation'];
const PAGE_SIZE=15;const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.green,T.red,'#8b5cf6','#0891b2','#be185d','#ea580c'];
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(22,163,74,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?T.green:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};

const PROJECTS=(()=>{const names=['Appalachian Green Jobs Hub','Silesia Coal Transition Fund','Ruhr Valley Innovation Park','Lusatia Green Energy Hub','Western Macedonia Just Transition','Asturias Workforce Program','Alberta Clean Energy Initiative','Queensland Green Transition','Mpumalanga Economic Diversification','Jharia Coalfield Restoration','Polish Mine Worker Retraining','Greek Lignite Communities Fund','Czech Coal Region Renaissance','Bulgarian Green Transition','Romanian Just Transition Plan','Slovak Coal Phase-out Support','Hunter Valley Green Future','Kuznetsk Basin Diversification','Shanxi Province Clean Energy','Jharkhand Worker Support','Latrobe Valley Authority','Collie Just Transition','Muswellbrook Future Fund','Cerrejon Community Program','Cesar Community Development','Jiu Valley Restructuring','Upper Silesia Transport Hub','Sokolov Region Recovery','Kosovo Energy Transition','Bosnia Coal Alternatives','Serbia Green Mining Fund','North Macedonia Green Plan','Albania Energy Transition','Montenegro Climate Fund','Georgia Green Growth','Ukraine Mine Recovery','Kazakhstan Green Economy','Uzbekistan Energy Future','Mongolia Clean Power','Indonesia Coal Transition'];
const types=['Worker Retraining','Coal Transition','Economic Diversification','Renewable Energy','Community Fund','Worker Retraining','Clean Transport','Coal Transition','Economic Diversification','Land Remediation','Worker Retraining','Community Fund','Coal Transition','Green Buildings','Infrastructure','Worker Retraining','Coal Transition','Economic Diversification','Renewable Energy','Worker Retraining','Community Fund','Coal Transition','Community Fund','Community Fund','Economic Diversification','Worker Retraining','Infrastructure','Land Remediation','Renewable Energy','Coal Transition','Community Fund','Green Buildings','Renewable Energy','Social Enterprise','Clean Transport','Land Remediation','Economic Diversification','Renewable Energy','Clean Transport','Coal Transition'];
return names.map((n,i)=>({id:i+1,name:n,type:types[i],investmentM:Math.round(5+sr(i*7)*295),workersRetrained:Math.round(100+sr(i*11)*4900),jobsCreated:Math.round(50+sr(i*13)*2950),communityFundM:Math.round(1+sr(i*17)*49),jtScore:Math.round(15+sr(i*19)*80),socialImpact:Math.round(10+sr(i*23)*85),economicDiv:Math.round(5+sr(i*29)*80),envRemediation:Math.round(10+sr(i*31)*85),stakeholderEng:Math.round(15+sr(i*37)*80),genderEquity:Math.round(20+sr(i*41)*75),youthEmploy:Math.round(5+sr(i*43)*70),skillsMatch:Math.round(10+sr(i*47)*80),wageRetention:Math.round(40+sr(i*53)*55),redeployRate:Math.round(15+sr(i*59)*75),duration:Math.round(2+sr(i*61)*8),status:sr(i*67)<0.4?'Active':sr(i*67)<0.7?'Planning':sr(i*67)<0.9?'Completed':'Suspended'}));})();

const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,investment:Math.round(200+i*30+sr(i*7)*100),workers:Math.round(5000+i*500+sr(i*11)*2000),jobs:Math.round(2000+i*300+sr(i*13)*1500)}));
const INDICATORS=[{name:'Worker Retraining Rate',value:62,target:80,gap:18},{name:'Job Replacement Ratio',value:0.78,target:1.0,gap:0.22},{name:'Wage Retention',value:72,target:85,gap:13},{name:'Community Investment',value:45,target:60,gap:15},{name:'Gender Equity',value:38,target:50,gap:12},{name:'Youth Employment',value:41,target:55,gap:14},{name:'Skills Matching',value:55,target:75,gap:20},{name:'Redeployment Rate',value:48,target:70,gap:22}];

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function JustTransitionFinancePage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[typeF,setTypeF]=useState('All');
  const[sortCol,setSortCol]=useState('jtScore');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{let d=[...PROJECTS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(typeF!=='All')d=d.filter(r=>r.type===typeF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,typeF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const kpis=useMemo(()=>{const totalInv=PROJECTS.reduce((s,c)=>s+c.investmentM,0);const totalWorkers=PROJECTS.reduce((s,c)=>s+c.workersRetrained,0);const totalJobs=PROJECTS.reduce((s,c)=>s+c.jobsCreated,0);const avgJt=Math.round(PROJECTS.reduce((s,c)=>s+c.jtScore,0)/PROJECTS.length);return{totalInv,totalWorkers,totalJobs,avgJt,active:PROJECTS.filter(p=>p.status==='Active').length};},[]);
  const typeDist=useMemo(()=>{const m={};PROJECTS.forEach(c=>{m[c.type]=(m[c.type]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);
  const typeInv=useMemo(()=>{const m={};PROJECTS.forEach(c=>{if(!m[c.type])m[c.type]={type:c.type,inv:0,n:0};m[c.type].inv+=c.investmentM;m[c.type].n++;});return Object.values(m).sort((a,b)=>b.inv-a.inv);},[]);
  const radarData=useMemo(()=>{const dims=['jtScore','socialImpact','economicDiv','envRemediation','stakeholderEng','genderEquity'];const avg=(k)=>Math.round(PROJECTS.reduce((s,c)=>s+c[k],0)/PROJECTS.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').trim(),value:avg(d),fullMark:100}));},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(180,83,9,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Total Investment" value={'$'+fmt(kpis.totalInv)+'M'} sub="40 projects" color={ACCENT}/><KPI label="Workers Retrained" value={fmt(kpis.totalWorkers)} sub="total" color={T.navy}/>
      <KPI label="Jobs Created" value={fmt(kpis.totalJobs)} sub="green jobs" color={T.green}/><KPI label="Avg JT Score" value={kpis.avgJt+'/100'} sub="just transition" color={T.gold}/>
      <KPI label="Active Projects" value={kpis.active} sub="in progress" color={T.sage}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Investment by Type</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={typeInv}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:8,fill:T.textMut}} angle={-25} textAnchor="end" height={70}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="inv" fill={ACCENT} radius={[4,4,0,0]} name="Investment $M"/></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Project Type Distribution</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={typeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{typeDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/><Legend wrapperStyle={{fontSize:10}}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Progress Trend</div>
        <ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="investment" stroke={ACCENT} fill="rgba(180,83,9,0.1)" name="Investment $M"/><Area type="monotone" dataKey="jobs" stroke={T.green} fill="rgba(22,163,74,0.08)" name="Jobs Created"/></AreaChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>JT Impact Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Avg" dataKey="value" stroke={ACCENT} fill="rgba(180,83,9,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
  </>);

  const renderScreen=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search projects..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={typeF} onChange={e=>{setTypeF(e.target.value);setPage(1);}}>{TYPES.map(s=><option key={s}>{s}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} projects</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'just_transition')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="name" label="Project" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="type" label="Type" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="jtScore" label="JT Score" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="investmentM" label="Invest $M" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="workersRetrained" label="Workers" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="jobsCreated" label="Jobs" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="socialImpact" label="Social" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="status" label="Status" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</td><td style={ss.td}>{r.type}</td>
        <td style={ss.td}><span style={badge(r.jtScore,[25,50,70])}>{r.jtScore}</span></td>
        <td style={{...ss.td,fontFamily:T.mono}}>${r.investmentM}M</td>
        <td style={{...ss.td,fontFamily:T.mono}}>{fmt(r.workersRetrained)}</td><td style={{...ss.td,fontFamily:T.mono}}>{fmt(r.jobsCreated)}</td>
        <td style={ss.td}><span style={badge(r.socialImpact,[25,50,70])}>{r.socialImpact}</span></td>
        <td style={ss.td}><span style={{color:r.status==='Active'?T.green:r.status==='Completed'?T.navy:r.status==='Planning'?T.amber:T.red,fontWeight:600,fontSize:11}}>{r.status}</span></td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['Economic Diversification',r.economicDiv],['Env Remediation',r.envRemediation],['Stakeholder Engagement',r.stakeholderEng],['Gender Equity',r.genderEquity+'%'],['Youth Employment',r.youthEmploy+'%'],['Skills Match',r.skillsMatch+'%'],['Wage Retention',r.wageRetention+'%'],['Redeployment Rate',r.redeployRate+'%'],['Community Fund','$'+r.communityFundM+'M'],['Duration',r.duration+' years']].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'JT Score',v:r.jtScore},{d:'Social',v:r.socialImpact},{d:'Economic',v:r.economicDiv},{d:'Environ',v:r.envRemediation},{d:'Gender',v:r.genderEquity},{d:'Skills',v:r.skillsMatch}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(180,83,9,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'JT Score',v:r.jtScore},{n:'Social',v:r.socialImpact},{n:'Econ Div',v:r.economicDiv},{n:'Env Remed',v:r.envRemediation}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="n" type="category" tick={{fontSize:9,fill:T.textSec}} width={65}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderWorker=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Worker Retraining Programs</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={PROJECTS.sort((a,b)=>b.workersRetrained-a.workersRetrained).slice(0,12)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="workersRetrained" fill={ACCENT} radius={[4,4,0,0]} name="Workers"/><Bar dataKey="jobsCreated" fill={T.green} radius={[4,4,0,0]} name="Jobs"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><LineChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="workers" stroke={ACCENT} strokeWidth={2} name="Workers Retrained"/><Line type="monotone" dataKey="jobs" stroke={T.green} strokeWidth={2} name="Jobs Created"/></LineChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Project</th><th style={ss.th('','','')}>Workers</th><th style={ss.th('','','')}>Jobs</th><th style={ss.th('','','')}>Skills Match</th><th style={ss.th('','','')}>Wage Ret.</th><th style={ss.th('','','')}>Redeploy</th></tr></thead><tbody>
      {PROJECTS.sort((a,b)=>b.workersRetrained-a.workersRetrained).slice(0,15).map(r=>(<tr key={r.id}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={{...ss.td,fontFamily:T.mono}}>{fmt(r.workersRetrained)}</td><td style={{...ss.td,fontFamily:T.mono,color:T.green}}>{fmt(r.jobsCreated)}</td><td style={ss.td}><span style={badge(r.skillsMatch,[25,50,70])}>{r.skillsMatch}%</span></td><td style={ss.td}>{r.wageRetention}%</td><td style={ss.td}>{r.redeployRate}%</td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(PROJECTS,'worker_programs')}>Export CSV</button></div>
  </div>);

  const renderIndicators=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Just Transition Indicators</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={300}><BarChart data={INDICATORS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-25} textAnchor="end" height={70}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={ACCENT} radius={[4,4,0,0]} name="Current"/><Bar dataKey="target" fill={T.border} radius={[4,4,0,0]} name="Target"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={300}><RadarChart data={INDICATORS.map(i=>({dim:i.name.split(' ').slice(0,2).join(' '),value:i.value,target:i.target}))} cx="50%" cy="50%" outerRadius={100}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Current" dataKey="value" stroke={ACCENT} fill="rgba(180,83,9,0.15)" strokeWidth={2}/><Radar name="Target" dataKey="target" stroke={T.textMut} fill="none" strokeWidth={1.5} strokeDasharray="5 5"/><Legend/></RadarChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Indicator</th><th style={ss.th('','','')}>Current</th><th style={ss.th('','','')}>Target</th><th style={ss.th('','','')}>Gap</th><th style={ss.th('','','')}>Progress</th></tr></thead><tbody>
      {INDICATORS.map((r,i)=>(<tr key={i}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={{...ss.td,fontFamily:T.mono}}>{r.value}</td><td style={{...ss.td,fontFamily:T.mono}}>{r.target}</td><td style={{...ss.td,fontFamily:T.mono,color:T.red}}>{typeof r.gap==='number'&&r.gap>1?r.gap:r.gap}</td><td style={ss.td}><div style={{background:T.border,borderRadius:4,height:12,width:100}}><div style={{background:ACCENT,borderRadius:4,height:12,width:Math.min(100,(r.value/r.target)*100)}}/></div></td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(INDICATORS,'jt_indicators')}>Export CSV</button></div>
  </div>);

  return(<div style={ss.wrap}>
    <div style={ss.header}>Just Transition Finance</div>
    <div style={ss.sub}>Worker retraining, community investment, just transition indicators across 40 projects</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderScreen()}{tab===2&&renderWorker()}{tab===3&&renderIndicators()}
  </div>);
}