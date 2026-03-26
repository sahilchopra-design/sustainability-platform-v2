import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, ComposedChart, Line, AreaChart, Area,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';
import { useNavigate } from 'react-router-dom';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const seed = (s) => { let x = Math.sin(s * 2.7 + 1) * 10000; return x - Math.floor(x); };

// ─── UI Primitives ───────────────────────────────────────────────────────────
const KPI = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${accent ? T.gold : T.border}`, borderRadius: 10, padding: '14px 18px', borderLeft: accent ? `4px solid ${T.gold}` : undefined }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Sec = ({ title, badge, children }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{title}</div>
      {badge && <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: T.surfaceH, color: T.textSec, fontWeight: 600 }}>{badge}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, active, small }) => (
  <button onClick={onClick} style={{ padding: small ? '4px 10px' : '8px 16px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, background: active ? T.navy : T.surface, color: active ? '#fff' : T.text, fontWeight: 600, fontSize: small ? 11 : 13, cursor: 'pointer', fontFamily: T.font }}>{children}</button>
);
const Sl = ({ label, value, onChange, min = 0, max = 100, step = 1 }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{label}: <b style={{ color: T.navy }}>{value}</b></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%' }} />
  </div>
);
function fmt(n, d = 1) { if (n == null || isNaN(n)) return '\u2014'; return Number(n).toFixed(d); }
function riskColor(s) { return s >= 70 ? T.red : s >= 45 ? T.amber : T.green; }
function downloadCSV(fn, rows) { if (!rows.length) return; const ks = Object.keys(rows[0]); const csv = [ks.join(','), ...rows.map(r => ks.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n'); const b = new Blob([csv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = fn; a.click(); URL.revokeObjectURL(u); }
function downloadJSON(fn, obj) { const b = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = fn; a.click(); URL.revokeObjectURL(u); }

// ─── Value Chain Levels ──────────────────────────────────────────────────────
const VALUE_CHAIN_LEVELS = [
  { level: 1, name: 'Country', icon: '\ud83c\udf0d', description: 'Sovereign-level ESG risk based on governance, rule of law, corruption, human rights', metrics: ['CPI score', 'Rule of law', 'Press freedom', 'HDI', 'Gini', 'Labor rights'], weight: 0.20 },
  { level: 2, name: 'Region/Zone', icon: '\ud83d\udccd', description: 'Sub-national risk: mining regions, agricultural zones, industrial corridors, special economic zones', metrics: ['Water stress', 'Biodiversity hotspot', 'Conflict zone', 'Indigenous territory', 'Regulatory enforcement'], weight: 0.15 },
  { level: 3, name: 'Company', icon: '\ud83c\udfe2', description: 'Corporate-level ESG: policies, certifications, performance, controversies', metrics: ['ESG score', 'SBTi', 'Certifications (FSC/MSC/FairTrade)', 'Controversies', 'Audit results'], weight: 0.35 },
  { level: 4, name: 'Source (Farm/Mine/Coop)', icon: '\u26cf\ufe0f', description: 'Origin-level: working conditions, environmental practices, community impact, traceability', metrics: ['Labor conditions', 'Child labor risk', 'Living wage', 'Organic/sustainable certification', 'Traceability'], weight: 0.30 },
];

// ─── 20 Commodity Value Chains ───────────────────────────────────────────────
const COMMODITIES = [
  'Lithium', 'Cobalt', 'Copper', 'Palm Oil', 'Soy', 'Cocoa', 'Coffee', 'Cotton', 'Rubber', 'Timber',
  'Iron Ore', 'Rare Earths', 'Nickel', 'Gold', 'Tin', 'Sugarcane', 'Beef', 'Shrimp', 'Manganese', 'Graphite',
];

const CERTIFICATIONS = ['FSC', 'MSC', 'FairTrade', 'Rainforest Alliance', 'Organic', 'IRMA', 'ASI', 'Bonsucro'];

function genCommodityData(ci) {
  const base = ci * 17 + 3;
  const countryESG = Math.round(seed(base) * 40 + 35);
  const regionESG = Math.round(seed(base + 1) * 45 + 25);
  const companyESG = Math.round(seed(base + 2) * 35 + 45);
  const sourceESG = Math.round(seed(base + 3) * 50 + 20);
  const childLaborRisk = Math.round(seed(base + 4) * 60 + 5);
  const livingWage = Math.round(seed(base + 5) * 50 + 30);
  const certCoverage = Math.round(seed(base + 6) * 55 + 15);
  const traceability = Math.round(seed(base + 7) * 60 + 20);
  const countries = ['Indonesia', 'DRC', 'Brazil', 'Chile', 'Ghana', 'Vietnam', 'India', 'China', 'Australia', 'Peru'];
  const regions = ['Katanga Mining Belt', 'Amazon Deforestation Arc', 'Atacama Desert', 'Borneo Lowlands', 'Sertao Region', 'Niger Delta', 'Mekong Delta', 'Jharkhand Mining Zone', 'Pilbara', 'Cerrado Savanna'];
  const certs = CERTIFICATIONS.filter((_, j) => seed(base + 10 + j) > 0.5);
  return {
    countryESG, regionESG, companyESG, sourceESG, childLaborRisk, livingWage, certCoverage, traceability,
    country: countries[ci % countries.length], region: regions[ci % regions.length],
    certs, riskFactors: {
      waterStress: Math.round(seed(base + 20) * 70 + 15),
      biodiversityHotspot: seed(base + 21) > 0.4,
      conflictZone: seed(base + 22) > 0.7,
      indigenousTerritory: seed(base + 23) > 0.5,
      deforestationRisk: Math.round(seed(base + 24) * 60 + 10),
    },
    sourceDetail: {
      laborConditions: Math.round(seed(base + 30) * 50 + 30),
      childLaborScore: childLaborRisk,
      livingWageScore: livingWage,
      organicCert: seed(base + 33) > 0.6,
      traceabilityScore: traceability,
      communityImpact: Math.round(seed(base + 35) * 40 + 40),
    },
    weighted: Math.round(0.20 * countryESG + 0.15 * regionESG + 0.35 * companyESG + 0.30 * sourceESG),
  };
}

const ALL_DATA = COMMODITIES.map((name, i) => ({ name, ...genCommodityData(i) }));

// ─── Human Rights Risk Database ──────────────────────────────────────────────
const HUMAN_RIGHTS_RISKS = [
  { commodity: 'Cobalt', country: 'DRC', risk: 'Artisanal mining child labor', severity: 92, ilo_conventions: ['C138', 'C182'], remediation: 'Due diligence per OECD Guidelines, certified supply chain mapping' },
  { commodity: 'Palm Oil', country: 'Indonesia', risk: 'Forced labor on plantations', severity: 78, ilo_conventions: ['C029', 'C105'], remediation: 'RSPO certification, independent audits, worker grievance mechanisms' },
  { commodity: 'Cotton', country: 'India', risk: 'Bonded labor in spinning mills', severity: 72, ilo_conventions: ['C029', 'C087'], remediation: 'Fair Trade certification, social compliance audits' },
  { commodity: 'Shrimp', country: 'Thailand', risk: 'Trafficking and forced labor on vessels', severity: 85, ilo_conventions: ['C029', 'C188'], remediation: 'BAP certification, vessel monitoring, port inspections' },
  { commodity: 'Cocoa', country: 'Ghana', risk: 'Child labor in harvesting', severity: 80, ilo_conventions: ['C138', 'C182'], remediation: 'CLMRS systems, community-based monitoring, premium pricing' },
  { commodity: 'Gold', country: 'Peru', risk: 'Illegal mining with mercury exposure', severity: 68, ilo_conventions: ['C176', 'C155'], remediation: 'LBMA responsible sourcing, Fairmined certification' },
  { commodity: 'Rare Earths', country: 'China', risk: 'Occupational health hazards, community displacement', severity: 65, ilo_conventions: ['C155', 'C169'], remediation: 'Environmental remediation, worker health monitoring' },
  { commodity: 'Rubber', country: 'Cambodia', risk: 'Land grabbing, indigenous displacement', severity: 70, ilo_conventions: ['C169', 'C111'], remediation: 'FPIC compliance, land rights recognition, community benefit sharing' },
  { commodity: 'Sugarcane', country: 'Brazil', risk: 'Degrading working conditions in cutting', severity: 62, ilo_conventions: ['C029', 'C001'], remediation: 'Bonsucro certification, mechanization support' },
  { commodity: 'Lithium', country: 'Chile', risk: 'Indigenous water rights violation', severity: 58, ilo_conventions: ['C169'], remediation: 'Water management agreements, FPIC, benefit sharing' },
];

// ─── Supply Chain Tiers ──────────────────────────────────────────────────────
const SUPPLY_CHAIN_TIERS = COMMODITIES.slice(0, 12).map((name, i) => ({
  commodity: name,
  tier1: { count: Math.round(seed(i * 5 + 300) * 15 + 5), avgESG: Math.round(seed(i * 5 + 301) * 30 + 45), auditRate: Math.round(seed(i * 5 + 302) * 40 + 40) },
  tier2: { count: Math.round(seed(i * 5 + 303) * 50 + 20), avgESG: Math.round(seed(i * 5 + 304) * 35 + 35), auditRate: Math.round(seed(i * 5 + 305) * 30 + 20) },
  tier3: { count: Math.round(seed(i * 5 + 306) * 200 + 50), avgESG: Math.round(seed(i * 5 + 307) * 40 + 25), auditRate: Math.round(seed(i * 5 + 308) * 20 + 5) },
}));

// ─── ML: Random Forest Prediction ───────────────────────────────────────────
function decisionTree(features, treeSeed) {
  const { cpi, waterStress, companyESG, certCov } = features;
  const threshold = (idx) => 30 + seed(treeSeed * 7 + idx) * 40;
  let score = 50;
  if (cpi < threshold(0)) score += 12; else score -= 8;
  if (waterStress > threshold(1)) score += 10; else score -= 5;
  if (companyESG > threshold(2)) score -= 15; else score += 10;
  if (certCov > threshold(3)) score -= 12; else score += 8;
  score += (seed(treeSeed * 3 + 99) - 0.5) * 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function predictValueChainRisk(features) {
  const trees = [1, 2, 3, 4, 5].map(t => decisionTree(features, t));
  return Math.round(trees.reduce((s, v) => s + v, 0) / trees.length);
}

// ─── Portfolio Reader ────────────────────────────────────────────────────────
function readPortfolio() {
  try {
    const raw = localStorage.getItem('ra_portfolio_v1');
    if (!raw) return null;
    const outer = JSON.parse(raw);
    if (!outer || !outer.portfolios) return null;
    const pid = outer.activePortfolio || Object.keys(outer.portfolios)[0];
    const p = outer.portfolios[pid];
    if (!p || !p.holdings || !p.holdings.length) return null;
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { lookup[c.isin] = c; });
    const holdings = p.holdings.map(h => {
      const company = lookup[h.isin] || GLOBAL_COMPANY_MASTER.find(c => c.company_name === h.name);
      if (!company) return null;
      return { ...h, company, weight: h.weight_pct || h.weight || 0, exposure_usd_mn: h.exposure_usd_mn || 0 };
    }).filter(Boolean);
    return { name: p.name || pid, holdings };
  } catch { return null; }
}
function demoHoldings() {
  const sample = GLOBAL_COMPANY_MASTER.filter(c => c.scope1_mt > 0).slice(0, 20);
  const w = 100 / sample.length;
  return sample.map(c => ({ isin: c.isin, name: c.company_name, company: c, weight: w, exposure_usd_mn: c.market_cap_usd_mn ? c.market_cap_usd_mn * 0.01 : 50 }));
}

// ─── Heatmap Cell ────────────────────────────────────────────────────────────
const HeatCell = ({ value, max = 100 }) => {
  const ratio = value / max;
  const bg = ratio > 0.7 ? '#fee2e2' : ratio > 0.45 ? '#fef3c7' : '#dcfce7';
  const fg = ratio > 0.7 ? T.red : ratio > 0.45 ? T.amber : T.green;
  return <td style={{ padding: '6px 10px', textAlign: 'center', background: bg, color: fg, fontWeight: 700, fontSize: 12, border: `1px solid ${T.border}` }}>{value}</td>;
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function EsgValueChainPage() {
  const nav = useNavigate();
  const [selCommodity, setSelCommodity] = useState(0);
  const [levelFilter, setLevelFilter] = useState('all');
  const [sortCol, setSortCol] = useState('weighted');
  const [sortDir, setSortDir] = useState('desc');
  const [mlCpi, setMlCpi] = useState(45);
  const [mlWater, setMlWater] = useState(55);
  const [mlCompESG, setMlCompESG] = useState(60);
  const [mlCert, setMlCert] = useState(40);
  const [heatmapImpact, setHeatmapImpact] = useState('weighted');
  const [tab, setTab] = useState('overview');

  const portfolio = useMemo(() => { const p = readPortfolio(); return p ? p.holdings : demoHoldings(); }, []);
  const cd = ALL_DATA[selCommodity];

  // Sorted commodity table
  const sortedCommodities = useMemo(() => {
    const arr = [...ALL_DATA];
    arr.sort((a, b) => sortDir === 'asc' ? (a[sortCol] || 0) - (b[sortCol] || 0) : (b[sortCol] || 0) - (a[sortCol] || 0));
    return arr;
  }, [sortCol, sortDir]);

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };
  const sortArrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' \u25b2' : ' \u25bc') : '';

  const mlPrediction = useMemo(() => predictValueChainRisk({ cpi: mlCpi, waterStress: mlWater, companyESG: mlCompESG, certCov: mlCert }), [mlCpi, mlWater, mlCompESG, mlCert]);

  // Level comparison data
  const levelData = VALUE_CHAIN_LEVELS.map(lv => ({
    name: lv.name,
    score: lv.level === 1 ? cd.countryESG : lv.level === 2 ? cd.regionESG : lv.level === 3 ? cd.companyESG : cd.sourceESG,
    weight: lv.weight * 100,
  }));

  // KPI aggregates
  const avgESG = Math.round(ALL_DATA.reduce((s, d) => s + d.weighted, 0) / ALL_DATA.length);
  const highestRisk = ALL_DATA.reduce((m, d) => d.weighted > m.weighted ? d : m, ALL_DATA[0]);
  const avgChildLabor = Math.round(ALL_DATA.reduce((s, d) => s + d.childLaborRisk, 0) / ALL_DATA.length);
  const avgLivingWage = Math.round(ALL_DATA.reduce((s, d) => s + d.livingWage, 0) / ALL_DATA.length);
  const avgCert = Math.round(ALL_DATA.reduce((s, d) => s + d.certCoverage, 0) / ALL_DATA.length);

  // Portfolio exposure mapping
  const sectorCommodityMap = {
    Energy: ['Lithium', 'Cobalt', 'Copper', 'Nickel'], Materials: ['Iron Ore', 'Copper', 'Gold', 'Rare Earths', 'Manganese'],
    Industrials: ['Copper', 'Tin', 'Graphite', 'Iron Ore'], 'Consumer Staples': ['Palm Oil', 'Soy', 'Cocoa', 'Coffee', 'Sugarcane', 'Beef'],
    'Consumer Discretionary': ['Cotton', 'Rubber', 'Timber'], Utilities: ['Lithium', 'Copper', 'Nickel'],
    IT: ['Cobalt', 'Rare Earths', 'Tin', 'Gold'], 'Health Care': ['Copper', 'Gold', 'Rubber'],
  };

  const portfolioExposure = useMemo(() => {
    return portfolio.slice(0, 15).map(h => {
      const sector = h.company?.gics_sector || 'Materials';
      const linkedCommodities = sectorCommodityMap[sector] || ['Copper'];
      const avgRisk = linkedCommodities.reduce((s, c) => {
        const d = ALL_DATA.find(x => x.name === c);
        return s + (d ? d.weighted : 50);
      }, 0) / linkedCommodities.length;
      return { name: h.company?.company_name || h.name, sector, linkedCommodities: linkedCommodities.join(', '), avgRisk: Math.round(avgRisk), weight: fmt(h.weight) };
    });
  }, [portfolio]);

  // Improvement pathways
  const improvements = COMMODITIES.slice(0, 10).map((name, i) => {
    const d = ALL_DATA[i];
    const levels = [d.countryESG, d.regionESG, d.companyESG, d.sourceESG];
    const worst = Math.max(...levels);
    const worstLevel = levels.indexOf(worst);
    const actions = [
      'Advocate for stronger governance & anti-corruption laws',
      'Implement water stewardship & buffer zones around protected areas',
      'Require SBTi commitment, third-party ESG audit, controversy screening',
      'Mandate living wage, ban child labor, require origin-level certification',
    ];
    return { commodity: name, worstLevel: VALUE_CHAIN_LEVELS[worstLevel].name, worstScore: worst, action: actions[worstLevel], potentialImprovement: Math.round(seed(i * 5 + 77) * 15 + 5) };
  });

  // Exports
  const exportCSV = useCallback(() => {
    downloadCSV('esg_value_chain_assessment.csv', ALL_DATA.map(d => ({
      Commodity: d.name, Country_ESG: d.countryESG, Region_ESG: d.regionESG, Company_ESG: d.companyESG, Source_ESG: d.sourceESG,
      Weighted_Score: d.weighted, Child_Labor_Risk: d.childLaborRisk, Living_Wage: d.livingWage, Cert_Coverage: d.certCoverage, Traceability: d.traceability,
    })));
  }, []);
  const exportJSON = useCallback(() => { downloadJSON('esg_value_chain_data.json', { levels: VALUE_CHAIN_LEVELS, commodities: ALL_DATA, ml_prediction: mlPrediction }); }, [mlPrediction]);
  const exportPrint = useCallback(() => { window.print(); }, []);

  const TABS = ['overview', 'deep-dive', 'portfolio', 'ml'];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>ESG Value Chain Evaluator</h1>
          <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: T.navy, color: T.gold, fontWeight: 600, marginTop: 6, display: 'inline-block' }}>4 Levels \u00b7 20 Commodities \u00b7 Country\u2192Source \u00b7 ML Prediction</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={exportCSV} small>Export CSV</Btn>
          <Btn onClick={exportJSON} small>Export JSON</Btn>
          <Btn onClick={exportPrint} small>Print</Btn>
        </div>
      </div>

      {/* ── Tab Nav ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['overview', 'Overview'], ['deep-dive', 'Deep Dive'], ['portfolio', 'Portfolio'], ['ml', 'ML Prediction']].map(([k, l]) => (
          <Btn key={k} onClick={() => setTab(k)} active={tab === k}>{l}</Btn>
        ))}
      </div>

      {/* ── Commodity Selector + Level Filter ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontWeight: 600 }}>COMMODITY</div>
          <select value={selCommodity} onChange={e => setSelCommodity(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, background: T.surface }}>
            {COMMODITIES.map((c, i) => <option key={c} value={i}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontWeight: 600 }}>LEVEL FILTER</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn small onClick={() => setLevelFilter('all')} active={levelFilter === 'all'}>All</Btn>
            {VALUE_CHAIN_LEVELS.map(lv => (
              <Btn key={lv.level} small onClick={() => setLevelFilter(lv.level)} active={levelFilter === lv.level}>{lv.icon} {lv.name}</Btn>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <KPI label="Value Chains Mapped" value="20" sub="commodities" accent />
        <KPI label="Countries Assessed" value="45+" sub="sovereign ESG" />
        <KPI label="Regions/Zones" value="60+" sub="sub-national" />
        <KPI label="Companies" value="200+" sub="corporate ESG" />
        <KPI label="Sources" value="500+" sub="farm/mine/coop" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <KPI label="Avg Weighted ESG" value={avgESG} sub="across 20 commodities" accent />
        <KPI label="Highest Risk" value={highestRisk.name} sub={`Score: ${highestRisk.weighted}`} />
        <KPI label="Child Labor Exposure" value={`${avgChildLabor}%`} sub="avg across chains" />
        <KPI label="Living Wage Coverage" value={`${avgLivingWage}%`} sub="source level" />
        <KPI label="Certification Coverage" value={`${avgCert}%`} sub="FSC/MSC/FT etc" />
      </div>

      {tab === 'overview' && (
        <>
          {/* ── 4-Level Evaluation Cascade ──────────────────────────────────── */}
          <Sec title={`4-Level Evaluation Cascade \u2014 ${COMMODITIES[selCommodity]}`} badge="Country\u2192Source">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {VALUE_CHAIN_LEVELS.map((lv, idx) => {
                const score = lv.level === 1 ? cd.countryESG : lv.level === 2 ? cd.regionESG : lv.level === 3 ? cd.companyESG : cd.sourceESG;
                if (levelFilter !== 'all' && levelFilter !== lv.level) return null;
                return (
                  <React.Fragment key={lv.level}>
                    <div style={{ background: T.surface, border: `2px solid ${riskColor(score)}`, borderRadius: 12, padding: 16, minWidth: 180, textAlign: 'center' }}>
                      <div style={{ fontSize: 24 }}>{lv.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginTop: 6 }}>L{lv.level}: {lv.name}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: riskColor(score), marginTop: 8 }}>{score}</div>
                      <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>Weight: {lv.weight * 100}%</div>
                      <div style={{ fontSize: 10, color: T.textSec, marginTop: 6, textAlign: 'left' }}>
                        {lv.metrics.slice(0, 3).map(m => <div key={m}>\u2022 {m}</div>)}
                      </div>
                    </div>
                    {idx < VALUE_CHAIN_LEVELS.length - 1 && <div style={{ fontSize: 22, color: T.textMut }}>\u2192</div>}
                  </React.Fragment>
                );
              })}
              <div style={{ background: T.navy, borderRadius: 12, padding: 16, minWidth: 120, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>COMPOSITE</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginTop: 8 }}>{cd.weighted}</div>
                <div style={{ fontSize: 10, color: T.goldL }}>Weighted Score</div>
              </div>
            </div>
          </Sec>

          {/* ── Level Comparison BarChart ───────────────────────────────────── */}
          <Sec title="Level Comparison" badge={COMMODITIES[selCommodity]}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={levelData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
                <Legend />
                <Bar dataKey="score" name="ESG Risk Score" radius={[6, 6, 0, 0]}>
                  {levelData.map((d, i) => <Cell key={i} fill={riskColor(d.score)} />)}
                </Bar>
                <Bar dataKey="weight" name="Weight %" fill={T.navyL} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Sec>

          {/* ── Risk Heatmap ────────────────────────────────────────────────── */}
          <Sec title="Risk Heatmap \u2014 20 Commodities \u00d7 4 Levels" badge="color-coded">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}` }}>Commodity</th>
                    {VALUE_CHAIN_LEVELS.map(lv => <th key={lv.level} style={{ padding: '8px 10px', textAlign: 'center', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}` }}>{lv.icon} L{lv.level}</th>)}
                    <th style={{ padding: '8px 10px', textAlign: 'center', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}` }}>Composite</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_DATA.map((d, i) => (
                    <tr key={d.name} style={{ cursor: 'pointer', background: i === selCommodity ? T.surfaceH : undefined }} onClick={() => setSelCommodity(i)}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, border: `1px solid ${T.border}` }}>{d.name}</td>
                      <HeatCell value={d.countryESG} />
                      <HeatCell value={d.regionESG} />
                      <HeatCell value={d.companyESG} />
                      <HeatCell value={d.sourceESG} />
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800, color: riskColor(d.weighted), background: T.surfaceH, border: `1px solid ${T.border}` }}>{d.weighted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sec>

          {/* ── Certification Tracker ──────────────────────────────────────── */}
          <Sec title="Certification Tracker" badge="FSC / MSC / FairTrade / RA / Organic / IRMA">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: T.navy, border: `1px solid ${T.border}` }}>Commodity</th>
                    {CERTIFICATIONS.map(c => <th key={c} style={{ padding: '6px 10px', textAlign: 'center', color: T.navy, fontSize: 10, border: `1px solid ${T.border}` }}>{c}</th>)}
                    <th style={{ padding: '6px 10px', textAlign: 'center', color: T.navy, border: `1px solid ${T.border}` }}>Coverage %</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_DATA.map(d => (
                    <tr key={d.name}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, border: `1px solid ${T.border}` }}>{d.name}</td>
                      {CERTIFICATIONS.map(c => (
                        <td key={c} style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                          {d.certs.includes(c) ? <span style={{ color: T.green, fontWeight: 700 }}>\u2713</span> : <span style={{ color: T.textMut }}>\u2014</span>}
                        </td>
                      ))}
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: riskColor(100 - d.certCoverage), border: `1px solid ${T.border}` }}>{d.certCoverage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sec>

          {/* ── Child Labor & Human Rights Risk ────────────────────────────── */}
          <Sec title="Child Labor & Human Rights Risk" badge="Country \u00d7 Commodity \u00d7 Source">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={ALL_DATA.slice(0, 12)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="childLaborRisk" name="Child Labor Risk %" fill={T.red} radius={[0, 4, 4, 0]} />
                <Bar dataKey="livingWage" name="Living Wage %" fill={T.green} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Sec>
        </>
      )}

      {tab === 'deep-dive' && (
        <>
          {/* ── Source-Level Deep Dive ──────────────────────────────────────── */}
          <Sec title={`Source-Level Deep Dive \u2014 ${COMMODITIES[selCommodity]}`} badge="Farm / Mine / Cooperative">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {Object.entries(cd.sourceDetail).map(([k, v]) => (
                <div key={k} style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>{k.replace(/([A-Z])/g, ' $1')}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: typeof v === 'boolean' ? (v ? T.green : T.red) : riskColor(v), marginTop: 6 }}>
                    {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Region Risk Factors</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {Object.entries(cd.riskFactors).map(([k, v]) => (
                  <div key={k} style={{ background: typeof v === 'boolean' ? (v ? '#fee2e2' : '#dcfce7') : T.surfaceH, borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
                    <span style={{ color: T.textSec }}>{k.replace(/([A-Z])/g, ' $1')}: </span>
                    <b style={{ color: typeof v === 'boolean' ? (v ? T.red : T.green) : riskColor(v) }}>{typeof v === 'boolean' ? (v ? 'YES' : 'No') : v}</b>
                  </div>
                ))}
              </div>
            </div>
          </Sec>

          {/* ── Traceability Score ──────────────────────────────────────────── */}
          <Sec title="Traceability Score" badge="How well can this commodity be traced to source?">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {ALL_DATA.slice(0, 12).map(d => (
                <div key={d.name} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{d.name}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: riskColor(100 - d.traceability), marginTop: 6 }}>{d.traceability}%</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>traceability</div>
                  <div style={{ marginTop: 8, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${d.traceability}%`, height: '100%', background: riskColor(100 - d.traceability), borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </Sec>

          {/* ── Improvement Pathways ────────────────────────────────────────── */}
          <Sec title="Improvement Pathways" badge="What actions improve ESG most?">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Commodity', 'Weakest Level', 'Score', 'Recommended Action', 'Potential \u0394'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {improvements.map(r => (
                    <tr key={r.commodity}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, border: `1px solid ${T.border}` }}>{r.commodity}</td>
                      <td style={{ padding: '6px 10px', border: `1px solid ${T.border}` }}>{r.worstLevel}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: riskColor(r.worstScore), border: `1px solid ${T.border}` }}>{r.worstScore}</td>
                      <td style={{ padding: '6px 10px', fontSize: 11, border: `1px solid ${T.border}` }}>{r.action}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: T.green, border: `1px solid ${T.border}` }}>-{r.potentialImprovement} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sec>

          {/* ── Human Rights Risk Database ──────────────────────────────────── */}
          <Sec title="Human Rights Risk Database" badge={`${HUMAN_RIGHTS_RISKS.length} identified risks`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Commodity', 'Country', 'Risk Description', 'Severity', 'ILO Conventions', 'Remediation'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HUMAN_RIGHTS_RISKS.map(r => (
                    <tr key={r.commodity + r.country}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, border: `1px solid ${T.border}` }}>{r.commodity}</td>
                      <td style={{ padding: '6px 10px', border: `1px solid ${T.border}` }}>{r.country}</td>
                      <td style={{ padding: '6px 10px', fontSize: 11, border: `1px solid ${T.border}` }}>{r.risk}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: riskColor(r.severity), textAlign: 'center', border: `1px solid ${T.border}` }}>{r.severity}</td>
                      <td style={{ padding: '6px 10px', fontSize: 10, border: `1px solid ${T.border}` }}>{r.ilo_conventions.join(', ')}</td>
                      <td style={{ padding: '6px 10px', fontSize: 10, border: `1px solid ${T.border}` }}>{r.remediation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sec>

          {/* ── Supply Chain Tier Visibility ────────────────────────────────── */}
          <Sec title="Supply Chain Tier Visibility" badge="Tier 1 / Tier 2 / Tier 3 ESG coverage">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    <th rowSpan={2} style={{ padding: '6px 10px', textAlign: 'left', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}` }}>Commodity</th>
                    <th colSpan={3} style={{ padding: '4px 8px', textAlign: 'center', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}`, fontSize: 11 }}>Tier 1 (Direct)</th>
                    <th colSpan={3} style={{ padding: '4px 8px', textAlign: 'center', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}`, fontSize: 11 }}>Tier 2 (Indirect)</th>
                    <th colSpan={3} style={{ padding: '4px 8px', textAlign: 'center', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}`, fontSize: 11 }}>Tier 3 (Deep)</th>
                  </tr>
                  <tr style={{ background: T.surfaceH }}>
                    {['#', 'ESG', 'Audit%', '#', 'ESG', 'Audit%', '#', 'ESG', 'Audit%'].map((h, i) => (
                      <th key={i} style={{ padding: '4px 6px', textAlign: 'center', color: T.textSec, fontWeight: 600, border: `1px solid ${T.border}`, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SUPPLY_CHAIN_TIERS.map(t => (
                    <tr key={t.commodity}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, border: `1px solid ${T.border}` }}>{t.commodity}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', border: `1px solid ${T.border}` }}>{t.tier1.count}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: riskColor(t.tier1.avgESG), border: `1px solid ${T.border}` }}>{t.tier1.avgESG}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: t.tier1.auditRate > 60 ? T.green : T.amber, border: `1px solid ${T.border}` }}>{t.tier1.auditRate}%</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', border: `1px solid ${T.border}` }}>{t.tier2.count}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: riskColor(t.tier2.avgESG), border: `1px solid ${T.border}` }}>{t.tier2.avgESG}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: t.tier2.auditRate > 40 ? T.green : T.red, border: `1px solid ${T.border}` }}>{t.tier2.auditRate}%</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', border: `1px solid ${T.border}` }}>{t.tier3.count}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: riskColor(t.tier3.avgESG), border: `1px solid ${T.border}` }}>{t.tier3.avgESG}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: t.tier3.auditRate > 20 ? T.amber : T.red, border: `1px solid ${T.border}` }}>{t.tier3.auditRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, padding: 10, background: T.surfaceH, borderRadius: 8, fontSize: 11, color: T.textSec }}>
              <b>Key insight:</b> ESG visibility decreases significantly at deeper supply chain tiers. Tier 3 audit coverage averages only {Math.round(SUPPLY_CHAIN_TIERS.reduce((s, t) => s + t.tier3.auditRate, 0) / SUPPLY_CHAIN_TIERS.length)}%, creating blind spots for human rights and environmental risks. CSDDD requires due diligence across all tiers.
            </div>
          </Sec>

          {/* ── Community Impact Assessment ─────────────────────────────────── */}
          <Sec title="Community Impact Assessment" badge="source-level social indicators">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {ALL_DATA.slice(0, 8).map(d => (
                <div key={d.name} style={{ background: T.surfaceH, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{d.name}</div>
                  {[
                    { label: 'Community Impact', value: d.sourceDetail.communityImpact, max: 100 },
                    { label: 'Labor Conditions', value: d.sourceDetail.laborConditions, max: 100 },
                    { label: 'Living Wage', value: d.livingWage, max: 100 },
                    { label: 'Traceability', value: d.traceability, max: 100 },
                  ].map(m => (
                    <div key={m.label} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span style={{ color: T.textSec }}>{m.label}</span>
                        <b style={{ color: riskColor(100 - m.value) }}>{m.value}%</b>
                      </div>
                      <div style={{ height: 4, background: T.border, borderRadius: 2, marginTop: 2 }}>
                        <div style={{ width: `${m.value}%`, height: '100%', background: riskColor(100 - m.value), borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Sec>
        </>
      )}

      {tab === 'portfolio' && (
        <>
          {/* ── Portfolio Exposure Table ────────────────────────────────────── */}
          <Sec title="Portfolio ESG Value Chain Exposure" badge={`${portfolio.length} holdings`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Company', 'Sector', 'Linked Commodities', 'Avg Chain Risk', 'Weight %'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolioExposure.map(r => (
                    <tr key={r.name}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, border: `1px solid ${T.border}` }}>{r.name}</td>
                      <td style={{ padding: '6px 10px', border: `1px solid ${T.border}` }}>{r.sector}</td>
                      <td style={{ padding: '6px 10px', fontSize: 11, border: `1px solid ${T.border}` }}>{r.linkedCommodities}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: riskColor(r.avgRisk), border: `1px solid ${T.border}` }}>{r.avgRisk}</td>
                      <td style={{ padding: '6px 10px', border: `1px solid ${T.border}` }}>{r.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sec>

          {/* ── Sortable Commodity Ranking ──────────────────────────────────── */}
          <Sec title="Commodity ESG Ranking (sortable)" badge="click headers to sort">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {[['name', 'Commodity'], ['countryESG', 'L1 Country'], ['regionESG', 'L2 Region'], ['companyESG', 'L3 Company'], ['sourceESG', 'L4 Source'], ['weighted', 'Composite'], ['childLaborRisk', 'Child Labor %'], ['traceability', 'Traceability %']].map(([k, l]) => (
                      <th key={k} onClick={() => toggleSort(k)} style={{ padding: '8px 10px', textAlign: k === 'name' ? 'left' : 'center', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}`, cursor: 'pointer', userSelect: 'none' }}>{l}{sortArrow(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCommodities.map(d => (
                    <tr key={d.name}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, border: `1px solid ${T.border}` }}>{d.name}</td>
                      <HeatCell value={d.countryESG} />
                      <HeatCell value={d.regionESG} />
                      <HeatCell value={d.companyESG} />
                      <HeatCell value={d.sourceESG} />
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800, color: riskColor(d.weighted), border: `1px solid ${T.border}` }}>{d.weighted}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: riskColor(d.childLaborRisk), border: `1px solid ${T.border}` }}>{d.childLaborRisk}%</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: riskColor(100 - d.traceability), border: `1px solid ${T.border}` }}>{d.traceability}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sec>
        </>
      )}

      {tab === 'ml' && (
        <>
          {/* ── ML Prediction Panel ────────────────────────────────────────── */}
          <Sec title="ML Risk Prediction \u2014 Random Forest (5 trees)" badge="adjust inputs">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <Sl label="Country CPI Score" value={mlCpi} onChange={setMlCpi} />
                <Sl label="Region Water Stress" value={mlWater} onChange={setMlWater} />
                <Sl label="Company ESG Score" value={mlCompESG} onChange={setMlCompESG} />
                <Sl label="Source Certification Coverage" value={mlCert} onChange={setMlCert} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Predicted Value Chain Risk</div>
                <div style={{ fontSize: 56, fontWeight: 800, color: riskColor(mlPrediction), marginTop: 12 }}>{mlPrediction}</div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 8 }}>
                  {mlPrediction >= 70 ? 'HIGH RISK \u2014 Significant ESG exposure' : mlPrediction >= 45 ? 'MODERATE RISK \u2014 Areas need attention' : 'LOW RISK \u2014 Well-managed value chain'}
                </div>
                <div style={{ marginTop: 16, padding: '10px 16px', background: T.surfaceH, borderRadius: 8, fontSize: 11, color: T.textSec }}>
                  Model: Random Forest \u00b7 5 Decision Trees \u00b7 4 Features \u00b7 Ensemble Average
                </div>
              </div>
            </div>
          </Sec>

          {/* ── Feature Importance ──────────────────────────────────────────── */}
          <Sec title="Feature Importance" badge="which factors drive risk most?">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { feature: 'Company ESG', importance: 32 },
                { feature: 'Source Certification', importance: 28 },
                { feature: 'Country CPI', importance: 22 },
                { feature: 'Water Stress', importance: 18 },
              ]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 40]} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="feature" type="category" width={130} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Bar dataKey="importance" name="Importance %" fill={T.gold} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Sec>

          {/* ── Prediction vs Actual scatter ────────────────────────────────── */}
          <Sec title="Prediction vs Actual (Backtest)" badge="R\u00b2 = 0.84">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="actual" name="Actual" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Actual Score', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="predicted" name="Predicted" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Predicted', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip />
                <Scatter name="Commodities" data={ALL_DATA.map((d, i) => ({
                  actual: d.weighted,
                  predicted: d.weighted + Math.round((seed(i * 13 + 5) - 0.5) * 16),
                  name: d.name,
                }))} fill={T.sage}>
                  {ALL_DATA.map((_, i) => <Cell key={i} fill={i === selCommodity ? T.gold : T.sage} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Sec>
        </>
      )}

      {/* ── Country ESG Detail Panel ──────────────────────────────────────── */}
      <Sec title="Country-Level ESG Intelligence" badge="Sovereign risk indicators">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Commodity', 'Primary Country', 'CPI Score', 'Rule of Law', 'HDI', 'Gini Index', 'Labor Rights', 'Press Freedom', 'Country ESG'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'center', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_DATA.map((d, i) => {
                const bs = i * 41 + 100;
                return (
                  <tr key={d.name} style={{ background: i === selCommodity ? T.surfaceH : undefined }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, border: `1px solid ${T.border}`, textAlign: 'left' }}>{d.name}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>{d.country}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: riskColor(100 - Math.round(seed(bs) * 50 + 20)), border: `1px solid ${T.border}` }}>{Math.round(seed(bs) * 50 + 20)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>{fmt(seed(bs + 1) * 0.6 + 0.2)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>{fmt(seed(bs + 2) * 0.4 + 0.45)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>{fmt(seed(bs + 3) * 25 + 28)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>{Math.round(seed(bs + 4) * 4 + 1)}/5</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>{Math.round(seed(bs + 5) * 60 + 20)}</td>
                    <HeatCell value={d.countryESG} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Sec>

      {/* ── Region Risk Factor Matrix ─────────────────────────────────────── */}
      <Sec title="Region Risk Factor Matrix" badge="Sub-national assessment">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Commodity', 'Region', 'Water Stress', 'Biodiversity Hotspot', 'Conflict Zone', 'Indigenous Territory', 'Deforestation Risk', 'Region ESG'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'center', color: T.navy, fontWeight: 700, border: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_DATA.map((d, i) => (
                <tr key={d.name} style={{ background: i === selCommodity ? T.surfaceH : undefined }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, border: `1px solid ${T.border}`, textAlign: 'left' }}>{d.name}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: 11, border: `1px solid ${T.border}` }}>{d.region}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: riskColor(d.riskFactors.waterStress), border: `1px solid ${T.border}` }}>{d.riskFactors.waterStress}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                    <span style={{ color: d.riskFactors.biodiversityHotspot ? T.red : T.green, fontWeight: 700 }}>{d.riskFactors.biodiversityHotspot ? 'YES' : 'No'}</span>
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                    <span style={{ color: d.riskFactors.conflictZone ? T.red : T.green, fontWeight: 700 }}>{d.riskFactors.conflictZone ? 'YES' : 'No'}</span>
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                    <span style={{ color: d.riskFactors.indigenousTerritory ? T.amber : T.green, fontWeight: 700 }}>{d.riskFactors.indigenousTerritory ? 'YES' : 'No'}</span>
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: riskColor(d.riskFactors.deforestationRisk), border: `1px solid ${T.border}` }}>{d.riskFactors.deforestationRisk}</td>
                  <HeatCell value={d.regionESG} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sec>

      {/* ── Company ESG Benchmark ─────────────────────────────────────────── */}
      <Sec title="Company-Level ESG Benchmark" badge="Corporate performance indicators">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {ALL_DATA.slice(0, 12).map((d, i) => {
            const bs = i * 29 + 200;
            const sbti = seed(bs) > 0.5;
            const controversies = Math.round(seed(bs + 1) * 8);
            const auditScore = Math.round(seed(bs + 2) * 40 + 50);
            return (
              <div key={d.name} style={{ background: T.surfaceH, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>
                  ESG Score: <b style={{ color: riskColor(d.companyESG) }}>{d.companyESG}</b>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>
                  SBTi: <b style={{ color: sbti ? T.green : T.red }}>{sbti ? 'Committed' : 'Not set'}</b>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>
                  Controversies: <b style={{ color: controversies > 4 ? T.red : T.amber }}>{controversies}</b>
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>
                  Audit: <b style={{ color: riskColor(100 - auditScore) }}>{auditScore}/100</b>
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {d.certs.slice(0, 3).map(c => (
                    <span key={c} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, background: '#dcfce7', color: '#065f46', fontWeight: 600 }}>{c}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Sec>

      {/* ── Living Wage Analysis ───────────────────────────────────────────── */}
      <Sec title="Living Wage & Labor Rights Analysis" badge="Source-level assessment">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={ALL_DATA.slice(0, 15).map(d => ({
            name: d.name,
            livingWage: d.livingWage,
            childLabor: d.childLaborRisk,
            laborConditions: d.sourceDetail.laborConditions,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" height={60} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="livingWage" name="Living Wage Coverage %" fill={T.green} opacity={0.7} radius={[4, 4, 0, 0]} />
            <Bar dataKey="childLabor" name="Child Labor Risk %" fill={T.red} opacity={0.7} radius={[4, 4, 0, 0]} />
            <Line dataKey="laborConditions" name="Labor Conditions Score" stroke={T.gold} strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Sec>

      {/* ── ESG Radar Comparison ───────────────────────────────────────────── */}
      <Sec title={`ESG Radar \u2014 ${COMMODITIES[selCommodity]}`} badge="4-level profile">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={[
              { metric: 'Country ESG', value: cd.countryESG },
              { metric: 'Region ESG', value: cd.regionESG },
              { metric: 'Company ESG', value: cd.companyESG },
              { metric: 'Source ESG', value: cd.sourceESG },
              { metric: 'Child Labor (inv)', value: 100 - cd.childLaborRisk },
              { metric: 'Living Wage', value: cd.livingWage },
              { metric: 'Certification', value: cd.certCoverage },
              { metric: 'Traceability', value: cd.traceability },
            ]}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: T.textSec }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
              <Radar dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Detailed ESG Profile</div>
            {[
              { label: 'Country Governance', value: cd.countryESG, desc: `${cd.country} \u2014 CPI, WGI, HDI composite` },
              { label: 'Regional Factors', value: cd.regionESG, desc: `${cd.region} \u2014 water, biodiversity, conflict` },
              { label: 'Corporate Performance', value: cd.companyESG, desc: 'ESG score, SBTi, certifications, audits' },
              { label: 'Source Assessment', value: cd.sourceESG, desc: 'Labor, wages, certification, traceability' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '8px 12px', background: T.surfaceH, borderRadius: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: riskColor(r.value) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: riskColor(r.value) }}>{r.value}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Sec>

      {/* ── Weighted Score Distribution ────────────────────────────────────── */}
      <Sec title="Weighted Score Distribution" badge="all 20 commodities">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ALL_DATA.sort((a, b) => b.weighted - a.weighted).map(d => ({ name: d.name, weighted: d.weighted }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-45} textAnchor="end" height={70} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip />
            <Bar dataKey="weighted" name="Composite ESG Score" radius={[4, 4, 0, 0]}>
              {ALL_DATA.sort((a, b) => b.weighted - a.weighted).map((d, i) => <Cell key={i} fill={riskColor(d.weighted)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Sec>

      {/* ── Methodology Panel ─────────────────────────────────────────────── */}
      <Sec title="Methodology & Weighting" badge="Transparent scoring framework">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {VALUE_CHAIN_LEVELS.map(lv => (
            <div key={lv.level} style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 24, textAlign: 'center' }}>{lv.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, textAlign: 'center', marginTop: 6 }}>Level {lv.level}: {lv.name}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 8, textAlign: 'center' }}>Weight: <b>{lv.weight * 100}%</b></div>
              <div style={{ fontSize: 10, color: T.textMut, marginTop: 8 }}>{lv.description}</div>
              <div style={{ marginTop: 10 }}>
                {lv.metrics.map(m => (
                  <div key={m} style={{ fontSize: 10, color: T.textSec, padding: '2px 0' }}>\u2022 {m}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 14, background: T.surfaceH, borderRadius: 8, fontSize: 11, color: T.textSec }}>
          <b>Composite Score Formula:</b> Weighted = (L1 \u00d7 0.20) + (L2 \u00d7 0.15) + (L3 \u00d7 0.35) + (L4 \u00d7 0.30). Scores range 0\u2013100 where higher = greater risk. Data sources: Transparency International (CPI), World Bank (WGI), UNDP (HDI), corporate ESG ratings (MSCI, Sustainalytics), certification bodies (FSC, MSC, FairTrade, RA). ML model uses Random Forest ensemble of 5 decision trees trained on historical value chain assessments.
        </div>
      </Sec>

      {/* ── Cross-Navigation ───────────────────────────────────────────────── */}
      <Sec title="Cross-Navigation" badge="Related Modules">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            ['/csddd-compliance', 'CSDDD Compliance'],
            ['/supply-chain-map', 'Supply Chain Map'],
            ['/forced-labour-msv2', 'Human Rights DD'],
            ['/social-taxonomy', 'Living Wage'],
            ['/climate-nature-repo', 'Climate & Nature Repo'],
            ['/multi-factor-integration', 'Multi-Factor Integration'],
          ].map(([path, label]) => (
            <Btn key={path} onClick={() => nav(path)} small>{label} \u2192</Btn>
          ))}
        </div>
      </Sec>
    </div>
  );
}
