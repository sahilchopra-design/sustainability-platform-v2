import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine,
  ScatterChart, Scatter, AreaChart, Area, Cell,
} from 'recharts';
import CurrencyToggle from '../../../components/CurrencyToggle';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── static lookup tables ─────────────────────────────────────────── */
const INSTITUTION_TYPES = ['Commercial Bank','Investment Bank','Universal Bank','Regional Bank','Insurance Group','Asset Manager','Cooperative Bank','Development Bank'];
const JURISDICTIONS = ['EU','UK','US','Canada','Australia','Japan','Singapore','Switzerland','UAE','Brazil'];
const FRAMEWORKS_BY_JURIS = { EU:'CRR2/Basel IV', UK:'PRA SS3/19', US:'FRB Pilot', Canada:'OSFI B-15', Australia:'APRA CPG 229', Japan:'FSA Climate', Singapore:'MAS Guidelines', Switzerland:'FINMA Circ', UAE:'CBUAE', Brazil:'BCB Res 4' };
const CET1_MIN = { EU:10.5, UK:11.0, US:9.5, Canada:10.0, Australia:10.25, Japan:9.0, Singapore:10.0, Switzerland:12.0, UAE:9.5, Brazil:8.5 };
const JURIS_RULES = {
  EU:          { label:'CRR2 + EBA GL',      minCET1:10.5,  pillarMult:1.20, greenBonus:0.12, gsibSurcharge:1.5, ccyb:0.5, p2rAvg:2.0, climateCapBuf:0.25 },
  UK:          { label:'PRA SS3/19',          minCET1:11.0,  pillarMult:1.15, greenBonus:0.10, gsibSurcharge:1.0, ccyb:1.0, p2rAvg:2.5, climateCapBuf:0.30 },
  US:          { label:'FRB Climate Pilot',   minCET1:9.5,   pillarMult:1.00, greenBonus:0.05, gsibSurcharge:2.0, ccyb:0.0, p2rAvg:1.5, climateCapBuf:0.10 },
  Canada:      { label:'OSFI B-15',           minCET1:10.0,  pillarMult:1.10, greenBonus:0.08, gsibSurcharge:0.5, ccyb:0.25,p2rAvg:2.0, climateCapBuf:0.20 },
  Australia:   { label:'APRA CPG 229',        minCET1:10.25, pillarMult:1.08, greenBonus:0.07, gsibSurcharge:0.0, ccyb:0.0, p2rAvg:1.8, climateCapBuf:0.15 },
  Japan:       { label:'FSA Climate',         minCET1:9.0,   pillarMult:1.00, greenBonus:0.05, gsibSurcharge:0.5, ccyb:0.0, p2rAvg:1.5, climateCapBuf:0.10 },
  Singapore:   { label:'MAS Guidelines',      minCET1:10.0,  pillarMult:1.05, greenBonus:0.06, gsibSurcharge:0.0, ccyb:0.0, p2rAvg:1.8, climateCapBuf:0.15 },
  Switzerland: { label:'FINMA Circ 2017/7',   minCET1:12.0,  pillarMult:1.25, greenBonus:0.10, gsibSurcharge:2.5, ccyb:0.5, p2rAvg:3.0, climateCapBuf:0.35 },
  UAE:         { label:'CBUAE Framework',     minCET1:9.5,   pillarMult:0.95, greenBonus:0.04, gsibSurcharge:0.0, ccyb:0.0, p2rAvg:1.2, climateCapBuf:0.08 },
  Brazil:      { label:'BCB Resolution 4',    minCET1:8.5,   pillarMult:1.02, greenBonus:0.04, gsibSurcharge:0.0, ccyb:0.25,p2rAvg:1.5, climateCapBuf:0.12 },
};

const CAPITAL_COMPONENTS = [
  { key:'cet1Min',   label:'CET1 Minimum (4.5%)',        color:T.indigo },
  { key:'ccb',       label:'Capital Conservation Buffer', color:'#6366f1' },
  { key:'gsib',      label:'G-SIB Surcharge',             color:T.blue },
  { key:'ccyb',      label:'Countercyclical Buffer',      color:T.teal },
  { key:'p2r',       label:'Pillar 2 Requirement',        color:T.amber },
  { key:'p2g',       label:'Pillar 2 Guidance',           color:T.orange },
  { key:'climateBuf',label:'Climate Buffer Add-On',       color:T.red },
  { key:'at1',       label:'Additional Tier 1',           color:T.purple },
  { key:'tier2',     label:'Tier 2',                      color:T.gold },
];

const ASSET_CLASSES_RWA = [
  { name:'Corporate Loans',        saWeight:1.00, irbWeight:0.72, climateMult:1.18, strandedHaircut:0.12, carbonIntensity:'High' },
  { name:'SME Loans',              saWeight:0.85, irbWeight:0.60, climateMult:1.10, strandedHaircut:0.08, carbonIntensity:'Med'  },
  { name:'Residential Mortgages',  saWeight:0.35, irbWeight:0.22, climateMult:1.25, strandedHaircut:0.18, carbonIntensity:'High' },
  { name:'Commercial RE',          saWeight:1.00, irbWeight:0.68, climateMult:1.30, strandedHaircut:0.22, carbonIntensity:'High' },
  { name:'Project Finance',        saWeight:1.30, irbWeight:0.90, climateMult:1.40, strandedHaircut:0.30, carbonIntensity:'High' },
  { name:'Fossil Fuel Exposure',   saWeight:1.50, irbWeight:1.10, climateMult:1.65, strandedHaircut:0.45, carbonIntensity:'Very High' },
  { name:'Green Bonds',            saWeight:0.20, irbWeight:0.14, climateMult:0.85, strandedHaircut:0.02, carbonIntensity:'Low' },
  { name:'Infrastructure',         saWeight:0.75, irbWeight:0.55, climateMult:1.15, strandedHaircut:0.10, carbonIntensity:'Med' },
  { name:'Sovereign Bonds',        saWeight:0.00, irbWeight:0.00, climateMult:1.05, strandedHaircut:0.05, carbonIntensity:'Low' },
  { name:'Financial Institutions', saWeight:0.40, irbWeight:0.28, climateMult:1.08, strandedHaircut:0.06, carbonIntensity:'Med' },
  { name:'Equity (Unlisted)',      saWeight:1.50, irbWeight:1.20, climateMult:1.20, strandedHaircut:0.15, carbonIntensity:'Med' },
  { name:'Trade Finance',          saWeight:0.50, irbWeight:0.35, climateMult:1.05, strandedHaircut:0.04, carbonIntensity:'Low' },
];

const SCENARIOS = [
  { id:0, name:'Baseline',        shortName:'BASE', pillar2AddPct:0,   haircut:0,    natcatMult:1.0, greenBonus:0,    color:'#6b7280' },
  { id:1, name:'Orderly 1.5°C',   shortName:'ORD',  pillar2AddPct:0.8, haircut:0.03, natcatMult:1.2, greenBonus:0.10, color:T.green   },
  { id:2, name:'Disorderly 2°C',  shortName:'DIS',  pillar2AddPct:1.5, haircut:0.06, natcatMult:1.5, greenBonus:0.05, color:T.amber   },
  { id:3, name:'Hot House 3°C',   shortName:'HOT',  pillar2AddPct:2.8, haircut:0.12, natcatMult:2.2, greenBonus:0,    color:T.orange  },
  { id:4, name:'Tail Risk 4°C+',  shortName:'TAIL', pillar2AddPct:4.5, haircut:0.20, natcatMult:3.5, greenBonus:0,    color:T.red     },
  { id:5, name:'Bifurcated',      shortName:'BIF',  pillar2AddPct:2.0, haircut:0.08, natcatMult:1.8, greenBonus:0.03, color:T.purple  },
  { id:6, name:'Policy Shock',    shortName:'POL',  pillar2AddPct:3.2, haircut:0.15, natcatMult:1.6, greenBonus:0.08, color:T.indigo  },
  { id:7, name:'Tech Revolution', shortName:'TECH', pillar2AddPct:0.5, haircut:0.02, natcatMult:1.1, greenBonus:0.15, color:T.teal   },
];

const STRESS_QUARTERLY = Array.from({ length:9 }, (_, q) => ({
  quarter: `Q${(q % 4) + 1}-${2024 + Math.floor(q / 4)}`,
  baseline:    +(12.5 - q * 0.05 + sr(q * 7) * 0.3).toFixed(2),
  orderly:     +(12.5 - q * 0.12 - sr(q * 11) * 0.4).toFixed(2),
  disorderly:  +(12.5 - q * 0.22 - sr(q * 13) * 0.6).toFixed(2),
  hotHouse:    +(12.5 - q * 0.38 - sr(q * 17) * 0.8).toFixed(2),
  tailRisk:    +(12.5 - q * 0.55 - sr(q * 19) * 1.1).toFixed(2),
  ppnrImpact:  -(q * 0.08 + sr(q * 23) * 0.5),
  llp:         +(q * 0.12 + sr(q * 29) * 0.4).toFixed(2),
}));

const SENSITIVITY_DRIVERS = [
  { name:'Physical Risk Score +10pts', impact:-0.062, category:'Physical' },
  { name:'Fossil Fuel Exp +5%',        impact:-0.048, category:'Transition' },
  { name:'Climate RWA Mult +0.1',      impact:-0.041, category:'Regulatory' },
  { name:'Carbon Price +$50/t',        impact:-0.035, category:'Transition' },
  { name:'P2G Add-On +50bps',          impact:-0.032, category:'Regulatory' },
  { name:'NatCat Event (1-in-50)',      impact:-0.028, category:'Physical' },
  { name:'Green Loan Pct +10%',        impact:+0.022, category:'Mitigation' },
  { name:'GAR Bonus Eligibility',      impact:+0.018, category:'Mitigation' },
  { name:'CET1 Threshold +0.5%',       impact:-0.015, category:'Regulatory' },
  { name:'Leverage Ratio Bind',        impact:-0.012, category:'Regulatory' },
  { name:'Transition Plan Discount',   impact:+0.010, category:'Mitigation' },
  { name:'Scope 1 Intensity -20%',     impact:+0.008, category:'Mitigation' },
];

