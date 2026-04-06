import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Legend, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
let _jobSeq = 0; // module-level counter — replaces non-deterministic Date.now() seed in job ID generator
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', teal: '#0f766e', red: '#991b1b', green: '#065f46', gray: '#6b7280' };

const MODEL_COLORS = [T.navy, T.gold, T.teal, T.red];

const ALL_MODELS = [
  { id: 'M01', name: 'xgb_climate_risk_v5', type: 'XGBoost', version: '5.0', status: 'Active', mae: 0.0823, auc: 0.921, trained: '2026-03-28', infSec: 1420 },
  { id: 'M02', name: 'lgbm_physical_risk_v2', type: 'LightGBM', version: '2.1', status: 'Active', mae: 0.0891, auc: 0.908, trained: '2026-03-15', infSec: 1890 },
  { id: 'M03', name: 'finbert_disclosure_v3', type: 'BERT', version: '3.0', status: 'Active', mae: 0.0612, auc: 0.947, trained: '2026-03-20', infSec: 340 },
  { id: 'M04', name: 'itransformer_climate_v1', type: 'iTransformer', version: '1.2', status: 'Active', mae: 0.0734, auc: 0.934, trained: '2026-03-25', infSec: 210 },
  { id: 'M05', name: 'rf_esg_score_v4', type: 'Random Forest', version: '4.0', status: 'Training', mae: null, auc: null, trained: null, infSec: null },
  { id: 'M06', name: 'stgnn_portfolio_v1', type: 'ST-GNN', version: '1.0', status: 'Deprecated', mae: 0.1134, auc: 0.872, trained: '2025-11-10', infSec: 190 },
  { id: 'M07', name: 'ensemble_climate_v2', type: 'Ensemble', version: '2.0', status: 'Deprecated', mae: 0.0765, auc: 0.931, trained: '2025-12-20', infSec: 820 },
  { id: 'M08', name: 'xgb_pd_model_v3', type: 'XGBoost', version: '3.0', status: 'Deprecated', mae: 0.0945, auc: 0.893, trained: '2025-10-05', infSec: 1560 },
  { id: 'M09', name: 'lgbm_stranding_v1', type: 'LightGBM', version: '1.0', status: 'Deprecated', mae: 0.1023, auc: 0.876, trained: '2025-09-15', infSec: 2100 },
  { id: 'M10', name: 'rf_transition_v2', type: 'Random Forest', version: '2.0', status: 'Deprecated', mae: 0.1187, auc: 0.841, trained: '2025-08-22', infSec: 3200 },
  { id: 'M11', name: 'bert_esg_ratings_v1', type: 'BERT', version: '1.0', status: 'Deprecated', mae: 0.0788, auc: 0.904, trained: '2025-07-30', infSec: 380 },
  { id: 'M12', name: 'xgb_stress_test_v2', type: 'XGBoost', version: '2.0', status: 'Deprecated', mae: 0.0912, auc: 0.889, trained: '2025-06-14', infSec: 1700 },
];

const CLIMATE_VARS = ['GDP','Carbon Price','Temperature','Renewable GW','Fossil EJ','CO2 ppm'];
const SCENARIOS = ['NGFS NZ2050','Below 2C','Current Policy'];
const ESG_METRICS = [
  'ESG Composite Score','Carbon Intensity','Water Risk Index','Board ESG Score',
  'Supply Chain Score','Green Revenue %','Controversy Index','SFDR Article 9 AUM',
];

const ALGORITHMS = ['Isolation Forest','LSTM Autoencoder','Statistical (z-score)'];
const ANOMALY_DAYS = [23, 47, 71];

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.navy : T.gray,
        borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent', marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

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

