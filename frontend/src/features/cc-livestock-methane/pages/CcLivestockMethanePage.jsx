import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area, Cell, ReferenceLine, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
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
   LIVESTOCK METHANE REDUCTION ENGINE
   ══════════════════════════════════════════════════════════════════ */

const CLIMATE_REGIONS = [
  { id:'cool', name:'Cool / Boreal', mcf:0.10, temp_range:'<15C' },
  { id:'temperate', name:'Temperate', mcf:0.30, temp_range:'15-25C' },
  { id:'warm', name:'Warm / Subtropical', mcf:0.60, temp_range:'25-30C' },
  { id:'hot', name:'Hot / Tropical', mcf:0.80, temp_range:'>30C' },
];

const FEED_ADDITIVES = [
  { id:'3NOP', name:'3-NOP (Bovaer)', reduction_pct:30, dose:'60 mg/kg DM', cost_per_head_yr:45, notes:'Enzyme inhibitor, approved EU/AU/BR' },
  { id:'SEAWEED', name:'Asparagopsis (Seaweed)', reduction_pct:50, dose:'0.2% DM', cost_per_head_yr:80, notes:'Bromoform-based, supply-limited' },
  { id:'FAT', name:'Fat Supplementation', reduction_pct:15, dose:'3-5% DM', cost_per_head_yr:25, notes:'Lipid energy bypass, widely available' },
  { id:'NITRATE', name:'Nitrate Supplementation', reduction_pct:20, dose:'2% DM', cost_per_head_yr:30, notes:'Alternate H2 sink, toxicity risk mgmt' },
];

const PROJECTS = Array.from({length:10},(_, i)=>{
  const countries=['Brazil','India','USA','Kenya','Australia','Ireland','New Zealand','Argentina','Ethiopia','France'];
  const pathway = i%2===0?'Enteric':'Manure';
  return {
    id:`LM-${String(i+1).padStart(3,'0')}`, name:`${countries[i]} ${pathway} Reduction`,
    country: countries[i], pathway, herd_size: Math.round(2000+sr(i*11)*48000),
    ch4_avoided_tco2e: Math.round(5000+sr(i*13)*95000),
    additive: i<4?FEED_ADDITIVES[i%4].id:null,
    climate: CLIMATE_REGIONS[i%4].id, vintage: 2020+(i%5),
    status: i%4===3?'Verification':'Active',
    buffer_pct: Math.round(10+sr(i*17)*10),
  };
});

const calcEnteric = (params) => {
  const { gross_energy_mj, ym_bl, ym_pj, head_count, gwp, buffer_pct } = params;
  const ch4_bl = gross_energy_mj * ym_bl * 365 * head_count / 55.65; // kg CH4/yr — IPCC 2006 GL & 2019 Refinement: 55.65 MJ/kg CH4
  const ch4_pj = gross_energy_mj * ym_pj * 365 * head_count / 55.65;
  const ch4_avoided_kg = ch4_bl - ch4_pj;
  const tco2e_bl = ch4_bl / 1000 * gwp;
  const tco2e_pj = ch4_pj / 1000 * gwp;
  const gross_credits = (ch4_avoided_kg / 1000) * gwp;
  const net_credits = gross_credits * (1 - buffer_pct/100);
  return { ch4_bl:Math.round(ch4_bl), ch4_pj:Math.round(ch4_pj), ch4_avoided_kg:Math.round(ch4_avoided_kg), tco2e_bl:Math.round(tco2e_bl), tco2e_pj:Math.round(tco2e_pj), gross_credits:Math.round(gross_credits), net_credits:Math.round(net_credits) };
};

const calcManure = (params) => {
  const { vs_kg, b0, mcf, head_count, gwp, buffer_pct, reduction_pct } = params;
  const ch4_bl = vs_kg * b0 * mcf * 0.67 * head_count * 365; // kg CH4/yr
  const ch4_pj = ch4_bl * (1 - reduction_pct/100);
  const ch4_avoided_kg = ch4_bl - ch4_pj;
  const tco2e_bl = ch4_bl / 1000 * gwp;
  const tco2e_pj = ch4_pj / 1000 * gwp;
  const gross_credits = (ch4_avoided_kg / 1000) * gwp;
  const net_credits = gross_credits * (1 - buffer_pct/100);
  return { ch4_bl:Math.round(ch4_bl), ch4_pj:Math.round(ch4_pj), ch4_avoided_kg:Math.round(ch4_avoided_kg), tco2e_bl:Math.round(tco2e_bl), tco2e_pj:Math.round(tco2e_pj), gross_credits:Math.round(gross_credits), net_credits:Math.round(net_credits) };
};

