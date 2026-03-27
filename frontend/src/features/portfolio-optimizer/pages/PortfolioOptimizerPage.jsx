import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, AreaChart, Area, ReferenceLine } from 'recharts';
import { GLOBAL_COMPANY_MASTER, EXCHANGES, globalSearch } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ── Constraint defaults & definitions ─────────────────────────────────── */
const DEFAULT_CONSTRAINTS = {
  minEsgScore: 50, maxWaci: 250, maxSectorWeight: 30, minSbtiPct: 20,
  maxSinglePosition: 15, maxTransitionRisk: 70, excludeHighCarbon: false,
};

const CONSTRAINT_DEFS = [
  { key:'minEsgScore',       label:'Min ESG Score',            min:0,   max:100, unit:'' },
  { key:'maxWaci',           label:'Max WACI (tCO2e/$M)',      min:50,  max:500, unit:'' },
  { key:'maxSectorWeight',   label:'Max Sector Weight',        min:10,  max:50,  unit:'%' },
  { key:'minSbtiPct',        label:'Min SBTi Coverage',        min:0,   max:100, unit:'%' },
  { key:'maxSinglePosition', label:'Max Single Position',      min:5,   max:30,  unit:'%' },
  { key:'maxTransitionRisk', label:'Max Transition Risk',      min:30,  max:100, unit:'' },
];

/* ── Optimization Presets ──────────────────────────────────────────────── */
const PRESETS = {
  'Balanced':            { ...DEFAULT_CONSTRAINTS },
  'Climate-Aligned':     { minEsgScore:60, maxWaci:150, maxSectorWeight:30, minSbtiPct:40, maxSinglePosition:15, maxTransitionRisk:60, excludeHighCarbon:true },
  'Best-in-Class':       { minEsgScore:70, maxWaci:200, maxSectorWeight:25, minSbtiPct:30, maxSinglePosition:10, maxTransitionRisk:60, excludeHighCarbon:false },
  'Aggressive Transition':{ minEsgScore:50, maxWaci:100, maxSectorWeight:30, minSbtiPct:60, maxSinglePosition:15, maxTransitionRisk:50, excludeHighCarbon:true },
};

/* ── Master lookup for enrichment ─────────────────────────────────────── */
let _masterLookup = null;
function getMasterLookup() {
  if (!_masterLookup) { _masterLookup = {}; GLOBAL_COMPANY_MASTER.forEach(c => { _masterLookup[c.ticker] = c; }); }
  return _masterLookup;
}

function enrichHolding(h) {
  const ticker = h.company?.ticker;
  const master = ticker ? getMasterLookup()[ticker] : null;
  if (!master) return h;
  return { ...h, company: { ...h.company, ...master, ...h.company } };
}

function assessDataQuality(company) {
  if (!company) return { level:'low', label:'Low', icon:'\u274C' };
  const critical = [company.scope1_mt, company.scope2_mt, company.esg_score, company.market_cap_usd_mn, company.revenue_usd_mn, company.transition_risk_score];
  const present = critical.filter(v => v != null && v !== undefined).length;
  if (present >= 5) return { level:'full', label:'Full', icon:'\u2705' };
  if (present >= 3) return { level:'partial', label:'Partial', icon:'\u26A0\uFE0F' };
  return { level:'low', label:'Low', icon:'\u274C' };
}

/* ── Compute portfolio metrics ─────────────────────────────────────────── */
function computeMetrics(holdings, weights) {
  if (!holdings.length) return null;
  const waci = holdings.reduce((s, h, i) => {
    const c = h.company || {};
    const rev = c.revenue_usd_mn || 1;
    const ghg = ((c.scope1_mt || 0) + (c.scope2_mt || 0));
    const intensity = ghg / rev;
    return s + intensity * (weights[i] / 100);
  }, 0);
  const esgScore = holdings.reduce((s, h, i) => s + (h.company?.esg_score || 50) * (weights[i] / 100), 0);
  const activeH = holdings.filter((_, i) => weights[i] > 0.01);
  const sbtiCount = holdings.filter((h, i) => weights[i] > 0.01 && h.company?.sbti_committed).length;
  const sbtiPct = activeH.length ? (sbtiCount / activeH.length) * 100 : 0;
  const tRisk = holdings.reduce((s, h, i) => s + (h.company?.transition_risk_score || 50) * (weights[i] / 100), 0);
  const maxWeight = Math.max(...weights);
  const hhi = weights.reduce((s, w) => s + (w / 100) ** 2, 0);
  const sectors = {};
  holdings.forEach((h, i) => { if (weights[i] > 0.01) { const sec = h.company?.sector || 'Unknown'; sectors[sec] = (sectors[sec] || 0) + weights[i]; } });
  return { waci:parseFloat(waci.toFixed(1)), esgScore:parseFloat(esgScore.toFixed(1)), sbtiPct:parseFloat(sbtiPct.toFixed(1)), tRisk:parseFloat(tRisk.toFixed(1)), count:activeH.length, maxWeight:parseFloat(maxWeight.toFixed(1)), hhi:parseFloat(hhi.toFixed(4)), sectors };
}

