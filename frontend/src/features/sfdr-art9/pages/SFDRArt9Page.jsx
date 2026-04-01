import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899','#06b6d4'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const pct=v=>(v*100).toFixed(1)+'%';
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:12},labelStyle:{color:T.navy,fontWeight:600}};
const TABS=['Fund Dashboard','Product Screener','Sustainability Metrics','Regulatory Compliance'];
const PAGE=12;

const OBJECTIVES=['Climate mitigation','Circular economy','Biodiversity','Water & marine','Pollution prevention','Social inclusion','Clean energy','Sustainable agriculture'];
const STRATEGIES=['Best-in-class','Exclusion','Impact investing','Thematic','Engagement','ESG integration','Positive screening','Negative screening'];
const REGIONS=['Europe','North America','Asia-Pacific','Global','Emerging Markets','Nordic','UK & Ireland','Latin America'];
const MANAGERS=['BlackRock','Amundi','BNP Paribas','Robeco','Nordea','Pictet','Schroders','UBS','DWS','Federated Hermes','NN IP','AXA IM','Legal & General','Aviva','Storebrand','KLP','Mirova','Triodos','Impax','Calvert'];

const FUNDS=Array.from({length:60},(_,i)=>{
  const obj=OBJECTIVES[Math.floor(sr(i*3)*OBJECTIVES.length)];
  const strat=STRATEGIES[Math.floor(sr(i*7)*STRATEGIES.length)];
  const reg=REGIONS[Math.floor(sr(i*11)*REGIONS.length)];
  const mgr=MANAGERS[Math.floor(sr(i*13)*MANAGERS.length)];
  return{id:i+1,name:`Art.9 ${obj.split(' ')[0]} Fund ${i+1}`,manager:mgr,objective:obj,strategy:strat,region:reg,
    aum:+(sr(i*17)*8000+200).toFixed(0),sustainableInvPct:+(sr(i*19)*40+55).toFixed(1),
    taxonomyAligned:+(sr(i*23)*30+15).toFixed(1),dnshPassed:sr(i*29)>0.15,
    carbonIntensity:+(sr(i*31)*120+20).toFixed(1),tempAlignment:+(sr(i*37)*1.5+1.2).toFixed(2),
    paiScore:+(sr(i*41)*40+50).toFixed(1),engagementPct:+(sr(i*43)*60+20).toFixed(1),
    exclusionsPct:+(sr(i*47)*15+2).toFixed(1),sdgAlignment:Math.floor(sr(i*53)*5+3),
    inception:2015+Math.floor(sr(i*59)*9),returnYtd:+(sr(i*61)*30-5).toFixed(1),
    sharpe:+(sr(i*67)*1.5+0.2).toFixed(2),sfdrCompliant:sr(i*71)>0.1,
    greenRevenuePct:+(sr(i*73)*50+30).toFixed(1),socialPct:+(sr(i*79)*25+5).toFixed(1),
    biodiversityScore:+(sr(i*83)*60+30).toFixed(1),waterScore:+(sr(i*89)*50+40).toFixed(1),
  };
});

const MONTHLY=Array.from({length:24},(_,i)=>{
  const d=new Date(2024,i%12,1);
  const m=d.toLocaleString('default',{month:'short'});
  const y=2024+Math.floor(i/12);
  return{month:`${m} ${y}`,flows:+(sr(i*97)*2000-500).toFixed(0),aum:+(sr(i*101)*50000+20000).toFixed(0),
    newProducts:Math.floor(sr(i*103)*8+1),closures:Math.floor(sr(i*107)*3),
    avgTaxonomy:+(sr(i*109)*5+25).toFixed(1),avgCarbon:+(sr(i*113)*20+50).toFixed(1)};
});

const PAI_INDICATORS=Array.from({length:18},(_,i)=>{
  const names=['GHG Scope 1','GHG Scope 2','GHG Scope 3','Carbon Footprint','GHG Intensity','Fossil Fuel Exposure','Non-renewable Energy','Energy Intensity','Biodiversity Impact','Water Emissions','Hazardous Waste','UNGC Violations','Gender Pay Gap','Board Gender Diversity','Controversial Weapons','Social Violations','Land Degradation','Deforestation Risk'];
  return{id:i+1,name:names[i],category:i<8?'Environmental':'Social',mandatory:i<14,
    coverage:+(sr(i*117)*30+65).toFixed(1),avgScore:+(sr(i*121)*40+40).toFixed(1),
    trend:sr(i*127)>0.5?'Improving':'Stable',dataQuality:['High','Medium','Low'][Math.floor(sr(i*131)*3)]};
});

