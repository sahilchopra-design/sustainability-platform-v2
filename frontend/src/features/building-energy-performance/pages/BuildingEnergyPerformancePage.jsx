import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Building Portfolio','CRREM Pathway Analysis','Energy Efficiency','MEES & Regulation'];
const TYPES=['Office','Retail','Residential','Industrial','Logistics','Mixed-Use'];
const EPC_RATINGS=['A','B','C','D','E','F','G'];
const EPC_COLORS={'A':'#16a34a','B':'#22c55e','C':'#84cc16','D':'#eab308','E':'#f97316','F':'#ef4444','G':'#dc2626'};
const CITIES=['London','Manchester','Birmingham','Edinburgh','Bristol','Leeds','Glasgow','Cardiff','Liverpool','Sheffield','Dublin','Frankfurt','Paris','Amsterdam','Madrid'];
const RETROFIT_TECH=['LED Lighting','HVAC Upgrade','Solar PV','Heat Pump','Double Glazing','Wall Insulation','Roof Insulation','BMS Optimisation','Smart Meters','EV Charging'];

const buildingData=Array.from({length:150},(_,i)=>{
  const s=sr(i*7+3);const s2=sr(i*11+5);const s3=sr(i*13+7);const s4=sr(i*17+11);const s5=sr(i*19+13);
  const type=TYPES[Math.floor(s*6)];
  const epcIdx=Math.floor(s2*7);const epc=EPC_RATINGS[epcIdx];
  const area=Math.floor(500+s3*49500);
  const yearBuilt=Math.floor(1950+s4*73);
  const city=CITIES[Math.floor(s5*CITIES.length)];
  const baseIntensity={'Office':180,'Retail':220,'Residential':120,'Industrial':280,'Logistics':150,'Mixed-Use':200};
  const intensity=Math.floor(baseIntensity[type]*(0.5+s*0.8));
  const crremTarget=Math.floor(baseIntensity[type]*0.35);
  const strandingYear=intensity>crremTarget*2?2026+Math.floor(s2*4):intensity>crremTarget?2030+Math.floor(s3*5):2040+Math.floor(s4*10);
  const annualEnergy=Math.floor(intensity*area/1000);
  const annualCost=Math.floor(annualEnergy*0.15*1000);
  const co2=Math.floor(annualEnergy*0.21);
  const value=Math.floor(area*(type==='Office'?4500:type==='Retail'?3200:type==='Residential'?5500:type==='Industrial'?1800:type==='Logistics'?2100:3800)*(0.8+s3*0.4));
  const retrofitCost=Math.floor(area*(25+s4*75));
  const meesCompliant=epcIdx<=3;
  return {id:i+1,name:`${city} ${type} ${i+1}`,type,epc,epcIdx,area,yearBuilt,city,intensity,crremTarget,strandingYear,annualEnergy,annualCost,co2,value,retrofitCost,meesCompliant,occupancy:Math.floor(70+s5*30),greenLeasePerc:Math.floor(s*100),renewablePerc:Math.floor(s2*40)};
});

const crremPathways15=Array.from({length:28},(_,i)=>({year:2023+i,office:180-i*5.2,retail:220-i*6.4,residential:120-i*3.5,industrial:280-i*8.1,logistics:150-i*4.3,mixedUse:200-i*5.8}));
const crremPathways20=Array.from({length:28},(_,i)=>({year:2023+i,office:180-i*3.8,retail:220-i*4.7,residential:120-i*2.5,industrial:280-i*5.9,logistics:150-i*3.1,mixedUse:200-i*4.2}));

const retrofitOptions=RETROFIT_TECH.map((tech,i)=>{
  const s=sr(i*31+17);const s2=sr(i*37+23);
  return{tech,costPerSqm:Math.floor(15+s*120),energySaving:Math.floor(5+s2*25),paybackYears:+(1.5+s*8).toFixed(1),co2Reduction:Math.floor(3+s2*20),applicability:TYPES.filter((_,j)=>sr(i*7+j*3)>0.3)};
});

