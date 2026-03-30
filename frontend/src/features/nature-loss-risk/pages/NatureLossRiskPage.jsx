import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#059669';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Company Screening','TNFD LEAP','Biodiversity Footprint'];
const SECTORS=['All','Mining','Agriculture','Energy','Consumer','Pharma','Construction','Forestry','Fisheries','Chemicals','Utilities'];
const PAGE_SIZE=15;const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.red,'#8b5cf6','#0891b2','#be185d','#ea580c'];
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(22,163,74,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?T.green:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};

const COMPANIES=(()=>{const names=['Nestle SA','Unilever plc','Cargill Inc','Archer Daniels','Bunge Ltd','Louis Dreyfus','Wilmar Intl','Sime Darby','Golden Agri','IOI Corp','BHP Group','Rio Tinto','Glencore plc','Anglo American','Vale SA','Newmont Corp','Barrick Gold','Freeport McMoRan','Mosaic Co','Nutrien Ltd','Shell plc','BP plc','TotalEnergies','Exxon Mobil','Chevron Corp','BASF SE','Bayer AG','Syngenta AG','Corteva Inc','CF Industries','Stora Enso','UPM-Kymmene','Mondi plc','International Paper','Suzano SA','Holcim Ltd','CRH plc','Saint-Gobain','LafargeHolcim','Cemex SAB','Thai Union','Mowi ASA','Marine Harvest','Maruha Nichiro','Nippon Suisan','Merck KGaA','Novartis AG','Roche Holding','GSK plc','AstraZeneca'];
const secs=['Consumer','Consumer','Agriculture','Agriculture','Agriculture','Agriculture','Agriculture','Agriculture','Agriculture','Agriculture','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Chemicals','Chemicals','Energy','Energy','Energy','Energy','Energy','Chemicals','Pharma','Agriculture','Agriculture','Chemicals','Forestry','Forestry','Forestry','Forestry','Forestry','Construction','Construction','Construction','Construction','Construction','Fisheries','Fisheries','Fisheries','Fisheries','Fisheries','Pharma','Pharma','Pharma','Pharma','Pharma'];
return names.map((n,i)=>({id:i+1,name:n,sector:secs[i],natureDep:Math.round(10+sr(i*7)*85),natureImpact:Math.round(5+sr(i*11)*90),biodivFootprint:Math.round(sr(i*13)*100),tnfdReadiness:Math.round(5+sr(i*17)*85),leapScore:Math.round(10+sr(i*19)*80),waterDep:Math.round(sr(i*23)*85),soilDep:Math.round(sr(i*29)*75),pollinatorDep:Math.round(sr(i*31)*60),carbonSeq:Math.round(sr(i*37)*70),landUse:Math.round(5+sr(i*41)*80),speciesRisk:Math.round(sr(i*43)*50),deforestLink:Math.round(sr(i*47)*65),supplyChainNature:Math.round(10+sr(i*53)*80),sbtNature:sr(i*59)>0.6?'Committed':sr(i*59)>0.3?'Exploring':'None',naturePlan:sr(i*61)>0.5?'Published':'In Development',msa:+(sr(i*67)*0.8+0.1).toFixed(3)}));})();

