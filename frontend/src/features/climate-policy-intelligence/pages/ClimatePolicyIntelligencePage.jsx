import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#7c3aed';
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Country Screening','Carbon Pricing','NDC Tracker'];
const CONTINENT=['All','Europe','North America','Asia','Africa','Latin America','Oceania','Middle East'];
const INCOME=['All','High','Upper Middle','Lower Middle','Low'];
const PAGE_SIZE=15;
const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.green,T.red,'#0891b2','#be185d','#ea580c'];
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(22,163,74,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?T.green:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};

const COUNTRIES=(()=>{const names=['United States','China','India','Germany','Japan','United Kingdom','France','Brazil','Canada','Australia','South Korea','Indonesia','Mexico','Russia','Saudi Arabia','South Africa','Turkey','Italy','Spain','Netherlands','Sweden','Norway','Denmark','Switzerland','Austria','Belgium','Poland','Czech Republic','Portugal','Ireland','Finland','Greece','Chile','Argentina','Colombia','Peru','Thailand','Vietnam','Malaysia','Philippines','Singapore','UAE','Qatar','Kuwait','Israel','Egypt','Nigeria','Kenya','Morocco','Ethiopia'];
const cont=['North America','Asia','Asia','Europe','Asia','Europe','Europe','Latin America','North America','Oceania','Asia','Asia','Latin America','Europe','Middle East','Africa','Middle East','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Europe','Latin America','Latin America','Latin America','Latin America','Asia','Asia','Asia','Asia','Asia','Middle East','Middle East','Middle East','Middle East','Africa','Africa','Africa','Africa','Africa'];
const inc=['High','Upper Middle','Lower Middle','High','High','High','High','Upper Middle','High','High','High','Lower Middle','Upper Middle','Upper Middle','High','Upper Middle','Upper Middle','High','High','High','High','High','High','High','High','High','High','High','High','High','High','High','Upper Middle','Upper Middle','Upper Middle','Upper Middle','Upper Middle','Lower Middle','Upper Middle','Lower Middle','High','High','High','High','High','Lower Middle','Lower Middle','Lower Middle','Lower Middle','Low'];
return names.map((n,i)=>({id:i+1,country:n,continent:cont[i],income:inc[i],policyStringency:Math.round(15+sr(i*7)*80),carbonPrice:Math.round(sr(i*11)*180),ndcAmbition:Math.round(10+sr(i*13)*85),ndcProgress:Math.round(5+sr(i*17)*90),renewableTarget:Math.round(10+sr(i*19)*80),coalPhaseout:sr(i*23)<0.4?'Committed':sr(i*23)<0.7?'Planned':'None',etsActive:sr(i*29)>0.45?'Yes':'No',carbonTax:sr(i*31)>0.55?'Yes':'No',methaneRegs:sr(i*37)<0.3?'Strong':sr(i*37)<0.6?'Moderate':'Weak',deforestationLaw:sr(i*41)>0.5?'Yes':'No',greenBonds:Math.round(sr(i*43)*50),climateFinance:Math.round(sr(i*47)*20),adaptationSpend:Math.round(sr(i*53)*15),emissionsGt:+(sr(i*59)*12+0.1).toFixed(2),emissionsPerCap:+(sr(i*61)*25+1).toFixed(1),tempTarget:sr(i*67)<0.3?'1.5C':sr(i*67)<0.7?'2.0C':'Insufficient',netZeroYear:2030+Math.floor(sr(i*71)*30),parisAligned:sr(i*7)>0.5?'Yes':'No'}));})();

