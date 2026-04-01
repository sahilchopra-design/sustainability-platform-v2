import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Legend,Cell,LineChart,Line,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt1=n=>Number(n).toFixed(1);const fmt0=n=>Number(n).toFixed(0);const fmtM=n=>n>=1000?`$${(n/1000).toFixed(1)}B`:`$${n}M`;
const riskColor=v=>v==='Low'?T.green:v==='Medium'?T.amber:v==='High'?T.red:'#7c3aed';
const scoreColor=v=>v>=70?T.green:v>=45?T.amber:T.red;
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.goldL,T.sageL,T.red,T.amber,T.green,'#7c3aed'];

const SECTORS=['Real Estate','Infrastructure','Corporate Lending','Healthcare','Technology','Energy','Agriculture','Manufacturing'];
const STRATEGIES=['Direct Lending','Mezzanine','Distressed','Unitranche','ABL','Venture Debt','Bridge Loans','Special Situations'];
const RATINGS=['AAA','AA','A','BBB','BB','B','CCC'];
const RISK_LEVELS=['Low','Medium','High','Critical'];

const genLoans=(count)=>{
  const loans=[];
  const names=['Meridian Capital Corp','Blue Harbor Credit','Atlas Infrastructure Debt','Pacific Mezzanine Fund','Nordic Bridge Capital','Summit Direct Lending',
    'Evergreen Credit Partners','Cascade Capital Solutions','Vanguard Private Debt','Redwood Asset Finance','Granite Point Capital','Silver Creek Lending',
    'Apex Credit Strategies','Ironwood Finance Corp','Cypress Capital Group','Harbor Bridge Debt','Pinnacle Credit Fund','Sierra Lending Partners',
    'Clearwater Capital','Orion Private Credit','Falcon Credit Corp','Titan Debt Solutions','Eclipse Capital Fund','Cardinal Credit Partners',
    'Northstar Direct Lending','Riverview Capital','Golden Gate Credit','Sequoia Debt Fund','Maritime Capital Corp','Prairie Wind Finance',
    'Horizon Bridge Capital','Cobalt Credit Solutions','Emerald Mezzanine Fund','Diamond Point Capital','Sapphire Lending Corp','Obsidian Debt Partners',
    'Sterling Credit Group','Catalyst Capital Debt','Zenith Private Credit','Phoenix Bridge Fund','Oakwood Direct Lending','Maple Leaf Credit',
    'Terra Nova Capital','Condor Finance Corp','Pegasus Debt Solutions','Neptune Credit Fund','Avalon Capital Partners','Crimson Bridge Lending',
    'Jade Capital Group','Topaz Credit Corp'];
  for(let i=0;i<count;i++){
    const s1=sr(i*19+5),s2=sr(i*29+7),s3=sr(i*37+11),s4=sr(i*41+13),s5=sr(i*43+17);
    const s6=sr(i*47+19),s7=sr(i*53+23),s8=sr(i*59+29),s9=sr(i*61+31),s10=sr(i*67+37);
    const sector=SECTORS[Math.floor(s1*SECTORS.length)];
    const strategy=STRATEGIES[Math.floor(s2*STRATEGIES.length)];
    const rating=RATINGS[Math.floor(s3*RATINGS.length)];
    const region=['North America','Europe','Asia Pacific','LATAM','Middle East','Africa'][Math.floor(s4*6)];
    const riskLevel=RISK_LEVELS[Math.floor(s5*RISK_LEVELS.length)];
    const notional=Math.floor(10+s6*490);
    const spread=Math.floor(150+s7*650);
    const ltv=Number((30+s8*45).toFixed(1));
    const maturity=Math.floor(1+s9*9);
    const climateScore=Math.floor(15+s10*80);
    const transRisk=Math.floor(10+sr(i*71+41)*85);
    const physRisk=Math.floor(5+sr(i*73+43)*80);
    const carbonFp=Math.floor(20+sr(i*79+47)*480);
    const waterStress=Math.floor(5+sr(i*83+53)*90);
    const stranded=Number((sr(i*89+59)*35).toFixed(1));
    const pd=Number((0.1+sr(i*97+61)*9.9).toFixed(2));
    const lgd=Number((20+sr(i*101+67)*60).toFixed(1));
    const expectedLoss=Number((pd*lgd/100).toFixed(2));
    const covenant=sr(i*103+71)>0.6?'Pass':sr(i*107+73)>0.3?'Watch':'Breach';
    loans.push({
      id:i+1,name:names[i%names.length]+(i>=names.length?` ${Math.floor(i/names.length)+1}`:''),
      sector,strategy,rating,region,riskLevel,notional,spread,ltv,maturity,climateScore,transRisk,physRisk,
      carbonFp,waterStress,stranded,pd,lgd,expectedLoss,covenant,
      envScore:Math.floor(20+sr(i*109+79)*75),socScore:Math.floor(20+sr(i*113+83)*75),govScore:Math.floor(20+sr(i*127+89)*75),
      scenarioLoss1:Number((sr(i*131+97)*15).toFixed(1)),scenarioLoss2:Number((sr(i*137+101)*25).toFixed(1)),scenarioLoss3:Number((sr(i*139+103)*40).toFixed(1)),
      q1:Math.floor(20+sr(i*149+107)*75),q2:Math.floor(22+sr(i*151+109)*73),q3:Math.floor(24+sr(i*157+113)*71),q4:Math.floor(23+sr(i*163+127)*72),
    });
  }
  return loans;
};

