import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Legend,Cell,LineChart,Line,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt1=n=>Number(n).toFixed(1);const fmt0=n=>Number(n).toFixed(0);
const riskColor=v=>v==='Low'?T.green:v==='Medium'?T.amber:v==='High'?T.red:'#7c3aed';
const scoreColor=v=>v>=70?T.green:v>=45?T.amber:T.red;
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.goldL,T.sageL,T.red,T.amber,T.green,'#7c3aed'];

const TIERS=['Tier 1','Tier 2','Tier 3','Tier 4'];
const CATEGORIES=['Raw Materials','Components','Manufacturing','Logistics','Distribution','End-of-Life'];
const REGIONS=['North America','Europe','Asia Pacific','LATAM','Middle East','Africa'];
const RISK_LEVELS=['Low','Medium','High','Critical'];
const INDUSTRIES=['Automotive','Electronics','Textile','Food & Bev','Pharma','Energy','Mining','Construction'];

const genSuppliers=(count)=>{
  const suppliers=[];
  const names=['GlobalTech Components','Pacific Raw Materials','EuroSteel Corp','Atlas Logistics','Meridian Manufacturing','Nordic Timber Supply',
    'Shanghai Electronics','Rhine Chemical AG','Mumbai Textiles Ltd','Lagos Mining Corp','Santiago Agri Co','Dubai Port Services',
    'Sydney Transport Hub','Tokyo Precision Parts','Berlin Green Energy','Paris Fashion Supply','Milan Leather Works','Seoul Semiconductor',
    'Bangkok Rubber Co','Lima Copper Mining','Cairo Cotton Mills','Nairobi Coffee Coop','Cape Town Packaging','Buenos Aires Grain',
    'Helsinki Biotech','Oslo Marine Supply','Lisbon Cork Products','Warsaw Steel Works','Prague Glass Works','Vienna Pharma AG',
    'Zurich Precision','Amsterdam Logistics','Copenhagen Wind Parts','Stockholm Paper Mill','Brussels Chemical','Dublin Tech Parts',
    'Edinburgh Textiles','Manchester Polymers','Birmingham Metal Co','Leeds Electronics','Glasgow Marine Parts','Cardiff Recycling',
    'Bristol Aerospace','Exeter Ceramics','Plymouth Composites','Oxford Biotech','Cambridge Sensors','Derby Motors','Nottingham Fabrics','Leicester Plastics'];
  for(let i=0;i<count;i++){
    const s=idx=>sr(i*idx+idx);
    const tier=TIERS[Math.floor(s(17)*TIERS.length)];
    const category=CATEGORIES[Math.floor(s(23)*CATEGORIES.length)];
    const region=REGIONS[Math.floor(s(29)*REGIONS.length)];
    const risk=RISK_LEVELS[Math.floor(s(31)*RISK_LEVELS.length)];
    const industry=INDUSTRIES[Math.floor(s(37)*INDUSTRIES.length)];
    suppliers.push({
      id:i+1,name:names[i%names.length]+(i>=names.length?` ${Math.floor(i/names.length)+1}`:''),
      tier,category,region,risk,industry,
      esgScore:Math.floor(20+s(41)*75),envScore:Math.floor(15+s(43)*80),socScore:Math.floor(15+s(47)*80),govScore:Math.floor(20+s(53)*75),
      carbonEmissions:Math.floor(100+s(59)*4900),waterUsage:Math.floor(50+s(61)*950),wasteGen:Math.floor(10+s(67)*490),
      laborScore:Math.floor(20+s(71)*75),safetyScore:Math.floor(25+s(73)*70),humanRightsRisk:Math.floor(5+s(79)*90),
      complianceRate:Math.floor(50+s(83)*48),auditScore:Math.floor(30+s(89)*65),certifications:Math.floor(s(97)*8),
      leadTime:Math.floor(3+s(101)*57),reliability:Math.floor(50+s(103)*48),costIndex:Math.floor(60+s(107)*140),
      disruptions:Math.floor(s(109)*12),alternativeSuppliers:Math.floor(s(113)*6),
      q1:Math.floor(25+s(127)*70),q2:Math.floor(27+s(131)*68),q3:Math.floor(29+s(137)*66),q4:Math.floor(28+s(139)*67),
      scope3Contrib:Number((s(149)*15).toFixed(1)),deforestationRisk:Math.floor(s(151)*85),
    });
  }
  return suppliers;
};

const DATA=genSuppliers(50);
const TABS=['Supply Chain Overview','ESG Performance','Risk Assessment','Operational Metrics'];
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

