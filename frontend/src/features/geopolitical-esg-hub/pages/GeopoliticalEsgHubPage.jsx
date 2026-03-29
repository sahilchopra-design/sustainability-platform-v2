import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < String(s).length; i++) h = ((h << 5) + h) ^ String(s).charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── Primitives ───────────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', borderLeft: `3px solid ${accent || T.gold}`, fontFamily: T.font }}>
    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);
const Section = ({ title, badge, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</span>
      {badge && <span style={{ fontSize: 10, fontWeight: 600, background: T.surfaceH, color: T.textSec, padding: '2px 8px', borderRadius: 10, border: `1px solid ${T.border}` }}>{badge}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, active, small, color }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, cursor: 'pointer', background: active ? T.navy : color || T.surface, color: active ? '#fff' : T.navy, fontWeight: 600, fontSize: small ? 11 : 13, fontFamily: T.font, transition: 'all 0.15s' }}>{children}</button>
);
const Badge = ({ label, color }) => {
  const map = { green: { bg: '#dcfce7', text: '#166534' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' }, navy: { bg: '#e0e7ff', text: '#1b3a5c' }, gold: { bg: '#fef3c7', text: '#92400e' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, teal: { bg: '#ccfbf1', text: '#115e59' } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{label}</span>;
};
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const thS = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3, cursor: 'pointer', userSelect: 'none' };
const tdS = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };
const riskColor = (r) => r === 'Very High' || r === 'High' ? T.red : r === 'Medium' ? T.amber : T.green;

const COUNTRY_LABELS = { IN:'India', US:'USA', CN:'China', GB:'UK', DE:'Germany', JP:'Japan', FR:'France', AU:'Australia', BR:'Brazil', KR:'South Korea', SG:'Singapore', ZA:'South Africa', CA:'Canada', HK:'Hong Kong' };

/* ═══════════════════════════════════════════════════════════════════════════
   GEOPOLITICAL RISK DATABASE (14 countries)
   ═══════════════════════════════════════════════════════════════════════════ */
const GEO_RISK = {
  IN: { gpr: 125, stability: 65, sanctions: 'Low', trade_risk: 'Medium', conflict: 'Medium', key_risks: ['India-China border', 'Kashmir'] },
  US: { gpr: 145, stability: 72, sanctions: 'Active sanctioner', trade_risk: 'High', conflict: 'Low', key_risks: ['US-China tech war', 'Trade tariffs'] },
  CN: { gpr: 160, stability: 78, sanctions: 'High (target)', trade_risk: 'Very High', conflict: 'High (Taiwan)', key_risks: ['Taiwan strait', 'US sanctions'] },
  GB: { gpr: 95, stability: 75, sanctions: 'Active sanctioner', trade_risk: 'Medium', conflict: 'Low', key_risks: ['Post-Brexit trade', 'Scotland'] },
  DE: { gpr: 85, stability: 82, sanctions: 'EU aligned', trade_risk: 'Medium', conflict: 'Low', key_risks: ['Energy dependency', 'Russia'] },
  JP: { gpr: 110, stability: 80, sanctions: 'US aligned', trade_risk: 'Medium', conflict: 'Medium', key_risks: ['China-Japan tensions', 'N.Korea'] },
  FR: { gpr: 100, stability: 68, sanctions: 'EU aligned', trade_risk: 'Medium', conflict: 'Low', key_risks: ['Social unrest', 'Africa policy'] },
  AU: { gpr: 90, stability: 82, sanctions: 'US aligned', trade_risk: 'Medium', conflict: 'Low', key_risks: ['China trade disputes'] },
  BR: { gpr: 105, stability: 60, sanctions: 'Low', trade_risk: 'Medium', conflict: 'Low', key_risks: ['Political polarization', 'Amazon deforestation'] },
  KR: { gpr: 120, stability: 72, sanctions: 'US aligned', trade_risk: 'Medium', conflict: 'High', key_risks: ['North Korea', 'China dependency'] },
  SG: { gpr: 70, stability: 92, sanctions: 'Low', trade_risk: 'Low', conflict: 'Low', key_risks: ['South China Sea'] },
  ZA: { gpr: 115, stability: 52, sanctions: 'Low', trade_risk: 'Medium', conflict: 'Low', key_risks: ['Infrastructure collapse', 'Political instability'] },
  CA: { gpr: 80, stability: 82, sanctions: 'US aligned', trade_risk: 'Medium', conflict: 'Low', key_risks: ['US trade dependency'] },
  HK: { gpr: 130, stability: 60, sanctions: 'Medium', trade_risk: 'High', conflict: 'Medium', key_risks: ['China integration', 'US sanctions risk'] },
};

