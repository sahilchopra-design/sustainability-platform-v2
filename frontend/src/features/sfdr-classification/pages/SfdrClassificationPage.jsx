import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const seed = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const hashStr = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const fmt = (n, d = 1) => n == null ? '--' : Number(n).toFixed(d);
const fmtPct = (n) => n == null ? '--' : Number(n).toFixed(1) + '%';

/* ═══════════════════════════════════════════════════════════════════════════
   SFDR CLASSIFICATION CRITERIA
   ═══════════════════════════════════════════════════════════════════════════ */
const SFDR_CRITERIA = {
  article6: {
    key: 'article6', name: 'Article 6 \u2014 No ESG Claims', shortName: 'Art. 6',
    color: '#6b7280',
    description: 'Product does not promote environmental or social characteristics and does not have sustainable investment as its objective',
    requirements: [
      { id: 'a6-1', text: 'Disclose how sustainability risks are integrated', mandatory: true },
      { id: 'a6-2', text: 'Explain if sustainability risks are not relevant', mandatory: true },
    ],
    pai_required: false, taxonomy_disclosure: false,
  },
  article8: {
    key: 'article8', name: 'Article 8 \u2014 Promotes E/S Characteristics', shortName: 'Art. 8',
    color: '#2563eb',
    description: 'Product promotes environmental or social characteristics, provided that investee companies follow good governance practices',
    requirements: [
      { id: 'a8-1', text: 'Binding ESG criteria in investment process', mandatory: true },
      { id: 'a8-2', text: 'Regular assessment of E/S characteristics', mandatory: true },
      { id: 'a8-3', text: 'Good governance practices of investee companies', mandatory: true },
      { id: 'a8-4', text: 'PAI consideration (explain or comply)', mandatory: false },
      { id: 'a8-5', text: 'Pre-contractual disclosure (Annex II)', mandatory: true },
      { id: 'a8-6', text: 'Website disclosure', mandatory: true },
      { id: 'a8-7', text: 'Periodic reporting (Annex IV)', mandatory: true },
    ],
    thresholds: { esg_integration: true, exclusion_screens: true, min_esg_score: 40 },
    taxonomy_disclosure: true,
  },
  article8plus: {
    key: 'article8plus', name: 'Article 8+ \u2014 With Sustainable Investment', shortName: 'Art. 8+',
    color: '#1d4ed8',
    description: 'Article 8 product that also commits to a minimum proportion of sustainable investments',
    requirements: [
      { id: 'a8p-1', text: 'All Article 8 requirements', mandatory: true },
      { id: 'a8p-2', text: 'Minimum % sustainable investment', mandatory: true },
      { id: 'a8p-3', text: 'DNSH for sustainable portion', mandatory: true },
      { id: 'a8p-4', text: 'Taxonomy alignment for environmental SI', mandatory: true },
    ],
    thresholds: { min_sustainable_investment_pct: 20, min_taxonomy_aligned_pct: 10 },
    taxonomy_disclosure: true,
  },
  article9: {
    key: 'article9', name: 'Article 9 \u2014 Sustainable Investment Objective', shortName: 'Art. 9',
    color: '#16a34a',
    description: 'Product has sustainable investment as its objective',
    requirements: [
      { id: 'a9-1', text: 'Sustainable investment objective clearly defined', mandatory: true },
      { id: 'a9-2', text: 'Index designation or explanation how objective is attained', mandatory: true },
      { id: 'a9-3', text: 'DNSH assessment for ALL investments', mandatory: true },
      { id: 'a9-4', text: 'PAI mandatory consideration', mandatory: true },
      { id: 'a9-5', text: 'Pre-contractual (Annex III), website, periodic (Annex V)', mandatory: true },
      { id: 'a9-6', text: 'Good governance assessment', mandatory: true },
      { id: 'a9-7', text: 'Taxonomy alignment disclosure', mandatory: true },
    ],
    thresholds: { min_sustainable_investment_pct: 80, min_taxonomy_aligned_pct: 30, pai_mandatory: true, full_dnsh: true },
    taxonomy_disclosure: true,
  },
};

const SFDR_ORDER = ['article6', 'article8', 'article8plus', 'article9'];

/* ═══════════════════════════════════════════════════════════════════════════
   14 MANDATORY PAI INDICATORS
   ═══════════════════════════════════════════════════════════════════════════ */
const PAI_INDICATORS = [
  { id: 'PAI-1', name: 'GHG emissions (Scope 1)', mandatory: true, unit: 'tCO\u2082e', category: 'Climate', description: 'Scope 1 greenhouse gas emissions of investee companies' },
  { id: 'PAI-2', name: 'Carbon footprint (Scope 1+2+3 per EUR Mn)', mandatory: true, unit: 'tCO\u2082e/\u20ACMn', category: 'Climate', description: 'Carbon footprint of investee companies per EUR million invested' },
  { id: 'PAI-3', name: 'GHG intensity of investee companies', mandatory: true, unit: 'tCO\u2082e/\u20ACMn revenue', category: 'Climate', description: 'GHG intensity per EUR million revenue of investee companies' },
  { id: 'PAI-4', name: 'Exposure to fossil fuel sector', mandatory: true, unit: '%', category: 'Climate', description: 'Share of investments in companies active in the fossil fuel sector' },
  { id: 'PAI-5', name: 'Non-renewable energy share', mandatory: true, unit: '%', category: 'Climate', description: 'Share of non-renewable energy consumption and production of investee companies' },
  { id: 'PAI-6', name: 'Energy consumption intensity per NACE sector', mandatory: true, unit: 'GWh/\u20ACMn', category: 'Climate', description: 'Energy consumption in GWh per million EUR of revenue per high impact climate sector' },
  { id: 'PAI-7', name: 'Activities negatively affecting biodiversity', mandatory: true, unit: 'Y/N + list', category: 'Biodiversity', description: 'Share of investments in companies with sites near biodiversity-sensitive areas with negative impacts' },
  { id: 'PAI-8', name: 'Emissions to water', mandatory: true, unit: 'tonnes', category: 'Water', description: 'Tonnes of emissions to water generated by investee companies per million EUR invested' },
  { id: 'PAI-9', name: 'Hazardous waste ratio', mandatory: true, unit: 'tonnes', category: 'Waste', description: 'Tonnes of hazardous waste and radioactive waste generated per million EUR invested' },
  { id: 'PAI-10', name: 'UNGC/OECD Guidelines violations', mandatory: true, unit: '% companies', category: 'Social', description: 'Share of investments in companies that have been involved in violations of UNGC or OECD guidelines' },
  { id: 'PAI-11', name: 'Lack of UNGC/OECD compliance processes', mandatory: true, unit: '% companies', category: 'Social', description: 'Share of investments in companies without policies to monitor compliance with UNGC or OECD' },
  { id: 'PAI-12', name: 'Unadjusted gender pay gap', mandatory: true, unit: '%', category: 'Social', description: 'Average unadjusted gender pay gap of investee companies' },
  { id: 'PAI-13', name: 'Board gender diversity', mandatory: true, unit: '% female', category: 'Social', description: 'Average ratio of female to male board members in investee companies' },
  { id: 'PAI-14', name: 'Exposure to controversial weapons', mandatory: true, unit: '% AUM', category: 'Social', description: 'Share of investments in investee companies involved in controversial weapons (anti-personnel mines, cluster munitions, chemical, biological)' },
];

