/**
 * EP-BE3 — DME Dynamic Materiality Index
 * Sprint BE | Dynamic Materiality Engine
 *
 * DMI = 40% Impact + 40% Risk + 20% Opportunity
 * Regime: Normal (z≤1) / Elevated (z≤2) / Critical (z≤3) / Extreme (z>3)
 * EMA smoothing, velocity, acceleration, portfolio aggregation, HHI diversity,
 * Brinson-style marginal contribution decomposition.
 */
import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";

const T={navy:"#1b3a5c",gold:"#c5a96a",cream:"#f7f4ef",slate:"#64748b",card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans', sans-serif",mono:"'JetBrains Mono', monospace",green:"#059669",red:"#dc2626",amber:"#d97706",blue:"#2563eb",purple:"#7c3aed",teal:"#0e7490"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const pick=(arr,s)=>arr[Math.floor(sr(s)*arr.length)];

/* ── Engine logic (mirrors dme_dmi_engine.py) ────────────────────────────── */
const DMI_WEIGHTS={impact:0.40,risk:0.40,opportunity:0.20};

const calcDmi=(impact,risk,opp,w=DMI_WEIGHTS)=>+(impact*w.impact+risk*w.risk+opp*w.opportunity).toFixed(3);

const emaSmooth=(raw,prev,alpha=0.2)=>+(alpha*raw+(1-alpha)*prev).toFixed(4);

const calcZScore=(val,mean,std)=>std>0?+((val-mean)/std).toFixed(3):0;

const classifyRegime=(z)=>z<=1.0?"Normal":z<=2.0?"Elevated":z<=3.0?"Critical":"Extreme";

const calcVelocity=(curr,prev,dt=1)=>dt>0?+((curr-prev)/dt).toFixed(4):0;

/* ── Universe ─────────────────────────────────────────────────────────────── */
const SECTORS=["Energy","Materials","Industrials","Consumer","Health","Financials","IT","Utilities","Real Estate","Telecom"];
const COMPANIES=["EnerMega","MatsCorp","IndusGroup","ConsCo","HealthInc","FinBank","TechVerde","UtilPower","RealtyCo","TelecomNV","GreenInfra","AgriEco","WaterCo","TransCo","ChemGroup","AutoGroup","PharmaCo","InsureCo","RetailCo","MediaCo"];

const genEntities=(n)=>Array.from({length:n},(_,i)=>{
  const impact=+(30+sr(i*3)*65).toFixed(1);
  const risk  =+(25+sr(i*7)*70).toFixed(1);
  const opp   =+(20+sr(i*11)*60).toFixed(1);
  const dmi   =calcDmi(impact,risk,opp);
  // For z-score, we use fixed universe mean/std
  const mean=55, std=15;
  const z   =calcZScore(dmi,mean,std);
  const regime=classifyRegime(Math.abs(z));
  // EMA-smoothed (simulate prev as slightly different)
  const prevDmi=+(dmi*(0.9+sr(i*13)*0.2)).toFixed(3);
  const emaVal=emaSmooth(dmi,prevDmi);
  const vel   =calcVelocity(dmi,prevDmi);
  const prevVel=calcVelocity(prevDmi,+(prevDmi*(0.9+sr(i*17)*0.2)).toFixed(3));
  const accel =calcVelocity(vel,prevVel);
  // Brinson contributions
  const impactContrib=+(impact*DMI_WEIGHTS.impact).toFixed(2);
  const riskContrib  =+(risk  *DMI_WEIGHTS.risk).toFixed(2);
  const oppContrib   =+(opp   *DMI_WEIGHTS.opportunity).toFixed(2);
  // HHI
  const w1=(impactContrib/dmi), w2=(riskContrib/dmi), w3=(oppContrib/dmi);
  const hhi=+(w1*w1+w2*w2+w3*w3).toFixed(4);
  return {id:i+1,name:COMPANIES[i%COMPANIES.length]+`-${i+1}`,sector:pick(SECTORS,i*19),impact,risk,opp,dmi,z:Math.abs(z),regime,emaVal,vel,accel,impactContrib,riskContrib,oppContrib,hhi};
});

const ENTITIES=genEntities(35);

/* ── 90-day time series ──────────────────────────────────────────────────── */
const TS=Array.from({length:90},(_,i)=>{
  const raw=+(50+sr(i*3)*30-10).toFixed(2);
  const ema=+(50+sr(i*7)*20-5).toFixed(2);
  const z  =+((raw-55)/15).toFixed(3);
  return {day:i+1,raw,ema,velocity:+(sr(i*11)*0.8-0.4).toFixed(3),regime:classifyRegime(Math.abs(z))};
});

/* ── Portfolio aggregation ───────────────────────────────────────────────── */
const portfolioWeights=ENTITIES.map((_,i)=>+(0.02+sr(i*37)*0.03).toFixed(4));
const weightSum=portfolioWeights.reduce((s,w)=>s+w,0);
const normalizedW=portfolioWeights.map(w=>+(w/weightSum).toFixed(4));
const portfolioDmi=+(ENTITIES.reduce((s,e,i)=>s+e.dmi*normalizedW[i],0)).toFixed(3);
const hhi=+(normalizedW.reduce((s,w)=>s+w*w,0)).toFixed(4);

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const pill=(l,bg,fg="#fff")=><span style={{background:bg,color:fg,borderRadius:4,padding:"2px 7px",fontSize:11,fontFamily:T.mono,fontWeight:600}}>{l}</span>;
const card=(ch,st={})=><div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:20,...st}}>{ch}</div>;
const SH=({title,sub})=><div style={{marginBottom:14}}><div style={{fontWeight:700,fontSize:15,color:T.navy}}>{title}</div>{sub&&<div style={{fontSize:12,color:T.slate,marginTop:2}}>{sub}</div>}</div>;
const regimeColor=r=>({Normal:T.green,Elevated:T.amber,Critical:T.red,Extreme:T.purple}[r]||T.slate);
const dmiColor=d=>d>70?T.red:d>55?T.amber:T.green;

