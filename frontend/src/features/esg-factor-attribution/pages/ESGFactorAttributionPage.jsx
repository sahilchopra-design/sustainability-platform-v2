import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,ScatterChart,Scatter,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:T.font},labelStyle:{color:T.textSec}};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899'];
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['Factor Dashboard','Return Attribution','Risk Decomposition','Alpha Analysis'];
const PAGE_SIZE=12;

const FACTORS=Array.from({length:60},(_,i)=>{
  const names=['ESG Momentum','Carbon Intensity','Board Quality','Social Score','Governance Risk','Green Revenue','Water Efficiency','Waste Mgmt','Employee Satisfaction','Supply Chain ESG','Climate Transition','Biodiversity Risk','Human Capital','Data Privacy','Ethical Conduct','Innovation ESG','Community Impact','Diversity Score','Safety Record','Stakeholder Trust','Resource Efficiency','Clean Tech','Regulatory Risk','Stranded Asset','Physical Risk','Just Transition','Scope 3 Intensity','Net Zero Align','Nature Positive','Circular Economy','ESG Controversy','Rating Momentum','Engagement Score','Proxy Voting','SBTi Align','TCFD Compliance','EU Taxonomy','SFDR PAI','GHG Reduction','Renewable %','Water Stress','Deforestation','Rights Score','Living Wage','Slavery Risk','Tax Transparency','Anti-Corruption','Lobbying Risk','Political Spend','Exec ESG Pay','Board Indep','Audit Quality','Risk Oversight','Cyber Resilience','Supply Resilience','Climate Litigation','Bio Offset','Ocean Impact','Air Quality','Transition Ready'];
  const cats=['Environmental','Environmental','Governance','Social','Governance','Environmental','Environmental','Environmental','Social','Social','Environmental','Environmental','Social','Governance','Governance','Environmental','Social','Social','Social','Social','Environmental','Environmental','Governance','Environmental','Environmental','Social','Environmental','Environmental','Environmental','Environmental','Social','Governance','Governance','Governance','Environmental','Governance','Environmental','Environmental','Environmental','Environmental','Environmental','Environmental','Social','Social','Social','Governance','Governance','Governance','Governance','Governance','Governance','Governance','Governance','Governance','Social','Environmental','Environmental','Environmental','Environmental','Environmental'];
  return{id:i+1,factor:names[i],category:cats[i],
    returnContrib:+((sr(i*7)-0.5)*4).toFixed(2),tStat:+((sr(i*11)-0.3)*5).toFixed(2),ic:+(sr(i*13)*0.15-0.02).toFixed(3),sharpe:+((sr(i*17)-0.3)*2).toFixed(2),exposure:+(sr(i*19)*2-0.5).toFixed(2),weight:+(sr(i*23)*8).toFixed(1),volatility:+(sr(i*29)*10+2).toFixed(1),maxDrawdown:+(sr(i*31)*15+2).toFixed(1),decayHalfLife:Math.round(sr(i*37)*24+3),significance:sr(i*41)>0.3?'Significant':'Weak',trend:sr(i*43)>0.5?'Improving':'Stable',correlation:+((sr(i*47)-0.5)*0.8).toFixed(2)};
});