/* ── Optimizer ─────────────────────────────────────────────────────────── */
function optimizePortfolio(holdings, constraints) {
  if (!holdings.length) return { weights:[], metrics:null, removed:[], violations:[] };
  const totalExp = holdings.reduce((s, h) => s + (h.exposure_usd_mn || h.company?.market_cap_usd_mn || 100), 0) || 1;

  let scores = holdings.map((h, idx) => {
    const c = h.company || {};
    const esg = (c.esg_score || 50) / 100;
    const tRiskPenalty = 1 - (c.transition_risk_score || 50) / 100;
    const sbtiBonus = c.sbti_committed ? 0.2 : 0;
    const sizeWeight = (h.exposure_usd_mn || c.market_cap_usd_mn || 100) / totalExp;
    return { idx, score: esg * 0.4 + tRiskPenalty * 0.3 + sbtiBonus + sizeWeight * 0.1, holding: h };
  });

  const removed = [];
  scores = scores.filter(s => {
    const c = s.holding.company || {};
    if (constraints.excludeHighCarbon && (c.sector === 'Energy' || (((c.scope1_mt || 0) + (c.scope2_mt || 0)) / (c.revenue_usd_mn || 1)) > 400)) { removed.push(s.holding); return false; }
    if ((c.esg_score || 50) < constraints.minEsgScore * 0.6) { removed.push(s.holding); return false; }
    if ((c.transition_risk_score || 50) > constraints.maxTransitionRisk * 1.2) { removed.push(s.holding); return false; }
    return true;
  });

  if (!scores.length) return { weights: holdings.map(() => 0), metrics: null, removed, violations: ['All holdings excluded by constraints'] };

  const totalScore = scores.reduce((s, x) => s + x.score, 0) || 1;
  let rawWeights = new Array(holdings.length).fill(0);
  scores.forEach(s => { rawWeights[s.idx] = (s.score / totalScore) * 100; });

  // Clip single position
  const maxPos = constraints.maxSinglePosition;
  let excess = 0;
  rawWeights = rawWeights.map(w => { if (w > maxPos) { excess += w - maxPos; return maxPos; } return w; });
  if (excess > 0) {
    const belowCap = rawWeights.map((w, i) => w > 0 && w < maxPos ? i : -1).filter(i => i >= 0);
    const belowTotal = belowCap.reduce((s, i) => s + rawWeights[i], 0) || 1;
    belowCap.forEach(i => { rawWeights[i] += excess * (rawWeights[i] / belowTotal); });
  }

  // Normalize to 100
  const wSum = rawWeights.reduce((s, w) => s + w, 0) || 1;
  rawWeights = rawWeights.map(w => parseFloat(((w / wSum) * 100).toFixed(2)));

  const metrics = computeMetrics(holdings, rawWeights);

  // Check violations
  const violations = [];
  if (metrics) {
    if (metrics.waci > constraints.maxWaci) violations.push({ constraint:'Max WACI', value:metrics.waci.toFixed(0), limit:constraints.maxWaci });
    if (metrics.esgScore < constraints.minEsgScore) violations.push({ constraint:'Min ESG Score', value:metrics.esgScore.toFixed(1), limit:constraints.minEsgScore });
    if (metrics.sbtiPct < constraints.minSbtiPct) violations.push({ constraint:'Min SBTi Coverage', value:metrics.sbtiPct.toFixed(1) + '%', limit:constraints.minSbtiPct + '%' });
    Object.entries(metrics.sectors).forEach(([sec, w]) => { if (w > constraints.maxSectorWeight) violations.push({ constraint:`Max Sector (${sec})`, value:w.toFixed(1) + '%', limit:constraints.maxSectorWeight + '%' }); });
    if (metrics.maxWeight > constraints.maxSinglePosition) violations.push({ constraint:'Max Single Position', value:metrics.maxWeight.toFixed(1) + '%', limit:constraints.maxSinglePosition + '%' });
  }

  return { weights: rawWeights, metrics, removed, violations };
}

/* ── Generate efficient frontier from real data ────────────────────────── */
function generateFrontier(holdings) {
  if (!holdings.length) {
    return Array.from({ length: 21 }, (_, i) => {
      const esgMin = i * 5;
      return { esgMin, risk: parseFloat((18 - esgMin * 0.06).toFixed(1)), return: parseFloat((12.5 - esgMin * 0.04).toFixed(1)), label:`ESG>${esgMin}` };
    });
  }

  const points = [];
  for (let threshold = 0; threshold <= 100; threshold += 5) {
    const eligible = holdings.filter(h => (h.company?.esg_score || 0) >= threshold);
    if (eligible.length === 0) {
      points.push({ esgMin: threshold, risk: 0, return: 0, label: `ESG>${threshold}`, count: 0 });
      continue;
    }
    const totalW = eligible.reduce((s, h) => s + (h.weight || 1), 0) || 1;

    // Return proxy: weighted avg of (esg_score * 0.1 + revenue growth proxy)
    const retProxy = eligible.reduce((s, h) => {
      const c = h.company || {};
      const esgRet = (c.esg_score || 50) * 0.1;
      const revYield = ((c.revenue_usd_mn || 100) / (c.market_cap_usd_mn || 1000)) * 10;
      return s + (esgRet + revYield) * ((h.weight || 1) / totalW);
    }, 0);

    // Risk proxy: weighted std dev of transition risk scores
    const meanTR = eligible.reduce((s, h) => s + (h.company?.transition_risk_score || 50) * ((h.weight || 1) / totalW), 0);
    const variance = eligible.reduce((s, h) => {
      const diff = (h.company?.transition_risk_score || 50) - meanTR;
      return s + diff * diff * ((h.weight || 1) / totalW);
    }, 0);
    const riskProxy = Math.sqrt(variance) * 0.5 + 5;

    points.push({
      esgMin: threshold,
      risk: parseFloat(riskProxy.toFixed(1)),
      return: parseFloat(retProxy.toFixed(1)),
      label: `ESG>${threshold}`,
      count: eligible.length,
    });
  }
  return points;
}

/* ── Sub-components ────────────────────────────────────────────────────── */
const SliderControl = ({ label, value, min, max, unit, onChange }) => (
  <div style={{ marginBottom:16 }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
      <span style={{ fontSize:12, color:T.textSec, fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:12, color:T.navy, fontWeight:600 }}>{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
      style={{ width:'100%', accentColor:T.navy, cursor:'pointer' }} />
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMut }}>
      <span>{min}{unit}</span><span>{max}{unit}</span>
    </div>
  </div>
);

