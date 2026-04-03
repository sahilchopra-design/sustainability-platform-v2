import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area, Cell, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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

/* ======================================================================
   CLEAN COOKING CREDITS ENGINE
   EP-BS2 - AMS-II.G / GS-TPDDTEC Clean Cooking Methodology
   ====================================================================== */

const TECH_TYPES_CC=[
  {id:'ICS',name:'Improved Biomass Cookstove',baseline_eff:0.10,project_eff:0.35,fuel:'Wood',color:T.amber},
  {id:'LPG',name:'LPG Stove',baseline_eff:0.10,project_eff:0.55,fuel:'LPG',color:T.teal},
  {id:'BIO',name:'Biogas Digester',baseline_eff:0.12,project_eff:0.50,fuel:'Biogas',color:T.emerald},
  {id:'ELC',name:'Electric/Induction',baseline_eff:0.10,project_eff:0.80,fuel:'Electricity',color:T.purple},
];

const SDG_GOALS=[
  {sdg:3,name:'Good Health & Well-being',icon:'3',desc:'Indoor air quality improvement, reduced respiratory disease'},
  {sdg:5,name:'Gender Equality',icon:'5',desc:'Reduced fuel collection burden on women and girls'},
  {sdg:7,name:'Affordable & Clean Energy',icon:'7',desc:'Access to modern energy for cooking'},
  {sdg:13,name:'Climate Action',icon:'13',desc:'GHG emission reductions from reduced biomass burning'},
];

const COUNTRIES_CC=['Kenya','Uganda','Rwanda','Tanzania','India','Bangladesh','Nepal','Cambodia','Ghana','Nigeria','Malawi','Myanmar'];

const PROJECTS_CC=Array.from({length:8},(_,i)=>{
  const techIdx=i%TECH_TYPES_CC.length;
  const tech=TECH_TYPES_CC[techIdx];
  const country=COUNTRIES_CC[i%COUNTRIES_CC.length];
  const stoves=Math.round(5000+sr(i*7)*95000);
  const adoption=parseFloat((0.60+sr(i*11)*0.35).toFixed(2));
  const fnrb=parseFloat((0.50+sr(i*13)*0.45).toFixed(2));
  const fuelKg=parseFloat((3.5+sr(i*17)*4.5).toFixed(1));
  const ncv=15.6;
  const ef=112.0;
  const stackFactor=parseFloat((0.70+sr(i*19)*0.25).toFixed(2));
  const rebound=parseFloat((0.05+sr(i*23)*0.12).toFixed(2));
  const blFuel=fuelKg*365;
  const be=blFuel*ncv*ef*1e-6*fnrb;
  const pjFuel=blFuel*(tech.baseline_eff/tech.project_eff)*stackFactor;
  const er=be*(1-rebound)*stoves*adoption*1e-3;
  const sdgScores=SDG_GOALS.map(g=>Math.round(40+sr(i*31+g.sdg*7)*55));
  return {
    id:`CC-${String(i+1).padStart(3,'0')}`,name:`${country} ${tech.name} Programme`,tech:tech.id,techName:tech.name,
    country,stoves,adoption,fnrb,fuelKg,ncv,ef,stackFactor,rebound,
    blFuel:Math.round(blFuel),pjFuel:Math.round(pjFuel),
    bePerStove:parseFloat(be.toFixed(2)),erTotal:Math.round(er),
    sdgScores,credits:Math.round(er*0.90),vintage:2021+Math.floor(sr(i*29)*4),
    status:['Active','Monitoring','Verification','Issuance'][Math.floor(sr(i*37)*4)],
    color:tech.color,
  };
});

