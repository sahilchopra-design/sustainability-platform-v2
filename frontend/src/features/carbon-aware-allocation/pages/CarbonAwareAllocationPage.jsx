import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Legend,Cell,LineChart,Line,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt1=n=>Number(n).toFixed(1);const fmt0=n=>Number(n).toFixed(0);const fmtM=n=>n>=1000?`$${(n/1000).toFixed(1)}B`:`$${n}M`;
const scoreColor=v=>v>=70?T.green:v>=45?T.amber:T.red;
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.goldL,T.sageL,T.red,T.amber,T.green,'#7c3aed'];

const SECTORS=['Technology','Healthcare','Financials','Energy','Industrials','Materials','Consumer Staples','Utilities','Real Estate','Telecom'];
const ASSET_CLASSES=['Equity','Fixed Income','Alternatives','Real Assets','Cash'];
const REGIONS=['North America','Europe','Asia Pacific','Emerging Markets','Global'];
const STRATEGIES=['Low Carbon','Paris-Aligned','Climate Transition','Net Zero','Carbon Neutral'];

const genHoldings=(count)=>{
  const holdings=[];
  const names=['Apple Inc','Microsoft Corp','Amazon.com','Alphabet Inc','Tesla Inc','NVIDIA Corp','Meta Platforms','Berkshire Hathaway',
    'JPMorgan Chase','Johnson & Johnson','Visa Inc','Procter & Gamble','UnitedHealth Group','Home Depot','Mastercard Inc',
    'Bank of America','Chevron Corp','AbbVie Inc','Pfizer Inc','Costco Wholesale','Coca-Cola Co','PepsiCo Inc','Thermo Fisher',
    'Broadcom Inc','Cisco Systems','Walt Disney','Nike Inc','Intel Corp','Verizon Comm','Adobe Inc','Salesforce Inc',
    'Netflix Inc','Merck & Co','AMD Inc','Texas Instruments','Qualcomm Inc','Honeywell Intl','Goldman Sachs','Caterpillar Inc',
    'Boeing Co','Morgan Stanley','Lockheed Martin','Deere & Company','Target Corp','General Electric','Ford Motor Co',
    'General Motors','3M Company','Dow Inc','Duke Energy'];
  for(let i=0;i<count;i++){
    const s=idx=>sr(i*idx+idx);
    const sector=SECTORS[Math.floor(s(17)*SECTORS.length)];
    const assetClass=ASSET_CLASSES[Math.floor(s(23)*ASSET_CLASSES.length)];
    const region=REGIONS[Math.floor(s(29)*REGIONS.length)];
    const strategy=STRATEGIES[Math.floor(s(31)*STRATEGIES.length)];
    const weight=Number((0.5+s(37)*4.5).toFixed(2));
    const carbonInt=Math.floor(5+s(41)*495);
    const optWeight=Number((weight*(0.6+s(43)*0.8)).toFixed(2));
    const optCarbonInt=Math.floor(carbonInt*(0.4+s(47)*0.5));
    holdings.push({
      id:i+1,name:names[i%names.length]+(i>=names.length?` ${Math.floor(i/names.length)+1}`:''),
      sector,assetClass,region,strategy,weight,carbonInt,optWeight,optCarbonInt,
      carbonDelta:Math.floor(carbonInt-optCarbonInt),
      waci:Math.floor(weight*carbonInt),optWaci:Math.floor(optWeight*optCarbonInt),
      trackingError:Number((s(53)*3.5).toFixed(2)),
      returnImpact:Number((-0.5+s(59)*1.5).toFixed(2)),
      scope1:Math.floor(carbonInt*s(61)*0.3),scope2:Math.floor(carbonInt*s(67)*0.25),scope3:Math.floor(carbonInt*(0.4+s(71)*0.3)),
      tempAlignment:Number((1.2+s(73)*2.3).toFixed(1)),
      sbtiAligned:s(79)>0.5?'Yes':'No',greenRevenue:Math.floor(s(83)*65),
      esgScore:Math.floor(25+s(89)*70),climateScore:Math.floor(20+s(97)*75),
      q1Carbon:Math.floor(carbonInt*(0.95+s(101)*0.1)),q2Carbon:Math.floor(carbonInt*(0.9+s(103)*0.1)),
      q3Carbon:Math.floor(carbonInt*(0.85+s(107)*0.1)),q4Carbon:Math.floor(carbonInt*(0.8+s(109)*0.15)),
      marketCap:Math.floor(10+s(113)*990),
    });
  }
  return holdings;
};