const CARBON_PRICING=[{mechanism:'EU ETS',type:'ETS',price:85,coverage:40,region:'Europe'},{mechanism:'UK ETS',type:'ETS',price:72,coverage:25,region:'Europe'},{mechanism:'Korea ETS',type:'ETS',price:18,coverage:70,region:'Asia'},{mechanism:'China ETS',type:'ETS',price:9,coverage:40,region:'Asia'},{mechanism:'California RGGI',type:'ETS',price:35,coverage:30,region:'North America'},{mechanism:'Canada Federal',type:'Tax',price:50,coverage:80,region:'North America'},{mechanism:'Switzerland CO2',type:'Tax',price:120,coverage:33,region:'Europe'},{mechanism:'Sweden Carbon Tax',type:'Tax',price:137,coverage:40,region:'Europe'},{mechanism:'Norway Carbon Tax',type:'Tax',price:90,coverage:60,region:'Europe'},{mechanism:'Japan Carbon Tax',type:'Tax',price:3,coverage:75,region:'Asia'},{mechanism:'Singapore Carbon Tax',type:'Tax',price:5,coverage:80,region:'Asia'},{mechanism:'South Africa Carbon Tax',type:'Tax',price:9,coverage:80,region:'Africa'},{mechanism:'Mexico Carbon Tax',type:'Tax',price:4,coverage:47,region:'Latin America'},{mechanism:'Colombia Carbon Tax',type:'Tax',price:5,coverage:24,region:'Latin America'},{mechanism:'Germany nEHS',type:'ETS',price:45,coverage:40,region:'Europe'}];

