import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Legend, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', teal: '#0f766e', red: '#991b1b', green: '#065f46', gray: '#6b7280' };

const FEATURES = [
  'carbon_intensity','flood_risk_score','sector_transition_risk','heat_stress_score',
  'drought_risk','esg_score','revenue_growth','wacc','pd_baseline','lgd_baseline',
  'wildfire_risk','hurricane_risk','lat','lon','asset_age','debt_ratio',
  'capex_intensity','policy_risk_score','market_cap','operating_margin'
];

const QUANTILE_OPTIONS = [5, 10, 25, 50, 75, 90, 95];
const DEFAULT_QUANTILES = new Set([5, 25, 50, 75, 95]);

const TASKS = ['Physical Risk Score','PD Prediction','Stranding Probability','ESG Score'];

const SECTORS = ['Energy','Utilities','Materials','Industrials','Financials','Real Estate','Technology','Healthcare'];
const REGIONS = ['North America','Europe','Asia-Pacific'];

const MODEL_REGISTRY_DATA = Array.from({ length: 5 }, (_, i) => ({
  name: `xgb_climate_risk_v${i + 1}`,
  version: `1.${i}`,
  task: i % 2 === 0 ? 'Physical Risk Score' : 'PD Prediction',
  trained: `2026-0${i + 1}-${10 + i < 10 ? '0' : ''}${10 + i}`,
  mae: (0.12 - i * 0.008 + sr(i * 11) * 0.005).toFixed(4),
  rmse: (0.16 - i * 0.009 + sr(i * 13) * 0.006).toFixed(4),
  status: i === 4 ? 'Active' : i === 3 ? 'Staging' : 'Deprecated',
}));

const AUDIT_LOG = Array.from({ length: 10 }, (_, i) => {
  const actions = ['TRAIN','PREDICT','EVALUATE','REGISTER','DEPLOY'];
  const users = ['analyst@rm.io','quant@rm.io','risk@rm.io'];
  const d = new Date(2026, 2, 25 + Math.floor(i / 3), 9 + i, (i * 7) % 60);
  return {
    ts: d.toISOString().slice(0, 16).replace('T', ' '),
    user: users[i % users.length],
    action: actions[i % actions.length],
    model: `xgb_climate_risk_v${5 - Math.floor(i / 2)}`,
  };
});

const Slider = ({ label, min, max, step, value, onChange, format }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.navy, marginBottom: 3 }}>
      <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.gold }}>
        {format ? format(value) : value}
      </span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: T.gold }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.gray }}>
      <span>{format ? format(min) : min}</span><span>{format ? format(max) : max}</span>
    </div>
  </div>
);

const Badge = ({ label, status }) => {
  const colors = { Active: T.green, Staging: '#b45309', Deprecated: T.gray, Training: '#b45309' };
  return (
    <span style={{
      background: colors[status] || T.gray, color: '#fff', fontSize: 10, fontWeight: 700,
      padding: '2px 7px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1
    }}>{label || status}</span>
  );
};

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.navy : T.gray,
        borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

