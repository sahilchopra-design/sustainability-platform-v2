import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Legend,Cell,LineChart,Line,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt1=n=>Number(n).toFixed(1);
const fmt0=n=>Number(n).toFixed(0);
const fmtM=n=>n>=1000?`$${(n/1000).toFixed(1)}B`:`$${n}M`;
const riskColor=v=>v==='Low'?T.green:v==='Medium'?T.amber:v==='High'?T.red:'#7c3aed';
const esgColor=v=>v>=75?T.green:v>=55?T.amber:T.red;
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.goldL,T.sageL,T.red,T.amber,T.green,'#7c3aed'];

const SECTORS=['Renewable Energy','Transport','Water & Sanitation','Digital Infrastructure','Social Infrastructure','Utilities','Waste Management','Mixed Use'];
const COUNTRIES=['UK','US','India','Brazil','Germany','Kenya','Morocco','Peru','KSA','Australia','Japan','Canada','France','Nigeria','Chile'];
const STAGES=['Development','Construction','Operating','Brownfield'];
const RISK_LEVELS=['Low','Medium','High','Critical'];
const IFC_CATEGORIES=['A','B','C'];

const genProjects=(count)=>{
  const projects=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*17+3),s2=sr(i*23+7),s3=sr(i*31+11),s4=sr(i*37+13),s5=sr(i*41+17);
    const s6=sr(i*43+19),s7=sr(i*47+23),s8=sr(i*53+29),s9=sr(i*59+31),s10=sr(i*61+37);
    const sector=SECTORS[Math.floor(s1*SECTORS.length)];
    const country=COUNTRIES[Math.floor(s2*COUNTRIES.length)];
    const stage=STAGES[Math.floor(s3*STAGES.length)];
    const inv=Math.floor(100+s4*4900);
    const esgScore=Math.floor(30+s5*65);
    const gresbScore=s6>0.3?Math.floor(40+s7*55):null;
    const ifcPerf=Math.floor(40+s8*55);
    const riskLevel=RISK_LEVELS[Math.floor(s9*RISK_LEVELS.length)];
    const ifcCat=IFC_CATEGORIES[Math.floor(s10*IFC_CATEGORIES.length)];
    const carbonInt=Math.floor(20+sr(i*67+41)*480);
    const waterRisk=Math.floor(10+sr(i*71+43)*85);
    const bioImpact=Math.floor(5+sr(i*73+47)*90);
    const commScore=Math.floor(20+sr(i*79+53)*75);
    const safetyRate=Number((0.5+sr(i*83+59)*4.5).toFixed(2));
    const jobsCreated=Math.floor(50+sr(i*89+61)*4950);
    const compliance=sr(i*97+67)>0.5?'Full':sr(i*101+71)>0.3?'Partial':'Non-compliant';
    const sdgAlign=Math.floor(1+sr(i*103+73)*6);
    const names=['Aurora Renewables','Meridian Solar','CrossRail Plus','Blue River Hydro','Atlas Digital','Pacific Port','Nordic Wind Farm','Sahara Solar Array',
      'Thames Barrier Ext','Amazon Green Corridor','Rhine Valley Wind','Silicon Valley Data','Alpine Tunnel Project','Mumbai Metro Ext','Lagos Water Works',
      'Nairobi Smart Grid','Santiago Light Rail','Dubai Clean Energy','Berlin Hydrogen Hub','Vancouver Sea Wall','Tokyo Bay Bridge','Seoul Smart City',
      'Sydney Harbor Exp','Cairo Waste-to-Energy','Lima Urban Transit','Santiago Solar Farm','Manila Flood Control','Jakarta Smart Grid','Rio Water Treatment',
      'Cape Town Desal','Buenos Aires Metro','Helsinki District Heat','Oslo Carbon Capture','Singapore MRT Ext','Bangkok BTS Phase 3','Melbourne Wind Hub',
      'Zurich Smart Grid','Stockholm Biogas','Copenhagen Cycle Net','Auckland Light Rail','Montreal Green Line','Denver Water Recycle','Portland Clean Bus',
      'Phoenix Solar Hub','Miami Sea Wall','Seattle Green Grid','Chicago Transit Mod','Dallas Wind Corridor','Houston H2 Hub','Detroit EV Infra'];
    projects.push({
      id:i+1,name:names[i%names.length]+(i>=names.length?` ${Math.floor(i/names.length)+1}`:''),
      sector,country,stage,inv,esgScore,gresbScore,ifcPerf,riskLevel,ifcCat,carbonInt,waterRisk,bioImpact,commScore,safetyRate,
      jobsCreated,compliance,sdgAlign,
      envScore:Math.floor(30+sr(i*107+79)*65),socScore:Math.floor(30+sr(i*109+83)*65),govScore:Math.floor(30+sr(i*113+89)*65),
      capex:Math.floor(50+sr(i*127+97)*2950),opex:Math.floor(5+sr(i*131+101)*295),
      irr:Number((4+sr(i*137+103)*14).toFixed(1)),tenor:Math.floor(5+sr(i*139+107)*25),
      q1Score:Math.floor(30+sr(i*149+109)*65),q2Score:Math.floor(30+sr(i*151+113)*65),
      q3Score:Math.floor(32+sr(i*157+127)*63),q4Score:Math.floor(33+sr(i*163+131)*62),
    });
  }
  return projects;
};

