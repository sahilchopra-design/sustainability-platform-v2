/**
 * EP-BD1 — Greenium Alpha Signal Engine
 * Sprint BD | Quantitative ESG & Portfolio Intelligence
 *
 * 5-model ensemble (M1 Momentum/Value 25%, M2 Vol-Adjusted Sharpe 30%,
 * RSI Mean Reversion 20%, Volume Confirmation 10%, ESG Boost 15%).
 * BUY / SELL / NEUTRAL signals with risk-checked position sizing.
 */
import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
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
};

/* ── Seeded random ──────────────────────────────────────────────────────────── */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const pick = (arr, s) => arr[Math.floor(sr(s) * arr.length)];

/* ── Engine constants (mirrors greenium_signal_engine.py) ───────────────────── */
const MODEL_WEIGHTS = [
  { model: "M1 Momentum / Value",      weight: 0.25, color: T.navy   },
  { model: "M2 Vol-Adjusted Sharpe",   weight: 0.30, color: T.blue   },
  { model: "RSI Mean Reversion",       weight: 0.20, color: T.teal   },
  { model: "Volume Confirmation",      weight: 0.10, color: T.gold   },
  { model: "ESG Boost",                weight: 0.15, color: T.green  },
];

const MAX_POSITION_PCT = 5.0;
const STOP_LOSS_PCT    = 8.0;
const MAX_SECTOR_CONC  = 25.0;

const SECTORS = ["Clean Energy","EV / Mobility","Green Buildings","Water","Circular Economy","Biodiversity","Climate Tech","Agri-Tech"];

/* ── Simulate price history ─────────────────────────────────────────────────── */
const genPrices = (n, seed, base = 100) => {
  const prices = [base];
  for (let i = 1; i < n; i++) {
    const drift = (sr(seed + i) - 0.48) * 0.03;
    prices.push(+(prices[i-1] * (1 + drift)).toFixed(2));
  }
  return prices;
};

/* ── Feature computation (mirrors compute_features) ────────────────────────── */
const computeFeatures = (prices) => {
  const n = prices.length;
  if (n < 60) return null;
  const ret1  = prices[n-1] / prices[n-2]  - 1;
  const ret5  = prices[n-1] / prices[n-6]  - 1;
  const ret20 = prices[n-1] / prices[n-21] - 1;
  const rets20 = Array.from({length:20},(_,i)=>prices[n-20+i]/prices[n-21+i]-1);
  const vol20 = Math.sqrt(rets20.reduce((s,r)=>s+r*r,0)/20);
  // RSI-14
  const gains=[],losses=[];
  for(let i=n-14;i<n;i++){const d=prices[i]-prices[i-1];gains.push(Math.max(0,d));losses.push(Math.max(0,-d));}
  const ag=gains.reduce((s,v)=>s+v,0)/14, al=losses.reduce((s,v)=>s+v,0)/14;
  const rsi = al===0 ? 100 : 100 - 100/(1+ag/al);
  const ma20 = prices.slice(-20).reduce((s,v)=>s+v,0)/20;
  const ma50 = prices.slice(-50).reduce((s,v)=>s+v,0)/50;
  return { ret1, ret5, ret20, vol20, rsi: +rsi.toFixed(1), ma20: +ma20.toFixed(2), ma50: +ma50.toFixed(2), last: prices[n-1] };
};

/* ── Signal generation ─────────────────────────────────────────────────────── */
const generateSignal = (feat, esgScore) => {
  if (!feat) return { signal: "NEUTRAL", score: 0, confidence: 0 };
  // M1: momentum + value
  const m1 = (feat.ret20 > 0.05 ? 0.6 : feat.ret20 < -0.05 ? -0.6 : feat.ret20 * 8) * 0.25;
  // M2: vol-adjusted sharpe proxy
  const sharpe = feat.vol20 > 0 ? feat.ret20 / feat.vol20 : 0;
  const m2 = Math.max(-1, Math.min(1, sharpe * 2)) * 0.30;
  // RSI mean reversion
  const rsiSignal = feat.rsi < 30 ? 0.8 : feat.rsi > 70 ? -0.8 : (50 - feat.rsi) / 50;
  const m3 = rsiSignal * 0.20;
  // Volume (proxy: ma ratio)
  const maRatio = feat.ma20 / feat.ma50;
  const m4 = (maRatio > 1.02 ? 0.5 : maRatio < 0.98 ? -0.5 : 0) * 0.10;
  // ESG boost
  const m5 = ((esgScore - 50) / 50) * 0.15;
  const composite = m1 + m2 + m3 + m4 + m5;
  const signal = composite > 0.15 ? "BUY" : composite < -0.15 ? "SELL" : "NEUTRAL";
  const confidence = Math.min(1, Math.abs(composite) / 0.4);
  return { signal, score: +composite.toFixed(3), m1:+m1.toFixed(3), m2:+m2.toFixed(3), m3:+m3.toFixed(3), m4:+m4.toFixed(3), m5:+m5.toFixed(3), confidence: +confidence.toFixed(2) };
};

