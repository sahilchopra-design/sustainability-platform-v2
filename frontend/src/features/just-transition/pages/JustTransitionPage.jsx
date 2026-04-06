import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line, ScatterChart, Scatter, ZAxis,
  PieChart, Pie,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899'];
const seed = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════
   JUST TRANSITION FRAMEWORK (ILO + EU JTM)
   ══════════════════════════════════════════════════════════════ */
const JT_DIMENSIONS = [
  { id: 'workers', name: 'Worker Protection', weight: 25, indicators: ['Retraining programs', 'Severance support', 'Early retirement options', 'Skill transfer pathways', 'Social safety nets'], color: T.navy },
  { id: 'communities', name: 'Community Resilience', weight: 25, indicators: ['Economic diversification', 'Infrastructure investment', 'Social services', 'Community engagement', 'Cultural preservation'], color: T.sage },
  { id: 'equity', name: 'Distributional Equity', weight: 20, indicators: ['Energy affordability', 'Access to clean energy', 'Progressive carbon pricing', 'Vulnerable group protection'], color: T.gold },
  { id: 'developing', name: 'Developing Nation Support', weight: 15, indicators: ['Climate finance flows', 'Technology transfer', 'Capacity building', 'Debt-for-nature swaps'], color: T.amber },
  { id: 'governance', name: 'Social Dialogue', weight: 15, indicators: ['Tripartite consultation', 'Union involvement', 'Stakeholder engagement', 'Transparent planning'], color: '#7c3aed' },
];

/* ══════════════════════════════════════════════════════════════
   COUNTRY JUST TRANSITION SCORES (20 countries)
   ══════════════════════════════════════════════════════════════ */
