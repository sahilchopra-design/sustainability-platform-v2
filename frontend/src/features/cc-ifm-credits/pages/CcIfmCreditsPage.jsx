import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area, Cell, ReferenceLine,
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
   IFM CALCULATION ENGINE
   ══════════════════════════════════════════════════════════════════ */
const IFM_TYPES = [
  { id:'RIL', name:'Reduced Impact Logging', desc:'Lower-damage harvesting techniques', default_harvest_reduction:0.35 },
  { id:'ER', name:'Extended Rotation', desc:'Longer harvest cycles to accumulate more carbon', default_harvest_reduction:0.50 },
  { id:'HD', name:'Harvest Deferral', desc:'Delaying or eliminating planned harvest', default_harvest_reduction:0.80 },
  { id:'CA', name:'Conversion Avoidance', desc:'Preventing conversion from forest to non-forest', default_harvest_reduction:1.00 },
];

/* IFM baseline: CS_BL(t) = CS_BL(0) + Increment*t - Harvest*t*CF */
const calcIFM = (params) => {
  const { area_ha, initial_cs, annual_increment, harvest_rate_bl, harvest_rate_pj, cf, crediting_yrs, leakage_mkt_pct, leakage_act_pct, buffer_pct, uncertainty_factor } = params;
  const years = [];
  for (let t = 1; t <= crediting_yrs; t++) {
    const bl_cs = initial_cs + annual_increment * t - harvest_rate_bl * t * cf;
    const pj_cs = initial_cs + annual_increment * t - harvest_rate_pj * t * cf;
    const cs_diff = (pj_cs - bl_cs); // tCO2e per ha difference
    const gross = Math.max(0, cs_diff * area_ha * (44/12));
    const mkt_leak = gross * (leakage_mkt_pct / 100);
    const act_leak = gross * (leakage_act_pct / 100);
    const total_leak = mkt_leak + act_leak;
    const after_leak = gross - total_leak;
    const buffer = after_leak * (buffer_pct / 100);
    const net = (after_leak - buffer) * uncertainty_factor;
    const annual = t === 1 ? net : net - (years[t-2]?.cumulative || 0);
    years.push({
      year: t, bl_cs: Math.round(bl_cs*10)/10, pj_cs: Math.round(pj_cs*10)/10,
      cs_diff: Math.round(cs_diff*10)/10,
      gross: Math.round(gross), total_leak: Math.round(total_leak),
      buffer: Math.round(buffer), net: Math.round(net),
      annual: Math.round(annual), cumulative: Math.round(net),
    });
  }
  return { years, total: years.length > 0 ? years[years.length-1].cumulative : 0 };
};

/* Sample harvest schedule data */
const HARVEST_SCHEDULE = Array.from({length:30},(_, t)=>({
  year: t+1,
  baseline: t%5===4 ? Math.round(12 + sr(t*3)*8) : Math.round(2 + sr(t*7)*3),
  project: t%8===7 ? Math.round(6 + sr(t*5)*4) : Math.round(1 + sr(t*9)*2),
}));

const PROJECTS_IFM = Array.from({length:10},(_, i)=>{
  const countries = ['Canada','Finland','USA','Germany','Chile','New Zealand','Sweden','Japan','Australia','Brazil'];
  const types = IFM_TYPES[i%4];
  return {
    id:`IFM-${String(i+1).padStart(3,'0')}`, name:`${countries[i]} ${types.name} Project`,
    country: countries[i], type: types.id, area_ha: Math.round(20000+sr(i*11)*180000),
    credits: Math.round(200000+sr(i*13)*1800000), vintage: 2017+(i%7),
    status: i%4===3?'Verification':'Active', verifier: ['SCS Global','RINA','TÜV SÜD','ERM CVS','Aster Global','DNV','Bureau Veritas','Ruby Canyon','AENOR','Control Union'][i],
    timber_m3: Math.round(50000+sr(i*17)*450000),
  };
});