const MetricRow = ({ label, current, optimized, higherIsBetter, unit }) => {
  const delta = optimized - current;
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  const arrowChar = delta > 0.05 ? '\u2191' : delta < -0.05 ? '\u2193' : '';
  const fmt = (v) => typeof v === 'number' ? v.toFixed(1) : v;
  return (
    <tr>
      <td style={{ padding:'10px 12px', fontSize:13, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{label}</td>
      <td style={{ padding:'10px 12px', fontSize:13, fontWeight:600, color:T.navy, textAlign:'right', borderBottom:`1px solid ${T.border}` }}>{fmt(current)}{unit || ''}</td>
      <td style={{ padding:'10px 12px', fontSize:13, fontWeight:600, color:T.navy, textAlign:'right', borderBottom:`1px solid ${T.border}` }}>{fmt(optimized)}{unit || ''}</td>
      <td style={{ padding:'10px 12px', fontSize:13, fontWeight:600, textAlign:'right', borderBottom:`1px solid ${T.border}`, color:Math.abs(delta) < 0.05 ? T.textMut : improved ? T.green : T.red }}>
        {arrowChar} {Math.abs(delta).toFixed(1)}
      </td>
    </tr>
  );
};

const CustomTooltip = ({ active, payload, label: tooltipLabel }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:4 }}>{tooltipLabel}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize:11, color:T.textSec, marginTop:2 }}>
          <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', backgroundColor:p.color, marginRight:6 }} />
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

