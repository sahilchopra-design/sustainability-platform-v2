import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const seed = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const pct = (v, d = 0) => `${v.toFixed(d)}%`;

/* ── localStorage ────────────────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_KEY = 'ep_q6_taxonomy_hub_state';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ── Module Definitions ──────────────────────────────────────────────────── */
const MODULES = [
  { id: 'eu_tax', name: 'EU Taxonomy', code: 'EP-Q1', path: '/eu-taxonomy', color: '#059669', icon: 'T', desc: 'Activity-level green classification against 6 environmental objectives', status: 'Active', completion: 87 },
  { id: 'sfdr', name: 'SFDR Classification', code: 'EP-Q2', path: '/sfdr-classification', color: '#7c3aed', icon: 'S', desc: 'Product-level Article 6/8/9 classification with PAI indicators', status: 'Active', completion: 82 },
  { id: 'issb', name: 'ISSB Materiality', code: 'EP-Q3', path: '/issb-tcfd', color: '#1b3a5c', icon: 'I', desc: 'IFRS S1/S2 financial materiality assessment and TCFD alignment', status: 'Active', completion: 74 },
  { id: 'gri', name: 'GRI Alignment', code: 'EP-Q4', path: '/gri-alignment', color: '#16a34a', icon: 'G', desc: 'GRI Standards impact materiality mapping and disclosure tracking', status: 'Active', completion: 69 },
  { id: 'interop', name: 'Framework Interop', code: 'EP-Q5', path: '/framework-interop', color: '#d97706', icon: 'F', desc: '8-framework interoperability matrix with overlap analysis', status: 'Active', completion: 91 },
];

/* ── Framework Coverage Baselines ────────────────────────────────────────── */
const FRAMEWORK_COVERAGE = [
  { fw: 'ISSB', fullName: 'ISSB (IFRS S1/S2)', compliance: 74, color: '#1b3a5c' },
  { fw: 'CSRD', fullName: 'CSRD (ESRS)', compliance: 62, color: '#2563eb' },
  { fw: 'GRI', fullName: 'GRI Standards', compliance: 69, color: '#16a34a' },
  { fw: 'TCFD', fullName: 'TCFD / ISSB S2', compliance: 78, color: '#d97706' },
  { fw: 'SFDR', fullName: 'SFDR', compliance: 82, color: '#7c3aed' },
  { fw: 'EU_TAX', fullName: 'EU Taxonomy', compliance: 57, color: '#059669' },
  { fw: 'TNFD', fullName: 'TNFD LEAP', compliance: 34, color: '#0d9488' },
  { fw: 'BRSR', fullName: 'BRSR (India)', compliance: 88, color: '#f97316' },
];

/* ── Country → Framework Adoption ────────────────────────────────────────── */
const COUNTRY_ADOPTION = [
  { country: 'EU (27)', frameworks: ['CSRD','SFDR','EU Taxonomy'], count: 3 },
  { country: 'United Kingdom', frameworks: ['ISSB','TCFD'], count: 2 },
  { country: 'Japan', frameworks: ['ISSB','TCFD'], count: 2 },
  { country: 'Australia', frameworks: ['ISSB'], count: 1 },
  { country: 'Singapore', frameworks: ['ISSB','TCFD'], count: 2 },
  { country: 'Hong Kong', frameworks: ['ISSB','TCFD'], count: 2 },
  { country: 'India', frameworks: ['BRSR'], count: 1 },
  { country: 'New Zealand', frameworks: ['TCFD'], count: 1 },
  { country: 'Nigeria', frameworks: ['ISSB'], count: 1 },
  { country: 'Kenya', frameworks: ['ISSB'], count: 1 },
  { country: 'United States', frameworks: ['Voluntary (GRI/TCFD)'], count: 0 },
  { country: 'China', frameworks: ['National ESG'], count: 0 },
  { country: 'Brazil', frameworks: ['CVM rules'], count: 0 },
];

/* ── Regulatory Deadlines ────────────────────────────────────────────────── */
const DEADLINES = [
  { date: '2026-04-30', fw: 'CSRD', desc: 'ESRS first reporting for large listed cos (FY2025)', urgency: 'high' },
  { date: '2026-06-30', fw: 'SFDR', desc: 'PAI statement annual update due', urgency: 'high' },
  { date: '2026-06-30', fw: 'EU Taxonomy', desc: 'Taxonomy KPI disclosure in annual report', urgency: 'high' },
  { date: '2026-07-01', fw: 'ISSB', desc: 'ISSB S2 mandatory in AU/SG/HK', urgency: 'medium' },
  { date: '2026-09-30', fw: 'BRSR', desc: 'BRSR Core filing for top 1000 IN companies', urgency: 'medium' },
  { date: '2026-12-31', fw: 'TNFD', desc: 'TNFD early adopter disclosure window', urgency: 'low' },
  { date: '2027-01-01', fw: 'CSRD', desc: 'CSRD extended to mid-cap EU companies', urgency: 'low' },
  { date: '2027-06-30', fw: 'ISSB', desc: 'ISSB adoption for JP/UK mandatory', urgency: 'low' },
];