const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgDep:Math.round(40+sr(i*7)*15),avgImpact:Math.round(35+sr(i*11)*18),tnfdAdoption:Math.round(10+i*2+sr(i*13)*5)}));
const BIO_DRIVERS=[{driver:'Land Use Change',impact:30},{driver:'Resource Exploitation',impact:23},{driver:'Climate Change',impact:19},{driver:'Pollution',impact:17},{driver:'Invasive Species',impact:11}];

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function NatureLossRiskPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[secF,setSecF]=useState('All');
  const[sortCol,setSortCol]=useState('natureDep');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(secF!=='All')d=d.filter(r=>r.sector===secF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,secF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const kpis=useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return{avgDep:avg('natureDep'),avgImpact:avg('natureImpact'),avgTnfd:avg('tnfdReadiness'),committed:COMPANIES.filter(c=>c.sbtNature==='Committed').length,avgMsa:+(COMPANIES.reduce((s,c)=>s+c.msa,0)/COMPANIES.length).toFixed(3)};},[]);
  const sectorChart=useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,avgDep:0,avgImp:0,n:0};m[c.sector].avgDep+=c.natureDep;m[c.sector].avgImp+=c.natureImpact;m[c.sector].n++;});return Object.values(m).map(s=>({...s,avgDep:Math.round(s.avgDep/s.n),avgImp:Math.round(s.avgImp/s.n)}));},[]);
  const radarData=useMemo(()=>{const dims=['natureDep','natureImpact','tnfdReadiness','leapScore','waterDep','supplyChainNature'];const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').trim(),value:avg(d),fullMark:100}));},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(5,150,105,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Avg Nature Dep." value={kpis.avgDep+'/100'} sub="50 companies" color={ACCENT}/><KPI label="Avg Nature Impact" value={kpis.avgImpact+'/100'} sub="biodiversity" color={T.red}/>
      <KPI label="TNFD Readiness" value={kpis.avgTnfd+'%'} sub="avg score" color={T.navy}/><KPI label="SBT Nature" value={kpis.committed} sub="committed" color={T.gold}/>
      <KPI label="Avg MSA" value={kpis.avgMsa} sub="mean species abundance" color={T.sage}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Nature Dependency by Sector</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={sectorChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="avgDep" fill={ACCENT} radius={[4,4,0,0]} name="Dependency"/><Bar dataKey="avgImp" fill={T.red} radius={[4,4,0,0]} name="Impact"/></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Biodiversity Loss Drivers</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={BIO_DRIVERS} dataKey="impact" nameKey="driver" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({driver,impact})=>`${driver}: ${impact}%`} labelLine={false} fontSize={9}>{BIO_DRIVERS.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Nature Risk Trend</div>
        <ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="avgDep" stroke={ACCENT} fill="rgba(5,150,105,0.1)" name="Avg Dependency"/><Area type="monotone" dataKey="tnfdAdoption" stroke={T.navy} fill="rgba(27,58,92,0.08)" name="TNFD Adoption %"/></AreaChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Nature Risk Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Avg" dataKey="value" stroke={ACCENT} fill="rgba(5,150,105,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
  </>);

  const renderScreen=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search companies..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={secF} onChange={e=>{setSecF(e.target.value);setPage(1);}}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} companies</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'nature_loss_risk')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="name" label="Company" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="sector" label="Sector" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="natureDep" label="Dependency" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="natureImpact" label="Impact" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="tnfdReadiness" label="TNFD" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="leapScore" label="LEAP" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="biodivFootprint" label="Biodiv FP" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="sbtNature" label="SBT Nature" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={ss.td}>{r.sector}</td>
        <td style={ss.td}><span style={badge(r.natureDep,[25,50,70])}>{r.natureDep}</span></td>
        <td style={ss.td}><span style={badge(100-r.natureImpact,[30,55,75])}>{r.natureImpact}</span></td>
        <td style={ss.td}><span style={badge(r.tnfdReadiness,[25,50,70])}>{r.tnfdReadiness}%</span></td>
        <td style={ss.td}>{r.leapScore}</td><td style={ss.td}>{r.biodivFootprint}</td>
        <td style={ss.td}><span style={{color:r.sbtNature==='Committed'?T.green:r.sbtNature==='Exploring'?T.amber:T.textMut,fontWeight:600,fontSize:11}}>{r.sbtNature}</span></td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['Water Dependency',r.waterDep],['Soil Dependency',r.soilDep],['Pollinator Dep.',r.pollinatorDep],['Carbon Sequestration',r.carbonSeq],['Land Use Impact',r.landUse],['Species at Risk',r.speciesRisk],['Deforestation Link',r.deforestLink],['Supply Chain Nature',r.supplyChainNature],['Nature Plan',r.naturePlan],['MSA Score',r.msa]].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'Dependency',v:r.natureDep},{d:'Impact',v:r.natureImpact},{d:'TNFD',v:r.tnfdReadiness},{d:'LEAP',v:r.leapScore},{d:'Water',v:r.waterDep},{d:'Supply Chain',v:r.supplyChainNature}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(5,150,105,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'Water',v:r.waterDep},{n:'Soil',v:r.soilDep},{n:'Pollinator',v:r.pollinatorDep},{n:'Carbon',v:r.carbonSeq},{n:'Land Use',v:r.landUse}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="n" type="category" tick={{fontSize:9,fill:T.textSec}} width={65}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderLeap=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>TNFD LEAP Assessment Framework</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={COMPANIES.sort((a,b)=>b.leapScore-a.leapScore).slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="leapScore" fill={ACCENT} radius={[4,4,0,0]} name="LEAP Score"/><Bar dataKey="tnfdReadiness" fill={T.navy} radius={[4,4,0,0]} name="TNFD Ready %"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="tnfdAdoption" stroke={ACCENT} fill="rgba(5,150,105,0.12)" name="TNFD Adoption %"/></AreaChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Company</th><th style={ss.th('','','')}>LEAP</th><th style={ss.th('','','')}>TNFD</th><th style={ss.th('','','')}>SBT Nature</th><th style={ss.th('','','')}>Plan</th></tr></thead><tbody>
      {COMPANIES.sort((a,b)=>b.leapScore-a.leapScore).slice(0,20).map(r=>(<tr key={r.id}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={ss.td}><span style={badge(r.leapScore,[25,50,70])}>{r.leapScore}</span></td><td style={ss.td}>{r.tnfdReadiness}%</td><td style={ss.td}><span style={{color:r.sbtNature==='Committed'?T.green:r.sbtNature==='Exploring'?T.amber:T.textMut,fontWeight:600,fontSize:11}}>{r.sbtNature}</span></td><td style={ss.td}>{r.naturePlan}</td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(COMPANIES,'tnfd_leap')}>Export CSV</button></div>
  </div>);

  const renderBiodiv=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Biodiversity Footprint Analysis</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={COMPANIES.sort((a,b)=>b.biodivFootprint-a.biodivFootprint).slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="biodivFootprint" fill={T.red} radius={[4,4,0,0]} name="Biodiv Footprint"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={BIO_DRIVERS} dataKey="impact" nameKey="driver" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({driver,impact})=>`${impact}%`} labelLine fontSize={10}>{BIO_DRIVERS.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/><Legend wrapperStyle={{fontSize:10}}/></PieChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Company</th><th style={ss.th('','','')}>Biodiv FP</th><th style={ss.th('','','')}>MSA</th><th style={ss.th('','','')}>Species Risk</th><th style={ss.th('','','')}>Land Use</th><th style={ss.th('','','')}>Deforest Link</th></tr></thead><tbody>
      {COMPANIES.sort((a,b)=>b.biodivFootprint-a.biodivFootprint).slice(0,20).map(r=>(<tr key={r.id}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={{...ss.td,fontFamily:T.mono,color:T.red}}>{r.biodivFootprint}</td><td style={{...ss.td,fontFamily:T.mono}}>{r.msa}</td><td style={ss.td}>{r.speciesRisk}</td><td style={ss.td}>{r.landUse}</td><td style={ss.td}>{r.deforestLink}%</td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(COMPANIES,'biodiv_footprint')}>Export CSV</button></div>
  </div>);

  return(<div style={ss.wrap}>
    <div style={ss.header}>Nature & Biodiversity Loss Risk</div>
    <div style={ss.sub}>Nature dependency scoring, TNFD LEAP assessment, biodiversity footprint across 50 companies</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderScreen()}{tab===2&&renderLeap()}{tab===3&&renderBiodiv()}
  </div>);
}