import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,ScatterChart,Scatter,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const TABS=['Technology Landscape','Investment Analytics','Impact Assessment','Portfolio Exposure'];
const SECTORS=['Solar & PV','Wind Energy','Green Hydrogen','Carbon Capture','Battery Storage','Nuclear (SMR)','Geothermal','Sustainable Fuels','EV & Mobility','Grid & Efficiency'];
const STAGES=['Seed','Series A','Series B','Series C+','Growth','Pre-IPO','Public'];
const GEOS=['North America','Europe','China','India','Asia Pacific','Latin America','Middle East','Africa'];
const TRL_LABELS=['TRL 1','TRL 2','TRL 3','TRL 4','TRL 5','TRL 6','TRL 7','TRL 8','TRL 9'];
const PIE_C=[T.navy,T.gold,T.sage,T.red,T.amber,'#7c3aed','#0284c7','#db2777','#6b7280','#059669'];

const COMPANIES=Array.from({length:80},(_,i)=>{
  const names=['Enphase Energy','First Solar','SunPower Corp','Canadian Solar','JinkoSolar','Vestas Wind','Siemens Gamesa','Orsted','Nordex SE','GE Vernova','Plug Power','Nel ASA','ITM Power','Bloom Energy','Green Hydrogen Systems','Climeworks','Carbon Engineering','Heirloom Carbon','Global Thermostat','Charm Industrial','QuantumScape','Tesla Energy','CATL','BYD Company','Solid Power','Fervo Energy','Ormat Technologies','Eavor Technologies','Quaise Energy','Baker Hughes Geo','Neste Corporation','Gevo Inc','LanzaTech','Velocys','SunFire GmbH','Rivian Automotive','Lucid Motors','Nio Inc','Proterra Inc','Arrival SA','Fluence Energy','Stem Inc','Sungrow Power','Shoals Technologies','Array Technologies','NextEra Energy','Brookfield Renewable','Clearway Energy','Enel Green Power','Iberdrola Renewables','Northvolt','Redwood Materials','Li-Cycle','Enovix Corp','EnerVenue','Form Energy','ESS Inc','Ambri Inc','Malta Inc','Energy Vault','NuScale Power','Kairos Power','TerraPower','X-energy','Commonwealth Fusion','Helion Energy','TAE Technologies','Zap Energy','General Fusion','Tokamak Energy','CarbonCure Technologies','Twelve Benefit','Prometheus Fuels','Svante Inc','Carbon Clean','H2 Green Steel','Boston Metal','Heliogen Inc','Dandelion Energy','BrightDrop'];
  const sector=SECTORS[i%10];const stage=STAGES[Math.floor(sr(i*7)*7)];const geo=GEOS[Math.floor(sr(i*11)*8)];const trl=1+Math.floor(sr(i*13)*9);
  const fundingTotal=Math.round(5+sr(i*17)*495);const lastRound=Math.round(2+sr(i*19)*98);const valuation=Math.round(fundingTotal*2+sr(i*23)*fundingTotal*8);
  const avoidedEmissions=Math.round(10+sr(i*29)*990);const scalabilityScore=Math.round(20+sr(i*31)*75);
  const ipoReady=stage==='Pre-IPO'||stage==='Public'||(stage==='Growth'&&sr(i*37)>0.6);
  const portfolioWeight=Math.round(sr(i*41)*50)/10;
  return{id:i,name:names[i]||`ClimateTech ${i+1}`,sector,stage,geo,trl,fundingTotal,lastRound,valuation,avoidedEmissions,scalabilityScore,ipoReady,portfolioWeight,
    fundingHistory:Array.from({length:5},(_,y)=>({year:2021+y,amount:Math.round(lastRound*0.3+sr(i*100+y*7)*lastRound*1.2)})),
    impactMetrics:{co2Avoided:avoidedEmissions,waterSaved:Math.round(sr(i*43)*500),jobsCreated:Math.round(50+sr(i*47)*2000),landUse:Math.round(sr(i*51)*100)},
    techRisk:Math.round(20+sr(i*53)*70),marketRisk:Math.round(15+sr(i*59)*65),policyRisk:Math.round(10+sr(i*61)*60)
  };
});

