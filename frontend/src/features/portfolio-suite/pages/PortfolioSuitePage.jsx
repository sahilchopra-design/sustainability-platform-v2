import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_COMPANY_MASTER, EXCHANGES } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────────── */
const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7',
  border: '#e5e0d8', borderL: '#d5cfc5',
  navy: '#1b3a5c', navyL: '#2c5a8c',
  gold: '#c5a96a', goldL: '#d4be8a',
  sage: '#5a8a6a', sageL: '#7ba67d',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const PIE_COLORS = ['#1b3a5c', '#c5a96a', '#5a8a6a', '#e07b54', '#7b6ea8', '#4a9bbe', '#d4a84b', '#6b8e6b', '#c46060', '#5c7ea8'];

/* ── Physical Risk Mappings ─────────────────────────────────────────────────── */
const COUNTRY_PHYSICAL_RISK = {
  India: 72, USA: 52, UK: 38, Germany: 35, France: 40, Japan: 58,
  'Hong Kong': 55, Australia: 68, Singapore: 45, 'South Korea': 42,
  China: 58, Brazil: 55, 'South Africa': 58, Canada: 40,
};
const EXCHANGE_COUNTRY = {
  'NSE/BSE': 'India', 'NYSE/NASDAQ': 'USA', 'LSE': 'UK', 'XETRA': 'Germany',
  'EURONEXT': 'France', 'Euronext': 'France', 'TSE': 'Japan', 'HKEX': 'Hong Kong',
  'ASX': 'Australia', 'SGX': 'Singapore', 'KRX': 'South Korea',
  'SSE/SZSE': 'China', 'B3': 'Brazil', 'JSE': 'South Africa', 'TSX': 'Canada',
};

const GREEN_SECTORS = ['Information Technology', 'Health Care', 'Communication Services', 'Consumer Staples'];
const BROWN_SECTORS = ['Energy', 'Materials', 'Utilities'];

/* ── localStorage helpers ───────────────────────────────────────────────────── */
function readPortfolioData() {
  try {
    const saved = localStorage.getItem('ra_portfolio_v1');
    const parsed = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    return { portfolios: parsed.portfolios || {}, activePortfolio: parsed.activePortfolio || null };
  } catch { return { portfolios: {}, activePortfolio: null }; }
}

function saveActivePortfolio(name) {
  try {
    const saved = localStorage.getItem('ra_portfolio_v1');
    const parsed = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    parsed.activePortfolio = name;
    localStorage.setItem('ra_portfolio_v1', JSON.stringify(parsed));
  } catch { /* swallow */ }
}

function readWatchlist() {
  try {
    const w = localStorage.getItem('ra_watchlist_v1');
    return w ? JSON.parse(w) : [];
  } catch { return []; }
}

/* ── Computation helpers ────────────────────────────────────────────────────── */
function getPhysicalRisk(h) {
  const exch = h.company.exchange || h.company._displayExchange || '';
  const country = EXCHANGE_COUNTRY[exch] || '';
  return COUNTRY_PHYSICAL_RISK[country] || 50;
}

function calcCompositeRisk(h) {
  const tRisk = h.company.transition_risk_score || 50;
  const pRisk = getPhysicalRisk(h);
  const esg = h.company.esg_score || 50;
  return 0.4 * tRisk + 0.3 * pRisk + 0.3 * (100 - esg);
}

function calcWACI(holdings) {
  return holdings.reduce((sum, h) => {
    const ghg = (h.company.scope1_mt || 0) + (h.company.scope2_mt || 0);
    const rev = h.company.revenue_usd_mn || 1;
    return sum + (h.weight / 100) * (ghg * 1_000_000 / rev);
  }, 0);
}

function impliedTempFromWACI(waci) {
  if (waci < 50) return { label: '1.5\u00b0C', color: T.green };
  if (waci < 120) return { label: '1.7\u00b0C', color: '#65a30d' };
  if (waci < 250) return { label: '2.0\u00b0C', color: T.amber };
  if (waci < 500) return { label: '2.5\u00b0C', color: '#ea580c' };
  if (waci < 900) return { label: '3.0\u00b0C', color: T.red };
  return { label: '3.5\u00b0C+', color: '#7f1d1d' };
}

function calcFinancedEmissions(holdings) {
  return holdings.reduce((sum, h) => {
    const af = h.exposure_usd_mn / (h.company.evic_usd_mn || h.exposure_usd_mn * 3);
    const ghg = (h.company.scope1_mt || 0) + (h.company.scope2_mt || 0);
    return sum + (h.weight / 100) * af * ghg;
  }, 0);
}

