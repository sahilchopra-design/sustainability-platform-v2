import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899','#06b6d4'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:12},labelStyle:{color:T.navy,fontWeight:600}};
const TABS=['Risk Dashboard','Company Assessment','Basin Analytics','Mitigation Tracker'];
const PAGE=12;

const SECTORS=['Utilities','Agriculture','Mining','Food & Bev','Chemicals','Pharmaceuticals','Semiconductors','Textiles','Oil & Gas','Paper & Pulp','Steel','Power Generation'];
const BASINS=['Ganges','Yangtze','Nile','Amazon','Colorado','Murray-Darling','Rhine','Danube','Mekong','Indus','Yellow River','Tigris-Euphrates','Niger','Zambezi','Orange'];
const RISK_LEVELS=['Extremely High','High','Medium-High','Medium','Low-Medium','Low'];

const COMPANIES=Array.from({length:60},(_,i)=>{
  const names=['Nestle','Coca-Cola','PepsiCo','AB InBev','Danone','Unilever','P&G','BHP','Rio Tinto','Glencore','BASF','Dow','DuPont','Intel','TSMC','Samsung','Bayer','Syngenta','Cargill','ADM','Deere','Monsanto','Shell','TotalEnergies','BP','Exxon','Chevron','Vale','Anglo American','Freeport','Newmont','Barrick','Veolia','Suez','Xylem','Pentair','Evoqua','Mueller Water','Watts Water','American Water','Thames Water','Severn Trent','United Utilities','Sabesp','Manila Water','Beijing Enterprises','Guangdong Investment','China Water Affairs','SIIC Environment','Ranhill Utilities','Hyflux','Tata Power','Adani Green','JSW Energy','NTPC','CLP Holdings','AES Corp','Duke Energy','Southern Company','Enel'];
  const sect=SECTORS[Math.floor(sr(i*3)*SECTORS.length)];
  const basin=BASINS[Math.floor(sr(i*7)*BASINS.length)];
  return{id:i+1,name:names[i%names.length],sector:sect,primaryBasin:basin,
    waterWithdrawal:+(sr(i*11)*500+10).toFixed(1),waterConsumption:+(sr(i*13)*200+5).toFixed(1),
    waterDischarge:+(sr(i*17)*300+5).toFixed(1),waterIntensity:+(sr(i*19)*50+2).toFixed(1),
    waterStressScore:+(sr(i*23)*100).toFixed(1),physicalRisk:RISK_LEVELS[Math.floor(sr(i*29)*6)],
    regulatoryRisk:RISK_LEVELS[Math.floor(sr(i*31)*6)],reputationalRisk:RISK_LEVELS[Math.floor(sr(i*37)*6)],
    recyclingRate:+(sr(i*41)*80+5).toFixed(1),targetReduction:+(sr(i*43)*40+5).toFixed(1),
    actualReduction:+(sr(i*47)*35).toFixed(1),revenue:+(sr(i*53)*50000+500).toFixed(0),
    waterRevRisk:+(sr(i*59)*30+2).toFixed(1),cdpScore:['A','A-','B','B-','C','C-','D','D-'][Math.floor(sr(i*61)*8)],
    sbtnStatus:['Committed','Target Set','Validated','Not Committed'][Math.floor(sr(i*67)*4)],
    waterPolicy:sr(i*71)>0.3,disclosure:sr(i*73)>0.25,
    pollutionIndex:+(sr(i*79)*60+10).toFixed(1),biodiversityImpact:+(sr(i*83)*50+10).toFixed(1),
  };
});

const BASIN_DATA=BASINS.map((b,i)=>({
  name:b,stressLevel:+(sr(i*89)*100).toFixed(1),population:Math.floor(sr(i*97)*500+50),
  irrigatedArea:+(sr(i*101)*200+20).toFixed(0),annualFlow:+(sr(i*103)*1000+50).toFixed(0),
  groundwaterDepletion:+(sr(i*107)*5+0.1).toFixed(1),floodRisk:+(sr(i*109)*80+10).toFixed(1),
  droughtRisk:+(sr(i*113)*70+15).toFixed(1),qualityIndex:+(sr(i*117)*60+30).toFixed(1),
  companiesExposed:Math.floor(sr(i*121)*20+3),regulatoryStrength:['Strong','Moderate','Weak'][Math.floor(sr(i*127)*3)],
}));

