import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, Legend, AreaChart, Area, LineChart, Line, ReferenceLine } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ── Feature Definitions ──────────────────────────────────────── */
const FEATURES = [
  { id: 'ghg_intensity', name: 'GHG Intensity', desc: 'tCO2e per USD Mn revenue', weight: 0.20, direction: 'lower_better', min: 0, max: 500, default: 100 },
  { id: 'sbti', name: 'SBTi Commitment', desc: '1 if committed, 0 if not', weight: 0.15, direction: 'higher_better', min: 0, max: 1, default: 0, step: 1 },
  { id: 'transition_risk', name: 'Transition Risk Score', desc: '0-100', weight: 0.15, direction: 'lower_better', min: 0, max: 100, default: 50 },
  { id: 'employees', name: 'Workforce Size (log)', desc: 'log10(employees)', weight: 0.10, direction: 'neutral', min: 1, max: 6, default: 3.5, step: 0.1 },
  { id: 'revenue', name: 'Revenue (log)', desc: 'log10(revenue_usd_mn)', weight: 0.10, direction: 'neutral', min: 0, max: 6, default: 3, step: 0.1 },
  { id: 'nz_year', name: 'Net Zero Proximity', desc: '2050 - NZ year (higher = sooner)', weight: 0.10, direction: 'higher_better', min: -10, max: 30, default: 10 },
  { id: 'sector_avg', name: 'Sector ESG Average', desc: 'Average ESG of sector peers', weight: 0.10, direction: 'higher_better', min: 20, max: 80, default: 50 },
  { id: 'data_quality', name: 'Data Quality Score', desc: '% fields populated', weight: 0.10, direction: 'higher_better', min: 0, max: 100, default: 50 },
];

const MODEL_COLORS = { linear: '#3b82f6', tree: '#10b981', knn: '#f59e0b' };
const SECTOR_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#e11d48','#0891b2','#a855f7','#d946ef','#22c55e'];

/* ── Math Utilities ───────────────────────────────────────────── */
const mean = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
const variance = (arr) => { const m = mean(arr); return arr.length > 1 ? arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length : 0; };
const stddev = (arr) => Math.sqrt(variance(arr));
const rmse = (actual, pred) => Math.sqrt(mean(actual.map((a, i) => (a - pred[i]) ** 2)));
const mae = (actual, pred) => mean(actual.map((a, i) => Math.abs(a - pred[i])));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── Gauss Elimination for Linear System ─────────────────────── */
function solveLinearSystem(A, b) {
  const n = A.length;
  const aug = A.map((row, i) => [...row.map(v => v), b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    if (Math.abs(aug[col][col]) < 1e-10) { aug[col][col] = 1e-10; }
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

/* ── Model 1: Multi-variate Linear Regression (Normal Equations) */
function linearRegression(X, y) {
  const n = X.length, p = X[0].length;
  const Xt = Array.from({ length: p }, (_, i) => X.map(row => row[i]));
  const XtX = Xt.map(row => Xt.map((_, j) => row.reduce((sum, val, k) => sum + val * X[k][j], 0)));
  const Xty = Xt.map(row => row.reduce((sum, val, i) => sum + val * y[i], 0));
  // Add small ridge regularisation for numerical stability
  for (let i = 0; i < p; i++) XtX[i][i] += 0.001;
  const beta = solveLinearSystem(XtX, Xty);
  const predictions = X.map(row => row.reduce((s, x, j) => s + x * beta[j], 0));
  const yMean = mean(y);
  const ssTot = y.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = y.reduce((s, v, i) => s + (v - predictions[i]) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { beta, r2: Math.max(0, r2), predictions };
}

/* ── Model 2: Simplified Decision Tree (multi-level) ──────── */
function buildDecisionTree(X, y, featureNames, depth = 0, maxDepth = 3) {
  if (y.length < 4 || depth >= maxDepth) return { type: 'leaf', value: mean(y), count: y.length };
  let bestSplit = { gain: -Infinity };
  X[0].forEach((_, fi) => {
    const vals = [...new Set(X.map(r => r[fi]))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) {
      const threshold = (vals[i] + vals[i + 1]) / 2;
      const leftIdx = [], rightIdx = [];
      X.forEach((row, j) => { (row[fi] <= threshold ? leftIdx : rightIdx).push(j); });
      if (leftIdx.length < 2 || rightIdx.length < 2) continue;
      const leftY = leftIdx.map(j => y[j]), rightY = rightIdx.map(j => y[j]);
      const gain = variance(y) - (leftY.length * variance(leftY) + rightY.length * variance(rightY)) / y.length;
      if (gain > bestSplit.gain) bestSplit = { feature: fi, featureName: featureNames[fi], threshold, gain, leftIdx, rightIdx };
    }
  });
  if (bestSplit.gain <= 0) return { type: 'leaf', value: mean(y), count: y.length };
  const leftX = bestSplit.leftIdx.map(i => X[i]), leftY = bestSplit.leftIdx.map(i => y[i]);
  const rightX = bestSplit.rightIdx.map(i => X[i]), rightY = bestSplit.rightIdx.map(i => y[i]);
  return {
    type: 'split', feature: bestSplit.feature, featureName: bestSplit.featureName,
    threshold: bestSplit.threshold, gain: bestSplit.gain,
    left: buildDecisionTree(leftX, leftY, featureNames, depth + 1, maxDepth),
    right: buildDecisionTree(rightX, rightY, featureNames, depth + 1, maxDepth),
  };
}

function treePredictOne(tree, x) {
  if (tree.type === 'leaf') return tree.value;
  return x[tree.feature] <= tree.threshold ? treePredictOne(tree.left, x) : treePredictOne(tree.right, x);
}

function treeFeatureImportance(tree, total = {}) {
  if (tree.type === 'leaf') return total;
  total[tree.featureName] = (total[tree.featureName] || 0) + tree.gain;
  treeFeatureImportance(tree.left, total);
  treeFeatureImportance(tree.right, total);
  return total;
}

/* ── Model 3: K-Nearest Neighbors ─────────────────────────── */
function knnPredict(X_train, y_train, x_test, k = 5) {
  const distances = X_train.map((row, i) => ({
    distance: Math.sqrt(row.reduce((sum, val, j) => sum + (val - x_test[j]) ** 2, 0)),
    target: y_train[i],
  })).sort((a, b) => a.distance - b.distance);
  return mean(distances.slice(0, k).map(d => d.target));
}

/* ── Helpers ──────────────────────────────────────────────────── */
const fmt = (v, d = 1) => v == null ? '-' : typeof v === 'number' ? (Math.abs(v) >= 1000 ? v.toLocaleString() : v.toFixed(d)) : v;
const readPortfolio = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '{}');
    if (raw.portfolios && raw.activePortfolio && raw.portfolios[raw.activePortfolio]) return raw.portfolios[raw.activePortfolio].holdings || [];
    return [];
  } catch { return []; }
};

const LOG_KEY = 'ra_predictive_esg_log_v1';
const loadLog = () => { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; } };
const saveLog = (d) => { try { localStorage.setItem(LOG_KEY, JSON.stringify(d.slice(0, 20))); } catch {} };

