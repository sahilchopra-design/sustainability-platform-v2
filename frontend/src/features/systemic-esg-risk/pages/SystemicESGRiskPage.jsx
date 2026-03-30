import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#991b1b';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(2):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Risk Indicators','Contagion Model','Tipping Points'];
const CATEGORIES=['All','Climate','Social','Governance','Financial','Geopolitical','Environmental','Technological'];
const PAGE_SIZE=15;const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.green,'#8b5cf6','#0891b2','#be185d','#ea580c'];
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(220,38,38,0.12)':v>=mid?'rgba(217,119,6,0.12)':v>=lo?'rgba(197,169,106,0.12)':'rgba(22,163,74,0.12)';const c=v>=hi?T.red:v>=mid?T.amber:v>=lo?T.gold:T.green;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};

const INDICATORS=(()=>{const names=['Climate VaR Index','Social Inequality Stress','Governance Failure Index','Green Swan Probability','Stranded Asset Cascade','Water Scarcity Systemic','Biodiversity Collapse Risk','Pandemic Preparedness','Cyber-Physical Nexus','Supply Chain Fragility','Energy Transition Shock','Carbon Border Disruption','Sovereign Climate Default','Social License Revocation','Regulatory Whiplash Risk','Greenwashing Contagion','Just Transition Failure','Nature-Finance Nexus','Climate Litigation Wave','ESG Rating Divergence','Geopolitical ESG Risk','Tech-Ethics Spillover','Workforce Displacement','Infrastructure Stranding','Food System Collapse','Ocean Economy Stress','Deforestation Cascade','Methane Bomb Risk','Tipping Point Proximity','Permafrost Feedback','Arctic Ice Collapse','Amazon Dieback Risk','AMOC Slowdown','Coral Reef Collapse','Monsoon Disruption','Thermohaline Shift','Boreal Forest Loss','Savanna Transition','Antarctic Ice Sheet','Greenland Melt Rate'];
const cats=['Climate','Social','Governance','Financial','Financial','Environmental','Environmental','Social','Technological','Financial','Climate','Climate','Financial','Social','Governance','Governance','Social','Environmental','Governance','Financial','Geopolitical','Technological','Social','Climate','Environmental','Environmental','Environmental','Climate','Climate','Climate','Climate','Environmental','Climate','Environmental','Climate','Climate','Environmental','Environmental','Climate','Climate'];
return names.map((n,i)=>({id:i+1,name:n,category:cats[i],severity:Math.round(15+sr(i*7)*80),probability:Math.round(5+sr(i*11)*90),velocity:Math.round(10+sr(i*13)*85),interconnection:Math.round(20+sr(i*17)*75),systemicScore:Math.round(10+sr(i*19)*85),contagionRisk:Math.round(5+sr(i*23)*90),timeHorizon:sr(i*29)<0.3?'Near-term':sr(i*29)<0.6?'Medium-term':'Long-term',trendDir:sr(i*31)<0.3?'Accelerating':sr(i*31)<0.6?'Stable':'Decelerating',financialImpact:Math.round(1+sr(i*37)*99),mitigationReady:Math.round(5+sr(i*41)*80),monitorFreq:sr(i*43)<0.4?'Daily':sr(i*43)<0.7?'Weekly':'Monthly',lastUpdate:`2026-03-${String(Math.floor(1+sr(i*47)*28)).padStart(2,'0')}`}));})();

const CONTAGION=[{source:'Climate VaR',target:'Stranded Assets',strength:85},{source:'Climate VaR',target:'Sovereign Default',strength:72},{source:'Stranded Assets',target:'Financial System',strength:78},{source:'Social Inequality',target:'Just Transition',strength:68},{source:'Biodiversity Loss',target:'Food Systems',strength:74},{source:'Supply Chain',target:'Energy Transition',strength:65},{source:'Governance Fail',target:'Greenwashing',strength:71},{source:'Water Scarcity',target:'Agriculture',strength:82},{source:'Cyber Risk',target:'Infrastructure',strength:69},{source:'Deforestation',target:'Climate VaR',strength:76},{source:'Methane Bomb',target:'Tipping Points',strength:88},{source:'Arctic Ice',target:'Sea Level',strength:91},{source:'AMOC Slowdown',target:'Monsoon',strength:79},{source:'Permafrost',target:'Methane Bomb',strength:84},{source:'Coral Collapse',target:'Ocean Economy',strength:73}];

const TREND=Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,systemicIdx:Math.round(35+i*0.5+sr(i*7)*15),contagion:Math.round(25+i*0.4+sr(i*11)*12),tippingProx:Math.round(20+i*0.6+sr(i*13)*10),alerts:Math.round(2+sr(i*17)*8)}));

