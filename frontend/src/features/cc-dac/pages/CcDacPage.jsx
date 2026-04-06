import React,{useState,useMemo,useEffect} from 'react';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,PieChart,Pie,Cell} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── inline primitives ── */
const TabBar=({tabs,active,onSet})=><div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0,overflowX:'auto'}}>{tabs.map((t,i)=><button key={i} onClick={()=>onSet(i)} style={{padding:'10px 18px',border:'none',borderBottom:i===active?`3px solid ${T.navy}`:'3px solid transparent',background:i===active?T.surface:'transparent',color:i===active?T.navy:T.textSec,fontWeight:i===active?700:500,fontSize:13,fontFamily:T.font,cursor:'pointer',borderRadius:'8px 8px 0 0',transition:'all 0.2s',whiteSpace:'nowrap'}}>{t}</button>)}</div>;
const Kpi=({label,value,sub,icon})=><div style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16,textAlign:'center'}}>{icon&&<div style={{fontSize:22}}>{icon}</div>}<div style={{fontSize:20,fontWeight:700,color:T.navy,margin:'4px 0',fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut,marginTop:2}}>{sub}</div>}</div>;
const Section=({title,sub,children})=><div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:16}}>{title&&<div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:sub?2:12}}>{title}</div>}{sub&&<div style={{fontSize:12,color:T.textSec,marginBottom:12}}>{sub}</div>}{children}</div>;
const Card=({children,style})=><div style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16,...style}}>{children}</div>;
const Badge=({text,color})=>{const c={green:{bg:'#dcfce7',fg:T.green},amber:{bg:'#fef3c7',fg:T.amber},red:{bg:'#fee2e2',fg:T.red},blue:{bg:'#dbeafe',fg:T.navyL},gray:{bg:'#f3f4f6',fg:T.textSec},teal:{bg:'#ccfbf1',fg:'#0d9488'},purple:{bg:'#ede9fe',fg:'#7c3aed'}}[color]||{bg:'#f3f4f6',fg:T.textSec};return <span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,fontFamily:T.font,background:c.bg,color:c.fg}}>{text}</span>};
const DualInput=({label,value,onChange,min=0,max=100,step=1,unit})=><div style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>{label}{unit&&<span style={{fontWeight:400,color:T.textMut}}> ({unit})</span>}</div><div style={{display:'flex',gap:8,alignItems:'center'}}><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} style={{flex:1,accentColor:T.navy}}/><input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Math.min(max,Math.max(min,+e.target.value)))} style={{width:72,padding:'4px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,textAlign:'right',color:T.text}}/></div></div>;

/* ── data ── */
const ENERGY_SOURCES=['Renewable','Grid Mix','Natural Gas'];
const PERM_TIERS=[{name:'Premium',desc:'>=1000yr geological storage',adj:0,color:'green'},{name:'Standard',desc:'>=100yr mineral carbonation',adj:0.10,color:'amber'},{name:'Basic',desc:'<100yr, enhanced weathering',adj:0.30,color:'red'}];
const TECH_TYPES=['Solid Sorbent','Liquid Solvent'];

const genFacilities=()=>Array.from({length:6},(_,i)=>{
  const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);
  return{id:i+1,
    name:['Climeworks Orca II','Carbon Engineering CE-3','Global Thermostat TX','Heirloom Carbon SF','CarbonCapture Bozeman','Verdox Boston'][i],
    tech:TECH_TYPES[i%2],
    capacity_tpa:Math.floor(sr(i*23)*90000)+5000,
    energy_source:ENERGY_SOURCES[Math.floor(s*3)],
    energy_kwh:Math.floor(sr(i*29)*1300)+1200,
    sorbent_eff:+(sr(i*31)*9+3).toFixed(1),
    lcod:Math.floor(sr(i*37)*600)+250,
    permanence:PERM_TIERS[Math.floor(s2*3)].name,
    location:['Iceland','British Columbia','Texas','San Francisco','Montana','Massachusetts'][i],
    start_year:2024+Math.floor(sr(i*41)*4),
    co2_stored:Math.floor(sr(i*43)*60000)+2000,
    status:s3<0.5?'Operational':s3<0.8?'Commissioning':'Planned',
    utilization:+(sr(i*47)*40+55).toFixed(1),
    water_m3:+(sr(i*53)*3+0.5).toFixed(1)
  };
});

/* learning curve 2024-2050 */
const genLearningCurve=()=>Array.from({length:27},(_,i)=>{
  const yr=2024+i;
  const solidCost=Math.max(80,600*Math.pow(0.92,i)+sr(i*61)*30);
  const liquidCost=Math.max(90,500*Math.pow(0.93,i)+sr(i*67)*25);
  const capacity=1000*Math.pow(1.35,Math.min(i,20))+sr(i*71)*500;
  return{year:yr,solid:+solidCost.toFixed(0),liquid:+liquidCost.toFixed(0),capacity:+capacity.toFixed(0)};
});

export default function CcDacPage(){
  const { addCalculation, addProject, getSummary } = useCarbonCredit();
  const [tab,setTab]=useState(0);
  const tabs=['Methodology Overview','Net Removal Calculator','Permanence Tier Assessment','Energy & Cost Model','Facility Design','Lifecycle Assessment'];

  /* calc inputs */
  const [grossCapture,setGrossCapture]=useState(10000);
  const [energySource,setEnergySource]=useState('Renewable');
  const [energyIntensity,setEnergyIntensity]=useState(1800);
  const [sorbentPct,setSorbentPct]=useState(6);
  const [constructionPct,setConstructionPct]=useState(3);
  const [transportPct,setTransportPct]=useState(4);
  const [permTier,setPermTier]=useState(0);
  const [lcod,setLcod]=useState(400);
  const [selFacility,setSelFacility]=useState(null);

  const facilities=useMemo(()=>genFacilities(),[]);
  const learningCurve=useMemo(()=>genLearningCurve(),[]);

  /* net removal calc */
  const netCalc=useMemo(()=>{
    const energyEF={Renewable:0.02,'Grid Mix':0.45,'Natural Gas':0.20}[energySource]||0.20;
    const energyEmissions=grossCapture*(energyIntensity/1000)*energyEF;
    const sorbentEmissions=grossCapture*(sorbentPct/100);
    const constructionEmissions=grossCapture*(constructionPct/100);
    const transportEmissions=grossCapture*(transportPct/100);
    const totalLifecycle=energyEmissions+sorbentEmissions+constructionEmissions+transportEmissions;
    const grossNet=grossCapture-totalLifecycle;
    const permAdj=PERM_TIERS[permTier].adj;
    const netRemoval=grossNet*(1-permAdj);
    const captureEfficiency=grossCapture>0?(netRemoval/grossCapture*100):0;
    const totalCost=grossCapture*lcod;
    const costPerNetTonne=netRemoval>0?(totalCost/netRemoval):0;
    return{energyEmissions:+energyEmissions.toFixed(1),sorbentEmissions:+sorbentEmissions.toFixed(1),constructionEmissions:+constructionEmissions.toFixed(1),transportEmissions:+transportEmissions.toFixed(1),totalLifecycle:+totalLifecycle.toFixed(1),grossNet:+grossNet.toFixed(1),netRemoval:+netRemoval.toFixed(1),captureEfficiency:+captureEfficiency.toFixed(1),totalCost:+totalCost.toFixed(0),costPerNetTonne:+costPerNetTonne.toFixed(0),permAdj};
  },[grossCapture,energySource,energyIntensity,sorbentPct,constructionPct,transportPct,permTier,lcod]);

  useEffect(() => {
    if (netCalc && netCalc.netRemoval > 0) {
      addCalculation({
        projectId: 'CC-LIVE',
        methodology: 'Iso-DAC',
        family: 'cdr',
        cluster: 'DAC',
        inputs: { grossCapture, energySource, energyIntensity, sorbentPct, constructionPct, transportPct, permTier, lcod },
        outputs: netCalc,
        net_tco2e: netCalc.netRemoval || 0,
      });
    }
  }, [netCalc]); // eslint-disable-line react-hooks/exhaustive-deps

  /* lifecycle breakdown for pie */
  const lcBreakdown=useMemo(()=>[
    {name:'Energy',value:netCalc.energyEmissions,fill:T.red},
    {name:'Sorbent',value:netCalc.sorbentEmissions,fill:T.amber},
    {name:'Construction',value:netCalc.constructionEmissions,fill:T.gold},
    {name:'Transport',value:netCalc.transportEmissions,fill:T.navyL}
  ],[netCalc]);

  /* technology comparison */
  const techComparison=useMemo(()=>[
    {metric:'Energy (kWh/tCO2)',solid:1800,liquid:2200},
    {metric:'Water (m3/tCO2)',solid:0.8,liquid:5.0},
    {metric:'Sorbent Life (cycles)',solid:5000,liquid:800},
    {metric:'LCOD 2026 ($/tCO2)',solid:450,liquid:380},
    {metric:'Scalability (1-10)',solid:7,liquid:8},
    {metric:'TRL',solid:7,liquid:6},
    {metric:'Land Use (m2/tCO2)',solid:0.4,liquid:0.6},
    {metric:'Purity (%)',solid:99.5,liquid:98.0}
  ],[]);

  /* energy sensitivity */
  const energySensitivity=useMemo(()=>{
    return[1200,1400,1600,1800,2000,2200,2500].map(kwh=>{
      const sources=ENERGY_SOURCES.map(src=>{
        const ef={Renewable:0.02,'Grid Mix':0.45,'Natural Gas':0.20}[src];
        const em=grossCapture*(kwh/1000)*ef;
        const net=grossCapture-em-grossCapture*(sorbentPct+constructionPct+transportPct)/100;
        return{[src]:+net.toFixed(0)};
      });
      return{kwh,...Object.assign({},...sources)};
    });
  },[grossCapture,sorbentPct,constructionPct,transportPct]);

  /* facility design params */
  const [designCapacity,setDesignCapacity]=useState(50000);
  const [designModules,setDesignModules]=useState(10);
  const [designLand,setDesignLand]=useState(5);

  const facilityDesign=useMemo(()=>{
    const safeModules=Math.max(designModules,1); // guard: user can type 0 in number field bypassing slider min=2, which would produce Infinity
    const capPerModule=designCapacity/safeModules;
    const energyReq=designCapacity*energyIntensity;
    const waterReq=designCapacity*1.5;
    const annualCost=designCapacity*lcod;
    const landPerModule=designLand/safeModules;
    return{capPerModule:+capPerModule.toFixed(0),energyReq,waterReq:+waterReq.toFixed(0),annualCost,landPerModule:+landPerModule.toFixed(2),modules:Array.from({length:safeModules},(_,i)=>({id:i+1,capacity:+capPerModule.toFixed(0),status:sr(i*201)<0.7?'Online':'Standby',utilization:+(sr(i*203)*30+65).toFixed(1),temp:+(sr(i*207)*15+80).toFixed(0),pressure:+(sr(i*209)*2+1).toFixed(1)}))};
  },[designCapacity,designModules,designLand,energyIntensity,lcod]);

  /* LCA waterfall */
  const lcaWaterfall=useMemo(()=>[
    {stage:'Gross Capture',value:grossCapture,fill:T.sage},
    {stage:'Energy',value:-netCalc.energyEmissions,fill:T.red},
    {stage:'Sorbent',value:-netCalc.sorbentEmissions,fill:T.amber},
    {stage:'Construction',value:-netCalc.constructionEmissions,fill:T.gold},
    {stage:'Transport',value:-netCalc.transportEmissions,fill:T.navyL},
    {stage:'Permanence Adj',value:-(netCalc.grossNet*netCalc.permAdj),fill:'#7c3aed'},
    {stage:'Net Removal',value:netCalc.netRemoval,fill:T.green}
  ],[grossCapture,netCalc]);

  const kpis=useMemo(()=>[
    {label:'Net Removal',value:`${netCalc.netRemoval.toLocaleString()} t`,icon:'DAC'},
    {label:'Capture Efficiency',value:`${netCalc.captureEfficiency}%`},
    {label:'Cost / Net tCO2',value:`$${netCalc.costPerNetTonne}`},
    {label:'Lifecycle Emissions',value:`${netCalc.totalLifecycle.toLocaleString()} t`},
    {label:'Permanence Tier',value:PERM_TIERS[permTier].name},
    {label:'Facilities Tracked',value:facilities.length},
    {label:'Total Stored',value:`${(facilities.reduce((a,f)=>a+f.co2_stored,0)/1000).toFixed(0)}K t`},
    {label:'Avg Utilization',value:`${(facilities.reduce((a,f)=>a+ +f.utilization,0)/facilities.length).toFixed(0)}%`}
  ],[netCalc,permTier,facilities]);

  const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.navyL,T.goldL,T.sageL];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Direct Air Capture (DAC)</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>EP-BU2 -- Net carbon removal through engineered atmospheric CO2 capture with permanent storage</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10,marginBottom:20}}>
        {kpis.map((k,i)=><Kpi key={i} {...k}/>)}
      </div>

      <TabBar tabs={tabs} active={tab} onSet={setTab}/>

      {/* ── Tab 0: Methodology Overview ── */}
      {tab===0&&<>
        <Section title="DAC Methodology" sub="Direct Air Capture removes CO2 directly from ambient air using engineered sorbent/solvent systems">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>Net Removal Formula</div>
              <div style={{fontFamily:T.mono,fontSize:12,background:T.surfaceH,padding:12,borderRadius:8,marginBottom:8}}>
                NET = Gross_Capture - Lifecycle_Emissions<br/><br/>
                Lifecycle = Energy_Em + Sorbent_Em + Construction_Em + Transport_Em<br/><br/>
                Final = NET x (1 - Permanence_Adjustment)
              </div>
              <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
                Gross capture is the total CO2 removed from air by the sorbent/solvent system. Lifecycle emissions account for all energy, material, and logistics costs. Permanence adjustment discounts based on storage security.
              </div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>Technology Comparison</div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr>{['Metric','Solid Sorbent','Liquid Solvent'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
                  <tbody>{techComparison.map((r,i)=><tr key={i}><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontWeight:600}}>{r.metric}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.solid}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.liquid}</td></tr>)}</tbody>
                </table>
              </div>
            </Card>
          </div>
        </Section>

        <Section title="Permanence Tiers">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            {PERM_TIERS.map((t,i)=><Card key={i} style={{borderLeft:`4px solid ${t.color==='green'?T.green:t.color==='amber'?T.amber:T.red}`}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{t.name}</div>
              <div style={{fontSize:12,color:T.textSec,margin:'4px 0'}}>{t.desc}</div>
              <div style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:t.color==='green'?T.green:t.color==='amber'?T.amber:T.red}}>{t.adj===0?'0% adjustment':`-${(t.adj*100).toFixed(0)}% adjustment`}</div>
            </Card>)}
          </div>
        </Section>

        <Section title="Tracked Facilities">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.font}}>
              <thead><tr>{['#','Facility','Technology','Location','Capacity tpa','Energy Source','LCOD $/t','Permanence','Status','Utilization'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>{facilities.map(f=><tr key={f.id} style={{cursor:'pointer',background:selFacility?.id===f.id?T.surfaceH:'transparent'}} onClick={()=>setSelFacility(f)}>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}>{f.id}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontWeight:600}}>{f.name}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={f.tech} color={f.tech==='Solid Sorbent'?'blue':'purple'}/></td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}>{f.location}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{f.capacity_tpa.toLocaleString()}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={f.energy_source} color={f.energy_source==='Renewable'?'green':f.energy_source==='Grid Mix'?'amber':'red'}/></td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>${f.lcod}</td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={f.permanence} color={f.permanence==='Premium'?'green':f.permanence==='Standard'?'amber':'red'}/></td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={f.status} color={f.status==='Operational'?'green':f.status==='Commissioning'?'amber':'gray'}/></td>
                <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{f.utilization}%</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Section>
      </>}

      {/* ── Tab 1: Net Removal Calculator ── */}
      {tab===1&&<>
        <div style={{display:'grid',gridTemplateColumns:'360px 1fr',gap:16}}>
          <Section title="Input Parameters">
            <DualInput label="Gross Capture" value={grossCapture} onChange={setGrossCapture} min={100} max={100000} step={500} unit="tCO2/yr"/>
            <div style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>Energy Source</div><select value={energySource} onChange={e=>setEnergySource(e.target.value)} style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>{ENERGY_SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
            <DualInput label="Energy Intensity" value={energyIntensity} onChange={setEnergyIntensity} min={1200} max={2500} step={50} unit="kWh/tCO2"/>
            <DualInput label="Sorbent Emissions" value={sorbentPct} onChange={setSorbentPct} min={3} max={12} step={0.5} unit="% of gross"/>
            <DualInput label="Construction (annualized)" value={constructionPct} onChange={setConstructionPct} min={1} max={5} step={0.5} unit="% of gross"/>
            <DualInput label="Transport Emissions" value={transportPct} onChange={setTransportPct} min={2} max={8} step={0.5} unit="% of gross"/>
            <div style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>Permanence Tier</div><select value={permTier} onChange={e=>setPermTier(+e.target.value)} style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>{PERM_TIERS.map((t,i)=><option key={i} value={i}>{t.name} ({t.desc})</option>)}</select></div>
            <DualInput label="LCOD" value={lcod} onChange={setLcod} min={200} max={1000} step={10} unit="$/tCO2"/>
          </Section>
          <div>
            <Section title="Net Removal Results">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
                <Card><div style={{fontSize:11,color:T.textSec}}>Gross Capture</div><div style={{fontSize:20,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{grossCapture.toLocaleString()} t</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Lifecycle Emissions</div><div style={{fontSize:20,fontWeight:700,color:T.red,fontFamily:T.mono}}>{netCalc.totalLifecycle.toLocaleString()} t</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Net Removal</div><div style={{fontSize:20,fontWeight:700,color:netCalc.netRemoval>0?T.green:T.red,fontFamily:T.mono}}>{netCalc.netRemoval.toLocaleString()} t</div></Card>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:16}}>
                <Card><div style={{fontSize:10,color:T.textMut}}>Energy Em</div><div style={{fontSize:14,fontWeight:700,fontFamily:T.mono}}>{netCalc.energyEmissions} t</div></Card>
                <Card><div style={{fontSize:10,color:T.textMut}}>Sorbent Em</div><div style={{fontSize:14,fontWeight:700,fontFamily:T.mono}}>{netCalc.sorbentEmissions} t</div></Card>
                <Card><div style={{fontSize:10,color:T.textMut}}>Construct Em</div><div style={{fontSize:14,fontWeight:700,fontFamily:T.mono}}>{netCalc.constructionEmissions} t</div></Card>
                <Card><div style={{fontSize:10,color:T.textMut}}>Transport Em</div><div style={{fontSize:14,fontWeight:700,fontFamily:T.mono}}>{netCalc.transportEmissions} t</div></Card>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <Card><div style={{fontSize:11,color:T.textSec}}>Capture Efficiency</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>{netCalc.captureEfficiency}%</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Cost per Net tCO2</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>${netCalc.costPerNetTonne}</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Total Annual Cost</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>${(netCalc.totalCost/1e6).toFixed(2)}M</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Perm. Adjustment</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono,color:netCalc.permAdj>0?T.amber:T.green}}>{(netCalc.permAdj*100).toFixed(0)}%</div></Card>
              </div>
            </Section>

            <Section title="Lifecycle Emissions Breakdown">
              <div style={{display:'flex',justifyContent:'center'}}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart><Pie data={lcBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,value})=>`${name}: ${value}t`} labelLine={false} style={{fontSize:10}}>{lcBreakdown.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Pie><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/></PieChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>
        </div>
      </>}

      {/* ── Tab 2: Permanence Tier Assessment ── */}
      {tab===2&&<>
        <Section title="Permanence Tier Assessment" sub="Evaluate storage security and assign permanence-adjusted credits">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16}}>
            {PERM_TIERS.map((t,i)=>{
              const count=facilities.filter(f=>f.permanence===t.name).length;
              const stored=facilities.filter(f=>f.permanence===t.name).reduce((a,f)=>a+f.co2_stored,0);
              const adjStored=stored*(1-t.adj);
              return <Card key={i} style={{borderTop:`4px solid ${t.color==='green'?T.green:t.color==='amber'?T.amber:T.red}`}}>
                <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:4}}>{t.name}</div>
                <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>{t.desc}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div><div style={{fontSize:10,color:T.textMut}}>Facilities</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>{count}</div></div>
                  <div><div style={{fontSize:10,color:T.textMut}}>Raw Stored</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>{(stored/1000).toFixed(1)}K t</div></div>
                  <div><div style={{fontSize:10,color:T.textMut}}>Adjustment</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono,color:t.adj===0?T.green:T.amber}}>-{(t.adj*100).toFixed(0)}%</div></div>
                  <div><div style={{fontSize:10,color:T.textMut}}>Adjusted</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono,color:T.green}}>{(adjStored/1000).toFixed(1)}K t</div></div>
                </div>
              </Card>;
            })}
          </div>
        </Section>

        <Section title="Permanence Risk Matrix">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr>{['Risk Factor','Premium (Geological)','Standard (Mineral)','Basic (Other)'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>{[
                ['Reversal Risk','<0.01%/yr','0.01-0.1%/yr','0.1-1%/yr'],
                ['Monitoring Required','Seismic + pressure','Periodic sampling','Continuous'],
                ['Insurance Req','Standard','Enhanced','Full coverage'],
                ['Buffer Pool','3%','5%','15%'],
                ['Min Duration','1000+ years','100-999 years','10-99 years'],
                ['Verification','Annual geophys','Semi-annual chem','Quarterly field'],
                ['Credit Discount','0%','10%','30%']
              ].map((r,i)=><tr key={i}><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontWeight:600}}>{r[0]}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r[1]}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r[2]}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r[3]}</td></tr>)}</tbody>
            </table>
          </div>
        </Section>
      </>}

      {/* ── Tab 3: Energy & Cost Model ── */}
      {tab===3&&<>
        <Section title="Energy Sensitivity Analysis" sub="Net removal under varying energy intensity and source">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={energySensitivity}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="kwh" tick={{fontSize:10}} stroke={T.textMut} label={{value:'Energy Intensity (kWh/tCO2)',position:'bottom',fontSize:11}}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Line type="monotone" dataKey="Renewable" stroke={T.green} strokeWidth={2.5} name="Renewable"/><Line type="monotone" dataKey="Grid Mix" stroke={T.amber} strokeWidth={2} name="Grid Mix"/><Line type="monotone" dataKey="Natural Gas" stroke={T.red} strokeWidth={2} name="Natural Gas"/></LineChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Cost Learning Curve 2024-2050" sub="Projected LCOD decline for solid sorbent vs liquid solvent DAC">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={learningCurve}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut} label={{value:'$/tCO2',angle:-90,position:'insideLeft',fontSize:11}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Area type="monotone" dataKey="solid" stroke={T.navy} fill={T.navyL} fillOpacity={0.2} name="Solid Sorbent $/t"/><Area type="monotone" dataKey="liquid" stroke={T.sage} fill={T.sageL} fillOpacity={0.2} name="Liquid Solvent $/t"/></AreaChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Capacity Deployment Projection">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={learningCurve.filter((_,i)=>i%3===0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Bar dataKey="capacity" name="Cumulative Capacity (ktCO2)" fill={T.gold}/></BarChart>
          </ResponsiveContainer>
        </Section>
      </>}

      {/* ── Tab 4: Facility Design ── */}
      {tab===4&&<>
        <Section title="Facility Design Parameters" sub="Configure modular DAC facility layout and performance">
          <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16}}>
            <div>
              <DualInput label="Design Capacity" value={designCapacity} onChange={setDesignCapacity} min={5000} max={500000} step={5000} unit="tCO2/yr"/>
              <DualInput label="Number of Modules" value={designModules} onChange={setDesignModules} min={2} max={50} step={1} unit="modules"/>
              <DualInput label="Land Area" value={designLand} onChange={setDesignLand} min={1} max={100} step={1} unit="hectares"/>

              <Card style={{marginTop:12}}>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Design Summary</div>
                <div style={{fontSize:12,lineHeight:1.8}}>
                  <div>Capacity/Module: <strong style={{fontFamily:T.mono}}>{facilityDesign.capPerModule.toLocaleString()} tCO2</strong></div>
                  <div>Energy Required: <strong style={{fontFamily:T.mono}}>{(facilityDesign.energyReq/1e6).toFixed(1)} GWh/yr</strong></div>
                  <div>Water Required: <strong style={{fontFamily:T.mono}}>{(facilityDesign.waterReq/1000).toFixed(0)}K m3/yr</strong></div>
                  <div>Annual Cost: <strong style={{fontFamily:T.mono}}>${(facilityDesign.annualCost/1e6).toFixed(1)}M</strong></div>
                  <div>Land/Module: <strong style={{fontFamily:T.mono}}>{facilityDesign.landPerModule} ha</strong></div>
                </div>
              </Card>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>Module Status</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8}}>
                {facilityDesign.modules.map(m=><Card key={m.id} style={{padding:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:700}}>M-{m.id}</span>
                    <Badge text={m.status} color={m.status==='Online'?'green':'gray'}/>
                  </div>
                  <div style={{fontSize:11,color:T.textSec}}>Cap: {m.capacity.toLocaleString()}t</div>
                  <div style={{fontSize:11,color:T.textSec}}>Util: {m.utilization}%</div>
                  <div style={{height:4,background:T.border,borderRadius:2,marginTop:4}}><div style={{width:`${m.utilization}%`,height:'100%',background:+m.utilization>80?T.green:+m.utilization>50?T.amber:T.red,borderRadius:2}}/></div>
                </Card>)}
              </div>
            </div>
          </div>
        </Section>
      </>}

      {/* ── Tab 5: Lifecycle Assessment ── */}
      {tab===5&&<>
        <Section title="Full Lifecycle Assessment" sub="Cradle-to-grave emissions waterfall from gross capture to net removal">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={lcaWaterfall}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="stage" tick={{fontSize:10}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Bar dataKey="value" name="tCO2">{lcaWaterfall.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </Section>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Section title="Impact Categories">
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr>{['Category','Value','Unit','Rating'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
                <tbody>{[
                  ['GWP (net)',`${netCalc.netRemoval}`,'tCO2e','green'],
                  ['Energy Demand',`${(grossCapture*energyIntensity/1e6).toFixed(1)}`,'GWh','amber'],
                  ['Water Consumption',`${(grossCapture*1.5/1000).toFixed(0)}`,'ML','amber'],
                  ['Land Use',`${(grossCapture*0.5/1e3).toFixed(1)}`,'ha','green'],
                  ['Waste Sorbent',`${(grossCapture*0.002).toFixed(0)}`,'tonnes','gray'],
                  ['Air Quality Impact','Negligible','--','green'],
                  ['Noise',`${55+Math.floor(sr(99)*15)}`,'dBA','amber'],
                  ['Biodiversity','Low impact','--','green']
                ].map((r,i)=><tr key={i}><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontWeight:600}}>{r[0]}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r[1]}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`}}>{r[2]}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`}}><Badge text={r[3]==='green'?'Low':r[3]==='amber'?'Medium':'Neutral'} color={r[3]}/></td></tr>)}</tbody>
              </table>
            </div>
          </Section>
          <Section title="Comparative LCA (per tCO2 removed)">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={[
                {metric:'Energy',dac:+(energyIntensity/25).toFixed(0),erw:15,beccs:35,biochar:20},
                {metric:'Water',dac:30,erw:10,beccs:60,biochar:15},
                {metric:'Land',dac:5,erw:40,beccs:70,biochar:50},
                {metric:'Cost',dac:80,erw:20,beccs:45,biochar:30},
                {metric:'Permanence',dac:95,erw:60,beccs:80,biochar:50},
                {metric:'Scalability',dac:70,erw:80,beccs:50,biochar:40}
              ]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="metric" tick={{fontSize:10,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:8}} domain={[0,100]}/><Radar dataKey="dac" stroke={T.navy} fill={T.navyL} fillOpacity={0.3} name="DAC"/><Radar dataKey="erw" stroke={T.sage} fill={T.sageL} fillOpacity={0.15} name="ERW"/><Radar dataKey="beccs" stroke={T.gold} fill={T.goldL} fillOpacity={0.15} name="BECCS"/><Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/></RadarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      </>}
    </div>
  );
}
