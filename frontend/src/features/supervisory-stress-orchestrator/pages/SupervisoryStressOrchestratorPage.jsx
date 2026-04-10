import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, ComposedChart, AreaChart, Area,
  ScatterChart, Scatter, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ─── Static reference data ─── */
const INST_TYPES = ['Commercial Bank','Investment Bank','Universal Bank','Regional Bank','Insurance Group','Asset Manager'];
const JURISDICTIONS = ['EU','UK','US','Canada','Australia','Japan','Singapore','Switzerland'];
const LOAN_GRADES = ['AAA','AA','A','BBB','BB','B','CCC'];
const GRADE_BASE_LOSS  = [0.001,0.003,0.008,0.020,0.055,0.120,0.280];
const GRADE_ADVERSE    = [0.002,0.006,0.015,0.038,0.095,0.190,0.420];
const GRADE_SEVERE     = [0.004,0.012,0.028,0.065,0.145,0.260,0.540];

const MANAGEMENT_ACTIONS = [
  { id: 0, name: 'Common Equity Raise',    cet1ImpactPct: 0.022, feasibility: 'High',   timeline: '6–12 months',  cost: 'Dilutive' },
  { id: 1, name: 'AT1 Issuance',          cet1ImpactPct: 0.014, feasibility: 'High',   timeline: '3–6 months',   cost: 'Coupon ~6–7%' },
  { id: 2, name: 'RWA Optimisation',      cet1ImpactPct: 0.018, feasibility: 'Medium', timeline: '6–18 months',  cost: 'Ops cost' },
  { id: 3, name: 'Dividend Suspension',   cet1ImpactPct: 0.008, feasibility: 'High',   timeline: 'Immediate',    cost: 'Reputational' },
  { id: 4, name: 'Retained Earnings',     cet1ImpactPct: 0.006, feasibility: 'Medium', timeline: '12–24 months', cost: 'None' },
  { id: 5, name: 'Asset Disposal',        cet1ImpactPct: 0.012, feasibility: 'Low',    timeline: '12–24 months', cost: 'Liquidity risk' },
  { id: 6, name: 'Model Recalibration',   cet1ImpactPct: 0.005, feasibility: 'Medium', timeline: '6–12 months',  cost: 'Regulatory risk' },
  { id: 7, name: 'Tier 2 Issuance',       cet1ImpactPct: 0.010, feasibility: 'High',   timeline: '3–6 months',   cost: 'Coupon ~5–6%' },
];

const REGULATORS = [
  { id: 0, name: 'ECB 2024',    threshold: 8.0,  adverseMult: 1.45, creditLossRate: 0.028, niiImpact: -0.15, opRiskAddon: 0.006,
    ppnrShock: -0.12, feeShock: -0.08, tradingShock: -0.22, eclMultiplier: 1.60, scenarioType: 'Climate Adverse', scenarios: 3, color: T.indigo },
  { id: 1, name: 'PRA Explor.', threshold: 10.0, adverseMult: 1.55, creditLossRate: 0.032, niiImpact: -0.18, opRiskAddon: 0.007,
    ppnrShock: -0.16, feeShock: -0.10, tradingShock: -0.28, eclMultiplier: 1.80, scenarioType: 'Exploratory',    scenarios: 3, color: T.blue },
  { id: 2, name: 'OSFI B-15',   threshold: 9.0,  adverseMult: 1.40, creditLossRate: 0.025, niiImpact: -0.12, opRiskAddon: 0.005,
    ppnrShock: -0.10, feeShock: -0.07, tradingShock: -0.18, eclMultiplier: 1.50, scenarioType: 'Transition',     scenarios: 3, color: T.teal },
  { id: 3, name: 'FED DFAST',   threshold: 7.0,  adverseMult: 1.35, creditLossRate: 0.022, niiImpact: -0.10, opRiskAddon: 0.004,
    ppnrShock: -0.09, feeShock: -0.06, tradingShock: -0.15, eclMultiplier: 1.40, scenarioType: 'Severely Adverse', scenarios: 2, color: T.green },
  { id: 4, name: 'APRA CPG229', threshold: 8.0,  adverseMult: 1.42, creditLossRate: 0.027, niiImpact: -0.14, opRiskAddon: 0.006,
    ppnrShock: -0.11, feeShock: -0.08, tradingShock: -0.20, eclMultiplier: 1.55, scenarioType: 'Physical Risk',  scenarios: 3, color: T.amber },
  { id: 5, name: 'MAS TRM',     threshold: 8.0,  adverseMult: 1.38, creditLossRate: 0.023, niiImpact: -0.11, opRiskAddon: 0.005,
    ppnrShock: -0.09, feeShock: -0.06, tradingShock: -0.16, eclMultiplier: 1.45, scenarioType: 'Integrated',     scenarios: 2, color: T.orange },
];

const INST_NAMES = [
  'Barclays PLC','Deutsche Bank','HSBC Group','BNP Paribas','ING Group','UniCredit','Santander','Rabobank',
  'Nordea Bank','Commerzbank','ABN AMRO','Société Gen','Credit Agri','Natixis SA','Erste Group','RBI Group',
  'JPMorgan Chase','Bank America','Wells Fargo','Citigroup','Goldman Sachs','Morgan Stanley','US Bancorp','PNC Fin',
  'Truist Fin','KeyCorp','Regions Fin','Comerica','Zions Banco','East West','SVB Capital','First Repub',
  'Royal Bank CA','TD Financial','Bank Montreal','CIBC Group','Scotiabank','Laurentian','National CA','CWB Fin',
  'Commonwealth','ANZ Banking','Westpac','NAB Group','Bendigo Bank','Bank Qld','Suncorp','Macquarie',
  'MUFG Bank','Mizuho Fin','SMFG Hold','Nomura Hold','Daiwa Sec','Resona Hold','Sumitomo','Japan Post',
  'DBS Group','OCBC Bank','UOB Ltd','Standard Chart','UBS Group','Credit Suisse','Zurich Ins','Swiss Life',
  'Allianz SE','Munich Re','Aviva Group','Legal & Gen','Aegon NV','Mapfre SA','Intesa SP','Mediobanca',
  'BPCE Group','Crédit Mut','La Banque PG','Groupama','Generali','Mapfre RE','Axa Group','Predica',
];

