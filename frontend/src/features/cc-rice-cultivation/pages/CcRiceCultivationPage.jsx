import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';
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
   RICE CULTIVATION METHANE ENGINE
   ══════════════════════════════════════════════════════════════════ */

const WATER_REGIMES = [
  { id:'CF', name:'Continuous Flooding', desc:'Paddy fields continuously submerged throughout growing season', scaling:1.0, yield_impact:0, color:T.red },
  { id:'AWD', name:'Alternate Wetting & Drying', desc:'Periodic drainage cycles to reduce anaerobic CH4 production', scaling:0.5, yield_impact:-3, color:T.emerald },
  { id:'DS', name:'Dry Seeding', desc:'Direct seeding into dry soil, delayed flooding', scaling:0.35, yield_impact:-8, color:T.teal },
];

const REGIONAL_EF = [
  { region:'SE Asia (Vietnam, Thailand, Myanmar)', ef_low:250, ef_high:500, ef_mid:375, soil_correction:1.0, variety_factor:1.0 },
  { region:'South Asia (India, Bangladesh)', ef_low:200, ef_high:450, ef_mid:325, soil_correction:0.95, variety_factor:1.05 },
  { region:'East Asia (China, Japan, Korea)', ef_low:180, ef_high:400, ef_mid:290, soil_correction:0.90, variety_factor:0.95 },
  { region:'Sub-Saharan Africa', ef_low:150, ef_high:350, ef_mid:250, soil_correction:0.85, variety_factor:1.10 },
  { region:'Latin America (Brazil, Colombia)', ef_low:160, ef_high:380, ef_mid:270, soil_correction:0.90, variety_factor:1.0 },
  { region:'Mediterranean / Central Asia', ef_low:120, ef_high:300, ef_mid:210, soil_correction:0.80, variety_factor:0.90 },
];

const PROJECTS = Array.from({length:8},(_, i)=>{
  const countries=['Vietnam','India','China','Bangladesh','Thailand','Nigeria','Indonesia','Philippines'];
  const regimeIdx = i%3;
  return {
    id:`RC-${String(i+1).padStart(3,'0')}`, name:`${countries[i]} Rice CH4 Project`,
    country: countries[i], regime: WATER_REGIMES[regimeIdx].id,
    area_ha: Math.round(5000+sr(i*11)*45000),
    ef_baseline: Math.round(200+sr(i*13)*300),
    seasons: [2,3,2,3,2,1,2,2][i],
    credits: Math.round(30000+sr(i*17)*270000), vintage: 2020+(i%5),
    status: i%3===2?'Verification':'Active',
    awd_scaling: [1.0,0.5,0.35,0.5,1.0,0.5,0.35,0.5][i],
  };
});

const calcRiceCH4 = (params) => {
  const { ef_baseline, area_ha, seasons, awd_scaling, gwp_ch4, buffer_pct } = params;
  const ch4_bl = ef_baseline * area_ha * seasons * 1e-6 * gwp_ch4; // tCO2e
  const ch4_pj = ch4_bl * awd_scaling;
  const gross = ch4_bl - ch4_pj;
  const net = gross * (1 - buffer_pct/100);
  const waterfall = [
    { name:'Baseline', value:Math.round(ch4_bl), fill:T.red },
    { name:'Project', value:-Math.round(ch4_pj), fill:T.amber },
    { name:'Gross Reduction', value:Math.round(gross), fill:T.emerald },
    { name:'Buffer Deduction', value:-Math.round(gross*buffer_pct/100), fill:T.purple },
    { name:'Net Credits', value:Math.round(net), fill:T.navy },
  ];
  return { ch4_bl:Math.round(ch4_bl), ch4_pj:Math.round(ch4_pj), gross:Math.round(gross), net:Math.round(net), waterfall };
};

