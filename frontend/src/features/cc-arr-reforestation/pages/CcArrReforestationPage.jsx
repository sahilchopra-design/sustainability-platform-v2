import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, AreaChart, Area, Cell, ReferenceLine,
} from 'recharts';

const T={navy:'#1b3a5c',navyD:'#122a44',gold:'#c5a96a',goldD:'#a8903a',cream:'#f7f4ef',surface:'#ffffff',border:'#e5e0d8',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',sage:'#5a8a6a',red:'#dc2626',green:'#16a34a',amber:'#d97706',teal:'#0f766e',purple:'#6d28d9',emerald:'#059669',font:"'DM Sans',system-ui,sans-serif",mono:"'JetBrains Mono','Fira Code',monospace",card:'0 1px 3px rgba(27,58,92,0.06)'};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const fmt=n=>typeof n==='number'?n.toLocaleString(undefined,{maximumFractionDigits:1}):n;
const fmtK=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);
const TIP={background:T.surface,border:`1px solid ${T.border}`,borderRadius:4,color:T.text,fontSize:11,fontFamily:T.mono};

const TabBar=({tabs,active,onChange})=>(
  <div style={{display:'flex',gap:2,borderBottom:`2px solid ${T.border}`,marginBottom:20,flexWrap:'wrap'}}>
    {tabs.map(t=><button key={t} onClick={()=>onChange(t)} style={{padding:'9px 14px',fontSize:11,fontWeight:600,cursor:'pointer',border:'none',background:'transparent',color:active===t?T.navy:T.textMut,borderBottom:active===t?`2px solid ${T.gold}`:'2px solid transparent',marginBottom:-2,fontFamily:T.font}}>{t}</button>)}
  </div>
);
const Kpi=({label,value,sub,color,accent})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'14px 16px',borderBottom:`3px solid ${accent||T.gold}`,boxShadow:T.card}}>
    <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:color||T.navy,fontFamily:T.mono,lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:T.textSec,marginTop:4}}>{sub}</div>}
  </div>
);
const Section=({title,children,right})=>(
  <div style={{marginBottom:24}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
      <span style={{fontSize:11,fontWeight:700,color:T.navy,textTransform:'uppercase',letterSpacing:'0.1em'}}>{title}</span>
      {right&&<span style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{right}</span>}
    </div>
    {children}
  </div>
);
const Card=({children,style,border})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:16,boxShadow:T.card,...(border?{borderLeft:`4px solid ${border}`}:{}),...style}}>{children}</div>
);
const Badge=({v,colors})=>{const map=colors||{High:'#dc2626',Medium:'#d97706',Low:'#16a34a'};const bg=map[v]||T.textMut;return <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:10,background:`${bg}18`,color:bg,fontFamily:T.mono}}>{v}</span>;};
const DualInput=({label,value,min=0,max=100,step=1,onChange,color,unit=''})=>(
  <div style={{marginBottom:6}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
      <span style={{fontSize:9,color:T.textMut,lineHeight:1.2}}>{label}</span>
      <span style={{fontSize:10,fontFamily:T.mono,fontWeight:600,color:color||T.navy}}>{typeof value==='number'?value.toLocaleString():value}{unit}</span>
    </div>
    <div style={{display:'flex',gap:6,alignItems:'center'}}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} style={{flex:1,accentColor:color||T.teal,height:4,cursor:'pointer'}} />
      <input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Math.min(max,Math.max(min,+e.target.value||0)))} style={{width:64,padding:'3px 5px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:10,fontFamily:T.mono,color:T.navy,background:T.cream,outline:'none',textAlign:'right'}} />
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   ARR METHODOLOGY DATA
   ══════════════════════════════════════════════════════════════════ */
const METHODOLOGIES = [
  { id:'VM0047', name:'ARR v1.0 (Verra)', registry:'Verra VCS', type:'Afforestation/Reforestation', crediting:'30yr', default_max_agb:250, default_k:0.08, default_p:3 },
  { id:'VM0006', name:'Carbon Accounting for Mosaic ARR', registry:'Verra VCS', type:'Mixed ARR', crediting:'30yr', default_max_agb:180, default_k:0.06, default_p:2.5 },
  { id:'AR-ACM0003', name:'ARR CDM Consolidated', registry:'CDM/ACR', type:'A/R Large-Scale', crediting:'20yr', default_max_agb:200, default_k:0.07, default_p:2.8 },
  { id:'EE-M001', name:'EE Terrestrial Forest Restoration', registry:'Equitable Earth', type:'Restoration', crediting:'30yr', default_max_agb:220, default_k:0.075, default_p:3.2 },
];

const CARBON_POOLS = [
  { pool:'AGB', name:'Above-Ground Biomass', desc:'Trees, shrubs, herbs', default_pct:55, color:T.emerald },
  { pool:'BGB', name:'Below-Ground Biomass', desc:'Root systems (RS=0.24-0.28)', default_pct:15, color:T.teal },
  { pool:'SOC', name:'Soil Organic Carbon', desc:'Top 30cm soil carbon', default_pct:20, color:'#854d0e' },
  { pool:'DW', name:'Deadwood', desc:'Standing dead + fallen logs', default_pct:6, color:'#78350f' },
  { pool:'LT', name:'Litter', desc:'Decomposing organic matter', default_pct:4, color:'#92400e' },
];

/* Biomass growth model: CS(t) = max * [1 - exp(-k*t)]^p */
const biomassGrowth = (t, max_agb, k, p) => max_agb * Math.pow(1 - Math.exp(-k * t), p);

/* Full credit calculation */
const calcARR = (params) => {
  const { area_ha, max_agb, k, p, crediting_yrs, rs_ratio, cf, baseline_cs, leakage_pct, buffer_pct, uncertainty_pct } = params;
  const years = [];
  for (let t = 1; t <= crediting_yrs; t++) {
    const agb = biomassGrowth(t, max_agb, k, p);
    const bgb = agb * rs_ratio;
    const total_biomass = agb + bgb;
    const carbon_stock = total_biomass * cf * (44 / 12); // tCO2e per ha
    const project_cs = carbon_stock * area_ha;
    const baseline_total = baseline_cs * area_ha;
    const gross = Math.max(0, project_cs - baseline_total);
    const leakage = gross * (leakage_pct / 100);
    const after_leakage = gross - leakage;
    const buffer = after_leakage * (buffer_pct / 100);
    const after_buffer = after_leakage - buffer;
    const uncertainty_ded = after_buffer * (uncertainty_pct / 100);
    const net = Math.max(0, after_buffer - uncertainty_ded);
    // cumulative_net is a running sum of all net credits issued to date (fixed: was incorrectly storing only current-year net)
    const prior_cumulative = years[t - 2]?.cumulative_net || 0;
    const cumulative_net = prior_cumulative + net;
    years.push({
      year: t, agb: Math.round(agb * 10) / 10, bgb: Math.round(bgb * 10) / 10,
      total_biomass: Math.round(total_biomass * 10) / 10,
      carbon_stock_ha: Math.round(carbon_stock * 10) / 10,
      gross: Math.round(gross), leakage: Math.round(leakage), buffer: Math.round(buffer),
      uncertainty_ded: Math.round(uncertainty_ded), net: Math.round(net),
      annual_increment: Math.round(net), cumulative_net: Math.round(cumulative_net),
    });
  }
  const total_net = years.length > 0 ? years[years.length - 1].cumulative_net : 0;
  return { years, total_net, avg_annual: Math.round(total_net / crediting_yrs) };
};

/* Sample projects */
const PROJECTS = Array.from({ length: 12 }, (_, i) => {
  const m = METHODOLOGIES[i % METHODOLOGIES.length];
  const area = Math.round(5000 + sr(i * 7) * 95000);
  const credits = Math.round(area * (8 + sr(i * 11) * 12) * (15 + sr(i * 13) * 15));
  const countries = ['Brazil','Indonesia','India','Kenya','Colombia','Peru','DRC','Madagascar','Honduras','Ethiopia','Cambodia','Ecuador'];
  const species = ['Mixed tropical','Eucalyptus+native','Teak+mahogany','Acacia+native','Mixed Atlantic Forest','Mangrove+upland','Afromontane','Dry deciduous','Pine+broadleaf','Highland native','Lowland dipterocarp','Cloud forest'];
  return {
    id: `ARR-${String(i+1).padStart(3,'0')}`, name: `${countries[i]} ${['Mosaic','Restoration','Reforestation','Buffer Zone','Corridor','Community','Watershed','Upland','Riparian','Montane','Lowland','Canopy'][i]} Project`,
    country: countries[i], methodology: m.id, registry: m.registry, species: species[i],
    area_ha: area, credits_issued: credits, vintage: 2018 + (i % 6),
    status: i % 5 === 3 ? 'Under Verification' : i === 11 ? 'Pipeline' : 'Active',
    density: Math.round(800 + sr(i * 17) * 1200), survival_pct: Math.round(72 + sr(i * 19) * 25),
    verifier: ['SCS Global','RINA','TÜV SÜD','ERM CVS','Aster Global','SCS Global','DNV','Bureau Veritas','Ruby Canyon','AENOR','Control Union','First Environment'][i],
    price: Math.round((8 + sr(i * 23) * 18) * 10) / 10,
  };
});

/* Sensitivity parameters */
const SENS_PARAMS = [
  { key:'area_ha', label:'Project Area (ha)', range:[5000,200000] },
  { key:'max_agb', label:'Max AGB (tDM/ha)', range:[100,350] },
  { key:'k', label:'Growth Rate k', range:[0.03,0.15] },
  { key:'leakage_pct', label:'Leakage %', range:[2,25] },
  { key:'buffer_pct', label:'Buffer %', range:[10,30] },
  { key:'uncertainty_pct', label:'Uncertainty %', range:[5,20] },
];

/* ══════════════════════════════════════════════════════════════════ */
export default function CcArrReforestationPage() {
  const { addCalculation, addProject, getSummary } = useCarbonCredit();
  const TABS = ['Methodology Overview','Biomass Growth Model','Credit Calculator','Project Registry','Sensitivity Analysis','Monitoring & MRV'];
  const [tab, setTab] = useState(TABS[0]);
  const [selMethod, setSelMethod] = useState(METHODOLOGIES[0]);

  /* Calculator state */
  const [params, setParams] = useState({
    area_ha: 25000, max_agb: 250, k: 0.08, p: 3, crediting_yrs: 30,
    rs_ratio: 0.26, cf: 0.47, baseline_cs: 15, leakage_pct: 10, buffer_pct: 15, uncertainty_pct: 8,
  });
  const setP = useCallback((k, v) => setParams(prev => ({ ...prev, [k]: v })), []);

  const result = useMemo(() => calcARR(params), [params]);

  useEffect(() => {
    if (result && result.total_net > 0) {
      addCalculation({
        projectId: 'CC-LIVE',
        methodology: 'VM0047',
        family: 'nature',
        cluster: 'ARR',
        inputs: params,
        outputs: result,
        net_tco2e: result.total_net || 0,
      });
    }
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Growth model visualization data */
  const growthData = useMemo(() => {
    return Array.from({ length: params.crediting_yrs }, (_, t) => {
      const yr = t + 1;
      const agb = biomassGrowth(yr, params.max_agb, params.k, params.p);
      return { year: yr, AGB: Math.round(agb * 10) / 10, BGB: Math.round(agb * params.rs_ratio * 10) / 10, Total: Math.round(agb * (1 + params.rs_ratio) * 10) / 10, CO2e: Math.round(agb * (1 + params.rs_ratio) * params.cf * (44/12) * 10) / 10 };
    });
  }, [params.max_agb, params.k, params.p, params.rs_ratio, params.cf, params.crediting_yrs]);

  /* Sensitivity analysis */
  const sensitivityData = useMemo(() => {
    return SENS_PARAMS.map(sp => {
      const base = result.total_net;
      const lo = calcARR({ ...params, [sp.key]: sp.range[0] }).total_net;
      const hi = calcARR({ ...params, [sp.key]: sp.range[1] }).total_net;
      return { name: sp.label, low: Math.round((lo - base) / 1000), high: Math.round((hi - base) / 1000), range: Math.round((hi - lo) / 1000) };
    }).sort((a, b) => b.range - a.range);
  }, [params, result.total_net]);

  return (
    <div style={{ fontFamily:T.font, background:T.cream, minHeight:'100vh', padding:'20px 24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, letterSpacing:'0.1em' }}>EP-BQ1</span>
          <span style={{ width:1, height:12, background:T.border }} />
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.emerald, fontWeight:600 }}>NATURE-BASED CARBON CREDITS</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>ARR & Reforestation Carbon Credits</h1>
        <p style={{ fontSize:12, color:T.textSec, marginTop:4 }}>Afforestation, Reforestation & Revegetation · VM0047 · Biomass Growth Model · Interactive Credit Calculator</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        <Kpi label="Projects" value="12" sub="4 Methodologies" accent={T.emerald} />
        <Kpi label="Total Credits" value={fmtK(PROJECTS.reduce((s,p)=>s+p.credits_issued,0))} sub="tCO₂e lifetime" accent={T.teal} />
        <Kpi label="Avg Area" value={fmtK(Math.round(PROJECTS.reduce((s,p)=>s+p.area_ha,0)/12))} sub="hectares/project" accent={T.gold} />
        <Kpi label="Calc Net" value={fmtK(result.total_net)} sub={`tCO₂e over ${params.crediting_yrs}yr`} accent={T.navy} />
        <Kpi label="Avg Annual" value={fmtK(result.avg_annual)} sub="tCO₂e/yr" accent={T.sage} />
        <Kpi label="Carbon Pools" value="5" sub="AGB+BGB+SOC+DW+LT" accent={T.purple} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══ TAB 1: Methodology Overview ═══ */}
      {tab === TABS[0] && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <Card>
              <Section title="ARR Methodologies">
                {METHODOLOGIES.map(m => (
                  <div key={m.id} onClick={()=>setSelMethod(m)} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:4, cursor:'pointer',
                    background: selMethod.id===m.id?`${T.navy}08`:'transparent', border:`1px solid ${selMethod.id===m.id?T.border:'transparent'}`, marginBottom:4,
                  }}>
                    <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut,width:80}}>{m.id}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{m.name}</div>
                      <div style={{fontSize:10,color:T.textSec}}>{m.registry} · {m.type} · {m.crediting}</div>
                    </div>
                  </div>
                ))}
              </Section>
            </Card>
            <Card>
              <Section title="Carbon Pool Architecture">
                {CARBON_POOLS.map(cp => (
                  <div key={cp.pool} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ width:36, height:36, borderRadius:4, background:`${cp.color}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:cp.color, fontFamily:T.mono }}>{cp.pool}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:T.navy }}>{cp.name}</div>
                      <div style={{ fontSize:10, color:T.textSec }}>{cp.desc}</div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:cp.color, fontFamily:T.mono }}>{cp.default_pct}%</div>
                  </div>
                ))}
                <div style={{ marginTop:12, padding:'8px 12px', background:`${T.emerald}08`, borderRadius:4, border:`1px solid ${T.emerald}20` }}>
                  <div style={{ fontSize:10, color:T.textSec }}>Total Carbon Stock = Σ(AGB + BGB + SOC + DW + LT) × CF × 44/12</div>
                  <div style={{ fontSize:10, color:T.textMut, marginTop:2 }}>CF = {params.cf} tC/tDM · Molecular ratio = 44/12 = 3.667</div>
                </div>
              </Section>
            </Card>
          </div>

          <Card style={{marginBottom:16}}>
            <Section title={`${selMethod.name} — Detail`} right={selMethod.id}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[['Registry',selMethod.registry],['Activity Type',selMethod.type],['Crediting Period',selMethod.crediting],['Default Max AGB',selMethod.default_max_agb+' tDM/ha'],['Growth Rate k',selMethod.default_k],['Shape p',selMethod.default_p],['Applicability','Degraded / deforested land'],['Standard','VCS / ACR / EE']].map(([l,v])=>(
                  <div key={l} style={{ padding:'8px 10px', background:T.cream, borderRadius:4 }}>
                    <div style={{fontSize:9,color:T.textMut}}>{l}</div>
                    <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{v}</div>
                  </div>
                ))}
              </div>
            </Section>
          </Card>

          <Card>
            <Section title="Eligible Activities">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {[
                  { act:'Afforestation', desc:'Planting trees on land that has not been forested for ≥10 years', eligible:true },
                  { act:'Reforestation', desc:'Re-establishing forest on recently deforested or degraded land', eligible:true },
                  { act:'Revegetation', desc:'Establishing vegetation on degraded land not qualifying as forest', eligible:true },
                  { act:'Assisted Natural Regeneration', desc:'Protecting degraded areas to allow natural forest regrowth (ANR)', eligible:true },
                  { act:'Agroforestry', desc:'Integrating trees with agricultural crops on same land unit', eligible:true },
                  { act:'Silvopasture', desc:'Combining trees with livestock grazing on managed grasslands', eligible:true },
                ].map(a => (
                  <div key={a.act} style={{ padding:'10px 12px', background:`${T.emerald}06`, border:`1px solid ${T.emerald}20`, borderRadius:4 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:T.navy }}>{a.act}</span>
                      <Badge v={a.eligible?'Eligible':'Excluded'} colors={{Eligible:'#059669',Excluded:'#dc2626'}} />
                    </div>
                    <div style={{ fontSize:10, color:T.textSec, lineHeight:1.4 }}>{a.desc}</div>
                  </div>
                ))}
              </div>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 2: Biomass Growth Model ═══ */}
      {tab === TABS[1] && (
        <>
          <Card style={{marginBottom:16}} border={T.emerald}>
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
              <span style={{fontSize:10,fontFamily:T.mono,color:T.emerald,fontWeight:700}}>CHAPMAN-RICHARDS GROWTH MODEL</span>
              <span style={{fontSize:10,color:T.textMut}}>CS(t) = max_AGB × [1 − exp(−k × t)]^p</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:16}}>
              <div>
                <DualInput label="Max AGB (tDM/ha)" value={params.max_agb} min={50} max={400} step={5} onChange={v=>setP('max_agb',v)} color={T.emerald} />
                <DualInput label="Growth Rate (k)" value={params.k} min={0.02} max={0.2} step={0.005} onChange={v=>setP('k',v)} color={T.teal} />
                <DualInput label="Shape Parameter (p)" value={params.p} min={1} max={5} step={0.1} onChange={v=>setP('p',v)} color={T.navy} />
                <DualInput label="Root:Shoot Ratio" value={params.rs_ratio} min={0.15} max={0.45} step={0.01} onChange={v=>setP('rs_ratio',v)} color={'#854d0e'} />
                <DualInput label="Carbon Fraction (CF)" value={params.cf} min={0.4} max={0.55} step={0.01} onChange={v=>setP('cf',v)} color={T.purple} />
                <DualInput label="Crediting Period (yr)" value={params.crediting_yrs} min={10} max={60} onChange={v=>setP('crediting_yrs',v)} color={T.navy} />
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Biomass Accumulation Over Time (tDM/ha)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Year',position:'insideBottom',offset:-4,fontSize:10}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                    <Area dataKey="AGB" fill={`${T.emerald}30`} stroke={T.emerald} strokeWidth={2} name="AGB" />
                    <Area dataKey="BGB" fill={`${T.teal}20`} stroke={T.teal} strokeWidth={1.5} name="BGB" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <Section title="CO₂e Sequestration Trajectory (tCO₂e/ha)">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{fontSize:10,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Line dataKey="CO2e" stroke={T.navy} strokeWidth={2} dot={false} name="tCO₂e/ha" />
                    <ReferenceLine y={params.baseline_cs} stroke={T.red} strokeDasharray="4 2" label={{value:'Baseline',fill:T.red,fontSize:9}} />
                  </LineChart>
                </ResponsiveContainer>
              </Section>
            </Card>
            <Card>
              <Section title="Key Milestones">
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead><tr style={{background:T.navy}}>
                    {['Milestone','Year','AGB (tDM/ha)','CO₂e/ha'].map(h=><th key={h} style={{padding:'6px 8px',color:T.cream,fontSize:9,fontFamily:T.mono,textAlign:'left'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {[5,10,15,20,25,30].filter(y=>y<=params.crediting_yrs).map((y,i) => {
                      const d = growthData.find(g=>g.year===y);
                      return d ? (
                        <tr key={y} style={{background:i%2===0?T.surface:`${T.cream}50`,borderBottom:`1px solid ${T.border}`}}>
                          <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>Year {y}</td>
                          <td style={{padding:'6px 8px',fontFamily:T.mono}}>{y}</td>
                          <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.emerald}}>{d.AGB}</td>
                          <td style={{padding:'6px 8px',fontFamily:T.mono,fontWeight:700,color:T.navy}}>{d.CO2e}</td>
                        </tr>
                      ) : null;
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop:12, padding:'8px 12px', background:`${T.gold}10`, borderRadius:4 }}>
                  <div style={{fontSize:10,color:T.textSec}}>At year {params.crediting_yrs}: <strong>{growthData[growthData.length-1]?.CO2e} tCO₂e/ha</strong> ({Math.round((growthData[growthData.length-1]?.AGB||0)/params.max_agb*100)}% of max AGB)</div>
                </div>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 3: Credit Calculator ═══ */}
      {tab === TABS[2] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <Card style={{marginBottom:12}} border={T.emerald}>
                <Section title="Step 1 — Project Parameters">
                  <DualInput label="Project Area (ha)" value={params.area_ha} min={100} max={500000} step={100} onChange={v=>setP('area_ha',v)} color={T.emerald} unit=" ha" />
                  <DualInput label="Crediting Period (years)" value={params.crediting_yrs} min={10} max={60} onChange={v=>setP('crediting_yrs',v)} color={T.navy} unit=" yr" />
                  <DualInput label="Max AGB at Maturity (tDM/ha)" value={params.max_agb} min={50} max={400} step={5} onChange={v=>setP('max_agb',v)} color={T.emerald} />
                  <DualInput label="Growth Rate k" value={params.k} min={0.02} max={0.2} step={0.005} onChange={v=>setP('k',v)} color={T.teal} />
                  <DualInput label="Shape Parameter p" value={params.p} min={1} max={5} step={0.1} onChange={v=>setP('p',v)} color={T.navy} />
                  <DualInput label="Root:Shoot Ratio" value={params.rs_ratio} min={0.15} max={0.45} step={0.01} onChange={v=>setP('rs_ratio',v)} color={'#854d0e'} />
                  <DualInput label="Carbon Fraction CF" value={params.cf} min={0.4} max={0.55} step={0.01} onChange={v=>setP('cf',v)} color={T.purple} />
                </Section>
              </Card>
              <Card style={{marginBottom:12}} border={T.red}>
                <Section title="Step 2 — Baseline & Deductions">
                  <DualInput label="Baseline Carbon Stock (tCO₂e/ha)" value={params.baseline_cs} min={0} max={100} step={0.5} onChange={v=>setP('baseline_cs',v)} color={T.amber} />
                  <DualInput label="Leakage Deduction (%)" value={params.leakage_pct} min={0} max={30} onChange={v=>setP('leakage_pct',v)} color={T.red} unit="%" />
                  <DualInput label="Buffer Pool (%)" value={params.buffer_pct} min={5} max={40} onChange={v=>setP('buffer_pct',v)} color={T.amber} unit="%" />
                  <DualInput label="Uncertainty Discount (%)" value={params.uncertainty_pct} min={0} max={25} onChange={v=>setP('uncertainty_pct',v)} color={T.purple} unit="%" />
                </Section>
              </Card>
            </div>
            <div>
              {/* Score summary */}
              <div style={{background:T.navy,borderRadius:6,padding:16,marginBottom:12,color:T.cream}}>
                <div style={{fontSize:10,fontFamily:T.mono,color:`${T.cream}80`,letterSpacing:'0.1em',marginBottom:4}}>NET CREDITS — {params.crediting_yrs} YEAR CREDITING PERIOD</div>
                <div style={{fontSize:48,fontWeight:700,fontFamily:T.mono,lineHeight:1}}>{fmtK(result.total_net)}</div>
                <div style={{fontSize:11,color:`${T.cream}80`,marginTop:4}}>tCO₂e net issuable · {params.area_ha.toLocaleString()} ha · {params.crediting_yrs}yr</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
                  <div style={{padding:8,background:'rgba(255,255,255,0.08)',borderRadius:4,textAlign:'center'}}>
                    <div style={{fontSize:9,color:`${T.cream}60`}}>Avg Annual</div>
                    <div style={{fontSize:16,fontWeight:700,fontFamily:T.mono}}>{fmtK(result.avg_annual)}</div>
                    <div style={{fontSize:9,color:`${T.cream}60`}}>tCO₂e/yr</div>
                  </div>
                  <div style={{padding:8,background:'rgba(255,255,255,0.08)',borderRadius:4,textAlign:'center'}}>
                    <div style={{fontSize:9,color:`${T.cream}60`}}>Per Hectare</div>
                    <div style={{fontSize:16,fontWeight:700,fontFamily:T.mono}}>{fmt(Math.round(result.total_net/params.area_ha*10)/10)}</div>
                    <div style={{fontSize:9,color:`${T.cream}60`}}>tCO₂e/ha total</div>
                  </div>
                </div>
              </div>

              {/* Credit waterfall */}
              <Card style={{marginBottom:12}}>
                <Section title="Credit Waterfall (Year 30)">
                  {(() => {
                    const last = result.years[result.years.length - 1];
                    if (!last) return null;
                    const wf = [
                      { name:'Gross', val:last.gross, color:T.emerald },
                      { name:'−Leakage', val:-last.leakage, color:T.red },
                      { name:'−Buffer', val:-last.buffer, color:T.amber },
                      { name:'−Uncertainty', val:-last.uncertainty_ded, color:T.purple },
                      { name:'Net', val:last.net, color:T.navy },
                    ];
                    return (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={wf}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                          <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                          <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                          <Tooltip contentStyle={TIP} formatter={v=>[fmtK(Math.abs(v))+' tCO₂e']} />
                          <Bar dataKey="val" radius={[3,3,0,0]}>
                            {wf.map((d,i)=><Cell key={i} fill={d.color} opacity={d.val<0?0.6:1} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </Section>
              </Card>

              {/* Cumulative credits chart */}
              <Card>
                <Section title="Cumulative Net Credits (tCO₂e)">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={result.years}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{fontSize:9,fontFamily:T.mono}} />
                      <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                      <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v)+' tCO₂e']} />
                      <Area dataKey="cumulative_net" fill={`${T.emerald}20`} stroke={T.emerald} strokeWidth={2} name="Net Credits" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Section>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ═══ TAB 4: Project Registry ═══ */}
      {tab === TABS[3] && (
        <Card>
          <Section title="ARR Project Registry" right={`${PROJECTS.length} projects`}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:T.navy}}>
                {['ID','Project Name','Country','Methodology','Registry','Area (ha)','Credits (tCO₂e)','Vintage','Density','Survival','Price','Status'].map(h=>(
                  <th key={h} style={{padding:'7px 8px',color:T.cream,fontSize:9,fontFamily:T.mono,textAlign:'left',fontWeight:600}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {PROJECTS.map((p,i)=>(
                  <tr key={p.id} style={{background:i%2===0?T.surface:`${T.cream}50`,borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{p.id}</td>
                    <td style={{padding:'6px 8px',fontWeight:600,color:T.navy,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</td>
                    <td style={{padding:'6px 8px',color:T.textSec,fontSize:10}}>{p.country}</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:9,color:T.teal}}>{p.methodology}</td>
                    <td style={{padding:'6px 8px',fontSize:10}}>{p.registry}</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10}}>{p.area_ha.toLocaleString()}</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10,fontWeight:600,color:T.emerald}}>{p.credits_issued.toLocaleString()}</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10}}>{p.vintage}</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10}}>{p.density}/ha</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10,color:p.survival_pct>=85?T.green:p.survival_pct>=70?T.amber:T.red}}>{p.survival_pct}%</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10,color:T.teal}}>${p.price}</td>
                    <td style={{padding:'6px 8px'}}><Badge v={p.status} colors={{Active:'#059669','Under Verification':'#d97706',Pipeline:'#6b7280'}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </Card>
      )}

      {/* ═══ TAB 5: Sensitivity Analysis ═══ */}
      {tab === TABS[4] && (
        <>
          <Card style={{marginBottom:16}}>
            <Section title="Tornado Chart — Impact on Net Credits (±range, K tCO₂e)" right="Top 6 parameters">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sensitivityData} layout="vertical" margin={{left:110}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Δ Net Credits (K tCO₂e)',position:'insideBottom',offset:-4,fontSize:10}} />
                  <YAxis dataKey="name" type="category" tick={{fontSize:10,fontFamily:T.mono,fill:T.navy}} width={110} />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Bar dataKey="low" fill={T.red} name="Low Scenario" radius={[3,0,0,3]} opacity={0.7} />
                  <Bar dataKey="high" fill={T.emerald} name="High Scenario" radius={[0,3,3,0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Card>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <Section title="Parameter Ranges Used">
                {SENS_PARAMS.map(sp=>(
                  <div key={sp.key} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:10,color:T.textSec}}>{sp.label}</span>
                    <span style={{fontSize:10,fontFamily:T.mono,color:T.navy}}>{sp.range[0]} → {sp.range[1]}</span>
                  </div>
                ))}
              </Section>
            </Card>
            <Card>
              <Section title="Current Scenario Summary">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[['Area',params.area_ha.toLocaleString()+' ha'],['Max AGB',params.max_agb+' tDM/ha'],['Growth k',params.k],['Leakage',params.leakage_pct+'%'],['Buffer',params.buffer_pct+'%'],['Net Credits',fmtK(result.total_net)+' tCO₂e']].map(([l,v])=>(
                    <div key={l} style={{padding:'6px 8px',background:T.cream,borderRadius:3}}>
                      <div style={{fontSize:9,color:T.textMut}}>{l}</div>
                      <div style={{fontSize:11,fontWeight:600,color:T.navy,fontFamily:T.mono}}>{v}</div>
                    </div>
                  ))}
                </div>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 6: Monitoring & MRV ═══ */}
      {tab === TABS[5] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16}}>
            {[
              { title:'Satellite Monitoring', items:['Annual canopy cover analysis','Change detection (Sentinel-2)','LiDAR AGB validation (every 5yr)','Fire alert integration','Deforestation early warning'], color:T.purple },
              { title:'Ground-Truth Sampling', items:['Permanent sample plots (PSPs)','Stratified random design','Allometric equation calibration','Soil carbon sampling (0-30cm)','Species composition surveys'], color:T.emerald },
              { title:'Verification Requirements', items:['VVB desk review (annual)','Field audit (every 5 years)','Non-conformity resolution','Buffer pool reconciliation','Issuance request documentation'], color:T.navy },
            ].map(cat=>(
              <Card key={cat.title} border={cat.color}>
                <div style={{fontSize:11,fontWeight:700,color:cat.color,marginBottom:10}}>{cat.title}</div>
                {cat.items.map(item=>(
                  <div key={item} style={{fontSize:10,color:T.textSec,padding:'3px 0',display:'flex',gap:6,alignItems:'center'}}>
                    <span style={{color:cat.color}}>•</span> {item}
                  </div>
                ))}
              </Card>
            ))}
          </div>
          <Card>
            <Section title="MRV Timeline — 30-Year Crediting Period">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={Array.from({length:6},(_, i)=>({
                  period:`Y${i*5+1}-${(i+1)*5}`, satellite:5, ground_truth:i%2===0?1:0, verification:i%2===0?1:0, issuance:1,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{fontSize:10,fontFamily:T.mono}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                  <Bar dataKey="satellite" fill={T.purple} name="Satellite Passes" stackId="a" />
                  <Bar dataKey="ground_truth" fill={T.emerald} name="Field Campaigns" stackId="a" />
                  <Bar dataKey="verification" fill={T.navy} name="VVB Audits" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}
    </div>
  );
}