/* ─── Institution factory ─── */
const INSTITUTIONS = INST_NAMES.map((name, i) => {
  const type         = INST_TYPES[Math.floor(sr(i * 7)  * INST_TYPES.length)];
  const jurisdiction = JURISDICTIONS[Math.floor(sr(i * 11) * JURISDICTIONS.length)];
  const totalAssets  = 20  + sr(i * 13) * 980;
  const regulatoryCapital = 0.08 + sr(i * 17) * 0.08;
  const climateExposurePct = 0.05 + sr(i * 19) * 0.40;
  const physRisk     = 15  + sr(i * 23) * 75;
  const transRisk    = 10  + sr(i * 29) * 80;
  const dataQualityScore   = 0.50 + sr(i * 41) * 0.50;
  const managementActionCapacity = 0.10 + sr(i * 43) * 0.40;
  const templateCompletionPct    = 40   + sr(i * 37) * 60;
  const capitalRaisePotential    = 0.010 + sr(i * 47) * 0.030;
  const rwaPct       = 0.45 + sr(i * 53) * 0.30;
  const dividendYield = 0.02 + sr(i * 59) * 0.05;
  const ppnrPct      = 0.015 + sr(i * 61) * 0.025;
  const feePct       = 0.005 + sr(i * 67) * 0.015;
  const niiMargin    = 0.010 + sr(i * 71) * 0.020;
  const tradingRevPct = 0.003 + sr(i * 73) * 0.012;
  const ecl_baseline = 0.008 + sr(i * 79) * 0.020;
  const ecl_adverse  = ecl_baseline * (1.4 + sr(i * 83) * 0.5);
  const ecl_severe   = ecl_baseline * (1.9 + sr(i * 89) * 0.6);
  const lastSubmission = `2024-0${1 + Math.floor(sr(i * 97) * 8)}-${10 + Math.floor(sr(i * 101) * 18)}`;
  const nextDeadline   = `2025-0${1 + Math.floor(sr(i * 103) * 8)}-30`;

  /* quarterly CET1 path — 9 quarters Q1-2024 → Q1-2026 */
  const baseQ1 = regulatoryCapital * 100;
  const cet1Path = Array.from({ length: 9 }, (_, q) => {
    const drift  = -0.20 * sr(i * 107 + q * 3);
    const shock  = q >= 2 && q <= 5 ? -(0.30 + sr(i * 109 + q) * 0.50) : 0;
    const recover = q > 5 ? 0.10 * sr(i * 113 + q) : 0;
    return parseFloat(Math.max(4, baseQ1 + drift + shock + recover).toFixed(2));
  });

  const submissionStatus = {};
  REGULATORS.forEach((r, ri) => {
    const v = sr(i * 71 + ri * 13);
    submissionStatus[r.name] = v > 0.7 ? 'Submitted' : v > 0.4 ? 'In Progress' : 'Not Started';
  });

  return {
    id: i, name, type, jurisdiction, totalAssets, regulatoryCapital,
    climateExposurePct, physRisk, transRisk, dataQualityScore,
    managementActionCapacity, templateCompletionPct, capitalRaisePotential,
    rwaPct, dividendYield, ppnrPct, feePct, niiMargin, tradingRevPct,
    ecl_baseline, ecl_adverse, ecl_severe, cet1Path,
    lastSubmission, nextDeadline, submissionStatus,
  };
});

/* ─── Stress computation ─── */
function computeStress(inst, regulator, calibration) {
  const clr  = (calibration?.creditLossRate  ?? regulator.creditLossRate);
  const nii  = (calibration?.niiImpact       ?? regulator.niiImpact);
  const op   = (calibration?.opRiskAddon     ?? regulator.opRiskAddon);
  const mult = (calibration?.adverseMult     ?? regulator.adverseMult);
  const baseCET1 = inst.regulatoryCapital * 100;
  const creditDrain = mult * clr * inst.climateExposurePct * 100;
  const niiDrain    = Math.abs(nii) * inst.niiMargin * 100;
  const opDrain     = op * 100;
  const stressedCET1 = baseCET1 - creditDrain - niiDrain - opDrain;
  const shortfall = Math.max(0, regulator.threshold - stressedCET1);
  const managementUplift = inst.managementActionCapacity * 2.0;
  const cet1AfterActions = stressedCET1 + managementUplift;
  const passes = cet1AfterActions >= regulator.threshold;
  return { baseCET1, stressedCET1, creditDrain, niiDrain, opDrain, shortfall, managementUplift, cet1AfterActions, passes };
}

/* ─── Shared UI atoms ─── */
const KpiCard = ({ label, value, color = T.text, sub = '' }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color = T.indigo, bg }) => (
  <span style={{ background: bg || color + '18', color, border: `1px solid ${color}40`, borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

const Select = ({ value, onChange, options, style = {} }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, fontSize: 13, color: T.text, cursor: 'pointer', ...style }}>
    {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
  </select>
);

const Slider = ({ label, value, min, max, step, onChange, fmt }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted, marginBottom: 4 }}>
      <span>{label}</span><span style={{ color: T.indigo, fontWeight: 700 }}>{fmt ? fmt(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width: '100%', accentColor: T.indigo }} />
  </div>
);

const Btn = ({ children, onClick, active, color = T.indigo, small }) => (
  <button onClick={onClick} style={{
    padding: small ? '4px 10px' : '7px 16px', borderRadius: 6, fontSize: small ? 11 : 13, fontWeight: 600, cursor: 'pointer',
    background: active ? color : T.card, color: active ? '#fff' : color,
    border: `1.5px solid ${color}`, transition: 'all 0.15s',
  }}>{children}</button>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `2px solid ${T.gold}`, paddingBottom: 6 }}>{children}</div>
);

const TABS = [
  'Orchestration Dashboard','Institution Database','Scenario Calibration',
  'PPNR & Loan Loss','9-Quarter Capital Path','Stress Results Matrix',
  'Submission Tracker','Cross-Regulator Analysis','Capital Action Plans','Summary & Export',
];