/* ── Tab 1: DMI Scorecard ────────────────────────────────────────────────── */
const DmiScorecard = () => {
  const [sectorF,setS]=useState("All");
  const [regimeF,setR]=useState("All");
  const filtered=useMemo(()=>{
    let d=ENTITIES;
    if(sectorF!=="All") d=d.filter(e=>e.sector===sectorF);
    if(regimeF!=="All") d=d.filter(e=>e.regime===regimeF);
    return [...d].sort((a,b)=>b.dmi-a.dmi);
  },[sectorF,regimeF]);

  const regimeDist=["Normal","Elevated","Critical","Extreme"].map(r=>({regime:r,count:ENTITIES.filter(e=>e.regime===r).length}));

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[{label:"Portfolio DMI",value:portfolioDmi,color:dmiColor(portfolioDmi)},{label:"Extreme regime",value:ENTITIES.filter(e=>e.regime==="Extreme").length,color:T.purple},{label:"Critical regime",value:ENTITIES.filter(e=>e.regime==="Critical").length,color:T.red},{label:"Portfolio HHI",value:hhi,color:T.blue}]
          .map(m=>card(<><div style={{fontSize:11,color:T.slate,marginBottom:6}}>{m.label}</div><div style={{fontSize:22,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div></>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {card(<><SH title="Regime Distribution — Entity Universe"/>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={regimeDist}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="regime" tick={{fontSize:11,fontFamily:T.mono}}/><YAxis tick={{fontSize:10,fontFamily:T.mono}}/>
              <Tooltip/><Bar dataKey="count" name="Entities" radius={[4,4,0,0]}>
                {regimeDist.map((_,i)=><Cell key={i} fill={[T.green,T.amber,T.red,T.purple][i]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer></>)}
        {card(<><SH title="DMI Component Breakdown — Avg" sub="Impact (40%) · Risk (40%) · Opportunity (20%)"/>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={[{axis:"Impact",val:+(ENTITIES.reduce((s,e)=>s+e.impact,0)/ Math.max(1, ENTITIES.length)).toFixed(1)},{axis:"Risk",val:+(ENTITIES.reduce((s,e)=>s+e.risk,0)/ Math.max(1, ENTITIES.length)).toFixed(1)},{axis:"Opportunity",val:+(ENTITIES.reduce((s,e)=>s+e.opp,0)/ Math.max(1, ENTITIES.length)).toFixed(1)},{axis:"DMI",val:+(ENTITIES.reduce((s,e)=>s+e.dmi,0)/ Math.max(1, ENTITIES.length)).toFixed(1)},{axis:"EMA DMI",val:+(ENTITIES.reduce((s,e)=>s+e.emaVal,0)/ Math.max(1, ENTITIES.length)).toFixed(1)}]} cx="50%" cy="50%" outerRadius={80}>
              <PolarGrid stroke="#e2e8f0"/><PolarAngleAxis dataKey="axis" tick={{fontSize:10,fontFamily:T.mono}}/>
              <Radar name="Avg" dataKey="val" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
            </RadarChart>
          </ResponsiveContainer></>)}
      </div>
      {card(<>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <SH title="Entity DMI Register" sub={null}/>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <select value={sectorF} onChange={e=>setS(e.target.value)} style={{fontSize:12,padding:"4px 8px",borderRadius:4,border:"1px solid #e2e8f0",fontFamily:T.mono}}>
              <option>All</option>{SECTORS.map(s=><option key={s}>{s}</option>)}
            </select>
            <select value={regimeF} onChange={e=>setR(e.target.value)} style={{fontSize:12,padding:"4px 8px",borderRadius:4,border:"1px solid #e2e8f0",fontFamily:T.mono}}>
              <option>All</option>{["Normal","Elevated","Critical","Extreme"].map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={{maxHeight:340,overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead style={{position:"sticky",top:0,background:T.cream}}><tr>
              {["Entity","Sector","Impact","Risk","Opp","DMI","EMA","Velocity","Accel","z","Regime","HHI"].map(h=><th key={h} style={{padding:"5px 8px",textAlign:"left",color:T.navy,fontWeight:700,borderBottom:`2px solid ${T.gold}`,fontFamily:T.mono,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map((e,i)=>(
              <tr key={e.id} style={{background:i%2===0?"#fff":T.cream}}>
                <td style={{padding:"5px 8px",fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy}}>{e.name}</td>
                <td style={{padding:"5px 8px",fontSize:11,color:T.slate}}>{e.sector}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:dmiColor(e.impact)}}>{e.impact}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:dmiColor(e.risk)}}>{e.risk}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:T.green}}>{e.opp}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,fontWeight:700,color:dmiColor(e.dmi)}}>{e.dmi}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:T.slate}}>{e.emaVal}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:e.vel>0?T.red:T.green}}>{e.vel>0?"+":""}{e.vel}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:T.slate}}>{e.accel}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:e.z>2?T.red:T.slate}}>{e.z}</td>
                <td style={{padding:"5px 8px"}}>{pill(e.regime,regimeColor(e.regime))}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:T.slate}}>{e.hhi}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ── Tab 2: Time-Series & Velocity ───────────────────────────────────────── */
const TimeSeries = () => {
  const sample=TS.filter((_,i)=>i%3===0);
  return (
    <div>
      {card(<><SH title="DMI Time-Series — Raw vs EMA-Smoothed (90 days)" sub="α=0.2 EMA; regime boundaries overlaid"/>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={sample}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
            <XAxis dataKey="day" tick={{fontSize:9,fontFamily:T.mono}} interval={4}/><YAxis tick={{fontSize:10,fontFamily:T.mono}} domain={[20,90]}/>
            <Tooltip/><Legend/>
            <ReferenceLine y={70} stroke={T.amber} strokeDasharray="3 2" label={{value:"Elevated",fill:T.amber,fontSize:9}}/>
            <ReferenceLine y={80} stroke={T.red}   strokeDasharray="3 2" label={{value:"Critical",fill:T.red,fontSize:9}}/>
            <Line dataKey="raw" name="Raw DMI"     stroke={T.navy}  strokeWidth={1.5} dot={false}/>
            <Line dataKey="ema" name="EMA DMI"     stroke={T.gold}  strokeWidth={2.5} dot={false}/>
          </LineChart>
        </ResponsiveContainer></>,{marginBottom:20})}
      {card(<><SH title="DMI Velocity (dDMI/dt)" sub="First derivative — positive = rising materiality"/>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={sample}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
            <XAxis dataKey="day" tick={{fontSize:9,fontFamily:T.mono}} interval={4}/><YAxis tick={{fontSize:10,fontFamily:T.mono}}/>
            <Tooltip formatter={v=>[v.toFixed(3),"Velocity"]}/><ReferenceLine y={0} stroke={T.slate}/>
            <Area dataKey="velocity" name="DMI Velocity" stroke={T.purple} fill={T.purple} fillOpacity={0.15} strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer></>)}
    </div>
  );
};

/* ── Tab 3: Portfolio Aggregation ────────────────────────────────────────── */
const PortfolioAgg = () => {
  const top10=[...ENTITIES].sort((a,b)=>b.dmi-a.dmi).slice(0,10);
  const contribData=top10.map((e,i)=>({name:e.name.split("-")[0],impact:e.impactContrib,risk:e.riskContrib,opp:e.oppContrib,weight:+(normalizedW[ENTITIES.indexOf(e)]*100).toFixed(2)}));

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
        {[{label:"Portfolio DMI (weighted)",value:portfolioDmi,color:dmiColor(portfolioDmi)},{label:"HHI Concentration",value:hhi,color:T.blue},{label:"Entities in portfolio",value:ENTITIES.length,color:T.navy}]
          .map(m=>card(<><div style={{fontSize:11,color:T.slate,marginBottom:6}}>{m.label}</div><div style={{fontSize:24,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div></>))}
      </div>
      {card(<><SH title="Brinson Marginal Contribution — Top 10 entities" sub="DMI = 40% Impact + 40% Risk + 20% Opportunity — contribution per component"/>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={contribData} margin={{bottom:10}}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
            <XAxis dataKey="name" tick={{fontSize:10,fontFamily:T.mono}}/><YAxis tick={{fontSize:10,fontFamily:T.mono}}/>
            <Tooltip/><Legend/>
            <Bar dataKey="impact" name="Impact (40%)" stackId="a" fill={T.red}/>
            <Bar dataKey="risk"   name="Risk (40%)"   stackId="a" fill={T.amber}/>
            <Bar dataKey="opp"    name="Opp (20%)"    stackId="a" fill={T.green}/>
          </BarChart>
        </ResponsiveContainer></>,{marginBottom:20})}
      {card(<><SH title="Regime Summary by Sector"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
          {SECTORS.map(s=>{
            const sc=ENTITIES.filter(e=>e.sector===s);
            const mode=["Normal","Elevated","Critical","Extreme"].reduce((best,r)=>sc.filter(e=>e.regime===r).length>sc.filter(e=>e.regime===best).length?r:best,"Normal");
            const avgDmi=sc.length?+(sc.reduce((a,e)=>a+e.dmi,0)/sc.length).toFixed(1):0;
            return <div key={s} style={{background:T.cream,borderRadius:6,padding:"10px 12px",borderLeft:`3px solid ${regimeColor(mode)}`}}>
              <div style={{fontSize:11,color:T.slate,marginBottom:4}}>{s}</div>
              <div style={{fontSize:16,fontWeight:700,color:dmiColor(avgDmi),fontFamily:T.mono,marginBottom:4}}>{avgDmi}</div>
              {pill(mode,regimeColor(mode))}
            </div>;
          })}
        </div></>)}
    </div>
  );
};

/* ── Tab 4: Engine Reference ─────────────────────────────────────────────── */
const EngineRef = () => (
  <div>
    {card(<><SH title="DMI Formula" sub="From dme_dmi_engine.py"/>
      <div style={{fontFamily:T.mono,fontSize:13,color:T.blue,background:T.cream,borderRadius:6,padding:"10px 14px",marginBottom:12}}>
        DMI = 0.40 × Impact + 0.40 × Risk + 0.20 × Opportunity
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[{comp:"Impact",w:"40%",desc:"Magnitude and likelihood of ESG impact on stakeholders and environment"},
          {comp:"Risk",  w:"40%",desc:"Financial materiality of ESG risk to enterprise value (transition + physical + S/G)"},
          {comp:"Opportunity",w:"20%",desc:"Upside potential from sustainability leadership, green products, ESG positioning"}]
          .map((c,i)=><div key={i} style={{background:T.cream,borderRadius:6,padding:"10px 14px",borderLeft:`3px solid ${[T.red,T.amber,T.green][i]}`}}>
            <div style={{fontWeight:700,color:[T.red,T.amber,T.green][i],fontSize:14,fontFamily:T.mono,marginBottom:4}}>{c.w} {c.comp}</div>
            <div style={{fontSize:11,color:T.slate}}>{c.desc}</div>
          </div>)}
      </div></>,{marginBottom:16})}
    {card(<><SH title="Regime Classification" sub="z-score from calculate_z_score() → classify_regime()"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[{r:"Normal",z:"z ≤ 1.0",desc:"Within 1 std of mean; standard monitoring",c:T.green},
          {r:"Elevated",z:"1.0 < z ≤ 2.0",desc:"Heightened watch; flag for escalation",c:T.amber},
          {r:"Critical",z:"2.0 < z ≤ 3.0",desc:"Significant outlier; immediate review required",c:T.red},
          {r:"Extreme",z:"z > 3.0",desc:"Tail event; escalate to board/risk committee",c:T.purple}]
          .map((r,i)=><div key={i} style={{background:T.cream,borderRadius:6,padding:"10px 14px",borderTop:`3px solid ${r.c}`}}>
            <div style={{fontWeight:700,color:r.c,fontFamily:T.mono,marginBottom:4}}>{r.r}</div>
            <div style={{fontSize:12,color:T.navy,fontFamily:T.mono,marginBottom:6}}>{r.z}</div>
            <div style={{fontSize:11,color:T.slate}}>{r.desc}</div>
          </div>)}
      </div></>,{marginBottom:16})}
    {card(<><SH title="Time-Series Functions" sub="Velocity, acceleration, EMA smoothing"/>
      {[{fn:"calculate_velocity(curr, prev, Δt=1)",desc:"First derivative: (curr − prev) / Δt"},
        {fn:"calculate_acceleration(v_curr, v_prev, Δt=1)",desc:"Second derivative of DMI: (v_curr − v_prev) / Δt"},
        {fn:"ema_smooth(raw, prev_ema, α=0.2)",desc:"α × raw + (1 − α) × prev_ema"},
        {fn:"calculate_z_score(value, mean, std)",desc:"(value − mean) / std_dev — maps to regime"},
      ].map((f,i)=><div key={i} style={{padding:"8px 0",borderBottom:"1px solid #f1f5f9"}}>
        <div style={{fontFamily:T.mono,fontSize:12,color:T.blue,marginBottom:3}}>{f.fn}</div>
        <div style={{fontSize:11,color:T.slate}}>{f.desc}</div>
      </div>)}</>)}
  </div>
);

