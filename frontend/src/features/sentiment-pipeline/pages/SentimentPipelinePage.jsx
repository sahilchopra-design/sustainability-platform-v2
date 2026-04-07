/**
 * EP-BD2 — Sentiment Analysis Pipeline Engine
 * Sprint BD | ESG Intelligence & Analytics
 *
 * 8-step pipeline: Ingest → Classify → Score → Weight → Decay →
 * Aggregate → Velocity → Alert
 * 8 stakeholder groups, source credibility tiers 1-5,
 * EWMA velocity, Watch/Elevated/Critical/Extreme alerts.
 */
import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T = {
  navy:  "#1b3a5c",
  gold:  "#c5a96a",
  cream: "#f7f4ef",
  slate: "#64748b",
  font:  "'DM Sans', sans-serif",
  mono:  "'JetBrains Mono', monospace",
  green: "#059669",
  red:   "#dc2626",
  amber: "#d97706",
  blue:  "#2563eb",
  purple:"#7c3aed",
  teal:  "#0e7490",
  card:  "#ffffff", sub:  "#5c6b7e", indigo:  "#4f46e5",
};

/* ── Seeded random ──────────────────────────────────────────────────────────── */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const pick = (arr, s) => arr[Math.floor(sr(s) * arr.length)];

/* ── Engine constants (mirrors sentiment_pipeline_engine.py) ────────────────── */
const STAKEHOLDER_WEIGHTS = {
  investor: 0.20, regulator: 0.18, employee: 0.15, customer: 0.14,
  media: 0.12, ngo: 0.08, community: 0.07, supplier: 0.06,
};

const CREDIBILITY_TIERS = [
  {tier:1, label:"Tier 1 — Authoritative",  weight:1.00, examples:"SEC filings, audited reports, regulatory announcements"},
  {tier:2, label:"Tier 2 — High Quality",   weight:0.85, examples:"Reuters, Bloomberg, FT, peer-reviewed research"},
  {tier:3, label:"Tier 3 — Standard",       weight:0.65, examples:"Major newspapers, NGO reports, industry bodies"},
  {tier:4, label:"Tier 4 — Mixed",          weight:0.45, examples:"Verified social media, analyst blogs"},
  {tier:5, label:"Tier 5 — Low",            weight:0.25, examples:"Unverified social, forums, anonymous posts"},
];

const DECAY_TYPES = [
  {type:"instant", halfLife:"1d"},  {type:"fast",    halfLife:"7d"},
  {type:"medium",  halfLife:"30d"}, {type:"slow",    halfLife:"90d"},
  {type:"chronic", halfLife:"1yr"}, {type:"permanent",halfLife:"10yr"},
];

const ALERT_THRESHOLDS = {Watch:-0.3, Elevated:-0.5, Critical:-0.7, Extreme:-0.9};

const ESG_PILLARS = ["Environmental","Social","Governance"];
const SIGNAL_SOURCES = ["SEC Filing","Bloomberg","Reuters","FT","NGO Report","Social Media","Industry Body","Analyst Note","Regulatory Notice","Press Release"];
const ENTITIES = ["EnergyMega Corp","TechVerde Ltd","AutoEco AG","FinBank PLC","ManufGreen SA","RetailSust NV","InfraClean Inc","AgriEco SpA"];

/* ── Generate signals ───────────────────────────────────────────────────────── */
const genSignals = (n) => Array.from({length:n},(_,i)=>{
  const rawScore  = +(sr(i*3)*2-1).toFixed(3);
  const credTier  = 1 + Math.floor(sr(i*7)*5);
  const credWeight= CREDIBILITY_TIERS[credTier-1].weight;
  const daysAgo   = Math.round(sr(i*11)*60);
  const decayType = pick(["instant","fast","medium","slow","chronic","permanent"],i*13);
  const halfDays  = {instant:1,fast:7,medium:30,slow:90,chronic:365,permanent:3650}[decayType];
  const decayFactor = Math.exp(-Math.log(2)*daysAgo/halfDays);
  const weightedScore = +(rawScore * credWeight * decayFactor).toFixed(4);
  const stakeholder   = pick(Object.keys(STAKEHOLDER_WEIGHTS),i*17);
  const pillar        = pick(ESG_PILLARS,i*19);
  return {
    id: i+1,
    entity: pick(ENTITIES,i*23),
    source: pick(SIGNAL_SOURCES,i*29),
    pillar,
    stakeholder,
    rawScore,
    credTier,
    credWeight,
    daysAgo,
    decayType,
    decayFactor: +decayFactor.toFixed(3),
    weightedScore,
    headline: `${pillar} signal — ${pick(["positive guidance","risk disclosure","regulatory action","controversy","commitment pledge","audit finding"],i*37)}`,
  };
});