export default function CcLivestockMethanePage() {
  const { addCalculation, addProject, getSummary } = useCarbonCredit();
  const TABS = ['Methodology Overview','Enteric Fermentation Calculator','Manure Management Calculator','Feed Additive Scenarios','GWP Accounting','Herd Monitoring'];
  const [tab, setTab] = useState(TABS[0]);

  /* GWP mode */
  const [gwpMode, setGwpMode] = useState('GWP-100');

  /* Enteric inputs */
  const [ent, setEnt] = useState({
    gross_energy_mj:180, ym_bl:0.065, ym_pj:0.040, head_count:5000, gwp:27.2, buffer_pct:15, // AR6 GWP-100: CH4=27.2
  });
  const setE = useCallback((k,v) => setEnt(prev=>({...prev,[k]:v})),[]);

  /* Manure inputs */
  const [man, setMan] = useState({
    vs_kg:6.0, b0:0.24, mcf:0.30, head_count:5000, gwp:27.2, buffer_pct:15, reduction_pct:50, // AR6 GWP-100: CH4=27.2
  });
  const setM = useCallback((k,v) => setMan(prev=>({...prev,[k]:v})),[]);
  const [climateIdx, setClimateIdx] = useState(1);

  const entResult = useMemo(() => calcEnteric(ent), [ent]);
  const manResult = useMemo(() => calcManure(man), [man]);

  useEffect(() => {
    const total = (entResult?.net_credits || 0) + (manResult?.net_credits || 0);
    if (total > 0) {
      addCalculation({
        projectId: 'CC-LIVE',
        methodology: 'AMS-III.BF',
        family: 'agriculture',
        cluster: 'Livestock Methane',
        inputs: { enteric: ent, manure: man },
        outputs: { entResult, manResult },
        net_tco2e: total,
      });
    }
  }, [entResult, manResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCH4Avoided = useMemo(() => PROJECTS.reduce((s,p)=>s+p.ch4_avoided_tco2e,0), []);
  const avgHerd = useMemo(() => Math.round(PROJECTS.reduce((s,p)=>s+p.herd_size,0)/PROJECTS.length), []);

  /* Update MCF when climate changes */
  const handleClimateChange = useCallback((idx) => {
    setClimateIdx(idx);
    setM('mcf', CLIMATE_REGIONS[idx].mcf);
  }, [setM]);

  /* GWP* flow vs pulse data */
  const gwpCompare = useMemo(() => {
    const years = [];
    for(let t=0;t<=50;t++){
      const pulse100 = 27.2; // IPCC AR6 GWP-100: CH4=27.2
      const flowRate = t < 20 ? 27.2 * (1 - t/40) : 27.2 * 0.5; // simplified declining
      years.push({ year:t, gwp100:pulse100, gwpStar:Math.round(flowRate*10)/10 });
    }
    return years;
  }, []);

  return (
    <div style={{ fontFamily:T.font, background:T.cream, minHeight:'100vh', padding:'20px 24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, letterSpacing:'0.1em' }}>EP-BR2</span>
          <span style={{ width:1, height:12, background:T.border }} />
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.emerald, fontWeight:600 }}>AGRICULTURE CARBON CREDITS</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>Livestock Methane Reduction</h1>
        <p style={{ fontSize:12, color:T.textSec, marginTop:4 }}>AMS-III.BF · VM0041 · Enteric Fermentation · Manure Management · Feed Additives · GWP Accounting</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        <Kpi label="Pathways" value="2" sub="Enteric · Manure" accent={T.emerald} />
        <Kpi label="Projects" value="10" sub={`${[...new Set(PROJECTS.map(p=>p.country))].length} Countries`} accent={T.teal} />
        <Kpi label="Avg Herd Size" value={fmtK(avgHerd)} sub="head per project" accent={T.gold} />
        <Kpi label="Total CH4 Avoided" value={fmtK(totalCH4Avoided)} sub="tCO2e all projects" accent={T.navy} />
        <Kpi label="GWP Mode" value={gwpMode} sub={gwpMode==='GWP-100'?'Pulse (27.2x AR6)':'Flow-based'} accent={T.purple} />
        <Kpi label="Buffer Rate" value={`${ent.buffer_pct}%`} sub="Non-permanence pool" accent={T.amber} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══ TAB 1: Methodology Overview ═══ */}
      {tab === TABS[0] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="Emission Pathways">
                {[
                  {id:'Enteric',icon:'E',desc:'Methane produced during ruminant digestion (eructation). Primary source for cattle, sheep, goats.',share:'~70%',formula:'CH4 = GE x Ym x 365 x N / 55.5'},
                  {id:'Manure',icon:'M',desc:'Methane from anaerobic decomposition of livestock manure in storage and lagoons.',share:'~30%',formula:'CH4 = VS x B0 x MCF x 0.67 x N'},
                ].map(p=>(
                  <div key={p.id} style={{padding:12,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`,marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                      <span style={{width:28,height:28,borderRadius:14,background:`${T.teal}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:T.teal,fontFamily:T.mono}}>{p.icon}</span>
                      <div style={{flex:1}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{p.id} Fermentation</span>
                        <span style={{fontSize:10,color:T.emerald,fontFamily:T.mono,marginLeft:8}}>{p.share}</span>
                      </div>
                    </div>
                    <div style={{fontSize:10,color:T.textSec,marginBottom:6}}>{p.desc}</div>
                    <div style={{padding:6,background:T.surface,borderRadius:3,fontFamily:T.mono,fontSize:10,color:T.navy}}>{p.formula}</div>
                  </div>
                ))}
              </Section>
              <Section title="Applicable Methodologies">
                {[
                  {id:'AMS-III.BF',name:'Reduction of Methane Emissions from Livestock',registry:'UNFCCC CDM',status:'Active'},
                  {id:'VM0041',name:'Methane Emission Reduction from Manure Management',registry:'Verra VCS',status:'Active'},
                  {id:'ACR-LMEC',name:'Livestock Methane Emission Credits',registry:'ACR',status:'Draft'},
                ].map(m=>(
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:4,marginBottom:4,background:T.surface,border:`1px solid ${T.border}`}}>
                    <span style={{fontSize:10,fontFamily:T.mono,color:T.teal,fontWeight:700,width:80}}>{m.id}</span>
                    <div style={{flex:1,fontSize:10,color:T.navy}}>{m.name}</div>
                    <Badge v={m.status} colors={{Active:T.emerald,Draft:T.amber}} />
                  </div>
                ))}
              </Section>
            </Card>
            <Card>
              <Section title="Sample Projects">
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                    <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                      {['ID','Country','Pathway','Herd','CH4 Avoided','Climate','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 6px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                    </tr></thead>
                    <tbody>{PROJECTS.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'5px 6px',color:T.teal,fontWeight:600}}>{p.id}</td>
                      <td style={{padding:'5px 6px'}}>{p.country}</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.pathway} colors={{Enteric:T.emerald,Manure:T.purple}} /></td>
                      <td style={{padding:'5px 6px',textAlign:'right'}}>{p.herd_size.toLocaleString()}</td>
                      <td style={{padding:'5px 6px',textAlign:'right',color:T.emerald,fontWeight:600}}>{p.ch4_avoided_tco2e.toLocaleString()}</td>
                      <td style={{padding:'5px 6px'}}>{p.climate}</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.status} colors={{Active:T.emerald,Verification:T.amber}} /></td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 2: Enteric Fermentation Calculator ═══ */}
      {tab === TABS[1] && (
        <>
          <Card style={{marginBottom:16}} border={T.emerald}>
            <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:16}}>
              <div>
                <Section title="Enteric CH4 Parameters">
                  <DualInput label="Gross Energy (MJ/head/day)" value={ent.gross_energy_mj} min={80} max={350} step={5} onChange={v=>setE('gross_energy_mj',v)} color={T.navy} />
                  <DualInput label="Baseline Ym (conv. factor)" value={ent.ym_bl} min={0.03} max={0.075} step={0.001} onChange={v=>setE('ym_bl',v)} color={T.red} />
                  <DualInput label="Project Ym (after intervention)" value={ent.ym_pj} min={0.015} max={0.075} step={0.001} onChange={v=>setE('ym_pj',v)} color={T.emerald} />
                  <DualInput label="Head Count" value={ent.head_count} min={100} max={50000} step={100} onChange={v=>setE('head_count',v)} color={T.teal} />
                  <DualInput label="GWP CH4" value={ent.gwp} min={25} max={84} step={1} onChange={v=>setE('gwp',v)} color={T.purple} />
                  <DualInput label="Buffer %" value={ent.buffer_pct} min={5} max={25} step={1} onChange={v=>setE('buffer_pct',v)} color={T.amber} unit="%" />
                </Section>
                <div style={{padding:12,background:`${T.emerald}0a`,borderRadius:6,border:`1px solid ${T.emerald}30`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Net Credits</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{fmtK(entResult.net_credits)}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tCO2e/yr ({ent.head_count.toLocaleString()} head)</div>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Baseline vs Project Emissions</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    {name:'Baseline CH4',kg:entResult.ch4_bl,tco2e:entResult.tco2e_bl},
                    {name:'Project CH4',kg:entResult.ch4_pj,tco2e:entResult.tco2e_pj},
                    {name:'CH4 Avoided',kg:entResult.ch4_avoided_kg,tco2e:entResult.gross_credits},
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'tCO2e',angle:-90,position:'insideLeft',fontSize:9}} />
                    <Tooltip contentStyle={TIP} />
                    <Bar dataKey="tco2e" radius={[3,3,0,0]} name="tCO2e">
                      <Cell fill={T.red} /><Cell fill={T.emerald} /><Cell fill={T.navy} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:12,padding:10,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:10,color:T.navy,lineHeight:1.8}}>
                  <div>CH4_BL = {ent.gross_energy_mj} x {ent.ym_bl} x 365 x {ent.head_count.toLocaleString()} / 55.5 = <strong>{entResult.ch4_bl.toLocaleString()} kg/yr</strong></div>
                  <div>CH4_PJ = {ent.gross_energy_mj} x {ent.ym_pj} x 365 x {ent.head_count.toLocaleString()} / 55.5 = <strong>{entResult.ch4_pj.toLocaleString()} kg/yr</strong></div>
                  <div>Gross Credits = {entResult.ch4_avoided_kg.toLocaleString()} kg / 1000 x {ent.gwp} = <strong>{entResult.gross_credits.toLocaleString()} tCO2e</strong></div>
                  <div>Net = {entResult.gross_credits.toLocaleString()} x (1 - {ent.buffer_pct}%) = <strong style={{color:T.emerald}}>{entResult.net_credits.toLocaleString()} tCO2e</strong></div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <Section title="Ym Sensitivity Analysis" right="Impact of Ym reduction on credits">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[0.03,0.035,0.04,0.045,0.05,0.055,0.06,0.065,0.07,0.075].map(ym=>{
                  const r = calcEnteric({...ent, ym_pj:ym});
                  return { ym, credits:r.net_credits };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="ym" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Project Ym',position:'insideBottom',offset:-4,fontSize:10}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} />
                  <Line dataKey="credits" stroke={T.emerald} strokeWidth={2} name="Net Credits (tCO2e)" dot={{r:3,fill:T.emerald}} />
                  <ReferenceLine x={ent.ym_pj} stroke={T.red} strokeDasharray="3 3" label={{value:'Current',fill:T.red,fontSize:9}} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 3: Manure Management Calculator ═══ */}
      {tab === TABS[2] && (
        <>
          <Card style={{marginBottom:16}} border={T.purple}>
            <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:16}}>
              <div>
                <Section title="Manure CH4 Parameters">
                  <DualInput label="Volatile Solids (kg/head/day)" value={man.vs_kg} min={2} max={12} step={0.5} onChange={v=>setM('vs_kg',v)} color={T.navy} />
                  <DualInput label="B0 Max CH4 Capacity (m3/kg VS)" value={man.b0} min={0.1} max={0.5} step={0.01} onChange={v=>setM('b0',v)} color={T.teal} />
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:9,color:T.textMut,marginBottom:4}}>Climate Region (MCF)</div>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {CLIMATE_REGIONS.map((c,idx)=><button key={c.id} onClick={()=>handleClimateChange(idx)} style={{padding:'4px 8px',fontSize:9,fontWeight:600,cursor:'pointer',border:`1px solid ${climateIdx===idx?T.purple:T.border}`,borderRadius:4,background:climateIdx===idx?`${T.purple}10`:T.surface,color:climateIdx===idx?T.purple:T.textSec,fontFamily:T.mono}}>{c.name} ({c.mcf})</button>)}
                    </div>
                  </div>
                  <DualInput label="Head Count" value={man.head_count} min={100} max={50000} step={100} onChange={v=>setM('head_count',v)} color={T.teal} />
                  <DualInput label="Reduction % (intervention)" value={man.reduction_pct} min={10} max={90} step={5} onChange={v=>setM('reduction_pct',v)} color={T.emerald} unit="%" />
                  <DualInput label="GWP CH4" value={man.gwp} min={25} max={84} step={1} onChange={v=>setM('gwp',v)} color={T.purple} />
                  <DualInput label="Buffer %" value={man.buffer_pct} min={5} max={25} step={1} onChange={v=>setM('buffer_pct',v)} color={T.amber} unit="%" />
                </Section>
                <div style={{padding:12,background:`${T.purple}0a`,borderRadius:6,border:`1px solid ${T.purple}30`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Net Credits</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.purple,fontFamily:T.mono}}>{fmtK(manResult.net_credits)}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tCO2e/yr · MCF={man.mcf}</div>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Baseline vs Project Manure Emissions</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    {name:'Baseline',tco2e:manResult.tco2e_bl},
                    {name:'Project',tco2e:manResult.tco2e_pj},
                    {name:'Gross Credits',tco2e:manResult.gross_credits},
                    {name:'Net Credits',tco2e:manResult.net_credits},
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Bar dataKey="tco2e" radius={[3,3,0,0]}>
                      <Cell fill={T.red} /><Cell fill={T.emerald} /><Cell fill={T.navy} /><Cell fill={T.purple} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:8,fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>MCF Sensitivity Across Climate Regions</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={CLIMATE_REGIONS.map(c=>{
                    const r = calcManure({...man, mcf:c.mcf});
                    return { name:c.name, net:r.net_credits, mcf:c.mcf };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Bar dataKey="net" fill={T.purple} radius={[3,3,0,0]} name="Net Credits">
                      {CLIMATE_REGIONS.map((_,i)=><Cell key={i} fill={i===climateIdx?T.purple:`${T.purple}50`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ═══ TAB 4: Feed Additive Scenarios ═══ */}
      {tab === TABS[3] && (
        <>
          <Card style={{marginBottom:16}} border={T.teal}>
            <Section title="Feed Additive Efficacy Comparison">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Enteric CH4 Reduction by Additive (%)</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={FEED_ADDITIVES.map(a=>({name:a.name,reduction:a.reduction_pct,cost:a.cost_per_head_yr}))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} angle={-10} textAnchor="end" height={50} />
                      <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Reduction %',angle:-90,position:'insideLeft',fontSize:9}} domain={[0,60]} />
                      <Tooltip contentStyle={TIP} />
                      <Bar dataKey="reduction" fill={T.emerald} radius={[3,3,0,0]} name="CH4 Reduction %">
                        {FEED_ADDITIVES.map((_,i)=><Cell key={i} fill={[T.emerald,T.teal,T.gold,T.purple][i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Cost per Head per Year ($)</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={FEED_ADDITIVES.map(a=>({name:a.name,cost:a.cost_per_head_yr,credits:Math.round(calcEnteric({...ent,ym_pj:ent.ym_bl*(1-a.reduction_pct/100)}).net_credits / ent.head_count * 10)/10 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} angle={-10} textAnchor="end" height={50} />
                      <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'$/head/yr',angle:-90,position:'insideLeft',fontSize:9}} />
                      <Tooltip contentStyle={TIP} />
                      <Bar dataKey="cost" fill={T.amber} radius={[3,3,0,0]} name="Cost ($/head/yr)">
                        {FEED_ADDITIVES.map((_,i)=><Cell key={i} fill={[T.emerald,T.teal,T.gold,T.purple][i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>
          </Card>
          <Card>
            <Section title="Additive Detail & Cost-Benefit">
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                  <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                    {['Additive','Dose','Reduction','Cost/Head/Yr','Credits/Head','Net $/tCO2e','Notes'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{FEED_ADDITIVES.map(a=>{
                    const r = calcEnteric({...ent, ym_pj:ent.ym_bl*(1-a.reduction_pct/100)});
                    const creditsPerHead = r.net_credits / ent.head_count;
                    const costPerTon = creditsPerHead > 0 ? a.cost_per_head_yr / creditsPerHead : 0;
                    return <tr key={a.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'6px 8px',color:T.navy,fontWeight:600}}>{a.name}</td>
                      <td style={{padding:'6px 8px'}}>{a.dose}</td>
                      <td style={{padding:'6px 8px',color:T.emerald,fontWeight:600}}>-{a.reduction_pct}%</td>
                      <td style={{padding:'6px 8px',color:T.amber}}>${a.cost_per_head_yr}</td>
                      <td style={{padding:'6px 8px',textAlign:'right'}}>{creditsPerHead.toFixed(2)} tCO2e</td>
                      <td style={{padding:'6px 8px',textAlign:'right',color:costPerTon>50?T.red:T.emerald,fontWeight:600}}>${costPerTon.toFixed(1)}</td>
                      <td style={{padding:'6px 8px',fontSize:9,color:T.textSec}}>{a.notes}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 5: GWP Accounting ═══ */}
      {tab === TABS[4] && (
        <>
          <Card style={{marginBottom:16}} border={T.purple}>
            <Section title="GWP Metric Toggle">
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                {['GWP-100','GWP*'].map(m=><button key={m} onClick={()=>setGwpMode(m)} style={{padding:'8px 20px',fontSize:11,fontWeight:700,cursor:'pointer',border:`2px solid ${gwpMode===m?T.purple:T.border}`,borderRadius:6,background:gwpMode===m?`${T.purple}10`:T.surface,color:gwpMode===m?T.purple:T.textSec,fontFamily:T.font}}>{m}</button>)}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div style={{padding:12,background:gwpMode==='GWP-100'?`${T.navy}08`:T.cream,borderRadius:6,border:`1px solid ${gwpMode==='GWP-100'?T.navy:T.border}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>GWP-100 (Pulse-Based)</div>
                  <div style={{fontSize:10,color:T.textSec,lineHeight:1.6}}>
                    Standard IPCC metric. Compares the warming from a pulse emission of CH4 vs CO2 over 100 years. CH4 = 27.2× CO2 (AR6, fossil) / 29.8× (AR6, biogenic) / 28× (AR5). Treats all methane equally regardless of whether emissions are increasing, constant, or decreasing. Currently used by UNFCCC, Verra, Gold Standard.
                  </div>
                  <div style={{marginTop:8,fontFamily:T.mono,fontSize:11,color:T.navy}}>1 tonne CH4 = <strong>27.2 tCO2e</strong> (AR6 GWP-100, fossil) · 28 tCO2e (AR5)</div>
                </div>
                <div style={{padding:12,background:gwpMode==='GWP*'?`${T.purple}08`:T.cream,borderRadius:6,border:`1px solid ${gwpMode==='GWP*'?T.purple:T.border}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.purple,marginBottom:6}}>GWP* (Flow-Based)</div>
                  <div style={{fontSize:10,color:T.textSec,lineHeight:1.6}}>
                    Oxford-developed metric. Accounts for the short-lived nature of CH4. A constant CH4 flow = no additional warming (stock-flow equivalence). Only changes in emission rates cause warming. Reduces credit volumes for constant herds but gives larger credits for genuine reductions.
                  </div>
                  <div style={{marginTop:8,fontFamily:T.mono,fontSize:11,color:T.purple}}>Warming = f(dCH4/dt) not f(CH4)</div>
                </div>
              </div>
            </Section>
          </Card>
          <Card style={{marginBottom:16}}>
            <Section title="Pulse vs Flow Warming Over Time" right="Simplified CH4 warming equivalence">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={gwpCompare}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Years after emission',position:'insideBottom',offset:-4,fontSize:10}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Warming Factor',angle:-90,position:'insideLeft',fontSize:10}} />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                  <Line dataKey="gwp100" stroke={T.navy} strokeWidth={2} name="GWP-100 (constant 28x)" dot={false} />
                  <Line dataKey="gwpStar" stroke={T.purple} strokeWidth={2} name="GWP* (flow-adjusted)" dot={false} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </Card>
          <Card>
            <Section title="Impact on Credit Volumes">
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                {[
                  {scenario:'Increasing Herd (+5%/yr)',gwp100:'High credits',gwpStar:'Even higher credits',ratio:1.3},
                  {scenario:'Constant Herd (0%/yr)',gwp100:'Moderate credits',gwpStar:'Near-zero credits',ratio:0.1},
                  {scenario:'Reducing Herd (-5%/yr)',gwp100:'Low credits',gwpStar:'Highest credits',ratio:2.0},
                ].map(s=>(
                  <div key={s.scenario} style={{padding:12,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:8}}>{s.scenario}</div>
                    <div style={{fontSize:10,color:T.textSec,marginBottom:4}}>GWP-100: <span style={{color:T.navy,fontWeight:600}}>{s.gwp100}</span></div>
                    <div style={{fontSize:10,color:T.textSec,marginBottom:4}}>GWP*: <span style={{color:T.purple,fontWeight:600}}>{s.gwpStar}</span></div>
                    <div style={{fontSize:10,fontFamily:T.mono,color:T.teal}}>GWP*/GWP-100 ratio: {s.ratio}x</div>
                  </div>
                ))}
              </div>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 6: Herd Monitoring ═══ */}
      {tab === TABS[5] && (
        <>
          <Card style={{marginBottom:16}} border={T.teal}>
            <Section title="MRV Protocol Requirements">
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                {[
                  {step:'1. Herd Size Tracking',freq:'Monthly',method:'Ear tags / RFID / census',icon:'H'},
                  {step:'2. Feed Intake',freq:'Weekly sampling',method:'Feed conversion ratio, DM intake records',icon:'F'},
                  {step:'3. Manure Sampling',freq:'Quarterly',method:'VS, moisture, ash content analysis',icon:'M'},
                  {step:'4. CH4 Flux Measurement',freq:'Biannual',method:'Respiration chambers, SF6 tracer, FTIR',icon:'C'},
                ].map(s=>(
                  <div key={s.step} style={{padding:14,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`}}>
                    <div style={{width:32,height:32,borderRadius:16,background:`${T.teal}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:T.teal,fontFamily:T.mono,marginBottom:8}}>{s.icon}</div>
                    <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:4}}>{s.step}</div>
                    <div style={{fontSize:10,color:T.textSec,marginBottom:4}}>{s.method}</div>
                    <Badge v={s.freq} colors={{Monthly:T.emerald,'Weekly sampling':T.teal,Quarterly:T.amber,Biannual:T.purple}} />
                  </div>
                ))}
              </div>
            </Section>
          </Card>
          <Card style={{marginBottom:16}}>
            <Section title="Sample Herd Monitoring Timeline" right="12-month cycle">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Array.from({length:12},(_,m)=>({
                  month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],
                  herd_count:Math.round(ent.head_count*(0.95+sr(m*7)*0.1)),
                  feed_dmi:Math.round((8+sr(m*11)*4)*10)/10,
                  ch4_kg: Math.round((entResult.ch4_bl/365/ent.head_count)*(0.9+sr(m*13)*0.2)*1000)/1000,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{fontSize:10,fontFamily:T.mono}} />
                  <YAxis yAxisId="left" tick={{fontSize:10,fontFamily:T.mono}} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                  <Bar yAxisId="left" dataKey="herd_count" fill={T.teal} radius={[2,2,0,0]} name="Herd Count" />
                  <Bar yAxisId="right" dataKey="feed_dmi" fill={T.gold} radius={[2,2,0,0]} name="Feed DMI (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Card>
          <Card>
            <Section title="Verification Checklist">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[
                  {item:'Baseline emissions recalculation',status:'Required',timing:'Year 0 + every 5 years'},
                  {item:'Project emissions monitoring report',status:'Required',timing:'Annual'},
                  {item:'Feed additive dosing logs',status:'Required',timing:'Continuous'},
                  {item:'Third-party verification audit',status:'Required',timing:'Every 5 years'},
                  {item:'Herd demographics & mortality records',status:'Required',timing:'Monthly'},
                  {item:'Manure management system documentation',status:'Conditional',timing:'As applicable'},
                  {item:'GHG flux measurement campaign',status:'Recommended',timing:'Biannual'},
                  {item:'Stakeholder consultation report',status:'Recommended',timing:'Initial + 5yr'},
                ].map(c=>(
                  <div key={c.item} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:4,background:T.surface,border:`1px solid ${T.border}`}}>
                    <Badge v={c.status} colors={{Required:T.emerald,Conditional:T.amber,Recommended:T.teal}} />
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.navy}}>{c.item}</div>
                      <div style={{fontSize:9,color:T.textMut}}>{c.timing}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </Card>
        </>
      )}
    </div>
  );
}
