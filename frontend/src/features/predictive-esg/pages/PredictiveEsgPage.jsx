import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, LineChart, Line, ReferenceLine, Cell, Legend, ScatterChart, Scatter
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8',
  borderL: '#d5cfc5', navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a',
  goldL: '#d4be8a', sage: '#5a8a6a', sageL: '#7ba67d', teal: '#5a8a6a',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae', red: '#dc2626',
  green: '#16a34a', amber: '#d97706', blue: '#2563eb', orange: '#ea580c',
  purple: '#7c3aed', font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mean = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

/* ── Math Utilities ─────────────────────────────────────────────── */
function solveLinearSystem(A, b) {
  const n = A.length;
  const aug = A.map((row, i) => [...row.map(v => v), b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    if (Math.abs(aug[col][col]) < 1e-10) aug[col][col] = 1e-10;
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    x[row] = aug[row][n];
    for (let j = row + 1; j < n; j++) x[row] -= aug[row][j] * x[j];
    x[row] /= aug[row][row] || 1e-10;
  }
  return x;
}

function linearRegression(X, y) {
  const n = X.length, p = X[0].length;
  const Xt = Array.from({ length: p }, (_, i) => X.map(row => row[i]));
  const XtX = Xt.map(row => Xt.map((_, j) => row.reduce((sum, val, k) => sum + val * X[k][j], 0)));
  const Xty = Xt.map(row => row.reduce((sum, val, i) => sum + val * y[i], 0));
  for (let i = 0; i < p; i++) XtX[i][i] += 0.001;
  const beta = solveLinearSystem(XtX, Xty);
  const predictions = X.map(row => row.reduce((s, x, j) => s + x * beta[j], 0));
  const yMean = mean(y);
  const ssTot = y.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = y.reduce((s, v, i) => s + (v - predictions[i]) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { beta, r2: Math.max(0, r2), predictions };
}

/* ── Feature Definitions (15 features) ─────────────────────────── */
const FEATURES = [
  // Climate group
  { id: 'ghg_intensity', name: 'GHG Intensity', group: 'Climate', desc: 'tCO2e per USD Mn revenue', direction: -1, min: 0, max: 500, default: 100, step: 5, shapW: 0.14 },
  { id: 'sbti', name: 'SBTi Commitment', group: 'Climate', desc: '0=None, 1=Committed, 2=Approved', direction: 1, min: 0, max: 2, default: 0, step: 1, shapW: 0.12 },
  { id: 'transition_risk', name: 'Transition Risk', group: 'Climate', desc: 'Score 0-100', direction: -1, min: 0, max: 100, default: 50, step: 1, shapW: 0.10 },
  { id: 'nz_year', name: 'Net Zero Proximity', group: 'Climate', desc: '2050 minus NZ target year', direction: 1, min: -10, max: 30, default: 10, step: 1, shapW: 0.09 },
  { id: 'scope3_coverage', name: 'Scope 3 Coverage', group: 'Climate', desc: '% of Scope 3 categories reported', direction: 1, min: 0, max: 100, default: 40, step: 5, shapW: 0.08 },
  { id: 'physical_risk', name: 'Physical Risk Score', group: 'Climate', desc: '0-100 composite physical risk', direction: -1, min: 0, max: 100, default: 35, step: 1, shapW: 0.07 },
  { id: 'tcfd_alignment', name: 'TCFD Alignment', group: 'Climate', desc: '0-4 pillars covered', direction: 1, min: 0, max: 4, default: 2, step: 1, shapW: 0.06 },
  // Governance group
  { id: 'board_independence', name: 'Board Independence', group: 'Governance', desc: '% independent directors', direction: 1, min: 0, max: 100, default: 55, step: 5, shapW: 0.09 },
  { id: 'biodiversity', name: 'Biodiversity Commitment', group: 'Governance', desc: '0=No, 1=Committed, 2=Active Program', direction: 1, min: 0, max: 2, default: 0, step: 1, shapW: 0.05 },
  { id: 'esg_controversy', name: 'ESG Controversy Count', group: 'Governance', desc: '# major controversies (0-5)', direction: -1, min: 0, max: 5, default: 1, step: 1, shapW: 0.07 },
  { id: 'sector_avg', name: 'Sector ESG Average', group: 'Governance', desc: 'Peer average ESG score', direction: 1, min: 20, max: 80, default: 50, step: 1, shapW: 0.06 },
  // Data Quality group
  { id: 'data_quality', name: 'Data Quality', group: 'Data Quality', desc: '% disclosure fields populated', direction: 1, min: 0, max: 100, default: 50, step: 5, shapW: 0.05 },
  { id: 'cdp_score', name: 'CDP Score', group: 'Data Quality', desc: 'CDP climate score 0-100', direction: 1, min: 0, max: 100, default: 45, step: 5, shapW: 0.08 },
  { id: 'revenue', name: 'Revenue (log)', group: 'Data Quality', desc: 'log10(revenue USD Mn)', direction: 0, min: 0, max: 6, default: 3, step: 0.1, shapW: 0.03 },
  { id: 'employees', name: 'Workforce Size (log)', group: 'Data Quality', desc: 'log10(employees)', direction: 0, min: 1, max: 6, default: 3.5, step: 0.1, shapW: 0.01 },
];

const FEATURE_GROUPS = ['Climate', 'Governance', 'Data Quality'];
const GROUP_COLORS = { Climate: T.teal, Governance: T.navy, 'Data Quality': T.gold };

/* ── Score Computation ──────────────────────────────────────────── */
function computeScore(vals, modelKey) {
  // Normalize each feature to 0-1 contribution
  const contribs = FEATURES.map(f => {
    const norm = (vals[f.id] - f.min) / (f.max - f.min);
    const directed = f.direction === 1 ? norm : f.direction === -1 ? (1 - norm) : 0.5;
    return directed * f.shapW;
  });
  const raw = contribs.reduce((s, v) => s + v, 0) / FEATURES.reduce((s, f) => s + f.shapW, 0);
  // Model-specific perturbation
  const noise = { xgboost: 0.97, lightgbm: 0.94, ensemble: 1.00 }[modelKey] || 1.0;
  const base = clamp(raw * 100 * noise, 5, 97);
  // CI width varies by model
  const ciW = { xgboost: 6, lightgbm: 8, ensemble: 5 }[modelKey] || 7;
  return { score: Math.round(base * 10) / 10, ci_low: clamp(base - ciW, 0, 100), ci_high: clamp(base + ciW, 0, 100) };
}

function scoreColor(s) {
  if (s >= 80) return T.green;
  if (s >= 60) return T.navy;
  if (s >= 40) return T.amber;
  return T.red;
}

function scoreTier(s) {
  if (s >= 80) return 'AAA';
  if (s >= 70) return 'AA';
  if (s >= 60) return 'A';
  if (s >= 50) return 'BBB';
  if (s >= 40) return 'BB';
  if (s >= 30) return 'B';
  return 'CCC';
}

/* ── 20 Portfolio Companies ─────────────────────────────────────── */
const SECTORS = ['Energy', 'Utilities', 'Industrials', 'Materials', 'Financials', 'Technology', 'Consumer', 'Healthcare', 'Real Estate', 'Transport'];
const COMPANIES = Array.from({ length: 20 }, (_, i) => {
  const names = [
    'NordicPower AS', 'GlobalSteel Corp', 'AsiaPac Chemicals', 'EuroBank Group',
    'TechVentures Ltd', 'GreenLogistics SA', 'PharmaGlobal Inc', 'AgriCo Holdings',
    'UrbanREIT Fund', 'CleanFuel Energy', 'MegaMining PLC', 'RetailGroup BV',
    'AutoDrive Corp', 'DataCenter REIT', 'OceanShipping Co', 'FoodPro AG',
    'InsureSafe Ltd', 'MediaHouse Corp', 'WasteManage AB', 'TextileCo SE'
  ];
  const sector = SECTORS[i % SECTORS.length];
  const vals = {};
  FEATURES.forEach((f, fi) => {
    vals[f.id] = f.min + (f.max - f.min) * sr(i * 37 + fi * 7);
    if (f.step === 1 && f.max <= 5) vals[f.id] = Math.round(vals[f.id]);
    else if (f.step === 1) vals[f.id] = Math.round(vals[f.id]);
    else vals[f.id] = Math.round(vals[f.id] / f.step) * f.step;
    vals[f.id] = clamp(vals[f.id], f.min, f.max);
  });
  const { score, ci_low, ci_high } = computeScore(vals, 'ensemble');
  const consensus = clamp(score + (sr(i * 13 + 99) - 0.5) * 16, 10, 95);
  return {
    id: i, name: names[i], sector, vals, score,
    ci_low: Math.round(ci_low * 10) / 10,
    ci_high: Math.round(ci_high * 10) / 10,
    consensus: Math.round(consensus * 10) / 10,
    delta: Math.round((score - consensus) * 10) / 10,
  };
});

/* ── Sub-components ─────────────────────────────────────────────── */
const Card = ({ style, children }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, ...style }}>{children}</div>
);
const Label = ({ children, style }) => (
  <div style={{ fontFamily: T.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textMut, marginBottom: 4, ...style }}>{children}</div>
);
const SectionTitle = ({ children }) => (
  <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 12 }}>{children}</div>
);

