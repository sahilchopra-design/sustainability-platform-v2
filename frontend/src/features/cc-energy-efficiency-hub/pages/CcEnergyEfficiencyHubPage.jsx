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

/* ======================================================================
   ENERGY EFFICIENCY & DISTRIBUTED ENERGY HUB
   EP-BS3 - AMS-II.C / AMS-I.F / AMS-II.E Methodologies
   ====================================================================== */

const CATEGORIES=['Building Retrofit','Industrial Efficiency','Distributed Energy'];
const CAT_COLORS={[CATEGORIES[0]]:T.teal,[CATEGORIES[1]]:T.navy,[CATEGORIES[2]]:T.gold};

const BUILDING_TYPES=['Commercial Office','Hospital','Hotel','School','Retail Mall','Data Centre','Warehouse','Apartment Complex'];
const INDUSTRIAL_TYPES=['Cement Plant','Steel Mill','Chemical Factory','Textile Mill','Food Processing','Paper Mill'];
const DER_TYPES=['Rooftop Solar','Battery Storage','CHP System','Micro-Wind'];

const PROJECTS=Array.from({length:10},(_,i)=>{
  const cat=CATEGORIES[i<4?0:i<7?1:2];
  const subtype=cat===CATEGORIES[0]?BUILDING_TYPES[i%BUILDING_TYPES.length]:cat===CATEGORIES[1]?INDUSTRIAL_TYPES[(i-4)%INDUSTRIAL_TYPES.length]:DER_TYPES[(i-7)%DER_TYPES.length];
  const countries=['UK','Germany','India','Brazil','China','Japan','Mexico','South Korea','Turkey','Poland'];
  const capacity=Math.round(50+sr(i*7)*950);
  const opHours=Math.round(2000+sr(i*11)*6000);
  const lf=parseFloat((0.3+sr(i*13)*0.5).toFixed(2));
  const blEff=parseFloat((0.50+sr(i*17)*0.30).toFixed(2));
  const pjEff=parseFloat((0.75+sr(i*19)*0.20).toFixed(2));
  const gridEF=parseFloat((0.3+sr(i*23)*0.7).toFixed(3));
  const blEnergy=Math.round(capacity*opHours*lf/blEff);
  const pjEnergy=Math.round(capacity*opHours*lf/pjEff);
  const savings=blEnergy-pjEnergy;
  const credits=Math.round(savings*gridEF*1e-3*0.92);
  return {
    id:`EE-${String(i+1).padStart(3,'0')}`,name:`${countries[i]} ${subtype}`,category:cat,subtype,country:countries[i],
    capacity,opHours,lf,blEff,pjEff,gridEF,
    blEnergy,pjEnergy,savings,credits,
    vintage:2021+Math.floor(sr(i*29)*4),
    status:['Active','Verification','Monitoring','Implementation'][Math.floor(sr(i*31)*4)],
    hdd:Math.round(1500+sr(i*37)*3500),
    cdd:Math.round(200+sr(i*41)*2000),
    investmentUSD:Math.round(500000+sr(i*43)*4500000),
    paybackYrs:parseFloat((2+sr(i*47)*8).toFixed(1)),
  };
});

const calcEnergyEff=(params)=>{
  const {capacity,opHours,lf,blEff,pjEff,gridEF}=params;
  const blEnergy=capacity*opHours*lf/blEff;
  const pjEnergy=capacity*opHours*lf/pjEff;
  const savings=blEnergy-pjEnergy;
  const be=savings*gridEF*1e-3;
  const netCredits=be*0.92;
  const savingsPct=(1-pjEnergy/blEnergy)*100;
  const waterfall=[
    {name:'Baseline Energy',value:Math.round(blEnergy),fill:T.red},
    {name:'Project Energy',value:-Math.round(pjEnergy),fill:T.teal},
    {name:'Energy Savings',value:Math.round(savings),fill:T.emerald},
    {name:'Grid EF Applied',value:Math.round(be),fill:T.navy},
    {name:'Buffer (8%)',value:-Math.round(be*0.08),fill:T.amber},
    {name:'Net Credits',value:Math.round(netCredits),fill:T.gold},
  ];
  return {blEnergy:Math.round(blEnergy),pjEnergy:Math.round(pjEnergy),savings:Math.round(savings),be:Math.round(be),netCredits:Math.round(netCredits),savingsPct:parseFloat(savingsPct.toFixed(1)),waterfall};
};

