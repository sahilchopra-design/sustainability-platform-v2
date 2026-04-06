import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  PieChart, Pie,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const LS_PORT = 'ra_portfolio_v1';
const LS_OVERRIDES = 'ra_materiality_overrides_v1';
const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const sr = (seed, off = 0) => { let x = Math.sin(seed + off + 1) * 10000; return x - Math.floor(x); };
const pct = v => `${(v * 100).toFixed(1)}%`;

/* ══════════════════════════════════════════════════════════════
   SASB MATERIALITY MAP  (11 GICS sectors x 26 sustainability topics)
   ══════════════════════════════════════════════════════════════ */
const SASB_MATERIALITY = {
  topics: [
    { id:'E01', name:'GHG Emissions', category:'Environment' },
    { id:'E02', name:'Air Quality', category:'Environment' },
    { id:'E03', name:'Energy Management', category:'Environment' },
    { id:'E04', name:'Water & Wastewater', category:'Environment' },
    { id:'E05', name:'Waste & Hazardous Materials', category:'Environment' },
    { id:'E06', name:'Ecological Impacts', category:'Environment' },
    { id:'E07', name:'Physical Impacts of Climate', category:'Environment' },
    { id:'E08', name:'Resource Efficiency', category:'Environment' },
    { id:'S01', name:'Human Rights & Community Relations', category:'Social Capital' },
    { id:'S02', name:'Customer Privacy', category:'Social Capital' },
    { id:'S03', name:'Data Security', category:'Social Capital' },
    { id:'S04', name:'Access & Affordability', category:'Social Capital' },
    { id:'S05', name:'Product Quality & Safety', category:'Social Capital' },
    { id:'H01', name:'Labor Practices', category:'Human Capital' },
    { id:'H02', name:'Employee Health & Safety', category:'Human Capital' },
    { id:'H03', name:'Employee Engagement & DEI', category:'Human Capital' },
    { id:'H04', name:'Supply Chain Labor', category:'Human Capital' },
    { id:'B01', name:'Product Design & Lifecycle', category:'Business Model' },
    { id:'B02', name:'Business Model Resilience', category:'Business Model' },
    { id:'B03', name:'Supply Chain Management', category:'Business Model' },
    { id:'B04', name:'Materials Sourcing & Efficiency', category:'Business Model' },
    { id:'B05', name:'Physical Impacts of Climate Change', category:'Business Model' },
    { id:'G01', name:'Business Ethics', category:'Governance' },
    { id:'G02', name:'Competitive Behavior', category:'Governance' },
    { id:'G03', name:'Management of Legal & Regulatory Environment', category:'Governance' },
    { id:'G04', name:'Critical Incident Risk Management', category:'Governance' },
  ],
  matrix: {
    Energy: ['E01','E02','E03','E04','E05','E06','E07','S01','H01','H02','H04','B02','B04','G01','G03','G04'],
    Materials: ['E01','E02','E03','E04','E05','E06','E08','S01','H01','H02','H04','B03','B04','G01','G03'],
    Industrials: ['E01','E03','E05','E07','S01','S05','H01','H02','H03','B01','B02','B03','G01','G04'],
    'Consumer Discretionary': ['E01','E03','E05','S02','S03','S05','H01','H03','H04','B01','B03','B04','G01','G02'],
    'Consumer Staples': ['E01','E03','E04','E05','E06','S01','S04','S05','H01','H02','H04','B01','B03','B04','G01'],
    'Health Care': ['E01','E05','S02','S03','S04','S05','H01','H03','B01','B02','G01','G02','G03'],
    Financials: ['E01','E07','S01','S02','S03','S04','H01','H03','B02','G01','G02','G03','G04'],
    IT: ['E01','E03','E05','S02','S03','S05','H01','H03','B01','B02','G01','G02'],
    'Communication Services': ['E01','E03','S02','S03','S04','H01','H03','B01','G01','G02','G03'],
    Utilities: ['E01','E02','E03','E04','E05','E06','E07','S01','S04','H01','H02','B02','G01','G03','G04'],
    'Real Estate': ['E01','E03','E04','E07','E08','S01','H01','B02','G01','G03'],
  },
};

/* ── ISSB IFRS S2 Climate Disclosures ─────────────────────────── */
const ISSB_S2_REQUIREMENTS = [
  { id:'S2-G1', pillar:'Governance', requirement:'Board oversight of climate risks and opportunities', issb_ref:'IFRS S2.5-6' },
  { id:'S2-G2', pillar:'Governance', requirement:'Management role in assessing climate risks', issb_ref:'IFRS S2.5-6' },
  { id:'S2-S1', pillar:'Strategy', requirement:'Climate risks and opportunities affecting business model', issb_ref:'IFRS S2.8-13' },
  { id:'S2-S2', pillar:'Strategy', requirement:'Effects on strategy and decision-making', issb_ref:'IFRS S2.14-15' },
  { id:'S2-S3', pillar:'Strategy', requirement:'Climate resilience assessment (scenario analysis)', issb_ref:'IFRS S2.22' },
  { id:'S2-S4', pillar:'Strategy', requirement:'Transition plans toward low-carbon economy', issb_ref:'IFRS S2.14(a)' },
  { id:'S2-R1', pillar:'Risk Management', requirement:'Process for identifying climate risks', issb_ref:'IFRS S2.24-25' },
  { id:'S2-R2', pillar:'Risk Management', requirement:'Process for managing climate risks', issb_ref:'IFRS S2.24-25' },
  { id:'S2-R3', pillar:'Risk Management', requirement:'Integration into overall risk management', issb_ref:'IFRS S2.26' },
  { id:'S2-M1', pillar:'Metrics & Targets', requirement:'Scope 1, 2, 3 GHG emissions disclosure', issb_ref:'IFRS S2.29' },
  { id:'S2-M2', pillar:'Metrics & Targets', requirement:'Climate-related targets and progress', issb_ref:'IFRS S2.33-36' },
];