const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgPrice:Math.round(30+i*2+sr(i*7)*15),newPolicies:Math.round(3+sr(i*11)*12),stringency:Math.round(35+i*0.8+sr(i*13)*8)}));

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function ClimatePolicyIntelligencePage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[cont,setCont]=useState('All');const[incF,setIncF]=useState('All');
  const[sortCol,setSortCol]=useState('policyStringency');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);
  const[cpSearch,setCpSearch]=useState('');const[cpSort,setCpSort]=useState('price');const[cpDir,setCpDir]=useState('desc');

  const filtered=useMemo(()=>{let d=[...COUNTRIES];if(search)d=d.filter(r=>r.country.toLowerCase().includes(search.toLowerCase()));if(cont!=='All')d=d.filter(r=>r.continent===cont);if(incF!=='All')d=d.filter(r=>r.income===incF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,cont,incF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const cpFiltered=useMemo(()=>{let d=[...CARBON_PRICING];if(cpSearch)d=d.filter(r=>r.mechanism.toLowerCase().includes(cpSearch.toLowerCase()));d.sort((a,b)=>cpDir==='asc'?(a[cpSort]>b[cpSort]?1:-1):(a[cpSort]<b[cpSort]?1:-1));return d;},[cpSearch,cpSort,cpDir]);
  const doCpSort=useCallback((col)=>{setCpSort(col);setCpDir(d=>cpSort===col?(d==='asc'?'desc':'asc'):'desc');},[cpSort]);

  const kpis=useMemo(()=>{const avg=(k)=>Math.round(COUNTRIES.reduce((s,c)=>s+c[k],0)/COUNTRIES.length);const withEts=COUNTRIES.filter(c=>c.etsActive==='Yes').length;const withTax=COUNTRIES.filter(c=>c.carbonTax==='Yes').length;return{avgStringency:avg('policyStringency'),avgNdc:avg('ndcAmbition'),withEts,withTax,parisAligned:COUNTRIES.filter(c=>c.parisAligned==='Yes').length};},[]);
  const contChart=useMemo(()=>{const m={};COUNTRIES.forEach(c=>{if(!m[c.continent])m[c.continent]={continent:c.continent,avgStr:0,avgNdc:0,n:0};m[c.continent].avgStr+=c.policyStringency;m[c.continent].avgNdc+=c.ndcAmbition;m[c.continent].n++;});return Object.values(m).map(s=>({...s,avgStr:Math.round(s.avgStr/s.n),avgNdc:Math.round(s.avgNdc/s.n)}));},[]);
  const targetDist=useMemo(()=>{const m={};COUNTRIES.forEach(c=>{m[c.tempTarget]=(m[c.tempTarget]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);
  const radarData=useMemo(()=>{const dims=['policyStringency','ndcAmbition','ndcProgress','renewableTarget','climateFinance','adaptationSpend'];const avg=(k)=>Math.round(COUNTRIES.reduce((s,c)=>s+c[k],0)/COUNTRIES.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').trim(),value:avg(d),fullMark:100}));},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(124,58,237,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Avg Stringency" value={kpis.avgStringency+'/100'} sub="50 countries" color={ACCENT}/><KPI label="NDC Ambition" value={kpis.avgNdc+'/100'} sub="avg score" color={T.navy}/>
      <KPI label="Active ETS" value={kpis.withEts} sub="countries" color={T.gold}/><KPI label="Carbon Tax" value={kpis.withTax} sub="countries" color={T.sage}/>
      <KPI label="Paris Aligned" value={kpis.parisAligned} sub="countries" color={T.green}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Policy Stringency by Region</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={contChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="continent" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="avgStr" fill={ACCENT} radius={[4,4,0,0]} name="Stringency"/><Bar dataKey="avgNdc" fill={T.navy} radius={[4,4,0,0]} name="NDC Ambition"/></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Temperature Target Distribution</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={targetDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{targetDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Policy Trend</div>
        <ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="avgPrice" stroke={ACCENT} fill="rgba(124,58,237,0.1)" name="Avg Carbon Price"/><Area type="monotone" dataKey="stringency" stroke={T.navy} fill="rgba(27,58,92,0.08)" name="Stringency Index"/></AreaChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Global Policy Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Avg" dataKey="value" stroke={ACCENT} fill="rgba(124,58,237,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
  </>);

  const renderScreen=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search countries..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={cont} onChange={e=>{setCont(e.target.value);setPage(1);}}>{CONTINENT.map(s=><option key={s}>{s}</option>)}</select>
      <select style={ss.select} value={incF} onChange={e=>{setIncF(e.target.value);setPage(1);}}>{INCOME.map(r=><option key={r}>{r}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} countries</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'climate_policy')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="country" label="Country" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="continent" label="Region" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="policyStringency" label="Stringency" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="carbonPrice" label="Carbon Price" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="ndcAmbition" label="NDC Ambition" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="ndcProgress" label="NDC Progress" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="renewableTarget" label="Renewable %" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="netZeroYear" label="Net Zero" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600}}>{r.country}</td><td style={ss.td}>{r.continent}</td>
        <td style={ss.td}><span style={badge(r.policyStringency,[25,50,70])}>{r.policyStringency}</span></td>
        <td style={{...ss.td,fontFamily:T.mono}}>${r.carbonPrice}/t</td>
        <td style={ss.td}><span style={badge(r.ndcAmbition,[25,50,70])}>{r.ndcAmbition}</span></td>
        <td style={ss.td}>{r.ndcProgress}%</td><td style={ss.td}>{r.renewableTarget}%</td>
        <td style={{...ss.td,fontFamily:T.mono}}>{r.netZeroYear}</td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['Coal Phaseout',r.coalPhaseout],['ETS Active',r.etsActive],['Carbon Tax',r.carbonTax],['Methane Regs',r.methaneRegs],['Deforestation Law',r.deforestationLaw],['Green Bonds ($B)',r.greenBonds],['Climate Finance ($B)',r.climateFinance],['Adaptation ($B)',r.adaptationSpend],['Emissions (Gt)',r.emissionsGt],['Per Capita (t)',r.emissionsPerCap],['Temp Target',r.tempTarget],['Paris Aligned',r.parisAligned]].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'Policy',v:r.policyStringency},{d:'NDC',v:r.ndcAmbition},{d:'Progress',v:r.ndcProgress},{d:'Renewable',v:r.renewableTarget},{d:'Finance',v:r.climateFinance*5},{d:'Adaptation',v:r.adaptationSpend*7}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(124,58,237,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'Stringency',v:r.policyStringency},{n:'NDC',v:r.ndcAmbition},{n:'Progress',v:r.ndcProgress},{n:'Renewable',v:r.renewableTarget}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="n" type="category" tick={{fontSize:9,fill:T.textSec}} width={70}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderCarbon=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search mechanisms..." value={cpSearch} onChange={e=>setCpSearch(e.target.value)}/>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{cpFiltered.length} mechanisms</span>
      <button style={ss.btn} onClick={()=>csvExport(cpFiltered,'carbon_pricing')}>Export CSV</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={cpFiltered}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="mechanism" tick={{fontSize:8,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="price" fill={ACCENT} radius={[4,4,0,0]} name="Price $/t"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><LineChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="avgPrice" stroke={ACCENT} strokeWidth={2} dot={{fill:ACCENT,r:3}} name="Avg Price"/><Line type="monotone" dataKey="newPolicies" stroke={T.navy} strokeWidth={2} dot={{fill:T.navy,r:3}} name="New Policies"/></LineChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="mechanism" label="Mechanism" sc={cpSort} sd={cpDir} fn={doCpSort}/><TH col="type" label="Type" sc={cpSort} sd={cpDir} fn={doCpSort}/>
      <TH col="price" label="Price ($/t)" sc={cpSort} sd={cpDir} fn={doCpSort}/><TH col="coverage" label="Coverage %" sc={cpSort} sd={cpDir} fn={doCpSort}/>
      <TH col="region" label="Region" sc={cpSort} sd={cpDir} fn={doCpSort}/>
    </tr></thead><tbody>{cpFiltered.map((r,i)=>(<tr key={i}><td style={{...ss.td,fontWeight:600}}>{r.mechanism}</td><td style={ss.td}><span style={{background:r.type==='ETS'?'rgba(124,58,237,0.1)':'rgba(22,163,74,0.1)',color:r.type==='ETS'?ACCENT:T.green,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>{r.type}</span></td><td style={{...ss.td,fontFamily:T.mono,fontWeight:600}}>${r.price}</td><td style={ss.td}>{r.coverage}%</td><td style={ss.td}>{r.region}</td></tr>))}</tbody></table></div>
  </div>);

  const renderNdc=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>NDC Tracker - Nationally Determined Contributions</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><BarChart data={COUNTRIES.slice(0,20).sort((a,b)=>b.ndcAmbition-a.ndcAmbition)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="country" tick={{fontSize:8,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="ndcAmbition" fill={ACCENT} radius={[4,4,0,0]} name="NDC Ambition"/><Bar dataKey="ndcProgress" fill={T.sage} radius={[4,4,0,0]} name="NDC Progress"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><AreaChart data={COUNTRIES.sort((a,b)=>b.emissionsGt-a.emissionsGt).slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="country" tick={{fontSize:8,fill:T.textMut}} angle={-35} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="emissionsGt" stroke={T.red} fill="rgba(220,38,38,0.1)" name="Emissions (Gt)"/></AreaChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Country</th><th style={ss.th('','','')}>NDC Ambition</th><th style={ss.th('','','')}>Progress</th><th style={ss.th('','','')}>Target</th><th style={ss.th('','','')}>Net Zero</th><th style={ss.th('','','')}>Paris</th></tr></thead><tbody>
      {COUNTRIES.slice(0,20).map(r=>(<tr key={r.id}><td style={{...ss.td,fontWeight:600}}>{r.country}</td><td style={ss.td}><span style={badge(r.ndcAmbition,[25,50,70])}>{r.ndcAmbition}</span></td><td style={ss.td}>{r.ndcProgress}%</td><td style={ss.td}>{r.tempTarget}</td><td style={{...ss.td,fontFamily:T.mono}}>{r.netZeroYear}</td><td style={ss.td}><span style={{color:r.parisAligned==='Yes'?T.green:T.red,fontWeight:600,fontSize:11}}>{r.parisAligned}</span></td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(COUNTRIES,'ndc_tracker')}>Export CSV</button></div>
  </div>);

  return(<div style={ss.wrap}>
    <div style={ss.header}>Climate Policy Intelligence</div>
    <div style={ss.sub}>NDC tracking, carbon pricing analysis, policy stringency monitoring across 50 countries</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderScreen()}{tab===2&&renderCarbon()}{tab===3&&renderNdc()}
  </div>);
}