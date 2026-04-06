import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, ScatterChart, Scatter, ZAxis, Cell,
  AreaChart, Area, ReferenceLine, PieChart, Pie,
} from 'recharts';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';

/* ── theme ──────────────────────────────────────────────────────── */
const T = {
  navy:'#1b3a5c', navyD:'#122a44', gold:'#c5a96a', goldD:'#a8903a',
  cream:'#f7f4ef', surface:'#ffffff', border:'#e5e0d8', borderL:'#d5cfc5',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  sage:'#5a8a6a', sageL:'#7ba67d',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  teal:'#0f766e', purple:'#6d28d9', emerald:'#059669',
  font:"'DM Sans',system-ui,sans-serif",
  mono:"'JetBrains Mono','Fira Code',monospace",
  card:'0 1px 3px rgba(27,58,92,0.06)',
};
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : n;
const fmtK = (n) => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : fmt(n);
const TIP = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:4, color:T.text, fontSize:11, fontFamily:T.mono };

/* ── primitives ─────────────────────────────────────────────────── */
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display:'flex', gap:2, borderBottom:`2px solid ${T.border}`, marginBottom:20, flexWrap:'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding:'9px 14px', fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
        background:'transparent', color: active===t ? T.navy : T.textMut,
        borderBottom: active===t ? `2px solid ${T.gold}` : '2px solid transparent',
        marginBottom:-2, fontFamily:T.font, transition:'all 0.15s',
      }}>{t}</button>
    ))}
  </div>
);
const Kpi = ({ label, value, sub, color, accent }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:'14px 16px', borderBottom:`3px solid ${accent||T.gold}`, boxShadow:T.card }}>
    <div style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy, fontFamily:T.mono, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </div>
);
const Section = ({ title, children, right }) => (
  <div style={{ marginBottom:24 }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <span style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:'uppercase', letterSpacing:'0.1em' }}>{title}</span>
      {right && <span style={{ fontSize:10, color:T.textMut, fontFamily:T.mono }}>{right}</span>}
    </div>
    {children}
  </div>
);
const Badge = ({ v, colors }) => {
  const map = colors || { High:'#dc2626', Medium:'#d97706', Low:'#16a34a', Critical:'#7c3aed', Verified:'#059669', Draft:'#6b7280' };
  const bg = map[v] || T.textMut;
  return <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10, background:`${bg}18`, color:bg, fontFamily:T.mono, letterSpacing:'0.05em' }}>{v}</span>;
};
const Card = ({ children, style, border }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:16, boxShadow:T.card, ...(border ? { borderLeft:`4px solid ${border}` } : {}), ...style }}>{children}</div>
);
/* ── Dual range+number input ── */
const DualInput = ({ label, value, min=0, max=100, step=1, onChange, color, unit='' }) => (
  <div style={{ marginBottom:6 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
      <span style={{ fontSize:9, color:T.textMut, lineHeight:1.2 }}>{label}</span>
      <span style={{ fontSize:10, fontFamily:T.mono, fontWeight:600, color:color||T.navy }}>{typeof value==='number'?value.toLocaleString():value}{unit}</span>
    </div>
    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ flex:1, accentColor:color||T.teal, height:4, cursor:'pointer' }} />
      <input type="number" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Math.min(max,Math.max(min,+e.target.value||0)))}
        style={{ width:60, padding:'3px 5px', border:`1px solid ${T.border}`, borderRadius:3, fontSize:10, fontFamily:T.mono, color:T.navy, background:T.cream, outline:'none', textAlign:'right' }} />
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   DATA — PILLARS · STANDARDS · METHODOLOGY CONFIGS
   ══════════════════════════════════════════════════════════════════ */
const PILLARS = [
  { id:'EP', name:'Ecological Preservation', abbr:'EP', weight:0.28, color:'#16a34a',
    desc:'Forest, soil, water and biodiversity conservation baselines and additionality standards',
    keys:['canopy','biodiversity','soilCarbon','hydrology','fireRisk'],
    labels:['Canopy Cover','Biodiversity Integrity','Soil Carbon Flux','Hydro Connectivity','Fire Risk Adj.'],
    subWeights:[0.30,0.25,0.20,0.15,0.10],
  },
  { id:'CO', name:'Community Outcomes', abbr:'CO', weight:0.24, color:'#0f766e',
    desc:'FPIC compliance, livelihood co-benefits, gender equity and indigenous rights protection',
    keys:['fpic','livelihood','gender','indigenous','revShare'],
    labels:['FPIC Compliance','Livelihood Enhancement','Gender Equity','Indigenous Rights','Revenue Share'],
    subWeights:[0.30,0.25,0.20,0.15,0.10],
  },
  { id:'AC', name:'Additionality & Causality', abbr:'AC', weight:0.22, color:'#1b3a5c',
    desc:'Financial additionality, leakage accounting, counterfactual robustness and causal attribution',
    keys:['additionality','leakageScore','counterfactual','causality','marketAbsence'],
    labels:['Financial Additionality','Leakage Assessment','Counterfactual','Activity Causality','Market Absence'],
    subWeights:[0.30,0.25,0.20,0.15,0.10],
  },
  { id:'PM', name:'Permanence & Risk Buffer', abbr:'PM', weight:0.16, color:'#b45309',
    desc:'Reversal risk quantification, buffer pool adequacy and long-term monitoring commitments',
    keys:['reversal','bufferScore','monitoring','legalProtection','nonPermanence'],
    labels:['Reversal Risk','Buffer Adequacy','Monitoring Commit','Legal Protection','Non-Permanence'],
    subWeights:[0.25,0.25,0.20,0.15,0.15],
  },
  { id:'MV', name:'MRV & Data Quality', abbr:'MV', weight:0.10, color:'#6d28d9',
    desc:'Measurement, reporting and verification protocols, satellite verification and data lineage',
    keys:['satellite','groundTruth','audit','lineage','uncertainty'],
    labels:['Satellite Verification','Ground-Truth Freq','Third-Party Audit','Data Lineage','Uncertainty Range'],
    subWeights:[0.30,0.25,0.20,0.15,0.10],
  },
];

/* ── All pillar input key defaults ── */
const ALL_KEYS = {};
PILLARS.forEach(p => p.keys.forEach(k => { ALL_KEYS[k] = 70; }));

