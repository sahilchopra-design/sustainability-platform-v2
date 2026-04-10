import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { NIFTY_50, INDIA_PROFILE, INDIA_SECTORS } from '../../../data/indiaDataset';
import { INDIA_CONSTANTS } from '../../../data/indiaLocale';
import { CEA_NATIONAL_GRID_EF, CEA_STATE_GRID_EF, PAT_SECTOR_BENCHMARKS } from '../../../data/ceaGridFactors';
import { BRSR_PRINCIPLES, BRSR_CORE_KPIS, BRSR_CROSSWALK } from '../../../data/brsrMapping';
import ReportExporter from '../../../components/ReportExporter';
import CurrencyToggle from '../../../components/CurrencyToggle';

/* ── theme ── */
const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e', blue: '#1e40af'
};
const CC = [T.navy, T.gold, T.indigo, T.green, T.red, T.amber, '#8b5cf6', '#0891b2', '#db2777', '#059669', '#7c3aed', '#d97706'];
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const fmt = v => typeof v === 'number' ? (v >= 1e9 ? (v/1e9).toFixed(1)+'B' : v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : v.toFixed(1)) : v;
const pct = (n, d) => d > 0 ? +((n / d) * 100).toFixed(1) : 0;
const guard = (n, d, fb = 0) => d > 0 ? n / d : fb;
const tip = { contentStyle: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }, labelStyle: { color: T.navy, fontWeight: 600 } };

/* ── styles ── */
const cardS = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 };
const kpiS = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' };
const kpiLabel = { fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace" };
const kpiVal = { fontSize: 24, fontWeight: 700, color: T.navy, marginTop: 4 };
const secTitle = { fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 };
const tabBar = { display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 20, overflowX: 'auto' };
const tabBtn = (a) => ({ padding: '10px 16px', fontSize: 12, fontWeight: a ? 700 : 500, color: a ? T.navy : T.sub, borderBottom: a ? `3px solid ${T.gold}` : '3px solid transparent', cursor: 'pointer', background: 'none', border: 'none', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" });
const gridRow = (cols = 2) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 20 });

const TABS = [
  'RBI Compliance Dashboard', 'Climate Risk Framework', 'CRAR & Capital Adequacy',
  'NGFS Scenario Analysis (India)', 'Financed Emissions (India)', 'Physical Risk (India)',
  'BRSR Core Alignment', 'Disclosure Timeline'
];

/* ═══════════════════════════════════════════════════════════════════════════
   DATA — 20 Indian Banks with RBI-specific metrics
   ═══════════════════════════════════════════════════════════════════════════ */
const BANK_NAMES = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank',
  'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'Bank of India',
  'Indian Bank', 'Central Bank of India', 'Kotak Mahindra Bank', 'Axis Bank',
  'IndusInd Bank', 'Yes Bank', 'IDBI Bank', 'Indian Overseas Bank',
  'UCO Bank', 'Punjab & Sind Bank', 'Federal Bank', 'Bandhan Bank'
];
const BANK_TYPES = [
  'PSB-DSIB', 'Private-DSIB', 'Private-DSIB', 'PSB', 'PSB', 'PSB', 'PSB', 'PSB',
  'PSB', 'PSB', 'Private', 'Private', 'Private', 'Private', 'PSB', 'PSB',
  'PSB', 'PSB', 'Private', 'Private'
];

const BANKS = BANK_NAMES.map((name, i) => {
  const s = i * 47 + 11;
  const isDSIB = BANK_TYPES[i].includes('DSIB');
  const isPSB = BANK_TYPES[i].includes('PSB');
  const totalAssets_cr = Math.round(200000 + sr(s) * 4500000);
  const cet1 = +(9.5 + sr(s + 1) * 6).toFixed(2);
  const at1 = +(1.0 + sr(s + 2) * 2).toFixed(2);
  const tier2 = +(1.5 + sr(s + 3) * 3).toFixed(2);
  const crar = +(cet1 + at1 + tier2).toFixed(2);
  const npa_pct = +(isPSB ? 2.5 + sr(s + 4) * 6 : 0.8 + sr(s + 4) * 2.5).toFixed(2);
  const lendingBook_cr = Math.round(totalAssets_cr * (0.55 + sr(s + 5) * 0.15));
  const financedEmissions_mtco2 = +(lendingBook_cr * 0.000012 * (0.6 + sr(s + 6) * 0.8)).toFixed(2);
  const climateRiskIntegration = Math.round(30 + sr(s + 7) * 60);
  const brsrReady = Math.round(40 + sr(s + 8) * 55);
  const ngfsScenarios = Math.floor(2 + sr(s + 9) * 5);
  const governanceScore = Math.round(35 + sr(s + 10) * 55);
  const strategyScore = Math.round(30 + sr(s + 10) * 60);
  const riskMgmtScore = Math.round(25 + sr(s + 11) * 65);
  const metricsScore = Math.round(20 + sr(s + 12) * 65);
  const disclosureComposite = Math.round(guard(governanceScore + strategyScore + riskMgmtScore + metricsScore, 4));
  const pslExposure_cr = Math.round(lendingBook_cr * (0.38 + sr(s + 13) * 0.06));
  const powerSectorExp_pct = +(12 + sr(s + 14) * 18).toFixed(1);
  const steelCementExp_pct = +(4 + sr(s + 15) * 10).toFixed(1);
  const oilGasExp_pct = +(3 + sr(s + 16) * 8).toFixed(1);
  const reSectorExp_pct = +(2 + sr(s + 17) * 6).toFixed(1);
  const transportExp_pct = +(3 + sr(s + 18) * 7).toFixed(1);
  const realEstateExp_pct = +(8 + sr(s + 19) * 12).toFixed(1);
  const pcafDqs = +(1 + sr(s + 20) * 3.5).toFixed(1);
  const floodExp_pct = +(5 + sr(s + 21) * 25).toFixed(1);
  const cycloneExp_pct = +(2 + sr(s + 22) * 15).toFixed(1);
  const heatwaveExp_pct = +(8 + sr(s + 23) * 20).toFixed(1);
  const droughtExp_pct = +(3 + sr(s + 24) * 18).toFixed(1);
  const physicalRiskComposite = +((+floodExp_pct + +cycloneExp_pct + +heatwaveExp_pct + +droughtExp_pct) / 4).toFixed(1);
  const brsrCoreKpis = Math.floor(7 + sr(s + 25) * 9);
  const assuranceReady_pct = Math.round(20 + sr(s + 26) * 70);
  const disclosureYear = sr(s + 27) > 0.5 ? 'FY 2025-26' : 'FY 2026-27';
  const climateAddon_bps = Math.round(10 + sr(s + 28) * 80);
  return {
    id: `BNK-${String(i + 1).padStart(2, '0')}`, name, type: BANK_TYPES[i], isDSIB, isPSB,
    totalAssets_cr, lendingBook_cr, cet1, at1, tier2, crar, npa_pct,
    financedEmissions_mtco2, climateRiskIntegration, brsrReady, ngfsScenarios,
    governanceScore, strategyScore, riskMgmtScore, metricsScore, disclosureComposite,
    pslExposure_cr, powerSectorExp_pct, steelCementExp_pct, oilGasExp_pct,
    reSectorExp_pct, transportExp_pct, realEstateExp_pct, pcafDqs,
    floodExp_pct, cycloneExp_pct, heatwaveExp_pct, droughtExp_pct, physicalRiskComposite,
    brsrCoreKpis, assuranceReady_pct, disclosureYear, climateAddon_bps
  };
});

