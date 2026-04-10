import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e',
  teal: '#0e7490', purple: '#6d28d9', blue: '#1d4ed8', orange: '#c2410c',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

/* ═══════════════════════════════════════════════════════════════════
   GREENWASHING TYPES
   ═══════════════════════════════════════════════════════════════════ */
const GREENWASH_TYPES = [
  { id: 'hidden-tradeoffs', name: 'Hidden Trade-offs', desc: 'Claiming greenness based on a narrow attribute while ignoring broader lifecycle impacts', severity: 'High', detection: 'LCA scope analysis, lifecycle boundary check, selective metric reporting', color: '#dc2626' },
  { id: 'lack-of-proof', name: 'Lack of Proof', desc: 'Environmental claims without accessible supporting evidence or third-party verification', severity: 'High', detection: 'Evidence request, certification check, audit trail verification', color: '#ea580c' },
  { id: 'vague-language', name: 'Vague Language', desc: 'Broad undefined terms like "eco-friendly", "green", "natural" without quantification', severity: 'Medium', detection: 'Terminology audit, quantification check, ISO 14021 compliance', color: '#d97706' },
  { id: 'false-imagery', name: 'False Imagery', desc: 'Use of nature imagery, green colors, or sustainability symbols unrelated to actual performance', severity: 'Medium', detection: 'Visual-claim alignment, imagery audit, consumer perception test', color: '#ca8a04' },
  { id: 'no-progress', name: 'No Progress', desc: 'Recycling old achievements or targets without reporting current performance trajectory', severity: 'High', detection: 'Temporal analysis, baseline drift check, target year verification', color: '#be123c' },
  { id: 'lesser-evils', name: 'Lesser of Two Evils', desc: 'Claiming relative improvement within an inherently unsustainable category', severity: 'Medium', detection: 'Absolute vs relative check, sector context, Paris alignment test', color: '#9333ea' },
  { id: 'fake-certifications', name: 'Fake Certifications', desc: 'Displaying non-existent, expired, or misleading certification logos or labels', severity: 'Critical', detection: 'Registry verification, expiry check, scope-of-certification match', color: '#7f1d1d' },
];

/* ═══════════════════════════════════════════════════════════════════
   ENFORCEMENT CASES
   ═══════════════════════════════════════════════════════════════════ */
const ENFORCEMENT_CASES = [
  { company: 'Shell', jurisdiction: 'Netherlands', year: 2021, penalty: 'Court Order', type: 'Emissions Reduction Order', detail: 'Hague District Court ordered 45% absolute CO2 reduction by 2030 vs 2019', gwType: 'no-progress', learning: 'Courts can mandate science-based targets' },
  { company: 'HSBC', jurisdiction: 'UK', year: 2022, penalty: 'ASA Ban', type: 'Misleading Advertising', detail: 'ASA banned ads claiming HSBC was helping reduce emissions while financing fossil fuels', gwType: 'hidden-tradeoffs', learning: 'Net-zero pledges must align with lending book' },
  { company: 'Ryanair', jurisdiction: 'UK', year: 2020, penalty: 'ASA Ban', type: 'Misleading Claim', detail: 'Lowest emissions claim based on per-passenger metric, ignoring absolute growth', gwType: 'lesser-evils', learning: 'Relative metrics must disclose absolute context' },
  { company: 'BNY Mellon', jurisdiction: 'USA', year: 2022, penalty: '$1.5M', type: 'SEC ESG Fund Misbranding', detail: 'Misstatements about ESG quality review for certain fund investments', gwType: 'lack-of-proof', learning: 'ESG integration claims require documented process' },
  { company: 'Goldman Sachs', jurisdiction: 'USA', year: 2022, penalty: '$4M', type: 'SEC ESG Fund Compliance', detail: 'ESG Clean Energy Fund failed to follow stated ESG investment policies', gwType: 'lack-of-proof', learning: 'Fund ESG policies must match actual holdings' },
  { company: 'DWS (Deutsche Bank)', jurisdiction: 'Germany', year: 2023, penalty: '$25M (SEC) + BaFin Investigation', type: 'ESG Fraud Investigation', detail: 'Former CIO whistleblower alleged ESG assets were overstated in annual report', gwType: 'fake-certifications', learning: 'Internal ESG classification must be auditable' },
  { company: 'Vale', jurisdiction: 'Brazil', year: 2022, penalty: '$7B+ Settlement', type: 'Environmental Disaster Liability', detail: 'Brumadinho dam collapse after repeated safety assurances in sustainability reports', gwType: 'no-progress', learning: 'Safety claims in reports carry legal weight' },
  { company: 'H&M', jurisdiction: 'Netherlands', year: 2022, penalty: 'ACM Warning', type: 'Sustainability Claims', detail: 'Conscious Collection sustainability scorecards found misleading by Dutch authority', gwType: 'vague-language', learning: 'Product-level green claims need verifiable methodology' },
  { company: 'Volkswagen', jurisdiction: 'Global', year: 2015, penalty: '$30B+', type: 'Emissions Fraud (Dieselgate)', detail: 'Deliberate emissions test defeat devices while marketing clean diesel', gwType: 'fake-certifications', learning: 'Emissions data fraud has existential financial consequences' },
  { company: 'TotalEnergies', jurisdiction: 'France', year: 2023, penalty: 'Lawsuit Filed', type: 'Climate Misleading', detail: 'NGOs filed suit alleging carbon neutrality claims were misleading under French law', gwType: 'vague-language', learning: 'Carbon neutrality claims require robust offset evidence' },
  { company: 'Keurig', jurisdiction: 'Canada', year: 2022, penalty: 'C$3M', type: 'Recyclability Misrepresentation', detail: 'K-Cup pods marketed as recyclable when most municipal systems could not process them', gwType: 'hidden-tradeoffs', learning: 'Recyclability must reflect actual infrastructure' },
  { company: 'Danone', jurisdiction: 'France', year: 2023, penalty: 'Warning', type: 'Carbon Neutral Label', detail: 'Evian carbon neutral claim challenged under new French anti-greenwashing law', gwType: 'vague-language', learning: 'Carbon neutral labels face increasing legal scrutiny' },
  { company: 'Samsung SDI', jurisdiction: 'South Korea', year: 2023, penalty: 'Regulatory Review', type: 'ESG Rating Inflation', detail: 'Discrepancy between internal ESG practices and reported ratings under K-ESG', gwType: 'lack-of-proof', learning: 'ESG ratings must be backed by operational evidence' },
  { company: 'Barclays', jurisdiction: 'UK', year: 2023, penalty: 'ClientEarth Lawsuit', type: 'Climate Strategy Adequacy', detail: 'Shareholder resolution challenging climate plan as inadequate vs Paris commitments', gwType: 'no-progress', learning: 'Transition plans are becoming legally actionable' },
  { company: 'Santos', jurisdiction: 'Australia', year: 2023, penalty: 'Court Ruling', type: 'Net Zero Misleading', detail: 'Federal Court found net zero by 2040 claim misleading under Australian law', gwType: 'vague-language', learning: 'Net zero claims require credible reduction pathway' },
];

