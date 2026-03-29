import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, Legend, AreaChart, Area, PieChart, Pie } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const PIE_COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,'#7c3aed','#0d9488','#ec4899','#6366f1','#f43f5e'];

/* ================================================================
   60 COUNTRIES — Sovereign Nature & Biodiversity Risk Data
   ================================================================ */
const COUNTRIES_RAW=[
  'Brazil','Indonesia','India','China','United States','Russia','Australia','Canada','Mexico','Colombia',
  'Peru','DR Congo','South Africa','Nigeria','Argentina','Saudi Arabia','Japan','Germany','United Kingdom','France',
  'Kenya','Tanzania','Ethiopia','Thailand','Vietnam','Malaysia','Philippines','Bangladesh','Pakistan','Egypt',
  'Chile','Ecuador','Costa Rica','Norway','Sweden','Finland','Iceland','New Zealand','Papua New Guinea','Madagascar',
  'Mozambique','Ghana','Ivory Coast','Cameroon','Myanmar','Nepal','Sri Lanka','Cambodia','Laos','Bolivia',
  'Paraguay','Uruguay','Panama','Guatemala','Honduras','Morocco','Tunisia','Senegal','Gabon','Botswana'
];

const ECOSYSTEMS=['forest','marine','freshwater','grassland','wetland','coral'];
const ECO_LABELS={forest:'Forest',marine:'Marine',freshwater:'Freshwater',grassland:'Grassland',wetland:'Wetland',coral:'Coral Reef'};
const ECO_COLORS={forest:T.sage,marine:T.navy,freshwater:'#0d9488',grassland:T.gold,wetland:'#7c3aed',coral:'#ec4899'};

const ECOSYSTEM_SERVICES=[
  'Carbon sequestration','Water purification','Pollination','Flood regulation','Soil formation',
  'Nutrient cycling','Coastal protection','Timber & fibre','Fisheries','Ecotourism'
];

const NATURE_SECTORS=['Agriculture','Forestry','Fisheries','Tourism','Water services'];

const GBF_TARGETS=[
  {id:1,name:'Spatial planning for biodiversity',short:'Land/sea planning'},
  {id:2,name:'Restore 30% degraded ecosystems',short:'Restore 30%'},
  {id:3,name:'Protect 30% land and sea (30x30)',short:'30x30 target'},
  {id:4,name:'Halt species extinction',short:'Halt extinction'},
  {id:5,name:'Sustainable use of wild species',short:'Sustainable use'},
  {id:6,name:'Reduce invasive alien species',short:'Invasive species'},
  {id:7,name:'Reduce pollution to non-harmful levels',short:'Reduce pollution'},
  {id:8,name:'Minimize climate impact on biodiversity',short:'Climate-biodiversity'},
  {id:9,name:'Sustainable management of wild species',short:'Wild species mgmt'},
  {id:10,name:'Sustainable agriculture/forestry/fisheries',short:'Sustainable agri'},
  {id:11,name:'Regulate ecosystem services via NbS',short:'Nature-based solutions'},
  {id:12,name:'Urban green & blue spaces',short:'Urban green spaces'},
  {id:13,name:'Access and benefit sharing (ABS)',short:'ABS/genetic resources'},
  {id:14,name:'Mainstream biodiversity in policy',short:'Policy mainstreaming'},
  {id:15,name:'Business biodiversity disclosure',short:'Biz disclosure'},
  {id:16,name:'Sustainable consumption',short:'Sust. consumption'},
  {id:17,name:'Biosafety measures',short:'Biosafety'},
  {id:18,name:'Reform harmful subsidies by $500B',short:'Subsidy reform'},
  {id:19,name:'Mobilize $200B/yr for biodiversity',short:'Finance $200B/yr'},
  {id:20,name:'Capacity building & tech transfer',short:'Capacity building'},
  {id:21,name:'Knowledge & data access',short:'Data & knowledge'},
  {id:22,name:'Inclusive & gender-responsive',short:'Inclusion/gender'},
  {id:23,name:'Gender equality in implementation',short:'Gender equality'}
];

/* ================================================================
   GENERATE DETERMINISTIC COUNTRY DATA
   ================================================================ */
const genCountries=()=>COUNTRIES_RAW.map((name,i)=>{
  const s=i*7+3;
  const bii=45+sr(s)*50;
  const natGdp=3+sr(s+1)*52;
  const protArea=5+sr(s+2)*35;
  const speciesRich=800+sr(s+3)*14000;
  const deforest=sr(s+4)*4.5;
  const waterStress=10+sr(s+5)*80;
  const soilDeg=5+sr(s+6)*60;
  const marineHealth=30+sr(s+7)*65;
  const pollution=10+sr(s+8)*75;
  const natRisk=Math.round(15+sr(s+9)*70);
  const physRisk=Math.round(10+sr(s+10)*80);
  const transRisk=Math.round(10+sr(s+11)*70);

  const ecoBreak={};
  ECOSYSTEMS.forEach((e,j)=>{ecoBreak[e]=Math.round(5+sr(s+20+j)*90);});

  const sectorBreak={};
  NATURE_SECTORS.forEach((sec,j)=>{sectorBreak[sec]=+(1+sr(s+30+j)*18).toFixed(1);});

  const svcValuation={};
  ECOSYSTEM_SERVICES.forEach((svc,j)=>{svcValuation[svc]=+(0.2+sr(s+40+j)*8).toFixed(2);});

  const gbfProgress={};
  GBF_TARGETS.forEach((t,j)=>{gbfProgress[t.id]=Math.round(sr(s+60+j)*100);});

  const nbsapStatus=['Submitted','In Progress','Draft','Not Started'][Math.floor(sr(s+90)*4)];
  const policyStringency=Math.round(10+sr(s+91)*85);
  const natureInvest=+(0.1+sr(s+92)*5).toFixed(2);

  const threatSpecies={
    cr:Math.round(5+sr(s+100)*180),en:Math.round(20+sr(s+101)*350),
    vu:Math.round(50+sr(s+102)*500),nt:Math.round(30+sr(s+103)*400)
  };
  const annualBii=[2018,2019,2020,2021,2022,2023,2024,2025].map((yr,k)=>({
    year:yr,value:+(bii-k*0.4+sr(s+110+k)*2-1).toFixed(1)
  }));
  const ecoServiceTotal=ECOSYSTEM_SERVICES.reduce((acc,svc)=>acc+svcValuation[svc],0);
  const carbonSink=+(5+sr(s+120)*40).toFixed(1);
  const freshwaterDep=+(10+sr(s+121)*60).toFixed(1);
  const subsidyHarmful=+(0.5+sr(s+122)*12).toFixed(1);
  const incomeClass=['Low','Lower-Middle','Upper-Middle','High'][Math.floor(sr(s+123)*4)];
  const creditRating=['AAA','AA','A','BBB','BB','B','CCC'][Math.floor(sr(s+124)*7)];
  const natureLossGdpImpact=+(0.5+sr(s+125)*8).toFixed(1);

  return {
    name,idx:i,bii:+bii.toFixed(1),natGdp:+natGdp.toFixed(1),protArea:+protArea.toFixed(1),
    speciesRich:Math.round(speciesRich),deforest:+deforest.toFixed(2),waterStress:+waterStress.toFixed(1),
    soilDeg:+soilDeg.toFixed(1),marineHealth:+marineHealth.toFixed(1),pollution:+pollution.toFixed(1),
    natRisk,physRisk,transRisk,ecoBreak,sectorBreak,svcValuation,gbfProgress,
    nbsapStatus,policyStringency,natureInvest,threatSpecies,annualBii,ecoServiceTotal:+ecoServiceTotal.toFixed(2),
    carbonSink,freshwaterDep,subsidyHarmful,incomeClass,creditRating,natureLossGdpImpact,
    region:['Latin America','Asia-Pacific','Europe','Africa','Middle East','North America'][Math.floor(sr(s+95)*6)],
    sovSpread:Math.round(50+sr(s+96)*400),bondHolding:+(5+sr(s+97)*200).toFixed(1),
    tnfdLeap:['Locate','Evaluate','Assess','Prepare'][Math.floor(sr(s+98)*4)],
    thirtyByThirty:+protArea.toFixed(1)>=30?'On Track':'Behind'
  };
});