const PORTFOLIO_COMPANIES=COMPANIES.filter(c=>c.portfolioWeight>0).slice(0,25);
const totalPortfolioWeight=PORTFOLIO_COMPANIES.reduce((a,c)=>a+c.portfolioWeight,0);

const exportCSV=(rows,fn)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
const Kpi=({label,value,sub,accent=T.navy})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',borderLeft:`3px solid ${accent}`}}><div style={{fontSize:11,color:T.textSec,fontFamily:T.font,marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:T.text,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:accent,marginTop:3}}>{sub}</div>}</div>;
const Row=({children,cols})=><div style={{display:'grid',gridTemplateColumns:cols||'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>;
const Badge=({children,bg,fg})=><span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:bg||T.surfaceH,color:fg||T.text}}>{children}</span>;

export default function ClimateTechPage(){
  const [tab,setTab]=useState(0);
  const [sectorFilter,setSectorFilter]=useState('All');
  const [stageFilter,setStageFilter]=useState('All');
  const [geoFilter,setGeoFilter]=useState('All');
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('fundingTotal');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedCo,setSelectedCo]=useState(0);
  const [trlMin,setTrlMin]=useState(1);
  const [trlMax,setTrlMax]=useState(9);
  const [minValuation,setMinValuation]=useState(0);
  const [screenMode,setScreenMode]=useState('exposure');

  const th={padding:'8px 10px',fontSize:11,fontWeight:600,color:T.textSec,background:T.surfaceH,border:`1px solid ${T.border}`,textAlign:'left',cursor:'pointer',fontFamily:T.font,whiteSpace:'nowrap',userSelect:'none'};
  const td={padding:'7px 10px',fontSize:12,border:`1px solid ${T.border}`,fontFamily:T.font,color:T.text};

  const filtered=useMemo(()=>{
    let c=[...COMPANIES];
    if(sectorFilter!=='All')c=c.filter(x=>x.sector===sectorFilter);
    if(stageFilter!=='All')c=c.filter(x=>x.stage===stageFilter);
    if(geoFilter!=='All')c=c.filter(x=>x.geo===geoFilter);
    if(search)c=c.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
    c=c.filter(x=>x.trl>=trlMin&&x.trl<=trlMax);
    c.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
    return c;
  },[sectorFilter,stageFilter,geoFilter,search,sortCol,sortDir,trlMin,trlMax]);

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  const totalFunding=COMPANIES.reduce((a,c)=>a+c.fundingTotal,0);
  const avgTrl=Math.round(COMPANIES.reduce((a,c)=>a+c.trl,0)/COMPANIES.length*10)/10;

  const renderLandscape=()=>{
    const trlDist=TRL_LABELS.map((l,i)=>({name:l,count:COMPANIES.filter(c=>c.trl===i+1).length}));
    const sectorDist=SECTORS.map(s=>({name:s,count:COMPANIES.filter(c=>c.sector===s).length,avgTrl:Math.round(COMPANIES.filter(c=>c.sector===s).reduce((a,c)=>a+c.trl,0)/(COMPANIES.filter(c=>c.sector===s).length||1)*10)/10}));
    const geoDist=GEOS.map(g=>({name:g,value:COMPANIES.filter(c=>c.geo===g).length}));
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Technologies Tracked" value={80} accent={T.navy}/><Kpi label="Avg TRL" value={avgTrl} sub={avgTrl>5?'Deployment ready':'R&D phase'} accent={avgTrl>5?T.green:T.amber}/><Kpi label="Total Funding" value={`$${(totalFunding/1000).toFixed(1)}B`} accent={T.gold}/><Kpi label="IPO Pipeline" value={COMPANIES.filter(c=>c.ipoReady).length} accent={T.sage}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Sectors</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
        <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:11,color:T.textSec}}>TRL:</span><input type="range" min={1} max={9} value={trlMin} onChange={e=>setTrlMin(Math.min(+e.target.value,trlMax))} style={{width:80,accentColor:T.navy}}/><span style={{fontFamily:T.mono,fontSize:11}}>{trlMin}-{trlMax}</span><input type="range" min={1} max={9} value={trlMax} onChange={e=>setTrlMax(Math.max(+e.target.value,trlMin))} style={{width:80,accentColor:T.navy}}/></div>
        <button onClick={()=>exportCSV(filtered.map(c=>({Name:c.name,Sector:c.sector,TRL:c.trl,Stage:c.stage,Geo:c.geo,Funding:c.fundingTotal,Valuation:c.valuation})),'climate_tech_landscape.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>TRL Distribution</div>
          <ResponsiveContainer width="100%" height={240}><BarChart data={trlDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip/><Bar dataKey="count" fill={T.navy} name="Companies" radius={[3,3,0,0]}>{trlDist.map((_,i)=><Cell key={i} fill={i<3?T.amber:i<6?T.gold:T.green}/>)}</Bar></BarChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Geographic Distribution</div>
          <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={geoDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{geoDist.map((_,i)=><Cell key={i} fill={PIE_C[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Sector Breakdown</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={sectorDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={55}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="count" fill={T.navy} name="Companies" radius={[3,3,0,0]}/><Bar dataKey="avgTrl" fill={T.sage} name="Avg TRL" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginTop:12}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Technology Landscape Table</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,zIndex:1}}><tr>{[{k:'name',l:'Company'},{k:'sector',l:'Sector'},{k:'trl',l:'TRL'},{k:'stage',l:'Stage'},{k:'geo',l:'Geography'},{k:'fundingTotal',l:'Funding ($M)'},{k:'valuation',l:'Valuation ($M)'}].map(c=><th key={c.k} style={th} onClick={()=>toggleSort(c.k)}>{c.l}{sortCol===c.k?(sortDir==='asc'?' ↑':' ↓'):''}</th>)}</tr></thead>
            <tbody>{filtered.slice(0,40).map(c=><tr key={c.id} style={{cursor:'pointer',background:selectedCo===c.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedCo(c.id)}>
              <td style={{...td,fontWeight:500}}>{c.name}</td><td style={{...td,fontSize:11}}>{c.sector}</td>
              <td style={td}><span style={{fontFamily:T.mono,fontWeight:700,color:c.trl>6?T.green:c.trl>3?T.amber:T.red}}>TRL {c.trl}</span></td>
              <td style={td}><Badge>{c.stage}</Badge></td><td style={td}>{c.geo}</td>
              <td style={{...td,fontFamily:T.mono}}>${c.fundingTotal}M</td><td style={{...td,fontFamily:T.mono}}>${c.valuation}M</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  const renderInvestment=()=>{
    const co=COMPANIES[selectedCo];
    const stageDist=STAGES.map(s=>({name:s,count:COMPANIES.filter(c=>c.stage===s).length,funding:Math.round(COMPANIES.filter(c=>c.stage===s).reduce((a,c)=>a+c.fundingTotal,0))}));
    const topFunded=[...COMPANIES].sort((a,b)=>b.fundingTotal-a.fundingTotal).slice(0,15).map(c=>({name:c.name.slice(0,18),funding:c.fundingTotal,valuation:Math.round(c.valuation/10)}));
    const yearlyFunding=[{year:2021,total:Math.round(totalFunding*0.12)},{year:2022,total:Math.round(totalFunding*0.18)},{year:2023,total:Math.round(totalFunding*0.22)},{year:2024,total:Math.round(totalFunding*0.25)},{year:2025,total:Math.round(totalFunding*0.23)}];
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Total Funding" value={`$${(totalFunding/1000).toFixed(1)}B`} accent={T.navy}/><Kpi label="Avg Round Size" value={`$${Math.round(COMPANIES.reduce((a,c)=>a+c.lastRound,0)/COMPANIES.length)}M`} accent={T.gold}/><Kpi label="IPO Pipeline" value={COMPANIES.filter(c=>c.ipoReady).length} sub={`${Math.round(COMPANIES.filter(c=>c.ipoReady).length/80*100)}% of universe`} accent={T.sage}/><Kpi label="Pre-Seed/Seed" value={COMPANIES.filter(c=>c.stage==='Seed').length} accent={T.amber}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <select value={selectedCo} onChange={e=>setSelectedCo(+e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font,minWidth:200}}>{COMPANIES.map((c,i)=><option key={i} value={i}>{c.name} ({c.sector})</option>)}</select>
        <select value={stageFilter} onChange={e=>setStageFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Stages</option>{STAGES.map(s=><option key={s}>{s}</option>)}</select>
        <button onClick={()=>exportCSV(COMPANIES.map(c=>({Name:c.name,Sector:c.sector,Stage:c.stage,Funding:c.fundingTotal,LastRound:c.lastRound,Valuation:c.valuation,IPOReady:c.ipoReady?'Yes':'No'})),'climate_tech_investment.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Annual Climate Tech Funding</div>
          <ResponsiveContainer width="100%" height={240}><AreaChart data={yearlyFunding}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12}}/><Area type="monotone" dataKey="total" fill={T.sage+'40'} stroke={T.sage} name="Funding ($M)"/></AreaChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Stage Distribution</div>
          <ResponsiveContainer width="100%" height={240}><BarChart data={stageDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip/><Legend/><Bar dataKey="count" fill={T.navy} name="Companies" radius={[3,3,0,0]}/><Bar dataKey="funding" fill={T.gold} name="Funding ($M)" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
        </div>
      </Row>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Top 15 by Funding</div>
          <ResponsiveContainer width="100%" height={350}><BarChart data={topFunded} layout="vertical" margin={{left:100}}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={95}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="funding" fill={T.navy} name="Funding ($M)" radius={[0,3,3,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{co.name} Details</div>
          {[{l:'Sector',v:co.sector},{l:'Stage',v:co.stage},{l:'TRL',v:`TRL ${co.trl}`},{l:'Geography',v:co.geo},{l:'Total Funding',v:`$${co.fundingTotal}M`,c:T.navy},{l:'Last Round',v:`$${co.lastRound}M`},{l:'Valuation',v:`$${co.valuation}M`,c:T.gold},{l:'IPO Ready',v:co.ipoReady?'Yes':'No',c:co.ipoReady?T.green:T.textMut},{l:'Tech Risk',v:co.techRisk,c:co.techRisk>50?T.red:T.green},{l:'Market Risk',v:co.marketRisk},{l:'Policy Risk',v:co.policyRisk}].map((m,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}><span style={{color:T.textSec}}>{m.l}</span><span style={{fontWeight:600,color:m.c||T.text,fontFamily:T.mono}}>{m.v}</span></div>)}
          <div style={{marginTop:10,fontWeight:600,fontSize:12,color:T.text}}>Funding History</div>
          <ResponsiveContainer width="100%" height={120}><BarChart data={co.fundingHistory}><XAxis dataKey="year" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}}/><Bar dataKey="amount" fill={T.navy} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
        </div>
      </Row>
    </div>);
  };

  const renderImpact=()=>{
    const co=COMPANIES[selectedCo];
    const topImpact=[...COMPANIES].sort((a,b)=>b.avoidedEmissions-a.avoidedEmissions).slice(0,20).map(c=>({name:c.name.slice(0,18),co2:c.avoidedEmissions,scalability:c.scalabilityScore}));
    const sectorImpact=SECTORS.map(s=>{const cs=COMPANIES.filter(c=>c.sector===s);return{name:s,avgCO2:Math.round(cs.reduce((a,c)=>a+c.avoidedEmissions,0)/(cs.length||1)),avgScale:Math.round(cs.reduce((a,c)=>a+c.scalabilityScore,0)/(cs.length||1))};});
    const scatterData=COMPANIES.slice(0,50).map(c=>({name:c.name,x:c.scalabilityScore,y:c.avoidedEmissions,z:c.fundingTotal}));
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Total Avoided Emissions" value={`${(COMPANIES.reduce((a,c)=>a+c.avoidedEmissions,0)/1000).toFixed(1)}M tCO2e`} accent={T.sage}/><Kpi label="Avg Scalability" value={Math.round(COMPANIES.reduce((a,c)=>a+c.scalabilityScore,0)/80)} sub="Out of 100" accent={T.navy}/><Kpi label="Top Emitter Avoided" value={`${Math.max(...COMPANIES.map(c=>c.avoidedEmissions))} ktCO2e`} accent={T.green}/><Kpi label="Water Saved (avg)" value={`${Math.round(COMPANIES.reduce((a,c)=>a+c.impactMetrics.waterSaved,0)/80)} ML`} accent={T.teal}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <select value={selectedCo} onChange={e=>setSelectedCo(+e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font,minWidth:200}}>{COMPANIES.map((c,i)=><option key={i} value={i}>{c.name}</option>)}</select>
        <button onClick={()=>exportCSV(COMPANIES.map(c=>({Name:c.name,Sector:c.sector,CO2Avoided:c.avoidedEmissions,Scalability:c.scalabilityScore,WaterSaved:c.impactMetrics.waterSaved,JobsCreated:c.impactMetrics.jobsCreated})),'climate_impact.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Scalability vs Avoided Emissions</div>
          <ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" dataKey="x" name="Scalability" tick={{fontSize:10,fill:T.textSec}} label={{value:'Scalability',position:'bottom',fontSize:11}}/><YAxis type="number" dataKey="y" name="CO2 Avoided" tick={{fontSize:10,fill:T.textSec}} label={{value:'ktCO2e',angle:-90,position:'insideLeft',fontSize:11}}/><Tooltip cursor={{strokeDasharray:'3 3'}} content={({payload})=>{if(!payload||!payload.length)return null;const d=payload[0].payload;return<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:8,fontSize:11}}><div style={{fontWeight:600}}>{d.name}</div><div>Scalability: {d.x}</div><div>CO2: {d.y}kt</div><div>Funding: ${d.z}M</div></div>;}}/><Scatter data={scatterData} fill={T.sage} fillOpacity={0.6}/></ScatterChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{co.name} Impact Metrics</div>
          {[{l:'CO2 Avoided',v:`${co.avoidedEmissions} ktCO2e`,c:T.sage},{l:'Water Saved',v:`${co.impactMetrics.waterSaved} ML`,c:T.teal},{l:'Jobs Created',v:co.impactMetrics.jobsCreated.toLocaleString(),c:T.navy},{l:'Land Use (ha)',v:co.impactMetrics.landUse,c:T.gold},{l:'Scalability Score',v:`${co.scalabilityScore}/100`,c:T.sage},{l:'Tech Risk',v:`${co.techRisk}/100`,c:co.techRisk>50?T.red:T.green},{l:'Market Risk',v:`${co.marketRisk}/100`},{l:'Policy Risk',v:`${co.policyRisk}/100`}].map((m,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}><span style={{color:T.textSec}}>{m.l}</span><span style={{fontWeight:600,color:m.c||T.text,fontFamily:T.mono}}>{m.v}</span></div>)}
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Sector Impact Comparison</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={sectorImpact}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={55}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip/><Legend/><Bar dataKey="avgCO2" fill={T.sage} name="Avg CO2 Avoided (kt)" radius={[3,3,0,0]}/><Bar dataKey="avgScale" fill={T.navy} name="Avg Scalability" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
      </div>
    </div>);
  };

  const renderPortfolio=()=>{
    const sectorExposure=SECTORS.map(s=>{const cs=PORTFOLIO_COMPANIES.filter(c=>c.sector===s);return{name:s,weight:Math.round(cs.reduce((a,c)=>a+c.portfolioWeight,0)*10)/10,count:cs.length};}).filter(s=>s.weight>0);
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Portfolio Companies" value={PORTFOLIO_COMPANIES.length} accent={T.navy}/><Kpi label="Total Exposure" value={`${totalPortfolioWeight.toFixed(1)}%`} accent={T.gold}/><Kpi label="Avg TRL" value={Math.round(PORTFOLIO_COMPANIES.reduce((a,c)=>a+c.trl,0)/PORTFOLIO_COMPANIES.length*10)/10} accent={T.sage}/><Kpi label="Portfolio CO2 Avoided" value={`${(PORTFOLIO_COMPANIES.reduce((a,c)=>a+c.avoidedEmissions,0)/1000).toFixed(1)}M tCO2e`} accent={T.green}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <select value={screenMode} onChange={e=>setScreenMode(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="exposure">Exposure View</option><option value="risk">Risk View</option><option value="impact">Impact View</option></select>
        <button onClick={()=>exportCSV(PORTFOLIO_COMPANIES.map(c=>({Name:c.name,Sector:c.sector,Weight:c.portfolioWeight,TRL:c.trl,Funding:c.fundingTotal,CO2Avoided:c.avoidedEmissions,TechRisk:c.techRisk})),'portfolio_exposure.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Sector Allocation</div>
          <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={sectorExposure} cx="50%" cy="50%" outerRadius={90} dataKey="weight" label={({name,weight})=>`${name}: ${weight}%`}>{sectorExposure.map((_,i)=><Cell key={i} fill={PIE_C[i%PIE_C.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Portfolio Risk Profile</div>
          <ResponsiveContainer width="100%" height={260}><BarChart data={PORTFOLIO_COMPANIES.slice(0,12).map(c=>({name:c.name.slice(0,12),tech:c.techRisk,market:c.marketRisk,policy:c.policyRisk}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-35} textAnchor="end" height={55}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/><Tooltip/><Legend/><Bar dataKey="tech" fill={T.red} name="Tech Risk" radius={[3,3,0,0]}/><Bar dataKey="market" fill={T.amber} name="Market Risk" radius={[3,3,0,0]}/><Bar dataKey="policy" fill={T.navy} name="Policy Risk" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Portfolio Holdings</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0}}><tr>{['Company','Sector','Weight %','TRL','Stage',screenMode==='risk'?'Tech Risk':screenMode==='impact'?'CO2 Avoided':'Funding',screenMode==='risk'?'Market Risk':screenMode==='impact'?'Scalability':'Valuation','IPO Ready'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{PORTFOLIO_COMPANIES.map(c=><tr key={c.id} style={{cursor:'pointer'}} onClick={()=>setSelectedCo(c.id)}>
              <td style={{...td,fontWeight:500}}>{c.name}</td><td style={{...td,fontSize:11}}>{c.sector}</td><td style={{...td,fontFamily:T.mono,fontWeight:700,color:T.navy}}>{c.portfolioWeight}%</td>
              <td style={td}><span style={{fontFamily:T.mono,color:c.trl>6?T.green:T.amber}}>TRL {c.trl}</span></td><td style={td}><Badge>{c.stage}</Badge></td>
              <td style={{...td,fontFamily:T.mono}}>{screenMode==='risk'?c.techRisk:screenMode==='impact'?`${c.avoidedEmissions}kt`:`$${c.fundingTotal}M`}</td>
              <td style={{...td,fontFamily:T.mono}}>{screenMode==='risk'?c.marketRisk:screenMode==='impact'?c.scalabilityScore:`$${c.valuation}M`}</td>
              <td style={td}><Badge bg={c.ipoReady?T.green+'20':T.surfaceH} fg={c.ipoReady?T.green:T.textMut}>{c.ipoReady?'Yes':'No'}</Badge></td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  return(<div style={{padding:'24px 28px',fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
    <div style={{marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:T.text,margin:0}}>Climate Technology Analytics</h1><p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Track 80 climate tech companies across TRL stages, investment analytics, and portfolio exposure</p></div>
    <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:`2px solid ${T.border}`}}>
      {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,background:tab===i?T.surface:'transparent',border:'none',borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}}>{t}</button>)}
    </div>
    {tab===0&&renderLandscape()}
    {tab===1&&renderInvestment()}
    {tab===2&&renderImpact()}
    {tab===3&&renderPortfolio()}
  </div>);
}