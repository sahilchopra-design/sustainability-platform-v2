import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899','#06b6d4'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:12},labelStyle:{color:T.navy,fontWeight:600}};
const TABS=['Index Overview','Benchmark Screener','Performance Analytics','Methodology Comparison'];
const PAGE=12;

const PROVIDERS=['MSCI','S&P DJI','FTSE Russell','Bloomberg','Morningstar','ISS ESG','Sustainalytics','Solactive','STOXX','Qontigo'];
const TYPES=['ESG Leaders','SRI','Paris-Aligned','Climate Transition','Low Carbon','Gender Equality','Social','Green Bond','Thematic','Multi-Factor ESG'];
const REGIONS=['Global','US','Europe','Asia-Pacific','Emerging Markets','Japan','UK','China'];

const BENCHMARKS=Array.from({length:60},(_,i)=>{
  const prov=PROVIDERS[Math.floor(sr(i*3)*PROVIDERS.length)];
  const type=TYPES[Math.floor(sr(i*7)*TYPES.length)];
  const reg=REGIONS[Math.floor(sr(i*11)*REGIONS.length)];
  return{id:i+1,name:`${prov} ${reg} ${type} Index`,provider:prov,type,region:reg,
    constituents:Math.floor(sr(i*13)*800+50),aum:+(sr(i*17)*50+1).toFixed(1),
    esgScore:+(sr(i*19)*30+55).toFixed(1),carbonIntensity:+(sr(i*23)*150+20).toFixed(1),
    returnYtd:+(sr(i*29)*25-5).toFixed(2),return1y:+(sr(i*31)*30-8).toFixed(2),
    return3y:+(sr(i*37)*15-2).toFixed(2),return5y:+(sr(i*41)*12).toFixed(2),
    volatility:+(sr(i*43)*15+5).toFixed(2),sharpe:+(sr(i*47)*1.5+0.1).toFixed(2),
    trackingError:+(sr(i*53)*3+0.2).toFixed(2),turnover:+(sr(i*59)*20+5).toFixed(1),
    exclusions:Math.floor(sr(i*61)*200+10),womenBoard:+(sr(i*67)*25+15).toFixed(1),
    greenRevPct:+(sr(i*71)*40+10).toFixed(1),tempAlignment:+(sr(i*73)*1.5+1.2).toFixed(2),
    rebalance:['Quarterly','Semi-annual','Annual'][Math.floor(sr(i*79)*3)],
    inception:2010+Math.floor(sr(i*83)*14),methodology:['Best-in-class','Exclusion','Optimization','Tilt','Composite'][Math.floor(sr(i*89)*5)],
    parentIndex:['MSCI World','S&P 500','FTSE All-World','Bloomberg Global Agg','STOXX 600'][Math.floor(sr(i*97)*5)],
  };
});

const MONTHLY=Array.from({length:24},(_,i)=>{
  const d=new Date(2024,i%12,1);return{month:`${d.toLocaleString('default',{month:'short'})} ${2024+Math.floor(i/12)}`,
    esgLeaders:+(sr(i*101)*5-1).toFixed(2),parentIndex:+(sr(i*103)*5-1.5).toFixed(2),
    pab:+(sr(i*107)*4-0.5).toFixed(2),ctb:+(sr(i*109)*4.5-1).toFixed(2),
    flows:+(sr(i*113)*5000-1000).toFixed(0),newLaunches:Math.floor(sr(i*117)*10+1),
  };
});

const SECTORS=['Technology','Healthcare','Financials','Industrials','Consumer Disc.','Consumer Staples','Energy','Materials','Utilities','Real Estate','Communication'];
const SECTOR_DATA=SECTORS.map((s,i)=>({name:s,esgWeight:+(sr(i*121)*15+2).toFixed(1),parentWeight:+(sr(i*127)*15+2).toFixed(1),overweight:+(sr(i*121)*15+2-sr(i*127)*15-2).toFixed(1)}));