export default function CcRiceCultivationPage() {
  const { addCalculation, addProject, getSummary } = useCarbonCredit();
  const TABS = ['Methodology Overview','Rice CH4 Calculator','AWD Practice Model','Multi-Season Analysis','Regional Benchmarks'];
  const [tab, setTab] = useState(TABS[0]);

  /* Rice CH4 calc inputs */
  const [rp, setRp] = useState({
    ef_baseline: 350, area_ha: 15000, seasons: 2, awd_scaling: 0.5, gwp_ch4: 28, buffer_pct: 12,
  });
  const setR = useCallback((k,v) => setRp(prev=>({...prev,[k]:v})),[]);

  /* Multi-season inputs */
  const [s1EF, setS1EF] = useState(380);
  const [s2EF, setS2EF] = useState(320);
  const [s3EF, setS3EF] = useState(280);
  const [msArea, setMsArea] = useState(10000);
  const [msAWD, setMsAWD] = useState(0.5);
  const [msBuf, setMsBuf] = useState(12);

  const riceResult = useMemo(() => calcRiceCH4(rp), [rp]);

  useEffect(() => {
    if (riceResult && riceResult.net > 0) {
      addCalculation({
        projectId: 'CC-LIVE',
        methodology: 'AMS-III.AU',
        family: 'agriculture',
        cluster: 'Rice Cultivation',
        inputs: rp,
        outputs: riceResult,
        net_tco2e: riceResult.net || 0,
      });
    }
  }, [riceResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const awdComparison = useMemo(() => WATER_REGIMES.map(w => {
    const r = calcRiceCH4({...rp, awd_scaling:w.scaling});
    return { name:w.name, baseline:riceResult.ch4_bl, project:r.ch4_pj, net:r.net, yield_change:w.yield_impact };
  }), [rp, riceResult.ch4_bl]);

  const multiSeasonData = useMemo(() => {
    const efs = [s1EF, s2EF, s3EF];
    const seasons = efs.map((ef,i) => {
      const bl = ef * msArea * 1 * 1e-6 * 28;
      const pj = bl * msAWD;
      const net = (bl - pj) * (1 - msBuf/100);
      return { season:`Season ${i+1}`, ef, baseline:Math.round(bl), project:Math.round(pj), net:Math.round(net) };
    });
    const total = seasons.reduce((s,x)=>s+x.net,0);
    return { seasons, total:Math.round(total) };
  }, [s1EF, s2EF, s3EF, msArea, msAWD, msBuf]);

  const avgEF = useMemo(() => Math.round(PROJECTS.reduce((s,p)=>s+p.ef_baseline,0)/PROJECTS.length), []);
  const awdReduction = useMemo(() => `${Math.round((1-rp.awd_scaling)*100)}%`, [rp.awd_scaling]);

  return (
    <div style={{ fontFamily:T.font, background:T.cream, minHeight:'100vh', padding:'20px 24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, letterSpacing:'0.1em' }}>EP-BR3</span>
          <span style={{ width:1, height:12, background:T.border }} />
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.emerald, fontWeight:600 }}>AGRICULTURE CARBON CREDITS</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>Rice Cultivation Methane</h1>
        <p style={{ fontSize:12, color:T.textSec, marginTop:4 }}>AMS-III.AU · Alternate Wetting & Drying · Dry Seeding · Midseason Drainage · Regional Emission Factors</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        <Kpi label="Water Regimes" value="3" sub="CF · AWD · DS" accent={T.emerald} />
        <Kpi label="Projects" value="8" sub={`${[...new Set(PROJECTS.map(p=>p.country))].length} Countries`} accent={T.teal} />
        <Kpi label="AWD Reduction" value={awdReduction} sub="vs Continuous Flooding" accent={T.gold} />
        <Kpi label="Calc Net Credits" value={fmtK(riceResult.net)} sub={`${rp.area_ha.toLocaleString()} ha · ${rp.seasons} season(s)`} accent={T.navy} />
        <Kpi label="Seasons" value={rp.seasons} sub="per year" accent={T.purple} />
        <Kpi label="Avg EF" value={`${avgEF}`} sub="kg CH4/ha (baseline)" accent={T.amber} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══ TAB 1: Methodology Overview ═══ */}
      {tab === TABS[0] && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card>
              <Section title="Water Management Regimes">
                {WATER_REGIMES.map(w=>(
                  <div key={w.id} style={{padding:12,background:T.cream,borderRadius:4,border:`1px solid ${T.border}`,marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                      <span style={{width:28,height:28,borderRadius:14,background:`${w.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:w.color,fontFamily:T.mono}}>{w.id}</span>
                      <div style={{flex:1}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{w.name}</span>
                        <span style={{fontSize:10,color:T.emerald,fontFamily:T.mono,marginLeft:8}}>SF={w.scaling}</span>
                      </div>
                    </div>
                    <div style={{fontSize:10,color:T.textSec,marginBottom:4}}>{w.desc}</div>
                    <div style={{display:'flex',gap:12}}>
                      <span style={{fontSize:9,fontFamily:T.mono,color:T.navy}}>Scaling: {w.scaling}</span>
                      <span style={{fontSize:9,fontFamily:T.mono,color:w.yield_impact<0?T.amber:T.emerald}}>Yield: {w.yield_impact>=0?'+':''}{w.yield_impact}%</span>
                    </div>
                  </div>
                ))}
              </Section>
              <Section title="Core Formula">
                <div style={{padding:12,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:11,lineHeight:2,color:T.navy}}>
                  <div><strong>Baseline:</strong> CH4_BL = EF x Area x Seasons x 10-6 x GWP</div>
                  <div><strong>Project:</strong> CH4_PJ = CH4_BL x AWD_SF</div>
                  <div><strong>Net:</strong> (CH4_BL - CH4_PJ) x (1 - Buffer%)</div>
                </div>
                <div style={{marginTop:8,fontSize:10,color:T.textSec,lineHeight:1.5}}>
                  Where: EF = emission factor (kg CH4/ha), AWD_SF = scaling factor (0.3-1.0), GWP = 28 (AR5)
                </div>
              </Section>
            </Card>
            <Card>
              <Section title="Applicable Methodology">
                <div style={{padding:12,background:`${T.teal}08`,borderRadius:6,border:`1px solid ${T.teal}30`,marginBottom:12}}>
                  <div style={{fontSize:10,fontFamily:T.mono,color:T.teal,fontWeight:600}}>AMS-III.AU</div>
                  <div style={{fontSize:12,fontWeight:700,color:T.navy,marginTop:4}}>Methane Emission Reduction by Adjusted Water Management Practice in Rice Cultivation</div>
                  <div style={{fontSize:10,color:T.textSec,marginTop:4}}>UNFCCC CDM Small-Scale Methodology. Applicable to projects introducing AWD, midseason drainage, or dry seeding in rice paddies that were previously under continuous flooding.</div>
                  <Badge v="Active" colors={{Active:T.emerald}} />
                </div>
              </Section>
              <Section title="Sample Projects">
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                    <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                      {['ID','Country','Regime','Area','EF','Seasons','Credits','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 6px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                    </tr></thead>
                    <tbody>{PROJECTS.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'5px 6px',color:T.teal,fontWeight:600}}>{p.id}</td>
                      <td style={{padding:'5px 6px'}}>{p.country}</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.regime} colors={{CF:T.red,AWD:T.emerald,DS:T.teal}} /></td>
                      <td style={{padding:'5px 6px',textAlign:'right'}}>{p.area_ha.toLocaleString()}</td>
                      <td style={{padding:'5px 6px',textAlign:'right'}}>{p.ef_baseline}</td>
                      <td style={{padding:'5px 6px',textAlign:'center'}}>{p.seasons}</td>
                      <td style={{padding:'5px 6px',textAlign:'right',color:T.emerald,fontWeight:600}}>{p.credits.toLocaleString()}</td>
                      <td style={{padding:'5px 6px'}}><Badge v={p.status} colors={{Active:T.emerald,Verification:T.amber}} /></td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </Section>
            </Card>
          </div>
        </>
      )}

      {/* ═══ TAB 2: Rice CH4 Calculator ═══ */}
      {tab === TABS[1] && (
        <>
          <Card style={{marginBottom:16}} border={T.emerald}>
            <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:16}}>
              <div>
                <Section title="CH4 Emission Parameters">
                  <DualInput label="Emission Factor (kg CH4/ha)" value={rp.ef_baseline} min={100} max={600} step={10} onChange={v=>setR('ef_baseline',v)} color={T.red} />
                  <DualInput label="Project Area (ha)" value={rp.area_ha} min={100} max={50000} step={100} onChange={v=>setR('area_ha',v)} color={T.navy} />
                  <DualInput label="Seasons per Year" value={rp.seasons} min={1} max={3} step={1} onChange={v=>setR('seasons',v)} color={T.teal} />
                  <DualInput label="AWD Scaling Factor" value={rp.awd_scaling} min={0.3} max={1.0} step={0.05} onChange={v=>setR('awd_scaling',v)} color={T.emerald} />
                  <DualInput label="GWP CH4" value={rp.gwp_ch4} min={25} max={84} step={1} onChange={v=>setR('gwp_ch4',v)} color={T.purple} />
                  <DualInput label="Buffer %" value={rp.buffer_pct} min={10} max={15} step={0.5} onChange={v=>setR('buffer_pct',v)} color={T.amber} unit="%" />
                </Section>
                <div style={{padding:12,background:`${T.emerald}0a`,borderRadius:6,border:`1px solid ${T.emerald}30`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Net Credits</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{fmtK(riceResult.net)}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tCO2e · SF={rp.awd_scaling} · {rp.seasons} season(s)</div>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Credit Waterfall</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={riceResult.waterfall} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} />
                    <YAxis dataKey="name" type="category" tick={{fontSize:10,fontFamily:T.mono}} width={100} />
                    <Tooltip contentStyle={TIP} formatter={v=>fmtK(Math.abs(v))} />
                    <Bar dataKey="value" radius={[0,3,3,0]}>
                      {riceResult.waterfall.map((e,i)=><Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:8,padding:10,background:T.cream,borderRadius:4,fontFamily:T.mono,fontSize:10,color:T.navy,lineHeight:1.8}}>
                  <div>CH4_BL = {rp.ef_baseline} x {rp.area_ha.toLocaleString()} x {rp.seasons} x 10-6 x {rp.gwp_ch4} = <strong>{riceResult.ch4_bl.toLocaleString()} tCO2e</strong></div>
                  <div>CH4_PJ = {riceResult.ch4_bl.toLocaleString()} x {rp.awd_scaling} = <strong>{riceResult.ch4_pj.toLocaleString()} tCO2e</strong></div>
                  <div>Gross = {riceResult.ch4_bl.toLocaleString()} - {riceResult.ch4_pj.toLocaleString()} = <strong>{riceResult.gross.toLocaleString()} tCO2e</strong></div>
                  <div>Net = {riceResult.gross.toLocaleString()} x (1 - {rp.buffer_pct}%) = <strong style={{color:T.emerald}}>{riceResult.net.toLocaleString()} tCO2e</strong></div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <Section title="EF Sensitivity" right="Net credits vs emission factor">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={[100,150,200,250,300,350,400,450,500,550,600].map(ef=>{
                  const r = calcRiceCH4({...rp, ef_baseline:ef});
                  return { ef, net:r.net };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="ef" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'EF (kg CH4/ha)',position:'insideBottom',offset:-4,fontSize:10}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} />
                  <Area dataKey="net" stroke={T.emerald} fill={`${T.emerald}15`} name="Net Credits" strokeWidth={2} />
                  <ReferenceLine x={rp.ef_baseline} stroke={T.red} strokeDasharray="3 3" label={{value:'Current EF',fill:T.red,fontSize:9}} />
                </AreaChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 3: AWD Practice Model ═══ */}
      {tab === TABS[2] && (
        <>
          <Card style={{marginBottom:16}} border={T.teal}>
            <Section title="Water Regime Comparison">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Emissions by Water Regime (tCO2e)</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={awdComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                      <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                      <Tooltip contentStyle={TIP} />
                      <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                      <Bar dataKey="baseline" fill={T.red} radius={[3,3,0,0]} name="Baseline" />
                      <Bar dataKey="project" fill={T.emerald} radius={[3,3,0,0]} name="Project" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Net Credits & Yield Impact</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={awdComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                      <YAxis yAxisId="left" tick={{fontSize:10,fontFamily:T.mono}} />
                      <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fontFamily:T.mono}} />
                      <Tooltip contentStyle={TIP} />
                      <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                      <Bar yAxisId="left" dataKey="net" fill={T.navy} radius={[3,3,0,0]} name="Net Credits (tCO2e)">
                        {awdComparison.map((_,i)=><Cell key={i} fill={[T.red,T.emerald,T.teal][i]} />)}
                      </Bar>
                      <Bar yAxisId="right" dataKey="yield_change" fill={T.amber} radius={[3,3,0,0]} name="Yield Change (%)">
                        {awdComparison.map((_,i)=><Cell key={i} fill={awdComparison[i].yield_change<0?T.amber:T.emerald} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>
          </Card>
          <Card>
            <Section title="Scaling Factor Sensitivity" right="AWD SF vs credits">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9,0.95,1.0].map(sf=>{
                  const r = calcRiceCH4({...rp, awd_scaling:sf});
                  return { sf, net:r.net, reduction:Math.round((1-sf)*100) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sf" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'AWD Scaling Factor',position:'insideBottom',offset:-4,fontSize:10}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Net Credits',angle:-90,position:'insideLeft',fontSize:10}} />
                  <Tooltip contentStyle={TIP} />
                  <Line dataKey="net" stroke={T.emerald} strokeWidth={2} name="Net Credits" dot={{r:2,fill:T.emerald}} />
                  <ReferenceLine x={rp.awd_scaling} stroke={T.red} strokeDasharray="3 3" label={{value:'Current',fill:T.red,fontSize:9}} />
                  <ReferenceLine x={0.5} stroke={T.teal} strokeDasharray="2 2" label={{value:'AWD typ.',fill:T.teal,fontSize:9,position:'top'}} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Practice Detail Comparison">
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                  <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                    {['Regime','Scaling Factor','CH4 Reduction','Yield Impact','Net Credits','Cost/ha','Adoption Rate'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{WATER_REGIMES.map(w=>{
                    const r = calcRiceCH4({...rp, awd_scaling:w.scaling});
                    return <tr key={w.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'6px 8px',color:T.navy,fontWeight:600}}>{w.name}</td>
                      <td style={{padding:'6px 8px',textAlign:'center'}}>{w.scaling}</td>
                      <td style={{padding:'6px 8px',color:T.emerald,fontWeight:600}}>{w.scaling<1?`-${Math.round((1-w.scaling)*100)}%`:'0%'}</td>
                      <td style={{padding:'6px 8px',color:w.yield_impact<0?T.amber:T.emerald}}>{w.yield_impact>=0?'+':''}{w.yield_impact}%</td>
                      <td style={{padding:'6px 8px',textAlign:'right',fontWeight:600}}>{fmtK(r.net)}</td>
                      <td style={{padding:'6px 8px',textAlign:'right',color:T.amber}}>${w.id==='CF'?0:w.id==='AWD'?35:55}/ha</td>
                      <td style={{padding:'6px 8px'}}>{w.id==='CF'?'Baseline':w.id==='AWD'?'Growing':'Emerging'}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            </Section>
          </Card>
        </>
      )}

      {/* ═══ TAB 4: Multi-Season Analysis ═══ */}
      {tab === TABS[3] && (
        <>
          <Card style={{marginBottom:16}} border={T.purple}>
            <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:16}}>
              <div>
                <Section title="Season-by-Season EF Inputs">
                  <DualInput label="Season 1 EF (kg CH4/ha)" value={s1EF} min={100} max={600} step={10} onChange={setS1EF} color={T.red} />
                  <DualInput label="Season 2 EF (kg CH4/ha)" value={s2EF} min={100} max={600} step={10} onChange={setS2EF} color={T.amber} />
                  <DualInput label="Season 3 EF (kg CH4/ha)" value={s3EF} min={100} max={600} step={10} onChange={setS3EF} color={T.teal} />
                  <div style={{height:8}} />
                  <DualInput label="Total Area (ha)" value={msArea} min={100} max={50000} step={100} onChange={setMsArea} color={T.navy} />
                  <DualInput label="AWD Scaling Factor" value={msAWD} min={0.3} max={1.0} step={0.05} onChange={setMsAWD} color={T.emerald} />
                  <DualInput label="Buffer %" value={msBuf} min={10} max={15} step={0.5} onChange={setMsBuf} color={T.purple} unit="%" />
                </Section>
                <div style={{padding:12,background:`${T.purple}0a`,borderRadius:6,border:`1px solid ${T.purple}30`}}>
                  <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Annual Total Net</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.purple,fontFamily:T.mono}}>{fmtK(multiSeasonData.total)}</div>
                  <div style={{fontSize:10,color:T.textSec}}>tCO2e across 3 seasons</div>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Stacked Season Breakdown (tCO2e)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[
                    { label:'Baseline', s1:multiSeasonData.seasons[0]?.baseline||0, s2:multiSeasonData.seasons[1]?.baseline||0, s3:multiSeasonData.seasons[2]?.baseline||0 },
                    { label:'Project', s1:multiSeasonData.seasons[0]?.project||0, s2:multiSeasonData.seasons[1]?.project||0, s3:multiSeasonData.seasons[2]?.project||0 },
                    { label:'Net Credits', s1:multiSeasonData.seasons[0]?.net||0, s2:multiSeasonData.seasons[1]?.net||0, s3:multiSeasonData.seasons[2]?.net||0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="label" tick={{fontSize:10,fontFamily:T.mono}} />
                    <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                    <Bar dataKey="s1" stackId="a" fill={T.red} name="Season 1" />
                    <Bar dataKey="s2" stackId="a" fill={T.amber} name="Season 2" />
                    <Bar dataKey="s3" stackId="a" fill={T.teal} name="Season 3" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:12}}>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                      <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                        {['Season','EF (kg/ha)','Baseline (tCO2e)','Project (tCO2e)','Net Credits','% of Total'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 6px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                      </tr></thead>
                      <tbody>{multiSeasonData.seasons.map(s=><tr key={s.season} style={{borderBottom:`1px solid ${T.border}`}}>
                        <td style={{padding:'5px 6px',color:T.navy,fontWeight:600}}>{s.season}</td>
                        <td style={{padding:'5px 6px',textAlign:'right'}}>{s.ef}</td>
                        <td style={{padding:'5px 6px',textAlign:'right'}}>{s.baseline.toLocaleString()}</td>
                        <td style={{padding:'5px 6px',textAlign:'right'}}>{s.project.toLocaleString()}</td>
                        <td style={{padding:'5px 6px',textAlign:'right',color:T.emerald,fontWeight:600}}>{s.net.toLocaleString()}</td>
                        <td style={{padding:'5px 6px',textAlign:'right'}}>{multiSeasonData.total>0?Math.round(s.net/multiSeasonData.total*100):0}%</td>
                      </tr>)}</tbody>
                      <tfoot><tr style={{borderTop:`2px solid ${T.navy}`}}>
                        <td style={{padding:'5px 6px',fontWeight:700,color:T.navy}} colSpan={4}>Annual Total</td>
                        <td style={{padding:'5px 6px',textAlign:'right',fontWeight:700,color:T.emerald}}>{multiSeasonData.total.toLocaleString()}</td>
                        <td style={{padding:'5px 6px',textAlign:'right',fontWeight:700}}>100%</td>
                      </tr></tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ═══ TAB 5: Regional Benchmarks ═══ */}
      {tab === TABS[4] && (
        <>
          <Card style={{marginBottom:16}} border={T.gold}>
            <Section title="Regional Emission Factors (kg CH4/ha)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={REGIONAL_EF.map(r=>({name:r.region.split('(')[0].trim(),low:r.ef_low,mid:r.ef_mid,high:r.ef_high}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} angle={-10} textAnchor="end" height={50} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} label={{value:'kg CH4/ha',angle:-90,position:'insideLeft',fontSize:9}} />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                  <Bar dataKey="low" fill={`${T.emerald}60`} name="Low" radius={[0,0,0,0]} />
                  <Bar dataKey="mid" fill={T.teal} name="Midpoint" radius={[0,0,0,0]} />
                  <Bar dataKey="high" fill={T.red} name="High" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Card>
          <Card>
            <Section title="Full Regional Benchmark Table" right="Soil & variety corrections included">
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
                  <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                    {['Region','EF Low','EF Mid','EF High','Soil Correction','Variety Factor','Adjusted Mid'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',color:T.textMut,fontSize:9,textTransform:'uppercase'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{REGIONAL_EF.map(r=>{
                    const adjusted = Math.round(r.ef_mid * r.soil_correction * r.variety_factor);
                    return <tr key={r.region} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'6px 8px',color:T.navy,fontWeight:600,maxWidth:180}}>{r.region}</td>
                      <td style={{padding:'6px 8px',textAlign:'right',color:T.emerald}}>{r.ef_low}</td>
                      <td style={{padding:'6px 8px',textAlign:'right',fontWeight:600}}>{r.ef_mid}</td>
                      <td style={{padding:'6px 8px',textAlign:'right',color:T.red}}>{r.ef_high}</td>
                      <td style={{padding:'6px 8px',textAlign:'right'}}>{r.soil_correction}</td>
                      <td style={{padding:'6px 8px',textAlign:'right'}}>{r.variety_factor}</td>
                      <td style={{padding:'6px 8px',textAlign:'right',color:T.teal,fontWeight:700}}>{adjusted}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            </Section>
            <Section title="EF Range Visualization by Region">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={REGIONAL_EF.map((r,i)=>({name:r.region.split('(')[0].trim(),low:r.ef_low,mid:r.ef_mid,high:r.ef_high,idx:i}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                  <Line dataKey="high" stroke={T.red} strokeWidth={1.5} name="High EF" dot={{r:3,fill:T.red}} />
                  <Line dataKey="mid" stroke={T.navy} strokeWidth={2} name="Mid EF" dot={{r:3,fill:T.navy}} />
                  <Line dataKey="low" stroke={T.emerald} strokeWidth={1.5} name="Low EF" dot={{r:3,fill:T.emerald}} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </Card>
        </>
      )}
    </div>
  );
}