const TAXONOMY=Array.from({length:6},(_,i)=>{
  const names=['Climate Mitigation','Climate Adaptation','Water & Marine','Circular Economy','Pollution Prevention','Biodiversity'];
  return{name:names[i],aligned:+(sr(i*137)*25+10).toFixed(1),eligible:+(sr(i*139)*20+15).toFixed(1),
    notEligible:+(100-sr(i*137)*25-10-sr(i*139)*20-15).toFixed(1)};
});

export default function SFDRArt9Page(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('aum');
  const [sortDir,setSortDir]=useState('desc');
  const [page,setPage]=useState(0);
  const [expanded,setExpanded]=useState(null);
  const [filterObj,setFilterObj]=useState('All');
  const [filterReg,setFilterReg]=useState('All');
  const [paiSearch,setPaiSearch]=useState('');
  const [paiSort,setPaiSort]=useState('coverage');
  const [paiDir,setPaiDir]=useState('desc');
  const [paiPage,setPaiPage]=useState(0);
  const [paiExpanded,setPaiExpanded]=useState(null);

  const filtered=useMemo(()=>{
    let d=[...FUNDS];
    if(search)d=d.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())||f.manager.toLowerCase().includes(search.toLowerCase()));
    if(filterObj!=='All')d=d.filter(f=>f.objective===filterObj);
    if(filterReg!=='All')d=d.filter(f=>f.region===filterReg);
    d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));
    return d;
  },[search,sortCol,sortDir,filterObj,filterReg]);

  const paged=filtered.slice(page*PAGE,page*PAGE+PAGE);
  const totalPages=Math.ceil(filtered.length/PAGE);

  const paiFiltered=useMemo(()=>{
    let d=[...PAI_INDICATORS];
    if(paiSearch)d=d.filter(p=>p.name.toLowerCase().includes(paiSearch.toLowerCase()));
    d.sort((a,b)=>paiDir==='asc'?((a[paiSort]>b[paiSort])?1:-1):((a[paiSort]<b[paiSort])?1:-1));
    return d;
  },[paiSearch,paiSort,paiDir]);

  const paiPaged=paiFiltered.slice(paiPage*PAGE,paiPage*PAGE+PAGE);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(0);};
  const doPaiSort=(col)=>{if(paiSort===col)setPaiDir(d=>d==='asc'?'desc':'asc');else{setPaiSort(col);setPaiDir('desc');}setPaiPage(0);};

  const exportCSV=(data,filename)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=filename;a.click();URL.revokeObjectURL(u);};

  const kpis=useMemo(()=>{
    const tot=filtered.length;
    const avgAum=filtered.reduce((s,f)=>s+f.aum,0)/tot;
    const avgSust=filtered.reduce((s,f)=>s+parseFloat(f.sustainableInvPct),0)/tot;
    const avgTax=filtered.reduce((s,f)=>s+parseFloat(f.taxonomyAligned),0)/tot;
    const avgCarb=filtered.reduce((s,f)=>s+parseFloat(f.carbonIntensity),0)/tot;
    return{tot,avgAum,avgSust,avgTax,avgCarb};
  },[filtered]);

  const objDist=useMemo(()=>{
    const m={};OBJECTIVES.forEach(o=>m[o]=0);
    filtered.forEach(f=>m[f.objective]++);
    return Object.entries(m).map(([name,value])=>({name:name.length>18?name.slice(0,18)+'..':name,value,full:name}));
  },[filtered]);

  const regDist=useMemo(()=>{
    const m={};REGIONS.forEach(r=>m[r]=0);
    filtered.forEach(f=>m[f.region]++);
    return Object.entries(m).map(([name,value])=>({name,value}));
  },[filtered]);

  const radarData=useMemo(()=>{
    if(!expanded)return[];
    const f=FUNDS.find(x=>x.id===expanded);
    if(!f)return[];
    return[{metric:'Sustainable Inv',val:parseFloat(f.sustainableInvPct),full:100},
      {metric:'Taxonomy',val:parseFloat(f.taxonomyAligned),full:100},
      {metric:'PAI Score',val:parseFloat(f.paiScore),full:100},
      {metric:'Engagement',val:parseFloat(f.engagementPct),full:100},
      {metric:'Green Revenue',val:parseFloat(f.greenRevenuePct),full:100},
      {metric:'Biodiversity',val:parseFloat(f.biodiversityScore),full:100}];
  },[expanded]);

  const scatterData=useMemo(()=>filtered.map(f=>({name:f.name,x:parseFloat(f.carbonIntensity),y:parseFloat(f.returnYtd),z:f.aum})),[filtered]);

  const SortH=({col,label,w})=>(
    <th onClick={()=>doSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,letterSpacing:0.5,width:w,userSelect:'none',whiteSpace:'nowrap'}}>
      {label}{sortCol===col?(sortDir==='asc'?' \u25B2':' \u25BC'):''}
    </th>
  );

  const PaiSortH=({col,label})=>(
    <th onClick={()=>doPaiSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,letterSpacing:0.5,userSelect:'none'}}>
      {label}{paiSort===col?(paiDir==='asc'?' \u25B2':' \u25BC'):''}
    </th>
  );

  const renderDashboard=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {[{l:'Total Art.9 Funds',v:kpis.tot},{l:'Avg AUM',v:fmt(kpis.avgAum)+'M'},{l:'Avg Sustainable Inv %',v:kpis.avgSust.toFixed(1)+'%'},{l:'Avg Taxonomy Aligned',v:kpis.avgTax.toFixed(1)+'%'},{l:'Avg Carbon Intensity',v:kpis.avgCarb.toFixed(1)}].map((k,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}>
            <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{k.l}</div>
            <div style={{fontSize:24,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Fund Flows & AUM Trend</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} interval={3}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip {...tip}/>
              <Legend/>
              <Area type="monotone" dataKey="aum" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="AUM ($M)"/>
              <Area type="monotone" dataKey="flows" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Net Flows ($M)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Objective Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={objDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {objDist.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}
              </Pie>
              <Tooltip {...tip}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Region Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={regDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip {...tip}/>
              <Bar dataKey="value" fill={T.sage} radius={[0,6,6,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Carbon Intensity vs Return</div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="x" name="Carbon Intensity" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis dataKey="y" name="YTD Return %" tick={{fontSize:10,fill:T.textMut}}/>
              <ZAxis dataKey="z" range={[40,400]}/>
              <Tooltip {...tip} formatter={(v,n)=>[v,n]}/>
              <Scatter data={scatterData} fill={T.navy} fillOpacity={0.6}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Monthly Product Activity</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={MONTHLY}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} interval={3}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip {...tip}/>
            <Legend/>
            <Bar dataKey="newProducts" fill={T.green} name="New Products" radius={[4,4,0,0]}/>
            <Bar dataKey="closures" fill={T.red} name="Closures" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderScreener=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search funds or managers..." style={{flex:1,minWidth:200,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}/>
        <select value={filterObj} onChange={e=>{setFilterObj(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
          <option value="All">All Objectives</option>
          {OBJECTIVES.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        <select value={filterReg} onChange={e=>{setFilterReg(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
          <option value="All">All Regions</option>
          {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={()=>exportCSV(filtered,'sfdr_art9_funds.csv')} style={{padding:'8px 16px',border:`1px solid ${T.gold}`,borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:T.font}}>Export CSV</button>
      </div>
      <div style={{fontSize:12,color:T.textMut,marginBottom:8,fontFamily:T.mono}}>Showing {filtered.length} funds | Page {page+1}/{totalPages}</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          <thead>
            <tr style={{background:T.surfaceH}}>
              <SortH col="name" label="Fund Name" w="180px"/>
              <SortH col="manager" label="Manager" w="120px"/>
              <SortH col="objective" label="Objective"/>
              <SortH col="aum" label="AUM ($M)"/>
              <SortH col="sustainableInvPct" label="Sust Inv %"/>
              <SortH col="taxonomyAligned" label="Tax Aligned %"/>
              <SortH col="carbonIntensity" label="Carbon Int."/>
              <SortH col="tempAlignment" label="Temp Align"/>
              <SortH col="returnYtd" label="YTD Ret %"/>
              <SortH col="sharpe" label="Sharpe"/>
            </tr>
          </thead>
          <tbody>
            {paged.map(f=>(
              <React.Fragment key={f.id}>
                <tr onClick={()=>setExpanded(expanded===f.id?null:f.id)} style={{cursor:'pointer',background:expanded===f.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`,transition:'background 0.15s'}}>
                  <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{expanded===f.id?'\u25BC':'\u25B6'} {f.name}</td>
                  <td style={{padding:'10px 8px',color:T.textSec}}>{f.manager}</td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:T.surfaceH,color:T.navy}}>{f.objective}</span></td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{fmt(f.aum)}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(f.sustainableInvPct)>80?T.green:T.navy}}>{f.sustainableInvPct}%</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{f.taxonomyAligned}%</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(f.carbonIntensity)>80?T.red:T.green}}>{f.carbonIntensity}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(f.tempAlignment)>2.0?T.red:T.green}}>{f.tempAlignment}&deg;C</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(f.returnYtd)>0?T.green:T.red}}>{f.returnYtd}%</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{f.sharpe}</td>
                </tr>
                {expanded===f.id&&(
                  <tr><td colSpan={10} style={{padding:20,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Fund Details</div>
                        {[['Strategy',f.strategy],['Region',f.region],['Inception',f.inception],['DNSH Passed',f.dnshPassed?'Yes':'No'],['SDG Alignment',f.sdgAlignment+' goals'],['SFDR Compliant',f.sfdrCompliant?'Yes':'No']].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}>
                            <span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Impact Metrics</div>
                        {[['PAI Score',f.paiScore],['Engagement %',f.engagementPct+'%'],['Exclusions %',f.exclusionsPct+'%'],['Green Revenue',f.greenRevenuePct+'%'],['Social Allocation',f.socialPct+'%'],['Water Score',f.waterScore]].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}>
                            <span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Sustainability Radar</div>
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke={T.border}/>
                            <PolarAngleAxis dataKey="metric" tick={{fontSize:9,fill:T.textSec}}/>
                            <PolarRadiusAxis tick={{fontSize:8}} domain={[0,100]}/>
                            <Radar dataKey="val" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
                          </RadarChart>
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
      <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14}}>
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1,fontSize:12}}>Prev</button>
        {Array.from({length:Math.min(totalPages,7)},(_,i)=>{const p=totalPages<=7?i:page<3?i:page>totalPages-4?totalPages-7+i:page-3+i;return(
          <button key={p} onClick={()=>setPage(p)} style={{padding:'6px 12px',border:`1px solid ${page===p?T.gold:T.border}`,borderRadius:6,background:page===p?T.gold:'transparent',color:page===p?'#fff':T.text,cursor:'pointer',fontWeight:page===p?700:400,fontSize:12}}>{p+1}</button>
        );})}
        <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page>=totalPages-1?'default':'pointer',opacity:page>=totalPages-1?0.4:1,fontSize:12}}>Next</button>
      </div>
    </div>
  );

  const renderMetrics=()=>{
    const taxChart=TAXONOMY.map(t=>({...t,aligned:parseFloat(t.aligned),eligible:parseFloat(t.eligible),notEligible:parseFloat(t.notEligible)}));
    const stratDist=useMemo(()=>{const m={};STRATEGIES.forEach(s=>m[s]=0);filtered.forEach(f=>m[f.strategy]++);return Object.entries(m).map(([name,value])=>({name,value}));},[filtered]);
    const tempBuckets=useMemo(()=>{const b={'<1.5C':0,'1.5-2.0C':0,'2.0-2.5C':0,'>2.5C':0};filtered.forEach(f=>{const t=parseFloat(f.tempAlignment);if(t<1.5)b['<1.5C']++;else if(t<2.0)b['1.5-2.0C']++;else if(t<2.5)b['2.0-2.5C']++;else b['>2.5C']++;});return Object.entries(b).map(([name,value])=>({name,value}));},[filtered]);
    return(
      <div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>EU Taxonomy Alignment by Objective</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={taxChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}}/>
                <YAxis tick={{fontSize:10,fill:T.textMut}}/>
                <Tooltip {...tip}/>
                <Legend/>
                <Bar dataKey="aligned" stackId="a" fill={T.green} name="Aligned %"/>
                <Bar dataKey="eligible" stackId="a" fill={T.gold} name="Eligible %"/>
                <Bar dataKey="notEligible" stackId="a" fill={T.border} name="Not Eligible %"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Strategy Distribution</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stratDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name.slice(0,12)} ${(percent*100).toFixed(0)}%`}>
                  {stratDist.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}
                </Pie>
                <Tooltip {...tip}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Temperature Alignment Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tempBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:11,fill:T.textMut}}/>
                <YAxis tick={{fontSize:10,fill:T.textMut}}/>
                <Tooltip {...tip}/>
                <Bar dataKey="value" fill={T.navy} radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Avg Taxonomy Alignment Trend</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={MONTHLY}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/>
                <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[20,40]}/>
                <Tooltip {...tip}/>
                <Line type="monotone" dataKey="avgTaxonomy" stroke={T.green} strokeWidth={2} dot={false} name="Avg Taxonomy %"/>
                <Line type="monotone" dataKey="avgCarbon" stroke={T.red} strokeWidth={2} dot={false} name="Avg Carbon"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderCompliance=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <input value={paiSearch} onChange={e=>{setPaiSearch(e.target.value);setPaiPage(0);}} placeholder="Search PAI indicators..." style={{flex:1,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}/>
        <button onClick={()=>exportCSV(PAI_INDICATORS,'pai_indicators.csv')} style={{padding:'8px 16px',border:`1px solid ${T.gold}`,borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export PAI CSV</button>
      </div>
      <div style={{overflowX:'auto',marginBottom:20}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          <thead>
            <tr style={{background:T.surfaceH}}>
              <PaiSortH col="name" label="Indicator"/>
              <PaiSortH col="category" label="Category"/>
              <th style={{padding:'10px 8px',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec}}>Mandatory</th>
              <PaiSortH col="coverage" label="Coverage %"/>
              <PaiSortH col="avgScore" label="Avg Score"/>
              <PaiSortH col="trend" label="Trend"/>
              <PaiSortH col="dataQuality" label="Data Quality"/>
            </tr>
          </thead>
          <tbody>
            {paiPaged.map(p=>(
              <React.Fragment key={p.id}>
                <tr onClick={()=>setPaiExpanded(paiExpanded===p.id?null:p.id)} style={{cursor:'pointer',background:paiExpanded===p.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{paiExpanded===p.id?'\u25BC':'\u25B6'} {p.name}</td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,background:p.category==='Environmental'?'#d1fae5':'#dbeafe',color:p.category==='Environmental'?'#065f46':'#1e40af',fontWeight:600}}>{p.category}</span></td>
                  <td style={{padding:'10px 8px',textAlign:'center'}}>{p.mandatory?'\u2705':'\u2796'}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{p.coverage}%</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{p.avgScore}</td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,background:p.trend==='Improving'?'#d1fae5':'#fef3c7',color:p.trend==='Improving'?'#065f46':'#92400e',fontWeight:600}}>{p.trend}</span></td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,background:p.dataQuality==='High'?'#d1fae5':p.dataQuality==='Medium'?'#fef3c7':'#fee2e2',color:p.dataQuality==='High'?'#065f46':p.dataQuality==='Medium'?'#92400e':'#991b1b',fontWeight:600}}>{p.dataQuality}</span></td>
                </tr>
                {paiExpanded===p.id&&(
                  <tr><td colSpan={7} style={{padding:16,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>Coverage by Fund Count</div>
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={[{name:'Reporting',val:Math.round(parseFloat(p.coverage)*60/100)},{name:'Not Reporting',val:60-Math.round(parseFloat(p.coverage)*60/100)}]}>
                            <XAxis dataKey="name" tick={{fontSize:10}}/>
                            <YAxis tick={{fontSize:10}}/>
                            <Bar dataKey="val" fill={T.navy} radius={[4,4,0,0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
                        <p><strong>Description:</strong> {p.name} measures the portfolio-level exposure and impact related to {p.category.toLowerCase()} principal adverse impacts under SFDR Article 9 requirements.</p>
                        <p><strong>Methodology:</strong> Weighted average based on investee company data, with gap-filling for missing values using sector proxies.</p>
                        <p><strong>Regulatory Reference:</strong> SFDR RTS Annex I, Table {p.mandatory?'1 (Mandatory)':'2/3 (Opt-in)'}</p>
                      </div>
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
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>PAI Coverage by Category</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={PAI_INDICATORS.map(p=>({name:p.name.length>15?p.name.slice(0,15)+'..':p.name,coverage:parseFloat(p.coverage),score:parseFloat(p.avgScore)}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:7,fill:T.textMut}} interval={0} angle={-45} textAnchor="end" height={80}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip {...tip}/>
              <Legend/>
              <Bar dataKey="coverage" fill={T.navy} name="Coverage %" radius={[3,3,0,0]}/>
              <Bar dataKey="score" fill={T.gold} name="Avg Score" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Compliance Status Overview</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={[{name:'SFDR Compliant',value:filtered.filter(f=>f.sfdrCompliant).length},{name:'Under Review',value:filtered.filter(f=>!f.sfdrCompliant).length}]} dataKey="value" cx="50%" cy="50%" outerRadius={90} label>
                <Cell fill={T.green}/><Cell fill={T.amber}/>
              </Pie>
              <Tooltip {...tip}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>Sustainable Finance Disclosure</div>
        <h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:'4px 0 0'}}>SFDR Article 9 Intelligence</h1>
        <div style={{width:40,height:3,background:T.gold,borderRadius:2,marginTop:6}}/>
      </div>
      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'}}>{t}</button>
        ))}
      </div>
      {tab===0&&renderDashboard()}
      {tab===1&&renderScreener()}
      {tab===2&&renderMetrics()}
      {tab===3&&renderCompliance()}
    </div>
  );
}