const DATA=genProjects(50);

const TABS=['Portfolio Overview','Risk & Compliance','ESG Deep Dive','Trend Analytics'];
const PAGE_SIZE=12;

const cardS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16};
const headerS={fontFamily:T.font,fontSize:22,fontWeight:700,color:T.navy,margin:0};
const subS={fontFamily:T.font,fontSize:13,color:T.textSec,marginTop:2};
const inputS={fontFamily:T.mono,fontSize:13,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,outline:'none',background:T.surface,color:T.text,width:260};
const btnS=(active)=>({fontFamily:T.font,fontSize:13,fontWeight:active?700:500,padding:'8px 18px',border:`1px solid ${active?T.gold:T.border}`,borderRadius:6,background:active?T.gold:T.surface,color:active?'#fff':T.text,cursor:'pointer',transition:'all .2s'});
const thS={fontFamily:T.mono,fontSize:12,fontWeight:600,color:T.textSec,padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'};
const tdS={fontFamily:T.font,fontSize:13,color:T.text,padding:'10px 12px',borderBottom:`1px solid ${T.borderL}`};
const badgeS=(bg,color)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg,border:`1px solid ${bg}33`});
const kpiBoxS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,textAlign:'center',flex:1,minWidth:140};
const kpiVal={fontFamily:T.mono,fontSize:26,fontWeight:700,color:T.navy};
const kpiLab={fontFamily:T.font,fontSize:11,color:T.textMut,marginTop:4,textTransform:'uppercase',letterSpacing:0.5};

const exportCSV=(rows,filename)=>{
  if(!rows.length)return;
  const keys=Object.keys(rows[0]);
  const csv=[keys.join(','),...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
};

const CustomTooltip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'10px 14px',fontFamily:T.font,fontSize:12}}>
    <div style={{fontWeight:700,color:T.navy,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?fmt1(p.value):p.value}</div>)}
  </div>);
};

