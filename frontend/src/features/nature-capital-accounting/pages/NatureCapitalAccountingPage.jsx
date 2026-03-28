import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,AreaChart,Area} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Natural Capital Balance Sheet','Ecosystem Service Valuation','TNFD Alignment','Portfolio Nature Dependency'];
const COLORS=[T.navy,T.sage,T.gold,'#7c3aed',T.red,T.green,T.amber,'#0ea5e9','#be185d','#78350f'];
const ECOSYSTEMS=['Tropical Forest','Temperate Forest','Boreal Forest','Wetland','Grassland','Marine Coast','Coral Reef','Freshwater','Mangrove','Dryland'];
const ECO_SERVICES=['Carbon Sequestration','Water Purification','Pollination','Soil Formation','Flood Regulation','Nutrient Cycling','Climate Regulation','Habitat Provision','Erosion Control','Recreation & Tourism'];
const TNFD_PILLARS=['Governance','Strategy','Risk & Impact Mgmt','Metrics & Targets'];
const LEAP_STEPS=['Locate','Evaluate','Assess','Prepare'];

const accounts=Array.from({length:40},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);
  const eco=ECOSYSTEMS[Math.floor(s*ECOSYSTEMS.length)];
  return {id:i+1,name:['Amazon Basin Plot','Borneo Peatland','Congo Rainforest','Great Barrier Reef','Pantanal Wetland','Serengeti Plains','Sundarbans Delta','Mekong Delta','Andes Cloud Forest','Baltic Seagrass','Arctic Tundra Margin','Cerrado Savanna','Coral Triangle','Danube Wetlands','Everglades Marsh','Fennoscandian Taiga','Ganges Floodplain','Himalayan Alpine','Indus Delta','Java Mangrove','Kakadu Wetland','Lake Victoria Basin','Madagascar Spiny','Niger Delta Marsh','Okavango Delta','Patagonia Steppe','Queensland Reef','Rhine Floodplain','Sahel Grassland','Thar Desert Margin','Ural Taiga Strip','Volga Delta','Wadden Sea','Xingu Indigenous','Yangtze Wetland','Zambezi Floodplain','Zealand Dunes','Aral Basin','Baikal Shore','Caspian Wetland'][i],
    ecosystem:eco,areaHa:Math.round(500+s*9500),conditionIndex:Math.round(30+s2*60),
    carbonStockTc:Math.round(50+s*450),waterYieldMm:Math.round(200+s2*1800),
    biodiversityIntactness:Math.round(25+s3*65),soilHealth:Math.round(30+sr(i*23)*60),habitatIntegrity:Math.round(35+sr(i*29)*55),
    totalAssetValueMn:Math.round(10+s*490),totalLiabilityMn:Math.round(2+s2*80),
    annualDepreciationPct:+(0.5+s3*4).toFixed(1),restorationCostMn:Math.round(1+s*50),
    country:['Brazil','Indonesia','DRC','Australia','Brazil','Tanzania','Bangladesh','Vietnam','Peru','Sweden','Canada','Brazil','Philippines','Romania','USA','Finland','India','Nepal','Pakistan','Indonesia','Australia','Kenya','Madagascar','Nigeria','Botswana','Argentina','Australia','Germany','Mali','India','Russia','Russia','Netherlands','Brazil','China','Zambia','Denmark','Kazakhstan','Russia','Azerbaijan'][i],
    region:['South America','SE Asia','Central Africa','Oceania','South America','East Africa','South Asia','SE Asia','South America','Europe','North America','South America','SE Asia','Europe','North America','Europe','South Asia','South Asia','South Asia','SE Asia','Oceania','East Africa','Africa','West Africa','Southern Africa','South America','Oceania','Europe','West Africa','South Asia','Central Asia','Central Asia','Europe','South America','East Asia','Southern Africa','Europe','Central Asia','Central Asia','Central Asia'][i],
    tnfdReady:sr(i*31)<0.3?'High':sr(i*31)<0.65?'Medium':'Low',
    seeaCompliant:sr(i*37)>0.4,dataQuality:['High','Medium','Low'][Math.floor(sr(i*41)*3)],
    lastAssessed:`2025-${String(1+Math.floor(sr(i*43)*12)).padStart(2,'0')}-01`,
    serviceValues:ECO_SERVICES.map((svc,j)=>({service:svc,annualMn:+(0.5+sr(i*47+j)*15).toFixed(1)}))};
});