/* ═══════════════════════════════════════════════════════════════ */
export default function SupervisoryStressOrchestratorPage() {
  /* tab state */
  const [tab, setTab] = useState(0);

  /* Tab 1 */
  const [passThreshold, setPassThreshold] = useState(8.0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedRegulator, setSelectedRegulator] = useState(null);

  /* Tab 2 */
  const [typeFilter, setTypeFilter]   = useState('All');
  const [jurisFilter, setJurisFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assetMin, setAssetMin]       = useState(0);
  const [dqMin, setDqMin]             = useState(0);
  const [search, setSearch]           = useState('');
  const [sortCol, setSortCol]         = useState('totalAssets');
  const [sortDir, setSortDir]         = useState(-1);
  const [selectedId, setSelectedId]   = useState(null);
  const [showModal, setShowModal]     = useState(false);

  /* Tab 3 — per-regulator calibration overrides */
  const [calibration, setCalibration] = useState(() =>
    Object.fromEntries(REGULATORS.map(r => [r.id, {
      creditLossRate: r.creditLossRate,
      niiImpact: r.niiImpact,
      opRiskAddon: r.opRiskAddon,
      adverseMult: r.adverseMult,
    }]))
  );
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioName, setScenarioName]     = useState('');
  const [calRegSel, setCalRegSel]           = useState(0);

  /* Tab 4 */
  const [ppnrInstId, setPpnrInstId]     = useState(0);
  const [ppnrScenario, setPpnrScenario] = useState('Adverse');

  /* Tab 5 */
  const [pathInstId, setPathInstId]     = useState(0);
  const [showAllRegs, setShowAllRegs]   = useState(false);
  const [appliedActions, setAppliedActions] = useState([]);

  /* Tab 6 */
  const [matrixScenario, setMatrixScenario]   = useState('Adverse');
  const [matrixRegFilter, setMatrixRegFilter] = useState('All');
  const [shortfallOnly, setShortfallOnly]     = useState(false);
  const [colorByShortfall, setColorByShortfall] = useState(false);

  /* Tab 7 */
  const [overdueOnly, setOverdueOnly]         = useState(false);
  const [completenessMin, setCompletenessMin] = useState(0);
  const [sortBy7, setSortBy7]                 = useState('nextDeadline');

  /* Tab 8 */
  const [compareRegA, setCompareRegA] = useState(0);
  const [compareRegB, setCompareRegB] = useState(1);

  /* Tab 9 */
  const [actionInstId, setActionInstId]     = useState(0);
  const [selectedActions, setSelectedActions] = useState([]);

  /* Tab 10 */
  const [exportRegFilter, setExportRegFilter] = useState('All');
  const [exportFormat, setExportFormat]       = useState('CSV');

  /* ── Derived data ── */
  const filteredInst = useMemo(() => {
    let list = INSTITUTIONS;
    if (typeFilter !== 'All') list = list.filter(x => x.type === typeFilter);
    if (jurisFilter !== 'All') list = list.filter(x => x.jurisdiction === jurisFilter);
    if (assetMin > 0) list = list.filter(x => x.totalAssets >= assetMin);
    if (dqMin > 0) list = list.filter(x => x.dataQualityScore * 100 >= dqMin);
    if (search) list = list.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'All') list = list.filter(x => Object.values(x.submissionStatus).includes(statusFilter));
    return [...list].sort((a, b) => {
      const av = a[sortCol]; const bv = b[sortCol];
      if (av == null || bv == null) return 0;
      return typeof av === 'string' ? av.localeCompare(bv) * sortDir : (av - bv) * sortDir;
    });
  }, [typeFilter, jurisFilter, assetMin, dqMin, search, statusFilter, sortCol, sortDir]);

  const toggleSort = col => { if (sortCol === col) setSortDir(d => -d); else { setSortCol(col); setSortDir(-1); } };

  /* stress matrix */
  const stressMatrix = useMemo(() => INSTITUTIONS.map(inst => ({
    inst,
    byReg: REGULATORS.map(r => computeStress(inst, r, calibration[r.id])),
  })), [calibration]);

  /* pass rates per regulator */
  const passRates = useMemo(() => REGULATORS.map(r => {
    const col = stressMatrix.map(row => row.byReg[r.id]);
    const passing = col.filter(s => s.passes).length;
    return { name: r.name, passing, total: INSTITUTIONS.length, pct: (passing / INSTITUTIONS.length * 100).toFixed(1), color: r.color };
  }), [stressMatrix]);

  /* orchestration fleet stats */
  const fleetStats = useMemo(() => {
    const allStress = stressMatrix.flatMap(row => row.byReg);
    const avgBase   = allStress.reduce((s, x) => s + x.baseCET1, 0) / (allStress.length || 1);
    const avgStress = allStress.reduce((s, x) => s + x.stressedCET1, 0) / (allStress.length || 1);
    const totalShortfall = allStress.reduce((s, x) => s + x.shortfall, 0);
    return { avgBase, avgStress, totalShortfall };
  }, [stressMatrix]);

  /* PPNR data */
  const ppnrData = useMemo(() => {
    const inst = INSTITUTIONS[ppnrInstId];
    const shock = ppnrScenario === 'Baseline' ? 1 : ppnrScenario === 'Adverse' ? 0.85 : 0.70;
    return [
      { name: 'Net Interest', baseline: +(inst.niiMargin * inst.totalAssets).toFixed(1), stressed: +(inst.niiMargin * inst.totalAssets * shock).toFixed(1) },
      { name: 'Fee Income',   baseline: +(inst.feePct * inst.totalAssets).toFixed(1),    stressed: +(inst.feePct * inst.totalAssets * shock * 0.92).toFixed(1) },
      { name: 'Trading Rev',  baseline: +(inst.tradingRevPct * inst.totalAssets).toFixed(1), stressed: +(inst.tradingRevPct * inst.totalAssets * shock * 0.78).toFixed(1) },
      { name: 'Total PPNR',   baseline: +(inst.ppnrPct * inst.totalAssets).toFixed(1),   stressed: +(inst.ppnrPct * inst.totalAssets * shock * 0.88).toFixed(1) },
    ];
  }, [ppnrInstId, ppnrScenario]);

  const eclByGrade = useMemo(() => {
    const inst = INSTITUTIONS[ppnrInstId];
    const lossArr = ppnrScenario === 'Baseline' ? GRADE_BASE_LOSS : ppnrScenario === 'Adverse' ? GRADE_ADVERSE : GRADE_SEVERE;
    return LOAN_GRADES.map((g, gi) => ({
      grade: g,
      ecl: +(lossArr[gi] * inst.totalAssets * inst.rwaPct * (0.05 + sr(ppnrInstId * 7 + gi) * 0.20)).toFixed(2),
    }));
  }, [ppnrInstId, ppnrScenario]);

  /* quarterly path */
  const quarterLabels = ['Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25','Q1-26'];
  const pathInst = INSTITUTIONS[pathInstId];
  const actionBoost = useMemo(() =>
    selectedActions.reduce((s, aid) => s + (MANAGEMENT_ACTIONS[aid]?.cet1ImpactPct ?? 0) * 100, 0),
  [selectedActions]);

  const pathChartData = useMemo(() => quarterLabels.map((q, qi) => {
    const base = pathInst.cet1Path[qi];
    const row = { quarter: q, base: base, withActions: +(base + actionBoost).toFixed(2) };
    REGULATORS.forEach(r => { row[r.name + '_threshold'] = r.threshold; });
    return row;
  }), [pathInstId, actionBoost]);

  /* cross-regulator scatter */
  const crossRegData = useMemo(() => INSTITUTIONS.map((inst, i) => ({
    name: inst.name,
    regA: stressMatrix[i].byReg[compareRegA].stressedCET1,
    regB: stressMatrix[i].byReg[compareRegB].stressedCET1,
    shortfall: stressMatrix[i].byReg[compareRegA].shortfall + stressMatrix[i].byReg[compareRegB].shortfall,
  })), [stressMatrix, compareRegA, compareRegB]);

  /* action plan */
  const actionInst = INSTITUTIONS[actionInstId];
  const actionStress = useMemo(() => {
    const reg = REGULATORS[0];
    return computeStress(actionInst, reg, calibration[reg.id]);
  }, [actionInstId, calibration]);
  const projectedCET1 = actionStress.stressedCET1 + actionBoost;

  /* submission tracker */
  const trackerList = useMemo(() => {
    let list = INSTITUTIONS.filter(x => x.templateCompletionPct >= completenessMin);
    if (overdueOnly) {
      const today = '2025-04-08';
      list = list.filter(x => x.nextDeadline < today && Object.values(x.submissionStatus).some(s => s !== 'Submitted'));
    }
    return [...list].sort((a, b) => {
      if (sortBy7 === 'nextDeadline') return a.nextDeadline.localeCompare(b.nextDeadline);
      if (sortBy7 === 'completeness') return b.templateCompletionPct - a.templateCompletionPct;
      return a.name.localeCompare(b.name);
    });
  }, [overdueOnly, completenessMin, sortBy7]);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', padding: 0 }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Supervisory Stress Orchestrator</div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>Multi-jurisdiction climate stress testing · 80 institutions · 6 regulators · DFAST / ECB / PRA / OSFI / APRA / MAS</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {passRates.slice(0, 3).map(r => (
            <div key={r.name} style={{ background: '#ffffff14', borderRadius: 8, padding: '6px 14px', textAlign: 'center' }}>
              <div style={{ color: '#94a3b8', fontSize: 10 }}>{r.name}</div>
              <div style={{ color: parseFloat(r.pct) >= 80 ? T.green : parseFloat(r.pct) >= 60 ? T.amber : T.red, fontWeight: 800, fontSize: 16 }}>{r.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 24px', display: 'flex', overflowX: 'auto', gap: 2 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '12px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            background: 'transparent', border: 'none', borderBottom: tab === i ? `3px solid ${T.indigo}` : '3px solid transparent',
            color: tab === i ? T.indigo : T.muted, transition: 'all 0.15s',
          }}>{i + 1}. {t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ─────────────────────────────────────────────────────────
            TAB 0 — Orchestration Dashboard
        ───────────────────────────────────────────────────────── */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <SectionTitle>Fleet Overview</SectionTitle>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.muted }}>Pass Threshold (CET1 %)</span>
                <Slider label="" value={passThreshold} min={4} max={14} step={0.5} onChange={setPassThreshold} fmt={v => v.toFixed(1) + '%'} />
                <Btn active={showBreakdown} onClick={() => setShowBreakdown(b => !b)} small>Show Breakdown</Btn>
              </div>
            </div>

            {/* Fleet KPIs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="Institutions" value={INSTITUTIONS.length} sub="across 8 jurisdictions" />
              <KpiCard label="Regulators" value={REGULATORS.length} sub="active regimes" />
              <KpiCard label="Fleet Avg CET1 (Base)" value={fleetStats.avgBase.toFixed(2) + '%'} color={T.navy} />
              <KpiCard label="Fleet Avg CET1 (Stressed)" value={fleetStats.avgStress.toFixed(2) + '%'} color={T.red} />
              <KpiCard label="Aggregate Shortfall" value={'$' + fleetStats.totalShortfall.toFixed(1) + 'B'} color={T.red} sub="across all regulators" />
              <KpiCard label="Overall Pass Rate" value={passRates.length > 0 ? (passRates.reduce((s, r) => s + parseFloat(r.pct), 0) / passRates.length).toFixed(1) + '%' : '—'} color={T.green} />
            </div>

            {/* Pass rate bar chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionTitle>Pass Rate by Regulator</SectionTitle>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={passRates} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={v => v + '%'} />
                    <Bar dataKey="pct" name="Pass Rate %">
                      {passRates.map((r, i) => <Cell key={i} fill={r.color} />)}
                    </Bar>
                    <ReferenceLine y={passThreshold === 8 ? 80 : 70} stroke={T.red} strokeDasharray="5 5" label={{ value: 'Target', fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionTitle>CET1 Distribution — Base vs Stressed</SectionTitle>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={REGULATORS.map(r => {
                    const col = stressMatrix.map(row => row.byReg[r.id]);
                    return {
                      name: r.name,
                      base: +(col.reduce((s, x) => s + x.baseCET1, 0) / col.length).toFixed(2),
                      stressed: +(col.reduce((s, x) => s + x.stressedCET1, 0) / col.length).toFixed(2),
                    };
                  })} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 16]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={v => v + '%'} />
                    <Legend />
                    <Bar dataKey="base" name="Base CET1" fill={T.indigo} />
                    <Bar dataKey="stressed" name="Stressed CET1" fill={T.red} />
                    <ReferenceLine y={passThreshold} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Threshold', fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Regulator panels */}
            <SectionTitle>Regulator Status Panels</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {REGULATORS.map(r => {
                const pr = passRates.find(x => x.name === r.name);
                const pct = parseFloat(pr?.pct ?? 0);
                const status = pct >= 80 ? 'PASS' : pct >= 60 ? 'WARN' : 'FAIL';
                const statusColor = status === 'PASS' ? T.green : status === 'WARN' ? T.amber : T.red;
                const col = stressMatrix.map(row => row.byReg[r.id]);
                const avgSF = col.reduce((s, x) => s + x.shortfall, 0) / (col.length || 1);
                return (
                  <div key={r.id} onClick={() => setSelectedRegulator(selectedRegulator === r.id ? null : r.id)}
                    style={{ background: T.card, border: `2px solid ${selectedRegulator === r.id ? r.color : T.border}`, borderRadius: 10, padding: 16, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: T.navy }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{r.scenarioType}</div>
                      </div>
                      <Pill label={status} color={statusColor} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { l: 'Threshold', v: r.threshold + '%' },
                        { l: 'Pass Rate', v: pr?.pct + '%', c: statusColor },
                        { l: 'Passing', v: pr?.passing + ' / ' + pr?.total },
                        { l: 'Avg Shortfall', v: '$' + avgSF.toFixed(2) + 'B', c: avgSF > 0.5 ? T.red : T.muted },
                      ].map(({ l, v, c }) => (
                        <div key={l} style={{ background: T.sub, borderRadius: 6, padding: '6px 10px' }}>
                          <div style={{ fontSize: 10, color: T.muted }}>{l}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: c || T.text }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {showBreakdown && (
                      <div style={{ marginTop: 10, fontSize: 11, color: T.muted }}>
                        <div>Credit Loss Rate: {(r.creditLossRate * 100).toFixed(1)}%</div>
                        <div>NII Impact: {(r.niiImpact * 100).toFixed(0)}% | Op Risk: {(r.opRiskAddon * 100).toFixed(1)}%</div>
                        <div>PPNR Shock: {(r.ppnrShock * 100).toFixed(0)}% | ECL Mult: {r.eclMultiplier}×</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            TAB 1 — Institution Database
        ───────────────────────────────────────────────────────── */}
        {tab === 1 && (
          <div>
            {/* Filters */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Search</div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Institution name..."
                  style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, width: 180 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Type</div>
                <Select value={typeFilter} onChange={setTypeFilter} options={['All', ...INST_TYPES]} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Jurisdiction</div>
                <Select value={jurisFilter} onChange={setJurisFilter} options={['All', ...JURISDICTIONS]} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Status</div>
                <Select value={statusFilter} onChange={setStatusFilter} options={['All','Submitted','In Progress','Not Started']} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Min Assets ($B)</div>
                <input type="number" value={assetMin} onChange={e => setAssetMin(+e.target.value)} min={0} max={1000}
                  style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, width: 100 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Min DQ Score (%)</div>
                <input type="number" value={dqMin} onChange={e => setDqMin(+e.target.value)} min={0} max={100}
                  style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, width: 100 }} />
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: T.muted, alignSelf: 'center' }}>
                Showing <b>{filteredInst.length}</b> / {INSTITUTIONS.length}
              </div>
            </div>

            {/* Table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'auto', maxHeight: 500 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub, borderBottom: `2px solid ${T.border}` }}>
                    {[
                      { col: 'name', label: 'Institution' },
                      { col: 'type', label: 'Type' },
                      { col: 'jurisdiction', label: 'Juris.' },
                      { col: 'totalAssets', label: 'Assets $B' },
                      { col: 'regulatoryCapital', label: 'Reg Cap %' },
                      { col: 'climateExposurePct', label: 'Climate Exp %' },
                      { col: 'physRisk', label: 'Phys Risk' },
                      { col: 'transRisk', label: 'Trans Risk' },
                      { col: 'dataQualityScore', label: 'DQ Score' },
                      { col: 'templateCompletionPct', label: 'Completion %' },
                    ].map(h => (
                      <th key={h.col} onClick={() => toggleSort(h.col)}
                        style={{ padding: '10px 12px', textAlign: 'left', cursor: 'pointer', color: sortCol === h.col ? T.indigo : T.navy,
                          userSelect: 'none', whiteSpace: 'nowrap', fontWeight: 700, fontSize: 11 }}>
                        {h.label} {sortCol === h.col ? (sortDir === -1 ? '↓' : '↑') : ''}
                      </th>
                    ))}
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: T.navy }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInst.map((inst, ri) => {
                    const isSelected = inst.id === selectedId;
                    return (
                      <React.Fragment key={inst.id}>
                        <tr onClick={() => { setSelectedId(isSelected ? null : inst.id); setShowModal(!isSelected); }}
                          style={{ background: isSelected ? T.indigo + '10' : ri % 2 === 0 ? '#fff' : T.sub,
                            borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: T.navy }}>{inst.name}</td>
                          <td style={{ padding: '9px 12px' }}><Pill label={inst.type} color={T.indigo} /></td>
                          <td style={{ padding: '9px 12px' }}><Pill label={inst.jurisdiction} color={T.teal} /></td>
                          <td style={{ padding: '9px 12px' }}>${inst.totalAssets.toFixed(0)}B</td>
                          <td style={{ padding: '9px 12px' }}>{(inst.regulatoryCapital * 100).toFixed(1)}%</td>
                          <td style={{ padding: '9px 12px' }}>{(inst.climateExposurePct * 100).toFixed(0)}%</td>
                          <td style={{ padding: '9px 12px', color: inst.physRisk > 60 ? T.red : inst.physRisk > 40 ? T.amber : T.green }}>{inst.physRisk.toFixed(0)}</td>
                          <td style={{ padding: '9px 12px', color: inst.transRisk > 60 ? T.red : inst.transRisk > 40 ? T.amber : T.green }}>{inst.transRisk.toFixed(0)}</td>
                          <td style={{ padding: '9px 12px' }}>{(inst.dataQualityScore * 100).toFixed(0)}%</td>
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ background: T.border, borderRadius: 4, height: 6, width: 80 }}>
                              <div style={{ background: inst.templateCompletionPct > 70 ? T.green : inst.templateCompletionPct > 40 ? T.amber : T.red,
                                height: 6, borderRadius: 4, width: inst.templateCompletionPct + '%' }} />
                            </div>
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <Btn small active={isSelected} onClick={e => { e.stopPropagation(); setSelectedId(isSelected ? null : inst.id); setShowModal(!isSelected); }}>
                              {isSelected ? 'Close' : 'View'}
                            </Btn>
                          </td>
                        </tr>
                        {isSelected && showModal && (
                          <tr style={{ background: T.sub }}>
                            <td colSpan={11} style={{ padding: 16 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
                                <KpiCard label="PPNR %" value={(inst.ppnrPct * 100).toFixed(2) + '%'} />
                                <KpiCard label="ECL Baseline" value={'$' + (inst.ecl_baseline * inst.totalAssets).toFixed(1) + 'B'} />
                                <KpiCard label="ECL Adverse" value={'$' + (inst.ecl_adverse * inst.totalAssets).toFixed(1) + 'B'} color={T.amber} />
                                <KpiCard label="ECL Severe" value={'$' + (inst.ecl_severe * inst.totalAssets).toFixed(1) + 'B'} color={T.red} />
                                <KpiCard label="Capital Raise Potential" value={(inst.capitalRaisePotential * 100).toFixed(1) + '%'} color={T.green} />
                                <KpiCard label="RWA %" value={(inst.rwaPct * 100).toFixed(0) + '%'} />
                                <KpiCard label="Dividend Yield" value={(inst.dividendYield * 100).toFixed(1) + '%'} />
                                <KpiCard label="Mgmt Action Capacity" value={(inst.managementActionCapacity * 100).toFixed(0) + '%'} color={T.teal} />
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Submission Status</div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {REGULATORS.map(r => {
                                  const s = inst.submissionStatus[r.name];
                                  const c = s === 'Submitted' ? T.green : s === 'In Progress' ? T.amber : T.red;
                                  return <div key={r.name} style={{ background: c + '15', border: `1px solid ${c}40`, borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>
                                    <span style={{ color: T.muted }}>{r.name}: </span>
                                    <span style={{ color: c, fontWeight: 700 }}>{s}</span>
                                  </div>;
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            TAB 2 — Scenario Calibration
        ───────────────────────────────────────────────────────── */}
        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 20 }}>
              {/* Left: sliders */}
              <div style={{ flex: '0 0 340px' }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
                  <SectionTitle>Calibrate Regulator</SectionTitle>
                  <div style={{ marginBottom: 14 }}>
                    <Select value={calRegSel} onChange={v => setCalRegSel(+v)}
                      options={REGULATORS.map(r => ({ value: r.id, label: r.name }))} style={{ width: '100%' }} />
                  </div>
                  {(() => {
                    const r = REGULATORS[calRegSel];
                    const cal = calibration[calRegSel];
                    const upd = (field, val) => setCalibration(prev => ({ ...prev, [calRegSel]: { ...prev[calRegSel], [field]: val } }));
                    return (
                      <div>
                        <Slider label="Credit Loss Rate" value={cal.creditLossRate} min={0.005} max={0.08} step={0.001}
                          onChange={v => upd('creditLossRate', v)} fmt={v => (v * 100).toFixed(1) + '%'} />
                        <Slider label="NII Impact" value={cal.niiImpact} min={-0.40} max={0} step={0.005}
                          onChange={v => upd('niiImpact', v)} fmt={v => (v * 100).toFixed(0) + '%'} />
                        <Slider label="Op Risk Add-on" value={cal.opRiskAddon} min={0.001} max={0.02} step={0.001}
                          onChange={v => upd('opRiskAddon', v)} fmt={v => (v * 100).toFixed(1) + '%'} />
                        <Slider label="Adverse Multiplier" value={cal.adverseMult} min={1.0} max={2.5} step={0.05}
                          onChange={v => upd('adverseMult', v)} fmt={v => v.toFixed(2) + '×'} />
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
                          <input value={scenarioName} onChange={e => setScenarioName(e.target.value)}
                            placeholder="Scenario name..." style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }} />
                          <Btn onClick={() => {
                            if (scenarioName) {
                              setSavedScenarios(prev => [...prev, { name: scenarioName, regId: calRegSel, cal: { ...cal } }]);
                              setScenarioName('');
                            }
                          }}>Save</Btn>
                        </div>
                        <Btn onClick={() => setCalibration(prev => ({ ...prev, [calRegSel]: {
                          creditLossRate: r.creditLossRate, niiImpact: r.niiImpact,
                          opRiskAddon: r.opRiskAddon, adverseMult: r.adverseMult,
                        } }))} color={T.muted} small>Reset to Default</Btn>
                      </div>
                    );
                  })()}
                </div>

                {/* Saved scenarios */}
                {savedScenarios.length > 0 && (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                    <SectionTitle>Saved Scenarios</SectionTitle>
                    {savedScenarios.map((s, si) => (
                      <div key={si} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: T.muted }}>{REGULATORS[s.regId].name} · CLR {(s.cal.creditLossRate * 100).toFixed(1)}%</div>
                        </div>
                        <Btn small onClick={() => setCalibration(prev => ({ ...prev, [s.regId]: s.cal }))}>Load</Btn>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: comparison chart */}
              <div style={{ flex: 1 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
                  <SectionTitle>Scenario Comparison — Avg CET1 Post-Stress</SectionTitle>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={REGULATORS.map(r => {
                      const col = stressMatrix.map(row => row.byReg[r.id]);
                      return {
                        name: r.name,
                        default: +(col.reduce((s, x) => s + x.stressedCET1, 0) / (col.length || 1)).toFixed(2),
                        threshold: r.threshold,
                      };
                    })} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 16]} unit="%" tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => v + '%'} />
                      <Legend />
                      <Bar dataKey="default" name="Avg Stressed CET1">
                        {REGULATORS.map((r, i) => <Cell key={i} fill={r.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                  <SectionTitle>Calibration Impact — {REGULATORS[calRegSel].name}</SectionTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {(() => {
                      const r = REGULATORS[calRegSel];
                      const col = stressMatrix.map(row => row.byReg[r.id]);
                      const avgStress = col.length > 0 ? col.reduce((s, x) => s + x.stressedCET1, 0) / col.length : 0;
                      const passing = col.filter(x => x.passes).length;
                      const totalSF = col.reduce((s, x) => s + x.shortfall, 0);
                      return [
                        { l: 'Avg Stressed CET1', v: avgStress.toFixed(2) + '%', c: avgStress < r.threshold ? T.red : T.green },
                        { l: 'Institutions Passing', v: passing + ' / ' + INSTITUTIONS.length, c: passing > 60 ? T.green : T.amber },
                        { l: 'Total Shortfall', v: '$' + totalSF.toFixed(1) + 'B', c: T.red },
                        { l: 'Credit Loss Rate', v: (calibration[calRegSel].creditLossRate * 100).toFixed(1) + '%' },
                        { l: 'NII Impact', v: (calibration[calRegSel].niiImpact * 100).toFixed(0) + '%' },
                        { l: 'Adverse Multiplier', v: calibration[calRegSel].adverseMult.toFixed(2) + '×' },
                      ].map(({ l, v, c }) => <KpiCard key={l} label={l} value={v} color={c} />);
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            TAB 3 — PPNR & Loan Loss
        ───────────────────────────────────────────────────────── */}
        {tab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Institution</div>
                <Select value={ppnrInstId} onChange={v => setPpnrInstId(+v)}
                  options={INSTITUTIONS.map(x => ({ value: x.id, label: x.name }))} style={{ width: 200 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Scenario</div>
                <Select value={ppnrScenario} onChange={setPpnrScenario} options={['Baseline','Adverse','Severely Adverse']} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionTitle>PPNR Waterfall — {INSTITUTIONS[ppnrInstId].name}</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ppnrData} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="$B" />
                    <Tooltip formatter={v => '$' + v + 'B'} />
                    <Legend />
                    <Bar dataKey="baseline" name="Baseline" fill={T.indigo} />
                    <Bar dataKey="stressed" name="Stressed" fill={ppnrScenario === 'Severely Adverse' ? T.red : T.amber} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionTitle>ECL by Credit Grade — {ppnrScenario}</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={eclByGrade} barSize={26}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="$B" />
                    <Tooltip formatter={v => '$' + v + 'B'} />
                    <Bar dataKey="ecl" name="ECL ($B)">
                      {eclByGrade.map((g, i) => (
                        <Cell key={i} fill={i < 3 ? T.green : i < 5 ? T.amber : T.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <SectionTitle>Loan Loss Provision Summary</SectionTitle>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {(() => {
                  const inst = INSTITUTIONS[ppnrInstId];
                  return [
                    { l: 'ECL Baseline', v: '$' + (inst.ecl_baseline * inst.totalAssets).toFixed(1) + 'B', c: T.green },
                    { l: 'ECL Adverse', v: '$' + (inst.ecl_adverse * inst.totalAssets).toFixed(1) + 'B', c: T.amber },
                    { l: 'ECL Severely Adverse', v: '$' + (inst.ecl_severe * inst.totalAssets).toFixed(1) + 'B', c: T.red },
                    { l: 'Total PPNR (Baseline)', v: '$' + (inst.ppnrPct * inst.totalAssets).toFixed(1) + 'B', c: T.indigo },
                    { l: 'RWA', v: '$' + (inst.rwaPct * inst.totalAssets).toFixed(0) + 'B' },
                    { l: 'Coverage Ratio', v: (inst.ecl_baseline / inst.ecl_adverse * 100).toFixed(0) + '%' },
                  ].map(({ l, v, c }) => <KpiCard key={l} label={l} value={v} color={c} />);
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            TAB 4 — 9-Quarter Capital Path
        ───────────────────────────────────────────────────────── */}
        {tab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Institution</div>
                <Select value={pathInstId} onChange={v => setPathInstId(+v)}
                  options={INSTITUTIONS.map(x => ({ value: x.id, label: x.name }))} style={{ width: 200 }} />
              </div>
              <Btn active={showAllRegs} onClick={() => setShowAllRegs(b => !b)} small>Show All Thresholds</Btn>
            </div>

            {/* Management Actions checkboxes */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <SectionTitle>Apply Management Actions</SectionTitle>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {MANAGEMENT_ACTIONS.map(a => (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12,
                    background: selectedActions.includes(a.id) ? T.indigo + '15' : T.sub,
                    border: `1px solid ${selectedActions.includes(a.id) ? T.indigo : T.border}`,
                    borderRadius: 6, padding: '6px 12px' }}>
                    <input type="checkbox" checked={selectedActions.includes(a.id)}
                      onChange={e => setSelectedActions(prev => e.target.checked ? [...prev, a.id] : prev.filter(x => x !== a.id))} />
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                    <span style={{ color: T.green, fontSize: 11 }}>+{(a.cet1ImpactPct * 100).toFixed(1)}%</span>
                  </label>
                ))}
              </div>
              {selectedActions.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: T.green, fontWeight: 700 }}>
                  Total CET1 Boost: +{actionBoost.toFixed(2)}%
                </div>
              )}
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <SectionTitle>9-Quarter CET1 Path — {pathInst.name}</SectionTitle>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={pathChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                  <YAxis domain={[4, 18]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => typeof v === 'number' ? v.toFixed(2) + '%' : v} />
                  <Legend />
                  <Area type="monotone" dataKey="base" name="Base Path" fill={T.indigo + '20'} stroke={T.indigo} strokeWidth={2} dot />
                  {selectedActions.length > 0 && (
                    <Line type="monotone" dataKey="withActions" name="With Actions" stroke={T.green} strokeWidth={2} strokeDasharray="6 3" dot />
                  )}
                  {showAllRegs
                    ? REGULATORS.map(r => <ReferenceLine key={r.id} y={r.threshold} stroke={r.color} strokeDasharray="4 4" label={{ value: r.name, fontSize: 9, fill: r.color }} />)
                    : <ReferenceLine y={REGULATORS[0].threshold} stroke={T.red} strokeDasharray="4 4" label={{ value: 'ECB Min', fontSize: 10 }} />
                  }
                  <ReferenceLine x="Q1-25" stroke={T.gold} strokeDasharray="3 3" label={{ value: 'Q5 Check', fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <KpiCard label="Q1-2024 CET1" value={pathInst.cet1Path[0].toFixed(2) + '%'} color={T.navy} />
              <KpiCard label="Q5 (Q1-2025) CET1" value={pathInst.cet1Path[4].toFixed(2) + '%'}
                color={pathInst.cet1Path[4] >= 8 ? T.green : T.red} />
              <KpiCard label="Q9 (Q1-2026) CET1" value={pathInst.cet1Path[8].toFixed(2) + '%'}
                color={pathInst.cet1Path[8] >= 8 ? T.green : T.red} />
              <KpiCard label="Min CET1 (9Q)" value={Math.min(...pathInst.cet1Path).toFixed(2) + '%'} color={T.red} />
              <KpiCard label="Action Boost" value={'+' + actionBoost.toFixed(2) + '%'} color={T.green} />
              <KpiCard label="Q9 + Actions" value={(pathInst.cet1Path[8] + actionBoost).toFixed(2) + '%'}
                color={(pathInst.cet1Path[8] + actionBoost) >= 8 ? T.green : T.red} />
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            TAB 5 — Stress Results Matrix
        ───────────────────────────────────────────────────────── */}
        {tab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Regulator Filter</div>
                <Select value={matrixRegFilter} onChange={setMatrixRegFilter}
                  options={['All', ...REGULATORS.map(r => r.name)]} />
              </div>
              <Btn active={shortfallOnly} onClick={() => setShortfallOnly(b => !b)} small>Shortfall Only</Btn>
              <Btn active={colorByShortfall} onClick={() => setColorByShortfall(b => !b)} small>Color by Shortfall</Btn>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: T.muted }}>
                {stressMatrix.filter(row => row.byReg.some(s => !s.passes)).length} institutions with shortfall in ≥1 regime
              </div>
            </div>

            {/* Aggregate bar */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <SectionTitle>Pass / Fail by Regulator</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REGULATORS.filter(r => matrixRegFilter === 'All' || r.name === matrixRegFilter)
                  .map(r => {
                    const col = stressMatrix.map(row => row.byReg[r.id]);
                    return { name: r.name, pass: col.filter(s => s.passes).length, fail: col.filter(s => !s.passes).length, color: r.color };
                  })} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pass" name="Pass" fill={T.green} stackId="a" />
                  <Bar dataKey="fail" name="Fail" fill={T.red} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Heat map table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'auto', maxHeight: 440 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, position: 'sticky', top: 0, background: T.sub, zIndex: 1 }}>Institution</th>
                    {REGULATORS.filter(r => matrixRegFilter === 'All' || r.name === matrixRegFilter).map(r => (
                      <th key={r.id} style={{ padding: '8px 10px', fontWeight: 700, color: r.color, position: 'sticky', top: 0, background: T.sub, zIndex: 1, whiteSpace: 'nowrap' }}>{r.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stressMatrix
                    .filter(row => !shortfallOnly || row.byReg.some(s => !s.passes))
                    .sort((a, b) => b.byReg.filter(s => !s.passes).length - a.byReg.filter(s => !s.passes).length)
                    .map((row, ri) => (
                      <tr key={row.inst.id} style={{ borderBottom: `1px solid ${T.border}`, background: ri % 2 === 0 ? '#fff' : T.sub }}>
                        <td style={{ padding: '7px 12px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{row.inst.name}</td>
                        {REGULATORS.filter(r => matrixRegFilter === 'All' || r.name === matrixRegFilter).map(r => {
                          const s = row.byReg[r.id];
                          const bg = colorByShortfall
                            ? s.shortfall > 2 ? T.red + '30' : s.shortfall > 0 ? T.amber + '30' : T.green + '20'
                            : s.passes ? T.green + '20' : s.stressedCET1 > r.threshold * 0.85 ? T.amber + '30' : T.red + '30';
                          const textC = s.passes ? T.green : s.stressedCET1 > r.threshold * 0.85 ? T.amber : T.red;
                          return (
                            <td key={r.id} style={{ padding: '7px 10px', background: bg, textAlign: 'center', fontWeight: 700, color: textC }}>
                              {s.stressedCET1.toFixed(1)}%
                              {!s.passes && <div style={{ fontSize: 9, color: T.red }}>-${s.shortfall.toFixed(1)}B</div>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            TAB 6 — Submission Tracker
        ───────────────────────────────────────────────────────── */}
        {tab === 6 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <Btn active={overdueOnly} onClick={() => setOverdueOnly(b => !b)} small>Overdue Only</Btn>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Min Completion %</div>
                <input type="number" value={completenessMin} onChange={e => setCompletenessMin(+e.target.value)}
                  min={0} max={100} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, width: 80 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Sort By</div>
                <Select value={sortBy7} onChange={setSortBy7} options={[
                  { value: 'nextDeadline', label: 'Deadline' },
                  { value: 'completeness', label: 'Completion %' },
                  { value: 'name', label: 'Name' },
                ]} />
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: T.muted }}>
                {trackerList.length} institutions shown
              </div>
            </div>

            {/* Summary row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {['Submitted','In Progress','Not Started'].map(s => {
                const count = INSTITUTIONS.reduce((tot, inst) =>
                  tot + REGULATORS.filter(r => inst.submissionStatus[r.name] === s).length, 0);
                return <KpiCard key={s} label={s} value={count} color={s === 'Submitted' ? T.green : s === 'In Progress' ? T.amber : T.red}
                  sub={`${(count / (INSTITUTIONS.length * REGULATORS.length) * 100).toFixed(0)}% of all filings`} />;
              })}
              <KpiCard label="Avg Completion" value={(INSTITUTIONS.reduce((s, x) => s + x.templateCompletionPct, 0) / INSTITUTIONS.length).toFixed(0) + '%'} color={T.indigo} />
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'auto', maxHeight: 480 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, position: 'sticky', top: 0, background: T.sub }}>Institution</th>
                    <th style={{ padding: '9px 10px', fontWeight: 700, color: T.navy, position: 'sticky', top: 0, background: T.sub }}>Deadline</th>
                    <th style={{ padding: '9px 10px', fontWeight: 700, color: T.navy, position: 'sticky', top: 0, background: T.sub }}>Completion</th>
                    <th style={{ padding: '9px 10px', fontWeight: 700, color: T.navy, position: 'sticky', top: 0, background: T.sub }}>DQ Score</th>
                    {REGULATORS.map(r => (
                      <th key={r.id} style={{ padding: '9px 8px', fontWeight: 700, color: r.color, position: 'sticky', top: 0, background: T.sub, whiteSpace: 'nowrap' }}>{r.name}</th>
                    ))}
                    <th style={{ padding: '9px 10px', fontWeight: 700, color: T.red, position: 'sticky', top: 0, background: T.sub }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trackerList.map((inst, ri) => {
                    const isOverdue = inst.nextDeadline < '2025-04-08' && Object.values(inst.submissionStatus).some(s => s !== 'Submitted');
                    return (
                      <tr key={inst.id} style={{ borderBottom: `1px solid ${T.border}`, background: isOverdue ? T.red + '08' : ri % 2 === 0 ? '#fff' : T.sub }}>
                        <td style={{ padding: '7px 12px', fontWeight: 700, color: T.navy }}>{inst.name}</td>
                        <td style={{ padding: '7px 10px', color: isOverdue ? T.red : T.text, fontWeight: isOverdue ? 700 : 400 }}>
                          {inst.nextDeadline} {isOverdue && <span style={{ color: T.red, fontSize: 10 }}>OVERDUE</span>}
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ background: T.border, borderRadius: 3, height: 5, width: 60 }}>
                              <div style={{ background: inst.templateCompletionPct > 70 ? T.green : inst.templateCompletionPct > 40 ? T.amber : T.red, height: 5, borderRadius: 3, width: inst.templateCompletionPct + '%' }} />
                            </div>
                            <span>{inst.templateCompletionPct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px' }}>{(inst.dataQualityScore * 100).toFixed(0)}%</td>
                        {REGULATORS.map(r => {
                          const s = inst.submissionStatus[r.name];
                          const c = s === 'Submitted' ? T.green : s === 'In Progress' ? T.amber : T.red;
                          return <td key={r.id} style={{ padding: '7px 8px', textAlign: 'center' }}>
                            <span style={{ background: c + '20', color: c, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>
                              {s === 'Submitted' ? '✓' : s === 'In Progress' ? '~' : '✗'}
                            </span>
                          </td>;
                        })}
                        <td style={{ padding: '7px 10px' }}>
                          {isOverdue && <Pill label="Escalate" color={T.red} />}
                          {!isOverdue && Object.values(inst.submissionStatus).some(s => s === 'Not Started') && <Pill label="Initiate" color={T.amber} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            TAB 7 — Cross-Regulator Analysis
        ───────────────────────────────────────────────────────── */}
        {tab === 7 && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Regulator A (X-axis)</div>
                <Select value={compareRegA} onChange={v => setCompareRegA(+v)}
                  options={REGULATORS.map(r => ({ value: r.id, label: r.name }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Regulator B (Y-axis)</div>
                <Select value={compareRegB} onChange={v => setCompareRegB(+v)}
                  options={REGULATORS.map(r => ({ value: r.id, label: r.name }))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionTitle>CET1 Scatter — {REGULATORS[compareRegA].name} vs {REGULATORS[compareRegB].name}</SectionTitle>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" dataKey="regA" name={REGULATORS[compareRegA].name} unit="%" tick={{ fontSize: 10 }}
                      label={{ value: REGULATORS[compareRegA].name + ' CET1%', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                    <YAxis type="number" dataKey="regB" name={REGULATORS[compareRegB].name} unit="%" tick={{ fontSize: 10 }}
                      label={{ value: REGULATORS[compareRegB].name + ' CET1%', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v.toFixed(2) + '%', n]} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{d?.name}</div>
                          <div>{REGULATORS[compareRegA].name}: {d?.regA?.toFixed(2)}%</div>
                          <div>{REGULATORS[compareRegB].name}: {d?.regB?.toFixed(2)}%</div>
                        </div>
                      );
                    }} />
                    <Scatter data={crossRegData} fill={T.indigo}>
                      {crossRegData.map((d, i) => (
                        <Cell key={i} fill={d.shortfall > 0 ? T.red : T.indigo} fillOpacity={0.7} />
                      ))}
                    </Scatter>
                    <ReferenceLine x={REGULATORS[compareRegA].threshold} stroke={REGULATORS[compareRegA].color} strokeDasharray="4 4" />
                    <ReferenceLine y={REGULATORS[compareRegB].threshold} stroke={REGULATORS[compareRegB].color} strokeDasharray="4 4" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <SectionTitle>Regulator Severity Ranking</SectionTitle>
                  {REGULATORS.map(r => {
                    const col = stressMatrix.map(row => row.byReg[r.id]);
                    const avgCET1 = col.length > 0 ? col.reduce((s, x) => s + x.stressedCET1, 0) / col.length : 0;
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ fontSize: 11, width: 80, color: r.color, fontWeight: 700 }}>{r.name}</div>
                        <div style={{ flex: 1, background: T.border, borderRadius: 4, height: 8 }}>
                          <div style={{ background: r.color, height: 8, borderRadius: 4, width: Math.min(100, avgCET1 / 16 * 100) + '%' }} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, width: 48, textAlign: 'right', color: avgCET1 < r.threshold ? T.red : T.green }}>{avgCET1.toFixed(1)}%</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <SectionTitle>Outcome Correlation</SectionTitle>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>Institutions that fail A and also fail B:</div>
                  {(() => {
                    const bothFail = crossRegData.filter(d => d.regA < REGULATORS[compareRegA].threshold && d.regB < REGULATORS[compareRegB].threshold).length;
                    const onlyA   = crossRegData.filter(d => d.regA < REGULATORS[compareRegA].threshold && d.regB >= REGULATORS[compareRegB].threshold).length;
                    const onlyB   = crossRegData.filter(d => d.regB < REGULATORS[compareRegB].threshold && d.regA >= REGULATORS[compareRegA].threshold).length;
                    return [
                      { l: 'Fail both', v: bothFail, c: T.red },
                      { l: `Fail ${REGULATORS[compareRegA].name} only`, v: onlyA, c: T.amber },
                      { l: `Fail ${REGULATORS[compareRegB].name} only`, v: onlyB, c: T.orange },
                      { l: 'Pass both', v: INSTITUTIONS.length - bothFail - onlyA - onlyB, c: T.green },
                    ].map(({ l, v, c }) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                        <span style={{ color: T.muted }}>{l}</span>
                        <span style={{ fontWeight: 700, color: c }}>{v}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            TAB 8 — Capital Action Plans
        ───────────────────────────────────────────────────────── */}
        {tab === 8 && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Institution</div>
                <Select value={actionInstId} onChange={v => setActionInstId(+v)}
                  options={INSTITUTIONS.map(x => ({ value: x.id, label: x.name }))} style={{ width: 220 }} />
              </div>
              <Btn small color={T.muted} onClick={() => setSelectedActions([])}>Clear Actions</Btn>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Action selector */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionTitle>Management Actions Library</SectionTitle>
                {MANAGEMENT_ACTIONS.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                    borderBottom: `1px solid ${T.border}`,
                    background: selectedActions.includes(a.id) ? T.indigo + '08' : 'transparent',
                  }}>
                    <input type="checkbox" checked={selectedActions.includes(a.id)}
                      onChange={e => setSelectedActions(prev => e.target.checked ? [...prev, a.id] : prev.filter(x => x !== a.id))}
                      style={{ accentColor: T.indigo, width: 14, height: 14 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{a.timeline} · {a.cost} · Feasibility: {a.feasibility}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.green }}>+{(a.cet1ImpactPct * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>

              {/* Live CET1 projection */}
              <div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
                  <SectionTitle>CET1 Projection — {actionInst.name}</SectionTitle>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                    <KpiCard label="Base CET1" value={actionStress.baseCET1.toFixed(2) + '%'} color={T.navy} />
                    <KpiCard label="Stressed CET1" value={actionStress.stressedCET1.toFixed(2) + '%'}
                      color={actionStress.stressedCET1 < REGULATORS[0].threshold ? T.red : T.green} />
                    <KpiCard label="Shortfall" value={'$' + actionStress.shortfall.toFixed(2) + 'B'} color={actionStress.shortfall > 0 ? T.red : T.green} />
                    <KpiCard label="Action Boost" value={'+' + actionBoost.toFixed(2) + '%'} color={T.green} />
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>Projected CET1 after selected actions:</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: projectedCET1 >= REGULATORS[0].threshold ? T.green : T.red }}>
                    {projectedCET1.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: 13, color: projectedCET1 >= REGULATORS[0].threshold ? T.green : T.red, marginTop: 4, fontWeight: 700 }}>
                    {projectedCET1 >= REGULATORS[0].threshold ? '✓ PASS — Above ECB minimum' : '✗ FAIL — Still below threshold'}
                  </div>
                </div>

                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                  <SectionTitle>Action Timeline</SectionTitle>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={MANAGEMENT_ACTIONS.filter(a => selectedActions.includes(a.id)).map(a => ({
                      name: a.name.substring(0, 14),
                      cet1: +(a.cet1ImpactPct * 100).toFixed(1),
                    }))} barSize={28} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                      <XAxis type="number" unit="%" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                      <Tooltip formatter={v => v + '% CET1'} />
                      <Bar dataKey="cet1" name="CET1 Impact" fill={T.green} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            TAB 9 — Summary & Export
        ───────────────────────────────────────────────────────── */}
        {tab === 9 && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Regulator Filter</div>
                <Select value={exportRegFilter} onChange={setExportRegFilter}
                  options={['All', ...REGULATORS.map(r => r.name)]} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Export Format</div>
                <Select value={exportFormat} onChange={setExportFormat} options={['CSV','Excel','PDF','JSON']} />
              </div>
              <Btn onClick={() => alert(`Export triggered: ${exportFormat} for ${exportRegFilter} regulators`)}>
                Export Results
              </Btn>
            </div>

            {/* Summary KPIs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Total Institutions" value={INSTITUTIONS.length} sub="across 8 jurisdictions" />
              <KpiCard label="Regulators" value={REGULATORS.length} sub="active frameworks" />
              <KpiCard label="Avg Pass Rate" value={(passRates.reduce((s, r) => s + parseFloat(r.pct), 0) / passRates.length).toFixed(1) + '%'}
                color={parseFloat((passRates.reduce((s, r) => s + parseFloat(r.pct), 0) / passRates.length).toFixed(1)) >= 75 ? T.green : T.amber} />
              <KpiCard label="Aggregate Shortfall" value={'$' + fleetStats.totalShortfall.toFixed(1) + 'B'} color={T.red} />
              <KpiCard label="Fleet Avg Base CET1" value={fleetStats.avgBase.toFixed(2) + '%'} color={T.navy} />
              <KpiCard label="Fleet Avg Stressed CET1" value={fleetStats.avgStress.toFixed(2) + '%'} color={T.red} />
            </div>

            {/* Pass rates bar */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <SectionTitle>Pass Rate Summary</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={passRates.filter(r => exportRegFilter === 'All' || r.name === exportRegFilter)} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => v + '%'} />
                  <Bar dataKey="pct" name="Pass Rate">
                    {passRates.map((r, i) => <Cell key={i} fill={parseFloat(r.pct) >= 80 ? T.green : parseFloat(r.pct) >= 60 ? T.amber : T.red} />)}
                  </Bar>
                  <ReferenceLine y={80} stroke={T.indigo} strokeDasharray="4 4" label={{ value: '80% Target', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Remediation priority list */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <SectionTitle>Remediation Priority List — Top 10 Shortfalls</SectionTitle>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.navy }}>Rank</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.navy }}>Institution</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.navy }}>Worst Regulator</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.navy }}>Stressed CET1</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.navy }}>Shortfall</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.navy }}>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {stressMatrix
                    .map(row => {
                      const worst = row.byReg.reduce((a, b) => a.shortfall > b.shortfall ? a : b);
                      const worstReg = REGULATORS[row.byReg.indexOf(worst)];
                      return { inst: row.inst, worst, worstReg };
                    })
                    .filter(x => x.worst.shortfall > 0)
                    .sort((a, b) => b.worst.shortfall - a.worst.shortfall)
                    .slice(0, 10)
                    .map((x, ri) => (
                      <tr key={x.inst.id} style={{ borderBottom: `1px solid ${T.border}`, background: ri % 2 === 0 ? '#fff' : T.sub }}>
                        <td style={{ padding: '8px 12px', fontWeight: 800, color: T.navy }}>#{ri + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>{x.inst.name}</td>
                        <td style={{ padding: '8px 12px', color: x.worstReg?.color }}>{x.worstReg?.name ?? '—'}</td>
                        <td style={{ padding: '8px 12px', color: T.red, fontWeight: 700 }}>{x.worst.stressedCET1.toFixed(2)}%</td>
                        <td style={{ padding: '8px 12px', color: T.red, fontWeight: 700 }}>${x.worst.shortfall.toFixed(2)}B</td>
                        <td style={{ padding: '8px 12px' }}>
                          <Pill label={ri < 3 ? 'Critical' : ri < 6 ? 'High' : 'Medium'}
                            color={ri < 3 ? T.red : ri < 6 ? T.amber : T.gold} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
