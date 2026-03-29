import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis, AreaChart, Area,
  ReferenceLine, LabelList
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── IWA Framework ─────────────────────────────────────────── */
const IWA_PILLARS = {
  environmental: {
    name: 'Environmental Impact', color: '#16a34a', weight: 0.40,
    dimensions: [
      { id: 'IWA-E1', name: 'GHG Emissions Cost', methodology: 'Social Cost of Carbon x Scope 1+2', unit: 'USD Mn', scc_per_tonne: 51, description: 'Monetized cost of carbon emissions at $51/tCO2 (US EPA social cost of carbon)', source: 'EPA SCC 2023' },
      { id: 'IWA-E2', name: 'Water Use Cost', methodology: 'Water scarcity factor x withdrawal x shadow price', unit: 'USD Mn', shadow_price_per_ml: 2.5, description: 'Cost of water withdrawal in water-stressed regions' },
      { id: 'IWA-E3', name: 'Air Pollution Cost', methodology: 'Health impact of SOx, NOx, PM2.5 per sector', unit: 'USD Mn', description: 'Estimated health costs from air pollutant emissions' },
      { id: 'IWA-E4', name: 'Waste & Land Use Cost', methodology: 'Disposal costs + ecosystem service loss', unit: 'USD Mn', description: 'Cost of waste generation and land degradation' },
      { id: 'IWA-E5', name: 'Biodiversity Loss Cost', methodology: 'MSA loss x ecosystem service value', unit: 'USD Mn', description: 'Monetized biodiversity impact from nature dependency module' },
    ],
  },
  employment: {
    name: 'Employment Impact', color: '#2563eb', weight: 0.35,
    dimensions: [
      { id: 'IWA-S1', name: 'Wage Quality', methodology: '(Actual wage - living wage) x employees in at-risk regions', unit: 'USD Mn', description: 'Positive if paying above living wage, negative if below' },
      { id: 'IWA-S2', name: 'Employment Creation', methodology: 'Job creation x wage multiplier x local economic impact', unit: 'USD Mn', description: 'Value of employment provided' },
      { id: 'IWA-S3', name: 'Health & Safety Cost', methodology: 'Fatalities x value of statistical life + injuries x medical cost', unit: 'USD Mn', vsl: 11.6, description: 'Cost of workplace incidents (VSL = $11.6M US EPA)' },
      { id: 'IWA-S4', name: 'Training & Development Value', methodology: 'Training hours x skill premium x employees', unit: 'USD Mn', description: 'Human capital development value' },
      { id: 'IWA-S5', name: 'Diversity & Inclusion Value', methodology: 'Innovation premium from diverse teams', unit: 'USD Mn', description: 'Estimated value of workforce diversity' },
    ],
  },
  product: {
    name: 'Product Impact', color: '#d97706', weight: 0.25,
    dimensions: [
      { id: 'IWA-P1', name: 'Product Accessibility', methodology: 'Revenue from underserved markets x access premium', unit: 'USD Mn', description: 'Value of making products available to underserved populations' },
      { id: 'IWA-P2', name: 'Health & Wellbeing Impact', methodology: 'Health outcomes x quality-adjusted life years', unit: 'USD Mn', description: 'Product impact on customer health (positive for pharma, negative for tobacco)' },
      { id: 'IWA-P3', name: 'Data Privacy Cost', methodology: 'Breach probability x exposed records x cost per record', unit: 'USD Mn', description: 'Expected cost of data privacy failures' },
      { id: 'IWA-P4', name: 'Product Safety', methodology: 'Recall probability x units x avg cost', unit: 'USD Mn', description: 'Expected product safety costs' },
    ],
  },
};

const SECTOR_IMPACT_FACTORS = {
  Energy:      { env_cost_per_mn: -12.5, empl_value_per_mn: 3.2, product_impact_per_mn: -1.5 },
  Materials:   { env_cost_per_mn: -8.8,  empl_value_per_mn: 2.8, product_impact_per_mn: 0.5 },
  Industrials: { env_cost_per_mn: -4.2,  empl_value_per_mn: 3.5, product_impact_per_mn: 1.2 },
  Utilities:   { env_cost_per_mn: -9.5,  empl_value_per_mn: 2.5, product_impact_per_mn: 2.8 },
  'Consumer Staples': { env_cost_per_mn: -3.8, empl_value_per_mn: 2.0, product_impact_per_mn: 1.5 },
  'Consumer Discretionary': { env_cost_per_mn: -2.5, empl_value_per_mn: 2.2, product_impact_per_mn: 0.8 },
  'Health Care': { env_cost_per_mn: -1.2, empl_value_per_mn: 4.5, product_impact_per_mn: 8.5 },
  Financials:  { env_cost_per_mn: -0.8,  empl_value_per_mn: 5.0, product_impact_per_mn: 2.0 },
  IT:          { env_cost_per_mn: -1.5,  empl_value_per_mn: 6.0, product_impact_per_mn: 3.5 },
  'Communication Services': { env_cost_per_mn: -0.5, empl_value_per_mn: 4.0, product_impact_per_mn: -1.0 },
  'Real Estate': { env_cost_per_mn: -3.5, empl_value_per_mn: 1.8, product_impact_per_mn: 1.0 },
};

