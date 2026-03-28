import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, ScatterChart, Scatter, Legend, PieChart, Pie
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7',
  border: '#e5e0d8', borderL: '#d5cfc5',
  navy: '#1b3a5c', navyL: '#2c5a8c',
  gold: '#c5a96a', goldL: '#d4be8a',
  sage: '#5a8a6a', sageL: '#7ba67d',
  teal: '#5a8a6a',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ==================== REFERENCE DATA ==================== */

const SECTORS = [
  'Financials', 'Energy', 'Utilities', 'Materials', 'Industrials',
  'Consumer Staples', 'Consumer Discretionary', 'Healthcare', 'Technology',
  'Real Estate', 'Telecommunications', 'Transportation', 'Agriculture',
  'Mining', 'Chemicals'
];

const COUNTRIES = ['US', 'UK', 'DE', 'FR', 'JP', 'AU', 'CA', 'CH', 'NL', 'SG', 'SE', 'NO', 'DK', 'IT', 'ES'];

const TIERS = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Flagged'];

const TIER_COLORS = {
  Platinum: '#6366f1',
  Gold: T.gold,
  Silver: '#94a3b8',
  Bronze: '#b45309',
  Flagged: T.red
};

const SBTI = ['Approved', 'Committed', 'No Target'];
const ASSURANCE = ['Limited', 'Reasonable', 'None'];

const FLAG_TYPES = [
  'Score Gap >15pts',
  'Selective Disclosure',
  'Backward-Looking Only',
  'Scope 3 Omission',
  'Green Revenue Inflation',
  'Carbon Offset Reliance',
  'Governance Weakness',
  'Social Washing',
  'Biodiversity Blind Spot',
  'Supply Chain Opacity',
  'Transition Plan Absent',
  'Lobbying Misalignment'
];

const FLAG_DESC = [
  'Self-reported ESG score exceeds independent rating by >15 points, indicating potential overstatement of sustainability performance',
  'Company discloses only favorable metrics while omitting negative indicators that would present a more balanced view',
  'All climate targets reference historical baselines with no forward commitment to science-based reduction pathways',
  'Material Scope 3 emissions excluded from reporting boundary despite representing majority of carbon footprint',
  'Reported green revenue includes products with questionable environmental benefit or unverified sustainability claims',
  'Net-zero claims rely primarily on carbon offsets rather than absolute emissions reductions across operations',
  'Board lacks dedicated ESG committee or directors with demonstrable climate science or sustainability expertise',
  'Social impact claims lack quantitative evidence, third-party verification, or alignment with recognized social standards',
  'No biodiversity risk assessment conducted despite operating in or sourcing from ecologically sensitive ecosystems',
  'Tier 2+ supplier emissions, labor practices, and environmental impacts not monitored, reported, or independently verified',
  'No credible transition plan aligned with 1.5C or well-below 2C pathway with interim milestones and capital allocation',
  'Public climate pledges and sustainability commitments contradict trade association lobbying positions on climate policy'
];

const FLAG_SEVERITY = [9, 7, 6, 8, 7, 8, 6, 5, 6, 7, 9, 8];

const FLAG_REMEDIATION = [
  'Commission independent third-party ESG assessment, reconcile scoring gaps, and publish methodology comparison report',
  'Adopt GRI Universal Standards for comprehensive disclosure; implement SASB sector-specific metrics for complete coverage',
  'Develop forward-looking SBTi-aligned targets with 2030 interim milestones, annual progress reporting, and board accountability',
  'Conduct Scope 3 screening per GHG Protocol, include material categories (>5% of total) in reduction targets within 12 months',
  'Engage independent verifier to audit green revenue claims against EU Taxonomy technical screening criteria',
  'Cap offset usage at 10% of reduction plan, transition to high-quality removals, and prioritize absolute emission cuts',
  'Appoint ESG committee with at least two climate-competent directors; implement quarterly ESG performance reviews',
  'Establish quantitative social KPIs aligned with UN SDGs, engage third-party social auditor, and publish impact report',
  'Conduct TNFD-aligned LEAP assessment, map biodiversity dependencies and impacts, set nature-positive targets by 2027',
  'Extend supplier assessment to Tier 2+, implement CDP Supply Chain program, require supplier emissions disclosure',
  'Develop IEA Net-Zero aligned transition plan with capex allocation, technology roadmap, and just transition provisions',
  'Conduct lobbying alignment review per CA100+ benchmark, publish trade association climate policy positions annually'
];

const DISC_DIMS = [
  'GHG Emissions', 'Energy Use', 'Water Stress', 'Waste Management', 'Biodiversity',
  'Labor Practices', 'Human Rights', 'Board Diversity', 'Executive Pay',
  'Anti-Corruption', 'Supply Chain', 'Climate Targets', 'Transition Plan',
  'Taxonomy Alignment', 'Stakeholder Engagement'
];

const DISC_DIM_SOURCES = [
  'CDP Climate Response, GHG Protocol Inventory, Annual Sustainability Report, Verified Carbon Standard',
  'Energy Star Benchmarking, RE100 Commitment Data, ISO 50001 Certification Records',
  'CDP Water Security Response, WRI Aqueduct Risk Assessment, Local Water Authority Reports',
  'Zero Waste Certification Data, EPA TRI Reports, Circular Economy Metrics Dashboard',
  'TNFD LEAP Assessment, IBAT Biodiversity Risk Screen, IUCN Red List Cross-Reference',
  'SA8000 Certification, ILO Compliance Reports, Employee Survey Data, GRESB Social Assessment',
  'UN Guiding Principles Reporting Framework, Human Rights Impact Assessment, Supplier Audit Records',
  'Board Composition Disclosures, Annual Proxy Statement, Bloomberg Gender Equality Index',
  'Proxy Advisory Reports, Say-on-Pay Vote Results, ESG-Linked Compensation Disclosures',
  'Transparency International CPI Cross-Reference, Anti-Bribery Management System Records',
  'CDP Supply Chain Response, EcoVadis Supplier Ratings, Modern Slavery Statement Analysis',
  'SBTi Target Validation, Climate Action 100+ Benchmark, Net-Zero Tracker Assessment',
  'TPI Management Quality Assessment, ACT Transition Plan Evaluation, IEA Alignment Analysis',
  'EU Taxonomy Eligibility and Alignment Assessment, DNSH Criteria Evaluation Records',
  'Materiality Assessment Records, Stakeholder Engagement Log, Community Impact Reports'
];