const calcCleanCooking=(params)=>{
  const {fuelKg,ncv,ef,fnrb,blEff,pjEff,stackFactor,rebound,stoves,adoption}=params;
  const blFuelAnnual=fuelKg*365;
  const bePerHH=blFuelAnnual*ncv*ef*1e-6*fnrb;
  const pjFuelAnnual=blFuelAnnual*(blEff/pjEff)*stackFactor;
  const pjEmissions=pjFuelAnnual*ncv*ef*1e-6*fnrb*0.1;
  const erPerHH=bePerHH*(1-rebound)-pjEmissions;
  const totalER=erPerHH*stoves*adoption;
  const waterfall=[
    {name:'Baseline Fuel',value:Math.round(bePerHH*stoves*adoption),fill:T.red},
    {name:'Efficiency Gain',value:-Math.round(bePerHH*stoves*adoption*(1-blEff/pjEff)),fill:T.emerald},
    {name:'Stacking Loss',value:Math.round(bePerHH*stoves*adoption*(1-stackFactor)*0.3),fill:T.amber},
    {name:'Rebound Effect',value:-Math.round(bePerHH*stoves*adoption*rebound),fill:T.purple},
    {name:'Net ER',value:Math.round(totalER),fill:T.navy},
  ];
  return {bePerHH:parseFloat(bePerHH.toFixed(3)),erPerHH:parseFloat(erPerHH.toFixed(3)),totalER:Math.round(totalER),pjFuelAnnual:Math.round(pjFuelAnnual),blFuelAnnual:Math.round(blFuelAnnual),waterfall,netCredits:Math.round(totalER*0.90)};
};