const ALL_DIMS = [...IWA_PILLARS.environmental.dimensions, ...IWA_PILLARS.employment.dimensions, ...IWA_PILLARS.product.dimensions];
const PIE_COLORS = ['#16a34a', '#2563eb', '#d97706'];
const PILLAR_KEYS = ['environmental', 'employment', 'product'];

/* ── IWA Computation ───────────────────────────────────────── */
function computeIWA(company, scc = 51, overrides = {}) {
  const rev = company.revenue_usd_mn || 0;
  const factors = SECTOR_IMPACT_FACTORS[company.sector] || { env_cost_per_mn: -2, empl_value_per_mn: 3, product_impact_per_mn: 1 };
  const co = overrides[company.company_id] || {};

  const emissionsCost = -((company.scope1_mt || 0) + (company.scope2_mt || 0)) * scc * 1e6 / 1e6;
  const envBase = emissionsCost + (rev * factors.env_cost_per_mn / 100);
  const envImpact = co.envOverride != null ? co.envOverride : envBase;

  const emplBase = rev * factors.empl_value_per_mn / 100;
  const emplImpact = co.emplOverride != null ? co.emplOverride : emplBase;

  const prodBase = rev * factors.product_impact_per_mn / 100;
  const prodImpact = co.prodOverride != null ? co.prodOverride : prodBase;

  const totalImpact = envImpact + emplImpact + prodImpact;
  const impactIntensity = rev > 0 ? totalImpact / rev * 100 : 0;

  /* dimension-level breakdown (proportional split) */
  const envDims = IWA_PILLARS.environmental.dimensions.map((d, i) => {
    const w = [0.45, 0.15, 0.18, 0.12, 0.10][i];
    return { ...d, value: envImpact * w };
  });
  const emplDims = IWA_PILLARS.employment.dimensions.map((d, i) => {
    const w = [0.30, 0.28, 0.15, 0.15, 0.12][i];
    return { ...d, value: emplImpact * w };
  });
  const prodDims = IWA_PILLARS.product.dimensions.map((d, i) => {
    const w = [0.30, 0.35, 0.20, 0.15][i];
    return { ...d, value: prodImpact * w };
  });

  return { envImpact, emplImpact, prodImpact, totalImpact, impactIntensity, emissionsCost, revenue: rev, envDims, emplDims, prodDims };
}

/* ── Helpers ────────────────────────────────────────────────── */
const fmt = (v, d = 1) => v == null || isNaN(v) ? '--' : Number(v).toFixed(d);
const fmtM = v => v == null || isNaN(v) ? '--' : `${v < 0 ? '-' : ''}$${Math.abs(v).toFixed(1)}M`;
const pct = v => v == null || isNaN(v) ? '--' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
const LS_OVERRIDES = 'ra_iwa_overrides_v1';

function loadOverrides() { try { return JSON.parse(localStorage.getItem(LS_OVERRIDES)) || {}; } catch { return {}; } }
function saveOverrides(o) { localStorage.setItem(LS_OVERRIDES, JSON.stringify(o)); }

