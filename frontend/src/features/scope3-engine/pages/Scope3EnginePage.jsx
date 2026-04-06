import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell, PieChart, Pie, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';
import { useNavigate } from 'react-router-dom';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

// ─── Scope 3 Categories (GHG Protocol) ──────────────────────────────────────
const SCOPE3_CATEGORIES = [
  { id: 1, name: 'Purchased Goods & Services', upstream: true, method: 'spend-based', description: 'Emissions from purchased products/services', factor_description: 'Emission factor per USD spent by sector', avg_pct_of_total: 35 },
  { id: 2, name: 'Capital Goods', upstream: true, method: 'spend-based', description: 'Emissions from purchased capital equipment', factor_description: 'Capital expenditure x sector EF', avg_pct_of_total: 8 },
  { id: 3, name: 'Fuel & Energy Related', upstream: true, method: 'energy-based', description: 'Upstream emissions from fuel/electricity', factor_description: '~10-20% of Scope 1+2', avg_pct_of_total: 5 },
  { id: 4, name: 'Upstream Transportation', upstream: true, method: 'spend-based', description: 'Emissions from inbound logistics', factor_description: 'Logistics spend x transport EF', avg_pct_of_total: 4 },
  { id: 5, name: 'Waste Generated in Operations', upstream: true, method: 'activity-based', description: 'Emissions from waste disposal', factor_description: 'Waste tonnes x disposal EF', avg_pct_of_total: 1 },
  { id: 6, name: 'Business Travel', upstream: true, method: 'spend-based', description: 'Employee business travel emissions', factor_description: 'Travel spend x mode EF', avg_pct_of_total: 1 },
  { id: 7, name: 'Employee Commuting', upstream: true, method: 'employee-based', description: 'Employee commute emissions', factor_description: 'Employees x avg commute EF', avg_pct_of_total: 2 },
  { id: 8, name: 'Upstream Leased Assets', upstream: true, method: 'asset-based', description: 'Emissions from leased assets (upstream)', factor_description: 'Leased asset area x EF', avg_pct_of_total: 1 },
  { id: 9, name: 'Downstream Transportation', upstream: false, method: 'spend-based', description: 'Emissions from outbound logistics', factor_description: 'Distribution spend x transport EF', avg_pct_of_total: 3 },
  { id: 10, name: 'Processing of Sold Products', upstream: false, method: 'activity-based', description: 'Emissions from processing intermediate products', factor_description: 'Product volume x processing EF', avg_pct_of_total: 2 },
  { id: 11, name: 'Use of Sold Products', upstream: false, method: 'product-based', description: 'Emissions from product use by customers', factor_description: 'Product energy x use-phase EF', avg_pct_of_total: 25 },
  { id: 12, name: 'End-of-Life Treatment', upstream: false, method: 'product-based', description: 'Emissions from product disposal', factor_description: 'Product mass x disposal EF', avg_pct_of_total: 1 },
  { id: 13, name: 'Downstream Leased Assets', upstream: false, method: 'asset-based', description: 'Emissions from leased assets (downstream)', factor_description: 'Leased asset area x EF', avg_pct_of_total: 2 },
  { id: 14, name: 'Franchises', upstream: false, method: 'activity-based', description: 'Emissions from franchise operations', factor_description: 'Franchise count x avg EF', avg_pct_of_total: 1 },
  { id: 15, name: 'Investments', upstream: false, method: 'investment-based', description: 'Emissions from financial investments (PCAF)', factor_description: 'Investment x attribution factor x investee emissions', avg_pct_of_total: 9 },
];

// ─── Sector Emission Factors (tCO2e per USD Mn revenue) ─────────────────────
const SECTOR_EMISSION_FACTORS = {
  Energy:      { cat1: 320, cat2: 45, cat3: 0.15, cat4: 28, cat6: 3.5, cat7: 2.2, cat9: 18, cat11: 850, total_s3_multiplier: 4.5 },
  Materials:   { cat1: 280, cat2: 52, cat3: 0.12, cat4: 35, cat6: 2.8, cat7: 2.5, cat9: 22, cat11: 120, total_s3_multiplier: 3.2 },
  Industrials: { cat1: 180, cat2: 38, cat3: 0.10, cat4: 22, cat6: 4.2, cat7: 2.8, cat9: 15, cat11: 95,  total_s3_multiplier: 2.5 },
  Utilities:   { cat1: 150, cat2: 62, cat3: 0.18, cat4: 12, cat6: 1.5, cat7: 1.8, cat9: 8,  cat11: 650, total_s3_multiplier: 5.0 },
  Financials:  { cat1: 25,  cat2: 8,  cat3: 0.08, cat4: 2,  cat6: 5.5, cat7: 3.2, cat9: 1,  cat11: 5,   total_s3_multiplier: 1.2, cat15_dominant: true },
  IT:          { cat1: 45,  cat2: 15, cat3: 0.06, cat4: 5,  cat6: 6.8, cat7: 3.5, cat9: 4,  cat11: 35,  total_s3_multiplier: 1.8 },
  'Health Care': { cat1: 65, cat2: 22, cat3: 0.08, cat4: 8, cat6: 4.5, cat7: 2.8, cat9: 6,  cat11: 18,  total_s3_multiplier: 2.0 },
  'Consumer Discretionary': { cat1: 120, cat2: 18, cat3: 0.09, cat4: 25, cat6: 3.2, cat7: 2.5, cat9: 20, cat11: 45, total_s3_multiplier: 2.2 },
  'Consumer Staples': { cat1: 200, cat2: 15, cat3: 0.10, cat4: 30, cat6: 2.5, cat7: 2.2, cat9: 25, cat11: 35, total_s3_multiplier: 2.8 },
  'Communication Services': { cat1: 35, cat2: 12, cat3: 0.05, cat4: 3, cat6: 5.2, cat7: 3.0, cat9: 2, cat11: 20, total_s3_multiplier: 1.5 },
  'Real Estate': { cat1: 40, cat2: 28, cat3: 0.12, cat4: 5, cat6: 2.0, cat7: 2.0, cat9: 3, cat11: 55, total_s3_multiplier: 2.0 },
};