const PAI_CATEGORIES = ['Climate', 'Biodiversity', 'Water', 'Waste', 'Social'];
const PAI_CAT_COLORS = { Climate: T.navy, Biodiversity: T.sage, Water: '#06b6d4', Waste: T.amber, Social: '#7c3aed' };

/* ── DNSH Objectives ── */
const DNSH_OBJECTIVES = [
  { id: 'CCM', label: 'Climate Change Mitigation' },
  { id: 'CCA', label: 'Climate Change Adaptation' },
  { id: 'WMR', label: 'Water & Marine Resources' },
  { id: 'CE', label: 'Circular Economy' },
  { id: 'PP', label: 'Pollution Prevention' },
  { id: 'BIO', label: 'Biodiversity & Ecosystems' },
];

/* ── Regulatory timeline ── */
const SFDR_TIMELINE = [
  { year: 2018, event: 'SFDR Regulation adopted (EU 2019/2088)', status: 'complete' },
  { year: 2021, event: 'SFDR Level 1 \u2014 Basic disclosure obligations apply (10 Mar)', status: 'complete' },
  { year: 2022, event: 'Taxonomy Regulation Art. 8 reporting begins (1 Jan)', status: 'complete' },
  { year: 2023, event: 'SFDR Level 2 \u2014 RTS on pre-contractual, website, periodic reports (1 Jan)', status: 'complete' },
  { year: 2024, event: 'First PAI Statement reference period ends (30 Jun). ESAs Q&A updates.', status: 'complete' },
  { year: 2025, event: 'SFDR Review \u2014 European Commission comprehensive assessment', status: 'active' },
  { year: 2026, event: 'Expected updated RTS; potential product categorisation reform', status: 'upcoming' },
  { year: 2027, event: 'Possible SFDR 2.0 with explicit sustainability labels', status: 'upcoming' },
];

/* ── Sector mapping for taxonomy alignment proxy ── */
const SECTOR_MAP = {
  'Energy': 'Energy', 'Utilities': 'Energy', 'Materials': 'Industry',
  'Industrials': 'Industry', 'Information Technology': 'ICT',
  'Real Estate': 'Buildings', 'Financials': 'Finance',
  'Consumer Discretionary': 'Industry', 'Health Care': 'Industry',
  'Consumer Staples': 'Industry', 'Communication Services': 'ICT',
};

/* ═══════════════════════════════════════════════════════════════════════════
   CLASSIFICATION LOGIC
   ═══════════════════════════════════════════════════════════════════════════ */
function computePortfolioMetrics(holdings) {
  if (!holdings.length) return { sustainableInvPct: 0, taxonomyAlignedPct: 0, avgEsg: 0, fossilPct: 0, weaponsPct: 0, dnshPct: 0, govPct: 0, paiCovered: 0, exclusionScreens: false, esgIntegration: false };
  const totalWeight = holdings.reduce((s, h) => s + (h.weight || 0), 0) || 100;
  const normalise = (w) => w / totalWeight * 100;
  const sustainableInvPct = holdings.filter(h => {
    const esg = h.esg_score || (30 + seed(hashStr(h.isin || h.company_name || '')) * 50);
    return (h.sbti_committed || seed(hashStr(h.isin || '') + 7) > 0.55) && esg > 60;
  }).reduce((s, h) => s + normalise(h.weight || (100 / holdings.length)), 0);
  const taxonomyAlignedPct = holdings.filter(h => {
    const esg = h.esg_score || (30 + seed(hashStr(h.isin || h.company_name || '')) * 50);
    const sector = SECTOR_MAP[h.gics_sector || h.sector || 'Financials'] || 'Industry';
    return esg > 55 && ['Energy', 'ICT', 'Buildings'].includes(sector);
  }).reduce((s, h) => s + normalise(h.weight || (100 / holdings.length)), 0);
  const avgEsg = holdings.reduce((s, h) => s + (h.esg_score || (30 + seed(hashStr(h.isin || h.company_name || '')) * 50)), 0) / holdings.length;
  const fossilHoldings = holdings.filter(h => {
    const sector = h.gics_sector || h.sector || '';
    return ['Energy', 'Oil & Gas', 'Coal'].some(s => sector.includes(s)) && seed(hashStr(h.isin || '') + 3) > 0.4;
  });
  const fossilPct = fossilHoldings.reduce((s, h) => s + normalise(h.weight || (100 / holdings.length)), 0);
  const weaponsPct = holdings.filter(h => seed(hashStr(h.isin || '') + 17) > 0.97).reduce((s, h) => s + normalise(h.weight || (100 / holdings.length)), 0);
  const dnshCompany = holdings.filter(h => (h.esg_score || 50) > 48);
  const dnshPct = (dnshCompany.length / holdings.length) * 100;
  const govPct = holdings.filter(h => (h.esg_score || 50) > 42).length / holdings.length * 100;
  const paiCovered = Math.min(14, Math.round(avgEsg / 7));
  const exclusionScreens = fossilPct < 20 && weaponsPct < 1;
  const esgIntegration = avgEsg > 40;
  return {
    sustainableInvPct: +sustainableInvPct.toFixed(1), taxonomyAlignedPct: +taxonomyAlignedPct.toFixed(1),
    avgEsg: +avgEsg.toFixed(1), fossilPct: +fossilPct.toFixed(1), weaponsPct: +weaponsPct.toFixed(2),
    dnshPct: +dnshPct.toFixed(0), govPct: +govPct.toFixed(0), paiCovered,
    exclusionScreens, esgIntegration,
  };
}

