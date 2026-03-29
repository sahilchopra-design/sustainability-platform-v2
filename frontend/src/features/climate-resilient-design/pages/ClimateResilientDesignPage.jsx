import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Resilience Assessment','Adaptation Measures','Flood & Heat Risk','Insurance & Valuation'];
const HAZARDS=['Flooding','Heat Stress','Wind Storm','Drought','Wildfire','Sea Level Rise'];
const HAZARD_COLORS=['#2563eb','#dc2626','#7c3aed','#d97706','#ea580c','#0891b2'];
const TYPES=['Office','Retail','Residential','Industrial','Logistics','Mixed-Use'];
const CITIES=['London','Manchester','Birmingham','Bristol','Edinburgh','Leeds','Glasgow','Cardiff','Amsterdam','Frankfurt'];

const buildings=Array.from({length:100},(_,i)=>{
  const s=sr(i*7+3);const s2=sr(i*11+5);const s3=sr(i*13+7);const s4=sr(i*17+11);const s5=sr(i*19+13);const s6=sr(i*23+17);
  const type=TYPES[Math.floor(s*6)];const city=CITIES[Math.floor(s2*CITIES.length)];
  const area=Math.floor(1000+s3*48000);const value=Math.floor(area*(type==='Office'?4500:type==='Retail'?3200:type==='Residential'?5500:2000)*(0.8+s4*0.4));
  const yearBuilt=Math.floor(1960+s5*63);
  const hazards=HAZARDS.map((h,j)=>{const score=Math.floor(10+sr(i*31+j*7)*90);return{hazard:h,score,rating:score>70?'Critical':score>50?'High':score>30?'Medium':'Low'};});
  const composite=Math.floor(hazards.reduce((sum,h)=>sum+h.score,0)/hazards.length);
  const resilience=Math.floor(100-composite*(0.6+s6*0.4));
  const costOfInaction=Math.floor(value*(composite/100)*0.15);
  const floodZone=s3<0.15?'Zone 3b':s3<0.35?'Zone 3a':s3<0.55?'Zone 2':'Zone 1';
  const uhiEffect=+(1.5+sr(i*37)*4.5).toFixed(1);
  const coolingDemand=Math.floor(20+uhiEffect*15+s*30);
  const adaptationBudget=Math.floor(value*0.02*(0.5+s4));
  const insurancePremium=Math.floor(value*0.003*(1+composite/100));
  const adaptedInsurance=Math.floor(insurancePremium*(0.6+resilience/100*0.3));
  return{id:i+1,name:`${city} ${type} ${i+1}`,type,city,area,value,yearBuilt,hazards,composite,resilience,costOfInaction,floodZone,uhiEffect,coolingDemand,adaptationBudget,insurancePremium,adaptedInsurance,occupancy:Math.floor(70+s6*30),stories:Math.floor(2+s*25)};
});

