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
   GRID RENEWABLE ENERGY CREDITS ENGINE
   EP-BS1 - ACM0002 / AMS-I.D Combined Margin Methodology
   ====================================================================== */

const TECH_TYPES=['Solar PV','Onshore Wind','Offshore Wind','Small Hydro','Large Hydro','Geothermal'];
const TECH_WEIGHTS={
  'Solar PV':{om:0.75,bm:0.25},'Onshore Wind':{om:0.75,bm:0.25},'Offshore Wind':{om:0.75,bm:0.25},
  'Small Hydro':{om:0.50,bm:0.50},'Large Hydro':{om:0.50,bm:0.50},'Geothermal':{om:0.60,bm:0.40},
};
const GRID_REGIONS=['South Asia','Southeast Asia','East Asia','Sub-Saharan Africa','Latin America','MENA','Eastern Europe','Central Asia','OECD Europe','North America','Pacific Islands','Central America'];

const PROJECTS=Array.from({length:12},(_,i)=>{
  const tech=TECH_TYPES[i%TECH_TYPES.length];
  const w=TECH_WEIGHTS[tech];
  const countries=['India','Vietnam','China','Kenya','Brazil','Morocco','Poland','Kazakhstan','Spain','Mexico','Fiji','Guatemala'];
  const names=[`${countries[i]} Solar Farm Alpha`,`${countries[i]} Wind Park Delta`,`${countries[i]} Offshore Array`,`${countries[i]} Run-of-River`,`${countries[i]} Dam Retrofit`,`${countries[i]} Geothermal Plant`,`${countries[i]} Solar Mega`,`${countries[i]} Wind Corridor`,`${countries[i]} Marine Wind`,`${countries[i]} Micro Hydro`,`${countries[i]} Reservoir`,`${countries[i]} Steam Field`];
  const capacity=Math.round(20+sr(i*7)*480);
  const cf=parseFloat((0.15+sr(i*11)*0.45).toFixed(2));
  const aux=parseFloat((2+sr(i*13)*6).toFixed(1));
  const netGen=Math.round(capacity*8760*cf*(1-aux/100));
  const omEF=parseFloat((0.4+sr(i*17)*0.6).toFixed(3));
  const bmEF=parseFloat((0.2+sr(i*19)*0.5).toFixed(3));
  const cm=parseFloat((omEF*w.om+bmEF*w.bm).toFixed(3));
  const be=Math.round(netGen*cm);
  return {
    id:`GR-${String(i+1).padStart(3,'0')}`,name:names[i],tech,country:countries[i],
    region:GRID_REGIONS[i],capacity,cf,aux,netGen,omEF,bmEF,
    omWeight:w.om,bmWeight:w.bm,cm,be,
    vintage:2020+Math.floor(sr(i*23)*5),
    status:['Active','Verification','Registered','Validation'][Math.floor(sr(i*29)*4)],
    credits:Math.round(be*0.92),
    additionality:Math.round(40+sr(i*31)*55),
    recEligible:sr(i*37)>0.3,
  };
});

/* Hourly generation profiles (24 hours) */
const HOURLY_PROFILES=TECH_TYPES.map((tech,ti)=>
  Array.from({length:24},(_,h)=>{
    let base;
    if(tech.includes('Solar')){base=h>=6&&h<=18?Math.sin((h-6)*Math.PI/12)*0.9:0;}
    else if(tech.includes('Wind')){base=0.25+0.2*Math.sin(h*Math.PI/12)+sr(h*7+ti*100)*0.3;}
    else if(tech.includes('Hydro')){base=0.5+0.15*Math.sin(h*Math.PI/8)+sr(h*5+ti*50)*0.1;}
    else{base=0.8+sr(h*3+ti*30)*0.15;}
    return {hour:h,output:parseFloat(Math.max(0,Math.min(1,base)).toFixed(3)),tech};
  })
);

const GRID_EF_PLANTS=[
  {type:'Coal Sub-Critical',ef:1.10,share:0,dispatch:1},{type:'Coal Super-Critical',ef:0.85,share:0,dispatch:2},
  {type:'Natural Gas CCGT',ef:0.40,share:0,dispatch:3},{type:'Natural Gas OCGT',ef:0.55,share:0,dispatch:4},
  {type:'Oil-fired',ef:0.75,share:0,dispatch:5},{type:'Diesel',ef:0.90,share:0,dispatch:6},
  {type:'Biomass',ef:0.05,share:0,dispatch:7},{type:'Nuclear',ef:0.01,share:0,dispatch:8},
];

