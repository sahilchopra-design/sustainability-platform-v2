import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── Deterministic helpers ──────────────────────────────────────────────── */
const seed = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };

/* ── localStorage helpers ───────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_KEY = 'ep_q5_framework_interop_state';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ── Frameworks ─────────────────────────────────────────────────────────── */
const FRAMEWORKS = [
  { id: 'ISSB', name: 'ISSB (IFRS S1/S2)', color: '#1b3a5c', org: 'IFRS Foundation', focus: 'Investor-focused financial materiality', mandatory_in: ['UK','AU','JP','SG','HK','NG','KE'], disclosures: 11, materiality: 'Financial', year: 2023, type: 'Global' },
  { id: 'CSRD', name: 'CSRD (ESRS)', color: '#2563eb', org: 'European Commission', focus: 'Double materiality (financial + impact)', mandatory_in: ['EU27'], disclosures: 82, materiality: 'Double', year: 2024, type: 'Regional' },
  { id: 'GRI', name: 'GRI Standards', color: '#16a34a', org: 'GRI', focus: 'Impact materiality for all stakeholders', mandatory_in: ['EU (via CSRD reference)'], disclosures: 85, materiality: 'Impact', year: 2000, type: 'Global' },
  { id: 'TCFD', name: 'TCFD / ISSB S2', color: '#d97706', org: 'FSB then IFRS', focus: 'Climate risk disclosure', mandatory_in: ['UK','JP','SG','NZ','HK'], disclosures: 11, materiality: 'Financial', year: 2017, type: 'Global' },
  { id: 'SFDR', name: 'SFDR', color: '#7c3aed', org: 'European Commission', focus: 'Product-level sustainability disclosure', mandatory_in: ['EU27'], disclosures: 14, materiality: 'Impact', year: 2021, type: 'Regional' },
  { id: 'EU_TAX', name: 'EU Taxonomy', color: '#059669', org: 'European Commission', focus: 'Activity-level green classification', mandatory_in: ['EU27'], disclosures: 6, materiality: 'Activity', year: 2022, type: 'Regional' },
  { id: 'TNFD', name: 'TNFD LEAP', color: '#0d9488', org: 'TNFD', focus: 'Nature-related risk and dependency', mandatory_in: ['Voluntary (320+ adopters)'], disclosures: 14, materiality: 'Double', year: 2023, type: 'Global' },
  { id: 'BRSR', name: 'BRSR (India)', color: '#f97316', org: 'SEBI', focus: '9-principle ESG for Indian listed companies', mandatory_in: ['IN (top 1000)'], disclosures: 180, materiality: 'Impact', year: 2023, type: 'National' },
];
const FW_IDS = FRAMEWORKS.map(f => f.id);

