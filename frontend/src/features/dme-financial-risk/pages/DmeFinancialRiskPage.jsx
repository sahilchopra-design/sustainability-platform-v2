/**
 * EP-BE1 — DME Financial Risk Engine
 * Sprint BE | Dynamic Materiality Engine
 *
 * VaR (additive real-time & TCFD structural CVaR), WACC with ESG/climate-risk
 * adjustments, LCR with ESG-adjusted HQLA haircuts, ECL (PD×LGD×EAD),
 * IFRS 9 staging via SICR z-score.
 */
import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine
} from "recharts";

/* ── Theme ──────────────────────────────────────────────────────────────── */
const T = {
  navy:"#1b3a5c", gold:"#c5a96a", cream:"#f7f4ef", slate:"#64748b",
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans', sans-serif", mono:"'JetBrains Mono', monospace",
  green:"#059669", red:"#dc2626", amber:"#d97706", blue:"#2563eb",
  purple:"#7c3aed", teal:"#0e7490",
};

/* ── Seeded random ──────────────────────────────────────────────────────── */
const sr = (s) => { let x = Math.sin(s+1)*10000; return x-Math.floor(x); };
const pick = (arr, s) => arr[Math.floor(sr(s)*arr.length)];

/* ── Engine logic (mirrors dme_financial_risk_engine.py) ────────────────── */
const varRealtime = (varBase, exposure, betaRep, accelRep) =>
  varBase + exposure * betaRep * accelRep;

const climateRiskPremium = (betaCarbon, carbonInt, betaPhysical, physScore) =>
  betaCarbon * carbonInt / 1000 + betaPhysical * physScore / 100;

const waccAdjusted = (wEq, cEq, esgEqPrem, wDt, cDt, esgDtSpread, taxRate) => {
  const wacc = wEq*(cEq+esgEqPrem) + wDt*(cDt+esgDtSpread)*(1-taxRate);
  const base = wEq*cEq + wDt*cDt*(1-taxRate);
  return { wacc:+wacc.toFixed(4), baseline:+base.toFixed(4), bps:Math.round((wacc-base)*10000) };
};

const lcrAdjusted = (hqla, haircut, outflows, premium) =>
  +(hqla*(1-haircut) / (outflows*(1+premium)) * 100).toFixed(1);

const ecl = (pd, lgd, ead) => +(pd*lgd*ead).toFixed(2);

const ifrs9Stage = (zScore) => zScore < 1.5 ? 1 : zScore < 3.0 ? 2 : 3;

/* ── Sectors ────────────────────────────────────────────────────────────── */
const SECTORS = ["Energy","Materials","Industrials","Consumer Discretionary","Consumer Staples","Health Care","Financials","IT","Utilities","Real Estate"];
const SECTOR_ALPHA = {Energy:0.45,Materials:0.35,Industrials:0.25,"Consumer Discretionary":0.15,"Consumer Staples":0.12,"Health Care":0.08,Financials:0.18,IT:0.06,Utilities:0.40,"Real Estate":0.20};

/* ── Generate entity universe ───────────────────────────────────────────── */
const genEntities = (n) => Array.from({length:n},(_,i)=>{
  const sector   = pick(SECTORS, i*7);
  const alpha    = SECTOR_ALPHA[sector] || 0.18;
  const varBase  = +(0.02 + sr(i*3)*0.12).toFixed(4);
  const exposure = Math.round(50 + sr(i*7)*950);
  const betaRep  = +(0.1 + sr(i*11)*0.4).toFixed(3);
  const accel    = +(0.5 + sr(i*13)*2).toFixed(2);
  const varAdj   = +varRealtime(varBase, exposure/1000, betaRep, accel).toFixed(4);
  const carbonInt= Math.round(20 + sr(i*17)*480);
  const physScore= Math.round(10 + sr(i*19)*80);
  const crp      = +climateRiskPremium(alpha*0.5, carbonInt, alpha*0.3, physScore).toFixed(4);
  const wEq=0.6, cEq=+(0.08+sr(i*23)*0.06).toFixed(4), wDt=0.4, cDt=+(0.03+sr(i*29)*0.03).toFixed(4);
  const esgEqPrem=+(crp*0.6).toFixed(4), esgDtSprd=+(crp*0.3).toFixed(4), tax=0.25;
  const waccRes  = waccAdjusted(wEq, cEq, esgEqPrem, wDt, cDt, esgDtSprd, tax);
  const hqla     = Math.round(100 + sr(i*31)*900);
  const haircut  = +(0.02 + sr(i*37)*0.12).toFixed(3);
  const outflows = Math.round(50 + sr(i*41)*400);
  const outPrem  = +(0.01 + sr(i*43)*0.08).toFixed(3);
  const lcr      = lcrAdjusted(hqla, haircut, outflows, outPrem);
  const pd       = +(0.005 + sr(i*47)*0.12).toFixed(4);
  const lgd      = +(0.3 + sr(i*53)*0.4).toFixed(3);
  const ead      = Math.round(10 + sr(i*59)*490);
  const eclVal   = ecl(pd, lgd, ead);
  const zScore   = +(sr(i*61)*4).toFixed(2);
  const stage    = ifrs9Stage(zScore);
  return { id:i+1, name:`${sector.split(" ")[0].slice(0,4).toUpperCase()}-Corp-${String(i+1).padStart(2,"0")}`,
    sector, varBase, varAdj, varDelta:+(varAdj-varBase).toFixed(4),
    crp, waccBaseline:waccRes.baseline, waccAdj:waccRes.wacc, waccBps:waccRes.bps,
    lcr, haircut, outPrem, pd, lgd, ead, eclVal, zScore, stage, carbonInt, physScore };
});