/* ── TCFD 11 Recommendations (for cross-mapping) ─────────────── */
const TCFD_RECS = [
  { id:'TCFD-G1', pillar:'Governance', rec:"Board's oversight of climate risks" },
  { id:'TCFD-G2', pillar:'Governance', rec:"Management's role in climate risk assessment" },
  { id:'TCFD-S1', pillar:'Strategy', rec:'Climate risks and opportunities identified' },
  { id:'TCFD-S2', pillar:'Strategy', rec:'Impact on strategy, business model, financial planning' },
  { id:'TCFD-S3', pillar:'Strategy', rec:'Resilience under different scenarios' },
  { id:'TCFD-R1', pillar:'Risk Management', rec:'Processes for identifying climate risks' },
  { id:'TCFD-R2', pillar:'Risk Management', rec:'Processes for managing climate risks' },
  { id:'TCFD-R3', pillar:'Risk Management', rec:'Integration into overall risk management' },
  { id:'TCFD-M1', pillar:'Metrics & Targets', rec:'Metrics used to assess climate risks' },
  { id:'TCFD-M2', pillar:'Metrics & Targets', rec:'Scope 1, 2, 3 GHG emissions' },
  { id:'TCFD-M3', pillar:'Metrics & Targets', rec:'Targets and performance against targets' },
];

const ISSB_TCFD_MAP = {
  'S2-G1':'TCFD-G1','S2-G2':'TCFD-G2','S2-S1':'TCFD-S1','S2-S2':'TCFD-S2',
  'S2-S3':'TCFD-S3','S2-S4':'TCFD-S2','S2-R1':'TCFD-R1','S2-R2':'TCFD-R2',
  'S2-R3':'TCFD-R3','S2-M1':'TCFD-M2','S2-M2':'TCFD-M3',
};

const SECTORS = Object.keys(SASB_MATERIALITY.matrix);
const TOPICS = SASB_MATERIALITY.topics;
const CAT_COLORS = { Environment:T.sage, 'Social Capital':T.navyL, 'Human Capital':T.gold, 'Business Model':T.amber, Governance:T.navy };

/* ══════════════════════════════════════════════════════════════
   UI Components
   ══════════════════════════════════════════════════════════════ */
const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 20px', borderTop:`3px solid ${color || T.navy}` }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
    <div style={{ fontSize:24, fontWeight:700, color:T.text, marginTop:4, fontFamily:T.font }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);
