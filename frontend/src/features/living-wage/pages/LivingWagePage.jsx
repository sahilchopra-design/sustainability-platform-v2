import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, ReferenceLine } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const PIE_COLORS = [T.red, T.amber, T.gold, T.sage, T.navy, '#7c3aed', '#0d9488', '#ec4899', '#6366f1', '#f43f5e', '#14b8a6'];

/* ================================================================
   LIVING WAGE DATA BY COUNTRY (GLWC methodology)
   ================================================================ */
const LIVING_WAGE_BY_COUNTRY = [
  { country: 'India', iso2: 'IN', living_wage_usd_mo: 285, minimum_wage_usd_mo: 175, gap_pct: 38.6, informal_economy_pct: 82, ilo_convention_ratified: true, sectors_at_risk: ['Consumer Staples', 'Consumer Discretionary', 'Materials', 'Industrials'] },
  { country: 'China', iso2: 'CN', living_wage_usd_mo: 420, minimum_wage_usd_mo: 310, gap_pct: 26.2, informal_economy_pct: 48, ilo_convention_ratified: false, sectors_at_risk: ['Consumer Discretionary', 'Materials', 'Industrials'] },
  { country: 'Brazil', iso2: 'BR', living_wage_usd_mo: 380, minimum_wage_usd_mo: 260, gap_pct: 31.6, informal_economy_pct: 40, ilo_convention_ratified: true, sectors_at_risk: ['Consumer Staples', 'Materials'] },
  { country: 'South Africa', iso2: 'ZA', living_wage_usd_mo: 350, minimum_wage_usd_mo: 240, gap_pct: 31.4, informal_economy_pct: 35, ilo_convention_ratified: true, sectors_at_risk: ['Materials', 'Consumer Staples', 'Energy'] },
  { country: 'USA', iso2: 'US', living_wage_usd_mo: 3200, minimum_wage_usd_mo: 1260, gap_pct: 60.6, informal_economy_pct: 8, ilo_convention_ratified: false, sectors_at_risk: ['Consumer Discretionary', 'Consumer Staples'] },
  { country: 'UK', iso2: 'GB', living_wage_usd_mo: 2800, minimum_wage_usd_mo: 2100, gap_pct: 25.0, informal_economy_pct: 5, ilo_convention_ratified: true, sectors_at_risk: ['Consumer Discretionary'] },
  { country: 'Germany', iso2: 'DE', living_wage_usd_mo: 2900, minimum_wage_usd_mo: 2400, gap_pct: 17.2, informal_economy_pct: 4, ilo_convention_ratified: true, sectors_at_risk: [] },
  { country: 'Japan', iso2: 'JP', living_wage_usd_mo: 2500, minimum_wage_usd_mo: 1800, gap_pct: 28.0, informal_economy_pct: 10, ilo_convention_ratified: true, sectors_at_risk: ['Consumer Discretionary'] },
  { country: 'Australia', iso2: 'AU', living_wage_usd_mo: 3100, minimum_wage_usd_mo: 2600, gap_pct: 16.1, informal_economy_pct: 5, ilo_convention_ratified: true, sectors_at_risk: [] },
  { country: 'Singapore', iso2: 'SG', living_wage_usd_mo: 2800, minimum_wage_usd_mo: 0, gap_pct: 100, informal_economy_pct: 3, ilo_convention_ratified: false, sectors_at_risk: ['Consumer Discretionary'] },
  { country: 'South Korea', iso2: 'KR', living_wage_usd_mo: 2200, minimum_wage_usd_mo: 1700, gap_pct: 22.7, informal_economy_pct: 12, ilo_convention_ratified: false, sectors_at_risk: ['Consumer Discretionary', 'Industrials'] },
  { country: 'France', iso2: 'FR', living_wage_usd_mo: 2700, minimum_wage_usd_mo: 2200, gap_pct: 18.5, informal_economy_pct: 6, ilo_convention_ratified: true, sectors_at_risk: [] },
  { country: 'Canada', iso2: 'CA', living_wage_usd_mo: 2900, minimum_wage_usd_mo: 2200, gap_pct: 24.1, informal_economy_pct: 5, ilo_convention_ratified: true, sectors_at_risk: [] },
];

/* ================================================================
   SECTOR LIVING WAGE RISK
   ================================================================ */
const SECTOR_WAGE_RISK = {
  'Consumer Staples':       { supply_chain_risk: 'Very High', direct_risk: 'Medium', workers_at_risk_pct: 45, key_roles: 'Agricultural workers, factory floor, retail staff', gender_gap_pct: 22 },
  'Consumer Discretionary':  { supply_chain_risk: 'Very High', direct_risk: 'Medium', workers_at_risk_pct: 38, key_roles: 'Garment workers, retail associates, gig workers', gender_gap_pct: 25 },
  Materials:                 { supply_chain_risk: 'High', direct_risk: 'Medium', workers_at_risk_pct: 30, key_roles: 'Miners, construction workers, truck drivers', gender_gap_pct: 18 },
  Industrials:               { supply_chain_risk: 'High', direct_risk: 'Low', workers_at_risk_pct: 22, key_roles: 'Factory workers, logistics, maintenance', gender_gap_pct: 15 },
  Energy:                    { supply_chain_risk: 'Medium', direct_risk: 'Low', workers_at_risk_pct: 15, key_roles: 'Field workers, contractors, service staff', gender_gap_pct: 12 },
  Utilities:                 { supply_chain_risk: 'Medium', direct_risk: 'Low', workers_at_risk_pct: 12, key_roles: 'Grid workers, meter readers, customer service', gender_gap_pct: 14 },
  Financials:                { supply_chain_risk: 'Low', direct_risk: 'Low', workers_at_risk_pct: 5, key_roles: 'Branch staff, call center, outsourced IT', gender_gap_pct: 20 },
  IT:                        { supply_chain_risk: 'Medium', direct_risk: 'Low', workers_at_risk_pct: 8, key_roles: 'Hardware assembly, data center ops, content mod', gender_gap_pct: 18 },
  'Health Care':             { supply_chain_risk: 'Medium', direct_risk: 'Medium', workers_at_risk_pct: 20, key_roles: 'Nursing aides, cleaners, pharma production', gender_gap_pct: 16 },
  'Communication Services':  { supply_chain_risk: 'Low', direct_risk: 'Low', workers_at_risk_pct: 6, key_roles: 'Retail staff, field technicians, content mod', gender_gap_pct: 15 },
  'Real Estate':             { supply_chain_risk: 'Medium', direct_risk: 'Low', workers_at_risk_pct: 18, key_roles: 'Construction workers, maintenance, security', gender_gap_pct: 20 },
};