export default function BenchmarkAnalyticsPage(){
  const [tab,setTab]=useState(0);const [search,setSearch]=useState('');const [sortCol,setSortCol]=useState('aum');const [sortDir,setSortDir]=useState('desc');const [page,setPage]=useState(0);const [expanded,setExpanded]=useState(null);const [filterProv,setFilterProv]=useState('All');const [filterType,setFilterType]=useState('All');

  const filtered=useMemo(()=>{let d=[...BENCHMARKS];if(search)d=d.filter(b=>b.name.toLowerCase().includes(search.toLowerCase())||b.provider.toLowerCase().includes(search.toLowerCase()));if(filterProv!=='All')d=d.filter(b=>b.provider===filterProv);if(filterType!=='All')d=d.filter(b=>b.type===filterType);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));return d;},[search,sortCol,sortDir,filterProv,filterType]);
  const paged=filtered.slice(page*PAGE,page*PAGE+PAGE);const totalPages=Math.ceil(filtered.length/PAGE);

  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(0);};
  const exportCSV=(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};

  const kpis=useMemo(()=>{const n=filtered.length||1;return{count:filtered.length,totalAum:filtered.reduce((s,b)=>s+b.aum,0),avgEsg:(filtered.reduce((s,b)=>s+parseFloat(b.esgScore),0)/n),avgReturn:(filtered.reduce((s,b)=>s+parseFloat(b.returnYtd),0)/n),avgCarbon:(filtered.reduce((s,b)=>s+parseFloat(b.carbonIntensity),0)/n)};},[filtered]);

  const provDist=useMemo(()=>{const m={};PROVIDERS.forEach(p=>m[p]=0);filtered.forEach(b=>m[b.provider]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({name,value}));},[filtered]);
  const typeDist=useMemo(()=>{const m={};TYPES.forEach(t=>m[t]=0);filtered.forEach(b=>m[b.type]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value}));},[filtered]);

  const SortH=({col,label,w})=><th onClick={()=>doSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,width:w,userSelect:'none',whiteSpace:'nowrap'}}>{label}{sortCol===col?(sortDir==='asc'?' \u25B2':' \u25BC'):''}</th>;
  const Pg=()=><div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14}}><button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1,fontSize:12}}>Prev</button>{Array.from({length:Math.min(totalPages,7)},(_,i)=>{const p=totalPages<=7?i:page<3?i:page>totalPages-4?totalPages-7+i:page-3+i;return <button key={p} onClick={()=>setPage(p)} style={{padding:'6px 12px',border:`1px solid ${page===p?T.gold:T.border}`,borderRadius:6,background:page===p?T.gold:'transparent',color:page===p?'#fff':T.text,cursor:'pointer',fontWeight:page===p?700:400,fontSize:12}}>{p+1}</button>;})}<button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page>=totalPages-1?'default':'pointer',opacity:page>=totalPages-1?0.4:1,fontSize:12}}>Next</button></div>;

  const renderOverview=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {[{l:'Total Indices',v:kpis.count},{l:'Total AUM',v:'$'+fmt(kpis.totalAum)+'B'},{l:'Avg ESG Score',v:kpis.avgEsg.toFixed(1)},{l:'Avg YTD Return',v:kpis.avgReturn.toFixed(2)+'%'},{l:'Avg Carbon Int.',v:kpis.avgCarbon.toFixed(1)}].map((k,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{k.l}</div><div style={{fontSize:24,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div></div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Index Performance Comparison</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
              <Line type="monotone" dataKey="esgLeaders" stroke={T.green} strokeWidth={2} dot={false} name="ESG Leaders"/>
              <Line type="monotone" dataKey="parentIndex" stroke={T.navy} strokeWidth={2} dot={false} name="Parent Index"/>
              <Line type="monotone" dataKey="pab" stroke={T.gold} strokeWidth={2} dot={false} name="Paris-Aligned"/>
              <Line type="monotone" dataKey="ctb" stroke={T.sage} strokeWidth={2} dot={false} name="Climate Trans."/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Provider Market Share</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={provDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{provDist.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Index Type Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={typeDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-45} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={T.navy} radius={[6,6,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Flows & New Launches</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
              <Bar dataKey="flows" fill={T.navy} name="Net Flows ($M)" radius={[4,4,0,0]}/>
              <Bar dataKey="newLaunches" fill={T.gold} name="New Launches" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>ESG Score vs Return (Bubble = AUM)</div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="ESG Score" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="YTD Return %" tick={{fontSize:10,fill:T.textMut}}/><ZAxis dataKey="z" range={[40,400]}/><Tooltip {...tip}/>
            <Scatter data={filtered.map(b=>({name:b.name,x:parseFloat(b.esgScore),y:parseFloat(b.returnYtd),z:b.aum*5}))} fill={T.navy} fillOpacity={0.5}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderScreener=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search indices..." style={{flex:1,minWidth:200,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}/>
        <select value={filterProv} onChange={e=>{setFilterProv(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Providers</option>{PROVIDERS.map(p=><option key={p} value={p}>{p}</option>)}</select>
        <select value={filterType} onChange={e=>{setFilterType(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All Types</option>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
        <button onClick={()=>exportCSV(filtered,'benchmarks.csv')} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{fontSize:12,color:T.textMut,marginBottom:8,fontFamily:T.mono}}>{filtered.length} indices | Page {page+1}/{totalPages}</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:T.surfaceH}}>
            <SortH col="name" label="Index" w="200px"/><SortH col="provider" label="Provider"/><SortH col="type" label="Type"/>
            <SortH col="aum" label="AUM ($B)"/><SortH col="esgScore" label="ESG Score"/><SortH col="returnYtd" label="YTD %"/>
            <SortH col="volatility" label="Vol %"/><SortH col="sharpe" label="Sharpe"/><SortH col="carbonIntensity" label="Carbon Int."/>
          </tr></thead>
          <tbody>
            {paged.map(b=>(
              <React.Fragment key={b.id}>
                <tr onClick={()=>setExpanded(expanded===b.id?null:b.id)} style={{cursor:'pointer',background:expanded===b.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{expanded===b.id?'\u25BC':'\u25B6'} {b.name.slice(0,28)}</td>
                  <td style={{padding:'10px 8px',color:T.textSec}}>{b.provider}</td>
                  <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:T.surfaceH,color:T.navy}}>{b.type}</span></td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.aum}B</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(b.esgScore)>70?T.green:T.navy}}>{b.esgScore}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(b.returnYtd)>0?T.green:T.red}}>{b.returnYtd}%</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.volatility}%</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.sharpe}</td>
                  <td style={{padding:'10px 8px',fontFamily:T.mono}}>{b.carbonIntensity}</td>
                </tr>
                {expanded===b.id&&(
                  <tr><td colSpan={9} style={{padding:20,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Index Details</div>
                        {[['Region',b.region],['Constituents',b.constituents],['Inception',b.inception],['Rebalance',b.rebalance],['Methodology',b.methodology],['Parent Index',b.parentIndex],['Tracking Error',b.trackingError+'%']].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Performance & ESG</div>
                        {[['1Y Return',b.return1y+'%'],['3Y Ann.',b.return3y+'%'],['5Y Ann.',b.return5y+'%'],['Turnover',b.turnover+'%'],['Exclusions',b.exclusions],['Women on Board',b.womenBoard+'%'],['Green Revenue',b.greenRevPct+'%']].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</span></div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>ESG Profile</div>
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={[{m:'ESG Score',v:parseFloat(b.esgScore)},{m:'Green Rev',v:parseFloat(b.greenRevPct)},{m:'Gender',v:parseFloat(b.womenBoard)*2},{m:'Low Carbon',v:100-parseFloat(b.carbonIntensity)/1.5},{m:'Return',v:(parseFloat(b.returnYtd)+10)*3},{m:'Sharpe',v:parseFloat(b.sharpe)*50}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:9}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/></RadarChart>
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
      <Pg/>
    </div>
  );

  const renderPerformance=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Sector Weight Comparison (ESG vs Parent)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={SECTOR_DATA}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-45} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/>
              <Bar dataKey="esgWeight" fill={T.green} name="ESG Index %" radius={[4,4,0,0]}/>
              <Bar dataKey="parentWeight" fill={T.navy} name="Parent Index %" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Active Overweight/Underweight</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={SECTOR_DATA} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="name" type="category" width={100} tick={{fontSize:9,fill:T.textMut}}/><Tooltip {...tip}/>
              <Bar dataKey="overweight" fill={T.gold} radius={[0,6,6,0]} name="Active Weight %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Risk-Return Scatter</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Volatility %" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="Return %" tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/>
              <Scatter data={filtered.map(b=>({name:b.name.slice(0,20),x:parseFloat(b.volatility),y:parseFloat(b.returnYtd)}))} fill={T.navy} fillOpacity={0.6}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Tracking Error Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[{'<0.5%':0,'0.5-1%':0,'1-2%':0,'2-3%':0,'>3%':0},...filtered].reduce((acc,b)=>{if(!b.trackingError)return acc;const v=parseFloat(b.trackingError);if(v<0.5)acc[0]['<0.5%']++;else if(v<1)acc[0]['0.5-1%']++;else if(v<2)acc[0]['1-2%']++;else if(v<3)acc[0]['2-3%']++;else acc[0]['>3%']++;return acc;}).map((v,k)=>({name:k,value:v})).length?Object.entries([{'<0.5%':0,'0.5-1%':0,'1-2%':0,'2-3%':0,'>3%':0},...filtered].reduce((acc,b)=>{if(typeof b==='object'&&b.trackingError){const v=parseFloat(b.trackingError);if(v<0.5)acc['<0.5%']=(acc['<0.5%']||0)+1;else if(v<1)acc['0.5-1%']=(acc['0.5-1%']||0)+1;else if(v<2)acc['1-2%']=(acc['1-2%']||0)+1;else if(v<3)acc['2-3%']=(acc['2-3%']||0)+1;else acc['>3%']=(acc['>3%']||0)+1;}return acc;},{})).map(([name,value])=>({name,value})):[]}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={T.sage} radius={[6,6,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderMethodology=()=>{
    const methDist=[];const mMap={};filtered.forEach(b=>{mMap[b.methodology]=(mMap[b.methodology]||0)+1;});Object.entries(mMap).forEach(([name,value])=>methDist.push({name,value}));
    const rebDist=[];const rMap={};filtered.forEach(b=>{rMap[b.rebalance]=(rMap[b.rebalance]||0)+1;});Object.entries(rMap).forEach(([name,value])=>rebDist.push({name,value}));
    return(
      <div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {[{l:'Unique Providers',v:new Set(filtered.map(b=>b.provider)).size},{l:'Avg Constituents',v:filtered.length?Math.round(filtered.reduce((s,b)=>s+b.constituents,0)/filtered.length):0},{l:'Avg Exclusions',v:filtered.length?Math.round(filtered.reduce((s,b)=>s+b.exclusions,0)/filtered.length):0},{l:'Avg Turnover',v:filtered.length?(filtered.reduce((s,b)=>s+parseFloat(b.turnover),0)/filtered.length).toFixed(1)+'%':'0.0%'}].map((k,i)=>(
            <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:22,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div></div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Methodology Distribution</div>
            <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={methDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{methDist.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/><Legend/></PieChart></ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Rebalance Frequency</div>
            <ResponsiveContainer width="100%" height={260}><BarChart data={rebDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={T.sage} radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Temperature Alignment by Type</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={TYPES.map(t=>{const bs=filtered.filter(b=>b.type===t);return{name:t.slice(0,12),temp:bs.length?(bs.reduce((s,b)=>s+parseFloat(b.tempAlignment),0)/bs.length).toFixed(2):0};}).filter(d=>d.temp>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-30} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="temp" fill={T.gold} radius={[6,6,0,0]} name="Temp Alignment (C)"/></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Carbon Intensity by Provider</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={PROVIDERS.map(p=>{const bs=filtered.filter(b=>b.provider===p);return{name:p,carbon:bs.length?(bs.reduce((s,b)=>s+parseFloat(b.carbonIntensity),0)/bs.length).toFixed(1):0};}).filter(d=>d.carbon>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-30} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="carbon" fill={T.red} radius={[6,6,0,0]} name="Carbon Intensity"/></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>Index & Benchmarks</div><h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:'4px 0 0'}}>ESG Benchmark Analytics</h1><div style={{width:40,height:3,background:T.gold,borderRadius:2,marginTop:6}}/></div>
      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>{TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font}}>{t}</button>)}</div>
      {tab===0&&renderOverview()}{tab===1&&renderScreener()}{tab===2&&renderPerformance()}{tab===3&&renderMethodology()}
    </div>
  );
}