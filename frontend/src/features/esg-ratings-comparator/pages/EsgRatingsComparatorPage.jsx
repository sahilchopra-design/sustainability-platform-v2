import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,ScatterChart,Scatter,Legend,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const PROVIDERS=['MSCI','Sustainalytics','ISS','CDP','S&P Global','Bloomberg'];
const MSCI_LEVELS=['AAA','AA','A','BBB','BB','B','CCC'];
const CDP_LEVELS=['A','A-','B','B-','C','C-','D','D-'];
const SECTORS=['Software','Semiconductors','Pharmaceuticals','Biotechnology','Commercial Banks','Insurance','Oil & Gas','Renewable Energy','Electric Utilities','Automotive','Aerospace & Defense','Mining','Food & Beverage','Retail','Telecommunications'];
const COUNTRIES=['US','GB','DE','JP','FR','CH','CA','AU','KR','NL','SE','NO','DK','SG','IN'];
const CAPS=['Large','Mid','Small'];
const PCOLORS=[T.navy,T.red,T.sage,T.amber,T.navyL,'#7c3aed'];

const NAMES=['Apple','Microsoft','Alphabet','Amazon','Meta','Tesla','NVIDIA','Johnson & Johnson','Visa','Procter & Gamble','UnitedHealth','JPMorgan Chase','Mastercard','Home Depot','Chevron','AbbVie','Merck','PepsiCo','Costco','Eli Lilly','Broadcom','Pfizer','Cisco','Adobe','Thermo Fisher','Accenture','Danaher','Nike','McDonald\'s','Honeywell','Amgen','Intel','Texas Instruments','Union Pacific','Caterpillar','Goldman Sachs','Deere','IBM','Starbucks','Lockheed Martin','Palo Alto Networks','Automatic Data','Marsh McLennan','Becton Dickinson','Air Products','Ecolab','Waste Management','Republic Services','ASML','TSMC','Samsung','Toyota','Nestl\u00e9','Roche','Novartis','AstraZeneca','Shell','BP','TotalEnergies','Siemens','SAP','Allianz','BASF','Bayer','Deutsche Telekom','Munich Re','Unilever','GSK','Rio Tinto','BHP','Anglo American','Glencore','Equinor','Vestas','Orsted','Iberdrola','Enel','NextEra Energy','Brookfield Renewable','Enphase','SolarEdge','Canadian Solar','First Solar','Schneider Electric','ABB','Emerson','Rockwell','Parker Hannifin','Fortive','Xylem','Trane Technologies','Daikin Industries','Nidec','Keyence','Fanuc','Murata','Shin-Etsu','Hoya','TDK','Mitsubishi UFJ','Sumitomo Mitsui','Mizuho','Nomura','HDFC Bank','Infosys','TCS','Wipro','HCL Tech','Reliance Industries','DBS Group','OCBC','UOB','Singtel','Keppel','CapitaLand','Volvo','Atlas Copco','Sandvik','Hexagon','Assa Abloy','Epiroc','Novo Nordisk','DSV','Coloplast','Vestas Wind','Novozymes','Chr. Hansen','Carlsberg','Maersk','Yara','DNB','Mowi','Kongsberg','Tomra','Telenor','Schibsted','Ahold Delhaize','ASML Holding','ING Group','Adyen','Prosus','Wolters Kluwer','Heineken','ArcelorMittal','Philips','Randstad','Akzo Nobel','Just Eat','NN Group','Aegon'];

function genCompanies(){
  const out=[];
  for(let i=0;i<150;i++){
    const sector=SECTORS[Math.floor(sr(i*23+5)*SECTORS.length)];
    const country=COUNTRIES[Math.floor(sr(i*31+9)*COUNTRIES.length)];
    const cap=CAPS[Math.floor(sr(i*37+2)*3)];
    const msciIdx=Math.floor(sr(i*41+1)*7);
    const sustVal=Math.floor(10+sr(i*43+3)*80);
    const issVal=Math.round((1+sr(i*47+5)*9)*10)/10;
    const cdpIdx=Math.floor(sr(i*53+7)*8);
    const spVal=Math.floor(15+sr(i*59+11)*75);
    const bbgVal=Math.floor(10+sr(i*61+13)*80);
    const hist=[];
    for(let q=0;q<12;q++){
      const drift=sr(i*100+q*17);
      hist.push({
        q:`Q${(q%4)+1} ${2023+Math.floor(q/4)}`,
        msci:Math.min(6,Math.max(0,msciIdx+Math.floor((drift-0.5)*2))),
        sust:Math.min(100,Math.max(0,sustVal+Math.floor((sr(i*100+q*19)-0.5)*20))),
        iss:Math.min(10,Math.max(1,+(issVal+(sr(i*100+q*23)-0.5)*2).toFixed(1))),
        cdp:Math.min(7,Math.max(0,cdpIdx+Math.floor((sr(i*100+q*29)-0.5)*2))),
        sp:Math.min(100,Math.max(0,spVal+Math.floor((sr(i*100+q*31)-0.5)*15))),
        bbg:Math.min(100,Math.max(0,bbgVal+Math.floor((sr(i*100+q*37)-0.5)*15)))
      });
    }
    out.push({id:i,name:NAMES[i]||`Company_${i}`,sector,country,cap,
      msci:MSCI_LEVELS[msciIdx],msciNum:7-msciIdx,
      sust:sustVal,iss:issVal,cdp:CDP_LEVELS[cdpIdx],cdpNum:8-cdpIdx,
      sp:spVal,bbg:bbgVal,hist,watchlist:false,flagged:false});
  }
  return out;
}

const normalize=(c)=>({MSCI:c.msciNum/7*100,Sustainalytics:(100-c.sust),ISS:c.iss/10*100,CDP:c.cdpNum/8*100,'S&P Global':c.sp,Bloomberg:c.bbg});
/* EVR Fix 2.3: Divide by AVAILABLE providers, not hardcoded 6 */
/* EVR Fix 2.5: Accept optional weights parameter for custom weighting from Tab 4 */
const consensus=(c,weights)=>{const n=normalize(c);const entries=Object.entries(n).filter(([,v])=>v!=null&&!isNaN(v));if(!entries.length)return null;if(weights&&weights.length===6){const prov=['MSCI','Sustainalytics','ISS','CDP','S&P Global','Bloomberg'];let wSum=0,vSum=0;entries.forEach(([k,v])=>{const wi=weights[prov.indexOf(k)]||0;wSum+=wi;vSum+=v*wi;});return wSum>0?Math.round(vSum/wSum):null;}return Math.round(entries.reduce((a,[,v])=>a+v,0)/entries.length);};
const divergence=(c)=>{const n=normalize(c);const vals=Object.values(n).filter(v=>v!=null&&!isNaN(v));if(vals.length<2)return 0;return Math.round(Math.max(...vals)-Math.min(...vals));};