/* ── RBI Directions 2025 checklist ── */
const RBI_PILLARS = [
  { pillar: 'Governance', items: [
    { id: 'G1', req: 'Board-level climate risk oversight committee', mandatory: true },
    { id: 'G2', req: 'Climate risk appetite statement', mandatory: true },
    { id: 'G3', req: 'Climate competency in board skills matrix', mandatory: true },
    { id: 'G4', req: 'Senior management accountability for climate risk', mandatory: true },
    { id: 'G5', req: 'Internal audit coverage of climate risk', mandatory: false },
    { id: 'G6', req: 'Remuneration linked to climate targets', mandatory: false },
  ]},
  { pillar: 'Strategy', items: [
    { id: 'S1', req: 'Short/medium/long-term climate risk identification', mandatory: true },
    { id: 'S2', req: 'Business model resilience under NGFS scenarios', mandatory: true },
    { id: 'S3', req: 'Transition plan with sectoral pathways', mandatory: true },
    { id: 'S4', req: 'Green finance opportunity assessment', mandatory: true },
    { id: 'S5', req: 'Client engagement strategy for high-carbon sectors', mandatory: false },
    { id: 'S6', req: 'Sector-specific phase-down/phase-out roadmaps', mandatory: false },
  ]},
  { pillar: 'Risk Management', items: [
    { id: 'R1', req: 'Climate risk in ICAAP/ILAAP', mandatory: true },
    { id: 'R2', req: 'Physical risk assessment methodology', mandatory: true },
    { id: 'R3', req: 'Transition risk assessment methodology', mandatory: true },
    { id: 'R4', req: 'Climate stress testing (at least 3 NGFS scenarios)', mandatory: true },
    { id: 'R5', req: 'Climate risk in credit underwriting', mandatory: true },
    { id: 'R6', req: 'Concentration risk limits for carbon-intensive sectors', mandatory: false },
    { id: 'R7', req: 'Climate-adjusted PD/LGD models', mandatory: false },
  ]},
  { pillar: 'Metrics & Targets', items: [
    { id: 'M1', req: 'Scope 1 & 2 operational emissions (tCO2e)', mandatory: true },
    { id: 'M2', req: 'Financed emissions (PCAF methodology)', mandatory: true },
    { id: 'M3', req: 'Weighted average carbon intensity (WACI)', mandatory: true },
    { id: 'M4', req: 'Data quality score (DQS) per PCAF', mandatory: true },
    { id: 'M5', req: 'Green/sustainable finance ratio', mandatory: true },
    { id: 'M6', req: 'Science-based targets (SBTi commitment)', mandatory: false },
    { id: 'M7', req: 'Portfolio temperature alignment', mandatory: false },
  ]},
];
const ALL_REQ_ITEMS = RBI_PILLARS.flatMap(p => p.items);