const DATA=genLoans(50);
const TABS=['Portfolio Overview','Climate Risk','Credit Analysis','Scenario Stress'];
const PAGE_SIZE=12;

const cardS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16};
const inputS={fontFamily:T.mono,fontSize:13,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,outline:'none',background:T.surface,color:T.text,width:260};
const btnS=(a)=>({fontFamily:T.font,fontSize:13,fontWeight:a?700:500,padding:'8px 18px',border:`1px solid ${a?T.gold:T.border}`,borderRadius:6,background:a?T.gold:T.surface,color:a?'#fff':T.text,cursor:'pointer',transition:'all .2s'});
const thS={fontFamily:T.mono,fontSize:12,fontWeight:600,color:T.textSec,padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'};
const tdS={fontFamily:T.font,fontSize:13,color:T.text,padding:'10px 12px',borderBottom:`1px solid ${T.borderL}`};
const badgeS=(bg)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg,border:`1px solid ${bg}33`});
const kpiBoxS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,textAlign:'center',flex:1,minWidth:140};
const kpiVal={fontFamily:T.mono,fontSize:26,fontWeight:700,color:T.navy};
const kpiLab={fontFamily:T.font,fontSize:11,color:T.textMut,marginTop:4,textTransform:'uppercase',letterSpacing:0.5};

const exportCSV=(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
const CT=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'10px 14px',fontFamily:T.font,fontSize:12}}><div style={{fontWeight:700,color:T.navy,marginBottom:4}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?fmt1(p.value):p.value}</div>)}</div>);};

