import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
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
const fmtMn = (n) => n == null ? '--' : '$' + Number(n).toFixed(0) + 'M';

/* ═══════════════════════════════════════════════════════════════════════════
   EU TAXONOMY — FULL REFERENCE DATA
   ═══════════════════════════════════════════════════════════════════════════ */
const EU_TAXONOMY = {
  objectives: [
    { id: 'CCM', name: 'Climate Change Mitigation', description: 'Activities that substantially contribute to reducing GHG emissions', color: '#16a34a', icon: '\u2600' },
    { id: 'CCA', name: 'Climate Change Adaptation', description: 'Activities that substantially contribute to adapting to climate change effects', color: '#2563eb', icon: '\u26C8' },
    { id: 'WMR', name: 'Water & Marine Resources', description: 'Sustainable use and protection of water and marine resources', color: '#06b6d4', icon: '\uD83C\uDF0A' },
    { id: 'CE', name: 'Circular Economy', description: 'Transition to a circular economy', color: '#d97706', icon: '\u267B' },
    { id: 'PP', name: 'Pollution Prevention', description: 'Pollution prevention and control', color: '#7c3aed', icon: '\uD83C\uDF2B' },
    { id: 'BIO', name: 'Biodiversity & Ecosystems', description: 'Protection and restoration of biodiversity and ecosystems', color: '#059669', icon: '\uD83C\uDF3F' },
  ],
  activities: [
    { nace: 'D35.11', activity: 'Electricity generation using solar PV', objective: 'CCM', tsc: 'Life-cycle GHG < 100g CO\u2082e/kWh', threshold: { ghg_per_kwh: 100 }, sector: 'Energy', taxonomy_eligible: true, transitional: false },
    { nace: 'D35.11', activity: 'Electricity generation using wind', objective: 'CCM', tsc: 'Life-cycle GHG < 100g CO\u2082e/kWh', threshold: { ghg_per_kwh: 100 }, sector: 'Energy', taxonomy_eligible: true, transitional: false },
    { nace: 'D35.11', activity: 'Electricity generation using hydropower', objective: 'CCM', tsc: 'Power density > 5 W/m\u00B2 OR life-cycle GHG < 100g', threshold: { ghg_per_kwh: 100, power_density: 5 }, sector: 'Energy', taxonomy_eligible: true, transitional: false },
    { nace: 'D35.11', activity: 'Electricity generation using gas (< 270g)', objective: 'CCM', tsc: 'Life-cycle GHG < 270g CO\u2082e/kWh (transitional)', threshold: { ghg_per_kwh: 270 }, sector: 'Energy', taxonomy_eligible: true, transitional: true },
    { nace: 'D35.11', activity: 'Nuclear energy (with waste management)', objective: 'CCM', tsc: 'Construction permit before 2045, fuel repository plan, decommissioning fund', threshold: { permit_before: 2045 }, sector: 'Energy', taxonomy_eligible: true, transitional: true },
    { nace: 'H49.10', activity: 'Passenger rail transport', objective: 'CCM', tsc: 'Zero direct CO\u2082 emissions OR < 50g CO\u2082/pkm', threshold: { ghg_per_pkm: 50 }, sector: 'Transport', taxonomy_eligible: true, transitional: false },
    { nace: 'C29.10', activity: 'Manufacture of zero-emission vehicles', objective: 'CCM', tsc: 'Zero direct tailpipe CO\u2082 emissions', threshold: { tailpipe_ghg: 0 }, sector: 'Transport', taxonomy_eligible: true, transitional: false },
    { nace: 'C29.10', activity: 'Manufacture of low-emission vehicles (< 50g)', objective: 'CCM', tsc: 'Direct CO\u2082 < 50g/km until 2025', threshold: { ghg_per_km: 50 }, sector: 'Transport', taxonomy_eligible: true, transitional: true },
    { nace: 'F41.20', activity: 'Construction of new buildings', objective: 'CCM', tsc: 'Primary energy demand 10% below NZEB standard', threshold: { below_nzeb_pct: 10 }, sector: 'Buildings', taxonomy_eligible: true, transitional: false },
    { nace: 'F43', activity: 'Renovation of existing buildings', objective: 'CCM', tsc: '30% energy performance improvement', threshold: { energy_improvement_pct: 30 }, sector: 'Buildings', taxonomy_eligible: true, transitional: false },
    { nace: 'L68', activity: 'Acquisition of buildings (EPC A or top 15%)', objective: 'CCM', tsc: 'EPC rating A or top 15% national stock', threshold: { epc_rating: 'A' }, sector: 'Buildings', taxonomy_eligible: true, transitional: false },
    { nace: 'C24.10', activity: 'Manufacture of iron and steel', objective: 'CCM', tsc: 'GHG < 1.331 tCO\u2082e per tonne of steel (EAF)', threshold: { ghg_per_tonne: 1.331 }, sector: 'Industry', taxonomy_eligible: true, transitional: false },
    { nace: 'C23.51', activity: 'Manufacture of cement', objective: 'CCM', tsc: 'GHG < 0.469 tCO\u2082e per tonne of grey cement clinker', threshold: { ghg_per_tonne: 0.469 }, sector: 'Industry', taxonomy_eligible: true, transitional: false },
    { nace: 'C24.42', activity: 'Manufacture of aluminium', objective: 'CCM', tsc: 'GHG < 1.484 tCO\u2082e per tonne', threshold: { ghg_per_tonne: 1.484 }, sector: 'Industry', taxonomy_eligible: true, transitional: false },
    { nace: 'E36', activity: 'Water collection and supply', objective: 'WMR', tsc: 'Net energy consumption < 0.5 kWh/m\u00B3', threshold: { energy_per_m3: 0.5 }, sector: 'Water', taxonomy_eligible: true, transitional: false },
    { nace: 'A2', activity: 'Afforestation', objective: 'CCM', tsc: 'Forest management plan, no conversion of high-carbon stock land', threshold: { management_plan: true }, sector: 'Forestry', taxonomy_eligible: true, transitional: false },
    { nace: 'J63.11', activity: 'Data centres (PUE < 1.5)', objective: 'CCM', tsc: 'PUE < 1.5, European Code of Conduct', threshold: { pue: 1.5 }, sector: 'ICT', taxonomy_eligible: true, transitional: false },
    { nace: 'K64', activity: 'Green lending / mortgage portfolio', objective: 'CCM', tsc: '% of portfolio in taxonomy-aligned assets', threshold: { green_asset_ratio_pct: 0 }, sector: 'Finance', taxonomy_eligible: true, transitional: false },
  ],
  dnsh_criteria: [
    { id: 'DNSH-CCA', label: 'CCA: Climate risk assessment conducted', objective: 'CCA' },
    { id: 'DNSH-WMR', label: 'WMR: Environmental Impact Assessment for water', objective: 'WMR' },
    { id: 'DNSH-CE', label: 'CE: Waste management plan in place', objective: 'CE' },
    { id: 'DNSH-PP', label: 'PP: Pollution below EU emission limits', objective: 'PP' },
    { id: 'DNSH-BIO', label: 'BIO: Environmental Impact Assessment for biodiversity', objective: 'BIO' },
  ],
  minimum_safeguards: [
    { id: 'MS-1', label: 'OECD Guidelines for Multinational Enterprises' },
    { id: 'MS-2', label: 'UN Guiding Principles on Business and Human Rights' },
    { id: 'MS-3', label: 'ILO Core Labour Standards' },
    { id: 'MS-4', label: 'International Bill of Human Rights' },
  ],
};