function calcSBTiCoverage(holdings) {
  const tw = holdings.reduce((s, h) => s + h.weight, 0);
  if (!tw) return 0;
  return (holdings.reduce((s, h) => s + (h.company.sbti_committed ? h.weight : 0), 0) / tw) * 100;
}

function calcWeightedAvg(holdings, field) {
  const tw = holdings.reduce((s, h) => s + h.weight, 0);
  if (!tw) return 0;
  return holdings.reduce((s, h) => s + (h.weight / tw) * (h.company[field] || 0), 0);
}

function calcPhysicalRiskAvg(holdings) {
  const tw = holdings.reduce((s, h) => s + h.weight, 0);
  if (!tw) return 0;
  return holdings.reduce((s, h) => s + (h.weight / tw) * getPhysicalRisk(h), 0);
}

function calcCarbonEfficiency(holdings) {
  const totalRev = holdings.reduce((s, h) => s + (h.weight / 100) * (h.company.revenue_usd_mn || 0), 0);
  const totalGHGkt = holdings.reduce((s, h) => {
    const ghg = (h.company.scope1_mt || 0) + (h.company.scope2_mt || 0);
    return s + (h.weight / 100) * ghg * 1000;
  }, 0);
  return totalGHGkt > 0 ? totalRev / totalGHGkt : 0;
}

function calcHHI(holdings) {
  const sectorWeights = {};
  holdings.forEach(h => {
    const s = h.company.sector || 'Unknown';
    sectorWeights[s] = (sectorWeights[s] || 0) + h.weight;
  });
  return Object.values(sectorWeights).reduce((sum, w) => sum + (w * w), 0);
}

function hhiLabel(hhi) {
  if (hhi < 1500) return { text: 'Diversified', color: T.green };
  if (hhi < 2500) return { text: 'Moderate', color: T.amber };
  return { text: 'Concentrated', color: T.red };
}

function calcDataQualityAvg(holdings) {
  const tw = holdings.reduce((s, h) => s + h.weight, 0);
  if (!tw) return 0;
  return holdings.reduce((s, h) => s + (h.weight / tw) * (h.company.data_quality_score || 50), 0);
}

function calcGreenBrownRatio(holdings) {
  let greenW = 0, brownW = 0;
  holdings.forEach(h => {
    const s = h.company.sector || '';
    if (GREEN_SECTORS.includes(s)) greenW += h.weight;
    if (BROWN_SECTORS.includes(s)) brownW += h.weight;
  });
  return brownW > 0 ? greenW / brownW : greenW > 0 ? 99.9 : 0;
}

function calcActiveShare(holdings) {
  const MSCI_WEIGHTS = {
    'Information Technology': 24, 'Financials': 15, 'Health Care': 12,
    'Consumer Discretionary': 11, 'Industrials': 10, 'Communication Services': 8,
    'Consumer Staples': 6, 'Energy': 5, 'Materials': 4, 'Utilities': 3, 'Real Estate': 2,
  };
  const sectorW = {};
  holdings.forEach(h => {
    const s = h.company.sector || 'Unknown';
    sectorW[s] = (sectorW[s] || 0) + h.weight;
  });
  const allSectors = new Set([...Object.keys(sectorW), ...Object.keys(MSCI_WEIGHTS)]);
  let diff = 0;
  allSectors.forEach(s => { diff += Math.abs((sectorW[s] || 0) - (MSCI_WEIGHTS[s] || 0)); });
  return diff / 2;
}

function groupBy(holdings, key, valueKey) {
  const map = {};
  holdings.forEach(h => {
    const k = h.company[key] || 'Unknown';
    map[k] = (map[k] || 0) + (valueKey ? h[valueKey] : h.weight);
  });
  return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
}

/* ── Risk row color helpers ─────────────────────────────────────────────────── */
function compositeRowBg(cr) {
  if (cr > 70) return '#fef2f2';
  if (cr > 40) return '#fffbeb';
  return '#f0fdf4';
}
function compositeRowBorder(cr) {
  if (cr > 70) return '#fecaca';
  if (cr > 40) return '#fde68a';
  return '#bbf7d0';
}
function compositeColor(cr) {
  if (cr > 70) return T.red;
  if (cr > 40) return T.amber;
  return T.green;
}

/* ── Export utilities ────────────────────────────────────────────────────────── */
function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
    const v = r[h] == null ? '' : r[h];
    return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── KPI Card ───────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, valueColor, sub, badge }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: valueColor || T.navy, lineHeight: 1.1 }}>{value}</div>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
            {badge.text}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
    </div>
  );
}

