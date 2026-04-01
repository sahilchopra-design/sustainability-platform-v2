import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,ZAxis,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#9333ea';
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Contagion Map','Propagation Analysis','Sector Linkages','Entity Deep Dive'];
const SECTORS=['All','Energy','Finance','Materials','Healthcare','Technology','Industrials','Utilities','Real Estate','Consumer','Telecom'];
const CHANNELS=['All','Supply Chain','Financial','Regulatory','Reputational','Environmental','Social'];
const PAGE_SIZE=12;
const PIECLRS=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899'];

const ENTITIES=(()=>{
  const names=['Shell plc','BP plc','Exxon Mobil','TotalEnergies','Chevron','JPMorgan Chase','Goldman Sachs','BlackRock','HSBC','BHP Group','Rio Tinto','Glencore','Vale SA','ArcelorMittal','BASF SE','Pfizer','Johnson & Johnson','Apple','Microsoft','Google','Amazon','Tesla','Siemens','GE','Honeywell','NextEra Energy','Enel SpA','Iberdrola','Prologis','CBRE Group','Unilever','Nestle','P&G','Coca-Cola','PepsiCo','AT&T','Verizon','Samsung','Toyota','Volkswagen','BMW','Daimler','Ford','GM','Caterpillar','3M','Dow','DuPont','Nucor','Freeport McMoRan'];
  const secs=['Energy','Energy','Energy','Energy','Energy','Finance','Finance','Finance','Finance','Materials','Materials','Materials','Materials','Materials','Materials','Healthcare','Healthcare','Technology','Technology','Technology','Technology','Technology','Industrials','Industrials','Industrials','Utilities','Utilities','Utilities','Real Estate','Real Estate','Consumer','Consumer','Consumer','Consumer','Consumer','Telecom','Telecom','Technology','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Materials','Materials','Materials','Materials'];
  return names.map((n,i)=>({
    id:i+1,name:n,sector:secs[i],
    materialityScore:Math.round(20+sr(i*7)*75),contagionOut:Math.round(sr(i*11)*100),contagionIn:Math.round(sr(i*13)*100),
    networkCentrality:+(sr(i*17)*0.9+0.1).toFixed(2),clusterCoeff:+(sr(i*19)*0.8).toFixed(2),
    propagationSpeed:Math.round(1+sr(i*23)*30),amplification:+(sr(i*29)*3+0.5).toFixed(1),
    directLinks:Math.round(3+sr(i*31)*20),indirectLinks:Math.round(5+sr(i*37)*40),
    supplyChainRisk:Math.round(sr(i*41)*100),financialRisk:Math.round(sr(i*43)*100),
    regulatoryRisk:Math.round(sr(i*47)*100),reputationalRisk:Math.round(sr(i*53)*100),
    envContagion:Math.round(sr(i*59)*100),socialContagion:Math.round(sr(i*61)*100),
    systemicImportance:sr(i*67)<0.15?'Critical':sr(i*67)<0.35?'High':sr(i*67)<0.6?'Medium':'Low',
    vulnerabilityIdx:Math.round(15+sr(i*71)*80),resilienceScore:Math.round(20+sr(i*73)*75),
    cascadeProbability:Math.round(sr(i*79)*100),impactMultiplier:+(sr(i*83)*4+1).toFixed(1),
  }));
})();

const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,contagionIdx:Math.round(40+i*0.8+sr(i*7)*15),propagationSpeed:Math.round(8+sr(i*11)*12),amplification:+(1.5+sr(i*13)*1.2).toFixed(1),networkDensity:+(0.3+i*0.008+sr(i*17)*0.05).toFixed(2)}));
const CHANNEL_DATA=[{channel:'Supply Chain',weight:28,speed:12,reach:65},{channel:'Financial',weight:24,speed:5,reach:80},{channel:'Regulatory',weight:18,speed:25,reach:55},{channel:'Reputational',weight:15,speed:3,reach:90},{channel:'Environmental',weight:10,speed:45,reach:40},{channel:'Social',weight:5,speed:8,reach:70}];

