/**
 * EP-BE2 — DME 4-Branch Probability of Default Engine
 * Sprint BE | Dynamic Materiality Engine
 *
 * Branch A: Exponential real-time  PD = PD_base × exp(α × v_transition)
 * Branch B: Merton DD (IFRS 9) with stranded-asset haircut
 * Branch C: Tabular ESG band multipliers (low 1.05 / med 1.30 / high 2.00 / severe 3.25)
 * Branch D: Multi-factor PD = PD_base × exp(α×v_T + β×v_P + γ×v_SG)
 */
import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine
} from "recharts";

const T={navy:"#1b3a5c",gold:"#c5a96a",cream:"#f7f4ef",slate:"#64748b",card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans', sans-serif",mono:"'JetBrains Mono', monospace",green:"#059669",red:"#dc2626",amber:"#d97706",blue:"#2563eb",purple:"#7c3aed",teal:"#0e7490"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const pick=(arr,s)=>arr[Math.floor(sr(s)*arr.length)];

/* ── Engine constants ────────────────────────────────────────────────────── */
const SECTOR_COEFFICIENTS={
  "Energy":           {alpha:0.45,beta:0.30,gamma:0.15,carbonSens:0.85,strandedRisk:0.75},
  "Materials":        {alpha:0.35,beta:0.25,gamma:0.12,carbonSens:0.72,strandedRisk:0.55},
  "Industrials":      {alpha:0.25,beta:0.20,gamma:0.10,carbonSens:0.45,strandedRisk:0.30},
  "Consumer Disc":    {alpha:0.15,beta:0.15,gamma:0.12,carbonSens:0.25,strandedRisk:0.15},
  "Health Care":      {alpha:0.08,beta:0.10,gamma:0.15,carbonSens:0.12,strandedRisk:0.05},
  "Financials":       {alpha:0.18,beta:0.12,gamma:0.20,carbonSens:0.30,strandedRisk:0.20},
  "IT":               {alpha:0.06,beta:0.08,gamma:0.12,carbonSens:0.10,strandedRisk:0.03},
  "Utilities":        {alpha:0.40,beta:0.35,gamma:0.12,carbonSens:0.80,strandedRisk:0.65},
  "Real Estate":      {alpha:0.20,beta:0.30,gamma:0.08,carbonSens:0.35,strandedRisk:0.25},
  "Consumer Staples": {alpha:0.12,beta:0.18,gamma:0.10,carbonSens:0.30,strandedRisk:0.10},
};
const SECTORS=Object.keys(SECTOR_COEFFICIENTS);

const ESG_BAND_MULT={low:1.05,medium:1.30,high:2.00,severe:3.25};
const esgBand=(s)=>s>70?"low":s>50?"medium":s>30?"high":"severe";

/* ── Branch calculations ─────────────────────────────────────────────────── */
const branchA=(pdBase,alpha,vT)=>Math.min(1, pdBase*Math.exp(alpha*vT));
const branchB=(assetVal,debtFace,assetVol,T_yrs,strandedHaircut)=>{
  const S=assetVal*(1-strandedHaircut), K=debtFace, sigma=assetVol;
  if(S<=0||sigma<=0||T_yrs<=0) return 0.5;
  const d2=(Math.log(S/K)+(- 0.5*sigma*sigma)*T_yrs)/(sigma*Math.sqrt(T_yrs));
  // N(-d2) approximation via tanh
  const nd2=0.5*(1-Math.tanh(d2*0.7071));
  return Math.min(0.99, Math.max(0.001, nd2));
};
const branchC=(pdBase,esgScore)=>Math.min(0.99, pdBase*ESG_BAND_MULT[esgBand(esgScore)]);
const branchD=(pdBase,alpha,vT,beta,vP,gamma,vSG)=>Math.min(1, pdBase*Math.exp(alpha*vT+beta*vP+gamma*vSG));

/* ── Universe ─────────────────────────────────────────────────────────────── */
const genEntities=(n)=>Array.from({length:n},(_,i)=>{
  const sector=pick(SECTORS,i*7);
  const coeff=SECTOR_COEFFICIENTS[sector];
  const pdBase=+(0.005+sr(i*3)*0.08).toFixed(4);
  const esgScore=Math.round(20+sr(i*11)*75);
  const vT=+(sr(i*13)*2-0.5).toFixed(3);
  const vP=+(sr(i*17)*1.5-0.3).toFixed(3);
  const vSG=+(sr(i*19)*1.2-0.2).toFixed(3);
  const assetVal=Math.round(200+sr(i*23)*1800);
  const debtFace=Math.round(assetVal*(0.3+sr(i*29)*0.4));
  const assetVol=+(0.15+sr(i*31)*0.3).toFixed(3);
  const strandedH=coeff.strandedRisk*(0.5+sr(i*37)*0.5);
  const pdA=+branchA(pdBase,coeff.alpha,vT).toFixed(5);
  const pdB=+branchB(assetVal,debtFace,assetVol,3,strandedH).toFixed(5);
  const pdC=+branchC(pdBase,esgScore).toFixed(5);
  const pdD=+branchD(pdBase,coeff.alpha,vT,coeff.beta,vP,coeff.gamma,vSG).toFixed(5);
  const pdBlended=+((pdA+pdB*1.2+pdC*0.8+pdD*1.5)/4.5).toFixed(5);
  return {id:i+1,name:`${sector.split(" ")[0].slice(0,4).toUpperCase()}-${String(i+1).padStart(2,"0")}`,sector,pdBase,esgScore,vT,vP,vSG,assetVal,debtFace,assetVol,strandedHaircut:+strandedH.toFixed(3),pdA,pdB,pdC,pdD,pdBlended,alpha:coeff.alpha,beta:coeff.beta,gamma:coeff.gamma,carbonSens:coeff.carbonSens,strandedRisk:coeff.strandedRisk};
});

const ENTITIES=genEntities(40);

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const pill=(l,bg,fg="#fff")=><span style={{background:bg,color:fg,borderRadius:4,padding:"2px 7px",fontSize:11,fontFamily:T.mono,fontWeight:600}}>{l}</span>;
const card=(ch,st={})=><div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:20,...st}}>{ch}</div>;
const SH=({title,sub})=><div style={{marginBottom:14}}><div style={{fontWeight:700,fontSize:15,color:T.navy}}>{title}</div>{sub&&<div style={{fontSize:12,color:T.slate,marginTop:2}}>{sub}</div>}</div>;
const pdColor=p=>p>0.05?T.red:p>0.02?T.amber:T.green;
const bandColor=b=>({low:T.green,medium:T.amber,high:T.red,severe:T.purple}[b]);

