import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, AreaChart, Area, Cell, PieChart, Pie, ReferenceLine,
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
   REDD+ & WETLANDS CALCULATION ENGINES
   ══════════════════════════════════════════════════════════════════ */

/* REDD+ : E_BL(t) = BDR × Forest_Area_at_Risk × (CS_Forest − CS_Post) × 44/12
   VM0007/VM0033: leakage split into Activity-Shifting (displaced deforestation) + Market (timber demand) */
const calcREDD = (p) => {
  const { bdr_pct, forest_area_ha, cs_forest, cs_post, crediting_yrs, leakage_act_pct, leakage_mkt_pct, buffer_pct, uncertainty_pct } = p;
  const bdr = bdr_pct / 100;
  const years = [];
  let remaining = forest_area_ha;
  for (let t = 1; t <= crediting_yrs; t++) {
    const deforested = remaining * bdr;
    remaining -= deforested;
    const baseline_emissions = deforested * (cs_forest - cs_post) * (44/12);
    const gross = Math.round(baseline_emissions);
    const leak_act = Math.round(gross * leakage_act_pct / 100); // Activity-shifting leakage
    const leak_mkt = Math.round(gross * leakage_mkt_pct / 100); // Market leakage (timber substitution)
    const leak = leak_act + leak_mkt;
    const buf = Math.round((gross - leak) * buffer_pct / 100);
    const unc = Math.round((gross - leak - buf) * uncertainty_pct / 100);
    const net = Math.max(0, gross - leak - buf - unc);
    const cum = (years.length > 0 ? years[years.length-1].cumulative : 0) + net;
    years.push({ year:t, area_deforested:Math.round(deforested), remaining:Math.round(remaining), baseline_emissions:gross, leakage_act:leak_act, leakage_mkt:leak_mkt, leakage:leak, buffer:buf, uncertainty:unc, net, cumulative:cum });
  }
  return { years, total: years.length>0?years[years.length-1].cumulative:0 };
};

/* Wetlands Multi-Gas: GHG = CO2 + CH4×GWP_CH4 + N2O×GWP_N2O */
const GWP_AR5 = { CO2:1, CH4:28, N2O:265 };
const GWP_AR6 = { CO2:1, CH4:27.2, N2O:273 };

const calcWetlands = (p) => {
  const { area_ha, co2_rate, ch4_rate, n2o_rate, gwp_version, crediting_yrs, project_co2_rate, project_ch4_rate, project_n2o_rate, leakage_pct, buffer_pct } = p;
  const gwp = gwp_version === 'AR6' ? GWP_AR6 : GWP_AR5;
  const years = [];
  for (let t = 1; t <= crediting_yrs; t++) {
    const bl_co2 = co2_rate * area_ha * gwp.CO2;
    const bl_ch4 = ch4_rate * area_ha * gwp.CH4;
    const bl_n2o = n2o_rate * area_ha * gwp.N2O;
    const bl_total = bl_co2 + bl_ch4 + bl_n2o;
    const pj_co2 = project_co2_rate * area_ha * gwp.CO2;
    const pj_ch4 = project_ch4_rate * area_ha * gwp.CH4;
    const pj_n2o = project_n2o_rate * area_ha * gwp.N2O;
    const pj_total = pj_co2 + pj_ch4 + pj_n2o;
    const gross = Math.max(0, Math.round(bl_total - pj_total));
    const leak = Math.round(gross * leakage_pct / 100);
    const buf = Math.round((gross - leak) * buffer_pct / 100);
    const net = Math.max(0, gross - leak - buf);
    const cum = (years.length>0?years[years.length-1].cumulative:0) + net;
    years.push({ year:t, bl_co2:Math.round(bl_co2), bl_ch4:Math.round(bl_ch4), bl_n2o:Math.round(bl_n2o), bl_total:Math.round(bl_total), pj_total:Math.round(pj_total), gross, net, cumulative:cum });
  }
  return { years, total: years.length>0?years[years.length-1].cumulative:0 };
};