const ENTITIES = genEntities(40);

/* ── VaR time-series (30 days) ──────────────────────────────────────────── */
const VAR_TREND = Array.from({length:30},(_,i)=>({
  day: i+1,
  baseline: +(0.055 + (sr(i*3)-0.48)*0.015).toFixed(4),
  adjusted: +(0.078 + (sr(i*7)-0.45)*0.02).toFixed(4),
  cvarTrans: +(0.032 + (sr(i*11)-0.5)*0.01).toFixed(4),
  cvarPhys:  +(0.018 + (sr(i*13)-0.5)*0.008).toFixed(4),
}));

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const pill = (l,bg,fg="#fff")=><span style={{background:bg,color:fg,borderRadius:4,padding:"2px 7px",fontSize:11,fontFamily:T.mono,fontWeight:600}}>{l}</span>;
const card = (ch,st={})=><div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:20,...st}}>{ch}</div>;
const SH = ({title,sub})=><div style={{marginBottom:14}}><div style={{fontWeight:700,fontSize:15,color:T.navy}}>{title}</div>{sub&&<div style={{fontSize:12,color:T.slate,marginTop:2}}>{sub}</div>}</div>;
const stageColor = s=>s===1?T.green:s===2?T.amber:T.red;

/* ── Tab 1: VaR Dashboard ───────────────────────────────────────────────── */
const VarDashboard = () => {
  const avgBase = +(ENTITIES.reduce((s,e)=>s+e.varBase,0)/ENTITIES.length).toFixed(4);
  const avgAdj  = +(ENTITIES.reduce((s,e)=>s+e.varAdj,0)/ENTITIES.length).toFixed(4);
  const maxDelta= Math.max(...ENTITIES.map(e=>e.varDelta));

  const sectorVar = SECTORS.map(s=>{
    const sc=ENTITIES.filter(e=>e.sector===s);
    return {sector:s.split(" ")[0], base:sc.length?+(sc.reduce((a,e)=>a+e.varBase,0)/sc.length).toFixed(4):0, adj:sc.length?+(sc.reduce((a,e)=>a+e.varAdj,0)/sc.length).toFixed(4):0};
  }).filter(s=>s.base>0);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[{label:"Avg Baseline VaR",value:(avgBase*100).toFixed(2)+"%",color:T.navy},{label:"Avg Adjusted VaR",value:(avgAdj*100).toFixed(2)+"%",color:T.red},{label:"Max VaR Uplift",value:(maxDelta*100).toFixed(2)+"%",color:T.amber},{label:"Avg CRP (bps)",value:Math.round(ENTITIES.reduce((s,e)=>s+e.crp,0)/ENTITIES.length*10000),color:T.purple}]
          .map(m=>card(<><div style={{fontSize:11,color:T.slate,marginBottom:6}}>{m.label}</div><div style={{fontSize:22,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div></>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {card(<><SH title="30-Day VaR Trend — Baseline vs ESG-Adjusted" sub="DME additive real-time VaR (VaR_base + Exposure × β_rep × acceleration)"/>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={VAR_TREND}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="day" tick={{fontSize:9,fontFamily:T.mono}}/><YAxis tick={{fontSize:10,fontFamily:T.mono}} tickFormatter={v=>`${(v*100).toFixed(1)}%`}/>
              <Tooltip formatter={v=>`${(v*100).toFixed(2)}%`}/><Legend/>
              <Line dataKey="baseline" name="Baseline VaR" stroke={T.navy} strokeWidth={2} dot={false}/>
              <Line dataKey="adjusted" name="Adjusted VaR" stroke={T.red}  strokeWidth={2} dot={false}/>
              <Line dataKey="cvarTrans" name="CVaR Transition" stroke={T.amber} strokeWidth={1} dot={false} strokeDasharray="3 2"/>
              <Line dataKey="cvarPhys"  name="CVaR Physical"   stroke={T.blue}  strokeWidth={1} dot={false} strokeDasharray="2 2"/>
            </LineChart>
          </ResponsiveContainer></>)}
        {card(<><SH title="Sector Average VaR — Baseline vs Adjusted"/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sectorVar} margin={{bottom:20}}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="sector" tick={{fontSize:9,fontFamily:T.mono}} angle={-30} textAnchor="end" interval={0}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} tickFormatter={v=>`${(v*100).toFixed(1)}%`}/>
              <Tooltip formatter={v=>`${(v*100).toFixed(2)}%`}/><Legend/>
              <Bar dataKey="base" name="Baseline" fill={T.navy}/><Bar dataKey="adj" name="Adjusted" fill={T.red}/>
            </BarChart>
          </ResponsiveContainer></>)}
      </div>
      {card(<><SH title="Entity VaR Register — 40 entities" sub="DME real-time + structural TCFD CVaR"/>
        <div style={{maxHeight:340,overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead style={{position:"sticky",top:0,background:T.cream}}><tr>
              {["Entity","Sector","Baseline VaR","Adjusted VaR","Δ VaR","Carbon Int","Phys Score","CRP (bps)"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"left",color:T.navy,fontWeight:700,borderBottom:`2px solid ${T.gold}`,fontFamily:T.mono,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>{ENTITIES.map((e,i)=>(
              <tr key={e.id} style={{background:i%2===0?"#fff":T.cream}}>
                <td style={{padding:"5px 8px",fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy}}>{e.name}</td>
                <td style={{padding:"5px 8px",fontSize:11,color:T.slate}}>{e.sector.split(" ")[0]}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:T.navy}}>{(e.varBase*100).toFixed(2)}%</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:T.red,fontWeight:700}}>{(e.varAdj*100).toFixed(2)}%</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:e.varDelta>0.01?T.red:T.amber}}>+{(e.varDelta*100).toFixed(2)}%</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:e.carbonInt>300?T.red:T.amber}}>{e.carbonInt}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:e.physScore>60?T.red:T.slate}}>{e.physScore}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:e.crp>0.02?T.red:T.amber}}>{Math.round(e.crp*10000)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div></>)}
    </div>
  );
};