export default function DmeContagionPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[sectorF,setSectorF]=useState('All');
  const[channelF,setChannelF]=useState('All');
  const[sortCol,setSortCol]=useState('contagionOut');
  const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(1);
  const[selected,setSelected]=useState(null);

  const filtered=useMemo(()=>{let d=[...ENTITIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(1);};

  const stats=useMemo(()=>({count:filtered.length,avgContagion:(filtered.reduce((s,r)=>s+r.contagionOut,0)/filtered.length||0).toFixed(1),critical:filtered.filter(r=>r.systemicImportance==='Critical'||r.systemicImportance==='High').length,avgCentrality:(filtered.reduce((s,r)=>s+r.networkCentrality,0)/filtered.length||0).toFixed(2),avgAmplification:(filtered.reduce((s,r)=>s+parseFloat(r.amplification),0)/filtered.length||0).toFixed(1)}),[filtered]);
  const sectorContagion=useMemo(()=>{const m={};filtered.forEach(r=>{if(!m[r.sector])m[r.sector]={s:r.sector,out:0,inn:0,n:0};m[r.sector].out+=r.contagionOut;m[r.sector].inn+=r.contagionIn;m[r.sector].n++;});return Object.values(m).map(s=>({sector:s.s,outbound:Math.round(s.out/s.n),inbound:Math.round(s.inn/s.n)}));},[filtered]);
  const impDist=useMemo(()=>{const order=['Critical','High','Medium','Low'];const m={};filtered.forEach(r=>{m[r.systemicImportance]=(m[r.systemicImportance]||0)+1;});return order.filter(k=>m[k]).map(k=>({name:k,value:m[k]}));},[filtered]);

  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fn;a.click();URL.revokeObjectURL(url);},[]);

  const si=(col,cur,dir)=>cur===col?(dir==='asc'?' \u25B2':' \u25BC'):' \u25CB';
  const thS={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left',background:T.surfaceH};
  const tdS={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inpS={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const selS={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnS=(a)=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer',fontWeight:a?600:400});
  const pgB={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const cS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};
  const bdg=(val,th)=>{const[lo,mid,hi]=th;const bg=val>=hi?'rgba(220,38,38,0.12)':val>=mid?'rgba(217,119,6,0.12)':val>=lo?'rgba(197,169,106,0.12)':'rgba(22,163,74,0.12)';const c=val>=hi?T.red:val>=mid?T.amber:val>=lo?T.gold:T.green;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
  const rBdg=(r)=>{const m={Critical:{bg:'rgba(147,51,234,0.15)',c:ACCENT},High:{bg:'rgba(220,38,38,0.12)',c:T.red},Medium:{bg:'rgba(217,119,6,0.12)',c:T.amber},Low:{bg:'rgba(22,163,74,0.12)',c:T.green}};const s=m[r]||m.Low;return{background:s.bg,color:s.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};
  const kpi=(l,v,s)=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',flex:1,minWidth:150}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{l}</div><div style={{fontSize:24,fontWeight:700,color:T.navy,marginTop:4}}>{v}</div>{s&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{s}</div>}</div>);

  const SidePanel=({item,onClose})=>{if(!item)return null;
    const rd=[{axis:'Supply Chain',v:item.supplyChainRisk},{axis:'Financial',v:item.financialRisk},{axis:'Regulatory',v:item.regulatoryRisk},{axis:'Reputational',v:item.reputationalRisk},{axis:'Environmental',v:item.envContagion},{axis:'Social',v:item.socialContagion}];
    return(<div style={{position:'fixed',top:0,right:0,width:440,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}>
      <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{item.name}</div>
        <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
      </div>
      <div style={{padding:'16px 24px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
          {[['Materiality',item.materialityScore+'/100'],['Contagion Out',item.contagionOut],['Contagion In',item.contagionIn],['Centrality',item.networkCentrality],['Cluster Coeff',item.clusterCoeff],['Prop. Speed',item.propagationSpeed+' days'],['Amplification',item.amplification+'x'],['Direct Links',item.directLinks],['Indirect Links',item.indirectLinks],['Vulnerability',item.vulnerabilityIdx],['Resilience',item.resilienceScore],['Cascade Prob.',item.cascadeProbability+'%'],['Impact Mult.',item.impactMultiplier+'x'],['Importance',item.systemicImportance]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:600,color:T.navy,marginTop:2}}>{v}</div></div>))}
        </div>
        <div style={{height:240}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:6}}>CONTAGION CHANNEL RADAR</div>
          <ResponsiveContainer width="100%" height={220}><RadarChart data={rd}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="axis" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/><Radar dataKey="v" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15}/></RadarChart></ResponsiveContainer></div>
      </div>
    </div>);};

  const renderMap=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>{kpi('Entities',stats.count)}{kpi('Avg Contagion',stats.avgContagion+'/100')}{kpi('Critical/High',stats.critical)}{kpi('Avg Centrality',stats.avgCentrality)}{kpi('Avg Amplification',stats.avgAmplification+'x')}</div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search entities..." style={inpS}/>
      <select value={sectorF} onChange={e=>{setSectorF(e.target.value);setPage(1);}} style={selS}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
      <button onClick={()=>exportCSV(filtered,'dme_contagion.csv')} style={btnS(false)}>Export CSV</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SYSTEMIC IMPORTANCE DISTRIBUTION</div><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={impDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{impDist.map((_,i)=><Cell key={i} fill={[ACCENT,T.red,T.amber,T.green][i%4]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
      <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>OUTBOUND vs INBOUND CONTAGION</div><ResponsiveContainer width="100%" height={220}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Outbound" tick={{fontSize:10}}/><YAxis dataKey="y" name="Inbound" tick={{fontSize:10}}/><ZAxis dataKey="z" range={[20,200]}/><Tooltip {...tip}/><Scatter data={filtered.map(r=>({name:r.name,x:r.contagionOut,y:r.contagionIn,z:r.materialityScore*2}))} fill={ACCENT} fillOpacity={0.5}/></ScatterChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SECTOR CONTAGION FLOWS</div><ResponsiveContainer width="100%" height={240}><BarChart data={sectorContagion}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9}} angle={-15}/><YAxis tick={{fontSize:10}}/><Tooltip {...tip}/><Bar dataKey="outbound" fill={T.red} name="Outbound" radius={[2,2,0,0]}/><Bar dataKey="inbound" fill={T.navy} name="Inbound" radius={[2,2,0,0]}/><Legend/></BarChart></ResponsiveContainer></div>
      <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CONTAGION INDEX TREND</div><ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9}}/><YAxis tick={{fontSize:10}}/><Tooltip {...tip}/><Area type="monotone" dataKey="contagionIdx" stroke={ACCENT} fill={ACCENT} fillOpacity={0.1} name="Contagion Index"/><Legend/></AreaChart></ResponsiveContainer></div>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      {[['name','Entity'],['sector','Sector'],['contagionOut','Out'],['contagionIn','In'],['networkCentrality','Centrality'],['amplification','Amplif.'],['directLinks','Links'],['cascadeProbability','Cascade %'],['systemicImportance','Importance']].map(([col,label])=>(
        <th key={col} onClick={()=>doSort(col)} style={thS}>{label}{si(col,sortCol,sortDir)}</th>))}
    </tr></thead><tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
      <td style={{...tdS,fontWeight:600}}>{r.name}</td><td style={tdS}>{r.sector}</td>
      <td style={tdS}><span style={bdg(r.contagionOut,[30,55,75])}>{r.contagionOut}</span></td>
      <td style={tdS}><span style={bdg(r.contagionIn,[30,55,75])}>{r.contagionIn}</span></td>
      <td style={tdS}>{r.networkCentrality}</td><td style={tdS}>{r.amplification}x</td>
      <td style={tdS}>{r.directLinks}</td><td style={tdS}>{r.cascadeProbability}%</td>
      <td style={tdS}><span style={rBdg(r.systemicImportance)}>{r.systemicImportance}</span></td>
    </tr>))}</tbody></table>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
      <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} entities | Page {page}/{totalPages}</span>
      <div style={{display:'flex',gap:4}}><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pgB}>Prev</button><button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={pgB}>Next</button></div>
    </div></div>
  </div>);

  const renderPropagation=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>PROPAGATION CHANNEL WEIGHTS</div><ResponsiveContainer width="100%" height={260}><BarChart data={CHANNEL_DATA}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="channel" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip {...tip}/><Bar dataKey="weight" fill={ACCENT} name="Weight %" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
      <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SPEED vs REACH BY CHANNEL</div><ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Speed (days)" tick={{fontSize:10}}/><YAxis dataKey="y" name="Reach %" tick={{fontSize:10}}/><ZAxis dataKey="z" range={[40,200]}/><Tooltip {...tip}/><Scatter data={CHANNEL_DATA.map(r=>({name:r.channel,x:r.speed,y:r.reach,z:r.weight*5}))} fill={T.gold} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer></div>
    </div>
    <div style={{...cS,marginBottom:20}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>PROPAGATION SPEED & AMPLIFICATION TREND</div><ResponsiveContainer width="100%" height={240}><LineChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9}}/><YAxis tick={{fontSize:10}}/><Tooltip {...tip}/><Line type="monotone" dataKey="propagationSpeed" stroke={T.red} strokeWidth={2} name="Propagation Speed"/><Line type="monotone" dataKey="amplification" stroke={ACCENT} strokeWidth={2} name="Amplification"/><Legend/></LineChart></ResponsiveContainer></div>
    <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>NETWORK DENSITY EVOLUTION</div><ResponsiveContainer width="100%" height={220}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9}}/><YAxis tick={{fontSize:10}}/><Tooltip {...tip}/><Area type="monotone" dataKey="networkDensity" stroke={T.navy} fill={T.navy} fillOpacity={0.1} name="Network Density"/><Legend/></AreaChart></ResponsiveContainer></div>
  </div>);

  const renderLinkages=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>SECTOR CROSS-CONTAGION MATRIX</div><ResponsiveContainer width="100%" height={280}><BarChart data={sectorContagion}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9}} angle={-15}/><YAxis tick={{fontSize:10}}/><Tooltip {...tip}/><Bar dataKey="outbound" fill={T.red} name="Outbound Risk" stackId="a" radius={[0,0,0,0]}/><Bar dataKey="inbound" fill={T.navy} name="Inbound Risk" stackId="a" radius={[4,4,0,0]}/><Legend/></BarChart></ResponsiveContainer></div>
      <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>VULNERABILITY vs RESILIENCE</div><ResponsiveContainer width="100%" height={280}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Vulnerability" tick={{fontSize:10}}/><YAxis dataKey="y" name="Resilience" tick={{fontSize:10}}/><Tooltip {...tip}/><Scatter data={filtered.map(r=>({name:r.name,x:r.vulnerabilityIdx,y:r.resilienceScore}))} fill={ACCENT} fillOpacity={0.5}/></ScatterChart></ResponsiveContainer></div>
    </div>
    <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CHANNEL ANALYSIS TABLE</div>
      <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Channel','Weight %','Speed (days)','Reach %'].map(h=>(<th key={h} style={thS}>{h}</th>))}</tr></thead>
      <tbody>{CHANNEL_DATA.map((r,i)=>(<tr key={i}><td style={{...tdS,fontWeight:600}}>{r.channel}</td><td style={tdS}>{r.weight}%</td><td style={tdS}>{r.speed} days</td><td style={tdS}>{r.reach}%</td></tr>))}</tbody></table></div>
  </div>);

  const renderDeepDive=()=>{const item=selected||ENTITIES[0];
    const rd=[{axis:'Supply Chain',v:item.supplyChainRisk},{axis:'Financial',v:item.financialRisk},{axis:'Regulatory',v:item.regulatoryRisk},{axis:'Reputational',v:item.reputationalRisk},{axis:'Environmental',v:item.envContagion},{axis:'Social',v:item.socialContagion}];
    const hist=Array.from({length:12},(_,i)=>({month:`M-${12-i}`,contagion:Math.round(item.contagionOut*(0.7+sr(i*item.id)*0.6)),materiality:Math.round(item.materialityScore*(0.8+sr(i*item.id+20)*0.4))}));
    return(<div>
      <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:16}}>{item.name} -- Contagion Deep Dive</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:20}}>
        {[['Materiality',item.materialityScore],['Contagion Out',item.contagionOut],['Centrality',item.networkCentrality],['Amplification',item.amplification+'x'],['Cascade Prob.',item.cascadeProbability+'%'],['Vulnerability',item.vulnerabilityIdx],['Resilience',item.resilienceScore],['Importance',item.systemicImportance]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:8,padding:'10px 14px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:16,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CHANNEL RISK RADAR</div><ResponsiveContainer width="100%" height={260}><RadarChart data={rd}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="axis" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/><Radar dataKey="v" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2} strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
        <div style={cS}><div style={{fontSize:11,fontFamily:T.mono,color:T.textSec,marginBottom:8}}>CONTAGION HISTORY</div><ResponsiveContainer width="100%" height={260}><LineChart data={hist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip {...tip}/><Line type="monotone" dataKey="contagion" stroke={T.red} strokeWidth={2} name="Contagion"/><Line type="monotone" dataKey="materiality" stroke={ACCENT} strokeWidth={2} name="Materiality"/><Legend/></LineChart></ResponsiveContainer></div>
      </div>
    </div>);};

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
    <div style={{marginBottom:20}}><div style={{fontSize:22,fontWeight:700,color:T.navy}}>Dynamic Materiality Contagion</div><div style={{fontSize:12,color:T.textSec,marginTop:4,fontFamily:T.mono}}>ESG risk propagation network, contagion channels, cascade modeling</div></div>
    <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`}}>
      {TABS.map((t,i)=>(<button key={t} onClick={()=>setTab(i)} style={{...btnS(tab===i),borderRadius:'6px 6px 0 0',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent'}}>{t}</button>))}
    </div>
    {tab===0&&renderMap()}{tab===1&&renderPropagation()}{tab===2&&renderLinkages()}{tab===3&&renderDeepDive()}
    <SidePanel item={selected} onClose={()=>setSelected(null)}/>
  </div>);
}
