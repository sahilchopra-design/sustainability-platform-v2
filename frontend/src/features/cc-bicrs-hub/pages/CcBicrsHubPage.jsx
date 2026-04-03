import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,PieChart,Pie,Cell} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── inline primitives ── */
const TabBar=({tabs,active,onSet})=><div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0,overflowX:'auto'}}>{tabs.map((t,i)=><button key={i} onClick={()=>onSet(i)} style={{padding:'10px 18px',border:'none',borderBottom:i===active?`3px solid ${T.navy}`:'3px solid transparent',background:i===active?T.surface:'transparent',color:i===active?T.navy:T.textSec,fontWeight:i===active?700:500,fontSize:13,fontFamily:T.font,cursor:'pointer',borderRadius:'8px 8px 0 0',transition:'all 0.2s',whiteSpace:'nowrap'}}>{t}</button>)}</div>;
const Kpi=({label,value,sub})=><div style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16,textAlign:'center'}}><div style={{fontSize:20,fontWeight:700,color:T.navy,margin:'4px 0',fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut,marginTop:2}}>{sub}</div>}</div>;
const Section=({title,sub,children})=><div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:16}}>{title&&<div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:sub?2:12}}>{title}</div>}{sub&&<div style={{fontSize:12,color:T.textSec,marginBottom:12}}>{sub}</div>}{children}</div>;
const Card=({children,style})=><div style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16,...style}}>{children}</div>;
const Badge=({text,color})=>{const c={green:{bg:'#dcfce7',fg:T.green},amber:{bg:'#fef3c7',fg:T.amber},red:{bg:'#fee2e2',fg:T.red},blue:{bg:'#dbeafe',fg:T.navyL},gray:{bg:'#f3f4f6',fg:T.textSec},teal:{bg:'#ccfbf1',fg:'#0d9488'},purple:{bg:'#ede9fe',fg:'#7c3aed'}}[color]||{bg:'#f3f4f6',fg:T.textSec};return <span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,fontFamily:T.font,background:c.bg,color:c.fg}}>{text}</span>};
const DualInput=({label,value,onChange,min=0,max=100,step=1,unit})=><div style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>{label}{unit&&<span style={{fontWeight:400,color:T.textMut}}> ({unit})</span>}</div><div style={{display:'flex',gap:8,alignItems:'center'}}><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} style={{flex:1,accentColor:T.navy}}/><input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Math.min(max,Math.max(min,+e.target.value)))} style={{width:72,padding:'4px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,textAlign:'right',color:T.text}}/></div></div>;

/* ── data constants ── */
const FEEDSTOCKS=['Forestry Residues','Agricultural Waste','Dedicated Energy Crops','Municipal Biomass','Algae','Sawmill Waste','Rice Husks','Sugarcane Bagasse'];
const PERM_TIERS=[{name:'Premium',adj:0,yrs:'1000+',color:'green'},{name:'Standard',adj:0.10,yrs:'100-999',color:'amber'},{name:'Basic',adj:0.30,yrs:'10-99',color:'red'}];
const CDR_METHODS=['DAC','ERW','BiCRS','Biochar','OAE'];

/* BiCRS projects */
const genBicrsProjects=()=>Array.from({length:8},(_,i)=>{
  const s=sr(i*7);return{id:i+1,
    name:['Charm Industrial OR','Carbofex Finland','Pacific Biochar CA','Stockholm Exergi','Drax BECCS UK','Carbon Lockdown TX','BioSequester QLD','Green Carbon NZ'][i],
    feedstock:FEEDSTOCKS[Math.floor(s*FEEDSTOCKS.length)],
    biomass_input:Math.floor(sr(i*11)*80000)+5000,
    carbon_content:+(sr(i*13)*15+40).toFixed(1),
    injection_vol:Math.floor(sr(i*17)*40000)+2000,
    leakage_rate:+(sr(i*19)*0.09+0.01).toFixed(3),
    permanence:PERM_TIERS[Math.floor(sr(i*23)*3)].name,
    lifecycle_pct:+(sr(i*29)*15+5).toFixed(1),
    status:sr(i*31)<0.5?'Operational':sr(i*31)<0.8?'Commissioning':'Planned',
    cost_per_tCO2:Math.floor(sr(i*37)*150)+80,
    location:['Oregon','Finland','California','Sweden','UK','Texas','Queensland','New Zealand'][i],
    start_year:2023+Math.floor(sr(i*41)*4),
    verified_tCO2:Math.floor(sr(i*43)*30000)+500
  };
});

/* BECCS projects */
const genBeccsProjects=()=>Array.from({length:4},(_,i)=>({id:i+1,
  name:['Drax Power BECCS','Stockholm CHP CCS','Mikawa BECCS JP','Illinois Basin BECCS'][i],
  capacity_mw:Math.floor(sr(i*51)*400)+100,
  capture_rate:+(sr(i*53)*15+80).toFixed(1),
  biomass_input:Math.floor(sr(i*57)*200000)+50000,
  energy_output_mwh:Math.floor(sr(i*59)*2000000)+500000,
  co2_captured:Math.floor(sr(i*61)*500000)+100000,
  energy_credit:Math.floor(sr(i*67)*100000)+20000,
  net_removal:Math.floor(sr(i*71)*400000)+80000,
  cost:Math.floor(sr(i*73)*120)+80,
  status:sr(i*79)<0.5?'Operational':'Construction'
}));

export default function CcBicrsHubPage(){
  const [tab,setTab]=useState(0);
  const tabs=['BiCRS Calculator','BECCS Pathway','Biomass Sustainability','CDR Technology Comparison','CDR Portfolio Builder','Hub Dashboard'];

  /* BiCRS inputs */
  const [feedstock,setFeedstock]=useState(FEEDSTOCKS[0]);
  const [biomassInput,setBiomassInput]=useState(10000);
  const [carbonContent,setCarbonContent]=useState(48);
  const [injectionVol,setInjectionVol]=useState(5000);
  const [leakageRate,setLeakageRate]=useState(0.03);
  const [permTier,setPermTier]=useState(0);
  const [lifecyclePct,setLifecyclePct]=useState(10);

  /* portfolio builder */
  const [budgetM,setBudgetM]=useState(50);
  const [allocDAC,setAllocDAC]=useState(25);
  const [allocERW,setAllocERW]=useState(25);
  const [allocBiCRS,setAllocBiCRS]=useState(20);
  const [allocBiochar,setAllocBiochar]=useState(15);
  const [allocOAE,setAllocOAE]=useState(15);

  const bicrsProjects=useMemo(()=>genBicrsProjects(),[]);
  const beccsProjects=useMemo(()=>genBeccsProjects(),[]);

  /* BiCRS calc */
  const bicrsCalc=useMemo(()=>{
    const biomassC=biomassInput*(carbonContent/100);
    const cInjected=Math.min(injectionVol,biomassC);
    const cStored=cInjected*(1-leakageRate);
    const co2Equiv=cStored*(44/12);
    const permAdj=PERM_TIERS[permTier].adj;
    const uncertaintyAdj=0.05;
    const lifecycleEm=co2Equiv*(lifecyclePct/100);
    const finalRemoval=co2Equiv*(1-permAdj)*(1-uncertaintyAdj)-lifecycleEm;
    return{biomassC:+biomassC.toFixed(1),cInjected:+cInjected.toFixed(1),cStored:+cStored.toFixed(1),co2Equiv:+co2Equiv.toFixed(1),permAdj,lifecycleEm:+lifecycleEm.toFixed(1),finalRemoval:+finalRemoval.toFixed(1),conversionEff:biomassInput>0?(cStored/biomassInput*100).toFixed(1):'0'};
  },[biomassInput,carbonContent,injectionVol,leakageRate,permTier,lifecyclePct]);

  /* BECCS summary */
  const beccsSummary=useMemo(()=>{
    const totalCap=beccsProjects.reduce((a,p)=>a+p.co2_captured,0);
    const totalEnergy=beccsProjects.reduce((a,p)=>a+p.energy_output_mwh,0);
    const totalNet=beccsProjects.reduce((a,p)=>a+p.net_removal,0);
    return{totalCap,totalEnergy,totalNet,avgCost:(beccsProjects.reduce((a,p)=>a+p.cost,0)/beccsProjects.length).toFixed(0)};
  },[beccsProjects]);

  /* CDR comparison radar */
  const cdrRadar=useMemo(()=>[
    {metric:'Cost Efficiency',DAC:25,ERW:70,BiCRS:55,Biochar:65,OAE:50},
    {metric:'Permanence',DAC:95,ERW:60,BiCRS:80,Biochar:50,OAE:55},
    {metric:'Scalability',DAC:70,ERW:85,BiCRS:60,Biochar:45,OAE:75},
    {metric:'Co-benefits',DAC:15,ERW:80,BiCRS:50,Biochar:90,OAE:40},
    {metric:'MRV Maturity',DAC:85,ERW:55,BiCRS:65,Biochar:50,OAE:35},
    {metric:'TRL',DAC:7,ERW:6,BiCRS:5,Biochar:7,OAE:4}
  ].map(r=>({...r,TRL_scaled:undefined,DAC:r.metric==='TRL'?r.DAC*10:r.DAC,ERW:r.metric==='TRL'?r.ERW*10:r.ERW,BiCRS:r.metric==='TRL'?r.BiCRS*10:r.BiCRS,Biochar:r.metric==='TRL'?r.Biochar*10:r.Biochar,OAE:r.metric==='TRL'?r.OAE*10:r.OAE})),[]);

  /* CDR comparison table */
  const cdrTable=useMemo(()=>[
    {method:'DAC',cost:'$250-600/t',permanence:'1000+ yr',scalability:'High',trl:7,cobenefits:'None',maturity:'Commercial'},
    {method:'ERW',cost:'$50-200/t',permanence:'1000+ yr (geological)',scalability:'Very High',trl:6,cobenefits:'Soil health, crop yield',maturity:'Pilot'},
    {method:'BiCRS',cost:'$100-300/t',permanence:'100-1000+ yr',scalability:'Medium',trl:5,cobenefits:'Energy, waste mgmt',maturity:'Demonstration'},
    {method:'Biochar',cost:'$30-120/t',permanence:'100-1000 yr',scalability:'Medium',trl:7,cobenefits:'Soil carbon, fertility',maturity:'Commercial'},
    {method:'OAE',cost:'$50-300/t',permanence:'10,000+ yr',scalability:'High',trl:4,cobenefits:'Ocean alkalinity',maturity:'R&D'}
  ],[]);

  /* portfolio calc */
  const portfolio=useMemo(()=>{
    const totalAlloc=allocDAC+allocERW+allocBiCRS+allocBiochar+allocOAE;
    const norm=totalAlloc>0?100/totalAlloc:0;
    const methods=[
      {name:'DAC',alloc:allocDAC*norm/100,costPerT:450,permanence:95,color:T.navy},
      {name:'ERW',alloc:allocERW*norm/100,costPerT:120,permanence:60,color:T.sage},
      {name:'BiCRS',alloc:allocBiCRS*norm/100,costPerT:200,permanence:80,color:T.gold},
      {name:'Biochar',alloc:allocBiochar*norm/100,costPerT:75,permanence:55,color:T.amber},
      {name:'OAE',alloc:allocOAE*norm/100,costPerT:180,permanence:70,color:T.navyL}
    ];
    const budgetUsd=budgetM*1e6;
    let totalTonnes=0;let weightedPerm=0;let weightedCost=0;
    const detail=methods.map(m=>{
      const spend=budgetUsd*m.alloc;
      const tonnes=m.costPerT>0?spend/m.costPerT:0;
      totalTonnes+=tonnes;
      weightedPerm+=m.permanence*m.alloc;
      weightedCost+=m.costPerT*m.alloc;
      return{...m,spend:+spend.toFixed(0),tonnes:+tonnes.toFixed(0),pct:+(m.alloc*100).toFixed(1)};
    });
    return{detail,totalTonnes:+totalTonnes.toFixed(0),weightedPerm:+weightedPerm.toFixed(0),weightedCost:+weightedCost.toFixed(0),budgetUsd};
  },[budgetM,allocDAC,allocERW,allocBiCRS,allocBiochar,allocOAE]);

  /* biomass sustainability data */
  const biomassSustainability=useMemo(()=>FEEDSTOCKS.map((f,i)=>({
    name:f,
    availability:+(sr(i*201)*80+20).toFixed(0),
    carbonIntensity:+(sr(i*203)*15+5).toFixed(1),
    landUse:+(sr(i*207)*8+0.5).toFixed(1),
    waterUse:+(sr(i*209)*300+50).toFixed(0),
    sustainability:sr(i*211)<0.4?'High':sr(i*211)<0.75?'Medium':'Low',
    competing:sr(i*213)<0.3?'Food':'Non-food',
    ghgSaving:+(sr(i*217)*60+30).toFixed(0),
    cost:Math.floor(sr(i*219)*80)+20
  })),[]);

  /* hub dashboard aggregates */
  const hubStats=useMemo(()=>{
    const totalBicrs=bicrsProjects.reduce((a,p)=>a+p.verified_tCO2,0);
    const totalBeccs=beccsProjects.reduce((a,p)=>a+p.net_removal,0);
    const avgBicrsCost=(bicrsProjects.reduce((a,p)=>a+p.cost_per_tCO2,0)/bicrsProjects.length).toFixed(0);
    const opBicrs=bicrsProjects.filter(p=>p.status==='Operational').length;
    const opBeccs=beccsProjects.filter(p=>p.status==='Operational').length;
    return{totalBicrs,totalBeccs,avgBicrsCost,opBicrs,opBeccs,totalCDR:totalBicrs+totalBeccs};
  },[bicrsProjects,beccsProjects]);

  /* hub timeline */
  const hubTimeline=useMemo(()=>Array.from({length:12},(_,m)=>({
    month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],
    bicrs:+(sr(m*301)*3000+1000).toFixed(0),
    beccs:+(sr(m*303)*8000+3000).toFixed(0),
    biochar:+(sr(m*307)*2000+500).toFixed(0),
    dac:+(sr(m*309)*1500+200).toFixed(0)
  })),[]);

  const kpis=useMemo(()=>[
    {label:'BiCRS Final Removal',value:`${bicrsCalc.finalRemoval.toLocaleString()} t`},
    {label:'BiCRS Projects',value:bicrsProjects.length},
    {label:'BECCS Net Removal',value:`${(beccsSummary.totalNet/1000).toFixed(0)}K t`},
    {label:'BECCS Avg Cost',value:`$${beccsSummary.avgCost}/t`},
    {label:'Portfolio tCO2',value:`${portfolio.totalTonnes.toLocaleString()} t`},
    {label:'Wtd Permanence',value:`${portfolio.weightedPerm} /100`},
    {label:'Total CDR Hub',value:`${(hubStats.totalCDR/1000).toFixed(0)}K t`},
    {label:'Operational Sites',value:hubStats.opBicrs+hubStats.opBeccs}
  ],[bicrsCalc,bicrsProjects,beccsSummary,portfolio,hubStats]);

  const COLORS=[T.navy,T.sage,T.gold,T.amber,T.navyL,T.red,T.sageL,T.goldL];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>BiCRS & Biomass CDR Hub</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>EP-BU3 -- Biomass carbon removal and storage, BECCS pathways, and cross-CDR portfolio intelligence</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10,marginBottom:20}}>
        {kpis.map((k,i)=><Kpi key={i} {...k}/>)}
      </div>

      <TabBar tabs={tabs} active={tab} onSet={setTab}/>

      {/* ── Tab 0: BiCRS Calculator ── */}
      {tab===0&&<>
        <div style={{display:'grid',gridTemplateColumns:'360px 1fr',gap:16}}>
          <Section title="BiCRS Input Parameters">
            <div style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>Feedstock Type</div><select value={feedstock} onChange={e=>setFeedstock(e.target.value)} style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>{FEEDSTOCKS.map(f=><option key={f}>{f}</option>)}</select></div>
            <DualInput label="Biomass Input" value={biomassInput} onChange={setBiomassInput} min={100} max={100000} step={500} unit="tonnes"/>
            <DualInput label="Carbon Content" value={carbonContent} onChange={setCarbonContent} min={40} max={55} step={0.5} unit="%"/>
            <DualInput label="Injection Volume" value={injectionVol} onChange={setInjectionVol} min={100} max={50000} step={500} unit="tC"/>
            <DualInput label="Leakage Rate" value={leakageRate} onChange={setLeakageRate} min={0.01} max={0.10} step={0.005} unit="fraction"/>
            <div style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>Permanence Tier</div><select value={permTier} onChange={e=>setPermTier(+e.target.value)} style={{width:'100%',padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>{PERM_TIERS.map((t,i)=><option key={i} value={i}>{t.name} ({t.yrs} yr)</option>)}</select></div>
            <DualInput label="Lifecycle Emissions" value={lifecyclePct} onChange={setLifecyclePct} min={3} max={25} step={0.5} unit="% of gross"/>
          </Section>
          <div>
            <Section title="BiCRS Removal Results">
              <div style={{fontFamily:T.mono,fontSize:12,background:T.surfaceH,padding:12,borderRadius:8,marginBottom:12}}>
                C_Stored = biomass_C_injected x (1 - leakage_rate)<br/>
                FINAL = C_Stored x 44/12 - Permanence_Adj - Uncertainty - Lifecycle
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
                <Card><div style={{fontSize:11,color:T.textSec}}>Biomass Carbon</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>{bicrsCalc.biomassC.toLocaleString()} tC</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Carbon Stored</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>{bicrsCalc.cStored.toLocaleString()} tC</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>CO2 Equivalent</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>{bicrsCalc.co2Equiv.toLocaleString()} t</div></Card>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <Card><div style={{fontSize:11,color:T.textSec}}>Lifecycle Em</div><div style={{fontSize:16,fontWeight:700,color:T.red,fontFamily:T.mono}}>{bicrsCalc.lifecycleEm.toLocaleString()} t</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Perm Adjustment</div><div style={{fontSize:16,fontWeight:700,fontFamily:T.mono,color:T.amber}}>{(bicrsCalc.permAdj*100).toFixed(0)}%</div></Card>
                <Card style={{borderLeft:`4px solid ${bicrsCalc.finalRemoval>0?T.green:T.red}`}}><div style={{fontSize:11,color:T.textSec}}>Final Removal</div><div style={{fontSize:20,fontWeight:700,color:bicrsCalc.finalRemoval>0?T.green:T.red,fontFamily:T.mono}}>{bicrsCalc.finalRemoval.toLocaleString()} t</div></Card>
              </div>
            </Section>

            <Section title="BiCRS Projects">
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr>{['#','Project','Feedstock','Location','Biomass t','Status','$/tCO2','Verified tCO2'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
                  <tbody>{bicrsProjects.map(p=><tr key={p.id}><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`}}>{p.id}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontWeight:600}}>{p.name}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`}}><Badge text={p.feedstock} color="blue"/></td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`}}>{p.location}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.biomass_input.toLocaleString()}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`}}><Badge text={p.status} color={p.status==='Operational'?'green':p.status==='Commissioning'?'amber':'gray'}/></td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>${p.cost_per_tCO2}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.verified_tCO2.toLocaleString()}</td></tr>)}</tbody>
                </table>
              </div>
            </Section>
          </div>
        </div>
      </>}

      {/* ── Tab 1: BECCS Pathway ── */}
      {tab===1&&<>
        <Section title="BECCS Pathway Analysis" sub="Bioenergy with Carbon Capture & Storage: combustion + capture efficiency with energy output credits">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:16}}>
            <Card><div style={{fontSize:11,color:T.textSec}}>Total CO2 Captured</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>{(beccsSummary.totalCap/1000).toFixed(0)}K t</div></Card>
            <Card><div style={{fontSize:11,color:T.textSec}}>Energy Output</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>{(beccsSummary.totalEnergy/1e6).toFixed(1)}M MWh</div></Card>
            <Card><div style={{fontSize:11,color:T.textSec}}>Net Removal</div><div style={{fontSize:18,fontWeight:700,color:T.green,fontFamily:T.mono}}>{(beccsSummary.totalNet/1000).toFixed(0)}K t</div></Card>
            <Card><div style={{fontSize:11,color:T.textSec}}>Avg Cost</div><div style={{fontSize:18,fontWeight:700,fontFamily:T.mono}}>${beccsSummary.avgCost}/t</div></Card>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr>{['#','Facility','Capacity MW','Capture Rate %','Biomass Input t','Energy MWh','CO2 Captured t','Energy Credit t','Net Removal t','$/t','Status'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>{beccsProjects.map(p=><tr key={p.id}><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`}}>{p.id}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontWeight:600}}>{p.name}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.capacity_mw}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.capture_rate}%</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.biomass_input.toLocaleString()}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.energy_output_mwh.toLocaleString()}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.co2_captured.toLocaleString()}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{p.energy_credit.toLocaleString()}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono,fontWeight:700,color:T.green}}>{p.net_removal.toLocaleString()}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>${p.cost}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`}}><Badge text={p.status} color={p.status==='Operational'?'green':'amber'}/></td></tr>)}</tbody>
            </table>
          </div>
        </Section>

        <Section title="BECCS Energy Balance">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={beccsProjects}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,angle:-15}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="co2_captured" name="CO2 Captured" fill={T.navy}/><Bar dataKey="energy_credit" name="Energy Credit" fill={T.gold}/><Bar dataKey="net_removal" name="Net Removal" fill={T.sage}/></BarChart>
          </ResponsiveContainer>
        </Section>
      </>}

      {/* ── Tab 2: Biomass Sustainability ── */}
      {tab===2&&<>
        <Section title="Biomass Sustainability Assessment" sub="Feedstock-level sustainability scoring across land, water, carbon, and food competition">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr>{['Feedstock','Availability Mt/yr','C Intensity kgCO2/t','Land Use ha/t','Water Use L/t','Sustainability','Competing Use','GHG Saving %','Cost $/t'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>{biomassSustainability.map((b,i)=><tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontWeight:600}}>{b.name}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{b.availability}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{b.carbonIntensity}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{b.landUse}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{b.waterUse}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={b.sustainability} color={b.sustainability==='High'?'green':b.sustainability==='Medium'?'amber':'red'}/></td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={b.competing} color={b.competing==='Food'?'red':'green'}/></td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{b.ghgSaving}%</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>${b.cost}</td></tr>)}</tbody>
            </table>
          </div>
        </Section>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Section title="GHG Saving by Feedstock">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={biomassSustainability} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10}} stroke={T.textMut} domain={[0,100]}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={120} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Bar dataKey="ghgSaving" name="GHG Saving %" fill={T.sage}>{biomassSustainability.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Land vs Water Intensity">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={biomassSustainability}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,angle:-20}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="landUse" name="Land Use ha/t" fill={T.gold}/><Bar dataKey="waterUse" name="Water Use L/t" fill={T.navyL}/></BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      </>}

      {/* ── Tab 3: CDR Technology Comparison ── */}
      {tab===3&&<>
        <Section title="CDR Technology Comparison" sub="Radar comparison: DAC vs ERW vs BiCRS vs Biochar vs OAE">
          <div style={{display:'flex',justifyContent:'center'}}>
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={cdrRadar}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="metric" tick={{fontSize:11,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:8}} domain={[0,100]}/><Radar dataKey="DAC" stroke={T.navy} fill={T.navyL} fillOpacity={0.2} name="DAC"/><Radar dataKey="ERW" stroke={T.sage} fill={T.sageL} fillOpacity={0.15} name="ERW"/><Radar dataKey="BiCRS" stroke={T.gold} fill={T.goldL} fillOpacity={0.15} name="BiCRS"/><Radar dataKey="Biochar" stroke={T.amber} fill="#fef3c7" fillOpacity={0.15} name="Biochar"/><Radar dataKey="OAE" stroke={T.navyL} fill="#dbeafe" fillOpacity={0.1} name="OAE"/><Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/></RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="CDR Method Comparison Table">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr>{['Method','Cost Range','Permanence','Scalability','TRL','Co-benefits','Maturity'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>{cdrTable.map((r,i)=><tr key={i}><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontWeight:700}}>{r.method}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.cost}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}>{r.permanence}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={r.scalability} color={r.scalability==='Very High'||r.scalability==='High'?'green':'amber'}/></td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{r.trl}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontSize:11}}>{r.cobenefits}</td><td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`}}><Badge text={r.maturity} color={r.maturity==='Commercial'?'green':r.maturity==='Pilot'?'amber':r.maturity==='Demonstration'?'blue':'gray'}/></td></tr>)}</tbody>
            </table>
          </div>
        </Section>
      </>}

      {/* ── Tab 4: CDR Portfolio Builder ── */}
      {tab===4&&<>
        <Section title="CDR Portfolio Builder" sub="Interactive allocation across CDR methods with budget constraint and outcome analytics">
          <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:16}}>
            <div>
              <DualInput label="Total Budget" value={budgetM} onChange={setBudgetM} min={1} max={500} step={1} unit="$M"/>
              <div style={{borderTop:`1px solid ${T.border}`,paddingTop:10,marginTop:6}}>
                <DualInput label="DAC Allocation" value={allocDAC} onChange={setAllocDAC} min={0} max={100} step={1} unit="%"/>
                <DualInput label="ERW Allocation" value={allocERW} onChange={setAllocERW} min={0} max={100} step={1} unit="%"/>
                <DualInput label="BiCRS Allocation" value={allocBiCRS} onChange={setAllocBiCRS} min={0} max={100} step={1} unit="%"/>
                <DualInput label="Biochar Allocation" value={allocBiochar} onChange={setAllocBiochar} min={0} max={100} step={1} unit="%"/>
                <DualInput label="OAE Allocation" value={allocOAE} onChange={setAllocOAE} min={0} max={100} step={1} unit="%"/>
              </div>
              <div style={{fontSize:11,color:(allocDAC+allocERW+allocBiCRS+allocBiochar+allocOAE)!==100?T.amber:T.green,marginTop:4,fontWeight:600}}>
                Total: {allocDAC+allocERW+allocBiCRS+allocBiochar+allocOAE}% {(allocDAC+allocERW+allocBiCRS+allocBiochar+allocOAE)!==100?'(will normalize)':''}
              </div>
            </div>
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
                <Card style={{borderTop:`4px solid ${T.green}`}}><div style={{fontSize:11,color:T.textSec}}>Total tCO2 Removed</div><div style={{fontSize:22,fontWeight:700,color:T.green,fontFamily:T.mono}}>{portfolio.totalTonnes.toLocaleString()}</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Wtd Permanence</div><div style={{fontSize:22,fontWeight:700,fontFamily:T.mono}}>{portfolio.weightedPerm}/100</div></Card>
                <Card><div style={{fontSize:11,color:T.textSec}}>Wtd Cost/tCO2</div><div style={{fontSize:22,fontWeight:700,fontFamily:T.mono}}>${portfolio.weightedCost}</div></Card>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>Allocation Breakdown</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={portfolio.detail.filter(d=>d.pct>0)} dataKey="tonnes" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,pct})=>`${name} ${pct}%`} style={{fontSize:10}}>{portfolio.detail.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/></PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>Removal by Method</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={portfolio.detail.filter(d=>d.pct>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Bar dataKey="tonnes" name="tCO2 Removed">{portfolio.detail.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{overflowX:'auto',marginTop:12}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr>{['Method','Allocation %','Spend $','Cost $/tCO2','tCO2 Removed','Permanence'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'right',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
                  <tbody>{portfolio.detail.map((d,i)=><tr key={i}><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontWeight:600}}>{d.name}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontFamily:T.mono}}>{d.pct}%</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontFamily:T.mono}}>${(d.spend/1e6).toFixed(1)}M</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontFamily:T.mono}}>${d.costPerT}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontFamily:T.mono,fontWeight:700}}>{d.tonnes.toLocaleString()}</td><td style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,textAlign:'right',fontFamily:T.mono}}>{d.permanence}/100</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>
        </Section>
      </>}

      {/* ── Tab 5: Hub Dashboard ── */}
      {tab===5&&<>
        <Section title="CDR Hub Dashboard" sub="Aggregate view across all CDR pathways: BiCRS, BECCS, DAC, ERW, Biochar">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10,marginBottom:16}}>
            <Card><div style={{fontSize:11,color:T.textSec}}>Total CDR Verified</div><div style={{fontSize:22,fontWeight:700,color:T.green,fontFamily:T.mono}}>{(hubStats.totalCDR/1000).toFixed(0)}K tCO2</div></Card>
            <Card><div style={{fontSize:11,color:T.textSec}}>BiCRS Verified</div><div style={{fontSize:22,fontWeight:700,fontFamily:T.mono}}>{(hubStats.totalBicrs/1000).toFixed(0)}K t</div></Card>
            <Card><div style={{fontSize:11,color:T.textSec}}>BECCS Net Removal</div><div style={{fontSize:22,fontWeight:700,fontFamily:T.mono}}>{(hubStats.totalBeccs/1000).toFixed(0)}K t</div></Card>
            <Card><div style={{fontSize:11,color:T.textSec}}>Operational Sites</div><div style={{fontSize:22,fontWeight:700,fontFamily:T.mono}}>{hubStats.opBicrs+hubStats.opBeccs}</div></Card>
            <Card><div style={{fontSize:11,color:T.textSec}}>Avg BiCRS Cost</div><div style={{fontSize:22,fontWeight:700,fontFamily:T.mono}}>${hubStats.avgBicrsCost}/t</div></Card>
            <Card><div style={{fontSize:11,color:T.textSec}}>BECCS Avg Cost</div><div style={{fontSize:22,fontWeight:700,fontFamily:T.mono}}>${beccsSummary.avgCost}/t</div></Card>
          </div>
        </Section>

        <Section title="Monthly CDR Delivery by Pathway">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hubTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10}} stroke={T.textMut}/><YAxis tick={{fontSize:10}} stroke={T.textMut}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/><Legend wrapperStyle={{fontSize:11}}/><Area type="monotone" dataKey="beccs" stackId="1" stroke={T.navy} fill={T.navyL} fillOpacity={0.6} name="BECCS"/><Area type="monotone" dataKey="bicrs" stackId="1" stroke={T.gold} fill={T.goldL} fillOpacity={0.6} name="BiCRS"/><Area type="monotone" dataKey="biochar" stackId="1" stroke={T.sage} fill={T.sageL} fillOpacity={0.6} name="Biochar"/><Area type="monotone" dataKey="dac" stackId="1" stroke={T.amber} fill="#fef3c7" fillOpacity={0.6} name="DAC"/></AreaChart>
          </ResponsiveContainer>
        </Section>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Section title="CDR Method Mix">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart><Pie data={[{name:'BiCRS',value:hubStats.totalBicrs},{name:'BECCS',value:hubStats.totalBeccs},{name:'DAC (est)',value:Math.floor(sr(801)*15000+5000)},{name:'ERW (est)',value:Math.floor(sr(803)*20000+8000)},{name:'Biochar (est)',value:Math.floor(sr(807)*10000+3000)}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} style={{fontSize:10}}>{COLORS.map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip contentStyle={{fontSize:11,fontFamily:T.font,borderRadius:8,border:`1px solid ${T.border}`}}/></PieChart>
            </ResponsiveContainer>
          </Section>
          <Section title="All BiCRS + BECCS Projects">
            <div style={{maxHeight:280,overflowY:'auto'}}>
              {[...bicrsProjects.map(p=>({...p,type:'BiCRS'})),...beccsProjects.map(p=>({...p,type:'BECCS',verified_tCO2:p.net_removal,cost_per_tCO2:p.cost}))].map((p,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                <div><div style={{fontSize:12,fontWeight:600}}>{p.name}</div><div style={{fontSize:10,color:T.textMut}}>{p.type} | {p.location||'--'}</div></div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{fontFamily:T.mono,fontSize:12}}>{p.verified_tCO2.toLocaleString()} t</span><Badge text={p.status} color={p.status==='Operational'?'green':p.status==='Commissioning'||p.status==='Construction'?'amber':'gray'}/></div>
              </div>)}
            </div>
          </Section>
        </div>
      </>}
    </div>
  );
}
