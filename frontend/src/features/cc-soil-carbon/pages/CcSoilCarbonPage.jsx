import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area, Cell, ReferenceLine, PieChart, Pie,
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
   SOIL CARBON SEQUESTRATION ENGINE
   ══════════════════════════════════════════════════════════════════ */

const PRACTICES = [
  { id:'NT', name:'No-Till', desc:'Eliminating tillage to preserve soil structure', soc_rates:{Temperate:0.4,Tropical:0.3,Boreal:0.25,Arid:0.15,Mediterranean:0.35}, cost_per_ha:45 },
  { id:'CC', name:'Cover Crops', desc:'Inter-season cover crop planting for soil C input', soc_rates:{Temperate:0.5,Tropical:0.45,Boreal:0.3,Arid:0.2,Mediterranean:0.4}, cost_per_ha:65 },
  { id:'CM', name:'Compost Application', desc:'Organic matter addition via composted materials', soc_rates:{Temperate:0.8,Tropical:0.6,Boreal:0.4,Arid:0.35,Mediterranean:0.65}, cost_per_ha:120 },
  { id:'BC', name:'Biochar Amendment', desc:'Pyrolyzed biomass soil amendment for stable C', soc_rates:{Temperate:1.2,Tropical:1.0,Boreal:0.7,Arid:0.5,Mediterranean:0.9}, cost_per_ha:280 },
  { id:'RG', name:'Regenerative Grazing', desc:'Managed rotational grazing for grassland C accrual', soc_rates:{Temperate:0.6,Tropical:0.5,Boreal:0.35,Arid:0.25,Mediterranean:0.45}, cost_per_ha:35 },
];

const REGIONS = ['Temperate','Tropical','Boreal','Arid','Mediterranean'];

const PROJECTS = Array.from({length:8},(_, i)=>{
  const countries=['USA','Brazil','Australia','Kenya','India','France','Canada','Argentina'];
  const practiceIdx = i % 5;
  const regionIdx = i % 5;
  return {
    id:`SC-${String(i+1).padStart(3,'0')}`, name:`${countries[i]} ${PRACTICES[practiceIdx].name} Project`,
    country: countries[i], practice: PRACTICES[practiceIdx].id, region: REGIONS[regionIdx],
    area_ha: Math.round(5000+sr(i*11)*45000),
    baseline_soc: Math.round((15+sr(i*13)*50)*10)/10,
    project_soc: Math.round((25+sr(i*17)*60)*10)/10,
    credits: Math.round(50000+sr(i*19)*450000), vintage: 2019+(i%5),
    status: i%3===2?'Verification':'Active',
    verifier: ['SCS Global','RINA','TUV SUD','ERM CVS','Aster Global','DNV','Bureau Veritas','Ruby Canyon'][i],
    depth_cm: [30,30,60,30,100,30,60,30][i],
  };
});

const STRATA = [
  { zone:'A - Cropland Flat', area_pct:35, soil:'Mollisol', texture:'Silt Loam', depth:30, soc_pct:2.1, bd:1.25 },
  { zone:'B - Cropland Slope', area_pct:20, soil:'Alfisol', texture:'Clay Loam', depth:30, soc_pct:1.8, bd:1.30 },
  { zone:'C - Grassland', area_pct:25, soil:'Mollisol', texture:'Loam', depth:30, soc_pct:3.2, bd:1.15 },
  { zone:'D - Riparian', area_pct:10, soil:'Entisol', texture:'Sandy Loam', depth:30, soc_pct:1.5, bd:1.40 },
  { zone:'E - Restored', area_pct:10, soil:'Inceptisol', texture:'Loam', depth:30, soc_pct:1.0, bd:1.35 },
];

const calcSOC_BL = (conc_pct, bulk_density, depth_cm) => {
  return conc_pct * bulk_density * depth_cm * 100 / 100; // tC/ha
};