/* ── Tab 2: WACC & LCR ──────────────────────────────────────────────────── */
const WaccLcr = () => {
  const avgBps = Math.round(ENTITIES.reduce((s,e)=>s+e.waccBps,0)/ENTITIES.length);
  const lcrBreached = ENTITIES.filter(e=>e.lcr<100).length;

  const waccData = [...ENTITIES].sort((a,b)=>b.waccBps-a.waccBps).slice(0,15).map(e=>({name:e.name.slice(-5),baseline:(e.waccBaseline*100).toFixed(2),adjusted:(e.waccAdj*100).toFixed(2),bps:e.waccBps}));
  const lcrData  = SECTORS.map(s=>{const sc=ENTITIES.filter(e=>e.sector===s);return {sector:s.split(" ")[0],avgLcr:sc.length?+(sc.reduce((a,e)=>a+e.lcr,0)/sc.length).toFixed(1):0};}).filter(s=>s.avgLcr>0);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[{label:"Avg WACC Uplift (bps)",value:avgBps,color:T.purple},{label:"Max WACC Uplift (bps)",value:Math.max(...ENTITIES.map(e=>e.waccBps)),color:T.red},{label:"LCR < 100% (breached)",value:lcrBreached,color:T.amber},{label:"Avg LCR",value:`${+(ENTITIES.reduce((s,e)=>s+e.lcr,0)/ENTITIES.length).toFixed(1)}%`,color:T.green}]
          .map(m=>card(<><div style={{fontSize:11,color:T.slate,marginBottom:6}}>{m.label}</div><div style={{fontSize:22,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div></>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {card(<><SH title="WACC ESG Uplift — Top 15 entities (bps)" sub="Climate risk premium added to cost of equity + ESG spread on debt"/>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={waccData} margin={{bottom:20}}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="name" tick={{fontSize:10,fontFamily:T.mono}}/><YAxis tick={{fontSize:10,fontFamily:T.mono}} unit="bp"/>
              <Tooltip formatter={(v,n)=>n==="bps"?`${v} bp`:`${v}%`}/><Legend/>
              <Bar dataKey="bps" name="WACC Uplift (bp)" fill={T.purple} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer></>)}
        {card(<><SH title="LCR by Sector — ESG-Adjusted" sub="LCR% = Adjusted HQLA / Adjusted Outflows × 100 (min 100%)"/>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={lcrData} margin={{bottom:20}}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="sector" tick={{fontSize:9,fontFamily:T.mono}} angle={-30} textAnchor="end" interval={0}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} unit="%"/><Tooltip unit="%"/>
              <ReferenceLine y={100} stroke={T.red} strokeDasharray="3 2" label={{value:"Min 100%",fill:T.red,fontSize:10}}/>
              <Bar dataKey="avgLcr" name="Avg LCR %" radius={[4,4,0,0]}>
                {lcrData.map((d,i)=><Cell key={i} fill={d.avgLcr>=100?T.green:T.red}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer></>)}
      </div>
    </div>
  );
};

/* ── Tab 3: ECL & IFRS 9 ────────────────────────────────────────────────── */
const EclIfrs9 = () => {
  const totalEcl = ENTITIES.reduce((s,e)=>s+e.eclVal,0);
  const stageDist = [1,2,3].map(s=>({stage:`Stage ${s}`,count:ENTITIES.filter(e=>e.stage===s).length,totalEcl:+ENTITIES.filter(e=>e.stage===s).reduce((a,e)=>a+e.eclVal,0).toFixed(2)}));

  const scatter = ENTITIES.map(e=>({x:e.pd*100,y:e.eclVal,stage:e.stage}));

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[{label:"Total ECL ($M)",value:`$${totalEcl.toFixed(1)}M`,color:T.red},{label:"Stage 1",value:stageDist[0].count,color:T.green},{label:"Stage 2 (SICR)",value:stageDist[1].count,color:T.amber},{label:"Stage 3 (Impaired)",value:stageDist[2].count,color:T.red}]
          .map(m=>card(<><div style={{fontSize:11,color:T.slate,marginBottom:6}}>{m.label}</div><div style={{fontSize:22,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div></>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {card(<><SH title="ECL by IFRS 9 Stage" sub="ECL = PD × LGD × EAD; stage via DME SICR z-score"/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stageDist}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="stage" tick={{fontSize:12,fontFamily:T.mono}}/><YAxis yAxisId="l" tick={{fontSize:10,fontFamily:T.mono}}/><YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fontFamily:T.mono}}/>
              <Tooltip/><Legend/>
              <Bar yAxisId="l" dataKey="count"    name="# Entities" radius={[4,4,0,0]}>{stageDist.map((_,i)=><Cell key={i} fill={[T.green,T.amber,T.red][i]}/>)}</Bar>
              <Bar yAxisId="r" dataKey="totalEcl" name="Total ECL ($M)" fill={T.navy}/>
            </BarChart>
          </ResponsiveContainer></>)}
        {card(<><SH title="PD vs ECL — Entity Scatter" sub="Bubble by IFRS 9 stage"/>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="x" name="PD %" unit="%" tick={{fontSize:10,fontFamily:T.mono}}/>
              <YAxis dataKey="y" name="ECL ($M)" tick={{fontSize:10,fontFamily:T.mono}}/>
              <Tooltip formatter={(v,n)=>n==="PD %"?`${v.toFixed(2)}%`:`$${v.toFixed(1)}M`}/>
              <Scatter data={scatter} fillOpacity={0.7}>{scatter.map((d,i)=><Cell key={i} fill={stageColor(d.stage)}/>)}</Scatter>
            </ScatterChart>
          </ResponsiveContainer></>)}
      </div>
      {card(<><SH title="IFRS 9 Staging Reference" sub="DME SICR z-score → stage classification"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[{stage:"Stage 1",z:"z < 1.5",desc:"No significant increase in credit risk. 12-month ECL.",color:T.green},{stage:"Stage 2",z:"1.5 ≤ z < 3.0",desc:"Significant increase in credit risk (SICR). Lifetime ECL.",color:T.amber},{stage:"Stage 3",z:"z ≥ 3.0",desc:"Credit-impaired. Lifetime ECL; interest on net carrying amount.",color:T.red}]
            .map((s,i)=><div key={i} style={{background:T.cream,borderRadius:6,padding:"12px 14px",borderLeft:`4px solid ${s.color}`}}>
              <div style={{fontWeight:700,fontSize:13,color:s.color,fontFamily:T.mono,marginBottom:4}}>{s.stage}</div>
              <div style={{fontSize:12,color:T.navy,fontFamily:T.mono,marginBottom:6}}>{s.z}</div>
              <div style={{fontSize:11,color:T.slate}}>{s.desc}</div>
            </div>)}
        </div></>)}
    </div>
  );
};

/* ── Tab 4: Formula Reference ───────────────────────────────────────────── */
const FormulaRef = () => (
  <div>
    {[
      {title:"VaR — Additive Real-Time",formula:"VaR_adj = VaR_base + Exposure × β_reputational × acceleration",note:"Additive adjustment for reputational contagion channel"},
      {title:"CVaR — TCFD Structural",formula:"CVaR_struct = CVaR_transition + CVaR_physical − CVaR_opportunity",note:"Net of opportunity offset; three TCFD risk channels"},
      {title:"Climate Risk Premium",formula:"CRP = β_carbon × (carbon_intensity / 1000) + β_physical × (physical_score / 100)",note:"Feeds into WACC equity cost component"},
      {title:"WACC (ESG-Adjusted)",formula:"WACC = w_E×(c_E+ESG_E) + w_D×(c_D+ESG_D)×(1−tax)",note:"ESG premium on equity; ESG spread on debt"},
      {title:"LCR (ESG-Adjusted)",formula:"LCR% = HQLA×(1−haircut) / (outflows×(1+premium)) × 100",note:"Higher haircuts on brown HQLA; premium on ESG outflows"},
      {title:"Expected Credit Loss",formula:"ECL = PD × LGD × EAD",note:"Components from DME PD Engine (4-branch dispatch)"},
      {title:"IFRS 9 Stage (SICR)",formula:"Stage 1: z<1.5 | Stage 2: 1.5≤z<3.0 | Stage 3: z≥3.0",note:"Z-score from DME DMI z-score function"},
    ].map((f,i)=>card(
      <><div style={{fontWeight:700,fontSize:13,color:T.navy,marginBottom:8}}>{f.title}</div>
        <div style={{fontFamily:T.mono,fontSize:12,color:T.blue,background:T.cream,borderRadius:6,padding:"8px 12px",marginBottom:8}}>{f.formula}</div>
        <div style={{fontSize:11,color:T.slate}}>{f.note}</div></>,
      {marginBottom:12}
    ))}
  </div>
);

/* ── Page Shell ─────────────────────────────────────────────────────────── */
const TABS=[{key:"var",label:"VaR Dashboard"},{key:"wacc",label:"WACC & LCR"},{key:"ecl",label:"ECL & IFRS 9"},{key:"ref",label:"Formula Reference"}];

export default function DmeFinancialRiskPage() {
  const [tab,setTab]=useState("var");
  return (
    <div style={{fontFamily:T.font,background:T.cream,minHeight:"100vh",padding:24}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.navy}}>DME Financial Risk Engine</h1>
          {pill("EP-BE1",T.navy)}{pill("DME",T.purple)}
        </div>
        <div style={{fontSize:13,color:T.slate}}>VaR · TCFD CVaR · WACC ESG adjustment · LCR HQLA haircut · ECL (PD×LGD×EAD) · IFRS 9 staging · 40 entities</div>
      </div>
      <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`2px solid ${T.gold}`}}>
        {TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"8px 20px",background:tab===t.key?T.navy:"transparent",color:tab===t.key?"#fff":T.slate,border:"none",cursor:"pointer",fontSize:13,fontFamily:T.font,fontWeight:tab===t.key?700:400,borderBottom:tab===t.key?`2px solid ${T.gold}`:"none",marginBottom:tab===t.key?-2:0,transition:"all 0.15s"}}>{t.label}</button>)}
      </div>
      {tab==="var"  &&<VarDashboard/>}
      {tab==="wacc" &&<WaccLcr/>}
      {tab==="ecl"  &&<EclIfrs9/>}
      {tab==="ref"  &&<FormulaRef/>}
    </div>
  );
}