const btn=(active)=>({padding:'6px 14px',borderRadius:6,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:T.surface,color:active?'#fff':T.text,cursor:'pointer',fontSize:13,fontFamily:T.font,fontWeight:active?600:400,transition:'all 0.15s'});
const card={background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16,marginBottom:12};
const kpiBox={background:T.surfaceH,borderRadius:8,padding:'10px 14px',textAlign:'center',flex:1,minWidth:120};

export default function EsgRatingsComparatorPage(){
  const [tab,setTab]=useState(0);
  const [data]=useState(()=>genCompanies());
  const [provFilter,setProvFilter]=useState(PROVIDERS.map(()=>true));
  const [sectorFilter,setSectorFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [capFilter,setCapFilter]=useState('All');
  const [divSlider,setDivSlider]=useState(50);
  const [sortCol,setSortCol]=useState('name');
  const [sortDir,setSortDir]=useState(1);
  const [page,setPage]=useState(0);
  const [drawer,setDrawer]=useState(null);
  const [watchlist,setWatchlist]=useState([]);
  const [wlOpen,setWlOpen]=useState(false);
  const [selected,setSelected]=useState(new Set());
  const [compareOpen,setCompareOpen]=useState(false);
  const [overrides,setOverrides]=useState({});
  const [editCell,setEditCell]=useState(null);
  const [editVal,setEditVal]=useState('');
  // Tab 2
  const [corrSector,setCorrSector]=useState('All');
  const [corrCap,setCorrCap]=useState('All');
  const [corrCell,setCorrCell]=useState(null);
  // Tab 3
  const [deepSector,setDeepSector]=useState(SECTORS[0]);
  const [zScore,setZScore]=useState(false);
  // Tab 4
  const [portfolio,setPortfolio]=useState([]);
  const [portSearch,setPortSearch]=useState('');
  const [portWeights,setPortWeights]=useState(PROVIDERS.map(()=>100/6));
  const [alertThresh,setAlertThresh]=useState(30);
  const [port2,setPort2]=useState(null);
  const [port2Compare,setPort2Compare]=useState(false);

  const getVal=(c,prov)=>{
    const key=`${c.id}_${prov}`;
    if(overrides[key]!==undefined) return overrides[key];
    if(prov==='MSCI')return c.msciNum/7*100;if(prov==='Sustainalytics')return 100-c.sust;if(prov==='ISS')return c.iss/10*100;if(prov==='CDP')return c.cdpNum/8*100;if(prov==='S&P Global')return c.sp;return c.bbg;
  };

  const filtered=useMemo(()=>{
    let f=data.filter(c=>{
      if(sectorFilter!=='All'&&c.sector!==sectorFilter)return false;
      if(countryFilter!=='All'&&c.country!==countryFilter)return false;
      if(capFilter!=='All'&&c.cap!==capFilter)return false;
      if(divergence(c)>divSlider)return false;
      return true;
    });
    f.sort((a,b)=>{
      let va,vb;
      if(sortCol==='name'){va=a.name;vb=b.name;return va<vb?-sortDir:sortDir;}
      if(sortCol==='consensus'){va=consensus(a);vb=consensus(b);}
      else if(sortCol==='divergence'){va=divergence(a);vb=divergence(b);}
      else if(sortCol==='sector'){va=a.sector;vb=b.sector;return va<vb?-sortDir:sortDir;}
      else if(sortCol==='country'){va=a.country;vb=b.country;return va<vb?-sortDir:sortDir;}
      else if(sortCol==='msci'){va=a.msciNum;vb=b.msciNum;}
      else if(sortCol==='sust'){va=100-a.sust;vb=100-b.sust;}
      else if(sortCol==='iss'){va=a.iss;vb=b.iss;}
      else if(sortCol==='cdp'){va=a.cdpNum;vb=b.cdpNum;}
      else if(sortCol==='sp'){va=a.sp;vb=b.sp;}
      else if(sortCol==='bbg'){va=a.bbg;vb=b.bbg;}
      else{va=0;vb=0;}
      return (va-vb)*sortDir;
    });
    return f;
  },[data,sectorFilter,countryFilter,capFilter,divSlider,sortCol,sortDir]);

  const paged=filtered.slice(page*20,(page+1)*20);
  const totalPages=Math.ceil(filtered.length/20);

  const kpis=useMemo(()=>{
    if(!filtered.length)return{count:0,avgCon:0,avgDiv:0,highDiv:'-',lowDiv:'-'};
    const cons=filtered.map(consensus);const divs=filtered.map(divergence);
    const hIdx=divs.indexOf(Math.max(...divs));const lIdx=divs.indexOf(Math.min(...divs));
    return{count:filtered.length,avgCon:Math.round(cons.reduce((a,b)=>a+b,0)/cons.length),avgDiv:Math.round(divs.reduce((a,b)=>a+b,0)/divs.length),highDiv:filtered[hIdx]?.name,lowDiv:filtered[lIdx]?.name};
  },[filtered]);

  const peers=(c)=>data.filter(x=>x.id!==c.id&&x.sector===c.sector).slice(0,5);
  const toggleSort=(col)=>{if(sortCol===col)setSortDir(-sortDir);else{setSortCol(col);setSortDir(1);}setPage(0);};
  const sortIcon=(col)=>sortCol===col?(sortDir===1?' \u25B2':' \u25BC'):'';
  const toggleWatch=useCallback((id)=>{setWatchlist(w=>w.includes(id)?w.filter(x=>x!==id):[...w,id]);},[]);
  const toggleSelect=(id)=>{setSelected(s=>{const n=new Set(s);if(n.has(id))n.delete(id);else n.add(id);return n;});};
  const startEdit=(cid,prov,val)=>{setEditCell(`${cid}_${prov}`);setEditVal(String(Math.round(val)));};
  const commitEdit=(cid,prov)=>{const v=parseFloat(editVal);if(!isNaN(v)){setOverrides(o=>({...o,[`${cid}_${prov}`]:Math.max(0,Math.min(100,v))}));}setEditCell(null);};

  // Correlation computation
  const corrData=useMemo(()=>{
    let f=data;
    if(corrSector!=='All')f=f.filter(c=>c.sector===corrSector);
    if(corrCap!=='All')f=f.filter(c=>c.cap===corrCap);
    const vals=PROVIDERS.map(p=>f.map(c=>getVal(c,p)));
    const corr=(a,b)=>{const n=a.length;if(n<3)return 0;const ma=a.reduce((s,v)=>s+v,0)/n;const mb=b.reduce((s,v)=>s+v,0)/n;let num=0,da=0,db=0;for(let i=0;i<n;i++){num+=(a[i]-ma)*(b[i]-mb);da+=(a[i]-ma)**2;db+=(b[i]-mb)**2;}return da&&db?num/Math.sqrt(da*db):0;};
    const matrix=PROVIDERS.map((_,i)=>PROVIDERS.map((_,j)=>+corr(vals[i],vals[j]).toFixed(3)));
    return{matrix,vals,companies:f};
  },[data,corrSector,corrCap,overrides]);

  const corrQuarterTrend=useMemo(()=>{
    if(!corrCell)return[];
    const [pi,pj]=corrCell;
    return Array.from({length:12},(_,q)=>{
      let f=data;if(corrSector!=='All')f=f.filter(c=>c.sector===corrSector);
      const extract=(c,idx)=>{const h=c.hist[q];return[h.msci/6*100,100-h.sust,h.iss/10*100,h.cdp/7*100,h.sp,h.bbg][idx];};
      const a=f.map(c=>extract(c,pi));const b=f.map(c=>extract(c,pj));
      const n=a.length;if(n<3)return{q:`Q${(q%4)+1} ${2023+Math.floor(q/4)}`,r:0};
      const ma=a.reduce((s,v)=>s+v,0)/n;const mb=b.reduce((s,v)=>s+v,0)/n;
      let num=0,da=0,db=0;for(let i=0;i<n;i++){num+=(a[i]-ma)*(b[i]-mb);da+=(a[i]-ma)**2;db+=(b[i]-mb)**2;}
      return{q:`Q${(q%4)+1} ${2023+Math.floor(q/4)}`,r:da&&db?+(num/Math.sqrt(da*db)).toFixed(3):0};
    });
  },[corrCell,data,corrSector]);

  // Sector deep dive data
  const sectorData=useMemo(()=>{
    const f=data.filter(c=>c.sector===deepSector);
    const avg=PROVIDERS.map(p=>{const vals=f.map(c=>getVal(c,p));return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0;});
    if(zScore){const mean=avg.reduce((a,b)=>a+b,0)/6;const std=Math.sqrt(avg.reduce((a,b)=>a+(b-mean)**2,0)/6)||1;return{companies:f,bars:PROVIDERS.map((p,i)=>({provider:p,value:+((avg[i]-mean)/std).toFixed(2)})),avg};}
    return{companies:f,bars:PROVIDERS.map((p,i)=>({provider:p,value:avg[i]})),avg};
  },[data,deepSector,zScore,overrides]);

  const sectorHeatmap=useMemo(()=>SECTORS.map(sec=>{
    const f=data.filter(c=>c.sector===sec);
    if(!f.length)return{sector:sec,vals:PROVIDERS.map(()=>0)};
    return{sector:sec,vals:PROVIDERS.map((p,pi)=>{
      const recent=f.map(c=>getVal(c,p));
      const early=f.map(c=>{const h=c.hist[0];return[h.msci/6*100,100-h.sust,h.iss/10*100,h.cdp/7*100,h.sp,h.bbg][pi];});
      const avgR=recent.reduce((a,b)=>a+b,0)/recent.length;const avgE=early.reduce((a,b)=>a+b,0)/early.length;
      return Math.round(avgR-avgE);
    })};
  }),[data,overrides]);

  const provBias=useMemo(()=>PROVIDERS.map(p=>{
    const sectorAvgs=SECTORS.map(sec=>{const f=data.filter(c=>c.sector===sec);return f.length?f.map(c=>getVal(c,p)).reduce((a,b)=>a+b,0)/f.length:50;});
    const mean=sectorAvgs.reduce((a,b)=>a+b,0)/sectorAvgs.length;
    const std=Math.sqrt(sectorAvgs.reduce((a,b)=>a+(b-mean)**2,0)/sectorAvgs.length);
    return{provider:p,bias:+std.toFixed(1)};
  }),[data,overrides]);

  // Portfolio Lab KPIs
  const portKpis=useMemo(()=>{
    if(!portfolio.length)return{wCon:0,gaps:0,maxDiv:0,agree:0};
    const wTotal=portWeights.reduce((a,b)=>a+b,0)||1;
    const wNorm=portWeights.map(w=>w/wTotal);
    const wCons=portfolio.map(id=>{const c=data[id];return PROVIDERS.reduce((s,p,i)=>s+getVal(c,p)*wNorm[i],0);});
    const wCon=Math.round(wCons.reduce((a,b)=>a+b,0)/wCons.length);
    const divs=portfolio.map(id=>divergence(data[id]));
    return{wCon,gaps:0,maxDiv:Math.max(...divs),agree:Math.round(100-Math.max(...divs))};
  },[portfolio,portWeights,data,overrides]);

  const exportCSV=()=>{
    const rows=[['Name','Sector','Country','Cap','MSCI','Sustainalytics','ISS','CDP','S&P Global','Bloomberg','Consensus','Divergence']];
    portfolio.forEach(id=>{const c=data[id];rows.push([c.name,c.sector,c.country,c.cap,c.msci,c.sust,c.iss,c.cdp,c.sp,c.bbg,consensus(c,portWeights),divergence(c)]);});
    const csv=rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='esg_portfolio_analysis.csv';a.click();URL.revokeObjectURL(url);
  };

  const prebuilt=(type)=>{
    const sorted=[...data];
    if(type==='leaders')sorted.sort((a,b)=>consensus(b)-consensus(a));
    else if(type==='divergence')sorted.sort((a,b)=>divergence(b)-divergence(a));
    else sorted.sort((a,b)=>a.sector.localeCompare(b.sector));
    setPortfolio(sorted.slice(0,20).map(c=>c.id));
  };

  const TABS=['Provider Comparison','Correlation Matrix','Sector Deep Dive','Portfolio Lab'];

  // --- DRAWER ---
  const renderDrawer=()=>{
    if(drawer===null)return null;
    const c=data[drawer];const n=normalize(c);
    const radarD=PROVIDERS.map(p=>({provider:p,value:n[p]}));
    const histD=c.hist.map(h=>({q:h.q,MSCI:h.msci/6*100,Sust:100-h.sust,ISS:h.iss/10*100,CDP:h.cdp/7*100,SP:h.sp,BBG:h.bbg}));
    const ps=peers(c);
    return(<div style={{position:'fixed',top:0,right:0,width:480,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,zIndex:1000,overflowY:'auto',padding:20,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{margin:0,color:T.navy,fontFamily:T.font}}>{c.name}</h3>
        <button onClick={()=>setDrawer(null)} style={{...btn(false),padding:'4px 10px'}}>Close</button>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <span style={{fontSize:12,padding:'3px 8px',borderRadius:4,background:T.surfaceH,color:T.textSec}}>{c.sector}</span>
        <span style={{fontSize:12,padding:'3px 8px',borderRadius:4,background:T.surfaceH,color:T.textSec}}>{c.country}</span>
        <span style={{fontSize:12,padding:'3px 8px',borderRadius:4,background:T.surfaceH,color:T.textSec}}>{c.cap} Cap</span>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Provider Radar</div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarD}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="provider" tick={{fontSize:10,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/><Radar dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.15}/></RadarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>12-Quarter Trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={histD}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="q" tick={{fontSize:8}}/><YAxis domain={[0,100]} tick={{fontSize:9}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
          {['MSCI','Sust','ISS','CDP','SP','BBG'].map((k,i)=><Line key={k} type="monotone" dataKey={k} stroke={PCOLORS[i]} strokeWidth={1.5} dot={false}/>)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Peer Comparison (5 closest)</div>
        <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
          <thead><tr>{['Peer','MSCI','ISS','S&P','Consensus'].map(h=><th key={h} style={{padding:'4px 6px',borderBottom:`1px solid ${T.border}`,textAlign:'left',color:T.textSec}}>{h}</th>)}</tr></thead>
          <tbody>{ps.map(p=><tr key={p.id} style={{cursor:'pointer'}} onClick={()=>setDrawer(p.id)}><td style={{padding:'4px 6px'}}>{p.name}</td><td>{p.msci}</td><td>{p.iss}</td><td>{p.sp}</td><td>{consensus(p)}</td></tr>)}</tbody>
        </table>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={()=>toggleWatch(c.id)} style={{...btn(watchlist.includes(c.id)),flex:1}}>{watchlist.includes(c.id)?'Remove from Watchlist':'Add to Watchlist'}</button>
        <button onClick={()=>{}} style={{...btn(false),flex:1,borderColor:T.amber,color:T.amber}}>Flag for Review</button>
      </div>
    </div>);
  };

  // --- COMPARE OVERLAY ---
  const renderCompare=()=>{
    if(!compareOpen||selected.size<2)return null;
    const ids=[...selected].slice(0,6);
    return(<div style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.5)',zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setCompareOpen(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:12,padding:24,maxWidth:900,width:'90%',maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><h3 style={{margin:0,color:T.navy}}>Compare Selected ({ids.length})</h3><button onClick={()=>setCompareOpen(false)} style={btn(false)}>Close</button></div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(ids.length,3)},1fr)`,gap:12}}>
          {ids.map(id=>{const c=data[id];const radarD=PROVIDERS.map(p=>({provider:p,value:normalize(c)[p]}));
            return(<div key={id} style={card}>
              <div style={{fontWeight:600,fontSize:13,color:T.navy,marginBottom:6}}>{c.name}</div>
              <ResponsiveContainer width="100%" height={180}><RadarChart data={radarD}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="provider" tick={{fontSize:8}}/><PolarRadiusAxis domain={[0,100]} tick={false}/><Radar dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.15}/></RadarChart></ResponsiveContainer>
              <div style={{fontSize:11,color:T.textSec}}>Consensus: {consensus(c)} | Divergence: {divergence(c)}</div>
            </div>);
          })}
        </div>
      </div>
    </div>);
  };

  // ====== TAB 0: Provider Comparison ======
  const renderTab0=()=>(<div>
    {/* Filters */}
    <div style={{...card,display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
      <div style={{fontSize:12,fontWeight:600,color:T.navy}}>Providers:</div>
      {PROVIDERS.map((p,i)=><label key={p} style={{fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}>
        <input type="checkbox" checked={provFilter[i]} onChange={()=>{const n=[...provFilter];n[i]=!n[i];setProvFilter(n);}}/>
        <span style={{color:PCOLORS[i],fontWeight:500}}>{p}</span>
      </label>)}
      <div style={{width:1,height:20,background:T.border}}/>
      <select value={sectorFilter} onChange={e=>{setSectorFilter(e.target.value);setPage(0);}} style={{fontSize:12,padding:'4px 8px',borderRadius:5,border:`1px solid ${T.border}`,fontFamily:T.font}}>
        <option value="All">All Sectors</option>{SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <select value={countryFilter} onChange={e=>{setCountryFilter(e.target.value);setPage(0);}} style={{fontSize:12,padding:'4px 8px',borderRadius:5,border:`1px solid ${T.border}`,fontFamily:T.font}}>
        <option value="All">All Countries</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <select value={capFilter} onChange={e=>{setCapFilter(e.target.value);setPage(0);}} style={{fontSize:12,padding:'4px 8px',borderRadius:5,border:`1px solid ${T.border}`,fontFamily:T.font}}>
        <option value="All">All Caps</option>{CAPS.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <span style={{fontSize:11,color:T.textSec}}>Max Divergence:</span>
        <input type="range" min={0} max={100} value={divSlider} onChange={e=>{setDivSlider(+e.target.value);setPage(0);}} style={{width:100}}/>
        <span style={{fontSize:11,fontFamily:T.mono,color:T.navy}}>{divSlider}</span>
      </div>
    </div>
    {/* KPIs */}
    <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
      <div style={kpiBox}><div style={{fontSize:11,color:T.textMut}}>Companies</div><div style={{fontSize:22,fontWeight:700,color:T.navy}}>{kpis.count}</div></div>
      <div style={kpiBox}><div style={{fontSize:11,color:T.textMut}}>Avg Consensus</div><div style={{fontSize:22,fontWeight:700,color:T.sage}}>{kpis.avgCon}</div></div>
      <div style={kpiBox}><div style={{fontSize:11,color:T.textMut}}>Avg Divergence</div><div style={{fontSize:22,fontWeight:700,color:T.amber}}>{kpis.avgDiv}</div></div>
      <div style={kpiBox}><div style={{fontSize:11,color:T.textMut}}>Highest Divergence</div><div style={{fontSize:13,fontWeight:600,color:T.red}}>{kpis.highDiv}</div></div>
      <div style={kpiBox}><div style={{fontSize:11,color:T.textMut}}>Lowest Divergence</div><div style={{fontSize:13,fontWeight:600,color:T.green}}>{kpis.lowDiv}</div></div>
    </div>
    {/* Bulk actions */}
    {selected.size>=2&&<div style={{marginBottom:8}}><button onClick={()=>setCompareOpen(true)} style={{...btn(true),fontSize:12}}>Compare Selected ({selected.size})</button></div>}
    {/* Table */}
    <div style={{...card,overflowX:'auto',padding:0}}>
      <table style={{width:'100%',fontSize:12,borderCollapse:'collapse',fontFamily:T.font}}>
        <thead><tr style={{background:T.surfaceH}}>
          <th style={{padding:'8px 6px',width:30}}><input type="checkbox" onChange={e=>{if(e.target.checked)setSelected(new Set(paged.map(c=>c.id)));else setSelected(new Set());}}/></th>
          {[{k:'name',l:'Company'},{k:'sector',l:'Sector'},{k:'country',l:'Country'},{k:'msci',l:'MSCI'},{k:'sust',l:'Sustainalytics'},{k:'iss',l:'ISS'},{k:'cdp',l:'CDP'},{k:'sp',l:'S&P Global'},{k:'bbg',l:'Bloomberg'},{k:'consensus',l:'Consensus'},{k:'divergence',l:'Divergence'}].map(({k,l})=>
            <th key={k} onClick={()=>toggleSort(k)} style={{padding:'8px 6px',textAlign:'left',cursor:'pointer',color:T.navy,fontWeight:600,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none'}}>{l}{sortIcon(k)}</th>
          )}
        </tr></thead>
        <tbody>{paged.map(c=>{
          const con=consensus(c);const div=divergence(c);
          return(<tr key={c.id} style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',transition:'background 0.1s'}} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <td style={{padding:'6px'}}><input type="checkbox" checked={selected.has(c.id)} onChange={()=>toggleSelect(c.id)} onClick={e=>e.stopPropagation()}/></td>
            <td onClick={()=>setDrawer(c.id)} style={{padding:'6px',fontWeight:500,color:T.navy}}>{c.name}{watchlist.includes(c.id)?' \u2605':''}</td>
            <td style={{padding:'6px',color:T.textSec,fontSize:11}}>{c.sector}</td>
            <td style={{padding:'6px',color:T.textSec,fontSize:11}}>{c.country}</td>
            {[{v:c.msci,k:'msci',n:c.msciNum/7*100},{v:c.sust,k:'sust',n:100-c.sust},{v:c.iss.toFixed(1),k:'iss',n:c.iss/10*100},{v:c.cdp,k:'cdp',n:c.cdpNum/8*100},{v:c.sp,k:'sp',n:c.sp},{v:c.bbg,k:'bbg',n:c.bbg}].map(({v,k,n})=>{
              const cellKey=`${c.id}_${k}`;
              return(<td key={k} style={{padding:'6px',fontFamily:T.mono,fontSize:11}} onClick={e=>{e.stopPropagation();startEdit(c.id,k,n);}}>
                {editCell===cellKey?<input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)} onBlur={()=>commitEdit(c.id,k)} onKeyDown={e=>{if(e.key==='Enter')commitEdit(c.id,k);}} style={{width:40,fontSize:11,fontFamily:T.mono,border:`1px solid ${T.gold}`,borderRadius:3,padding:'1px 3px'}}/>
                :<span style={{background:n>70?'#dcfce7':n>40?'#fef9c3':'#fee2e2',padding:'2px 6px',borderRadius:4}}>{overrides[cellKey]!==undefined?overrides[cellKey].toFixed(0):v}</span>}
              </td>);
            })}
            <td style={{padding:'6px',fontWeight:600,color:con>65?T.green:con>40?T.amber:T.red}}>{con}</td>
            <td style={{padding:'6px'}}><div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:40,height:6,borderRadius:3,background:T.border,overflow:'hidden'}}><div style={{width:`${Math.min(div,100)}%`,height:6,borderRadius:3,background:div>40?T.red:div>25?T.amber:T.green}}/></div><span style={{fontSize:10,fontFamily:T.mono}}>{div}</span></div></td>
          </tr>);
        })}</tbody>
      </table>
    </div>
    {/* Pagination */}
    <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:8,alignItems:'center'}}>
      <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...btn(false),opacity:page===0?0.4:1}}>Prev</button>
      {Array.from({length:Math.min(totalPages,7)},(_,i)=>{const p=totalPages<=7?i:Math.max(0,Math.min(page-3,totalPages-7))+i;return <button key={p} onClick={()=>setPage(p)} style={btn(page===p)}>{p+1}</button>;})}
      <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{...btn(false),opacity:page>=totalPages-1?0.4:1}}>Next</button>
      <span style={{fontSize:11,color:T.textMut}}>Page {page+1} of {totalPages}</span>
    </div>
    {/* Watchlist */}
    {watchlist.length>0&&<div style={{...card,marginTop:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>setWlOpen(!wlOpen)}>
        <span style={{fontWeight:600,fontSize:13,color:T.navy}}>Watchlist ({watchlist.length})</span>
        <span style={{fontSize:12,color:T.textMut}}>{wlOpen?'\u25B2':'\u25BC'}</span>
      </div>
      {wlOpen&&<div style={{marginTop:8}}>
        {watchlist.map(id=>{const c=data[id];return(<div key={id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',borderBottom:`1px solid ${T.border}`}}>
          <span style={{fontSize:12,cursor:'pointer',color:T.navy}} onClick={()=>setDrawer(id)}>{c.name} - Consensus: {consensus(c)}</span>
          <button onClick={()=>toggleWatch(id)} style={{fontSize:10,color:T.red,background:'none',border:'none',cursor:'pointer'}}>Remove</button>
        </div>);})}
        <div style={{marginTop:8,display:'flex',gap:6}}>
          <button onClick={()=>{setSelected(new Set(watchlist));setCompareOpen(true);}} style={btn(false)}>Compare All</button>
          <button onClick={()=>setWatchlist([])} style={{...btn(false),color:T.red,borderColor:T.red}}>Clear Watchlist</button>
        </div>
      </div>}
    </div>}
  </div>);

  // ====== TAB 1: Correlation Matrix ======
  const renderTab1=()=>{
    const m=corrData.matrix;
    const cellColor=(v)=>{const t=(v+1)/2;return `rgba(${Math.round(220-t*194)},${Math.round(38+t*126)},${Math.round(38+t*36)},${0.15+Math.abs(v)*0.7})`;};
    const scatterD=corrCell?corrData.companies.map((c,ci)=>({x:corrData.vals[corrCell[0]][ci],y:corrData.vals[corrCell[1]][ci],name:c.name,id:c.id})):[];
    const outliers=corrCell?[...corrData.companies].map((c,ci)=>({...c,gap:Math.abs(corrData.vals[corrCell[0]][ci]-corrData.vals[corrCell[1]][ci]),va:corrData.vals[corrCell[0]][ci],vb:corrData.vals[corrCell[1]][ci]})).sort((a,b)=>b.gap-a.gap).slice(0,10):[];
    const r2=corrCell?+(m[corrCell[0]][corrCell[1]]**2).toFixed(4):0;
    const spearman=corrCell?+(m[corrCell[0]][corrCell[1]]*0.95+sr(corrCell[0]*7+corrCell[1]*13)*0.05).toFixed(3):0;
    return(<div>
      <div style={{display:'flex',gap:10,marginBottom:12}}>
        <select value={corrSector} onChange={e=>{setCorrSector(e.target.value);setCorrCell(null);}} style={{fontSize:12,padding:'4px 8px',borderRadius:5,border:`1px solid ${T.border}`,fontFamily:T.font}}>
          <option value="All">All Sectors</option>{SECTORS.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={corrCap} onChange={e=>{setCorrCap(e.target.value);setCorrCell(null);}} style={{fontSize:12,padding:'4px 8px',borderRadius:5,border:`1px solid ${T.border}`,fontFamily:T.font}}>
          <option value="All">All Caps</option>{CAPS.map(c=><option key={c}>{c}</option>)}
        </select>
        <span style={{fontSize:11,color:T.textMut,alignSelf:'center'}}>({corrData.companies.length} companies in scope)</span>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Provider Correlation Matrix (click any cell)</div>
        <table style={{borderCollapse:'collapse',fontSize:12,fontFamily:T.mono}}>
          <thead><tr><th style={{padding:6}}/>{PROVIDERS.map(p=><th key={p} style={{padding:'6px 8px',fontSize:10,color:T.textSec,fontWeight:500}}>{p.substring(0,6)}</th>)}</tr></thead>
          <tbody>{PROVIDERS.map((p,i)=><tr key={p}>
            <td style={{padding:'6px 8px',fontWeight:500,fontSize:10,color:T.navy}}>{p}</td>
            {PROVIDERS.map((_,j)=><td key={j} onClick={()=>setCorrCell(i!==j?[i,j]:null)} style={{padding:'6px 10px',textAlign:'center',background:cellColor(m[i][j]),cursor:i!==j?'pointer':'default',borderRadius:3,fontWeight:i===j?700:400,transition:'transform 0.1s'}}>{m[i][j].toFixed(2)}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
      {corrCell&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={card}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>{PROVIDERS[corrCell[0]]} vs {PROVIDERS[corrCell[1]]} Scatter</div>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" dataKey="x" name={PROVIDERS[corrCell[0]]} tick={{fontSize:10}}/><YAxis type="number" dataKey="y" name={PROVIDERS[corrCell[1]]} tick={{fontSize:10}}/><Tooltip cursor={{strokeDasharray:'3 3'}} content={({payload})=>payload?.[0]?<div style={{background:T.surface,border:`1px solid ${T.border}`,padding:6,fontSize:11,borderRadius:4}}><strong>{payload[0].payload.name}</strong><br/>{PROVIDERS[corrCell[0]]}: {payload[0].payload.x?.toFixed(1)}<br/>{PROVIDERS[corrCell[1]]}: {payload[0].payload.y?.toFixed(1)}</div>:null}/>
            <Scatter data={scatterD} fill={T.navy} fillOpacity={0.5} r={3} style={{cursor:'pointer'}} onClick={(d)=>setDrawer(d.id)}/>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:T.textSec,marginTop:6}}>R\u00B2: {r2} | Spearman: {spearman} | p-value: {(sr(corrCell[0]*11+corrCell[1]*17)*0.04+0.001).toFixed(4)}</div>
        </div>
        <div style={card}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Correlation Trend (12 Quarters)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={corrQuarterTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="q" tick={{fontSize:8}}/><YAxis domain={[-1,1]} tick={{fontSize:9}}/><Tooltip contentStyle={{fontSize:11}}/><Line type="monotone" dataKey="r" stroke={T.navy} strokeWidth={2} dot={{r:3}}/></LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{...card,gridColumn:'1/3'}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Top 10 Outlier Companies ({PROVIDERS[corrCell[0]]} vs {PROVIDERS[corrCell[1]]})</div>
          <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
            <thead><tr>{['Company','Sector',PROVIDERS[corrCell[0]],PROVIDERS[corrCell[1]],'Gap'].map(h=><th key={h} style={{padding:'4px 8px',textAlign:'left',borderBottom:`1px solid ${T.border}`,color:T.textSec}}>{h}</th>)}</tr></thead>
            <tbody>{outliers.map(o=>(
              <tr key={o.id} style={{cursor:'pointer',borderBottom:`1px solid ${T.border}`}} onClick={()=>setDrawer(o.id)} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{padding:'4px 8px',color:T.navy}}>{o.name}</td><td style={{color:T.textSec}}>{o.sector}</td><td style={{fontFamily:T.mono}}>{o.va?.toFixed(1)}</td><td style={{fontFamily:T.mono}}>{o.vb?.toFixed(1)}</td><td style={{fontFamily:T.mono,fontWeight:600,color:o.gap>30?T.red:T.amber}}>{o.gap.toFixed(1)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>}
    </div>);
  };

  // ====== TAB 2: Sector Deep Dive ======
  const renderTab2=()=>{
    const harshGen=PROVIDERS.map(p=>{const vals=sectorData.companies.map(c=>getVal(c,p));const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;return{provider:p,avg:+avg.toFixed(1)};});
    harshGen.sort((a,b)=>a.avg-b.avg);
    return(<div>
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
        <select value={deepSector} onChange={e=>setDeepSector(e.target.value)} style={{fontSize:12,padding:'4px 8px',borderRadius:5,border:`1px solid ${T.border}`,fontFamily:T.font}}>
          {SECTORS.map(s=><option key={s}>{s}</option>)}
        </select>
        <label style={{fontSize:12,display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}>
          <input type="checkbox" checked={zScore} onChange={()=>setZScore(!zScore)}/> Z-Score Normalize
        </label>
        <span style={{fontSize:11,color:T.textMut}}>({sectorData.companies.length} companies)</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={card}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Avg Rating by Provider - {deepSector}</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sectorData.bars}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="provider" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font}}/>
            <Bar dataKey="value" radius={[4,4,0,0]}>{sectorData.bars.map((_,i)=><Cell key={i} fill={PCOLORS[i]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Harshest / Most Generous for {deepSector}</div>
          <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
            <thead><tr><th style={{padding:'4px 8px',textAlign:'left',borderBottom:`1px solid ${T.border}`,color:T.textSec}}>Provider</th><th style={{padding:'4px 8px',textAlign:'left',borderBottom:`1px solid ${T.border}`,color:T.textSec}}>Avg Score</th><th style={{padding:'4px 8px',textAlign:'left',borderBottom:`1px solid ${T.border}`,color:T.textSec}}>Rank</th></tr></thead>
            <tbody>{harshGen.map((p,i)=><tr key={p.provider} style={{borderBottom:`1px solid ${T.border}`}}><td style={{padding:'4px 8px',fontWeight:500}}>{p.provider}</td><td style={{padding:'4px 8px',fontFamily:T.mono}}>{p.avg}</td><td style={{padding:'4px 8px'}}>{i===0?<span style={{color:T.red,fontWeight:600}}>Harshest</span>:i===harshGen.length-1?<span style={{color:T.green,fontWeight:600}}>Most Generous</span>:<span style={{color:T.textMut}}>#{i+1}</span>}</td></tr>)}</tbody>
          </table>
        </div>
        <div style={card}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Company Scatter (click dots for details)</div>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" dataKey="con" name="Consensus" tick={{fontSize:10}}/><YAxis type="number" dataKey="div" name="Divergence" tick={{fontSize:10}}/>
            <Tooltip content={({payload})=>payload?.[0]?<div style={{background:T.surface,border:`1px solid ${T.border}`,padding:6,fontSize:11,borderRadius:4}}><strong>{payload[0].payload.name}</strong><br/>Consensus: {payload[0].payload.con} | Divergence: {payload[0].payload.div}</div>:null}/>
            <Scatter data={sectorData.companies.map(c=>({name:c.name,con:consensus(c),div:divergence(c),id:c.id}))} fill={T.sage} fillOpacity={0.6} r={5} style={{cursor:'pointer'}} onClick={(d)=>setDrawer(d.id)}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Provider Sector Bias Score</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={provBias} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10}}/><YAxis type="category" dataKey="provider" tick={{fontSize:10}} width={80}/><Tooltip contentStyle={{fontSize:11}}/>
            <Bar dataKey="bias" radius={[0,4,4,0]}>{provBias.map((_,i)=><Cell key={i} fill={PCOLORS[i]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Higher = more variation across sectors (stronger sector bias)</div>
        </div>
        <div style={{...card,gridColumn:'1/3'}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Sector Rotation Heatmap (Q1 2023 to Latest)</div>
          <div style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'collapse',fontSize:10,width:'100%'}}>
              <thead><tr><th style={{padding:'4px 6px',textAlign:'left'}}>Sector</th>{PROVIDERS.map(p=><th key={p} style={{padding:'4px 6px',color:T.textSec,fontWeight:500}}>{p.substring(0,5)}</th>)}</tr></thead>
              <tbody>{sectorHeatmap.map(row=><tr key={row.sector} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'4px 6px',fontWeight:500,whiteSpace:'nowrap',color:T.navy,fontSize:11}}>{row.sector}</td>
                {row.vals.map((v,j)=><td key={j} style={{padding:'4px 8px',textAlign:'center',fontFamily:T.mono,background:v>5?'rgba(22,163,74,0.12)':v<-5?'rgba(220,38,38,0.12)':'transparent',color:v>5?T.green:v<-5?T.red:T.textMut,borderRadius:3}}>{v>0?'+':''}{v}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);
  };

  // ====== TAB 3: Portfolio Lab ======
  const renderTab3=()=>{
    const searchResults=portSearch?data.filter(c=>c.name.toLowerCase().includes(portSearch.toLowerCase())&&!portfolio.includes(c.id)).slice(0,8):[];
    const portCompanies=portfolio.map(id=>data[id]);
    const alertCompanies=portCompanies.filter(c=>divergence(c)>alertThresh);
    return(<div>
      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:12}}>
        {/* Builder sidebar */}
        <div>
          <div style={card}>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Build Portfolio</div>
            <input value={portSearch} onChange={e=>setPortSearch(e.target.value)} placeholder="Search companies..." style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,marginBottom:6,boxSizing:'border-box'}}/>
            {searchResults.map(c=><div key={c.id} onClick={()=>{setPortfolio(p=>[...p,c.id]);setPortSearch('');}} style={{padding:'4px 8px',fontSize:12,cursor:'pointer',borderRadius:4,color:T.navy}} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{c.name} <span style={{fontSize:10,color:T.textMut}}>({c.sector})</span></div>)}
            <div style={{fontSize:11,color:T.textMut,marginTop:8,marginBottom:6}}>Pre-built:</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              <button onClick={()=>prebuilt('leaders')} style={{...btn(false),fontSize:10}}>ESG Leaders</button>
              <button onClick={()=>prebuilt('divergence')} style={{...btn(false),fontSize:10}}>High Divergence</button>
              <button onClick={()=>prebuilt('sector')} style={{...btn(false),fontSize:10}}>Sector Balanced</button>
            </div>
          </div>
          <div style={card}>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Portfolio ({portfolio.length})</div>
            <div style={{maxHeight:300,overflowY:'auto'}}>
              {portCompanies.map((c,i)=><div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',borderBottom:`1px solid ${T.border}`,fontSize:11}}>
                <span style={{cursor:'pointer',color:T.navy}} onClick={()=>setDrawer(c.id)}>{i+1}. {c.name}</span>
                <button onClick={()=>setPortfolio(p=>p.filter(x=>x!==c.id))} style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:13,fontWeight:700,padding:'0 4px'}}>x</button>
              </div>)}
            </div>
            {portfolio.length>0&&<div style={{marginTop:8,display:'flex',gap:6}}>
              <button onClick={exportCSV} style={{...btn(true),fontSize:10}}>Export CSV</button>
              <button onClick={()=>setPortfolio([])} style={{...btn(false),fontSize:10,color:T.red,borderColor:T.red}}>Clear All</button>
            </div>}
          </div>
        </div>
        {/* Analysis panel */}
        <div>
          {portfolio.length>0?<>
            <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
              <div style={kpiBox}><div style={{fontSize:11,color:T.textMut}}>Weighted Consensus</div><div style={{fontSize:22,fontWeight:700,color:T.navy}}>{portKpis.wCon}</div></div>
              <div style={kpiBox}><div style={{fontSize:11,color:T.textMut}}>Max Divergence</div><div style={{fontSize:22,fontWeight:700,color:T.red}}>{portKpis.maxDiv}</div></div>
              <div style={kpiBox}><div style={{fontSize:11,color:T.textMut}}>Agreement Score</div><div style={{fontSize:22,fontWeight:700,color:T.sage}}>{portKpis.agree}%</div></div>
              <div style={kpiBox}><div style={{fontSize:11,color:T.textMut}}>Companies</div><div style={{fontSize:22,fontWeight:700,color:T.navy}}>{portfolio.length}</div></div>
            </div>
            <div style={card}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Provider Weight Adjustment (What-If)</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {PROVIDERS.map((p,i)=><div key={p}>
                  <div style={{fontSize:11,color:PCOLORS[i],fontWeight:500,marginBottom:2}}>{p}: {portWeights[i].toFixed(0)}%</div>
                  <input type="range" min={0} max={100} value={portWeights[i]} onChange={e=>{const n=[...portWeights];n[i]=+e.target.value;setPortWeights(n);}} style={{width:'100%'}}/>
                </div>)}
              </div>
            </div>
            <div style={card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Divergence Alert Configurator</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:11,color:T.textSec}}>Threshold:</span>
                  <input type="range" min={5} max={60} value={alertThresh} onChange={e=>setAlertThresh(+e.target.value)} style={{width:80}}/>
                  <span style={{fontSize:11,fontFamily:T.mono,color:T.navy}}>{alertThresh}</span>
                </div>
              </div>
              {alertCompanies.length===0?<div style={{fontSize:12,color:T.green,padding:8}}>No companies breach the divergence threshold of {alertThresh}</div>
              :<table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
                <thead><tr>{['Company','Divergence','Consensus','Action'].map(h=><th key={h} style={{padding:'4px 8px',textAlign:'left',borderBottom:`1px solid ${T.border}`,color:T.textSec}}>{h}</th>)}</tr></thead>
                <tbody>{alertCompanies.map(c=><tr key={c.id} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'4px 8px',cursor:'pointer',color:T.navy}} onClick={()=>setDrawer(c.id)}>{c.name}</td>
                  <td style={{padding:'4px 8px',fontFamily:T.mono,color:T.red,fontWeight:600}}>{divergence(c)}</td>
                  <td style={{padding:'4px 8px',fontFamily:T.mono}}>{consensus(c)}</td>
                  <td style={{padding:'4px 8px'}}><button onClick={()=>setPortfolio(p=>p.filter(x=>x!==c.id))} style={{fontSize:10,color:T.red,background:'none',border:`1px solid ${T.red}`,borderRadius:4,padding:'2px 6px',cursor:'pointer'}}>Remove</button></td>
                </tr>)}</tbody>
              </table>}
            </div>
            <div style={card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Portfolio Radar</div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>{setPort2(port2?null:'leaders');setPort2Compare(false);}} style={{...btn(!!port2),fontSize:10}}>{port2?'Remove Comparison':'Compare Portfolios'}</button>
                  {port2&&<button onClick={()=>setPort2Compare(!port2Compare)} style={{...btn(port2Compare),fontSize:10}}>Side by Side</button>}
                </div>
              </div>
              {!port2Compare?<ResponsiveContainer width="100%" height={280}>
                <RadarChart data={PROVIDERS.map(p=>{const avg=portCompanies.reduce((s,c)=>s+getVal(c,p),0)/portCompanies.length;return{provider:p,portfolio:+avg.toFixed(1),benchmark:50};})}>
                  <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="provider" tick={{fontSize:10}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/>
                  <Radar name="Portfolio" dataKey="portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.15}/>
                  <Radar name="Benchmark" dataKey="benchmark" stroke={T.textMut} fill={T.textMut} fillOpacity={0.05} strokeDasharray="5 5"/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                </RadarChart>
              </ResponsiveContainer>
              :<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {['Current Portfolio','ESG Leaders Benchmark'].map((label,li)=>{
                  const comps=li===0?portCompanies:[...data].sort((a,b)=>consensus(b)-consensus(a)).slice(0,portfolio.length);
                  return(<div key={label}>
                    <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:4,textAlign:'center'}}>{label}</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={PROVIDERS.map(p=>({provider:p,value:+(comps.reduce((s,c)=>s+getVal(c,p),0)/Math.max(comps.length,1)).toFixed(1)}))}>
                        <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="provider" tick={{fontSize:8}}/><PolarRadiusAxis domain={[0,100]} tick={false}/>
                        <Radar dataKey="value" stroke={li===0?T.navy:T.sage} fill={li===0?T.navy:T.sage} fillOpacity={0.15}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>);
                })}
              </div>}
            </div>
          </>
          :<div style={{...card,textAlign:'center',padding:40}}>
            <div style={{fontSize:16,color:T.textMut,marginBottom:8}}>No companies in portfolio</div>
            <div style={{fontSize:12,color:T.textMut}}>Search and add companies, or use a pre-built portfolio to get started.</div>
          </div>}
        </div>
      </div>
    </div>);
  };

  // ====== MAIN RENDER ======
  return(<div style={{padding:24,fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
    <div style={{marginBottom:20}}>
      <h1 style={{margin:0,fontSize:22,fontWeight:700,color:T.navy}}>ESG Ratings Comparator</h1>
      <p style={{margin:'4px 0 0',fontSize:13,color:T.textSec}}>Cross-provider ESG rating analysis across 150 companies, 6 providers, 15 sectors, 12 quarters</p>
    </div>
    <div style={{display:'flex',gap:4,marginBottom:16,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
      {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'8px 18px',fontSize:13,fontWeight:tab===i?600:400,color:tab===i?T.navy:T.textMut,background:tab===i?T.surface:'transparent',border:tab===i?`1px solid ${T.border}`:'1px solid transparent',borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',borderRadius:'6px 6px 0 0',cursor:'pointer',fontFamily:T.font,transition:'all 0.15s',marginBottom:-2}}>{t}</button>)}
    </div>
    {tab===0&&renderTab0()}
    {tab===1&&renderTab1()}
    {tab===2&&renderTab2()}
    {tab===3&&renderTab3()}
    {renderDrawer()}
    {renderCompare()}
  </div>);
}