/* Blue Carbon ecosystem types */
const BLUE_CARBON = [
  { id:'MAN', name:'Mangrove', sequestration:8.4, sediment_rate:6.2, co2_avoided:22.4, ch4_rate:0.08, color:'#0f766e', area_global_ha:14800000 },
  { id:'SEA', name:'Seagrass', sequestration:4.2, sediment_rate:3.8, co2_avoided:6.8, ch4_rate:0.02, color:'#0891b2', area_global_ha:32800000 },
  { id:'SALT', name:'Salt Marsh', sequestration:6.5, sediment_rate:5.1, co2_avoided:18.2, ch4_rate:0.12, color:'#059669', area_global_ha:5500000 },
  { id:'PEAT', name:'Coastal Peatland', sequestration:2.8, sediment_rate:1.4, co2_avoided:55.0, ch4_rate:0.25, color:'#854d0e', area_global_ha:24000000 },
];

/* Risk factors for buffer calculation */
const RISK_FACTORS = [
  { risk:'Political & Governance', desc:'Government stability, land tenure security, corruption index', weight:0.25, levels:['Low (stable democracy)','Medium (emerging)','High (conflict zone)'], scores:[5,15,25] },
  { risk:'Fire & Natural Disturbance', desc:'Historical fire frequency, drought risk, storm exposure', weight:0.25, levels:['Low (wet tropics)','Medium (seasonal)','High (fire-prone)'], scores:[3,12,20] },
  { risk:'Community Encroachment', desc:'Population pressure, alternative livelihoods, FPIC status', weight:0.20, levels:['Low (strong FPIC)','Medium (mixed)','High (land conflict)'], scores:[4,10,18] },
  { risk:'Technical & Project Design', desc:'MRV capacity, methodology complexity, developer experience', weight:0.15, levels:['Low (experienced)','Medium','High (first project)'], scores:[2,8,15] },
  { risk:'Financial Viability', desc:'Revenue certainty, upfront costs, market access', weight:0.15, levels:['Low (pre-sold)','Medium','High (speculative)'], scores:[3,8,12] },
];

/* Hub aggregate data */
const HUB_PROJECTS = Array.from({length:20},(_, i)=>{
  const types = ['REDD+','REDD+','REDD+','Wetlands','Wetlands','Blue Carbon','Blue Carbon','REDD+','REDD+','Wetlands','Blue Carbon','REDD+','REDD+','Wetlands','Blue Carbon','REDD+','REDD+','Wetlands','Blue Carbon','REDD+'];
  const countries = ['Brazil','Indonesia','Peru','Cambodia','DRC','Belize','Senegal','Colombia','Gabon','Myanmar','Honduras','Ecuador','Bolivia','Malaysia','Madagascar','Kenya','Papua NG','Tanzania','Fiji','Cameroon'];
  return {
    id:`NB-${String(i+1).padStart(3,'0')}`, name:`${countries[i]} ${types[i]} ${['Reserve','Complex','Buffer','Corridor','Mosaic','Reef','Delta','Watershed','Basin','Community','Mangrove','Shield','Frontier','Peatland','Estuary','Highlands','Lowlands','Coastal','Islands','Forest'][i]}`,
    type: types[i], country: countries[i],
    area_ha: Math.round(10000 + sr(i*11)*290000),
    credits: Math.round(200000 + sr(i*13)*4800000),
    vintage: 2016 + (i%8), price: Math.round((6+sr(i*17)*24)*10)/10,
    status: i%6===5?'Pipeline':i%7===6?'Verification':'Active',
    registry: i%3===0?'Verra VCS':i%3===1?'Gold Standard':'ACR',
  };
});

const PIE_COLORS = [T.emerald, T.teal, '#0891b2', '#854d0e'];