const COUNTRIES=genCountries();

/* ================================================================
   STYLES
   ================================================================ */
const S={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text},
  header:{marginBottom:20},
  title:{fontSize:22,fontWeight:700,color:T.navy,margin:0,letterSpacing:'-0.3px'},
  subtitle:{fontSize:13,color:T.textSec,marginTop:4,fontFamily:T.mono},
  tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},
  tab:(a)=>({padding:'10px 18px',fontSize:13,fontWeight:a?700:500,color:a?T.navy:T.textSec,
    background:a?T.surface:'transparent',border:a?`1px solid ${T.border}`:'1px solid transparent',
    borderBottom:a?'2px solid transparent':`2px solid ${T.border}`,borderRadius:'6px 6px 0 0',
    cursor:'pointer',marginBottom:'-2px',fontFamily:T.font,transition:'all 0.15s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16},
  cardTitle:{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12},
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,textAlign:'center'},
  kpiVal:{fontSize:22,fontWeight:700,color:T.navy},
  kpiLbl:{fontSize:11,color:T.textMut,marginTop:4,fontFamily:T.mono,textTransform:'uppercase'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontWeight:700,
    color:T.navy,fontFamily:T.mono,fontSize:11,textTransform:'uppercase',position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,fontSize:12,color:T.text},
  badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,
    background:c+'18',color:c,fontFamily:T.mono}),
  pill:(a)=>({display:'inline-block',padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600,
    background:a?T.navy:T.surfaceH,color:a?'#fff':T.textSec,cursor:'pointer',marginRight:4,marginBottom:4}),
  btn:{padding:'8px 16px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,
    color:T.navy,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font},
  btnPrimary:{padding:'8px 16px',borderRadius:6,border:'none',background:T.navy,
    color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font},
  input:{padding:'7px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,
    fontFamily:T.font,color:T.text,outline:'none',width:200},
  progressBar:(pct,color)=>({height:6,borderRadius:3,background:T.surfaceH,position:'relative',overflow:'hidden',
    width:'100%'}),
  progressFill:(pct,color)=>({height:'100%',borderRadius:3,background:color||T.sage,width:`${Math.min(pct,100)}%`,
    transition:'width 0.3s'}),
  scrollTable:{maxHeight:480,overflowY:'auto',border:`1px solid ${T.border}`,borderRadius:8},
  tooltip:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'8px 12px',
    fontSize:11,fontFamily:T.font,boxShadow:'0 2px 8px rgba(0,0,0,0.08)'},
  select:{padding:'7px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,
    fontFamily:T.font,color:T.text,background:T.surface,cursor:'pointer'},
  link:{color:T.navyL,cursor:'pointer',textDecoration:'underline',fontSize:12},
};

/* ================================================================
   UTILITY COMPONENTS
   ================================================================ */
const KPI=({label,value,sub})=>(
  <div style={S.kpi}>
    <div style={S.kpiVal}>{value}</div>
    <div style={S.kpiLbl}>{label}</div>
    {sub&&<div style={{fontSize:10,color:T.textMut,marginTop:2}}>{sub}</div>}
  </div>
);

const ProgressBar=({pct,color,label,showPct=true})=>(
  <div style={{marginBottom:6}}>
    {label&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
      <span style={{fontSize:11,color:T.textSec}}>{label}</span>
      {showPct&&<span style={{fontSize:11,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{pct.toFixed(0)}%</span>}
    </div>}
    <div style={S.progressBar(pct,color)}>
      <div style={S.progressFill(pct,color)}/>
    </div>
  </div>
);

const CustomTooltip=({active,payload,label})=>{
  if(!active||!payload||!payload.length)return null;
  return(<div style={S.tooltip}>
    <div style={{fontWeight:700,marginBottom:4,color:T.navy}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||T.text,fontSize:11}}>
      {p.name}: <strong>{typeof p.value==='number'?p.value.toFixed(2):p.value}</strong>
    </div>)}
  </div>);
};

/* ================================================================
   TAB 1: NATURE DEPENDENCY
   ================================================================ */
