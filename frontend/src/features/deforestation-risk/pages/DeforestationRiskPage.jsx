import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899'];

/* ══════════════════════════════════════════════════════════════
   COMMODITY RISK DATABASE — 7 EUDR commodities
   ══════════════════════════════════════════════════════════════ */
const DEFORESTATION_COMMODITIES = [
  { id: 'palm_oil', name: 'Palm Oil', icon: '\uD83C\uDF34', risk_score: 92, primary_countries: ['ID', 'MY', 'NG'], area_loss_mha: 4.2, sectors_exposed: ['Consumer Staples', 'Consumer Discretionary'], supply_chain_depth: 'Tier 2-3', color: '#dc2626' },
  { id: 'soy', name: 'Soy', icon: '\uD83E\uDED8', risk_score: 85, primary_countries: ['BR', 'AR', 'PY'], area_loss_mha: 3.8, sectors_exposed: ['Consumer Staples', 'Materials'], supply_chain_depth: 'Tier 1-2', color: '#d97706' },
  { id: 'cattle', name: 'Cattle / Beef', icon: '\uD83D\uDC04', risk_score: 88, primary_countries: ['BR', 'AR', 'AU'], area_loss_mha: 5.5, sectors_exposed: ['Consumer Staples', 'Consumer Discretionary'], supply_chain_depth: 'Tier 1-2', color: '#b45309' },
  { id: 'cocoa', name: 'Cocoa', icon: '\uD83C\uDF6B', risk_score: 78, primary_countries: ['CI', 'GH', 'ID'], area_loss_mha: 1.2, sectors_exposed: ['Consumer Staples'], supply_chain_depth: 'Tier 2-3', color: '#7c3aed' },
  { id: 'coffee', name: 'Coffee', icon: '\u2615', risk_score: 72, primary_countries: ['BR', 'VN', 'CO'], area_loss_mha: 0.8, sectors_exposed: ['Consumer Staples'], supply_chain_depth: 'Tier 2-3', color: '#0d9488' },
  { id: 'rubber', name: 'Rubber', icon: '\uD83C\uDFED', risk_score: 75, primary_countries: ['TH', 'ID', 'VN'], area_loss_mha: 1.5, sectors_exposed: ['Consumer Discretionary', 'Industrials'], supply_chain_depth: 'Tier 2-3', color: '#4b5563' },
  { id: 'timber', name: 'Timber / Wood', icon: '\uD83E\uDEB5', risk_score: 68, primary_countries: ['BR', 'CG', 'ID'], area_loss_mha: 2.8, sectors_exposed: ['Materials', 'Real Estate'], supply_chain_depth: 'Tier 1-2', color: '#1b3a5c' },
];

/* ══════════════════════════════════════════════════════════════
   COUNTRY RISK DATA — key supply chain countries
   ══════════════════════════════════════════════════════════════ */
const COUNTRY_RISK = [
  { code: 'BR', name: 'Brazil', forest_loss_kha: 1695, governance_score: 52, eudr_benchmarked: 'High Risk', commodities: ['Soy', 'Cattle', 'Coffee', 'Timber'] },
  { code: 'ID', name: 'Indonesia', forest_loss_kha: 824, governance_score: 48, eudr_benchmarked: 'High Risk', commodities: ['Palm Oil', 'Rubber', 'Cocoa', 'Timber'] },
  { code: 'CG', name: 'DR Congo', forest_loss_kha: 512, governance_score: 25, eudr_benchmarked: 'High Risk', commodities: ['Timber', 'Cocoa'] },
  { code: 'MY', name: 'Malaysia', forest_loss_kha: 372, governance_score: 61, eudr_benchmarked: 'Standard', commodities: ['Palm Oil', 'Rubber'] },
  { code: 'AR', name: 'Argentina', forest_loss_kha: 348, governance_score: 49, eudr_benchmarked: 'Standard', commodities: ['Soy', 'Cattle'] },
  { code: 'CI', name: "Cote d'Ivoire", forest_loss_kha: 315, governance_score: 38, eudr_benchmarked: 'High Risk', commodities: ['Cocoa'] },
  { code: 'GH', name: 'Ghana', forest_loss_kha: 218, governance_score: 54, eudr_benchmarked: 'Standard', commodities: ['Cocoa'] },
  { code: 'PY', name: 'Paraguay', forest_loss_kha: 296, governance_score: 41, eudr_benchmarked: 'High Risk', commodities: ['Soy', 'Cattle'] },
  { code: 'TH', name: 'Thailand', forest_loss_kha: 145, governance_score: 58, eudr_benchmarked: 'Standard', commodities: ['Rubber'] },
  { code: 'VN', name: 'Vietnam', forest_loss_kha: 98, governance_score: 46, eudr_benchmarked: 'Standard', commodities: ['Coffee', 'Rubber'] },
  { code: 'CO', name: 'Colombia', forest_loss_kha: 287, governance_score: 50, eudr_benchmarked: 'Standard', commodities: ['Coffee'] },
  { code: 'AU', name: 'Australia', forest_loss_kha: 480, governance_score: 82, eudr_benchmarked: 'Low Risk', commodities: ['Cattle', 'Timber'] },
  { code: 'NG', name: 'Nigeria', forest_loss_kha: 189, governance_score: 35, eudr_benchmarked: 'High Risk', commodities: ['Palm Oil', 'Cocoa'] },
];

