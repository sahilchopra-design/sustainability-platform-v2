import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,ScatterChart,Scatter,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:T.font},labelStyle:{color:T.textSec}};
const CC=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899'];
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['Country Dashboard','Renewable Capacity','Fossil Phase-Out','Grid Decarbonization'];
const PAGE_SIZE=12;

const COUNTRIES=Array.from({length:30},(_,i)=>{
  const names=['China','USA','India','Germany','UK','France','Japan','Brazil','Australia','Canada','South Korea','Spain','Italy','Netherlands','Denmark','Sweden','Norway','Chile','Morocco','South Africa','Indonesia','Vietnam','Thailand','Mexico','Turkey','Poland','Egypt','Saudi Arabia','UAE','Nigeria'];
  const regions=['Asia','Americas','Asia','Europe','Europe','Europe','Asia','Americas','Oceania','Americas','Asia','Europe','Europe','Europe','Europe','Europe','Europe','Americas','Africa','Africa','Asia','Asia','Asia','Americas','Europe','Europe','Africa','Middle East','Middle East','Africa'];
  return{
    id:i+1,country:names[i],region:regions[i],
    renewablePct:+(sr(i*7)*50+10).toFixed(1),
    solarGW:+(sr(i*11)*200+5).toFixed(1),
    windGW:+(sr(i*13)*150+3).toFixed(1),
    hydroGW:+(sr(i*17)*100+2).toFixed(1),
    fossilPct:+(90-sr(i*7)*50).toFixed(1),
    coalPhaseOut:2025+Math.floor(sr(i*19)*20),
    gridIntensity:Math.round(sr(i*23)*600+100),
    investment:+(sr(i*29)*80+2).toFixed(1),
    jobsCreated:Math.round(sr(i*31)*500+50),
    emissionsReduction:+(sr(i*37)*15+1).toFixed(1),
    evShare:+(sr(i*41)*30+2).toFixed(1),
    hydrogenPlan:sr(i*43)>0.5?'Active':'Planned',
    carbonPrice:Math.round(sr(i*47)*120+5),
    nuclearGW:+(sr(i*53)*30).toFixed(1),
    storageGWh:+(sr(i*59)*50+0.5).toFixed(1),
    gridReliability:+(sr(i*61)*5+94).toFixed(1),
    policyScore:+(sr(i*67)*30+60).toFixed(0),
  };
});

const CAPACITY=Array.from({length:12},(_,i)=>({year:2013+i,solar:+(sr(i*71)*400+50).toFixed(0),wind:+(sr(i*73)*350+80).toFixed(0),hydro:+(sr(i*79)*20+1100).toFixed(0),nuclear:+(sr(i*83)*10+350).toFixed(0),other:+(sr(i*89)*30+100).toFixed(0)}));
const FOSSIL=Array.from({length:12},(_,i)=>({year:2013+i,coal:+(sr(i*97)*5+30-i*1.5).toFixed(1),gas:+(sr(i*101)*3+22+i*0.3).toFixed(1),oil:+(sr(i*103)*2+28-i*0.8).toFixed(1)}));
const GRID=Array.from({length:12},(_,i)=>({year:2013+i,intensity:Math.round(500-i*15+sr(i*107)*30),renewShare:+(25+i*3+sr(i*109)*4).toFixed(1),storageGWh:+(sr(i*113)*200+20+i*40).toFixed(0)}));

export default function EnergyTransitionAnalyticsPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[sortCol,setSortCol]=useState('renewablePct');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(0);const[selected,setSelected]=useState(null);const[regionFilter,setRegionFilter]=useState('All');const[minRenew,setMinRenew]=useState(0);

  const doSort=(d,c,dir)=>[...d].sort((a,b)=>dir==='asc'?(a[c]>b[c]?1:-1):(a[c]<b[c]?1:-1));
  const tog=(col,cur,setC,dir,setD)=>{if(cur===col)setD(dir==='asc'?'desc':'asc');else{setC(col);setD('desc');}};
  const SH=({label,col,cc,dir,onClick})=>(<th onClick={()=>onClick(col)} style={{padding:'10px 12px',textAlign:'left',cursor:'pointer',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',background:T.surfaceH}}>{label}{cc===col?(dir==='asc'?' \u25B2':' \u25BC'):''}</th>);
  const kpi=(l,v,s)=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:1,minWidth:170}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{l}</div><div style={{fontSize:26,fontWeight:700,color:T.navy,marginTop:4}}>{v}</div>{s&&<div style={{fontSize:12,color:T.textSec,marginTop:2}}>{s}</div>}</div>);
  const csv=(data,fn)=>{const h=Object.keys(data[0]);const c=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([c],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
  const regions=['All','Asia','Europe','Americas','Africa','Oceania','Middle East'];

  const filtered=useMemo(()=>{let d=COUNTRIES.filter(c=>c.country.toLowerCase().includes(search.toLowerCase()));if(regionFilter!=='All')d=d.filter(c=>c.region===regionFilter);d=d.filter(c=>c.renewablePct>=minRenew);return doSort(d,sortCol,sortDir);},[search,regionFilter,minRenew,sortCol,sortDir]);
  const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);const tp=Math.ceil(filtered.length/PAGE_SIZE);

  const renderDashboard=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
      {kpi('Countries',filtered.length)}
      {kpi('Avg Renewable',(filtered.reduce((a,c)=>a+c.renewablePct,0)/filtered.length||0).toFixed(1)+'%')}
      {kpi('Total Solar',fmt(filtered.reduce((a,c)=>a+c.solarGW,0))+' GW')}
      {kpi('Total Wind',fmt(filtered.reduce((a,c)=>a+c.windGW,0))+' GW')}
      {kpi('Total Investment','$'+fmt(filtered.reduce((a,c)=>a+c.investment,0))+'B')}
    </div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search countries..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:220}}/>
      <select value={regionFilter} onChange={e=>{setRegionFilter(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>{regions.map(r=><option key={r}>{r}</option>)}</select>
      <div style={{fontSize:12,color:T.textSec,display:'flex',alignItems:'center',gap:8}}>Min renewable: {minRenew}%<input type="range" min={0} max={60} value={minRenew} onChange={e=>setMinRenew(+e.target.value)} style={{width:100}}/></div>
      <button onClick={()=>csv(filtered,'energy_transition.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Renewable Share by Country</div><ResponsiveContainer width="100%" height={300}><BarChart data={filtered.slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="country" tick={{fontSize:9,fill:T.textSec}} angle={-45} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="renewablePct" name="Renewable %">{filtered.slice(0,15).map((c,i)=><Cell key={i} fill={c.renewablePct>40?T.green:c.renewablePct>20?T.gold:T.red}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Investment vs Grid Intensity</div><ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="investment" name="Investment $B" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="gridIntensity" name="gCO2/kWh" tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Scatter data={filtered} fill={T.navy} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer></div>
    </div>
    <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}><thead><tr>
        {[['Country','country'],['Region','region'],['Renew %','renewablePct'],['Solar GW','solarGW'],['Wind GW','windGW'],['Grid g/kWh','gridIntensity'],['Invest $B','investment'],['EV Share %','evShare'],['Policy','policyScore']].map(([l,c])=><SH key={c} label={l} col={c} cc={sortCol} dir={sortDir} onClick={c2=>tog(c2,sortCol,setSortCol,sortDir,setSortDir)}/>)}
      </tr></thead><tbody>
        {paged.map((c,i)=>(<React.Fragment key={c.id}>
          <tr onClick={()=>setSelected(selected===c.id?null:c.id)} style={{cursor:'pointer',background:selected===c.id?T.surfaceH:i%2===0?T.surface:'#fafaf8'}}>
            <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{c.country}</td>
            <td style={{padding:'10px 12px',color:T.textSec,fontSize:12}}>{c.region}</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono,color:c.renewablePct>40?T.green:c.renewablePct>20?T.gold:T.red,fontWeight:600}}>{c.renewablePct}%</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{c.solarGW}</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{c.windGW}</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{c.gridIntensity}</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>${c.investment}B</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono}}>{c.evShare}%</td>
            <td style={{padding:'10px 12px',fontFamily:T.mono,fontWeight:600}}>{c.policyScore}</td>
          </tr>
          {selected===c.id&&(<tr><td colSpan={9} style={{padding:20,background:T.surfaceH,borderTop:`1px solid ${T.border}`}}><div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Hydro GW</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.hydroGW}</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Nuclear GW</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.nuclearGW}</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Coal Exit</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.coalPhaseOut}</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Carbon $/t</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>${c.carbonPrice}</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>H2 Plan</span><div style={{fontSize:16,fontWeight:700,color:c.hydrogenPlan==='Active'?T.green:T.amber}}>{c.hydrogenPlan}</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Storage GWh</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.storageGWh}</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Grid Reliability</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.gridReliability}%</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Jobs Created K</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.jobsCreated}K</div></div>
            <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Emissions Red %</span><div style={{fontSize:16,fontWeight:700,color:T.green}}>{c.emissionsReduction}%</div></div>
          </div></td></tr>)}
        </React.Fragment>))}
      </tbody></table>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}><span style={{fontSize:12,color:T.textMut}}>{filtered.length} countries</span><div style={{display:'flex',gap:6}}><button disabled={page===0} onClick={()=>setPage(page-1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,opacity:page===0?0.4:1,cursor:page===0?'default':'pointer'}}>Prev</button><span style={{padding:'6px 12px',fontSize:12,color:T.textSec}}>{page+1}/{tp||1}</span><button disabled={page>=tp-1} onClick={()=>setPage(page+1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,opacity:page>=tp-1?0.4:1,cursor:page>=tp-1?'default':'pointer'}}>Next</button></div></div>
  </div>);

  const renderCapacity=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Global Renewable Capacity (GW)</div><ResponsiveContainer width="100%" height={300}><AreaChart data={CAPACITY}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Area type="monotone" dataKey="solar" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.4} name="Solar"/><Area type="monotone" dataKey="wind" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.3} name="Wind"/><Area type="monotone" dataKey="hydro" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.2} name="Hydro"/><Legend/></AreaChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Technology Mix (Latest)</div><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={[{name:'Solar',value:+CAPACITY[11].solar},{name:'Wind',value:+CAPACITY[11].wind},{name:'Hydro',value:+CAPACITY[11].hydro},{name:'Nuclear',value:+CAPACITY[11].nuclear},{name:'Other',value:+CAPACITY[11].other}]} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} style={{fontSize:10}}>{[0,1,2,3,4].map(j=><Cell key={j} fill={CC[j]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
    </div>
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Country Capacity Radar</div><ResponsiveContainer width="100%" height={300}><RadarChart data={filtered.slice(0,8).map(c=>({country:c.country,solar:c.solarGW,wind:c.windGW,hydro:c.hydroGW}))}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="country" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/><Radar dataKey="solar" stroke={T.gold} fill={T.gold} fillOpacity={0.2} name="Solar"/><Radar dataKey="wind" stroke={T.navy} fill={T.navy} fillOpacity={0.2} name="Wind"/><Legend/></RadarChart></ResponsiveContainer></div>
  </div>);

  const renderFossil=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Global Fossil Fuel Share (%)</div><ResponsiveContainer width="100%" height={300}><AreaChart data={FOSSIL}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Area type="monotone" dataKey="coal" stroke={T.red} fill={T.red} fillOpacity={0.2} name="Coal"/><Area type="monotone" dataKey="gas" stroke={T.amber} fill={T.amber} fillOpacity={0.2} name="Gas"/><Area type="monotone" dataKey="oil" stroke={T.navy} fill={T.navy} fillOpacity={0.2} name="Oil"/><Legend/></AreaChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Coal Phase-Out Timeline</div><ResponsiveContainer width="100%" height={300}><BarChart data={filtered.filter(c=>c.coalPhaseOut<=2040).sort((a,b)=>a.coalPhaseOut-b.coalPhaseOut).slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="country" tick={{fontSize:9,fill:T.textSec}} angle={-45} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[2025,2045]}/><Tooltip {...tip}/><Bar dataKey="coalPhaseOut" fill={T.red} name="Phase-out Year"/></BarChart></ResponsiveContainer></div>
    </div>
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Fossil vs Renewable Split</div><ResponsiveContainer width="100%" height={250}><BarChart data={filtered.slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="country" tick={{fontSize:9,fill:T.textSec}} angle={-45} textAnchor="end" height={80}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="renewablePct" stackId="a" fill={T.green} name="Renewable"/><Bar dataKey="fossilPct" stackId="a" fill={T.red} name="Fossil"/><Legend/></BarChart></ResponsiveContainer></div>
  </div>);

  const renderGrid=()=>(<div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Grid Carbon Intensity (gCO2/kWh)</div><ResponsiveContainer width="100%" height={300}><LineChart data={GRID}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Line type="monotone" dataKey="intensity" stroke={T.red} strokeWidth={2} name="Intensity"/></LineChart></ResponsiveContainer></div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}><div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Storage Capacity & Renewable Share</div><ResponsiveContainer width="100%" height={300}><LineChart data={GRID}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis yAxisId="l" tick={{fontSize:10,fill:T.textSec}}/><YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Line yAxisId="l" type="monotone" dataKey="storageGWh" stroke={T.navy} strokeWidth={2} name="Storage GWh"/><Line yAxisId="r" type="monotone" dataKey="renewShare" stroke={T.green} strokeWidth={2} name="Renewable %"/><Legend/></LineChart></ResponsiveContainer></div>
    </div>
  </div>);

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
    <div style={{marginBottom:24}}><div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,letterSpacing:1,textTransform:'uppercase'}}>Global Energy Intelligence</div><h1 style={{fontSize:28,fontWeight:700,color:T.navy,margin:'4px 0 0'}}>Energy Transition Analytics</h1></div>
    <div style={{display:'flex',gap:4,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>{TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',background:tab===i?T.surface:'transparent',color:tab===i?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:tab===i?600:400,cursor:'pointer',marginBottom:-2}}>{t}</button>)}</div>
    {tab===0&&renderDashboard()}{tab===1&&renderCapacity()}{tab===2&&renderFossil()}{tab===3&&renderGrid()}
  </div>);
}