const COUNTRY_JT_SCORES = [
  { iso2:'DE', country:'Germany', workers:78, communities:72, equity:70, developing:65, governance:82, composite:74, coal_workers_affected:38000, transition_fund_bn:40, retraining_programs:true, social_dialogue:true, energy_poverty_pct:4.5, just_transition_plan:true, union_density_pct:16, green_jobs_created_k:450, avg_retraining_months:8, community_investment_bn:12 },
  { iso2:'US', country:'United States', workers:62, communities:58, equity:55, developing:45, governance:60, composite:57, coal_workers_affected:52000, transition_fund_bn:28, retraining_programs:true, social_dialogue:false, energy_poverty_pct:10.2, just_transition_plan:false, union_density_pct:10, green_jobs_created_k:800, avg_retraining_months:12, community_investment_bn:18 },
  { iso2:'CN', country:'China', workers:55, communities:60, equity:50, developing:40, governance:45, composite:51, coal_workers_affected:2500000, transition_fund_bn:15, retraining_programs:true, social_dialogue:false, energy_poverty_pct:3.8, just_transition_plan:true, union_density_pct:44, green_jobs_created_k:3200, avg_retraining_months:6, community_investment_bn:30 },
  { iso2:'JP', country:'Japan', workers:70, communities:68, equity:72, developing:60, governance:65, composite:68, coal_workers_affected:15000, transition_fund_bn:8, retraining_programs:true, social_dialogue:true, energy_poverty_pct:6.1, just_transition_plan:true, union_density_pct:17, green_jobs_created_k:280, avg_retraining_months:10, community_investment_bn:5 },
  { iso2:'IN', country:'India', workers:38, communities:35, equity:30, developing:55, governance:40, composite:38, coal_workers_affected:3800000, transition_fund_bn:5, retraining_programs:false, social_dialogue:false, energy_poverty_pct:24.5, just_transition_plan:false, union_density_pct:12, green_jobs_created_k:1500, avg_retraining_months:18, community_investment_bn:3 },
  { iso2:'GB', country:'United Kingdom', workers:75, communities:70, equity:68, developing:72, governance:78, composite:73, coal_workers_affected:2000, transition_fund_bn:5, retraining_programs:true, social_dialogue:true, energy_poverty_pct:13.4, just_transition_plan:true, union_density_pct:23, green_jobs_created_k:300, avg_retraining_months:9, community_investment_bn:4 },
  { iso2:'FR', country:'France', workers:72, communities:74, equity:75, developing:68, governance:70, composite:72, coal_workers_affected:1500, transition_fund_bn:6, retraining_programs:true, social_dialogue:true, energy_poverty_pct:11.9, just_transition_plan:true, union_density_pct:11, green_jobs_created_k:250, avg_retraining_months:10, community_investment_bn:5 },
  { iso2:'BR', country:'Brazil', workers:42, communities:45, equity:40, developing:50, governance:48, composite:44, coal_workers_affected:8000, transition_fund_bn:2, retraining_programs:false, social_dialogue:false, energy_poverty_pct:8.5, just_transition_plan:false, union_density_pct:18, green_jobs_created_k:400, avg_retraining_months:14, community_investment_bn:1 },
  { iso2:'KR', country:'South Korea', workers:65, communities:62, equity:58, developing:50, governance:55, composite:59, coal_workers_affected:22000, transition_fund_bn:7, retraining_programs:true, social_dialogue:true, energy_poverty_pct:7.2, just_transition_plan:true, union_density_pct:12, green_jobs_created_k:180, avg_retraining_months:11, community_investment_bn:4 },
  { iso2:'AU', country:'Australia', workers:60, communities:55, equity:52, developing:48, governance:58, composite:55, coal_workers_affected:38000, transition_fund_bn:3, retraining_programs:true, social_dialogue:false, energy_poverty_pct:6.8, just_transition_plan:false, union_density_pct:14, green_jobs_created_k:150, avg_retraining_months:10, community_investment_bn:2 },
  { iso2:'CA', country:'Canada', workers:68, communities:65, equity:62, developing:55, governance:72, composite:65, coal_workers_affected:12000, transition_fund_bn:4, retraining_programs:true, social_dialogue:true, energy_poverty_pct:5.5, just_transition_plan:true, union_density_pct:29, green_jobs_created_k:200, avg_retraining_months:9, community_investment_bn:3 },
  { iso2:'SA', country:'Saudi Arabia', workers:30, communities:35, equity:25, developing:20, governance:22, composite:27, coal_workers_affected:0, transition_fund_bn:1, retraining_programs:false, social_dialogue:false, energy_poverty_pct:0.5, just_transition_plan:false, union_density_pct:0, green_jobs_created_k:80, avg_retraining_months:24, community_investment_bn:2 },
  { iso2:'ZA', country:'South Africa', workers:35, communities:32, equity:28, developing:60, governance:42, composite:37, coal_workers_affected:92000, transition_fund_bn:8.5, retraining_programs:false, social_dialogue:true, energy_poverty_pct:38.5, just_transition_plan:true, union_density_pct:27, green_jobs_created_k:90, avg_retraining_months:20, community_investment_bn:2 },
  { iso2:'ID', country:'Indonesia', workers:32, communities:30, equity:28, developing:45, governance:35, composite:33, coal_workers_affected:250000, transition_fund_bn:2, retraining_programs:false, social_dialogue:false, energy_poverty_pct:15.2, just_transition_plan:false, union_density_pct:8, green_jobs_created_k:120, avg_retraining_months:18, community_investment_bn:1 },
  { iso2:'MX', country:'Mexico', workers:40, communities:38, equity:35, developing:42, governance:38, composite:39, coal_workers_affected:5000, transition_fund_bn:1, retraining_programs:false, social_dialogue:false, energy_poverty_pct:12.8, just_transition_plan:false, union_density_pct:13, green_jobs_created_k:100, avg_retraining_months:16, community_investment_bn:1 },
  { iso2:'NO', country:'Norway', workers:85, communities:88, equity:90, developing:78, governance:92, composite:87, coal_workers_affected:500, transition_fund_bn:2, retraining_programs:true, social_dialogue:true, energy_poverty_pct:1.2, just_transition_plan:true, union_density_pct:52, green_jobs_created_k:45, avg_retraining_months:5, community_investment_bn:1 },
  { iso2:'SE', country:'Sweden', workers:82, communities:85, equity:88, developing:75, governance:90, composite:85, coal_workers_affected:200, transition_fund_bn:1.5, retraining_programs:true, social_dialogue:true, energy_poverty_pct:2.1, just_transition_plan:true, union_density_pct:65, green_jobs_created_k:55, avg_retraining_months:4, community_investment_bn:1 },
  { iso2:'PL', country:'Poland', workers:45, communities:42, equity:38, developing:35, governance:48, composite:42, coal_workers_affected:78000, transition_fund_bn:17.5, retraining_programs:true, social_dialogue:true, energy_poverty_pct:16.8, just_transition_plan:true, union_density_pct:11, green_jobs_created_k:120, avg_retraining_months:14, community_investment_bn:6 },
  { iso2:'AE', country:'UAE', workers:35, communities:40, equity:30, developing:25, governance:28, composite:32, coal_workers_affected:0, transition_fund_bn:0.5, retraining_programs:false, social_dialogue:false, energy_poverty_pct:0.2, just_transition_plan:false, union_density_pct:0, green_jobs_created_k:40, avg_retraining_months:20, community_investment_bn:1 },
  { iso2:'CL', country:'Chile', workers:55, communities:52, equity:48, developing:58, governance:55, composite:53, coal_workers_affected:4500, transition_fund_bn:1, retraining_programs:true, social_dialogue:false, energy_poverty_pct:18.5, just_transition_plan:true, union_density_pct:20, green_jobs_created_k:65, avg_retraining_months:12, community_investment_bn:1 },
];