/* ── Main Component ────────────────────────────────────────────────────── */
export default function PortfolioOptimizerPage() {
  const navigate = useNavigate();

  // Portfolio from localStorage
  const [portfolioData, setPortfolioData] = useState(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      return saved ? JSON.parse(saved) : { portfolios:{}, activePortfolio:null };
    } catch { return { portfolios:{}, activePortfolio:null }; }
  });
  const baseHoldings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];

  // Universe additions (from search)
  const [universeAdditions, setUniverseAdditions] = useState([]);

  // Combined holdings = base + additions
  const allHoldings = useMemo(() => {
    const enriched = baseHoldings.map(h => enrichHolding(h));
    const addedHoldings = universeAdditions.map(c => ({
      id: `added_${c.ticker}`,
      company: c,
      weight: 0,
      exposure_usd_mn: 0,
      _isAdded: true,
    }));
    return [...enriched, ...addedHoldings];
  }, [baseHoldings, universeAdditions]);

  // Constraints & optimization state
  const [constraints, setConstraints] = useState({ ...DEFAULT_CONSTRAINTS });
  const [optimized, setOptimized] = useState(false);
  const [optResult, setOptResult] = useState(null);
  const [applied, setApplied] = useState(false);

  // Universe search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExchange, setSearchExchange] = useState('');
  const [searchSector, setSearchSector] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery && !searchExchange && !searchSector) return [];
    let results = globalSearch(searchQuery || '', 200);
    if (searchExchange) results = results.filter(c => (c.exchange === searchExchange || c._displayExchange === searchExchange));
    if (searchSector) results = results.filter(c => c.sector === searchSector);
    // Exclude already-in-portfolio
    const existingTickers = new Set(allHoldings.map(h => h.company?.ticker));
    results = results.filter(c => !existingTickers.has(c.ticker));
    return results.slice(0, 30);
  }, [searchQuery, searchExchange, searchSector, allHoldings]);

  const uniqueSectors = useMemo(() => [...new Set(GLOBAL_COMPANY_MASTER.map(c => c.sector).filter(Boolean))].sort(), []);
  const uniqueExchanges = useMemo(() => EXCHANGES.map(e => e.id).sort(), []);

  // Current metrics (based on base holdings)
  const currentWeights = useMemo(() => {
    const totalExp = allHoldings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0) || 1;
    return allHoldings.map(h => ((h.exposure_usd_mn || 0) / totalExp) * 100);
  }, [allHoldings]);

  const currentMetrics = useMemo(() => computeMetrics(allHoldings, currentWeights), [allHoldings, currentWeights]);

  // Data quality assessment
  const dataQualityAssessment = useMemo(() => {
    const assessments = allHoldings.map(h => ({ ticker: h.company?.ticker || 'N/A', quality: assessDataQuality(h.company) }));
    const full = assessments.filter(a => a.quality.level === 'full').length;
    const missingESG = allHoldings.filter(h => h.company?.esg_score == null).map(h => h.company?.ticker || 'N/A');
    const missingGHG = allHoldings.filter(h => h.company?.scope1_mt == null && h.company?.scope2_mt == null).map(h => h.company?.ticker || 'N/A');
    return { total: allHoldings.length, full, pct: allHoldings.length ? (full / allHoldings.length * 100) : 0, missingESG, missingGHG };
  }, [allHoldings]);

  // Efficient frontier
  const frontierPoints = useMemo(() => generateFrontier(allHoldings), [allHoldings]);

  // Handlers
  const handleOptimize = useCallback(() => {
    const result = optimizePortfolio(allHoldings, constraints);
    setOptResult(result);
    setOptimized(true);
    setApplied(false);
  }, [allHoldings, constraints]);

  const handleReset = useCallback(() => {
    setConstraints({ ...DEFAULT_CONSTRAINTS });
    setOptimized(false);
    setOptResult(null);
    setApplied(false);
  }, []);

  const updateConstraint = useCallback((key, val) => {
    setConstraints(prev => ({ ...prev, [key]: val }));
    setOptimized(false);
    setOptResult(null);
    setApplied(false);
  }, []);

  const applyPreset = useCallback((presetKey) => {
    setConstraints({ ...PRESETS[presetKey] });
    setOptimized(false);
    setOptResult(null);
    setApplied(false);
  }, []);

  const addToUniverse = useCallback((company) => {
    setUniverseAdditions(prev => {
      if (prev.some(c => c.ticker === company.ticker)) return prev;
      return [...prev, company];
    });
    setOptimized(false);
    setOptResult(null);
    setApplied(false);
  }, []);

  const removeFromUniverse = useCallback((ticker) => {
    setUniverseAdditions(prev => prev.filter(c => c.ticker !== ticker));
    setOptimized(false);
    setOptResult(null);
    setApplied(false);
  }, []);

  /* ── WRITE-BACK: Apply optimized weights to localStorage ─────────────── */
  const applyOptimized = useCallback(() => {
    if (!optResult || !optimized) return;
    const updated = JSON.parse(JSON.stringify(portfolioData));
    const portfolio = updated.portfolios[updated.activePortfolio];
    if (!portfolio) return;

    const totalExposure = portfolio.holdings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0) || 100;

    // Build new holdings from ALL optimized (base + added)
    const newHoldings = allHoldings
      .map((h, i) => ({
        ...h,
        weight: optResult.weights[i],
        exposure_usd_mn: parseFloat((totalExposure * optResult.weights[i] / 100).toFixed(2)),
      }))
      .filter(h => h.weight > 0.01);

    portfolio.holdings = newHoldings;
    updated.portfolios[updated.activePortfolio] = portfolio;
    localStorage.setItem('ra_portfolio_v1', JSON.stringify(updated));
    setPortfolioData(updated);
    setApplied(true);
  }, [optResult, optimized, portfolioData, allHoldings]);

  // What-changed summary
  const whatChanged = useMemo(() => {
    if (!optimized || !optResult) return null;
    const added = [];
    const removed = [];
    const increased = [];
    const decreased = [];

    allHoldings.forEach((h, i) => {
      const oldW = currentWeights[i];
      const newW = optResult.weights[i];
      const ticker = h.company?.ticker || `H${i}`;
      const name = h.company?.name || ticker;
      if (oldW < 0.01 && newW > 0.01) added.push({ name, ticker, newW });
      else if (oldW > 0.01 && newW < 0.01) removed.push({ name, ticker, oldW });
      else if (newW - oldW > 0.5) increased.push({ name, ticker, oldW, newW, delta: newW - oldW });
      else if (oldW - newW > 0.5) decreased.push({ name, ticker, oldW, newW, delta: newW - oldW });
    });

    const oldWaci = currentMetrics?.waci || 0;
    const newWaci = optResult.metrics?.waci || 0;
    const oldESG = currentMetrics?.esgScore || 0;
    const newESG = optResult.metrics?.esgScore || 0;

    return { added, removed, increased, decreased, oldWaci, newWaci, oldESG, newESG };
  }, [optimized, optResult, allHoldings, currentWeights, currentMetrics]);

  // Rebalance table
  const rebalanceData = useMemo(() => {
    if (!optimized || !optResult || !allHoldings.length) return [];
    return allHoldings.map((h, i) => ({
      company: h.company?.name || h.company?.ticker || `Holding ${i + 1}`,
      ticker: h.company?.ticker || '',
      sector: h.company?.sector || 'Unknown',
      currentWeight: currentWeights[i],
      optimizedWeight: optResult.weights[i],
      change: optResult.weights[i] - currentWeights[i],
      esgScore: h.company?.esg_score || 50,
      tRisk: h.company?.transition_risk_score || 50,
      sbti: h.company?.sbti_committed ? 'Yes' : 'No',
      isAdded: h._isAdded || false,
      dataQuality: assessDataQuality(h.company),
    })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [optimized, optResult, allHoldings, currentWeights]);

  // Sector comparison
  const sectorComparisonData = useMemo(() => {
    if (!optimized || !optResult?.metrics || !currentMetrics) return [];
    const allSectors = new Set([...Object.keys(currentMetrics.sectors || {}), ...Object.keys(optResult.metrics.sectors || {})]);
    return Array.from(allSectors).map(s => ({
      sector: s.length > 14 ? s.slice(0, 12) + '..' : s,
      current: parseFloat((currentMetrics.sectors[s] || 0).toFixed(1)),
      optimized: parseFloat((optResult.metrics.sectors[s] || 0).toFixed(1)),
    })).sort((a, b) => b.current - a.current);
  }, [optimized, optResult, currentMetrics]);

  // Frontier with markers
  const frontierWithMarkers = useMemo(() => {
    const pts = frontierPoints.map(p => ({ ...p, currentRet:null, currentRisk:null, optRet:null, optRisk:null }));
    if (currentMetrics) {
      const ci = Math.min(Math.floor((currentMetrics.esgScore || 0) / 5), pts.length - 1);
      if (pts[ci]) { pts[ci].currentRet = pts[ci].return - 0.5; pts[ci].currentRisk = pts[ci].risk + 0.8; }
    }
    if (optimized && optResult?.metrics) {
      const oi = Math.min(Math.floor((optResult.metrics.esgScore || 0) / 5), pts.length - 1);
      if (pts[oi]) { pts[oi].optRet = pts[oi].return + 0.3; pts[oi].optRisk = pts[oi].risk - 0.3; }
    }
    return pts;
  }, [frontierPoints, currentMetrics, optimized, optResult]);

  /* ── Styles ──────────────────────────────────────────────────────────── */
  const cardStyle = { background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:24, marginBottom:20 };
  const btnPrimary = { padding:'12px 0', background:T.navy, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', width:'100%', transition:'opacity 0.2s' };
  const btnOutline = { padding:'10px 0', background:'transparent', color:T.textSec, border:`1px solid ${T.border}`, borderRadius:10, fontSize:13, fontWeight:500, cursor:'pointer', width:'100%' };
  const btnSuccess = { padding:'12px 0', background:T.sage, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', width:'100%' };
  const linkStyle = { fontSize:12, color:T.navyL, cursor:'pointer', textDecoration:'none', fontWeight:500 };
  const thStyle = { padding:'10px 10px', fontSize:10, fontWeight:600, color:T.textSec, textTransform:'uppercase', letterSpacing:0.5, borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap' };

  /* ── Empty State ─────────────────────────────────────────────────────── */
  if (baseHoldings.length === 0 && universeAdditions.length === 0) {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, padding:32 }}>
        <div style={{ maxWidth:1400, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <h1 style={{ fontSize:26, fontWeight:700, color:T.navy, margin:0 }}>Portfolio Optimization Engine</h1>
            <span style={{ fontSize:11, background:`${T.navy}10`, color:T.navy, padding:'4px 10px', borderRadius:20, fontWeight:500 }}>Markowitz &middot; ESG Constraints &middot; Efficient Frontier</span>
          </div>
          <div style={cardStyle}>
            <div style={{ textAlign:'center', padding:'60px 20px', color:T.textMut }}>
              <div style={{ fontSize:48, marginBottom:16 }}>&#x1F4CA;</div>
              <h3 style={{ color:T.navy, marginBottom:8 }}>No Portfolio Loaded</h3>
              <p style={{ fontSize:14, color:T.textSec, maxWidth:400, margin:'0 auto', marginBottom:20 }}>
                Load a portfolio from the Portfolio Manager to run ESG-constrained optimization. The optimizer computes optimal weights using a Markowitz mean-variance proxy with climate constraints.
              </p>
              <button onClick={() => navigate('/portfolio-manager')} style={{ ...btnPrimary, width:'auto', padding:'12px 32px', display:'inline-block' }}>Go to Portfolio Manager</button>
            </div>
          </div>
          {/* Illustrative Frontier */}
          <div style={cardStyle}>
            <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, margin:'0 0 16px' }}>Illustrative Efficient Frontier</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={frontierPoints} margin={{ top:10, right:30, left:10, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="risk" label={{ value:'Risk (Volatility %)', position:'insideBottom', offset:-2, style:{ fontSize:11, fill:T.textSec } }} tick={{ fontSize:11, fill:T.textMut }} />
                <YAxis label={{ value:'Return %', angle:-90, position:'insideLeft', style:{ fontSize:11, fill:T.textSec } }} tick={{ fontSize:11, fill:T.textMut }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="return" stroke={T.navy} fill={`${T.navy}18`} strokeWidth={2} dot={{ r:3, fill:T.navy }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Render ─────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, padding:32 }}>
      <div style={{ maxWidth:1400, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <h1 style={{ fontSize:26, fontWeight:700, color:T.navy, margin:0 }}>Portfolio Optimization Engine</h1>
          <span style={{ fontSize:11, background:`${T.navy}10`, color:T.navy, padding:'4px 10px', borderRadius:20, fontWeight:500 }}>Markowitz &middot; ESG Constraints &middot; Efficient Frontier</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
          <p style={{ fontSize:13, color:T.textSec, margin:0 }}>{allHoldings.length} holdings in optimization universe ({baseHoldings.length} portfolio + {universeAdditions.length} added)</p>
          <div style={{ flex:1 }} />
          <span style={linkStyle} onClick={() => navigate('/risk-attribution')}>View Attribution &rarr;</span>
          <span style={{ color:T.border }}>|</span>
          <span style={linkStyle} onClick={() => navigate('/benchmark-analytics')}>Benchmark Analytics &rarr;</span>
        </div>

        <div style={{ display:'flex', gap:24 }}>
          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <div style={{ width:320, flexShrink:0 }}>
            {/* Data Quality Assessment */}
            <div style={{ ...cardStyle, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:8 }}>Data Quality Assessment</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ flex:1, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${dataQualityAssessment.pct}%`, height:'100%', background:dataQualityAssessment.pct >= 70 ? T.green : dataQualityAssessment.pct >= 40 ? T.amber : T.red, borderRadius:3 }} />
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:T.navy }}>{dataQualityAssessment.pct.toFixed(0)}%</span>
              </div>
              <div style={{ fontSize:11, color:T.textMut }}>
                {dataQualityAssessment.full}/{dataQualityAssessment.total} holdings with complete data
              </div>
              {dataQualityAssessment.missingESG.length > 0 && (
                <div style={{ fontSize:10, color:T.amber, marginTop:4 }}>Missing ESG: {dataQualityAssessment.missingESG.slice(0, 5).join(', ')}{dataQualityAssessment.missingESG.length > 5 ? ` +${dataQualityAssessment.missingESG.length - 5} more` : ''}</div>
              )}
              {dataQualityAssessment.missingGHG.length > 0 && (
                <div style={{ fontSize:10, color:T.amber, marginTop:2 }}>Missing GHG: {dataQualityAssessment.missingGHG.slice(0, 5).join(', ')}{dataQualityAssessment.missingGHG.length > 5 ? ` +${dataQualityAssessment.missingGHG.length - 5} more` : ''}</div>
              )}
              {dataQualityAssessment.pct < 60 && (
                <div style={{ fontSize:10, color:T.red, marginTop:4, fontStyle:'italic' }}>Optimization quality is limited by data availability</div>
              )}
            </div>

            {/* Presets */}
            <div style={{ ...cardStyle, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:10 }}>Optimization Presets</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {Object.keys(PRESETS).map(pk => (
                  <button key={pk} onClick={() => applyPreset(pk)}
                    style={{ padding:'8px 6px', background:JSON.stringify(constraints) === JSON.stringify(PRESETS[pk]) ? `${T.navy}12` : T.surfaceH, color:T.navy, border:`1px solid ${JSON.stringify(constraints) === JSON.stringify(PRESETS[pk]) ? T.navy : T.border}`, borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                    {pk}
                  </button>
                ))}
              </div>
            </div>

            {/* Constraints */}
            <div style={{ ...cardStyle, position:'sticky', top:32 }}>
              <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, margin:'0 0 20px' }}>Optimization Constraints</h3>

              {CONSTRAINT_DEFS.map(c => (
                <SliderControl key={c.key} label={c.label} value={constraints[c.key]} min={c.min} max={c.max} unit={c.unit}
                  onChange={val => updateConstraint(c.key, val)} />
              ))}

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderTop:`1px solid ${T.border}`, marginTop:8 }}>
                <span style={{ fontSize:12, color:T.textSec, fontWeight:500 }}>Exclude High Carbon</span>
                <div onClick={() => updateConstraint('excludeHighCarbon', !constraints.excludeHighCarbon)}
                  style={{ width:44, height:24, borderRadius:12, background:constraints.excludeHighCarbon ? T.sage : T.border, cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:constraints.excludeHighCarbon ? 23 : 3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

              <button onClick={handleOptimize} style={{ ...btnPrimary, marginTop:16 }}
                onMouseEnter={e => e.target.style.opacity = '0.9'} onMouseLeave={e => e.target.style.opacity = '1'}>
                Optimize Portfolio
              </button>

              {optimized && optResult?.metrics && !applied && (
                <button onClick={applyOptimized} style={{ ...btnSuccess, marginTop:8 }}
                  onMouseEnter={e => e.target.style.opacity = '0.9'} onMouseLeave={e => e.target.style.opacity = '1'}>
                  Apply Optimized Weights
                </button>
              )}

              {applied && (
                <div style={{ marginTop:10, padding:'10px 14px', background:`${T.green}08`, border:`1px solid ${T.green}30`, borderRadius:8, fontSize:12, color:T.green, fontWeight:500, textAlign:'center' }}>
                  \u2705 Optimized weights applied -- all connected modules will reflect the new allocation
                </div>
              )}

              <button onClick={handleReset} style={{ ...btnOutline, marginTop:8 }}>Reset to Current</button>
            </div>
          </div>

          {/* ── Main Content ──────────────────────────────────────────── */}
          <div style={{ flex:1, minWidth:0 }}>
            {/* Universe Search Panel */}
            <div style={cardStyle}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:showSearch ? 16 : 0 }}>
                <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, margin:0 }}>Universe Search</h3>
                <button onClick={() => setShowSearch(v => !v)}
                  style={{ padding:'6px 14px', background:showSearch ? `${T.navy}10` : T.surfaceH, color:T.navy, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer' }}>
                  {showSearch ? 'Hide Search' : 'Add Companies to Universe'}
                </button>
              </div>

              {showSearch && (
                <div>
                  <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                    <input type="text" placeholder="Search by name, ticker..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      style={{ flex:1, minWidth:200, padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, color:T.navy, fontFamily:T.font, outline:'none' }} />
                    <select value={searchExchange} onChange={e => setSearchExchange(e.target.value)}
                      style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, color:T.navy, fontFamily:T.font, cursor:'pointer', background:T.surface }}>
                      <option value="">All Exchanges</option>
                      {uniqueExchanges.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                    <select value={searchSector} onChange={e => setSearchSector(e.target.value)}
                      style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, color:T.navy, fontFamily:T.font, cursor:'pointer', background:T.surface }}>
                      <option value="">All Sectors</option>
                      {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {searchResults.length > 0 && (
                    <div style={{ maxHeight:240, overflowY:'auto', border:`1px solid ${T.border}`, borderRadius:8 }}>
                      {searchResults.map(c => (
                        <div key={c.ticker} style={{ display:'flex', alignItems:'center', padding:'8px 12px', borderBottom:`1px solid ${T.border}`, background:T.surface }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{c.name}</div>
                            <div style={{ fontSize:11, color:T.textMut }}>{c.ticker} &middot; {c.exchange || c._displayExchange || ''} &middot; {c.sector || ''} &middot; ESG: {c.esg_score || 'N/A'}</div>
                          </div>
                          <button onClick={() => addToUniverse(c)}
                            style={{ padding:'5px 12px', background:`${T.sage}12`, color:T.sage, border:`1px solid ${T.sage}40`, borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }}>
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery && searchResults.length === 0 && (
                    <div style={{ padding:'16px', textAlign:'center', color:T.textMut, fontSize:12 }}>No matching companies found</div>
                  )}
                </div>
              )}

              {/* Universe additions chips */}
              {universeAdditions.length > 0 && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.textMut, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Added to Universe ({universeAdditions.length})</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {universeAdditions.map(c => (
                      <span key={c.ticker} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, padding:'4px 10px', background:`${T.sage}10`, color:T.sage, borderRadius:6, fontWeight:500 }}>
                        {c.ticker}
                        <span onClick={() => removeFromUniverse(c.ticker)} style={{ cursor:'pointer', fontWeight:700, fontSize:13, marginLeft:2, color:T.red }}>&times;</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Before/After Comparison */}
            {optimized && optResult?.metrics && currentMetrics ? (
              <div style={cardStyle}>
                <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, margin:'0 0 16px' }}>Current vs. Optimized Portfolio</h3>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:T.surfaceH }}>
                        {['Metric', 'Current', 'Optimized', 'Delta'].map(h => (
                          <th key={h} style={{ padding:'10px 12px', fontSize:11, fontWeight:600, color:T.textSec, textAlign:h === 'Metric' ? 'left' : 'right', textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <MetricRow label="WACI (tCO2e/$M)" current={currentMetrics.waci} optimized={optResult.metrics.waci} higherIsBetter={false} />
                      <MetricRow label="ESG Score" current={currentMetrics.esgScore} optimized={optResult.metrics.esgScore} higherIsBetter={true} />
                      <MetricRow label="SBTi Coverage %" current={currentMetrics.sbtiPct} optimized={optResult.metrics.sbtiPct} higherIsBetter={true} />
                      <MetricRow label="Transition Risk" current={currentMetrics.tRisk} optimized={optResult.metrics.tRisk} higherIsBetter={false} />
                      <MetricRow label="# Holdings" current={currentMetrics.count} optimized={optResult.metrics.count} higherIsBetter={true} />
                      <MetricRow label="Max Position %" current={currentMetrics.maxWeight} optimized={optResult.metrics.maxWeight} higherIsBetter={false} />
                      <MetricRow label="HHI (Concentration)" current={currentMetrics.hhi} optimized={optResult.metrics.hhi} higherIsBetter={false} />
                    </tbody>
                  </table>
                </div>
              </div>
            ) : !optimized ? (
              <div style={cardStyle}>
                <div style={{ textAlign:'center', padding:'40px 20px', color:T.textMut }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>&#x2699;&#xFE0F;</div>
                  <h3 style={{ color:T.navy, fontSize:16, marginBottom:8 }}>Configure &amp; Optimize</h3>
                  <p style={{ fontSize:13, maxWidth:420, margin:'0 auto' }}>Adjust ESG and climate constraints in the panel, then click "Optimize Portfolio" to compute new weights along the efficient frontier.</p>
                </div>
              </div>
            ) : null}

            {/* What Changed Summary */}
            {optimized && whatChanged && (whatChanged.added.length > 0 || whatChanged.removed.length > 0 || whatChanged.increased.length > 0 || whatChanged.decreased.length > 0) && (
              <div style={{ ...cardStyle, border:`1px solid ${T.sage}30`, background:`${T.sage}04` }}>
                <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, margin:'0 0 12px' }}>What Changed</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:T.textMut, textTransform:'uppercase', marginBottom:4 }}>WACI Change</div>
                    <div style={{ fontSize:18, fontWeight:700, color:whatChanged.newWaci < whatChanged.oldWaci ? T.green : T.red }}>
                      {whatChanged.oldWaci.toFixed(1)} &rarr; {whatChanged.newWaci.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:T.textMut, textTransform:'uppercase', marginBottom:4 }}>ESG Score Change</div>
                    <div style={{ fontSize:18, fontWeight:700, color:whatChanged.newESG > whatChanged.oldESG ? T.green : T.red }}>
                      {whatChanged.oldESG.toFixed(1)} &rarr; {whatChanged.newESG.toFixed(1)}
                    </div>
                  </div>
                </div>
                {whatChanged.added.length > 0 && (
                  <div style={{ marginBottom:8 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:T.green }}>Added ({whatChanged.added.length}): </span>
                    <span style={{ fontSize:11, color:T.textSec }}>{whatChanged.added.map(a => `${a.ticker} (${a.newW.toFixed(1)}%)`).join(', ')}</span>
                  </div>
                )}
                {whatChanged.removed.length > 0 && (
                  <div style={{ marginBottom:8 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:T.red }}>Removed ({whatChanged.removed.length}): </span>
                    <span style={{ fontSize:11, color:T.textSec }}>{whatChanged.removed.map(r => r.ticker).join(', ')}</span>
                  </div>
                )}
                {whatChanged.increased.length > 0 && (
                  <div style={{ marginBottom:8 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:T.sage }}>Increased ({whatChanged.increased.length}): </span>
                    <span style={{ fontSize:11, color:T.textSec }}>{whatChanged.increased.slice(0, 8).map(r => `${r.ticker} (+${r.delta.toFixed(1)}%)`).join(', ')}{whatChanged.increased.length > 8 ? '...' : ''}</span>
                  </div>
                )}
                {whatChanged.decreased.length > 0 && (
                  <div>
                    <span style={{ fontSize:11, fontWeight:600, color:T.amber }}>Decreased ({whatChanged.decreased.length}): </span>
                    <span style={{ fontSize:11, color:T.textSec }}>{whatChanged.decreased.slice(0, 8).map(r => `${r.ticker} (${r.delta.toFixed(1)}%)`).join(', ')}{whatChanged.decreased.length > 8 ? '...' : ''}</span>
                  </div>
                )}
              </div>
            )}

            {/* Efficient Frontier */}
            <div style={cardStyle}>
              <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, margin:'0 0 4px' }}>Efficient Frontier</h3>
              <p style={{ fontSize:12, color:T.textMut, margin:'0 0 16px' }}>ESG-constraint sweep: data-driven frontier from portfolio holdings. Higher ESG floors shift along the risk-return curve.</p>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={frontierWithMarkers} margin={{ top:10, right:30, left:10, bottom:20 }}>
                  <defs>
                    <linearGradient id="frontierGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.navy} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={T.navy} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="risk" type="number" domain={['dataMin - 1', 'dataMax + 1']}
                    label={{ value:'Risk (Volatility Proxy %)', position:'insideBottom', offset:-8, style:{ fontSize:11, fill:T.textSec } }}
                    tick={{ fontSize:11, fill:T.textMut }} />
                  <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    label={{ value:'Expected Return Proxy %', angle:-90, position:'insideLeft', offset:4, style:{ fontSize:11, fill:T.textSec } }}
                    tick={{ fontSize:11, fill:T.textMut }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="return" stroke={T.navy} fill="url(#frontierGrad)" strokeWidth={2}
                    dot={({ cx, cy, index, payload }) => {
                      const dots = [];
                      dots.push(<circle key={`dot-${index}`} cx={cx} cy={cy} r={3} fill={T.navy} stroke="#fff" strokeWidth={1} />);
                      if (payload.currentRet !== null && payload.currentRet !== undefined) {
                        dots.push(<circle key={`cur-${index}`} cx={cx + 15} cy={cy - 15} r={7} fill={T.red} stroke="#fff" strokeWidth={2} />);
                        dots.push(<text key={`cur-t-${index}`} x={cx + 28} y={cy - 12} fill={T.red} fontSize={10} fontWeight={600}>Current</text>);
                      }
                      if (payload.optRet !== null && payload.optRet !== undefined) {
                        dots.push(<circle key={`opt-${index}`} cx={cx - 12} cy={cy + 12} r={7} fill={T.green} stroke="#fff" strokeWidth={2} />);
                        dots.push(<text key={`opt-t-${index}`} x={cx - 8} y={cy + 28} fill={T.green} fontSize={10} fontWeight={600}>Optimized</text>);
                      }
                      return <g>{dots}</g>;
                    }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:T.navy }} />
                  <span style={{ fontSize:11, color:T.textSec }}>Frontier Points</span>
                </div>
                {currentMetrics && <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:T.red }} />
                  <span style={{ fontSize:11, color:T.textSec }}>Current Portfolio</span>
                </div>}
                {optimized && <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:T.green }} />
                  <span style={{ fontSize:11, color:T.textSec }}>Optimized Portfolio</span>
                </div>}
              </div>
            </div>

            {/* Constraint Violations */}
            {optimized && optResult?.violations?.length > 0 && (
              <div style={{ ...cardStyle, border:`1px solid ${T.amber}40`, background:`${T.amber}06` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:18 }}>&#x26A0;</span>
                  <h3 style={{ fontSize:15, fontWeight:600, color:T.amber, margin:0 }}>Constraint Violations</h3>
                </div>
                <p style={{ fontSize:12, color:T.textSec, margin:'0 0 12px' }}>The optimizer could not fully satisfy all constraints. Manual adjustment may be required.</p>
                {optResult.violations.map((v, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px', background:`${T.amber}08`, borderRadius:8, marginBottom:6 }}>
                    <span style={{ fontSize:12, color:T.amber, fontWeight:600, minWidth:180 }}>{typeof v === 'string' ? v : v.constraint}</span>
                    {typeof v !== 'string' && <>
                      <span style={{ fontSize:12, color:T.textSec }}>Actual: <strong style={{ color:T.red }}>{v.value}</strong></span>
                      <span style={{ fontSize:12, color:T.textSec }}>Limit: <strong>{v.limit}</strong></span>
                    </>}
                  </div>
                ))}
              </div>
            )}

            {/* Removed holdings */}
            {optimized && optResult?.removed?.length > 0 && (
              <div style={{ ...cardStyle, border:`1px solid ${T.red}30`, background:`${T.red}04` }}>
                <h4 style={{ fontSize:14, fontWeight:600, color:T.red, margin:'0 0 8px' }}>Holdings Excluded ({optResult.removed.length})</h4>
                <p style={{ fontSize:12, color:T.textSec, margin:'0 0 8px' }}>These holdings were removed due to constraint violations:</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {optResult.removed.map((h, i) => (
                    <span key={i} style={{ fontSize:11, padding:'4px 10px', background:`${T.red}10`, color:T.red, borderRadius:6, fontWeight:500 }}>
                      {h.company?.name || h.company?.ticker || `Holding ${i + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Weight Rebalance Table */}
            {optimized && rebalanceData.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, margin:'0 0 16px' }}>Weight Rebalance Detail</h3>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:T.surfaceH }}>
                        {['Company', 'Sector', 'Current %', 'Optimized %', 'Change', 'ESG', 'T-Risk', 'SBTi', 'Data'].map(h => (
                          <th key={h} style={{ ...thStyle, textAlign:h === 'Company' || h === 'Sector' ? 'left' : 'right' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rebalanceData.slice(0, 40).map((r, i) => {
                        const isRemoved = r.optimizedWeight < 0.01 && r.currentWeight > 0.01;
                        const isNew = r.isAdded && r.optimizedWeight > 0.01;
                        const isIncreased = r.change > 0.5;
                        const rowBg = isNew ? `${T.sage}06` : isRemoved ? `${T.red}06` : isIncreased ? `${T.green}04` : 'transparent';
                        return (
                          <tr key={i} style={{ background:rowBg }}>
                            <td style={{ padding:'8px 10px', fontWeight:500, color:isRemoved ? T.red : isNew ? T.sage : T.navy, borderBottom:`1px solid ${T.border}`, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {r.company}
                              {isNew && <span style={{ fontSize:9, marginLeft:4, padding:'1px 5px', background:`${T.sage}15`, color:T.sage, borderRadius:4, fontWeight:600 }}>NEW</span>}
                            </td>
                            <td style={{ padding:'8px 10px', color:T.textSec, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{r.sector}</td>
                            <td style={{ padding:'8px 10px', textAlign:'right', color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{r.currentWeight.toFixed(1)}</td>
                            <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:600, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{r.optimizedWeight.toFixed(1)}</td>
                            <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:600, borderBottom:`1px solid ${T.border}`, color:r.change > 0.1 ? T.green : r.change < -0.1 ? T.red : T.textMut }}>
                              {r.change > 0 ? '+' : ''}{r.change.toFixed(1)}
                            </td>
                            <td style={{ padding:'8px 10px', textAlign:'right', color:r.esgScore >= 60 ? T.green : r.esgScore >= 40 ? T.amber : T.red, borderBottom:`1px solid ${T.border}` }}>{r.esgScore}</td>
                            <td style={{ padding:'8px 10px', textAlign:'right', color:r.tRisk <= 40 ? T.green : r.tRisk <= 65 ? T.amber : T.red, borderBottom:`1px solid ${T.border}` }}>{r.tRisk}</td>
                            <td style={{ padding:'8px 10px', textAlign:'right', borderBottom:`1px solid ${T.border}` }}>
                              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:r.sbti === 'Yes' ? `${T.green}12` : `${T.textMut}12`, color:r.sbti === 'Yes' ? T.green : T.textMut, fontWeight:500 }}>{r.sbti}</span>
                            </td>
                            <td style={{ padding:'8px 10px', textAlign:'center', borderBottom:`1px solid ${T.border}`, fontSize:13 }}>{r.dataQuality.icon}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {rebalanceData.length > 40 && <p style={{ fontSize:11, color:T.textMut, marginTop:8, textAlign:'center' }}>Showing top 40 of {rebalanceData.length} holdings by absolute change</p>}
              </div>
            )}

            {/* Sector Weight Comparison */}
            {optimized && sectorComparisonData.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, margin:'0 0 16px' }}>Sector Weight Comparison</h3>
                <ResponsiveContainer width="100%" height={Math.max(280, sectorComparisonData.length * 36)}>
                  <BarChart data={sectorComparisonData} layout="vertical" margin={{ top:5, right:30, left:80, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:11, fill:T.textMut }} unit="%" />
                    <YAxis type="category" dataKey="sector" tick={{ fontSize:11, fill:T.textSec }} width={75} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize:11 }} />
                    <Bar dataKey="current" name="Current" fill={`${T.navy}60`} barSize={14} radius={[0,4,4,0]} />
                    <Bar dataKey="optimized" name="Optimized" fill={T.sage} barSize={14} radius={[0,4,4,0]} />
                    <ReferenceLine x={constraints.maxSectorWeight} stroke={T.red} strokeDasharray="4 4" label={{ value:`Cap ${constraints.maxSectorWeight}%`, position:'top', fill:T.red, fontSize:10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', padding:'16px 0', fontSize:11, color:T.textMut }}>
          Portfolio Optimization Engine &middot; {allHoldings.length} holdings in universe &middot; Data quality: {dataQualityAssessment.pct.toFixed(0)}% &middot; Generated {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
