import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#92400e';
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Country Tracker','EUDR Compliance','Commodity Traceability'];
const REGIONS=['All','South America','Southeast Asia','Central Africa','West Africa','Central America','South Asia'];
const RISK_LEVELS=['All','Critical','High','Medium','Low'];
const PAGE_SIZE=10;

const COUNTRIES=(()=>{const names=['Brazil','Indonesia','DRC','Colombia','Bolivia','Peru','Malaysia','Myanmar','Laos','Cambodia','Papua New Guinea','Ivory Coast','Ghana','Cameroon','Liberia','Sierra Leone','Madagascar','Mozambique','Tanzania','Paraguay','Argentina','Mexico','Guatemala','Honduras','Nicaragua','Ecuador','Venezuela','Guyana','Suriname','Vietnam'];
  const regs=['South America','Southeast Asia','Central Africa','South America','South America','South America','Southeast Asia','Southeast Asia','Southeast Asia','Southeast Asia','Southeast Asia','West Africa','West Africa','Central Africa','West Africa','West Africa','Central Africa','Central Africa','Central Africa','South America','South America','Central America','Central America','Central America','Central America','South America','South America','South America','South America','Southeast Asia'];
  return names.map((n,i)=>({id:i+1,country:n,region:regs[i],annualLossKha:Math.round(50+sr(i*7)*4950),treecover2020:Math.round(30+sr(i*11)*60),primaryForestLoss:Math.round(10+sr(i*13)*2000),deforestationRate:+(0.1+sr(i*17)*4.5).toFixed(2),fireAlerts:Math.round(100+sr(i*19)*9900),miningConcessions:Math.round(sr(i*23)*500),palmOilArea:Math.round(sr(i*29)*3000),soyArea:Math.round(sr(i*31)*2000),cattleArea:Math.round(sr(i*37)*5000),eudrCompliance:Math.round(10+sr(i*41)*80),traceability:Math.round(5+sr(i*43)*85),zeroDFCommitments:Math.round(sr(i*47)*60),protectedAreaPct:Math.round(5+sr(i*53)*35),indigenousLand:Math.round(5+sr(i*59)*40),carbonStock:Math.round(500+sr(i*61)*9500),biodiversityIndex:Math.round(15+sr(i*67)*80),riskLevel:sr(i*7)<0.25?'Critical':sr(i*7)<0.5?'High':sr(i*7)<0.75?'Medium':'Low'}));})();

const COMMODITIES=[{name:'Palm Oil',volume:75e6,deforestationLink:42,traceability:38,certifiedPct:21,topCountries:'Indonesia, Malaysia, Nigeria'},{name:'Soy',volume:370e6,deforestationLink:28,traceability:45,certifiedPct:15,topCountries:'Brazil, Argentina, Paraguay'},{name:'Beef/Cattle',volume:72e6,deforestationLink:65,traceability:22,certifiedPct:8,topCountries:'Brazil, Paraguay, Argentina'},{name:'Cocoa',volume:5.5e6,deforestationLink:35,traceability:52,certifiedPct:45,topCountries:'Ivory Coast, Ghana, Indonesia'},{name:'Coffee',volume:10e6,deforestationLink:18,traceability:48,certifiedPct:38,topCountries:'Brazil, Vietnam, Colombia'},{name:'Rubber',volume:14e6,deforestationLink:24,traceability:28,certifiedPct:12,topCountries:'Thailand, Indonesia, Vietnam'},{name:'Timber',volume:400e6,deforestationLink:55,traceability:35,certifiedPct:20,topCountries:'Brazil, Indonesia, DRC'},{name:'Pulp & Paper',volume:190e6,deforestationLink:30,traceability:55,certifiedPct:35,topCountries:'Brazil, Indonesia, Chile'},{name:'Maize',volume:1200e6,deforestationLink:12,traceability:60,certifiedPct:5,topCountries:'US, Brazil, Argentina'},{name:'Sugar',volume:185e6,deforestationLink:15,traceability:42,certifiedPct:18,topCountries:'Brazil, India, Thailand'}];

const TREND=Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,alerts:Math.round(5000+sr(i*7)*10000),lossKha:Math.round(200+sr(i*11)*800),fires:Math.round(1000+sr(i*13)*5000),eudrActions:Math.round(sr(i*17)*15)}));

