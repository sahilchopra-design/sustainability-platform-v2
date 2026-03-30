import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#0c4a6e';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Asset Screening','CRREM Pathways','Stranding Analysis'];
const ASSET_TYPES=['All','Office','Retail','Industrial','Residential','Hotel','Data Center','Logistics','Healthcare','Mixed Use','Infrastructure'];
const REGIONS=['All','North America','Europe','Asia Pacific','Middle East','Latin America'];
const PAGE_SIZE=15;const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.green,T.red,'#8b5cf6','#0891b2','#be185d'];
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(22,163,74,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?T.green:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};

const ASSETS=(()=>{const names=['One World Trade Center','The Shard London','Marina Bay Sands','Burj Khalifa Dubai','Hudson Yards NYC','Canary Wharf Tower','La Defense Tower','Westfield London','Amazon HQ2 Crystal City','Google Bay View Campus','Microsoft Redmond Campus','Apple Park Cupertino','Salesforce Tower SF','Deutsche Bank HQ Frankfurt','Commerzbank Tower','Lloyd Banking HQ London','HSBC Tower Hong Kong','DBS Tower Singapore','JPMorgan HQ NYC','Goldman Sachs HQ','Prologis Park Chicago','Segro Park Slough','Goodman Logistics Sydney','GLP Tokyo Bay','Mapletree Logistics SG','Brookfield Place Toronto','IFC Mall Seoul','Raffles City Shanghai','ION Orchard Singapore','K11 Musea Hong Kong','Mayo Clinic Rochester','Johns Hopkins Complex','Cleveland Clinic Main','Equinix SV1 Data Center','Digital Realty Ashburn','CyrusOne Dallas','CoreSite LA1','QTS Atlanta','Marriott Marquis NYC','Hilton Midtown NYC'];
const types=['Office','Office','Hotel','Mixed Use','Office','Office','Office','Retail','Office','Office','Office','Office','Office','Office','Office','Office','Office','Office','Office','Office','Logistics','Logistics','Logistics','Logistics','Logistics','Office','Retail','Mixed Use','Retail','Retail','Healthcare','Healthcare','Healthcare','Data Center','Data Center','Data Center','Data Center','Data Center','Hotel','Hotel'];
const regs=['North America','Europe','Asia Pacific','Middle East','North America','Europe','Europe','Europe','North America','North America','North America','North America','North America','Europe','Europe','Europe','Asia Pacific','Asia Pacific','North America','North America','North America','Europe','Asia Pacific','Asia Pacific','Asia Pacific','North America','Asia Pacific','Asia Pacific','Asia Pacific','Asia Pacific','North America','North America','North America','North America','North America','North America','North America','North America','North America','North America'];
return names.map((n,i)=>({id:i+1,name:n,type:types[i],region:regs[i],physicalRisk:Math.round(5+sr(i*7)*85),transitionRisk:Math.round(10+sr(i*11)*80),crremScore:Math.round(10+sr(i*13)*85),strandingYear:2025+Math.floor(sr(i*17)*20),epcRating:String.fromCharCode(65+Math.floor(sr(i*19)*6)),carbonIntensity:Math.round(20+sr(i*23)*180),energyIntensity:Math.round(50+sr(i*29)*350),waterIntensity:Math.round(1+sr(i*31)*20),retrofitCostM:Math.round(1+sr(i*37)*49),valuationM:Math.round(50+sr(i*41)*2950),floodRisk:Math.round(sr(i*43)*80),heatStress:Math.round(sr(i*47)*70),windExposure:Math.round(sr(i*53)*60),seaLevelRisk:Math.round(sr(i*59)*50),greenCert:sr(i*61)>0.5?'LEED/BREEAM':sr(i*61)>0.25?'Pending':'None',netZeroReady:sr(i*67)>0.4?'Yes':'No',adaptationPlan:sr(i*71)>0.45?'Yes':'Partial'}));})();