const STANDARDS = [
  { id:'EE-NF', name:'EE Native Forests', version:'3.2', category:'REDD+', status:'Certified',
    coverage:'Tropical / Subtropical', baseline_method:'VCS JNR + Dynamic Global Baseline',
    additionality:'Performance+Financial+Activity', permanence:'AFOLU Buffer (40yr)', mrv:'Satellite+Ground',
    score:91, creditsIssued:'4.2M tCO₂e', avgPrice:18.40, cobenefits:['FPIC','Water','Biodiversity','Gender'],
    yearsActive:7, jurisdictions:14,
    // Methodology-specific calc params
    baselineRate:18.5, projectRate:2.1, defaultLeakage:10, defaultBuffer:15,
    permanenceYrs:40, defaultArea:50000, defaultCreditingPeriod:30,
    activityTypes:['Avoided Planned Deforestation','Avoided Unplanned Deforestation','Forest Degradation'],
    uncertaintyBase:8, cobenefitMultiplier:1.12,
  },
  { id:'EE-AR', name:'EE Agroforestry & Reforestation', version:'2.1', category:'A/R', status:'Certified',
    coverage:'Degraded Agricultural Land', baseline_method:'VCS BL-CUR × Biomass Growth Factors',
    additionality:'Financial+Activity', permanence:'Buffer (25yr)', mrv:'Drone+Satellite',
    score:84, creditsIssued:'1.8M tCO₂e', avgPrice:22.10, cobenefits:['FPIC','Livelihoods','Food Security'],
    yearsActive:5, jurisdictions:8,
    baselineRate:3.2, projectRate:-8.5, defaultLeakage:8, defaultBuffer:20,
    permanenceYrs:25, defaultArea:15000, defaultCreditingPeriod:25,
    activityTypes:['Agroforestry Establishment','Native Species Reforestation','Silvopasture'],
    uncertaintyBase:12, cobenefitMultiplier:1.08,
  },
  { id:'EE-BS', name:'EE Blue Carbon – Seagrass', version:'1.4', category:'Blue Carbon', status:'Draft',
    coverage:'Coastal Seagrass Meadows', baseline_method:'EE Proprietary Tidal Model v2',
    additionality:'Activity+Financial', permanence:'Tidal Permanence Buffer (30yr)', mrv:'AUV+Satellite',
    score:76, creditsIssued:'0.3M tCO₂e', avgPrice:35.00, cobenefits:['Marine Biodiversity','Coastal Protection','Fisheries'],
    yearsActive:2, jurisdictions:4,
    baselineRate:6.8, projectRate:0.4, defaultLeakage:5, defaultBuffer:25,
    permanenceYrs:30, defaultArea:3000, defaultCreditingPeriod:20,
    activityTypes:['Seagrass Restoration','Seagrass Conservation','Tidal Marsh'],
    uncertaintyBase:18, cobenefitMultiplier:1.15,
  },
  { id:'EE-PM', name:'EE Peatland Mosaic', version:'2.3', category:'Peatland', status:'Certified',
    coverage:'Tropical Peatswamp Forests', baseline_method:'IPCC Tier 3 + Emissions Factor Library',
    additionality:'Financial+Activity+Barrier', permanence:'Buffer+Legal (50yr)', mrv:'LiDAR+Ground',
    score:88, creditsIssued:'2.1M tCO₂e', avgPrice:28.50, cobenefits:['FPIC','Biodiversity','Water Regulation'],
    yearsActive:6, jurisdictions:6,
    baselineRate:55.0, projectRate:5.2, defaultLeakage:12, defaultBuffer:18,
    permanenceYrs:50, defaultArea:25000, defaultCreditingPeriod:30,
    activityTypes:['Peat Rewetting','Paludiculture','Peatland Conservation'],
    uncertaintyBase:10, cobenefitMultiplier:1.10,
  },
  { id:'EE-SC', name:'EE Soil Carbon – Grasslands', version:'1.1', category:'Soil Carbon', status:'Draft',
    coverage:'Temperate & Semi-Arid Grasslands', baseline_method:'EE Tier 2 Soil Organic Carbon Model',
    additionality:'Activity+Financial', permanence:'Sampling-Buffer (15yr)', mrv:'Isotope+Remote Sensing',
    score:68, creditsIssued:'0.1M tCO₂e', avgPrice:15.20, cobenefits:['Livelihoods','Food Security'],
    yearsActive:1, jurisdictions:3,
    baselineRate:1.2, projectRate:-2.8, defaultLeakage:6, defaultBuffer:22,
    permanenceYrs:15, defaultArea:8000, defaultCreditingPeriod:15,
    activityTypes:['Regenerative Grazing','No-Till Conversion','Cover Cropping'],
    uncertaintyBase:20, cobenefitMultiplier:1.05,
  },
  { id:'EE-MC', name:'EE Mangrove Complex', version:'2.8', category:'Blue Carbon', status:'Certified',
    coverage:'Estuarine Mangrove Systems', baseline_method:'VM0033 + EE Salinity Adjustment Factor',
    additionality:'Activity+Financial', permanence:'Blue Carbon Buffer (35yr)', mrv:'Satellite+Field',
    score:86, creditsIssued:'1.5M tCO₂e', avgPrice:31.00, cobenefits:['FPIC','Fisheries','Storm Surge'],
    yearsActive:5, jurisdictions:9,
    baselineRate:22.4, projectRate:1.8, defaultLeakage:7, defaultBuffer:20,
    permanenceYrs:35, defaultArea:8000, defaultCreditingPeriod:25,
    activityTypes:['Mangrove Conservation','Mangrove Restoration','Mangrove Agroforestry'],
    uncertaintyBase:14, cobenefitMultiplier:1.13,
  },
];

/* ── Calculation Engine ── */
const calcPillarScores = (inputs) => {
  const scores = {};
  PILLARS.forEach(p => {
    let s = 0;
    p.keys.forEach((k, i) => { s += (inputs[k] || 0) * p.subWeights[i]; });
    scores[p.id] = Math.min(100, Math.max(0, s));
  });
  const overall = PILLARS.reduce((s, p) => s + (scores[p.id] || 0) * p.weight, 0);
  const tier = overall >= 85 ? 'Gold' : overall >= 70 ? 'Silver' : overall >= 55 ? 'Bronze' : 'Ineligible';
  return { scores, overall: Math.round(overall * 10) / 10, tier };
};

const calcCredits = (params, pillarResult) => {
  const { area, creditingPeriod, baselineRate, projectRate, leakagePct, bufferPct, uncertaintyPct, cobenefitMult } = params;
  const netRate = Math.max(0, baselineRate - projectRate); // projects exceeding baseline yield 0 credits, not phantom positive credits
  const grossAnnual = netRate * area;
  const grossTotal = grossAnnual * creditingPeriod;
  const leakageDeduction = grossTotal * (leakagePct / 100);
  const afterLeakage = grossTotal - leakageDeduction;
  const bufferDeduction = afterLeakage * (bufferPct / 100);
  const afterBuffer = afterLeakage - bufferDeduction;
  const uncertaintyDeduction = afterBuffer * (uncertaintyPct / 100);
  const netCredits = Math.max(0, afterBuffer - uncertaintyDeduction);
  const qualityMultiplier = pillarResult.overall / 100;
  const adjustedCredits = Math.round(netCredits * qualityMultiplier);
  const cobCredits = Math.round(adjustedCredits * cobenefitMult);
  return { grossAnnual: Math.round(grossAnnual), grossTotal: Math.round(grossTotal), leakageDeduction: Math.round(leakageDeduction), bufferDeduction: Math.round(bufferDeduction), uncertaintyDeduction: Math.round(uncertaintyDeduction), netCredits: Math.round(netCredits), qualityMultiplier, adjustedCredits, cobCredits };
};

