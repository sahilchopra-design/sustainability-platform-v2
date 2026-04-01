import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Legend,Cell,LineChart,Line,PieChart,Pie,AreaChart,Area,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt1=n=>Number(n).toFixed(1);const fmt0=n=>Number(n).toFixed(0);const fmtPct=n=>`${fmt1(n)}%`;
const sevColor=v=>v==='Low'?T.green:v==='Medium'?T.amber:v==='High'?T.red:'#7c3aed';
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.goldL,T.sageL,T.red,T.amber,T.green,'#7c3aed'];

const SCENARIOS=['Net Zero 2050','Delayed Transition','Current Policies','Fragmented World','NDCs Achieved','Below 2C'];
const SECTORS=['Financials','Energy','Technology','Healthcare','Industrials','Materials','Consumer Disc','Utilities','Real Estate','Telecom'];
const HORIZONS=['1Y','3Y','5Y','10Y','20Y','30Y'];
const SEVERITIES=['Low','Medium','High','Critical'];

const genPositions=(count)=>{
  const pos=[];
  const names=['Global Equity Fund','EM Bond Portfolio','Investment Grade Credit','High Yield Allocation','Sovereign Debt Mix','Real Assets Fund',
    'Tech Growth Portfolio','Green Bond Sleeve','Infrastructure Debt','Convertible Strategy','Multi-Asset Fund','Macro Hedge Portfolio',
    'Private Equity Sleeve','Commodities Basket','FX Carry Trade','Volatility Strategy','Credit Long-Short','Equity Market Neutral',
    'Merger Arb Fund','Distressed Debt','CLO Tranche AA','RMBS Portfolio','CMBS Sleeve','ABS Consumer','Leveraged Loans',
    'Direct Lending Pool','Mezzanine Capital','Venture Debt Fund','Bridge Loan Book','Trade Finance','Supply Chain Finance',
    'Factoring Portfolio','Leasing Assets','Project Finance','Export Credit','Microfinance Pool','Impact Bond Fund',
    'Social Housing Debt','Climate Transition','Blue Bond Sleeve','Sustainability Link','Catastrophe Bond','Longevity Swap',
    'Inflation Linked','Covered Bond Pool','Pfandbriefe Sleeve','Cedulas Portfolio','Samurai Bonds','Dim Sum Bonds','Sukuk Portfolio'];
  for(let i=0;i<count;i++){
    const s=idx=>sr(i*idx+idx);
    const sector=SECTORS[Math.floor(s(17)*SECTORS.length)];
    const severity=SEVERITIES[Math.floor(s(23)*SEVERITIES.length)];
    const notional=Math.floor(5+s(29)*495);
    const baseVaR=Number((0.5+s(31)*14.5).toFixed(2));
    const stressVaR=Number((baseVaR*(1.2+s(37)*2.8)).toFixed(2));
    const scenLosses=SCENARIOS.map((_,si)=>Number((s(41+si*7)*30*(1+si*0.3)).toFixed(1)));
    const horizonLosses=HORIZONS.map((_,hi)=>Number((baseVaR*(0.3+hi*0.4+s(53+hi*11)*2)).toFixed(1)));
    pos.push({
      id:i+1,name:names[i%names.length]+(i>=names.length?` ${Math.floor(i/names.length)+1}`:''),
      sector,severity,notional,baseVaR,stressVaR,
      maxDrawdown:Number((stressVaR*(1+s(59)*0.8)).toFixed(1)),
      recoveryDays:Math.floor(30+s(61)*330),
      liquidityScore:Math.floor(20+s(67)*75),
      concentrationRisk:Number((s(71)*45).toFixed(1)),
      correlationBeta:Number((0.2+s(73)*1.6).toFixed(2)),
      scenLoss1:scenLosses[0],scenLoss2:scenLosses[1],scenLoss3:scenLosses[2],scenLoss4:scenLosses[3],scenLoss5:scenLosses[4],scenLoss6:scenLosses[5],
      h1y:horizonLosses[0],h3y:horizonLosses[1],h5y:horizonLosses[2],h10y:horizonLosses[3],h20y:horizonLosses[4],h30y:horizonLosses[5],
      tailRisk:Number((s(79)*25).toFixed(1)),cvar95:Number((baseVaR*1.5+s(83)*10).toFixed(1)),cvar99:Number((baseVaR*2.2+s(89)*15).toFixed(1)),
      marginalContrib:Number((s(97)*8).toFixed(2)),componentVaR:Number((baseVaR*notional/100).toFixed(1)),
      q1:Number((baseVaR*(0.8+s(101)*0.4)).toFixed(1)),q2:Number((baseVaR*(0.85+s(103)*0.35)).toFixed(1)),q3:Number((baseVaR*(0.9+s(107)*0.3)).toFixed(1)),q4:Number((baseVaR*(0.95+s(109)*0.25)).toFixed(1)),
    });
  }
  return pos;
};