/* ══════════════════════════════════════════════════════════════
   EUDR COMPLIANCE CHECKLIST
   ══════════════════════════════════════════════════════════════ */
const EUDR_CHECKLIST = [
  { id: 'E01', requirement: 'Traceability to plot of land (geolocation)', article: 'Art. 9', criticality: 'P1' },
  { id: 'E02', requirement: 'Risk assessment of sourcing country/region', article: 'Art. 10', criticality: 'P1' },
  { id: 'E03', requirement: 'Geolocation data for production areas', article: 'Art. 9', criticality: 'P1' },
  { id: 'E04', requirement: 'Independent audit / third-party verification', article: 'Art. 10', criticality: 'P2' },
  { id: 'E05', requirement: 'Due diligence statement submission to authority', article: 'Art. 4', criticality: 'P1' },
  { id: 'E06', requirement: 'Deforestation-free after Dec 31, 2020 cutoff', article: 'Art. 3', criticality: 'P1' },
  { id: 'E07', requirement: 'Legal compliance in country of production', article: 'Art. 3', criticality: 'P1' },
  { id: 'E08', requirement: 'Supply chain mapping for all 7 commodities', article: 'Art. 9', criticality: 'P1' },
  { id: 'E09', requirement: 'Monitoring and review of due diligence system', article: 'Art. 11', criticality: 'P2' },
  { id: 'E10', requirement: 'Record retention (5 years)', article: 'Art. 12', criticality: 'P2' },
];

/* ══════════════════════════════════════════════════════════════
   DEFORESTATION TREND DATA 2015-2025
   ══════════════════════════════════════════════════════════════ */
const DEFORESTATION_TREND = [
  { year: 2015, palm_oil: 420, soy: 380, cattle: 550, cocoa: 120, coffee: 80, rubber: 150, timber: 280, total: 1980 },
  { year: 2016, palm_oil: 410, soy: 370, cattle: 540, cocoa: 115, coffee: 78, rubber: 145, timber: 275, total: 1933 },
  { year: 2017, palm_oil: 400, soy: 390, cattle: 560, cocoa: 125, coffee: 82, rubber: 148, timber: 270, total: 1975 },
  { year: 2018, palm_oil: 380, soy: 385, cattle: 570, cocoa: 118, coffee: 85, rubber: 142, timber: 265, total: 1945 },
  { year: 2019, palm_oil: 390, soy: 410, cattle: 580, cocoa: 122, coffee: 79, rubber: 155, timber: 290, total: 2026 },
  { year: 2020, palm_oil: 370, soy: 395, cattle: 560, cocoa: 110, coffee: 75, rubber: 140, timber: 260, total: 1910 },
  { year: 2021, palm_oil: 360, soy: 380, cattle: 530, cocoa: 108, coffee: 72, rubber: 135, timber: 250, total: 1835 },
  { year: 2022, palm_oil: 340, soy: 360, cattle: 510, cocoa: 105, coffee: 70, rubber: 130, timber: 240, total: 1755 },
  { year: 2023, palm_oil: 330, soy: 350, cattle: 500, cocoa: 100, coffee: 68, rubber: 125, timber: 235, total: 1708 },
  { year: 2024, palm_oil: 315, soy: 340, cattle: 480, cocoa: 95, coffee: 65, rubber: 120, timber: 225, total: 1640 },
  { year: 2025, palm_oil: 300, soy: 330, cattle: 470, cocoa: 92, coffee: 62, rubber: 115, timber: 220, total: 1589 },
];

/* ══════════════════════════════════════════════════════════════
   HELPER: deterministic pseudo-random
   ══════════════════════════════════════════════════════════════ */
