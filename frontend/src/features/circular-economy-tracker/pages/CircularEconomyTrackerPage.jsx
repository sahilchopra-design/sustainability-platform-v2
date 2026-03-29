import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,ScatterChart,Scatter,ZAxis,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#16a34a';
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const TABS=['Dashboard','Company Circularity','Material Flows','Waste Analytics'];
const SECTORS=['All','Manufacturing','Technology','Consumer Goods','Automotive','Packaging','Construction','Textiles','Electronics','Chemicals','Food & Bev'];
const RATINGS=['All','Leader','Advanced','Progressing','Emerging','Laggard'];
const PAGE_SIZE=15;

const COMPANIES=(()=>{
  const names=['Unilever plc','Philips NV','Interface Inc','Patagonia Inc','IKEA Group','HP Inc','Dell Technologies','Apple Inc','Samsung Elec','LG Electronics','Toyota Motor','BMW AG','Volvo Group','Renault Group','Stellantis NV','Schneider Electric','Siemens AG','ABB Ltd','Veolia Environ','Suez SA','Tomra Systems','Umicore SA','DS Smith plc','Smurfit Kappa','Mondi plc','Berry Global','Sealed Air','Amcor plc','Ball Corp','Crown Holdings','Nestlé SA','Danone SA','PepsiCo Inc','Coca-Cola HBC','AB InBev','L\'Oréal SA','Henkel AG','P&G Co','Kimberly-Clark','Essity AB','H&M Group','Inditex SA','Nike Inc','Adidas AG','Levi Strauss','BASF SE','Dow Inc','DuPont Co','Covestro AG','Lanxess AG','Saint-Gobain','Holcim Ltd','CRH plc','LafargeHolcim','HeidelbergCement','Caterpillar Inc','Deere & Co','3M Company','General Electric','Honeywell Intl'];
  const secs=['Consumer Goods','Electronics','Manufacturing','Textiles','Consumer Goods','Technology','Technology','Technology','Electronics','Electronics','Automotive','Automotive','Automotive','Automotive','Automotive','Electronics','Manufacturing','Manufacturing','Chemicals','Chemicals','Manufacturing','Chemicals','Packaging','Packaging','Packaging','Packaging','Packaging','Packaging','Packaging','Packaging','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Food & Bev','Consumer Goods','Chemicals','Consumer Goods','Consumer Goods','Consumer Goods','Textiles','Textiles','Textiles','Textiles','Textiles','Chemicals','Chemicals','Chemicals','Chemicals','Chemicals','Construction','Construction','Construction','Construction','Construction','Manufacturing','Manufacturing','Manufacturing','Manufacturing','Manufacturing'];
  return names.map((n,i)=>({id:i+1,name:n,sector:secs[i]||'Manufacturing',circularityScore:Math.round(15+sr(i*7)*75),recycledInput:Math.round(5+sr(i*11)*60),recyclingRate:Math.round(20+sr(i*13)*70),wasteToValue:Math.round(10+sr(i*17)*65),materialEfficiency:Math.round(30+sr(i*19)*65),productLifeExtension:Math.round(15+sr(i*23)*70),closedLoopPct:Math.round(5+sr(i*29)*55),wasteIntensity:+(0.5+sr(i*31)*4).toFixed(2),circularRevenue:Math.round(2+sr(i*37)*35),designForRecycling:Math.round(20+sr(i*41)*75),takeBackProgram:sr(i*43)>0.4?'Active':'Planned',eprCompliance:Math.round(40+sr(i*47)*58),remanufacturing:Math.round(sr(i*53)*40),sharingModels:sr(i*59)>0.6?'Yes':'No',rating:sr(i*7)<0.12?'Leader':sr(i*7)<0.32?'Advanced':sr(i*7)<0.55?'Progressing':sr(i*7)<0.8?'Emerging':'Laggard',wasteTotal:Math.round(500+sr(i*61)*9500),landfillPct:Math.round(5+sr(i*67)*45),incinerationPct:Math.round(5+sr(i*71)*30),compostPct:Math.round(sr(i*73)*20)}));})();