const SIGNALS = genSignals(60);

/* ── Entity aggregation ─────────────────────────────────────────────────────── */
const entityAgg = ENTITIES.map((entity,ei)=>{
  const sigs = SIGNALS.filter(s=>s.entity===entity);
  if(!sigs.length) return null;
  // stakeholder-weighted composite
  const composite = Object.entries(STAKEHOLDER_WEIGHTS).reduce((sum,[sk,w])=>{
    const skSigs = sigs.filter(s=>s.stakeholder===sk);
    const skAvg = skSigs.length ? skSigs.reduce((a,s)=>a+s.weightedScore,0)/skSigs.length : 0;
    return sum + skAvg*w;
  },0);
  const velocity = +(sr(ei*41)*0.04-0.02).toFixed(4);  // EWMA delta
  const score = +composite.toFixed(4);
  const alertLevel = score < ALERT_THRESHOLDS.Extreme ? "Extreme" :
                     score < ALERT_THRESHOLDS.Critical ? "Critical" :
                     score < ALERT_THRESHOLDS.Elevated ? "Elevated" :
                     score < ALERT_THRESHOLDS.Watch    ? "Watch"    : "Clear";
  return { entity, score, velocity, alertLevel, sigCount:sigs.length };
}).filter(Boolean);

/* ── 90-day sentiment trend ─────────────────────────────────────────────────── */
const TREND = Array.from({length:90},(_,i)=>({
  day: i+1,
  Environmental: +(sr(i*3)*0.6-0.1).toFixed(3),
  Social:        +(sr(i*7)*0.5-0.08).toFixed(3),
  Governance:    +(sr(i*11)*0.55-0.05).toFixed(3),
  composite:     +(sr(i*17)*0.5-0.08).toFixed(3),
}));

/* ── Radar data by stakeholder ──────────────────────────────────────────────── */
const RADAR_DATA = Object.keys(STAKEHOLDER_WEIGHTS).map(sk=>({
  stakeholder: sk.charAt(0).toUpperCase()+sk.slice(1),
  score: +(SIGNALS.filter(s=>s.stakeholder===sk).reduce((a,s)=>a+s.weightedScore,0)/(SIGNALS.filter(s=>s.stakeholder===sk).length||1)*10+5).toFixed(2),
}));

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const pill = (label,bg,fg="#fff") => (
  <span style={{background:bg,color:fg,borderRadius:4,padding:"2px 7px",fontSize:11,fontFamily:T.mono,fontWeight:600}}>{label}</span>
);
const card = (children,style={}) => (
  <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:20,...style}}>{children}</div>
);
const SH = ({title,sub}) => (
  <div style={{marginBottom:14}}>
    <div style={{fontWeight:700,fontSize:15,color:T.navy}}>{title}</div>
    {sub&&<div style={{fontSize:12,color:T.slate,marginTop:2}}>{sub}</div>}
  </div>
);

const sentColor = s => s>=0.1?T.green:s<=-0.3?T.red:s<-0.1?T.amber:T.slate;
const alertColor = a => ({Clear:T.green,Watch:T.amber,Elevated:T.amber,Critical:T.red,Extreme:T.purple}[a]||T.slate);
const pillarColor = p => ({Environmental:T.green,Social:T.blue,Governance:T.purple}[p]||T.slate);

