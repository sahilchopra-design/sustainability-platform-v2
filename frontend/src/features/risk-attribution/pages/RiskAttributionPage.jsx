import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, ReferenceLine } from 'recharts';
import { GLOBAL_COMPANY_MASTER, EXCHANGES, globalSearch } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ── Factor Definitions ─────────────────────────────────────────────────── */
const FACTOR_DEFS = {
  esg:      { name: 'ESG Quality Factor',   description: 'Return premium for high-ESG companies',       defaultWeight: 1, defaultPremium: 2.1 },
  carbon:   { name: 'Carbon Transition',     description: 'Penalty for high-carbon intensity',           defaultWeight: 1, defaultPremium: -3.4 },
  momentum: { name: 'ESG Momentum',          description: 'Return from ESG score improvement trajectory', defaultWeight: 1, defaultPremium: 1.2 },
  size:     { name: 'Size Factor',           description: 'Small-cap vs large-cap return differential',  defaultWeight: 1, defaultPremium: 0.8 },
  value:    { name: 'Value Factor',          description: 'Cheap vs expensive by revenue yield',         defaultWeight: 1, defaultPremium: 1.5 },
  quality:  { name: 'Quality Factor',        description: 'Governance & low-transition-risk premium',    defaultWeight: 1, defaultPremium: 1.0 },
};

const BENCHMARKS = {
  'MSCI ACWI':  { sectorWeights: { Financials:16.2, IT:23.1, Energy:4.8, Materials:4.5, Industrials:10.5, 'Health Care':11.4, 'Consumer Discretionary':10.7, Utilities:2.8, 'Consumer Staples':6.8, 'Real Estate':2.5, 'Communication Services':8.4 }, sectorReturns: { Financials:9.5, IT:14.2, Energy:-2.1, Materials:5.3, Industrials:8.1, 'Health Care':7.8, 'Consumer Discretionary':11.0, Utilities:4.2, 'Consumer Staples':3.9, 'Real Estate':2.8, 'Communication Services':10.5 }, totalReturn:8.2, trackingError:3.2 },
  'S&P 500':    { sectorWeights: { Financials:13.1, IT:29.2, Energy:3.9, Materials:2.6, Industrials:8.8, 'Health Care':12.6, 'Consumer Discretionary':10.3, Utilities:2.5, 'Consumer Staples':6.1, 'Real Estate':2.3, 'Communication Services':8.6 }, sectorReturns: { Financials:10.2, IT:16.8, Energy:-1.5, Materials:4.8, Industrials:9.0, 'Health Care':8.2, 'Consumer Discretionary':12.4, Utilities:4.8, 'Consumer Staples':4.2, 'Real Estate':3.1, 'Communication Services':11.8 }, totalReturn:9.5, trackingError:2.8 },
  'MSCI EM':    { sectorWeights: { Financials:21.3, IT:19.8, Energy:6.2, Materials:8.4, Industrials:6.3, 'Health Care':4.1, 'Consumer Discretionary':13.5, Utilities:3.2, 'Consumer Staples':5.8, 'Real Estate':2.1, 'Communication Services':9.3 }, sectorReturns: { Financials:7.1, IT:11.5, Energy:1.2, Materials:6.8, Industrials:5.9, 'Health Care':6.1, 'Consumer Discretionary':8.4, Utilities:3.5, 'Consumer Staples':2.8, 'Real Estate':1.9, 'Communication Services':7.4 }, totalReturn:5.8, trackingError:4.5 },
  'Nifty 50':   { sectorWeights: { Financials:35.2, IT:14.1, Energy:11.8, Materials:4.3, Industrials:5.9, 'Health Care':4.8, 'Consumer Discretionary':8.2, Utilities:2.0, 'Consumer Staples':8.5, 'Real Estate':0.8, 'Communication Services':4.4 }, sectorReturns: { Financials:12.5, IT:9.8, Energy:3.5, Materials:7.2, Industrials:11.0, 'Health Care':5.2, 'Consumer Discretionary':14.1, Utilities:6.1, 'Consumer Staples':3.0, 'Real Estate':2.2, 'Communication Services':8.8 }, totalReturn:11.2, trackingError:5.1 },
};

const TIME_PERIODS = {
  '1M':  { label: '1 Month',  multiplier: 1/12 },
  '3M':  { label: '3 Months', multiplier: 3/12 },
  '6M':  { label: '6 Months', multiplier: 6/12 },
  'YTD': { label: 'Year to Date', multiplier: 0.25 },
  '1Y':  { label: '1 Year',   multiplier: 1 },
};

