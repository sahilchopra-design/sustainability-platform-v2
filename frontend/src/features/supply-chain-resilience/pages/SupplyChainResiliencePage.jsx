import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,ScatterChart,Scatter,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const COUNTRIES=['China','India','Vietnam','Bangladesh','Indonesia','Thailand','Malaysia','Mexico','Brazil','Turkey','South Korea','Japan','Germany','USA','UK','Italy','France','Poland','Czech Republic','Romania','South Africa','Nigeria','Kenya','Egypt','Morocco','Philippines','Cambodia','Taiwan','Singapore','Australia'];
const HAZARDS=['Flood','Cyclone','Drought','Heatwave','Wildfire','Sea-Level Rise','Permafrost Thaw','Water Stress'];
const NODE_TYPES=['Factory','Warehouse','Port','Logistics Hub'];
const SECTORS=['Automotive','Electronics','Textiles','Food & Bev','Pharma','Chemicals','Metals','Energy','Consumer Goods','Aerospace'];

const COMPANIES=Array.from({length:60},(_,i)=>{const names=['GlobalTech','SinoManuf','VietProd','IndiaFab','ThaiLogis','MexiParts','BrazilMat','TurkeyTex','KoreaChip','JapanAuto','GermanEng','USRetail','UKPharma','ItalyLux','FranceAero','PolandElec','CzechMach','RomaniaText','SAMining','NigeriaOil','KenyaAgri','EgyptChem','MoroccoFood','PhilipComp','CambodGarm','TaiwanSemi','SingLogis','AusMineral','IndonPalm','MalayRubber','AlphaGlobal','BetaCorp','GammaMfg','DeltaInd','EpsilonTech','ZetaParts','EtaLogis','ThetaProd','IotaMat','KappaTrade','LambdaChip','MuTextile','NuEnergy','XiPharma','OmicronAuto','PiMetals','RhoChemical','SigmaFood','TauConsumer','UpsilonAero','PhiElectro','ChiMachinery','PsiDefense','OmegaRetail','NovaSupply','StellarMfg','OrionParts','VegaLogis','AltairProd','DenebTrade'];
  return{id:i,name:names[i%names.length]+(i>=names.length?` ${Math.floor(i/names.length)+1}`:''),sector:SECTORS[Math.floor(sr(i*97)*SECTORS.length)],country:COUNTRIES[Math.floor(sr(i*53)*COUNTRIES.length)],revenue:Math.round(500+sr(i*31)*9500),exposure:Math.round(20+sr(i*71)*80)};
});

const NODES=Array.from({length:100},(_,i)=>{const country=COUNTRIES[i%30];
  const type=NODE_TYPES[Math.floor(sr(i*41)*4)];
  const throughput=Math.round(100+sr(i*67)*900);
  const substitutability=Math.round(10+sr(i*83)*90);
  const resilience=Math.round(15+sr(i*29)*80);
  const hazards=HAZARDS.map((h,j)=>({name:h,score:Math.round(5+sr(i*100+j*13)*90)}));
  const historicalDisruptions=Math.floor(sr(i*59)*8);
  const adaptationMeasures=['Dual sourcing','Inventory buffer','Facility hardening','Alternative routing','Insurance coverage','Climate monitoring','Emergency protocols','Supplier diversification'];
  const measuresInPlace=adaptationMeasures.filter((_,mi)=>sr(i*200+mi*7)>0.55);
  const criticality=Math.round((throughput/10)*(100-substitutability)/100);
  const companyLinks=Array.from({length:Math.floor(1+sr(i*37)*4)},(_,ci)=>Math.floor(sr(i*300+ci*19)*60));
  return{id:i,name:`${type}-${country.slice(0,3).toUpperCase()}-${String(i+1).padStart(3,'0')}`,type,country,lat:Math.round((-60+sr(i*11)*120)*10)/10,lng:Math.round((-180+sr(i*23)*360)*10)/10,throughput,substitutability,resilience,hazards,historicalDisruptions,measuresInPlace,criticality,companyLinks,revenueAtRisk:Math.round(throughput*sr(i*44)*5)};
});

const QUARTERS=['Q1 2023','Q2 2023','Q3 2023','Q4 2023','Q1 2024','Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025'];
const DISRUPTION_HISTORY=QUARTERS.map((q,qi)=>({quarter:q,events:Math.floor(2+sr(qi*77)*12),costM:Math.round(10+sr(qi*33)*200),avgRecoveryDays:Math.round(5+sr(qi*55)*45),affectedNodes:Math.floor(3+sr(qi*99)*25)}));

const COUNTRY_HAZARD_MAP=COUNTRIES.map((c,ci)=>{const row={country:c};HAZARDS.forEach((h,hi)=>{row[h]=Math.round(5+sr(ci*100+hi*17)*90);});row.composite=Math.round(HAZARDS.reduce((s,h)=>s+row[h],0)/ Math.max(1, HAZARDS.length));return row;});

const SECTOR_VULN=SECTORS.map((s,si)=>({sector:s,vulnerability:Math.round(20+sr(si*61)*75),exposure:Math.round(15+sr(si*43)*80),adaptationGap:Math.round(10+sr(si*89)*60)}));