const calcCombinedMargin=(netGen,omEF,bmEF,omW,bmW)=>{
  const cm=omEF*omW+bmEF*bmW;
  const be=netGen*cm;
  return {cm:parseFloat(cm.toFixed(4)),be:Math.round(be)};
};

export default function CcGridRenewablesPage(){
  const TABS=['Methodology Overview','Combined Margin Calculator','Dispatch Model','Grid EF Builder','Project Portfolio','Additionality & RECs'];
  const [tab,setTab]=useState(TABS[0]);

  /* Combined Margin calc inputs */
  const [p,setP]=useState({
    netGen:120000,omEF:0.65,bmEF:0.35,omWeight:0.75,bmWeight:0.25,
    aux:4.0,cf:0.28,capacity:50,
  });
  const setV=useCallback((k,v)=>setP(prev=>({...prev,[k]:v})),[]);

  /* Dispatch model inputs */
  const [dispatchDemand,setDispatchDemand]=useState(5000);
  const [dispatchRenewShare,setDispatchRenewShare]=useState(15);

  /* Grid EF Builder inputs */
  const [gridPlants,setGridPlants]=useState(()=>GRID_EF_PLANTS.map((pl,i)=>({...pl,share:i===0?35:i===1?20:i===2?25:i===3?8:i===4?5:i===5?2:i===6?3:2})));
  const setPlantShare=(idx,val)=>setGridPlants(prev=>prev.map((pl,i)=>i===idx?{...pl,share:val}:pl));

  /* Combined margin calculation */
  const cmResult=useMemo(()=>{
    const netGenCalc=Math.round(p.capacity*8760*p.cf*(1-p.aux/100));
    const r=calcCombinedMargin(netGenCalc,p.omEF,p.bmEF,p.omWeight,p.bmWeight);
    const sensOM=[0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0].map(om=>{
      const c=calcCombinedMargin(netGenCalc,om,p.bmEF,p.omWeight,p.bmWeight);
      return {omEF:om,cm:c.cm,be:c.be};
    });
    const sensBM=[0.1,0.2,0.3,0.4,0.5,0.6].map(bm=>{
      const c=calcCombinedMargin(netGenCalc,p.omEF,bm,p.omWeight,p.bmWeight);
      return {bmEF:bm,cm:c.cm,be:c.be};
    });
    const waterfall=[
      {name:'OM Component',value:Math.round(netGenCalc*p.omEF*p.omWeight),fill:T.navy},
      {name:'BM Component',value:Math.round(netGenCalc*p.bmEF*p.bmWeight),fill:T.teal},
      {name:'Gross BE',value:r.be,fill:T.emerald},
      {name:'Buffer (8%)',value:-Math.round(r.be*0.08),fill:T.amber},
      {name:'Net Credits',value:Math.round(r.be*0.92),fill:T.gold},
    ];
    return {...r,netGen:netGenCalc,sensOM,sensBM,waterfall,netCredits:Math.round(r.be*0.92)};
  },[p]);

  /* Dispatch model */
  const dispatchData=useMemo(()=>{
    const thermal=100-dispatchRenewShare;
    const hours=Array.from({length:24},(_,h)=>{
      const demand=dispatchDemand*(0.6+0.4*Math.sin((h-6)*Math.PI/12));
      const renew=demand*dispatchRenewShare/100*(h>=6&&h<=18?Math.sin((h-6)*Math.PI/12):0.15);
      const coal=Math.max(0,(demand-renew)*0.55);
      const gas=Math.max(0,(demand-renew)*0.35);
      const other=Math.max(0,demand-renew-coal-gas);
      const marginalEF=gas>coal?0.55:0.85;
      return {hour:`${h}:00`,demand:Math.round(demand),renewable:Math.round(renew),coal:Math.round(coal),gas:Math.round(gas),other:Math.round(other),marginalEF:parseFloat(marginalEF.toFixed(2))};
    });
    const avgMargEF=parseFloat((hours.reduce((s,h)=>s+h.marginalEF,0)/24).toFixed(3));
    return {hours,avgMargEF};
  },[dispatchDemand,dispatchRenewShare]);

  /* Grid EF builder */
  const gridEFResult=useMemo(()=>{
    const totalShare=gridPlants.reduce((s,pl)=>s+pl.share,0);
    const weightedEF=gridPlants.reduce((s,pl)=>s+pl.ef*(pl.share/Math.max(totalShare,1)),0);
    const sortedByDispatch=[...gridPlants].sort((a,b)=>a.dispatch-b.dispatch);
    const buildMargin=sortedByDispatch.filter(pl=>pl.share>0).slice(-3);
    const bmEF=buildMargin.length?buildMargin.reduce((s,pl)=>s+pl.ef,0)/buildMargin.length:0;
    return {weightedEF:parseFloat(weightedEF.toFixed(4)),bmEF:parseFloat(bmEF.toFixed(4)),totalShare,plants:gridPlants.map(pl=>({...pl,contribution:parseFloat((pl.ef*pl.share/Math.max(totalShare,1)).toFixed(4))}))};
  },[gridPlants]);

  /* Portfolio aggregates */
  const portStats=useMemo(()=>{
    const totalBE=PROJECTS.reduce((s,pr)=>s+pr.be,0);
    const totalCredits=PROJECTS.reduce((s,pr)=>s+pr.credits,0);
    const totalCap=PROJECTS.reduce((s,pr)=>s+pr.capacity,0);
    const avgCM=parseFloat((PROJECTS.reduce((s,pr)=>s+pr.cm,0)/PROJECTS.length).toFixed(3));
    const byTech=TECH_TYPES.map(t=>{const ps=PROJECTS.filter(pr=>pr.tech===t);return {tech:t,count:ps.length,be:ps.reduce((s,pr)=>s+pr.be,0),credits:ps.reduce((s,pr)=>s+pr.credits,0),avgCM:ps.length?parseFloat((ps.reduce((s,pr)=>s+pr.cm,0)/ps.length).toFixed(3)):0};});
    return {totalBE,totalCredits,totalCap,avgCM,byTech};
  },[]);

  const TECH_COLORS=[T.gold,T.navy,T.teal,T.emerald,T.sage,T.purple];

  return (
    <div style={{fontFamily:T.font,background:T.cream,minHeight:'100vh',padding:'20px 24px'}}>
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <span style={{fontSize:9,fontFamily:T.mono,color:T.textMut,letterSpacing:'0.1em'}}>EP-BS1</span>
          <span style={{width:1,height:12,background:T.border}} />
          <span style={{fontSize:9,fontFamily:T.mono,color:T.emerald,fontWeight:600}}>ENERGY CARBON CREDITS</span>
        </div>
        <h1 style={{fontSize:20,fontWeight:700,color:T.navy,margin:0}}>Grid Renewable Energy Credits</h1>
        <p style={{fontSize:12,color:T.textSec,marginTop:4}}>ACM0002 / AMS-I.D Combined Margin Methodology &middot; OM/BM Weighted Grid Emission Factors &middot; Dispatch Analysis &middot; REC Additionality</p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ─── TAB 1: Methodology Overview ─── */}
      {tab===TABS[0]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:20}}>
          <Kpi label="Total Baseline Emissions" value={fmtK(portStats.totalBE)} sub="tCO2e/yr" accent={T.navy} />
          <Kpi label="Net Credits Issued" value={fmtK(portStats.totalCredits)} sub="tCO2e/yr" accent={T.emerald} />
          <Kpi label="Installed Capacity" value={`${fmtK(portStats.totalCap)} MW`} sub={`${PROJECTS.length} projects`} accent={T.gold} />
          <Kpi label="Avg Combined Margin EF" value={portStats.avgCM} sub="tCO2/MWh" accent={T.teal} />
        </div>

        <Section title="Combined Margin Methodology">
          <Card border={T.navy}>
            <div style={{fontSize:12,color:T.textSec,lineHeight:1.8}}>
              <p style={{margin:'0 0 8px'}}><strong>Core Formula:</strong> <code style={{fontFamily:T.mono,background:T.cream,padding:'2px 6px',borderRadius:3,fontSize:11}}>BE = Net_Gen x Combined_Margin_EF</code></p>
              <p style={{margin:'0 0 8px'}}><strong>Combined Margin:</strong> <code style={{fontFamily:T.mono,background:T.cream,padding:'2px 6px',borderRadius:3,fontSize:11}}>CM = OM x w1 + BM x w2</code></p>
              <p style={{margin:'0 0 8px'}}><strong>Wind/Solar weights:</strong> OM = 0.75, BM = 0.25 | <strong>Hydro weights:</strong> OM = 0.50, BM = 0.50</p>
              <p style={{margin:'0 0 8px'}}><strong>OM (Operating Margin):</strong> Reflects emissions displacement from existing grid plants dispatched at the margin</p>
              <p style={{margin:0}}><strong>BM (Build Margin):</strong> Reflects emissions from recently constructed plants that would have been built absent the project</p>
            </div>
          </Card>
        </Section>

        <Section title="Technology Default Weights">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10}}>
            {TECH_TYPES.map((t,i)=>{const w=TECH_WEIGHTS[t];return (
              <Card key={t} border={TECH_COLORS[i]}>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:6}}>{t}</div>
                <div style={{display:'flex',gap:16,fontSize:11}}>
                  <div><span style={{color:T.textMut}}>OM Weight:</span> <strong style={{fontFamily:T.mono}}>{w.om}</strong></div>
                  <div><span style={{color:T.textMut}}>BM Weight:</span> <strong style={{fontFamily:T.mono}}>{w.bm}</strong></div>
                </div>
              </Card>
            );})}
          </div>
        </Section>

        <Section title="Credits by Technology">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={portStats.byTech} margin={{left:10,right:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{fontSize:10,fill:T.textSec}} />
                <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                <Tooltip contentStyle={TIP} formatter={v=>[fmtK(v),'tCO2e']} />
                <Legend wrapperStyle={{fontSize:10}} />
                <Bar dataKey="be" name="Baseline Emissions" fill={T.navy} radius={[3,3,0,0]} />
                <Bar dataKey="credits" name="Net Credits" fill={T.emerald} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      </div>)}

      {/* ─── TAB 2: Combined Margin Calculator ─── */}
      {tab===TABS[1]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16}}>
          <Card border={T.teal}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:12}}>Project Parameters</div>
            <DualInput label="Capacity (MW)" value={p.capacity} min={1} max={1000} step={1} onChange={v=>setV('capacity',v)} unit=" MW" />
            <DualInput label="Capacity Factor" value={p.cf} min={0.05} max={0.60} step={0.01} onChange={v=>setV('cf',v)} />
            <DualInput label="Auxiliary Consumption (%)" value={p.aux} min={0} max={15} step={0.5} onChange={v=>setV('aux',v)} unit="%" />
            <DualInput label="OM Emission Factor (tCO2/MWh)" value={p.omEF} min={0.1} max={1.5} step={0.01} onChange={v=>setV('omEF',v)} color={T.navy} />
            <DualInput label="BM Emission Factor (tCO2/MWh)" value={p.bmEF} min={0.05} max={1.0} step={0.01} onChange={v=>setV('bmEF',v)} color={T.teal} />
            <DualInput label="OM Weight (w1)" value={p.omWeight} min={0} max={1} step={0.05} onChange={v=>setV('omWeight',v)} color={T.gold} />
            <DualInput label="BM Weight (w2)" value={p.bmWeight} min={0} max={1} step={0.05} onChange={v=>setV('bmWeight',v)} color={T.sage} />
            <div style={{marginTop:10,padding:10,background:T.cream,borderRadius:4,fontSize:10,color:T.textSec,fontFamily:T.mono}}>
              Net Gen = {fmtK(cmResult.netGen)} MWh/yr<br/>
              CM = {p.omEF}x{p.omWeight} + {p.bmEF}x{p.bmWeight} = <strong>{cmResult.cm}</strong> tCO2/MWh
            </div>
          </Card>

          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
              <Kpi label="Net Generation" value={fmtK(cmResult.netGen)} sub="MWh/yr" accent={T.navy} />
              <Kpi label="Combined Margin EF" value={cmResult.cm} sub="tCO2/MWh" accent={T.teal} />
              <Kpi label="Baseline Emissions" value={fmtK(cmResult.be)} sub="tCO2e/yr" accent={T.amber} />
              <Kpi label="Net Credits" value={fmtK(cmResult.netCredits)} sub="after 8% buffer" color={T.emerald} accent={T.emerald} />
            </div>

            <Section title="Emission Reduction Waterfall">
              <Card>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cmResult.waterfall} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} />
                    <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                    <Tooltip contentStyle={TIP} formatter={v=>[fmtK(Math.abs(v)),'tCO2e']} />
                    <Bar dataKey="value" radius={[3,3,0,0]}>
                      {cmResult.waterfall.map((d,i)=><Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Section title="OM EF Sensitivity">
                <Card>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={cmResult.sensOM} margin={{left:5,right:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="omEF" tick={{fontSize:10,fill:T.textMut}} />
                      <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                      <Tooltip contentStyle={TIP} />
                      <Line type="monotone" dataKey="be" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="BE (tCO2e)" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Section>
              <Section title="BM EF Sensitivity">
                <Card>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={cmResult.sensBM} margin={{left:5,right:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="bmEF" tick={{fontSize:10,fill:T.textMut}} />
                      <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                      <Tooltip contentStyle={TIP} />
                      <Line type="monotone" dataKey="be" stroke={T.teal} strokeWidth={2} dot={{r:3}} name="BE (tCO2e)" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Section>
            </div>
          </div>
        </div>
      </div>)}

      {/* ─── TAB 3: Dispatch Model ─── */}
      {tab===TABS[2]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16}}>
          <Card border={T.purple}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:12}}>Dispatch Parameters</div>
            <DualInput label="Grid Demand (MW)" value={dispatchDemand} min={1000} max={20000} step={100} onChange={setDispatchDemand} unit=" MW" />
            <DualInput label="Renewable Penetration (%)" value={dispatchRenewShare} min={0} max={60} step={1} onChange={setDispatchRenewShare} unit="%" color={T.emerald} />
            <div style={{marginTop:12,padding:10,background:T.cream,borderRadius:4,fontSize:10,fontFamily:T.mono,color:T.textSec}}>
              Avg Marginal EF: <strong>{dispatchData.avgMargEF}</strong> tCO2/MWh<br/>
              Peak Demand: {fmtK(Math.round(dispatchDemand*1.0))} MW<br/>
              Min Demand: {fmtK(Math.round(dispatchDemand*0.6))} MW
            </div>
          </Card>

          <div>
            <Section title="Hourly Dispatch Stack">
              <Card>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dispatchData.hours} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="hour" tick={{fontSize:9,fill:T.textMut}} />
                    <YAxis tick={{fontSize:10,fill:T.textMut}} tickFormatter={fmtK} />
                    <Tooltip contentStyle={TIP} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Area type="monotone" dataKey="coal" stackId="1" stroke={T.red} fill={`${T.red}60`} name="Coal" />
                    <Area type="monotone" dataKey="gas" stackId="1" stroke={T.amber} fill={`${T.amber}60`} name="Gas" />
                    <Area type="monotone" dataKey="other" stackId="1" stroke={T.textMut} fill={`${T.textMut}40`} name="Other" />
                    <Area type="monotone" dataKey="renewable" stackId="1" stroke={T.emerald} fill={`${T.emerald}60`} name="Renewable" />
                    <Line type="monotone" dataKey="demand" stroke={T.navy} strokeWidth={2} dot={false} name="Demand" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            <Section title="Marginal Emission Factor by Hour">
              <Card>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dispatchData.hours} margin={{left:10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="hour" tick={{fontSize:9,fill:T.textMut}} />
                    <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,1]} />
                    <Tooltip contentStyle={TIP} />
                    <ReferenceLine y={dispatchData.avgMargEF} stroke={T.gold} strokeDasharray="5 5" label={{value:`Avg: ${dispatchData.avgMargEF}`,fontSize:10,fill:T.gold}} />
                    <Bar dataKey="marginalEF" name="Marginal EF" radius={[2,2,0,0]}>
                      {dispatchData.hours.map((d,i)=><Cell key={i} fill={d.marginalEF>0.7?T.red:d.marginalEF>0.5?T.amber:T.emerald} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          </div>
        </div>
      </div>)}

      {/* ─── TAB 4: Grid EF Builder ─── */}
      {tab===TABS[3]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <Kpi label="Weighted Grid OM EF" value={gridEFResult.weightedEF} sub="tCO2/MWh" accent={T.navy} />
          <Kpi label="Build Margin EF (last 3 dispatch)" value={gridEFResult.bmEF} sub="tCO2/MWh" accent={T.teal} />
        </div>

        <Section title="Grid Generation Mix (adjust shares)">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:8}}>
              {gridPlants.map((pl,i)=>(
                <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:8,background:i%2===0?T.cream:'transparent',borderRadius:4}}>
                  <div style={{width:130,fontSize:11,fontWeight:600,color:T.navy}}>{pl.type}</div>
                  <div style={{width:60,fontSize:10,fontFamily:T.mono,color:T.textSec}}>EF: {pl.ef}</div>
                  <input type="range" min={0} max={60} value={pl.share} onChange={e=>setPlantShare(i,+e.target.value)} style={{flex:1,accentColor:T.teal,height:4}} />
                  <input type="number" min={0} max={60} value={pl.share} onChange={e=>setPlantShare(i,Math.min(60,Math.max(0,+e.target.value||0)))} style={{width:48,padding:'3px 5px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:10,fontFamily:T.mono,textAlign:'right'}} />
                  <span style={{fontSize:9,color:T.textMut,width:20}}>{pl.share}%</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,fontSize:10,color:gridEFResult.totalShare===100?T.emerald:T.red,fontFamily:T.mono}}>Total share: {gridEFResult.totalShare}% {gridEFResult.totalShare!==100&&'(should sum to 100%)'}</div>
          </Card>
        </Section>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Section title="Plant EF Contribution">
            <Card>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={gridEFResult.plants.filter(pl=>pl.share>0)} margin={{left:10,right:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{fontSize:9,fill:T.textSec}} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{fontSize:10,fill:T.textMut}} />
                  <Tooltip contentStyle={TIP} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Bar dataKey="ef" name="Plant EF" fill={T.navy} radius={[3,3,0,0]} />
                  <Bar dataKey="contribution" name="Weighted Contribution" fill={T.gold} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>
          <Section title="Generation Mix">
            <Card>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={gridEFResult.plants.filter(pl=>pl.share>0)} dataKey="share" nameKey="type" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:9}}>
                    {gridEFResult.plants.filter(pl=>pl.share>0).map((_,i)=><Cell key={i} fill={[T.red,T.navy,T.amber,T.gold,T.purple,T.textMut,T.emerald,T.sage][i%8]} />)}
                  </Pie>
                  <Tooltip contentStyle={TIP} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Section>
        </div>
      </div>)}

      {/* ─── TAB 5: Project Portfolio ─── */}
      {tab===TABS[4]&&(<div>
        <Section title="Hourly Generation Profiles by Technology">
          <Card>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hour" type="number" domain={[0,23]} tick={{fontSize:10,fill:T.textMut}} tickCount={12} />
                <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,1]} label={{value:'Capacity Factor',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{fontSize:10}} />
                {HOURLY_PROFILES.map((profile,ti)=>(
                  <Line key={ti} data={profile} type="monotone" dataKey="output" stroke={TECH_COLORS[ti]} strokeWidth={2} dot={false} name={TECH_TYPES[ti]} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section title={`Project Registry (${PROJECTS.length} projects)`}>
          <Card style={{padding:0,overflow:'hidden'}}>
            <div style={{maxHeight:420,overflowY:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
                <thead style={{position:'sticky',top:0,background:T.surface,zIndex:1}}>
                  <tr>{['ID','Project','Technology','Country','Capacity','CF','OM EF','BM EF','CM','BE (tCO2e)','Credits','Status'].map(h=><th key={h} style={{padding:'8px 8px',textAlign:'left',fontSize:10,color:T.textMut,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap'}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {PROJECTS.map((pr,idx)=>(
                    <tr key={pr.id} style={{borderBottom:`1px solid ${T.border}`,background:idx%2===0?T.cream:'transparent'}}>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{pr.id}</td>
                      <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{pr.name}</td>
                      <td style={{padding:'6px 8px'}}><Badge v={pr.tech} colors={{'Solar PV':T.gold,'Onshore Wind':T.navy,'Offshore Wind':T.teal,'Small Hydro':T.emerald,'Large Hydro':T.sage,'Geothermal':T.purple}} /></td>
                      <td style={{padding:'6px 8px',fontSize:10}}>{pr.country}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.capacity} MW</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.cf}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.omEF}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{pr.bmEF}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,fontWeight:600,color:T.teal}}>{pr.cm}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono}}>{fmtK(pr.be)}</td>
                      <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.emerald,fontWeight:600}}>{fmtK(pr.credits)}</td>
                      <td style={{padding:'6px 8px'}}><Badge v={pr.status} colors={{Active:T.emerald,Verification:T.amber,Registered:T.navy,Validation:T.purple}} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>
      </div>)}

      {/* ─── TAB 6: Additionality & RECs ─── */}
      {tab===TABS[5]&&(<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:20}}>
          <Kpi label="Avg Additionality Score" value={Math.round(PROJECTS.reduce((s,pr)=>s+pr.additionality,0)/PROJECTS.length)} sub="/100" accent={T.emerald} />
          <Kpi label="REC-Eligible Projects" value={PROJECTS.filter(pr=>pr.recEligible).length} sub={`of ${PROJECTS.length}`} accent={T.gold} />
          <Kpi label="High Additionality (>70)" value={PROJECTS.filter(pr=>pr.additionality>70).length} sub="projects" accent={T.teal} />
          <Kpi label="At-Risk (<40)" value={PROJECTS.filter(pr=>pr.additionality<40).length} sub="projects" color={T.red} accent={T.red} />
        </div>

        <Section title="Additionality Scores by Project">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={PROJECTS.map(pr=>({name:pr.id,score:pr.additionality,rec:pr.recEligible?pr.additionality:0}))} margin={{left:10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}} />
                <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]} />
                <Tooltip contentStyle={TIP} />
                <ReferenceLine y={70} stroke={T.emerald} strokeDasharray="5 5" label={{value:'High Threshold',fontSize:9,fill:T.emerald}} />
                <ReferenceLine y={40} stroke={T.red} strokeDasharray="5 5" label={{value:'Risk Threshold',fontSize:9,fill:T.red}} />
                <Bar dataKey="score" name="Additionality Score" radius={[3,3,0,0]}>
                  {PROJECTS.map((pr,i)=><Cell key={i} fill={pr.additionality>70?T.emerald:pr.additionality>40?T.amber:T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section title="REC vs Carbon Credit Eligibility Matrix">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:10}}>
              {PROJECTS.map(pr=>(
                <div key={pr.id} style={{padding:10,background:T.cream,borderRadius:4,borderLeft:`3px solid ${pr.recEligible?T.emerald:T.amber}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:600,color:T.navy}}>{pr.id} - {pr.tech}</span>
                    <Badge v={pr.recEligible?'REC Eligible':'Carbon Only'} colors={{'REC Eligible':T.emerald,'Carbon Only':T.amber}} />
                  </div>
                  <div style={{fontSize:10,color:T.textSec}}>
                    <span style={{fontFamily:T.mono}}>Additionality: {pr.additionality}/100</span> &middot; {pr.country} &middot; {fmtK(pr.credits)} credits
                  </div>
                  <div style={{marginTop:4,height:4,background:T.border,borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pr.additionality}%`,background:pr.additionality>70?T.emerald:pr.additionality>40?T.amber:T.red,borderRadius:2}} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        <Section title="Additionality Assessment Criteria">
          <Card border={T.navy}>
            <div style={{fontSize:11,color:T.textSec,lineHeight:1.8}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><strong style={{color:T.navy}}>Investment Barrier:</strong> Project IRR below benchmark without carbon revenue</div>
                <div><strong style={{color:T.navy}}>Technological Barrier:</strong> First-of-kind or early deployment technology</div>
                <div><strong style={{color:T.navy}}>Institutional Barrier:</strong> Regulatory or permitting challenges without CDM/VCS support</div>
                <div><strong style={{color:T.navy}}>Common Practice:</strong> Technology penetration below 5% in host country grid</div>
              </div>
            </div>
          </Card>
        </Section>
      </div>)}
    </div>
  );
}
