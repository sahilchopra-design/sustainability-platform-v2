import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#0891b2';
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Project Screening','Grievance Tracker','Benefit Sharing'];
const TYPES=['All','Mining','Infrastructure','Energy','Agriculture','Forestry','Water','Urban Development','Transportation','Industrial'];
const REGIONS=['All','Sub-Saharan Africa','Southeast Asia','Latin America','South Asia','Central Asia','Pacific Islands','Middle East','Eastern Europe'];
const STATUSES=['All','Active','Monitoring','Remediation','Completed','Suspended'];
const PAGE_SIZE=15;
const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.green,T.red,'#8b5cf6','#be185d','#ea580c'];
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(22,163,74,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?T.green:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const statusBadge=(s)=>{const m={Active:{bg:'rgba(22,163,74,0.12)',c:T.green},Monitoring:{bg:'rgba(8,145,178,0.12)',c:ACCENT},Remediation:{bg:'rgba(217,119,6,0.12)',c:T.amber},Completed:{bg:'rgba(27,58,92,0.1)',c:T.navy},Suspended:{bg:'rgba(220,38,38,0.12)',c:T.red}};const st=m[s]||m.Active;return{background:st.bg,color:st.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

const PROJECTS=(()=>{const names=['Tarkwa Gold Mine Expansion','Mekong Delta Solar Farm','Cerrejon Coal Transition','Adani Port Mundra Phase 3','Belo Monte Community Program','Ok Tedi River Restoration','Oyu Tolgoi Resettlement','Cobre Panama Pipeline','Simandou Iron Ore Railway','Nacala Corridor Upgrade','Trans Mountain Pipeline','Dakota Access Remediation','Glencore Mutanda Closure','AngloGold Obuasi Revival','Barrick Pueblo Viejo','Newmont Ahafo South','Rio Tinto Jadar Valley','BHP Olympic Dam Expansion','Vale Brumadinho Recovery','Freeport Grasberg Legacy','Vedanta Lanjigarh Refinery','Adaro Energy Kaltim','Minas Rio Pipeline Social','Pascua Lama Border Region','Quellaveco Water Program','Kibali Gold Community','Ivanhoe Kamoa-Kakula','First Quantum Cobre Panama','South32 Worsley Bauxite','Lundin Candelaria Social','Pan American Dolores','Kinross Tasiast Expansion','Agnico Eagle Nunavut','B2Gold Fekola Mali','Centerra Kumtor Legacy','Hudbay Constancia Peru','Capstone Pinto Valley','Ero Copper Tucuma','Teck Highland Valley','Northern Dynasty Pebble','Barrick Veladero','Newmont Penasquito','Anglo Platinum Mogalakwena','Impala Platinum Rustenburg','Sibanye Gold Communities','Harmony Gold Free State','Gold Fields South Deep','DRD Gold Ergo Program','Northam Platinum Booysendal','Petra Diamonds Cullinan','ARM Coal Goedgevonden','Sasol Secunda Community','Exxaro Grootegeluk','Glencore Alloys Rustenburg','Anglo Coal Landau','South32 SA Manganese','Kumba Iron Ore Sishen','Assmang Khumani Social','Eskom Medupi Community','Transnet Saldanha Bay'];
const types=['Mining','Energy','Mining','Infrastructure','Energy','Mining','Mining','Mining','Mining','Infrastructure','Energy','Energy','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Water','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Industrial','Mining','Mining','Mining','Mining','Mining','Mining','Energy','Infrastructure'];
const regs=['Sub-Saharan Africa','Southeast Asia','Latin America','South Asia','Latin America','Pacific Islands','Central Asia','Latin America','Sub-Saharan Africa','Sub-Saharan Africa','Latin America','Latin America','Sub-Saharan Africa','Sub-Saharan Africa','Latin America','Sub-Saharan Africa','Eastern Europe','Pacific Islands','Latin America','Southeast Asia','South Asia','Southeast Asia','Latin America','Latin America','Latin America','Sub-Saharan Africa','Sub-Saharan Africa','Latin America','Pacific Islands','Latin America','Latin America','Sub-Saharan Africa','Latin America','Sub-Saharan Africa','Central Asia','Latin America','Latin America','Latin America','Latin America','Latin America','Latin America','Latin America','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa','Sub-Saharan Africa'];
return names.map((n,i)=>({id:i+1,name:n,type:types[i],region:regs[i],fpicScore:Math.round(10+sr(i*7)*85),benefitSharing:Math.round(5+sr(i*11)*90),grievanceMech:Math.round(15+sr(i*13)*80),communityScore:Math.round(10+sr(i*17)*85),stakeholderEng:Math.round(20+sr(i*19)*75),resettlement:Math.round(sr(i*23)*60),livelihoodRestore:Math.round(15+sr(i*29)*80),culturalHeritage:Math.round(10+sr(i*31)*85),waterAccess:Math.round(20+sr(i*37)*75),healthImpact:Math.round(sr(i*41)*50),educationSupport:Math.round(10+sr(i*43)*70),employment:Math.round(sr(i*47)*2000),investmentM:Math.round(1+sr(i*53)*99),grievances:Math.round(sr(i*59)*120),resolved:Math.round(sr(i*61)*100),avgResolution:Math.round(5+sr(i*67)*90),status:sr(i*71)<0.35?'Active':sr(i*71)<0.55?'Monitoring':sr(i*71)<0.75?'Remediation':sr(i*71)<0.9?'Completed':'Suspended'}));})();

const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,grievances:Math.round(40+sr(i*7)*60),resolved:Math.round(25+sr(i*11)*50),avgFpic:Math.round(35+i*0.8+sr(i*13)*8),investment:Math.round(20+i*1.2+sr(i*17)*15)}));

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function CommunityImpactPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[typeF,setTypeF]=useState('All');const[regF,setRegF]=useState('All');const[statF,setStatF]=useState('All');
  const[sortCol,setSortCol]=useState('communityScore');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{let d=[...PROJECTS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(typeF!=='All')d=d.filter(r=>r.type===typeF);if(regF!=='All')d=d.filter(r=>r.region===regF);if(statF!=='All')d=d.filter(r=>r.status===statF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,typeF,regF,statF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const kpis=useMemo(()=>{const avg=(k)=>Math.round(PROJECTS.reduce((s,c)=>s+c[k],0)/PROJECTS.length);const totalInv=PROJECTS.reduce((s,c)=>s+c.investmentM,0);const totalGriev=PROJECTS.reduce((s,c)=>s+c.grievances,0);return{avgFpic:avg('fpicScore'),avgCommunity:avg('communityScore'),totalInv,totalGriev,active:PROJECTS.filter(p=>p.status==='Active').length};},[]);
  const typeDist=useMemo(()=>{const m={};PROJECTS.forEach(c=>{m[c.type]=(m[c.type]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);
  const regionChart=useMemo(()=>{const m={};PROJECTS.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,avgFpic:0,avgBen:0,n:0};m[c.region].avgFpic+=c.fpicScore;m[c.region].avgBen+=c.benefitSharing;m[c.region].n++;});return Object.values(m).map(s=>({...s,avgFpic:Math.round(s.avgFpic/s.n),avgBen:Math.round(s.avgBen/s.n)}));},[]);
  const radarData=useMemo(()=>{const dims=['fpicScore','benefitSharing','grievanceMech','stakeholderEng','livelihoodRestore','culturalHeritage'];const avg=(k)=>Math.round(PROJECTS.reduce((s,c)=>s+c[k],0)/PROJECTS.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').trim(),value:avg(d),fullMark:100}));},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(8,145,178,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Avg FPIC Score" value={kpis.avgFpic+'/100'} sub="60 projects" color={ACCENT}/><KPI label="Community Score" value={kpis.avgCommunity+'/100'} sub="avg rating" color={T.navy}/>
      <KPI label="Total Investment" value={'$'+fmt(kpis.totalInv*1e6)} sub="community programs" color={T.gold}/><KPI label="Grievances" value={kpis.totalGriev} sub="total filed" color={T.amber}/>
      <KPI label="Active Projects" value={kpis.active} sub="currently active" color={T.green}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>FPIC & Benefit Sharing by Region</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={regionChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="region" tick={{fontSize:8,fill:T.textMut}} angle={-25} textAnchor="end" height={70}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="avgFpic" fill={ACCENT} radius={[4,4,0,0]} name="Avg FPIC"/><Bar dataKey="avgBen" fill={T.gold} radius={[4,4,0,0]} name="Avg Benefit"/></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Project Type Distribution</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={typeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{typeDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Grievance & Investment Trend</div>
        <ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="grievances" stroke={T.red} fill="rgba(220,38,38,0.08)" name="Grievances"/><Area type="monotone" dataKey="resolved" stroke={T.green} fill="rgba(22,163,74,0.08)" name="Resolved"/><Area type="monotone" dataKey="investment" stroke={ACCENT} fill="rgba(8,145,178,0.08)" name="Investment $M"/></AreaChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Community Impact Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Avg" dataKey="value" stroke={ACCENT} fill="rgba(8,145,178,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
  </>);

  const renderScreen=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search projects..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={typeF} onChange={e=>{setTypeF(e.target.value);setPage(1);}}>{TYPES.map(s=><option key={s}>{s}</option>)}</select>
      <select style={ss.select} value={regF} onChange={e=>{setRegF(e.target.value);setPage(1);}}>{REGIONS.map(s=><option key={s}>{s}</option>)}</select>
      <select style={ss.select} value={statF} onChange={e=>{setStatF(e.target.value);setPage(1);}}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} projects</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'community_impact')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="name" label="Project" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="type" label="Type" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="fpicScore" label="FPIC" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="benefitSharing" label="Benefit" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="communityScore" label="Community" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="grievances" label="Grievances" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="investmentM" label="Invest $M" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="status" label="Status" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</td><td style={ss.td}>{r.type}</td>
        <td style={ss.td}><span style={badge(r.fpicScore,[25,50,70])}>{r.fpicScore}</span></td>
        <td style={ss.td}><span style={badge(r.benefitSharing,[25,50,70])}>{r.benefitSharing}</span></td>
        <td style={ss.td}><span style={badge(r.communityScore,[25,50,70])}>{r.communityScore}</span></td>
        <td style={{...ss.td,fontFamily:T.mono}}>{r.grievances}</td><td style={{...ss.td,fontFamily:T.mono}}>${r.investmentM}M</td>
        <td style={ss.td}><span style={statusBadge(r.status)}>{r.status}</span></td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['Stakeholder Engagement',r.stakeholderEng],['Resettlement Impact',r.resettlement],['Livelihood Restoration',r.livelihoodRestore+'%'],['Cultural Heritage',r.culturalHeritage],['Water Access',r.waterAccess],['Health Impact',r.healthImpact],['Education Support',r.educationSupport+'%'],['Local Employment',r.employment],['Resolved Grievances',r.resolved],['Avg Resolution (days)',r.avgResolution]].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'FPIC',v:r.fpicScore},{d:'Benefit',v:r.benefitSharing},{d:'Grievance',v:r.grievanceMech},{d:'Stakeholder',v:r.stakeholderEng},{d:'Livelihood',v:r.livelihoodRestore},{d:'Heritage',v:r.culturalHeritage}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(8,145,178,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'FPIC',v:r.fpicScore},{n:'Benefit',v:r.benefitSharing},{n:'Community',v:r.communityScore},{n:'Water',v:r.waterAccess},{n:'Education',v:r.educationSupport}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="n" type="category" tick={{fontSize:9,fill:T.textSec}} width={65}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderGrievance=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Grievance Mechanism Tracker</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><LineChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="grievances" stroke={T.red} strokeWidth={2} name="Filed"/><Line type="monotone" dataKey="resolved" stroke={T.green} strokeWidth={2} name="Resolved"/></LineChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><BarChart data={PROJECTS.sort((a,b)=>b.grievances-a.grievances).slice(0,12)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="grievances" fill={T.red} radius={[4,4,0,0]} name="Grievances"/><Bar dataKey="resolved" fill={T.green} radius={[4,4,0,0]} name="Resolved"/></BarChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Project</th><th style={ss.th('','','')}>Grievances</th><th style={ss.th('','','')}>Resolved</th><th style={ss.th('','','')}>Rate %</th><th style={ss.th('','','')}>Avg Days</th><th style={ss.th('','','')}>Mechanism</th></tr></thead><tbody>
      {PROJECTS.sort((a,b)=>b.grievances-a.grievances).slice(0,20).map(r=>(<tr key={r.id}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={{...ss.td,fontFamily:T.mono,color:T.red}}>{r.grievances}</td><td style={{...ss.td,fontFamily:T.mono,color:T.green}}>{r.resolved}</td><td style={ss.td}><span style={badge(r.grievances>0?Math.round(r.resolved/r.grievances*100):0,[25,50,75])}>{r.grievances>0?Math.round(r.resolved/r.grievances*100):0}%</span></td><td style={{...ss.td,fontFamily:T.mono}}>{r.avgResolution}</td><td style={ss.td}><span style={badge(r.grievanceMech,[25,50,70])}>{r.grievanceMech}</span></td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(PROJECTS,'grievance_tracker')}>Export CSV</button></div>
  </div>);

  const renderBenefit=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Benefit Sharing Analysis</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={PROJECTS.sort((a,b)=>b.benefitSharing-a.benefitSharing).slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="benefitSharing" fill={ACCENT} radius={[4,4,0,0]} name="Benefit Score"/><Bar dataKey="investmentM" fill={T.gold} radius={[4,4,0,0]} name="Investment $M"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="avgFpic" stroke={ACCENT} fill="rgba(8,145,178,0.1)" name="Avg FPIC"/><Area type="monotone" dataKey="investment" stroke={T.gold} fill="rgba(197,169,106,0.1)" name="Investment $M"/></AreaChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Project</th><th style={ss.th('','','')}>Benefit Score</th><th style={ss.th('','','')}>Investment</th><th style={ss.th('','','')}>Employment</th><th style={ss.th('','','')}>Education</th><th style={ss.th('','','')}>Health</th></tr></thead><tbody>
      {PROJECTS.sort((a,b)=>b.benefitSharing-a.benefitSharing).slice(0,20).map(r=>(<tr key={r.id}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={ss.td}><span style={badge(r.benefitSharing,[25,50,70])}>{r.benefitSharing}</span></td><td style={{...ss.td,fontFamily:T.mono}}>${r.investmentM}M</td><td style={{...ss.td,fontFamily:T.mono}}>{fmt(r.employment)}</td><td style={ss.td}>{r.educationSupport}%</td><td style={ss.td}>{r.healthImpact}</td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(PROJECTS,'benefit_sharing')}>Export CSV</button></div>
  </div>);

  return(<div style={ss.wrap}>
    <div style={ss.header}>Community Impact Assessment</div>
    <div style={ss.sub}>FPIC compliance, benefit sharing analytics, grievance mechanism tracking across 60 projects</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderScreen()}{tab===2&&renderGrievance()}{tab===3&&renderBenefit()}
  </div>);
}