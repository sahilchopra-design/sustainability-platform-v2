import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── IRIS+ Metric Catalog ──────────────────────────────────── */
const IRIS_METRICS = {
  what: { name: 'What -- Impact Theme', color: '#16a34a', metrics: [
    { id: 'PI9468', name: 'Clean Energy Generated', unit: 'MWh', description: 'Total clean energy generated or enabled', sdgs: [7, 13], sector_relevance: ['Energy', 'Utilities'] },
    { id: 'PI1775', name: 'Patients Served', unit: 'count', description: 'Number of patients receiving healthcare', sdgs: [3], sector_relevance: ['Health Care'] },
    { id: 'PI2822', name: 'Students Served', unit: 'count', description: 'Number of students receiving education', sdgs: [4], sector_relevance: ['Communication Services', 'IT'] },
    { id: 'PI3468', name: 'Affordable Housing Units', unit: 'count', description: 'Units of affordable housing created/maintained', sdgs: [11], sector_relevance: ['Real Estate'] },
    { id: 'PI4060', name: 'Smallholder Farmers Supported', unit: 'count', description: 'Smallholder farmers in supply chain programs', sdgs: [1, 2], sector_relevance: ['Consumer Staples'] },
    { id: 'OI8869', name: 'GHG Emissions Reduced', unit: 'tCO2e', description: 'Total GHG emissions avoided or reduced', sdgs: [13], sector_relevance: ['All'] },
    { id: 'OI1120', name: 'Water Saved/Treated', unit: 'megalitres', description: 'Water saved through efficiency or treated for reuse', sdgs: [6], sector_relevance: ['Utilities', 'Materials'] },
    { id: 'OI5951', name: 'Waste Diverted from Landfill', unit: 'tonnes', description: 'Waste recycled, composted, or reused', sdgs: [12], sector_relevance: ['Materials', 'Consumer Staples'] },
  ]},
  who: { name: 'Who -- Stakeholders', color: '#2563eb', metrics: [
    { id: 'PI5496', name: 'Full-Time Employees', unit: 'count', description: 'Total full-time equivalent employees', sdgs: [8], sector_relevance: ['All'] },
    { id: 'PI3833', name: 'Employees from Underrepresented Groups', unit: '%', description: 'Percentage of workforce from underrepresented demographics', sdgs: [5, 10], sector_relevance: ['All'] },
    { id: 'PI6330', name: 'Clients Below Poverty Line', unit: '%', description: 'Percentage of clients living below national poverty line', sdgs: [1], sector_relevance: ['Financials', 'Consumer Staples'] },
    { id: 'PI7098', name: 'Women Beneficiaries', unit: '%', description: 'Percentage of women among direct beneficiaries', sdgs: [5], sector_relevance: ['All'] },
    { id: 'PI4822', name: 'Youth Beneficiaries (15-24)', unit: '%', description: 'Percentage of youth among program participants', sdgs: [8], sector_relevance: ['All'] },
  ]},
  how_much: { name: 'How Much -- Scale & Depth', color: '#d97706', metrics: [
    { id: 'PI1104', name: 'Total Beneficiaries', unit: 'count', description: 'Total number of people positively impacted', sdgs: [1, 3, 4], sector_relevance: ['All'] },
    { id: 'OI4114', name: 'Revenue from Impact Products', unit: 'USD Mn', description: 'Revenue derived from products/services with measurable positive impact', sdgs: [8, 9], sector_relevance: ['All'] },
    { id: 'PI2105', name: 'Geographic Reach (Countries)', unit: 'count', description: 'Number of countries with active impact operations', sdgs: [17], sector_relevance: ['All'] },
    { id: 'PI6587', name: 'Products/Services Delivered', unit: 'count', description: 'Total units of impact products or services delivered', sdgs: [9], sector_relevance: ['All'] },
  ]},
  contribution: { name: 'Contribution -- Additionality', color: '#7c3aed', metrics: [
    { id: 'OI5320', name: 'Capital Mobilized', unit: 'USD Mn', description: 'Additional capital catalyzed from other investors', sdgs: [17], sector_relevance: ['Financials'] },
    { id: 'PI9061', name: 'Innovation Index', unit: 'score 0-100', description: 'Uniqueness and novelty of impact solution', sdgs: [9], sector_relevance: ['All'] },
    { id: 'PI3390', name: 'Policy Influence', unit: 'qualitative', description: 'Contribution to systemic regulatory or policy change', sdgs: [16], sector_relevance: ['All'] },
    { id: 'PI7742', name: 'Market Building', unit: 'qualitative', description: 'Creating new markets for impact-oriented solutions', sdgs: [8], sector_relevance: ['All'] },
  ]},
  risk: { name: 'Risk -- Impact Risk', color: '#dc2626', metrics: [
    { id: 'PI1595', name: 'Evidence Quality', unit: 'tier 1-5', description: 'Quality of impact evidence (1=randomized control trial, 5=anecdotal)', sdgs: [], sector_relevance: ['All'] },
    { id: 'PI8291', name: 'Execution Risk', unit: 'score 0-100', description: 'Risk of failing to deliver intended impact outcomes', sdgs: [], sector_relevance: ['All'] },
    { id: 'PI4453', name: 'External Risk', unit: 'score 0-100', description: 'Risk from external factors undermining impact', sdgs: [], sector_relevance: ['All'] },
    { id: 'PI6190', name: 'Stakeholder Risk', unit: 'score 0-100', description: 'Risk of unintended negative consequences to stakeholders', sdgs: [], sector_relevance: ['All'] },
  ]},
};

