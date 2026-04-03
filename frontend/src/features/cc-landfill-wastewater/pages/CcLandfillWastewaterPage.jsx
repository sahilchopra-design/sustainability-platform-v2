import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area, Cell, ReferenceLine, PieChart, Pie,
  ScatterChart, Scatter, ZAxis,
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
   LANDFILL GAS & WASTEWATER METHANE ENGINE
   ══════════════════════════════════════════════════════════════════ */

const WASTE_FRACTIONS = [
  { id:'food', name:'Food Waste', doc:0.38, k:0.06, share_default:0.35, color:T.emerald },
  { id:'paper', name:'Paper / Cardboard', doc:0.44, k:0.04, share_default:0.25, color:T.navy },
  { id:'wood', name:'Wood / Lumber', doc:0.43, k:0.02, share_default:0.10, color:T.gold },
  { id:'textile', name:'Textiles', doc:0.24, k:0.04, share_default:0.08, color:T.purple },
  { id:'garden', name:'Garden / Park', doc:0.20, k:0.05, share_default:0.15, color:T.sage },
  { id:'other', name:'Other Organics', doc:0.15, k:0.03, share_default:0.07, color:T.amber },
];

const PROJECTS = Array.from({length:10},(_,i)=>{
  const types = i<6?'Landfill':'Wastewater';
  const countries=['Brazil','India','China','Mexico','Thailand','Indonesia','Colombia','Vietnam','Egypt','South Africa'];
  return {
    id:`LW-${String(i+1).padStart(3,'0')}`, name:`${countries[i]} ${types} Gas`,
    country: countries[i], type: types,
    waste_tpa: Math.round(50000+sr(i*11)*450000),
    ch4_avoided_tco2e: Math.round(8000+sr(i*13)*142000),
    collection_eff: Math.round(60+sr(i*17)*35)/100,
    destruction_eff: Math.round(95+sr(i*19)*4)/100,
    vintage: 2020+(i%5), status: i%5===4?'Verification':'Active',
    buffer_pct: Math.round(10+sr(i*23)*8),
    methodology: types==='Landfill'?'AMS-III.G':'AMS-III.H',
  };
});

const calcFOD = (params) => {
  const { waste_tpa, doc_weighted, docf, f, k, mcf, years, collection_eff, destruction_eff, buffer_pct } = params;
  const data = [];
  let cumulative = 0;
  for(let t=1;t<=years;t++){
    let ch4_gen = 0;
    for(let x=0;x<t;x++){
      ch4_gen += mcf * doc_weighted * docf * f * waste_tpa * Math.exp(-k*(t-x)) * (1 - Math.exp(-k));
    }
    const ch4_captured = ch4_gen * collection_eff;
    const ch4_destroyed = ch4_captured * destruction_eff;
    const tco2e = ch4_destroyed / 1000 * 28;
    const net = tco2e * (1 - buffer_pct/100);
    cumulative += net;
    data.push({ year:t, ch4_gen:Math.round(ch4_gen), ch4_captured:Math.round(ch4_captured), ch4_destroyed:Math.round(ch4_destroyed), tco2e:Math.round(tco2e), net:Math.round(net), cumulative:Math.round(cumulative) });
  }
  return data;
};

const calcWastewater = (params) => {
  const { organic_load, b0, mcf_bl, mcf_pj, capture_eff, buffer_pct } = params;
  const ch4_bl = organic_load * b0 * mcf_bl * 365 / 1000; // tonnes CH4/yr
  const ch4_pj = organic_load * b0 * mcf_pj * (1 - capture_eff) * 365 / 1000;
  const ch4_avoided = ch4_bl - ch4_pj;
  const tco2e_bl = ch4_bl * 28;
  const tco2e_pj = ch4_pj * 28;
  const gross = ch4_avoided * 28;
  const net = gross * (1 - buffer_pct/100);
  return { ch4_bl:Math.round(ch4_bl*100)/100, ch4_pj:Math.round(ch4_pj*100)/100, ch4_avoided:Math.round(ch4_avoided*100)/100, tco2e_bl:Math.round(tco2e_bl), tco2e_pj:Math.round(tco2e_pj), gross:Math.round(gross), net:Math.round(net) };
};