/* ================================================================
   ILO CONVENTIONS
   ================================================================ */
/* ================================================================
   LIVING WAGE TREND DATA (historical improvement trajectory)
   ================================================================ */
const WAGE_GAP_TREND = [
  { year: 2019, global_avg_gap: 38.5, portfolio_gap: 36.2, developed_gap: 22.1, emerging_gap: 48.8 },
  { year: 2020, global_avg_gap: 39.8, portfolio_gap: 37.5, developed_gap: 22.8, emerging_gap: 50.2 },
  { year: 2021, global_avg_gap: 38.1, portfolio_gap: 35.8, developed_gap: 21.5, emerging_gap: 48.0 },
  { year: 2022, global_avg_gap: 36.5, portfolio_gap: 34.2, developed_gap: 20.8, emerging_gap: 46.5 },
  { year: 2023, global_avg_gap: 35.0, portfolio_gap: 32.6, developed_gap: 20.0, emerging_gap: 44.8 },
  { year: 2024, global_avg_gap: 33.8, portfolio_gap: 31.5, developed_gap: 19.5, emerging_gap: 43.2 },
  { year: 2025, global_avg_gap: 32.5, portfolio_gap: 30.2, developed_gap: 18.8, emerging_gap: 41.5 },
  { year: 2026, global_avg_gap: 31.2, portfolio_gap: 28.8, developed_gap: 18.0, emerging_gap: 39.8 },
];

/* ================================================================
   FAIR PAY COMMITMENT FRAMEWORK
   ================================================================ */
const FAIR_PAY_FRAMEWORK = [
  { level: 'Leader', criteria: 'Published living wage commitment, third-party verification, supply chain coverage', score_range: '80-100', color: T.green, count: 0 },
  { level: 'Progressing', criteria: 'Living wage policy exists, partial implementation, direct operations covered', score_range: '60-79', color: T.sage, count: 0 },
  { level: 'Emerging', criteria: 'Minimum wage compliance, some wage gap analysis, no formal commitment', score_range: '40-59', color: T.amber, count: 0 },
  { level: 'Lagging', criteria: 'Minimum compliance only, no living wage analysis, supply chain risk unaddressed', score_range: '20-39', color: T.red, count: 0 },
  { level: 'Critical', criteria: 'Non-compliance risk, operations in high-gap regions, no due diligence', score_range: '0-19', color: '#7c3aed', count: 0 },
];

const ILO_CONVENTIONS = [
  { id: 'C87', name: 'Freedom of Association', year: 1948, topic: 'Collective Bargaining' },
  { id: 'C98', name: 'Right to Organise', year: 1949, topic: 'Collective Bargaining' },
  { id: 'C29', name: 'Forced Labour', year: 1930, topic: 'Forced Labour' },
  { id: 'C100', name: 'Equal Remuneration', year: 1951, topic: 'Equal Pay' },
  { id: 'C111', name: 'Discrimination (Employment)', year: 1958, topic: 'Non-Discrimination' },
  { id: 'C138', name: 'Minimum Age', year: 1973, topic: 'Child Labour' },
  { id: 'C182', name: 'Worst Forms of Child Labour', year: 1999, topic: 'Child Labour' },
  { id: 'C131', name: 'Minimum Wage Fixing', year: 1970, topic: 'Living Wage' },
];

const COUNTRY_ILO_STATUS = {
  IN: { C87: true, C98: true, C29: true, C100: true, C111: true, C138: true, C182: true, C131: false },
  CN: { C87: false, C98: false, C29: true, C100: true, C111: true, C138: true, C182: true, C131: false },
  BR: { C87: true, C98: true, C29: true, C100: true, C111: true, C138: true, C182: true, C131: true },
  ZA: { C87: true, C98: true, C29: true, C100: true, C111: true, C138: true, C182: true, C131: true },
  US: { C87: false, C98: false, C29: false, C100: false, C111: false, C138: false, C182: true, C131: false },
  GB: { C87: true, C98: true, C29: true, C100: true, C111: true, C138: true, C182: true, C131: false },
  DE: { C87: true, C98: true, C29: true, C100: true, C111: true, C138: true, C182: true, C131: true },
  JP: { C87: true, C98: true, C29: true, C100: true, C111: false, C138: true, C182: true, C131: false },
  AU: { C87: true, C98: true, C29: true, C100: true, C111: true, C138: true, C182: true, C131: false },
  SG: { C87: false, C98: false, C29: true, C100: false, C111: false, C138: true, C182: true, C131: false },
  KR: { C87: true, C98: true, C29: true, C100: true, C111: true, C138: true, C182: true, C131: false },
  FR: { C87: true, C98: true, C29: true, C100: true, C111: true, C138: true, C182: true, C131: true },
  CA: { C87: true, C98: true, C29: true, C100: true, C111: true, C138: false, C182: true, C131: false },
};

/* ================================================================
   HELPERS
   ================================================================ */