export default function ValueChainDashboardPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sortCol,setSortCol]=useState('esgScore');const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(0);const[expanded,setExpanded]=useState(null);const[fTier,setFTier]=useState('All');const[fCat,setFCat]=useState('All');const[fRisk,setFRisk]=useState('All');

  const filtered=useMemo(()=>{
    let d=[...DATA];if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)||r.region.toLowerCase().includes(s)||r.industry.toLowerCase().includes(s));}
    if(fTier!=='All')d=d.filter(r=>r.tier===fTier);if(fCat!=='All')d=d.filter(r=>r.category===fCat);if(fRisk!=='All')d=d.filter(r=>r.risk===fRisk);
    d.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];if(av==null)return 1;if(bv==null)return -1;return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});return d;
  },[search,sortCol,sortDir,fTier,fCat,fRisk]);

  const paged=useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const toggleSort=(c)=>{if(sortCol===c)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(c);setSortDir('desc');}setPage(0);};
  const sortArrow=(c)=>sortCol===c?(sortDir==='asc'?' ▲':' ▼'):'';

  const kpis=useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgEsg:0,avgCarbon:0,avgCompliance:0,highRisk:0,avgReliability:0};
    return{count:d.length,avgEsg:d.reduce((a,r)=>a+r.esgScore,0)/d.length,avgCarbon:d.reduce((a,r)=>a+r.carbonEmissions,0)/d.length,avgCompliance:d.reduce((a,r)=>a+r.complianceRate,0)/d.length,highRisk:d.filter(r=>r.risk==='High'||r.risk==='Critical').length,avgReliability:d.reduce((a,r)=>a+r.reliability,0)/d.length};},[filtered]);

  const tierDist=useMemo(()=>TIERS.map(t=>({name:t,value:filtered.filter(r=>r.tier===t).length})),[filtered]);
  const catDist=useMemo(()=>CATEGORIES.map(c=>({name:c.length>12?c.slice(0,12)+'..':c,value:filtered.filter(r=>r.category===c).length})),[filtered]);
  const regionDist=useMemo(()=>REGIONS.map(r=>({name:r.length>12?r.slice(0,12)+'..':r,value:filtered.filter(d=>d.region===r).length})),[filtered]);
  const riskDist=useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.risk===l).length})),[filtered]);
  const radarData=useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;
    return[{axis:'Env',value:avg('envScore')},{axis:'Social',value:avg('socScore')},{axis:'Gov',value:avg('govScore')},{axis:'Labor',value:avg('laborScore')},{axis:'Safety',value:avg('safetyScore')},{axis:'Compliance',value:avg('complianceRate')}];},[filtered]);
  const trendData=useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,esg:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length||1)})),[filtered]);

  const renderKPIs=()=>(<div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
    <div style={kpiBoxS}><div style={kpiVal}>{kpis.count}</div><div style={kpiLab}>Suppliers</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:scoreColor(kpis.avgEsg)}}>{fmt1(kpis.avgEsg)}</div><div style={kpiLab}>Avg ESG</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt0(kpis.avgCarbon)}</div><div style={kpiLab}>Avg Carbon (tCO2e)</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt1(kpis.avgCompliance)}%</div><div style={kpiLab}>Avg Compliance</div></div>
    <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{kpis.highRisk}</div><div style={kpiLab}>High/Crit Risk</div></div>
    <div style={kpiBoxS}><div style={kpiVal}>{fmt1(kpis.avgReliability)}%</div><div style={kpiLab}>Avg Reliability</div></div>
  </div>);

  const renderFilters=()=>(<div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
    <input style={inputS} placeholder="Search suppliers, regions..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
    <select style={{...inputS,width:130}} value={fTier} onChange={e=>{setFTier(e.target.value);setPage(0);}}><option value="All">All Tiers</option>{TIERS.map(t=><option key={t}>{t}</option>)}</select>
    <select style={{...inputS,width:160}} value={fCat} onChange={e=>{setFCat(e.target.value);setPage(0);}}><option value="All">All Categories</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
    <select style={{...inputS,width:130}} value={fRisk} onChange={e=>{setFRisk(e.target.value);setPage(0);}}><option value="All">All Risk</option>{RISK_LEVELS.map(r=><option key={r}>{r}</option>)}</select>
    <button style={{...btnS(false),marginLeft:'auto'}} onClick={()=>exportCSV(filtered,'value_chain.csv')}>Export CSV</button>
  </div>);

  const renderPagination=()=>(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,fontFamily:T.mono,fontSize:12,color:T.textSec}}>
    <span>{page*PAGE_SIZE+1}-{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
    <div style={{display:'flex',gap:4}}><button style={btnS(false)} disabled={page===0} onClick={()=>setPage(p=>p-1)}>Prev</button>
      {Array.from({length:Math.min(totalPages,7)},(_,i)=>{let pg=i;if(totalPages>7){if(page<4)pg=i;else if(page>=totalPages-3)pg=totalPages-7+i;else pg=page-3+i;}return <button key={pg} style={btnS(pg===page)} onClick={()=>setPage(pg)}>{pg+1}</button>;})}
      <button style={btnS(false)} disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </div>);

  const renderExpanded=(r)=>(<tr key={`exp-${r.id}`}><td colSpan={99} style={{background:T.surfaceH,padding:20,borderBottom:`1px solid ${T.border}`}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>SUPPLIER DETAILS</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Tier:</strong> {r.tier}</div><div><strong>Category:</strong> {r.category}</div><div><strong>Region:</strong> {r.region}</div>
          <div><strong>Industry:</strong> {r.industry}</div><div><strong>Certifications:</strong> {r.certifications}</div><div><strong>Alt Suppliers:</strong> {r.alternativeSuppliers}</div></div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>ESG & ENVIRONMENT</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>ESG Score:</strong> <span style={{color:scoreColor(r.esgScore),fontWeight:700}}>{r.esgScore}</span></div>
          <div><strong>Env:</strong> {r.envScore}</div><div><strong>Social:</strong> {r.socScore}</div><div><strong>Gov:</strong> {r.govScore}</div>
          <div><strong>Carbon:</strong> {r.carbonEmissions} tCO2e</div><div><strong>Water:</strong> {r.waterUsage}m3</div><div><strong>Waste:</strong> {r.wasteGen}t</div>
          <div><strong>Scope 3 Contrib:</strong> {r.scope3Contrib}%</div><div><strong>Deforestation Risk:</strong> {r.deforestationRisk}%</div></div></div>
      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>OPERATIONS</div>
        <div style={{fontSize:13,lineHeight:1.8}}><div><strong>Risk:</strong> <span style={{color:riskColor(r.risk)}}>{r.risk}</span></div>
          <div><strong>Compliance:</strong> {r.complianceRate}%</div><div><strong>Audit Score:</strong> {r.auditScore}</div><div><strong>Labor Score:</strong> {r.laborScore}</div>
          <div><strong>Safety:</strong> {r.safetyScore}</div><div><strong>Lead Time:</strong> {r.leadTime}d</div><div><strong>Reliability:</strong> {r.reliability}%</div>
          <div><strong>Disruptions:</strong> {r.disruptions}</div></div></div>
    </div>
  </td></tr>);

  const renderTable=(cols)=>(<div style={{...cardS,overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{cols.map(([k,l])=><th key={k} style={thS} onClick={()=>toggleSort(k)}>{l}{sortArrow(k)}</th>)}</tr></thead>
    <tbody>{paged.map(r=>(<React.Fragment key={r.id}>
      <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
        {cols.map(([k])=>{const v=r[k];if(k==='name')return <td key={k} style={{...tdS,fontWeight:600,color:T.navy}}>{v}</td>;if(k==='risk')return <td key={k} style={tdS}><span style={badgeS(riskColor(v))}>{v}</span></td>;if(k==='esgScore')return <td key={k} style={{...tdS,fontWeight:700,color:scoreColor(v)}}>{v}</td>;if(typeof v==='number')return <td key={k} style={{...tdS,fontFamily:T.mono}}>{v<20?fmt1(v):fmt0(v)}</td>;return <td key={k} style={tdS}>{v}</td>;})}
      </tr>{expanded===r.id&&renderExpanded(r)}
    </React.Fragment>))}</tbody></table>{renderPagination()}
  </div>);

  const renderTab0=()=>(<>{renderKPIs()}{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>TIER DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={tierDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label>
          {tierDist.map((e,i)=><Cell key={i} fill={COLORS[i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CATEGORY BREAKDOWN</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={catDist}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>{catDist.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>ESG SCORE vs RELIABILITY</div>
      <ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="x" name="ESG" tick={{fontSize:11}}/><YAxis dataKey="y" name="Reliability%" tick={{fontSize:11}}/>
        <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.n}</div><div>ESG:{d.x} Rel:{d.y}%</div></div>}}/>
        <Scatter data={filtered.map(r=>({n:r.name,x:r.esgScore,y:r.reliability}))} fill={T.navy}/></ScatterChart></ResponsiveContainer></div>
    {renderTable([['name','Supplier'],['tier','Tier'],['category','Category'],['region','Region'],['esgScore','ESG'],['risk','Risk'],['reliability','Rel%'],['complianceRate','Compl%']])}
  </>);

  const renderTab1=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>ESG RADAR</div>
        <ResponsiveContainer width="100%" height={300}><RadarChart data={radarData}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="axis" tick={{fontSize:11}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:10}}/>
          <Radar name="Avg" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/><Tooltip/></RadarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>ESG TREND</div>
        <ResponsiveContainer width="100%" height={300}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="quarter" tick={{fontSize:12}}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Line type="monotone" dataKey="esg" stroke={T.navy} strokeWidth={2} dot={{r:4}} name="Avg ESG"/></LineChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CARBON EMISSIONS BY TIER</div>
      <ResponsiveContainer width="100%" height={260}><BarChart data={TIERS.map(t=>{const items=filtered.filter(r=>r.tier===t);return{name:t,carbon:items.length?items.reduce((a,r)=>a+r.carbonEmissions,0)/items.length:0};})}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
        <Bar dataKey="carbon" name="Avg Carbon tCO2e" fill={T.red} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
    {renderTable([['name','Supplier'],['esgScore','ESG'],['envScore','Env'],['socScore','Soc'],['govScore','Gov'],['carbonEmissions','Carbon'],['waterUsage','Water'],['scope3Contrib','Scope3%']])}
  </>);

  const renderTab2=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>RISK DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={riskDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label>
          {riskDist.map((e,i)=><Cell key={i} fill={[T.green,T.amber,T.red,'#7c3aed'][i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>HUMAN RIGHTS RISK BY REGION</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={REGIONS.map(reg=>{const items=filtered.filter(r=>r.region===reg);return{name:reg.length>12?reg.slice(0,12)+'..':reg,hr:items.length?items.reduce((a,r)=>a+r.humanRightsRisk,0)/items.length:0};}).filter(d=>d.hr>0)}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="hr" name="Avg HR Risk" fill={T.red} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>DISRUPTIONS BY CATEGORY</div>
      <ResponsiveContainer width="100%" height={260}><BarChart data={CATEGORIES.map(c=>({name:c.length>12?c.slice(0,12)+'..':c,disruptions:filtered.filter(r=>r.category===c).reduce((a,r)=>a+r.disruptions,0)}))}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10}} angle={-15} textAnchor="end" height={45}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
        <Bar dataKey="disruptions" name="Total Disruptions" fill={T.amber} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
    {renderTable([['name','Supplier'],['risk','Risk'],['humanRightsRisk','HR Risk'],['laborScore','Labor'],['safetyScore','Safety'],['disruptions','Disruptions'],['complianceRate','Compl%'],['auditScore','Audit']])}
  </>);

  const renderTab3=()=>(<>{renderFilters()}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>LEAD TIME BY TIER</div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={TIERS.map(t=>{const items=filtered.filter(r=>r.tier===t);return{name:t,lt:items.length?items.reduce((a,r)=>a+r.leadTime,0)/items.length:0};})}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Bar dataKey="lt" name="Avg Lead Time (days)" fill={T.navyL} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
      <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>COST INDEX DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={260}><AreaChart data={[...filtered].sort((a,b)=>a.costIndex-b.costIndex).map((r,i)=>({rank:i+1,cost:r.costIndex}))}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="rank" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CT/>}/>
          <Area type="monotone" dataKey="cost" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Cost Index"/></AreaChart></ResponsiveContainer></div>
    </div>
    <div style={cardS}><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>RELIABILITY BY REGION</div>
      <ResponsiveContainer width="100%" height={260}><BarChart data={REGIONS.map(reg=>{const items=filtered.filter(r=>r.region===reg);return{name:reg.length>12?reg.slice(0,12)+'..':reg,rel:items.length?items.reduce((a,r)=>a+r.reliability,0)/items.length:0};}).filter(d=>d.rel>0)} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" width={100} tick={{fontSize:10}}/><Tooltip content={<CT/>}/>
        <Bar dataKey="rel" name="Avg Reliability%" fill={T.sage} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
    {renderTable([['name','Supplier'],['leadTime','Lead(d)'],['reliability','Rel%'],['costIndex','Cost Idx'],['disruptions','Disruptions'],['alternativeSuppliers','Alt Sup'],['tier','Tier'],['category','Category']])}
  </>);

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}><div style={{maxWidth:1400,margin:'0 auto'}}>
    <div style={{marginBottom:20}}><h1 style={{fontFamily:T.font,fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Value Chain ESG Dashboard</h1><p style={{fontFamily:T.font,fontSize:13,color:T.textSec,marginTop:2}}>Supply chain ESG analytics across {DATA.length} suppliers</p></div>
    <div style={{display:'flex',gap:6,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
      {TABS.map((t,i)=><button key={i} style={btnS(tab===i)} onClick={()=>{setTab(i);setPage(0);setExpanded(null);}}>{t}</button>)}</div>
    {tab===0&&renderTab0()}{tab===1&&renderTab1()}{tab===2&&renderTab2()}{tab===3&&renderTab3()}
  </div></div>);
}