/* ── Page Shell ──────────────────────────────────────────────────────────── */
const TABS=[{key:"score",label:"DMI Scorecard"},{key:"ts",label:"Time-Series"},{key:"portfolio",label:"Portfolio Aggregation"},{key:"ref",label:"Engine Reference"}];
export default function DmeIndexPage() {
  const [tab,setTab]=useState("score");
  return (
    <div style={{fontFamily:T.font,background:T.cream,minHeight:"100vh",padding:24}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.navy}}>Dynamic Materiality Index</h1>
          {pill("EP-BE3",T.navy)}{pill("DME",T.purple)}
        </div>
        <div style={{fontSize:13,color:T.slate}}>DMI = 40% Impact + 40% Risk + 20% Opp · Normal/Elevated/Critical/Extreme · EMA · velocity · portfolio HHI · 35 entities</div>
      </div>
      <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`2px solid ${T.gold}`}}>
        {TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"8px 20px",background:tab===t.key?T.navy:"transparent",color:tab===t.key?"#fff":T.slate,border:"none",cursor:"pointer",fontSize:13,fontFamily:T.font,fontWeight:tab===t.key?700:400,borderBottom:tab===t.key?`2px solid ${T.gold}`:"none",marginBottom:tab===t.key?-2:0,transition:"all 0.15s"}}>{t.label}</button>)}
      </div>
      {tab==="score"     &&<DmiScorecard/>}
      {tab==="ts"        &&<TimeSeries/>}
      {tab==="portfolio" &&<PortfolioAgg/>}
      {tab==="ref"       &&<EngineRef/>}
    </div>
  );
}