/* ═══════════════════════════════════════════════════════════════════
   QA CHECKLIST
   ═══════════════════════════════════════════════════════════════════ */
const QA_CATEGORIES = [
  { cat: 'Basic Data Quality', items: [
    'All numeric KPIs have units and base year', 'Year-over-year change percentages verified', 'Scope 1/2/3 boundaries clearly defined',
    'Emission factors sourced and referenced', 'Currency and unit consistency across sections', 'Rounding policy applied uniformly',
    'Footnotes present for all estimates', 'Data vintage disclosed for each metric', 'Restatements explicitly flagged'
  ]},
  { cat: 'iXBRL Compliance', items: [
    'All mandatory ESRS data points tagged', 'XBRL taxonomy version matches EFRAG 2024', 'Inline tagging validated against schema',
    'Dimensional qualifiers (sector, geography) applied', 'Negative values use sign convention', 'Duration vs instant contexts correct',
    'Custom extensions minimized (<5% of tags)', 'Filing package passes ESEF validator', 'Block tagging covers all narrative sections',
    'Anchoring to base taxonomy documented'
  ]},
  { cat: 'Narrative Quality', items: [
    'Forward-looking statements have time horizons', 'Tone consistency across sections', 'Plain language score >60 (Flesch-Kincaid)',
    'Claims supported by data within 2 pages', 'Risk/opportunity balance maintained', 'Stakeholder materiality reflected in emphasis',
    'CEO letter aligns with data section', 'No orphaned acronyms (all defined on first use)'
  ]},
  { cat: 'Greenwashing Prevention', items: [
    'No vague environmental claims without quantification', 'All certifications verified and current', 'Relative improvements contextualized with absolute data',
    'Nature imagery matches actual environmental performance', 'Historical baselines not selectively chosen', 'Offset quality substantiated with registry links',
    'Avoided emissions clearly separated from reduced emissions'
  ]},
  { cat: 'Internal Audit Readiness', items: [
    'Data lineage traceable to source system', 'Calculation methodology documented', 'Change log maintained for all revisions',
    'Segregation of duties between preparer and reviewer', 'Management assertions documented', 'Control testing evidence filed',
    'Materiality threshold documented and applied', 'Exception reporting process defined', 'Reconciliation to financial statements completed',
    'Board sign-off evidenced'
  ]},
  { cat: 'Third-Party Assurance', items: [
    'ISAE 3000 scope of assurance defined', 'Material topics subject to reasonable assurance', 'Assurance provider independence confirmed',
    'Competency requirements met (environmental expertise)', 'Management representation letter prepared', 'Prior year findings remediated',
    'Limited assurance vs reasonable assurance distinction clear', 'Assurance report distribution controls in place',
    'Engagement letter terms match report scope', 'Findings remediation timeline agreed'
  ]},
];

