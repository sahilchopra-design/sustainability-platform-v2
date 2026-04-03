import React,{useState,useMemo,useCallback,useEffect} from 'react';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,Cell,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── inline primitives ── */
const TabBar=({tabs,active,onSet})=><div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0,overflowX:'auto'}}>{tabs.map((t,i)=><button key={i} onClick={()=>onSet(i)} style={{padding:'10px 18px',border:'none',borderBottom:i===active?`3px solid ${T.navy}`:'3px solid transparent',background:i===active?T.surface:'transparent',color:i===active?T.navy:T.textSec,fontWeight:i===active?700:500,fontSize:13,fontFamily:T.font,cursor:'pointer',borderRadius:'8px 8px 0 0',transition:'all 0.2s',whiteSpace:'nowrap'}}>{t}</button>)}</div>;
const Kpi=({label,value,sub,icon})=><div style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16,textAlign:'center'}}>{icon&&<div style={{fontSize:22}}>{icon}</div>}<div style={{fontSize:20,fontWeight:700,color:T.navy,margin:'4px 0',fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut,marginTop:2}}>{sub}</div>}</div>;
const Section=({title,sub,children})=><div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:16}}>{title&&<div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:sub?2:12}}>{title}</div>}{sub&&<div style={{fontSize:12,color:T.textSec,marginBottom:12}}>{sub}</div>}{children}</div>;
const Card=({children,style})=><div style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16,...style}}>{children}</div>;
const Badge=({text,color})=>{const c={green:{bg:'#dcfce7',fg:T.green},amber:{bg:'#fef3c7',fg:T.amber},red:{bg:'#fee2e2',fg:T.red},blue:{bg:'#dbeafe',fg:T.navyL},gray:{bg:'#f3f4f6',fg:T.textSec},teal:{bg:'#ccfbf1',fg:'#0d9488'},purple:{bg:'#ede9fe',fg:'#7c3aed'}}[color]||{bg:'#f3f4f6',fg:T.textSec};return <span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,fontFamily:T.font,background:c.bg,color:c.fg}}>{text}</span>};
const DualInput=({label,value,onChange,min=0,max=100,step=1,unit})=><div style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>{label}{unit&&<span style={{fontWeight:400,color:T.textMut}}> ({unit})</span>}</div><div style={{display:'flex',gap:8,alignItems:'center'}}><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} style={{flex:1,accentColor:T.navy}}/><input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Math.min(max,Math.max(min,+e.target.value)))} style={{width:72,padding:'4px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,textAlign:'right',color:T.text}}/></div></div>;
const Btn=({children,onClick,primary})=><button onClick={onClick} style={{padding:'8px 18px',borderRadius:8,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,fontSize:12,fontWeight:600,fontFamily:T.font,cursor:'pointer'}}>{children}</button>;

/* ── data ── */
const ROCK_TYPES=['Basalt','Wollastonite','Olivine','Serpentinite','Dunite','Steel Slag','Limestone','Dolomite'];
const REGIONS=['Pacific Northwest','Midwest USA','Central Europe','Southeast Asia','Sub-Saharan Africa','South America','India','Australia'];
const SOIL_TYPES=['Acidic Laterite','Neutral Loam','Alkaline Clay','Sandy Tropical','Peat','Volcanic'];

const genProjects=()=>Array.from({length:8},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);return{id:i+1,name:['Project Cascade ERW','Mineloop Basalt India','NovaTerra Iceland','Silicate Solutions UK','AgriCarbon Kenya','OceanRock Chile','Lithos Queensland','Wollast Nordic'][i],rock:ROCK_TYPES[Math.floor(s*ROCK_TYPES.length)],region:REGIONS[Math.floor(s2*REGIONS.length)],status:s3<0.5?'Active':s3<0.8?'Pilot':'Planned',application_rate:+(5+sr(i*23)*45).toFixed(1),area_ha:Math.floor(sr(i*29)*5000)+200,verified_tCO2:Math.floor(sr(i*31)*50000)+1000,cost_per_tCO2:Math.floor(sr(i*37)*120)+40,CaO:+(sr(i*41)*35+5).toFixed(1),MgO:+(sr(i*43)*30+2).toFixed(1),SiO2:+(sr(i*47)*45+15).toFixed(1),Fe2O3:+(sr(i*53)*15+1).toFixed(1),particle_um:Math.floor(sr(i*59)*1800)+100,weathering_rate:+(sr(i*61)*8+1).toFixed(1),soil:SOIL_TYPES[Math.floor(sr(i*67)*SOIL_TYPES.length)],startYear:2022+Math.floor(sr(i*71)*4),energy_kwh:Math.floor(sr(i*73)*60)+15,transport_km:Math.floor(sr(i*79)*300)+20}});