const portfolioCompanies=Array.from({length:30},(_,i)=>{const s=sr(i*53);
  return {company:['Nestle','Unilever','BASF','Syngenta','Cargill','Danone','L\'Oreal','Mondelez','PepsiCo','JBS','Olam','Wilmar','Bunge','ADM','Barry Callebaut','Fonterra','Sappi','UPM','Stora Enso','Suzano','CMPC','Fibria','Anglo American','BHP','Rio Tinto','Vale','Glencore','Newmont','Barrick Gold','Freeport-McMoRan'][i],
    sector:['Food','Consumer','Chemicals','Agriculture','Commodities','Food','Consumer','Food','Food','Meat','Agriculture','Palm Oil','Agriculture','Agriculture','Food','Dairy','Forestry','Forestry','Forestry','Forestry','Forestry','Forestry','Mining','Mining','Mining','Mining','Mining','Mining','Mining','Mining'][i],
    natureDependency:Math.round(30+s*60),natureImpact:Math.round(20+sr(i*59)*70),
    waterDep:Math.round(20+sr(i*61)*70),pollinationDep:Math.round(5+sr(i*67)*50),soilDep:Math.round(15+sr(i*71)*65),
    biodiversityRisk:sr(i*73)<0.3?'Critical':sr(i*73)<0.6?'High':'Moderate',
    tnfdDisclosure:sr(i*79)>0.5?'Yes':'No',sbtnCommitted:sr(i*83)>0.4?'Yes':'No'};
});

const tipS={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font,color:T.text}};
const Stat=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'18px 20px',borderTop:`3px solid ${color||T.sage}`}}>
  <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,marginBottom:6,fontFamily:T.font}}>{label}</div>
  <div style={{fontSize:26,fontWeight:800,color:T.navy,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:3}}>{sub}</div>}</div>);
