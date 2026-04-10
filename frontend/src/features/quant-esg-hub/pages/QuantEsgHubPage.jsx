import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Legend,Cell,LineChart,Line,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt1=n=>Number(n).toFixed(1);const fmt0=n=>Number(n).toFixed(0);const fmt2=n=>Number(n).toFixed(2);
const scoreColor=v=>v>=70?T.green:v>=45?T.amber:T.red;
const riskColor=v=>v==='Low'?T.green:v==='Medium'?T.amber:v==='High'?T.red:'#7c3aed';
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.goldL,T.sageL,T.red,T.amber,T.green,'#7c3aed'];

const CATEGORIES=['Factor Strategies','Risk Premia','Smart Beta','Multi-Factor','Long-Short','Market Neutral'];
const SECTORS=['Technology','Healthcare','Financials','Energy','Industrials','Materials','Consumer','Utilities'];
const RISK_LEVELS=['Low','Medium','High','Critical'];
const NAMES=['ESG Momentum Alpha','Green Factor Portfolio','Carbon Risk Premia','Social Impact Factor','Governance Quality Fund','Low Carbon Smart Beta','ESG Value Tilt','Climate Transition Factor','Quality ESG Blend','Diversity Alpha Strategy','Water Risk Factor','Circular Economy Beta','Clean Energy Momentum','SBTi Aligned Fund','Paris Aligned Strategy','Net Zero Factor','Impact Weighted Alpha','Stakeholder Value Fund','Supply Chain ESG','Biodiversity Premium','Sustainable Yield Fund','Green Bond Factor','Social Bond Alpha','Transition Credit Factor','Climate Overlay Strategy','ESG Defensive Portfolio','Responsible Growth Fund','Ethical Momentum Strategy','Stewardship Value Alpha','Nature Positive Factor','Just Transition Portfolio','Community Impact Beta','Health Safety Factor','Anti-Corruption Alpha','Proxy Voting Edge Fund','Labor Rights Factor','Ocean Risk Premium','Deforestation Free Beta','Air Quality Alpha','Land Use Risk Factor','Taxonomy Aligned Fund','SFDR Article 9 Strategy','CSRD Ready Portfolio','Double Materiality Alpha','Impact Measurement Fund','Blended Finance Factor','Microfinance Alpha','Gender Lens Strategy','Indigenous Rights Beta','Climate Justice Factor'];

const cardS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16};
const inputS={fontFamily:T.mono,fontSize:13,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,outline:'none',background:T.surface,color:T.text,width:260};
const btnS=(a)=>({fontFamily:T.font,fontSize:13,fontWeight:a?700:500,padding:'8px 18px',border:`1px solid ${a?T.gold:T.border}`,borderRadius:6,background:a?T.gold:T.surface,color:a?'#fff':T.text,cursor:'pointer'});
const thS={fontFamily:T.mono,fontSize:12,fontWeight:600,color:T.textSec,padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'};
const tdS={fontFamily:T.font,fontSize:13,color:T.text,padding:'10px 12px',borderBottom:`1px solid ${T.borderL}`};
const badgeS=(bg)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg});
const kpiBoxS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,textAlign:'center',flex:1,minWidth:140};
const kpiVal={fontFamily:T.mono,fontSize:26,fontWeight:700,color:T.navy};
const kpiLab={fontFamily:T.font,fontSize:11,color:T.textMut,marginTop:4,textTransform:'uppercase',letterSpacing:0.5};
const exportCSV=(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
const CT=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'10px 14px',fontFamily:T.font,fontSize:12}}><div style={{fontWeight:700,color:T.navy,marginBottom:4}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?fmt2(p.value):p.value}</div>)}</div>);};