/* ── Helpers ────────────────────────────────────────────────────────────── */
let _masterLookup = null;
function getMasterLookup() {
  if (!_masterLookup) { _masterLookup = {}; GLOBAL_COMPANY_MASTER.forEach(c => { _masterLookup[c.ticker] = c; }); }
  return _masterLookup;
}

function enrichFromMaster(holding) {
  const ticker = holding.company?.ticker;
  const master = ticker ? getMasterLookup()[ticker] : null;
  if (!master) return holding;
  return {
    ...holding,
    company: { ...holding.company, ...master, ...holding.company },
    _masterMatch: true,
  };
}

function assessDataQuality(company) {
  if (!company) return { level: 'low', label: 'Low', icon: '\u274C' };
  const critical = [company.scope1_mt, company.scope2_mt, company.esg_score, company.market_cap_usd_mn, company.revenue_usd_mn, company.transition_risk_score];
  const present = critical.filter(v => v != null && v !== undefined).length;
  if (present >= 5) return { level: 'full', label: 'Full', icon: '\u2705' };
  if (present >= 3) return { level: 'partial', label: 'Partial', icon: '\u26A0\uFE0F' };
  return { level: 'low', label: 'Low', icon: '\u274C' };
}

function computeHoldingExposures(holding, medianGHGIntensity) {
  const c = holding.company || {};
  const esgScore = c.esg_score || 50;
  const scope1 = c.scope1_mt || 0;
  const scope2 = c.scope2_mt || 0;
  const revenue = c.revenue_usd_mn || 1;
  const marketCap = c.market_cap_usd_mn || 1000;
  const transitionRisk = c.transition_risk_score || 50;
  const ghgIntensity = (scope1 + scope2) / revenue;

  // ESG Quality: direct from esg_score
  const esgExposure = (esgScore - 50) / 50;

  // Carbon Transition: relative to portfolio median
  const carbonExposure = medianGHGIntensity > 0
    ? Math.max(-1, Math.min(1, -(ghgIntensity - medianGHGIntensity) / medianGHGIntensity))
    : 0;

  // ESG Momentum: tiered by score + SBTi bonus
  let momentumExposure = esgScore > 65 ? 0.2 : esgScore > 50 ? 0 : -0.2;
  if (c.sbti_committed) momentumExposure += 0.15;
  momentumExposure = Math.max(-1, Math.min(1, momentumExposure));

  // Size: log(market_cap) normalized — large caps negative, small caps positive
  const logCap = Math.log10(Math.max(marketCap, 1));
  const sizeExposure = Math.max(-1, Math.min(1, -(logCap - 4) / 2)); // 10k=negative to 100B=very negative; small = positive

  // Value: revenue yield as value proxy
  const revenueYield = revenue / marketCap;
  const valueExposure = Math.max(-1, Math.min(1, (revenueYield - 0.3) / 0.5));

  // Quality: composite of governance
  const qualityExposure = Math.max(-1, Math.min(1, (esgScore / 100) * 0.5 + (1 - transitionRisk / 100) * 0.5 - 0.5));

  const dq = assessDataQuality(c);

  return {
    ...holding,
    _dataQuality: dq,
    exposures: {
      esg:      parseFloat(esgExposure.toFixed(3)),
      carbon:   parseFloat(carbonExposure.toFixed(3)),
      momentum: parseFloat(momentumExposure.toFixed(3)),
      size:     parseFloat(sizeExposure.toFixed(3)),
      value:    parseFloat(valueExposure.toFixed(3)),
      quality:  parseFloat(qualityExposure.toFixed(3)),
    },
  };
}

function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
    const v = r[h];
    return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── Component ──────────────────────────────────────────────────────────── */