/* ── NGFS India scenarios ── */
const NGFS_SCENARIOS = [
  { id: 'NZ50', name: 'Net Zero 2070 (India)', type: 'Orderly', carbonPrice2030: 35, carbonPrice2050: 150, gdpImpact2050: -1.2, tempTarget: 1.8, description: 'India NDC-aligned with phased coal retirement' },
  { id: 'BT', name: 'Below 2C', type: 'Orderly', carbonPrice2030: 80, carbonPrice2050: 250, gdpImpact2050: -2.1, tempTarget: 1.7, description: 'Global coordination, moderate carbon price' },
  { id: 'NZ2050G', name: 'Net Zero 2050 (Global)', type: 'Orderly', carbonPrice2030: 130, carbonPrice2050: 500, gdpImpact2050: -3.5, tempTarget: 1.5, description: 'Aggressive global decarbonization' },
  { id: 'DT', name: 'Delayed Transition', type: 'Disorderly', carbonPrice2030: 15, carbonPrice2050: 350, gdpImpact2050: -4.8, tempTarget: 1.8, description: 'Late policy action, disruptive adjustment' },
  { id: 'DIVRG', name: 'Divergent Net Zero', type: 'Disorderly', carbonPrice2030: 60, carbonPrice2050: 400, gdpImpact2050: -5.2, tempTarget: 1.5, description: 'Uncoordinated policies across regions' },
  { id: 'CPS', name: 'Current Policies (India)', type: 'Hot House', carbonPrice2030: 5, carbonPrice2050: 10, gdpImpact2050: -8.5, tempTarget: 3.0, description: 'No new policies, severe physical risk' },
];

/* ── Disclosure timeline ── */
const DISCLOSURE_PHASES = [
  { fy: 'FY 2025-26', milestone: 'Phase 1: Top 50 banks (assets > 5L Cr)', items: ['Governance disclosure', 'Basic climate risk identification', 'Scope 1 & 2 operational emissions', 'BRSR Core (Top 500 companies)'], color: T.green },
  { fy: 'FY 2026-27', milestone: 'Phase 2: All scheduled commercial banks', items: ['NGFS scenario analysis (min 3)', 'Financed emissions (PCAF)', 'Physical risk assessment', 'BRSR Core (Top 1000 companies)', 'Transition plan draft'], color: T.indigo },
  { fy: 'FY 2027-28', milestone: 'Phase 3: NBFCs (assets > 1000 Cr)', items: ['Climate stress testing', 'Climate-adjusted capital assessment', 'Portfolio temperature alignment', 'Sector-level financed emissions', 'BRSR reasonable assurance'], color: T.amber },
  { fy: 'FY 2028-29', milestone: 'Phase 4: All RBI-regulated entities', items: ['Full TCFD-aligned disclosure', 'Climate risk in ICAAP/ILAAP', 'SBTi or equivalent targets', 'Third-party assurance on climate data', 'Annual climate risk report to board'], color: T.red },
];

/* ── Lending sector exposure for financed emissions ── */
const LENDING_SECTORS = ['Power', 'Steel & Cement', 'Oil & Gas', 'Transport', 'Real Estate', 'Agriculture', 'Textiles', 'Chemicals'];
const SECTOR_EF = [0.82, 1.95, 2.10, 0.45, 0.22, 0.35, 0.28, 0.65]; // tCO2e per crore lending