const MATERIALS=[
  {material:'Plastics',virgin:42e6,recycled:8.5e6,rate:16.8,target:30,gap:13.2},{material:'Steel',virgin:85e6,recycled:38e6,rate:30.9,target:50,gap:19.1},
  {material:'Aluminum',virgin:28e6,recycled:18e6,rate:39.1,target:55,gap:15.9},{material:'Paper/Cardboard',virgin:55e6,recycled:38e6,rate:40.9,target:65,gap:24.1},
  {material:'Glass',virgin:18e6,recycled:13e6,rate:41.9,target:70,gap:28.1},{material:'Textiles',virgin:32e6,recycled:4.2e6,rate:11.6,target:25,gap:13.4},
  {material:'Electronics',virgin:22e6,recycled:4.8e6,rate:17.9,target:35,gap:17.1},{material:'Rubber',virgin:14e6,recycled:3.1e6,rate:18.1,target:30,gap:11.9},
  {material:'Concrete',virgin:120e6,recycled:15e6,rate:11.1,target:25,gap:13.9},{material:'Copper',virgin:8.5e6,recycled:3.2e6,rate:27.4,target:45,gap:17.6},
  {material:'Rare Earths',virgin:0.3e6,recycled:0.003e6,rate:1.0,target:10,gap:9.0},{material:'Lithium',virgin:0.5e6,recycled:0.025e6,rate:4.8,target:20,gap:15.2},
];

const WASTE_TREND=Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,generated:Math.round(800+sr(i*7)*400),recycled:Math.round(200+sr(i*11)*250),landfill:Math.round(100+sr(i*13)*200),incineration:Math.round(50+sr(i*17)*150),composted:Math.round(20+sr(i*19)*80)}));