const adaptationMeasures=[
  {id:1,name:'Flood Barriers & Demountable Defences',hazard:'Flooding',costPerSqm:45,riskReduction:35,paybackYrs:6,applicability:['Office','Retail','Industrial','Logistics']},
  {id:2,name:'Sustainable Urban Drainage (SuDS)',hazard:'Flooding',costPerSqm:28,riskReduction:25,paybackYrs:8,applicability:TYPES},
  {id:3,name:'Green Roof Installation',hazard:'Heat Stress',costPerSqm:85,riskReduction:20,paybackYrs:12,applicability:['Office','Retail','Residential','Mixed-Use']},
  {id:4,name:'Cool Roof Coating',hazard:'Heat Stress',costPerSqm:15,riskReduction:15,paybackYrs:4,applicability:TYPES},
  {id:5,name:'Enhanced HVAC Cooling',hazard:'Heat Stress',costPerSqm:55,riskReduction:30,paybackYrs:7,applicability:['Office','Retail','Residential','Mixed-Use']},
  {id:6,name:'Storm-Rated Cladding & Glazing',hazard:'Wind Storm',costPerSqm:120,riskReduction:40,paybackYrs:15,applicability:TYPES},
  {id:7,name:'Backup Water Storage',hazard:'Drought',costPerSqm:22,riskReduction:20,paybackYrs:5,applicability:TYPES},
  {id:8,name:'Rainwater Harvesting',hazard:'Drought',costPerSqm:18,riskReduction:15,paybackYrs:6,applicability:TYPES},
  {id:9,name:'Fire-Resistant Landscaping',hazard:'Wildfire',costPerSqm:12,riskReduction:25,paybackYrs:4,applicability:['Residential','Industrial','Logistics']},
  {id:10,name:'Raised Floor Levels',hazard:'Sea Level Rise',costPerSqm:65,riskReduction:45,paybackYrs:18,applicability:['Office','Retail','Residential']},
  {id:11,name:'Basement Waterproofing',hazard:'Flooding',costPerSqm:38,riskReduction:30,paybackYrs:9,applicability:['Office','Retail','Residential']},
  {id:12,name:'Passive Cooling Design',hazard:'Heat Stress',costPerSqm:42,riskReduction:25,paybackYrs:10,applicability:['Office','Residential','Mixed-Use']},
  {id:13,name:'Emergency Power Systems',hazard:'Wind Storm',costPerSqm:35,riskReduction:20,paybackYrs:8,applicability:TYPES},
  {id:14,name:'Coastal Erosion Protection',hazard:'Sea Level Rise',costPerSqm:95,riskReduction:50,paybackYrs:20,applicability:['Office','Retail','Residential','Mixed-Use']},
  {id:15,name:'Permeable Paving',hazard:'Flooding',costPerSqm:20,riskReduction:15,paybackYrs:7,applicability:TYPES},
];

const floodProjection=Array.from({length:8},(_,i)=>({decade:`${2020+i*10}s`,zone3b:Math.floor(buildings.filter(b=>b.floodZone==='Zone 3b').length*(1+i*0.15)),zone3a:Math.floor(buildings.filter(b=>b.floodZone==='Zone 3a').length*(1+i*0.1)),zone2:Math.floor(buildings.filter(b=>b.floodZone==='Zone 2').length*(1+i*0.05)),zone1:Math.max(0,Math.floor(buildings.filter(b=>b.floodZone==='Zone 1').length*(1-i*0.03)))}));

const heatProjection=Array.from({length:8},(_,i)=>({decade:`${2020+i*10}s`,avgUHI:+(2.5+i*0.4).toFixed(1),maxTemp:+(35+i*1.2).toFixed(1),coolingDays:Math.floor(30+i*8),coolingDemand:Math.floor(40+i*12)}));