const StatusBadge = ({ status }) => {
  const colors = { Active: T.green, Training: '#b45309', Deprecated: T.gray };
  return (
    <span style={{ background: colors[status] || T.gray, color: '#fff', fontSize: 9, fontWeight: 700,
      padding: '2px 7px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 0.5 }}>
      {status}
    </span>
  );
};

export default function PredictiveAnalyticsHubPage() {
  const [tab, setTab] = useState('Model Registry');

  // Tab 1 state
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedModel, setExpandedModel] = useState(null);
  const [showTrainPanel, setShowTrainPanel] = useState(false);
  const [trainJobModel, setTrainJobModel] = useState('XGBoost');
  const [trainJobDataset, setTrainJobDataset] = useState('Q1 2026');
  const [trainJobTarget, setTrainJobTarget] = useState('Physical Risk Score');
  const [jobQueued, setJobQueued] = useState(null);

  // Tab 2 state
  const [checkedVars, setCheckedVars] = useState(new Set(CLIMATE_VARS));
  const [horizon, setHorizon] = useState(24);
  const [scenario, setScenario] = useState('NGFS NZ2050');
  const [forecastState, setForecastState] = useState({ status: 'idle', progress: 0 });
  const [forecastResult, setForecastResult] = useState(null);

  // Tab 3 state
  const [selectedMetric, setSelectedMetric] = useState(ESG_METRICS[0]);
  const [algorithm, setAlgorithm] = useState('Isolation Forest');
  const [threshold, setThreshold] = useState(3.0);
  const [anomalyResult, setAnomalyResult] = useState(null);
  const [anomalyState, setAnomalyState] = useState({ status: 'idle', progress: 0 });

  // Tab 4 state
  const [autoRetrain, setAutoRetrain] = useState(false);
  const [retrainThreshold, setRetrainThreshold] = useState(0.15);

  const toggleVar = (v) => setCheckedVars(prev => {
    const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n;
  });

  const filteredModels = useMemo(() =>
    statusFilter === 'All' ? ALL_MODELS : ALL_MODELS.filter(m => m.status === statusFilter),
    [statusFilter]
  );

  const summaryStats = useMemo(() => ({
    total: ALL_MODELS.length,
    active: ALL_MODELS.filter(m => m.status === 'Active').length,
    training: ALL_MODELS.filter(m => m.status === 'Training').length,
    deprecated: ALL_MODELS.filter(m => m.status === 'Deprecated').length,
  }), []);

  const submitTrainingJob = useCallback(() => {
    const jobId = `JOB-${Math.floor(sr(++_jobSeq * 31 + 7) * 99999).toString().padStart(5, '0')}`;
    setJobQueued({ id: jobId, model: trainJobModel, dataset: trainJobDataset, target: trainJobTarget });
    setShowTrainPanel(false);
  }, [trainJobModel, trainJobDataset, trainJobTarget]);

  const generateForecast = useCallback(() => {
    setForecastState({ status: 'running', progress: 0 });
    setForecastResult(null);
    let p = 0;
    const iv = setInterval(() => {
      p += 7;
      setForecastState({ status: 'running', progress: Math.min(100, p) });
      if (p >= 100) { clearInterval(iv); setForecastResult(true); setForecastState({ status: 'complete', progress: 100 }); }
    }, 80);
  }, []);

  const detectAnomalies = useCallback(() => {
    setAnomalyState({ status: 'running', progress: 0 });
    setAnomalyResult(null);
    let p = 0;
    const iv = setInterval(() => {
      p += 8;
      setAnomalyState({ status: 'running', progress: Math.min(100, p) });
      if (p >= 100) { clearInterval(iv); setAnomalyResult(true); setAnomalyState({ status: 'complete', progress: 100 }); }
    }, 75);
  }, []);

  const historicalData = useMemo(() => {
    const histYears = 60; // 2020–2024, monthly
    return Array.from({ length: histYears }, (_, i) => {
      const mo = i % 12;
      const yr = 2020 + Math.floor(i / 12);
      return {
        time: `${yr}-${String(mo + 1).padStart(2, '0')}`,
        GDP: +(85 + sr(i * 7 + 1) * 25).toFixed(2),
        CarbonPrice: +(55 + i * 0.8 + sr(i * 11 + 3) * 12).toFixed(2),
        Temperature: +(1.1 + i * 0.004 + (sr(i * 13 + 5) - 0.5) * 0.3).toFixed(3),
        RenewableGW: +(3800 + i * 45 + sr(i * 17 + 7) * 200).toFixed(0),
        FossilEJ: +(580 - i * 0.8 + sr(i * 19 + 9) * 20).toFixed(1),
        CO2ppm: +(420 + i * 0.3 + sr(i * 23 + 11) * 2).toFixed(2),
        forecast: false,
      };
    });
  }, []);

  const forecastData = useMemo(() => {
    if (!forecastResult) return [];
    const last = historicalData[historicalData.length - 1];
    return Array.from({ length: horizon }, (_, i) => {
      const mo = (parseInt(last.time.split('-')[1]) + i) % 12;
      const yr = parseInt(last.time.split('-')[0]) + Math.floor((parseInt(last.time.split('-')[1]) + i) / 12);
      return {
        time: `${yr}-${String(mo === 0 ? 12 : mo).padStart(2, '0')}`,
        CarbonPrice: +(last.CarbonPrice + (i + 1) * 1.2 + (sr(i * 7 + 31) - 0.5) * 8).toFixed(2),
        CarbonPriceLo: +(last.CarbonPrice + (i + 1) * 0.6 + (sr(i * 11 + 33) - 0.5) * 5).toFixed(2),
        CarbonPriceHi: +(last.CarbonPrice + (i + 1) * 1.8 + (sr(i * 13 + 37) - 0.5) * 11).toFixed(2),
        Temperature: +(last.Temperature + (i + 1) * 0.005 + (sr(i * 17 + 41) - 0.5) * 0.08).toFixed(3),
        forecast: true,
      };
    });
  }, [forecastResult, horizon, historicalData]);

  const attentionHeatmap = useMemo(() => CLIMATE_VARS.map((v, vi) => ({
    variable: v,
    weights: CLIMATE_VARS.map((w, wi) => +(sr(vi * 11 + wi * 7 + 3) * (vi === wi ? 0.5 : 1)).toFixed(3)),
  })), []);

  const forecastAccuracy = useMemo(() => CLIMATE_VARS.map((v, i) => ({
    variable: v,
    mase: +(0.82 + sr(i * 17 + 5) * 0.35).toFixed(3),
    rmse: +(0.045 + sr(i * 13 + 7) * 0.08).toFixed(4),
    smape: +(3.2 + sr(i * 19 + 11) * 5.5).toFixed(2) + '%',
  })), []);

  const carbonAttentionData = useMemo(() => CLIMATE_VARS.map((v, i) => ({
    variable: v, weight: +(sr(i * 11 + 7) * 0.28 + (v === 'CO2 ppm' ? 0.3 : v === 'Carbon Price' ? 0.25 : 0)).toFixed(3),
  })).sort((a, b) => b.weight - a.weight), []);

  const anomalyTimeSeries = useMemo(() => Array.from({ length: 90 }, (_, d) => {
    const isAnomaly = ANOMALY_DAYS.includes(d + 1);
    const base = 65 + sr(d * 7 + 1) * 20;
    const value = isAnomaly ? base - 18 - sr(d * 13) * 8 : base;
    return { day: d + 1, value: +value.toFixed(2), anomaly: isAnomaly, score: isAnomaly ? +(3.2 + sr(d * 11) * 1.5).toFixed(2) : +(sr(d * 7) * 1.8).toFixed(2) };
  }), []);

  const anomalyLog = ANOMALY_DAYS.map((d, i) => ({
    day: d, timestamp: `2026-01-${String(d).padStart(2,'0')} 14:${23 + i * 7}`,
    metric: selectedMetric, score: +(3.2 + sr(d * 11) * 1.5).toFixed(2),
    severity: i < 2 ? 'HIGH' : 'MEDIUM',
    explanation: i === 0 ? 'ESG score dropped 18 points — correlated with controversy event' :
      i === 1 ? 'Anomalous deviation exceeds 3.8σ — potential data quality issue' :
      'Moderate drift detected — consistent with regulatory announcement',
  }));

  const perfData90 = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    day: i + 1,
    xgb: +(0.085 + sr(i * 7 + 3) * 0.04 + (sr(i * 1) * 2 - 1) * 0.008).toFixed(4),
    lgbm: +(0.091 + sr(i * 11 + 5) * 0.045 + (sr(i * 1) * 2 - 1) * 0.009).toFixed(4),
    bert: +(0.063 + sr(i * 13 + 7) * 0.03 + (sr(i * 1) * 2 - 1) * 0.007).toFixed(4),
    itrans: +(0.075 + sr(i * 17 + 9) * 0.038 + (sr(i * 1) * 2 - 1) * 0.008).toFixed(4),
  })), []);

  const driftMetrics = useMemo(() => CLIMATE_VARS.slice(0, 6).map((v, i) => ({
    feature: v,
    psi: +(0.04 + sr(i * 11 + 5) * 0.22).toFixed(4),
    ks: +(0.02 + sr(i * 17 + 9) * 0.15).toFixed(4),
    alert: sr(i * 11 + 5) * 0.22 + 0.04 > 0.15,
  })), []);

  const alerts = useMemo(() => [
    { ts: '2026-04-01 09:12', type: 'Concept Drift', model: 'itransformer_climate_v1', detail: 'Carbon price — PSI=0.18', severity: 'HIGH' },
    { ts: '2026-03-30 15:44', type: 'MAE Spike', model: 'xgb_climate_risk_v5', detail: 'MAE 0.121 > threshold 0.10', severity: 'MEDIUM' },
    { ts: '2026-03-29 11:23', type: 'Data Drift', model: 'lgbm_physical_risk_v2', detail: 'GDP feature KS=0.18', severity: 'MEDIUM' },
    { ts: '2026-03-27 08:55', type: 'Coverage Drop', model: 'finbert_disclosure_v3', detail: 'Coverage 76% < 85% target', severity: 'LOW' },
    { ts: '2026-03-26 14:02', type: 'Concept Drift', model: 'itransformer_climate_v1', detail: 'Temperature trend shift', severity: 'LOW' },
    { ts: '2026-03-24 10:33', type: 'MAE Spike', model: 'xgb_climate_risk_v5', detail: 'Transient spike — resolved', severity: 'LOW' },
    { ts: '2026-03-22 16:11', type: 'Data Drift', model: 'lgbm_physical_risk_v2', detail: 'Fossil EJ distribution shift', severity: 'MEDIUM' },
  ], []);

  return (
    <div style={{ background: T.cream, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ background: T.navy, color: T.gold, fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>EP-BL3</span>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>ML Model Hub & Predictive Analytics Dashboard</div>
          <div style={{ fontSize: 13, color: T.gray }}>Model registry · iTransformer forecasting · Anomaly detection · Performance monitoring</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {[
            { label: `${summaryStats.total} Total`, color: T.navy },
            { label: `${summaryStats.active} Active`, color: T.green },
            { label: `${summaryStats.training} Training`, color: '#b45309' },
            { label: `${summaryStats.deprecated} Deprecated`, color: T.gray },
          ].map(s => (
            <span key={s.label} style={{ background: s.color, color: '#fff', fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</span>
          ))}
        </div>
      </div>

      <TabBar tabs={['Model Registry','iTransformer Forecasting','Anomaly Detection','Performance Monitor']}
        active={tab} onSelect={setTab} />

      {/* TAB 1 — Model Registry */}
      {tab === 'Model Registry' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            {['All','Active','Training','Deprecated'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{
                padding: '6px 14px', border: `1px solid ${statusFilter === f ? T.navy : '#d1cdc7'}`,
                background: statusFilter === f ? T.navy : '#fff', color: statusFilter === f ? T.gold : T.gray,
                borderRadius: 5, fontSize: 12, fontWeight: statusFilter === f ? 700 : 400, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}>{f}</button>
            ))}
            <button onClick={() => setShowTrainPanel(!showTrainPanel)} style={{
              marginLeft: 'auto', padding: '8px 18px', background: T.gold, color: T.navy,
              border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', letterSpacing: 0.8,
            }}>+ TRAIN NEW MODEL</button>
          </div>

          {jobQueued && (
            <div style={{ background: '#f0fdf4', border: `1px solid #a7f3d0`, borderRadius: 6,
              padding: '10px 14px', marginBottom: 14, fontSize: 12, color: T.green, display: 'flex', gap: 12, alignItems: 'center' }}>
              ✓ Job queued&nbsp;
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{jobQueued.id}</span>
              — {jobQueued.model} · {jobQueued.dataset} · {jobQueued.target}
              <button onClick={() => setJobQueued(null)} style={{ marginLeft: 'auto', background: 'none',
                border: 'none', cursor: 'pointer', color: T.gray, fontSize: 14 }}>✕</button>
            </div>
          )}

          {showTrainPanel && card(
            <>
              {sectionTitle('New Training Job Configuration')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>Model Type</label>
                  <select value={trainJobModel} onChange={e => setTrainJobModel(e.target.value)}
                    style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: '7px 10px',
                      fontFamily: 'DM Sans, sans-serif', fontSize: 12, background: '#fff' }}>
                    {['XGBoost','LightGBM','Random Forest','BERT','iTransformer','ST-GNN','Ensemble'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>Training Dataset</label>
                  <select value={trainJobDataset} onChange={e => setTrainJobDataset(e.target.value)}
                    style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: '7px 10px',
                      fontFamily: 'DM Sans, sans-serif', fontSize: 12, background: '#fff' }}>
                    {['Q1 2026','Full Historical','Custom'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>Target Variable</label>
                  <select value={trainJobTarget} onChange={e => setTrainJobTarget(e.target.value)}
                    style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: '7px 10px',
                      fontFamily: 'DM Sans, sans-serif', fontSize: 12, background: '#fff' }}>
                    {['Physical Risk Score','PD Prediction','Stranding Probability','ESG Score','Carbon Price'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={submitTrainingJob} style={{ padding: '9px 20px', background: T.navy, color: T.gold,
                  border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  SUBMIT TRAINING JOB
                </button>
                <button onClick={() => setShowTrainPanel(false)} style={{ padding: '9px 16px', background: '#fff',
                  border: `1px solid #d1cdc7`, borderRadius: 5, fontSize: 13, cursor: 'pointer', color: T.gray }}>
                  Cancel
                </button>
              </div>
            </>, { background: '#f9f7f3' }
          )}

          {card(
            <>
              {sectionTitle(`Models — ${filteredModels.length} shown`)}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Model','Type','Version','Status','MAE','AUC','Trained','Inf/sec'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10,
                        fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((m, i) => (
                    <React.Fragment key={m.id}>
                      <tr onClick={() => setExpandedModel(expandedModel === m.id ? null : m.id)}
                        style={{ background: expandedModel === m.id ? '#f0f8ff' : i % 2 === 0 ? '#fff' : '#f9f7f3',
                          borderBottom: '1px solid #e8e4db', cursor: 'pointer' }}>
                        <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                          color: T.navy, fontWeight: 700 }}>
                          <span style={{ marginRight: 6, color: T.gold }}>{expandedModel === m.id ? '▼' : '▶'}</span>
                          {m.name}
                        </td>
                        <td style={{ padding: '7px 10px', fontSize: 11 }}>{m.type}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>v{m.version}</td>
                        <td style={{ padding: '7px 10px' }}><StatusBadge status={m.status} /></td>
                        <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                          {m.mae !== null ? m.mae.toFixed(4) : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                          {m.auc !== null ? m.auc.toFixed(3) : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', fontSize: 11, color: T.gray }}>{m.trained || 'Pending'}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                          {m.infSec ? m.infSec.toLocaleString() : '—'}
                        </td>
                      </tr>
                      {expandedModel === m.id && (
                        <tr style={{ background: '#f0f8ff' }}>
                          <td colSpan={8} style={{ padding: '12px 20px', borderBottom: `2px solid ${T.gold}` }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Architecture</div>
                                <div style={{ fontSize: 11, color: T.gray, lineHeight: 1.6 }}>
                                  Type: {m.type}<br />
                                  Version: {m.version}<br />
                                  Framework: {m.type === 'BERT' || m.type === 'iTransformer' ? 'PyTorch 2.2' : 'scikit-learn 1.4'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Training Data</div>
                                <div style={{ fontSize: 11, color: T.gray, lineHeight: 1.6 }}>
                                  Records: {(35000 + parseInt(m.id.slice(1)) * 3000).toLocaleString()}<br />
                                  Period: 2015–2025<br />
                                  Features: {20 + parseInt(m.id.slice(1)) * 3}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Performance by Dataset</div>
                                {['Train','Val','Test'].map((ds, di) => (
                                  <div key={ds} style={{ display: 'flex', justifyContent: 'space-between',
                                    fontSize: 11, padding: '2px 0', color: T.gray }}>
                                    <span>{ds}</span>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.navy }}>
                                      MAE {m.mae ? (m.mae + di * 0.006).toFixed(4) : '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </>, {}
          )}
        </>
      )}

      {/* TAB 2 — iTransformer Forecasting */}
      {tab === 'iTransformer Forecasting' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          <div style={{ background: '#f9f7f3', border: `1px solid #e8e4db`, borderRadius: 8, padding: 20 }}>
            {sectionTitle('Forecast Configuration')}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: T.navy, marginBottom: 8 }}>Variables</div>
              {CLIMATE_VARS.map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                  cursor: 'pointer', color: checkedVars.has(v) ? T.navy : T.gray, marginBottom: 5 }}>
                  <input type="checkbox" checked={checkedVars.has(v)} onChange={() => toggleVar(v)}
                    style={{ accentColor: T.gold }} />
                  {v}
                </label>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: T.navy, marginBottom: 6 }}>Forecast Horizon</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
                {[12, 24, 36, 60].map(h => (
                  <button key={h} onClick={() => setHorizon(h)} style={{
                    padding: '6px 2px', border: `1px solid ${horizon === h ? T.navy : '#d1cdc7'}`,
                    background: horizon === h ? T.navy : '#fff', color: horizon === h ? T.gold : T.gray,
                    borderRadius: 4, fontSize: 11, cursor: 'pointer',
                  }}>{h}m</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>NGFS Scenario</label>
              <select value={scenario} onChange={e => setScenario(e.target.value)}
                style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: '6px 10px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12, background: '#fff' }}>
                {SCENARIOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={generateForecast} disabled={forecastState.status === 'running'}
              style={{ width: '100%', padding: '11px 0', background: T.navy, color: T.gold,
                border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', letterSpacing: 1.2,
                opacity: forecastState.status === 'running' ? 0.7 : 1 }}>
              {forecastState.status === 'running' ? 'FORECASTING...' : 'GENERATE FORECAST'}
            </button>
            {forecastState.status === 'running' && (
              <div style={{ marginTop: 10, background: '#e8e4db', borderRadius: 4, height: 8 }}>
                <div style={{ width: `${forecastState.progress}%`, height: '100%', background: T.gold,
                  borderRadius: 4, transition: 'width 0.08s ease' }} />
              </div>
            )}
          </div>

          <div>
            {!forecastResult && forecastState.status === 'idle' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 300, color: T.gray, fontSize: 14 }}>
                Select variables and click GENERATE FORECAST
              </div>
            )}
            {forecastResult && (
              <>
                {card(
                  <>
                    {sectionTitle('Carbon Price Forecast — Historical + Projection')}
                    <div style={{ fontSize: 11, color: T.gray, marginBottom: 8 }}>
                      Solid = historical · Dashed = forecast ({horizon}m) · Scenario: {scenario}
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={[...historicalData.slice(-24), ...forecastData]}
                        margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                        <XAxis dataKey="time" tick={{ fontSize: 9 }} interval={5} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 10 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="CarbonPriceHi" stroke="none" fill={T.gold} fillOpacity={0.15} name="P95 Band" />
                        <Area type="monotone" dataKey="CarbonPriceLo" stroke="none" fill={T.gold} fillOpacity={0.1} name="P05 Band" />
                        <Line type="monotone" dataKey="CarbonPrice" stroke={T.navy} strokeWidth={2}
                          strokeDasharray={(d) => d?.forecast ? '6 3' : '0'} dot={false} name="Carbon Price (USD/t)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>, {}
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {card(
                    <>
                      {sectionTitle('Attention Heatmap (Variable Interactions)')}
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(6,1fr)', gap: 2, fontSize: 9 }}>
                        <div />
                        {CLIMATE_VARS.map(v => (
                          <div key={v} style={{ textAlign: 'center', fontSize: 8, fontWeight: 700, color: T.navy,
                            padding: '2px 0', wordBreak: 'break-all' }}>{v.slice(0, 5)}</div>
                        ))}
                        {attentionHeatmap.map((row, ri) => (
                          <React.Fragment key={row.variable}>
                            <div style={{ fontSize: 8, fontWeight: 700, color: T.navy, display: 'flex',
                              alignItems: 'center', paddingRight: 4 }}>{row.variable.slice(0, 5)}</div>
                            {row.weights.map((w, wi) => (
                              <div key={wi} style={{
                                background: `rgba(197,169,106,${0.1 + w * 2.5})`,
                                height: 28, borderRadius: 2, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 8,
                                color: w > 0.3 ? '#fff' : T.navy,
                              }}>{w.toFixed(2)}</div>
                            ))}
                          </React.Fragment>
                        ))}
                      </div>
                    </>, {}
                  )}
                  {card(
                    <>
                      {sectionTitle('Carbon Price Attention Weights')}
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={carbonAttentionData} layout="vertical"
                          margin={{ top: 5, right: 20, bottom: 5, left: 90 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="variable" type="category" tick={{ fontSize: 10 }} width={85} />
                          <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => v.toFixed(3)} />
                          <Bar dataKey="weight" fill={T.gold} radius={[0, 3, 3, 0]} name="Attention Weight" />
                        </BarChart>
                      </ResponsiveContainer>
                    </>, {}
                  )}
                </div>
                {card(
                  <>
                    {sectionTitle('Backtesting Accuracy (Held-out 2024 Data)')}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: T.navy, color: '#fff' }}>
                          {['Variable','MASE','RMSE','SMAPE'].map(h => (
                            <th key={h} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10,
                              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {forecastAccuracy.map((r, i) => (
                          <tr key={r.variable} style={{ background: i % 2 === 0 ? '#fff' : '#f9f7f3',
                            borderBottom: '1px solid #e8e4db' }}>
                            <td style={{ padding: '6px 14px', fontSize: 12 }}>{r.variable}</td>
                            <td style={{ padding: '6px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                              color: r.mase < 1.0 ? T.green : T.red }}>{r.mase}</td>
                            <td style={{ padding: '6px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{r.rmse}</td>
                            <td style={{ padding: '6px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{r.smape}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>, {}
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 3 — Anomaly Detection */}
      {tab === 'Anomaly Detection' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          <div style={{ background: '#f9f7f3', border: `1px solid #e8e4db`, borderRadius: 8, padding: 20 }}>
            {sectionTitle('Detection Configuration')}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>ESG Metric</label>
              <select value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)}
                style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: '6px 10px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12, background: '#fff' }}>
                {ESG_METRICS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: T.navy, marginBottom: 6 }}>Algorithm</div>
              {ALGORITHMS.map(a => (
                <button key={a} onClick={() => setAlgorithm(a)} style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: 4,
                  border: `1px solid ${algorithm === a ? T.navy : '#d1cdc7'}`,
                  background: algorithm === a ? T.navy : '#fff', color: algorithm === a ? T.gold : T.gray,
                  borderRadius: 4, fontSize: 12, cursor: 'pointer',
                }}>{a}</button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.navy, marginBottom: 4 }}>
                <span>Threshold (σ)</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.gold, fontWeight: 700 }}>{threshold.toFixed(1)}σ</span>
              </div>
              <input type="range" min={2.0} max={4.0} step={0.1} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: T.gold }} />
            </div>
            <button onClick={detectAnomalies} disabled={anomalyState.status === 'running'}
              style={{ width: '100%', padding: '11px 0', background: T.navy, color: T.gold,
                border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', letterSpacing: 1.2,
                opacity: anomalyState.status === 'running' ? 0.7 : 1 }}>
              {anomalyState.status === 'running' ? 'DETECTING...' : 'DETECT ANOMALIES'}
            </button>
            {anomalyState.status === 'running' && (
              <div style={{ marginTop: 10, background: '#e8e4db', borderRadius: 4, height: 8 }}>
                <div style={{ width: `${anomalyState.progress}%`, height: '100%', background: T.gold,
                  borderRadius: 4, transition: 'width 0.075s ease' }} />
              </div>
            )}
          </div>

          <div>
            {!anomalyResult && anomalyState.status === 'idle' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 280, color: T.gray, fontSize: 14 }}>
                Configure settings and click DETECT ANOMALIES
              </div>
            )}
            {anomalyResult && (
              <>
                <div style={{ background: '#fff8e7', border: `1px solid ${T.gold}`, borderRadius: 6,
                  padding: '10px 14px', marginBottom: 14, fontSize: 13, color: T.navy, display: 'flex', gap: 10, alignItems: 'center' }}>
                  ⚠ <strong>3 anomalies detected</strong> — 2 HIGH severity (days 23, 47) · Algorithm: {algorithm}
                </div>
                {card(
                  <>
                    {sectionTitle(`${selectedMetric} — 90-Day Time Series`)}
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={anomalyTimeSeries} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 10 }}
                          formatter={(v, n, p) => [v, p.payload?.anomaly ? `⚠ ANOMALY (score ${p.payload.score})` : 'Value']} />
                        <Line type="monotone" dataKey="value" stroke={T.navy} strokeWidth={2} dot={false} name={selectedMetric} />
                        {ANOMALY_DAYS.map(d => (
                          <ReferenceLine key={d} x={d} stroke={T.red} strokeDasharray="4 3"
                            label={{ value: `A${ANOMALY_DAYS.indexOf(d)+1}`, fill: T.red, fontSize: 10 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </>, {}
                )}
                {card(
                  <>
                    {sectionTitle('Anomaly Log & Explainability')}
                    {anomalyLog.map((a, i) => (
                      <div key={i} style={{ border: `1px solid ${a.severity === 'HIGH' ? T.red : '#e8e4db'}`,
                        borderRadius: 6, padding: '12px 14px', marginBottom: 10,
                        background: a.severity === 'HIGH' ? '#fff5f5' : '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ background: a.severity === 'HIGH' ? T.red : '#b45309', color: '#fff',
                            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>{a.severity}</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.navy }}>
                            Day {a.day} · {a.timestamp}
                          </span>
                          <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 11, color: T.red }}>Score: {a.score}σ</span>
                        </div>
                        <div style={{ fontSize: 12, color: T.gray }}>{a.metric}</div>
                        <div style={{ fontSize: 12, color: T.navy, marginTop: 4 }}>
                          <strong>Explanation:</strong> {a.explanation}
                        </div>
                      </div>
                    ))}
                  </>, {}
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4 — Performance Monitor */}
      {tab === 'Performance Monitor' && (
        <>
          {card(
            <>
              {sectionTitle('Model MAE — 90-Day Rolling Window')}
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={perfData90} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 10 }} formatter={v => v.toFixed(4)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0.15} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Retrain Threshold', fill: T.red, fontSize: 9 }} />
                  <Line type="monotone" dataKey="xgb" stroke={MODEL_COLORS[0]} strokeWidth={2} dot={false} name="XGBoost" />
                  <Line type="monotone" dataKey="lgbm" stroke={MODEL_COLORS[1]} strokeWidth={2} dot={false} name="LightGBM" />
                  <Line type="monotone" dataKey="bert" stroke={MODEL_COLORS[2]} strokeWidth={2} dot={false} name="FinBERT" />
                  <Line type="monotone" dataKey="itrans" stroke={MODEL_COLORS[3]} strokeWidth={2} dot={false} name="iTransformer" />
                </LineChart>
              </ResponsiveContainer>
            </>, {}
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {card(
              <>
                {sectionTitle('Data Drift Monitor (PSI / KS Statistics)')}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px',
                  background: '#fff5f5', border: `1px solid ${T.red}`, borderRadius: 5 }}>
                  <span style={{ fontSize: 12, color: T.red, fontWeight: 700 }}>
                    ⚠ Carbon price prediction — drift detected (PSI=0.18, threshold=0.15)
                  </span>
                </div>
                {driftMetrics.map((d, i) => (
                  <div key={d.feature} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                    borderBottom: i < driftMetrics.length - 1 ? '1px solid #e8e4db' : 'none' }}>
                    <div style={{ width: 110, fontSize: 11, color: T.navy }}>{d.feature}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, background: '#e8e4db', borderRadius: 3, height: 6 }}>
                          <div style={{ width: `${Math.min(100, d.psi / 0.25 * 100)}%`, height: '100%',
                            background: d.alert ? T.red : T.green, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                          color: d.alert ? T.red : T.navy, minWidth: 48 }}>PSI {d.psi}</span>
                        {d.alert && <span style={{ background: T.red, color: '#fff', fontSize: 8,
                          fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>DRIFT</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </>, {}
            )}
            {card(
              <>
                {sectionTitle('Champion / Challenger')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  {[
                    { label: 'Champion', name: 'xgb_climate_risk_v5', mae: '0.0823', auc: '0.921', color: T.green },
                    { label: 'Challenger', name: 'lgbm_physical_risk_v2', mae: '0.0891', auc: '0.908', color: '#b45309' },
                  ].map(m => (
                    <div key={m.label} style={{ border: `2px solid ${m.color}`, borderRadius: 8, padding: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: m.color, marginBottom: 6,
                        textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.navy,
                        marginBottom: 8 }}>{m.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <div><div style={{ fontSize: 9, color: T.gray }}>MAE</div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700,
                            color: m.color }}>{m.mae}</div></div>
                        <div><div style={{ fontSize: 9, color: T.gray }}>AUC</div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700,
                            color: m.color }}>{m.auc}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
                {sectionTitle('Auto-Retraining Trigger')}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.navy, cursor: 'pointer' }}>
                    <input type="checkbox" checked={autoRetrain} onChange={e => setAutoRetrain(e.target.checked)}
                      style={{ accentColor: T.gold }} />
                    Enable auto-retrain
                  </label>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.navy, marginBottom: 4 }}>
                    <span>Retrain when MAE &gt;</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.gold, fontWeight: 700 }}>{retrainThreshold.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.08} max={0.25} step={0.01} value={retrainThreshold}
                    onChange={e => setRetrainThreshold(Number(e.target.value))}
                    style={{ width: '100%', accentColor: autoRetrain ? T.gold : T.gray }}
                    disabled={!autoRetrain} />
                </div>
              </>, {}
            )}
          </div>
          {card(
            <>
              {sectionTitle('Recent Alerts (Last 7)')}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Timestamp','Type','Model','Detail','Severity'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10,
                        fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f7f3',
                      borderBottom: '1px solid #e8e4db' }}>
                      <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.gray }}>{a.ts}</td>
                      <td style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: T.navy }}>{a.type}</td>
                      <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{a.model}</td>
                      <td style={{ padding: '6px 12px', fontSize: 11, color: T.gray }}>{a.detail}</td>
                      <td style={{ padding: '6px 12px' }}>
                        <span style={{
                          background: a.severity === 'HIGH' ? T.red : a.severity === 'MEDIUM' ? '#b45309' : T.gray,
                          color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}>{a.severity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>, {}
          )}
        </>
      )}
    </div>
  );
}
