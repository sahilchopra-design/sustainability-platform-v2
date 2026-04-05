import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Disruption Signal Dashboard','Patent Trend Analysis','VC/PE Investment Tracker','Cost Crossover Countdown','Adoption Tipping Points','Portfolio Exposure'];

const DISRUPTIONS = [
  { id:'D1', name:'Solid-State Batteries', trl:6, patentTrend:'+42%', vcFunding:8.2, yearsToCrossover:4, adoptionPct:2, tippingPoint:2030, exposedSectors:['Auto OEM','Battery Mfg','Mining'], signal:'Strong', color:T.blue },
  { id:'D2', name:'Perovskite Solar', trl:7, patentTrend:'+65%', vcFunding:3.1, yearsToCrossover:3, adoptionPct:1, tippingPoint:2029, exposedSectors:['Solar Si','Utilities'], signal:'Strong', color:T.orange },
  { id:'D3', name:'Green Steel (H\u2082-DRI)', trl:6, patentTrend:'+28%', vcFunding:5.4, yearsToCrossover:5, adoptionPct:3, tippingPoint:2032, exposedSectors:['Steel BF','Mining','Coking Coal'], signal:'Medium', color:T.green },
  { id:'D4', name:'E-Fuels / SAF', trl:5, patentTrend:'+55%', vcFunding:4.8, yearsToCrossover:7, adoptionPct:1, tippingPoint:2035, exposedSectors:['Aviation','Shipping','Oil Refining'], signal:'Medium', color:T.purple },
  { id:'D5', name:'Fusion Energy', trl:3, patentTrend:'+38%', vcFunding:6.2, yearsToCrossover:15, adoptionPct:0, tippingPoint:2045, exposedSectors:['All Energy','Nuclear Fission'], signal:'Weak', color:T.red },
  { id:'D6', name:'Autonomous EVs', trl:5, patentTrend:'+72%', vcFunding:12.5, yearsToCrossover:6, adoptionPct:5, tippingPoint:2033, exposedSectors:['ICE Auto','Oil & Gas','Insurance'], signal:'Strong', color:T.navy },
  { id:'D7', name:'AI Grid Management', trl:7, patentTrend:'+88%', vcFunding:2.8, yearsToCrossover:2, adoptionPct:15, tippingPoint:2027, exposedSectors:['Grid Operators','Utilities'], signal:'Very Strong', color:T.teal },
  { id:'D8', name:'Carbon Mineralization', trl:4, patentTrend:'+35%', vcFunding:1.9, yearsToCrossover:8, adoptionPct:0, tippingPoint:2036, exposedSectors:['Cement','Mining'], signal:'Medium', color:T.sage },
  { id:'D9', name:'Cultured Meat', trl:5, patentTrend:'+48%', vcFunding:3.5, yearsToCrossover:6, adoptionPct:1, tippingPoint:2034, exposedSectors:['Livestock','Feed','Agri'], signal:'Medium', color:'#854d0e' },
  { id:'D10', name:'Vertical Farming', trl:7, patentTrend:'+25%', vcFunding:4.1, yearsToCrossover:4, adoptionPct:3, tippingPoint:2031, exposedSectors:['Agri','Real Estate','Food Retail'], signal:'Medium', color:'#059669' },
  { id:'D11', name:'Small Modular Reactors', trl:6, patentTrend:'+22%', vcFunding:5.8, yearsToCrossover:5, adoptionPct:0, tippingPoint:2032, exposedSectors:['Gas Power','Renewables'], signal:'Medium', color:T.amber },
  { id:'D12', name:'Direct Lithium Extraction', trl:5, patentTrend:'+58%', vcFunding:2.4, yearsToCrossover:3, adoptionPct:5, tippingPoint:2029, exposedSectors:['Li Mining','Brine Ops'], signal:'Strong', color:'#6d28d9' },
  { id:'D13', name:'Long-Duration Storage', trl:5, patentTrend:'+45%', vcFunding:3.8, yearsToCrossover:4, adoptionPct:2, tippingPoint:2030, exposedSectors:['Gas Peakers','Grid'], signal:'Strong', color:'#0f766e' },
  { id:'D14', name:'Next-Gen Geothermal', trl:4, patentTrend:'+32%', vcFunding:2.1, yearsToCrossover:6, adoptionPct:1, tippingPoint:2033, exposedSectors:['Gas Power','Heat Networks'], signal:'Medium', color:'#b91c1c' },
  { id:'D15', name:'Quantum Computing (Materials)', trl:3, patentTrend:'+95%', vcFunding:9.4, yearsToCrossover:12, adoptionPct:0, tippingPoint:2040, exposedSectors:['Pharma','Materials','Crypto'], signal:'Weak', color:'#4f46e5' },
];

const patentHistory = Array.from({length:6},(_, i)=>{
  const yr=2020+i;
  return { year:yr, solidState:1200+i*520, perovskite:800+i*480, greenSteel:400+i*180, fusion:300+i*120, aiGrid:500+i*650 };
});