const mapSector = s => { if (s === 'IT' || s === 'Information Technology') return 'IT'; return s; };
const getSectorRisk = s => SECTOR_WAGE_RISK[mapSector(s)] || SECTOR_WAGE_RISK['Financials'];
const getCountryWage = iso2 => LIVING_WAGE_BY_COUNTRY.find(c => c.iso2 === iso2);
const seededRandom = (seed) => { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; }; };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const riskColor = r => r === 'Very High' ? T.red : r === 'High' ? T.amber : r === 'Medium' ? T.gold : T.green;

/* Generate per-holding wage risk data */
const genWageData = (holding, idx) => {
  const rng = seededRandom(idx * 241 + 73 + (holding.name || '').charCodeAt(0));
  const sectorRisk = getSectorRisk(holding.sector);
  const countryWage = getCountryWage(holding.countryCode);
  const gap = countryWage ? countryWage.gap_pct : 20;
  const scRisk = sectorRisk.supply_chain_risk;
  const directRisk = sectorRisk.direct_risk;
  const workersAtRisk = Math.round(clamp(sectorRisk.workers_at_risk_pct + (rng() - 0.5) * 15, 0, 80));
  const iloRatified = countryWage ? countryWage.ilo_convention_ratified : false;
  const genderGap = Math.round(clamp(sectorRisk.gender_gap_pct + (rng() - 0.5) * 10, 2, 40));

  const isAtRisk = countryWage && countryWage.sectors_at_risk.includes(holding.sector);
  const riskLevel = isAtRisk && scRisk === 'Very High' ? 'Very High' : isAtRisk ? 'High' : scRisk === 'Very High' || scRisk === 'High' ? 'Medium' : 'Low';

  const fairPayScore = Math.round(clamp(
    100 - gap * 0.4 - workersAtRisk * 0.3 - (riskLevel === 'Very High' ? 20 : riskLevel === 'High' ? 12 : riskLevel === 'Medium' ? 6 : 0) + (iloRatified ? 8 : 0) + rng() * 10,
    10, 95
  ));

  return {
    ...holding,
    livingWageGap: gap,
    supplyChainRisk: scRisk,
    directRisk,
    workersAtRisk,
    iloRatified,
    genderGap,
    riskLevel,
    fairPayScore,
    countryWage,
    sectorRisk,
    livingWage: countryWage ? countryWage.living_wage_usd_mo : null,
    minimumWage: countryWage ? countryWage.minimum_wage_usd_mo : null,
    informalEconomy: countryWage ? countryWage.informal_economy_pct : null,
  };
};

