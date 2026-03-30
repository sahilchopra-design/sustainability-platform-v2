import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#16a34a';
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Company Screening','Material Flow','Waste Analytics'];
const SECTORS=['All','Consumer Goods','Packaging','Electronics','Automotive','Textiles','Construction','Food & Bev','Chemicals','Metals','Plastics'];
const RATINGS=['All','Leader','Advanced','Progressing','Developing','Lagging'];
const PAGE_SIZE=15;
const PIECLRS=[T.green,T.sage,T.gold,T.amber,T.navy,T.navyL,T.red,'#8b5cf6','#0891b2','#be185d'];
const badge=(val,th)=>{const[lo,mid,hi]=th;const bg=val>=hi?'rgba(22,163,74,0.12)':val>=mid?'rgba(197,169,106,0.12)':val>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=val>=hi?T.green:val>=mid?T.gold:val>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const ratBadge=(r)=>{const m={Leader:{bg:'rgba(22,163,74,0.12)',c:T.green},Advanced:{bg:'rgba(90,138,106,0.12)',c:T.sage},Progressing:{bg:'rgba(197,169,106,0.15)',c:T.gold},Developing:{bg:'rgba(217,119,6,0.12)',c:T.amber},Lagging:{bg:'rgba(220,38,38,0.12)',c:T.red}};const s=m[r]||m.Developing;return{background:s.bg,color:s.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

const COMPANIES=(()=>{const names=['Unilever plc','Nestle SA','Procter & Gamble','IKEA Group','Patagonia Inc','H&M Group','Interface Inc','Philips NV','Renault Group','Veolia Environ','DS Smith plc','Smurfit Kappa','Ball Corp','Amcor plc','Berry Global','Tetra Pak','Apple Inc','Samsung Elec','Dell Technologies','HP Inc','Cisco Systems','Nike Inc','Adidas AG','Inditex SA','Levi Strauss','PepsiCo Inc','Coca-Cola Co','Danone SA','Mondelez Intl','Mars Inc','BASF SE','Dow Inc','Eastman Chemical','Novelis Inc','Hydro ASA','ArcelorMittal','Nucor Corp','Caterpillar Inc','Toyota Motor','BMW AG','Stellantis NV','Volvo Group','LafargeHolcim','CRH plc','Saint-Gobain','Kingfisher plc','Henkel AG','Reckitt plc','Colgate-Palmolive','Church & Dwight','Sealed Air','Sonoco Products','Graphic Packaging','WestRock Co','International Paper','Kimberly-Clark','Georgia-Pacific','Cascades Inc','Brambles Ltd','Loop Industries'];
const secs=['Consumer Goods','Consumer Goods','Consumer Goods','Consumer Goods','Textiles','Textiles','Construction','Electronics','Automotive','Chemicals','Packaging','Packaging','Packaging','Packaging','Packaging','Packaging','Electronics','Electronics','Electronics','Electronics','Electronics','Textiles','Textiles','Textiles','Textiles','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Chemicals','Chemicals','Chemicals','Metals','Metals','Metals','Metals','Automotive','Automotive','Automotive','Automotive','Automotive','Construction','Construction','Construction','Consumer Goods','Consumer Goods','Consumer Goods','Consumer Goods','Consumer Goods','Packaging','Packaging','Packaging','Packaging','Packaging','Consumer Goods','Packaging','Packaging','Packaging','Plastics'];
return names.map((n,i)=>({id:i+1,name:n,sector:secs[i]||'Consumer Goods',circularityScore:Math.round(10+sr(i*7)*80),wasteDiv:Math.round(15+sr(i*11)*80),recycledInput:Math.round(5+sr(i*13)*70),recyclability:Math.round(20+sr(i*17)*75),reusePct:Math.round(sr(i*19)*45),compostPct:Math.round(sr(i*23)*30),landfillPct:Math.round(5+sr(i*29)*50),waterRecycle:Math.round(10+sr(i*31)*80),energyRecovery:Math.round(sr(i*37)*40),materialEfficiency:Math.round(30+sr(i*41)*60),eprCompliance:Math.round(40+sr(i*43)*55),designCircularity:Math.round(15+sr(i*47)*75),productLifeExt:Math.round(sr(i*53)*60),reverseLogistics:Math.round(10+sr(i*59)*70),totalWaste:Math.round(100+sr(i*61)*9900),diverted:Math.round(50+sr(i*67)*5000),rating:sr(i*7)<0.15?'Leader':sr(i*7)<0.35?'Advanced':sr(i*7)<0.55?'Progressing':sr(i*7)<0.8?'Developing':'Lagging'}));})();

const MATERIALS=[{name:'Plastics',recycled:32,virgin:68,flow:4200},{name:'Paper/Card',recycled:65,virgin:35,flow:3800},{name:'Glass',recycled:42,virgin:58,flow:1200},{name:'Metals',recycled:58,virgin:42,flow:2600},{name:'Textiles',recycled:12,virgin:88,flow:900},{name:'Electronics',recycled:18,virgin:82,flow:1500},{name:'Organics',recycled:45,virgin:55,flow:2200},{name:'Construction',recycled:35,virgin:65,flow:5100},{name:'Chemicals',recycled:8,virgin:92,flow:1800},{name:'Rubber',recycled:22,virgin:78,flow:600}];
const TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,circularity:Math.round(22+i*0.8+sr(i*7)*8),wasteDiv:Math.round(35+i*0.6+sr(i*11)*10),recycled:Math.round(18+i*0.7+sr(i*13)*6),landfill:Math.round(45-i*0.5+sr(i*17)*8)}));
const WASTE_TYPES=[{type:'Recycled',value:38},{type:'Composted',value:12},{type:'Energy Recovery',value:15},{type:'Landfill',value:28},{type:'Incinerated',value:7}];