export default function PrivateCreditClimatePage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[sortCol,setSortCol]=useState('climateScore');
  const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(0);
  const[expanded,setExpanded]=useState(null);
  const[fSector,setFSector]=useState('All');
  const[fStrategy,setFStrategy]=useState('All');
  const[fRisk,setFRisk]=useState('All');

  const filtered=useMemo(()=>{
    let d=[...DATA];
    if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)||r.sector.toLowerCase().includes(s)||r.region.toLowerCase().includes(s));}
    if(fSector!=='All')d=d.filter(r=>r.sector===fSector);
    if(fStrategy!=='All')d=d.filter(r=>r.strategy===fStrategy);
    if(fRisk!=='All')d=d.filter(r=>r.riskLevel===fRisk);
    d.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];if(av==null)return 1;if(bv==null)return -1;return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});
    return d;
  },[search,sortCol,sortDir,fSector,fStrategy,fRisk]);

  const paged=useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const toggleSort=(c)=>{if(sortCol===c)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(c);setSortDir('desc');}setPage(0);};
  const sortArrow=(c)=>sortCol===c?(sortDir==='asc'?' ▲':' ▼'):'';

  const kpis=useMemo(()=>{const d=filtered;if(!d.length)return{count:0,totalExp:0,avgClimate:0,avgPd:0,avgSpread:0,highRisk:0};return{count:d.length,totalExp:d.reduce((a,r)=>a+r.notional,0),avgClimate:d.reduce((a,r)=>a+r.climateScore,0)/d.length,avgPd:d.reduce((a,r)=>a+r.pd,0)/d.length,avgSpread:d.reduce((a,r)=>a+r.spread,0)/d.length,highRisk:d.filter(r=>r.riskLevel==='High'||r.riskLevel==='Critical').length};},[filtered]);

  const sectorExp=useMemo(()=>{const m={};filtered.forEach(r=>{m[r.sector]=(m[r.sector]||0)+r.notional;});return Object.entries(m).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value})).sort((a,b)=>b.value-a.value);},[filtered]);
  const ratingDist=useMemo(()=>RATINGS.map(r=>({name:r,value:filtered.filter(l=>l.rating===r).length})).filter(d=>d.value>0),[filtered]);
  const strategyDist=useMemo(()=>{const m={};filtered.forEach(r=>{m[r.strategy]=(m[r.strategy]||0)+r.notional;});return Object.entries(m).map(([name,value])=>({name:name.length>12?name.slice(0,12)+'..':name,value})).sort((a,b)=>b.value-a.value);},[filtered]);
  const riskDist=useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.riskLevel===l).length})),[filtered]);
  const climateVsCredit=useMemo(()=>filtered.map(r=>({name:r.name,climate:r.climateScore,pd:r.pd,notional:r.notional})),[filtered]);
  const radarData=useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;return[{axis:'Climate',value:avg('climateScore')},{axis:'Env',value:avg('envScore')},{axis:'Social',value:avg('socScore')},{axis:'Gov',value:avg('govScore')},{axis:'Trans Inv',value:100-avg('transRisk')},{axis:'Phys Inv',value:100-avg('physRisk')}];},[filtered]);
  const scenarioData=useMemo(()=>['Orderly (1.5C)','Disorderly (2C)','Hot House (3C+)'].map((name,i)=>({name,loss:filtered.reduce((a,r)=>a+[r.scenarioLoss1,r.scenarioLoss2,r.scenarioLoss3][i],0)/(filtered.length||1)})),[filtered]);
  const trendData=useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,climate:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length||1)})),[filtered]);

  const renderKPIs=()=>(<div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
    <div style={kpiBoxS}><div style={kpiVal}>{kpis.count}</div><div style={kpiLab}>Positions</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmtM(kpis.totalExp)}</div><div style={kpiLab}>Total Exposure</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:scoreColor(kpis.avgClimate)}}>{fmt1(kpis.avgClimate)}</div><div style={kpiLab}>Avg Climate Score</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt1(kpis.avgPd)}%</div><div style={kpiLab}>Avg PD</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt0(kpis.avgSpread)}bp</div><div style={kpiLab}>Avg Spread</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{kpis.highRisk}</div><div style={kpiLab}>High/Crit Risk</div></div>
  </div>);

  const renderFilters=()=>(<div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
    <input style={inputS} placeholder="Search loans, sector, region..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
    <select style={{...inputS,width:160}} value={fSector} onChange={e=>{setFSector(e.target.value);setPage(0);}}><option value="All">All Sectors</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
    <select style={{...inputS,width:160}} value={fStrategy} onChange={e=>{setFStrategy(e.target.value);setPage(0);}}><option value="All">All Strategies</option>{STRATEGIES.map(s=><option key={s}>{s}</option>)}</select>
    <select style={{...inputS,width:140}} value={fRisk} onChange={e=>{setFRisk(e.target.value);setPage(0);}}><option value="All">All Risk</option>{RISK_LEVELS.map(r=><option key={r}>{r}</option>)}</select>
    <button style={{...btnS(false),marginLeft:'auto'}} onClick={()=>exportCSV(filtered,'private_credit_climate.csv')}>Export CSV</button>
  </div>);

  const renderPagination=()=>(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,fontFamily:T.mono,fontSize:12,color:T.textSec}}>
    <span>Showing {page*PAGE_SIZE+1}-{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
    <div style={{display:'flex',gap:4}}><button style={btnS(false)} disabled={page===0} onClick={()=>setPage(p=>p-1)}>Prev</button>
      {Array.from({length:Math.min(totalPages,7)},(_,i)=>{let pg=i;if(totalPages>7){if(page<4)pg=i;else if(page>=totalPages-3)pg=totalPages-7+i;else pg=page-3+i;}return <button key={pg} style={btnS(pg===page)} onClick={()=>setPage(pg)}>{pg+1}</button>;})}
      <button style={btnS(false)} disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderExpanded=(r)=>(<tr key={`exp-${r.id}`}><td colSpan={99} style={{background:T.surfaceH,padding:20,borderBottom:`1px solid ${T.border}`}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>CREDIT DETAILS</div>
        <div style={{fontFamily:T.font,fontSize:13,color:T.text,lineHeight:1.8}}>
          <div><strong>Strategy:</strong> {r.strategy}</div><div><strong>Rating:</strong> {r.rating}</div><div><strong>Region:</strong> {r.region}</div>
          <div><strong>Notional:</strong> {fmtM(r.notional)}</div><div><strong>Spread:</strong> {r.spread}bp</div><div><strong>LTV:</strong> {r.ltv}%</div>
          <div><strong>Maturity:</strong> {r.maturity}yr</div><div><strong>PD:</strong> {r.pd}%</div><div><strong>LGD:</strong> {r.lgd}%</div>
          <div><strong>Expected Loss:</strong> {r.expectedLoss}%</div><div><strong>Covenant:</strong> <span style={{color:r.covenant==='Pass'?T.green:r.covenant==='Watch'?T.amber:T.red}}>{r.covenant}</span></div>
        </div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>CLIMATE METRICS</div>
        <div style={{fontFamily:T.font,fontSize:13,color:T.text,lineHeight:1.8}}>
          <div><strong>Climate Score:</strong> <span style={{color:scoreColor(r.climateScore),fontWeight:700}}>{r.climateScore}</span></div>
          <div><strong>Transition Risk:</strong> {r.transRisk}%</div><div><strong>Physical Risk:</strong> {r.physRisk}%</div>
          <div><strong>Carbon Footprint:</strong> {r.carbonFp} tCO2e</div><div><strong>Water Stress:</strong> {r.waterStress}%</div>
          <div><strong>Stranded Asset Risk:</strong> {r.stranded}%</div>
          <div><strong>E Score:</strong> {r.envScore}</div><div><strong>S Score:</strong> {r.socScore}</div><div><strong>G Score:</strong> {r.govScore}</div>
        </div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>SCENARIO LOSSES</div>
        <div style={{fontFamily:T.font,fontSize:13,color:T.text,lineHeight:1.8}}>
          <div><strong>Orderly (1.5C):</strong> {r.scenarioLoss1}%</div><div><strong>Disorderly (2C):</strong> {r.scenarioLoss2}%</div>
          <div><strong>Hot House (3C+):</strong> <span style={{color:T.red,fontWeight:700}}>{r.scenarioLoss3}%</span></div>
        </div>
        <div style={{marginTop:12}}><ResponsiveContainer width="100%" height={120}><LineChart data={[{q:'Q1',s:r.q1},{q:'Q2',s:r.q2},{q:'Q3',s:r.q3},{q:'Q4',s:r.q4}]}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="q" tick={{fontSize:10}}/><YAxis domain={[0,100]} tick={{fontSize:10}}/><Tooltip content={<CT/>}/>
          <Line type="monotone" dataKey="s" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Climate"/></LineChart></ResponsiveContainer></div>
      </div>
    </div>
  </td></tr>);

  const renderTable=(cols)=>(<div style={{...cardS,overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{cols.map(([k,l])=><th key={k} style={thS} onClick={()=>toggleSort(k)}>{l}{sortArrow(k)}</th>)}</tr></thead>
    <tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        {cols.map(([k])=>{const v=r[k];
          if(k==='name')return <td key={k} style={{...tdS,fontWeight:600,color:T.navy}}>{v}</td>;
          if(k==='riskLevel')return <td key={k} style={tdS}><span style={badgeS(riskColor(v))}>{v}</span></td>;
          if(k==='climateScore')return <td key={k} style={{...tdS,fontWeight:700,color:scoreColor(v)}}>{v}</td>;
          if(k==='covenant')return <td key={k} style={{...tdS,color:v==='Pass'?T.green:v==='Watch'?T.amber:T.red,fontWeight:600}}>{v}</td>;
          if(k==='notional')return <td key={k} style={{...tdS,fontFamily:T.mono}}>{fmtM(v)}</td>;
          if(typeof v==='number')return <td key={k} style={{...tdS,fontFamily:T.mono}}>{v<10?fmt1(v):fmt0(v)}</td>;
          return <td key={k} style={tdS}>{v}</td>;
        })}
      </tr>{expanded===r.id&&renderExpanded(r)}
    </React.Fragment>))}</tbody></table>{renderPagination()}
  </div>);

  const renderTab0=()=>(<>{renderKPIs()}{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>EXPOSURE BY STRATEGY ($M)</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={strategyDist}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={55}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="value" name="Exposure" radius={[4,4,0,0]}>{strategyDist.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>RATING DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={ratingDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
          {ratingDist.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CLIMATE vs PD (bubble=notional)</div>
      <ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="climate" name="Climate" tick={{fontSize:11}}/><YAxis dataKey="pd" name="PD%" tick={{fontSize:11}}/><ZAxis dataKey="notional" range={[30,300]}/>
        <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontFamily:T.font,fontSize:12}}><div style={{fontWeight:700}}>{d.name}</div><div>Climate:{d.climate} PD:{d.pd}% {fmtM(d.notional)}</div></div>}}/>
        <Scatter data={climateVsCredit} fill={T.navy}/></ScatterChart></ResponsiveContainer></div>
    {renderTable([['name','Loan'],['sector','Sector'],['strategy','Strategy'],['rating','Rating'],['notional','Notional'],['climateScore','Climate'],['riskLevel','Risk'],['spread','Spread'],['ltv','LTV%']])}
  </>);

  const renderTab1=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CLIMATE RISK RADAR</div>
        <ResponsiveContainer width="100%" height={300}><RadarChart data={radarData}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="axis" tick={{fontSize:11}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:10}}/>
          <Radar name="Portfolio" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/><Tooltip/></RadarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>RISK DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={riskDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label>
          {riskDist.map((e,i)=><Cell key={i} fill={[T.green,T.amber,T.red,'#7c3aed'][i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>TRANSITION vs PHYSICAL RISK BY SECTOR</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={SECTORS.map(s=>{const items=filtered.filter(r=>r.sector===s);if(!items.length)return null;return{name:s.length>12?s.slice(0,12)+'..':s,trans:items.reduce((a,r)=>a+r.transRisk,0)/items.length,phys:items.reduce((a,r)=>a+r.physRisk,0)/items.length};}).filter(Boolean)}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/><Legend/>
          <Bar dataKey="trans" name="Transition" fill={T.red} radius={[2,2,0,0]}/><Bar dataKey="phys" name="Physical" fill={T.amber} radius={[2,2,0,0]}/></BarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CARBON FOOTPRINT CURVE</div>
        <ResponsiveContainer width="100%" height={260}><AreaChart data={[...filtered].sort((a,b)=>a.carbonFp-b.carbonFp).map((r,i)=>({rank:i+1,carbon:r.carbonFp}))}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="rank" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Area type="monotone" dataKey="carbon" stroke={T.red} fill={T.red} fillOpacity={0.15} name="tCO2e"/></AreaChart></ResponsiveContainer></div>
    </div>
    {renderTable([['name','Loan'],['climateScore','Climate'],['transRisk','TransRisk'],['physRisk','PhysRisk'],['carbonFp','Carbon'],['waterStress','Water%'],['stranded','Stranded%'],['riskLevel','Risk']])}
  </>);

  const renderTab2=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>PD vs LGD</div>
        <ResponsiveContainer width="100%" height={280}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="PD%" tick={{fontSize:11}}/><YAxis dataKey="y" name="LGD%" tick={{fontSize:11}}/>
          <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontFamily:T.font,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>PD:{d.x}% LGD:{d.y}%</div></div>}}/>
          <Scatter data={filtered.map(r=>({n:r.name,x:r.pd,y:r.lgd}))} fill={T.navy}/></ScatterChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>LTV DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={['<40%','40-55%','55-65%','65-75%','>75%'].map((l,i)=>{const rng=[[0,40],[40,55],[55,65],[65,75],[75,100]];return{name:l,count:filtered.filter(r=>r.ltv>=rng[i][0]&&r.ltv<rng[i][1]).length};})}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="count" name="Loans" fill={T.navyL} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>COVENANT STATUS BY SECTOR</div>
      <ResponsiveContainer width="100%" height={260}><BarChart data={SECTORS.map(s=>({name:s.length>12?s.slice(0,12)+'..':s,pass:filtered.filter(r=>r.sector===s&&r.covenant==='Pass').length,watch:filtered.filter(r=>r.sector===s&&r.covenant==='Watch').length,breach:filtered.filter(r=>r.sector===s&&r.covenant==='Breach').length})).filter(d=>d.pass+d.watch+d.breach>0)}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/><Legend/>
        <Bar dataKey="pass" name="Pass" stackId="a" fill={T.green}/><Bar dataKey="watch" name="Watch" stackId="a" fill={T.amber}/><Bar dataKey="breach" name="Breach" stackId="a" fill={T.red}/></BarChart></ResponsiveContainer></div>
    {renderTable([['name','Loan'],['rating','Rating'],['pd','PD%'],['lgd','LGD%'],['expectedLoss','EL%'],['ltv','LTV%'],['spread','Spread'],['maturity','Mat'],['covenant','Covenant']])}
  </>);

  const renderTab3=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SCENARIO LOSS COMPARISON</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={scenarioData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="loss" name="Avg Loss%" radius={[4,4,0,0]}>{scenarioData.map((e,i)=><Cell key={i} fill={[T.green,T.amber,T.red][i]}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CLIMATE SCORE TREND</div>
        <ResponsiveContainer width="100%" height={280}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="quarter" tick={{fontSize:12}}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Line type="monotone" dataKey="climate" stroke={T.navy} strokeWidth={2} dot={{r:4}} name="Climate Score"/></LineChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SECTOR SCENARIO LOSSES</div>
      <ResponsiveContainer width="100%" height={280}><BarChart data={SECTORS.map(s=>{const items=filtered.filter(r=>r.sector===s);if(!items.length)return null;return{name:s.length>12?s.slice(0,12)+'..':s,orderly:items.reduce((a,r)=>a+r.scenarioLoss1,0)/items.length,disorderly:items.reduce((a,r)=>a+r.scenarioLoss2,0)/items.length,hothouse:items.reduce((a,r)=>a+r.scenarioLoss3,0)/items.length};}).filter(Boolean)}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/><Legend/>
        <Bar dataKey="orderly" name="1.5C" fill={T.green} radius={[2,2,0,0]}/><Bar dataKey="disorderly" name="2C" fill={T.amber} radius={[2,2,0,0]}/><Bar dataKey="hothouse" name="3C+" fill={T.red} radius={[2,2,0,0]}/></BarChart></ResponsiveContainer></div>
    {renderTable([['name','Loan'],['sector','Sector'],['climateScore','Climate'],['scenarioLoss1','1.5C'],['scenarioLoss2','2C'],['scenarioLoss3','3C+'],['stranded','Stranded%'],['riskLevel','Risk']])}
  </>);

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
    <div style={{maxWidth:1400,margin:'0 auto'}}>
      <div style={{marginBottom:20}}><h1 style={{fontFamily:T.font,fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Private Credit Climate Risk</h1><p style={{fontFamily:T.font,fontSize:13,color:T.textSec,marginTop:2}}>Climate risk analytics across {DATA.length} private credit positions</p></div>
      <div style={{display:'flex',gap:6,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
        {TABS.map((t,i)=><button key={i} style={btnS(tab===i)} onClick={()=>{setTab(i);setPage(0);setExpanded(null);}}>{t}</button>)}</div>
      {tab===0&&renderTab0()}{tab===1&&renderTab1()}{tab===2&&renderTab2()}{tab===3&&renderTab3()}
    </div>
  </div>);
}