/* ══════════════════════════════════════════════════════════════
   TRANSITION FUND DATA
   ══════════════════════════════════════════════════════════════ */
const TRANSITION_FUNDS = [
  { name: 'EU Just Transition Fund', amount_bn: 17.5, region: 'Europe', focus: 'Coal regions, reskilling, SME support', year: 2021 },
  { name: 'US IRA Community Provisions', amount_bn: 60, region: 'United States', focus: 'Disadvantaged communities, clean energy manufacturing', year: 2022 },
  { name: 'SA JET Investment Plan', amount_bn: 8.5, region: 'South Africa', focus: 'Coal transition, renewable deployment', year: 2022 },
  { name: 'Germany Coal Exit Fund', amount_bn: 40, region: 'Germany', focus: 'Lignite regions, infrastructure, retraining', year: 2020 },
  { name: 'Indonesia JETP', amount_bn: 20, region: 'Indonesia', focus: 'Coal plant retirement, clean energy', year: 2023 },
  { name: 'Canada JT Pathways', amount_bn: 4, region: 'Canada', focus: 'Fossil fuel workers, Indigenous communities', year: 2022 },
  { name: 'Poland JT Territorial Plans', amount_bn: 3.5, region: 'Poland', focus: 'Silesia coal region, diversification', year: 2021 },
  { name: 'Vietnam JETP', amount_bn: 15.5, region: 'Vietnam', focus: 'Coal transition, renewable scale-up', year: 2023 },
  { name: 'India JT Task Force', amount_bn: 5, region: 'India', focus: 'Coal district development, solar deployment', year: 2024 },
  { name: 'GCF Developing Country Facility', amount_bn: 12, region: 'Global', focus: 'Adaptation, capacity building, technology transfer', year: 2023 },
];

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow .15s, transform .1s', ...style }} onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,58,92,.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>{children}</div>
);
const KpiCard = ({ label, value, sub, color }) => (
  <Card>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.font, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.font, marginTop: 2 }}>{sub}</div>}
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
const SortTh = ({ label, sortKey, sortCol, sortDir, onSort, style }) => (
  <th onClick={() => onSort(sortKey)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.navy, cursor: 'pointer', borderBottom: `2px solid ${T.border}`, fontFamily: T.font, userSelect: 'none', whiteSpace: 'nowrap', ...style }}>
    {label} {sortCol === sortKey ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25BD'}
  </th>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, background: T.surfaceH, borderRadius: 10, padding: 3, marginBottom: 20, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: active === t ? T.surface : 'transparent', color: active === t ? T.navy : T.textSec, fontWeight: active === t ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: T.font, boxShadow: active === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none', minWidth: 100 }}>{t}</button>
    ))}
  </div>
);
const tblS = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const tdS = { padding: '8px 12px', borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontFamily: T.font };

/* ══════════════════════════════════════════════════════════════
   DATA HELPERS
   ══════════════════════════════════════════════════════════════ */
const LS_KEY = 'ra_portfolio_v1';
const loadLS = (key) => { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } };

const TABS = ['Overview & KPIs', 'Country Deep-Dive', 'Funds & Finance', 'Portfolio & Social Dialogue'];

/* ══════════════════════════════════════════════════════════════
   EXPORT HELPERS
   ══════════════════════════════════════════════════════════════ */
const exportCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};
const exportJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};
const printPage = () => window.print();

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function JustTransitionPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [sortCol, setSortCol] = useState('composite');
  const [sortDir, setSortDir] = useState('desc');
  const [compareCountries, setCompareCountries] = useState(['DE', 'GB', 'ZA']);
  const [dimensionFilter, setDimensionFilter] = useState('all');
  const [energyPovertySlider, setEnergyPovertySlider] = useState(50);

  const portfolio = useMemo(() => loadLS(LS_KEY) || [], []);

  /* sorting */
  const handleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };
  const sorted = useMemo(() => {
    const arr = [...COUNTRY_JT_SCORES];
    arr.sort((a, b) => { const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0; return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1); });
    return arr;
  }, [sortCol, sortDir]);

  /* KPI calculations */
  const avgJTScore = Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.composite, 0) / COUNTRY_JT_SCORES.length);
  const countriesWithPlans = COUNTRY_JT_SCORES.filter(c => c.just_transition_plan).length;
  const totalTransitionFunds = Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.transition_fund_bn, 0) * 10) / 10;
  const totalWorkersAffected = COUNTRY_JT_SCORES.reduce((s, c) => s + c.coal_workers_affected, 0);
  const retrainingCoverage = Math.round(COUNTRY_JT_SCORES.filter(c => c.retraining_programs).length / COUNTRY_JT_SCORES.length * 100);
  const avgEnergyPoverty = Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.energy_poverty_pct, 0) / COUNTRY_JT_SCORES.length * 10) / 10;
  const avgSocialDialogue = Math.round(COUNTRY_JT_SCORES.reduce((s, c) => s + c.governance, 0) / COUNTRY_JT_SCORES.length);
  const devNationFinanceGap = Math.round(100 - (COUNTRY_JT_SCORES.filter(c => ['IN', 'ID', 'ZA', 'BR', 'MX'].includes(c.iso2)).reduce((s, c) => s + c.developing, 0) / 5));

  /* composite bar chart ranked */
  const jtRanked = useMemo(() =>
    [...COUNTRY_JT_SCORES].sort((a, b) => b.composite - a.composite).map(c => ({
      country: c.iso2, composite: c.composite, fill: c.composite >= 70 ? T.green : c.composite >= 50 ? T.gold : c.composite >= 35 ? T.amber : T.red,
    })),
  []);

  /* radar for selected country */
  const selCountry = COUNTRY_JT_SCORES.find(c => c.iso2 === selectedCountry) || COUNTRY_JT_SCORES[0];
  const radarData = useMemo(() =>
    JT_DIMENSIONS.map(d => ({ dimension: d.name, score: selCountry[d.id], weight: d.weight })),
  [selCountry]);

  /* workers vs retraining scatter */
  const scatterData = useMemo(() =>
    COUNTRY_JT_SCORES.map(c => ({
      country: c.iso2, workers_affected: Math.log10(Math.max(c.coal_workers_affected, 1)), fund: c.transition_fund_bn, retraining: c.retraining_programs ? 1 : 0, composite: c.composite,
    })),
  []);

  /* energy poverty risk - filtered by slider */
  const energyPovertyData = useMemo(() =>
    COUNTRY_JT_SCORES.filter(c => c.energy_poverty_pct >= (energyPovertySlider / 10)).sort((a, b) => b.energy_poverty_pct - a.energy_poverty_pct).map(c => ({
      country: c.iso2, poverty: c.energy_poverty_pct, fill: c.energy_poverty_pct >= 20 ? T.red : c.energy_poverty_pct >= 10 ? T.amber : T.gold,
    })),
  [energyPovertySlider]);

  /* transition fund chart */
  const fundChartData = useMemo(() =>
    TRANSITION_FUNDS.sort((a, b) => b.amount_bn - a.amount_bn).map(f => ({ name: f.name.length > 25 ? f.name.slice(0, 22) + '...' : f.name, amount: f.amount_bn, region: f.region })),
  []);

  /* social dialogue assessment */
  const socialDialogueData = useMemo(() =>
    COUNTRY_JT_SCORES.map(c => ({
      country: c.iso2, governance: c.governance, union_density: c.union_density_pct, social_dialogue: c.social_dialogue, tripartite: c.social_dialogue && c.union_density_pct > 10,
    })).sort((a, b) => b.governance - a.governance),
  []);

  /* portfolio JT mapping */
  const portfolioJTExposure = useMemo(() => {
    if (!portfolio.length) return [];
    const countryMap = {};
    COUNTRY_JT_SCORES.forEach(c => { countryMap[c.iso2] = c; countryMap[c.country] = c; });
    return portfolio.slice(0, 30).map((h, i) => {
      const co = GLOBAL_COMPANY_MASTER.find(g => g.isin === h.isin || g.company_name === h.company_name);
      const ctry = co ? (countryMap[co.country] || countryMap[co.exchange_country]) : null;
      const jtScore = ctry ? ctry.composite : Math.round(30 + seed(i + 77) * 50);
      return { name: h.company_name || (co && co.company_name) || `Holding ${i+1}`, weight: h.weight_pct || Math.round(seed(i + 33) * 5 * 10) / 10, jt_score: jtScore, country: ctry ? ctry.iso2 : 'N/A', energy_poverty: ctry ? ctry.energy_poverty_pct : Math.round(seed(i + 88) * 20 * 10) / 10 };
    });
  }, [portfolio]);

  /* dimension weight pie */
  const dimensionPie = JT_DIMENSIONS.map(d => ({ name: d.name, value: d.weight }));

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: 24, maxWidth: 1440, margin: '0 auto', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>Just Transition Analyzer</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge label="ILO" color={T.sage} /><Badge label="5 Dimensions" color={T.gold} /><Badge label="20 Countries" color={T.navy} /><Badge label="Social Dialogue" color={T.amber} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={() => exportCSV(sorted, 'just_transition_countries.csv')}>Export CSV</Btn>
          <Btn onClick={() => exportJSON({ dimensions: JT_DIMENSIONS, countries: sorted, funds: TRANSITION_FUNDS }, 'just_transition.json')} variant="outline">Export JSON</Btn>
          <Btn onClick={printPage} variant="outline">Print / PDF</Btn>
        </div>
      </div>

      {/* 8 KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Avg JT Score" value={`${avgJTScore}/100`} sub="20 countries" color={avgJTScore >= 55 ? T.sage : T.amber} />
        <KpiCard label="Countries with JT Plans" value={`${countriesWithPlans}/20`} sub="Formal plans adopted" />
        <KpiCard label="Total Transition Funds" value={`$${totalTransitionFunds}Bn`} sub="Announced commitments" color={T.gold} />
        <KpiCard label="Workers Affected" value={totalWorkersAffected >= 1000000 ? `${(totalWorkersAffected / 1000000).toFixed(1)}M` : `${(totalWorkersAffected / 1000).toFixed(0)}K`} sub="Coal sector globally" color={T.red} />
        <KpiCard label="Retraining Coverage" value={`${retrainingCoverage}%`} sub="Countries with programs" />
        <KpiCard label="Avg Energy Poverty" value={`${avgEnergyPoverty}%`} sub="Of population" color={avgEnergyPoverty > 10 ? T.red : T.amber} />
        <KpiCard label="Social Dialogue Avg" value={`${avgSocialDialogue}/100`} sub="Governance dimension" />
        <KpiCard label="Dev Nation Gap" value={`${devNationFinanceGap}%`} sub="Finance shortfall" color={T.red} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ─── TAB 1: Overview & KPIs ─── */}
      {tab === TABS[0] && (
        <>
          {/* JT Score by Country BarChart */}
          <Section title="Just Transition Score by Country" sub="Composite score \u2022 ILO 5-dimension framework">
            <Card>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={jtRanked} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: T.text }} width={35} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="composite" name="JT Score">
                    {jtRanked.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Dimension Framework */}
          <Section title="Just Transition Framework" sub="ILO Guidelines \u2022 5 Weighted Dimensions">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                {JT_DIMENSIONS.map(d => (
                  <Card key={d.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: d.color }}>{d.name}</div>
                      <Badge label={`${d.weight}%`} color={d.color} />
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {d.indicators.map(ind => <li key={ind} style={{ fontSize: 11, color: T.textSec, marginBottom: 2 }}>{ind}</li>)}
                    </ul>
                  </Card>
                ))}
              </div>
              <Card>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Dimension Weights</div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={dimensionPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${value}%`}>
                      {dimensionPie.map((_, i) => <Cell key={i} fill={JT_DIMENSIONS[i].color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </Section>

          {/* 5-Dimension Radar */}
          <Section title="Country JT Profile" sub="Select a country for radar analysis">
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              {COUNTRY_JT_SCORES.map(c => (
                <button key={c.iso2} onClick={() => setSelectedCountry(c.iso2)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${selectedCountry === c.iso2 ? T.navy : T.border}`, background: selectedCountry === c.iso2 ? `${T.navy}12` : T.surface, color: T.navy, fontSize: 11, cursor: 'pointer', fontWeight: selectedCountry === c.iso2 ? 700 : 400, fontFamily: T.font }}>
                  {c.iso2}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{selCountry.country} \u2014 JT Score: {selCountry.composite}/100</div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: T.textSec }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
                    <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{selCountry.country} Key Indicators</div>
                {[
                  { l: 'Workers Affected', v: selCountry.coal_workers_affected.toLocaleString(), c: selCountry.coal_workers_affected > 100000 ? T.red : T.text },
                  { l: 'Transition Fund', v: `$${selCountry.transition_fund_bn}Bn`, c: T.gold },
                  { l: 'Retraining Programs', v: selCountry.retraining_programs ? 'Yes' : 'No', c: selCountry.retraining_programs ? T.green : T.red },
                  { l: 'Social Dialogue', v: selCountry.social_dialogue ? 'Active' : 'Inactive', c: selCountry.social_dialogue ? T.green : T.red },
                  { l: 'Energy Poverty', v: `${selCountry.energy_poverty_pct}%`, c: selCountry.energy_poverty_pct > 15 ? T.red : T.text },
                  { l: 'JT Plan', v: selCountry.just_transition_plan ? 'Adopted' : 'None', c: selCountry.just_transition_plan ? T.green : T.amber },
                  { l: 'Union Density', v: `${selCountry.union_density_pct}%`, c: T.text },
                  { l: 'Green Jobs Created', v: `${selCountry.green_jobs_created_k}K`, c: T.sage },
                  { l: 'Avg Retraining', v: `${selCountry.avg_retraining_months} months`, c: T.text },
                  { l: 'Community Invest', v: `$${selCountry.community_investment_bn}Bn`, c: T.gold },
                ].map(row => (
                  <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                    <span style={{ color: T.textSec }}>{row.l}</span>
                    <span style={{ fontWeight: 600, color: row.c }}>{row.v}</span>
                  </div>
                ))}
              </Card>
            </div>
          </Section>
        </>
      )}

      {/* ─── TAB 2: Country Deep-Dive ─── */}
      {tab === TABS[1] && (
        <>
          {/* Workers Affected vs Retraining Investment Scatter */}
          <Section title="Workers Affected vs Transition Fund" sub="Log scale \u2022 bubble = composite JT score">
            <Card>
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" dataKey="workers_affected" name="Workers (log10)" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Workers Affected (log10)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis type="number" dataKey="fund" name="Fund $Bn" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Transition Fund $Bn', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <ZAxis type="number" dataKey="composite" range={[40, 300]} name="JT Score" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(val, name) => [typeof val === 'number' ? val.toFixed(1) : val, name]} />
                  <Scatter data={scatterData} fill={T.navy} fillOpacity={0.6}>
                    {scatterData.map((d, i) => <Cell key={i} fill={d.composite >= 60 ? T.green : d.composite >= 40 ? T.gold : T.red} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Energy Poverty Heatmap */}
          <Section title="Energy Poverty Risk" sub="Percentage of population in energy poverty">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>Min Threshold:</span>
              <input type="range" min={0} max={100} value={energyPovertySlider} onChange={e => setEnergyPovertySlider(+e.target.value)} style={{ flex: 1, maxWidth: 300 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{(energyPovertySlider / 10).toFixed(1)}%</span>
            </div>
            <Card>
              <ResponsiveContainer width="100%" height={Math.max(200, energyPovertyData.length * 28 + 40)}>
                <BarChart data={energyPovertyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: '% population', position: 'insideBottom', fontSize: 11 }} />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: T.text }} width={35} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="poverty" name="Energy Poverty %">
                    {energyPovertyData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Country Comparison */}
          <Section title="Country Comparison Mode" sub="Select 2-3 countries for side-by-side on all 5 dimensions">
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              {COUNTRY_JT_SCORES.map(c => (
                <button key={c.iso2} onClick={() => {
                  setCompareCountries(prev => prev.includes(c.iso2) ? prev.filter(x => x !== c.iso2) : prev.length < 3 ? [...prev, c.iso2] : prev);
                }} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${compareCountries.includes(c.iso2) ? T.navy : T.border}`, background: compareCountries.includes(c.iso2) ? `${T.navy}12` : T.surface, color: T.navy, fontSize: 11, cursor: 'pointer', fontWeight: compareCountries.includes(c.iso2) ? 700 : 400, fontFamily: T.font }}>
                  {c.iso2}
                </button>
              ))}
            </div>
            {compareCountries.length >= 2 && (
              <Card>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={JT_DIMENSIONS.map(d => {
                    const row = { dimension: d.name };
                    compareCountries.forEach(iso => {
                      const cc = COUNTRY_JT_SCORES.find(c => c.iso2 === iso);
                      row[iso] = cc ? cc[d.id] : 0;
                    });
                    return row;
                  })}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: T.textSec }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
                    {compareCountries.map((iso, i) => (
                      <Radar key={iso} name={iso} dataKey={iso} stroke={PIE_COLORS[i]} fill={PIE_COLORS[i]} fillOpacity={0.15} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ overflowX: 'auto', marginTop: 16 }}>
                  <table style={tblS}>
                    <thead>
                      <tr style={{ background: T.surfaceH }}>
                        <th style={{ ...tdS, fontWeight: 700 }}>Indicator</th>
                        {compareCountries.map(iso => {
                          const cc = COUNTRY_JT_SCORES.find(c => c.iso2 === iso);
                          return <th key={iso} style={{ ...tdS, fontWeight: 700, color: T.navy }}>{cc?.country || iso}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {['composite', 'workers', 'communities', 'equity', 'developing', 'governance', 'coal_workers_affected', 'transition_fund_bn', 'energy_poverty_pct', 'union_density_pct', 'green_jobs_created_k'].map(k => (
                        <tr key={k}>
                          <td style={tdS}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                          {compareCountries.map(iso => {
                            const cc = COUNTRY_JT_SCORES.find(c => c.iso2 === iso);
                            return <td key={iso} style={tdS}>{cc ? (typeof cc[k] === 'number' ? cc[k].toLocaleString() : String(cc[k])) : 'N/A'}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </Section>

          {/* Full Sortable Table */}
          <Section title="Country Just Transition Data" sub="All 20 countries \u2022 click column headers to sort">
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={tblS}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      <SortTh label="Country" sortKey="country" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Composite" sortKey="composite" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Workers" sortKey="workers" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Community" sortKey="communities" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Equity" sortKey="equity" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Dev Support" sortKey="developing" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Governance" sortKey="governance" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Workers Hit" sortKey="coal_workers_affected" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Fund $Bn" sortKey="transition_fund_bn" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Energy Pov %" sortKey="energy_poverty_pct" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="JT Plan" sortKey="just_transition_plan" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(c => (
                      <tr key={c.iso2} onClick={() => setSelectedCountry(c.iso2)} style={{ cursor: 'pointer', background: selectedCountry === c.iso2 ? `${T.navy}08` : 'transparent' }}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{c.country}</td>
                        <td style={{ ...tdS, fontWeight: 700, color: c.composite >= 70 ? T.green : c.composite >= 50 ? T.gold : c.composite >= 35 ? T.amber : T.red }}>{c.composite}</td>
                        <td style={tdS}>{c.workers}</td>
                        <td style={tdS}>{c.communities}</td>
                        <td style={tdS}>{c.equity}</td>
                        <td style={tdS}>{c.developing}</td>
                        <td style={tdS}>{c.governance}</td>
                        <td style={{ ...tdS, color: c.coal_workers_affected > 100000 ? T.red : T.text }}>{c.coal_workers_affected.toLocaleString()}</td>
                        <td style={tdS}>{c.transition_fund_bn}</td>
                        <td style={{ ...tdS, color: c.energy_poverty_pct > 15 ? T.red : T.text }}>{c.energy_poverty_pct}</td>
                        <td style={tdS}>{c.just_transition_plan ? '\u2705' : '\u274c'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>
        </>
      )}

      {/* ─── TAB 3: Funds & Finance ─── */}
      {tab === TABS[2] && (
        <>
          {/* Transition Fund Comparison */}
          <Section title="Transition Fund Comparison" sub="Major global just transition financing mechanisms">
            <Card>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={fundChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: '$Bn', position: 'insideBottom', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.text }} width={160} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="amount" name="Amount $Bn">
                    {fundChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Detailed Fund Table */}
          <Section title="Transition Fund Details" sub="Fund commitments, regions, and focus areas">
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={tblS}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      <th style={{ ...tdS, fontWeight: 700 }}>Fund Name</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Amount ($Bn)</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Region</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Focus Areas</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TRANSITION_FUNDS.map(f => (
                      <tr key={f.name}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{f.name}</td>
                        <td style={{ ...tdS, fontWeight: 700, color: T.gold }}>${f.amount_bn}Bn</td>
                        <td style={tdS}>{f.region}</td>
                        <td style={{ ...tdS, fontSize: 11 }}>{f.focus}</td>
                        <td style={tdS}>{f.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>

          {/* Developing Nation Finance Gap */}
          <Section title="Developing Nation Support Gap" sub="Finance shortfall for key developing economies">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              {COUNTRY_JT_SCORES.filter(c => ['IN', 'ID', 'ZA', 'BR', 'MX', 'CL'].includes(c.iso2)).map(c => (
                <Card key={c.iso2}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{c.country}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: T.textSec }}>JT Score</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.composite >= 50 ? T.green : T.red }}>{c.composite}/100</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: T.textSec }}>Dev Support</span>
                    <span style={{ fontWeight: 600, color: c.developing >= 50 ? T.sage : T.amber }}>{c.developing}/100</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: T.textSec }}>Fund</span>
                    <span style={{ fontWeight: 600, color: T.gold }}>${c.transition_fund_bn}Bn</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: T.textSec }}>Energy Poverty</span>
                    <Badge label={`${c.energy_poverty_pct}%`} color={c.energy_poverty_pct > 15 ? T.red : T.amber} />
                  </div>
                  {/* progress bar */}
                  <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: T.surfaceH, overflow: 'hidden' }}>
                    <div style={{ width: `${c.developing}%`, height: '100%', borderRadius: 3, background: c.developing >= 50 ? T.green : T.amber }} />
                  </div>
                </Card>
              ))}
            </div>
          </Section>

          {/* Country Retraining Comparison */}
          <Section title="Retraining Investment vs Workers Affected" sub="Per-country analysis">
            <Card>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={COUNTRY_JT_SCORES.filter(c => c.coal_workers_affected > 0).sort((a, b) => b.coal_workers_affected - a.coal_workers_affected).slice(0, 12).map(c => ({
                  country: c.iso2,
                  'Workers (K)': Math.round(c.coal_workers_affected / 1000),
                  'Fund $Bn': c.transition_fund_bn,
                  'Green Jobs (K)': c.green_jobs_created_k,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Workers (K)" fill={T.red} />
                  <Bar dataKey="Green Jobs (K)" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>
        </>
      )}

      {/* ─── TAB 4: Portfolio & Social Dialogue ─── */}
      {tab === TABS[3] && (
        <>
          {/* Social Dialogue Assessment */}
          <Section title="Social Dialogue Assessment" sub="Tripartite consultation \u2022 union involvement \u2022 governance scores">
            <Card>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={socialDialogueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="governance" name="Governance Score" fill={T.navy} />
                  <Bar dataKey="union_density" name="Union Density %" fill={T.sage} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ marginTop: 14 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={tblS}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      <th style={{ ...tdS, fontWeight: 700 }}>Country</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Governance Score</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Union Density</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Social Dialogue</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Tripartite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socialDialogueData.map(c => (
                      <tr key={c.country}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{c.country}</td>
                        <td style={{ ...tdS, fontWeight: 600, color: c.governance >= 70 ? T.green : c.governance >= 50 ? T.gold : T.red }}>{c.governance}</td>
                        <td style={tdS}>{c.union_density}%</td>
                        <td style={tdS}>{c.social_dialogue ? <Badge label="Active" color={T.green} /> : <Badge label="Inactive" color={T.red} />}</td>
                        <td style={tdS}>{c.tripartite ? '\u2705' : '\u274c'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>

          {/* Portfolio JT Exposure */}
          <Section title="Portfolio JT Exposure" sub="Holdings mapped to country just transition scores">
            {portfolioJTExposure.length === 0 ? (
              <Card><div style={{ textAlign: 'center', color: T.textMut, padding: 32 }}>No portfolio loaded. Save holdings to localStorage key <code>ra_portfolio_v1</code> to see mapping.</div></Card>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 14 }}>
                  <KpiCard label="Wtd Avg JT Score" value={`${Math.round(portfolioJTExposure.reduce((s, h) => s + h.jt_score * (h.weight || 1), 0) / Math.max(portfolioJTExposure.reduce((s, h) => s + (h.weight || 1), 0), 1))}/100`} sub="Portfolio composite" />
                  <KpiCard label="High Risk" value={portfolioJTExposure.filter(h => h.jt_score < 40).length} sub="JT Score < 40" color={T.red} />
                  <KpiCard label="Leaders" value={portfolioJTExposure.filter(h => h.jt_score >= 70).length} sub="JT Score >= 70" color={T.green} />
                  <KpiCard label="Avg Energy Poverty" value={`${(portfolioJTExposure.reduce((s, h) => s + h.energy_poverty, 0) / portfolioJTExposure.length).toFixed(1)}%`} sub="Wtd by holdings" />
                </div>
                <Card>
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart data={portfolioJTExposure.slice(0, 20)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'JT Score', position: 'insideBottom', fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.text }} width={120} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="jt_score" name="JT Score">
                        {portfolioJTExposure.slice(0, 20).map((d, i) => <Cell key={i} fill={d.jt_score >= 60 ? T.green : d.jt_score >= 40 ? T.gold : T.red} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card style={{ marginTop: 14 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tblS}>
                      <thead>
                        <tr style={{ background: T.surfaceH }}>
                          <th style={{ ...tdS, fontWeight: 700 }}>Holding</th>
                          <th style={{ ...tdS, fontWeight: 700 }}>Weight %</th>
                          <th style={{ ...tdS, fontWeight: 700 }}>Country</th>
                          <th style={{ ...tdS, fontWeight: 700 }}>JT Score</th>
                          <th style={{ ...tdS, fontWeight: 700 }}>Energy Poverty</th>
                          <th style={{ ...tdS, fontWeight: 700 }}>Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioJTExposure.map((h, i) => (
                          <tr key={i}>
                            <td style={{ ...tdS, fontWeight: 600 }}>{h.name}</td>
                            <td style={tdS}>{h.weight}%</td>
                            <td style={tdS}>{h.country}</td>
                            <td style={{ ...tdS, fontWeight: 700, color: h.jt_score >= 60 ? T.green : h.jt_score >= 40 ? T.amber : T.red }}>{h.jt_score}</td>
                            <td style={tdS}>{h.energy_poverty}%</td>
                            <td style={tdS}><Badge label={h.jt_score >= 60 ? 'Low' : h.jt_score >= 40 ? 'Medium' : 'High'} color={h.jt_score >= 60 ? T.green : h.jt_score >= 40 ? T.amber : T.red} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </Section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         CROSS-NAVIGATION
         ══════════════════════════════════════════════════════════════ */}
      <Section title="Cross-Navigation" sub="Related analytics modules">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Living Wage Analysis', path: '/living-wage' },
            { label: 'Human Rights DD', path: '/human-rights-dd' },
            { label: 'Climate Policy Tracker', path: '/climate-policy' },
            { label: 'Sovereign ESG & SWF', path: '/sovereign-swf' },
            { label: 'Social Impact & SDG', path: '/social-impact' },
            { label: 'Macro Transition', path: '/macro-transition' },
            { label: 'Board Diversity', path: '/board-diversity' },
            { label: 'Employee Wellbeing', path: '/employee-wellbeing' },
          ].map(n => (
            <Btn key={n.path} variant="outline" onClick={() => navigate(n.path)} style={{ fontSize: 12 }}>{n.label}</Btn>
          ))}
        </div>
      </Section>
    </div>
  );
}