const MONTHLY=Array.from({length:36},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`,esgAlpha:+((sr(i*53)-0.4)*2).toFixed(2),envReturn:+((sr(i*59)-0.45)*3).toFixed(2),socReturn:+((sr(i*61)-0.45)*2.5).toFixed(2),govReturn:+((sr(i*67)-0.45)*2).toFixed(2),benchmark:+((sr(i*71)-0.5)*1.5).toFixed(2)}));
const RISK_DECOMP=[{source:'ESG Factor',contrib:28.4,vol:3.2,sharpe:0.89},{source:'Market Beta',contrib:45.2,vol:8.1,sharpe:0.56},{source:'Size',contrib:8.3,vol:2.4,sharpe:0.35},{source:'Value',contrib:6.1,vol:3.8,sharpe:0.16},{source:'Momentum',contrib:5.8,vol:2.9,sharpe:0.20},{source:'Quality',contrib:4.2,vol:1.8,sharpe:0.23},{source:'Idiosyncratic',contrib:2.0,vol:5.2,sharpe:0.04}];

export default function EsgFactorAttributionPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sortCol,setSortCol]=useState('returnContrib');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(0);const[selected,setSelected]=useState(null);const[catFilter,setCatFilter]=useState('All');const[minReturn,setMinReturn]=useState(-2);

  const doSort=(d,c,dir)=>[...d].sort((a,b)=>dir==='asc'?(a[c]>b[c]?1:-1):(a[c]<b[c]?1:-1));
  const tog=(col,cur,setC,dir,setD)=>{if(cur===col)setD(dir==='asc'?'desc':'asc');else{setC(col);setD('desc');}};
  const SH=({label,col,cc,dir,onClick})=>(<th onClick={()=>onClick(col)} style={{padding:'10px 12px',textAlign:'left',cursor:'pointer',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',background:T.surfaceH}}>{label}{cc===col?(dir==='asc'?' \u25B2':' \u25BC'):''}</th>);
  const kpi=(l,v,s)=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:1,minWidth:170}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{l}</div><div style={{fontSize:26,fontWeight:700,color:T.navy,marginTop:4}}>{v}</div>{s&&<div style={{fontSize:12,color:T.textSec,marginTop:2}}>{s}</div>}</div>);
  const csvE=(data,fn)=>{const h=Object.keys(data[0]);const c=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([c],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
  const categories=['All','Environmental','Social','Governance'];

  const filtered=useMemo(()=>{let d=FACTORS.filter(f=>f.factor.toLowerCase().includes(search.toLowerCase()));if(catFilter!=='All')d=d.filter(f=>f.category===catFilter);d=d.filter(f=>f.returnContrib>=minReturn);return doSort(d,sortCol,sortDir);},[search,catFilter,minReturn,sortCol,sortDir]);
  const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);const tp=Math.ceil(filtered.length/PAGE_SIZE);

  const catBreak=useMemo(()=>categories.filter(c=>c!=='All').map(c=>({name:c,value:filtered.filter(f=>f.category===c).length,avgReturn:+(filtered.filter(f=>f.category===c).reduce((a,f)=>a+f.returnContrib,0)/(filtered.filter(f=>f.category===c).length||1)).toFixed(2)})),[filtered]);

  const renderDashboard=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
      {kpi('Factors',filtered.length)}{kpi('Avg Return',(filtered.reduce((a,f)=>a+f.returnContrib,0)/filtered.length||0).toFixed(2)+'%')}{kpi('Significant',filtered.filter(f=>f.significance==='Significant').length)}{kpi('Avg Sharpe',(filtered.reduce((a,f)=>a+f.sharpe,0)/filtered.length||0).toFixed(2))}{kpi('Avg IC',(filtered.reduce((a,f)=>a+f.ic,0)/filtered.length||0).toFixed(3))}
    </div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search factors..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:220}}/>
      <select value={catFilter} onChange={e=>{setCatFilter(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>{categories.map(c=><option key={c}>{c}</option>)}</select>
      <div style={{fontSize:12,color:T.textSec,display:'flex',alignItems:'center',gap:8}}>Min return: {minReturn}%<input type="range" min={-4} max={4} step={0.5} value={minReturn} onChange={e=>setMinReturn(+e.target.value)} style={{width:100}}/></div>
      <button onClick={()=>csvE(filtered,'esg_factors.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Factor Returns (Top 20)</div><ResponsiveContainer width="100%" height={300}><BarChart data={filtered.slice(0,20)} layout="vertical" margin={{left:120}}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis type="category" dataKey="factor" tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="returnContrib" name="Return %">{filtered.slice(0,20).map((f,i)=><Cell key={i} fill={f.returnContrib>0?T.green:T.red}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Return vs Volatility</div><ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="volatility" name="Vol %" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="returnContrib" name="Return %" tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Scatter data={filtered} fill={T.navy} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer></div>
    </div>
    <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}><thead><tr>
        {[['Factor','factor'],['Category','category'],['Return %','returnContrib'],['t-Stat','tStat'],['IC','ic'],['Sharpe','sharpe'],['Weight %','weight'],['Sig','significance']].map(([l,c])=><SH key={c} label={l} col={c} cc={sortCol} dir={sortDir} onClick={c2=>tog(c2,sortCol,setSortCol,sortDir,setSortDir)}/>)}
      </tr></thead><tbody>
        {paged.map((f,i)=>(<React.Fragment key={f.id}>
          <tr onClick={()=>setSelected(selected===f.id?null:f.id)} style={{cursor:'pointer',background:selected===f.id?T.surfaceH:i%2===0?T.surface:'#fafaf8'}}>
            <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{f.factor}</td>
            <td style={{padding:'10px 12px',fontSize:12}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,background:f.category==='Environmental'?'#dcfce7':f.category==='Social'?'#dbeafe':'#fef9c3',color:f.category==='Environmental'?T.green:f.category==='Social'?T.navy:T.amber}}>{f.category}</span></td>
            <td style={{padding:'10px 12px',fontFamily:T.mono,color:f.returnContrib>0?T.green:T.red,fontWeight:600}}>{f.returnContrib>0?'+':''}{f.returnContrib}%</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{f.tStat}</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{f.ic}</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{f.sharpe}</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{f.weight}%</td>
            <td style={{padding:'10px 12px'}}><span style={{color:f.significance==='Significant'?T.green:T.textMut}}>{f.significance}</span></td>
          </tr>
          {selected===f.id&&(<tr><td colSpan={8} style={{padding:20,background:T.surfaceH,borderTop:`1px solid ${T.border}`}}><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[['Exposure',f.exposure],['Volatility',f.volatility+'%'],['Max DD',f.maxDrawdown+'%'],['Decay (mo)',f.decayHalfLife],['Trend',f.trend],['Correlation',f.correlation]].map(([l,v])=><div key={l}><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{l}</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{v}</div></div>)}
          </div></td></tr>)}
        </React.Fragment>))}
      </tbody></table>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><span style={{fontSize:12,color:T.textMut}}>{filtered.length} factors</span><div style={{display:'flex',gap:6}}><button disabled={page===0} onClick={()=>setPage(page-1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,opacity:page===0?0.4:1,cursor:page===0?'default':'pointer'}}>Prev</button><span style={{padding:'6px 12px',fontSize:12,color:T.textSec}}>{page+1}/{tp||1}</span><button disabled={page>=tp-1} onClick={()=>setPage(page+1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,opacity:page>=tp-1?0.4:1,cursor:page>=tp-1?'default':'pointer'}}>Next</button></div></div>
  </div>);

  const renderAttribution=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Monthly ESG Alpha</div><ResponsiveContainer width="100%" height={300}><AreaChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textSec}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Area type="monotone" dataKey="esgAlpha" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="ESG Alpha %"/></AreaChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>E/S/G Return Attribution</div><ResponsiveContainer width="100%" height={300}><LineChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textSec}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Line type="monotone" dataKey="envReturn" stroke={T.green} strokeWidth={2} name="Environmental" dot={false}/><Line type="monotone" dataKey="socReturn" stroke={T.navy} strokeWidth={2} name="Social" dot={false}/><Line type="monotone" dataKey="govReturn" stroke={T.gold} strokeWidth={2} name="Governance" dot={false}/><Legend/></LineChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Category Breakdown</div><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={catBreak} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,value})=>`${name}: ${value}`} style={{fontSize:10}}>{catBreak.map((_,i)=><Cell key={i} fill={CC[i]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Avg Return by Category</div><ResponsiveContainer width="100%" height={280}><BarChart data={catBreak}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="avgReturn" name="Avg Return %">{catBreak.map((c,i)=><Cell key={i} fill={CC[i]}/>)}</Bar></BarChart></ResponsiveContainer></div>
    </div>
  </div>);

  const renderRisk=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Risk Source Contribution</div><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={RISK_DECOMP} cx="50%" cy="50%" outerRadius={110} dataKey="contrib" label={({source,contrib})=>`${source}: ${contrib}%`} style={{fontSize:9}}>{RISK_DECOMP.map((_,i)=><Cell key={i} fill={CC[i]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Volatility & Sharpe by Source</div><ResponsiveContainer width="100%" height={300}><BarChart data={RISK_DECOMP}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="source" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="vol" fill={T.navy} name="Vol %"/><Bar dataKey="sharpe" fill={T.gold} name="Sharpe"/><Legend/></BarChart></ResponsiveContainer></div>
    </div>
    <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}><thead><tr>{['Source','Contribution %','Volatility %','Sharpe Ratio'].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>{h}</th>)}</tr></thead><tbody>
        {RISK_DECOMP.map((r,i)=>(<tr key={r.source} style={{background:i%2===0?T.surface:'#fafaf8'}}><td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{r.source}</td><td style={{padding:'10px 12px',fontFamily:T.mono}}>{r.contrib}%</td><td style={{padding:'10px 12px',fontFamily:T.mono}}>{r.vol}%</td><td style={{padding:'10px 12px',fontFamily:T.mono,color:r.sharpe>0.5?T.green:r.sharpe>0.2?T.amber:T.red}}>{r.sharpe}</td></tr>))}
      </tbody></table>
    </div>
  </div>);

  const renderAlpha=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>ESG Alpha vs Benchmark</div><ResponsiveContainer width="100%" height={300}><LineChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textSec}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Line type="monotone" dataKey="esgAlpha" stroke={T.green} strokeWidth={2} name="ESG Alpha" dot={false}/><Line type="monotone" dataKey="benchmark" stroke={T.textMut} strokeWidth={1} strokeDasharray="5 5" name="Benchmark" dot={false}/><Legend/></LineChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Factor IC Radar (Top 8)</div><ResponsiveContainer width="100%" height={300}><RadarChart data={filtered.slice(0,8)}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="factor" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/><Radar dataKey="ic" stroke={T.navy} fill={T.navy} fillOpacity={0.2} name="IC"/></RadarChart></ResponsiveContainer></div>
    </div>
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Cumulative Alpha Trend</div><ResponsiveContainer width="100%" height={250}><AreaChart data={MONTHLY.map((m,i)=>({...m,cumAlpha:MONTHLY.slice(0,i+1).reduce((a,x)=>a+x.esgAlpha,0).toFixed(2)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="month" tick={{fontSize:9,fill:T.textSec}} interval={5}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Area type="monotone" dataKey="cumAlpha" stroke={T.green} fill={T.green} fillOpacity={0.15} name="Cumulative Alpha %"/></AreaChart></ResponsiveContainer></div>
  </div>);

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
    <div style={{marginBottom:24}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,letterSpacing:1,textTransform:'uppercase'}}>Quantitative ESG Intelligence</div><h1 style={{fontSize:28,fontWeight:700,color:T.navy,margin:'4px 0 0'}}>ESG Factor Attribution</h1></div>
    <div style={{display:'flex',gap:4,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>{TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',background:tab===i?T.surface:'transparent',color:tab===i?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:tab===i?600:400,cursor:'pointer',marginBottom:-2}}>{t}</button>)}</div>
    {tab===0&&renderDashboard()}{tab===1&&renderAttribution()}{tab===2&&renderRisk()}{tab===3&&renderAlpha()}
  </div>);
}