const vcHistory = Array.from({length:6},(_, i)=>{
  const yr=2020+i;
  return { year:yr, solidState:1.2+i*1.4, autonomousEV:3.0+i*1.9, fusion:0.5+i*1.1, eFuels:0.3+i*0.9, aiGrid:0.4+i*0.5 };
});

const PORTFOLIO_COMPANIES = [
  { company:'Toyota', sector:'Auto OEM', exposure:['Solid-State Batteries','Autonomous EVs'], riskLevel:'High', mktCap:250 },
  { company:'ArcelorMittal', sector:'Steel BF', exposure:['Green Steel (H\u2082-DRI)'], riskLevel:'Critical', mktCap:28 },
  { company:'Shell', sector:'Oil & Gas', exposure:['Autonomous EVs','E-Fuels / SAF','Green Steel (H\u2082-DRI)'], riskLevel:'High', mktCap:210 },
  { company:'Heidelberg Materials', sector:'Cement', exposure:['Carbon Mineralization'], riskLevel:'Medium', mktCap:18 },
  { company:'Duke Energy', sector:'Utility', exposure:['AI Grid Management','Small Modular Reactors','Long-Duration Storage'], riskLevel:'Medium', mktCap:80 },
  { company:'JBS S.A.', sector:'Livestock', exposure:['Cultured Meat'], riskLevel:'Medium', mktCap:15 },
  { company:'Albemarle', sector:'Li Mining', exposure:['Direct Lithium Extraction','Solid-State Batteries'], riskLevel:'High', mktCap:12 },
  { company:'Rolls-Royce', sector:'Aviation/Nuclear', exposure:['E-Fuels / SAF','Small Modular Reactors'], riskLevel:'Medium', mktCap:45 },
];

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function TechDisruptionWatchlistPage(){
  const [tab,setTab]=useState(0);
  const [sortBy,setSortBy]=useState('crossover');
  const [signalFilter,setSignalFilter]=useState('All');
  const [watchlist,setWatchlist]=useState(['D1','D2','D6','D7']);

  const filtered = useMemo(()=>{
    let d=[...DISRUPTIONS];
    if(signalFilter!=='All') d=d.filter(x=>x.signal===signalFilter);
    d.sort((a,b)=>sortBy==='crossover'?a.yearsToCrossover-b.yearsToCrossover:sortBy==='vc'?b.vcFunding-a.vcFunding:b.trl-a.trl);
    return d;
  },[sortBy,signalFilter]);

  const totalVC = DISRUPTIONS.reduce((s,d)=>s+d.vcFunding,0);
  const strongSignals = DISRUPTIONS.filter(d=>d.signal==='Strong'||d.signal==='Very Strong').length;
  const nearCrossover = DISRUPTIONS.filter(d=>d.yearsToCrossover<=4).length;

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CL6" label="Technology Disruption Watchlist & Signals" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Technology Disruption Watchlist</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>15 technology disruptions tracked: TRL, patent trends, VC funding, cost crossover countdown, portfolio exposure</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <label style={{fontSize:12,color:T.textSec}}>Sort:</label>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}><option value="crossover">Crossover (Nearest)</option><option value="vc">VC Funding</option><option value="trl">TRL</option></select>
        <label style={{fontSize:12,color:T.textSec}}>Signal:</label>
        <select value={signalFilter} onChange={e=>setSignalFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>{['All','Very Strong','Strong','Medium','Weak'].map(s=><option key={s}>{s}</option>)}</select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Disruptions Tracked" value={DISRUPTIONS.length} sub="active monitoring"/></Card>
        <Card><KPI label="Total VC Funding" value={`$${totalVC.toFixed(1)}B`} sub="2024 investments"/></Card>
        <Card><KPI label="Strong Signals" value={strongSignals} sub="accelerating disruptions" color={T.green}/></Card>
        <Card><KPI label="Near Crossover" value={nearCrossover} sub="within 4 years" color={T.orange}/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Disruption Signal Dashboard</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.mono}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Technology','TRL','Patents','VC ($B)','Crossover','Adoption','Signal','Tipping','Watch'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
              </tr></thead>
              <tbody>{filtered.map(d=><tr key={d.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px',fontWeight:600,color:d.color}}>{d.name}</td>
                <td><div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:30,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',background:d.trl>=7?T.green:d.trl>=5?T.amber:T.red,width:`${d.trl*11}%`}}/></div>{d.trl}</div></td>
                <td style={{color:T.green}}>{d.patentTrend}</td>
                <td>${d.vcFunding}B</td>
                <td style={{color:d.yearsToCrossover<=3?T.red:d.yearsToCrossover<=5?T.orange:T.textSec,fontWeight:700}}>{d.yearsToCrossover}y</td>
                <td>{d.adoptionPct}%</td>
                <td><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,background:d.signal==='Very Strong'?T.green+'22':d.signal==='Strong'?T.blue+'22':d.signal==='Medium'?T.amber+'22':T.red+'22',color:d.signal==='Very Strong'?T.green:d.signal==='Strong'?T.blue:d.signal==='Medium'?T.amber:T.red}}>{d.signal}</span></td>
                <td>{d.tippingPoint}</td>
                <td><button onClick={()=>setWatchlist(w=>w.includes(d.id)?w.filter(x=>x!==d.id):[...w,d.id])} style={{background:watchlist.includes(d.id)?T.gold+'22':'transparent',border:`1px solid ${T.border}`,borderRadius:4,padding:'2px 8px',cursor:'pointer',fontSize:10}}>{watchlist.includes(d.id)?'Watching':'+ Watch'}</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Patent Trend Analysis</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={patentHistory}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Line type="monotone" dataKey="solidState" name="Solid-State Batteries" stroke={T.blue} strokeWidth={2}/>
              <Line type="monotone" dataKey="perovskite" name="Perovskite Solar" stroke={T.orange} strokeWidth={2}/>
              <Line type="monotone" dataKey="greenSteel" name="Green Steel" stroke={T.green} strokeWidth={2}/>
              <Line type="monotone" dataKey="aiGrid" name="AI Grid Mgmt" stroke={T.teal} strokeWidth={2}/>
              <Line type="monotone" dataKey="fusion" name="Fusion" stroke={T.red} strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{marginTop:8,fontSize:12,color:T.textSec}}>Patent filings as a leading indicator: AI Grid Management shows 88% YoY growth, signaling imminent commercial deployment. Perovskite solar patent activity at 65% YoY suggests breakthrough timeline shortening.</div>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>VC/PE Investment Tracker ($B)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={vcHistory}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Area type="monotone" dataKey="autonomousEV" name="Autonomous EVs" stackId="1" fill={T.navy+'66'} stroke={T.navy}/>
              <Area type="monotone" dataKey="solidState" name="Solid-State Batteries" stackId="1" fill={T.blue+'66'} stroke={T.blue}/>
              <Area type="monotone" dataKey="fusion" name="Fusion" stackId="1" fill={T.red+'66'} stroke={T.red}/>
              <Area type="monotone" dataKey="eFuels" name="E-Fuels" stackId="1" fill={T.purple+'66'} stroke={T.purple}/>
              <Area type="monotone" dataKey="aiGrid" name="AI Grid" stackId="1" fill={T.teal+'66'} stroke={T.teal}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Cost Crossover Countdown</h3>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={DISRUPTIONS.sort((a,b)=>a.yearsToCrossover-b.yearsToCrossover)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,16]} tick={{fontSize:11}} label={{value:'Years to Cost Crossover',position:'insideBottom',offset:-5}}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={180}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/>
              <Bar dataKey="yearsToCrossover" name="Years">{DISRUPTIONS.map((d,i)=><Cell key={i} fill={d.yearsToCrossover<=3?T.green:d.yearsToCrossover<=5?T.amber:d.yearsToCrossover<=8?T.orange:T.red}/>)}</Bar>
              <ReferenceLine x={4} stroke={T.red} strokeDasharray="5 5" label={{value:'Near-term',fill:T.red,fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Adoption Tipping Points</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={DISRUPTIONS.sort((a,b)=>a.tippingPoint-b.tippingPoint).slice(0,10)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9}} angle={-15}/><YAxis yAxisId="left" tick={{fontSize:11}}/><YAxis yAxisId="right" orientation="right" domain={[0,20]} tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar yAxisId="left" dataKey="tippingPoint" name="Tipping Point Year">{DISRUPTIONS.slice(0,10).map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar>
              <Line yAxisId="right" type="monotone" dataKey="adoptionPct" name="Current Adoption %" stroke={T.navy} strokeWidth={2}/>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,padding:10,background:T.amber+'11',borderRadius:6,fontSize:12,color:T.textSec}}>
            Tipping point = the year when technology reaches 16% market penetration (S-curve inflection). Technologies past 5% adoption are on the exponential portion of the S-curve.
          </div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Portfolio Exposure</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Company','Sector','Market Cap ($B)','Exposed To','Risk Level'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
              </tr></thead>
              <tbody>{PORTFOLIO_COMPANIES.map((c,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px',fontWeight:600}}>{c.company}</td><td>{c.sector}</td>
                <td style={{fontFamily:T.mono}}>${c.mktCap}B</td>
                <td><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{c.exposure.map((e,j)=><span key={j} style={{padding:'2px 6px',borderRadius:4,fontSize:10,background:T.navy+'11',color:T.navy}}>{e}</span>)}</div></td>
                <td><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:c.riskLevel==='Critical'?T.red+'22':c.riskLevel==='High'?T.orange+'22':T.amber+'22',color:c.riskLevel==='Critical'?T.red:c.riskLevel==='High'?T.orange:T.amber}}>{c.riskLevel}</span></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export Watchlist</button>
            <button style={{padding:'8px 16px',background:T.gold+'22',color:T.navy,border:`1px solid ${T.gold}`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Generate Disruption Report</button>
            <button style={{padding:'8px 16px',background:'transparent',color:T.textSec,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Configure Alerts</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> TRL assessments from DOE/ARPA-E and EU Horizon programme classifications. Patent data from WIPO/Espacenet analytics. VC funding from PitchBook/Crunchbase Energy & Climate Tech reports. Cost crossover analysis based on Wright's Law learning curves and BNEF technology cost benchmarks. S-curve adoption model follows Bass diffusion framework.
      </div>
    </div>
  );
}