const DATA=genHoldings(50);
const TABS=['Allocation Overview','Carbon Optimization','Scope Analysis','Trend & Attribution'];
const PAGE_SIZE=12;

const cardS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16};
const inputS={fontFamily:T.mono,fontSize:13,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,outline:'none',background:T.surface,color:T.text,width:260};
const btnS=(a)=>({fontFamily:T.font,fontSize:13,fontWeight:a?700:500,padding:'8px 18px',border:`1px solid ${a?T.gold:T.border}`,borderRadius:6,background:a?T.gold:T.surface,color:a?'#fff':T.text,cursor:'pointer'});
const thS={fontFamily:T.mono,fontSize:12,fontWeight:600,color:T.textSec,padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'};
const tdS={fontFamily:T.font,fontSize:13,color:T.text,padding:'10px 12px',borderBottom:`1px solid ${T.borderL}`};
const kpiBoxS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,textAlign:'center',flex:1,minWidth:140};
const kpiVal={fontFamily:T.mono,fontSize:26,fontWeight:700,color:T.navy};
const kpiLab={fontFamily:T.font,fontSize:11,color:T.textMut,marginTop:4,textTransform:'uppercase',letterSpacing:0.5};
const exportCSV=(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
const CT=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'10px 14px',fontFamily:T.font,fontSize:12}}><div style={{fontWeight:700,color:T.navy,marginBottom:4}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?fmt1(p.value):p.value}</div>)}</div>);};