const Badge=({children,color})=>{const m={green:{bg:'#dcfce7',fg:T.green},red:{bg:'#fee2e2',fg:T.red},amber:{bg:'#fef3c7',fg:T.amber},navy:{bg:'#dbeafe',fg:T.navy},sage:{bg:'#d1fae5',fg:T.sage}};const c=m[color]||m.sage;return <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:c.bg,color:c.fg}}>{children}</span>;};
const exportCSV=(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]).filter(k=>typeof rows[0][k]!=='object');const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${name}.csv`;a.click();URL.revokeObjectURL(u);};
const thS={padding:'8px 12px',fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',fontFamily:T.font,background:T.surfaceH,position:'sticky',top:0};
const tdS={padding:'8px 12px',fontSize:12,color:T.text,borderBottom:`1px solid ${T.border}`,fontFamily:T.font};
const tdM={...tdS,fontFamily:T.mono,fontWeight:600};

export default function NatureCapitalAccountingPage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('totalAssetValueMn');
  const [sortDir,setSortDir]=useState('desc');
  const [filterEco,setFilterEco]=useState('All');
  const [expanded,setExpanded]=useState(null);
  const [showPanel,setShowPanel]=useState(false);
  const [panelData,setPanelData]=useState(null);
  const [serviceView,setServiceView]=useState('chart');
  const [selectedAccount,setSelectedAccount]=useState(null);
  const [tnfdPillar,setTnfdPillar]=useState(0);
  const [compSearch,setCompSearch]=useState('');
  const [compSort,setCompSort]=useState('natureDependency');
  const [compSortDir,setCompSortDir]=useState('desc');

  const toggleSort=col=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};
  const toggleCompSort=col=>{if(compSort===col)setCompSortDir(d=>d==='asc'?'desc':'asc');else{setCompSort(col);setCompSortDir('desc');}};

  const filtered=useMemo(()=>{let d=[...accounts];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())||r.country.toLowerCase().includes(search.toLowerCase()));if(filterEco!=='All')d=d.filter(r=>r.ecosystem===filterEco);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,filterEco,sortCol,sortDir]);

  const filteredComps=useMemo(()=>{let d=[...portfolioCompanies];if(compSearch)d=d.filter(r=>r.company.toLowerCase().includes(compSearch.toLowerCase()));d.sort((a,b)=>compSortDir==='asc'?(a[compSort]>b[compSort]?1:-1):(a[compSort]<b[compSort]?1:-1));return d;},[compSearch,compSort,compSortDir]);

  const totalArea=accounts.reduce((s,a)=>s+a.areaHa,0);
  const totalAssets=accounts.reduce((s,a)=>s+a.totalAssetValueMn,0);
  const avgCondition=Math.round(accounts.reduce((s,a)=>s+a.conditionIndex,0)/40);
  const totalCarbon=accounts.reduce((s,a)=>s+a.carbonStockTc,0);

  const ecoAgg=useMemo(()=>ECOSYSTEMS.map(e=>{const as=accounts.filter(a=>a.ecosystem===e);return {ecosystem:e,count:as.length,area:as.reduce((s,a)=>s+a.areaHa,0),value:as.reduce((s,a)=>s+a.totalAssetValueMn,0)};}).filter(e=>e.count>0),[]);

  const serviceAgg=useMemo(()=>ECO_SERVICES.map(svc=>{let total=0;accounts.forEach(a=>{const sv=a.serviceValues.find(s=>s.service===svc);if(sv)total+=sv.annualMn;});return {service:svc,totalMn:+total.toFixed(1)};}),[]);

  const tnfdScores=useMemo(()=>TNFD_PILLARS.map((p,i)=>({pillar:p,avgScore:Math.round(accounts.reduce((s,a)=>s+(40+sr(a.id*97+i)*50),0)/40),readyPct:Math.round(accounts.filter(a=>a.tnfdReady==='High').length/40*100)})),[]);

  const trendData=useMemo(()=>Array.from({length:8},(_,i)=>({year:2018+i,totalValue:Math.round(totalAssets*(0.7+i*0.043)),carbonStock:Math.round(totalCarbon*(0.85+i*0.02)),condition:Math.round(avgCondition*(0.82+i*0.025))})),[totalAssets,totalCarbon,avgCondition]);

  return (<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:0}}>Natural Capital Accounting</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>SEEA EA framework -- 40 natural capital accounts across 10 ecosystem types</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
        <Stat label="Accounts" value="40" sub="SEEA compliant" color={T.navy}/>
        <Stat label="Total Area" value={`${(totalArea/1000).toFixed(0)}K ha`} sub="Under assessment" color={T.sage}/>
        <Stat label="Asset Value" value={`$${(totalAssets/1000).toFixed(1)}B`} sub="Natural capital" color={T.gold}/>
        <Stat label="Avg Condition" value={`${avgCondition}/100`} sub="Ecosystem health" color={T.green}/>
        <Stat label="Carbon Stock" value={`${(totalCarbon/1000).toFixed(1)}K tC`} sub="Total sequestered" color={T.amber}/>
      </div>

      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'12px 24px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textMut,background:'none',border:'none',borderBottom:tab===i?`3px solid ${T.navy}`:'3px solid transparent',cursor:'pointer',fontFamily:T.font}}>{t}</button>)}
      </div>

      {tab===0&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search account or country..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:260,outline:'none',background:T.surface}}/>
          <select value={filterEco} onChange={e=>setFilterEco(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Ecosystems</option>{ECOSYSTEMS.map(e=><option key={e} value={e}>{e}</option>)}
          </select>
          <button onClick={()=>exportCSV(filtered,'natural_capital_balance')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Export CSV</button>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filtered.length} accounts</span>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <div style={{maxHeight:460,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{[{k:'id',l:'#'},{k:'name',l:'Account'},{k:'ecosystem',l:'Ecosystem'},{k:'areaHa',l:'Area (ha)'},{k:'conditionIndex',l:'Condition'},{k:'totalAssetValueMn',l:'Asset ($M)'},{k:'totalLiabilityMn',l:'Liability ($M)'},{k:'carbonStockTc',l:'Carbon (tC)'},{k:'tnfdReady',l:'TNFD Ready'},{k:'country',l:'Country'}].map(c=>
                <th key={c.k} onClick={()=>toggleSort(c.k)} style={{...thS,color:sortCol===c.k?T.navy:T.textSec}}>{c.l}{sortCol===c.k?(sortDir==='asc'?' ^':' v'):''}</th>
              )}</tr></thead>
              <tbody>{filtered.map(a=><React.Fragment key={a.id}>
                <tr onClick={()=>setExpanded(expanded===a.id?null:a.id)} style={{cursor:'pointer',background:expanded===a.id?T.surfaceH:'transparent'}}>
                  <td style={tdM}>{a.id}</td><td style={{...tdS,fontWeight:600}}>{a.name}</td><td style={tdS}><Badge color="sage">{a.ecosystem}</Badge></td>
                  <td style={tdM}>{a.areaHa.toLocaleString()}</td><td style={tdM}><Badge color={a.conditionIndex>=60?'green':a.conditionIndex>=40?'amber':'red'}>{a.conditionIndex}</Badge></td>
                  <td style={tdM}>{a.totalAssetValueMn}</td><td style={tdM}>{a.totalLiabilityMn}</td><td style={tdM}>{a.carbonStockTc}</td>
                  <td style={tdS}><Badge color={a.tnfdReady==='High'?'green':a.tnfdReady==='Medium'?'amber':'red'}>{a.tnfdReady}</Badge></td><td style={tdS}>{a.country}</td>
                </tr>
                {expanded===a.id&&<tr><td colSpan={10} style={{padding:16,background:T.surfaceH}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
                    <div><span style={{fontSize:10,color:T.textMut}}>Water Yield</span><div style={{fontWeight:700}}>{a.waterYieldMm} mm</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Biodiversity</span><div style={{fontWeight:700}}>{a.biodiversityIntactness}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Soil Health</span><div style={{fontWeight:700}}>{a.soilHealth}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Habitat Integrity</span><div style={{fontWeight:700}}>{a.habitatIntegrity}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Depreciation</span><div style={{fontWeight:700,color:T.red}}>{a.annualDepreciationPct}%/yr</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Restoration Cost</span><div style={{fontWeight:700}}>${a.restorationCostMn}M</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>SEEA Compliant</span><div><Badge color={a.seeaCompliant?'green':'red'}>{a.seeaCompliant?'Yes':'No'}</Badge></div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Data Quality</span><div><Badge color={a.dataQuality==='High'?'green':a.dataQuality==='Medium'?'amber':'red'}>{a.dataQuality}</Badge></div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Region</span><div style={{fontWeight:700}}>{a.region}</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Last Assessed</span><div style={{fontWeight:700}}>{a.lastAssessed}</div></div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setPanelData(a);setShowPanel(true);}} style={{marginTop:8,padding:'6px 14px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>View Service Values</button>
                </td></tr>}
              </React.Fragment>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Asset Value by Ecosystem</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ecoAgg}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="ecosystem" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/><Bar dataKey="value" fill={T.sage} radius={[4,4,0,0]}>{ecoAgg.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Natural Capital Value Trend</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Area type="monotone" dataKey="totalValue" stroke={T.sage} fill={T.sage} fillOpacity={0.2} name="Value ($M)"/></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab===1&&(<div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {['chart','table'].map(v=><button key={v} onClick={()=>setServiceView(v)} style={{padding:'8px 16px',background:serviceView===v?T.navy:T.surface,color:serviceView===v?'#fff':T.text,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>{v}</button>)}
          <select onChange={e=>setSelectedAccount(accounts.find(a=>a.id===+e.target.value)||null)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface,marginLeft:12,minWidth:250}}>
            <option value="">All accounts (aggregated)</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        {serviceView==='chart'&&(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>{selectedAccount?`${selectedAccount.name} Services`:'Aggregated Service Values ($M/yr)'}</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={selectedAccount?selectedAccount.serviceValues:serviceAgg} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="service" type="category" tick={{fontSize:9,fill:T.textSec}} width={120}/><Tooltip {...tipS}/>
                <Bar dataKey={selectedAccount?'annualMn':'totalMn'} fill={T.sage} radius={[0,4,4,0]}>{(selectedAccount?selectedAccount.serviceValues:serviceAgg).map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Service Value Distribution</div>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart><Pie data={serviceAgg} dataKey="totalMn" nameKey="service" cx="50%" cy="50%" outerRadius={120} label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} style={{fontSize:9}}>{serviceAgg.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip {...tipS}/></PieChart>
            </ResponsiveContainer>
          </div>
        </div>)}
        {serviceView==='table'&&(<div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={thS}>Service</th><th style={thS}>Total Value ($M/yr)</th><th style={thS}>% of Total</th><th style={thS}>Trend</th></tr></thead>
            <tbody>{serviceAgg.map((s,i)=>{const totalAll=serviceAgg.reduce((a,sv)=>a+sv.totalMn,0);return <tr key={i}>
              <td style={{...tdS,fontWeight:600}}>{s.service}</td><td style={tdM}>{s.totalMn}</td><td style={tdM}>{(s.totalMn/totalAll*100).toFixed(1)}%</td>
              <td style={tdS}><div style={{background:T.surfaceH,borderRadius:4,height:12,width:100,overflow:'hidden'}}><div style={{width:`${s.totalMn/totalAll*100*3}%`,height:'100%',background:COLORS[i%COLORS.length],borderRadius:4}}/></div></td>
            </tr>;})}</tbody>
          </table>
        </div>)}
      </div>)}

      {tab===2&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {tnfdScores.map((p,i)=><div key={i} onClick={()=>setTnfdPillar(i)} style={{background:tnfdPillar===i?T.navy:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:16,cursor:'pointer',transition:'all 0.2s'}}>
            <div style={{fontSize:10,color:tnfdPillar===i?'rgba(255,255,255,0.7)':T.textMut,textTransform:'uppercase',fontWeight:600,marginBottom:6}}>{p.pillar}</div>
            <div style={{fontSize:24,fontWeight:800,color:tnfdPillar===i?'#fff':T.navy}}>{p.avgScore}%</div>
            <div style={{fontSize:11,color:tnfdPillar===i?'rgba(255,255,255,0.6)':T.textSec}}>{p.readyPct}% high readiness</div>
          </div>)}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>SEEA-to-TNFD Mapping</div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['SEEA Component','TNFD Pillar','Mapping Status','Gap'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>{[{seea:'Extent Account',tnfd:'Metrics & Targets',status:'Mapped',gap:'None'},{seea:'Condition Account',tnfd:'Risk & Impact Mgmt',status:'Partial',gap:'Quantification method'},{seea:'Ecosystem Services',tnfd:'Strategy',status:'Mapped',gap:'None'},{seea:'Monetary Valuation',tnfd:'Metrics & Targets',status:'Partial',gap:'Discount rate alignment'},{seea:'Carbon Account',tnfd:'Metrics & Targets',status:'Mapped',gap:'None'},{seea:'Water Account',tnfd:'Risk & Impact Mgmt',status:'Partial',gap:'Basin-level data'},{seea:'Biodiversity Index',tnfd:'Governance',status:'In Progress',gap:'Species data coverage'},{seea:'Land Use Change',tnfd:'Strategy',status:'Mapped',gap:'None'}].map((r,i)=><tr key={i}>
                <td style={tdS}>{r.seea}</td><td style={tdS}>{r.tnfd}</td><td style={tdS}><Badge color={r.status==='Mapped'?'green':r.status==='Partial'?'amber':'navy'}>{r.status}</Badge></td><td style={{...tdS,fontSize:11,color:T.textSec}}>{r.gap}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>LEAP Process Status</div>
            {LEAP_STEPS.map((step,i)=>{const pct=Math.round(30+sr(i*97)*60);return <div key={i} style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span style={{fontWeight:600}}>{step}</span><span style={{fontFamily:T.mono,fontWeight:700}}>{pct}%</span></div>
              <div style={{background:T.surfaceH,borderRadius:6,height:16,overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',background:pct>=70?T.green:pct>=40?T.amber:T.red,borderRadius:6,transition:'width 0.3s'}}/></div>
            </div>;})}
            <div style={{marginTop:16,padding:12,background:T.surfaceH,borderRadius:8,fontSize:11,color:T.textSec}}>
              TNFD LEAP approach implementation across {accounts.length} accounts. {accounts.filter(a=>a.tnfdReady==='High').length} accounts at high readiness.
            </div>
          </div>
        </div>

        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Disclosure Readiness by Account</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[{level:'High',count:accounts.filter(a=>a.tnfdReady==='High').length},{level:'Medium',count:accounts.filter(a=>a.tnfdReady==='Medium').length},{level:'Low',count:accounts.filter(a=>a.tnfdReady==='Low').length}]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="level" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
              <Bar dataKey="count" radius={[4,4,0,0]}>{[T.green,T.amber,T.red].map((c,i)=><Cell key={i} fill={c}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>)}

      {tab===3&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <input value={compSearch} onChange={e=>setCompSearch(e.target.value)} placeholder="Search company..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:240,outline:'none',background:T.surface}}/>
          <button onClick={()=>exportCSV(filteredComps,'nature_dependency')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Export CSV</button>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filteredComps.length} companies</span>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <div style={{maxHeight:420,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{[{k:'company',l:'Company'},{k:'sector',l:'Sector'},{k:'natureDependency',l:'Nature Dep %'},{k:'natureImpact',l:'Nature Impact %'},{k:'waterDep',l:'Water Dep %'},{k:'pollinationDep',l:'Pollination %'},{k:'soilDep',l:'Soil Dep %'},{k:'biodiversityRisk',l:'Biodiv Risk'},{k:'tnfdDisclosure',l:'TNFD'},{k:'sbtnCommitted',l:'SBTN'}].map(c=>
                <th key={c.k} onClick={()=>toggleCompSort(c.k)} style={{...thS,color:compSort===c.k?T.navy:T.textSec}}>{c.l}{compSort===c.k?(compSortDir==='asc'?' ^':' v'):''}</th>
              )}</tr></thead>
              <tbody>{filteredComps.map(c=><tr key={c.company}>
                <td style={{...tdS,fontWeight:700}}>{c.company}</td><td style={tdS}>{c.sector}</td>
                <td style={tdM}>{c.natureDependency}</td><td style={tdM}>{c.natureImpact}</td><td style={tdM}>{c.waterDep}</td><td style={tdM}>{c.pollinationDep}</td><td style={tdM}>{c.soilDep}</td>
                <td style={tdS}><Badge color={c.biodiversityRisk==='Critical'?'red':c.biodiversityRisk==='High'?'amber':'green'}>{c.biodiversityRisk}</Badge></td>
                <td style={tdS}><Badge color={c.tnfdDisclosure==='Yes'?'green':'red'}>{c.tnfdDisclosure}</Badge></td>
                <td style={tdS}><Badge color={c.sbtnCommitted==='Yes'?'green':'red'}>{c.sbtnCommitted}</Badge></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Nature Dependency by Sector</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...new Set(portfolioCompanies.map(c=>c.sector))].map(s=>{const cs=portfolioCompanies.filter(c=>c.sector===s);return {sector:s,avgDep:Math.round(cs.reduce((a,c)=>a+c.natureDependency,0)/cs.length)};}).sort((a,b)=>b.avgDep-a.avgDep)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/><Tooltip {...tipS}/><Bar dataKey="avgDep" fill={T.sage} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Biodiversity Risk Distribution</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={[{level:'Critical',count:portfolioCompanies.filter(c=>c.biodiversityRisk==='Critical').length},{level:'High',count:portfolioCompanies.filter(c=>c.biodiversityRisk==='High').length},{level:'Moderate',count:portfolioCompanies.filter(c=>c.biodiversityRisk==='Moderate').length}]} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={100} label>
                {[T.red,T.amber,T.green].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip {...tipS}/><Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {showPanel&&panelData&&<div style={{position:'fixed',top:0,right:0,width:480,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,boxShadow:'-4px 0 24px rgba(0,0,0,0.08)',zIndex:1000,overflowY:'auto',padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:T.navy,margin:0}}>{panelData.name}</h2>
          <button onClick={()=>setShowPanel(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          {[{l:'Ecosystem',v:panelData.ecosystem},{l:'Area',v:`${panelData.areaHa.toLocaleString()} ha`},{l:'Condition',v:`${panelData.conditionIndex}/100`},{l:'Asset Value',v:`$${panelData.totalAssetValueMn}M`},{l:'Carbon Stock',v:`${panelData.carbonStockTc} tC`},{l:'Country',v:panelData.country}].map((d,i)=><div key={i}><div style={{fontSize:10,color:T.textMut}}>{d.l}</div><div style={{fontWeight:700}}>{d.v}</div></div>)}
        </div>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Ecosystem Service Values ($M/yr)</div>
        {panelData.serviceValues.map((s,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
          <span>{s.service}</span><span style={{fontFamily:T.mono,fontWeight:700}}>${s.annualMn}M</span>
        </div>)}
      </div>}
    </div>
  </div>);
}