const genData=(count)=>{const data=[];for(let i=0;i<count;i++){const s=idx=>sr(i*idx+idx);
  data.push({id:i+1,name:NAMES[i%NAMES.length]+(i>=NAMES.length?` ${Math.floor(i/NAMES.length)+1}`:''),
    category:CATEGORIES[Math.floor(s(17)*CATEGORIES.length)],sector:SECTORS[Math.floor(s(23)*SECTORS.length)],risk:RISK_LEVELS[Math.floor(s(29)*RISK_LEVELS.length)],
    sharpe:Number((0.1+s(31)*2.4).toFixed(2)),alpha:Number((-2+s(37)*8).toFixed(2)),beta:Number((0.2+s(41)*1.6).toFixed(2)),
    vol:Number((3+s(43)*22).toFixed(1)),maxDD:Number((-2-s(47)*28).toFixed(1)),infoRatio:Number((-0.5+s(53)*2.5).toFixed(2)),
    esgScore:Math.floor(20+s(59)*75),carbonInt:Math.floor(10+s(61)*490),turnover:Math.floor(5+s(67)*145),
    trackingError:Number((0.5+s(71)*6.5).toFixed(2)),factorExp:Number((-1+s(73)*3).toFixed(2)),corrSP500:Number((0.1+s(79)*0.85).toFixed(2)),
    sortinoRatio:Number((0.1+s(83)*3).toFixed(2)),calmarRatio:Number((0.1+s(89)*2.5).toFixed(2)),
    aum:Math.floor(50+s(97)*4950),ytdReturn:Number((-5+s(101)*25).toFixed(1)),
    envScore:Math.floor(15+s(103)*80),socScore:Math.floor(15+s(107)*80),govScore:Math.floor(20+s(109)*75),
    q1:Number((s(113)*2.5).toFixed(2)),q2:Number((0.1+s(127)*2.4).toFixed(2)),q3:Number((0.2+s(131)*2.3).toFixed(2)),q4:Number((0.15+s(137)*2.35).toFixed(2)),
  });}return data;};

const DATA=genData(50);
const TABS=['Strategy Overview','Factor Analysis','Performance Attribution','Risk Analytics'];
const PAGE_SIZE=12;