/* ── Universe ───────────────────────────────────────────────────────────────── */
const genUniverse = (n) => Array.from({length:n},(_,i)=>{
  const prices  = genPrices(90, i * 7, 50 + sr(i*11)*200);
  const volumes = Array.from({length:90},(_,j)=>Math.round(100000+sr((i*7+j)*3)*900000));
  const feat    = computeFeatures(prices);
  const esg     = Math.round(30 + sr(i*17)*65);
  const sig     = generateSignal(feat, esg);
  const posSize = sig.signal === "NEUTRAL" ? 0 : +(Math.min(MAX_POSITION_PCT, Math.abs(sig.score)*20)).toFixed(2);
  return {
    id: i+1,
    ticker: `GRN${String(i+1).padStart(3,"0")}`,
    name: `${pick(SECTORS,i*13).split(" ")[0]}-ETF-${String(i+1).padStart(2,"0")}`,
    sector: pick(SECTORS, i*13),
    prices, volumes, feat,
    esgScore: esg,
    ...sig,
    positionSize: posSize,
    stopLoss: feat ? +(feat.last * (1 - STOP_LOSS_PCT/100)).toFixed(2) : 0,
    greenPremium: +(sr(i*23)*0.8 - 0.1).toFixed(3),  // greenium spread vs brown equiv
  };
});

const UNIVERSE = genUniverse(40);

/* ── 12-month signal backtest ───────────────────────────────────────────────── */
const BACKTEST = Array.from({length:52},(_,i)=>({
  week: `W${String(i+1).padStart(2,"0")}`,
  cumReturn:   +(i * 0.42 + (sr(i*3)-0.45)*3).toFixed(2),
  benchmark:   +(i * 0.28 + (sr(i*7)-0.48)*2).toFixed(2),
  signals:     Math.round(3+sr(i*11)*12),
  winRate:     +(0.52+sr(i*13)*0.2).toFixed(2),
}));

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const pill = (label, bg, fg="#fff") => (
  <span style={{background:bg,color:fg,borderRadius:4,padding:"2px 7px",fontSize:11,fontFamily:T.mono,fontWeight:600}}>{label}</span>
);
const card = (children, style={}) => (
  <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:20,...style}}>{children}</div>
);
const SH = ({title,sub}) => (
  <div style={{marginBottom:14}}>
    <div style={{fontWeight:700,fontSize:15,color:T.navy}}>{title}</div>
    {sub&&<div style={{fontSize:12,color:T.slate,marginTop:2}}>{sub}</div>}
  </div>
);
const sigColor = s => s==="BUY"?T.green:s==="SELL"?T.red:T.slate;

