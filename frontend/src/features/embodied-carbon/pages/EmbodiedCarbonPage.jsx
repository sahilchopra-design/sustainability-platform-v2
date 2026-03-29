import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area} from 'recharts';
import { EMISSION_FACTORS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Embodied Carbon Calculator','Material Comparison','Project Portfolio','Circular Economy'];
const BLDG_TYPES=['Office','Residential','Retail','Education','Healthcare','Industrial','Mixed-Use','Warehouse'];
const STAGES=['A1-A3 Product','A4-A5 Construction','B1-B5 Use','C1-C4 End-of-Life','D Reuse/Recycle'];
const STAGE_COLORS=['#1b3a5c','#2c5a8c','#c5a96a','#dc2626','#16a34a'];
const RIBA_2030={Office:300,Residential:250,Retail:280,Education:270,Healthcare:350,Industrial:200,'Mixed-Use':290,Warehouse:180};

const materials=Array.from({length:30},(_,i)=>{
  const names=['Concrete (OPC)','Concrete (30% GGBS)','Concrete (50% GGBS)','Steel (Virgin)','Steel (Recycled)','Timber (Softwood)','CLT (Cross-Laminated)','Glulam','Aluminium (Virgin)','Aluminium (Recycled)','Brick (Standard)','Brick (Low Carbon)','Glass (Float)','Glass (Triple Low-E)','Insulation (EPS)','Insulation (Mineral Wool)','Insulation (Hemp)','Rebar (Virgin)','Rebar (Recycled)','Plasterboard','Copper','Zinc','Asphalt','Stone (Limestone)','Bamboo','Straw Bale','Rammed Earth','Recycled Plastic','Bio-concrete','Hempcrete'];
  const s=sr(i*13+7);const s2=sr(i*17+11);const s3=sr(i*19+13);const s4=sr(i*23+17);
  const carbonBase=[0.15,0.11,0.09,1.55,0.47,0.31,0.42,0.38,8.24,1.81,0.24,0.18,1.44,1.67,3.29,1.28,0.16,1.99,0.74,0.39,3.81,3.09,0.05,0.12,0.08,0.01,0.02,2.73,0.10,0.06];
  return{id:i+1,name:names[i],kgCO2ePerKg:carbonBase[i],costPerKg:+(0.5+s*8).toFixed(2),durability:Math.floor(40+s2*60),recyclability:Math.floor(10+s3*90),availability:Math.floor(30+s4*70),category:i<5?'Concrete':i<8?'Timber':i<10?'Metal':i<14?'Facade':i<17?'Insulation':i<20?'Reinforcement':'Other',isLowCarbon:carbonBase[i]<0.5,circularScore:Math.floor(20+s3*80)};
});

const projects=Array.from({length:80},(_,i)=>{
  const s=sr(i*7+3);const s2=sr(i*11+5);const s3=sr(i*13+7);const s4=sr(i*17+11);const s5=sr(i*19+13);
  const type=BLDG_TYPES[Math.floor(s*8)];
  const gfa=Math.floor(1000+s2*49000);const stories=Math.floor(2+s3*30);
  const ribaTarget=RIBA_2030[type]||280;
  const a13=Math.floor(ribaTarget*(0.3+s*0.8));const a45=Math.floor(a13*0.15*(0.5+s2));
  const b15=Math.floor(a13*0.08*(0.5+s3));const c14=Math.floor(a13*0.12*(0.5+s4));
  const dStage=Math.floor(-a13*0.1*(0.3+s5*0.5));
  const totalEmbodied=a13+a45+b15+c14+dStage;
  const operationalCarbon=Math.floor(gfa*0.05*(0.5+s2));const designLife=50+Math.floor(s3*10);
  const totalWholeLife=totalEmbodied+operationalCarbon*designLife;
  const cities=['London','Manchester','Dublin','Edinburgh','Bristol','Berlin','Paris','Amsterdam','Sydney','Toronto'];
  return{id:i+1,name:`${cities[Math.floor(s5*10)]} ${type} P${i+1}`,type,gfa,stories,year:2020+Math.floor(s4*6),city:cities[Math.floor(s5*10)],
    stages:{a13,a45,b15,c14,d:dStage},totalEmbodied,operationalCarbon,designLife,totalWholeLife,ribaTarget,
    embodiedPerSqm:Math.floor(totalEmbodied*1000/gfa),vsRiba:Math.floor((totalEmbodied*1000/gfa/ribaTarget-1)*100),
    primaryMaterial:['Concrete','Steel','Timber','CLT','Hybrid'][Math.floor(s*5)],
    wastePerc:Math.floor(5+s2*20),recycledContent:Math.floor(10+s3*50),reuseScore:Math.floor(20+s4*60),
    status:['Design','Under Construction','Completed','Operational'][Math.floor(s5*4)]};
});

const calcMaterials=[
  {name:'Concrete',unit:'m³',kgPerUnit:2400,co2ePerUnit:360,typicalQty:{Office:0.4,Residential:0.35,Retail:0.38}},
  {name:'Steel',unit:'kg',kgPerUnit:1,co2ePerUnit:1.55,typicalQty:{Office:80,Residential:50,Retail:60}},
  {name:'Timber',unit:'m³',kgPerUnit:500,co2ePerUnit:155,typicalQty:{Office:0.02,Residential:0.05,Retail:0.03}},
  {name:'Glazing',unit:'m²',kgPerUnit:25,co2ePerUnit:36,typicalQty:{Office:0.3,Residential:0.15,Retail:0.35}},
  {name:'Insulation',unit:'m²',kgPerUnit:3,co2ePerUnit:4.2,typicalQty:{Office:0.2,Residential:0.25,Retail:0.18}},
  {name:'Brick',unit:'m²',kgPerUnit:180,co2ePerUnit:43,typicalQty:{Office:0.1,Residential:0.2,Retail:0.12}},
];

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
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  scrollBox:{maxHeight:440,overflowY:'auto'},
  pill:(a)=>({padding:'4px 14px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:a?700:500,background:a?T.navy:T.surfaceH,color:a?'#fff':T.text,border:`1px solid ${a?T.navy:T.border}`}),
  slider:{width:'100%',accentColor:T.gold},
  exportBtn:{padding:'8px 18px',borderRadius:6,background:T.navy,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600},
};

export default function EmbodiedCarbonPage(){
  const[tab,setTab]=useState(0);
  const[calcType,setCalcType]=useState('Office');
  const[calcGFA,setCalcGFA]=useState(5000);
  const[calcStories,setCalcStories]=useState(10);
  const[calcTimber,setCalcTimber]=useState(20);
  const[matCategory,setMatCategory]=useState('All');
  const[matSort,setMatSort]=useState('kgCO2ePerKg');
  const[projTypeFilter,setProjTypeFilter]=useState('All');
  const[projStatusFilter,setProjStatusFilter]=useState('All');
  const[sortCol,setSortCol]=useState('totalEmbodied');
  const[sortDir,setSortDir]=useState('desc');
  const[selectedProject,setSelectedProject]=useState(null);
  const[circularView,setCircularView]=useState('overview');

  const calcResult=useMemo(()=>{
    const stagePerc={a13:0.65,a45:0.1,b15:0.08,c14:0.12,d:-0.05};
    const base=RIBA_2030[calcType]||280;
    const timberReduction=calcTimber*0.008;
    const adjustedBase=base*(1-timberReduction);
    const perSqm=Math.floor(adjustedBase*(0.7+sr(BLDG_TYPES.indexOf(calcType)*3)*0.6));
    const total=perSqm*calcGFA/1000;
    const stages=Object.entries(stagePerc).map(([stage,perc])=>({stage,value:Math.floor(total*Math.abs(perc)),perc:Math.floor(Math.abs(perc)*100),isNegative:perc<0}));
    const materialBreakdown=calcMaterials.map(m=>{
      const qty=Math.floor(calcGFA*(m.typicalQty[calcType]||0.2)*(m.name==='Timber'?calcTimber/100*3:1));
      return{...m,qty,totalCO2:Math.floor(qty*m.co2ePerUnit/1000)};
    });
    return{perSqm,total:Math.floor(total),ribaTarget:RIBA_2030[calcType],vsRiba:Math.floor((perSqm/RIBA_2030[calcType]-1)*100),stages,materialBreakdown};
  },[calcType,calcGFA,calcStories,calcTimber]);

  const filteredMats=useMemo(()=>{
    let d=[...materials];
    if(matCategory!=='All') d=d.filter(m=>m.category===matCategory);
    d.sort((a,b)=>b[matSort]-a[matSort]);
    return d;
  },[matCategory,matSort]);

  const matCategories=useMemo(()=>[...new Set(materials.map(m=>m.category))],[]);

  const filteredProjects=useMemo(()=>{
    let d=[...projects];
    if(projTypeFilter!=='All') d=d.filter(p=>p.type===projTypeFilter);
    if(projStatusFilter!=='All') d=d.filter(p=>p.status===projStatusFilter);
    d.sort((a,b)=>sortDir==='asc'?a[sortCol]-b[sortCol]:b[sortCol]-a[sortCol]);
    return d;
  },[projTypeFilter,projStatusFilter,sortCol,sortDir]);

  const stageBreakdown=useMemo(()=>{
    return STAGES.map((stage,i)=>{
      const keys=['a13','a45','b15','c14','d'];
      const total=filteredProjects.reduce((s,p)=>s+Math.abs(p.stages[keys[i]]),0);
      return{stage,total:Math.floor(total),avg:Math.floor(total/(filteredProjects.length||1))};
    });
  },[filteredProjects]);

  const embodiedVsOperational=useMemo(()=>{
    return BLDG_TYPES.map(t=>{
      const ps=filteredProjects.filter(p=>p.type===t);
      if(!ps.length) return null;
      return{type:t,embodied:Math.floor(ps.reduce((s,p)=>s+p.totalEmbodied,0)/ps.length),operational:Math.floor(ps.reduce((s,p)=>s+p.operationalCarbon*p.designLife,0)/ps.length)};
    }).filter(Boolean);
  },[filteredProjects]);

  const circularData=useMemo(()=>{
    return filteredProjects.map(p=>({
      name:p.name,wastePerc:p.wastePerc,recycledContent:p.recycledContent,reuseScore:p.reuseScore,
      circularScore:Math.floor((100-p.wastePerc)*0.3+p.recycledContent*0.35+p.reuseScore*0.35),
      demolitionWaste:Math.floor(p.gfa*0.15*(1-p.recycledContent/100)),
      materialPassport:p.reuseScore>50?'Yes':'Partial',
      endOfLife:p.reuseScore>60?'High Reuse':p.recycledContent>40?'Recyclable':'Landfill Risk'
    }));
  },[filteredProjects]);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  const selProj=useMemo(()=>selectedProject?projects.find(p=>p.id===selectedProject):null,[selectedProject]);

  return(
    <div style={sty.page}>
      <div style={sty.header}>
        <h1 style={sty.title}>Embodied Carbon</h1>
        <div style={sty.subtitle}>EP-AS3 / Whole-Life Carbon / Materials / RIBA 2030 — {projects.length} projects · {materials.length} materials</div>
      </div>

      <div style={sty.tabs}>{TABS.map((t,i)=><div key={i} style={sty.tab(tab===i)} onClick={()=>setTab(i)}>{t}</div>)}</div>

      {tab===0&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Building Type:</span>
            <select style={sty.select} value={calcType} onChange={e=>setCalcType(e.target.value)}>{BLDG_TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <span style={{fontSize:13,fontWeight:600,marginLeft:12}}>GFA (m²):</span>
            <input type="range" min={500} max={50000} step={500} value={calcGFA} onChange={e=>setCalcGFA(+e.target.value)} style={{...sty.slider,width:180}}/>
            <span style={{fontFamily:T.mono,fontSize:12}}>{calcGFA.toLocaleString()}</span>
            <span style={{fontSize:13,fontWeight:600,marginLeft:12}}>Timber %:</span>
            <input type="range" min={0} max={80} value={calcTimber} onChange={e=>setCalcTimber(+e.target.value)} style={{...sty.slider,width:120}}/>
            <span style={{fontFamily:T.mono,fontSize:12}}>{calcTimber}%</span>
          </div>

          <div style={sty.kpiRow}>
            {[{v:`${calcResult.perSqm} kgCO₂e/m²`,l:'Embodied Carbon Intensity'},{v:`${calcResult.total} tCO₂e`,l:'Total Embodied Carbon'},{v:`${calcResult.ribaTarget} kgCO₂e/m²`,l:'RIBA 2030 Target'},{v:`${calcResult.vsRiba>0?'+':''}${calcResult.vsRiba}%`,l:'vs RIBA 2030'},{v:`${calcGFA.toLocaleString()} m²`,l:'Gross Floor Area'},{v:`${calcTimber}%`,l:'Timber Content'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={{...sty.kpiVal,color:i===3?(calcResult.vsRiba>0?T.red:T.green):T.navy}}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Lifecycle Stage Breakdown</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={calcResult.stages}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="stage" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="value" name="tCO₂e" radius={[4,4,0,0]}>{calcResult.stages.map((s,i)=><Cell key={i} fill={s.isNegative?T.green:STAGE_COLORS[i]}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Material Carbon Contribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart><Pie data={calcResult.materialBreakdown.filter(m=>m.totalCO2>0)} dataKey="totalCO2" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,totalCO2})=>`${name}: ${totalCO2}t`}>
                  {calcResult.materialBreakdown.map((_,i)=><Cell key={i} fill={[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red][i%6]}/>)}
                </Pie><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/></PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Material Quantities & Carbon</div>
            <table style={sty.table}>
              <thead><tr><th style={sty.th}>Material</th><th style={sty.th}>Quantity</th><th style={sty.th}>Unit</th><th style={sty.th}>CO₂e Factor</th><th style={sty.th}>Total tCO₂e</th><th style={sty.th}>% of Total</th></tr></thead>
              <tbody>{calcResult.materialBreakdown.map((m,i)=>(
                <tr key={i}><td style={sty.td}>{m.name}</td><td style={sty.td}>{m.qty.toLocaleString()}</td><td style={sty.td}>{m.unit}</td>
                  <td style={sty.td}>{m.co2ePerUnit} kgCO₂e/{m.unit}</td><td style={sty.td}>{m.totalCO2}</td>
                  <td style={sty.td}>{calcResult.total?Math.floor(m.totalCO2/calcResult.total*100):0}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Benchmark vs RIBA 2030 Targets</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={BLDG_TYPES.map(t=>({type:t,riba:RIBA_2030[t],typical:Math.floor(RIBA_2030[t]*1.4),current:t===calcType?calcResult.perSqm:null}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="riba" name="RIBA 2030" fill={T.green} radius={[4,4,0,0]}/><Bar dataKey="typical" name="Typical" fill={T.textMut} radius={[4,4,0,0]}/><Bar dataKey="current" name="Your Calc" fill={T.gold} radius={[4,4,0,0]}/></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab===1&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Category:</span>
            <select style={sty.select} value={matCategory} onChange={e=>setMatCategory(e.target.value)}>
              <option value="All">All</option>{matCategories.map(c=><option key={c}>{c}</option>)}
            </select>
            <span style={{fontSize:13,fontWeight:600,marginLeft:12}}>Sort by:</span>
            {[['kgCO2ePerKg','Carbon'],['costPerKg','Cost'],['durability','Durability'],['recyclability','Recyclability']].map(([k,l])=><span key={k} style={sty.pill(matSort===k)} onClick={()=>setMatSort(k)}>{l}</span>)}
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Material Carbon Intensity Comparison</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filteredMats.slice(0,20)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/><YAxis type="category" dataKey="name" width={150} tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="kgCO2ePerKg" name="kgCO₂e/kg" radius={[0,4,4,0]}>{filteredMats.slice(0,20).map((m,i)=><Cell key={i} fill={m.isLowCarbon?T.green:m.kgCO2ePerKg>2?T.red:T.amber}/>)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Material Properties Radar</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[{prop:'Carbon',low:filteredMats.filter(m=>m.isLowCarbon).length?Math.floor(filteredMats.filter(m=>m.isLowCarbon).reduce((s,m)=>s+(100-m.kgCO2ePerKg*10),0)/filteredMats.filter(m=>m.isLowCarbon).length):0,high:filteredMats.filter(m=>!m.isLowCarbon).length?Math.floor(filteredMats.filter(m=>!m.isLowCarbon).reduce((s,m)=>s+(100-m.kgCO2ePerKg*10),0)/filteredMats.filter(m=>!m.isLowCarbon).length):0},{prop:'Cost',low:Math.floor(filteredMats.filter(m=>m.isLowCarbon).reduce((s,m)=>s+(100-m.costPerKg*10),0)/(filteredMats.filter(m=>m.isLowCarbon).length||1)),high:Math.floor(filteredMats.filter(m=>!m.isLowCarbon).reduce((s,m)=>s+(100-m.costPerKg*10),0)/(filteredMats.filter(m=>!m.isLowCarbon).length||1))},{prop:'Durability',low:Math.floor(filteredMats.filter(m=>m.isLowCarbon).reduce((s,m)=>s+m.durability,0)/(filteredMats.filter(m=>m.isLowCarbon).length||1)),high:Math.floor(filteredMats.filter(m=>!m.isLowCarbon).reduce((s,m)=>s+m.durability,0)/(filteredMats.filter(m=>!m.isLowCarbon).length||1))},{prop:'Recyclability',low:Math.floor(filteredMats.filter(m=>m.isLowCarbon).reduce((s,m)=>s+m.recyclability,0)/(filteredMats.filter(m=>m.isLowCarbon).length||1)),high:Math.floor(filteredMats.filter(m=>!m.isLowCarbon).reduce((s,m)=>s+m.recyclability,0)/(filteredMats.filter(m=>!m.isLowCarbon).length||1))},{prop:'Availability',low:Math.floor(filteredMats.filter(m=>m.isLowCarbon).reduce((s,m)=>s+m.availability,0)/(filteredMats.filter(m=>m.isLowCarbon).length||1)),high:Math.floor(filteredMats.filter(m=>!m.isLowCarbon).reduce((s,m)=>s+m.availability,0)/(filteredMats.filter(m=>!m.isLowCarbon).length||1))}]}>
                  <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="prop" tick={{fontSize:11,fill:T.textSec}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
                  <Radar name="Low Carbon" dataKey="low" stroke={T.green} fill={T.green} fillOpacity={0.2} strokeWidth={2}/>
                  <Radar name="Conventional" dataKey="high" stroke={T.red} fill={T.red} fillOpacity={0.1} strokeWidth={2}/>
                  <Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Materials by Category</div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart><Pie data={matCategories.map(c=>({name:c,count:materials.filter(m=>m.category===c).length,avgCarbon:+(materials.filter(m=>m.category===c).reduce((s,m)=>s+m.kgCO2ePerKg,0)/materials.filter(m=>m.category===c).length).toFixed(2)}))} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,count})=>`${name}: ${count}`}>
                  {matCategories.map((_,i)=><Cell key={i} fill={[T.navy,T.sage,T.gold,T.navyL,T.amber,T.red,T.teal][i%7]}/>)}
                </Pie><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/></PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Full Material Database ({filteredMats.length})</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Material</th><th style={sty.th}>Category</th><th style={sty.th}>kgCO₂e/kg</th><th style={sty.th}>Cost (£/kg)</th><th style={sty.th}>Durability</th><th style={sty.th}>Recyclability</th><th style={sty.th}>Availability</th><th style={sty.th}>Low Carbon</th></tr></thead>
                <tbody>{filteredMats.map(m=>(
                  <tr key={m.id}><td style={sty.td}>{m.name}</td><td style={sty.td}>{m.category}</td>
                    <td style={sty.td}><span style={sty.badge(m.kgCO2ePerKg<0.5?T.green:m.kgCO2ePerKg<2?T.amber:T.red)}>{m.kgCO2ePerKg}</span></td>
                    <td style={sty.td}>£{m.costPerKg}</td><td style={sty.td}>{m.durability}/100</td><td style={sty.td}>{m.recyclability}/100</td><td style={sty.td}>{m.availability}/100</td>
                    <td style={sty.td}><span style={sty.badge(m.isLowCarbon?T.green:T.textMut)}>{m.isLowCarbon?'Yes':'No'}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab===2&&(
        <div>
          <div style={sty.filterRow}>
            <select style={sty.select} value={projTypeFilter} onChange={e=>setProjTypeFilter(e.target.value)}><option value="All">All Types</option>{BLDG_TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <select style={sty.select} value={projStatusFilter} onChange={e=>setProjStatusFilter(e.target.value)}><option value="All">All Status</option>{['Design','Under Construction','Completed','Operational'].map(s=><option key={s}>{s}</option>)}</select>
          </div>

          <div style={sty.kpiRow}>
            {[{v:filteredProjects.length,l:'Projects'},{v:`${Math.floor(filteredProjects.reduce((s,p)=>s+p.embodiedPerSqm,0)/(filteredProjects.length||1))} kgCO₂e/m²`,l:'Avg Embodied Intensity'},{v:`${Math.floor(filteredProjects.reduce((s,p)=>s+p.totalEmbodied,0))} tCO₂e`,l:'Total Embodied'},{v:`${filteredProjects.filter(p=>p.vsRiba<=0).length}/${filteredProjects.length}`,l:'Meet RIBA 2030'},{v:`${Math.floor(filteredProjects.reduce((s,p)=>s+p.recycledContent,0)/(filteredProjects.length||1))}%`,l:'Avg Recycled Content'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Embodied vs Operational Carbon</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={embodiedVsOperational}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="embodied" name="Embodied" fill={T.navy} stackId="a"/><Bar dataKey="operational" name="Operational (Lifetime)" fill={T.gold} stackId="a" radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Lifecycle Stage Distribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stageBreakdown}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="stage" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="avg" name="Avg tCO₂e" radius={[4,4,0,0]}>{stageBreakdown.map((s,i)=><Cell key={i} fill={STAGE_COLORS[i]}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Project Portfolio ({filteredProjects.length})</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr>{['Name','Type','GFA','Year','Embodied/m²','Total tCO₂e','vs RIBA','Material','Recycled %','Status'].map((h,i)=>{
                  const cols=['name','type','gfa','year','embodiedPerSqm','totalEmbodied','vsRiba','primaryMaterial','recycledContent','status'];
                  return <th key={i} style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSort(cols[i])}>{h}</th>;
                })}</tr></thead>
                <tbody>{filteredProjects.slice(0,50).map(p=>(
                  <tr key={p.id} style={{cursor:'pointer',background:selectedProject===p.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedProject(p.id)}>
                    <td style={sty.td}>{p.name}</td><td style={sty.td}>{p.type}</td><td style={sty.td}>{p.gfa.toLocaleString()}</td><td style={sty.td}>{p.year}</td>
                    <td style={sty.td}>{p.embodiedPerSqm}</td><td style={sty.td}>{p.totalEmbodied.toLocaleString()}</td>
                    <td style={sty.td}><span style={sty.badge(p.vsRiba<=0?T.green:p.vsRiba<30?T.amber:T.red)}>{p.vsRiba>0?'+':''}{p.vsRiba}%</span></td>
                    <td style={sty.td}>{p.primaryMaterial}</td><td style={sty.td}>{p.recycledContent}%</td>
                    <td style={sty.td}><span style={sty.badge(p.status==='Completed'?T.green:p.status==='Operational'?T.sage:T.amber)}>{p.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab===3&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>View:</span>
            {['overview','passports','waste','endoflife'].map(v=><span key={v} style={sty.pill(circularView===v)} onClick={()=>setCircularView(v)}>{v==='endoflife'?'End-of-Life':v.charAt(0).toUpperCase()+v.slice(1)}</span>)}
          </div>

          <div style={sty.kpiRow}>
            {[{v:`${Math.floor(circularData.reduce((s,d)=>s+d.circularScore,0)/(circularData.length||1))}/100`,l:'Avg Circular Score'},{v:`${Math.floor(circularData.reduce((s,d)=>s+d.wastePerc,0)/(circularData.length||1))}%`,l:'Avg Waste Rate'},{v:`${Math.floor(filteredProjects.reduce((s,p)=>s+p.recycledContent,0)/(filteredProjects.length||1))}%`,l:'Avg Recycled Content'},{v:`${circularData.filter(d=>d.materialPassport==='Yes').length}`,l:'Material Passports'},{v:`${circularData.filter(d=>d.endOfLife==='High Reuse').length}`,l:'High Reuse Potential'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Circular Economy Scores</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={circularData.sort((a,b)=>b.circularScore-a.circularScore).slice(0,20)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-45} textAnchor="end" height={80}/><YAxis tick={{fontSize:11,fill:T.textSec}} domain={[0,100]}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="circularScore" name="Circular Score" radius={[4,4,0,0]}>{circularData.sort((a,b)=>b.circularScore-a.circularScore).slice(0,20).map((d,i)=><Cell key={i} fill={d.circularScore>60?T.green:d.circularScore>40?T.amber:T.red}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>End-of-Life Scenarios</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart><Pie data={[{name:'High Reuse',value:circularData.filter(d=>d.endOfLife==='High Reuse').length},{name:'Recyclable',value:circularData.filter(d=>d.endOfLife==='Recyclable').length},{name:'Landfill Risk',value:circularData.filter(d=>d.endOfLife==='Landfill Risk').length}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  <Cell fill={T.green}/><Cell fill={T.amber}/><Cell fill={T.red}/>
                </Pie><Tooltip/><Legend wrapperStyle={{fontSize:11}}/></PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Project Circular Economy Details</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Project</th><th style={sty.th}>Circular Score</th><th style={sty.th}>Waste %</th><th style={sty.th}>Recycled %</th><th style={sty.th}>Reuse Score</th><th style={sty.th}>Material Passport</th><th style={sty.th}>End-of-Life</th><th style={sty.th}>Demo. Waste (t)</th></tr></thead>
                <tbody>{circularData.sort((a,b)=>b.circularScore-a.circularScore).slice(0,40).map((d,i)=>(
                  <tr key={i}><td style={sty.td}>{d.name}</td>
                    <td style={sty.td}><span style={sty.badge(d.circularScore>60?T.green:d.circularScore>40?T.amber:T.red)}>{d.circularScore}</span></td>
                    <td style={sty.td}>{d.wastePerc}%</td><td style={sty.td}>{d.recycledContent}%</td><td style={sty.td}>{d.reuseScore}/100</td>
                    <td style={sty.td}><span style={sty.badge(d.materialPassport==='Yes'?T.green:T.amber)}>{d.materialPassport}</span></td>
                    <td style={sty.td}><span style={sty.badge(d.endOfLife==='High Reuse'?T.green:d.endOfLife==='Recyclable'?T.amber:T.red)}>{d.endOfLife}</span></td>
                    <td style={sty.td}>{d.demolitionWaste.toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Waste vs Recycled Content</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={circularData.sort((a,b)=>a.circularScore-b.circularScore)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="circularScore" label={{value:'Circular Score',position:'insideBottom',offset:-5,style:{fontSize:11}}} tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Area type="monotone" dataKey="wastePerc" name="Waste %" stroke={T.red} fill={T.red+'22'}/><Area type="monotone" dataKey="recycledContent" name="Recycled %" stroke={T.green} fill={T.green+'22'}/></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
