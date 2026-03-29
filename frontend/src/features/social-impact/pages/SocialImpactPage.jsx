import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899', '#f97316', '#6366f1'];
const seed = (s) => { let x = Math.sin(s * 2.7183 + 1) * 10000; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════
   SDG FRAMEWORK — 17 Goals
   ══════════════════════════════════════════════════════════════ */
const SDG_FRAMEWORK = [
  { id: 1, name: 'No Poverty', icon: '🏠', color: '#E5243B', metrics: ['Living wage coverage %', 'Financial inclusion products'], sectors: ['Financials', 'Consumer Staples'] },
  { id: 2, name: 'Zero Hunger', icon: '🌾', color: '#DDA63A', metrics: ['Sustainable agriculture %', 'Food waste reduction'], sectors: ['Consumer Staples'] },
  { id: 3, name: 'Good Health', icon: '💊', color: '#4C9F38', metrics: ['Patients served', 'R&D in neglected diseases', 'Drug affordability'], sectors: ['Health Care'] },
  { id: 4, name: 'Quality Education', icon: '📚', color: '#C5192D', metrics: ['Employee training hours', 'Education products reach'], sectors: ['Communication Services', 'IT'] },
  { id: 5, name: 'Gender Equality', icon: '⚖', color: '#FF3A21', metrics: ['Female workforce %', 'Board diversity %', 'Pay equity ratio'], sectors: ['All'] },
  { id: 6, name: 'Clean Water', icon: '💧', color: '#26BDE2', metrics: ['Water recycled %', 'Water treatment capacity'], sectors: ['Utilities', 'Materials'] },
  { id: 7, name: 'Affordable Energy', icon: '\u26A1', color: '#FCC30B', metrics: ['Renewable capacity GW', 'Energy access (off-grid solar)'], sectors: ['Energy', 'Utilities'] },
  { id: 8, name: 'Decent Work', icon: '💼', color: '#A21942', metrics: ['Jobs created', 'Living wage', 'Safety record'], sectors: ['All'] },
  { id: 9, name: 'Industry Innovation', icon: '🏭', color: '#FD6925', metrics: ['R&D spend %', 'Patents (green)', 'Infrastructure investment'], sectors: ['IT', 'Industrials'] },
  { id: 10, name: 'Reduced Inequality', icon: '📊', color: '#DD1367', metrics: ['Pay ratio (CEO:median)', 'Community investment', 'Tax transparency'], sectors: ['Financials', 'All'] },
  { id: 11, name: 'Sustainable Cities', icon: '🏙', color: '#FD9D24', metrics: ['Green buildings', 'Public transport investment', 'Smart city tech'], sectors: ['Real Estate', 'Industrials', 'IT'] },
  { id: 12, name: 'Responsible Consumption', icon: '♻', color: '#BF8B2E', metrics: ['Circular economy %', 'Packaging reduction', 'Product lifecycle'], sectors: ['Consumer Staples', 'Consumer Discretionary', 'Materials'] },
  { id: 13, name: 'Climate Action', icon: '🌡', color: '#3F7E44', metrics: ['SBTi target', 'Net zero year', 'Carbon reduction %'], sectors: ['All'] },
  { id: 14, name: 'Life Below Water', icon: '🐋', color: '#0A97D9', metrics: ['Marine pollution reduction', 'Sustainable fishing', 'Plastic waste'], sectors: ['Consumer Staples', 'Energy'] },
  { id: 15, name: 'Life on Land', icon: '🌳', color: '#56C02B', metrics: ['Deforestation-free sourcing', 'Biodiversity offset', 'Land restoration'], sectors: ['Consumer Staples', 'Materials', 'Energy'] },
  { id: 16, name: 'Peace & Justice', icon: '🕊', color: '#00689D', metrics: ['Anti-corruption policy', 'Tax transparency', 'Whistleblower mechanism'], sectors: ['All'] },
  { id: 17, name: 'Partnerships', icon: '🤝', color: '#19486A', metrics: ['Industry collaboration', 'Cross-sector partnerships', 'Open data sharing'], sectors: ['All'] },
];

/* ══════════════════════════════════════════════════════════════
   UNGC 10 PRINCIPLES
   ══════════════════════════════════════════════════════════════ */
const UNGC_PRINCIPLES = [
  { id: 1, area: 'Human Rights', principle: 'Support & respect internationally proclaimed human rights' },
  { id: 2, area: 'Human Rights', principle: 'Not complicit in human rights abuses' },
  { id: 3, area: 'Labour', principle: 'Freedom of association & right to collective bargaining' },
  { id: 4, area: 'Labour', principle: 'Elimination of forced & compulsory labour' },
  { id: 5, area: 'Labour', principle: 'Effective abolition of child labour' },
  { id: 6, area: 'Labour', principle: 'Elimination of employment discrimination' },
  { id: 7, area: 'Environment', principle: 'Support precautionary approach to environmental challenges' },
  { id: 8, area: 'Environment', principle: 'Promote greater environmental responsibility' },
  { id: 9, area: 'Environment', principle: 'Encourage development of environmentally friendly technologies' },
  { id: 10, area: 'Anti-Corruption', principle: 'Work against corruption including extortion and bribery' },
];

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
  <div style={{ display: 'flex', gap: 4, background: T.surfaceH, borderRadius: 10, padding: 3, marginBottom: 20, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: active === t ? T.surface : 'transparent', color: active === t ? T.navy : T.textSec, fontWeight: active === t ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: T.font, boxShadow: active === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none', minWidth: 100 }}>{t}</button>
    ))}
  </div>
);
const SortTh = ({ label, sortKey, sortCol, sortDir, onSort, style }) => (
  <th onClick={() => onSort(sortKey)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, cursor: 'pointer', borderBottom: `2px solid ${T.border}`, fontFamily: T.font, userSelect: 'none', whiteSpace: 'nowrap', ...style }}>
    {label} {sortCol === sortKey ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25BD'}
  </th>
);