const DIM_KEYS = Object.keys(IRIS_METRICS);
const ALL_METRICS = DIM_KEYS.flatMap(dk => IRIS_METRICS[dk].metrics.map(m => ({ ...m, dimension: dk, dimName: IRIS_METRICS[dk].name, dimColor: IRIS_METRICS[dk].color })));
const SDG_NAMES = { 1:'No Poverty', 2:'Zero Hunger', 3:'Good Health', 4:'Quality Education', 5:'Gender Equality', 6:'Clean Water', 7:'Affordable Energy', 8:'Decent Work', 9:'Industry & Innovation', 10:'Reduced Inequalities', 11:'Sustainable Cities', 12:'Responsible Consumption', 13:'Climate Action', 14:'Life Below Water', 15:'Life on Land', 16:'Peace & Justice', 17:'Partnerships' };
const SDG_COLORS = { 1:'#e5243b', 2:'#dda63a', 3:'#4c9f38', 4:'#c5192d', 5:'#ff3a21', 6:'#26bde2', 7:'#fcc30b', 8:'#a21942', 9:'#fd6925', 10:'#dd1367', 11:'#fd9d24', 12:'#bf8b2e', 13:'#3f7e44', 14:'#0a97d9', 15:'#56c02b', 16:'#00689d', 17:'#19486a' };

const GIIN_BENCHMARKS = { what: 62, who: 55, how_much: 48, contribution: 40, risk: 58 };

const LS_IRIS = 'ra_iris_data_v1';
function loadIris() { try { return JSON.parse(localStorage.getItem(LS_IRIS)) || {}; } catch { return {}; } }
function saveIris(d) { localStorage.setItem(LS_IRIS, JSON.stringify(d)); }

/* ── Helpers ────────────────────────────────────────────────── */
const fmt = (v, d = 1) => v == null || isNaN(v) ? '--' : Number(v).toFixed(d);
const fmtK = v => { if (v == null || isNaN(v)) return '--'; if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`; if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`; return v.toFixed(0); };