const REG_REQS = [
  { id: 'R1', phase: 1, name: 'Methodology Transparency', desc: 'Full disclosure of ESG rating methodology including weighting, data sources, and scoring algorithms to enable comparability across providers', deadline: '2025-06-30' },
  { id: 'R2', phase: 1, name: 'Conflict of Interest Policy', desc: 'Documented policies to prevent conflicts between rating and consulting services, with annual compliance attestation', deadline: '2025-06-30' },
  { id: 'R3', phase: 1, name: 'Data Source Documentation', desc: 'Detailed record of all data sources used in ESG assessments, including data quality scores and coverage metrics', deadline: '2025-06-30' },
  { id: 'R4', phase: 1, name: 'Complaint Handling Procedure', desc: 'Formal procedure for rated entities to challenge or appeal ratings with defined SLAs and escalation paths', deadline: '2025-06-30' },
  { id: 'R5', phase: 1, name: 'Annual Transparency Report', desc: 'Publication of annual report on rating accuracy, methodology changes, and performance attribution analysis', deadline: '2025-06-30' },
  { id: 'R6', phase: 1, name: 'Analyst Qualification Standards', desc: 'Minimum qualification and continuing education requirements for ESG analysts including sector specialization', deadline: '2025-06-30' },
  { id: 'R7', phase: 2, name: 'Double Materiality Assessment', desc: 'Assessment of both financial materiality (outside-in) and impact materiality (inside-out) for all rated entities', deadline: '2026-01-01' },
  { id: 'R8', phase: 2, name: 'Scope 3 Integration', desc: 'Mandatory inclusion of material Scope 3 emissions categories in climate ratings with minimum coverage thresholds', deadline: '2026-01-01' },
  { id: 'R9', phase: 2, name: 'Forward-Looking Indicators', desc: 'Integration of transition risk, physical risk, and forward-looking scenario analysis metrics into rating models', deadline: '2026-01-01' },
  { id: 'R10', phase: 2, name: 'Taxonomy Alignment Mapping', desc: 'Mapping of economic activities to EU Taxonomy technical screening criteria with Do No Significant Harm assessment', deadline: '2026-01-01' },
  { id: 'R11', phase: 2, name: 'SFDR Data Integration', desc: 'Alignment of rating outputs with SFDR Principal Adverse Impact indicator requirements for fund-level reporting', deadline: '2026-01-01' },
  { id: 'R12', phase: 2, name: 'Biodiversity Risk Screening', desc: 'Integration of TNFD-aligned biodiversity and nature-related risk indicators into environmental scoring', deadline: '2026-01-01' },
  { id: 'R13', phase: 3, name: 'Real-Time Data Feeds', desc: 'Capability for continuous monitoring, controversy detection, and real-time rating updates via API feeds', deadline: '2027-01-01' },
  { id: 'R14', phase: 3, name: 'AI Model Governance', desc: 'Governance framework for AI/ML models used in ESG analysis including explainability, bias testing, and audit trail', deadline: '2027-01-01' },
  { id: 'R15', phase: 3, name: 'Cross-Border Harmonisation', desc: 'Alignment with ISSB S1/S2, SEC Climate Rule, and other international ESG disclosure and rating frameworks', deadline: '2027-01-01' },
  { id: 'R16', phase: 3, name: 'Social Taxonomy Readiness', desc: 'Preparation for EU Social Taxonomy classification requirements including decent work and community impact metrics', deadline: '2027-01-01' },
  { id: 'R17', phase: 3, name: 'Digital Reporting Standards', desc: 'XBRL/iXBRL tagging capability for machine-readable ESG data aligned with EFRAG digital taxonomy', deadline: '2027-01-01' },
  { id: 'R18', phase: 3, name: 'Independent Audit Trail', desc: 'Full audit trail enabling independent verification of rating decisions, data lineage, and analyst judgments', deadline: '2027-01-01' },
];

/* ==================== COMPANY GENERATOR ==================== */

const genCompanies = () => {
  const names = [
    'Apex Energy', 'Verdant Capital', 'NovaTech', 'BlueHarbor', 'GreenField Corp',
    'Solaris Holdings', 'Pacific Materials', 'Nordic Power', 'Atlas Industries', 'Meridian Health',
    'Pinnacle Finance', 'EcoStream', 'Titan Mining', 'Quantum Systems', 'Orion Utilities',
    'Cedar Partners', 'Falcon Transport', 'Sapphire Pharma', 'Horizon Agri', 'Cobalt Chemicals',
    'Sterling Bank', 'Aurora Energy', 'Zenith Tech', 'Coral Real Estate', 'Summit Telecom',
    'Maple Consumer', 'Iron Bridge Ind', 'Crystal Water', 'Diamond Health', 'Emerald Finance',
    'Vortex Energy', 'Glacier Materials', 'Phoenix Utilities', 'Nebula Systems', 'Cascade Industries',
    'Redwood Consumer', 'Thunder Transport', 'Ivy Healthcare', 'Prism Technology', 'Obsidian Mining',
    'Silverline Finance', 'Amber Power', 'Topaz Materials', 'Quartz Industries', 'Opal Consumer',
    'Garnet Energy', 'Jasper Utilities', 'Zephyr Telecom', 'Lotus Agriculture', 'Flint Chemicals',
    'Heritage Bank', 'Lunar Energy', 'Crescent Tech', 'Delta Real Estate', 'Nimbus Telecom',
    'Willow Consumer', 'Anchor Ind', 'Pearl Water', 'Ruby Health', 'Onyx Finance',
    'Tempest Energy', 'Glacier Power', 'Basalt Materials', 'Comet Systems', 'Riviera Industries',
    'Sage Consumer', 'Hawk Transport', 'Bloom Healthcare', 'Pixel Technology', 'Quarry Mining',
    'Goldcrest Finance', 'Solar Flare', 'Marble Tech', 'Dune Real Estate', 'Signal Telecom',
    'Harvest Consumer', 'Forge Industries', 'Spring Water', 'Vital Health', 'Slate Finance',
    'Gale Energy', 'Tundra Materials', 'Flash Utilities', 'Orbit Systems', 'Canyon Industries',
    'Thyme Consumer', 'Eagle Transport', 'Fern Healthcare', 'Cloud Technology', 'Bedrock Mining',
    'Crest Finance', 'Dawn Energy', 'Granite Tech', 'Isle Real Estate', 'Wave Telecom',
    'Berry Consumer', 'Anvil Industries', 'Brook Water', 'Core Health', 'Fossil Finance',
    'Breeze Energy', 'Reef Materials', 'Spark Utilities', 'Nova AI', 'Ridge Industries',
    'Clover Consumer', 'Kite Transport', 'Sage Healthcare', 'Matrix Technology', 'Lode Mining',
    'Vertex Finance', 'Flame Energy', 'Quill Tech', 'Oasis Real Estate', 'Pulse Telecom',
    'Vine Consumer', 'Bolt Industries', 'River Water', 'Peak Health', 'Terra Finance'
  ];

  return names.map((name, i) => {
    const s = i;
    const sec = SECTORS[Math.floor(sr(s * 7) * SECTORS.length)];
    const country = COUNTRIES[Math.floor(sr(s * 13) * COUNTRIES.length)];
    const selfScore = 45 + Math.floor(sr(s * 3) * 50);
    const thirdParty = Math.max(15, selfScore - Math.floor(sr(s * 11) * 35) + 5);
    const gap = selfScore - thirdParty;
    const discQuality = 30 + Math.floor(sr(s * 17) * 65);
    const integrity = Math.max(10, Math.min(99, Math.floor(
      (thirdParty * 0.4 + discQuality * 0.3 + (100 - Math.abs(gap)) * 0.3)
    )));
    const tier = integrity >= 85 ? 'Platinum' :
                 integrity >= 70 ? 'Gold' :
                 integrity >= 55 ? 'Silver' :
                 integrity >= 40 ? 'Bronze' : 'Flagged';
    const greenRev = Math.floor(sr(s * 19) * 80);
    const brownRev = 100 - greenRev;
    const carbonInt = 50 + Math.floor(sr(s * 23) * 450);
    const sbti = SBTI[Math.floor(sr(s * 29) * 3)];
    const assurance = ASSURANCE[Math.floor(sr(s * 31) * 3)];
    const eScore = 20 + Math.floor(sr(s * 37) * 75);
    const sScore = 20 + Math.floor(sr(s * 41) * 75);
    const gScore = 20 + Math.floor(sr(s * 43) * 75);
    const flagCount = Math.floor(sr(s * 47) * 6);
    const flags = [];
    const usedFlags = new Set();
    for (let f = 0; f < flagCount; f++) {
      let fi = Math.floor(sr(s * 53 + f * 7) * 12);
      while (usedFlags.has(fi)) fi = (fi + 1) % 12;
      usedFlags.add(fi);
      flags.push(fi);
    }
    const discDims = DISC_DIMS.map((_, di) => 20 + Math.floor(sr(s * 59 + di * 11) * 75));
    const regStatus = REG_REQS.map((_, ri) => {
      const v = sr(s * 67 + ri * 13);
      return v > 0.6 ? 'Compliant' : v > 0.3 ? 'Partial' : 'Non-Compliant';
    });
    return {
      id: i, name, sector: sec, country, selfScore, thirdParty, gap,
      discQuality, integrity, tier, greenRev, brownRev, carbonInt,
      sbti, assurance, eScore, sScore, gScore, flags, discDims, regStatus
    };
  });
};