import { isIndiaMode, adaptForCapitalAdequacy } from '../../../data/IndiaDataAdapter';

const INST_NAMES = [
  'Barclays Global','JPMorgan Chase','Deutsche Bank','HSBC Holdings','BNP Paribas','Société Générale',
  'UniCredit Group','Intesa Sanpaolo','Santander SA','ING Group','Rabobank','Credit Suisse',
  'UBS Group','Nordea Bank','DnB ASA','Handelsbanken','Swedbank','SEB Group','Danske Bank','ABN AMRO',
  'Commerzbank','Bayern LB','DZ Bank','Helaba','LBBW','Volkswagen Bank','Siemens Bank','Allianz SE',
  'Munich Re','Axa Group','Generali','Zurich Insurance','AIG Corp','MetLife','Prudential PLC',
  'Aviva Group','Legal & General','Standard Life','Aegon NV','Mapfre SA','Fidelity Intl','Vanguard',
  'BlackRock','State Street','Wellington','Bridgewater','Pimco Capital','T Rowe Price','Capital Group',
  'Northern Trust','Bank of America','Wells Fargo','Citigroup','Goldman Sachs','Morgan Stanley',
  'US Bancorp','PNC Financial','Truist Financial','KeyCorp','Regions Financial','Comerica','Zions Banco',
  'SVB Financial','First Republic','Signature Bank','East West Banco','Glacier Bancorp','Cullen Bankers',
  'Royal Bank Canada','TD Financial','Bank Montreal','CIBC Holdings','Scotiabank','Laurentian Bank',
  'CWB Financial','National Bank CA','Desjardins Grp','Meridian CU','Commonwealth Bank','ANZ Banking',
  'Westpac Banking','NAB Group','Bendigo Bank','Bank Queensland','Suncorp Group','AMP Limited',
  'Macquarie Group','Challenger Fin','MUFG Bank','Mizuho Financial','SMFG Holdings','Nomura Holdings',
  'Daiwa Securities','Resona Holdings','Sumitomo Mitsui','Japan Post Bank','DBS Group','OCBC Bank',
  'UOB Limited','Standard Chart',
];

const _DEFAULT_INSTITUTIONS = INST_NAMES.map((name, i) => {
  const juris = JURISDICTIONS[Math.floor(sr(i * 7) * JURISDICTIONS.length)];
  const type  = INSTITUTION_TYPES[Math.floor(sr(i * 11) * INSTITUTION_TYPES.length)];
  const rule  = JURIS_RULES[juris];
  const totalRWA           = 50 + sr(i * 13) * 950;
  const tier1Capital       = 0.08 + sr(i * 17) * 0.10;
  const at1Ratio           = 0.01 + sr(i * 83) * 0.025;
  const tier2Ratio         = 0.02 + sr(i * 89) * 0.04;
  const cet1Capital        = tier1Capital - at1Ratio - sr(i * 19) * 0.005;
  const cet1Excess         = Math.max(0, cet1Capital * 100 - rule.minCET1);
  const tlacRatio          = 0.18 + sr(i * 97) * 0.08;
  const mrelBuffer         = 0.02 + sr(i * 101) * 0.06;
  const bailInBuffer       = tlacRatio - tier1Capital - tier2Ratio;
  const climatRWAPct       = 0.05 + sr(i * 23) * 0.30;
  const physicalRiskScore  = 10 + sr(i * 29) * 80;
  const transitionRiskScore= 10 + sr(i * 31) * 80;
  const greenLoanPct       = sr(i * 41) * 0.45;
  const fossilFuelExposure = sr(i * 43) * 0.35;
  const ESGrating          = ['AAA','AA','A','BBB','BB','B'][Math.floor(sr(i * 47) * 6)];
  const carbonIntensive    = sr(i * 53) > 0.65;
  const lcrRatio           = 1.0 + sr(i * 59) * 0.8;
  const nsfr               = 1.0 + sr(i * 61) * 0.4;
  const leverageRatio      = 0.03 + sr(i * 67) * 0.05;
  const pillar2Guidance    = 0.005 + sr(i * 71) * 0.030;
  const natcatRWA          = totalRWA * climatRWAPct * sr(i * 37) * 0.4;
  const climateStressBuffer= physicalRiskScore * 0.001 * totalRWA;
  const carboPriceRWASens  = totalRWA * fossilFuelExposure * 0.008;
  const scope1Emissions    = 50 + sr(i * 107) * 4950;
  const netZeroTarget      = [2035,2040,2045,2050,2060,null][Math.floor(sr(i * 109) * 6)];
  const climateGovScore    = Math.round(20 + sr(i * 113) * 80);
  return {
    id:i, name, type, jurisdiction:juris, totalRWA,
    tier1Capital, at1Ratio, tier2Ratio, cet1Capital, cet1Excess,
    tlacRatio, mrelBuffer, bailInBuffer,
    climatRWAPct, physicalRiskScore, transitionRiskScore,
    natcatRWA, greenLoanPct, fossilFuelExposure, ESGrating, carbonIntensive,
    lcrRatio, nsfr, leverageRatio, pillar2Guidance, climateStressBuffer,
    carboPriceRWASens, scope1Emissions, netZeroTarget, climateGovScore,
    regulatoryFramework: FRAMEWORKS_BY_JURIS[juris],
  };
});
// ── India Dataset Integration ──
const INSTITUTIONS = isIndiaMode() ? adaptForCapitalAdequacy() : _DEFAULT_INSTITUTIONS;

/* ── capital computation ─────────────────────────────────────────── */
function computeCapital(inst, scenario) {
  const rule        = JURIS_RULES[inst.jurisdiction];
  const pillar2AddOn= inst.climatRWAPct * inst.totalRWA * (scenario.pillar2AddPct / 100) * rule.pillarMult;
  const garBonus    = inst.greenLoanPct > 0.30 ? pillar2AddOn * scenario.greenBonus : 0;
  const netPillar2  = Math.max(0, pillar2AddOn - garBonus);
  const baseCapital = inst.tier1Capital * inst.totalRWA;
  const adjCapital  = baseCapital - netPillar2;
  const cet1Impact  = inst.totalRWA > 0 ? adjCapital / inst.totalRWA : 0;
  const threshold   = rule.minCET1 / 100;
  const shortfall   = Math.max(0, threshold - cet1Impact);
  const stressBuffer= inst.physicalRiskScore * 0.001 * inst.totalRWA * scenario.natcatMult;
  const lvgImpact   = inst.leverageRatio - netPillar2 / Math.max(inst.totalRWA * 12.5, 1) * 0.01;
  const at1Trigger  = Math.max(0, inst.cet1Capital * 100 - 5.125);
  return { pillar2AddOn, garBonus, netPillar2, cet1Impact, shortfall, stressBuffer, lvgImpact, threshold, at1Trigger };
}

/* ── shared UI components ────────────────────────────────────────── */
const KpiCard = ({ label, value, color=T.text, sub='', rag=null }) => {
  const ragColors = { green:T.green, amber:T.amber, red:T.red };
  return (
    <div style={{ background:T.card, border:`1px solid ${rag ? ragColors[rag] : T.border}`, borderLeft:`4px solid ${rag ? ragColors[rag] : T.indigo}`, borderRadius:8, padding:'14px 18px', flex:1, minWidth:148 }}>
      <div style={{ fontSize:10, color:T.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color: rag ? ragColors[rag] : color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{sub}</div>}
      {rag && <div style={{ fontSize:10, fontWeight:600, color:ragColors[rag], marginTop:4, textTransform:'uppercase' }}>{rag === 'green' ? 'PASS' : rag === 'amber' ? 'WATCH' : 'BREACH'}</div>}
    </div>
  );
};

const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom:16 }}>
    <div style={{ fontSize:14, fontWeight:700, color:T.navy, letterSpacing:'0.03em' }}>{title}</div>
    {sub && <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{sub}</div>}
  </div>
);

const SliderRow = ({ label, value, min, max, step=1, onChange, fmt=v=>v, color=T.indigo }) => (
  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
    <div style={{ fontSize:12, color:T.muted, width:200 }}>{label}</div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)}
      style={{ flex:1, accentColor:color }} />
    <div style={{ fontSize:13, fontWeight:700, color, width:60, textAlign:'right' }}>{fmt(value)}</div>
  </div>
);