/* ── Physical risk by Indian state ── */
const PHYSICAL_STATES = [
  { state: 'Maharashtra', flood: 72, cyclone: 45, heatwave: 65, drought: 40 },
  { state: 'Tamil Nadu', flood: 55, cyclone: 78, heatwave: 50, drought: 35 },
  { state: 'West Bengal', flood: 85, cyclone: 70, heatwave: 55, drought: 20 },
  { state: 'Gujarat', flood: 30, cyclone: 55, heatwave: 80, drought: 60 },
  { state: 'Rajasthan', flood: 15, cyclone: 10, heatwave: 90, drought: 85 },
  { state: 'Kerala', flood: 80, cyclone: 25, heatwave: 30, drought: 15 },
  { state: 'Uttar Pradesh', flood: 65, cyclone: 5, heatwave: 75, drought: 50 },
  { state: 'Odisha', flood: 70, cyclone: 82, heatwave: 60, drought: 30 },
  { state: 'Andhra Pradesh', flood: 50, cyclone: 68, heatwave: 70, drought: 45 },
  { state: 'Karnataka', flood: 45, cyclone: 20, heatwave: 55, drought: 55 },
  { state: 'Bihar', flood: 88, cyclone: 5, heatwave: 65, drought: 25 },
  { state: 'Madhya Pradesh', flood: 35, cyclone: 5, heatwave: 78, drought: 65 },
  { state: 'Assam', flood: 92, cyclone: 15, heatwave: 30, drought: 10 },
  { state: 'Punjab', flood: 30, cyclone: 5, heatwave: 70, drought: 45 },
  { state: 'Delhi', flood: 40, cyclone: 5, heatwave: 85, drought: 30 },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function RbiClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [selectedBank, setSelectedBank] = useState('all');
  const [carbonPriceSlider, setCarbonPriceSlider] = useState(50);
  const [selectedScenario, setSelectedScenario] = useState('NZ50');

  /* ── derived data ── */
  const filteredBanks = useMemo(() =>
    selectedBank === 'all' ? BANKS : BANKS.filter(b => b.type === selectedBank), [selectedBank]);

  const kpis = useMemo(() => {
    const n = filteredBanks.length;
    return {
      banksInScope: n,
      avgCRAR: n > 0 ? (filteredBanks.reduce((s, b) => s + b.crar, 0) / n).toFixed(2) : '0',
      avgClimateIntegration: n > 0 ? Math.round(filteredBanks.reduce((s, b) => s + b.climateRiskIntegration, 0) / n) : 0,
      avgBrsrReady: n > 0 ? Math.round(filteredBanks.reduce((s, b) => s + b.brsrReady, 0) / n) : 0,
      avgNgfsScenarios: n > 0 ? (filteredBanks.reduce((s, b) => s + b.ngfsScenarios, 0) / n).toFixed(1) : '0',
      totalFinancedEmissions: filteredBanks.reduce((s, b) => s + b.financedEmissions_mtco2, 0).toFixed(1),
    };
  }, [filteredBanks]);

  const complianceChartData = useMemo(() =>
    [...filteredBanks].sort((a, b) => b.disclosureComposite - a.disclosureComposite)
      .map(b => ({ name: b.name.length > 15 ? b.name.slice(0, 15) + '..' : b.name, score: b.disclosureComposite, type: b.type })),
    [filteredBanks]);

  const radarData = useMemo(() => {
    const n = filteredBanks.length;
    if (n === 0) return [];
    return [
      { axis: 'Governance', value: Math.round(filteredBanks.reduce((s, b) => s + b.governanceScore, 0) / n) },
      { axis: 'Strategy', value: Math.round(filteredBanks.reduce((s, b) => s + b.strategyScore, 0) / n) },
      { axis: 'Risk Mgmt', value: Math.round(filteredBanks.reduce((s, b) => s + b.riskMgmtScore, 0) / n) },
      { axis: 'Metrics', value: Math.round(filteredBanks.reduce((s, b) => s + b.metricsScore, 0) / n) },
      { axis: 'BRSR Core', value: Math.round(filteredBanks.reduce((s, b) => s + b.brsrReady, 0) / n) },
      { axis: 'Physical Risk', value: Math.round(100 - filteredBanks.reduce((s, b) => s + b.physicalRiskComposite, 0) / n) },
    ];
  }, [filteredBanks]);

  /* ── CRAR waterfall data ── */
  const crarWaterfall = useMemo(() =>
    [...filteredBanks].sort((a, b) => b.totalAssets_cr - a.totalAssets_cr).slice(0, 10).map(b => ({
      name: b.name.length > 12 ? b.name.slice(0, 12) + '..' : b.name,
      CET1: b.cet1, AT1: b.at1, Tier2: b.tier2, CRAR: b.crar,
      climateAddon: b.climateAddon_bps / 100,
    })), [filteredBanks]);

  /* ── NGFS scenario chart data ── */
  const scenarioComparison = useMemo(() =>
    NGFS_SCENARIOS.map(sc => ({
      name: sc.name.length > 18 ? sc.name.slice(0, 18) + '..' : sc.name,
      'Carbon Price 2030': sc.carbonPrice2030,
      'Carbon Price 2050': sc.carbonPrice2050,
      'GDP Impact %': Math.abs(sc.gdpImpact2050),
    })), []);

  /* ── sector exposure for financed emissions ── */
  const sectorExposure = useMemo(() => {
    const n = filteredBanks.length;
    if (n === 0) return [];
    return LENDING_SECTORS.map((sector, i) => {
      const keys = ['powerSectorExp_pct', 'steelCementExp_pct', 'oilGasExp_pct', 'transportExp_pct', 'realEstateExp_pct'];
      const key = i < keys.length ? keys[i] : null;
      const avgExp = key ? filteredBanks.reduce((s, b) => s + (b[key] || 0), 0) / n : (3 + sr(i * 31) * 5);
      return { sector, exposure_pct: +avgExp.toFixed(1), ef: SECTOR_EF[i], emissions: +(avgExp * SECTOR_EF[i] * 10).toFixed(1) };
    });
  }, [filteredBanks]);

  /* ── Bank-level compliance per pillar ── */
  const bankPillarCompliance = useMemo(() =>
    filteredBanks.map(b => {
      const scores = {};
      RBI_PILLARS.forEach(p => {
        const total = p.items.length;
        const completed = Math.floor(total * (b[p.pillar.toLowerCase() + 'Score'] || 50) / 100);
        scores[p.pillar] = { completed, total, pct: pct(completed, total) };
      });
      return { ...b, pillarScores: scores };
    }), [filteredBanks]);

  /* ── BRSR KPI status ── */
  const brsrStatus = useMemo(() =>
    BRSR_CORE_KPIS.map((kpiId, idx) => {
      const allKpis = BRSR_PRINCIPLES.flatMap(p => p.kpis);
      const kpiDef = allKpis.find(k => k.id === kpiId) || { metric: kpiId };
      const banksReporting = Math.floor(filteredBanks.length * (0.3 + sr(idx * 19) * 0.6));
      const banksAssured = Math.floor(banksReporting * (0.1 + sr(idx * 23) * 0.5));
      const cross = BRSR_CROSSWALK.find(c => c.brsrKpi === kpiId);
      return {
        kpiId, metric: kpiDef.metric, type: kpiDef.type || 'number',
        banksReporting, banksAssured,
        reportingPct: pct(banksReporting, filteredBanks.length),
        assuredPct: pct(banksAssured, filteredBanks.length),
        esrsMap: cross ? cross.esrs : '-', griMap: cross ? cross.gri : '-',
        sfdrPai: cross ? cross.sfdrPai : '-',
      };
    }), [filteredBanks]);

  /* ═══════════════════════════════════════════════════════════════════════ */
  const renderTab = () => {
    switch (tab) {
      /* ── TAB 0: RBI Compliance Dashboard ── */
      case 0: return (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['all', 'PSB-DSIB', 'Private-DSIB', 'PSB', 'Private'].map(t => (
              <button key={t} onClick={() => setSelectedBank(t)}
                style={{ ...tabBtn(selectedBank === t), borderBottom: selectedBank === t ? `3px solid ${T.indigo}` : '3px solid transparent' }}>
                {t === 'all' ? 'All Banks' : t}
              </button>
            ))}
          </div>
          <div style={gridRow(6)}>
            {[
              { label: 'Banks in Scope', val: kpis.banksInScope },
              { label: 'Avg CRAR', val: kpis.avgCRAR + '%', sub: `RBI min: ${(INDIA_CONSTANTS.cet1Minimum * 100).toFixed(0)}%` },
              { label: 'Climate Risk Integration', val: kpis.avgClimateIntegration + '%' },
              { label: 'BRSR Core Readiness', val: kpis.avgBrsrReady + '%' },
              { label: 'Avg NGFS Scenarios', val: kpis.avgNgfsScenarios },
              { label: 'Total Financed Emissions', val: kpis.totalFinancedEmissions + ' MtCO2e' },
            ].map((k, i) => (
              <div key={i} style={kpiS}>
                <div style={kpiLabel}>{k.label}</div>
                <div style={kpiVal}>{k.val}</div>
                {k.sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{k.sub}</div>}
              </div>
            ))}
            <div style={kpiS}>
              <div style={kpiLabel}>Total Lending Book</div>
              <div style={{ marginTop: 4 }}><CurrencyToggle usdValue={filteredBanks.reduce((s, b) => s + b.lendingBook_cr, 0) * 1e7 / 83.5} size="lg" /></div>
            </div>
          </div>
          <div style={gridRow(2)}>
            <div style={cardS}>
              <div style={secTitle}>Bank Compliance Score (Composite)</div>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={complianceChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip {...tip} />
                  <ReferenceLine x={50} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Target', fontSize: 10 }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {complianceChartData.map((d, i) => (
                      <Cell key={i} fill={d.score >= 60 ? T.green : d.score >= 40 ? T.amber : T.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardS}>
              <div style={secTitle}>Readiness Radar (Avg across banks)</div>
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={radarData} outerRadius={120}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: T.text }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="value" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );

      /* ── TAB 1: Climate Risk Framework ── */
      case 1: return (
        <div>
          <div style={{ ...cardS, marginBottom: 16 }}>
            <div style={secTitle}>RBI Directions 2025 — Climate Risk Framework Requirements</div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>
              4 pillars, {ALL_REQ_ITEMS.length} sub-items. Mandatory items must be addressed by all scheduled commercial banks.
            </div>
            {RBI_PILLARS.map((pillar, pi) => (
              <div key={pi} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, padding: '8px 12px', background: '#f1f5f9', borderRadius: 6, marginBottom: 8 }}>
                  {pillar.pillar} ({pillar.items.length} requirements)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, width: 60 }}>ID</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Requirement</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, width: 80 }}>Mandatory</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, width: 120 }}>Banks Compliant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pillar.items.map((item, ii) => {
                      const compliant = Math.floor(BANKS.length * (0.2 + sr(pi * 100 + ii * 7) * 0.6));
                      return (
                        <tr key={ii} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '6px 10px', fontFamily: "'JetBrains Mono', monospace", color: T.indigo }}>{item.id}</td>
                          <td style={{ padding: '6px 10px', color: T.text }}>{item.req}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: item.mandatory ? '#dcfce7' : '#f1f5f9', color: item.mandatory ? T.green : T.sub }}>
                              {item.mandatory ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                              <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 3 }}>
                                <div style={{ width: `${pct(compliant, BANKS.length)}%`, height: 6, background: pct(compliant, BANKS.length) > 50 ? T.green : T.red, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, color: T.sub }}>{compliant}/{BANKS.length}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      );

      /* ── TAB 2: CRAR & Capital Adequacy ── */
      case 2: return (
        <div>
          <div style={gridRow(3)}>
            <div style={kpiS}>
              <div style={kpiLabel}>RBI Min CRAR</div>
              <div style={kpiVal}>{(INDIA_CONSTANTS.cet1Minimum * 100).toFixed(0)}%</div>
              <div style={{ fontSize: 11, color: T.sub }}>vs Basel 8%</div>
            </div>
            <div style={kpiS}>
              <div style={kpiLabel}>D-SIB Buffer</div>
              <div style={kpiVal}>{(INDIA_CONSTANTS.dSibBuffer * 100).toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: T.sub }}>SBI, HDFC, ICICI</div>
            </div>
            <div style={kpiS}>
              <div style={kpiLabel}>Climate Capital Add-on (Avg)</div>
              <div style={kpiVal}>{filteredBanks.length > 0 ? Math.round(filteredBanks.reduce((s, b) => s + b.climateAddon_bps, 0) / filteredBanks.length) : 0} bps</div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: T.sub, marginRight: 8 }}>Carbon Price ($/tCO2e): {carbonPriceSlider}</label>
            <input type="range" min={10} max={200} value={carbonPriceSlider} onChange={e => setCarbonPriceSlider(+e.target.value)}
              style={{ width: 250 }} />
          </div>
          <div style={gridRow(2)}>
            <div style={cardS}>
              <div style={secTitle}>CET1 / AT1 / Tier 2 Waterfall (Top 10 Banks by Assets)</div>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={crarWaterfall} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 22]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine x={INDIA_CONSTANTS.cet1Minimum * 100} stroke={T.red} strokeDasharray="4 4" label={{ value: '9% CRAR', fontSize: 10 }} />
                  <Bar dataKey="CET1" stackId="a" fill={T.navy} />
                  <Bar dataKey="AT1" stackId="a" fill={T.indigo} />
                  <Bar dataKey="Tier2" stackId="a" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardS}>
              <div style={secTitle}>Climate Stress: CRAR Impact at ${carbonPriceSlider}/tCO2e</div>
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={crarWaterfall.map(b => ({
                  ...b,
                  stressedCRAR: Math.max(0, b.CRAR - (carbonPriceSlider * 0.012)),
                  buffer: Math.max(0, b.CRAR - (carbonPriceSlider * 0.012) - 9),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 22]} tick={{ fontSize: 11 }} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={9} stroke={T.red} strokeDasharray="4 4" label={{ value: '9% min', fontSize: 10 }} />
                  <Bar dataKey="stressedCRAR" fill={T.amber} name="Stressed CRAR %" />
                  <Line dataKey="CRAR" stroke={T.navy} name="Current CRAR %" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Bank-Level Capital Detail</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Bank', 'Type', 'CET1 %', 'AT1 %', 'Tier2 %', 'CRAR %', 'NPA %', 'Climate Add-on (bps)', 'D-SIB'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Bank' ? 'left' : 'center', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredBanks].sort((a, b) => b.crar - a.crar).map((b, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: b.crar < 9 ? '#fef2f2' : 'transparent' }}>
                      <td style={{ padding: '5px 8px', fontWeight: 600, color: T.navy }}>{b.name}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontSize: 10 }}>{b.type}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>{b.cet1}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>{b.at1}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>{b.tier2}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 700, color: b.crar >= 12 ? T.green : b.crar >= 9 ? T.amber : T.red }}>{b.crar}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: b.npa_pct > 5 ? T.red : T.sub }}>{b.npa_pct}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>{b.climateAddon_bps}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>{b.isDSIB ? 'Yes' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

      /* ── TAB 3: NGFS Scenario Analysis (India) ── */
      case 3: return (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {NGFS_SCENARIOS.map(sc => (
              <button key={sc.id} onClick={() => setSelectedScenario(sc.id)}
                style={{ ...tabBtn(selectedScenario === sc.id), fontSize: 11 }}>
                {sc.name.length > 18 ? sc.name.slice(0, 18) + '..' : sc.name}
              </button>
            ))}
          </div>
          {(() => {
            const sc = NGFS_SCENARIOS.find(s => s.id === selectedScenario) || NGFS_SCENARIOS[0];
            return (
              <div>
                <div style={gridRow(4)}>
                  <div style={kpiS}><div style={kpiLabel}>Type</div><div style={{ ...kpiVal, fontSize: 18 }}>{sc.type}</div></div>
                  <div style={kpiS}><div style={kpiLabel}>Carbon Price 2030</div><div style={kpiVal}>${sc.carbonPrice2030}/t</div></div>
                  <div style={kpiS}><div style={kpiLabel}>Carbon Price 2050</div><div style={kpiVal}>${sc.carbonPrice2050}/t</div></div>
                  <div style={kpiS}><div style={kpiLabel}>India GDP Impact 2050</div><div style={{ ...kpiVal, color: T.red }}>{sc.gdpImpact2050}%</div></div>
                </div>
                <div style={{ ...cardS, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: T.sub }}>{sc.description}</div>
                </div>
              </div>
            );
          })()}
          <div style={gridRow(2)}>
            <div style={cardS}>
              <div style={secTitle}>Carbon Price Trajectories (USD/tCO2e)</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={scenarioComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Carbon Price 2030" fill={T.navy} />
                  <Bar dataKey="Carbon Price 2050" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardS}>
              <div style={secTitle}>Sector Exposure Heatmap under NGFS</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={INDIA_SECTORS.filter(s => s.companies > 0).slice(0, 10).map((s, i) => ({
                  sector: s.sector.length > 14 ? s.sector.slice(0, 14) + '..' : s.sector,
                  exposure: s.avgEmissions_tco2e,
                  transitionRisk: Math.round(30 + sr(i * 71) * 60),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="exposure" fill={T.amber} name="Avg Emissions (tCO2e)" />
                  <Bar dataKey="transitionRisk" fill={T.red} name="Transition Risk Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Bank Portfolio Impact under {(NGFS_SCENARIOS.find(s => s.id === selectedScenario) || NGFS_SCENARIOS[0]).name}</div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={[...filteredBanks].sort((a, b) => b.financedEmissions_mtco2 - a.financedEmissions_mtco2).slice(0, 12).map(b => {
                const sc2 = NGFS_SCENARIOS.find(s => s.id === selectedScenario) || NGFS_SCENARIOS[0];
                const impactCr = Math.round(b.financedEmissions_mtco2 * sc2.carbonPrice2030 * 10);
                return { name: b.name.length > 12 ? b.name.slice(0, 12) + '..' : b.name, emissions: b.financedEmissions_mtco2, costImpact_cr: impactCr };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="emissions" fill={T.navy} name="Financed Emissions (MtCO2e)" />
                <Line yAxisId="right" dataKey="costImpact_cr" stroke={T.red} name="Carbon Cost Impact (Cr)" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      /* ── TAB 4: Financed Emissions (India) ── */
      case 4: return (
        <div>
          <div style={gridRow(3)}>
            <div style={kpiS}>
              <div style={kpiLabel}>Total Financed Emissions</div>
              <div style={kpiVal}>{kpis.totalFinancedEmissions} MtCO2e</div>
            </div>
            <div style={kpiS}>
              <div style={kpiLabel}>Avg DQS (PCAF)</div>
              <div style={kpiVal}>{filteredBanks.length > 0 ? (filteredBanks.reduce((s, b) => s + b.pcafDqs, 0) / filteredBanks.length).toFixed(1) : '0'}</div>
              <div style={{ fontSize: 11, color: T.sub }}>1 (best) to 5 (worst)</div>
            </div>
            <div style={kpiS}>
              <div style={kpiLabel}>Grid EF (CEA 2024)</div>
              <div style={kpiVal}>{CEA_NATIONAL_GRID_EF[2024]} tCO2/MWh</div>
            </div>
          </div>
          <div style={gridRow(2)}>
            <div style={cardS}>
              <div style={secTitle}>Lending Sector Emissions Attribution</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={sectorExposure}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="exposure_pct" fill={T.navy} name="Avg Exposure %" />
                  <Bar dataKey="emissions" fill={T.red} name="Emissions Contribution" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardS}>
              <div style={secTitle}>DQS Quality Distribution</div>
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie data={[
                    { name: 'DQS 1-2 (Good)', value: filteredBanks.filter(b => b.pcafDqs <= 2).length },
                    { name: 'DQS 2-3 (Fair)', value: filteredBanks.filter(b => b.pcafDqs > 2 && b.pcafDqs <= 3).length },
                    { name: 'DQS 3-4 (Poor)', value: filteredBanks.filter(b => b.pcafDqs > 3 && b.pcafDqs <= 4).length },
                    { name: 'DQS 4-5 (Weak)', value: filteredBanks.filter(b => b.pcafDqs > 4).length },
                  ].filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {[T.green, T.indigo, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip {...tip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Bank-Level Financed Emissions</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...filteredBanks].sort((a, b) => b.financedEmissions_mtco2 - a.financedEmissions_mtco2).map(b => ({
                name: b.name.length > 14 ? b.name.slice(0, 14) + '..' : b.name,
                emissions: b.financedEmissions_mtco2, dqs: b.pcafDqs,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip {...tip} />
                <Bar dataKey="emissions" name="Financed Emissions (MtCO2e)">
                  {filteredBanks.map((_, i) => <Cell key={i} fill={CC[i % CC.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      /* ── TAB 5: Physical Risk (India) ── */
      case 5: return (
        <div>
          <div style={gridRow(4)}>
            {['Flood', 'Cyclone', 'Heatwave', 'Drought'].map((hazard, hi) => {
              const key = hazard.toLowerCase() + 'Exp_pct';
              const avg = filteredBanks.length > 0 ? (filteredBanks.reduce((s, b) => s + (b[key] || 0), 0) / filteredBanks.length).toFixed(1) : '0';
              return (
                <div key={hi} style={kpiS}>
                  <div style={kpiLabel}>Avg {hazard} Exposure</div>
                  <div style={{ ...kpiVal, color: avg > 15 ? T.red : T.green }}>{avg}%</div>
                </div>
              );
            })}
          </div>
          <div style={gridRow(2)}>
            <div style={cardS}>
              <div style={secTitle}>State-Level Physical Risk Heatmap</div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={PHYSICAL_STATES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="state" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="flood" stackId="a" fill="#3b82f6" name="Flood" />
                  <Bar dataKey="cyclone" stackId="a" fill="#8b5cf6" name="Cyclone" />
                  <Bar dataKey="heatwave" stackId="a" fill="#f59e0b" name="Heatwave" />
                  <Bar dataKey="drought" stackId="a" fill="#dc2626" name="Drought" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardS}>
              <div style={secTitle}>Bank Physical Risk Composite</div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={[...filteredBanks].sort((a, b) => b.physicalRiskComposite - a.physicalRiskComposite).map(b => ({
                  name: b.name.length > 14 ? b.name.slice(0, 14) + '..' : b.name,
                  flood: +b.floodExp_pct, cyclone: +b.cycloneExp_pct,
                  heatwave: +b.heatwaveExp_pct, drought: +b.droughtExp_pct,
                }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={110} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="flood" stackId="a" fill="#3b82f6" name="Flood" />
                  <Bar dataKey="cyclone" stackId="a" fill="#8b5cf6" name="Cyclone" />
                  <Bar dataKey="heatwave" stackId="a" fill="#f59e0b" name="Heatwave" />
                  <Bar dataKey="drought" stackId="a" fill="#dc2626" name="Drought" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Climate Event History (India)</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((yr, yi) => ({
                year: yr,
                floods: Math.round(8 + sr(yi * 11) * 15),
                cyclones: Math.round(2 + sr(yi * 13) * 5),
                heatwaves: Math.round(5 + sr(yi * 17) * 12),
                droughts: Math.round(3 + sr(yi * 19) * 8),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="floods" stackId="1" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="cyclones" stackId="1" fill="#8b5cf6" stroke="#8b5cf6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="heatwaves" stackId="1" fill="#f59e0b" stroke="#f59e0b" fillOpacity={0.6} />
                <Area type="monotone" dataKey="droughts" stackId="1" fill="#dc2626" stroke="#dc2626" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      /* ── TAB 6: BRSR Core Alignment ── */
      case 6: return (
        <div>
          <div style={gridRow(3)}>
            <div style={kpiS}>
              <div style={kpiLabel}>BRSR Core KPIs</div>
              <div style={kpiVal}>{BRSR_CORE_KPIS.length}</div>
              <div style={{ fontSize: 11, color: T.sub }}>Mandatory assurance</div>
            </div>
            <div style={kpiS}>
              <div style={kpiLabel}>Avg Reporting Rate</div>
              <div style={kpiVal}>{brsrStatus.length > 0 ? Math.round(brsrStatus.reduce((s, k) => s + k.reportingPct, 0) / brsrStatus.length) : 0}%</div>
            </div>
            <div style={kpiS}>
              <div style={kpiLabel}>Avg Assurance Rate</div>
              <div style={kpiVal}>{brsrStatus.length > 0 ? Math.round(brsrStatus.reduce((s, k) => s + k.assuredPct, 0) / brsrStatus.length) : 0}%</div>
            </div>
          </div>
          <div style={cardS}>
            <div style={secTitle}>BRSR Core KPI Status (per bank sample)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['KPI', 'Metric', 'Banks Reporting', 'Reporting %', 'Assured', 'Assured %', 'ESRS Map', 'GRI', 'SFDR PAI'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {brsrStatus.map((k, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '5px 8px', fontFamily: "'JetBrains Mono', monospace", color: T.indigo }}>{k.kpiId}</td>
                      <td style={{ padding: '5px 8px' }}>{k.metric}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>{k.banksReporting}/{filteredBanks.length}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: k.reportingPct > 60 ? T.green : T.red }}>{k.reportingPct}%</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>{k.banksAssured}/{filteredBanks.length}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: k.assuredPct > 30 ? T.green : T.amber }}>{k.assuredPct}%</td>
                      <td style={{ padding: '5px 8px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{k.esrsMap}</td>
                      <td style={{ padding: '5px 8px', fontSize: 10 }}>{k.griMap}</td>
                      <td style={{ padding: '5px 8px', fontSize: 10 }}>{k.sfdrPai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>BRSR Core Crosswalk: BRSR to ESRS to GRI to ISSB to SFDR</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['BRSR KPI', 'Metric', 'ESRS', 'GRI', 'ISSB', 'SFDR PAI'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BRSR_CROSSWALK.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '5px 8px', fontFamily: "'JetBrains Mono', monospace", color: T.indigo }}>{c.brsrKpi}</td>
                      <td style={{ padding: '5px 8px' }}>{c.metric}</td>
                      <td style={{ padding: '5px 8px' }}>{c.esrs}</td>
                      <td style={{ padding: '5px 8px' }}>{c.gri}</td>
                      <td style={{ padding: '5px 8px' }}>{c.issb}</td>
                      <td style={{ padding: '5px 8px' }}>{c.sfdrPai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

      /* ── TAB 7: Disclosure Timeline ── */
      case 7: return (
        <div>
          <div style={{ ...cardS, marginBottom: 16 }}>
            <div style={secTitle}>RBI Climate Disclosure Phased Timeline</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              {DISCLOSURE_PHASES.map((p, i) => (
                <div key={i} style={{ flex: 1, borderLeft: `4px solid ${p.color}`, paddingLeft: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{p.fy}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{p.milestone}</div>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {p.items.map((item, j) => (
                      <li key={j} style={{ fontSize: 11, color: T.text, marginBottom: 3 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Bank-by-Bank Disclosure Progress</div>
            {[...filteredBanks].sort((a, b) => b.disclosureComposite - a.disclosureComposite).map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 160, fontSize: 12, fontWeight: 600, color: T.navy }}>{b.name}</div>
                <div style={{ width: 80, fontSize: 10, color: T.sub }}>{b.disclosureYear}</div>
                <div style={{ flex: 1, height: 14, background: '#e5e7eb', borderRadius: 7, overflow: 'hidden' }}>
                  <div style={{ width: `${b.disclosureComposite}%`, height: '100%', background: b.disclosureComposite >= 60 ? T.green : b.disclosureComposite >= 40 ? T.amber : T.red, borderRadius: 7, transition: 'width 0.3s' }} />
                </div>
                <div style={{ width: 50, fontSize: 11, fontWeight: 700, textAlign: 'right', color: b.disclosureComposite >= 60 ? T.green : b.disclosureComposite >= 40 ? T.amber : T.red }}>{b.disclosureComposite}%</div>
                <div style={{ width: 80, fontSize: 10 }}>
                  {['Governance', 'Strategy', 'Risk Mgmt', 'Metrics'].map((p, pi) => {
                    const key = p === 'Risk Mgmt' ? 'riskMgmtScore' : p.toLowerCase() + 'Score';
                    return <div key={pi} style={{ display: 'inline-block', width: 16, height: 8, marginRight: 2, borderRadius: 2, background: b[key] >= 60 ? T.green : b[key] >= 40 ? T.amber : T.red, title: p }} />;
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...cardS, marginTop: 16 }}>
            <div style={secTitle}>Timeline Gantt: Readiness vs Requirements</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={DISCLOSURE_PHASES.map(p => ({
                phase: p.fy, requirements: p.items.length,
                banksReady: Math.floor(BANKS.length * (p.fy === 'FY 2025-26' ? 0.6 : p.fy === 'FY 2026-27' ? 0.35 : p.fy === 'FY 2027-28' ? 0.15 : 0.05)),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="requirements" fill={T.navy} name="Requirements Count" />
                <Bar dataKey="banksReady" fill={T.green} name="Banks Ready" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      default: return null;
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif", background: T.surface, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>RBI Climate Risk Directions 2025</h1>
          <p style={{ fontSize: 13, color: T.sub, margin: '4px 0 0' }}>
            Compliance analytics for Indian banks | {BANKS.length} banks | {ALL_REQ_ITEMS.length} RBI requirements | BRSR Core + NGFS + PCAF
          </p>
        </div>
        <ReportExporter title="RBI Climate Risk Directions 2025" subtitle={`${filteredBanks.length} banks | ${ALL_REQ_ITEMS.length} requirements`} framework="RBI Climate Directions 2025" sections={[{type:'kpis',title:'Bank Metrics',data:[{label:'Banks in Scope',value:kpis.banksInScope},{label:'Avg CRAR',value:kpis.avgCRAR+'%'},{label:'Avg Climate Integration',value:kpis.avgClimateIntegration+'%'},{label:'BRSR Readiness',value:kpis.avgBrsrReady+'%'}]}]} />
      </div>
      <div style={tabBar}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={tabBtn(tab === i)}>{t}</button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}