export default function CcCleanCookingPage(){
  const TABS=['Methodology Overview','Baseline Emissions Calculator','Emission Reductions','fNRB Assessment','SDG Co-Benefits','Usage Monitoring'];
  const [tab,setTab]=useState(TABS[0]);

  /* Baseline calc inputs */
  const [cp,setCp]=useState({
    fuelKg:5.0,ncv:15.6,ef:112.0,fnrb:0.72,blEff:0.10,pjEff:0.40,
    stackFactor:0.80,rebound:0.10,stoves:20000,adoption:0.75,
  });
  const setC=useCallback((k,v)=>setCp(prev=>({...prev,[k]:v})),[]);

  /* fNRB inputs */
  const [fnrbForest,setFnrbForest]=useState(45);
  const [fnrbDemand,setFnrbDemand]=useState(60);
  const [fnrbSupply,setFnrbSupply]=useState(35);

  const cookResult=useMemo(()=>calcCleanCooking(cp),[cp]);

  const fnrbCalc=useMemo(()=>{
    const fnrb=Math.min(1,Math.max(0,(fnrbDemand-fnrbSupply)/Math.max(fnrbDemand,1)));
    const adjusted=fnrb*(fnrbForest/100);
    const sensitivity=[20,30,40,50,60,70,80].map(d=>{
      const f=Math.min(1,Math.max(0,(d-fnrbSupply)/Math.max(d,1)));
      return {demand:d,fnrb:parseFloat(f.toFixed(2)),adjusted:parseFloat((f*fnrbForest/100).toFixed(2))};
    });
    return {fnrb:parseFloat(fnrb.toFixed(3)),adjusted:parseFloat(adjusted.toFixed(3)),sensitivity};
  },[fnrbForest,fnrbDemand,fnrbSupply]);

  /* SDG aggregates */
  const sdgAvg=useMemo(()=>SDG_GOALS.map((g,gi)=>{
    const avg=Math.round(PROJECTS_CC.reduce((s,pr)=>s+pr.sdgScores[gi],0)/PROJECTS_CC.length);
    return {...g,avg};
  }),[]);

  /* Usage monitoring mock data */
  const usageMonthly=useMemo(()=>Array.from({length:12},(_,i)=>{
    const month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i];
    return {
      month,
      activeStoves:Math.round(cp.stoves*cp.adoption*(0.85+sr(i*7+300)*0.15)),
      avgUsageHrs:parseFloat((3.5+sr(i*11+300)*2.5).toFixed(1)),
      fuelSaved:Math.round(cp.stoves*cp.adoption*cp.fuelKg*(1-cp.blEff/cp.pjEff)*30*(0.8+sr(i*13+300)*0.2)),
      creditsIssued:Math.round(cookResult.netCredits/12*(0.7+sr(i*17+300)*0.6)),
    };
  }),[cp,cookResult.netCredits]);

  const portStats=useMemo(()=>{
    const totalCredits=PROJECTS_CC.reduce((s,pr)=>s+pr.credits,0);
    const totalStoves=PROJECTS_CC.reduce((s,pr)=>s+pr.stoves,0);
    const totalER=PROJECTS_CC.reduce((s,pr)=>s+pr.erTotal,0);
    const avgAdoption=parseFloat((PROJECTS_CC.reduce((s,pr)=>s+pr.adoption,0)/PROJECTS_CC.length).toFixed(2));
    return {totalCredits,totalStoves,totalER,avgAdoption};
  },[]);

  return (
    <div style={{fontFamily:T.font,background:T.cream,minHeight:'100vh',padding:'20px 24px'}}>
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <span style={{fontSize:9,fontFamily:T.mono,color:T.textMut,letterSpacing:'0.1em'}}>EP-BS2</span>
          <span style={{width:1,height:12,background:T.border}} />
          <span style={{fontSize:9,fontFamily:T.mono,color:T.emerald,fontWeight:600}}>ENERGY CARBON CREDITS</span>
        </div>
        <h1 style={{fontSize:20,fontWeight:700,color:T.navy,margin:0}}>Clean Cooking Credits</h1>
        <p style={{fontSize:12,color:T.textSec,marginTop:4}}>AMS-II.G / GS-TPDDTEC &middot; Improved Cookstoves &middot; fNRB Assessment &middot; SDG Co-Benefits Scoring &middot; Usage Monitoring</p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ─── TAB 1: Methodology Overview ─── */}
      {tab===TABS[0]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:20}}>
          <Kpi label="Total Credits Issued" value={fmtK(portStats.totalCredits)} sub="tCO2e/yr" accent={T.emerald} />
          <Kpi label="Stoves Distributed" value={fmtK(portStats.totalStoves)} sub={`${PROJECTS_CC.length} programmes`} accent={T.gold} />
          <Kpi label="Total Emission Reductions" value={fmtK(portStats.totalER)} sub="tCO2e/yr" accent={T.navy} />
          <Kpi label="Avg Adoption Rate" value={`${Math.round(portStats.avgAdoption*100)}%`} sub="programme average" accent={T.teal} />
        </div>

        <Section title="Clean Cooking Methodology">
          <Card border={T.navy}>
            <div style={{fontSize:12,color:T.textSec,lineHeight:1.8}}>
              <p style={{margin:'0 0 8px'}}><strong>Baseline Emissions:</strong> <code style={{fontFamily:T.mono,background:T.cream,padding:'2px 6px',borderRadius:3,fontSize:11}}>BE = Adjusted_Fuel x NCV x EF x fNRB</code></p>
              <p style={{margin:'0 0 8px'}}><strong>Emission Reductions:</strong> <code style={{fontFamily:T.mono,background:T.cream,padding:'2px 6px',borderRadius:3,fontSize:11}}>ER = BE x (1 - Rebound)</code></p>
              <p style={{margin:'0 0 8px'}}><strong>Project Fuel:</strong> <code style={{fontFamily:T.mono,background:T.cream,padding:'2px 6px',borderRadius:3,fontSize:11}}>PJ_Fuel = BL_Fuel x (BL_Eff / PJ_Eff) x Stacking</code></p>
              <p style={{margin:'0 0 8px'}}><strong>fNRB:</strong> Fraction of Non-Renewable Biomass - accounts for unsustainable harvesting of biomass fuel</p>
              <p style={{margin:0}}><strong>Stacking Factor:</strong> Accounts for households using both baseline and project stoves simultaneously</p>
            </div>
          </Card>
        </Section>

        <Section title="Technology Comparison">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
            {TECH_TYPES_CC.map(t=>(
              <Card key={t.id} border={t.color}>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:6}}>{t.name}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:11}}>
                  <div><span style={{color:T.textMut}}>Baseline Eff:</span> <strong style={{fontFamily:T.mono}}>{(t.baseline_eff*100).toFixed(0)}%</strong></div>
                  <div><span style={{color:T.textMut}}>Project Eff:</span> <strong style={{fontFamily:T.mono}}>{(t.project_eff*100).toFixed(0)}%</strong></div>
                  <div><span style={{color:T.textMut}}>Fuel:</span> {t.fuel}</div>
                  <div><span style={{color:T.textMut}}>Eff Gain:</span> <strong style={{fontFamily:T.mono,color:T.emerald}}>{((t.project_eff/t.baseline_eff-1)*100).toFixed(0)}%</strong></div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Credits by Programme">
          <Card>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={PROJECTS_CC} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="id" tick={{fontSize:10,fill:T.textMut}} />
                <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v),'tCO2e']} />
                <Legend wrapperStyle={{fontSize:10}} />
                <Bar dataKey="erTotal" name="Emission Reductions" fill={T.navy} radius={[3,3,0,0]} />
                <Bar dataKey="credits" name="Net Credits" fill={T.emerald} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      </div>)}

      {/* ─── TAB 2: Baseline Emissions Calculator ─── */}
      {tab===TABS[1]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16}}>
          <Card border={T.teal}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:12}}>Household Parameters</div>
            <DualInput label="Daily Fuel Consumption (kg)" value={cp.fuelKg} min={1} max={15} step={0.1} onChange={v=>setC('fuelKg',v)} unit=" kg" />
            <DualInput label="Net Calorific Value (MJ/kg)" value={cp.ncv} min={10} max={25} step={0.1} onChange={v=>setC('ncv',v)} unit=" MJ/kg" />
            <DualInput label="Emission Factor (tCO2/TJ)" value={cp.ef} min={50} max={150} step={1} onChange={v=>setC('ef',v)} unit="" />
            <DualInput label="fNRB (0.5-1.0)" value={cp.fnrb} min={0.30} max={1.0} step={0.01} onChange={v=>setC('fnrb',v)} color={T.emerald} />
            <DualInput label="Baseline Efficiency (0.05-0.20)" value={cp.blEff} min={0.05} max={0.20} step={0.01} onChange={v=>setC('blEff',v)} color={T.amber} />
            <DualInput label="Project Efficiency (0.25-0.60)" value={cp.pjEff} min={0.25} max={0.80} step={0.01} onChange={v=>setC('pjEff',v)} color={T.teal} />
            <DualInput label="Stacking Factor" value={cp.stackFactor} min={0.50} max={1.0} step={0.01} onChange={v=>setC('stackFactor',v)} />
            <DualInput label="Rebound Effect (0.05-0.20)" value={cp.rebound} min={0.0} max={0.30} step={0.01} onChange={v=>setC('rebound',v)} color={T.red} />
            <DualInput label="Stoves Distributed" value={cp.stoves} min={1000} max={200000} step={1000} onChange={v=>setC('stoves',v)} unit="" />
            <DualInput label="Adoption Rate" value={cp.adoption} min={0.30} max={1.0} step={0.01} onChange={v=>setC('adoption',v)} color={T.gold} />
          </Card>

          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
              <Kpi label="BE per Household" value={cookResult.bePerHH} sub="tCO2e/yr" accent={T.red} />
              <Kpi label="ER per Household" value={cookResult.erPerHH} sub="tCO2e/yr" accent={T.emerald} />
              <Kpi label="Total ER" value={fmtK(cookResult.totalER)} sub="tCO2e/yr" accent={T.navy} />
              <Kpi label="Net Credits" value={fmtK(cookResult.netCredits)} sub="after 10% buffer" color={T.emerald} accent={T.gold} />
            </div>

            <Section title="Emission Reduction Waterfall">
              <Card>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={cookResult.waterfall} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} />
                    <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                    <Tooltip contentStyle={TIP} formatter={v=>[fmtK(Math.abs(v)),'tCO2e']} />
                    <Bar dataKey="value" radius={[3,3,0,0]}>
                      {cookResult.waterfall.map((d,i)=><Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            <Section title="Fuel Comparison">
              <Card>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div style={{padding:12,background:T.cream,borderRadius:4,borderLeft:`3px solid ${T.red}`}}>
                    <div style={{fontSize:10,color:T.textMut}}>Baseline Fuel (annual)</div>
                    <div style={{fontSize:18,fontWeight:700,color:T.red,fontFamily:T.mono}}>{fmtK(cookResult.blFuelAnnual)} kg</div>
                    <div style={{fontSize:10,color:T.textSec}}>per household</div>
                  </div>
                  <div style={{padding:12,background:T.cream,borderRadius:4,borderLeft:`3px solid ${T.emerald}`}}>
                    <div style={{fontSize:10,color:T.textMut}}>Project Fuel (annual)</div>
                    <div style={{fontSize:18,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{fmtK(cookResult.pjFuelAnnual)} kg</div>
                    <div style={{fontSize:10,color:T.textSec}}>per household ({Math.round((1-cookResult.pjFuelAnnual/cookResult.blFuelAnnual)*100)}% reduction)</div>
                  </div>
                </div>
              </Card>
            </Section>
          </div>
        </div>
      </div>)}

      {/* ─── TAB 3: Emission Reductions ─── */}
      {tab===TABS[2]&&(<div>
        <Section title="Technology Efficiency Comparison">
          <Card>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={TECH_TYPES_CC.map(t=>{
                const blFuel=cp.fuelKg*365;
                const be=blFuel*cp.ncv*cp.ef*1e-6*cp.fnrb;
                const pjFuel=blFuel*(t.baseline_eff/t.project_eff)*cp.stackFactor;
                const er=be*(1-cp.rebound);
                return {tech:t.name,baseline:parseFloat(be.toFixed(2)),reduction:parseFloat(er.toFixed(2)),pjFuel:Math.round(pjFuel)};
              })} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{fontSize:9,fill:T.textSec}} />
                <YAxis tick={{fontSize:10,fill:T.textMut}} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{fontSize:10}} />
                <Bar dataKey="baseline" name="Baseline (tCO2e/HH)" fill={T.red} radius={[3,3,0,0]} />
                <Bar dataKey="reduction" name="Reduction (tCO2e/HH)" fill={T.emerald} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section title={`Programme Registry (${PROJECTS_CC.length} programmes)`}>
          <Card style={{padding:0,overflow:'hidden'}}>
            <div style={{maxHeight:400,overflowY:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
                <thead style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                  <tr>{['ID','Programme','Technology','Country','Stoves','Adoption','fNRB','Rebound','ER (tCO2e)','Credits','Status'].map(h=><th key={h} style={{padding:'8px 8px',textAlign:'left',fontSize:10,color:T.textMut,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap'}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {PROJECTS_CC.map((pr,idx)=>(
                    <tr key={pr.id} style={{borderBottom:`1px solid ${T.border}`,background:idx%2===0?T.cream:'transparent'}}>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{pr.id}</td>
                      <td style={{padding:'6px 8px',fontWeight:600,color:T.navy,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pr.name}</td>
                      <td style={{padding:'6px 8px'}}><Badge v={pr.tech} colors={{ICS:T.amber,LPG:T.teal,BIO:T.emerald,ELC:T.purple}} /></td>
                      <td style={{padding:'6px 8px',fontSize:10}}>{pr.country}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{fmtK(pr.stoves)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{Math.round(pr.adoption*100)}%</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.fnrb}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.red}}>{Math.round(pr.rebound*100)}%</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{fmtK(pr.erTotal)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.emerald,fontWeight:600}}>{fmtK(pr.credits)}</td>
                      <td style={{padding:'6px 8px'}}><Badge v={pr.status} colors={{Active:T.emerald,Monitoring:T.teal,Verification:T.amber,Issuance:T.navy}} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        <Section title="Rebound & Stacking Sensitivity">
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={[0.0,0.05,0.10,0.15,0.20,0.25,0.30].map(r=>{
                const res=calcCleanCooking({...cp,rebound:r});
                return {rebound:`${Math.round(r*100)}%`,er:res.totalER,credits:res.netCredits};
              })} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rebound" tick={{fontSize:10,fill:T.textMut}} />
                <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v),'tCO2e']} />
                <Legend wrapperStyle={{fontSize:10}} />
                <Line type="monotone" dataKey="er" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Total ER" />
                <Line type="monotone" dataKey="credits" stroke={T.emerald} strokeWidth={2} dot={{r:3}} name="Net Credits" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      </div>)}

      {/* ─── TAB 4: fNRB Assessment ─── */}
      {tab===TABS[3]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:16}}>
          <Card border={T.emerald}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:12}}>fNRB Parameters</div>
            <DualInput label="Forest Cover (%)" value={fnrbForest} min={5} max={90} step={1} onChange={setFnrbForest} unit="%" color={T.emerald} />
            <DualInput label="Biomass Demand (kt/yr)" value={fnrbDemand} min={10} max={200} step={5} onChange={setFnrbDemand} unit=" kt" color={T.red} />
            <DualInput label="Sustainable Supply (kt/yr)" value={fnrbSupply} min={5} max={150} step={5} onChange={setFnrbSupply} unit=" kt" color={T.teal} />
            <div style={{marginTop:12,padding:10,background:T.cream,borderRadius:4,fontSize:10,fontFamily:T.mono,color:T.textSec}}>
              Raw fNRB: <strong>{fnrbCalc.fnrb}</strong><br/>
              Adjusted fNRB: <strong style={{color:T.emerald}}>{fnrbCalc.adjusted}</strong><br/>
              Formula: (Demand - Supply) / Demand x Forest%
            </div>
          </Card>

          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              <Kpi label="Raw fNRB" value={fnrbCalc.fnrb} sub="(Demand-Supply)/Demand" accent={T.navy} />
              <Kpi label="Adjusted fNRB" value={fnrbCalc.adjusted} sub="forest-cover weighted" color={T.emerald} accent={T.emerald} />
            </div>

            <Section title="fNRB Sensitivity to Demand">
              <Card>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={fnrbCalc.sensitivity} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="demand" tick={{fontSize:10,fill:T.textMut}} label={{value:'Demand (kt/yr)',position:'bottom',fontSize:10,fill:T.textSec}} />
                    <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,1]} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Line type="monotone" dataKey="fnrb" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Raw fNRB" />
                    <Line type="monotone" dataKey="adjusted" stroke={T.emerald} strokeWidth={2} dot={{r:3}} name="Adjusted fNRB" />
                    <ReferenceLine y={0.5} stroke={T.amber} strokeDasharray="5 5" label={{value:'0.5 threshold',fontSize:9,fill:T.amber}} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            <Section title="fNRB by Programme Region">
              <Card>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={PROJECTS_CC.map(pr=>({name:pr.country,fnrb:pr.fnrb}))} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}} />
                    <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,1]} />
                    <Tooltip contentStyle={TIP} />
                    <ReferenceLine y={0.7} stroke={T.emerald} strokeDasharray="5 5" />
                    <Bar dataKey="fnrb" name="fNRB" radius={[3,3,0,0]}>
                      {PROJECTS_CC.map((pr,i)=><Cell key={i} fill={pr.fnrb>0.7?T.emerald:pr.fnrb>0.5?T.amber:T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          </div>
        </div>
      </div>)}

      {/* ─── TAB 5: SDG Co-Benefits ─── */}
      {tab===TABS[4]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:20}}>
          {sdgAvg.map(g=>(
            <Card key={g.sdg} border={[T.emerald,T.gold,T.teal,T.navy][SDG_GOALS.indexOf(g)%4]}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <div style={{width:32,height:32,borderRadius:6,background:T.navy,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:14}}>{g.sdg}</div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:T.navy}}>SDG {g.sdg}</div>
                  <div style={{fontSize:9,color:T.textMut}}>{g.name}</div>
                </div>
              </div>
              <div style={{fontSize:10,color:T.textSec,marginBottom:6}}>{g.desc}</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${g.avg}%`,background:g.avg>70?T.emerald:g.avg>50?T.amber:T.red,borderRadius:3}} />
                </div>
                <span style={{fontSize:11,fontWeight:700,fontFamily:T.mono,color:T.navy}}>{g.avg}</span>
              </div>
            </Card>
          ))}
        </div>

        <Section title="SDG Scores by Programme">
          <Card>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={PROJECTS_CC.map(pr=>({name:pr.id,...SDG_GOALS.reduce((o,g,gi)=>{o[`SDG ${g.sdg}`]=pr.sdgScores[gi];return o;},{})}))} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}} />
                <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{fontSize:10}} />
                {SDG_GOALS.map((g,gi)=><Bar key={g.sdg} dataKey={`SDG ${g.sdg}`} fill={[T.emerald,T.gold,T.teal,T.navy][gi]} radius={[2,2,0,0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section title="SDG Radar (Portfolio Average)">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={sdgAvg.map(g=>({sdg:`SDG ${g.sdg}`,score:g.avg}))}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="sdg" tick={{fontSize:10,fill:T.textSec}} />
                <PolarRadiusAxis domain={[0,100]} tick={{fontSize:9,fill:T.textMut}} />
                <Radar name="Avg Score" dataKey="score" stroke={T.navy} fill={`${T.navy}30`} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      </div>)}

      {/* ─── TAB 6: Usage Monitoring ─── */}
      {tab===TABS[5]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:20}}>
          <Kpi label="Active Stoves (avg)" value={fmtK(Math.round(usageMonthly.reduce((s,m)=>s+m.activeStoves,0)/12))} sub="monthly average" accent={T.teal} />
          <Kpi label="Avg Usage Hours" value={parseFloat((usageMonthly.reduce((s,m)=>s+m.avgUsageHrs,0)/12).toFixed(1))} sub="hrs/day" accent={T.navy} />
          <Kpi label="Total Fuel Saved" value={fmtK(usageMonthly.reduce((s,m)=>s+m.fuelSaved,0))} sub="kg/yr" accent={T.emerald} />
          <Kpi label="Annual Credits" value={fmtK(usageMonthly.reduce((s,m)=>s+m.creditsIssued,0))} sub="tCO2e" accent={T.gold} />
        </div>

        <Section title="Monthly Stove Activity & Credits">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={usageMonthly} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} />
                <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{fontSize:10}} />
                <Area yAxisId="left" type="monotone" dataKey="activeStoves" stroke={T.teal} fill={`${T.teal}30`} strokeWidth={2} name="Active Stoves" />
                <Line yAxisId="right" type="monotone" dataKey="creditsIssued" stroke={T.gold} strokeWidth={2} dot={{r:3}} name="Credits Issued" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section title="Fuel Savings & Usage Hours">
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={usageMonthly} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} />
                <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textMut}} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{fontSize:10}} />
                <Bar yAxisId="left" dataKey="fuelSaved" name="Fuel Saved (kg)" fill={T.emerald} radius={[3,3,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="avgUsageHrs" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Avg Usage (hrs/day)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section title="Monitoring Data Quality">
          <Card border={T.navy}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
              {['Stove Usage Meters','Temperature Sensors','Mobile Surveys','Kitchen Performance Tests'].map((method,i)=>(
                <div key={method} style={{padding:10,background:T.cream,borderRadius:4}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:4}}>{method}</div>
                  <div style={{fontSize:10,color:T.textSec}}>Coverage: <strong style={{fontFamily:T.mono,color:T.emerald}}>{Math.round(60+sr(i*7+500)*35)}%</strong></div>
                  <div style={{fontSize:10,color:T.textSec}}>Accuracy: <strong style={{fontFamily:T.mono}}>{Math.round(80+sr(i*11+500)*18)}%</strong></div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      </div>)}
    </div>
  );
}