/* ── main component ── */
export default function CcMineralizationPage(){
  const { addCalculation, addProject, getSummary } = useCarbonCredit();
  const [tab,setTab]=useState(0);
  const tabs=['Methodology Overview','Ca-Rich Carbonation Calculator','ERW Cumulative Model','Rock Characterization','Field Application Design','Measurement & Verification'];

  /* calc inputs */
  const [rockQty,setRockQty]=useState(1000);
  const [caoPct,setCaoPct]=useState(25);
  const [mgoPct,setMgoPct]=useState(15);
  const [sio2Pct,setSio2Pct]=useState(40);
  const [particleSize,setParticleSize]=useState(200);
  const [appRate,setAppRate]=useState(20);
  const [weatherRate,setWeathRate]=useState(4);
  const [energyGrind,setEnergyGrind]=useState(35);
  const [horizon,setHorizon]=useState(30);
  const [selProject,setSelProject]=useState(null);
  const [filterRock,setFilterRock]=useState('All');
  const [fieldSoil,setFieldSoil]=useState(SOIL_TYPES[0]);
  const [fieldRegion,setFieldRegion]=useState(REGIONS[0]);
  const [fieldArea,setFieldArea]=useState(500);

  const projects=useMemo(()=>genProjects(),[]);

  /* Ca / Mg carbonation calc */
  const carbonation=useMemo(()=>{
    const caCO2=rockQty*(caoPct/100)*(44/56);
    const mgCO2=rockQty*(mgoPct/100)*(44/40);
    const totalTheoretical=caCO2+mgCO2;
    const sizeFactor=particleSize<=50?1.0:particleSize<=200?0.85:particleSize<=500?0.6:particleSize<=1000?0.35:0.15;
    const practicalCapture=totalTheoretical*sizeFactor*(weatherRate/100);
    const energyEmissions=rockQty*energyGrind*0.0004;
    const netRemoval=practicalCapture-energyEmissions;
    return{caCO2:+caCO2.toFixed(2),mgCO2:+mgCO2.toFixed(2),totalTheoretical:+totalTheoretical.toFixed(2),sizeFactor,practicalCapture:+practicalCapture.toFixed(2),energyEmissions:+energyEmissions.toFixed(2),netRemoval:+netRemoval.toFixed(2),efficiency:totalTheoretical>0?+(practicalCapture/totalTheoretical*100).toFixed(1):0};
  },[rockQty,caoPct,mgoPct,particleSize,weatherRate,energyGrind]);

  useEffect(() => {
    if (carbonation && carbonation.netRemoval > 0) {
      addCalculation({
        projectId: 'CC-LIVE',
        methodology: 'Puro-ERW',
        family: 'cdr',
        cluster: 'Mineralization/ERW',
        inputs: { rockQty, caoPct, mgoPct, particleSize, weatherRate, energyGrind },
        outputs: carbonation,
        net_tco2e: carbonation.netRemoval || 0,
      });
    }
  }, [carbonation]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ERW cumulative dissolution */
  const erwCumulative=useMemo(()=>{
    const yrs=[];let cumulative=0;
    for(let y=1;y<=horizon;y++){
      const annualDissolution=rockQty*(weatherRate/100)*Math.pow(0.97,y-1);
      const caRem=annualDissolution*(caoPct/100)*(44/56);
      const mgRem=annualDissolution*(mgoPct/100)*(44/40);
      cumulative+=(caRem+mgRem);
      const annualEnergy=annualDissolution*energyGrind*0.0004;
      yrs.push({year:y,annual:+(caRem+mgRem).toFixed(1),cumulative:+cumulative.toFixed(1),energyCost:+annualEnergy.toFixed(1),net:+(cumulative-annualEnergy*y).toFixed(1)});
    }
    return yrs;
  },[rockQty,caoPct,mgoPct,weatherRate,horizon,energyGrind]);

  /* XRF composition radar */
  const xrfRadar=useMemo(()=>[
    {oxide:'CaO',value:caoPct,max:55},{oxide:'MgO',value:mgoPct,max:50},{oxide:'SiO2',value:sio2Pct,max:70},{oxide:'Fe2O3',value:+(sr(42)*15+2).toFixed(1),max:20},{oxide:'Al2O3',value:+(sr(43)*12+1).toFixed(1),max:18},{oxide:'Na2O',value:+(sr(44)*5+0.5).toFixed(1),max:8},{oxide:'K2O',value:+(sr(45)*4+0.3).toFixed(1),max:6}
  ],[caoPct,mgoPct,sio2Pct]);

  /* rock characterization data */
  const rockDB=useMemo(()=>ROCK_TYPES.map((r,i)=>({
    name:r,CaO:+(sr(i*101)*35+5).toFixed(1),MgO:+(sr(i*103)*30+2).toFixed(1),SiO2:+(sr(i*107)*45+15).toFixed(1),Fe2O3:+(sr(i*109)*15+1).toFixed(1),hardness:+(sr(i*113)*4+3).toFixed(1),density:+(sr(i*117)*1.2+2.4).toFixed(2),reactivity:sr(i*119)<0.3?'High':sr(i*119)<0.7?'Medium':'Low',co2Potential:+(sr(i*123)*400+100).toFixed(0),costPerTonne:Math.floor(sr(i*127)*50)+15,availability:sr(i*131)<0.4?'Abundant':sr(i*131)<0.75?'Moderate':'Limited'
  })),[]);

  /* soil pH impact */
  const soilImpact=useMemo(()=>{
    const idx=SOIL_TYPES.indexOf(fieldSoil);
    const basePH=[4.5,6.8,8.2,5.5,3.8,5.0][idx]||6.0;
    return Array.from({length:12},(_,m)=>{
      const rate=appRate*(1+sr(m*17+idx*3)*0.3);
      const phShift=rate*0.015*(1-m*0.02);
      return{month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],pH:+(basePH+phShift*(m+1)/12).toFixed(2),mineralRelease:+(rate*sr(m*19+idx)*0.1).toFixed(1),soilC:+(sr(m*23+idx)*5+2).toFixed(1)};
    });
  },[fieldSoil,appRate]);

  /* transport vs grinding cost tradeoff */
  const costTradeoff=useMemo(()=>{
    return[10,50,100,200,500,1000,1500,2000].map(size=>{
      const grindCost=size<=50?60:size<=200?35:size<=500?20:size<=1000?12:8;
      const grindEnergy=size<=50?80:size<=200?45:size<=500?25:size<=1000?15:10;
      const effectiveness=size<=50?1.0:size<=200?0.85:size<=500?0.6:size<=1000?0.35:0.15;
      const transportCost=5+sr(size)*3;
      return{size,grindCost,grindEnergy,effectiveness:+(effectiveness*100).toFixed(0),transportCost:+transportCost.toFixed(1),totalCost:+(grindCost+transportCost).toFixed(1),netCO2PerTonne:+(rockQty/1000*(caoPct/100)*(44/56)*effectiveness-grindEnergy*0.0004*rockQty/1000).toFixed(2)};
    });
  },[rockQty,caoPct]);

  /* field MV data */
  const mvData=useMemo(()=>Array.from({length:24},(_,m)=>({
    month:`M${m+1}`,predicted:+(sr(m*31)*20+10).toFixed(1),observed:+(sr(m*37)*22+8).toFixed(1),uncertainty:+(sr(m*41)*5+2).toFixed(1),soilCO2:+(sr(m*43)*8+3).toFixed(1)
  })),[]);

  const kpis=useMemo(()=>[
    {label:'Net CO2 Removal',value:`${carbonation.netRemoval} t`,icon:'CO2'},
    {label:'Ca Carbonation',value:`${carbonation.caCO2} t`,icon:'Ca'},
    {label:'Mg Carbonation',value:`${carbonation.mgCO2} t`,icon:'Mg'},
    {label:'Practical Efficiency',value:`${carbonation.efficiency}%`,icon:'Eff'},
    {label:'Energy Penalty',value:`${carbonation.energyEmissions} t`,icon:'E'},
    {label:`${horizon}-yr Cumulative`,value:`${erwCumulative[erwCumulative.length-1]?.cumulative||0} t`,icon:'Sum'},
    {label:'Active Projects',value:projects.filter(p=>p.status==='Active').length,icon:'Prj'},
    {label:'Total Verified',value:`${(projects.reduce((a,p)=>a+p.verified_tCO2,0)/1000).toFixed(0)}K t`,icon:'V'}
  ],[carbonation,erwCumulative,horizon,projects]);

  const filteredProjects=useMemo(()=>{
    let r=projects;
    if(filterRock!=='All')r=r.filter(p=>p.rock===filterRock);
    return r;
  },[projects,filterRock]);

  const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.navyL,T.goldL,T.sageL];

  /* ── render ── */
  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Enhanced Weathering & Mineralization</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>EP-BU1 -- Carbon removal through accelerated rock weathering and mineral carbonation</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10,marginBottom:20}}>
        {kpis.map((k,i)=><Kpi key={i} {...k}/>)}
      </div>

      <TabBar tabs={tabs} active={tab} onSet={setTab}/>

      {/* ── Tab 0: Methodology Overview ── */}
      {tab===0&&<>
        <Section title="Methodology Overview" sub="Enhanced weathering accelerates natural silicate mineral dissolution to sequester atmospheric CO2">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>Ca-Rich Carbonation Pathway</div>
              <div style={{fontFamily:T.mono,fontSize:12,background:T.surfaceH,padding:12,borderRadius:8,marginBottom:8}}>
                CaO + CO2 {'-->'} CaCO3<br/>
                CO2 captured = mass x (CaO% / 100) x (44/56)<br/>
                Molar ratio: 44g CO2 per 56g CaO
              </div>
              <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
                Calcium-oxide-rich rocks react with dissolved CO2 in soil water, forming stable calcium carbonate. Basalt and wollastonite are primary feedstocks. Particle size and soil moisture drive reaction kinetics.
              </div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>Mg-Rich Carbonation Pathway</div>
              <div style={{fontFamily:T.mono,fontSize:12,background:T.surfaceH,padding:12,borderRadius:8,marginBottom:8}}>
                MgO + CO2 {'-->'} MgCO3<br/>
                CO2 captured = mass x (MgO% / 100) x (44/40)<br/>
                Molar ratio: 44g CO2 per 40g MgO
              </div>
              <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
                Magnesium-oxide-bearing minerals (olivine, serpentinite) react similarly but with higher theoretical capacity per unit mass due to lighter MgO molar weight. Olivine dissolution is temperature- and pH-dependent.
              </div>
            </Card>
          </div>
        </Section>

        <Section title="ERW Process Flowchart">
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'center',padding:16}}>
            {['Rock Quarrying','Grinding','Transport','Field Application','Weathering','CO2 Sequestration','MRV & Verification'].map((step,i)=>(
              <React.Fragment key={i}>
                <div style={{background:i===5?T.sage:T.navy,color:'#fff',padding:'10px 16px',borderRadius:8,fontSize:12,fontWeight:600,textAlign:'center',minWidth:100}}>{step}</div>
                {i<6&&<div style={{color:T.gold,fontWeight:700,fontSize:16}}>{'-->'}</div>}
              </React.Fragment>
            ))}
          </div>
        </Section>

        <Section title="Active Projects">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
              <thead><tr>{['#','Project','Rock Type','Region','Status','Rate t/ha','Area ha','Verified tCO2','$/tCO2'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>{projects.map(p=><tr key={p.id} style={{cursor:'pointer',background:selProject?.id===p.id?T.surfaceH:'transparent'}} onClick={()=>setSelProject(p)}>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}>{p.id}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontWeight:600}}>{p.name}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={p.rock} color="blue"/></td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}>{p.region}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={p.status} color={p.status==='Active'?'green':p.status==='Pilot'?'amber':'gray'}/></td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.application_rate}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.area_ha.toLocaleString()}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.verified_tCO2.toLocaleString()}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>${p.cost_per_tCO2}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Section>
      </>}

      {/* ── Tab 1: Ca-Rich Carbonation Calculator ── */}
      {tab===1&&<>
        <div style={{display:'grid',gridTemplateColumns:'360px 1fr',gap:16}}>
          <Section title="Input Parameters">
            <DualInput label="Rock Quantity" value={rockQty} onChange={setRockQty} min={100} max={100000} step={100} unit="tonnes"/>
            <DualInput label="CaO Content" value={caoPct} onChange={setCaoPct} min={0} max={55} step={0.5} unit="%"/>
            <DualInput label="MgO Content" value={mgoPct} onChange={setMgoPct} min={0} max={50} step={0.5} unit="%"/>
            <DualInput label="SiO2 Content" value={sio2Pct} onChange={setSio2Pct} min={0} max={70} step={0.5} unit="%"/>
            <DualInput label="Particle Size" value={particleSize} onChange={setParticleSize} min={10} max={2000} step={10} unit="um"/>
            <DualInput label="Weathering Rate" value={weatherRate} onChange={setWeathRate} min={0.5} max={15} step={0.5} unit="% / yr"/>
            <DualInput label="Grinding Energy" value={energyGrind} onChange={setEnergyGrind} min={5} max={100} step={1} unit="kWh/t"/>
          </Section>
          <div>
            <Section title="Carbonation Results">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
                <Card><div style={{fontSize:11,color:T.textSec}}>Ca-CO2 Capture</div><div style={{fontSize:20,fontWeight:700,color:T.sage,fontFamily:T.mono}}>{carbonation.caCO2} t</div><div style={{fontSize:10,color:T.textMut}}>CaO x 44/56</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Mg-CO2 Capture</div><div style={{fontSize:20,fontWeight:700,color:T.navyL,fontFamily:T.mono}}>{carbonation.mgCO2} t</div><div style={{fontSize:10,color:T.textMut}}>MgO x 44/40</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Net Removal</div><div style={{fontSize:20,fontWeight:700,color:carbonation.netRemoval>0?T.green:T.red,fontFamily:T.mono}}>{carbonation.netRemoval} t</div><div style={{fontSize:10,color:T.textMut}}>After energy penalty</div></Card>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                <Card><div style={{fontSize:11,color:T.textSec}}>Theoretical Total</div><div style={{fontSize:16,fontWeight:700,fontFamily:T.mono}}>{carbonation.totalTheoretical} t</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Practical Capture</div><div style={{fontSize:16,fontWeight:700,fontFamily:T.mono}}>{carbonation.practicalCapture} t</div><div style={{fontSize:10,color:T.textMut}}>Size factor: {carbonation.sizeFactor}</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Energy Emissions</div><div style={{fontSize:16,fontWeight:700,color:T.red,fontFamily:T.mono}}>{carbonation.energyEmissions} t</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Overall Efficiency</div><div style={{fontSize:16,fontWeight:700,fontFamily:T.mono}}>{carbonation.efficiency}%</div></Card>
              </div>
            </Section>

            <Section title="XRF Composition Profile">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={xrfRadar}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="oxide" tick={{fontSize:11,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9}}/><Radar dataKey="value" stroke={T.navy} fill={T.navyL} fillOpacity={0.3} name="% w/w"/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/></RadarChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </div>

        <Section title="Particle Size vs Capture Efficiency">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costTradeoff}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="size" tick={{fontSize:10}} stroke={T.textMut} label={{value:'Particle Size (um)',position:'bottom',fontSize:11}}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="effectiveness" name="Effectiveness %" fill={T.sage}/><Bar dataKey="grindCost" name="Grinding $/t" fill={T.gold}/><Bar dataKey="netCO2PerTonne" name="Net CO2/t" fill={T.navy}/></BarChart>
          </ResponsiveContainer>
        </Section>
      </>}

      {/* ── Tab 2: ERW Cumulative Model ── */}
      {tab===2&&<>
        <Section title="ERW Cumulative Dissolution Model" sub="Projected CO2 removal over multi-decadal horizon with annual decay factor">
          <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
            <DualInput label="Projection Horizon" value={horizon} onChange={setHorizon} min={10} max={50} step={5} unit="years"/>
            <DualInput label="Rock Quantity" value={rockQty} onChange={setRockQty} min={100} max={100000} step={100} unit="tonnes"/>
            <DualInput label="Weathering Rate" value={weatherRate} onChange={setWeathRate} min={0.5} max={15} step={0.5} unit="% / yr"/>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={erwCumulative}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Area type="monotone" dataKey="cumulative" stroke={T.sage} fill={T.sageL} fillOpacity={0.3} name="Cumulative tCO2"/><Area type="monotone" dataKey="net" stroke={T.navy} fill={T.navyL} fillOpacity={0.2} name="Net (after energy)"/><Line type="monotone" dataKey="annual" stroke={T.gold} strokeWidth={2} dot={false} name="Annual tCO2"/></AreaChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Annual Breakdown Table">
          <div style={{overflowX:'auto',maxHeight:400}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
              <thead style={{position:'sticky',top:0,background:T.surface}}><tr>{['Year','Annual tCO2','Cumulative tCO2','Energy Cost t','Net tCO2'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'right',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>{erwCumulative.map(r=><tr key={r.year}><td style={{padding:'6px 10px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontFamily:T.mono}}>{r.year}</td><td style={{padding:'6px 10px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontFamily:T.mono}}>{r.annual}</td><td style={{padding:'6px 10px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontFamily:T.mono,fontWeight:600}}>{r.cumulative}</td><td style={{padding:'6px 10px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontFamily:T.mono,color:T.red}}>{r.energyCost}</td><td style={{padding:'6px 10px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontFamily:T.mono,fontWeight:600,color:r.net>0?T.green:T.red}}>{r.net}</td></tr>)}</tbody>
            </table>
          </div>
        </Section>
      </>}

      {/* ── Tab 3: Rock Characterization ── */}
      {tab===3&&<>
        <Section title="Rock Database & XRF Composition" sub="Geochemical characterization of CDR-relevant rock types">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
              <thead><tr>{['Rock Type','CaO %','MgO %','SiO2 %','Fe2O3 %','Hardness','Density','Reactivity','CO2 Potential kg/t','Cost $/t','Availability'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>{rockDB.map((r,i)=><tr key={i} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontWeight:600}}>{r.name}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.CaO}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.MgO}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.SiO2}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.Fe2O3}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.hardness}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.density}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={r.reactivity} color={r.reactivity==='High'?'green':r.reactivity==='Medium'?'amber':'red'}/></td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.co2Potential}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>${r.costPerTonne}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={r.availability} color={r.availability==='Abundant'?'green':r.availability==='Moderate'?'amber':'red'}/></td>
              </tr>)}</tbody>
            </table>
          </div>
        </Section>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Section title="CO2 Potential by Rock Type">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={rockDB} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10}} stroke={T.textMut}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={100} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Bar dataKey="co2Potential" name="CO2 kg/t" fill={T.sage}>{rockDB.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Oxide Composition Comparison">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={rockDB}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,angle:-20}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="CaO" name="CaO %" fill={T.navy} stackId="a"/><Bar dataKey="MgO" name="MgO %" fill={T.sage} stackId="a"/><Bar dataKey="SiO2" name="SiO2 %" fill={T.gold} stackId="a"/></BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      </>}

      {/* ── Tab 4: Field Application Design ── */}
      {tab===4&&<>
        <Section title="Field Application Design" sub="Configure application parameters for site-specific ERW deployment">
          <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16}}>
            <div>
              <div style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>Soil Type</div><select value={fieldSoil} onChange={e=>setFieldSoil(e.target.value)} style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>{SOIL_TYPES.map(s=><option key={s}>{s}</option>)}</select></div>
              <div style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>Region</div><select value={fieldRegion} onChange={e=>setFieldRegion(e.target.value)} style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></div>
              <DualInput label="Application Rate" value={appRate} onChange={setAppRate} min={1} max={50} step={1} unit="t/ha"/>
              <DualInput label="Field Area" value={fieldArea} onChange={setFieldArea} min={10} max={10000} step={10} unit="ha"/>
              <DualInput label="Particle Size" value={particleSize} onChange={setParticleSize} min={10} max={2000} step={10} unit="um"/>

              <Card style={{marginTop:12}}>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Deployment Summary</div>
                <div style={{fontSize:12,lineHeight:1.8}}>
                  <div>Total Rock Required: <strong style={{fontFamily:T.mono}}>{(appRate*fieldArea).toLocaleString()} t</strong></div>
                  <div>Grinding Energy: <strong style={{fontFamily:T.mono}}>{(appRate*fieldArea*energyGrind).toLocaleString()} kWh</strong></div>
                  <div>Est. CO2 Removal: <strong style={{fontFamily:T.mono,color:T.green}}>{(appRate*fieldArea*(caoPct/100)*(44/56)*0.6).toFixed(0)} t</strong></div>
                  <div>Cost Estimate: <strong style={{fontFamily:T.mono}}>${(appRate*fieldArea*45).toLocaleString()}</strong></div>
                </div>
              </Card>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>Soil pH Impact Over 12 Months ({fieldSoil})</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={soilImpact}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut} domain={['auto','auto']}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Line type="monotone" dataKey="pH" stroke={T.sage} strokeWidth={2} name="Soil pH"/><Line type="monotone" dataKey="mineralRelease" stroke={T.gold} strokeWidth={2} name="Mineral Release"/></LineChart>
              </ResponsiveContainer>

              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8,marginTop:16}}>Transport vs Grinding Cost Tradeoff</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={costTradeoff}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="size" tick={{fontSize:10}} stroke={T.textMut} label={{value:'Particle Size (um)',position:'bottom',fontSize:11}}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Line type="monotone" dataKey="grindCost" stroke={T.red} strokeWidth={2} name="Grinding $/t"/><Line type="monotone" dataKey="transportCost" stroke={T.amber} strokeWidth={2} name="Transport $/t"/><Line type="monotone" dataKey="totalCost" stroke={T.navy} strokeWidth={2.5} name="Total $/t"/></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>
      </>}

      {/* ── Tab 5: Measurement & Verification ── */}
      {tab===5&&<>
        <Section title="Measurement & Verification" sub="Field-measured vs predicted CO2 removal with uncertainty quantification">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mvData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Area type="monotone" dataKey="predicted" stroke={T.navy} fill={T.navyL} fillOpacity={0.2} name="Predicted tCO2"/><Area type="monotone" dataKey="observed" stroke={T.sage} fill={T.sageL} fillOpacity={0.3} name="Observed tCO2"/><Line type="monotone" dataKey="uncertainty" stroke={T.amber} strokeDasharray="5 3" strokeWidth={1.5} dot={false} name="Uncertainty +/-"/></AreaChart>
          </ResponsiveContainer>
        </Section>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Section title="Soil CO2 Flux Monitoring">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mvData.slice(0,12)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Bar dataKey="soilCO2" name="Soil CO2 flux" fill={T.sage}/></BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Verification Summary">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[
                {label:'Total Predicted',value:`${mvData.reduce((a,d)=>a+ +d.predicted,0).toFixed(0)} t`,color:T.navy},
                {label:'Total Observed',value:`${mvData.reduce((a,d)=>a+ +d.observed,0).toFixed(0)} t`,color:T.sage},
                {label:'Avg Uncertainty',value:`+/- ${(mvData.reduce((a,d)=>a+ +d.uncertainty,0)/mvData.length).toFixed(1)} t`,color:T.amber},
                {label:'Prediction Accuracy',value:`${(100-Math.abs(mvData.reduce((a,d)=>a+ +d.predicted,0)-mvData.reduce((a,d)=>a+ +d.observed,0))/mvData.reduce((a,d)=>a+ +d.predicted,0)*100).toFixed(1)}%`,color:T.green}
              ].map((m,i)=><Card key={i}><div style={{fontSize:11,color:T.textSec}}>{m.label}</div><div style={{fontSize:18,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div></Card>)}
            </div>
            <Card style={{marginTop:12}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>MRV Protocol Compliance</div>
              {['Baseline soil sampling completed','Monthly cation/anion measurements','Quarterly DIC/alkalinity analysis','Annual isotopic verification (d13C)','Remote sensing cross-check','Third-party audit trail'].map((item,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}><div style={{width:16,height:16,borderRadius:4,background:i<4?T.green:T.amber,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10,fontWeight:700}}>{i<4?'V':'P'}</div><span style={{fontSize:12}}>{item}</span></div>)}
            </Card>
          </Section>
        </div>
      </>}
    </div>
  );
}