export default function CcReddWetlandsHubPage() {
  const { addCalculation, addProject, getSummary } = useCarbonCredit();
  const TABS = ['REDD+ Calculator','Wetlands Multi-Gas','Blue Carbon','Risk & Buffer Pool','Cross-Methodology','Hub Dashboard'];
  const [tab, setTab] = useState(TABS[0]);

  /* REDD+ state */
  const [reddP, setReddP] = useState({ bdr_pct:1.2, forest_area_ha:100000, cs_forest:350, cs_post:50, crediting_yrs:30, leakage_act_pct:8, leakage_mkt_pct:4, buffer_pct:25, uncertainty_pct:10 }); // leakage split: Activity-shifting 8% + Market 4% = 12% total (VM0007)
  const setR = useCallback((k,v)=>setReddP(p=>({...p,[k]:v})),[]);
  const reddResult = useMemo(()=>calcREDD(reddP),[reddP]);

  useEffect(() => {
    if (reddResult && reddResult.total > 0) {
      addCalculation({
        projectId: 'CC-LIVE',
        methodology: 'VM0007',
        family: 'nature',
        cluster: 'REDD+',
        inputs: reddP,
        outputs: reddResult,
        net_tco2e: reddResult.total || 0,
      });
    }
  }, [reddResult]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Wetlands state */
  const [wetP, setWetP] = useState({ area_ha:5000, co2_rate:22.4, ch4_rate:0.08, n2o_rate:0.002, gwp_version:'AR6', crediting_yrs:25, project_co2_rate:1.8, project_ch4_rate:0.01, project_n2o_rate:0.0005, leakage_pct:7, buffer_pct:20 }); // default AR6: CH4=27.2, N2O=273
  const setW = useCallback((k,v)=>setWetP(p=>({...p,[k]:v})),[]);
  const wetResult = useMemo(()=>calcWetlands(wetP),[wetP]);

  /* Risk state */
  const [riskLevels, setRiskLevels] = useState([1,1,0,0,1]); // 0=Low,1=Med,2=High
  const bufferRate = useMemo(()=>{
    const base = 20;
    const riskPremium = RISK_FACTORS.reduce((s,rf,i)=>s+rf.scores[riskLevels[i]]*rf.weight,0);
    return Math.min(40, Math.round(base + riskPremium));
  },[riskLevels]);

  const totalCredits = HUB_PROJECTS.reduce((s,p)=>s+p.credits,0);
  const byType = ['REDD+','Wetlands','Blue Carbon'].map(t=>({name:t,value:HUB_PROJECTS.filter(p=>p.type===t).reduce((s,p)=>s+p.credits,0)}));

  return (
    <div style={{ fontFamily:T.font, background:T.cream, minHeight:'100vh', padding:'20px 24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, letterSpacing:'0.1em' }}>EP-BQ3</span>
          <span style={{ width:1, height:12, background:T.border }} />
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.emerald, fontWeight:600 }}>NATURE-BASED CARBON CREDITS</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>REDD+ & Wetlands Carbon Hub</h1>
        <p style={{ fontSize:12, color:T.textSec, marginTop:4 }}>REDD+ · Wetlands Multi-Gas · Blue Carbon · VM0007 · VM0033 · Buffer Pool Assessment · 20 Projects</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        <Kpi label="Projects" value="20" sub="REDD+ · Wetlands · Blue" accent={T.emerald} />
        <Kpi label="Total Credits" value={fmtK(totalCredits)} sub="tCO₂e all nature" accent={T.teal} />
        <Kpi label="REDD+ Calc" value={fmtK(reddResult.total)} sub={`${reddP.crediting_yrs}yr · ${reddP.forest_area_ha.toLocaleString()} ha`} accent={T.navy} />
        <Kpi label="Wetlands Calc" value={fmtK(wetResult.total)} sub={`${wetP.crediting_yrs}yr · Multi-Gas`} accent={T.teal} />
        <Kpi label="Blue Carbon Types" value="4" sub="Mangrove·Sea·Marsh·Peat" accent='#0891b2' />
        <Kpi label="Buffer Rate" value={`${bufferRate}%`} sub="Risk-adjusted" accent={T.amber} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══ TAB 1: REDD+ Calculator ═══ */}
      {tab === TABS[0] && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <Card style={{marginBottom:12}} border={T.emerald}>
              <Section title="REDD+ Deforestation Avoidance Calculator">
                <div style={{padding:8,background:T.cream,borderRadius:4,marginBottom:12,fontFamily:T.mono,fontSize:10,color:T.navy}}>
                  E_BL(t) = BDR × Forest_Area × (CS_Forest − CS_Post) × 44/12
                </div>
                <DualInput label="Baseline Deforestation Rate (%/yr)" value={reddP.bdr_pct} min={0.1} max={5} step={0.1} onChange={v=>setR('bdr_pct',v)} color={T.red} unit="%/yr" />
                <DualInput label="Forest Area (ha)" value={reddP.forest_area_ha} min={5000} max={500000} step={1000} onChange={v=>setR('forest_area_ha',v)} color={T.emerald} unit=" ha" />
                <DualInput label="Forest Carbon Stock (tCO₂e/ha)" value={reddP.cs_forest} min={100} max={600} step={10} onChange={v=>setR('cs_forest',v)} color={T.navy} />
                <DualInput label="Post-Deforestation CS (tCO₂e/ha)" value={reddP.cs_post} min={0} max={150} step={5} onChange={v=>setR('cs_post',v)} color={T.amber} />
                <DualInput label="Crediting Period (yr)" value={reddP.crediting_yrs} min={10} max={50} onChange={v=>setR('crediting_yrs',v)} color={T.navy} unit=" yr" />
                <DualInput label="Activity-Shifting Leakage (%)" value={reddP.leakage_act_pct} min={0} max={25} onChange={v=>setR('leakage_act_pct',v)} color={T.red} unit="%" />
                <DualInput label="Market Leakage — Timber Substitution (%)" value={reddP.leakage_mkt_pct} min={0} max={15} onChange={v=>setR('leakage_mkt_pct',v)} color={T.amber} unit="%" />
                <DualInput label="Buffer Pool (%)" value={reddP.buffer_pct} min={15} max={40} onChange={v=>setR('buffer_pct',v)} color={T.amber} unit="%" />
                <DualInput label="Uncertainty (%)" value={reddP.uncertainty_pct} min={0} max={25} onChange={v=>setR('uncertainty_pct',v)} color={T.purple} unit="%" />
              </Section>
            </Card>
          </div>
          <div>
            <div style={{background:T.navy,borderRadius:6,padding:16,marginBottom:12,color:T.cream}}>
              <div style={{fontSize:10,fontFamily:T.mono,color:`${T.cream}80`,letterSpacing:'0.1em',marginBottom:4}}>REDD+ NET CREDITS</div>
              <div style={{fontSize:48,fontWeight:700,fontFamily:T.mono,lineHeight:1}}>{fmtK(reddResult.total)}</div>
              <div style={{fontSize:11,color:`${T.cream}80`,marginTop:4}}>tCO₂e · {reddP.crediting_yrs}yr · {reddP.forest_area_ha.toLocaleString()} ha</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
                <div style={{padding:8,background:'rgba(255,255,255,0.08)',borderRadius:4,textAlign:'center'}}>
                  <div style={{fontSize:9,color:`${T.cream}60`}}>Avg Annual</div>
                  <div style={{fontSize:16,fontWeight:700,fontFamily:T.mono}}>{fmtK(Math.round(reddResult.total/(reddP.crediting_yrs||1)))}</div>
                </div>
                <div style={{padding:8,background:'rgba(255,255,255,0.08)',borderRadius:4,textAlign:'center'}}>
                  <div style={{fontSize:9,color:`${T.cream}60`}}>Forest Protected</div>
                  <div style={{fontSize:16,fontWeight:700,fontFamily:T.mono}}>{reddResult.years.length>0?fmt(reddResult.years[reddResult.years.length-1].remaining):0} ha</div>
                </div>
              </div>
            </div>
            <Card style={{marginBottom:12}}>
              <Section title="Avoided Deforestation & Credits Over Time">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={reddResult.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v)]} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                    <Area dataKey="cumulative" fill={`${T.emerald}20`} stroke={T.emerald} strokeWidth={2} name="Cumulative Net Credits" />
                    <Area dataKey="baseline_emissions" fill={`${T.red}10`} stroke={T.red} strokeWidth={1} strokeDasharray="3 3" name="Annual BL Emissions" />
                  </AreaChart>
                </ResponsiveContainer>
              </Section>
            </Card>
            <Card>
              <Section title="Remaining Forest Area (ha)">
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={reddResult.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} domain={['auto','auto']} />
                    <Tooltip contentStyle={TIP} formatter={v=>[v.toLocaleString()+' ha']} />
                    <Line dataKey="remaining" stroke={T.emerald} strokeWidth={2} dot={false} name="Forest Remaining" />
                    <ReferenceLine y={reddP.forest_area_ha*0.5} stroke={T.red} strokeDasharray="4 2" label={{value:'50% threshold',fill:T.red,fontSize:9}} />
                  </LineChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ TAB 2: Wetlands Multi-Gas ═══ */}
      {tab === TABS[1] && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <Card style={{marginBottom:12}} border={T.teal}>
              <Section title="Wetlands Multi-Gas Calculator">
                <div style={{padding:8,background:T.cream,borderRadius:4,marginBottom:12,fontFamily:T.mono,fontSize:10,color:T.navy}}>
                  GHG = CO₂×1 + CH₄×{wetP.gwp_version==='AR6'?'27.2':'28'} + N₂O×{wetP.gwp_version==='AR6'?'273':'265'} (GWP-100 {wetP.gwp_version})
                </div>
                <div style={{display:'flex',gap:8,marginBottom:10}}>
                  {['AR5','AR6'].map(v=>(
                    <button key={v} onClick={()=>setW('gwp_version',v)} style={{
                      padding:'5px 12px',fontSize:10,fontFamily:T.mono,cursor:'pointer',
                      border:`1px solid ${wetP.gwp_version===v?T.teal:T.border}`,
                      background:wetP.gwp_version===v?T.teal:T.surface,
                      color:wetP.gwp_version===v?T.cream:T.textSec,borderRadius:4,
                    }}>GWP {v}</button>
                  ))}
                </div>
                <DualInput label="Wetland Area (ha)" value={wetP.area_ha} min={100} max={100000} step={100} onChange={v=>setW('area_ha',v)} color={T.teal} unit=" ha" />
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginTop:8,marginBottom:4}}>Baseline Emission Rates (tGas/ha/yr)</div>
                <DualInput label="CO₂ Baseline (tCO₂/ha/yr)" value={wetP.co2_rate} min={0} max={80} step={0.5} onChange={v=>setW('co2_rate',v)} color={T.navy} />
                <DualInput label="CH₄ Baseline (tCH₄/ha/yr)" value={wetP.ch4_rate} min={0} max={2} step={0.01} onChange={v=>setW('ch4_rate',v)} color={T.amber} />
                <DualInput label="N₂O Baseline (tN₂O/ha/yr)" value={wetP.n2o_rate} min={0} max={0.05} step={0.001} onChange={v=>setW('n2o_rate',v)} color={T.purple} />
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginTop:8,marginBottom:4}}>Project Emission Rates</div>
                <DualInput label="CO₂ Project" value={wetP.project_co2_rate} min={0} max={80} step={0.5} onChange={v=>setW('project_co2_rate',v)} color={T.emerald} />
                <DualInput label="CH₄ Project" value={wetP.project_ch4_rate} min={0} max={2} step={0.01} onChange={v=>setW('project_ch4_rate',v)} color={T.emerald} />
                <DualInput label="N₂O Project" value={wetP.project_n2o_rate} min={0} max={0.05} step={0.001} onChange={v=>setW('project_n2o_rate',v)} color={T.emerald} />
                <DualInput label="Crediting Period" value={wetP.crediting_yrs} min={10} max={40} onChange={v=>setW('crediting_yrs',v)} color={T.navy} unit=" yr" />
                <DualInput label="Leakage (%)" value={wetP.leakage_pct} min={0} max={20} onChange={v=>setW('leakage_pct',v)} color={T.red} unit="%" />
                <DualInput label="Buffer (%)" value={wetP.buffer_pct} min={10} max={35} onChange={v=>setW('buffer_pct',v)} color={T.amber} unit="%" />
              </Section>
            </Card>
          </div>
          <div>
            <div style={{background:T.navy,borderRadius:6,padding:16,marginBottom:12,color:T.cream}}>
              <div style={{fontSize:10,fontFamily:T.mono,color:`${T.cream}80`,letterSpacing:'0.1em',marginBottom:4}}>WETLANDS NET CREDITS</div>
              <div style={{fontSize:48,fontWeight:700,fontFamily:T.mono,lineHeight:1}}>{fmtK(wetResult.total)}</div>
              <div style={{fontSize:11,color:`${T.cream}80`,marginTop:4}}>tCO₂e · Multi-Gas ({wetP.gwp_version}) · {wetP.area_ha.toLocaleString()} ha</div>
            </div>
            <Card style={{marginBottom:12}}>
              <Section title="Baseline Gas Contribution (Annual tCO₂e)">
                {wetResult.years.length>0 && (()=>{
                  const yr1 = wetResult.years[0];
                  const data = [
                    {name:'CO₂',value:yr1.bl_co2,color:T.navy},
                    {name:'CH₄ (×GWP)',value:yr1.bl_ch4,color:T.amber},
                    {name:'N₂O (×GWP)',value:yr1.bl_n2o,color:T.purple},
                  ];
                  return (
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="name" tick={{fontSize:10,fontFamily:T.mono}} />
                        <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                        <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v)+' tCO₂e/yr']} />
                        <Bar dataKey="value" radius={[3,3,0,0]}>
                          {data.map((d,i)=><Cell key={i} fill={d.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </Section>
            </Card>
            <Card>
              <Section title="Cumulative Net Credits">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={wetResult.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v)+' tCO₂e']} />
                    <Area dataKey="cumulative" fill={`${T.teal}20`} stroke={T.teal} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: Blue Carbon ═══ */}
      {tab === TABS[2] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
            {BLUE_CARBON.map(bc=>(
              <Card key={bc.id} border={bc.color}>
                <div style={{fontSize:11,fontWeight:700,color:bc.color,marginBottom:6}}>{bc.name}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:10}}>
                  <div><span style={{color:T.textMut}}>Sequestration:</span></div>
                  <div style={{fontFamily:T.mono,fontWeight:600}}>{bc.sequestration} tCO₂e/ha/yr</div>
                  <div><span style={{color:T.textMut}}>Avoided Emissions:</span></div>
                  <div style={{fontFamily:T.mono,fontWeight:600}}>{bc.co2_avoided} tCO₂e/ha/yr</div>
                  <div><span style={{color:T.textMut}}>CH₄ Rate:</span></div>
                  <div style={{fontFamily:T.mono,fontWeight:600}}>{bc.ch4_rate} tCH₄/ha/yr</div>
                  <div><span style={{color:T.textMut}}>Global Area:</span></div>
                  <div style={{fontFamily:T.mono,fontWeight:600}}>{fmtK(bc.area_global_ha)} ha</div>
                </div>
              </Card>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <Section title="Blue Carbon Sequestration Rates (tCO₂e/ha/yr)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={BLUE_CARBON.map(bc=>({name:bc.name,sequestration:bc.sequestration,avoided:bc.co2_avoided}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:10,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                    <Bar dataKey="sequestration" fill={T.teal} name="Sequestration" radius={[3,3,0,0]} />
                    <Bar dataKey="avoided" fill={T.navy} name="Avoided Emissions" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </Card>
            <Card>
              <Section title="Global Blue Carbon Ecosystem Area">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={BLUE_CARBON.map(bc=>({name:bc.name,value:bc.area_global_ha/1e6}))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                      {BLUE_CARBON.map((bc,i)=><Cell key={i} fill={bc.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TIP} formatter={v=>[`${v.toFixed(1)}M ha`]} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                  </PieChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 4: Risk & Buffer Pool ═══ */}
      {tab === TABS[3] && (
        <>
          <Card style={{marginBottom:16}} border={T.amber}>
            <Section title="Non-Permanence Risk Assessment — Buffer Pool Calculator" right={`Calculated Buffer: ${bufferRate}%`}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  {RISK_FACTORS.map((rf,ri)=>(
                    <div key={rf.risk} style={{marginBottom:12,padding:'8px 10px',background:T.cream,borderRadius:4}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:11,fontWeight:600,color:T.navy}}>{rf.risk}</span>
                        <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>Weight: {rf.weight*100}%</span>
                      </div>
                      <div style={{fontSize:10,color:T.textSec,marginBottom:6}}>{rf.desc}</div>
                      <div style={{display:'flex',gap:4}}>
                        {rf.levels.map((lev,li)=>(
                          <button key={li} onClick={()=>{const n=[...riskLevels];n[ri]=li;setRiskLevels(n);}} style={{
                            flex:1,padding:'4px 8px',fontSize:9,fontFamily:T.mono,cursor:'pointer',
                            border:`1px solid ${riskLevels[ri]===li?[T.green,T.amber,T.red][li]:T.border}`,
                            background:riskLevels[ri]===li?`${[T.green,T.amber,T.red][li]}15`:T.surface,
                            color:riskLevels[ri]===li?[T.green,T.amber,T.red][li]:T.textMut,
                            borderRadius:3,
                          }}>{lev} ({rf.scores[li]}%)</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{background:T.navy,borderRadius:6,padding:16,color:T.cream,marginBottom:12}}>
                    <div style={{fontSize:10,fontFamily:T.mono,color:`${T.cream}80`,letterSpacing:'0.1em',marginBottom:4}}>CALCULATED BUFFER RATE</div>
                    <div style={{fontSize:56,fontWeight:700,fontFamily:T.mono,lineHeight:1}}>{bufferRate}%</div>
                    <div style={{fontSize:11,color:`${T.cream}80`,marginTop:4}}>Base 20% + Risk Premium {bufferRate-20}%</div>
                  </div>
                  <Card>
                    <Section title="Risk Radar">
                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={RISK_FACTORS.map((rf,i)=>({subject:rf.risk.split(' ')[0],score:rf.scores[riskLevels[i]],fullMark:25}))}>
                          <PolarGrid stroke={T.border} />
                          <PolarAngleAxis dataKey="subject" tick={{fontSize:9,fontFamily:T.mono}} />
                          <PolarRadiusAxis domain={[0,25]} tick={false} axisLine={false} />
                          <Radar dataKey="score" stroke={T.red} fill={T.red} fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Section>
                  </Card>
                </div>
              </div>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 5: Cross-Methodology ═══ */}
      {tab === TABS[4] && (
        <Card>
          <Section title="Nature-Based Methodology Comparison">
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:T.navy}}>
                {['Methodology','Type','Buffer Range','Leakage','Permanence','MRV','Complexity','Avg Credits/ha/yr'].map(h=>(
                  <th key={h} style={{padding:'7px 8px',color:T.cream,fontSize:9,fontFamily:T.mono,textAlign:'left',fontWeight:600}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[
                  {name:'ARR (VM0047)',type:'Removal',buffer:'10-25%',leak:'5-15%',perm:'30yr',mrv:'Satellite+Ground',complex:'Medium',credits:'5-15'},
                  {name:'IFM (VM0010)',type:'Removal/Avoid',buffer:'10-20%',leak:'20-50%',perm:'30yr',mrv:'Inventory+Sample',complex:'High',credits:'3-8'},
                  {name:'REDD+ (VM0007)',type:'Avoidance',buffer:'20-40%',leak:'10-20%',perm:'30yr',mrv:'Remote Sensing',complex:'Very High',credits:'8-25'},
                  {name:'Wetlands (VM0033)',type:'Removal/Avoid',buffer:'15-30%',leak:'5-10%',perm:'30yr',mrv:'Multi-Gas+Flux',complex:'High',credits:'10-40'},
                  {name:'EE-M001 (Restoration)',type:'Removal',buffer:'15-25%',leak:'5-12%',perm:'30yr',mrv:'Monte Carlo+Field',complex:'High',credits:'6-18'},
                  {name:'EE-M002 (Conservation)',type:'Avoidance',buffer:'20-35%',leak:'8-15%',perm:'30yr',mrv:'JRL+Satellite',complex:'Very High',credits:'10-30'},
                ].map((m,i)=>(
                  <tr key={m.name} style={{background:i%2===0?T.surface:`${T.cream}50`,borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'7px 8px',fontWeight:600,color:T.navy}}>{m.name}</td>
                    <td style={{padding:'7px 8px',fontSize:10}}>{m.type}</td>
                    <td style={{padding:'7px 8px',fontFamily:T.mono,fontSize:10}}>{m.buffer}</td>
                    <td style={{padding:'7px 8px',fontFamily:T.mono,fontSize:10}}>{m.leak}</td>
                    <td style={{padding:'7px 8px',fontFamily:T.mono,fontSize:10}}>{m.perm}</td>
                    <td style={{padding:'7px 8px',fontSize:10}}>{m.mrv}</td>
                    <td style={{padding:'7px 8px'}}><Badge v={m.complex} colors={{Medium:'#d97706',High:'#dc2626','Very High':'#7c3aed'}} /></td>
                    <td style={{padding:'7px 8px',fontFamily:T.mono,fontWeight:600,color:T.emerald}}>{m.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </Card>
      )}

      {/* ═══ TAB 6: Hub Dashboard ═══ */}
      {tab === TABS[5] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="Credits by Type">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                      {byType.map((d,i)=><Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v)+' tCO₂e']} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                  </PieChart>
                </ResponsiveContainer>
              </Section>
            </Card>
            <Card>
              <Section title="Credits by Vintage">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={Array.from({length:8},(_, i)=>{const v=2016+i;return{vintage:v,credits:HUB_PROJECTS.filter(p=>p.vintage===v).reduce((s,p)=>s+p.credits,0)};})}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="vintage" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v)+' tCO₂e']} />
                    <Bar dataKey="credits" fill={T.emerald} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </Card>
            <Card>
              <Section title="Registries">
                {['Verra VCS','Gold Standard','ACR'].map(reg=>{
                  const cnt = HUB_PROJECTS.filter(p=>p.registry===reg).length;
                  const vol = HUB_PROJECTS.filter(p=>p.registry===reg).reduce((s,p)=>s+p.credits,0);
                  return (
                    <div key={reg} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`}}>
                      <span style={{fontSize:10,color:T.navy,fontWeight:600}}>{reg}</span>
                      <span style={{fontSize:10,fontFamily:T.mono,color:T.textSec}}>{cnt} projects · {fmtK(vol)}</span>
                    </div>
                  );
                })}
              </Section>
            </Card>
          </div>
          <Card>
            <Section title="Nature-Based Project Portfolio" right={`${HUB_PROJECTS.length} projects`}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                <thead><tr style={{background:T.navy}}>
                  {['ID','Project','Type','Country','Area','Credits','Price','Vintage','Registry','Status'].map(h=>(
                    <th key={h} style={{padding:'6px 8px',color:T.cream,fontSize:9,fontFamily:T.mono,textAlign:'left',fontWeight:600}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {HUB_PROJECTS.map((p,i)=>(
                    <tr key={p.id} style={{background:i%2===0?T.surface:`${T.cream}50`,borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'5px 8px',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{p.id}</td>
                      <td style={{padding:'5px 8px',fontWeight:600,color:T.navy,maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</td>
                      <td style={{padding:'5px 8px',fontSize:10,color:T.teal}}>{p.type}</td>
                      <td style={{padding:'5px 8px',fontSize:10}}>{p.country}</td>
                      <td style={{padding:'5px 8px',fontFamily:T.mono,fontSize:10}}>{p.area_ha.toLocaleString()}</td>
                      <td style={{padding:'5px 8px',fontFamily:T.mono,fontSize:10,fontWeight:600,color:T.emerald}}>{fmtK(p.credits)}</td>
                      <td style={{padding:'5px 8px',fontFamily:T.mono,fontSize:10,color:T.teal}}>${p.price}</td>
                      <td style={{padding:'5px 8px',fontFamily:T.mono,fontSize:10}}>{p.vintage}</td>
                      <td style={{padding:'5px 8px',fontSize:10}}>{p.registry}</td>
                      <td style={{padding:'5px 8px'}}><Badge v={p.status} colors={{Active:'#059669',Pipeline:'#6b7280',Verification:'#d97706'}} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </Card>
        </>
      )}
    </div>
  );
}