/* ── Score generation per company ──────────────────────────── */
function computeIrisScores(company, irisData) {
  const sec = company.sector || 'Other';
  const rev = company.revenue_usd_mn || 0;
  const userData = irisData[company.company_id] || {};
  const seed = (company.company_id || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const rng = (off) => ((seed * 9301 + 49297 + off * 13) % 233280) / 233280;

  const scores = {};
  DIM_KEYS.forEach((dk, di) => {
    const metrics = IRIS_METRICS[dk].metrics;
    let dimTotal = 0;
    metrics.forEach((m, mi) => {
      const relevant = m.sector_relevance?.includes('All') || m.sector_relevance?.includes(sec);
      const userVal = userData[m.id];
      let value;
      if (userVal != null && userVal !== '') {
        value = parseFloat(userVal);
      } else if (relevant) {
        value = rng(di * 100 + mi) * (m.unit === '%' ? 80 : m.unit === 'count' ? rev * 50 : m.unit === 'USD Mn' ? rev * 0.15 : m.unit.includes('score') ? 70 : rev * 10) + (m.unit === '%' ? 10 : 5);
      } else {
        value = rng(di * 100 + mi) * 20;
      }
      scores[m.id] = { value, relevant };
      dimTotal += relevant ? Math.min(100, (value / (m.unit === 'count' ? rev * 100 : m.unit === '%' ? 100 : m.unit === 'USD Mn' ? rev * 0.5 : 100)) * 100) : 0;
    });
    scores[`_dim_${dk}`] = metrics.length > 0 ? Math.min(100, dimTotal / metrics.filter(m => m.sector_relevance?.includes('All') || m.sector_relevance?.includes(sec)).length || 1) : 0;
  });

  const avgScore = DIM_KEYS.reduce((s, dk) => s + (scores[`_dim_${dk}`] || 0), 0) / 5;
  const evidenceQual = scores['PI1595']?.value ? Math.round(scores['PI1595'].value / 20) || 3 : 3;
  return { ...scores, avgScore, evidenceQual };
}

/* ── Reusable Components ───────────────────────────────────── */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, ...style }}>{children}</div>
);
const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 18px', minWidth: 140, flex: '1 1 160px' }}>
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
      {payload.map((p, i) => <div key={i} style={{ color: p.color || T.text }}>{p.name}: {typeof p.value === 'number' ? fmt(p.value, 1) : p.value}</div>)}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                */
