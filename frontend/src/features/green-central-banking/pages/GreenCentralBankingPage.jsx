import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#059669';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Central Bank Profiles','Green QE Analytics','Stress Test Mandates'];
const REGIONS=['All','Europe','Americas','Asia Pacific','Africa','Middle East'];
const PAGE_SIZE=15;const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.red,'#8b5cf6','#0891b2','#be185d','#ea580c'];
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(5,150,105,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?ACCENT:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};

const CBS=(()=>{const names=['European Central Bank','Federal Reserve','Bank of England','Bank of Japan','Peoples Bank China','Reserve Bank India','Bank of Canada','Reserve Bank Aus','Bundesbank','Banque de France','De Nederlandsche Bank','Banca dItalia','Banco de Espana','Swiss National Bank','Sveriges Riksbank','Norges Bank','Danmarks Nationalbank','Bank of Korea','Monetary Auth Singapore','Bank Negara Malaysia','Bank of Thailand','Central Bank Brazil','Banco de Mexico','Central Bank Chile','Central Bank Colombia','South African Reserve','Bank of Ghana','Central Bank Nigeria','Bank Al-Maghrib','Reserve Bank NZ'];
const regs=['Europe','Americas','Europe','Asia Pacific','Asia Pacific','Asia Pacific','Americas','Asia Pacific','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Asia Pacific','Asia Pacific','Asia Pacific','Asia Pacific','Americas','Americas','Americas','Americas','Africa','Africa','Africa','Africa','Asia Pacific'];
return names.map((n,i)=>({id:i+1,name:n,region:regs[i],ngfsMemb:sr(i*7)>0.2?'Yes':'No',greenQe:sr(i*11)>0.6?'Active':sr(i*11)>0.3?'Planned':'None',climateStress:sr(i*13)>0.45?'Mandatory':sr(i*13)>0.25?'Voluntary':'None',greenBondPurchase:Math.round(sr(i*17)*80),taxonomyAdoption:Math.round(sr(i*19)*90),disclosureReq:sr(i*23)>0.4?'Mandatory':sr(i*23)>0.2?'Comply-or-Explain':'Voluntary',capitalReqs:sr(i*29)>0.5?'Active':'Under Review',greenScore:Math.round(15+sr(i*31)*80),reserveGreening:Math.round(sr(i*37)*45),researchOutput:Math.round(2+sr(i*41)*48),coalExclusion:sr(i*43)>0.5?'Yes':'No',scenarioAnalysis:sr(i*47)>0.4?'NGFS':'Internal',supervisoryExpect:Math.round(10+sr(i*53)*85),transitionPlan:sr(i*59)>0.5?'Required':'Encouraged',macroprudential:Math.round(5+sr(i*61)*80),assets:Math.round(50+sr(i*67)*9950)}));})();