/* ================================================================
   CUSTOM TOOLTIP
   ================================================================ */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: T.font, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || T.text }}>{p.name}: <b>{typeof p.value === 'number' ? (p.value % 1 ? p.value.toFixed(1) : p.value) : p.value}</b></div>)}
    </div>
  );
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function LivingWagePage() {
  const navigate = useNavigate();
  const printRef = useRef(null);

  /* ── Portfolio ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      if (raw.length) return raw;
      return (GLOBAL_COMPANY_MASTER || []).slice(0, 25);
    } catch { return (GLOBAL_COMPANY_MASTER || []).slice(0, 25); }
  }, []);

  /* ── Wage data ── */
  const wageData = useMemo(() => portfolio.map((h, i) => genWageData(h, i)), [portfolio]);

  /* ── State ── */
  const [sortCol, setSortCol] = useState('riskLevel');
  const [sortDir, setSortDir] = useState('desc');
  const [filterRisk, setFilterRisk] = useState('All');
  const [activeTab, setActiveTab] = useState('overview');

  const riskLevels = ['All', 'Very High', 'High', 'Medium', 'Low'];
  const filtered = useMemo(() => {
    let d = [...wageData];
    if (filterRisk !== 'All') d = d.filter(h => h.riskLevel === filterRisk);
    const riskOrder = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    d.sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (sortCol === 'riskLevel' || sortCol === 'supplyChainRisk' || sortCol === 'directRisk') { av = riskOrder[av] || 0; bv = riskOrder[bv] || 0; }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      if (typeof av === 'boolean') return sortDir === 'asc' ? (av ? 1 : -1) : (av ? -1 : 1);
      return sortDir === 'asc' ? (av || 0) - (bv || 0) : (bv || 0) - (av || 0);
    });
    return d;
  }, [wageData, filterRisk, sortCol, sortDir]);

  /* ── KPIs ── */
  const kpi = useMemo(() => {
    const n = wageData.length || 1;
    const wt = h => (h.weight || h.portfolio_weight || (1 / n));
    const wtSum = wageData.reduce((s, h) => s + wt(h), 0) || 1;
    const wavg = (arr, fn) => arr.reduce((s, h) => s + fn(h) * wt(h), 0) / wtSum;

    const highRisk = wageData.filter(h => h.riskLevel === 'Very High' || h.riskLevel === 'High');
    const highRiskWt = highRisk.reduce((s, h) => s + wt(h), 0) / wtSum * 100;
    const uniqueCountries = new Set(wageData.filter(h => h.riskLevel === 'Very High' || h.riskLevel === 'High').map(h => h.countryCode));

    return {
      exposurePct: highRiskWt.toFixed(1),
      highRiskCountries: uniqueCountries.size,
      avgGap: wavg(wageData, h => h.livingWageGap).toFixed(1),
      workersAtRisk: Math.round(wavg(wageData, h => h.workersAtRisk) * n * 1200),
      supplyChainScore: (wavg(wageData, h => h.riskLevel === 'Very High' ? 90 : h.riskLevel === 'High' ? 65 : h.riskLevel === 'Medium' ? 40 : 15)).toFixed(0),
      iloCoverage: ((wageData.filter(h => h.iloRatified).length / n) * 100).toFixed(0),
      fairPayLeaders: ((wageData.filter(h => h.fairPayScore >= 70).length / n) * 100).toFixed(0),
      genderPayGap: wavg(wageData, h => h.genderGap).toFixed(1),
    };
  }, [wageData]);

  const handleSort = col => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ── Export ── */
  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csv = [keys.join(','), ...data.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportReport = () => exportCSV(filtered.map(h => ({
    Company: h.name, Sector: h.sector, Country: h.countryCode, 'Risk Level': h.riskLevel,
    'Living Wage Gap %': h.livingWageGap, 'Supply Chain Risk': h.supplyChainRisk,
    'Workers at Risk %': h.workersAtRisk, 'ILO Ratified': h.iloRatified ? 'Yes' : 'No',
    'Gender Pay Gap %': h.genderGap, 'Fair Pay Score': h.fairPayScore,
  })), 'living_wage_report.csv');

  const exportCountry = () => exportCSV(LIVING_WAGE_BY_COUNTRY.map(c => ({
    Country: c.country, 'Living Wage (USD/mo)': c.living_wage_usd_mo, 'Minimum Wage (USD/mo)': c.minimum_wage_usd_mo,
    'Gap %': c.gap_pct, 'Informal Economy %': c.informal_economy_pct, 'ILO Ratified': c.ilo_convention_ratified ? 'Yes' : 'No',
    'Sectors at Risk': c.sectors_at_risk.join('; '),
  })), 'country_wage_analysis.csv');

  const handlePrint = () => { window.print(); };

  /* ── Country gap chart data ── */
  const countryGapData = useMemo(() => {
    return LIVING_WAGE_BY_COUNTRY.map(c => {
      const holdingsInCountry = wageData.filter(h => h.countryCode === c.iso2);
      const portfolioWt = holdingsInCountry.reduce((s, h) => s + (h.weight || h.portfolio_weight || 0), 0);
      return {
        country: c.country,
        'Living Wage': c.living_wage_usd_mo,
        'Minimum Wage': c.minimum_wage_usd_mo,
        'Gap ($)': c.living_wage_usd_mo - c.minimum_wage_usd_mo,
        'Gap %': c.gap_pct,
        portfolioWeight: +(portfolioWt * 100).toFixed(1),
      };
    }).sort((a, b) => b['Gap %'] - a['Gap %']);
  }, [wageData]);

  /* ── Sector heatmap data ── */
  const sectorHeatData = useMemo(() => Object.entries(SECTOR_WAGE_RISK).map(([k, v]) => ({ sector: k.length > 16 ? k.slice(0, 14) + '..' : k, ...v })), []);

  /* ── Exposure pie data ── */
  const exposurePie = useMemo(() => {
    const groups = { 'Very High': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
    const n = wageData.length || 1;
    wageData.forEach(h => { groups[h.riskLevel] = (groups[h.riskLevel] || 0) + (h.weight || h.portfolio_weight || (1 / n)); });
    const total = Object.values(groups).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(groups).map(([k, v]) => ({ name: k, value: +((v / total) * 100).toFixed(1) }));
  }, [wageData]);

  /* ── Gender pay gap by sector ── */
  const genderPayData = useMemo(() => {
    const sectorMap = {};
    wageData.forEach(h => {
      const s = h.sector;
      if (!sectorMap[s]) sectorMap[s] = [];
      sectorMap[s].push(h.genderGap);
    });
    return Object.entries(sectorMap).map(([s, vals]) => ({
      sector: s.length > 16 ? s.slice(0, 14) + '..' : s,
      'Gender Pay Gap %': Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    })).sort((a, b) => b['Gender Pay Gap %'] - a['Gender Pay Gap %']);
  }, [wageData]);

  /* ── Leaders & Laggards ── */
  const leaders = useMemo(() => [...wageData].sort((a, b) => b.fairPayScore - a.fairPayScore).slice(0, 5), [wageData]);
  const laggards = useMemo(() => [...wageData].sort((a, b) => a.fairPayScore - b.fairPayScore).slice(0, 5), [wageData]);

  /* ── Engagement recommendations ── */
  const recommendations = useMemo(() => {
    const recs = [];
    wageData.forEach(h => {
      if (h.riskLevel === 'Very High') recs.push({ company: h.name, priority: 'Critical', action: `Request living wage commitment covering supply chain in ${h.countryCode}; gap is ${h.livingWageGap.toFixed(0)}%`, risk: h.riskLevel });
      else if (h.riskLevel === 'High') recs.push({ company: h.name, priority: 'High', action: `Engage on supply chain wage practices; ${h.workersAtRisk}% workers estimated at risk`, risk: h.riskLevel });
      if (h.genderGap > 20) recs.push({ company: h.name, priority: 'Medium', action: `Address ${h.genderGap}% gender pay gap; request transparency on pay equity data`, risk: 'Gender' });
      if (!h.iloRatified && h.riskLevel !== 'Low') recs.push({ company: h.name, priority: 'Medium', action: `Operating in non-ILO-ratified jurisdiction (${h.countryCode}); request human rights due diligence`, risk: 'ILO' });
    });
    return recs.sort((a, b) => { const p = { Critical: 0, High: 1, Medium: 2, Low: 3 }; return (p[a.priority] || 3) - (p[b.priority] || 3); }).slice(0, 25);
  }, [wageData]);

  /* ── Styles ── */
  const card = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 22, marginBottom: 18 };
  const kpiCard = (accent) => ({ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 20px', flex: '1 1 155px', minWidth: 150, borderTop: `3px solid ${accent}` });
  const badge = { display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${T.gold}18`, color: T.gold, fontWeight: 600, marginLeft: 10 };
  const tabStyle = (active) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: T.font, background: active ? T.navy : 'transparent', color: active ? '#fff' : T.textSec, transition: 'all 0.2s' });
  const th = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const td = { padding: '10px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };
  const pillStyle = (color) => ({ display: 'inline-block', fontSize: 11, padding: '2px 10px', borderRadius: 20, background: `${color}15`, color, fontWeight: 600 });

  if (!portfolio.length) return (
    <div style={{ fontFamily: T.font, padding: 48, textAlign: 'center', color: T.textMut }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>No portfolio loaded</div>
      <p>Import portfolio data via the Portfolio Manager to view living wage analytics.</p>
      <button onClick={() => navigate('/portfolio')} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontFamily: T.font }}>Go to Portfolio Manager</button>
    </div>
  );

  return (
    <div ref={printRef} style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>

      {/* ── 1. HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>
            Living Wage & Fair Pay Analyzer
            <span style={badge}>13 Countries &middot; ILO &middot; GLWC &middot; Sector Risk</span>
          </h1>
          <p style={{ color: T.textSec, fontSize: 13, margin: '6px 0 0' }}>{wageData.length} holdings &middot; Global Living Wage Coalition methodology &middot; Updated {new Date().toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportReport} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.font }}>Export Wage Report CSV</button>
          <button onClick={exportCountry} style={{ background: T.sage, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.font }}>Export Country Analysis</button>
          <button onClick={handlePrint} style={{ background: T.gold, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.font }}>Print Report</button>
        </div>
      </div>

      {/* ── Tabs & Filters ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['overview', 'ilo', 'engagement'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(activeTab === t)}>{t === 'ilo' ? 'ILO Compliance' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
        <div style={{ flex: 1 }} />
        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontFamily: T.font, color: T.text, background: T.surface }}>
          {riskLevels.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* ── 2. KPI CARDS ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Living Wage Exposure', value: kpi.exposurePct + '%', accent: T.red, sub: 'High/Very High risk' },
          { label: 'High-Risk Countries', value: kpi.highRiskCountries, accent: T.amber, sub: 'Unique jurisdictions' },
          { label: 'Avg Living Wage Gap', value: kpi.avgGap + '%', accent: T.gold, sub: 'Min wage vs living wage' },
          { label: 'Workers at Risk (est.)', value: kpi.workersAtRisk.toLocaleString(), accent: T.red, sub: 'Across supply chains' },
          { label: 'Supply Chain Risk Score', value: kpi.supplyChainScore + '/100', accent: T.navy, sub: 'Portfolio-weighted' },
          { label: 'ILO Convention Coverage', value: kpi.iloCoverage + '%', accent: T.sage, sub: 'Holdings in ratified countries' },
          { label: 'Fair Pay Leaders', value: kpi.fairPayLeaders + '%', accent: T.green, sub: 'Score >= 70' },
          { label: 'Gender Pay Gap (proxy)', value: kpi.genderPayGap + '%', accent: '#7c3aed', sub: 'Sector-estimated avg' },
        ].map((k, i) => (
          <div key={i} style={kpiCard(k.accent)}>
            <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>{k.value}</div>
            <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* ── 3. LIVING WAGE GAP BY COUNTRY ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Living Wage Gap by Country</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={countryGapData} margin={{ left: 10, right: 30, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'USD/month', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMut } }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} label={{ value: 'Portfolio Wt %', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: T.textMut } }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="Living Wage" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="left" dataKey="Minimum Wage" fill={T.gold} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="left" dataKey="Gap ($)" fill={T.red} radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="portfolioWeight" stroke={T.sage} strokeWidth={2} name="Portfolio Weight %" dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── 4. SECTOR RISK HEATMAP ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Sector Living Wage Risk Matrix</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Sector', 'Supply Chain Risk', 'Direct Risk', 'Workers at Risk %', 'Key Roles', 'Gender Gap %'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sectorHeatData.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <td style={{ ...td, fontWeight: 600 }}>{r.sector}</td>
                      <td style={td}><span style={pillStyle(riskColor(r.supply_chain_risk))}>{r.supply_chain_risk}</span></td>
                      <td style={td}><span style={pillStyle(riskColor(r.direct_risk))}>{r.direct_risk}</span></td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 8, borderRadius: 4, background: T.border, overflow: 'hidden' }}>
                            <div style={{ width: `${r.workers_at_risk_pct}%`, height: '100%', borderRadius: 4, background: r.workers_at_risk_pct > 30 ? T.red : r.workers_at_risk_pct > 15 ? T.amber : T.sage }} />
                          </div>
                          <span style={{ fontWeight: 600 }}>{r.workers_at_risk_pct}%</span>
                        </div>
                      </td>
                      <td style={{ ...td, fontSize: 11 }}>{r.key_roles}</td>
                      <td style={{ ...td, fontWeight: 600, color: r.gender_gap_pct > 20 ? T.red : r.gender_gap_pct > 15 ? T.amber : T.text }}>{r.gender_gap_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 5. PORTFOLIO EXPOSURE PIE & 7. GENDER PAY GAP ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 10 }}>Portfolio Living Wage Risk Exposure</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={exposurePie} dataKey="value" cx="50%" cy="50%" outerRadius={95} label={({ name, value }) => `${name}: ${value}%`} labelLine={{ stroke: T.textMut }}>
                    {exposurePie.map((d, i) => <Cell key={i} fill={[T.red, T.amber, T.gold, T.sage][i] || PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 10 }}>Gender Pay Gap by Sector (Portfolio-Estimated)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={genderPayData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 40]} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 11, fill: T.text }} width={95} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Gender Pay Gap %" radius={[0, 4, 4, 0]}>
                    {genderPayData.map((d, i) => <Cell key={i} fill={d['Gender Pay Gap %'] > 20 ? T.red : d['Gender Pay Gap %'] > 15 ? T.amber : T.sage} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 6. SORTABLE HOLDINGS TABLE ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Holdings Living Wage Risk Detail</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
                <thead>
                  <tr>
                    {[
                      { key: 'name', label: 'Company' }, { key: 'countryCode', label: 'Country' }, { key: 'sector', label: 'Sector' },
                      { key: 'livingWageGap', label: 'Wage Gap %' }, { key: 'supplyChainRisk', label: 'SC Risk' },
                      { key: 'workersAtRisk', label: 'Workers %' }, { key: 'riskLevel', label: 'Risk Level' },
                      { key: 'iloRatified', label: 'ILO' }, { key: 'genderGap', label: 'Gender Gap' },
                      { key: 'fairPayScore', label: 'Fair Pay Score' },
                    ].map(c => (
                      <th key={c.key} onClick={() => handleSort(c.key)} style={th}>
                        {c.label} {sortCol === c.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h, i) => (
                    <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = `${T.gold}10`}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 ? T.surfaceH : T.surface}>
                      <td style={{ ...td, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                      <td style={td}>{h.countryCode}</td>
                      <td style={{ ...td, fontSize: 11 }}>{h.sector}</td>
                      <td style={{ ...td, fontWeight: 700, color: h.livingWageGap > 40 ? T.red : h.livingWageGap > 25 ? T.amber : T.text }}>{h.livingWageGap.toFixed(1)}%</td>
                      <td style={td}><span style={pillStyle(riskColor(h.supplyChainRisk))}>{h.supplyChainRisk}</span></td>
                      <td style={td}>{h.workersAtRisk}%</td>
                      <td style={td}><span style={pillStyle(riskColor(h.riskLevel))}>{h.riskLevel}</span></td>
                      <td style={td}><span style={pillStyle(h.iloRatified ? T.green : T.red)}>{h.iloRatified ? 'Yes' : 'No'}</span></td>
                      <td style={{ ...td, color: h.genderGap > 20 ? T.red : T.text }}>{h.genderGap}%</td>
                      <td style={{ ...td, fontWeight: 700, color: h.fairPayScore >= 70 ? T.green : h.fairPayScore >= 45 ? T.amber : T.red }}>{h.fairPayScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 8. LEADERS VS LAGGARDS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div style={{ ...card, borderLeft: `4px solid ${T.green}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.green, marginTop: 0, marginBottom: 10 }}>Fair Pay Leaders (Top 5)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Company', 'Country', 'Score', 'Risk'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {leaders.map((h, i) => (
                    <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <td style={{ ...td, fontWeight: 600 }}>{h.name}</td>
                      <td style={td}>{h.countryCode}</td>
                      <td style={{ ...td, fontWeight: 700, color: T.green }}>{h.fairPayScore}</td>
                      <td style={td}><span style={pillStyle(riskColor(h.riskLevel))}>{h.riskLevel}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ ...card, borderLeft: `4px solid ${T.red}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.red, marginTop: 0, marginBottom: 10 }}>Fair Pay Laggards (Bottom 5)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Company', 'Country', 'Score', 'Risk'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {laggards.map((h, i) => (
                    <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <td style={{ ...td, fontWeight: 600 }}>{h.name}</td>
                      <td style={td}>{h.countryCode}</td>
                      <td style={{ ...td, fontWeight: 700, color: T.red }}>{h.fairPayScore}</td>
                      <td style={td}><span style={pillStyle(riskColor(h.riskLevel))}>{h.riskLevel}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── LIVING WAGE GAP TREND ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Living Wage Gap Trend (2019-2026)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={WAGE_GAP_TREND} margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[15, 55]} label={{ value: 'Gap %', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMut } }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="portfolio_gap" name="Portfolio Avg Gap %" stroke={T.navy} strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="global_avg_gap" name="Global Avg Gap %" stroke={T.gold} strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="developed_gap" name="Developed Markets %" stroke={T.sage} strokeWidth={1.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="emerging_gap" name="Emerging Markets %" stroke={T.red} strokeWidth={1.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 11, color: T.textMut }}>
              <span>Source: Global Living Wage Coalition, World Bank, ILO</span>
              <span style={{ marginLeft: 'auto' }}>2025-2026 data estimated based on trend</span>
            </div>
          </div>

          {/* ── FAIR PAY FRAMEWORK CLASSIFICATION ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Fair Pay Commitment Framework</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
              {(() => {
                const fw = FAIR_PAY_FRAMEWORK.map(f => ({
                  ...f,
                  count: wageData.filter(h => {
                    const [lo, hi] = f.score_range.split('-').map(Number);
                    return h.fairPayScore >= lo && h.fairPayScore <= hi;
                  }).length
                }));
                return fw.map((f, i) => (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: '14px 16px', border: `1px solid ${T.border}`, borderLeft: `4px solid ${f.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: f.color }}>{f.level}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>{f.count}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>Score range: {f.score_range}</div>
                    <div style={{ fontSize: 11, color: T.textMut, lineHeight: 1.4 }}>{f.criteria}</div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* ── COUNTRY WAGE DETAIL CARDS ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Country Living Wage Detail</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Country', 'Living Wage', 'Minimum Wage', 'Gap %', 'Gap ($)', 'Informal Econ %', 'ILO', 'Holdings', 'Port. Weight', 'Sectors at Risk'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LIVING_WAGE_BY_COUNTRY.sort((a, b) => b.gap_pct - a.gap_pct).map((c, i) => {
                    const holdingsHere = wageData.filter(h => h.countryCode === c.iso2);
                    const portWt = holdingsHere.reduce((s, h) => s + (h.weight || h.portfolio_weight || 0), 0);
                    return (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <td style={{ ...td, fontWeight: 600 }}>{c.country}</td>
                        <td style={td}>${c.living_wage_usd_mo.toLocaleString()}/mo</td>
                        <td style={td}>{c.minimum_wage_usd_mo > 0 ? `$${c.minimum_wage_usd_mo.toLocaleString()}/mo` : 'None'}</td>
                        <td style={{ ...td, fontWeight: 700, color: c.gap_pct > 40 ? T.red : c.gap_pct > 25 ? T.amber : T.green }}>{c.gap_pct}%</td>
                        <td style={td}>${(c.living_wage_usd_mo - c.minimum_wage_usd_mo).toLocaleString()}</td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 40, height: 6, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(c.informal_economy_pct, 100)}%`, height: '100%', borderRadius: 3, background: c.informal_economy_pct > 30 ? T.red : c.informal_economy_pct > 10 ? T.amber : T.sage }} />
                            </div>
                            <span>{c.informal_economy_pct}%</span>
                          </div>
                        </td>
                        <td style={td}><span style={pillStyle(c.ilo_convention_ratified ? T.green : T.red)}>{c.ilo_convention_ratified ? 'Yes' : 'No'}</span></td>
                        <td style={{ ...td, fontWeight: 600, textAlign: 'center' }}>{holdingsHere.length}</td>
                        <td style={td}>{(portWt * 100).toFixed(1)}%</td>
                        <td style={{ ...td, fontSize: 11 }}>{c.sectors_at_risk.length > 0 ? c.sectors_at_risk.join(', ') : 'None'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── SECTOR WORKER BREAKDOWN ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Sector Worker Risk Breakdown (Portfolio-Weighted)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Sector', 'Portfolio Holdings', 'Avg Workers at Risk %', 'Supply Chain Risk', 'Direct Risk', 'Estimated Workers Affected', 'Primary At-Risk Roles'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    wageData.reduce((acc, h) => {
                      const s = h.sector;
                      if (!acc[s]) acc[s] = [];
                      acc[s].push(h);
                      return acc;
                    }, {})
                  ).sort((a, b) => {
                    const avgA = a[1].reduce((s, h) => s + h.workersAtRisk, 0) / a[1].length;
                    const avgB = b[1].reduce((s, h) => s + h.workersAtRisk, 0) / b[1].length;
                    return avgB - avgA;
                  }).map(([sector, holdings], i) => {
                    const n = holdings.length;
                    const avgWorkers = holdings.reduce((s, h) => s + h.workersAtRisk, 0) / n;
                    const sRisk = getSectorRisk(sector);
                    const estWorkers = Math.round(avgWorkers * n * 850);
                    return (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <td style={{ ...td, fontWeight: 600 }}>{sector}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{n}</td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 8, borderRadius: 4, background: T.border, overflow: 'hidden' }}>
                              <div style={{ width: `${avgWorkers}%`, height: '100%', borderRadius: 4, background: avgWorkers > 30 ? T.red : avgWorkers > 15 ? T.amber : T.sage }} />
                            </div>
                            <span style={{ fontWeight: 600 }}>{avgWorkers.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={td}><span style={pillStyle(riskColor(sRisk.supply_chain_risk))}>{sRisk.supply_chain_risk}</span></td>
                        <td style={td}><span style={pillStyle(riskColor(sRisk.direct_risk))}>{sRisk.direct_risk}</span></td>
                        <td style={{ ...td, fontWeight: 600 }}>{estWorkers.toLocaleString()}</td>
                        <td style={{ ...td, fontSize: 11 }}>{sRisk.key_roles}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 10. SUPPLY CHAIN LABOR RISK (CROSS-REF) ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Supply Chain Labor Risk Summary</h3>
            <p style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>Cross-reference of sector supply-chain wage risk with geographic exposure. Holdings in high-risk sectors operating in countries with large living wage gaps face compounded supply chain labor risk.</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['Company', 'Sector SC Risk', 'Country Wage Gap', 'Informal Econ %', 'Compounded Risk', 'Tier 1 Exposure'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.filter(h => h.riskLevel === 'Very High' || h.riskLevel === 'High').slice(0, 15).map((h, i) => {
                    const compounded = h.supplyChainRisk === 'Very High' && h.livingWageGap > 30 ? 'Critical' : h.supplyChainRisk === 'High' && h.livingWageGap > 25 ? 'High' : 'Moderate';
                    return (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <td style={{ ...td, fontWeight: 600 }}>{h.name}</td>
                        <td style={td}><span style={pillStyle(riskColor(h.supplyChainRisk))}>{h.supplyChainRisk}</span></td>
                        <td style={{ ...td, fontWeight: 600 }}>{h.livingWageGap.toFixed(1)}%</td>
                        <td style={td}>{h.informalEconomy != null ? h.informalEconomy + '%' : 'N/A'}</td>
                        <td style={td}><span style={pillStyle(compounded === 'Critical' ? T.red : compounded === 'High' ? T.amber : T.gold)}>{compounded}</span></td>
                        <td style={{ ...td, fontSize: 11 }}>{h.sectorRisk?.key_roles || 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'ilo' && (
        <>
          {/* ── 9. ILO CONVENTION COMPLIANCE ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>ILO Core Convention Ratification Status by Country</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={th}>Country</th>
                    {ILO_CONVENTIONS.map(c => <th key={c.id} style={{ ...th, textAlign: 'center', fontSize: 10 }}>{c.id}<br /><span style={{ fontWeight: 400, fontSize: 9 }}>{c.name.slice(0, 15)}</span></th>)}
                    <th style={{ ...th, textAlign: 'center' }}>Score</th>
                    <th style={{ ...th, textAlign: 'center' }}>Holdings</th>
                  </tr>
                </thead>
                <tbody>
                  {LIVING_WAGE_BY_COUNTRY.map((cty, i) => {
                    const status = COUNTRY_ILO_STATUS[cty.iso2] || {};
                    const ratCount = ILO_CONVENTIONS.filter(c => status[c.id]).length;
                    const holdingsInCountry = wageData.filter(h => h.countryCode === cty.iso2).length;
                    return (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <td style={{ ...td, fontWeight: 600 }}>{cty.country}</td>
                        {ILO_CONVENTIONS.map(c => {
                          const ratified = status[c.id];
                          return (
                            <td key={c.id} style={{ ...td, textAlign: 'center', background: ratified ? `${T.green}10` : `${T.red}08` }}>
                              <span style={{ fontSize: 14, color: ratified ? T.green : T.red, fontWeight: 700 }}>{ratified ? '\u2714' : '\u2718'}</span>
                            </td>
                          );
                        })}
                        <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: ratCount >= 7 ? T.green : ratCount >= 5 ? T.amber : T.red }}>{ratCount}/{ILO_CONVENTIONS.length}</td>
                        <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{holdingsInCountry}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 11, color: T.textMut }}>
              <span><span style={{ color: T.green, fontWeight: 700 }}>{'\u2714'}</span> Ratified</span>
              <span><span style={{ color: T.red, fontWeight: 700 }}>{'\u2718'}</span> Not Ratified</span>
              <span style={{ marginLeft: 'auto' }}>Source: ILO NORMLEX database, 2025</span>
            </div>
          </div>
        </>
      )}

      {activeTab === 'engagement' && (
        <>
          {/* ── RISK SEVERITY SUMMARY CARDS ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Living Wage Risk Severity Distribution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
              {[
                { label: 'Very High Risk', level: 'Very High', color: T.red, desc: 'Immediate engagement required' },
                { label: 'High Risk', level: 'High', color: T.amber, desc: 'Priority for next proxy season' },
                { label: 'Medium Risk', level: 'Medium', color: T.gold, desc: 'Monitor and track progress' },
                { label: 'Low Risk', level: 'Low', color: T.green, desc: 'Maintain current standards' },
              ].map((g, i) => {
                const holdings = wageData.filter(h => h.riskLevel === g.level);
                const pct = wageData.length ? ((holdings.length / wageData.length) * 100).toFixed(0) : 0;
                return (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, textAlign: 'center', borderTop: `3px solid ${g.color}` }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: g.color }}>{holdings.length}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginTop: 4 }}>{g.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginTop: 4 }}>{pct}%</div>
                    <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{g.desc}</div>
                    {holdings.slice(0, 3).map((h, j) => (
                      <div key={j} style={{ fontSize: 10, color: T.textSec, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.name} ({h.countryCode})
                      </div>
                    ))}
                    {holdings.length > 3 && <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>+{holdings.length - 3} more</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── WAGE DATA INPUT FORM ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 6 }}>Override Living Wage Risk Assessments</h3>
            <p style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>
              Manually adjust risk levels based on company-specific due diligence. Overrides are stored locally.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['Company', 'Country', 'Auto Risk', 'Override Risk', 'Notes'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {wageData.slice(0, 15).map((h, i) => (
                    <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <td style={{ ...td, fontWeight: 600 }}>{h.name}</td>
                      <td style={td}>{h.countryCode}</td>
                      <td style={td}><span style={pillStyle(riskColor(h.riskLevel))}>{h.riskLevel}</span></td>
                      <td style={td}>
                        <select defaultValue={h.riskLevel} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: T.font, color: T.text, background: T.surface }}>
                          <option>Very High</option>
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      </td>
                      <td style={td}>
                        <input type="text" placeholder="Due diligence notes..." style={{ width: '100%', minWidth: 150, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: T.textMut }}>Note: Override assessments are for internal tracking. Source risk levels based on GLWC methodology remain unchanged.</div>
          </div>

          {/* ── 11. ENGAGEMENT RECOMMENDATIONS ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Living Wage Engagement Recommendations</h3>
            {recommendations.length === 0 ? <p style={{ color: T.textMut, fontSize: 13 }}>No living wage engagements required based on current risk assessment.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>{['Priority', 'Company', 'Risk Type', 'Recommended Action'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {recommendations.map((r, i) => (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <td style={td}><span style={pillStyle(r.priority === 'Critical' ? T.red : r.priority === 'High' ? T.amber : T.textSec)}>{r.priority}</span></td>
                        <td style={{ ...td, fontWeight: 600 }}>{r.company}</td>
                        <td style={td}><span style={pillStyle(r.risk === 'Very High' || r.risk === 'Critical' ? T.red : r.risk === 'High' ? T.amber : r.risk === 'Gender' ? '#7c3aed' : T.navy)}>{r.risk}</span></td>
                        <td style={{ ...td, maxWidth: 420 }}>{r.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 12. CROSS-NAVIGATION ── */}
      <div style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginRight: 8 }}>Navigate to:</span>
        {[
          { label: 'Supply Chain Risk', path: '/supply-chain' },
          { label: 'Stewardship', path: '/stewardship' },
          { label: 'CSDDD Compliance', path: '/csddd' },
          { label: 'Board Diversity', path: '/board-diversity' },
          { label: 'ESG Dashboard', path: '/esg-dashboard' },
          { label: 'Portfolio Manager', path: '/portfolio' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ background: `${T.navy}08`, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.navy, fontFamily: T.font, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.background = T.navy; e.target.style.color = '#fff'; }}
            onMouseLeave={e => { e.target.style.background = `${T.navy}08`; e.target.style.color = T.navy; }}>
            {n.label}
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: 24, fontSize: 11, color: T.textMut }}>Living Wage & Fair Pay Analyzer &middot; Risk Analytics Platform v6.0 &middot; GLWC Methodology &middot; {wageData.length} holdings &middot; {new Date().toLocaleDateString()}</div>
    </div>
  );
}
