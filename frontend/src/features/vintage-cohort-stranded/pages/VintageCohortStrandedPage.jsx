import React, { useState, useMemo } from 'react';
import {

  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine, PieChart, Pie
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Vintage Dashboard','Cohort Comparison','Remaining Book Value','Age-Depreciation Curves','Regulatory Closure Risk','Portfolio Vintage Distribution'];
const SCENARIOS = ['Current Policies','Delayed Transition','Below 2\u00b0C','Net Zero 2050'];
const SECTORS = ['Coal','Oil & Gas','Cement','Steel','Power Gen'];

const ASSETS = Array.from({length:20},(_, i)=>{
  const decades = ['pre-2000','2000-2010','2010-2020','post-2020'];
  const dec = decades[i%4];
  const baseYear = dec==='pre-2000'?1990+i%10 : dec==='2000-2010'?2000+i%10 : dec==='2010-2020'?2010+i%10 : 2020+i%4;
  const age = 2026 - baseYear;
  const sector = SECTORS[i%5];
  const bv0 = 200 + (sr(i * 73 + 21) * 800);
  const lambda = dec==='pre-2000'?0.08 : dec==='2000-2010'?0.05 : dec==='2010-2020'?0.03 : 0.015;
  return { id:`A-${(i+1).toString().padStart(3,'0')}`, name:`${sector} Asset ${i+1}`, sector, vintage:dec, commissionYear:baseYear, age, bv0:Math.round(bv0), lambda, strandingProb: Math.min(0.95, 0.1+age*0.025), currentBV: Math.round(bv0*Math.exp(-lambda*age)), region:['US','EU','APAC','LatAm','Africa'][i%5] };
});

const buildDecayCurve = (asset, years=30) => Array.from({length:years},(_, t)=>({ year:t, bv:Math.round(asset.bv0*Math.exp(-asset.lambda*t)), pct:Math.round(100*Math.exp(-asset.lambda*t)) }));

const COHORTS = ['pre-2000','2000-2010','2010-2020','post-2020'];
const COHORT_COLORS = [T.red, T.orange, T.amber, T.green];

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function VintageCohortStrandedPage(){
  const [tab,setTab]=useState(0);
  const [scenario,setScenario]=useState('Net Zero 2050');
  const [vintageFilter,setVintageFilter]=useState('All');
  const [sectorFilter,setSectorFilter]=useState('All');
  const [watchlist,setWatchlist]=useState([]);

  const filtered = useMemo(()=>ASSETS.filter(a=>(vintageFilter==='All'||a.vintage===vintageFilter)&&(sectorFilter==='All'||a.sector===sectorFilter)),[vintageFilter,sectorFilter]);
  const totalBV0 = filtered.reduce((s,a)=>s+a.bv0,0);
  const totalCurrent = filtered.reduce((s,a)=>s+a.currentBV,0);
  const avgStrandProb = filtered.reduce((s,a)=>s+a.strandingProb,0)/filtered.length;

  const cohortStats = useMemo(()=>COHORTS.map(c=>{
    const group = ASSETS.filter(a=>a.vintage===c);
    return { cohort:c, count:group.length, avgAge:Math.round(group.reduce((s,a)=>s+a.age,0)/group.length), totalBV:group.reduce((s,a)=>s+a.currentBV,0), avgStrand:Math.round(100*group.reduce((s,a)=>s+a.strandingProb,0)/group.length), avgLambda:(group.reduce((s,a)=>s+a.lambda,0)/group.length).toFixed(3) };
  }),[]);

  const regRisk = useMemo(()=>ASSETS.map(a=>({ name:a.name, age:a.age, sector:a.sector, vintage:a.vintage, closureRisk: a.vintage==='pre-2000'?'Critical':a.vintage==='2000-2010'?'High':a.vintage==='2010-2020'?'Medium':'Low', yearsToRegClosure: a.vintage==='pre-2000'?Math.max(1,5-Math.floor(a.age/10)):a.vintage==='2000-2010'?8:a.vintage==='2010-2020'?15:25, complianceCost:Math.round(a.currentBV*0.15*(a.age/20)) })),[]);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CK1" label="Vintage Cohort Stranded Asset Analysis" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Asset Vintage Cohort Analysis</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>BV(t) = BV&#8320; x exp(-&#955;(age) x t) &mdash; Older vintages carry exponentially higher stranding probability</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <label style={{fontSize:12,color:T.textSec}}>Scenario:</label>
        <select value={scenario} onChange={e=>setScenario(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>{SCENARIOS.map(s=><option key={s}>{s}</option>)}</select>
        <label style={{fontSize:12,color:T.textSec}}>Vintage:</label>
        <select value={vintageFilter} onChange={e=>setVintageFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>{['All',...COHORTS].map(s=><option key={s}>{s}</option>)}</select>
        <label style={{fontSize:12,color:T.textSec}}>Sector:</label>
        <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>{['All',...SECTORS].map(s=><option key={s}>{s}</option>)}</select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Total Original BV" value={`$${(totalBV0/1000).toFixed(1)}B`} sub={`${filtered.length} assets`}/></Card>
        <Card><KPI label="Current Book Value" value={`$${(totalCurrent/1000).toFixed(1)}B`} sub={`${Math.round(100*totalCurrent/totalBV0)}% remaining`}/></Card>
        <Card><KPI label="Avg Stranding Prob" value={`${(avgStrandProb*100).toFixed(1)}%`} sub={scenario}/></Card>
        <Card><KPI label="Watchlist" value={watchlist.length} sub="assets tracked"/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Vintage Dashboard</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Asset','Sector','Vintage','Age','BV\u2080 ($M)','Current BV','Strand Prob','\u03bb','Watch'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
              </tr></thead>
              <tbody>{filtered.map(a=><tr key={a.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px'}}>{a.name}</td>
                <td>{a.sector}</td>
                <td><span style={{background:COHORT_COLORS[COHORTS.indexOf(a.vintage)]+'22',color:COHORT_COLORS[COHORTS.indexOf(a.vintage)],padding:'2px 8px',borderRadius:4,fontSize:11}}>{a.vintage}</span></td>
                <td>{a.age}y</td>
                <td>${a.bv0}M</td>
                <td>${a.currentBV}M</td>
                <td style={{color:a.strandingProb>0.7?T.red:a.strandingProb>0.4?T.amber:T.green}}>{(a.strandingProb*100).toFixed(1)}%</td>
                <td>{a.lambda}</td>
                <td><button onClick={()=>setWatchlist(w=>w.includes(a.id)?w.filter(x=>x!==a.id):[...w,a.id])} style={{background:watchlist.includes(a.id)?T.gold+'22':'transparent',border:`1px solid ${T.border}`,borderRadius:4,padding:'2px 8px',cursor:'pointer',fontSize:11}}>{watchlist.includes(a.id)?'Watching':'+ Watch'}</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Cohort Comparison</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={cohortStats}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="cohort" tick={{fontSize:11,fill:T.textSec}} /><YAxis tick={{fontSize:11}} />
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}} /><Legend />
              <Bar dataKey="totalBV" name="Total BV ($M)" fill={T.navy} /><Bar dataKey="avgStrand" name="Avg Strand %" fill={T.red} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:16}}>
            {cohortStats.map((c,i)=><div key={i} style={{padding:12,borderRadius:6,background:COHORT_COLORS[i]+'11',border:`1px solid ${COHORT_COLORS[i]}33`}}>
              <div style={{fontWeight:700,fontSize:13,color:COHORT_COLORS[i]}}>{c.cohort}</div>
              <div style={{fontSize:11,color:T.textSec}}>{c.count} assets | Avg age: {c.avgAge}y</div>
              <div style={{fontSize:11,color:T.textSec}}>Avg strand: {c.avgStrand}% | \u03bb: {c.avgLambda}</div>
            </div>)}
          </div>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Remaining Book Value Over Time</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={Array.from({length:30},(_, t)=>({ year:t, ...Object.fromEntries(COHORTS.map(c=>{ const group=ASSETS.filter(a=>a.vintage===c); const total=group.reduce((s,a)=>s+a.bv0*Math.exp(-a.lambda*t),0); return [c,Math.round(total)]; })) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              {COHORTS.map((c,i)=><Area key={c} type="monotone" dataKey={c} stackId="1" fill={COHORT_COLORS[i]} stroke={COHORT_COLORS[i]} fillOpacity={0.6}/>)}
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Age-Depreciation Curves by Vintage Cohort</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={buildDecayCurve(ASSETS[0],40)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" label={{value:'Years',position:'insideBottom',offset:-5}} tick={{fontSize:11}}/><YAxis domain={[0,100]} tick={{fontSize:11}} label={{value:'BV %',angle:-90,position:'insideLeft'}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/>
              {[0.08,0.05,0.03,0.015].map((l,i)=><Line key={i} data={Array.from({length:40},(_, t)=>({year:t,pct:Math.round(100*Math.exp(-l*t))}))} type="monotone" dataKey="pct" name={`\u03bb=${l}`} stroke={COHORT_COLORS[i]} strokeWidth={2} dot={false}/>)}
              <Legend/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,padding:12,background:T.gold+'11',borderRadius:6,border:`1px solid ${T.gold}33`,fontSize:12,color:T.textSec}}>
            <strong>Formula:</strong> BV(t) = BV&#8320; x exp(-&#955; x t) where &#955; increases with asset vintage age. Pre-2000 assets (\u03bb=0.08) depreciate 4x faster than post-2020 (\u03bb=0.015).
          </div>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Regulatory Closure Risk</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={regRisk.slice(0,12)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={140}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="yearsToRegClosure" name="Years to Reg Closure" fill={T.orange}/><Bar dataKey="complianceCost" name="Compliance Cost ($M)" fill={T.purple}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{overflowX:'auto',marginTop:12}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.mono}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Asset','Vintage','Risk Level','Years to Closure','Compliance Cost'].map(h=><th key={h} style={{padding:'6px',textAlign:'left',color:T.textSec}}>{h}</th>)}</tr></thead>
              <tbody>{regRisk.map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'4px 6px'}}>{r.name}</td><td>{r.vintage}</td>
                <td><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,background:r.closureRisk==='Critical'?T.red+'22':r.closureRisk==='High'?T.orange+'22':r.closureRisk==='Medium'?T.amber+'22':T.green+'22',color:r.closureRisk==='Critical'?T.red:r.closureRisk==='High'?T.orange:r.closureRisk==='Medium'?T.amber:T.green}}>{r.closureRisk}</span></td>
                <td>{r.yearsToRegClosure}y</td><td>${r.complianceCost}M</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Portfolio Vintage Distribution</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart><Pie data={cohortStats.map((c,i)=>({...c,fill:COHORT_COLORS[i]}))} dataKey="totalBV" nameKey="cohort" cx="50%" cy="50%" outerRadius={100} label={({cohort,percent})=>`${cohort}: ${(percent*100).toFixed(0)}%`}>
                {cohortStats.map((_, i)=><Cell key={i} fill={COHORT_COLORS[i]}/>)}</Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
            <div>
              <h4 style={{color:T.navy,fontSize:13,margin:'0 0 8px'}}>Distribution by Book Value</h4>
              {cohortStats.map((c,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <div style={{width:12,height:12,borderRadius:2,background:COHORT_COLORS[i]}}/>
                <span style={{fontSize:12,color:T.navy,width:80}}>{c.cohort}</span>
                <div style={{flex:1,height:16,background:T.border,borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',background:COHORT_COLORS[i],width:`${c.totalBV/20}%`,borderRadius:4}}/></div>
                <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>${c.totalBV}M</span>
              </div>)}
              <div style={{marginTop:16,padding:12,background:T.navy+'08',borderRadius:6,fontSize:12,color:T.textSec}}>
                <strong>Key Insight:</strong> Pre-2000 vintage assets represent the highest stranding risk with average probability of {cohortStats[0].avgStrand}% under {scenario}. Consider accelerated depreciation schedules for this cohort.
              </div>
            </div>
          </div>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export CSV</button>
            <button style={{padding:'8px 16px',background:T.gold+'22',color:T.navy,border:`1px solid ${T.gold}`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Generate Report</button>
            <button style={{padding:'8px 16px',background:'transparent',color:T.textSec,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Share Analysis</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> Book value decay model uses exponential depreciation BV(t)=BV&#8320;e^(-&#955;t) calibrated per vintage cohort. &#955; parameters derived from IEA WEO 2024 asset stranding curves. Regulatory closure timelines based on EU Taxonomy phase-out schedules and US EPA emission standards.
      </div>
    </div>
  );
}
