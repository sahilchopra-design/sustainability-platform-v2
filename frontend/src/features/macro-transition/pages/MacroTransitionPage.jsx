import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899'];
const seed = (s) => { let x = Math.sin(s * 2.7183 + 1) * 10000; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════
   IEA SCENARIOS
   ══════════════════════════════════════════════════════════════ */
const IEA_SCENARIOS = [
  { id: 'nze', name: 'Net Zero Emissions by 2050', color: T.green, description: 'Aligned with 1.5\u00b0C. Requires: no new fossil fuel projects, 90% clean electricity by 2035, phase out of unabated coal by 2030 in advanced economies.', global_temp: '1.5\u00b0C', coal_phaseout: 2040, oil_demand_2030_vs_2022: -25, gas_demand_2030_vs_2022: -15, renewables_2030_pct: 65, ev_share_2030_pct: 60, investment_clean_tn: 4.5 },
  { id: 'aps', name: 'Announced Pledges Scenario', color: T.amber, description: 'All government pledges met in full and on time. Significant gap between pledges and implementation.', global_temp: '1.7\u00b0C', coal_phaseout: 2050, oil_demand_2030_vs_2022: -10, gas_demand_2030_vs_2022: -5, renewables_2030_pct: 50, ev_share_2030_pct: 40, investment_clean_tn: 3.0 },
  { id: 'steps', name: 'Stated Policies Scenario', color: T.red, description: 'Based on current policies only. No additional pledges honored.', global_temp: '2.5\u00b0C', coal_phaseout: 2060, oil_demand_2030_vs_2022: +5, gas_demand_2030_vs_2022: +10, renewables_2030_pct: 35, ev_share_2030_pct: 20, investment_clean_tn: 1.8 },
];

/* ══════════════════════════════════════════════════════════════
   COUNTRY TRANSITION READINESS (20 countries)
   ══════════════════════════════════════════════════════════════ */
const COUNTRY_TRANSITION = [
  { iso2:'DE', country:'Germany', coal_pct_generation:28, renewable_pct:52, nuclear_pct:0, fossil_pct:48, ev_sales_pct:31, clean_energy_investment_bn:36, fossil_subsidy_bn:12, grid_readiness:78, hydrogen_strategy:true, ccus_capacity_mt:0.5, critical_minerals_dependency:'Medium', energy_import_dependency_pct:64, transition_jobs_created_k:450, transition_jobs_lost_k:120 },
  { iso2:'US', country:'United States', coal_pct_generation:20, renewable_pct:22, nuclear_pct:19, fossil_pct:59, ev_sales_pct:9, clean_energy_investment_bn:105, fossil_subsidy_bn:65, grid_readiness:68, hydrogen_strategy:true, ccus_capacity_mt:12, critical_minerals_dependency:'High', energy_import_dependency_pct:15, transition_jobs_created_k:800, transition_jobs_lost_k:350 },
  { iso2:'CN', country:'China', coal_pct_generation:61, renewable_pct:30, nuclear_pct:5, fossil_pct:65, ev_sales_pct:35, clean_energy_investment_bn:280, fossil_subsidy_bn:55, grid_readiness:65, hydrogen_strategy:true, ccus_capacity_mt:3, critical_minerals_dependency:'Low', energy_import_dependency_pct:20, transition_jobs_created_k:3200, transition_jobs_lost_k:1100 },
  { iso2:'JP', country:'Japan', coal_pct_generation:32, renewable_pct:22, nuclear_pct:7, fossil_pct:71, ev_sales_pct:3, clean_energy_investment_bn:32, fossil_subsidy_bn:25, grid_readiness:72, hydrogen_strategy:true, ccus_capacity_mt:1.5, critical_minerals_dependency:'High', energy_import_dependency_pct:88, transition_jobs_created_k:280, transition_jobs_lost_k:90 },
  { iso2:'IN', country:'India', coal_pct_generation:72, renewable_pct:18, nuclear_pct:3, fossil_pct:79, ev_sales_pct:6, clean_energy_investment_bn:28, fossil_subsidy_bn:34, grid_readiness:45, hydrogen_strategy:true, ccus_capacity_mt:0.2, critical_minerals_dependency:'High', energy_import_dependency_pct:40, transition_jobs_created_k:1500, transition_jobs_lost_k:600 },
  { iso2:'GB', country:'United Kingdom', coal_pct_generation:2, renewable_pct:48, nuclear_pct:15, fossil_pct:37, ev_sales_pct:23, clean_energy_investment_bn:22, fossil_subsidy_bn:5, grid_readiness:82, hydrogen_strategy:true, ccus_capacity_mt:2, critical_minerals_dependency:'High', energy_import_dependency_pct:36, transition_jobs_created_k:300, transition_jobs_lost_k:50 },
  { iso2:'FR', country:'France', coal_pct_generation:1, renewable_pct:27, nuclear_pct:65, fossil_pct:8, ev_sales_pct:24, clean_energy_investment_bn:18, fossil_subsidy_bn:8, grid_readiness:85, hydrogen_strategy:true, ccus_capacity_mt:0.3, critical_minerals_dependency:'Medium', energy_import_dependency_pct:47, transition_jobs_created_k:250, transition_jobs_lost_k:60 },
  { iso2:'BR', country:'Brazil', coal_pct_generation:3, renewable_pct:84, nuclear_pct:2, fossil_pct:14, ev_sales_pct:4, clean_energy_investment_bn:15, fossil_subsidy_bn:18, grid_readiness:62, hydrogen_strategy:true, ccus_capacity_mt:0.1, critical_minerals_dependency:'Low', energy_import_dependency_pct:12, transition_jobs_created_k:400, transition_jobs_lost_k:80 },
  { iso2:'KR', country:'South Korea', coal_pct_generation:35, renewable_pct:9, nuclear_pct:28, fossil_pct:63, ev_sales_pct:15, clean_energy_investment_bn:14, fossil_subsidy_bn:10, grid_readiness:70, hydrogen_strategy:true, ccus_capacity_mt:1, critical_minerals_dependency:'High', energy_import_dependency_pct:92, transition_jobs_created_k:180, transition_jobs_lost_k:75 },
  { iso2:'AU', country:'Australia', coal_pct_generation:50, renewable_pct:32, nuclear_pct:0, fossil_pct:68, ev_sales_pct:8, clean_energy_investment_bn:12, fossil_subsidy_bn:9, grid_readiness:60, hydrogen_strategy:true, ccus_capacity_mt:0.4, critical_minerals_dependency:'Low', energy_import_dependency_pct:-120, transition_jobs_created_k:150, transition_jobs_lost_k:65 },
  { iso2:'CA', country:'Canada', coal_pct_generation:6, renewable_pct:68, nuclear_pct:14, fossil_pct:18, ev_sales_pct:12, clean_energy_investment_bn:11, fossil_subsidy_bn:14, grid_readiness:75, hydrogen_strategy:true, ccus_capacity_mt:4, critical_minerals_dependency:'Low', energy_import_dependency_pct:-80, transition_jobs_created_k:200, transition_jobs_lost_k:90 },
  { iso2:'SA', country:'Saudi Arabia', coal_pct_generation:0, renewable_pct:1, nuclear_pct:0, fossil_pct:99, ev_sales_pct:1, clean_energy_investment_bn:5, fossil_subsidy_bn:42, grid_readiness:30, hydrogen_strategy:true, ccus_capacity_mt:0.8, critical_minerals_dependency:'Low', energy_import_dependency_pct:-250, transition_jobs_created_k:80, transition_jobs_lost_k:45 },
  { iso2:'ZA', country:'South Africa', coal_pct_generation:82, renewable_pct:7, nuclear_pct:5, fossil_pct:88, ev_sales_pct:1, clean_energy_investment_bn:3, fossil_subsidy_bn:6, grid_readiness:32, hydrogen_strategy:false, ccus_capacity_mt:0, critical_minerals_dependency:'Medium', energy_import_dependency_pct:15, transition_jobs_created_k:90, transition_jobs_lost_k:85 },
  { iso2:'ID', country:'Indonesia', coal_pct_generation:62, renewable_pct:12, nuclear_pct:0, fossil_pct:88, ev_sales_pct:2, clean_energy_investment_bn:4, fossil_subsidy_bn:22, grid_readiness:35, hydrogen_strategy:false, ccus_capacity_mt:0, critical_minerals_dependency:'Low', energy_import_dependency_pct:-30, transition_jobs_created_k:120, transition_jobs_lost_k:100 },
  { iso2:'MX', country:'Mexico', coal_pct_generation:5, renewable_pct:22, nuclear_pct:3, fossil_pct:75, ev_sales_pct:2, clean_energy_investment_bn:6, fossil_subsidy_bn:15, grid_readiness:42, hydrogen_strategy:false, ccus_capacity_mt:0, critical_minerals_dependency:'Medium', energy_import_dependency_pct:10, transition_jobs_created_k:100, transition_jobs_lost_k:55 },
  { iso2:'NO', country:'Norway', coal_pct_generation:0, renewable_pct:98, nuclear_pct:0, fossil_pct:2, ev_sales_pct:82, clean_energy_investment_bn:3, fossil_subsidy_bn:2, grid_readiness:92, hydrogen_strategy:true, ccus_capacity_mt:1.5, critical_minerals_dependency:'Medium', energy_import_dependency_pct:-500, transition_jobs_created_k:45, transition_jobs_lost_k:30 },
  { iso2:'SE', country:'Sweden', coal_pct_generation:0, renewable_pct:75, nuclear_pct:20, fossil_pct:5, ev_sales_pct:54, clean_energy_investment_bn:5, fossil_subsidy_bn:1, grid_readiness:90, hydrogen_strategy:true, ccus_capacity_mt:0.3, critical_minerals_dependency:'Medium', energy_import_dependency_pct:25, transition_jobs_created_k:55, transition_jobs_lost_k:10 },
  { iso2:'PL', country:'Poland', coal_pct_generation:72, renewable_pct:20, nuclear_pct:0, fossil_pct:80, ev_sales_pct:5, clean_energy_investment_bn:6, fossil_subsidy_bn:8, grid_readiness:38, hydrogen_strategy:true, ccus_capacity_mt:0, critical_minerals_dependency:'High', energy_import_dependency_pct:44, transition_jobs_created_k:120, transition_jobs_lost_k:110 },
  { iso2:'AE', country:'UAE', coal_pct_generation:0, renewable_pct:4, nuclear_pct:12, fossil_pct:84, ev_sales_pct:3, clean_energy_investment_bn:8, fossil_subsidy_bn:18, grid_readiness:50, hydrogen_strategy:true, ccus_capacity_mt:0.6, critical_minerals_dependency:'Low', energy_import_dependency_pct:-200, transition_jobs_created_k:40, transition_jobs_lost_k:20 },
  { iso2:'CL', country:'Chile', coal_pct_generation:18, renewable_pct:42, nuclear_pct:0, fossil_pct:58, ev_sales_pct:3, clean_energy_investment_bn:4, fossil_subsidy_bn:2, grid_readiness:55, hydrogen_strategy:true, ccus_capacity_mt:0, critical_minerals_dependency:'Low', energy_import_dependency_pct:60, transition_jobs_created_k:65, transition_jobs_lost_k:25 },
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

const computeTransitionReadiness = (c) => {
  const renScore = Math.min(c.renewable_pct, 100) * 0.30;
  const evScore = Math.min(c.ev_sales_pct, 100) * 0.15;
  const gridScore = c.grid_readiness * 0.20;
  const investScore = Math.min((c.clean_energy_investment_bn / (c.clean_energy_investment_bn + c.fossil_subsidy_bn)) * 100, 100) * 0.20;
  const h2Score = c.hydrogen_strategy ? 15 : 0;
  return Math.round(renScore + evScore + gridScore + investScore + h2Score);
};

const generateEnergyMix = (scenario, year) => {
  const sc = IEA_SCENARIOS.find(s => s.id === scenario);
  const t = (year - 2020) / 30;
  if (sc.id === 'nze') {
    return { coal: Math.max(27 - t * 27, 0), oil: Math.max(30 - t * 25, 5), gas: Math.max(23 - t * 18, 5), nuclear: 10 + t * 2, renewables: 10 + t * 80 };
  } else if (sc.id === 'aps') {
    return { coal: Math.max(27 - t * 20, 7), oil: Math.max(30 - t * 15, 15), gas: Math.max(23 - t * 8, 15), nuclear: 10 + t * 3, renewables: 10 + t * 50 };
  }
  return { coal: Math.max(27 - t * 10, 17), oil: Math.max(30 - t * 5, 25), gas: 23 + t * 5, nuclear: 10 + t * 1, renewables: 10 + t * 25 };
};

const generateEVCurve = (scenario) => {
  return Array.from({ length: 21 }, (_, i) => {
    const yr = 2020 + i;
    const t = i / 20;
    let pct;
    if (scenario === 'nze') pct = 2 + 93 * (1 / (1 + Math.exp(-8 * (t - 0.4))));
    else if (scenario === 'aps') pct = 2 + 65 * (1 / (1 + Math.exp(-7 * (t - 0.45))));
    else pct = 2 + 40 * (1 / (1 + Math.exp(-6 * (t - 0.5))));
    return { year: yr, ev_share: Math.round(pct * 10) / 10 };
  });
};

const CRITICAL_MINERALS = [
  { mineral: 'Lithium', use: 'EV batteries, storage', top_producers: 'Australia, Chile, China', supply_risk: 'High', demand_growth_2030_pct: 340, recycling_rate_pct: 5 },
  { mineral: 'Cobalt', use: 'EV batteries, electronics', top_producers: 'DRC, Indonesia, Russia', supply_risk: 'Critical', demand_growth_2030_pct: 210, recycling_rate_pct: 12 },
  { mineral: 'Nickel', use: 'Batteries, stainless steel', top_producers: 'Indonesia, Philippines, Russia', supply_risk: 'High', demand_growth_2030_pct: 140, recycling_rate_pct: 30 },
  { mineral: 'Rare Earths', use: 'Wind turbines, EV motors', top_producers: 'China, Myanmar, Australia', supply_risk: 'Critical', demand_growth_2030_pct: 180, recycling_rate_pct: 1 },
  { mineral: 'Copper', use: 'Grid, EVs, renewables', top_producers: 'Chile, Peru, DRC', supply_risk: 'Medium', demand_growth_2030_pct: 60, recycling_rate_pct: 45 },
  { mineral: 'Silicon', use: 'Solar PV, semiconductors', top_producers: 'China, Russia, Norway', supply_risk: 'Medium', demand_growth_2030_pct: 90, recycling_rate_pct: 10 },
  { mineral: 'Platinum', use: 'Hydrogen fuel cells', top_producers: 'South Africa, Russia, Zimbabwe', supply_risk: 'High', demand_growth_2030_pct: 120, recycling_rate_pct: 25 },
  { mineral: 'Manganese', use: 'Batteries, steel', top_producers: 'South Africa, Gabon, Australia', supply_risk: 'Medium', demand_growth_2030_pct: 85, recycling_rate_pct: 20 },
];

const TABS = ['Pathways & Mix', 'Country Analysis', 'Technology & Minerals', 'Portfolio Exposure'];

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
export default function MacroTransitionPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [selectedScenario, setSelectedScenario] = useState('nze');
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [sortCol, setSortCol] = useState('transition_readiness');
  const [sortDir, setSortDir] = useState('desc');
  const [yearSlider, setYearSlider] = useState(2030);
  const [compareCountries, setCompareCountries] = useState(['DE', 'US', 'CN']);

  const portfolio = useMemo(() => loadLS(LS_KEY) || [], []);
  const sc = IEA_SCENARIOS.find(s => s.id === selectedScenario);

  /* transition readiness scores */
  const countriesWithScores = useMemo(() =>
    COUNTRY_TRANSITION.map(c => ({ ...c, transition_readiness: computeTransitionReadiness(c) })),
  []);

  /* sorting */
  const handleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };
  const sorted = useMemo(() => {
    const arr = [...countriesWithScores];
    arr.sort((a, b) => { const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0; return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1); });
    return arr;
  }, [countriesWithScores, sortCol, sortDir]);

  /* KPI calculations */
  const avgReadiness = useMemo(() => Math.round(countriesWithScores.reduce((s, c) => s + c.transition_readiness, 0) / countriesWithScores.length), [countriesWithScores]);
  const hydrogenEcons = countriesWithScores.filter(c => c.hydrogen_strategy).length;
  const highMineralRisk = countriesWithScores.filter(c => c.critical_minerals_dependency === 'High').length;
  const totalFossilPct = useMemo(() => Math.round(countriesWithScores.reduce((s, c) => s + c.fossil_pct, 0) / countriesWithScores.length), [countriesWithScores]);

  /* energy mix over time */
  const energyMixData = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const yr = 2020 + i * 5;
      const m = generateEnergyMix(selectedScenario, yr);
      return { year: yr, Coal: Math.round(m.coal), Oil: Math.round(m.oil), Gas: Math.round(m.gas), Nuclear: Math.round(m.nuclear), Renewables: Math.round(m.renewables) };
    }),
  [selectedScenario]);

  /* EV adoption */
  const evData = useMemo(() => generateEVCurve(selectedScenario), [selectedScenario]);

  /* country energy stacked bar */
  const countryEnergyData = useMemo(() =>
    countriesWithScores.slice().sort((a, b) => b.renewable_pct - a.renewable_pct).map(c => ({
      country: c.iso2, Coal: c.coal_pct_generation, Renewable: c.renewable_pct, Nuclear: c.nuclear_pct, OtherFossil: Math.max(0, 100 - c.coal_pct_generation - c.renewable_pct - c.nuclear_pct),
    })),
  [countriesWithScores]);

  /* transition readiness ranked */
  const readinessRanked = useMemo(() =>
    [...countriesWithScores].sort((a, b) => b.transition_readiness - a.transition_readiness).map(c => ({
      country: c.iso2, readiness: c.transition_readiness, fill: c.transition_readiness >= 70 ? T.green : c.transition_readiness >= 50 ? T.gold : c.transition_readiness >= 30 ? T.amber : T.red,
    })),
  [countriesWithScores]);

  /* investment vs subsidies */
  const investVsSubsidy = useMemo(() =>
    countriesWithScores.map(c => ({ country: c.iso2, 'Clean Investment': c.clean_energy_investment_bn, 'Fossil Subsidies': c.fossil_subsidy_bn })),
  [countriesWithScores]);

  /* jobs impact */
  const jobsData = useMemo(() =>
    countriesWithScores.map(c => ({ country: c.iso2, Created: c.transition_jobs_created_k, Lost: -c.transition_jobs_lost_k })),
  [countriesWithScores]);

  /* hydrogen data */
  const hydrogenData = useMemo(() =>
    countriesWithScores.filter(c => c.hydrogen_strategy).map(c => ({ country: c.iso2, ccus_mt: c.ccus_capacity_mt, grid: c.grid_readiness, invest: c.clean_energy_investment_bn })),
  [countriesWithScores]);

  /* portfolio mapping */
  const portfolioExposure = useMemo(() => {
    if (!portfolio.length) return [];
    const countryMap = {};
    COUNTRY_TRANSITION.forEach(c => { countryMap[c.iso2] = c; countryMap[c.country] = c; });
    return portfolio.slice(0, 30).map((h, i) => {
      const co = GLOBAL_COMPANY_MASTER.find(g => g.isin === h.isin || g.company_name === h.company_name);
      const ctry = co ? (countryMap[co.country] || countryMap[co.exchange_country]) : null;
      const readiness = ctry ? computeTransitionReadiness(ctry) : Math.round(30 + seed(i + 99) * 50);
      return { name: h.company_name || (co && co.company_name) || `Holding ${i+1}`, weight: h.weight_pct || Math.round(seed(i + 50) * 5 * 10) / 10, readiness, country: ctry ? ctry.iso2 : 'N/A' };
    });
  }, [portfolio]);

  /* selected country object */
  const selCountry = countriesWithScores.find(c => c.iso2 === selectedCountry) || countriesWithScores[0];

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: 24, maxWidth: 1440, margin: '0 auto', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>Macro Transition Pathway Analyzer</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge label="IEA" color={T.sage} /><Badge label="3 Scenarios" color={T.gold} /><Badge label="20 Countries" color={T.navy} /><Badge label="Energy Mix" color={T.amber} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={() => exportCSV(sorted, 'macro_transition_countries.csv')}>Export CSV</Btn>
          <Btn onClick={() => exportJSON({ scenario: sc, countries: sorted, minerals: CRITICAL_MINERALS }, 'macro_transition.json')} variant="outline">Export JSON</Btn>
          <Btn onClick={printPage} variant="outline">Print / PDF</Btn>
        </div>
      </div>

      {/* Scenario Selector */}
      <Section title="IEA Scenario Selection" sub="Select a scenario pathway">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 20 }}>
          {IEA_SCENARIOS.map(s => (
            <Card key={s.id} onClick={() => setSelectedScenario(s.id)} style={{ border: selectedScenario === s.id ? `2px solid ${s.color}` : `1px solid ${T.border}`, cursor: 'pointer', background: selectedScenario === s.id ? `${s.color}08` : T.surface }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.name}</div>
                <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.global_temp}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, marginBottom: 8 }}>{s.description}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={`Coal end: ${s.coal_phaseout}`} color={s.color} />
                <Badge label={`Renewables ${s.renewables_2030_pct}%`} color={s.color} />
                <Badge label={`$${s.investment_clean_tn}Tn clean`} color={s.color} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* 10 KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Global Temp Outcome" value={sc.global_temp} sub={sc.name} color={sc.color} />
        <KpiCard label="Coal Phaseout Year" value={sc.coal_phaseout} sub="Unabated coal" />
        <KpiCard label="Oil Demand 2030" value={`${sc.oil_demand_2030_vs_2022 > 0 ? '+' : ''}${sc.oil_demand_2030_vs_2022}%`} sub="vs 2022" color={sc.oil_demand_2030_vs_2022 > 0 ? T.red : T.green} />
        <KpiCard label="Renewables 2030" value={`${sc.renewables_2030_pct}%`} sub="Global electricity" color={T.sage} />
        <KpiCard label="EV Share 2030" value={`${sc.ev_share_2030_pct}%`} sub="New vehicle sales" />
        <KpiCard label="Clean Investment" value={`$${sc.investment_clean_tn}Tn`} sub="Annual by 2030" color={T.gold} />
        <KpiCard label="Avg Fossil Gen %" value={`${totalFossilPct}%`} sub="20 countries" color={T.red} />
        <KpiCard label="Avg Transition Readiness" value={`${avgReadiness}/100`} sub="20 countries" color={avgReadiness >= 50 ? T.sage : T.amber} />
        <KpiCard label="Hydrogen Economies" value={`${hydrogenEcons}/20`} sub="With strategies" />
        <KpiCard label="Critical Mineral Risk" value={`${highMineralRisk} High`} sub="Of 20 countries" color={T.amber} />
      </div>

      {/* Tab bar */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ─── TAB 1: Pathways & Mix ─── */}
      {tab === TABS[0] && (
        <>
          {/* Year slider */}
          <Section title="Global Energy Mix Projection" sub={`${selectedScenario.toUpperCase()} scenario \u2022 2020-2050`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>Focus Year:</span>
              <input type="range" min={2020} max={2050} step={5} value={yearSlider} onChange={e => setYearSlider(+e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{yearSlider}</span>
            </div>
            <Card>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={energyMixData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} label={{ value: '%', position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Coal" stackId="1" stroke="#374151" fill="#374151" fillOpacity={0.8} />
                  <Area type="monotone" dataKey="Oil" stackId="1" stroke="#78716c" fill="#78716c" fillOpacity={0.7} />
                  <Area type="monotone" dataKey="Gas" stackId="1" stroke={T.amber} fill={T.amber} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Nuclear" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.5} />
                  <Area type="monotone" dataKey="Renewables" stackId="1" stroke={T.green} fill={T.green} fillOpacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* EV Adoption Curve */}
          <Section title="EV Adoption S-Curve" sub="Global new-vehicle EV share projection 2020-2040">
            <Card>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} label={{ value: '% EV', position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="ev_share" stroke={sc.color} fill={sc.color} fillOpacity={0.25} name="EV Share %" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Scenario Comparison Table */}
          <Section title="Scenario Comparison" sub="Key metrics across 3 IEA pathways">
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={tblS}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      <th style={{ ...tdS, fontWeight: 700 }}>Metric</th>
                      {IEA_SCENARIOS.map(s => <th key={s.id} style={{ ...tdS, fontWeight: 700, color: s.color }}>{s.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { m: 'Global Temperature', k: 'global_temp' },
                      { m: 'Coal Phaseout', k: 'coal_phaseout' },
                      { m: 'Oil Demand 2030 vs 2022', k: 'oil_demand_2030_vs_2022', fmt: v => `${v > 0 ? '+' : ''}${v}%` },
                      { m: 'Gas Demand 2030 vs 2022', k: 'gas_demand_2030_vs_2022', fmt: v => `${v > 0 ? '+' : ''}${v}%` },
                      { m: 'Renewables 2030 %', k: 'renewables_2030_pct', fmt: v => `${v}%` },
                      { m: 'EV Share 2030 %', k: 'ev_share_2030_pct', fmt: v => `${v}%` },
                      { m: 'Clean Investment ($Tn/yr)', k: 'investment_clean_tn', fmt: v => `$${v}Tn` },
                    ].map(row => (
                      <tr key={row.k}>
                        <td style={tdS}>{row.m}</td>
                        {IEA_SCENARIOS.map(s => <td key={s.id} style={tdS}>{row.fmt ? row.fmt(s[row.k]) : s[row.k]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>
        </>
      )}

      {/* ─── TAB 2: Country Analysis ─── */}
      {tab === TABS[1] && (
        <>
          {/* Country Energy Mix Stacked Bar */}
          <Section title="Country Energy Mix" sub="Current electricity generation by source">
            <Card>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={countryEnergyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: '%', position: 'insideBottom', fontSize: 11 }} />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: T.text }} width={40} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Coal" stackId="a" fill="#374151" />
                  <Bar dataKey="OtherFossil" stackId="a" fill="#78716c" name="Oil & Gas" />
                  <Bar dataKey="Nuclear" stackId="a" fill="#7c3aed" />
                  <Bar dataKey="Renewable" stackId="a" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Transition Readiness Ranking */}
          <Section title="Transition Readiness Ranking" sub="Composite score (renewables, EV, grid, investment, H2)">
            <Card>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={readinessRanked} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: T.text }} width={35} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="readiness" name="Readiness Score">
                    {readinessRanked.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Clean Investment vs Fossil Subsidies */}
          <Section title="Clean Energy Investment vs Fossil Subsidies" sub="$Bn comparison">
            <Card>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={investVsSubsidy}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: '$Bn', position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Clean Investment" fill={T.green} />
                  <Bar dataKey="Fossil Subsidies" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Transition Jobs Impact */}
          <Section title="Transition Jobs Impact" sub="Thousands of jobs created vs lost per country">
            <Card>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={jobsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'K jobs', position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Created" fill={T.green} />
                  <Bar dataKey="Lost" fill={T.red} name="Jobs Lost" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Country Comparison (multi-select) */}
          <Section title="Country Comparison" sub="Select up to 3 countries">
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              {COUNTRY_TRANSITION.map(c => (
                <button key={c.iso2} onClick={() => {
                  setCompareCountries(prev => prev.includes(c.iso2) ? prev.filter(x => x !== c.iso2) : prev.length < 3 ? [...prev, c.iso2] : prev);
                }} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${compareCountries.includes(c.iso2) ? T.navy : T.border}`, background: compareCountries.includes(c.iso2) ? `${T.navy}12` : T.surface, color: T.navy, fontSize: 11, cursor: 'pointer', fontWeight: compareCountries.includes(c.iso2) ? 700 : 400, fontFamily: T.font }}>
                  {c.iso2}
                </button>
              ))}
            </div>
            {compareCountries.length > 0 && (
              <Card>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tblS}>
                    <thead>
                      <tr style={{ background: T.surfaceH }}>
                        <th style={{ ...tdS, fontWeight: 700 }}>Indicator</th>
                        {compareCountries.map(iso => {
                          const cc = countriesWithScores.find(c => c.iso2 === iso);
                          return <th key={iso} style={{ ...tdS, fontWeight: 700, color: T.navy }}>{cc?.country || iso}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {['renewable_pct', 'coal_pct_generation', 'ev_sales_pct', 'grid_readiness', 'clean_energy_investment_bn', 'fossil_subsidy_bn', 'transition_readiness'].map(k => (
                        <tr key={k}>
                          <td style={tdS}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                          {compareCountries.map(iso => {
                            const cc = countriesWithScores.find(c => c.iso2 === iso);
                            return <td key={iso} style={tdS}>{cc ? cc[k] : 'N/A'}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </Section>

          {/* Sortable Country Table */}
          <Section title="Country Transition Data" sub="All 20 countries \u2022 click column headers to sort">
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={tblS}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      <SortTh label="Country" sortKey="country" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Coal %" sortKey="coal_pct_generation" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Renew %" sortKey="renewable_pct" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Nuclear %" sortKey="nuclear_pct" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="EV Sales %" sortKey="ev_sales_pct" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Clean Inv $Bn" sortKey="clean_energy_investment_bn" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Fossil Sub $Bn" sortKey="fossil_subsidy_bn" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Grid Ready" sortKey="grid_readiness" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="H2" sortKey="hydrogen_strategy" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh label="Readiness" sortKey="transition_readiness" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(c => (
                      <tr key={c.iso2} onClick={() => setSelectedCountry(c.iso2)} style={{ cursor: 'pointer', background: selectedCountry === c.iso2 ? `${T.navy}08` : 'transparent' }}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{c.country}</td>
                        <td style={tdS}>{c.coal_pct_generation}</td>
                        <td style={{ ...tdS, color: c.renewable_pct >= 50 ? T.green : T.text }}>{c.renewable_pct}</td>
                        <td style={tdS}>{c.nuclear_pct}</td>
                        <td style={{ ...tdS, color: c.ev_sales_pct >= 20 ? T.green : T.text }}>{c.ev_sales_pct}</td>
                        <td style={tdS}>{c.clean_energy_investment_bn}</td>
                        <td style={{ ...tdS, color: c.fossil_subsidy_bn > 20 ? T.red : T.text }}>{c.fossil_subsidy_bn}</td>
                        <td style={tdS}>{c.grid_readiness}</td>
                        <td style={tdS}>{c.hydrogen_strategy ? '\u2705' : '\u274c'}</td>
                        <td style={{ ...tdS, fontWeight: 700, color: c.transition_readiness >= 60 ? T.green : c.transition_readiness >= 40 ? T.amber : T.red }}>{c.transition_readiness}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>
        </>
      )}

      {/* ─── TAB 3: Technology & Minerals ─── */}
      {tab === TABS[2] && (
        <>
          {/* Hydrogen Economy Readiness */}
          <Section title="Hydrogen Economy Readiness" sub="Countries with hydrogen strategies">
            <Card>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={hydrogenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ccus_mt" fill={T.sage} name="CCUS Capacity (Mt)" />
                  <Bar dataKey="grid" fill={T.navy} name="Grid Readiness" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ marginTop: 14 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={tblS}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      <th style={{ ...tdS, fontWeight: 700 }}>Country</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>H2 Strategy</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>CCUS (Mt)</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Grid Readiness</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Clean Inv $Bn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countriesWithScores.filter(c => c.hydrogen_strategy).sort((a, b) => b.ccus_capacity_mt - a.ccus_capacity_mt).map(c => (
                      <tr key={c.iso2}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{c.country}</td>
                        <td style={tdS}><Badge label="Active" color={T.green} /></td>
                        <td style={tdS}>{c.ccus_capacity_mt}</td>
                        <td style={tdS}>{c.grid_readiness}</td>
                        <td style={tdS}>{c.clean_energy_investment_bn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>

          {/* Critical Minerals */}
          <Section title="Critical Minerals Dependency" sub="Supply risk for clean energy transition">
            <Card>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={CRITICAL_MINERALS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="mineral" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: '% growth 2030', position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="demand_growth_2030_pct" name="Demand Growth 2030 %">
                    {CRITICAL_MINERALS.map((m, i) => <Cell key={i} fill={m.supply_risk === 'Critical' ? T.red : m.supply_risk === 'High' ? T.amber : T.gold} />)}
                  </Bar>
                  <Bar dataKey="recycling_rate_pct" name="Recycling Rate %" fill={T.sage} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ marginTop: 14 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={tblS}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      <th style={{ ...tdS, fontWeight: 700 }}>Mineral</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Use Case</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Top Producers</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Supply Risk</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Demand Growth 2030</th>
                      <th style={{ ...tdS, fontWeight: 700 }}>Recycling Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CRITICAL_MINERALS.map(m => (
                      <tr key={m.mineral}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{m.mineral}</td>
                        <td style={tdS}>{m.use}</td>
                        <td style={tdS}>{m.top_producers}</td>
                        <td style={tdS}><Badge label={m.supply_risk} color={m.supply_risk === 'Critical' ? T.red : m.supply_risk === 'High' ? T.amber : T.gold} /></td>
                        <td style={{ ...tdS, fontWeight: 600 }}>{m.demand_growth_2030_pct}%</td>
                        <td style={tdS}>{m.recycling_rate_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>

          {/* Country Mineral Dependency */}
          <Section title="Country Critical Mineral Dependency" sub="Import reliance for transition minerals">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              {countriesWithScores.map(c => (
                <Card key={c.iso2}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{c.country}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.textSec }}>Dependency</span>
                    <Badge label={c.critical_minerals_dependency} color={c.critical_minerals_dependency === 'High' ? T.red : c.critical_minerals_dependency === 'Medium' ? T.amber : T.green} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Energy Import: {c.energy_import_dependency_pct}%</div>
                </Card>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ─── TAB 4: Portfolio Exposure ─── */}
      {tab === TABS[3] && (
        <>
          {/* Portfolio Transition Exposure */}
          <Section title="Portfolio Transition Exposure" sub="Holdings mapped to country transition readiness">
            {portfolioExposure.length === 0 ? (
              <Card><div style={{ textAlign: 'center', color: T.textMut, padding: 32 }}>No portfolio loaded. Save holdings to localStorage key <code>ra_portfolio_v1</code> to see mapping.</div></Card>
            ) : (
              <Card>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={portfolioExposure.slice(0, 20)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Readiness', position: 'insideBottom', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.text }} width={120} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="readiness" name="Transition Readiness">
                      {portfolioExposure.slice(0, 20).map((d, i) => <Cell key={i} fill={d.readiness >= 60 ? T.green : d.readiness >= 40 ? T.gold : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </Section>

          {/* Portfolio holdings table */}
          {portfolioExposure.length > 0 && (
            <Section title="Holdings Transition Detail" sub="Weight, country, readiness score">
              <Card>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tblS}>
                    <thead>
                      <tr style={{ background: T.surfaceH }}>
                        <th style={{ ...tdS, fontWeight: 700 }}>Holding</th>
                        <th style={{ ...tdS, fontWeight: 700 }}>Weight %</th>
                        <th style={{ ...tdS, fontWeight: 700 }}>Country</th>
                        <th style={{ ...tdS, fontWeight: 700 }}>Readiness</th>
                        <th style={{ ...tdS, fontWeight: 700 }}>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioExposure.map((h, i) => (
                        <tr key={i}>
                          <td style={{ ...tdS, fontWeight: 600 }}>{h.name}</td>
                          <td style={tdS}>{h.weight}%</td>
                          <td style={tdS}>{h.country}</td>
                          <td style={{ ...tdS, fontWeight: 700, color: h.readiness >= 60 ? T.green : h.readiness >= 40 ? T.amber : T.red }}>{h.readiness}</td>
                          <td style={tdS}><Badge label={h.readiness >= 60 ? 'Low' : h.readiness >= 40 ? 'Medium' : 'High'} color={h.readiness >= 60 ? T.green : h.readiness >= 40 ? T.amber : T.red} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </Section>
          )}

          {/* Portfolio weighted readiness */}
          <Section title="Portfolio Weighted Transition Readiness">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              <KpiCard label="Wtd Avg Readiness" value={portfolioExposure.length ? `${Math.round(portfolioExposure.reduce((s, h) => s + h.readiness * (h.weight || 1), 0) / Math.max(portfolioExposure.reduce((s, h) => s + (h.weight || 1), 0), 1))}/100` : 'N/A'} sub="Portfolio composite" />
              <KpiCard label="High Risk Holdings" value={portfolioExposure.filter(h => h.readiness < 40).length} sub="Readiness < 40" color={T.red} />
              <KpiCard label="Transition Leaders" value={portfolioExposure.filter(h => h.readiness >= 70).length} sub="Readiness \u2265 70" color={T.green} />
              <KpiCard label="Countries Covered" value={new Set(portfolioExposure.map(h => h.country)).size} sub="Unique countries" />
            </div>
          </Section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         CROSS-NAVIGATION
         ══════════════════════════════════════════════════════════════ */}
      <Section title="Cross-Navigation" sub="Related analytics modules">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Climate Policy Tracker', path: '/climate-policy' },
            { label: 'Sovereign ESG & SWF', path: '/sovereign-swf' },
            { label: 'Scenario Stress Test', path: '/scenario-stress-test' },
            { label: 'Stranded Assets', path: '/stranded-assets' },
            { label: 'Carbon Budget Tracker', path: '/carbon-budget' },
            { label: 'Just Transition', path: '/just-transition' },
            { label: 'Green Hydrogen', path: '/green-hydrogen' },
            { label: 'Critical Minerals', path: '/critical-minerals' },
          ].map(n => (
            <Btn key={n.path} variant="outline" onClick={() => navigate(n.path)} style={{ fontSize: 12 }}>{n.label}</Btn>
          ))}
        </div>
      </Section>
    </div>
  );
}