/* ── Action Priorities ───────────────────────────────────────────────────── */
const ACTIONS = [
  { priority: 1, module: 'EU Taxonomy', action: 'Complete DNSH assessment for remaining 12 activities', impact: 'High', effort: 'Medium', deadline: '2026-04-15' },
  { priority: 2, module: 'SFDR', action: 'Collect PAI 1-3 emissions data for 8 missing holdings', impact: 'High', effort: 'High', deadline: '2026-05-01' },
  { priority: 3, module: 'ISSB', action: 'Draft Scope 3 category 15 methodology note', impact: 'Medium', effort: 'Medium', deadline: '2026-06-01' },
  { priority: 4, module: 'GRI', action: 'Map GRI 303 water disclosure to portfolio water data', impact: 'Medium', effort: 'Low', deadline: '2026-06-15' },
  { priority: 5, module: 'Interop', action: 'Validate cross-framework data consistency for PAI vs ESRS', impact: 'High', effort: 'Low', deadline: '2026-04-30' },
  { priority: 6, module: 'EU Taxonomy', action: 'Verify minimum safeguards for UNGC alignment', impact: 'Medium', effort: 'Low', deadline: '2026-05-15' },
  { priority: 7, module: 'SFDR', action: 'Update Article 8 template with new RTS annexes', impact: 'Medium', effort: 'Medium', deadline: '2026-07-01' },
  { priority: 8, module: 'ISSB', action: 'Finalize climate scenario analysis (1.5C/2.5C)', impact: 'High', effort: 'High', deadline: '2026-08-01' },
];

/* ── Data Gap Summary ────────────────────────────────────────────────────── */
const DATA_GAPS = [
  { framework: 'EU Taxonomy', gap: 'DNSH criteria for 4 NACE activities', severity: 'High', dataNeeded: 'Activity-level environmental metrics', holdingsAffected: 18 },
  { framework: 'SFDR', gap: 'PAI 7 Biodiversity data', severity: 'Medium', dataNeeded: 'Proximity to biodiversity-sensitive areas', holdingsAffected: 42 },
  { framework: 'ISSB', gap: 'Scope 3 Cat 15 financed emissions', severity: 'High', dataNeeded: 'PCAF-aligned financed emissions', holdingsAffected: 65 },
  { framework: 'GRI', gap: 'GRI 303 water withdrawal by source', severity: 'Medium', dataNeeded: 'Water consumption breakdown', holdingsAffected: 31 },
  { framework: 'TNFD', gap: 'LEAP assessment nature dependencies', severity: 'Low', dataNeeded: 'Ecosystem service dependency mapping', holdingsAffected: 55 },
  { framework: 'CSRD', gap: 'ESRS E4 biodiversity transition plan', severity: 'Medium', dataNeeded: 'Nature-positive targets', holdingsAffected: 38 },
  { framework: 'BRSR', gap: 'Principle 6 energy intensity', severity: 'Low', dataNeeded: 'Revenue-normalized energy data', holdingsAffected: 14 },
];

/* ── Mini Components ─────────────────────────────────────────────────────── */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', ...style }}>{children}</div>
);
const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', flex: 1, minWidth: 145 }}>
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
const ProgressBar = ({ value, max = 100, color, height = 8 }) => (
  <div style={{ width: '100%', height, background: '#e5e7eb', borderRadius: height / 2, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: '100%', background: color || T.sage, borderRadius: height / 2, transition: 'width .3s' }} />
  </div>
);

/* ── Export helpers ───────────────────────────────────────────────────────── */
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
   EP-Q6  Taxonomy & Classification Intelligence Dashboard (Hub)
   ══════════════════════════════════════════════════════════════════════════ */
