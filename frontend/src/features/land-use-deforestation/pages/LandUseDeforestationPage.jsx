import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#15803d';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Country Screening','EUDR Tracker','Commodity Traceability'];
const REGIONS=['All','Amazon Basin','Congo Basin','Southeast Asia','Central America','West Africa','East Africa','South Asia','Oceania'];
const RISK=['All','Critical','High','Elevated','Moderate','Low'];
const PAGE_SIZE=15;const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.red,'#8b5cf6','#0891b2','#be185d','#ea580c'];
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v<=lo?'rgba(22,163,74,0.12)':v<=mid?'rgba(197,169,106,0.12)':v<=hi?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v<=lo?T.green:v<=mid?T.gold:v<=hi?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const riskBadge=(r)=>{const m={Critical:{bg:'rgba(220,38,38,0.12)',c:T.red},High:{bg:'rgba(217,119,6,0.12)',c:T.amber},Elevated:{bg:'rgba(197,169,106,0.15)',c:T.gold},Moderate:{bg:'rgba(22,163,74,0.12)',c:T.green},Low:{bg:'rgba(22,163,74,0.08)',c:'#15803d'}};const s=m[r]||m.Moderate;return{background:s.bg,color:s.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

const COUNTRIES=(()=>{const names=['Brazil','Indonesia','DRC','Colombia','Bolivia','Peru','Malaysia','Myanmar','Cambodia','Laos','Guatemala','Honduras','Nicaragua','Cameroon','Ghana','Ivory Coast','Nigeria','Liberia','Sierra Leone','Madagascar','Mozambique','Tanzania','Papua New Guinea','Vietnam','Thailand','Philippines','Ecuador','Paraguay','Argentina','Guyana'];
const regs=['Amazon Basin','Southeast Asia','Congo Basin','Amazon Basin','Amazon Basin','Amazon Basin','Southeast Asia','Southeast Asia','Southeast Asia','Southeast Asia','Central America','Central America','Central America','West Africa','West Africa','West Africa','West Africa','West Africa','West Africa','East Africa','East Africa','East Africa','Oceania','Southeast Asia','Southeast Asia','Southeast Asia','Amazon Basin','Amazon Basin','Amazon Basin','Amazon Basin'];
return names.map((n,i)=>({id:i+1,country:n,region:regs[i],deforestationKha:Math.round(10+sr(i*7)*990),alertsMonth:Math.round(50+sr(i*11)*4950),forestCover:Math.round(20+sr(i*13)*70),treeGain:Math.round(sr(i*17)*200),primaryForestLoss:Math.round(5+sr(i*19)*495),fireAlerts:Math.round(10+sr(i*23)*2990),eudrRisk:Math.round(10+sr(i*29)*85),commodityExposure:Math.round(15+sr(i*31)*80),traceability:Math.round(5+sr(i*37)*85),governance:Math.round(10+sr(i*41)*75),enforcement:Math.round(5+sr(i*43)*80),protectedArea:Math.round(5+sr(i*47)*35),indigenousLand:Math.round(sr(i*53)*40),carbonStock:Math.round(50+sr(i*59)*200),soybExposure:Math.round(sr(i*61)*80),palmExposure:Math.round(sr(i*67)*90),cattleExposure:Math.round(sr(i*71)*85),cocaExposure:Math.round(sr(i*73)*70),riskRating:sr(i*7)<0.2?'Critical':sr(i*7)<0.4?'High':sr(i*7)<0.65?'Elevated':sr(i*7)<0.85?'Moderate':'Low'}));})();

const COMMODITIES=[{name:'Palm Oil',deforest:28,volume:78,traceability:45,eudrScope:true},{name:'Soy',deforest:22,volume:130,traceability:52,eudrScope:true},{name:'Cattle/Beef',deforest:35,volume:95,traceability:28,eudrScope:true},{name:'Cocoa',deforest:8,volume:5.5,traceability:38,eudrScope:true},{name:'Coffee',deforest:4,volume:10,traceability:55,eudrScope:true},{name:'Rubber',deforest:6,volume:14,traceability:32,eudrScope:true},{name:'Timber/Wood',deforest:12,volume:45,traceability:48,eudrScope:true},{name:'Maize',deforest:5,volume:120,traceability:40,eudrScope:false},{name:'Rice',deforest:3,volume:52,traceability:35,eudrScope:false},{name:'Sugarcane',deforest:4,volume:190,traceability:42,eudrScope:false}];
const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,alerts:Math.round(5000+sr(i*7)*15000),deforest:Math.round(100+sr(i*11)*400),fires:Math.round(2000+sr(i*13)*8000)}));

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function LandUseDeforestationPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[regF,setRegF]=useState('All');const[riskF,setRiskF]=useState('All');
  const[sortCol,setSortCol]=useState('deforestationKha');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{let d=[...COUNTRIES];if(search)d=d.filter(r=>r.country.toLowerCase().includes(search.toLowerCase()));if(regF!=='All')d=d.filter(r=>r.region===regF);if(riskF!=='All')d=d.filter(r=>r.riskRating===riskF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,regF,riskF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const kpis=useMemo(()=>{const totalDeforest=COUNTRIES.reduce((s,c)=>s+c.deforestationKha,0);const totalAlerts=COUNTRIES.reduce((s,c)=>s+c.alertsMonth,0);const avgTrace=Math.round(COUNTRIES.reduce((s,c)=>s+c.traceability,0)/COUNTRIES.length);const critical=COUNTRIES.filter(c=>c.riskRating==='Critical'||c.riskRating==='High').length;return{totalDeforest,totalAlerts,avgTrace,critical,countries:COUNTRIES.length};},[]);
  const regionChart=useMemo(()=>{const m={};COUNTRIES.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,deforest:0,n:0};m[c.region].deforest+=c.deforestationKha;m[c.region].n++;});return Object.values(m).sort((a,b)=>b.deforest-a.deforest);},[]);
  const riskDist=useMemo(()=>{const m={};COUNTRIES.forEach(c=>{m[c.riskRating]=(m[c.riskRating]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);
  const radarData=useMemo(()=>{const dims=['eudrRisk','traceability','governance','enforcement','protectedArea','commodityExposure'];const avg=(k)=>Math.round(COUNTRIES.reduce((s,c)=>s+c[k],0)/COUNTRIES.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').trim(),value:avg(d),fullMark:100}));},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(21,128,61,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Total Deforestation" value={fmt(kpis.totalDeforest)+'kha'} sub="30 countries" color={T.red}/><KPI label="Monthly Alerts" value={fmt(kpis.totalAlerts)} sub="deforestation alerts" color={T.amber}/>
      <KPI label="Avg Traceability" value={kpis.avgTrace+'%'} sub="commodity chains" color={ACCENT}/><KPI label="High Risk" value={kpis.critical} sub="countries" color={T.red}/>
      <KPI label="Countries Tracked" value={kpis.countries} sub="monitoring" color={T.navy}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Deforestation by Region (kha)</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={regionChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="region" tick={{fontSize:9,fill:T.textMut}} angle={-20} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="deforest" fill={T.red} radius={[4,4,0,0]} name="Deforestation kha"/></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Risk Distribution</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{riskDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Alert Trend</div>
        <ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="alerts" stroke={T.red} fill="rgba(220,38,38,0.08)" name="Alerts"/><Area type="monotone" dataKey="fires" stroke={T.amber} fill="rgba(217,119,6,0.06)" name="Fire Alerts"/></AreaChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Governance Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Avg" dataKey="value" stroke={ACCENT} fill="rgba(21,128,61,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
  </>);

  const renderScreen=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search countries..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={regF} onChange={e=>{setRegF(e.target.value);setPage(1);}}>{REGIONS.map(s=><option key={s}>{s}</option>)}</select>
      <select style={ss.select} value={riskF} onChange={e=>{setRiskF(e.target.value);setPage(1);}}>{RISK.map(s=><option key={s}>{s}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} countries</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'deforestation')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="country" label="Country" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="region" label="Region" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="deforestationKha" label="Deforest kha" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="alertsMonth" label="Alerts/Mo" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="forestCover" label="Cover %" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="eudrRisk" label="EUDR Risk" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="traceability" label="Trace %" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="riskRating" label="Rating" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600}}>{r.country}</td><td style={ss.td}>{r.region}</td>
        <td style={{...ss.td,fontFamily:T.mono,color:T.red}}>{fmt(r.deforestationKha)}</td>
        <td style={{...ss.td,fontFamily:T.mono}}>{fmt(r.alertsMonth)}</td><td style={ss.td}>{r.forestCover}%</td>
        <td style={ss.td}><span style={badge(100-r.eudrRisk,[30,55,75])}>{r.eudrRisk}</span></td>
        <td style={ss.td}><span style={badge(r.traceability,[25,50,70])}>{r.traceability}%</span></td>
        <td style={ss.td}><span style={riskBadge(r.riskRating)}>{r.riskRating}</span></td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['Primary Forest Loss',fmt(r.primaryForestLoss)+' kha'],['Fire Alerts',fmt(r.fireAlerts)],['Governance',r.governance],['Enforcement',r.enforcement],['Protected Area',r.protectedArea+'%'],['Indigenous Land',r.indigenousLand+'%'],['Carbon Stock',r.carbonStock+' tC/ha'],['Soy Exposure',r.soybExposure+'%'],['Palm Exposure',r.palmExposure+'%'],['Cattle Exposure',r.cattleExposure+'%'],['Cocoa Exposure',r.cocaExposure+'%']].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'EUDR',v:r.eudrRisk},{d:'Trace',v:r.traceability},{d:'Govern',v:r.governance},{d:'Enforce',v:r.enforcement},{d:'Protected',v:r.protectedArea*2.5},{d:'Carbon',v:Math.min(100,r.carbonStock/2.5)}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(21,128,61,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'Soy',v:r.soybExposure},{n:'Palm',v:r.palmExposure},{n:'Cattle',v:r.cattleExposure},{n:'Cocoa',v:r.cocaExposure}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="n" type="category" tick={{fontSize:9,fill:T.textSec}} width={50}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]} name="Exposure %"/></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderEudr=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>EUDR Compliance Tracker</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={COUNTRIES.sort((a,b)=>b.eudrRisk-a.eudrRisk).slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="country" tick={{fontSize:8,fill:T.textMut}} angle={-30} textAnchor="end" height={70}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="eudrRisk" fill={T.red} radius={[4,4,0,0]} name="EUDR Risk"/><Bar dataKey="traceability" fill={ACCENT} radius={[4,4,0,0]} name="Traceability %"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={COMMODITIES.filter(c=>c.eudrScope)} dataKey="deforest" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({name,deforest})=>`${name}: ${deforest}%`} labelLine fontSize={9}>{COMMODITIES.filter(c=>c.eudrScope).map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Country</th><th style={ss.th('','','')}>EUDR Risk</th><th style={ss.th('','','')}>Traceability</th><th style={ss.th('','','')}>Governance</th><th style={ss.th('','','')}>Commodity Exp.</th></tr></thead><tbody>
      {COUNTRIES.sort((a,b)=>b.eudrRisk-a.eudrRisk).slice(0,15).map(r=>(<tr key={r.id}><td style={{...ss.td,fontWeight:600}}>{r.country}</td><td style={ss.td}><span style={badge(100-r.eudrRisk,[25,55,75])}>{r.eudrRisk}</span></td><td style={ss.td}>{r.traceability}%</td><td style={ss.td}>{r.governance}</td><td style={ss.td}>{r.commodityExposure}%</td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(COUNTRIES,'eudr_tracker')}>Export CSV</button></div>
  </div>);

  const renderCommod=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Commodity Traceability</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={COMMODITIES}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="deforest" fill={T.red} radius={[4,4,0,0]} name="Deforest Contribution %"/><Bar dataKey="traceability" fill={ACCENT} radius={[4,4,0,0]} name="Traceability %"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><LineChart data={COMMODITIES}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="volume" stroke={T.navy} strokeWidth={2} name="Volume (Mt)"/></LineChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Commodity</th><th style={ss.th('','','')}>Deforest %</th><th style={ss.th('','','')}>Volume (Mt)</th><th style={ss.th('','','')}>Traceability</th><th style={ss.th('','','')}>EUDR Scope</th></tr></thead><tbody>
      {COMMODITIES.map((r,i)=>(<tr key={i}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={{...ss.td,fontFamily:T.mono,color:T.red}}>{r.deforest}%</td><td style={{...ss.td,fontFamily:T.mono}}>{r.volume}</td><td style={ss.td}><span style={badge(r.traceability,[20,40,60])}>{r.traceability}%</span></td><td style={ss.td}><span style={{color:r.eudrScope?T.green:T.textMut,fontWeight:600,fontSize:11}}>{r.eudrScope?'Yes':'No'}</span></td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(COMMODITIES,'commodities')}>Export CSV</button></div>
  </div>);

  return(<div style={ss.wrap}>
    <div style={ss.header}>Land Use & Deforestation Intelligence</div>
    <div style={ss.sub}>Deforestation alerts, EUDR compliance, commodity traceability across 30 countries</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderScreen()}{tab===2&&renderEudr()}{tab===3&&renderCommod()}
  </div>);
}