/* ── Sample projects ── */
const PROJECTS = Array.from({ length: 16 }, (_, i) => {
  const mIdx = i % STANDARDS.length;
  const std = STANDARDS[mIdx];
  const base = std.score + (sr(i * 13) - 0.5) * 20;
  const mk = (seed) => Math.min(100, Math.max(30, Math.round(base + sr(seed) * 15)));
  const subs = {};
  PILLARS.forEach((p, pi) => p.keys.forEach((k, ki) => { subs[k] = mk(i * 100 + pi * 10 + ki); }));
  const ps = calcPillarScores(subs);
  const countries = ['Brazil','Indonesia','Cambodia','Peru','Kenya','DRC','Colombia','Malaysia','Laos','Papua NG','Bolivia','Honduras','Cameroon','Myanmar','Ecuador','Gabon'];
  const names = ['Amazon Mosaic Reserve','Kalimantan Peatland Complex','Mekong Floodplain Forest','Madre de Dios NF Buffer','Mt. Kenya Watershed','Congo Basin REDD+','Chocó Rainforest Corridor','Borneo Orangutan Habitat','Nam Et-Phou Louey','Sepik Lowland Forests','Madidi-Tambopata Corridor','Mesoamerican Barrier Reef','Dja-Odzala Corridor','Ayeyarwady Delta','Napo Headwaters','Lopé-Waka Mosaic'];
  return {
    id: `EE-PRJ-${String(i + 1).padStart(3, '0')}`, name: names[i], country: countries[i],
    methodology: std.id, methodName: std.name, category: std.category,
    ...ps.scores, overall: ps.overall, tier: ps.tier,
    subs,
    area_ha: Math.round(5000 + sr(i * 17) * 95000),
    credits_issued: Math.round(100000 + sr(i * 19) * 900000),
    avg_price: Math.round((std.avgPrice + (sr(i * 23) - 0.5) * 8) * 10) / 10,
    vintage: 2020 + (i % 4),
    status: i % 5 === 3 ? 'Under Review' : i === 14 ? 'Draft' : 'Active',
    fpic: sr(i * 29) > 0.3 ? 'Compliant' : 'Partial',
  };
});

/* ── Time series ── */
const TIME_SERIES = Array.from({ length: 10 }, (_, y) => ({
  year: 2015 + y,
  'EE-NF': Math.round(72 + y * 2.1 + sr(y * 3) * 6),
  'EE-AR': Math.round(68 + y * 1.8 + sr(y * 5) * 5),
  'EE-PM': Math.round(75 + y * 1.9 + sr(y * 7) * 4),
  'EE-MC': Math.round(70 + y * 2.3 + sr(y * 11) * 5),
  'EE-BS': y >= 7 ? Math.round(62 + (y - 7) * 4.2 + sr(y * 9) * 6) : null,
}));

const TIER_COLORS = { Gold:'#c5a96a', Silver:'#9ca3af', Bronze:'#cd7f32', Ineligible:'#dc2626' };