export default function CcIfmCreditsPage() {
  const TABS = ['Methodology Overview','Baseline Modeler','Credit Calculator','Harvest Scheduling','Leakage Assessment','Verification Timeline'];
  const [tab, setTab] = useState(TABS[0]);
  const [ifmType, setIfmType] = useState(IFM_TYPES[0]);

  const [params, setParams] = useState({
    area_ha: 50000, initial_cs: 180, annual_increment: 3.2, harvest_rate_bl: 4.5,
    harvest_rate_pj: 1.5, cf: 0.47, crediting_yrs: 30,
    leakage_mkt_pct: 20, leakage_act_pct: 10, buffer_pct: 15, uncertainty_factor: 0.90,
  });
  const setP = useCallback((k,v) => setParams(prev=>({...prev,[k]:v})),[]);
  const result = useMemo(() => calcIFM(params), [params]);

  return (
    <div style={{ fontFamily:T.font, background:T.cream, minHeight:'100vh', padding:'20px 24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, letterSpacing:'0.1em' }}>EP-BQ2</span>
          <span style={{ width:1, height:12, background:T.border }} />
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.emerald, fontWeight:600 }}>NATURE-BASED CARBON CREDITS</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>Improved Forest Management (IFM) Credits</h1>
        <p style={{ fontSize:12, color:T.textSec, marginTop:4 }}>VM0010 · Extended Rotation · RIL · Harvest Deferral · Baseline Carbon Stock Modeler · Leakage Assessment</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        <Kpi label="IFM Types" value="4" sub="RIL · ER · HD · CA" accent={T.emerald} />
        <Kpi label="Projects" value="10" sub="6 Countries · 4 Types" accent={T.teal} />
        <Kpi label="Total Credits" value={fmtK(PROJECTS_IFM.reduce((s,p)=>s+p.credits,0))} sub="tCO₂e all IFM" accent={T.gold} />
        <Kpi label="Calc Net" value={fmtK(result.total)} sub={`${params.crediting_yrs}yr · ${params.area_ha.toLocaleString()} ha`} accent={T.navy} />
        <Kpi label="Market Leakage" value={`${params.leakage_mkt_pct}%`} sub="Default IFM rate" accent={T.amber} />
        <Kpi label="Buffer Pool" value={`${params.buffer_pct}%`} sub="Non-permanence" accent={T.red} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══ TAB 1: Methodology Overview ═══ */}
      {tab === TABS[0] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="IFM Activity Types">
                {IFM_TYPES.map(it=>(
                  <div key={it.id} onClick={()=>setIfmType(it)} style={{
                    display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:4,cursor:'pointer',
                    background:ifmType.id===it.id?`${T.navy}08`:'transparent',border:`1px solid ${ifmType.id===it.id?T.border:'transparent'}`,marginBottom:4,
                  }}>
                    <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut,width:30,fontWeight:700}}>{it.id}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{it.name}</div>
                      <div style={{fontSize:10,color:T.textSec}}>{it.desc}</div>
                    </div>
                    <span style={{fontSize:10,fontFamily:T.mono,color:T.emerald,fontWeight:600}}>−{Math.round(it.default_harvest_reduction*100)}%</span>
                  </div>
                ))}
                <div style={{marginTop:12,padding:'8px 12px',background:`${T.emerald}08`,borderRadius:4}}>
                  <div style={{fontSize:10,color:T.textSec}}>Harvest reduction vs baseline: <strong style={{color:T.emerald}}>−{Math.round(ifmType.default_harvest_reduction*100)}%</strong></div>
                </div>
              </Section>
            </Card>
            <Card>
              <Section title="Core Formula">
                <div style={{padding:12,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:11,lineHeight:2,color:T.navy}}>
                  <div><strong>Baseline:</strong> CS_BL(t) = CS₀ + ΔG×t − H_BL×t×CF</div>
                  <div><strong>Project:</strong> CS_PJ(t) = CS₀ + ΔG×t − H_PJ×t×CF</div>
                  <div><strong>Gross:</strong> G(t) = [CS_PJ(t) − CS_BL(t)] × Area × 44/12</div>
                  <div><strong>Leakage:</strong> L = G × (Mkt% + Activity%)</div>
                  <div><strong>Net:</strong> N = (G − L) × (1 − Buffer%) × UF</div>
                </div>
                <div style={{marginTop:12,fontSize:10,color:T.textSec,lineHeight:1.5}}>
                  Where: CS₀ = initial carbon stock, ΔG = annual growth increment, H = harvest rate, CF = carbon fraction, UF = uncertainty factor (0.85–0.95)
                </div>
              </Section>
            </Card>
          </div>
          <Card>
            <Section title="Applicable Methodologies">
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {[
                  {id:'VM0010',name:'Methodology for IFM Through Extension of Rotation Age',registry:'Verra VCS',status:'Active'},
                  {id:'VM0012',name:'IFM in Temperate and Boreal Forests',registry:'Verra VCS',status:'Active'},
                  {id:'VM0003',name:'IFM Through Avoided Conversion',registry:'Verra VCS',status:'Active'},
                ].map(m=>(
                  <div key={m.id} style={{padding:12,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:10,fontFamily:T.mono,color:T.teal,fontWeight:600}}>{m.id}</div>
                    <div style={{fontSize:11,fontWeight:600,color:T.navy,marginTop:4}}>{m.name}</div>
                    <div style={{fontSize:10,color:T.textSec,marginTop:2}}>{m.registry}</div>
                    <Badge v={m.status} colors={{Active:'#059669'}} />
                  </div>
                ))}
              </div>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 2: Baseline Modeler ═══ */}
      {tab === TABS[1] && (
        <>
          <Card style={{marginBottom:16}} border={T.emerald}>
            <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:16}}>
              <div>
                <Section title="Baseline vs Project Parameters">
                  <DualInput label="Initial Carbon Stock (tC/ha)" value={params.initial_cs} min={50} max={400} step={5} onChange={v=>setP('initial_cs',v)} color={T.navy} />
                  <DualInput label="Annual Growth Increment (tC/ha/yr)" value={params.annual_increment} min={0.5} max={8} step={0.1} onChange={v=>setP('annual_increment',v)} color={T.emerald} />
                  <DualInput label="Baseline Harvest Rate (tC/ha/yr)" value={params.harvest_rate_bl} min={0} max={12} step={0.1} onChange={v=>setP('harvest_rate_bl',v)} color={T.red} />
                  <DualInput label="Project Harvest Rate (tC/ha/yr)" value={params.harvest_rate_pj} min={0} max={12} step={0.1} onChange={v=>setP('harvest_rate_pj',v)} color={T.emerald} />
                  <DualInput label="Carbon Fraction CF" value={params.cf} min={0.4} max={0.55} step={0.01} onChange={v=>setP('cf',v)} color={T.purple} />
                  <DualInput label="Crediting Period (yr)" value={params.crediting_yrs} min={10} max={60} onChange={v=>setP('crediting_yrs',v)} color={T.navy} />
                </Section>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Baseline vs Project Carbon Stock (tC/ha)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={result.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Year',position:'insideBottom',offset:-4,fontSize:10}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                    <Line dataKey="bl_cs" stroke={T.red} strokeWidth={2} name="Baseline CS" strokeDasharray="5 3" dot={false} />
                    <Line dataKey="pj_cs" stroke={T.emerald} strokeWidth={2} name="Project CS" dot={false} />
                    <ReferenceLine y={params.initial_cs} stroke={T.textMut} strokeDasharray="2 2" label={{value:'Initial',fill:T.textMut,fontSize:9}} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{marginTop:8,padding:'8px 12px',background:`${T.gold}10`,borderRadius:4,fontSize:10,color:T.textSec}}>
                  Carbon stock gap at year {params.crediting_yrs}: <strong style={{color:T.navy}}>{result.years.length>0?result.years[result.years.length-1].cs_diff:0} tC/ha</strong> = net sequestration benefit from IFM activity
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ═══ TAB 3: Credit Calculator ═══ */}
      {tab === TABS[2] && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <Card style={{marginBottom:12}} border={T.emerald}>
              <Section title="Project Parameters">
                <DualInput label="Project Area (ha)" value={params.area_ha} min={1000} max={500000} step={500} onChange={v=>setP('area_ha',v)} color={T.emerald} unit=" ha" />
                <DualInput label="Crediting Period (yr)" value={params.crediting_yrs} min={10} max={60} onChange={v=>setP('crediting_yrs',v)} color={T.navy} unit=" yr" />
              </Section>
            </Card>
            <Card style={{marginBottom:12}} border={T.red}>
              <Section title="Leakage & Deductions">
                <DualInput label="Market Leakage (%)" value={params.leakage_mkt_pct} min={0} max={50} onChange={v=>setP('leakage_mkt_pct',v)} color={T.red} unit="%" />
                <DualInput label="Activity Leakage (%)" value={params.leakage_act_pct} min={0} max={30} onChange={v=>setP('leakage_act_pct',v)} color={T.amber} unit="%" />
                <DualInput label="Buffer Pool (%)" value={params.buffer_pct} min={5} max={40} onChange={v=>setP('buffer_pct',v)} color={T.purple} unit="%" />
                <DualInput label="Uncertainty Factor" value={params.uncertainty_factor} min={0.7} max={1.0} step={0.01} onChange={v=>setP('uncertainty_factor',v)} color={T.navy} unit="×" />
              </Section>
            </Card>
          </div>
          <div>
            <div style={{background:T.navy,borderRadius:6,padding:16,marginBottom:12,color:T.cream}}>
              <div style={{fontSize:10,fontFamily:T.mono,color:`${T.cream}80`,letterSpacing:'0.1em',marginBottom:4}}>IFM NET CREDITS</div>
              <div style={{fontSize:48,fontWeight:700,fontFamily:T.mono,lineHeight:1}}>{fmtK(result.total)}</div>
              <div style={{fontSize:11,color:`${T.cream}80`,marginTop:4}}>tCO₂e over {params.crediting_yrs}yr · {params.area_ha.toLocaleString()} ha</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:12}}>
                {[['Avg Annual',fmtK(Math.round(result.total/params.crediting_yrs)),'tCO₂e/yr'],['Per Hectare',fmt(Math.round(result.total/params.area_ha*10)/10),'tCO₂e/ha'],['Market Leak',`${params.leakage_mkt_pct}%`,'deducted']].map(([l,v,u])=>(
                  <div key={l} style={{padding:8,background:'rgba(255,255,255,0.08)',borderRadius:4,textAlign:'center'}}>
                    <div style={{fontSize:9,color:`${T.cream}60`}}>{l}</div>
                    <div style={{fontSize:14,fontWeight:700,fontFamily:T.mono}}>{v}</div>
                    <div style={{fontSize:9,color:`${T.cream}60`}}>{u}</div>
                  </div>
                ))}
              </div>
            </div>
            <Card>
              <Section title="Cumulative Net Credits">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={result.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v)+' tCO₂e']} />
                    <Area dataKey="cumulative" fill={`${T.emerald}20`} stroke={T.emerald} strokeWidth={2} name="Net Credits" />
                    <Area dataKey="gross" fill={`${T.navy}10`} stroke={T.navy} strokeWidth={1} strokeDasharray="3 3" name="Gross" />
                  </AreaChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ TAB 4: Harvest Scheduling ═══ */}
      {tab === TABS[3] && (
        <Card>
          <Section title="Harvest Volume Comparison — Baseline vs Project (m³/ha/yr)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={HARVEST_SCHEDULE}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{fontSize:9,fontFamily:T.mono}} />
                <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'m³/ha/yr',angle:-90,position:'insideLeft',fontSize:10}} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                <Bar dataKey="baseline" fill={`${T.red}80`} name="Baseline Harvest" />
                <Bar dataKey="project" fill={`${T.emerald}80`} name="Project Harvest" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              <div style={{padding:10,background:`${T.red}08`,borderRadius:4,textAlign:'center'}}>
                <div style={{fontSize:9,color:T.textMut}}>Baseline Total (30yr)</div>
                <div style={{fontSize:16,fontWeight:700,color:T.red,fontFamily:T.mono}}>{fmtK(HARVEST_SCHEDULE.reduce((s,h)=>s+h.baseline,0))} m³/ha</div>
              </div>
              <div style={{padding:10,background:`${T.emerald}08`,borderRadius:4,textAlign:'center'}}>
                <div style={{fontSize:9,color:T.textMut}}>Project Total (30yr)</div>
                <div style={{fontSize:16,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{fmtK(HARVEST_SCHEDULE.reduce((s,h)=>s+h.project,0))} m³/ha</div>
              </div>
              <div style={{padding:10,background:`${T.gold}15`,borderRadius:4,textAlign:'center'}}>
                <div style={{fontSize:9,color:T.textMut}}>Volume Reduction</div>
                <div style={{fontSize:16,fontWeight:700,color:T.goldD,fontFamily:T.mono}}>{Math.round((1-HARVEST_SCHEDULE.reduce((s,h)=>s+h.project,0)/HARVEST_SCHEDULE.reduce((s,h)=>s+h.baseline,0))*100)}%</div>
              </div>
            </div>
          </Section>
        </Card>
      )}

      {/* ═══ TAB 5: Leakage Assessment ═══ */}
      {tab === TABS[4] && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Card border={T.red}>
            <Section title="Market Leakage">
              <div style={{fontSize:10,color:T.textSec,lineHeight:1.5,marginBottom:12}}>
                When harvesting is reduced within the project area, timber demand may shift to forests outside the project boundary, causing emissions elsewhere (leakage). The VCS default market leakage rate for IFM is 20%.
              </div>
              <DualInput label="Market Leakage Rate (%)" value={params.leakage_mkt_pct} min={0} max={50} onChange={v=>setP('leakage_mkt_pct',v)} color={T.red} unit="%" />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
                {[['Low (Certified sustainable)','0-10%'],['Default (VCS IFM)','20%'],['High (Commercial timber)','30-40%'],['Very High (No safeguards)','40-50%']].map(([l,v])=>(
                  <div key={l} style={{padding:6,background:T.cream,borderRadius:3,fontSize:10}}><span style={{color:T.textMut}}>{l}:</span> <strong>{v}</strong></div>
                ))}
              </div>
            </Section>
          </Card>
          <Card border={T.amber}>
            <Section title="Activity-Shifting Leakage">
              <div style={{fontSize:10,color:T.textSec,lineHeight:1.5,marginBottom:12}}>
                Activity-shifting occurs when forest users displaced by the project move their activities (logging, farming) to areas outside the boundary. Monitored via leakage belt analysis.
              </div>
              <DualInput label="Activity-Shifting Rate (%)" value={params.leakage_act_pct} min={0} max={30} onChange={v=>setP('leakage_act_pct',v)} color={T.amber} unit="%" />
              <div style={{marginTop:12,padding:10,background:`${T.amber}08`,borderRadius:4}}>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:4}}>Total Leakage Deduction</div>
                <div style={{fontSize:18,fontWeight:700,color:T.red,fontFamily:T.mono}}>{params.leakage_mkt_pct + params.leakage_act_pct}%</div>
                <div style={{fontSize:10,color:T.textSec}}>Market ({params.leakage_mkt_pct}%) + Activity ({params.leakage_act_pct}%)</div>
              </div>
            </Section>
          </Card>
        </div>
      )}

      {/* ═══ TAB 6: Verification Timeline ═══ */}
      {tab === TABS[5] && (
        <Card>
          <Section title="IFM Project Registry" right={`${PROJECTS_IFM.length} projects`}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:T.navy}}>
                {['ID','Project','Country','Type','Area (ha)','Credits','Timber (m³)','Vintage','Verifier','Status'].map(h=>(
                  <th key={h} style={{padding:'7px 8px',color:T.cream,fontSize:9,fontFamily:T.mono,textAlign:'left',fontWeight:600}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {PROJECTS_IFM.map((p,i)=>(
                  <tr key={p.id} style={{background:i%2===0?T.surface:`${T.cream}50`,borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{p.id}</td>
                    <td style={{padding:'6px 8px',fontWeight:600,color:T.navy,maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</td>
                    <td style={{padding:'6px 8px',color:T.textSec,fontSize:10}}>{p.country}</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:9,color:T.teal}}>{p.type}</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10}}>{p.area_ha.toLocaleString()}</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10,fontWeight:600,color:T.emerald}}>{p.credits.toLocaleString()}</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10}}>{p.timber_m3.toLocaleString()}</td>
                    <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10}}>{p.vintage}</td>
                    <td style={{padding:'6px 8px',fontSize:10,color:T.textSec}}>{p.verifier}</td>
                    <td style={{padding:'6px 8px'}}><Badge v={p.status} colors={{Active:'#059669',Verification:'#d97706'}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </Card>
      )}
    </div>
  );
}
