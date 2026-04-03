import React, { useState, useMemo, useCallback } from 'react';
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
   INDUSTRIAL GASES & PROCESS EMISSIONS ENGINE
   ══════════════════════════════════════════════════════════════════ */

const GAS_TYPES = [
  { id:'HFC-23', name:'HFC-23 (CHF3)', gwp:14800, sector:'HCFC-22 Production', color:T.red },
  { id:'N2O', name:'Nitrous Oxide (N2O)', gwp:265, sector:'Adipic / Nitric Acid', color:T.emerald },
  { id:'SF6', name:'Sulfur Hexafluoride (SF6)', gwp:23500, sector:'Electrical Switchgear', color:T.purple },
  { id:'HFC-134a', name:'HFC-134a', gwp:1300, sector:'Refrigeration / AC', color:T.teal },
  { id:'HFC-32', name:'HFC-32', gwp:677, sector:'Refrigeration', color:T.navy },
  { id:'PFC-14', name:'PFC-14 (CF4)', gwp:7390, sector:'Aluminium Smelting', color:T.gold },
];

const DESTRUCTION_TECHS = [
  { id:'thermal', name:'Thermal Oxidation', temp_c:'1000-1200', eff:0.995, capex_per_t:12000, opex_per_t:800, suitable:['HFC-23','HFC-134a','HFC-32'], notes:'High-temp combustion, most common' },
  { id:'plasma', name:'Plasma Arc Destruction', temp_c:'3000-5000', eff:0.9999, capex_per_t:25000, opex_per_t:1500, suitable:['SF6','PFC-14','HFC-23'], notes:'Ultra-high DRE for recalcitrant gases' },
  { id:'cement', name:'Cement Kiln Co-processing', temp_c:'1400-1500', eff:0.998, capex_per_t:5000, opex_per_t:400, suitable:['HFC-23','N2O','HFC-134a'], notes:'Co-processing in clinker production' },
  { id:'catalytic', name:'Catalytic Decomposition', temp_c:'350-600', eff:0.985, capex_per_t:8000, opex_per_t:600, suitable:['N2O'], notes:'Low-temp N2O reduction, catalyst-dependent' },
];

const KIGALI_PHASES = [
  { group:'A1 (Developed)', baseline_yr:'2011-2013', freeze:2019, reduce_10:2029, reduce_85:2036, mandate_pct:100 },
  { group:'A5-G1 (Developing)', baseline_yr:'2020-2022', freeze:2024, reduce_10:2029, reduce_80:2045, mandate_pct:80 },
  { group:'A5-G2 (High-ambient)', baseline_yr:'2024-2026', freeze:2028, reduce_10:2032, reduce_85:2047, mandate_pct:85 },
];

const PROJECTS = Array.from({length:8},(_,i)=>{
  const gases = GAS_TYPES[i%6];
  const techs = DESTRUCTION_TECHS[i%4];
  const countries = ['China','India','Mexico','Argentina','South Korea','Brazil','Russia','Egypt'];
  return {
    id:`IG-${String(i+1).padStart(3,'0')}`, name:`${countries[i]} ${gases.id} Destruction`,
    country: countries[i], gas_type: gases.id, gwp: gases.gwp,
    quantity_t: Math.round(5+sr(i*11)*995),
    destruction_eff: techs.eff,
    tech: techs.name,
    tco2e_avoided: Math.round((5+sr(i*11)*995) * techs.eff * gases.gwp),
    policy_baseline_pct: Math.round(sr(i*17)*40),
    vintage: 2021+(i%4), status: i%4===3?'Verification':'Active',
    methodology: gases.id==='N2O'?'AM0028':'AM0001',
  };
});