export default function CcLandfillWastewaterPage() {
  const { addCalculation, addProject, getSummary } = useCarbonCredit();
  const TABS = ['Methodology Overview','FOD Landfill Gas Calculator','Wastewater CH4 Calculator','Gas Collection Design','Waste Composition','Monitoring & Metering'];
  const [tab, setTab] = useState(TABS[0]);

  /* FOD inputs */
  const [fod, setFod] = useState({
    waste_tpa:100000, docf:0.55, f:0.50, k:0.05, mcf:0.60, years:20,
    collection_eff:0.75, destruction_eff:0.97, buffer_pct:12,
  });
  const setF = useCallback((k2,v) => setFod(prev=>({...prev,[k2]:v})),[]);

  /* Waste composition shares */
  const [shares, setShares] = useState(()=>Object.fromEntries(WASTE_FRACTIONS.map(w=>[w.id,w.share_default])));
  const setShare = useCallback((id,v) => setShares(prev=>{
    const next = {...prev,[id]:v};
    const total = Object.values(next).reduce((a,b)=>a+b,0);
    if(total>1.0) next[id] = Math.max(0, v - (total-1.0));
    return next;
  }),[]);

  /* Wastewater inputs */
  const [ww, setWw] = useState({
    organic_load:15000, b0:0.40, mcf_bl:0.80, mcf_pj:0.05, capture_eff:0.85, buffer_pct:10,
  });
  const setW = useCallback((k2,v) => setWw(prev=>({...prev,[k2]:v})),[]);

  /* Gas collection design */
  const [gc, setGc] = useState({ well_spacing_m:30, well_depth_m:20, suction_kpa:1.5, flow_m3h:250 });
  const setG = useCallback((k2,v) => setGc(prev=>({...prev,[k2]:v})),[]);

  /* Weighted DOC from composition */
  const docWeighted = useMemo(() => {
    return WASTE_FRACTIONS.reduce((s,w)=>s + w.doc * (shares[w.id]||0), 0);
  }, [shares]);

  /* FOD results */
  const fodData = useMemo(() => calcFOD({...fod, doc_weighted:docWeighted}), [fod, docWeighted]);
  const fodTotal = useMemo(() => fodData.length > 0 ? fodData[fodData.length-1].cumulative : 0, [fodData]);

  useEffect(() => {
    if (fodTotal > 0) {
      addCalculation({
        projectId: 'CC-LIVE',
        methodology: 'ACM0001',
        family: 'waste',
        cluster: 'Landfill Gas',
        inputs: fod,
        outputs: { fodData, fodTotal },
        net_tco2e: fodTotal || 0,
      });
    }
  }, [fodTotal]); // eslint-disable-line react-hooks/exhaustive-deps

  const fodPeak = useMemo(() => fodData.reduce((mx,d)=>d.net>mx?d.net:mx, 0), [fodData]);

  /* Wastewater results */
  const wwResult = useMemo(() => calcWastewater(ww), [ww]);

  /* Aggregate KPIs */
  const totalAvoided = useMemo(() => PROJECTS.reduce((s,p)=>s+p.ch4_avoided_tco2e,0), []);
  const landfillCount = useMemo(() => PROJECTS.filter(p=>p.type==='Landfill').length, []);

  /* Gas collection calcs */
  const gcCalcs = useMemo(() => {
    const area_per_well = Math.PI * (gc.well_spacing_m/2)**2;
    const wells_per_ha = 10000 / area_per_well;
    const extraction_rate = gc.flow_m3h * gc.suction_kpa * 0.6; // simplified
    const ch4_content = 0.50; // typical 50% CH4
    const ch4_flow = gc.flow_m3h * ch4_content;
    const energy_mwh = ch4_flow * 9.97 / 1000; // MWh thermal approx
    return { area_per_well:Math.round(area_per_well), wells_per_ha:Math.round(wells_per_ha*10)/10, extraction_rate:Math.round(extraction_rate), ch4_flow:Math.round(ch4_flow), energy_mwh:Math.round(energy_mwh*10)/10 };
  }, [gc]);

  return (
    <div style={{ fontFamily:T.font, background:T.cream, minHeight:'100vh', padding:'20px 24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, letterSpacing:'0.1em' }}>EP-BT1</span>
          <span style={{ width:1, height:12, background:T.border }} />
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.teal, fontWeight:600 }}>WASTE &amp; INDUSTRIAL CREDITS</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>Landfill Gas &amp; Wastewater Methane</h1>
        <p style={{ fontSize:12, color:T.textSec, marginTop:4 }}>AMS-III.G / AMS-III.H &middot; First-Order Decay &middot; Gas Collection &middot; Waste Composition &middot; Monitoring</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        <Kpi label="Projects" value="10" sub={`${landfillCount} Landfill / ${10-landfillCount} WW`} accent={T.teal} />
        <Kpi label="Total Avoided" value={fmtK(totalAvoided)} sub="tCO2e all projects" accent={T.emerald} />
        <Kpi label="FOD Peak Year" value={fmtK(fodPeak)} sub="tCO2e/yr net" accent={T.navy} />
        <Kpi label="FOD Cumulative" value={fmtK(fodTotal)} sub={`Over ${fod.years} years`} accent={T.gold} />
        <Kpi label="Weighted DOC" value={docWeighted.toFixed(3)} sub="From composition mix" accent={T.purple} />
        <Kpi label="WW Net Credits" value={fmtK(wwResult.net)} sub="tCO2e/yr" accent={T.amber} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══ TAB 1: Methodology Overview ═══ */}
      {tab === TABS[0] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="Emission Pathways">
                {[
                  {id:'Landfill',icon:'L',desc:'Methane generated from anaerobic decomposition of organic waste in landfills. Modelled using IPCC First-Order Decay (FOD).',share:'~65%',formula:'CH4 = Sum[MCF x DOC x DOCf x F x W x exp(-k(t-x)) x (1-exp(-k))]'},
                  {id:'Wastewater',icon:'W',desc:'Methane produced during anaerobic treatment of industrial and municipal wastewater, primarily from BOD/COD loading.',share:'~35%',formula:'CH4 = Organic_Load x B0 x MCF x (1 - Capture_Eff)'},
                ].map(p=>(
                  <div key={p.id} style={{padding:12,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`,marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                      <span style={{width:28,height:28,borderRadius:14,background:`${T.teal}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:T.teal,fontFamily:T.mono}}>{p.icon}</span>
                      <div style={{flex:1}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{p.id} Methane</span>
                        <span style={{fontSize:10,color:T.emerald,fontFamily:T.mono,marginLeft:8}}>{p.share}</span>
                      </div>
                    </div>
                    <div style={{fontSize:10,color:T.textSec,marginBottom:6}}>{p.desc}</div>
                    <div style={{padding:6,background:T.surface,borderRadius:3,fontFamily:T.mono,fontSize:9,color:T.navy,wordBreak:'break-all'}}>{p.formula}</div>
                  </div>
                ))}
              </Section>
              <Section title="Applicable Methodologies">
                {[
                  {id:'AMS-III.G',name:'Landfill Methane Recovery',registry:'UNFCCC CDM',status:'Active'},
                  {id:'AMS-III.H',name:'Methane Recovery in Wastewater Treatment',registry:'UNFCCC CDM',status:'Active'},
                  {id:'ACM0001',name:'Flaring or Use of Landfill Gas',registry:'UNFCCC CDM',status:'Active'},
                  {id:'VM0011',name:'LFG via Destruction or Beneficial Use',registry:'Verra VCS',status:'Active'},
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
                      {['ID','Country','Type','Waste t/yr','CH4 Avoided','Coll Eff','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 6px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                    </tr></thead>
                    <tbody>{PROJECTS.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'5px 6px',color:T.teal,fontWeight:600}}>{p.id}</td>
                      <td style={{padding:'5px 6px'}}>{p.country}</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.type} colors={{Landfill:T.emerald,Wastewater:T.purple}} /></td>
                      <td style={{padding:'5px 6px',textAlign:'right'}}>{p.waste_tpa.toLocaleString()}</td>
                      <td style={{padding:'5px 6px',textAlign:'right',color:T.emerald,fontWeight:600}}>{p.ch4_avoided_tco2e.toLocaleString()}</td>
                      <td style={{padding:'5px 6px',textAlign:'right'}}>{(p.collection_eff*100).toFixed(0)}%</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.status} colors={{Active:T.emerald,Verification:T.amber}} /></td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </Section>
              <Section title="Projects by Type">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={PROJECTS.map(p=>({name:p.id,tco2e:p.ch4_avoided_tco2e,type:p.type}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:8,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Bar dataKey="tco2e" radius={[3,3,0,0]} name="tCO2e Avoided">
                      {PROJECTS.map((p,i)=><Cell key={i} fill={p.type==='Landfill'?T.emerald:T.purple} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 2: FOD Landfill Gas Calculator ═══ */}
      {tab === TABS[1] && (
        <>
          <Card style={{marginBottom:16}} border={T.emerald}>
            <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16}}>
              <div>
                <Section title="FOD Model Parameters">
                  <DualInput label="Waste Input (tonnes/yr)" value={fod.waste_tpa} min={10000} max={1000000} step={5000} onChange={v=>setF('waste_tpa',v)} color={T.navy} />
                  <DualInput label="DOCf (fraction dissimilated)" value={fod.docf} min={0.50} max={0.77} step={0.01} onChange={v=>setF('docf',v)} color={T.teal} />
                  <DualInput label="F (CH4 fraction in gas)" value={fod.f} min={0.40} max={0.60} step={0.01} onChange={v=>setF('f',v)} color={T.purple} />
                  <DualInput label="k (decay rate yr-1)" value={fod.k} min={0.02} max={0.10} step={0.005} onChange={v=>setF('k',v)} color={T.emerald} />
                  <DualInput label="MCF (methane correction)" value={fod.mcf} min={0.40} max={1.00} step={0.05} onChange={v=>setF('mcf',v)} color={T.red} />
                  <DualInput label="Projection Years" value={fod.years} min={5} max={40} step={1} onChange={v=>setF('years',v)} color={T.gold} />
                  <DualInput label="Collection Efficiency" value={fod.collection_eff} min={0.60} max={0.95} step={0.01} onChange={v=>setF('collection_eff',v)} color={T.sage} unit="" />
                  <DualInput label="Destruction Efficiency" value={fod.destruction_eff} min={0.95} max={0.99} step={0.005} onChange={v=>setF('destruction_eff',v)} color={T.amber} unit="" />
                  <DualInput label="Buffer Pool %" value={fod.buffer_pct} min={5} max={25} step={1} onChange={v=>setF('buffer_pct',v)} color={T.red} unit="%" />
                </Section>
                <div style={{padding:12,background:`${T.emerald}0a`,borderRadius:6,border:`1px solid ${T.emerald}30`,marginBottom:10}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Cumulative Net Credits</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{fmtK(fodTotal)}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tCO2e over {fod.years} yrs | DOC={docWeighted.toFixed(3)}</div>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Annual Net Credits &amp; Cumulative (FOD Model)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={fodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{fontSize:9,fontFamily:T.mono}} label={{value:'Year',position:'insideBottom',offset:-4,fontSize:9}} />
                    <YAxis yAxisId="left" tick={{fontSize:9,fontFamily:T.mono}} label={{value:'tCO2e/yr',angle:-90,position:'insideLeft',fontSize:9}} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize:9,fontFamily:T.mono}} label={{value:'Cumulative',angle:90,position:'insideRight',fontSize:9}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Area yAxisId="left" dataKey="net" fill={`${T.emerald}30`} stroke={T.emerald} strokeWidth={2} name="Net Credits/yr" />
                    <Line yAxisId="right" dataKey="cumulative" stroke={T.navy} strokeWidth={2} dot={false} name="Cumulative" />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{marginTop:12,padding:10,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:9,color:T.navy,lineHeight:1.8}}>
                  <div>CH4_gen = Sum[MCF({fod.mcf}) x DOC({docWeighted.toFixed(3)}) x DOCf({fod.docf}) x F({fod.f}) x W({fod.waste_tpa.toLocaleString()}) x exp(-k(t-x)) x (1-exp(-k({fod.k})))]</div>
                  <div>Collection = CH4_gen x {fod.collection_eff} | Destruction = Collected x {fod.destruction_eff}</div>
                  <div>Net = tCO2e x (1 - {fod.buffer_pct}%) | Peak year net: <strong style={{color:T.emerald}}>{fmtK(fodPeak)} tCO2e</strong></div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <Section title="Decay Rate Sensitivity" right="Impact of k on cumulative credits">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[0.02,0.03,0.04,0.05,0.06,0.07,0.08,0.09,0.10].map(kv=>{
                  const d = calcFOD({...fod, doc_weighted:docWeighted, k:kv});
                  return { k:kv, cumulative:d.length>0?d[d.length-1].cumulative:0, peak:d.reduce((mx,dd)=>dd.net>mx?dd.net:mx,0) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="k" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Decay Rate (k)',position:'insideBottom',offset:-4,fontSize:9}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Line dataKey="cumulative" stroke={T.navy} strokeWidth={2} name="Cumulative tCO2e" dot={{r:3,fill:T.navy}} />
                  <Line dataKey="peak" stroke={T.emerald} strokeWidth={2} name="Peak Year tCO2e" dot={{r:3,fill:T.emerald}} />
                  <ReferenceLine x={fod.k} stroke={T.red} strokeDasharray="3 3" label={{value:'Current',fill:T.red,fontSize:9}} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 3: Wastewater CH4 Calculator ═══ */}
      {tab === TABS[2] && (
        <>
          <Card style={{marginBottom:16}} border={T.purple}>
            <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16}}>
              <div>
                <Section title="Wastewater CH4 Parameters">
                  <DualInput label="Organic Load (kg BOD/day)" value={ww.organic_load} min={1000} max={100000} step={500} onChange={v=>setW('organic_load',v)} color={T.navy} />
                  <DualInput label="B0 Max CH4 Capacity (kg CH4/kg BOD)" value={ww.b0} min={0.25} max={0.60} step={0.01} onChange={v=>setW('b0',v)} color={T.teal} />
                  <DualInput label="MCF Baseline (anaerobic lagoon)" value={ww.mcf_bl} min={0.40} max={1.00} step={0.05} onChange={v=>setW('mcf_bl',v)} color={T.red} />
                  <DualInput label="MCF Project (treated)" value={ww.mcf_pj} min={0.00} max={0.30} step={0.01} onChange={v=>setW('mcf_pj',v)} color={T.emerald} />
                  <DualInput label="Capture Efficiency" value={ww.capture_eff} min={0.70} max={0.98} step={0.01} onChange={v=>setW('capture_eff',v)} color={T.purple} />
                  <DualInput label="Buffer Pool %" value={ww.buffer_pct} min={5} max={20} step={1} onChange={v=>setW('buffer_pct',v)} color={T.amber} unit="%" />
                </Section>
                <div style={{padding:12,background:`${T.purple}0a`,borderRadius:6,border:`1px solid ${T.purple}30`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Net Credits</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.purple,fontFamily:T.mono}}>{fmtK(wwResult.net)}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tCO2e/yr | Capture={ww.capture_eff}</div>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Baseline vs Project Wastewater Emissions</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    {name:'Baseline CH4',tco2e:wwResult.tco2e_bl},
                    {name:'Project CH4',tco2e:wwResult.tco2e_pj},
                    {name:'CH4 Avoided',tco2e:wwResult.gross},
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} label={{value:'tCO2e/yr',angle:-90,position:'insideLeft',fontSize:9}} />
                    <Tooltip contentStyle={TIP} />
                    <Bar dataKey="tco2e" radius={[3,3,0,0]} name="tCO2e">
                      <Cell fill={T.red} /><Cell fill={T.emerald} /><Cell fill={T.navy} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:12,padding:10,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:9,color:T.navy,lineHeight:1.8}}>
                  <div>CH4_BL = {ww.organic_load.toLocaleString()} x {ww.b0} x {ww.mcf_bl} x 365 / 1000 = <strong>{wwResult.ch4_bl} t CH4/yr</strong></div>
                  <div>CH4_PJ = {ww.organic_load.toLocaleString()} x {ww.b0} x {ww.mcf_pj} x (1 - {ww.capture_eff}) x 365 / 1000 = <strong>{wwResult.ch4_pj} t CH4/yr</strong></div>
                  <div>Gross = ({wwResult.ch4_bl} - {wwResult.ch4_pj}) x 28 = <strong>{wwResult.gross.toLocaleString()} tCO2e</strong></div>
                  <div>Net = {wwResult.gross.toLocaleString()} x (1 - {ww.buffer_pct}%) = <strong style={{color:T.purple}}>{wwResult.net.toLocaleString()} tCO2e</strong></div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <Section title="Capture Efficiency Sensitivity" right="Impact on net credits">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[0.70,0.75,0.80,0.85,0.88,0.90,0.92,0.95,0.98].map(ce=>{
                  const r = calcWastewater({...ww, capture_eff:ce});
                  return { capture:ce, net:r.net, gross:r.gross };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="capture" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Capture Efficiency',position:'insideBottom',offset:-4,fontSize:9}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Line dataKey="net" stroke={T.purple} strokeWidth={2} name="Net tCO2e" dot={{r:3,fill:T.purple}} />
                  <Line dataKey="gross" stroke={T.navy} strokeWidth={2} strokeDasharray="3 3" name="Gross tCO2e" dot={{r:2,fill:T.navy}} />
                  <ReferenceLine x={ww.capture_eff} stroke={T.red} strokeDasharray="3 3" label={{value:'Current',fill:T.red,fontSize:9}} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 4: Gas Collection Design ═══ */}
      {tab === TABS[3] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card border={T.teal}>
              <Section title="Well Field Parameters">
                <DualInput label="Well Spacing (m)" value={gc.well_spacing_m} min={15} max={60} step={5} onChange={v=>setG('well_spacing_m',v)} color={T.teal} unit="m" />
                <DualInput label="Well Depth (m)" value={gc.well_depth_m} min={5} max={40} step={1} onChange={v=>setG('well_depth_m',v)} color={T.navy} unit="m" />
                <DualInput label="Suction Pressure (kPa)" value={gc.suction_kpa} min={0.5} max={5.0} step={0.1} onChange={v=>setG('suction_kpa',v)} color={T.purple} unit="kPa" />
                <DualInput label="Gas Flow Rate (m3/h)" value={gc.flow_m3h} min={50} max={1000} step={10} onChange={v=>setG('flow_m3h',v)} color={T.emerald} unit="m3/h" />
              </Section>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div style={{padding:10,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase'}}>Influence Area/Well</div>
                  <div style={{fontSize:16,fontWeight:700,color:T.teal,fontFamily:T.mono}}>{gcCalcs.area_per_well} m2</div>
                </div>
                <div style={{padding:10,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase'}}>Wells per Hectare</div>
                  <div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{gcCalcs.wells_per_ha}</div>
                </div>
                <div style={{padding:10,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase'}}>CH4 Flow</div>
                  <div style={{fontSize:16,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{gcCalcs.ch4_flow} m3/h</div>
                </div>
                <div style={{padding:10,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase'}}>Energy Equiv</div>
                  <div style={{fontSize:16,fontWeight:700,color:T.gold,fontFamily:T.mono}}>{gcCalcs.energy_mwh} MWh-th</div>
                </div>
              </div>
            </Card>
            <Card>
              <Section title="Well Spacing vs Wells/Hectare">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={[15,20,25,30,35,40,45,50,55,60].map(sp=>({spacing:sp, wells:Math.round(10000/(Math.PI*(sp/2)**2)*10)/10, area:Math.round(Math.PI*(sp/2)**2)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="spacing" tick={{fontSize:9,fontFamily:T.mono}} label={{value:'Spacing (m)',position:'insideBottom',offset:-4,fontSize:9}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Line dataKey="wells" stroke={T.teal} strokeWidth={2} name="Wells/ha" dot={{r:3,fill:T.teal}} />
                    <ReferenceLine x={gc.well_spacing_m} stroke={T.red} strokeDasharray="3 3" label={{value:'Current',fill:T.red,fontSize:9}} />
                  </LineChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Destruction Technologies">
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                  <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                    {['Technology','Temp (C)','Efficiency','Capital $/m3h','O&M $/yr'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 6px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{[
                    {tech:'Open Flare',temp:'900-1100',eff:'96-98%',capex:'800-1200',opex:'15K-25K'},
                    {tech:'Enclosed Flare',temp:'1000-1200',eff:'98-99.5%',capex:'1500-2500',opex:'20K-35K'},
                    {tech:'Gas Engine (CHP)',temp:'Combustion',eff:'97-99%',capex:'3000-5000',opex:'40K-80K'},
                    {tech:'Microturbine',temp:'Combustion',eff:'98-99%',capex:'4000-6000',opex:'30K-60K'},
                  ].map(r=><tr key={r.tech} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'5px 6px',fontWeight:600,color:T.navy}}>{r.tech}</td>
                    <td style={{padding:'5px 6px'}}>{r.temp}</td>
                    <td style={{padding:'5px 6px',color:T.emerald}}>{r.eff}</td>
                    <td style={{padding:'5px 6px'}}>{r.capex}</td>
                    <td style={{padding:'5px 6px'}}>{r.opex}</td>
                  </tr>)}</tbody>
                </table>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 5: Waste Composition ═══ */}
      {tab === TABS[4] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card border={T.gold}>
              <Section title="Waste Composition Fractions">
                <div style={{fontSize:10,color:T.textSec,marginBottom:12}}>Adjust fractions to compute weighted DOC. Total should equal 1.0.</div>
                {WASTE_FRACTIONS.map(w=>(
                  <div key={w.id} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                      <span style={{fontSize:10,fontWeight:600,color:w.color}}>{w.name}</span>
                      <span style={{fontSize:9,fontFamily:T.mono,color:T.textMut}}>DOC={w.doc} | k={w.k}</span>
                    </div>
                    <DualInput label={`${w.name} Share`} value={Math.round((shares[w.id]||0)*100)/100} min={0} max={0.60} step={0.01} onChange={v=>setShare(w.id,v)} color={w.color} />
                  </div>
                ))}
                <div style={{padding:10,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`,marginTop:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:10,fontWeight:600,color:T.navy}}>Total Share</span>
                    <span style={{fontSize:12,fontWeight:700,color:Object.values(shares).reduce((a,b)=>a+b,0)>1.01?T.red:T.emerald,fontFamily:T.mono}}>{Object.values(shares).reduce((a,b)=>a+b,0).toFixed(2)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:10,fontWeight:600,color:T.navy}}>Weighted DOC</span>
                    <span style={{fontSize:14,fontWeight:700,color:T.gold,fontFamily:T.mono}}>{docWeighted.toFixed(4)}</span>
                  </div>
                </div>
              </Section>
            </Card>
            <Card>
              <Section title="Composition Breakdown">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={WASTE_FRACTIONS.map(w=>({name:w.name,value:Math.round((shares[w.id]||0)*100)}))} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({name,value})=>`${name}: ${value}%`} labelLine={false} style={{fontSize:8}}>
                      {WASTE_FRACTIONS.map(w=><Cell key={w.id} fill={w.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TIP} />
                  </PieChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Fraction DOC & Decay Rates">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={WASTE_FRACTIONS.map(w=>({name:w.name.split(' ')[0],doc:w.doc,k:w.k,share:shares[w.id]||0}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Bar dataKey="doc" fill={T.emerald} name="DOC" radius={[3,3,0,0]} />
                    <Bar dataKey="k" fill={T.navy} name="k (decay)" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 6: Monitoring & Metering ═══ */}
      {tab === TABS[5] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="Monitoring Requirements (AMS-III.G)">
                {[
                  {param:'Gas Flow Rate',method:'Orifice plate / thermal mass',freq:'Continuous',accuracy:'+/-5%',critical:true},
                  {param:'CH4 Concentration',method:'NDIR / FID analyser',freq:'Continuous',accuracy:'+/-2%',critical:true},
                  {param:'Temperature',method:'Thermocouple at flare stack',freq:'Continuous',accuracy:'+/-1C',critical:true},
                  {param:'Waste Input',method:'Weighbridge / survey',freq:'Daily / Weekly',accuracy:'+/-10%',critical:false},
                  {param:'Waste Composition',method:'Grab sampling + lab',freq:'Quarterly',accuracy:'Category-level',critical:false},
                  {param:'Surface Emissions',method:'FID walking survey',freq:'Quarterly',accuracy:'Screening level',critical:false},
                  {param:'Leachate Quality',method:'BOD/COD lab analysis',freq:'Monthly',accuracy:'+/-15%',critical:false},
                  {param:'Ambient CH4',method:'Open-path laser',freq:'Continuous',accuracy:'+/-5 ppb',critical:false},
                ].map(m=>(
                  <div key={m.param} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:4,marginBottom:3,background:m.critical?`${T.red}06`:T.surface,border:`1px solid ${m.critical?`${T.red}20`:T.border}`}}>
                    <span style={{width:6,height:6,borderRadius:3,background:m.critical?T.red:T.emerald}} />
                    <span style={{fontSize:10,fontWeight:600,color:T.navy,width:120}}>{m.param}</span>
                    <span style={{fontSize:9,color:T.textSec,flex:1}}>{m.method}</span>
                    <span style={{fontSize:9,fontFamily:T.mono,color:T.teal,width:70}}>{m.freq}</span>
                    <span style={{fontSize:9,fontFamily:T.mono,color:T.purple}}>{m.accuracy}</span>
                  </div>
                ))}
              </Section>
            </Card>
            <Card>
              <Section title="QA/QC Protocol">
                {[
                  {step:'Calibration',desc:'Zero & span gas calibration of CH4 analysers',freq:'Weekly',tier:'T1'},
                  {step:'Data Validation',desc:'Automated outlier detection on flow + composition',freq:'Daily',tier:'T1'},
                  {step:'Mass Balance',desc:'Compare metered gas vs modelled FOD output',freq:'Monthly',tier:'T2'},
                  {step:'Surface Survey',desc:'FID walking survey + OGI camera for fugitive leaks',freq:'Quarterly',tier:'T2'},
                  {step:'Lab Analysis',desc:'Waste composition grab sample lab testing',freq:'Quarterly',tier:'T3'},
                  {step:'Third-Party Audit',desc:'VVB site visit with instrument check',freq:'Annual',tier:'T3'},
                ].map(q=>(
                  <div key={q.step} style={{padding:10,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`,marginBottom:6}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontSize:11,fontWeight:700,color:T.navy}}>{q.step}</span>
                      <div style={{display:'flex',gap:6}}>
                        <Badge v={q.tier} colors={{T1:T.emerald,T2:T.teal,T3:T.purple}} />
                        <span style={{fontSize:9,fontFamily:T.mono,color:T.gold}}>{q.freq}</span>
                      </div>
                    </div>
                    <div style={{fontSize:10,color:T.textSec}}>{q.desc}</div>
                  </div>
                ))}
              </Section>
              <Section title="Simulated Monthly Gas Flow">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={Array.from({length:24},(_,i)=>({month:`M${i+1}`,flow:Math.round(200+sr(i*7)*150+Math.sin(i/12*Math.PI*2)*40),ch4_pct:Math.round(48+sr(i*11)*6)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{fontSize:8,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Area dataKey="flow" fill={`${T.teal}30`} stroke={T.teal} strokeWidth={1.5} name="Gas Flow (m3/h)" />
                    <Area dataKey="ch4_pct" fill={`${T.emerald}20`} stroke={T.emerald} strokeWidth={1.5} name="CH4 %" />
                  </AreaChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