const TOTAL_QA_ITEMS = QA_CATEGORIES.reduce((s, c) => s + c.items.length, 0);

/* ═══════════════════════════════════════════════════════════════════
   ASSURANCE LEVELS
   ═══════════════════════════════════════════════════════════════════ */
const ASSURANCE_LEVELS = [
  { level: 'None', confidence: 0, description: 'No external assurance engagement', color: '#dc2626' },
  { level: 'Limited', confidence: 40, description: 'Negative form: nothing came to our attention (ISAE 3000 limited)', color: '#d97706' },
  { level: 'Reasonable', confidence: 75, description: 'Positive form: in our opinion fairly stated (ISAE 3000 reasonable)', color: '#2563eb' },
  { level: 'High', confidence: 95, description: 'Statutory audit-level assurance with substantive testing', color: '#065f46' },
];

/* ═══════════════════════════════════════════════════════════════════
   ISAE 3000 REQUIREMENTS
   ═══════════════════════════════════════════════════════════════════ */
const ISAE_REQS = [
  { id: 'ISA-01', req: 'Ethical Requirements', desc: 'Independence, objectivity, professional skepticism', status: 'met', evidence: 'Annual independence declaration filed' },
  { id: 'ISA-02', req: 'Quality Control', desc: 'Firm-level quality management (ISQM 1)', status: 'met', evidence: 'ISQM 1 framework implemented' },
  { id: 'ISA-03', req: 'Engagement Acceptance', desc: 'Preconditions assessment, competence evaluation', status: 'partial', evidence: 'Competence matrix partially documented' },
  { id: 'ISA-04', req: 'Planning', desc: 'Understanding entity, materiality, risk assessment', status: 'met', evidence: 'Planning memorandum signed off' },
  { id: 'ISA-05', req: 'Evidence Gathering', desc: 'Sufficient appropriate evidence for conclusion', status: 'partial', evidence: 'Scope 3 evidence gaps in Cat 6,7,8' },
  { id: 'ISA-06', req: 'Using Work of Others', desc: 'Management expert, internal audit reliance', status: 'met', evidence: 'Internal audit reliance letter obtained' },
  { id: 'ISA-07', req: 'Subsequent Events', desc: 'Events between period end and report date', status: 'not-started', evidence: 'Process not yet defined' },
  { id: 'ISA-08', req: 'Written Representations', desc: 'Management representation letter', status: 'partial', evidence: 'Draft prepared, not signed' },
  { id: 'ISA-09', req: 'Forming Conclusion', desc: 'Evaluating misstatements, sufficient evidence', status: 'not-started', evidence: 'Pending completion of fieldwork' },
  { id: 'ISA-10', req: 'Reporting', desc: 'Assurance report format, distribution', status: 'not-started', evidence: 'Template selected, not populated' },
];

/* ═══════════════════════════════════════════════════════════════════
   DATA LINEAGE ENTRIES
   ═══════════════════════════════════════════════════════════════════ */
const LINEAGE_ENTRIES = Array.from({ length: 30 }, (_, i) => {
  const seed = i * 41 + 500;
  const metrics = ['Scope 1 GHG','Scope 2 GHG','Scope 3 Cat 1','Scope 3 Cat 11','Energy Consumption','Water Withdrawal','Waste Generated','Employee Count','Revenue','LTIR','Gender Pay Gap','Board Independence','GHG Intensity','Renewable Energy %','Biodiversity Impact'];
  const sources = ['ERP SAP S/4HANA','Utility Invoices','Supplier Surveys','EPA GHGRP','CDP Disclosure','Internal HSE System','HR Payroll','Financial Controller','Energy Mgmt System','IoT Sensors','Manual Estimation','Industry Benchmark','Ecoinvent 3.10','DEFRA EF Database'];
  const transforms = ['Direct Measurement','Activity-based Calculation','Spend-based Estimation','Supplier-specific EF','Average-data Method','Hybrid Approach','Extrapolation','Statistical Sampling'];
  const retentionYrs = [7, 7, 7, 10, 10, 7, 7, 10, 10, 7, 7, 10, 7, 7, 10];
  const mi = Math.floor(sr(seed) * metrics.length);
  return {
    id: `DL-${String(i + 1).padStart(3, '0')}`,
    metric: metrics[mi],
    source: sources[Math.floor(sr(seed + 1) * sources.length)],
    transform: transforms[Math.floor(sr(seed + 2) * transforms.length)],
    retentionYears: retentionYrs[mi],
    lastUpdated: `2024-${String(Math.floor(sr(seed + 3) * 12) + 1).padStart(2, '0')}-${String(Math.floor(sr(seed + 4) * 28) + 1).padStart(2, '0')}`,
    qualityScore: Math.round(50 + sr(seed + 5) * 50),
    assuranceLevel: ASSURANCE_LEVELS[Math.floor(sr(seed + 6) * 4)].level,
    documented: sr(seed + 7) > 0.3,
  };
});

