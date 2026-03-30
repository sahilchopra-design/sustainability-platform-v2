import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,ZAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899','#06b6d4'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:12},labelStyle:{color:T.navy,fontWeight:600}};
const PAGE=12;

export function generateItems(count,f1Arr,f2Arr,f1Field,f2Field,prefix){
  return Array.from({length:count},(_,i)=>({id:i+1,name:`${prefix} ${i+1}`,[f1Field]:f1Arr[Math.floor(sr(i*3)*f1Arr.length)],[f2Field]:f2Arr[Math.floor(sr(i*7)*f2Arr.length)],score:+(sr(i*11)*40+50).toFixed(1),rating:['AAA','AA','A','BBB','BB','B'][Math.floor(sr(i*13)*6)],coverage:+(sr(i*17)*30+60).toFixed(1),risk:+(sr(i*19)*50+10).toFixed(1),compliance:+(sr(i*23)*40+50).toFixed(1),impact:+(sr(i*29)*60+20).toFixed(1),trend:sr(i*31)>0.5?'Improving':'Stable',quality:['High','Medium','Low'][Math.floor(sr(i*37)*3)],value:+(sr(i*41)*5000+100).toFixed(0),pct1:+(sr(i*43)*40+20).toFixed(1),pct2:+(sr(i*47)*30+15).toFixed(1),flag1:sr(i*53)>0.3,flag2:sr(i*59)>0.35}));
}

export function generateTimeSeries(){
  return Array.from({length:12},(_,i)=>({period:''+(2015+i),v1:+(sr(i*61)*30+40).toFixed(1),v2:+(sr(i*67)*20+30).toFixed(1),v3:+(sr(i*71)*15+10).toFixed(1)}));
}

const exportCSV=(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};