const COMPANIES = genCompanies();

/* ==================== HELPER FUNCTIONS ==================== */

const sectorAvg = (sec, dimIdx) => {
  const cs = COMPANIES.filter(c => c.sector === sec);
  return cs.length ? Math.round(cs.reduce((a, c) => a + c.discDims[dimIdx], 0) / cs.length) : 50;
};
const bestInClass = (dimIdx) => Math.max(...COMPANIES.map(c => c.discDims[dimIdx]));

/* ==================== REUSABLE COMPONENTS ==================== */

const Btn = ({ children, active, onClick, style, disabled, ...p }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: '6px 14px', borderRadius: 6,
    border: `1px solid ${active ? T.navy : T.border}`,
    background: active ? T.navy : T.surface,
    color: active ? '#fff' : T.text,
    fontFamily: T.font, fontSize: 13, fontWeight: active ? 600 : 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, transition: 'all .15s', ...style
  }} {...p}>{children}</button>
);

const Badge = ({ children, color = T.navy, bg }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: 10,
    background: bg || color + '18', color, fontSize: 11,
    fontWeight: 600, fontFamily: T.font
  }}>{children}</span>
);

const Card = ({ children, style, ...p }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: 16, ...style
  }} {...p}>{children}</div>
);

const Select = ({ value, onChange, options, placeholder, style }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
    fontFamily: T.font, fontSize: 13, color: T.text,
    background: T.surface, cursor: 'pointer', ...style
  }}>
    <option value="">{placeholder || 'All'}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

/* ==================== MAIN COMPONENT ==================== */