/* ═══════════════════════════════════════════════════════════════════
   SIMULATED COMPANIES FOR SCANNING
   ═══════════════════════════════════════════════════════════════════ */
const COMPANIES = Array.from({ length: 25 }, (_, i) => {
  const seed = i * 53 + 800;
  const names = ['EcoVerde Corp','GreenShield plc','BlueSky Holdings','TerraPure Inc','SustainCo Ltd','CleanFuture AG','NaturBond SA','GreenWave Tech','EarthFirst Corp','SolarPath Inc','AquaPure Holdings','WindForce plc','BioHarvest Ltd','CarbonZero SA','EcoNexus Corp','GreenBridge AG','PureEnergy Inc','TerraFirma plc','SustainEx Ltd','CleanStream Corp','NaturaVida SA','EcoTech Holdings','GreenPath Inc','BlueTide Corp','EarthBond AG'];
  const claims = Math.floor(3 + sr(seed) * 8);
  const flagged = Math.floor(sr(seed + 1) * (claims + 1));
  return {
    name: names[i],
    sector: ['Energy','Materials','Industrials','Consumer Staples','Financials','Technology','Healthcare','Utilities','Real Estate','Telecom'][Math.floor(sr(seed + 2) * 10)],
    totalClaims: claims,
    flaggedClaims: flagged,
    riskScore: Math.round(flagged > 0 ? (flagged / Math.max(1, claims)) * 100 : 5 + sr(seed + 3) * 15),
    assuranceLevel: ASSURANCE_LEVELS[Math.floor(sr(seed + 4) * 4)].level,
    qaCompletion: Math.round(40 + sr(seed + 5) * 60),
    topRisk: GREENWASH_TYPES[Math.floor(sr(seed + 6) * GREENWASH_TYPES.length)].name,
  };
});

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
const TABS = ['QA Dashboard','Greenwashing Scanner','QA Checklist','Assurance Readiness','iXBRL Validation','Enforcement Tracker','Data Lineage Audit','Claim Substantiation'];