const calcIndustrialGas = (params) => {
  const { gas_type, quantity_t, destruction_eff, policy_baseline_pct } = params;
  const gas = GAS_TYPES.find(g=>g.id===gas_type) || GAS_TYPES[0];
  const baseline_quantity = quantity_t * (1 - policy_baseline_pct/100);
  const tco2e_baseline = baseline_quantity * gas.gwp;
  const tco2e_destroyed = quantity_t * destruction_eff * gas.gwp;
  const tco2e_project = quantity_t * (1 - destruction_eff) * gas.gwp;
  const net_credits = (tco2e_baseline - tco2e_project);
  const additionality_gap = tco2e_destroyed - tco2e_baseline;
  return {
    gas_name:gas.name, gwp:gas.gwp, baseline_quantity:Math.round(baseline_quantity*100)/100,
    tco2e_baseline:Math.round(tco2e_baseline), tco2e_destroyed:Math.round(tco2e_destroyed),
    tco2e_project:Math.round(tco2e_project), net_credits:Math.round(net_credits),
    additionality_gap:Math.round(additionality_gap),
  };
};

export default function CcIndustrialGasesPage() {
  const TABS = ['Methodology Overview','Industrial Gas Calculator','Destruction Technology','Regulatory Baseline','Monitoring Protocol'];
  const [tab, setTab] = useState(TABS[0]);

  /* Calculator inputs */
  const [ig, setIg] = useState({
    gas_type:'HFC-23', quantity_t:100, destruction_eff:0.995, policy_baseline_pct:0,
  });
  const setI = useCallback((k,v) => setIg(prev=>({...prev,[k]:v})),[]);
  const [selTech, setSelTech] = useState(0);

  const igResult = useMemo(() => calcIndustrialGas(ig), [ig]);

  /* Aggregates */
  const totalAvoided = useMemo(() => PROJECTS.reduce((s,p)=>s+p.tco2e_avoided,0), []);
  const avgGWP = useMemo(() => Math.round(PROJECTS.reduce((s,p)=>s+p.gwp,0)/PROJECTS.length), []);

  /* Gas comparison data */
  const gasCompare = useMemo(() => GAS_TYPES.map(g=>({
    name:g.id, gwp:g.gwp, log_gwp:Math.log10(g.gwp),
    per_tonne:Math.round(g.gwp * ig.destruction_eff),
  })), [ig.destruction_eff]);

  return (
    <div style={{ fontFamily:T.font, background:T.cream, minHeight:'100vh', padding:'20px 24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, letterSpacing:'0.1em' }}>EP-BT2</span>
          <span style={{ width:1, height:12, background:T.border }} />
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.teal, fontWeight:600 }}>WASTE &amp; INDUSTRIAL CREDITS</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>Industrial Gases &amp; Process Emissions</h1>
        <p style={{ fontSize:12, color:T.textSec, marginTop:4 }}>AM0001 / AM0028 &middot; HFC-23 &middot; N2O &middot; SF6 &middot; Kigali Amendment &middot; Destruction Technologies</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        <Kpi label="Gas Types" value="6" sub="HFC, N2O, SF6, PFC" accent={T.red} />
        <Kpi label="Projects" value="8" sub={`${[...new Set(PROJECTS.map(p=>p.country))].length} Countries`} accent={T.teal} />
        <Kpi label="Total Avoided" value={fmtK(totalAvoided)} sub="tCO2e all projects" accent={T.emerald} />
        <Kpi label="Avg GWP" value={fmtK(avgGWP)} sub="Across project gases" accent={T.purple} />
        <Kpi label="Selected Gas" value={ig.gas_type} sub={`GWP=${igResult.gwp}`} accent={T.navy} />
        <Kpi label="Net Credits" value={fmtK(igResult.net_credits)} sub="tCO2e from calculator" accent={T.gold} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══ TAB 1: Methodology Overview ═══ */}
      {tab === TABS[0] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="Industrial Gas Types">
                {GAS_TYPES.map(g=>(
                  <div key={g.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:4,marginBottom:4,background:T.surface,border:`1px solid ${T.border}`}}>
                    <span style={{width:28,height:28,borderRadius:14,background:`${g.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:g.color,fontFamily:T.mono}}>{g.id.split('-')[0]}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.navy}}>{g.name}</div>
                      <div style={{fontSize:9,color:T.textSec}}>{g.sector}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:12,fontWeight:700,color:g.color,fontFamily:T.mono}}>{g.gwp.toLocaleString()}</div>
                      <div style={{fontSize:8,color:T.textMut}}>GWP-100</div>
                    </div>
                  </div>
                ))}
              </Section>
              <Section title="Core Formula">
                <div style={{padding:12,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:10,color:T.navy,lineHeight:2}}>
                  <div>BASELINE = Quantity x (1 - Policy_Baseline%) x GWP</div>
                  <div>PROJECT = Quantity x (1 - Destruction_Eff) x GWP</div>
                  <div style={{fontWeight:700,color:T.emerald}}>NET_CREDITS = BASELINE - PROJECT</div>
                </div>
              </Section>
            </Card>
            <Card>
              <Section title="Project Portfolio">
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                    <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                      {['ID','Country','Gas','GWP','Qty (t)','tCO2e','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 6px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                    </tr></thead>
                    <tbody>{PROJECTS.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'5px 6px',color:T.teal,fontWeight:600}}>{p.id}</td>
                      <td style={{padding:'5px 6px'}}>{p.country}</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.gas_type} colors={Object.fromEntries(GAS_TYPES.map(g=>[g.id,g.color]))} /></td>
                      <td style={{padding:'5px 6px',textAlign:'right'}}>{p.gwp.toLocaleString()}</td>
                      <td style={{padding:'5px 6px',textAlign:'right'}}>{p.quantity_t.toLocaleString()}</td>
                      <td style={{padding:'5px 6px',textAlign:'right',color:T.emerald,fontWeight:600}}>{p.tco2e_avoided.toLocaleString()}</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.status} colors={{Active:T.emerald,Verification:T.amber}} /></td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </Section>
              <Section title="GWP Comparison (Log Scale)">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gasCompare}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} scale="log" domain={['auto','auto']} />
                    <Tooltip contentStyle={TIP} formatter={(v)=>v.toLocaleString()} />
                    <Bar dataKey="gwp" radius={[3,3,0,0]} name="GWP-100">
                      {GAS_TYPES.map((g,i)=><Cell key={i} fill={g.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 2: Industrial Gas Calculator ═══ */}
      {tab === TABS[1] && (
        <>
          <Card style={{marginBottom:16}} border={T.red}>
            <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16}}>
              <div>
                <Section title="Gas Destruction Parameters">
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:9,color:T.textMut,marginBottom:4}}>Gas Type</div>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {GAS_TYPES.map(g=><button key={g.id} onClick={()=>setI('gas_type',g.id)} style={{padding:'4px 8px',fontSize:8,fontWeight:600,cursor:'pointer',border:`1px solid ${ig.gas_type===g.id?g.color:T.border}`,borderRadius:4,background:ig.gas_type===g.id?`${g.color}10`:T.surface,color:ig.gas_type===g.id?g.color:T.textSec,fontFamily:T.mono}}>{g.id}</button>)}
                    </div>
                  </div>
                  <DualInput label="Quantity (tonnes)" value={ig.quantity_t} min={1} max={1000} step={1} onChange={v=>setI('quantity_t',v)} color={T.navy} unit="t" />
                  <DualInput label="Destruction Efficiency" value={ig.destruction_eff} min={0.950} max={0.999} step={0.001} onChange={v=>setI('destruction_eff',v)} color={T.emerald} />
                  <DualInput label="Policy Baseline % (mandatory)" value={ig.policy_baseline_pct} min={0} max={100} step={5} onChange={v=>setI('policy_baseline_pct',v)} color={T.amber} unit="%" />
                </Section>
                <div style={{padding:12,background:`${T.emerald}0a`,borderRadius:6,border:`1px solid ${T.emerald}30`,marginBottom:10}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Net Credits</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{fmtK(igResult.net_credits)}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tCO2e | {igResult.gas_name} (GWP={igResult.gwp.toLocaleString()})</div>
                </div>
                {ig.policy_baseline_pct > 0 && (
                  <div style={{padding:8,background:`${T.amber}0a`,borderRadius:4,border:`1px solid ${T.amber}30`}}>
                    <div style={{fontSize:9,fontWeight:600,color:T.amber}}>Additionality Adjustment</div>
                    <div style={{fontSize:9,color:T.textSec}}>Policy mandates {ig.policy_baseline_pct}% destruction. Only non-mandatory portion generates credits.</div>
                  </div>
                )}
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Baseline vs Project Emissions</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    {name:'Baseline',tco2e:igResult.tco2e_baseline},
                    {name:'Destroyed',tco2e:igResult.tco2e_destroyed},
                    {name:'Residual (Project)',tco2e:igResult.tco2e_project},
                    {name:'Net Credits',tco2e:igResult.net_credits},
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} label={{value:'tCO2e',angle:-90,position:'insideLeft',fontSize:9}} />
                    <Tooltip contentStyle={TIP} formatter={v=>v.toLocaleString()} />
                    <Bar dataKey="tco2e" radius={[3,3,0,0]} name="tCO2e">
                      <Cell fill={T.red} /><Cell fill={T.teal} /><Cell fill={T.amber} /><Cell fill={T.emerald} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:12,padding:10,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:9,color:T.navy,lineHeight:1.8}}>
                  <div>Gas: {igResult.gas_name} | GWP-100 = {igResult.gwp.toLocaleString()}</div>
                  <div>Baseline = {ig.quantity_t} x (1 - {ig.policy_baseline_pct}%) x {igResult.gwp.toLocaleString()} = <strong>{igResult.tco2e_baseline.toLocaleString()} tCO2e</strong></div>
                  <div>Project = {ig.quantity_t} x (1 - {ig.destruction_eff}) x {igResult.gwp.toLocaleString()} = <strong>{igResult.tco2e_project.toLocaleString()} tCO2e</strong></div>
                  <div>Net = {igResult.tco2e_baseline.toLocaleString()} - {igResult.tco2e_project.toLocaleString()} = <strong style={{color:T.emerald}}>{igResult.net_credits.toLocaleString()} tCO2e</strong></div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <Section title="Quantity Sensitivity" right="Credits vs tonnes destroyed">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[10,50,100,200,300,500,700,1000].map(q=>{
                  const r = calcIndustrialGas({...ig,quantity_t:q});
                  return { qty:q, net:r.net_credits };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="qty" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Quantity (t)',position:'insideBottom',offset:-4,fontSize:9}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} formatter={v=>v.toLocaleString()} />
                  <Line dataKey="net" stroke={T.emerald} strokeWidth={2} name="Net Credits (tCO2e)" dot={{r:3,fill:T.emerald}} />
                  <ReferenceLine x={ig.quantity_t} stroke={T.red} strokeDasharray="3 3" label={{value:'Current',fill:T.red,fontSize:9}} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 3: Destruction Technology ═══ */}
      {tab === TABS[2] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="Technology Comparison">
                <div style={{display:'flex',gap:4,marginBottom:12}}>
                  {DESTRUCTION_TECHS.map((t,i)=><button key={t.id} onClick={()=>setSelTech(i)} style={{padding:'6px 10px',fontSize:9,fontWeight:600,cursor:'pointer',border:`1px solid ${selTech===i?T.teal:T.border}`,borderRadius:4,background:selTech===i?`${T.teal}10`:T.surface,color:selTech===i?T.teal:T.textSec,fontFamily:T.font}}>{t.name}</button>)}
                </div>
                {(()=>{
                  const t = DESTRUCTION_TECHS[selTech];
                  return (
                    <div style={{padding:14,background:T.cream,borderRadius:6,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>{t.name}</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                        {[
                          {l:'Temperature',v:t.temp_c+'C'},
                          {l:'DRE',v:(t.eff*100).toFixed(2)+'%'},
                          {l:'CAPEX/t',v:'$'+t.capex_per_t.toLocaleString()},
                          {l:'OPEX/t/yr',v:'$'+t.opex_per_t.toLocaleString()},
                        ].map(kv=>(
                          <div key={kv.l} style={{padding:8,background:T.surface,borderRadius:4,border:`1px solid ${T.border}`}}>
                            <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase'}}>{kv.l}</div>
                            <div style={{fontSize:14,fontWeight:700,color:T.teal,fontFamily:T.mono}}>{kv.v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:10,color:T.textSec,marginBottom:6}}>{t.notes}</div>
                      <div style={{fontSize:9,color:T.textMut}}>Suitable gases: {t.suitable.join(', ')}</div>
                    </div>
                  );
                })()}
              </Section>
            </Card>
            <Card>
              <Section title="Technology Radar — Performance Metrics">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={[
                    {metric:'DRE',thermal:99.5,plasma:99.99,cement:99.8,catalytic:98.5},
                    {metric:'Cost Eff',thermal:80,plasma:40,cement:95,catalytic:75},
                    {metric:'Scalability',thermal:85,plasma:60,cement:90,catalytic:50},
                    {metric:'Gas Range',thermal:70,plasma:95,cement:60,catalytic:30},
                    {metric:'Track Record',thermal:90,plasma:70,cement:80,catalytic:60},
                  ]}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="metric" tick={{fontSize:9,fontFamily:T.mono}} />
                    <PolarRadiusAxis tick={{fontSize:8}} domain={[0,100]} />
                    <Radar name="Thermal" dataKey="thermal" stroke={T.red} fill={T.red} fillOpacity={0.15} />
                    <Radar name="Plasma" dataKey="plasma" stroke={T.purple} fill={T.purple} fillOpacity={0.15} />
                    <Radar name="Cement" dataKey="cement" stroke={T.gold} fill={T.gold} fillOpacity={0.15} />
                    <Radar name="Catalytic" dataKey="catalytic" stroke={T.teal} fill={T.teal} fillOpacity={0.15} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Tooltip contentStyle={TIP} />
                  </RadarChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Cost Breakdown by Technology">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={DESTRUCTION_TECHS.map(t=>({name:t.name.split(' ')[0],capex:t.capex_per_t,opex:t.opex_per_t}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} label={{value:'$/tonne',angle:-90,position:'insideLeft',fontSize:9}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Bar dataKey="capex" fill={T.navy} name="CAPEX/t" radius={[3,3,0,0]} />
                    <Bar dataKey="opex" fill={T.gold} name="OPEX/t/yr" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 4: Regulatory Baseline ═══ */}
      {tab === TABS[3] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card border={T.amber}>
              <Section title="Kigali Amendment Phase-Down Schedule">
                <div style={{fontSize:10,color:T.textSec,marginBottom:12}}>The Kigali Amendment to the Montreal Protocol mandates phase-down of HFC production and consumption, impacting additionality of HFC destruction credits.</div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                  <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                    {['Group','Baseline','Freeze','10% Cut','80-85% Cut'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 6px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{KIGALI_PHASES.map(p=><tr key={p.group} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'5px 6px',fontWeight:600,color:T.navy}}>{p.group}</td>
                    <td style={{padding:'5px 6px'}}>{p.baseline_yr}</td>
                    <td style={{padding:'5px 6px',color:T.amber}}>{p.freeze}</td>
                    <td style={{padding:'5px 6px',color:T.teal}}>{p.reduce_10}</td>
                    <td style={{padding:'5px 6px',color:T.emerald}}>{p.reduce_85||p.reduce_80}</td>
                  </tr>)}</tbody>
                </table>
              </Section>
              <Section title="Additionality Impact">
                <div style={{padding:12,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`,fontSize:10,color:T.textSec,lineHeight:1.8}}>
                  <div><strong style={{color:T.navy}}>Key principle:</strong> Credits can only be generated for destruction beyond regulatory mandates.</div>
                  <div><strong style={{color:T.red}}>Risk:</strong> As Kigali phase-down accelerates, mandatory destruction % increases, shrinking creditable portion.</div>
                  <div><strong style={{color:T.emerald}}>Mitigation:</strong> Front-load issuance, secure long-dated offtake agreements, focus on non-Kigali gases (SF6, N2O).</div>
                </div>
              </Section>
            </Card>
            <Card>
              <Section title="Phase-Down Timeline Visualization">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={Array.from({length:30},(_,i)=>{
                    const yr = 2020+i;
                    const a1 = yr<2019?0:yr<2029?Math.min((yr-2019)*3,30):yr<2036?30+(yr-2029)*8:100;
                    const a5g1 = yr<2024?0:yr<2029?Math.min((yr-2024)*4,20):yr<2045?20+(yr-2029)*4:80;
                    return { year:yr, 'A1 Developed':Math.min(a1,100), 'A5 Developing':Math.min(a5g1,80) };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{fontSize:8,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} label={{value:'Mandatory %',angle:-90,position:'insideLeft',fontSize:9}} domain={[0,100]} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Area dataKey="A1 Developed" fill={`${T.red}20`} stroke={T.red} strokeWidth={2} />
                    <Area dataKey="A5 Developing" fill={`${T.teal}20`} stroke={T.teal} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Policy Baseline Impact on Credits">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[0,10,20,30,40,50,60,70,80,90,100].map(pct=>{
                    const r = calcIndustrialGas({...ig,policy_baseline_pct:pct});
                    return { policy_pct:pct, net:r.net_credits };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="policy_pct" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Mandatory Destruction %',position:'insideBottom',offset:-4,fontSize:9}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} formatter={v=>v.toLocaleString()} />
                    <Line dataKey="net" stroke={T.emerald} strokeWidth={2} name="Net Credits (tCO2e)" dot={{r:3,fill:T.emerald}} />
                    <ReferenceLine x={ig.policy_baseline_pct} stroke={T.red} strokeDasharray="3 3" label={{value:'Current',fill:T.red,fontSize:9}} />
                  </LineChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 5: Monitoring Protocol ═══ */}
      {tab === TABS[4] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="Monitoring Requirements (AM0001 / AM0028)">
                {[
                  {param:'Gas Quantity Fed',method:'Mass flow meter (Coriolis / turbine)',freq:'Continuous',accuracy:'+/-1%',critical:true},
                  {param:'Gas Composition',method:'GC-MS / FTIR analyser',freq:'Continuous',accuracy:'+/-0.5%',critical:true},
                  {param:'Destruction Temp',method:'Type K thermocouple, multi-point',freq:'Continuous',accuracy:'+/-5C',critical:true},
                  {param:'Stack Emissions',method:'CEMS: residual HFC/N2O concentration',freq:'Continuous',accuracy:'+/-2%',critical:true},
                  {param:'Feed Gas Purity',method:'Cylinder sampling + lab analysis',freq:'Per batch',accuracy:'PPM level',critical:false},
                  {param:'Energy Consumption',method:'kWh metering on destruction unit',freq:'Continuous',accuracy:'+/-2%',critical:false},
                  {param:'Ambient Monitoring',method:'Open-path / point sensors at fence line',freq:'Continuous',accuracy:'PPB level',critical:false},
                  {param:'Production Records',method:'HCFC-22 / HFC plant output logs',freq:'Daily',accuracy:'Audit trail',critical:false},
                ].map(m=>(
                  <div key={m.param} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:4,marginBottom:3,background:m.critical?`${T.red}06`:T.surface,border:`1px solid ${m.critical?`${T.red}20`:T.border}`}}>
                    <span style={{width:6,height:6,borderRadius:3,background:m.critical?T.red:T.emerald}} />
                    <span style={{fontSize:10,fontWeight:600,color:T.navy,width:110}}>{m.param}</span>
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
                  {step:'Calibration',desc:'Zero/span gas calibration of GC-MS and flow meters',freq:'Weekly',tier:'T1'},
                  {step:'Mass Balance',desc:'Cross-check feed gas vs destruction output + residual',freq:'Monthly',tier:'T1'},
                  {step:'Stack Testing',desc:'Third-party stack emission testing by accredited lab',freq:'Quarterly',tier:'T2'},
                  {step:'Equipment Audit',desc:'Verify instrument calibration certificates, data logger integrity',freq:'Semi-annual',tier:'T2'},
                  {step:'VVB Site Visit',desc:'Full verification audit with sampling and document review',freq:'Annual',tier:'T3'},
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
              <Section title="Simulated Monthly Destruction Output">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={Array.from({length:12},(_,i)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],qty:Math.round(ig.quantity_t/12*(0.85+sr(i*7)*0.3)),tco2e:Math.round(ig.quantity_t/12*(0.85+sr(i*7)*0.3)*igResult.gwp*ig.destruction_eff)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{fontSize:8,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} formatter={v=>v.toLocaleString()} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Bar dataKey="tco2e" fill={T.teal} name="tCO2e Destroyed" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