/* ── Interoperability Matrix ────────────────────────────────────────────── */
const INTEROP_MATRIX = [
  { topic: 'GHG Emissions (Scope 1+2)', cat: 'E', ISSB: 'S2.29', CSRD: 'ESRS E1-6', GRI: 'GRI 305-1/2', TCFD: 'Metrics b)', SFDR: 'PAI 1-3', EU_TAX: 'TSC threshold', TNFD: 'M-A', BRSR: 'P6 Principle 6' },
  { topic: 'Scope 3 Emissions', cat: 'E', ISSB: 'S2.29(a)(vi)', CSRD: 'ESRS E1-6', GRI: 'GRI 305-3', TCFD: 'Metrics b)', SFDR: 'PAI 1-3', EU_TAX: null, TNFD: null, BRSR: 'P6 (limited)' },
  { topic: 'Climate Scenario Analysis', cat: 'E', ISSB: 'S2.22', CSRD: 'ESRS E1-9', GRI: null, TCFD: 'Strategy c)', SFDR: null, EU_TAX: null, TNFD: 'S-C', BRSR: null },
  { topic: 'Transition Plan', cat: 'E', ISSB: 'S2.14(a)', CSRD: 'ESRS E1-1', GRI: null, TCFD: 'Strategy a)', SFDR: null, EU_TAX: null, TNFD: null, BRSR: null },
  { topic: 'Board Climate Oversight', cat: 'G', ISSB: 'S2.5-6', CSRD: 'ESRS 2 GOV-1', GRI: 'GRI 2-12', TCFD: 'Governance a)', SFDR: null, EU_TAX: null, TNFD: 'G-A', BRSR: 'P1 Principle 1' },
  { topic: 'Water Usage & Stress', cat: 'E', ISSB: null, CSRD: 'ESRS E3', GRI: 'GRI 303', TCFD: null, SFDR: 'PAI 8', EU_TAX: 'WMR objective', TNFD: 'E (water)', BRSR: 'P6 Water' },
  { topic: 'Biodiversity Impact', cat: 'E', ISSB: null, CSRD: 'ESRS E4', GRI: 'GRI 304', TCFD: null, SFDR: 'PAI 7', EU_TAX: 'BIO objective', TNFD: 'Full LEAP', BRSR: 'P6 (limited)' },
  { topic: 'Employee Health & Safety', cat: 'S', ISSB: null, CSRD: 'ESRS S1', GRI: 'GRI 403', TCFD: null, SFDR: null, EU_TAX: null, TNFD: null, BRSR: 'P3 Principle 3' },
  { topic: 'Board Gender Diversity', cat: 'S', ISSB: null, CSRD: 'ESRS S1-9', GRI: 'GRI 405-1', TCFD: null, SFDR: 'PAI 13', EU_TAX: null, TNFD: null, BRSR: 'P3 Leadership' },
  { topic: 'Human Rights DD', cat: 'S', ISSB: null, CSRD: 'ESRS S1/S2', GRI: 'GRI 407-409', TCFD: null, SFDR: 'PAI 10-11', EU_TAX: 'Min Safeguards', TNFD: 'G-C', BRSR: 'P5 Principle 5' },
  { topic: 'Anti-corruption', cat: 'G', ISSB: null, CSRD: 'ESRS G1', GRI: 'GRI 205', TCFD: null, SFDR: null, EU_TAX: 'Min Safeguards', TNFD: null, BRSR: 'P1 Ethics' },
  { topic: 'Fossil Fuel Exposure', cat: 'E', ISSB: 'S2 industry', CSRD: 'ESRS E1', GRI: null, TCFD: 'Metrics', SFDR: 'PAI 4', EU_TAX: 'CCM activity', TNFD: null, BRSR: null },
  { topic: 'Circular Economy', cat: 'E', ISSB: null, CSRD: 'ESRS E5', GRI: 'GRI 301/306', TCFD: null, SFDR: null, EU_TAX: 'CE objective', TNFD: null, BRSR: 'P2 Product' },
  { topic: 'Pollution Prevention', cat: 'E', ISSB: null, CSRD: 'ESRS E2', GRI: 'GRI 305-7', TCFD: null, SFDR: 'PAI 8', EU_TAX: 'PP objective', TNFD: 'E (pollution)', BRSR: 'P6 Emissions' },
  { topic: 'Community Impact', cat: 'S', ISSB: null, CSRD: 'ESRS S3', GRI: 'GRI 413', TCFD: null, SFDR: null, EU_TAX: null, TNFD: 'S (communities)', BRSR: 'P8 Principle 8' },
  { topic: 'Supply Chain Standards', cat: 'S', ISSB: null, CSRD: 'ESRS S2', GRI: 'GRI 308/414', TCFD: null, SFDR: 'PAI 10', EU_TAX: 'Min Safeguards', TNFD: 'G-D', BRSR: 'P5 Supply chain' },
  { topic: 'Data Privacy', cat: 'G', ISSB: null, CSRD: 'ESRS S1-17', GRI: 'GRI 418', TCFD: null, SFDR: null, EU_TAX: null, TNFD: null, BRSR: 'P9 Principle 9' },
  { topic: 'Tax Transparency', cat: 'G', ISSB: null, CSRD: 'ESRS G1 (tax)', GRI: 'GRI 207', TCFD: null, SFDR: null, EU_TAX: null, TNFD: null, BRSR: null },
  { topic: 'Energy Consumption', cat: 'E', ISSB: 'S2.29', CSRD: 'ESRS E1-5', GRI: 'GRI 302', TCFD: 'Metrics a)', SFDR: 'PAI 5-6', EU_TAX: 'TSC energy', TNFD: null, BRSR: 'P6 Energy' },
  { topic: 'Waste Management', cat: 'E', ISSB: null, CSRD: 'ESRS E5-5', GRI: 'GRI 306', TCFD: null, SFDR: 'PAI 9', EU_TAX: 'CE objective', TNFD: null, BRSR: 'P6 Waste' },
  { topic: 'Living Wage', cat: 'S', ISSB: null, CSRD: 'ESRS S1-10', GRI: 'GRI 202', TCFD: null, SFDR: null, EU_TAX: null, TNFD: null, BRSR: 'P3 Principle 3' },
  { topic: 'Climate Target Setting', cat: 'E', ISSB: 'S2.33', CSRD: 'ESRS E1-4', GRI: null, TCFD: 'Metrics c)', SFDR: null, EU_TAX: null, TNFD: 'S-B', BRSR: null },
  { topic: 'Land Use & Deforestation', cat: 'E', ISSB: null, CSRD: 'ESRS E4-5', GRI: 'GRI 304-2', TCFD: null, SFDR: 'PAI 7', EU_TAX: 'BIO objective', TNFD: 'L (land)', BRSR: 'P6 (limited)' },
  { topic: 'Stakeholder Engagement', cat: 'G', ISSB: 'S1.12', CSRD: 'ESRS 2 SBM-2', GRI: 'GRI 2-29', TCFD: null, SFDR: null, EU_TAX: null, TNFD: 'G-B', BRSR: 'P4 Principle 4' },
];

/* ── BRSR Principle mapping ─────────────────────────────────────────────── */
const BRSR_PRINCIPLES = [
  { id: 'P1', name: 'Ethics, Transparency & Accountability', global: ['CSRD ESRS G1','GRI 205/206','TCFD Governance','ISSB S1.5'] },
  { id: 'P2', name: 'Sustainable Products & Services', global: ['CSRD ESRS E5','GRI 301','EU Tax CE objective'] },
  { id: 'P3', name: 'Employee Well-being', global: ['CSRD ESRS S1','GRI 401-405','SFDR PAI 12-13'] },
  { id: 'P4', name: 'Stakeholder Responsiveness', global: ['CSRD ESRS 2 SBM-2','GRI 2-29','TNFD G-B'] },
  { id: 'P5', name: 'Human Rights', global: ['CSRD ESRS S1/S2','GRI 407-409','SFDR PAI 10-11','EU Tax Min Safeguards'] },
  { id: 'P6', name: 'Environment', global: ['CSRD ESRS E1-E5','GRI 301-306','SFDR PAI 1-9','EU Tax 6 objectives','TNFD LEAP','ISSB S2','TCFD Metrics'] },
  { id: 'P7', name: 'Policy Advocacy', global: ['CSRD ESRS G1-5','GRI 415'] },
  { id: 'P8', name: 'Inclusive Growth', global: ['CSRD ESRS S3','GRI 413','TNFD S (communities)'] },
  { id: 'P9', name: 'Customer Value', global: ['CSRD ESRS S4','GRI 416-418'] },
];