const DATA=genPositions(50);
const TABS=['Scenario Dashboard','VaR Analysis','Horizon Stress','Risk Decomposition'];
const PAGE_SIZE=12;

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
const CT=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'10px 14px',fontFamily:T.font,fontSize:12}}><div style={{fontWeight:700,color:T.navy,marginBottom:4}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?fmt1(p.value):p.value}</div>)}</div>);};

export default function ScenarioStressTestPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sortCol,setSortCol]=useState('stressVaR');const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(0);const[expanded,setExpanded]=useState(null);const[fSector,setFSector]=useState('All');const[fSev,setFSev]=useState('All');

  const filtered=useMemo(()=>{
    let d=[...DATA];
    if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)||r.sector.toLowerCase().includes(s));}
    if(fSector!=='All')d=d.filter(r=>r.sector===fSector);if(fSev!=='All')d=d.filter(r=>r.severity===fSev);
    d.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];if(av==null)return 1;if(bv==null)return -1;return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});return d;
  },[search,sortCol,sortDir,fSector,fSev]);

  const paged=useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const toggleSort=(c)=>{if(sortCol===c)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(c);setSortDir('desc');}setPage(0);};
  const sortArrow=(c)=>sortCol===c?(sortDir==='asc'?' ▲':' ▼'):'';

  const kpis=useMemo(()=>{const d=filtered;if(!d.length)return{count:0,totalNotional:0,avgVaR:0,avgStress:0,avgCVaR99:0,critCount:0};
    return{count:d.length,totalNotional:d.reduce((a,r)=>a+r.notional,0),avgVaR:d.reduce((a,r)=>a+r.baseVaR,0)/d.length,avgStress:d.reduce((a,r)=>a+r.stressVaR,0)/d.length,avgCVaR99:d.reduce((a,r)=>a+r.cvar99,0)/d.length,critCount:d.filter(r=>r.severity==='Critical'||r.severity==='High').length};},[filtered]);

  const scenarioAvg=useMemo(()=>SCENARIOS.map((name,i)=>({name:name.length>16?name.slice(0,16)+'..':name,loss:filtered.reduce((a,r)=>a+[r.scenLoss1,r.scenLoss2,r.scenLoss3,r.scenLoss4,r.scenLoss5,r.scenLoss6][i],0)/(filtered.length||1)})),[filtered]);
  const sectorVaR=useMemo(()=>{const m={};const c={};filtered.forEach(r=>{m[r.sector]=(m[r.sector]||0)+r.stressVaR;c[r.sector]=(c[r.sector]||0)+1;});return Object.entries(m).map(([name,sum])=>({name:name.length>10?name.slice(0,10)+'..':name,var:sum/c[name]})).sort((a,b)=>b.var-a.var);},[filtered]);
  const sevDist=useMemo(()=>SEVERITIES.map(s=>({name:s,value:filtered.filter(r=>r.severity===s).length})),[filtered]);
  const horizonAvg=useMemo(()=>HORIZONS.map((h,i)=>({horizon:h,loss:filtered.reduce((a,r)=>a+[r.h1y,r.h3y,r.h5y,r.h10y,r.h20y,r.h30y][i],0)/(filtered.length||1)})),[filtered]);
  const radarData=useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;
    return[{axis:'Base VaR',value:avg('baseVaR')*5},{axis:'Stress VaR',value:avg('stressVaR')*3},{axis:'CVaR 99',value:avg('cvar99')*3},{axis:'Tail Risk',value:avg('tailRisk')*4},{axis:'Liquidity',value:avg('liquidityScore')},{axis:'Concentration',value:avg('concentrationRisk')*2}];},[filtered]);

  const renderKPIs=()=>(<div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
    <div style={kpiBoxS}><div style={kpiVal}>{kpis.count}</div><div style={kpiLab}>Positions</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>${kpis.totalNotional}M</div><div style={kpiLab}>Total Notional</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt1(kpis.avgVaR)}%</div><div style={kpiLab}>Avg Base VaR</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{fmt1(kpis.avgStress)}%</div><div style={kpiLab}>Avg Stress VaR</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt1(kpis.avgCVaR99)}%</div><div style={kpiLab}>Avg CVaR 99</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{kpis.critCount}</div><div style={kpiLab}>High/Critical</div></div>
  </div>);

  const renderFilters=()=>(<div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
    <input style={inputS} placeholder="Search positions, sectors..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
    <select style={{...inputS,width:160}} value={fSector} onChange={e=>{setFSector(e.target.value);setPage(0);}}><option value="All">All Sectors</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
    <select style={{...inputS,width:140}} value={fSev} onChange={e=>{setFSev(e.target.value);setPage(0);}}><option value="All">All Severity</option>{SEVERITIES.map(s=><option key={s}>{s}</option>)}</select>
    <button style={{...btnS(false),marginLeft:'auto'}} onClick={()=>exportCSV(filtered,'scenario_stress_test.csv')}>Export CSV</button>
  </div>);

  const renderPagination=()=>(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,fontFamily:T.mono,fontSize:12,color:T.textSec}}>
    <span>{page*PAGE_SIZE+1}-{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
    <div style={{display:'flex',gap:4}}><button style={btnS(false)} disabled={page===0} onClick={()=>setPage(p=>p-1)}>Prev</button>
      {Array.from({length:Math.min(totalPages,7)},(_,i)=>{let pg=i;if(totalPages>7){if(page<4)pg=i;else if(page>=totalPages-3)pg=totalPages-7+i;else pg=page-3+i;}return <button key={pg} style={btnS(pg===page)} onClick={()=>setPage(pg)}>{pg+1}</button>;})}
      <button style={btnS(false)} disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderExpanded=(r)=>(<tr key={`exp-${r.id}`}><td colSpan={99} style={{background:T.surfaceH,padding:20,borderBottom:`1px solid ${T.border}`}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>POSITION DETAILS</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Sector:</strong> {r.sector}</div><div><strong>Notional:</strong> ${r.notional}M</div><div><strong>Severity:</strong> <span style={{color:sevColor(r.severity)}}>{r.severity}</span></div>
          <div><strong>Liquidity:</strong> {r.liquidityScore}</div><div><strong>Concentration:</strong> {r.concentrationRisk}%</div><div><strong>Correlation Beta:</strong> {r.correlationBeta}</div></div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>VaR METRICS</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Base VaR:</strong> {r.baseVaR}%</div><div><strong>Stress VaR:</strong> <span style={{color:T.red,fontWeight:700}}>{r.stressVaR}%</span></div>
          <div><strong>Max Drawdown:</strong> {r.maxDrawdown}%</div><div><strong>Recovery:</strong> {r.recoveryDays}d</div><div><strong>CVaR 95:</strong> {r.cvar95}%</div><div><strong>CVaR 99:</strong> {r.cvar99}%</div>
          <div><strong>Tail Risk:</strong> {r.tailRisk}%</div><div><strong>Marginal Contrib:</strong> {r.marginalContrib}%</div></div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>SCENARIO LOSSES</div>
        <ResponsiveContainer width="100%" height={180}><BarChart data={SCENARIOS.map((name,i)=>({name:name.length>12?name.slice(0,12)+'..':name,loss:[r.scenLoss1,r.scenLoss2,r.scenLoss3,r.scenLoss4,r.scenLoss5,r.scenLoss6][i]}))}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:9}} angle={-30} textAnchor="end" height={60}/><YAxis tick={{fontSize:10}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="loss" name="Loss%" radius={[3,3,0,0]}>{SCENARIOS.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>
    </div>
  </td></tr>);

  const renderTable=(cols)=>(<div style={{...cardS,overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{cols.map(([k,l])=><th key={k} style={thS} onClick={()=>toggleSort(k)}>{l}{sortArrow(k)}</th>)}</tr></thead>
    <tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        {cols.map(([k])=>{const v=r[k];if(k==='name')return <td key={k} style={{...tdS,fontWeight:600,color:T.navy}}>{v}</td>;if(k==='severity')return <td key={k} style={tdS}><span style={badgeS(sevColor(v))}>{v}</span></td>;if(typeof v==='number')return <td key={k} style={{...tdS,fontFamily:T.mono}}>{v<20?fmt1(v):fmt0(v)}</td>;return <td key={k} style={tdS}>{v}</td>;})}
      </tr>{expanded===r.id&&renderExpanded(r)}
    </React.Fragment>))}</tbody></table>{renderPagination()}
  </div>);

  const renderTab0=()=>(<>{renderKPIs()}{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>AVG LOSS BY SCENARIO</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={scenarioAvg}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={55}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="loss" name="Avg Loss%" radius={[4,4,0,0]}>{scenarioAvg.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SEVERITY DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={sevDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label>
          {sevDist.map((e,i)=><Cell key={i} fill={[T.green,T.amber,T.red,'#7c3aed'][i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>STRESS VaR BY SECTOR</div>
      <ResponsiveContainer width="100%" height={280}><BarChart data={sectorVaR} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" width={90} tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
        <Bar dataKey="var" name="Avg Stress VaR%" fill={T.red} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
    {renderTable([['name','Position'],['sector','Sector'],['notional','Notional'],['baseVaR','Base VaR'],['stressVaR','Stress VaR'],['cvar99','CVaR99'],['severity','Severity'],['maxDrawdown','Max DD']])}
  </>);

  const renderTab1=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>VaR RISK RADAR</div>
        <ResponsiveContainer width="100%" height={300}><RadarChart data={radarData}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="axis" tick={{fontSize:11}}/><PolarRadiusAxis tick={{fontSize:10}}/>
          <Radar name="Risk" dataKey="value" stroke={T.red} fill={T.red} fillOpacity={0.2}/><Tooltip/></RadarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>BASE vs STRESS VaR SCATTER</div>
        <ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="Base VaR" tick={{fontSize:11}}/><YAxis dataKey="y" name="Stress VaR" tick={{fontSize:11}}/>
          <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>Base:{d.x}% Stress:{d.y}%</div></div>}}/>
          <Scatter data={filtered.map(r=>({n:r.name,x:r.baseVaR,y:r.stressVaR}))} fill={T.navy}/></ScatterChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>VaR QUARTERLY TREND</div>
      <ResponsiveContainer width="100%" height={260}><LineChart data={['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,var:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length||1)}))}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="quarter" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
        <Line type="monotone" dataKey="var" stroke={T.navy} strokeWidth={2} dot={{r:4}} name="Avg VaR%"/></LineChart></ResponsiveContainer></div>
    {renderTable([['name','Position'],['baseVaR','Base VaR'],['stressVaR','Stress VaR'],['cvar95','CVaR95'],['cvar99','CVaR99'],['tailRisk','Tail'],['maxDrawdown','Max DD'],['recoveryDays','Recovery']])}
  </>);

  const renderTab2=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>HORIZON LOSS PROFILE</div>
        <ResponsiveContainer width="100%" height={280}><AreaChart data={horizonAvg}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="horizon" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Area type="monotone" dataKey="loss" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Avg Loss%"/></AreaChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SECTOR HORIZON COMPARISON</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={SECTORS.slice(0,6).map(s=>{const items=filtered.filter(r=>r.sector===s);if(!items.length)return null;return{name:s.length>10?s.slice(0,10)+'..':s,y1:items.reduce((a,r)=>a+r.h1y,0)/items.length,y5:items.reduce((a,r)=>a+r.h5y,0)/items.length,y30:items.reduce((a,r)=>a+r.h30y,0)/items.length};}).filter(Boolean)}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/><Legend/>
          <Bar dataKey="y1" name="1Y" fill={T.green} radius={[2,2,0,0]}/><Bar dataKey="y5" name="5Y" fill={T.amber} radius={[2,2,0,0]}/><Bar dataKey="y30" name="30Y" fill={T.red} radius={[2,2,0,0]}/></BarChart></ResponsiveContainer></div>
    </div>
    {renderTable([['name','Position'],['h1y','1Y'],['h3y','3Y'],['h5y','5Y'],['h10y','10Y'],['h20y','20Y'],['h30y','30Y'],['severity','Severity']])}
  </>);

  const renderTab3=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>COMPONENT VaR BY POSITION (Top 15)</div>
        <ResponsiveContainer width="100%" height={300}><BarChart data={[...filtered].sort((a,b)=>b.componentVaR-a.componentVaR).slice(0,15).map(r=>({name:r.name.length>15?r.name.slice(0,15)+'..':r.name,compVaR:r.componentVaR}))} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" width={120} tick={{fontSize:10}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="compVaR" name="Component VaR" fill={T.navy} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>MARGINAL CONTRIBUTION DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={300}><BarChart data={[...filtered].sort((a,b)=>b.marginalContrib-a.marginalContrib).slice(0,12).map(r=>({name:r.name.length>12?r.name.slice(0,12)+'..':r.name,mc:r.marginalContrib}))}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:9}} angle={-30} textAnchor="end" height={60}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="mc" name="Marginal Contrib%" fill={T.gold} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CONCENTRATION vs CORRELATION</div>
      <ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="Concentration%" tick={{fontSize:11}}/><YAxis dataKey="y" name="Correlation Beta" tick={{fontSize:11}}/>
        <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>Conc:{d.x}% Beta:{d.y}</div></div>}}/>
        <Scatter data={filtered.map(r=>({n:r.name,x:r.concentrationRisk,y:r.correlationBeta}))} fill={T.sage}/></ScatterChart></ResponsiveContainer></div>
    {renderTable([['name','Position'],['componentVaR','Comp VaR'],['marginalContrib','Marg Contrib'],['concentrationRisk','Conc%'],['correlationBeta','Corr Beta'],['liquidityScore','Liquidity'],['severity','Severity']])}
  </>);

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}><div style={{maxWidth:1400,margin:'0 auto'}}>
    <div style={{marginBottom:20}}><h1 style={{fontFamily:T.font,fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Multi-Scenario Stress Testing</h1><p style={{fontFamily:T.font,fontSize:13,color:T.textSec,marginTop:2}}>Stress test analytics across {DATA.length} positions and {SCENARIOS.length} climate scenarios</p></div>
    <div style={{display:'flex',gap:6,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
      {TABS.map((t,i)=><button key={i} style={btnS(tab===i)} onClick={()=>{setTab(i);setPage(0);setExpanded(null);}}>{t}</button>)}</div>
    {tab===0&&renderTab0()}{tab===1&&renderTab1()}{tab===2&&renderTab2()}{tab===3&&renderTab3()}
  </div></div>);
}
