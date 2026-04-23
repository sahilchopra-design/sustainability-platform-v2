import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#263248', border: '#334155', borderL: '#2d3f55',
  navy: '#60a5fa', navyL: '#93c5fd', gold: '#fbbf24', goldL: '#fcd34d',
  sage: '#34d399', sageL: '#6ee7b7', teal: '#2dd4bf', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#f87171', green: '#4ade80',
  amber: '#fb923c', font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};
const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;
const COLORS = [T.navy, T.gold, T.sage, T.teal, T.amber, T.red, T.navyL, T.goldL, '#a78bfa', '#f472b6'];
const tip = { contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, fontFamily: T.font }, labelStyle: { color: T.textSec, fontSize: 10 } };

const KpiCard = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);
const cS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 };

const FILER_TYPES = ['Large Accelerated Filer', 'Accelerated Filer', 'Non-Accelerated Filer', 'Smaller Reporting Co'];
const SECTORS = ['Technology', 'Energy', 'Financials', 'Healthcare', 'Consumer', 'Industrials', 'Materials', 'Utilities', 'Real Estate'];

const COMPLIANCE_PHASES = [
  { phase: 'Phase 1 — Large Accelerated', deadline: 'FY2025 (filed 2026)', scope: 'Scope 1+2 GHG + Material Climate Risks + Financial Impact Quantification', filerType: 'Large Accelerated Filer', assurance: 'Limited Assurance (PCAOB)', status: 'Active' },
  { phase: 'Phase 2 — Accelerated Filers', deadline: 'FY2026 (filed 2027)', scope: 'Scope 1+2 GHG + Material Climate Risks (no financial impact required)', filerType: 'Accelerated Filer', assurance: 'Limited Assurance (phased)', status: 'Upcoming' },
  { phase: 'Phase 3 — Non-Accelerated', deadline: 'FY2027 (filed 2028)', scope: 'Material Climate Risk Disclosures only (no GHG quantification)', filerType: 'Non-Accelerated Filer', assurance: 'None Required', status: 'Upcoming' },
  { phase: 'Scope 3 — Stayed Pending Review', deadline: 'TBD (8th Circuit challenge)', scope: 'Scope 3 value chain emissions — stayed by SEC March 2024', filerType: 'Large Accelerated (if reinstated)', assurance: 'Stayed', status: 'Stayed' },
];

const DISCLOSURE_REQUIREMENTS = [
  { req: 'Material Climate Risks (Physical)', category: 'Risk Disclosure', required: true, notes: 'Acute/chronic physical risks if material; quantification encouraged', difficulty: 'High' },
  { req: 'Material Climate Risks (Transition)', category: 'Risk Disclosure', required: true, notes: 'Policy, technology, market, reputational transition risks', difficulty: 'Medium' },
  { req: 'GHG Emissions — Scope 1', category: 'GHG Quantification', required: true, notes: 'Mandatory for Large Accelerated + Accelerated; GHG Protocol required', difficulty: 'Medium' },
  { req: 'GHG Emissions — Scope 2', category: 'GHG Quantification', required: true, notes: 'Location-based or market-based method; must specify', difficulty: 'Low' },
  { req: 'GHG Emissions — Scope 3', category: 'GHG Quantification', required: false, notes: 'Stayed — not currently required; monitor 8th Circuit ruling', difficulty: 'Very High' },
  { req: 'Financial Impact Estimates', category: 'Financial Disclosure', required: true, notes: '1% of pretax income/loss or $100K threshold trigger', difficulty: 'High' },
  { req: 'Extreme Weather Costs (>$100K)', category: 'Financial Disclosure', required: true, notes: 'Separate line in financial statements footnotes', difficulty: 'High' },
  { req: 'Climate Risk Governance', category: 'Governance', required: true, notes: 'Board oversight + management role and expertise', difficulty: 'Low' },
  { req: 'Climate Risk Management Process', category: 'Strategy', required: true, notes: 'How climate risks are identified, assessed, and managed', difficulty: 'Medium' },
  { req: 'Transition Plans', category: 'Strategy', required: false, notes: 'Voluntary — if adopted must disclose material aspects', difficulty: 'Medium' },
  { req: 'Internal Carbon Price (ICP)', category: 'Strategy', required: false, notes: 'Voluntary — if used in planning must disclose', difficulty: 'Low' },
  { req: 'Scenario Analysis', category: 'Strategy', required: false, notes: 'Voluntary — TCFD-style encouraged', difficulty: 'High' },
  { req: 'Limited Assurance — Scope 1+2', category: 'Assurance', required: true, notes: 'Large Accelerated: FY2026 onwards; PCAOB standards', difficulty: 'Medium' },
  { req: 'Reasonable Assurance (future)', category: 'Assurance', required: false, notes: 'Phase 2 plan: reasonable assurance by FY2033', difficulty: 'High' },
  { req: 'Cap/Trade Positions & Carbon Offsets', category: 'GHG Quantification', required: true, notes: 'If material; registry and quantification methodology required', difficulty: 'Medium' },
];