const ANNUAL=Array.from({length:10},(_,i)=>({
  year:2016+i,globalStress:+(sr(i*131)*10+35).toFixed(1),withdrawal:+(sr(i*137)*500+3500).toFixed(0),
  recycled:+(sr(i*139)*200+800).toFixed(0),incidents:Math.floor(sr(i*143)*50+10),
  investment:+(sr(i*149)*20+5).toFixed(1),disclosure:+(sr(i*151)*15+30).toFixed(1),
}));

export default function WaterRiskPage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('waterStressScore');
  const [sortDir,setSortDir]=useState('desc');
  const [page,setPage]=useState(0);
  const [expanded,setExpanded]=useState(null);
  const [filterSect,setFilterSect]=useState('All');
  const [filterRisk,setFilterRisk]=useState('All');
  const [bSearch,setBSearch]=useState('');
  const [bSort,setBSort]=useState('stressLevel');
  const [bDir,setBDir]=useState('desc');
  const [bExpanded,setBExpanded]=useState(null);

  const filtered=useMemo(()=>{
    let d=[...COMPANIES];
    if(search)d=d.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.sector.toLowerCase().includes(search.toLowerCase()));
    if(filterSect!=='All')d=d.filter(c=>c.sector===filterSect);
    if(filterRisk!=='All')d=d.filter(c=>c.physicalRisk===filterRisk);
    d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));
    return d;
  },[search,sortCol,sortDir,filterSect,filterRisk]);

  const paged=filtered.slice(page*PAGE,page*PAGE+PAGE);
  const totalPages=Math.ceil(filtered.length/PAGE);

  const bFiltered=useMemo(()=>{
    let d=[...BASIN_DATA];
    if(bSearch)d=d.filter(b=>b.name.toLowerCase().includes(bSearch.toLowerCase()));
    d.sort((a,b)=>bDir==='asc'?((a[bSort]>b[bSort])?1:-1):((a[bSort]<b[bSort])?1:-1));
    return d;
  },[bSearch,bSort,bDir]);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(0);};
  const doBSort=(col)=>{if(bSort===col)setBDir(d=>d==='asc'?'desc':'asc');else{setBSort(col);setBDir('desc');}};

  const exportCSV=(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};

  const kpis=useMemo(()=>{
    if(!filtered.length)return{count:0,avgStress:0,highRisk:0,avgRecycle:0,withPolicy:0};
    const avgStress=filtered.reduce((s,c)=>s+parseFloat(c.waterStressScore),0)/filtered.length;
    const highRisk=filtered.filter(c=>c.physicalRisk.includes('High')).length;
    const avgRecycle=filtered.reduce((s,c)=>s+parseFloat(c.recyclingRate),0)/filtered.length;
    const withPolicy=filtered.filter(c=>c.waterPolicy).length;
    return{count:filtered.length,avgStress,highRisk,avgRecycle,withPolicy};
  },[filtered]);

  const SortH=({col,label,w})=><th onClick={()=>doSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,width:w,userSelect:'none',whiteSpace:'nowrap'}}>{label}{sortCol===col?(sortDir==='asc'?' \u25B2':' \u25BC'):''}</th>;
  const BSH=({col,label})=><th onClick={()=>doBSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,userSelect:'none'}}>{label}{bSort===col?(bDir==='asc'?' \u25B2':' \u25BC'):''}</th>;

  const Pg=({pg,setPg,tot})=><div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14}}><button onClick={()=>setPg(p=>Math.max(0,p-1))} disabled={pg===0} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:pg===0?'default':'pointer',opacity:pg===0?0.4:1,fontSize:12}}>Prev</button>{Array.from({length:Math.min(tot,7)},(_,i)=>{const p=tot<=7?i:pg<3?i:pg>tot-4?tot-7+i:pg-3+i;return <button key={p} onClick={()=>setPg(p)} style={{padding:'6px 12px',border:`1px solid ${pg===p?T.gold:T.border}`,borderRadius:6,background:pg===p?T.gold:'transparent',color:pg===p?'#fff':T.text,cursor:'pointer',fontWeight:pg===p?700:400,fontSize:12}}>{p+1}</button>;})}<button onClick={()=>setPg(p=>Math.min(tot-1,p+1))} disabled={pg>=tot-1} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:pg>=tot-1?'default':'pointer',opacity:pg>=tot-1?0.4:1,fontSize:12}}>Next</button></div>;

  const riskColor=r=>r.includes('Extremely')?T.red:r.includes('High')?'#ea580c':r.includes('Medium')?T.amber:T.green;

  const sectDist=useMemo(()=>{const m={};SECTORS.forEach(s=>m[s]=0);filtered.forEach(c=>m[c.sector]++);return Object.entries(m).map(([name,value])=>({name:name.length>12?name.slice(0,12)+'..':name,value}));},[filtered]);
  const riskDist=useMemo(()=>{const m={};RISK_LEVELS.forEach(r=>m[r]=0);filtered.forEach(c=>m[c.physicalRisk]++);return Object.entries(m).map(([name,value])=>({name,value}));},[filtered]);

  const renderDashboard=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {[{l:'Companies Assessed',v:kpis.count},{l:'Avg Stress Score',v:kpis.avgStress.toFixed(1)},{l:'High/Extreme Risk',v:kpis.highRisk},{l:'Avg Recycling Rate',v:kpis.avgRecycle.toFixed(1)+'%'},{l:'With Water Policy',v:kpis.withPolicy}].map((k,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}>
            <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{k.l}</div>
            <div style={{fontSize:24,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Global Water Stress Trend</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
              <Area type="monotone" dataKey="globalStress" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Stress Index"/>
              <Area type="monotone" dataKey="disclosure" stroke={T.navy} fill={T.navy} fillOpacity={0.1} name="Disclosure Rate %"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Physical Risk Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{riskDist.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Sector Exposure</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-45} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={T.navy} radius={[6,6,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Withdrawal vs Recycled Trend</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
              <Line type="monotone" dataKey="withdrawal" stroke={T.red} strokeWidth={2} name="Withdrawal (km3)"/>
              <Line type="monotone" dataKey="recycled" stroke={T.green} strokeWidth={2} name="Recycled (km3)"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Water Stress vs Revenue at Risk</div>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Stress Score" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="Revenue at Risk %" tick={{fontSize:10,fill:T.textMut}}/><ZAxis dataKey="z" range={[40,400]}/><Tooltip {...tip}/>
            <Scatter data={filtered.map(c=>({name:c.name,x:parseFloat(c.waterStressScore),y:parseFloat(c.waterRevRisk),z:parseFloat(c.revenue)}))} fill={T.navy} fillOpacity={0.5}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderAssessment=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search companies..." style={{flex:1,minWidth:200,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}/>
        <select value={filterSect} onChange={e=>{setFilterSect(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Sectors</option>{SECTORS.map(s=><option key={s} value={s}>{s}</option>)}</select>
        <select value={filterRisk} onChange={e=>{setFilterRisk(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Risk Levels</option>{RISK_LEVELS.map(r=><option key={r} value={r}>{r}</option>)}</select>
        <button onClick={()=>exportCSV(filtered,'water_risk.csv')} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{fontSize:12,color:T.textMut,marginBottom:8,fontFamily:T.mono}}>{filtered.length} companies | Page {page+1}/{totalPages}</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:T.surfaceH}}>
            <SortH col="name" label="Company" w="140px"/><SortH col="sector" label="Sector"/><SortH col="waterStressScore" label="Stress Score"/>
            <SortH col="physicalRisk" label="Physical Risk"/><SortH col="waterWithdrawal" label="Withdrawal (ML)"/>
            <SortH col="recyclingRate" label="Recycling %"/><SortH col="cdpScore" label="CDP Score"/><SortH col="waterRevRisk" label="Rev Risk %"/>
          </tr></thead>
          <tbody>
            {paged.map(c=>(
              <React.Fragment key={c.id}>
                <tr onClick={()=>setExpanded(expanded===c.id?null:c.id)} style={{cursor:'pointer',background:expanded===c.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{expanded===c.id?'\u25BC':'\u25B6'} {c.name}</td>
                  <td style={{padding:'10px 8px',color:T.textSec}}>{c.sector}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{c.waterStressScore}</td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,color:'#fff',background:riskColor(c.physicalRisk)}}>{c.physicalRisk}</span></td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{c.waterWithdrawal}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{c.recyclingRate}%</td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:c.cdpScore.startsWith('A')?'#d1fae5':'#fef3c7',color:c.cdpScore.startsWith('A')?'#065f46':'#92400e'}}>{c.cdpScore}</span></td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(c.waterRevRisk)>15?T.red:T.green}}>{c.waterRevRisk}%</td>
                </tr>
                {expanded===c.id&&(
                  <tr><td colSpan={8} style={{padding:20,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Water Metrics</div>
                        {[['Consumption (ML)',c.waterConsumption],['Discharge (ML)',c.waterDischarge],['Intensity',c.waterIntensity],['Basin',c.primaryBasin],['SBTN Status',c.sbtnStatus],['Policy',c.waterPolicy?'Yes':'No'],['Disclosure',c.disclosure?'Yes':'No']].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Risk Profile</div>
                        {[['Regulatory Risk',c.regulatoryRisk],['Reputational Risk',c.reputationalRisk],['Revenue ($M)',fmt(parseFloat(c.revenue))],['Target Reduction',c.targetReduction+'%'],['Actual Reduction',c.actualReduction+'%'],['Pollution Index',c.pollutionIndex],['Biodiversity Impact',c.biodiversityImpact]].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Risk Radar</div>
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={[{m:'Stress',v:parseFloat(c.waterStressScore)},{m:'Physical',v:RISK_LEVELS.indexOf(c.physicalRisk)*20},{m:'Regulatory',v:RISK_LEVELS.indexOf(c.regulatoryRisk)*20},{m:'Pollution',v:parseFloat(c.pollutionIndex)},{m:'Rev Risk',v:parseFloat(c.waterRevRisk)*3},{m:'Biodiversity',v:parseFloat(c.biodiversityImpact)}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:9}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={T.red} fill={T.red} fillOpacity={0.2}/></RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Pg pg={page} setPg={setPage} tot={totalPages}/>
    </div>
  );

  const renderBasins=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <input value={bSearch} onChange={e=>setBSearch(e.target.value)} placeholder="Search basins..." style={{flex:1,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}/>
        <button onClick={()=>exportCSV(BASIN_DATA,'water_basins.csv')} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{overflowX:'auto',marginBottom:20}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:T.surfaceH}}>
            <BSH col="name" label="Basin"/><BSH col="stressLevel" label="Stress Level"/><BSH col="population" label="Pop (M)"/>
            <BSH col="floodRisk" label="Flood Risk"/><BSH col="droughtRisk" label="Drought Risk"/><BSH col="qualityIndex" label="Quality"/>
            <BSH col="companiesExposed" label="Co. Exposed"/><BSH col="regulatoryStrength" label="Regulation"/>
          </tr></thead>
          <tbody>
            {bFiltered.map(b=>(
              <React.Fragment key={b.name}>
                <tr onClick={()=>setBExpanded(bExpanded===b.name?null:b.name)} style={{cursor:'pointer',background:bExpanded===b.name?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{bExpanded===b.name?'\u25BC':'\u25B6'} {b.name}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(b.stressLevel)>60?T.red:T.green}}>{b.stressLevel}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.population}M</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.floodRisk}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.droughtRisk}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.qualityIndex}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.companiesExposed}</td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:b.regulatoryStrength==='Strong'?'#d1fae5':'#fef3c7',color:b.regulatoryStrength==='Strong'?'#065f46':'#92400e'}}>{b.regulatoryStrength}</span></td>
                </tr>
                {bExpanded===b.name&&(
                  <tr><td colSpan={8} style={{padding:16,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                      <div>
                        {[['Irrigated Area',b.irrigatedArea+' km2'],['Annual Flow',b.annualFlow+' km3'],['Groundwater Depletion',b.groundwaterDepletion+' cm/yr']].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,fontFamily:T.mono}}>{v}</span></div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={160}>
                        <RadarChart data={[{m:'Stress',v:parseFloat(b.stressLevel)},{m:'Flood',v:parseFloat(b.floodRisk)},{m:'Drought',v:parseFloat(b.droughtRisk)},{m:'Quality',v:100-parseFloat(b.qualityIndex)},{m:'Depletion',v:parseFloat(b.groundwaterDepletion)*15}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:9}}/><Radar dataKey="v" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/></RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Basin Stress Levels</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...BASIN_DATA].sort((a,b)=>parseFloat(b.stressLevel)-parseFloat(a.stressLevel))} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/><YAxis dataKey="name" type="category" width={110} tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="stressLevel" fill={T.red} radius={[0,6,6,0]} name="Stress Level"/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Flood vs Drought Risk</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Flood Risk" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="Drought Risk" tick={{fontSize:10,fill:T.textMut}}/><ZAxis dataKey="z" range={[60,400]}/><Tooltip {...tip}/>
              <Scatter data={BASIN_DATA.map(b=>({name:b.name,x:parseFloat(b.floodRisk),y:parseFloat(b.droughtRisk),z:b.population}))} fill={T.navy} fillOpacity={0.6}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderMitigation=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[{l:'SBTN Committed',v:filtered.filter(c=>c.sbtnStatus!=='Not Committed').length},{l:'Avg Target',v:filtered.length?(filtered.reduce((s,c)=>s+parseFloat(c.targetReduction),0)/filtered.length).toFixed(1)+'%':'0.0%'},{l:'Avg Achievement',v:filtered.length?(filtered.reduce((s,c)=>s+parseFloat(c.actualReduction),0)/filtered.length).toFixed(1)+'%':'0.0%'},{l:'CDP A/A-',v:filtered.filter(c=>c.cdpScore.startsWith('A')).length}].map((k,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}>
            <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase'}}>{k.l}</div>
            <div style={{fontSize:22,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Target vs Actual Reduction</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={filtered.slice(0,15).map(c=>({name:c.name.slice(0,10),target:parseFloat(c.targetReduction),actual:parseFloat(c.actualReduction)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-45} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
              <Bar dataKey="target" fill={T.navy} name="Target %" radius={[4,4,0,0]}/>
              <Bar dataKey="actual" fill={T.green} name="Actual %" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>SBTN Status Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={['Committed','Target Set','Validated','Not Committed'].map(s=>({name:s,value:filtered.filter(c=>c.sbtnStatus===s).length}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{[T.green,T.gold,T.navy,T.border].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip {...tip}/><Legend/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Investment & Incidents Trend</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ANNUAL}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/><YAxis yAxisId="l" tick={{fontSize:10,fill:T.textMut}}/><YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
              <Line yAxisId="l" type="monotone" dataKey="investment" stroke={T.green} strokeWidth={2} name="Investment ($B)"/>
              <Line yAxisId="r" type="monotone" dataKey="incidents" stroke={T.red} strokeWidth={2} name="Incidents"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>CDP Score Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={['A','A-','B','B-','C','C-','D','D-'].map(s=>({name:s,value:filtered.filter(c=>c.cdpScore===s).length}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={T.navy} radius={[6,6,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>Environmental / Water</div>
        <h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:'4px 0 0'}}>Water Risk Assessment</h1>
        <div style={{width:40,height:3,background:T.gold,borderRadius:2,marginTop:6}}/>
      </div>
      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font}}>{t}</button>)}
      </div>
      {tab===0&&renderDashboard()}
      {tab===1&&renderAssessment()}
      {tab===2&&renderBasins()}
      {tab===3&&renderMitigation()}
    </div>
  );
}