/* ── Tab 1: Signal Dashboard ────────────────────────────────────────────────── */
const SignalDashboard = () => {
  const [sectorF, setSectorF] = useState("All");
  const [sigF,    setSigF   ] = useState("All");

  const filtered = useMemo(()=>{
    let d = UNIVERSE;
    if(sectorF!=="All") d=d.filter(x=>x.sector===sectorF);
    if(sigF!=="All")    d=d.filter(x=>x.signal===sigF);
    return [...d].sort((a,b)=>Math.abs(b.score)-Math.abs(a.score));
  },[sectorF,sigF]);

  const counts = {BUY:UNIVERSE.filter(x=>x.signal==="BUY").length, SELL:UNIVERSE.filter(x=>x.signal==="SELL").length, NEUTRAL:UNIVERSE.filter(x=>x.signal==="NEUTRAL").length};
  const avgEsg = (UNIVERSE.reduce((s,x)=>s+x.esgScore,0)/UNIVERSE.length).toFixed(1);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[
          {label:"BUY signals",  value:counts.BUY,     color:T.green},
          {label:"SELL signals", value:counts.SELL,    color:T.red},
          {label:"NEUTRAL",      value:counts.NEUTRAL, color:T.slate},
          {label:"Avg ESG Score",value:avgEsg,         color:T.blue},
        ].map(m=>card(
          <><div style={{fontSize:11,color:T.slate,marginBottom:6}}>{m.label}</div>
          <div style={{fontSize:24,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div></>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {card(<>
          <SH title="Ensemble Score Distribution" sub="Composite signal score by ticker (sorted)" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={[...UNIVERSE].sort((a,b)=>b.score-a.score).map(x=>({ticker:x.ticker.slice(-3),score:x.score}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="ticker" tick={{fontSize:8,fontFamily:T.mono}} interval={3}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} domain={[-0.4,0.4]}/>
              <Tooltip formatter={v=>[v,"Score"]}/>
              <ReferenceLine y={0.15}  stroke={T.green} strokeDasharray="3 2" label={{value:"BUY",fill:T.green,fontSize:10}}/>
              <ReferenceLine y={-0.15} stroke={T.red}   strokeDasharray="3 2" label={{value:"SELL",fill:T.red,fontSize:10}}/>
              <Bar dataKey="score" name="Ensemble Score" radius={[3,3,0,0]}>
                {[...UNIVERSE].sort((a,b)=>b.score-a.score).map((d,i)=><Cell key={i} fill={sigColor(d.signal)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Greenium Spread by Sector" sub="Green bond premium (bps) vs brown equivalent" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={SECTORS.map((s,i)=>({sector:s.split(" ")[0],prem:+(sr(i*7)*0.7-0.05).toFixed(3)*100}))} margin={{bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="sector" tick={{fontSize:9,fontFamily:T.mono}} angle={-30} textAnchor="end" interval={0}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} unit="bp"/>
              <Tooltip formatter={v=>`${v.toFixed(0)} bp`}/>
              <ReferenceLine y={0} stroke={T.slate}/>
              <Bar dataKey="prem" name="Greenium (bp)" radius={[3,3,0,0]}>
                {SECTORS.map((_,i)=><Cell key={i} fill={sr(i*7)*0.7-0.05>0?T.green:T.red}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
      </div>

      {card(<>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <SH title="Signal Register — 40 instruments" sub={null}/>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <select value={sectorF} onChange={e=>setSectorF(e.target.value)} style={{fontSize:12,padding:"4px 8px",borderRadius:4,border:"1px solid #e2e8f0",fontFamily:T.mono}}>
              <option>All</option>{SECTORS.map(s=><option key={s}>{s}</option>)}
            </select>
            <select value={sigF} onChange={e=>setSigF(e.target.value)} style={{fontSize:12,padding:"4px 8px",borderRadius:4,border:"1px solid #e2e8f0",fontFamily:T.mono}}>
              <option>All</option><option>BUY</option><option>SELL</option><option>NEUTRAL</option>
            </select>
          </div>
        </div>
        <div style={{maxHeight:360,overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead style={{position:"sticky",top:0,background:T.cream}}>
              <tr>{["Ticker","Name","Sector","Signal","Score","Confidence","RSI","Ret 20d","Vol 20d","ESG","Pos Size %","Stop Loss"].map(h=>(
                <th key={h} style={{padding:"6px 8px",textAlign:"left",color:T.navy,fontWeight:700,borderBottom:`2px solid ${T.gold}`,fontFamily:T.mono,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((s,i)=>(
                <tr key={s.id} style={{background:i%2===0?"#fff":T.cream}}>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,fontWeight:700,color:T.navy,fontSize:11}}>{s.ticker}</td>
                  <td style={{padding:"5px 8px",fontSize:11,color:T.slate}}>{s.name}</td>
                  <td style={{padding:"5px 8px",fontSize:11,color:T.slate}}>{s.sector.split(" ")[0]}</td>
                  <td style={{padding:"5px 8px"}}>{pill(s.signal,sigColor(s.signal))}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,color:sigColor(s.signal),fontWeight:700}}>{s.score>0?"+":""}{s.score}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono}}>{(s.confidence*100).toFixed(0)}%</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,color:s.feat?.rsi<30?T.green:s.feat?.rsi>70?T.red:T.navy}}>{s.feat?.rsi??"-"}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,color:s.feat?.ret20>0?T.green:T.red}}>{s.feat?`${(s.feat.ret20*100).toFixed(1)}%`:"-"}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,color:T.slate}}>{s.feat?`${(s.feat.vol20*100).toFixed(2)}%`:"-"}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,color:s.esgScore>70?T.green:s.esgScore>45?T.amber:T.red}}>{s.esgScore}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,color:T.blue,fontWeight:600}}>{s.positionSize>0?`${s.positionSize}%`:"—"}</td>
                  <td style={{padding:"5px 8px",fontFamily:T.mono,color:T.red,fontSize:11}}>{s.stopLoss>0?`$${s.stopLoss}`:"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ── Tab 2: Model Decomposition ─────────────────────────────────────────────── */
const ModelDecomposition = () => {
  const [selected, setSelected] = useState(0);
  const inst = UNIVERSE[selected];

  const decomp = inst ? [
    {model:"M1 Momentum/Value",  contrib:inst.m1, weight:"25%", color:T.navy},
    {model:"M2 Vol-Adj Sharpe",  contrib:inst.m2, weight:"30%", color:T.blue},
    {model:"RSI Mean Reversion", contrib:inst.m3, weight:"20%", color:T.teal},
    {model:"Volume Confirm",     contrib:inst.m4, weight:"10%", color:T.gold,"0":""},
    {model:"ESG Boost",          contrib:inst.m5, weight:"15%", color:T.green},
  ] : [];

  const priceChart = inst ? inst.prices.slice(-30).map((p,i)=>({i,price:p})) : [];

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {UNIVERSE.slice(0,10).map((u,i)=>(
          <button key={i} onClick={()=>setSelected(i)} style={{
            padding:"5px 14px",borderRadius:4,border:`1px solid ${selected===i?sigColor(u.signal):"#e2e8f0"}`,
            background:selected===i?sigColor(u.signal):"#fff",color:selected===i?"#fff":T.slate,
            fontSize:12,cursor:"pointer",fontFamily:T.mono,fontWeight:selected===i?700:400
          }}>{u.ticker}</button>
        ))}
      </div>

      {inst && <>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
          {[
            {label:"Signal",    value:inst.signal,                color:sigColor(inst.signal)},
            {label:"Score",     value:`${inst.score>0?"+":""}${inst.score}`, color:sigColor(inst.signal)},
            {label:"Confidence",value:`${(inst.confidence*100).toFixed(0)}%`, color:T.blue},
            {label:"ESG Score", value:inst.esgScore,              color:T.green},
            {label:"Pos Size",  value:inst.positionSize>0?`${inst.positionSize}%`:"—", color:T.navy},
          ].map(m=>card(<>
            <div style={{fontSize:11,color:T.slate,marginBottom:4}}>{m.label}</div>
            <div style={{fontSize:18,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div>
          </>))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          {card(<>
            <SH title={`Model Contribution — ${inst.ticker}`} sub="Per-model signed contribution to ensemble score"/>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={decomp} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} domain={[-0.15,0.15]}/>
                <YAxis dataKey="model" type="category" tick={{fontSize:10,fontFamily:T.mono}} width={130}/>
                <Tooltip formatter={v=>[v.toFixed(4),"Contribution"]}/>
                <ReferenceLine x={0} stroke={T.slate}/>
                <Bar dataKey="contrib" name="Contribution" radius={[0,4,4,0]}>
                  {decomp.map((d,i)=><Cell key={i} fill={d.contrib>=0?T.green:T.red}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>)}
          {card(<>
            <SH title={`Price History (30d) — ${inst.ticker}`} sub={`Last: $${inst.feat?.last} | MA20: $${inst.feat?.ma20} | MA50: $${inst.feat?.ma50}`}/>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={priceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="i" tick={{fontSize:9,fontFamily:T.mono}}/>
                <YAxis tick={{fontSize:10,fontFamily:T.mono}} domain={["auto","auto"]}/>
                <Tooltip formatter={v=>`$${v}`}/>
                <ReferenceLine y={inst.feat?.ma20} stroke={T.gold}  strokeDasharray="3 2" label={{value:"MA20",fill:T.gold,fontSize:9}}/>
                <ReferenceLine y={inst.feat?.ma50} stroke={T.slate} strokeDasharray="3 2" label={{value:"MA50",fill:T.slate,fontSize:9}}/>
                <Line dataKey="price" stroke={sigColor(inst.signal)} strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </>)}
        </div>

        {card(<>
          <SH title="Model Weight Reference" sub="5-model ensemble — production weights from greenium_signal_engine.py"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
            {MODEL_WEIGHTS.map((m,i)=>(
              <div key={i} style={{background:T.cream,borderRadius:6,padding:"12px 14px",borderLeft:`4px solid ${m.color}`}}>
                <div style={{fontSize:11,color:T.slate,marginBottom:4}}>{m.model}</div>
                <div style={{fontSize:20,fontWeight:700,color:m.color,fontFamily:T.mono}}>{(m.weight*100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </>)}
      </>}
    </div>
  );
};

/* ── Tab 3: Backtest ────────────────────────────────────────────────────────── */
const Backtest = () => {
  const finalReturn    = BACKTEST[BACKTEST.length-1].cumReturn;
  const finalBench     = BACKTEST[BACKTEST.length-1].benchmark;
  const alpha          = +(finalReturn - finalBench).toFixed(2);
  const avgWinRate     = +(BACKTEST.reduce((s,w)=>s+w.winRate,0)/BACKTEST.length*100).toFixed(1);
  const totalSignals   = BACKTEST.reduce((s,w)=>s+w.signals,0);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[
          {label:"Cumulative Return (52w)", value:`+${finalReturn}%`, color:T.green},
          {label:"Benchmark Return",        value:`+${finalBench}%`,  color:T.slate},
          {label:"Alpha Generated",         value:`+${alpha}%`,       color:T.gold},
          {label:"Avg Weekly Win Rate",     value:`${avgWinRate}%`,   color:T.blue},
        ].map(m=>card(
          <><div style={{fontSize:11,color:T.slate,marginBottom:6}}>{m.label}</div>
          <div style={{fontSize:22,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div></>
        ))}
      </div>

      {card(<>
        <SH title="52-Week Cumulative Return — Strategy vs Benchmark" sub={`${totalSignals} total signals · Max position ${MAX_POSITION_PCT}% · Stop-loss ${STOP_LOSS_PCT}%`}/>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={BACKTEST}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
            <XAxis dataKey="week" tick={{fontSize:9,fontFamily:T.mono}} interval={7}/>
            <YAxis tick={{fontSize:10,fontFamily:T.mono}} unit="%"/>
            <Tooltip formatter={v=>`+${v}%`}/>
            <Legend/>
            <Area dataKey="cumReturn"  name="Greenium Strategy" stroke={T.green}  fill={T.green}  fillOpacity={0.15} strokeWidth={2}/>
            <Area dataKey="benchmark"  name="Benchmark (MSCI)" stroke={T.slate}  fill={T.slate}  fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2"/>
          </AreaChart>
        </ResponsiveContainer>
      </>,{marginBottom:20})}

      {card(<>
        <SH title="Weekly Signal Count & Win Rate" sub="Signal frequency and accuracy over backtest period"/>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={BACKTEST.filter((_,i)=>i%4===0)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
            <XAxis dataKey="week" tick={{fontSize:10,fontFamily:T.mono}}/>
            <YAxis yAxisId="left"  tick={{fontSize:10,fontFamily:T.mono}}/>
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fontFamily:T.mono}} unit="%"/>
            <Tooltip/>
            <Legend/>
            <Bar  yAxisId="left"  dataKey="signals"  name="# Signals"   fill={T.navy}/>
            <Line yAxisId="right" dataKey="winRate"   name="Win Rate"    stroke={T.gold} strokeWidth={2} dot={false} type="monotone"/>
          </BarChart>
        </ResponsiveContainer>
      </>)}
    </div>
  );
};

/* ── Tab 4: Risk Controls ───────────────────────────────────────────────────── */
const RiskControls = () => {
  const sectorExposure = SECTORS.map(s=>{
    const inSector = UNIVERSE.filter(x=>x.sector===s&&x.signal==="BUY");
    const totalPos  = inSector.reduce((sum,x)=>sum+x.positionSize,0);
    return {sector:s.split(" ")[0], exposure:+totalPos.toFixed(2), count:inSector.length, breached:totalPos>MAX_SECTOR_CONC};
  }).filter(s=>s.count>0);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[
          {label:"Max Position Size",       value:`${MAX_POSITION_PCT}%`,   color:T.navy},
          {label:"Stop-Loss Trigger",       value:`${STOP_LOSS_PCT}%`,      color:T.red},
          {label:"Max Sector Concentration",value:`${MAX_SECTOR_CONC}%`,    color:T.amber},
          {label:"Active BUY Positions",    value:UNIVERSE.filter(x=>x.signal==="BUY").length, color:T.green},
        ].map(m=>card(
          <><div style={{fontSize:11,color:T.slate,marginBottom:6}}>{m.label}</div>
          <div style={{fontSize:22,fontWeight:700,color:m.color,fontFamily:T.mono}}>{m.value}</div></>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {card(<>
          <SH title="Sector Concentration — BUY Positions" sub={`Limit: ${MAX_SECTOR_CONC}% per sector`}/>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sectorExposure} margin={{bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="sector" tick={{fontSize:9,fontFamily:T.mono}} angle={-30} textAnchor="end" interval={0}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} unit="%"/>
              <Tooltip unit="%"/>
              <ReferenceLine y={MAX_SECTOR_CONC} stroke={T.red} strokeDasharray="3 2" label={{value:"Limit",fill:T.red,fontSize:10}}/>
              <Bar dataKey="exposure" name="Sector Exposure %" radius={[4,4,0,0]}>
                {sectorExposure.map((d,i)=><Cell key={i} fill={d.breached?T.red:T.green}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Position Size vs Signal Score" sub="Risk-adjusted sizing relative to ensemble conviction"/>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="score" name="Signal Score" tick={{fontSize:10,fontFamily:T.mono}} domain={[-0.4,0.4]}/>
              <YAxis dataKey="positionSize" name="Position %" unit="%" tick={{fontSize:10,fontFamily:T.mono}}/>
              <Tooltip formatter={(v,n)=>n==="Signal Score"?v:`${v}%`}/>
              <Scatter data={UNIVERSE.filter(x=>x.signal!=="NEUTRAL").map(x=>({score:x.score,positionSize:x.positionSize,signal:x.signal}))} fillOpacity={0.7}>
                {UNIVERSE.filter(x=>x.signal!=="NEUTRAL").map((d,i)=><Cell key={i} fill={sigColor(d.signal)}/>)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </>)}
      </div>

      {card(<>
        <SH title="Risk Parameters — Engine Reference" sub="From greenium_signal_engine.py production config"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {label:"Max position per instrument", value:`${MAX_POSITION_PCT}%`, note:"GPR-based sizing, hard cap"},
            {label:"Stop-loss trigger",            value:`${STOP_LOSS_PCT}%`,   note:"Below entry price"},
            {label:"Max sector concentration",    value:`${MAX_SECTOR_CONC}%`, note:"Sum of BUY positions"},
            {label:"Max daily signals",            value:"50",                  note:"Circuit breaker"},
            {label:"BUY threshold",                value:"> +0.15",             note:"Composite ensemble score"},
            {label:"SELL threshold",               value:"< −0.15",             note:"Composite ensemble score"},
          ].map((p,i)=>(
            <div key={i} style={{background:T.cream,borderRadius:6,padding:"10px 14px"}}>
              <div style={{fontSize:11,color:T.slate,marginBottom:4}}>{p.label}</div>
              <div style={{fontSize:17,fontWeight:700,color:T.navy,fontFamily:T.mono,marginBottom:4}}>{p.value}</div>
              <div style={{fontSize:11,color:T.slate}}>{p.note}</div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
};

/* ── Page Shell ──────────────────────────────────────────────────────────── */
const TABS = [
  {key:"signals",  label:"Signal Dashboard"},
  {key:"model",    label:"Model Decomposition"},
  {key:"backtest", label:"Backtest (52w)"},
  {key:"risk",     label:"Risk Controls"},
];

export default function GreeniumSignalPage() {
  const [tab, setTab] = useState("signals");
  return (
    <div style={{fontFamily:T.font,background:T.cream,minHeight:"100vh",padding:24}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.navy}}>Greenium Alpha Signal Engine</h1>
          {pill("EP-BD1",T.navy)}{pill("Quant ESG",T.green)}
        </div>
        <div style={{fontSize:13,color:T.slate}}>
          40 instruments · 5-model ensemble · BUY/SELL/NEUTRAL · greenium spread · 52-week backtest · risk controls
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
      {tab==="signals"  && <SignalDashboard/>}
      {tab==="model"    && <ModelDecomposition/>}
      {tab==="backtest" && <Backtest/>}
      {tab==="risk"     && <RiskControls/>}
    </div>
  );
}