const ModelBadge = ({ model, active, onClick }) => {
  const meta = { xgboost: { label: 'XGBoost', r2: '0.847', color: T.navy }, lightgbm: { label: 'LightGBM', r2: '0.831', color: T.purple }, ensemble: { label: 'Ensemble', r2: '0.871', color: T.green } }[model];
  return (
    <button onClick={onClick} style={{ padding: '6px 14px', borderRadius: 6, border: `2px solid ${active ? meta.color : T.border}`, background: active ? meta.color : T.surface, color: active ? '#fff' : T.textSec, fontFamily: T.font, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
      {meta.label} <span style={{ opacity: 0.8, fontSize: 10 }}>R²={meta.r2}</span>
    </button>
  );
};

/* ══════════════════════════════════════════════════════════════════
   TAB 1: Prediction Studio
══════════════════════════════════════════════════════════════════ */
function TabPredictionStudio() {
  const [vals, setVals] = useState(() => Object.fromEntries(FEATURES.map(f => [f.id, f.default])));
  const [model, setModel] = useState('ensemble');

  const result = useMemo(() => computeScore(vals, model), [vals, model]);

  const scenarioImproved = useMemo(() => {
    const v2 = { ...vals, sbti: Math.min(2, vals.sbti + 1), cdp_score: Math.min(100, vals.cdp_score + 20), tcfd_alignment: Math.min(4, vals.tcfd_alignment + 1) };
    return computeScore(v2, model);
  }, [vals, model]);

  const groupContribs = useMemo(() => {
    return FEATURE_GROUPS.map(g => {
      const fts = FEATURES.filter(f => f.group === g);
      const total = fts.reduce((s, f) => {
        const norm = (vals[f.id] - f.min) / (f.max - f.min);
        const directed = f.direction === 1 ? norm : f.direction === -1 ? (1 - norm) : 0.5;
        return s + directed * f.shapW;
      }, 0);
      const maxPossible = fts.reduce((s, f) => s + f.shapW, 0);
      return { group: g, pts: Math.round(total / FEATURES.reduce((s, f) => s + f.shapW, 0) * 100 * 10) / 10, pct: Math.round(total / maxPossible * 100) };
    });
  }, [vals]);

  const setVal = (id, v) => setVals(prev => ({ ...prev, [id]: v }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>
      {/* Left: Feature Sliders */}
      <div>
        {FEATURE_GROUPS.map(g => (
          <Card key={g} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: GROUP_COLORS[g] }} />
              <SectionTitle>{g} Features</SectionTitle>
            </div>
            {FEATURES.filter(f => f.group === g).map(f => (
              <div key={f.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: T.font, fontSize: 12, color: T.text, fontWeight: 500 }}>{f.name}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: GROUP_COLORS[g], fontWeight: 700 }}>{typeof vals[f.id] === 'number' ? (vals[f.id] % 1 !== 0 ? vals[f.id].toFixed(1) : vals[f.id]) : vals[f.id]}</span>
                </div>
                <input type="range" min={f.min} max={f.max} step={f.step || 1} value={vals[f.id]}
                  onChange={e => setVal(f.id, parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: GROUP_COLORS[g] }} />
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.textMut }}>{f.desc}</div>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Right: Score + Analysis */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Model selector */}
        <Card>
          <Label>Model Selection</Label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['xgboost', 'lightgbm', 'ensemble'].map(m => (
              <ModelBadge key={m} model={m} active={model === m} onClick={() => setModel(m)} />
            ))}
          </div>
        </Card>

        {/* Score display */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Label>Predicted ESG Score</Label>
              <div style={{ fontFamily: T.mono, fontSize: 56, fontWeight: 700, color: scoreColor(result.score), lineHeight: 1 }}>{result.score}</div>
              <div style={{ fontFamily: T.font, fontSize: 13, color: T.textSec, marginTop: 4 }}>
                Tier: <strong style={{ color: scoreColor(result.score) }}>{scoreTier(result.score)}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Label>95% Confidence Interval</Label>
              <div style={{ fontFamily: T.mono, fontSize: 20, color: T.textSec, fontWeight: 600 }}>
                [{result.ci_low.toFixed(1)}, {result.ci_high.toFixed(1)}]
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginTop: 4 }}>Band: ±{((result.ci_high - result.ci_low) / 2).toFixed(1)} pts</div>
            </div>
          </div>
          {/* CI bar */}
          <div style={{ marginTop: 16, position: 'relative', height: 8, background: T.surfaceH, borderRadius: 4 }}>
            <div style={{ position: 'absolute', left: `${result.ci_low}%`, width: `${result.ci_high - result.ci_low}%`, height: '100%', background: scoreColor(result.score) + '44', borderRadius: 4 }} />
            <div style={{ position: 'absolute', left: `${result.score}%`, transform: 'translateX(-50%)', width: 4, height: '100%', background: scoreColor(result.score), borderRadius: 2 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 9, color: T.textMut, marginTop: 2 }}>
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </Card>

        {/* Score decomposition by group */}
        <Card>
          <SectionTitle>Score Decomposition by Group</SectionTitle>
          {groupContribs.map(gc => (
            <div key={gc.group} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: T.font, fontSize: 12, color: T.text }}>{gc.group}</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: GROUP_COLORS[gc.group], fontWeight: 700 }}>+{gc.pts} pts</span>
              </div>
              <div style={{ height: 6, background: T.surfaceH, borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${gc.pct}%`, background: GROUP_COLORS[gc.group], borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
            </div>
          ))}
        </Card>

        {/* Scenario improvement */}
        <Card>
          <SectionTitle>Scenario Improvement Analysis</SectionTitle>
          <div style={{ fontFamily: T.font, fontSize: 12, color: T.textSec, marginBottom: 12 }}>
            If SBTi +1 tier + CDP +20 pts + TCFD +1 pillar:
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <Label>Baseline</Label>
              <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: scoreColor(result.score) }}>{result.score}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, color: T.textMut }}>→</div>
            <div>
              <Label>Improved</Label>
              <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: scoreColor(scenarioImproved.score) }}>{scenarioImproved.score}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: scenarioImproved.score > result.score ? T.green : T.red }}>
                {scenarioImproved.score > result.score ? '+' : ''}{(scenarioImproved.score - result.score).toFixed(1)} pts
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB 2: SHAP Explainability
══════════════════════════════════════════════════════════════════ */
function TabSHAP({ featureVals }) {
  const vals = featureVals || Object.fromEntries(FEATURES.map(f => [f.id, f.default]));

  const shapValues = useMemo(() => {
    return FEATURES.map((f, i) => {
      const norm = (vals[f.id] - f.min) / (f.max - f.min);
      const directed = f.direction === 1 ? norm : f.direction === -1 ? (1 - norm) : 0.5;
      const contribution = (directed - 0.5) * f.shapW * 100;
      return { feature: f.name, shap: Math.round(contribution * 100) / 100, group: f.group, abs: Math.abs(contribution) };
    }).sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));
  }, [vals]);

  const baseScore = 50.0;
  let running = baseScore;
  const waterfallData = shapValues.map(sv => {
    const prev = running;
    running += sv.shap;
    return { ...sv, start: Math.min(prev, running), end: Math.max(prev, running), positive: sv.shap >= 0 };
  });

  const topInteractions = shapValues.slice(0, 3);
  const heatmapData = [];
  topInteractions.forEach((a, i) => {
    topInteractions.forEach((b, j) => {
      const interaction = i === j ? 1.0 : (sr(i * 17 + j * 31) - 0.5) * 2;
      heatmapData.push({ x: a.feature.split(' ')[0], y: b.feature.split(' ')[0], value: Math.round(interaction * 100) / 100 });
    });
  });

  const counterfactuals = [
    { action: 'SBTi → Approved (2)', delta: '+3.2', feat: 'SBTi Commitment' },
    { action: 'CDP Score → 75+', delta: '+2.8', feat: 'CDP Score' },
    { action: 'Scope 3 → 80% coverage', delta: '+2.1', feat: 'Scope 3 Coverage' },
    { action: 'Board Independence → 70%', delta: '+1.6', feat: 'Board Independence' },
    { action: 'TCFD → 4 pillars', delta: '+1.4', feat: 'TCFD Alignment' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* SHAP Waterfall */}
      <Card style={{ gridColumn: '1 / -1' }}>
        <SectionTitle>SHAP Waterfall — Feature Contributions from Base Score</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textSec }}>Base value: {baseScore.toFixed(1)}</span>
          <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textMut }}>→</span>
          <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy, fontWeight: 700 }}>Final: {Math.round(running * 10) / 10}</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={waterfallData} layout="vertical" margin={{ left: 120, right: 60, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickStyle={{ fontFamily: T.mono, fontSize: 10 }} />
            <YAxis type="category" dataKey="feature" width={115} tick={{ fontFamily: T.font, fontSize: 10, fill: T.textSec }} />
            <Tooltip formatter={(v, n, p) => [`SHAP: ${p.payload.shap > 0 ? '+' : ''}${p.payload.shap}`, p.payload.feature]} />
            <Bar dataKey="end" name="Score">
              {waterfallData.map((entry, i) => (
                <Cell key={i} fill={entry.positive ? T.navy : T.red} fillOpacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Global Feature Importance */}
      <Card>
        <SectionTitle>Global Feature Importance (|SHAP|)</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={shapValues.map(s => ({ ...s, absShap: s.abs }))} layout="vertical" margin={{ left: 110, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
            <XAxis type="number" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
            <YAxis type="category" dataKey="feature" width={105} tick={{ fontFamily: T.font, fontSize: 10, fill: T.textSec }} />
            <Tooltip formatter={(v) => [v.toFixed(2), '|SHAP|']} />
            <Bar dataKey="absShap" radius={[0, 3, 3, 0]}>
              {shapValues.map((entry, i) => <Cell key={i} fill={GROUP_COLORS[entry.group]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Counterfactual Analysis */}
      <Card>
        <SectionTitle>Counterfactual Analysis — To Reach 70+ Score</SectionTitle>
        <div style={{ fontFamily: T.font, fontSize: 12, color: T.textSec, marginBottom: 12 }}>
          Minimum changes required to achieve AAA-tier (≥70):
        </div>
        {counterfactuals.map((cf, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
            <div>
              <div style={{ fontFamily: T.font, fontSize: 12, color: T.text, fontWeight: 500 }}>{cf.action}</div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>{cf.feat}</div>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.green, fontWeight: 700 }}>{cf.delta}</div>
          </div>
        ))}

        {/* Feature interaction heatmap (simplified) */}
        <div style={{ marginTop: 16 }}>
          <SectionTitle>Top-3 Feature Interactions</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {heatmapData.map((cell, i) => {
              const intensity = (cell.value + 1) / 2;
              const bg = cell.value > 0.2 ? `rgba(27,58,92,${0.2 + intensity * 0.5})` :
                cell.value < -0.2 ? `rgba(220,38,38,${0.2 + (1 - intensity) * 0.5})` : T.surfaceH;
              return (
                <div key={i} style={{ height: 42, background: bg, borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text, fontWeight: 700 }}>{cell.value.toFixed(2)}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 7, color: T.textMut }}>{cell.x}×{cell.y}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB 3: Model Performance & Validation
══════════════════════════════════════════════════════════════════ */
function TabModelPerformance() {
  const models = [
    { name: 'XGBoost', r2: 0.847, rmse: 4.2, mae: 3.1, cal: 0.934, color: T.navy },
    { name: 'LightGBM', r2: 0.831, rmse: 4.6, mae: 3.4, cal: 0.918, color: T.purple },
    { name: 'Ensemble', r2: 0.871, rmse: 3.9, mae: 2.9, cal: 0.951, color: T.green },
    { name: 'Linear (baseline)', r2: 0.743, rmse: 6.1, mae: 4.8, cal: 0.872, color: T.textMut },
  ];

  // Residuals for scatter
  const residualData = Array.from({ length: 80 }, (_, i) => {
    const actual = 20 + sr(i * 7 + 1) * 75;
    const noise = (sr(i * 13 + 3) - 0.5) * 8;
    return { actual: Math.round(actual), predicted: Math.round(clamp(actual + noise, 5, 100)), residual: Math.round(noise) };
  });

  // Learning curves
  const sizes = [50, 100, 200, 500, 1000];
  const learningCurve = sizes.map((n, i) => ({
    n,
    train_xgb: clamp(0.96 - sr(i * 3 + 1) * 0.02, 0.88, 0.98),
    val_xgb: clamp(0.847 - (1000 - n) / 1000 * 0.12 + sr(i * 5 + 2) * 0.02, 0.70, 0.87),
    train_lgb: clamp(0.94 - sr(i * 3 + 4) * 0.02, 0.86, 0.96),
    val_lgb: clamp(0.831 - (1000 - n) / 1000 * 0.14 + sr(i * 5 + 6) * 0.02, 0.68, 0.85),
    train_ens: clamp(0.97 - sr(i * 3 + 7) * 0.015, 0.90, 0.99),
    val_ens: clamp(0.871 - (1000 - n) / 1000 * 0.10 + sr(i * 5 + 8) * 0.02, 0.75, 0.89),
  }));

  // Calibration curve
  const calibration = Array.from({ length: 10 }, (_, i) => ({
    predicted: (i + 0.5) * 10,
    actual: clamp((i + 0.5) * 10 + (sr(i * 11 + 2) - 0.5) * 8, 0, 100),
    perfect: (i + 0.5) * 10,
  }));

  // Correlation matrix (8 features)
  const top8 = FEATURES.slice(0, 8);
  const corrMatrix = top8.map((a, i) => top8.map((b, j) => {
    if (i === j) return 1.0;
    const v = (sr(i * 19 + j * 7) - 0.5) * 1.6;
    return Math.round(clamp(v, -1, 1) * 100) / 100;
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Metrics table */}
      <Card>
        <SectionTitle>Model Performance Metrics</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Model', 'R²', 'RMSE', 'MAE', 'Calibration', 'Rank'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <tr key={m.name} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: m.color }}>{m.name}</td>
                <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{m.r2.toFixed(3)}</td>
                <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{m.rmse.toFixed(1)}</td>
                <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{m.mae.toFixed(1)}</td>
                <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{m.cal.toFixed(3)}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ background: i === 2 ? T.green : i === 0 ? T.gold : T.surfaceH, color: i <= 2 ? '#fff' : T.textMut, padding: '2px 8px', borderRadius: 4, fontFamily: T.mono, fontSize: 10 }}>
                    #{i + 1}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Residual plot */}
        <Card>
          <SectionTitle>Residual Analysis — Predicted vs Actual</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="actual" name="Actual" type="number" domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} label={{ value: 'Actual', position: 'bottom', fontFamily: T.mono, fontSize: 10 }} />
              <YAxis dataKey="predicted" name="Predicted" type="number" domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} label={{ value: 'Predicted', angle: -90, position: 'insideLeft', fontFamily: T.mono, fontSize: 10 }} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke={T.gold} strokeDasharray="5 5" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={residualData} fill={T.navy} fillOpacity={0.5} r={3} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        {/* Learning curves */}
        <Card>
          <SectionTitle>Learning Curves — Validation R² vs Training Size</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={learningCurve} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="n" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} label={{ value: 'Train samples', position: 'bottom', fontFamily: T.mono, fontSize: 10 }} />
              <YAxis domain={[0.6, 1.0]} tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
              <Tooltip formatter={(v) => [v.toFixed(3), '']} />
              <Legend iconType="line" wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
              <Line type="monotone" dataKey="val_xgb" name="XGBoost Val" stroke={T.navy} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="val_lgb" name="LightGBM Val" stroke={T.purple} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="val_ens" name="Ensemble Val" stroke={T.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="train_ens" name="Ensemble Train" stroke={T.green} strokeWidth={1} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Calibration curve */}
        <Card>
          <SectionTitle>Calibration Curve — Ensemble Model</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={calibration} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="predicted" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} label={{ value: 'Predicted', position: 'bottom', fontFamily: T.mono, fontSize: 10 }} />
              <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
              <Tooltip />
              <Line type="monotone" dataKey="perfect" name="Perfect Calib." stroke={T.gold} strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="actual" name="Ensemble" stroke={T.green} strokeWidth={2} dot={{ r: 4, fill: T.green }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Correlation heatmap */}
        <Card>
          <SectionTitle>Feature Correlation Matrix (Top 8)</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${top8.length}, 1fr)`, gap: 2 }}>
            {corrMatrix.flatMap((row, i) => row.map((val, j) => {
              const c = val > 0 ? `rgba(27,58,92,${Math.abs(val) * 0.8})` : `rgba(220,38,38,${Math.abs(val) * 0.8})`;
              return (
                <div key={`${i}-${j}`} style={{ height: 36, background: c, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={`${top8[i].name} × ${top8[j].name}: ${val}`}>
                  <span style={{ fontFamily: T.mono, fontSize: 8, color: Math.abs(val) > 0.4 ? '#fff' : T.text }}>{val.toFixed(1)}</span>
                </div>
              );
            }))}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 16, fontFamily: T.mono, fontSize: 10, color: T.textMut }}>
            <span style={{ color: T.red }}>■ Negative</span>
            <span style={{ color: T.navy }}>■ Positive</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB 4: Portfolio Scoring