const pill={display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontFamily:T.mono,fontWeight:600};
const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:12};
const kpiBox={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'14px 18px',textAlign:'center',minWidth:140};
const tabBtn=(a)=>({padding:'8px 20px',border:`1px solid ${a?T.gold:T.border}`,borderBottom:a?`2px solid ${T.gold}`:'1px solid transparent',background:a?T.surface:'transparent',color:a?T.navy:T.textSec,fontFamily:T.mono,fontSize:12,fontWeight:a?700:500,cursor:'pointer',borderRadius:'6px 6px 0 0',letterSpacing:'0.02em'});
const btn=(primary)=>({padding:'8px 16px',border:`1px solid ${primary?T.gold:T.border}`,background:primary?T.gold:'transparent',color:primary?'#fff':T.navy,fontFamily:T.mono,fontSize:12,fontWeight:600,borderRadius:6,cursor:'pointer'});

function KPI({label,value,sub,color}){return(<div style={kpiBox}><div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}</div>);}

function ScoreBar({value,max=100,color}){const c=color||(value>=70?T.green:value>=40?T.amber:T.red);return(<div style={{display:'flex',alignItems:'center',gap:6}}><div style={{flex:1,height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}><div style={{width:`${(value/max)*100}%`,height:'100%',background:c,borderRadius:3}}/></div><span style={{fontSize:11,fontFamily:T.mono,fontWeight:600,color:c,minWidth:28,textAlign:'right'}}>{value}</span></div>);}

function Tab1({nodes,onSelect,selected}){
  const [sortBy,setSortBy]=useState('criticality');
  const [filterCountry,setFilterCountry]=useState('All');
  const [filterType,setFilterType]=useState('All');
  const sorted=useMemo(()=>{let f=[...nodes];if(filterCountry!=='All')f=f.filter(n=>n.country===filterCountry);if(filterType!=='All')f=f.filter(n=>n.type===filterType);f.sort((a,b)=>sortBy==='resilience'?a.resilience-b.resilience:b.criticality-a.criticality);return f;},[nodes,sortBy,filterCountry,filterType]);
  const distData=useMemo(()=>{const bins=Array.from({length:10},(_,i)=>({range:`${i*10}-${i*10+10}`,count:0}));nodes.forEach(n=>{const bi=Math.min(Math.floor(n.resilience/10),9);bins[bi].count++;});return bins;},[nodes]);
  const top10=useMemo(()=>[...nodes].sort((a,b)=>a.resilience-b.resilience).slice(0,10),[nodes]);
  const avgResilience=Math.round(nodes.reduce((s,n)=>s+n.resilience,0)/ Math.max(1, nodes.length));
  const criticalCount=nodes.filter(n=>n.resilience<30).length;
  return(<div>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
      <KPI label="Avg Resilience" value={avgResilience} sub="/100" color={avgResilience>=50?T.sage:T.red}/>
      <KPI label="Critical Nodes" value={criticalCount} sub="score < 30" color={T.red}/>
      <KPI label="High Resilience" value={nodes.filter(n=>n.resilience>=70).length} sub="score >= 70" color={T.green}/>
      <KPI label="Countries" value={new Set(nodes.map(n=>n.country)).size}/>
      <KPI label="Total Throughput" value={`${Math.round(nodes.reduce((s,n)=>s+n.throughput,0)/1000)}K`} sub="units/month"/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>RESILIENCE SCORE DISTRIBUTION</div>
        <ResponsiveContainer width="100%" height={200}><BarChart data={distData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="range" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/><YAxis tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11,borderRadius:6,border:`1px solid ${T.border}`}}/><Bar dataKey="count" radius={[3,3,0,0]}>{distData.map((d,i)=><Cell key={i} fill={i<3?T.red:i<6?T.amber:T.green}/>)}</Bar></BarChart></ResponsiveContainer>
      </div>
      <div style={card}><div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>TOP 10 MOST VULNERABLE NODES</div>
        <div style={{maxHeight:200,overflowY:'auto'}}>{top10.map((n,i)=>(<div key={n.id} onClick={()=>onSelect(n)} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 8px',cursor:'pointer',borderRadius:4,background:selected?.id===n.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
          <span style={{fontSize:11,fontFamily:T.mono,color:T.textMut,width:18}}>#{i+1}</span>
          <span style={{fontSize:12,fontWeight:600,color:T.navy,flex:1}}>{n.name}</span>
          <span style={{fontSize:11,color:T.textSec}}>{n.country}</span>
          <ScoreBar value={n.resilience}/>
        </div>))}</div>
      </div>
    </div>
    <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
      <select value={filterCountry} onChange={e=>setFilterCountry(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:11}}>
        <option value="All">All Countries</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:11}}>
        <option value="All">All Types</option>{NODE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      <button onClick={()=>setSortBy(sortBy==='criticality'?'resilience':'criticality')} style={btn(false)}>Sort: {sortBy==='criticality'?'Criticality':'Resilience'}</button>
      <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{sorted.length} nodes</span>
    </div>
    <div style={{display:'grid',gridTemplateColumns:selected?'1fr 340px':'1fr',gap:16}}>
      <div style={{...card,padding:0,maxHeight:500,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
          <thead><tr style={{background:T.surfaceH,position:'sticky',top:0,zIndex:1}}>
            {['Node','Type','Country','Throughput','Resilience','Criticality','Disruptions'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',fontFamily:T.mono,fontSize:11,color:T.textSec,borderBottom:`1px solid ${T.border}`,fontWeight:600}}>{h}</th>)}
          </tr></thead>
          <tbody>{sorted.map(n=>(<tr key={n.id} onClick={()=>onSelect(n)} style={{cursor:'pointer',background:selected?.id===n.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`}}>
            <td style={{padding:'6px 10px',fontWeight:600,color:T.navy}}>{n.name}</td>
            <td style={{padding:'6px 10px'}}><span style={{...pill,background:n.type==='Factory'?'#dbeafe':n.type==='Port'?'#d1fae5':n.type==='Warehouse'?'#fef3c7':'#f3e8ff',color:n.type==='Factory'?'#1e40af':n.type==='Port'?'#065f46':n.type==='Warehouse'?'#92400e':'#6b21a8'}}>{n.type}</span></td>
            <td style={{padding:'6px 10px',color:T.textSec}}>{n.country}</td>
            <td style={{padding:'6px 10px',fontFamily:T.mono}}>{n.throughput}</td>
            <td style={{padding:'6px 10px',width:120}}><ScoreBar value={n.resilience}/></td>
            <td style={{padding:'6px 10px',fontFamily:T.mono,fontWeight:600}}>{n.criticality}</td>
            <td style={{padding:'6px 10px',fontFamily:T.mono,color:n.historicalDisruptions>4?T.red:T.textSec}}>{n.historicalDisruptions}</td>
          </tr>))}</tbody>
        </table>
      </div>
      {selected&&<div style={{...card,position:'sticky',top:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{selected.name}</div>
          <button onClick={()=>onSelect(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:T.textMut}}>x</button>
        </div>
        <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>{selected.type} | {selected.country} | Lat {selected.lat}, Lng {selected.lng}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
          <div style={{background:T.surfaceH,borderRadius:6,padding:8,textAlign:'center'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>RESILIENCE</div><div style={{fontSize:20,fontWeight:700,color:selected.resilience>=50?T.green:T.red}}>{selected.resilience}</div></div>
          <div style={{background:T.surfaceH,borderRadius:6,padding:8,textAlign:'center'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>CRITICALITY</div><div style={{fontSize:20,fontWeight:700,color:T.navy}}>{selected.criticality}</div></div>
        </div>
        <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6,fontFamily:T.mono}}>HAZARD PROFILE</div>
        {selected.hazards.map(h=>(<div key={h.name} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
          <span style={{fontSize:11,width:100,color:T.textSec}}>{h.name}</span><ScoreBar value={h.score}/>
        </div>))}
        <div style={{fontSize:12,fontWeight:700,color:T.navy,margin:'12px 0 6px',fontFamily:T.mono}}>ADAPTATION MEASURES</div>
        {selected.measuresInPlace.length===0?<div style={{fontSize:11,color:T.red}}>No measures in place</div>:
          selected.measuresInPlace.map(m=><div key={m} style={{...pill,background:'#d1fae5',color:'#065f46',marginBottom:3,marginRight:4}}>{m}</div>)}
        <div style={{fontSize:12,fontWeight:700,color:T.navy,margin:'12px 0 6px',fontFamily:T.mono}}>LINKED COMPANIES</div>
        {selected.companyLinks.map(ci=><div key={ci} style={{fontSize:11,color:T.textSec,padding:'2px 0'}}>{COMPANIES[ci]?.name} ({COMPANIES[ci]?.sector})</div>)}
        <div style={{marginTop:12,fontSize:11,color:T.textMut}}>Historical disruptions: <b style={{color:T.navy}}>{selected.historicalDisruptions}</b> | Revenue at risk: <b style={{color:T.red}}>${selected.revenueAtRisk}M</b></div>
      </div>}
    </div>
  </div>);
}

function Tab2({nodes}){
  const [hazard,setHazard]=useState('Flood');
  const [severity,setSeverity]=useState(3);
  const [duration,setDuration]=useState(14);
  const [location,setLocation]=useState('China');
  const [running,setRunning]=useState(false);
  const [results,setResults]=useState(null);
  const [showSpof,setShowSpof]=useState(false);

  const runModel=useCallback(()=>{
    setRunning(true);setResults(null);
    setTimeout(()=>{
      const affected=nodes.filter(n=>n.country===location&&n.hazards.find(h=>h.name===hazard)?.score>40);
      const companySet=new Set();affected.forEach(n=>n.companyLinks.forEach(c=>companySet.add(c)));
      const affectedCompanies=[...companySet].map(ci=>{const co=COMPANIES[ci];const revImpact=Math.round(co.revenue*severity*0.03*(duration/30));return{...co,revImpact,recoveryDays:Math.round(10+sr(ci*severity)*60)};}).sort((a,b)=>b.revImpact-a.revImpact);
      const totalRevAtRisk=affectedCompanies.reduce((s,c)=>s+c.revImpact,0);
      const eal=Math.round(totalRevAtRisk*0.15);
      setResults({affected,affectedCompanies,totalRevAtRisk,eal,avgRecovery:affectedCompanies.length?Math.round(affectedCompanies.reduce((s,c)=>s+c.recoveryDays,0)/ Math.max(1, affectedCompanies.length)):0});
      setRunning(false);
    },3000);
  },[nodes,hazard,severity,duration,location]);

  const spofNodes=useMemo(()=>nodes.filter(n=>n.substitutability<25&&n.throughput>500).sort((a,b)=>b.criticality-a.criticality),[nodes]);

  const monteCarloData=useMemo(()=>Array.from({length:50},(_,i)=>({sim:i+1,loss:Math.round(50+sr(i*severity*77)*500*(severity/3)),prob:Math.round(sr(i*33)*100)})),[severity]);

  return(<div>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
      <KPI label="Hist. Disruptions (12Q)" value={DISRUPTION_HISTORY.reduce((s,d)=>s+d.events,0)} color={T.amber}/>
      <KPI label="Avg Recovery" value={`${Math.round(DISRUPTION_HISTORY.reduce((s,d)=>s+d.avgRecoveryDays,0)/12)}d`}/>
      <KPI label="Total Cost (12Q)" value={`$${Math.round(DISRUPTION_HISTORY.reduce((s,d)=>s+d.costM,0))}M`} color={T.red}/>
      <KPI label="SPOFs Identified" value={spofNodes.length} sub="low substitutability" color={T.red}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.mono}}>SCENARIO BUILDER</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <div><label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,display:'block',marginBottom:4}}>HAZARD TYPE</label>
            <select value={hazard} onChange={e=>setHazard(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:11}}>{HAZARDS.map(h=><option key={h}>{h}</option>)}</select></div>
          <div><label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,display:'block',marginBottom:4}}>LOCATION</label>
            <select value={location} onChange={e=>setLocation(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:11}}>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,display:'block',marginBottom:4}}>SEVERITY (1-5)</label>
            <input type="range" min={1} max={5} value={severity} onChange={e=>setSeverity(+e.target.value)} style={{width:'100%'}}/><span style={{fontSize:11,fontFamily:T.mono}}> {severity}</span></div>
          <div><label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,display:'block',marginBottom:4}}>DURATION (days)</label>
            <input type="range" min={1} max={90} value={duration} onChange={e=>setDuration(+e.target.value)} style={{width:'100%'}}/><span style={{fontSize:11,fontFamily:T.mono}}> {duration}d</span></div>
        </div>
        <button onClick={runModel} disabled={running} style={{...btn(true),width:'100%',opacity:running?0.6:1}}>
          {running?'Running Disruption Model...':'Run Disruption Model'}
        </button>
        {running&&<div style={{marginTop:12,textAlign:'center'}}><div style={{width:'100%',height:4,background:T.surfaceH,borderRadius:2,overflow:'hidden'}}><div style={{width:'60%',height:'100%',background:T.gold,borderRadius:2,animation:'pulse 1.5s infinite'}}/></div><div style={{fontSize:11,color:T.textMut,marginTop:4,fontFamily:T.mono}}>Simulating cascade effects...</div></div>}
      </div>
      {results?<div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>IMPACT CASCADE RESULTS</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
          <div style={{background:T.surfaceH,borderRadius:6,padding:8,textAlign:'center'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>NODES HIT</div><div style={{fontSize:18,fontWeight:700,color:T.red}}>{results.affected.length}</div></div>
          <div style={{background:T.surfaceH,borderRadius:6,padding:8,textAlign:'center'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>REV AT RISK</div><div style={{fontSize:18,fontWeight:700,color:T.red}}>${results.totalRevAtRisk}M</div></div>
          <div style={{background:T.surfaceH,borderRadius:6,padding:8,textAlign:'center'}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>AVG RECOVERY</div><div style={{fontSize:18,fontWeight:700,color:T.amber}}>{results.avgRecovery}d</div></div>
        </div>
        <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:4}}>Affected Companies ({results.affectedCompanies.length})</div>
        <div style={{maxHeight:160,overflowY:'auto'}}>{results.affectedCompanies.slice(0,15).map((c,i)=>(
          <div key={c.id} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:`1px solid ${T.border}`,fontSize:11}}>
            <span style={{color:T.navy,fontWeight:500}}>{c.name}</span>
            <span style={{color:T.textSec}}>{c.sector}</span>
            <span style={{fontFamily:T.mono,color:T.red,fontWeight:600}}>-${c.revImpact}M</span>
            <span style={{fontFamily:T.mono,color:T.textMut}}>{c.recoveryDays}d</span>
          </div>))}</div>
        <div style={{marginTop:8,fontSize:11,color:T.textMut,fontFamily:T.mono}}>Expected Annual Loss: <b style={{color:T.red}}>${results.eal}M</b></div>
      </div>:<div style={card}><div style={{padding:40,textAlign:'center',color:T.textMut,fontSize:12}}>Configure scenario and run model to see results</div></div>}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>HISTORICAL DISRUPTION TIMELINE (12Q)</div>
        <ResponsiveContainer width="100%" height={220}><AreaChart data={DISRUPTION_HISTORY}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="quarter" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.textMut}/><YAxis yAxisId="left" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11,borderRadius:6,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/><Area yAxisId="left" type="monotone" dataKey="events" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Events"/><Area yAxisId="right" type="monotone" dataKey="costM" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Cost ($M)"/></AreaChart></ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>MONTE CARLO EXPECTED ANNUAL LOSS</div>
        <ResponsiveContainer width="100%" height={220}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sim" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut} name="Simulation"/><YAxis dataKey="loss" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut} name="Loss ($M)"/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11,borderRadius:6,border:`1px solid ${T.border}`}} formatter={(v,n)=>[`$${v}M`,n==='loss'?'Loss':'Probability']}/><Scatter data={monteCarloData} fill={T.navyL} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
      </div>
    </div>
    <div style={card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,fontFamily:T.mono}}>SINGLE POINT OF FAILURE ANALYSIS</div>
        <button onClick={()=>setShowSpof(!showSpof)} style={btn(false)}>{showSpof?'Hide':'Show'} SPOFs ({spofNodes.length})</button>
      </div>
      {showSpof&&<div style={{maxHeight:300,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:T.surfaceH}}>{['Node','Type','Country','Throughput','Substitutability','Criticality','Linked Cos'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',fontFamily:T.mono,fontSize:11,color:T.textSec,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
          <tbody>{spofNodes.map(n=><tr key={n.id} style={{borderBottom:`1px solid ${T.border}`}}>
            <td style={{padding:'5px 10px',fontWeight:600,color:T.navy}}>{n.name}</td>
            <td style={{padding:'5px 10px'}}>{n.type}</td>
            <td style={{padding:'5px 10px',color:T.textSec}}>{n.country}</td>
            <td style={{padding:'5px 10px',fontFamily:T.mono}}>{n.throughput}</td>
            <td style={{padding:'5px 10px',fontFamily:T.mono,color:T.red,fontWeight:600}}>{n.substitutability}%</td>
            <td style={{padding:'5px 10px',fontFamily:T.mono,fontWeight:700}}>{n.criticality}</td>
            <td style={{padding:'5px 10px',fontFamily:T.mono}}>{n.companyLinks.length}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </div>
  </div>);
}

function Tab3(){
  const [scenario,setScenario]=useState('RCP 4.5');
  const [horizon,setHorizon]=useState(2030);
  const [selHazard,setSelHazard]=useState(null);
  const multiplier=scenario==='RCP 8.5'?1.35:1.0;
  const horizonMult=horizon===2040?1.15:horizon===2050?1.35:1.0;
  const adjustedCountryData=useMemo(()=>COUNTRY_HAZARD_MAP.map(row=>{const adj={country:row.country};HAZARDS.forEach(h=>{adj[h]=Math.min(100,Math.round(row[h]*multiplier*horizonMult));});adj.composite=Math.round(HAZARDS.reduce((s,h)=>s+adj[h],0)/ Math.max(1, HAZARDS.length));return adj;}),[multiplier,horizonMult]);
  const companyPhysicalRisk=useMemo(()=>COMPANIES.map(c=>{const cNodes=NODES.filter(n=>n.companyLinks.includes(c.id));const avgExposure=cNodes.length?Math.round(cNodes.reduce((s,n)=>s+n.hazards.reduce((hs,h)=>hs+h.score,0)/8,0)/ Math.max(1, cNodes.length)):0;return{...c,physicalRisk:Math.round(avgExposure*multiplier*horizonMult),nodeCount:cNodes.length};}).sort((a,b)=>b.physicalRisk-a.physicalRisk),[multiplier,horizonMult]);
  const compoundData=useMemo(()=>{const pairs=[['Drought','Heatwave'],['Flood','Cyclone'],['Sea-Level Rise','Cyclone'],['Wildfire','Drought'],['Water Stress','Heatwave'],['Flood','Water Stress']];return pairs.map(([h1,h2],i)=>{const countries=COUNTRY_HAZARD_MAP.filter(r=>r[h1]>50&&r[h2]>50);return{pair:`${h1} + ${h2}`,countriesExposed:countries.length,avgCompound:countries.length?Math.round(countries.reduce((s,r)=>s+(r[h1]+r[h2])/2,0)/ Math.max(1, countries.length)):0};});},[]);
  const adaptRecs=useMemo(()=>HAZARDS.map((h,i)=>{const recs=['Flood barriers & drainage infrastructure','Storm-resistant construction & early warning','Water recycling & drought-resistant crops','Cooling systems & heat action plans','Firebreaks & vegetation management','Coastal defenses & relocation planning','Foundation reinforcement & thermal monitoring','Water efficiency & alternative sourcing'];return{hazard:h,recommendation:recs[i],investmentM:Math.round(10+sr(i*44)*90),roi:Math.round(120+sr(i*66)*280)};}),[]);

  return(<div>
    <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
      <div style={{display:'flex',gap:4}}>{['RCP 4.5','RCP 8.5'].map(s=><button key={s} onClick={()=>setScenario(s)} style={{...btn(scenario===s),fontSize:11}}>{s}</button>)}</div>
      <div style={{display:'flex',gap:4,alignItems:'center'}}><span style={{fontSize:11,fontFamily:T.mono,color:T.textMut}}>Horizon:</span>{[2030,2040,2050].map(y=><button key={y} onClick={()=>setHorizon(y)} style={{...btn(horizon===y),fontSize:11}}>{y}</button>)}</div>
      <span style={{fontSize:11,fontFamily:T.mono,color:T.textMut}}>Scenario: {scenario} | Horizon: {horizon}</span>
    </div>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
      <KPI label="Avg Composite Risk" value={Math.round(adjustedCountryData.reduce((s,r)=>s+r.composite,0)/30)} sub={`${scenario} ${horizon}`} color={T.amber}/>
      <KPI label="High Risk Countries" value={adjustedCountryData.filter(r=>r.composite>60).length} sub=">60 composite" color={T.red}/>
      <KPI label="Companies Exposed" value={companyPhysicalRisk.filter(c=>c.physicalRisk>50).length} sub=">50 physical risk" color={T.red}/>
      <KPI label="Compound Hotspots" value={compoundData.reduce((s,c)=>s+c.countriesExposed,0)} color={T.amber}/>
    </div>
    <div style={{...card,marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,fontFamily:T.mono}}>COUNTRY x HAZARD EXPOSURE MATRIX</div>
        {selHazard&&<button onClick={()=>setSelHazard(null)} style={btn(false)}>Clear filter</button>}
      </div>
      <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr style={{background:T.surfaceH,position:'sticky',top:0,zIndex:1}}>
            <th style={{padding:'6px 8px',textAlign:'left',fontFamily:T.mono,color:T.textSec,borderBottom:`1px solid ${T.border}`,position:'sticky',left:0,background:T.surfaceH}}>Country</th>
            {HAZARDS.map(h=><th key={h} onClick={()=>setSelHazard(selHazard===h?null:h)} style={{padding:'6px 8px',textAlign:'center',fontFamily:T.mono,color:selHazard===h?T.gold:T.textSec,borderBottom:`1px solid ${T.border}`,cursor:'pointer',fontWeight:selHazard===h?700:500}}>{h}</th>)}
            <th style={{padding:'6px 8px',textAlign:'center',fontFamily:T.mono,color:T.navy,borderBottom:`1px solid ${T.border}`,fontWeight:700}}>Composite</th>
          </tr></thead>
          <tbody>{adjustedCountryData.sort((a,b)=>selHazard?b[selHazard]-a[selHazard]:b.composite-a.composite).map(r=>(
            <tr key={r.country} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'5px 8px',fontWeight:600,color:T.navy,position:'sticky',left:0,background:T.surface}}>{r.country}</td>
              {HAZARDS.map(h=>{const v=r[h];const bg=v>75?'#fecaca':v>50?'#fed7aa':v>25?'#fef9c3':'#d1fae5';return<td key={h} style={{padding:'5px 8px',textAlign:'center',fontFamily:T.mono,fontWeight:selHazard===h?700:400,background:bg,color:v>75?T.red:v>50?T.amber:v>25?'#854d0e':T.green}}>{v}</td>;})}
              <td style={{padding:'5px 8px',textAlign:'center',fontFamily:T.mono,fontWeight:700,color:r.composite>60?T.red:r.composite>40?T.amber:T.green}}>{r.composite}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>SECTOR VULNERABILITY RANKING</div>
        <ResponsiveContainer width="100%" height={240}><BarChart data={SECTOR_VULN} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/><YAxis dataKey="sector" type="category" width={100} tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11,borderRadius:6,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/><Bar dataKey="vulnerability" fill={T.red} fillOpacity={0.7} name="Vulnerability" radius={[0,3,3,0]}/><Bar dataKey="adaptationGap" fill={T.amber} fillOpacity={0.7} name="Adaptation Gap" radius={[0,3,3,0]}/></BarChart></ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>COMPOUND HAZARD ANALYSIS</div>
        <ResponsiveContainer width="100%" height={240}><BarChart data={compoundData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="pair" tick={{fontSize:9,fontFamily:T.mono}} stroke={T.textMut}/><YAxis tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11,borderRadius:6,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/><Bar dataKey="countriesExposed" fill={T.navyL} name="Countries Exposed" radius={[3,3,0,0]}/><Bar dataKey="avgCompound" fill={T.red} fillOpacity={0.6} name="Avg Compound Score" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>COMPANY PHYSICAL RISK AGGREGATION</div>
        <div style={{maxHeight:300,overflowY:'auto'}}>
          {companyPhysicalRisk.slice(0,20).map((c,i)=>(
            <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:11,fontFamily:T.mono,color:T.textMut,width:20}}>#{i+1}</span>
              <span style={{fontSize:12,fontWeight:600,color:T.navy,flex:1}}>{c.name}</span>
              <span style={{fontSize:11,color:T.textSec,width:60}}>{c.nodeCount} nodes</span>
              <div style={{width:100}}><ScoreBar value={Math.min(100,c.physicalRisk)}/></div>
            </div>))}
        </div>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>ADAPTATION INVESTMENT RECOMMENDATIONS</div>
        <div style={{maxHeight:300,overflowY:'auto'}}>
          {adaptRecs.map(r=>(
            <div key={r.hazard} style={{padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                <span style={{fontSize:12,fontWeight:600,color:T.navy}}>{r.hazard}</span>
                <span style={{fontSize:11,fontFamily:T.mono,color:T.green}}>ROI: {r.roi}%</span>
              </div>
              <div style={{fontSize:11,color:T.textSec}}>{r.recommendation}</div>
              <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut}}>Est. investment: ${r.investmentM}M</div>
            </div>))}
        </div>
      </div>
    </div>
  </div>);
}

function Tab4({nodes}){
  const [selNode,setSelNode]=useState(nodes[0]?.id||0);
  const [diversify,setDiversify]=useState(50);
  const [buffer,setBuffer]=useState(30);
  const [routing,setRouting]=useState(40);
  const [hardening,setHardening]=useState(60);

  const node=nodes.find(n=>n.id===selNode)||nodes[0];
  const adaptationOptions=[
    {name:'Supplier Diversification',slider:diversify,setSlider:setDiversify,costPerUnit:0.12,resilienceGain:0.35,icon:'D'},
    {name:'Inventory Buffering',slider:buffer,setSlider:setBuffer,costPerUnit:0.08,resilienceGain:0.2,icon:'B'},
    {name:'Alternative Routing',slider:routing,setSlider:setRouting,costPerUnit:0.15,resilienceGain:0.25,icon:'R'},
    {name:'Facility Hardening',slider:hardening,setSlider:setHardening,costPerUnit:0.2,resilienceGain:0.4,icon:'H'},
  ];
  const totalCost=Math.round(adaptationOptions.reduce((s,o)=>s+o.slider*o.costPerUnit*node.throughput/100,0)*10)/10;
  const resilienceGain=Math.round(adaptationOptions.reduce((s,o)=>s+o.slider*o.resilienceGain,0)/100);
  const newResilience=Math.min(100,node.resilience+resilienceGain);
  const roi=totalCost>0?Math.round((node.revenueAtRisk*resilienceGain/100)/totalCost*100):0;

  const progressData=useMemo(()=>nodes.slice(0,30).map(n=>({name:n.name.slice(0,12),planned:Math.round(20+sr(n.id*77)*60),inProgress:Math.round(10+sr(n.id*88)*40),completed:Math.round(5+sr(n.id*99)*35)})),[nodes]);

  const insuranceGaps=useMemo(()=>nodes.filter(n=>n.resilience<40).slice(0,20).map(n=>{const covered=Math.round(20+sr(n.id*123)*50);const needed=Math.round(covered+10+sr(n.id*456)*50);return{name:n.name,country:n.country,covered,needed,gap:needed-covered};}).sort((a,b)=>b.gap-a.gap),[nodes]);

  const redesignScenarios=useMemo(()=>[
    {name:'Nearshoring',description:'Move 30% production to regional hubs',costM:Math.round(50+sr(11)*200),resilienceImprove:18,timeMonths:24},
    {name:'Dual Sourcing',description:'Add backup supplier for all critical nodes',costM:Math.round(30+sr(22)*100),resilienceImprove:22,timeMonths:12},
    {name:'Regional Hub Model',description:'Create 5 regional distribution centers',costM:Math.round(100+sr(33)*300),resilienceImprove:30,timeMonths:36},
    {name:'Digital Twin',description:'Full supply chain digital twin for real-time monitoring',costM:Math.round(20+sr(44)*80),resilienceImprove:15,timeMonths:18},
    {name:'Climate-Resilient Sites',description:'Relocate top 10 vulnerable nodes to low-risk areas',costM:Math.round(200+sr(55)*400),resilienceImprove:35,timeMonths:48},
  ],[]);

  const exportCSV=useCallback(()=>{
    const headers=['Node','Type','Country','Resilience','Criticality','Throughput','Top Hazard','Top Hazard Score','Measures','Revenue at Risk ($M)'];
    const rows=nodes.map(n=>{const topH=n.hazards.reduce((a,b)=>a.score>b.score?a:b);return[n.name,n.type,n.country,n.resilience,n.criticality,n.throughput,topH.name,topH.score,n.measuresInPlace.join('; '),n.revenueAtRisk].join(',');});
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='supply_chain_resilience_report.csv';a.click();URL.revokeObjectURL(url);
  },[nodes]);

  return(<div>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
      <KPI label="Nodes Needing Adaptation" value={nodes.filter(n=>n.resilience<50).length} color={T.amber}/>
      <KPI label="Avg Insurance Gap" value={`$${insuranceGaps.length?Math.round(insuranceGaps.reduce((s,g)=>s+g.gap,0)/ Math.max(1, insuranceGaps.length)):0}M`} color={T.red}/>
      <KPI label="Adaptation Budget" value={`$${totalCost}M`} sub="current config"/>
      <KPI label="Projected ROI" value={`${roi}%`} color={roi>100?T.green:T.amber}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12,fontFamily:T.mono}}>ADAPTATION COST-BENEFIT CALCULATOR</div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:T.textMut,fontFamily:T.mono,display:'block',marginBottom:4}}>SELECT NODE</label>
          <select value={selNode} onChange={e=>setSelNode(+e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:11}}>
            {nodes.map(n=><option key={n.id} value={n.id}>{n.name} ({n.country}) - Resilience: {n.resilience}</option>)}
          </select>
        </div>
        {adaptationOptions.map(o=>(
          <div key={o.name} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
              <span style={{fontSize:12,fontWeight:600,color:T.navy}}>{o.icon} {o.name}</span>
              <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>{o.slider}%</span>
            </div>
            <input type="range" min={0} max={100} value={o.slider} onChange={e=>o.setSlider(+e.target.value)} style={{width:'100%'}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut,fontFamily:T.mono}}>
              <span>Cost: ${Math.round(o.slider*o.costPerUnit*node.throughput/100*10)/10}M</span>
              <span>+{Math.round(o.slider*o.resilienceGain/100)} resilience</span>
            </div>
          </div>))}
        <div style={{background:T.surfaceH,borderRadius:6,padding:12,marginTop:8}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,textAlign:'center'}}>
            <div><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>TOTAL COST</div><div style={{fontSize:16,fontWeight:700,color:T.navy}}>${totalCost}M</div></div>
            <div><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>NEW RESILIENCE</div><div style={{fontSize:16,fontWeight:700,color:newResilience>=60?T.green:T.amber}}>{node.resilience} -> {newResilience}</div></div>
            <div><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>ROI</div><div style={{fontSize:16,fontWeight:700,color:roi>100?T.green:T.amber}}>{roi}%</div></div>
          </div>
        </div>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>ADAPTATION PROGRESS TRACKER</div>
        <ResponsiveContainer width="100%" height={300}><BarChart data={progressData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} stroke={T.textMut}/><YAxis dataKey="name" type="category" width={90} tick={{fontSize:9,fontFamily:T.mono}} stroke={T.textMut}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11,borderRadius:6,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/><Bar dataKey="completed" stackId="a" fill={T.green} name="Completed"/><Bar dataKey="inProgress" stackId="a" fill={T.amber} name="In Progress"/><Bar dataKey="planned" stackId="a" fill={T.navyL} fillOpacity={0.3} name="Planned"/></BarChart></ResponsiveContainer>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>INSURANCE GAP ANALYSIS</div>
        <div style={{maxHeight:300,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr style={{background:T.surfaceH,position:'sticky',top:0}}>{['Node','Country','Covered','Needed','Gap'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',fontFamily:T.mono,color:T.textSec,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
            <tbody>{insuranceGaps.map(g=>(
              <tr key={g.name} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'5px 8px',fontWeight:600,color:T.navy}}>{g.name}</td>
                <td style={{padding:'5px 8px',color:T.textSec}}>{g.country}</td>
                <td style={{padding:'5px 8px',fontFamily:T.mono,color:T.green}}>${g.covered}M</td>
                <td style={{padding:'5px 8px',fontFamily:T.mono,color:T.navy}}>${g.needed}M</td>
                <td style={{padding:'5px 8px',fontFamily:T.mono,fontWeight:700,color:T.red}}>${g.gap}M</td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8,fontFamily:T.mono}}>SUPPLY CHAIN REDESIGN SIMULATOR</div>
        <div style={{maxHeight:300,overflowY:'auto'}}>
          {redesignScenarios.map(s=>(
            <div key={s.name} style={{padding:'10px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:700,color:T.navy}}>{s.name}</span>
                <span style={{...pill,background:'#dbeafe',color:'#1e40af'}}>{s.timeMonths} months</span>
              </div>
              <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>{s.description}</div>
              <div style={{display:'flex',gap:16,fontSize:11,fontFamily:T.mono}}>
                <span style={{color:T.red}}>Cost: ${s.costM}M</span>
                <span style={{color:T.green}}>+{s.resilienceImprove} resilience</span>
                <span style={{color:T.navy}}>ROI: {Math.round((s.resilienceImprove*50)/s.costM*100)}%</span>
              </div>
            </div>))}
        </div>
      </div>
    </div>
    <div style={{textAlign:'right'}}>
      <button onClick={exportCSV} style={btn(true)}>Export Resilience Report CSV</button>
    </div>
  </div>);
}

export default function SupplyChainResiliencePage(){
  const [tab,setTab]=useState(0);
  const [selectedNode,setSelectedNode]=useState(null);
  const tabs=['Resilience Scoring','Disruption Modelling','Climate Hazard Exposure','Adaptation Planning'];
  const totalNodes=NODES.length;
  const avgResilience=Math.round(NODES.reduce((s,n)=>s+n.resilience,0)/totalNodes);
  const criticalNodes=NODES.filter(n=>n.resilience<30).length;

  return(<div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',color:T.text}}>
    <div style={{borderBottom:`1px solid ${T.border}`,background:T.surface,padding:'18px 28px 0'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.gold,letterSpacing:'0.1em',marginBottom:4}}>EP-AP5</div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Supply Chain Climate Resilience</h1>
          <p style={{fontSize:12,color:T.textSec,margin:'4px 0 0'}}>Physical climate risk to supply chains | Disruption modelling | Resilience scoring | Adaptation planning</p>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <div style={{...pill,background:criticalNodes>10?'#fecaca':'#fef3c7',color:criticalNodes>10?T.red:T.amber}}>{criticalNodes} critical</div>
          <div style={{...pill,background:'#d1fae5',color:T.green}}>Avg: {avgResilience}/100</div>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut}}>{totalNodes} nodes | {COMPANIES.length} cos | {COUNTRIES.length} countries</div>
        </div>
      </div>
      <div style={{display:'flex',gap:0,marginTop:8}}>
        {tabs.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={tabBtn(tab===i)}>{t}</button>)}
      </div>
    </div>
    <div style={{padding:'20px 28px',maxWidth:1400,margin:'0 auto'}}>
      {tab===0&&<Tab1 nodes={NODES} onSelect={setSelectedNode} selected={selectedNode}/>}
      {tab===1&&<Tab2 nodes={NODES}/>}
      {tab===2&&<Tab3/>}
      {tab===3&&<Tab4 nodes={NODES}/>}
    </div>
    <div style={{borderTop:`1px solid ${T.border}`,background:T.surface,padding:'8px 28px',display:'flex',justifyContent:'space-between',fontSize:11,fontFamily:T.mono,color:T.textMut}}>
      <span>Supply Chain Climate Resilience v1.0 | {totalNodes} nodes across {COUNTRIES.length} countries | 8 hazard types | 12Q history</span>
      <span>{COMPANIES.length} companies | {SECTORS.length} sectors | {HAZARDS.length} hazards | Data: deterministic seed</span>
    </div>
  </div>);
}