export default function TaxonomyHubPage() {
  const navigate = useNavigate();
  const portfolio = loadLS(LS_PORTFOLIO) || [];
  const companies = GLOBAL_COMPANY_MASTER?.length ? GLOBAL_COMPANY_MASTER.slice(0, 200) : [];

  /* ── State ────────────────────────────────────────────────────────────── */
  const [sortCol, setSortCol] = useState('company');
  const [sortDir, setSortDir] = useState('asc');
  const [holdingSearch, setHoldingSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [activeAction, setActiveAction] = useState(null);
  const [sfdrSlider, setSfdrSlider] = useState(50);

  const saved = loadLS(LS_KEY);
  const [tab, setTab] = useState(saved?.tab || 'overview');
  const persistTab = (t) => { setTab(t); saveLS(LS_KEY, { tab: t }); };

  /* ── Computed KPIs ───────────────────────────────────────────────────── */
  const taxEligibility = 72.4;
  const taxAlignment = 41.8;
  const sfdrArt = 'Article 8';
  const sustainableInv = 38.6;
  const paiCoverage = 84;
  const issbCompliance = 74;
  const materialTopics = 18;
  const griDisclosures = 52;
  const fwCoverage = 71;
  const dataCompleteness = 68;
  const greenRevenue = 33.2;
  const dnshCompliance = 89;
  const safeguardsMet = 94;
  const interopSavings = 42;

  /* ── Holdings with framework compliance ───────────────────────────────── */
  const holdingsData = useMemo(() => {
    const src = companies.length ? companies.slice(0, 80) : Array.from({ length: 40 }, (_, i) => ({ name: `Company ${i + 1}`, ticker: `C${i + 1}`, sector: ['Energy','Financials','Technology','Materials','Industrials'][i % 5], country: ['IN','US','UK','DE','JP'][i % 5] }));
    return src.map((c, i) => {
      const s = seed(c.name || `c${i}`);
      return {
        company: c.name || c.company_name || `Company ${i + 1}`,
        ticker: c.ticker || c.isin?.slice(0, 6) || '--',
        sector: c.sector || c.nace_section || 'General',
        country: c.country || c._region || '--',
        eu_tax_eligible: sRand(s) > 0.3,
        eu_tax_aligned: sRand(s + 1) > 0.55,
        sfdr_art: sRand(s + 2) > 0.7 ? 'Art 9' : sRand(s + 2) > 0.35 ? 'Art 8' : 'Art 6',
        issb_ready: Math.round(40 + sRand(s + 3) * 55),
        gri_mapped: Math.round(30 + sRand(s + 4) * 60),
        data_complete: Math.round(45 + sRand(s + 5) * 50),
        dnsh_pass: sRand(s + 6) > 0.2,
        safeguards: sRand(s + 7) > 0.15,
      };
    });
  }, [companies]);

  const filteredHoldings = useMemo(() => {
    let arr = holdingsData;
    if (holdingSearch) arr = arr.filter(h => h.company.toLowerCase().includes(holdingSearch.toLowerCase()));
    arr = [...arr].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0; }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [holdingsData, holdingSearch, sortCol, sortDir]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }, [sortCol]);
  const SortIcon = ({ col }) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  /* ── Radar data ──────────────────────────────────────────────────────── */
  const radarData = FRAMEWORK_COVERAGE.map(f => ({ framework: f.fw, compliance: f.compliance, fullMark: 100 }));

  /* ── SFDR classification detail ──────────────────────────────────────── */
  const sfdrBreakdown = useMemo(() => {
    const a6 = holdingsData.filter(h => h.sfdr_art === 'Art 6').length;
    const a8 = holdingsData.filter(h => h.sfdr_art === 'Art 8').length;
    const a9 = holdingsData.filter(h => h.sfdr_art === 'Art 9').length;
    return [
      { name: 'Article 6', value: a6, color: '#9ca3af' },
      { name: 'Article 8', value: a8, color: '#7c3aed' },
      { name: 'Article 9', value: a9, color: '#059669' },
    ];
  }, [holdingsData]);

  /* ── Consistency check ─────────────────────────────────────────────────── */
  const consistencyData = useMemo(() => {
    const aligned = holdingsData.filter(h => h.eu_tax_aligned).length;
    const art9 = holdingsData.filter(h => h.sfdr_art === 'Art 9').length;
    const issbHigh = holdingsData.filter(h => h.issb_ready >= 75).length;
    return [
      { metric: 'EU Tax Aligned', count: aligned, pct: Math.round((aligned / holdingsData.length) * 100) },
      { metric: 'SFDR Art 9', count: art9, pct: Math.round((art9 / holdingsData.length) * 100) },
      { metric: 'ISSB Ready (75%+)', count: issbHigh, pct: Math.round((issbHigh / holdingsData.length) * 100) },
    ];
  }, [holdingsData]);

  /* ── Flow data (Taxonomy -> SFDR -> ISSB) ──────────────────────────── */
  const flowSteps = [
    { step: 1, label: 'EU Taxonomy Eligibility', value: taxEligibility, color: '#059669', desc: 'NACE activity classification' },
    { step: 2, label: 'DNSH + Safeguards', value: dnshCompliance, color: '#0d9488', desc: 'No significant harm criteria' },
    { step: 3, label: 'EU Taxonomy Alignment', value: taxAlignment, color: '#16a34a', desc: 'TSC threshold compliance' },
    { step: 4, label: 'SFDR Sustainable Investment', value: sustainableInv, color: '#7c3aed', desc: 'Feeds Art 8/9 classification' },
    { step: 5, label: 'ISSB Material Assessment', value: issbCompliance, color: '#1b3a5c', desc: 'Financial materiality overlay' },
  ];

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>

      {/* ── S1: Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>Taxonomy & Classification Intelligence</h1>
            <Badge color={T.gold}>EP-Q6</Badge>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge color={T.navy}>Hub</Badge>
            <Badge color="#059669">EU Tax</Badge>
            <Badge color="#7c3aed">SFDR</Badge>
            <Badge color={T.navy}>ISSB</Badge>
            <Badge color={T.green}>GRI</Badge>
            <Badge color={T.amber}>5 Modules</Badge>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn small onClick={() => downloadCSV(filteredHoldings.map(h => ({ ...h, eu_tax_eligible: h.eu_tax_eligible ? 'Y' : 'N', eu_tax_aligned: h.eu_tax_aligned ? 'Y' : 'N', dnsh_pass: h.dnsh_pass ? 'Y' : 'N', safeguards: h.safeguards ? 'Y' : 'N' })), 'taxonomy_hub_holdings.csv')}>Export CSV</Btn>
          <Btn small onClick={() => downloadJSON({ modules: MODULES, coverage: FRAMEWORK_COVERAGE, gaps: DATA_GAPS, actions: ACTIONS }, 'taxonomy_hub_full.json')}>Export JSON</Btn>
          <Btn small onClick={printPage}>Print</Btn>
        </div>
      </div>

      {/* ── S2: Module Status Cards ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <div key={m.id} onClick={() => navigate(m.path)} style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, flex: 1, minWidth: 180, cursor: 'pointer', transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.boxShadow = `0 2px 8px ${m.color}20`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{m.icon}</div>
              <Badge color={m.completion >= 80 ? T.green : m.completion >= 60 ? T.amber : T.red}>{m.completion}%</Badge>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{m.name}</div>
            <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{m.code}</div>
            <ProgressBar value={m.completion} color={m.color} />
            <div style={{ fontSize: 10, color: T.textMut, marginTop: 6 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* ── S3: 14 KPI Cards (2 rows) ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <KPI label="Tax Eligibility" value={pct(taxEligibility)} sub="NACE-eligible revenue" color="#059669" />
        <KPI label="Tax Alignment" value={pct(taxAlignment)} sub="TSC + DNSH compliant" color={T.green} />
        <KPI label="SFDR Classification" value={sfdrArt} sub="Product-level" color="#7c3aed" />
        <KPI label="Sustainable Inv %" value={pct(sustainableInv)} sub="SFDR definition" color={T.sage} />
        <KPI label="PAI Coverage" value={pct(paiCoverage)} sub="14 mandatory PAIs" color={T.navyL} />
        <KPI label="ISSB S2 Compliance" value={pct(issbCompliance)} sub="Climate disclosures" color={T.navy} />
        <KPI label="Material Topics" value={materialTopics} sub="DMA-identified" color={T.amber} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI label="GRI Disclosures" value={`${griDisclosures}/85`} sub="Standards available" color={T.green} />
        <KPI label="FW Coverage" value={pct(fwCoverage)} sub="8 frameworks" color={T.gold} />
        <KPI label="Data Completeness" value={pct(dataCompleteness)} sub="Cross-framework" color={T.navyL} />
        <KPI label="Green Revenue" value={pct(greenRevenue)} sub="Taxonomy-aligned" color="#059669" />
        <KPI label="DNSH Compliance" value={pct(dnshCompliance)} sub="No significant harm" color={T.sage} />
        <KPI label="Safeguards Met" value={pct(safeguardsMet)} sub="Min safeguards check" color={T.green} />
        <KPI label="Interop Savings" value={pct(interopSavings)} sub="Report-once benefit" color={T.gold} />
      </div>

      {/* ── S4: Classification Summary ──────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Current SFDR article classification, EU Taxonomy alignment gauge, and ISSB readiness">Classification Summary</SectionTitle>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* SFDR Article */}
          <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#7c3aed' }}>Art 8</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>SFDR Product Classification</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              {sfdrBreakdown.map(s => (
                <div key={s.name} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{s.name}</div>
                </div>
              ))}
            </div>
          </div>
          {/* EU Tax Gauge */}
          <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#059669" strokeWidth="10"
                  strokeDasharray={`${taxAlignment * 3.14} ${314 - taxAlignment * 3.14}`} strokeDashoffset="78.5" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{taxAlignment}%</div>
                <div style={{ fontSize: 9, color: T.textMut }}>Aligned</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>EU Taxonomy Alignment</div>
          </div>
          {/* ISSB Readiness */}
          <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: T.navy }}>{issbCompliance}%</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>ISSB S1/S2 Readiness</div>
            <ProgressBar value={issbCompliance} color={T.navy} height={10} />
          </div>
          {/* Sustainable Investment Slider */}
          <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Sustainable Investment Target</div>
            <input type="range" min={0} max={100} value={sfdrSlider} onChange={e => setSfdrSlider(+e.target.value)}
              style={{ width: '80%', accentColor: '#7c3aed' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: sustainableInv >= sfdrSlider ? T.green : T.red }}>
              Actual: {sustainableInv}% {sustainableInv >= sfdrSlider ? '>=' : '<'} Target: {sfdrSlider}%
            </div>
          </div>
        </div>
      </Card>

      {/* ── S5: Framework Coverage Radar ────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Portfolio compliance percentage across 8 frameworks">Framework Coverage Radar</SectionTitle>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={radarData} outerRadius={120}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="framework" tick={{ fontSize: 11, fill: T.text, fontWeight: 600 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
            <Radar name="Compliance %" dataKey="compliance" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          </RadarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, justifyContent: 'center' }}>
          {FRAMEWORK_COVERAGE.map(f => (
            <div key={f.fw} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: f.color }} />
              <span style={{ fontSize: 11, color: T.textSec }}>{f.fw}: <strong>{f.compliance}%</strong></span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S6: Taxonomy-SFDR-ISSB Flow ────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="How EU Taxonomy feeds into SFDR classification which references ISSB materiality">Taxonomy-SFDR-ISSB Classification Flow</SectionTitle>
        <div style={{ display: 'flex', gap: 0, alignItems: 'center', overflowX: 'auto' }}>
          {flowSteps.map((fs, i) => (
            <React.Fragment key={fs.step}>
              <div style={{ background: `${fs.color}12`, border: `2px solid ${fs.color}40`, borderRadius: 10, padding: '14px 18px', minWidth: 160, textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: 10, color: T.textMut, fontWeight: 700, marginBottom: 4 }}>STEP {fs.step}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: fs.color }}>{fs.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: fs.color, margin: '6px 0' }}>{fs.value}%</div>
                <div style={{ fontSize: 10, color: T.textSec }}>{fs.desc}</div>
              </div>
              {i < flowSteps.length - 1 && (
                <div style={{ fontSize: 18, color: T.textMut, padding: '0 6px', flexShrink: 0 }}>&rarr;</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* ── S7: Quick Action Cards ──────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Navigate to Sprint Q sub-modules">Quick Actions</SectionTitle>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {MODULES.map(m => (
            <button key={m.id} onClick={() => navigate(m.path)} style={{
              background: `${m.color}08`, border: `1px solid ${m.color}30`, borderRadius: 10, padding: '14px 20px',
              cursor: 'pointer', fontFamily: T.font, transition: 'all .15s', minWidth: 160, textAlign: 'left',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.background = `${m.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${m.color}30`; e.currentTarget.style.background = `${m.color}08`; }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.name}</div>
              <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{m.code} &rarr;</div>
            </button>
          ))}
        </div>
      </Card>

      {/* ── S8: Regulatory Deadline Integration ─────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Upcoming taxonomy/classification deadlines from regulatory calendar">Regulatory Deadlines</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEADLINES.map((dl, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: dl.urgency === 'high' ? '#fef2f2' : dl.urgency === 'medium' ? '#fffbeb' : T.surfaceH, borderRadius: 8, border: `1px solid ${dl.urgency === 'high' ? '#fecaca' : dl.urgency === 'medium' ? '#fde68a' : T.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dl.urgency === 'high' ? T.red : dl.urgency === 'medium' ? T.amber : T.sage, flexShrink: 0 }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, minWidth: 90 }}>{dl.date}</div>
              <Badge color={FRAMEWORK_COVERAGE.find(f => f.fw === dl.fw)?.color || T.navy}>{dl.fw}</Badge>
              <div style={{ fontSize: 12, color: T.textSec, flex: 1 }}>{dl.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S9: Action Prioritization ───────────────────────────────────── */}
      <Card style={{ marginBottom: 20, overflowX: 'auto' }}>
        <SectionTitle sub="Combined prioritized actions across all 5 Sprint Q modules">Action Prioritization</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['#','Module','Action','Impact','Effort','Deadline'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, color: T.textSec }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map((a, idx) => (
              <tr key={idx} style={{ background: activeAction === idx ? '#eff6ff' : idx % 2 ? T.surfaceH : T.surface, cursor: 'pointer' }}
                onClick={() => setActiveAction(activeAction === idx ? null : idx)}>
                <td style={{ padding: '8px 10px', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{a.priority}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}><Badge color={MODULES.find(m => m.name === a.module)?.color || T.navy}>{a.module}</Badge></td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>{a.action}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>
                  <Badge color={a.impact === 'High' ? T.red : a.impact === 'Medium' ? T.amber : T.sage}>{a.impact}</Badge>
                </td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>{a.effort}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}`, fontWeight: 600 }}>{a.deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S10: Framework Adoption by Country ──────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Which countries have adopted which mandatory ESG frameworks">Framework Adoption by Country</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={COUNTRY_ADOPTION} margin={{ left: 100 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: T.text }} width={100} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v, n, p) => [`${v} (${p.payload.frameworks.join(', ')})`, 'Frameworks']} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {COUNTRY_ADOPTION.map((d, i) => <Cell key={i} fill={d.count >= 3 ? T.navy : d.count >= 2 ? T.sage : d.count >= 1 ? T.amber : '#d1d5db'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── S11: Data Gap Summary ──────────────────────────────────────── */}
      <Card style={{ marginBottom: 20, overflowX: 'auto' }}>
        <SectionTitle sub="Across all frameworks: which data is missing?">Data Gap Summary</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Framework','Gap Description','Severity','Data Needed','Holdings Affected'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, color: T.textSec }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DATA_GAPS.map((g, idx) => (
              <tr key={idx} style={{ background: idx % 2 ? T.surfaceH : T.surface }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{g.framework}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>{g.gap}</td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>
                  <Badge color={g.severity === 'High' ? T.red : g.severity === 'Medium' ? T.amber : T.sage}>{g.severity}</Badge>
                </td>
                <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{g.dataNeeded}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{g.holdingsAffected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S12: Cross-Module Consistency ──────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Do EU Taxonomy, SFDR, and ISSB agree on the portfolio's ESG quality?">Cross-Module Consistency Check</SectionTitle>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          {consistencyData.map(cd => (
            <div key={cd.metric} style={{ flex: 1, minWidth: 180, background: T.surfaceH, borderRadius: 8, padding: '14px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{cd.metric}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{cd.count}</div>
              <div style={{ fontSize: 11, color: T.textMut }}>{cd.pct}% of holdings</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 14px', background: consistencyData.every(c => Math.abs(c.pct - consistencyData[0].pct) < 20) ? '#f0fdf4' : '#fef2f2', borderRadius: 8, border: `1px solid ${consistencyData.every(c => Math.abs(c.pct - consistencyData[0].pct) < 20) ? '#bbf7d0' : '#fecaca'}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>
            Consistency Status: {consistencyData.every(c => Math.abs(c.pct - consistencyData[0].pct) < 20) ? 'Aligned' : 'Divergent'}
          </div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
            {consistencyData.every(c => Math.abs(c.pct - consistencyData[0].pct) < 20)
              ? 'EU Taxonomy, SFDR, and ISSB assessments are broadly consistent in identifying the same holdings as sustainable.'
              : 'Frameworks disagree on which holdings are sustainable. Review methodology alignment across modules.'}
          </div>
        </div>
      </Card>

      {/* ── S13: Sortable Holdings Table ───────────────────────────────── */}
      <Card style={{ marginBottom: 20, overflowX: 'auto' }}>
        <SectionTitle sub="Company-level compliance across all framework dimensions">Holdings Compliance Table</SectionTitle>
        <input value={holdingSearch} onChange={e => setHoldingSearch(e.target.value)} placeholder="Search company..."
          style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontFamily: T.font, width: 260, marginBottom: 10 }} />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {[
                { key: 'company', label: 'Company' }, { key: 'sector', label: 'Sector' }, { key: 'country', label: 'Country' },
                { key: 'eu_tax_eligible', label: 'Tax Eligible' }, { key: 'eu_tax_aligned', label: 'Tax Aligned' },
                { key: 'sfdr_art', label: 'SFDR Art' }, { key: 'issb_ready', label: 'ISSB %' },
                { key: 'gri_mapped', label: 'GRI %' }, { key: 'data_complete', label: 'Data %' },
                { key: 'dnsh_pass', label: 'DNSH' }, { key: 'safeguards', label: 'Safeguards' },
              ].map(col => (
                <th key={col.key} style={{ padding: '7px 8px', textAlign: col.key === 'company' ? 'left' : 'center', borderBottom: `2px solid ${T.border}`, cursor: 'pointer', fontSize: 10 }} onClick={() => handleSort(col.key)}>
                  {col.label}{SortIcon({ col: col.key })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredHoldings.slice(0, 40).map((h, idx) => (
              <tr key={idx} style={{ background: idx % 2 ? T.surfaceH : T.surface }}>
                <td style={{ padding: '6px 8px', fontWeight: 600, borderBottom: `1px solid ${T.border}`, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{h.sector}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>{h.country}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, color: h.eu_tax_eligible ? T.green : T.red, fontWeight: 700 }}>{h.eu_tax_eligible ? 'Yes' : 'No'}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, color: h.eu_tax_aligned ? T.green : T.red, fontWeight: 700 }}>{h.eu_tax_aligned ? 'Yes' : 'No'}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                  <Badge color={h.sfdr_art === 'Art 9' ? '#059669' : h.sfdr_art === 'Art 8' ? '#7c3aed' : '#9ca3af'}>{h.sfdr_art}</Badge>
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, fontWeight: 600, color: h.issb_ready >= 75 ? T.green : h.issb_ready >= 50 ? T.amber : T.red }}>{h.issb_ready}%</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, fontWeight: 600, color: h.gri_mapped >= 70 ? T.green : h.gri_mapped >= 40 ? T.amber : T.red }}>{h.gri_mapped}%</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${h.data_complete}%`, height: '100%', background: h.data_complete >= 70 ? T.green : T.amber, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 9 }}>{h.data_complete}%</span>
                  </div>
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, color: h.dnsh_pass ? T.green : T.red, fontWeight: 700 }}>{h.dnsh_pass ? 'Pass' : 'Fail'}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, color: h.safeguards ? T.green : T.red, fontWeight: 700 }}>{h.safeguards ? 'Met' : 'Gap'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 11, color: T.textMut, marginTop: 8 }}>Showing {Math.min(filteredHoldings.length, 40)} of {filteredHoldings.length} holdings</div>
      </Card>

      {/* ── S14: Cross-Navigation ──────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Navigate to all Sprint Q modules and related platform features">Cross-Module Navigation</SectionTitle>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'EU Taxonomy', path: '/eu-taxonomy' },
            { label: 'SFDR Classification', path: '/sfdr-classification' },
            { label: 'ISSB / TCFD', path: '/issb-tcfd' },
            { label: 'GRI Alignment', path: '/gri-alignment' },
            { label: 'Framework Interop', path: '/framework-interop' },
            { label: 'Report Studio', path: '/report-studio' },
            { label: 'Regulatory Gap', path: '/regulatory-gap' },
            { label: 'Regulatory Calendar', path: '/regulatory-calendar' },
            { label: 'Portfolio Suite', path: '/portfolio-suite' },
            { label: 'CSRD DMA', path: '/csrd-dma' },
          ].map(nav => (
            <button key={nav.path} onClick={() => navigate(nav.path)} style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 18px',
              fontSize: 12, fontWeight: 600, color: T.navy, cursor: 'pointer', fontFamily: T.font, transition: 'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.surfaceH; e.currentTarget.style.borderColor = T.navy; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; }}
            >{nav.label} &rarr;</button>
          ))}
        </div>
      </Card>

      {/* ── S15: Module Completion Trend ──────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Sprint Q module completion progress over the past 8 weeks">Module Completion Trend</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={[
            { week: 'W1', eu_tax: 32, sfdr: 28, issb: 20, gri: 15, interop: 40 },
            { week: 'W2', eu_tax: 45, sfdr: 38, issb: 30, gri: 25, interop: 52 },
            { week: 'W3', eu_tax: 52, sfdr: 48, issb: 42, gri: 35, interop: 60 },
            { week: 'W4', eu_tax: 60, sfdr: 55, issb: 50, gri: 42, interop: 68 },
            { week: 'W5', eu_tax: 68, sfdr: 62, issb: 58, gri: 50, interop: 75 },
            { week: 'W6', eu_tax: 75, sfdr: 70, issb: 64, gri: 58, interop: 82 },
            { week: 'W7', eu_tax: 82, sfdr: 77, issb: 70, gri: 64, interop: 88 },
            { week: 'W8', eu_tax: 87, sfdr: 82, issb: 74, gri: 69, interop: 91 },
          ]} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="eu_tax" name="EU Taxonomy" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="sfdr" name="SFDR" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="issb" name="ISSB" stroke="#1b3a5c" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="gri" name="GRI" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="interop" name="Interop" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ── S16: SFDR Article Classification Detail ──────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Detailed SFDR Article 6/8/9 criteria assessment for the portfolio product">SFDR Classification Detail</SectionTitle>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sfdrBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {sfdrBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 2, minWidth: 300 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Article 8 Criteria Checklist</div>
            {[
              { criterion: 'Promotes E/S characteristics', met: true, ref: 'Art 8(1)' },
              { criterion: 'Good governance practices', met: true, ref: 'Art 8(1)' },
              { criterion: 'PAI consideration disclosed', met: true, ref: 'Art 7' },
              { criterion: 'Sustainable investment minimum', met: true, ref: 'Art 8(1)(a)' },
              { criterion: 'EU Taxonomy alignment disclosed', met: true, ref: 'Art 5/6' },
              { criterion: 'DNSH principle for sustainable investments', met: sustainableInv > 30, ref: 'Art 2(17)' },
              { criterion: 'Binding E/S characteristics in investment process', met: true, ref: 'RTS Annex II' },
              { criterion: 'Pre-contractual disclosure template', met: true, ref: 'RTS Annex II' },
              { criterion: 'Periodic disclosure template', met: false, ref: 'RTS Annex IV' },
              { criterion: 'Website disclosure maintained', met: true, ref: 'Art 10' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 14, color: c.met ? T.green : T.red }}>{c.met ? '\u2713' : '\u2717'}</span>
                <span style={{ fontSize: 12, flex: 1, color: T.text }}>{c.criterion}</span>
                <span style={{ fontSize: 10, color: T.textMut }}>{c.ref}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── S17: EU Taxonomy Objective Breakdown ─────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Portfolio alignment breakdown across the 6 EU Taxonomy environmental objectives">EU Taxonomy Objective Breakdown</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={[
            { obj: 'Climate Mitigation', alignment: 38, eligible: 65, color: '#1b3a5c' },
            { obj: 'Climate Adaptation', alignment: 12, eligible: 28, color: '#2563eb' },
            { obj: 'Water', alignment: 8, eligible: 22, color: '#0d9488' },
            { obj: 'Circular Economy', alignment: 15, eligible: 35, color: '#5a8a6a' },
            { obj: 'Pollution', alignment: 6, eligible: 18, color: '#d97706' },
            { obj: 'Biodiversity', alignment: 4, eligible: 14, color: '#16a34a' },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="obj" tick={{ fontSize: 10, fill: T.text }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '% of Revenue', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="eligible" name="Eligible %" fill={T.border} radius={[4, 4, 0, 0]} />
            <Bar dataKey="alignment" name="Aligned %" fill={T.sage} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── S18: Sector-Level Compliance Heatmap ─────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Framework compliance by sector across portfolio holdings">Sector-Level Compliance Heatmap</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Sector</th>
                {['EU Tax','SFDR','ISSB','GRI','TNFD','Data %'].map(h => (
                  <th key={h} style={{ padding: '8px 8px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Energy','Financials','Technology','Materials','Industrials','Healthcare','Consumer','Utilities','Real Estate','Telecom'].map((sec, idx) => {
                const s = seed(sec);
                const vals = [
                  Math.round(20 + sRand(s) * 70),
                  Math.round(30 + sRand(s + 1) * 60),
                  Math.round(25 + sRand(s + 2) * 65),
                  Math.round(20 + sRand(s + 3) * 60),
                  Math.round(10 + sRand(s + 4) * 50),
                  Math.round(40 + sRand(s + 5) * 55),
                ];
                return (
                  <tr key={sec} style={{ background: idx % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{sec}</td>
                    {vals.map((v, vi) => (
                      <td key={vi} style={{ padding: '8px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}`,
                        background: v >= 70 ? `${T.green}18` : v >= 40 ? `${T.amber}15` : `${T.red}12` }}>
                        <span style={{ fontWeight: 600, fontSize: 11, color: v >= 70 ? T.green : v >= 40 ? T.amber : T.red }}>{v}%</span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── S19: Data Completeness Waterfall ──────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Data completeness progression from raw collection to framework-ready">Data Completeness Pipeline</SectionTitle>
        <div style={{ display: 'flex', gap: 0, alignItems: 'flex-end', justifyContent: 'center', height: 200, padding: '0 20px' }}>
          {[
            { stage: 'Raw Data', pct: 92, color: '#9ca3af' },
            { stage: 'Validated', pct: 85, color: T.navyL },
            { stage: 'Normalized', pct: 78, color: T.navy },
            { stage: 'Gap-Filled', pct: 72, color: T.sage },
            { stage: 'Framework-Ready', pct: 68, color: T.green },
          ].map((st, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 6px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: st.color, marginBottom: 4 }}>{st.pct}%</div>
              <div style={{ height: st.pct * 1.5, background: st.color, borderRadius: '4px 4px 0 0', transition: 'height .3s', minWidth: 40 }} />
              <div style={{ fontSize: 10, color: T.textSec, marginTop: 6, fontWeight: 600 }}>{st.stage}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S20: Taxonomy Green Revenue by Sector ────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Taxonomy-aligned green revenue contribution by sector">Green Revenue by Sector</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={[
            { sector: 'Energy', green: 42, brown: 58 },
            { sector: 'Utilities', green: 55, brown: 45 },
            { sector: 'Real Estate', green: 38, brown: 62 },
            { sector: 'Transport', green: 22, brown: 78 },
            { sector: 'Manufacturing', green: 18, brown: 82 },
            { sector: 'Financials', green: 28, brown: 72 },
            { sector: 'Technology', green: 45, brown: 55 },
            { sector: 'Healthcare', green: 12, brown: 88 },
          ]} layout="vertical" margin={{ left: 90 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="sector" tick={{ fontSize: 11, fill: T.text }} width={85} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}%`]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="green" name="Green Revenue" stackId="a" fill={T.green} />
            <Bar dataKey="brown" name="Non-Green" stackId="a" fill="#e5e7eb" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── S21: ISSB Readiness by Disclosure Area ─────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="ISSB S1/S2 compliance readiness broken down by disclosure area">ISSB Readiness by Disclosure Area</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={[
            { area: 'Governance', readiness: 82, target: 100 },
            { area: 'Strategy', readiness: 68, target: 100 },
            { area: 'Risk Management', readiness: 75, target: 100 },
            { area: 'Metrics: Scope 1', readiness: 92, target: 100 },
            { area: 'Metrics: Scope 2', readiness: 88, target: 100 },
            { area: 'Metrics: Scope 3', readiness: 42, target: 100 },
            { area: 'Targets', readiness: 65, target: 100 },
            { area: 'Scenario Analysis', readiness: 48, target: 100 },
            { area: 'Transition Plan', readiness: 55, target: 100 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="area" tick={{ fontSize: 10, fill: T.text }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="readiness" name="Readiness %" radius={[4, 4, 0, 0]}>
              {[82, 68, 75, 92, 88, 42, 65, 48, 55].map((v, i) => <Cell key={i} fill={v >= 75 ? T.green : v >= 50 ? T.amber : T.red} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── S22: Implementation Timeline ──────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Phased approach for Sprint Q module completion and production readiness">Implementation Timeline</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { phase: 'Phase 1 - Foundation', date: 'Mar-Apr 2026', items: ['EU Taxonomy NACE mapping complete', 'SFDR PAI data collection', 'ISSB governance disclosures'], pct: 90, color: T.navy },
            { phase: 'Phase 2 - Assessment', date: 'May-Jun 2026', items: ['DNSH + Minimum Safeguards assessment', 'Article 8 criteria validation', 'GRI Standards alignment'], pct: 65, color: T.sage },
            { phase: 'Phase 3 - Integration', date: 'Jul-Aug 2026', items: ['Cross-framework consistency checks', 'Report-once-use-many engine', 'Automated compliance monitoring'], pct: 35, color: T.amber },
            { phase: 'Phase 4 - Reporting', date: 'Sep-Dec 2026', items: ['CSRD first annual report filing', 'SFDR periodic disclosure', 'ISSB annual report disclosures'], pct: 10, color: T.gold },
          ].map((ph, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px', background: `${ph.color}06`, border: `1px solid ${ph.color}20`, borderRadius: 10 }}>
              <div style={{ minWidth: 130 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ph.color }}>{ph.phase}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{ph.date}</div>
                <div style={{ marginTop: 6 }}>
                  <ProgressBar value={ph.pct} color={ph.color} />
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{ph.pct}% complete</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {ph.items.map((item, j) => (
                  <div key={j} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: ph.color, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S23: Summary Statistics ─────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle sub="Platform-wide taxonomy and classification intelligence summary">Summary Statistics</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { label: 'Total Holdings Assessed', value: holdingsData.length, icon: '\u{1F4CA}' },
            { label: 'Tax-Eligible Holdings', value: holdingsData.filter(h => h.eu_tax_eligible).length, color: '#059669' },
            { label: 'Tax-Aligned Holdings', value: holdingsData.filter(h => h.eu_tax_aligned).length, color: T.green },
            { label: 'SFDR Art 9 Holdings', value: holdingsData.filter(h => h.sfdr_art === 'Art 9').length, color: '#059669' },
            { label: 'SFDR Art 8 Holdings', value: holdingsData.filter(h => h.sfdr_art === 'Art 8').length, color: '#7c3aed' },
            { label: 'ISSB Ready (75%+)', value: holdingsData.filter(h => h.issb_ready >= 75).length, color: T.navy },
            { label: 'DNSH Passing', value: holdingsData.filter(h => h.dnsh_pass).length, color: T.sage },
            { label: 'Safeguards Met', value: holdingsData.filter(h => h.safeguards).length, color: T.green },
            { label: 'Data Gaps Identified', value: DATA_GAPS.length, color: T.red },
            { label: 'Actions Pending', value: ACTIONS.length, color: T.amber },
            { label: 'Deadlines (Next 6mo)', value: DEADLINES.filter(d => d.urgency === 'high' || d.urgency === 'medium').length, color: T.red },
            { label: 'Modules Active', value: MODULES.length, color: T.navy },
          ].map((s, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color || T.navy }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', fontSize: 11, color: T.textMut, padding: '16px 0' }}>
        EP-Q6 Taxonomy & Classification Intelligence Hub | Sprint Q - Taxonomy & Classification Engine | 5 Modules | 8 Frameworks | {holdingsData.length} Holdings
      </div>
    </div>
  );
}