const TIPPING_POINTS=[{name:'AMOC Collapse',threshold:'4C warming',proximity:42,impact:'Catastrophic',reversible:false},{name:'Amazon Dieback',threshold:'3-4C / 40% loss',proximity:58,impact:'Severe',reversible:false},{name:'Arctic Summer Ice',threshold:'1.5C warming',proximity:75,impact:'High',reversible:true},{name:'Greenland Ice Sheet',threshold:'1.5-2C warming',proximity:55,impact:'Catastrophic',reversible:false},{name:'West Antarctic',threshold:'1.5-2C warming',proximity:48,impact:'Catastrophic',reversible:false},{name:'Coral Reef Die-off',threshold:'1.5C warming',proximity:82,impact:'Severe',reversible:false},{name:'Permafrost Thaw',threshold:'1.5-2C warming',proximity:65,impact:'High',reversible:false},{name:'Boreal Forest Shift',threshold:'3-5C warming',proximity:35,impact:'High',reversible:false},{name:'Monsoon Disruption',threshold:'2-3C warming',proximity:38,impact:'Severe',reversible:true},{name:'Sahel Greening/Drying',threshold:'2C warming',proximity:45,impact:'Moderate',reversible:true}];

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function SystemicEsgRiskPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[catF,setCatF]=useState('All');
  const[sortCol,setSortCol]=useState('systemicScore');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{let d=[...INDICATORS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(catF!=='All')d=d.filter(r=>r.category===catF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,catF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const kpis=useMemo(()=>{const avg=(k)=>Math.round(INDICATORS.reduce((s,c)=>s+c[k],0)/INDICATORS.length);const critical=INDICATORS.filter(c=>c.systemicScore>70).length;const accelerating=INDICATORS.filter(c=>c.trendDir==='Accelerating').length;return{avgSystemic:avg('systemicScore'),avgContagion:avg('contagionRisk'),critical,accelerating,tippingNear:TIPPING_POINTS.filter(t=>t.proximity>60).length};},[]);
  const catChart=useMemo(()=>{const m={};INDICATORS.forEach(c=>{if(!m[c.category])m[c.category]={category:c.category,avg:0,n:0};m[c.category].avg+=c.systemicScore;m[c.category].n++;});return Object.values(m).map(s=>({...s,avg:Math.round(s.avg/s.n)}));},[]);
  const catDist=useMemo(()=>{const m={};INDICATORS.forEach(c=>{m[c.category]=(m[c.category]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);
  const radarData=useMemo(()=>{const dims=['severity','probability','velocity','interconnection','contagionRisk','financialImpact'];const avg=(k)=>Math.round(INDICATORS.reduce((s,c)=>s+c[k],0)/INDICATORS.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').trim(),value:avg(d),fullMark:100}));},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(153,27,27,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Systemic Index" value={kpis.avgSystemic+'/100'} sub="40 indicators" color={ACCENT}/><KPI label="Contagion Risk" value={kpis.avgContagion+'/100'} sub="avg score" color={T.red}/>
      <KPI label="Critical Risks" value={kpis.critical} sub="score >70" color={T.amber}/><KPI label="Accelerating" value={kpis.accelerating} sub="worsening trend" color={T.red}/>
      <KPI label="Tipping Proximate" value={kpis.tippingNear} sub="proximity >60%" color={ACCENT}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Systemic Risk by Category</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={catChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="category" tick={{fontSize:9,fill:T.textMut}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/><Tooltip {...tip}/><Bar dataKey="avg" fill={ACCENT} radius={[4,4,0,0]} name="Avg Systemic Score"/></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Risk Category Distribution</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={catDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>{catDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Systemic Risk Trend</div>
        <ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="systemicIdx" stroke={ACCENT} fill="rgba(153,27,27,0.1)" name="Systemic Index"/><Area type="monotone" dataKey="contagion" stroke={T.red} fill="rgba(220,38,38,0.06)" name="Contagion"/><Area type="monotone" dataKey="tippingProx" stroke={T.amber} fill="rgba(217,119,6,0.06)" name="Tipping Proximity"/></AreaChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Risk Dimension Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Avg" dataKey="value" stroke={ACCENT} fill="rgba(153,27,27,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
  </>);

  const renderIndicators=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search indicators..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={catF} onChange={e=>{setCatF(e.target.value);setPage(1);}}>{CATEGORIES.map(s=><option key={s}>{s}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} indicators</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'systemic_risk')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="name" label="Indicator" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="category" label="Category" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="systemicScore" label="Systemic" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="severity" label="Severity" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="probability" label="Probability" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="contagionRisk" label="Contagion" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="velocity" label="Velocity" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="trendDir" label="Trend" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</td><td style={ss.td}>{r.category}</td>
        <td style={ss.td}><span style={badge(r.systemicScore,[30,50,70])}>{r.systemicScore}</span></td>
        <td style={ss.td}><span style={badge(r.severity,[30,50,70])}>{r.severity}</span></td>
        <td style={ss.td}>{r.probability}%</td>
        <td style={ss.td}><span style={badge(r.contagionRisk,[30,50,70])}>{r.contagionRisk}</span></td>
        <td style={ss.td}>{r.velocity}</td>
        <td style={ss.td}><span style={{color:r.trendDir==='Accelerating'?T.red:r.trendDir==='Stable'?T.amber:T.green,fontWeight:600,fontSize:11}}>{r.trendDir}</span></td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['Interconnection',r.interconnection],['Time Horizon',r.timeHorizon],['Financial Impact',r.financialImpact+'%'],['Mitigation Ready',r.mitigationReady+'%'],['Monitor Freq.',r.monitorFreq],['Last Update',r.lastUpdate]].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'Severity',v:r.severity},{d:'Probability',v:r.probability},{d:'Velocity',v:r.velocity},{d:'Interconn.',v:r.interconnection},{d:'Contagion',v:r.contagionRisk},{d:'Fin. Impact',v:r.financialImpact}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(153,27,27,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'Systemic',v:r.systemicScore},{n:'Severity',v:r.severity},{n:'Contagion',v:r.contagionRisk},{n:'Velocity',v:r.velocity},{n:'Mitigation',v:r.mitigationReady}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="n" type="category" tick={{fontSize:9,fill:T.textSec}} width={65}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderContagion=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Contagion Network Model</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={300}><BarChart data={CONTAGION.sort((a,b)=>b.strength-a.strength)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="source" tick={{fontSize:8,fill:T.textMut}} angle={-30} textAnchor="end" height={70}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="strength" fill={ACCENT} radius={[4,4,0,0]} name="Link Strength"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={300}><LineChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="contagion" stroke={ACCENT} strokeWidth={2} name="Contagion Index"/><Line type="monotone" dataKey="alerts" stroke={T.red} strokeWidth={2} name="Alert Count"/></LineChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Source</th><th style={ss.th('','','')}>Target</th><th style={ss.th('','','')}>Strength</th><th style={ss.th('','','')}>Visual</th></tr></thead><tbody>
      {CONTAGION.sort((a,b)=>b.strength-a.strength).map((r,i)=>(<tr key={i}><td style={{...ss.td,fontWeight:600}}>{r.source}</td><td style={ss.td}>{r.target}</td><td style={ss.td}><span style={badge(r.strength,[40,60,80])}>{r.strength}</span></td><td style={ss.td}><div style={{background:T.border,borderRadius:4,height:12,width:100}}><div style={{background:ACCENT,borderRadius:4,height:12,width:r.strength}}/></div></td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(CONTAGION,'contagion_model')}>Export CSV</button></div>
  </div>);

  const renderTipping=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Climate Tipping Points</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={300}><BarChart data={TIPPING_POINTS.sort((a,b)=>b.proximity-a.proximity)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-30} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/><Tooltip {...tip}/><Bar dataKey="proximity" fill={ACCENT} radius={[4,4,0,0]} name="Proximity %">{TIPPING_POINTS.map((t,i)=><Cell key={i} fill={t.proximity>60?T.red:t.proximity>40?T.amber:T.green}/>)}</Bar></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={300}><RadarChart data={TIPPING_POINTS.slice(0,8).map(t=>({dim:t.name.split(' ').slice(0,2).join(' '),value:t.proximity}))} cx="50%" cy="50%" outerRadius={100}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Proximity" dataKey="value" stroke={ACCENT} fill="rgba(153,27,27,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Tipping Point</th><th style={ss.th('','','')}>Threshold</th><th style={ss.th('','','')}>Proximity</th><th style={ss.th('','','')}>Impact</th><th style={ss.th('','','')}>Reversible</th></tr></thead><tbody>
      {TIPPING_POINTS.sort((a,b)=>b.proximity-a.proximity).map((r,i)=>(<tr key={i}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={ss.td}>{r.threshold}</td><td style={ss.td}><span style={badge(r.proximity,[30,50,70])}>{r.proximity}%</span></td><td style={ss.td}><span style={{color:r.impact==='Catastrophic'?T.red:r.impact==='Severe'?T.amber:T.gold,fontWeight:600,fontSize:11}}>{r.impact}</span></td><td style={ss.td}><span style={{color:r.reversible?T.green:T.red,fontWeight:600,fontSize:11}}>{r.reversible?'Yes':'No'}</span></td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(TIPPING_POINTS,'tipping_points')}>Export CSV</button></div>
  </div>);

  return(<div style={ss.wrap}>
    <div style={ss.header}>Systemic ESG Risk Intelligence</div>
    <div style={ss.sub}>Systemic risk indicators, contagion modelling, tipping point proximity tracking</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderIndicators()}{tab===2&&renderContagion()}{tab===3&&renderTipping()}
  </div>);
}