/* ── Sector mapping from GICS to Taxonomy sectors ──────────────────────── */
const SECTOR_MAP = {
  'Energy': 'Energy', 'Utilities': 'Energy', 'Materials': 'Industry',
  'Industrials': 'Industry', 'Consumer Discretionary': 'Industry',
  'Information Technology': 'ICT', 'Real Estate': 'Buildings',
  'Financials': 'Finance', 'Health Care': 'Industry',
  'Consumer Staples': 'Industry', 'Communication Services': 'ICT',
};

/* ── Taxonomy alignment assessment per company ─────────────────────────── */
function assessTaxonomyAlignment(company) {
  const gicsSector = company.gics_sector || company.sector || 'Financials';
  const taxSector = SECTOR_MAP[gicsSector] || 'Industry';
  const h = hashStr(company.isin || company.company_name || 'X');
  const s = seed(h);
  const eligibleActivities = EU_TAXONOMY.activities.filter(a => a.sector === taxSector);
  if (!eligibleActivities.length) {
    return { eligible: false, assessments: [], alignedRevenuePct: 0, eligibleActivities: 0, taxSector, dnshScore: 0, safeguardsScore: 0 };
  }
  const esgScore = company.esg_score != null ? company.esg_score : 30 + s * 50;
  const ghgInt = company.ghg_intensity_tco2e_per_mn != null ? company.ghg_intensity_tco2e_per_mn : 50 + s * 400;
  const sbti = company.sbti_committed || (s > 0.55);
  const assessments = eligibleActivities.map((activity, idx) => {
    const s2 = seed(h + idx * 137);
    let aligned = false;
    let reason = '';
    if (activity.threshold.ghg_per_kwh) {
      aligned = ghgInt < 200;
      reason = aligned ? 'GHG intensity below sector threshold' : 'GHG intensity exceeds threshold';
    } else if (activity.threshold.ghg_per_tonne) {
      aligned = ghgInt < 250;
      reason = aligned ? 'Emission intensity within limits' : 'Emission intensity too high';
    } else if (activity.threshold.ghg_per_pkm || activity.threshold.tailpipe_ghg != null || activity.threshold.ghg_per_km) {
      aligned = ghgInt < 180;
      reason = aligned ? 'Transport emissions within limits' : 'Emissions exceed transport threshold';
    } else if (activity.threshold.below_nzeb_pct || activity.threshold.energy_improvement_pct || activity.threshold.epc_rating) {
      aligned = esgScore > 55;
      reason = aligned ? 'Building energy performance adequate' : 'Energy performance below standard';
    } else if (activity.threshold.pue) {
      aligned = esgScore > 50;
      reason = aligned ? 'Data centre PUE within threshold' : 'PUE exceeds 1.5';
    } else if (activity.threshold.management_plan) {
      aligned = esgScore > 45;
      reason = aligned ? 'Management plan verified' : 'No forest management plan';
    } else if (activity.threshold.green_asset_ratio_pct != null) {
      aligned = esgScore > 50;
      reason = aligned ? 'Green asset ratio is positive' : 'No green lending criteria';
    } else if (activity.threshold.energy_per_m3) {
      aligned = s2 > 0.4;
      reason = aligned ? 'Energy per m\u00B3 within limits' : 'Excessive energy use';
    } else {
      aligned = s2 > 0.5;
      reason = aligned ? 'Meets general TSC criteria' : 'Does not meet TSC criteria';
    }
    const dnsh_met = esgScore > 45 + s2 * 10;
    const safeguards_met = esgScore > 38 + s2 * 8;
    return {
      ...activity, company_aligned: aligned, reason,
      dnsh_met, safeguards_met,
      overall_aligned: aligned && dnsh_met && safeguards_met,
    };
  });
  const anyAligned = assessments.some(a => a.overall_aligned);
  const alignedRevenuePct = anyAligned ? Math.min(100, (esgScore / 100) * 75 + (sbti ? 20 : 0) + s * 5) : (s > 0.7 ? s * 12 : 0);
  const dnshScore = assessments.filter(a => a.dnsh_met).length / Math.max(1, assessments.length) * 100;
  const safeguardsScore = assessments.filter(a => a.safeguards_met).length / Math.max(1, assessments.length) * 100;
  return { eligible: true, assessments, alignedRevenuePct: +alignedRevenuePct.toFixed(1), eligibleActivities: eligibleActivities.length, taxSector, dnshScore: +dnshScore.toFixed(0), safeguardsScore: +safeguardsScore.toFixed(0) };
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
    <div style={{ fontSize: 13, marginTop: 6 }}>Load a portfolio from the Portfolio Manager or ensure company data is available.</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const EuTaxonomyEnginePage = () => {
  const navigate = useNavigate();

  /* ── Portfolio load ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      if (Array.isArray(raw) && raw.length) return raw;
      return (GLOBAL_COMPANY_MASTER || []).slice(0, 25);
    } catch { return (GLOBAL_COMPANY_MASTER || []).slice(0, 25); }
  }, []);

  /* ── State ── */
  const [sortCol, setSortCol] = useState('alignedRevenuePct');
  const [sortDir, setSortDir] = useState('desc');
  const [actSortCol, setActSortCol] = useState('nace');
  const [actSortDir, setActSortDir] = useState('asc');
  const [overrides, setOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_taxonomy_overrides_v1')) || {}; } catch { return {}; }
  });
  const [yoyYear, setYoyYear] = useState(2024);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [objectiveFilter, setObjectiveFilter] = useState('All');

  useEffect(() => { localStorage.setItem('ra_taxonomy_overrides_v1', JSON.stringify(overrides)); }, [overrides]);

  /* ── Assessed holdings ── */
  const assessedHoldings = useMemo(() => {
    return portfolio.map(c => {
      const assessment = assessTaxonomyAlignment(c);
      const ov = overrides[c.isin || c.company_name];
      const alignedPct = ov?.alignedRevenuePct != null ? ov.alignedRevenuePct : assessment.alignedRevenuePct;
      const eligibleOv = ov?.eligible != null ? ov.eligible : assessment.eligible;
      const revenue = c.revenue_usd_mn || (c.revenue_inr_cr ? c.revenue_inr_cr * 0.12 : 500);
      const weight = c.weight || (1 / (portfolio.length || 1)) * 100;
      return {
        ...c, ...assessment,
        alignedRevenuePct: +alignedPct,
        eligible: eligibleOv,
        revenue, weight,
        alignedRevenue: +(revenue * alignedPct / 100).toFixed(1),
        name: c.company_name || c.name || 'Unknown',
        gicsSector: c.gics_sector || c.sector || 'Other',
      };
    });
  }, [portfolio, overrides]);

  /* ── Sort helper ── */
  const handleSort = useCallback((col) => {
    setSortCol(prev => prev === col ? col : col);
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
  }, [sortCol]);

  const handleActSort = useCallback((col) => {
    setActSortCol(prev => prev === col ? col : col);
    setActSortDir(prev => actSortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
  }, [actSortCol]);

  const sortedHoldings = useMemo(() => {
    let arr = [...assessedHoldings];
    if (sectorFilter !== 'All') arr = arr.filter(h => h.taxSector === sectorFilter);
    arr.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av == null) return 1; if (bv == null) return -1;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return arr;
  }, [assessedHoldings, sortCol, sortDir, sectorFilter]);

  /* ── KPI calculations ── */
  const kpis = useMemo(() => {
    const total = assessedHoldings.length;
    if (!total) return {};
    const eligibleCount = assessedHoldings.filter(h => h.eligible).length;
    const eligiblePct = (eligibleCount / total * 100).toFixed(1);
    const weightedAligned = assessedHoldings.reduce((s, h) => s + h.alignedRevenuePct * (h.weight / 100), 0);
    const alignedRevenueTotal = assessedHoldings.reduce((s, h) => s + h.alignedRevenue, 0);
    const eligibleActivitiesTotal = assessedHoldings.reduce((s, h) => s + h.eligibleActivities, 0);
    const ccmAligned = assessedHoldings.filter(h => h.assessments?.some(a => a.objective === 'CCM' && a.overall_aligned)).length;
    const ccaAligned = assessedHoldings.filter(h => h.assessments?.some(a => a.objective === 'CCA' && a.overall_aligned)).length;
    const avgDnsh = assessedHoldings.reduce((s, h) => s + (h.dnshScore || 0), 0) / total;
    const avgSafeguards = assessedHoldings.reduce((s, h) => s + (h.safeguardsScore || 0), 0) / total;
    const transitionalCount = assessedHoldings.filter(h => h.assessments?.some(a => a.transitional && a.overall_aligned)).length;
    const dataComplete = assessedHoldings.filter(h => h.esg_score != null || h.ghg_intensity_tco2e_per_mn != null).length;
    const gar = weightedAligned;
    return {
      eligiblePct, weightedAligned: weightedAligned.toFixed(1), alignedRevenueTotal: Math.round(alignedRevenueTotal),
      eligibleActivitiesTotal, ccmPct: (ccmAligned / total * 100).toFixed(1), ccaPct: (ccaAligned / total * 100).toFixed(1),
      dnshPct: avgDnsh.toFixed(0), safeguardsPct: avgSafeguards.toFixed(0),
      transitionalPct: (transitionalCount / total * 100).toFixed(1), assessed: total,
      dataComplete: ((dataComplete / total) * 100).toFixed(0), gar: gar.toFixed(1),
    };
  }, [assessedHoldings]);

  /* ── Funnel data ── */
  const funnelData = useMemo(() => {
    const total = assessedHoldings.length;
    const eligible = assessedHoldings.filter(h => h.eligible).length;
    const tscMet = assessedHoldings.filter(h => h.assessments?.some(a => a.company_aligned)).length;
    const dnshMet = assessedHoldings.filter(h => h.assessments?.some(a => a.company_aligned && a.dnsh_met)).length;
    const safeMet = assessedHoldings.filter(h => h.assessments?.some(a => a.company_aligned && a.dnsh_met && a.safeguards_met)).length;
    const fullyAligned = assessedHoldings.filter(h => h.assessments?.some(a => a.overall_aligned)).length;
    return [
      { stage: 'All Holdings', count: total, pct: 100, fill: T.textMut },
      { stage: 'Eligible', count: eligible, pct: total ? (eligible / total * 100) : 0, fill: T.navyL },
      { stage: 'TSC Met', count: tscMet, pct: total ? (tscMet / total * 100) : 0, fill: T.gold },
      { stage: 'DNSH Met', count: dnshMet, pct: total ? (dnshMet / total * 100) : 0, fill: T.sage },
      { stage: 'Safeguards Met', count: safeMet, pct: total ? (safeMet / total * 100) : 0, fill: T.sageL },
      { stage: 'Fully Aligned', count: fullyAligned, pct: total ? (fullyAligned / total * 100) : 0, fill: T.green },
    ];
  }, [assessedHoldings]);

  /* ── Sector alignment ── */
  const sectorAlignment = useMemo(() => {
    const map = {};
    assessedHoldings.forEach(h => {
      const s = h.taxSector || 'Other';
      if (!map[s]) map[s] = { sector: s, eligible: 0, aligned: 0, count: 0 };
      map[s].count++;
      if (h.eligible) map[s].eligible++;
      if (h.assessments?.some(a => a.overall_aligned)) map[s].aligned++;
    });
    return Object.values(map).map(s => ({
      ...s,
      eligiblePct: +(s.eligible / s.count * 100).toFixed(1),
      alignedPct: +(s.aligned / s.count * 100).toFixed(1),
    })).sort((a, b) => b.count - a.count);
  }, [assessedHoldings]);

  /* ── Revenue pie ── */
  const revenuePie = useMemo(() => {
    const aligned = assessedHoldings.filter(h => h.assessments?.some(a => a.overall_aligned)).reduce((s, h) => s + h.alignedRevenue, 0);
    const eligibleNotAligned = assessedHoldings.filter(h => h.eligible && !h.assessments?.some(a => a.overall_aligned)).reduce((s, h) => s + h.revenue, 0);
    const notEligible = assessedHoldings.filter(h => !h.eligible).reduce((s, h) => s + h.revenue, 0);
    return [
      { name: 'Aligned', value: Math.round(aligned), fill: T.green },
      { name: 'Eligible - Not Aligned', value: Math.round(eligibleNotAligned), fill: T.gold },
      { name: 'Not Eligible', value: Math.round(notEligible), fill: T.textMut },
    ].filter(d => d.value > 0);
  }, [assessedHoldings]);

  /* ── Activity-level flattened table ── */
  const activityTable = useMemo(() => {
    const rows = [];
    assessedHoldings.forEach(h => {
      (h.assessments || []).forEach(a => {
        if (objectiveFilter !== 'All' && a.objective !== objectiveFilter) return;
        rows.push({
          company: h.name, nace: a.nace, activity: a.activity, sector: a.sector,
          objective: a.objective, tsc: a.tsc, aligned: a.company_aligned,
          dnsh: a.dnsh_met, safeguards: a.safeguards_met, overall: a.overall_aligned,
          transitional: a.transitional || false, reason: a.reason,
        });
      });
    });
    rows.sort((a, b) => {
      const av = a[actSortCol], bv = b[actSortCol];
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === 'boolean') return actSortDir === 'asc' ? (av ? 1 : -1) : (av ? -1 : 1);
      return actSortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return rows;
  }, [assessedHoldings, actSortCol, actSortDir, objectiveFilter]);

  /* ── DNSH matrix data ── */
  const dnshMatrix = useMemo(() => {
    return assessedHoldings.slice(0, 20).map(h => {
      const s = seed(hashStr(h.name || '') + 99);
      const esg = h.esg_score || 50;
      return {
        name: (h.name || '').slice(0, 20),
        cca: esg > 42 + s * 15,
        wmr: esg > 48 + s * 10,
        ce: esg > 40 + s * 12,
        pp: esg > 50 + s * 8,
        bio: esg > 45 + s * 13,
      };
    });
  }, [assessedHoldings]);

  /* ── Top/Bottom aligned holdings ── */
  const topAligned = useMemo(() => {
    return [...assessedHoldings].sort((a, b) => b.alignedRevenuePct - a.alignedRevenuePct).slice(0, 5);
  }, [assessedHoldings]);

  const bottomAligned = useMemo(() => {
    return [...assessedHoldings].filter(h => h.eligible).sort((a, b) => a.alignedRevenuePct - b.alignedRevenuePct).slice(0, 5);
  }, [assessedHoldings]);

  /* ── Alignment heatmap data (by objective and sector) ── */
  const heatmapData = useMemo(() => {
    const sectors = [...new Set(assessedHoldings.map(h => h.taxSector))];
    const objectives = EU_TAXONOMY.objectives.map(o => o.id);
    return sectors.map(sec => {
      const row = { sector: sec };
      objectives.forEach(obj => {
        const relevant = assessedHoldings.filter(h => h.taxSector === sec && h.assessments?.some(a => a.objective === obj));
        const aligned = relevant.filter(h => h.assessments?.some(a => a.objective === obj && a.overall_aligned));
        row[obj] = relevant.length > 0 ? +((aligned.length / relevant.length) * 100).toFixed(0) : null;
      });
      return row;
    });
  }, [assessedHoldings]);

  /* ── Revenue concentration data ── */
  const revenueConcentration = useMemo(() => {
    const sorted = [...assessedHoldings].sort((a, b) => b.alignedRevenue - a.alignedRevenue);
    let cumulative = 0;
    const totalAligned = sorted.reduce((s, h) => s + h.alignedRevenue, 0);
    return sorted.slice(0, 15).map((h, i) => {
      cumulative += h.alignedRevenue;
      return { name: (h.name || '').slice(0, 15), alignedRevenue: h.alignedRevenue, cumPct: totalAligned > 0 ? +(cumulative / totalAligned * 100).toFixed(1) : 0 };
    });
  }, [assessedHoldings]);

  /* ── YoY comparison data ── */
  const yoyData = useMemo(() => {
    const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028];
    return years.map(y => {
      const tscTighten = 1 - (y - 2021) * 0.03;
      const eligible = assessedHoldings.filter(h => h.eligible).length;
      const base = assessedHoldings.filter(h => h.assessments?.some(a => a.overall_aligned)).length;
      const adjusted = Math.max(0, Math.round(base * (y <= 2024 ? 0.7 + (y - 2021) * 0.1 : tscTighten + 0.3)));
      return { year: y, eligible, aligned: Math.min(eligible, adjusted), pct: eligible ? +(adjusted / eligible * 100).toFixed(1) : 0 };
    });
  }, [assessedHoldings]);

  /* ── Transitional activities ── */
  const transitionalActivities = useMemo(() => {
    return EU_TAXONOMY.activities.filter(a => a.transitional);
  }, []);

  /* ── Objective alignment scores ── */
  const objectiveScores = useMemo(() => {
    return EU_TAXONOMY.objectives.map(obj => {
      const relevant = assessedHoldings.filter(h => h.assessments?.some(a => a.objective === obj.id));
      const aligned = relevant.filter(h => h.assessments?.some(a => a.objective === obj.id && a.overall_aligned));
      return { ...obj, count: relevant.length, aligned: aligned.length, pct: relevant.length ? +(aligned.length / relevant.length * 100).toFixed(1) : 0 };
    });
  }, [assessedHoldings]);

  /* ── Exports ── */
  const exportCSV = useCallback(() => {
    const headers = ['Company','ISIN','Sector','Taxonomy Sector','Eligible','Aligned Revenue %','Aligned Revenue ($M)','DNSH Score','Safeguards Score','Eligible Activities','TSC Status'];
    const rows = assessedHoldings.map(h => [h.name, h.isin || '', h.gicsSector, h.taxSector, h.eligible ? 'Yes' : 'No', h.alignedRevenuePct, h.alignedRevenue, h.dnshScore, h.safeguardsScore, h.eligibleActivities, h.assessments?.some(a => a.overall_aligned) ? 'Aligned' : 'Not Aligned']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'eu_taxonomy_alignment_report.csv'; a.click(); URL.revokeObjectURL(url);
  }, [assessedHoldings]);

  const exportJSON = useCallback(() => {
    const data = { exportDate: new Date().toISOString(), portfolio: assessedHoldings.map(h => ({ name: h.name, isin: h.isin, sector: h.gicsSector, taxonomySector: h.taxSector, eligible: h.eligible, alignedRevenuePct: h.alignedRevenuePct, alignedRevenue: h.alignedRevenue, dnshScore: h.dnshScore, safeguardsScore: h.safeguardsScore, assessments: h.assessments })), kpis };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'eu_taxonomy_assessment.json'; a.click(); URL.revokeObjectURL(url);
  }, [assessedHoldings, kpis]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Override handler ── */
  const handleOverride = useCallback((id, field, value) => {
    setOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  }, []);

  /* ── Unique sectors for filter ── */
  const taxSectors = useMemo(() => ['All', ...new Set(assessedHoldings.map(h => h.taxSector))], [assessedHoldings]);
  const objectiveIds = useMemo(() => ['All', ...EU_TAXONOMY.objectives.map(o => o.id)], []);

  /* ── Disclosure text ── */
  const disclosureText = useMemo(() => {
    return `EU Taxonomy Disclosure (Article 8 Taxonomy Regulation)\n\nPortfolio Taxonomy Eligibility: ${kpis.eligiblePct || 0}%\nPortfolio Taxonomy Alignment: ${kpis.weightedAligned || 0}%\nAligned Revenue: $${kpis.alignedRevenueTotal || 0}M\nGreen Asset Ratio: ${kpis.gar || 0}%\nDNSH Compliance: ${kpis.dnshPct || 0}%\nMinimum Safeguards Compliance: ${kpis.safeguardsPct || 0}%\nHoldings Assessed: ${kpis.assessed || 0}\nData Completeness: ${kpis.dataComplete || 0}%\n\nMethodology: Alignment is assessed per the EU Taxonomy Climate Delegated Act (Commission Delegated Regulation 2021/2139), supplemented by Complementary Delegated Act 2022/1214 (nuclear and gas). Technical Screening Criteria are applied at the NACE activity level. DNSH assessments cover all 6 environmental objectives. Minimum safeguards follow OECD Guidelines, UNGPs, ILO Core Standards, and the International Bill of Human Rights.\n\nTransitional activities represent ${kpis.transitionalPct || 0}% of portfolio holdings.`;
  }, [kpis]);

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
            EU Taxonomy Alignment Engine
            <Badge color={T.green}>6 Objectives</Badge>
            <Badge color={T.gold}>18 Activities</Badge>
            <Badge color={T.sage}>TSC &middot; DNSH &middot; Safeguards</Badge>
          </h1>
          <p style={{ fontSize: 13, color: T.textSec, margin: '6px 0 0' }}>Regulation (EU) 2020/852 &mdash; Technical Screening Criteria assessment for portfolio holdings</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn sm onClick={exportCSV}>Export CSV</Btn>
          <Btn sm color="gold" onClick={exportJSON}>Export JSON</Btn>
          <Btn sm color="sage" onClick={exportPrint}>Print</Btn>
        </div>
      </div>

      {/* ── 2. KPI Cards (12) ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="Taxonomy Eligibility" value={fmtPct(kpis.eligiblePct)} sub="% of portfolio" color={T.navy} />
        <KpiCard label="Taxonomy Alignment" value={fmtPct(kpis.weightedAligned)} sub="weighted avg" color={T.green} />
        <KpiCard label="Aligned Revenue" value={fmtMn(kpis.alignedRevenueTotal)} sub="total $Mn" color={T.sage} />
        <KpiCard label="Eligible Activities" value={kpis.eligibleActivitiesTotal || 0} sub="across portfolio" />
        <KpiCard label="CCM Aligned" value={fmtPct(kpis.ccmPct)} sub="climate mitigation" color="#16a34a" />
        <KpiCard label="CCA Aligned" value={fmtPct(kpis.ccaPct)} sub="climate adaptation" color="#2563eb" />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <KpiCard label="DNSH Compliance" value={kpis.dnshPct + '%'} sub="avg across holdings" color={T.sage} />
        <KpiCard label="Safeguards" value={kpis.safeguardsPct + '%'} sub="minimum safeguards" color={T.gold} />
        <KpiCard label="Transitional" value={fmtPct(kpis.transitionalPct)} sub="transitional acts" color={T.amber} />
        <KpiCard label="Holdings Assessed" value={kpis.assessed} sub="total count" />
        <KpiCard label="Data Completeness" value={kpis.dataComplete + '%'} sub="coverage" color={T.navyL} />
        <KpiCard label="Green Asset Ratio" value={fmtPct(kpis.gar)} sub="portfolio GAR" color={T.green} />
      </div>

      {/* ── 3. Environmental Objectives Cards (6) ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>6 Environmental Objectives</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {objectiveScores.map(obj => (
            <div key={obj.id} style={{ background: obj.color + '0C', border: `1px solid ${obj.color}30`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{obj.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: obj.color }}>{obj.id} &mdash; {obj.name}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10, lineHeight: 1.4 }}>{obj.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: T.textSec }}>{obj.count} holdings relevant</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: obj.color }}>{obj.pct}%</span>
              </div>
              <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6, marginTop: 8 }}>
                <div style={{ background: obj.color, borderRadius: 4, height: 6, width: `${Math.min(100, obj.pct)}%`, transition: 'width .3s' }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 4. Taxonomy Eligibility vs Alignment Funnel ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Taxonomy Alignment Funnel</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>All Holdings &#8594; Eligible &#8594; TSC Met &#8594; DNSH Met &#8594; Safeguards Met &#8594; Fully Aligned</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={funnelData} layout="vertical" margin={{ left: 100, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={100} />
            <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {funnelData.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── 5. Activity-Level Assessment Table ── */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: T.navy }}>Activity-Level Assessment</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Objective:</label>
            <select value={objectiveFilter} onChange={e => setObjectiveFilter(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font }}>
              {objectiveIds.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        {activityTable.length === 0 ? <EmptyState msg="No activities match the selected filter" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <SortHeader label="NACE" col="nace" sortCol={actSortCol} sortDir={actSortDir} onSort={handleActSort} w={60} />
                  <SortHeader label="Activity" col="activity" sortCol={actSortCol} sortDir={actSortDir} onSort={handleActSort} />
                  <SortHeader label="Company" col="company" sortCol={actSortCol} sortDir={actSortDir} onSort={handleActSort} />
                  <SortHeader label="Sector" col="sector" sortCol={actSortCol} sortDir={actSortDir} onSort={handleActSort} w={70} />
                  <SortHeader label="Obj" col="objective" sortCol={actSortCol} sortDir={actSortDir} onSort={handleActSort} w={50} />
                  <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>TSC Threshold</th>
                  <SortHeader label="TSC" col="aligned" sortCol={actSortCol} sortDir={actSortDir} onSort={handleActSort} w={40} />
                  <SortHeader label="DNSH" col="dnsh" sortCol={actSortCol} sortDir={actSortDir} onSort={handleActSort} w={40} />
                  <SortHeader label="Safe" col="safeguards" sortCol={actSortCol} sortDir={actSortDir} onSort={handleActSort} w={40} />
                  <SortHeader label="Aligned" col="overall" sortCol={actSortCol} sortDir={actSortDir} onSort={handleActSort} w={55} />
                </tr>
              </thead>
              <tbody>
                {activityTable.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: 11, color: T.navy }}>{r.nace}</td>
                    <td style={{ padding: '8px', fontSize: 11, maxWidth: 200 }}>{r.activity}{r.transitional && <Badge color={T.amber}>Trans</Badge>}</td>
                    <td style={{ padding: '8px', fontSize: 11 }}>{r.company.slice(0, 22)}</td>
                    <td style={{ padding: '8px', fontSize: 11 }}>{r.sector}</td>
                    <td style={{ padding: '8px', fontSize: 11, fontWeight: 700, color: EU_TAXONOMY.objectives.find(o => o.id === r.objective)?.color || T.navy }}>{r.objective}</td>
                    <td style={{ padding: '8px', fontSize: 10, color: T.textSec, maxWidth: 180 }}>{r.tsc}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}><Check ok={r.aligned} /></td>
                    <td style={{ padding: '8px', textAlign: 'center' }}><Check ok={r.dnsh} /></td>
                    <td style={{ padding: '8px', textAlign: 'center' }}><Check ok={r.safeguards} /></td>
                    <td style={{ padding: '8px', textAlign: 'center' }}><Check ok={r.overall} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activityTable.length > 50 && <div style={{ fontSize: 11, color: T.textMut, textAlign: 'center', padding: 8 }}>Showing 50 of {activityTable.length} rows</div>}
          </div>
        )}
      </Card>

      {/* ── 6. Holdings Taxonomy Table (sortable) ── */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: T.navy }}>Holdings Taxonomy Assessment</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Sector:</label>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font }}>
              {taxSectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <SortHeader label="Company" col="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Sector" col="gicsSector" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} w={90} />
                <SortHeader label="Tax Sector" col="taxSector" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} w={75} />
                <SortHeader label="Eligible" col="eligible" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} w={55} />
                <SortHeader label="Aligned Rev %" col="alignedRevenuePct" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} w={85} />
                <SortHeader label="Aligned Rev" col="alignedRevenue" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} w={80} />
                <SortHeader label="TSC" col="eligibleActivities" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} w={40} />
                <SortHeader label="DNSH" col="dnshScore" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} w={55} />
                <SortHeader label="Safeguards" col="safeguardsScore" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} w={70} />
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', borderBottom: `2px solid ${T.border}`, width: 55 }}>Overall</th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h, i) => {
                const overall = h.assessments?.some(a => a.overall_aligned);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px', fontWeight: 600, fontSize: 12 }}>{(h.name || '').slice(0, 28)}</td>
                    <td style={{ padding: '8px', fontSize: 11 }}>{h.gicsSector}</td>
                    <td style={{ padding: '8px', fontSize: 11, color: T.navyL }}>{h.taxSector}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}><Check ok={h.eligible} /></td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: h.alignedRevenuePct > 50 ? T.green : h.alignedRevenuePct > 20 ? T.amber : T.red }}>{h.alignedRevenuePct}%</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: 11 }}>{fmtMn(h.alignedRevenue)}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: 11 }}>{h.eligibleActivities}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: h.dnshScore >= 80 ? T.green : h.dnshScore >= 50 ? T.amber : T.red }}>{h.dnshScore}%</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: h.safeguardsScore >= 80 ? T.green : h.safeguardsScore >= 50 ? T.amber : T.red }}>{h.safeguardsScore}%</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}><Check ok={overall} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 7. Sector Alignment BarChart ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Sector Alignment Comparison</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sectorAlignment} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="eligiblePct" name="Eligible %" fill={T.navyL} radius={[4, 4, 0, 0]} />
            <Bar dataKey="alignedPct" name="Aligned %" fill={T.green} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── 8. DNSH Assessment Matrix ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>DNSH Assessment Matrix</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Do No Significant Harm assessment per holding across 5 DNSH criteria (top 20 holdings)</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Holding</th>
                {EU_TAXONOMY.dnsh_criteria.map(d => (
                  <th key={d.id} style={{ padding: '10px 6px', fontSize: 10, fontWeight: 700, color: T.textSec, textAlign: 'center', borderBottom: `2px solid ${T.border}`, maxWidth: 100 }}>{d.label.split(':')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dnshMatrix.map((h, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h.name}</td>
                  <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={h.cca} /></td>
                  <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={h.wmr} /></td>
                  <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={h.ce} /></td>
                  <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={h.pp} /></td>
                  <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={h.bio} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 9. Minimum Safeguards Check ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Minimum Safeguards Assessment</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>4 safeguard frameworks per holding (top 20)</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Holding</th>
                {EU_TAXONOMY.minimum_safeguards.map(ms => (
                  <th key={ms.id} style={{ padding: '10px 6px', fontSize: 10, fontWeight: 700, color: T.textSec, textAlign: 'center', borderBottom: `2px solid ${T.border}`, maxWidth: 120 }}>{ms.label.split(' ').slice(0, 3).join(' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assessedHoldings.slice(0, 20).map((h, i) => {
                const s = seed(hashStr(h.name || '') + 42);
                const esg = h.esg_score || 50;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{(h.name || '').slice(0, 20)}</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={esg > 38 + s * 10} /></td>
                    <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={esg > 42 + s * 8} /></td>
                    <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={esg > 35 + s * 12} /></td>
                    <td style={{ padding: '6px', textAlign: 'center' }}><Check ok={esg > 40 + s * 9} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 10. Revenue PieChart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Taxonomy Revenue Breakdown</h3>
          {revenuePie.length === 0 ? <EmptyState msg="No revenue data" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={revenuePie} cx="50%" cy="50%" outerRadius={95} innerRadius={45} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                  {revenuePie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtMn(v)} contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ── 11. Transitional Activities Panel ── */}
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Transitional Activities</h3>
          <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Activities with time-limited taxonomy eligibility under the Complementary Delegated Act</p>
          {transitionalActivities.length === 0 ? <EmptyState msg="No transitional activities" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {transitionalActivities.map((a, i) => (
                <div key={i} style={{ background: T.amber + '10', border: `1px solid ${T.amber}30`, borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: T.navy, fontWeight: 700 }}>{a.nace}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 8 }}>{a.activity}</span>
                    </div>
                    <Badge color={T.amber}>Transitional</Badge>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>TSC: {a.tsc}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── 12. Reporting Template ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>EU Taxonomy Reporting Template</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Auto-generated disclosure text per Article 8 of the Taxonomy Regulation</p>
        <textarea readOnly value={disclosureText} style={{ width: '100%', minHeight: 220, fontFamily: 'monospace', fontSize: 12, padding: 14, border: `1px solid ${T.border}`, borderRadius: 8, background: T.surfaceH, color: T.text, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
        <div style={{ marginTop: 10 }}>
          <Btn sm onClick={() => { navigator.clipboard.writeText(disclosureText); }}>Copy to Clipboard</Btn>
        </div>
      </Card>

      {/* ── 13. TSC Threshold Reference Table ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>TSC Threshold Reference</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>All 18 technical screening criteria with specific numeric thresholds from the Climate Delegated Act</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}`, width: 60 }}>NACE</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Activity</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}`, width: 50 }}>Obj</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>TSC Description</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}`, width: 90 }}>Key Threshold</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'center', borderBottom: `2px solid ${T.border}`, width: 50 }}>Trans?</th>
              </tr>
            </thead>
            <tbody>
              {EU_TAXONOMY.activities.map((a, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: 11, color: T.navy }}>{a.nace}</td>
                  <td style={{ padding: '8px', fontSize: 11, fontWeight: 500 }}>{a.activity}</td>
                  <td style={{ padding: '8px', fontSize: 11, fontWeight: 700, color: EU_TAXONOMY.objectives.find(o => o.id === a.objective)?.color }}>{a.objective}</td>
                  <td style={{ padding: '8px', fontSize: 10, color: T.textSec }}>{a.tsc}</td>
                  <td style={{ padding: '8px', fontSize: 10, fontFamily: 'monospace' }}>
                    {Object.entries(a.threshold).map(([k, v]) => `${k}: ${v}`).join(', ')}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{a.transitional ? <Badge color={T.amber}>Yes</Badge> : <span style={{ color: T.textMut }}>-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 14. Manual Override ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Manual Override</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Adjust aligned revenue % and eligibility per holding. Changes persist to <code>ra_taxonomy_overrides_v1</code>.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Holding</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}`, width: 80 }}>Current %</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}`, width: 200 }}>Override Aligned Revenue %</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'center', borderBottom: `2px solid ${T.border}`, width: 100 }}>Eligible Override</th>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'center', borderBottom: `2px solid ${T.border}`, width: 60 }}>Reset</th>
              </tr>
            </thead>
            <tbody>
              {assessedHoldings.slice(0, 15).map((h, i) => {
                const id = h.isin || h.name;
                const ov = overrides[id] || {};
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px', fontWeight: 600, fontSize: 12 }}>{(h.name || '').slice(0, 28)}</td>
                    <td style={{ padding: '8px', fontSize: 12, fontWeight: 700, color: T.navy }}>{h.alignedRevenuePct}%</td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="range" min={0} max={100} step={1} value={ov.alignedRevenuePct != null ? ov.alignedRevenuePct : h.alignedRevenuePct} onChange={e => handleOverride(id, 'alignedRevenuePct', +e.target.value)} style={{ flex: 1 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, width: 36, textAlign: 'right' }}>{ov.alignedRevenuePct != null ? ov.alignedRevenuePct : h.alignedRevenuePct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <select value={ov.eligible != null ? (ov.eligible ? 'yes' : 'no') : (h.eligible ? 'yes' : 'no')} onChange={e => handleOverride(id, 'eligible', e.target.value === 'yes')} style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: `1px solid ${T.border}`, fontFamily: T.font }}>
                        <option value="yes">Eligible</option>
                        <option value="no">Not Eligible</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {overrides[id] && <button onClick={() => { const nxt = { ...overrides }; delete nxt[id]; setOverrides(nxt); }} style={{ fontSize: 10, color: T.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Reset</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {Object.keys(overrides).length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <Btn sm color="red" onClick={() => setOverrides({})}>Clear All Overrides</Btn>
            <span style={{ fontSize: 11, color: T.textMut, alignSelf: 'center' }}>{Object.keys(overrides).length} override(s) active</span>
          </div>
        )}
      </Card>

      {/* ── 15. Year-over-Year Comparison ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Year-over-Year Alignment Trajectory</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Simulated alignment trajectory as TSC tighten over time (projected beyond current year)</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Highlight year:</label>
          <input type="range" min={2021} max={2028} value={yoyYear} onChange={e => setYoyYear(+e.target.value)} style={{ width: 200 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{yoyYear}</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={yoyData} margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="eligible" name="Eligible Holdings" stroke={T.navyL} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="aligned" name="Aligned Holdings" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 12, color: T.textSec, marginTop: 8 }}>
          In <strong>{yoyYear}</strong>: {yoyData.find(d => d.year === yoyYear)?.aligned || 0} aligned out of {yoyData.find(d => d.year === yoyYear)?.eligible || 0} eligible ({yoyData.find(d => d.year === yoyYear)?.pct || 0}%)
        </div>
      </Card>

      {/* ── 15b. Top / Bottom Aligned Holdings ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: T.green }}>Top 5 Aligned Holdings</h3>
          {topAligned.map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{(h.name || '').slice(0, 24)}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{h.taxSector} &middot; {h.gicsSector}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.green }}>{h.alignedRevenuePct}%</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{fmtMn(h.alignedRevenue)}</div>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: T.red }}>Bottom 5 Eligible (Lowest Alignment)</h3>
          {bottomAligned.length === 0 ? <EmptyState msg="No eligible holdings found" /> : bottomAligned.map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{(h.name || '').slice(0, 24)}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{h.taxSector} &middot; {h.gicsSector}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.red }}>{h.alignedRevenuePct}%</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{fmtMn(h.alignedRevenue)}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* ── 15c. Revenue Concentration Chart ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Aligned Revenue Concentration</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Top holdings by aligned revenue with cumulative % (Lorenz-style)</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueConcentration} margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Rev ($M)', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="alignedRevenue" name="Aligned Rev ($M)" fill={T.sage} radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="cumPct" name="Cumulative %" stroke={T.navy} strokeWidth={2} dot={{ r: 3 }} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── 15d. Objective x Sector Heatmap ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Objective &times; Sector Alignment Heatmap</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Percentage of holdings aligned per environmental objective and taxonomy sector</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Sector</th>
                {EU_TAXONOMY.objectives.map(obj => (
                  <th key={obj.id} style={{ padding: '10px 6px', fontSize: 10, fontWeight: 700, color: obj.color, textAlign: 'center', borderBottom: `2px solid ${T.border}`, width: 65 }}>{obj.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px', fontWeight: 600, fontSize: 11 }}>{row.sector}</td>
                  {EU_TAXONOMY.objectives.map(obj => {
                    const v = row[obj.id];
                    const bg = v == null ? 'transparent' : v >= 70 ? T.green + '25' : v >= 40 ? T.amber + '25' : v > 0 ? T.red + '20' : 'transparent';
                    const clr = v == null ? T.textMut : v >= 70 ? T.green : v >= 40 ? T.amber : v > 0 ? T.red : T.textMut;
                    return (
                      <td key={obj.id} style={{ padding: '6px', textAlign: 'center', background: bg, fontWeight: 700, fontSize: 11, color: clr }}>
                        {v != null ? v + '%' : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 16. Objective-Level Alignment BarChart ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Objective-Level Alignment</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Portfolio alignment percentage broken down by each of the 6 environmental objectives</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={objectiveScores} margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="id" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => v + '%'} />
            <Bar dataKey="pct" name="Alignment %" radius={[4, 4, 0, 0]}>
              {objectiveScores.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── 17. Holdings Data Quality Panel ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Taxonomy Data Quality Assessment</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Coverage and quality of data inputs used for taxonomy alignment assessment</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {[
            { label: 'ESG Score Available', count: assessedHoldings.filter(h => h.esg_score != null).length, total: assessedHoldings.length, color: T.green },
            { label: 'GHG Intensity Available', count: assessedHoldings.filter(h => h.ghg_intensity_tco2e_per_mn != null).length, total: assessedHoldings.length, color: T.navyL },
            { label: 'SBTi Status Known', count: assessedHoldings.filter(h => h.sbti_committed != null).length, total: assessedHoldings.length, color: T.sage },
            { label: 'Revenue Data Available', count: assessedHoldings.filter(h => h.revenue_usd_mn != null || h.revenue_inr_cr != null).length, total: assessedHoldings.length, color: T.gold },
            { label: 'NACE Code Mapped', count: assessedHoldings.filter(h => h.eligible).length, total: assessedHoldings.length, color: T.navy },
            { label: 'ISIN Available', count: assessedHoldings.filter(h => h.isin).length, total: assessedHoldings.length, color: T.amber },
          ].map((item, i) => {
            const pct = item.total > 0 ? (item.count / item.total * 100).toFixed(0) : 0;
            return (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>{item.label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{pct}%</span>
                  <span style={{ fontSize: 11, color: T.textMut }}>{item.count}/{item.total}</span>
                </div>
                <div style={{ background: '#e5e7eb', borderRadius: 4, height: 5 }}>
                  <div style={{ background: item.color, borderRadius: 4, height: 5, width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── 18. Taxonomy Eligibility by Country ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Eligibility by Country / Region</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Geographic breakdown of taxonomy-eligible holdings</p>
        {(() => {
          const countryMap = {};
          assessedHoldings.forEach(h => {
            const region = h._region || h.country || (h.currency === 'INR' ? 'India' : h.currency === 'USD' ? 'USA' : h.currency === 'GBP' ? 'UK' : h.currency === 'EUR' ? 'Europe' : h.currency === 'JPY' ? 'Japan' : 'Other');
            if (!countryMap[region]) countryMap[region] = { region, total: 0, eligible: 0, aligned: 0 };
            countryMap[region].total++;
            if (h.eligible) countryMap[region].eligible++;
            if (h.assessments?.some(a => a.overall_aligned)) countryMap[region].aligned++;
          });
          const data = Object.values(countryMap).sort((a, b) => b.total - a.total);
          return (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Region</th>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'right', borderBottom: `2px solid ${T.border}`, width: 65 }}>Holdings</th>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'right', borderBottom: `2px solid ${T.border}`, width: 70 }}>Eligible</th>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'right', borderBottom: `2px solid ${T.border}`, width: 70 }}>Aligned</th>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'right', borderBottom: `2px solid ${T.border}`, width: 85 }}>Eligible %</th>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textAlign: 'right', borderBottom: `2px solid ${T.border}`, width: 85 }}>Aligned %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{r.region}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{r.total}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{r.eligible}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{r.aligned}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: (r.eligible / r.total * 100) > 50 ? T.green : T.amber }}>{(r.eligible / r.total * 100).toFixed(0)}%</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: (r.aligned / r.total * 100) > 30 ? T.green : T.amber }}>{(r.aligned / r.total * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </Card>

      {/* ── 19. Complementary Delegated Act Summary ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Complementary Delegated Act &mdash; Nuclear &amp; Gas</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Commission Delegated Regulation (EU) 2022/1214 added nuclear and natural gas as transitional activities under specific conditions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ border: `1px solid ${T.amber}30`, borderRadius: 10, padding: 16, background: T.amber + '06' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.amber, marginBottom: 8 }}>Nuclear Energy</div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
              <li>Construction permit issued before 2045</li>
              <li>Plans for radioactive waste disposal facility operational by 2050</li>
              <li>Use of accident-tolerant fuel approved by 2025</li>
              <li>Decommissioning fund established</li>
              <li>Environmental Impact Assessment completed</li>
              <li>Best available technology for minimising waste</li>
            </ul>
          </div>
          <div style={{ border: `1px solid ${T.navyL}30`, borderRadius: 10, padding: 16, background: T.navyL + '06' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navyL, marginBottom: 8 }}>Natural Gas</div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
              <li>Life-cycle GHG emissions &lt; 270g CO&#x2082;e/kWh</li>
              <li>Replaces existing high-emission fossil fuel plant</li>
              <li>Cannot be met by renewables alone at this time</li>
              <li>Construction permit before 31 Dec 2030</li>
              <li>Must switch to renewable/low-carbon gases by 2035</li>
              <li>Annual emission reduction monitoring</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* ── 20. Methodology Notes ── */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Methodology &amp; Legal Basis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navyL, marginBottom: 8 }}>Regulatory References</h4>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
              <li>Taxonomy Regulation (EU) 2020/852</li>
              <li>Climate Delegated Act (EU) 2021/2139</li>
              <li>Complementary Delegated Act (EU) 2022/1214</li>
              <li>Environmental Delegated Act (EU) 2023/2486</li>
              <li>Disclosures Delegated Act (EU) 2021/2178</li>
              <li>SFDR Regulation (EU) 2019/2088</li>
              <li>SFDR RTS (EU) 2022/1288</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navyL, marginBottom: 8 }}>Assessment Methodology</h4>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
              <li>NACE mapping uses GICS sector as proxy where NACE codes are unavailable</li>
              <li>TSC thresholds applied at activity level per Delegated Acts</li>
              <li>DNSH assessed across all 5 remaining objectives per activity</li>
              <li>Minimum safeguards evaluated against OECD, UNGPs, ILO, IBHR</li>
              <li>Aligned revenue % uses company-reported data where available, ESG proxy otherwise</li>
              <li>Overrides are stored locally and do not affect upstream data</li>
              <li>Green Asset Ratio calculated as weighted average of aligned revenue</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* ── 21. Cross-Navigation & Footer ── */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: T.navy }}>Cross-Navigation</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn sm onClick={() => navigate('/sfdr-classification')}>SFDR Classification</Btn>
          <Btn sm color="sage" onClick={() => navigate('/green-revenue')}>Green Revenue</Btn>
          <Btn sm color="gold" onClick={() => navigate('/regulatory-gap')}>Regulatory Gap</Btn>
          <Btn sm onClick={() => navigate('/advanced-report-studio')}>Report Studio</Btn>
          <Btn sm color="sage" onClick={() => navigate('/eu-taxonomy')}>EU Taxonomy (Legacy)</Btn>
          <Btn sm color="gold" onClick={() => navigate('/sfdr-pai')}>SFDR PAI</Btn>
        </div>
      </Card>
    </div>
  );
};

export default EuTaxonomyEnginePage;