const meesTimeline=[
  {year:2025,minEPC:'E',affectedCount:buildingData.filter(b=>b.epcIdx>=4).length,desc:'Minimum EPC E for all commercial leases'},
  {year:2027,minEPC:'C',affectedCount:buildingData.filter(b=>b.epcIdx>=2).length,desc:'Proposed minimum EPC C for new leases'},
  {year:2030,minEPC:'B',affectedCount:buildingData.filter(b=>b.epcIdx>=1).length,desc:'Proposed minimum EPC B for all leases'},
];

const sty={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},
  header:{marginBottom:20},
  title:{fontSize:22,fontWeight:700,color:T.navy,margin:0},
  subtitle:{fontSize:13,color:T.textSec,fontFamily:T.mono,marginTop:4},
  tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`},
  tab:(a)=>({padding:'10px 20px',cursor:'pointer',fontSize:13,fontWeight:a?700:500,color:a?T.navy:T.textSec,borderBottom:a?`3px solid ${T.gold}`:'3px solid transparent',background:a?T.surfaceH:'transparent',transition:'all 0.2s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16},
  cardTitle:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12},
  kpiRow:{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16},
  kpi:{flex:'1 1 180px',background:T.surfaceH,border:`1px solid ${T.borderL}`,borderRadius:8,padding:16,textAlign:'center'},
  kpiVal:{fontSize:24,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textMut,marginTop:4},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`},
  badge:(c)=>({display:'inline-block',padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:600,background:c+'22',color:c}),
  filterRow:{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'},
  select:{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},
  slider:{width:'100%',accentColor:T.gold},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  scrollBox:{maxHeight:440,overflowY:'auto'},
  pill:(a)=>({padding:'4px 14px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:a?700:500,background:a?T.navy:T.surfaceH,color:a?'#fff':T.text,border:`1px solid ${a?T.navy:T.border}`}),
  exportBtn:{padding:'8px 18px',borderRadius:6,background:T.navy,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600},
};

export default function BuildingEnergyPerformancePage(){
  const[tab,setTab]=useState(0);
  const[typeFilter,setTypeFilter]=useState('All');
  const[epcFilter,setEpcFilter]=useState('All');
  const[cityFilter,setCityFilter]=useState('All');
  const[sortCol,setSortCol]=useState('intensity');
  const[sortDir,setSortDir]=useState('desc');
  const[selectedBuilding,setSelectedBuilding]=useState(null);
  const[pathwayScenario,setPathwayScenario]=useState('1.5');
  const[retrofitBudget,setRetrofitBudget]=useState(50);
  const[selectedRetrofit,setSelectedRetrofit]=useState([]);
  const[meesYear,setMeesYear]=useState(2025);
  const[searchTerm,setSearchTerm]=useState('');

  const filtered=useMemo(()=>{
    let d=[...buildingData];
    if(typeFilter!=='All') d=d.filter(b=>b.type===typeFilter);
    if(epcFilter!=='All') d=d.filter(b=>b.epc===epcFilter);
    if(cityFilter!=='All') d=d.filter(b=>b.city===cityFilter);
    if(searchTerm) d=d.filter(b=>b.name.toLowerCase().includes(searchTerm.toLowerCase()));
    d.sort((a,b)=>sortDir==='asc'?a[sortCol]-b[sortCol]:b[sortCol]-a[sortCol]);
    return d;
  },[typeFilter,epcFilter,cityFilter,sortCol,sortDir,searchTerm]);

  const epcDist=useMemo(()=>EPC_RATINGS.map(r=>({rating:r,count:filtered.filter(b=>b.epc===r).length})),[filtered]);
  const typeDist=useMemo(()=>TYPES.map(t=>({type:t,count:filtered.filter(b=>b.type===t).length,avgIntensity:Math.floor(filtered.filter(b=>b.type===t).reduce((s,b)=>s+b.intensity,0)/(filtered.filter(b=>b.type===t).length||1))})),[filtered]);
  const avgIntensity=useMemo(()=>Math.floor(filtered.reduce((s,b)=>s+b.intensity,0)/(filtered.length||1)),[filtered]);
  const totalCo2=useMemo(()=>filtered.reduce((s,b)=>s+b.co2,0),[filtered]);
  const crremAligned=useMemo(()=>filtered.filter(b=>b.strandingYear>=2040).length,[filtered]);
  const totalValue=useMemo(()=>filtered.reduce((s,b)=>s+b.value,0),[filtered]);
  const meesNonCompliant=useMemo(()=>filtered.filter(b=>!b.meesCompliant).length,[filtered]);

  const selBldg=useMemo(()=>selectedBuilding?buildingData.find(b=>b.id===selectedBuilding):buildingData[0],[selectedBuilding]);
  const bldgCrremPath=useMemo(()=>{
    if(!selBldg) return [];
    const paths=pathwayScenario==='1.5'?crremPathways15:crremPathways20;
    const k=selBldg.type.toLowerCase().replace('-','');const key=k==='mixeduse'?'mixedUse':k;
    return paths.map(p=>{
      const decay=selBldg.intensity*Math.exp(-0.03*(p.year-2023));
      return {year:p.year,pathway:Math.max(0,p[key]||0),current:Math.floor(decay),withRetrofit:Math.floor(decay*0.65)};
    });
  },[selBldg,pathwayScenario]);

  const retrofitROI=useMemo(()=>{
    if(!selBldg||selectedRetrofit.length===0) return [];
    let cumCost=0;let cumSaving=0;
    return Array.from({length:20},(_,i)=>{
      const yr=2024+i;
      const annualSaving=selectedRetrofit.reduce((s,idx)=>s+retrofitOptions[idx].energySaving*selBldg.area*0.15/1000,0);
      if(i===0) cumCost=selectedRetrofit.reduce((s,idx)=>s+retrofitOptions[idx].costPerSqm*selBldg.area,0);
      cumSaving+=annualSaving;
      return {year:yr,cumulativeCost:Math.floor(cumCost),cumulativeSaving:Math.floor(cumSaving),netBenefit:Math.floor(cumSaving-cumCost)};
    });
  },[selBldg,selectedRetrofit]);

  const meesImpact=useMemo(()=>{
    const yr=meesTimeline.find(m=>m.year===meesYear);
    if(!yr) return {affected:[],cost:0};
    const minIdx=EPC_RATINGS.indexOf(yr.minEPC);
    const affected=filtered.filter(b=>b.epcIdx>minIdx);
    const cost=affected.reduce((s,b)=>s+b.retrofitCost,0);
    return {affected,cost,minEPC:yr.minEPC,desc:yr.desc};
  },[meesYear,filtered]);

  const strandingTimeline=useMemo(()=>{
    const years=[2025,2026,2027,2028,2029,2030,2032,2035,2040,2045,2050];
    return years.map(y=>({year:y,stranded:filtered.filter(b=>b.strandingYear<=y).length,percentage:Math.floor(filtered.filter(b=>b.strandingYear<=y).length/filtered.length*100)}));
  },[filtered]);

  const handleSort=(col)=>{if(sortCol===col){setSortDir(d=>d==='asc'?'desc':'asc');}else{setSortCol(col);setSortDir('desc');}};

  const toggleRetrofit=(idx)=>{setSelectedRetrofit(prev=>prev.includes(idx)?prev.filter(i=>i!==idx):[...prev,idx]);};

  const intensityBenchmark=useMemo(()=>TYPES.map(t=>{
    const blds=filtered.filter(b=>b.type===t);
    const avg=blds.length?Math.floor(blds.reduce((s,b)=>s+b.intensity,0)/blds.length):0;
    const best=blds.length?Math.min(...blds.map(b=>b.intensity)):0;
    const worst=blds.length?Math.max(...blds.map(b=>b.intensity)):0;
    const crrem=Math.floor({'Office':63,'Retail':77,'Residential':42,'Industrial':98,'Logistics':52,'Mixed-Use':70}[t]||60);
    return {type:t,avg,best,worst,crrem,count:blds.length};
  }),[filtered]);

  const energyByYear=useMemo(()=>{
    const decades=[1950,1960,1970,1980,1990,2000,2010,2020];
    return decades.map(d=>({decade:`${d}s`,count:filtered.filter(b=>b.yearBuilt>=d&&b.yearBuilt<d+10).length,avgIntensity:Math.floor(filtered.filter(b=>b.yearBuilt>=d&&b.yearBuilt<d+10).reduce((s,b)=>s+b.intensity,0)/(filtered.filter(b=>b.yearBuilt>=d&&b.yearBuilt<d+10).length||1))}));
  },[filtered]);

  return(
    <div style={sty.page}>
      <div style={sty.header}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h1 style={sty.title}>Building Energy Performance</h1>
            <div style={sty.subtitle}>EP-AS1 / CRREM / EPC / MEES — {filtered.length} buildings</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={sty.exportBtn} onClick={()=>{}}>Export CSV</button>
          </div>
        </div>
      </div>

      <div style={sty.tabs}>
        {TABS.map((t,i)=><div key={i} style={sty.tab(tab===i)} onClick={()=>setTab(i)}>{t}</div>)}
      </div>

      {tab===0&&(
        <div>
          <div style={sty.kpiRow}>
            {[{v:filtered.length,l:'Buildings'},{v:`${avgIntensity} kWh/m²`,l:'Avg Intensity'},{v:`${totalCo2.toLocaleString()} tCO₂`,l:'Total Emissions'},{v:`${Math.floor(crremAligned/filtered.length*100)}%`,l:'CRREM 1.5°C Aligned'},{v:`£${(totalValue/1e9).toFixed(1)}B`,l:'Portfolio Value'},{v:meesNonCompliant,l:'MEES Non-Compliant'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.filterRow}>
            <select style={sty.select} value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>{TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <select style={sty.select} value={epcFilter} onChange={e=>setEpcFilter(e.target.value)}>
              <option value="All">All EPC</option>{EPC_RATINGS.map(r=><option key={r}>{r}</option>)}
            </select>
            <select style={sty.select} value={cityFilter} onChange={e=>setCityFilter(e.target.value)}>
              <option value="All">All Cities</option>{CITIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <input style={{...sty.select,width:200}} placeholder="Search buildings..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>EPC Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={epcDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="rating" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="count" radius={[4,4,0,0]}>{epcDist.map((e,i)=><Cell key={i} fill={EPC_COLORS[e.rating]}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Energy Intensity by Building Type</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={intensityBenchmark}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="avg" name="Average" fill={T.navy} radius={[4,4,0,0]}/><Bar dataKey="crrem" name="CRREM 2050 Target" fill={T.green} radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Building Type Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={typeDist} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({type,count})=>`${type}: ${count}`}>
                  {typeDist.map((_,i)=><Cell key={i} fill={[T.navy,T.gold,T.sage,T.navyL,T.amber,T.teal][i]}/>)}
                </Pie><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Energy Intensity by Construction Decade</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={energyByYear}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="decade" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="avgIntensity" name="Avg kWh/m²" fill={T.navyL} radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Building Portfolio ({filtered.length})</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr>
                  {['Name','Type','City','EPC','Area (m²)','Year','Intensity','CO₂ (t)','CRREM Year','Value','MEES'].map((h,i)=>{
                    const cols=['name','type','city','epc','area','yearBuilt','intensity','co2','strandingYear','value','meesCompliant'];
                    return <th key={i} style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSort(cols[i])}>{h}{sortCol===cols[i]?(sortDir==='asc'?' ▲':' ▼'):''}</th>;
                  })}
                </tr></thead>
                <tbody>{filtered.slice(0,80).map(b=>(
                  <tr key={b.id} style={{cursor:'pointer',background:selectedBuilding===b.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedBuilding(b.id)}>
                    <td style={sty.td}>{b.name}</td><td style={sty.td}>{b.type}</td><td style={sty.td}>{b.city}</td>
                    <td style={sty.td}><span style={sty.badge(EPC_COLORS[b.epc])}>{b.epc}</span></td>
                    <td style={sty.td}>{b.area.toLocaleString()}</td><td style={sty.td}>{b.yearBuilt}</td>
                    <td style={sty.td}>{b.intensity}</td><td style={sty.td}>{b.co2.toLocaleString()}</td>
                    <td style={sty.td}><span style={sty.badge(b.strandingYear<=2030?T.red:b.strandingYear<=2040?T.amber:T.green)}>{b.strandingYear}</span></td>
                    <td style={sty.td}>£{(b.value/1e6).toFixed(1)}M</td>
                    <td style={sty.td}><span style={sty.badge(b.meesCompliant?T.green:T.red)}>{b.meesCompliant?'Yes':'No'}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab===1&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Select Building:</span>
            <select style={{...sty.select,minWidth:250}} value={selectedBuilding||''} onChange={e=>setSelectedBuilding(+e.target.value)}>
              {buildingData.map(b=><option key={b.id} value={b.id}>{b.name} ({b.epc})</option>)}
            </select>
            <span style={{fontSize:13,fontWeight:600,marginLeft:12}}>Pathway:</span>
            {['1.5','2.0'].map(p=><span key={p} style={sty.pill(pathwayScenario===p)} onClick={()=>setPathwayScenario(p)}>{p}°C</span>)}
          </div>

          {selBldg&&(
            <>
              <div style={sty.kpiRow}>
                {[{v:selBldg.name,l:'Building'},{v:`${selBldg.intensity} kWh/m²`,l:'Current Intensity'},{v:`${selBldg.crremTarget} kWh/m²`,l:'CRREM 2050 Target'},{v:selBldg.strandingYear,l:'Stranding Year'},{v:`${selBldg.area.toLocaleString()} m²`,l:'Floor Area'},{v:selBldg.epc,l:'EPC Rating'}].map((k,i)=>(
                  <div key={i} style={sty.kpi}><div style={{...sty.kpiVal,fontSize:k.l==='Building'?16:24}}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
                ))}
              </div>

              <div style={sty.card}>
                <div style={sty.cardTitle}>CRREM Pathway — {pathwayScenario}°C Scenario</div>
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={bldgCrremPath}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'kWh/m²',angle:-90,position:'insideLeft',style:{fontSize:11}}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/>
                    <Area type="monotone" dataKey="pathway" name={`${pathwayScenario}°C Pathway`} stroke={T.green} fill={T.green+'33'} strokeWidth={2}/>
                    <Line type="monotone" dataKey="current" name="BAU Projection" stroke={T.red} strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="withRetrofit" name="With Retrofit" stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={sty.grid2}>
                <div style={sty.card}>
                  <div style={sty.cardTitle}>Stranding Risk Assessment</div>
                  <div style={{padding:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                      <span style={{fontSize:13}}>Gap to Target:</span>
                      <span style={{fontSize:15,fontWeight:700,color:selBldg.intensity>selBldg.crremTarget*1.5?T.red:T.amber,fontFamily:T.mono}}>{selBldg.intensity-selBldg.crremTarget} kWh/m²</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                      <span style={{fontSize:13}}>Reduction Required:</span>
                      <span style={{fontSize:15,fontWeight:700,fontFamily:T.mono}}>{Math.floor((1-selBldg.crremTarget/selBldg.intensity)*100)}%</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                      <span style={{fontSize:13}}>Years to Stranding:</span>
                      <span style={{fontSize:15,fontWeight:700,color:selBldg.strandingYear-2024<5?T.red:T.green,fontFamily:T.mono}}>{selBldg.strandingYear-2024}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                      <span style={{fontSize:13}}>Value at Risk:</span>
                      <span style={{fontSize:15,fontWeight:700,color:T.red,fontFamily:T.mono}}>£{(selBldg.value*0.15/1e6).toFixed(1)}M</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <span style={{fontSize:13}}>Est. Retrofit Cost:</span>
                      <span style={{fontSize:15,fontWeight:700,fontFamily:T.mono}}>£{(selBldg.retrofitCost/1e6).toFixed(2)}M</span>
                    </div>
                  </div>
                </div>
                <div style={sty.card}>
                  <div style={sty.cardTitle}>Portfolio Stranding Timeline</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={strandingTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Area type="monotone" dataKey="percentage" name="% Stranded" stroke={T.red} fill={T.red+'33'} strokeWidth={2}/></AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={sty.card}>
                <div style={sty.cardTitle}>Retrofit Scenario Comparison</div>
                <div style={sty.scrollBox}>
                  <table style={sty.table}>
                    <thead><tr><th style={sty.th}>Scenario</th><th style={sty.th}>Intensity After</th><th style={sty.th}>Reduction</th><th style={sty.th}>Cost</th><th style={sty.th}>Payback</th><th style={sty.th}>New Stranding Year</th></tr></thead>
                    <tbody>
                      {[{name:'No Action',factor:1,cost:0},{name:'Light Retrofit',factor:0.8,cost:selBldg.area*35},{name:'Deep Retrofit',factor:0.55,cost:selBldg.area*85},{name:'Net Zero Retrofit',factor:0.3,cost:selBldg.area*150}].map((sc,i)=>{
                        const newInt=Math.floor(selBldg.intensity*sc.factor);
                        const newStrand=newInt>selBldg.crremTarget*2?2026+Math.floor(sr(i*7)*4):newInt>selBldg.crremTarget?2032+Math.floor(sr(i*11)*6):2045+Math.floor(sr(i*13)*5);
                        return <tr key={i}><td style={sty.td}>{sc.name}</td><td style={sty.td}>{newInt} kWh/m²</td><td style={sty.td}>{Math.floor((1-sc.factor)*100)}%</td><td style={sty.td}>£{(sc.cost/1e6).toFixed(2)}M</td><td style={sty.td}>{sc.cost?`${(sc.cost/(selBldg.annualCost*(1-sc.factor))).toFixed(1)} yrs`:'-'}</td><td style={sty.td}><span style={sty.badge(newStrand<=2030?T.red:newStrand<=2040?T.amber:T.green)}>{newStrand}</span></td></tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab===2&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Building:</span>
            <select style={{...sty.select,minWidth:250}} value={selectedBuilding||''} onChange={e=>setSelectedBuilding(+e.target.value)}>
              {buildingData.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <span style={{fontSize:13,fontWeight:600,marginLeft:12}}>Budget (£/m²):</span>
            <input type="range" min={10} max={200} value={retrofitBudget} onChange={e=>setRetrofitBudget(+e.target.value)} style={{...sty.slider,width:200}}/>
            <span style={{fontFamily:T.mono,fontSize:13}}>£{retrofitBudget}/m²</span>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Retrofit Technology Options</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Select</th><th style={sty.th}>Technology</th><th style={sty.th}>Cost (£/m²)</th><th style={sty.th}>Energy Saving (%)</th><th style={sty.th}>Payback (yrs)</th><th style={sty.th}>CO₂ Reduction (%)</th><th style={sty.th}>Applicable To</th></tr></thead>
                <tbody>{retrofitOptions.map((r,i)=>(
                  <tr key={i} style={{background:selectedRetrofit.includes(i)?T.surfaceH:'transparent',opacity:r.costPerSqm>retrofitBudget?0.4:1}}>
                    <td style={sty.td}><input type="checkbox" checked={selectedRetrofit.includes(i)} onChange={()=>toggleRetrofit(i)} disabled={r.costPerSqm>retrofitBudget}/></td>
                    <td style={sty.td}>{r.tech}</td><td style={sty.td}>£{r.costPerSqm}</td>
                    <td style={sty.td}><span style={sty.badge(T.green)}>{r.energySaving}%</span></td>
                    <td style={sty.td}>{r.paybackYears}</td><td style={sty.td}>{r.co2Reduction}%</td>
                    <td style={sty.td}>{r.applicability.join(', ')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          {selectedRetrofit.length>0&&selBldg&&(
            <div style={sty.grid2}>
              <div style={sty.card}>
                <div style={sty.cardTitle}>Retrofit Cost-Benefit Summary</div>
                <div style={{padding:16}}>
                  {[{l:'Selected Measures',v:selectedRetrofit.length},{l:'Total Cost',v:`£${(selectedRetrofit.reduce((s,idx)=>s+retrofitOptions[idx].costPerSqm*selBldg.area,0)/1e6).toFixed(2)}M`},{l:'Combined Energy Saving',v:`${Math.min(selectedRetrofit.reduce((s,idx)=>s+retrofitOptions[idx].energySaving,0),80)}%`},{l:'New Intensity',v:`${Math.floor(selBldg.intensity*(1-Math.min(selectedRetrofit.reduce((s,idx)=>s+retrofitOptions[idx].energySaving,0),80)/100))} kWh/m²`},{l:'Annual Cost Saving',v:`£${Math.floor(selectedRetrofit.reduce((s,idx)=>s+retrofitOptions[idx].energySaving*selBldg.area*0.15/1000,0)).toLocaleString()}`},{l:'Simple Payback',v:`${(selectedRetrofit.reduce((s,idx)=>s+retrofitOptions[idx].costPerSqm*selBldg.area,0)/selectedRetrofit.reduce((s,idx)=>s+retrofitOptions[idx].energySaving*selBldg.area*0.15,0)).toFixed(1)} yrs`}].map((r,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                      <span style={{fontSize:13,color:T.textSec}}>{r.l}</span>
                      <span style={{fontSize:14,fontWeight:700,fontFamily:T.mono}}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={sty.card}>
                <div style={sty.cardTitle}>Cumulative Cash Flow</div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={retrofitROI}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}} tickFormatter={v=>`£${(v/1000).toFixed(0)}k`}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}} formatter={v=>`£${v.toLocaleString()}`}/><Legend wrapperStyle={{fontSize:10}}/>
                    <Area type="monotone" dataKey="cumulativeSaving" name="Cumulative Saving" stroke={T.green} fill={T.green+'33'}/>
                    <Line type="monotone" dataKey="cumulativeCost" name="Total Cost" stroke={T.red} strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="netBenefit" name="Net Benefit" stroke={T.gold} strokeWidth={2} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div style={sty.card}>
            <div style={sty.cardTitle}>Portfolio-Wide Retrofit Opportunities</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={intensityBenchmark.filter(t=>t.count>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/>
                <Bar dataKey="avg" name="Current Avg" fill={T.red} radius={[4,4,0,0]}/>
                <Bar dataKey="crrem" name="CRREM Target" fill={T.green} radius={[4,4,0,0]}/>
                <Bar dataKey="best" name="Best in Portfolio" fill={T.gold} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab===3&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Regulation Year:</span>
            {meesTimeline.map(m=><span key={m.year} style={sty.pill(meesYear===m.year)} onClick={()=>setMeesYear(m.year)}>{m.year}</span>)}
          </div>

          <div style={sty.kpiRow}>
            {[{v:meesImpact.affected.length,l:'Buildings Affected'},{v:`EPC ${meesImpact.minEPC}`,l:'Minimum Rating'},{v:`£${(meesImpact.cost/1e6).toFixed(1)}M`,l:'Total Retrofit Cost'},{v:`${Math.floor(meesImpact.affected.length/filtered.length*100)}%`,l:'Portfolio at Risk'},{v:meesImpact.desc||'',l:'Regulation'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={{...sty.kpiVal,fontSize:k.l==='Regulation'?13:24}}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>MEES Compliance by Year</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={meesTimeline.map(m=>({year:m.year,compliant:filtered.length-m.affectedCount,nonCompliant:m.affectedCount}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/>
                  <Bar dataKey="compliant" name="Compliant" fill={T.green} stackId="a" radius={[0,0,0,0]}/>
                  <Bar dataKey="nonCompliant" name="Non-Compliant" fill={T.red} stackId="a" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Stranded Asset Timeline</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={strandingTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}} unit="%"/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Area type="monotone" dataKey="percentage" name="% Stranded" stroke={T.red} fill={T.red+'22'} strokeWidth={2}/></AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>EU EPBD Recast Impact</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Regulation</th><th style={sty.th}>Jurisdiction</th><th style={sty.th}>Timeline</th><th style={sty.th}>Requirement</th><th style={sty.th}>Buildings Affected</th><th style={sty.th}>Est. Cost</th></tr></thead>
                <tbody>
                  {[
                    {reg:'UK MEES 2025',jur:'UK',time:'Apr 2025',req:'Min EPC E all commercial',aff:filtered.filter(b=>b.epcIdx>=4).length,cost:filtered.filter(b=>b.epcIdx>=4).reduce((s,b)=>s+b.retrofitCost*0.3,0)},
                    {reg:'UK MEES 2027',jur:'UK',time:'2027 (Proposed)',req:'Min EPC C new leases',aff:filtered.filter(b=>b.epcIdx>=2).length,cost:filtered.filter(b=>b.epcIdx>=2).reduce((s,b)=>s+b.retrofitCost*0.6,0)},
                    {reg:'UK MEES 2030',jur:'UK',time:'2030 (Proposed)',req:'Min EPC B all leases',aff:filtered.filter(b=>b.epcIdx>=1).length,cost:filtered.filter(b=>b.epcIdx>=1).reduce((s,b)=>s+b.retrofitCost,0)},
                    {reg:'EU EPBD Recast',jur:'EU',time:'2030/2033',req:'Zero-emission building standard',aff:Math.floor(filtered.length*0.7),cost:filtered.reduce((s,b)=>s+b.retrofitCost*0.8,0)},
                    {reg:'EU EED Art.6',jur:'EU',time:'2030',req:'3% annual renovation rate public',aff:Math.floor(filtered.length*0.15),cost:filtered.slice(0,22).reduce((s,b)=>s+b.retrofitCost,0)},
                    {reg:'NYC LL97',jur:'USA',time:'2024/2030',req:'Carbon caps per sqft',aff:Math.floor(filtered.length*0.1),cost:filtered.slice(0,15).reduce((s,b)=>s+b.retrofitCost*0.5,0)},
                  ].map((r,i)=>(
                    <tr key={i}><td style={sty.td}>{r.reg}</td><td style={sty.td}>{r.jur}</td><td style={sty.td}>{r.time}</td><td style={sty.td}>{r.req}</td><td style={sty.td}><span style={sty.badge(r.aff>filtered.length*0.3?T.red:T.amber)}>{r.aff}</span></td><td style={sty.td}>£{(r.cost/1e6).toFixed(1)}M</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Non-Compliant Buildings — {meesYear}</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Building</th><th style={sty.th}>Type</th><th style={sty.th}>EPC</th><th style={sty.th}>Intensity</th><th style={sty.th}>Value</th><th style={sty.th}>Retrofit Cost</th><th style={sty.th}>Priority</th></tr></thead>
                <tbody>{meesImpact.affected.slice(0,40).map(b=>(
                  <tr key={b.id}><td style={sty.td}>{b.name}</td><td style={sty.td}>{b.type}</td><td style={sty.td}><span style={sty.badge(EPC_COLORS[b.epc])}>{b.epc}</span></td><td style={sty.td}>{b.intensity}</td><td style={sty.td}>£{(b.value/1e6).toFixed(1)}M</td><td style={sty.td}>£{(b.retrofitCost/1e6).toFixed(2)}M</td><td style={sty.td}><span style={sty.badge(b.epcIdx>=5?T.red:b.epcIdx>=3?T.amber:T.green)}>{b.epcIdx>=5?'Critical':b.epcIdx>=3?'High':'Medium'}</span></td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Compliance Cost by Building Type</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={TYPES.map(t=>{const aff=meesImpact.affected.filter(b=>b.type===t);return{type:t,count:aff.length,cost:Math.floor(aff.reduce((s,b)=>s+b.retrofitCost,0)/1e6)};}).filter(d=>d.count>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/>
                <Bar dataKey="count" name="Buildings" fill={T.navy} radius={[4,4,0,0]}/>
                <Bar dataKey="cost" name="Cost (£M)" fill={T.red} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
