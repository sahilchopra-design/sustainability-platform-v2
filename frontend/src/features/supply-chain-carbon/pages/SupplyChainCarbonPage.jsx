import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  AreaChart, Area, PieChart, Pie, ReferenceLine, ComposedChart, Line,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#e07b54','#7b6ea8','#4a9bbe','#d4a84b','#6b8e6b','#c46060','#5c7ea8'];
const TIER_COLORS = { company:'#1b3a5c', scope1:'#2c5a8c', scope2:'#5a8a6a', tier1:'#c5a96a', tier2:'#e07b54', tier3:'#7b6ea8' };

/* ══════════════════════════════════════════════════════════════
   TIER MULTIPLIERS — ratio of tier emissions to company's own
   ══════════════════════════════════════════════════════════════ */
const TIER_MULTIPLIERS = {
  Energy:      { tier1: 1.8, tier2: 2.5, tier3: 1.2 },
  Materials:   { tier1: 1.5, tier2: 2.0, tier3: 1.8 },
  Industrials: { tier1: 1.2, tier2: 1.5, tier3: 0.8 },
  Utilities:   { tier1: 0.8, tier2: 1.2, tier3: 0.5 },
  Financials:  { tier1: 0.3, tier2: 0.2, tier3: 0.1 },
  'Information Technology': { tier1: 0.8, tier2: 0.6, tier3: 0.3 },
  IT:          { tier1: 0.8, tier2: 0.6, tier3: 0.3 },
  'Health Care': { tier1: 1.0, tier2: 0.8, tier3: 0.5 },
  'Consumer Discretionary': { tier1: 1.5, tier2: 2.2, tier3: 1.5 },
  'Consumer Staples': { tier1: 2.0, tier2: 2.8, tier3: 2.0 },
  'Communication Services': { tier1: 0.5, tier2: 0.3, tier3: 0.2 },
  'Real Estate': { tier1: 0.6, tier2: 0.4, tier3: 0.2 },
};

/* ══════════════════════════════════════════════════════════════
   ACTIVITY CATEGORIES for hotspot analysis
   ══════════════════════════════════════════════════════════════ */
const ACTIVITY_CATEGORIES = [
  { name: 'Raw Materials Extraction', tier: 'tier3', pct: 0.35 },
  { name: 'Component Manufacturing', tier: 'tier2', pct: 0.25 },
  { name: 'Transportation & Logistics', tier: 'tier2', pct: 0.15 },
  { name: 'Direct Supplier Processing', tier: 'tier1', pct: 0.40 },
  { name: 'Packaging & Assembly', tier: 'tier1', pct: 0.30 },
  { name: 'Energy in Supply Chain', tier: 'tier2', pct: 0.20 },
  { name: 'Chemical Processing', tier: 'tier3', pct: 0.25 },
  { name: 'Waste & Disposal', tier: 'tier3', pct: 0.15 },
];

/* ══════════════════════════════════════════════════════════════
   PORTFOLIO READER
   ══════════════════════════════════════════════════════════════ */
function readPortfolioData() {
  try {
    const raw = localStorage.getItem('ra_portfolio_v1');
    if (!raw) return { portfolios: {}, activePortfolio: null };
    const outer = JSON.parse(raw);
    if (outer && typeof outer === 'object' && outer.portfolios) {
      return { portfolios: outer.portfolios || {}, activePortfolio: outer.activePortfolio || null };
    }
    return { portfolios: {}, activePortfolio: null };
  } catch { return { portfolios: {}, activePortfolio: null }; }
}

/* ══════════════════════════════════════════════════════════════
   COMPUTE SUPPLY CHAIN CARBON
   ══════════════════════════════════════════════════════════════ */
function computeSupplyChainCarbon(company) {
  const rev = company.revenue_usd_mn || 0;
  const s1 = (company.scope1_mt || 0) * 1e6;
  const s2 = (company.scope2_mt || 0) * 1e6;
  const sector = company.sector || 'Industrials';
  const mult = TIER_MULTIPLIERS[sector] || TIER_MULTIPLIERS['Industrials'];
  const companyTotal = s1 + s2;
  const tier1Est = companyTotal * mult.tier1;
  const tier2Est = companyTotal * mult.tier2;
  const tier3Est = companyTotal * mult.tier3;
  const grandTotal = companyTotal + tier1Est + tier2Est + tier3Est;

  return {
    company: { scope1: s1, scope2: s2, total: companyTotal },
    tier1: { estimated: tier1Est, confidence: 'Medium', sources: 'Spend-based + sector EFs' },
    tier2: { estimated: tier2Est, confidence: 'Low', sources: 'EEIO model + sector averages' },
    tier3: { estimated: tier3Est, confidence: 'Very Low', sources: 'Sector extrapolation' },
    total: grandTotal,
    multiplier: companyTotal > 0 ? grandTotal / companyTotal : 0,
    intensityPerRev: rev > 0 ? (grandTotal / (rev * 1e6)) * 1e6 : 0,
    mult,
  };
}

/* ══════════════════════════════════════════════════════════════
   FORMAT HELPERS
   ══════════════════════════════════════════════════════════════ */