const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,greenQeVol:Math.round(100+i*15+sr(i*7)*80),cbsActive:Math.round(8+i*0.6+sr(i*11)*3),stressTests:Math.round(3+sr(i*13)*8),greenBonds:Math.round(200+i*20+sr(i*17)*100)}));
const QE_DATA=[{instrument:'Green Sovereign Bonds',volume:450,share:35,growth:12},{instrument:'Green Corporate Bonds',volume:280,share:22,growth:18},{instrument:'Climate MBS',volume:120,share:9,growth:25},{instrument:'Sustainability Bonds',volume:190,share:15,growth:15},{instrument:'Transition Bonds',volume:80,share:6,growth:30},{instrument:'Social Bonds',volume:165,share:13,growth:8}];

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function GreenCentralBankingPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[regF,setRegF]=useState('All');
  const[sortCol,setSortCol]=useState('greenScore');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{let d=[...CBS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(regF!=='All')d=d.filter(r=>r.region===regF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,regF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const kpis=useMemo(()=>{const avg=(k)=>Math.round(CBS.reduce((s,c)=>s+c[k],0)/CBS.length);const ngfs=CBS.filter(c=>c.ngfsMemb==='Yes').length;const activeQe=CBS.filter(c=>c.greenQe==='Active').length;const mandatory=CBS.filter(c=>c.climateStress==='Mandatory').length;return{avgGreen:avg('greenScore'),ngfs,activeQe,mandatory,totalAssets:Math.round(CBS.reduce((s,c)=>s+c.assets,0))};},[]);
  const regChart=useMemo(()=>{const m={};CBS.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,avg:0,n:0};m[c.region].avg+=c.greenScore;m[c.region].n++;});return Object.values(m).map(s=>({...s,avg:Math.round(s.avg/s.n)}));},[]);
  const qeDist=useMemo(()=>{const m={};CBS.forEach(c=>{m[c.greenQe]=(m[c.greenQe]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);
  const radarData=useMemo(()=>{const dims=['greenScore','taxonomyAdoption','supervisoryExpect','macroprudential','reserveGreening','greenBondPurchase'];const avg=(k)=>Math.round(CBS.reduce((s,c)=>s+c[k],0)/CBS.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').trim(),value:avg(d),fullMark:100}));},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(5,150,105,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Avg Green Score" value={kpis.avgGreen+'/100'} sub="30 central banks" color={ACCENT}/><KPI label="NGFS Members" value={kpis.ngfs} sub="of 30" color={T.navy}/>
      <KPI label="Active Green QE" value={kpis.activeQe} sub="central banks" color={T.gold}/><KPI label="Mandatory Stress" value={kpis.mandatory} sub="climate stress tests" color={T.amber}/>
      <KPI label="Total Assets" value={'$'+fmt(kpis.totalAssets)+'B'} sub="aggregate balance sheet" color={T.sage}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Green Score by Region</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={regChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="region" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/><Tooltip {...tip}/><Bar dataKey="avg" fill={ACCENT} radius={[4,4,0,0]} name="Avg Green Score"/></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Green QE Status</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={qeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{qeDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Green Central Banking Trend</div>
        <ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="greenQeVol" stroke={ACCENT} fill="rgba(5,150,105,0.1)" name="Green QE ($B)"/><Area type="monotone" dataKey="greenBonds" stroke={T.navy} fill="rgba(27,58,92,0.08)" name="Green Bonds ($B)"/></AreaChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Policy Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Avg" dataKey="value" stroke={ACCENT} fill="rgba(5,150,105,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
  </>);

  const renderProfiles=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search central banks..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={regF} onChange={e=>{setRegF(e.target.value);setPage(1);}}>{REGIONS.map(s=><option key={s}>{s}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} banks</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'green_central_banking')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="name" label="Central Bank" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="region" label="Region" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="greenScore" label="Green Score" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="greenQe" label="Green QE" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="climateStress" label="Stress Test" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="ngfsMemb" label="NGFS" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="taxonomyAdoption" label="Taxonomy" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="assets" label="Assets $B" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={ss.td}>{r.region}</td>
        <td style={ss.td}><span style={badge(r.greenScore,[25,50,70])}>{r.greenScore}</span></td>
        <td style={ss.td}><span style={{color:r.greenQe==='Active'?T.green:r.greenQe==='Planned'?T.amber:T.textMut,fontWeight:600,fontSize:11}}>{r.greenQe}</span></td>
        <td style={ss.td}><span style={{color:r.climateStress==='Mandatory'?T.green:r.climateStress==='Voluntary'?T.amber:T.textMut,fontWeight:600,fontSize:11}}>{r.climateStress}</span></td>
        <td style={ss.td}><span style={{color:r.ngfsMemb==='Yes'?T.green:T.textMut,fontWeight:600,fontSize:11}}>{r.ngfsMemb}</span></td>
        <td style={ss.td}>{r.taxonomyAdoption}%</td><td style={{...ss.td,fontFamily:T.mono}}>${fmt(r.assets)}B</td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['Disclosure Req.',r.disclosureReq],['Capital Requirements',r.capitalReqs],['Reserve Greening',r.reserveGreening+'%'],['Green Bond Purchase',r.greenBondPurchase+'%'],['Research Output',r.researchOutput+' papers'],['Coal Exclusion',r.coalExclusion],['Scenario Analysis',r.scenarioAnalysis],['Supervisory Expect.',r.supervisoryExpect],['Transition Plan',r.transitionPlan],['Macroprudential',r.macroprudential]].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'Green Score',v:r.greenScore},{d:'Taxonomy',v:r.taxonomyAdoption},{d:'Supervision',v:r.supervisoryExpect},{d:'Macropru',v:r.macroprudential},{d:'Reserves',v:r.reserveGreening*2},{d:'Green Bonds',v:r.greenBondPurchase}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(5,150,105,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'Green Score',v:r.greenScore},{n:'Taxonomy',v:r.taxonomyAdoption},{n:'Supervision',v:r.supervisoryExpect},{n:'Macropru',v:r.macroprudential}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="n" type="category" tick={{fontSize:9,fill:T.textSec}} width={75}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderQe=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Green QE Instrument Analytics</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={QE_DATA}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="instrument" tick={{fontSize:8,fill:T.textMut}} angle={-20} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="volume" fill={ACCENT} radius={[4,4,0,0]} name="Volume $B"/><Bar dataKey="growth" fill={T.gold} radius={[4,4,0,0]} name="Growth %"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={QE_DATA} dataKey="share" nameKey="instrument" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({instrument,share})=>`${share}%`} labelLine fontSize={10}>{QE_DATA.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/><Legend/></PieChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Instrument</th><th style={ss.th('','','')}>Volume ($B)</th><th style={ss.th('','','')}>Share %</th><th style={ss.th('','','')}>Growth %</th></tr></thead><tbody>
      {QE_DATA.map((r,i)=>(<tr key={i}><td style={{...ss.td,fontWeight:600}}>{r.instrument}</td><td style={{...ss.td,fontFamily:T.mono}}>${r.volume}B</td><td style={{...ss.td,fontFamily:T.mono}}>{r.share}%</td><td style={{...ss.td,fontFamily:T.mono,color:T.green}}>+{r.growth}%</td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(QE_DATA,'green_qe')}>Export CSV</button></div>
  </div>);

  const renderStress=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Climate Stress Test Mandates</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={CBS.filter(c=>c.climateStress!=='None').sort((a,b)=>b.supervisoryExpect-a.supervisoryExpect)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="supervisoryExpect" fill={ACCENT} radius={[4,4,0,0]} name="Supervisory Score"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><LineChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="stressTests" stroke={ACCENT} strokeWidth={2} name="Stress Tests"/><Line type="monotone" dataKey="cbsActive" stroke={T.navy} strokeWidth={2} name="Active CBs"/></LineChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Central Bank</th><th style={ss.th('','','')}>Mandate</th><th style={ss.th('','','')}>Scenario</th><th style={ss.th('','','')}>Supervisory</th><th style={ss.th('','','')}>Disclosure</th></tr></thead><tbody>
      {CBS.filter(c=>c.climateStress!=='None').map(r=>(<tr key={r.id}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={ss.td}><span style={{color:r.climateStress==='Mandatory'?T.green:T.amber,fontWeight:600,fontSize:11}}>{r.climateStress}</span></td><td style={ss.td}>{r.scenarioAnalysis}</td><td style={ss.td}><span style={badge(r.supervisoryExpect,[25,50,70])}>{r.supervisoryExpect}</span></td><td style={ss.td}>{r.disclosureReq}</td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(CBS,'stress_test_mandates')}>Export CSV</button></div>
  </div>);

  return(<div style={ss.wrap}>
    <div style={ss.header}>Green Central Banking Intelligence</div>
    <div style={ss.sub}>30 central banks -- green QE, climate stress mandates, supervisory expectations</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderProfiles()}{tab===2&&renderQe()}{tab===3&&renderStress()}
  </div>);
}