/* ── Tab 1: Signal Feed ─────────────────────────────────────────────────────── */
const SignalFeed = () => {
  const [pillarF,setP] = useState("All");
  const [entityF,setE] = useState("All");

  const filtered = useMemo(()=>{
    let d=SIGNALS;
    if(pillarF!=="All") d=d.filter(s=>s.pillar===pillarF);
    if(entityF!=="All") d=d.filter(s=>s.entity===entityF);
    return [...d].sort((a,b)=>a.weightedScore-b.weightedScore);
  },[pillarF,entityF]);

  const pillarAvg = ESG_PILLARS.map(p=>({
    pillar:p.slice(0,3),
    avg: +(SIGNALS.filter(s=>s.pillar===p).reduce((a,s)=>a+s.weightedScore,0)/(SIGNALS.filter(s=>s.pillar===p).length||1)).toFixed(4),
    count: SIGNALS.filter(s=>s.pillar===p).length,
  }));

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[
          {label:"Total Signals",       value:SIGNALS.length},
          {label:"Negative (score < 0)",value:SIGNALS.filter(s=>s.weightedScore<0).length, color:T.red},
          {label:"Alerts Active",       value:entityAgg.filter(e=>e.alertLevel!=="Clear").length, color:T.amber},
          {label:"Entities Monitored",  value:entityAgg.length, color:T.blue},
        ].map(m=>card(
          <><div style={{fontSize:11,color:T.slate,marginBottom:6}}>{m.label}</div>
          <div style={{fontSize:22,fontWeight:700,color:m.color||T.navy,fontFamily:T.mono}}>{m.value}</div></>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {card(<>
          <SH title="Average Weighted Score by ESG Pillar"/>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pillarAvg}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="pillar" tick={{fontSize:12,fontFamily:T.mono,fontWeight:700}}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} domain={[-0.2,0.2]}/>
              <Tooltip formatter={v=>[v.toFixed(4),"Avg Score"]}/>
              <ReferenceLine y={0} stroke={T.slate}/>
              <Bar dataKey="avg" name="Avg Score" radius={[4,4,0,0]}>
                {pillarAvg.map((d,i)=><Cell key={i} fill={d.avg>=0?T.green:T.red}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Stakeholder Sentiment Radar" sub="Weighted average score by stakeholder group"/>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius={80}>
              <PolarGrid stroke="#e2e8f0"/>
              <PolarAngleAxis dataKey="stakeholder" tick={{fontSize:9,fontFamily:T.mono}}/>
              <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
            </RadarChart>
          </ResponsiveContainer>
        </>)}
      </div>

      {card(<>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <SH title="Signal Feed — 60 signals" sub={null}/>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <select value={pillarF} onChange={e=>setP(e.target.value)} style={{fontSize:12,padding:"4px 8px",borderRadius:4,border:"1px solid #e2e8f0",fontFamily:T.mono}}>
              <option>All</option>{ESG_PILLARS.map(p=><option key={p}>{p}</option>)}
            </select>
            <select value={entityF} onChange={e=>setE(e.target.value)} style={{fontSize:12,padding:"4px 8px",borderRadius:4,border:"1px solid #e2e8f0",fontFamily:T.mono}}>
              <option>All</option>{ENTITIES.map(en=><option key={en}>{en}</option>)}
            </select>
          </div>
        </div>
        <div style={{maxHeight:340,overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead style={{position:"sticky",top:0,background:T.cream}}>
              <tr>{["Entity","Headline","Pillar","Stakeholder","Source","Tier","Raw","Decay","Weighted","Age"].map(h=>(
                <th key={h} style={{padding:"5px 8px",textAlign:"left",color:T.navy,fontWeight:700,borderBottom:`2px solid ${T.gold}`,fontFamily:T.mono,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((s,i)=>(
                <tr key={s.id} style={{background:i%2===0?"#fff":T.cream}}>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy}}>{s.entity.split(" ")[0]}</td>
                  <td style={{padding:"5px 8px",fontSize:10,color:T.slate,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.headline}</td>
                  <td style={{padding:"5px 8px"}}>{pill(s.pillar.slice(0,3),pillarColor(s.pillar))}</td>
                  <td style={{padding:"5px 8px",fontSize:11,color:T.slate,textTransform:"capitalize"}}>{s.stakeholder}</td>
                  <td style={{padding:"5px 8px",fontSize:10,color:T.slate}}>{s.source.split(" ")[0]}</td>
                  <td style={{padding:"5px 8px",textAlign:"center"}}>{pill(`T${s.credTier}`,s.credTier<=2?T.green:s.credTier<=3?T.amber:T.slate)}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,color:sentColor(s.rawScore)}}>{s.rawScore>0?"+":""}{s.rawScore}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,fontSize:10,color:T.slate}}>{s.decayFactor}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,fontWeight:700,color:sentColor(s.weightedScore)}}>{s.weightedScore>0?"+":""}{s.weightedScore}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,fontSize:11,color:T.slate}}>{s.daysAgo}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ── Tab 2: Entity Sentiment Monitor ────────────────────────────────────────── */
const EntityMonitor = () => {
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {["Clear","Watch","Elevated","Critical"].map(a=>(
          card(<>
            <div style={{fontSize:11,color:T.slate,marginBottom:6}}>Alert: {a}</div>
            <div style={{fontSize:22,fontWeight:700,color:alertColor(a),fontFamily:T.mono}}>
              {entityAgg.filter(e=>e.alertLevel===a).length}
            </div>
          </>,{borderTop:`3px solid ${alertColor(a)}`})
        ))}
      </div>

      {card(<>
        <SH title="Entity Composite Sentiment Scores" sub="Stakeholder-weighted, credibility-adjusted, time-decayed"/>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[...entityAgg].sort((a,b)=>a.score-b.score)} margin={{bottom:20}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
            <XAxis dataKey="entity" tick={{fontSize:9,fontFamily:T.mono}} angle={-25} textAnchor="end" interval={0}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}} domain={[-0.15,0.1]}/>
            <Tooltip formatter={v=>[v.toFixed(4),"Composite"]}/>
            <ReferenceLine y={ALERT_THRESHOLDS.Watch}    stroke={T.amber}  strokeDasharray="3 2" label={{value:"Watch",fill:T.amber,fontSize:9}}/>
            <ReferenceLine y={ALERT_THRESHOLDS.Elevated} stroke={T.amber}  strokeDasharray="3 2"/>
            <ReferenceLine y={ALERT_THRESHOLDS.Critical} stroke={T.red}    strokeDasharray="3 2" label={{value:"Critical",fill:T.red,fontSize:9}}/>
            <ReferenceLine y={0} stroke={T.slate}/>
            <Bar dataKey="score" name="Composite Score" radius={[4,4,0,0]}>
              {[...entityAgg].sort((a,b)=>a.score-b.score).map((d,i)=><Cell key={i} fill={alertColor(d.alertLevel)}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </>,{marginBottom:20})}

      {card(<>
        <SH title="Entity Alert Register"/>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:T.cream}}>
              {["Entity","Composite Score","Velocity (EWMA Δ)","# Signals","Alert Level"].map(h=>(
                <th key={h} style={{padding:"6px 10px",textAlign:"left",color:T.navy,fontWeight:700,borderBottom:`2px solid ${T.gold}`,fontFamily:T.mono,fontSize:11}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...entityAgg].sort((a,b)=>a.score-b.score).map((e,i)=>(
              <tr key={i} style={{background:i%2===0?"#fff":T.cream}}>
                <td style={{padding:"7px 10px",fontWeight:700,color:T.navy}}>{e.entity}</td>
                <td style={{padding:"7px 10px",fontFamily:T.mono,fontWeight:700,color:sentColor(e.score)}}>{e.score>0?"+":""}{e.score}</td>
                <td style={{padding:"7px 10px",fontFamily:T.mono,color:e.velocity>0?T.green:T.red}}>{e.velocity>0?"+":""}{e.velocity}</td>
                <td style={{padding:"7px 10px",fontFamily:T.mono}}>{e.sigCount}</td>
                <td style={{padding:"7px 10px"}}>{pill(e.alertLevel,alertColor(e.alertLevel))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>)}
    </div>
  );
};

/* ── Tab 3: Trend Analysis ──────────────────────────────────────────────────── */
const TrendAnalysis = () => {
  const [view, setView] = useState("pillar");
  const sample = TREND.filter((_,i)=>i%3===0);
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["pillar","composite"].map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{
            padding:"6px 16px",borderRadius:4,border:`1px solid ${view===v?T.navy:"#e2e8f0"}`,
            background:view===v?T.navy:"#fff",color:view===v?"#fff":T.slate,
            fontSize:12,cursor:"pointer",fontFamily:T.mono,textTransform:"capitalize"
          }}>{v==="pillar"?"By ESG Pillar":"Composite"}</button>
        ))}
      </div>

      {card(<>
        <SH title={view==="pillar"?"90-Day ESG Pillar Sentiment Trend":"90-Day Composite Sentiment"} sub="Daily weighted-average scores — smoothed 3-day sample"/>
        <ResponsiveContainer width="100%" height={280}>
          {view==="pillar"?(
            <LineChart data={sample}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="day" tick={{fontSize:9,fontFamily:T.mono}} interval={4}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} domain={[-0.5,0.5]}/>
              <Tooltip formatter={v=>[v.toFixed(3),"Score"]}/>
              <Legend/>
              <ReferenceLine y={0} stroke={T.slate}/>
              <Line dataKey="Environmental" stroke={T.green}  strokeWidth={2} dot={false}/>
              <Line dataKey="Social"        stroke={T.blue}   strokeWidth={2} dot={false}/>
              <Line dataKey="Governance"    stroke={T.purple} strokeWidth={2} dot={false}/>
            </LineChart>
          ):(
            <AreaChart data={sample}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="day" tick={{fontSize:9,fontFamily:T.mono}} interval={4}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} domain={[-0.5,0.5]}/>
              <Tooltip formatter={v=>[v.toFixed(3),"Composite"]}/>
              <ReferenceLine y={ALERT_THRESHOLDS.Watch}    stroke={T.amber} strokeDasharray="3 2"/>
              <ReferenceLine y={ALERT_THRESHOLDS.Critical} stroke={T.red}   strokeDasharray="3 2"/>
              <ReferenceLine y={0} stroke={T.slate}/>
              <Area dataKey="composite" name="Composite" stroke={T.navy} fill={T.navy} fillOpacity={0.1} strokeWidth={2}/>
            </AreaChart>
          )}
        </ResponsiveContainer>
      </>,{marginBottom:20})}

      {card(<>
        <SH title="Signal Decay Reference" sub="Time-decay half-lives by signal type"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {DECAY_TYPES.map((d,i)=>(
            <div key={i} style={{background:T.cream,borderRadius:6,padding:"10px 14px"}}>
              <div style={{fontFamily:T.mono,fontWeight:700,fontSize:13,color:T.navy,marginBottom:4}}>{d.type}</div>
              <div style={{fontSize:12,color:T.slate}}>Half-life: <strong style={{color:T.navy,fontFamily:T.mono}}>{d.halfLife}</strong></div>
              <div style={{fontSize:11,color:T.slate,marginTop:3}}>
                {d.halfLife==="1d"?"Breaking news, intraday":d.halfLife==="7d"?"Short-cycle news, earnings":d.halfLife==="30d"?"Monthly reports, controversies":d.halfLife==="90d"?"Quarterly, regulatory":"Annual / permanent ESG commitments"}
              </div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
};

/* ── Tab 4: Pipeline Reference ──────────────────────────────────────────────── */
const PipelineReference = () => {
  const steps = [
    {step:"1 INGEST",     desc:"Raw signal ingested from source: filing, newswire, social, API",             icon:"📥"},
    {step:"2 CLASSIFY",   desc:"Stakeholder group (8 types) + ESG pillar (E/S/G) assigned via keyword match",icon:"🏷️"},
    {step:"3 SCORE",      desc:"Raw sentiment score [-1.0, +1.0] with confidence [0,1] from NLP model",      icon:"🎯"},
    {step:"4 WEIGHT",     desc:"Multiply by source credibility: Tier 1 (×1.00) → Tier 5 (×0.25)",           icon:"⚖️"},
    {step:"5 DECAY",      desc:"Apply time-decay: score × exp(-ln2 × daysAgo / halfLife)",                   icon:"⏳"},
    {step:"6 AGGREGATE",  desc:"Stakeholder-weighted composite; HHI diversity score computed",               icon:"📊"},
    {step:"7 VELOCITY",   desc:"EWMA-smoothed velocity (Δ composite) + acceleration; trend direction",       icon:"📈"},
    {step:"8 ALERT",      desc:"Threshold check: Watch(-0.3) / Elevated(-0.5) / Critical(-0.7) / Extreme(-0.9)",icon:"🚨"},
  ];
  return (
    <div>
      {card(<>
        <SH title="8-Step Sentiment Pipeline" sub="From sentiment_pipeline_engine.py"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {steps.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"12px 14px",background:T.cream,borderRadius:6,alignItems:"flex-start"}}>
              <span style={{fontSize:20,lineHeight:1}}>{s.icon}</span>
              <div>
                <div style={{fontFamily:T.mono,fontWeight:700,fontSize:12,color:T.navy,marginBottom:4}}>{s.step}</div>
                <div style={{fontSize:11,color:T.slate,lineHeight:1.5}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </>,{marginBottom:20})}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {card(<>
          <SH title="Stakeholder Weights" sub="Sum = 100%"/>
          {Object.entries(STAKEHOLDER_WEIGHTS).map(([sk,w],i)=>(
            <div key={i} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,color:T.navy,fontWeight:600,textTransform:"capitalize"}}>{sk}</span>
                <span style={{fontFamily:T.mono,fontWeight:700,fontSize:12,color:T.navy}}>{(w*100).toFixed(0)}%</span>
              </div>
              <div style={{background:"#e2e8f0",borderRadius:3,height:6}}>
                <div style={{width:`${w*100/0.20}%`,background:T.navy,borderRadius:3,height:6}}/>
              </div>
            </div>
          ))}
        </>)}
        {card(<>
          <SH title="Source Credibility Tiers"/>
          {CREDIBILITY_TIERS.map((ct,i)=>(
            <div key={i} style={{padding:"8px 0",borderBottom:"1px solid #f1f5f9"}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                {pill(`×${ct.weight}`,ct.tier<=2?T.green:ct.tier<=3?T.amber:T.slate)}
                <span style={{fontSize:12,fontWeight:600,color:T.navy}}>{ct.label}</span>
              </div>
              <div style={{fontSize:11,color:T.slate,paddingLeft:4}}>{ct.examples}</div>
            </div>
          ))}
        </>)}
      </div>
    </div>
  );
};

/* ── Page Shell ──────────────────────────────────────────────────────────── */
const TABS = [
  {key:"feed",     label:"Signal Feed"},
  {key:"entity",   label:"Entity Monitor"},
  {key:"trend",    label:"Trend Analysis"},
  {key:"pipeline", label:"Pipeline Reference"},
];

export default function SentimentPipelinePage() {
  const [tab,setTab] = useState("feed");
  return (
    <div style={{fontFamily:T.font,background:T.cream,minHeight:"100vh",padding:24}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.navy}}>Sentiment Pipeline Engine</h1>
          {pill("EP-BD2",T.navy)}{pill("ESG Intelligence",T.purple)}
        </div>
        <div style={{fontSize:13,color:T.slate}}>
          60 signals · 8-step pipeline · 8 stakeholder groups · credibility tiers · time-decay · EWMA velocity · Watch/Critical alerts
        </div>
      </div>
      <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`2px solid ${T.gold}`}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            padding:"8px 20px",background:tab===t.key?T.navy:"transparent",
            color:tab===t.key?"#fff":T.slate,border:"none",cursor:"pointer",
            fontSize:13,fontFamily:T.font,fontWeight:tab===t.key?700:400,
            borderBottom:tab===t.key?`2px solid ${T.gold}`:"none",
            marginBottom:tab===t.key?-2:0,transition:"all 0.15s"
          }}>{t.label}</button>
        ))}
      </div>
      {tab==="feed"     && <SignalFeed/>}
      {tab==="entity"   && <EntityMonitor/>}
      {tab==="trend"    && <TrendAnalysis/>}
      {tab==="pipeline" && <PipelineReference/>}
    </div>
  );
}