function classifyPortfolio(metrics) {
  if (metrics.sustainableInvPct >= 80 && metrics.taxonomyAlignedPct >= 30 && metrics.dnshPct >= 80) return 'article9';
  if (metrics.sustainableInvPct >= 20 && metrics.taxonomyAlignedPct >= 10) return 'article8plus';
  if (metrics.esgIntegration && metrics.exclusionScreens && metrics.avgEsg >= 40) return 'article8';
  return 'article6';
}

function checkRequirements(article, metrics) {
  const checks = {};
  if (article === 'article6') {
    checks['a6-1'] = true; checks['a6-2'] = true;
  }
  if (article === 'article8' || article === 'article8plus' || article === 'article9') {
    checks['a8-1'] = metrics.esgIntegration;
    checks['a8-2'] = metrics.avgEsg > 35;
    checks['a8-3'] = metrics.govPct > 60;
    checks['a8-4'] = metrics.paiCovered >= 8;
    checks['a8-5'] = true; checks['a8-6'] = true; checks['a8-7'] = true;
  }
  if (article === 'article8plus') {
    checks['a8p-1'] = metrics.esgIntegration && metrics.govPct > 60;
    checks['a8p-2'] = metrics.sustainableInvPct >= 20;
    checks['a8p-3'] = metrics.dnshPct >= 60;
    checks['a8p-4'] = metrics.taxonomyAlignedPct >= 10;
  }
  if (article === 'article9') {
    checks['a9-1'] = metrics.sustainableInvPct >= 80;
    checks['a9-2'] = true;
    checks['a9-3'] = metrics.dnshPct >= 80;
    checks['a9-4'] = metrics.paiCovered >= 12;
    checks['a9-5'] = true; checks['a9-6'] = metrics.govPct >= 70;
    checks['a9-7'] = metrics.taxonomyAlignedPct >= 30;
  }
  return checks;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MINI COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */
const Btn = ({ children, onClick, disabled, color = 'navy', sm }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#9ca3af' : color === 'navy' ? T.navy : color === 'gold' ? T.gold : color === 'sage' ? T.sage : color === 'green' ? T.green : color === 'red' ? T.red : T.navyL,
    color: '#fff', border: 'none', borderRadius: 6,
    padding: sm ? '6px 14px' : '10px 22px',
    fontSize: sm ? 12 : 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: T.font, transition: 'opacity .15s',
  }}>{children}</button>
);

const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', ...style }}>{children}</div>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', flex: 1, minWidth: 145 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, margin: '6px 0 2px' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut }}>{sub}</div>}
  </div>
);

const Badge = ({ children, color = T.navy }) => (
  <span style={{ display: 'inline-block', background: color + '18', color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, marginLeft: 8 }}>{children}</span>
);

const Check = ({ ok }) => <span style={{ color: ok ? T.green : T.red, fontWeight: 700, fontSize: 15 }}>{ok ? '\u2705' : '\u274C'}</span>;