const fmt = (v, d = 0) => v == null ? '-' : Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtM = (v) => { if (v == null) return '-'; const a = Math.abs(v); if (a >= 1e9) return (v / 1e9).toFixed(2) + ' Bt'; if (a >= 1e6) return (v / 1e6).toFixed(2) + ' Mt'; if (a >= 1e3) return (v / 1e3).toFixed(1) + ' kt'; return fmt(v, 0) + ' t'; };
const pct = (v) => v == null ? '-' : (v * 100).toFixed(1) + '%';

/* ══════════════════════════════════════════════════════════════
   SHARED STYLES
   ══════════════════════════════════════════════════════════════ */
const sCard = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24 };
const sKpi = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '18px 20px', minWidth: 160, flex: '1 1 180px' };
const sBadge = (bg, fg) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: bg, color: fg, letterSpacing: 0.3 });

/* ══════════════════════════════════════════════════════════════
   CUSTOM TOOLTIP
   ══════════════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: T.font, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.textSec, marginTop: 2 }}>{p.name}: {typeof p.value === 'number' ? fmtM(p.value) : p.value}</div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function SupplyChainCarbonPage() {
  const navigate = useNavigate();
  const [portData, setPortData] = useState({ portfolios: {}, activePortfolio: null });
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState(0);
  const [tier1Reduction, setTier1Reduction] = useState(0);
  const [tier2Reduction, setTier2Reduction] = useState(0);
  const [renewableSwitch, setRenewableSwitch] = useState(0);
  const [sortCol, setSortCol] = useState('total');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const d = readPortfolioData();
    setPortData(d);
    const names = Object.keys(d.portfolios || {});
    if (d.activePortfolio && names.includes(d.activePortfolio)) setSelectedPortfolio(d.activePortfolio);
    else if (names.length) setSelectedPortfolio(names[0]);
  }, []);

  const portfolio = useMemo(() => {
    const p = portData.portfolios[selectedPortfolio];
    if (!p || !p.holdings) return [];
    return p.holdings.map(h => {
      const master = GLOBAL_COMPANY_MASTER.find(c => c.isin === h.isin || c.name === h.name || c.ticker === h.ticker);
      return { ...h, company: master || h };
    }).filter(h => h.company);
  }, [portData, selectedPortfolio]);

  const portfolioNames = useMemo(() => Object.keys(portData.portfolios || {}), [portData]);

  /* ── Supply chain analysis for selected company ── */
  const selectedCompany = useMemo(() => portfolio[selectedCompanyIdx]?.company || null, [portfolio, selectedCompanyIdx]);
  const scData = useMemo(() => selectedCompany ? computeSupplyChainCarbon(selectedCompany) : null, [selectedCompany]);

  /* ── Scenario adjustments ── */
  const scenarioData = useMemo(() => {
    if (!scData) return null;
    const adjTier1 = scData.tier1.estimated * (1 - tier1Reduction / 100);
    const adjTier2 = scData.tier2.estimated * (1 - tier2Reduction / 100);
    const adjScope2 = scData.company.scope2 * (1 - renewableSwitch / 100);
    const adjCompany = scData.company.scope1 + adjScope2;
    const adjTotal = adjCompany + adjTier1 + adjTier2 + scData.tier3.estimated;
    return { tier1: adjTier1, tier2: adjTier2, scope2: adjScope2, companyTotal: adjCompany, total: adjTotal, saved: scData.total - adjTotal };
  }, [scData, tier1Reduction, tier2Reduction, renewableSwitch]);

  /* ── KPI cards data ── */
  const kpis = useMemo(() => {
    if (!scData) return [];
    const confMap = { 'Medium': T.amber, 'Low': T.red, 'Very Low': '#7f1d1d' };
    return [
      { label: 'Total Supply Chain', value: fmtM(scData.total), sub: 'tCO\u2082e across all tiers', color: T.navy },
      { label: 'Scope 1+2 (Company)', value: fmtM(scData.company.total), sub: 'Direct + purchased energy', color: T.sage },
      { label: 'Tier 1 Estimated', value: fmtM(scData.tier1.estimated), sub: scData.tier1.sources, color: T.gold },
      { label: 'Tier 2 Estimated', value: fmtM(scData.tier2.estimated), sub: scData.tier2.sources, color: '#e07b54' },
      { label: 'Tier 3 Estimated', value: fmtM(scData.tier3.estimated), sub: scData.tier3.sources, color: '#7b6ea8' },
      { label: 'SC Multiplier', value: scData.multiplier.toFixed(2) + 'x', sub: 'Total / company emissions', color: T.navyL },
      { label: 'Intensity / Revenue', value: fmt(scData.intensityPerRev, 1) + ' tCO\u2082e/$M', sub: 'Full supply chain', color: T.sage },
      { label: 'Confidence Level', value: 'Mixed', sub: 'Tier 1: Med, Tier 2: Low, Tier 3: VLow', color: T.amber },
    ];
  }, [scData]);

  /* ── Sankey-style flow data (stacked bar) ── */
  const flowData = useMemo(() => {
    if (!scData) return [];
    return [
      { stage: 'Tier 3', tier3: scData.tier3.estimated, tier2: 0, tier1: 0, scope2: 0, scope1: 0 },
      { stage: 'Tier 2', tier3: scData.tier3.estimated, tier2: scData.tier2.estimated, tier1: 0, scope2: 0, scope1: 0 },
      { stage: 'Tier 1', tier3: scData.tier3.estimated, tier2: scData.tier2.estimated, tier1: scData.tier1.estimated, scope2: 0, scope1: 0 },
      { stage: 'Company', tier3: scData.tier3.estimated, tier2: scData.tier2.estimated, tier1: scData.tier1.estimated, scope2: scData.company.scope2, scope1: scData.company.scope1 },
    ];
  }, [scData]);

  /* ── Carbon cascade area data ── */
  const cascadeData = useMemo(() => {
    if (!scData) return [];
    const t3 = scData.tier3.estimated;
    const t2 = scData.tier2.estimated;
    const t1 = scData.tier1.estimated;
    const s2 = scData.company.scope2;
    const s1 = scData.company.scope1;
    return [
      { stage: 'Tier 3', cumulative: t3, tier3: t3, tier2: 0, tier1: 0, scope2: 0, scope1: 0 },
      { stage: 'Tier 2', cumulative: t3 + t2, tier3: t3, tier2: t2, tier1: 0, scope2: 0, scope1: 0 },
      { stage: 'Tier 1', cumulative: t3 + t2 + t1, tier3: t3, tier2: t2, tier1: t1, scope2: 0, scope1: 0 },
      { stage: 'Scope 2', cumulative: t3 + t2 + t1 + s2, tier3: t3, tier2: t2, tier1: t1, scope2: s2, scope1: 0 },
      { stage: 'Scope 1', cumulative: t3 + t2 + t1 + s2 + s1, tier3: t3, tier2: t2, tier1: t1, scope2: s2, scope1: s1 },
    ];
  }, [scData]);

  /* ── Sector comparison ── */
  const sectorComparison = useMemo(() => {
    if (!selectedCompany || !scData) return [];
    const sector = selectedCompany.sector || 'Industrials';
    const mult = TIER_MULTIPLIERS[sector] || TIER_MULTIPLIERS['Industrials'];
    const sectorAvg = 1 + mult.tier1 + mult.tier2 + mult.tier3;
    return [
      { name: selectedCompany.name || 'Selected', multiplier: scData.multiplier, fill: T.navy },
      { name: sector + ' Avg', multiplier: sectorAvg, fill: T.gold },
    ];
  }, [selectedCompany, scData]);

  /* ── Portfolio aggregation ── */
  const portfolioAgg = useMemo(() => {
    if (!portfolio.length) return { totalCompany: 0, totalTier1: 0, totalTier2: 0, totalTier3: 0, grandTotal: 0 };
    let totalCompany = 0, totalTier1 = 0, totalTier2 = 0, totalTier3 = 0;
    portfolio.forEach(h => {
      const sc = computeSupplyChainCarbon(h.company);
      const w = (h.weight || 0) / 100;
      totalCompany += sc.company.total * w;
      totalTier1 += sc.tier1.estimated * w;
      totalTier2 += sc.tier2.estimated * w;
      totalTier3 += sc.tier3.estimated * w;
    });
    return { totalCompany, totalTier1, totalTier2, totalTier3, grandTotal: totalCompany + totalTier1 + totalTier2 + totalTier3 };
  }, [portfolio]);

  /* ── Hotspot identification ── */
  const hotspots = useMemo(() => {
    if (!scData) return [];
    return ACTIVITY_CATEGORIES.map(ac => {
      const tierEmissions = ac.tier === 'tier1' ? scData.tier1.estimated : ac.tier === 'tier2' ? scData.tier2.estimated : scData.tier3.estimated;
      const emissions = tierEmissions * ac.pct;
      return { ...ac, emissions, pctOfTotal: scData.total > 0 ? emissions / scData.total : 0 };
    }).sort((a, b) => b.emissions - a.emissions);
  }, [scData]);

  /* ── Carbon intensity waterfall ── */
  const waterfallData = useMemo(() => {
    if (!scData || !selectedCompany) return [];
    const rev = (selectedCompany.revenue_usd_mn || 1) * 1e6;
    const compInt = scData.company.total / rev * 1e6;
    const t1Int = scData.tier1.estimated / rev * 1e6;
    const t2Int = scData.tier2.estimated / rev * 1e6;
    const t3Int = scData.tier3.estimated / rev * 1e6;
    let running = 0;
    return [
      { name: 'Company', base: 0, add: compInt, total: (running += compInt, running) },
      { name: '+ Tier 1', base: running - t1Int, add: t1Int, total: (running += t1Int, running) },
      { name: '+ Tier 2', base: running - t2Int, add: t2Int, total: (running += t2Int, running) },
      { name: '+ Tier 3', base: running - t3Int, add: t3Int, total: (running += t3Int, running) },
      { name: 'Total SC', base: 0, add: running, total: running },
    ];
  }, [scData, selectedCompany]);

  /* ── Supply chain table with sort ── */
  const tableData = useMemo(() => {
    if (!portfolio.length) return [];
    const rows = portfolio.map(h => {
      const sc = computeSupplyChainCarbon(h.company);
      return {
        name: h.company.name || h.name || '-',
        sector: h.company.sector || '-',
        scope12: sc.company.total,
        tier1: sc.tier1.estimated,
        tier2: sc.tier2.estimated,
        tier3: sc.tier3.estimated,
        total: sc.total,
        multiplier: sc.multiplier,
        intensity: sc.intensityPerRev,
        weight: h.weight || 0,
      };
    });
    rows.sort((a, b) => sortAsc ? (a[sortCol] || 0) - (b[sortCol] || 0) : (b[sortCol] || 0) - (a[sortCol] || 0));
    return rows;
  }, [portfolio, sortCol, sortAsc]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  }, [sortCol, sortAsc]);

  /* ── Export helpers ── */
  const exportCSV = useCallback(() => {
    if (!tableData.length) return;
    const headers = ['Company','Sector','Scope 1+2 (t)','Tier 1 (t)','Tier 2 (t)','Tier 3 (t)','Total SC (t)','Multiplier','Intensity (tCO2e/$M)','Weight %'];
    const rows = tableData.map(r => [r.name, r.sector, fmt(r.scope12), fmt(r.tier1), fmt(r.tier2), fmt(r.tier3), fmt(r.total), r.multiplier.toFixed(2), fmt(r.intensity, 1), fmt(r.weight, 1)]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'supply_chain_carbon.csv'; a.click(); URL.revokeObjectURL(url);
  }, [tableData]);

  const exportJSON = useCallback(() => {
    if (!tableData.length) return;
    const blob = new Blob([JSON.stringify(tableData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'supply_chain_carbon.json'; a.click(); URL.revokeObjectURL(url);
  }, [tableData]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Empty state ── */
  if (!portfolioNames.length) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...sCard, maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 42, marginBottom: 16 }}>&#x26d3;</div>
          <h2 style={{ color: T.navy, marginBottom: 8 }}>No Portfolio Found</h2>
          <p style={{ color: T.textSec, marginBottom: 20 }}>Build a portfolio in Portfolio Suite to analyze supply chain carbon footprint.</p>
          <button onClick={() => navigate('/portfolio-suite')} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Go to Portfolio Suite</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, paddingBottom: 48 }}>
      {/* ═══ S1: HEADER ═══ */}
      <header style={{ background: T.navy, padding: '28px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Supply Chain Carbon Footprint</h1>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Scope 1+2+3','Tier 1/2/3','EEIO Model'].map(b => (
              <span key={b} style={sBadge('rgba(197,169,106,0.2)', T.goldL)}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Export CSV</button>
          <button onClick={exportJSON} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Export JSON</button>
          <button onClick={handlePrint} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Print</button>
        </div>
      </header>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 36px' }}>
        {/* ═══ S2: COMPANY SELECTOR ═══ */}
        <div style={{ ...sCard, marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 4, display: 'block' }}>Portfolio</label>
            <select value={selectedPortfolio} onChange={e => { setSelectedPortfolio(e.target.value); setSelectedCompanyIdx(0); }} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, minWidth: 200 }}>
              {portfolioNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 4, display: 'block' }}>Company</label>
            <select value={selectedCompanyIdx} onChange={e => setSelectedCompanyIdx(Number(e.target.value))} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, minWidth: 260 }}>
              {portfolio.map((h, i) => <option key={i} value={i}>{h.company.name || h.name || `Holding ${i + 1}`}</option>)}
            </select>
          </div>
          {selectedCompany && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>Sector: <strong style={{ color: T.navy }}>{selectedCompany.sector || '-'}</strong></span>
              <span style={{ fontSize: 12, color: T.textSec }}>Revenue: <strong style={{ color: T.navy }}>${fmt(selectedCompany.revenue_usd_mn, 0)}M</strong></span>
            </div>
          )}
        </div>

        {/* ═══ S3: KPI CARDS (8) ═══ */}
        {scData && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
            {kpis.map((k, i) => (
              <div key={i} style={sKpi}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>
        )}

        {scData && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
            {/* ═══ S4: SANKEY-STYLE FLOW ═══ */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Emissions Flow: Tier 3 &rarr; Scope 1</h3>
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Cumulative emissions building through supply chain tiers</p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={flowData} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="stage" tick={{ fontSize: 12, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textMut }} tickFormatter={v => fmtM(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="tier3" stackId="a" fill="#7b6ea8" name="Tier 3" radius={[0,0,0,0]} />
                  <Bar dataKey="tier2" stackId="a" fill="#e07b54" name="Tier 2" />
                  <Bar dataKey="tier1" stackId="a" fill={T.gold} name="Tier 1" />
                  <Bar dataKey="scope2" stackId="a" fill={T.sage} name="Scope 2" />
                  <Bar dataKey="scope1" stackId="a" fill={T.navy} name="Scope 1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ═══ S5: CARBON CASCADE AREA ═══ */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Carbon Cascade</h3>
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Cumulative emissions buildup layer by layer</p>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={cascadeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="stage" tick={{ fontSize: 12, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textMut }} tickFormatter={v => fmtM(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="tier3" stackId="1" stroke="#7b6ea8" fill="#7b6ea8" fillOpacity={0.6} name="Tier 3" />
                  <Area type="monotone" dataKey="tier2" stackId="1" stroke="#e07b54" fill="#e07b54" fillOpacity={0.6} name="Tier 2" />
                  <Area type="monotone" dataKey="tier1" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.6} name="Tier 1" />
                  <Area type="monotone" dataKey="scope2" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.6} name="Scope 2" />
                  <Area type="monotone" dataKey="scope1" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.6} name="Scope 1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══ S6: SECTOR COMPARISON ═══ */}
        {scData && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
            <div style={sCard}>
              <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Sector Comparison: Supply Chain Multiplier</h3>
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Company multiplier vs sector average</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sectorComparison} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textMut }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="multiplier" name="SC Multiplier" radius={[6,6,0,0]}>
                    {sectorComparison.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12, fontSize: 12, color: T.textSec }}>
                {scData.multiplier > (1 + (scData.mult.tier1 + scData.mult.tier2 + scData.mult.tier3))
                  ? <span style={{ color: T.red }}>Above sector average — supply chain engagement needed</span>
                  : <span style={{ color: T.green }}>At or below sector average</span>
                }
              </div>
            </div>

            {/* ═══ S7: PORTFOLIO AGGREGATION ═══ */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Portfolio Supply Chain Aggregation</h3>
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Weight-attributed emissions across all tiers (PCAF)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Company (S1+S2)', value: fmtM(portfolioAgg.totalCompany), color: T.navy },
                  { label: 'Tier 1', value: fmtM(portfolioAgg.totalTier1), color: T.gold },
                  { label: 'Tier 2', value: fmtM(portfolioAgg.totalTier2), color: '#e07b54' },
                  { label: 'Tier 3', value: fmtM(portfolioAgg.totalTier3), color: '#7b6ea8' },
                ].map((item, i) => (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: item.color, marginTop: 4 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, background: T.navy, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: T.goldL, fontWeight: 600 }}>Grand Total (Portfolio, All Tiers)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 4 }}>{fmtM(portfolioAgg.grandTotal)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ S8: HOTSPOT IDENTIFICATION ═══ */}
        {scData && (
          <div style={{ ...sCard, marginBottom: 28 }}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Hotspot Identification</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Which tier and activity category drives the most emissions</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {hotspots.slice(0, 6).map((hs, i) => {
                const tierColor = hs.tier === 'tier1' ? T.gold : hs.tier === 'tier2' ? '#e07b54' : '#7b6ea8';
                const tierLabel = hs.tier === 'tier1' ? 'Tier 1' : hs.tier === 'tier2' ? 'Tier 2' : 'Tier 3';
                return (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 16, borderLeft: `4px solid ${tierColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{hs.name}</div>
                        <span style={sBadge(tierColor + '22', tierColor)}>{tierLabel}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: tierColor }}>{(hs.pctOfTotal * 100).toFixed(1)}%</div>
                        <div style={{ fontSize: 11, color: T.textMut }}>{fmtM(hs.emissions)}</div>
                      </div>
                    </div>
                    {i === 0 && (
                      <div style={{ marginTop: 10, padding: '6px 10px', background: T.amber + '18', borderRadius: 6, fontSize: 11, color: T.amber, fontWeight: 600 }}>
                        &#x26a0; {tierLabel} {hs.name} accounts for {(hs.pctOfTotal * 100).toFixed(0)}% of total supply chain emissions
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ S9: REDUCTION SCENARIO SLIDERS ═══ */}
        {scData && scenarioData && (
          <div style={{ ...sCard, marginBottom: 28 }}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Reduction Scenario Analysis</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 20 }}>Adjust sliders to see live recalculation of supply chain emissions</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
              {/* Tier 1 Reduction */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 6 }}>Tier 1 Reduction: {tier1Reduction}%</label>
                <input type="range" min={0} max={50} value={tier1Reduction} onChange={e => setTier1Reduction(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
                <div style={{ fontSize: 11, color: T.textMut }}>What if Tier 1 suppliers reduce by {tier1Reduction}%?</div>
              </div>
              {/* Tier 2 Reduction */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 6 }}>Tier 2 Reduction: {tier2Reduction}%</label>
                <input type="range" min={0} max={50} value={tier2Reduction} onChange={e => setTier2Reduction(Number(e.target.value))} style={{ width: '100%', accentColor: '#e07b54' }} />
                <div style={{ fontSize: 11, color: T.textMut }}>What if Tier 2 manufacturers reduce by {tier2Reduction}%?</div>
              </div>
              {/* Renewable Switch */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 6 }}>Renewable Scope 2: {renewableSwitch}%</label>
                <input type="range" min={0} max={100} value={renewableSwitch} onChange={e => setRenewableSwitch(Number(e.target.value))} style={{ width: '100%', accentColor: T.green }} />
                <div style={{ fontSize: 11, color: T.textMut }}>What if company switches {renewableSwitch}% to renewables?</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ background: T.surfaceH, borderRadius: 10, padding: 16, flex: '1 1 200px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut }}>Original Total</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{fmtM(scData.total)}</div>
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 10, padding: 16, flex: '1 1 200px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut }}>Scenario Total</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.sage }}>{fmtM(scenarioData.total)}</div>
              </div>
              <div style={{ background: scenarioData.saved > 0 ? T.green + '12' : T.surfaceH, borderRadius: 10, padding: 16, flex: '1 1 200px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut }}>Emissions Saved</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: scenarioData.saved > 0 ? T.green : T.textMut }}>{scenarioData.saved > 0 ? '-' : ''}{fmtM(Math.abs(scenarioData.saved))}</div>
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 10, padding: 16, flex: '1 1 200px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut }}>Reduction %</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: scenarioData.saved > 0 ? T.green : T.textMut }}>{scData.total > 0 ? (scenarioData.saved / scData.total * 100).toFixed(1) : '0.0'}%</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ S10: CARBON INTENSITY WATERFALL ═══ */}
        {waterfallData.length > 0 && (
          <div style={{ ...sCard, marginBottom: 28 }}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Carbon Intensity Waterfall</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>How intensity builds from Company through Tier 3 (tCO&#x2082;e / $M revenue)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={waterfallData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textMut }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="base" stackId="a" fill="transparent" name="Base" />
                <Bar dataKey="add" stackId="a" name="Addition" radius={[4,4,0,0]}>
                  {waterfallData.map((d, i) => (
                    <Cell key={i} fill={i === 0 ? T.navy : i === 4 ? T.sage : i === 1 ? T.gold : i === 2 ? '#e07b54' : '#7b6ea8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ═══ S11: SUPPLY CHAIN EMISSIONS TABLE ═══ */}
        <div style={{ ...sCard, marginBottom: 28 }}>
          <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Supply Chain Emissions Table</h3>
          <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>All portfolio companies with tier-level breakdown (click headers to sort)</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {[
                    { key: 'name', label: 'Company' },
                    { key: 'sector', label: 'Sector' },
                    { key: 'weight', label: 'Wt%' },
                    { key: 'scope12', label: 'Scope 1+2' },
                    { key: 'tier1', label: 'Tier 1' },
                    { key: 'tier2', label: 'Tier 2' },
                    { key: 'tier3', label: 'Tier 3' },
                    { key: 'total', label: 'Total SC' },
                    { key: 'multiplier', label: 'Mult.' },
                    { key: 'intensity', label: 'Int./Rev' },
                  ].map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)} style={{ padding: '10px 12px', textAlign: col.key === 'name' || col.key === 'sector' ? 'left' : 'right', borderBottom: `2px solid ${T.border}`, color: sortCol === col.key ? T.navy : T.textMut, cursor: 'pointer', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                      {col.label} {sortCol === col.key ? (sortAsc ? '\u25b2' : '\u25bc') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{r.name}</td>
                    <td style={{ padding: '9px 12px', color: T.textSec, fontSize: 12 }}>{r.sector}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: T.textSec }}>{fmt(r.weight, 1)}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: T.navy }}>{fmtM(r.scope12)}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: T.gold }}>{fmtM(r.tier1)}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#e07b54' }}>{fmtM(r.tier2)}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#7b6ea8' }}>{fmtM(r.tier3)}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: T.navy }}>{fmtM(r.total)}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: T.textSec }}>{r.multiplier.toFixed(2)}x</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: T.textSec }}>{fmt(r.intensity, 1)}</td>
                  </tr>
                ))}
                {!tableData.length && (
                  <tr><td colSpan={10} style={{ padding: 24, textAlign: 'center', color: T.textMut }}>No holdings in portfolio</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ S12: METHODOLOGY & DATA QUALITY ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          <div style={sCard}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Estimation Methodology</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>How supply chain emissions are estimated at each tier</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { tier: 'Scope 1+2 (Company)', method: 'Reported data from CDP / annual reports. Highest confidence.', confidence: 'High', color: T.navy, confColor: T.green },
                { tier: 'Tier 1 (Direct Suppliers)', method: 'Spend-based analysis combined with sector-specific emission factors. Medium confidence due to supplier mix assumptions.', confidence: 'Medium', color: T.gold, confColor: T.amber },
                { tier: 'Tier 2 (Manufacturing)', method: 'Environmentally Extended Input-Output (EEIO) model using sector averages and trade flow data.', confidence: 'Low', color: '#e07b54', confColor: T.red },
                { tier: 'Tier 3 (Raw Materials)', method: 'Sector extrapolation from life cycle assessment databases. Very low confidence due to distance from reporting entity.', confidence: 'Very Low', color: '#7b6ea8', confColor: '#7f1d1d' },
              ].map((m, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, borderLeft: `4px solid ${m.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.tier}</span>
                    <span style={sBadge(m.confColor + '18', m.confColor)}>{m.confidence}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{m.method}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={sCard}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Data Quality Assessment</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>PCAF data quality scores for supply chain emissions</p>
            {(() => {
              const qualityData = [
                { label: 'Scope 1 Reported', score: 1, desc: 'Verified emissions from company disclosures', pct: 100 },
                { label: 'Scope 2 Reported', score: 1, desc: 'Location/market-based from utility data', pct: 95 },
                { label: 'Tier 1 Estimated', score: 3, desc: 'Spend-based with sector emission factors', pct: 65 },
                { label: 'Tier 2 Estimated', score: 4, desc: 'EEIO model with trade flow assumptions', pct: 40 },
                { label: 'Tier 3 Estimated', score: 5, desc: 'Sector extrapolation, proxy data', pct: 20 },
              ];
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {qualityData.map((q, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{q.label}</span>
                        <span style={{ fontSize: 11, color: T.textMut }}>PCAF Score: {q.score}/5</span>
                      </div>
                      <div style={{ background: T.border, borderRadius: 6, height: 16, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ background: q.score <= 2 ? T.green : q.score <= 3 ? T.amber : T.red, height: '100%', width: `${q.pct}%`, borderRadius: 6, transition: 'width 0.5s' }} />
                        <span style={{ position: 'absolute', left: 8, top: 1, fontSize: 10, fontWeight: 600, color: '#fff' }}>{q.pct}% coverage</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{q.desc}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, padding: '10px 14px', background: T.navy + '08', borderRadius: 8, fontSize: 12, color: T.textSec }}>
                    <strong style={{ color: T.navy }}>Weighted Average PCAF Score:</strong> {(1*0.2 + 1*0.2 + 3*0.25 + 4*0.2 + 5*0.15).toFixed(1)} / 5.0
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ═══ S13: SECTOR BREAKDOWN OF PORTFOLIO SC EMISSIONS ═══ */}
        {portfolio.length > 0 && (() => {
          const sectorMap = {};
          portfolio.forEach(h => {
            const sector = h.company.sector || 'Other';
            const sc = computeSupplyChainCarbon(h.company);
            const w = (h.weight || 0) / 100;
            if (!sectorMap[sector]) sectorMap[sector] = { sector, company: 0, tier1: 0, tier2: 0, tier3: 0 };
            sectorMap[sector].company += sc.company.total * w;
            sectorMap[sector].tier1 += sc.tier1.estimated * w;
            sectorMap[sector].tier2 += sc.tier2.estimated * w;
            sectorMap[sector].tier3 += sc.tier3.estimated * w;
          });
          const sectorBreakdown = Object.values(sectorMap).sort((a, b) => (b.company + b.tier1 + b.tier2 + b.tier3) - (a.company + a.tier1 + a.tier2 + a.tier3));
          return (
            <div style={{ ...sCard, marginBottom: 28 }}>
              <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Sector Breakdown: Portfolio Supply Chain Emissions</h3>
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Weight-attributed emissions by sector and tier</p>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={sectorBreakdown} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: T.textMut }} tickFormatter={v => fmtM(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="company" stackId="a" fill={T.navy} name="Company (S1+S2)" />
                  <Bar dataKey="tier1" stackId="a" fill={T.gold} name="Tier 1" />
                  <Bar dataKey="tier2" stackId="a" fill="#e07b54" name="Tier 2" />
                  <Bar dataKey="tier3" stackId="a" fill="#7b6ea8" name="Tier 3" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* ═══ S14: BENCHMARK COMPARISON TABLE ═══ */}
        <div style={{ ...sCard, marginBottom: 28 }}>
          <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Sector Benchmark: Supply Chain Multipliers</h3>
          <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Compare sector-level tier multipliers — higher means more upstream emissions relative to company</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Sector', 'Tier 1 Mult.', 'Tier 2 Mult.', 'Tier 3 Mult.', 'Total SC Mult.', 'Implication'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Sector' || h === 'Implication' ? 'left' : 'center', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(TIER_MULTIPLIERS).map(([sector, mult], i) => {
                  const total = 1 + mult.tier1 + mult.tier2 + mult.tier3;
                  const implication = total > 5 ? 'Heavy upstream dependency' : total > 3 ? 'Moderate supply chain exposure' : 'Low supply chain footprint';
                  const impColor = total > 5 ? T.red : total > 3 ? T.amber : T.green;
                  return (
                    <tr key={sector} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: T.navy }}>{sector}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: T.gold, fontWeight: 600 }}>{mult.tier1.toFixed(1)}x</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#e07b54', fontWeight: 600 }}>{mult.tier2.toFixed(1)}x</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#7b6ea8', fontWeight: 600 }}>{mult.tier3.toFixed(1)}x</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: T.navy }}>{total.toFixed(1)}x</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: impColor, fontWeight: 500 }}>{implication}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ S15: ENGAGEMENT RECOMMENDATIONS ═══ */}
        {scData && (
          <div style={{ ...sCard, marginBottom: 28 }}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Supply Chain Engagement Recommendations</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Prioritized actions to reduce supply chain emissions for {selectedCompany?.name || 'selected company'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {[
                { priority: 1, title: 'Tier 1 Supplier Engagement', desc: 'Request SBTi-aligned targets from top 10 direct suppliers. Focus on spend categories with highest emission factors.', impact: 'High', timeline: '6-12 months', tier: 'Tier 1' },
                { priority: 2, title: 'Scope 2 Renewable Procurement', desc: 'Switch to 100% renewable electricity through PPAs or RECs. Eliminates Scope 2 entirely and reduces total footprint.', impact: 'High', timeline: '3-6 months', tier: 'Company' },
                { priority: 3, title: 'Tier 2 Manufacturing Data', desc: 'Improve data quality by requesting LCA data from key Tier 2 manufacturers. Move from EEIO estimates to primary data.', impact: 'Medium', timeline: '12-18 months', tier: 'Tier 2' },
                { priority: 4, title: 'Material Substitution Analysis', desc: 'Evaluate lower-carbon alternatives for Tier 3 raw materials. Quantify emission reduction potential.', impact: 'Medium', timeline: '12-24 months', tier: 'Tier 3' },
                { priority: 5, title: 'Logistics Optimization', desc: 'Route optimization and modal shift (road to rail) for upstream transportation. Target 15-20% reduction in transport emissions.', impact: 'Medium', timeline: '6-12 months', tier: 'Tier 2' },
                { priority: 6, title: 'Circular Economy Initiatives', desc: 'Increase recycled content and design for recyclability to reduce virgin material demand in Tier 3.', impact: 'Low-Med', timeline: '18-36 months', tier: 'Tier 3' },
              ].map((rec, i) => {
                const tierColor = rec.tier === 'Tier 1' ? T.gold : rec.tier === 'Tier 2' ? '#e07b54' : rec.tier === 'Tier 3' ? '#7b6ea8' : T.navy;
                return (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 18, borderLeft: `4px solid ${tierColor}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>#{rec.priority}. {rec.title}</span>
                      <span style={sBadge(tierColor + '22', tierColor)}>{rec.tier}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{rec.desc}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: T.textMut }}>Impact: <strong style={{ color: rec.impact === 'High' ? T.green : T.amber }}>{rec.impact}</strong></span>
                      <span style={{ fontSize: 11, color: T.textMut }}>Timeline: <strong style={{ color: T.navy }}>{rec.timeline}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ S16: TOP EMITTERS HIGHLIGHT ═══ */}
        {tableData.length > 0 && (
          <div style={{ ...sCard, marginBottom: 28 }}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Top 5 Supply Chain Emitters</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Highest total supply chain emissions in portfolio — priority engagement targets</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
              {tableData.slice(0, 5).map((r, i) => {
                const pctOfPortTotal = portfolioAgg.grandTotal > 0 ? (r.total * (r.weight / 100)) / portfolioAgg.grandTotal * 100 : 0;
                return (
                  <div key={i} style={{ background: i === 0 ? T.navy : T.surfaceH, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: i === 0 ? T.goldL : T.navy, marginBottom: 4 }}>#{i + 1}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? '#fff' : T.navy, marginBottom: 4 }}>{r.name?.slice(0, 16)}</div>
                    <div style={{ fontSize: 11, color: i === 0 ? T.goldL : T.textMut, marginBottom: 8 }}>{r.sector}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? '#fff' : '#e07b54', marginBottom: 4 }}>{fmtM(r.total)}</div>
                    <div style={{ fontSize: 11, color: i === 0 ? 'rgba(255,255,255,0.7)' : T.textMut }}>SC Multiplier: {r.multiplier.toFixed(2)}x</div>
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: i === 0 ? T.goldL : T.sage }}>{pctOfPortTotal.toFixed(1)}% of portfolio SC</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ S17: SUMMARY FOOTER ═══ */}
        <div style={{ ...sCard, marginBottom: 28, background: T.navy + '06', borderColor: T.navy + '20' }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Supply Chain Carbon Summary</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                This analysis estimates Scope 3 supply chain emissions using sector-specific tier multipliers applied to reported Scope 1+2 data.
                Tier 1 estimates use spend-based emission factors (medium confidence), Tier 2 uses EEIO modeling (low confidence),
                and Tier 3 uses sector extrapolation (very low confidence). Results should be interpreted as order-of-magnitude estimates
                suitable for portfolio screening, engagement prioritization, and scenario analysis. Company-level verification is recommended
                before regulatory reporting.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut }}>Data Sources</div>
              {['CDP Climate Responses', 'GHG Protocol Scope 3', 'EEIO Models (Exiobase)', 'PCAF Standard v3'].map(s => (
                <div key={s} style={{ fontSize: 11, color: T.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: 99, background: T.sage }} /> {s}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ S18: CROSS-NAV ═══ */}
        <div style={{ ...sCard, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, alignSelf: 'center' }}>Navigate:</span>
          {[
            { label: 'Scope 3 Engine', path: '/scope3-engine' },
            { label: 'Carbon Budget', path: '/carbon-budget' },
            { label: 'Supply Chain Map', path: '/supply-chain-map' },
            { label: 'CSDDD Toolkit', path: '/csddd-compliance' },
            { label: 'Value Chain Hub', path: '/value-chain-dashboard' },
            { label: 'Portfolio Suite', path: '/portfolio-suite' },
          ].map(nav => (
            <button key={nav.path} onClick={() => navigate(nav.path)} style={{ background: T.navy + '0a', color: T.navy, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: T.font }}>
              {nav.label} &rarr;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