const ALL_SECTORS = Object.keys(SECTOR_EMISSION_FACTORS);

// ─── Estimation Engine ──────────────────────────────────────────────────────
function estimateScope3(company, overrides = {}) {
  const rev = company.revenue_usd_mn || 0;
  const s1 = company.scope1_mt || 0;
  const s2 = company.scope2_mt || 0;
  const sector = company.sector || 'Industrials';
  const employees = company.employees || (rev * 2);
  const ef = SECTOR_EMISSION_FACTORS[sector] || SECTOR_EMISSION_FACTORS['Industrials'];

  const cats = SCOPE3_CATEGORIES.map(cat => {
    let estimated_mt = 0;
    let confidence = 'Low';

    switch (cat.id) {
      case 1:  estimated_mt = (rev * ef.cat1) / 1e6; confidence = 'Medium'; break;
      case 2:  estimated_mt = (rev * 0.08 * ef.cat2) / 1e6; break;
      case 3:  estimated_mt = (s1 + s2) * ef.cat3; confidence = 'High'; break;
      case 4:  estimated_mt = (rev * 0.05 * ef.cat4) / 1e6; break;
      case 5:  estimated_mt = (rev * 0.002 * 500) / 1e6; break;
      case 6:  estimated_mt = (employees * ef.cat6) / 1e6; confidence = 'Medium'; break;
      case 7:  estimated_mt = (employees * ef.cat7) / 1e6; confidence = 'Medium'; break;
      case 8:  estimated_mt = (rev * 0.01 * 50) / 1e6; break;
      case 9:  estimated_mt = (rev * 0.04 * ef.cat9) / 1e6; break;
      case 10: estimated_mt = (rev * 0.03 * 30) / 1e6; break;
      case 11: estimated_mt = (rev * ef.cat11) / 1e6; confidence = ef.cat11 > 100 ? 'High' : 'Medium'; break;
      case 12: estimated_mt = (rev * 0.005 * 100) / 1e6; break;
      case 13: estimated_mt = (rev * 0.02 * 40) / 1e6; break;
      case 14: estimated_mt = (rev * 0.01 * 20) / 1e6; break;
      case 15: estimated_mt = ef.cat15_dominant ? (rev * 0.3 * 150) / 1e6 : (rev * 0.02 * 50) / 1e6; break;
      default: break;
    }

    // Apply override if present
    if (overrides[cat.id] != null && overrides[cat.id] !== '') {
      estimated_mt = parseFloat(overrides[cat.id]);
      confidence = 'Reported';
    }

    return {
      ...cat,
      estimated_mt: Math.round(estimated_mt * 1000) / 1000,
      estimated_tco2e: Math.round(estimated_mt * 1e6),
      confidence,
      pct_of_total: 0,
    };
  });

  const total = cats.reduce((s, c) => s + c.estimated_mt, 0);
  cats.forEach(c => { c.pct_of_total = total > 0 ? Math.round((c.estimated_mt / total) * 10000) / 100 : 0; });
  return cats;
}

// ─── Portfolio Reader ────────────────────────────────────────────────────────
function readPortfolio() {
  try {
    const raw = localStorage.getItem('ra_portfolio_v1');
    if (!raw) return null;
    const outer = JSON.parse(raw);
    if (!outer || !outer.portfolios) return null;
    const pid = outer.activePortfolio || Object.keys(outer.portfolios)[0];
    const p = outer.portfolios[pid];
    if (!p || !p.holdings || !p.holdings.length) return null;
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { lookup[c.isin] = c; });
    const holdings = p.holdings.map(h => {
      const company = lookup[h.isin] || GLOBAL_COMPANY_MASTER.find(c => c.company_name === h.name);
      if (!company) return null;
      return { ...h, company, weight: h.weight_pct || h.weight || 0, exposure_usd_mn: h.exposure_usd_mn || 0 };
    }).filter(Boolean);
    return { name: p.name || pid, holdings };
  } catch { return null; }
}