/* ── Tab 1: PD Comparison ────────────────────────────────────────────────── */
const PdComparison = () => {
  const [sort,setSort]=useState("pdBlended");
  const sorted=[...ENTITIES].sort((a,b)=>b[sort]-a[sort]);

  const branchAvg={A:+(ENTITIES.reduce((s,e)=>s+e.pdA,0)/ Math.max(1, ENTITIES.length)).toFixed(5),B:+(ENTITIES.reduce((s,e)=>s+e.pdB,0)/ Math.max(1, ENTITIES.length)).toFixed(5),C:+(ENTITIES.reduce((s,e)=>s+e.pdC,0)/ Math.max(1, ENTITIES.length)).toFixed(5),D:+(ENTITIES.reduce((s,e)=>s+e.pdD,0)/ Math.max(1, ENTITIES.length)).toFixed(5)};

  const branchComp=[{branch:"A Exponential",pd:branchAvg.A,desc:"Realtime"},{branch:"B Merton DD",pd:branchAvg.B,desc:"IFRS 9"},{branch:"C Tabular",pd:branchAvg.C,desc:"ESG band"},{branch:"D Multi-factor",pd:branchAvg.D,desc:"Portfolio"}];

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[{label:"Avg Blended PD",value:`${(ENTITIES.reduce((s,e)=>s+e.pdBlended,0)/ Math.max(1, ENTITIES.length)*100).toFixed(2)}%`,color:T.red},{label:"High Risk (>5%)",value:ENTITIES.filter(e=>e.pdBlended>0.05).length,color:T.amber},{label:"Avg Branch A (exp)",value:`${(branchAvg.A*100).toFixed(2)}%`,color:T.blue},{label:"Avg Branch D (multi-factor)",value:`${(branchAvg.D*100).toFixed(2)}%`,color:T.purple}]
          .map(m=>card(<><div style={{fontSize:11,color:T.slate,marginBottom:6}}>{m.label}</div><div style={{fontSize:22,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div></>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {card(<><SH title="Average PD by Branch" sub="Universe mean across 40 entities"/>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={branchComp}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="branch" tick={{fontSize:10,fontFamily:T.mono}}/><YAxis tick={{fontSize:10,fontFamily:T.mono}} tickFormatter={v=>`${(v*100).toFixed(1)}%`}/>
              <Tooltip formatter={v=>`${(v*100).toFixed(3)}%`}/>
              <Bar dataKey="pd" name="Avg PD" radius={[4,4,0,0]}>{branchComp.map((_,i)=><Cell key={i} fill={[T.blue,T.teal,T.amber,T.purple][i]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer></>)}
        {card(<><SH title="Branch A vs D — Exponential vs Multi-Factor" sub="Scatter: per-entity PD divergence"/>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{left:10}}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="x" name="Branch A" unit="%" tick={{fontSize:10,fontFamily:T.mono}}/><YAxis dataKey="y" name="Branch D" unit="%" tick={{fontSize:10,fontFamily:T.mono}}/>
              <Tooltip formatter={v=>`${(v).toFixed(3)}%`}/>
              <Scatter data={ENTITIES.map(e=>({x:+(e.pdA*100).toFixed(3),y:+(e.pdD*100).toFixed(3),sector:e.sector}))} fillOpacity={0.7} fill={T.navy}/>
            </ScatterChart>
          </ResponsiveContainer></>)}
      </div>
      {card(<>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <SH title="PD Register — 4-branch comparison" sub={null}/>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{marginLeft:"auto",fontSize:12,padding:"4px 8px",borderRadius:4,border:"1px solid #e2e8f0",fontFamily:T.mono}}>
            <option value="pdBlended">Sort: Blended</option><option value="pdA">Branch A</option><option value="pdB">Branch B</option><option value="pdC">Branch C</option><option value="pdD">Branch D</option>
          </select>
        </div>
        <div style={{maxHeight:340,overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead style={{position:"sticky",top:0,background:T.cream}}><tr>
              {["Entity","Sector","ESG Band","PD Base","A Exp","B Merton","C Tabular","D Multi","Blended"].map(h=><th key={h} style={{padding:"5px 8px",textAlign:"left",color:T.navy,fontWeight:700,borderBottom:`2px solid ${T.gold}`,fontFamily:T.mono,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>{sorted.map((e,i)=>(
              <tr key={e.id} style={{background:i%2===0?"#fff":T.cream}}>
                <td style={{padding:"5px 8px",fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy}}>{e.name}</td>
                <td style={{padding:"5px 8px",fontSize:11,color:T.slate}}>{e.sector}</td>
                <td style={{padding:"5px 8px"}}>{pill(esgBand(e.esgScore),bandColor(esgBand(e.esgScore)))}</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,fontSize:11}}>{(e.pdBase*100).toFixed(3)}%</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:pdColor(e.pdA)}}>{(e.pdA*100).toFixed(3)}%</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:pdColor(e.pdB)}}>{(e.pdB*100).toFixed(3)}%</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:pdColor(e.pdC)}}>{(e.pdC*100).toFixed(3)}%</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,color:pdColor(e.pdD)}}>{(e.pdD*100).toFixed(3)}%</td>
                <td style={{padding:"5px 8px",fontFamily:T.mono,fontWeight:700,color:pdColor(e.pdBlended)}}>{(e.pdBlended*100).toFixed(3)}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ── Tab 2: Sector Coefficients ──────────────────────────────────────────── */
const SectorCoeff = () => (
  <div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
      {card(<><SH title="Sector α (Transition) Coefficients" sub="Used in Branch A & D — higher α = greater transition risk sensitivity"/>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={SECTORS.map(s=>({sector:s.split(" ")[0],alpha:SECTOR_COEFFICIENTS[s].alpha,beta:SECTOR_COEFFICIENTS[s].beta}))} margin={{bottom:20}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey="sector" tick={{fontSize:9,fontFamily:T.mono}} angle={-30} textAnchor="end" interval={0}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}}/><Tooltip/><Legend/>
            <Bar dataKey="alpha" name="α (transition)" fill={T.amber}/><Bar dataKey="beta" name="β (physical)" fill={T.teal}/>
          </BarChart>
        </ResponsiveContainer></>)}
      {card(<><SH title="Stranded Asset Risk vs Carbon Sensitivity" sub="Sector-level exposure from SECTOR_COEFFICIENTS"/>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={SECTORS.map(s=>({sector:s.split(" ")[0],stranded:SECTOR_COEFFICIENTS[s].strandedRisk,carbon:SECTOR_COEFFICIENTS[s].carbonSens}))} margin={{bottom:20}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey="sector" tick={{fontSize:9,fontFamily:T.mono}} angle={-30} textAnchor="end" interval={0}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}}/><Tooltip/><Legend/>
            <Bar dataKey="stranded" name="Stranded Risk" fill={T.red}/><Bar dataKey="carbon" name="Carbon Sensitivity" fill={T.purple}/>
          </BarChart>
        </ResponsiveContainer></>)}
    </div>
    {card(<><SH title="Full Sector Coefficient Table" sub="From dme_pd_engine.py SECTOR_COEFFICIENTS"/>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{background:T.cream}}>
          {["Sector","α Transition","β Physical","γ Social/Gov","Carbon Sens","Stranded Risk"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",fontWeight:700,color:T.navy,borderBottom:`2px solid ${T.gold}`,fontFamily:T.mono,fontSize:11}}>{h}</th>)}
        </tr></thead>
        <tbody>{SECTORS.map((s,i)=>{const c=SECTOR_COEFFICIENTS[s];return(
          <tr key={i} style={{background:i%2===0?"#fff":T.cream}}>
            <td style={{padding:"6px 10px",fontWeight:700,color:T.navy}}>{s}</td>
            <td style={{padding:"6px 10px",fontFamily:T.mono,color:c.alpha>0.3?T.red:T.amber}}>{c.alpha}</td>
            <td style={{padding:"6px 10px",fontFamily:T.mono,color:c.beta>0.25?T.amber:T.slate}}>{c.beta}</td>
            <td style={{padding:"6px 10px",fontFamily:T.mono,color:T.slate}}>{c.gamma}</td>
            <td style={{padding:"6px 10px",fontFamily:T.mono,color:c.carbonSens>0.6?T.red:T.amber}}>{c.carbonSens}</td>
            <td style={{padding:"6px 10px",fontFamily:T.mono,color:c.strandedRisk>0.5?T.red:T.amber}}>{c.strandedRisk}</td>
          </tr>
        )})}</tbody>
      </table></>)}
  </div>
);

/* ── Tab 3: Branch Deep-Dive ─────────────────────────────────────────────── */
const BranchDeepDive = () => (
  <div>
    {[
      {branch:"A — Exponential (Real-time)",formula:"PD = PD_base × exp(α × v_transition)",use:"Real-time monitoring, intraday risk",color:T.blue,note:"v_transition from DME velocity; α from sector coefficients"},
      {branch:"B — Merton Distance-to-Default (IFRS 9)",formula:"DD = [ln(S/K) + (−½σ²)T] / σ√T  →  PD = N(−d₂)  (with stranded-asset haircut on S)",use:"IFRS 9 ECL staging, credit portfolio",color:T.teal,note:"S = asset value × (1 − stranded_haircut); Abramowitz-Stegun N(·)"},
      {branch:"C — Tabular ESG Band Multipliers",formula:"PD = PD_base × multiplier(ESG_band)\n  low(<70): ×1.05 | medium(50-70): ×1.30\n  high(30-50): ×2.00 | severe(<30): ×3.25",use:"Fallback, quick ESG-bucketed estimate",color:T.amber,note:"Band assigned from ESG score; no velocity required"},
      {branch:"D — Multi-Factor Portfolio",formula:"PD = PD_base × exp(α×v_T + β×v_P + γ×v_SG)",use:"Portfolio aggregation, stress testing",color:T.purple,note:"Three DME velocity channels: transition + physical + social/gov"},
    ].map((b,i)=>card(
      <><div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
          <div style={{width:3,height:40,background:b.color,borderRadius:2,flexShrink:0}}/>
          <div><div style={{fontWeight:700,fontSize:13,color:T.navy,marginBottom:2}}>{b.branch}</div>
            <div style={{fontSize:11,color:T.slate}}>{b.use}</div></div>
        </div>
        <div style={{fontFamily:T.mono,fontSize:12,color:T.blue,background:T.cream,borderRadius:6,padding:"8px 12px",marginBottom:8,whiteSpace:"pre-wrap"}}>{b.formula}</div>
        <div style={{fontSize:11,color:T.slate}}>{b.note}</div></>,
      {marginBottom:12}
    ))}
  </div>
);

/* ── Page Shell ──────────────────────────────────────────────────────────── */
const TABS=[{key:"pd",label:"PD Comparison"},{key:"coeff",label:"Sector Coefficients"},{key:"branches",label:"Branch Reference"}];
export default function DmePdEnginePage() {
  const [tab,setTab]=useState("pd");
  return (
    <div style={{fontFamily:T.font,background:T.cream,minHeight:"100vh",padding:24}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.navy}}>DME PD Engine — 4-Branch</h1>
          {pill("EP-BE2",T.navy)}{pill("DME",T.purple)}
        </div>
        <div style={{fontSize:13,color:T.slate}}>Branch A Exponential · B Merton DD · C Tabular · D Multi-Factor · sector coefficients · 40 entities</div>
      </div>
      <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`2px solid ${T.gold}`}}>
        {TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"8px 20px",background:tab===t.key?T.navy:"transparent",color:tab===t.key?"#fff":T.slate,border:"none",cursor:"pointer",fontSize:13,fontFamily:T.font,fontWeight:tab===t.key?700:400,borderBottom:tab===t.key?`2px solid ${T.gold}`:"none",marginBottom:tab===t.key?-2:0,transition:"all 0.15s"}}>{t.label}</button>)}
      </div>
      {tab==="pd"       &&<PdComparison/>}
      {tab==="coeff"    &&<SectorCoeff/>}
      {tab==="branches" &&<BranchDeepDive/>}
    </div>
  );
}