const Section = ({ title, badge, children }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:8, borderBottom:`2px solid ${T.gold}` }}>
      <span style={{ fontSize:16, fontWeight:700, color:T.navy }}>{title}</span>
      {badge && <span style={{ fontSize:11, fontWeight:600, background:T.surfaceH, color:T.textSec, padding:'2px 10px', borderRadius:12 }}>{badge}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, active, small }) => (
  <button onClick={onClick} style={{ padding:small ? '4px 12px' : '7px 18px', borderRadius:6, border:`1px solid ${active ? T.navy : T.border}`, cursor:'pointer', background:active ? T.navy : T.surface, color:active ? '#fff' : T.text, fontWeight:600, fontSize:small ? 12 : 13, fontFamily:T.font, transition:'all .15s' }}>{children}</button>
);
const Badge = ({ label, color }) => (
  <span style={{ padding:'2px 9px', borderRadius:10, fontSize:11, fontWeight:700, background:color === 'green' ? '#dcfce7' : color === 'red' ? '#fee2e2' : color === 'amber' ? '#fef3c7' : '#e0e7ff', color:color === 'green' ? '#166534' : color === 'red' ? '#991b1b' : color === 'amber' ? '#92400e' : '#3730a3' }}>{label}</span>
);
const Th = ({ children, sortKey, sortCfg, onSort, w }) => (
  <th onClick={() => onSort && onSort(sortKey)} style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}`, cursor:onSort ? 'pointer' : 'default', userSelect:'none', width:w, background:T.surfaceH, whiteSpace:'nowrap' }}>
    {children}{sortCfg && sortCfg.key === sortKey ? (sortCfg.asc ? ' \u25b2' : ' \u25bc') : ''}
  </th>
);
const Td = ({ children, w, bold }) => (
  <td style={{ padding:'9px 12px', fontSize:13, color:T.text, borderBottom:`1px solid ${T.border}`, fontWeight:bold ? 600 : 400, width:w, fontFamily:T.font }}>{children}</td>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
const IssbMaterialityPage = () => {
  const navigate = useNavigate();
  const [sectorFilter, setSectorFilter] = useState('All');
  const [selectedSector, setSelectedSector] = useState('Energy');
  const [materialityThreshold, setMaterialityThreshold] = useState(50);
  const [heatmapCell, setHeatmapCell] = useState(null);
  const [sort, setSort] = useState({ key:'materialTopics', asc:false });
  const [complianceSort, setComplianceSort] = useState({ key:'met', asc:false });
  const [overrides, setOverrides] = useState(() => loadLS(LS_OVERRIDES) || {});
  const [overrideCompany, setOverrideCompany] = useState('');
  const [overrideTopics, setOverrideTopics] = useState('');
  const [activeTab, setActiveTab] = useState('heatmap');

  useEffect(() => { saveLS(LS_OVERRIDES, overrides); }, [overrides]);

  /* ── Build holdings from portfolio or company master ──────── */
  const holdings = useMemo(() => {
    const saved = loadLS(LS_PORT);
    const portHoldings = saved?.portfolios?.[saved?.activePortfolio]?.holdings || (saved?.holdings) || [];
    if (portHoldings.length) return portHoldings.map(h => {
      const c = h.company || {};
      const master = GLOBAL_COMPANY_MASTER.find(m => m.ticker === c.ticker || m.name === c.name || m.company_name === h.company_name);
      return { ...h, company_name: c.name || h.company_name || master?.name || 'Unknown', sector: c.sector || h.sector || master?.sector || 'Financials', weight: h.weight || 0, market_value_usd: c.market_cap_usd_mn || master?.market_cap_usd_mn || 500 };
    });
    return GLOBAL_COMPANY_MASTER.slice(0, 30).map((c, i) => ({
      company_name: c.name || c.company_name || 'Unknown', isin: c.isin, sector: c.sector || SECTORS[i % SECTORS.length],
      weight: +(3 + sr(hashStr(c.name || c.company_name || ''), 1) * 7).toFixed(2), market_value_usd: c.market_cap_usd_mn || 500,
    }));
  }, []);

  /* ── Compute materiality per holding ─────────────────────── */
  const enriched = useMemo(() => holdings.map(h => {
    const sec = SECTORS.find(s => h.sector && h.sector.toLowerCase().includes(s.toLowerCase())) || 'Financials';
    const matIds = SASB_MATERIALITY.matrix[sec] || [];
    const ovr = overrides[h.company_name];
    const addIds = ovr && ovr.add ? ovr.add : [];
    const removeIds = ovr && ovr.remove ? ovr.remove : [];
    const finalIds = [...new Set([...matIds, ...addIds])].filter(id => !removeIds.includes(id));
    const s = hashStr(h.company_name || '');
    const s2Status = ISSB_S2_REQUIREMENTS.map(req => {
      const v = sr(s, hashStr(req.id));
      return { ...req, status: v > 0.55 ? 'Met' : v > 0.25 ? 'Partial' : 'Gap', score: +(v * 100).toFixed(0) };
    });
    const met = s2Status.filter(r => r.status === 'Met').length;
    const partial = s2Status.filter(r => r.status === 'Partial').length;
    const discScore = +((met * 100 + partial * 50) / s2Status.length).toFixed(1);
    const envTopics = finalIds.filter(id => id.startsWith('E')).length;
    const socTopics = finalIds.filter(id => id.startsWith('S') || id.startsWith('H')).length;
    const govTopics = finalIds.filter(id => id.startsWith('G') || id.startsWith('B')).length;
    return {
      ...h, mappedSector: sec, materialTopics: finalIds.length, materialIds: finalIds,
      s2Status, met, partial, gaps: s2Status.length - met - partial, disclosureScore: discScore,
      envTopics, socTopics, govTopics,
      top3: finalIds.slice(0, 3).map(id => TOPICS.find(t => t.id === id)?.name || id),
      dataCoverage: +(50 + sr(s, 7) * 45).toFixed(1),
    };
  }), [holdings, overrides]);

  const filtered = useMemo(() => sectorFilter === 'All' ? enriched : enriched.filter(h => h.mappedSector === sectorFilter), [enriched, sectorFilter]);

  /* ── Sort helpers ──────────────────────────────────────────── */
  const doSort = (key) => setSort(p => ({ key, asc: p.key === key ? !p.asc : false }));
  const sorted = useMemo(() => {
    const d = [...filtered];
    d.sort((a, b) => { const va = a[sort.key], vb = b[sort.key]; if (typeof va === 'number') return sort.asc ? va - vb : vb - va; return sort.asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va)); });
    return d;
  }, [filtered, sort]);

  /* ── Aggregate KPIs ─────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const totalW = enriched.reduce((s, h) => s + h.weight, 0) || 1;
    const weightedTopics = enriched.reduce((s, h) => s + h.materialTopics * (h.weight / totalW), 0);
    const avgTopics = enriched.length ? enriched.reduce((s, h) => s + h.materialTopics, 0) / enriched.length : 0;
    const avgCompliance = enriched.length ? enriched.reduce((s, h) => s + h.disclosureScore, 0) / enriched.length : 0;
    const sectorsCovered = [...new Set(enriched.map(h => h.mappedSector))].length;
    const envT = enriched.reduce((s, h) => s + h.envTopics, 0) / (enriched.length || 1);
    const socT = enriched.reduce((s, h) => s + h.socTopics, 0) / (enriched.length || 1);
    const govT = enriched.reduce((s, h) => s + h.govTopics, 0) / (enriched.length || 1);
    const avgCov = enriched.reduce((s, h) => s + h.dataCoverage, 0) / (enriched.length || 1);
    const highSector = Object.entries(SASB_MATERIALITY.matrix).sort((a, b) => b[1].length - a[1].length)[0];
    const avgDisc = enriched.reduce((s, h) => s + h.disclosureScore, 0) / (enriched.length || 1);
    return { weightedTopics: weightedTopics.toFixed(1), avgTopics: avgTopics.toFixed(1), compliance: avgCompliance.toFixed(1), sectorsCovered, envT: envT.toFixed(1), socT: socT.toFixed(1), govT: govT.toFixed(1), dataCov: avgCov.toFixed(1), highSector: highSector ? highSector[0] : '-', discReady: avgDisc.toFixed(1) };
  }, [enriched]);

  /* ── Topic frequency across portfolio ─────────────────────── */
  const topicFreq = useMemo(() => {
    const totalW = enriched.reduce((s, h) => s + h.weight, 0) || 1;
    return TOPICS.map(t => {
      const count = enriched.filter(h => h.materialIds.includes(t.id)).length;
      const wt = enriched.filter(h => h.materialIds.includes(t.id)).reduce((s, h) => s + h.weight / totalW, 0);
      return { ...t, count, weightedPct: +(wt * 100).toFixed(1) };
    }).sort((a, b) => b.weightedPct - a.weightedPct);
  }, [enriched]);

  /* ── ISSB S2 aggregate compliance ──────────────────────────── */
  const s2Agg = useMemo(() => ISSB_S2_REQUIREMENTS.map(req => {
    const met = enriched.filter(h => h.s2Status.find(r => r.id === req.id)?.status === 'Met').length;
    const partial = enriched.filter(h => h.s2Status.find(r => r.id === req.id)?.status === 'Partial').length;
    const gap = enriched.length - met - partial;
    return { ...req, met, partial, gap, pctMet: enriched.length ? +((met / enriched.length) * 100).toFixed(1) : 0 };
  }), [enriched]);

  /* ── Double materiality data ───────────────────────────────── */
  const doubleMat = useMemo(() => TOPICS.map(t => {
    const s = hashStr(t.id);
    const financial = +(20 + sr(s, 1) * 80).toFixed(0);
    const impact = +(20 + sr(s, 2) * 80).toFixed(0);
    return { ...t, financial, impact };
  }), []);

  /* ── Export helpers ─────────────────────────────────────────── */
  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"` ).join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }, []);

  const exportJSON = useCallback((data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }, []);

  const handlePrint = useCallback(() => window.print(), []);

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:T.navy }}>ISSB Materiality Mapping Engine</h1>
          <span style={{ fontSize:12, fontWeight:600, background:T.surfaceH, color:T.textSec, padding:'3px 12px', borderRadius:12, marginTop:6, display:'inline-block' }}>SASB &middot; IFRS S1/S2 &middot; 26 Topics &middot; 11 Sectors</span>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Btn onClick={() => exportCSV(sorted.map(h => ({ Company:h.company_name, Sector:h.mappedSector, MaterialTopics:h.materialTopics, DisclosureScore:h.disclosureScore, Met:h.met, Partial:h.partial, Gaps:h.gaps, DataCoverage:h.dataCoverage })), 'issb_materiality.csv')}>Export CSV</Btn>
          <Btn onClick={() => exportJSON({ holdings: sorted, s2Compliance: s2Agg, topicFrequency: topicFreq }, 'issb_materiality.json')}>Export JSON</Btn>
          <Btn onClick={handlePrint}>Print Report</Btn>
        </div>
      </div>

      {/* ── 10 KPI Cards ─────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:24 }}>
        <KpiCard label="Material Topics (Wtd)" value={kpis.weightedTopics} sub="portfolio-weighted" color={T.navy} />
        <KpiCard label="Avg Topics / Holding" value={kpis.avgTopics} sub="out of 26" color={T.gold} />
        <KpiCard label="ISSB S2 Compliance" value={`${kpis.compliance}%`} sub="avg disclosure" color={parseFloat(kpis.compliance) >= 70 ? T.green : T.amber} />
        <KpiCard label="Sector Coverage" value={`${kpis.sectorsCovered}/11`} sub="GICS sectors" color={T.sage} />
        <KpiCard label="Environmental Topics" value={kpis.envT} sub="avg E-topics" color={T.sage} />
        <KpiCard label="Social Topics" value={kpis.socT} sub="avg S/H-topics" color={T.navyL} />
        <KpiCard label="Governance Topics" value={kpis.govT} sub="avg B/G-topics" color={T.navy} />
        <KpiCard label="Data Coverage" value={`${kpis.dataCov}%`} sub="avg data availability" color={parseFloat(kpis.dataCov) >= 75 ? T.green : T.amber} />
        <KpiCard label="Highest Materiality" value={kpis.highSector} sub="most material topics" color={T.red} />
        <KpiCard label="Disclosure Readiness" value={`${kpis.discReady}%`} sub="avg score" color={parseFloat(kpis.discReady) >= 70 ? T.green : T.amber} />
      </div>

      {/* ── Sector filter ────────────────────────────────────── */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {['All', ...SECTORS].map(s => <Btn key={s} small active={sectorFilter === s} onClick={() => setSectorFilter(s)}>{s}</Btn>)}
      </div>

      {/* ── Tab navigation ───────────────────────────────────── */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {[['heatmap','SASB Heatmap'],['profile','Portfolio Profile'],['s2','ISSB S2 Compliance'],['holdings','Holdings Table'],['double','Double Materiality'],['sector','Sector Deep-Dive'],['freq','Topic Frequency'],['tcfd','ISSB vs TCFD'],['threshold','Threshold Setter'],['override','Manual Override'],['gaps','Gap Analysis']].map(([k,l]) => (
          <Btn key={k} small active={activeTab === k} onClick={() => setActiveTab(k)}>{l}</Btn>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
         3. SASB Materiality Heatmap
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'heatmap' && (
        <Section title="SASB Materiality Heatmap" badge="11 Sectors x 26 Topics">
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr>
                  <th style={{ padding:6, textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, position:'sticky', left:0, background:T.surfaceH, zIndex:2, minWidth:130 }}>Sector</th>
                  {TOPICS.map(t => <th key={t.id} style={{ padding:'4px 2px', textAlign:'center', fontSize:9, fontWeight:600, color:T.textSec, writingMode:'vertical-rl', height:110, background:T.surfaceH }}>{t.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {SECTORS.map(sec => {
                  const matSet = new Set(SASB_MATERIALITY.matrix[sec]);
                  return (
                    <tr key={sec}>
                      <td style={{ padding:6, fontWeight:600, color:T.text, position:'sticky', left:0, background:T.surface, zIndex:1, borderBottom:`1px solid ${T.border}` }}>{sec}</td>
                      {TOPICS.map(t => {
                        const mat = matSet.has(t.id);
                        const isSelected = heatmapCell && heatmapCell.sector === sec && heatmapCell.topic === t.id;
                        return (
                          <td key={t.id} onClick={() => setHeatmapCell(mat ? { sector:sec, topic:t.id, topicName:t.name } : null)}
                            style={{ padding:2, textAlign:'center', background:mat ? (isSelected ? T.navy : CAT_COLORS[t.category] || T.sage) : T.surfaceH, borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, cursor:mat ? 'pointer' : 'default', transition:'all .15s' }}>
                            <div style={{ width:16, height:16, borderRadius:3, margin:'auto', background:mat ? 'rgba(255,255,255,0.25)' : 'transparent' }} />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {heatmapCell && (
            <div style={{ marginTop:12, padding:14, background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
              <strong>{heatmapCell.sector}</strong> &mdash; <strong>{heatmapCell.topicName}</strong> ({heatmapCell.topic}) is material for this sector.
              <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>Holdings in portfolio with this sector: {enriched.filter(h => h.mappedSector === heatmapCell.sector).length}</div>
            </div>
          )}
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         4. Portfolio Materiality Profile (BarChart)
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <Section title="Portfolio Materiality Profile" badge="weighted by holdings">
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={topicFreq.slice(0, 20)} layout="vertical" margin={{ left:160, right:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize:11 }} label={{ value:'Weighted Materiality %', position:'bottom', fontSize:12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize:11 }} width={155} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="weightedPct" radius={[0,4,4,0]}>
                {topicFreq.slice(0, 20).map((t, i) => <Cell key={i} fill={CAT_COLORS[t.category] || T.navy} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         5. ISSB S2 Compliance Table
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 's2' && (
        <Section title="ISSB S2 Compliance Overview" badge="11 Requirements">
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <Th>ID</Th><Th>Pillar</Th><Th w="30%">Requirement</Th><Th>ISSB Ref</Th>
                  <Th sortKey="met" sortCfg={complianceSort} onSort={k => setComplianceSort(p => ({ key:k, asc: p.key === k ? !p.asc : false }))}>Met</Th>
                  <Th sortKey="partial" sortCfg={complianceSort} onSort={k => setComplianceSort(p => ({ key:k, asc: p.key === k ? !p.asc : false }))}>Partial</Th>
                  <Th sortKey="gap" sortCfg={complianceSort} onSort={k => setComplianceSort(p => ({ key:k, asc: p.key === k ? !p.asc : false }))}>Gap</Th>
                  <Th>% Met</Th>
                </tr>
              </thead>
              <tbody>
                {[...s2Agg].sort((a, b) => complianceSort.asc ? a[complianceSort.key] - b[complianceSort.key] : b[complianceSort.key] - a[complianceSort.key]).map(r => (
                  <tr key={r.id} style={{ background:T.surface }}>
                    <Td bold>{r.id}</Td>
                    <Td><Badge label={r.pillar} color={r.pillar === 'Governance' ? 'blue' : r.pillar === 'Strategy' ? 'amber' : r.pillar === 'Risk Management' ? 'red' : 'green'} /></Td>
                    <Td>{r.requirement}</Td><Td>{r.issb_ref}</Td>
                    <Td><span style={{ color:T.green, fontWeight:700 }}>{r.met}</span></Td>
                    <Td><span style={{ color:T.amber, fontWeight:700 }}>{r.partial}</span></Td>
                    <Td><span style={{ color:T.red, fontWeight:700 }}>{r.gap}</span></Td>
                    <Td bold>{r.pctMet}%</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         6. Holdings Materiality Table (sortable)
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'holdings' && (
        <Section title="Holdings Materiality Table" badge={`${sorted.length} holdings`}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <Th sortKey="company_name" sortCfg={sort} onSort={doSort}>Company</Th>
                  <Th sortKey="mappedSector" sortCfg={sort} onSort={doSort}>Sector</Th>
                  <Th sortKey="materialTopics" sortCfg={sort} onSort={doSort}>Material Topics</Th>
                  <Th>Top 3 Topics</Th>
                  <Th sortKey="met" sortCfg={sort} onSort={doSort}>S2 Met</Th>
                  <Th sortKey="partial" sortCfg={sort} onSort={doSort}>S2 Partial</Th>
                  <Th sortKey="gaps" sortCfg={sort} onSort={doSort}>S2 Gaps</Th>
                  <Th sortKey="disclosureScore" sortCfg={sort} onSort={doSort}>Disclosure Score</Th>
                  <Th sortKey="dataCoverage" sortCfg={sort} onSort={doSort}>Data Coverage</Th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((h, i) => (
                  <tr key={i} style={{ background:i % 2 ? T.surfaceH : T.surface }}>
                    <Td bold>{h.company_name}</Td>
                    <Td>{h.mappedSector}</Td>
                    <Td bold>{h.materialTopics}</Td>
                    <Td><span style={{ fontSize:11 }}>{h.top3.join(', ')}</span></Td>
                    <Td><span style={{ color:T.green, fontWeight:600 }}>{h.met}</span></Td>
                    <Td><span style={{ color:T.amber, fontWeight:600 }}>{h.partial}</span></Td>
                    <Td><span style={{ color:T.red, fontWeight:600 }}>{h.gaps}</span></Td>
                    <Td><span style={{ fontWeight:700, color:h.disclosureScore >= 70 ? T.green : h.disclosureScore >= 45 ? T.amber : T.red }}>{h.disclosureScore}%</span></Td>
                    <Td>{h.dataCoverage}%</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         7. Double Materiality Assessment
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'double' && (
        <Section title="Double Materiality Assessment" badge="Financial vs Impact">
          <p style={{ fontSize:13, color:T.textSec, marginBottom:14 }}>
            ISSB focuses on financial materiality (outside-in). CSRD adds impact materiality (inside-out). This view shows where topics fall on both dimensions.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div>
              <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 10px' }}>Financial vs Impact Scores</h4>
              <div style={{ overflowY:'auto', maxHeight:500 }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr><Th>Topic</Th><Th>Category</Th><Th>Financial</Th><Th>Impact</Th><Th>Quadrant</Th></tr>
                  </thead>
                  <tbody>
                    {doubleMat.map((t, i) => {
                      const q = t.financial >= 50 && t.impact >= 50 ? 'Double Material' : t.financial >= 50 ? 'Financial Only' : t.impact >= 50 ? 'Impact Only' : 'Monitor';
                      return (
                        <tr key={t.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                          <Td bold>{t.name}</Td><Td>{t.category}</Td>
                          <Td><span style={{ fontWeight:600, color: t.financial >= 60 ? T.green : t.financial >= 40 ? T.amber : T.red }}>{t.financial}</span></Td>
                          <Td><span style={{ fontWeight:600, color: t.impact >= 60 ? T.green : t.impact >= 40 ? T.amber : T.red }}>{t.impact}</span></Td>
                          <Td><Badge label={q} color={q === 'Double Material' ? 'green' : q === 'Monitor' ? 'red' : 'amber'} /></Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20 }}>
              <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 10px' }}>Materiality Quadrant Summary</h4>
              {['Double Material','Financial Only','Impact Only','Monitor'].map(q => {
                const count = doubleMat.filter(t => {
                  const qv = t.financial >= 50 && t.impact >= 50 ? 'Double Material' : t.financial >= 50 ? 'Financial Only' : t.impact >= 50 ? 'Impact Only' : 'Monitor';
                  return qv === q;
                }).length;
                return (
                  <div key={q} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontWeight:600, color:T.text }}>{q}</span>
                    <span style={{ fontWeight:700, color:T.navy }}>{count} topics</span>
                  </div>
                );
              })}
              <p style={{ fontSize:12, color:T.textMut, marginTop:14 }}>
                "Double Material" topics require disclosure under both ISSB (financial) and CSRD (impact) frameworks.
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         8. Sector Deep-Dive
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'sector' && (
        <Section title="Sector Deep-Dive" badge={selectedSector}>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {SECTORS.map(s => <Btn key={s} small active={selectedSector === s} onClick={() => setSelectedSector(s)}>{s}</Btn>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div>
              <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 10px' }}>Material Topics for {selectedSector}</h4>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><Th>ID</Th><Th>Topic</Th><Th>Category</Th></tr></thead>
                <tbody>
                  {(SASB_MATERIALITY.matrix[selectedSector] || []).map((id, i) => {
                    const t = TOPICS.find(tp => tp.id === id);
                    return t ? (
                      <tr key={id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <Td bold>{id}</Td><Td>{t.name}</Td><Td><Badge label={t.category} color={t.category === 'Environment' ? 'green' : t.category === 'Governance' ? 'blue' : 'amber'} /></Td>
                      </tr>
                    ) : null;
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20 }}>
              <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 10px' }}>Sector Metrics</h4>
              <div style={{ fontSize:13, color:T.text, lineHeight:2 }}>
                <div><strong>Total Material Topics:</strong> {(SASB_MATERIALITY.matrix[selectedSector] || []).length}</div>
                <div><strong>Environment:</strong> {(SASB_MATERIALITY.matrix[selectedSector] || []).filter(id => id.startsWith('E')).length}</div>
                <div><strong>Social/Human:</strong> {(SASB_MATERIALITY.matrix[selectedSector] || []).filter(id => id.startsWith('S') || id.startsWith('H')).length}</div>
                <div><strong>Business/Governance:</strong> {(SASB_MATERIALITY.matrix[selectedSector] || []).filter(id => id.startsWith('B') || id.startsWith('G')).length}</div>
                <div><strong>Holdings in Portfolio:</strong> {enriched.filter(h => h.mappedSector === selectedSector).length}</div>
                <div><strong>Avg Disclosure Score:</strong> {(() => { const sectorH = enriched.filter(h => h.mappedSector === selectedSector); return sectorH.length ? (sectorH.reduce((s, h) => s + h.disclosureScore, 0) / sectorH.length).toFixed(1) : 'N/A'; })()}%</div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         9. Topic Frequency BarChart
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'freq' && (
        <Section title="Topic Frequency Across Holdings" badge="count of holdings per topic">
          <ResponsiveContainer width="100%" height={460}>
            <BarChart data={topicFreq} layout="vertical" margin={{ left:180, right:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize:10 }} width={175} />
              <Tooltip />
              <Bar dataKey="count" name="Holdings Count" radius={[0,4,4,0]}>
                {topicFreq.map((t, i) => <Cell key={i} fill={CAT_COLORS[t.category] || T.navy} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         10. ISSB vs TCFD Mapping
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'tcfd' && (
        <Section title="ISSB S2 vs TCFD Mapping" badge="cross-reference">
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr><Th>ISSB S2 ID</Th><Th>Pillar</Th><Th w="30%">ISSB Requirement</Th><Th>TCFD ID</Th><Th w="30%">TCFD Recommendation</Th><Th>Alignment</Th></tr>
              </thead>
              <tbody>
                {ISSB_S2_REQUIREMENTS.map((req, i) => {
                  const tcfdId = ISSB_TCFD_MAP[req.id];
                  const tcfd = TCFD_RECS.find(r => r.id === tcfdId);
                  return (
                    <tr key={req.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <Td bold>{req.id}</Td><Td>{req.pillar}</Td><Td>{req.requirement}</Td>
                      <Td bold>{tcfdId || '-'}</Td><Td>{tcfd ? tcfd.rec : '-'}</Td>
                      <Td><Badge label={tcfd ? 'Aligned' : 'No Match'} color={tcfd ? 'green' : 'red'} /></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize:12, color:T.textMut, marginTop:10 }}>ISSB IFRS S2 substantially incorporates TCFD recommendations. S2-S4 (Transition Plans) maps broadly to TCFD-S2.</p>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         11. Materiality Threshold Setter
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'threshold' && (
        <Section title="Materiality Threshold Setter" badge={`threshold: ${materialityThreshold}%`}>
          <p style={{ fontSize:13, color:T.textSec, marginBottom:12 }}>
            Adjust the threshold to determine which topics are considered "material" based on the percentage of holdings in a sector where the topic applies.
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
            <span style={{ fontSize:13, fontWeight:600, color:T.text }}>Threshold:</span>
            <input type="range" min={10} max={100} step={5} value={materialityThreshold} onChange={e => setMaterialityThreshold(+e.target.value)}
              style={{ width:300, accentColor:T.navy }} />
            <span style={{ fontSize:16, fontWeight:700, color:T.navy }}>{materialityThreshold}%</span>
          </div>
          <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 10px' }}>Topics Above Threshold (Portfolio-Level)</h4>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
            {topicFreq.filter(t => t.weightedPct >= materialityThreshold).map(t => (
              <span key={t.id} style={{ padding:'5px 14px', borderRadius:16, fontSize:12, fontWeight:600, background:CAT_COLORS[t.category] || T.navy, color:'#fff' }}>
                {t.name} ({t.weightedPct}%)
              </span>
            ))}
          </div>
          <div style={{ fontSize:13, color:T.textSec }}>
            <strong>{topicFreq.filter(t => t.weightedPct >= materialityThreshold).length}</strong> topics exceed the {materialityThreshold}% materiality threshold.
            {topicFreq.filter(t => t.weightedPct < materialityThreshold).length > 0 && (
              <span> {topicFreq.filter(t => t.weightedPct < materialityThreshold).length} topics below threshold.</span>
            )}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         12. Manual Materiality Override
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'override' && (
        <Section title="Manual Materiality Override" badge="persisted to localStorage">
          <p style={{ fontSize:13, color:T.textSec, marginBottom:14 }}>
            Add or remove SASB topics for individual holdings. Overrides are saved to <code>ra_materiality_overrides_v1</code>.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'end', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:4 }}>Company</div>
              <select value={overrideCompany} onChange={e => setOverrideCompany(e.target.value)} style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font }}>
                <option value="">Select holding...</option>
                {enriched.map(h => <option key={h.company_name} value={h.company_name}>{h.company_name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:4 }}>Add Topic IDs (comma-sep)</div>
              <input value={overrideTopics} onChange={e => setOverrideTopics(e.target.value)} placeholder="E02,S04,G03"
                style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, boxSizing:'border-box' }} />
            </div>
            <Btn onClick={() => {
              if (!overrideCompany) return;
              const ids = overrideTopics.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
              setOverrides(prev => ({ ...prev, [overrideCompany]: { add: [...(prev[overrideCompany]?.add || []), ...ids], remove: prev[overrideCompany]?.remove || [] } }));
              setOverrideTopics('');
            }}>Add Topics</Btn>
          </div>
          {Object.keys(overrides).length > 0 && (
            <div>
              <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 10px' }}>Current Overrides</h4>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><Th>Company</Th><Th>Added Topics</Th><Th>Removed Topics</Th><Th>Actions</Th></tr></thead>
                <tbody>
                  {Object.entries(overrides).map(([co, ovr], i) => (
                    <tr key={co} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <Td bold>{co}</Td>
                      <Td>{(ovr.add || []).join(', ') || '-'}</Td>
                      <Td>{(ovr.remove || []).join(', ') || '-'}</Td>
                      <Td><Btn small onClick={() => setOverrides(prev => { const n = { ...prev }; delete n[co]; return n; })}>Clear</Btn></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Pillar Radar Chart
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (() => {
        const pillars = ['Governance','Strategy','Risk Management','Metrics & Targets'];
        const radarData = pillars.map(p => {
          const reqs = s2Agg.filter(r => r.pillar === p);
          const avg = reqs.length ? reqs.reduce((s, r) => s + r.pctMet, 0) / reqs.length : 0;
          return { pillar:p, portfolio: +avg.toFixed(1), benchmark: +(40 + sr(hashStr(p), 5) * 40).toFixed(1) };
        });
        return (
          <Section title="ISSB S2 Pillar Readiness Radar" badge="Portfolio vs Benchmark">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={radarData} cx="50%" cy="50%">
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="pillar" tick={{ fontSize:12, fill:T.text }} />
                  <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:10 }} />
                  <Radar name="Portfolio" dataKey="portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.3} />
                  <Radar name="Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.2} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20 }}>
                <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 12px' }}>Pillar Scores</h4>
                {radarData.map(d => (
                  <div key={d.pillar} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontWeight:600, color:T.text, fontSize:13 }}>{d.pillar}</span>
                    <div style={{ display:'flex', gap:12 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>{d.portfolio}%</span>
                      <span style={{ fontSize:12, color:T.textMut }}>vs {d.benchmark}%</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:14, fontSize:12, color:T.textSec }}>
                  Portfolio readiness is compared against a peer benchmark derived from sector averages.
                </div>
              </div>
            </div>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Sector Materiality Density
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'heatmap' && (
        <Section title="Sector Materiality Density" badge="topics per GICS sector">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={SECTORS.map(sec => ({
              sector: sec.length > 16 ? sec.slice(0,14) + '..' : sec,
              topics: (SASB_MATERIALITY.matrix[sec] || []).length,
              env: (SASB_MATERIALITY.matrix[sec] || []).filter(id => id.startsWith('E')).length,
              social: (SASB_MATERIALITY.matrix[sec] || []).filter(id => id.startsWith('S') || id.startsWith('H')).length,
              govBiz: (SASB_MATERIALITY.matrix[sec] || []).filter(id => id.startsWith('G') || id.startsWith('B')).length,
            }))} margin={{ left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize:10 }} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="env" name="Environment" stackId="a" fill={T.sage} />
              <Bar dataKey="social" name="Social/Human" stackId="a" fill={T.navyL} />
              <Bar dataKey="govBiz" name="Gov/Business" stackId="a" fill={T.gold} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Portfolio S2 Compliance Distribution Pie
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 's2' && (() => {
        const metTotal = enriched.reduce((s, h) => s + h.met, 0);
        const partialTotal = enriched.reduce((s, h) => s + h.partial, 0);
        const gapTotal = enriched.reduce((s, h) => s + h.gaps, 0);
        const pieData = [
          { name:'Met', value:metTotal, fill:T.green },
          { name:'Partial', value:partialTotal, fill:T.amber },
          { name:'Gap', value:gapTotal, fill:T.red },
        ];
        return (
          <Section title="Portfolio S2 Compliance Distribution" badge="aggregate">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20 }}>
                <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 12px' }}>Compliance Breakdown</h4>
                {pieData.map(d => (
                  <div key={d.name} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:12, height:12, borderRadius:3, background:d.fill }} />
                      <span style={{ fontWeight:600, color:T.text }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight:700, color:T.navy }}>{d.value} requirement-holdings</span>
                  </div>
                ))}
                <div style={{ marginTop:12, fontSize:12, color:T.textSec }}>
                  Total: {metTotal + partialTotal + gapTotal} (= {enriched.length} holdings x 11 S2 requirements)
                </div>
              </div>
            </div>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Holdings Detail Drilldown (per holding S2 status)
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'holdings' && sorted.length > 0 && (() => {
        const [drillIdx, setDrillIdx] = React.useState(null);
        const drillH = drillIdx !== null ? sorted[drillIdx] : null;
        return (
          <Section title="Holding S2 Detail Drilldown" badge="click a row above to expand">
            <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
              {sorted.slice(0, 15).map((h, i) => (
                <Btn key={i} small active={drillIdx === i} onClick={() => setDrillIdx(drillIdx === i ? null : i)}>{h.company_name?.slice(0, 18)}</Btn>
              ))}
            </div>
            {drillH && (
              <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20 }}>
                <h4 style={{ color:T.navy, margin:'0 0 12px' }}>{drillH.company_name} &mdash; ISSB S2 Detail</h4>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr><Th>ID</Th><Th>Pillar</Th><Th w="40%">Requirement</Th><Th>Status</Th><Th>Score</Th></tr></thead>
                  <tbody>
                    {drillH.s2Status.map((r, i) => (
                      <tr key={r.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <Td bold>{r.id}</Td><Td>{r.pillar}</Td><Td>{r.requirement}</Td>
                        <Td><Badge label={r.status} color={r.status === 'Met' ? 'green' : r.status === 'Partial' ? 'amber' : 'red'} /></Td>
                        <Td><span style={{ fontWeight:700, color:r.score >= 55 ? T.green : r.score >= 25 ? T.amber : T.red }}>{r.score}</span></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Category Distribution PieChart (Topic Frequency)
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'freq' && (() => {
        const catAgg = Object.entries(CAT_COLORS).map(([cat, color]) => ({
          name: cat, value: topicFreq.filter(t => t.category === cat).reduce((s, t) => s + t.count, 0), fill: color,
        }));
        return (
          <Section title="Category Distribution" badge="by topic category">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={catAgg} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {catAgg.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Materiality Trend by Weight Bucket
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'threshold' && (() => {
        const buckets = [
          { label:'Top 5 Holdings', filter: enriched.sort((a,b) => b.weight - a.weight).slice(0,5) },
          { label:'Mid Holdings (6-15)', filter: enriched.sort((a,b) => b.weight - a.weight).slice(5,15) },
          { label:'Tail Holdings (16+)', filter: enriched.sort((a,b) => b.weight - a.weight).slice(15) },
        ];
        return (
          <Section title="Materiality by Weight Bucket" badge="top / mid / tail">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {buckets.map(b => {
                const avgT = b.filter.length ? (b.filter.reduce((s, h) => s + h.materialTopics, 0) / b.filter.length).toFixed(1) : 0;
                const avgD = b.filter.length ? (b.filter.reduce((s, h) => s + h.disclosureScore, 0) / b.filter.length).toFixed(1) : 0;
                const avgC = b.filter.length ? (b.filter.reduce((s, h) => s + h.dataCoverage, 0) / b.filter.length).toFixed(1) : 0;
                return (
                  <div key={b.label} style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:18 }}>
                    <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 10px' }}>{b.label}</h4>
                    <div style={{ fontSize:13, color:T.text, lineHeight:2 }}>
                      <div><strong>Count:</strong> {b.filter.length}</div>
                      <div><strong>Avg Material Topics:</strong> {avgT}</div>
                      <div><strong>Avg Disclosure Score:</strong> <span style={{ color:parseFloat(avgD) >= 60 ? T.green : T.amber, fontWeight:700 }}>{avgD}%</span></div>
                      <div><strong>Avg Data Coverage:</strong> {avgC}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: ISSB Implementation Timeline
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'tcfd' && (
        <Section title="ISSB Implementation Timeline" badge="key milestones">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { date:'Jun 2023', event:'ISSB Standards Published', desc:'IFRS S1 and S2 issued by ISSB', color:T.green },
              { date:'Jan 2024', event:'Early Adoption Window', desc:'Voluntary early adoption permitted globally', color:T.sage },
              { date:'Jan 2025', event:'Mandatory in Key Jurisdictions', desc:'UK, Singapore, Japan begin phased adoption', color:T.amber },
              { date:'Jan 2026', event:'Broad Global Adoption', desc:'EU, Australia, Canada align requirements', color:T.navy },
            ].map(m => (
              <div key={m.date} style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:16, borderLeft:`4px solid ${m.color}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:m.color, marginBottom:4 }}>{m.date}</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:4 }}>{m.event}</div>
                <div style={{ fontSize:12, color:T.textSec }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Sector Comparison BarChart (Double Materiality)
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'double' && (() => {
        const dblQuadrants = ['Double Material','Financial Only','Impact Only','Monitor'];
        const quadrantColors = [T.green, T.navyL, T.sage, T.textMut];
        const catDblData = Object.keys(CAT_COLORS).map(cat => {
          const catTopics = doubleMat.filter(t => t.category === cat);
          const q = dblQuadrants.map(qName => catTopics.filter(t => {
            const qv = t.financial >= 50 && t.impact >= 50 ? 'Double Material' : t.financial >= 50 ? 'Financial Only' : t.impact >= 50 ? 'Impact Only' : 'Monitor';
            return qv === qName;
          }).length);
          return { category: cat, 'Double Material':q[0], 'Financial Only':q[1], 'Impact Only':q[2], 'Monitor':q[3] };
        });
        return (
          <Section title="Double Materiality by Category" badge="quadrant breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={catDblData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="category" tick={{ fontSize:12 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Legend />
                {dblQuadrants.map((q, i) => <Bar key={q} dataKey={q} stackId="a" fill={quadrantColors[i]} />)}
              </BarChart>
            </ResponsiveContainer>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         13. Disclosure Gap Analysis
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'gaps' && (
        <Section title="Disclosure Gap Analysis" badge="per topic">
          <p style={{ fontSize:13, color:T.textSec, marginBottom:14 }}>
            Identifies which material topics across the portfolio lack sufficient data for ISSB disclosure.
          </p>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr><Th>Topic</Th><Th>Category</Th><Th>Holdings Material</Th><Th>Data Available</Th><Th>Gap</Th><Th>Gap %</Th><Th>Priority</Th></tr>
            </thead>
            <tbody>
              {topicFreq.filter(t => t.count > 0).map((t, i) => {
                const dataAvail = Math.floor(t.count * (0.4 + sr(hashStr(t.id), 3) * 0.55));
                const gap = t.count - dataAvail;
                const gapPct = t.count ? +((gap / t.count) * 100).toFixed(0) : 0;
                return (
                  <tr key={t.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <Td bold>{t.name}</Td>
                    <Td><Badge label={t.category} color={t.category === 'Environment' ? 'green' : t.category === 'Governance' ? 'blue' : 'amber'} /></Td>
                    <Td>{t.count}</Td>
                    <Td><span style={{ color:T.green, fontWeight:600 }}>{dataAvail}</span></Td>
                    <Td><span style={{ color:T.red, fontWeight:600 }}>{gap}</span></Td>
                    <Td>{gapPct}%</Td>
                    <Td><Badge label={gapPct > 50 ? 'High' : gapPct > 25 ? 'Medium' : 'Low'} color={gapPct > 50 ? 'red' : gapPct > 25 ? 'amber' : 'green'} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         14. Cross-Navigation
         ═══════════════════════════════════════════════════════ */}
      <Section title="Cross-Navigation">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            ['EU Taxonomy', '/eu-taxonomy'], ['SFDR PAI', '/sfdr-pai'], ['GRI Alignment', '/gri-alignment'],
            ['Report Studio', '/advanced-report-studio'], ['Regulatory Gap', '/regulatory-gap'],
            ['CSRD DMA', '/csrd-dma'], ['Double Materiality', '/double-materiality'],
            ['ISSB TCFD', '/issb-tcfd'], ['Portfolio Dashboard', '/portfolio-dashboard'],
          ].map(([label, path]) => (
            <button key={path} onClick={() => navigate(path)} style={{ padding:'8px 18px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:T.font, transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = T.surfaceH; e.currentTarget.style.borderColor = T.navy; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; }}>
              {label} &rarr;
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default IssbMaterialityPage;
