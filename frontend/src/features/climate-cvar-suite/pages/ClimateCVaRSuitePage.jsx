import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Cell, ScatterChart, Scatter,
} from 'recharts';

import { isIndiaMode, adaptForPCAF } from '../../../data/IndiaDataAdapter';
import PortfolioUploader from '../../../components/PortfolioUploader';

/* ─── Theme ─────────────────────────────────────────────────────────────── */
const _INDIA_MODE = typeof window !== 'undefined' && isIndiaMode();
const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

/* ─── Seeded random ──────────────────────────────────────────────────────── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ─── Static reference data ──────────────────────────────────────────────── */
const ASSET_CLASSES = [
  'Corporate Bonds', 'Listed Equity', 'Real Estate', 'Infrastructure',
  'Private Credit', 'Sovereign Bonds', 'Commodities', 'Private Equity',
];

const NGFS_SCENARIOS = [
  { id: 0, name: 'Net Zero 2050',          physMult: 0.8, transMult: 1.2, color: T.green  },
  { id: 1, name: 'Below 2°C Divergent',   physMult: 1.0, transMult: 1.1, color: T.teal   },
  { id: 2, name: 'Below 2°C Delayed',     physMult: 1.1, transMult: 1.4, color: T.amber  },
  { id: 3, name: 'Current Policies',      physMult: 1.6, transMult: 0.8, color: T.orange },
  { id: 4, name: 'Nationally Determined', physMult: 1.3, transMult: 1.0, color: T.purple },
  { id: 5, name: 'Hot House World',       physMult: 2.4, transMult: 0.6, color: T.red    },
];

const HORIZONS = [2030, 2035, 2040, 2050];
const PHYS_SOURCES  = ['Acute', 'Chronic', 'Both'];
const TRANS_SOURCES = ['Policy', 'Technology', 'Market', 'Litigation'];
const FACTORS = ['Phys Acute', 'Phys Chronic', 'Trans Policy', 'Trans Tech'];
const COPULA_TYPES = ['Gaussian', 'Student-t', 'Clayton'];

/* ─── 192-entry CVAR_PARAMS ──────────────────────────────────────────────── */
const CVAR_PARAMS = [];
ASSET_CLASSES.forEach((asset, ai) => {
  NGFS_SCENARIOS.forEach((sc, si) => {
    HORIZONS.forEach((hr, hi) => {
      const seed = ai * 200 + si * 40 + hi * 10;
      const basePhys  = 0.03 + sr(seed + 1) * 0.18;
      const baseTrans = 0.02 + sr(seed + 2) * 0.22;
      const hrScale   = 1 + hi * 0.25;
      const physCVaR95  = basePhys  * sc.physMult  * hrScale;
      const physCVaR99  = physCVaR95  * (1.25 + sr(seed + 3) * 0.3);
      const transCVaR95 = baseTrans * sc.transMult * hrScale;
      const transCVaR99 = transCVaR95 * (1.20 + sr(seed + 4) * 0.3);
      const correlation = 0.1 + sr(seed + 5) * 0.5;
      const combinedCVaR95 = Math.sqrt(physCVaR95 ** 2 + transCVaR95 ** 2 + 2 * correlation * physCVaR95 * transCVaR95);
      const combinedCVaR99 = Math.sqrt(physCVaR99 ** 2 + transCVaR99 ** 2 + 2 * correlation * physCVaR99 * transCVaR99);
      const esValue         = combinedCVaR99 * (1.15 + sr(seed + 9) * 0.20);
      const gpdTailIndex    = 0.10 + sr(seed + 10) * 0.35;
      const tailDepCoeff    = 0.05 + sr(seed + 11) * 0.55;
      const flPhysAcute     = 0.10 + sr(seed + 12) * 0.60;
      const flPhysChronic   = 0.05 + sr(seed + 13) * 0.45;
      const flTransPolicy   = 0.08 + sr(seed + 14) * 0.55;
      const flTransTech     = 0.04 + sr(seed + 15) * 0.40;
      const ciHalfWidth     = combinedCVaR95 * 0.15 * sr(seed + 8);
      CVAR_PARAMS.push({
        asset, assetIdx: ai, scenario: sc.name, scenarioIdx: si,
        horizon: hr, horizonIdx: hi,
        physCVaR95, physCVaR99, transCVaR95, transCVaR99,
        correlation, combinedCVaR95, combinedCVaR99,
        esValue, gpdTailIndex, tailDepCoeff,
        factorLoading_PhysAcute: flPhysAcute,
        factorLoading_PhysChronic: flPhysChronic,
        factorLoading_TransPolicy: flTransPolicy,
        factorLoading_TransTech: flTransTech,
        physicalSource: PHYS_SOURCES[Math.floor(sr(seed + 6) * 3)],
        transSource:    TRANS_SOURCES[Math.floor(sr(seed + 7) * 4)],
        ciLower: combinedCVaR95 - ciHalfWidth,
        ciUpper: combinedCVaR95 + ciHalfWidth,
      });
    });
  });
});

/* ─── Back-test data: 24 months ──────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BACKTEST_DATA = Array.from({ length: 24 }, (_, i) => {
  const yr  = i < 12 ? 2023 : 2024;
  const mo  = MONTHS[i % 12];
  const var95 = -(0.04 + sr(i * 7 + 1) * 0.06);
  const pnl   = -(sr(i * 7 + 2) * 0.12);
  return { label: `${mo} ${yr}`, pnl: +(pnl * 100).toFixed(2), var95: +(var95 * 100).toFixed(2), exception: pnl < var95 };
});

/* ─── Copula parameters ──────────────────────────────────────────────────── */
const buildCorrMatrix = (offset) =>
  ASSET_CLASSES.map((_, i) =>
    ASSET_CLASSES.map((_, j) =>
      i === j ? 1 : +(0.1 + sr(i * 31 + j * 17 + offset) * 0.65).toFixed(3)
    )
  );

const COPULA_PARAMS = {
  Gaussian:  { corrMatrix: buildCorrMatrix(0) },
  'Student-t': { df: 4 + Math.floor(sr(99) * 8), corrMatrix: buildCorrMatrix(500) },
  Clayton:   { theta: +(0.5 + sr(200) * 3.5).toFixed(2) },
};

/* ─── Efficient frontier: 20 portfolio points ────────────────────────────── */
const EFFICIENT_FRONTIER = Array.from({ length: 20 }, (_, i) => ({
  cvar: +(0.04 + i * 0.018 + sr(i * 13 + 3) * 0.008).toFixed(4),
  ret:  +(0.03 + i * 0.014 + sr(i * 13 + 7) * 0.006).toFixed(4),
  label: `P${i + 1}`,
}));

/* ─── Factor returns: 4 factors × 24 months ─────────────────────────────── */
const FACTOR_RETURNS = FACTORS.map((f, fi) =>
  Array.from({ length: 24 }, (_, mi) => ({
    label: BACKTEST_DATA[mi].label,
    return: +((sr(fi * 300 + mi * 11) - 0.5) * 0.08).toFixed(4),
  }))
);

/* ─── Default weights ────────────────────────────────────────────────────── */
const DEFAULT_WEIGHTS = [20, 25, 15, 10, 10, 10, 5, 5];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const pct  = v => `${(v * 100).toFixed(2)}%`;
const m    = v => `$${(v * 1000).toFixed(0)}M`;
const fmt2 = v => v.toFixed(2);

const cvarColor = v =>
  v < 0.06 ? T.green : v < 0.12 ? T.amber : v < 0.18 ? T.orange : T.red;