const CRREM=Array.from({length:10},(_,i)=>({year:2025+i*3,office:Math.round(80-i*6+sr(i*7)*5),retail:Math.round(90-i*5+sr(i*11)*6),logistics:Math.round(70-i*4+sr(i*13)*4),target:Math.round(75-i*7)}));
const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgPhys:Math.round(30+sr(i*7)*15),avgTrans:Math.round(35+sr(i*11)*12),stranded:Math.round(5+i*0.3+sr(i*13)*3)}));

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function RealAssetsClimatePage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[typeF,setTypeF]=useState('All');const[regF,setRegF]=useState('All');
  const[sortCol,setSortCol]=useState('physicalRisk');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{let d=[...ASSETS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(typeF!=='All')d=d.filter(r=>r.type===typeF);if(regF!=='All')d=d.filter(r=>r.region===regF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,typeF,regF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const kpis=useMemo(()=>{const avg=(k)=>Math.round(ASSETS.reduce((s,c)=>s+c[k],0)/ASSETS.length);const totalVal=ASSETS.reduce((s,c)=>s+c.valuationM,0);const strandedSoon=ASSETS.filter(c=>c.strandingYear<=2030).length;return{avgPhys:avg('physicalRisk'),avgTrans:avg('transitionRisk'),totalVal,strandedSoon,avgCrrem:avg('crremScore')};},[]);
  const typeDist=useMemo(()=>{const m={};ASSETS.forEach(c=>{m[c.type]=(m[c.type]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);
  const typeRisk=useMemo(()=>{const m={};ASSETS.forEach(c=>{if(!m[c.type])m[c.type]={type:c.type,phys:0,trans:0,n:0};m[c.type].phys+=c.physicalRisk;m[c.type].trans+=c.transitionRisk;m[c.type].n++;});return Object.values(m).map(s=>({...s,phys:Math.round(s.phys/s.n),trans:Math.round(s.trans/s.n)}));},[]);
  const radarData=useMemo(()=>{const dims=['physicalRisk','transitionRisk','crremScore','carbonIntensity','floodRisk','heatStress'];const avg=(k)=>Math.round(ASSETS.reduce((s,c)=>s+c[k],0)/ASSETS.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').trim(),value:Math.min(100,avg(d)),fullMark:100}));},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(12,74,110,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Avg Physical Risk" value={kpis.avgPhys+'/100'} sub="40 assets" color={T.red}/><KPI label="Avg Transition Risk" value={kpis.avgTrans+'/100'} sub="CRREM aligned" color={T.amber}/>
      <KPI label="Portfolio Value" value={'$'+fmt(kpis.totalVal)+'M'} sub="total AUM" color={T.navy}/><KPI label="Stranded by 2030" value={kpis.strandedSoon} sub="assets at risk" color={T.red}/>
      <KPI label="Avg CRREM" value={kpis.avgCrrem+'/100'} sub="pathway score" color={ACCENT}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Risk by Asset Type</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={typeRisk}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:9,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="phys" fill={T.red} radius={[4,4,0,0]} name="Physical Risk"/><Bar dataKey="trans" fill={T.amber} radius={[4,4,0,0]} name="Transition Risk"/></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Asset Type Distribution</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={typeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>{typeDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Risk Trend</div>
        <ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="avgPhys" stroke={T.red} fill="rgba(220,38,38,0.08)" name="Physical"/><Area type="monotone" dataKey="avgTrans" stroke={T.amber} fill="rgba(217,119,6,0.06)" name="Transition"/><Area type="monotone" dataKey="stranded" stroke={ACCENT} fill="rgba(12,74,110,0.08)" name="Stranded #"/></AreaChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Portfolio Risk Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Avg" dataKey="value" stroke={ACCENT} fill="rgba(12,74,110,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
  </>);

  const renderScreen=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search assets..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={typeF} onChange={e=>{setTypeF(e.target.value);setPage(1);}}>{ASSET_TYPES.map(s=><option key={s}>{s}</option>)}</select>
      <select style={ss.select} value={regF} onChange={e=>{setRegF(e.target.value);setPage(1);}}>{REGIONS.map(s=><option key={s}>{s}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} assets</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'real_assets_climate')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="name" label="Asset" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="type" label="Type" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="physicalRisk" label="Physical" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="transitionRisk" label="Transition" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="crremScore" label="CRREM" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="strandingYear" label="Stranding" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="valuationM" label="Value $M" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="epcRating" label="EPC" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</td><td style={ss.td}>{r.type}</td>
        <td style={ss.td}><span style={badge(100-r.physicalRisk,[25,50,75])}>{r.physicalRisk}</span></td>
        <td style={ss.td}><span style={badge(100-r.transitionRisk,[25,50,75])}>{r.transitionRisk}</span></td>
        <td style={ss.td}><span style={badge(r.crremScore,[25,50,70])}>{r.crremScore}</span></td>
        <td style={{...ss.td,fontFamily:T.mono,color:r.strandingYear<=2030?T.red:r.strandingYear<=2035?T.amber:T.green}}>{r.strandingYear}</td>
        <td style={{...ss.td,fontFamily:T.mono}}>${fmt(r.valuationM)}M</td>
        <td style={{...ss.td,fontWeight:600}}>{r.epcRating}</td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['Carbon Intensity',r.carbonIntensity+' kgCO2/sqm'],['Energy Intensity',r.energyIntensity+' kWh/sqm'],['Water Intensity',r.waterIntensity+' m3/sqm'],['Flood Risk',r.floodRisk],['Heat Stress',r.heatStress],['Wind Exposure',r.windExposure],['Sea Level Risk',r.seaLevelRisk],['Retrofit Cost','$'+r.retrofitCostM+'M'],['Green Cert',r.greenCert],['Net Zero Ready',r.netZeroReady],['Adaptation Plan',r.adaptationPlan]].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'Physical',v:r.physicalRisk},{d:'Transition',v:r.transitionRisk},{d:'Flood',v:r.floodRisk},{d:'Heat',v:r.heatStress},{d:'Wind',v:r.windExposure},{d:'Sea Level',v:r.seaLevelRisk}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={T.red} fill="rgba(220,38,38,0.12)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'Physical',v:r.physicalRisk},{n:'Transition',v:r.transitionRisk},{n:'CRREM',v:r.crremScore},{n:'Carbon',v:Math.min(100,r.carbonIntensity/2)}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="n" type="category" tick={{fontSize:9,fill:T.textSec}} width={65}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderCrrem=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>CRREM Decarbonisation Pathways</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><LineChart data={CRREM}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Line type="monotone" dataKey="office" stroke={ACCENT} strokeWidth={2} name="Office kgCO2/sqm"/><Line type="monotone" dataKey="retail" stroke={T.gold} strokeWidth={2} name="Retail"/><Line type="monotone" dataKey="logistics" stroke={T.sage} strokeWidth={2} name="Logistics"/><Line type="monotone" dataKey="target" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" name="1.5C Target"/></LineChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><BarChart data={ASSETS.sort((a,b)=>a.strandingYear-b.strandingYear).slice(0,12)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="strandingYear" fill={T.red} radius={[4,4,0,0]} name="Stranding Year"/></BarChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Year</th><th style={ss.th('','','')}>Office</th><th style={ss.th('','','')}>Retail</th><th style={ss.th('','','')}>Logistics</th><th style={ss.th('','','')}>1.5C Target</th></tr></thead><tbody>
      {CRREM.map((r,i)=>(<tr key={i}><td style={{...ss.td,fontFamily:T.mono,fontWeight:600}}>{r.year}</td><td style={{...ss.td,fontFamily:T.mono}}>{r.office}</td><td style={{...ss.td,fontFamily:T.mono}}>{r.retail}</td><td style={{...ss.td,fontFamily:T.mono}}>{r.logistics}</td><td style={{...ss.td,fontFamily:T.mono,color:T.red}}>{r.target}</td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(CRREM,'crrem_pathways')}>Export CSV</button></div>
  </div>);

  const renderStrand=()=>{const strandData=ASSETS.sort((a,b)=>a.strandingYear-b.strandingYear);const yearDist=useMemo(()=>{const m={};strandData.forEach(a=>{const bucket=a.strandingYear<=2030?'By 2030':a.strandingYear<=2035?'2031-2035':a.strandingYear<=2040?'2036-2040':'After 2040';m[bucket]=(m[bucket]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);
  return(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Asset Stranding Analysis</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={yearDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({name,value})=>`${name}: ${value}`} labelLine fontSize={10}>{yearDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><BarChart data={strandData.slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="carbonIntensity" fill={T.red} radius={[4,4,0,0]} name="Carbon kgCO2/sqm"/><Bar dataKey="retrofitCostM" fill={T.gold} radius={[4,4,0,0]} name="Retrofit $M"/></BarChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Asset</th><th style={ss.th('','','')}>Stranding</th><th style={ss.th('','','')}>Carbon</th><th style={ss.th('','','')}>Value</th><th style={ss.th('','','')}>Retrofit</th><th style={ss.th('','','')}>Net Zero</th></tr></thead><tbody>
      {strandData.slice(0,20).map(r=>(<tr key={r.id}><td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={{...ss.td,fontFamily:T.mono,color:r.strandingYear<=2030?T.red:r.strandingYear<=2035?T.amber:T.green,fontWeight:600}}>{r.strandingYear}</td><td style={{...ss.td,fontFamily:T.mono}}>{r.carbonIntensity}</td><td style={{...ss.td,fontFamily:T.mono}}>${fmt(r.valuationM)}M</td><td style={{...ss.td,fontFamily:T.mono}}>${r.retrofitCostM}M</td><td style={ss.td}><span style={{color:r.netZeroReady==='Yes'?T.green:T.amber,fontWeight:600,fontSize:11}}>{r.netZeroReady}</span></td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(strandData,'stranding_analysis')}>Export CSV</button></div>
  </div>);};

  return(<div style={ss.wrap}>
    <div style={ss.header}>Real Assets Climate Risk</div>
    <div style={ss.sub}>Physical risk, CRREM pathways, stranding year analysis across 40 real assets</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderScreen()}{tab===2&&renderCrrem()}{tab===3&&renderStrand()}
  </div>);
}