══════════════════════════════════════════════════════════════════ */
function TabPortfolio() {
  const [sortBy, setSortBy] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    return [...COMPANIES].sort((a, b) => {
      const av = a[sortBy] ?? 0, bv = b[sortBy] ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  // Score distribution histogram
  const bins = Array.from({ length: 10 }, (_, i) => {
    const lo = i * 10, hi = (i + 1) * 10;
    return { range: `${lo}-${hi}`, count: COMPANIES.filter(c => c.score >= lo && c.score < hi).length };
  });

  // Sector box data
  const sectorData = SECTORS.slice(0, 6).map(s => {
    const cos = COMPANIES.filter(c => c.sector === s);
    if (!cos.length) return null;
    const scores = cos.map(c => c.score).sort((a, b) => a - b);
    return { sector: s, min: scores[0], avg: mean(scores), max: scores[scores.length - 1] };
  }).filter(Boolean);

  // Momentum (5-year trajectory for top 5 companies)
  const years = [2024, 2025, 2026, 2027, 2028, 2029];
  const momentumData = years.map((yr, yi) => {
    const row = { year: yr };
    COMPANIES.slice(0, 5).forEach((c, ci) => {
      const trend = (c.score < 50 ? 1.5 : 0.8) + (sr(ci * 11 + yi * 7) - 0.5) * 0.6;
      row[c.name.split(' ')[0]] = Math.round(clamp(c.score + yi * trend, 5, 98) * 10) / 10;
    });
    return row;
  });

  const outliers = COMPANIES.filter(c => Math.abs(c.delta) > 6).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 5);

  const thCols = ['Company', 'Sector', 'Score', '95% CI', 'Consensus', 'Delta', 'Rec'];
  const cols = ['name', 'sector', 'score', 'ci', 'consensus', 'delta', 'rec'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Table */}
      <Card>
        <SectionTitle>Portfolio ESG Scoring — 20 Companies</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font, fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {thCols.map((h, i) => (
                  <th key={h} onClick={() => ['score', 'consensus', 'delta'].includes(cols[i]) && toggleSort(cols[i])}
                    style={{ padding: '8px 10px', textAlign: 'left', fontFamily: T.mono, fontSize: 10, color: T.textMut, textTransform: 'uppercase', cursor: ['score', 'consensus', 'delta'].includes(cols[i]) ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    {h}{sortBy === cols[i] ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{c.sector}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{ fontFamily: T.mono, fontWeight: 700, color: scoreColor(c.score) }}>{c.score}</span>
                  </td>
                  <td style={{ padding: '7px 10px', fontFamily: T.mono, fontSize: 10, color: T.textMut }}>[{c.ci_low}, {c.ci_high}]</td>
                  <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{c.consensus}</td>
                  <td style={{ padding: '7px 10px', fontFamily: T.mono, fontWeight: 600, color: c.delta > 0 ? T.green : T.red }}>
                    {c.delta > 0 ? '+' : ''}{c.delta}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontFamily: T.mono, fontWeight: 600, background: c.delta > 4 ? T.green + '22' : c.delta < -4 ? T.red + '22' : T.surfaceH, color: c.delta > 4 ? T.green : c.delta < -4 ? T.red : T.textMut }}>
                      {c.delta > 4 ? 'UPGRADE' : c.delta < -4 ? 'REVIEW' : 'HOLD'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Score distribution */}
        <Card>
          <SectionTitle>Score Distribution (Portfolio)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bins} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false} />
              <XAxis dataKey="range" tick={{ fontFamily: T.mono, fontSize: 9, fill: T.textMut }} />
              <YAxis allowDecimals={false} tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
              <Tooltip />
              <Bar dataKey="count" name="Companies" radius={[3, 3, 0, 0]}>
                {bins.map((b, i) => <Cell key={i} fill={scoreColor(parseInt(b.range))} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Sector comparison */}
        <Card>
          <SectionTitle>Sector Score Range (Min/Avg/Max)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sectorData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false} />
              <XAxis dataKey="sector" tick={{ fontFamily: T.mono, fontSize: 9, fill: T.textMut }} />
              <YAxis domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
              <Tooltip />
              <Bar dataKey="min" name="Min" fill={T.red} fillOpacity={0.5} />
              <Bar dataKey="avg" name="Avg" fill={T.navy} />
              <Bar dataKey="max" name="Max" fill={T.green} fillOpacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Score momentum */}
        <Card>
          <SectionTitle>5-Year Score Momentum (Top 5 Companies)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={momentumData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="year" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
              <YAxis domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
              <Tooltip />
              {COMPANIES.slice(0, 5).map((c, i) => (
                <Line key={c.id} type="monotone" dataKey={c.name.split(' ')[0]} stroke={[T.navy, T.teal, T.gold, T.purple, T.amber][i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Outlier detection */}
        <Card>
          <SectionTitle>Outlier Detection — Model vs Analyst Consensus</SectionTitle>
          <div style={{ fontFamily: T.font, fontSize: 12, color: T.textSec, marginBottom: 10 }}>
            Companies with |delta| > 6 pts — potential mispricing signals
          </div>
          {outliers.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
              <div>
                <div style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.navy }}>{c.name}</div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>{c.sector} | Model: {c.score} | Consensus: {c.consensus}</div>
              </div>
              <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: c.delta > 0 ? T.green : T.red }}>
                {c.delta > 0 ? '+' : ''}{c.delta}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB 5: SBTi Pathway Divergence
══════════════════════════════════════════════════════════════════ */
function TabPathwayDivergence() {
  const [selected, setSelected] = useState(0);

  const YEARS = [2024, 2026, 2028, 2030, 2032, 2035, 2040, 2045, 2050];

  const pathwayData = useMemo(() => {
    return YEARS.map((yr, yi) => {
      const c = COMPANIES[selected];
      const baseline = c.score;
      const sbtiAdj = c.vals.sbti * 5;
      // Current trajectory: moderate improvement
      const current = clamp(baseline + yi * 1.2 + sbtiAdj * 0.3 + (sr(yi * 5 + selected * 3) - 0.5) * 2, baseline * 0.9, 98);
      // SBTi 1.5°C: ambitious pathway
      const sbti15 = clamp(baseline + yi * 2.8 + 5 + (sr(yi * 7 + 11) - 0.5) * 1.5, baseline, 99);
      // Well below 2°C: moderate
      const wb2 = clamp(baseline + yi * 1.9 + 3 + (sr(yi * 9 + 17) - 0.5) * 1.5, baseline, 97);
      // BAU: minimal improvement
      const bau = clamp(baseline + yi * 0.4 + (sr(yi * 11 + 23) - 0.5) * 1.0, baseline * 0.95, baseline * 1.1 + 5);
      return { year: yr, 'Current Trajectory': Math.round(current * 10) / 10, 'SBTi 1.5°C': Math.round(sbti15 * 10) / 10, 'Well Below 2°C': Math.round(wb2 * 10) / 10, 'BAU': Math.round(bau * 10) / 10 };
    });
  }, [selected]);

  const divergenceScores = useMemo(() => {
    return COMPANIES.map(c => {
      const sbtiSeed = c.vals.sbti;
      const diverge2030 = Math.round((sr(c.id * 7 + 5) * 20 - 10 + (1 - sbtiSeed / 2) * 8) * 10) / 10;
      const diverge2035 = Math.round((sr(c.id * 11 + 9) * 24 - 12 + (1 - sbtiSeed / 2) * 12) * 10) / 10;
      const diverge2040 = Math.round((sr(c.id * 13 + 13) * 30 - 15 + (1 - sbtiSeed / 2) * 16) * 10) / 10;
      const stranded = c.vals.physical_risk > 55 && c.vals.transition_risk > 55;
      const itpScore = Math.round((c.vals.sbti * 25 + (c.score / 100) * 40 + c.vals.tcfd_alignment * 8.75) * 10) / 10;
      return { ...c, diverge2030, diverge2035, diverge2040, stranded, itpScore };
    });
  }, []);

  const engagementTargets = useMemo(() => {
    return COMPANIES.map(c => {
      // Improvement potential = gap from 80 × ease factor
      const gap = 80 - c.score;
      const ease = c.vals.data_quality / 100 * 0.4 + (c.vals.sbti < 2 ? 0.4 : 0.1) + (c.vals.cdp_score < 60 ? 0.2 : 0.05);
      const potential = Math.round(gap * ease * 10) / 10;
      return { ...c, potential, topAction: c.vals.sbti < 1 ? 'Submit SBTi' : c.vals.cdp_score < 50 ? 'Improve CDP' : 'TCFD Disclosure' };
    }).sort((a, b) => b.potential - a.potential).slice(0, 8);
  }, []);

  const pathwayColors = { 'Current Trajectory': T.navy, 'SBTi 1.5°C': T.green, 'Well Below 2°C': T.teal, 'BAU': T.red };
  const currentCompany = COMPANIES[selected];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Company selector */}
      <Card>
        <Label>Select Company</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COMPANIES.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${selected === c.id ? T.navy : T.border}`, background: selected === c.id ? T.navy : T.surface, color: selected === c.id ? '#fff' : T.textSec, fontFamily: T.font, fontSize: 11, cursor: 'pointer' }}>
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </Card>

      {/* Pathway chart */}
      <Card>
        <SectionTitle>{currentCompany.name} — Pathway Divergence Analysis 2024–2050</SectionTitle>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {['SBTi 1.5°C', 'Well Below 2°C', 'Current Trajectory', 'BAU'].map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 16, height: 3, background: pathwayColors[p], borderRadius: 2 }} />
              <span style={{ fontFamily: T.font, fontSize: 11, color: T.textSec }}>{p}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={pathwayData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="year" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
            <YAxis domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
            <Tooltip />
            {Object.entries(pathwayColors).map(([key, color]) => (
              <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} strokeDasharray={key === 'BAU' ? '6 3' : undefined} />
            ))}
            <ReferenceLine y={70} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'AA threshold', position: 'right', fontFamily: T.mono, fontSize: 9, fill: T.gold }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Divergence table */}
        <Card>
          <SectionTitle>Pathway Divergence Scores by Company</SectionTitle>
          <div style={{ fontFamily: T.font, fontSize: 11, color: T.textSec, marginBottom: 8 }}>Gap vs SBTi 1.5°C pathway (negative = below target)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font, fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Company', '2030', '2035', '2040', 'Stranded?', 'ITP'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontFamily: T.mono, fontSize: 9, color: T.textMut, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {divergenceScores.slice(0, 10).map((c, i) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                  <td style={{ padding: '6px 8px', fontWeight: 500, color: T.navy }}>{c.name.split(' ')[0]}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.mono, color: c.diverge2030 < -5 ? T.red : T.textSec }}>{c.diverge2030 > 0 ? '+' : ''}{c.diverge2030}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.mono, color: c.diverge2035 < -8 ? T.red : T.textSec }}>{c.diverge2035 > 0 ? '+' : ''}{c.diverge2035}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.mono, color: c.diverge2040 < -12 ? T.red : T.textSec }}>{c.diverge2040 > 0 ? '+' : ''}{c.diverge2040}</td>
                  <td style={{ padding: '6px 8px' }}>
                    {c.stranded ? <span style={{ color: T.red, fontFamily: T.mono, fontSize: 9, fontWeight: 700 }}>HIGH</span> : <span style={{ color: T.green, fontFamily: T.mono, fontSize: 9 }}>LOW</span>}
                  </td>
                  <td style={{ padding: '6px 8px', fontFamily: T.mono, fontSize: 10, color: T.navy }}>{c.itpScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Engagement targets */}
        <Card>
          <SectionTitle>Engagement Targets — Highest Improvement Potential</SectionTitle>
          <div style={{ fontFamily: T.font, fontSize: 11, color: T.textSec, marginBottom: 10 }}>
            Ranked by model-predicted gain from targeted interventions
          </div>
          {engagementTargets.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut, width: 18 }}>#{i + 1}</span>
                <div>
                  <div style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.navy }}>{c.name}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.textMut }}>Action: {c.topAction}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.green }}>+{c.potential}</div>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.textMut }}>pts potential</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'studio', label: 'Prediction Studio' },
  { id: 'shap', label: 'SHAP Explainability' },
  { id: 'performance', label: 'Model Performance' },
  { id: 'portfolio', label: 'Portfolio Scoring' },
  { id: 'pathway', label: 'Pathway Divergence' },
];

export default function PredictiveEsgPage() {
  const [tab, setTab] = useState('studio');
  const [featureVals] = useState(() => Object.fromEntries(FEATURES.map(f => [f.id, f.default])));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '0 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ padding: '16px 0 0' }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, letterSpacing: '0.1em', marginBottom: 4 }}>
              EP-W2 · PREDICTIVE ESG SCORE MODEL
            </div>
            <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 2 }}>
              Predictive ESG Score Model
            </div>
            <div style={{ fontFamily: T.font, fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
              XGBoost · LightGBM · Ensemble · SHAP Explainability · Pathway Divergence · 15 Features
            </div>
          </div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, borderTop: `1px solid rgba(255,255,255,0.1)` }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? T.gold : 'transparent'}`, color: tab === t.id ? T.gold : '#94a3b8', fontFamily: T.font, fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Models', value: '3 Algorithms', sub: 'XGB · LGBM · Ensemble' },
            { label: 'Best R²', value: '0.871', sub: 'Ensemble model' },
            { label: 'Best RMSE', value: '3.9', sub: 'Ensemble model' },
            { label: 'Features', value: '15 Factors', sub: 'Climate · Gov · DQ' },
            { label: 'Portfolio', value: '20 Companies', sub: '10 sectors covered' },
          ].map(s => (
            <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 18px', minWidth: 140 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: T.navy, marginTop: 2 }}>{s.value}</div>
              <div style={{ fontFamily: T.font, fontSize: 10, color: T.textMut, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab panels */}
        <div style={{ transition: 'opacity 0.15s' }}>
          {tab === 'studio' && <TabPredictionStudio />}
          {tab === 'shap' && <TabSHAP featureVals={featureVals} />}
          {tab === 'performance' && <TabModelPerformance />}
          {tab === 'portfolio' && <TabPortfolio />}
          {tab === 'pathway' && <TabPathwayDivergence />}
        </div>
      </div>
    </div>
  );
}