/* ── Sort Header ────────────────────────────────────────────────────────────── */
function SortHeader({ label, col, sortCol, sortDir, onSort }) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700,
        color: active ? T.navy : T.textMut, textTransform: 'uppercase', letterSpacing: '0.04em',
        borderBottom: `1px solid ${T.border}`, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      {label} {active ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
    </th>
  );
}

/* ── Pie Label ──────────────────────────────────────────────────────────────── */
const CUSTOM_PIE_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {name.length > 10 ? name.slice(0, 9) + '\u2026' : name}
    </text>
  );
};

/* ── Quick Actions ──────────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { icon: '\uD83C\uDFAF', title: 'Scenario Stress Test', desc: 'Run NGFS climate scenarios against your portfolio.', path: '/scenario-stress-test', metricKey: 'cvar' },
  { icon: '\uD83C\uDF21\uFE0F', title: 'Carbon Budget Tracker', desc: 'Track emissions vs the 1.5\u00b0C glide path.', path: '/carbon-budget', metricKey: 'carbonBudget' },
  { icon: '\uD83D\uDD0D', title: 'Holdings Deep-Dive', desc: 'Drill into individual company climate profiles.', path: '/holdings-deep-dive', metricKey: 'holdingsCount' },
  { icon: '\uD83D\uDCCA', title: 'Benchmark Analytics', desc: 'Compare portfolio against sector & index benchmarks.', path: '/benchmark-analytics', metricKey: 'activeShare' },
  { icon: '\uD83D\uDCCB', title: 'Advanced Report Studio', desc: 'Generate TCFD, SFDR PAI & custom PDF reports.', path: '/advanced-report-studio', metricKey: 'frameworks' },
  { icon: '\u26A1', title: 'Risk Attribution', desc: 'Decompose ESG alpha and risk factor exposures.', path: '/risk-attribution', metricKey: 'esgAlpha' },
  { icon: '\u2696\uFE0F', title: 'Regulatory Gap', desc: 'Map disclosure gaps across CSRD, BRSR, TCFD.', path: '/regulatory-gap', metricKey: 'compliance' },
  { icon: '\uD83C\uDF3F', title: 'Physical Risk', desc: 'Assess climate physical risk by geography.', path: '/physical-risk', metricKey: 'compositePhysical' },
];

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
export default function PortfolioSuitePage() {
  const navigate = useNavigate();
  const [data, setData] = useState(readPortfolioData());
  const [selected, setSelected] = useState(data.activePortfolio);
  const [sortCol, setSortCol] = useState('compositeRisk');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    const refreshed = readPortfolioData();
    setData(refreshed);
    setSelected(refreshed.activePortfolio);
  }, []);

  const portfolioNames = Object.keys(data.portfolios);
  const portfolio = selected ? data.portfolios[selected] : null;
  const holdings = portfolio?.holdings || [];

  const handleSelectPortfolio = (name) => {
    setSelected(name);
    saveActivePortfolio(name);
  };

  const handleSort = useCallback((col) => {
    setSortDir(prev => (sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'));
    setSortCol(col);
  }, [sortCol]);

  /* ── KPI computations ─────────────────────────────────────────────────── */
  const waci = useMemo(() => calcWACI(holdings), [holdings]);
  const tempInfo = useMemo(() => impliedTempFromWACI(waci), [waci]);
  const financedEmissions = useMemo(() => calcFinancedEmissions(holdings), [holdings]);
  const sbtiCoverage = useMemo(() => calcSBTiCoverage(holdings), [holdings]);
  const avgEsg = useMemo(() => calcWeightedAvg(holdings, 'esg_score'), [holdings]);
  const avgTRisk = useMemo(() => calcWeightedAvg(holdings, 'transition_risk_score'), [holdings]);
  const physicalRiskAvg = useMemo(() => calcPhysicalRiskAvg(holdings), [holdings]);
  const carbonEfficiency = useMemo(() => calcCarbonEfficiency(holdings), [holdings]);
  const activeShare = useMemo(() => calcActiveShare(holdings), [holdings]);
  const hhi = useMemo(() => calcHHI(holdings), [holdings]);
  const hhiInfo = useMemo(() => hhiLabel(hhi), [hhi]);
  const dataQualityAvg = useMemo(() => calcDataQualityAvg(holdings), [holdings]);
  const greenBrown = useMemo(() => calcGreenBrownRatio(holdings), [holdings]);

  /* ── Data quality badge ───────────────────────────────────────────────── */
  const dataCoverage = useMemo(() => {
    if (!holdings.length) return 0;
    return (holdings.filter(h => (h.company.scope1_mt || 0) > 0).length / holdings.length) * 100;
  }, [holdings]);
  const enrichedPct = useMemo(() => {
    if (!holdings.length) return 0;
    return (holdings.filter(h => h.company._enriched === true).length / holdings.length) * 100;
  }, [holdings]);

  /* ── Chart data ───────────────────────────────────────────────────────── */
  const sectorData = useMemo(() => groupBy(holdings, 'sector', 'exposure_usd_mn'), [holdings]);
  const exchangeData = useMemo(() => groupBy(holdings, 'exchange', 'exposure_usd_mn'), [holdings]);

  /* ── Risk distribution chart data ─────────────────────────────────────── */
  const riskDistribution = useMemo(() => {
    const buckets = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    holdings.forEach(h => {
      const cr = calcCompositeRisk(h);
      if (cr <= 30) buckets.Low++;
      else if (cr <= 50) buckets.Medium++;
      else if (cr <= 70) buckets.High++;
      else buckets.Critical++;
    });
    return [
      { name: 'Low', value: buckets.Low, fill: T.green },
      { name: 'Medium', value: buckets.Medium, fill: T.amber },
      { name: 'High', value: buckets.High, fill: '#ea580c' },
      { name: 'Critical', value: buckets.Critical, fill: T.red },
    ];
  }, [holdings]);

  /* ── Data coverage donut data ─────────────────────────────────────────── */
  const dataCoverageDonut = useMemo(() => {
    let full = 0, partial = 0, low = 0;
    holdings.forEach(h => {
      const dq = h.company.data_quality_score || 50;
      if (dq >= 70) full++;
      else if (dq >= 40) partial++;
      else low++;
    });
    return [
      { name: 'Full', value: full, fill: T.green },
      { name: 'Partial', value: partial, fill: T.amber },
      { name: 'Low', value: low, fill: T.red },
    ];
  }, [holdings]);

  /* ── Sorted table rows ────────────────────────────────────────────────── */
  const sortedHoldings = useMemo(() => {
    const withComputed = holdings.map(h => {
      const ghg = (h.company.scope1_mt || 0) + (h.company.scope2_mt || 0);
      const rev = h.company.revenue_usd_mn || 1;
      return {
        ...h,
        _ghgIntensity: (ghg * 1_000_000) / rev,
        _physicalRisk: getPhysicalRisk(h),
        _compositeRisk: calcCompositeRisk(h),
        _dataQuality: h.company.data_quality_score || 50,
      };
    });
    const getVal = (row) => {
      switch (sortCol) {
        case 'name': return (row.company.name || '').toLowerCase();
        case 'ticker': return (row.company.ticker || '').toLowerCase();
        case 'sector': return (row.company.sector || '').toLowerCase();
        case 'exchange': return (row.company.exchange || row.company._displayExchange || '').toLowerCase();
        case 'weight': return row.weight;
        case 'ghgIntensity': return row._ghgIntensity;
        case 'esgScore': return row.company.esg_score || 0;
        case 'tRisk': return row.company.transition_risk_score || 0;
        case 'physicalRisk': return row._physicalRisk;
        case 'sbti': return row.company.sbti_committed ? 1 : 0;
        case 'nzYear': return row.company.carbon_neutral_target_year || 9999;
        case 'dataQuality': return row._dataQuality;
        case 'compositeRisk': return row._compositeRisk;
        default: return row._compositeRisk;
      }
    };
    withComputed.sort((a, b) => {
      const va = getVal(a), vb = getVal(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return withComputed;
  }, [holdings, sortCol, sortDir]);

  /* ── Alert panels ─────────────────────────────────────────────────────── */
  const rebalanceAlerts = useMemo(
    () => holdings.filter(h => (h.company.transition_risk_score || 0) > 70 || calcCompositeRisk(h) > 70),
    [holdings]
  );
  const dataGapAlerts = useMemo(
    () => holdings.filter(h => !(h.company.scope1_mt > 0) || !(h.company.scope2_mt > 0) || !(h.company.esg_score > 0)),
    [holdings]
  );
  const watchlist = useMemo(() => readWatchlist(), []);
  const engagementQueue = useMemo(() => {
    if (!watchlist.length) return [];
    const tickers = new Set(watchlist.map(w => (w.ticker || '').toUpperCase()));
    return holdings.filter(h => tickers.has((h.company.ticker || '').toUpperCase()));
  }, [holdings, watchlist]);

  /* ── Quick action metrics ─────────────────────────────────────────────── */
  const quickMetrics = useMemo(() => ({
    cvar: `CVaR: ${(avgTRisk * 0.15).toFixed(1)}%`,
    carbonBudget: `${financedEmissions < 0.001 ? '<0.001' : financedEmissions.toFixed(3)} Mt`,
    holdingsCount: `${holdings.length} holdings`,
    activeShare: `Active Share: ${activeShare.toFixed(1)}%`,
    frameworks: `3 frameworks configured`,
    esgAlpha: `ESG Alpha: ${(avgEsg * 0.02 - 0.3).toFixed(1)}%`,
    compliance: `Compliance: ${Math.min(100, dataCoverage * 0.9 + 10).toFixed(0)}%`,
    compositePhysical: `Composite: ${physicalRiskAvg.toFixed(0)}/100`,
  }), [avgTRisk, financedEmissions, holdings.length, activeShare, avgEsg, dataCoverage, physicalRiskAvg]);

  /* ── Export handlers ──────────────────────────────────────────────────── */
  const handleExportCSV = useCallback(() => {
    const rows = sortedHoldings.map(h => ({
      Company: h.company.name,
      Ticker: h.company.ticker,
      Sector: h.company.sector || '',
      Exchange: h.company.exchange || h.company._displayExchange || '',
      'Weight%': h.weight.toFixed(2),
      'GHG Intensity': h._ghgIntensity.toFixed(1),
      'ESG Score': (h.company.esg_score || 0).toFixed(1),
      'Transition Risk': (h.company.transition_risk_score || 0).toFixed(1),
      'Physical Risk': h._physicalRisk,
      SBTi: h.company.sbti_committed ? 'Yes' : 'No',
      'NZ Year': h.company.carbon_neutral_target_year || '',
      'Data Quality': h._dataQuality,
      'Composite Risk': h._compositeRisk.toFixed(1),
    }));
    downloadCSV(`portfolio_dashboard_${selected || 'export'}.csv`, rows);
  }, [sortedHoldings, selected]);

  const handleExportKPIs = useCallback(() => {
    const kpis = {
      portfolio: selected,
      timestamp: new Date().toISOString(),
      waci: +waci.toFixed(1),
      impliedTemperature: tempInfo.label,
      financedEmissions_MtCO2e: +financedEmissions.toFixed(4),
      sbtiCoverage_pct: +sbtiCoverage.toFixed(1),
      avgESGScore: +avgEsg.toFixed(1),
      transitionRisk: +avgTRisk.toFixed(1),
      physicalRisk: +physicalRiskAvg.toFixed(1),
      carbonEfficiency_USDMnPerKtCO2e: +carbonEfficiency.toFixed(2),
      activeShare_pct: +activeShare.toFixed(1),
      hhi: +hhi.toFixed(0),
      dataQualityScore: +dataQualityAvg.toFixed(1),
      greenBrownRatio: +greenBrown.toFixed(2),
    };
    downloadJSON(`portfolio_kpis_${selected || 'export'}.json`, kpis);
  }, [selected, waci, tempInfo, financedEmissions, sbtiCoverage, avgEsg, avgTRisk, physicalRiskAvg, carbonEfficiency, activeShare, hhi, dataQualityAvg, greenBrown]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  /* ── Empty state ──────────────────────────────────────────────────────── */
  const emptyState = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 56 }}>{'\uD83D\uDCC1'}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>No Portfolio Selected</div>
      <div style={{ fontSize: 14, color: T.textSec, maxWidth: 380 }}>
        You haven't built a portfolio yet. Head to the Portfolio Manager to create and save one.
      </div>
      <button
        onClick={() => navigate('/portfolio-manager')}
        style={{ marginTop: 8, padding: '12px 28px', background: T.navy, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
      >
        Go to Portfolio Manager
      </button>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '32px 40px', fontFamily: T.font }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            EP-G1 &middot; Portfolio Suite
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.navy }}>Portfolio Suite Dashboard</h1>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
            Aggregated climate analytics &amp; links to specialist modules
          </div>
        </div>

        {/* Portfolio Selector + Data Quality Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Portfolio
          </label>
          {portfolioNames.length === 0 ? (
            <div style={{ fontSize: 13, color: T.textSec, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px' }}>
              No portfolio &mdash; <span style={{ color: T.navy, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/portfolio-manager')}>go to Portfolio Manager</span>
            </div>
          ) : (
            <select
              value={selected || ''}
              onChange={(e) => handleSelectPortfolio(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, fontWeight: 600, fontSize: 14, cursor: 'pointer', minWidth: 220 }}
            >
              <option value="" disabled>Select portfolio&hellip;</option>
              {portfolioNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          {holdings.length > 0 && (
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: T.textSec, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span style={{ fontWeight: 600 }}>{holdings.length} holdings</span>
              <span>&middot;</span>
              <span style={{ color: dataCoverage >= 70 ? T.green : dataCoverage >= 40 ? T.amber : T.red, fontWeight: 600 }}>{dataCoverage.toFixed(0)}% data coverage</span>
              <span>&middot;</span>
              <span style={{ color: T.textMut }}>{enrichedPct.toFixed(0)}% enriched</span>
            </div>
          )}
        </div>
      </div>

      {!portfolio || holdings.length === 0 ? emptyState : (
        <>
          {/* ── Export Toolbar ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Export Dashboard CSV', handler: handleExportCSV },
              { label: 'Export KPI Summary', handler: handleExportKPIs },
              { label: 'Print Dashboard', handler: handlePrint },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.handler}
                style={{
                  padding: '8px 18px', background: T.surface, color: T.navy, border: `1px solid ${T.border}`,
                  borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.surfaceH; e.currentTarget.style.borderColor = T.borderL; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* ── KPI Row 1 ──────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 14 }}>
            <KpiCard label="Portfolio WACI" value={waci.toFixed(1)} sub="t CO\u2082e / USD Mn \u00b7 vs MSCI ACWI 185" />
            <KpiCard label="Implied Temperature" value={tempInfo.label} valueColor={tempInfo.color} sub="Portfolio warming pathway" />
            <KpiCard label="Financed Emissions" value={financedEmissions < 0.001 ? '<0.001' : financedEmissions.toFixed(3)} sub="Mt CO\u2082e (attributed)" />
            <KpiCard
              label="SBTi Coverage"
              value={`${sbtiCoverage.toFixed(1)}%`}
              valueColor={sbtiCoverage >= 50 ? T.sage : sbtiCoverage >= 25 ? T.amber : T.red}
              sub="Portfolio weight committed"
            />
            <KpiCard
              label="Portfolio ESG Score"
              value={avgEsg.toFixed(1)}
              valueColor={avgEsg >= 60 ? T.sage : avgEsg >= 40 ? T.amber : T.red}
              sub="Weighted average"
            />
            <KpiCard
              label="Transition Risk"
              value={avgTRisk.toFixed(1)}
              valueColor={avgTRisk < 40 ? T.sage : avgTRisk < 65 ? T.amber : T.red}
              sub="Weighted avg score /100"
            />
          </div>

          {/* ── KPI Row 2 ──────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 28 }}>
            <KpiCard
              label="Physical Risk Score"
              value={physicalRiskAvg.toFixed(1)}
              valueColor={physicalRiskAvg < 40 ? T.sage : physicalRiskAvg < 60 ? T.amber : T.red}
              sub="Weighted avg (exchange/country)"
            />
            <KpiCard
              label="Carbon Efficiency"
              value={carbonEfficiency.toFixed(1)}
              sub="USD Mn rev / kt CO\u2082e"
            />
            <KpiCard
              label="Active Share vs MSCI"
              value={`${activeShare.toFixed(1)}%`}
              valueColor={activeShare > 50 ? T.red : activeShare > 25 ? T.amber : T.sage}
              sub="Sector weight deviation"
            />
            <KpiCard
              label="HHI Concentration"
              value={hhi.toFixed(0)}
              badge={{ text: hhiInfo.text, bg: hhiInfo.color === T.green ? '#f0fdf4' : hhiInfo.color === T.amber ? '#fffbeb' : '#fef2f2', color: hhiInfo.color }}
              sub="Herfindahl-Hirschman Index"
            />
            <KpiCard
              label="Data Quality Score"
              value={dataQualityAvg.toFixed(1)}
              valueColor={dataQualityAvg >= 70 ? T.sage : dataQualityAvg >= 40 ? T.amber : T.red}
              sub="Weighted avg DQS /100"
            />
            <KpiCard
              label="Green/Brown Ratio"
              value={greenBrown >= 99.9 ? '\u221E' : greenBrown.toFixed(2)}
              valueColor={greenBrown >= 1.5 ? T.sage : greenBrown >= 0.8 ? T.amber : T.red}
              sub="Green sector wt / Brown sector wt"
            />
          </div>

          {/* ── Charts Row (4 across) ──────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>

            {/* Sector Pie */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 4 }}>Sector Allocation</div>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 12 }}>By exposure (USD Mn)</div>
              {sectorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={sectorData} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false} label={CUSTOM_PIE_LABEL}>
                      {sectorData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`$${v.toLocaleString()}Mn`, n]} contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ textAlign: 'center', color: T.textMut, padding: 40 }}>No data</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 6 }}>
                {sectorData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.textSec }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Exchange Bar */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 4 }}>Exchange Allocation</div>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 12 }}>By exposure (USD Mn)</div>
              {exchangeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={exchangeData} margin={{ top: 4, right: 8, bottom: 20, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={v => [`$${v.toLocaleString()}Mn`, 'Exposure']} contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" fill={T.navy} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ textAlign: 'center', color: T.textMut, padding: 40 }}>No data</div>}
            </div>

            {/* Risk Distribution */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 4 }}>Risk Distribution</div>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 12 }}>Composite risk buckets</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={riskDistribution} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {riskDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Data Coverage Donut */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 4 }}>Data Coverage</div>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 12 }}>Quality distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={dataCoverageDonut} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius: ir, outerRadius: or, name, value }) => {
                      if (!value) return null;
                      const RADIAN = Math.PI / 180;
                      const r = ir + (or - ir) * 0.5;
                      const x = cx + r * Math.cos(-midAngle * RADIAN);
                      const y = cy + r * Math.sin(-midAngle * RADIAN);
                      return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{value}</text>;
                    }}>
                    {dataCoverageDonut.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 4 }}>
                {dataCoverageDonut.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.textSec }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.fill }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Climate Heatmap Table (Sortable) ───────────────────────────── */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <div style={{ fontWeight: 700, color: T.navy, fontSize: 15 }}>Climate Heatmap &mdash; All Holdings</div>
                <div style={{ fontSize: 12, color: T.textMut, marginTop: 2 }}>
                  Row colour by composite risk: <span style={{ color: T.green, fontWeight: 600 }}>Green</span> &le;40 &middot; <span style={{ color: T.amber, fontWeight: 600 }}>Amber</span> &gt;40 &middot; <span style={{ color: T.red, fontWeight: 600 }}>Red</span> &gt;70
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.textMut }}>Click column headers to sort</div>
            </div>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 3px' }}>
                <thead>
                  <tr>
                    <SortHeader label="Company" col="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Ticker" col="ticker" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Sector" col="sector" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Exchange" col="exchange" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Weight%" col="weight" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="GHG Intensity" col="ghgIntensity" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="ESG" col="esgScore" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="T-Risk" col="tRisk" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Phys Risk" col="physicalRisk" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="SBTi" col="sbti" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="NZ Year" col="nzYear" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="DQ" col="dataQuality" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Composite" col="compositeRisk" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {sortedHoldings.map(h => {
                    const cr = h._compositeRisk;
                    const bg = compositeRowBg(cr);
                    const borderC = compositeRowBorder(cr);
                    return (
                      <tr key={h.id} style={{ background: bg }}>
                        <td style={{ padding: '8px 10px', borderLeft: `3px solid ${borderC}`, borderRadius: '6px 0 0 6px', fontSize: 13, fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>
                          {h.company.name}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: T.textMut }}>{h.company.ticker || '\u2014'}</td>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: T.textSec }}>{h.company.sector || '\u2014'}</td>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: T.textSec }}>{h.company.exchange || h.company._displayExchange || '\u2014'}</td>
                        <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, color: T.navy }}>{h.weight.toFixed(2)}%</td>
                        <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, color: h._ghgIntensity > 500 ? T.red : h._ghgIntensity > 200 ? T.amber : T.green }}>
                          {h._ghgIntensity.toFixed(1)}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: T.textSec }}>{(h.company.esg_score || 0).toFixed(1)}</td>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: (h.company.transition_risk_score || 0) > 70 ? T.red : T.textSec }}>
                          {(h.company.transition_risk_score || 0).toFixed(1)}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: h._physicalRisk > 60 ? T.red : h._physicalRisk > 45 ? T.amber : T.textSec }}>
                          {h._physicalRisk}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 12 }}>
                          {h.company.sbti_committed ? <span style={{ color: T.green, fontWeight: 700 }}>{'\u2714'}</span> : <span style={{ color: T.textMut }}>{'\u2014'}</span>}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: T.textSec }}>
                          {h.company.carbon_neutral_target_year || '\u2014'}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 12 }}>
                          <span style={{
                            display: 'inline-block', padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                            background: h._dataQuality >= 70 ? '#f0fdf4' : h._dataQuality >= 40 ? '#fffbeb' : '#fef2f2',
                            color: h._dataQuality >= 70 ? T.green : h._dataQuality >= 40 ? T.amber : T.red,
                          }}>
                            {h._dataQuality}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', borderRadius: '0 6px 6px 0', fontSize: 13, fontWeight: 700, color: compositeColor(cr) }}>
                          {cr.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Specialist Modules (Quick Actions) ─────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 17, marginBottom: 4 }}>Specialist Modules</div>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 16 }}>Deep-dive analytics tools linked to this portfolio</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {QUICK_ACTIONS.map(qa => (
                <div
                  key={qa.path}
                  onClick={() => navigate(qa.path)}
                  style={{
                    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
                    padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8,
                    cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(27,58,92,0.10)'; e.currentTarget.style.borderColor = T.borderL; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = T.border; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 24 }}>{qa.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.navyL, background: T.surfaceH, padding: '2px 8px', borderRadius: 8, whiteSpace: 'nowrap' }}>
                      {quickMetrics[qa.metricKey] || ''}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{qa.title}</div>
                  <div style={{ fontSize: 12, color: T.textSec, flex: 1 }}>{qa.desc}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navyL, marginTop: 2 }}>Open &rarr;</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Alert Panels (3 columns) ───────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

            {/* Rebalance Alerts */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>{'\u26A0\uFE0F'}</span>
                <div>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>Rebalance Alerts</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>T-Risk &gt; 70 or Composite &gt; 70</div>
                </div>
                {rebalanceAlerts.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#fef2f2', color: T.red, border: '1px solid #fecaca', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                    {rebalanceAlerts.length}
                  </span>
                )}
              </div>
              {rebalanceAlerts.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                  <span style={{ fontSize: 16 }}>{'\u2705'}</span>
                  <span style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>No holdings flagged. Portfolio looks healthy.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                  {rebalanceAlerts.map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{h.company.name}</div>
                        <div style={{ fontSize: 11, color: T.textSec }}>{h.company.ticker} &middot; {h.weight.toFixed(2)}%</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: T.red }}>{(h.company.transition_risk_score || 0).toFixed(0)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Data Gap Alerts */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>{'\uD83D\uDCC9'}</span>
                <div>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>Data Gap Alerts</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Missing scope1/scope2 or ESG</div>
                </div>
                {dataGapAlerts.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#fffbeb', color: T.amber, border: '1px solid #fde68a', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                    {dataGapAlerts.length}
                  </span>
                )}
              </div>
              {dataGapAlerts.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                  <span style={{ fontSize: 16 }}>{'\u2705'}</span>
                  <span style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>All holdings have full data coverage.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                  {dataGapAlerts.map(h => {
                    const gaps = [];
                    if (!(h.company.scope1_mt > 0)) gaps.push('Scope 1');
                    if (!(h.company.scope2_mt > 0)) gaps.push('Scope 2');
                    if (!(h.company.esg_score > 0)) gaps.push('ESG');
                    return (
                      <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{h.company.name}</div>
                          <div style={{ fontSize: 11, color: T.textSec }}>{h.company.ticker}</div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.amber }}>{gaps.join(', ')}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Engagement Queue */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>{'\uD83D\uDCEC'}</span>
                <div>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>Engagement Queue</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Watchlist matches in portfolio</div>
                </div>
                {engagementQueue.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                    {engagementQueue.length}
                  </span>
                )}
              </div>
              {engagementQueue.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                  <span style={{ fontSize: 16 }}>{'\u2705'}</span>
                  <span style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>No watchlist holdings in this portfolio.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                  {engagementQueue.map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{h.company.name}</div>
                        <div style={{ fontSize: 11, color: T.textSec }}>{h.company.ticker} &middot; {h.company.sector || 'Unknown'}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#2563eb' }}>On watchlist</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Global Master Integration Note ─────────────────────────────── */}
          <div style={{ marginTop: 24, padding: '14px 20px', background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16 }}>{'\uD83C\uDF10'}</span>
            <div style={{ fontSize: 12, color: T.textSec }}>
              <strong style={{ color: T.navy }}>Global Company Master:</strong> {GLOBAL_COMPANY_MASTER.length} companies across {EXCHANGES.length} exchanges available for enrichment &amp; benchmarking.
              {' '}Physical risk scores mapped via exchange&rarr;country ({Object.keys(COUNTRY_PHYSICAL_RISK).length} countries).
            </div>
          </div>
        </>
      )}
    </div>
  );
}