const COMPANY_NAMES = ['Apple', 'Microsoft', 'Amazon', 'Alphabet', 'Tesla', 'NVIDIA', 'Meta', 'JPMorgan', 'Visa', 'UnitedHealth', 'Johnson & Johnson', 'Walmart', 'P&G', 'Mastercard', 'Chevron', 'Home Depot', 'Coca-Cola', 'Pfizer', 'Exxon Mobil', 'Eli Lilly', 'Broadcom', 'Cisco', 'Merck', 'Accenture', 'Goldman Sachs', 'Caterpillar', 'Duke Energy', 'NextEra Energy', 'BHP USA', 'Ford Motor', 'GE Aerospace', 'Honeywell', 'Lockheed Martin', 'Deere & Co', 'IBM', 'Oracle', 'Salesforce', 'ServiceNow', 'Intuit', 'Adobe', 'Netflix', 'PayPal', 'Uber', 'Airbnb', 'Booking Holdings', 'Starbucks', 'McDonald\'s', 'Nike', 'Colgate-Palmolive', 'Kellogg\'s', 'ConocoPhillips', 'EOG Resources', 'Marathon Petroleum', 'Valero Energy', 'Devon Energy', 'American Express', 'Morgan Stanley', 'Citigroup', 'Wells Fargo', 'Bank of America', 'Prologis', 'CBRE Group', 'Vornado Realty', 'Boston Properties', 'Equity Residential', 'Southern Company', 'Dominion Energy', 'Consolidated Edison', 'Xcel Energy', 'Entergy', 'Newmont Mining', 'Freeport-McMoRan', 'Nucor Steel', 'Alcoa', 'Air Products', 'Linde plc', 'Praxair', 'Dow Chemical', 'BASF USA', '3M Company'];
const COMPANY_SECTORS = ['Technology', 'Technology', 'Technology', 'Technology', 'Technology', 'Technology', 'Technology', 'Financials', 'Financials', 'Healthcare', 'Healthcare', 'Consumer', 'Consumer', 'Financials', 'Energy', 'Consumer', 'Consumer', 'Healthcare', 'Energy', 'Healthcare', 'Technology', 'Technology', 'Healthcare', 'Technology', 'Financials', 'Industrials', 'Utilities', 'Utilities', 'Materials', 'Industrials', 'Industrials', 'Industrials', 'Industrials', 'Industrials', 'Technology', 'Technology', 'Technology', 'Technology', 'Technology', 'Technology', 'Technology', 'Financials', 'Technology', 'Consumer', 'Consumer', 'Consumer', 'Consumer', 'Consumer', 'Consumer', 'Consumer', 'Energy', 'Energy', 'Energy', 'Energy', 'Energy', 'Financials', 'Financials', 'Financials', 'Financials', 'Financials', 'Real Estate', 'Real Estate', 'Real Estate', 'Real Estate', 'Real Estate', 'Utilities', 'Utilities', 'Utilities', 'Utilities', 'Utilities', 'Materials', 'Materials', 'Materials', 'Materials', 'Materials', 'Materials', 'Materials', 'Materials', 'Materials', 'Materials', 'Industrials'];

const COMPANIES = Array.from({ length: 80 }, (_, i) => {
  const ftype = FILER_TYPES[Math.floor(sr(i * 7) * 3)];
  const sector = COMPANY_SECTORS[i % COMPANY_SECTORS.length];
  const scope1 = Math.round(sr(i * 11) * 9000 + 100);
  const scope2 = Math.round(sr(i * 13) * 2500 + 50);
  const complScore = Math.round(38 + sr(i * 17) * 57);
  const ghgDisc = sr(i * 19) > 0.25;
  const riskDisc = sr(i * 23) > 0.18;
  const finImpact = sr(i * 29) > 0.38;
  const assurance = ftype === 'Large Accelerated Filer' ? (sr(i * 31) > 0.45 ? 'Limited' : 'None Yet') : 'N/A';
  const gaps = (!ghgDisc ? 1 : 0) + (!riskDisc ? 1 : 0) + (!finImpact ? 1 : 0);
  const icp = sr(i * 47) > 0.48 ? Math.round(sr(i * 53) * 150 + 15) : null;
  const hasScenario = sr(i * 61) > 0.55;
  const sbti = sr(i * 67) < 0.3 ? 'Approved' : sr(i * 67) < 0.6 ? 'Committed' : 'None';
  return {
    id: i + 1, name: COMPANY_NAMES[i] || `Corp-${i + 1}`, sector, filerType: ftype,
    scope1, scope2,
    scope3: sr(i * 37) > 0.5 ? Math.round(scope1 * (sr(i * 41) * 10 + 2)) : null,
    complianceScore: complScore, ghgDisclosed: ghgDisc, riskDisclosed: riskDisc,
    financialImpact: finImpact, assurance,
    transitionPlan: sr(i * 43) > 0.52,
    internalCarbonPrice: icp,
    scenarioAnalysis: hasScenario,
    sbtiStatus: sbti,
    disclosureGaps: gaps,
    auditFirm: ['PwC', 'Deloitte', 'KPMG', 'EY', 'BV', 'Bureau Veritas'][Math.floor(sr(i * 71) * 6)],
    reportingFramework: ['GHG Protocol', 'ISO 14064', 'PCAF', 'CDP', 'TCFD'][Math.floor(sr(i * 73) * 5)],
    status: complScore >= 75 ? 'Compliant' : complScore >= 50 ? 'Partial' : 'Non-Compliant',
    marketCap: Math.round(sr(i * 79) * 800 + 10),
    revenue: Math.round(sr(i * 83) * 200 + 5),
  };
});