/* ═══════════════════════════════════════════════════════════════════════════
   AI/TECH GOVERNANCE — 10 DIMENSIONS
   ═══════════════════════════════════════════════════════════════════════════ */
const AI_DIMENSIONS = [
  { id: 'AT01', name: 'AI Ethics Policy', benchmark: true },
  { id: 'AT02', name: 'Algorithmic Bias Assessment', benchmark: true },
  { id: 'AT03', name: 'AI Transparency', benchmark: true },
  { id: 'AT04', name: 'Data Privacy (GDPR/CCPA)', benchmark: true },
  { id: 'AT05', name: 'Cybersecurity Framework', benchmark: true },
  { id: 'AT06', name: 'Tech Supply Chain Risk', benchmark: true },
  { id: 'AT07', name: 'Digital Human Rights', benchmark: true },
  { id: 'AT08', name: 'Autonomous Systems', benchmark: true },
  { id: 'AT09', name: 'Climate Impact of Tech', benchmark: true },
  { id: 'AT10', name: 'Responsible Innovation', benchmark: true },
];

/* ═══════════════════════════════════════════════════════════════════════════
   AI REGULATIONS — 8 JURISDICTIONS
   ═══════════════════════════════════════════════════════════════════════════ */
const AI_REGS = [
  { jurisdiction: 'EU', name: 'EU AI Act', status: 'Enacted', effective: '2025-2027', penalty: '\u20AC35M or 7% turnover' },
  { jurisdiction: 'US', name: 'Executive Order on Safe AI', status: 'Active', effective: '2024', penalty: 'Varies by agency' },
  { jurisdiction: 'China', name: 'Generative AI Regulations', status: 'Enacted', effective: '2023', penalty: 'Administrative' },
  { jurisdiction: 'UK', name: 'Pro-innovation AI Framework', status: 'Framework', effective: '2024', penalty: 'Sector regulators' },
  { jurisdiction: 'India', name: 'Digital India Act', status: 'Draft', effective: '2025-2026', penalty: 'TBD' },
  { jurisdiction: 'Singapore', name: 'AI Governance Framework', status: 'Voluntary', effective: '2020+', penalty: 'N/A' },
  { jurisdiction: 'Japan', name: 'AI Strategy 2022', status: 'Guidelines', effective: '2022+', penalty: 'N/A' },
  { jurisdiction: 'Canada', name: 'AIDA', status: 'Bill', effective: 'Pending', penalty: 'Up to $25M' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   GEOPOLITICAL SCENARIOS — 3 Scenarios
   ═══════════════════════════════════════════════════════════════════════════ */
const SCENARIOS = [
  { id: 'SC01', name: 'Taiwan Strait Escalation', description: 'Military confrontation in Taiwan Strait leading to trade disruptions and tech supply chain severance', affected_countries: ['CN', 'US', 'JP', 'KR', 'HK', 'SG'], base_impact_pct: -8.5 },
  { id: 'SC02', name: 'Global Sanctions Expansion', description: 'Expanded Western sanctions on China and secondary sanctions on trading partners', affected_countries: ['CN', 'HK', 'KR', 'SG', 'IN', 'BR'], base_impact_pct: -5.2 },
  { id: 'SC03', name: 'AI Regulatory Fragmentation', description: 'Divergent AI regulations create compliance barriers for global tech companies', affected_countries: ['US', 'CN', 'GB', 'DE', 'FR', 'JP', 'IN'], base_impact_pct: -3.1 },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function GeopoliticalEsgHubPage() {
  const navigate = useNavigate();
  const companies = useMemo(() => (GLOBAL_COMPANY_MASTER || []).slice(0, 80), []);

  /* ── Portfolio (wrapped format) ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '{}');
      const portfolios = raw.portfolios || {};
      const active = raw.activePortfolio || Object.keys(portfolios)[0] || '';
      return { portfolios, activePortfolio: active, holdings: portfolios[active]?.holdings || [] };
    } catch { return { portfolios: {}, activePortfolio: '', holdings: [] }; }
  }, []);

  /* ── Derive holdings with geo data ── */
  const holdingsWithGeo = useMemo(() => {
    const holdings = portfolio.holdings.length > 0 ? portfolio.holdings : companies.slice(0, 25).map((c, i) => ({
      ticker: c.ticker, name: c.name, weight: (4 + sRand(i) * 4).toFixed(2), country: c.country || 'IN', sector: c.sector || 'Financials',
    }));
    return holdings.map((h, i) => {
      const co = companies.find(c => c.ticker === h.ticker) || {};
      const country = h.country || co.country || 'IN';
      const geo = GEO_RISK[country] || GEO_RISK.IN;
      const aiScores = AI_DIMENSIONS.map((d, j) => ({
        ...d,
        score: clamp(Math.round(40 + sRand(seed(h.ticker || h.name) + j * 17) * 50), 10, 95),
      }));
      const aiGovAvg = Math.round(aiScores.reduce((s, d) => s + d.score, 0) / aiScores.length);
      const cyberScore = clamp(Math.round(50 + sRand(seed(h.ticker || '') * 3) * 45), 20, 95);
      const dataBreaches = Math.floor(sRand(seed(h.ticker || '') * 5) * 3);
      const techExposure = sRand(seed(h.ticker || '') * 7) > 0.5 ? 'High' : sRand(seed(h.ticker || '') * 7) > 0.25 ? 'Medium' : 'Low';
      return {
        ...h, country, geo, aiScores, aiGovAvg, cyberScore, dataBreaches, techExposure,
        gpr: geo.gpr, sanctions: geo.sanctions, tradeRisk: geo.trade_risk,
        supplyChainRisk: techExposure === 'High' ? 'Elevated' : techExposure === 'Medium' ? 'Moderate' : 'Low',
      };
    });
  }, [portfolio, companies]);

  /* ── Country aggregation ── */
  const countryData = useMemo(() => {
    const map = {};
    holdingsWithGeo.forEach(h => {
      if (!map[h.country]) map[h.country] = { country: h.country, label: COUNTRY_LABELS[h.country] || h.country, ...GEO_RISK[h.country], holdings: 0, totalWeight: 0 };
      map[h.country].holdings++;
      map[h.country].totalWeight += parseFloat(h.weight) || 0;
    });
    // Add remaining countries from GEO_RISK not already present
    Object.keys(GEO_RISK).forEach(cc => {
      if (!map[cc]) map[cc] = { country: cc, label: COUNTRY_LABELS[cc] || cc, ...GEO_RISK[cc], holdings: 0, totalWeight: 0 };
    });
    return Object.values(map).sort((a, b) => b.gpr - a.gpr);
  }, [holdingsWithGeo]);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const totalWeight = holdingsWithGeo.reduce((s, h) => s + (parseFloat(h.weight) || 0), 0) || 1;
    const weightedGPR = holdingsWithGeo.reduce((s, h) => s + (h.gpr * (parseFloat(h.weight) || 0)), 0) / totalWeight;
    const highRiskCountries = countryData.filter(c => c.gpr >= 130).length;
    const sanctionedWeight = holdingsWithGeo.filter(h => h.sanctions === 'High (target)' || h.sanctions === 'Medium').reduce((s, h) => s + (parseFloat(h.weight) || 0), 0);
    const sanctionsPct = (sanctionedWeight / totalWeight * 100);
    const tradeHigh = holdingsWithGeo.filter(h => h.tradeRisk === 'Very High' || h.tradeRisk === 'High').length;
    const avgAiGov = Math.round(holdingsWithGeo.reduce((s, h) => s + h.aiGovAvg, 0) / (holdingsWithGeo.length || 1));
    const gdprCompliant = holdingsWithGeo.filter(h => (h.aiScores.find(d => d.id === 'AT04') || {}).score >= 60).length;
    const gdprPct = (gdprCompliant / (holdingsWithGeo.length || 1) * 100);
    const cyberAvg = Math.round(holdingsWithGeo.reduce((s, h) => s + h.cyberScore, 0) / (holdingsWithGeo.length || 1));
    const cyberPct = (cyberAvg);
    const totalBreaches = holdingsWithGeo.reduce((s, h) => s + h.dataBreaches, 0);
    const aiRegExposure = holdingsWithGeo.filter(h => ['US','CN','GB','DE','FR'].includes(h.country)).length;
    const techSupplyHigh = holdingsWithGeo.filter(h => h.techExposure === 'High').length;
    const digitalRightsAvg = Math.round(holdingsWithGeo.reduce((s, h) => s + ((h.aiScores.find(d => d.id === 'AT07') || {}).score || 50), 0) / (holdingsWithGeo.length || 1));
    const portTechGov = Math.round((avgAiGov * 0.4 + cyberAvg * 0.3 + gdprPct * 0.3));

    return {
      weightedGPR: weightedGPR.toFixed(0), highRiskCountries, sanctionsPct: sanctionsPct.toFixed(1),
      tradeHigh, avgAiGov, gdprPct: gdprPct.toFixed(1), cyberPct, totalBreaches,
      aiRegExposure, techSupplyHigh, digitalRightsAvg, portTechGov,
    };
  }, [holdingsWithGeo, countryData]);

  /* ── GPR BarChart data ── */
  const gprBarData = useMemo(() => countryData.map(c => ({ name: c.label, GPR: c.gpr })), [countryData]);

  /* ── AI Governance Heatmap data ── */
  const aiHeatmapRows = useMemo(() => holdingsWithGeo.slice(0, 20), [holdingsWithGeo]);

  /* ── Portfolio AI/Tech Exposure PieChart ── */
  const techExposurePie = useMemo(() => {
    const map = { High: 0, Medium: 0, Low: 0 };
    holdingsWithGeo.forEach(h => { map[h.techExposure] = (map[h.techExposure] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v }));
  }, [holdingsWithGeo]);

  /* ── Cybersecurity BarChart ── */
  const cyberBarData = useMemo(() => holdingsWithGeo.slice(0, 15).map(h => ({ name: (h.name || h.ticker || '').slice(0, 12), score: h.cyberScore })), [holdingsWithGeo]);

  /* ── Scenario Simulator State ── */
  const [scenarioSliders, setScenarioSliders] = useState(() => SCENARIOS.reduce((o, s) => ({ ...o, [s.id]: 50 }), {}));

  const scenarioResults = useMemo(() => SCENARIOS.map(sc => {
    const intensity = scenarioSliders[sc.id] / 50; // 0-2x multiplier
    const impact = sc.base_impact_pct * intensity;
    const affectedHoldings = holdingsWithGeo.filter(h => sc.affected_countries.includes(h.country));
    const affectedWeight = affectedHoldings.reduce((s, h) => s + (parseFloat(h.weight) || 0), 0);
    return { ...sc, intensity: intensity.toFixed(1), impact: impact.toFixed(2), affectedHoldings: affectedHoldings.length, affectedWeight: affectedWeight.toFixed(1) };
  }), [scenarioSliders, holdingsWithGeo]);

  /* ── Sorting state ── */
  const [sortCol, setSortCol] = useState('gpr');
  const [sortDir, setSortDir] = useState('desc');
  const [holdingSortCol, setHoldingSortCol] = useState('gpr');
  const [holdingSortDir, setHoldingSortDir] = useState('desc');

  const sortedCountries = useMemo(() => {
    return [...countryData].sort((a, b) => {
      const av = a[sortCol] ?? '', bv = b[sortCol] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [countryData, sortCol, sortDir]);

  const sortedHoldings = useMemo(() => {
    return [...holdingsWithGeo].sort((a, b) => {
      const av = a[holdingSortCol] ?? '', bv = b[holdingSortCol] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return holdingSortDir === 'asc' ? cmp : -cmp;
    });
  }, [holdingsWithGeo, holdingSortCol, holdingSortDir]);

  const toggleCountrySort = useCallback((col) => {
    setSortCol(prev => { setSortDir(prev === col ? (d => d === 'asc' ? 'desc' : 'asc') : 'desc'); return col; });
  }, []);

  const toggleHoldingSort = useCallback((col) => {
    setHoldingSortCol(prev => { setHoldingSortDir(prev === col ? (d => d === 'asc' ? 'desc' : 'asc') : 'desc'); return col; });
  }, []);

  /* ── Sanctions Exposure Panel ── */
  const sanctionsPanel = useMemo(() => {
    const groups = { 'High (target)': [], 'Medium': [], 'Active sanctioner': [], 'EU aligned': [], 'US aligned': [], 'Low': [] };
    countryData.forEach(c => { if (groups[c.sanctions]) groups[c.sanctions].push(c); else if (!groups['Low']) groups['Low'] = [c]; else groups['Low'].push(c); });
    return Object.entries(groups).filter(([, v]) => v.length > 0);
  }, [countryData]);

  /* ── Tech Supply Chain ── */
  const supplyChainData = useMemo(() => {
    const deps = [
      { component: 'Semiconductors', primarySource: 'CN/KR', risk: 'Very High', affected: holdingsWithGeo.filter(h => ['CN','KR','US','JP'].includes(h.country)).length },
      { component: 'Rare Earth Minerals', primarySource: 'CN', risk: 'High', affected: holdingsWithGeo.filter(h => h.country === 'CN').length },
      { component: 'Cloud Infrastructure', primarySource: 'US', risk: 'Medium', affected: holdingsWithGeo.filter(h => h.country === 'US').length },
      { component: 'AI Chips (GPU)', primarySource: 'US/KR', risk: 'High', affected: holdingsWithGeo.filter(h => ['US','KR'].includes(h.country)).length },
      { component: 'EV Battery Supply', primarySource: 'CN/AU', risk: 'High', affected: holdingsWithGeo.filter(h => ['CN','AU'].includes(h.country)).length },
      { component: 'Software Licenses', primarySource: 'US', risk: 'Medium', affected: holdingsWithGeo.filter(h => h.country === 'US').length },
      { component: 'Telecom Equipment', primarySource: 'CN/FI/SE', risk: 'Medium', affected: holdingsWithGeo.filter(h => h.country === 'CN').length },
      { component: 'Data Centers', primarySource: 'US/SG/DE', risk: 'Low', affected: holdingsWithGeo.filter(h => ['US','SG','DE'].includes(h.country)).length },
    ];
    return deps;
  }, [holdingsWithGeo]);

  /* ── Exports ── */
  const exportCSV = useCallback(() => {
    const headers = ['Holding','Country','GPR','Sanctions','Trade Risk','AI Gov Score','Cyber Score','Tech Exposure'];
    const rows = [headers.join(',')];
    holdingsWithGeo.forEach(h => rows.push([`"${h.name || h.ticker}"`, h.country, h.gpr, `"${h.sanctions}"`, h.tradeRisk, h.aiGovAvg, h.cyberScore, h.techExposure].join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'geopolitical_ai_gov_export.csv'; a.click();
  }, [holdingsWithGeo]);

  const exportJSON = useCallback(() => {
    const data = { kpis, countries: countryData, holdings: holdingsWithGeo.slice(0, 30), aiRegs: AI_REGS, scenarios: scenarioResults, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'geopolitical_ai_gov_export.json'; a.click();
  }, [kpis, countryData, holdingsWithGeo, scenarioResults]);

  const printPage = useCallback(() => window.print(), []);

  /* ── Empty State ── */
  if (!companies || companies.length === 0) {
    return (
      <div style={{ fontFamily: T.font, padding: 40, textAlign: 'center', color: T.textMut }}>
        <h2 style={{ color: T.navy }}>Geopolitical Risk & AI/Technology Governance</h2>
        <p>No company data available. Please load a portfolio first.</p>
        <Btn onClick={() => navigate('/portfolio-manager')}>Go to Portfolio Manager</Btn>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>

      {/* ── 1. Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.navy }}>Geopolitical Risk & AI/Technology Governance</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge label="14 Countries" color="navy" />
            <Badge label="GPR" color="red" />
            <Badge label="EU AI Act" color="purple" />
            <Badge label="10 Dimensions" color="teal" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small onClick={exportCSV}>CSV</Btn>
          <Btn small onClick={exportJSON}>JSON</Btn>
          <Btn small onClick={printPage}>Print</Btn>
        </div>
      </div>

      {/* ── 2. KPI Cards (12) ── */}
      <Section title="Key Performance Indicators" badge="12 KPIs">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
          <KpiCard label="GPR Index (Wtd)" value={kpis.weightedGPR} sub="Portfolio-weighted" accent={T.red} />
          <KpiCard label="High-Risk Countries" value={kpis.highRiskCountries} sub="GPR >= 130" accent={T.red} />
          <KpiCard label="Sanctions Exposure" value={`${kpis.sanctionsPct}%`} sub="Portfolio weight" accent="#991b1b" />
          <KpiCard label="Trade Risk" value={`${kpis.tradeHigh} High`} sub="Holdings exposed" accent={T.amber} />
          <KpiCard label="AI Gov Score" value={kpis.avgAiGov} sub="Avg across holdings" accent="#7c3aed" />
          <KpiCard label="GDPR Compliance" value={`${kpis.gdprPct}%`} sub="Holdings compliant" accent="#16a34a" />
          <KpiCard label="Cyber Coverage" value={`${kpis.cyberPct}%`} sub="Avg cyber score" accent="#0891b2" />
          <KpiCard label="Data Breaches" value={kpis.totalBreaches} sub="Last 3 years" accent={kpis.totalBreaches > 5 ? T.red : T.amber} />
          <KpiCard label="AI Reg Exposure" value={kpis.aiRegExposure} sub="Holdings in regulated" accent="#4f46e5" />
          <KpiCard label="Tech Supply Risk" value={`${kpis.techSupplyHigh} High`} sub="Holdings exposed" accent={T.amber} />
          <KpiCard label="Digital Rights" value={kpis.digitalRightsAvg} sub="Avg score" accent="#5a8a6a" />
          <KpiCard label="Portfolio Tech Gov" value={kpis.portTechGov} sub="Composite" accent={T.gold} />
        </div>
      </Section>

      {/* ── 3. Geopolitical Risk Table — 14 countries ── */}
      <Section title="Geopolitical Risk by Country" badge="14 Countries">
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {[{k:'label',l:'Country'},{k:'gpr',l:'GPR Index'},{k:'stability',l:'Stability'},{k:'sanctions',l:'Sanctions'},{k:'trade_risk',l:'Trade Risk'},{k:'conflict',l:'Conflict'},{k:'holdings',l:'Holdings'},{k:'totalWeight',l:'Weight %'}].map(h => (
                  <th key={h.k} style={thS} onClick={() => toggleCountrySort(h.k)}>
                    {h.l}{sortCol === h.k ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCountries.map((c, i) => (
                <tr key={c.country} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontWeight: 700 }}>{c.label}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: c.gpr >= 140 ? T.red : c.gpr >= 110 ? T.amber : T.green }}>{c.gpr}</td>
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 40, height: 6, borderRadius: 3, background: T.surfaceH }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${c.stability}%`, background: c.stability >= 75 ? T.green : c.stability >= 60 ? T.amber : T.red }} />
                      </div>
                      <span style={{ fontSize: 11 }}>{c.stability}</span>
                    </div>
                  </td>
                  <td style={tdS}><Badge label={c.sanctions} color={c.sanctions === 'High (target)' ? 'red' : c.sanctions === 'Medium' ? 'amber' : c.sanctions === 'Low' ? 'green' : 'blue'} /></td>
                  <td style={{ ...tdS, color: riskColor(c.trade_risk), fontWeight: 600 }}>{c.trade_risk}</td>
                  <td style={tdS}><Badge label={c.conflict} color={String(c.conflict).includes('High') ? 'red' : c.conflict === 'Medium' ? 'amber' : 'green'} /></td>
                  <td style={{ ...tdS, textAlign: 'center' }}>{c.holdings}</td>
                  <td style={{ ...tdS, textAlign: 'right' }}>{c.totalWeight.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 4. GPR by Country BarChart ── */}
      <Section title="GPR Index by Country" badge="BarChart">
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gprBarData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" domain={[0, 200]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={75} />
              <Tooltip />
              <Bar dataKey="GPR" radius={[0, 4, 4, 0]}>
                {gprBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.GPR >= 140 ? T.red : entry.GPR >= 110 ? T.amber : T.green} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 5. Sanctions Exposure Panel ── */}
      <Section title="Sanctions Exposure" badge={`${kpis.sanctionsPct}% Portfolio`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {sanctionsPanel.map(([level, countries]) => (
            <div key={level} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, borderLeft: `3px solid ${level === 'High (target)' ? T.red : level === 'Medium' ? T.amber : level === 'Active sanctioner' ? '#4f46e5' : T.green}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{level}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {countries.map(c => (
                  <span key={c.country} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: T.surfaceH, color: T.textSec }}>{c.label}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 6 }}>{countries.reduce((s, c) => s + c.holdings, 0)} holdings | {countries.reduce((s, c) => s + c.totalWeight, 0).toFixed(1)}% weight</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 6. Trade Policy Risk Matrix ── */}
      <Section title="Trade Policy Risk Matrix" badge="Country x Risk">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          {countryData.map(c => {
            const bg = c.trade_risk === 'Very High' ? '#fee2e2' : c.trade_risk === 'High' ? '#fef3c7' : c.trade_risk === 'Medium' ? '#fefce8' : '#dcfce7';
            const fg = c.trade_risk === 'Very High' ? '#991b1b' : c.trade_risk === 'High' ? '#92400e' : c.trade_risk === 'Medium' ? '#854d0e' : '#166534';
            return (
              <div key={c.country} style={{ background: bg, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: fg }}>{c.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: fg, marginTop: 4 }}>{c.trade_risk}</div>
                <div style={{ fontSize: 10, color: fg, marginTop: 2 }}>{(c.key_risks || []).slice(0, 1).join(', ')}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 7. AI Governance Heatmap — Holdings x 10 Dimensions ── */}
      <Section title="AI Governance Heatmap" badge={`${aiHeatmapRows.length} Holdings x 10 Dimensions`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...tbl, fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ ...thS, position: 'sticky', left: 0, zIndex: 1, background: T.surfaceH }}>Holding</th>
                {AI_DIMENSIONS.map(d => (
                  <th key={d.id} style={{ ...thS, fontSize: 9, padding: '6px 4px', textAlign: 'center', minWidth: 60 }}>{d.name.split(' ').slice(0, 2).join(' ')}</th>
                ))}
                <th style={{ ...thS, textAlign: 'center' }}>Avg</th>
              </tr>
            </thead>
            <tbody>
              {aiHeatmapRows.map((h, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontWeight: 600, position: 'sticky', left: 0, background: i % 2 === 0 ? T.surface : T.surfaceH, whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{(h.name || h.ticker || '').slice(0, 20)}</td>
                  {h.aiScores.map((d) => {
                    const bg = d.score >= 75 ? '#dcfce7' : d.score >= 50 ? '#fef3c7' : '#fee2e2';
                    const fg = d.score >= 75 ? '#166534' : d.score >= 50 ? '#92400e' : '#991b1b';
                    return <td key={d.id} style={{ ...tdS, textAlign: 'center', background: bg, color: fg, fontWeight: 600, fontSize: 11, padding: '4px 2px' }}>{d.score}</td>;
                  })}
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 700, color: h.aiGovAvg >= 70 ? T.green : h.aiGovAvg >= 50 ? T.amber : T.red }}>{h.aiGovAvg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 8. AI Regulation Tracker Table — 8 jurisdictions ── */}
      <Section title="AI Regulation Tracker" badge="8 Jurisdictions">
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {['Jurisdiction','Regulation','Status','Effective','Penalty'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AI_REGS.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontWeight: 700 }}>{r.jurisdiction}</td>
                  <td style={tdS}>{r.name}</td>
                  <td style={tdS}>
                    <Badge label={r.status} color={r.status === 'Enacted' ? 'green' : r.status === 'Active' ? 'blue' : r.status === 'Draft' || r.status === 'Bill' ? 'amber' : 'gray'} />
                  </td>
                  <td style={tdS}>{r.effective || '---'}</td>
                  <td style={{ ...tdS, fontSize: 11, color: r.penalty ? T.red : T.textMut }}>{r.penalty || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 9. Portfolio AI/Tech Exposure PieChart ── */}
      <Section title="Portfolio AI/Tech Exposure" badge="PieChart">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, flex: '1 1 300px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={techExposurePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {techExposurePie.map((entry, i) => (
                    <Cell key={i} fill={entry.name === 'High' ? T.red : entry.name === 'Medium' ? T.amber : T.green} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: '1 1 260px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Tech Exposure Summary</div>
            {techExposurePie.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: e.name === 'High' ? T.red : e.name === 'Medium' ? T.amber : T.green }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</span>
                <span style={{ fontSize: 13, color: T.textSec, marginLeft: 'auto' }}>{e.value} holdings ({((e.value / (holdingsWithGeo.length || 1)) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 10. Cybersecurity Risk BarChart ── */}
      <Section title="Cybersecurity Risk Assessment" badge="Top 15 Holdings">
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cyberBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize: 10, angle: -30 }} height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="score" name="Cyber Score" radius={[4, 4, 0, 0]}>
                {cyberBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.score >= 75 ? T.green : entry.score >= 50 ? T.amber : T.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 11. Tech Supply Chain Dependencies ── */}
      <Section title="Tech Supply Chain Dependencies" badge={`${supplyChainData.length} Components`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {['Component','Primary Source','Risk Level','Affected Holdings'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supplyChainData.map((d, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontWeight: 700 }}>{d.component}</td>
                  <td style={tdS}>{d.primarySource}</td>
                  <td style={tdS}><Badge label={d.risk} color={d.risk === 'Very High' ? 'red' : d.risk === 'High' ? 'amber' : d.risk === 'Medium' ? 'gold' : 'green'} /></td>
                  <td style={{ ...tdS, textAlign: 'center' }}>{d.affected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 12. Geopolitical Scenario Simulator ── */}
      <Section title="Geopolitical Scenario Simulator" badge="3 Scenarios">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {scenarioResults.map(sc => (
            <div key={sc.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{sc.name}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12, lineHeight: 1.5 }}>{sc.description}</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: T.textMut }}>Intensity</span>
                  <span style={{ fontWeight: 600 }}>{sc.intensity}x</span>
                </div>
                <input
                  type="range" min={0} max={100} value={scenarioSliders[sc.id]}
                  onChange={e => setScenarioSliders(prev => ({ ...prev, [sc.id]: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: T.navy }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: T.surfaceH, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.textMut }}>Portfolio Impact</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: parseFloat(sc.impact) < -5 ? T.red : T.amber }}>{sc.impact}%</div>
                </div>
                <div style={{ background: T.surfaceH, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.textMut }}>Holdings Affected</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{sc.affectedHoldings}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: T.textSec }}>
                Affected weight: {sc.affectedWeight}% | Countries: {sc.affected_countries.map(c => COUNTRY_LABELS[c] || c).join(', ')}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 13. Holdings Table — sortable ── */}
      <Section title="Holdings Geopolitical & AI Governance" badge={`${holdingsWithGeo.length} Holdings`}>
        <div style={{ overflowX: 'auto', maxHeight: 450, overflowY: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {[{k:'name',l:'Holding'},{k:'country',l:'Country'},{k:'gpr',l:'GPR'},{k:'sanctions',l:'Sanctions'},{k:'tradeRisk',l:'Trade Risk'},{k:'aiGovAvg',l:'AI Gov'},{k:'cyberScore',l:'Cyber'},{k:'techExposure',l:'Tech Exp'},{k:'weight',l:'Weight'}].map(h => (
                  <th key={h.k} style={thS} onClick={() => toggleHoldingSort(h.k)}>
                    {h.l}{holdingSortCol === h.k ? (holdingSortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name || h.ticker}</td>
                  <td style={tdS}>{COUNTRY_LABELS[h.country] || h.country}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: h.gpr >= 140 ? T.red : h.gpr >= 110 ? T.amber : T.green }}>{h.gpr}</td>
                  <td style={tdS}><Badge label={h.sanctions} color={h.sanctions === 'High (target)' ? 'red' : h.sanctions === 'Medium' ? 'amber' : 'green'} /></td>
                  <td style={{ ...tdS, color: riskColor(h.tradeRisk) }}>{h.tradeRisk}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: h.aiGovAvg >= 70 ? T.green : h.aiGovAvg >= 50 ? T.amber : T.red }}>{h.aiGovAvg}</td>
                  <td style={{ ...tdS, color: h.cyberScore >= 70 ? T.green : h.cyberScore >= 50 ? T.amber : T.red }}>{h.cyberScore}</td>
                  <td style={tdS}><Badge label={h.techExposure} color={h.techExposure === 'High' ? 'red' : h.techExposure === 'Medium' ? 'amber' : 'green'} /></td>
                  <td style={{ ...tdS, textAlign: 'right' }}>{parseFloat(h.weight).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 14. Exports & Cross-Navigation ── */}
      <Section title="Export & Navigate" badge="Actions">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <Btn onClick={exportCSV}>Export CSV</Btn>
          <Btn onClick={exportJSON}>Export JSON</Btn>
          <Btn onClick={printPage}>Print Report</Btn>
        </div>
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Cross-navigate to related modules:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Btn small onClick={() => navigate('/corporate-governance')}>Corporate Governance</Btn>
          <Btn small onClick={() => navigate('/compliance-evidence')}>Compliance Evidence</Btn>
          <Btn small onClick={() => navigate('/regulatory-gap')}>Regulatory Gap</Btn>
          <Btn small onClick={() => navigate('/governance-hub')}>Governance Hub</Btn>
          <Btn small onClick={() => navigate('/change-management')}>Change Management</Btn>
          <Btn small onClick={() => navigate('/climate-transition-risk')}>Climate Policy</Btn>
          <Btn small onClick={() => navigate('/controversy-monitor')}>DME Alerts</Btn>
        </div>
      </Section>

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', padding: '16px 0', borderTop: `1px solid ${T.border}`, marginTop: 12 }}>
        <span style={{ fontSize: 11, color: T.textMut }}>EP-V8 Geopolitical Risk & AI/Technology Governance | Sprint V | Risk Analytics Platform v6.0</span>
      </div>
    </div>
  );
}
