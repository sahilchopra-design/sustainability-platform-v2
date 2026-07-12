import React, { useState, useMemo } from 'react';
import {

  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg:'#f4f6f9', surface:'#ffffff', border:'#e3e8ef', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ---- Historical input data (deterministic quarterly series per entity) ----
// This is the only "raw" data in the module. Everything downstream (weak-learner
// forecasts, ensemble prediction, confidence interval, RMSE/MAE/R2) is computed
// FROM this series with real formulas -- nothing below is a hard-coded output.
const ENTITY_NAMES = ['JPMorgan','Shell','Microsoft','HSBC','TotalEnergies','Unilever','Allianz','Enel','Siemens','BNP','BP','Nestle','BlackRock','NextEra','Tesla'];
const QUARTERS = ['2023-Q1','2023-Q2','2023-Q3','2023-Q4','2024-Q1','2024-Q2','2024-Q3','2024-Q4','2025-Q1','2025-Q2','2025-Q3','2025-Q4'];
const HISTORY_LEN = QUARTERS.length; // 12 observed quarters
const MIN_HISTORY = 4; // minimum points required before a walk-forward forecast is evaluated

const HISTORY = ENTITY_NAMES.map((entity, e) => {
  const base = 55 + (sr(e * 23) * 2 - 1) * 20;
  const drift = (sr(e * 77) * 2 - 1) * 1.5;
  const hist = [];
  for (let t = 0; t < HISTORY_LEN; t++) {
    const noise = (sr(e * 131 + t * 7) * 2 - 1) * 4;
    hist.push(Math.round((base + drift * t + noise) * 10) / 10);
  }
  return { entity, hist };
});

// ---- Weak learners: each is fit only on the historical series it is given ----
function linearForecast(series) {
  const n = series.length;
  if (n < 2) return series[n - 1] ?? 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let x = 0; x < n; x++) {
    const y = series[x];
    sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  const b = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const a = (sumY - b * sumX) / n;
  return a + b * n; // OLS trend line, extrapolated one step past the series
}

function movingAverageForecast(series, window = 3) {
  const w = Math.min(window, series.length);
  const slice = series.slice(series.length - w);
  return slice.reduce((s, v) => s + v, 0) / w;
}

function nearestNeighborForecast(series) {
  const n = series.length;
  if (n < 2) return series[n - 1] ?? 0;
  const last = series[n - 1];
  let bestIdx = -1, bestDist = Infinity;
  for (let i = 0; i < n - 1; i++) {
    const d = Math.abs(series[i] - last);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  // Reuse whatever value historically followed the closest analog level.
  return bestIdx >= 0 && bestIdx + 1 <= n - 1 ? series[bestIdx + 1] : last;
}

function weakLearnerForecasts(series) {
  return {
    linear: linearForecast(series),
    movAvg: movingAverageForecast(series),
    nn: nearestNeighborForecast(series),
  };
}

function ensembleForecast(learners, w) {
  const sum = w.linear + w.movAvg + w.nn || 1;
  return (learners.linear * w.linear + learners.movAvg * w.movAvg + learners.nn * w.nn) / sum;
}

// Walk-forward backtest: at every quarter t >= MIN_HISTORY, each learner is fit only on
// the history available strictly before t, then compared to the actual value at t.
// No future data leaks into any forecast (no look-ahead bias).
function runBacktest(weights) {
  const rows = [];
  HISTORY.forEach(({ entity, hist }) => {
    for (let t = MIN_HISTORY; t < hist.length; t++) {
      const series = hist.slice(0, t);
      const learners = weakLearnerForecasts(series);
      rows.push({
        quarterIdx: t,
        entity,
        actual: hist[t],
        linear: learners.linear,
        movAvg: learners.movAvg,
        nn: learners.nn,
        ensemble: ensembleForecast(learners, weights),
      });
    }
  });
  return rows;
}

function computeMetrics(rows, key) {
  const n = rows.length;
  if (!n) return { rmse: 0, mae: 0, r2: 0, n: 0 };
  const meanActual = rows.reduce((s, r) => s + r.actual, 0) / n;
  let sqErr = 0, absErr = 0, ssTot = 0;
  rows.forEach(r => {
    const e = r.actual - r[key];
    sqErr += e * e;
    absErr += Math.abs(e);
    ssTot += (r.actual - meanActual) ** 2;
  });
  return {
    rmse: Math.round(Math.sqrt(sqErr / n) * 100) / 100,
    mae: Math.round((absErr / n) * 100) / 100,
    r2: ssTot > 0 ? Math.round((1 - sqErr / ssTot) * 1000) / 1000 : 0,
    n,
  };
}

// Candidate weight combinations for the grid-search table. Each row's RMSE is computed
// live from the walk-forward backtest above -- not a hard-coded number.
const WEIGHT_CANDIDATES = [
  { linear:0.5, movAvg:0.3, nn:0.2 }, { linear:0.4, movAvg:0.3, nn:0.3 }, { linear:0.4, movAvg:0.4, nn:0.2 },
  { linear:0.3, movAvg:0.4, nn:0.3 }, { linear:0.5, movAvg:0.2, nn:0.3 }, { linear:0.34, movAvg:0.33, nn:0.33 },
  { linear:0.6, movAvg:0.2, nn:0.2 }, { linear:0.2, movAvg:0.5, nn:0.3 }, { linear:0.4, movAvg:0.2, nn:0.4 },
];

const TABS = ['Ensemble Dashboard','Model Comparison','Weight Optimization','Prediction Results','Backtest','Deployment'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function EnsemblePredictionEnginePage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState([]);
  const [rawWeights, setRawWeights] = useState({ linear:1/3, movAvg:1/3, nn:1/3 });

  const handleWeightChange = (key, value) => setRawWeights(w => ({ ...w, [key]: Number(value) }));

  const weights = useMemo(() => {
    const sum = rawWeights.linear + rawWeights.movAvg + rawWeights.nn || 1;
    return { linear: rawWeights.linear / sum, movAvg: rawWeights.movAvg / sum, nn: rawWeights.nn / sum };
  }, [rawWeights]);

  const backtestRows = useMemo(() => runBacktest(weights), [weights]);
  const linearMetrics = useMemo(() => computeMetrics(backtestRows, 'linear'), [backtestRows]);
  const movAvgMetrics = useMemo(() => computeMetrics(backtestRows, 'movAvg'), [backtestRows]);
  const nnMetrics = useMemo(() => computeMetrics(backtestRows, 'nn'), [backtestRows]);
  const ensembleMetrics = useMemo(() => computeMetrics(backtestRows, 'ensemble'), [backtestRows]);

  const MODELS = useMemo(() => [
    { id:'LIN', name:'Linear Regression', desc:'OLS trend fit over the observed quarterly history, extrapolated one step forward.', weight:weights.linear, color:T.green, ...linearMetrics },
    { id:'MA', name:'Moving Average', desc:'Mean of the most recent 3 observed quarters.', weight:weights.movAvg, color:T.blue, ...movAvgMetrics },
    { id:'NN', name:'Nearest Neighbor', desc:'Finds the closest historical analog level and reuses whatever value followed it.', weight:weights.nn, color:T.purple, ...nnMetrics },
  ], [weights, linearMetrics, movAvgMetrics, nnMetrics]);

  const gridResults = useMemo(() => WEIGHT_CANDIDATES.map(c => ({
    ...c, rmse: computeMetrics(runBacktest(c), 'ensemble').rmse,
  })).sort((a,b) => a.rmse - b.rmse), []);
  const bestGrid = gridResults[0];

  const PREDICTIONS = useMemo(() => HISTORY.map(({ entity, hist }) => {
    const learners = weakLearnerForecasts(hist);
    const current = hist[hist.length - 1];
    const predicted = ensembleForecast(learners, weights);
    const spreadLow = Math.min(learners.linear, learners.movAvg, learners.nn);
    const spreadHigh = Math.max(learners.linear, learners.movAvg, learners.nn);
    const relSpread = current !== 0 ? (spreadHigh - spreadLow) / Math.abs(current) : 0;
    const confidence = Math.max(50, Math.min(99, Math.round(100 - relSpread * 200)));
    return {
      entity,
      current: Math.round(current),
      predicted: Math.round(predicted * 10) / 10,
      ciLow: Math.round(spreadLow * 10) / 10,
      ciHigh: Math.round(spreadHigh * 10) / 10,
      confidence,
    };
  }), [weights]);

  const perQuarterBacktest = useMemo(() => {
    const out = [];
    for (let t = MIN_HISTORY; t < HISTORY_LEN; t++) {
      const rowsAtT = backtestRows.filter(r => r.quarterIdx === t);
      const m = computeMetrics(rowsAtT, 'ensemble');
      out.push({ q: QUARTERS[t], rmse: m.rmse, r2: m.r2 });
    }
    return out;
  }, [backtestRows]);

  const equalWeightMetrics = useMemo(() => computeMetrics(runBacktest({ linear:1/3, movAvg:1/3, nn:1/3 }), 'ensemble'), []);
  const optimizedMetrics = useMemo(() => computeMetrics(runBacktest(bestGrid), 'ensemble'), [bestGrid]);

  const comparisonData = useMemo(() => ['RMSE','MAE','R-squared'].map(metric => {
    const row = { metric };
    MODELS.forEach(m => { row[m.name] = metric==='RMSE'?m.rmse:metric==='MAE'?m.mae:m.r2; });
    row['Ensemble'] = metric==='RMSE'?ensembleMetrics.rmse:metric==='MAE'?ensembleMetrics.mae:ensembleMetrics.r2;
    return row;
  }), [MODELS, ensembleMetrics]);

  const renderDashboard = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.gold}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.gold}}>{ensembleMetrics.rmse}</div>
          <div style={{fontSize:12,color:T.textSec}}>Ensemble RMSE</div>
        </Card>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.green}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.green}}>{ensembleMetrics.r2}</div>
          <div style={{fontSize:12,color:T.textSec}}>Ensemble R-squared</div>
        </Card>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.blue}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.blue}}>{ensembleMetrics.mae}</div>
          <div style={{fontSize:12,color:T.textSec}}>Ensemble MAE</div>
        </Card>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.navy}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.navy}}>3</div>
          <div style={{fontSize:12,color:T.textSec}}>Weak Learners</div>
        </Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {MODELS.map(m => (
          <Card key={m.id} style={{borderLeft:`3px solid ${m.color}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontWeight:600,fontSize:14,color:T.navy}}>{m.name}</div>
              <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:m.color}}>w={m.weight.toFixed(2)}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[['RMSE',m.rmse],['MAE',m.mae],['R2',m.r2]].map(([l,v]) => (
                <div key={l}><div style={{fontSize:10,color:T.textMut}}>{l}</div><div style={{fontFamily:T.mono,fontWeight:600,fontSize:14,color:T.navy}}>{v}</div></div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderComparison = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Weak Learner Performance Comparison (walk-forward backtest)</div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={comparisonData}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="metric" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          {MODELS.map(m => <Bar key={m.id} dataKey={m.name} fill={m.color} radius={[4,4,0,0]} />)}
          <Bar dataKey="Ensemble" fill={T.gold} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderWeightOpt = () => (
    <div>
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Manual Weight Tuning</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
          {[['linear','Linear Regression'],['movAvg','Moving Average'],['nn','Nearest Neighbor']].map(([key,label]) => (
            <div key={key}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:T.textSec,marginBottom:4}}>
                <span>{label}</span><span style={{fontFamily:T.mono,fontWeight:600,color:T.navy}}>{weights[key].toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={rawWeights[key]} onChange={e=>handleWeightChange(key,e.target.value)} style={{width:'100%'}} />
            </div>
          ))}
        </div>
        <div style={{marginTop:12,fontSize:11,color:T.textMut}}>Weights are renormalized to sum to 1. Live ensemble RMSE at the current weights: <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy}}>{ensembleMetrics.rmse}</span> (n={ensembleMetrics.n} backtested observations).</div>
      </Card>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Weight Grid Search Results (computed from walk-forward backtest)</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            {['Linear Regression','Moving Average','Nearest Neighbor','Ensemble RMSE','Rank'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 12px',color:T.textSec,fontWeight:600}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {gridResults.map((w,i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:i===0?`${T.green}06`:'transparent'}}>
                <td style={{padding:'8px 12px',fontFamily:T.mono}}>{w.linear}</td>
                <td style={{padding:'8px 12px',fontFamily:T.mono}}>{w.movAvg}</td>
                <td style={{padding:'8px 12px',fontFamily:T.mono}}>{w.nn}</td>
                <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:700,color:i===0?T.green:T.navy}}>{w.rmse}</td>
                <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:i===0?700:400,color:i===0?T.green:T.textMut}}>#{i+1}{i===0?' (Best)':''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:12,padding:10,background:`${T.green}08`,borderRadius:6,fontSize:11,color:T.textSec}}>
          Optimal weights: Linear Regression {bestGrid.linear}, Moving Average {bestGrid.movAvg}, Nearest Neighbor {bestGrid.nn} (RMSE {bestGrid.rmse}). Grid search evaluated {gridResults.length} weight combinations against a {backtestRows.length}-observation walk-forward backtest across {ENTITY_NAMES.length} entities and {HISTORY_LEN - MIN_HISTORY} quarters per entity.
        </div>
      </Card>
    </div>
  );

  const renderPredictions = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Next-Quarter Predictions with Confidence Intervals</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
          {['Entity','Current','Predicted','CI Low','CI High','Confidence','Action'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',color:T.textSec,fontWeight:600}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {PREDICTIONS.map(p => {
            const delta = p.predicted - p.current;
            return (
              <tr key={p.entity} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px 10px',fontWeight:500,color:T.navy}}>{p.entity}</td>
                <td style={{padding:'6px 10px',fontFamily:T.mono}}>{p.current}</td>
                <td style={{padding:'6px 10px',fontFamily:T.mono,fontWeight:600,color:delta>0?T.green:T.red}}>{p.predicted} ({delta>0?'+':''}{delta.toFixed(1)})</td>
                <td style={{padding:'6px 10px',fontFamily:T.mono,color:T.textMut}}>{p.ciLow}</td>
                <td style={{padding:'6px 10px',fontFamily:T.mono,color:T.textMut}}>{p.ciHigh}</td>
                <td style={{padding:'6px 10px'}}><span style={{fontFamily:T.mono,fontWeight:600,color:p.confidence>=85?T.green:p.confidence>=75?T.amber:T.red}}>{p.confidence}%</span></td>
                <td style={{padding:'6px 10px'}}><button onClick={()=>setWatchlist(w=>w.includes(p.entity)?w.filter(x=>x!==p.entity):[...w,p.entity])} style={{padding:'3px 10px',borderRadius:4,border:`1px solid ${watchlist.includes(p.entity)?T.gold:T.border}`,background:watchlist.includes(p.entity)?`${T.gold}15`:'transparent',fontSize:10,cursor:'pointer',color:watchlist.includes(p.entity)?T.gold:T.textMut}}>{watchlist.includes(p.entity)?'Watching':'Watch'}</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{fontSize:11,color:T.textMut,marginTop:8}}>CI Low/High is the min/max spread across the three weak learners' raw outputs for each entity (not a fitted distribution).</div>
    </Card>
  );

  const renderBacktest = () => {
    const firstQ = perQuarterBacktest[0];
    const lastQ = perQuarterBacktest[perQuarterBacktest.length - 1];
    return (
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Walk-Forward Backtest (expanding window, no look-ahead)</div>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={perQuarterBacktest}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}} />
            <YAxis yAxisId="left" tick={{fontSize:11,fill:T.textSec}} />
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:11,fill:T.textSec}} />
            <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="rmse" name="RMSE" stroke={T.red} strokeWidth={2} dot={{r:3}} />
            <Line yAxisId="right" type="monotone" dataKey="r2" name="R-squared" stroke={T.green} strokeWidth={2} dot={{r:3}} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{fontSize:11,color:T.textMut,marginTop:8}}>
          Each point forecasts one quarter using only data observed before it. RMSE moved from {firstQ.rmse} ({firstQ.q}) to {lastQ.rmse} ({lastQ.q}); R-squared moved from {firstQ.r2} to {lastQ.r2}, across {ENTITY_NAMES.length} entities x {perQuarterBacktest.length} evaluated quarters ({backtestRows.length} total forecast/actual pairs).
        </div>
      </Card>
    );
  };

  const renderDeployment = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16}}>
        {MODELS.map(m => (
          <Card key={m.id} style={{borderLeft:`3px solid ${m.color}`}}>
            <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{m.name}</div>
            <div style={{fontSize:11,color:T.textSec,margin:'6px 0'}}>{m.desc}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
              <div><div style={{fontSize:10,color:T.textMut}}>Weight</div><div style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>{m.weight.toFixed(2)}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Backtest Obs</div><div style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>{m.n}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>RMSE</div><div style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>{m.rmse}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>R-squared</div><div style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>{m.r2}</div></div>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Equal-Weight vs. Grid-Search-Optimized Weight Comparison</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{padding:12,border:`1px solid ${T.border}`,borderRadius:8}}>
            <div style={{fontSize:11,color:T.textMut}}>Equal Weights (0.33 / 0.33 / 0.33)</div>
            <div style={{fontFamily:T.mono,fontWeight:600,fontSize:14,color:T.navy}}>RMSE {equalWeightMetrics.rmse}</div>
            <div style={{fontSize:11,color:T.textSec}}>n={equalWeightMetrics.n}</div>
          </div>
          <div style={{padding:12,border:`1px solid ${T.green}`,borderRadius:8,background:`${T.green}06`}}>
            <div style={{fontSize:11,color:T.textMut}}>Grid-Search Optimized Weights</div>
            <div style={{fontFamily:T.mono,fontWeight:600,fontSize:14,color:T.green}}>RMSE {optimizedMetrics.rmse}</div>
            <div style={{fontSize:11,color:T.textSec}}>n={optimizedMetrics.n}</div>
          </div>
        </div>
        <div style={{marginTop:10,fontSize:11,color:T.textMut}}>Both figures come from the identical walk-forward backtest above; only the weight vector applied to the three weak learners differs.</div>
      </Card>
    </div>
  );

  const panels = [renderDashboard, renderComparison, renderWeightOpt, renderPredictions, renderBacktest, renderDeployment];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CX2" label="Ensemble Prediction Engine" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>Ensemble Prediction Engine</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>Linear Regression / Moving Average / Nearest-Neighbor ensemble, weighted and backtested against each entity's observed quarterly history</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Ensemble RMSE" value={ensembleMetrics.rmse} sub="walk-forward backtest" />
            <KPI label="R-squared" value={ensembleMetrics.r2} sub="out-of-sample" color={T.green} />
            <KPI label="MAE" value={ensembleMetrics.mae} sub="out-of-sample" color={T.gold} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Model Methodology</div>
          <div style={{fontSize:11,color:T.textSec}}>Ensemble is a weighted average of three deterministic weak learners: (1) Linear Regression -- an OLS trend fit over each entity's observed quarterly history, (2) Moving Average -- the mean of the trailing 3 quarters, and (3) Nearest Neighbor -- the value that historically followed the closest analog level in that entity's own history. Weights are user-adjustable (Weight Optimization tab) and renormalized to sum to 1. The prediction interval (CI Low/High) is the min/max spread across the three learners' raw outputs for each entity, not a fitted distribution. RMSE/MAE/R-squared are computed from a walk-forward backtest: starting at {QUARTERS[MIN_HISTORY]}, each learner is fit only on the history available before that quarter and compared against the actual observed value, so no future data leaks into any forecast.</div>
        </div>
      </div>
    </div>
  );
}