export default function GreenwashingDetectorPage() {
  const [tab, setTab] = useState(0);
  const tabs = ['Integrity Scanner', 'Red Flag Engine', 'Disclosure Quality', 'Regulatory Compliance'];

  /* --- Tab 1 State --- */
  const [secFilter, setSecFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [sbtiFilter, setSbtiFilter] = useState('');
  const [assFilter, setAssFilter] = useState('');
  const [sortKey, setSortKey] = useState('integrity');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [drawerNotes, setDrawerNotes] = useState('');
  const [severityOverride, setSeverityOverride] = useState('');
  const [compareMode, setCompareMode] = useState(false);

  /* --- Tab 2 State --- */
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [flagFilter, setFlagFilter] = useState('');
  const [flagSecFilter, setFlagSecFilter] = useState('');
  const [minSeverity, setMinSeverity] = useState(0);
  const [heatPage, setHeatPage] = useState(0);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [customRules, setCustomRules] = useState([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleField, setNewRuleField] = useState('gap');
  const [newRuleOp, setNewRuleOp] = useState('>');
  const [newRuleVal, setNewRuleVal] = useState('15');
  const scanTimer = useRef(null);
  const [scanProgress, setScanProgress] = useState(0);

  /* --- Tab 3 State --- */
  const [discCompany, setDiscCompany] = useState(0);
  const [discCompare, setDiscCompare] = useState([]);
  const [selectedDim, setSelectedDim] = useState(null);
  const [planDims, setPlanDims] = useState(new Set());

  /* --- Tab 4 State --- */
  const [phaseFilter, setPhaseFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedReq, setExpandedReq] = useState(null);
  const [regPage, setRegPage] = useState(0);
  const [simCompliant, setSimCompliant] = useState(new Set());
  const [simMode, setSimMode] = useState(false);

  /* ==================== COMPUTED DATA ==================== */

  const filtered = useMemo(() => {
    let cs = [...COMPANIES];
    if (secFilter) cs = cs.filter(c => c.sector === secFilter);
    if (tierFilter) cs = cs.filter(c => c.tier === tierFilter);
    if (countryFilter) cs = cs.filter(c => c.country === countryFilter);
    if (sbtiFilter) cs = cs.filter(c => c.sbti === sbtiFilter);
    if (assFilter) cs = cs.filter(c => c.assurance === assFilter);
    cs.sort((a, b) => {
      const av = sortKey === 'flags' ? a.flags.length : a[sortKey];
      const bv = sortKey === 'flags' ? b.flags.length : b[sortKey];
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return cs;
  }, [secFilter, tierFilter, countryFilter, sbtiFilter, assFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const avg = v => v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
    const avgInt = avg(filtered.map(c => c.integrity));
    const avgGap = avg(filtered.map(c => Math.abs(c.gap)));
    const totalFlags = filtered.reduce((a, c) => a + c.flags.length, 0);
    const belowThreshold = filtered.filter(c => c.integrity < 40).length;
    const sectorScores = {};
    filtered.forEach(c => {
      if (!sectorScores[c.sector]) sectorScores[c.sector] = [];
      sectorScores[c.sector].push(c.integrity);
    });
    let worstSec = 'N/A', worstVal = 100;
    Object.entries(sectorScores).forEach(([s, vs]) => {
      const a = avg(vs);
      if (a < worstVal) { worstVal = a; worstSec = s; }
    });
    return { avgInt, avgGap, totalFlags, belowThreshold, worstSec };
  }, [filtered]);

  const paged = filtered.slice(page * 20, (page + 1) * 20);
  const totalPages = Math.ceil(filtered.length / 20) || 1;

  /* ==================== EVENT HANDLERS ==================== */

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const toggleBulk = (id) => {
    const s = new Set(bulkSelected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setBulkSelected(s);
  };

  const toggleCompare = (id) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) :
      prev.length < 3 ? [...prev, id] : prev
    );
  };

  const runScan = () => {
    setScanning(true);
    setScanProgress(0);
    setScanDone(false);
    let p = 0;
    scanTimer.current = setInterval(() => {
      p += 3.3;
      setScanProgress(Math.min(100, p));
      if (p >= 100) {
        clearInterval(scanTimer.current);
        setScanning(false);
        setScanDone(true);
      }
    }, 100);
  };

  useEffect(() => () => { if (scanTimer.current) clearInterval(scanTimer.current); }, []);

  const addCustomRule = () => {
    if (!newRuleName.trim()) return;
    setCustomRules(prev => [...prev, {
      name: newRuleName, field: newRuleField,
      op: newRuleOp, val: parseFloat(newRuleVal),
      enabled: true, id: Date.now()
    }]);
    setNewRuleName('');
  };

  const complianceScore = useMemo(() => {
    let total = 0;
    COMPANIES.forEach(c => {
      c.regStatus.forEach((s, i) => {
        const eff = simMode && simCompliant.has(i) ? 'Compliant' : s;
        if (eff === 'Compliant') total += 1;
        else if (eff === 'Partial') total += 0.5;
      });
    });
    return Math.round(total / (COMPANIES.length * REG_REQS.length) * 100);
  }, [simMode, simCompliant]);

  const daysUntil = (d) => {
    const diff = Math.ceil((new Date(d) - new Date('2026-03-28')) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const integrityColor = (v) => v >= 70 ? T.green : v >= 40 ? T.amber : T.red;
  const gapColor = (g) => Math.abs(g) <= 5 ? T.green : Math.abs(g) <= 15 ? T.amber : T.red;
  const statusColor = (s) => s === 'Compliant' ? T.green : s === 'Partial' ? T.amber : T.red;

  /* ==================== RENDER ==================== */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', color: T.text }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 28px' }}>

        {/* HEADER */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: T.navy }}>
            Greenwashing & Rating Integrity Detector
          </h1>
          <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>
            EP-AK5 -- 120 companies, 15 sectors, 12 red flag types, 15 disclosure dimensions, 18 regulatory requirements
          </p>
        </div>

        {/* TAB BAR */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '8px 18px', border: 'none',
              borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent',
              background: 'none', color: tab === i ? T.navy : T.textMut,
              fontFamily: T.font, fontSize: 13.5,
              fontWeight: tab === i ? 700 : 500,
              cursor: 'pointer', marginBottom: -2
            }}>{t}</button>
          ))}
        </div>

        {/* ====================== TAB 1: INTEGRITY SCANNER ====================== */}
        {tab === 0 && (
          <div>
            {/* FILTERS */}
            <Card style={{ marginBottom: 14, padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>FILTERS:</span>
              <Select value={secFilter} onChange={v => { setSecFilter(v); setPage(0); }} options={SECTORS} placeholder="All Sectors" />
              <Select value={tierFilter} onChange={v => { setTierFilter(v); setPage(0); }} options={TIERS} placeholder="All Tiers" />
              <Select value={countryFilter} onChange={v => { setCountryFilter(v); setPage(0); }} options={COUNTRIES} placeholder="All Countries" />
              <Select value={sbtiFilter} onChange={v => { setSbtiFilter(v); setPage(0); }} options={SBTI} placeholder="All SBTi" />
              <Select value={assFilter} onChange={v => { setAssFilter(v); setPage(0); }} options={ASSURANCE} placeholder="All Assurance" />
              <Btn onClick={() => { setSecFilter(''); setTierFilter(''); setCountryFilter(''); setSbtiFilter(''); setAssFilter(''); setPage(0); }} style={{ fontSize: 11 }}>Clear</Btn>
              <div style={{ flex: 1 }} />
              <Btn active={compareMode} onClick={() => { setCompareMode(!compareMode); if (compareMode) setCompareIds([]); }} style={{ fontSize: 11 }}>
                {compareMode ? 'Exit Compare' : 'Compare Mode'}
              </Btn>
            </Card>

            {/* LIVE STATS STRIP */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
              {[
                ['Avg Integrity', stats.avgInt + '%', integrityColor(stats.avgInt)],
                ['Avg Gap', stats.avgGap + ' pts', gapColor(stats.avgGap)],
                ['Total Flags', stats.totalFlags, T.red],
                ['Below Threshold', stats.belowThreshold, T.amber],
                ['Worst Sector', stats.worstSec, T.red]
              ].map(([label, val, c], i) => (
                <Card key={i} style={{ padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c, fontFamily: T.mono }}>{val}</div>
                </Card>
              ))}
            </div>

            {/* BULK ACTIONS */}
            {bulkSelected.size > 0 && (
              <Card style={{ marginBottom: 10, padding: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{bulkSelected.size} selected</span>
                <Btn style={{ fontSize: 11, background: T.red + '15', color: T.red, borderColor: T.red }} onClick={() => setBulkSelected(new Set())}>Flag All</Btn>
                <Btn style={{ fontSize: 11 }} onClick={() => {}}>Export Selected</Btn>
                <Btn style={{ fontSize: 11 }} onClick={() => {}}>Generate Audit Report</Btn>
                <Btn style={{ fontSize: 11 }} onClick={() => setBulkSelected(new Set())}>Deselect All</Btn>
              </Card>
            )}

            {/* COMPARISON OVERLAY */}
            {compareMode && compareIds.length >= 2 && (
              <Card style={{ marginBottom: 14, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                  Comparison: {compareIds.map(id => COMPANIES[id].name).join(' vs ')}
                </div>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={
                      ['E Score', 'S Score', 'G Score', 'Integrity', 'Disc. Quality'].map((d, di) => ({
                        dim: d,
                        ...Object.fromEntries(compareIds.map(id => [
                          COMPANIES[id].name,
                          [COMPANIES[id].eScore, COMPANIES[id].sScore, COMPANIES[id].gScore, COMPANIES[id].integrity, COMPANIES[id].discQuality][di]
                        ]))
                      }))
                    }>
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: T.textSec }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      {compareIds.map((id, ci) => (
                        <Radar key={id} name={COMPANIES[id].name} dataKey={COMPANIES[id].name}
                          stroke={[T.navy, T.gold, T.sage][ci]}
                          fill={[T.navy, T.gold, T.sage][ci]} fillOpacity={0.15} />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* SORTABLE GRID HEADER */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: compareMode ? '30px 30px 1fr 70px 80px 80px 70px 70px 60px' : '30px 1fr 70px 80px 80px 70px 70px 60px',
              gap: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700, color: T.textMut,
              background: T.surfaceH, borderRadius: '8px 8px 0 0', border: `1px solid ${T.border}`
            }}>
              <div />
              {compareMode && <div />}
              <div>Company</div>
              {[['integrity', 'Integrity'], ['selfScore', 'Self'], ['thirdParty', '3rd Party'], ['gap', 'Gap'], ['discQuality', 'Disc. Q'], ['flags', 'Flags']].map(([k, l]) => (
                <div key={k} style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort(k)}>
                  {l}{sortKey === k ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                </div>
              ))}
            </div>

            {/* COMPANY GRID ROWS */}
            {paged.map(c => (
              <div key={c.id} onClick={() => { if (!compareMode) setSelectedCompany(c); }} style={{
                display: 'grid',
                gridTemplateColumns: compareMode ? '30px 30px 1fr 70px 80px 80px 70px 70px 60px' : '30px 1fr 70px 80px 80px 70px 70px 60px',
                gap: 6, padding: '8px 10px', fontSize: 12.5,
                border: `1px solid ${T.border}`, borderTop: 'none',
                cursor: 'pointer', background: selectedCompany?.id === c.id ? T.surfaceH : T.surface,
                alignItems: 'center', transition: 'background .1s'
              }}>
                <input type="checkbox" checked={bulkSelected.has(c.id)}
                  onChange={() => toggleBulk(c.id)} onClick={e => e.stopPropagation()}
                  style={{ width: 14, height: 14 }} />
                {compareMode && (
                  <input type="checkbox" checked={compareIds.includes(c.id)}
                    onChange={() => toggleCompare(c.id)} onClick={e => e.stopPropagation()}
                    style={{ width: 14, height: 14, accentColor: T.gold }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: integrityColor(c.integrity), flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <Badge color={TIER_COLORS[c.tier]}>{c.tier}</Badge>
                  <span style={{ fontSize: 10, color: T.textMut, flexShrink: 0 }}>{c.sector} &middot; {c.country}</span>
                </div>
                <div style={{ fontWeight: 700, color: integrityColor(c.integrity), fontFamily: T.mono }}>{c.integrity}%</div>
                <div style={{ fontFamily: T.mono }}>{c.selfScore}</div>
                <div style={{ fontFamily: T.mono }}>{c.thirdParty}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 40, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Math.abs(c.gap) * 3)}%`, height: '100%', background: gapColor(c.gap), borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: gapColor(c.gap) }}>{c.gap > 0 ? '+' : ''}{c.gap}</span>
                </div>
                <div style={{ fontFamily: T.mono }}>{c.discQuality}</div>
                <div>{c.flags.length > 0 && <Badge color={T.red}>{c.flags.length} flags</Badge>}</div>
              </div>
            ))}

            {/* PAGINATION */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
              <Btn disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ fontSize: 11 }}>Prev</Btn>
              <span style={{ fontSize: 12, padding: '6px 10px', color: T.textSec }}>
                Page {page + 1} of {totalPages} ({filtered.length} companies)
              </span>
              <Btn disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ fontSize: 11 }}>Next</Btn>
            </div>

            {/* DETAIL DRAWER */}
            {selectedCompany && !compareMode && (
              <Card style={{ marginTop: 14, padding: 20, borderLeft: `4px solid ${integrityColor(selectedCompany.integrity)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{selectedCompany.name}</h3>
                    <span style={{ fontSize: 12, color: T.textSec }}>
                      {selectedCompany.sector} &middot; {selectedCompany.country} &middot; SBTi: {selectedCompany.sbti} &middot; Assurance: {selectedCompany.assurance} &middot; Carbon Intensity: {selectedCompany.carbonInt} tCO2e/M$
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn style={{ fontSize: 11, background: T.navy + '10' }} onClick={() => {}}>Investigate</Btn>
                    <Btn style={{ fontSize: 11 }} onClick={() => { setSelectedCompany(null); setDrawerNotes(''); setSeverityOverride(''); }}>Close</Btn>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Self-Reported vs Independent Rating */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Self-Reported vs Independent Rating</div>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { dim: 'E', self: selectedCompany.eScore, rated: Math.max(10, selectedCompany.eScore - Math.floor(sr(selectedCompany.id * 71) * 20)) },
                          { dim: 'S', self: selectedCompany.sScore, rated: Math.max(10, selectedCompany.sScore - Math.floor(sr(selectedCompany.id * 73) * 20)) },
                          { dim: 'G', self: selectedCompany.gScore, rated: Math.max(10, selectedCompany.gScore - Math.floor(sr(selectedCompany.id * 79) * 20)) },
                          { dim: 'Overall', self: selectedCompany.selfScore, rated: selectedCompany.thirdParty }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                          <XAxis dataKey="dim" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                          <Bar dataKey="self" name="Self-Reported" fill={T.gold} radius={[3, 3, 0, 0]} />
                          <Bar dataKey="rated" name="3rd Party" fill={T.navy} radius={[3, 3, 0, 0]} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Revenue Mix Donut */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Revenue Mix (Green vs Brown)</div>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[
                            { name: 'Green Revenue', value: selectedCompany.greenRev },
                            { name: 'Brown Revenue', value: selectedCompany.brownRev }
                          ]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                            <Cell fill={T.green} />
                            <Cell fill={T.amber} />
                          </Pie>
                          <Tooltip formatter={(v) => `${v}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Red Flags in Drawer */}
                {selectedCompany.flags.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Red Flags ({selectedCompany.flags.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedCompany.flags.map((fi, idx) => (
                        <div key={idx} style={{
                          padding: '8px 12px', background: T.red + '08',
                          border: `1px solid ${T.red}22`, borderRadius: 6
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: T.red }}>{FLAG_TYPES[fi]}</div>
                              <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
                                Severity: {FLAG_SEVERITY[fi]}/10 -- {FLAG_DESC[fi]}
                              </div>
                              <div style={{ fontSize: 11, color: T.sage, marginTop: 4 }}>
                                <strong>Remediation:</strong> {FLAG_REMEDIATION[fi]}
                              </div>
                            </div>
                            <Badge color={T.red}>Sev {FLAG_SEVERITY[fi]}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* E/S/G Sub-scores */}
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    ['Environmental', selectedCompany.eScore, T.sage],
                    ['Social', selectedCompany.sScore, T.navy],
                    ['Governance', selectedCompany.gScore, T.gold]
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ padding: 10, background: c + '10', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>{l}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: c, fontFamily: T.mono }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Notes & Severity Override */}
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                  <textarea value={drawerNotes} onChange={e => setDrawerNotes(e.target.value)}
                    placeholder="Add investigation notes..."
                    style={{ padding: 10, borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, minHeight: 60, resize: 'vertical' }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Severity Override</div>
                    <select value={severityOverride} onChange={e => setSeverityOverride(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }}>
                      <option value="">Default</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ====================== TAB 2: RED FLAG ENGINE ====================== */}
        {tab === 1 && (
          <div>
            {/* 12 Red Flag Types */}
            <Card style={{ marginBottom: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>12 Red Flag Types</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {FLAG_TYPES.map((f, i) => (
                  <div key={i} onClick={() => setSelectedFlag(selectedFlag === i ? null : i)} style={{
                    padding: '8px 10px', borderRadius: 6,
                    border: `1px solid ${selectedFlag === i ? T.red : T.border}`,
                    background: selectedFlag === i ? T.red + '08' : T.surface,
                    cursor: 'pointer', transition: 'all .15s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{f}</span>
                      <Badge color={FLAG_SEVERITY[i] >= 8 ? T.red : FLAG_SEVERITY[i] >= 6 ? T.amber : T.textMut}>
                        Sev {FLAG_SEVERITY[i]}
                      </Badge>
                    </div>
                    <div style={{ fontSize: 10.5, color: T.textSec, marginTop: 3 }}>{FLAG_DESC[i]}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Deep Scan Button */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
              <Btn active onClick={runScan} style={{ padding: '10px 24px', fontSize: 13 }} disabled={scanning}>
                {scanning ? 'Scanning...' : 'Run Deep Scan'}
              </Btn>
              {scanning && (
                <div style={{ flex: 1, height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${scanProgress}%`, height: '100%', background: T.navy, borderRadius: 4, transition: 'width .1s' }} />
                </div>
              )}
              {scanDone && (
                <Badge color={T.green}>
                  Scan Complete -- {COMPANIES.reduce((a, c) => a + c.flags.length, 0)} total flags across 120 companies
                </Badge>
              )}
            </div>

            {scanDone && (
              <>
                {/* Scan Filters */}
                <Card style={{ marginBottom: 10, padding: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Select value={flagFilter} onChange={setFlagFilter} options={FLAG_TYPES} placeholder="All Flag Types" />
                  <Select value={flagSecFilter} onChange={setFlagSecFilter} options={SECTORS} placeholder="All Sectors" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: T.textSec }}>Min Severity:</span>
                    <input type="range" min={0} max={10} value={minSeverity}
                      onChange={e => setMinSeverity(+e.target.value)} style={{ width: 80 }} />
                    <span style={{ fontSize: 11, fontFamily: T.mono }}>{minSeverity}</span>
                  </div>
                </Card>

                {/* Selected Flag Detail */}
                {selectedFlag !== null && (
                  <Card style={{ marginBottom: 14, padding: 14, borderLeft: `4px solid ${T.red}` }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>{FLAG_TYPES[selectedFlag]}</h4>
                    <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 8px' }}>{FLAG_DESC[selectedFlag]}</p>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      Companies with this flag ({COMPANIES.filter(c => c.flags.includes(selectedFlag)).length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {COMPANIES.filter(c => c.flags.includes(selectedFlag)).map(c => (
                        <Badge key={c.id} color={T.navy}>{c.name}</Badge>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: T.sage }}>
                      <strong>Remediation:</strong> {FLAG_REMEDIATION[selectedFlag]}
                    </div>
                  </Card>
                )}

                {/* Heatmap */}
                <Card style={{ marginBottom: 14, padding: 14, overflowX: 'auto' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    Flag Heatmap (120 companies x 12 flags)
                  </div>
                  <div style={{ display: 'flex', gap: 0 }}>
                    <div style={{ width: 140, flexShrink: 0 }}>
                      <div style={{ height: 24, fontSize: 10, color: T.textMut, display: 'flex', alignItems: 'center' }}>Company</div>
                      {COMPANIES.slice(heatPage * 30, (heatPage + 1) * 30).map(c => (
                        <div key={c.id} style={{ height: 20, fontSize: 10, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {c.name}
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1, overflowX: 'auto' }}>
                      <div style={{ display: 'flex' }}>
                        {FLAG_TYPES.map((f, fi) => (
                          <div key={fi} style={{ width: 52, height: 24, fontSize: 8, textAlign: 'center', color: T.textMut, overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 2px' }} title={f}>
                            {f.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                      {COMPANIES.slice(heatPage * 30, (heatPage + 1) * 30).map(c => (
                        <div key={c.id} style={{ display: 'flex' }}>
                          {FLAG_TYPES.map((_, fi) => {
                            const hasFlag = c.flags.includes(fi);
                            const alpha = hasFlag ? Math.round(FLAG_SEVERITY[fi] * 25).toString(16).padStart(2, '0') : '08';
                            return (
                              <div key={fi} style={{
                                width: 52, height: 20,
                                background: hasFlag ? `${T.red}${alpha}` : T.surfaceH,
                                border: `1px solid ${T.surface}`, borderRadius: 2,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 8, color: hasFlag ? T.red : 'transparent', fontWeight: 700
                              }}>
                                {hasFlag ? FLAG_SEVERITY[fi] : ''}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
                    {[0, 1, 2, 3].map(p => (
                      <Btn key={p} active={heatPage === p} onClick={() => setHeatPage(p)} style={{ fontSize: 10, padding: '3px 10px' }}>
                        Rows {p * 30 + 1}-{Math.min((p + 1) * 30, 120)}
                      </Btn>
                    ))}
                  </div>
                </Card>

                {/* Top 30 Worst Offenders */}
                <Card style={{ marginBottom: 14, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Top 30 Worst Offenders (Cumulative Flags)</div>
                  <div style={{ height: 340 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={
                        [...COMPANIES].sort((a, b) => b.flags.length - a.flags.length).slice(0, 30)
                          .map(c => ({
                            name: c.name.length > 14 ? c.name.slice(0, 14) + '..' : c.name,
                            flags: c.flags.length,
                            severity: c.flags.reduce((a, fi) => a + FLAG_SEVERITY[fi], 0)
                          }))
                      } layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 11 }} />
                        <Bar dataKey="flags" name="Flag Count" fill={T.red} radius={[0, 3, 3, 0]} />
                        <Bar dataKey="severity" name="Total Severity" fill={T.amber} radius={[0, 3, 3, 0]} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Custom Rule Builder */}
                <Card style={{ marginBottom: 14, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Custom Rule Builder</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                    <input value={newRuleName} onChange={e => setNewRuleName(e.target.value)}
                      placeholder="Rule name" style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, width: 160 }} />
                    <select value={newRuleField} onChange={e => setNewRuleField(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }}>
                      {['gap', 'selfScore', 'thirdParty', 'integrity', 'discQuality', 'carbonInt', 'greenRev'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <select value={newRuleOp} onChange={e => setNewRuleOp(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }}>
                      {['>', '<', '>=', '<=', '=='].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <input value={newRuleVal} onChange={e => setNewRuleVal(e.target.value)} type="number"
                      style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, width: 70 }} />
                    <Btn onClick={addCustomRule} style={{ fontSize: 11 }}>Add Rule</Btn>
                  </div>
                  {customRules.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {customRules.map((r, i) => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: T.surfaceH, borderRadius: 6 }}>
                          <span style={{ fontSize: 12 }}><strong>{r.name}:</strong> {r.field} {r.op} {r.val}</span>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input type="checkbox" checked={r.enabled}
                                onChange={() => setCustomRules(prev => prev.map((rr, ri) => ri === i ? { ...rr, enabled: !rr.enabled } : rr))} />
                              Enabled
                            </label>
                            <Btn style={{ fontSize: 10, padding: '2px 8px', color: T.red, borderColor: T.red }}
                              onClick={() => setCustomRules(prev => prev.filter((_, ri) => ri !== i))}>Remove</Btn>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Btn style={{ fontSize: 12 }} onClick={() => {}}>Export Flagged Companies CSV</Btn>
              </>
            )}
          </div>
        )}

        {/* ====================== TAB 3: DISCLOSURE QUALITY ====================== */}
        {tab === 2 && (
          <div>
            {/* Company Selector */}
            <Card style={{ marginBottom: 14, padding: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Primary Company:</span>
              <select value={discCompany} onChange={e => setDiscCompany(+e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, minWidth: 200 }}>
                {COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name} ({c.sector})</option>)}
              </select>
              <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 10 }}>Compare (up to 3):</span>
              <select value="" onChange={e => {
                const v = +e.target.value;
                if (!isNaN(v) && v >= 0 && !discCompare.includes(v) && discCompare.length < 3)
                  setDiscCompare([...discCompare, v]);
              }} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, minWidth: 180 }}>
                <option value="">Add company...</option>
                {COMPANIES.filter(c => c.id !== discCompany && !discCompare.includes(c.id)).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {discCompare.length > 0 && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {discCompare.map(id => (
                    <Badge key={id} color={T.navy}>
                      {COMPANIES[id].name}{' '}
                      <span style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => setDiscCompare(prev => prev.filter(x => x !== id))}>x</span>
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* 15-Dimension Radar */}
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>15-Dimension Radar: Company vs Sector Avg vs Best-in-Class</div>
                <div style={{ height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={DISC_DIMS.map((d, di) => ({
                      dim: d.length > 12 ? d.slice(0, 12) + '..' : d,
                      [COMPANIES[discCompany].name]: COMPANIES[discCompany].discDims[di],
                      SectorAvg: sectorAvg(COMPANIES[discCompany].sector, di),
                      BestInClass: bestInClass(di),
                      ...Object.fromEntries(discCompare.map(id => [COMPANIES[id].name, COMPANIES[id].discDims[di]]))
                    }))}>
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="dim" tick={{ fontSize: 8.5, fill: T.textSec }}
                        onClick={(_, idx) => setSelectedDim(typeof idx?.index === 'number' ? idx.index : null)} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar name={COMPANIES[discCompany].name} dataKey={COMPANIES[discCompany].name}
                        stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                      <Radar name="Sector Avg" dataKey="SectorAvg" stroke={T.gold} fill={T.gold} fillOpacity={0.1} />
                      <Radar name="Best-in-Class" dataKey="BestInClass" stroke={T.sage} fill={T.sage} fillOpacity={0.05} strokeDasharray="4 4" />
                      {discCompare.map((id, ci) => (
                        <Radar key={id} name={COMPANIES[id].name} dataKey={COMPANIES[id].name}
                          stroke={[T.red, T.amber, '#6366f1'][ci]}
                          fill={[T.red, T.amber, '#6366f1'][ci]} fillOpacity={0.08} />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Right column: Pie + Dimension Deep-Dive */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Card style={{ padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Quality Tier Distribution</div>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={TIERS.map(t => ({ name: t, value: COMPANIES.filter(c => c.tier === t).length }))}
                          cx="50%" cy="50%" outerRadius={70} dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}>
                          {TIERS.map(t => <Cell key={t} fill={TIER_COLORS[t]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {selectedDim !== null && selectedDim < DISC_DIMS.length ? (
                  <Card style={{ padding: 14, borderLeft: `4px solid ${T.sage}` }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>{DISC_DIMS[selectedDim]} -- Deep Dive</h4>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>
                      <strong>{COMPANIES[discCompany].name}:</strong> {COMPANIES[discCompany].discDims[selectedDim]}/100 |{' '}
                      <strong>Sector Avg:</strong> {sectorAvg(COMPANIES[discCompany].sector, selectedDim)} |{' '}
                      <strong>Best:</strong> {bestInClass(selectedDim)}
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>
                      <strong>Data Sources:</strong> {DISC_DIM_SOURCES[selectedDim]}
                    </div>
                    <div style={{ fontSize: 11, color: T.sage }}>
                      <strong>Recommendation:</strong> Increase granularity of disclosures, add third-party verification, and align with ISSB S2 requirements for this dimension.
                    </div>
                    <Btn style={{ marginTop: 8, fontSize: 11 }} onClick={() => setSelectedDim(null)}>Close</Btn>
                  </Card>
                ) : (
                  <Card style={{ padding: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.textMut, marginBottom: 4 }}>
                      Click a radar spoke to deep-dive into any dimension
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                      {DISC_DIMS.map((d, i) => (
                        <div key={i} onClick={() => setSelectedDim(i)} style={{
                          padding: '4px 6px', fontSize: 10, borderRadius: 4,
                          cursor: 'pointer', background: T.surfaceH, textAlign: 'center',
                          transition: 'background .1s'
                        }}>
                          {d}: <strong style={{ color: integrityColor(COMPANIES[discCompany].discDims[i]) }}>
                            {COMPANIES[discCompany].discDims[i]}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Disclosure Improvement Planner */}
            <Card style={{ marginTop: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Disclosure Improvement Planner</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>
                Select dimensions to improve for {COMPANIES[discCompany].name}:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {DISC_DIMS.map((d, i) => (
                  <Btn key={i} active={planDims.has(i)} onClick={() => {
                    const s = new Set(planDims);
                    if (s.has(i)) s.delete(i); else s.add(i);
                    setPlanDims(s);
                  }} style={{ fontSize: 10, padding: '4px 10px' }}>
                    {d} ({COMPANIES[discCompany].discDims[i]})
                  </Btn>
                ))}
              </div>
              {planDims.size > 0 && (
                <div style={{ padding: 10, background: T.sage + '10', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.sage }}>
                    Estimated Integrity Score Gain: +{Math.min(20, Math.round(planDims.size * 2.5))} points
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                    Improving {planDims.size} dimension{planDims.size > 1 ? 's' : ''} would raise integrity
                    from {COMPANIES[discCompany].integrity}% to approximately{' '}
                    {Math.min(99, COMPANIES[discCompany].integrity + Math.min(20, Math.round(planDims.size * 2.5)))}%
                  </div>
                </div>
              )}
            </Card>

            {/* Disclosure vs Integrity Scatter */}
            <Card style={{ marginTop: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Disclosure Quality vs Integrity Index (120 companies)
              </div>
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="discQuality" name="Disclosure Quality" tick={{ fontSize: 10 }}
                      label={{ value: 'Disclosure Quality', position: 'bottom', fontSize: 11 }} />
                    <YAxis dataKey="integrity" name="Integrity" tick={{ fontSize: 10 }}
                      label={{ value: 'Integrity Index', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div style={{ background: T.surface, padding: 8, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 11 }}>
                          <strong>{payload[0].payload.name}</strong><br />
                          Disc: {payload[0].payload.discQuality} | Int: {payload[0].payload.integrity}<br />
                          {payload[0].payload.sector}
                        </div>
                      ) : null
                    } />
                    <Scatter data={COMPANIES.map(c => ({ ...c }))} fill={T.navy}>
                      {COMPANIES.map(c => (
                        <Cell key={c.id} fill={TIER_COLORS[c.tier]} opacity={0.7} cursor="pointer"
                          onClick={() => { setDiscCompany(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Rankings Table */}
            <Card style={{ marginTop: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Disclosure Quality Rankings (120 companies)</div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700 }}>Rank</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700 }}>Company</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700 }}>Sector</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>Disc. Quality</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>Integrity</th>
                      <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 700 }}>Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...COMPANIES].sort((a, b) => b.discQuality - a.discQuality).map((c, i) => (
                      <tr key={c.id} style={{
                        borderBottom: `1px solid ${T.border}`, cursor: 'pointer',
                        background: c.id === discCompany ? T.surfaceH : 'transparent'
                      }} onClick={() => setDiscCompany(c.id)}>
                        <td style={{ padding: '5px 8px', fontFamily: T.mono, fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '5px 8px', color: T.textSec }}>{c.sector}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: integrityColor(c.discQuality) }}>{c.discQuality}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: T.mono }}>{c.integrity}%</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}><Badge color={TIER_COLORS[c.tier]}>{c.tier}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ====================== TAB 4: REGULATORY COMPLIANCE ====================== */}
        {tab === 3 && (
          <div>
            {/* Score + Phase Stats */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'stretch' }}>
              <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 200 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Portfolio Compliance Score</div>
                <svg width={120} height={120} viewBox="0 0 120 120">
                  <circle cx={60} cy={60} r={50} fill="none" stroke={T.border} strokeWidth={8} />
                  <circle cx={60} cy={60} r={50} fill="none"
                    stroke={complianceScore >= 70 ? T.green : complianceScore >= 40 ? T.amber : T.red}
                    strokeWidth={8} strokeDasharray={`${complianceScore * 3.14} 314`}
                    strokeLinecap="round" transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray .5s' }} />
                  <text x={60} y={60} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 24, fontWeight: 700, fontFamily: T.mono, fill: T.navy }}>
                    {complianceScore}%
                  </text>
                </svg>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={simMode} onChange={() => setSimMode(!simMode)} />
                    <span>Simulate Compliance</span>
                  </label>
                </div>
              </Card>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[1, 2, 3].map(phase => {
                  const reqs = REG_REQS.filter(r => r.phase === phase);
                  const reqIndices = reqs.map(r => REG_REQS.indexOf(r));
                  let compCount = 0;
                  COMPANIES.forEach(c => {
                    reqIndices.forEach(gi => {
                      const s = simMode && simCompliant.has(gi) ? 'Compliant' : c.regStatus[gi];
                      if (s === 'Compliant') compCount++;
                      else if (s === 'Partial') compCount += 0.5;
                    });
                  });
                  const total = COMPANIES.length * reqs.length;
                  const pct = total > 0 ? Math.round(compCount / total * 100) : 0;
                  return (
                    <Card key={phase} style={{ padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut }}>Phase {phase}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{reqs.length} reqs</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>Deadline: {reqs[0]?.deadline}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{daysUntil(reqs[0]?.deadline)} days remaining</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: pct > 60 ? T.green : T.amber, marginTop: 4 }}>{pct}% compliant</div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Phase + Status Filters */}
            <Card style={{ marginBottom: 10, padding: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Phase:</span>
              {[0, 1, 2, 3].map(p => (
                <Btn key={p} active={phaseFilter === p} onClick={() => setPhaseFilter(p)} style={{ fontSize: 11, padding: '4px 12px' }}>
                  {p === 0 ? 'All' : `Phase ${p}`}
                </Btn>
              ))}
              <div style={{ width: 1, height: 20, background: T.border, margin: '0 6px' }} />
              <Select value={statusFilter} onChange={setStatusFilter} options={['Compliant', 'Partial', 'Non-Compliant']} placeholder="All Statuses" />
            </Card>

            {/* Timeline */}
            <Card style={{ marginBottom: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Regulation Timeline</div>
              <div style={{ display: 'flex', gap: 0, position: 'relative', padding: '10px 0' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: T.border }} />
                {[
                  { label: 'Phase 1', date: '2025-06-30', color: T.sage },
                  { label: 'Phase 2', date: '2026-01-01', color: T.gold },
                  { label: 'Phase 3', date: '2027-01-01', color: T.navy }
                ].map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.color, border: `3px solid ${T.surface}`, marginBottom: 6 }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{m.date}</div>
                    <Badge color={daysUntil(m.date) > 0 ? T.amber : T.green}>
                      {daysUntil(m.date) > 0 ? `${daysUntil(m.date)}d left` : 'Passed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* 18 Requirements Expandable */}
            <Card style={{ marginBottom: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>18 Regulatory Requirements</div>
              {REG_REQS.filter(r => phaseFilter === 0 || r.phase === phaseFilter).map(r => {
                const gi = REG_REQS.indexOf(r);
                const affectedCount = COMPANIES.filter(c => {
                  const s = simMode && simCompliant.has(gi) ? 'Compliant' : c.regStatus[gi];
                  return statusFilter ? s === statusFilter && s !== 'Compliant' : s !== 'Compliant';
                }).length;
                const isOpen = expandedReq === gi;
                return (
                  <div key={r.id} style={{ border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 6, overflow: 'hidden' }}>
                    <div onClick={() => setExpandedReq(isOpen ? null : gi)} style={{
                      padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: 'pointer',
                      background: isOpen ? T.surfaceH : T.surface
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge color={T.navy} bg={T.navy + '15'}>Phase {r.phase}</Badge>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{r.id}: {r.name}</span>
                        {simMode && (
                          <label onClick={e => e.stopPropagation()} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <input type="checkbox" checked={simCompliant.has(gi)}
                              onChange={() => {
                                const s = new Set(simCompliant);
                                if (s.has(gi)) s.delete(gi); else s.add(gi);
                                setSimCompliant(s);
                              }} />
                            <span style={{ color: T.sage }}>Mark Done</span>
                          </label>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Badge color={daysUntil(r.deadline) > 180 ? T.green : daysUntil(r.deadline) > 0 ? T.amber : T.red}>
                          {daysUntil(r.deadline)}d
                        </Badge>
                        <span style={{ fontSize: 10, color: T.textMut }}>{affectedCount} affected</span>
                        <span style={{ fontSize: 14, color: T.textMut }}>{isOpen ? '\u25B2' : '\u25BC'}</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '10px 14px', borderTop: `1px solid ${T.border}`, background: T.surface }}>
                        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 8px' }}>{r.desc}</p>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Affected Companies ({affectedCount}):</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                          {COMPANIES.filter(c => {
                            const s = simMode && simCompliant.has(gi) ? 'Compliant' : c.regStatus[gi];
                            return s !== 'Compliant';
                          }).slice(0, 20).map(c => (
                            <Badge key={c.id} color={statusColor(c.regStatus[gi])}>{c.name}: {c.regStatus[gi]}</Badge>
                          ))}
                          {COMPANIES.filter(c => {
                            const s = simMode && simCompliant.has(gi) ? 'Compliant' : c.regStatus[gi];
                            return s !== 'Compliant';
                          }).length > 20 && (
                            <Badge color={T.textMut}>+{COMPANIES.filter(c => c.regStatus[gi] !== 'Compliant').length - 20} more</Badge>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: T.sage }}>
                          <strong>Remediation:</strong> Develop implementation roadmap, assign responsible team, allocate budget, set quarterly milestones, and engage external compliance advisor.
                        </div>
                        <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                          <strong>Deadline:</strong> {r.deadline} ({daysUntil(r.deadline)} days remaining)
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>

            {/* Company Compliance Matrix */}
            <Card style={{ marginBottom: 14, padding: 14, overflowX: 'auto' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Company Compliance Matrix (120 x 18)</div>
              <div style={{ display: 'flex', gap: 0 }}>
                <div style={{ width: 130, flexShrink: 0 }}>
                  <div style={{ height: 32, fontSize: 10, color: T.textMut, display: 'flex', alignItems: 'center' }}>Company</div>
                  {COMPANIES.slice(regPage * 30, (regPage + 1) * 30).map(c => (
                    <div key={c.id} style={{ height: 20, fontSize: 9.5, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, overflowX: 'auto' }}>
                  <div style={{ display: 'flex' }}>
                    {REG_REQS.map(r => (
                      <div key={r.id} style={{ width: 42, height: 32, fontSize: 8, textAlign: 'center', color: T.textMut, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {r.id}
                      </div>
                    ))}
                  </div>
                  {COMPANIES.slice(regPage * 30, (regPage + 1) * 30).map(c => (
                    <div key={c.id} style={{ display: 'flex' }}>
                      {REG_REQS.map((r, ri) => {
                        const s = simMode && simCompliant.has(ri) ? 'Compliant' : c.regStatus[ri];
                        return (
                          <div key={r.id} style={{
                            width: 42, height: 20, background: statusColor(s) + '25',
                            border: `1px solid ${T.surface}`, borderRadius: 2,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, color: statusColor(s), fontWeight: 600
                          }}>
                            {s === 'Compliant' ? '\u2713' : s === 'Partial' ? '\u25CB' : '\u2717'}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
                {[0, 1, 2, 3].map(p => (
                  <Btn key={p} active={regPage === p} onClick={() => setRegPage(p)} style={{ fontSize: 10, padding: '3px 10px' }}>
                    Rows {p * 30 + 1}-{Math.min((p + 1) * 30, 120)}
                  </Btn>
                ))}
              </div>
            </Card>

            {/* Gap Analysis */}
            <Card style={{ marginBottom: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Gap Analysis -- Auto-Generated Action Items</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {COMPANIES.filter(c => c.regStatus.some(s => s !== 'Compliant')).slice(0, 20).map(c => {
                  const nonComp = c.regStatus.reduce((a, s, i) => { if (s === 'Non-Compliant') a.push(REG_REQS[i].id); return a; }, []);
                  const partial = c.regStatus.reduce((a, s, i) => { if (s === 'Partial') a.push(REG_REQS[i].id); return a; }, []);
                  return (
                    <div key={c.id} style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          {c.name} <span style={{ fontSize: 10, color: T.textMut }}>({c.sector})</span>
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Badge color={T.red}>{nonComp.length} non-compliant</Badge>
                          <Badge color={T.amber}>{partial.length} partial</Badge>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
                        Priority actions: {nonComp.slice(0, 5).join(', ')}
                        {nonComp.length > 5 ? ` (+${nonComp.length - 5} more)` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Btn style={{ fontSize: 12 }} onClick={() => {}}>Export Compliance Report CSV</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