/* ══════════════════════════════════════════════════════════════ */
export default function IrisMetricsPage() {
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
  const [irisData, setIrisData] = useState(loadIris);
  const [sortCol, setSortCol] = useState('avgScore');
  const [sortDir, setSortDir] = useState('desc');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeDim, setActiveDim] = useState('what');
  const [editCompany, setEditCompany] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [catSortCol, setCatSortCol] = useState('id');
  const [catSortDir, setCatSortDir] = useState('asc');

  /* ── Computed data ───────────────────────────────────────── */
  const data = useMemo(() => holdings.map(h => {
    const scores = computeIrisScores(h, irisData);
    return { ...h, ...scores };
  }), [holdings, irisData]);

  const sorted = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      const va = typeof a[sortCol] === 'string' ? (a[sortCol] || '') : (a[sortCol] ?? 0);
      const vb = typeof b[sortCol] === 'string' ? (b[sortCol] || '') : (b[sortCol] ?? 0);
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [data, sortCol, sortDir]);

  const handleSort = useCallback(col => {
    setSortDir(d => sortCol === col ? (d === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortCol(col);
  }, [sortCol]);

  const handleCatSort = useCallback(col => {
    setCatSortDir(d => catSortCol === col ? (d === 'asc' ? 'desc' : 'asc') : 'asc');
    setCatSortCol(col);
  }, [catSortCol]);

  /* ── Aggregates ──────────────────────────────────────────── */
  const agg = useMemo(() => {
    const avgScore = data.reduce((s, d) => s + d.avgScore, 0) / (data.length || 1);
    const dimScores = {};
    DIM_KEYS.forEach(dk => { dimScores[dk] = data.reduce((s, d) => s + (d[`_dim_${dk}`] || 0), 0) / (data.length || 1); });
    const sdgCounts = {};
    ALL_METRICS.forEach(m => m.sdgs.forEach(s => { sdgCounts[s] = (sdgCounts[s] || 0) + 1; }));
    const linkedSdgs = Object.keys(sdgCounts).length;
    const topSector = (() => {
      const map = {};
      data.forEach(d => { const s = d.sector || 'Other'; map[s] = (map[s] || 0) + d.avgScore; });
      return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || '--';
    })();
    const totalRev = data.reduce((s, d) => s + (d.revenue_usd_mn || 0), 0);
    const impactRevPct = totalRev > 0 ? data.reduce((s, d) => s + (d[ALL_METRICS.find(m => m.id === 'OI4114')?.id]?.value || 0), 0) / totalRev * 100 : 0;
    const totalBeneficiaries = data.reduce((s, d) => s + (d['PI1104']?.value || 0), 0);
    const totalGhg = data.reduce((s, d) => s + (d['OI8869']?.value || 0), 0);
    const avgEvidence = data.reduce((s, d) => s + d.evidenceQual, 0) / (data.length || 1);
    return { avgScore, dimScores, linkedSdgs, topSector, impactRevPct, totalBeneficiaries, totalGhg, avgEvidence };
  }, [data]);

  /* ── Radar data ──────────────────────────────────────────── */
  const radarData = useMemo(() => DIM_KEYS.map(dk => ({
    dimension: IRIS_METRICS[dk].name.split(' -- ')[0],
    portfolio: agg.dimScores[dk] || 0,
    benchmark: GIIN_BENCHMARKS[dk] || 0,
  })), [agg]);

  /* ── SDG flow ────────────────────────────────────────────── */
  const sdgFlow = useMemo(() => {
    const counts = {};
    ALL_METRICS.forEach(m => m.sdgs.forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    return Object.entries(counts).map(([sdg, count]) => ({ sdg: `SDG ${sdg}`, name: SDG_NAMES[sdg] || `SDG ${sdg}`, count, fill: SDG_COLORS[sdg] || T.navy })).sort((a, b) => b.count - a.count);
  }, []);

  /* ── Sorted catalog ──────────────────────────────────────── */
  const sortedCatalog = useMemo(() => {
    const arr = [...ALL_METRICS];
    arr.sort((a, b) => {
      const va = a[catSortCol] ?? a.id; const vb = b[catSortCol] ?? b.id;
      if (typeof va === 'string') return catSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return catSortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [catSortCol, catSortDir]);

  /* ── Save IRIS data input ────────────────────────────────── */
  const saveIrisInput = useCallback(() => {
    if (!editCompany) return;
    const next = { ...irisData, [editCompany]: { ...(irisData[editCompany] || {}), ...editValues } };
    setIrisData(next);
    saveIris(next);
    setEditCompany(null);
    setEditValues({});
  }, [editCompany, editValues, irisData]);

  /* ── Exports ─────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const header = ['Company', 'Sector', ...ALL_METRICS.map(m => m.id + '_' + m.name.replace(/,/g, '')), 'Avg_Score', 'Evidence_Tier'].join(',');
    const rows = data.map(d => [d.company_name || d.company_id, d.sector, ...ALL_METRICS.map(m => fmt(d[m.id]?.value, 2)), fmt(d.avgScore, 1), d.evidenceQual].join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `IRIS_Plus_Report_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }, [data]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ generated: new Date().toISOString(), metrics: ALL_METRICS.map(m => ({ id: m.id, name: m.name, dimension: m.dimName, unit: m.unit, sdgs: m.sdgs })), holdings: data.map(d => ({ id: d.company_id, name: d.company_name, sector: d.sector, avgScore: d.avgScore, evidenceQual: d.evidenceQual, metrics: ALL_METRICS.reduce((o, m) => { o[m.id] = d[m.id]?.value; return o; }, {}) })) }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `IRIS_Plus_Metrics_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  }, [data]);

  const handlePrint = useCallback(() => window.print(), []);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'catalog', label: 'Metric Catalog' },
    { key: 'holdings', label: 'Holdings' },
    { key: 'input', label: 'Data Input' },
    { key: 'sdg', label: 'SDG Alignment' },
    { key: 'evidence', label: 'Evidence' },
    { key: 'report', label: 'Report' },
  ];

  /* ══════════════════════════════════════════════════════════ */
  /*  RENDER                                                    */
  /* ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: T.navy }}>IRIS+ Impact Metrics Catalog</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge text="GIIN" color={T.navy} /><Badge text="40 Metrics" color={T.sage} /><Badge text="5 Dimensions" color="#2563eb" /><Badge text="SDG-Linked" color={T.amber} />
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
        {[['SDG Tracker', '/sdg-tracker'], ['IWA Engine', '/impact-weighted-accounts'], ['Social Impact', '/social-impact'], ['PE/VC ESG', '/pe-vc-esg']].map(([label, path]) => (
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
        <KPI label="Metrics Tracked" value={ALL_METRICS.length} color={T.navy} sub="IRIS+ catalog" />
        <KPI label="Dimensions Covered" value={DIM_KEYS.length} color="#2563eb" sub="What/Who/How Much/Contribution/Risk" />
        <KPI label="SDGs Linked" value={agg.linkedSdgs} color={T.sage} sub="of 17 goals" />
        <KPI label="Holdings Assessed" value={data.length} color={T.navy} />
        <KPI label="Avg Impact Score" value={fmt(agg.avgScore, 1)} color={agg.avgScore >= 50 ? T.green : T.amber} sub="0-100 scale" />
        <KPI label="Top Impact Sector" value={(agg.topSector || '--').slice(0, 20)} color={T.sage} />
        <KPI label="Impact Revenue %" value={fmt(agg.impactRevPct, 1) + '%'} color={T.amber} />
        <KPI label="Beneficiaries (est.)" value={fmtK(agg.totalBeneficiaries)} color={T.green} />
        <KPI label="GHG Reduced" value={fmtK(agg.totalGhg) + ' tCO2e'} color="#16a34a" />
        <KPI label="Evidence Quality Avg" value={`Tier ${fmt(agg.avgEvidence, 1)}`} color={agg.avgEvidence <= 2 ? T.green : agg.avgEvidence <= 3 ? T.amber : T.red} sub="1=RCT, 5=anecdotal" />
      </div>

      {/* ═══ OVERVIEW TAB ══════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          {/* Radar chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: T.navy }}>5-Dimension Radar -- Portfolio vs GIIN Benchmark</h3>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: T.textSec }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                  <Radar name="Portfolio" dataKey="portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
                  <Radar name="GIIN Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeWidth={2} strokeDasharray="5 5" />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Card>

            {/* Dimension cards */}
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: T.navy }}>Dimension Scores</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DIM_KEYS.map(dk => {
                  const score = agg.dimScores[dk] || 0;
                  const bench = GIIN_BENCHMARKS[dk] || 0;
                  return (
                    <div key={dk} style={{ background: T.surfaceH, borderRadius: 10, padding: '12px 16px', cursor: 'pointer', border: activeDim === dk ? `2px solid ${IRIS_METRICS[dk].color}` : '2px solid transparent' }} onClick={() => { setActiveDim(dk); setActiveTab('catalog'); }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: IRIS_METRICS[dk].color }}>{IRIS_METRICS[dk].name}</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: score >= bench ? T.green : T.amber }}>{fmt(score, 0)}</span>
                      </div>
                      <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, score)}%`, height: '100%', background: IRIS_METRICS[dk].color, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>GIIN Benchmark: {bench} | {IRIS_METRICS[dk].metrics.length} metrics</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Impact-SDG flow chart */}
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Impact Contribution by SDG</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sdgFlow} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sdg" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Metrics Contributing', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textMut }} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}><div style={{ fontWeight: 600 }}>{d?.sdg}: {d?.name}</div><div>Contributing metrics: {d?.count}</div></div>);
                }} />
                <Bar dataKey="count" name="Contributing Metrics" radius={[6, 6, 0, 0]}>
                  {sdgFlow.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Peer comparison */}
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Portfolio vs GIIN Peer Benchmarks</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={DIM_KEYS.map(dk => ({ dim: IRIS_METRICS[dk].name.split(' -- ')[0], portfolio: agg.dimScores[dk], benchmark: GIIN_BENCHMARKS[dk] }))} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="dim" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip content={<TT />} />
                <Legend />
                <Bar dataKey="portfolio" name="Portfolio" fill={T.navy} radius={[4, 4, 0, 0]} />
                <Bar dataKey="benchmark" name="GIIN Benchmark" fill={T.gold} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* ═══ CATALOG TAB ═══════════════════════════════════════ */}
      {activeTab === 'catalog' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: T.navy }}>IRIS+ Metric Catalog ({ALL_METRICS.length} Metrics)</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {DIM_KEYS.map(dk => (
              <button key={dk} onClick={() => setActiveDim(dk)} style={{ padding: '6px 14px', borderRadius: 8, border: activeDim === dk ? `2px solid ${IRIS_METRICS[dk].color}` : `1px solid ${T.border}`, background: activeDim === dk ? IRIS_METRICS[dk].color : T.surface, color: activeDim === dk ? '#fff' : T.text, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                {IRIS_METRICS[dk].name.split(' -- ')[0]} ({IRIS_METRICS[dk].metrics.length})
              </button>
            ))}
            <button onClick={() => setActiveDim('all')} style={{ padding: '6px 14px', borderRadius: 8, border: activeDim === 'all' ? `2px solid ${T.navy}` : `1px solid ${T.border}`, background: activeDim === 'all' ? T.navy : T.surface, color: activeDim === 'all' ? '#fff' : T.text, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
              All ({ALL_METRICS.length})
            </button>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: 500 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <SortHeader label="ID" sortKey="id" sortCol={catSortCol} sortDir={catSortDir} onSort={handleCatSort} />
                  <SortHeader label="Metric" sortKey="name" sortCol={catSortCol} sortDir={catSortDir} onSort={handleCatSort} />
                  <SortHeader label="Dimension" sortKey="dimName" sortCol={catSortCol} sortDir={catSortDir} onSort={handleCatSort} />
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Unit</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>SDGs</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Sectors</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {(activeDim === 'all' ? sortedCatalog : sortedCatalog.filter(m => m.dimension === activeDim)).map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: m.dimColor }}>{m.id}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m.name}</td>
                    <td style={{ padding: '8px 12px', color: m.dimColor }}>{m.dimName.split(' -- ')[0]}</td>
                    <td style={{ padding: '8px 12px', color: T.textSec }}>{m.unit}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {m.sdgs.map(s => <span key={s} style={{ fontSize: 9, fontWeight: 600, background: SDG_COLORS[s] || T.navy, color: '#fff', borderRadius: 4, padding: '1px 5px' }}>{s}</span>)}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec }}>{(m.sector_relevance || []).join(', ').slice(0, 30)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec, maxWidth: 200 }}>{(m.description || '').slice(0, 60)}{(m.description || '').length > 60 ? '...' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══ HOLDINGS TAB ══════════════════════════════════════ */}
      {activeTab === 'holdings' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: T.navy }}>Holdings Impact Metrics</h3>
          <div style={{ overflowX: 'auto', maxHeight: 500 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <SortHeader label="Company" sortKey="company_name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Sector" sortKey="sector" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  {DIM_KEYS.map(dk => (
                    <SortHeader key={dk} label={IRIS_METRICS[dk].name.split(' -- ')[0]} sortKey={`_dim_${dk}`} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                  ))}
                  <SortHeader label="Avg Score" sortKey="avgScore" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                  <SortHeader label="Evidence" sortKey="evidenceQual" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 30).map((d, i) => (
                  <tr key={d.company_id || i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{(d.company_name || d.company_id || '--').slice(0, 24)}</td>
                    <td style={{ padding: '8px 12px', color: T.textSec }}>{(d.sector || '--').slice(0, 18)}</td>
                    {DIM_KEYS.map(dk => {
                      const sc = d[`_dim_${dk}`] || 0;
                      return <td key={dk} style={{ padding: '8px 12px', textAlign: 'right', color: sc >= 60 ? T.green : sc >= 40 ? T.amber : T.red, fontWeight: 600 }}>{fmt(sc, 0)}</td>;
                    })}
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: d.avgScore >= 50 ? T.green : T.amber }}>{fmt(d.avgScore, 1)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, background: d.evidenceQual <= 2 ? T.green : d.evidenceQual <= 3 ? T.amber : T.red, color: '#fff', borderRadius: 4, padding: '2px 8px' }}>Tier {d.evidenceQual}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══ DATA INPUT TAB ════════════════════════════════════ */}
      {activeTab === 'input' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: T.navy }}>Impact Data Input Panel</h3>
          <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 16px' }}>Enter IRIS+ metric values per holding. Persisted to localStorage (ra_iris_data_v1). Select a company to enter data.</p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {data.slice(0, 20).map(d => (
              <button key={d.company_id} onClick={() => { setEditCompany(d.company_id); setEditValues(irisData[d.company_id] || {}); }}
                style={{ padding: '6px 14px', borderRadius: 8, border: editCompany === d.company_id ? `2px solid ${T.navy}` : `1px solid ${T.border}`, background: editCompany === d.company_id ? T.navy : T.surface, color: editCompany === d.company_id ? '#fff' : T.text, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                {(d.company_name || d.company_id || '--').slice(0, 18)}
              </button>
            ))}
          </div>

          {editCompany && (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: T.navy }}>
                Entering data for: {(data.find(d => d.company_id === editCompany)?.company_name || editCompany)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {DIM_KEYS.map(dk => (
                  <div key={dk} style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: IRIS_METRICS[dk].color, marginBottom: 10 }}>{IRIS_METRICS[dk].name}</div>
                    {IRIS_METRICS[dk].metrics.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <label style={{ fontSize: 11, color: T.textSec, flex: 1, minWidth: 120 }}>{m.name} ({m.unit})</label>
                        <input type="number" step="any" value={editValues[m.id] ?? ''} onChange={e => setEditValues(p => ({ ...p, [m.id]: e.target.value }))}
                          style={{ width: 100, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }} placeholder={m.unit} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={saveIrisInput} style={{ padding: '8px 20px', borderRadius: 8, background: T.sage, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save Data</button>
                <button onClick={() => { setEditCompany(null); setEditValues({}); }} style={{ padding: '8px 20px', borderRadius: 8, background: T.surface, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Cancel</button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ═══ SDG ALIGNMENT TAB ═════════════════════════════════ */}
      {activeTab === 'sdg' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>SDG Alignment Matrix -- 40 Metrics x 17 Goals</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, position: 'sticky', left: 0, background: T.surface, zIndex: 1, minWidth: 140 }}>Metric</th>
                  {Object.entries(SDG_NAMES).map(([num, name]) => (
                    <th key={num} style={{ padding: '4px 3px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, minWidth: 32, writingMode: 'vertical-lr', height: 80, color: SDG_COLORS[num] || T.textMut, fontWeight: 600 }}>
                      {num}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_METRICS.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '4px 8px', fontWeight: 600, color: m.dimColor, position: 'sticky', left: 0, background: i % 2 === 0 ? T.surface : T.surfaceH, whiteSpace: 'nowrap' }}>
                      {m.id} {m.name.slice(0, 22)}
                    </td>
                    {Object.keys(SDG_NAMES).map(num => {
                      const linked = m.sdgs.includes(parseInt(num));
                      return (
                        <td key={num} style={{ padding: '2px', textAlign: 'center' }}>
                          {linked && <div style={{ width: 16, height: 16, borderRadius: 3, background: SDG_COLORS[num] || T.navy, margin: 'auto', opacity: 0.85 }} />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: T.textMut, marginTop: 12 }}>Colored cells indicate the metric directly contributes to the corresponding SDG target.</div>
        </Card>
      )}

      {/* ═══ EVIDENCE TAB ══════════════════════════════════════ */}
      {activeTab === 'evidence' && (
        <>
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Impact Evidence Assessment</h3>
            <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 16px' }}>Evidence quality tiers: Tier 1 = Randomized Control Trial, Tier 2 = Quasi-experimental, Tier 3 = Pre/post with comparison, Tier 4 = Correlation/surveys, Tier 5 = Anecdotal/self-reported.</p>
            <div style={{ overflowX: 'auto', maxHeight: 400 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Company</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Sector</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Evidence Tier</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Assessment</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Exec Risk</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>External Risk</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: T.textMut, borderBottom: `2px solid ${T.border}` }}>Stakeholder Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 25).map((d, i) => {
                    const exec = d['PI8291']?.value || 0;
                    const ext = d['PI4453']?.value || 0;
                    const stak = d['PI6190']?.value || 0;
                    const desc = d.evidenceQual <= 2 ? 'Strong quantitative evidence with control groups' : d.evidenceQual <= 3 ? 'Moderate evidence with pre/post measurement' : 'Limited evidence -- primarily self-reported data';
                    return (
                      <tr key={d.company_id || i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{(d.company_name || d.company_id || '--').slice(0, 22)}</td>
                        <td style={{ padding: '8px 12px', color: T.textSec }}>{(d.sector || '--').slice(0, 16)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: d.evidenceQual <= 2 ? T.green : d.evidenceQual <= 3 ? T.amber : T.red, color: '#fff', borderRadius: 6, padding: '3px 10px' }}>Tier {d.evidenceQual}</span>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec }}>{desc}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: exec > 60 ? T.red : exec > 35 ? T.amber : T.green, fontWeight: 600 }}>{fmt(exec, 0)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: ext > 60 ? T.red : ext > 35 ? T.amber : T.green, fontWeight: 600 }}>{fmt(ext, 0)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: stak > 60 ? T.red : stak > 35 ? T.amber : T.green, fontWeight: 600 }}>{fmt(stak, 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Additionality Assessment */}
          <Card style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#7c3aed' }}>Additionality Assessment</h3>
            <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>For impact investments: what would have happened without this capital?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {data.slice(0, 8).map(d => {
                const innov = d['PI9061']?.value || 0;
                const cap = d['OI5320']?.value || 0;
                const addScore = Math.min(100, innov * 0.6 + (cap > 0 ? 30 : 0) + 10);
                return (
                  <div key={d.company_id} style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{(d.company_name || d.company_id || '--').slice(0, 24)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T.textSec }}>Innovation Index</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(innov, 0)}/100</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T.textSec }}>Capital Mobilized</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>${fmt(cap, 1)}M</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: T.textSec }}>Additionality Score</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: addScore >= 60 ? T.green : addScore >= 40 ? T.amber : T.red }}>{fmt(addScore, 0)}/100</span>
                    </div>
                    <div style={{ height: 4, background: T.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${addScore}%`, height: '100%', background: '#7c3aed', borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* ═══ REPORT TAB ════════════════════════════════════════ */}
      {activeTab === 'report' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>IRIS+ Reporting Template -- GIIN-Compliant Impact Report</h3>
          <div style={{ background: T.surfaceH, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Impact Measurement Report</div>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 16 }}>Generated: {new Date().toLocaleDateString()} | Framework: GIIN IRIS+ | Holdings: {data.length}</div>

            {/* Executive Summary */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8, borderBottom: `2px solid ${T.border}`, paddingBottom: 4 }}>1. Executive Summary</div>
              <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, margin: 0 }}>
                This portfolio of {data.length} holdings achieves an average impact score of {fmt(agg.avgScore, 1)}/100 across five IRIS+ dimensions.
                The portfolio contributes to {agg.linkedSdgs} of 17 SDGs, with {agg.topSector} as the highest-impact sector.
                Evidence quality averages Tier {fmt(agg.avgEvidence, 1)} across holdings.
              </p>
            </div>

            {/* Dimension Scores */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8, borderBottom: `2px solid ${T.border}`, paddingBottom: 4 }}>2. Dimension Performance</div>
              <table style={{ width: '100%', maxWidth: 500, borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textMut }}>Dimension</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: `1px solid ${T.border}`, color: T.textMut }}>Score</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: `1px solid ${T.border}`, color: T.textMut }}>Benchmark</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: `1px solid ${T.border}`, color: T.textMut }}>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {DIM_KEYS.map(dk => {
                    const sc = agg.dimScores[dk] || 0;
                    const bn = GIIN_BENCHMARKS[dk] || 0;
                    const delta = sc - bn;
                    return (
                      <tr key={dk}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: IRIS_METRICS[dk].color }}>{IRIS_METRICS[dk].name.split(' -- ')[0]}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(sc, 0)}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', color: T.textSec }}>{bn}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', color: delta >= 0 ? T.green : T.red, fontWeight: 600 }}>{delta >= 0 ? '+' : ''}{fmt(delta, 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Key Metrics */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8, borderBottom: `2px solid ${T.border}`, paddingBottom: 4 }}>3. Key Impact Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={{ background: T.surface, borderRadius: 8, padding: 12, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textMut }}>Total Beneficiaries</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>{fmtK(agg.totalBeneficiaries)}</div>
                </div>
                <div style={{ background: T.surface, borderRadius: 8, padding: 12, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textMut }}>GHG Reduced</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>{fmtK(agg.totalGhg)} tCO2e</div>
                </div>
                <div style={{ background: T.surface, borderRadius: 8, padding: 12, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textMut }}>SDGs Addressed</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{agg.linkedSdgs} of 17</div>
                </div>
                <div style={{ background: T.surface, borderRadius: 8, padding: 12, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textMut }}>Avg Evidence Quality</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: agg.avgEvidence <= 2.5 ? T.green : T.amber }}>Tier {fmt(agg.avgEvidence, 1)}</div>
                </div>
              </div>
            </div>

            {/* Methodology Note */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8, borderBottom: `2px solid ${T.border}`, paddingBottom: 4 }}>4. Methodology</div>
              <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, margin: 0 }}>
                Impact metrics follow the GIIN IRIS+ catalog standard. Scores are computed based on sector-adjusted performance across 40 metrics in 5 dimensions.
                Evidence quality assessment uses the Nesta Standards of Evidence framework (Tier 1-5). Benchmarks sourced from GIIN Annual Impact Investor Survey.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} style={{ padding: '8px 20px', borderRadius: 8, background: T.navy, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Download Full Report CSV</button>
            <button onClick={exportJSON} style={{ padding: '8px 20px', borderRadius: 8, background: T.sage, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Download Metrics JSON</button>
            <button onClick={handlePrint} style={{ padding: '8px 20px', borderRadius: 8, background: T.surface, color: T.navy, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Print Report</button>
          </div>
        </Card>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', fontSize: 11, color: T.textMut, padding: '16px 0', borderTop: `1px solid ${T.border}`, marginTop: 32 }}>
        IRIS+ Impact Metrics Catalog | GIIN Standard | {ALL_METRICS.length} Metrics | 5 Dimensions | {data.length} holdings assessed | Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