export default function CarbonAwareAllocationPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sortCol,setSortCol]=useState('carbonInt');const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(0);const[expanded,setExpanded]=useState(null);const[fSector,setFSector]=useState('All');const[fAsset,setFAsset]=useState('All');

  const filtered=useMemo(()=>{
    let d=[...DATA];if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)||r.sector.toLowerCase().includes(s));}
    if(fSector!=='All')d=d.filter(r=>r.sector===fSector);if(fAsset!=='All')d=d.filter(r=>r.assetClass===fAsset);
    d.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];if(av==null)return 1;if(bv==null)return -1;return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});return d;
  },[search,sortCol,sortDir,fSector,fAsset]);

  const paged=useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const toggleSort=(c)=>{if(sortCol===c)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(c);setSortDir('desc');}setPage(0);};
  const sortArrow=(c)=>sortCol===c?(sortDir==='asc'?' ▲':' ▼'):'';

  const kpis=useMemo(()=>{const d=filtered;if(!d.length)return{count:0,waci:0,optWaci:0,reduction:0,avgTE:0,avgTemp:0};
    const waci=d.reduce((a,r)=>a+r.waci,0);const optWaci=d.reduce((a,r)=>a+r.optWaci,0);
    return{count:d.length,waci,optWaci,reduction:waci?((waci-optWaci)/waci*100):0,avgTE:d.reduce((a,r)=>a+r.trackingError,0)/d.length,avgTemp:d.reduce((a,r)=>a+r.tempAlignment,0)/d.length};},[filtered]);

  const sectorCarbon=useMemo(()=>SECTORS.map(s=>{const items=filtered.filter(r=>r.sector===s);return{name:s.length>10?s.slice(0,10)+'..':s,current:items.reduce((a,r)=>a+r.waci,0),optimized:items.reduce((a,r)=>a+r.optWaci,0)};}).filter(d=>d.current>0),[filtered]);
  const assetDist=useMemo(()=>ASSET_CLASSES.map(a=>({name:a,value:filtered.filter(r=>r.assetClass===a).reduce((acc,r)=>acc+r.weight,0)})).filter(d=>d.value>0),[filtered]);
  const radarData=useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;
    return[{axis:'ESG',value:avg('esgScore')},{axis:'Climate',value:avg('climateScore')},{axis:'Green Rev',value:avg('greenRevenue')},{axis:'Temp Align',value:100-avg('tempAlignment')*30},{axis:'Carbon Eff',value:100-avg('carbonInt')/5},{axis:'SBTi',value:filtered.filter(r=>r.sbtiAligned==='Yes').length/filtered.length*100}];},[filtered]);
  const scopeData=useMemo(()=>{if(!filtered.length)return[];return[{name:'Scope 1',value:filtered.reduce((a,r)=>a+r.scope1,0)},{name:'Scope 2',value:filtered.reduce((a,r)=>a+r.scope2,0)},{name:'Scope 3',value:filtered.reduce((a,r)=>a+r.scope3,0)}];},[filtered]);
  const trendData=useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,carbon:filtered.reduce((a,r)=>a+[r.q1Carbon,r.q2Carbon,r.q3Carbon,r.q4Carbon][i],0)/(filtered.length||1)})),[filtered]);

  const renderKPIs=()=>(<div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
    <div style={kpiBoxS}><div style={kpiVal}>{kpis.count}</div><div style={kpiLab}>Holdings</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt0(kpis.waci)}</div><div style={kpiLab}>Current WACI</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:T.green}}>{fmt0(kpis.optWaci)}</div><div style={kpiLab}>Optimized WACI</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:T.green}}>{fmt1(kpis.reduction)}%</div><div style={kpiLab}>Carbon Reduction</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt1(kpis.avgTE)}%</div><div style={kpiLab}>Avg Tracking Error</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:kpis.avgTemp<=2?T.green:T.amber}}>{fmt1(kpis.avgTemp)}C</div><div style={kpiLab}>Avg Temp Alignment</div></div>
  </div>);

  const renderFilters=()=>(<div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
    <input style={inputS} placeholder="Search holdings, sectors..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
    <select style={{...inputS,width:160}} value={fSector} onChange={e=>{setFSector(e.target.value);setPage(0);}}><option value="All">All Sectors</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
    <select style={{...inputS,width:160}} value={fAsset} onChange={e=>{setFAsset(e.target.value);setPage(0);}}><option value="All">All Asset Classes</option>{ASSET_CLASSES.map(a=><option key={a}>{a}</option>)}</select>
    <button style={{...btnS(false),marginLeft:'auto'}} onClick={()=>exportCSV(filtered,'carbon_allocation.csv')}>Export CSV</button>
  </div>);

  const renderPagination=()=>(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,fontFamily:T.mono,fontSize:12,color:T.textSec}}>
    <span>{page*PAGE_SIZE+1}-{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
    <div style={{display:'flex',gap:4}}><button style={btnS(false)} disabled={page===0} onClick={()=>setPage(p=>p-1)}>Prev</button>
      {Array.from({length:Math.min(totalPages,7)},(_,i)=>{let pg=i;if(totalPages>7){if(page<4)pg=i;else if(page>=totalPages-3)pg=totalPages-7+i;else pg=page-3+i;}return <button key={pg} style={btnS(pg===page)} onClick={()=>setPage(pg)}>{pg+1}</button>;})}
      <button style={btnS(false)} disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderExpanded=(r)=>(<tr key={`exp-${r.id}`}><td colSpan={99} style={{background:T.surfaceH,padding:20,borderBottom:`1px solid ${T.border}`}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>HOLDING DETAILS</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Sector:</strong> {r.sector}</div><div><strong>Asset Class:</strong> {r.assetClass}</div><div><strong>Region:</strong> {r.region}</div>
          <div><strong>Strategy:</strong> {r.strategy}</div><div><strong>Market Cap:</strong> {fmtM(r.marketCap)}</div><div><strong>SBTi Aligned:</strong> <span style={{color:r.sbtiAligned==='Yes'?T.green:T.red}}>{r.sbtiAligned}</span></div></div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>CARBON METRICS</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Current Weight:</strong> {r.weight}%</div><div><strong>Optimized Weight:</strong> {r.optWeight}%</div>
          <div><strong>Carbon Int:</strong> {r.carbonInt} tCO2e/$M</div><div><strong>Opt Carbon Int:</strong> <span style={{color:T.green}}>{r.optCarbonInt}</span></div>
          <div><strong>Delta:</strong> <span style={{color:T.green}}>-{r.carbonDelta}</span></div><div><strong>Scope 1:</strong> {r.scope1}</div><div><strong>Scope 2:</strong> {r.scope2}</div><div><strong>Scope 3:</strong> {r.scope3}</div></div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>PERFORMANCE</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Tracking Error:</strong> {r.trackingError}%</div><div><strong>Return Impact:</strong> <span style={{color:r.returnImpact>=0?T.green:T.red}}>{r.returnImpact>0?'+':''}{r.returnImpact}%</span></div>
          <div><strong>Temp Alignment:</strong> {r.tempAlignment}C</div><div><strong>Green Revenue:</strong> {r.greenRevenue}%</div>
          <div><strong>ESG Score:</strong> <span style={{color:scoreColor(r.esgScore)}}>{r.esgScore}</span></div><div><strong>Climate Score:</strong> <span style={{color:scoreColor(r.climateScore)}}>{r.climateScore}</span></div></div></div>
    </div>
  </td></tr>);

  const renderTable=(cols)=>(<div style={{...cardS,overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{cols.map(([k,l])=><th key={k} style={thS} onClick={()=>toggleSort(k)}>{l}{sortArrow(k)}</th>)}</tr></thead>
    <tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        {cols.map(([k])=>{const v=r[k];if(k==='name')return <td key={k} style={{...tdS,fontWeight:600,color:T.navy}}>{v}</td>;if(k==='carbonDelta')return <td key={k} style={{...tdS,fontFamily:T.mono,color:T.green}}>-{v}</td>;if(k==='sbtiAligned')return <td key={k} style={{...tdS,color:v==='Yes'?T.green:T.red,fontWeight:600}}>{v}</td>;if(typeof v==='number')return <td key={k} style={{...tdS,fontFamily:T.mono}}>{v<20?fmt1(v):fmt0(v)}</td>;return <td key={k} style={tdS}>{v}</td>;})}
      </tr>{expanded===r.id&&renderExpanded(r)}
    </React.Fragment>))}</tbody></table>{renderPagination()}
  </div>);

  const renderTab0=()=>(<>{renderKPIs()}{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CURRENT vs OPTIMIZED WACI BY SECTOR</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={sectorCarbon}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/><Legend/>
          <Bar dataKey="current" name="Current" fill={T.red} radius={[2,2,0,0]}/><Bar dataKey="optimized" name="Optimized" fill={T.green} radius={[2,2,0,0]}/></BarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>ASSET CLASS ALLOCATION</div>
        <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={assetDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
          {assetDist.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CARBON INTENSITY vs WEIGHT</div>
      <ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="Weight%" tick={{fontSize:11}}/><YAxis dataKey="y" name="Carbon Int" tick={{fontSize:11}}/><ZAxis dataKey="z" range={[30,300]}/>
        <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>Wt:{d.x}% CI:{d.y}</div></div>}}/>
        <Scatter data={filtered.map(r=>({n:r.name,x:r.weight,y:r.carbonInt,z:r.marketCap}))} fill={T.navy}/></ScatterChart></ResponsiveContainer></div>
    {renderTable([['name','Holding'],['sector','Sector'],['weight','Wt%'],['optWeight','Opt Wt%'],['carbonInt','Carbon Int'],['optCarbonInt','Opt CI'],['carbonDelta','Delta'],['trackingError','TE%']])}
  </>);

  const renderTab1=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>OPTIMIZATION RADAR</div>
        <ResponsiveContainer width="100%" height={300}><RadarChart data={radarData}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="axis" tick={{fontSize:11}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:10}}/>
          <Radar name="Portfolio" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/><Tooltip/></RadarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>RETURN IMPACT vs TRACKING ERROR</div>
        <ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="TE%" tick={{fontSize:11}}/><YAxis dataKey="y" name="Return%" tick={{fontSize:11}}/>
          <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>TE:{d.x}% Ret:{d.y}%</div></div>}}/>
          <Scatter data={filtered.map(r=>({n:r.name,x:r.trackingError,y:r.returnImpact}))} fill={T.sage}/></ScatterChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>TEMPERATURE ALIGNMENT DISTRIBUTION</div>
      <ResponsiveContainer width="100%" height={260}><BarChart data={['<1.5C','1.5-2C','2-3C','>3C'].map((l,i)=>{const rng=[[0,1.5],[1.5,2],[2,3],[3,10]];return{name:l,count:filtered.filter(r=>r.tempAlignment>=rng[i][0]&&r.tempAlignment<rng[i][1]).length};})}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
        <Bar dataKey="count" name="Holdings" radius={[4,4,0,0]}>{['<1.5C','1.5-2C','2-3C','>3C'].map((l,i)=><Cell key={i} fill={[T.green,T.sage,T.amber,T.red][i]}/>)}</Bar></BarChart></ResponsiveContainer></div>
    {renderTable([['name','Holding'],['carbonInt','Current CI'],['optCarbonInt','Opt CI'],['carbonDelta','Delta'],['trackingError','TE%'],['returnImpact','Return%'],['tempAlignment','Temp C'],['sbtiAligned','SBTi']])}
  </>);

  const renderTab2=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SCOPE BREAKDOWN</div>
        <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={scopeData} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
          <Cell fill={T.sage}/><Cell fill={T.gold}/><Cell fill={T.red}/></Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SCOPE BY SECTOR</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={SECTORS.slice(0,8).map(s=>{const items=filtered.filter(r=>r.sector===s);if(!items.length)return null;return{name:s.length>10?s.slice(0,10)+'..':s,s1:items.reduce((a,r)=>a+r.scope1,0)/items.length,s2:items.reduce((a,r)=>a+r.scope2,0)/items.length,s3:items.reduce((a,r)=>a+r.scope3,0)/items.length};}).filter(Boolean)}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/><Legend/>
          <Bar dataKey="s1" name="Scope 1" stackId="a" fill={T.sage}/><Bar dataKey="s2" name="Scope 2" stackId="a" fill={T.gold}/><Bar dataKey="s3" name="Scope 3" stackId="a" fill={T.red}/></BarChart></ResponsiveContainer></div>
    </div>
    {renderTable([['name','Holding'],['scope1','Scope1'],['scope2','Scope2'],['scope3','Scope3'],['carbonInt','Total CI'],['greenRevenue','Green Rev%'],['esgScore','ESG'],['climateScore','Climate']])}
  </>);

  const renderTab3=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CARBON INTENSITY TREND</div>
        <ResponsiveContainer width="100%" height={280}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="quarter" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Line type="monotone" dataKey="carbon" stroke={T.navy} strokeWidth={2} dot={{r:4}} name="Avg Carbon Int"/></LineChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SECTOR CARBON REDUCTION</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={sectorCarbon.map(s=>({...s,reduction:s.current-s.optimized}))}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="reduction" name="Carbon Reduction" fill={T.green} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>GREEN REVENUE vs CLIMATE SCORE</div>
      <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="Green Rev%" tick={{fontSize:11}}/><YAxis dataKey="y" name="Climate Score" tick={{fontSize:11}}/>
        <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>Green:{d.x}% Climate:{d.y}</div></div>}}/>
        <Scatter data={filtered.map(r=>({n:r.name,x:r.greenRevenue,y:r.climateScore}))} fill={T.sage}/></ScatterChart></ResponsiveContainer></div>
    {renderTable([['name','Holding'],['q1Carbon','Q1 CI'],['q2Carbon','Q2 CI'],['q3Carbon','Q3 CI'],['q4Carbon','Q4 CI'],['carbonDelta','Opt Delta'],['greenRevenue','Green%'],['tempAlignment','Temp C']])}
  </>);

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}><div style={{maxWidth:1400,margin:'0 auto'}}>
    <div style={{marginBottom:20}}><h1 style={{fontFamily:T.font,fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Carbon-Aware Allocation</h1><p style={{fontFamily:T.font,fontSize:13,color:T.textSec,marginTop:2}}>Carbon-adjusted portfolio optimization across {DATA.length} holdings</p></div>
    <div style={{display:'flex',gap:6,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
      {TABS.map((t,i)=><button key={i} style={btnS(tab===i)} onClick={()=>{setTab(i);setPage(0);setExpanded(null);}}>{t}</button>)}</div>
    {tab===0&&renderTab0()}{tab===1&&renderTab1()}{tab===2&&renderTab2()}{tab===3&&renderTab3()}
  </div></div>);
}