const badge=(val,thresholds,invert)=>{const[lo,mid,hi]=thresholds;const v=invert?100-val:val;const bg=v>=hi?'rgba(220,38,38,0.12)':v>=mid?'rgba(217,119,6,0.12)':v>=lo?'rgba(197,169,106,0.12)':'rgba(22,163,74,0.12)';const color=v>=hi?T.red:v>=mid?T.amber:v>=lo?T.gold:T.green;return{background:bg,color,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const ratingBadge=(r)=>{const m={Leader:{bg:'rgba(22,163,74,0.12)',c:T.green},Advanced:{bg:'rgba(90,138,106,0.12)',c:T.sage},Progressing:{bg:'rgba(197,169,106,0.15)',c:T.gold},Emerging:{bg:'rgba(217,119,6,0.12)',c:T.amber},Laggard:{bg:'rgba(220,38,38,0.12)',c:T.red}};const s=m[r]||m.Emerging;return{background:s.bg,color:s.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};

export default function CircularEconomyTrackerPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[sectorF,setSectorF]=useState('All');
  const[ratingF,setRatingF]=useState('All');
  const[sortCol,setSortCol]=useState('circularityScore');
  const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(1);
  const[selected,setSelected]=useState(null);
  const[mSearch,setMSearch]=useState('');
  const[mSort,setMSort]=useState('rate');
  const[mDir,setMDir]=useState('desc');
  const[wSearch,setWSearch]=useState('');
  const[wSort,setWSort]=useState('wasteTotal');
  const[wDir,setWDir]=useState('desc');
  const[wPage,setWPage]=useState(1);

  const filtered=useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);if(ratingF!=='All')d=d.filter(r=>r.rating===ratingF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,ratingF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[filtered,page]);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);

  const matFiltered=useMemo(()=>{let d=[...MATERIALS];if(mSearch)d=d.filter(r=>r.material.toLowerCase().includes(mSearch.toLowerCase()));d.sort((a,b)=>mDir==='asc'?(a[mSort]>b[mSort]?1:-1):(a[mSort]<b[mSort]?1:-1));return d;},[mSearch,mSort,mDir]);

  const wasteCompanies=useMemo(()=>{let d=filtered.map(r=>({name:r.name,sector:r.sector,wasteTotal:r.wasteTotal,recyclingRate:r.recyclingRate,landfillPct:r.landfillPct,incinerationPct:r.incinerationPct,compostPct:r.compostPct,wasteIntensity:r.wasteIntensity}));if(wSearch)d=d.filter(r=>r.name.toLowerCase().includes(wSearch.toLowerCase()));d.sort((a,b)=>wDir==='asc'?(a[wSort]>b[wSort]?1:-1):(a[wSort]<b[wSort]?1:-1));return d;},[filtered,wSearch,wSort,wDir]);
  const wPaged=useMemo(()=>wasteCompanies.slice((wPage-1)*PAGE_SIZE,wPage*PAGE_SIZE),[wasteCompanies,wPage]);
  const wTotalPages=Math.ceil(wasteCompanies.length/PAGE_SIZE);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(1);};
  const doMSort=(col)=>{if(mSort===col)setMDir(d=>d==='asc'?'desc':'asc');else{setMSort(col);setMDir('desc');}};
  const doWSort=(col)=>{if(wSort===col)setWDir(d=>d==='asc'?'desc':'asc');else{setWSort(col);setWDir('desc');}setWPage(1);};

  const stats=useMemo(()=>{const d=filtered;return{total:d.length,avgCirc:(d.reduce((s,r)=>s+r.circularityScore,0)/d.length||0).toFixed(1),avgRecycled:(d.reduce((s,r)=>s+r.recycledInput,0)/d.length||0).toFixed(1),avgWTV:(d.reduce((s,r)=>s+r.wasteToValue,0)/d.length||0).toFixed(1),leaders:d.filter(r=>r.rating==='Leader'||r.rating==='Advanced').length,avgCircRev:(d.reduce((s,r)=>s+r.circularRevenue,0)/d.length||0).toFixed(1)};},[filtered]);

  const sectorAvg=useMemo(()=>{const m={};filtered.forEach(r=>{if(!m[r.sector])m[r.sector]={sum:0,cnt:0};m[r.sector].sum+=r.circularityScore;m[r.sector].cnt++;});return Object.entries(m).map(([k,v])=>({sector:k,avg:+(v.sum/v.cnt).toFixed(1)})).sort((a,b)=>b.avg-a.avg);},[filtered]);
  const ratingDist=useMemo(()=>{const order=['Leader','Advanced','Progressing','Emerging','Laggard'];const m={};filtered.forEach(r=>{m[r.rating]=(m[r.rating]||0)+1;});return order.filter(k=>m[k]).map(k=>({name:k,value:m[k]}));},[filtered]);

  const exportCSV=useCallback((data,filename)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);},[]);

  const sortIcon=(col,cur,dir)=>cur===col?(dir==='asc'?' ▲':' ▼'):' ○';
  const thStyle={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left'};
  const tdStyle={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};
  const inputStyle={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};
  const selectStyle={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnStyle=(a)=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer',fontWeight:a?600:400});
  const pagBtn={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};
  const cardStyle={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};

  const SidePanel=({item,onClose})=>{if(!item)return null;return(<div style={{position:'fixed',top:0,right:0,width:420,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}>
    <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{item.name}</div>
      <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
    </div>
    <div style={{padding:'16px 24px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        {[['Circularity Score',item.circularityScore],['Recycled Input',item.recycledInput+'%'],['Recycling Rate',item.recyclingRate+'%'],['Waste-to-Value',item.wasteToValue+'%'],['Material Efficiency',item.materialEfficiency+'%'],['Product Life Ext.',item.productLifeExtension+'%'],['Closed Loop',item.closedLoopPct+'%'],['Waste Intensity',item.wasteIntensity+' t/$M'],['Circular Revenue',item.circularRevenue+'%'],['Design for Recycling',item.designForRecycling+'%'],['Take-Back',item.takeBackProgram],['EPR Compliance',item.eprCompliance+'%'],['Remanufacturing',item.remanufacturing+'%'],['Sharing Models',item.sharingModels]].map(([k,v],i)=>(<div key={i} style={{background:T.surfaceH,borderRadius:6,padding:'8px 12px'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:15,fontWeight:700,color:T.navy,marginTop:2}}>{v}</div></div>))}
      </div>
      <div style={{marginBottom:12}}><span style={ratingBadge(item.rating)}>{item.rating}</span><span style={{marginLeft:8,fontSize:11,color:T.textSec}}>Sector: {item.sector}</span></div>
      <div style={{height:200}}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={[{d:'Recycled Input',v:item.recycledInput},{d:'Recycling Rate',v:item.recyclingRate},{d:'Waste-to-Value',v:item.wasteToValue},{d:'Material Eff.',v:item.materialEfficiency},{d:'Life Extension',v:item.productLifeExtension},{d:'Design4Recycle',v:item.designForRecycling}]}>
            <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>);};

  return(<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.border}`,background:T.surface}}>
      <div style={{fontSize:20,fontWeight:700,color:T.navy}}>Circular Economy Tracker</div>
      <div style={{fontSize:12,color:T.textSec,marginTop:2,fontFamily:T.mono}}>Circularity Metrics &middot; Material Flow Analysis &middot; {COMPANIES.length} Companies &middot; {MATERIALS.length} Material Streams</div>
    </div>
    <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:28}}>
      {TABS.map((t,i)=>(<button key={i} onClick={()=>{setTab(i);setSelected(null);}} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',background:'none',color:tab===i?ACCENT:T.textSec,fontWeight:tab===i?700:400,fontSize:12,cursor:'pointer'}}>{t}</button>))}
    </div>
    <div style={{padding:'20px 28px'}}>

    {tab===0&&(<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:20}}>
        {[['Companies Tracked',stats.total,T.navy],['Avg Circularity',stats.avgCirc,ACCENT],['Avg Recycled Input',stats.avgRecycled+'%',T.sage],['Avg Waste-to-Value',stats.avgWTV+'%',T.gold],['Leaders/Advanced',stats.leaders,T.green],['Avg Circular Rev',stats.avgCircRev+'%',T.navy]].map(([l,v,c],i)=>(<div key={i} style={cardStyle}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:16,marginBottom:20}}>
        <div style={cardStyle}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Waste Stream Trend (24M)</div>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={WASTE_TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Area type="monotone" dataKey="recycled" stackId="1" stroke={ACCENT} fill={ACCENT} fillOpacity={0.3} name="Recycled"/><Area type="monotone" dataKey="composted" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.2} name="Composted"/><Area type="monotone" dataKey="incineration" stackId="1" stroke={T.amber} fill={T.amber} fillOpacity={0.2} name="Incineration"/><Area type="monotone" dataKey="landfill" stackId="1" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Landfill"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={cardStyle}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Rating Distribution</div>
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={ratingDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({name,value})=>`${name}: ${value}`} style={{fontSize:9}}>{ratingDist.map((_,i)=>(<Cell key={i} fill={[T.green,T.sage,T.gold,T.amber,T.red][i%5]}/>))}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer>
        </div>
        <div style={cardStyle}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Sector Avg Circularity</div>
          <ResponsiveContainer width="100%" height={220}><BarChart data={sectorAvg.slice(0,8)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/><YAxis dataKey="sector" type="category" tick={{fontSize:9,fill:T.textMut}} width={80}/><Tooltip {...tip}/><Bar dataKey="avg" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
      <div style={cardStyle}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Circularity vs Recycled Input</div>
        <ResponsiveContainer width="100%" height={240}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Circularity" tick={{fontSize:9}}/><YAxis dataKey="y" name="Recycled %" tick={{fontSize:9}}/><Tooltip {...tip}/><Scatter data={filtered.map(r=>({name:r.name,x:r.circularityScore,y:r.recycledInput}))} fill={ACCENT} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
      </div>
    </div>)}

    {tab===1&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search companies..." style={inputStyle}/>
        <select value={sectorF} onChange={e=>{setSectorF(e.target.value);setPage(1);}} style={selectStyle}>{SECTORS.map(s=>(<option key={s}>{s}</option>))}</select>
        <select value={ratingF} onChange={e=>{setRatingF(e.target.value);setPage(1);}} style={selectStyle}>{RATINGS.map(r=>(<option key={r}>{r}</option>))}</select>
        <button onClick={()=>exportCSV(filtered,'circular_economy_companies.csv')} style={btnStyle(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length} results</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Company'],['sector','Sector'],['circularityScore','Circularity'],['recycledInput','Recycled In%'],['recyclingRate','Recycling%'],['wasteToValue','WTV%'],['materialEfficiency','Mat.Eff%'],['closedLoopPct','Closed Loop%'],['circularRevenue','Circ.Rev%'],['rating','Rating']].map(([k,l])=>(<th key={k} onClick={()=>doSort(k)} style={thStyle}>{l}{sortIcon(k,sortCol,sortDir)}</th>))}
        </tr></thead><tbody>{paged.map(r=>(<tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}>
          <td style={{...tdStyle,fontWeight:600,color:T.navy}}>{r.name}</td><td style={tdStyle}>{r.sector}</td>
          <td style={tdStyle}><span style={badge(100-r.circularityScore,[30,55,75])}>{r.circularityScore}</span></td>
          <td style={tdStyle}>{r.recycledInput}%</td><td style={tdStyle}>{r.recyclingRate}%</td><td style={tdStyle}>{r.wasteToValue}%</td>
          <td style={tdStyle}>{r.materialEfficiency}%</td><td style={tdStyle}>{r.closedLoopPct}%</td><td style={tdStyle}>{r.circularRevenue}%</td>
          <td style={tdStyle}><span style={ratingBadge(r.rating)}>{r.rating}</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
        <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={pagBtn}>Prev</button>
        <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {page} of {totalPages}</span>
        <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} style={pagBtn}>Next</button>
      </div>
      <SidePanel item={selected} onClose={()=>setSelected(null)}/>
    </div>)}

    {tab===2&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
        <input value={mSearch} onChange={e=>setMSearch(e.target.value)} placeholder="Search materials..." style={inputStyle}/>
        <button onClick={()=>exportCSV(matFiltered,'material_flows.csv')} style={btnStyle(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{matFiltered.length} materials</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,marginBottom:16}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['material','Material'],['virgin','Virgin (t)'],['recycled','Recycled (t)'],['rate','Recycling Rate%'],['target','Target%'],['gap','Gap%']].map(([k,l])=>(<th key={k} onClick={()=>doMSort(k)} style={thStyle}>{l}{sortIcon(k,mSort,mDir)}</th>))}
        </tr></thead><tbody>{matFiltered.map((r,i)=>(<tr key={i}>
          <td style={{...tdStyle,fontWeight:600,color:T.navy}}>{r.material}</td>
          <td style={tdStyle}>{fmt(r.virgin)}</td><td style={tdStyle}>{fmt(r.recycled)}</td>
          <td style={tdStyle}><span style={badge(100-r.rate,[30,60,80])}>{r.rate}%</span></td>
          <td style={tdStyle}>{r.target}%</td><td style={tdStyle}><span style={{color:T.red,fontWeight:600}}>{r.gap}%</span></td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={cardStyle}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Current vs Target Rate</div>
          <ResponsiveContainer width="100%" height={280}><BarChart data={matFiltered}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="material" tick={{fontSize:8,fill:T.textMut}} angle={-30} textAnchor="end" height={50}/><YAxis tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="rate" fill={ACCENT} name="Current%" radius={[4,4,0,0]}/><Bar dataKey="target" fill={T.gold} name="Target%" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div style={cardStyle}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Virgin vs Recycled Volume</div>
          <ResponsiveContainer width="100%" height={280}><BarChart data={matFiltered} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textMut}} tickFormatter={v=>fmt(v)}/><YAxis dataKey="material" type="category" tick={{fontSize:8,fill:T.textMut}} width={80}/><Tooltip {...tip} formatter={v=>fmt(v)}/><Bar dataKey="virgin" fill={T.amber} name="Virgin" stackId="a"/><Bar dataKey="recycled" fill={ACCENT} name="Recycled" stackId="a"/></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>)}

    {tab===3&&(<div>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
        <input value={wSearch} onChange={e=>{setWSearch(e.target.value);setWPage(1);}} placeholder="Search companies..." style={inputStyle}/>
        <button onClick={()=>exportCSV(wasteCompanies,'waste_analytics.csv')} style={btnStyle(false)}>Export CSV</button>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{wasteCompanies.length} companies</span>
      </div>
      <div style={{overflowX:'auto',background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
          {[['name','Company'],['sector','Sector'],['wasteTotal','Total Waste(t)'],['recyclingRate','Recycling%'],['landfillPct','Landfill%'],['incinerationPct','Incineration%'],['compostPct','Compost%'],['wasteIntensity','Intensity']].map(([k,l])=>(<th key={k} onClick={()=>doWSort(k)} style={thStyle}>{l}{sortIcon(k,wSort,wDir)}</th>))}
        </tr></thead><tbody>{wPaged.map((r,i)=>(<tr key={i}>
          <td style={{...tdStyle,fontWeight:600,color:T.navy}}>{r.name}</td><td style={tdStyle}>{r.sector}</td>
          <td style={tdStyle}>{fmt(r.wasteTotal)}</td>
          <td style={tdStyle}><span style={badge(100-r.recyclingRate,[30,55,75])}>{r.recyclingRate}%</span></td>
          <td style={tdStyle}><span style={badge(r.landfillPct,[15,25,40])}>{r.landfillPct}%</span></td>
          <td style={tdStyle}>{r.incinerationPct}%</td><td style={tdStyle}>{r.compostPct}%</td>
          <td style={tdStyle}>{r.wasteIntensity}</td>
        </tr>))}</tbody></table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
        <button disabled={wPage<=1} onClick={()=>setWPage(p=>p-1)} style={pagBtn}>Prev</button>
        <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>Page {wPage} of {wTotalPages}</span>
        <button disabled={wPage>=wTotalPages} onClick={()=>setWPage(p=>p+1)} style={pagBtn}>Next</button>
      </div>
      <div style={{...cardStyle,marginTop:16}}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Waste Composition Breakdown</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={wPaged}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="recyclingRate" fill={ACCENT} stackId="a" name="Recycled%"/><Bar dataKey="compostPct" fill={T.sage} stackId="a" name="Compost%"/><Bar dataKey="incinerationPct" fill={T.amber} stackId="a" name="Incineration%"/><Bar dataKey="landfillPct" fill={T.red} stackId="a" name="Landfill%"/></BarChart></ResponsiveContainer>
      </div>
    </div>)}

    </div>
  </div>);
}