export default function MLRiskScorerPage() {
  const [tab, setTab] = useState('Config & Training');
  const [params, setParams] = useState({
    modelName: 'xgb_climate_risk_v1', task: TASKS[0],
    nEstimators: 500, maxDepth: 6, learningRate: 0.05,
    subsample: 0.8, colsampleBytree: 0.8, minChildWeight: 3, trainSplit: 80,
  });
  const [quantiles, setQuantiles] = useState(DEFAULT_QUANTILES);
  const [training, setTraining] = useState({ status: 'idle', progress: 0, fold: 1, lossHistory: [] });
  const [predDataset, setPredDataset] = useState('Q1 2026 Portfolio');

  const lossDataFull = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    epoch: (i + 1) * 25,
    trainLoss: +(0.45 * Math.exp(-0.15 * i) + sr(i * 3) * 0.02).toFixed(4),
    valLoss: +(0.48 * Math.exp(-0.13 * i) + sr(i * 7 + 1) * 0.025).toFixed(4),
  })), []);

  const trainModel = useCallback(() => {
    setTraining({ status: 'training', progress: 0, fold: 1, lossHistory: [] });
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setTraining(prev => ({
        ...prev,
        progress: Math.min(100, step * 5),
        fold: Math.min(5, Math.ceil(step / 4)),
        lossHistory: lossDataFull.slice(0, Math.max(1, Math.floor(step * 0.4))),
      }));
      if (step >= 20) {
        clearInterval(interval);
        setTraining({ status: 'complete', progress: 100, fold: 5, lossHistory: lossDataFull });
      }
    }, 100);
  }, [lossDataFull]);

  const toggleQuantile = (q) => {
    setQuantiles(prev => {
      const n = new Set(prev);
      n.has(q) ? n.delete(q) : n.add(q);
      return n;
    });
  };

  const importanceData = useMemo(() => {
    const raw = FEATURES.map((f, i) => ({ feature: f, value: sr(i * 17 + 3) }));
    const total = Math.max(1e-10, raw.reduce((a, b) => a + b.value, 0)); // floor prevents NaN if all feature importances are 0
    return raw.map(d => ({ ...d, value: +(d.value / total).toFixed(4) }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const shapData = useMemo(() => importanceData.slice(0, 10).flatMap((f, fi) =>
    Array.from({ length: 30 }, (_, i) => ({
      featureIdx: fi,
      shapValue: (sr(fi * 7 + i) - 0.5) * f.value * 12,
      featureValue: sr(fi * 3 + i + 2),
    }))
  ), [importanceData]);

  const predictions = useMemo(() => Array.from({ length: 50 }, (_, i) => {
    const actual = +(0.3 + sr(i * 19) * 0.6).toFixed(3);
    const p50 = +(actual + (sr(i * 23 + 1) - 0.5) * 0.08).toFixed(3);
    const p5  = +Math.max(0, p50 - 0.15 - sr(i * 5)  * 0.05).toFixed(3); // clamp: risk scores ∈ [0,1]
    const p25 = +Math.max(0, p50 - 0.07 - sr(i * 7)  * 0.03).toFixed(3);
    const p75 = +Math.min(1, p50 + 0.07 + sr(i * 11) * 0.03).toFixed(3);
    const p95 = +Math.min(1, p50 + 0.15 + sr(i * 13) * 0.05).toFixed(3);
    return { id: `AST-${1000 + i}`, actual, p5, p25, p50, p75, p95, covered: actual >= p5 && actual <= p95 };
  }), []);

  const coverageRate = +(predictions.filter(p => p.covered).length / predictions.length * 100).toFixed(1);

  const calibrationData = useMemo(() => [5, 25, 50, 75, 95].map(q => ({
    expected: q / 100,
    actual: +(q / 100 + (sr(q) - 0.5) * 0.04).toFixed(3),
  })), []);

  const modelHash = useMemo(() => Array.from({ length: 8 }, (_, i) =>
    Math.floor(sr(i * 31 + 7) * 16).toString(16)).join(''), []);

  const sectorPerf = useMemo(() => SECTORS.map((s, i) => ({
    sector: s, mae: +(0.08 + sr(i * 17 + 5) * 0.04).toFixed(4), rmse: +(0.11 + sr(i * 13 + 3) * 0.05).toFixed(4),
  })), []);
  const regionPerf = useMemo(() => REGIONS.map((r, i) => ({
    region: r, mae: +(0.075 + sr(i * 29 + 11) * 0.035).toFixed(4), rmse: +(0.105 + sr(i * 23 + 7) * 0.04).toFixed(4),
  })), []);

  const card = (children, style = {}) => (
    <div style={{ background: '#fff', border: `1px solid #e8e4db`, borderRadius: 8, padding: 18, marginBottom: 16, ...style }}>
      {children}
    </div>
  );

  const sectionTitle = (t) => (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
      color: T.navy, fontFamily: 'JetBrains Mono, monospace', marginBottom: 12, paddingBottom: 6,
      borderBottom: `1px solid ${T.gold}` }}>{t}</div>
  );

  return (
    <div style={{ background: T.cream, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ background: T.navy, color: T.gold, fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>EP-BL1</span>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>XGBoost Climate Risk Scoring Engine</div>
          <div style={{ fontSize: 13, color: T.gray }}>Quantile regression · Physical risk · PD prediction · Stranding probability</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Badge label="XGBoost 2.0" status="Active" />
          <Badge label="Quantile Regression" status="Staging" />
        </div>
      </div>

      <TabBar tabs={['Config & Training', 'Feature Importance & SHAP', 'Predictions & Validation', 'Model Governance']}
        active={tab} onSelect={setTab} />

      {/* TAB 1 */}
      {tab === 'Config & Training' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
          {/* LEFT — Hyperparameters */}
          <div style={{ background: '#f9f7f3', border: `1px solid #e8e4db`, borderRadius: 8, padding: 20 }}>
            {sectionTitle('Hyperparameter Configuration')}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>Model Name</label>
              <input value={params.modelName} onChange={e => setParams(p => ({ ...p, modelName: e.target.value }))}
                style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: '6px 10px',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 12, background: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>Task</label>
              <select value={params.task} onChange={e => setParams(p => ({ ...p, task: e.target.value }))}
                style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: '6px 10px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12, background: '#fff' }}>
                {TASKS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: T.navy, marginBottom: 6 }}>Quantiles</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {QUANTILE_OPTIONS.map(q => (
                  <label key={q} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                    fontSize: 12, color: quantiles.has(q) ? T.navy : T.gray }}>
                    <input type="checkbox" checked={quantiles.has(q)} onChange={() => toggleQuantile(q)}
                      style={{ accentColor: T.gold }} />
                    P{q}
                  </label>
                ))}
              </div>
            </div>
            <Slider label="n_estimators" min={100} max={2000} step={50} value={params.nEstimators}
              onChange={v => setParams(p => ({ ...p, nEstimators: v }))} />
            <Slider label="max_depth" min={3} max={12} step={1} value={params.maxDepth}
              onChange={v => setParams(p => ({ ...p, maxDepth: v }))} />
            <Slider label="learning_rate" min={0.01} max={0.3} step={0.01} value={params.learningRate}
              onChange={v => setParams(p => ({ ...p, learningRate: v }))} format={v => v.toFixed(2)} />
            <Slider label="subsample" min={0.5} max={1.0} step={0.05} value={params.subsample}
              onChange={v => setParams(p => ({ ...p, subsample: v }))} format={v => v.toFixed(2)} />
            <Slider label="colsample_bytree" min={0.5} max={1.0} step={0.05} value={params.colsampleBytree}
              onChange={v => setParams(p => ({ ...p, colsampleBytree: v }))} format={v => v.toFixed(2)} />
            <Slider label="min_child_weight" min={1} max={10} step={1} value={params.minChildWeight}
              onChange={v => setParams(p => ({ ...p, minChildWeight: v }))} />
            <Slider label="Training Split (%)" min={60} max={85} step={5} value={params.trainSplit}
              onChange={v => setParams(p => ({ ...p, trainSplit: v }))} format={v => `${v}%`} />
            <button onClick={trainModel} disabled={training.status === 'training'}
              style={{
                width: '100%', padding: '12px 0', marginTop: 8, background: T.navy, color: T.gold,
                border: 'none', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700,
                cursor: training.status === 'training' ? 'not-allowed' : 'pointer', letterSpacing: 1.5,
                opacity: training.status === 'training' ? 0.7 : 1,
              }}>
              {training.status === 'training' ? 'TRAINING...' : 'TRAIN MODEL'}
            </button>
          </div>

          {/* RIGHT — Training status */}
          <div>
            {card(
              <>
                {sectionTitle('Training Status')}
                {training.status === 'idle' && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: T.gray, fontSize: 14 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⚙</div>
                    Model not trained — configure parameters and click TRAIN MODEL
                  </div>
                )}
                {training.status === 'training' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#b45309',
                        animation: 'pulse 1s infinite' }} />
                      <span style={{ fontSize: 13, color: '#b45309', fontWeight: 600 }}>
                        Training fold {training.fold}/5...
                      </span>
                    </div>
                    <div style={{ background: '#e8e4db', borderRadius: 4, height: 10, marginBottom: 6 }}>
                      <div style={{ width: `${training.progress}%`, height: '100%', background: T.gold,
                        borderRadius: 4, transition: 'width 0.1s ease' }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.gray, marginBottom: 16, textAlign: 'right' }}>
                      {training.progress.toFixed(0)}% complete
                    </div>
                    {training.lossHistory.length > 1 && (
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={training.lossHistory} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                          <XAxis dataKey="epoch" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="trainLoss" stroke={T.navy} strokeWidth={2} dot={false} name="Train Loss" />
                          <Line type="monotone" dataKey="valLoss" stroke={T.gold} strokeWidth={2} dot={false} name="Val Loss" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </>
                )}
                {training.status === 'complete' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span style={{ background: T.green, color: '#fff', fontSize: 11, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 4, letterSpacing: 1 }}>✓ TRAINED</span>
                      <span style={{ fontSize: 12, color: T.gray }}>Model hash:&nbsp;
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.navy }}>{modelHash}</span>
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                      {[
                        { label: 'MAE (P50)', value: '0.0823' },
                        { label: 'RMSE', value: '0.1142' },
                        { label: 'Pinball (P25)', value: '0.0314' },
                        { label: 'Pinball (P75)', value: '0.0291' },
                        { label: 'Calibration Err', value: '2.3%' },
                        { label: 'Training Time', value: '1.8s' },
                      ].map(m => (
                        <div key={m.label} style={{ background: '#f9f7f3', borderRadius: 6, padding: '10px 12px',
                          border: `1px solid #e8e4db` }}>
                          <div style={{ fontSize: 10, color: T.gray, marginBottom: 3 }}>{m.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: T.navy,
                            fontFamily: 'JetBrains Mono, monospace' }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={training.lossHistory} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                        <XAxis dataKey="epoch" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="trainLoss" stroke={T.navy} strokeWidth={2} dot={false} name="Train Loss" />
                        <Line type="monotone" dataKey="valLoss" stroke={T.gold} strokeWidth={2} dot={false} name="Val Loss" />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {tab === 'Feature Importance & SHAP' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {card(
            <>
              {sectionTitle('Feature Importance (XGBoost Gain)')}
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={importanceData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 140 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => (v * 100).toFixed(1) + '%'} />
                  <YAxis dataKey="feature" type="category" tick={{ fontSize: 10 }} width={135} />
                  <Tooltip formatter={v => [(v * 100).toFixed(2) + '%', 'Importance']} contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="value" fill={T.gold} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>, {}
          )}
          {card(
            <>
              {sectionTitle('SHAP Beeswarm (Top 10 Features)')}
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 8 }}>
                Dot color: blue = low feature value, red = high feature value
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                  <XAxis dataKey="shapValue" name="SHAP Value" tick={{ fontSize: 10 }} label={{ value: 'SHAP Value', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                  <YAxis dataKey="featureIdx" name="Feature" tick={{ fontSize: 10 }}
                    tickFormatter={i => importanceData[i]?.feature.slice(0, 12) || ''} domain={[-0.5, 9.5]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 10 }}
                    formatter={(v, n, p) => [v.toFixed(4), n === 'shapValue' ? 'SHAP' : 'Feat Value']} />
                  <Scatter data={shapData} fill={T.teal} opacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16 }}>
                {sectionTitle('Feature Correlation Matrix (Top 6)')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontSize: 9 }}>
                  <div />
                  {importanceData.slice(0, 6).map(f => (
                    <div key={f.feature} style={{ color: T.navy, fontWeight: 700, textAlign: 'center',
                      fontSize: 8, padding: 2, wordBreak: 'break-all' }}>
                      {f.feature.slice(0, 6)}
                    </div>
                  ))}
                  {importanceData.slice(0, 6).map((f, fi) => (
                    <React.Fragment key={f.feature}>
                      <div style={{ fontSize: 8, color: T.navy, fontWeight: 700, display: 'flex',
                        alignItems: 'center', wordBreak: 'break-all' }}>{f.feature.slice(0, 6)}</div>
                      {importanceData.slice(0, 6).map((g, gi) => {
                        const corr = fi === gi ? 1 : (sr(fi * 37 + gi * 7 + 5) - 0.5) * 2;
                        const intensity = Math.abs(corr);
                        const bg = corr >= 0
                          ? `rgba(197,169,106,${0.15 + intensity * 0.85})`
                          : `rgba(153,27,27,${0.15 + intensity * 0.85})`;
                        return (
                          <div key={g.feature} title={corr.toFixed(2)}
                            style={{ background: bg, height: 28, borderRadius: 2, display: 'flex',
                              alignItems: 'center', justifyContent: 'center', fontSize: 8,
                              color: intensity > 0.6 ? '#fff' : T.navy }}>
                            {corr.toFixed(2)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>, {}
          )}
        </div>
      )}

      {/* TAB 3 */}
      {tab === 'Predictions & Validation' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: T.navy }}>Dataset:</label>
            <select value={predDataset} onChange={e => setPredDataset(e.target.value)}
              style={{ border: `1px solid #d1cdc7`, borderRadius: 4, padding: '6px 12px',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: '#fff' }}>
              {['Q1 2026 Portfolio','Test Set A','Custom Upload (simulated)'].map(d => <option key={d}>{d}</option>)}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 13, color: T.navy }}>Coverage @ 90%:&nbsp;
                <span style={{ fontWeight: 700, color: T.green, fontFamily: 'JetBrains Mono, monospace' }}>{coverageRate}%</span>
              </span>
              <button onClick={() => alert('Exporting 50 predictions...')}
                style={{ background: T.navy, color: T.gold, border: 'none', borderRadius: 5, padding: '7px 16px',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Export Predictions (CSV)</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {card(
              <>
                {sectionTitle('Calibration Plot')}
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={calibrationData} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                    <XAxis dataKey="expected" name="Expected" tick={{ fontSize: 10 }}
                      label={{ value: 'Expected Quantile', position: 'insideBottom', offset: -12, fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: 'Actual', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <ReferenceLine x={0} y={0} stroke={T.gray} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="expected" stroke={T.gray} strokeDasharray="4 4" dot={false} name="Perfect" />
                    <Line type="monotone" dataKey="actual" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 4 }} name="Model" />
                  </LineChart>
                </ResponsiveContainer>
              </>, {}
            )}
            {card(
              <>
                {sectionTitle('Conformal Prediction Bands (First 30 Assets)')}
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={predictions.slice(0, 30)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                    <XAxis dataKey="id" tick={false} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 1.1]} />
                    <Tooltip contentStyle={{ fontSize: 10 }} formatter={v => v.toFixed(3)} />
                    <Area type="monotone" dataKey="p95" stroke="none" fill={T.gold} fillOpacity={0.15} />
                    <Area type="monotone" dataKey="p75" stroke="none" fill={T.gold} fillOpacity={0.2} />
                    <Area type="monotone" dataKey="p25" stroke="none" fill={T.navy} fillOpacity={0.15} />
                    <Area type="monotone" dataKey="p5" stroke="none" fill={T.navy} fillOpacity={0.1} />
                    <Line type="monotone" dataKey="p50" stroke={T.navy} strokeWidth={2} dot={false} name="P50" />
                    <Line type="monotone" dataKey="actual" stroke={T.red} strokeWidth={1.5} dot={{ fill: T.red, r: 2 }} name="Actual" />
                  </AreaChart>
                </ResponsiveContainer>
              </>, {}
            )}
          </div>
          {card(
            <>
              {sectionTitle('Prediction Table (50 Assets)')}
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 340 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.navy, color: '#fff' }}>
                      {['Asset ID','Actual','P5','P25','P50','P75','P95','Coverage'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p, i) => (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9f7f3',
                        borderBottom: '1px solid #e8e4db' }}>
                        <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.navy }}>{p.id}</td>
                        <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{p.actual}</td>
                        <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gray }}>{p.p5}</td>
                        <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gray }}>{p.p25}</td>
                        <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700 }}>{p.p50}</td>
                        <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gray }}>{p.p75}</td>
                        <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gray }}>{p.p95}</td>
                        <td style={{ padding: '6px 12px' }}>
                          <span style={{ background: p.covered ? T.green : T.red, color: '#fff',
                            fontSize: 9, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>
                            {p.covered ? '✓' : '✗'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>, {}
          )}
        </>
      )}

      {/* TAB 4 */}
      {tab === 'Model Governance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {card(
            <>
              {sectionTitle('Model Registry')}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Name','Task','Trained','MAE','RMSE','Status'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10,
                        fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODEL_REGISTRY_DATA.map((m, i) => (
                    <tr key={m.name} style={{ background: i % 2 === 0 ? '#fff' : '#f9f7f3',
                      borderBottom: '1px solid #e8e4db' }}>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.navy }}>{m.name}</td>
                      <td style={{ padding: '6px 10px', fontSize: 11 }}>{m.task}</td>
                      <td style={{ padding: '6px 10px', fontSize: 11, color: T.gray }}>{m.trained}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{m.mae}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{m.rmse}</td>
                      <td style={{ padding: '6px 10px' }}><Badge status={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>, {}
          )}
          {card(
            <>
              {sectionTitle('Audit Log')}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Timestamp','User','Action','Model'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10,
                        fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AUDIT_LOG.map((a, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f7f3', borderBottom: '1px solid #e8e4db' }}>
                      <td style={{ padding: '5px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.gray }}>{a.ts}</td>
                      <td style={{ padding: '5px 10px', fontSize: 11 }}>{a.user}</td>
                      <td style={{ padding: '5px 10px' }}>
                        <span style={{ background: a.action === 'TRAIN' ? T.navy : a.action === 'DEPLOY' ? T.green : T.teal,
                          color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>{a.action}</span>
                      </td>
                      <td style={{ padding: '5px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{a.model}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>, {}
          )}
          {card(
            <>
              {sectionTitle('Fairness Metrics by Sector')}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectorPerf} margin={{ top: 5, right: 10, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mae" fill={T.gold} name="MAE" />
                  <Bar dataKey="rmse" fill={T.navy} name="RMSE" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </>, {}
          )}
          {card(
            <>
              {sectionTitle('Model Card')}
              <div style={{ fontSize: 12, color: T.navy, lineHeight: 1.7 }}>
                <div style={{ marginBottom: 8 }}><strong>Intended Use:</strong> Climate physical risk scoring and PD prediction for corporate bond/loan portfolios.</div>
                <div style={{ marginBottom: 8 }}><strong>Training Data:</strong> 45,000 assets across 30 sectors, 2010–2025, NGFS scenario-adjusted.</div>
                <div style={{ marginBottom: 8 }}><strong>Limitations:</strong> Out-of-distribution performance degraded for unlisted SMEs and sovereign entities.</div>
                <div style={{ marginBottom: 8 }}><strong>Framework:</strong> XGBoost 2.0 · Quantile Regression · Conformal Prediction Calibration</div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Performance by Region:</strong>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    {regionPerf.map(r => (
                      <div key={r.region} style={{ background: '#f9f7f3', borderRadius: 5, padding: '8px 12px',
                        border: `1px solid #e8e4db`, flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: T.gray, marginBottom: 3 }}>{r.region}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: T.navy }}>MAE {r.mae}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#f9f7f3', borderRadius: 5, padding: 12, border: `1px solid ${T.gold}` }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: T.navy }}>Champion / Challenger</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><div style={{ fontSize: 10, color: T.gray }}>Champion</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>xgb_climate_risk_v5</div>
                      <div style={{ fontSize: 11, color: T.green }}>MAE 0.0823</div></div>
                    <div><div style={{ fontSize: 10, color: T.gray }}>Challenger</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>lgbm_climate_risk_v1</div>
                      <div style={{ fontSize: 11, color: '#b45309' }}>MAE 0.0891</div></div>
                  </div>
                </div>
              </div>
            </>, {}
          )}
        </div>
      )}
    </div>
  );
}