const seed = (s) => { let x = Math.sin(s * 2.7183 + 1) * 10000; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════
   SCORING FUNCTION
   ══════════════════════════════════════════════════════════════ */
function scoreDeforestationExposure(company) {
  const sector = company.sector || '';
  let exposedCommodities = DEFORESTATION_COMMODITIES.filter(c => c.sectors_exposed.includes(sector));
  if (exposedCommodities.length === 0) return { score: 5, commodities: [], eudrApplicable: false, tier: 'N/A' };
  const avgRisk = exposedCommodities.reduce((s, c) => s + c.risk_score, 0) / exposedCommodities.length;
  const hasHighRiskCountry = exposedCommodities.some(c => c.primary_countries.some(cc => ['BR', 'ID', 'CG'].includes(cc)));
  return {
    score: Math.min(100, Math.round(avgRisk * (hasHighRiskCountry ? 1.1 : 0.8))),
    commodities: exposedCommodities.map(c => c.name),
    eudrApplicable: sector === 'Consumer Staples' || sector === 'Materials',
    tier: exposedCommodities[0]?.supply_chain_depth || 'N/A',
  };
}

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>
);
const KpiCard = ({ label, value, sub, color }) => (
  <Card>
    <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, fontFamily: T.font, marginTop: 2 }}>{sub}</div>}
  </Card>
);
const Badge = ({ label, color }) => (
  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: color ? `${color}18` : `${T.navy}15`, color: color || T.navy, fontFamily: T.font }}>{label}</span>
);
const Section = ({ title, sub, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</div>
      {sub && <span style={{ fontSize: 12, color: T.textMut, fontFamily: T.font }}>{sub}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, variant, style }) => (
  <button onClick={onClick} style={{ padding: '8px 18px', borderRadius: 8, border: variant === 'outline' ? `1px solid ${T.border}` : 'none', background: variant === 'outline' ? T.surface : T.navy, color: variant === 'outline' ? T.navy : '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font, ...style }}>{children}</button>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, background: T.surfaceH, borderRadius: 10, padding: 3, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none', background: active === t ? T.surface : 'transparent', color: active === t ? T.navy : T.textSec, fontWeight: active === t ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: T.font, boxShadow: active === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{t}</button>
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function DeforestationRiskPage() {
  const navigate = useNavigate();

  /* ── Portfolio ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      return raw.map(h => {
        const master = GLOBAL_COMPANY_MASTER.find(c => c.id === h.id || c.ticker === h.ticker);
        return master ? { ...master, weight: h.weight || 0 } : null;
      }).filter(Boolean);
    } catch { return []; }
  }, []);

  /* ── EUDR compliance state persisted ── */
  const [eudrState, setEudrState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ra_eudr_compliance_v1') || '{}');
      const state = {};
      EUDR_CHECKLIST.forEach(r => { state[r.id] = saved[r.id] || { status: 'Gap', notes: '' }; });
      return state;
    } catch {
      const state = {};
      EUDR_CHECKLIST.forEach(r => { state[r.id] = { status: 'Gap', notes: '' }; });
      return state;
    }
  });

  const persistEudr = useCallback((next) => {
    setEudrState(next);
    localStorage.setItem('ra_eudr_compliance_v1', JSON.stringify(next));
  }, []);

  const updateEudr = useCallback((id, field, val) => {
    persistEudr(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }, [persistEudr]);

  /* ── UI state ── */
  const [tab, setTab] = useState('Overview');
  const [sortBy, setSortBy] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  /* ── Score every holding ── */
  const scoredHoldings = useMemo(() => {
    return portfolio.map(c => {
      const exposure = scoreDeforestationExposure(c);
      return { ...c, ...exposure };
    });
  }, [portfolio]);

  /* ── KPI metrics ── */
  const metrics = useMemo(() => {
    const highRisk = scoredHoldings.filter(h => h.score >= 70).length;
    const eudrApplicable = scoredHoldings.filter(h => h.eudrApplicable).length;
    const avgScore = scoredHoldings.length > 0 ? Math.round(scoredHoldings.reduce((s, h) => s + h.score, 0) / scoredHoldings.length) : 0;
    const exposedPct = scoredHoldings.length > 0 ? Math.round((scoredHoldings.filter(h => h.score > 20).length / scoredHoldings.length) * 100) : 0;
    const allCommodities = [...new Set(scoredHoldings.flatMap(h => h.commodities))];
    const totalForestLoss = DEFORESTATION_COMMODITIES.reduce((s, c) => s + c.area_loss_mha, 0);
    const portfolioForestLoss = scoredHoldings.reduce((s, h) => {
      const exposed = DEFORESTATION_COMMODITIES.filter(c => h.commodities.includes(c.name));
      return s + exposed.reduce((ss, c) => ss + c.area_loss_mha * (h.weight || 0.01), 0);
    }, 0);
    return { highRisk, eudrApplicable, avgScore, exposedPct, commodityCount: allCommodities.length, totalForestLoss, portfolioForestLoss: portfolioForestLoss.toFixed(2) };
  }, [scoredHoldings]);

  /* ── Sector x Commodity heatmap data ── */
  const heatmapData = useMemo(() => {
    const sectors = [...new Set(scoredHoldings.map(h => h.sector).filter(Boolean))].slice(0, 10);
    return sectors.map(sector => {
      const row = { sector: sector.length > 16 ? sector.substring(0, 14) + '..' : sector };
      DEFORESTATION_COMMODITIES.forEach(c => {
        row[c.name] = c.sectors_exposed.includes(sector) ? c.risk_score : 0;
      });
      return row;
    });
  }, [scoredHoldings]);

  /* ── Sorted holdings for table ── */
  const sortedHoldings = useMemo(() => {
    return [...scoredHoldings].sort((a, b) => {
      const av = sortBy === 'score' ? a.score : sortBy === 'name' ? (a.name || a.ticker || '') : a.sector || '';
      const bv = sortBy === 'score' ? b.score : sortBy === 'name' ? (b.name || b.ticker || '') : b.sector || '';
      if (typeof av === 'number') return sortDir === 'desc' ? bv - av : av - bv;
      return sortDir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
  }, [scoredHoldings, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }
    else { setSortBy(col); setSortDir('desc'); }
  };

  /* ── EUDR compliance metrics ── */
  const eudrMetrics = useMemo(() => {
    const total = EUDR_CHECKLIST.length;
    const compliant = EUDR_CHECKLIST.filter(r => eudrState[r.id]?.status === 'Compliant').length;
    const partial = EUDR_CHECKLIST.filter(r => eudrState[r.id]?.status === 'Partial').length;
    const gaps = EUDR_CHECKLIST.filter(r => eudrState[r.id]?.status === 'Gap').length;
    return { total, compliant, partial, gaps, pct: total > 0 ? Math.round((compliant / total) * 100) : 0 };
  }, [eudrState]);

  /* ── Engagement recommendations ── */
  const engagementRecs = useMemo(() => {
    return scoredHoldings.filter(h => h.score >= 50).slice(0, 10).map(h => {
      const actions = [];
      if (h.commodities.includes('Palm Oil')) actions.push('Require RSPO certification from suppliers');
      if (h.commodities.includes('Soy')) actions.push('Implement soy moratorium compliance checks');
      if (h.commodities.includes('Cattle / Beef')) actions.push('Demand GPS-traced cattle sourcing');
      if (h.commodities.includes('Cocoa')) actions.push('Verify Rainforest Alliance / UTZ certification');
      if (h.commodities.includes('Coffee')) actions.push('Require shade-grown / agroforestry sourcing');
      if (h.commodities.includes('Rubber')) actions.push('Adopt GPSNR guidelines for natural rubber');
      if (h.commodities.includes('Timber / Wood')) actions.push('Verify FSC / PEFC chain of custody');
      if (h.eudrApplicable) actions.push('File EUDR due diligence statement');
      if (actions.length === 0) actions.push('Conduct supply chain risk assessment');
      return { ...h, actions };
    });
  }, [scoredHoldings]);

  /* ── Export handlers ── */
  const exportCSV = useCallback(() => {
    const headers = ['Company', 'Sector', 'Exposure Score', 'Commodities', 'EUDR Applicable', 'Supply Chain Tier'];
    const rows = scoredHoldings.map(h => [
      `"${h.name || h.ticker || ''}"`, h.sector || '', h.score, `"${h.commodities.join(', ')}"`, h.eudrApplicable ? 'Yes' : 'No', h.tier
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'deforestation_risk_report.csv'; a.click();
  }, [scoredHoldings]);

  const exportJSON = useCallback(() => {
    const data = { exportDate: new Date().toISOString(), holdings: scoredHoldings.map(h => ({ name: h.name || h.ticker, sector: h.sector, score: h.score, commodities: h.commodities, eudrApplicable: h.eudrApplicable, tier: h.tier })), eudrCompliance: eudrState, metrics };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'eudr_assessment.json'; a.click();
  }, [scoredHoldings, eudrState, metrics]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Empty portfolio guard ── */
  if (portfolio.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card style={{ textAlign: 'center', maxWidth: 480, padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>EUDR</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 8 }}>No Portfolio Loaded</div>
          <div style={{ fontSize: 14, color: T.textSec, marginBottom: 20 }}>Build a portfolio in the Portfolio Manager to assess deforestation risk across your holdings.</div>
          <Btn onClick={() => navigate('/portfolio-manager')}>Open Portfolio Manager</Btn>
        </Card>
      </div>
    );
  }

  const TABS = ['Overview', 'Commodities', 'Holdings', 'Heatmap', 'Countries', 'EUDR Checklist', 'Trend', 'Engagement', 'Footprint'];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      {/* ── HEADER ── */}
      <div style={{ background: T.navy, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Deforestation Risk Tracker</span>
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: `${T.gold}30`, color: T.goldL }}>EUDR</span>
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: `${T.sage}30`, color: T.sageL }}>7 Commodities</span>
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.8)' }}>Tier 1-3</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>EU Deforestation Regulation Compliance & Portfolio Exposure | {portfolio.length} holdings</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" onClick={exportCSV} style={{ borderColor: 'rgba(255,255,255,.25)', color: '#fff', background: 'transparent' }}>Export CSV</Btn>
          <Btn variant="outline" onClick={exportJSON} style={{ borderColor: 'rgba(255,255,255,.25)', color: '#fff', background: 'transparent' }}>EUDR JSON</Btn>
          <Btn variant="outline" onClick={handlePrint} style={{ borderColor: 'rgba(255,255,255,.25)', color: '#fff', background: 'transparent' }}>Print</Btn>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* ══════════════════════════════════════════════════════════
            TAB: OVERVIEW
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Overview' && (
          <>
            <Section title="Deforestation Exposure Overview" sub="Portfolio-level risk assessment">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
                <KpiCard label="Portfolio Exposure" value={`${metrics.exposedPct}%`} sub="Holdings with exposure" color={metrics.exposedPct > 50 ? T.red : T.amber} />
                <KpiCard label="High-Risk Holdings" value={metrics.highRisk} sub="Score >= 70" color={T.red} />
                <KpiCard label="EUDR-Applicable" value={metrics.eudrApplicable} sub="Regulation in scope" color={T.navy} />
                <KpiCard label="Commodities" value={metrics.commodityCount} sub="Of 7 EUDR commodities" color={T.gold} />
                <KpiCard label="Avg Risk Score" value={metrics.avgScore} sub="Portfolio weighted" color={metrics.avgScore >= 60 ? T.red : metrics.avgScore >= 35 ? T.amber : T.green} />
                <KpiCard label="Forest Loss Exposure" value={`${metrics.portfolioForestLoss} Mha`} sub="Attributed to portfolio" color={T.sage} />
              </div>
            </Section>

            {/* Exposure distribution bar chart */}
            <Section title="Portfolio Exposure Distribution">
              <Card>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={scoredHoldings.filter(h => h.score > 10).sort((a, b) => b.score - a.score).slice(0, 20).map(h => ({ name: (h.name || h.ticker || '').substring(0, 14), score: h.score }))} margin={{ left: 10, right: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-45} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
                    <Bar dataKey="score" name="Deforestation Risk Score" radius={[4, 4, 0, 0]}>
                      {scoredHoldings.filter(h => h.score > 10).sort((a, b) => b.score - a.score).slice(0, 20).map((h, i) => (
                        <Cell key={i} fill={h.score >= 70 ? T.red : h.score >= 40 ? T.amber : T.green} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            {/* Sector exposure summary */}
            <Section title="Sector Exposure Summary">
              <Card>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={(() => {
                    const sectorMap = {};
                    scoredHoldings.forEach(h => {
                      const s = h.sector || 'Other';
                      if (!sectorMap[s]) sectorMap[s] = { sector: s.length > 18 ? s.substring(0, 16) + '..' : s, count: 0, avgScore: 0, total: 0 };
                      sectorMap[s].count++;
                      sectorMap[s].total += h.score;
                    });
                    return Object.values(sectorMap).map(s => ({ ...s, avgScore: s.count > 0 ? Math.round(s.total / s.count) : 0 })).sort((a, b) => b.avgScore - a.avgScore).slice(0, 10);
                  })()} margin={{ left: 10, right: 10, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
                    <Bar dataKey="avgScore" name="Avg Deforestation Score" radius={[4, 4, 0, 0]}>
                      {Array.from({ length: 10 }).map((_, i) => <Cell key={i} fill={i < 3 ? T.red : i < 6 ? T.amber : T.sage} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            {/* EUDR compliance snapshot */}
            <Section title="EUDR Compliance Snapshot">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Due Diligence Requirements</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: eudrMetrics.pct >= 60 ? T.green : T.amber }}>{eudrMetrics.pct}%</div>
                  <div style={{ fontSize: 12, color: T.textMut }}>{eudrMetrics.compliant}/{eudrMetrics.total} compliant</div>
                  <div style={{ marginTop: 8, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${eudrMetrics.pct}%`, height: '100%', background: eudrMetrics.pct >= 60 ? T.green : T.amber, borderRadius: 3 }} />
                  </div>
                </Card>
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Key Deadline</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.red }}>30 Dec 2025</div>
                  <div style={{ fontSize: 12, color: T.textMut, marginTop: 4 }}>Large operators must comply. SMEs have until 30 Jun 2026.</div>
                </Card>
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Penalty Exposure</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.amber }}>Up to 4% turnover</div>
                  <div style={{ fontSize: 12, color: T.textMut, marginTop: 4 }}>Plus confiscation of products, exclusion from public procurement, and temporary market ban.</div>
                </Card>
              </div>
            </Section>

            {/* Cross-nav */}
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="outline" onClick={() => navigate('/supply-chain-map')}>Supply Chain Map</Btn>
              <Btn variant="outline" onClick={() => navigate('/csddd-compliance')}>CSDDD Compliance</Btn>
              <Btn variant="outline" onClick={() => navigate('/regulatory-gap')}>Regulatory Gap</Btn>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: COMMODITY RISK CARDS
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Commodities' && (
          <Section title="Commodity Risk Profiles" sub="7 EUDR-regulated commodities">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300, 1fr))', gap: 16 }}>
              {DEFORESTATION_COMMODITIES.map(c => (
                <Card key={c.id} style={{ borderLeft: `4px solid ${c.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 24, marginRight: 8 }}>{c.icon}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{c.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: c.risk_score >= 80 ? T.red : c.risk_score >= 60 ? T.amber : T.green }}>{c.risk_score}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>Risk Score</div>
                    </div>
                  </div>
                  {/* Risk gauge bar */}
                  <div style={{ height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ width: `${c.risk_score}%`, height: '100%', background: c.risk_score >= 80 ? T.red : c.risk_score >= 60 ? T.amber : T.green, borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div>
                      <div style={{ color: T.textMut, marginBottom: 2 }}>Primary Countries</div>
                      <div style={{ color: T.text, fontWeight: 600 }}>{c.primary_countries.join(', ')}</div>
                    </div>
                    <div>
                      <div style={{ color: T.textMut, marginBottom: 2 }}>Area Loss</div>
                      <div style={{ color: T.text, fontWeight: 600 }}>{c.area_loss_mha} Mha</div>
                    </div>
                    <div>
                      <div style={{ color: T.textMut, marginBottom: 2 }}>Exposed Sectors</div>
                      <div style={{ color: T.text, fontWeight: 600 }}>{c.sectors_exposed.join(', ')}</div>
                    </div>
                    <div>
                      <div style={{ color: T.textMut, marginBottom: 2 }}>Supply Chain Depth</div>
                      <div style={{ color: T.text, fontWeight: 600 }}>{c.supply_chain_depth}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: T.textSec }}>
                    Portfolio holdings exposed: {scoredHoldings.filter(h => h.commodities.includes(c.name)).length}
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: HOLDINGS TABLE
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Holdings' && (
          <Section title="Holdings Deforestation Exposure" sub="Sortable portfolio risk table">
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {[
                        { key: 'name', label: 'Company' },
                        { key: 'sector', label: 'Sector' },
                        { key: 'score', label: 'Exposure Score' },
                        { key: 'commodities', label: 'Commodities' },
                        { key: 'eudr', label: 'EUDR Applicable' },
                        { key: 'tier', label: 'Supply Chain Tier' },
                      ].map(h => (
                        <th key={h.key} onClick={() => toggleSort(h.key)} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                          {h.label} {sortBy === h.key ? (sortDir === 'desc' ? ' v' : ' ^') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHoldings.slice(0, 30).map(h => (
                      <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{h.name || h.company_name || h.ticker}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec }}>{h.sector || 'N/A'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${h.score}%`, height: '100%', background: h.score >= 70 ? T.red : h.score >= 40 ? T.amber : T.green, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: h.score >= 70 ? T.red : h.score >= 40 ? T.amber : T.green }}>{h.score}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {h.commodities.length > 0 ? h.commodities.map(c => <Badge key={c} label={c} color={DEFORESTATION_COMMODITIES.find(dc => dc.name === c)?.color} />) : <span style={{ fontSize: 12, color: T.textMut }}>None</span>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}><Badge label={h.eudrApplicable ? 'Yes' : 'No'} color={h.eudrApplicable ? T.red : T.textMut} /></td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec }}>{h.tier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sortedHoldings.length > 30 && <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: T.textMut }}>Showing 30 of {sortedHoldings.length} holdings</div>}
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: COMMODITY x SECTOR HEATMAP
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Heatmap' && (
          <Section title="Commodity x Sector Heatmap" sub="Risk exposure matrix">
            <Card style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600 }}>Sector</th>
                    {DEFORESTATION_COMMODITIES.map(c => (
                      <th key={c.id} style={{ textAlign: 'center', padding: '10px 8px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11 }}>{c.icon} {c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map(row => (
                    <tr key={row.sector} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{row.sector}</td>
                      {DEFORESTATION_COMMODITIES.map(c => {
                        const val = row[c.name] || 0;
                        const bg = val === 0 ? T.surfaceH : val >= 80 ? `${T.red}25` : val >= 60 ? `${T.amber}25` : `${T.green}20`;
                        return (
                          <td key={c.id} style={{ textAlign: 'center', padding: '10px 8px', background: bg, fontWeight: val > 0 ? 700 : 400, color: val >= 80 ? T.red : val >= 60 ? T.amber : val > 0 ? T.sage : T.textMut }}>
                            {val > 0 ? val : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 11, color: T.textMut }}>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: `${T.red}25`, marginRight: 4, verticalAlign: 'middle' }} />High Risk (80+)</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: `${T.amber}25`, marginRight: 4, verticalAlign: 'middle' }} />Moderate (60-79)</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: `${T.green}20`, marginRight: 4, verticalAlign: 'middle' }} />Low (&lt;60)</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: T.surfaceH, marginRight: 4, verticalAlign: 'middle' }} />Not Exposed</span>
            </div>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: COUNTRY RISK MAP TABLE
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Countries' && (
          <Section title="Supply Chain Country Risk" sub="Deforestation risk by sourcing country">
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Country', 'Code', 'Forest Loss (kha/yr)', 'Governance Score', 'EUDR Benchmarking', 'Key Commodities'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COUNTRY_RISK.sort((a, b) => b.forest_loss_kha - a.forest_loss_kha).map(c => (
                    <tr key={c.code} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={c.code} /></td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontWeight: 700, color: c.forest_loss_kha >= 500 ? T.red : c.forest_loss_kha >= 200 ? T.amber : T.green }}>{c.forest_loss_kha.toLocaleString()}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 50, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${c.governance_score}%`, height: '100%', background: c.governance_score >= 60 ? T.green : c.governance_score >= 40 ? T.amber : T.red, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: T.textSec }}>{c.governance_score}/100</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge label={c.eudr_benchmarked} color={c.eudr_benchmarked === 'High Risk' ? T.red : c.eudr_benchmarked === 'Standard' ? T.amber : T.green} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {c.commodities.map(cm => <Badge key={cm} label={cm} />)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: EUDR COMPLIANCE CHECKLIST
            ══════════════════════════════════════════════════════════ */}
        {tab === 'EUDR Checklist' && (
          <Section title="EUDR Compliance Checklist" sub="Due diligence requirements for placing products on EU market">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <KpiCard label="Total Requirements" value={eudrMetrics.total} sub="EUDR due diligence" />
              <KpiCard label="Compliant" value={eudrMetrics.compliant} sub={`${eudrMetrics.pct}%`} color={T.green} />
              <KpiCard label="Partial" value={eudrMetrics.partial} color={T.amber} />
              <KpiCard label="Gaps" value={eudrMetrics.gaps} sub="Requiring action" color={T.red} />
            </div>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['ID', 'Article', 'Requirement', 'Priority', 'Status', 'Notes'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EUDR_CHECKLIST.map(r => {
                    const st = eudrState[r.id] || {};
                    const statusColors = { Compliant: T.green, Partial: T.amber, Gap: T.red };
                    return (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: T.navy }}>{r.id}</td>
                        <td style={{ padding: '10px 12px' }}><Badge label={r.article} /></td>
                        <td style={{ padding: '10px 12px', maxWidth: 340, lineHeight: 1.4 }}>{r.requirement}</td>
                        <td style={{ padding: '10px 12px' }}><Badge label={r.criticality} color={r.criticality === 'P1' ? T.red : T.amber} /></td>
                        <td style={{ padding: '10px 12px' }}>
                          <select value={st.status || 'Gap'} onChange={e => updateEudr(r.id, 'status', e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: `${statusColors[st.status || 'Gap'] || T.textMut}12`, color: statusColors[st.status || 'Gap'] || T.textMut, fontWeight: 600, cursor: 'pointer' }}>
                            <option value="Compliant">Compliant</option>
                            <option value="Partial">Partial</option>
                            <option value="Gap">Gap</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <input value={st.notes || ''} onChange={e => updateEudr(r.id, 'notes', e.target.value)} placeholder="Notes..." style={{ width: 160, padding: '5px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            {/* EUDR context info */}
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>EUDR Implementation Guide</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Scope', desc: 'Applies to 7 commodities (palm oil, soy, cattle, cocoa, coffee, rubber, timber) and derived products placed on or exported from the EU market.' },
                  { label: 'Operator Obligations', desc: 'Operators must collect geolocation data, assess sourcing risk, and submit due diligence statements before placing products on the EU market.' },
                  { label: 'Benchmarking System', desc: 'EU Commission classifies countries/regions as low, standard, or high risk. Enhanced due diligence required for high-risk sources.' },
                  { label: 'Enforcement', desc: 'National competent authorities conduct checks. Penalties include fines up to 4% of EU-wide turnover, product confiscation, and temporary market exclusion.' },
                  { label: 'Cutoff Date', desc: 'Products must be deforestation-free relative to 31 December 2020 cutoff date. Any land converted after this date is non-compliant.' },
                  { label: 'Timeline', desc: 'Large operators: 30 Dec 2025. SMEs: 30 Jun 2026. Simplified due diligence available for low-risk country sourcing.' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: DEFORESTATION TREND (AREA CHART)
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Trend' && (
          <Section title="Global Deforestation Trend 2015-2025" sub="Commodity-driven forest loss (kha/year)">
            <Card>
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={DEFORESTATION_TREND} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `${v}`} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {DEFORESTATION_COMMODITIES.map(c => (
                    <Area key={c.id} type="monotone" dataKey={c.id} name={c.name} stackId="1" stroke={c.color} fill={c.color} fillOpacity={0.6} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>Commodity Contribution to Forest Loss</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={DEFORESTATION_COMMODITIES.map(c => ({ name: c.name, loss: c.area_loss_mha })).sort((a, b) => b.loss - a.loss)} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} unit=" Mha" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: T.text }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} formatter={v => [`${v} Mha`, 'Area Loss']} />
                  <Bar dataKey="loss" radius={[0, 4, 4, 0]}>
                    {DEFORESTATION_COMMODITIES.sort((a, b) => b.area_loss_mha - a.area_loss_mha).map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: ENGAGEMENT RECOMMENDATIONS
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Engagement' && (
          <Section title="Engagement Recommendations" sub="Targeted actions for high-exposure holdings">
            {engagementRecs.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 14, color: T.textMut }}>No holdings with significant deforestation exposure found.</div>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {engagementRecs.map(h => (
                  <Card key={h.id} style={{ borderLeft: `4px solid ${h.score >= 70 ? T.red : T.amber}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{h.name || h.ticker}</div>
                        <div style={{ fontSize: 12, color: T.textSec }}>{h.sector} | Score: {h.score}/100 | {h.commodities.join(', ')}</div>
                      </div>
                      <Badge label={h.score >= 70 ? 'High Risk' : 'Moderate Risk'} color={h.score >= 70 ? T.red : T.amber} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Recommended Actions:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {h.actions.map((a, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.textSec }}>
                          <span style={{ color: T.sage, fontWeight: 700 }}>></span>
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Certification standards reference */}
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>Key Certification Standards</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { name: 'RSPO', commodity: 'Palm Oil', desc: 'Roundtable on Sustainable Palm Oil — verified deforestation-free palm oil supply chains', strength: 'High' },
                  { name: 'RTRS', commodity: 'Soy', desc: 'Round Table on Responsible Soy — responsible soy production standards', strength: 'Medium' },
                  { name: 'Rainforest Alliance', commodity: 'Cocoa / Coffee', desc: 'Sustainable agriculture certification including forest protection requirements', strength: 'Medium' },
                  { name: 'FSC', commodity: 'Timber', desc: 'Forest Stewardship Council — responsible forest management with chain of custody', strength: 'High' },
                  { name: 'PEFC', commodity: 'Timber', desc: 'Programme for the Endorsement of Forest Certification — national standards endorsement', strength: 'Medium' },
                  { name: 'GPSNR', commodity: 'Rubber', desc: 'Global Platform for Sustainable Natural Rubber — industry-led sustainability platform', strength: 'Emerging' },
                ].map((cert, i) => (
                  <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{cert.name}</span>
                      <Badge label={cert.strength} color={cert.strength === 'High' ? T.green : cert.strength === 'Medium' ? T.amber : T.textMut} />
                    </div>
                    <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, marginBottom: 4 }}>{cert.commodity}</div>
                    <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.4 }}>{cert.desc}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Engagement priority matrix */}
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Engagement Priority Matrix</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={engagementRecs.slice(0, 8).map(h => ({
                  name: (h.name || h.ticker || '').substring(0, 12),
                  score: h.score,
                  weight: Math.round((h.weight || 0) * 100 * 10) / 10,
                }))} margin={{ left: 10, right: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textMut }} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="score" name="Risk Score" fill={T.red} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="weight" name="Portfolio Weight %" fill={T.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: PORTFOLIO DEFORESTATION FOOTPRINT
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Footprint' && (
          <Section title="Portfolio Deforestation Footprint" sub="Estimated hectares attributable to portfolio holdings">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
              <KpiCard label="Estimated Forest Loss" value={`${metrics.portfolioForestLoss} Mha`} sub="Attributed to portfolio" color={T.red} />
              <KpiCard label="Global Context" value={`${DEFORESTATION_COMMODITIES.reduce((s, c) => s + c.area_loss_mha, 0).toFixed(1)} Mha`} sub="Total commodity-driven loss" />
              <KpiCard label="Portfolio Share" value={`${(parseFloat(metrics.portfolioForestLoss) / DEFORESTATION_COMMODITIES.reduce((s, c) => s + c.area_loss_mha, 0) * 100).toFixed(2)}%`} sub="Of global commodity loss" color={T.amber} />
            </div>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Footprint by Commodity</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={DEFORESTATION_COMMODITIES.map(c => {
                    const exposure = scoredHoldings.filter(h => h.commodities.includes(c.name));
                    const attributed = exposure.reduce((s, h) => s + c.area_loss_mha * (h.weight || 0.01), 0);
                    return { name: c.name, value: parseFloat(attributed.toFixed(3)), color: c.color };
                  }).filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} stroke="none">
                    {DEFORESTATION_COMMODITIES.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: T.font }} formatter={v => [`${v} Mha`, 'Attributed Loss']} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Footprint per holding */}
            <Card style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>Top Holdings by Attributed Deforestation</div>
                <div style={{ fontSize: 12, color: T.textMut }}>Estimated forest loss attributable to each holding</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Company', 'Sector', 'Weight %', 'Commodities', 'Attributed Loss (kha)', 'Risk Level'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scoredHoldings.filter(h => h.score > 20).sort((a, b) => b.score - a.score).slice(0, 15).map(h => {
                    const exposed = DEFORESTATION_COMMODITIES.filter(c => h.commodities.includes(c.name));
                    const attributed = exposed.reduce((s, c) => s + c.area_loss_mha * (h.weight || 0.01) * 1000, 0);
                    return (
                      <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{h.name || h.ticker}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec }}>{h.sector || 'N/A'}</td>
                        <td style={{ padding: '10px 12px' }}>{((h.weight || 0) * 100).toFixed(1)}%</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {h.commodities.map(c => <Badge key={c} label={c} color={DEFORESTATION_COMMODITIES.find(dc => dc.name === c)?.color} />)}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: attributed >= 50 ? T.red : attributed >= 20 ? T.amber : T.green }}>{attributed.toFixed(1)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge label={h.score >= 70 ? 'High' : h.score >= 40 ? 'Moderate' : 'Low'} color={h.score >= 70 ? T.red : h.score >= 40 ? T.amber : T.green} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>Attribution Methodology</div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7 }}>
                <strong style={{ color: T.navy }}>Approach:</strong> Portfolio deforestation footprint is calculated using an attribution model based on: (1) sector-commodity linkage identifying which commodities each holding is exposed to through its supply chain; (2) portfolio weight determining proportional attribution; (3) commodity area loss data from Global Forest Watch and FAO. The methodology aligns with the Partnership for Biodiversity Accounting Financials (PBAF) Standard and TNFD LEAP approach.
              </div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, marginTop: 10 }}>
                <strong style={{ color: T.navy }}>Data Sources:</strong> Forest loss from Hansen/UMD, commodity production from FAOSTAT, supply chain linkages from Trase and CDP Forests questionnaire.
              </div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, marginTop: 10 }}>
                <strong style={{ color: T.navy }}>Limitations:</strong> Attribution is estimated at sector level, not company-specific supply chain. Actual exposure may vary based on sourcing policies and certification status.
              </div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, marginTop: 10 }}>
                <strong style={{ color: T.navy }}>Alignment:</strong> This footprint assessment supports TNFD Nature-related Disclosures (TNFD LEAP), SBTN corporate target-setting, and EUDR compliance documentation. Financial institutions can use this data for PCAF-aligned financed deforestation reporting.
              </div>
            </Card>

            {/* Reduction targets */}
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>Deforestation Reduction Targets</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { target: 'Zero Deforestation by 2025', desc: 'Consumer Goods Forum commitment for key commodities (palm oil, soy, pulp & paper, beef)', progress: 62 },
                  { target: 'Glasgow Forest Pledge', desc: 'Halt and reverse forest loss by 2030 — signed by 140+ countries', progress: 28 },
                  { target: 'EUDR Compliance', desc: 'All products placed on EU market must be deforestation-free (post-Dec 2020)', progress: eudrMetrics.pct },
                ].map((t, i) => (
                  <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{t.target}</div>
                    <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.4, marginBottom: 8 }}>{t.desc}</div>
                    <div style={{ height: 6, background: T.surface, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${t.progress}%`, height: '100%', background: t.progress >= 60 ? T.green : t.progress >= 30 ? T.amber : T.red, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Progress: {t.progress}%</div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        )}
      </div>
    </div>
  );
}