const calcWeatherNorm=(measured,hddActual,hddNormal,baseTemp)=>{
  const ratio=hddNormal/Math.max(hddActual,1);
  const adjusted=measured*ratio;
  return {adjusted:Math.round(adjusted),ratio:parseFloat(ratio.toFixed(3)),delta:Math.round(adjusted-measured)};
};

export default function CcEnergyEfficiencyHubPage(){
  const TABS=['Energy Efficiency Calculator','Distributed Energy Model','Building Retrofit','Industrial Efficiency','Weather Normalization','Hub Dashboard'];
  const [tab,setTab]=useState(TABS[0]);

  /* EE calc inputs */
  const [ep,setEp]=useState({
    capacity:200,opHours:4500,lf:0.55,blEff:0.60,pjEff:0.85,gridEF:0.55,
  });
  const setE=useCallback((k,v)=>setEp(prev=>({...prev,[k]:v})),[]);

  /* Distributed energy inputs */
  const [derCapacity,setDerCapacity]=useState(100);
  const [derHours,setDerHours]=useState(2200);
  const [derLF,setDerLF]=useState(0.20);
  const [derGridEF,setDerGridEF]=useState(0.55);
  const [storageEff,setStorageEff]=useState(0.85);
  const [selfConsume,setSelfConsume]=useState(0.70);

  /* Weather norm inputs */
  const [wnMeasured,setWnMeasured]=useState(500000);
  const [wnHddActual,setWnHddActual]=useState(2800);
  const [wnHddNormal,setWnHddNormal]=useState(3200);
  const [wnBaseTemp,setWnBaseTemp]=useState(18);

  const eeResult=useMemo(()=>calcEnergyEff(ep),[ep]);

  /* Distributed energy result */
  const derResult=useMemo(()=>{
    const generation=derCapacity*derHours*derLF;
    const selfConsumed=generation*selfConsume;
    const exported=generation-selfConsumed;
    const storageLoss=selfConsumed*(1-storageEff)*0.3;
    const netGeneration=generation-storageLoss;
    const credits=Math.round(netGeneration*derGridEF*1e-3*0.92);
    const monthly=Array.from({length:12},(_,m)=>{
      const seasonalFactor=0.7+0.6*Math.sin((m-2)*Math.PI/6);
      const mGen=Math.round(generation/12*seasonalFactor);
      const mSelf=Math.round(mGen*selfConsume);
      return {month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],generation:mGen,selfConsumed:mSelf,exported:mGen-mSelf};
    });
    return {generation:Math.round(generation),selfConsumed:Math.round(selfConsumed),exported:Math.round(exported),storageLoss:Math.round(storageLoss),netGeneration:Math.round(netGeneration),credits,monthly};
  },[derCapacity,derHours,derLF,derGridEF,storageEff,selfConsume]);

  /* Weather normalization */
  const wnResult=useMemo(()=>{
    const base=calcWeatherNorm(wnMeasured,wnHddActual,wnHddNormal,wnBaseTemp);
    const sensitivity=[1500,2000,2500,3000,3500,4000,4500].map(hdd=>{
      const r=calcWeatherNorm(wnMeasured,hdd,wnHddNormal,wnBaseTemp);
      return {hddActual:hdd,adjusted:r.adjusted,ratio:r.ratio};
    });
    return {...base,sensitivity};
  },[wnMeasured,wnHddActual,wnHddNormal,wnBaseTemp]);

  /* Building retrofit data */
  const buildingProjects=useMemo(()=>PROJECTS.filter(pr=>pr.category===CATEGORIES[0]),[]);
  const industrialProjects=useMemo(()=>PROJECTS.filter(pr=>pr.category===CATEGORIES[1]),[]);

  /* Hub dashboard aggregates */
  const hubStats=useMemo(()=>{
    const totalCredits=PROJECTS.reduce((s,pr)=>s+pr.credits,0);
    const totalSavings=PROJECTS.reduce((s,pr)=>s+pr.savings,0);
    const totalInvestment=PROJECTS.reduce((s,pr)=>s+pr.investmentUSD,0);
    const avgPayback=parseFloat((PROJECTS.reduce((s,pr)=>s+pr.paybackYrs,0)/PROJECTS.length).toFixed(1));
    const byCat=CATEGORIES.map(c=>{const ps=PROJECTS.filter(pr=>pr.category===c);return {category:c,count:ps.length,credits:ps.reduce((s,pr)=>s+pr.credits,0),savings:ps.reduce((s,pr)=>s+pr.savings,0)};});
    const trend=Array.from({length:8},(_,i)=>{
      const q=['Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'][i];
      return {quarter:q,credits:Math.round(totalCredits/8*(0.7+i*0.08+sr(i*7+700)*0.15)),savings:Math.round(totalSavings/8*(0.6+i*0.1+sr(i*11+700)*0.2))};
    });
    return {totalCredits,totalSavings,totalInvestment,avgPayback,byCat,trend};
  },[]);

  return (
    <div style={{fontFamily:T.font,background:T.cream,minHeight:'100vh',padding:'20px 24px'}}>
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <span style={{fontSize:9,fontFamily:T.mono,color:T.textMut,letterSpacing:'0.1em'}}>EP-BS3</span>
          <span style={{width:1,height:12,background:T.border}} />
          <span style={{fontSize:9,fontFamily:T.mono,color:T.emerald,fontWeight:600}}>ENERGY CARBON CREDITS</span>
        </div>
        <h1 style={{fontSize:20,fontWeight:700,color:T.navy,margin:0}}>Energy Efficiency &amp; Distributed Energy Hub</h1>
        <p style={{fontSize:12,color:T.textSec,marginTop:4}}>AMS-II.C / AMS-I.F / AMS-II.E &middot; Building Retrofit &middot; Industrial Efficiency &middot; Distributed Energy &middot; HDD/CDD Normalization</p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ─── TAB 1: Energy Efficiency Calculator ─── */}
      {tab===TABS[0]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16}}>
          <Card border={T.teal}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:12}}>Efficiency Parameters</div>
            <DualInput label="Capacity (kW)" value={ep.capacity} min={10} max={5000} step={10} onChange={v=>setE('capacity',v)} unit=" kW" />
            <DualInput label="Operating Hours (hrs/yr)" value={ep.opHours} min={500} max={8760} step={100} onChange={v=>setE('opHours',v)} unit=" hrs" />
            <DualInput label="Load Factor" value={ep.lf} min={0.1} max={0.95} step={0.01} onChange={v=>setE('lf',v)} />
            <DualInput label="Baseline Efficiency" value={ep.blEff} min={0.30} max={0.80} step={0.01} onChange={v=>setE('blEff',v)} color={T.red} />
            <DualInput label="Project Efficiency" value={ep.pjEff} min={0.50} max={0.98} step={0.01} onChange={v=>setE('pjEff',v)} color={T.emerald} />
            <DualInput label="Grid EF (tCO2/MWh)" value={ep.gridEF} min={0.1} max={1.2} step={0.01} onChange={v=>setE('gridEF',v)} color={T.navy} />
            <div style={{marginTop:10,padding:10,background:T.cream,borderRadius:4,fontSize:10,color:T.textSec,fontFamily:T.mono}}>
              BE = Cap x Hrs x LF / Baseline_Eff<br/>
              Savings = BE - PE = <strong>{fmtK(eeResult.savings)}</strong> kWh<br/>
              Efficiency Gain: <strong style={{color:T.emerald}}>{eeResult.savingsPct}%</strong>
            </div>
          </Card>

          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
              <Kpi label="Baseline Energy" value={fmtK(eeResult.blEnergy)} sub="kWh/yr" accent={T.red} />
              <Kpi label="Project Energy" value={fmtK(eeResult.pjEnergy)} sub="kWh/yr" accent={T.teal} />
              <Kpi label="Energy Savings" value={`${eeResult.savingsPct}%`} sub={`${fmtK(eeResult.savings)} kWh`} color={T.emerald} accent={T.emerald} />
              <Kpi label="Net Credits" value={fmtK(eeResult.netCredits)} sub="tCO2e/yr" accent={T.gold} />
            </div>

            <Section title="Energy & Emissions Waterfall">
              <Card>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={eeResult.waterfall} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} />
                    <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                    <Tooltip contentStyle={TIP} formatter={v=>[fmtK(Math.abs(v))]} />
                    <Bar dataKey="value" radius={[3,3,0,0]}>
                      {eeResult.waterfall.map((d,i)=><Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            <Section title="Efficiency Sensitivity">
              <Card>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[0.50,0.55,0.60,0.65,0.70,0.75,0.80,0.85,0.90,0.95].map(eff=>{
                    const r=calcEnergyEff({...ep,pjEff:eff});
                    return {efficiency:eff,credits:r.netCredits,savings:r.savingsPct};
                  })} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="efficiency" tick={{fontSize:10,fill:T.textMut}} />
                    <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textMut}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Line yAxisId="left" type="monotone" dataKey="credits" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Credits (tCO2e)" />
                    <Line yAxisId="right" type="monotone" dataKey="savings" stroke={T.emerald} strokeWidth={2} dot={{r:3}} name="Savings (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          </div>
        </div>
      </div>)}

      {/* ─── TAB 2: Distributed Energy Model ─── */}
      {tab===TABS[1]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:16}}>
          <Card border={T.gold}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:12}}>DER Parameters</div>
            <DualInput label="DER Capacity (kW)" value={derCapacity} min={10} max={2000} step={10} onChange={setDerCapacity} unit=" kW" />
            <DualInput label="Equivalent Full-Load Hours" value={derHours} min={500} max={5000} step={100} onChange={setDerHours} unit=" hrs" />
            <DualInput label="Load / Capacity Factor" value={derLF} min={0.05} max={0.50} step={0.01} onChange={setDerLF} />
            <DualInput label="Grid EF (tCO2/MWh)" value={derGridEF} min={0.1} max={1.2} step={0.01} onChange={setDerGridEF} color={T.navy} />
            <DualInput label="Storage Round-Trip Eff" value={storageEff} min={0.60} max={0.98} step={0.01} onChange={setStorageEff} color={T.purple} />
            <DualInput label="Self-Consumption Rate" value={selfConsume} min={0.20} max={1.0} step={0.01} onChange={setSelfConsume} color={T.teal} />
          </Card>

          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
              <Kpi label="Annual Generation" value={fmtK(derResult.generation)} sub="kWh" accent={T.gold} />
              <Kpi label="Self-Consumed" value={fmtK(derResult.selfConsumed)} sub="kWh" accent={T.teal} />
              <Kpi label="Exported to Grid" value={fmtK(derResult.exported)} sub="kWh" accent={T.navy} />
              <Kpi label="Net Credits" value={fmtK(derResult.credits)} sub="tCO2e/yr" color={T.emerald} accent={T.emerald} />
            </div>

            <Section title="Monthly Generation Profile">
              <Card>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={derResult.monthly} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} />
                    <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                    <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v),'kWh']} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Area type="monotone" dataKey="selfConsumed" stackId="1" stroke={T.teal} fill={`${T.teal}50`} name="Self-Consumed" />
                    <Area type="monotone" dataKey="exported" stackId="1" stroke={T.gold} fill={`${T.gold}50`} name="Exported" />
                    <Line type="monotone" dataKey="generation" stroke={T.navy} strokeWidth={2} dot={false} name="Total Generation" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            <Section title="Energy Flow Breakdown">
              <Card>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                  <div style={{padding:12,background:T.cream,borderRadius:4,borderLeft:`3px solid ${T.gold}`}}>
                    <div style={{fontSize:10,color:T.textMut}}>Gross Generation</div>
                    <div style={{fontSize:18,fontWeight:700,color:T.gold,fontFamily:T.mono}}>{fmtK(derResult.generation)}</div>
                    <div style={{fontSize:10,color:T.textSec}}>kWh/yr</div>
                  </div>
                  <div style={{padding:12,background:T.cream,borderRadius:4,borderLeft:`3px solid ${T.amber}`}}>
                    <div style={{fontSize:10,color:T.textMut}}>Storage Losses</div>
                    <div style={{fontSize:18,fontWeight:700,color:T.amber,fontFamily:T.mono}}>{fmtK(derResult.storageLoss)}</div>
                    <div style={{fontSize:10,color:T.textSec}}>kWh/yr ({Math.round(derResult.storageLoss/derResult.generation*100)}%)</div>
                  </div>
                  <div style={{padding:12,background:T.cream,borderRadius:4,borderLeft:`3px solid ${T.emerald}`}}>
                    <div style={{fontSize:10,color:T.textMut}}>Net Generation</div>
                    <div style={{fontSize:18,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>{fmtK(derResult.netGeneration)}</div>
                    <div style={{fontSize:10,color:T.textSec}}>kWh/yr</div>
                  </div>
                </div>
              </Card>
            </Section>
          </div>
        </div>
      </div>)}

      {/* ─── TAB 3: Building Retrofit ─── */}
      {tab===TABS[2]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:20}}>
          <Kpi label="Building Projects" value={buildingProjects.length} sub="active retrofits" accent={T.teal} />
          <Kpi label="Total Savings" value={fmtK(buildingProjects.reduce((s,pr)=>s+pr.savings,0))} sub="kWh/yr" accent={T.emerald} />
          <Kpi label="Total Credits" value={fmtK(buildingProjects.reduce((s,pr)=>s+pr.credits,0))} sub="tCO2e/yr" accent={T.navy} />
          <Kpi label="Avg Payback" value={`${parseFloat((buildingProjects.reduce((s,pr)=>s+pr.paybackYrs,0)/Math.max(buildingProjects.length,1)).toFixed(1))} yrs`} sub="investment return" accent={T.gold} />
        </div>

        <Section title="Building Retrofit Performance">
          <Card>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={buildingProjects.map(pr=>({name:pr.subtype,blEff:Math.round(pr.blEff*100),pjEff:Math.round(pr.pjEff*100),savings:pr.savings,credits:pr.credits}))} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} />
                <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textMut}} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{fontSize:10}} />
                <Bar yAxisId="left" dataKey="blEff" name="Baseline Eff (%)" fill={T.red} radius={[3,3,0,0]} />
                <Bar yAxisId="left" dataKey="pjEff" name="Project Eff (%)" fill={T.emerald} radius={[3,3,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="credits" stroke={T.gold} strokeWidth={2} dot={{r:3}} name="Credits (tCO2e)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section title="Building Portfolio Details">
          <Card style={{padding:0,overflow:'hidden'}}>
            <div style={{maxHeight:350,overflowY:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
                <thead style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                  <tr>{['ID','Building','Type','Country','HDD','CDD','BL Eff','PJ Eff','Savings (kWh)','Credits','Payback','Status'].map(h=><th key={h} style={{padding:'7px 8px',textAlign:'left',fontSize:10,color:T.textMut,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap'}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {buildingProjects.map((pr,idx)=>(
                    <tr key={pr.id} style={{borderBottom:`1px solid ${T.border}`,background:idx%2===0?T.cream:'transparent'}}>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{pr.id}</td>
                      <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{pr.name}</td>
                      <td style={{padding:'6px 8px',fontSize:10}}>{pr.subtype}</td>
                      <td style={{padding:'6px 8px',fontSize:10}}>{pr.country}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{fmtK(pr.hdd)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{fmtK(pr.cdd)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.red}}>{Math.round(pr.blEff*100)}%</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.emerald}}>{Math.round(pr.pjEff*100)}%</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{fmtK(pr.savings)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.emerald,fontWeight:600}}>{fmtK(pr.credits)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.paybackYrs} yrs</td>
                      <td style={{padding:'6px 8px'}}><Badge v={pr.status} colors={{Active:T.emerald,Verification:T.amber,Monitoring:T.teal,Implementation:T.purple}} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        <Section title="Investment vs Credits Scatter">
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={buildingProjects.map(pr=>({name:pr.subtype,investment:Math.round(pr.investmentUSD/1000),credits:pr.credits}))} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} />
                <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textMut}} label={{value:'Investment ($K)',angle:-90,position:'insideLeft',fontSize:9}} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textMut}} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{fontSize:10}} />
                <Bar yAxisId="left" dataKey="investment" name="Investment ($K)" fill={T.navy} radius={[3,3,0,0]} />
                <Bar yAxisId="right" dataKey="credits" name="Credits (tCO2e)" fill={T.gold} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      </div>)}

      {/* ─── TAB 4: Industrial Efficiency ─── */}
      {tab===TABS[3]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:20}}>
          <Kpi label="Industrial Projects" value={industrialProjects.length} sub="efficiency programmes" accent={T.navy} />
          <Kpi label="Total Energy Savings" value={fmtK(industrialProjects.reduce((s,pr)=>s+pr.savings,0))} sub="kWh/yr" accent={T.emerald} />
          <Kpi label="Total Credits" value={fmtK(industrialProjects.reduce((s,pr)=>s+pr.credits,0))} sub="tCO2e/yr" accent={T.gold} />
          <Kpi label="Total Investment" value={`$${fmtK(industrialProjects.reduce((s,pr)=>s+pr.investmentUSD,0))}`} sub="capex deployed" accent={T.teal} />
        </div>

        <Section title="Industrial Sector Comparison">
          <Card>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={industrialProjects.map(pr=>({name:pr.subtype,capacity:pr.capacity,savings:Math.round(pr.savings/1000),credits:pr.credits}))} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} />
                <YAxis tick={{fontSize:10,fill:T.textMut}} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{fontSize:10}} />
                <Bar dataKey="capacity" name="Capacity (kW)" fill={T.navy} radius={[3,3,0,0]} />
                <Bar dataKey="savings" name="Savings (MWh)" fill={T.emerald} radius={[3,3,0,0]} />
                <Bar dataKey="credits" name="Credits (tCO2e)" fill={T.gold} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section title="Industrial Project Registry">
          <Card style={{padding:0,overflow:'hidden'}}>
            <div style={{maxHeight:320,overflowY:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
                <thead style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                  <tr>{['ID','Facility','Sector','Country','Capacity','Op Hours','BL Eff','PJ Eff','Grid EF','Credits','Status'].map(h=><th key={h} style={{padding:'7px 8px',textAlign:'left',fontSize:10,color:T.textMut,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap'}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {industrialProjects.map((pr,idx)=>(
                    <tr key={pr.id} style={{borderBottom:`1px solid ${T.border}`,background:idx%2===0?T.cream:'transparent'}}>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{pr.id}</td>
                      <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{pr.name}</td>
                      <td style={{padding:'6px 8px',fontSize:10}}>{pr.subtype}</td>
                      <td style={{padding:'6px 8px',fontSize:10}}>{pr.country}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.capacity} kW</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{fmtK(pr.opHours)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.red}}>{Math.round(pr.blEff*100)}%</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.emerald}}>{Math.round(pr.pjEff*100)}%</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.gridEF}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.emerald,fontWeight:600}}>{fmtK(pr.credits)}</td>
                      <td style={{padding:'6px 8px'}}><Badge v={pr.status} colors={{Active:T.emerald,Verification:T.amber,Monitoring:T.teal,Implementation:T.purple}} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        <Section title="Efficiency Improvement Analysis">
          <Card border={T.navy}>
            <div style={{fontSize:11,color:T.textSec,lineHeight:1.8}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><strong style={{color:T.navy}}>Process Heat Recovery:</strong> Waste heat exchangers reducing fuel consumption 15-30%</div>
                <div><strong style={{color:T.navy}}>VSD Motor Control:</strong> Variable speed drives on pumps/fans reducing electricity 20-40%</div>
                <div><strong style={{color:T.navy}}>Compressed Air Optimization:</strong> Leak reduction and pressure optimization saving 10-25%</div>
                <div><strong style={{color:T.navy}}>Steam System Upgrade:</strong> Condensate recovery and insulation improving boiler efficiency 8-15%</div>
              </div>
            </div>
          </Card>
        </Section>
      </div>)}

      {/* ─── TAB 5: Weather Normalization ─── */}
      {tab===TABS[4]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:16}}>
          <Card border={T.purple}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:12}}>Normalization Parameters</div>
            <DualInput label="Measured Energy (kWh)" value={wnMeasured} min={50000} max={5000000} step={10000} onChange={setWnMeasured} unit=" kWh" />
            <DualInput label="HDD Actual" value={wnHddActual} min={500} max={6000} step={50} onChange={setWnHddActual} color={T.red} />
            <DualInput label="HDD Normal (30-yr avg)" value={wnHddNormal} min={500} max={6000} step={50} onChange={setWnHddNormal} color={T.teal} />
            <DualInput label="Base Temperature (C)" value={wnBaseTemp} min={10} max={25} step={0.5} onChange={setWnBaseTemp} unit=" C" />
            <div style={{marginTop:12,padding:10,background:T.cream,borderRadius:4,fontSize:10,fontFamily:T.mono,color:T.textSec}}>
              Formula: Adj = Measured x (HDD_normal / HDD_actual)<br/>
              Ratio: <strong>{wnResult.ratio}</strong><br/>
              Adjusted: <strong style={{color:T.emerald}}>{fmtK(wnResult.adjusted)}</strong> kWh<br/>
              Delta: <strong style={{color:wnResult.delta>0?T.red:T.emerald}}>{wnResult.delta>0?'+':''}{fmtK(wnResult.delta)}</strong> kWh
            </div>
          </Card>

          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
              <Kpi label="Measured Energy" value={fmtK(wnMeasured)} sub="kWh" accent={T.navy} />
              <Kpi label="Normalized Energy" value={fmtK(wnResult.adjusted)} sub="kWh" color={wnResult.delta>0?T.red:T.emerald} accent={T.teal} />
              <Kpi label="Normalization Delta" value={`${wnResult.delta>0?'+':''}${fmtK(wnResult.delta)}`} sub={`${wnResult.ratio}x factor`} color={wnResult.delta>0?T.red:T.emerald} accent={T.purple} />
            </div>

            <Section title="HDD Sensitivity Analysis">
              <Card>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={wnResult.sensitivity} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="hddActual" tick={{fontSize:10,fill:T.textMut}} label={{value:'HDD Actual',position:'bottom',fontSize:10}} />
                    <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.textMut}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Line yAxisId="left" type="monotone" dataKey="adjusted" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Adjusted Energy (kWh)" />
                    <Line yAxisId="right" type="monotone" dataKey="ratio" stroke={T.gold} strokeWidth={2} dot={{r:3}} name="Norm Ratio" />
                    <ReferenceLine yAxisId="right" y={1.0} stroke={T.emerald} strokeDasharray="5 5" label={{value:'No adjustment',fontSize:9,fill:T.emerald}} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            <Section title="CDD Normalization (Cooling)">
              <Card>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={PROJECTS.filter(pr=>pr.cdd>0).map(pr=>{
                    const cddNorm=Math.round(pr.cdd*1.1);
                    const adjEnergy=Math.round(pr.pjEnergy*(cddNorm/pr.cdd));
                    return {name:pr.country,cddActual:pr.cdd,cddNormal:cddNorm,measured:pr.pjEnergy,adjusted:adjEnergy};
                  })} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}} />
                    <YAxis tick={{fontSize:10,fill:T.textMut}} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Bar dataKey="cddActual" name="CDD Actual" fill={T.red} radius={[3,3,0,0]} />
                    <Bar dataKey="cddNormal" name="CDD Normal" fill={T.teal} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          </div>
        </div>
      </div>)}

      {/* ─── TAB 6: Hub Dashboard ─── */}
      {tab===TABS[5]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:20}}>
          <Kpi label="Total Credits (All)" value={fmtK(hubStats.totalCredits)} sub="tCO2e/yr" accent={T.emerald} />
          <Kpi label="Total Energy Savings" value={fmtK(hubStats.totalSavings)} sub="kWh/yr" accent={T.navy} />
          <Kpi label="Total Investment" value={`$${fmtK(hubStats.totalInvestment)}`} sub="across all projects" accent={T.gold} />
          <Kpi label="Avg Payback" value={`${hubStats.avgPayback} yrs`} sub={`${PROJECTS.length} projects`} accent={T.teal} />
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <Section title="Credits by Category">
            <Card>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={hubStats.byCat} dataKey="credits" nameKey="category" cx="50%" cy="50%" outerRadius={85} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:9}}>
                    {hubStats.byCat.map((d,i)=><Cell key={i} fill={[T.teal,T.navy,T.gold][i]} />)}
                  </Pie>
                  <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v),'tCO2e']} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          <Section title="Quarterly Trend">
            <Card>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={hubStats.trend} margin={{left:10,right:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}} />
                  <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                  <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v)]} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Area type="monotone" dataKey="credits" stroke={T.emerald} fill={`${T.emerald}30`} strokeWidth={2} name="Credits (tCO2e)" />
                  <Area type="monotone" dataKey="savings" stroke={T.navy} fill={`${T.navy}20`} strokeWidth={2} name="Savings (MWh)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Section>
        </div>

        <Section title={`Full Project Registry (${PROJECTS.length} projects)`}>
          <Card style={{padding:0,overflow:'hidden'}}>
            <div style={{maxHeight:400,overflowY:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
                <thead style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                  <tr>{['ID','Project','Category','Country','Capacity','Savings (kWh)','Grid EF','Credits','Investment','Payback','Status'].map(h=><th key={h} style={{padding:'7px 8px',textAlign:'left',fontSize:10,color:T.textMut,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap'}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {PROJECTS.map((pr,idx)=>(
                    <tr key={pr.id} style={{borderBottom:`1px solid ${T.border}`,background:idx%2===0?T.cream:'transparent'}}>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{pr.id}</td>
                      <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{pr.name}</td>
                      <td style={{padding:'6px 8px'}}><Badge v={pr.category} colors={{[CATEGORIES[0]]:T.teal,[CATEGORIES[1]]:T.navy,[CATEGORIES[2]]:T.gold}} /></td>
                      <td style={{padding:'6px 8px',fontSize:10}}>{pr.country}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.capacity} kW</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{fmtK(pr.savings)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.gridEF}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.emerald,fontWeight:600}}>{fmtK(pr.credits)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>${fmtK(pr.investmentUSD)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.paybackYrs} yrs</td>
                      <td style={{padding:'6px 8px'}}><Badge v={pr.status} colors={{Active:T.emerald,Verification:T.amber,Monitoring:T.teal,Implementation:T.purple}} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        <Section title="Cross-Energy KPI Summary">
          <Card border={T.navy}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
              {hubStats.byCat.map((cat,i)=>(
                <div key={cat.category} style={{padding:12,background:T.cream,borderRadius:4,borderLeft:`3px solid ${[T.teal,T.navy,T.gold][i]}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>{cat.category}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:10}}>
                    <div><span style={{color:T.textMut}}>Projects:</span> <strong>{cat.count}</strong></div>
                    <div><span style={{color:T.textMut}}>Credits:</span> <strong style={{fontFamily:T.mono,color:T.emerald}}>{fmtK(cat.credits)}</strong></div>
                    <div><span style={{color:T.textMut}}>Savings:</span> <strong style={{fontFamily:T.mono}}>{fmtK(cat.savings)} kWh</strong></div>
                    <div><span style={{color:T.textMut}}>Share:</span> <strong style={{fontFamily:T.mono}}>{Math.round(cat.credits/hubStats.totalCredits*100)}%</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      </div>)}
    </div>
  );
}
