import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,ScatterChart,Scatter,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#059669';const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,T.sageL,'#8b5cf6','#ec4899','#06b6d4'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['Agreement Dashboard','ITMO Registry','Market Analytics','Methodology'];
const STATUSES=['All','Active','Pending','Completed','Suspended'];const PAGE=10;

const BUYERS=['Switzerland','Japan','Sweden','Singapore','South Korea','Norway','Germany','Netherlands','UK','Canada','Denmark','Finland','Austria','Luxembourg','Belgium'];
const SELLERS=['Ghana','Peru','Thailand','Senegal','Georgia','Dominica','Vanuatu','Rwanda','Bangladesh','Nepal','Mozambique','Morocco','Chile','Colombia','Vietnam','Kenya','Costa Rica','Uruguay','Paraguay','Cambodia','Sri Lanka','Uganda','Ethiopia','Tanzania','Philippines','Indonesia','Mexico','Malawi','Zambia','Fiji'];
const SECTORS=['Renewable Energy','Forestry','Energy Efficiency','Waste Management','Transport','Agriculture','Blue Carbon','Industrial Process','Cookstoves','Methane Capture'];

const AGREEMENTS=Array.from({length:30},(_,i)=>{
  const buyer=BUYERS[Math.floor(sr(i*7)*BUYERS.length)];const seller=SELLERS[i%SELLERS.length];const sector=SECTORS[Math.floor(sr(i*11)*SECTORS.length)];
  const type=sr(i*13)<0.5?'Art 6.2':'Art 6.4';const status=['Active','Active','Active','Pending','Completed','Suspended'][Math.floor(sr(i*17)*6)];
  const vol=Math.round(sr(i*19)*50+2);const price=+(sr(i*23)*30+5).toFixed(1);const coSdg=Math.round(sr(i*31)*8+1);
  const vintage=2022+Math.floor(sr(i*37)*4);const ca=sr(i*41)>0.4;
  const quarterly=Array.from({length:8},(_,q)=>({q:`Q${(q%4)+1} ${2023+Math.floor(q/4)}`,issued:Math.round(vol/8+sr(i*100+q)*3),transferred:Math.round(vol/10+sr(i*100+q*3)*2),price:+(price+sr(i*100+q*7)*5-2.5).toFixed(1)}));
  return{id:i+1,buyer,seller,sector,type,status,volumeMt:vol,priceUSD:price,totalValueM:+(vol*price).toFixed(1),correspondingAdj:ca?'Yes':'No',coAdaptation:sr(i*29)>0.5?'Yes':'No',sdgCount:coSdg,vintage,shareOfProceeds:type==='Art 6.4'?5:0,methodology:['CDM','VCS','Gold Standard','JCM','REDD+','CAR'][Math.floor(sr(i*43)*6)],verifier:['DNV','SGS','RINA','Bureau Veritas','TUV SUD'][Math.floor(sr(i*47)*5)],startYear:2022+Math.floor(sr(i*49)*3),endYear:2027+Math.floor(sr(i*51)*4),crediting:Math.round(sr(i*53)*15+5)+'yr',monitoringFreq:sr(i*57)<0.5?'Annual':'Biennial',envIntegrity:Math.round(sr(i*59)*40+60),additionality:Math.round(sr(i*61)*30+70),permanence:Math.round(sr(i*63)*35+65),transparency:Math.round(sr(i*67)*25+75),quarterly};
});

const ITMOS=Array.from({length:60},(_,i)=>{const a=AGREEMENTS[i%30];return{id:i+1,serialNo:`ITMO-${2023+Math.floor(i/20)}-${String(i+1).padStart(4,'0')}`,buyer:a.buyer,seller:a.seller,agreementId:a.id,sector:a.sector,vintage:2022+Math.floor(sr(i*71)*3),volume:Math.round(sr(i*73)*5+0.5),status:['Authorised','Transferred','Used','Cancelled'][Math.floor(sr(i*77)*4)],firstTransfer:sr(i*79)>0.3?'Yes':'No',ca:a.correspondingAdj,methodology:a.methodology};});