const calcCredits = (params) => {
  const { baseline_soc, project_soc, area_ha, leakage_pct, buffer_pct, uncertainty_pct, crediting_yrs } = params;
  const delta_soc = Math.max(0, project_soc - baseline_soc);
  const gross = delta_soc * area_ha * (44/12);
  const after_leakage = gross * (1 - leakage_pct/100);
  const after_buffer = after_leakage * (1 - buffer_pct/100);
  const net = after_buffer * (1 - uncertainty_pct/100);
  const years = [];
  for(let t = 1; t <= crediting_yrs; t++){
    const frac = t / crediting_yrs;
    const cum_gross = gross * frac;
    const cum_net = net * frac;
    years.push({ year: t, gross: Math.round(cum_gross), net: Math.round(cum_net), annual: Math.round(net / crediting_yrs) });
  }
  const waterfall = [
    { name:'Gross', value:Math.round(gross), fill:T.emerald },
    { name:'Leakage', value:-Math.round(gross*leakage_pct/100), fill:T.red },
    { name:'Buffer', value:-Math.round(after_leakage*buffer_pct/100), fill:T.amber },
    { name:'Uncertainty', value:-Math.round(after_buffer*uncertainty_pct/100), fill:T.purple },
    { name:'Net', value:Math.round(net), fill:T.navy },
  ];
  return { delta_soc, gross, after_leakage, after_buffer, net, years, waterfall };
};

const calcSampleSize = (variance, confidence, margin) => {
  const z_map = { 90:1.645, 95:1.96, 99:2.576 };
  const z = z_map[confidence] || 1.96;
  return Math.ceil((z * z * variance) / (margin * margin));
};