export default function InfrastructureEsgPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[sortCol,setSortCol]=useState('esgScore');
  const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(0);
  const[expanded,setExpanded]=useState(null);
  const[filterSector,setFilterSector]=useState('All');
  const[filterStage,setFilterStage]=useState('All');
  const[filterRisk,setFilterRisk]=useState('All');

  const filtered=useMemo(()=>{
    let d=[...DATA];
    if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)||r.sector.toLowerCase().includes(s)||r.country.toLowerCase().includes(s));}
    if(filterSector!=='All')d=d.filter(r=>r.sector===filterSector);
    if(filterStage!=='All')d=d.filter(r=>r.stage===filterStage);
    if(filterRisk!=='All')d=d.filter(r=>r.riskLevel===filterRisk);
    d.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];if(av==null)return 1;if(bv==null)return -1;return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});
    return d;
  },[search,sortCol,sortDir,filterSector,filterStage,filterRisk]);

  const paged=useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(0);};
  const sortArrow=(col)=>sortCol===col?(sortDir==='asc'?' ▲':' ▼'):'';

  const kpis=useMemo(()=>{
    const d=filtered;
    if(!d.length)return{count:0,avgEsg:0,totalInv:0,avgIrr:0,avgCarbon:0,highRisk:0};
    return{
      count:d.length,
      avgEsg:d.reduce((a,r)=>a+r.esgScore,0)/d.length,
      totalInv:d.reduce((a,r)=>a+r.inv,0),
      avgIrr:d.reduce((a,r)=>a+r.irr,0)/d.length,
      avgCarbon:d.reduce((a,r)=>a+r.carbonInt,0)/d.length,
      highRisk:d.filter(r=>r.riskLevel==='High'||r.riskLevel==='Critical').length,
    };
  },[filtered]);

  const sectorDist=useMemo(()=>{
    const map={};filtered.forEach(r=>{map[r.sector]=(map[r.sector]||0)+1;});
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[filtered]);

  const stageDist=useMemo(()=>{
    const map={};filtered.forEach(r=>{map[r.stage]=(map[r.stage]||0)+1;});
    return Object.entries(map).map(([name,value])=>({name,value}));
  },[filtered]);

  const riskDist=useMemo(()=>{
    const map={};filtered.forEach(r=>{map[r.riskLevel]=(map[r.riskLevel]||0)+1;});
    return RISK_LEVELS.map(l=>({name:l,value:map[l]||0}));
  },[filtered]);

  const sectorAvgEsg=useMemo(()=>{
    const map={};const cnt={};
    filtered.forEach(r=>{map[r.sector]=(map[r.sector]||0)+r.esgScore;cnt[r.sector]=(cnt[r.sector]||0)+1;});
    return Object.entries(map).map(([name,sum])=>({name:name.length>15?name.slice(0,15)+'..':name,esg:sum/cnt[name],env:filtered.filter(r=>r.sector===name).reduce((a,r)=>a+r.envScore,0)/cnt[name],soc:filtered.filter(r=>r.sector===name).reduce((a,r)=>a+r.socScore,0)/cnt[name],gov:filtered.filter(r=>r.sector===name).reduce((a,r)=>a+r.govScore,0)/cnt[name]}));
  },[filtered]);

  const complianceDist=useMemo(()=>{
    const map={};filtered.forEach(r=>{map[r.compliance]=(map[r.compliance]||0)+1;});
    return['Full','Partial','Non-compliant'].map(c=>({name:c,value:map[c]||0}));
  },[filtered]);

  const scatterData=useMemo(()=>filtered.map(r=>({name:r.name,esg:r.esgScore,irr:r.irr,inv:r.inv,sector:r.sector})),[filtered]);

  const trendData=useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({
    quarter:q,
    avgScore:filtered.reduce((a,r)=>a+[r.q1Score,r.q2Score,r.q3Score,r.q4Score][i],0)/(filtered.length||1),
    avgEnv:filtered.reduce((a,r)=>a+r.envScore*(0.9+i*0.05),0)/(filtered.length||1),
    avgSoc:filtered.reduce((a,r)=>a+r.socScore*(0.92+i*0.04),0)/(filtered.length||1),
    avgGov:filtered.reduce((a,r)=>a+r.govScore*(0.88+i*0.06),0)/(filtered.length||1),
  })),[filtered]);

  const radarData=useMemo(()=>{
    if(!filtered.length)return[];
    const avg=(key)=>filtered.reduce((a,r)=>a+r[key],0)/filtered.length;
    return[{axis:'Environmental',value:avg('envScore')},{axis:'Social',value:avg('socScore')},{axis:'Governance',value:avg('govScore')},{axis:'Carbon Intensity',value:100-avg('carbonInt')/5},{axis:'Water Risk',value:100-avg('waterRisk')},{axis:'Community',value:avg('commScore')}];
  },[filtered]);

  const countryInvData=useMemo(()=>{
    const map={};filtered.forEach(r=>{map[r.country]=(map[r.country]||0)+r.inv;});
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10);
  },[filtered]);

  const renderKPIs=()=>(
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
      <div style={kpiBoxS}><div style={kpiVal}>{kpis.count}</div><div style={kpiLab}>Projects</div></div>
      <div style={kpiBoxS}><div style={{...kpiVal,color:esgColor(kpis.avgEsg)}}>{fmt1(kpis.avgEsg)}</div><div style={kpiLab}>Avg ESG Score</div></div>
      <div style={kpiBoxS}><div style={kpiVal}>{fmtM(kpis.totalInv)}</div><div style={kpiLab}>Total Investment</div></div>
      <div style={kpiBoxS}><div style={kpiVal}>{fmt1(kpis.avgIrr)}%</div><div style={kpiLab}>Avg IRR</div></div>
      <div style={kpiBoxS}><div style={kpiVal}>{fmt0(kpis.avgCarbon)}</div><div style={kpiLab}>Avg Carbon Int</div></div>
      <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{kpis.highRisk}</div><div style={kpiLab}>High/Critical Risk</div></div>
    </div>
  );

  const renderFilters=()=>(
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <input style={inputS} placeholder="Search projects, sector, country..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
      <select style={{...inputS,width:170}} value={filterSector} onChange={e=>{setFilterSector(e.target.value);setPage(0);}}>
        <option value="All">All Sectors</option>{SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <select style={{...inputS,width:140}} value={filterStage} onChange={e=>{setFilterStage(e.target.value);setPage(0);}}>
        <option value="All">All Stages</option>{STAGES.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <select style={{...inputS,width:140}} value={filterRisk} onChange={e=>{setFilterRisk(e.target.value);setPage(0);}}>
        <option value="All">All Risk</option>{RISK_LEVELS.map(r=><option key={r} value={r}>{r}</option>)}
      </select>
      <button style={{...btnS(false),marginLeft:'auto'}} onClick={()=>exportCSV(filtered,'infrastructure_esg.csv')}>Export CSV</button>
    </div>
  );

  const renderPagination=()=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,fontFamily:T.mono,fontSize:12,color:T.textSec}}>
      <span>Showing {page*PAGE_SIZE+1}-{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
      <div style={{display:'flex',gap:4}}>
        <button style={btnS(false)} disabled={page===0} onClick={()=>setPage(p=>p-1)}>Prev</button>
        {Array.from({length:Math.min(totalPages,7)},(_, i)=>{
          let pg=i;if(totalPages>7){if(page<4)pg=i;else if(page>=totalPages-3)pg=totalPages-7+i;else pg=page-3+i;}
          return <button key={pg} style={btnS(pg===page)} onClick={()=>setPage(pg)}>{pg+1}</button>;
        })}
        <button style={btnS(false)} disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </div>
  );

  const renderExpandedRow=(r)=>(
    <tr key={`exp-${r.id}`}><td colSpan={99} style={{background:T.surfaceH,padding:20,borderBottom:`1px solid ${T.border}`}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
        <div>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>PROJECT DETAILS</div>
          <div style={{fontFamily:T.font,fontSize:13,color:T.text,lineHeight:1.8}}>
            <div><strong>Sector:</strong> {r.sector}</div><div><strong>Country:</strong> {r.country}</div><div><strong>Stage:</strong> {r.stage}</div>
            <div><strong>Investment:</strong> {fmtM(r.inv)}</div><div><strong>IRR:</strong> {r.irr}%</div><div><strong>Tenor:</strong> {r.tenor} yrs</div>
            <div><strong>CAPEX:</strong> {fmtM(r.capex)}</div><div><strong>OPEX:</strong> {fmtM(r.opex)}</div>
          </div>
        </div>
        <div>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>ESG SCORES</div>
          <div style={{fontFamily:T.font,fontSize:13,color:T.text,lineHeight:1.8}}>
            <div><strong>ESG Composite:</strong> <span style={{color:esgColor(r.esgScore),fontWeight:700}}>{r.esgScore}</span></div>
            <div><strong>Environmental:</strong> {r.envScore}</div><div><strong>Social:</strong> {r.socScore}</div><div><strong>Governance:</strong> {r.govScore}</div>
            <div><strong>GRESB:</strong> {r.gresbScore??'N/A'}</div><div><strong>IFC Performance:</strong> {r.ifcPerf}</div>
            <div><strong>IFC Category:</strong> {r.ifcCat}</div><div><strong>SDG Alignment:</strong> {r.sdgAlign} goals</div>
          </div>
        </div>
        <div>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>RISK & IMPACT</div>
          <div style={{fontFamily:T.font,fontSize:13,color:T.text,lineHeight:1.8}}>
            <div><strong>Risk Level:</strong> <span style={{color:riskColor(r.riskLevel),fontWeight:700}}>{r.riskLevel}</span></div>
            <div><strong>Carbon Intensity:</strong> {r.carbonInt} tCO2e/M</div><div><strong>Water Risk:</strong> {r.waterRisk}%</div>
            <div><strong>Biodiversity Impact:</strong> {r.bioImpact}%</div><div><strong>Community Score:</strong> {r.commScore}</div>
            <div><strong>Safety Rate:</strong> {r.safetyRate}</div><div><strong>Jobs Created:</strong> {r.jobsCreated.toLocaleString()}</div>
            <div><strong>Compliance:</strong> <span style={{color:r.compliance==='Full'?T.green:r.compliance==='Partial'?T.amber:T.red}}>{r.compliance}</span></div>
          </div>
        </div>
      </div>
      <div style={{marginTop:16}}>
        <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>QUARTERLY ESG TREND</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={[{q:'Q1',s:r.q1Score},{q:'Q2',s:r.q2Score},{q:'Q3',s:r.q3Score},{q:'Q4',s:r.q4Score}]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="q" tick={{fontSize:11,fontFamily:T.mono}}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip content={<CustomTooltip/>}/>
            <Line type="monotone" dataKey="s" stroke={T.navy} strokeWidth={2} dot={{r:4,fill:T.navy}} name="ESG Score"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </td></tr>
  );

  const renderTab0=()=>(
    <>
      {renderKPIs()}
      {renderFilters()}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>INVESTMENT BY SECTOR ($M)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorDist.map(s=>({...s,inv:filtered.filter(r=>r.sector===s.name).reduce((a,r)=>a+r.inv,0)}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10,fontFamily:T.mono}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="inv" name="Investment" radius={[4,4,0,0]}>{sectorDist.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>STAGE DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={stageDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
              {stageDist.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardS}>
        <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>ESG SCORE vs IRR (bubble = investment size)</div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="esg" name="ESG Score" tick={{fontSize:11}}/><YAxis dataKey="irr" name="IRR %" tick={{fontSize:11}}/><ZAxis dataKey="inv" range={[30,300]} name="Investment"/>
            <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontFamily:T.font,fontSize:12}}><div style={{fontWeight:700}}>{d.name}</div><div>ESG: {d.esg} | IRR: {d.irr}% | Inv: {fmtM(d.inv)}</div></div>}}/>
            <Scatter data={scatterData} fill={T.navy}>{scatterData.map((e,i)=><Cell key={i} fill={COLORS[SECTORS.indexOf(e.sector)%COLORS.length]}/>)}</Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div style={{...cardS,overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {[['name','Project'],['sector','Sector'],['country','Country'],['stage','Stage'],['inv','Inv ($M)'],['esgScore','ESG'],['riskLevel','Risk'],['irr','IRR %'],['compliance','Compliance']].map(([k,l])=>
              <th key={k} style={thS} onClick={()=>toggleSort(k)}>{l}{sortArrow(k)}</th>)}
          </tr></thead>
          <tbody>{paged.map(r=>(
            <React.Fragment key={r.id}>
              <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent',transition:'background .15s'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                <td style={{...tdS,fontWeight:600,color:T.navy,maxWidth:200}}>{r.name}</td>
                <td style={tdS}>{r.sector}</td><td style={tdS}>{r.country}</td><td style={tdS}>{r.stage}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{fmtM(r.inv)}</td>
                <td style={{...tdS,fontWeight:700,color:esgColor(r.esgScore)}}>{r.esgScore}</td>
                <td style={tdS}><span style={badgeS(riskColor(r.riskLevel),riskColor(r.riskLevel))}>{r.riskLevel}</span></td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.irr}%</td>
                <td style={{...tdS,color:r.compliance==='Full'?T.green:r.compliance==='Partial'?T.amber:T.red,fontWeight:600}}>{r.compliance}</td>
              </tr>
              {expanded===r.id&&renderExpandedRow(r)}
            </React.Fragment>
          ))}</tbody>
        </table>
        {renderPagination()}
      </div>
    </>
  );

  const renderTab1=()=>(
    <>
      {renderFilters()}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>RISK DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={riskDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
              {riskDist.map((e,i)=><Cell key={i} fill={[T.green,T.amber,T.red,'#7c3aed'][i]}/>)}</Pie><Tooltip/><Legend/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>COMPLIANCE STATUS</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={complianceDist}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>{complianceDist.map((e,i)=><Cell key={i} fill={[T.green,T.amber,T.red][i]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>CARBON INTENSITY BY SECTOR</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SECTORS.map(s=>{const items=filtered.filter(r=>r.sector===s);return{name:s.length>12?s.slice(0,12)+'..':s,carbon:items.length?items.reduce((a,r)=>a+r.carbonInt,0)/items.length:0};}).filter(d=>d.carbon>0)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" width={100} tick={{fontSize:10}}/><Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="carbon" name="Avg Carbon Int" fill={T.red} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>IFC CATEGORY BREAKDOWN</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={IFC_CATEGORIES.map(c=>({name:`Cat ${c}`,value:filtered.filter(r=>r.ifcCat===c).length}))} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label>
              {IFC_CATEGORIES.map((c,i)=><Cell key={i} fill={[T.red,T.amber,T.green][i]}/>)}</Pie><Tooltip/><Legend/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{...cardS,overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {[['name','Project'],['riskLevel','Risk'],['carbonInt','Carbon Int'],['waterRisk','Water Risk'],['bioImpact','Bio Impact'],['safetyRate','Safety'],['compliance','Compliance'],['ifcCat','IFC Cat']].map(([k,l])=>
              <th key={k} style={thS} onClick={()=>toggleSort(k)}>{l}{sortArrow(k)}</th>)}
          </tr></thead>
          <tbody>{paged.map(r=>(
            <React.Fragment key={r.id}>
              <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                <td style={{...tdS,fontWeight:600,color:T.navy}}>{r.name}</td>
                <td style={tdS}><span style={badgeS(riskColor(r.riskLevel))}>{r.riskLevel}</span></td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.carbonInt}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.waterRisk}%</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.bioImpact}%</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.safetyRate}</td>
                <td style={{...tdS,color:r.compliance==='Full'?T.green:r.compliance==='Partial'?T.amber:T.red,fontWeight:600}}>{r.compliance}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.ifcCat}</td>
              </tr>
              {expanded===r.id&&renderExpandedRow(r)}
            </React.Fragment>
          ))}</tbody>
        </table>
        {renderPagination()}
      </div>
    </>
  );

  const renderTab2=()=>(
    <>
      {renderFilters()}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>ESG RADAR (PORTFOLIO AVERAGE)</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="axis" tick={{fontSize:11,fontFamily:T.font}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:10}}/>
              <Radar name="Score" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/><Tooltip/></RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>E / S / G BY SECTOR</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorAvgEsg}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10,fontFamily:T.mono}} angle={-20} textAnchor="end" height={55}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip content={<CustomTooltip/>}/><Legend/>
              <Bar dataKey="env" name="Env" fill={T.sage} radius={[2,2,0,0]}/><Bar dataKey="soc" name="Soc" fill={T.gold} radius={[2,2,0,0]}/><Bar dataKey="gov" name="Gov" fill={T.navy} radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardS}>
        <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>INVESTMENT BY COUNTRY (Top 10)</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={countryInvData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" width={80} tick={{fontSize:11}}/><Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="value" name="Investment ($M)" fill={T.navyL} radius={[0,4,4,0]}>{countryInvData.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{...cardS,overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {[['name','Project'],['esgScore','ESG'],['envScore','Env'],['socScore','Soc'],['govScore','Gov'],['gresbScore','GRESB'],['ifcPerf','IFC Perf'],['sdgAlign','SDG Goals'],['commScore','Community']].map(([k,l])=>
              <th key={k} style={thS} onClick={()=>toggleSort(k)}>{l}{sortArrow(k)}</th>)}
          </tr></thead>
          <tbody>{paged.map(r=>(
            <React.Fragment key={r.id}>
              <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                <td style={{...tdS,fontWeight:600,color:T.navy}}>{r.name}</td>
                <td style={{...tdS,fontWeight:700,color:esgColor(r.esgScore)}}>{r.esgScore}</td>
                <td style={{...tdS,color:esgColor(r.envScore)}}>{r.envScore}</td>
                <td style={{...tdS,color:esgColor(r.socScore)}}>{r.socScore}</td>
                <td style={{...tdS,color:esgColor(r.govScore)}}>{r.govScore}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.gresbScore??'N/A'}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.ifcPerf}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.sdgAlign}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.commScore}</td>
              </tr>
              {expanded===r.id&&renderExpandedRow(r)}
            </React.Fragment>
          ))}</tbody>
        </table>
        {renderPagination()}
      </div>
    </>
  );

  const renderTab3=()=>(
    <>
      {renderFilters()}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>ESG SCORE TREND (QUARTERLY)</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="quarter" tick={{fontSize:12}}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip content={<CustomTooltip/>}/><Legend/>
              <Line type="monotone" dataKey="avgScore" stroke={T.navy} strokeWidth={2} name="Overall" dot={{r:4}}/><Line type="monotone" dataKey="avgEnv" stroke={T.sage} strokeWidth={2} name="Env"/>
              <Line type="monotone" dataKey="avgSoc" stroke={T.gold} strokeWidth={2} name="Soc"/><Line type="monotone" dataKey="avgGov" stroke={T.navyL} strokeWidth={2} name="Gov"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>SECTOR ESG PERFORMANCE</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sectorAvgEsg}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:9}} angle={-20} textAnchor="end" height={50}/><YAxis domain={[0,100]} tick={{fontSize:11}}/><Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="esg" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Avg ESG"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>JOBS CREATED BY SECTOR</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SECTORS.map(s=>({name:s.length>12?s.slice(0,12)+'..':s,jobs:filtered.filter(r=>r.sector===s).reduce((a,r)=>a+r.jobsCreated,0)}))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" width={100} tick={{fontSize:10}}/><Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="jobs" name="Jobs Created" fill={T.sage} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:8}}>INVESTMENT vs ESG QUARTILE</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={['Q1 (Top)','Q2','Q3','Q4 (Bottom)'].map((label,qi)=>{
              const sorted=[...filtered].sort((a,b)=>b.esgScore-a.esgScore);
              const qSize=Math.ceil(sorted.length/4);
              const qItems=sorted.slice(qi*qSize,(qi+1)*qSize);
              return{name:label,inv:qItems.reduce((a,r)=>a+r.inv,0),count:qItems.length};
            })}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="inv" name="Total Inv ($M)" fill={T.gold} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{...cardS,overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {[['name','Project'],['esgScore','ESG'],['q1Score','Q1'],['q2Score','Q2'],['q3Score','Q3'],['q4Score','Q4'],['inv','Inv ($M)'],['jobsCreated','Jobs'],['sector','Sector']].map(([k,l])=>
              <th key={k} style={thS} onClick={()=>toggleSort(k)}>{l}{sortArrow(k)}</th>)}
          </tr></thead>
          <tbody>{paged.map(r=>(
            <React.Fragment key={r.id}>
              <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                <td style={{...tdS,fontWeight:600,color:T.navy}}>{r.name}</td>
                <td style={{...tdS,fontWeight:700,color:esgColor(r.esgScore)}}>{r.esgScore}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.q1Score}</td><td style={{...tdS,fontFamily:T.mono}}>{r.q2Score}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.q3Score}</td><td style={{...tdS,fontFamily:T.mono}}>{r.q4Score}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{fmtM(r.inv)}</td>
                <td style={{...tdS,fontFamily:T.mono}}>{r.jobsCreated.toLocaleString()}</td>
                <td style={tdS}>{r.sector}</td>
              </tr>
              {expanded===r.id&&renderExpandedRow(r)}
            </React.Fragment>
          ))}</tbody>
        </table>
        {renderPagination()}
      </div>
    </>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{marginBottom:20}}>
          <h1 style={headerS}>Infrastructure ESG Assessment</h1>
          <p style={subS}>Comprehensive ESG analysis across {DATA.length} infrastructure projects — risk, compliance, performance</p>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
          {TABS.map((t,i)=><button key={i} style={btnS(tab===i)} onClick={()=>{setTab(i);setPage(0);setExpanded(null);}}>{t}</button>)}
        </div>
        {tab===0&&renderTab0()}{tab===1&&renderTab1()}{tab===2&&renderTab2()}{tab===3&&renderTab3()}
      </div>
    </div>
  );
}