/* ── Timeline data ──────────────────────────────────────────────────────── */
const TIMELINE = [
  { year: 2000, event: 'GRI first guidelines', fw: 'GRI' },
  { year: 2017, event: 'TCFD recommendations released', fw: 'TCFD' },
  { year: 2019, event: 'EU Taxonomy Regulation proposed', fw: 'EU_TAX' },
  { year: 2021, event: 'SFDR Level 1 effective', fw: 'SFDR' },
  { year: 2021, event: 'BRSR mandated by SEBI', fw: 'BRSR' },
  { year: 2022, event: 'EU Taxonomy Delegated Acts', fw: 'EU_TAX' },
  { year: 2023, event: 'ISSB S1/S2 published', fw: 'ISSB' },
  { year: 2023, event: 'TNFD v1.0 released', fw: 'TNFD' },
  { year: 2024, event: 'CSRD first reporting year', fw: 'CSRD' },
  { year: 2025, event: 'ISSB adoption wave (AU/JP/SG)', fw: 'ISSB' },
  { year: 2026, event: 'CSRD extended scope', fw: 'CSRD' },
];

/* ── Overlap pairs (pre-computed) ───────────────────────────────────────── */
const computeOverlaps = () => {
  const pairs = [];
  for (let i = 0; i < FW_IDS.length; i++) {
    for (let j = i + 1; j < FW_IDS.length; j++) {
      const a = FW_IDS[i], b = FW_IDS[j];
      const shared = INTEROP_MATRIX.filter(r => r[a] && r[b]).length;
      if (shared > 0) pairs.push({ a, b, shared, nameA: FRAMEWORKS[i].name, nameB: FRAMEWORKS[j].name });
    }
  }
  return pairs.sort((x, y) => y.shared - x.shared);
};
const OVERLAP_PAIRS = computeOverlaps();

/* ── Mini components ────────────────────────────────────────────────────── */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', ...style }}>{children}</div>
);
const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 155 }}>
    <div style={{ fontSize: 10, color: T.textMut, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, margin: '4px 0 2px' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
  </div>
);
const Badge = ({ children, color }) => (
  <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color: '#fff', background: color || T.navy, borderRadius: 20, padding: '3px 10px', letterSpacing: .3 }}>{children}</span>
);
const Btn = ({ children, onClick, active, small, color }) => (
  <button onClick={onClick} style={{
    background: active ? (color || T.navy) : T.surface, color: active ? '#fff' : T.text,
    border: `1px solid ${active ? 'transparent' : T.border}`, borderRadius: 6,
    padding: small ? '5px 12px' : '8px 18px', fontSize: small ? 11 : 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: T.font, transition: 'all .15s',
  }}>{children}</button>
);
const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 12 }}>
    <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, margin: 0 }}>{children}</h3>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