export default function QuantEsgHubPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sortCol,setSortCol]=useState('sharpe');const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(0);const[expanded,setExpanded]=useState(null);const[fCat,setFCat]=useState('All');const[fSector,setFSector]=useState('All');const[fRisk,setFRisk]=useState('All');

  const filtered=useMemo(()=>{let d=[...DATA];if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)||r.category.toLowerCase().includes(s)||r.sector.toLowerCase().includes(s));}
    if(fCat!=='All')d=d.filter(r=>r.category===fCat);if(fSector!=='All')d=d.filter(r=>r.sector===fSector);if(fRisk!=='All')d=d.filter(r=>r.risk===fRisk);
    d.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];if(av==null)return 1;if(bv==null)return -1;return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});return d;},[search,sortCol,sortDir,fCat,fSector,fRisk]);

  const paged=useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const toggleSort=(c)=>{if(sortCol===c)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(c);setSortDir('desc');}setPage(0);};
  const sortArrow=(c)=>sortCol===c?(sortDir==='asc'?' \u25B2':' \u25BC'):'';

  const kpis=useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgSharpe:0,avgAlpha:0,avgVol:0,totalAum:0,avgEsg:0};
    return{count:d.length,avgSharpe:d.reduce((a,r)=>a+r.sharpe,0)/ Math.max(1, d.length),avgAlpha:d.reduce((a,r)=>a+r.alpha,0)/ Math.max(1, d.length),avgVol:d.reduce((a,r)=>a+r.vol,0)/ Math.max(1, d.length),totalAum:d.reduce((a,r)=>a+r.aum,0),avgEsg:d.reduce((a,r)=>a+r.esgScore,0)/ Math.max(1, d.length)};},[filtered]);

  const catDist=useMemo(()=>{const m={};filtered.forEach(r=>{m[r.category]=(m[r.category]||0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value})).sort((a,b)=>b.value-a.value);},[filtered]);
  const riskDist=useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.risk===l).length})),[filtered]);
  const radarData=useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/ Math.max(1, filtered.length);
    return[{axis:'Sharpe',value:avg('sharpe')*40},{axis:'Alpha',value:Math.max(0,avg('alpha')*10+20)},{axis:'Info Ratio',value:Math.max(0,avg('infoRatio')*30+20)},{axis:'ESG',value:avg('esgScore')},{axis:'Sortino',value:avg('sortinoRatio')*25},{axis:'Calmar',value:avg('calmarRatio')*30}];},[filtered]);
  const catPerf=useMemo(()=>CATEGORIES.map(c=>{const items=filtered.filter(r=>r.category===c);if(!items.length)return null;return{name:c.length>14?c.slice(0,14)+'..':c,sharpe:items.reduce((a,r)=>a+r.sharpe,0)/ Math.max(1, items.length),alpha:items.reduce((a,r)=>a+r.alpha,0)/ Math.max(1, items.length)};}).filter(Boolean),[filtered]);
  const trendData=useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,sharpe:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length||1)})),[filtered]);

  const renderKPIs=()=>(<div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
    <div style={kpiBoxS}><div style={kpiVal}>{kpis.count}</div><div style={kpiLab}>Strategies</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:kpis.avgSharpe>=1?T.green:T.amber}}>{fmt2(kpis.avgSharpe)}</div><div style={kpiLab}>Avg Sharpe</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:kpis.avgAlpha>0?T.green:T.red}}>{fmt2(kpis.avgAlpha)}%</div><div style={kpiLab}>Avg Alpha</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt1(kpis.avgVol)}%</div><div style={kpiLab}>Avg Vol</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>${fmt0(kpis.totalAum)}M</div><div style={kpiLab}>Total AUM</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:scoreColor(kpis.avgEsg)}}>{fmt1(kpis.avgEsg)}</div><div style={kpiLab}>Avg ESG</div></div>
  </div>);

  const renderFilters=()=>(<div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
    <input style={inputS} placeholder="Search strategies..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
    <select style={{...inputS,width:160}} value={fCat} onChange={e=>{setFCat(e.target.value);setPage(0);}}><option value="All">All Strategies</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
    <select style={{...inputS,width:150}} value={fSector} onChange={e=>{setFSector(e.target.value);setPage(0);}}><option value="All">All Sectors</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
    <select style={{...inputS,width:130}} value={fRisk} onChange={e=>{setFRisk(e.target.value);setPage(0);}}><option value="All">All Risk</option>{RISK_LEVELS.map(r=><option key={r}>{r}</option>)}</select>
    <button style={{...btnS(false),marginLeft:'auto'}} onClick={()=>exportCSV(filtered,'quant_esg_hub.csv')}>Export CSV</button>
  </div>);

  const renderPagination=()=>(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,fontFamily:T.mono,fontSize:12,color:T.textSec}}>
    <span>{page*PAGE_SIZE+1}-{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
    <div style={{display:'flex',gap:4}}><button style={btnS(false)} disabled={page===0} onClick={()=>setPage(p=>p-1)}>Prev</button>
      {Array.from({length:Math.min(totalPages,7)},(_,i)=>{let pg=i;if(totalPages>7){if(page<4)pg=i;else if(page>=totalPages-3)pg=totalPages-7+i;else pg=page-3+i;}return <button key={pg} style={btnS(pg===page)} onClick={()=>setPage(pg)}>{pg+1}</button>;})}
      <button style={btnS(false)} disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderExpanded=(r)=>(<tr key={`exp-${r.id}`}><td colSpan={99} style={{background:T.surfaceH,padding:20,borderBottom:`1px solid ${T.border}`}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>STRATEGY DETAILS</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Category:</strong> {r.category}</div><div><strong>Sector:</strong> {r.sector}</div><div><strong>AUM:</strong> ${r.aum}M</div>
          <div><strong>YTD Return:</strong> <span style={{color:r.ytdReturn>=0?T.green:T.red}}>{r.ytdReturn>0?'+':''}{r.ytdReturn}%</span></div><div><strong>Turnover:</strong> {r.turnover}%</div><div><strong>Risk:</strong> <span style={{color:riskColor(r.risk)}}>{r.risk}</span></div></div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>PERFORMANCE</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Sharpe:</strong> <span style={{fontWeight:700,color:r.sharpe>=1?T.green:T.amber}}>{r.sharpe}</span></div>
          <div><strong>Alpha:</strong> <span style={{color:r.alpha>=0?T.green:T.red}}>{r.alpha}%</span></div><div><strong>Beta:</strong> {r.beta}</div><div><strong>Vol:</strong> {r.vol}%</div>
          <div><strong>Max DD:</strong> <span style={{color:T.red}}>{r.maxDD}%</span></div><div><strong>Info Ratio:</strong> {r.infoRatio}</div>
          <div><strong>Sortino:</strong> {r.sortinoRatio}</div><div><strong>Calmar:</strong> {r.calmarRatio}</div></div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>ESG & FACTOR</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>ESG Score:</strong> <span style={{color:scoreColor(r.esgScore),fontWeight:700}}>{r.esgScore}</span></div>
          <div><strong>Env:</strong> {r.envScore}</div><div><strong>Soc:</strong> {r.socScore}</div><div><strong>Gov:</strong> {r.govScore}</div>
          <div><strong>Carbon Int:</strong> {r.carbonInt}</div><div><strong>Factor Exp:</strong> {r.factorExp}</div><div><strong>Tracking Error:</strong> {r.trackingError}%</div><div><strong>Corr S&P:</strong> {r.corrSP500}</div></div></div>
    </div>
  </td></tr>);

  const renderTable=(cols)=>(<div style={{...cardS,overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{cols.map(([k,l])=><th key={k} style={thS} onClick={()=>toggleSort(k)}>{l}{sortArrow(k)}</th>)}</tr></thead>
    <tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        {cols.map(([k])=>{const v=r[k];if(k==='name')return <td key={k} style={{...tdS,fontWeight:600,color:T.navy}}>{v}</td>;if(k==='risk')return <td key={k} style={tdS}><span style={badgeS(riskColor(v))}>{v}</span></td>;if(k==='esgScore')return <td key={k} style={{...tdS,fontWeight:700,color:scoreColor(v)}}>{v}</td>;if(k==='alpha'||k==='ytdReturn')return <td key={k} style={{...tdS,fontFamily:T.mono,color:v>=0?T.green:T.red}}>{v>0?'+':''}{v}</td>;if(typeof v==='number')return <td key={k} style={{...tdS,fontFamily:T.mono}}>{Math.abs(v)<10?fmt2(v):fmt1(v)}</td>;return <td key={k} style={tdS}>{v}</td>;})}
      </tr>{expanded===r.id&&renderExpanded(r)}
    </React.Fragment>))}</tbody></table>{renderPagination()}
  </div>);

  const renderTab0=()=>(<>{renderKPIs()}{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CATEGORY DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={catDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
          {catDist.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SHARPE RATIO BY CATEGORY</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={catPerf}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={55}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/><Legend/>
          <Bar dataKey="sharpe" name="Sharpe" fill={T.navy} radius={[4,4,0,0]}/><Bar dataKey="alpha" name="Alpha%" fill={T.gold} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SHARPE vs ESG SCORE</div>
      <ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="ESG Score" tick={{fontSize:11}}/><YAxis dataKey="y" name="Sharpe" tick={{fontSize:11}}/>
        <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>ESG:{d.x} Sharpe:{d.y}</div></div>}}/>
        <Scatter data={filtered.map(r=>({n:r.name,x:r.esgScore,y:r.sharpe}))} fill={T.navy}/></ScatterChart></ResponsiveContainer></div>
    {renderTable([['name','Strategy'],['category','Category'],['sharpe','Sharpe'],['alpha','Alpha'],['vol','Vol%'],['esgScore','ESG'],['aum','AUM'],['risk','Risk'],['ytdReturn','YTD%']])}
  </>);

  const renderTab1=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>FACTOR RADAR</div>
        <ResponsiveContainer width="100%" height={300}><RadarChart data={radarData}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="axis" tick={{fontSize:11}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:10}}/>
          <Radar name="Portfolio" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/><Tooltip/></RadarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>RISK DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={riskDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label>
          {riskDist.map((e,i)=><Cell key={i} fill={[T.green,T.amber,T.red,'#7c3aed'][i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>FACTOR EXPOSURE vs TRACKING ERROR</div>
      <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="Factor Exp" tick={{fontSize:11}}/><YAxis dataKey="y" name="TE%" tick={{fontSize:11}}/>
        <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>FE:{fmt2(d.x)} TE:{fmt2(d.y)}%</div></div>}}/>
        <Scatter data={filtered.map(r=>({n:r.name,x:r.factorExp,y:r.trackingError}))} fill={T.sage}/></ScatterChart></ResponsiveContainer></div>
    {renderTable([['name','Strategy'],['factorExp','Factor Exp'],['beta','Beta'],['corrSP500','Corr S&P'],['trackingError','TE%'],['carbonInt','Carbon'],['esgScore','ESG'],['risk','Risk']])}
  </>);

  const renderTab2=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SHARPE TREND (QUARTERLY)</div>
        <ResponsiveContainer width="100%" height={280}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="quarter" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Line type="monotone" dataKey="sharpe" stroke={T.navy} strokeWidth={2} dot={{r:4}} name="Avg Sharpe"/></LineChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>ALPHA DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={['<-1%','-1-0%','0-1%','1-3%','>3%'].map((l,i)=>{const rng=[[-100,-1],[-1,0],[0,1],[1,3],[3,100]];return{name:l,count:filtered.filter(r=>r.alpha>=rng[i][0]&&r.alpha<rng[i][1]).length};})}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="count" name="Strategies" radius={[4,4,0,0]}>{['<-1%','-1-0%','0-1%','1-3%','>3%'].map((_,i)=><Cell key={i} fill={[T.red,T.amber,T.gold,T.sage,T.green][i]}/>)}</Bar></BarChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>E/S/G BY CATEGORY</div>
      <ResponsiveContainer width="100%" height={260}><BarChart data={CATEGORIES.map(c=>{const items=filtered.filter(r=>r.category===c);if(!items.length)return null;return{name:c.length>14?c.slice(0,14)+'..':c,env:items.reduce((a,r)=>a+r.envScore,0)/ Math.max(1, items.length),soc:items.reduce((a,r)=>a+r.socScore,0)/ Math.max(1, items.length),gov:items.reduce((a,r)=>a+r.govScore,0)/ Math.max(1, items.length)};}).filter(Boolean)}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip content={<CT/>}/><Legend/>
        <Bar dataKey="env" name="Env" fill={T.sage} radius={[2,2,0,0]}/><Bar dataKey="soc" name="Soc" fill={T.gold} radius={[2,2,0,0]}/><Bar dataKey="gov" name="Gov" fill={T.navy} radius={[2,2,0,0]}/></BarChart></ResponsiveContainer></div>
    {renderTable([['name','Strategy'],['ytdReturn','YTD%'],['alpha','Alpha'],['sharpe','Sharpe'],['envScore','Env'],['socScore','Soc'],['govScore','Gov'],['turnover','Turn%']])}
  </>);

  const renderTab3=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>VOLATILITY vs MAX DRAWDOWN</div>
        <ResponsiveContainer width="100%" height={280}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="Vol%" tick={{fontSize:11}}/><YAxis dataKey="y" name="Max DD%" tick={{fontSize:11}}/>
          <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>Vol:{fmt1(d.x)}% DD:{fmt1(d.y)}%</div></div>}}/>
          <Scatter data={filtered.map(r=>({n:r.name,x:r.vol,y:r.maxDD}))} fill={T.red}/></ScatterChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>AUM DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={280}><AreaChart data={[...filtered].sort((a,b)=>a.aum-b.aum).map((r,i)=>({rank:i+1,aum:r.aum}))}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="rank" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Area type="monotone" dataKey="aum" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="AUM $M"/></AreaChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CARBON INTENSITY BY SECTOR</div>
      <ResponsiveContainer width="100%" height={260}><BarChart data={SECTORS.map(s=>{const items=filtered.filter(r=>r.sector===s);if(!items.length)return null;return{name:s.length>10?s.slice(0,10)+'..':s,carbon:items.reduce((a,r)=>a+r.carbonInt,0)/ Math.max(1, items.length)};}).filter(Boolean)} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" width={90} tick={{fontSize:10}}/><Tooltip content={<CT/>}/>
        <Bar dataKey="carbon" name="Avg Carbon Int" fill={T.red} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
    {renderTable([['name','Strategy'],['vol','Vol%'],['maxDD','Max DD'],['sortinoRatio','Sortino'],['calmarRatio','Calmar'],['carbonInt','Carbon'],['corrSP500','Corr'],['risk','Risk']])}
  </>);

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}><div style={{maxWidth:1400,margin:'0 auto'}}>
    <div style={{marginBottom:20}}><h1 style={{fontFamily:T.font,fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Quantitative ESG Hub</h1><p style={{fontFamily:T.font,fontSize:13,color:T.textSec,marginTop:2}}>Quantitative ESG factor analytics across {DATA.length} strategies</p></div>
    <div style={{display:'flex',gap:6,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
      {TABS.map((t,i)=><button key={i} style={btnS(tab===i)} onClick={()=>{setTab(i);setPage(0);setExpanded(null);}}>{t}</button>)}</div>
    {tab===0&&renderTab0()}{tab===1&&renderTab1()}{tab===2&&renderTab2()}{tab===3&&renderTab3()}
  </div></div>);
}
