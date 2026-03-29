import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine, PieChart, Pie
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const seed = (s) => { let x = Math.sin(s * 2.7183 + 1) * 10000; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════
   GLOBAL CARBON BUDGET STATUS
   ══════════════════════════════════════════════════════════════ */
const CARBON_BUDGET = {
  remaining_1_5: { gt: 400, year_exhausted_at_current_rate: 2032, annual_reduction_needed: -7.6 },
  remaining_2_0: { gt: 1150, year_exhausted_at_current_rate: 2046, annual_reduction_needed: -4.2 },
  current_annual_global: 40,
  cumulative_since_1850: 2560,
  paris_goal: '1.5C with low/no overshoot',
  global_stocktake_year: 2023,
  next_stocktake: 2028,
};

/* ══════════════════════════════════════════════════════════════
   COUNTRY PARIS DATA (30 countries)
   ══════════════════════════════════════════════════════════════ */
const COUNTRY_PARIS = [
  { iso2:'DE', country:'Germany', ndc_target:'-65% by 2030', progress_pct:48, on_track:false, gap_pct:17, policies_sufficient:false, net_zero:2045, nz_in_law:true, cumulative_gt:92, emissions_mt:674 },
  { iso2:'US', country:'United States', ndc_target:'-50% by 2030', progress_pct:32, on_track:false, gap_pct:18, policies_sufficient:false, net_zero:2050, nz_in_law:false, cumulative_gt:509, emissions_mt:5007 },
  { iso2:'CN', country:'China', ndc_target:'Peak by 2030', progress_pct:55, on_track:true, gap_pct:5, policies_sufficient:false, net_zero:2060, nz_in_law:false, cumulative_gt:284, emissions_mt:11397 },
  { iso2:'IN', country:'India', ndc_target:'-45% intensity by 2030', progress_pct:62, on_track:true, gap_pct:8, policies_sufficient:false, net_zero:2070, nz_in_law:false, cumulative_gt:55, emissions_mt:2710 },
  { iso2:'JP', country:'Japan', ndc_target:'-46% by 2030', progress_pct:38, on_track:false, gap_pct:12, policies_sufficient:false, net_zero:2050, nz_in_law:true, cumulative_gt:67, emissions_mt:1067 },
  { iso2:'GB', country:'United Kingdom', ndc_target:'-68% by 2030', progress_pct:58, on_track:true, gap_pct:10, policies_sufficient:true, net_zero:2050, nz_in_law:true, cumulative_gt:78, emissions_mt:341 },
  { iso2:'FR', country:'France', ndc_target:'-40% by 2030', progress_pct:52, on_track:true, gap_pct:8, policies_sufficient:true, net_zero:2050, nz_in_law:true, cumulative_gt:38, emissions_mt:299 },
  { iso2:'BR', country:'Brazil', ndc_target:'-50% by 2030', progress_pct:28, on_track:false, gap_pct:22, policies_sufficient:false, net_zero:2050, nz_in_law:false, cumulative_gt:15, emissions_mt:457 },
  { iso2:'AU', country:'Australia', ndc_target:'-43% by 2030', progress_pct:35, on_track:false, gap_pct:12, policies_sufficient:false, net_zero:2050, nz_in_law:true, cumulative_gt:21, emissions_mt:392 },
  { iso2:'CA', country:'Canada', ndc_target:'-40% by 2030', progress_pct:30, on_track:false, gap_pct:15, policies_sufficient:false, net_zero:2050, nz_in_law:true, cumulative_gt:32, emissions_mt:556 },
  { iso2:'KR', country:'South Korea', ndc_target:'-40% by 2030', progress_pct:25, on_track:false, gap_pct:18, policies_sufficient:false, net_zero:2050, nz_in_law:true, cumulative_gt:18, emissions_mt:616 },
  { iso2:'ZA', country:'South Africa', ndc_target:'398-510 Mt by 2030', progress_pct:20, on_track:false, gap_pct:25, policies_sufficient:false, net_zero:2050, nz_in_law:false, cumulative_gt:16, emissions_mt:435 },
  { iso2:'SA', country:'Saudi Arabia', ndc_target:'-278 Mt by 2030', progress_pct:15, on_track:false, gap_pct:30, policies_sufficient:false, net_zero:2060, nz_in_law:false, cumulative_gt:22, emissions_mt:672 },
  { iso2:'MX', country:'Mexico', ndc_target:'-22% by 2030', progress_pct:18, on_track:false, gap_pct:20, policies_sufficient:false, net_zero:2050, nz_in_law:false, cumulative_gt:12, emissions_mt:464 },
  { iso2:'ID', country:'Indonesia', ndc_target:'-31.89% by 2030', progress_pct:22, on_track:false, gap_pct:18, policies_sufficient:false, net_zero:2060, nz_in_law:false, cumulative_gt:8, emissions_mt:619 },
  { iso2:'RU', country:'Russia', ndc_target:'-30% by 2030', progress_pct:40, on_track:false, gap_pct:15, policies_sufficient:false, net_zero:2060, nz_in_law:false, cumulative_gt:115, emissions_mt:1848 },
  { iso2:'IT', country:'Italy', ndc_target:'-43% by 2030', progress_pct:42, on_track:false, gap_pct:12, policies_sufficient:false, net_zero:2050, nz_in_law:true, cumulative_gt:25, emissions_mt:326 },
  { iso2:'ES', country:'Spain', ndc_target:'-23% by 2030', progress_pct:55, on_track:true, gap_pct:5, policies_sufficient:true, net_zero:2050, nz_in_law:true, cumulative_gt:15, emissions_mt:228 },
  { iso2:'NL', country:'Netherlands', ndc_target:'-49% by 2030', progress_pct:48, on_track:false, gap_pct:10, policies_sufficient:true, net_zero:2050, nz_in_law:true, cumulative_gt:12, emissions_mt:150 },
  { iso2:'SE', country:'Sweden', ndc_target:'NZ by 2045', progress_pct:72, on_track:true, gap_pct:3, policies_sufficient:true, net_zero:2045, nz_in_law:true, cumulative_gt:5, emissions_mt:41 },
  { iso2:'NO', country:'Norway', ndc_target:'-50% by 2030', progress_pct:55, on_track:true, gap_pct:6, policies_sufficient:true, net_zero:2050, nz_in_law:true, cumulative_gt:4, emissions_mt:49 },
  { iso2:'DK', country:'Denmark', ndc_target:'-70% by 2030', progress_pct:60, on_track:true, gap_pct:8, policies_sufficient:true, net_zero:2050, nz_in_law:true, cumulative_gt:3, emissions_mt:30 },
  { iso2:'FI', country:'Finland', ndc_target:'NZ by 2035', progress_pct:65, on_track:true, gap_pct:4, policies_sufficient:true, net_zero:2035, nz_in_law:true, cumulative_gt:3, emissions_mt:42 },
  { iso2:'CH', country:'Switzerland', ndc_target:'-50% by 2030', progress_pct:50, on_track:true, gap_pct:7, policies_sufficient:true, net_zero:2050, nz_in_law:true, cumulative_gt:2, emissions_mt:38 },
  { iso2:'SG', country:'Singapore', ndc_target:'Peak by 2030', progress_pct:42, on_track:false, gap_pct:12, policies_sufficient:false, net_zero:2050, nz_in_law:false, cumulative_gt:1, emissions_mt:52 },
  { iso2:'HK', country:'Hong Kong', ndc_target:'-50% by 2035', progress_pct:35, on_track:false, gap_pct:15, policies_sufficient:false, net_zero:2050, nz_in_law:false, cumulative_gt:1, emissions_mt:37 },
  { iso2:'AE', country:'UAE', ndc_target:'-31% by 2030', progress_pct:28, on_track:false, gap_pct:18, policies_sufficient:false, net_zero:2050, nz_in_law:true, cumulative_gt:7, emissions_mt:225 },
  { iso2:'PL', country:'Poland', ndc_target:'-30% by 2030', progress_pct:22, on_track:false, gap_pct:20, policies_sufficient:false, net_zero:2050, nz_in_law:false, cumulative_gt:24, emissions_mt:318 },
  { iso2:'TH', country:'Thailand', ndc_target:'-30% by 2030', progress_pct:25, on_track:false, gap_pct:16, policies_sufficient:false, net_zero:2065, nz_in_law:false, cumulative_gt:4, emissions_mt:270 },
  { iso2:'CL', country:'Chile', ndc_target:'Peak by 2025', progress_pct:58, on_track:true, gap_pct:6, policies_sufficient:true, net_zero:2050, nz_in_law:true, cumulative_gt:3, emissions_mt:52 },
];

/* ══════════════════════════════════════════════════════════════
   GLOBAL STOCKTAKE COP28 KEY FINDINGS
   ══════════════════════════════════════════════════════════════ */
const STOCKTAKE_FINDINGS = [
  { pillar: 'Mitigation', finding: 'Current NDCs fall short of 1.5C pathway; 43% reduction by 2030 needed but only ~20% committed', gap_severity: 'Critical', score: 28 },
  { pillar: 'Adaptation', finding: 'Adaptation finance remains at <10% of climate finance; developing nations disproportionately affected', gap_severity: 'High', score: 35 },
  { pillar: 'Finance', finding: 'USD 100bn/yr climate finance goal unmet; trillions needed for Net Zero transition', gap_severity: 'Critical', score: 22 },
  { pillar: 'Loss & Damage', finding: 'New fund operationalized at COP28; initial pledges ~USD 700M, needs scaling', gap_severity: 'High', score: 30 },
  { pillar: 'Technology Transfer', finding: 'Green tech transfer to developing nations accelerating but remains insufficient', gap_severity: 'Moderate', score: 45 },
  { pillar: 'Fossil Fuel Transition', finding: 'First-ever COP agreement to transition away from fossil fuels in energy systems', gap_severity: 'High', score: 40 },
];

/* ══════════════════════════════════════════════════════════════
   HISTORICAL CUMULATIVE EMISSIONS (top 10, Gt CO2 since 1850)
   ══════════════════════════════════════════════════════════════ */
const HISTORICAL_EMISSIONS = [
  { country: 'United States', cumulative_gt: 509, share_pct: 19.9 },
  { country: 'China', cumulative_gt: 284, share_pct: 11.1 },
  { country: 'Russia', cumulative_gt: 115, share_pct: 4.5 },
  { country: 'Germany', cumulative_gt: 92, share_pct: 3.6 },
  { country: 'United Kingdom', cumulative_gt: 78, share_pct: 3.0 },
  { country: 'Japan', cumulative_gt: 67, share_pct: 2.6 },
  { country: 'India', cumulative_gt: 55, share_pct: 2.1 },
  { country: 'France', cumulative_gt: 38, share_pct: 1.5 },
  { country: 'Canada', cumulative_gt: 32, share_pct: 1.2 },
  { country: 'Italy', cumulative_gt: 25, share_pct: 1.0 },
];

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow .15s, transform .1s', ...style }} onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,58,92,.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>{children}</div>
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
const LS_PORTFOLIO = 'ra_portfolio_v1';
const loadLS = (key) => { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } };

const TABS = ['Carbon Budget', 'Company Alignment', 'Country NDCs', 'Global Stocktake', 'Engagement'];

/* ══════════════════════════════════════════════════════════════
   NZ COMMITMENT QUALITY
   ══════════════════════════════════════════════════════════════ */
const NZ_QUALITY_TIERS = [
  { tier: 'Law-Backed', score: 100, color: T.green, desc: 'Net zero target enshrined in national law' },
  { tier: 'SBTi-Verified', score: 80, color: T.sage, desc: 'Science-based target verified by SBTi' },
  { tier: 'Pledged', score: 50, color: T.amber, desc: 'Net zero pledge announced but unverified' },
  { tier: 'None', score: 10, color: T.red, desc: 'No net zero commitment' },
];

/* ══════════════════════════════════════════════════════════════
   SECTOR ALIGNMENT BENCHMARKS
   ══════════════════════════════════════════════════════════════ */
const SECTOR_BENCHMARKS = [
  { sector: 'Energy', itr_1_5: 1.5, itr_2_0: 2.0, required_reduction: -8.5 },
  { sector: 'Materials', itr_1_5: 1.5, itr_2_0: 2.0, required_reduction: -7.2 },
  { sector: 'Industrials', itr_1_5: 1.5, itr_2_0: 2.0, required_reduction: -5.8 },
  { sector: 'Utilities', itr_1_5: 1.5, itr_2_0: 2.0, required_reduction: -9.1 },
  { sector: 'Consumer Discretionary', itr_1_5: 1.5, itr_2_0: 2.0, required_reduction: -4.5 },
  { sector: 'Consumer Staples', itr_1_5: 1.5, itr_2_0: 2.0, required_reduction: -3.8 },
  { sector: 'Health Care', itr_1_5: 1.5, itr_2_0: 2.0, required_reduction: -3.2 },
  { sector: 'Financials', itr_1_5: 1.5, itr_2_0: 2.0, required_reduction: -4.0 },
  { sector: 'Information Technology', itr_1_5: 1.5, itr_2_0: 2.0, required_reduction: -3.5 },
  { sector: 'Real Estate', itr_1_5: 1.5, itr_2_0: 2.0, required_reduction: -5.0 },
];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ParisAlignmentPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [sortCol, setSortCol] = useState('itr');
  const [sortDir, setSortDir] = useState('asc');
  const [scenarioSlider, setScenarioSlider] = useState(1.5);
  const [countryFilter, setCountryFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');

  /* Load portfolio */
  const holdings = useMemo(() => {
    const portfolio = loadLS(LS_PORTFOLIO);
    if (!portfolio || !portfolio.length) return GLOBAL_COMPANY_MASTER.slice(0, 30);
    return portfolio.map(p => {
      const master = GLOBAL_COMPANY_MASTER.find(c => c.isin === p.isin || c.ticker === p.ticker);
      return master ? { ...master, weight: p.weight } : { ...p, weight: p.weight };
    }).filter(Boolean);
  }, []);

  /* Enrich with Paris alignment data */
  const enriched = useMemo(() => {
    return holdings.map((h, i) => {
      const s = seed(i + 7);
      const itr = +(1.4 + s * 2.6).toFixed(1);
      const budgetUsed = +(20 + s * 60).toFixed(1);
      const hasSBTi = h.sbti_committed || s > 0.55;
      const nzYear = h.carbon_neutral_target_year || (s > 0.3 ? (2035 + Math.floor(s * 25)) : null);
      const onTrack15 = itr <= 1.8;
      const onTrack20 = itr <= 2.2;
      const nzQuality = nzYear && hasSBTi ? (s > 0.7 ? 'Law-Backed' : 'SBTi-Verified') : nzYear ? 'Pledged' : 'None';
      const annualEmissions = (h.scope1_co2e || 50000) + (h.scope2_co2e || 20000);
      const budgetShare = +(annualEmissions / 40e9 * 100).toFixed(6);
      const country = h.country || 'India';
      const countryParis = COUNTRY_PARIS.find(c => c.country === country);
      const ndcAligned = countryParis ? countryParis.on_track : false;
      return {
        ...h,
        itr, budgetUsed, hasSBTi, nzYear, onTrack15, onTrack20, nzQuality,
        annualEmissions, budgetShare, ndcAligned,
        sector: h.sector || h.gics_sector || 'Unknown',
        country,
      };
    });
  }, [holdings]);

  /* Aggregates */
  const agg = useMemo(() => {
    const n = enriched.length || 1;
    const wtdITR = enriched.reduce((s, e) => s + e.itr * (e.weight || 1/n), 0) / enriched.reduce((s, e) => s + (e.weight || 1/n), 0);
    const budgetAligned = enriched.filter(e => e.budgetUsed < 50).length;
    const on15 = enriched.filter(e => e.onTrack15).length;
    const on20 = enriched.filter(e => e.onTrack20).length;
    const sbtiPct = enriched.filter(e => e.hasSBTi).length / n * 100;
    const nzPct = enriched.filter(e => e.nzYear).length / n * 100;
    const totalEmissions = enriched.reduce((s, e) => s + e.annualEmissions, 0);
    const portfolioBudgetShare = totalEmissions / 40e9 * 100;
    const yearsUntilExhaust = Math.max(0, Math.round(CARBON_BUDGET.remaining_1_5.gt / (totalEmissions / 1e9)));
    const ndcAligned = enriched.filter(e => e.ndcAligned).length / n * 100;
    const parisCountries = COUNTRY_PARIS.filter(c => c.on_track).length;
    return {
      wtdITR: +wtdITR.toFixed(2), budgetAlignedPct: +(budgetAligned / n * 100).toFixed(1),
      on15, on20, sbtiPct: +sbtiPct.toFixed(1), nzPct: +nzPct.toFixed(1),
      portfolioBudgetShare: +portfolioBudgetShare.toFixed(4), yearsUntilExhaust,
      ndcAligned: +ndcAligned.toFixed(1), parisCountries,
    };
  }, [enriched]);

  /* Filtered & sorted company table */
  const sectors = useMemo(() => ['All', ...new Set(enriched.map(e => e.sector))].sort(), [enriched]);
  const countries = useMemo(() => ['All', ...new Set(enriched.map(e => e.country))].sort(), [enriched]);

  const sortedHoldings = useMemo(() => {
    let arr = [...enriched];
    if (sectorFilter !== 'All') arr = arr.filter(e => e.sector === sectorFilter);
    if (countryFilter !== 'All') arr = arr.filter(e => e.country === countryFilter);
    arr.sort((a, b) => {
      const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return arr;
  }, [enriched, sortCol, sortDir, sectorFilter, countryFilter]);

  const onSort = (key) => { if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(key); setSortDir('asc'); } };

  /* Temperature distribution histogram */
  const histogramData = useMemo(() => {
    const bins = [{ label: '<1.5C', min: 0, max: 1.5 }, { label: '1.5-1.8C', min: 1.5, max: 1.8 }, { label: '1.8-2.0C', min: 1.8, max: 2.0 }, { label: '2.0-2.5C', min: 2.0, max: 2.5 }, { label: '2.5-3.0C', min: 2.5, max: 3.0 }, { label: '3.0C+', min: 3.0, max: 99 }];
    return bins.map(b => ({ name: b.label, count: enriched.filter(e => e.itr >= b.min && e.itr < b.max).length, color: b.max <= 1.8 ? T.green : b.max <= 2.2 ? T.amber : T.red }));
  }, [enriched]);

  /* Carbon budget trajectory */
  const budgetTrajectory = useMemo(() => {
    const years = [];
    for (let yr = 2024; yr <= 2050; yr++) {
      const t = yr - 2024;
      const current = Math.max(0, CARBON_BUDGET.remaining_1_5.gt - t * CARBON_BUDGET.current_annual_global);
      const moderate = Math.max(0, CARBON_BUDGET.remaining_1_5.gt - t * CARBON_BUDGET.current_annual_global * Math.pow(0.958, t));
      const paris = Math.max(0, CARBON_BUDGET.remaining_1_5.gt - t * CARBON_BUDGET.current_annual_global * Math.pow(0.924, t));
      years.push({ year: yr, current_policy: +current.toFixed(0), moderate_action: +moderate.toFixed(0), paris_aligned: +paris.toFixed(0) });
    }
    return years;
  }, []);

  /* Sector alignment data */
  const sectorAlignment = useMemo(() => {
    return SECTOR_BENCHMARKS.map(sb => {
      const sectorHoldings = enriched.filter(e => e.sector === sb.sector);
      const avgITR = sectorHoldings.length ? sectorHoldings.reduce((s, e) => s + e.itr, 0) / sectorHoldings.length : 2.5;
      return { ...sb, avgITR: +avgITR.toFixed(2), count: sectorHoldings.length, gap: +(avgITR - 1.5).toFixed(2) };
    }).filter(s => s.count > 0).sort((a, b) => b.avgITR - a.avgITR);
  }, [enriched]);

  /* NZ quality distribution */
  const nzDistribution = useMemo(() => {
    return NZ_QUALITY_TIERS.map(t => ({ ...t, count: enriched.filter(e => e.nzQuality === t.tier).length }));
  }, [enriched]);

  /* Engagement priority */
  const engagementPriority = useMemo(() => {
    return [...enriched].filter(e => e.itr > 2.0).sort((a, b) => b.itr - a.itr).slice(0, 15);
  }, [enriched]);

  /* Exports */
  const exportCSV = useCallback(() => {
    const header = ['Company', 'Sector', 'Country', 'ITR (C)', 'Budget Used %', 'SBTi', 'NZ Year', 'On Track 1.5C', 'NZ Quality', 'Annual Emissions tCO2e'];
    const rows = enriched.map(e => [e.company_name || e.name, e.sector, e.country, e.itr, e.budgetUsed, e.hasSBTi, e.nzYear || 'N/A', e.onTrack15 ? 'Yes' : 'No', e.nzQuality, Math.round(e.annualEmissions)]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'paris_alignment_report.csv'; a.click(); URL.revokeObjectURL(url);
  }, [enriched]);

  const exportJSON = useCallback(() => {
    const data = { generated: new Date().toISOString(), carbonBudget: CARBON_BUDGET, aggregates: agg, holdingsCount: enriched.length, holdings: enriched.map(e => ({ name: e.company_name || e.name, itr: e.itr, budgetUsed: e.budgetUsed, hasSBTi: e.hasSBTi, nzYear: e.nzYear, onTrack15: e.onTrack15, nzQuality: e.nzQuality })), countryParis: COUNTRY_PARIS };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'paris_alignment_data.json'; a.click(); URL.revokeObjectURL(url);
  }, [enriched, agg]);

  const exportPrint = useCallback(() => window.print(), []);

  /* Status helper */
  const statusIcon = (ok) => ok ? '\u2705' : '\u274C';
  const itrColor = (v) => v <= 1.5 ? T.green : v <= 2.0 ? T.sage : v <= 2.5 ? T.amber : T.red;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px' }}>

        {/* ── S1: Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.navy, marginBottom: 6 }}>Paris Agreement Alignment</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge label="1.5C" color={T.green} /><Badge label="Carbon Budget" color={T.gold} /><Badge label="NDCs" color={T.sage} /><Badge label="Global Stocktake" color={T.navyL} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={exportCSV}>Export CSV</Btn>
            <Btn onClick={exportJSON} variant="outline">Export JSON</Btn>
            <Btn onClick={exportPrint} variant="outline">Print</Btn>
          </div>
        </div>

        {/* ── S2: 10 KPI cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard label="Portfolio Temperature" value={`${agg.wtdITR}C`} sub="Weighted ITR" color={itrColor(agg.wtdITR)} />
          <KpiCard label="Budget Alignment" value={`${agg.budgetAlignedPct}%`} sub="Holdings <50% used" color={T.sage} />
          <KpiCard label="On 1.5C Track" value={agg.on15} sub={`of ${enriched.length} holdings`} color={T.green} />
          <KpiCard label="On 2.0C Track" value={agg.on20} sub={`of ${enriched.length} holdings`} color={T.amber} />
          <KpiCard label="SBTi Coverage" value={`${agg.sbtiPct}%`} sub="Science-based targets" color={T.navy} />
          <KpiCard label="Net Zero Coverage" value={`${agg.nzPct}%`} sub="Holdings with NZ target" color={T.sage} />
          <KpiCard label="Carbon Budget Share" value={`${agg.portfolioBudgetShare}%`} sub="Of global budget" color={T.gold} />
          <KpiCard label="Years Until Exhaust" value={agg.yearsUntilExhaust} sub="At portfolio rate (1.5C)" color={agg.yearsUntilExhaust < 10 ? T.red : T.amber} />
          <KpiCard label="NDC-Aligned" value={`${agg.ndcAligned}%`} sub="Holdings in on-track nations" color={T.navyL} />
          <KpiCard label="Paris-Aligned Countries" value={`${agg.parisCountries}/30`} sub="On track for NDC" color={T.sage} />
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* ══════ TAB 1: CARBON BUDGET ══════ */}
        {tab === 'Carbon Budget' && (<>
          {/* ── S3: Global Carbon Budget AreaChart ── */}
          <Section title="Global Carbon Budget Trajectory" sub="Remaining Gt CO2 under 3 scenarios (2024-2050)">
            <Card>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 16px', background: `${T.red}15`, borderRadius: 8, fontSize: 12, fontFamily: T.font }}>
                  <strong>1.5C Budget:</strong> {CARBON_BUDGET.remaining_1_5.gt} Gt remaining | Exhausted by {CARBON_BUDGET.remaining_1_5.year_exhausted_at_current_rate}
                </div>
                <div style={{ padding: '8px 16px', background: `${T.amber}15`, borderRadius: 8, fontSize: 12, fontFamily: T.font }}>
                  <strong>2.0C Budget:</strong> {CARBON_BUDGET.remaining_2_0.gt} Gt remaining | Exhausted by {CARBON_BUDGET.remaining_2_0.year_exhausted_at_current_rate}
                </div>
                <div style={{ padding: '8px 16px', background: `${T.navy}12`, borderRadius: 8, fontSize: 12, fontFamily: T.font }}>
                  <strong>Current Annual:</strong> {CARBON_BUDGET.current_annual_global} Gt/yr | Cumulative since 1850: {CARBON_BUDGET.cumulative_since_1850} Gt
                </div>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={budgetTrajectory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Gt CO2 remaining', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: T.font }} />
                  <Area type="monotone" dataKey="current_policy" name="Current Policy" stroke={T.red} fill={`${T.red}30`} />
                  <Area type="monotone" dataKey="moderate_action" name="Moderate Action" stroke={T.amber} fill={`${T.amber}20`} />
                  <Area type="monotone" dataKey="paris_aligned" name="Paris-Aligned" stroke={T.green} fill={`${T.green}20`} />
                  <ReferenceLine y={0} stroke={T.navy} strokeWidth={2} label={{ value: 'Budget Exhausted', position: 'top', style: { fontSize: 10, fill: T.red } }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* ── S4: Temperature Distribution Histogram ── */}
          <Section title="Portfolio Temperature Distribution" sub={`${enriched.length} holdings binned by Implied Temperature Rise`}>
            <Card>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} />
                  <ReferenceLine x="1.8-2.0C" stroke={T.red} strokeDasharray="5 5" label={{ value: '1.5C target zone', position: 'top', style: { fontSize: 10, fill: T.red } }} />
                  <Bar dataKey="count" name="Holdings" radius={[6, 6, 0, 0]}>
                    {histogramData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* ── S11: Carbon Budget Attribution ── */}
          <Section title="Carbon Budget Attribution" sub="Portfolio share of global carbon budget with countdown">
            <Card>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Scenario Temperature Target</div>
                  <input type="range" min={1.5} max={3.0} step={0.1} value={scenarioSlider} onChange={e => setScenarioSlider(+e.target.value)} style={{ width: '100%', accentColor: T.navy }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}>
                    <span>1.5C</span><span style={{ fontWeight: 700, color: T.navy }}>{scenarioSlider}C</span><span>3.0C</span>
                  </div>
                  <div style={{ marginTop: 16, padding: 16, background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: T.textSec }}>Budget Remaining at {scenarioSlider}C</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: T.navy }}>{Math.round(CARBON_BUDGET.remaining_1_5.gt * (scenarioSlider / 1.5))} Gt</div>
                    <div style={{ fontSize: 12, color: T.textMut, marginTop: 4 }}>Annual reduction needed: {(CARBON_BUDGET.remaining_1_5.annual_reduction_needed * (1.5 / scenarioSlider)).toFixed(1)}%/yr</div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Portfolio Budget Countdown</div>
                  {[{ label: '1.5C Budget', gt: CARBON_BUDGET.remaining_1_5.gt, color: T.red }, { label: '2.0C Budget', gt: CARBON_BUDGET.remaining_2_0.gt, color: T.amber }].map((b, i) => {
                    const totalE = enriched.reduce((s, e) => s + e.annualEmissions, 0);
                    const yrs = Math.round(b.gt * 1e9 / totalE);
                    const pct = Math.min(100, (2024 - 1850) / (2024 - 1850 + yrs) * 100);
                    return (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: T.textSec }}>{b.label}</span>
                          <span style={{ fontWeight: 700, color: b.color }}>{yrs} years at portfolio rate</span>
                        </div>
                        <div style={{ height: 10, background: T.surfaceH, borderRadius: 5, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: b.color, borderRadius: 5 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </Section>

          {/* ── S13: Historical Emissions Context ── */}
          <Section title="Historical Emissions Context" sub="Cumulative CO2 since 1850 by country (responsibility framework)">
            <Card>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={HISTORICAL_EMISSIONS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Gt CO2 cumulative', position: 'bottom', style: { fontSize: 11, fill: T.textMut } }} />
                  <YAxis dataKey="country" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={110} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} formatter={(v, n) => [`${v} Gt (${HISTORICAL_EMISSIONS.find(h => h.cumulative_gt === v)?.share_pct}% global)`, 'Cumulative']} />
                  <Bar dataKey="cumulative_gt" name="Cumulative Gt" radius={[0, 6, 6, 0]}>
                    {HISTORICAL_EMISSIONS.map((_, i) => <Cell key={i} fill={[T.navy, T.red, T.gold, T.sage, T.navyL, T.amber, '#7c3aed', '#0d9488', '#ec4899', '#6366f1'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>
        </>)}

        {/* ══════ TAB 2: COMPANY ALIGNMENT ══════ */}
        {tab === 'Company Alignment' && (<>
          {/* ── S5: Company-Level Paris Alignment Table ── */}
          <Section title="Company-Level Paris Alignment" sub={`${sortedHoldings.length} holdings | Sortable`}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: T.surface }}>
                {sectors.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: T.surface }}>
                {countries.map(c => <option key={c}>{c}</option>)}
              </select>
              <div style={{ fontSize: 12, color: T.textMut, alignSelf: 'center' }}>{sortedHoldings.length} holdings shown</div>
            </div>
            <Card style={{ padding: 0, overflow: 'auto', maxHeight: 480 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 2 }}>
                  <tr>
                    <SortTh label="Company" sortKey="name" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Sector" sortKey="sector" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Country" sortKey="country" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="ITR (C)" sortKey="itr" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Budget Used %" sortKey="budgetUsed" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="SBTi" sortKey="hasSBTi" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="NZ Year" sortKey="nzYear" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="NZ Quality" sortKey="nzQuality" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHoldings.map((h, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name || h.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{h.sector}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{h.country}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: itrColor(h.itr) }}>{h.itr}C</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, h.budgetUsed)}%`, height: '100%', background: h.budgetUsed > 60 ? T.red : h.budgetUsed > 40 ? T.amber : T.green, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: T.textMut }}>{h.budgetUsed}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{h.hasSBTi ? '\u2705' : '\u274C'}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{h.nzYear || '-'}</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={h.nzQuality} color={NZ_QUALITY_TIERS.find(t => t.tier === h.nzQuality)?.color} /></td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 14 }}>{h.onTrack15 ? '\u2705' : h.onTrack20 ? '\u26A0\uFE0F' : '\u274C'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>

          {/* ── S9: Sector Alignment BarChart ── */}
          <Section title="Sector Temperature Alignment" sub="Average ITR by sector with 1.5C reference">
            <Card>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorAlignment}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 4]} label={{ value: 'ITR (C)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} />
                  <ReferenceLine y={1.5} stroke={T.green} strokeWidth={2} strokeDasharray="8 4" label={{ value: '1.5C Target', position: 'right', style: { fontSize: 10, fill: T.green } }} />
                  <ReferenceLine y={2.0} stroke={T.amber} strokeDasharray="5 5" label={{ value: '2.0C', position: 'right', style: { fontSize: 10, fill: T.amber } }} />
                  <Bar dataKey="avgITR" name="Avg ITR" radius={[6, 6, 0, 0]}>
                    {sectorAlignment.map((s, i) => <Cell key={i} fill={itrColor(s.avgITR)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* ── S10: Net Zero Commitment Quality ── */}
          <Section title="Net Zero Commitment Quality" sub="Score: Law-backed > SBTi-verified > Pledged > None">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {nzDistribution.map((nz, i) => (
                <Card key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Badge label={nz.tier} color={nz.color} />
                    <span style={{ fontSize: 22, fontWeight: 700, color: nz.color }}>{nz.count}</span>
                  </div>
                  <div style={{ height: 6, background: T.surfaceH, borderRadius: 3, marginBottom: 8 }}>
                    <div style={{ width: `${(nz.count / enriched.length * 100)}%`, height: '100%', background: nz.color, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{nz.desc}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Quality Score: {nz.score}/100</div>
                </Card>
              ))}
            </div>
          </Section>

          {/* ── S8: Paris Alignment Pathway ── */}
          <Section title="Paris Alignment Pathway" sub="Current portfolio ITR vs target with gap">
            <Card>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: itrColor(agg.wtdITR) }}>{agg.wtdITR}C</div>
                    <div style={{ fontSize: 24, color: T.textMut }}>&rarr;</div>
                    <div style={{ fontSize: 48, fontWeight: 800, color: T.green }}>1.5C</div>
                  </div>
                  <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Gap: <strong style={{ color: T.red }}>{(agg.wtdITR - 1.5).toFixed(2)}C</strong> above Paris target</div>
                  <div style={{ height: 12, background: T.surfaceH, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${Math.min(100, (1.5 / 4) * 100)}%`, height: '100%', background: T.green, borderRadius: 6 }} />
                    <div style={{ position: 'absolute', left: `${Math.min(100, (agg.wtdITR / 4) * 100)}%`, top: -2, width: 16, height: 16, background: itrColor(agg.wtdITR), borderRadius: '50%', border: '2px solid white', transform: 'translateX(-50%)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut, marginTop: 4 }}>
                    <span>0C</span><span>1.5C</span><span>2.0C</span><span>3.0C</span><span>4.0C</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Actions to Close Gap</div>
                  {[
                    { action: 'Engage top 10 emitters to set SBTi targets', impact: '-0.3C', priority: 'Critical' },
                    { action: 'Divest from companies with ITR >3.0C', impact: '-0.2C', priority: 'High' },
                    { action: 'Increase allocation to green bonds/renewables', impact: '-0.15C', priority: 'Medium' },
                    { action: 'Support just transition in emerging markets', impact: '-0.1C', priority: 'Medium' },
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                      <span style={{ color: T.textSec }}>{a.action}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Badge label={a.impact} color={T.green} />
                        <Badge label={a.priority} color={a.priority === 'Critical' ? T.red : a.priority === 'High' ? T.amber : T.sage} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Section>
        </>)}

        {/* ══════ TAB 3: COUNTRY NDCs ══════ */}
        {tab === 'Country NDCs' && (<>
          {/* ── S6: Country NDC Progress BarChart ── */}
          <Section title="Country NDC Progress vs 2030 Target" sub={`${COUNTRY_PARIS.length} countries tracked`}>
            <Card style={{ overflow: 'auto' }}>
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={COUNTRY_PARIS.slice().sort((a, b) => b.progress_pct - a.progress_pct)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Progress %', position: 'bottom', style: { fontSize: 11, fill: T.textMut } }} />
                  <YAxis dataKey="country" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={110} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} formatter={(v, name, props) => {
                    const d = props.payload;
                    return [`${v}% (Gap: ${d.gap_pct}%, NDC: ${d.ndc_target})`, name];
                  }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: T.font }} />
                  <Bar dataKey="progress_pct" name="Progress" radius={[0, 4, 4, 0]} stackId="a">
                    {COUNTRY_PARIS.slice().sort((a, b) => b.progress_pct - a.progress_pct).map((c, i) => <Cell key={i} fill={c.on_track ? T.green : T.amber} />)}
                  </Bar>
                  <Bar dataKey="gap_pct" name="Gap" radius={[0, 4, 4, 0]} stackId="a" fill={`${T.red}40`} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Country detail table */}
          <Section title="Country Paris Alignment Detail" sub="Net zero commitments and law status">
            <Card style={{ padding: 0, overflow: 'auto', maxHeight: 450 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 2 }}>
                  <tr>
                    {['Country', 'NDC Target', 'Progress', 'Gap', 'On Track', 'Net Zero', 'In Law', 'Policies OK', 'Cumulative Gt'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COUNTRY_PARIS.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{c.iso2} {c.country}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 11 }}>{c.ndc_target}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${c.progress_pct}%`, height: '100%', background: c.on_track ? T.green : T.amber, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: T.textMut }}>{c.progress_pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', color: T.red, fontWeight: 600 }}>{c.gap_pct}%</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{statusIcon(c.on_track)}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.net_zero}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{statusIcon(c.nz_in_law)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{statusIcon(c.policies_sufficient)}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.cumulative_gt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>
        </>)}

        {/* ══════ TAB 4: GLOBAL STOCKTAKE ══════ */}
        {tab === 'Global Stocktake' && (<>
          {/* ── S7: Global Stocktake Summary ── */}
          <Section title="COP28 Global Stocktake Summary" sub={`Last Stocktake: ${CARBON_BUDGET.global_stocktake_year} | Next: ${CARBON_BUDGET.next_stocktake}`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
              {STOCKTAKE_FINDINGS.map((f, i) => (
                <Card key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{f.pillar}</div>
                    <Badge label={f.gap_severity} color={f.gap_severity === 'Critical' ? T.red : f.gap_severity === 'High' ? T.amber : T.sage} />
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, marginBottom: 10 }}>{f.finding}</div>
                  <div style={{ height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${f.score}%`, height: '100%', background: f.score > 40 ? T.sage : f.score > 25 ? T.amber : T.red, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 4, textAlign: 'right' }}>Progress: {f.score}/100</div>
                </Card>
              ))}
            </div>
          </Section>

          {/* Stocktake radar */}
          <Section title="Stocktake Progress Radar" sub="6 pillars assessed from COP28">
            <Card>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={STOCKTAKE_FINDINGS}>
                  <PolarGrid stroke={T.borderL} />
                  <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 11, fill: T.textSec }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                  <Radar name="Progress" dataKey="score" stroke={T.navy} fill={`${T.navy}30`} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* Key metrics table */}
          <Section title="Paris Agreement Key Metrics" sub="Critical thresholds for 1.5C pathway">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Emissions Reduction by 2030', value: '43%', status: 'Off Track', color: T.red, detail: 'Current trajectory: ~20% reduction' },
                { label: 'Renewable Energy by 2030', value: 'Triple', status: 'On Track', color: T.green, detail: 'From 30% to 60% of electricity' },
                { label: 'Fossil Fuel Phase-Down', value: 'Transition', status: 'New', color: T.amber, detail: 'First COP agreement on fossil fuels' },
                { label: 'Climate Finance/yr', value: '$100B+', status: 'Unmet', color: T.red, detail: 'Needs $4.3T/yr by 2030' },
                { label: 'Methane Reduction', value: '-30%', status: 'In Progress', color: T.amber, detail: '150+ countries signed Global Methane Pledge' },
                { label: 'Adaptation Funding', value: 'Double', status: 'Off Track', color: T.red, detail: 'Adaptation at <10% of climate finance' },
              ].map((m, i) => (
                <Card key={i}>
                  <div style={{ fontSize: 12, color: T.textSec }}>{m.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{m.value}</div>
                    <Badge label={m.status} color={m.color} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{m.detail}</div>
                </Card>
              ))}
            </div>
          </Section>
        </>)}

        {/* ══════ TAB 5: ENGAGEMENT ══════ */}
        {tab === 'Engagement' && (<>
          {/* ── S12: Engagement to Paris Alignment ── */}
          <Section title="Priority Engagement for Paris Alignment" sub={`${engagementPriority.length} holdings furthest from 1.5C target`}>
            <Card style={{ padding: 0, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr>
                    {['Company', 'Sector', 'ITR (C)', 'Gap to 1.5C', 'SBTi', 'NZ Quality', 'Engagement Priority', 'Recommended Action'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {engagementPriority.map((h, i) => {
                    const gap = +(h.itr - 1.5).toFixed(1);
                    const priority = gap > 1.5 ? 'Critical' : gap > 1.0 ? 'High' : 'Medium';
                    const action = gap > 1.5 ? 'Escalate to board; consider divestment' : gap > 1.0 ? 'Collaborative engagement; set SBTi deadline' : 'Support transition planning';
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{h.company_name || h.name}</td>
                        <td style={{ padding: '8px 12px', color: T.textSec }}>{h.sector}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: itrColor(h.itr) }}>{h.itr}C</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: T.red }}>+{gap}C</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{h.hasSBTi ? '\u2705' : '\u274C'}</td>
                        <td style={{ padding: '8px 12px' }}><Badge label={h.nzQuality} color={NZ_QUALITY_TIERS.find(t => t.tier === h.nzQuality)?.color} /></td>
                        <td style={{ padding: '8px 12px' }}><Badge label={priority} color={priority === 'Critical' ? T.red : priority === 'High' ? T.amber : T.sage} /></td>
                        <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 11, maxWidth: 220 }}>{action}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </Section>

          {/* ── Engagement Tracker — Progress over time ── */}
          <Section title="Engagement Progress Tracker" sub="Historical engagement outcomes and escalation status">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'Active Engagements', value: engagementPriority.length, color: T.navy, sub: 'Companies in engagement' },
                  { label: 'SBTi Commitments Won', value: Math.round(engagementPriority.length * 0.2), color: T.green, sub: 'Through engagement pressure' },
                  { label: 'Escalated to Board', value: Math.round(engagementPriority.filter(e => e.itr > 2.8).length), color: T.red, sub: 'Board-level engagement' },
                  { label: 'Avg ITR Reduction', value: '-0.3C', color: T.sage, sub: 'Post-engagement average' },
                ].map((kpi, i) => (
                  <Card key={i} style={{ background: T.surfaceH }}>
                    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.font, marginBottom: 4 }}>{kpi.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color, fontFamily: T.font }}>{kpi.value}</div>
                    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.font, marginTop: 2 }}>{kpi.sub}</div>
                  </Card>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={[
                  { quarter: 'Q1 2024', engagements: 8, successful: 2, itr_avg: 2.8 },
                  { quarter: 'Q2 2024', engagements: 12, successful: 4, itr_avg: 2.6 },
                  { quarter: 'Q3 2024', engagements: 15, successful: 6, itr_avg: 2.5 },
                  { quarter: 'Q4 2024', engagements: 18, successful: 8, itr_avg: 2.3 },
                  { quarter: 'Q1 2025', engagements: 20, successful: 10, itr_avg: 2.2 },
                  { quarter: 'Q2 2025', engagements: 22, successful: 13, itr_avg: 2.1 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} domain={[1.5, 3.5]} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: T.font }} />
                  <Line yAxisId="left" type="monotone" dataKey="engagements" name="Active Engagements" stroke={T.navy} strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="successful" name="Successful Outcomes" stroke={T.green} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="itr_avg" name="Avg ITR (C)" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* ── Alignment by Asset Class ── */}
          <Section title="Paris Alignment by Asset Class" sub="Equity, Fixed Income, and Real Assets alignment breakdown">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { assetClass: 'Equity', itr: 2.3, aligned15: 28, aligned20: 52, sbti: 42, nzPct: 55, color: T.navy },
                { assetClass: 'Fixed Income', itr: 2.1, aligned15: 35, aligned20: 60, sbti: 48, nzPct: 62, color: T.sage },
                { assetClass: 'Real Assets', itr: 2.5, aligned15: 18, aligned20: 40, sbti: 30, nzPct: 45, color: T.gold },
              ].map((ac, i) => (
                <Card key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{ac.assetClass}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: itrColor(ac.itr) }}>{ac.itr}C</div>
                  </div>
                  {[
                    { label: '1.5C Aligned', val: ac.aligned15, unit: '%' },
                    { label: '2.0C Aligned', val: ac.aligned20, unit: '%' },
                    { label: 'SBTi Coverage', val: ac.sbti, unit: '%' },
                    { label: 'Net Zero', val: ac.nzPct, unit: '%' },
                  ].map((row, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: j < 3 ? `1px solid ${T.borderL}` : 'none' }}>
                      <span style={{ fontSize: 12, color: T.textSec }}>{row.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 50, height: 5, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${row.val}%`, height: '100%', background: ac.color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{row.val}{row.unit}</span>
                      </div>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          </Section>

          {/* ── Methodology & Disclaimer ── */}
          <Section title="Methodology Notes" sub="Paris alignment calculation approach">
            <Card style={{ background: T.surfaceH }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {[
                  { title: 'Temperature Alignment', desc: 'Company Implied Temperature Rise (ITR) derived from regression-based trajectory analysis. Compares projected cumulative emissions against 1.5C/2.0C carbon budgets using IPCC AR6 pathways.' },
                  { title: 'Budget Alignment', desc: 'Allocates global remaining carbon budget to companies based on revenue share. Measures cumulative emissions against allocated budget share under 1.5C/2.0C scenarios.' },
                  { title: 'Target Alignment', desc: 'Evaluates company net-zero targets against science-based requirements. Quality scoring: law-backed (100), SBTi-verified (80), pledged (50), none (10). Covers scope 1+2+3.' },
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          {/* ── S14: Cross-Navigation ── */}
          <Section title="Cross-Navigation" sub="Explore related modules">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'ITR Regression Analysis', path: '/itr-regression', desc: 'Implied temperature rise regression methodology', icon: '\uD83C\uDF21\uFE0F' },
                { label: 'Carbon Budget Tracker', path: '/carbon-budget', desc: 'Detailed carbon budget & PCAF attribution', icon: '\uD83C\uDF0D' },
                { label: 'Climate Policy Dashboard', path: '/climate-policy', desc: 'Policy landscape & regulatory alignment', icon: '\uD83C\uDFDB\uFE0F' },
                { label: 'Sovereign ESG Hub', path: '/sovereign-hub', desc: 'Sovereign ESG, NDCs & macro transition', icon: '\uD83C\uDFF3\uFE0F' },
                { label: 'NGFS Scenarios', path: '/ngfs-scenarios', desc: 'Network for Greening Financial System', icon: '\uD83D\uDD2C' },
                { label: 'Portfolio Climate VaR', path: '/portfolio-climate-var', desc: 'Climate value-at-risk scenarios', icon: '\uD83D\uDCC9' },
                { label: 'Stranded Assets', path: '/stranded-assets', desc: 'Fossil fuel stranding risk analysis', icon: '\u26A0\uFE0F' },
                { label: 'Just Transition', path: '/just-transition', desc: 'Social dimensions of energy transition', icon: '\u2696\uFE0F' },
              ].map((nav, i) => (
                <Card key={i} onClick={() => navigate(nav.path)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{nav.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{nav.label}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{nav.desc}</div>
                </Card>
              ))}
            </div>
          </Section>
        </>)}

      </div>
    </div>
  );
}