const TREND = ['Q3-22', 'Q4-22', 'Q1-23', 'Q2-23', 'Q3-23', 'Q4-23', 'Q1-24', 'Q2-24', 'Q3-24', 'Q4-24', 'Q1-25', 'Q2-25'].map((q, i) => ({
  quarter: q,
  'GHG Disclosed': Math.round(44 + i * 3.8 + sr(i) * 3),
  'Risk Disclosed': Math.round(57 + i * 3.2 + sr(i + 10) * 2),
  'Compliant': Math.round(30 + i * 4.8 + sr(i + 20) * 3),
  'Transition Plan': Math.round(22 + i * 3.5 + sr(i + 30) * 2),
}));

const INTL_COMPARISON = [
  { framework: 'SEC Climate Rule (US)', jurisdiction: 'USA', scope1: true, scope2: true, scope3: false, financialRisk: true, scenario: false, biodiversity: false, social: false, assurance: 'Limited', effective: 2026, coverage: 'Public companies (SEC registrants)' },
  { framework: 'CSRD + ESRS (EU)', jurisdiction: 'EU', scope1: true, scope2: true, scope3: true, financialRisk: true, scenario: true, biodiversity: true, social: true, assurance: 'Limited → Reasonable', effective: 2024, coverage: '50,000+ EU companies incl. large non-EU' },
  { framework: 'ISSB IFRS S1+S2', jurisdiction: 'Global', scope1: true, scope2: true, scope3: true, financialRisk: true, scenario: true, biodiversity: false, social: false, assurance: 'Voluntary (jurisdiction specific)', effective: 2024, coverage: 'Jurisdictions adopting ISSB standards' },
  { framework: 'TCFD Recommendations', jurisdiction: 'Global', scope1: true, scope2: true, scope3: false, financialRisk: true, scenario: true, biodiversity: false, social: false, assurance: 'None (voluntary)', effective: 2017, coverage: 'Voluntary; now embedded in ISSB/CSRD' },
  { framework: 'UK TCFD (mandatory)', jurisdiction: 'UK', scope1: true, scope2: true, scope3: false, financialRisk: true, scenario: true, biodiversity: false, social: false, assurance: 'None required', effective: 2022, coverage: 'LSE premium + AIM + large LLPs' },
  { framework: 'Hong Kong ESG (HKEx)', jurisdiction: 'Hong Kong', scope1: true, scope2: true, scope3: false, financialRisk: false, scenario: false, biodiversity: false, social: true, assurance: 'None', effective: 2020, coverage: 'HKEx-listed companies' },
];

const ASSURANCE_FRAMEWORK = [
  { standard: 'PCAOB AS 2101', type: 'US Audit', applicability: 'Large Accelerated Filers (SEC mandated)', phase: 'Phase 1 (FY2026)', level: 'Limited', strengths: 'Established US audit standard; strong enforcement', challenges: 'GHG-specific guidance limited; new territory for PCAOB' },
  { standard: 'IAASB ISAE 3410', type: 'International', applicability: 'EU/UK/Global voluntary or mandated', phase: 'Now', level: 'Limited → Reasonable', strengths: 'Global adoption; clear GHG assurance guidance', challenges: 'Varying quality of assurance providers across jurisdictions' },
  { standard: 'ISAE 3000 (Revised)', type: 'International', applicability: 'General assurance on non-financial info', phase: 'Now', level: 'Limited → Reasonable', strengths: 'Flexible; broad applicability; widely used in ESG reports', challenges: 'Less GHG-specific than ISAE 3410' },
  { standard: 'AA1000 AS (v3)', type: 'Sustainability', applicability: 'Voluntary ESG reports + CSRD readiness', phase: 'Now', level: 'Moderate to High', strengths: 'Stakeholder inclusiveness principles; AA1000AP aligned', challenges: 'Not yet PCAOB-equivalent; mainly non-GHG focus' },
];

const ENFORCEMENT = [
  { action: 'Greenwashing Sweep (2023)', type: 'Investigation', targets: 25, outcome: '$35M settlements', regulator: 'SEC ESG Task Force', detail: 'ESG fund mislabelling and exaggerated green claims' },
  { action: 'Investment Adviser ESG Rules', type: 'Rulemaking', targets: null, outcome: 'Final rule 2024', regulator: 'SEC', detail: 'Naming rules, disclosure requirements for ESG-labelled funds' },
  { action: 'BNY Mellon ESG Settlement', type: 'Enforcement', targets: 1, outcome: '$1.5M civil penalty', regulator: 'SEC', detail: 'Misstatements about ESG factors in investment decisions' },
  { action: 'Goldman Sachs Asset Mgmt', type: 'Enforcement', targets: 1, outcome: '$4M penalty', regulator: 'SEC', detail: 'ESG policy failures in research process' },
  { action: 'Climate Disclosure Comment Period', type: 'Rulemaking', targets: null, outcome: '16,000 public comments', regulator: 'SEC', detail: 'Record engagement; 9,400 individual + 6,600 institutional' },
  { action: '8th Circuit Challenge', type: 'Litigation', targets: null, outcome: 'Scope 3 stayed', regulator: 'Courts', detail: 'Voluntary stay granted March 2024 pending circuit review' },
];