export default function Article6MarketsPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[statusF,setStatusF]=useState('All');const[typeF,setTypeF]=useState('All');const[sortCol,setSortCol]=useState('totalValueM');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[selected,setSelected]=useState(null);const[itmSearch,setItmSearch]=useState('');const[itmPage,setItmPage]=useState(1);

  const filtered=useMemo(()=>{let d=[...AGREEMENTS];if(search)d=d.filter(r=>r.buyer.toLowerCase().includes(search.toLowerCase())||r.seller.toLowerCase().includes(search.toLowerCase()));if(statusF!=='All')d=d.filter(r=>r.status===statusF);if(typeF!=='All')d=d.filter(r=>r.type===typeF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,statusF,typeF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);
  const doSort=col=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(1);};

  const stats=useMemo(()=>({count:filtered.length,totalVol:filtered.reduce((s,r)=>s+r.volumeMt,0),totalVal:filtered.reduce((s,r)=>s+r.totalValueM,0).toFixed(0),avgPrice:(filtered.reduce((s,r)=>s+r.priceUSD,0)/filtered.length||0).toFixed(1),active:filtered.filter(r=>r.status==='Active').length,art62:filtered.filter(r=>r.type==='Art 6.2').length,caCount:filtered.filter(r=>r.correspondingAdj==='Yes').length}),[filtered]);

  const sectorVol=useMemo(()=>{const m={};AGREEMENTS.forEach(r=>{m[r.sector]=(m[r.sector]||0)+r.volumeMt;});return Object.entries(m).map(([k,v])=>({sector:k,volume:v})).sort((a,b)=>b.volume-a.volume);},[]);
  const buyerRank=useMemo(()=>{const m={};AGREEMENTS.forEach(r=>{if(!m[r.buyer])m[r.buyer]={buyer:r.buyer,vol:0,val:0,n:0};m[r.buyer].vol+=r.volumeMt;m[r.buyer].val+=r.totalValueM;m[r.buyer].n++;});return Object.values(m).sort((a,b)=>b.vol-a.vol);},[]);
  const priceHistory=useMemo(()=>{const qs={};AGREEMENTS.forEach(a=>a.quarterly.forEach(q=>{if(!qs[q.q])qs[q.q]={q:q.q,prices:[],vol:0};qs[q.q].prices.push(q.price);qs[q.q].vol+=q.issued;}));return Object.values(qs).map(q=>({q:q.q,avgPrice:+(q.prices.reduce((s,p)=>s+p,0)/q.prices.length).toFixed(1),volume:q.vol}));},[]);
  const typeDist=useMemo(()=>[{name:'Art 6.2',value:filtered.filter(r=>r.type==='Art 6.2').length},{name:'Art 6.4',value:filtered.filter(r=>r.type==='Art 6.4').length}],[filtered]);

  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='quarterly');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);},[]);

  const si=(col,cur,dir)=>cur===col?(dir==='asc'?' \u25B2':' \u25BC'):' \u25CB';
  const thS={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left',background:T.surfaceH};
  const tdS={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inpS={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const selS={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnS=a=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer',fontWeight:a?600:400});
  const pgB={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const cS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};
  const stBdg=s=>({background:s==='Active'?'rgba(22,163,74,0.1)':s==='Pending'?'rgba(217,119,6,0.1)':s==='Completed'?'rgba(27,58,92,0.1)':'rgba(220,38,38,0.1)',color:s==='Active'?T.green:s==='Pending'?T.amber:s==='Completed'?T.navy:T.red,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600});
  const kpi=(l,v,c)=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',flex:1,minWidth:140}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c||T.navy,marginTop:4}}>{v}</div></div>);

  const Panel=({item,onClose})=>{if(!item)return null;return(<div style={{position:'fixed',top:0,right:0,width:460,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}><div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{item.buyer} \u2192 {item.seller}</div><div style={{fontSize:12,color:T.textSec}}>{item.type} | {item.sector}</div></div><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>\u2715</button></div>
    <div style={{padding:'16px 24px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>{[['Volume',item.volumeMt+' Mt'],['Price','$'+item.priceUSD],['Value','$'+item.totalValueM+'M'],['Status',item.status],['Vintage',item.vintage],['CA',item.correspondingAdj],['SDGs',item.sdgCount],['Methodology',item.methodology],['Verifier',item.verifier],['Env Integrity',item.envIntegrity+'/100'],['Additionality',item.additionality+'/100'],['Permanence',item.permanence+'/100'],['Transparency',item.transparency+'/100'],['Crediting',item.crediting],['Monitoring',item.monitoringFreq]].map(([k,v],j)=>(<div key={j} style={{background:T.surfaceH,borderRadius:6,padding:'8px 10px'}}><div style={{fontSize:9,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:13,fontWeight:600,color:T.navy,marginTop:2}}>{v}</div></div>))}</div>
      <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Quarterly Issuance & Price</div><ResponsiveContainer width="100%" height={200}><BarChart data={item.quarterly}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="q" tick={{fontSize:8,fill:T.textSec}}/><YAxis yAxisId="l" tick={{fontSize:9,fill:T.textSec}}/><YAxis yAxisId="r" orientation="right" tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Bar yAxisId="l" dataKey="issued" fill={T.sage} name="Issued Mt"/><Bar yAxisId="r" dataKey="transferred" fill={T.gold} name="Transferred"/><Legend/></BarChart></ResponsiveContainer></div>
      <div style={{...cS,marginTop:12}}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Quality Radar</div><ResponsiveContainer width="100%" height={220}><RadarChart data={[{m:'Env Integrity',v:item.envIntegrity},{m:'Additionality',v:item.additionality},{m:'Permanence',v:item.permanence},{m:'Transparency',v:item.transparency},{m:'Co-benefits',v:item.sdgCount*10}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(5,150,105,0.2)"/></RadarChart></ResponsiveContainer></div>
    </div></div>);};

  const renderDash=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>{kpi('Agreements',stats.count)}{kpi('Total Volume',stats.totalVol+' Mt')}{kpi('Total Value','$'+stats.totalVal+'M')}{kpi('Avg Price','$'+stats.avgPrice+'/t')}{kpi('Active',stats.active,T.green)}{kpi('Art 6.2',stats.art62)}{kpi('CA Applied',stats.caCount)}</div>
    <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search buyer or seller..." style={inpS}/><select value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}} style={selS}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select><select value={typeF} onChange={e=>{setTypeF(e.target.value);setPage(1);}} style={selS}><option>All</option><option>Art 6.2</option><option>Art 6.4</option></select><button onClick={()=>exportCSV(filtered,'article6_agreements.csv')} style={btnS(false)}>Export CSV</button></div>
    <div style={{overflowX:'auto',...cS,padding:0}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{[['buyer','Buyer'],['seller','Seller'],['type','Type'],['sector','Sector'],['volumeMt','Vol Mt'],['priceUSD','$/t'],['totalValueM','Value $M'],['status','Status'],['envIntegrity','Integrity']].map(([k,l])=><th key={k} onClick={()=>doSort(k)} style={thS}>{l}{si(k,sortCol,sortDir)}</th>)}</tr></thead>
      <tbody>{paged.map(r=><tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}><td style={tdS}><span style={{fontWeight:600}}>{r.buyer}</span></td><td style={tdS}>{r.seller}</td><td style={{...tdS,fontFamily:T.mono,fontSize:10}}>{r.type}</td><td style={tdS}>{r.sector}</td><td style={tdS}>{r.volumeMt}</td><td style={tdS}>${r.priceUSD}</td><td style={tdS}>${r.totalValueM}M</td><td style={tdS}><span style={stBdg(r.status)}>{r.status}</span></td><td style={tdS}>{r.envIntegrity}/100</td></tr>)}</tbody></table></div>
    {totalPages>1&&<div style={{display:'flex',gap:6,marginTop:12,alignItems:'center',justifyContent:'center'}}><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={pgB}>&laquo;</button><span style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>Page {page}/{totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={pgB}>&raquo;</button></div>}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:20}}>
      <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Volume by Sector</div><ResponsiveContainer width="100%" height={260}><BarChart data={sectorVol}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:8,fill:T.textSec}} angle={-25}/><YAxis tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="volume" fill={ACCENT} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
      <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Art 6.2 vs 6.4 Split</div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={typeDist} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{typeDist.map((_,i)=><Cell key={i} fill={[T.navy,T.gold][i]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
  </div>);

  const renderITMO=()=>{
    const fi=ITMOS.filter(r=>!itmSearch||r.serialNo.toLowerCase().includes(itmSearch.toLowerCase())||r.buyer.toLowerCase().includes(itmSearch.toLowerCase()));
    const ip=fi.slice((itmPage-1)*12,itmPage*12);const tp=Math.ceil(fi.length/12);
    const statusDist=[{name:'Authorised',value:ITMOS.filter(r=>r.status==='Authorised').length},{name:'Transferred',value:ITMOS.filter(r=>r.status==='Transferred').length},{name:'Used',value:ITMOS.filter(r=>r.status==='Used').length},{name:'Cancelled',value:ITMOS.filter(r=>r.status==='Cancelled').length}];
    return(<div>
      <div style={{display:'flex',gap:12,marginBottom:16}}><input value={itmSearch} onChange={e=>{setItmSearch(e.target.value);setItmPage(1);}} placeholder="Search ITMOs..." style={inpS}/><button onClick={()=>exportCSV(fi,'itmo_registry.csv')} style={btnS(false)}>Export CSV</button></div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        <div style={{overflowX:'auto',...cS,padding:0}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Serial','Buyer','Seller','Sector','Vintage','Volume','Status','CA'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead><tbody>{ip.map(r=><tr key={r.id}><td style={{...tdS,fontFamily:T.mono,fontSize:10}}>{r.serialNo}</td><td style={tdS}>{r.buyer}</td><td style={tdS}>{r.seller}</td><td style={tdS}>{r.sector}</td><td style={tdS}>{r.vintage}</td><td style={tdS}>{r.volume} Mt</td><td style={tdS}><span style={stBdg(r.status==='Cancelled'?'Suspended':r.status==='Used'?'Completed':'Active')}>{r.status}</span></td><td style={tdS}>{r.ca}</td></tr>)}</tbody></table>
          {tp>1&&<div style={{display:'flex',gap:6,padding:12,justifyContent:'center'}}><button onClick={()=>setItmPage(p=>Math.max(1,p-1))} disabled={itmPage===1} style={pgB}>&laquo;</button><span style={{fontSize:11,color:T.textSec}}>{itmPage}/{tp}</span><button onClick={()=>setItmPage(p=>Math.min(tp,p+1))} disabled={itmPage===tp} style={pgB}>&raquo;</button></div>}
        </div>
        <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>ITMO Status Distribution</div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={statusDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{statusDist.map((_,i)=><Cell key={i} fill={COLORS[i]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
      </div>
    </div>);
  };

  const renderMarket=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Price Trend (Quarterly Avg)</div><ResponsiveContainer width="100%" height={280}><LineChart data={priceHistory}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="q" tick={{fontSize:8,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Line type="monotone" dataKey="avgPrice" stroke={T.gold} strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer></div>
      <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Issuance Volume Trend</div><ResponsiveContainer width="100%" height={280}><AreaChart data={priceHistory}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="q" tick={{fontSize:8,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Area type="monotone" dataKey="volume" stroke={ACCENT} fill="rgba(5,150,105,0.15)"/></AreaChart></ResponsiveContainer></div>
      <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Top Buyers by Volume</div><ResponsiveContainer width="100%" height={280}><BarChart data={buyerRank.slice(0,10)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textSec}}/><YAxis type="category" dataKey="buyer" tick={{fontSize:9,fill:T.textSec}} width={80}/><Tooltip {...tip}/><Bar dataKey="vol" fill={T.navy} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
      <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Price vs Volume Scatter</div><ResponsiveContainer width="100%" height={280}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Volume" tick={{fontSize:9,fill:T.textSec}}/><YAxis dataKey="y" name="Price" tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Scatter data={AGREEMENTS.map(a=>({name:a.buyer+'-'+a.seller,x:a.volumeMt,y:a.priceUSD}))} fill={T.gold} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer></div>
    </div>
  </div>);

  const renderMethod=()=>{
    const methodDist=[];const md={};AGREEMENTS.forEach(a=>{md[a.methodology]=(md[a.methodology]||0)+1;});Object.entries(md).forEach(([k,v])=>methodDist.push({name:k,value:v}));
    const verifierDist=[];const vd={};AGREEMENTS.forEach(a=>{vd[a.verifier]=(vd[a.verifier]||0)+1;});Object.entries(vd).forEach(([k,v])=>verifierDist.push({name:k,value:v}));
    const qualityMetrics=AGREEMENTS.slice(0,15).map(a=>({name:a.buyer.slice(0,3)+'-'+a.seller.slice(0,3),integrity:a.envIntegrity,additionality:a.additionality,permanence:a.permanence,transparency:a.transparency}));
    return(<div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Methodology Distribution</div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={methodDist} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{methodDist.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
        <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Verifier Coverage</div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={verifierDist} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{verifierDist.map((_,i)=><Cell key={i} fill={COLORS[(i+3)%COLORS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
        <div style={{...cS,gridColumn:'1/3'}}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Quality Score Comparison</div><ResponsiveContainer width="100%" height={300}><BarChart data={qualityMetrics}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}}/><YAxis domain={[0,100]} tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="integrity" fill={T.navy} name="Env Integrity"/><Bar dataKey="additionality" fill={T.sage} name="Additionality"/><Bar dataKey="permanence" fill={T.gold} name="Permanence"/><Bar dataKey="transparency" fill={T.amber} name="Transparency"/><Legend/></BarChart></ResponsiveContainer></div>
      </div>
    </div>);
  };

  return(<div style={{padding:'24px 32px',fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
    <div style={{marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Article 6 Markets Intelligence</h1><p style={{fontSize:12,color:T.textSec,margin:'4px 0 0'}}>30 bilateral agreements | ITMO registry | Art 6.2 & 6.4 | Market analytics</p></div>
    <div style={{display:'flex',gap:8,marginBottom:20}}>{TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={btnS(tab===i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderITMO()}{tab===2&&renderMarket()}{tab===3&&renderMethod()}
    <Panel item={selected} onClose={()=>setSelected(null)}/>
  </div>);
}