const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};
const KPI=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);

export default function CircularEconomyTrackerPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sector,setSector]=useState('All');const[ratingF,setRatingF]=useState('All');
  const[sortCol,setSortCol]=useState('circularityScore');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sector!=='All')d=d.filter(r=>r.sector===sector);if(ratingF!=='All')d=d.filter(r=>r.rating===ratingF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sector,ratingF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  const kpis=useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return{avgCirc:avg('circularityScore'),avgDiv:avg('wasteDiv'),avgRecInput:avg('recycledInput'),leaders:COMPANIES.filter(c=>c.rating==='Leader'||c.rating==='Advanced').length,avgLandfill:avg('landfillPct')};},[]);
  const sectorChart=useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,avgCirc:0,avgDiv:0,n:0};m[c.sector].avgCirc+=c.circularityScore;m[c.sector].avgDiv+=c.wasteDiv;m[c.sector].n++;});return Object.values(m).map(s=>({...s,avgCirc:Math.round(s.avgCirc/s.n),avgDiv:Math.round(s.avgDiv/s.n)}));},[]);
  const ratingDist=useMemo(()=>{const m={};COMPANIES.forEach(c=>{m[c.rating]=(m[c.rating]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);
  const radarData=useMemo(()=>{const dims=['circularityScore','wasteDiv','recycledInput','recyclability','materialEfficiency','designCircularity'];const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return dims.map(d=>({dim:d.replace(/([A-Z])/g,' $1').trim(),value:avg(d),fullMark:100}));},[]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},sub:{fontSize:13,color:T.textSec,marginBottom:20},tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(22,163,74,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},th:(col,sc,sd)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sc===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16}};
  const TH=({col,label,sc,sd,fn})=><th style={ss.th(col,sc,sd)} onClick={()=>fn(col)}>{label}{sc===col?(sd==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const renderDash=()=>(<>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <KPI label="Avg Circularity" value={kpis.avgCirc+'%'} sub="across 60 companies" color={ACCENT}/>
      <KPI label="Waste Diversion" value={kpis.avgDiv+'%'} sub="from landfill" color={T.sage}/>
      <KPI label="Recycled Input" value={kpis.avgRecInput+'%'} sub="avg material input" color={T.navy}/>
      <KPI label="Leaders/Advanced" value={kpis.leaders} sub="top-rated" color={T.gold}/>
      <KPI label="Landfill Rate" value={kpis.avgLandfill+'%'} sub="avg to landfill" color={T.red}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Circularity by Sector</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={sectorChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="avgCirc" fill={ACCENT} radius={[4,4,0,0]} name="Circularity %"/><Bar dataKey="avgDiv" fill={T.navy} radius={[4,4,0,0]} name="Diversion %"/></BarChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Rating Distribution</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={ratingDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{ratingDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Circularity Trend</div>
        <ResponsiveContainer width="100%" height={240}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="circularity" stroke={ACCENT} fill="rgba(22,163,74,0.1)" name="Circularity %"/><Area type="monotone" dataKey="wasteDiv" stroke={T.navy} fill="rgba(27,58,92,0.08)" name="Diversion %"/><Area type="monotone" dataKey="landfill" stroke={T.red} fill="rgba(220,38,38,0.06)" name="Landfill %"/></AreaChart></ResponsiveContainer></div>
      <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Portfolio Circularity Radar</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><Radar name="Score" dataKey="value" stroke={ACCENT} fill="rgba(22,163,74,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
    <div style={ss.card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Waste Destination</div>
      <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={WASTE_TYPES} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={75} label={({type,percent})=>`${type} ${(percent*100).toFixed(0)}%`} labelLine fontSize={10}>{WASTE_TYPES.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
  </>);

  const renderScreen=()=>(<div style={ss.card}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={ss.input} placeholder="Search companies..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select style={ss.select} value={sector} onChange={e=>{setSector(e.target.value);setPage(1);}}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
      <select style={ss.select} value={ratingF} onChange={e=>{setRatingF(e.target.value);setPage(1);}}>{RATINGS.map(r=><option key={r}>{r}</option>)}</select>
      <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} results</span>
      <button style={ss.btn} onClick={()=>csvExport(filtered,'circular_economy')}>Export CSV</button>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
      <TH col="name" label="Company" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="sector" label="Sector" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="circularityScore" label="Circularity" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="wasteDiv" label="Diversion" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="recycledInput" label="Recycled In" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="recyclability" label="Recyclability" sc={sortCol} sd={sortDir} fn={doSort}/>
      <TH col="landfillPct" label="Landfill" sc={sortCol} sd={sortDir} fn={doSort}/><TH col="rating" label="Rating" sc={sortCol} sd={sortDir} fn={doSort}/>
    </tr></thead><tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        <td style={{...ss.td,fontWeight:600}}>{r.name}</td><td style={ss.td}>{r.sector}</td>
        <td style={ss.td}><span style={badge(r.circularityScore,[25,50,70])}>{r.circularityScore}%</span></td>
        <td style={ss.td}><span style={badge(r.wasteDiv,[25,50,70])}>{r.wasteDiv}%</span></td>
        <td style={ss.td}>{r.recycledInput}%</td><td style={ss.td}>{r.recyclability}%</td>
        <td style={ss.td}><span style={badge(100-r.landfillPct,[30,55,75])}>{r.landfillPct}%</span></td>
        <td style={ss.td}><span style={ratBadge(r.rating)}>{r.rating}</span></td>
      </tr>
      {expanded===r.id&&<tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div>{[['Reuse %',r.reusePct],['Compost %',r.compostPct],['Water Recycle',r.waterRecycle+'%'],['Energy Recovery',r.energyRecovery+'%'],['Material Eff.',r.materialEfficiency+'%'],['EPR Compliance',r.eprCompliance+'%'],['Design Circ.',r.designCircularity+'%'],['Product Life Ext.',r.productLifeExt+'%'],['Reverse Logistics',r.reverseLogistics+'%'],['Total Waste',fmt(r.totalWaste)+' t'],['Diverted',fmt(r.diverted)+' t']].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span></div>))}</div>
          <ResponsiveContainer width="100%" height={180}><RadarChart data={[{d:'Circularity',v:r.circularityScore},{d:'Diversion',v:r.wasteDiv},{d:'Recycled In',v:r.recycledInput},{d:'Recyclability',v:r.recyclability},{d:'Material Eff',v:r.materialEfficiency},{d:'Design Circ',v:r.designCircularity}]} cx="50%" cy="50%" outerRadius={65}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={false} domain={[0,100]}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(22,163,74,0.15)" strokeWidth={2}/></RadarChart></ResponsiveContainer>
          <ResponsiveContainer width="100%" height={180}><BarChart data={[{n:'Recycled',v:r.recycledInput},{n:'Reuse',v:r.reusePct},{n:'Compost',v:r.compostPct},{n:'Landfill',v:r.landfillPct},{n:'Recovery',v:r.energyRecovery}]} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/><YAxis dataKey="n" type="category" tick={{fontSize:9,fill:T.textSec}} width={65}/><Tooltip {...tip}/><Bar dataKey="v" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </td></tr>}
    </React.Fragment>))}</tbody></table></div>
    <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderMat=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Material Flow Analysis</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={300}><BarChart data={MATERIALS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Bar dataKey="recycled" stackId="a" fill={ACCENT} name="Recycled %"/><Bar dataKey="virgin" stackId="a" fill={T.border} name="Virgin %"/></BarChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={300}><LineChart data={MATERIALS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="flow" stroke={T.navy} strokeWidth={2} dot={{fill:T.navy,r:4}} name="Flow (kt)"/></LineChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Material</th><th style={ss.th('','','')}>Recycled %</th><th style={ss.th('','','')}>Virgin %</th><th style={ss.th('','','')}>Flow (kt)</th><th style={ss.th('','','')}>Gap</th></tr></thead><tbody>
      {MATERIALS.map((m,i)=>(<tr key={i}><td style={{...ss.td,fontWeight:600}}>{m.name}</td><td style={ss.td}><span style={badge(m.recycled,[20,40,60])}>{m.recycled}%</span></td><td style={ss.td}>{m.virgin}%</td><td style={{...ss.td,fontFamily:T.mono}}>{fmt(m.flow)}</td><td style={ss.td}><div style={{background:T.border,borderRadius:4,height:12,width:100}}><div style={{background:ACCENT,borderRadius:4,height:12,width:m.recycled}}/></div></td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(MATERIALS,'material_flow')}>Export CSV</button></div>
  </div>);

  const renderWaste=()=>(<div style={ss.card}>
    <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Waste Analytics & Destination</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
      <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={WASTE_TYPES} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({type,value})=>`${type}: ${value}%`} labelLine fontSize={10}>{WASTE_TYPES.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
      <ResponsiveContainer width="100%" height={280}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="recycled" stroke={ACCENT} fill="rgba(22,163,74,0.1)" name="Recycling %"/><Area type="monotone" dataKey="landfill" stroke={T.red} fill="rgba(220,38,38,0.06)" name="Landfill %"/></AreaChart></ResponsiveContainer>
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={ss.th('','','')}>Destination</th><th style={ss.th('','','')}>Share %</th><th style={ss.th('','','')}>Visual</th></tr></thead><tbody>
      {WASTE_TYPES.map((w,i)=>(<tr key={i}><td style={{...ss.td,fontWeight:600}}>{w.type}</td><td style={{...ss.td,fontFamily:T.mono}}>{w.value}%</td><td style={ss.td}><div style={{background:T.border,borderRadius:4,height:14,width:120}}><div style={{background:PIECLRS[i],borderRadius:4,height:14,width:w.value*1.2}}/></div></td></tr>))}
    </tbody></table></div>
    <div style={{marginTop:12}}><button style={ss.btn} onClick={()=>csvExport(WASTE_TYPES,'waste_analytics')}>Export CSV</button></div>
  </div>);

  return(<div style={ss.wrap}>
    <div style={ss.header}>Circular Economy Tracker</div>
    <div style={ss.sub}>Circularity scoring, waste diversion analytics, material flow mapping</div>
    <div style={ss.tabs}>{TABS.map((t,i)=><button key={t} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderScreen()}{tab===2&&renderMat()}{tab===3&&renderWaste()}
  </div>);
}