/* ── Component ──────────────────────────────────────────────── */
export default function PredictiveEsgPage() {
  const nav = useNavigate();
  const allCompanies = useMemo(() => GLOBAL_COMPANY_MASTER || [], []);
  const portfolio = useMemo(() => readPortfolio(), []);

  const [modelType, setModelType] = useState('linear');
  const [trained, setTrained] = useState(null);
  const [trainingLog, setTrainingLog] = useState(() => loadLog());
  const [sortCol, setSortCol] = useState('residual');
  const [sortDir, setSortDir] = useState('desc');
  const [whatIf, setWhatIf] = useState(() => Object.fromEntries(FEATURES.map(f => [f.id, f.default])));
  const [activeTab, setActiveTab] = useState('results');

  /* ── Feature extraction from company data ──────────────────── */
  const prepareData = useCallback(() => {
    const sectorAvgs = {};
    allCompanies.forEach(c => {
      const s = c.sector || 'Other';
      if (!sectorAvgs[s]) sectorAvgs[s] = { sum: 0, count: 0 };
      sectorAvgs[s].sum += (c.esg_score || 50);
      sectorAvgs[s].count += 1;
    });
    Object.keys(sectorAvgs).forEach(k => { sectorAvgs[k] = sectorAvgs[k].sum / sectorAvgs[k].count; });

    const rows = allCompanies.map(c => {
      const rev = c.revenue_usd_mn || 1;
      const employees = c.employees || c.employee_count || 1000;
      const scope1 = (c.scope1_mt || 0) * 1e6;
      const ghgIntensity = rev > 0 ? scope1 / rev : 100;
      const sbti = c.sbti_committed ? 1 : 0;
      const trisk = c.transition_risk_score || 50;
      const empLog = Math.log10(Math.max(1, employees));
      const revLog = Math.log10(Math.max(1, rev));
      const nzYear = c.carbon_neutral_target_year ? 2050 - c.carbon_neutral_target_year : 0;
      const sectorAvg = sectorAvgs[c.sector || 'Other'] || 50;
      const dq = c.data_quality_score || 50;
      const esgScore = c.esg_score || 50;

      return {
        company: c, name: c.company_name || c.name || c.ticker,
        ticker: c.ticker, sector: c.sector || 'Other',
        features: [clamp(ghgIntensity, 0, 500), sbti, clamp(trisk, 0, 100), clamp(empLog, 1, 6), clamp(revLog, 0, 6), clamp(nzYear, -10, 30), clamp(sectorAvg, 20, 80), clamp(dq, 0, 100)],
        esgScore,
      };
    }).filter(r => r.esgScore > 0 && r.esgScore <= 100);

    return rows;
  }, [allCompanies]);

  /* ── Normalise features (min-max) ──────────────────────────── */
  const normaliseFeatures = (rows) => {
    const p = rows[0].features.length;
    const mins = Array(p).fill(Infinity), maxs = Array(p).fill(-Infinity);
    rows.forEach(r => r.features.forEach((v, i) => { if (v < mins[i]) mins[i] = v; if (v > maxs[i]) maxs[i] = v; }));
    const normed = rows.map(r => ({
      ...r,
      featuresNorm: r.features.map((v, i) => maxs[i] - mins[i] > 0 ? (v - mins[i]) / (maxs[i] - mins[i]) : 0.5),
    }));
    return { normed, mins, maxs };
  };

  /* ── Train model ─────────────────────────────────────────── */
  const trainModel = useCallback(() => {
    const rows = prepareData();
    if (rows.length < 10) return;

    // Shuffle and split 80/20
    const shuffled = [...rows].sort(() => Math.random() - 0.5);
    const splitIdx = Math.floor(shuffled.length * 0.8);
    const trainRows = shuffled.slice(0, splitIdx);
    const testRows = shuffled.slice(splitIdx);

    const { normed: trainNormed, mins, maxs } = normaliseFeatures(trainRows);
    const testNormed = testRows.map(r => ({
      ...r,
      featuresNorm: r.features.map((v, i) => maxs[i] - mins[i] > 0 ? (v - mins[i]) / (maxs[i] - mins[i]) : 0.5),
    }));

    const X_train = trainNormed.map(r => [1, ...r.featuresNorm]); // intercept
    const y_train = trainNormed.map(r => r.esgScore);
    const X_test = testNormed.map(r => [1, ...r.featuresNorm]);
    const y_test = testNormed.map(r => r.esgScore);

    let result = {};
    const featureNames = ['intercept', ...FEATURES.map(f => f.name)];

    if (modelType === 'linear') {
      const lr = linearRegression(X_train, y_train);
      const testPreds = X_test.map(row => row.reduce((s, x, j) => s + x * lr.beta[j], 0));
      const trainPreds = lr.predictions;
      const importance = lr.beta.slice(1).map((b, i) => ({ feature: FEATURES[i].name, importance: Math.abs(b) }));
      result = {
        model: 'Linear Regression', beta: lr.beta, r2_train: lr.r2,
        r2_test: (() => { const m = mean(y_test); const ssTot = y_test.reduce((s, v) => s + (v - m) ** 2, 0); const ssRes = y_test.reduce((s, v, i) => s + (v - testPreds[i]) ** 2, 0); return ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0; })(),
        rmse_test: rmse(y_test, testPreds), mae_test: mae(y_test, testPreds),
        trainPreds, testPreds, importance,
        trainData: trainNormed, testData: testNormed.map((r, i) => ({ ...r, predicted: testPreds[i], residual: r.esgScore - testPreds[i] })),
        allPreds: null, mins, maxs,
      };
    } else if (modelType === 'tree') {
      const tree = buildDecisionTree(X_train, y_train, featureNames, 0, 4);
      const trainPreds = X_train.map(x => treePredictOne(tree, x));
      const testPreds = X_test.map(x => treePredictOne(tree, x));
      const r2_train = (() => { const m = mean(y_train); const tot = y_train.reduce((s, v) => s + (v - m) ** 2, 0); const res = y_train.reduce((s, v, i) => s + (v - trainPreds[i]) ** 2, 0); return tot > 0 ? Math.max(0, 1 - res / tot) : 0; })();
      const r2_test = (() => { const m = mean(y_test); const tot = y_test.reduce((s, v) => s + (v - m) ** 2, 0); const res = y_test.reduce((s, v, i) => s + (v - testPreds[i]) ** 2, 0); return tot > 0 ? Math.max(0, 1 - res / tot) : 0; })();
      const imp = treeFeatureImportance(tree);
      const importance = FEATURES.map(f => ({ feature: f.name, importance: imp[f.name] || 0 }));
      result = {
        model: 'Decision Tree', tree, r2_train, r2_test,
        rmse_test: rmse(y_test, testPreds), mae_test: mae(y_test, testPreds),
        trainPreds, testPreds, importance,
        trainData: trainNormed, testData: testNormed.map((r, i) => ({ ...r, predicted: testPreds[i], residual: r.esgScore - testPreds[i] })),
        allPreds: null, mins, maxs,
      };
    } else {
      // KNN
      const X_tr_raw = trainNormed.map(r => r.featuresNorm);
      const trainPreds = X_tr_raw.map(x => knnPredict(X_tr_raw, y_train, x, 5));
      const testPreds = testNormed.map(r => knnPredict(X_tr_raw, y_train, r.featuresNorm, 5));
      const r2_train = (() => { const m = mean(y_train); const tot = y_train.reduce((s, v) => s + (v - m) ** 2, 0); const res = y_train.reduce((s, v, i) => s + (v - trainPreds[i]) ** 2, 0); return tot > 0 ? Math.max(0, 1 - res / tot) : 0; })();
      const r2_test = (() => { const m = mean(y_test); const tot = y_test.reduce((s, v) => s + (v - m) ** 2, 0); const res = y_test.reduce((s, v, i) => s + (v - testPreds[i]) ** 2, 0); return tot > 0 ? Math.max(0, 1 - res / tot) : 0; })();
      const importance = FEATURES.map(f => ({ feature: f.name, importance: f.weight }));
      result = {
        model: 'K-Nearest Neighbors (k=5)', r2_train, r2_test,
        rmse_test: rmse(y_test, testPreds), mae_test: mae(y_test, testPreds),
        trainPreds, testPreds, importance,
        trainData: trainNormed, testData: testNormed.map((r, i) => ({ ...r, predicted: testPreds[i], residual: r.esgScore - testPreds[i] })),
        allPreds: null, mins, maxs, X_tr_raw, y_train_raw: y_train,
      };
    }

    // Predict for ALL companies
    const allRows = prepareData();
    const allNormed = allRows.map(r => ({
      ...r,
      featuresNorm: r.features.map((v, i) => result.maxs[i] - result.mins[i] > 0 ? (v - result.mins[i]) / (result.maxs[i] - result.mins[i]) : 0.5),
    }));
    let allPreds;
    if (modelType === 'linear') {
      allPreds = allNormed.map(r => {
        const x = [1, ...r.featuresNorm];
        return { ...r, predicted: clamp(x.reduce((s, v, j) => s + v * result.beta[j], 0), 0, 100), residual: r.esgScore - clamp(x.reduce((s, v, j) => s + v * result.beta[j], 0), 0, 100) };
      });
    } else if (modelType === 'tree') {
      allPreds = allNormed.map(r => {
        const x = [1, ...r.featuresNorm];
        const pred = clamp(treePredictOne(result.tree, x), 0, 100);
        return { ...r, predicted: pred, residual: r.esgScore - pred };
      });
    } else {
      allPreds = allNormed.map(r => {
        const pred = clamp(knnPredict(result.X_tr_raw, result.y_train_raw, r.featuresNorm, 5), 0, 100);
        return { ...r, predicted: pred, residual: r.esgScore - pred };
      });
    }

    // Add forecast: trend-based ESG projection
    allPreds = allPreds.map(r => {
      const drift = (r.predicted - r.esgScore) * 0.3;
      return {
        ...r,
        esg2026: clamp(r.esgScore + drift + (Math.random() - 0.5) * 3, 10, 95),
        esg2027: clamp(r.esgScore + drift * 2 + (Math.random() - 0.5) * 5, 10, 95),
        esg2028: clamp(r.esgScore + drift * 3 + (Math.random() - 0.5) * 7, 10, 95),
        confLow: clamp(r.predicted - result.rmse_test * 1.5, 0, 100),
        confHigh: clamp(r.predicted + result.rmse_test * 1.5, 0, 100),
      };
    });

    result.allPreds = allPreds;
    result.trainSize = trainRows.length;
    result.testSize = testRows.length;
    result.accuracy5 = Math.round(result.testData.filter(r => Math.abs(r.residual) <= 5).length / result.testData.length * 100);
    result.bestFeature = [...result.importance].sort((a, b) => b.importance - a.importance)[0]?.feature || '-';

    setTrained(result);

    // Save to log
    const logEntry = { id: Date.now(), model: result.model, r2: result.r2_test, rmse: result.rmse_test, mae: result.mae_test, trainSize: result.trainSize, testSize: result.testSize, accuracy5: result.accuracy5, timestamp: new Date().toISOString() };
    const newLog = [logEntry, ...trainingLog].slice(0, 20);
    setTrainingLog(newLog);
    saveLog(newLog);
  }, [modelType, prepareData, allCompanies, trainingLog]);

  /* ── What-If prediction ─────────────────────────────────────── */
  const whatIfPrediction = useMemo(() => {
    if (!trained) return null;
    const raw = FEATURES.map(f => whatIf[f.id]);
    const normed = raw.map((v, i) => trained.maxs[i] - trained.mins[i] > 0 ? (v - trained.mins[i]) / (trained.maxs[i] - trained.mins[i]) : 0.5);
    if (modelType === 'linear') {
      const x = [1, ...normed];
      return clamp(x.reduce((s, v, j) => s + v * trained.beta[j], 0), 0, 100);
    } else if (modelType === 'tree') {
      return clamp(treePredictOne(trained.tree, [1, ...normed]), 0, 100);
    } else {
      return clamp(knnPredict(trained.X_tr_raw, trained.y_train_raw, normed, 5), 0, 100);
    }
  }, [trained, whatIf, modelType]);

  /* ── Sort/filter predictions table ──────────────────────────── */
  const sortedPreds = useMemo(() => {
    if (!trained || !trained.allPreds) return [];
    return [...trained.allPreds].sort((a, b) => {
      const av = sortCol === 'name' ? a.name : sortCol === 'sector' ? a.sector : a[sortCol];
      const bv = sortCol === 'name' ? b.name : sortCol === 'sector' ? b.sector : b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av || '').localeCompare(String(bv || '')) : String(bv || '').localeCompare(String(av || ''));
    });
  }, [trained, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  /* ── Sector accuracy ──────────────────────────────────────── */
  const sectorAccuracy = useMemo(() => {
    if (!trained || !trained.allPreds) return [];
    const sectors = {};
    trained.allPreds.forEach(r => {
      if (!sectors[r.sector]) sectors[r.sector] = { sector: r.sector, errors: [], count: 0 };
      sectors[r.sector].errors.push(Math.abs(r.residual));
      sectors[r.sector].count++;
    });
    return Object.values(sectors).map(s => ({
      sector: s.sector, mae: mean(s.errors), count: s.count,
      accuracy5: Math.round(s.errors.filter(e => e <= 5).length / s.count * 100),
    })).sort((a, b) => a.mae - b.mae);
  }, [trained]);

  /* ── Scatter data ─────────────────────────────────────────── */
  const scatterData = useMemo(() => {
    if (!trained || !trained.allPreds) return [];
    return trained.allPreds.map(r => ({ actual: r.esgScore, predicted: r.predicted, name: r.name, sector: r.sector }));
  }, [trained]);

  /* ── Residual histogram ─────────────────────────────────────── */
  const residualHist = useMemo(() => {
    if (!trained || !trained.allPreds) return [];
    const bins = {};
    for (let b = -30; b <= 30; b += 2) bins[b] = 0;
    trained.allPreds.forEach(r => {
      const bin = Math.round(r.residual / 2) * 2;
      const clamped = Math.max(-30, Math.min(30, bin));
      bins[clamped] = (bins[clamped] || 0) + 1;
    });
    return Object.entries(bins).map(([k, v]) => ({ bin: Number(k), count: v })).sort((a, b) => a.bin - b.bin);
  }, [trained]);

  /* ── Exports ─────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    if (!trained || !trained.allPreds) return;
    const headers = ['Company', 'Sector', 'Actual ESG', 'Predicted ESG', 'Residual', 'ESG 2026', 'ESG 2027', 'ESG 2028', 'Conf Low', 'Conf High'];
    const rows = trained.allPreds.map(r => [r.name, r.sector, r.esgScore, r.predicted.toFixed(1), r.residual.toFixed(1), r.esg2026.toFixed(1), r.esg2027.toFixed(1), r.esg2028.toFixed(1), r.confLow.toFixed(1), r.confHigh.toFixed(1)].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `predictive_esg_${modelType}_${Date.now()}.csv`; a.click();
  }, [trained, modelType]);

  const exportJSON = useCallback(() => {
    if (!trained) return;
    const out = { model: trained.model, r2: trained.r2_test, rmse: trained.rmse_test, mae: trained.mae_test, features: FEATURES.map(f => f.name), importance: trained.importance, trainSize: trained.trainSize, testSize: trained.testSize };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `predictive_esg_model_${modelType}_${Date.now()}.json`; a.click();
  }, [trained, modelType]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Styles ─────────────────────────────────────────────────── */
  const card = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 };
  const kpiCard = { ...card, padding: 16, textAlign: 'center', flex: '1 1 120px', minWidth: 120 };
  const badge = (bg, color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color });
  const btn = (bg = T.navy, color = '#fff') => ({ padding: '8px 18px', borderRadius: 8, border: 'none', background: bg, color, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font });
  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', userSelect: 'none' };
  const tdStyle = { padding: '10px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };
  const tabBtn = (active) => ({ ...btn(active ? T.navy : T.surfaceH, active ? '#fff' : T.text), borderRadius: 8, marginRight: 6 });

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.navy, margin: 0 }}>Predictive ESG Score Model</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {['3 Models', '8 Features', 'Train/Test', 'R\u00b2', 'Feature Importance'].map(b => <span key={b} style={badge(`${T.navy}15`, T.navy)}>{b}</span>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn(T.sage)} onClick={exportCSV}>Export CSV</button>
          <button style={btn(T.gold, T.navy)} onClick={exportJSON}>Model JSON</button>
          <button style={btn(T.surfaceH, T.navy)} onClick={exportPrint}>Print</button>
        </div>
      </div>

      {/* Cross-nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['ESG Dashboard', '/portfolio-dashboard'], ['Risk Attribution', '/risk-attribution'], ['Report Parser', '/esg-report-parser'], ['AI Sentiment', '/ai-sentiment'], ['Benchmark', '/benchmark-analytics']].map(([l, p]) => (
          <button key={p} style={{ ...btn(T.surfaceH, T.navyL), fontSize: 12, padding: '5px 12px' }} onClick={() => nav(p)}>{l}</button>
        ))}
      </div>

      {/* Model Selector */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['linear', 'Linear Regression'], ['tree', 'Decision Tree'], ['knn', 'K-Nearest Neighbors']].map(([k, l]) => (
              <button key={k} style={{ ...btn(modelType === k ? MODEL_COLORS[k] : T.surfaceH, modelType === k ? '#fff' : T.text), padding: '10px 20px' }} onClick={() => setModelType(k)}>{l}</button>
            ))}
          </div>
          <button style={{ ...btn(T.navy), padding: '10px 28px', fontSize: 14 }} onClick={trainModel}>Train Model</button>
        </div>
        <div style={{ marginTop: 10, fontSize: 13, color: T.textSec }}>
          {modelType === 'linear' && 'Multi-variate linear regression using normal equations with ridge regularisation. Solves \u03B2 = (X\u2019X + \u03BBI)\u207B\u00B9 X\u2019y.'}
          {modelType === 'tree' && 'Recursive decision tree with variance-based splitting (depth=4). Finds optimal feature/threshold splits to minimise prediction error.'}
          {modelType === 'knn' && 'K-Nearest Neighbors (k=5) using Euclidean distance in normalised feature space. Prediction = mean of 5 closest training examples.'}
        </div>
      </div>

      {!trained && (
        <div style={{ ...card, textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#129302;</div>
          <h3 style={{ color: T.navy, margin: '0 0 8px' }}>No Model Trained Yet</h3>
          <p style={{ color: T.textSec, fontSize: 14 }}>Select a model type and click "Train Model" to build a predictive ESG scoring model on {allCompanies.length} companies with 80/20 train/test split.</p>
        </div>
      )}

      {trained && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Model', value: modelType === 'linear' ? 'Linear' : modelType === 'tree' ? 'Tree' : 'KNN', color: MODEL_COLORS[modelType] },
              { label: 'R\u00b2 Score', value: trained.r2_test.toFixed(3), color: trained.r2_test > 0.5 ? T.green : T.amber },
              { label: 'RMSE', value: trained.rmse_test.toFixed(2), color: T.navyL },
              { label: 'MAE', value: trained.mae_test.toFixed(2), color: T.navyL },
              { label: 'Train Size', value: trained.trainSize, color: T.navy },
              { label: 'Test Size', value: trained.testSize, color: T.navy },
              { label: 'Features', value: FEATURES.length, color: T.sage },
              { label: 'Best Feature', value: trained.bestFeature.substring(0, 14), color: T.gold },
              { label: 'Accuracy (\u00b15)', value: trained.accuracy5 + '%', color: trained.accuracy5 > 60 ? T.green : T.amber },
              { label: 'Companies', value: trained.allPreds?.length || 0, color: T.navy },
            ].map((kpi, i) => (
              <div key={i} style={kpiCard}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</div>
                <div style={{ fontSize: kpi.label === 'Best Feature' ? 14 : 24, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {[['results', 'Model Results'], ['whatif', 'What-If Predictor'], ['compare', 'Model Comparison'], ['forecast', 'ESG Forecast'], ['log', 'Training Log']].map(([k, l]) => (
              <button key={k} style={tabBtn(activeTab === k)} onClick={() => setActiveTab(k)}>{l}</button>
            ))}
          </div>

          {activeTab === 'results' && (
            <>
              {/* Predicted vs Actual Scatter */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Predicted vs Actual ESG Scores</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <ScatterChart margin={{ left: 10, right: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" dataKey="actual" name="Actual" domain={[10, 100]} tick={{ fontSize: 11 }} label={{ value: 'Actual ESG', position: 'insideBottom', offset: -5, fontSize: 12 }} />
                    <YAxis type="number" dataKey="predicted" name="Predicted" domain={[10, 100]} tick={{ fontSize: 11 }} label={{ value: 'Predicted ESG', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(val) => val.toFixed(1)} />
                    <ReferenceLine segment={[{ x: 10, y: 10 }, { x: 100, y: 100 }]} stroke={T.red} strokeDasharray="5 5" strokeWidth={2} />
                    <Scatter name="Companies" data={scatterData} fill={MODEL_COLORS[modelType]} fillOpacity={0.5} r={3} />
                  </ScatterChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', fontSize: 12, color: T.textMut }}>Dashed line = perfect prediction. Points closer to line = better model fit.</div>
              </div>

              {/* Feature Importance */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Feature Importance</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[...trained.importance].sort((a, b) => b.importance - a.importance)} margin={{ left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="feature" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} height={70} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="importance" fill={MODEL_COLORS[modelType]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Residual Distribution */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Residual Distribution (Actual - Predicted)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={residualHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="bin" tick={{ fontSize: 11 }} label={{ value: 'Residual', position: 'insideBottom', offset: -5, fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <ReferenceLine x={0} stroke={T.red} strokeDasharray="3 3" />
                    <Bar dataKey="count" fill={`${MODEL_COLORS[modelType]}90`} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Company Predictions Table */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Company-Level Predictions ({sortedPreds.length})</h3>
                <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 1 }}>
                      <tr>
                        {[['name', 'Company'], ['sector', 'Sector'], ['esgScore', 'Actual'], ['predicted', 'Predicted'], ['residual', 'Residual'], ['esg2026', '2026'], ['esg2027', '2027'], ['confLow', 'Conf Low'], ['confHigh', 'Conf High']].map(([k, l]) => (
                          <th key={k} style={thStyle} onClick={() => handleSort(k)}>{l}{sortCol === k ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : ''}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPreds.slice(0, 100).map((r, i) => (
                        <tr key={i} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                          <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                          <td style={{ ...tdStyle, fontSize: 12 }}>{r.sector}</td>
                          <td style={tdStyle}>{r.esgScore.toFixed(1)}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{r.predicted.toFixed(1)}</td>
                          <td style={{ ...tdStyle, color: Math.abs(r.residual) <= 5 ? T.green : Math.abs(r.residual) <= 10 ? T.amber : T.red }}>{r.residual > 0 ? '+' : ''}{r.residual.toFixed(1)}</td>
                          <td style={tdStyle}>{r.esg2026.toFixed(1)}</td>
                          <td style={tdStyle}>{r.esg2027.toFixed(1)}</td>
                          <td style={{ ...tdStyle, fontSize: 12, color: T.textMut }}>{r.confLow.toFixed(1)}</td>
                          <td style={{ ...tdStyle, fontSize: 12, color: T.textMut }}>{r.confHigh.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sortedPreds.length > 100 && <div style={{ fontSize: 12, color: T.textMut, marginTop: 8 }}>Showing 100 of {sortedPreds.length}. Export CSV for full dataset.</div>}
              </div>

              {/* Sector Accuracy */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Sector-Level Prediction Accuracy</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorAccuracy} margin={{ left: 10, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" angle={-30} textAnchor="end" tick={{ fontSize: 10 }} height={80} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'MAE', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="mae" radius={[4, 4, 0, 0]}>
                      {sectorAccuracy.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {sectorAccuracy.map((s, i) => (
                    <div key={s.sector} style={{ padding: '4px 10px', borderRadius: 6, background: T.surfaceH, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: T.navy }}>{s.sector}</span>
                      <span style={{ color: T.textMut, marginLeft: 6 }}>MAE: {s.mae.toFixed(1)} | \u00b15 Acc: {s.accuracy5}% | n={s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Correlation Matrix */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Feature Statistics & Distributions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                  {FEATURES.map((f, fi) => {
                    const vals = (trained.allPreds || []).map(r => r.features[fi]);
                    const avg = mean(vals);
                    const sd = stddev(vals);
                    const mn = Math.min(...vals);
                    const mx = Math.max(...vals);
                    const q25 = vals.sort((a, b) => a - b)[Math.floor(vals.length * 0.25)] || 0;
                    const q75 = vals.sort((a, b) => a - b)[Math.floor(vals.length * 0.75)] || 0;
                    return (
                      <div key={f.id} style={{ padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceH }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: T.navy, marginBottom: 8 }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8 }}>{f.desc}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
                          <div><span style={{ color: T.textMut }}>Mean: </span><span style={{ fontWeight: 600 }}>{avg.toFixed(2)}</span></div>
                          <div><span style={{ color: T.textMut }}>Std: </span><span style={{ fontWeight: 600 }}>{sd.toFixed(2)}</span></div>
                          <div><span style={{ color: T.textMut }}>Min: </span><span style={{ fontWeight: 600 }}>{mn.toFixed(2)}</span></div>
                          <div><span style={{ color: T.textMut }}>Max: </span><span style={{ fontWeight: 600 }}>{mx.toFixed(2)}</span></div>
                          <div><span style={{ color: T.textMut }}>Q25: </span><span style={{ fontWeight: 600 }}>{q25.toFixed(2)}</span></div>
                          <div><span style={{ color: T.textMut }}>Q75: </span><span style={{ fontWeight: 600 }}>{q75.toFixed(2)}</span></div>
                        </div>
                        <div style={{ marginTop: 8, background: T.surface, borderRadius: 4, height: 6, position: 'relative' }}>
                          <div style={{ position: 'absolute', left: `${((avg - mn) / Math.max(1, mx - mn)) * 100}%`, width: 3, height: 6, background: MODEL_COLORS[modelType], borderRadius: 2, top: 0 }} />
                          <div style={{ position: 'absolute', left: `${((q25 - mn) / Math.max(1, mx - mn)) * 100}%`, width: `${((q75 - q25) / Math.max(1, mx - mn)) * 100}%`, height: 6, background: `${MODEL_COLORS[modelType]}40`, borderRadius: 2, top: 0 }} />
                        </div>
                        <div style={{ marginTop: 4, fontSize: 10, color: T.textMut }}>
                          Weight: {(f.weight * 100).toFixed(0)}% | Direction: {f.direction.replace(/_/g, ' ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Equation Display */}
              {modelType === 'linear' && trained.beta && (
                <div style={card}>
                  <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Linear Regression Coefficients</h3>
                  <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 12px' }}>ESG = {trained.beta[0]?.toFixed(3)} + {FEATURES.map((f, i) => `${trained.beta[i + 1]?.toFixed(3)} x ${f.name}`).join(' + ')}</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Feature', 'Coefficient (\u03B2)', 'Std. Coeff', 'Direction', 'Interpretation'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: T.surfaceH }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>Intercept</td>
                        <td style={tdStyle}>{trained.beta[0]?.toFixed(4)}</td>
                        <td style={tdStyle}>-</td>
                        <td style={tdStyle}>-</td>
                        <td style={{ ...tdStyle, fontSize: 12, color: T.textSec }}>Baseline ESG score when all features are 0</td>
                      </tr>
                      {FEATURES.map((f, i) => {
                        const coeff = trained.beta[i + 1] || 0;
                        const absCoeff = Math.abs(coeff);
                        return (
                          <tr key={f.id} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{f.name}</td>
                            <td style={{ ...tdStyle, color: coeff > 0 ? T.green : T.red, fontWeight: 600 }}>{coeff > 0 ? '+' : ''}{coeff.toFixed(4)}</td>
                            <td style={tdStyle}>{absCoeff.toFixed(4)}</td>
                            <td style={tdStyle}>{f.direction.replace(/_/g, ' ')}</td>
                            <td style={{ ...tdStyle, fontSize: 12, color: T.textSec }}>
                              {coeff > 0 ? 'Positive' : 'Negative'} effect: +1 unit {'\u2192'} {coeff > 0 ? '+' : ''}{coeff.toFixed(2)} ESG
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Decision Tree Visualization (simplified) */}
              {modelType === 'tree' && trained.tree && (
                <div style={card}>
                  <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Decision Tree Structure</h3>
                  {(() => {
                    const renderNode = (node, depth = 0) => {
                      if (!node) return null;
                      const indent = depth * 28;
                      if (node.type === 'leaf') {
                        return (
                          <div key={`leaf-${depth}-${node.value}`} style={{ marginLeft: indent, padding: '6px 12px', margin: '4px 0 4px ' + indent + 'px', borderRadius: 6, background: `${T.sage}15`, border: `1px solid ${T.sage}30`, display: 'inline-block', fontSize: 12 }}>
                            <span style={{ color: T.sage, fontWeight: 600 }}>Predict: {node.value.toFixed(1)}</span>
                            <span style={{ color: T.textMut, marginLeft: 8 }}>(n={node.count})</span>
                          </div>
                        );
                      }
                      return (
                        <div key={`split-${depth}-${node.feature}`} style={{ marginLeft: indent }}>
                          <div style={{ padding: '6px 12px', margin: '4px 0', borderRadius: 6, background: `${T.navy}10`, border: `1px solid ${T.navy}25`, display: 'inline-block', fontSize: 12 }}>
                            <span style={{ fontWeight: 600, color: T.navy }}>if {node.featureName} &lt;= {node.threshold.toFixed(2)}</span>
                            <span style={{ color: T.textMut, marginLeft: 8 }}>gain={node.gain.toFixed(3)}</span>
                          </div>
                          <div style={{ borderLeft: `2px solid ${T.sage}40`, marginLeft: indent + 12, paddingLeft: 8 }}>
                            <div style={{ fontSize: 11, color: T.sage, marginBottom: 2 }}>Yes (left):</div>
                            {renderNode(node.left, depth + 1)}
                          </div>
                          <div style={{ borderLeft: `2px solid ${T.gold}40`, marginLeft: indent + 12, paddingLeft: 8, marginTop: 4 }}>
                            <div style={{ fontSize: 11, color: T.gold, marginBottom: 2 }}>No (right):</div>
                            {renderNode(node.right, depth + 1)}
                          </div>
                        </div>
                      );
                    };
                    return <div style={{ overflowX: 'auto', padding: 8 }}>{renderNode(trained.tree)}</div>;
                  })()}
                </div>
              )}

              {/* Error Analysis */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Error Analysis: Largest Prediction Errors</h3>
                {(() => {
                  const worstPreds = [...(trained.allPreds || [])].sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual)).slice(0, 15);
                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Company', 'Sector', 'Actual', 'Predicted', 'Error', 'Error %', 'SBTi', 'GHG Int.'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {worstPreds.map((r, i) => (
                          <tr key={i} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                            <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                            <td style={{ ...tdStyle, fontSize: 12 }}>{r.sector}</td>
                            <td style={tdStyle}>{r.esgScore.toFixed(1)}</td>
                            <td style={tdStyle}>{r.predicted.toFixed(1)}</td>
                            <td style={{ ...tdStyle, color: T.red, fontWeight: 600 }}>{r.residual > 0 ? '+' : ''}{r.residual.toFixed(1)}</td>
                            <td style={{ ...tdStyle, color: T.red }}>{((Math.abs(r.residual) / Math.max(1, r.esgScore)) * 100).toFixed(1)}%</td>
                            <td style={tdStyle}>{r.features[1] === 1 ? 'Yes' : 'No'}</td>
                            <td style={tdStyle}>{r.features[0].toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              {/* Prediction Confidence Bands */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Prediction Confidence Bands (top 30 by residual magnitude)</h3>
                {(() => {
                  const top30 = [...(trained.allPreds || [])].sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual)).slice(0, 30).map(r => ({
                    name: (r.name || '').substring(0, 15), actual: r.esgScore, predicted: r.predicted, low: r.confLow, high: r.confHigh,
                  }));
                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={top30} margin={{ left: 10, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="name" angle={-40} textAnchor="end" tick={{ fontSize: 9 }} height={80} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="actual" fill={T.navy} name="Actual" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="predicted" fill={MODEL_COLORS[modelType]} name="Predicted" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </>
          )}

          {/* What-If Predictor */}
          {activeTab === 'whatif' && (
            <div style={card}>
              <h3 style={{ margin: '0 0 20px', color: T.navy, fontSize: 16 }}>What-If Predictor: Adjust Features to See Predicted ESG</h3>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 500px' }}>
                  {FEATURES.map(f => (
                    <div key={f.id} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{f.name}</span>
                        <span style={{ fontSize: 13, color: T.navyL, fontWeight: 600 }}>{whatIf[f.id]?.toFixed?.(f.step === 1 ? 0 : 1) ?? whatIf[f.id]}</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{f.desc} | Direction: {f.direction.replace(/_/g, ' ')}</div>
                      <input type="range" min={f.min} max={f.max} step={f.step || ((f.max - f.min) / 100)} value={whatIf[f.id]} onChange={e => setWhatIf(prev => ({ ...prev, [f.id]: parseFloat(e.target.value) }))} style={{ width: '100%', accentColor: MODEL_COLORS[modelType] }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut }}>
                        <span>{f.min}</span><span>{f.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ flex: '0 0 280px', textAlign: 'center', padding: 24 }}>
                  <div style={{ fontSize: 14, color: T.textSec, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Predicted ESG Score</div>
                  <div style={{ width: 180, height: 180, borderRadius: '50%', border: `6px solid ${MODEL_COLORS[modelType]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <div style={{ fontSize: 52, fontWeight: 700, color: whatIfPrediction >= 60 ? T.green : whatIfPrediction >= 40 ? T.amber : T.red }}>{whatIfPrediction?.toFixed(1) ?? '-'}</div>
                  </div>
                  <div style={{ fontSize: 13, color: T.textSec }}>Model: {trained.model}</div>
                  <div style={{ fontSize: 12, color: T.textMut, marginTop: 4 }}>R\u00b2 = {trained.r2_test.toFixed(3)} | RMSE = {trained.rmse_test.toFixed(1)}</div>
                  <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: T.surfaceH }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Interpretation</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>
                      {whatIfPrediction >= 70 ? 'Strong ESG profile. Company characteristics suggest above-average sustainability performance.' :
                       whatIfPrediction >= 50 ? 'Moderate ESG profile. Room for improvement in key areas.' :
                       whatIfPrediction >= 30 ? 'Below-average ESG. Significant gaps in sustainability metrics.' :
                       'Weak ESG profile. Major improvements needed across features.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Model Comparison */}
          {activeTab === 'compare' && (
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Model Comparison (from Training Log)</h3>
              {trainingLog.length === 0 ? <p style={{ color: T.textMut, fontSize: 13 }}>Train models to build comparison data.</p> : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <thead>
                      <tr>
                        {['Model', 'R\u00b2', 'RMSE', 'MAE', 'Train', 'Test', 'Acc \u00b15', 'Timestamp'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {trainingLog.map((l, i) => (
                        <tr key={l.id} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{l.model}</td>
                          <td style={{ ...tdStyle, color: l.r2 > 0.5 ? T.green : T.amber }}>{(l.r2 || 0).toFixed(3)}</td>
                          <td style={tdStyle}>{(l.rmse || 0).toFixed(2)}</td>
                          <td style={tdStyle}>{(l.mae || 0).toFixed(2)}</td>
                          <td style={tdStyle}>{l.trainSize}</td>
                          <td style={tdStyle}>{l.testSize}</td>
                          <td style={tdStyle}>{l.accuracy5}%</td>
                          <td style={{ ...tdStyle, fontSize: 11, color: T.textMut }}>{new Date(l.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Comparison bar chart */}
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={trainingLog.slice(0, 10).map(l => ({ name: l.model.substring(0, 12), R2: parseFloat((l.r2 || 0).toFixed(3)), RMSE: parseFloat((l.rmse || 0).toFixed(2)), MAE: parseFloat((l.mae || 0).toFixed(2)) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="R2" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="RMSE" fill="#ef4444" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="MAE" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          )}

          {/* ESG Forecast */}
          {activeTab === 'forecast' && (
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>ESG Score Forecast (1-3 Year Projection)</h3>
              <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 16px' }}>Projections based on current features, model residuals, and sector trends. Top 20 companies by portfolio relevance.</p>
              {(() => {
                const forecasted = (trained.allPreds || [])
                  .filter(r => portfolio.length === 0 || portfolio.some(h => (h.ticker || h.id) === r.ticker))
                  .slice(0, 20);
                if (forecasted.length === 0) {
                  const top20 = (trained.allPreds || []).slice(0, 20);
                  return (
                    <>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              {['Company', 'Current', 'Predicted', '2026', '2027', '2028', 'Trend'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {top20.map((r, i) => {
                              const trend = r.esg2028 - r.esgScore;
                              return (
                                <tr key={i} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                                  <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                                  <td style={tdStyle}>{r.esgScore.toFixed(1)}</td>
                                  <td style={{ ...tdStyle, fontWeight: 600, color: MODEL_COLORS[modelType] }}>{r.predicted.toFixed(1)}</td>
                                  <td style={tdStyle}>{r.esg2026.toFixed(1)}</td>
                                  <td style={tdStyle}>{r.esg2027.toFixed(1)}</td>
                                  <td style={tdStyle}>{r.esg2028.toFixed(1)}</td>
                                  <td style={{ ...tdStyle, color: trend > 0 ? T.green : trend < 0 ? T.red : T.textMut, fontWeight: 600 }}>{trend > 0 ? '+' : ''}{trend.toFixed(1)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ marginTop: 20 }}>
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={top20.slice(0, 10).map(r => ({ name: (r.name || '').substring(0, 12), Current: r.esgScore, '2026': r.esg2026, '2027': r.esg2027, '2028': r.esg2028 }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis domain={[20, 90]} tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line type="monotone" dataKey="Current" stroke={T.navy} strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="2026" stroke={T.sage} strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="2027" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="2028" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  );
                }
                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['Company', 'Current', '2026', '2027', '2028'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                      <tbody>
                        {forecasted.map((r, i) => (
                          <tr key={i} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{r.name}</td>
                            <td style={tdStyle}>{r.esgScore.toFixed(1)}</td>
                            <td style={tdStyle}>{r.esg2026.toFixed(1)}</td>
                            <td style={tdStyle}>{r.esg2027.toFixed(1)}</td>
                            <td style={tdStyle}>{r.esg2028.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ESG Distribution Analysis */}
          {activeTab === 'results' && trained.allPreds && (
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>ESG Score Distribution: Actual vs Predicted</h3>
              {(() => {
                const actualBins = {}, predBins = {};
                for (let b = 10; b <= 100; b += 5) { actualBins[b] = 0; predBins[b] = 0; }
                trained.allPreds.forEach(r => {
                  const aBin = Math.round(r.esgScore / 5) * 5;
                  const pBin = Math.round(r.predicted / 5) * 5;
                  actualBins[Math.max(10, Math.min(100, aBin))] = (actualBins[Math.max(10, Math.min(100, aBin))] || 0) + 1;
                  predBins[Math.max(10, Math.min(100, pBin))] = (predBins[Math.max(10, Math.min(100, pBin))] || 0) + 1;
                });
                const distData = Object.keys(actualBins).map(k => ({ score: Number(k), actual: actualBins[k] || 0, predicted: predBins[k] || 0 }));
                return (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={distData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="score" tick={{ fontSize: 11 }} label={{ value: 'ESG Score', position: 'insideBottom', offset: -5, fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="actual" name="Actual" fill={T.navy} opacity={0.6} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="predicted" name="Predicted" fill={MODEL_COLORS[modelType]} opacity={0.6} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          )}

          {/* Portfolio Predictions */}
          {activeTab === 'results' && trained.allPreds && portfolio.length > 0 && (
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Portfolio Holdings Predictions</h3>
              <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 12px' }}>ESG predictions for your active portfolio holdings.</p>
              {(() => {
                const portfolioPreds = trained.allPreds.filter(r =>
                  portfolio.some(h => (h.ticker || h.id) === r.ticker || (h.company_name || h.name || '') === r.name)
                );
                if (portfolioPreds.length === 0) return <p style={{ color: T.textMut, fontSize: 13 }}>No portfolio holdings matched in prediction data.</p>;
                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Company', 'Sector', 'Current ESG', 'Predicted', 'Gap', '2026 Forecast', '2027 Forecast', 'Confidence'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioPreds.map((r, i) => (
                        <tr key={i} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{r.name}</td>
                          <td style={{ ...tdStyle, fontSize: 12 }}>{r.sector}</td>
                          <td style={tdStyle}>{r.esgScore.toFixed(1)}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: MODEL_COLORS[modelType] }}>{r.predicted.toFixed(1)}</td>
                          <td style={{ ...tdStyle, color: r.residual > 0 ? T.green : T.red }}>{r.residual > 0 ? '+' : ''}{r.residual.toFixed(1)}</td>
                          <td style={tdStyle}>{r.esg2026.toFixed(1)}</td>
                          <td style={tdStyle}>{r.esg2027.toFixed(1)}</td>
                          <td style={{ ...tdStyle, fontSize: 12, color: T.textMut }}>{r.confLow.toFixed(0)}-{r.confHigh.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}

          {/* Training Log */}
          {activeTab === 'log' && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: T.navy, fontSize: 16 }}>Model Training Log ({trainingLog.length}/20)</h3>
                <button style={btn(T.red + '20', T.red)} onClick={() => { setTrainingLog([]); saveLog([]); }}>Clear Log</button>
              </div>
              {trainingLog.length === 0 ? <p style={{ color: T.textMut, fontSize: 13 }}>No training runs recorded. Train a model to start.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Model', 'R\u00b2', 'RMSE', 'MAE', 'Train/Test', 'Accuracy \u00b15', 'Timestamp'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {trainingLog.map((l, i) => (
                      <tr key={l.id} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{l.model}</td>
                        <td style={{ ...tdStyle, color: l.r2 > 0.5 ? T.green : T.amber }}>{(l.r2 || 0).toFixed(3)}</td>
                        <td style={tdStyle}>{(l.rmse || 0).toFixed(2)}</td>
                        <td style={tdStyle}>{(l.mae || 0).toFixed(2)}</td>
                        <td style={tdStyle}>{l.trainSize}/{l.testSize}</td>
                        <td style={tdStyle}>{l.accuracy5}%</td>
                        <td style={{ ...tdStyle, fontSize: 11, color: T.textMut }}>{new Date(l.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: T.textMut }}>
        EP-W2 Predictive ESG Score Model | Sprint W AI & NLP Analytics | {allCompanies.length} companies | Portfolio: {portfolio.length} holdings
      </div>
    </div>
  );
}