const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, borderRadius: 10, padding: '16px 20px', border: `1px solid ${T.border}`, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text, fontFamily: T.mono, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function ReportQualityEnginePage() {
  const [tab, setTab] = useState(0);
  const [checkedItems, setCheckedItems] = useState({});
  const [sectorFilter, setSectorFilter] = useState('All');
  const [claimText, setClaimText] = useState('');
  const [claimResult, setClaimResult] = useState(null);
  const [sortCol, setSortCol] = useState('riskScore');
  const [sortDir, setSortDir] = useState('desc');
  const [lineageFilter, setLineageFilter] = useState('All');

  const totalChecked = Object.values(checkedItems).filter(Boolean).length;
  const qaPercent = TOTAL_QA_ITEMS > 0 ? Math.round((totalChecked / TOTAL_QA_ITEMS) * 100) : 0;

  const toggleCheck = useCallback((cat, idx) => {
    const key = `${cat}-${idx}`;
    setCheckedItems(p => ({ ...p, [key]: !p[key] }));
  }, []);

  const avgRisk = useMemo(() => {
    const len = COMPANIES.length;
    return len > 0 ? Math.round(COMPANIES.reduce((s, c) => s + c.riskScore, 0) / len) : 0;
  }, []);

  const avgQa = useMemo(() => {
    const len = COMPANIES.length;
    return len > 0 ? Math.round(COMPANIES.reduce((s, c) => s + c.qaCompletion, 0) / len) : 0;
  }, []);

  const filteredCompanies = useMemo(() => {
    let arr = sectorFilter === 'All' ? COMPANIES : COMPANIES.filter(c => c.sector === sectorFilter);
    return [...arr].sort((a, b) => sortDir === 'asc' ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
  }, [sectorFilter, sortCol, sortDir]);

  const sectors = useMemo(() => ['All', ...new Set(COMPANIES.map(c => c.sector))], []);

  const gwDistribution = useMemo(() => GREENWASH_TYPES.map(g => ({
    name: g.name.split(' ').slice(0, 2).join(' '),
    count: COMPANIES.reduce((s, c) => s + (c.topRisk === g.name ? 1 : 0), 0),
    color: g.color
  })), []);

  const assuranceDistribution = useMemo(() => ASSURANCE_LEVELS.map(a => ({
    name: a.level,
    count: COMPANIES.filter(c => c.assuranceLevel === a.level).length,
    color: a.color
  })), []);

  const filteredLineage = useMemo(() => {
    if (lineageFilter === 'All') return LINEAGE_ENTRIES;
    return LINEAGE_ENTRIES.filter(e => e.assuranceLevel === lineageFilter);
  }, [lineageFilter]);

  const analyzeClaim = useCallback(() => {
    if (!claimText.trim()) return;
    const text = claimText.toLowerCase();
    const results = GREENWASH_TYPES.map(g => {
      let score = Math.round(5 + sr(text.length * 7 + g.id.length * 13) * 30);
      if (g.id === 'vague-language' && /(eco-friendly|green|natural|sustainable|clean|responsible)/.test(text)) score = Math.min(95, score + 45);
      if (g.id === 'lack-of-proof' && !/(verified|certified|audited|isae|iso|assur)/.test(text)) score = Math.min(95, score + 35);
      if (g.id === 'no-progress' && /(since|achieved|already|past|historic)/.test(text)) score = Math.min(95, score + 30);
      if (g.id === 'hidden-tradeoffs' && /(per unit|intensity|relative|compared to)/.test(text)) score = Math.min(95, score + 25);
      if (g.id === 'lesser-evils' && /(cleaner|better than|less|reduced|lower than)/.test(text)) score = Math.min(95, score + 30);
      if (g.id === 'fake-certifications' && /(certified|label|badge|seal|endorsed)/.test(text) && !/(iso|isae|gri|esrs|tcfd)/.test(text)) score = Math.min(95, score + 40);
      if (g.id === 'false-imagery') score = Math.max(5, score - 10);
      return { ...g, riskScore: score };
    });
    const overall = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.riskScore, 0) / results.length) : 0;
    setClaimResult({ results: [...results].sort((a, b) => b.riskScore - a.riskScore), overall });
  }, [claimText]);

  /* ─── iXBRL validation items ─── */
  const ixbrlItems = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const seed = i * 29 + 200;
    const tags = ['ESRS E1-6 GHG Total','ESRS E1-4 Targets','ESRS E2-4 Water Use','ESRS S1-6 Workforce','ESRS G1-1 Governance','ESRS E1-1 Transition Plan','ESRS E3-1 Marine','ESRS E4-1 Biodiversity','ESRS E5-1 Circular Economy','ESRS S2-1 Value Chain','ESRS E1-5 Energy','ESRS E1-9 Carbon Credits','ESRS S1-1 Own Workforce','ESRS S3-1 Communities','ESRS S4-1 Consumers','ESRS G1-4 Lobbying','ESRS 2 GOV-1 Board','ESRS 2 SBM-3 Material Impacts','ESRS 2 IRO-1 Risk Process','ESRS 2 MDR-P Policies'];
    const statuses = ['Valid','Valid','Valid','Warning','Error','Valid','Valid','Warning','Valid','Valid'];
    return {
      tag: tags[i],
      status: statuses[Math.floor(sr(seed) * statuses.length)],
      completeness: Math.round(60 + sr(seed + 1) * 40),
      errors: Math.floor(sr(seed + 2) * 4),
      dimQualifiers: sr(seed + 3) > 0.3,
    };
  }), []);

  const ixbrlValid = ixbrlItems.filter(x => x.status === 'Valid').length;
  const ixbrlWarn = ixbrlItems.filter(x => x.status === 'Warning').length;
  const ixbrlErr = ixbrlItems.filter(x => x.status === 'Error').length;

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */
  const sty = {
    page: { fontFamily: T.font, background: T.surface, minHeight: '100vh', padding: 24, color: T.text },
    header: { marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 700, color: T.navy },
    subtitle: { fontSize: 13, color: T.sub, marginTop: 4 },
    tabs: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 },
    tab: (a) => ({ padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: a ? 700 : 500, cursor: 'pointer', background: a ? T.navy : 'transparent', color: a ? '#fff' : T.sub, border: 'none', fontFamily: T.font }),
    kpiRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 },
    card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 },
    cardTitle: { fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 11, color: T.sub, cursor: 'pointer' },
    td: { padding: '8px 10px', borderBottom: `1px solid ${T.border}` },
    select: { padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font },
    badge: (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: '#fff', background: c }),
    textarea: { width: '100%', minHeight: 100, padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, resize: 'vertical' },
    btn: { padding: '8px 20px', borderRadius: 6, border: 'none', background: T.navy, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font },
  };

  return (
    <div style={sty.page}>
      <div style={sty.header}>
        <div style={sty.title}>Report Quality & Anti-Greenwashing Engine</div>
        <div style={sty.subtitle}>QA, greenwashing prevention, and assurance readiness -- {TOTAL_QA_ITEMS} checklist items, {GREENWASH_TYPES.length} greenwashing types, {ENFORCEMENT_CASES.length} enforcement cases</div>
      </div>

      <div style={sty.tabs}>
        {TABS.map((t, i) => <button key={t} style={sty.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {/* ── TAB 0: QA Dashboard ── */}
      {tab === 0 && (<div>
        <div style={sty.kpiRow}>
          <KPI label="QA Completion" value={`${qaPercent}%`} sub={`${totalChecked} / ${TOTAL_QA_ITEMS} items`} color={qaPercent > 80 ? T.green : qaPercent > 50 ? T.amber : T.red} />
          <KPI label="Avg Greenwash Risk" value={`${avgRisk}%`} sub="Across 25 companies" color={avgRisk > 50 ? T.red : avgRisk > 30 ? T.amber : T.green} />
          <KPI label="Avg QA Score" value={`${avgQa}%`} sub="Checklist completion" color={avgQa > 70 ? T.green : T.amber} />
          <KPI label="Enforcement Cases" value={ENFORCEMENT_CASES.length} sub="Real-world precedents" color={T.indigo} />
          <KPI label="Assurance Ready" value={`${ISAE_REQS.filter(r => r.status === 'met').length}/${ISAE_REQS.length}`} sub="ISAE 3000 requirements" color={T.blue} />
        </div>
        <div style={sty.grid2}>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Greenwashing Type Distribution</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gwDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" name="Companies">{gwDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Assurance Level Distribution</div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={assuranceDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, count }) => `${name}: ${count}`}>
                  {assuranceDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Company Risk Overview</div>
          <div style={{ marginBottom: 8 }}>
            <select style={sty.select} value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <table style={sty.table}>
            <thead><tr>
              {['name','sector','totalClaims','flaggedClaims','riskScore','qaCompletion','assuranceLevel','topRisk'].map(c => (
                <th key={c} style={sty.th} onClick={() => { setSortCol(c); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                  {c.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} {sortCol === c ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {filteredCompanies.slice(0, 15).map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={sty.td}><strong>{c.name}</strong></td>
                  <td style={sty.td}>{c.sector}</td>
                  <td style={sty.td}>{c.totalClaims}</td>
                  <td style={sty.td}>{c.flaggedClaims}</td>
                  <td style={sty.td}><span style={sty.badge(c.riskScore > 50 ? T.red : c.riskScore > 30 ? '#d97706' : T.green)}>{c.riskScore}%</span></td>
                  <td style={sty.td}>{c.qaCompletion}%</td>
                  <td style={sty.td}>{c.assuranceLevel}</td>
                  <td style={sty.td}>{c.topRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* ── TAB 1: Greenwashing Scanner ── */}
      {tab === 1 && (<div>
        <div style={sty.kpiRow}>
          <KPI label="Greenwashing Types" value={GREENWASH_TYPES.length} sub="Detection frameworks" color={T.red} />
          <KPI label="Critical Severity" value={GREENWASH_TYPES.filter(g => g.severity === 'Critical').length} sub="Highest risk" color="#7f1d1d" />
          <KPI label="High Severity" value={GREENWASH_TYPES.filter(g => g.severity === 'High').length} color={T.red} />
          <KPI label="Medium Severity" value={GREENWASH_TYPES.filter(g => g.severity === 'Medium').length} color={T.amber} />
        </div>
        {GREENWASH_TYPES.map((g, i) => (
          <div key={g.id} style={{ ...sty.card, marginBottom: 12, borderLeft: `4px solid ${g.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{i + 1}. {g.name}</div>
              <span style={sty.badge(g.severity === 'Critical' ? '#7f1d1d' : g.severity === 'High' ? T.red : T.amber)}>{g.severity}</span>
            </div>
            <div style={{ fontSize: 13, color: T.text, marginBottom: 8 }}>{g.desc}</div>
            <div style={{ fontSize: 12, color: T.sub }}><strong>Detection Criteria:</strong> {g.detection}</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>
              <strong>Example Cases:</strong> {ENFORCEMENT_CASES.filter(e => e.gwType === g.id).map(e => `${e.company} (${e.year})`).join(', ') || 'N/A'}
            </div>
          </div>
        ))}
      </div>)}

      {/* ── TAB 2: QA Checklist ── */}
      {tab === 2 && (<div>
        <div style={sty.kpiRow}>
          <KPI label="Total Items" value={TOTAL_QA_ITEMS} sub={`${QA_CATEGORIES.length} categories`} color={T.indigo} />
          <KPI label="Completed" value={totalChecked} sub={`${qaPercent}% done`} color={T.green} />
          <KPI label="Remaining" value={TOTAL_QA_ITEMS - totalChecked} color={T.amber} />
        </div>
        {QA_CATEGORIES.map((cat, ci) => {
          const catChecked = cat.items.filter((_, ii) => checkedItems[`${ci}-${ii}`]).length;
          return (
            <div key={ci} style={{ ...sty.card, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={sty.cardTitle}>{cat.cat}</div>
                <span style={{ fontSize: 12, color: T.sub }}>{catChecked}/{cat.items.length}</span>
              </div>
              {cat.items.map((item, ii) => (
                <label key={ii} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={!!checkedItems[`${ci}-${ii}`]} onChange={() => toggleCheck(ci, ii)} />
                  <span style={{ textDecoration: checkedItems[`${ci}-${ii}`] ? 'line-through' : 'none', color: checkedItems[`${ci}-${ii}`] ? T.sub : T.text }}>{item}</span>
                </label>
              ))}
            </div>
          );
        })}
      </div>)}

      {/* ── TAB 3: Assurance Readiness ── */}
      {tab === 3 && (<div>
        <div style={sty.kpiRow}>
          <KPI label="ISAE 3000 Met" value={ISAE_REQS.filter(r => r.status === 'met').length} sub={`of ${ISAE_REQS.length} requirements`} color={T.green} />
          <KPI label="Partial" value={ISAE_REQS.filter(r => r.status === 'partial').length} color={T.amber} />
          <KPI label="Not Started" value={ISAE_REQS.filter(r => r.status === 'not-started').length} color={T.red} />
        </div>
        <div style={sty.grid2}>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Assurance Level Comparison</div>
            <table style={sty.table}>
              <thead><tr><th style={sty.th}>Level</th><th style={sty.th}>Confidence</th><th style={sty.th}>Description</th></tr></thead>
              <tbody>
                {ASSURANCE_LEVELS.map((a, i) => (
                  <tr key={i}><td style={sty.td}><span style={sty.badge(a.color)}>{a.level}</span></td><td style={sty.td}>{a.confidence}%</td><td style={sty.td}>{a.description}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={sty.card}>
            <div style={sty.cardTitle}>ISAE 3000 Readiness</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ISAE_REQS.map(r => ({ name: r.id, value: r.status === 'met' ? 100 : r.status === 'partial' ? 50 : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis domain={[0, 100]} fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" name="Readiness %">{ISAE_REQS.map((r, i) => <Cell key={i} fill={r.status === 'met' ? T.green : r.status === 'partial' ? '#d97706' : T.red} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>ISAE 3000 Requirement Detail</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>ID</th><th style={sty.th}>Requirement</th><th style={sty.th}>Description</th><th style={sty.th}>Status</th><th style={sty.th}>Evidence</th></tr></thead>
            <tbody>
              {ISAE_REQS.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={sty.td}><strong>{r.id}</strong></td>
                  <td style={sty.td}>{r.req}</td>
                  <td style={sty.td}>{r.desc}</td>
                  <td style={sty.td}><span style={sty.badge(r.status === 'met' ? T.green : r.status === 'partial' ? '#d97706' : T.red)}>{r.status}</span></td>
                  <td style={sty.td}>{r.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* ── TAB 4: iXBRL Validation ── */}
      {tab === 4 && (<div>
        <div style={sty.kpiRow}>
          <KPI label="Valid Tags" value={ixbrlValid} sub={`of ${ixbrlItems.length}`} color={T.green} />
          <KPI label="Warnings" value={ixbrlWarn} color={T.amber} />
          <KPI label="Errors" value={ixbrlErr} color={T.red} />
          <KPI label="Avg Completeness" value={`${ixbrlItems.length > 0 ? Math.round(ixbrlItems.reduce((s, x) => s + x.completeness, 0) / ixbrlItems.length) : 0}%`} color={T.indigo} />
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>ESRS Taxonomy Validation</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>ESRS Tag</th><th style={sty.th}>Status</th><th style={sty.th}>Completeness</th><th style={sty.th}>Errors</th><th style={sty.th}>Dim Qualifiers</th></tr></thead>
            <tbody>
              {ixbrlItems.map((x, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={sty.td}><strong>{x.tag}</strong></td>
                  <td style={sty.td}><span style={sty.badge(x.status === 'Valid' ? T.green : x.status === 'Warning' ? '#d97706' : T.red)}>{x.status}</span></td>
                  <td style={sty.td}>{x.completeness}%</td>
                  <td style={sty.td}>{x.errors}</td>
                  <td style={sty.td}>{x.dimQualifiers ? 'Applied' : 'Missing'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* ── TAB 5: Enforcement Tracker ── */}
      {tab === 5 && (<div>
        <div style={sty.kpiRow}>
          <KPI label="Total Cases" value={ENFORCEMENT_CASES.length} color={T.red} />
          <KPI label="Total Penalties" value="$35B+" sub="Aggregate known" color={T.red} />
          <KPI label="Jurisdictions" value={new Set(ENFORCEMENT_CASES.map(e => e.jurisdiction)).size} color={T.indigo} />
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Global Enforcement Cases</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Company</th><th style={sty.th}>Jurisdiction</th><th style={sty.th}>Year</th><th style={sty.th}>Penalty</th><th style={sty.th}>Type</th><th style={sty.th}>GW Type</th><th style={sty.th}>Learning</th></tr></thead>
            <tbody>
              {ENFORCEMENT_CASES.map((e, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={sty.td}><strong>{e.company}</strong></td>
                  <td style={sty.td}>{e.jurisdiction}</td>
                  <td style={sty.td}>{e.year}</td>
                  <td style={sty.td}><span style={sty.badge(T.red)}>{e.penalty}</span></td>
                  <td style={sty.td}>{e.type}</td>
                  <td style={sty.td}>{GREENWASH_TYPES.find(g => g.id === e.gwType)?.name || e.gwType}</td>
                  <td style={{ ...sty.td, fontSize: 11 }}>{e.learning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...sty.card, marginTop: 16 }}>
          <div style={sty.cardTitle}>Penalties by Year</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[2015, 2020, 2021, 2022, 2023].map(yr => ({ year: yr, cases: ENFORCEMENT_CASES.filter(e => e.year === yr).length }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="cases" name="Cases" fill={T.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>)}

      {/* ── TAB 6: Data Lineage Audit ── */}
      {tab === 6 && (<div>
        <div style={sty.kpiRow}>
          <KPI label="Lineage Entries" value={LINEAGE_ENTRIES.length} color={T.indigo} />
          <KPI label="7-Year Retention" value={LINEAGE_ENTRIES.filter(e => e.retentionYears >= 7).length} sub="Source data" color={T.green} />
          <KPI label="10-Year Retention" value={LINEAGE_ENTRIES.filter(e => e.retentionYears >= 10).length} sub="Audit records" color={T.blue} />
          <KPI label="Documented" value={LINEAGE_ENTRIES.filter(e => e.documented).length} sub={`of ${LINEAGE_ENTRIES.length}`} color={T.green} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <select style={sty.select} value={lineageFilter} onChange={e => setLineageFilter(e.target.value)}>
            {['All', ...ASSURANCE_LEVELS.map(a => a.level)].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Data Lineage Registry</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>ID</th><th style={sty.th}>Metric</th><th style={sty.th}>Source</th><th style={sty.th}>Transform</th><th style={sty.th}>Retention (yr)</th><th style={sty.th}>Quality</th><th style={sty.th}>Assurance</th><th style={sty.th}>Documented</th></tr></thead>
            <tbody>
              {filteredLineage.map((e, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={sty.td}><strong>{e.id}</strong></td>
                  <td style={sty.td}>{e.metric}</td>
                  <td style={sty.td}>{e.source}</td>
                  <td style={sty.td}>{e.transform}</td>
                  <td style={sty.td}>{e.retentionYears}</td>
                  <td style={sty.td}><span style={sty.badge(e.qualityScore > 80 ? T.green : e.qualityScore > 60 ? '#d97706' : T.red)}>{e.qualityScore}%</span></td>
                  <td style={sty.td}>{e.assuranceLevel}</td>
                  <td style={sty.td}>{e.documented ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* ── TAB 7: Claim Substantiation ── */}
      {tab === 7 && (<div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Sustainability Claim Analyzer</div>
          <div style={{ fontSize: 13, color: T.sub, marginBottom: 12 }}>Paste a sustainability claim below to analyze against 7 greenwashing types and receive a risk rating.</div>
          <textarea style={sty.textarea} value={claimText} onChange={e => setClaimText(e.target.value)} placeholder="e.g. 'Our products are made with eco-friendly materials and certified sustainable packaging, reducing our carbon footprint by 30% since 2019.'" />
          <div style={{ marginTop: 10 }}><button style={sty.btn} onClick={analyzeClaim}>Analyze Claim</button></div>
        </div>
        {claimResult && (
          <div style={{ marginTop: 16 }}>
            <div style={{ ...sty.card, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={sty.cardTitle}>Overall Greenwashing Risk</div>
                <span style={{ ...sty.badge(claimResult.overall > 60 ? T.red : claimResult.overall > 40 ? '#d97706' : T.green), fontSize: 16, padding: '4px 16px' }}>{claimResult.overall}%</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={claimResult.results.map(r => ({ type: r.name.split(' ').slice(0, 2).join(' '), risk: r.riskScore }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="type" fontSize={10} />
                    <PolarRadiusAxis domain={[0, 100]} fontSize={9} />
                    <Radar name="Risk" dataKey="risk" stroke={T.red} fill={T.red} fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Risk Breakdown by Greenwashing Type</div>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Type</th><th style={sty.th}>Risk Score</th><th style={sty.th}>Severity</th><th style={sty.th}>Detection Method</th></tr></thead>
                <tbody>
                  {claimResult.results.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                      <td style={sty.td}><strong>{r.name}</strong></td>
                      <td style={sty.td}><span style={sty.badge(r.riskScore > 60 ? T.red : r.riskScore > 40 ? '#d97706' : T.green)}>{r.riskScore}%</span></td>
                      <td style={sty.td}>{r.severity}</td>
                      <td style={sty.td}>{r.detection}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>)}
    </div>
  );
}