const sty={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},
  header:{marginBottom:20},title:{fontSize:22,fontWeight:700,color:T.navy,margin:0},
  subtitle:{fontSize:13,color:T.textSec,fontFamily:T.mono,marginTop:4},
  tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`},
  tab:(a)=>({padding:'10px 20px',cursor:'pointer',fontSize:13,fontWeight:a?700:500,color:a?T.navy:T.textSec,borderBottom:a?`3px solid ${T.gold}`:'3px solid transparent',background:a?T.surfaceH:'transparent',transition:'all 0.2s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16},
  cardTitle:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12},
  kpiRow:{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16},
  kpi:{flex:'1 1 160px',background:T.surfaceH,border:`1px solid ${T.borderL}`,borderRadius:8,padding:16,textAlign:'center'},
  kpiVal:{fontSize:24,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textMut,marginTop:4},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`},
  badge:(c)=>({display:'inline-block',padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:600,background:c+'22',color:c}),
  filterRow:{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'},
  select:{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  scrollBox:{maxHeight:440,overflowY:'auto'},
  pill:(a)=>({padding:'4px 14px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:a?700:500,background:a?T.navy:T.surfaceH,color:a?'#fff':T.text,border:`1px solid ${a?T.navy:T.border}`}),
  exportBtn:{padding:'8px 18px',borderRadius:6,background:T.navy,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600},
};

export default function ClimateResilientDesignPage(){
  const[tab,setTab]=useState(0);
  const[typeFilter,setTypeFilter]=useState('All');
  const[cityFilter,setCityFilter]=useState('All');
  const[hazardFilter,setHazardFilter]=useState('All');
  const[sortCol,setSortCol]=useState('composite');
  const[sortDir,setSortDir]=useState('desc');
  const[selectedBuilding,setSelectedBuilding]=useState(null);
  const[selectedHazard,setSelectedHazard]=useState('Flooding');
  const[scenario,setScenario]=useState('RCP4.5');
  const[searchTerm,setSearchTerm]=useState('');

  const filtered=useMemo(()=>{
    let d=[...buildings];
    if(typeFilter!=='All')d=d.filter(b=>b.type===typeFilter);
    if(cityFilter!=='All')d=d.filter(b=>b.city===cityFilter);
    if(hazardFilter!=='All')d=d.filter(b=>b.hazards.find(h=>h.hazard===hazardFilter)?.score>50);
    if(searchTerm)d=d.filter(b=>b.name.toLowerCase().includes(searchTerm.toLowerCase()));
    d.sort((a,b)=>sortDir==='asc'?a[sortCol]-b[sortCol]:b[sortCol]-a[sortCol]);
    return d;
  },[typeFilter,cityFilter,hazardFilter,sortCol,sortDir,searchTerm]);

  const avgComposite=useMemo(()=>Math.floor(filtered.reduce((s,b)=>s+b.composite,0)/(filtered.length||1)),[filtered]);
  const totalCostInaction=useMemo(()=>filtered.reduce((s,b)=>s+b.costOfInaction,0),[filtered]);
  const criticalCount=useMemo(()=>filtered.filter(b=>b.composite>70).length,[filtered]);
  const avgResilience=useMemo(()=>Math.floor(filtered.reduce((s,b)=>s+b.resilience,0)/(filtered.length||1)),[filtered]);

  const hazardDist=useMemo(()=>HAZARDS.map((h,i)=>({hazard:h,critical:filtered.filter(b=>b.hazards[i].score>70).length,high:filtered.filter(b=>b.hazards[i].score>50&&b.hazards[i].score<=70).length,medium:filtered.filter(b=>b.hazards[i].score>30&&b.hazards[i].score<=50).length,low:filtered.filter(b=>b.hazards[i].score<=30).length})),[filtered]);

  const selBldg=useMemo(()=>selectedBuilding?buildings.find(b=>b.id===selectedBuilding):buildings[0],[selectedBuilding]);

  const bldgAdaptation=useMemo(()=>{
    if(!selBldg)return[];
    return adaptationMeasures.filter(m=>m.applicability.includes(selBldg.type)).map(m=>{
      const hazardScore=selBldg.hazards.find(h=>h.hazard===m.hazard)?.score||0;
      const benefit=Math.floor(selBldg.costOfInaction*m.riskReduction/100);
      const cost=Math.floor(m.costPerSqm*selBldg.area);
      const roi=cost>0?+((benefit*m.paybackYrs-cost)/cost*100).toFixed(1):0;
      const priority=hazardScore>60&&roi>50?'Critical':hazardScore>40?'High':roi>20?'Medium':'Low';
      return{...m,hazardScore,benefit,cost,roi,priority};
    }).sort((a,b)=>{const p={Critical:4,High:3,Medium:2,Low:1};return p[b.priority]-p[a.priority];});
  },[selBldg]);

  const floodZoneDist=useMemo(()=>[{zone:'Zone 3b',count:filtered.filter(b=>b.floodZone==='Zone 3b').length,risk:'Functional Floodplain'},{zone:'Zone 3a',count:filtered.filter(b=>b.floodZone==='Zone 3a').length,risk:'High Probability'},{zone:'Zone 2',count:filtered.filter(b=>b.floodZone==='Zone 2').length,risk:'Medium Probability'},{zone:'Zone 1',count:filtered.filter(b=>b.floodZone==='Zone 1').length,risk:'Low Probability'}],[filtered]);

  const insuranceData=useMemo(()=>filtered.map(b=>({name:b.name,composite:b.composite,premium:b.insurancePremium,adaptedPremium:b.adaptedInsurance,saving:b.insurancePremium-b.adaptedInsurance,resilience:b.resilience,value:b.value})),[filtered]);

  const valuationImpact=useMemo(()=>TYPES.map(t=>{
    const bs=filtered.filter(b=>b.type===t);if(!bs.length)return null;
    const avgVal=Math.floor(bs.reduce((s,b)=>s+b.value,0)/bs.length);
    const avgRisk=Math.floor(bs.reduce((s,b)=>s+b.composite,0)/bs.length);
    const adjustedVal=Math.floor(avgVal*(1-avgRisk/100*0.2));
    return{type:t,currentValue:Math.floor(avgVal/1e6),adjustedValue:Math.floor(adjustedVal/1e6),discount:Math.floor((1-adjustedVal/avgVal)*100),avgRisk};
  }).filter(Boolean),[filtered]);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  return(
    <div style={sty.page}>
      <div style={sty.header}>
        <h1 style={sty.title}>Climate Resilient Design</h1>
        <div style={sty.subtitle}>EP-AS4 / Physical Risk / Adaptation / Resilience — {filtered.length} buildings</div>
      </div>

      <div style={sty.tabs}>{TABS.map((t,i)=><div key={i} style={sty.tab(tab===i)} onClick={()=>setTab(i)}>{t}</div>)}</div>

      {tab===0&&(
        <div>
          <div style={sty.kpiRow}>
            {[{v:filtered.length,l:'Buildings Assessed'},{v:`${avgComposite}/100`,l:'Avg Risk Score'},{v:criticalCount,l:'Critical Risk'},{v:`${avgResilience}/100`,l:'Avg Resilience'},{v:`£${(totalCostInaction/1e6).toFixed(1)}M`,l:'Cost of Inaction'},{v:`${filtered.filter(b=>b.floodZone==='Zone 3b'||b.floodZone==='Zone 3a').length}`,l:'Flood Zone 3'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.filterRow}>
            <select style={sty.select} value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="All">All Types</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <select style={sty.select} value={cityFilter} onChange={e=>setCityFilter(e.target.value)}><option value="All">All Cities</option>{CITIES.map(c=><option key={c}>{c}</option>)}</select>
            <select style={sty.select} value={hazardFilter} onChange={e=>setHazardFilter(e.target.value)}><option value="All">All Hazards</option>{HAZARDS.map(h=><option key={h}>{h}</option>)}</select>
            <input style={{...sty.select,width:180}} placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Risk Distribution by Hazard</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={hazardDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="hazard" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="critical" name="Critical" fill={T.red} stackId="a"/><Bar dataKey="high" name="High" fill={T.amber} stackId="a"/><Bar dataKey="medium" name="Medium" fill={T.gold} stackId="a"/><Bar dataKey="low" name="Low" fill={T.green} stackId="a" radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Risk vs Resilience</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="composite" name="Risk Score" tick={{fontSize:11,fill:T.textSec}} domain={[0,100]}/><YAxis dataKey="resilience" name="Resilience" tick={{fontSize:11,fill:T.textSec}} domain={[0,100]}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}} cursor={{strokeDasharray:'3 3'}}/><Scatter data={filtered.map(b=>({composite:b.composite,resilience:b.resilience,name:b.name}))} fill={T.navyL}>{filtered.map((b,i)=><Cell key={i} fill={b.composite>70?T.red:b.composite>50?T.amber:T.green}/>)}</Scatter></ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Building Resilience Assessment ({filtered.length})</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr>{['Name','Type','City','Risk Score','Resilience','Flood','Heat','Wind','Cost Inaction','Flood Zone'].map((h,i)=>{
                  const cols=['name','type','city','composite','resilience','','','','costOfInaction','floodZone'];
                  return <th key={i} style={{...sty.th,cursor:cols[i]?'pointer':'default'}} onClick={()=>cols[i]&&handleSort(cols[i])}>{h}</th>;
                })}</tr></thead>
                <tbody>{filtered.slice(0,60).map(b=>(
                  <tr key={b.id} style={{cursor:'pointer',background:selectedBuilding===b.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedBuilding(b.id)}>
                    <td style={sty.td}>{b.name}</td><td style={sty.td}>{b.type}</td><td style={sty.td}>{b.city}</td>
                    <td style={sty.td}><span style={sty.badge(b.composite>70?T.red:b.composite>50?T.amber:T.green)}>{b.composite}</span></td>
                    <td style={sty.td}><span style={sty.badge(b.resilience>60?T.green:b.resilience>40?T.amber:T.red)}>{b.resilience}</span></td>
                    {[0,1,2].map(j=><td key={j} style={sty.td}><span style={sty.badge(b.hazards[j].score>70?T.red:b.hazards[j].score>50?T.amber:T.green)}>{b.hazards[j].score}</span></td>)}
                    <td style={sty.td}>£{(b.costOfInaction/1e6).toFixed(2)}M</td>
                    <td style={sty.td}><span style={sty.badge(b.floodZone.includes('3')?T.red:b.floodZone==='Zone 2'?T.amber:T.green)}>{b.floodZone}</span></td>
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
            <span style={{fontSize:13,fontWeight:600}}>Building:</span>
            <select style={{...sty.select,minWidth:250}} value={selectedBuilding||''} onChange={e=>setSelectedBuilding(+e.target.value)}>
              {buildings.map(b=><option key={b.id} value={b.id}>{b.name} (Risk: {b.composite})</option>)}
            </select>
            <span style={{fontSize:13,fontWeight:600,marginLeft:12}}>Hazard:</span>
            {HAZARDS.slice(0,4).map(h=><span key={h} style={sty.pill(selectedHazard===h)} onClick={()=>setSelectedHazard(h)}>{h}</span>)}
          </div>

          {selBldg&&(
            <>
              <div style={sty.kpiRow}>
                {[{v:selBldg.name,l:'Building'},{v:`${selBldg.composite}/100`,l:'Risk Score'},{v:`${selBldg.resilience}/100`,l:'Resilience'},{v:`£${(selBldg.costOfInaction/1e6).toFixed(2)}M`,l:'Cost of Inaction'},{v:`£${(selBldg.adaptationBudget/1e6).toFixed(2)}M`,l:'Adaptation Budget'}].map((k,i)=>(
                  <div key={i} style={sty.kpi}><div style={{...sty.kpiVal,fontSize:i===0?14:24}}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
                ))}
              </div>

              <div style={sty.card}>
                <div style={sty.cardTitle}>Recommended Adaptation Measures</div>
                <div style={sty.scrollBox}>
                  <table style={sty.table}>
                    <thead><tr><th style={sty.th}>Measure</th><th style={sty.th}>Hazard</th><th style={sty.th}>Risk Reduction</th><th style={sty.th}>Cost</th><th style={sty.th}>Annual Benefit</th><th style={sty.th}>ROI</th><th style={sty.th}>Payback</th><th style={sty.th}>Priority</th></tr></thead>
                    <tbody>{bldgAdaptation.map((m,i)=>(
                      <tr key={i}><td style={sty.td}>{m.name}</td><td style={sty.td}>{m.hazard}</td>
                        <td style={sty.td}>{m.riskReduction}%</td><td style={sty.td}>£{(m.cost/1e6).toFixed(2)}M</td>
                        <td style={sty.td}>£{(m.benefit/1e3).toFixed(0)}k</td><td style={sty.td}><span style={sty.badge(m.roi>100?T.green:m.roi>0?T.amber:T.red)}>{m.roi}%</span></td>
                        <td style={sty.td}>{m.paybackYrs} yrs</td>
                        <td style={sty.td}><span style={sty.badge(m.priority==='Critical'?T.red:m.priority==='High'?T.amber:T.green)}>{m.priority}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>

              <div style={sty.grid2}>
                <div style={sty.card}>
                  <div style={sty.cardTitle}>Hazard Profile — {selBldg.name}</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={selBldg.hazards}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="hazard" tick={{fontSize:10,fill:T.textSec}}/><YAxis domain={[0,100]} tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="score" name="Risk Score" radius={[4,4,0,0]}>{selBldg.hazards.map((h,i)=><Cell key={i} fill={HAZARD_COLORS[i]}/>)}</Bar></BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={sty.card}>
                  <div style={sty.cardTitle}>Adaptation Cost-Benefit</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={bldgAdaptation.slice(0,8)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-30} textAnchor="end" height={80}/><YAxis tick={{fontSize:11,fill:T.textSec}} tickFormatter={v=>`£${(v/1e3).toFixed(0)}k`}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="cost" name="Cost" fill={T.red} radius={[4,4,0,0]}/><Bar dataKey="benefit" name="Annual Benefit" fill={T.green} radius={[4,4,0,0]}/></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab===2&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Scenario:</span>
            {['RCP2.6','RCP4.5','RCP8.5'].map(s=><span key={s} style={sty.pill(scenario===s)} onClick={()=>setScenario(s)}>{s}</span>)}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Flood Zone Distribution</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={floodZoneDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="zone" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="count" name="Buildings" radius={[4,4,0,0]}>{floodZoneDist.map((d,i)=><Cell key={i} fill={i<2?T.red:i===2?T.amber:T.green}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Flood Zone Projection ({scenario})</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={floodProjection.map(d=>({...d,zone3b:Math.floor(d.zone3b*(scenario==='RCP8.5'?1.5:scenario==='RCP4.5'?1:0.7)),zone3a:Math.floor(d.zone3a*(scenario==='RCP8.5'?1.3:scenario==='RCP4.5'?1:0.8))}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="decade" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Area type="monotone" dataKey="zone3b" name="Zone 3b" stroke="#dc2626" fill="#dc262622" stackId="1"/><Area type="monotone" dataKey="zone3a" name="Zone 3a" stroke="#f97316" fill="#f9731622" stackId="1"/><Area type="monotone" dataKey="zone2" name="Zone 2" stroke="#eab308" fill="#eab30822" stackId="1"/></AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Urban Heat Island Effect</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={CITIES.map(c=>{const bs=filtered.filter(b=>b.city===c);return{city:c,avgUHI:bs.length?+(bs.reduce((s,b)=>s+b.uhiEffect,0)/bs.length).toFixed(1):0,count:bs.length};}).filter(d=>d.count>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="city" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}} unit="°C"/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="avgUHI" name="UHI Effect (°C)" radius={[4,4,0,0]}>{CITIES.map((_,i)=><Cell key={i} fill={sr(i*7)>0.5?T.red:T.amber}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Cooling Demand Projection</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={heatProjection.map(d=>({...d,coolingDemand:Math.floor(d.coolingDemand*(scenario==='RCP8.5'?1.6:scenario==='RCP4.5'?1.2:0.9))}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="decade" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="coolingDemand" name="Cooling kWh/m²" stroke={T.red} strokeWidth={2}/><Line type="monotone" dataKey="coolingDays" name="Cooling Days" stroke={T.amber} strokeWidth={2}/></LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>High-Risk Buildings — Flood & Heat</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Building</th><th style={sty.th}>Flood Zone</th><th style={sty.th}>Flood Score</th><th style={sty.th}>Heat Score</th><th style={sty.th}>UHI (°C)</th><th style={sty.th}>Cooling kWh/m²</th><th style={sty.th}>Cost Inaction</th></tr></thead>
                <tbody>{filtered.filter(b=>b.hazards[0].score>50||b.hazards[1].score>50).slice(0,30).map(b=>(
                  <tr key={b.id}><td style={sty.td}>{b.name}</td><td style={sty.td}><span style={sty.badge(b.floodZone.includes('3')?T.red:T.amber)}>{b.floodZone}</span></td>
                    <td style={sty.td}><span style={sty.badge(b.hazards[0].score>70?T.red:T.amber)}>{b.hazards[0].score}</span></td>
                    <td style={sty.td}><span style={sty.badge(b.hazards[1].score>70?T.red:T.amber)}>{b.hazards[1].score}</span></td>
                    <td style={sty.td}>{b.uhiEffect}°C</td><td style={sty.td}>{b.coolingDemand}</td>
                    <td style={sty.td}>£{(b.costOfInaction/1e6).toFixed(2)}M</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab===3&&(
        <div>
          <div style={sty.kpiRow}>
            {[{v:`£${Math.floor(filtered.reduce((s,b)=>s+b.insurancePremium,0)/1e6)}M`,l:'Total Insurance Premium'},{v:`£${Math.floor(filtered.reduce((s,b)=>s+b.adaptedInsurance,0)/1e6)}M`,l:'Adapted Premium'},{v:`£${Math.floor(filtered.reduce((s,b)=>s+b.insurancePremium-b.adaptedInsurance,0)/1e6)}M`,l:'Potential Saving'},{v:`${Math.floor((1-filtered.reduce((s,b)=>s+b.adaptedInsurance,0)/filtered.reduce((s,b)=>s+b.insurancePremium,0))*100)}%`,l:'Premium Reduction'},{v:`£${Math.floor(filtered.reduce((s,b)=>s+b.value,0)/1e9)}B`,l:'Portfolio Value'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Insurance Premium vs Risk Score</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="composite" name="Risk Score" tick={{fontSize:11,fill:T.textSec}}/><YAxis dataKey="premium" name="Premium (£)" tick={{fontSize:11,fill:T.textSec}} tickFormatter={v=>`£${(v/1000).toFixed(0)}k`}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}} formatter={v=>`£${v.toLocaleString()}`}/><Scatter data={insuranceData} fill={T.navyL}>{insuranceData.map((d,i)=><Cell key={i} fill={d.composite>70?T.red:d.composite>50?T.amber:T.green}/>)}</Scatter></ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Climate-Adjusted Valuation Impact</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={valuationImpact}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}} unit="M"/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="currentValue" name="Current (£M)" fill={T.navy} radius={[4,4,0,0]}/><Bar dataKey="adjustedValue" name="Climate-Adjusted (£M)" fill={T.amber} radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Stranding Risk by Resilience Score</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={[10,20,30,40,50,60,70,80,90].map(r=>({resilience:r,count:filtered.filter(b=>b.resilience>=r-10&&b.resilience<r).length,avgDiscount:Math.floor((100-r)*0.2)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="resilience" tick={{fontSize:11,fill:T.textSec}} label={{value:'Resilience Score',position:'insideBottom',offset:-5}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Area type="monotone" dataKey="count" name="Buildings" stroke={T.navy} fill={T.navy+'22'}/><Area type="monotone" dataKey="avgDiscount" name="Avg Discount %" stroke={T.red} fill={T.red+'22'}/></AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Insurance & Valuation Details</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Building</th><th style={sty.th}>Value</th><th style={sty.th}>Risk</th><th style={sty.th}>Resilience</th><th style={sty.th}>Premium</th><th style={sty.th}>Adapted Premium</th><th style={sty.th}>Saving</th><th style={sty.th}>Val. Discount</th></tr></thead>
                <tbody>{insuranceData.sort((a,b)=>b.premium-a.premium).slice(0,40).map((d,i)=>(
                  <tr key={i}><td style={sty.td}>{d.name}</td><td style={sty.td}>£{(d.value/1e6).toFixed(1)}M</td>
                    <td style={sty.td}><span style={sty.badge(d.composite>70?T.red:d.composite>50?T.amber:T.green)}>{d.composite}</span></td>
                    <td style={sty.td}>{d.resilience}/100</td>
                    <td style={sty.td}>£{(d.premium/1e3).toFixed(0)}k</td><td style={sty.td}>£{(d.adaptedPremium/1e3).toFixed(0)}k</td>
                    <td style={sty.td}><span style={sty.badge(T.green)}>£{(d.saving/1e3).toFixed(0)}k</span></td>
                    <td style={sty.td}>{Math.floor(d.composite*0.2)}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