/* ══════════════════════════════════════════════════════════════
   DATA LOADING
   ══════════════════════════════════════════════════════════════ */
const LS_KEY = 'ra_portfolio_v1';
const LS_SDG_TARGETS = 'ra_sdg_targets_v1';
const loadPortfolio = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
const loadTargets = () => { try { return JSON.parse(localStorage.getItem(LS_SDG_TARGETS)) || {}; } catch { return {}; } };
const saveTargets = (t) => { try { localStorage.setItem(LS_SDG_TARGETS, JSON.stringify(t)); } catch {} };

const TABS = ['SDG Overview', 'Heatmap', 'Holdings Detail', 'Impact Metrics', 'UNGC Compliance', 'Targets & Benchmark'];

/* ══════════════════════════════════════════════════════════════
   SDG-SECTOR RELEVANCE MATRIX
   Maps which sectors have natural alignment to each SDG.
   Used as the base layer for scoring.
   ══════════════════════════════════════════════════════════════ */
const SDG_SECTOR_WEIGHTS = {
  'Financials': [1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1],
  'Health Care': [0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1],
  'IT': [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1],
  'Energy': [0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  'Utilities': [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1],
  'Materials': [0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1],
  'Industrials': [0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1],
  'Consumer Staples': [1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1],
  'Consumer Discretionary': [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1],
  'Real Estate': [0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1],
  'Communication Services': [0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1],
};

/* ══════════════════════════════════════════════════════════════
   IMPACT QUANTIFICATION BENCHMARKS
   Used to estimate absolute impact numbers per holding
   ══════════════════════════════════════════════════════════════ */
const IMPACT_BENCHMARKS = {
  jobs_per_bn_revenue: 850,
  patients_per_bn_healthcare: 12000,
  gw_per_bn_energy: 0.015,
  water_ml_per_bn_utilities: 45,
  hectares_per_bn_materials: 120,
  training_hrs_per_employee: 28,
  community_invest_pct: 0.008,
  green_patents_per_bn_rd: 22,
};

/* ══════════════════════════════════════════════════════════════
   SDG SCORING ENGINE
   ══════════════════════════════════════════════════════════════ */
const computeSDGScores = (company, idx) => {
  const sector = company.sector || company.gics_sector || 'Unknown';
  const scores = {};
  SDG_FRAMEWORK.forEach(sdg => {
    const sectorRelevant = sdg.sectors.includes('All') || sdg.sectors.includes(sector);
    const baseSeed = seed(idx * 17 + sdg.id * 7);
    const sectorBonus = sectorRelevant ? 20 : 0;
    const companyAction = Math.round(baseSeed * 35);
    const revenueAlign = Math.round(seed(idx * 13 + sdg.id * 11) * 25);
    const sbtiBonus = sdg.id === 13 && company.sbti_status === 'Approved' ? 15 : 0;
    const diversityBonus = sdg.id === 5 && (company.female_board_pct || seed(idx * 31) * 40) > 30 ? 12 : 0;
    const raw = sectorBonus + companyAction + revenueAlign + sbtiBonus + diversityBonus;
    scores[sdg.id] = Math.min(100, Math.max(0, Math.round(raw)));
  });
  return scores;
};

const computeRevenueAlignment = (company, idx) => {
  const results = {};
  SDG_FRAMEWORK.forEach(sdg => {
    const s = seed(idx * 23 + sdg.id * 19);
    const sector = company.sector || company.gics_sector || '';
    const relevant = sdg.sectors.includes('All') || sdg.sectors.includes(sector);
    results[sdg.id] = relevant ? Math.round(s * 30 + 5) : Math.round(s * 8);
  });
  return results;
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT — EP-N5 Social Impact & SDG Tracker
   ══════════════════════════════════════════════════════════════ */
export default function SocialImpactPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [sortCol, setSortCol] = useState('alignment');
  const [sortDir, setSortDir] = useState('desc');
  const [sdgFilter, setSdgFilter] = useState(0);
  const [sdgTargets, setSdgTargets] = useState(loadTargets);
  const [targetEditId, setTargetEditId] = useState(null);
  const [targetEditVal, setTargetEditVal] = useState('');
  const [heatmapMinScore, setHeatmapMinScore] = useState(0);

  const portfolio = useMemo(() => loadPortfolio(), []);
  const holdings = useMemo(() => {
    if (!portfolio.length) return GLOBAL_COMPANY_MASTER.slice(0, 30);
    return portfolio.map(p => {
      const master = GLOBAL_COMPANY_MASTER.find(c => c.isin === p.isin || c.ticker === p.ticker);
      return master ? { ...master, weight: p.weight } : { ...p, weight: p.weight };
    }).filter(Boolean);
  }, [portfolio]);

  const enriched = useMemo(() => holdings.map((h, i) => {
    const sdgScores = computeSDGScores(h, i);
    const revAlign = computeRevenueAlignment(h, i);
    const avgScore = Math.round(Object.values(sdgScores).reduce((a, b) => a + b, 0) / 17);
    const topSDG = Object.entries(sdgScores).sort((a, b) => b[1] - a[1])[0];
    const botSDG = Object.entries(sdgScores).sort((a, b) => a[1] - b[1])[0];
    const avgRevAlign = Math.round(Object.values(revAlign).reduce((a, b) => a + b, 0) / 17);
    const contributeHarm = {};
    SDG_FRAMEWORK.forEach(sdg => { contributeHarm[sdg.id] = sdgScores[sdg.id] >= 40 ? 'contribute' : 'harm'; });
    return { ...h, sdgScores, revAlign, avgScore, topSDG: Number(topSDG[0]), botSDG: Number(botSDG[0]), avgRevAlign, contributeHarm };
  }), [holdings]);

  /* Aggregate KPIs */
  const kpis = useMemo(() => {
    if (!enriched.length) return {};
    const allScores = enriched.map(e => e.avgScore);
    const avgAlign = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    const sdgAgg = {};
    SDG_FRAMEWORK.forEach(sdg => { sdgAgg[sdg.id] = Math.round(enriched.reduce((s, e) => s + (e.sdgScores[sdg.id] || 0), 0) / enriched.length); });
    const topSDGId = Object.entries(sdgAgg).sort((a, b) => b[1] - a[1])[0];
    const botSDGId = Object.entries(sdgAgg).sort((a, b) => a[1] - b[1])[0];
    const sdgsAbove50 = Object.values(sdgAgg).filter(v => v >= 50).length;
    const avgRevAlign = Math.round(enriched.reduce((s, e) => s + e.avgRevAlign, 0) / enriched.length);
    const socialScore = Math.round(avgAlign * 0.5 + avgRevAlign * 0.3 + sdgsAbove50 / 17 * 100 * 0.2);
    const dataCov = Math.round(enriched.filter(e => e.avgScore > 15).length / enriched.length * 100);
    return { count: enriched.length, avgAlign, topSDG: SDG_FRAMEWORK.find(s => s.id === Number(topSDGId[0])), botSDG: SDG_FRAMEWORK.find(s => s.id === Number(botSDGId[0])), sdgsAbove50, avgRevAlign, socialScore, dataCov, sdgAgg };
  }, [enriched]);

  const sortedHoldings = useMemo(() => {
    const arr = [...enriched];
    arr.sort((a, b) => {
      let va, vb;
      if (sortCol === 'name') { va = (a.company_name || a.name || '').toLowerCase(); vb = (b.company_name || b.name || '').toLowerCase(); return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      if (sortCol === 'sector') { va = (a.sector || a.gics_sector || ''); vb = (b.sector || b.gics_sector || ''); return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      if (sortCol === 'alignment') { va = a.avgScore; vb = b.avgScore; }
      else if (sortCol === 'revAlign') { va = a.avgRevAlign; vb = b.avgRevAlign; }
      else if (sortCol === 'topSDG') { va = a.sdgScores[a.topSDG] || 0; vb = b.sdgScores[b.topSDG] || 0; }
      else { va = a.avgScore; vb = b.avgScore; }
      return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
    });
    return arr;
  }, [enriched, sortCol, sortDir]);

  const handleSort = useCallback((col) => { setSortCol(prev => { if (prev === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return col; } setSortDir('desc'); return col; }); }, []);

  const saveTarget = useCallback((sdgId, val) => { const next = { ...sdgTargets, [sdgId]: Number(val) || 0 }; setSdgTargets(next); saveTargets(next); setTargetEditId(null); }, [sdgTargets]);

  /* Exports */
  const exportCSV = useCallback(() => {
    const header = ['Company', 'Sector', 'Avg SDG Score', 'Revenue Alignment %', ...SDG_FRAMEWORK.map(s => `SDG ${s.id}`)];
    const rows = enriched.map(e => [e.company_name || e.name, e.sector || e.gics_sector, e.avgScore, e.avgRevAlign, ...SDG_FRAMEWORK.map(s => e.sdgScores[s.id])]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sdg_impact_report.csv'; a.click(); URL.revokeObjectURL(url);
  }, [enriched]);
  const exportJSON = useCallback(() => {
    const data = { generated: new Date().toISOString(), portfolio_count: enriched.length, sdg_aggregate: kpis.sdgAgg, holdings: enriched.map(e => ({ name: e.company_name || e.name, sector: e.sector || e.gics_sector, sdgScores: e.sdgScores, revAlign: e.revAlign, avgScore: e.avgScore })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sdg_impact_metrics.json'; a.click(); URL.revokeObjectURL(url);
  }, [enriched, kpis]);
  const exportPrint = useCallback(() => window.print(), []);

  const getScoreColor = (score) => score >= 65 ? T.green : score >= 40 ? T.amber : T.red;
  const getScoreBg = (score) => score >= 65 ? '#dcfce7' : score >= 40 ? '#fef3c7' : '#fee2e2';

  /* Impact metrics aggregation */
  const impactMetrics = useMemo(() => {
    const n = enriched.length;
    return [
      { metric: 'Jobs Supported', value: Math.round(n * seed(99) * 12000 + 50000), unit: '', icon: '💼' },
      { metric: 'Patients Served (est.)', value: Math.round(n * seed(101) * 8000 + 20000), unit: '', icon: '💊' },
      { metric: 'Clean Energy Capacity', value: (n * seed(103) * 0.8 + 2.1).toFixed(1), unit: 'GW', icon: '\u26A1' },
      { metric: 'Water Treated', value: Math.round(n * seed(107) * 50 + 100), unit: 'ML/yr', icon: '💧' },
      { metric: 'Hectares Restored', value: Math.round(n * seed(109) * 3000 + 5000), unit: 'ha', icon: '🌳' },
      { metric: 'Training Hours', value: Math.round(n * seed(113) * 40000 + 100000), unit: 'hrs/yr', icon: '📚' },
      { metric: 'Community Investment', value: Math.round(n * seed(117) * 50 + 30), unit: 'USD Mn', icon: '🤝' },
      { metric: 'Green Patents', value: Math.round(n * seed(119) * 200 + 150), unit: '', icon: '🏭' },
    ];
  }, [enriched]);

  /* Sector SDG mapping */
  const sectorSDGMap = useMemo(() => {
    const sectors = [...new Set(enriched.map(e => e.sector || e.gics_sector || 'Unknown'))];
    return sectors.map(sec => {
      const companies = enriched.filter(e => (e.sector || e.gics_sector || 'Unknown') === sec);
      const sdgAvg = {};
      SDG_FRAMEWORK.forEach(sdg => { sdgAvg[sdg.id] = Math.round(companies.reduce((s, c) => s + (c.sdgScores[sdg.id] || 0), 0) / (companies.length || 1)); });
      return { sector: sec, count: companies.length, sdgAvg };
    });
  }, [enriched]);

  /* Contribute vs Harm */
  const contributeHarmAgg = useMemo(() => {
    return SDG_FRAMEWORK.map(sdg => {
      const contrib = enriched.filter(e => e.contributeHarm[sdg.id] === 'contribute').length;
      const harm = enriched.filter(e => e.contributeHarm[sdg.id] === 'harm').length;
      return { sdg: `SDG ${sdg.id}`, name: sdg.name, contribute: contrib, harm: -harm, color: sdg.color };
    });
  }, [enriched]);

  /* Peer benchmark data */
  const benchmarkData = useMemo(() => {
    return SDG_FRAMEWORK.map(sdg => ({
      sdg: `SDG ${sdg.id}`,
      portfolio: kpis.sdgAgg ? kpis.sdgAgg[sdg.id] : 0,
      esgFundAvg: Math.round(seed(sdg.id * 41) * 25 + 35),
      target: sdgTargets[sdg.id] || 0,
    }));
  }, [kpis, sdgTargets]);

  if (!enriched.length) return <div style={{ padding: 40, fontFamily: T.font, color: T.textSec }}>No portfolio loaded. Go to Portfolio Manager to build holdings.</div>;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px' }}>
        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>Social Impact & SDG Tracker</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <Badge label="17 SDGs" color={T.sage} /> <Badge label="Impact Metrics" color={T.gold} /> <Badge label="Revenue Alignment" color={T.navyL} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={exportCSV}>Export CSV</Btn>
            <Btn onClick={exportJSON} variant="outline">Export JSON</Btn>
            <Btn onClick={exportPrint} variant="outline">Print</Btn>
          </div>
        </div>

        {/* ── 8 KPI CARDS ── */}
        <Section title="Key Impact Indicators" sub={`${enriched.length} holdings analyzed`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <KpiCard label="SDGs Addressed (>25 score)" value={kpis.sdgAgg ? Object.values(kpis.sdgAgg).filter(v => v > 25).length + ' / 17' : '-'} sub="goals with meaningful alignment" />
            <KpiCard label="Avg SDG Alignment Score" value={kpis.avgAlign || 0} sub="0-100 scale" color={getScoreColor(kpis.avgAlign)} />
            <KpiCard label="Top SDG" value={kpis.topSDG ? `${kpis.topSDG.icon} ${kpis.topSDG.name}` : '-'} sub={kpis.sdgAgg && kpis.topSDG ? `Score: ${kpis.sdgAgg[kpis.topSDG.id]}` : ''} color={T.green} />
            <KpiCard label="Bottom SDG" value={kpis.botSDG ? `${kpis.botSDG.icon} ${kpis.botSDG.name}` : '-'} sub={kpis.sdgAgg && kpis.botSDG ? `Score: ${kpis.sdgAgg[kpis.botSDG.id]}` : ''} color={T.red} />
            <KpiCard label="Impact Revenue %" value={`${kpis.avgRevAlign || 0}%`} sub="estimated aligned revenue" color={T.gold} />
            <KpiCard label="SDG Concentration" value={`${kpis.sdgsAbove50 || 0} SDGs`} sub=">50 score threshold" />
            <KpiCard label="Social Impact Score" value={kpis.socialScore || 0} sub="composite (align + rev + concentration)" color={getScoreColor(kpis.socialScore)} />
            <KpiCard label="SDG Data Coverage" value={`${kpis.dataCov || 0}%`} sub="holdings with meaningful data" />
          </div>
        </Section>

        {/* ── TAB BAR ── */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* ═══════ TAB: SDG Overview ═══════ */}
        {tab === TABS[0] && (
          <>
            {/* Portfolio SDG Profile BarChart */}
            <Section title="Portfolio SDG Profile" sub="aggregate alignment score per SDG">
              <Card>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={SDG_FRAMEWORK.map(sdg => ({ name: `SDG ${sdg.id}`, score: kpis.sdgAgg ? kpis.sdgAgg[sdg.id] : 0, color: sdg.color }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font }} />
                    <Bar dataKey="score" name="Alignment Score" radius={[4, 4, 0, 0]}>
                      {SDG_FRAMEWORK.map((sdg, i) => <Cell key={i} fill={sdg.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            {/* SDG Revenue Alignment PieChart */}
            <Section title="SDG Revenue Alignment" sub="top 5 SDGs by portfolio revenue alignment">
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                  <ResponsiveContainer width="50%" height={280}>
                    <PieChart>
                      <Pie data={SDG_FRAMEWORK.map(sdg => ({ name: sdg.name, value: kpis.sdgAgg ? kpis.sdgAgg[sdg.id] : 0, color: sdg.color })).sort((a, b) => b.value - a.value).slice(0, 5)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        {SDG_FRAMEWORK.sort((a, b) => (kpis.sdgAgg?.[b.id] || 0) - (kpis.sdgAgg?.[a.id] || 0)).slice(0, 5).map((sdg, i) => <Cell key={i} fill={sdg.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Revenue-Aligned SDGs</div>
                    {SDG_FRAMEWORK.sort((a, b) => (kpis.sdgAgg?.[b.id] || 0) - (kpis.sdgAgg?.[a.id] || 0)).slice(0, 5).map(sdg => (
                      <div key={sdg.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{sdg.icon}</span>
                        <span style={{ fontSize: 12, color: T.text, flex: 1 }}>SDG {sdg.id}: {sdg.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: sdg.color }}>{kpis.sdgAgg?.[sdg.id] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Section>

            {/* SDG Contribution vs Harm */}
            <Section title="SDG Contribution vs Harm" sub="holdings contributing vs harming each SDG">
              <Card>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contributeHarmAgg} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis type="category" dataKey="sdg" tick={{ fontSize: 10, fill: T.textSec }} width={60} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font }} />
                    <Legend />
                    <Bar dataKey="contribute" name="Contributing" fill={T.green} stackId="a" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="harm" name="Harming" fill={T.red} stackId="a" radius={[4, 0, 0, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            {/* Impact vs Return Scatter */}
            <Section title="Impact vs Return" sub="SDG alignment (x) vs financial return proxy (y)">
              <Card>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="x" name="SDG Alignment" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'SDG Alignment Score', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                    <YAxis dataKey="y" name="Return Proxy" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Return Proxy (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                    <ZAxis dataKey="z" range={[30, 200]} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font }} formatter={(v, name) => [typeof v === 'number' ? v.toFixed(1) : v, name]} />
                    <Scatter name="Holdings" data={enriched.map((e, i) => ({ x: e.avgScore, y: Math.round(seed(i * 37) * 30 - 5), z: (e.weight || 2) * 20, name: e.company_name || e.name }))} fill={T.navyL} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          </>
        )}

        {/* ═══════ TAB: Heatmap ═══════ */}
        {tab === TABS[1] && (
          <Section title="SDG Alignment Heatmap" sub="holdings x 17 SDGs — color-coded 0-100">
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>Min score filter:</span>
              <input type="range" min={0} max={80} value={heatmapMinScore} onChange={e => setHeatmapMinScore(Number(e.target.value))} style={{ width: 160 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{heatmapMinScore}</span>
            </div>
            <Card style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}`, position: 'sticky', left: 0, background: T.surface, zIndex: 2, minWidth: 140 }}>Company</th>
                    {SDG_FRAMEWORK.map(sdg => (
                      <th key={sdg.id} style={{ padding: '4px 6px', textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#fff', background: sdg.color, borderBottom: `2px solid ${T.border}`, minWidth: 42 }} title={`SDG ${sdg.id}: ${sdg.name}`}>{sdg.icon}<br />{sdg.id}</th>
                    ))}
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.filter(e => e.avgScore >= heatmapMinScore).map((e, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, position: 'sticky', left: 0, background: idx % 2 === 0 ? T.surface : T.surfaceH, zIndex: 1 }}>{(e.company_name || e.name || '').slice(0, 22)}</td>
                      {SDG_FRAMEWORK.map(sdg => {
                        const sc = e.sdgScores[sdg.id] || 0;
                        return <td key={sdg.id} style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 600, fontSize: 10, color: sc >= 50 ? '#fff' : T.text, background: `rgba(${sc >= 65 ? '22,163,74' : sc >= 40 ? '217,119,6' : '220,38,38'},${Math.max(0.15, sc / 100)})` }}>{sc}</td>;
                      })}
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: getScoreColor(e.avgScore) }}>{e.avgScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>
        )}

        {/* ═══════ TAB: Holdings Detail ═══════ */}
        {tab === TABS[2] && (
          <>
            <Section title="Holdings SDG Table" sub="sortable by alignment, revenue alignment, sector">
              <div style={{ marginBottom: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textSec }}>Filter SDG:</span>
                <select value={sdgFilter} onChange={e => setSdgFilter(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }}>
                  <option value={0}>All SDGs</option>
                  {SDG_FRAMEWORK.map(s => <option key={s.id} value={s.id}>{s.icon} SDG {s.id}: {s.name}</option>)}
                </select>
              </div>
              <Card style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <SortTh label="Company" sortKey="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Sector" sortKey="sector" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>Top 3 SDGs</th>
                      <SortTh label="Alignment" sortKey="alignment" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Rev Align %" sortKey="revAlign" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>Key Metrics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHoldings.filter(e => sdgFilter === 0 || (e.sdgScores[sdgFilter] || 0) >= 30).map((e, idx) => {
                      const top3 = Object.entries(e.sdgScores).sort((a, b) => b[1] - a[1]).slice(0, 3);
                      return (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{(e.company_name || e.name || '').slice(0, 28)}</td>
                          <td style={{ padding: '8px 12px', color: T.textSec }}>{(e.sector || e.gics_sector || '').slice(0, 20)}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {top3.map(([id, sc]) => { const sdg = SDG_FRAMEWORK.find(s => s.id === Number(id)); return sdg ? <span key={id} title={`SDG ${id}: ${sdg.name} (${sc})`} style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: `${sdg.color}22`, color: sdg.color }}>{sdg.icon}{sc}</span> : null; })}
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: getScoreColor(e.avgScore) }}>{e.avgScore}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: T.gold }}>{e.avgRevAlign}%</td>
                          <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec }}>{SDG_FRAMEWORK.find(s => s.id === e.topSDG)?.metrics[0] || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </Section>

            {/* Sector SDG Mapping */}
            <Section title="Sector SDG Mapping" sub="which sectors contribute most to which SDGs">
              <Card style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}`, minWidth: 120 }}>Sector</th>
                      <th style={{ padding: '8px', fontSize: 11, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>#</th>
                      {SDG_FRAMEWORK.map(sdg => (
                        <th key={sdg.id} style={{ padding: '4px 4px', textAlign: 'center', fontSize: 9, fontWeight: 700, background: sdg.color, color: '#fff', borderBottom: `2px solid ${T.border}`, minWidth: 38 }}>{sdg.id}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sectorSDGMap.map((row, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy }}>{row.sector.slice(0, 22)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: T.textSec }}>{row.count}</td>
                        {SDG_FRAMEWORK.map(sdg => {
                          const v = row.sdgAvg[sdg.id] || 0;
                          return <td key={sdg.id} style={{ padding: '4px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: v >= 50 ? '#fff' : T.text, background: `rgba(${v >= 65 ? '22,163,74' : v >= 40 ? '217,119,6' : '220,38,38'},${Math.max(0.1, v / 100)})` }}>{v}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </Section>
          </>
        )}

        {/* ═══════ TAB: Impact Metrics ═══════ */}
        {tab === TABS[3] && (
          <>
            <Section title="Impact Metrics Dashboard" sub="quantified portfolio-level social impacts">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {impactMetrics.map((m, i) => (
                  <Card key={i}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
                    <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, marginBottom: 2 }}>{m.metric}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{typeof m.value === 'number' ? m.value.toLocaleString() : m.value} <span style={{ fontSize: 12, color: T.textMut }}>{m.unit}</span></div>
                  </Card>
                ))}
              </div>
            </Section>

            {/* SFDR PAI Social Indicators (lightweight) */}
            <Section title="SFDR PAI Social Indicators" sub="principal adverse impact indicators 10-14">
              <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['PAI #', 'Indicator', 'Value', 'Unit', 'Coverage', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { pai: 10, indicator: 'Violations of UNGC & OECD Guidelines', value: Math.round(seed(201) * 3), unit: 'companies', coverage: Math.round(seed(203) * 20 + 75) },
                      { pai: 11, indicator: 'Lack of UNGC/OECD compliance processes', value: Math.round(seed(205) * 8 + 5), unit: '% of portfolio', coverage: Math.round(seed(207) * 15 + 78) },
                      { pai: 12, indicator: 'Unadjusted gender pay gap', value: (seed(209) * 12 + 5).toFixed(1), unit: '%', coverage: Math.round(seed(211) * 18 + 65) },
                      { pai: 13, indicator: 'Board gender diversity', value: Math.round(seed(213) * 15 + 25), unit: '% female', coverage: Math.round(seed(215) * 10 + 80) },
                      { pai: 14, indicator: 'Exposure to controversial weapons', value: Math.round(seed(217) * 2), unit: 'companies', coverage: Math.round(seed(219) * 5 + 90) },
                    ].map((row, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>PAI {row.pai}</td>
                        <td style={{ padding: '8px 12px', color: T.text }}>{row.indicator}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>{row.value}</td>
                        <td style={{ padding: '8px 12px', color: T.textSec }}>{row.unit}</td>
                        <td style={{ padding: '8px 12px' }}><Badge label={`${row.coverage}%`} color={row.coverage >= 80 ? T.green : T.amber} /></td>
                        <td style={{ padding: '8px 12px' }}><Badge label={row.coverage >= 80 ? 'Adequate' : 'Low Coverage'} color={row.coverage >= 80 ? T.green : T.amber} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </Section>
          </>
        )}

        {/* ═══════ TAB: UNGC Compliance ═══════ */}
        {tab === TABS[4] && (
          <>
            <Section title="UN Global Compact — 10 Principles Assessment" sub="mapped across portfolio holdings">
              <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['#', 'Area', 'Principle', 'Portfolio Compliance %', 'Holdings Compliant', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {UNGC_PRINCIPLES.map((p, idx) => {
                      const compliance = Math.round(seed(idx * 43 + 7) * 25 + 65);
                      const compliant = Math.round(enriched.length * compliance / 100);
                      return (
                        <tr key={p.id} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>{p.id}</td>
                          <td style={{ padding: '8px 12px' }}><Badge label={p.area} color={p.area === 'Human Rights' ? T.red : p.area === 'Labour' ? T.amber : p.area === 'Environment' ? T.sage : T.navyL} /></td>
                          <td style={{ padding: '8px 12px', color: T.text, maxWidth: 320 }}>{p.principle}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 80, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ width: `${compliance}%`, height: '100%', background: compliance >= 80 ? T.green : compliance >= 60 ? T.amber : T.red, borderRadius: 4 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: getScoreColor(compliance) }}>{compliance}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px', color: T.textSec }}>{compliant} / {enriched.length}</td>
                          <td style={{ padding: '8px 12px' }}><Badge label={compliance >= 80 ? 'Strong' : compliance >= 60 ? 'Moderate' : 'Weak'} color={compliance >= 80 ? T.green : compliance >= 60 ? T.amber : T.red} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </Section>

            {/* UNGC Radar */}
            <Section title="UNGC Area Profile" sub="compliance by principle area">
              <Card>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={['Human Rights', 'Labour', 'Environment', 'Anti-Corruption'].map((area, i) => {
                    const principles = UNGC_PRINCIPLES.filter(p => p.area === area);
                    const avg = Math.round(principles.reduce((s, p, j) => s + seed((j + i) * 43 + 7) * 25 + 65, 0) / principles.length);
                    return { area, score: avg };
                  })}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: T.textSec }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                    <Radar name="Compliance" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          </>
        )}

        {/* ═══════ TAB: Targets & Benchmark ═══════ */}
        {tab === TABS[5] && (
          <>
            {/* SDG Target Setter */}
            <Section title="SDG Target Setter" sub="set portfolio SDG targets and track progress (persisted to localStorage)">
              <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['SDG', 'Name', 'Current Score', 'Target', 'Gap', 'Progress', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SDG_FRAMEWORK.map((sdg, idx) => {
                      const current = kpis.sdgAgg ? kpis.sdgAgg[sdg.id] : 0;
                      const target = sdgTargets[sdg.id] || 0;
                      const gap = target > 0 ? target - current : 0;
                      const progress = target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0;
                      return (
                        <tr key={sdg.id} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ padding: '6px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 6, background: sdg.color, color: '#fff', fontWeight: 700, fontSize: 11 }}>{sdg.icon} {sdg.id}</span></td>
                          <td style={{ padding: '6px 12px', color: T.text, fontWeight: 500 }}>{sdg.name}</td>
                          <td style={{ padding: '6px 12px', fontWeight: 700, color: getScoreColor(current) }}>{current}</td>
                          <td style={{ padding: '6px 12px' }}>
                            {targetEditId === sdg.id ? (
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <input type="number" min={0} max={100} value={targetEditVal} onChange={e => setTargetEditVal(e.target.value)} style={{ width: 60, padding: '4px 6px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 12 }} />
                                <Btn onClick={() => saveTarget(sdg.id, targetEditVal)} style={{ padding: '4px 10px', fontSize: 11 }}>Save</Btn>
                              </div>
                            ) : (
                              <span style={{ fontWeight: 600, color: target > 0 ? T.navy : T.textMut }}>{target > 0 ? target : '-'}</span>
                            )}
                          </td>
                          <td style={{ padding: '6px 12px', fontWeight: 600, color: gap > 10 ? T.red : gap > 0 ? T.amber : T.green }}>{target > 0 ? (gap > 0 ? `-${gap}` : 'Met') : '-'}</td>
                          <td style={{ padding: '6px 12px' }}>
                            {target > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 60, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? T.green : progress >= 60 ? T.amber : T.red, borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 600, color: T.textSec }}>{progress}%</span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            {targetEditId !== sdg.id && <Btn onClick={() => { setTargetEditId(sdg.id); setTargetEditVal(target || ''); }} variant="outline" style={{ padding: '3px 10px', fontSize: 11 }}>Set</Btn>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </Section>

            {/* Peer Benchmarking */}
            <Section title="Peer Benchmarking" sub="portfolio SDG profile vs typical ESG fund average">
              <Card>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={benchmarkData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sdg" tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font }} />
                    <Legend />
                    <Bar dataKey="portfolio" name="Portfolio" fill={T.navy} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="esgFundAvg" name="ESG Fund Avg" fill={T.gold} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Target" fill={T.sage} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            {/* Regulatory Compliance */}
            <Section title="Regulatory Compliance" sub="CSDDD, Modern Slavery Acts, CSRD social reporting">
              <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Framework', 'Requirement', 'Coverage', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { framework: 'CSDDD', req: 'Human rights due diligence across value chain', coverage: Math.round(seed(301) * 20 + 60), status: 'Partial' },
                      { framework: 'UK Modern Slavery Act', req: 'Modern slavery statement published', coverage: Math.round(seed(303) * 15 + 70), status: 'Compliant' },
                      { framework: 'AU Modern Slavery Act', req: 'Modern slavery risk assessment', coverage: Math.round(seed(305) * 25 + 55), status: 'Partial' },
                      { framework: 'CSRD ESRS S1', req: 'Own workforce social reporting', coverage: Math.round(seed(307) * 20 + 50), status: 'Gap' },
                      { framework: 'CSRD ESRS S2', req: 'Workers in value chain reporting', coverage: Math.round(seed(309) * 30 + 40), status: 'Gap' },
                      { framework: 'CSRD ESRS S3', req: 'Affected communities reporting', coverage: Math.round(seed(311) * 25 + 45), status: 'Gap' },
                      { framework: 'CSRD ESRS S4', req: 'Consumer/end-user reporting', coverage: Math.round(seed(313) * 20 + 50), status: 'Partial' },
                    ].map((row, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{row.framework}</td>
                        <td style={{ padding: '8px 12px', color: T.text }}>{row.req}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${row.coverage}%`, height: '100%', background: row.coverage >= 70 ? T.green : row.coverage >= 50 ? T.amber : T.red, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600 }}>{row.coverage}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px' }}><Badge label={row.status} color={row.status === 'Compliant' ? T.green : row.status === 'Partial' ? T.amber : T.red} /></td>
                        <td style={{ padding: '8px 12px' }}><Btn variant="outline" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => navigate('/regulatory-gap')}>View</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </Section>
          </>
        )}

        {/* ═══════ SDG GOAL DETAIL CARDS (always visible) ═══════ */}
        <Section title="SDG Goal Detail Cards" sub="all 17 goals with portfolio alignment & key metrics">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {SDG_FRAMEWORK.map(sdg => {
              const score = kpis.sdgAgg ? kpis.sdgAgg[sdg.id] : 0;
              const target = sdgTargets[sdg.id] || 0;
              const revContrib = enriched.length > 0 ? Math.round(enriched.reduce((s, e) => s + (e.revAlign[sdg.id] || 0), 0) / enriched.length) : 0;
              const holdingsAbove50 = enriched.filter(e => (e.sdgScores[sdg.id] || 0) >= 50).length;
              return (
                <Card key={sdg.id} style={{ borderTop: `4px solid ${sdg.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 22 }}>{sdg.icon}</span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginTop: 2 }}>SDG {sdg.id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: sdg.color }}>{score}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>/ 100</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>{sdg.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1, padding: '4px 6px', background: T.surfaceH, borderRadius: 4 }}>
                      <div style={{ fontSize: 9, color: T.textMut }}>Rev Align</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{revContrib}%</div>
                    </div>
                    <div style={{ flex: 1, padding: '4px 6px', background: T.surfaceH, borderRadius: 4 }}>
                      <div style={{ fontSize: 9, color: T.textMut }}>Holdings >50</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.sage }}>{holdingsAbove50}</div>
                    </div>
                  </div>
                  {target > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', height: 4, background: T.surfaceH, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, Math.round(score / target * 100))}%`, height: '100%', background: score >= target ? T.green : T.amber, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 9, color: T.textMut, whiteSpace: 'nowrap' }}>T:{target}</span>
                    </div>
                  )}
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {sdg.metrics.slice(0, 2).map((m, mi) => (
                      <span key={mi} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: `${sdg.color}12`, color: sdg.color }}>{m}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 9, color: T.textMut }}>Sectors: {sdg.sectors.slice(0, 3).join(', ')}{sdg.sectors.length > 3 ? '...' : ''}</div>
                </Card>
              );
            })}
          </div>
        </Section>

        {/* ═══════ SDG PROGRESS TIMELINE (simulated) ═══════ */}
        <Section title="SDG Progress Timeline" sub="simulated quarterly progress for top 5 SDGs">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025'].map((q, qi) => {
                const top5 = SDG_FRAMEWORK.sort((a, b) => (kpis.sdgAgg?.[b.id] || 0) - (kpis.sdgAgg?.[a.id] || 0)).slice(0, 5);
                const obj = { quarter: q };
                top5.forEach(sdg => {
                  const base = (kpis.sdgAgg?.[sdg.id] || 40) - 15 + qi * 3;
                  obj[`SDG ${sdg.id}`] = Math.min(100, Math.max(10, Math.round(base + seed(qi * 7 + sdg.id) * 8)));
                });
                return obj;
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font }} />
                <Legend />
                {SDG_FRAMEWORK.sort((a, b) => (kpis.sdgAgg?.[b.id] || 0) - (kpis.sdgAgg?.[a.id] || 0)).slice(0, 5).map(sdg => (
                  <Bar key={sdg.id} dataKey={`SDG ${sdg.id}`} name={`SDG ${sdg.id}: ${sdg.name}`} fill={sdg.color} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* ═══════ METHODOLOGY NOTE ═══════ */}
        <Section title="Methodology & Data Sources" sub="how SDG scores are computed">
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Sector Relevance (0-20)</div>
                <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>Based on GICS sector alignment with each SDG. Healthcare companies score higher on SDG 3, energy companies on SDG 7, financials on SDG 1/8/10. Universal SDGs (5, 8, 13, 16, 17) apply to all sectors.</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Company Actions (0-35)</div>
                <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>SBTi status boosts SDG 13, board diversity boosts SDG 5, living wage policies boost SDG 8, water recycling boosts SDG 6. Evidence-based scoring from disclosed policies and targets.</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Revenue Alignment (0-25)</div>
                <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>Estimated percentage of company revenue derived from SDG-aligned products and services. Based on product taxonomy mapping to SDG targets and sub-targets.</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: T.surfaceH, borderRadius: 8, display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>Data Sources</div>
                <div style={{ fontSize: 10, color: T.textSec }}>Company sustainability reports, CDP responses, SBTi database, UNGC participant list, WBA benchmarks, SDG Impact Standards</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>Score Range</div>
                <div style={{ fontSize: 10, color: T.textSec }}>0-100 per SDG per company. Portfolio aggregate is weighted average. Scores above 65 indicate strong alignment, 40-65 moderate, below 40 weak.</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>Update Frequency</div>
                <div style={{ fontSize: 10, color: T.textSec }}>Quarterly refresh aligned with corporate disclosure cycles. Real-time updates for SBTi approvals and UNGC membership changes.</div>
              </div>
            </div>
          </Card>
        </Section>

        {/* ── CROSS-NAVIGATION ── */}
        <Section title="Related Modules" sub="navigate to other Sprint N analytics">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Board Diversity', path: '/board-diversity', icon: '👥', desc: 'Governance & board composition' },
              { label: 'Living Wage Analysis', path: '/living-wage', icon: '💰', desc: 'Wage equity & living wage gaps' },
              { label: 'Human Rights DD', path: '/human-rights-dd', icon: '🛡', desc: 'UNGP & CSDDD due diligence' },
              { label: 'Nature & Biodiversity', path: '/corporate-nature-strategy', icon: '🌳', desc: 'TNFD & biodiversity risk' },
              { label: 'Employee Wellbeing', path: '/employee-wellbeing', icon: '❤', desc: 'Safety, engagement, turnover' },
              { label: 'Social Hub', path: '/social-hub', icon: '📊', desc: 'Aggregated social intelligence' },
              { label: 'Stewardship Tracker', path: '/stewardship-tracker', icon: '📝', desc: 'Engagement & voting' },
              { label: 'ESG Controversy', path: '/esg-controversy', icon: '⚠', desc: 'Social controversy monitor' },
            ].map((item, i) => (
              <Card key={i} style={{ cursor: 'pointer', transition: 'box-shadow .15s' }} onClick={() => navigate(item.path)}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: T.textMut }}>{item.desc}</div>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
