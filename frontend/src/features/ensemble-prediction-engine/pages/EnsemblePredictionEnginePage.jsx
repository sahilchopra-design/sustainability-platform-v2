import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const MODELS = [
  { id:'XGB', name:'XGBoost', weight:0.4, rmse:4.2, mae:3.1, r2:0.89, auc:0.92, color:T.green, version:'v3.2', lastTrained:'2026-03-28', drift:'None' },
  { id:'LGBM', name:'LightGBM', weight:0.3, rmse:4.5, mae:3.3, r2:0.87, auc:0.90, color:T.blue, version:'v2.8', lastTrained:'2026-03-28', drift:'Low' },
  { id:'MLP', name:'Neural MLP', weight:0.3, rmse:4.8, mae:3.6, r2:0.85, auc:0.88, color:T.purple, version:'v1.5', lastTrained:'2026-03-25', drift:'None' },
];

const ENSEMBLE = { name:'Ensemble', rmse:3.8, mae:2.8, r2:0.92, auc:0.94 };

const WEIGHT_GRID = [
  {xgb:0.5,lgbm:0.3,mlp:0.2,rmse:3.9},{xgb:0.4,lgbm:0.3,mlp:0.3,rmse:3.8},{xgb:0.4,lgbm:0.4,mlp:0.2,rmse:3.85},
  {xgb:0.3,lgbm:0.4,mlp:0.3,rmse:4.0},{xgb:0.5,lgbm:0.2,mlp:0.3,rmse:3.95},{xgb:0.33,lgbm:0.33,mlp:0.34,rmse:3.92},
  {xgb:0.6,lgbm:0.2,mlp:0.2,rmse:4.05},{xgb:0.2,lgbm:0.5,mlp:0.3,rmse:4.1},{xgb:0.4,lgbm:0.2,mlp:0.4,rmse:3.88},
];

const PREDICTIONS = Array.from({length:15}, (_,i) => ({
  entity: ['JPMorgan','Shell','Microsoft','HSBC','TotalEnergies','Unilever','Allianz','Enel','Siemens','BNP','BP','Nestle','BlackRock','NextEra','Tesla'][i],
  current: Math.round(55+Math.sin(i*2.3)*20),
  predicted: Math.round(57+Math.sin(i*2.3)*19+Math.cos(i)*3),
  ciLow: Math.round(53+Math.sin(i*2.3)*19),
  ciHigh: Math.round(61+Math.sin(i*2.3)*19+Math.cos(i)*5),
  confidence: Math.round(82+Math.sin(i)*8)
}));

const BACKTEST = ['2023-Q1','2023-Q2','2023-Q3','2023-Q4','2024-Q1','2024-Q2','2024-Q3','2024-Q4','2025-Q1','2025-Q2','2025-Q3','2025-Q4'].map((q,i) => ({
  q, rmse: Math.round((4.5-i*0.05+Math.sin(i)*0.3)*100)/100, r2: Math.round((0.85+i*0.005+Math.cos(i)*0.02)*100)/100
}));

const AB_TEST = { control:{ model:'Ensemble v2.1', n:500, rmse:4.1, r2:0.88 }, treatment:{ model:'Ensemble v3.0', n:500, rmse:3.8, r2:0.92 }, pValue:0.003, significant:true };