export default function CcSoilCarbonPage() {
  const TABS = ['Methodology Overview','SOC Baseline Calculator','Credit Calculator','Practice Comparison','Sampling Design','Permanence & Reversals'];
  const [tab, setTab] = useState(TABS[0]);

  /* SOC Baseline inputs */
  const [socPct, setSocPct] = useState(2.5);
  const [bulkDensity, setBulkDensity] = useState(1.25);
  const [samplingDepth, setSamplingDepth] = useState(30);

  /* Credit Calculator inputs */
  const [cp, setCp] = useState({
    baseline_soc: 35, project_soc: 52, area_ha: 10000, leakage_pct: 8, buffer_pct: 20, uncertainty_pct: 10, crediting_yrs: 15,
  });
  const setCpV = useCallback((k,v) => setCp(prev=>({...prev,[k]:v})),[]);

  /* Sampling inputs */
  const [sVariance, setSVariance] = useState(0.8);
  const [sConfidence, setSConfidence] = useState(95);
  const [sMargin, setSMargin] = useState(0.3);

  /* Practice comparison region */
  const [compRegion, setCompRegion] = useState('Temperate');

  const socBL = useMemo(() => calcSOC_BL(socPct, bulkDensity, samplingDepth), [socPct, bulkDensity, samplingDepth]);
  const creditResult = useMemo(() => calcCredits(cp), [cp]);
  const sampleN = useMemo(() => calcSampleSize(sVariance, sConfidence, sMargin), [sVariance, sConfidence, sMargin]);

  const practiceChartData = useMemo(() => PRACTICES.map(p => ({
    name: p.name, rate: p.soc_rates[compRegion], cost: p.cost_per_ha,
  })), [compRegion]);

  const strataCalc = useMemo(() => STRATA.map(s => ({
    ...s, soc_bl: Math.round(calcSOC_BL(s.soc_pct, s.bd, s.depth)*10)/10,
  })), []);

  const avgSOCGain = useMemo(() => {
    const gains = PROJECTS.map(p=>p.project_soc - p.baseline_soc);
    return (gains.reduce((a,b)=>a+b,0)/gains.length).toFixed(1);
  }, []);

  return (
    <div style={{ fontFamily:T.font, background:T.cream, minHeight:'100vh', padding:'20px 24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, letterSpacing:'0.1em' }}>EP-BR1</span>
          <span style={{ width:1, height:12, background:T.border }} />
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.emerald, fontWeight:600 }}>AGRICULTURE CARBON CREDITS</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>Soil Carbon Sequestration</h1>
        <p style={{ fontSize:12, color:T.textSec, marginTop:4 }}>VM0042 · Verra Soil Carbon · CAR · No-Till · Cover Crops · Biochar · Compost · Regen Grazing</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        <Kpi label="Practices" value="5" sub="NT · CC · CM · BC · RG" accent={T.emerald} />
        <Kpi label="Projects" value="8" sub={`${[...new Set(PROJECTS.map(p=>p.country))].length} Countries`} accent={T.teal} />
        <Kpi label="Avg SOC Gain" value={`${avgSOCGain} tC/ha`} sub="Project vs Baseline" accent={T.gold} />
        <Kpi label="Calc Net Credits" value={fmtK(Math.round(creditResult.net))} sub={`${cp.area_ha.toLocaleString()} ha · ${cp.crediting_yrs}yr`} accent={T.navy} />
        <Kpi label="Sampling Depth" value={`${samplingDepth} cm`} sub="Configurable 15-100cm" accent={T.purple} />
        <Kpi label="Permanence" value="15 yr" sub="Minimum commitment" accent={T.amber} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══ TAB 1: Methodology Overview ═══ */}
      {tab === TABS[0] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="Eligible Practices">
                {PRACTICES.map(p=>(
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:4,marginBottom:4,background:`${T.cream}`,border:`1px solid ${T.border}`}}>
                    <span style={{fontSize:10,fontFamily:T.mono,color:T.teal,width:26,fontWeight:700}}>{p.id}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{p.name}</div>
                      <div style={{fontSize:10,color:T.textSec}}>{p.desc}</div>
                    </div>
                    <span style={{fontSize:10,fontFamily:T.mono,color:T.emerald,fontWeight:600}}>{p.soc_rates.Temperate} tC/ha/yr</span>
                  </div>
                ))}
              </Section>
            </Card>
            <Card>
              <Section title="Core Formulas">
                <div style={{padding:12,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:11,lineHeight:2,color:T.navy}}>
                  <div><strong>SOC Baseline:</strong> SOC_BL = Conc% x BD x Depth x 100</div>
                  <div><strong>Gross Credits:</strong> delta_SOC x Area x (44/12)</div>
                  <div><strong>Net:</strong> Gross x (1-Leakage%) x (1-Buffer%) x (1-Uncertainty%)</div>
                </div>
                <div style={{marginTop:12,fontSize:10,color:T.textSec,lineHeight:1.5}}>
                  Where: Conc% = soil organic carbon concentration, BD = bulk density (g/cm3), Depth = sampling depth (cm), delta_SOC = project SOC minus baseline SOC (tC/ha)
                </div>
              </Section>
              <Section title="Applicable Methodologies">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[
                    {id:'VM0042',name:'Methodology for Improved Agricultural Land Management',registry:'Verra VCS',status:'Active'},
                    {id:'VM0017',name:'Sustainable Agricultural Land Management',registry:'Verra VCS',status:'Active'},
                    {id:'CAR-SOC',name:'Soil Enrichment Protocol',registry:'Climate Action Reserve',status:'Active'},
                  ].map(m=>(
                    <div key={m.id} style={{padding:10,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:10,fontFamily:T.mono,color:T.teal,fontWeight:600}}>{m.id}</div>
                      <div style={{fontSize:10,fontWeight:600,color:T.navy,marginTop:4}}>{m.name}</div>
                      <div style={{fontSize:9,color:T.textSec,marginTop:2}}>{m.registry}</div>
                      <Badge v={m.status} colors={{Active:'#059669'}} />
                    </div>
                  ))}
                </div>
              </Section>
            </Card>
          </div>
          <Card>
            <Section title="Sample Projects">
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                  <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                    {['ID','Name','Country','Practice','Region','Area (ha)','BL SOC','PJ SOC','Credits','Vintage','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{PROJECTS.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'6px 8px',color:T.teal,fontWeight:600}}>{p.id}</td>
                    <td style={{padding:'6px 8px',color:T.navy}}>{p.name}</td>
                    <td style={{padding:'6px 8px'}}>{p.country}</td>
                    <td style={{padding:'6px 8px'}}><Badge v={p.practice} colors={{NT:T.emerald,CC:T.teal,CM:T.gold,BC:T.purple,RG:T.sage}} /></td>
                    <td style={{padding:'6px 8px'}}>{p.region}</td>
                    <td style={{padding:'6px 8px',textAlign:'right'}}>{p.area_ha.toLocaleString()}</td>
                    <td style={{padding:'6px 8px',textAlign:'right'}}>{p.baseline_soc}</td>
                    <td style={{padding:'6px 8px',textAlign:'right'}}>{p.project_soc}</td>
                    <td style={{padding:'6px 8px',textAlign:'right',color:T.emerald,fontWeight:600}}>{p.credits.toLocaleString()}</td>
                    <td style={{padding:'6px 8px'}}>{p.vintage}</td>
                    <td style={{padding:'6px 8px'}}><Badge v={p.status} colors={{Active:T.emerald,Verification:T.amber}} /></td>
                  </tr>)}</tbody>
                </table>
              </div>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 2: SOC Baseline Calculator ═══ */}
      {tab === TABS[1] && (
        <>
          <Card style={{marginBottom:16}} border={T.emerald}>
            <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:16}}>
              <div>
                <Section title="SOC Baseline Parameters">
                  <DualInput label="Soil Organic Carbon (%)" value={socPct} min={0.5} max={8} step={0.1} onChange={setSocPct} color={T.emerald} />
                  <DualInput label="Bulk Density (g/cm3)" value={bulkDensity} min={0.8} max={1.8} step={0.01} onChange={setBulkDensity} color={T.teal} />
                  <DualInput label="Sampling Depth (cm)" value={samplingDepth} min={15} max={100} step={5} onChange={setSamplingDepth} color={T.purple} />
                </Section>
                <div style={{padding:12,background:`${T.emerald}0a`,borderRadius:6,border:`1px solid ${T.emerald}30`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>SOC Baseline Result</div>
                  <div style={{fontSize:28,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{socBL.toFixed(1)}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tC/ha (tonnes carbon per hectare)</div>
                </div>
                <div style={{marginTop:12,padding:10,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:10,color:T.navy,lineHeight:1.6}}>
                  SOC_BL = {socPct}% x {bulkDensity} g/cm3 x {samplingDepth} cm x 100<br/>
                  = <strong>{socBL.toFixed(1)} tC/ha</strong>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>SOC Sensitivity: Depth vs Concentration</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={[15,20,30,45,60,80,100].map(d=>({
                    depth:d, low:Math.round(calcSOC_BL(1.0,bulkDensity,d)*10)/10, mid:Math.round(calcSOC_BL(socPct,bulkDensity,d)*10)/10, high:Math.round(calcSOC_BL(5.0,bulkDensity,d)*10)/10,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="depth" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Depth (cm)',position:'insideBottom',offset:-4,fontSize:10}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'tC/ha',angle:-90,position:'insideLeft',fontSize:10}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                    <Area dataKey="high" stroke={T.emerald} fill={`${T.emerald}15`} name="SOC 5.0%" strokeWidth={1.5} />
                    <Area dataKey="mid" stroke={T.teal} fill={`${T.teal}20`} name={`SOC ${socPct}%`} strokeWidth={2} />
                    <Area dataKey="low" stroke={T.amber} fill={`${T.amber}10`} name="SOC 1.0%" strokeWidth={1.5} />
                    <ReferenceLine x={samplingDepth} stroke={T.red} strokeDasharray="3 3" label={{value:'Selected',fill:T.red,fontSize:9}} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
          <Card>
            <Section title="Stratified Zone SOC Table" right="Pre-calculated strata at current BD">
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                  <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                    {['Zone','Area %','Soil Order','Texture','Depth (cm)','SOC %','Bulk Density','SOC_BL (tC/ha)'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{strataCalc.map(s=><tr key={s.zone} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'6px 8px',color:T.navy,fontWeight:600}}>{s.zone}</td>
                    <td style={{padding:'6px 8px',textAlign:'right'}}>{s.area_pct}%</td>
                    <td style={{padding:'6px 8px'}}>{s.soil}</td>
                    <td style={{padding:'6px 8px'}}>{s.texture}</td>
                    <td style={{padding:'6px 8px',textAlign:'right'}}>{s.depth}</td>
                    <td style={{padding:'6px 8px',textAlign:'right'}}>{s.soc_pct}%</td>
                    <td style={{padding:'6px 8px',textAlign:'right'}}>{s.bd}</td>
                    <td style={{padding:'6px 8px',textAlign:'right',color:T.emerald,fontWeight:700}}>{s.soc_bl}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 3: Credit Calculator ═══ */}
      {tab === TABS[2] && (
        <>
          <Card style={{marginBottom:16}} border={T.navy}>
            <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:16}}>
              <div>
                <Section title="Credit Pipeline Inputs">
                  <DualInput label="Baseline SOC (tC/ha)" value={cp.baseline_soc} min={5} max={100} step={1} onChange={v=>setCpV('baseline_soc',v)} color={T.red} />
                  <DualInput label="Project SOC (tC/ha)" value={cp.project_soc} min={5} max={150} step={1} onChange={v=>setCpV('project_soc',v)} color={T.emerald} />
                  <DualInput label="Project Area (ha)" value={cp.area_ha} min={100} max={100000} step={100} onChange={v=>setCpV('area_ha',v)} color={T.navy} />
                  <DualInput label="Crediting Period (yr)" value={cp.crediting_yrs} min={5} max={30} step={1} onChange={v=>setCpV('crediting_yrs',v)} color={T.teal} />
                  <div style={{height:8}} />
                  <DualInput label="Leakage %" value={cp.leakage_pct} min={3} max={15} step={0.5} onChange={v=>setCpV('leakage_pct',v)} color={T.red} unit="%" />
                  <DualInput label="Buffer Pool %" value={cp.buffer_pct} min={15} max={25} step={0.5} onChange={v=>setCpV('buffer_pct',v)} color={T.amber} unit="%" />
                  <DualInput label="Uncertainty %" value={cp.uncertainty_pct} min={5} max={20} step={0.5} onChange={v=>setCpV('uncertainty_pct',v)} color={T.purple} unit="%" />
                </Section>
                <div style={{padding:12,background:`${T.navy}08`,borderRadius:6,border:`1px solid ${T.navy}20`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Delta SOC</div>
                  <div style={{fontSize:16,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{creditResult.delta_soc.toFixed(1)} tC/ha</div>
                  <div style={{marginTop:6,fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Net Credits (Total)</div>
                  <div style={{fontSize:22,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{fmtK(Math.round(creditResult.net))}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tCO2e over {cp.crediting_yrs} years</div>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Credit Waterfall: Gross to Net</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={creditResult.waterfall} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} />
                    <YAxis dataKey="name" type="category" tick={{fontSize:10,fontFamily:T.mono}} width={80} />
                    <Tooltip contentStyle={TIP} formatter={v=>fmtK(Math.abs(v))} />
                    <Bar dataKey="value" radius={[0,3,3,0]}>
                      {creditResult.waterfall.map((e,i)=><Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:12,fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Cumulative Credits Over Crediting Period</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={creditResult.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Year',position:'insideBottom',offset:-4,fontSize:10}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                    <Area dataKey="gross" stroke={T.emerald} fill={`${T.emerald}15`} name="Gross" strokeWidth={1.5} />
                    <Area dataKey="net" stroke={T.navy} fill={`${T.navy}15`} name="Net" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
          <Card>
            <Section title="Annual Credit Issuance" right={`${fmtK(Math.round(creditResult.net / cp.crediting_yrs))} tCO2e/yr avg`}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={creditResult.years}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{fontSize:10,fontFamily:T.mono}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} />
                  <Bar dataKey="annual" fill={T.teal} radius={[2,2,0,0]} name="Annual Credits" />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 4: Practice Comparison ═══ */}
      {tab === TABS[3] && (
        <>
          <Card style={{marginBottom:16}} border={T.teal}>
            <Section title="Region Selection" right="SOC accrual rates vary by climate">
              <div style={{display:'flex',gap:6,marginBottom:16}}>
                {REGIONS.map(r=><button key={r} onClick={()=>setCompRegion(r)} style={{padding:'6px 12px',fontSize:10,fontWeight:600,cursor:'pointer',border:`1px solid ${compRegion===r?T.teal:T.border}`,borderRadius:4,background:compRegion===r?`${T.teal}10`:T.surface,color:compRegion===r?T.teal:T.textSec,fontFamily:T.font}}>{r}</button>)}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>SOC Gain Rate by Practice ({compRegion})</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={practiceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'tC/ha/yr',angle:-90,position:'insideLeft',fontSize:9}} />
                      <Tooltip contentStyle={TIP} />
                      <Bar dataKey="rate" fill={T.emerald} radius={[3,3,0,0]} name="SOC Gain Rate">
                        {practiceChartData.map((_,i)=><Cell key={i} fill={[T.emerald,T.teal,T.gold,T.purple,T.sage][i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Implementation Cost per Hectare</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={practiceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'$/ha',angle:-90,position:'insideLeft',fontSize:9}} />
                      <Tooltip contentStyle={TIP} />
                      <Bar dataKey="cost" fill={T.amber} radius={[3,3,0,0]} name="Cost ($/ha)">
                        {practiceChartData.map((_,i)=><Cell key={i} fill={[T.emerald,T.teal,T.gold,T.purple,T.sage][i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>
          </Card>
          <Card>
            <Section title="Full Practice x Region Matrix" right="tC/ha/yr">
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                  <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                    <th style={{textAlign:'left',padding:'6px 8px',color:T.textMut,fontSize:9}}>PRACTICE</th>
                    {REGIONS.map(r=><th key={r} style={{textAlign:'right',padding:'6px 8px',color:T.textMut,fontSize:9}}>{r.toUpperCase()}</th>)}
                    <th style={{textAlign:'right',padding:'6px 8px',color:T.textMut,fontSize:9}}>COST ($/HA)</th>
                  </tr></thead>
                  <tbody>{PRACTICES.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'6px 8px',color:T.navy,fontWeight:600}}>{p.name}</td>
                    {REGIONS.map(r=><td key={r} style={{padding:'6px 8px',textAlign:'right',color:r===compRegion?T.emerald:T.text,fontWeight:r===compRegion?700:400}}>{p.soc_rates[r]}</td>)}
                    <td style={{padding:'6px 8px',textAlign:'right',color:T.amber}}>${p.cost_per_ha}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 5: Sampling Design ═══ */}
      {tab === TABS[4] && (
        <>
          <Card style={{marginBottom:16}} border={T.purple}>
            <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:16}}>
              <div>
                <Section title="Sample Size Calculator">
                  <DualInput label="SOC Variance (sigma2)" value={sVariance} min={0.1} max={3} step={0.1} onChange={setSVariance} color={T.purple} />
                  <div style={{marginBottom:6}}>
                    <div style={{fontSize:9,color:T.textMut,marginBottom:4}}>Confidence Level</div>
                    <div style={{display:'flex',gap:4}}>
                      {[90,95,99].map(c=><button key={c} onClick={()=>setSConfidence(c)} style={{padding:'4px 10px',fontSize:10,fontWeight:600,cursor:'pointer',border:`1px solid ${sConfidence===c?T.purple:T.border}`,borderRadius:4,background:sConfidence===c?`${T.purple}10`:T.surface,color:sConfidence===c?T.purple:T.textSec,fontFamily:T.mono}}>{c}%</button>)}
                    </div>
                  </div>
                  <DualInput label="Margin of Error (tC/ha)" value={sMargin} min={0.1} max={2} step={0.1} onChange={setSMargin} color={T.teal} />
                </Section>
                <div style={{padding:12,background:`${T.purple}0a`,borderRadius:6,border:`1px solid ${T.purple}30`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Min. Sample Points</div>
                  <div style={{fontSize:28,fontWeight:700,color:T.purple,fontFamily:T.mono}}>{sampleN}</div>
                  <div style={{fontSize:10,color:T.textSec}}>at {sConfidence}% confidence, +/- {sMargin} tC/ha</div>
                </div>
                <div style={{marginTop:10,padding:10,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:10,color:T.navy,lineHeight:1.6}}>
                  n = (z2 x sigma2) / E2<br/>
                  n = ({sConfidence===90?'1.645':sConfidence===95?'1.960':'2.576'}2 x {sVariance}) / {sMargin}2<br/>
                  n = <strong>{sampleN} samples</strong>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Sample Size Sensitivity: Variance vs Confidence</div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={[0.2,0.4,0.6,0.8,1.0,1.5,2.0,2.5,3.0].map(v=>({
                    variance:v,
                    c90:calcSampleSize(v,90,sMargin),
                    c95:calcSampleSize(v,95,sMargin),
                    c99:calcSampleSize(v,99,sMargin),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="variance" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Variance',position:'insideBottom',offset:-4,fontSize:10}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'n (samples)',angle:-90,position:'insideLeft',fontSize:10}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                    <Line dataKey="c90" stroke={T.amber} strokeWidth={1.5} name="90% CI" dot={false} />
                    <Line dataKey="c95" stroke={T.teal} strokeWidth={2} name="95% CI" dot={false} />
                    <Line dataKey="c99" stroke={T.purple} strokeWidth={1.5} name="99% CI" dot={false} />
                    <ReferenceLine y={sampleN} stroke={T.red} strokeDasharray="3 3" label={{value:`n=${sampleN}`,fill:T.red,fontSize:9}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
          <Card>
            <Section title="Stratified Random Sampling Layout">
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
                {STRATA.map(s=>{
                  const pts = Math.ceil(sampleN * s.area_pct / 100);
                  return (
                    <div key={s.zone} style={{padding:12,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`,textAlign:'center'}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:4}}>{s.zone}</div>
                      <div style={{fontSize:22,fontWeight:700,color:T.purple,fontFamily:T.mono}}>{pts}</div>
                      <div style={{fontSize:9,color:T.textSec}}>sample points</div>
                      <div style={{fontSize:9,color:T.textMut,marginTop:4}}>{s.area_pct}% of total area</div>
                      <div style={{fontSize:9,color:T.textMut}}>{s.soil} / {s.texture}</div>
                    </div>
                  );
                })}
              </div>
            </Section>
            <Section title="Depth Profile Visualization">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  {depth:'0-15 cm',soc:Math.round(socPct*1.3*10)/10,bd:Math.round((bulkDensity-0.1)*100)/100},
                  {depth:'15-30 cm',soc:Math.round(socPct*1.0*10)/10,bd:Math.round(bulkDensity*100)/100},
                  {depth:'30-60 cm',soc:Math.round(socPct*0.6*10)/10,bd:Math.round((bulkDensity+0.1)*100)/100},
                  {depth:'60-100 cm',soc:Math.round(socPct*0.3*10)/10,bd:Math.round((bulkDensity+0.2)*100)/100},
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} />
                  <YAxis dataKey="depth" type="category" tick={{fontSize:10,fontFamily:T.mono}} width={80} />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                  <Bar dataKey="soc" fill={T.emerald} name="SOC %" radius={[0,3,3,0]} />
                  <Bar dataKey="bd" fill={T.navy} name="Bulk Density" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 6: Permanence & Reversals ═══ */}
      {tab === TABS[5] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card border={T.amber}>
              <Section title="15-Year Permanence Commitment">
                <div style={{padding:12,background:T.cream,borderRadius:4,marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:6}}>Soil Carbon Permanence Requirements</div>
                  <div style={{fontSize:10,color:T.textSec,lineHeight:1.6}}>
                    All soil carbon credits require a minimum 15-year permanence commitment from project start. During this period, the project proponent must maintain management practices that preserve or increase soil organic carbon stocks. Annual monitoring and periodic verification are mandated.
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[
                    {label:'Min. Commitment',value:'15 years',color:T.navy},
                    {label:'Monitoring Freq.',value:'Annual',color:T.teal},
                    {label:'Verification Cycle',value:'5 years',color:T.emerald},
                    {label:'Buffer Pool',value:'15-25%',color:T.amber},
                  ].map(k=><div key={k.label} style={{padding:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:4,textAlign:'center'}}>
                    <div style={{fontSize:9,color:T.textMut,marginBottom:4}}>{k.label}</div>
                    <div style={{fontSize:16,fontWeight:700,color:k.color,fontFamily:T.mono}}>{k.value}</div>
                  </div>)}
                </div>
              </Section>
            </Card>
            <Card border={T.red}>
              <Section title="Reversal Risk Factors">
                {[
                  {risk:'Land Use Change',severity:'High',desc:'Conversion from agricultural to developed land releases stored soil carbon',prob:'5-15%'},
                  {risk:'Tillage Resumption',severity:'High',desc:'Return to conventional tillage after no-till period reverses SOC gains',prob:'10-20%'},
                  {risk:'Drought / Wildfire',severity:'Medium',desc:'Extended drought or fire events reduce biomass input and can volatilize SOC',prob:'3-8%'},
                  {risk:'Erosion Events',severity:'Medium',desc:'Severe erosion events redistribute and potentially mineralise stored carbon',prob:'2-5%'},
                  {risk:'Practice Abandonment',severity:'Low',desc:'Economic pressure leads to discontinuation of carbon-positive practices',prob:'5-10%'},
                ].map(r=>(
                  <div key={r.risk} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:4,marginBottom:4,background:`${T.cream}`,border:`1px solid ${T.border}`}}>
                    <Badge v={r.severity} />
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{r.risk}</div>
                      <div style={{fontSize:9,color:T.textSec}}>{r.desc}</div>
                    </div>
                    <span style={{fontSize:10,fontFamily:T.mono,color:T.red,fontWeight:600}}>{r.prob}</span>
                  </div>
                ))}
              </Section>
            </Card>
          </div>
          <Card>
            <Section title="Tonne-Year Accounting">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div style={{padding:12,background:T.cream,borderRadius:4}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:8}}>How Tonne-Year Accounting Works</div>
                  <div style={{fontSize:10,color:T.textSec,lineHeight:1.6}}>
                    Tonne-year accounting quantifies the climate benefit of temporary carbon storage by crediting the number of tonne-years of storage achieved. One tonne stored for one year equals one tonne-year. Under a 100-year equivalence approach, storing 1 tCO2 for 100 years is equivalent to permanently avoiding 1 tCO2 of emissions. This means 1 tCO2 stored for 15 years represents 0.15 permanent equivalence credits.
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Tonne-Year Accumulation (1 tCO2 stored)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={Array.from({length:16},(_,i)=>({year:i,ty:i,equiv:Math.round(i/100*1000)/1000}))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Year',position:'insideBottom',offset:-4,fontSize:10}} />
                      <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Tonne-Years',angle:-90,position:'insideLeft',fontSize:10}} />
                      <Tooltip contentStyle={TIP} />
                      <Area dataKey="ty" stroke={T.navy} fill={`${T.navy}15`} name="Tonne-Years" strokeWidth={2} />
                      <ReferenceLine y={15} stroke={T.emerald} strokeDasharray="3 3" label={{value:'15yr target',fill:T.emerald,fontSize:9}} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>
          </Card>
        </>
      )}
    </div>
  );
}