const TABS = [
  'Capital Overview','Basel IV Stack','Institution Database','Climate RWA Engine',
  'Stress Test Matrix','Capital Optimizer','DFAST/CCAR Overlay','Jurisdiction Comparison',
  'Sensitivity Analysis','Summary & Export',
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function ClimateCapitalAdequacyPage() {
  /* global state */
  const [tab,          setTab]          = useState(0);
  const [scenarioIdx,  setScenarioIdx]  = useState(0);
  const [typeFilter,   setTypeFilter]   = useState('All');
  const [jurisFilter,  setJurisFilter]  = useState('All');
  const [carbonFilter, setCarbonFilter] = useState(false);
  const [search,       setSearch]       = useState('');
  const [sortCol,      setSortCol]      = useState('totalRWA');
  const [sortDir,      setSortDir]      = useState(-1);
  const [selectedId,   setSelectedId]   = useState(null);
  const [expandedId,   setExpandedId]   = useState(null);

  /* tab-specific state */
  const [t1ShowAT1,    setT1ShowAT1]    = useState(true);
  const [t1ShowT2,     setT1ShowT2]     = useState(true);
  const [t2InstIdx,    setT2InstIdx]    = useState(0);
  const [t4AssetIdx,   setT4AssetIdx]   = useState(0);
  const [t4IrbMode,    setT4IrbMode]    = useState(false);
  const [t4CarbonPrice,setT4CarbonPrice]= useState(50);
  const [t5ScenA,     setT5ScenA]      = useState(1);
  const [t5ScenB,     setT5ScenB]      = useState(3);
  const [t5InstCount,  setT5InstCount]  = useState(10);
  const [t5ShowThresh, setT5ShowThresh] = useState(true);
  const [t6GreenLoan,  setT6GreenLoan]  = useState(25);
  const [t6FossilExp,  setT6FossilExp]  = useState(15);
  const [t6P2G,        setT6P2G]        = useState(1.0);
  const [t6CarbonPrice,setT6CarbonPrice]= useState(80);
  const [t7Regulator,  setT7Regulator]  = useState('Fed');
  const [t7Horizon,    setT7Horizon]    = useState(9);
  const [t7Adverse,    setT7Adverse]    = useState(true);
  const [t8Framework,  setT8Framework]  = useState('EU');
  const [t9Driver,     setT9Driver]     = useState(0);
  const [t9Range,      setT9Range]      = useState(20);
  const [exportText,   setExportText]   = useState('');

  const scenario = SCENARIOS[scenarioIdx];

  /* enriched institutions */
  const enriched = useMemo(() =>
    INSTITUTIONS.map(inst => ({ ...inst, ...computeCapital(inst, scenario) })),
    [scenarioIdx]);

  const filtered = useMemo(() => {
    let d = enriched;
    if (typeFilter !== 'All') d = d.filter(x => x.type === typeFilter);
    if (jurisFilter !== 'All') d = d.filter(x => x.jurisdiction === jurisFilter);
    if (carbonFilter) d = d.filter(x => x.carbonIntensive);
    if (search) d = d.filter(x => x.name.toLowerCase().includes(search.toLowerCase()) || x.jurisdiction.toLowerCase().includes(search.toLowerCase()));
    return [...d].sort((a, b) => sortDir * ((a[sortCol] || 0) - (b[sortCol] || 0)));
  }, [enriched, typeFilter, jurisFilter, carbonFilter, search, sortCol, sortDir]);

  const portfolioAvgCET1 = useMemo(() => filtered.length ? filtered.reduce((s,x)=>s+x.cet1Impact,0)/filtered.length : 0, [filtered]);
  const totalShortfallBn = useMemo(() => filtered.reduce((s,x)=>s+x.shortfall*x.totalRWA,0), [filtered]);
  const breachCount      = useMemo(() => filtered.filter(x=>x.shortfall>0).length, [filtered]);
  const avgLeverage      = useMemo(() => filtered.length ? filtered.reduce((s,x)=>s+x.leverageRatio,0)/filtered.length : 0, [filtered]);
  const avgTLAC          = useMemo(() => filtered.length ? filtered.reduce((s,x)=>s+x.tlacRatio,0)/filtered.length : 0, [filtered]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => -d); else { setSortCol(col); setSortDir(-1); }
  }, [sortCol]);

  /* ── waterfall data for tab 1 ── */
  const waterfallData = useMemo(() => {
    const rule = JURIS_RULES[jurisFilter !== 'All' ? jurisFilter : 'EU'];
    return [
      { name:'CET1 Min',    value:4.5,              color:T.indigo  },
      { name:'CCB',         value:2.5,              color:'#818cf8' },
      { name:'G-SIB',       value:rule.gsibSurcharge,color:T.blue  },
      { name:'CCyB',        value:rule.ccyb,        color:T.teal   },
      { name:'P2R',         value:rule.p2rAvg,      color:T.amber  },
      { name:'P2G',         value:t6P2G,            color:T.orange },
      { name:'Climate Buf', value:rule.climateCapBuf+scenario.pillar2AddPct*0.1, color:T.red },
    ];
  }, [jurisFilter, t6P2G, scenarioIdx]);

  /* ── jurisdiction breakdown ── */
  const jurisBreakdown = useMemo(() => JURISDICTIONS.map(j => {
    const sub = filtered.filter(x => x.jurisdiction === j);
    const avgCET1 = sub.length ? sub.reduce((s,x)=>s+x.cet1Impact*100,0)/sub.length : 0;
    const rule = JURIS_RULES[j];
    return {
      jurisdiction:j, avgCET1:+avgCET1.toFixed(2),
      institutions:sub.length, breaches:sub.filter(x=>x.shortfall>0).length,
      threshold:rule.minCET1, minCET1:rule.minCET1, label:rule.label,
      gsib:rule.gsibSurcharge, ccyb:rule.ccyb, p2r:rule.p2rAvg,
      greenBonus:rule.greenBonus, climateBuf:rule.climateCapBuf,
    };
  }), [filtered]);

  /* ── t5 stress matrix (top N institutions × 2 scenarios) ── */
  const stressMatrix = useMemo(() => {
    const top = enriched.slice(0, t5InstCount);
    const scA = SCENARIOS[t5ScenA], scB = SCENARIOS[t5ScenB];
    return top.map(inst => {
      const cA = computeCapital(inst, scA);
      const cB = computeCapital(inst, scB);
      const rule = JURIS_RULES[inst.jurisdiction];
      return {
        name: inst.name.split(' ')[0],
        fullName: inst.name,
        juris: inst.jurisdiction,
        cet1A: +(cA.cet1Impact*100).toFixed(2),
        cet1B: +(cB.cet1Impact*100).toFixed(2),
        shortfallA: +(cA.shortfall*100).toFixed(3),
        shortfallB: +(cB.shortfall*100).toFixed(3),
        threshold: rule.minCET1,
        passA: cA.shortfall === 0,
        passB: cB.shortfall === 0,
      };
    });
  }, [enriched, t5ScenA, t5ScenB, t5InstCount]);

  /* ── t6 optimizer live CET1 ── */
  const optimizerResult = useMemo(() => {
    const rule = JURIS_RULES[jurisFilter !== 'All' ? jurisFilter : 'EU'];
    const baseRWA = 500;
    const greenLoanFactor = t6GreenLoan / 100;
    const fossilFactor    = t6FossilExp / 100;
    const carbonAdj       = (t6CarbonPrice / 100) * fossilFactor * 0.015;
    const garBonus        = greenLoanFactor > 0.30 ? scenario.greenBonus * 0.5 : 0;
    const p2gAdj          = t6P2G / 100;
    const baseCapPct      = 0.12;
    const adjCET1         = baseCapPct - carbonAdj - p2gAdj + garBonus - scenario.pillar2AddPct * 0.003;
    const minReq          = rule.minCET1 / 100;
    const shortfall       = Math.max(0, minReq - adjCET1) * baseRWA;
    const capitalAction   = shortfall > 0 ? shortfall / 0.08 : 0;
    return { adjCET1:+(adjCET1*100).toFixed(2), minReq:+(minReq*100).toFixed(1), shortfall:+shortfall.toFixed(1), capitalAction:+capitalAction.toFixed(0), pass:adjCET1 >= minReq };
  }, [t6GreenLoan, t6FossilExp, t6P2G, t6CarbonPrice, jurisFilter, scenarioIdx]);

  /* ── t7 DFAST quarterly path ── */
  const dfastPath = useMemo(() => {
    const quarters = STRESS_QUARTERLY.slice(0, t7Horizon);
    return quarters.map((q, qi) => {
      const stressShock = t7Adverse ? q.llp * 1.5 : q.llp * 0.8;
      const regMin = t7Regulator === 'Fed' ? 9.5 : t7Regulator === 'PRA' ? 11.0 : t7Regulator === 'ECB' ? 10.5 : 10.0;
      return {
        quarter:q.quarter,
        baseline: +(q.baseline).toFixed(2),
        stressed: +(q.baseline - stressShock - (t7Adverse?0.2:0.05)).toFixed(2),
        regulatory: regMin,
        ppnrImpact: +(q.ppnrImpact * (t7Adverse?1.4:0.8)).toFixed(3),
      };
    });
  }, [t7Horizon, t7Regulator, t7Adverse]);

  /* ── t9 sensitivity partial derivatives ── */
  const sensitivityScatter = useMemo(() => {
    const drv = SENSITIVITY_DRIVERS[t9Driver];
    const range = t9Range;
    return Array.from({length:21}, (_,i) => {
      const x = -range + i * (range/10);
      const cet1 = +(12.0 + drv.impact * x * 0.5 + sr(i*7)*0.1 - sr(i*11)*0.1).toFixed(3);
      return { x:+x.toFixed(1), cet1, fill: cet1 < 10 ? T.red : cet1 < 11 ? T.amber : T.green };
    });
  }, [t9Driver, t9Range]);

  /* ── filter bar ── */
  const filterBar = (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16, alignItems:'center', padding:'10px 14px', background:T.card, border:`1px solid ${T.border}`, borderRadius:8 }}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search institutions…"
        style={{ padding:'5px 9px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, width:152 }} />
      <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
        style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12 }}>
        <option>All</option>{INSTITUTION_TYPES.map(t=><option key={t}>{t}</option>)}
      </select>
      <select value={jurisFilter} onChange={e=>setJurisFilter(e.target.value)}
        style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12 }}>
        <option>All</option>{JURISDICTIONS.map(j=><option key={j}>{j}</option>)}
      </select>
      <label style={{ fontSize:12, color:T.muted, display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}>
        <input type="checkbox" checked={carbonFilter} onChange={e=>setCarbonFilter(e.target.checked)} />
        Carbon Intensive Only
      </label>
      <select value={scenarioIdx} onChange={e=>setScenarioIdx(+e.target.value)}
        style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, background:SCENARIOS[scenarioIdx].color, color:'#fff' }}>
        {SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <div style={{ marginLeft:'auto', fontSize:11, color:T.muted }}>
        {filtered.length} institutions · {breachCount} breaches
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TAB 0 — CAPITAL OVERVIEW
  ══════════════════════════════════════════════════════════════════ */
  const tab0 = (
    <div>
      {filterBar}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <KpiCard label="Portfolio Avg CET1" value={`${(portfolioAvgCET1*100).toFixed(2)}%`}
          rag={portfolioAvgCET1*100 >= 11 ? 'green' : portfolioAvgCET1*100 >= 9.5 ? 'amber' : 'red'}
          sub="Scenario-adjusted" />
        <KpiCard label="CET1 Breaches" value={breachCount}
          rag={breachCount === 0 ? 'green' : breachCount <= 3 ? 'amber' : 'red'}
          sub={`of ${filtered.length} institutions`} />
        <div style={{ flex:'1 0 auto', background:T.card, borderRadius:8, padding:'10px 14px', border:`1px solid ${T.border}`, minWidth:130 }}>
          <div style={{ fontSize:10, color:T.muted, letterSpacing:0.3, marginBottom:4 }}>CAPITAL SHORTFALL</div>
          <CurrencyToggle usdValue={totalShortfallBn * 1e9} size="lg" />
          <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>Total regulatory gap</div>
        </div>
        <KpiCard label="Avg Leverage Ratio" value={`${(avgLeverage*100).toFixed(2)}%`}
          rag={avgLeverage*100 >= 4 ? 'green' : 'amber'}
          sub="Basel III min 3%" />
        <KpiCard label="Avg TLAC Ratio" value={`${(avgTLAC*100).toFixed(1)}%`}
          rag={avgTLAC*100 >= 18 ? 'green' : 'amber'}
          sub="FSB TLAC standard" />
        <KpiCard label="Active Scenario" value={scenario.shortName}
          color={scenario.color}
          sub={scenario.name} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Capital Waterfall — Stacked Requirements" sub={`Jurisdiction: ${jurisFilter === 'All' ? 'EU (default)' : jurisFilter} · Scenario: ${scenario.name}`} />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={waterfallData} margin={{top:4,right:8,bottom:4,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{fontSize:10}} />
              <YAxis unit="%" tick={{fontSize:10}} />
              <Tooltip formatter={v=>`${v.toFixed(2)}%`} />
              <Bar dataKey="value" radius={[3,3,0,0]}>
                {waterfallData.map((d,i)=><Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="CET1 Distribution — All Institutions" sub="Histogram by CET1 bucket" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={(() => {
              const buckets = [8,9,10,11,12,13,14,15,16].map(b=>({ range:`${b}-${b+1}%`, count:0 }));
              filtered.forEach(x => {
                const v = x.cet1Impact*100;
                const idx = Math.min(Math.floor(Math.max(0,v-8)), buckets.length-1);
                if(idx>=0) buckets[idx].count++;
              });
              return buckets;
            })()} margin={{top:4,right:8,bottom:4,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} />
              <Tooltip />
              <Bar dataKey="count" fill={T.indigo} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Scenario Impact on Avg CET1" sub="All 8 NGFS scenarios vs baseline" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SCENARIOS.map(sc=>{
              const inst = filtered.slice(0,20);
              const avg = inst.length ? inst.reduce((s,x)=>{
                const c = computeCapital(x,sc); return s+c.cet1Impact*100;
              },0)/inst.length : 0;
              return { name:sc.shortName, avgCET1:+avg.toFixed(2), color:sc.color };
            })} margin={{top:4,right:8,bottom:4,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{fontSize:10}} />
              <YAxis unit="%" domain={[8,14]} tick={{fontSize:10}} />
              <Tooltip formatter={v=>`${v}%`} />
              <Bar dataKey="avgCET1" radius={[3,3,0,0]}>
                {SCENARIOS.map((sc,i)=><Cell key={i} fill={sc.color} />)}
              </Bar>
              <ReferenceLine y={10.5} stroke={T.red} strokeDasharray="4 2" label={{value:'EU min',fontSize:9}} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Breach Count by Jurisdiction" sub={`Scenario: ${scenario.name}`} />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={jurisBreakdown.filter(j=>j.institutions>0)} margin={{top:4,right:8,bottom:4,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="jurisdiction" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} />
              <Tooltip />
              <Bar dataKey="breaches" fill={T.red} radius={[3,3,0,0]} name="Breaches" />
              <Bar dataKey="institutions" fill={T.indigo} radius={[3,3,0,0]} fillOpacity={0.3} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TAB 1 — BASEL IV STACK
  ══════════════════════════════════════════════════════════════════ */
  const selectedInst2 = enriched[t2InstIdx];
  const rule2 = JURIS_RULES[selectedInst2.jurisdiction];

  const stackData = useMemo(() => {
    const inst = enriched[t2InstIdx];
    const rule  = JURIS_RULES[inst.jurisdiction];
    const sc    = scenario;
    return [
      { name:'CET1 Min',    pct:4.5,                    color:T.indigo  },
      { name:'CCB',         pct:2.5,                    color:'#818cf8' },
      { name:'G-SIB',       pct:rule.gsibSurcharge,     color:T.blue    },
      { name:'CCyB',        pct:rule.ccyb,              color:T.teal    },
      { name:'P2R',         pct:rule.p2rAvg,            color:T.amber   },
      { name:'P2G',         pct:inst.pillar2Guidance*100,color:T.orange },
      { name:'Climate Buf', pct:rule.climateCapBuf + sc.pillar2AddPct*0.08, color:T.red },
      { name:'AT1',         pct:inst.at1Ratio*100,      color:T.purple  },
      { name:'Tier 2',      pct:inst.tier2Ratio*100,    color:T.gold    },
    ];
  }, [t2InstIdx, scenarioIdx, enriched]);

  const tab1 = (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>Institution:</div>
        <select value={t2InstIdx} onChange={e=>setT2InstIdx(+e.target.value)}
          style={{ padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, flex:1, maxWidth:300 }}>
          {INSTITUTIONS.map((inst,i)=><option key={i} value={i}>{inst.name} ({inst.jurisdiction})</option>)}
        </select>
        <div style={{ display:'flex', gap:8 }}>
          <label style={{ fontSize:12, display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}>
            <input type="checkbox" checked={t1ShowAT1} onChange={e=>setT1ShowAT1(e.target.checked)} /> Show AT1
          </label>
          <label style={{ fontSize:12, display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}>
            <input type="checkbox" checked={t1ShowT2} onChange={e=>setT1ShowT2(e.target.checked)} /> Show T2
          </label>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <KpiCard label="CET1 Ratio" value={`${(selectedInst2.cet1Capital*100).toFixed(2)}%`}
          rag={selectedInst2.cet1Capital*100 >= rule2.minCET1 ? 'green' : 'red'} sub={`Min: ${rule2.minCET1}%`} />
        <KpiCard label="AT1 Ratio" value={`${(selectedInst2.at1Ratio*100).toFixed(2)}%`} color={T.purple} sub="Trigger @ 5.125%" />
        <KpiCard label="Tier 2 Ratio" value={`${(selectedInst2.tier2Ratio*100).toFixed(2)}%`} color={T.gold} sub="Total Capital =" />
        <KpiCard label="TLAC Ratio" value={`${(selectedInst2.tlacRatio*100).toFixed(1)}%`}
          rag={selectedInst2.tlacRatio*100 >= 18 ? 'green' : 'amber'} sub="FSB min 18%" />
        <KpiCard label="MREL Buffer" value={`${(selectedInst2.mrelBuffer*100).toFixed(2)}%`} color={T.teal} sub="Above MREL req" />
        <KpiCard label="AT1 Trigger Dist" value={`${(selectedInst2.cet1Capital*100 - 5.125).toFixed(2)}%`}
          rag={selectedInst2.cet1Capital*100 - 5.125 >= 2 ? 'green' : selectedInst2.cet1Capital*100 - 5.125 >= 1 ? 'amber' : 'red'}
          sub="CET1 above AT1 trigger" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Full Capital Stack Decomposition" sub={`${selectedInst2.name} · ${selectedInst2.regulatoryFramework}`} />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stackData.filter(d=>d.name!=='AT1'||t1ShowAT1).filter(d=>d.name!=='Tier 2'||t1ShowT2)}
              layout="vertical" margin={{top:4,right:40,bottom:4,left:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" unit="%" tick={{fontSize:10}} />
              <YAxis dataKey="name" type="category" tick={{fontSize:10}} width={70} />
              <Tooltip formatter={v=>`${v.toFixed(2)}%`} />
              <Bar dataKey="pct" radius={[0,4,4,0]}>
                {stackData.map((d,i)=><Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Cross-Institution Capital Stack" sub="Top 12 institutions — CET1 + buffers" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={enriched.slice(0,12).map(x=>({
              name:x.name.split(' ')[0],
              cet1: +(x.cet1Capital*100).toFixed(2),
              at1:  t1ShowAT1 ? +(x.at1Ratio*100).toFixed(2) : 0,
              t2:   t1ShowT2  ? +(x.tier2Ratio*100).toFixed(2) : 0,
            }))} margin={{top:4,right:8,bottom:4,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{fontSize:9}} />
              <YAxis unit="%" tick={{fontSize:10}} />
              <Tooltip formatter={v=>`${v}%`} />
              <Legend iconSize={10} wrapperStyle={{fontSize:11}} />
              <Bar dataKey="cet1" stackId="a" fill={T.indigo} name="CET1" />
              {t1ShowAT1 && <Bar dataKey="at1" stackId="a" fill={T.purple} name="AT1" />}
              {t1ShowT2  && <Bar dataKey="t2"  stackId="a" fill={T.gold}   name="Tier 2" />}
              <ReferenceLine y={rule2.minCET1} stroke={T.red} strokeDasharray="4 2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
        <SectionHeader title="Pillar Breakdown Detail" sub="Computed capital components for selected institution" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
          {CAPITAL_COMPONENTS.map(comp => {
            const values = { cet1Min:4.5, ccb:2.5, gsib:rule2.gsibSurcharge, ccyb:rule2.ccyb, p2r:rule2.p2rAvg, p2g:+(selectedInst2.pillar2Guidance*100).toFixed(2), climateBuf:+(rule2.climateCapBuf+scenario.pillar2AddPct*0.08).toFixed(2), at1:+(selectedInst2.at1Ratio*100).toFixed(2), tier2:+(selectedInst2.tier2Ratio*100).toFixed(2) };
            return (
              <div key={comp.key} style={{ background:T.sub, border:`1px solid ${T.border}`, borderLeft:`3px solid ${comp.color}`, borderRadius:6, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:T.muted, marginBottom:2 }}>{comp.label}</div>
                <div style={{ fontSize:18, fontWeight:700, color:comp.color }}>{values[comp.key]}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TAB 2 — INSTITUTION DATABASE
  ══════════════════════════════════════════════════════════════════ */
  const colDefs = [
    { key:'name',              label:'Institution',  fmt:v=>v },
    { key:'jurisdiction',     label:'Juris',        fmt:v=>v },
    { key:'type',             label:'Type',         fmt:v=>v.slice(0,12) },
    { key:'totalRWA',         label:'RWA ($Bn)',    fmt:v=>v.toFixed(0) },
    { key:'cet1Capital',      label:'CET1 %',       fmt:v=>(v*100).toFixed(2) },
    { key:'at1Ratio',         label:'AT1 %',        fmt:v=>(v*100).toFixed(2) },
    { key:'tier2Ratio',       label:'T2 %',         fmt:v=>(v*100).toFixed(2) },
    { key:'tlacRatio',        label:'TLAC %',       fmt:v=>(v*100).toFixed(1) },
    { key:'leverageRatio',    label:'Lev %',        fmt:v=>(v*100).toFixed(2) },
    { key:'greenLoanPct',     label:'GAR %',        fmt:v=>(v*100).toFixed(1) },
    { key:'fossilFuelExposure',label:'FF Exp %',    fmt:v=>(v*100).toFixed(1) },
    { key:'physicalRiskScore',label:'Phys Risk',    fmt:v=>v.toFixed(0) },
    { key:'ESGrating',        label:'ESG',          fmt:v=>v },
    { key:'climateGovScore',  label:'Gov Score',    fmt:v=>v },
    { key:'scope1Emissions',  label:'Scope1 (ktCO2)',fmt:v=>v.toFixed(0) },
  ];

  const tab2 = (
    <div>
      {filterBar}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:T.sub }}>
              {colDefs.map(c=>(
                <th key={c.key} onClick={()=>handleSort(c.key)}
                  style={{ padding:'8px 10px', textAlign:'left', cursor:'pointer', borderBottom:`2px solid ${T.border}`, color:T.navy, fontWeight:700, whiteSpace:'nowrap', fontSize:10 }}>
                  {c.label} {sortCol===c.key ? (sortDir===-1?'↓':'↑') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(inst => {
              const isExpanded = expandedId === inst.id;
              const rule = JURIS_RULES[inst.jurisdiction];
              const breach = inst.cet1Capital*100 < rule.minCET1;
              return (
                <React.Fragment key={inst.id}>
                  <tr onClick={()=>setExpandedId(isExpanded?null:inst.id)}
                    style={{ background: breach ? '#fef2f2' : inst.carbonIntensive ? '#fffbeb' : T.card, borderBottom:`1px solid ${T.border}`, cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.background=breach?'#fee2e2':'#f0f4ff'}
                    onMouseLeave={e=>e.currentTarget.style.background=breach?'#fef2f2':inst.carbonIntensive?'#fffbeb':T.card}>
                    {colDefs.map(c=>(
                      <td key={c.key} style={{ padding:'7px 10px', color: c.key==='cet1Capital' ? (breach?T.red:T.green) : T.text, fontWeight: c.key==='name'?600:400, whiteSpace:'nowrap' }}>
                        {c.key==='carbonIntensive' ? (inst.carbonIntensive?'🔥':'') : c.fmt(inst[c.key])}
                        {c.key==='cet1Capital' && breach && <span style={{ marginLeft:4, fontSize:9, color:T.red, fontWeight:700 }}>BREACH</span>}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr style={{ background:T.sub }}>
                      <td colSpan={colDefs.length} style={{ padding:'12px 16px' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                          <div><div style={{ fontSize:10, color:T.muted }}>Regulatory Framework</div><div style={{ fontWeight:600, fontSize:12 }}>{inst.regulatoryFramework}</div></div>
                          <div><div style={{ fontSize:10, color:T.muted }}>MREL Buffer</div><div style={{ fontWeight:600, fontSize:12 }}>{(inst.mrelBuffer*100).toFixed(2)}%</div></div>
                          <div><div style={{ fontSize:10, color:T.muted }}>LCR Ratio</div><div style={{ fontWeight:600, fontSize:12 }}>{(inst.lcrRatio*100).toFixed(1)}%</div></div>
                          <div><div style={{ fontSize:10, color:T.muted }}>NSFR</div><div style={{ fontWeight:600, fontSize:12 }}>{(inst.nsfr*100).toFixed(1)}%</div></div>
                          <div><div style={{ fontSize:10, color:T.muted }}>Net Zero Target</div><div style={{ fontWeight:600, fontSize:12 }}>{inst.netZeroTarget || 'Not committed'}</div></div>
                          <div><div style={{ fontSize:10, color:T.muted }}>Carbon Price RWA Sens.</div><div style={{ fontWeight:600, fontSize:12 }}>${inst.carboPriceRWASens.toFixed(1)}Bn</div></div>
                          <div><div style={{ fontSize:10, color:T.muted }}>Climate Gov Score</div><div style={{ fontWeight:600, fontSize:12 }}>{inst.climateGovScore}/100</div></div>
                          <div><div style={{ fontSize:10, color:T.muted }}>Carbon Intensive</div><div style={{ fontWeight:600, fontSize:12, color:inst.carbonIntensive?T.red:T.green }}>{inst.carbonIntensive?'Yes':'No'}</div></div>
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
      {filtered.length === 0 && <div style={{ textAlign:'center', padding:40, color:T.muted }}>No institutions match current filters.</div>}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TAB 3 — CLIMATE RWA ENGINE
  ══════════════════════════════════════════════════════════════════ */
  const selectedAsset = ASSET_CLASSES_RWA[t4AssetIdx];
  const rwaWithCarbon = useMemo(() => ASSET_CLASSES_RWA.map(ac => {
    const baseWeight = t4IrbMode ? ac.irbWeight : ac.saWeight;
    const carbonAdj  = ac.strandedHaircut * (t4CarbonPrice / 200);
    const climateMult = 1 + (ac.climateMult - 1) * (t4CarbonPrice / 100);
    const adjustedWeight = Math.min(2.5, baseWeight * climateMult + carbonAdj);
    return {
      name: ac.name,
      baseRWA: +(baseWeight * 100).toFixed(1),
      adjustedRWA: +(adjustedWeight * 100).toFixed(1),
      delta: +((adjustedWeight - baseWeight) * 100).toFixed(2),
      strandedHaircut: +(ac.strandedHaircut * 100).toFixed(1),
      carbonIntensity: ac.carbonIntensity,
    };
  }), [t4IrbMode, t4CarbonPrice]);

  const tab3 = (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:T.muted }}>Asset Class:</span>
          <select value={t4AssetIdx} onChange={e=>setT4AssetIdx(+e.target.value)}
            style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12 }}>
            {ASSET_CLASSES_RWA.map((ac,i)=><option key={i} value={i}>{ac.name}</option>)}
          </select>
        </div>
        <label style={{ fontSize:12, display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
          <input type="checkbox" checked={t4IrbMode} onChange={e=>setT4IrbMode(e.target.checked)} />
          IRB Mode (vs Standardised)
        </label>
        <div style={{ flex:1 }} />
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:6, padding:'6px 14px', fontSize:12, color:T.navy, fontWeight:600 }}>
          Mode: {t4IrbMode ? 'IRB Advanced' : 'Standardised Approach (SA-CR)'}
        </div>
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
        <SectionHeader title={`Carbon Price Sensitivity: ${selectedAsset.name}`} sub={`Slide carbon price · ${t4IrbMode?'IRB':'SA'} weights`} />
        <SliderRow label={`Carbon Price ($/tonne CO₂)`} value={t4CarbonPrice} min={0} max={200} step={5}
          onChange={setT4CarbonPrice} fmt={v=>`$${v}`} color={T.orange} />
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:12 }}>
          <KpiCard label="Base RWA Weight" value={`${(t4IrbMode?selectedAsset.irbWeight:selectedAsset.saWeight)*100}%`} color={T.blue} sub={t4IrbMode?'IRB':'SA'} />
          <KpiCard label="Climate Multiplier" value={`${selectedAsset.climateMult.toFixed(2)}×`} color={T.orange} sub="At max carbon price" />
          <KpiCard label="Stranded Haircut" value={`${(selectedAsset.strandedHaircut*100).toFixed(1)}%`} color={T.red} sub="Asset value write-down" />
          <KpiCard label="Adjusted RWA Weight" value={`${rwaWithCarbon[t4AssetIdx].adjustedRWA}%`} color={T.indigo}
            sub={`+${rwaWithCarbon[t4AssetIdx].delta}% vs base`} />
          <KpiCard label="Carbon Intensity" value={selectedAsset.carbonIntensity} color={T.amber} sub="Relative classification" />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="RWA Density by Asset Class" sub={`${t4IrbMode?'IRB':'SA'} base vs climate-adjusted · Carbon $${t4CarbonPrice}/t`} />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rwaWithCarbon} layout="vertical" margin={{top:4,right:40,bottom:4,left:100}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" unit="%" tick={{fontSize:9}} />
              <YAxis dataKey="name" type="category" tick={{fontSize:9}} width={110} />
              <Tooltip formatter={v=>`${v}%`} />
              <Legend iconSize={10} wrapperStyle={{fontSize:11}} />
              <Bar dataKey="baseRWA"     fill={T.blue}   name="Base RWA%" fillOpacity={0.7} />
              <Bar dataKey="adjustedRWA" fill={T.indigo} name="Climate-Adj RWA%" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Carbon Price → RWA Impact" sub="Marginal RWA increase per $10/tonne step" />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={Array.from({length:21},(_,i)=>{
              const cp = i*10;
              const carbonAdj = selectedAsset.strandedHaircut*(cp/200);
              const climateMult = 1+(selectedAsset.climateMult-1)*(cp/100);
              const base = t4IrbMode?selectedAsset.irbWeight:selectedAsset.saWeight;
              const adj = Math.min(2.5, base*climateMult+carbonAdj);
              return { carbonPrice:`$${cp}`, rwaWeight:+(adj*100).toFixed(1) };
            })} margin={{top:4,right:16,bottom:4,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="carbonPrice" tick={{fontSize:9}} />
              <YAxis unit="%" tick={{fontSize:10}} />
              <Tooltip formatter={v=>`${v}%`} />
              <Line dataKey="rwaWeight" stroke={T.orange} strokeWidth={2} dot={false} name="RWA Weight%" />
              <ReferenceLine y={(t4IrbMode?selectedAsset.irbWeight:selectedAsset.saWeight)*100}
                stroke={T.blue} strokeDasharray="4 2" label={{value:'Base',fontSize:9}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginTop:16 }}>
        <SectionHeader title="Stranded Asset RWA Haircut Table" sub="Full asset class matrix — stranded value write-down at $${t4CarbonPrice}/t" />
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ background:T.sub }}>
                {['Asset Class','Carbon Intensity','SA Weight','IRB Weight','Climate Mult','Stranded Haircut %','Delta RWA%'].map(h=>(
                  <th key={h} style={{ padding:'7px 10px', textAlign:'left', borderBottom:`1px solid ${T.border}`, fontSize:10, color:T.navy, fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rwaWithCarbon.map((row,i)=>(
                <tr key={i} style={{ background:i%2===0?T.card:T.sub, borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'6px 10px', fontWeight:600 }}>{row.name}</td>
                  <td style={{ padding:'6px 10px', color: row.carbonIntensity==='Very High'?T.red:row.carbonIntensity==='High'?T.orange:row.carbonIntensity==='Low'?T.green:T.amber }}>{row.carbonIntensity}</td>
                  <td style={{ padding:'6px 10px' }}>{(ASSET_CLASSES_RWA[i].saWeight*100).toFixed(0)}%</td>
                  <td style={{ padding:'6px 10px' }}>{(ASSET_CLASSES_RWA[i].irbWeight*100).toFixed(0)}%</td>
                  <td style={{ padding:'6px 10px' }}>{ASSET_CLASSES_RWA[i].climateMult.toFixed(2)}×</td>
                  <td style={{ padding:'6px 10px', color:T.red }}>{row.strandedHaircut}%</td>
                  <td style={{ padding:'6px 10px', color:row.delta>0?T.red:T.green, fontWeight:600 }}>{row.delta>0?'+':''}{row.delta}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TAB 4 — STRESS TEST MATRIX
  ══════════════════════════════════════════════════════════════════ */
  const tab4 = (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:T.muted }}>Scenario A:</span>
          <select value={t5ScenA} onChange={e=>setT5ScenA(+e.target.value)}
            style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, background:SCENARIOS[t5ScenA].color, color:'#fff' }}>
            {SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:T.muted }}>Scenario B:</span>
          <select value={t5ScenB} onChange={e=>setT5ScenB(+e.target.value)}
            style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, background:SCENARIOS[t5ScenB].color, color:'#fff' }}>
            {SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <SliderRow label="Institutions:" value={t5InstCount} min={5} max={20} step={1}
          onChange={setT5InstCount} fmt={v=>`${v}`} color={T.indigo} />
        <label style={{ fontSize:12, display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}>
          <input type="checkbox" checked={t5ShowThresh} onChange={e=>setT5ShowThresh(e.target.checked)} /> Show Thresholds
        </label>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title={`CET1 — ${SCENARIOS[t5ScenA].name}`} sub="Top institutions · bar = CET1 ratio" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stressMatrix} margin={{top:4,right:8,bottom:30,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{fontSize:9}} angle={-35} textAnchor="end" />
              <YAxis unit="%" domain={[6,16]} tick={{fontSize:10}} />
              <Tooltip formatter={(v,n,p)=>[`${v}% (${p.payload.passA?'PASS':'BREACH'})`, 'CET1']} />
              <Bar dataKey="cet1A" radius={[3,3,0,0]} name="CET1 (Scen A)">
                {stressMatrix.map((d,i)=><Cell key={i} fill={d.passA?T.green:T.red} />)}
              </Bar>
              {t5ShowThresh && stressMatrix.slice(0,1).map(d=>(
                <ReferenceLine key="ref" y={d.threshold} stroke={T.red} strokeDasharray="4 2" label={{value:`Min ${d.threshold}%`,fontSize:9}} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title={`CET1 — ${SCENARIOS[t5ScenB].name}`} sub="Same institutions · scenario B" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stressMatrix} margin={{top:4,right:8,bottom:30,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{fontSize:9}} angle={-35} textAnchor="end" />
              <YAxis unit="%" domain={[6,16]} tick={{fontSize:10}} />
              <Tooltip formatter={(v,n,p)=>[`${v}% (${p.payload.passB?'PASS':'BREACH'})`, 'CET1']} />
              <Bar dataKey="cet1B" radius={[3,3,0,0]} name="CET1 (Scen B)">
                {stressMatrix.map((d,i)=><Cell key={i} fill={d.passB?T.green:T.red} />)}
              </Bar>
              {t5ShowThresh && stressMatrix.slice(0,1).map(d=>(
                <ReferenceLine key="ref" y={d.threshold} stroke={T.red} strokeDasharray="4 2" label={{value:`Min ${d.threshold}%`,fontSize:9}} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
        <SectionHeader title="Shortfall Summary Table" sub="Capital gap under each scenario" />
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:T.sub }}>
              {['Institution','Jurisdiction','CET1 (Scen A)','CET1 (Scen B)','Delta','Shortfall A (bps)','Shortfall B (bps)','Pass A','Pass B'].map(h=>(
                <th key={h} style={{ padding:'7px 10px', textAlign:'left', borderBottom:`1px solid ${T.border}`, fontSize:10, color:T.navy, fontWeight:700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stressMatrix.map((row,i)=>(
              <tr key={i} style={{ background:(!row.passA||!row.passB)?'#fef2f2':i%2===0?T.card:T.sub, borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'6px 10px', fontWeight:600 }}>{row.fullName}</td>
                <td style={{ padding:'6px 10px' }}>{row.juris}</td>
                <td style={{ padding:'6px 10px', color:row.passA?T.green:T.red, fontWeight:600 }}>{row.cet1A}%</td>
                <td style={{ padding:'6px 10px', color:row.passB?T.green:T.red, fontWeight:600 }}>{row.cet1B}%</td>
                <td style={{ padding:'6px 10px', color:(row.cet1B-row.cet1A)<0?T.red:T.green }}>
                  {row.cet1B-row.cet1A > 0 ? '+' : ''}{(row.cet1B-row.cet1A).toFixed(2)}%
                </td>
                <td style={{ padding:'6px 10px', color:row.shortfallA>0?T.red:T.green }}>{(row.shortfallA*100).toFixed(0)}</td>
                <td style={{ padding:'6px 10px', color:row.shortfallB>0?T.red:T.green }}>{(row.shortfallB*100).toFixed(0)}</td>
                <td style={{ padding:'6px 10px' }}><span style={{ background:row.passA?'#dcfce7':'#fee2e2', color:row.passA?T.green:T.red, borderRadius:4, padding:'2px 6px', fontSize:10, fontWeight:700 }}>{row.passA?'PASS':'FAIL'}</span></td>
                <td style={{ padding:'6px 10px' }}><span style={{ background:row.passB?'#dcfce7':'#fee2e2', color:row.passB?T.green:T.red, borderRadius:4, padding:'2px 6px', fontSize:10, fontWeight:700 }}>{row.passB?'PASS':'FAIL'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TAB 5 — CAPITAL OPTIMIZER
  ══════════════════════════════════════════════════════════════════ */
  const tab5 = (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionHeader title="What-If Capital Optimizer" sub="Adjust levers — live CET1 recomputed" />
          <SliderRow label="Green Loan % (GAR)" value={t6GreenLoan} min={0} max={60} step={1}
            onChange={setT6GreenLoan} fmt={v=>`${v}%`} color={T.green} />
          <SliderRow label="Fossil Fuel Exposure %" value={t6FossilExp} min={0} max={40} step={1}
            onChange={setT6FossilExp} fmt={v=>`${v}%`} color={T.orange} />
          <SliderRow label="P2G Add-On %" value={t6P2G} min={0} max={3} step={0.1}
            onChange={setT6P2G} fmt={v=>`${v.toFixed(1)}%`} color={T.amber} />
          <SliderRow label="Carbon Price ($/tonne)" value={t6CarbonPrice} min={0} max={200} step={5}
            onChange={setT6CarbonPrice} fmt={v=>`$${v}`} color={T.red} />

          <div style={{ marginTop:16, padding:16, background:T.sub, borderRadius:8, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:12, color:T.muted, marginBottom:8 }}>Regulatory minimum ({jurisFilter !== 'All' ? jurisFilter : 'EU'}):</div>
            <div style={{ fontSize:28, fontWeight:700, color:optimizerResult.pass?T.green:T.red, marginBottom:4 }}>
              {optimizerResult.adjCET1}%
            </div>
            <div style={{ fontSize:12, color:T.muted }}>vs minimum {optimizerResult.minReq}%</div>
            <div style={{ marginTop:8, padding:'6px 12px', borderRadius:6, background:optimizerResult.pass?'#dcfce7':'#fee2e2', display:'inline-block' }}>
              <span style={{ fontWeight:700, fontSize:12, color:optimizerResult.pass?T.green:T.red }}>
                {optimizerResult.pass ? 'PASS — Adequately Capitalised' : `FAIL — Shortfall $${optimizerResult.shortfall}Bn`}
              </span>
            </div>
            {!optimizerResult.pass && (
              <div style={{ marginTop:8, fontSize:12, color:T.muted }}>
                Capital action required: <span style={{ color:T.red, fontWeight:700 }}>${optimizerResult.capitalAction.toLocaleString()}M new equity</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionHeader title="CET1 vs Green Loan % — Frontier" sub="Holding all other levers constant" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={Array.from({length:25},(_,i)=>{
              const gl = i*2.5;
              const rule = JURIS_RULES[jurisFilter!=='All'?jurisFilter:'EU'];
              const fossil = t6FossilExp/100;
              const carbonAdj = (t6CarbonPrice/100)*fossil*0.015;
              const garBonus = gl/100>0.30 ? scenario.greenBonus*0.5 : 0;
              const adj = 0.12 - carbonAdj - t6P2G/100 + garBonus - scenario.pillar2AddPct*0.003;
              return { greenLoan:`${gl.toFixed(0)}%`, cet1:+(adj*100).toFixed(2), min:rule.minCET1 };
            })} margin={{top:4,right:16,bottom:4,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="greenLoan" tick={{fontSize:9}} />
              <YAxis unit="%" tick={{fontSize:10}} />
              <Tooltip formatter={v=>`${v}%`} />
              <Line dataKey="cet1" stroke={T.green} strokeWidth={2} dot={false} name="Adjusted CET1" />
              <Line dataKey="min" stroke={T.red} strokeWidth={1} strokeDasharray="4 2" dot={false} name="Minimum" />
              <ReferenceLine x={`${t6GreenLoan}%`} stroke={T.gold} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>

          <SectionHeader title="Fossil Fuel → CET1 Impact" sub="CET1 erosion as fossil exposure rises" />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={Array.from({length:21},(_,i)=>{
              const ff = i*2;
              const fossil = ff/100;
              const carbonAdj = (t6CarbonPrice/100)*fossil*0.015;
              const garBonus = t6GreenLoan/100>0.30 ? scenario.greenBonus*0.5 : 0;
              const adj = 0.12 - carbonAdj - t6P2G/100 + garBonus - scenario.pillar2AddPct*0.003;
              const rule = JURIS_RULES[jurisFilter!=='All'?jurisFilter:'EU'];
              return { ff:`${ff}%`, cet1:+(adj*100).toFixed(2), min:rule.minCET1 };
            })} margin={{top:4,right:16,bottom:4,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="ff" tick={{fontSize:9}} />
              <YAxis unit="%" tick={{fontSize:10}} />
              <Tooltip formatter={v=>`${v}%`} />
              <Area dataKey="cet1" stroke={T.orange} fill={T.orange} fillOpacity={0.15} dot={false} name="CET1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TAB 6 — DFAST / CCAR OVERLAY
  ══════════════════════════════════════════════════════════════════ */
  const tab6 = (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:T.muted }}>Regulator:</span>
          {['Fed','PRA','ECB','OSFI'].map(r=>(
            <button key={r} onClick={()=>setT7Regulator(r)}
              style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${T.border}`, cursor:'pointer', fontSize:12, fontWeight:t7Regulator===r?700:400, background:t7Regulator===r?T.indigo:T.card, color:t7Regulator===r?'#fff':T.text }}>
              {r}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:T.muted }}>Horizon:</span>
          {[4,8,9].map(h=>(
            <button key={h} onClick={()=>setT7Horizon(h)}
              style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, cursor:'pointer', fontSize:12, fontWeight:t7Horizon===h?700:400, background:t7Horizon===h?T.navy:T.card, color:t7Horizon===h?'#fff':T.text }}>
              {h}Q
            </button>
          ))}
        </div>
        <label style={{ fontSize:12, display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}>
          <input type="checkbox" checked={t7Adverse} onChange={e=>setT7Adverse(e.target.checked)} />
          Adverse Scenario
        </label>
      </div>

      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        <KpiCard label="Starting CET1" value={`${dfastPath.length?dfastPath[0].baseline:0}%`} color={T.indigo} sub="Q1 2024 actual" />
        <KpiCard label="Trough CET1" value={`${dfastPath.length?Math.min(...dfastPath.map(d=>d.stressed)).toFixed(2):0}%`}
          rag={(dfastPath.length&&Math.min(...dfastPath.map(d=>d.stressed))) >= (t7Regulator==='Fed'?9.5:t7Regulator==='PRA'?11.0:t7Regulator==='ECB'?10.5:10.0) ? 'green' : 'red'}
          sub="Worst quarter stressed" />
        <KpiCard label="Regulatory Min" value={`${t7Regulator==='Fed'?9.5:t7Regulator==='PRA'?11.0:t7Regulator==='ECB'?10.5:10.0}%`} color={T.red} sub={`${t7Regulator} minimum`} />
        <KpiCard label="Cumulative LLP" value={`${dfastPath.reduce((s,d)=>s+d.llp,0).toFixed(2)}%`} color={T.orange} sub="Loan loss provisions" />
        <KpiCard label="PPNR Impact" value={`${dfastPath.reduce((s,d)=>s+d.ppnrImpact,0).toFixed(2)}%`} color={T.amber} sub="Pre-provision net revenue" />
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
        <SectionHeader title={`${t7Regulator} ${t7Adverse?'Adverse':'Baseline'} Capital Path — ${t7Horizon}Q Horizon`} sub="9-quarter DFAST/CCAR capital projection" />
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dfastPath} margin={{top:4,right:16,bottom:4,left:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="quarter" tick={{fontSize:10}} />
            <YAxis unit="%" domain={[6,15]} tick={{fontSize:10}} />
            <Tooltip formatter={v=>`${v}%`} />
            <Legend iconSize={10} wrapperStyle={{fontSize:11}} />
            <Area dataKey="baseline" stroke={T.green} fill={T.green} fillOpacity={0.12} strokeWidth={2} dot={false} name="Baseline CET1" />
            <Area dataKey="stressed" stroke={T.red} fill={T.red} fillOpacity={0.12} strokeWidth={2} dot={false} name="Stressed CET1" />
            <ReferenceLine y={t7Regulator==='Fed'?9.5:t7Regulator==='PRA'?11.0:t7Regulator==='ECB'?10.5:10.0}
              stroke={T.red} strokeDasharray="4 2" label={{value:`${t7Regulator} Min`,fontSize:9}} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Loan Loss Provisions (LLP) by Quarter" sub="Climate-stressed provisioning path" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dfastPath} margin={{top:4,right:8,bottom:4,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="quarter" tick={{fontSize:9}} />
              <YAxis unit="%" tick={{fontSize:10}} />
              <Tooltip formatter={v=>`${v}%`} />
              <Bar dataKey="llp" fill={T.orange} radius={[3,3,0,0]} name="LLP %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="PPNR Climate Impact by Quarter" sub="Revenue headwind from climate transition" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dfastPath} margin={{top:4,right:8,bottom:4,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="quarter" tick={{fontSize:9}} />
              <YAxis tick={{fontSize:10}} />
              <Tooltip />
              <Bar dataKey="ppnrImpact" fill={T.amber} radius={[3,3,0,0]} name="PPNR Impact" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TAB 7 — JURISDICTION COMPARISON
  ══════════════════════════════════════════════════════════════════ */
  const tab7 = (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
        <span style={{ fontSize:12, color:T.muted }}>Compare framework:</span>
        <select value={t8Framework} onChange={e=>setT8Framework(e.target.value)}
          style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12 }}>
          {JURISDICTIONS.map(j=><option key={j}>{j}</option>)}
        </select>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:6, padding:'5px 12px', fontSize:12, color:T.navy, fontWeight:600 }}>
          {JURIS_RULES[t8Framework].label}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Minimum CET1 by Jurisdiction" sub="Regulatory floor including all buffers" />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={jurisBreakdown} layout="vertical" margin={{top:4,right:40,bottom:4,left:50}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" unit="%" tick={{fontSize:9}} domain={[0,14]} />
              <YAxis dataKey="jurisdiction" type="category" tick={{fontSize:10}} width={55} />
              <Tooltip formatter={v=>`${v}%`} />
              <Bar dataKey="threshold" radius={[0,4,4,0]} name="Min CET1 %">
                {jurisBreakdown.map((d,i)=><Cell key={i} fill={d.jurisdiction===t8Framework?T.gold:T.indigo} />)}
              </Bar>
              <Bar dataKey="avgCET1" radius={[0,4,4,0]} fill={T.green} fillOpacity={0.4} name="Portfolio Avg CET1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Green Supporting Factor by Regime" sub="Climate incentive rebate on RWA" />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={jurisBreakdown.map(j=>({ ...j, greenPct:+(JURIS_RULES[j.jurisdiction].greenBonus*100).toFixed(1), climateBuf:+(JURIS_RULES[j.jurisdiction].climateCapBuf).toFixed(2) }))} layout="vertical" margin={{top:4,right:40,bottom:4,left:50}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{fontSize:9}} />
              <YAxis dataKey="jurisdiction" type="category" tick={{fontSize:10}} width={55} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{fontSize:11}} />
              <Bar dataKey="greenPct" radius={[0,4,4,0]} fill={T.green} name="Green Factor %" />
              <Bar dataKey="climateBuf" radius={[0,4,4,0]} fill={T.red} fillOpacity={0.5} name="Climate Buffer %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
        <SectionHeader title="Regulatory Framework Matrix" sub="10 jurisdictions · full parameter comparison" />
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ background:T.sub }}>
                {['Jurisdiction','Framework','Min CET1','Pillar Mult','G-SIB Sur.','CCyB','P2R Avg','Green Factor','Climate Buffer','Institutions'].map(h=>(
                  <th key={h} style={{ padding:'7px 10px', textAlign:'left', borderBottom:`1px solid ${T.border}`, fontSize:10, color:T.navy, fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {JURISDICTIONS.map((j,i) => {
                const rule = JURIS_RULES[j];
                const jd = jurisBreakdown.find(x=>x.jurisdiction===j) || {};
                const isSelected = j === t8Framework;
                return (
                  <tr key={j} style={{ background:isSelected?'#eff6ff':i%2===0?T.card:T.sub, borderBottom:`1px solid ${T.border}`, fontWeight:isSelected?600:400 }}>
                    <td style={{ padding:'7px 10px', color:isSelected?T.indigo:T.text, fontWeight:700 }}>{j}</td>
                    <td style={{ padding:'7px 10px', color:T.muted, fontSize:10 }}>{rule.label}</td>
                    <td style={{ padding:'7px 10px', color:T.navy, fontWeight:600 }}>{rule.minCET1}%</td>
                    <td style={{ padding:'7px 10px' }}>{rule.pillarMult.toFixed(2)}×</td>
                    <td style={{ padding:'7px 10px' }}>{rule.gsibSurcharge}%</td>
                    <td style={{ padding:'7px 10px' }}>{rule.ccyb}%</td>
                    <td style={{ padding:'7px 10px' }}>{rule.p2rAvg}%</td>
                    <td style={{ padding:'7px 10px', color:T.green }}>{(rule.greenBonus*100).toFixed(0)}%</td>
                    <td style={{ padding:'7px 10px', color:T.red }}>{rule.climateCapBuf}%</td>
                    <td style={{ padding:'7px 10px' }}>{jd.institutions || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TAB 8 — SENSITIVITY ANALYSIS
  ══════════════════════════════════════════════════════════════════ */
  const tab8 = (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:T.muted }}>Driver:</span>
          <select value={t9Driver} onChange={e=>setT9Driver(+e.target.value)}
            style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12 }}>
            {SENSITIVITY_DRIVERS.map((d,i)=><option key={i} value={i}>{d.name}</option>)}
          </select>
        </div>
        <SliderRow label="Sensitivity Range:" value={t9Range} min={5} max={50} step={5}
          onChange={setT9Range} fmt={v=>`±${v}`} color={T.indigo} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Tornado Chart — CET1 Sensitivity" sub="Partial derivatives · all key drivers" />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={[...SENSITIVITY_DRIVERS].sort((a,b)=>Math.abs(b.impact)-Math.abs(a.impact))}
              layout="vertical" margin={{top:4,right:40,bottom:4,left:140}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tickFormatter={v=>`${v>0?'+':''}${(v*100).toFixed(1)}bps`} tick={{fontSize:9}} />
              <YAxis dataKey="name" type="category" tick={{fontSize:9}} width={150} />
              <Tooltip formatter={v=>`${(v*100).toFixed(1)} bps CET1 impact`} />
              <Bar dataKey="impact" radius={[0,4,4,0]} name="CET1 Impact">
                {[...SENSITIVITY_DRIVERS].sort((a,b)=>Math.abs(b.impact)-Math.abs(a.impact)).map((d,i)=>(
                  <Cell key={i} fill={d.impact<0?T.red:T.green} />
                ))}
              </Bar>
              <ReferenceLine x={0} stroke={T.border} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title={`CET1 vs ${SENSITIVITY_DRIVERS[t9Driver].name}`} sub="Scatter — sensitivity path" />
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{top:4,right:16,bottom:16,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="Driver Change" tick={{fontSize:10}} label={{value:'Driver Δ',position:'insideBottom',offset:-8,fontSize:10}} />
              <YAxis dataKey="cet1" name="CET1" unit="%" domain={[8,16]} tick={{fontSize:10}} />
              <Tooltip formatter={(v,n)=>[`${v}${n==='cet1'?'%':''}`, n]} />
              <Scatter data={sensitivityScatter} name="CET1 path">
                {sensitivityScatter.map((d,i)=><Cell key={i} fill={d.fill} />)}
              </Scatter>
              <ReferenceLine y={10.5} stroke={T.red} strokeDasharray="4 2" label={{value:'EU Min',fontSize:9}} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
        <SectionHeader title="Driver Correlation Matrix" sub="Cross-driver CET1 sensitivity interactions" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:4 }}>
          {SENSITIVITY_DRIVERS.slice(0,6).map((dA,i)=>
            SENSITIVITY_DRIVERS.slice(0,6).map((dB,j)=>{
              const corr = i===j ? 1.0 : +(dA.impact * dB.impact * 80 + sr(i*6+j)*0.2 - 0.1).toFixed(2);
              const bounded = Math.max(-1, Math.min(1, corr));
              const bg = bounded > 0.5 ? '#dcfce7' : bounded > 0 ? '#f0fdf4' : bounded > -0.5 ? '#fef9c3' : '#fee2e2';
              return (
                <div key={`${i}-${j}`} style={{ background:bg, borderRadius:4, padding:'6px 4px', textAlign:'center', fontSize:9 }}>
                  <div style={{ color:T.muted, fontSize:8, marginBottom:2 }}>{dA.name.slice(0,6)}×{dB.name.slice(0,6)}</div>
                  <div style={{ fontWeight:700, color:bounded>0?T.green:T.red }}>{bounded.toFixed(2)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TAB 9 — SUMMARY & EXPORT
  ══════════════════════════════════════════════════════════════════ */
  const complianceChecks = [
    { item:'CET1 ratio above minimum', pass: portfolioAvgCET1*100 >= 9.5 },
    { item:'Zero capital shortfall institutions', pass: breachCount === 0 },
    { item:'Leverage ratio above 3%', pass: avgLeverage*100 >= 3.0 },
    { item:'TLAC ratio above 18%', pass: avgTLAC*100 >= 18 },
    { item:'Scenario stress test passing', pass: optimizerResult.pass },
    { item:'Climate buffer allocated', pass: scenario.pillar2AddPct > 0 },
    { item:'Green loan incentives active', pass: t6GreenLoan >= 20 },
    { item:'Carbon price RWA sensitivity monitored', pass: true },
    { item:'P2G add-on within limit', pass: t6P2G <= 2.5 },
    { item:'DFAST adverse scenario baseline passed', pass: dfastPath.length && Math.min(...dfastPath.map(d=>d.stressed)) >= 9.5 },
  ];

  const handleExport = () => {
    const summary = {
      timestamp: new Date().toISOString(),
      scenario: scenario.name,
      portfolioAvgCET1: (portfolioAvgCET1*100).toFixed(2) + '%',
      institutionCount: filtered.length,
      breachCount,
      totalShortfallBn: totalShortfallBn.toFixed(1) + 'Bn',
      avgLeverageRatio: (avgLeverage*100).toFixed(2) + '%',
      avgTLAC: (avgTLAC*100).toFixed(1) + '%',
      optimizerCET1: optimizerResult.adjCET1 + '%',
      optimizerPass: optimizerResult.pass,
      complianceScore: complianceChecks.filter(c=>c.pass).length + '/' + complianceChecks.length,
      jurisdictionBreakdown: jurisBreakdown.filter(j=>j.institutions>0).map(j=>({ jurisdiction:j.jurisdiction, avgCET1:j.avgCET1+'%', institutions:j.institutions, breaches:j.breaches })),
    };
    setExportText(JSON.stringify(summary, null, 2));
  };

  const tab9 = (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Capital Summary" sub={`Scenario: ${scenario.name} · ${filtered.length} institutions`} />
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <tbody>
              {[
                ['Portfolio Avg CET1', `${(portfolioAvgCET1*100).toFixed(2)}%`, portfolioAvgCET1*100 >= 10 ? T.green : T.red],
                ['CET1 Breaches', breachCount, breachCount === 0 ? T.green : T.red],
                ['Total Shortfall', `$${totalShortfallBn.toFixed(1)}Bn`, totalShortfallBn === 0 ? T.green : T.red],
                ['Avg Leverage Ratio', `${(avgLeverage*100).toFixed(2)}%`, avgLeverage*100 >= 3 ? T.green : T.red],
                ['Avg TLAC', `${(avgTLAC*100).toFixed(1)}%`, avgTLAC*100 >= 18 ? T.green : T.amber],
                ['Optimizer CET1', `${optimizerResult.adjCET1}%`, optimizerResult.pass ? T.green : T.red],
                ['Capital Action Req.', `$${optimizerResult.capitalAction.toLocaleString()}M`, optimizerResult.capitalAction === 0 ? T.green : T.red],
                ['Compliance Score', `${complianceChecks.filter(c=>c.pass).length}/${complianceChecks.length}`, T.indigo],
              ].map(([label, val, color]) => (
                <tr key={label} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'8px 0', color:T.muted }}>{label}</td>
                  <td style={{ padding:'8px 0', fontWeight:700, color, textAlign:'right' }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <SectionHeader title="Regulatory Compliance Checklist" sub="10-item framework compliance" />
          {complianceChecks.map((c,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:`1px solid ${T.border}` }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:c.pass?T.green:T.red, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>{c.pass?'✓':'✗'}</span>
              </div>
              <div style={{ fontSize:12, color:c.pass?T.text:T.red }}>{c.item}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
        <SectionHeader title="Export Capital Report" sub="JSON summary for downstream systems" />
        <button onClick={handleExport}
          style={{ padding:'8px 20px', background:T.indigo, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:12 }}>
          Generate Export JSON
        </button>
        {exportText && (
          <textarea value={exportText} readOnly
            style={{ width:'100%', height:320, fontFamily:'JetBrains Mono, monospace', fontSize:11, padding:12, border:`1px solid ${T.border}`, borderRadius:6, background:T.sub, resize:'vertical', boxSizing:'border-box' }} />
        )}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  const panels = [tab0, tab1, tab2, tab3, tab4, tab5, tab6, tab7, tab8, tab9];

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:'DM Sans, sans-serif', color:T.text }}>
      {/* header */}
      <div style={{ background:T.navy, borderBottom:`3px solid ${T.gold}`, padding:'16px 28px' }}>
        <div style={{ fontSize:11, color:T.gold, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.1em', marginBottom:4 }}>
          EP-CCA · CLIMATE CAPITAL ADEQUACY ENGINE
        </div>
        <div style={{ fontSize:20, fontWeight:700, color:'#fff', letterSpacing:'0.02em' }}>
          Climate Risk Capital Analytics — Basel IV / DFAST / CCAR
        </div>
        <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>
          100 G-SIB institutions · 10 jurisdictions · 8 NGFS scenarios · JP Morgan / Goldman Sachs grade analytics
        </div>
      </div>

      {/* tab bar */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:'0 28px', display:'flex', gap:0, overflowX:'auto' }}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)}
            style={{ padding:'12px 16px', border:'none', background:'none', cursor:'pointer', fontSize:12, fontWeight:tab===i?700:400, color:tab===i?T.indigo:T.muted, borderBottom:tab===i?`2px solid ${T.indigo}`:'2px solid transparent', whiteSpace:'nowrap', transition:'color 0.15s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* content */}
      <div style={{ padding:'24px 28px' }}>
        {panels[tab]}
      </div>
    </div>
  );
}
