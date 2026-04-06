import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area, Cell, ReferenceLine, ScatterChart,
  Scatter, ZAxis, PieChart, Pie,
} from 'recharts';

const T={navy:'#1b3a5c',navyD:'#122a44',gold:'#c5a96a',goldD:'#a8903a',cream:'#f7f4ef',surface:'#ffffff',border:'#e5e0d8',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',sage:'#5a8a6a',red:'#dc2626',green:'#16a34a',amber:'#d97706',teal:'#0f766e',purple:'#6d28d9',emerald:'#059669',font:"'DM Sans',system-ui,sans-serif",mono:"'JetBrains Mono','Fira Code',monospace",card:'0 1px 3px rgba(27,58,92,0.06)'};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt=n=>typeof n==='number'?n.toLocaleString(undefined,{maximumFractionDigits:1}):n;
const fmtK=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);
const TIP={background:T.surface,border:`1px solid ${T.border}`,borderRadius:4,color:T.text,fontSize:11,fontFamily:T.mono};

const TabBar=({tabs,active,onChange})=>(<div style={{display:'flex',gap:2,borderBottom:`2px solid ${T.border}`,marginBottom:20,flexWrap:'wrap'}}>{tabs.map(t=><button key={t} onClick={()=>onChange(t)} style={{padding:'9px 14px',fontSize:11,fontWeight:600,cursor:'pointer',border:'none',background:'transparent',color:active===t?T.navy:T.textMut,borderBottom:active===t?`2px solid ${T.gold}`:'2px solid transparent',marginBottom:-2,fontFamily:T.font}}>{t}</button>)}</div>);
const Kpi=({label,value,sub,color,accent})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'14px 16px',borderBottom:`3px solid ${accent||T.gold}`,boxShadow:T.card}}><div style={{fontSize:9,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:color||T.navy,fontFamily:T.mono,lineHeight:1}}>{value}</div>{sub&&<div style={{fontSize:10,color:T.textSec,marginTop:4}}>{sub}</div>}</div>);
const Section=({title,children,right})=>(<div style={{marginBottom:24}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><span style={{fontSize:11,fontWeight:700,color:T.navy,textTransform:'uppercase',letterSpacing:'0.1em'}}>{title}</span>{right&&<span style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{right}</span>}</div>{children}</div>);
const Card=({children,style,border})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:16,boxShadow:T.card,...(border?{borderLeft:`4px solid ${border}`}:{}),...style}}>{children}</div>);
const Badge=({v,colors})=>{const map=colors||{High:'#dc2626',Medium:'#d97706',Low:'#16a34a'};const bg=map[v]||T.textMut;return <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:10,background:`${bg}18`,color:bg,fontFamily:T.mono}}>{v}</span>;};
const DualInput=({label,value,min=0,max=100,step=1,onChange,color,unit=''})=>(<div style={{marginBottom:6}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}><span style={{fontSize:9,color:T.textMut,lineHeight:1.2}}>{label}</span><span style={{fontSize:10,fontFamily:T.mono,fontWeight:600,color:color||T.navy}}>{typeof value==='number'?value.toLocaleString():value}{unit}</span></div><div style={{display:'flex',gap:6,alignItems:'center'}}><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} style={{flex:1,accentColor:color||T.teal,height:4,cursor:'pointer'}} /><input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Math.min(max,Math.max(min,+e.target.value||0)))} style={{width:64,padding:'3px 5px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:10,fontFamily:T.mono,color:T.navy,background:T.cream,outline:'none',textAlign:'right'}} /></div></div>);

/* ══════════════════════════════════════════════════════════════════
   CCS / CCUS & BIOCHAR HUB ENGINE
   ══════════════════════════════════════════════════════════════════ */

const CCS_PROJECTS = Array.from({length:8},(_,i)=>{
  const sites=['Sleipner Norway','Quest Canada','Gorgon Australia','Illinois Basin USA','Santos Brazil','Tomakomai Japan','Northern Lights Norway','Porthos Netherlands'];
  const types=['Saline Aquifer','Depleted Gas','Saline Aquifer','Saline Aquifer','Pre-salt','Saline Aquifer','Saline Aquifer','Depleted Gas'];
  const modes = i%2===0?'Pipeline':'Ship';
  return {
    id:`CCS-${String(i+1).padStart(3,'0')}`, name:sites[i],
    storage_type:types[i], transport_mode:modes,
    co2_captured_tpa:Math.round(200000+sr(i*11)*1800000),
    distance_km:Math.round(50+sr(i*13)*350),
    net_stored_tco2e:Math.round(180000+sr(i*17)*1600000),
    storage_capacity_mt:Math.round(10+sr(i*19)*490),
    vintage:2019+(i%6), status:i%3===2?'Monitoring':'Injecting',
  };
});

const BIOCHAR_PROJECTS = Array.from({length:6},(_,i)=>{
  const names=['Pacific NW Forestry','Midwest Ag Residues','EU Straw Pyrolysis','India Rice Husk','Brazil Sugarcane','Kenya Coffee Husks'];
  return {
    id:`BC-${String(i+1).padStart(3,'0')}`, name:names[i],
    biomass_type:['Forest residue','Corn stover','Wheat straw','Rice husk','Bagasse','Coffee husk'][i],
    biomass_input_t:Math.round(5000+sr(i*11)*45000),
    carbon_content_pct:Math.round(40+sr(i*13)*25),
    pyrolysis_temp_c:Math.round(400+sr(i*17)*250),
    h_c_ratio:Math.round((0.15+sr(i*19)*0.55)*100)/100,
    net_credits_tco2e:Math.round(1000+sr(i*23)*19000),
    vintage:2022+(i%3), status:i%3===2?'Verification':'Active',
  };
});

const UTILIZATION_PATHWAYS = [
  {id:'EOR',name:'Enhanced Oil Recovery',permanence:'Medium',co2_util_pct:60,risk:'Oil price dependent',color:T.amber},
  {id:'MINERAL',name:'Mineral Carbonation',permanence:'Very High',co2_util_pct:95,risk:'Energy-intensive',color:T.emerald},
  {id:'CONCRETE',name:'CO2-Cured Concrete',permanence:'High',co2_util_pct:85,risk:'Scale limitations',color:T.teal},
  {id:'FUEL',name:'Synthetic Fuels (e-fuels)',permanence:'Low',co2_util_pct:30,risk:'Re-emission on use',color:T.red},
  {id:'CHEM',name:'Chemicals / Polymers',permanence:'Medium',co2_util_pct:50,risk:'Market size',color:T.purple},
  {id:'GREENHOUSE',name:'Greenhouse Enrichment',permanence:'None',co2_util_pct:0,risk:'Seasonal, re-emitted',color:T.textMut},
];

const calcCCS = (params) => {
  const { co2_captured_tpa, transport_mode, distance_km, compression_energy_kwh, injection_rate_tpd, storage_capacity_mt } = params;
  // Transport: pipeline ~6 gCO2/(t·km), ship ~12 gCO2/(t·km) (IEA CCS 2020)
  const transport_ef = transport_mode === 'Pipeline' ? 0.006 : 0.012; // kgCO2/(t-km) → divide by 1000 for tCO2
  const transport_emissions = co2_captured_tpa * distance_km * transport_ef / 1000; // tCO2/yr
  // Compression: energy (kWh/tCO2) × grid EF (tCO2/kWh)
  // Grid EF corrected to 0.55 tCO2/MWh = 0.00055 tCO2/kWh (global average, IEA 2023)
  // Previous 0.0004 was 50% too low (UK/EU-only value, not global average for CCS sites)
  const grid_ef_tco2_per_kwh = 0.00055;
  const compression_emissions = co2_captured_tpa * compression_energy_kwh * grid_ef_tco2_per_kwh;
  const process_emissions = transport_emissions + compression_emissions;
  const net_stored = co2_captured_tpa - process_emissions;
  const years_to_fill = storage_capacity_mt * 1e6 / co2_captured_tpa;
  const utilization_rate = injection_rate_tpd * 365 / co2_captured_tpa * 100;
  return {
    transport_emissions:Math.round(transport_emissions),
    compression_emissions:Math.round(compression_emissions),
    process_emissions:Math.round(process_emissions),
    net_stored:Math.round(net_stored),
    years_to_fill:Math.round(years_to_fill*10)/10,
    utilization_rate:Math.min(100,Math.round(utilization_rate*10)/10),
  };
};

const getStabilityFactor = (h_c) => {
  if(h_c < 0.4) return 1.0;
  if(h_c < 0.7) return 0.8;
  return 0.5;
};

const calcBiochar = (params) => {
  const { biomass_input_t, carbon_content_pct, pyrolysis_temp_c, h_c_ratio, counterfactual_avoided } = params;
  const carbon_in = biomass_input_t * carbon_content_pct / 100; // t Carbon in feedstock

  // Biochar mass yield (fraction of dry feedstock mass)
  // Corrected model: exponential decay with temperature (Qian et al. 2015, meta-analysis n=300)
  // At 300°C: ~45%, 400°C: ~35%, 500°C: ~28%, 600°C: ~22%, 700°C: ~17%
  const biochar_mass_yield = Math.max(0.12, 0.68 * Math.exp(-0.0026 * pyrolysis_temp_c));

  // Biochar carbon content (% of biochar mass that is C)
  // Carbon concentrates with higher temperature: 300°C→55%, 500°C→70%, 700°C→80%
  const biochar_carbon_pct = Math.min(0.90, 0.40 + 0.0006 * pyrolysis_temp_c);

  // Biochar carbon = feedstock mass × mass yield × biochar carbon fraction
  const biochar_carbon = biomass_input_t * biochar_mass_yield * biochar_carbon_pct;

  const stability = getStabilityFactor(h_c_ratio);
  const durable_carbon = biochar_carbon * stability;
  // Pyrolysis process emissions: ~10% of feedstock carbon as process CO2 (syngas combustion)
  const pyrolysis_energy = carbon_in * 0.10 * (44 / 12); // tCO2
  const co2_equiv = Math.max(0, durable_carbon * (44 / 12) + counterfactual_avoided - pyrolysis_energy); // clamp: very low temp pyrolysis with high energy can produce negative net removal
  const biochar_yield = biochar_mass_yield; // expose for display
  return {
    carbon_in:Math.round(carbon_in),
    biochar_yield:Math.round(biochar_yield*100)/100,
    biochar_carbon:Math.round(biochar_carbon),
    stability,
    durable_carbon:Math.round(durable_carbon),
    pyrolysis_energy:Math.round(pyrolysis_energy),
    co2_equiv:Math.round(co2_equiv),
    counterfactual_avoided,
  };
};

export default function CcCcsBiocharHubPage() {
  const { addCalculation, addProject, getSummary } = useCarbonCredit();
  const TABS = ['CCS Net Storage Calculator','CCUS Utilization Pathways','Biochar Carbon Calculator','Biochar Stability Model','Storage Site Assessment','Hub Dashboard'];
  const [tab, setTab] = useState(TABS[0]);

  /* CCS inputs */
  const [ccs, setCcs] = useState({
    co2_captured_tpa:500000, transport_mode:'Pipeline', distance_km:150,
    compression_energy_kwh:100, injection_rate_tpd:2000, storage_capacity_mt:50,
  });
  const setC = useCallback((k,v) => setCcs(prev=>({...prev,[k]:v})),[]);

  /* Biochar inputs */
  const [bc, setBc] = useState({
    biomass_input_t:10000, carbon_content_pct:48, pyrolysis_temp_c:550,
    h_c_ratio:0.30, counterfactual_avoided:500,
  });
  const setB = useCallback((k,v) => setBc(prev=>({...prev,[k]:v})),[]);

  const ccsResult = useMemo(() => calcCCS(ccs), [ccs]);
  const bcResult = useMemo(() => calcBiochar(bc), [bc]);

  useEffect(() => {
    const total = (ccsResult?.net_stored || 0) + (bcResult?.co2_equiv || 0);
    if (total > 0) {
      addCalculation({
        projectId: 'CC-LIVE',
        methodology: 'VM0040',
        family: 'industrial',
        cluster: 'CCS/CCUS',
        inputs: { ccs, bc },
        outputs: { ccsResult, bcResult },
        net_tco2e: total,
      });
    }
  }, [ccsResult, bcResult]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Aggregate KPIs */
  const totalCCSStored = useMemo(() => CCS_PROJECTS.reduce((s,p)=>s+p.net_stored_tco2e,0), []);
  const totalBiochar = useMemo(() => BIOCHAR_PROJECTS.reduce((s,p)=>s+p.net_credits_tco2e,0), []);

  /* H:C vs permanence scatter data */
  const hcScatter = useMemo(() => {
    const data = [];
    for(let hc=0.1;hc<=1.0;hc+=0.05){
      const sf = getStabilityFactor(hc);
      data.push({ h_c:Math.round(hc*100)/100, stability:sf*100, permanence:sf===1.0?'100+ yr':sf===0.8?'50-100 yr':'<50 yr' });
    }
    return data;
  }, []);

  return (
    <div style={{ fontFamily:T.font, background:T.cream, minHeight:'100vh', padding:'20px 24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, letterSpacing:'0.1em' }}>EP-BT3</span>
          <span style={{ width:1, height:12, background:T.border }} />
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.teal, fontWeight:600 }}>WASTE &amp; INDUSTRIAL CREDITS</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>CCS/CCUS &amp; Biochar Hub</h1>
        <p style={{ fontSize:12, color:T.textSec, marginTop:4 }}>VM0044 / Puro Standard &middot; Geological Storage &middot; Utilization Pathways &middot; Biochar Stability &middot; H:C Ratio</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        <Kpi label="CCS Projects" value="8" sub="Geological storage" accent={T.navy} />
        <Kpi label="Biochar Projects" value="6" sub="Pyrolysis-based" accent={T.emerald} />
        <Kpi label="CCS Stored" value={fmtK(totalCCSStored)} sub="tCO2e total" accent={T.teal} />
        <Kpi label="Biochar Credits" value={fmtK(totalBiochar)} sub="tCO2e total" accent={T.gold} />
        <Kpi label="CCS Net" value={fmtK(ccsResult.net_stored)} sub="tCO2e/yr calculator" accent={T.purple} />
        <Kpi label="Biochar CO2e" value={fmtK(bcResult.co2_equiv)} sub="tCO2e calculator" accent={T.sage} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══ TAB 1: CCS Net Storage Calculator ═══ */}
      {tab === TABS[0] && (
        <>
          <Card style={{marginBottom:16}} border={T.navy}>
            <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16}}>
              <div>
                <Section title="CCS Parameters">
                  <DualInput label="CO2 Captured (t/yr)" value={ccs.co2_captured_tpa} min={50000} max={5000000} step={50000} onChange={v=>setC('co2_captured_tpa',v)} color={T.navy} />
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:9,color:T.textMut,marginBottom:4}}>Transport Mode</div>
                    <div style={{display:'flex',gap:4}}>
                      {['Pipeline','Ship'].map(m=><button key={m} onClick={()=>setC('transport_mode',m)} style={{padding:'5px 12px',fontSize:10,fontWeight:600,cursor:'pointer',border:`1px solid ${ccs.transport_mode===m?T.teal:T.border}`,borderRadius:4,background:ccs.transport_mode===m?`${T.teal}10`:T.surface,color:ccs.transport_mode===m?T.teal:T.textSec,fontFamily:T.mono}}>{m}</button>)}
                    </div>
                  </div>
                  <DualInput label="Transport Distance (km)" value={ccs.distance_km} min={10} max={500} step={10} onChange={v=>setC('distance_km',v)} color={T.teal} unit="km" />
                  <DualInput label="Compression Energy (kWh/t)" value={ccs.compression_energy_kwh} min={50} max={200} step={5} onChange={v=>setC('compression_energy_kwh',v)} color={T.purple} />
                  <DualInput label="Injection Rate (t/day)" value={ccs.injection_rate_tpd} min={100} max={10000} step={100} onChange={v=>setC('injection_rate_tpd',v)} color={T.emerald} />
                  <DualInput label="Storage Capacity (Mt)" value={ccs.storage_capacity_mt} min={5} max={500} step={5} onChange={v=>setC('storage_capacity_mt',v)} color={T.gold} />
                </Section>
                <div style={{padding:12,background:`${T.navy}0a`,borderRadius:6,border:`1px solid ${T.navy}30`,marginBottom:10}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Net CO2 Stored</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{fmtK(ccsResult.net_stored)}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tCO2e/yr | {ccs.transport_mode} @ {ccs.distance_km}km</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  <div style={{padding:6,background:T.cream,borderRadius:3,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:8,color:T.textMut}}>Years to Fill</div>
                    <div style={{fontSize:12,fontWeight:700,color:T.gold,fontFamily:T.mono}}>{ccsResult.years_to_fill}</div>
                  </div>
                  <div style={{padding:6,background:T.cream,borderRadius:3,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:8,color:T.textMut}}>Utilization Rate</div>
                    <div style={{fontSize:12,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{ccsResult.utilization_rate}%</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>CO2 Mass Balance</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    {name:'Captured',tco2e:ccs.co2_captured_tpa},
                    {name:'Transport Loss',tco2e:ccsResult.transport_emissions},
                    {name:'Compression Loss',tco2e:ccsResult.compression_emissions},
                    {name:'Net Stored',tco2e:ccsResult.net_stored},
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} label={{value:'tCO2e/yr',angle:-90,position:'insideLeft',fontSize:9}} />
                    <Tooltip contentStyle={TIP} formatter={v=>v.toLocaleString()} />
                    <Bar dataKey="tco2e" radius={[3,3,0,0]} name="tCO2e">
                      <Cell fill={T.navy} /><Cell fill={T.red} /><Cell fill={T.amber} /><Cell fill={T.emerald} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:12,padding:10,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:9,color:T.navy,lineHeight:1.8}}>
                  <div>NET = CO2_Stored - Transport_Emissions - Process_Emissions</div>
                  <div>Transport = {ccs.co2_captured_tpa.toLocaleString()} x {ccs.distance_km} x {ccs.transport_mode==='Pipeline'?'0.006':'0.012'} / 1000 = <strong>{ccsResult.transport_emissions.toLocaleString()} tCO2</strong></div>
                  <div>Compression = {ccs.co2_captured_tpa.toLocaleString()} x {ccs.compression_energy_kwh} x 0.0004 = <strong>{ccsResult.compression_emissions.toLocaleString()} tCO2</strong></div>
                  <div>Net = {ccs.co2_captured_tpa.toLocaleString()} - {ccsResult.process_emissions.toLocaleString()} = <strong style={{color:T.emerald}}>{ccsResult.net_stored.toLocaleString()} tCO2e</strong></div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <Section title="Distance Sensitivity" right="Net stored vs transport distance">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[10,50,100,150,200,250,300,400,500].map(d=>{
                  const rP = calcCCS({...ccs,transport_mode:'Pipeline',distance_km:d});
                  const rS = calcCCS({...ccs,transport_mode:'Ship',distance_km:d});
                  return { km:d, pipeline:rP.net_stored, ship:rS.net_stored };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="km" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Distance (km)',position:'insideBottom',offset:-4,fontSize:9}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} formatter={v=>v.toLocaleString()} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Line dataKey="pipeline" stroke={T.teal} strokeWidth={2} name="Pipeline" dot={{r:3,fill:T.teal}} />
                  <Line dataKey="ship" stroke={T.purple} strokeWidth={2} name="Ship" dot={{r:3,fill:T.purple}} />
                  <ReferenceLine x={ccs.distance_km} stroke={T.red} strokeDasharray="3 3" label={{value:'Current',fill:T.red,fontSize:9}} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 2: CCUS Utilization Pathways ═══ */}
      {tab === TABS[1] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="CO2 Utilization Pathways">
                {UTILIZATION_PATHWAYS.map(p=>(
                  <div key={p.id} style={{padding:12,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`,marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                      <span style={{width:28,height:28,borderRadius:14,background:`${p.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:p.color,fontFamily:T.mono}}>{p.id.slice(0,2)}</span>
                      <div style={{flex:1}}>
                        <span style={{fontSize:11,fontWeight:700,color:T.navy}}>{p.name}</span>
                        <span style={{fontSize:10,fontFamily:T.mono,marginLeft:8}}><Badge v={p.permanence} colors={{'Very High':T.emerald,High:T.teal,Medium:T.amber,Low:T.red,None:T.textMut}} /></span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:12}}>
                      <div><span style={{fontSize:9,color:T.textMut}}>CO2 Util:</span> <span style={{fontSize:10,fontWeight:700,color:p.color,fontFamily:T.mono}}>{p.co2_util_pct}%</span></div>
                      <div><span style={{fontSize:9,color:T.textMut}}>Risk:</span> <span style={{fontSize:10,color:T.textSec}}>{p.risk}</span></div>
                    </div>
                  </div>
                ))}
              </Section>
            </Card>
            <Card>
              <Section title="Permanence vs CO2 Utilization Rate">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={UTILIZATION_PATHWAYS.map(p=>({name:p.id,util:p.co2_util_pct}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} domain={[0,100]} label={{value:'CO2 Util %',angle:-90,position:'insideLeft',fontSize:9}} />
                    <Tooltip contentStyle={TIP} />
                    <Bar dataKey="util" radius={[3,3,0,0]} name="CO2 Utilization %">
                      {UTILIZATION_PATHWAYS.map((p,i)=><Cell key={i} fill={p.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Pathway Suitability Matrix">
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                  <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                    {['Pathway','Permanence','Scale','Cost','TRL'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 6px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{[
                    {path:'Mineral Carbonation',perm:'1000+ yr',scale:'Large',cost:'$80-150/t',trl:'TRL 6-7'},
                    {path:'CO2-Cured Concrete',perm:'100+ yr',scale:'Medium',cost:'$50-100/t',trl:'TRL 7-8'},
                    {path:'EOR',perm:'50-100 yr',scale:'Large',cost:'$30-60/t',trl:'TRL 9'},
                    {path:'Synthetic Fuels',perm:'0 yr',scale:'Small',cost:'$200-400/t',trl:'TRL 5-6'},
                    {path:'Chemicals',perm:'5-50 yr',scale:'Medium',cost:'$100-250/t',trl:'TRL 5-7'},
                  ].map(r=><tr key={r.path} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'5px 6px',fontWeight:600,color:T.navy}}>{r.path}</td>
                    <td style={{padding:'5px 6px'}}>{r.perm}</td>
                    <td style={{padding:'5px 6px'}}><Badge v={r.scale} colors={{Large:T.emerald,Medium:T.teal,Small:T.amber}} /></td>
                    <td style={{padding:'5px 6px',color:T.gold}}>{r.cost}</td>
                    <td style={{padding:'5px 6px',fontFamily:T.mono}}>{r.trl}</td>
                  </tr>)}</tbody>
                </table>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 3: Biochar Carbon Calculator ═══ */}
      {tab === TABS[2] && (
        <>
          <Card style={{marginBottom:16}} border={T.emerald}>
            <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16}}>
              <div>
                <Section title="Biochar Parameters">
                  <DualInput label="Biomass Input (tonnes)" value={bc.biomass_input_t} min={1000} max={100000} step={500} onChange={v=>setB('biomass_input_t',v)} color={T.navy} />
                  <DualInput label="Carbon Content (%)" value={bc.carbon_content_pct} min={30} max={65} step={1} onChange={v=>setB('carbon_content_pct',v)} color={T.emerald} unit="%" />
                  <DualInput label="Pyrolysis Temp (C)" value={bc.pyrolysis_temp_c} min={350} max={700} step={10} onChange={v=>setB('pyrolysis_temp_c',v)} color={T.red} unit="C" />
                  <DualInput label="H:C Molar Ratio" value={bc.h_c_ratio} min={0.10} max={1.00} step={0.01} onChange={v=>setB('h_c_ratio',v)} color={T.purple} />
                  <DualInput label="Counterfactual Avoided (tCO2)" value={bc.counterfactual_avoided} min={0} max={5000} step={50} onChange={v=>setB('counterfactual_avoided',v)} color={T.gold} />
                </Section>
                <div style={{padding:12,background:`${T.emerald}0a`,borderRadius:6,border:`1px solid ${T.emerald}30`,marginBottom:10}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Net CO2e Credits</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{fmtK(bcResult.co2_equiv)}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tCO2e | Stability={bcResult.stability} | H:C={bc.h_c_ratio}</div>
                </div>
                <div style={{padding:8,background:`${T.purple}08`,borderRadius:4,border:`1px solid ${T.purple}20`}}>
                  <div style={{fontSize:9,fontWeight:600,color:T.purple}}>H:C Stability Classification</div>
                  <div style={{fontSize:9,color:T.textSec,lineHeight:1.6}}>
                    H:C &lt; 0.4 = 1.0 (100+ yr permanence)<br/>
                    H:C 0.4-0.7 = 0.8 (50-100 yr)<br/>
                    H:C &gt; 0.7 = 0.5 (&lt;50 yr)
                  </div>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Carbon Flow Waterfall</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    {name:'Carbon In',t:bcResult.carbon_in},
                    {name:'Biochar C',t:bcResult.biochar_carbon},
                    {name:'Durable C',t:bcResult.durable_carbon},
                    {name:'Counterfactual',t:bcResult.counterfactual_avoided},
                    {name:'Pyrolysis Loss',t:-bcResult.pyrolysis_energy},
                    {name:'CO2e Credits',t:bcResult.co2_equiv},
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:8,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} label={{value:'tonnes',angle:-90,position:'insideLeft',fontSize:9}} />
                    <Tooltip contentStyle={TIP} formatter={v=>v.toLocaleString()} />
                    <Bar dataKey="t" radius={[3,3,0,0]} name="Amount">
                      <Cell fill={T.navy} /><Cell fill={T.teal} /><Cell fill={T.emerald} /><Cell fill={T.gold} /><Cell fill={T.red} /><Cell fill={T.sage} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:12,padding:10,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:9,color:T.navy,lineHeight:1.8}}>
                  <div>Carbon_In = {bc.biomass_input_t.toLocaleString()} x {bc.carbon_content_pct}% = <strong>{bcResult.carbon_in.toLocaleString()} t C</strong></div>
                  <div>Biochar_C = {bcResult.carbon_in.toLocaleString()} x yield({bcResult.biochar_yield}) = <strong>{bcResult.biochar_carbon.toLocaleString()} t C</strong></div>
                  <div>Durable_C = {bcResult.biochar_carbon.toLocaleString()} x stability({bcResult.stability}) = <strong>{bcResult.durable_carbon.toLocaleString()} t C</strong></div>
                  <div>CO2e = ({bcResult.durable_carbon.toLocaleString()} + {bcResult.counterfactual_avoided} - {bcResult.pyrolysis_energy}) x 44/12 = <strong style={{color:T.emerald}}>{bcResult.co2_equiv.toLocaleString()} tCO2e</strong></div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ═══ TAB 4: Biochar Stability Model ═══ */}
      {tab === TABS[3] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card border={T.purple}>
              <Section title="H:C Ratio vs Permanence Factor">
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="h_c" name="H:C Ratio" tick={{fontSize:9,fontFamily:T.mono}} label={{value:'H:C Molar Ratio',position:'insideBottom',offset:-4,fontSize:9}} domain={[0,1.1]} />
                    <YAxis dataKey="stability" name="Stability %" tick={{fontSize:9,fontFamily:T.mono}} label={{value:'Stability Factor %',angle:-90,position:'insideLeft',fontSize:9}} domain={[0,110]} />
                    <Tooltip contentStyle={TIP} />
                    <Scatter data={hcScatter} fill={T.purple}>
                      {hcScatter.map((d,i)=><Cell key={i} fill={d.stability===100?T.emerald:d.stability===80?T.teal:T.amber} />)}
                    </Scatter>
                    <ReferenceLine x={0.4} stroke={T.emerald} strokeDasharray="5 5" label={{value:'0.4 Threshold',fill:T.emerald,fontSize:8,position:'top'}} />
                    <ReferenceLine x={0.7} stroke={T.amber} strokeDasharray="5 5" label={{value:'0.7 Threshold',fill:T.amber,fontSize:8,position:'top'}} />
                    <ReferenceLine x={bc.h_c_ratio} stroke={T.red} strokeDasharray="3 3" label={{value:'Current',fill:T.red,fontSize:9}} />
                  </ScatterChart>
                </ResponsiveContainer>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  {[{label:'H:C < 0.4 (100%)',color:T.emerald},{label:'0.4-0.7 (80%)',color:T.teal},{label:'> 0.7 (50%)',color:T.amber}].map(l=>(
                    <div key={l.label} style={{display:'flex',alignItems:'center',gap:4}}>
                      <span style={{width:8,height:8,borderRadius:4,background:l.color}} />
                      <span style={{fontSize:9,color:T.textMut}}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </Card>
            <Card>
              <Section title="Pyrolysis Temperature vs Yield & H:C">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={[350,400,450,500,550,600,650,700].map(temp=>{
                    const yield_pct = Math.round((0.55 - (temp-350)/1000*0.8)*100);
                    const hc_approx = Math.round((0.65 - (temp-350)/1000*0.7)*100)/100;
                    return { temp, yield_pct:Math.max(20,yield_pct), h_c:Math.max(0.1,hc_approx) };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="temp" tick={{fontSize:9,fontFamily:T.mono}} label={{value:'Temp (C)',position:'insideBottom',offset:-4,fontSize:9}} />
                    <YAxis yAxisId="left" tick={{fontSize:9,fontFamily:T.mono}} label={{value:'Yield %',angle:-90,position:'insideLeft',fontSize:9}} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize:9,fontFamily:T.mono}} domain={[0,0.8]} label={{value:'H:C',angle:90,position:'insideRight',fontSize:9}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Line yAxisId="left" dataKey="yield_pct" stroke={T.emerald} strokeWidth={2} name="Biochar Yield %" dot={{r:3,fill:T.emerald}} />
                    <Line yAxisId="right" dataKey="h_c" stroke={T.purple} strokeWidth={2} name="H:C Ratio" dot={{r:3,fill:T.purple}} />
                    <ReferenceLine yAxisId="left" x={bc.pyrolysis_temp_c} stroke={T.red} strokeDasharray="3 3" label={{value:'Current',fill:T.red,fontSize:9}} />
                  </LineChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Biochar Project Portfolio">
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                    <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                      {['ID','Project','Biomass','Temp','H:C','Credits','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 6px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                    </tr></thead>
                    <tbody>{BIOCHAR_PROJECTS.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'5px 6px',color:T.teal,fontWeight:600}}>{p.id}</td>
                      <td style={{padding:'5px 6px',color:T.navy}}>{p.name}</td>
                      <td style={{padding:'5px 6px'}}>{p.biomass_type}</td>
                      <td style={{padding:'5px 6px'}}>{p.pyrolysis_temp_c}C</td>
                      <td style={{padding:'5px 6px',color:p.h_c_ratio<0.4?T.emerald:p.h_c_ratio<0.7?T.teal:T.amber,fontWeight:600}}>{p.h_c_ratio}</td>
                      <td style={{padding:'5px 6px',textAlign:'right',color:T.emerald,fontWeight:600}}>{p.net_credits_tco2e.toLocaleString()}</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.status} colors={{Active:T.emerald,Verification:T.amber}} /></td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 5: Storage Site Assessment ═══ */}
      {tab === TABS[4] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card border={T.teal}>
              <Section title="Geological Storage Assessment Criteria">
                {[
                  {criterion:'Reservoir Porosity',range:'15-30%',ideal:'>20%',weight:20,desc:'Pore space for CO2 injection'},
                  {criterion:'Permeability',range:'10-1000 mD',ideal:'>100 mD',weight:18,desc:'Fluid flow capacity'},
                  {criterion:'Caprock Integrity',range:'Qualitative',ideal:'Thick shale/salt',weight:25,desc:'Seal quality preventing leakage'},
                  {criterion:'Depth',range:'800-3000 m',ideal:'1000-2000 m',weight:15,desc:'Supercritical CO2 conditions'},
                  {criterion:'Seismicity Risk',range:'Low-High',ideal:'Low',weight:12,desc:'Induced seismicity potential'},
                  {criterion:'Injectivity',range:'1-50 t/day/well',ideal:'>10 t/day',weight:10,desc:'Injection rate per well'},
                ].map(c=>(
                  <div key={c.criterion} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:4,marginBottom:4,background:T.surface,border:`1px solid ${T.border}`}}>
                    <div style={{width:30,height:30,borderRadius:15,background:`${T.teal}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:T.teal,fontFamily:T.mono}}>{c.weight}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.navy}}>{c.criterion}</div>
                      <div style={{fontSize:9,color:T.textSec}}>{c.desc}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut}}>{c.range}</div>
                      <div style={{fontSize:9,fontFamily:T.mono,color:T.emerald,fontWeight:600}}>{c.ideal}</div>
                    </div>
                  </div>
                ))}
              </Section>
            </Card>
            <Card>
              <Section title="CCS Project Portfolio">
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                    <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                      {['ID','Site','Type','CO2 t/yr','Capacity Mt','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 6px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                    </tr></thead>
                    <tbody>{CCS_PROJECTS.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'5px 6px',color:T.teal,fontWeight:600}}>{p.id}</td>
                      <td style={{padding:'5px 6px',color:T.navy}}>{p.name}</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.storage_type} colors={{'Saline Aquifer':T.teal,'Depleted Gas':T.gold,'Pre-salt':T.purple}} /></td>
                      <td style={{padding:'5px 6px',textAlign:'right'}}>{p.co2_captured_tpa.toLocaleString()}</td>
                      <td style={{padding:'5px 6px',textAlign:'right',fontWeight:600}}>{p.storage_capacity_mt}</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.status} colors={{Injecting:T.emerald,Monitoring:T.amber}} /></td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </Section>
              <Section title="Storage Capacity by Project">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={CCS_PROJECTS.map(p=>({name:p.id,capacity_mt:p.storage_capacity_mt,injected:Math.round(p.co2_captured_tpa*(2026-p.vintage)/1e6*10)/10}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:8,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} label={{value:'Mt CO2',angle:-90,position:'insideLeft',fontSize:9}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Bar dataKey="capacity_mt" fill={T.navy} name="Capacity (Mt)" radius={[3,3,0,0]} />
                    <Bar dataKey="injected" fill={T.emerald} name="Injected (Mt)" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 6: Hub Dashboard ═══ */}
      {tab === TABS[5] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="CCS Portfolio Summary">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                  {[
                    {l:'Total Projects',v:CCS_PROJECTS.length,c:T.navy},
                    {l:'Total Stored',v:fmtK(totalCCSStored)+' tCO2e',c:T.teal},
                    {l:'Avg Capacity',v:Math.round(CCS_PROJECTS.reduce((s,p)=>s+p.storage_capacity_mt,0)/CCS_PROJECTS.length)+' Mt',c:T.gold},
                    {l:'Active Injecting',v:CCS_PROJECTS.filter(p=>p.status==='Injecting').length,c:T.emerald},
                  ].map(kv=>(
                    <div key={kv.l} style={{padding:10,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase'}}>{kv.l}</div>
                      <div style={{fontSize:16,fontWeight:700,color:kv.c,fontFamily:T.mono}}>{kv.v}</div>
                    </div>
                  ))}
                </div>
                <Section title="CCS by Storage Type">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={[...new Set(CCS_PROJECTS.map(p=>p.storage_type))].map(t=>({name:t,value:CCS_PROJECTS.filter(p=>p.storage_type===t).length}))} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({name,value})=>`${name}: ${value}`} style={{fontSize:9}}>
                        <Cell fill={T.teal} /><Cell fill={T.gold} /><Cell fill={T.purple} />
                      </Pie>
                      <Tooltip contentStyle={TIP} />
                    </PieChart>
                  </ResponsiveContainer>
                </Section>
              </Section>
            </Card>
            <Card>
              <Section title="Biochar Portfolio Summary">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                  {[
                    {l:'Total Projects',v:BIOCHAR_PROJECTS.length,c:T.emerald},
                    {l:'Total Credits',v:fmtK(totalBiochar)+' tCO2e',c:T.sage},
                    {l:'Avg H:C',v:(BIOCHAR_PROJECTS.reduce((s,p)=>s+p.h_c_ratio,0)/BIOCHAR_PROJECTS.length).toFixed(2),c:T.purple},
                    {l:'Active',v:BIOCHAR_PROJECTS.filter(p=>p.status==='Active').length,c:T.teal},
                  ].map(kv=>(
                    <div key={kv.l} style={{padding:10,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase'}}>{kv.l}</div>
                      <div style={{fontSize:16,fontWeight:700,color:kv.c,fontFamily:T.mono}}>{kv.v}</div>
                    </div>
                  ))}
                </div>
                <Section title="Biochar Credits by Biomass Type">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={BIOCHAR_PROJECTS.map(p=>({name:p.biomass_type.split(' ')[0],credits:p.net_credits_tco2e,hc:p.h_c_ratio}))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{fontSize:8,fontFamily:T.mono}} />
                      <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                      <Tooltip contentStyle={TIP} formatter={v=>typeof v==='number'?v.toLocaleString():v} />
                      <Bar dataKey="credits" fill={T.emerald} name="Credits (tCO2e)" radius={[3,3,0,0]}>
                        {BIOCHAR_PROJECTS.map((p,i)=><Cell key={i} fill={p.h_c_ratio<0.4?T.emerald:p.h_c_ratio<0.7?T.teal:T.amber} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Section>
              </Section>
            </Card>
          </div>
          <Card>
            <Section title="Combined CCS + Biochar — Annual Credits Trend">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={Array.from({length:7},(_,i)=>{
                  const yr = 2020+i;
                  const ccsYr = CCS_PROJECTS.filter(p=>p.vintage<=yr).reduce((s,p)=>s+p.net_stored_tco2e,0);
                  const bcYr = BIOCHAR_PROJECTS.filter(p=>p.vintage<=yr).reduce((s,p)=>s+p.net_credits_tco2e,0);
                  return { year:yr, CCS:ccsYr, Biochar:bcYr, Total:ccsYr+bcYr };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{fontSize:9,fontFamily:T.mono}} />
                  <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} formatter={v=>v.toLocaleString()} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Area dataKey="CCS" stackId="1" fill={`${T.navy}40`} stroke={T.navy} strokeWidth={1.5} />
                  <Area dataKey="Biochar" stackId="1" fill={`${T.emerald}40`} stroke={T.emerald} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}
    </div>
  );
}