const NatureDependencyTab=()=>{
  const [selCountry,setSelCountry]=useState(null);
  const [sortCol,setSortCol]=useState('natGdp');
  const [sortDir,setSortDir]=useState('desc');
  const [search,setSearch]=useState('');



  const toggleSort=(col)=>{
    if(sortCol===col)setSortDir(d=>d==='desc'?'asc':'desc');
    else{setSortCol(col);setSortDir('desc');}
  };

  const [regionFilter,setRegionFilter]=useState('All');
  const regions=['All','Latin America','Asia-Pacific','Europe','Africa','Middle East','North America'];

  const filtered=useMemo(()=>{
    let f=COUNTRIES.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
    if(regionFilter!=='All')f=f.filter(c=>c.region===regionFilter);
    return f.sort((a,b)=>sortDir==='desc'?b[sortCol]-a[sortCol]:a[sortCol]-b[sortCol]);
  },[sortCol,sortDir,search,regionFilter]);

  const topDep=filtered.slice(0,15);
  const avgBII=(COUNTRIES.reduce((s,c)=>s+c.bii,0)/COUNTRIES.length).toFixed(1);
  const avgNatGdp=(COUNTRIES.reduce((s,c)=>s+c.natGdp,0)/COUNTRIES.length).toFixed(1);
  const above30=COUNTRIES.filter(c=>c.protArea>=30).length;
  const totalSpecies=COUNTRIES.reduce((s,c)=>s+c.speciesRich,0);
  const totalThreatened=COUNTRIES.reduce((s,c)=>s+c.threatSpecies.cr+c.threatSpecies.en+c.threatSpecies.vu,0);

  const detail=selCountry?COUNTRIES.find(c=>c.name===selCountry):null;

  const radarData=detail?ECOSYSTEMS.map(e=>({eco:ECO_LABELS[e],score:detail.ecoBreak[e]})):[];
  const sectorData=detail?NATURE_SECTORS.map(s=>({sector:s,pct:detail.sectorBreak[s]})):[];
  const svcData=detail?ECOSYSTEM_SERVICES.map(s=>({service:s,value:detail.svcValuation[s]})):[];

  const regionSummary=useMemo(()=>{
    const reg={};
    COUNTRIES.forEach(c=>{
      if(!reg[c.region])reg[c.region]={region:c.region,count:0,avgBii:0,avgNatGdp:0,avgProtArea:0,totalSpecies:0};
      reg[c.region].count++;
      reg[c.region].avgBii+=c.bii;
      reg[c.region].avgNatGdp+=c.natGdp;
      reg[c.region].avgProtArea+=c.protArea;
      reg[c.region].totalSpecies+=c.speciesRich;
    });
    return Object.values(reg).map(r=>({
      ...r,avgBii:+(r.avgBii/r.count).toFixed(1),
      avgNatGdp:+(r.avgNatGdp/r.count).toFixed(1),
      avgProtArea:+(r.avgProtArea/r.count).toFixed(1)
    }));
  },[]);

  return(<div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12}}>
      <KPI label="Countries Tracked" value="60" sub="Global coverage"/>
      <KPI label="Avg Nature-GDP %" value={`${avgNatGdp}%`} sub="Agriculture+Forestry+Fish+Tourism"/>
      <KPI label="Avg BII Score" value={avgBII} sub="Biodiversity Intactness Index"/>
      <KPI label="30x30 On Track" value={`${above30}/60`} sub={`${((above30/60)*100).toFixed(0)}% meeting target`}/>
      <KPI label="Total Species" value={totalSpecies.toLocaleString()} sub="Across 60 countries"/>
      <KPI label="Threatened" value={totalThreatened.toLocaleString()} sub="CR + EN + VU combined"/>
    </div>

    <div style={{...S.card,marginTop:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={S.cardTitle}>Nature-Dependent GDP by Country (Top 15)</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <select style={S.select} value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
            {regions.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <input style={S.input} placeholder="Search country..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={topDep} layout="vertical" margin={{left:100,right:20,top:5,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis type="number" domain={[0,60]} tick={{fontSize:11,fill:T.textSec}} label={{value:'Nature-Dependent GDP %',position:'insideBottom',offset:-2,fontSize:11}}/>
          <YAxis dataKey="name" type="category" tick={{fontSize:11,fill:T.text}} width={95}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Bar dataKey="natGdp" name="Nature GDP %" radius={[0,4,4,0]}>
            {topDep.map((c,i)=><Cell key={i} fill={c.natGdp>30?T.red:c.natGdp>15?T.amber:T.sage}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={S.grid2}>
      <div style={S.card}>
        <div style={S.cardTitle}>Biodiversity Intactness Index Ranking</div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>#</th>
              <th style={{...S.th,cursor:'pointer'}} onClick={()=>toggleSort('name')}>Country</th>
              <th style={{...S.th,cursor:'pointer'}} onClick={()=>toggleSort('bii')}>BII Score</th>
              <th style={{...S.th,cursor:'pointer'}} onClick={()=>toggleSort('natGdp')}>Nat. GDP %</th>
              <th style={{...S.th,cursor:'pointer'}} onClick={()=>toggleSort('protArea')}>Protected %</th>
              <th style={{...S.th,cursor:'pointer'}} onClick={()=>toggleSort('speciesRich')}>Species</th>
              <th style={S.th}>30x30</th>
              <th style={S.th}>Detail</th>
            </tr></thead>
            <tbody>{filtered.map((c,i)=>(
              <tr key={c.name} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={S.td}>{i+1}</td>
                <td style={{...S.td,fontWeight:600}}>{c.name}</td>
                <td style={S.td}>
                  <span style={S.badge(c.bii>70?T.green:c.bii>50?T.amber:T.red)}>{c.bii}</span>
                </td>
                <td style={S.td}>{c.natGdp}%</td>
                <td style={S.td}>{c.protArea}%</td>
                <td style={{...S.td,fontFamily:T.mono,fontSize:11}}>{c.speciesRich.toLocaleString()}</td>
                <td style={S.td}>
                  <span style={S.badge(c.thirtyByThirty==='On Track'?T.green:T.red)}>{c.thirtyByThirty}</span>
                </td>
                <td style={S.td}><span style={S.link} onClick={()=>setSelCountry(c.name)}>View</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Ecosystem Service Valuation (Top Countries)</div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={COUNTRIES.slice(0,10).map(c=>({
            name:c.name,
            total:ECOSYSTEM_SERVICES.reduce((s,svc)=>s+c.svcValuation[svc],0)
          }))} margin={{left:10,right:10,top:10,bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-35} textAnchor="end"/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'$Bn Services Value',angle:-90,position:'insideLeft',fontSize:10}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="total" name="Total Svc Value ($Bn)" fill={T.sage} radius={[4,4,0,0]}>
              {COUNTRIES.slice(0,10).map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={S.card}>
      <div style={S.cardTitle}>Ecosystem Type Dependency Distribution (Global Avg)</div>
      <div style={S.grid2}>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={ECOSYSTEMS.map(e=>({
            eco:ECO_LABELS[e],
            avg:+(COUNTRIES.reduce((s,c)=>s+c.ecoBreak[e],0)/60).toFixed(1)
          }))}>
            <PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="eco" tick={{fontSize:11,fill:T.textSec}}/>
            <PolarRadiusAxis tick={{fontSize:9}} domain={[0,100]}/>
            <Radar name="Global Avg Dependency" dataKey="avg" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
          </RadarChart>
        </ResponsiveContainer>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:10}}>Ecosystem Breakdown (60-country average)</div>
          {ECOSYSTEMS.map((e,j)=>{
            const avg=+(COUNTRIES.reduce((s,c)=>s+c.ecoBreak[e],0)/60).toFixed(1);
            return <ProgressBar key={j} label={`${ECO_LABELS[e]} (avg: ${avg})`} pct={avg} color={ECO_COLORS[e]}/>;
          })}
          <div style={{marginTop:10,fontSize:11,color:T.textSec}}>
            Dependency scores reflect national reliance on each ecosystem type for economic output,
            food security, water supply, and cultural services. Scores 0-100.
          </div>
        </div>
      </div>
    </div>

    <div style={S.card}>
      <div style={S.cardTitle}>Regional Nature Dependency Summary</div>
      <table style={S.table}>
        <thead><tr>
          <th style={S.th}>Region</th>
          <th style={S.th}>Countries</th>
          <th style={S.th}>Avg BII</th>
          <th style={S.th}>Avg Nature GDP %</th>
          <th style={S.th}>Avg Protected %</th>
          <th style={S.th}>Total Species</th>
          <th style={S.th}>30x30 Progress</th>
        </tr></thead>
        <tbody>{regionSummary.sort((a,b)=>b.avgNatGdp-a.avgNatGdp).map((r,i)=>(
          <tr key={r.region} style={{background:i%2===0?'transparent':T.surfaceH}}>
            <td style={{...S.td,fontWeight:700}}>{r.region}</td>
            <td style={{...S.td,fontFamily:T.mono}}>{r.count}</td>
            <td style={S.td}><span style={S.badge(r.avgBii>60?T.green:r.avgBii>45?T.amber:T.red)}>{r.avgBii}</span></td>
            <td style={{...S.td,fontFamily:T.mono}}>{r.avgNatGdp}%</td>
            <td style={{...S.td,fontFamily:T.mono}}>{r.avgProtArea}%</td>
            <td style={{...S.td,fontFamily:T.mono}}>{r.totalSpecies.toLocaleString()}</td>
            <td style={S.td}>
              <div style={{width:80}}>
                <ProgressBar pct={(r.avgProtArea/30)*100} color={r.avgProtArea>=30?T.green:T.amber} showPct={false}/>
              </div>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>

    {detail&&(
      <div style={{...S.card,border:`2px solid ${T.gold}`,marginTop:8}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{detail.name} — Ecosystem Breakdown</div>
            <div style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>BII: {detail.bii} | Nature GDP: {detail.natGdp}% | Species: {detail.speciesRich.toLocaleString()} | Protected: {detail.protArea}% | Income: {detail.incomeClass}</div>
          </div>
          <button style={S.btn} onClick={()=>setSelCountry(null)}>Close</button>
        </div>
        <div style={S.grid3}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Dependency by Ecosystem</div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="eco" tick={{fontSize:10,fill:T.textSec}}/>
                <PolarRadiusAxis tick={{fontSize:9}} domain={[0,100]}/>
                <Radar name="Dependency" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>GDP by Nature Sector</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sectorData} dataKey="pct" nameKey="sector" cx="50%" cy="50%" outerRadius={80} label={({sector,pct})=>`${sector}: ${pct}%`} labelLine={false} fontSize={9}>
                  {sectorData.map((_,j)=><Cell key={j} fill={PIE_COLORS[j%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Ecosystem Service Values ($Bn)</div>
            {svcData.map((sv,j)=>(
              <ProgressBar key={j} label={sv.service} pct={sv.value*12} color={PIE_COLORS[j%PIE_COLORS.length]}/>
            ))}
          </div>
        </div>

        <div style={{...S.grid2,marginTop:16}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>BII Trend (2018-2025)</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={detail.annualBii} margin={{left:10,right:10,top:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}} domain={['auto','auto']}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="value" name="BII" stroke={T.sage} fill={T.sage} fillOpacity={0.3}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Threatened Species (IUCN)</div>
            <div style={S.grid2}>
              {[
                {k:'cr',l:'Critically Endangered',c:T.red},
                {k:'en',l:'Endangered',c:T.amber},
                {k:'vu',l:'Vulnerable',c:T.gold},
                {k:'nt',l:'Near Threatened',c:T.sage}
              ].map(cat=>(
                <div key={cat.k} style={{padding:8,background:cat.c+'12',borderRadius:6,border:`1px solid ${cat.c}30`,textAlign:'center'}}>
                  <div style={{fontSize:18,fontWeight:700,color:cat.c}}>{detail.threatSpecies[cat.k]}</div>
                  <div style={{fontSize:9,color:T.textSec,fontFamily:T.mono}}>{cat.l}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,fontSize:11,color:T.textSec}}>
              Total threatened: <strong style={{color:T.red}}>{detail.threatSpecies.cr+detail.threatSpecies.en+detail.threatSpecies.vu}</strong> species
              | Carbon sink: <strong>{detail.carbonSink} MtCO2/yr</strong>
              | Nature loss GDP impact: <strong style={{color:T.red}}>{detail.natureLossGdpImpact}%</strong>
            </div>
          </div>
        </div>

        <div style={{marginTop:16,padding:12,background:T.surfaceH,borderRadius:6}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>GBF 30x30 Target Tracker</div>
          <div style={{display:'flex',gap:8,alignItems:'center',fontSize:12,flexWrap:'wrap'}}>
            <span>Current protected area: <strong>{detail.protArea}%</strong></span>
            <span>|</span>
            <span>Target: <strong>30%</strong></span>
            <span>|</span>
            <span>Gap: <strong style={{color:detail.protArea>=30?T.green:T.red}}>{detail.protArea>=30?'Met':`${(30-detail.protArea).toFixed(1)}% remaining`}</strong></span>
            <span>|</span>
            <span>Freshwater dependency: <strong>{detail.freshwaterDep}%</strong></span>
            <span>|</span>
            <span>Harmful subsidies: <strong style={{color:T.amber}}>${detail.subsidyHarmful}Bn</strong></span>
          </div>
          <div style={{marginTop:8}}>
            <ProgressBar pct={(detail.protArea/30)*100} color={detail.protArea>=30?T.green:T.amber} showPct={false}/>
          </div>
        </div>

        <div style={{marginTop:12,padding:12,background:T.surfaceH,borderRadius:6}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Additional Nature Metrics</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
            {[
              {l:'Eco Service Total',v:`$${detail.ecoServiceTotal}Bn`},
              {l:'Carbon Sink',v:`${detail.carbonSink} Mt`},
              {l:'Freshwater Dep.',v:`${detail.freshwaterDep}%`},
              {l:'Credit Rating',v:detail.creditRating},
              {l:'Nat Loss Impact',v:`${detail.natureLossGdpImpact}% GDP`}
            ].map((m,j)=>(
              <div key={j} style={{textAlign:'center',padding:6}}>
                <div style={{fontSize:14,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{m.v}</div>
                <div style={{fontSize:9,color:T.textMut,fontFamily:T.mono}}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>);
};

/* ================================================================
   TAB 2: NATURE RISK ASSESSMENT
   ================================================================ */
const NatureRiskTab=()=>{
  const [riskDim,setRiskDim]=useState('natRisk');
  const [selCountry,setSelCountry]=useState(null);

  const riskDims=[
    {key:'deforest',label:'Deforestation',color:T.red},
    {key:'waterStress',label:'Water Stress',color:T.navy},
    {key:'soilDeg',label:'Soil Degradation',color:T.amber},
    {key:'marineHealth',label:'Marine Health',color:'#0d9488'},
    {key:'pollution',label:'Pollution',color:'#7c3aed'},
    {key:'natRisk',label:'Overall Nature Risk',color:T.sage}
  ];

  const topRisk=useMemo(()=>[...COUNTRIES].sort((a,b)=>b.natRisk-a.natRisk).slice(0,20),[]);
  const heatmapCountries=useMemo(()=>[...COUNTRIES].sort((a,b)=>b.natRisk-a.natRisk).slice(0,25),[]);

  const detail=selCountry?COUNTRIES.find(c=>c.name===selCountry):null;

  const leapData=useMemo(()=>{
    const counts={Locate:0,Evaluate:0,Assess:0,Prepare:0};
    COUNTRIES.forEach(c=>{counts[c.tnfdLeap]++;});
    return Object.entries(counts).map(([k,v])=>({stage:k,count:v}));
  },[]);

  const avgNatRisk=(COUNTRIES.reduce((s,c)=>s+c.natRisk,0)/60).toFixed(1);
  const highRisk=COUNTRIES.filter(c=>c.natRisk>65).length;
  const avgWater=(COUNTRIES.reduce((s,c)=>s+c.waterStress,0)/60).toFixed(1);

  return(<div>
    <div style={S.grid4}>
      <KPI label="Avg Nature Risk Score" value={avgNatRisk} sub="0-100 scale"/>
      <KPI label="High Risk Countries" value={highRisk} sub="Score > 65"/>
      <KPI label="Avg Water Stress" value={`${avgWater}%`} sub="Baseline water stress"/>
      <KPI label="TNFD LEAP Coverage" value={`${COUNTRIES.filter(c=>c.tnfdLeap==='Prepare').length}`} sub="Countries at Prepare stage"/>
    </div>

    <div style={{...S.card,marginTop:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={S.cardTitle}>Nature Risk Heatmap — Countries x Risk Dimensions</div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Country</th>
            {riskDims.map(d=><th key={d.key} style={{...S.th,textAlign:'center'}}>{d.label}</th>)}
            <th style={{...S.th,textAlign:'center'}}>TNFD LEAP</th>
          </tr></thead>
          <tbody>{heatmapCountries.map((c,i)=>(
            <tr key={c.name} style={{background:i%2===0?'transparent':T.surfaceH}}>
              <td style={{...S.td,fontWeight:600,cursor:'pointer'}} onClick={()=>setSelCountry(c.name)}>{c.name}</td>
              {riskDims.map(d=>{
                const v=d.key==='deforest'?c.deforest*20:c[d.key];
                const bg=v>70?T.red+'25':v>45?T.amber+'25':T.green+'20';
                const fg=v>70?T.red:v>45?T.amber:T.green;
                return <td key={d.key} style={{...S.td,textAlign:'center',background:bg}}>
                  <span style={{fontWeight:600,color:fg,fontFamily:T.mono,fontSize:11}}>{typeof c[d.key]==='number'?c[d.key].toFixed?.(1)??c[d.key]:c[d.key]}</span>
                </td>;
              })}
              <td style={{...S.td,textAlign:'center'}}>
                <span style={S.badge(c.tnfdLeap==='Prepare'?T.green:c.tnfdLeap==='Assess'?T.amber:T.textMut)}>{c.tnfdLeap}</span>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>

    <div style={S.grid2}>
      <div style={S.card}>
        <div style={S.cardTitle}>Physical vs Transition Nature Risk</div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={topRisk} margin={{left:10,right:10,top:10,bottom:60}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-45} textAnchor="end"/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="physRisk" name="Physical Risk" fill={T.red} radius={[4,4,0,0]}/>
            <Bar dataKey="transRisk" name="Transition Risk" fill={T.navy} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>TNFD LEAP Assessment Progress</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={leapData} margin={{left:10,right:10,top:10,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="stage" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="count" name="Countries" fill={T.sage} radius={[4,4,0,0]}>
              {leapData.map((_,j)=><Cell key={j} fill={[T.textMut,T.amber,T.gold,T.green][j]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{marginTop:12}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>LEAP Framework Stages</div>
          {['Locate: Identify nature interface','Evaluate: Dependencies & impacts','Assess: Material risks & opportunities','Prepare: Respond & report'].map((s,j)=>(
            <div key={j} style={{fontSize:11,color:T.textSec,marginBottom:4,paddingLeft:8,borderLeft:`3px solid ${[T.textMut,T.amber,T.gold,T.green][j]}`}}>{s}</div>
          ))}
        </div>
      </div>
    </div>

    <div style={S.card}>
      <div style={S.cardTitle}>Nature Risk vs BII Correlation (All 60 Countries)</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={[...COUNTRIES].sort((a,b)=>b.natRisk-a.natRisk).slice(0,30)} margin={{left:10,right:10,top:10,bottom:60}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-50} textAnchor="end"/>
          <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
          <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Legend wrapperStyle={{fontSize:10}}/>
          <Bar yAxisId="left" dataKey="natRisk" name="Nature Risk" fill={T.red} opacity={0.7} radius={[2,2,0,0]}/>
          <Bar yAxisId="right" dataKey="bii" name="BII Score" fill={T.sage} opacity={0.7} radius={[2,2,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {detail&&(
      <div style={{...S.card,border:`2px solid ${T.gold}`,marginTop:8}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{detail.name} — Nature Risk Profile</div>
            <div style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>Overall Risk: {detail.natRisk}/100 | TNFD Stage: {detail.tnfdLeap} | Credit: {detail.creditRating}</div>
          </div>
          <button style={S.btn} onClick={()=>setSelCountry(null)}>Close</button>
        </div>
        <div style={S.grid3}>
          <div>
            <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Risk Dimensions</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={riskDims.map(d=>({dim:d.label,score:d.key==='deforest'?detail.deforest*20:detail[d.key]}))}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/>
                <PolarRadiusAxis tick={{fontSize:8}} domain={[0,100]}/>
                <Radar name="Risk" dataKey="score" stroke={T.red} fill={T.red} fillOpacity={0.2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Key Metrics</div>
            {[
              {l:'Deforestation Rate',v:`${detail.deforest}% / yr`,c:detail.deforest>2?T.red:T.green},
              {l:'Water Stress',v:`${detail.waterStress}%`,c:detail.waterStress>50?T.red:T.green},
              {l:'Soil Degradation',v:`${detail.soilDeg}%`,c:detail.soilDeg>40?T.red:T.green},
              {l:'Marine Health',v:`${detail.marineHealth}/100`,c:detail.marineHealth>60?T.green:T.red},
              {l:'Pollution Index',v:`${detail.pollution}/100`,c:detail.pollution>50?T.red:T.green},
              {l:'Physical Risk',v:`${detail.physRisk}/100`,c:detail.physRisk>60?T.red:T.green},
              {l:'Transition Risk',v:`${detail.transRisk}/100`,c:detail.transRisk>50?T.red:T.green},
              {l:'Nature Loss GDP',v:`${detail.natureLossGdpImpact}%`,c:detail.natureLossGdpImpact>4?T.red:T.green},
              {l:'Carbon Sink',v:`${detail.carbonSink} Mt`,c:T.sage},
            ].map((m,j)=>(
              <div key={j} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                <span style={{color:T.textSec}}>{m.l}</span>
                <span style={{fontWeight:700,color:m.c,fontFamily:T.mono}}>{m.v}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Ecosystem Exposure</div>
            {ECOSYSTEMS.map((e,j)=>(
              <ProgressBar key={j} label={ECO_LABELS[e]} pct={detail.ecoBreak[e]} color={ECO_COLORS[e]}/>
            ))}
            <div style={{marginTop:10,fontSize:12,fontWeight:700,marginBottom:6}}>Threatened Species</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[{k:'cr',l:'CR',c:T.red},{k:'en',l:'EN',c:T.amber},{k:'vu',l:'VU',c:T.gold},{k:'nt',l:'NT',c:T.sage}].map(cat=>(
                <span key={cat.k} style={{...S.badge(cat.c),fontSize:10}}>{cat.l}: {detail.threatSpecies[cat.k]}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>);
};

/* ================================================================
   TAB 3: GBF & POLICY TRACKER
   ================================================================ */
const GbfPolicyTab=()=>{
  const [selCountry,setSelCountry]=useState(COUNTRIES[0].name);
  const [targetFilter,setTargetFilter]=useState('all');

  const detail=COUNTRIES.find(c=>c.name===selCountry);

  const nbsapCounts=useMemo(()=>{
    const cnt={Submitted:0,'In Progress':0,Draft:0,'Not Started':0};
    COUNTRIES.forEach(c=>{cnt[c.nbsapStatus]++;});
    return Object.entries(cnt).map(([k,v])=>({status:k,count:v}));
  },[]);

  const avgPolicy=(COUNTRIES.reduce((s,c)=>s+c.policyStringency,0)/60).toFixed(1);
  const totalInvest=COUNTRIES.reduce((s,c)=>s+c.natureInvest,0).toFixed(1);
  const submittedPct=((COUNTRIES.filter(c=>c.nbsapStatus==='Submitted').length/60)*100).toFixed(0);

  const protAreaTimeline=useMemo(()=>{
    return [2020,2022,2024,2025,2026,2028,2030].map((yr,i)=>{
      const avgProt=COUNTRIES.reduce((s,c)=>s+(c.protArea*(0.7+i*0.05)),0)/60;
      return {year:yr,avgProtected:+avgProt.toFixed(1),target:yr<=2030?30:30};
    });
  },[]);

  const gbfTargets=targetFilter==='all'?GBF_TARGETS:
    targetFilter==='high'?GBF_TARGETS.filter(t=>detail.gbfProgress[t.id]>=60):
    GBF_TARGETS.filter(t=>detail.gbfProgress[t.id]<40);

  const natureInvestTop=useMemo(()=>[...COUNTRIES].sort((a,b)=>b.natureInvest-a.natureInvest).slice(0,15),[]);

  return(<div>
    <div style={S.grid4}>
      <KPI label="Avg Policy Stringency" value={avgPolicy} sub="0-100 index"/>
      <KPI label="Total Nature Investment" value={`$${totalInvest}Bn`} sub="60 countries combined"/>
      <KPI label="NBSAP Submitted" value={`${submittedPct}%`} sub="National biodiversity strategies"/>
      <KPI label="GBF Targets" value="23" sub="Kunming-Montreal Framework"/>
    </div>

    <div style={{...S.card,marginTop:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={S.cardTitle}>GBF Target Progress — {selCountry}</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <select style={S.select} value={selCountry} onChange={e=>setSelCountry(e.target.value)}>
            {COUNTRIES.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <div>
            {[{k:'all',l:'All'},{k:'high',l:'On Track (>60%)'},{k:'low',l:'Behind (<40%)'}].map(f=>(
              <span key={f.k} style={S.pill(targetFilter===f.k)} onClick={()=>setTargetFilter(f.k)}>{f.l}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {gbfTargets.map(t=>{
          const pct=detail.gbfProgress[t.id];
          const color=pct>=70?T.green:pct>=40?T.amber:T.red;
          return(
            <div key={t.id} style={{padding:10,background:T.surfaceH,borderRadius:6,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,fontWeight:700,color:T.navy,marginBottom:4,fontFamily:T.mono}}>Target {t.id}</div>
              <div style={{fontSize:11,color:T.textSec,marginBottom:6,minHeight:28}}>{t.short}</div>
              <ProgressBar pct={pct} color={color} showPct={true}/>
            </div>
          );
        })}
      </div>
    </div>

    <div style={S.grid2}>
      <div style={S.card}>
        <div style={S.cardTitle}>NBSAP Submission Status</div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={nbsapCounts} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({status,count})=>`${status}: ${count}`} fontSize={11}>
              {nbsapCounts.map((_,j)=><Cell key={j} fill={[T.green,T.amber,T.gold,T.red][j]}/>)}
            </Pie>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Protected Area Expansion Timeline</div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={protAreaTimeline} margin={{left:10,right:10,top:10,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,40]}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="avgProtected" name="Avg Protected %" stroke={T.sage} fill={T.sage} fillOpacity={0.3}/>
            <Area type="monotone" dataKey="target" name="30x30 Target" stroke={T.red} fill="none" strokeDasharray="5 5"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={S.grid2}>
      <div style={S.card}>
        <div style={S.cardTitle}>Nature-Positive Investment Commitments (Top 15)</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={natureInvestTop} layout="vertical" margin={{left:100,right:20,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} label={{value:'$Bn Committed',position:'insideBottom',offset:-2,fontSize:10}}/>
            <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.text}} width={95}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="natureInvest" name="Investment ($Bn)" fill={T.sage} radius={[0,4,4,0]}>
              {natureInvestTop.map((_,i)=><Cell key={i} fill={i<5?T.sage:T.gold}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Policy Stringency Index — All 60 Countries</div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Country</th>
              <th style={S.th}>Policy Index</th>
              <th style={S.th}>NBSAP</th>
              <th style={S.th}>Nat. Invest ($Bn)</th>
              <th style={S.th}>Harmful Subsidies</th>
              <th style={S.th}>30x30 Status</th>
              <th style={S.th}>Income</th>
            </tr></thead>
            <tbody>{[...COUNTRIES].sort((a,b)=>b.policyStringency-a.policyStringency).map((c,i)=>(
              <tr key={c.name} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={{...S.td,fontWeight:600}}>{c.name}</td>
                <td style={S.td}>
                  <span style={S.badge(c.policyStringency>65?T.green:c.policyStringency>35?T.amber:T.red)}>{c.policyStringency}</span>
                </td>
                <td style={S.td}>
                  <span style={S.badge(c.nbsapStatus==='Submitted'?T.green:c.nbsapStatus==='In Progress'?T.amber:T.red)}>{c.nbsapStatus}</span>
                </td>
                <td style={{...S.td,fontFamily:T.mono}}>${c.natureInvest}Bn</td>
                <td style={{...S.td,fontFamily:T.mono,color:c.subsidyHarmful>6?T.red:T.textSec}}>${c.subsidyHarmful}Bn</td>
                <td style={S.td}>
                  <span style={S.badge(c.thirtyByThirty==='On Track'?T.green:T.red)}>{c.thirtyByThirty}</span>
                </td>
                <td style={{...S.td,fontSize:10}}>{c.incomeClass}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div style={S.card}>
      <div style={S.cardTitle}>GBF Target 18: Harmful Subsidy Reform ($500B target)</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={[...COUNTRIES].sort((a,b)=>b.subsidyHarmful-a.subsidyHarmful).slice(0,20)} margin={{left:10,right:10,top:10,bottom:60}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-45} textAnchor="end"/>
          <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'$Bn Harmful Subsidies',angle:-90,position:'insideLeft',fontSize:10}}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Bar dataKey="subsidyHarmful" name="Harmful Subsidies ($Bn)" fill={T.red} radius={[4,4,0,0]} opacity={0.8}>
            {[...COUNTRIES].sort((a,b)=>b.subsidyHarmful-a.subsidyHarmful).slice(0,20).map((_,i)=>(
              <Cell key={i} fill={i<5?T.red:i<10?T.amber:T.gold}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={S.grid2}>
      <div style={S.card}>
        <div style={S.cardTitle}>GBF Target 19: Biodiversity Finance Gap</div>
        <div style={{padding:16,background:T.surfaceH,borderRadius:6,marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Annual Biodiversity Finance Target: $200Bn/yr</div>
          <div style={{display:'flex',gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Current mobilization</div>
              <div style={{fontSize:20,fontWeight:700,color:T.amber}}>${totalInvest}Bn</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Finance gap</div>
              <div style={{fontSize:20,fontWeight:700,color:T.red}}>${(200-parseFloat(totalInvest)).toFixed(1)}Bn</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Gap closure</div>
              <div style={{fontSize:20,fontWeight:700,color:T.navy}}>{((parseFloat(totalInvest)/200)*100).toFixed(1)}%</div>
            </div>
          </div>
          <div style={{marginTop:10}}>
            <ProgressBar pct={(parseFloat(totalInvest)/200)*100} color={T.sage} label="Progress toward $200Bn target"/>
          </div>
        </div>
        <div style={{fontSize:11,color:T.textSec}}>
          Based on nature-positive investment commitments from 60 tracked countries.
          Finance gap analysis aligned with GBF Target 19 requirements.
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Income Group GBF Readiness</div>
        {['High','Upper-Middle','Lower-Middle','Low'].map(inc=>{
          const group=COUNTRIES.filter(c=>c.incomeClass===inc);
          if(!group.length)return null;
          const avgPol=(group.reduce((s,c)=>s+c.policyStringency,0)/group.length).toFixed(0);
          const avgInv=(group.reduce((s,c)=>s+c.natureInvest,0)/group.length).toFixed(2);
          const submitted=group.filter(c=>c.nbsapStatus==='Submitted').length;
          return(
            <div key={inc} style={{padding:10,marginBottom:8,background:T.surfaceH,borderRadius:6,border:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{inc} Income ({group.length} countries)</span>
                <span style={S.badge(parseInt(avgPol)>50?T.green:T.amber)}>Policy: {avgPol}</span>
              </div>
              <div style={{display:'flex',gap:16,fontSize:11,color:T.textSec}}>
                <span>Avg Investment: ${avgInv}Bn</span>
                <span>NBSAP Submitted: {submitted}/{group.length}</span>
              </div>
              <ProgressBar pct={parseInt(avgPol)} color={parseInt(avgPol)>60?T.green:T.amber} showPct={false}/>
            </div>
          );
        })}
      </div>
    </div>
  </div>);
};

/* ================================================================
   TAB 4: PORTFOLIO NATURE OVERLAY
   ================================================================ */
const PortfolioNatureTab=()=>{
  const [sortCol,setSortCol]=useState('natAdjSpread');
  const [sortDir,setSortDir]=useState('desc');

  const holdings=useMemo(()=>COUNTRIES.map(c=>{
    const natAdjSpread=Math.round(c.sovSpread*(1+c.natRisk/200));
    const fiscalRisk=+(c.natGdp*c.natRisk/100).toFixed(1);
    return {...c,natAdjSpread,fiscalRisk};
  }),[]);

  const sorted=useMemo(()=>{
    return [...holdings].sort((a,b)=>sortDir==='desc'?b[sortCol]-a[sortCol]:a[sortCol]-b[sortCol]);
  },[holdings,sortCol,sortDir]);

  const toggleSort=(col)=>{
    if(sortCol===col)setSortDir(d=>d==='desc'?'asc':'desc');
    else{setSortCol(col);setSortDir('desc');}
  };

  const totalHoldings=holdings.reduce((s,c)=>s+c.bondHolding,0).toFixed(1);
  const avgNatSpread=(holdings.reduce((s,c)=>s+c.natAdjSpread,0)/60).toFixed(0);
  const topFiscalRisk=[...holdings].sort((a,b)=>b.fiscalRisk-a.fiscalRisk).slice(0,5);
  const highFiscalCount=holdings.filter(h=>h.fiscalRisk>15).length;

  const regionDiv=useMemo(()=>{
    const reg={};
    holdings.forEach(h=>{
      if(!reg[h.region])reg[h.region]={region:h.region,totalHolding:0,avgRisk:0,count:0};
      reg[h.region].totalHolding+=h.bondHolding;
      reg[h.region].avgRisk+=h.natRisk;
      reg[h.region].count++;
    });
    return Object.values(reg).map(r=>({...r,avgRisk:+(r.avgRisk/r.count).toFixed(1),totalHolding:+r.totalHolding.toFixed(1)}));
  },[holdings]);

  const spreadVsRisk=useMemo(()=>holdings.map(h=>({
    name:h.name,spread:h.natAdjSpread,risk:h.natRisk,holding:h.bondHolding
  })).sort((a,b)=>b.risk-a.risk).slice(0,20),[holdings]);

  const exportCSV=useCallback(()=>{
    const headers=['Country','Region','BII','Nature GDP %','Nature Risk Score','Sovereign Spread (bps)','Nature-Adj Spread (bps)','Bond Holding ($M)','Fiscal Risk Score','Physical Risk','Transition Risk','TNFD LEAP','Protected Area %','30x30 Status'];
    const rows=sorted.map(c=>[c.name,c.region,c.bii,c.natGdp,c.natRisk,c.sovSpread,c.natAdjSpread,c.bondHolding,c.fiscalRisk,c.physRisk,c.transRisk,c.tnfdLeap,c.protArea,c.thirtyByThirty].join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='sovereign_nature_risk_report.csv';a.click();
    URL.revokeObjectURL(url);
  },[sorted]);

  return(<div>
    <div style={S.grid4}>
      <KPI label="Total Sovereign Holdings" value={`$${totalHoldings}M`} sub="60 countries"/>
      <KPI label="Avg Nature-Adj Spread" value={`${avgNatSpread} bps`} sub="Nature risk premium included"/>
      <KPI label="High Fiscal Risk" value={highFiscalCount} sub="Nature-related fiscal risk > 15"/>
      <KPI label="Top Fiscal Risk" value={topFiscalRisk[0]?.name} sub={`Score: ${topFiscalRisk[0]?.fiscalRisk}`}/>
    </div>

    <div style={{...S.card,marginTop:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={S.cardTitle}>Sovereign Bond Holdings x Nature Risk</div>
        <button style={S.btnPrimary} onClick={exportCSV}>Export CSV Report</button>
      </div>
      <div style={S.scrollTable}>
        <table style={S.table}>
          <thead><tr>
            {[
              {k:'name',l:'Country'},{k:'region',l:'Region'},{k:'bondHolding',l:'Holding ($M)'},
              {k:'sovSpread',l:'Spread (bps)'},{k:'natAdjSpread',l:'Nat-Adj Spread'},
              {k:'natRisk',l:'Nature Risk'},{k:'fiscalRisk',l:'Fiscal Risk'},
              {k:'natGdp',l:'Nat GDP %'},{k:'bii',l:'BII'},{k:'tnfdLeap',l:'TNFD'}
            ].map(col=>(
              <th key={col.k} style={{...S.th,cursor:'pointer'}} onClick={()=>toggleSort(col.k)}>
                {col.l}{sortCol===col.k?(sortDir==='desc'?' v':' ^'):''}
              </th>
            ))}
          </tr></thead>
          <tbody>{sorted.map((c,i)=>(
            <tr key={c.name} style={{background:i%2===0?'transparent':T.surfaceH}}>
              <td style={{...S.td,fontWeight:600}}>{c.name}</td>
              <td style={S.td}>{c.region}</td>
              <td style={{...S.td,fontFamily:T.mono}}>${c.bondHolding}M</td>
              <td style={{...S.td,fontFamily:T.mono}}>{c.sovSpread}</td>
              <td style={{...S.td,fontFamily:T.mono,fontWeight:700,color:c.natAdjSpread>300?T.red:c.natAdjSpread>150?T.amber:T.green}}>{c.natAdjSpread}</td>
              <td style={S.td}><span style={S.badge(c.natRisk>65?T.red:c.natRisk>35?T.amber:T.green)}>{c.natRisk}</span></td>
              <td style={{...S.td,fontFamily:T.mono,color:c.fiscalRisk>15?T.red:c.fiscalRisk>8?T.amber:T.green,fontWeight:600}}>{c.fiscalRisk}</td>
              <td style={S.td}>{c.natGdp}%</td>
              <td style={S.td}>{c.bii}</td>
              <td style={S.td}><span style={S.badge(c.tnfdLeap==='Prepare'?T.green:T.textMut)}>{c.tnfdLeap}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>

    <div style={S.grid2}>
      <div style={S.card}>
        <div style={S.cardTitle}>Nature-Adjusted Spread vs Nature Risk (Top 20)</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={spreadVsRisk} margin={{left:10,right:10,top:10,bottom:60}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-45} textAnchor="end"/>
            <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textSec}} label={{value:'Spread (bps)',angle:-90,position:'insideLeft',fontSize:10}}/>
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textSec}} label={{value:'Risk Score',angle:90,position:'insideRight',fontSize:10}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar yAxisId="left" dataKey="spread" name="Nat-Adj Spread" fill={T.navy} radius={[4,4,0,0]}/>
            <Bar yAxisId="right" dataKey="risk" name="Nature Risk" fill={T.red} radius={[4,4,0,0]} opacity={0.6}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Portfolio Diversification by Nature Dependency</div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={regionDiv} dataKey="totalHolding" nameKey="region" cx="50%" cy="50%" outerRadius={85} label={({region,totalHolding})=>`${region}: $${totalHolding.toFixed(0)}M`} fontSize={10}>
              {regionDiv.map((_,j)=><Cell key={j} fill={PIE_COLORS[j%PIE_COLORS.length]}/>)}
            </Pie>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{marginTop:8}}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Region</th>
              <th style={S.th}>Holding ($M)</th>
              <th style={S.th}>Avg Nature Risk</th>
              <th style={S.th}>Countries</th>
            </tr></thead>
            <tbody>{regionDiv.sort((a,b)=>b.totalHolding-a.totalHolding).map((r,i)=>(
              <tr key={r.region} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={{...S.td,fontWeight:600}}>{r.region}</td>
                <td style={{...S.td,fontFamily:T.mono}}>${r.totalHolding.toFixed(0)}M</td>
                <td style={S.td}><span style={S.badge(r.avgRisk>50?T.red:r.avgRisk>30?T.amber:T.green)}>{r.avgRisk}</span></td>
                <td style={{...S.td,fontFamily:T.mono}}>{r.count}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div style={S.card}>
      <div style={S.cardTitle}>Highest Nature-Related Fiscal Risk Countries</div>
      <div style={S.grid3}>
        {[...holdings].sort((a,b)=>b.fiscalRisk-a.fiscalRisk).slice(0,9).map((c,i)=>(
          <div key={c.name} style={{padding:12,background:T.surfaceH,borderRadius:6,border:`1px solid ${T.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:700,color:T.navy}}>{c.name}</span>
              <span style={{...S.badge(c.fiscalRisk>15?T.red:T.amber),fontSize:12}}>Risk: {c.fiscalRisk}</span>
            </div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Nature GDP: {c.natGdp}% | BII: {c.bii} | Credit: {c.creditRating}</div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:6}}>Bond Holding: ${c.bondHolding}M | Spread: {c.natAdjSpread} bps</div>
            <ProgressBar pct={c.natRisk} color={c.natRisk>65?T.red:T.amber} label="Nature Risk" showPct={true}/>
            <ProgressBar pct={c.physRisk} color={T.navy} label="Physical Risk" showPct={true}/>
            <ProgressBar pct={c.transRisk} color={T.gold} label="Transition Risk" showPct={true}/>
          </div>
        ))}
      </div>
    </div>

    <div style={S.grid2}>
      <div style={S.card}>
        <div style={S.cardTitle}>Nature-Adjusted Spread by Credit Rating</div>
        {(() => {
          const byRating = {};
          holdings.forEach(h => {
            if (!byRating[h.creditRating]) byRating[h.creditRating] = { rating: h.creditRating, total: 0, count: 0, avgNatRisk: 0 };
            byRating[h.creditRating].total += h.natAdjSpread;
            byRating[h.creditRating].avgNatRisk += h.natRisk;
            byRating[h.creditRating].count++;
          });
          const ratingData = Object.values(byRating).map(r => ({
            ...r, avgSpread: Math.round(r.total / r.count), avgNatRisk: +(r.avgNatRisk / r.count).toFixed(1)
          })).sort((a, b) => a.avgSpread - b.avgSpread);
          return (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ratingData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rating" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avgSpread" name="Avg Nat-Adj Spread (bps)" fill={T.navy} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgNatRisk" name="Avg Nature Risk" fill={T.red} opacity={0.6} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Portfolio Nature Risk Concentration</div>
        <div style={{ padding: 12, background: T.surfaceH, borderRadius: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Concentration Analysis</div>
          {(() => {
            const high = holdings.filter(h => h.natRisk > 65);
            const med = holdings.filter(h => h.natRisk > 35 && h.natRisk <= 65);
            const low = holdings.filter(h => h.natRisk <= 35);
            const highPct = ((high.reduce((s, h) => s + h.bondHolding, 0) / parseFloat(totalHoldings)) * 100).toFixed(1);
            const medPct = ((med.reduce((s, h) => s + h.bondHolding, 0) / parseFloat(totalHoldings)) * 100).toFixed(1);
            const lowPct = ((low.reduce((s, h) => s + h.bondHolding, 0) / parseFloat(totalHoldings)) * 100).toFixed(1);
            return (
              <div>
                <ProgressBar pct={parseFloat(highPct)} color={T.red} label={`High Risk (${high.length} countries — ${highPct}% of holdings)`} />
                <ProgressBar pct={parseFloat(medPct)} color={T.amber} label={`Medium Risk (${med.length} countries — ${medPct}% of holdings)`} />
                <ProgressBar pct={parseFloat(lowPct)} color={T.green} label={`Low Risk (${low.length} countries — ${lowPct}% of holdings)`} />
              </div>
            );
          })()}
        </div>
        <div style={{ fontSize: 11, color: T.textSec }}>
          Portfolio concentration by nature risk tier. High risk countries with nature risk score above 65
          should be monitored for potential nature-related sovereign credit events and TNFD disclosure requirements.
        </div>
      </div>
    </div>

    <div style={S.card}>
      <div style={S.cardTitle}>Nature Loss GDP Impact vs Bond Holdings</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={[...holdings].sort((a, b) => b.natureLossGdpImpact - a.natureLossGdpImpact).slice(0, 20)} margin={{ left: 10, right: 10, top: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-45} textAnchor="end" />
          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'GDP Impact %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Holding $M', angle: 90, position: 'insideRight', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="natureLossGdpImpact" name="Nature Loss GDP %" fill={T.red} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="bondHolding" name="Bond Holding ($M)" fill={T.sage} opacity={0.6} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={S.card}>
      <div style={S.cardTitle}>Sovereign Nature Risk Summary Statistics</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {[
          { l: 'Total Countries', v: '60' },
          { l: 'Total Holdings', v: `$${totalHoldings}M` },
          { l: 'Avg Nat Risk', v: (holdings.reduce((s, c) => s + c.natRisk, 0) / 60).toFixed(1) },
          { l: 'Avg Fiscal Risk', v: (holdings.reduce((s, c) => s + c.fiscalRisk, 0) / 60).toFixed(1) },
          { l: 'Avg BII', v: (holdings.reduce((s, c) => s + c.bii, 0) / 60).toFixed(1) },
          { l: 'Avg Deforest', v: `${(holdings.reduce((s, c) => s + c.deforest, 0) / 60).toFixed(2)}%` },
        ].map((m, j) => (
          <div key={j} style={{ textAlign: 'center', padding: 12, background: T.surfaceH, borderRadius: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{m.v}</div>
            <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono, marginTop: 4 }}>{m.l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>);
};

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */
const TABS=[
  {key:'dependency',label:'Nature Dependency'},
  {key:'risk',label:'Nature Risk Assessment'},
  {key:'gbf',label:'GBF & Policy Tracker'},
  {key:'portfolio',label:'Portfolio Nature Overlay'}
];

export default function SovereignNatureRiskPage(){
  const [tab,setTab]=useState('dependency');

  return(
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.title}>EP-AQ4 Sovereign Nature & Biodiversity Risk</div>
        <div style={S.subtitle}>Country-level nature dependency, ecosystem service valuation, TNFD sovereign alignment, nature-related fiscal risk | 60 countries | 6 ecosystems | 23 GBF targets</div>
      </div>

      <div style={S.tabs}>
        {TABS.map(t=>(
          <div key={t.key} style={S.tab(tab===t.key)} onClick={()=>setTab(t.key)}>{t.label}</div>
        ))}
      </div>

      {tab==='dependency'&&<NatureDependencyTab/>}
      {tab==='risk'&&<NatureRiskTab/>}
      {tab==='gbf'&&<GbfPolicyTab/>}
      {tab==='portfolio'&&<PortfolioNatureTab/>}
    </div>
  );
}