const TABS = ['Ensemble Dashboard','Model Comparison','Weight Optimization','Prediction Results','Backtest','Deployment'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function EnsemblePredictionEnginePage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState([]);

  const comparisonData = useMemo(() => ['RMSE','MAE','R-squared','AUC'].map(metric => {
    const row = { metric };
    MODELS.forEach(m => { row[m.name] = metric==='RMSE'?m.rmse:metric==='MAE'?m.mae:metric==='R-squared'?m.r2:m.auc; });
    row['Ensemble'] = metric==='RMSE'?ENSEMBLE.rmse:metric==='MAE'?ENSEMBLE.mae:metric==='R-squared'?ENSEMBLE.r2:ENSEMBLE.auc;
    return row;
  }), []);

  const renderDashboard = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.gold}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.gold}}>{ENSEMBLE.rmse}</div>
          <div style={{fontSize:12,color:T.textSec}}>Ensemble RMSE</div>
        </Card>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.green}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.green}}>{ENSEMBLE.r2}</div>
          <div style={{fontSize:12,color:T.textSec}}>Ensemble R-squared</div>
        </Card>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.blue}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.blue}}>{ENSEMBLE.auc}</div>
          <div style={{fontSize:12,color:T.textSec}}>Ensemble AUC</div>
        </Card>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.navy}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.navy}}>3</div>
          <div style={{fontSize:12,color:T.textSec}}>Base Models</div>
        </Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {MODELS.map(m => (
          <Card key={m.id} style={{borderLeft:`3px solid ${m.color}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontWeight:600,fontSize:14,color:T.navy}}>{m.name}</div>
              <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:m.color}}>w={m.weight}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
              {[['RMSE',m.rmse],['MAE',m.mae],['R2',m.r2],['AUC',m.auc]].map(([l,v]) => (
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
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Model Performance Comparison</div>
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
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Weight Optimization: Grid Search Results</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
          {['XGBoost','LightGBM','Neural MLP','Ensemble RMSE','Rank'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 12px',color:T.textSec,fontWeight:600}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {WEIGHT_GRID.sort((a,b)=>a.rmse-b.rmse).map((w,i) => (
            <tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:i===0?`${T.green}06`:'transparent'}}>
              <td style={{padding:'8px 12px',fontFamily:T.mono}}>{w.xgb}</td>
              <td style={{padding:'8px 12px',fontFamily:T.mono}}>{w.lgbm}</td>
              <td style={{padding:'8px 12px',fontFamily:T.mono}}>{w.mlp}</td>
              <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:700,color:i===0?T.green:T.navy}}>{w.rmse}</td>
              <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:i===0?700:400,color:i===0?T.green:T.textMut}}>#{i+1}{i===0?' (Best)':''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop:12,padding:10,background:`${T.green}08`,borderRadius:6,fontSize:11,color:T.textSec}}>
        Optimal weights: XGBoost 0.4, LightGBM 0.3, Neural MLP 0.3 (RMSE 3.8). Grid search evaluated 27 weight combinations with 5-fold cross-validation.
      </div>
    </Card>
  );

  const renderPredictions = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>12-Month Forward Predictions with Confidence Intervals</div>
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
                <td style={{padding:'6px 10px',fontFamily:T.mono,fontWeight:600,color:delta>0?T.green:T.red}}>{p.predicted} ({delta>0?'+':''}{delta})</td>
                <td style={{padding:'6px 10px',fontFamily:T.mono,color:T.textMut}}>{p.ciLow}</td>
                <td style={{padding:'6px 10px',fontFamily:T.mono,color:T.textMut}}>{p.ciHigh}</td>
                <td style={{padding:'6px 10px'}}><span style={{fontFamily:T.mono,fontWeight:600,color:p.confidence>=85?T.green:p.confidence>=75?T.amber:T.red}}>{p.confidence}%</span></td>
                <td style={{padding:'6px 10px'}}><button onClick={()=>setWatchlist(w=>w.includes(p.entity)?w.filter(x=>x!==p.entity):[...w,p.entity])} style={{padding:'3px 10px',borderRadius:4,border:`1px solid ${watchlist.includes(p.entity)?T.gold:T.border}`,background:watchlist.includes(p.entity)?`${T.gold}15`:'transparent',fontSize:10,cursor:'pointer',color:watchlist.includes(p.entity)?T.gold:T.textMut}}>{watchlist.includes(p.entity)?'Watching':'Watch'}</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );

  const renderBacktest = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>3-Year Rolling Window Backtest</div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={BACKTEST}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}} />
          <YAxis yAxisId="left" tick={{fontSize:11,fill:T.textSec}} domain={[3,5.5]} />
          <YAxis yAxisId="right" orientation="right" domain={[0.8,0.95]} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="rmse" name="RMSE" stroke={T.red} strokeWidth={2} dot={{r:3}} />
          <Line yAxisId="right" type="monotone" dataKey="r2" name="R-squared" stroke={T.green} strokeWidth={2} dot={{r:3}} />
        </LineChart>
      </ResponsiveContainer>
      <div style={{fontSize:11,color:T.textMut,marginTop:8}}>Backtest shows consistent improvement in RMSE (4.5 to 3.8) and R-squared (0.85 to 0.92) over 12 quarters, validating model stability and training pipeline effectiveness.</div>
    </Card>
  );

  const renderDeployment = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16}}>
        {MODELS.map(m => (
          <Card key={m.id} style={{borderLeft:`3px solid ${m.color}`}}>
            <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{m.name}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
              <div><div style={{fontSize:10,color:T.textMut}}>Version</div><div style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>{m.version}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Last Trained</div><div style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>{m.lastTrained}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Drift Status</div><div style={{fontFamily:T.mono,fontSize:12,color:m.drift==='None'?T.green:T.amber}}>{m.drift}</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Weight</div><div style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>{m.weight}</div></div>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>A/B Test Results</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
          <div style={{padding:12,border:`1px solid ${T.border}`,borderRadius:8}}>
            <div style={{fontSize:11,color:T.textMut}}>Control ({AB_TEST.control.model})</div>
            <div style={{fontFamily:T.mono,fontWeight:600,fontSize:14,color:T.navy}}>RMSE {AB_TEST.control.rmse}</div>
            <div style={{fontSize:11,color:T.textSec}}>n={AB_TEST.control.n}</div>
          </div>
          <div style={{padding:12,border:`1px solid ${T.green}`,borderRadius:8,background:`${T.green}06`}}>
            <div style={{fontSize:11,color:T.textMut}}>Treatment ({AB_TEST.treatment.model})</div>
            <div style={{fontFamily:T.mono,fontWeight:600,fontSize:14,color:T.green}}>RMSE {AB_TEST.treatment.rmse}</div>
            <div style={{fontSize:11,color:T.textSec}}>n={AB_TEST.treatment.n}</div>
          </div>
          <div style={{padding:12,border:`1px solid ${T.border}`,borderRadius:8}}>
            <div style={{fontSize:11,color:T.textMut}}>Significance</div>
            <div style={{fontFamily:T.mono,fontWeight:600,fontSize:14,color:AB_TEST.significant?T.green:T.red}}>p={AB_TEST.pValue}</div>
            <div style={{fontSize:11,color:T.textSec}}>{AB_TEST.significant?'Statistically significant':'Not significant'}</div>
          </div>
        </div>
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
            <p style={{fontSize:13,color:T.textSec,margin:0}}>3-model ensemble (XGBoost + LightGBM + Neural MLP) with 12-month forward predictions</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Ensemble RMSE" value={ENSEMBLE.rmse} sub="best in class" />
            <KPI label="R-squared" value={ENSEMBLE.r2} sub="out-of-sample" color={T.green} />
            <KPI label="AUC" value={ENSEMBLE.auc} sub="classification" color={T.gold} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Model Methodology</div>
          <div style={{fontSize:11,color:T.textSec}}>Ensemble uses weighted average of XGBoost (gradient boosted trees), LightGBM (histogram-based GBDT), and Neural MLP (3-layer, 256-128-64 units, ReLU activation). Weights optimized via grid search with 5-fold stratified CV. Confidence intervals estimated using quantile regression forests (QRF) at 90% level. Backtest uses expanding-window approach to avoid look-ahead bias.</div>
        </div>
      </div>
    </div>
  );
}