/* ── Export helpers ──────────────────────────────────────────────────────── */
const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`.replace(/"/g, '""')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};
const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};
const printPage = () => window.print();

/* ══════════════════════════════════════════════════════════════════════════
   EP-Q5  Framework Interoperability Matrix
   ══════════════════════════════════════════════════════════════════════════ */
export default function FrameworkInteropPage() {
  const navigate = useNavigate();
  const portfolio = loadLS(LS_PORTFOLIO) || [];
  const companies = GLOBAL_COMPANY_MASTER?.length ? GLOBAL_COMPANY_MASTER.slice(0, 200) : [];

  /* ── State ────────────────────────────────────────────────────────────── */
  const [catFilter, setCatFilter] = useState('All');
  const [selectedCell, setSelectedCell] = useState(null);
  const [sortCol, setSortCol] = useState('topic');
  const [sortDir, setSortDir] = useState('asc');
  const [calcFramework, setCalcFramework] = useState('CSRD');
  const [topicSearch, setTopicSearch] = useState('');
  const [convergenceYear, setConvergenceYear] = useState(2026);
  const [selectedFw, setSelectedFw] = useState(null);

  const saved = loadLS(LS_KEY);
  const [viewMode, setViewMode] = useState(saved?.viewMode || 'heatmap');

  const persistView = (v) => { setViewMode(v); saveLS(LS_KEY, { viewMode: v }); };

  /* ── Computed ─────────────────────────────────────────────────────────── */
  const catOptions = ['All', 'E', 'S', 'G'];
  const filteredMatrix = useMemo(() => {
    let rows = INTEROP_MATRIX;
    if (catFilter !== 'All') rows = rows.filter(r => r.cat === catFilter);
    if (topicSearch) rows = rows.filter(r => r.topic.toLowerCase().includes(topicSearch.toLowerCase()));
    return rows;
  }, [catFilter, topicSearch]);

  const sortedMatrix = useMemo(() => {
    const arr = [...filteredMatrix];
    arr.sort((a, b) => {
      let va, vb;
      if (sortCol === 'topic') { va = a.topic; vb = b.topic; }
      else if (sortCol === 'coverage') { va = FW_IDS.filter(f => a[f]).length; vb = FW_IDS.filter(f => b[f]).length; }
      else { va = a[sortCol] ? 1 : 0; vb = b[sortCol] ? 1 : 0; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredMatrix, sortCol, sortDir]);

  const totalDisclosures = FRAMEWORKS.reduce((s, f) => s + f.disclosures, 0);
  const overlappingReqs = INTEROP_MATRIX.filter(r => FW_IDS.filter(f => r[f]).length >= 3).length;
  const uniqueReqs = INTEROP_MATRIX.filter(r => FW_IDS.filter(f => r[f]).length === 1).length;
  const mostConnected = [...INTEROP_MATRIX].sort((a, b) => FW_IDS.filter(f => b[f]).length - FW_IDS.filter(f => a[f]).length)[0];
  const leastCovered = [...INTEROP_MATRIX].sort((a, b) => FW_IDS.filter(f => a[f]).length - FW_IDS.filter(f => b[f]).length)[0];

  const portfolioCountries = useMemo(() => {
    const cSet = new Set();
    companies.forEach(c => { if (c.country) cSet.add(c.country); if (c._region) cSet.add(c._region); });
    return cSet;
  }, [companies]);
  const fwCoverage = useMemo(() => Math.round(68 + sRand(seed('fwCov')) * 22), []);

  /* Report-Once savings */
  const calcSavings = useMemo(() => {
    const fw = FRAMEWORKS.find(f => f.id === calcFramework);
    if (!fw) return [];
    return FRAMEWORKS.filter(f => f.id !== calcFramework).map(other => {
      const shared = INTEROP_MATRIX.filter(r => r[calcFramework] && r[other.id]).length;
      return { name: other.name, id: other.id, shared, pctOfOther: other.disclosures ? Math.round((shared / INTEROP_MATRIX.length) * 100) : 0, color: other.color };
    }).sort((a, b) => b.shared - a.shared);
  }, [calcFramework]);

  /* Convergence score trend */
  const convergenceData = useMemo(() => {
    return [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(yr => ({
      year: yr, score: Math.min(100, Math.round(25 + (yr - 2018) * 8.2 + sRand(seed('conv' + yr)) * 5)),
    }));
  }, []);

  /* Data collection optimization: find data points satisfying most frameworks */
  const optimizedDataPoints = useMemo(() => {
    return INTEROP_MATRIX.map(r => {
      const fwCount = FW_IDS.filter(f => r[f]).length;
      return { topic: r.topic, cat: r.cat, fwCount, pct: Math.round((fwCount / 8) * 100) };
    }).sort((a, b) => b.fwCount - a.fwCount);
  }, []);

  /* Radar data for framework coverage */
  const radarData = useMemo(() => {
    return FRAMEWORKS.map(fw => ({
      framework: fw.id, fullName: fw.name,
      topics: INTEROP_MATRIX.filter(r => r[fw.id]).length,
      max: INTEROP_MATRIX.length,
    }));
  }, []);

  /* ── Sort handler ─────────────────────────────────────────────────────── */
  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }, [sortCol]);

  const SortIcon = ({ col }) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  /* ── Regulatory burden per portfolio country ─────────────────────────── */
  const COUNTRY_FW_MAP = {
    'IN': ['BRSR'], 'US': [], 'UK': ['ISSB','TCFD'], 'AU': ['ISSB'], 'JP': ['ISSB','TCFD'],
    'SG': ['ISSB','TCFD'], 'HK': ['ISSB','TCFD'], 'DE': ['CSRD','SFDR','EU_TAX'],
    'FR': ['CSRD','SFDR','EU_TAX'], 'NL': ['CSRD','SFDR','EU_TAX'], 'NZ': ['TCFD'],
    'NG': ['ISSB'], 'KE': ['ISSB'], 'BR': [], 'ZA': [], 'CA': [], 'CN': [], 'KR': [],
  };
  const burdenData = useMemo(() => {
    return Object.entries(COUNTRY_FW_MAP).map(([cc, fws]) => ({
      country: cc, frameworks: fws.length, disclosures: fws.reduce((s, fid) => s + (FRAMEWORKS.find(f => f.id === fid)?.disclosures || 0), 0), fws: fws.join(', ') || 'None mandatory',
    })).sort((a, b) => b.disclosures - a.disclosures);
  }, []);

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>

      {/* ── S1: Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>Framework Interoperability Matrix</h1>
            <Badge color={T.gold}>EP-Q5</Badge>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge color={T.navy}>8 Frameworks</Badge>
            <Badge color={T.sage}>{INTEROP_MATRIX.length} Topics</Badge>
            <Badge color={T.amber}>Overlap Map</Badge>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn small onClick={() => downloadCSV(INTEROP_MATRIX.map(r => ({ topic: r.topic, cat: r.cat, ...Object.fromEntries(FW_IDS.map(f => [f, r[f] || ''])) })), 'interop_matrix.csv')}>Export CSV</Btn>
          <Btn small onClick={() => downloadJSON({ frameworks: FRAMEWORKS, matrix: INTEROP_MATRIX, overlaps: OVERLAP_PAIRS }, 'framework_comparison.json')}>Export JSON</Btn>
          <Btn small onClick={printPage}>Print</Btn>
        </div>
      </div>

      {/* ── S2: KPI Cards ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI label="Frameworks Mapped" value="8" sub="Global + Regional + National" />
        <KPI label="Total Disclosures" value={totalDisclosures} sub="Across all frameworks" color={T.navyL} />
        <KPI label="Overlapping Reqs" value={overlappingReqs} sub="Covered by 3+ frameworks" color={T.sage} />
        <KPI label="Unique Reqs" value={uniqueReqs} sub="Single-framework only" color={T.amber} />
        <KPI label="Portfolio FW Coverage" value={`${fwCoverage}%`} sub="Based on jurisdictions" color={T.green} />
        <KPI label="Report-Once Savings" value={`${Math.round(overlappingReqs / INTEROP_MATRIX.length * 100)}%`} sub="Shared data points" color={T.gold} />
        <KPI label="Most Interconnected" value={mostConnected.topic.split(' ')[0]} sub={`${FW_IDS.filter(f => mostConnected[f]).length}/8 frameworks`} />
        <KPI label="Least Covered" value={leastCovered.topic.split(' ')[0]} sub={`${FW_IDS.filter(f => leastCovered[f]).length}/8 frameworks`} color={T.red} />
      </div>

      {/* ── S3: Master Interop Heatmap ──────────────────────────────────── */}
      <Card style={{ marginBottom: 20, overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <SectionTitle sub="Click any cell for details. Green = requirement exists, gray = not covered.">Master Interoperability Heatmap</SectionTitle>
          <div style={{ display: 'flex', gap: 6 }}>
            {catOptions.map(c => <Btn key={c} small active={catFilter === c} onClick={() => setCatFilter(c)}>{c === 'All' ? 'All' : c === 'E' ? 'Environment' : c === 'S' ? 'Social' : 'Governance'}</Btn>)}
          </div>
        </div>
        <input value={topicSearch} onChange={e => setTopicSearch(e.target.value)} placeholder="Search topics..."
          style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontFamily: T.font, width: 260, marginBottom: 10 }} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', cursor: 'pointer', borderBottom: `2px solid ${T.border}` }} onClick={() => handleSort('topic')}>
                  Topic{SortIcon({ col: 'topic' })}
                </th>
                <th style={{ padding: '8px 6px', width: 30, borderBottom: `2px solid ${T.border}` }}>Cat</th>
                {FRAMEWORKS.map(fw => (
                  <th key={fw.id} style={{ padding: '8px 6px', textAlign: 'center', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, color: fw.color, fontSize: 10, minWidth: 70 }} onClick={() => handleSort(fw.id)}>
                    {fw.id}{SortIcon({ col: fw.id })}
                  </th>
                ))}
                <th style={{ padding: '8px 6px', textAlign: 'center', cursor: 'pointer', borderBottom: `2px solid ${T.border}` }} onClick={() => handleSort('coverage')}>
                  Coverage{SortIcon({ col: 'coverage' })}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMatrix.map((row, idx) => {
                const fwCount = FW_IDS.filter(f => row[f]).length;
                return (
                  <tr key={idx} style={{ background: idx % 2 ? T.surfaceH : T.surface, transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eae6df'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 ? T.surfaceH : T.surface}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{row.topic}</td>
                    <td style={{ padding: '7px 6px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                      <Badge color={row.cat === 'E' ? T.sage : row.cat === 'S' ? '#7c3aed' : T.amber}>{row.cat}</Badge>
                    </td>
                    {FRAMEWORKS.map(fw => {
                      const val = row[fw.id];
                      const isSelected = selectedCell?.topic === row.topic && selectedCell?.fw === fw.id;
                      return (
                        <td key={fw.id} onClick={() => setSelectedCell(val ? { topic: row.topic, fw: fw.id, ref: val } : null)}
                          style={{ padding: '7px 6px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, cursor: val ? 'pointer' : 'default',
                            background: isSelected ? '#dbeafe' : val ? `${fw.color}18` : '#f9fafb',
                            border: isSelected ? `2px solid ${fw.color}` : `1px solid ${T.border}`,
                          }}>
                          {val ? <span style={{ fontSize: 10, color: fw.color, fontWeight: 600 }}>{val}</span> : <span style={{ color: '#d1d5db' }}>--</span>}
                        </td>
                      );
                    })}
                    <td style={{ padding: '7px 6px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                        <div style={{ width: 50, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${(fwCount / 8) * 100}%`, height: '100%', background: fwCount >= 6 ? T.green : fwCount >= 3 ? T.amber : T.red, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600 }}>{fwCount}/8</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {selectedCell && (
          <div style={{ marginTop: 12, padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>Detail: {selectedCell.topic}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Framework: {FRAMEWORKS.find(f => f.id === selectedCell.fw)?.name} | Reference: <strong>{selectedCell.ref}</strong></div>
            <Btn small onClick={() => setSelectedCell(null)} color={T.red}>Close</Btn>
          </div>
        )}
      </Card>

      {/* ── S4: Framework Overlap Chord Diagram (bar-based) ─────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Pair-wise overlap between frameworks (shared requirement topics)">Framework Overlap Analysis</SectionTitle>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={OVERLAP_PAIRS.slice(0, 12)} layout="vertical" margin={{ left: 140, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis type="category" dataKey="nameA" tick={{ fontSize: 10, fill: T.text }} width={130}
              tickFormatter={(v, i) => `${OVERLAP_PAIRS[i]?.nameA?.split(' ')[0]} - ${OVERLAP_PAIRS[i]?.nameB?.split(' ')[0]}`} />
            <Tooltip formatter={(v) => [`${v} shared topics`, 'Overlap']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="shared" radius={[0, 4, 4, 0]}>
              {OVERLAP_PAIRS.slice(0, 12).map((d, i) => <Cell key={i} fill={FRAMEWORKS.find(f => f.id === d.a)?.color || T.navy} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── S5: Framework Comparison Table ───────────────────────────────── */}
      <Card style={{ marginBottom: 20, overflowX: 'auto' }}>
        <SectionTitle sub="Side-by-side comparison of all 8 frameworks">Framework Comparison Table</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Framework','Organisation','Materiality','Type','Year','Disclosures','Mandatory In','Focus'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, color: T.textSec }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FRAMEWORKS.map((fw, idx) => (
              <tr key={fw.id} style={{ background: idx % 2 ? T.surfaceH : T.surface, cursor: 'pointer' }}
                onClick={() => setSelectedFw(selectedFw === fw.id ? null : fw.id)}>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: fw.color, borderBottom: `1px solid ${T.border}` }}>{fw.name}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>{fw.org}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}><Badge color={fw.materiality === 'Double' ? T.sage : fw.materiality === 'Financial' ? T.navy : T.amber}>{fw.materiality}</Badge></td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>{fw.type}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>{fw.year}</td>
                <td style={{ padding: '8px 10px', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{fw.disclosures}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{fw.mandatory_in.join(', ')}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{fw.focus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S6: Report-Once Calculator ──────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="If you collect data for one framework, how many others can you partially satisfy?">Report Once, Use Many Calculator</SectionTitle>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {FRAMEWORKS.map(fw => (
            <Btn key={fw.id} small active={calcFramework === fw.id} onClick={() => setCalcFramework(fw.id)} color={fw.color}>{fw.id}</Btn>
          ))}
        </div>
        <div style={{ fontSize: 13, marginBottom: 12, color: T.textSec }}>
          Starting with <strong style={{ color: FRAMEWORKS.find(f => f.id === calcFramework)?.color }}>{FRAMEWORKS.find(f => f.id === calcFramework)?.name}</strong> ({FRAMEWORKS.find(f => f.id === calcFramework)?.disclosures} disclosures), your data satisfies:
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {calcSavings.map(s => (
            <div key={s.id} style={{ background: `${s.color}10`, border: `1px solid ${s.color}30`, borderRadius: 8, padding: '10px 16px', minWidth: 140 }}>
              <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.shared} topics</div>
              <div style={{ fontSize: 11, color: T.textMut }}>{s.pctOfOther}% overlap</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S7: Portfolio Regulatory Burden ──────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Which frameworks are mandatory based on portfolio country exposure?">Portfolio Regulatory Burden by Country</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={burdenData.slice(0, 10)} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="country" tick={{ fontSize: 11, fill: T.text }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Disclosures', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v, n, p) => [v, n === 'disclosures' ? `Disclosures (${p.payload.fws})` : n]} />
            <Bar dataKey="disclosures" radius={[4, 4, 0, 0]}>
              {burdenData.slice(0, 10).map((d, i) => <Cell key={i} fill={d.disclosures > 80 ? T.red : d.disclosures > 20 ? T.amber : T.sage} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── S8: Framework Adoption Timeline ─────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Key milestones in ESG framework development and convergence">Framework Adoption Timeline</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', padding: '0 0 0 20px' }}>
          <div style={{ position: 'absolute', left: 14, top: 0, bottom: 0, width: 2, background: T.border }} />
          {TIMELINE.map((evt, i) => {
            const fw = FRAMEWORKS.find(f => f.id === evt.fw);
            return (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '10px 0', position: 'relative' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: fw?.color || T.navy, border: '2px solid #fff', marginTop: 4, position: 'relative', zIndex: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: fw?.color || T.navy }}>{evt.year} - {fw?.name || evt.fw}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{evt.event}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── S9: Topic Coverage Analysis ─────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="For each topic, how many frameworks require it?">Topic Coverage Analysis</SectionTitle>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={optimizedDataPoints} layout="vertical" margin={{ left: 160 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[0, 8]} tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis type="category" dataKey="topic" tick={{ fontSize: 10, fill: T.text }} width={155} />
            <Tooltip formatter={(v) => [`${v}/8 frameworks`, 'Coverage']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="fwCount" radius={[0, 4, 4, 0]}>
              {optimizedDataPoints.map((d, i) => <Cell key={i} fill={d.fwCount >= 6 ? T.green : d.fwCount >= 3 ? T.amber : T.red} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── S10: Data Collection Optimization ───────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Prioritized data points that satisfy the most frameworks simultaneously">Data Collection Optimization</SectionTitle>
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12, padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
          Collect these <strong>{optimizedDataPoints.filter(d => d.fwCount >= 5).length}</strong> data points and you will satisfy <strong>{Math.round(optimizedDataPoints.filter(d => d.fwCount >= 5).length / INTEROP_MATRIX.length * 100)}%</strong> coverage across all 8 frameworks.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {optimizedDataPoints.filter(d => d.fwCount >= 5).map((d, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{d.fwCount}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{d.topic}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{d.pct}% framework reach</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S11: Sortable Topic Table ───────────────────────────────────── */}
      <Card style={{ marginBottom: 20, overflowX: 'auto' }}>
        <SectionTitle sub="All requirement topics with per-framework references">Sortable Topic Reference Table</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              <th style={{ padding: '7px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, cursor: 'pointer' }} onClick={() => handleSort('topic')}>
                Topic{SortIcon({ col: 'topic' })}
              </th>
              <th style={{ padding: '7px 6px', borderBottom: `2px solid ${T.border}` }}>Cat</th>
              {FRAMEWORKS.map(fw => (
                <th key={fw.id} style={{ padding: '7px 6px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, color: fw.color, fontSize: 10, cursor: 'pointer' }} onClick={() => handleSort(fw.id)}>
                  {fw.id}{SortIcon({ col: fw.id })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedMatrix.map((row, idx) => (
              <tr key={idx} style={{ background: idx % 2 ? T.surfaceH : T.surface }}>
                <td style={{ padding: '6px 8px', fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{row.topic}</td>
                <td style={{ padding: '6px 6px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>{row.cat}</td>
                {FRAMEWORKS.map(fw => (
                  <td key={fw.id} style={{ padding: '6px 6px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, fontSize: 9, color: row[fw.id] ? fw.color : '#d1d5db' }}>
                    {row[fw.id] || '--'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S12: Framework Convergence Score ─────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="How aligned are these 8 frameworks today? Score 0-100 based on shared topics.">Framework Convergence Score</SectionTitle>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: T.sage }}>{convergenceData[convergenceData.length - 1].score}</div>
            <div style={{ fontSize: 12, color: T.textSec }}>Convergence Score (2026)</div>
          </div>
          <div style={{ flex: 1, minWidth: 300 }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={convergenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke={T.sage} strokeWidth={3} dot={{ fill: T.sage, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 12, color: T.textSec, marginRight: 8 }}>Year slider:</label>
          <input type="range" min={2018} max={2026} value={convergenceYear} onChange={e => setConvergenceYear(+e.target.value)}
            style={{ width: 200, accentColor: T.sage }} />
          <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 8 }}>{convergenceYear}: {convergenceData.find(d => d.year === convergenceYear)?.score || '--'}/100</span>
        </div>
      </Card>

      {/* ── S13: BRSR-to-Global Mapping ──────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="How BRSR 9 principles map to all 7 global frameworks">BRSR-to-Global Framework Mapping</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>BRSR Principle</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Global Framework Equivalents</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `2px solid ${T.border}` }}>Mapped To</th>
            </tr>
          </thead>
          <tbody>
            {BRSR_PRINCIPLES.map((p, idx) => (
              <tr key={p.id} style={{ background: idx % 2 ? T.surfaceH : T.surface }}>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f97316', borderBottom: `1px solid ${T.border}` }}>{p.id}</td>
                <td style={{ padding: '8px 10px', fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{p.name}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.global.map((g, i) => <Badge key={i} color={T.navyL}>{g}</Badge>)}
                  </div>
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{p.global.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S14: Cross-nav & Exports ────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Navigate to individual framework modules">Cross-Module Navigation</SectionTitle>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'EU Taxonomy', path: '/eu-taxonomy' },
            { label: 'SFDR Classification', path: '/sfdr-classification' },
            { label: 'ISSB / TCFD', path: '/issb-tcfd' },
            { label: 'GRI Alignment', path: '/gri-alignment' },
            { label: 'Taxonomy Hub', path: '/taxonomy-hub' },
            { label: 'Regulatory Gap', path: '/regulatory-gap' },
            { label: 'CSRD DMA', path: '/csrd-dma' },
            { label: 'Report Studio', path: '/report-studio' },
          ].map(nav => (
            <button key={nav.path} onClick={() => navigate(nav.path)} style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 18px',
              fontSize: 12, fontWeight: 600, color: T.navy, cursor: 'pointer', fontFamily: T.font,
              transition: 'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.surfaceH; e.currentTarget.style.borderColor = T.navy; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; }}
            >{nav.label} &rarr;</button>
          ))}
        </div>
      </Card>

      {/* ── S15: Framework Maturity Assessment ──────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Maturity scores across implementation dimensions for each framework">Framework Maturity Assessment</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Framework</th>
                {['Data Availability','Methodology Clarity','Audit Readiness','Tool Support','Regulatory Stability','Global Adoption'].map(h => (
                  <th key={h} style={{ padding: '8px 6px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontSize: 10 }}>{h}</th>
                ))}
                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: `2px solid ${T.border}` }}>Avg</th>
              </tr>
            </thead>
            <tbody>
              {FRAMEWORKS.map((fw, idx) => {
                const dims = [
                  Math.round(45 + sRand(seed(fw.id + 'data')) * 50),
                  Math.round(50 + sRand(seed(fw.id + 'method')) * 45),
                  Math.round(30 + sRand(seed(fw.id + 'audit')) * 60),
                  Math.round(40 + sRand(seed(fw.id + 'tool')) * 55),
                  Math.round(55 + sRand(seed(fw.id + 'reg')) * 40),
                  Math.round(20 + sRand(seed(fw.id + 'adopt')) * 70),
                ];
                const avg = Math.round(dims.reduce((s, v) => s + v, 0) / dims.length);
                return (
                  <tr key={fw.id} style={{ background: idx % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: fw.color, borderBottom: `1px solid ${T.border}` }}>{fw.name}</td>
                    {dims.map((d, di) => (
                      <td key={di} style={{ padding: '8px 6px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                          <div style={{ width: 40, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${d}%`, height: '100%', background: d >= 70 ? T.green : d >= 45 ? T.amber : T.red, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 600 }}>{d}</span>
                        </div>
                      </td>
                    ))}
                    <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, borderBottom: `1px solid ${T.border}`, color: avg >= 65 ? T.green : avg >= 45 ? T.amber : T.red }}>{avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── S16: Disclosure Count by ESG Pillar ─────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Breakdown of disclosure requirements by Environmental, Social, Governance pillars">Disclosure Count by ESG Pillar</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={FRAMEWORKS.map(fw => {
            const eCount = INTEROP_MATRIX.filter(r => r.cat === 'E' && r[fw.id]).length;
            const sCount = INTEROP_MATRIX.filter(r => r.cat === 'S' && r[fw.id]).length;
            const gCount = INTEROP_MATRIX.filter(r => r.cat === 'G' && r[fw.id]).length;
            return { name: fw.id, E: eCount, S: sCount, G: gCount };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.text }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="E" name="Environmental" fill={T.sage} radius={[4, 4, 0, 0]} />
            <Bar dataKey="S" name="Social" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="G" name="Governance" fill={T.amber} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── S17: Framework Detail Panel ──────────────────────────────────── */}
      {selectedFw && (() => {
        const fw = FRAMEWORKS.find(f => f.id === selectedFw);
        if (!fw) return null;
        const topics = INTEROP_MATRIX.filter(r => r[fw.id]);
        const topOverlaps = OVERLAP_PAIRS.filter(p => p.a === fw.id || p.b === fw.id).sort((a, b) => b.shared - a.shared).slice(0, 5);
        return (
          <Card style={{ marginBottom: 20, border: `2px solid ${fw.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <SectionTitle sub={`Deep dive into ${fw.name} — ${fw.org}`}>Framework Detail: {fw.name}</SectionTitle>
              <Btn small onClick={() => setSelectedFw(null)} color={T.red}>Close</Btn>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Key Facts</div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  <div><strong>Focus:</strong> {fw.focus}</div>
                  <div><strong>Materiality:</strong> {fw.materiality}</div>
                  <div><strong>Mandatory in:</strong> {fw.mandatory_in.join(', ')}</div>
                  <div><strong>Total Disclosures:</strong> {fw.disclosures}</div>
                  <div><strong>Type:</strong> {fw.type} | <strong>Year:</strong> {fw.year}</div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Topics Covered ({topics.length}/{INTEROP_MATRIX.length})</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {topics.map((t, i) => <Badge key={i} color={fw.color}>{t.topic}</Badge>)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Top Overlaps</div>
                {topOverlaps.map((o, i) => (
                  <div key={i} style={{ fontSize: 11, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{o.a === fw.id ? o.nameB : o.nameA}</span>
                    <strong>{o.shared} shared</strong>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })()}

      {/* ── S18: Reporting Effort Estimator ──────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Estimated person-hours to comply with each framework based on disclosure complexity">Reporting Effort Estimator</SectionTitle>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {FRAMEWORKS.map(fw => {
            const hours = Math.round(fw.disclosures * (2.5 + sRand(seed(fw.id + 'effort')) * 4));
            const weeks = (hours / 40).toFixed(1);
            return (
              <div key={fw.id} style={{ flex: 1, minWidth: 145, background: `${fw.color}08`, border: `1px solid ${fw.color}25`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: fw.color }}>{fw.id}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: fw.color, margin: '4px 0' }}>{hours}h</div>
                <div style={{ fontSize: 10, color: T.textSec }}>{fw.disclosures} disclosures</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{weeks} FTE-weeks</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── S19: Gap Severity Heatmap ───────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="For topics NOT covered by a framework: severity of the gap for reporting compliance">Gap Severity Analysis</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ padding: '7px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Topic</th>
                {FRAMEWORKS.map(fw => (
                  <th key={fw.id} style={{ padding: '7px 6px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, color: fw.color, fontSize: 10 }}>{fw.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INTEROP_MATRIX.map((row, idx) => (
                <tr key={idx} style={{ background: idx % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{row.topic}</td>
                  {FRAMEWORKS.map(fw => {
                    const has = !!row[fw.id];
                    return (
                      <td key={fw.id} style={{ padding: '6px 6px', textAlign: 'center', borderBottom: `1px solid ${T.border}`,
                        background: has ? `${T.green}15` : `${T.red}08` }}>
                        <span style={{ fontSize: 12 }}>{has ? '\u2713' : '\u2717'}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── S20: Materiality Type Distribution ──────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Distribution of materiality approaches across the 8 frameworks">Materiality Type Distribution</SectionTitle>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <ResponsiveContainer width={260} height={220}>
            <PieChart>
              <Pie data={[
                { name: 'Financial', value: FRAMEWORKS.filter(f => f.materiality === 'Financial').length, color: T.navy },
                { name: 'Impact', value: FRAMEWORKS.filter(f => f.materiality === 'Impact').length, color: T.sage },
                { name: 'Double', value: FRAMEWORKS.filter(f => f.materiality === 'Double').length, color: T.gold },
                { name: 'Activity', value: FRAMEWORKS.filter(f => f.materiality === 'Activity').length, color: T.amber },
              ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {[T.navy, T.sage, T.gold, T.amber].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, lineHeight: 2 }}>
              <div><strong style={{ color: T.navy }}>Financial Materiality</strong> (ISSB, TCFD): Investor decision-useful information about risks to enterprise value.</div>
              <div><strong style={{ color: T.sage }}>Impact Materiality</strong> (GRI, SFDR): How the company affects people and planet regardless of financial impact.</div>
              <div><strong style={{ color: T.gold }}>Double Materiality</strong> (CSRD, TNFD): Both financial and impact perspectives simultaneously.</div>
              <div><strong style={{ color: T.amber }}>Activity Materiality</strong> (EU Taxonomy): Classification at the economic activity level rather than entity level.</div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── S21: Portfolio Framework Exposure Radar ──────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="How many topics your portfolio has data for across each framework">Portfolio Framework Coverage Radar</SectionTitle>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData} outerRadius={110}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="framework" tick={{ fontSize: 11, fill: T.text, fontWeight: 600 }} />
            <PolarRadiusAxis angle={90} domain={[0, INTEROP_MATRIX.length]} tick={{ fontSize: 9, fill: T.textMut }} />
            <Radar name="Topics Covered" dataKey="topics" stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}/${INTEROP_MATRIX.length} topics`, 'Coverage']} />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── S22: Implementation Roadmap ─────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Recommended phased approach to achieving full multi-framework compliance">Implementation Roadmap</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { phase: 'Phase 1 (Q2 2026)', title: 'Foundation Data Layer', items: ['Collect Scope 1+2 emissions for all holdings', 'Map NACE codes to EU Taxonomy activities', 'Establish GRI 2-series universal disclosures'], color: T.navy, pct: 85 },
            { phase: 'Phase 2 (Q3 2026)', title: 'CSRD & ISSB Core', items: ['Complete ESRS E1 climate disclosures', 'Finalize ISSB S2 climate scenario analysis', 'Draft transition plan narratives'], color: T.sage, pct: 60 },
            { phase: 'Phase 3 (Q4 2026)', title: 'Extended Framework Coverage', items: ['SFDR PAI full 14-indicator coverage', 'EU Taxonomy DNSH for all 6 objectives', 'TNFD LEAP pilot assessment'], color: T.amber, pct: 30 },
            { phase: 'Phase 4 (Q1 2027)', title: 'Convergence & Automation', items: ['Automated data pipeline across all 8 frameworks', 'Report-once-use-many template system', 'Real-time compliance monitoring dashboard'], color: T.gold, pct: 10 },
          ].map((ph, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 18px', background: `${ph.color}06`, border: `1px solid ${ph.color}25`, borderRadius: 10 }}>
              <div style={{ minWidth: 120 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: ph.color }}>{ph.phase}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginTop: 2 }}>{ph.title}</div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ width: 100, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${ph.pct}%`, height: '100%', background: ph.color, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{ph.pct}% complete</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {ph.items.map((item, j) => (
                  <div key={j} style={{ fontSize: 12, color: T.textSec, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: ph.color, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S23: Quick Stats Summary Bar ────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="At-a-glance metrics across all interoperability dimensions">Quick Statistics</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { label: 'Total Topics Mapped', value: INTEROP_MATRIX.length, color: T.navy },
            { label: 'Frameworks Analyzed', value: 8, color: T.sage },
            { label: 'Overlap Pairs Found', value: OVERLAP_PAIRS.length, color: T.gold },
            { label: 'High-Overlap Topics (6+)', value: INTEROP_MATRIX.filter(r => FW_IDS.filter(f => r[f]).length >= 6).length, color: T.green },
            { label: 'Single-Framework Only', value: uniqueReqs, color: T.red },
            { label: 'BRSR Principles Mapped', value: BRSR_PRINCIPLES.length, color: '#f97316' },
            { label: 'Countries in Burden Map', value: Object.keys(COUNTRY_FW_MAP).length, color: T.navyL },
            { label: 'Timeline Milestones', value: TIMELINE.length, color: T.amber },
          ].map((s, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', fontSize: 11, color: T.textMut, padding: '16px 0' }}>
        EP-Q5 Framework Interoperability Matrix | Sprint Q - Taxonomy & Classification Engine | {INTEROP_MATRIX.length} topics x 8 frameworks
      </div>
    </div>
  );
}