/* ══════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function EquitableEarthMethodologiesPage() {
  const TABS = ['Methodology Overview', 'Standard Comparison', 'Credit Calculator', 'Sensitivity & Scenarios', 'Project Scoring', 'Credit Integrity'];
  const [tab, setTab] = useState(TABS[0]);
  const [selectedStd, setSelectedStd] = useState(STANDARDS[0]);

  /* ── Credit Calculator State ── */
  const [calcMethod, setCalcMethod] = useState(STANDARDS[0]);
  const [calcInputs, setCalcInputs] = useState(() => {
    const s = STANDARDS[0];
    return { ...ALL_KEYS, canopy:80, biodiversity:72, soilCarbon:68, hydrology:75, fireRisk:65, fpic:88, livelihood:78, gender:72, indigenous:85, revShare:70, additionality:82, leakageScore:74, counterfactual:79, causality:76, marketAbsence:72, reversal:70, bufferScore:78, monitoring:82, legalProtection:75, nonPermanence:68, satellite:85, groundTruth:74, audit:80, lineage:76, uncertainty:70 };
  });
  const [calcParams, setCalcParams] = useState(() => {
    const s = STANDARDS[0];
    return { area: s.defaultArea, creditingPeriod: s.defaultCreditingPeriod, baselineRate: s.baselineRate, projectRate: s.projectRate, leakagePct: s.defaultLeakage, bufferPct: s.defaultBuffer, uncertaintyPct: s.uncertaintyBase, cobenefitMult: s.cobenefitMultiplier, activityType: s.activityTypes[0] };
  });

  const ccData = useCarbonCredit(); const ccEE = ccData.adaptForEquitableEarth();

  const pillarResult = useMemo(() => calcPillarScores(calcInputs), [calcInputs]);
  const creditResult = useMemo(() => calcCredits(calcParams, pillarResult), [calcParams, pillarResult]);

  /* ── Wire EE scores back to CC context ── */
  useEffect(() => {
    if (pillarResult) ccData.setEeScores({ latest: pillarResult });
  }, [pillarResult]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Sensitivity State ── */
  const [savedScenarios, setSavedScenarios] = useState([]);

  /* ── Project Scoring State ── */
  const [expandedProject, setExpandedProject] = useState(null);
  const [tierFilter, setTierFilter] = useState('All');

  /* ── Load methodology defaults ── */
  const loadMethodology = useCallback((std) => {
    setCalcMethod(std);
    setCalcParams({ area: std.defaultArea, creditingPeriod: std.defaultCreditingPeriod, baselineRate: std.baselineRate, projectRate: std.projectRate, leakagePct: std.defaultLeakage, bufferPct: std.defaultBuffer, uncertaintyPct: std.uncertaintyBase, cobenefitMult: std.cobenefitMultiplier, activityType: std.activityTypes[0] });
  }, []);

  /* ── Load project into calculator ── */
  const loadProject = useCallback((proj) => {
    const std = STANDARDS.find(s => s.id === proj.methodology) || STANDARDS[0];
    setCalcMethod(std);
    setCalcInputs(prev => ({ ...prev, ...proj.subs }));
    setCalcParams({ area: proj.area_ha, creditingPeriod: std.defaultCreditingPeriod, baselineRate: std.baselineRate, projectRate: std.projectRate, leakagePct: std.defaultLeakage, bufferPct: std.defaultBuffer, uncertaintyPct: std.uncertaintyBase, cobenefitMult: std.cobenefitMultiplier, activityType: std.activityTypes[0] });
    setTab('Credit Calculator');
  }, []);

  /* ── Waterfall data ── */
  const waterfallData = useMemo(() => [
    { name: 'Gross', value: creditResult.grossTotal, fill: T.teal },
    { name: 'Leakage', value: -creditResult.leakageDeduction, fill: T.red },
    { name: 'Buffer', value: -creditResult.bufferDeduction, fill: T.amber },
    { name: 'Uncertainty', value: -creditResult.uncertaintyDeduction, fill: T.purple },
    { name: 'Net (Pre-Q)', value: creditResult.netCredits, fill: T.navy },
    { name: 'Quality Adj', value: creditResult.adjustedCredits - creditResult.netCredits, fill: '#b45309' },
    { name: 'Co-Benefits', value: creditResult.cobCredits - creditResult.adjustedCredits, fill: T.emerald },
    { name: 'Final', value: creditResult.cobCredits, fill: T.gold },
  ], [creditResult]);

  /* ── Sensitivity data ── */
  const sensitivityData = useMemo(() => {
    const base = pillarResult.overall;
    return PILLARS.flatMap(p => p.keys.map((k, i) => {
      const lo = { ...calcInputs, [k]: Math.max(0, (calcInputs[k] || 70) - 20) };
      const hi = { ...calcInputs, [k]: Math.min(100, (calcInputs[k] || 70) + 20) };
      const loScore = calcPillarScores(lo).overall;
      const hiScore = calcPillarScores(hi).overall;
      return { name: p.labels[i], pillar: p.abbr, low: Math.round((loScore - base) * 10) / 10, high: Math.round((hiScore - base) * 10) / 10, range: Math.round((hiScore - loScore) * 10) / 10, color: p.color };
    })).sort((a, b) => b.range - a.range).slice(0, 12);
  }, [calcInputs, pillarResult.overall]);

  const filteredProjects = PROJECTS.filter(p => tierFilter === 'All' || p.tier === tierFilter);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: '20px 24px' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, letterSpacing:'0.1em' }}>EP-BP1</span>
          <span style={{ width:1, height:12, background:T.border }} />
          <span style={{ fontSize:9, fontFamily:T.mono, color:T.teal, fontWeight:600 }}>EQUITABLE EARTH METHODOLOGIES</span>
        </div>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, margin:0 }}>Equitable Earth Methodology Framework & Calculation Engine</h1>
        <p style={{ fontSize:12, color:T.textSec, marginTop:4 }}>5-pillar scoring · 6 standards · Interactive credit calculator · Sensitivity analysis · Project assessment</p>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        <Kpi label="Standards" value="6" sub="4 Certified · 2 Draft" accent={T.emerald} />
        <Kpi label="Projects Assessed" value="16" sub="EE Framework v3.2" accent={T.teal} />
        <Kpi label="Credits Issued" value="10.0M" sub="tCO₂e All Standards" accent={T.gold} />
        <Kpi label="Avg Score" value={Math.round(PROJECTS.reduce((s,p) => s+p.overall,0)/PROJECTS.length)} sub="EE Composite /100" accent={T.navy} />
        <Kpi label="Gold Tier" value={PROJECTS.filter(p=>p.tier==='Gold').length} sub={`of 16 projects`} accent="#c5a96a" color={T.goldD} />
        <Kpi label="FPIC Compliant" value={`${PROJECTS.filter(p=>p.fpic==='Compliant').length}/16`} sub="Indigenous Rights" accent={T.sage} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══════════════════════════════════════ TAB 1 — Methodology Overview ══ */}
      {tab === 'Methodology Overview' && (
        <>
          {/* ── CC Nature-Based Overlay ── */}
          <Card border={T.emerald} style={{ marginBottom:16 }}>
            <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.1em' }}>CC Nature-Based Projects</div>
                <div style={{ fontSize:22, fontWeight:700, color:T.emerald, fontFamily:T.mono }}>{ccEE.natureBasedCount ?? 0}</div>
              </div>
              <div style={{ width:1, height:32, background:T.border }} />
              <div>
                <div style={{ fontSize:9, fontFamily:T.mono, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.1em' }}>Total Nature Credits</div>
                <div style={{ fontSize:22, fontWeight:700, color:T.navy, fontFamily:T.mono }}>{(ccEE.totalNatureCredits ?? 0).toLocaleString()}</div>
              </div>
              <div style={{ width:1, height:32, background:T.border }} />
              <div style={{ fontSize:10, color:T.textSec }}>Carbon Credit Engine overlay</div>
            </div>
          </Card>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <Card>
              <Section title="5-Pillar Architecture & Weights">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={PILLARS.map(p=>({name:p.abbr, weight:p.weight*100, color:p.color}))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0,35]} tick={{fontSize:10,fontFamily:T.mono}} />
                    <YAxis dataKey="name" type="category" tick={{fontSize:11,fontFamily:T.mono,fill:T.navy}} width={32} />
                    <Tooltip contentStyle={TIP} formatter={v=>[`${v}%`,'Weight']} />
                    <Bar dataKey="weight" radius={[0,3,3,0]}>
                      {PILLARS.map((p,i)=> <Cell key={i} fill={p.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </Card>
            <Card>
              <Section title="Standards Roster" right={`${STANDARDS.filter(s=>s.status==='Certified').length} Certified`}>
                {STANDARDS.map(s => (
                  <div key={s.id} onClick={()=>setSelectedStd(s)} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:4, cursor:'pointer',
                    background: selectedStd.id===s.id ? `${T.navy}08` : 'transparent', border:`1px solid ${selectedStd.id===s.id?T.border:'transparent'}`, marginBottom:4,
                  }}>
                    <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut,width:56}}>{s.id}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:T.navy}}>{s.name}</div>
                      <div style={{fontSize:10,color:T.textSec}}>{s.category} · v{s.version}</div>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{s.score}</span>
                    <Badge v={s.status} colors={{Certified:'#059669',Draft:'#d97706'}} />
                  </div>
                ))}
              </Section>
            </Card>
          </div>
          <Card style={{marginBottom:16}}>
            <Section title={`${selectedStd.name} — Detail`} right={selectedStd.id}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                <div>
                  {[['Baseline Method',selectedStd.baseline_method],['Additionality',selectedStd.additionality],['Permanence',selectedStd.permanence],['MRV',selectedStd.mrv],['Permanence Period',selectedStd.permanenceYrs+'yr'],['Default Baseline Rate',selectedStd.baselineRate+' tCO₂e/ha/yr']].map(([l,v])=>(
                    <div key={l} style={{marginBottom:8}}>
                      <div style={{fontSize:10,color:T.textMut}}>{l}</div>
                      <div style={{fontSize:12,color:T.text,fontWeight:500}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:10,color:T.textMut,marginBottom:4}}>Credits Issued</div>
                  <div style={{fontSize:18,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{selectedStd.creditsIssued}</div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:10}}>Average Market Price</div>
                  <div style={{fontSize:18,fontWeight:700,color:T.teal,fontFamily:T.mono}}>${selectedStd.avgPrice}/tCO₂e</div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:10}}>Jurisdictions: <strong>{selectedStd.jurisdictions}</strong></div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:8}}>
                    {selectedStd.cobenefits.map(c=><span key={c} style={{fontSize:9,padding:'2px 6px',background:`${T.teal}15`,color:T.teal,borderRadius:3,fontFamily:T.mono}}>{c}</span>)}
                  </div>
                  <button onClick={()=>{loadMethodology(selectedStd);setTab('Credit Calculator');}} style={{marginTop:14,padding:'7px 14px',background:T.navy,color:T.cream,border:'none',borderRadius:4,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>
                    Open in Calculator →
                  </button>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.textMut,marginBottom:8}}>Pillar Scores (Radar)</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <RadarChart data={PILLARS.map(p=>({subject:p.abbr,score:selectedStd.score+(sr(STANDARDS.indexOf(selectedStd)*7+PILLARS.indexOf(p))-0.5)*15,fullMark:100}))}>
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="subject" tick={{fontSize:10,fontFamily:T.mono,fill:T.textSec}} />
                      <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                      <Radar dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>
          </Card>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
            {PILLARS.map(p=>(
              <div key={p.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:12,borderTop:`3px solid ${p.color}`}}>
                <div style={{fontSize:10,fontWeight:700,color:p.color,fontFamily:T.mono,marginBottom:4}}>{p.abbr} — {p.weight*100}%</div>
                <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:6}}>{p.name}</div>
                <div style={{fontSize:10,color:T.textSec,marginBottom:8,lineHeight:1.4}}>{p.desc}</div>
                {p.labels.map((m,i)=> <div key={m} style={{fontSize:9,color:T.textSec,padding:'2px 0'}}><span style={{color:p.color}}>•</span> {m} <span style={{fontFamily:T.mono,color:T.textMut}}>({(p.subWeights[i]*100).toFixed(0)}%)</span></div> )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════ TAB 2 — Standard Comparison ══ */}
      {tab === 'Standard Comparison' && (
        <>
          <Card style={{marginBottom:16}}>
            <Section title="Score Evolution by Standard (2015–2024)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={TIME_SERIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{fontSize:10,fontFamily:T.mono}} />
                  <YAxis domain={[55,100]} tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} /> <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
                  <Line dataKey="EE-NF" stroke="#16a34a" strokeWidth={2} dot={false} />
                  <Line dataKey="EE-PM" stroke="#0f766e" strokeWidth={2} dot={false} />
                  <Line dataKey="EE-MC" stroke="#1b3a5c" strokeWidth={2} dot={false} />
                  <Line dataKey="EE-AR" stroke="#b45309" strokeWidth={2} dot={false} />
                  <Line dataKey="EE-BS" stroke="#6d28d9" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </Card>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card><Section title="Price vs Score — All Standards">
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="score" name="EE Score" type="number" domain={[60,100]} tick={{fontSize:10,fontFamily:T.mono}} />
                  <YAxis dataKey="avgPrice" name="Price" tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} formatter={(v,n)=>[n==='EE Score'?v:`$${v}`,n]} />
                  <Scatter data={STANDARDS.map(s=>({score:s.score,avgPrice:s.avgPrice,name:s.name}))} fill={T.teal} />
                </ScatterChart>
              </ResponsiveContainer>
            </Section></Card>
            <Card><Section title="Credits Issued by Standard (M tCO₂e)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={STANDARDS.map(s=>({name:s.id.replace('EE-',''),credits:parseFloat(s.creditsIssued)}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{fontSize:10,fontFamily:T.mono}} />
                  <YAxis tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} formatter={v=>[`${v}M tCO₂e`]} />
                  <Bar dataKey="credits" fill={T.emerald} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section></Card>
          </div>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:T.navy}}>
                {['Standard','Category','Version','Baseline Rate','Default Buffer','Permanence','Score','Price','Jurisdictions','Status'].map(h=><th key={h} style={{padding:'8px 10px',color:T.cream,fontSize:9,fontFamily:T.mono,textAlign:'left',fontWeight:600}}>{h}</th>)}
                <th style={{padding:'8px 10px',color:T.cream,fontSize:9,fontFamily:T.mono,textAlign:'left',fontWeight:600}}>Action</th>
              </tr></thead>
              <tbody>{STANDARDS.map((s,i)=>(
                <tr key={s.id} style={{background:i%2===0?T.surface:`${T.cream}50`,borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'8px 10px',fontWeight:600,color:T.navy}}>{s.id}</td>
                  <td style={{padding:'8px 10px',color:T.textSec}}>{s.category}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10}}>v{s.version}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10}}>{s.baselineRate} tCO₂e/ha/yr</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10}}>{s.defaultBuffer}%</td>
                  <td style={{padding:'8px 10px',fontSize:10}}>{s.permanenceYrs}yr</td>
                  <td style={{padding:'8px 10px',fontWeight:700,color:T.navy,fontFamily:T.mono}}>{s.score}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,color:T.teal,fontWeight:600}}>${s.avgPrice}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono}}>{s.jurisdictions}</td>
                  <td style={{padding:'8px 10px'}}><Badge v={s.status} colors={{Certified:'#059669',Draft:'#d97706'}} /></td>
                  <td style={{padding:'8px 10px'}}><button onClick={()=>{loadMethodology(s);setTab('Credit Calculator');}} style={{fontSize:9,padding:'3px 8px',background:T.navy,color:T.cream,border:'none',borderRadius:3,cursor:'pointer',fontFamily:T.mono}}>Calculate →</button></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════ TAB 3 — Credit Calculator ══ */}
      {tab === 'Credit Calculator' && (
        <>
          {/* Methodology Selector */}
          <Card style={{marginBottom:16}} border={T.teal}>
            <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              <div>
                <div style={{fontSize:10,color:T.textMut,marginBottom:4}}>Selected Methodology</div>
                <select value={calcMethod.id} onChange={e=>{const s=STANDARDS.find(x=>x.id===e.target.value);if(s)loadMethodology(s);}}
                  style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:12,fontFamily:T.font,color:T.navy,background:T.cream,cursor:'pointer',fontWeight:600,minWidth:240}}>
                  {STANDARDS.map(s=><option key={s.id} value={s.id}>{s.id} — {s.name} ({s.category})</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:10,color:T.textMut,marginBottom:4}}>Activity Type</div>
                <select value={calcParams.activityType} onChange={e=>setCalcParams(p=>({...p,activityType:e.target.value}))}
                  style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:12,fontFamily:T.font,color:T.navy,background:T.cream,cursor:'pointer',minWidth:240}}>
                  {calcMethod.activityTypes.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={{marginLeft:'auto',textAlign:'right'}}>
                <Badge v={calcMethod.status} colors={{Certified:'#059669',Draft:'#d97706'}} />
                <div style={{fontSize:9,color:T.textMut,marginTop:4}}>Permanence: {calcMethod.permanenceYrs}yr · Co-benefit ×{calcMethod.cobenefitMultiplier}</div>
              </div>
            </div>
          </Card>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            {/* LEFT: Project Parameters */}
            <div>
              <Card style={{marginBottom:12}} border={T.gold}>
                <Section title="Step 1 — Project Parameters">
                  <DualInput label="Project Area (ha)" value={calcParams.area} min={100} max={500000} step={100} onChange={v=>setCalcParams(p=>({...p,area:v}))} color={T.teal} unit=" ha" />
                  <DualInput label="Crediting Period (years)" value={calcParams.creditingPeriod} min={5} max={60} onChange={v=>setCalcParams(p=>({...p,creditingPeriod:v}))} color={T.navy} unit=" yr" />
                  <DualInput label="Baseline Emissions Rate (tCO₂e/ha/yr)" value={calcParams.baselineRate} min={0} max={100} step={0.1} onChange={v=>setCalcParams(p=>({...p,baselineRate:v}))} color={T.red} />
                  <DualInput label="Project Emissions Rate (tCO₂e/ha/yr)" value={calcParams.projectRate} min={-20} max={50} step={0.1} onChange={v=>setCalcParams(p=>({...p,projectRate:v}))} color={T.emerald} />
                </Section>
              </Card>
              <Card style={{marginBottom:12}} border={T.red}>
                <Section title="Step 2 — Deductions & Adjustments">
                  <DualInput label="Leakage Deduction (%)" value={calcParams.leakagePct} min={0} max={50} onChange={v=>setCalcParams(p=>({...p,leakagePct:v}))} color={T.red} unit="%" />
                  <DualInput label="Buffer Pool (%)" value={calcParams.bufferPct} min={0} max={50} onChange={v=>setCalcParams(p=>({...p,bufferPct:v}))} color={T.amber} unit="%" />
                  <DualInput label="Uncertainty Discount (%)" value={calcParams.uncertaintyPct} min={0} max={40} onChange={v=>setCalcParams(p=>({...p,uncertaintyPct:v}))} color={T.purple} unit="%" />
                  <DualInput label="Co-Benefit Multiplier (×)" value={calcParams.cobenefitMult} min={1.0} max={1.5} step={0.01} onChange={v=>setCalcParams(p=>({...p,cobenefitMult:v}))} color={T.emerald} unit="×" />
                </Section>
              </Card>
              {/* Pillar quality inputs — collapsed accordion */}
              <Card border={T.sage}>
                <Section title="Step 3 — EE Quality Pillar Scores (0–100)">
                  {PILLARS.map(p => (
                    <div key={p.id} style={{marginBottom:10,padding:'8px 10px',background:`${p.color}06`,borderRadius:4,border:`1px solid ${p.color}20`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <span style={{fontSize:10,fontWeight:700,color:p.color}}>{p.abbr} — {p.name}</span>
                        <span style={{fontSize:11,fontFamily:T.mono,fontWeight:700,color:T.navy}}>{Math.round(pillarResult.scores[p.id])}/100</span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6}}>
                        {p.keys.map((k,i) => (
                          <DualInput key={k} label={p.labels[i]} value={calcInputs[k]||0} onChange={v=>setCalcInputs(prev=>({...prev,[k]:v}))} color={p.color} />
                        ))}
                      </div>
                    </div>
                  ))}
                </Section>
              </Card>
            </div>

            {/* RIGHT: Results */}
            <div>
              {/* Score summary */}
              <div style={{background:T.navy,borderRadius:6,padding:16,marginBottom:12,color:T.cream}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontSize:10,fontFamily:T.mono,color:`${T.cream}80`,letterSpacing:'0.1em',marginBottom:4}}>EE COMPOSITE SCORE</div>
                    <div style={{fontSize:48,fontWeight:700,fontFamily:T.mono,lineHeight:1}}>{pillarResult.overall}</div>
                    <div style={{fontSize:11,color:`${T.cream}80`,marginTop:4}}>/100 · {calcMethod.name}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{padding:'6px 14px',borderRadius:20,background:`${TIER_COLORS[pillarResult.tier]}30`,display:'inline-block'}}>
                      <span style={{fontSize:14,fontWeight:700,color:TIER_COLORS[pillarResult.tier]}}>{pillarResult.tier === 'Gold' ? '🥇' : pillarResult.tier === 'Silver' ? '🥈' : pillarResult.tier === 'Bronze' ? '🥉' : '❌'} {pillarResult.tier}</span>
                    </div>
                    <div style={{fontSize:9,color:`${T.cream}60`,marginTop:4}}>Quality Mult: {(pillarResult.overall/100).toFixed(3)}×</div>
                  </div>
                </div>
              </div>

              {/* Credit volume results */}
              <Card style={{marginBottom:12}} border={T.gold}>
                <Section title="Credit Volume Results">
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
                    <div style={{textAlign:'center',padding:10,background:`${T.teal}08`,borderRadius:4}}>
                      <div style={{fontSize:9,color:T.textMut}}>Gross Annual</div>
                      <div style={{fontSize:16,fontWeight:700,color:T.teal,fontFamily:T.mono}}>{fmtK(creditResult.grossAnnual)}</div>
                      <div style={{fontSize:9,color:T.textMut}}>tCO₂e/yr</div>
                    </div>
                    <div style={{textAlign:'center',padding:10,background:`${T.navy}08`,borderRadius:4}}>
                      <div style={{fontSize:9,color:T.textMut}}>Gross Total</div>
                      <div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{fmtK(creditResult.grossTotal)}</div>
                      <div style={{fontSize:9,color:T.textMut}}>tCO₂e ({calcParams.creditingPeriod}yr)</div>
                    </div>
                    <div style={{textAlign:'center',padding:10,background:`${T.gold}15`,borderRadius:4}}>
                      <div style={{fontSize:9,color:T.textMut}}>Final Issuable</div>
                      <div style={{fontSize:16,fontWeight:700,color:T.goldD,fontFamily:T.mono}}>{fmtK(creditResult.cobCredits)}</div>
                      <div style={{fontSize:9,color:T.textMut}}>tCO₂e net</div>
                    </div>
                  </div>
                  {/* Waterfall */}
                  <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:6}}>Credit Waterfall (tCO₂e)</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={waterfallData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{fontSize:8,fontFamily:T.mono}} />
                      <YAxis tick={{fontSize:9,fontFamily:T.mono}} />
                      <Tooltip contentStyle={TIP} formatter={v=>[fmtK(Math.abs(v))+' tCO₂e']} />
                      <Bar dataKey="value" radius={[3,3,0,0]}>
                        {waterfallData.map((d,i)=><Cell key={i} fill={d.fill} opacity={d.value<0?0.6:1} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Section>
              </Card>

              {/* Radar */}
              <Card style={{marginBottom:12}}>
                <Section title="Pillar Quality Radar">
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={PILLARS.map(p=>({subject:p.abbr,score:Math.round(pillarResult.scores[p.id]),fullMark:100}))}>
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="subject" tick={{fontSize:11,fontFamily:T.mono,fill:T.textSec}} />
                      <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                      <Radar dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                  {PILLARS.map(p=>(
                    <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:`1px solid ${T.border}`}}>
                      <span style={{fontSize:10,color:p.color,fontWeight:600}}>{p.abbr}</span>
                      <span style={{fontSize:10,fontFamily:T.mono}}>{p.weight*100}% wt</span>
                      <span style={{fontSize:11,fontFamily:T.mono,fontWeight:700,color:T.navy}}>{Math.round(pillarResult.scores[p.id])}</span>
                    </div>
                  ))}
                </Section>
              </Card>

              {/* Value estimate */}
              <Card border={T.emerald}>
                <Section title="Value Estimate">
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div style={{textAlign:'center',padding:8,background:`${T.emerald}08`,borderRadius:4}}>
                      <div style={{fontSize:9,color:T.textMut}}>Price ({pillarResult.tier} Tier)</div>
                      <div style={{fontSize:16,fontWeight:700,color:T.emerald,fontFamily:T.mono}}>${calcMethod.score > 0 ? (calcMethod.avgPrice * (pillarResult.overall/calcMethod.score)).toFixed(2) : calcMethod.avgPrice.toFixed(2)}</div>
                      <div style={{fontSize:9,color:T.textMut}}>per tCO₂e</div>
                    </div>
                    <div style={{textAlign:'center',padding:8,background:`${T.gold}15`,borderRadius:4}}>
                      <div style={{fontSize:9,color:T.textMut}}>Total Project Value</div>
                      <div style={{fontSize:16,fontWeight:700,color:T.goldD,fontFamily:T.mono}}>
                        ${fmtK(Math.round(creditResult.cobCredits * (calcMethod.score > 0 ? calcMethod.avgPrice * (pillarResult.overall/calcMethod.score) : calcMethod.avgPrice)))}
                      </div>
                      <div style={{fontSize:9,color:T.textMut}}>over {calcParams.creditingPeriod}yr</div>
                    </div>
                  </div>
                  <button onClick={()=>{
                    setSavedScenarios(prev=>[...prev.slice(-2),{name:`${calcMethod.id} · ${new Date().toLocaleTimeString()}`,score:pillarResult.overall,tier:pillarResult.tier,net:creditResult.cobCredits,params:{...calcParams},inputs:{...calcInputs},method:calcMethod.id}]);
                  }} style={{marginTop:12,padding:'8px 16px',background:T.teal,color:T.cream,border:'none',borderRadius:4,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:T.font,width:'100%'}}>
                    Save Scenario ({savedScenarios.length}/3 saved)
                  </button>
                </Section>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════ TAB 4 — Sensitivity & Scenarios ══ */}
      {tab === 'Sensitivity & Scenarios' && (
        <>
          <Card style={{marginBottom:16}}>
            <Section title="Sensitivity Analysis — Top 12 Inputs by Impact on Overall Score" right="±20pt swing">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sensitivityData} layout="vertical" margin={{left:120}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'Δ Overall Score',position:'insideBottom',offset:-4,fontSize:10}} />
                  <YAxis dataKey="name" type="category" tick={{fontSize:10,fontFamily:T.mono,fill:T.navy}} width={120} />
                  <Tooltip contentStyle={TIP} formatter={(v,n)=>[v>0?`+${v}`:`${v}`,n==='Downside'?'−20pts':'+20pts']} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Bar dataKey="low" fill={T.red} name="Downside (−20)" radius={[3,0,0,3]} />
                  <Bar dataKey="high" fill={T.emerald} name="Upside (+20)" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Card>

          {/* Saved scenarios comparison */}
          <Card>
            <Section title="Saved Scenario Comparison" right={`${savedScenarios.length} scenarios saved`}>
              {savedScenarios.length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 20px',color:T.textMut}}>
                  <div style={{fontSize:14,marginBottom:8}}>No scenarios saved yet</div>
                  <div style={{fontSize:11}}>Go to the <strong>Credit Calculator</strong> tab, configure your inputs, and click <strong>Save Scenario</strong></div>
                </div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(savedScenarios.length,3)},1fr)`,gap:12}}>
                  {savedScenarios.map((sc,i) => (
                    <div key={i} style={{background:`${T.cream}60`,border:`1px solid ${T.border}`,borderRadius:6,padding:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:8}}>{sc.name}</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:10}}>
                        <div><span style={{color:T.textMut}}>Score:</span> <strong style={{fontFamily:T.mono}}>{sc.score}</strong></div>
                        <div><span style={{color:T.textMut}}>Tier:</span> <span style={{color:TIER_COLORS[sc.tier],fontWeight:700}}>{sc.tier}</span></div>
                        <div><span style={{color:T.textMut}}>Net Credits:</span> <strong style={{fontFamily:T.mono}}>{fmtK(sc.net)}</strong></div>
                        <div><span style={{color:T.textMut}}>Method:</span> {sc.method}</div>
                        <div><span style={{color:T.textMut}}>Area:</span> {sc.params.area.toLocaleString()} ha</div>
                        <div><span style={{color:T.textMut}}>Period:</span> {sc.params.creditingPeriod}yr</div>
                        <div><span style={{color:T.textMut}}>Leakage:</span> {sc.params.leakagePct}%</div>
                        <div><span style={{color:T.textMut}}>Buffer:</span> {sc.params.bufferPct}%</div>
                      </div>
                      <div style={{marginTop:8}}>
                        <div style={{fontSize:9,color:T.textMut,marginBottom:4}}>Pillar Scores</div>
                        <ResponsiveContainer width="100%" height={100}>
                          <RadarChart data={PILLARS.map(p=>{const ps=calcPillarScores(sc.inputs);return{subject:p.abbr,score:Math.round(ps.scores[p.id]),fullMark:100};})}>
                            <PolarGrid stroke={T.border} />
                            <PolarAngleAxis dataKey="subject" tick={{fontSize:8,fontFamily:T.mono}} />
                            <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                            <Radar dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.2} strokeWidth={1} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <button onClick={()=>{
                        setCalcInputs(sc.inputs); setCalcParams(sc.params);
                        const s = STANDARDS.find(x=>x.id===sc.method); if(s) setCalcMethod(s);
                        setTab('Credit Calculator');
                      }} style={{marginTop:6,padding:'5px 10px',background:T.navy,color:T.cream,border:'none',borderRadius:3,fontSize:9,cursor:'pointer',fontFamily:T.mono,width:'100%'}}>
                        Load into Calculator
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════ TAB 5 — Project Scoring ══ */}
      {tab === 'Project Scoring' && (
        <>
          <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
            <span style={{fontSize:11,color:T.textSec}}>Filter:</span>
            {['All','Gold','Silver','Bronze','Ineligible'].map(t=>(
              <button key={t} onClick={()=>setTierFilter(t)} style={{
                padding:'5px 12px',fontSize:10,fontFamily:T.mono,cursor:'pointer',
                border:`1px solid ${tierFilter===t?T.navy:T.border}`,
                background:tierFilter===t?T.navy:T.surface, color:tierFilter===t?T.cream:T.textSec, borderRadius:4,
              }}>{t} {t!=='All'&&`(${PROJECTS.filter(p=>p.tier===t).length})`}</button>
            ))}
            <span style={{marginLeft:'auto',fontSize:10,color:T.textMut,fontFamily:T.mono}}>{filteredProjects.length} projects</span>
          </div>

          <Card>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:T.navy}}>
                {['ID','Project','Country','Method','EP','CO','AC','PM','MV','Overall','Tier','Area','Status','Action'].map(h=>
                  <th key={h} style={{padding:'7px 8px',color:T.cream,fontSize:9,fontFamily:T.mono,textAlign:'left',fontWeight:600}}>{h}</th>
                )}
              </tr></thead>
              <tbody>
                {filteredProjects.map((p,i) => (
                  <React.Fragment key={p.id}>
                    <tr style={{background:i%2===0?T.surface:`${T.cream}50`,borderBottom:`1px solid ${T.border}`,cursor:'pointer'}}
                      onClick={()=>setExpandedProject(expandedProject===p.id?null:p.id)}>
                      <td style={{padding:'7px 8px',fontFamily:T.mono,fontSize:9,color:T.textMut}}>{p.id}</td>
                      <td style={{padding:'7px 8px',fontWeight:600,color:T.navy,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</td>
                      <td style={{padding:'7px 8px',color:T.textSec,fontSize:10}}>{p.country}</td>
                      <td style={{padding:'7px 8px',fontFamily:T.mono,fontSize:9,color:T.teal}}>{p.methodology}</td>
                      {[p.EP,p.CO,p.AC,p.PM,p.MV].map((sc,j)=>{const v=Math.round(sc||0);return(
                        <td key={j} style={{padding:'7px 8px',fontFamily:T.mono,fontSize:10,color:v>=80?T.green:v>=65?T.amber:T.red,fontWeight:600}}>{v}</td>
                      );})}
                      <td style={{padding:'7px 8px',fontFamily:T.mono,fontWeight:700,fontSize:12,color:T.navy}}>{p.overall}</td>
                      <td style={{padding:'7px 8px'}}><span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:10,background:`${TIER_COLORS[p.tier]}20`,color:TIER_COLORS[p.tier]}}>{p.tier}</span></td>
                      <td style={{padding:'7px 8px',fontFamily:T.mono,fontSize:10}}>{p.area_ha.toLocaleString()}</td>
                      <td style={{padding:'7px 8px'}}><Badge v={p.status} colors={{Active:'#059669',Draft:'#d97706','Under Review':'#0f766e'}} /></td>
                      <td style={{padding:'7px 8px'}}>
                        <button onClick={e=>{e.stopPropagation();loadProject(p);}} style={{fontSize:9,padding:'3px 8px',background:T.teal,color:T.cream,border:'none',borderRadius:3,cursor:'pointer',fontFamily:T.mono}}>
                          Run in Calc →
                        </button>
                      </td>
                    </tr>
                    {expandedProject===p.id && (
                      <tr><td colSpan={14} style={{padding:0}}>
                        <div style={{padding:'12px 16px',background:`${T.cream}80`,borderBottom:`2px solid ${T.border}`}}>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                            <div>
                              <div style={{fontSize:10,fontWeight:700,color:T.navy,marginBottom:6}}>Pillar Score Breakdown</div>
                              {PILLARS.map(pl=>{const v=Math.round(p[pl.id]||0);return(
                                <div key={pl.id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                                  <span style={{fontSize:9,color:pl.color,fontWeight:700,width:20}}>{pl.abbr}</span>
                                  <div style={{flex:1,height:6,background:T.border,borderRadius:3}}>
                                    <div style={{height:'100%',width:`${v}%`,background:pl.color,borderRadius:3}} />
                                  </div>
                                  <span style={{fontSize:10,fontFamily:T.mono,fontWeight:600,width:24,textAlign:'right'}}>{v}</span>
                                </div>
                              );})}
                            </div>
                            <div>
                              <div style={{fontSize:10,fontWeight:700,color:T.navy,marginBottom:6}}>Project Details</div>
                              {[['Methodology',p.methodName],['Category',p.category],['FPIC Status',p.fpic],['Credits Issued',p.credits_issued.toLocaleString()+' tCO₂e'],['Avg Price','$'+p.avg_price+'/tCO₂e'],['Vintage',p.vintage]].map(([l,v])=>(
                                <div key={l} style={{fontSize:10,color:T.textSec,marginBottom:3}}><span style={{color:T.textMut}}>{l}:</span> {v}</div>
                              ))}
                            </div>
                            <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
                              <ResponsiveContainer width="100%" height={120}>
                                <RadarChart data={PILLARS.map(pl=>({subject:pl.abbr,score:Math.round(p[pl.id]||0),fullMark:100}))}>
                                  <PolarGrid stroke={T.border} />
                                  <PolarAngleAxis dataKey="subject" tick={{fontSize:9,fontFamily:T.mono}} />
                                  <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                                  <Radar dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.25} strokeWidth={2} />
                                </RadarChart>
                              </ResponsiveContainer>
                              <button onClick={()=>loadProject(p)} style={{marginTop:6,padding:'6px 14px',background:T.navy,color:T.cream,border:'none',borderRadius:4,fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>
                                Open in Credit Calculator →
                              </button>
                            </div>
                          </div>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════ TAB 6 — Credit Integrity ══ */}
      {tab === 'Credit Integrity' && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
            <Kpi label="Gold Tier Credits" value={fmtK(PROJECTS.filter(p=>p.tier==='Gold').reduce((s,p)=>s+p.credits_issued,0))} sub="tCO₂e premium quality" accent="#c5a96a" color={T.goldD} />
            <Kpi label="FPIC Compliant" value={`${Math.round(PROJECTS.filter(p=>p.fpic==='Compliant').length/PROJECTS.length*100)}%`} sub={`${PROJECTS.filter(p=>p.fpic==='Compliant').length} of 16`} accent={T.teal} />
            <Kpi label="Avg Leakage" value="12%" sub="Frontier deduction" accent={T.amber} />
            <Kpi label="Buffer Pool" value="20%" sub="AFOLU / Blue Carbon" accent={T.purple} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <Card><Section title="Integrity Score vs Price ($/tCO₂e)">
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="overall" name="Score" type="number" domain={[50,100]} tick={{fontSize:10,fontFamily:T.mono}} />
                  <YAxis dataKey="avg_price" name="Price" tick={{fontSize:10,fontFamily:T.mono}} />
                  <Tooltip contentStyle={TIP} formatter={(v,n)=>[n==='Score'?v:`$${v}`,n]} />
                  <Scatter data={PROJECTS} opacity={0.7}>
                    {PROJECTS.map((p,i)=><Cell key={i} fill={TIER_COLORS[p.tier]} />)}
                  </Scatter>
                  <ReferenceLine x={85} stroke={T.gold} strokeDasharray="4 2" label={{value:'Gold',fill:T.goldD,fontSize:9}} />
                </ScatterChart>
              </ResponsiveContainer>
            </Section></Card>
            <Card><Section title="Co-Benefits Coverage">
              {STANDARDS.map(s=>(
                <div key={s.id} style={{marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                    <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut,width:48}}>{s.id}</span>
                    <span style={{fontSize:10,color:T.navy,fontWeight:600}}>{s.name.replace('EE ','')}</span>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {s.cobenefits.map(c=><span key={c} style={{fontSize:9,padding:'2px 6px',background:`${T.sage}20`,color:T.sage,borderRadius:3,fontFamily:T.mono,fontWeight:600}}>{c}</span>)}
                  </div>
                </div>
              ))}
            </Section></Card>
          </div>
          <Card>
            <Section title="Credit Integrity Risk Framework">
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                {[
                  {risk:'Reversal Risk',desc:'Physical permanence failure due to fire, drought, or deforestation.',level:'Medium',mit:'AFOLU Buffer 15–40%'},
                  {risk:'Additionality Risk',desc:'Credits without genuine counterfactual. High where baseline data is poor.',level:'High',mit:'EE AC pillar ≥70'},
                  {risk:'Leakage Risk',desc:'Displacement of emissions outside project boundary.',level:'Medium',mit:'Frontier Deduction 10–20%'},
                  {risk:'Greenwash Risk',desc:'Over-claiming or double counting by developers.',level:'Low',mit:'EE MV pillar + Audit'},
                  {risk:'Baseline Inflation',desc:'Reference deforestation rates set too high.',level:'High',mit:'Dynamic national baseline'},
                  {risk:'Social/FPIC Risk',desc:'Insufficient consultation or benefit-sharing.',level:'Medium',mit:'EE CO pillar FPIC ≥80'},
                ].map(r=>(
                  <div key={r.risk} style={{background:T.cream,border:`1px solid ${T.border}`,borderRadius:4,padding:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:T.navy}}>{r.risk}</span>
                      <Badge v={r.level} />
                    </div>
                    <div style={{fontSize:10,color:T.textSec,marginBottom:6,lineHeight:1.4}}>{r.desc}</div>
                    <div style={{fontSize:9,color:T.teal,fontFamily:T.mono,fontWeight:600}}>Mitigation: {r.mit}</div>
                  </div>
                ))}
              </div>
            </Section>
          </Card>
        </>
      )}
    </div>
  );
}