function demoHoldings() {
  const sample = GLOBAL_COMPANY_MASTER.filter(c => c.scope1_mt > 0 && c.revenue_usd_mn > 0).slice(0, 20);
  const w = 100 / sample.length;
  return sample.map(c => ({ isin: c.isin, name: c.company_name, company: c, weight: w, exposure_usd_mn: c.market_cap_usd_mn ? c.market_cap_usd_mn * 0.01 : 50 }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n, d = 2) { if (n == null || isNaN(n)) return '\u2014'; return Number(n).toFixed(d); }
function fmtK(n) { if (n == null || isNaN(n)) return '\u2014'; if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return n.toFixed(0); }
function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

const CONF_COLORS = { High: T.green, Medium: T.gold, Low: T.red, Reported: '#6366f1' };
const CONF_ORDER = ['Reported', 'High', 'Medium', 'Low'];

// ─── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({ label, value, valueColor, sub, icon }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {icon && <div style={{ fontSize: 22, marginBottom: 2 }}>{icon}</div>}
      <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: valueColor || T.navy, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textSec }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, sub, rightContent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.navy }}>{title}</h3>
        {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
      </div>
      {rightContent}
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color, background: color + '18', border: `1px solid ${color}40`, borderRadius: 6, padding: '2px 8px', letterSpacing: '0.03em' }}>{text}</span>
  );
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
function CatTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, fontSize: 12, maxWidth: 280, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>Cat {d.id}: {d.name}</div>
      <div style={{ color: T.textSec, marginBottom: 6 }}>{d.description}</div>
      <div><strong>Estimated:</strong> {fmt(d.estimated_mt, 3)} Mt CO2e</div>
      <div><strong>Share:</strong> {fmt(d.pct_of_total, 1)}%</div>
      <div><strong>Confidence:</strong> <span style={{ color: CONF_COLORS[d.confidence] }}>{d.confidence}</span></div>
      <div><strong>Method:</strong> {d.method}</div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Scope3EnginePage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => readPortfolio(), []);
  const holdings = useMemo(() => portfolio ? portfolio.holdings : demoHoldings(), [portfolio]);
  const isDemo = !portfolio;

  // Company selector
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('all'); // all | upstream | downstream
  const [methodToggle, setMethodToggle] = useState('hybrid'); // spend | activity | hybrid
  const [confFilter, setConfFilter] = useState('all'); // all | High | Medium | Low | Reported
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [overrides, setOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('scope3_overrides') || '{}'); } catch { return {}; }
  });

  const selectedCompany = holdings[selectedIdx]?.company || holdings[0]?.company;
  const companyKey = selectedCompany?.isin || selectedCompany?.company_name || 'unknown';

  // Compute overrides for this company
  const companyOverrides = overrides[companyKey] || {};

  // Estimate Scope 3 for selected company
  const scope3Data = useMemo(() => {
    if (!selectedCompany) return [];
    return estimateScope3(selectedCompany, companyOverrides);
  }, [selectedCompany, companyOverrides]);

  // Filtered categories
  const filteredCats = useMemo(() => {
    let cats = scope3Data;
    if (catFilter === 'upstream') cats = cats.filter(c => c.upstream);
    if (catFilter === 'downstream') cats = cats.filter(c => !c.upstream);
    if (confFilter !== 'all') cats = cats.filter(c => c.confidence === confFilter);
    return cats;
  }, [scope3Data, catFilter, confFilter]);

  // Sorted for waterfall (descending)
  const waterfallData = useMemo(() => [...filteredCats].sort((a, b) => b.estimated_mt - a.estimated_mt), [filteredCats]);

  // KPI calculations
  const totalS3 = scope3Data.reduce((s, c) => s + c.estimated_mt, 0);
  const s1 = selectedCompany?.scope1_mt || 0;
  const s2 = selectedCompany?.scope2_mt || 0;
  const s3Ratio = (s1 + s2) > 0 ? totalS3 / (s1 + s2) : 0;
  const largestCat = scope3Data.reduce((mx, c) => c.estimated_mt > (mx?.estimated_mt || 0) ? c : mx, scope3Data[0]);
  const catsWithData = scope3Data.filter(c => c.estimated_mt > 0).length;
  const upstreamTotal = scope3Data.filter(c => c.upstream).reduce((s, c) => s + c.estimated_mt, 0);
  const downstreamTotal = scope3Data.filter(c => !c.upstream).reduce((s, c) => s + c.estimated_mt, 0);
  const s3Intensity = (selectedCompany?.revenue_usd_mn || 0) > 0 ? (totalS3 / selectedCompany.revenue_usd_mn) * 1e6 : 0; // tCO2e per USD Mn
  const confWeighted = scope3Data.reduce((s, c) => {
    const w = c.estimated_mt;
    const score = c.confidence === 'Reported' ? 100 : c.confidence === 'High' ? 75 : c.confidence === 'Medium' ? 50 : 25;
    return s + w * score;
  }, 0) / (totalS3 || 1);

  // Pie data
  const pieData = [
    { name: 'Upstream', value: Math.round(upstreamTotal * 1000) / 1000, fill: T.navyL },
    { name: 'Downstream', value: Math.round(downstreamTotal * 1000) / 1000, fill: T.gold },
  ];

  // Scope 1+2+3 comparison
  const scopeCompare = [
    { name: 'Scope 1', value: s1, fill: T.navy },
    { name: 'Scope 2', value: s2, fill: T.navyL },
    { name: 'S3 Upstream', value: upstreamTotal, fill: T.sage },
    { name: 'S3 Downstream', value: downstreamTotal, fill: T.gold },
  ];

  // Sector comparison (this company vs sector avg)
  const sectorAvg = useMemo(() => {
    const sector = selectedCompany?.sector || 'Industrials';
    const ef = SECTOR_EMISSION_FACTORS[sector] || SECTOR_EMISSION_FACTORS['Industrials'];
    // compute a "typical" company in this sector with median revenue
    const sectorCompanies = GLOBAL_COMPANY_MASTER.filter(c => c.sector === sector && c.revenue_usd_mn > 0);
    const medianRev = sectorCompanies.length > 0
      ? sectorCompanies.sort((a, b) => a.revenue_usd_mn - b.revenue_usd_mn)[Math.floor(sectorCompanies.length / 2)].revenue_usd_mn
      : 5000;
    const avgCompany = { revenue_usd_mn: medianRev, scope1_mt: medianRev * 0.05, scope2_mt: medianRev * 0.02, sector, employees: medianRev * 2 };
    return estimateScope3(avgCompany);
  }, [selectedCompany]);

  const sectorCompareData = useMemo(() => {
    const top5 = [...scope3Data].sort((a, b) => b.estimated_mt - a.estimated_mt).slice(0, 5);
    return top5.map(c => {
      const avg = sectorAvg.find(sa => sa.id === c.id);
      return {
        name: `Cat ${c.id}`,
        fullName: c.name,
        company: c.estimated_mt,
        sectorAvg: avg ? avg.estimated_mt : 0,
      };
    });
  }, [scope3Data, sectorAvg]);

  // Portfolio Scope 3 Aggregation (PCAF)
  const portfolioS3 = useMemo(() => {
    return holdings.map(h => {
      const cats = estimateScope3(h.company);
      const total = cats.reduce((s, c) => s + c.estimated_mt, 0);
      const evicOrMktCap = h.company.evic_usd_mn || h.company.market_cap_usd_mn || h.company.revenue_usd_mn || 0;
      const attribution = evicOrMktCap > 0 ? (h.exposure_usd_mn || 0) / evicOrMktCap : 0;
      return {
        name: h.company.company_name,
        sector: h.company.sector,
        weight: h.weight,
        totalS3: total,
        attributed: total * Math.min(attribution, 1),
        scope1: h.company.scope1_mt || 0,
        scope2: h.company.scope2_mt || 0,
      };
    }).sort((a, b) => b.attributed - a.attributed);
  }, [holdings]);
  const totalPortfolioS3 = portfolioS3.reduce((s, p) => s + p.attributed, 0);

  // Category heatmap (holdings x top 5 cats)
  const top5CatIds = useMemo(() => {
    const agg = {};
    holdings.forEach(h => {
      const cats = estimateScope3(h.company);
      cats.forEach(c => { agg[c.id] = (agg[c.id] || 0) + c.estimated_mt; });
    });
    return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => parseInt(e[0]));
  }, [holdings]);

  const heatmapData = useMemo(() => {
    return holdings.slice(0, 15).map(h => {
      const cats = estimateScope3(h.company);
      const row = { name: (h.company.company_name || '').substring(0, 20) };
      top5CatIds.forEach(cid => {
        const cat = cats.find(c => c.id === cid);
        row[`cat${cid}`] = cat ? cat.estimated_mt : 0;
      });
      return row;
    });
  }, [holdings, top5CatIds]);

  // Universe search
  const searchResults = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const q = searchTerm.toLowerCase();
    return GLOBAL_COMPANY_MASTER
      .filter(c => (c.company_name || '').toLowerCase().includes(q) || (c.isin || '').toLowerCase().includes(q))
      .slice(0, 15);
  }, [searchTerm]);

  // Override handler
  const saveOverride = useCallback((catId, value) => {
    const next = { ...overrides, [companyKey]: { ...companyOverrides, [catId]: value } };
    setOverrides(next);
    try { localStorage.setItem('scope3_overrides', JSON.stringify(next)); } catch {}
  }, [overrides, companyKey, companyOverrides]);

  // Selected category deep-dive
  const selectedCat = scope3Data.find(c => c.id === selectedCatId);

  // Export handlers
  function handleExportCategoryCSV() {
    downloadCSV(`scope3_categories_${(selectedCompany?.company_name || 'company').replace(/\s+/g, '_')}.csv`,
      scope3Data.map(c => ({ Category_ID: c.id, Category: c.name, Upstream: c.upstream ? 'Yes' : 'No', Estimated_Mt: c.estimated_mt, Estimated_tCO2e: c.estimated_tco2e, Confidence: c.confidence, Method: c.method, Pct_of_Total: c.pct_of_total }))
    );
  }
  function handleExportPortfolioCSV() {
    downloadCSV('portfolio_scope3_aggregation.csv',
      portfolioS3.map(p => ({ Company: p.name, Sector: p.sector, Weight_Pct: fmt(p.weight, 2), Total_S3_Mt: fmt(p.totalS3, 4), Attributed_S3_Mt: fmt(p.attributed, 4), Scope1_Mt: fmt(p.scope1, 4), Scope2_Mt: fmt(p.scope2, 4) }))
    );
  }

  // Styles
  const btnStyle = (active) => ({
    padding: '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`,
    background: active ? T.navy : T.surface, color: active ? '#fff' : T.text,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: T.font,
  });
  const pillStyle = (active) => ({
    padding: '5px 14px', borderRadius: 20, border: `1px solid ${active ? T.navy : T.border}`,
    background: active ? T.navy : T.surface, color: active ? '#fff' : T.textSec,
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  });
  const cardStyle = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28 };
  const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface, zIndex: 1 };
  const tdStyle = { padding: '10px 14px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '32px 40px', color: T.text }}>
      {/* ── Section 1: Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: T.navy, letterSpacing: '-0.02em' }}>Scope 3 Estimation Engine</h1>
            <Badge text="GHG Protocol" color={T.sage} />
            <Badge text="15 Categories" color={T.navyL} />
            <Badge text="Spend-based" color={T.gold} />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: T.textSec, maxWidth: 600 }}>
            Full-spectrum Scope 3 emissions estimation across all 15 GHG Protocol categories using sector-specific emission factors from DEFRA/EPA databases.
          </p>
          {isDemo && <Badge text="DEMO DATA" color={T.amber} />}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportCategoryCSV} style={btnStyle(false)}>Export Categories CSV</button>
          <button onClick={handleExportPortfolioCSV} style={btnStyle(false)}>Export Portfolio S3 CSV</button>
          <button onClick={() => window.print()} style={btnStyle(false)}>Print / PDF</button>
        </div>
      </div>

      {/* ── Section 2: Company Selector + Methodology Toggle ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Portfolio selector */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Company (Portfolio)</label>
            <select value={selectedIdx} onChange={e => setSelectedIdx(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, color: T.text, background: T.surface }}>
              {holdings.map((h, i) => (
                <option key={i} value={i}>{h.company.company_name} ({h.company.sector})</option>
              ))}
            </select>
          </div>
          {/* Universe search */}
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Search Universe</label>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or ISIN..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, color: T.text, background: T.surface, boxSizing: 'border-box' }} />
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, maxHeight: 220, overflowY: 'auto', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                {searchResults.map((c, i) => (
                  <div key={i} onClick={() => {
                    const idx = holdings.findIndex(h => h.company.isin === c.isin);
                    if (idx >= 0) { setSelectedIdx(idx); }
                    setSearchTerm('');
                  }}
                    style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', borderBottom: `1px solid ${T.border}`, color: T.text }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                    onMouseLeave={e => e.currentTarget.style.background = T.surface}>
                    {c.company_name} <span style={{ color: T.textMut }}>({c.sector})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Category filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Category Filter</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'upstream', 'downstream'].map(f => (
                <button key={f} onClick={() => setCatFilter(f)} style={pillStyle(catFilter === f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>
          {/* Methodology toggle */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Methodology</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['spend', 'activity', 'hybrid'].map(m => (
                <button key={m} onClick={() => setMethodToggle(m)} style={pillStyle(methodToggle === m)}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>
              ))}
            </div>
          </div>
          {/* Confidence filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Confidence</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', ...CONF_ORDER].map(cf => (
                <button key={cf} onClick={() => setConfFilter(cf)} style={pillStyle(confFilter === cf)}>{cf}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: 8 KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <KpiCard icon="\uD83C\uDF0D" label="Total Scope 3" value={`${fmt(totalS3, 3)} Mt`} sub="All 15 categories" />
        <KpiCard icon="\u2696\uFE0F" label="S3 / S1+S2 Ratio" value={`${fmt(s3Ratio, 1)}x`} valueColor={s3Ratio > 5 ? T.red : s3Ratio > 2 ? T.amber : T.navy} sub={`S1: ${fmt(s1,2)} Mt, S2: ${fmt(s2,2)} Mt`} />
        <KpiCard icon="\uD83D\uDCCA" label="Largest Category" value={largestCat ? `Cat ${largestCat.id}` : '\u2014'} sub={largestCat ? `${largestCat.name} (${fmt(largestCat.pct_of_total,1)}%)` : ''} />
        <KpiCard icon="\u2705" label="Categories with Data" value={`${catsWithData} / 15`} sub={`${15 - catsWithData} categories at zero`} />
        <KpiCard icon="\u2B06\uFE0F" label="Upstream Total" value={`${fmt(upstreamTotal, 3)} Mt`} valueColor={T.navyL} sub="Categories 1-8" />
        <KpiCard icon="\u2B07\uFE0F" label="Downstream Total" value={`${fmt(downstreamTotal, 3)} Mt`} valueColor={T.gold} sub="Categories 9-15" />
        <KpiCard icon="\uD83C\uDFED" label="S3 Intensity" value={fmtK(s3Intensity)} sub="tCO2e per USD Mn revenue" />
        <KpiCard icon="\uD83D\uDD12" label="Data Confidence" value={`${fmt(confWeighted, 0)}%`} valueColor={confWeighted >= 60 ? T.green : confWeighted >= 40 ? T.amber : T.red} sub="Weighted avg across categories" />
      </div>

      {/* ── Section 4: Category Waterfall BarChart ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Scope 3 Category Waterfall" sub={`${filteredCats.length} categories shown, sorted by estimated emissions`} />
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={waterfallData} margin={{ top: 8, right: 20, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10, fill: T.textSec }} interval={0} height={80} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Mt CO2e', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
            <Tooltip content={<CatTooltip />} />
            <Bar dataKey="estimated_mt" radius={[4, 4, 0, 0]}>
              {waterfallData.map((c, i) => (
                <Cell key={i} fill={c.upstream ? T.navyL : T.gold} cursor="pointer" onClick={() => setSelectedCatId(c.id)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 14, height: 14, borderRadius: 3, background: T.navyL }} /><span style={{ fontSize: 12, color: T.textSec }}>Upstream (Cat 1-8)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 14, height: 14, borderRadius: 3, background: T.gold }} /><span style={{ fontSize: 12, color: T.textSec }}>Downstream (Cat 9-15)</span></div>
        </div>
      </div>

      {/* ── Section 5: Upstream vs Downstream PieChart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={cardStyle}>
          <SectionHeader title="Upstream vs Downstream Split" sub="Share of total Scope 3 emissions" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={3}
                label={({ name, value }) => `${name}: ${fmt(value, 3)} Mt`} labelLine={{ stroke: T.textMut }}>
                {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={v => `${fmt(v, 3)} Mt`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ── Section 8: Scope 1+2+3 Comparison ── */}
        <div style={cardStyle}>
          <SectionHeader title="Scope 1 + 2 + 3 Comparison" sub="Total emissions breakdown by scope" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scopeCompare} margin={{ top: 8, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Mt CO2e', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
              <Tooltip formatter={v => `${fmt(v, 4)} Mt`} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {scopeCompare.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 6: Category Details Table (sortable) ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Category Details" sub="All 15 GHG Protocol Scope 3 categories with estimation details" />
        <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font }}>
            <thead>
              <tr>
                <th style={thStyle}>Cat#</th>
                <th style={thStyle}>Category Name</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Est. Mt CO2e</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Est. tCO2e</th>
                <th style={thStyle}>Confidence</th>
                <th style={thStyle}>Method</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>% of Total</th>
                <th style={thStyle}>Stream</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Override (Mt)</th>
              </tr>
            </thead>
            <tbody>
              {filteredCats.map(c => (
                <tr key={c.id} onClick={() => setSelectedCatId(c.id)}
                  style={{ cursor: 'pointer', background: selectedCatId === c.id ? T.surfaceH : 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (selectedCatId !== c.id) e.currentTarget.style.background = T.surfaceH; }}
                  onMouseLeave={e => { if (selectedCatId !== c.id) e.currentTarget.style.background = 'transparent'; }}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{c.id}</td>
                  <td style={tdStyle}>{c.name}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.estimated_mt, 4)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtK(c.estimated_tco2e)}</td>
                  <td style={tdStyle}><Badge text={c.confidence} color={CONF_COLORS[c.confidence]} /></td>
                  <td style={tdStyle}><span style={{ fontSize: 11, color: T.textSec }}>{c.method}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(c.pct_of_total, 1)}%</td>
                  <td style={tdStyle}><span style={{ fontSize: 11, color: c.upstream ? T.navyL : T.gold, fontWeight: 600 }}>{c.upstream ? 'Upstream' : 'Downstream'}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <input type="number" step="0.001" placeholder="\u2014"
                      value={companyOverrides[c.id] ?? ''}
                      onChange={e => saveOverride(c.id, e.target.value)}
                      style={{ width: 80, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, textAlign: 'right', color: T.text, background: T.surfaceH }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 7: Category Deep-Dive Panel ── */}
      {selectedCat && (
        <div style={{ ...cardStyle, marginBottom: 24, borderLeft: `4px solid ${selectedCat.upstream ? T.navyL : T.gold}` }}>
          <SectionHeader title={`Deep Dive: Category ${selectedCat.id} \u2014 ${selectedCat.name}`}
            rightContent={<button onClick={() => setSelectedCatId(null)} style={{ ...btnStyle(false), fontSize: 12, padding: '4px 12px' }}>Close</button>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', marginBottom: 4 }}>Calculation Methodology</div>
              <div style={{ fontSize: 13, color: T.text }}>{selectedCat.method}-based estimation using sector-specific emission factors from DEFRA/EPA reference databases. {selectedCat.factor_description}.</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', marginBottom: 4 }}>Emission Factor Used</div>
              <div style={{ fontSize: 13, color: T.text }}>
                Sector: {selectedCompany?.sector || 'N/A'}<br />
                Factor: {selectedCat.factor_description}<br />
                Source: {selectedCat.method === 'spend-based' ? 'DEFRA 2023 / EPA EEIO' : selectedCat.method === 'energy-based' ? 'IEA / EPA eGRID' : 'GHG Protocol guidance'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', marginBottom: 4 }}>Input Data</div>
              <div style={{ fontSize: 13, color: T.text }}>
                Revenue: {fmt(selectedCompany?.revenue_usd_mn, 0)} USD Mn<br />
                Scope 1: {fmt(s1, 2)} Mt | Scope 2: {fmt(s2, 2)} Mt<br />
                Employees: {fmtK(selectedCompany?.employees || (selectedCompany?.revenue_usd_mn || 0) * 2)}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <div style={{ padding: '12px 16px', background: T.surfaceH, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600 }}>Estimated Emissions</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>{fmt(selectedCat.estimated_mt, 4)} Mt</div>
            </div>
            <div style={{ padding: '12px 16px', background: T.surfaceH, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600 }}>Confidence Level</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: CONF_COLORS[selectedCat.confidence] }}>{selectedCat.confidence}</div>
            </div>
            <div style={{ padding: '12px 16px', background: T.surfaceH, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600 }}>Share of Total</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>{fmt(selectedCat.pct_of_total, 1)}%</div>
            </div>
            <div style={{ padding: '12px 16px', background: T.surfaceH, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600 }}>Confidence Rationale</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
                {selectedCat.confidence === 'High' ? 'Based on direct energy data or reported figures with sector cross-validation.' :
                 selectedCat.confidence === 'Medium' ? 'Estimated using spend-based factors; moderate proxy assumptions.' :
                 selectedCat.confidence === 'Reported' ? 'Actual reported data from company disclosures.' :
                 'Low data availability; rough sector-level proxy with high uncertainty.'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textMut }}>Manual Override (Mt):</span>
            <input type="number" step="0.001" value={companyOverrides[selectedCat.id] ?? ''} onChange={e => saveOverride(selectedCat.id, e.target.value)}
              style={{ width: 120, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.text }} />
            {companyOverrides[selectedCat.id] != null && companyOverrides[selectedCat.id] !== '' && (
              <button onClick={() => saveOverride(selectedCat.id, '')} style={{ ...btnStyle(false), fontSize: 11, padding: '4px 10px' }}>Clear Override</button>
            )}
          </div>
        </div>
      )}

      {/* ── Section 9: Sector Comparison ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Sector Comparison" sub={`${selectedCompany?.company_name || 'Company'} vs ${selectedCompany?.sector || 'Sector'} median (top 5 categories)`} />
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={sectorCompareData} margin={{ top: 8, right: 20, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Mt CO2e', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
            <Tooltip formatter={(v, n) => [`${fmt(v, 4)} Mt`, n === 'company' ? selectedCompany?.company_name : 'Sector Median']}
              contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
            <Legend />
            <Bar dataKey="company" fill={T.navy} radius={[4, 4, 0, 0]} name={selectedCompany?.company_name || 'Company'} />
            <Bar dataKey="sectorAvg" fill={T.goldL} radius={[4, 4, 0, 0]} name="Sector Median" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Section 10: Portfolio Scope 3 Aggregation ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Portfolio Scope 3 Aggregation (PCAF Attribution)"
          sub={`Total attributed Scope 3: ${fmt(totalPortfolioS3, 3)} Mt CO2e across ${holdings.length} holdings`} />
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={portfolioS3.slice(0, 15)} margin={{ top: 8, right: 20, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10, fill: T.textSec }} interval={0} height={80} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Attributed Mt CO2e', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
            <Tooltip formatter={v => `${fmt(v, 4)} Mt`} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
            <Bar dataKey="attributed" fill={T.sage} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {/* Portfolio table */}
        <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font }}>
            <thead>
              <tr>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Sector</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Weight %</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total S3 (Mt)</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Attributed (Mt)</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>S1 (Mt)</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>S2 (Mt)</th>
              </tr>
            </thead>
            <tbody>
              {portfolioS3.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                  <td style={tdStyle}><span style={{ fontSize: 11, color: T.textSec }}>{p.sector}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.weight, 2)}%</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.totalS3, 4)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.attributed, 4)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.scope1, 4)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.scope2, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 11: Category Heatmap ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Category Heatmap" sub={`Top ${holdings.slice(0,15).length} holdings x Top 5 Scope 3 categories`} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font }}>
            <thead>
              <tr>
                <th style={thStyle}>Company</th>
                {top5CatIds.map(cid => {
                  const cat = SCOPE3_CATEGORIES.find(c => c.id === cid);
                  return <th key={cid} style={{ ...thStyle, textAlign: 'center', minWidth: 100 }}>Cat {cid}<br/><span style={{ fontWeight: 400, fontSize: 9 }}>{cat ? cat.name.substring(0, 20) : ''}</span></th>;
                })}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row, ri) => (
                <tr key={ri}>
                  <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{row.name}</td>
                  {top5CatIds.map(cid => {
                    const val = row[`cat${cid}`] || 0;
                    const maxVal = Math.max(...heatmapData.map(r => r[`cat${cid}`] || 0), 0.001);
                    const intensity = Math.min(val / maxVal, 1);
                    const bg = intensity > 0.7 ? '#dc262630' : intensity > 0.4 ? '#d9770630' : intensity > 0.1 ? '#16a34a20' : T.surfaceH;
                    return (
                      <td key={cid} style={{ ...tdStyle, textAlign: 'center', background: bg, fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                        {fmt(val, 4)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 12: Methodology Notes ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Methodology Notes" sub="GHG Protocol Scope 3 Standard reference" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Estimation Framework</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
              Scope 3 emissions are estimated using the GHG Protocol Corporate Value Chain (Scope 3) Accounting and Reporting Standard.
              Three primary methodologies are available: Spend-based (using economic input-output emission factors), Activity-based
              (using physical activity data), and Hybrid (combining both approaches). The spend-based approach is used as the default
              where company-specific activity data is unavailable.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Emission Factor Sources</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
              Sector-specific emission factors are sourced from: DEFRA UK Government GHG Conversion Factors (2023), US EPA Emission
              Factor Hub, IEA World Energy Outlook emission intensities, PCAF Financed Emissions Standard for Category 15 (Investments).
              Factors are expressed in tCO2e per USD million of revenue or per unit of activity.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Limitations & Caveats</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
              Spend-based estimates carry inherent uncertainty (typically +/-30-50%). Category materiality varies significantly by
              sector. Energy/Utilities are dominated by Cat 11 (Use of Sold Products), while Financials are dominated by Cat 15
              (Investments). Manual overrides with reported data should be used where available to improve accuracy.
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 13: Manual Override Panel ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Manual Override Panel" sub="Enter actual reported data for individual categories (saved to localStorage)" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {SCOPE3_CATEGORIES.map(cat => {
            const hasOverride = companyOverrides[cat.id] != null && companyOverrides[cat.id] !== '';
            return (
              <div key={cat.id} style={{ padding: '10px 14px', background: hasOverride ? '#6366f118' : T.surfaceH, border: `1px solid ${hasOverride ? '#6366f140' : T.border}`, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMut, marginBottom: 4 }}>Cat {cat.id}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6, height: 30, overflow: 'hidden' }}>{cat.name}</div>
                <input type="number" step="0.001" placeholder="Mt CO2e"
                  value={companyOverrides[cat.id] ?? ''}
                  onChange={e => saveOverride(cat.id, e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, textAlign: 'right', color: T.text, background: T.surface, boxSizing: 'border-box' }} />
                {hasOverride && (
                  <button onClick={() => saveOverride(cat.id, '')}
                    style={{ marginTop: 4, fontSize: 10, color: T.red, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>Clear</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 14: Cross-Navigation ── */}
      <div style={{ ...cardStyle }}>
        <SectionHeader title="Cross-Module Navigation" sub="Related analytics modules" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/supply-chain-map')} style={btnStyle(false)}>Supply Chain ESG Mapping &rarr;</button>
          <button onClick={() => navigate('/carbon-budget')} style={btnStyle(false)}>Carbon Budget Analysis &rarr;</button>
          <button onClick={() => navigate('/scenario-stress-test')} style={btnStyle(false)}>Scenario Stress Test &rarr;</button>
          <button onClick={() => navigate('/controversy-monitor')} style={btnStyle(false)}>Controversy Monitor &rarr;</button>
          <button onClick={() => navigate('/stranded-assets')} style={btnStyle(false)}>Stranded Assets &rarr;</button>
        </div>
      </div>
    </div>
  );
}