export default function AnalyticsModule({title,subtitle,tabs,f1Arr,f2Arr,f1Field,f2Field,f1Label,f2Label,items,timeSeries,csvName,entityLabel,expandLabels}){
  const ITEMS=items;const TS=timeSeries;
  const [tab,setTab]=useState(0);const [search,setSearch]=useState('');const [sortCol,setSortCol]=useState('score');const [sortDir,setSortDir]=useState('desc');const [page,setPage]=useState(0);const [expanded,setExpanded]=useState(null);const [f1,sf1]=useState('All');const [f2,sf2]=useState('All');

  const filtered=useMemo(()=>{let d=[...ITEMS];if(search)d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));if(f1!=='All')d=d.filter(x=>x[f1Field]===f1);if(f2!=='All')d=d.filter(x=>x[f2Field]===f2);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));return d;},[search,sortCol,sortDir,f1,f2,ITEMS,f1Field,f2Field]);
  const paged=filtered.slice(page*PAGE,page*PAGE+PAGE);const totalPages=Math.ceil(filtered.length/PAGE);
  const doSort=col=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(0);};

  const SH=({col,label,w})=><th onClick={()=>doSort(col)} style={{cursor:'pointer',padding:'10px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.textSec,fontFamily:T.mono,width:w,userSelect:'none',whiteSpace:'nowrap'}}>{label}{sortCol===col?(sortDir==='asc'?' \u25B2':' \u25BC'):''}</th>;
  const Pg=()=><div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14}}><button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1,fontSize:12}}>Prev</button>{Array.from({length:Math.min(totalPages,7)},(_,i)=>{const p=totalPages<=7?i:page<3?i:page>totalPages-4?totalPages-7+i:page-3+i;return <button key={p} onClick={()=>setPage(p)} style={{padding:'6px 12px',border:`1px solid ${page===p?T.gold:T.border}`,borderRadius:6,background:page===p?T.gold:'transparent',color:page===p?'#fff':T.text,cursor:'pointer',fontWeight:page===p?700:400,fontSize:12}}>{p+1}</button>;})}<button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page>=totalPages-1?'default':'pointer',opacity:page>=totalPages-1?0.4:1,fontSize:12}}>Next</button></div>;

  const kpis=useMemo(()=>[{l:entityLabel||'Items',v:filtered.length},{l:'Avg Score',v:(filtered.reduce((s,x)=>s+parseFloat(x.score),0)/filtered.length).toFixed(1)},{l:'Avg Coverage',v:(filtered.reduce((s,x)=>s+parseFloat(x.coverage),0)/filtered.length).toFixed(1)+'%'},{l:'Avg Risk',v:(filtered.reduce((s,x)=>s+parseFloat(x.risk),0)/filtered.length).toFixed(1)},{l:'Compliant',v:filtered.filter(x=>parseFloat(x.compliance)>70).length}],[filtered,entityLabel]);
  const d1=useMemo(()=>{const m={};f1Arr.forEach(s=>m[s]=0);filtered.forEach(x=>m[x[f1Field]]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value}));},[filtered,f1Arr,f1Field]);
  const d2=useMemo(()=>{const m={};f2Arr.forEach(r=>m[r]=0);filtered.forEach(x=>m[x[f2Field]]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({name,value}));},[filtered,f2Arr,f2Field]);

  const elLabels=expandLabels||[[f1Label,'item[f1Field]'],[f2Label,'item[f2Field]']];

  const renderDash=()=>(<div><div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>{kpis.map((k,i)=><div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{k.l}</div><div style={{fontSize:24,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div></div>)}</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Trend Analysis</div><ResponsiveContainer width="100%" height={280}><AreaChart data={TS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="period" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Area type="monotone" dataKey="v1" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Primary"/><Area type="monotone" dataKey="v2" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Secondary"/></AreaChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>{f1Label} Distribution</div><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={d1} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{d1.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>{f2Label} Breakdown</div><ResponsiveContainer width="100%" height={260}><BarChart data={d2} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="name" type="category" width={100} tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="value" fill={T.sage} radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Key Metric Trend</div><ResponsiveContainer width="100%" height={260}><LineChart data={TS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="period" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Line type="monotone" dataKey="v3" stroke={T.red} strokeWidth={2} name="Key Metric"/></LineChart></ResponsiveContainer></div>
    </div>
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Score vs Risk</div><ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Score" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" name="Risk" tick={{fontSize:10,fill:T.textMut}}/><ZAxis dataKey="z" range={[40,400]}/><Tooltip {...tip}/><Scatter data={filtered.map(x=>({name:x.name,x:parseFloat(x.score),y:parseFloat(x.risk),z:parseFloat(x.value)/50}))} fill={T.navy} fillOpacity={0.5}/></ScatterChart></ResponsiveContainer></div>
  </div>);

  const renderTable=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder={`Search ${entityLabel||'items'}...`} style={{flex:1,minWidth:200,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}/>
      <select value={f1} onChange={e=>{sf1(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All {f1Label}s</option>{f1Arr.map(s=><option key={s} value={s}>{s}</option>)}</select>
      <select value={f2} onChange={e=>{sf2(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,background:T.surface}}><option value="All">All {f2Label}s</option>{f2Arr.map(r=><option key={r} value={r}>{r}</option>)}</select>
      <button onClick={()=>exportCSV(filtered,`${csvName}.csv`)} style={{padding:'8px 16px',border:'none',borderRadius:8,background:T.gold,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>Export CSV</button>
    </div>
    <div style={{fontSize:12,color:T.textMut,marginBottom:8,fontFamily:T.mono}}>{filtered.length} {entityLabel||'items'} | Page {page+1}/{totalPages}</div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
      <thead><tr style={{background:T.surfaceH}}><SH col="name" label="Name" w="150px"/><SH col="score" label="Score"/><SH col="rating" label="Rating"/><SH col="coverage" label="Coverage %"/><SH col="risk" label="Risk"/><SH col="compliance" label="Compliance"/><SH col="impact" label="Impact"/><SH col="value" label="Value"/><SH col="trend" label="Trend"/></tr></thead>
      <tbody>{paged.map(item=>(<React.Fragment key={item.id}>
        <tr onClick={()=>setExpanded(expanded===item.id?null:item.id)} style={{cursor:'pointer',background:expanded===item.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
          <td style={{padding:'10px 8px',fontWeight:600,color:T.navy}}>{expanded===item.id?'\u25BC':'\u25B6'} {item.name}</td>
          <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(item.score)>70?T.green:T.navy}}>{item.score}</td>
          <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:T.surfaceH,color:T.navy}}>{item.rating}</span></td>
          <td style={{padding:'10px 8px',fontFamily:T.mono}}>{item.coverage}%</td>
          <td style={{padding:'10px 8px',fontFamily:T.mono,color:parseFloat(item.risk)>35?T.red:T.green}}>{item.risk}</td>
          <td style={{padding:'10px 8px',fontFamily:T.mono}}>{item.compliance}</td>
          <td style={{padding:'10px 8px',fontFamily:T.mono}}>{item.impact}</td>
          <td style={{padding:'10px 8px',fontFamily:T.mono}}>{fmt(parseFloat(item.value))}</td>
          <td style={{padding:'10px 8px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:item.trend==='Improving'?'#d1fae5':'#fef3c7',color:item.trend==='Improving'?'#065f46':'#92400e'}}>{item.trend}</span></td>
        </tr>
        {expanded===item.id&&(<tr><td colSpan={9} style={{padding:20,background:T.surfaceH,borderBottom:`2px solid ${T.gold}`}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Details</div>
              {[[f1Label,item[f1Field]],[f2Label,item[f2Field]],['Quality',item.quality],['Metric 1',item.pct1+'%'],['Metric 2',item.pct2+'%'],['Flag 1',item.flag1?'Yes':'No'],['Flag 2',item.flag2?'Yes':'No']].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:`1px solid ${T.border}`}}><span style={{color:T.textMut}}>{l}</span><span style={{fontWeight:600,color:T.navy,fontFamily:T.mono}}>{typeof v==='boolean'?v?'Yes':'No':v}</span></div>)}</div>
            <div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Analysis</div><div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}><p>Assessment for {item.name} with score {item.score} and {item.quality} data quality.</p><p>Risk at {item.risk} with compliance at {item.compliance}.</p></div></div>
            <div><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Profile</div><ResponsiveContainer width="100%" height={200}><RadarChart data={[{m:'Score',v:parseFloat(item.score)},{m:'Coverage',v:parseFloat(item.coverage)},{m:'Compliance',v:parseFloat(item.compliance)},{m:'Impact',v:parseFloat(item.impact)},{m:'Low Risk',v:100-parseFloat(item.risk)},{m:'Quality',v:item.quality==='High'?90:item.quality==='Medium'?60:30}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:9}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/></RadarChart></ResponsiveContainer></div>
          </div>
        </td></tr>)}
      </React.Fragment>))}</tbody>
    </table></div><Pg/>
  </div>);

  const renderAnalytics=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Score by {f1Label}</div><ResponsiveContainer width="100%" height={280}><BarChart data={f1Arr.map(s=>{const cs=filtered.filter(x=>x[f1Field]===s);return{name:s.slice(0,12),avg:cs.length?(cs.reduce((sum,x)=>sum+parseFloat(x.score),0)/cs.length).toFixed(1):0};}).filter(d=>d.avg>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-45} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Bar dataKey="avg" fill={T.navy} radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Evolution</div><ResponsiveContainer width="100%" height={280}><AreaChart data={TS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="period" tick={{fontSize:10,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Area type="monotone" dataKey="v1" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Primary"/><Area type="monotone" dataKey="v2" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Secondary"/><Area type="monotone" dataKey="v3" stroke={T.sage} fill={T.sage} fillOpacity={0.15} name="Tertiary"/></AreaChart></ResponsiveContainer></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>{f2Label} Composition</div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={d2} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{d2.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/><Legend/></PieChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Correlation</div><ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" tick={{fontSize:10,fill:T.textMut}}/><YAxis dataKey="y" tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Scatter data={filtered.slice(0,30).map(x=>({name:x.name,x:parseFloat(x.score),y:parseFloat(x.coverage)}))} fill={T.gold} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer></div>
    </div>
  </div>);

  const renderSecondary=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>{kpis.slice(0,4).map((k,i)=><div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 18px'}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase'}}>{k.l}</div><div style={{fontSize:22,fontWeight:700,color:T.navy,marginTop:4}}>{k.v}</div></div>)}</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Comparative View</div><ResponsiveContainer width="100%" height={280}><BarChart data={filtered.slice(0,12).map(item=>({name:item.name.slice(0,10),score:parseFloat(item.score),risk:parseFloat(item.risk)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-45} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Bar dataKey="score" fill={T.navy} name="Score" radius={[4,4,0,0]}/><Bar dataKey="risk" fill={T.red} name="Risk" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}><div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Timeline</div><ResponsiveContainer width="100%" height={280}><LineChart data={TS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="period" tick={{fontSize:10,fill:T.textMut}}/><YAxis yAxisId="l" tick={{fontSize:10,fill:T.textMut}}/><YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textMut}}/><Tooltip {...tip}/><Legend/><Line yAxisId="l" type="monotone" dataKey="v1" stroke={T.navy} strokeWidth={2} name="Primary"/><Line yAxisId="r" type="monotone" dataKey="v3" stroke={T.gold} strokeWidth={2} name="Tertiary"/></LineChart></ResponsiveContainer></div>
    </div>
  </div>);

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
    <div style={{marginBottom:24}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{subtitle}</div><h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:'4px 0 0'}}>{title}</h1><div style={{width:40,height:3,background:T.gold,borderRadius:2,marginTop:6}}/></div>
    <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>{tabs.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font}}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderTable()}{tab===2&&renderAnalytics()}{tab===3&&renderSecondary()}
  </div>);
}