const SECTOR_BENCHMARKS = SECTORS.map((s, i) => ({
  sector: s,
  avgCompliance: Math.round(45 + sr(i * 7) * 40),
  ghgDiscPct: Math.round(50 + sr(i * 11) * 40),
  transitionPlanPct: Math.round(25 + sr(i * 13) * 45),
  scenarioPct: Math.round(20 + sr(i * 17) * 40),
  avgScope1: Math.round(sr(i * 19) * 5000 + 200),
  icpAdopters: Math.round(sr(i * 23) * 60 + 15),
  sbtiApproved: Math.round(sr(i * 29) * 50 + 10),
}));

const TABS = ['Overview', 'Compliance Tracker', 'Disclosure Requirements', 'GHG Disclosures', 'Phase Timeline', 'Sector Analysis', 'Gap Assessment', 'International Comparison', 'Cost Calculator', 'Assurance Framework', 'Enforcement'];

export default function SecClimateRulePage() {
  const [tab, setTab] = useState('Overview');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [filerFilter, setFilerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [calcRevenue, setCalcRevenue] = useState(500);
  const [calcFilerType, setCalcFilerType] = useState('Large Accelerated Filer');
  const [calcScope3, setCalcScope3] = useState(false);

  const filtered = useMemo(() => {
    let d = COMPANIES;
    if (sectorFilter !== 'All') d = d.filter(c => c.sector === sectorFilter);
    if (filerFilter !== 'All') d = d.filter(c => c.filerType === filerFilter);
    if (statusFilter !== 'All') d = d.filter(c => c.status === statusFilter);
    if (search) d = d.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [sectorFilter, filerFilter, statusFilter, search]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filtered.length);
    return {
      compliant: filtered.filter(c => c.status === 'Compliant').length,
      partial: filtered.filter(c => c.status === 'Partial').length,
      nonCompliant: filtered.filter(c => c.status === 'Non-Compliant').length,
      avgScore: (filtered.reduce((s, c) => s + c.complianceScore, 0) / n).toFixed(1),
      ghgDisc: filtered.filter(c => c.ghgDisclosed).length,
      hasTransPlan: filtered.filter(c => c.transitionPlan).length,
      hasICP: filtered.filter(c => c.internalCarbonPrice).length,
      hasScenario: filtered.filter(c => c.scenarioAnalysis).length,
      sbtiApproved: filtered.filter(c => c.sbtiStatus === 'Approved').length,
    };
  }, [filtered]);

  const complianceCost = useMemo(() => {
    const base = calcFilerType === 'Large Accelerated Filer' ? 4.2 : calcFilerType === 'Accelerated Filer' ? 1.8 : 0.6;
    const scope3Add = calcScope3 ? base * 0.6 : 0;
    const revenueScale = Math.log10(Math.max(1, calcRevenue)) / Math.log10(100);
    const total = +(base * revenueScale + scope3Add).toFixed(2);
    return {
      base: +(base * revenueScale).toFixed(2),
      scope3Extra: +(scope3Add).toFixed(2),
      total,
      annualMaint: +(total * 0.35).toFixed(2),
      external: +(total * 0.45).toFixed(2),
    };
  }, [calcRevenue, calcFilerType, calcScope3]);

  const statusColor = s => ({ 'Compliant': T.green, 'Partial': T.amber, 'Non-Compliant': T.red }[s] || T.textSec);
  const diffColor = d => ({ 'Low': T.green, 'Medium': T.amber, 'High': T.red, 'Very High': '#a855f7' }[d] || T.textSec);

  const tabBtn = t => ({
    padding: '7px 14px', border: `1px solid ${tab === t ? T.navy : T.border}`,
    borderRadius: 6, fontSize: 12, fontFamily: T.font, cursor: 'pointer',
    background: tab === t ? T.navy : T.surface, color: tab === t ? '#0f172a' : T.textSec, fontWeight: tab === t ? 600 : 400,
  });
  const selS = { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.font, background: T.surface, color: T.text };
  const inpS = { padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font, background: T.surface, color: T.text, outline: 'none', width: 180 };
  const thS = { padding: '8px 10px', fontSize: 11, fontFamily: T.mono, color: T.textSec, borderBottom: `1px solid ${T.border}`, textAlign: 'left', background: T.surfaceH };
  const tdS = { padding: '7px 10px', fontSize: 12, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, color: T.text };

  const exportCSV = useCallback((data, fn) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fn; a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div style={{ padding: '24px 32px', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>SEC Climate Rule Compliance</h1>
        <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0' }}>80 S&P 500 filers · SEC climate disclosure · CSRD/ISSB/TCFD comparison · assurance · enforcement tracker — EP-DI3</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>{t}</button>)}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company..." style={inpS} />
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={selS}><option>All</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</select>
        <select value={filerFilter} onChange={e => setFilerFilter(e.target.value)} style={selS}><option>All</option>{FILER_TYPES.map(f => <option key={f}>{f}</option>)}</select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selS}><option>All</option>{['Compliant', 'Partial', 'Non-Compliant'].map(s => <option key={s}>{s}</option>)}</select>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{filtered.length} companies</span>
        <button onClick={() => exportCSV(filtered, 'sec_compliance.csv')} style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, background: T.surface, color: T.text, cursor: 'pointer' }}>Export</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="Compliant" value={`${kpis.compliant}/${filtered.length}`} color={T.green} sub="full compliance" />
        <KpiCard label="Partial" value={kpis.partial} color={T.amber} sub="gaps remain" />
        <KpiCard label="Non-Compliant" value={kpis.nonCompliant} color={T.red} sub="significant gaps" />
        <KpiCard label="Avg Score" value={kpis.avgScore} sub="out of 100" />
        <KpiCard label="GHG Disclosed" value={`${kpis.ghgDisc}/${filtered.length}`} color={T.teal} sub="Scope 1+2" />
        <KpiCard label="Transition Plans" value={kpis.hasTransPlan} color={T.sage} sub="voluntary" />
        <KpiCard label="Scenario Analysis" value={kpis.hasScenario} color={T.gold} sub="TCFD-style" />
        <KpiCard label="SBTi Approved" value={kpis.sbtiApproved} color={T.green} sub="science-based" />
      </div>

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Compliance Status Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={['Compliant', 'Partial', 'Non-Compliant'].map(s => ({ status: s, count: COMPANIES.filter(c => c.status === s).length }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {['Compliant', 'Partial', 'Non-Compliant'].map((s, i) => <Cell key={i} fill={statusColor(s)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Disclosure Adoption Trend (%)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="quarter" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={44} />
                <YAxis domain={[15, 100]} tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Line type="monotone" dataKey="GHG Disclosed" stroke={T.teal} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Risk Disclosed" stroke={T.sage} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Compliant" stroke={T.navy} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Transition Plan" stroke={T.gold} strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cS, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Key Rule Facts</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Rule Effective', value: 'March 2024', sub: 'Final rule adopted by SEC', color: T.navy },
                { label: 'Scope 3 Status', value: 'Stayed', sub: '8th Circuit challenge — paused Mar 2024', color: T.amber },
                { label: 'Phase 1 Deadline', value: 'FY2025', sub: 'Large Accelerated first disclosure', color: T.teal },
                { label: 'Assurance Standard', value: 'PCAOB', sub: 'Limited → Reasonable phased', color: T.sage },
                { label: 'GHG Protocol', value: 'Required', sub: 'Must use GHG Protocol for Scope 1+2', color: T.green },
                { label: 'Financial Threshold', value: '1% Pretax', sub: 'Trigger for financial impact quantification', color: T.gold },
                { label: 'Weather Costs', value: '>$100K', sub: 'Separate footnote in financials required', color: T.red },
                { label: 'Voluntary Disclosures', value: 'If Adopted', sub: 'ICP / Transition Plan / Scenario Analysis', color: T.textSec },
              ].map(k => (
                <div key={k.label} style={{ background: T.surfaceH, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: T.textSec }}>{k.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: k.color, marginTop: 4 }}>{k.value}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Compliance Tracker' && (
        <div style={{ overflowX: 'auto', ...cS, padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Company', 'Sector', 'Filer Type', 'Score', 'GHG', 'Risk', 'Fin.Impact', 'Trans.Plan', 'Scenario', 'SBTi', 'ICP', 'Assurance', 'Gaps', 'Status'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                  <td style={{ ...tdS, fontWeight: 600, fontSize: 11, color: T.navy }}>{c.name}</td>
                  <td style={{ ...tdS, fontSize: 11 }}>{c.sector}</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{c.filerType.replace(' Filer', '')}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: statusColor(c.status), fontFamily: T.mono }}>{c.complianceScore}</td>
                  <td style={{ ...tdS, textAlign: 'center', color: c.ghgDisclosed ? T.green : T.red }}>{c.ghgDisclosed ? '✓' : '✗'}</td>
                  <td style={{ ...tdS, textAlign: 'center', color: c.riskDisclosed ? T.green : T.red }}>{c.riskDisclosed ? '✓' : '✗'}</td>
                  <td style={{ ...tdS, textAlign: 'center', color: c.financialImpact ? T.green : T.red }}>{c.financialImpact ? '✓' : '✗'}</td>
                  <td style={{ ...tdS, textAlign: 'center', color: c.transitionPlan ? T.green : T.textMut }}>{c.transitionPlan ? '✓' : '–'}</td>
                  <td style={{ ...tdS, textAlign: 'center', color: c.scenarioAnalysis ? T.green : T.textMut }}>{c.scenarioAnalysis ? '✓' : '–'}</td>
                  <td style={{ ...tdS, fontSize: 10, color: c.sbtiStatus === 'Approved' ? T.green : c.sbtiStatus === 'Committed' ? T.amber : T.textMut }}>{c.sbtiStatus}</td>
                  <td style={{ ...tdS, fontFamily: T.mono, fontSize: 10, color: c.internalCarbonPrice ? T.gold : T.textMut }}>{c.internalCarbonPrice ? `$${c.internalCarbonPrice}` : '–'}</td>
                  <td style={{ ...tdS, fontSize: 10, color: c.assurance === 'Limited' ? T.sage : T.textMut }}>{c.assurance}</td>
                  <td style={{ ...tdS, textAlign: 'center', color: c.disclosureGaps > 0 ? T.amber : T.green, fontFamily: T.mono }}>{c.disclosureGaps}</td>
                  <td style={tdS}><span style={{ color: statusColor(c.status), fontWeight: 600, fontSize: 11 }}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Disclosure Requirements' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Mandatory Items" value={DISCLOSURE_REQUIREMENTS.filter(r => r.required).length} sub={`of ${DISCLOSURE_REQUIREMENTS.length} total`} color={T.red} />
            <KpiCard label="GHG-Related" value={DISCLOSURE_REQUIREMENTS.filter(r => r.category === 'GHG Quantification').length} color={T.teal} />
            <KpiCard label="Financial Disclosure" value={DISCLOSURE_REQUIREMENTS.filter(r => r.category === 'Financial Disclosure').length} color={T.gold} />
            <KpiCard label="High Difficulty" value={DISCLOSURE_REQUIREMENTS.filter(r => r.difficulty === 'High' || r.difficulty === 'Very High').length} color={T.amber} />
          </div>
          <div style={{ overflowX: 'auto', ...cS, padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Requirement', 'Category', 'Required', 'Difficulty', 'Notes'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {DISCLOSURE_REQUIREMENTS.map((r, i) => (
                  <tr key={r.req} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 12 }}>{r.req}</td>
                    <td style={{ ...tdS, color: T.teal, fontSize: 11 }}>{r.category}</td>
                    <td style={{ ...tdS, textAlign: 'center', color: r.required ? T.green : T.textMut }}>{r.required ? '✓ Mandatory' : '○ Voluntary'}</td>
                    <td style={tdS}><span style={{ color: diffColor(r.difficulty), fontSize: 11, fontWeight: 600 }}>{r.difficulty}</span></td>
                    <td style={{ ...tdS, fontSize: 11, color: T.textSec }}>{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'GHG Disclosures' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Average Scope 1 Emissions by Sector (ktCO₂e)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SECTORS.map(s => ({
                sector: s,
                scope1: Math.round(COMPANIES.filter(c => c.sector === s).reduce((sum, c) => sum + c.scope1, 0) / Math.max(1, COMPANIES.filter(c => c.sector === s).length)),
                scope2: Math.round(COMPANIES.filter(c => c.sector === s).reduce((sum, c) => sum + c.scope2, 0) / Math.max(1, COMPANIES.filter(c => c.sector === s).length)),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Bar dataKey="scope1" fill={T.navy} name="Scope 1" stackId="a" />
                <Bar dataKey="scope2" fill={T.teal} name="Scope 2" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>GHG Disclosure Rate by Sector (%)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SECTORS.map(s => ({
                sector: s,
                rate: Math.round(COMPANIES.filter(c => c.sector === s && c.ghgDisclosed).length / Math.max(1, COMPANIES.filter(c => c.sector === s).length) * 100),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-25} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {SECTORS.map((s, i) => {
                    const r = Math.round(COMPANIES.filter(c => c.sector === s && c.ghgDisclosed).length / Math.max(1, COMPANIES.filter(c => c.sector === s).length) * 100);
                    return <Cell key={i} fill={r > 70 ? T.green : r > 50 ? T.amber : T.red} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Compliance Score vs Scope 1 Emissions</div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Scope 1 (kt)" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis dataKey="y" name="Compliance Score" tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Scatter data={filtered.map(c => ({ name: c.name, x: c.scope1, y: c.complianceScore }))} fill={T.gold} fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Internal Carbon Price Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { range: '$0–25', count: COMPANIES.filter(c => c.internalCarbonPrice && c.internalCarbonPrice < 25).length },
                { range: '$25–50', count: COMPANIES.filter(c => c.internalCarbonPrice && c.internalCarbonPrice >= 25 && c.internalCarbonPrice < 50).length },
                { range: '$50–100', count: COMPANIES.filter(c => c.internalCarbonPrice && c.internalCarbonPrice >= 50 && c.internalCarbonPrice < 100).length },
                { range: '$100–150', count: COMPANIES.filter(c => c.internalCarbonPrice && c.internalCarbonPrice >= 100).length },
                { range: 'No ICP', count: COMPANIES.filter(c => !c.internalCarbonPrice).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {[T.green, T.teal, T.amber, T.gold, T.textMut].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Phase Timeline' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            {COMPLIANCE_PHASES.map((p, i) => (
              <div key={p.phase} style={{ ...cS, borderLeft: `4px solid ${p.status === 'Active' ? T.green : p.status === 'Stayed' ? T.amber : T.navy}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{p.phase}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Deadline: {p.deadline}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: p.status === 'Active' ? T.green : p.status === 'Stayed' ? T.amber : T.textSec, background: `${p.status === 'Active' ? T.green : T.amber}20`, padding: '4px 10px', borderRadius: 6 }}>{p.status}</span>
                </div>
                <div style={{ fontSize: 13, color: T.textSec }}><strong style={{ color: T.text }}>Scope:</strong> {p.scope}</div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}><strong style={{ color: T.text }}>Filer Type:</strong> {p.filerType}</div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}><strong style={{ color: T.text }}>Assurance:</strong> {p.assurance}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Sector Analysis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Avg Compliance Score by Sector</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SECTOR_BENCHMARKS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-25} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Bar dataKey="avgCompliance" fill={T.sage} radius={[4, 4, 0, 0]} name="Avg Compliance Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Transition Plan & Scenario Adoption by Sector (%)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SECTOR_BENCHMARKS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Bar dataKey="transitionPlanPct" fill={T.teal} name="Transition Plan %" />
                <Bar dataKey="scenarioPct" fill={T.gold} name="Scenario Analysis %" />
                <Bar dataKey="sbtiApproved" fill={T.green} name="SBTi Approved %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ICP Adoption & GHG Disclosure (%)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SECTOR_BENCHMARKS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Bar dataKey="icpAdopters" fill={T.amber} name="ICP Adopters %" />
                <Bar dataKey="ghgDiscPct" fill={T.navy} name="GHG Disclosure %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Average Scope 1 by Sector (ktCO₂e)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SECTOR_BENCHMARKS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis type="category" dataKey="sector" tick={{ fontSize: 9, fill: T.textSec }} width={80} />
                <Tooltip {...tip} />
                <Bar dataKey="avgScope1" fill={T.red} radius={[0, 4, 4, 0]} name="Avg Scope 1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Gap Assessment' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[['0 Gaps', COMPANIES.filter(c => c.disclosureGaps === 0).length, T.green], ['1 Gap', COMPANIES.filter(c => c.disclosureGaps === 1).length, T.amber], ['2 Gaps', COMPANIES.filter(c => c.disclosureGaps === 2).length, T.red], ['3 Gaps', COMPANIES.filter(c => c.disclosureGaps === 3).length, '#a855f7']].map(([l, v, c]) => (
              <KpiCard key={l} label={l} value={v} sub={`of ${COMPANIES.length} filers`} color={c} />
            ))}
          </div>
          <div style={{ ...cS }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Filers with Disclosure Gaps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COMPANIES.filter(c => c.disclosureGaps > 0).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: T.surfaceH, borderRadius: 8, borderLeft: `3px solid ${c.disclosureGaps >= 2 ? T.red : T.amber}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.sector} · {c.filerType.replace(' Filer', '')} · Rev ${c.revenue}Bn</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!c.ghgDisclosed && <span style={{ fontSize: 10, color: T.red, background: T.red + '20', padding: '2px 6px', borderRadius: 4 }}>GHG</span>}
                    {!c.riskDisclosed && <span style={{ fontSize: 10, color: T.amber, background: T.amber + '20', padding: '2px 6px', borderRadius: 4 }}>Risk</span>}
                    {!c.financialImpact && <span style={{ fontSize: 10, color: T.gold, background: T.gold + '20', padding: '2px 6px', borderRadius: 4 }}>FinImpact</span>}
                    <span style={{ fontSize: 13, fontWeight: 700, color: statusColor(c.status), fontFamily: T.mono }}>{c.complianceScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'International Comparison' && (
        <div>
          <div style={{ overflowX: 'auto', ...cS, padding: 0, marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Framework', 'Jurisdiction', 'S1', 'S2', 'S3', 'Fin.Risk', 'Scenario', 'Biodiversity', 'Social', 'Assurance', 'Effective', 'Coverage'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {INTL_COMPARISON.map((f, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 12 }}>{f.framework}</td>
                    <td style={{ ...tdS, color: T.navy, fontSize: 11 }}>{f.jurisdiction}</td>
                    {[f.scope1, f.scope2, f.scope3, f.financialRisk, f.scenario, f.biodiversity, f.social].map((v, j) => (
                      <td key={j} style={{ ...tdS, textAlign: 'center', color: v ? T.green : T.textMut }}>{v ? '✓' : '–'}</td>
                    ))}
                    <td style={{ ...tdS, fontSize: 10, color: T.teal }}>{f.assurance}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, fontSize: 10 }}>{f.effective}</td>
                    <td style={{ ...tdS, fontSize: 10, color: T.textSec }}>{f.coverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Framework Coverage Comparison</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={INTL_COMPARISON.map(f => ({
                  name: f.framework.split(' ')[0],
                  score: [f.scope1, f.scope2, f.scope3, f.financialRisk, f.scenario, f.biodiversity, f.social].filter(Boolean).length,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={44} />
                  <YAxis domain={[0, 7]} tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="score" fill={T.navy} radius={[4, 4, 0, 0]} name="Disclosure Dimensions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Key Differences: SEC vs CSRD</div>
              {[
                { dim: 'Scope 3', sec: 'Stayed (not required)', csrd: 'Mandatory for large cos' },
                { dim: 'Biodiversity', sec: 'Not required', csrd: 'ESRS E4 — biodiversity impacts' },
                { dim: 'Social', sec: 'Not required', csrd: 'ESRS S1-S4 — full workforce + community' },
                { dim: 'Assurance', sec: 'Limited (PCAOB)', csrd: 'Limited → Reasonable (IAASB)' },
                { dim: 'Double Materiality', sec: 'Financial materiality only', csrd: 'Financial + Impact materiality' },
                { dim: 'Coverage', sec: 'SEC registrants only', csrd: '50,000+ EU + non-EU cos' },
              ].map((d, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.gold, marginBottom: 4 }}>{d.dim}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ fontSize: 10, color: T.textSec }}><span style={{ color: T.navy }}>SEC:</span> {d.sec}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}><span style={{ color: T.sage }}>CSRD:</span> {d.csrd}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Cost Calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cS}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Compliance Cost Estimator</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>Filer Type</div>
                <select value={calcFilerType} onChange={e => setCalcFilerType(e.target.value)} style={{ ...selS, width: '100%', fontSize: 12 }}>
                  {FILER_TYPES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Annual Revenue ($M): <strong style={{ color: T.text }}>{calcRevenue}</strong></div>
                <input type="range" min={10} max={5000} step={10} value={calcRevenue} onChange={e => setCalcRevenue(+e.target.value)} style={{ width: '100%', accentColor: T.navy }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={calcScope3} onChange={e => setCalcScope3(e.target.checked)} id="scope3toggle" />
                <label htmlFor="scope3toggle" style={{ fontSize: 12, color: T.text, cursor: 'pointer' }}>Include Scope 3 preparation (future proofing)</label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                {[
                  ['Year 1 Implementation', `$${complianceCost.base}M`],
                  ['Scope 3 Addition', `$${complianceCost.scope3Extra}M`],
                  ['Total First Year', `$${complianceCost.total}M`],
                  ['Annual Maintenance', `$${complianceCost.annualMaint}M`],
                  ['External Advisors', `$${complianceCost.external}M`],
                  ['Est. 5-Year Total', `$${(complianceCost.total + complianceCost.annualMaint * 4).toFixed(2)}M`],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: T.surfaceH, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: T.textSec, marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Typical Cost Breakdown by Component</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={[
                  { name: 'GHG Quantification', value: 25 },
                  { name: 'Legal & Compliance', value: 20 },
                  { name: 'Assurance/Audit', value: 18 },
                  { name: 'Technology Systems', value: 15 },
                  { name: 'Risk Assessment', value: 12 },
                  { name: 'Reporting/Disclosure', value: 10 },
                ]} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name">
                  {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip {...tip} />
                <Legend formatter={v => <span style={{ fontSize: 10, color: T.textSec }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Assurance Framework' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
            {ASSURANCE_FRAMEWORK.map((a, i) => (
              <div key={i} style={{ ...cS, borderTop: `3px solid ${COLORS[i % COLORS.length]}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{a.standard}</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: T.navy, background: T.navy + '20', padding: '2px 7px', borderRadius: 4 }}>{a.type}</span>
                  <span style={{ fontSize: 10, color: T.gold, background: T.gold + '20', padding: '2px 7px', borderRadius: 4 }}>{a.level}</span>
                  <span style={{ fontSize: 10, color: T.sage, background: T.sage + '20', padding: '2px 7px', borderRadius: 4 }}>{a.phase}</span>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}><strong style={{ color: T.text }}>Applicability:</strong> {a.applicability}</div>
                <div style={{ fontSize: 11, color: T.green, marginBottom: 4 }}><strong>Strengths:</strong> {a.strengths}</div>
                <div style={{ fontSize: 11, color: T.amber }}><strong>Challenges:</strong> {a.challenges}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Enforcement' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Actions Tracked" value={ENFORCEMENT.length} />
            <KpiCard label="ESG Investigations" value={ENFORCEMENT.filter(e => e.type === 'Investigation').length} color={T.amber} />
            <KpiCard label="Enforcement Actions" value={ENFORCEMENT.filter(e => e.type === 'Enforcement').length} color={T.red} />
            <KpiCard label="Litigation Pending" value={ENFORCEMENT.filter(e => e.type === 'Litigation').length} color={T.gold} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ENFORCEMENT.map((e, i) => (
              <div key={i} style={{ ...cS, borderLeft: `4px solid ${e.type === 'Enforcement' ? T.red : e.type === 'Investigation' ? T.amber : T.navy}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{e.action}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Regulator: {e.regulator}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: e.type === 'Enforcement' ? T.red : e.type === 'Investigation' ? T.amber : T.navy, background: (e.type === 'Enforcement' ? T.red : e.type === 'Investigation' ? T.amber : T.navy) + '20', padding: '3px 8px', borderRadius: 6 }}>{e.type}</span>
                    {e.targets && <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{e.targets} target{e.targets > 1 ? 's' : ''}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Outcome</div><div style={{ fontSize: 12, fontWeight: 600, color: T.gold }}>{e.outcome}</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Detail</div><div style={{ fontSize: 12, color: T.textSec }}>{e.detail}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
