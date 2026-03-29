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
const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const sr = (seed, off = 0) => { let x = Math.sin(Math.abs(seed + off) * 9301 + 49297) * 233280; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════
   GRI STANDARD STRUCTURE
   ══════════════════════════════════════════════════════════════ */
const GRI_STANDARDS = {
  universal: [
    { id:'GRI 1', name:'Foundation 2021', description:'Purpose, system of standards, key concepts', required:true, disclosures:0 },
    { id:'GRI 2', name:'General Disclosures 2021', description:'Organization profile, governance, strategy, stakeholder engagement', required:true, disclosures:30 },
    { id:'GRI 3', name:'Material Topics 2021', description:'How material topics are determined and managed', required:true, disclosures:6 },
  ],
  topic: [
    { id:'GRI 201', name:'Economic Performance', category:'Economic', disclosures:4 },
    { id:'GRI 202', name:'Market Presence', category:'Economic', disclosures:2 },
    { id:'GRI 203', name:'Indirect Economic Impacts', category:'Economic', disclosures:2 },
    { id:'GRI 204', name:'Procurement Practices', category:'Economic', disclosures:1 },
    { id:'GRI 205', name:'Anti-corruption', category:'Economic', disclosures:3 },
    { id:'GRI 206', name:'Anti-competitive Behavior', category:'Economic', disclosures:1 },
    { id:'GRI 207', name:'Tax', category:'Economic', disclosures:4 },
    { id:'GRI 301', name:'Materials', category:'Environmental', disclosures:3 },
    { id:'GRI 302', name:'Energy', category:'Environmental', disclosures:5 },
    { id:'GRI 303', name:'Water and Effluents', category:'Environmental', disclosures:5 },
    { id:'GRI 304', name:'Biodiversity', category:'Environmental', disclosures:4 },
    { id:'GRI 305', name:'Emissions', category:'Environmental', disclosures:7 },
    { id:'GRI 306', name:'Waste', category:'Environmental', disclosures:5 },
    { id:'GRI 308', name:'Supplier Environmental Assessment', category:'Environmental', disclosures:2 },
    { id:'GRI 401', name:'Employment', category:'Social', disclosures:3 },
    { id:'GRI 402', name:'Labor/Management Relations', category:'Social', disclosures:1 },
    { id:'GRI 403', name:'Occupational Health and Safety', category:'Social', disclosures:10 },
    { id:'GRI 404', name:'Training and Education', category:'Social', disclosures:3 },
    { id:'GRI 405', name:'Diversity and Equal Opportunity', category:'Social', disclosures:2 },
    { id:'GRI 406', name:'Non-discrimination', category:'Social', disclosures:1 },
    { id:'GRI 407', name:'Freedom of Association', category:'Social', disclosures:1 },
    { id:'GRI 408', name:'Child Labor', category:'Social', disclosures:1 },
    { id:'GRI 409', name:'Forced or Compulsory Labor', category:'Social', disclosures:1 },
    { id:'GRI 413', name:'Local Communities', category:'Social', disclosures:2 },
    { id:'GRI 414', name:'Supplier Social Assessment', category:'Social', disclosures:2 },
    { id:'GRI 418', name:'Customer Privacy', category:'Social', disclosures:1 },
  ],
};

const ALL_TOPIC_STDS = GRI_STANDARDS.topic;
const TOTAL_DISCLOSURES = ALL_TOPIC_STDS.reduce((s, t) => s + t.disclosures, 0) + GRI_STANDARDS.universal.reduce((s, u) => s + u.disclosures, 0);
const CAT_COLORS = { Economic:T.gold, Environmental:T.sage, Social:T.navyL };
const CATEGORIES = ['Economic', 'Environmental', 'Social'];

/* ── BRSR Mapping (Indian companies) ─────────────────────────── */
const GRI_BRSR_MAP = {
  'GRI 302': { brsr:'Principle 6 - Energy', coverage:'High' },
  'GRI 305': { brsr:'Principle 6 - Emissions', coverage:'High' },
  'GRI 303': { brsr:'Principle 6 - Water', coverage:'Medium' },
  'GRI 306': { brsr:'Principle 6 - Waste', coverage:'Medium' },
  'GRI 403': { brsr:'Principle 3 - Employee Wellbeing', coverage:'High' },
  'GRI 405': { brsr:'Principle 5 - Human Rights', coverage:'Medium' },
  'GRI 205': { brsr:'Principle 1 - Ethics', coverage:'High' },
  'GRI 413': { brsr:'Principle 8 - Community', coverage:'Medium' },
  'GRI 401': { brsr:'Principle 3 - Employment', coverage:'Medium' },
  'GRI 201': { brsr:'Principle 9 - Customer Value', coverage:'Low' },
  'GRI 301': { brsr:'Principle 6 - Resource Use', coverage:'Medium' },
  'GRI 304': { brsr:'Principle 6 - Biodiversity', coverage:'Low' },
  'GRI 404': { brsr:'Principle 3 - Training', coverage:'Medium' },
  'GRI 418': { brsr:'Principle 9 - Data Privacy', coverage:'Medium' },
};

/* ── ISSB SASB Mapping ──────────────────────────────────────── */
const GRI_ISSB_MAP = {
  'GRI 305': { sasb:'E01 - GHG Emissions', alignment:'Direct' },
  'GRI 302': { sasb:'E03 - Energy Management', alignment:'Direct' },
  'GRI 303': { sasb:'E04 - Water & Wastewater', alignment:'Direct' },
  'GRI 306': { sasb:'E05 - Waste & Hazardous Materials', alignment:'Direct' },
  'GRI 304': { sasb:'E06 - Ecological Impacts', alignment:'Partial' },
  'GRI 403': { sasb:'H02 - Employee Health & Safety', alignment:'Direct' },
  'GRI 401': { sasb:'H01 - Labor Practices', alignment:'Partial' },
  'GRI 405': { sasb:'H03 - Employee Engagement & DEI', alignment:'Partial' },
  'GRI 205': { sasb:'G01 - Business Ethics', alignment:'Direct' },
  'GRI 206': { sasb:'G02 - Competitive Behavior', alignment:'Direct' },
  'GRI 418': { sasb:'S02 - Customer Privacy', alignment:'Direct' },
  'GRI 301': { sasb:'B04 - Materials Sourcing', alignment:'Partial' },
};

/* ── CSRD ESRS Mapping ──────────────────────────────────────── */
const GRI_CSRD_MAP = {
  'GRI 305': { esrs:'ESRS E1 - Climate Change', alignment:'High' },
  'GRI 302': { esrs:'ESRS E1 - Climate Change (Energy)', alignment:'High' },
  'GRI 303': { esrs:'ESRS E3 - Water & Marine Resources', alignment:'High' },
  'GRI 304': { esrs:'ESRS E4 - Biodiversity', alignment:'Medium' },
  'GRI 306': { esrs:'ESRS E5 - Resource Use & Circular Economy', alignment:'High' },
  'GRI 403': { esrs:'ESRS S1 - Own Workforce', alignment:'High' },
  'GRI 401': { esrs:'ESRS S1 - Own Workforce', alignment:'Medium' },
  'GRI 404': { esrs:'ESRS S1 - Own Workforce (Training)', alignment:'Medium' },
  'GRI 405': { esrs:'ESRS S1 - Own Workforce (Diversity)', alignment:'High' },
  'GRI 413': { esrs:'ESRS S3 - Affected Communities', alignment:'Medium' },
  'GRI 414': { esrs:'ESRS S2 - Workers in Value Chain', alignment:'Medium' },
  'GRI 205': { esrs:'ESRS G1 - Business Conduct', alignment:'High' },
};

/* ── Framework Interoperability ─────────────────────────────── */
const FRAMEWORKS = ['GRI', 'ISSB/SASB', 'CSRD/ESRS', 'TCFD', 'SFDR'];
const INTEROP_DATA = ALL_TOPIC_STDS.map(std => {
  const s = hashStr(std.id);
  return {
    ...std,
    gri: true,
    issb: !!GRI_ISSB_MAP[std.id],
    csrd: !!GRI_CSRD_MAP[std.id],
    tcfd: ['GRI 305', 'GRI 302', 'GRI 201'].includes(std.id),
    sfdr: ['GRI 305', 'GRI 302', 'GRI 303', 'GRI 304', 'GRI 306', 'GRI 403', 'GRI 405'].includes(std.id),
  };
});

const SECTORS = ['Energy', 'Materials', 'Industrials', 'Consumer Discretionary', 'Consumer Staples', 'Health Care', 'Financials', 'IT', 'Communication Services', 'Utilities', 'Real Estate'];

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
  <span style={{ padding:'2px 9px', borderRadius:10, fontSize:11, fontWeight:700, background:color === 'green' ? '#dcfce7' : color === 'red' ? '#fee2e2' : color === 'amber' ? '#fef3c7' : color === 'blue' ? '#dbeafe' : '#e0e7ff', color:color === 'green' ? '#166534' : color === 'red' ? '#991b1b' : color === 'amber' ? '#92400e' : color === 'blue' ? '#1e40af' : '#3730a3' }}>{label}</span>
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
const GriAlignmentPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('heatmap');
  const [sort, setSort] = useState({ key:'coverage', asc:false });
  const [catFilter, setCatFilter] = useState('All');
  const [selectedStd, setSelectedStd] = useState(null);

  /* ── Build holdings from portfolio or company master ──────── */
  const holdings = useMemo(() => {
    const saved = loadLS(LS_PORT);
    const portHoldings = saved?.portfolios?.[saved?.activePortfolio]?.holdings || (saved?.holdings) || [];
    if (portHoldings.length) return portHoldings.map(h => {
      const c = h.company || {};
      const master = GLOBAL_COMPANY_MASTER.find(m => m.ticker === c.ticker || m.name === c.name);
      const resolved = master || c;
      return { ...h, company_name: c.name || master?.name || h.company_name || 'Unknown', sector: c.sector || master?.sector || h.sector || 'Financials', country: c.exchange === 'NSE/BSE' ? 'IN' : c.exchange === 'NYSE/NASDAQ' ? 'US' : c.exchange === 'LSE' ? 'GB' : 'US', weight: h.weight || 0, isin: c.isin || master?.isin };
    });
    return GLOBAL_COMPANY_MASTER.slice(0, 30).map((c, i) => ({
      company_name: c.name || 'Unknown', isin: c.isin, sector: c.sector || SECTORS[i % SECTORS.length],
      country: c.exchange === 'NSE/BSE' ? 'IN' : 'US', weight: +(3 + sr(hashStr(c.name || ''), 1) * 7).toFixed(2),
    }));
  }, []);

  /* ── Compute GRI alignment per holding ──────────────────── */
  const enriched = useMemo(() => holdings.map(h => {
    const s = hashStr(h.company_name || '');
    const applicableStds = ALL_TOPIC_STDS.filter((_, i) => sr(s, i + 10) > 0.25);
    const totalDisc = applicableStds.reduce((sum, std) => sum + std.disclosures, 0);
    const availDisc = applicableStds.reduce((sum, std) => sum + Math.round(std.disclosures * (0.2 + sr(s, hashStr(std.id)) * 0.75)), 0);
    const coverage = totalDisc > 0 ? +((availDisc / totalDisc) * 100).toFixed(1) : 0;
    const stdBreakdown = applicableStds.map(std => {
      const avail = Math.round(std.disclosures * (0.2 + sr(s, hashStr(std.id)) * 0.75));
      return { ...std, available: avail, gap: std.disclosures - avail, pct: std.disclosures > 0 ? +((avail / std.disclosures) * 100).toFixed(0) : 0 };
    });
    const envStds = applicableStds.filter(st => st.category === 'Environmental').length;
    const socStds = applicableStds.filter(st => st.category === 'Social').length;
    const ecoStds = applicableStds.filter(st => st.category === 'Economic').length;
    const topGaps = stdBreakdown.filter(st => st.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3).map(st => st.name);
    const isIndian = h.country === 'IN';
    return {
      ...h, applicableStds: applicableStds.length, totalDisc, availDisc, coverage, stdBreakdown,
      envStds, socStds, ecoStds, topGaps, isIndian,
      fullAlignment: coverage >= 80, sectorStdsApplicable: Math.round(applicableStds.length * (0.6 + sr(s, 99) * 0.35)),
    };
  }), [holdings]);

  /* ── Sort helpers ─────────────────────────────────────────── */
  const doSort = (key) => setSort(p => ({ key, asc: p.key === key ? !p.asc : false }));
  const sorted = useMemo(() => {
    const d = [...enriched];
    d.sort((a, b) => { const va = a[sort.key], vb = b[sort.key]; if (typeof va === 'number') return sort.asc ? va - vb : vb - va; return sort.asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va)); });
    return d;
  }, [enriched, sort]);

  /* ── Aggregate KPIs ────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const avgStds = enriched.length ? (enriched.reduce((s, h) => s + h.applicableStds, 0) / enriched.length).toFixed(1) : 0;
    const totalReqDisc = ALL_TOPIC_STDS.reduce((s, t) => s + t.disclosures, 0) + GRI_STANDARDS.universal.reduce((s, u) => s + u.disclosures, 0);
    const avgDataAvail = enriched.length ? (enriched.reduce((s, h) => s + h.coverage, 0) / enriched.length).toFixed(1) : 0;
    const fullAlign = enriched.length ? (enriched.filter(h => h.fullAlignment).length / enriched.length * 100).toFixed(1) : 0;
    const envAvg = enriched.length ? (enriched.reduce((s, h) => s + h.envStds, 0) / enriched.length).toFixed(1) : 0;
    const socAvg = enriched.length ? (enriched.reduce((s, h) => s + h.socStds, 0) / enriched.length).toFixed(1) : 0;
    const ecoAvg = enriched.length ? (enriched.reduce((s, h) => s + h.ecoStds, 0) / enriched.length).toFixed(1) : 0;
    const sectorAvg = enriched.length ? (enriched.reduce((s, h) => s + h.sectorStdsApplicable, 0) / enriched.length).toFixed(1) : 0;
    return { avgStds, totalReqDisc, avgDataAvail, fullAlign, envAvg, socAvg, ecoAvg, sectorAvg };
  }, [enriched]);

  /* ── Category bar data ─────────────────────────────────────── */
  const catBarData = useMemo(() => CATEGORIES.map(cat => ({
    category: cat, disclosures: ALL_TOPIC_STDS.filter(t => t.category === cat).reduce((s, t) => s + t.disclosures, 0),
    standards: ALL_TOPIC_STDS.filter(t => t.category === cat).length,
  })), []);

  /* ── Disclosure gap per standard ───────────────────────────── */
  const discGap = useMemo(() => ALL_TOPIC_STDS.map(std => {
    const holdingsWithStd = enriched.filter(h => h.stdBreakdown.find(sb => sb.id === std.id));
    const avgAvail = holdingsWithStd.length ? holdingsWithStd.reduce((s, h) => { const sb = h.stdBreakdown.find(sb2 => sb2.id === std.id); return s + (sb ? sb.available : 0); }, 0) / holdingsWithStd.length : 0;
    const avgGap = std.disclosures - avgAvail;
    return { ...std, holdingsCount: holdingsWithStd.length, avgAvailable: +avgAvail.toFixed(1), avgGap: +avgGap.toFixed(1), gapPct: std.disclosures > 0 ? +((avgGap / std.disclosures) * 100).toFixed(0) : 0 };
  }).filter(std => std.holdingsCount > 0), [enriched]);

  /* ── GRI Content Index generator ───────────────────────────── */
  const contentIndex = useMemo(() => {
    const rows = [];
    GRI_STANDARDS.universal.forEach(u => { rows.push({ standard:u.id, name:u.name, type:'Universal', required:'Yes', disclosures:u.disclosures, status:'Applied' }); });
    ALL_TOPIC_STDS.forEach(t => {
      const applicable = enriched.filter(h => h.stdBreakdown.find(sb => sb.id === t.id)).length;
      const avgCov = applicable > 0 ? enriched.filter(h => h.stdBreakdown.find(sb => sb.id === t.id)).reduce((s, h) => { const sb = h.stdBreakdown.find(sb2 => sb2.id === t.id); return s + (sb ? sb.pct : 0); }, 0) / applicable : 0;
      rows.push({ standard:t.id, name:t.name, type:`Topic (${t.category})`, required:'If material', disclosures:t.disclosures, status: avgCov >= 75 ? 'Reported' : avgCov >= 40 ? 'Partial' : applicable > 0 ? 'Gap' : 'N/A', avgCoverage:+avgCov.toFixed(0), holdingsApplicable:applicable });
    });
    return rows;
  }, [enriched]);

  /* ── Export helpers ─────────────────────────────────────────── */
  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"` ).join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }, []);

  const exportContentIndex = useCallback(() => {
    exportCSV(contentIndex, 'gri_content_index.csv');
  }, [contentIndex, exportCSV]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:T.navy }}>GRI Standards Alignment Mapper</h1>
          <span style={{ fontSize:12, fontWeight:600, background:T.surfaceH, color:T.textSec, padding:'3px 12px', borderRadius:12, marginTop:6, display:'inline-block' }}>3 Universal &middot; 26 Topic Standards &middot; {TOTAL_DISCLOSURES} Disclosures</span>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Btn onClick={() => exportCSV(sorted.map(h => ({ Company:h.company_name, Sector:h.sector, Country:h.country, ApplicableStds:h.applicableStds, DisclosuresRequired:h.totalDisc, DataAvailable:h.availDisc, Coverage:h.coverage, EnvStds:h.envStds, SocStds:h.socStds, EcoStds:h.ecoStds, TopGaps:h.topGaps.join('; ') })), 'gri_alignment.csv')}>Export CSV</Btn>
          <Btn onClick={exportContentIndex}>Content Index CSV</Btn>
          <Btn onClick={handlePrint}>Print Report</Btn>
        </div>
      </div>

      {/* ── 8 KPI Cards ──────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <KpiCard label="GRI Stds Applicable" value={kpis.avgStds} sub="avg per holding" color={T.navy} />
        <KpiCard label="Disclosures Required" value={kpis.totalReqDisc} sub="across all standards" color={T.gold} />
        <KpiCard label="Data Available" value={`${kpis.avgDataAvail}%`} sub="avg coverage" color={parseFloat(kpis.avgDataAvail) >= 70 ? T.green : T.amber} />
        <KpiCard label="Full Alignment" value={`${kpis.fullAlign}%`} sub="holdings >= 80% coverage" color={parseFloat(kpis.fullAlign) >= 50 ? T.green : T.amber} />
        <KpiCard label="Environmental Stds" value={kpis.envAvg} sub="avg per holding" color={T.sage} />
        <KpiCard label="Social Standards" value={kpis.socAvg} sub="avg per holding" color={T.navyL} />
        <KpiCard label="Economic Standards" value={kpis.ecoAvg} sub="avg per holding" color={T.gold} />
        <KpiCard label="Sector Standards" value={kpis.sectorAvg} sub="avg applicable" color={T.navy} />
      </div>

      {/* ── Tab navigation ───────────────────────────────────── */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {[['heatmap','Coverage Heatmap'],['catbar','Category BarChart'],['table','Holdings Table'],['brsr','GRI-to-BRSR'],['issb','GRI-to-ISSB'],['csrd','GRI-to-CSRD'],['gaps','Disclosure Gaps'],['interop','Interoperability Matrix'],['content','Content Index']].map(([k,l]) => (
          <Btn key={k} small active={activeTab === k} onClick={() => setActiveTab(k)}>{l}</Btn>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
         3. GRI Standards Coverage Heatmap
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'heatmap' && (
        <Section title="GRI Standards Coverage Heatmap" badge="Holdings x 26 Topic Standards">
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr>
                  <th style={{ padding:6, textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, position:'sticky', left:0, background:T.surfaceH, zIndex:2, minWidth:140 }}>Company</th>
                  {ALL_TOPIC_STDS.map(st => (
                    <th key={st.id} style={{ padding:'4px 2px', textAlign:'center', fontSize:8, fontWeight:600, color:T.textSec, writingMode:'vertical-rl', height:100, background:T.surfaceH, cursor:'pointer' }}
                      onClick={() => setSelectedStd(st)}>
                      {st.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched.slice(0, 25).map((h, ri) => (
                  <tr key={ri}>
                    <td style={{ padding:6, fontWeight:600, color:T.text, fontSize:11, position:'sticky', left:0, background:ri % 2 ? T.surfaceH : T.surface, zIndex:1, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h.company_name?.slice(0, 22)}</td>
                    {ALL_TOPIC_STDS.map(st => {
                      const sb = h.stdBreakdown.find(s => s.id === st.id);
                      const pct = sb ? sb.pct : -1;
                      const bg = pct < 0 ? T.surfaceH : pct >= 75 ? '#dcfce7' : pct >= 40 ? '#fef3c7' : '#fee2e2';
                      return (
                        <td key={st.id} style={{ padding:1, textAlign:'center', background:bg, borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, fontSize:9 }}>
                          {pct >= 0 ? `${pct}` : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedStd && (
            <div style={{ marginTop:12, padding:14, background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
              <strong>{selectedStd.id}: {selectedStd.name}</strong> ({selectedStd.category}) &mdash; {selectedStd.disclosures} disclosures
              <Btn small onClick={() => setSelectedStd(null)} style={{ marginLeft:12 }}>Close</Btn>
            </div>
          )}
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         4. GRI Category BarChart
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'catbar' && (
        <Section title="GRI Disclosures by Category" badge="Economic vs Environmental vs Social">
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={catBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="category" tick={{ fontSize:12 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="disclosures" name="Disclosures" radius={[4,4,0,0]}>
                  {catBarData.map((c, i) => <Cell key={i} fill={CAT_COLORS[c.category] || T.navy} />)}
                </Bar>
                <Bar dataKey="standards" name="Standards" radius={[4,4,0,0]}>
                  {catBarData.map((c, i) => <Cell key={i} fill={CAT_COLORS[c.category] || T.navy} opacity={0.5} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20 }}>
              <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 12px' }}>Category Summary</h4>
              {catBarData.map(c => (
                <div key={c.category} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontWeight:600, color:T.text }}>{c.category}</span>
                  <span style={{ fontWeight:700, color:T.navy }}>{c.standards} stds / {c.disclosures} disc</span>
                </div>
              ))}
              <div style={{ marginTop:12, paddingTop:10, borderTop:`2px solid ${T.navy}`, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontWeight:700, color:T.navy }}>Total</span>
                <span style={{ fontWeight:700, color:T.navy }}>{ALL_TOPIC_STDS.length} stds / {ALL_TOPIC_STDS.reduce((s, t) => s + t.disclosures, 0)} disc</span>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         5. Holdings GRI Alignment Table (sortable)
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'table' && (
        <Section title="Holdings GRI Alignment Table" badge={`${sorted.length} holdings`}>
          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            {['All', ...CATEGORIES].map(c => <Btn key={c} small active={catFilter === c} onClick={() => setCatFilter(c)}>{c}</Btn>)}
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <Th sortKey="company_name" sortCfg={sort} onSort={doSort}>Company</Th>
                  <Th sortKey="sector" sortCfg={sort} onSort={doSort}>Sector</Th>
                  <Th sortKey="applicableStds" sortCfg={sort} onSort={doSort}>Applicable Stds</Th>
                  <Th sortKey="totalDisc" sortCfg={sort} onSort={doSort}>Disclosures Req</Th>
                  <Th sortKey="availDisc" sortCfg={sort} onSort={doSort}>Data Available</Th>
                  <Th sortKey="coverage" sortCfg={sort} onSort={doSort}>Coverage %</Th>
                  <Th>Top Gaps</Th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((h, i) => (
                  <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <Td bold>{h.company_name}</Td>
                    <Td>{h.sector}</Td>
                    <Td>{h.applicableStds}</Td>
                    <Td>{h.totalDisc}</Td>
                    <Td><span style={{ color:T.green, fontWeight:600 }}>{h.availDisc}</span></Td>
                    <Td><span style={{ fontWeight:700, color:h.coverage >= 75 ? T.green : h.coverage >= 45 ? T.amber : T.red }}>{h.coverage}%</span></Td>
                    <Td><span style={{ fontSize:11 }}>{h.topGaps.join(', ') || 'None'}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         6. GRI-to-BRSR Mapping
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'brsr' && (
        <Section title="GRI-to-BRSR Mapping" badge="Indian companies">
          <p style={{ fontSize:13, color:T.textSec, marginBottom:14 }}>Maps GRI Topic Standards to BRSR (Business Responsibility and Sustainability Reporting) Principles for Indian-listed companies.</p>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><Th>GRI Standard</Th><Th>GRI Name</Th><Th>BRSR Mapping</Th><Th>Coverage</Th><Th>Indian Holdings</Th></tr></thead>
            <tbody>
              {Object.entries(GRI_BRSR_MAP).map(([griId, map], i) => {
                const std = ALL_TOPIC_STDS.find(s => s.id === griId);
                const indianCount = enriched.filter(h => h.isIndian && h.stdBreakdown.find(sb => sb.id === griId)).length;
                return (
                  <tr key={griId} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <Td bold>{griId}</Td><Td>{std?.name || '-'}</Td><Td>{map.brsr}</Td>
                    <Td><Badge label={map.coverage} color={map.coverage === 'High' ? 'green' : map.coverage === 'Medium' ? 'amber' : 'red'} /></Td>
                    <Td>{indianCount}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         7. GRI-to-ISSB Mapping
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'issb' && (
        <Section title="GRI-to-ISSB/SASB Mapping" badge="topic-level alignment">
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><Th>GRI Standard</Th><Th>GRI Name</Th><Th>Category</Th><Th>SASB Topic</Th><Th>Alignment</Th></tr></thead>
            <tbody>
              {ALL_TOPIC_STDS.map((std, i) => {
                const map = GRI_ISSB_MAP[std.id];
                return (
                  <tr key={std.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <Td bold>{std.id}</Td><Td>{std.name}</Td>
                    <Td><Badge label={std.category} color={std.category === 'Environmental' ? 'green' : std.category === 'Economic' ? 'amber' : 'blue'} /></Td>
                    <Td>{map ? map.sasb : <span style={{ color:T.textMut }}>No direct mapping</span>}</Td>
                    <Td>{map ? <Badge label={map.alignment} color={map.alignment === 'Direct' ? 'green' : 'amber'} /> : <Badge label="N/A" color="red" />}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ fontSize:12, color:T.textMut, marginTop:10 }}>
            {Object.keys(GRI_ISSB_MAP).length} of {ALL_TOPIC_STDS.length} GRI Topic Standards have direct or partial mapping to ISSB SASB topics.
          </p>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         8. GRI-to-CSRD Mapping
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'csrd' && (
        <Section title="GRI-to-CSRD/ESRS Mapping" badge="feeds into ESRS">
          <p style={{ fontSize:13, color:T.textSec, marginBottom:14 }}>GRI standards serve as a basis for ESRS. This mapping shows which GRI standards feed into specific ESRS requirements.</p>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><Th>GRI Standard</Th><Th>GRI Name</Th><Th>ESRS Standard</Th><Th>Alignment</Th></tr></thead>
            <tbody>
              {ALL_TOPIC_STDS.map((std, i) => {
                const map = GRI_CSRD_MAP[std.id];
                return (
                  <tr key={std.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <Td bold>{std.id}</Td><Td>{std.name}</Td>
                    <Td>{map ? map.esrs : <span style={{ color:T.textMut }}>No direct mapping</span>}</Td>
                    <Td>{map ? <Badge label={map.alignment} color={map.alignment === 'High' ? 'green' : 'amber'} /> : <Badge label="N/A" color="red" />}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ fontSize:12, color:T.textMut, marginTop:10 }}>
            {Object.keys(GRI_CSRD_MAP).length} of {ALL_TOPIC_STDS.length} GRI Topic Standards have direct mapping to CSRD ESRS standards.
          </p>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         9. Disclosure Gap Analysis
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'gaps' && (
        <Section title="Disclosure Gap Analysis" badge="per GRI standard">
          <p style={{ fontSize:13, color:T.textSec, marginBottom:14 }}>Per GRI standard: which disclosures have data vs which need collection across the portfolio.</p>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr><Th>Standard</Th><Th>Name</Th><Th>Category</Th><Th>Total Disc</Th><Th>Avg Available</Th><Th>Avg Gap</Th><Th>Gap %</Th><Th>Holdings</Th><Th>Priority</Th></tr>
            </thead>
            <tbody>
              {discGap.sort((a, b) => b.gapPct - a.gapPct).map((std, i) => (
                <tr key={std.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <Td bold>{std.id}</Td><Td>{std.name}</Td>
                  <Td><Badge label={std.category} color={std.category === 'Environmental' ? 'green' : std.category === 'Economic' ? 'amber' : 'blue'} /></Td>
                  <Td>{std.disclosures}</Td>
                  <Td><span style={{ color:T.green, fontWeight:600 }}>{std.avgAvailable}</span></Td>
                  <Td><span style={{ color:T.red, fontWeight:600 }}>{std.avgGap}</span></Td>
                  <Td>{std.gapPct}%</Td>
                  <Td>{std.holdingsCount}</Td>
                  <Td><Badge label={std.gapPct > 60 ? 'High' : std.gapPct > 30 ? 'Medium' : 'Low'} color={std.gapPct > 60 ? 'red' : std.gapPct > 30 ? 'amber' : 'green'} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         10. Framework Interoperability Matrix
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'interop' && (
        <Section title="Framework Interoperability Matrix" badge="GRI x ISSB x CSRD x TCFD x SFDR">
          <p style={{ fontSize:13, color:T.textSec, marginBottom:14 }}>Shows which frameworks require similar data for each GRI Topic Standard.</p>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <Th>GRI Standard</Th><Th>Name</Th><Th>Category</Th>
                  {FRAMEWORKS.map(f => <Th key={f}>{f}</Th>)}
                </tr>
              </thead>
              <tbody>
                {INTEROP_DATA.map((std, i) => (
                  <tr key={std.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <Td bold>{std.id}</Td><Td>{std.name}</Td>
                    <Td><Badge label={std.category} color={std.category === 'Environmental' ? 'green' : std.category === 'Economic' ? 'amber' : 'blue'} /></Td>
                    <Td><span style={{ color:T.green, fontSize:16 }}>{'\u2713'}</span></Td>
                    <Td>{std.issb ? <span style={{ color:T.green, fontSize:16 }}>{'\u2713'}</span> : <span style={{ color:T.textMut }}>&mdash;</span>}</Td>
                    <Td>{std.csrd ? <span style={{ color:T.green, fontSize:16 }}>{'\u2713'}</span> : <span style={{ color:T.textMut }}>&mdash;</span>}</Td>
                    <Td>{std.tcfd ? <span style={{ color:T.green, fontSize:16 }}>{'\u2713'}</span> : <span style={{ color:T.textMut }}>&mdash;</span>}</Td>
                    <Td>{std.sfdr ? <span style={{ color:T.green, fontSize:16 }}>{'\u2713'}</span> : <span style={{ color:T.textMut }}>&mdash;</span>}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginTop:16 }}>
            {FRAMEWORKS.map(f => {
              const count = INTEROP_DATA.filter(std => f === 'GRI' ? std.gri : f === 'ISSB/SASB' ? std.issb : f === 'CSRD/ESRS' ? std.csrd : f === 'TCFD' ? std.tcfd : std.sfdr).length;
              return (
                <div key={f} style={{ background:T.surface, borderRadius:8, border:`1px solid ${T.border}`, padding:14, textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:700, color:T.navy }}>{count}</div>
                  <div style={{ fontSize:12, color:T.textSec }}>{f} aligned</div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         11. GRI Reporting Template (Content Index)
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'content' && (
        <Section title="GRI Content Index" badge="auto-generated">
          <p style={{ fontSize:13, color:T.textSec, marginBottom:14 }}>Auto-generated GRI Content Index based on portfolio holdings data availability. Export as CSV for reporting.</p>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr><Th>Standard</Th><Th>Name</Th><Th>Type</Th><Th>Required</Th><Th>Disclosures</Th><Th>Status</Th><Th>Avg Coverage</Th><Th>Holdings</Th></tr>
              </thead>
              <tbody>
                {contentIndex.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <Td bold>{row.standard}</Td><Td>{row.name}</Td><Td>{row.type}</Td>
                    <Td><Badge label={row.required} color={row.required === 'Yes' ? 'green' : 'blue'} /></Td>
                    <Td>{row.disclosures}</Td>
                    <Td><Badge label={row.status} color={row.status === 'Reported' || row.status === 'Applied' ? 'green' : row.status === 'Partial' ? 'amber' : row.status === 'Gap' ? 'red' : 'blue'} /></Td>
                    <Td>{row.avgCoverage != null ? `${row.avgCoverage}%` : '-'}</Td>
                    <Td>{row.holdingsApplicable != null ? row.holdingsApplicable : '-'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: GRI Category Radar
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'catbar' && (() => {
        const radarData = ALL_TOPIC_STDS.map(std => {
          const avgCov = enriched.length ? enriched.reduce((s, h) => { const sb = h.stdBreakdown.find(sb2 => sb2.id === std.id); return s + (sb ? sb.pct : 0); }, 0) / enriched.length : 0;
          return { name: std.id.replace('GRI ', ''), coverage: +avgCov.toFixed(0), disclosures: std.disclosures };
        });
        return (
          <Section title="Standards Coverage Radar" badge="avg coverage across portfolio">
            <ResponsiveContainer width="100%" height={420}>
              <RadarChart data={radarData.slice(0, 14)} cx="50%" cy="50%">
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="name" tick={{ fontSize:10, fill:T.text }} />
                <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }} />
                <Radar name="Coverage %" dataKey="coverage" stroke={T.navy} fill={T.navy} fillOpacity={0.3} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Disclosure Completeness Distribution
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'gaps' && (() => {
        const buckets = [
          { label:'>80% Complete', min:80, max:101, color:T.green },
          { label:'50-80%', min:50, max:80, color:T.sage },
          { label:'25-50%', min:25, max:50, color:T.amber },
          { label:'<25%', min:0, max:25, color:T.red },
        ];
        const bucketData = buckets.map(b => ({
          name: b.label,
          standards: discGap.filter(s => (100 - s.gapPct) >= b.min && (100 - s.gapPct) < b.max).length,
          fill: b.color,
        }));
        return (
          <Section title="Disclosure Completeness Distribution" badge="standards by coverage bucket">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={bucketData} dataKey="standards" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {bucketData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20 }}>
                <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 12px' }}>Completeness Tiers</h4>
                {bucketData.map(b => (
                  <div key={b.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:12, height:12, borderRadius:3, background:b.fill }} />
                      <span style={{ fontWeight:600, color:T.text }}>{b.name}</span>
                    </div>
                    <span style={{ fontWeight:700, color:T.navy }}>{b.standards} standards</span>
                  </div>
                ))}
                <div style={{ marginTop:10, fontSize:12, color:T.textSec }}>
                  Total standards with at least one holding: {discGap.length}
                </div>
              </div>
            </div>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Holdings Detail Drill-down
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'table' && sorted.length > 0 && (() => {
        const [drillIdx, setDrillIdx] = React.useState(null);
        const drillH = drillIdx !== null ? sorted[drillIdx] : null;
        return (
          <Section title="Holding GRI Detail Drilldown" badge="per-standard breakdown">
            <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
              {sorted.slice(0, 12).map((h, i) => (
                <Btn key={i} small active={drillIdx === i} onClick={() => setDrillIdx(drillIdx === i ? null : i)}>{h.company_name?.slice(0, 18)}</Btn>
              ))}
            </div>
            {drillH && (
              <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20, maxHeight:400, overflowY:'auto' }}>
                <h4 style={{ color:T.navy, margin:'0 0 12px' }}>{drillH.company_name} &mdash; GRI Standard Breakdown</h4>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr><Th>Standard</Th><Th>Name</Th><Th>Category</Th><Th>Total Disc</Th><Th>Available</Th><Th>Gap</Th><Th>Coverage</Th></tr></thead>
                  <tbody>
                    {drillH.stdBreakdown.map((sb, i) => (
                      <tr key={sb.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <Td bold>{sb.id}</Td><Td>{sb.name}</Td>
                        <Td><Badge label={sb.category} color={sb.category === 'Environmental' ? 'green' : sb.category === 'Economic' ? 'amber' : 'blue'} /></Td>
                        <Td>{sb.disclosures}</Td>
                        <Td><span style={{ color:T.green, fontWeight:600 }}>{sb.available}</span></Td>
                        <Td><span style={{ color:T.red, fontWeight:600 }}>{sb.gap}</span></Td>
                        <Td><span style={{ fontWeight:700, color:sb.pct >= 75 ? T.green : sb.pct >= 40 ? T.amber : T.red }}>{sb.pct}%</span></Td>
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
         EXTRA: BRSR Coverage BarChart
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'brsr' && (() => {
        const brsrBarData = Object.entries(GRI_BRSR_MAP).map(([griId, map]) => {
          const std = ALL_TOPIC_STDS.find(s => s.id === griId);
          const indianCount = enriched.filter(h => h.isIndian && h.stdBreakdown.find(sb => sb.id === griId)).length;
          const totalIndian = enriched.filter(h => h.isIndian).length || 1;
          return { name: std?.name?.slice(0, 18) || griId, coverage: +(indianCount / totalIndian * 100).toFixed(0), level: map.coverage };
        });
        return (
          <Section title="BRSR Coverage Among Indian Holdings" badge="% of Indian holdings with data">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={brsrBarData} layout="vertical" margin={{ left:140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0,100]} tick={{ fontSize:11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize:11 }} width={135} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="coverage" radius={[0,4,4,0]}>
                  {brsrBarData.map((d, i) => <Cell key={i} fill={d.level === 'High' ? T.green : d.level === 'Medium' ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Interop Summary Stats
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'interop' && (
        <Section title="Framework Overlap Analysis" badge="shared data requirements">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {[
              { label:'GRI + ISSB + CSRD', count: INTEROP_DATA.filter(s => s.gri && s.issb && s.csrd).length, color:T.navy },
              { label:'GRI + SFDR', count: INTEROP_DATA.filter(s => s.gri && s.sfdr).length, color:T.sage },
              { label:'All 5 Frameworks', count: INTEROP_DATA.filter(s => s.gri && s.issb && s.csrd && s.tcfd && s.sfdr).length, color:T.gold },
            ].map(item => (
              <div key={item.label} style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:18, textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:800, color:item.color }}>{item.count}</div>
                <div style={{ fontSize:12, fontWeight:600, color:T.textSec }}>{item.label}</div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>standards overlap</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:12, color:T.textMut, marginTop:12 }}>
            Standards aligned across multiple frameworks reduce reporting burden through data reuse. Collecting data once satisfies multiple regulatory requirements.
          </p>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Content Index Summary Stats
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'content' && (() => {
        const reported = contentIndex.filter(r => r.status === 'Reported' || r.status === 'Applied').length;
        const partial = contentIndex.filter(r => r.status === 'Partial').length;
        const gap = contentIndex.filter(r => r.status === 'Gap').length;
        return (
          <Section title="Content Index Summary" badge="reporting readiness">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
              <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:16, textAlign:'center', borderTop:`3px solid ${T.green}` }}>
                <div style={{ fontSize:26, fontWeight:800, color:T.green }}>{reported}</div>
                <div style={{ fontSize:12, color:T.textSec }}>Reported / Applied</div>
              </div>
              <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:16, textAlign:'center', borderTop:`3px solid ${T.amber}` }}>
                <div style={{ fontSize:26, fontWeight:800, color:T.amber }}>{partial}</div>
                <div style={{ fontSize:12, color:T.textSec }}>Partial</div>
              </div>
              <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:16, textAlign:'center', borderTop:`3px solid ${T.red}` }}>
                <div style={{ fontSize:26, fontWeight:800, color:T.red }}>{gap}</div>
                <div style={{ fontSize:12, color:T.textSec }}>Gap</div>
              </div>
              <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:16, textAlign:'center', borderTop:`3px solid ${T.navy}` }}>
                <div style={{ fontSize:26, fontWeight:800, color:T.navy }}>{contentIndex.length}</div>
                <div style={{ fontSize:12, color:T.textSec }}>Total Standards</div>
              </div>
            </div>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: GRI Implementation Notes
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'content' && (
        <Section title="GRI Reporting Notes" badge="guidance">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {[
              { title:'Universal Standards (Required)', items:['GRI 1: Foundation applies to all reporters','GRI 2: 30 General Disclosures on org profile & governance','GRI 3: Process for determining material topics'], color:T.navy },
              { title:'Sector Standards', items:['Sector-specific requirements under development','Oil & Gas, Agriculture, Mining sectors released','Financial Services sector standard forthcoming'], color:T.sage },
              { title:'Data Collection Priority', items:['Start with Universal Standards (mandatory)','Add Environmental topics for high-impact sectors','Social standards critical for labor-intensive industries'], color:T.gold },
              { title:'Assurance Readiness', items:['GRI encourages external assurance of reports','Data quality and evidence documentation required','Internal audit alignment recommended'], color:T.amber },
            ].map(n => (
              <div key={n.title} style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:18, borderLeft:`4px solid ${n.color}` }}>
                <h4 style={{ color:T.navy, fontSize:14, margin:'0 0 10px' }}>{n.title}</h4>
                <ul style={{ margin:0, paddingLeft:18, fontSize:13, color:T.text, lineHeight:1.8 }}>
                  {n.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: ISSB Alignment BarChart (visual)
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'issb' && (() => {
        const issBarData = ALL_TOPIC_STDS.map(std => {
          const map = GRI_ISSB_MAP[std.id];
          return { name: std.id.replace('GRI ', ''), alignment: map ? (map.alignment === 'Direct' ? 100 : 60) : 0 };
        });
        return (
          <Section title="ISSB Alignment Score by Standard" badge="Direct=100, Partial=60, None=0">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={issBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:10 }} angle={-35} textAnchor="end" height={50} />
                <YAxis domain={[0,100]} tick={{ fontSize:11 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="alignment" name="Alignment Score" radius={[4,4,0,0]}>
                  {issBarData.map((d, i) => <Cell key={i} fill={d.alignment === 100 ? T.green : d.alignment === 60 ? T.amber : T.textMut} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: CSRD Alignment BarChart
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'csrd' && (() => {
        const csrdBarData = ALL_TOPIC_STDS.map(std => {
          const map = GRI_CSRD_MAP[std.id];
          return { name: std.id.replace('GRI ', ''), alignment: map ? (map.alignment === 'High' ? 100 : 55) : 0, esrs: map ? map.esrs.replace('ESRS ', '') : 'None' };
        });
        return (
          <Section title="CSRD/ESRS Alignment Score" badge="High=100, Medium=55, None=0">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={csrdBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:10 }} angle={-35} textAnchor="end" height={50} />
                <YAxis domain={[0,100]} tick={{ fontSize:11 }} />
                <Tooltip formatter={(v, name, props) => [`${v}%`, `ESRS: ${props.payload.esrs}`]} />
                <Bar dataKey="alignment" name="Alignment" radius={[4,4,0,0]}>
                  {csrdBarData.map((d, i) => <Cell key={i} fill={d.alignment === 100 ? T.green : d.alignment === 55 ? T.amber : T.textMut} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         EXTRA: Sector Coverage Distribution
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'heatmap' && (() => {
        const sectorData = SECTORS.map(sec => {
          const sectorH = enriched.filter(h => h.sector && h.sector.toLowerCase().includes(sec.toLowerCase()));
          const avgCov = sectorH.length ? (sectorH.reduce((s, h) => s + h.coverage, 0) / sectorH.length).toFixed(1) : 0;
          return { sector: sec.length > 15 ? sec.slice(0,13) + '..' : sec, coverage: +avgCov, count: sectorH.length };
        }).filter(d => d.count > 0);
        return (
          <Section title="Average GRI Coverage by Sector" badge="portfolio sectors">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize:10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[0,100]} tick={{ fontSize:11 }} label={{ value:'Coverage %', angle:-90, position:'insideLeft', fontSize:12 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="coverage" name="Coverage %" radius={[4,4,0,0]}>
                  {sectorData.map((d, i) => <Cell key={i} fill={d.coverage >= 70 ? T.green : d.coverage >= 45 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
         12. Cross-Navigation
         ═══════════════════════════════════════════════════════ */}
      <Section title="Cross-Navigation">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            ['ISSB Materiality', '/issb-materiality'], ['EU Taxonomy', '/eu-taxonomy'], ['SFDR PAI', '/sfdr-pai'],
            ['BRSR Bridge', '/brsr-bridge'], ['Report Studio', '/advanced-report-studio'],
            ['CSRD DMA', '/csrd-dma'], ['Double Materiality', '/double-materiality'],
            ['Regulatory Gap', '/regulatory-gap'], ['Portfolio Dashboard', '/portfolio-dashboard'],
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

export default GriAlignmentPage;
