import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';
import { REGULATORY_THRESHOLDS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#7c3aed';
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Company Readiness','ESRS Standards','Gap Analysis'];
const SECTORS=['All','Financial Services','Energy','Manufacturing','Technology','Healthcare','Consumer','Utilities','Real Estate','Mining'];
const READINESS=['All','Compliant','Mostly Ready','In Progress','Early Stage','Not Started'];
const PAGE_SIZE=15;

const ESRS_STANDARDS=[
  {id:'ESRS E1',name:'Climate Change',category:'Environmental',dataPoints:82,mandatory:true},
  {id:'ESRS E2',name:'Pollution',category:'Environmental',dataPoints:56,mandatory:false},
  {id:'ESRS E3',name:'Water & Marine Resources',category:'Environmental',dataPoints:48,mandatory:false},
  {id:'ESRS E4',name:'Biodiversity & Ecosystems',category:'Environmental',dataPoints:64,mandatory:false},
  {id:'ESRS E5',name:'Resource Use & Circular Economy',category:'Environmental',dataPoints:52,mandatory:false},
  {id:'ESRS S1',name:'Own Workforce',category:'Social',dataPoints:78,mandatory:true},
  {id:'ESRS S2',name:'Workers in Value Chain',category:'Social',dataPoints:45,mandatory:false},
  {id:'ESRS S3',name:'Affected Communities',category:'Social',dataPoints:42,mandatory:false},
  {id:'ESRS S4',name:'Consumers & End-Users',category:'Social',dataPoints:38,mandatory:false},
  {id:'ESRS G1',name:'Business Conduct',category:'Governance',dataPoints:34,mandatory:true},
  {id:'ESRS 1',name:'General Requirements',category:'Cross-Cutting',dataPoints:28,mandatory:true},
  {id:'ESRS 2',name:'General Disclosures',category:'Cross-Cutting',dataPoints:44,mandatory:true},
];

const COMPANIES=(()=>{
  const names=['Deutsche Bank','Allianz SE','Siemens AG','BASF SE','BMW AG','SAP SE','Adidas AG','Bayer AG','Daimler Truck','Infineon Tech','Volkswagen AG','Munich Re','Henkel AG','Merck KGaA','Continental AG','Fresenius SE','HeidelbergCement','RWE AG','E.ON SE','Deutsche Telekom','BNP Paribas','TotalEnergies','LVMH','Schneider Elec','Air Liquide','Danone SA','Engie SA','Veolia Environ','Saint-Gobain','Capgemini SE','Unilever plc','Shell plc','HSBC Holdings','AstraZeneca','Rio Tinto','BP plc','GSK plc','Barclays plc','Diageo plc','National Grid','Nestlé SA','Novartis AG','Roche Holding','UBS Group','ABB Ltd','Zurich Insur.','Holcim Ltd','Swiss Re','Swatch Group','Givaudan SA','ING Group','Philips NV','ASML Holding','Aegon NV','Heineken NV','Enel SpA','Eni SpA','Intesa Sanpaolo','Generali SpA','UniCredit SpA','Iberdrola SA','Banco Santander','Telefonica','Inditex SA','CaixaBank SA','Nordea Bank','Volvo Group','Ericsson AB','H&M Group','Atlas Copco','Orsted A/S','Maersk','Novo Nordisk','Carlsberg','Vestas Wind','KBC Group','ArcelorMittal','Solvay SA','UCB SA','Umicore SA'];
  const secs=['Financial Services','Financial Services','Manufacturing','Manufacturing','Manufacturing','Technology','Consumer','Healthcare','Manufacturing','Technology','Manufacturing','Financial Services','Consumer','Healthcare','Manufacturing','Healthcare','Mining','Energy','Utilities','Technology','Financial Services','Energy','Consumer','Manufacturing','Manufacturing','Consumer','Utilities','Utilities','Manufacturing','Technology','Consumer','Energy','Financial Services','Healthcare','Mining','Energy','Healthcare','Financial Services','Consumer','Utilities','Consumer','Healthcare','Healthcare','Financial Services','Manufacturing','Financial Services','Mining','Financial Services','Consumer','Manufacturing','Financial Services','Technology','Technology','Financial Services','Consumer','Utilities','Energy','Financial Services','Financial Services','Financial Services','Utilities','Financial Services','Technology','Consumer','Financial Services','Financial Services','Manufacturing','Technology','Consumer','Manufacturing','Energy','Manufacturing','Healthcare','Consumer','Energy','Financial Services','Mining','Manufacturing','Healthcare','Manufacturing'];
  return names.map((n,i)=>{const scores={};ESRS_STANDARDS.forEach((s,j)=>{scores[s.id]=Math.round(10+sr(i*7+j*13)*85);});
    return{id:i+1,name:n,sector:secs[i]||'Manufacturing',overallReadiness:Math.round(15+sr(i*7)*80),doubleMateriality:Math.round(10+sr(i*11)*85),dataCollectionPct:Math.round(20+sr(i*13)*75),gapsCritical:Math.floor(sr(i*17)*12),gapsMajor:Math.floor(sr(i*19)*18),gapsMinor:Math.floor(sr(i*23)*25),auditReadiness:Math.round(15+sr(i*29)*80),taxonomyAlignment:Math.round(5+sr(i*31)*60),valueChainMapping:Math.round(10+sr(i*37)*80),stakeholderEngagement:Math.round(20+sr(i*41)*75),reportingTimeline:sr(i*43)<0.3?'FY2024':sr(i*43)<0.6?'FY2025':'FY2026',assuranceLevel:sr(i*47)<0.4?'Limited':sr(i*47)<0.7?'Reasonable':'None',readinessRating:sr(i*7)<0.1?'Compliant':sr(i*7)<0.3?'Mostly Ready':sr(i*7)<0.55?'In Progress':sr(i*7)<0.8?'Early Stage':'Not Started',...scores};})();})();

const TREND=Array.from({length:18},(_,i)=>({month:`${2024+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgReadiness:Math.round(25+i*2.5+sr(i*7)*8),companiesReporting:Math.round(10+i*4+sr(i*11)*5),gapsClosed:Math.round(50+i*8+sr(i*13)*15)}));

const badge=(val,thresholds)=>{const[lo,mid,hi]=thresholds;const bg=val>=hi?'rgba(22,163,74,0.12)':val>=mid?'rgba(197,169,106,0.12)':val>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=val>=hi?T.green:val>=mid?T.gold:val>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const rBadge=(r)=>{const m={Compliant:{bg:'rgba(22,163,74,0.12)',c:T.green},'Mostly Ready':{bg:'rgba(90,138,106,0.12)',c:T.sage},'In Progress':{bg:'rgba(197,169,106,0.15)',c:T.gold},'Early Stage':{bg:'rgba(217,119,6,0.12)',c:T.amber},'Not Started':{bg:'rgba(220,38,38,0.12)',c:T.red}};const s=m[r]||m['Early Stage'];return{background:s.bg,color:s.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

export default function CsrdEsrsAutomationPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sectorF,setSectorF]=useState('All');const[readyF,setReadyF]=useState('All');const[sortCol,setSortCol]=useState('overallReadiness');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[selected,setSelected]=useState(null);
  const[sSearch,setSSearch]=useState('');const[gSearch,setGSearch]=useState('');const[gSort,setGSort]=useState('gapsCritical');const[gDir,setGDir]=useState('desc');const[gPage,setGPage]=useState(1);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);if(readyF!=='All')d=d.filter(r=>r.readinessRating===readyF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,readyF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);const tP=Math.ceil(filtered.length/PAGE_SIZE);

  const esrsFiltered=useMemo(()=>{let d=[...ESRS_STANDARDS];if(sSearch)d=d.filter(r=>r.name.toLowerCase().includes(sSearch.toLowerCase())||r.id.toLowerCase().includes(sSearch.toLowerCase()));return d;},[sSearch]);

  const gapData=useMemo(()=>{let d=filtered.map(r=>({name:r.name,sector:r.sector,gapsCritical:r.gapsCritical,gapsMajor:r.gapsMajor,gapsMinor:r.gapsMinor,totalGaps:r.gapsCritical+r.gapsMajor+r.gapsMinor,dataCollection:r.dataCollectionPct,readiness:r.overallReadiness}));if(gSearch)d=d.filter(r=>r.name.toLowerCase().includes(gSearch.toLowerCase()));d.sort((a,b)=>gDir==='asc'?(a[gSort]>b[gSort]?1:-1):(a[gSort]<b[gSort]?1:-1));return d;},[filtered,gSearch,gSort,gDir]);
  const gPaged=useMemo(()=>gapData.slice((gPage-1)*PAGE_SIZE,gPage*PAGE_SIZE),[gapData,gPage]);const gTP=Math.ceil(gapData.length/PAGE_SIZE);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(1);};
  const doGSort=(col)=>{if(gSort===col)setGDir(d=>d==='asc'?'desc':'asc');else{setGSort(col);setGDir('desc');}setGPage(1);};

  const stats=useMemo(()=>({total:filtered.length,avgReady:(filtered.reduce((s,r)=>s+r.overallReadiness,0)/filtered.length||0).toFixed(1),compliant:filtered.filter(r=>r.readinessRating==='Compliant'||r.readinessRating==='Mostly Ready').length,avgDM:(filtered.reduce((s,r)=>s+r.doubleMateriality,0)/filtered.length||0).toFixed(1),totalCritical:filtered.reduce((s,r)=>s+r.gapsCritical,0),avgData:(filtered.reduce((s,r)=>s+r.dataCollectionPct,0)/filtered.length||0).toFixed(1)}),[filtered]);

  const readyDist=useMemo(()=>{const o=['Compliant','Mostly Ready','In Progress','Early Stage','Not Started'];const m={};filtered.forEach(r=>{m[r.readinessRating]=(m[r.readinessRating]||0)+1;});return o.filter(k=>m[k]).map(k=>({name:k,value:m[k]}));},[filtered]);
  const sectorAvg=useMemo(()=>{const m={};filtered.forEach(r=>{if(!m[r.sector])m[r.sector]={s:0,c:0};m[r.sector].s+=r.overallReadiness;m[r.sector].c++;});return Object.entries(m).map(([k,v])=>({sector:k,avg:+(v.s/v.c).toFixed(1)})).sort((a,b)=>b.avg-a.avg);},[filtered]);

  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const k=Object.keys(data[0]);const csv=[k.join(','),...data.map(r=>k.map(c=>`"${r[c]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);},[]);

  const si=(col,cur,dir)=>cur===col?(dir==='asc'?' ▲':' ▼'):' ○';
  const th={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left'};
  const td_={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inp={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const sel_={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnS=(a)=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer'});
  const pb={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};

  const Panel=({item,onClose})=>{if(!item)return null;return(<div style={{position:'fixed',top:0,right:0,width:440,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}>
    <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{item.name}</div><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button></div>
    <div style={{padding:'16px 24px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        {[['Overall Readiness',item.overallReadiness+'%'],['Double Materiality',item.doubleMateriality+'%'],['Data Collection',item.dataCollectionPct+'%'],['Critical Gaps',item.gapsCritical],['Major Gaps',item.gapsMajor],['Minor Gaps',item.gapsMinor],['Audit Readiness',item.auditReadiness+'%'],['Taxonomy Alignment',item.taxonomyAlignment+'%'],['Value Chain Map',item.valueChainMapping+'%'],['Stakeholder Engage.',item.stakeholderEngagement+'%'],['Timeline',item.reportingTimeline],['Assurance',item.assuranceLevel]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:14,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
      </div>
      <span style={rBadge(item.readinessRating)}>{item.readinessRating}</span>
      <div style={{marginTop:16,fontSize:11,fontFamily:T.mono,color:T.textSec,fontWeight:600}}>ESRS Standard Scores</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
        {ESRS_STANDARDS.map(s=>(<div key={s.id} style={{display:'flex',justifyContent:'space-between',padding:'4px 8px',background:T.surfaceH,borderRadius:4}}><span style={{fontSize:10,color:T.textSec}}>{s.id}</span><span style={{fontSize:11,fontWeight:600,...badge(item[s.id],[25,50,70])}}>{item[s.id]}%</span></div>))}
      </div>
    </div>
  </div>);};

  return(<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.border}`,background:T.surface}}><div style={{fontSize:20,fontWeight:700,color:T.navy}}>CSRD / ESRS Compliance Automation</div><div style={{fontSize:12,color:T.textSec,marginTop:2,fontFamily:T.mono}}>Double Materiality &middot; {ESRS_STANDARDS.length} ESRS Standards &middot; {COMPANIES.length} Companies</div></div>
    <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:28}}>{TABS.map((t,i)=>(<button key={i} onClick={()=>{setTab(i);setSelected(null);}} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',background:'none',color:tab===i?ACCENT:T.textSec,fontWeight:tab===i?700:400,fontSize:12,cursor:'pointer'}}>{t}</button>))}</div>
    <div style={{padding:'20px 28px'}}>

    {tab===0&&(<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:20}}>
        {[['Companies',stats.total,T.navy],['Avg Readiness',stats.avgReady+'%',ACCENT],['Compliant/Ready',stats.compliant,T.green],['Avg Materiality',stats.avgDM+'%',T.sage],['Critical Gaps',stats.totalCritical,T.red],['Avg Data Coll.',stats.avgData+'%',T.gold]].map(([l,v,c],i)=>(<div key={i} style={card}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Readiness Trend (18M)</div>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={2}/><YAxis tick={{fontSize:9}}/><Tooltip {...tip}/><Area type="monotone" dataKey="avgReadiness" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} name="Avg Readiness%"/><Area type="monotone" dataKey="gapsClosed" stroke={T.green} fill={T.green} fillOpacity={0.1} name="Gaps Closed"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Readiness Distribution</div>
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={readyDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({name,value})=>`${name}: ${value}`} style={{fontSize:8}}>{readyDist.map((_,i)=>(<Cell key={i} fill={[T.green,T.sage,T.gold,T.amber,T.red][i%5]}/>))}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
        </div>
        <div style={card}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Sector Readiness</div>
          <ResponsiveContainer width="100%" height={220}><BarChart data={sectorAvg.slice(0,8)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9}} domain={[0,100]}/><YAxis dataKey="sector" type="category" tick={{fontSize:8}} width={85}/><Tooltip {...tip}/><Bar dataKey="avg" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>)}

    {tab===1&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search companies..." style={inp}/>
        <select value={sectorF} onChange={e=>{setSectorF(e.target.value);setPage(1);}} style={sel_}>{SECTORS.map(s=>(<option key={s}>{s}</option>))}</select>
        <select value={readyF} onChange={e=>{setReadyF(e.target.value);setPage(1);}} style={sel_}>{READINESS.map(r=>(<option key={r}>{r}</option>))}</select>
        <button onClick={()=>exportCSV(filtered,'csrd_readiness.csv')} style={btnS(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length}</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Company'],['sector','Sector'],['overallReadiness','Readiness%'],['doubleMateriality','DM%'],['dataCollectionPct','Data%'],['gapsCritical','Crit.Gaps'],['auditReadiness','Audit%'],['taxonomyAlignment','Taxonomy%'],['reportingTimeline','Timeline'],['readinessRating','Rating']].map(([k,l])=>(<th key={k} onClick={()=>doSort(k)} style={th}>{l}{si(k,sortCol,sortDir)}</th>))}
        </tr></thead><tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
          <td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.sector}</td>
          <td style={td_}><span style={badge(r.overallReadiness,[25,50,70])}>{r.overallReadiness}%</span></td>
          <td style={td_}>{r.doubleMateriality}%</td><td style={td_}>{r.dataCollectionPct}%</td>
          <td style={td_}><span style={{color:r.gapsCritical>5?T.red:r.gapsCritical>2?T.amber:T.green,fontWeight:700}}>{r.gapsCritical}</span></td>
          <td style={td_}>{r.auditReadiness}%</td><td style={td_}>{r.taxonomyAlignment}%</td><td style={td_}>{r.reportingTimeline}</td>
          <td style={td_}><span style={rBadge(r.readinessRating)}>{r.readinessRating}</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {page}/{tP}</span><button disabled={page>=tP} onClick={()=>setPage(p=>p+1)} style={pb}>Next</button></div>
      <Panel item={selected} onClose={()=>setSelected(null)}/>
    </div>)}

    {tab===2&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={sSearch} onChange={e=>setSSearch(e.target.value)} placeholder="Search standards..." style={inp}/><button onClick={()=>exportCSV(esrsFiltered,'esrs_standards.csv')} style={btnS(false)}>Export CSV</button></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,marginBottom:16}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {['Standard ID','Name','Category','Data Points','Mandatory','Avg Company Score'].map(l=>(<th key={l} style={th}>{l}</th>))}
        </tr></thead><tbody>{esrsFiltered.map(s=>{const avg=(filtered.reduce((sum,r)=>sum+(r[s.id]||0),0)/filtered.length||0).toFixed(1);return(<tr key={s.id}>
          <td style={{...td_,fontWeight:600,color:ACCENT,fontFamily:T.mono}}>{s.id}</td><td style={{...td_,fontWeight:600}}>{s.name}</td>
          <td style={td_}><span style={{padding:'2px 6px',borderRadius:4,fontSize:10,background:s.category==='Environmental'?'rgba(22,163,74,0.1)':s.category==='Social'?'rgba(14,165,233,0.1)':s.category==='Governance'?'rgba(124,58,237,0.1)':'rgba(197,169,106,0.1)',color:s.category==='Environmental'?T.green:s.category==='Social'?'#0ea5e9':s.category==='Governance'?ACCENT:T.gold}}>{s.category}</span></td>
          <td style={td_}>{s.dataPoints}</td><td style={td_}><span style={{color:s.mandatory?T.green:T.textMut,fontWeight:600}}>{s.mandatory?'Yes':'No'}</span></td>
          <td style={td_}><span style={badge(parseFloat(avg),[25,50,70])}>{avg}%</span></td>
        </tr>);})}</tbody></table>
      </div>
      <div style={{...card}}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Average Scores by Standard</div>
        <ResponsiveContainer width="100%" height={300}><BarChart data={ESRS_STANDARDS.map(s=>({name:s.id,avg:+(filtered.reduce((sum,r)=>sum+(r[s.id]||0),0)/filtered.length||0).toFixed(1)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}}/><YAxis tick={{fontSize:9}} domain={[0,100]}/><Tooltip {...tip}/><Bar dataKey="avg" fill={ACCENT} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
      </div>
    </div>)}

    {tab===3&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}><input value={gSearch} onChange={e=>{setGSearch(e.target.value);setGPage(1);}} placeholder="Search..." style={inp}/><button onClick={()=>exportCSV(gapData,'gap_analysis.csv')} style={btnS(false)}>Export CSV</button><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{gapData.length}</span></div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Company'],['sector','Sector'],['gapsCritical','Critical'],['gapsMajor','Major'],['gapsMinor','Minor'],['totalGaps','Total'],['dataCollection','Data%'],['readiness','Readiness%']].map(([k,l])=>(<th key={k} onClick={()=>doGSort(k)} style={th}>{l}{si(k,gSort,gDir)}</th>))}
        </tr></thead><tbody>{gPaged.map((r,i)=>(<tr key={i}>
          <td style={{...td_,fontWeight:600,color:T.navy}}>{r.name}</td><td style={td_}>{r.sector}</td>
          <td style={td_}><span style={{color:r.gapsCritical>5?T.red:T.amber,fontWeight:700}}>{r.gapsCritical}</span></td>
          <td style={td_}>{r.gapsMajor}</td><td style={td_}>{r.gapsMinor}</td><td style={td_}>{r.totalGaps}</td>
          <td style={td_}>{r.dataCollection}%</td><td style={td_}><span style={badge(r.readiness,[25,50,70])}>{r.readiness}%</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><button disabled={gPage<=1} onClick={()=>setGPage(p=>p-1)} style={pb}>Prev</button><span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {gPage}/{gTP}</span><button disabled={gPage>=gTP} onClick={()=>setGPage(p=>p+1)} style={pb}>Next</button></div>
      <div style={{...card,marginTop:16}}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Gaps vs Readiness</div>
        <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Total Gaps" tick={{fontSize:9}}/><YAxis dataKey="y" name="Readiness%" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={gapData.map(r=>({name:r.name,x:r.totalGaps,y:r.readiness}))} fill={ACCENT} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
      </div>
    </div>)}

    </div>
  </div>);
}