const badge=(val,thresholds)=>{const[lo,mid,hi]=thresholds;const bg=val>=hi?'rgba(220,38,38,0.12)':val>=mid?'rgba(217,119,6,0.12)':val>=lo?'rgba(197,169,106,0.12)':'rgba(22,163,74,0.12)';const c=val>=hi?T.red:val>=mid?T.amber:val>=lo?T.gold:T.green;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const rBadge=(r)=>{const m={Critical:{bg:'rgba(220,38,38,0.12)',c:T.red},High:{bg:'rgba(217,119,6,0.12)',c:T.amber},Medium:{bg:'rgba(197,169,106,0.15)',c:T.gold},Low:{bg:'rgba(22,163,74,0.12)',c:T.green}};return{background:(m[r]||m.Medium).bg,color:(m[r]||m.Medium).c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

export default function LandUseDeforestationPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[regionF,setRegionF]=useState('All');const[riskF,setRiskF]=useState('All');const[sortCol,setSortCol]=useState('annualLossKha');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[selected,setSelected]=useState(null);
  const[eSearch,setESearch]=useState('');const[eSort,setESort]=useState('eudrCompliance');const[eDir,setEDir]=useState('asc');const[ePage,setEPage]=useState(1);
  const[cSearch,setCSearch]=useState('');const[cSort,setCSort]=useState('deforestationLink');const[cDir,setCDir]=useState('desc');

  const filtered=useMemo(()=>{let d=[...COUNTRIES];if(search)d=d.filter(r=>r.country.toLowerCase().includes(search.toLowerCase()));if(regionF!=='All')d=d.filter(r=>r.region===regionF);if(riskF!=='All')d=d.filter(r=>r.riskLevel===riskF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,regionF,riskF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);const tP=Math.ceil(filtered.length/PAGE_SIZE);

  const eudrData=useMemo(()=>{let d=filtered.map(r=>({country:r.country,region:r.region,eudrCompliance:r.eudrCompliance,traceability:r.traceability,zeroDFCommitments:r.zeroDFCommitments,riskLevel:r.riskLevel}));if(eSearch)d=d.filter(r=>r.country.toLowerCase().includes(eSearch.toLowerCase()));d.sort((a,b)=>eDir==='asc'?(a[eSort]>b[eSort]?1:-1):(a[eSort]<b[eSort]?1:-1));return d;},[filtered,eSearch,eSort,eDir]);
  const ePaged=useMemo(()=>eudrData.slice((ePage-1)*PAGE_SIZE,ePage*PAGE_SIZE),[eudrData,ePage]);const eTP=Math.ceil(eudrData.length/PAGE_SIZE);

  const comFiltered=useMemo(()=>{let d=[...COMMODITIES];if(cSearch)d=d.filter(r=>r.name.toLowerCase().includes(cSearch.toLowerCase()));d.sort((a,b)=>cDir==='asc'?(a[cSort]>b[cSort]?1:-1):(a[cSort]<b[cSort]?1:-1));return d;},[cSearch,cSort,cDir]);

  const doSort=(c)=>{if(sortCol===c)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(c);setSortDir('desc');}setPage(1);};
  const doESort=(c)=>{if(eSort===c)setEDir(d=>d==='asc'?'desc':'asc');else{setESort(c);setEDir('desc');}setEPage(1);};
  const doCSort=(c)=>{if(cSort===c)setCDir(d=>d==='asc'?'desc':'asc');else{setCSort(c);setCDir('desc');}};

  const stats=useMemo(()=>({total:filtered.length,totalLoss:filtered.reduce((s,r)=>s+r.annualLossKha,0),critical:filtered.filter(r=>r.riskLevel==='Critical').length,avgEUDR:(filtered.reduce((s,r)=>s+r.eudrCompliance,0)/filtered.length||0).toFixed(1),totalFires:filtered.reduce((s,r)=>s+r.fireAlerts,0),avgBiodiversity:(filtered.reduce((s,r)=>s+r.biodiversityIndex,0)/filtered.length||0).toFixed(1)}),[filtered]);

  const riskDist=useMemo(()=>{const o=['Critical','High','Medium','Low'];const m={};filtered.forEach(r=>{m[r.riskLevel]=(m[r.riskLevel]||0)+1;});return o.filter(k=>m[k]).map(k=>({name:k,value:m[k]}));},[filtered]);
  const regionLoss=useMemo(()=>{const m={};filtered.forEach(r=>{m[r.region]=(m[r.region]||0)+r.annualLossKha;});return Object.entries(m).map(([k,v])=>({region:k,loss:v})).sort((a,b)=>b.loss-a.loss);},[filtered]);

  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const k=Object.keys(data[0]);const csv=[k.join(','),...data.map(r=>k.map(c=>`"${r[c]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);},[]);

  const si=(col,cur,dir)=>cur===col?(dir==='asc'?' ▲':' ▼'):' ○';
  const th={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left'};
  const td_={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inp={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const sel_={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnS=(a)=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer'});
  const pb={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};

  const Panel=({item,onClose})=>{if(!item)return null;return(<div style={{position:'fixed',top:0,right:0,width:420,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}>
    <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{item.country}</div><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button></div>
    <div style={{padding:'16px 24px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      {[['Annual Loss',item.annualLossKha+' kha'],['Tree Cover',item.treecover2020+'%'],['Primary Forest Loss',item.primaryForestLoss+' kha'],['Deforestation Rate',item.deforestationRate+'%'],['Fire Alerts',item.fireAlerts.toLocaleString()],['Mining Concessions',item.miningConcessions+' kha'],['Palm Oil Area',item.palmOilArea+' kha'],['Soy Area',item.soyArea+' kha'],['Cattle Area',item.cattleArea+' kha'],['EUDR Compliance',item.eudrCompliance+'%'],['Traceability',item.traceability+'%'],['Zero-DF Commits',item.zeroDFCommitments+'%'],['Protected Area',item.protectedAreaPct+'%'],['Indigenous Land',item.indigenousLand+'%'],['Carbon Stock',item.carbonStock+' MtC'],['Biodiversity',item.biodiversityIndex]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
    </div><span style={rBadge(item.riskLevel)}>{item.riskLevel}</span></div>
  </div>);};

  return(<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.border}`,background:T.surface}}><div style={{fontSize:20,fontWeight:700,color:T.navy}}>Land Use & Deforestation</div><div style={{fontSize:12,color:T.textSec,marginTop:2,fontFamily:T.mono}}>EUDR Compliance &middot; Commodity Traceability &middot; {COUNTRIES.length} Countries</div></div>
    <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:28}}>{TABS.map((t,i)=>(<button key={i} onClick={()=>{setTab(i);setSelected(null);}} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',background:'none',color:tab===i?ACCENT:T.textSec,fontWeight:tab===i?700:400,fontSize:12,cursor:'pointer'}}>{t}</button>))}</div>
    <div style={{padding:'20px 28px'}}>

    {tab===0&&(<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:20}}>
        {[['Countries',stats.total,T.navy],['Total Loss',(stats.totalLoss/1000).toFixed(0)+'K kha',T.red],['Critical Risk',stats.critical,ACCENT],['Avg EUDR',stats.avgEUDR+'%',T.gold],['Fire Alerts',(stats.totalFires/1000).toFixed(0)+'K',T.amber],['Avg Biodiversity',stats.avgBiodiversity,T.green]].map(([l,v,c],i)=>(<div key={i} style={card}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:16}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Alert Trend (36M)</div>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={5}/><YAxis tick={{fontSize:9}}/><Tooltip {...tip}/><Area type="monotone" dataKey="alerts" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Deforestation Alerts"/><Area type="monotone" dataKey="fires" stroke={T.amber} fill={T.amber} fillOpacity={0.1} name="Fire Alerts"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Risk Distribution</div>
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({name,value})=>`${name}: ${value}`} style={{fontSize:9}}>{riskDist.map((_,i)=>(<Cell key={i} fill={[T.red,T.amber,T.gold,T.green][i%4]}/>))}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Regional Forest Loss</div>
          <ResponsiveContainer width="100%" height={220}><BarChart data={regionLoss} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9}}/><YAxis dataKey="region" type="category" tick={{fontSize:8}} width={90}/><Tooltip {...tip}/><Bar dataKey="loss" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>)}

    {tab===1&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search countries..." style={inp}/>
        <select value={regionF} onChange={e=>{setRegionF(e.target.value);setPage(1);}} style={sel_}>{REGIONS.map(r=>(<option key={r}>{r}</option>))}</select>
        <select value={riskF} onChange={e=>{setRiskF(e.target.value);setPage(1);}} style={sel_}>{RISK_LEVELS.map(r=>(<option key={r}>{r}</option>))}</select>
        <button onClick={()=>exportCSV(filtered,'deforestation_countries.csv')} style={btnS(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length}</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['country','Country'],['region','Region'],['annualLossKha','Loss kha'],['deforestationRate','Rate%'],['fireAlerts','Fires'],['eudrCompliance','EUDR%'],['traceability','Trace%'],['biodiversityIndex','Biodiv.'],['riskLevel','Risk']].map(([k,l])=>(<th key={k} onClick={()=>doSort(k)} style={th}>{l}{si(k,sortCol,sortDir)}</th>))}
        </tr></thead><tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
          <td style={{...td_,fontWeight:600,color:T.navy}}>{r.country}</td><td style={td_}>{r.region}</td>
          <td style={td_}><span style={badge(r.annualLossKha,[500,1500,3000])}>{r.annualLossKha}</span></td>
          <td style={td_}>{r.deforestationRate}%</td><td style={td_}>{r.fireAlerts.toLocaleString()}</td>
          <td style={td_}>{r.eudrCompliance}%</td><td style={td_}>{r.traceability}%</td>
          <td style={td_}>{r.biodiversityIndex}</td><td style={td_}><span style={rBadge(r.riskLevel)}>{r.riskLevel}</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {page}/{tP}</span><button disabled={page>=tP} onClick={()=>setPage(p=>p+1)} style={pb}>Next</button></div>
      <Panel item={selected} onClose={()=>setSelected(null)}/>
    </div>)}

    {tab===2&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={eSearch} onChange={e=>{setESearch(e.target.value);setEPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(eudrData,'eudr_compliance.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{eudrData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['country','Country'],['region','Region'],['eudrCompliance','EUDR%'],['traceability','Traceability%'],['zeroDFCommitments','Zero-DF%'],['riskLevel','Risk']].map(([k,l])=>(<th key={k} onClick={()=>doESort(k)} style={th}>{l}{si(k,eSort,eDir)}</th>))}
        </tr></thead><tbody>{ePaged.map((r,i)=>(<tr key={i}><td style={{...td_,fontWeight:600,color:T.navy}}>{r.country}</td><td style={td_}>{r.region}</td><td style={td_}><span style={badge(r.eudrCompliance,[25,50,70])}>{r.eudrCompliance}%</span></td><td style={td_}>{r.traceability}%</td><td style={td_}>{r.zeroDFCommitments}%</td><td style={td_}><span style={rBadge(r.riskLevel)}>{r.riskLevel}</span></td></tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={ePage<=1} onClick={()=>setEPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {ePage}/{eTP}</span><button disabled={ePage>=eTP} onClick={()=>setEPage(p=>p+1)} style={pb}>Next</button></div>
    </div>)}

    {tab===3&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={cSearch} onChange={e=>setCSearch(e.target.value)} placeholder="Search commodities..." style={inp}/><button onClick={()=>exportCSV(comFiltered,'commodity_traceability.csv')} style={btnS(false)}>Export CSV</button></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,marginBottom:16}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Commodity'],['volume','Volume (t)'],['deforestationLink','Deforest.Link%'],['traceability','Traceability%'],['certifiedPct','Certified%'],['topCountries','Top Countries']].map(([k,l])=>(<th key={k} onClick={()=>doCSort(k)} style={th}>{l}{si(k,cSort,cDir)}</th>))}
        </tr></thead><tbody>{comFiltered.map((r,i)=>(<tr key={i}><td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{(r.volume/1e6).toFixed(1)}M</td><td style={td_}><span style={badge(r.deforestationLink,[15,30,50])}>{r.deforestationLink}%</span></td><td style={td_}>{r.traceability}%</td><td style={td_}>{r.certifiedPct}%</td><td style={{...td_,fontSize:10}}>{r.topCountries}</td></tr>))}</tbody></table>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Deforestation Link by Commodity</div>
          <ResponsiveContainer width="100%" height={280}><BarChart data={comFiltered} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9}}/><YAxis dataKey="name" type="category" tick={{fontSize:9}} width={80}/><Tooltip {...tip}/><Bar dataKey="deforestationLink" fill={ACCENT} name="Deforestation%" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Traceability vs Certified</div>
          <ResponsiveContainer width="100%" height={280}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Traceability%" tick={{fontSize:9}}/><YAxis dataKey="y" name="Certified%" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={comFiltered.map(r=>({name:r.name,x:r.traceability,y:r.certifiedPct}))} fill={ACCENT} fillOpacity={0.7}/></ScatterChart></ResponsiveContainer>
        </div>
      </div>
    </div>)}

    </div>
  </div>);
}