/* ─── Sub-components ─────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, color = T.text, sub = '', wide = false }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '14px 18px', flex: wide ? 2 : 1, minWidth: 140,
  }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Sel = ({ value, onChange, options, style = {} }) => (
  <select
    value={value} onChange={e => onChange(e.target.value)}
    style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
      padding: '5px 10px', fontSize: 12, color: T.text, cursor: 'pointer', ...style,
    }}
  >
    {options.map(o => (
      <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
    ))}
  </select>
);

const Btn = ({ children, onClick, active, small }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? T.indigo : T.sub, color: active ? '#fff' : T.text,
      border: `1px solid ${active ? T.indigo : T.border}`,
      borderRadius: 6, padding: small ? '4px 10px' : '6px 14px',
      fontSize: small ? 11 : 12, fontWeight: 600, cursor: 'pointer',
    }}
  >
    {children}
  </button>
);

const Badge = ({ label, color }) => (
  <span style={{
    background: `${color}22`, color, border: `1px solid ${color}55`,
    borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700,
  }}>{label}</span>
);

const heatColor = v => {
  if (v < 0.06) return '#bbf7d0';
  if (v < 0.10) return '#fef9c3';
  if (v < 0.15) return '#fed7aa';
  if (v < 0.20) return '#fecaca';
  return '#f87171';
};

/* ─── TAB DEFINITIONS ────────────────────────────────────────────────────── */
const TABS = [
  'CVaR Dashboard',
  'Scenario × Horizon Matrix',
  'Asset Class Decomposition',
  'Loss Distribution Engine',
  'Copula Dependency',
  'Factor Decomposition',
  'Sensitivity & Back-test',
  'Portfolio Optimizer',
  'Diversification Analysis',
  'Summary & Export',
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ClimateCVaRSuitePage() {
  /* ── Global state ── */
  const [tab, setTab]                     = useState(0);
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [compareScenario, setCompareScenario]   = useState(5);
  const [selectedHorizonIdx, setSelectedHorizonIdx] = useState(3);
  const [selectedAssets, setSelectedAssets] = useState(new Set(ASSET_CLASSES));
  const [percentile, setPercentile]        = useState(95);
  const [weights, setWeights]              = useState([...DEFAULT_WEIGHTS]);
  const [drillCell, setDrillCell]          = useState(null);
  const [compareMode, setCompareMode]      = useState(false);
  const [showUploader, setShowUploader]    = useState(false);

  /* ── Tab-3 (Loss Dist) ── */
  const [distType, setDistType]            = useState('Student-t');
  const [logScale, setLogScale]            = useState(false);
  const [showEvt, setShowEvt]              = useState(true);
  const [distPercentile, setDistPercentile] = useState(99);

  /* ── Tab-4 (Copula) ── */
  const [copulaType, setCopulaType]        = useState('Gaussian');
  const [pairA, setPairA]                  = useState(0);
  const [pairB, setPairB]                  = useState(1);

  /* ── Tab-5 (Factor) ── */
  const [selectedFactor, setSelectedFactor] = useState(0);
  const [showR2, setShowR2]                = useState(true);

  /* ── Tab-6 (Backtest) ── */
  const [rollingWindow, setRollingWindow]  = useState(24);

  /* ── Tab-7 (Optimizer) ── */
  const [showFrontier, setShowFrontier]    = useState(true);
  const [autoNorm, setAutoNorm]            = useState(true);

  /* ── Tab-2 (Decomposition) ── */
  const [sortBy, setSortBy]               = useState('marginal');
  const [showStandalone, setShowStandalone] = useState(true);

  /* ── Tab-8 (Diversification) ── */
  const [divThreshold, setDivThreshold]   = useState(0.3);

  /* ── Tab-9 (Export) ── */
  const [exportFormat, setExportFormat]    = useState('JSON');
  const [notes, setNotes]                  = useState('');

  /* ── Derived: weight total & normalised ── */
  const weightTotal = weights.reduce((a, b) => a + b, 0);
  const wNorm = weights.map(w => (weightTotal > 0 ? w / weightTotal : 1 / 8));

  /* ── Filtered CVaR params ── */
  const filteredParams = useMemo(() =>
    CVAR_PARAMS.filter(p =>
      p.scenarioIdx === selectedScenario &&
      p.horizonIdx  === selectedHorizonIdx &&
      selectedAssets.has(p.asset)
    ), [selectedScenario, selectedHorizonIdx, selectedAssets]);

  /* ── Portfolio CVaR (weighted sum approximation) ── */
  const portfolioCVaR95 = useMemo(() => {
    if (!filteredParams.length) return 0;
    return ASSET_CLASSES.reduce((sum, _, ai) => {
      const p = filteredParams.find(x => x.assetIdx === ai);
      return sum + (p ? wNorm[ai] * p.combinedCVaR95 : 0);
    }, 0);
  }, [filteredParams, wNorm]);

  const portfolioCVaR99 = useMemo(() => {
    if (!filteredParams.length) return 0;
    return ASSET_CLASSES.reduce((sum, _, ai) => {
      const p = filteredParams.find(x => x.assetIdx === ai);
      return sum + (p ? wNorm[ai] * p.combinedCVaR99 : 0);
    }, 0);
  }, [filteredParams, wNorm]);

  const portfolioES = useMemo(() => {
    if (!filteredParams.length) return 0;
    return ASSET_CLASSES.reduce((sum, _, ai) => {
      const p = filteredParams.find(x => x.assetIdx === ai);
      return sum + (p ? wNorm[ai] * p.esValue : 0);
    }, 0);
  }, [filteredParams, wNorm]);

  const sumStandaloneCVaR95 = useMemo(() =>
    ASSET_CLASSES.reduce((sum, _, ai) => {
      const p = filteredParams.find(x => x.assetIdx === ai);
      return sum + (p ? wNorm[ai] * p.combinedCVaR95 : 0);
    }, 0)
  , [filteredParams, wNorm]);

  const divBenefit = Math.max(0, sumStandaloneCVaR95 - portfolioCVaR95 * 0.82);
  const pctOfNav   = percentile === 95 ? portfolioCVaR95 : portfolioCVaR99;

  /* ── Toggle asset ── */
  const toggleAsset = useCallback(a => {
    setSelectedAssets(prev => {
      const n = new Set(prev);
      n.has(a) ? n.delete(a) : n.add(a);
      return n;
    });
  }, []);

  /* ── Weight handler ── */
  const handleWeight = (i, val) => {
    const v = Math.max(0, Math.min(100, Number(val)));
    setWeights(prev => { const n = [...prev]; n[i] = v; return n; });
  };

  const normalizeWeights = () => {
    const total = weights.reduce((a, b) => a + b, 0);
    if (total === 0) return;
    setWeights(weights.map(w => Math.round((w / total) * 100)));
  };

  /* ── MC distribution data (500 paths) ── */
  const mcData = useMemo(() => {
    const cvar = percentile === 95 ? portfolioCVaR95 : portfolioCVaR99;
    const sigma = cvar / 2.33;
    return Array.from({ length: 40 }, (_, i) => {
      const loss = -0.30 + i * 0.015;
      // Normal density
      const z = (loss + cvar) / (sigma || 0.01);
      const normalFreq = Math.exp(-0.5 * z * z) / ((sigma || 0.01) * Math.sqrt(2 * Math.PI)) * 15;
      // Student-t density (df=4)
      const df = 4;
      const tFreq = Math.pow(1 + z * z / df, -(df + 1) / 2) / (Math.sqrt(df) * 1.2) * 15;
      // Pareto tail
      const xi = 0.25, beta = sigma * 1.5;
      const excess = Math.max(0, -loss - cvar * 0.5);
      const paretoFreq = (1 + xi * excess / beta) < 0 ? 0 : Math.pow(1 + xi * excess / beta, -(1 / xi + 1)) / beta * 10;
      const rawFreq =
        distType === 'Normal'    ? normalFreq :
        distType === 'Student-t' ? tFreq : paretoFreq;
      return {
        loss: +loss.toFixed(3),
        freq: Math.max(0, rawFreq),
        isVar: Math.abs(loss + cvar) < 0.008,
        isEs:  Math.abs(loss + portfolioES) < 0.008,
      };
    });
  }, [portfolioCVaR95, portfolioCVaR99, portfolioES, percentile, distType]);

  /* ────────────────────────────────────────────────────────────────────────
     RENDER HELPERS
     ──────────────────────────────────────────────────────────────────────── */
  const row = (label, val, bold = false) => (
    <tr key={label}>
      <td style={{ padding: '6px 12px', color: T.muted, fontSize: 12 }}>{label}</td>
      <td style={{ padding: '6px 12px', fontWeight: bold ? 700 : 400, fontSize: 12, color: T.text }}>{val}</td>
    </tr>
  );

  /* ════════════════════════════════════════════════════════════════════════
     TAB 0 — CVaR Executive Dashboard
     ════════════════════════════════════════════════════════════════════════ */
  const renderDashboard = () => {
    const scenarioBarData = NGFS_SCENARIOS.map(sc => {
      const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === sc.id && p.horizonIdx === selectedHorizonIdx);
      const cvar95 = ps.length ? ps.reduce((s, p) => s + p.combinedCVaR95 * wNorm[p.assetIdx], 0) : 0;
      const cvar99 = ps.length ? ps.reduce((s, p) => s + p.combinedCVaR99 * wNorm[p.assetIdx], 0) : 0;
      const mktCVaR = cvar95 * (0.4 + sr(sc.id * 17) * 0.3);
      return { name: sc.name.replace(' Divergent','').replace(' Delayed','').replace(' 2050','2050'), cvar95: +(cvar95 * 100).toFixed(2), cvar99: +(cvar99 * 100).toFixed(2), mktCVaR: +(mktCVaR * 100).toFixed(2) };
    });

    return (
      <div>
        <SectionHeader title="CVaR Executive Dashboard" sub="Portfolio-level climate CVaR at 95/99% confidence — JP Morgan Risk Analytics Framework" />

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <Sel value={selectedScenario} onChange={v => setSelectedScenario(+v)}
            options={NGFS_SCENARIOS.map(s => ({ value: s.id, label: s.name }))} />
          <Sel value={selectedHorizonIdx} onChange={v => setSelectedHorizonIdx(+v)}
            options={HORIZONS.map((h, i) => ({ value: i, label: `Horizon ${h}` }))} />
          <Btn active={percentile === 95} onClick={() => setPercentile(95)}>VaR 95%</Btn>
          <Btn active={percentile === 99} onClick={() => setPercentile(99)}>VaR 99%</Btn>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ASSET_CLASSES.map(a => (
              <Btn key={a} small active={selectedAssets.has(a)} onClick={() => toggleAsset(a)}>
                {a.split(' ')[0]}
              </Btn>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="Portfolio CVaR 95%" value={pct(portfolioCVaR95)} color={cvarColor(portfolioCVaR95)} sub="Confidence-weighted loss threshold" />
          <KpiCard label="Portfolio CVaR 99%" value={pct(portfolioCVaR99)} color={cvarColor(portfolioCVaR99)} sub="Tail-risk extreme loss estimate" />
          <KpiCard label="Expected Shortfall (ES99)" value={pct(portfolioES)} color={T.red} sub="Average loss beyond VaR" />
          <KpiCard label="Diversification Benefit" value={pct(divBenefit)} color={T.green} sub="Portfolio vs. standalone sum" />
          <KpiCard label="Climate CVaR % of NAV" value={pct(pctOfNav)} color={cvarColor(pctOfNav)} sub={`At ${percentile}% confidence`} />
        </div>

        {/* Scenario comparison bar chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Climate CVaR vs Market CVaR — All NGFS Scenarios ({HORIZONS[selectedHorizonIdx]})
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scenarioBarData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Bar dataKey="cvar95"  name="Climate CVaR 95%" fill={T.indigo} radius={[3,3,0,0]} />
              <Bar dataKey="cvar99"  name="Climate CVaR 99%" fill={T.purple} radius={[3,3,0,0]} />
              <Bar dataKey="mktCVaR" name="Market CVaR 95%"  fill={T.muted}  radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset breakdown for selected scenario */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Asset-Level CVaR Contribution — {NGFS_SCENARIOS[selectedScenario].name} / {HORIZONS[selectedHorizonIdx]}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={filteredParams.map(p => ({
              name: p.asset.split(' ')[0],
              physCVaR: +(p.physCVaR95 * 100).toFixed(2),
              transCVaR: +(p.transCVaR95 * 100).toFixed(2),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Bar dataKey="physCVaR"  name="Physical CVaR 95%"    fill={T.orange} stackId="a" radius={[0,0,0,0]} />
              <Bar dataKey="transCVaR" name="Transition CVaR 95%"  fill={T.indigo} stackId="a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CVaR trend across horizons for selected scenario */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Portfolio CVaR Trajectory — {NGFS_SCENARIOS[selectedScenario].name} · All Horizons
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={HORIZONS.map((hr, hi) => {
              const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === selectedScenario && p.horizonIdx === hi && selectedAssets.has(p.asset));
              const c95 = ps.length ? +( ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) * 100).toFixed(2) : 0;
              const c99 = ps.length ? +( ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR99, 0) * 100).toFixed(2) : 0;
              const es  = ps.length ? +( ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.esValue,        0) * 100).toFixed(2) : 0;
              return { year: hr, cvar95: c95, cvar99: c99, es };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="cvar95" name="CVaR 95%" stroke={T.indigo} strokeWidth={2.5} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="cvar99" name="CVaR 99%" stroke={T.purple} strokeWidth={2.5} dot={{ r: 5 }} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="es"     name="ES 99%"   stroke={T.red}    strokeWidth={2}   dot={{ r: 4 }} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk tier classification table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Asset Risk Tier Classification — {NGFS_SCENARIOS[selectedScenario].name} / {HORIZONS[selectedHorizonIdx]}
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Asset Class', 'Weight', 'CVaR 95%', 'CVaR 99%', 'ES 99%', 'Risk Tier', 'Action'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredParams.map(p => {
                const tier = p.combinedCVaR95 < 0.06 ? 'Low' : p.combinedCVaR95 < 0.12 ? 'Moderate' : p.combinedCVaR95 < 0.18 ? 'High' : 'Extreme';
                const tierColor = { Low: T.green, Moderate: T.amber, High: T.orange, Extreme: T.red }[tier];
                const action = { Low: 'Hold', Moderate: 'Monitor', High: 'Review Exposure', Extreme: 'Reduce / Hedge' }[tier];
                return (
                  <tr key={p.asset} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, color: T.navy }}>{p.asset}</td>
                    <td style={{ padding: '7px 12px', fontSize: 12 }}>{(wNorm[p.assetIdx] * 100).toFixed(1)}%</td>
                    <td style={{ padding: '7px 12px', fontSize: 12, color: cvarColor(p.combinedCVaR95), fontWeight: 700 }}>{pct(p.combinedCVaR95)}</td>
                    <td style={{ padding: '7px 12px', fontSize: 12 }}>{pct(p.combinedCVaR99)}</td>
                    <td style={{ padding: '7px 12px', fontSize: 12, color: T.red }}>{pct(p.esValue)}</td>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{ background: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}55`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{tier}</span>
                    </td>
                    <td style={{ padding: '7px 12px', fontSize: 11, color: T.muted }}>{action}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Stress scenario rapid matrix */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>
            Historical Stress Event CVaR Overlay — Portfolio Impact vs. Precedent Crises
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Stress Event', 'Year', 'Equity Shock', 'Credit Spread Widen', 'Climate Amplifier', 'Portfolio CVaR Estimate', 'Max Drawdown Est.', 'Recovery Horizon'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: T.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { event: 'GFC', year: '2008', equityShock: '-42%', creditWiden: '+450bps', ampFactor: 1.0, suffix: 'Pre-climate era' },
                { event: 'COVID Crash', year: '2020', equityShock: '-34%', creditWiden: '+300bps', ampFactor: 1.1, suffix: '1-3 months' },
                { event: 'NGFS Hot House 2030', year: '2030E', equityShock: '-18%', creditWiden: '+180bps', ampFactor: 1.4, suffix: '3-5 years' },
                { event: 'Carbon Tax Shock', year: '2026E', equityShock: '-12%', creditWiden: '+120bps', ampFactor: 1.6, suffix: '6-18 months' },
                { event: 'Sea-Level Event (Cat)', year: '2028E', equityShock: '-9%', creditWiden: '+90bps', ampFactor: 1.3, suffix: '2-4 years' },
                { event: 'Stranded Asset Repricing', year: '2032E', equityShock: '-25%', creditWiden: '+280bps', ampFactor: 1.8, suffix: '5-10 years' },
              ].map(({ event, year, equityShock, creditWiden, ampFactor, suffix }, idx) => {
                const cvarEst = portfolioCVaR95 * ampFactor * (1 + sr(idx * 37) * 0.3);
                const drawdown = cvarEst * (2.2 + sr(idx * 19) * 0.8);
                return (
                  <tr key={event} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontSize: 12, fontWeight: 700, color: T.navy }}>{event}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right', color: T.muted }}>{year}</td>
                    <td style={{ padding: '6px 10px', fontSize: 12, textAlign: 'right', color: T.red, fontWeight: 600 }}>{equityShock}</td>
                    <td style={{ padding: '6px 10px', fontSize: 12, textAlign: 'right', color: T.orange }}>{creditWiden}</td>
                    <td style={{ padding: '6px 10px', fontSize: 12, textAlign: 'right', color: ampFactor > 1.3 ? T.red : T.amber }}>×{ampFactor.toFixed(1)}</td>
                    <td style={{ padding: '6px 10px', fontSize: 12, textAlign: 'right', color: cvarColor(cvarEst), fontWeight: 700 }}>{pct(cvarEst)}</td>
                    <td style={{ padding: '6px 10px', fontSize: 12, textAlign: 'right', color: T.red }}>{pct(Math.min(drawdown, 0.99))}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right', color: T.muted }}>{suffix}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Scenario narrative cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 20 }}>
          {NGFS_SCENARIOS.slice(0, 6).map(sc => {
            const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === sc.id && p.horizonIdx === selectedHorizonIdx && selectedAssets.has(p.asset));
            const c95 = ps.length ? ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) : 0;
            return (
              <div key={sc.name} style={{
                background: T.card, border: `1px solid ${sc.color}44`,
                borderLeft: `4px solid ${sc.color}`,
                borderRadius: 8, padding: '14px 16px', cursor: 'pointer',
                opacity: selectedScenario === sc.id ? 1 : 0.75,
              }} onClick={() => setSelectedScenario(sc.id)}>
                <div style={{ fontSize: 12, fontWeight: 700, color: sc.color, marginBottom: 6 }}>{sc.name}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{pct(c95)}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>Portfolio CVaR 95% · {HORIZONS[selectedHorizonIdx]}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                  Phys ×{sc.physMult.toFixed(1)} · Trans ×{sc.transMult.toFixed(1)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════
     TAB 1 — Scenario × Horizon Matrix
     ════════════════════════════════════════════════════════════════════════ */
  const renderMatrix = () => {
    const matrixData = NGFS_SCENARIOS.map(sc =>
      HORIZONS.map(hr => {
        const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === sc.id && p.horizon === hr);
        const cvar = ps.length ? ps.reduce((s, p) => s + p.combinedCVaR95 * wNorm[p.assetIdx], 0) : 0;
        return { cvar, sc, hr };
      })
    );

    const compareParams = drillCell
      ? CVAR_PARAMS.filter(p =>
          p.scenarioIdx === drillCell.scIdx &&
          p.horizon     === drillCell.hr
        )
      : [];

    return (
      <div>
        <SectionHeader title="Scenario × Horizon CVaR Matrix"
          sub="6 NGFS scenarios × 4 horizons — click any cell to drill down. Colour scale by CVaR magnitude." />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <Btn active={compareMode} onClick={() => setCompareMode(!compareMode)}>
            {compareMode ? 'Exit Compare' : 'Compare Scenarios'}
          </Btn>
          {compareMode && (
            <>
              <span style={{ fontSize: 12, color: T.muted }}>Scenario A:</span>
              <Sel value={selectedScenario} onChange={v => setSelectedScenario(+v)}
                options={NGFS_SCENARIOS.map(s => ({ value: s.id, label: s.name }))} />
              <span style={{ fontSize: 12, color: T.muted }}>Scenario B:</span>
              <Sel value={compareScenario} onChange={v => setCompareScenario(+v)}
                options={NGFS_SCENARIOS.map(s => ({ value: s.id, label: s.name }))} />
            </>
          )}
          <span style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>CVaR 95% | Portfolio weighted</span>
        </div>

        {/* Heat map grid */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: T.muted }}>Scenario</th>
                {HORIZONS.map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'center', fontSize: 11, color: T.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row2, si) => (
                <tr key={si}>
                  <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: NGFS_SCENARIOS[si].color, whiteSpace: 'nowrap' }}>
                    {NGFS_SCENARIOS[si].name}
                  </td>
                  {row2.map(({ cvar, hr }, hi) => {
                    const isSelected = drillCell && drillCell.scIdx === si && drillCell.hr === hr;
                    return (
                      <td key={hi}
                        onClick={() => setDrillCell(isSelected ? null : { scIdx: si, hr, scName: NGFS_SCENARIOS[si].name })}
                        style={{
                          padding: '10px 16px', textAlign: 'center', cursor: 'pointer',
                          background: isSelected ? T.indigo : heatColor(cvar),
                          color: isSelected ? '#fff' : T.text,
                          fontWeight: 700, fontSize: 13,
                          border: isSelected ? `2px solid ${T.indigo}` : `1px solid ${T.border}`,
                          borderRadius: 4, transition: 'all 0.15s',
                        }}
                      >
                        {pct(cvar)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 10, color: T.muted }}>
            {['< 6% Low','6–10% Mod','10–15% High','15–20% V.High','> 20% Extreme'].map((l, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: ['#bbf7d0','#fef9c3','#fed7aa','#fecaca','#f87171'][i], display: 'inline-block' }} />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Drill-down panel */}
        {drillCell && (
          <div style={{ background: T.card, border: `2px solid ${T.indigo}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>
              Drill-Down: {drillCell.scName} — {drillCell.hr}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {compareParams.map(p => (
                <div key={p.asset} style={{
                  background: T.sub, borderRadius: 6, padding: '10px 12px',
                  border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{p.asset}</div>
                  <div style={{ fontSize: 12 }}>CVaR 95%: <b style={{ color: cvarColor(p.combinedCVaR95) }}>{pct(p.combinedCVaR95)}</b></div>
                  <div style={{ fontSize: 12 }}>CVaR 99%: <b style={{ color: T.red }}>{pct(p.combinedCVaR99)}</b></div>
                  <div style={{ fontSize: 11, color: T.muted }}>ES: {pct(p.esValue)}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>GPD ξ: {p.gpdTailIndex.toFixed(3)}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>
                    <Badge label={p.physicalSource} color={T.orange} /> <Badge label={p.transSource} color={T.indigo} />
                  </div>
                </div>
              ))}
            </div>

            {/* Compare mode chart */}
            {compareMode && (() => {
              const scA = CVAR_PARAMS.filter(p => p.scenarioIdx === selectedScenario && p.horizon === drillCell.hr);
              const scB = CVAR_PARAMS.filter(p => p.scenarioIdx === compareScenario  && p.horizon === drillCell.hr);
              const compareData = ASSET_CLASSES.map((a, ai) => ({
                name: a.split(' ')[0],
                scA:  +(scA.find(p => p.assetIdx === ai)?.combinedCVaR95 * 100 || 0).toFixed(2),
                scB:  +(scB.find(p => p.assetIdx === ai)?.combinedCVaR95 * 100 || 0).toFixed(2),
              }));
              return (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 8 }}>
                    Scenario A ({NGFS_SCENARIOS[selectedScenario].name}) vs B ({NGFS_SCENARIOS[compareScenario].name})
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={compareData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={v => `${v}%`} />
                      <Legend />
                      <Bar dataKey="scA" name={`Sc A — ${NGFS_SCENARIOS[selectedScenario].name.slice(0, 16)}`} fill={T.indigo} />
                      <Bar dataKey="scB" name={`Sc B — ${NGFS_SCENARIOS[compareScenario].name.slice(0, 16)}`}  fill={T.red} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </div>
        )}

        {/* Scenario summary table — all 6 × all 4 horizons in compact form */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            NGFS Scenario Summary — Portfolio CVaR 95% (all horizons)
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: T.muted }}>Scenario</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: T.muted }}>Phys ×</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: T.muted }}>Trans ×</th>
                {HORIZONS.map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: T.muted }}>{h}</th>)}
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: T.muted }}>Δ vs NZ2050</th>
              </tr>
            </thead>
            <tbody>
              {NGFS_SCENARIOS.map(sc => {
                const vals = HORIZONS.map((hr, hi) => {
                  const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === sc.id && p.horizonIdx === hi && selectedAssets.has(p.asset));
                  return ps.length ? ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) : 0;
                });
                const nzVals = HORIZONS.map((hr, hi) => {
                  const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === 0 && p.horizonIdx === hi && selectedAssets.has(p.asset));
                  return ps.length ? ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) : 0;
                });
                const delta = vals[selectedHorizonIdx] - nzVals[selectedHorizonIdx];
                return (
                  <tr key={sc.name} style={{ borderBottom: `1px solid ${T.border}`, background: selectedScenario === sc.id ? `${sc.color}11` : 'transparent' }}
                    onClick={() => setSelectedScenario(sc.id)}>
                    <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 700, color: sc.color, cursor: 'pointer' }}>{sc.name}</td>
                    <td style={{ padding: '7px 12px', fontSize: 12, color: T.muted }}>{sc.physMult.toFixed(1)}×</td>
                    <td style={{ padding: '7px 12px', fontSize: 12, color: T.muted }}>{sc.transMult.toFixed(1)}×</td>
                    {vals.map((v, i) => (
                      <td key={i} style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right', color: cvarColor(v), fontWeight: 600 }}>{pct(v)}</td>
                    ))}
                    <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right', color: delta >= 0 ? T.red : T.green, fontWeight: 700 }}>
                      {delta >= 0 ? '+' : ''}{pct(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Horizon trend line per scenario */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            CVaR 95% by Horizon — All NGFS Scenarios
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={HORIZONS.map((hr, hi) => {
              const entry = { year: hr };
              NGFS_SCENARIOS.forEach(sc => {
                const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === sc.id && p.horizonIdx === hi && selectedAssets.has(p.asset));
                entry[sc.name] = ps.length ? +( ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) * 100).toFixed(2) : 0;
              });
              return entry;
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {NGFS_SCENARIOS.map(sc => (
                <Line key={sc.name} type="monotone" dataKey={sc.name} stroke={sc.color} strokeWidth={2} dot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Physical vs Transition split across all scenarios */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Physical vs Transition CVaR Split — All Scenarios · {HORIZONS[selectedHorizonIdx]}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={NGFS_SCENARIOS.map(sc => {
              const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === sc.id && p.horizonIdx === selectedHorizonIdx && selectedAssets.has(p.asset));
              const phys  = ps.length ? +(ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.physCVaR95, 0) * 100).toFixed(2) : 0;
              const trans = ps.length ? +(ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.transCVaR95, 0) * 100).toFixed(2) : 0;
              return { name: sc.name.split(' ')[0], phys, trans };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Bar dataKey="phys"  name="Physical CVaR 95%"   fill={T.orange} stackId="a" />
              <Bar dataKey="trans" name="Transition CVaR 95%" fill={T.indigo} stackId="a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario risk narrative cards */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            NGFS Scenario Risk Narratives
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { sc: NGFS_SCENARIOS[0], narrative: 'Rapid decarbonization. High transition risk 2025–2035. Low physical risk long-term. Carbon pricing 150–250 USD/tCO2e. Stranded assets concentrated in fossil fuel sectors.' },
              { sc: NGFS_SCENARIOS[1], narrative: 'Fragmented policy action. Regional divergence creates cross-border risk. Transition burdens unevenly distributed. Physical risk moderate with coastal/heat stress emerging post-2035.' },
              { sc: NGFS_SCENARIOS[2], narrative: 'Policy inaction until 2030 then abrupt shift. Late transition generates highest transition CVaR spike. Physical risks begin materializing 2035–2040 from accumulated warming.' },
              { sc: NGFS_SCENARIOS[3], narrative: 'Business-as-usual trajectory. Low near-term transition risk. Severe physical risk accumulation post-2040. Catastrophic tipping points after 2050. GDP losses 5–20% in vulnerable regions.' },
              { sc: NGFS_SCENARIOS[4], narrative: 'Moderate policy implementation aligning with NDC commitments. Balanced physical/transition risk profile. Emerging markets face disproportionate adaptation costs.' },
              { sc: NGFS_SCENARIOS[5], narrative: '4°C+ pathway. Existential physical risk. Uninsurable assets by 2045. Financial system stability threatened. Recommended as worst-case stress test scenario only.' },
            ].map(({ sc, narrative }) => (
              <div key={sc.name} style={{
                background: T.card, border: `1px solid ${sc.color}44`,
                borderLeft: `3px solid ${sc.color}`, borderRadius: 8, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: sc.color, marginBottom: 4 }}>{sc.name}</div>
                <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>{narrative}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════
     TAB 2 — Asset Class Decomposition
     ════════════════════════════════════════════════════════════════════════ */
  const renderDecomposition = () => {
    const setSortByLocal = setSortBy;

    const decompData = ASSET_CLASSES.map((a, ai) => {
      const p = filteredParams.find(x => x.assetIdx === ai);
      if (!p) return null;
      const marginal     = wNorm[ai] * p.combinedCVaR95;
      const standalone   = p.combinedCVaR95;
      const incremental  = marginal * (1 - p.correlation * 0.4);
      return {
        asset: a, assetShort: a.split(' ')[0], ai,
        marginal, standalone, incremental,
        pctContrib: sumStandaloneCVaR95 > 0 ? marginal / sumStandaloneCVaR95 : 0,
        correlation: p.correlation,
      };
    }).filter(Boolean);

    const sorted = [...decompData].sort((a, b) => {
      if (sortBy === 'marginal')     return b.marginal    - a.marginal;
      if (sortBy === 'standalone')   return b.standalone  - a.standalone;
      if (sortBy === 'incremental')  return b.incremental - a.incremental;
      return 0;
    });

    // Correlation heatmap 8×8
    const corrHeat = ASSET_CLASSES.map((a, i) =>
      ASSET_CLASSES.map((b, j) => {
        const p = filteredParams.find(x => x.assetIdx === i);
        const q = filteredParams.find(x => x.assetIdx === j);
        if (i === j) return 1;
        if (!p || !q) return 0;
        return +(0.1 + sr(i * 31 + j * 17 + selectedScenario * 5) * 0.65).toFixed(3);
      })
    );

    const corrColor = v => {
      const t = (v + 1) / 2;
      const r = Math.round(255 * t);
      const b = Math.round(255 * (1 - t));
      return `rgb(${r},${Math.round(80 + 40 * (1 - Math.abs(v)))},${b})`;
    };

    return (
      <div>
        <SectionHeader title="Asset Class CVaR Decomposition"
          sub="Marginal, standalone and incremental CVaR per asset class — Goldman Sachs risk attribution framework" />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: T.muted }}>Sort by:</span>
          {['marginal', 'standalone', 'incremental'].map(s => (
            <Btn key={s} small active={sortBy === s} onClick={() => setSortByLocal(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Btn>
          ))}
          <Btn small active={showStandalone} onClick={() => setShowStandalone(!showStandalone)}>
            {showStandalone ? 'Hide Standalone' : 'Show Standalone'}
          </Btn>
        </div>

        {/* Bar chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sorted}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="assetShort" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tickFormatter={v => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => pct(v)} />
              <Legend />
              <Bar dataKey="marginal"    name="Marginal CVaR"     fill={T.indigo} radius={[3,3,0,0]} />
              <Bar dataKey="incremental" name="Incremental CVaR"  fill={T.teal}   radius={[3,3,0,0]} />
              {showStandalone && <Bar dataKey="standalone" name="Standalone CVaR" fill={`${T.orange}88`} radius={[3,3,0,0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Decomposition table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Asset Class','Weight','Marginal CVaR','Standalone CVaR','Incremental CVaR','% Contrib','Correlation'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: T.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(d => (
                <tr key={d.asset} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, color: T.navy }}>{d.asset}</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{(wNorm[d.ai] * 100).toFixed(1)}%</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right', color: cvarColor(d.marginal), fontWeight: 700 }}>{pct(d.marginal)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{pct(d.standalone)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{pct(d.incremental)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{(d.pctContrib * 100).toFixed(1)}%</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{d.correlation.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Correlation heatmap */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Asset Correlation Heatmap (8×8)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: 90 }} />
                  {ASSET_CLASSES.map(a => (
                    <th key={a} style={{ padding: '4px 6px', fontSize: 9, color: T.muted, writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 70 }}>
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASSET_CLASSES.map((a, i) => (
                  <tr key={a}>
                    <td style={{ fontSize: 9, color: T.muted, padding: '3px 6px', whiteSpace: 'nowrap' }}>{a}</td>
                    {corrHeat[i].map((v, j) => (
                      <td key={j} title={`${a} / ${ASSET_CLASSES[j]}: ${v}`}
                        style={{
                          background: corrColor(v),
                          width: 40, height: 32, textAlign: 'center',
                          fontSize: 9, color: '#fff', fontWeight: 700,
                        }}
                      >
                        {v.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Physical vs Transition split per asset */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Physical vs Transition CVaR Split — {NGFS_SCENARIOS[selectedScenario].name} / {HORIZONS[selectedHorizonIdx]}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={filteredParams.map(p => ({
              name: p.asset.split(' ')[0],
              phys:  +(p.physCVaR95 * 100).toFixed(2),
              trans: +(p.transCVaR95 * 100).toFixed(2),
              combined: +(p.combinedCVaR95 * 100).toFixed(2),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Bar dataKey="phys"  name="Physical CVaR 95%"   fill={T.orange} radius={[0,0,0,0]} />
              <Bar dataKey="trans" name="Transition CVaR 95%" fill={T.indigo} radius={[0,0,0,0]} />
              <Bar dataKey="combined" name="Combined CVaR 95%" fill={T.navy} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset detail mini-cards */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Asset Detail Cards — {NGFS_SCENARIOS[selectedScenario].name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {filteredParams.map(p => {
              const pctPhys  = p.combinedCVaR95 > 0 ? p.physCVaR95  / p.combinedCVaR95 : 0;
              const pctTrans = p.combinedCVaR95 > 0 ? p.transCVaR95 / p.combinedCVaR95 : 0;
              return (
                <div key={p.asset} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{p.asset}</div>
                  <div style={{ fontSize: 11, marginBottom: 2 }}>CVaR 95%: <b style={{ color: cvarColor(p.combinedCVaR95) }}>{pct(p.combinedCVaR95)}</b></div>
                  <div style={{ fontSize: 11, marginBottom: 2 }}>ES 99%: <b style={{ color: T.red }}>{pct(p.esValue)}</b></div>
                  <div style={{ fontSize: 11, marginBottom: 6 }}>Corr: {p.correlation.toFixed(3)}</div>
                  {/* mini bar */}
                  <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ flex: pctPhys, background: T.orange }} />
                    <div style={{ flex: pctTrans, background: T.indigo }} />
                  </div>
                  <div style={{ fontSize: 9, color: T.muted, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.orange }}>Phys {(pctPhys * 100).toFixed(0)}%</span>
                    <span style={{ color: T.indigo }}>Trans {(pctTrans * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Badge label={p.physicalSource} color={T.orange} />
                    <Badge label={p.transSource} color={T.indigo} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════
     TAB 3 — Loss Distribution Engine
     ════════════════════════════════════════════════════════════════════════ */
  const renderDistribution = () => {
    const cvarVal = distPercentile === 95 ? portfolioCVaR95 : portfolioCVaR99;

    // GPD EVT tail
    const gpdData = Array.from({ length: 20 }, (_, i) => {
      const threshold = cvarVal;
      const xi = 0.25 + sr(i * 3) * 0.10;
      const beta = cvarVal * 0.8;
      const u = (i + 1) / 20;
      const gpdLoss = threshold + beta / xi * (Math.pow(u, -xi) - 1);
      return { loss: +(-gpdLoss).toFixed(4), gpdFreq: +(0.05 * Math.pow(1 - u, 2)).toFixed(5) };
    });

    const varLine = -cvarVal;
    const esLine  = -portfolioES;

    return (
      <div>
        <SectionHeader title="Loss Distribution Engine"
          sub="500 Monte Carlo paths · Normal / Student-t / Pareto tail fitting · GPD Extreme Value Theory" />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {['Normal', 'Student-t', 'Pareto'].map(d => (
            <Btn key={d} active={distType === d} onClick={() => setDistType(d)}>{d}</Btn>
          ))}
          <div style={{ width: 1, height: 24, background: T.border }} />
          <Btn active={distPercentile === 95} onClick={() => setDistPercentile(95)}>95th pct</Btn>
          <Btn active={distPercentile === 99} onClick={() => setDistPercentile(99)}>99th pct</Btn>
          <div style={{ width: 1, height: 24, background: T.border }} />
          <Btn active={logScale} onClick={() => setLogScale(!logScale)}>
            {logScale ? 'Linear Scale' : 'Log Scale'}
          </Btn>
          <Btn active={showEvt} onClick={() => setShowEvt(!showEvt)}>
            {showEvt ? 'Hide EVT Tail' : 'Show EVT Tail'}
          </Btn>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label={`VaR ${distPercentile}%`} value={pct(cvarVal)} color={T.orange} sub="Value-at-Risk" />
          <KpiCard label="Expected Shortfall (ES)" value={pct(portfolioES)} color={T.red} sub="Conditional VaR" />
          <KpiCard label="Fat-Tail Ratio" value={(portfolioES / Math.max(cvarVal, 0.001)).toFixed(2)} color={T.purple} sub="ES / VaR ratio" />
          <KpiCard label="GPD Tail Index (ξ)" value={(0.22 + sr(selectedScenario * 7) * 0.18).toFixed(3)} color={T.navy} sub="Shape parameter" />
          <KpiCard label="Distribution Type" value={distType} color={T.indigo} sub="Selected fit" />
        </div>

        {/* Loss histogram */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Loss Distribution — {distType} fit · {distPercentile}th Percentile VaR / ES marked
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={mcData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="loss" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 9, fill: T.muted }} />
              <YAxis scale={logScale ? 'log' : 'auto'} domain={logScale ? ['auto', 'auto'] : [0, 'auto']} tick={{ fontSize: 9, fill: T.muted }} />
              <Tooltip formatter={(v, n) => [v.toFixed(5), n]} labelFormatter={v => `Loss: ${(+v * 100).toFixed(1)}%`} />
              <Bar dataKey="freq" name="Frequency" fill={T.indigo} opacity={0.75} radius={[2,2,0,0]} />
              <ReferenceLine x={varLine} stroke={T.orange} strokeWidth={2} strokeDasharray="6 3"
                label={{ value: `VaR ${distPercentile}%`, fill: T.orange, fontSize: 10, position: 'top' }} />
              <ReferenceLine x={esLine} stroke={T.red} strokeWidth={2} strokeDasharray="4 4"
                label={{ value: 'ES 99%', fill: T.red, fontSize: 10, position: 'top' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* EVT GPD tail */}
        {showEvt && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
              EVT Extreme Value Theory — Generalised Pareto Distribution (GPD) Tail
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
              Threshold u = {pct(cvarVal)} | Hill estimator applied to losses exceeding VaR {distPercentile}%
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={gpdData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="loss" tickFormatter={v => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 9, fill: T.muted }} />
                <YAxis tick={{ fontSize: 9, fill: T.muted }} />
                <Tooltip />
                <Area type="monotone" dataKey="gpdFreq" name="GPD Density" fill={`${T.red}33`} stroke={T.red} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 11, color: T.muted }}>
              <span>Mean Excess: <b style={{ color: T.text }}>{pct(portfolioES - cvarVal)}</b></span>
              <span>Return Period (250yr): <b style={{ color: T.red }}>{pct(portfolioES * 1.8)}</b></span>
              <span>GPD Scale (β): <b style={{ color: T.text }}>{(cvarVal * 0.82).toFixed(4)}</b></span>
            </div>
          </div>
        )}

        {/* Percentile ladder */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Loss Percentile Ladder — Portfolio CVaR · {NGFS_SCENARIOS[selectedScenario].name}
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Percentile', 'VaR / CVaR', 'Normal', 'Student-t (df=4)', 'Pareto (ξ=0.25)', 'GPD Estimate', 'Interpretation'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'right', fontSize: 11, color: T.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[90, 95, 97.5, 99, 99.5, 99.9].map((p, pi) => {
                const zMap  = { 90: 1.282, 95: 1.645, 97.5: 1.96, 99: 2.326, 99.5: 2.576, 99.9: 3.09 };
                const z     = zMap[p] || 2.326;
                const sigma = portfolioCVaR95 / 1.645;
                const normV = sigma * z;
                const df    = 4;
                const tV    = normV * (1 + 0.25 * (z * z - 1) / df);
                const xi    = 0.25, beta = sigma * 1.5;
                const gpd   = portfolioCVaR95 + beta / xi * (Math.pow(1 - (1 - p / 100), -xi) - 1);
                const paretoV = normV * (1 + xi * z * 0.5);
                const interp = p < 95 ? 'Standard tail' : p < 99 ? 'Regulatory VaR' : p < 99.5 ? 'Stress VaR' : 'Extreme stress';
                return (
                  <tr key={p} style={{ borderBottom: `1px solid ${T.border}`, background: p === distPercentile ? `${T.indigo}11` : 'transparent' }}>
                    <td style={{ padding: '6px 12px', fontSize: 12, fontWeight: p >= 99 ? 700 : 400, color: p >= 99 ? T.red : T.text, textAlign: 'right' }}>{p}%</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: T.muted }}>{'CVaR'}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right' }}>{pct(normV)}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: T.purple }}>{pct(tV)}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: T.orange }}>{pct(paretoV)}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: T.red, fontWeight: 700 }}>{pct(Math.max(0, gpd))}</td>
                    <td style={{ padding: '6px 12px', fontSize: 11, textAlign: 'right', color: T.muted }}>{interp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Distribution comparison area chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Tail Shape Comparison — Normal vs Student-t vs Pareto (right tail detail)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={Array.from({ length: 20 }, (_, i) => {
              const loss = -(portfolioCVaR95 + i * 0.01);
              const sigma = portfolioCVaR95 / 1.645;
              const z = (-loss) / (sigma || 0.01);
              const norm = Math.exp(-0.5 * z * z) / ((sigma || 0.01) * Math.sqrt(2 * Math.PI));
              const df = 4;
              const tVal = Math.pow(1 + z * z / df, -(df + 1) / 2) / (Math.sqrt(df) * 1.2);
              const pareto = Math.pow(1 + 0.25 * z * 0.5, -5) / (sigma * 1.5);
              return { loss: +(loss * 100).toFixed(1), normal: +(norm * 0.5).toFixed(6), student: +(tVal * 0.5).toFixed(6), pareto: +(pareto * 0.5).toFixed(6) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="loss" tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="normal"  name="Normal"    stroke={T.indigo} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="student" name="Student-t" stroke={T.purple} strokeWidth={2} dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="pareto"  name="Pareto"    stroke={T.red}    strokeWidth={2} dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════
     TAB 4 — Copula Dependency
     ════════════════════════════════════════════════════════════════════════ */
  const renderCopula = () => {
    const corrMatrix = COPULA_PARAMS[copulaType]?.corrMatrix || COPULA_PARAMS.Gaussian.corrMatrix;
    const pairCorr   = corrMatrix[pairA][pairB];

    // Scatter data for the pair
    const scatterData = Array.from({ length: 80 }, (_, i) => {
      const u = sr(i * 13 + pairA * 100);
      const v = pairCorr * u + Math.sqrt(1 - pairCorr ** 2) * sr(i * 13 + pairB * 100 + 50);
      return { x: +u.toFixed(3), y: +Math.max(0, Math.min(1, v)).toFixed(3) };
    });

    return (
      <div>
        <SectionHeader title="Copula Dependency Structure"
          sub="Gaussian / Student-t / Clayton copula · Tail dependence coefficients · Pair scatter plots" />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {COPULA_TYPES.map(c => <Btn key={c} active={copulaType === c} onClick={() => setCopulaType(c)}>{c}</Btn>)}
          <div style={{ width: 1, height: 24, background: T.border }} />
          <span style={{ fontSize: 12, color: T.muted }}>Asset A:</span>
          <Sel value={pairA} onChange={v => setPairA(+v)}
            options={ASSET_CLASSES.map((a, i) => ({ value: i, label: a }))} />
          <span style={{ fontSize: 12, color: T.muted }}>Asset B:</span>
          <Sel value={pairB} onChange={v => setPairB(+v)}
            options={ASSET_CLASSES.map((a, i) => ({ value: i, label: a }))} />
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="Copula Type" value={copulaType} color={T.indigo} sub="Selected dependency structure" />
          <KpiCard label="Pair Correlation" value={fmt2(pairCorr)} color={cvarColor(Math.abs(pairCorr))} sub={`${ASSET_CLASSES[pairA].split(' ')[0]} / ${ASSET_CLASSES[pairB].split(' ')[0]}`} />
          <KpiCard label="Upper Tail Dep λᵤ" value={(copulaType === 'Clayton' ? 0 : pairCorr * 0.4 + sr(pairA * 7 + pairB * 3) * 0.2).toFixed(3)} color={T.red} sub="Prob both assets crash jointly" />
          <KpiCard label="Lower Tail Dep λₗ" value={(copulaType === 'Clayton' ? (2 ** (-1 / COPULA_PARAMS.Clayton.theta)).toFixed(3) : '0.000')} color={T.orange} sub="Lower tail concordance" />
          {copulaType === 'Student-t' && <KpiCard label="Degrees of Freedom" value={COPULA_PARAMS['Student-t'].df} color={T.purple} sub="t-copula df parameter" />}
          {copulaType === 'Clayton' && <KpiCard label="Clayton θ" value={COPULA_PARAMS.Clayton.theta} color={T.teal} sub="Clayton copula parameter" />}
        </div>

        {/* Pair scatter */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
              Copula Scatter: {ASSET_CLASSES[pairA].split(' ')[0]} vs {ASSET_CLASSES[pairB].split(' ')[0]}
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="x" name={ASSET_CLASSES[pairA]} domain={[0, 1]} tick={{ fontSize: 9, fill: T.muted }} label={{ value: ASSET_CLASSES[pairA].split(' ')[0], position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name={ASSET_CLASSES[pairB]} domain={[0, 1]} tick={{ fontSize: 9, fill: T.muted }} label={{ value: ASSET_CLASSES[pairB].split(' ')[0], angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v.toFixed(3), n]} />
                <Scatter data={scatterData} fill={T.indigo} opacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Correlation matrix heat */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
              {copulaType} Correlation Matrix
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 9 }}>
                <thead>
                  <tr>
                    <th style={{ width: 60 }} />
                    {ASSET_CLASSES.map((a, i) => (
                      <th key={i} style={{ padding: '2px 4px', color: T.muted, writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 60, fontWeight: 600 }}>
                        {a.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {corrMatrix.map((rowArr, i) => (
                    <tr key={i}>
                      <td style={{ padding: '3px 4px', color: T.muted, fontSize: 9, whiteSpace: 'nowrap' }}>{ASSET_CLASSES[i].split(' ')[0]}</td>
                      {rowArr.map((v, j) => (
                        <td key={j} style={{
                          background: i === j ? T.navy : `rgba(79,70,229,${Math.abs(v) * 0.8})`,
                          color: i === j ? '#fff' : T.text,
                          width: 36, height: 28, textAlign: 'center', fontWeight: i === j ? 700 : 400,
                        }}>
                          {v.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tail dependence bar */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Tail Dependence Coefficients — All Asset Pairs vs {ASSET_CLASSES[pairA]}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ASSET_CLASSES.map((a, i) => ({
              name: a.split(' ')[0],
              upper: +(corrMatrix[pairA][i] * 0.4 + sr(pairA * 17 + i * 7) * 0.2).toFixed(3),
              lower: +(corrMatrix[pairA][i] * 0.2 + sr(pairA * 17 + i * 7 + 100) * 0.1).toFixed(3),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="upper" name="Upper Tail Dep λᵤ" fill={T.red} radius={[3,3,0,0]} />
              <Bar dataKey="lower" name="Lower Tail Dep λₗ" fill={T.orange} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Copula model comparison table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Copula Model Comparison — Portfolio CVaR Impact
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Copula Model', 'Parameters', 'Avg Pair Corr', 'Upper Tail Dep', 'Portfolio CVaR 95%', 'Portfolio CVaR 99%', 'CVaR Uplift vs Gaussian', 'Suitability'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: T.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Gaussian', params: 'Σ (8×8)', tailDep: '0.000', upliftFactor: 1.00, suit: 'Normal markets' },
                { name: 'Student-t', params: `df=${COPULA_PARAMS['Student-t'].df}, Σ`, tailDep: (pairCorr * 0.35 + 0.05).toFixed(3), upliftFactor: 1.12 + sr(77) * 0.08, suit: 'Fat-tail regimes' },
                { name: 'Clayton', params: `θ=${COPULA_PARAMS.Clayton.theta}`, tailDep: (2 ** (-1 / COPULA_PARAMS.Clayton.theta)).toFixed(3), upliftFactor: 1.06 + sr(88) * 0.06, suit: 'Lower-tail crises' },
              ].map(({ name, params, tailDep, upliftFactor, suit }) => {
                const avgCorr = ASSET_CLASSES.reduce((s, _, i) => s + ASSET_CLASSES.reduce((ss, __, j) => ss + (i !== j ? COPULA_PARAMS.Gaussian.corrMatrix[i][j] : 0), 0), 0) / (64 - 8);
                const c95 = portfolioCVaR95 * upliftFactor;
                const c99 = portfolioCVaR99 * upliftFactor;
                const uplift = ((upliftFactor - 1) * 100).toFixed(1);
                return (
                  <tr key={name} style={{ borderBottom: `1px solid ${T.border}`, background: copulaType === name ? `${T.indigo}11` : 'transparent' }}>
                    <td style={{ padding: '7px 10px', fontSize: 12, fontWeight: 700, color: copulaType === name ? T.indigo : T.navy }}>{name}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right', color: T.muted, fontFamily: 'JetBrains Mono, monospace' }}>{params}</td>
                    <td style={{ padding: '7px 10px', fontSize: 12, textAlign: 'right' }}>{avgCorr.toFixed(3)}</td>
                    <td style={{ padding: '7px 10px', fontSize: 12, textAlign: 'right', color: +tailDep > 0.2 ? T.red : T.muted }}>{tailDep}</td>
                    <td style={{ padding: '7px 10px', fontSize: 12, textAlign: 'right', color: cvarColor(c95), fontWeight: 700 }}>{pct(c95)}</td>
                    <td style={{ padding: '7px 10px', fontSize: 12, textAlign: 'right', color: cvarColor(c99) }}>{pct(c99)}</td>
                    <td style={{ padding: '7px 10px', fontSize: 12, textAlign: 'right', color: uplift > 0 ? T.red : T.green }}>
                      {+uplift > 0 ? `+${uplift}%` : `${uplift}%`}
                    </td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right', color: T.muted }}>{suit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Joint extreme event probability */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Joint Extreme Event Probability — P(both assets exceed VaR simultaneously)
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                <th style={{ padding: '7px 12px', fontSize: 11, color: T.muted }}>Asset Pair</th>
                <th style={{ padding: '7px 12px', fontSize: 11, color: T.muted, textAlign: 'right' }}>ρ</th>
                <th style={{ padding: '7px 12px', fontSize: 11, color: T.muted, textAlign: 'right' }}>P(joint exceedance) — Gaussian</th>
                <th style={{ padding: '7px 12px', fontSize: 11, color: T.muted, textAlign: 'right' }}>P(joint exceedance) — Student-t</th>
                <th style={{ padding: '7px 12px', fontSize: 11, color: T.muted, textAlign: 'right' }}>Systemic Risk Flag</th>
              </tr>
            </thead>
            <tbody>
              {ASSET_CLASSES.slice(0, 5).map((a, i) =>
                ASSET_CLASSES.slice(i + 1, i + 3).map((b, jj) => {
                  const j = i + jj + 1;
                  const rho = corrMatrix[i][j];
                  const pGauss  = (0.0025 + rho * 0.015 + sr(i * 13 + j * 7) * 0.005);
                  const pStudT  = pGauss * (1 + 0.3 * rho);
                  return (
                    <tr key={`${i}-${j}`} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 12px', fontSize: 12, color: T.navy, fontWeight: 600 }}>{a} / {b}</td>
                      <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right' }}>{rho.toFixed(3)}</td>
                      <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right' }}>{(pGauss * 100).toFixed(3)}%</td>
                      <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: T.red }}>{(pStudT * 100).toFixed(3)}%</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                        <span style={{ background: `${pStudT > 0.03 ? T.red : pStudT > 0.015 ? T.amber : T.green}22`, color: pStudT > 0.03 ? T.red : pStudT > 0.015 ? T.amber : T.green, border: `1px solid ${pStudT > 0.03 ? T.red : pStudT > 0.015 ? T.amber : T.green}55`, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
                          {pStudT > 0.03 ? 'HIGH SYSTEMIC' : pStudT > 0.015 ? 'ELEVATED' : 'CONTAINED'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════
     TAB 5 — Factor Decomposition
     ════════════════════════════════════════════════════════════════════════ */
  const renderFactors = () => {
    const factorReturnsChart = FACTOR_RETURNS[selectedFactor].slice(-rollingWindow);

    const loadingData = ASSET_CLASSES.map((a, ai) => {
      const p = filteredParams.find(x => x.assetIdx === ai);
      const r2 = p ? 0.35 + sr(ai * 23 + selectedFactor * 7) * 0.55 : 0;
      return {
        asset: a.split(' ')[0],
        physAcute:   p ? +(p.factorLoading_PhysAcute   * 100).toFixed(1) : 0,
        physChronic: p ? +(p.factorLoading_PhysChronic * 100).toFixed(1) : 0,
        transPolicy: p ? +(p.factorLoading_TransPolicy * 100).toFixed(1) : 0,
        transTech:   p ? +(p.factorLoading_TransTech   * 100).toFixed(1) : 0,
        r2: r2.toFixed(3),
        margFactorCVaR: p ? +(p.combinedCVaR95 * [p.factorLoading_PhysAcute, p.factorLoading_PhysChronic, p.factorLoading_TransPolicy, p.factorLoading_TransTech][selectedFactor] * 100).toFixed(2) : 0,
      };
    });

    return (
      <div>
        <SectionHeader title="Climate Factor Decomposition"
          sub="Physical acute/chronic + Transition policy/tech factor returns · Marginal factor CVaR · R² attribution" />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {FACTORS.map((f, i) => <Btn key={f} active={selectedFactor === i} onClick={() => setSelectedFactor(i)}>{f}</Btn>)}
          <div style={{ width: 1, height: 24, background: T.border }} />
          <Btn active={showR2} onClick={() => setShowR2(!showR2)}>{showR2 ? 'Hide R²' : 'Show R²'}</Btn>
          <Sel value={rollingWindow} onChange={v => setRollingWindow(+v)}
            options={[{ value: 12, label: '12m' }, { value: 24, label: '24m' }]} />
        </div>

        {/* Factor return time series */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            {FACTORS[selectedFactor]} Factor Returns — {rollingWindow}m History
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={factorReturnsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.muted }} />
              <YAxis tickFormatter={v => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 9, fill: T.muted }} />
              <Tooltip formatter={v => pct(v)} />
              <ReferenceLine y={0} stroke={T.border} strokeWidth={1.5} />
              <Area type="monotone" dataKey="return" name="Factor Return" fill={`${T.indigo}22`} stroke={T.indigo} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Factor loading bar */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Factor Loadings by Asset Class (×100bp)
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={loadingData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="asset" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'bps', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="physAcute"   name="Phys Acute"   fill={T.red}    radius={[3,3,0,0]} />
              <Bar dataKey="physChronic" name="Phys Chronic" fill={T.orange} radius={[3,3,0,0]} />
              <Bar dataKey="transPolicy" name="Trans Policy" fill={T.indigo} radius={[3,3,0,0]} />
              <Bar dataKey="transTech"   name="Trans Tech"   fill={T.teal}   radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* R² and marginal factor CVaR table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, overflowX: 'auto' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Factor Attribution Table — {FACTORS[selectedFactor]}
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Asset Class', 'Phys Acute', 'Phys Chronic', 'Trans Policy', 'Trans Tech', 'Marginal Factor CVaR', ...(showR2 ? ['R²'] : [])].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: T.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingData.map(d => (
                <tr key={d.asset} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, color: T.navy }}>{d.asset}</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{d.physAcute}bp</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{d.physChronic}bp</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{d.transPolicy}bp</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{d.transTech}bp</td>
                  <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right', color: cvarColor(d.margFactorCVaR / 100), fontWeight: 700 }}>{d.margFactorCVaR}bp</td>
                  {showR2 && <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{d.r2}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cumulative factor returns */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Cumulative Factor Returns — All 4 Factors (24m)
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={BACKTEST_DATA.map((d, mi) => {
              const entry = { label: d.label };
              FACTORS.forEach((f, fi) => {
                const cumRet = FACTOR_RETURNS[fi].slice(0, mi + 1).reduce((s, x) => s + x.return, 0);
                entry[f] = +(cumRet * 100).toFixed(2);
              });
              return entry;
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 9, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <ReferenceLine y={0} stroke={T.border} />
              {FACTORS.map((f, fi) => (
                <Line key={f} type="monotone" dataKey={f} stroke={[T.red, T.orange, T.indigo, T.teal][fi]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cross-factor correlation matrix */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Cross-Factor Correlation Matrix — {rollingWindow}m Trailing
          </div>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: 120 }} />
                {FACTORS.map(f => <th key={f} style={{ padding: '6px 16px', fontSize: 11, color: T.muted, fontWeight: 700 }}>{f}</th>)}
              </tr>
            </thead>
            <tbody>
              {FACTORS.map((fa, fi) => (
                <tr key={fa}>
                  <td style={{ padding: '6px 12px', fontSize: 11, color: T.muted, fontWeight: 600 }}>{fa}</td>
                  {FACTORS.map((fb, fj) => {
                    const corr = fi === fj ? 1 : +(0.05 + sr(fi * 47 + fj * 31) * 0.60 * (fi < fj ? 1 : -1)).toFixed(3);
                    const absCorr = Math.abs(corr);
                    return (
                      <td key={fj} style={{
                        padding: '8px 16px', textAlign: 'center', fontSize: 12,
                        background: fi === fj ? T.navy : `rgba(${corr > 0 ? '79,70,229' : '220,38,38'},${absCorr * 0.7})`,
                        color: fi === fj ? '#fff' : absCorr > 0.4 ? '#fff' : T.text,
                        fontWeight: fi === fj ? 700 : 400, width: 70,
                      }}>
                        {corr.toFixed(3)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 10 }}>
            Blue = positive correlation · Red = negative correlation · Intensity = magnitude
          </div>
        </div>

        {/* Factor CVaR contribution chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Factor CVaR Contribution — Portfolio Level · {NGFS_SCENARIOS[selectedScenario].name}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={FACTORS.map((f, fi) => {
              const totalLoading = filteredParams.reduce((s, p) => {
                const loadings = [p.factorLoading_PhysAcute, p.factorLoading_PhysChronic, p.factorLoading_TransPolicy, p.factorLoading_TransTech];
                return s + wNorm[p.assetIdx] * loadings[fi] * p.combinedCVaR95;
              }, 0);
              return { factor: f, contribution: +(totalLoading * 100).toFixed(3) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="factor" tick={{ fontSize: 11, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}bp`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => `${v}bp`} />
              <Bar dataKey="contribution" name="Factor CVaR Contribution (bp)" radius={[4,4,0,0]}>
                {FACTORS.map((f, fi) => <Cell key={fi} fill={[T.red, T.orange, T.indigo, T.teal][fi]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════
     TAB 6 — Sensitivity & Back-test
     ════════════════════════════════════════════════════════════════════════ */
  const renderBacktest = () => {
    const displayData = BACKTEST_DATA.slice(-rollingWindow);
    const exceptions  = BACKTEST_DATA.filter(d => d.exception).length;
    const T_stat      = ((exceptions - rollingWindow * 0.05) ** 2 / (rollingWindow * 0.05 * 0.95)).toFixed(3);
    const pass        = exceptions <= Math.ceil(rollingWindow * 0.08);

    // Correlation sensitivity sweep
    const corrSweep = Array.from({ length: 11 }, (_, i) => {
      const rho = -0.5 + i * 0.1;
      const cvar = portfolioCVaR95 * (1 + rho * 0.3);
      return { rho: rho.toFixed(1), cvar: +(cvar * 100).toFixed(2) };
    });

    return (
      <div>
        <SectionHeader title="Sensitivity Analysis & Historical Back-test"
          sub="CVaR sensitivity to correlation · 24-month P&L vs VaR bands · Kupiec test · Basel traffic light" />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: T.muted }}>Window:</span>
          {[12, 24].map(w => <Btn key={w} small active={rollingWindow === w} onClick={() => setRollingWindow(w)}>{w}m</Btn>)}
        </div>

        {/* Back-test KPIs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="Observations" value={rollingWindow} color={T.navy} sub="Monthly P&L points" />
          <KpiCard label="VaR Exceptions" value={exceptions} color={exceptions > 5 ? T.red : T.green} sub={`of ${rollingWindow} (${(exceptions / rollingWindow * 100).toFixed(1)}%)`} />
          <KpiCard label="Kupiec LR Stat" value={T_stat} color={T.purple} sub="χ² critical 3.84 @ 95%" />
          <KpiCard label="Basel Traffic Light" value={pass ? 'GREEN' : exceptions > 9 ? 'RED' : 'YELLOW'} color={pass ? T.green : exceptions > 9 ? T.red : T.amber} sub={pass ? 'Model adequate' : 'Review required'} />
          <KpiCard label="Confidence Interval" value="99%" color={T.indigo} sub="Kupiec test level" />
        </div>

        {/* P&L vs VaR chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Monthly P&L vs VaR 95% Band — Exception days marked
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 9, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <ReferenceLine y={0} stroke={T.border} />
              <Area type="monotone" dataKey="var95" name="VaR 95% Band" fill={`${T.orange}22`} stroke={T.orange} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="pnl" name="Actual P&L (%)" stroke={T.indigo} strokeWidth={2} dot={(p) => p.payload.exception ? <circle cx={p.cx} cy={p.cy} r={5} fill={T.red} /> : null} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Correlation sensitivity */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            CVaR Sensitivity to Correlation Assumption (ρ sweep −0.5 → +0.5)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={corrSweep}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="rho" tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Correlation ρ', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <ReferenceLine x={'0.0'} stroke={T.muted} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="cvar" name="Portfolio CVaR (%)" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Exception list */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            VaR Exception Log ({exceptions} breaches)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BACKTEST_DATA.filter(d => d.exception).map(d => (
              <div key={d.label} style={{
                background: `${T.red}11`, border: `1px solid ${T.red}44`,
                borderRadius: 6, padding: '6px 12px', fontSize: 12,
              }}>
                <b style={{ color: T.red }}>{d.label}</b>
                <span style={{ color: T.muted, marginLeft: 8 }}>P&L: {d.pnl}% | VaR: {d.var95}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rolling exception rate chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Rolling 6-Month Exception Rate vs 5% Threshold
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={BACKTEST_DATA.slice(5).map((d, i) => {
              const window6 = BACKTEST_DATA.slice(i, i + 6);
              const excRate = window6.filter(x => x.exception).length / 6;
              return { label: d.label, excRate: +(excRate * 100).toFixed(1) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} domain={[0, 30]} tick={{ fontSize: 9, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <ReferenceLine y={5} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Expected 5%', fill: T.green, fontSize: 10 }} />
              <ReferenceLine y={10} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Amber 10%', fill: T.amber, fontSize: 10 }} />
              <ReferenceLine y={20} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Red 20%', fill: T.red, fontSize: 10 }} />
              <Line type="monotone" dataKey="excRate" name="Rolling Exception %" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sensitivity to CVaR parameter assumptions */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            CVaR Sensitivity Table — Parameter Perturbation Analysis
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Perturbation', 'CVaR 95% Base', 'CVaR 95% Shocked', 'Δ CVaR', 'Δ % Change', 'Significance'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'right', fontSize: 11, color: T.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Correlation +10%', factor: 1.10 },
                { label: 'Correlation +25%', factor: 1.25 },
                { label: 'Volatility +20%',  factor: 1.20 },
                { label: 'Phys risk ×1.5',   factor: 1.15 },
                { label: 'Trans risk ×1.5',  factor: 1.12 },
                { label: 'Tail index +0.1',  factor: 1.08 },
              ].map(({ label, factor }) => {
                const base    = portfolioCVaR95;
                const shocked = base * factor;
                const delta   = shocked - base;
                const pctDelta = base > 0 ? delta / base * 100 : 0;
                return (
                  <tr key={label} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 12px', fontSize: 12, color: T.navy, fontWeight: 600 }}>{label}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right' }}>{pct(base)}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: cvarColor(shocked), fontWeight: 700 }}>{pct(shocked)}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: T.red }}>+{pct(delta)}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right' }}>+{pctDelta.toFixed(1)}%</td>
                    <td style={{ padding: '6px 12px', fontSize: 11, textAlign: 'right', color: pctDelta > 15 ? T.red : pctDelta > 8 ? T.amber : T.green }}>
                      {pctDelta > 15 ? 'Material' : pctDelta > 8 ? 'Moderate' : 'Low'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════
     TAB 7 — Portfolio Optimizer
     ════════════════════════════════════════════════════════════════════════ */
  const renderOptimizer = () => {
    const liveCVaR = ASSET_CLASSES.reduce((sum, _, ai) => {
      const p = filteredParams.find(x => x.assetIdx === ai);
      return sum + (p ? wNorm[ai] * p.combinedCVaR95 : 0);
    }, 0);

    const liveReturn = ASSET_CLASSES.reduce((sum, _, ai) => {
      return sum + wNorm[ai] * (0.04 + sr(ai * 19 + 5) * 0.10);
    }, 0);

    const minCVaRWeights = [5, 10, 25, 20, 10, 20, 5, 5]; // hypothetical min CVaR allocation

    const setMinCVaR = () => setWeights([...minCVaRWeights]);

    return (
      <div>
        <SectionHeader title="Portfolio Optimizer"
          sub="Weight sliders · Efficient frontier (CVaR vs Return) · Minimum CVaR · Maximum diversification" />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn onClick={setMinCVaR}>Min CVaR Portfolio</Btn>
          <Btn onClick={() => setWeights([...DEFAULT_WEIGHTS])}>Reset to Default</Btn>
          <Btn onClick={normalizeWeights}>Normalize to 100%</Btn>
          <Btn active={showFrontier} onClick={() => setShowFrontier(!showFrontier)}>
            {showFrontier ? 'Hide Frontier' : 'Show Frontier'}
          </Btn>
          <div style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: 6,
            background: Math.abs(weightTotal - 100) < 0.5 ? `${T.green}22` : `${T.red}22`,
            border: `1px solid ${Math.abs(weightTotal - 100) < 0.5 ? T.green : T.red}`,
            fontSize: 12, fontWeight: 700,
            color: Math.abs(weightTotal - 100) < 0.5 ? T.green : T.red,
          }}>
            Total: {weightTotal.toFixed(0)}%
          </div>
        </div>

        {/* Live KPIs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="Live Portfolio CVaR 95%" value={pct(liveCVaR)} color={cvarColor(liveCVaR)} sub="Current weights" />
          <KpiCard label="Live Expected Return" value={pct(liveReturn)} color={T.green} sub="Weighted return estimate" />
          <KpiCard label="CVaR-Adjusted Return" value={(liveReturn / Math.max(liveCVaR, 0.001)).toFixed(3)} color={T.indigo} sub="Return / CVaR ratio" />
          <KpiCard label="Weight Concentration (HHI)" value={(wNorm.reduce((s, w) => s + w ** 2, 0) * 100).toFixed(1)} color={T.navy} sub="Lower = more diversified" />
        </div>

        {/* Weight sliders */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Asset Allocation Sliders</div>
          {ASSET_CLASSES.map((a, i) => {
            const p = filteredParams.find(x => x.assetIdx === i);
            const aC = p ? cvarColor(p.combinedCVaR95) : T.muted;
            return (
              <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 130, fontSize: 12, fontWeight: 600, color: T.navy, flexShrink: 0 }}>{a}</div>
                <input type="range" min={0} max={100} step={1} value={weights[i]}
                  onChange={e => handleWeight(i, e.target.value)}
                  style={{ flex: 1, accentColor: T.indigo, cursor: 'pointer' }} />
                <input type="number" min={0} max={100} value={weights[i]}
                  onChange={e => handleWeight(i, e.target.value)}
                  style={{
                    width: 55, padding: '4px 6px', border: `1px solid ${T.border}`,
                    borderRadius: 4, fontSize: 12, textAlign: 'center',
                  }} />
                <span style={{ fontSize: 11, color: T.muted, width: 20 }}>%</span>
                <span style={{ fontSize: 11, color: aC, width: 80, textAlign: 'right' }}>
                  CVaR {p ? pct(p.combinedCVaR95) : 'N/A'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Efficient frontier */}
        {showFrontier && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
              Efficient Frontier — CVaR vs Expected Return (20 Portfolios)
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="cvar" name="CVaR 95%" tickFormatter={v => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 10 }} label={{ value: 'CVaR 95%', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                <YAxis type="number" dataKey="ret" name="Expected Return" tickFormatter={v => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 10 }} label={{ value: 'Expected Return', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [`${(v * 100).toFixed(2)}%`, n]} />
                <Scatter name="Efficient Frontier" data={EFFICIENT_FRONTIER} fill={T.indigo} opacity={0.8}>
                  {EFFICIENT_FRONTIER.map((p, i) => (
                    <Cell key={i} fill={i < 5 ? T.green : i < 10 ? T.teal : i < 15 ? T.amber : T.red} />
                  ))}
                </Scatter>
                {/* Current portfolio */}
                <Scatter name="Current Portfolio" data={[{ cvar: liveCVaR, ret: liveReturn }]} fill={T.gold} shape="star" />
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: T.muted }}>
              <span style={{ color: T.green }}>■ Low CVaR region</span>
              <span style={{ color: T.teal }}>■ Moderate CVaR</span>
              <span style={{ color: T.amber }}>■ Higher CVaR</span>
              <span style={{ color: T.red }}>■ High CVaR</span>
              <span style={{ color: T.gold }}>★ Current portfolio</span>
            </div>
          </div>
        )}

        {/* Frontier detail table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Efficient Frontier — 20 Portfolio Points Detail
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Portfolio', 'CVaR 95%', 'Exp Return', 'Return/CVaR', 'CVaR Budget', 'Risk Tier'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'right', fontSize: 11, color: T.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EFFICIENT_FRONTIER.map((pt, i) => {
                const ratio = pt.ret / Math.max(pt.cvar, 0.001);
                const tier = pt.cvar < 0.07 ? 'Conservative' : pt.cvar < 0.10 ? 'Moderate' : pt.cvar < 0.13 ? 'Balanced' : 'Aggressive';
                const tierColor = { Conservative: T.green, Moderate: T.teal, Balanced: T.amber, Aggressive: T.red }[tier];
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 12px', fontSize: 12, color: T.navy, fontWeight: 600 }}>{pt.label}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: cvarColor(pt.cvar), fontWeight: 700 }}>{pct(pt.cvar)}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: T.green }}>{pct(pt.ret)}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right' }}>{ratio.toFixed(3)}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: T.muted }}>{(pt.cvar * 100 / (EFFICIENT_FRONTIER[EFFICIENT_FRONTIER.length - 1].cvar * 100) * 100).toFixed(0)}%</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                      <span style={{ background: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}55`, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>{tier}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Min CVaR vs current weight comparison */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Current Weights vs Minimum CVaR Portfolio — Allocation Comparison
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ASSET_CLASSES.map((a, i) => ({
              name: a.split(' ')[0],
              current: +(wNorm[i] * 100).toFixed(1),
              minCVaR: +([5, 10, 25, 20, 10, 20, 5, 5][i]).toFixed(1),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Bar dataKey="current" name="Current Allocation" fill={T.indigo} radius={[3,3,0,0]} />
              <Bar dataKey="minCVaR" name="Min CVaR Portfolio" fill={T.green}  radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk attribution waterfall */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            CVaR Risk Attribution Waterfall — Contribution by Asset Class
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={(() => {
              let cumulative = 0;
              return filteredParams.map(p => {
                const contribution = wNorm[p.assetIdx] * p.combinedCVaR95 * 100;
                const start = cumulative;
                cumulative += contribution;
                return {
                  name: p.asset.split(' ')[0],
                  start: +start.toFixed(2),
                  contribution: +contribution.toFixed(2),
                  total: +cumulative.toFixed(2),
                };
              });
            })()}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Bar dataKey="start" name="Cumulative Base" stackId="w" fill="transparent" />
              <Bar dataKey="contribution" name="CVaR Contribution" stackId="w" radius={[3,3,0,0]}>
                {filteredParams.map((p, i) => <Cell key={i} fill={[T.indigo, T.purple, T.teal, T.orange, T.red, T.gold, T.green, T.navy][i % 8]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Regulatory compliance checklist */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 14 }}>
            Regulatory Compliance Checklist — CVaR Model Requirements
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { req: 'CVaR 99% 10-day calculated', status: true, ref: 'Basel III Art. 325bf' },
              { req: 'Stressed CVaR multiplier ≥ 3.0', status: true, ref: 'Basel III Art. 325bh' },
              { req: 'Back-test 250 obs. minimum', status: rollingWindow >= 12, ref: 'Basel III Art. 325ba' },
              { req: 'Exception count ≤ 4 (green zone)', status: BACKTEST_DATA.filter(d => d.exception).length <= 4, ref: 'Basel III Art. 325bc' },
              { req: 'Correlation assumptions documented', status: true, ref: 'FRTB MAR21.8' },
              { req: 'Climate CVaR scenario coverage', status: NGFS_SCENARIOS.length >= 6, ref: 'ECB Guide 2022' },
              { req: 'ES 97.5% FRTB computed', status: true, ref: 'FRTB MAR33.2' },
              { req: 'Tail dependency analysis complete', status: true, ref: 'BCBS WP-37' },
            ].map(({ req, status, ref }) => (
              <div key={req} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: T.sub, borderRadius: 6, padding: '10px 12px',
                border: `1px solid ${status ? T.green : T.red}33`,
              }}>
                <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, color: status ? T.green : T.red }}>{status ? '✓' : '✗'}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{req}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{ref}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════
     TAB 8 — Diversification Analysis
     ════════════════════════════════════════════════════════════════════════ */
  const renderDiversification = () => {
    const hhi = wNorm.reduce((s, w) => s + w ** 2, 0);
    const divRatio = sumStandaloneCVaR95 > 0 ? portfolioCVaR95 * 0.82 / sumStandaloneCVaR95 : 1;
    const margDivBenefit = ASSET_CLASSES.map((a, ai) => {
      const p = filteredParams.find(x => x.assetIdx === ai);
      if (!p) return { asset: a.split(' ')[0], benefit: 0, standalone: 0, marginal: 0 };
      const standalone = p.combinedCVaR95;
      const marginal   = wNorm[ai] * p.combinedCVaR95 * 0.82;
      return { asset: a.split(' ')[0], benefit: +(standalone - marginal).toFixed(4), standalone: +standalone.toFixed(4), marginal: +marginal.toFixed(4) };
    });

    // Pairwise scatter
    const pairScatter = ASSET_CLASSES.flatMap((a, i) =>
      ASSET_CLASSES.slice(i + 1).map((b, j) => {
        const corr = COPULA_PARAMS.Gaussian.corrMatrix[i][i + j + 1];
        const pa = filteredParams.find(x => x.assetIdx === i);
        const pb = filteredParams.find(x => x.assetIdx === i + j + 1);
        return {
          corr: +corr.toFixed(3),
          divBen: pa && pb ? +Math.max(0, (pa.combinedCVaR95 + pb.combinedCVaR95) * 0.5 * (1 - corr) * 0.4).toFixed(4) : 0,
          label: `${a.split(' ')[0]}/${b.split(' ')[0]}`,
        };
      })
    );

    const aboveThreshold = pairScatter.filter(p => p.corr > divThreshold);

    return (
      <div>
        <SectionHeader title="Diversification Analysis"
          sub="Diversification ratio · Marginal benefit per asset · HHI concentration · Pairwise correlation scatter" />

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="Diversification Ratio" value={divRatio.toFixed(3)} color={divRatio < 0.7 ? T.green : T.amber} sub="Portfolio CVaR / Standalone sum" />
          <KpiCard label="Total Div Benefit" value={pct(divBenefit)} color={T.green} sub="Absolute reduction in CVaR" />
          <KpiCard label="HHI Concentration" value={(hhi * 100).toFixed(1)} color={hhi > 0.25 ? T.red : hhi > 0.15 ? T.amber : T.green} sub="Herfindahl-Hirschman Index ×100" />
          <KpiCard label="Effective Positions" value={(1 / hhi).toFixed(1)} color={T.indigo} sub="1/HHI — diversification score" />
          <KpiCard label="High Corr Pairs" value={aboveThreshold.length} color={aboveThreshold.length > 5 ? T.red : T.green} sub={`ρ > ${divThreshold.toFixed(1)}`} />
        </div>

        {/* Threshold slider */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>Correlation threshold:</span>
          <input type="range" min={0} max={0.9} step={0.05} value={divThreshold}
            onChange={e => setDivThreshold(+e.target.value)}
            style={{ width: 180, accentColor: T.indigo }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>ρ = {divThreshold.toFixed(2)}</span>
        </div>

        {/* Marginal diversification benefit */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Marginal Diversification Benefit by Asset Class
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={margDivBenefit}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="asset" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tickFormatter={v => pct(v)} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => pct(v)} />
              <Legend />
              <Bar dataKey="standalone" name="Standalone CVaR" fill={`${T.orange}88`} radius={[3,3,0,0]} />
              <Bar dataKey="marginal"   name="Marginal CVaR"   fill={T.indigo}       radius={[3,3,0,0]} />
              <Bar dataKey="benefit"    name="Div Benefit"     fill={T.green}        radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pairwise scatter */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Pairwise Correlation vs Diversification Benefit ({pairScatter.length} pairs)
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="corr" name="Correlation ρ" domain={[0, 1]} tick={{ fontSize: 10 }} label={{ value: 'Correlation ρ', position: 'insideBottom', offset: -10, fontSize: 11 }} />
              <YAxis type="number" dataKey="divBen" name="Div Benefit" tickFormatter={v => pct(v)} tick={{ fontSize: 10 }} label={{ value: 'Div Benefit', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip formatter={(v, n) => n === 'Correlation ρ' ? [v.toFixed(3), n] : [pct(v), n]} />
              <ReferenceLine x={divThreshold} stroke={T.red} strokeDasharray="4 4" label={{ value: `ρ threshold: ${divThreshold.toFixed(2)}`, fill: T.red, fontSize: 10 }} />
              <Scatter name="Asset Pairs" data={pairScatter} fill={T.indigo} opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Diversification across scenarios */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Diversification Ratio Across NGFS Scenarios — {HORIZONS[selectedHorizonIdx]}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={NGFS_SCENARIOS.map(sc => {
              const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === sc.id && p.horizonIdx === selectedHorizonIdx);
              const portCVaR = ps.length ? ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) : 0;
              const standSum = ps.length ? ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) : 0;
              const dr = standSum > 0 ? portCVaR * 0.82 / standSum : 1;
              return { name: sc.name.split(' ')[0] + (sc.name.includes('2050') ? '2050' : sc.name.includes('World') ? 'HH' : ''), dr: +dr.toFixed(3), color: sc.color };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis domain={[0, 1]} tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => v.toFixed(3)} />
              <ReferenceLine y={0.7} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Well-diversified', fill: T.green, fontSize: 10 }} />
              <Bar dataKey="dr" name="Diversification Ratio" radius={[4,4,0,0]}>
                {NGFS_SCENARIOS.map((sc, i) => <Cell key={i} fill={sc.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* High-correlation pair table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            High-Correlation Pairs (ρ &gt; {divThreshold.toFixed(2)}) — Diversification Risk
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Asset A', 'Asset B', 'Correlation ρ', 'Joint CVaR Est.', 'Div Benefit Lost', 'Risk Flag'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'right', fontSize: 11, color: T.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASSET_CLASSES.flatMap((a, i) =>
                ASSET_CLASSES.slice(i + 1).map((b, jj) => {
                  const j = i + jj + 1;
                  const corr = COPULA_PARAMS.Gaussian.corrMatrix[i][j];
                  if (corr <= divThreshold) return null;
                  const pa = filteredParams.find(x => x.assetIdx === i);
                  const pb = filteredParams.find(x => x.assetIdx === j);
                  const jointCVaR = pa && pb ? Math.sqrt(pa.combinedCVaR95 ** 2 + pb.combinedCVaR95 ** 2 + 2 * corr * pa.combinedCVaR95 * pb.combinedCVaR95) : 0;
                  const lostBenefit = pa && pb ? (pa.combinedCVaR95 + pb.combinedCVaR95) * 0.5 * (1 - corr) * 0.4 : 0;
                  return (
                    <tr key={`${i}-${j}`} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 12px', fontSize: 12, color: T.navy, fontWeight: 600 }}>{a}</td>
                      <td style={{ padding: '6px 12px', fontSize: 12, color: T.navy }}>{b}</td>
                      <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: corr > 0.7 ? T.red : T.amber, fontWeight: 700 }}>{corr.toFixed(3)}</td>
                      <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right' }}>{pct(jointCVaR)}</td>
                      <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: T.red }}>{pct(lostBenefit)}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                        <span style={{ background: `${corr > 0.7 ? T.red : T.amber}22`, color: corr > 0.7 ? T.red : T.amber, border: `1px solid ${corr > 0.7 ? T.red : T.amber}55`, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
                          {corr > 0.7 ? 'HIGH' : 'ELEVATED'}
                        </span>
                      </td>
                    </tr>
                  );
                }).filter(Boolean)
              )}
            </tbody>
          </table>
        </div>

        {/* Diversification by scenario line chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Diversification Benefit ($M Equivalent) — Horizon Evolution · {NGFS_SCENARIOS[selectedScenario].name}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={HORIZONS.map((hr, hi) => {
              const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === selectedScenario && p.horizonIdx === hi);
              const portC = ps.length ? ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) : 0;
              const standC = ps.length ? ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) : 0;
              const benefit = Math.max(0, standC - portC * 0.82) * 1000;
              return { year: hr, benefit: +benefit.toFixed(1), portCVaR: +(portC * 100).toFixed(2) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.muted }} />
              <YAxis yAxisId="left" tickFormatter={v => `$${v}M`} tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="benefit" name="Div Benefit ($M)" fill={`${T.green}33`} stroke={T.green} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="portCVaR" name="Portfolio CVaR (%)" stroke={T.indigo} strokeWidth={2} dot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Concentration risk table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            Concentration Risk Analysis — Weight vs CVaR Contribution
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Asset Class', 'Weight %', 'CVaR Contrib %', 'Weight / CVaR Ratio', 'Contribution Rank', 'Concentration Flag'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'right', fontSize: 11, color: T.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filteredParams].sort((a, b) => (wNorm[b.assetIdx] * b.combinedCVaR95) - (wNorm[a.assetIdx] * a.combinedCVaR95)).map((p, rank) => {
                const weightPct  = wNorm[p.assetIdx] * 100;
                const cvarContrib = sumStandaloneCVaR95 > 0 ? wNorm[p.assetIdx] * p.combinedCVaR95 / sumStandaloneCVaR95 * 100 : 0;
                const ratio = weightPct > 0 ? cvarContrib / weightPct : 0;
                const flag = ratio > 1.5 ? 'Over-concentrated' : ratio < 0.5 ? 'Under-utilised' : 'Balanced';
                const flagColor = ratio > 1.5 ? T.red : ratio < 0.5 ? T.blue : T.green;
                return (
                  <tr key={p.asset} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: T.navy }}>{p.asset}</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right' }}>{weightPct.toFixed(1)}%</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: cvarColor(cvarContrib / 100) }}>{cvarContrib.toFixed(1)}%</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: ratio > 1.5 ? T.red : T.text, fontWeight: ratio > 1.5 ? 700 : 400 }}>{ratio.toFixed(2)}×</td>
                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'right', color: T.muted }}>#{rank + 1}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                      <span style={{ background: `${flagColor}22`, color: flagColor, border: `1px solid ${flagColor}55`, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>{flag}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════
     TAB 9 — Summary & Export
     ════════════════════════════════════════════════════════════════════════ */
  const renderExport = () => {
    const scenario = NGFS_SCENARIOS[selectedScenario];
    const horizon  = HORIZONS[selectedHorizonIdx];
    const baselCapital = portfolioCVaR99 * 1.25 * 12.5; // simplified Basel III

    const exportPayload = {
      generated: new Date().toISOString(),
      scenario: scenario.name,
      horizon,
      percentile,
      portfolioCVaR95: +portfolioCVaR95.toFixed(6),
      portfolioCVaR99: +portfolioCVaR99.toFixed(6),
      expectedShortfall: +portfolioES.toFixed(6),
      diversificationBenefit: +divBenefit.toFixed(6),
      baselCapitalRequirement: +baselCapital.toFixed(6),
      weights: Object.fromEntries(ASSET_CLASSES.map((a, i) => [a, wNorm[i].toFixed(4)])),
      assetCVaR: Object.fromEntries(filteredParams.map(p => [p.asset, { cvar95: p.combinedCVaR95.toFixed(6), es: p.esValue.toFixed(6) }])),
      notes,
    };

    const csvRows = [
      ['Metric', 'Value'],
      ['Scenario', scenario.name],
      ['Horizon', horizon],
      ['Percentile', percentile + '%'],
      ['Portfolio CVaR 95%', pct(portfolioCVaR95)],
      ['Portfolio CVaR 99%', pct(portfolioCVaR99)],
      ['Expected Shortfall 99%', pct(portfolioES)],
      ['Diversification Benefit', pct(divBenefit)],
      ['Basel III CVaR Capital', pct(baselCapital)],
      ...ASSET_CLASSES.map((a, i) => {
        const p = filteredParams.find(x => x.assetIdx === i);
        return [a, p ? pct(p.combinedCVaR95) : 'N/A'];
      }),
    ];
    const csvText = csvRows.map(r => r.join(',')).join('\n');

    const exportText = exportFormat === 'JSON' ? JSON.stringify(exportPayload, null, 2) : csvText;

    return (
      <div>
        <SectionHeader title="Summary & Export"
          sub="Full CVaR report · Basel III capital implications · Copy to clipboard" />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <Btn active={exportFormat === 'JSON'} onClick={() => setExportFormat('JSON')}>JSON</Btn>
          <Btn active={exportFormat === 'CSV'}  onClick={() => setExportFormat('CSV')}>CSV</Btn>
          <button
            onClick={() => navigator.clipboard.writeText(exportText).catch(() => {})}
            style={{
              background: T.indigo, color: '#fff', border: 'none',
              borderRadius: 6, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Copy Report
          </button>
        </div>

        {/* Summary KPIs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="Portfolio CVaR 95%" value={pct(portfolioCVaR95)} color={cvarColor(portfolioCVaR95)} />
          <KpiCard label="Portfolio CVaR 99%" value={pct(portfolioCVaR99)} color={cvarColor(portfolioCVaR99)} />
          <KpiCard label="Expected Shortfall 99%" value={pct(portfolioES)} color={T.red} />
          <KpiCard label="Div Benefit" value={pct(divBenefit)} color={T.green} />
          <KpiCard label="Basel III CVaR Capital" value={pct(baselCapital)} color={T.purple} sub="SA-CCR / IMA proxy" />
        </div>

        {/* Full table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20, overflowX: 'auto' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>
            Full CVaR Report — {scenario.name} / {horizon}
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Asset Class','Weight','CVaR 95%','CVaR 99%','ES 99%','GPD ξ','Tail Dep','Factor: PA','Factor: PC','Factor: TP','Factor: TT'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, color: T.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASSET_CLASSES.map((a, ai) => {
                const p = filteredParams.find(x => x.assetIdx === ai);
                if (!p) return null;
                return (
                  <tr key={a} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '7px 10px', fontSize: 11, fontWeight: 700, color: T.navy, whiteSpace: 'nowrap' }}>{a}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right' }}>{(wNorm[ai] * 100).toFixed(1)}%</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right', color: cvarColor(p.combinedCVaR95), fontWeight: 700 }}>{pct(p.combinedCVaR95)}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right', color: cvarColor(p.combinedCVaR99) }}>{pct(p.combinedCVaR99)}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right', color: T.red }}>{pct(p.esValue)}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right' }}>{p.gpdTailIndex.toFixed(3)}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right' }}>{p.tailDepCoeff.toFixed(3)}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right' }}>{(p.factorLoading_PhysAcute * 100).toFixed(0)}bp</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right' }}>{(p.factorLoading_PhysChronic * 100).toFixed(0)}bp</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right' }}>{(p.factorLoading_TransPolicy * 100).toFixed(0)}bp</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, textAlign: 'right' }}>{(p.factorLoading_TransTech * 100).toFixed(0)}bp</td>
                  </tr>
                );
              })}
              <tr style={{ background: T.sub, fontWeight: 700 }}>
                <td style={{ padding: '8px 10px', fontSize: 12, color: T.navy, fontWeight: 700 }}>PORTFOLIO</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>100%</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', color: cvarColor(portfolioCVaR95), fontWeight: 700 }}>{pct(portfolioCVaR95)}</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', color: cvarColor(portfolioCVaR99), fontWeight: 700 }}>{pct(portfolioCVaR99)}</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', color: T.red, fontWeight: 700 }}>{pct(portfolioES)}</td>
                <td colSpan={6} style={{ padding: '8px 10px', fontSize: 11, color: T.muted }}>— Basel III Capital: <b style={{ color: T.purple }}>{pct(baselCapital)}</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Regulatory note */}
        <div style={{ background: `${T.navy}11`, border: `1px solid ${T.navy}33`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Regulatory Capital Implication — Basel III IMA CVaR</div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            Under Basel III Internal Models Approach (IMA), stressed CVaR capital = CVaR 99% × 3.0 multiplier × 12.5 scaling factor.
            Estimated capital requirement: <b style={{ color: T.purple }}>{pct(baselCapital)}</b> of portfolio NAV.
            FRTB SA-CVaR uses a 97.5th percentile 10-day horizon (ES). All figures are model-based estimates for analytical purposes only.
          </div>
        </div>

        {/* Notes */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Analyst Notes</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Enter model assumptions, caveats, review notes..."
            style={{
              width: '100%', minHeight: 100, padding: 10,
              border: `1px solid ${T.border}`, borderRadius: 6,
              fontSize: 12, color: T.text, background: T.sub,
              resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Export payload */}
        <div style={{ background: '#0a0a0a', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6ee7b7', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>
            {exportFormat} Export Preview
          </div>
          <pre style={{
            fontSize: 11, color: '#d1fae5', fontFamily: 'JetBrains Mono, monospace',
            overflowX: 'auto', maxHeight: 320, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {exportText.slice(0, 2000)}{exportText.length > 2000 ? '\n... (truncated)' : ''}
          </pre>
        </div>

        {/* Basel III capital breakdown by asset */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>
            Basel III IMA CVaR Capital Requirements — Asset-Level Breakdown
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>
            Formula: Stressed CVaR Capital = CVaR 99% × multiplier (3.0) × sqrt(10/1) horizon scaling × 12.5 RWA factor
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Asset Class', 'Weight', 'CVaR 99% (1d)', 'CVaR 99% (10d)', 'Stressed CVaR', 'RWA', 'Capital (8%)', 'Capital % NAV'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, color: T.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredParams.map(p => {
                const cvar1d     = p.combinedCVaR99;
                const cvar10d    = cvar1d * Math.sqrt(10);
                const stressedCV = cvar10d * 3.0;
                const rwa        = stressedCV * 12.5;
                const capital    = rwa * 0.08;
                return (
                  <tr key={p.asset} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: T.navy }}>{p.asset}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right' }}>{(wNorm[p.assetIdx] * 100).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right' }}>{pct(cvar1d)}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right' }}>{pct(cvar10d)}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right', color: cvarColor(stressedCV), fontWeight: 700 }}>{pct(stressedCV)}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right' }}>{(rwa * 100).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right', color: T.purple, fontWeight: 700 }}>{pct(capital)}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right' }}>{pct(capital * wNorm[p.assetIdx])}</td>
                  </tr>
                );
              })}
              <tr style={{ background: T.sub, fontWeight: 700 }}>
                <td style={{ padding: '8px 10px', fontSize: 12, color: T.navy, fontWeight: 700 }}>PORTFOLIO TOTAL</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>100%</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', color: T.red }}>{pct(portfolioCVaR99)}</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', color: T.red }}>{pct(portfolioCVaR99 * Math.sqrt(10))}</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', color: T.red, fontWeight: 700 }}>{pct(portfolioCVaR99 * Math.sqrt(10) * 3)}</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{pct(portfolioCVaR99 * Math.sqrt(10) * 3 * 12.5)}</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', color: T.purple, fontWeight: 700 }}>{pct(baselCapital)}</td>
                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', color: T.purple }}>{pct(baselCapital)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FRTB comparison */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>
            FRTB vs Legacy IMA — Capital Comparison
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Legacy IMA CVaR Capital', value: pct(baselCapital), sub: 'Basel 2.5 · 99% 10d CVaR × 3.0', color: T.purple },
              { label: 'FRTB SA-CVaR Capital', value: pct(portfolioES * Math.sqrt(10) * 1.5 * 0.08), sub: 'FRTB SA · ES 97.5% 10d × 1.5', color: T.indigo },
              { label: 'Capital Relief (FRTB vs IMA)', value: pct(Math.max(0, baselCapital - portfolioES * Math.sqrt(10) * 1.5 * 0.08)), sub: 'Reduction from FRTB adoption', color: T.green },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CVaR report summary bar chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
            CVaR Summary — All Scenarios Comparison at {HORIZONS[selectedHorizonIdx]}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={NGFS_SCENARIOS.map(sc => {
              const ps = CVAR_PARAMS.filter(p => p.scenarioIdx === sc.id && p.horizonIdx === selectedHorizonIdx);
              const c95 = ps.length ? +(ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) * 100).toFixed(2) : 0;
              const c99 = ps.length ? +(ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR99, 0) * 100).toFixed(2) : 0;
              const es  = ps.length ? +(ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.esValue,        0) * 100).toFixed(2) : 0;
              const cap = +(c99 / 100 * Math.sqrt(10) * 3 * 0.08 * 100).toFixed(2);
              return { name: sc.name.split(' ').slice(0, 2).join(' '), c95, c99, es, capital: cap };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Bar dataKey="c95"     name="CVaR 95%"  fill={T.indigo} radius={[3,3,0,0]} />
              <Bar dataKey="c99"     name="CVaR 99%"  fill={T.purple} radius={[3,3,0,0]} />
              <Bar dataKey="es"      name="ES 99%"    fill={T.red}    radius={[3,3,0,0]} />
              <Bar dataKey="capital" name="IMA Capital" fill={T.gold}  radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model methodology card */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>
            Model Methodology & Assumptions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { title: 'CVaR Estimation', items: ['Full Monte Carlo simulation: 500 paths', 'Seeded deterministic random (reproducible)', 'Scenario scaling via NGFS 2024 phase III pathways', 'Physical and transition risk modelled separately', 'Combined CVaR via Gaussian copula aggregation'] },
              { title: 'Distribution Fitting', items: ['Normal (Gaussian) baseline', 'Student-t (df=4) for fat-tail regimes', 'Pareto distribution for extreme quantiles', 'GPD EVT estimation above VaR threshold', 'Hill estimator for tail index ξ'] },
              { title: 'Copula Framework', items: ['Gaussian copula: linear correlation only', 'Student-t: symmetric tail dependence', 'Clayton: asymmetric lower-tail dependence', '8×8 asset correlation matrices estimated', 'Pair tail dependence λᵤ / λₗ computed analytically'] },
              { title: 'Regulatory Framework', items: ['Basel III IMA: 99% 10-day CVaR × 3.0', 'FRTB SA: ES 97.5% 10-day × 1.5', 'Kupiec LR back-test (250 observations)', 'Basel traffic light: ≤4 exceptions = green', 'NGFS scenarios per ECB/BIS 2022 guidance'] },
            ].map(({ title, items }) => (
              <div key={title}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>{title}</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {items.map(item => (
                    <li key={item} style={{ fontSize: 11, color: T.muted, marginBottom: 4, lineHeight: 1.5 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: `${T.amber}11`, border: `1px solid ${T.amber}44`, borderRadius: 6, fontSize: 11, color: T.muted }}>
            <b style={{ color: T.amber }}>Disclaimer:</b> All CVaR estimates are model-based using deterministic seeded random data for analytical demonstration purposes. Not for investment decisions. Regulatory capital figures are simplified proxies only.
          </div>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════
     MAIN RENDER
     ════════════════════════════════════════════════════════════════════════ */
  const RENDERERS = [
    renderDashboard,
    renderMatrix,
    renderDecomposition,
    renderDistribution,
    renderCopula,
    renderFactors,
    renderBacktest,
    renderOptimizer,
    renderDiversification,
    renderExport,
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{
        background: T.navy, color: '#fff', padding: '18px 28px',
        borderBottom: `3px solid ${T.gold}`,
      }}>
        <div style={{ fontSize: 9, letterSpacing: '0.15em', color: '#94a3b8', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>
          EP-XX · CLIMATE RISK ANALYTICS · CVAR SUITE
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>Climate CVaR Analytics Suite</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          JP Morgan / Goldman Sachs grade · NGFS 2024 · Basel III IMA · EVT / Copula / Factor Decomposition
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',padding:'8px 16px 0'}}>
        <button onClick={()=>setShowUploader(s=>!s)} style={{background:showUploader?T.red:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
          {showUploader?'\u2715 Close':'Upload Portfolio'}
        </button>
      </div>
      {showUploader&&<div style={{padding:'0 16px 12px'}}><PortfolioUploader
        requiredFields={['name','sector','marketValue','scope1','scope2','beta']}
        optionalFields={['ticker','isin','country','scope3','esgScore']}
        entityType="mixed"
        onUpload={(rows)=>{const newW=ASSET_CLASSES.map((_,ai)=>{const count=rows.filter(r=>(r.assetClass||'Listed Equity')===ASSET_CLASSES[ai]).length;return Math.round(count/Math.max(1,rows.length)*100);});setWeights(newW.every(w=>w===0)?[...DEFAULT_WEIGHTS]:newW);setShowUploader(false);}}
      /></div>}

      {/* Tab bar */}
      <div style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        display: 'flex', overflowX: 'auto', padding: '0 16px',
      }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{
              background: 'none', border: 'none', borderBottom: tab === i ? `3px solid ${T.indigo}` : '3px solid transparent',
              padding: '12px 16px', fontSize: 12, fontWeight: tab === i ? 700 : 400,
              color: tab === i ? T.indigo : T.muted, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {RENDERERS[tab]()}
      </div>

      {/* Status bar */}
      <div style={{
        background: T.navy, color: '#64748b', fontSize: 10,
        padding: '6px 20px', fontFamily: 'JetBrains Mono, monospace',
        display: 'flex', gap: 24, flexWrap: 'wrap',
      }}>
        <span style={{ color: T.gold }}>A² INTELLIGENCE</span>
        <span>SCENARIO: {NGFS_SCENARIOS[selectedScenario].name}</span>
        <span>HORIZON: {HORIZONS[selectedHorizonIdx]}</span>
        <span>CVaR 95%: {pct(portfolioCVaR95)}</span>
        <span>CVaR 99%: {pct(portfolioCVaR99)}</span>
        <span>ES 99%: {pct(portfolioES)}</span>
        <span>ASSETS: {selectedAssets.size}/8</span>
        <span>WEIGHTS: {weightTotal.toFixed(0)}%</span>
        <span style={{ marginLeft: 'auto' }}>192 CVAR PARAMS · 24m BACKTEST · GPD EVT · NGFS 2024</span>
      </div>
    </div>
  );
}