/* ── Reusable Card / Table Components ──────────────────────── */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, ...style }}>{children}</div>
);
const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 18px', minWidth: 150, flex: '1 1 170px' }}>
    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Badge = ({ text, color }) => (
  <span style={{ fontSize: 10, fontWeight: 600, background: color || T.navyL, color: '#fff', borderRadius: 6, padding: '3px 10px', letterSpacing: 0.3 }}>{text}</span>
);
const SortHeader = ({ label, sortKey, sortCol, sortDir, onSort, style }) => (
  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, cursor: 'pointer', userSelect: 'none', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', ...style }}
    onClick={() => onSort(sortKey)}>
    {label} {sortCol === sortKey ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);
const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || T.text }}>{p.name}: {typeof p.value === 'number' ? fmtM(p.value) : p.value}</div>)}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                */
/* ══════════════════════════════════════════════════════════════ */
export default function ImpactWeightedAccountsPage() {
  const navigate = useNavigate();

  /* ── Portfolio ────────────────────────────────────────────── */
  const [holdings, setHoldings] = useState([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '{}');
      const pName = raw.activePortfolio || Object.keys(raw.portfolios || {})[0];
      const h = raw.portfolios?.[pName]?.holdings || [];
      const merged = h.map(p => {
        const m = GLOBAL_COMPANY_MASTER.find(c => c.company_id === p.company_id) || {};
        return { ...m, ...p };
      });
      setHoldings(merged.length ? merged : GLOBAL_COMPANY_MASTER.slice(0, 30));
    } catch { setHoldings(GLOBAL_COMPANY_MASTER.slice(0, 30)); }
  }, []);

  /* ── State ───────────────────────────────────────────────── */
  const [scc, setScc] = useState(51);
  const [overrides, setOverrides] = useState(loadOverrides);
  const [sortCol, setSortCol] = useState('totalImpact');
  const [sortDir, setSortDir] = useState('desc');
  const [activeTab, setActiveTab] = useState('overview');
  const [envDimIdx, setEnvDimIdx] = useState(0);
  const [emplDimIdx, setEmplDimIdx] = useState(0);
  const [prodDimIdx, setProdDimIdx] = useState(0);
  const [overrideEdit, setOverrideEdit] = useState({});
  const [projectionYears, setProjectionYears] = useState(5);

  /* ── IWA computations ────────────────────────────────────── */
  const data = useMemo(() => {
    return holdings.map(h => {
      const iwa = computeIWA(h, scc, overrides);
      return { ...h, ...iwa };
    });
  }, [holdings, scc, overrides]);

  const sorted = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      const va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [data, sortCol, sortDir]);

  const handleSort = useCallback(col => {
    setSortDir(d => sortCol === col ? (d === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortCol(col);
  }, [sortCol]);

  /* ── Aggregate KPIs ──────────────────────────────────────── */
  const agg = useMemo(() => {
    const totalEnv = data.reduce((s, d) => s + d.envImpact, 0);
    const totalEmpl = data.reduce((s, d) => s + d.emplImpact, 0);
    const totalProd = data.reduce((s, d) => s + d.prodImpact, 0);
    const totalImpact = totalEnv + totalEmpl + totalProd;
    const totalRev = data.reduce((s, d) => s + d.revenue, 0);
    const positive = data.filter(d => d.totalImpact >= 0).length;
    const negative = data.filter(d => d.totalImpact < 0).length;
    const best = data.reduce((b, d) => d.totalImpact > (b?.totalImpact ?? -Infinity) ? d : b, null);
    const worst = data.reduce((w, d) => d.totalImpact < (w?.totalImpact ?? Infinity) ? d : w, null);
    const netIntensity = totalRev > 0 ? totalImpact / totalRev * 100 : 0;
    const impactReturn = totalRev > 0 ? (totalRev + totalImpact) / totalRev * 100 - 100 : 0;
    return { totalEnv, totalEmpl, totalProd, totalImpact, totalRev, positive, negative, best, worst, netIntensity, impactReturn };
  }, [data]);

  /* ── Waterfall ───────────────────────────────────────────── */
  const waterfallData = useMemo(() => [
    { name: 'Revenue', value: agg.totalRev, fill: T.navy },
    { name: '+ Employment', value: agg.totalEmpl, fill: '#2563eb' },
    { name: '+ Product', value: agg.totalProd, fill: T.amber },
    { name: '- Environmental', value: agg.totalEnv, fill: T.red },
    { name: '= Impact-Adj Rev', value: agg.totalRev + agg.totalImpact, fill: T.sage },
  ], [agg]);

  /* ── Pie ─────────────────────────────────────────────────── */
  const pieData = useMemo(() => [
    { name: 'Environmental', value: Math.abs(agg.totalEnv) },
    { name: 'Employment', value: Math.abs(agg.totalEmpl) },
    { name: 'Product', value: Math.abs(agg.totalProd) },
  ], [agg]);

  /* ── Sector profile ──────────────────────────────────────── */
  const sectorProfile = useMemo(() => {
    const map = {};
    data.forEach(d => {
      const sec = d.sector || 'Other';
      if (!map[sec]) map[sec] = { sector: sec, env: 0, empl: 0, prod: 0, count: 0 };
      map[sec].env += d.envImpact; map[sec].empl += d.emplImpact; map[sec].prod += d.prodImpact; map[sec].count++;
    });
    return Object.values(map).map(s => ({ ...s, env: s.env / s.count, empl: s.empl / s.count, prod: s.prod / s.count }));
  }, [data]);

  /* ── Impact vs Return Scatter ────────────────────────────── */
  const scatterData = useMemo(() => data.map(d => ({
    name: d.company_name || d.company_id,
    x: d.revenue > 0 ? ((d.weight_pct || 2) * 1.1 - 1) : 0,
    y: d.impactIntensity,
    z: d.revenue,
  })), [data]);

  /* ── Projection (SBTi targets) ───────────────────────────── */
  const projection = useMemo(() => {
    const years = [];
    for (let y = 0; y <= projectionYears; y++) {
      const reductionFactor = 1 - (y * 0.042); // 4.2% annual reduction (SBTi 1.5C pathway)
      const envAdj = agg.totalEnv * reductionFactor;
      const total = envAdj + agg.totalEmpl + agg.totalProd;
      years.push({ year: 2025 + y, env: envAdj, empl: agg.totalEmpl * (1 + y * 0.01), prod: agg.totalProd * (1 + y * 0.015), total });
    }
    return years;
  }, [agg, projectionYears]);

  /* ── Dimension drilldowns ────────────────────────────────── */
  const envDrilldown = useMemo(() => data.map(d => ({ name: (d.company_name || d.company_id || '').slice(0, 18), value: d.envDims?.[envDimIdx]?.value || 0 })).sort((a, b) => a.value - b.value).slice(0, 15), [data, envDimIdx]);
  const emplDrilldown = useMemo(() => data.map(d => ({ name: (d.company_name || d.company_id || '').slice(0, 18), value: d.emplDims?.[emplDimIdx]?.value || 0 })).sort((a, b) => b.value - a.value).slice(0, 15), [data, emplDimIdx]);
  const prodDrilldown = useMemo(() => data.map(d => ({ name: (d.company_name || d.company_id || '').slice(0, 18), value: d.prodDims?.[prodDimIdx]?.value || 0 })).sort((a, b) => b.value - a.value).slice(0, 15), [data, prodDimIdx]);

  /* ── Override handler ────────────────────────────────────── */
  const saveCompanyOverride = useCallback((cid) => {
    const edit = overrideEdit[cid];
    if (!edit) return;
    const next = { ...overrides, [cid]: { envOverride: edit.env !== '' ? parseFloat(edit.env) : undefined, emplOverride: edit.empl !== '' ? parseFloat(edit.empl) : undefined, prodOverride: edit.prod !== '' ? parseFloat(edit.prod) : undefined } };
    setOverrides(next);
    saveOverrides(next);
  }, [overrides, overrideEdit]);

  /* ── Impact P&L ──────────────────────────────────────────── */
  const impactPL = useMemo(() => [
    { line: 'Total Revenue', value: agg.totalRev, type: 'header' },
    { line: 'Operating Profit (est. 15%)', value: agg.totalRev * 0.15, type: 'sub' },
    { line: 'Employment Value', value: agg.totalEmpl, type: 'impact', color: '#2563eb' },
    { line: 'Product Impact', value: agg.totalProd, type: 'impact', color: T.amber },
    { line: 'Environmental Cost', value: agg.totalEnv, type: 'impact', color: T.red },
    { line: 'Net Impact', value: agg.totalImpact, type: 'total' },
    { line: 'Impact-Adjusted Profit', value: agg.totalRev * 0.15 + agg.totalImpact, type: 'header' },
  ], [agg]);

  /* ── Exports ─────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const rows = [['Company', 'Sector', 'Revenue_USDMn', 'Env_Impact', 'Empl_Impact', 'Prod_Impact', 'Total_Impact', 'Impact_Intensity_Pct'].join(',')];
    data.forEach(d => rows.push([d.company_name || d.company_id, d.sector, fmt(d.revenue, 1), fmt(d.envImpact, 2), fmt(d.emplImpact, 2), fmt(d.prodImpact, 2), fmt(d.totalImpact, 2), fmt(d.impactIntensity, 2)].join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `IWA_Report_SCC${scc}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }, [data, scc]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ scc, impactPL, holdings: data.map(d => ({ id: d.company_id, name: d.company_name, sector: d.sector, revenue: d.revenue, envImpact: d.envImpact, emplImpact: d.emplImpact, prodImpact: d.prodImpact, totalImpact: d.totalImpact, impactIntensity: d.impactIntensity })) }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `IWA_Impact_PL_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  }, [data, scc, impactPL]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Navigation tabs ─────────────────────────────────────── */
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'env', label: 'Environmental' },
    { key: 'empl', label: 'Employment' },
    { key: 'prod', label: 'Product' },
    { key: 'analysis', label: 'Analysis' },
    { key: 'overrides', label: 'Overrides' },
    { key: 'methodology', label: 'Methodology' },
  ];

  /* ══════════════════════════════════════════════════════════ */
  /*  RENDER                                                    */
  /* ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: T.navy }}>Impact-Weighted Accounts</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge text="Harvard IWA" color={T.navy} /><Badge text={`SCC $${scc}/t`} color={T.sage} /><Badge text="3 Pillars" color="#2563eb" /><Badge text="14 Dimensions" color={T.amber} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.navy }}>Export CSV</button>
          <button onClick={exportJSON} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.navy }}>Export JSON</button>
          <button onClick={handlePrint} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.navy }}>Print</button>
        </div>
      </div>

      {/* ── Cross-Nav ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['SDG Tracker', '/sdg-tracker'], ['Social Impact', '/social-impact'], ['Carbon Budget', '/carbon-budget'], ['Living Wage', '/living-wage']].map(([label, path]) => (
          <button key={path} onClick={() => navigate(path)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceH, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: T.navyL }}>
            {label} &rarr;
          </button>
        ))}
      </div>

      {/* ── Tab nav ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: '8px 18px', borderRadius: 8, border: activeTab === t.key ? `2px solid ${T.navy}` : `1px solid ${T.border}`, background: activeTab === t.key ? T.navy : T.surface, color: activeTab === t.key ? '#fff' : T.text, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <KPI label="Total Portfolio Impact" value={fmtM(agg.totalImpact)} color={agg.totalImpact >= 0 ? T.green : T.red} sub={`${data.length} holdings`} />
        <KPI label="Environmental Impact" value={fmtM(agg.totalEnv)} color={T.red} sub="GHG + water + air + waste + bio" />
        <KPI label="Employment Impact" value={fmtM(agg.totalEmpl)} color="#2563eb" sub="Wage + jobs + safety + training + D&I" />
        <KPI label="Product Impact" value={fmtM(agg.totalProd)} color={T.amber} sub="Access + health + privacy + safety" />
        <KPI label="Net Impact / Revenue" value={pct(agg.netIntensity)} color={agg.netIntensity >= 0 ? T.green : T.red} sub="Impact intensity" />
        <KPI label="Positive Impact Cos." value={agg.positive} color={T.green} />
        <KPI label="Negative Impact Cos." value={agg.negative} color={T.red} />
        <KPI label="Largest Positive" value={(agg.best?.company_name || '--').slice(0, 20)} color={T.green} sub={fmtM(agg.best?.totalImpact)} />
        <KPI label="Largest Negative" value={(agg.worst?.company_name || '--').slice(0, 20)} color={T.red} sub={fmtM(agg.worst?.totalImpact)} />
        <KPI label="SCC Applied" value={`$${scc}/tCO\u2082`} color={T.sage} sub="EPA social cost of carbon" />
        <KPI label="Portfolio Revenue" value={fmtM(agg.totalRev)} color={T.navy} />
        <KPI label="Impact-Adjusted Return" value={pct(agg.impactReturn)} color={agg.impactReturn >= 0 ? T.green : T.red} sub="vs traditional P&L" />
      </div>

      {/* ═══ OVERVIEW TAB ══════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          {/* Waterfall */}
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Impact Waterfall -- Revenue to Impact-Adjusted Revenue</h3>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={waterfallData} margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `$${(v / 1).toFixed(0)}M`} />
                <Tooltip content={<TT />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {waterfallData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  <LabelList dataKey="value" position="top" formatter={v => fmtM(v)} style={{ fontSize: 10, fill: T.textSec }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Pie & Holdings Table side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: T.navy }}>3-Pillar Breakdown</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtM(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: T.navy }}>Holdings Impact Table</h3>
              <div style={{ overflowX: 'auto', maxHeight: 400 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <SortHeader label="Company" sortKey="company_name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortHeader label="Sector" sortKey="sector" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortHeader label="Revenue" sortKey="revenue" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                      <SortHeader label="Env" sortKey="envImpact" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                      <SortHeader label="Empl" sortKey="emplImpact" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                      <SortHeader label="Prod" sortKey="prodImpact" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                      <SortHeader label="Total" sortKey="totalImpact" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                      <SortHeader label="Impact/Rev %" sortKey="impactIntensity" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.slice(0, 30).map((d, i) => (
                      <tr key={d.company_id || i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{(d.company_name || d.company_id || '--').slice(0, 28)}</td>
                        <td style={{ padding: '8px 12px', color: T.textSec }}>{(d.sector || '--').slice(0, 20)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmtM(d.revenue)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: d.envImpact >= 0 ? T.green : T.red }}>{fmtM(d.envImpact)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#2563eb' }}>{fmtM(d.emplImpact)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: T.amber }}>{fmtM(d.prodImpact)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: d.totalImpact >= 0 ? T.green : T.red }}>{fmtM(d.totalImpact)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: d.impactIntensity >= 0 ? T.green : T.red }}>{pct(d.impactIntensity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Sector profile */}
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Sector Impact Profile (Average per Company)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={sectorProfile} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `$${v.toFixed(0)}M`} />
                <Tooltip content={<TT />} />
                <Legend />
                <Bar dataKey="env" name="Environmental" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="empl" name="Employment" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="prod" name="Product" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Impact P&L */}
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Impact-Adjusted P&L Statement</h3>
            <table style={{ width: '100%', maxWidth: 500, borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {impactPL.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: r.type === 'header' ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '10px 14px', fontWeight: r.type === 'header' || r.type === 'total' ? 700 : 400, color: r.color || T.text, paddingLeft: r.type === 'impact' ? 32 : r.type === 'sub' ? 24 : 14 }}>
                      {r.type === 'impact' ? '(+) ' : ''}{r.line}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: r.type === 'header' || r.type === 'total' ? 700 : 400, color: r.value >= 0 ? (r.type === 'impact' ? r.color : T.navy) : T.red }}>
                      {fmtM(r.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* ═══ ENVIRONMENTAL TAB ═════════════════════════════════ */}
      {activeTab === 'env' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#16a34a' }}>Environmental Impact Deep-Dive</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {IWA_PILLARS.environmental.dimensions.map((d, i) => (
              <button key={d.id} onClick={() => setEnvDimIdx(i)} style={{ padding: '6px 14px', borderRadius: 8, border: envDimIdx === i ? '2px solid #16a34a' : `1px solid ${T.border}`, background: envDimIdx === i ? '#16a34a' : T.surface, color: envDimIdx === i ? '#fff' : T.text, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                {d.name}
              </button>
            ))}
          </div>
          <div style={{ background: T.surfaceH, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{IWA_PILLARS.environmental.dimensions[envDimIdx].name}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{IWA_PILLARS.environmental.dimensions[envDimIdx].description}</div>
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Methodology: {IWA_PILLARS.environmental.dimensions[envDimIdx].methodology}</div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={envDrilldown} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => fmtM(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={100} />
              <Tooltip content={<TT />} />
              <ReferenceLine x={0} stroke={T.textMut} strokeDasharray="3 3" />
              <Bar dataKey="value" name="Impact (USD Mn)" radius={[0, 4, 4, 0]}>
                {envDrilldown.map((e, i) => <Cell key={i} fill={e.value >= 0 ? '#16a34a' : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ═══ EMPLOYMENT TAB ════════════════════════════════════ */}
      {activeTab === 'empl' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#2563eb' }}>Employment Impact Deep-Dive</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {IWA_PILLARS.employment.dimensions.map((d, i) => (
              <button key={d.id} onClick={() => setEmplDimIdx(i)} style={{ padding: '6px 14px', borderRadius: 8, border: emplDimIdx === i ? '2px solid #2563eb' : `1px solid ${T.border}`, background: emplDimIdx === i ? '#2563eb' : T.surface, color: emplDimIdx === i ? '#fff' : T.text, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                {d.name}
              </button>
            ))}
          </div>
          <div style={{ background: T.surfaceH, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{IWA_PILLARS.employment.dimensions[emplDimIdx].name}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{IWA_PILLARS.employment.dimensions[emplDimIdx].description}</div>
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Methodology: {IWA_PILLARS.employment.dimensions[emplDimIdx].methodology}</div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={emplDrilldown} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => fmtM(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={100} />
              <Tooltip content={<TT />} />
              <Bar dataKey="value" name="Impact (USD Mn)" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ═══ PRODUCT TAB ═══════════════════════════════════════ */}
      {activeTab === 'prod' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.amber }}>Product Impact Deep-Dive</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {IWA_PILLARS.product.dimensions.map((d, i) => (
              <button key={d.id} onClick={() => setProdDimIdx(i)} style={{ padding: '6px 14px', borderRadius: 8, border: prodDimIdx === i ? `2px solid ${T.amber}` : `1px solid ${T.border}`, background: prodDimIdx === i ? T.amber : T.surface, color: prodDimIdx === i ? '#fff' : T.text, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                {d.name}
              </button>
            ))}
          </div>
          <div style={{ background: T.surfaceH, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{IWA_PILLARS.product.dimensions[prodDimIdx].name}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{IWA_PILLARS.product.dimensions[prodDimIdx].description}</div>
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Methodology: {IWA_PILLARS.product.dimensions[prodDimIdx].methodology}</div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={prodDrilldown} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => fmtM(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={100} />
              <Tooltip content={<TT />} />
              <Bar dataKey="value" name="Impact (USD Mn)" fill={T.amber} radius={[0, 4, 4, 0]}>
                {prodDrilldown.map((e, i) => <Cell key={i} fill={e.value >= 0 ? T.amber : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ═══ ANALYSIS TAB ══════════════════════════════════════ */}
      {activeTab === 'analysis' && (
        <>
          {/* SCC Sensitivity Slider */}
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>SCC Sensitivity Analysis</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: T.textSec, minWidth: 30 }}>$20</span>
              <input type="range" min={20} max={200} step={1} value={scc} onChange={e => setScc(Number(e.target.value))}
                style={{ flex: 1, accentColor: T.sage }} />
              <span style={{ fontSize: 12, color: T.textSec, minWidth: 40 }}>$200</span>
              <div style={{ background: T.surfaceH, borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 18, color: T.sage, minWidth: 90, textAlign: 'center' }}>
                ${scc}/t
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Environmental Impact at ${scc}/tCO\u2082</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: agg.totalEnv >= 0 ? T.green : T.red }}>{fmtM(agg.totalEnv)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Total Portfolio Impact</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: agg.totalImpact >= 0 ? T.green : T.red }}>{fmtM(agg.totalImpact)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Net Impact Intensity</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: agg.netIntensity >= 0 ? T.green : T.red }}>{pct(agg.netIntensity)}</div>
              </div>
            </div>
          </Card>

          {/* Impact vs Financial Return Scatter */}
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Impact vs Financial Return</h3>
            <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>X-axis: portfolio weight proxy (financial allocation). Y-axis: impact intensity (% of revenue). Top-right quadrant = positive on both.</p>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="x" name="Financial %" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Financial Allocation %', position: 'bottom', fontSize: 11, fill: T.textMut }} />
                <YAxis type="number" dataKey="y" name="Impact %" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Impact Intensity %', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textMut }} />
                <ZAxis type="number" dataKey="z" range={[40, 400]} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}><div style={{ fontWeight: 600 }}>{d?.name}</div><div>Financial: {fmt(d?.x, 2)}%</div><div>Impact: {fmt(d?.y, 2)}%</div></div>);
                }} />
                <ReferenceLine y={0} stroke={T.textMut} strokeDasharray="3 3" />
                <ReferenceLine x={0} stroke={T.textMut} strokeDasharray="3 3" />
                <Scatter data={scatterData} fill={T.navy} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>

          {/* SBTi Projection */}
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Impact Trend -- SBTi 1.5C Pathway Projection</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>Projection years:</span>
              <input type="range" min={3} max={15} step={1} value={projectionYears} onChange={e => setProjectionYears(Number(e.target.value))} style={{ width: 160, accentColor: T.sage }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: T.sage }}>{projectionYears} years</span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={projection} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `$${v.toFixed(0)}M`} />
                <Tooltip content={<TT />} />
                <Legend />
                <Area type="monotone" dataKey="env" name="Environmental" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} />
                <Area type="monotone" dataKey="empl" name="Employment" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
                <Area type="monotone" dataKey="prod" name="Product" stroke="#d97706" fill="#d97706" fillOpacity={0.15} />
                <Area type="monotone" dataKey="total" name="Total Impact" stroke={T.navy} fill={T.navy} fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 8 }}>Assumes 4.2% annual GHG reduction (SBTi 1.5C aligned), 1% annual employment value growth, 1.5% product impact growth.</div>
          </Card>
        </>
      )}

      {/* ═══ OVERRIDES TAB ═════════════════════════════════════ */}
      {activeTab === 'overrides' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Manual Impact Overrides</h3>
          <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Override computed IWA values per company. Blank = use computed. Persisted to localStorage (ra_iwa_overrides_v1).</p>
          <div style={{ overflowX: 'auto', maxHeight: 500 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Company</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Computed Env</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Override Env (USD Mn)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Computed Empl</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Override Empl</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Computed Prod</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Override Prod</th>
                  <th style={{ padding: '10px 12px', borderBottom: `2px solid ${T.border}` }}></th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 25).map((d, i) => {
                  const cid = d.company_id;
                  const edit = overrideEdit[cid] || { env: overrides[cid]?.envOverride ?? '', empl: overrides[cid]?.emplOverride ?? '', prod: overrides[cid]?.prodOverride ?? '' };
                  return (
                    <tr key={cid || i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{(d.company_name || cid || '--').slice(0, 24)}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{fmtM(computeIWA(d, scc, {}).envImpact)}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <input type="number" step="0.1" value={edit.env} onChange={e => setOverrideEdit(p => ({ ...p, [cid]: { ...edit, env: e.target.value } }))}
                          style={{ width: 80, padding: '4px 6px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }} placeholder="--" />
                      </td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{fmtM(computeIWA(d, scc, {}).emplImpact)}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <input type="number" step="0.1" value={edit.empl} onChange={e => setOverrideEdit(p => ({ ...p, [cid]: { ...edit, empl: e.target.value } }))}
                          style={{ width: 80, padding: '4px 6px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }} placeholder="--" />
                      </td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{fmtM(computeIWA(d, scc, {}).prodImpact)}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <input type="number" step="0.1" value={edit.prod} onChange={e => setOverrideEdit(p => ({ ...p, [cid]: { ...edit, prod: e.target.value } }))}
                          style={{ width: 80, padding: '4px 6px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }} placeholder="--" />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <button onClick={() => saveCompanyOverride(cid)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${T.sage}`, background: T.sage, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Save</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {Object.keys(overrides).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button onClick={() => { setOverrides({}); saveOverrides({}); setOverrideEdit({}); }} style={{ padding: '6px 16px', borderRadius: 8, border: `1px solid ${T.red}`, background: T.surface, color: T.red, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Clear All Overrides ({Object.keys(overrides).length})</button>
            </div>
          )}
        </Card>
      )}

      {/* ═══ METHODOLOGY TAB ═══════════════════════════════════ */}
      {activeTab === 'methodology' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Methodology & Sources</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Framework overview */}
            <div style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: T.navy }}>Harvard Impact-Weighted Accounts (IWA)</div>
              <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, margin: 0 }}>
                The IWA initiative monetizes environmental and social impacts alongside financial returns, enabling true cost accounting.
                Three pillars are assessed: Environmental (40% weight), Employment (35%), and Product (25%).
                Each pillar contains multiple dimensions measured in USD millions impact equivalent.
              </p>
            </div>
            {/* SCC */}
            <div style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: T.sage }}>Social Cost of Carbon (SCC)</div>
              <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, margin: 0 }}>
                US EPA Social Cost of Carbon at $51/tCO2 (2023 central estimate). This represents the marginal global damage from one additional tonne of CO2 emissions.
                The SCC sensitivity slider allows analysis from $20 to $200/tonne to reflect various policy scenarios and discount rate assumptions.
              </p>
            </div>
            {/* Employment */}
            <div style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#2563eb' }}>Employment Impact Methodology</div>
              <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, margin: 0 }}>
                Based on ILO labor statistics, living wage benchmarks, and US EPA Value of Statistical Life ($11.6M).
                Wage quality measured as the gap between actual and living wages. Health & safety costs use VSL methodology.
                Training value based on skill premium literature.
              </p>
            </div>
            {/* Sources */}
            <div style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: T.amber }}>Key References</div>
              <ul style={{ fontSize: 12, color: T.textSec, lineHeight: 1.8, margin: 0, paddingLeft: 16 }}>
                <li>Harvard Business School -- Impact-Weighted Accounts Project</li>
                <li>US EPA -- Social Cost of Carbon (2023 Technical Update)</li>
                <li>OECD -- Cost of Air Pollution: Health Impacts of Road Transport</li>
                <li>ILO -- Global Wage Report; Decent Work Indicators</li>
                <li>World Bank -- Water Scarcity Shadow Pricing</li>
                <li>GIIN -- IRIS+ System for Impact Measurement</li>
              </ul>
            </div>
          </div>
          {/* All 14 dimensions detail */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: T.navy }}>14 Impact Dimensions Reference</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, color: T.textMut }}>ID</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, color: T.textMut }}>Dimension</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, color: T.textMut }}>Pillar</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, color: T.textMut }}>Methodology</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, color: T.textMut }}>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {PILLAR_KEYS.map(pk => IWA_PILLARS[pk].dimensions.map((d, i) => (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: IWA_PILLARS[pk].color }}>{d.id}</td>
                      <td style={{ padding: '6px 10px' }}>{d.name}</td>
                      <td style={{ padding: '6px 10px', color: IWA_PILLARS[pk].color }}>{IWA_PILLARS[pk].name}</td>
                      <td style={{ padding: '6px 10px', color: T.textSec }}>{d.methodology}</td>
                      <td style={{ padding: '6px 10px' }}>{d.unit}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', fontSize: 11, color: T.textMut, padding: '16px 0', borderTop: `1px solid ${T.border}`, marginTop: 32 }}>
        Impact-Weighted Accounts Engine | Harvard IWA Methodology | EPA SCC ${scc}/tCO2 | {data.length} holdings assessed | Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