function RiskAttributionPage() {
  const navigate = useNavigate();

  const [portfolioData, setPortfolioData] = useState(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      return saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const holdings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];

  // Interactive controls
  const [factorWeights, setFactorWeights] = useState(() =>
    Object.fromEntries(Object.keys(FACTOR_DEFS).map(k => [k, 1]))
  );
  const [enabledFactors, setEnabledFactors] = useState(() =>
    Object.fromEntries(Object.keys(FACTOR_DEFS).map(k => [k, true]))
  );
  const [timePeriod, setTimePeriod] = useState('1Y');
  const [benchmarkKey, setBenchmarkKey] = useState('MSCI ACWI');

  // Table sorts
  const [heatmapSort, setHeatmapSort] = useState('weight');
  const [heatmapDir, setHeatmapDir] = useState('desc');
  const [factorSort, setFactorSort] = useState('contribution');
  const [factorDir, setFactorDir] = useState('desc');

  const benchmark = BENCHMARKS[benchmarkKey];
  const periodMult = TIME_PERIODS[timePeriod].multiplier;

  // Enrich holdings from GLOBAL_COMPANY_MASTER
  const enrichedRaw = useMemo(() => holdings.map(h => enrichFromMaster(h)), [holdings]);

  // Compute median GHG intensity for carbon factor
  const medianGHGIntensity = useMemo(() => {
    const intensities = enrichedRaw.map(h => {
      const c = h.company || {};
      const rev = c.revenue_usd_mn || 1;
      return ((c.scope1_mt || 0) + (c.scope2_mt || 0)) / rev;
    }).sort((a, b) => a - b);
    if (!intensities.length) return 0;
    const mid = Math.floor(intensities.length / 2);
    return intensities.length % 2 !== 0 ? intensities[mid] : (intensities[mid - 1] + intensities[mid]) / 2;
  }, [enrichedRaw]);

  // Compute all exposures
  const enrichedHoldings = useMemo(() =>
    enrichedRaw.map(h => computeHoldingExposures(h, medianGHGIntensity)),
    [enrichedRaw, medianGHGIntensity]
  );

  // Model confidence
  const modelConfidence = useMemo(() => {
    if (!enrichedHoldings.length) return 0;
    const fullCount = enrichedHoldings.filter(h => h._dataQuality.level === 'full').length;
    return (fullCount / enrichedHoldings.length) * 100;
  }, [enrichedHoldings]);

  // Active factors and effective weights (normalized)
  const activeFactors = useMemo(() =>
    Object.keys(FACTOR_DEFS).filter(k => enabledFactors[k]),
    [enabledFactors]
  );

  const effectiveWeights = useMemo(() => {
    const raw = {};
    activeFactors.forEach(k => { raw[k] = factorWeights[k]; });
    const sum = Object.values(raw).reduce((s, v) => s + v, 0) || 1;
    const normalized = {};
    activeFactors.forEach(k => { normalized[k] = raw[k] / sum; });
    return normalized;
  }, [activeFactors, factorWeights]);

  // Factor analysis
  const factorAnalysis = useMemo(() => {
    if (enrichedHoldings.length === 0) return null;
    const totalWeight = enrichedHoldings.reduce((s, h) => s + (h.weight || 0), 0) || 1;

    // Weighted average exposures
    const avgExposures = {};
    Object.keys(FACTOR_DEFS).forEach(fk => {
      avgExposures[fk] = enrichedHoldings.reduce((s, h) => s + (h.weight || 0) * h.exposures[fk], 0) / totalWeight;
    });

    // Contributions: exposure * premium * factorWeight * periodMultiplier
    const contributions = {};
    let totalFactorReturn = 0;
    activeFactors.forEach(fk => {
      const premium = FACTOR_DEFS[fk].defaultPremium;
      const contrib = avgExposures[fk] * premium * effectiveWeights[fk] * periodMult;
      contributions[fk] = parseFloat(contrib.toFixed(4));
      totalFactorReturn += contrib;
    });
    // Disabled factors get 0
    Object.keys(FACTOR_DEFS).forEach(fk => {
      if (!activeFactors.includes(fk)) contributions[fk] = 0;
    });

    const residual = parseFloat((0.3 * periodMult).toFixed(4));
    const totalReturn = parseFloat((totalFactorReturn + residual + benchmark.totalReturn * periodMult).toFixed(3));
    const activeReturn = parseFloat((totalFactorReturn + residual).toFixed(3));
    const infoRatio = parseFloat((activeReturn / (benchmark.trackingError * Math.sqrt(periodMult))).toFixed(3));

    // Risk decomposition based on factor count
    const factorExplained = activeFactors.length > 0 ? 55 + activeFactors.length * 3 : 0;
    const systematicRisk = Math.min(95, factorExplained);
    const specificRisk = 100 - systematicRisk;

    return {
      avgExposures, contributions, residual,
      totalReturn, totalFactorReturn: parseFloat(totalFactorReturn.toFixed(3)),
      activeReturn, infoRatio,
      systematicRisk: parseFloat(systematicRisk.toFixed(1)),
      specificRisk: parseFloat(specificRisk.toFixed(1)),
    };
  }, [enrichedHoldings, activeFactors, effectiveWeights, periodMult, benchmark]);

  // Waterfall data
  const waterfallData = useMemo(() => {
    if (!factorAnalysis) return [];
    const items = activeFactors.map(fk => ({
      name: FACTOR_DEFS[fk].name.replace(' Factor', ''),
      value: parseFloat(factorAnalysis.contributions[fk].toFixed(3)),
    }));
    items.push({ name: 'Residual', value: factorAnalysis.residual });
    items.push({ name: 'Total Active', value: parseFloat(factorAnalysis.activeReturn.toFixed(3)), isTotal: true });
    return items;
  }, [factorAnalysis, activeFactors]);

  // Sector attribution
  const sectorAttributionData = useMemo(() => {
    if (enrichedHoldings.length === 0) return [];
    const totalWeight = enrichedHoldings.reduce((s, h) => s + (h.weight || 0), 0) || 1;
    const sectorWeights = {};
    enrichedHoldings.forEach(h => {
      const sec = h.company?.sector || 'Other';
      sectorWeights[sec] = (sectorWeights[sec] || 0) + (h.weight || 0);
    });
    return Object.keys(benchmark.sectorWeights).map(sec => {
      const portW = ((sectorWeights[sec] || 0) / totalWeight) * 100;
      const benchW = benchmark.sectorWeights[sec];
      const benchR = (benchmark.sectorReturns[sec] || 5) * periodMult;
      const allocation = parseFloat(((portW - benchW) * benchR / 100).toFixed(3));
      return { sector: sec, portfolioWeight: parseFloat(portW.toFixed(1)), benchmarkWeight: benchW, allocationEffect: allocation };
    });
  }, [enrichedHoldings, benchmark, periodMult]);

  // Risk decomposition donut
  const riskDecompData = useMemo(() => {
    if (!factorAnalysis) return [];
    return [
      { name: 'Systematic (Factor)', value: factorAnalysis.systematicRisk, fill: T.navy },
      { name: 'Specific (Residual)', value: factorAnalysis.specificRisk, fill: T.gold },
    ];
  }, [factorAnalysis]);

  // Sorted heatmap
  const sortedHeatmap = useMemo(() => {
    const arr = [...enrichedHoldings];
    arr.sort((a, b) => {
      let va, vb;
      if (heatmapSort === 'weight') { va = a.weight || 0; vb = b.weight || 0; }
      else if (heatmapSort === 'company') { va = a.company?.name || ''; vb = b.company?.name || ''; return heatmapDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      else if (heatmapSort === 'dataQuality') { const order = { full: 3, partial: 2, low: 1 }; va = order[a._dataQuality.level] || 0; vb = order[b._dataQuality.level] || 0; }
      else if (heatmapSort === 'totalContrib') {
        va = activeFactors.reduce((s, fk) => s + a.exposures[fk] * FACTOR_DEFS[fk].defaultPremium * (effectiveWeights[fk] || 0), 0);
        vb = activeFactors.reduce((s, fk) => s + b.exposures[fk] * FACTOR_DEFS[fk].defaultPremium * (effectiveWeights[fk] || 0), 0);
      } else {
        va = a.exposures[heatmapSort] || 0; vb = b.exposures[heatmapSort] || 0;
      }
      return heatmapDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [enrichedHoldings, heatmapSort, heatmapDir, activeFactors, effectiveWeights]);

  // Factor performance table
  const factorTableData = useMemo(() => {
    if (!factorAnalysis) return [];
    return Object.keys(FACTOR_DEFS).map(fk => ({
      key: fk,
      name: FACTOR_DEFS[fk].name,
      enabled: enabledFactors[fk],
      weight: factorWeights[fk],
      premium: FACTOR_DEFS[fk].defaultPremium * periodMult,
      exposure: parseFloat((factorAnalysis.avgExposures[fk] || 0).toFixed(3)),
      contribution: parseFloat((factorAnalysis.contributions[fk] || 0).toFixed(4)),
      attributionBps: parseFloat(((factorAnalysis.contributions[fk] || 0) * 100).toFixed(1)),
    }));
  }, [factorAnalysis, enabledFactors, factorWeights, periodMult]);

  const sortedFactorTable = useMemo(() => {
    const arr = [...factorTableData];
    arr.sort((a, b) => {
      const va = a[factorSort]; const vb = b[factorSort];
      if (typeof va === 'string') return factorDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return factorDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
    });
    return arr;
  }, [factorTableData, factorSort, factorDir]);

  // Handlers
  const toggleHeatmapSort = (col) => {
    if (heatmapSort === col) setHeatmapDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setHeatmapSort(col); setHeatmapDir('desc'); }
  };
  const toggleFactorSort = (col) => {
    if (factorSort === col) setFactorDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setFactorSort(col); setFactorDir('desc'); }
  };

  const handleExportCSV = useCallback(() => {
    if (!enrichedHoldings.length || !factorAnalysis) return;
    const rows = enrichedHoldings.map(h => {
      const totalContrib = activeFactors.reduce((s, fk) => s + h.exposures[fk] * FACTOR_DEFS[fk].defaultPremium * (effectiveWeights[fk] || 0) * (h.weight || 0) / 100, 0);
      return {
        Ticker: h.company?.ticker || '',
        Company: h.company?.name || '',
        Sector: h.company?.sector || '',
        'Weight %': (h.weight || 0).toFixed(2),
        'ESG Exposure': h.exposures.esg,
        'Carbon Exposure': h.exposures.carbon,
        'Momentum Exposure': h.exposures.momentum,
        'Size Exposure': h.exposures.size,
        'Value Exposure': h.exposures.value,
        'Quality Exposure': h.exposures.quality,
        'Total Contribution %': totalContrib.toFixed(4),
        'Data Quality': h._dataQuality.label,
        'ESG Score': h.company?.esg_score || '',
        'Scope 1 MT': h.company?.scope1_mt || '',
        'Scope 2 MT': h.company?.scope2_mt || '',
        'Transition Risk': h.company?.transition_risk_score || '',
      };
    });
    downloadCSV(`risk_attribution_${benchmarkKey.replace(/\s/g, '_')}_${timePeriod}_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }, [enrichedHoldings, factorAnalysis, activeFactors, effectiveWeights, benchmarkKey, timePeriod]);

  /* ── Styling helpers ──────────────────────────────────────────────────── */
  const exposureColor = (v) => {
    if (v > 0.5) return '#166534';
    if (v > 0) return '#86efac';
    if (v > -0.5) return '#fca5a5';
    return '#991b1b';
  };
  const exposureTextColor = (v) => (v > 0.5 || v < -0.5) ? '#fff' : T.text;
  const arrow = (col, currentSort, currentDir) => col === currentSort ? (currentDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  const kpiStyle = { flex:'1 1 0', minWidth:140, background:T.surface, borderRadius:10, padding:'18px 20px', border:`1px solid ${T.border}`, textAlign:'center' };
  const kpiLabel = { fontSize:11, fontWeight:600, color:T.textMut, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 };
  const kpiValue = { fontSize:24, fontWeight:700, color:T.navy };
  const sectionStyle = { background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:'24px 28px', marginBottom:24 };
  const sectionTitle = { fontSize:16, fontWeight:700, color:T.navy, marginBottom:16 };
  const thStyle = { padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textMut, textTransform:'uppercase', letterSpacing:0.6, borderBottom:`2px solid ${T.border}`, cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' };
  const tdStyle = { padding:'9px 12px', fontSize:13, color:T.text, borderBottom:`1px solid ${T.border}` };
  const btnPrimary = { padding:'8px 20px', background:T.navy, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' };
  const btnOutline = { padding:'8px 20px', background:'transparent', color:T.navy, border:`1px solid ${T.border}`, borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' };
  const linkStyle = { fontSize:12, color:T.navyL, cursor:'pointer', textDecoration:'none', fontWeight:500 };

  /* ── Empty State ──────────────────────────────────────────────────────── */
  if (holdings.length === 0) {
    return (
      <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ background:T.surface, borderRadius:16, padding:'60px 48px', textAlign:'center', maxWidth:520, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:48, marginBottom:16 }}>&#x1F4CA;</div>
          <h2 style={{ fontSize:22, fontWeight:700, color:T.navy, marginBottom:10 }}>No Portfolio Data Available</h2>
          <p style={{ fontSize:14, color:T.textSec, lineHeight:1.6, marginBottom:20 }}>
            Create a portfolio in the Portfolio Manager to enable multi-factor risk attribution analysis. The engine decomposes returns across 6 ESG and style factors.
          </p>
          <button onClick={() => navigate('/portfolio-manager')} style={btnPrimary}>Go to Portfolio Manager</button>
        </div>
      </div>
    );
  }

  /* ── Main Render ──────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:6 }}>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.navy, margin:0 }}>Multi-Factor Risk Attribution Engine</h1>
          <span style={{ background:`${T.navy}12`, color:T.navy, fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:20, letterSpacing:0.3 }}>Barra-Style &middot; {activeFactors.length} Active Factors &middot; {benchmarkKey}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:4 }}>
          <p style={{ fontSize:13, color:T.textSec, margin:0 }}>Decomposing portfolio performance across ESG quality, carbon transition, momentum, size, value, and governance factors</p>
          <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
            <span style={linkStyle} onClick={() => navigate('/portfolio-optimizer')}>Optimize Portfolio &rarr;</span>
            <span style={{ color:T.border }}>|</span>
            <span style={linkStyle} onClick={() => navigate('/benchmark-analytics')}>Benchmark Analytics &rarr;</span>
          </div>
        </div>
      </div>

      {/* ── Interactive Controls Panel ─────────────────────────────────── */}
      <div style={{ ...sectionStyle, marginBottom:24, padding:'20px 28px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16, flexWrap:'wrap' }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>Model Controls</div>

          {/* Time Period */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <label style={{ fontSize:11, color:T.textMut, fontWeight:600 }}>PERIOD:</label>
            <select value={timePeriod} onChange={e => setTimePeriod(e.target.value)}
              style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, color:T.navy, background:T.surface, cursor:'pointer', fontFamily:T.font }}>
              {Object.entries(TIME_PERIODS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Benchmark */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <label style={{ fontSize:11, color:T.textMut, fontWeight:600 }}>BENCHMARK:</label>
            <select value={benchmarkKey} onChange={e => setBenchmarkKey(e.target.value)}
              style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, color:T.navy, background:T.surface, cursor:'pointer', fontFamily:T.font }}>
              {Object.keys(BENCHMARKS).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div style={{ flex:1 }} />
          <button onClick={handleExportCSV} style={btnOutline}>Export Attribution Report (CSV)</button>
        </div>

        {/* Factor Toggles + Weight Sliders */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
          {Object.entries(FACTOR_DEFS).map(([fk, def]) => (
            <div key={fk} style={{ padding:'12px 14px', background:enabledFactors[fk] ? T.surfaceH : `${T.border}30`, borderRadius:8, border:`1px solid ${enabledFactors[fk] ? T.border : T.borderL}`, opacity:enabledFactors[fk] ? 1 : 0.6, transition:'all 0.2s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <input type="checkbox" checked={enabledFactors[fk]} onChange={() => setEnabledFactors(prev => ({ ...prev, [fk]: !prev[fk] }))}
                  style={{ accentColor:T.navy, cursor:'pointer' }} />
                <span style={{ fontSize:12, fontWeight:600, color:T.navy }}>{def.name.replace(' Factor', '')}</span>
              </div>
              {enabledFactors[fk] && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:10, color:T.textMut }}>Weight</span>
                    <span style={{ fontSize:10, color:T.navy, fontWeight:600 }}>{factorWeights[fk].toFixed(1)}x</span>
                  </div>
                  <input type="range" min={0} max={3} step={0.1} value={factorWeights[fk]}
                    onChange={e => setFactorWeights(prev => ({ ...prev, [fk]: parseFloat(e.target.value) }))}
                    style={{ width:'100%', accentColor:T.navy, cursor:'pointer', height:4 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
        <div style={kpiStyle}>
          <div style={kpiLabel}>Total Return ({TIME_PERIODS[timePeriod].label})</div>
          <div style={{ ...kpiValue, color:factorAnalysis.totalReturn >= 0 ? T.green : T.red }}>{factorAnalysis.totalReturn >= 0 ? '+' : ''}{factorAnalysis.totalReturn.toFixed(2)}%</div>
        </div>
        <div style={kpiStyle}>
          <div style={kpiLabel}>ESG Alpha</div>
          <div style={{ ...kpiValue, color:(factorAnalysis.contributions.esg || 0) >= 0 ? T.green : T.red }}>{(factorAnalysis.contributions.esg || 0) >= 0 ? '+' : ''}{(factorAnalysis.contributions.esg || 0).toFixed(3)}%</div>
        </div>
        <div style={kpiStyle}>
          <div style={kpiLabel}>Carbon Drag</div>
          <div style={{ ...kpiValue, color:T.red }}>{(factorAnalysis.contributions.carbon || 0).toFixed(3)}%</div>
        </div>
        <div style={kpiStyle}>
          <div style={kpiLabel}>Active Return</div>
          <div style={{ ...kpiValue, color:factorAnalysis.activeReturn >= 0 ? T.green : T.red }}>{factorAnalysis.activeReturn >= 0 ? '+' : ''}{factorAnalysis.activeReturn.toFixed(3)}%</div>
        </div>
        <div style={kpiStyle}>
          <div style={kpiLabel}>Information Ratio</div>
          <div style={kpiValue}>{factorAnalysis.infoRatio.toFixed(2)}</div>
        </div>
        <div style={kpiStyle}>
          <div style={kpiLabel}>Tracking Error</div>
          <div style={kpiValue}>{(benchmark.trackingError * Math.sqrt(periodMult)).toFixed(2)}%</div>
        </div>
        <div style={kpiStyle}>
          <div style={kpiLabel}>Model Confidence</div>
          <div style={{ ...kpiValue, color:modelConfidence >= 70 ? T.green : modelConfidence >= 40 ? T.amber : T.red }}>{modelConfidence.toFixed(0)}%</div>
          <div style={{ fontSize:10, color:T.textMut, marginTop:2 }}>{enrichedHoldings.filter(h => h._dataQuality.level === 'full').length}/{enrichedHoldings.length} full data</div>
        </div>
      </div>

      {/* ── Factor Contribution Waterfall ───────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Factor Contribution to Active Return ({TIME_PERIODS[timePeriod].label})</div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={waterfallData} margin={{ top:10, right:30, left:10, bottom:20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} tickFormatter={v => `${v.toFixed(2)}%`} />
            <Tooltip formatter={(v) => [`${v.toFixed(3)}%`, 'Contribution']} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
            <ReferenceLine y={0} stroke={T.borderL} />
            <Bar dataKey="value" radius={[4,4,0,0]}>
              {waterfallData.map((entry, idx) => (
                <Cell key={idx} fill={entry.isTotal ? T.navy : entry.value >= 0 ? T.green : T.red} opacity={entry.isTotal ? 1 : 0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Factor Exposure Heatmap Table ────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={sectionTitle}>Factor Exposure Heatmap by Holding</div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle} onClick={() => toggleHeatmapSort('company')}>Company{arrow('company', heatmapSort, heatmapDir)}</th>
                <th style={{ ...thStyle, textAlign:'right' }} onClick={() => toggleHeatmapSort('weight')}>Weight{arrow('weight', heatmapSort, heatmapDir)}</th>
                <th style={{ ...thStyle, textAlign:'center' }} onClick={() => toggleHeatmapSort('dataQuality')}>Data Quality{arrow('dataQuality', heatmapSort, heatmapDir)}</th>
                {activeFactors.map(fk => (
                  <th key={fk} style={{ ...thStyle, textAlign:'center' }} onClick={() => toggleHeatmapSort(fk)}>
                    {fk.charAt(0).toUpperCase() + fk.slice(1)}{arrow(fk, heatmapSort, heatmapDir)}
                  </th>
                ))}
                <th style={{ ...thStyle, textAlign:'right' }} onClick={() => toggleHeatmapSort('totalContrib')}>Total Contrib{arrow('totalContrib', heatmapSort, heatmapDir)}</th>
                <th style={{ ...thStyle, textAlign:'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedHeatmap.map((h, i) => {
                const totalContrib = activeFactors.reduce((s, fk) => s + h.exposures[fk] * FACTOR_DEFS[fk].defaultPremium * (effectiveWeights[fk] || 0) * (h.weight || 0) / 100, 0) * periodMult;
                return (
                  <tr key={h.id || i} style={{ background:i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdStyle, fontWeight:600, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      <div>{h.company?.name || h.company?.ticker || 'N/A'}</div>
                      <div style={{ fontSize:10, color:T.textMut, fontWeight:400 }}>{h.company?.ticker} &middot; {h.company?.sector || ''}</div>
                    </td>
                    <td style={{ ...tdStyle, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{(h.weight || 0).toFixed(1)}%</td>
                    <td style={{ ...tdStyle, textAlign:'center', fontSize:14 }} title={h._dataQuality.label}>
                      {h._dataQuality.icon}
                    </td>
                    {activeFactors.map(fk => {
                      const v = h.exposures[fk];
                      return (
                        <td key={fk} style={{ ...tdStyle, textAlign:'center', background:exposureColor(v), color:exposureTextColor(v), fontWeight:600, fontVariantNumeric:'tabular-nums', borderRadius:3, fontSize:12 }}>
                          {v >= 0 ? '+' : ''}{v.toFixed(2)}
                        </td>
                      );
                    })}
                    <td style={{ ...tdStyle, textAlign:'right', fontWeight:600, color:totalContrib >= 0 ? T.green : T.red, fontVariantNumeric:'tabular-nums' }}>
                      {totalContrib >= 0 ? '+' : ''}{totalContrib.toFixed(3)}%
                    </td>
                    <td style={{ ...tdStyle, textAlign:'center' }}>
                      <span style={linkStyle} onClick={() => navigate('/holdings-deep-dive')}>Deep-Dive &rarr;</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Two-column: Sector Attribution + Risk Decomposition ─────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
        {/* Sector Attribution */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Sector Allocation Attribution vs {benchmarkKey}</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sectorAttributionData} margin={{ top:10, right:20, left:10, bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize:10, fill:T.textSec }} angle={-35} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize:11, fill:T.textSec }} tickFormatter={v => `${v.toFixed(2)}%`} />
              <Tooltip formatter={(v) => [`${typeof v === 'number' ? v.toFixed(3) : v}%`, 'Allocation Effect']} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
              <ReferenceLine y={0} stroke={T.borderL} />
              <Bar dataKey="allocationEffect" radius={[3,3,0,0]}>
                {sectorAttributionData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.allocationEffect >= 0 ? T.sage : T.red} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Decomposition */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Risk Decomposition</div>
          <div style={{ display:'flex', alignItems:'center', gap:32 }}>
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie data={riskDecompData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} strokeWidth={0}>
                  {riskDecompData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v.toFixed(1)}%`]} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {riskDecompData.map((item, idx) => (
                <div key={idx} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:14, height:14, borderRadius:3, background:item.fill, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{item.name}</div>
                    <div style={{ fontSize:22, fontWeight:700, color:T.navy }}>{item.value.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:12, padding:'10px 14px', background:T.surfaceH, borderRadius:8, fontSize:12, color:T.textSec }}>
                {activeFactors.length} active factors explain ~{factorAnalysis.systematicRisk.toFixed(0)}% of portfolio variance. Remaining {factorAnalysis.specificRisk.toFixed(0)}% is idiosyncratic / stock-specific.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Factor Performance Summary ──────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={sectionTitle}>Factor Performance Summary</div>
          <div style={{ fontSize:11, color:T.textMut }}>
            Period: {TIME_PERIODS[timePeriod].label} | Benchmark: {benchmarkKey} | Active Factors: {activeFactors.length}/6
          </div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {[
                { key:'name', label:'Factor' },
                { key:'enabled', label:'Active' },
                { key:'weight', label:'Weight' },
                { key:'premium', label:'Premium (%)' },
                { key:'exposure', label:'Portfolio Exposure' },
                { key:'contribution', label:'Contribution (%)' },
                { key:'attributionBps', label:'Attribution (bps)' },
              ].map(col => (
                <th key={col.key} style={{ ...thStyle, textAlign:col.key === 'name' ? 'left' : 'right' }} onClick={() => toggleFactorSort(col.key)}>
                  {col.label}{arrow(col.key, factorSort, factorDir)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedFactorTable.map((row, i) => (
              <tr key={row.key} style={{ background:i % 2 === 0 ? T.surface : T.surfaceH, opacity:row.enabled ? 1 : 0.5 }}>
                <td style={{ ...tdStyle, fontWeight:600 }}>
                  <div>{row.name}</div>
                  <div style={{ fontSize:11, color:T.textMut, fontWeight:400 }}>{FACTOR_DEFS[row.key].description}</div>
                </td>
                <td style={{ ...tdStyle, textAlign:'right' }}>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:row.enabled ? `${T.green}12` : `${T.red}10`, color:row.enabled ? T.green : T.red, fontWeight:500 }}>
                    {row.enabled ? 'ON' : 'OFF'}
                  </span>
                </td>
                <td style={{ ...tdStyle, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{row.weight.toFixed(1)}x</td>
                <td style={{ ...tdStyle, textAlign:'right', fontVariantNumeric:'tabular-nums', color:row.premium >= 0 ? T.green : T.red, fontWeight:600 }}>
                  {row.premium >= 0 ? '+' : ''}{row.premium.toFixed(2)}%
                </td>
                <td style={{ ...tdStyle, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{row.exposure >= 0 ? '+' : ''}{row.exposure.toFixed(3)}</td>
                <td style={{ ...tdStyle, textAlign:'right', fontVariantNumeric:'tabular-nums', color:row.contribution >= 0 ? T.green : T.red, fontWeight:600 }}>
                  {row.contribution >= 0 ? '+' : ''}{row.contribution.toFixed(4)}%
                </td>
                <td style={{ ...tdStyle, textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight:600, color:row.attributionBps >= 0 ? T.green : T.red }}>
                  {row.attributionBps >= 0 ? '+' : ''}{row.attributionBps.toFixed(1)} bps
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{ textAlign:'center', padding:'16px 0', fontSize:11, color:T.textMut }}>
        Multi-Factor Risk Attribution Engine &middot; {activeFactors.length} active factors &middot; {enrichedHoldings.length} holdings &middot; Benchmark: {benchmarkKey} &middot; Period: {TIME_PERIODS[timePeriod].label} &middot; Model Confidence: {modelConfidence.toFixed(0)}% &middot; Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}

export default RiskAttributionPage;