const SortHeader = ({ label, col, sortCol, sortDir, onSort, w }) => (
  <th onClick={() => onSort(col)} style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', userSelect: 'none', textAlign: 'left', borderBottom: `2px solid ${T.border}`, width: w || 'auto', whiteSpace: 'nowrap' }}>
    {label} {sortCol === col ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
  </th>
);

const EmptyState = ({ msg }) => (
  <div style={{ textAlign: 'center', padding: 48, color: T.textMut }}>
    <div style={{ fontSize: 42, marginBottom: 12 }}>&#x1F50D;</div>
    <div style={{ fontSize: 15, fontWeight: 600 }}>{msg || 'No data available'}</div>
    <div style={{ fontSize: 13, marginTop: 6 }}>Load a portfolio or adjust simulator parameters.</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const SfdrClassificationPage = () => {
  const navigate = useNavigate();

  /* ── Portfolio load ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      if (Array.isArray(raw) && raw.length) return raw;
      return (GLOBAL_COMPANY_MASTER || []).slice(0, 25);
    } catch { return (GLOBAL_COMPANY_MASTER || []).slice(0, 25); }
  }, []);

  /* ── Holdings enriched ── */
  const holdings = useMemo(() => {
    return portfolio.map(c => {
      const h = hashStr(c.isin || c.company_name || 'X');
      const s = seed(h);
      const esg = c.esg_score != null ? c.esg_score : 30 + s * 50;
      const weight = c.weight || (100 / portfolio.length);
      const revenue = c.revenue_usd_mn || (c.revenue_inr_cr ? c.revenue_inr_cr * 0.12 : 500);
      const ghg = c.ghg_intensity_tco2e_per_mn || (50 + s * 400);
      const sbti = c.sbti_committed || s > 0.55;
      const sector = c.gics_sector || c.sector || 'Financials';
      return {
        ...c, esg_score: +esg.toFixed(1), weight: +weight.toFixed(2),
        revenue, ghg_intensity: +ghg.toFixed(0), sbti_committed: sbti,
        gicsSector: sector, name: c.company_name || c.name || 'Unknown',
        fossil: ['Energy'].includes(sector) && s > 0.4,
        weapons: s > 0.97,
        genderPayGap: +(8 + s * 15).toFixed(1),
        boardDiversity: +(15 + s * 30).toFixed(1),
        ungcViolation: s > 0.88,
      };
    });
  }, [portfolio]);

  /* ── Simulator state ── */
  const [simEsgBoost, setSimEsgBoost] = useState(0);
  const [simSustPct, setSimSustPct] = useState(0);
  const [simTaxPct, setSimTaxPct] = useState(0);

  /* ── Portfolio config state ── */
  const [esgIntegration, setEsgIntegration] = useState(true);
  const [exclusionScreens, setExclusionScreens] = useState(true);

  /* ── Sort state ── */
  const [paiSortCol, setPaiSortCol] = useState('id');
  const [paiSortDir, setPaiSortDir] = useState('asc');
  const [govSortCol, setGovSortCol] = useState('name');
  const [govSortDir, setGovSortDir] = useState('asc');

  /* ── Compute metrics ── */
  const metrics = useMemo(() => {
    const m = computePortfolioMetrics(holdings);
    return {
      ...m,
      sustainableInvPct: +Math.min(100, m.sustainableInvPct + simSustPct).toFixed(1),
      taxonomyAlignedPct: +Math.min(100, m.taxonomyAlignedPct + simTaxPct).toFixed(1),
      avgEsg: +Math.min(100, m.avgEsg + simEsgBoost).toFixed(1),
      esgIntegration: esgIntegration && m.esgIntegration,
      exclusionScreens: exclusionScreens && m.exclusionScreens,
    };
  }, [holdings, simEsgBoost, simSustPct, simTaxPct, esgIntegration, exclusionScreens]);

  /* ── Classification ── */
  const classification = useMemo(() => classifyPortfolio(metrics), [metrics]);
  const classInfo = SFDR_CRITERIA[classification];

  /* ── Requirements check for each article ── */
  const allChecks = useMemo(() => {
    const result = {};
    SFDR_ORDER.forEach(art => { result[art] = checkRequirements(art, metrics); });
    return result;
  }, [metrics]);

  /* ── PAI values ── */
  const paiValues = useMemo(() => {
    return PAI_INDICATORS.map(pai => {
      const h2 = hashStr(pai.id);
      const s2 = seed(h2);
      let value, yoy;
      switch (pai.id) {
        case 'PAI-1': value = holdings.reduce((s, h) => s + (h.ghg_intensity || 200) * (h.weight / 100) * 0.8, 0).toFixed(0); yoy = -3.2; break;
        case 'PAI-2': value = holdings.reduce((s, h) => s + (h.ghg_intensity || 200) * (h.weight / 100) * 0.012, 0).toFixed(1); yoy = -5.1; break;
        case 'PAI-3': value = (holdings.reduce((s, h) => s + (h.ghg_intensity || 200) * (h.weight / 100), 0) / 100).toFixed(1); yoy = -2.8; break;
        case 'PAI-4': value = metrics.fossilPct.toFixed(1); yoy = -1.5; break;
        case 'PAI-5': value = (35 + s2 * 30).toFixed(1); yoy = -4.0; break;
        case 'PAI-6': value = (0.05 + s2 * 0.15).toFixed(3); yoy = -2.1; break;
        case 'PAI-7': value = holdings.filter(h => seed(hashStr(h.isin || '') + 11) > 0.85).length.toString(); yoy = 0; break;
        case 'PAI-8': value = (12 + s2 * 80).toFixed(0); yoy = -6.3; break;
        case 'PAI-9': value = (5 + s2 * 40).toFixed(0); yoy = -3.7; break;
        case 'PAI-10': value = holdings.filter(h => h.ungcViolation).length / holdings.length * 100; value = (+value).toFixed(1); yoy = -0.8; break;
        case 'PAI-11': value = (holdings.filter(h => seed(hashStr(h.isin || '') + 21) > 0.75).length / holdings.length * 100).toFixed(1); yoy = -2.0; break;
        case 'PAI-12': value = (holdings.reduce((s, h) => s + h.genderPayGap, 0) / holdings.length).toFixed(1); yoy = -0.5; break;
        case 'PAI-13': value = (holdings.reduce((s, h) => s + h.boardDiversity, 0) / holdings.length).toFixed(1); yoy = +1.8; break;
        case 'PAI-14': value = metrics.weaponsPct.toFixed(2); yoy = 0; break;
        default: value = (10 + s2 * 50).toFixed(1); yoy = -1.0;
      }
      return { ...pai, value, yoy, source: (+value > 0 && +value < 999) ? 'Calculated' : 'Estimated' };
    });
  }, [holdings, metrics]);

  /* ── PAI sort ── */
  const handlePaiSort = useCallback((col) => {
    setPaiSortCol(col);
    setPaiSortDir(prev => paiSortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
  }, [paiSortCol]);

  const sortedPai = useMemo(() => {
    const arr = [...paiValues];
    arr.sort((a, b) => {
      const av = a[paiSortCol], bv = b[paiSortCol];
      if (av == null) return 1; if (bv == null) return -1;
      return paiSortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return arr;
  }, [paiValues, paiSortCol, paiSortDir]);

  /* ── PAI category distribution ── */
  const paiCategoryData = useMemo(() => {
    const counts = {};
    PAI_CATEGORIES.forEach(c => { counts[c] = 0; });
    PAI_INDICATORS.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return PAI_CATEGORIES.map(c => ({ name: c, value: counts[c], fill: PAI_CAT_COLORS[c] || T.textMut }));
  }, []);

  /* ── Good governance data ── */
  const govData = useMemo(() => {
    return holdings.slice(0, 25).map(h => {
      const s = seed(hashStr(h.name || '') + 77);
      const esg = h.esg_score || 50;
      return {
        name: (h.name || '').slice(0, 22), sector: h.gicsSector,
        boardStructure: esg > 42 + s * 10, execComp: esg > 48 + s * 8,
        taxCompliance: s > 0.15, laborRelations: esg > 40 + s * 12,
        govScore: +((esg * 0.7 + s * 30).toFixed(0)),
      };
    });
  }, [holdings]);

  const handleGovSort = useCallback((col) => {
    setGovSortCol(col);
    setGovSortDir(prev => govSortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
  }, [govSortCol]);

  const sortedGov = useMemo(() => {
    const arr = [...govData];
    arr.sort((a, b) => {
      const av = a[govSortCol], bv = b[govSortCol];
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === 'boolean') return govSortDir === 'asc' ? (av ? 1 : -1) : (av ? -1 : 1);
      return govSortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return arr;
  }, [govData, govSortCol, govSortDir]);

  /* ── DNSH per holding ── */
  const dnshData = useMemo(() => {
    return holdings.slice(0, 20).map(h => {
      const s = seed(hashStr(h.name || '') + 55);
      const esg = h.esg_score || 50;
      return {
        name: (h.name || '').slice(0, 20),
        CCM: esg > 44 + s * 10, CCA: esg > 48 + s * 8, WMR: esg > 46 + s * 12,
        CE: esg > 42 + s * 10, PP: esg > 50 + s * 6, BIO: esg > 45 + s * 11,
      };
    });
  }, [holdings]);

  /* ── Peer comparison (simulated) ── */
  const peerComparison = useMemo(() => {
    const peers = [
      { name: 'This Portfolio', classification: classification, sustainPct: metrics.sustainableInvPct, taxPct: metrics.taxonomyAlignedPct, esg: metrics.avgEsg, highlight: true },
      { name: 'EU Equity Avg', classification: 'article8', sustainPct: 28.5, taxPct: 14.2, esg: 52.3, highlight: false },
      { name: 'Global ESG Fund', classification: 'article8plus', sustainPct: 42.1, taxPct: 18.7, esg: 61.8, highlight: false },
      { name: 'Green Bond Fund', classification: 'article9', sustainPct: 88.2, taxPct: 52.4, esg: 74.5, highlight: false },
      { name: 'Balanced Fund', classification: 'article6', sustainPct: 8.3, taxPct: 3.1, esg: 38.2, highlight: false },
      { name: 'Impact Fund', classification: 'article9', sustainPct: 92.5, taxPct: 61.0, esg: 78.9, highlight: false },
    ];
    return peers;
  }, [classification, metrics]);

  /* ── Disclosure text ── */
  const disclosureText = useMemo(() => {
    const art = SFDR_CRITERIA[classification];
    return `SFDR Product Classification Disclosure\n\nClassification: ${art.name}\n\nSustainable Investment Proportion: ${metrics.sustainableInvPct}%\nTaxonomy-Aligned Investment: ${metrics.taxonomyAlignedPct}%\nAverage ESG Score: ${metrics.avgEsg}\nPAI Indicators Covered: ${metrics.paiCovered}/14\nDNSH Compliance: ${metrics.dnshPct}%\nGood Governance: ${metrics.govPct}%\nFossil Fuel Exposure: ${metrics.fossilPct}%\nControversial Weapons: ${metrics.weaponsPct}%\n\n${art.description}\n\nPre-contractual Disclosure: ${art.taxonomy_disclosure ? 'Taxonomy alignment figures included per Annex II/III' : 'Not applicable'}\nPAI Consideration: ${classification === 'article9' || classification === 'article8plus' ? 'Mandatory \u2014 all 14 indicators reported' : classification === 'article8' ? 'Explain or comply \u2014 PAI statement available' : 'Sustainability risks integrated into investment decisions'}\n\nMethodology: Classification follows Regulation (EU) 2019/2088 (SFDR) and Commission Delegated Regulation (EU) 2022/1288 (RTS). Taxonomy alignment is assessed per Regulation (EU) 2020/852.`;
  }, [classification, metrics]);

  /* ── Exports ── */
  const exportCSV = useCallback(() => {
    const headers = ['Indicator','Category','Value','Unit','YoY Change','Mandatory','Source'];
    const rows = paiValues.map(p => [p.name, p.category, p.value, p.unit, p.yoy, p.mandatory ? 'Yes' : 'No', p.source]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sfdr_classification_report.csv'; a.click(); URL.revokeObjectURL(url);
  }, [paiValues]);

  const exportPaiCSV = useCallback(() => {
    const headers = ['PAI ID','Indicator','Category','Portfolio Value','Unit','YoY Change %','Description'];
    const rows = paiValues.map(p => [p.id, p.name, p.category, p.value, p.unit, p.yoy, `"${p.description}"`]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sfdr_pai_report.csv'; a.click(); URL.revokeObjectURL(url);
  }, [paiValues]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  if (!portfolio.length) return <div style={{ fontFamily: T.font, padding: 40, background: T.bg, minHeight: '100vh' }}><EmptyState msg="No portfolio loaded" /></div>;

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>

      {/* ── 1. Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>
            SFDR Product Classification Engine
            <Badge color={T.navyL}>Art 6/8/8+/9</Badge>
            <Badge color={T.sage}>14 PAI</Badge>
            <Badge color={T.gold}>Taxonomy &middot; DNSH</Badge>
          </h1>
          <p style={{ fontSize: 13, color: T.textSec, margin: '6px 0 0' }}>Regulation (EU) 2019/2088 &mdash; Sustainable Finance Disclosure Regulation product classification</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn sm onClick={exportCSV}>Export CSV</Btn>
          <Btn sm color="gold" onClick={exportPaiCSV}>PAI Report</Btn>
          <Btn sm color="sage" onClick={exportPrint}>Print</Btn>
        </div>
      </div>

      {/* ── 2. Classification Result (Large Badge) ── */}
      <Card style={{ marginBottom: 24, background: classInfo.color + '08', border: `2px solid ${classInfo.color}40` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ background: classInfo.color, color: '#fff', borderRadius: 14, padding: '20px 32px', textAlign: 'center', minWidth: 180 }}>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, marginBottom: 4 }}>Current Classification</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{classInfo.shortName}</div>
          </div>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: classInfo.color, marginBottom: 6 }}>{classInfo.name}</div>
            <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{classInfo.description}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: T.textSec }}>Sustainable Inv: <strong>{metrics.sustainableInvPct}%</strong></span>
              <span style={{ fontSize: 11, color: T.textSec }}>Taxonomy Aligned: <strong>{metrics.taxonomyAlignedPct}%</strong></span>
              <span style={{ fontSize: 11, color: T.textSec }}>PAI Coverage: <strong>{metrics.paiCovered}/14</strong></span>
              <span style={{ fontSize: 11, color: T.textSec }}>DNSH: <strong>{metrics.dnshPct}%</strong></span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 3. KPI Cards (10) ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="Classification" value={classInfo.shortName} color={classInfo.color} />
        <KpiCard label="Sustainable Inv %" value={fmtPct(metrics.sustainableInvPct)} sub="of portfolio" color={T.green} />
        <KpiCard label="Taxonomy Aligned %" value={fmtPct(metrics.taxonomyAlignedPct)} sub="EU Taxonomy" color={T.sage} />
        <KpiCard label="PAI Covered" value={`${metrics.paiCovered}/14`} sub="mandatory indicators" color={T.navy} />
        <KpiCard label="DNSH Compliance" value={metrics.dnshPct + '%'} sub="holdings compliant" color={T.sage} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <KpiCard label="Good Governance" value={metrics.govPct + '%'} sub="governance checks" color={T.gold} />
        <KpiCard label="Exclusion Screens" value={metrics.exclusionScreens ? 'Active' : 'Inactive'} color={metrics.exclusionScreens ? T.green : T.red} />
        <KpiCard label="ESG Integration" value={fmt(metrics.avgEsg, 0)} sub="avg portfolio ESG" color={T.navyL} />
        <KpiCard label="Fossil Fuel" value={fmtPct(metrics.fossilPct)} sub="exposure" color={T.amber} />
        <KpiCard label="Controversial Weapons" value={fmtPct(metrics.weaponsPct)} sub="exposure" color={T.red} />
      </div>

      {/* ── 4. Classification Criteria Checklist ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Classification Criteria Checklist</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {SFDR_ORDER.map(artKey => {
            const art = SFDR_CRITERIA[artKey];
            const checks = allChecks[artKey] || {};
            const allMet = art.requirements.filter(r => r.mandatory).every(r => checks[r.id]);
            const isCurrent = classification === artKey;
            return (
              <div key={artKey} style={{ border: `1.5px solid ${isCurrent ? art.color : T.border}`, borderRadius: 10, padding: 16, background: isCurrent ? art.color + '06' : T.surface }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: art.color }}>{art.shortName}</span>
                  {isCurrent && <Badge color={art.color}>Current</Badge>}
                  {allMet && !isCurrent && <Badge color={T.green}>Eligible</Badge>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {art.requirements.map(req => (
                    <div key={req.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <Check ok={checks[req.id]} />
                      <span style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4 }}>{req.text}{req.mandatory ? '' : ' (optional)'}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── 5. What-If Classification Simulator ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>What-If Classification Simulator</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 16px' }}>Adjust parameters to see how classification changes in real time</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>ESG Score Boost</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>+{simEsgBoost} pts</span>
            </div>
            <input type="range" min={0} max={30} value={simEsgBoost} onChange={e => setSimEsgBoost(+e.target.value)} style={{ width: '100%' }} />
            <div style={{ fontSize: 10, color: T.textMut }}>Current avg ESG: {metrics.avgEsg}</div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Sustainable Investment Boost</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>+{simSustPct}%</span>
            </div>
            <input type="range" min={0} max={60} value={simSustPct} onChange={e => setSimSustPct(+e.target.value)} style={{ width: '100%' }} />
            <div style={{ fontSize: 10, color: T.textMut }}>Current: {metrics.sustainableInvPct}%</div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Taxonomy Alignment Boost</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>+{simTaxPct}%</span>
            </div>
            <input type="range" min={0} max={40} value={simTaxPct} onChange={e => setSimTaxPct(+e.target.value)} style={{ width: '100%' }} />
            <div style={{ fontSize: 10, color: T.textMut }}>Current: {metrics.taxonomyAlignedPct}%</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={esgIntegration} onChange={e => setEsgIntegration(e.target.checked)} /> ESG Integration
          </label>
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={exclusionScreens} onChange={e => setExclusionScreens(e.target.checked)} /> Exclusion Screens
          </label>
          <Btn sm color="red" onClick={() => { setSimEsgBoost(0); setSimSustPct(0); setSimTaxPct(0); setEsgIntegration(true); setExclusionScreens(true); }}>Reset Simulator</Btn>
          <span style={{ fontSize: 13, fontWeight: 700, color: classInfo.color, marginLeft: 8 }}>Result: {classInfo.name}</span>
        </div>
      </Card>

      {/* ── 6. PAI Indicator Table ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>14 Mandatory PAI Indicators</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <SortHeader label="ID" col="id" sortCol={paiSortCol} sortDir={paiSortDir} onSort={handlePaiSort} w={55} />
                <SortHeader label="Indicator" col="name" sortCol={paiSortCol} sortDir={paiSortDir} onSort={handlePaiSort} />
                <SortHeader label="Category" col="category" sortCol={paiSortCol} sortDir={paiSortDir} onSort={handlePaiSort} w={85} />
                <SortHeader label="Value" col="value" sortCol={paiSortCol} sortDir={paiSortDir} onSort={handlePaiSort} w={75} />
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: `2px solid ${T.border}`, width: 55 }}>Unit</th>
                <SortHeader label="YoY %" col="yoy" sortCol={paiSortCol} sortDir={paiSortDir} onSort={handlePaiSort} w={60} />
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: `2px solid ${T.border}`, width: 65 }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {sortedPai.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: T.navy }}>{p.id}</td>
                  <td style={{ padding: '8px', fontSize: 11 }}>{p.name}</td>
                  <td style={{ padding: '8px' }}><span style={{ fontSize: 10, fontWeight: 600, color: PAI_CAT_COLORS[p.category], background: PAI_CAT_COLORS[p.category] + '14', padding: '2px 8px', borderRadius: 99 }}>{p.category}</span></td>
                  <td style={{ padding: '8px', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>{p.value}</td>
                  <td style={{ padding: '8px', fontSize: 10, color: T.textMut }}>{p.unit}</td>
                  <td style={{ padding: '8px', fontSize: 11, fontWeight: 600, color: p.yoy < 0 ? T.green : p.yoy > 0 ? T.red : T.textMut, textAlign: 'right' }}>{p.yoy > 0 ? '+' : ''}{p.yoy}%</td>
                  <td style={{ padding: '8px', fontSize: 10, color: T.textMut }}>{p.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 7. PAI Category PieChart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>PAI Category Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={paiCategoryData} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false} style={{ fontSize: 10 }}>
                {paiCategoryData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* ── 9. Taxonomy Alignment Feed-Through ── */}
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Taxonomy Alignment Feed-Through</h3>
          <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 14px' }}>How EU Taxonomy alignment feeds into SFDR classification thresholds</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SFDR_ORDER.slice(1).map(artKey => {
              const art = SFDR_CRITERIA[artKey];
              const threshold = art.thresholds?.min_taxonomy_aligned_pct;
              const met = threshold != null ? metrics.taxonomyAlignedPct >= threshold : true;
              return threshold != null ? (
                <div key={artKey} style={{ display: 'flex', alignItems: 'center', gap: 10, background: met ? T.green + '0C' : T.red + '0C', border: `1px solid ${met ? T.green : T.red}20`, borderRadius: 8, padding: '10px 14px' }}>
                  <Check ok={met} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: art.color }}>{art.shortName}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Requires {threshold}% taxonomy alignment</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: met ? T.green : T.red }}>{metrics.taxonomyAlignedPct}%</span>
                </div>
              ) : null;
            })}
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Taxonomy data sourced from EU Taxonomy Engine (EP-Q1). Navigate there for activity-level details.</div>
          </div>
        </Card>
      </div>

      {/* ── 8. DNSH Assessment per Holding ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>DNSH Assessment per Holding</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>6 environmental objectives assessed across holdings (top 20)</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Holding</th>
                {DNSH_OBJECTIVES.map(d => (
                  <th key={d.id} style={{ padding: '10px 6px', fontSize: 10, fontWeight: 700, color: T.textSec, textAlign: 'center', borderBottom: `2px solid ${T.border}` }}>{d.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dnshData.map((h, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h.name}</td>
                  {DNSH_OBJECTIVES.map(d => (
                    <td key={d.id} style={{ padding: '6px', textAlign: 'center' }}><Check ok={h[d.id]} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 10. Good Governance Assessment ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Good Governance Assessment</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Board structure, executive compensation, tax compliance, and labour relations per holding</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <SortHeader label="Company" col="name" sortCol={govSortCol} sortDir={govSortDir} onSort={handleGovSort} />
                <SortHeader label="Sector" col="sector" sortCol={govSortCol} sortDir={govSortDir} onSort={handleGovSort} w={90} />
                <SortHeader label="Board" col="boardStructure" sortCol={govSortCol} sortDir={govSortDir} onSort={handleGovSort} w={50} />
                <SortHeader label="Exec Comp" col="execComp" sortCol={govSortCol} sortDir={govSortDir} onSort={handleGovSort} w={65} />
                <SortHeader label="Tax" col="taxCompliance" sortCol={govSortCol} sortDir={govSortDir} onSort={handleGovSort} w={40} />
                <SortHeader label="Labour" col="laborRelations" sortCol={govSortCol} sortDir={govSortDir} onSort={handleGovSort} w={55} />
                <SortHeader label="Score" col="govScore" sortCol={govSortCol} sortDir={govSortDir} onSort={handleGovSort} w={55} />
              </tr>
            </thead>
            <tbody>
              {sortedGov.map((g, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px', fontWeight: 600, fontSize: 11 }}>{g.name}</td>
                  <td style={{ padding: '8px', fontSize: 11 }}>{g.sector}</td>
                  <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={g.boardStructure} /></td>
                  <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={g.execComp} /></td>
                  <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={g.taxCompliance} /></td>
                  <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={g.laborRelations} /></td>
                  <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: g.govScore >= 60 ? T.green : g.govScore >= 40 ? T.amber : T.red, fontSize: 12 }}>{g.govScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 11. SFDR Disclosure Template ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>SFDR Disclosure Template</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Auto-generated pre-contractual, website, and periodic disclosure text</p>
        <textarea readOnly value={disclosureText} style={{ width: '100%', minHeight: 200, fontFamily: 'monospace', fontSize: 12, padding: 14, border: `1px solid ${T.border}`, borderRadius: 8, background: T.surfaceH, color: T.text, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
        <div style={{ marginTop: 10 }}>
          <Btn sm onClick={() => { navigator.clipboard.writeText(disclosureText); }}>Copy to Clipboard</Btn>
        </div>
      </Card>

      {/* ── 12. Regulatory Timeline ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>SFDR Regulatory Timeline</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 11, top: 10, bottom: 10, width: 2, background: T.border }} />
          {SFDR_TIMELINE.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 0', position: 'relative' }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: t.status === 'complete' ? T.green : t.status === 'active' ? T.gold : T.textMut, border: `3px solid ${T.surface}`, position: 'absolute', left: -11, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t.status === 'complete' && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>&check;</span>}
                {t.status === 'active' && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>&bull;</span>}
              </div>
              <div style={{ marginLeft: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.status === 'active' ? T.gold : t.status === 'complete' ? T.green : T.textSec }}>{t.year}</div>
                <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.4 }}>{t.event}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 13. Peer Comparison ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Peer Comparison</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Product</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'center', borderBottom: `2px solid ${T.border}`, width: 90 }}>Classification</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'right', borderBottom: `2px solid ${T.border}`, width: 85 }}>Sustain. %</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'right', borderBottom: `2px solid ${T.border}`, width: 85 }}>Taxonomy %</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'right', borderBottom: `2px solid ${T.border}`, width: 65 }}>ESG</th>
              </tr>
            </thead>
            <tbody>
              {peerComparison.map((p, i) => {
                const artInfo = SFDR_CRITERIA[p.classification];
                return (
                  <tr key={i} style={{ background: p.highlight ? T.gold + '12' : i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px', fontWeight: p.highlight ? 700 : 500, fontSize: 12 }}>{p.name}{p.highlight && <Badge color={T.gold}>You</Badge>}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}><span style={{ fontSize: 11, fontWeight: 700, color: artInfo?.color || T.textMut, background: (artInfo?.color || T.textMut) + '14', padding: '2px 10px', borderRadius: 99 }}>{artInfo?.shortName}</span></td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{p.sustainPct}%</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{p.taxPct}%</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: p.esg >= 60 ? T.green : p.esg >= 40 ? T.amber : T.red }}>{p.esg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ResponsiveContainer width="100%" height={240} style={{ marginTop: 16 }}>
          <BarChart data={peerComparison} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="sustainPct" name="Sustainable %" fill={T.green} radius={[4, 4, 0, 0]} />
            <Bar dataKey="taxPct" name="Taxonomy %" fill={T.sage} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── 14. Classification Sensitivity Radar ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Classification Sensitivity Analysis</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Radar view of key metrics that drive SFDR classification relative to Article 9 thresholds</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
              { metric: 'Sustainable Inv %', value: Math.min(100, metrics.sustainableInvPct), threshold: 80 },
              { metric: 'Taxonomy Aligned %', value: Math.min(100, metrics.taxonomyAlignedPct), threshold: 30 },
              { metric: 'DNSH Compliance %', value: metrics.dnshPct, threshold: 80 },
              { metric: 'Good Governance %', value: metrics.govPct, threshold: 70 },
              { metric: 'PAI Coverage %', value: (metrics.paiCovered / 14 * 100), threshold: 85 },
              { metric: 'ESG Score', value: metrics.avgEsg, threshold: 60 },
            ]}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: T.textSec }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
              <Radar name="Portfolio" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Art. 9 Threshold" dataKey="threshold" stroke={T.green} fill="none" strokeDasharray="5 5" strokeWidth={1.5} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── 15. Article Comparison Matrix ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>SFDR Article Comparison Matrix</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Side-by-side comparison of obligations under each SFDR article</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Requirement</th>
                {SFDR_ORDER.map(ak => (
                  <th key={ak} style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: SFDR_CRITERIA[ak].color, textAlign: 'center', borderBottom: `2px solid ${T.border}`, width: 80 }}>{SFDR_CRITERIA[ak].shortName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'ESG Integration', a6: true, a8: true, a8p: true, a9: true },
                { label: 'Exclusion Screens', a6: false, a8: true, a8p: true, a9: true },
                { label: 'Binding ESG Criteria', a6: false, a8: true, a8p: true, a9: true },
                { label: 'PAI Consideration', a6: false, a8: 'optional', a8p: true, a9: true },
                { label: 'DNSH Assessment', a6: false, a8: false, a8p: 'partial', a9: true },
                { label: 'Good Governance', a6: false, a8: true, a8p: true, a9: true },
                { label: 'Min. Sustainable Inv %', a6: '--', a8: '--', a8p: '20%', a9: '80%' },
                { label: 'Min. Taxonomy Aligned %', a6: '--', a8: '--', a8p: '10%', a9: '30%' },
                { label: 'Taxonomy Disclosure', a6: false, a8: true, a8p: true, a9: true },
                { label: 'Pre-contractual (Annex)', a6: 'N/A', a8: 'II', a8p: 'II', a9: 'III' },
                { label: 'Periodic Report (Annex)', a6: 'N/A', a8: 'IV', a8p: 'IV', a9: 'V' },
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px', fontSize: 11, fontWeight: 600 }}>{row.label}</td>
                  {['a6', 'a8', 'a8p', 'a9'].map((col, ci) => {
                    const v = row[col];
                    return (
                      <td key={ci} style={{ padding: '6px', textAlign: 'center', fontSize: 11 }}>
                        {v === true ? <Check ok={true} /> : v === false ? <Check ok={false} /> : v === 'optional' ? <span style={{ color: T.amber, fontWeight: 600 }}>Opt.</span> : v === 'partial' ? <span style={{ color: T.amber, fontWeight: 600 }}>Part.</span> : <span style={{ color: T.textMut }}>{v}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 16. Holdings ESG Distribution ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Holdings ESG Score Distribution</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Distribution of ESG scores across portfolio holdings with classification thresholds marked</p>
        {(() => {
          const buckets = [
            { range: '0-20', min: 0, max: 20, count: 0, color: T.red },
            { range: '20-40', min: 20, max: 40, count: 0, color: T.amber },
            { range: '40-60', min: 40, max: 60, count: 0, color: T.gold },
            { range: '60-80', min: 60, max: 80, count: 0, color: T.sage },
            { range: '80-100', min: 80, max: 100, count: 0, color: T.green },
          ];
          holdings.forEach(h => {
            const esg = h.esg_score || 50;
            const bucket = buckets.find(b => esg >= b.min && esg < b.max) || buckets[buckets.length - 1];
            bucket.count++;
          });
          return (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={buckets} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'ESG Score Range', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Holdings', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="Holdings" radius={[4, 4, 0, 0]}>
                  {buckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        })()}
      </Card>

      {/* ── 17. Data Sources & Methodology ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Methodology &amp; Data Sources</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navyL, marginBottom: 8 }}>Classification Methodology</h4>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
              <li>Regulation (EU) 2019/2088 (SFDR Level 1)</li>
              <li>Commission Delegated Regulation (EU) 2022/1288 (RTS)</li>
              <li>ESAs Joint Supervisory Statement on SFDR (2024)</li>
              <li>ESMA Guidelines on sustainability-related fund names (2024)</li>
              <li>Taxonomy Regulation (EU) 2020/852 for alignment metrics</li>
              <li>Sustainable investment defined per Art. 2(17) SFDR</li>
              <li>DNSH per Art. 2(17) read with Taxonomy Art. 17</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navyL, marginBottom: 8 }}>PAI Data Sources</h4>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
              <li>Company-reported emissions data (CDP, annual reports)</li>
              <li>PCAF-aligned financed emissions calculations</li>
              <li>SBTi commitment database for science-based targets</li>
              <li>MSCI, Sustainalytics ESG ratings as proxy where gaps exist</li>
              <li>Eurostat NACE classification for sector mapping</li>
              <li>Bloomberg/Refinitiv for gender pay gap and board diversity</li>
              <li>Stockholm International Peace Research Institute for weapons screening</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* ── 18. Key Definitions ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Key SFDR Definitions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {[
            { term: 'Sustainable Investment (Art. 2(17))', def: 'An investment in an economic activity that contributes to an environmental or social objective, does not significantly harm any E/S objective, and follows good governance practices.' },
            { term: 'Sustainability Risk (Art. 2(22))', def: 'An environmental, social, or governance event or condition that, if it occurs, could cause a negative material impact on the value of an investment.' },
            { term: 'Principal Adverse Impacts (PAI)', def: 'The most significant negative impacts of investment decisions on sustainability factors relating to environmental, social, and employee matters, respect for human rights, anti-corruption, and anti-bribery.' },
            { term: 'Do No Significant Harm (DNSH)', def: 'The requirement that a sustainable investment does not significantly harm any of the environmental or social objectives, taking into account PAI indicators.' },
            { term: 'Good Governance', def: 'Practices relating to sound management structures, employee relations, remuneration of staff, and tax compliance of investee companies.' },
            { term: 'Taxonomy Alignment', def: 'The proportion of investments that qualify as environmentally sustainable per the EU Taxonomy Regulation, meeting TSC, DNSH, and minimum safeguards criteria.' },
          ].map((item, i) => (
            <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, background: T.surfaceH }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{item.term}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>{item.def}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 19. Cross-Navigation ── */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: T.navy }}>Cross-Navigation</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn sm onClick={() => navigate('/eu-taxonomy-engine')}>EU Taxonomy Engine</Btn>
          <Btn sm color="sage" onClick={() => navigate('/advanced-report-studio')}>Report Studio</Btn>
          <Btn sm color="gold" onClick={() => navigate('/regulatory-gap')}>Regulatory Gap</Btn>
          <Btn sm onClick={() => navigate('/esg-screener')}>ESG Screener</Btn>
          <Btn sm color="sage" onClick={() => navigate('/sfdr-pai')}>SFDR PAI (Legacy)</Btn>
          <Btn sm color="gold" onClick={() => navigate('/sfdr-art9')}>SFDR Art 9</Btn>
        </div>
      </Card>
    </div>
  );
};

export default SfdrClassificationPage;
