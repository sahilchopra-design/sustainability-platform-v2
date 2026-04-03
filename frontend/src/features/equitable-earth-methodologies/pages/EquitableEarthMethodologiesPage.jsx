import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, ScatterChart, Scatter, ZAxis,
  AreaChart, Area, ReferenceLine,
} from 'recharts';

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

/* ── seeded random ──────────────────────────────────────────────── */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── primitives ─────────────────────────────────────────────────── */
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display:'flex', gap:2, borderBottom:`2px solid ${T.border}`, marginBottom:20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding:'9px 16px', fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
        background:'transparent', color: active===t ? T.navy : T.textMut,
        borderBottom: active===t ? `2px solid ${T.gold}` : '2px solid transparent',
        marginBottom:-2, fontFamily:T.font, transition:'all 0.15s',
      }}>{t}</button>
    ))}
  </div>
);

const Kpi = ({ label, value, sub, color, accent }) => (
  <div style={{
    background:T.surface, border:`1px solid ${T.border}`, borderRadius:6,
    padding:'14px 16px', borderBottom:`3px solid ${accent||T.gold}`,
    boxShadow:T.card,
  }}>
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
  return (
    <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10, background:`${bg}18`, color:bg, fontFamily:T.mono, letterSpacing:'0.05em' }}>{v}</span>
  );
};

const TIP_STYLE = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:4, color:T.text, fontSize:11, fontFamily:T.mono };

/* ══════════════════════════════════════════════════════════════════
   DATA — EQUITABLE EARTH METHODOLOGY FRAMEWORK
   ══════════════════════════════════════════════════════════════════ */

/* ── Core Pillars ── */
const PILLARS = [
  { id:'EP', name:'Ecological Preservation', abbr:'EP', weight:0.28, color:'#16a34a',
    desc:'Forest, soil, water and biodiversity conservation baselines and additionality standards',
    subMetrics:['Canopy Cover Baseline','Soil Carbon Flux','Biodiversity Integrity Index','Hydrological Connectivity','Fire Risk Adjusted'],
  },
  { id:'CO', name:'Community Outcomes', abbr:'CO', weight:0.24, color:'#0f766e',
    desc:'FPIC compliance, livelihood co-benefits, gender equity and indigenous rights protection',
    subMetrics:['FPIC Compliance Score','Livelihood Enhancement','Gender Equity Index','Indigenous Rights','Community Revenue Share'],
  },
  { id:'AC', name:'Additionality & Causality', abbr:'AC', weight:0.22, color:'#1b3a5c',
    desc:'Financial additionality, leakage accounting, counterfactual robustness and causal attribution',
    subMetrics:['Financial Additionality','Leakage Deduction','Counterfactual Robustness','Activity Causality','Market Absence Test'],
  },
  { id:'PM', name:'Permanence & Risk Buffer', abbr:'PM', weight:0.16, color:'#b45309',
    desc:'Reversal risk quantification, buffer pool adequacy and long-term monitoring commitments',
    subMetrics:['Physical Reversal Risk','Buffer Pool Adequacy','Monitoring Commitment','Legal Protection Years','Non-Permanence Rating'],
  },
  { id:'MV', name:'MRV & Data Quality', abbr:'MV', weight:0.10, color:'#6d28d9',
    desc:'Measurement, reporting and verification protocols, satellite verification and data lineage',
    subMetrics:['Satellite Verification','Ground-Truth Frequency','Third-Party Audit','Data Lineage Score','Uncertainty Range'],
  },
];

/* ── Methodology Standards ── */
const STANDARDS = [
  { id:'EE-NF', name:'EE Native Forests', version:'3.2', category:'REDD+', status:'Certified',
    coverage:'Tropical / Subtropical', baseline_method:'VCS JNR + Dynamic Global Baseline',
    additionality:'Performance+Financial+Activity', permanence:'AFOLU Buffer (40yr)', mrv:'Satellite+Ground',
    score:91, creditsIssued:'4.2M tCO₂e', avgPrice:18.40, cobenefits:['FPIC','Water','Biodiversity','Gender'],
    yearsActive:7, jurisdictions:14,
  },
  { id:'EE-AR', name:'EE Agroforestry & Reforestation', version:'2.1', category:'A/R', status:'Certified',
    coverage:'Degraded Agricultural Land', baseline_method:'VCS BL-CUR × Biomass Growth Factors',
    additionality:'Financial+Activity', permanence:'Buffer (25yr)', mrv:'Drone+Satellite',
    score:84, creditsIssued:'1.8M tCO₂e', avgPrice:22.10, cobenefits:['FPIC','Livelihoods','Food Security'],
    yearsActive:5, jurisdictions:8,
  },
  { id:'EE-BS', name:'EE Blue Carbon – Seagrass', version:'1.4', category:'Blue Carbon', status:'Draft',
    coverage:'Coastal Seagrass Meadows', baseline_method:'EE Proprietary Tidal Model v2',
    additionality:'Activity+Financial', permanence:'Tidal Permanence Buffer (30yr)', mrv:'AUV+Satellite',
    score:76, creditsIssued:'0.3M tCO₂e', avgPrice:35.00, cobenefits:['Marine Biodiversity','Coastal Protection','Fisheries'],
    yearsActive:2, jurisdictions:4,
  },
  { id:'EE-PM', name:'EE Peatland Mosaic', version:'2.3', category:'Peatland', status:'Certified',
    coverage:'Tropical Peatswamp Forests', baseline_method:'IPCC Tier 3 + Emissions Factor Library',
    additionality:'Financial+Activity+Barrier', permanence:'Buffer+Legal (50yr)', mrv:'LiDAR+Ground',
    score:88, creditsIssued:'2.1M tCO₂e', avgPrice:28.50, cobenefits:['FPIC','Biodiversity','Water Regulation'],
    yearsActive:6, jurisdictions:6,
  },
  { id:'EE-SC', name:'EE Soil Carbon – Grasslands', version:'1.1', category:'Soil Carbon', status:'Draft',
    coverage:'Temperate & Semi-Arid Grasslands', baseline_method:'EE Tier 2 Soil Organic Carbon Model',
    additionality:'Activity+Financial', permanence:'Sampling-Buffer (15yr)', mrv:'Isotope+Remote Sensing',
    score:68, creditsIssued:'0.1M tCO₂e', avgPrice:15.20, cobenefits:['Livelihoods','Food Security'],
    yearsActive:1, jurisdictions:3,
  },
  { id:'EE-MC', name:'EE Mangrove Complex', version:'2.8', category:'Blue Carbon', status:'Certified',
    coverage:'Estuarine Mangrove Systems', baseline_method:'VM0033 + EE Salinity Adjustment Factor',
    additionality:'Activity+Financial', permanence:'Blue Carbon Buffer (35yr)', mrv:'Satellite+Field',
    score:86, creditsIssued:'1.5M tCO₂e', avgPrice:31.00, cobenefits:['FPIC','Fisheries','Storm Surge'],
    yearsActive:5, jurisdictions:9,
  },
];

/* ── Calculation Engine: Score a project against EE methodologies ── */
const calcScore = (inputs) => {
  const w = { EP:0.28, CO:0.24, AC:0.22, PM:0.16, MV:0.10 };
  const raw = {
    EP: (inputs.canopy * 0.3 + inputs.biodiversity * 0.25 + inputs.soilCarbon * 0.2 + inputs.hydrology * 0.15 + inputs.fireRisk * 0.1),
    CO: (inputs.fpic * 0.3 + inputs.livelihood * 0.25 + inputs.gender * 0.2 + inputs.indigenous * 0.15 + inputs.revShare * 0.1),
    AC: (inputs.additionality * 0.35 + inputs.leakage * 0.25 + inputs.counterfactual * 0.25 + inputs.causality * 0.15),
    PM: (inputs.reversal * 0.30 + inputs.buffer * 0.30 + inputs.monitoring * 0.20 + inputs.legalProtection * 0.20),
    MV: (inputs.satellite * 0.35 + inputs.groundTruth * 0.25 + inputs.audit * 0.25 + inputs.lineage * 0.15),
  };
  const pillarScores = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Math.min(100, Math.max(0, v))])
  );
  const overall = Object.entries(w).reduce((s, [k, wt]) => s + (pillarScores[k] || 0) * wt, 0);
  const creditMultiplier = overall / 100;
  const adjustedVolume = inputs.grossEmissions * creditMultiplier * (1 - inputs.leakagePct / 100) * (1 - inputs.bufferPct / 100);
  const tier = overall >= 85 ? 'Gold' : overall >= 70 ? 'Silver' : overall >= 55 ? 'Bronze' : 'Ineligible';
  return { pillarScores, overall: Math.round(overall * 10) / 10, tier, adjustedVolume: Math.round(adjustedVolume), creditMultiplier };
};

/* ── Project sample scores ── */
const PROJECTS = Array.from({ length: 16 }, (_, i) => {
  const methodIdx = i % STANDARDS.length;
  const std = STANDARDS[methodIdx];
  const base = std.score + (sr(i * 13) - 0.5) * 20;
  const epScore = Math.min(100, Math.max(30, base + sr(i * 3) * 15));
  const coScore = Math.min(100, Math.max(30, base + sr(i * 5) * 18));
  const acScore = Math.min(100, Math.max(30, base + sr(i * 7) * 12));
  const pmScore = Math.min(100, Math.max(30, base + sr(i * 9) * 14));
  const mvScore = Math.min(100, Math.max(30, base + sr(i * 11) * 16));
  const overall = epScore * 0.28 + coScore * 0.24 + acScore * 0.22 + pmScore * 0.16 + mvScore * 0.10;
  const tier = overall >= 85 ? 'Gold' : overall >= 70 ? 'Silver' : overall >= 55 ? 'Bronze' : 'Ineligible';
  const countries = ['Brazil','Indonesia','Cambodia','Peru','Kenya','DRC','Colombia','Malaysia','Laos','Papua NG','Bolivia','Honduras','Cameroon','Myanmar','Ecuador','Gabon'];
  return {
    id: `EE-PRJ-${String(i + 1).padStart(3, '0')}`,
    name: ['Amazon Mosaic Reserve','Kalimantan Peatland Complex','Mekong Floodplain Forest','Madre de Dios NF Buffer','Mt. Kenya Watershed','Congo Basin REDD+','Chocó Rainforest Corridor','Borneo Orangutan Habitat','Nam Et-Phou Louey','Sepik Lowland Forests','Madidi-Tambopata Corridor','Mesoamerican Barrier Reef','Dja-Odzala Corridor','Ayeyarwady Delta','Napo Headwaters','Lopé-Waka Mosaic'][i],
    country: countries[i],
    methodology: std.id,
    methodName: std.name,
    category: std.category,
    epScore: Math.round(epScore),
    coScore: Math.round(coScore),
    acScore: Math.round(acScore),
    pmScore: Math.round(pmScore),
    mvScore: Math.round(mvScore),
    overall: Math.round(overall),
    tier,
    area_ha: Math.round(50000 + sr(i * 17) * 450000),
    credits_issued: Math.round(100000 + sr(i * 19) * 900000),
    avg_price: Math.round((std.avgPrice + (sr(i * 23) - 0.5) * 8) * 10) / 10,
    vintage: 2020 + (i % 4),
    status: ['Active','Active','Active','Under Review','Active','Active','Active','Under Review','Active','Active','Active','Active','Active','Active','Draft','Active'][i],
    fpic: sr(i * 29) > 0.3 ? 'Compliant' : 'Partial',
  };
});

/* ── Methodology comparison over time ── */
const TIME_SERIES = Array.from({ length: 10 }, (_, y) => ({
  year: 2015 + y,
  'EE-NF': Math.round(72 + y * 2.1 + sr(y * 3) * 6),
  'EE-AR': Math.round(68 + y * 1.8 + sr(y * 5) * 5),
  'EE-PM': Math.round(75 + y * 1.9 + sr(y * 7) * 4),
  'EE-MC': Math.round(70 + y * 2.3 + sr(y * 11) * 5),
  'EE-BS': y >= 7 ? Math.round(62 + (y - 7) * 4.2 + sr(y * 9) * 6) : null,
}));

/* ── Radar data for a selected standard ── */
const radarData = (std) => PILLARS.map(p => ({
  subject: p.abbr,
  score: std.score + (sr(STANDARDS.indexOf(std) * 7 + PILLARS.indexOf(p)) - 0.5) * 15,
  fullMark: 100,
}));

/* ── Default calc engine inputs ── */
const DEFAULT_INPUTS = {
  canopy: 80, biodiversity: 72, soilCarbon: 68, hydrology: 75, fireRisk: 65,
  fpic: 88, livelihood: 78, gender: 72, indigenous: 85, revShare: 70,
  additionality: 82, leakage: 74, counterfactual: 79, causality: 76,
  reversal: 70, buffer: 78, monitoring: 82, legalProtection: 75,
  satellite: 85, groundTruth: 74, audit: 80, lineage: 76,
  grossEmissions: 500000,
  leakagePct: 12,
  bufferPct: 20,
};

/* ══════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function EquitableEarthMethodologiesPage() {
  const TABS = ['Methodology Overview', 'Standard Comparison', 'Project Scoring', 'Calculation Engine', 'Credit Integrity'];
  const [tab, setTab] = useState(TABS[0]);
  const [selectedStd, setSelectedStd] = useState(STANDARDS[0]);
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [sortCol, setSortCol] = useState('overall');
  const [tierFilter, setTierFilter] = useState('All');

  const result = useMemo(() => calcScore(inputs), [inputs]);

  const filteredProjects = PROJECTS.filter(p => tierFilter === 'All' || p.tier === tierFilter)
    .sort((a, b) => b[sortCol === 'overall' ? 'overall' : sortCol] - a[sortCol === 'overall' ? 'overall' : sortCol]);

  const pillarRadar = PILLARS.map(p => ({
    subject: p.abbr,
    score: Math.round(result.pillarScores[p.id]),
    weight: Math.round(p.weight * 100),
    fullMark: 100,
  }));

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: '20px 24px' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontFamily: T.mono, color: T.textMut, letterSpacing: '0.1em' }}>EP-BP1</span>
          <span style={{ width: 1, height: 12, background: T.border }} />
          <span style={{ fontSize: 9, fontFamily: T.mono, color: T.teal, fontWeight: 600 }}>EQUITABLE EARTH METHODOLOGIES</span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.navy, margin: 0 }}>Equitable Earth Methodology Framework & Calculation Engine</h1>
        <p style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
          Proprietary 5-pillar scoring framework · 6 standards · Project quality assessment · Credit volume calculator
        </p>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        <Kpi label="Standards" value="6" sub="4 Certified · 2 Draft" accent={T.emerald} />
        <Kpi label="Projects Assessed" value="16" sub="EE Framework v3.2" accent={T.teal} />
        <Kpi label="Credits Issued" value="10.0M" sub="tCO₂e All Standards" accent={T.gold} />
        <Kpi label="Avg Score" value={Math.round(PROJECTS.reduce((s, p) => s + p.overall, 0) / PROJECTS.length)} sub="EE Composite /100" accent={T.navy} />
        <Kpi label="Gold Tier" value={PROJECTS.filter(p => p.tier === 'Gold').length} sub={`${PROJECTS.filter(p => p.tier === 'Gold').length} of 16 projects`} accent="#c5a96a" color={T.goldD} />
        <Kpi label="FPIC Compliant" value={`${PROJECTS.filter(p => p.fpic === 'Compliant').length}/16`} sub="Indigenous Rights" accent={T.sage} />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ═══════════════════════════════════════════════════════ TAB 1 ══ */}
      {tab === 'Methodology Overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Pillar weights */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <Section title="5-Pillar Architecture & Weights">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={PILLARS.map(p => ({ name: p.abbr, weight: p.weight * 100, color: p.color }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 35]} tick={{ fontSize: 10, fontFamily: T.mono }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontFamily: T.mono, fill: T.navy }} width={32} />
                    <Tooltip contentStyle={TIP_STYLE} formatter={(v) => [`${v}%`, 'Weight']} />
                    <Bar dataKey="weight" radius={[0, 3, 3, 0]}>
                      {PILLARS.map((p, i) => (
                        <rect key={i} fill={p.color} />
                      ))}
                      {PILLARS.map((p) => (
                        <Bar key={p.id} dataKey="weight" fill={p.color} />
                      ))}
                    </Bar>
                    <Bar dataKey="weight" fill={T.teal} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>

            {/* Standards roster */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <Section title="Standards Roster" right={`${STANDARDS.filter(s => s.status === 'Certified').length} Certified`}>
                {STANDARDS.map(s => (
                  <div key={s.id} onClick={() => setSelectedStd(s)} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:4, cursor:'pointer',
                    background: selectedStd.id === s.id ? `${T.navy}08` : 'transparent',
                    border: `1px solid ${selectedStd.id === s.id ? T.border : 'transparent'}`,
                    marginBottom:4,
                  }}>
                    <div style={{ fontSize:10, fontFamily:T.mono, color:T.textMut, width:56 }}>{s.id}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:T.navy }}>{s.name}</div>
                      <div style={{ fontSize:10, color:T.textSec }}>{s.category} · v{s.version}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:T.navy, fontFamily:T.mono }}>{s.score}</span>
                      <Badge v={s.status} colors={{ Certified:'#059669', Draft:'#d97706' }} />
                    </div>
                  </div>
                ))}
              </Section>
            </div>
          </div>

          {/* Selected standard detail */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
            <Section title={`${selectedStd.name} — Standard Detail`} right={selectedStd.id}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>Baseline Method</div>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{selectedStd.baseline_method}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 10, marginBottom: 4 }}>Additionality Test</div>
                  <div style={{ fontSize: 12, color: T.text }}>{selectedStd.additionality}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 10, marginBottom: 4 }}>Permanence Mechanism</div>
                  <div style={{ fontSize: 12, color: T.text }}>{selectedStd.permanence}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 10, marginBottom: 4 }}>MRV Protocol</div>
                  <div style={{ fontSize: 12, color: T.text }}>{selectedStd.mrv}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>Credits Issued (Total)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{selectedStd.creditsIssued}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 10, marginBottom: 4 }}>Average Market Price</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.teal, fontFamily: T.mono }}>${selectedStd.avgPrice}/tCO₂e</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 10, marginBottom: 4 }}>Active Jurisdictions</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{selectedStd.jurisdictions}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 10, marginBottom: 4 }}>Co-Benefits</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {selectedStd.cobenefits.map(c => (
                      <span key={c} style={{ fontSize: 9, padding: '2px 6px', background: `${T.teal}15`, color: T.teal, borderRadius: 3, fontFamily: T.mono }}>{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMut, marginBottom: 8 }}>Pillar Scores (Radar)</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <RadarChart data={radarData(selectedStd)}>
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>
          </div>

          {/* Pillar descriptions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {PILLARS.map(p => (
              <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, borderTop: `3px solid ${p.color}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: p.color, fontFamily: T.mono, marginBottom: 4 }}>{p.abbr} — {p.weight * 100}%</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: T.textSec, marginBottom: 8, lineHeight: 1.4 }}>{p.desc}</div>
                <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4, fontWeight: 600 }}>Sub-Metrics:</div>
                {p.subMetrics.map(m => (
                  <div key={m} style={{ fontSize: 9, color: T.textSec, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: p.color }}>•</span> {m}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ TAB 2 ══ */}
      {tab === 'Standard Comparison' && (
        <>
          <Section title="Score Evolution by Standard (2015–2024)">
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={TIME_SERIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fontFamily: T.mono }} />
                  <YAxis domain={[55, 100]} tick={{ fontSize: 10, fontFamily: T.mono }} />
                  <Tooltip contentStyle={TIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.mono }} />
                  <Line dataKey="EE-NF" stroke="#16a34a" strokeWidth={2} dot={false} />
                  <Line dataKey="EE-PM" stroke="#0f766e" strokeWidth={2} dot={false} />
                  <Line dataKey="EE-MC" stroke="#1b3a5c" strokeWidth={2} dot={false} />
                  <Line dataKey="EE-AR" stroke="#b45309" strokeWidth={2} dot={false} />
                  <Line dataKey="EE-BS" stroke="#6d28d9" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Price vs Score scatter */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <Section title="Price vs Score — All Standards">
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="score" name="EE Score" type="number" domain={[60, 100]} tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: 'EE Score', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                    <YAxis dataKey="avgPrice" name="Price" tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: '$/tCO₂e', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <ZAxis dataKey="creditsIssued" range={[60, 300]} />
                    <Tooltip contentStyle={TIP_STYLE} formatter={(v, n) => [n === 'EE Score' ? v : `$${v}`, n]} />
                    <Scatter
                      data={STANDARDS.map(s => ({ score: s.score, avgPrice: s.avgPrice, creditsIssued: parseFloat(s.creditsIssued), name: s.name }))}
                      fill={T.teal}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Section>
            </div>

            {/* Credits Issued by standard */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <Section title="Credits Issued by Standard (M tCO₂e)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={STANDARDS.map(s => ({ name: s.id.replace('EE-', ''), credits: parseFloat(s.creditsIssued), status: s.status }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: T.mono }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                    <Tooltip contentStyle={TIP_STYLE} formatter={(v) => [`${v}M tCO₂e`]} />
                    <Bar dataKey="credits" radius={[3, 3, 0, 0]}>
                      {STANDARDS.map((s, i) => (
                        <rect key={i} fill={s.status === 'Certified' ? T.emerald : T.amber} />
                      ))}
                    </Bar>
                    <Bar dataKey="credits" fill={T.emerald} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>
          </div>

          {/* Comparison table */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy }}>
                  {['Standard', 'Category', 'Version', 'Baseline Method', 'Additionality', 'MRV', 'Score', 'Avg Price', 'Jurisdictions', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', color: T.cream, fontSize: 9, fontFamily: T.mono, textAlign: 'left', fontWeight: 600, letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STANDARDS.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? T.surface : `${T.cream}50`, borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{s.id}</td>
                    <td style={{ padding: '8px 10px', color: T.textSec }}>{s.category}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontSize: 10 }}>v{s.version}</td>
                    <td style={{ padding: '8px 10px', color: T.textSec, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.baseline_method}</td>
                    <td style={{ padding: '8px 10px', color: T.textSec, fontSize: 10 }}>{s.additionality}</td>
                    <td style={{ padding: '8px 10px', color: T.textSec, fontSize: 10 }}>{s.mrv}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{s.score}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.teal, fontWeight: 600 }}>${s.avgPrice}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{s.jurisdictions}</td>
                    <td style={{ padding: '8px 10px' }}><Badge v={s.status} colors={{ Certified:'#059669', Draft:'#d97706' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ TAB 3 ══ */}
      {tab === 'Project Scoring' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: T.textSec }}>Filter by Tier:</span>
            {['All', 'Gold', 'Silver', 'Bronze', 'Ineligible'].map(t => (
              <button key={t} onClick={() => setTierFilter(t)} style={{
                padding: '5px 12px', fontSize: 10, fontFamily: T.mono, cursor: 'pointer',
                border: `1px solid ${tierFilter === t ? T.navy : T.border}`,
                background: tierFilter === t ? T.navy : T.surface,
                color: tierFilter === t ? T.cream : T.textSec,
                borderRadius: 4,
              }}>{t} {t !== 'All' && `(${PROJECTS.filter(p => p.tier === t).length})`}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{filteredProjects.length} projects</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Score distribution */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <Section title="Score Distribution by Pillar">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={PILLARS.map(p => {
                    const key = p.id.toLowerCase() + 'Score';
                    const scores = { EP: PROJECTS.map(pr => pr.epScore), CO: PROJECTS.map(pr => pr.coScore), AC: PROJECTS.map(pr => pr.acScore), PM: PROJECTS.map(pr => pr.pmScore), MV: PROJECTS.map(pr => pr.mvScore) };
                    const arr = scores[p.id] || [];
                    return { name: p.abbr, avg: Math.round(arr.reduce((s, v) => s + v, 0) / arr.length), min: Math.min(...arr), max: Math.max(...arr) };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: T.mono }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontFamily: T.mono }} />
                    <Tooltip contentStyle={TIP_STYLE} />
                    <Bar dataKey="avg" fill={T.teal} name="Avg Score" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="min" fill={`${T.red}60`} name="Min" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>

            {/* Tier distribution */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <Section title="Tier Distribution">
                {['Gold', 'Silver', 'Bronze', 'Ineligible'].map(tier => {
                  const count = PROJECTS.filter(p => p.tier === tier).length;
                  const pct = (count / PROJECTS.length) * 100;
                  const colors = { Gold: '#c5a96a', Silver: '#9ca3af', Bronze: '#cd7f32', Ineligible: T.red };
                  return (
                    <div key={tier} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: T.navy, fontWeight: 600 }}>{tier}</span>
                        <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{count} projects · {pct.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: colors[tier], borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 12, padding: '10px 12px', background: `${T.gold}15`, borderRadius: 4, border: `1px solid ${T.gold}40` }}>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 2 }}>Methodology Coverage</div>
                  {STANDARDS.map(s => {
                    const cnt = PROJECTS.filter(p => p.methodology === s.id).length;
                    return <div key={s.id} style={{ fontSize: 10, color: T.textSec, display:'flex', justifyContent:'space-between' }}><span>{s.id}</span><span style={{ fontFamily:T.mono }}>{cnt} projects</span></div>;
                  })}
                </div>
              </Section>
            </div>
          </div>

          {/* Project table */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy }}>
                  {['ID', 'Project Name', 'Country', 'Methodology', 'EP', 'CO', 'AC', 'PM', 'MV', 'Overall', 'Tier', 'Area (ha)', 'Vintage', 'Status', 'FPIC'].map(h => (
                    <th key={h} onClick={() => h === 'Overall' && setSortCol('overall')} style={{ padding: '8px 8px', color: T.cream, fontSize: 9, fontFamily: T.mono, textAlign: 'left', fontWeight: 600, letterSpacing: '0.06em', cursor: h === 'Overall' ? 'pointer' : 'default' }}>{h}{h === 'Overall' ? ' ↓' : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p, i) => {
                  const tierColors = { Gold: '#c5a96a', Silver: '#9ca3af', Bronze: '#cd7f32', Ineligible: T.red };
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.surface : `${T.cream}50`, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono, fontSize: 9, color: T.textMut }}>{p.id}</td>
                      <td style={{ padding: '7px 8px', fontWeight: 600, color: T.navy, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ padding: '7px 8px', color: T.textSec, fontSize: 10 }}>{p.country}</td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono, fontSize: 9, color: T.teal }}>{p.methodology}</td>
                      {[p.epScore, p.coScore, p.acScore, p.pmScore, p.mvScore].map((sc, j) => (
                        <td key={j} style={{ padding: '7px 8px', fontFamily: T.mono, fontSize: 10, color: sc >= 80 ? T.green : sc >= 65 ? T.amber : T.red, fontWeight: 600 }}>{sc}</td>
                      ))}
                      <td style={{ padding: '7px 8px', fontFamily: T.mono, fontWeight: 700, fontSize: 12, color: T.navy }}>{p.overall}</td>
                      <td style={{ padding: '7px 8px' }}><span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: `${tierColors[p.tier]}20`, color: tierColors[p.tier] }}>{p.tier}</span></td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono, fontSize: 10 }}>{p.area_ha.toLocaleString()}</td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono, fontSize: 10 }}>{p.vintage}</td>
                      <td style={{ padding: '7px 8px' }}><Badge v={p.status} colors={{ Active:'#059669', Draft:'#d97706', 'Under Review':'#0f766e' }} /></td>
                      <td style={{ padding: '7px 8px' }}><Badge v={p.fpic} colors={{ Compliant:'#059669', Partial:'#d97706' }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ TAB 4 ══ */}
      {tab === 'Calculation Engine' && (
        <>
          <div style={{ background: `${T.navy}08`, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.navy, fontWeight: 600 }}>EE CALC ENGINE v3.2</span>
            <span style={{ fontSize: 10, color: T.textSec }}>Adjust sub-metric scores (0–100) and project parameters to calculate EE composite score and adjusted credit volume.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            {/* Input panel */}
            <div>
              {PILLARS.map(p => (
                <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, marginBottom: 10, borderLeft: `4px solid ${p.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.name} ({p.abbr})</span>
                    <span style={{ fontSize: 11, fontFamily: T.mono, color: T.navy, fontWeight: 700 }}>
                      Score: {Math.round(result.pillarScores[p.id])}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                    {p.subMetrics.map((m, mi) => {
                      const keys = {
                        EP: ['canopy','biodiversity','soilCarbon','hydrology','fireRisk'],
                        CO: ['fpic','livelihood','gender','indigenous','revShare'],
                        AC: ['additionality','leakage','counterfactual','causality','fireRisk'],
                        PM: ['reversal','buffer','monitoring','legalProtection','fireRisk'],
                        MV: ['satellite','groundTruth','audit','lineage','fireRisk'],
                      };
                      const inputKey = (keys[p.id] || [])[mi];
                      if (!inputKey || !(inputKey in inputs)) return <div key={mi} />;
                      return (
                        <div key={m}>
                          <div style={{ fontSize: 9, color: T.textMut, marginBottom: 3, lineHeight: 1.2 }}>{m}</div>
                          <input
                            type="number" min={0} max={100} value={inputs[inputKey]}
                            onChange={e => setInputs(prev => ({ ...prev, [inputKey]: Math.min(100, Math.max(0, +e.target.value)) }))}
                            style={{ width: '100%', padding: '4px 6px', border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 11, fontFamily: T.mono, color: T.navy, background: T.cream, outline: 'none' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Volume inputs */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, borderLeft: `4px solid ${T.gold}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Project Volume Parameters</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { key: 'grossEmissions', label: 'Gross Emissions (tCO₂e)', max: 5000000 },
                    { key: 'leakagePct', label: 'Leakage Deduction (%)', max: 50 },
                    { key: 'bufferPct', label: 'Buffer Pool (%)', max: 40 },
                  ].map(({ key, label, max }) => (
                    <div key={key}>
                      <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>{label}</div>
                      <input
                        type="number" min={0} max={max} value={inputs[key]}
                        onChange={e => setInputs(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, +e.target.value)) }))}
                        style={{ width: '100%', padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 12, fontFamily: T.mono, color: T.navy, background: T.cream, outline: 'none' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Results panel */}
            <div>
              <div style={{ background: T.navy, borderRadius: 6, padding: 16, marginBottom: 12, color: T.cream }}>
                <div style={{ fontSize: 10, fontFamily: T.mono, color: `${T.cream}80`, letterSpacing: '0.1em', marginBottom: 4 }}>EE COMPOSITE SCORE</div>
                <div style={{ fontSize: 48, fontWeight: 700, fontFamily: T.mono, lineHeight: 1 }}>{result.overall}</div>
                <div style={{ fontSize: 11, color: `${T.cream}80`, marginTop: 4 }}>/100 · EE Framework v3.2</div>
                <div style={{ marginTop: 12, padding: '8px 12px', background: result.tier === 'Gold' ? '#c5a96a30' : result.tier === 'Silver' ? '#9ca3af30' : result.tier === 'Bronze' ? '#cd7f3230' : '#dc262630', borderRadius: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: result.tier === 'Gold' ? '#c5a96a' : result.tier === 'Silver' ? '#d1d5db' : result.tier === 'Bronze' ? '#cd7f32' : '#fca5a5' }}>
                    {result.tier === 'Gold' ? '🥇' : result.tier === 'Silver' ? '🥈' : result.tier === 'Bronze' ? '🥉' : '❌'} {result.tier} Tier
                  </div>
                  <div style={{ fontSize: 9, color: `${T.cream}70`, marginTop: 2 }}>
                    {result.tier === 'Gold' ? '≥85 — Premium listing eligible' : result.tier === 'Silver' ? '70–84 — Standard listing eligible' : result.tier === 'Bronze' ? '55–69 — Restricted market access' : '<55 — EE methodology ineligible'}
                  </div>
                </div>
              </div>

              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, marginBottom: 12 }}>
                <Section title="Pillar Scores">
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={pillarRadar}>
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontFamily: T.mono, fill: T.textSec }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                  {PILLARS.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 10, color: p.color, fontWeight: 600 }}>{p.abbr}</span>
                      <span style={{ fontSize: 10, fontFamily: T.mono }}>{p.weight * 100}% weight</span>
                      <span style={{ fontSize: 11, fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{Math.round(result.pillarScores[p.id])}</span>
                    </div>
                  ))}
                </Section>
              </div>

              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                <Section title="Adjusted Credit Volume">
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.teal, fontFamily: T.mono }}>
                    {result.adjustedVolume.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 12 }}>tCO₂e · Net issuable credits</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>Calculation breakdown:</div>
                  <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.mono, lineHeight: 1.7 }}>
                    Gross:    {inputs.grossEmissions.toLocaleString()} tCO₂e<br />
                    × Quality:{(result.creditMultiplier * 100).toFixed(1)}%<br />
                    − Leakage:{inputs.leakagePct}%<br />
                    − Buffer: {inputs.bufferPct}%<br />
                    <span style={{ color: T.teal, fontWeight: 700 }}>= {result.adjustedVolume.toLocaleString()} tCO₂e</span>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ TAB 5 ══ */}
      {tab === 'Credit Integrity' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            <Kpi label="Gold Tier Credits" value={`${PROJECTS.filter(p => p.tier === 'Gold').reduce((s, p) => s + p.credits_issued, 0).toLocaleString()}`} sub="tCO₂e premium quality" accent="#c5a96a" color={T.goldD} />
            <Kpi label="FPIC Fully Compliant" value={`${Math.round(PROJECTS.filter(p => p.fpic === 'Compliant').length / PROJECTS.length * 100)}%`} sub={`${PROJECTS.filter(p => p.fpic === 'Compliant').length} of 16 projects`} accent={T.teal} />
            <Kpi label="Avg Leakage Adj." value="12%" sub="Frontier deduction" accent={T.amber} />
            <Kpi label="Buffer Pool Avg" value="20%" sub="AFOLU / Blue Carbon" accent={T.purple} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Integrity pricing premium */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <Section title="Integrity Score vs Price Premium ($/tCO₂e)">
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="overall" name="EE Score" type="number" domain={[50, 100]} tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: 'EE Score', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                    <YAxis dataKey="avg_price" name="Price" tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: '$/tCO₂e', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip contentStyle={TIP_STYLE} formatter={(v, n) => [n === 'EE Score' ? v : `$${v}/tCO₂e`, n]} />
                    <Scatter data={PROJECTS} fill={T.teal} opacity={0.7} />
                    <ReferenceLine x={85} stroke={T.gold} strokeDasharray="4 2" label={{ value: 'Gold', fill: T.goldD, fontSize: 9 }} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Section>
            </div>

            {/* Co-benefits breakdown */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <Section title="Co-Benefits Coverage by Standard">
                {STANDARDS.map(s => (
                  <div key={s.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut, width: 48 }}>{s.id}</span>
                      <span style={{ fontSize: 10, color: T.navy, fontWeight: 600 }}>{s.name.split('–')[0].trim()}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {s.cobenefits.map(c => (
                        <span key={c} style={{ fontSize: 9, padding: '2px 6px', background: `${T.sage}20`, color: T.sage, borderRadius: 3, fontFamily: T.mono, fontWeight: 600 }}>{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </Section>
            </div>
          </div>

          {/* Integrity risk flags */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
            <Section title="Credit Integrity Risk Framework">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { risk: 'Reversal Risk', desc: 'Physical permanence failure due to fire, drought, deforestation, or climate change. Mitigated by buffer pool mechanism.', level: 'Medium', mitigation: 'AFOLU Buffer 15-40%' },
                  { risk: 'Additionality Risk', desc: 'Credits claimed without genuine counterfactual analysis. High in markets with poor baseline data or conservative baselines.', level: 'High', mitigation: 'EE AC sub-metric threshold 70+' },
                  { risk: 'Leakage Risk', desc: 'Displacement of emissions to areas outside project boundary. Market/activity leakage requires belt-and-suspenders accounting.', level: 'Medium', mitigation: 'Frontier Deduction 10-20%' },
                  { risk: 'Greenwash Risk', desc: 'Over-claiming or double counting by project developers. ICVCM CCP standards reduce but don\'t eliminate this risk.', level: 'Low', mitigation: 'EE MV pillar score + Audit' },
                  { risk: 'Baseline Inflation', desc: 'Reference deforestation rates set too high. Historical reference periods vulnerable to gaming during methodology design.', level: 'High', mitigation: 'Dynamic national baseline mandate' },
                  { risk: 'Social/FPIC Risk', desc: 'Insufficient consultation or benefit-sharing with indigenous communities. Reputational and legal risk for buyers.', level: 'Medium', mitigation: 'EE CO pillar FPIC sub-metric ≥80' },
                ].map(r => (
                  <div key={r.risk} style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 4, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{r.risk}</span>
                      <Badge v={r.level} />
                    </div>
                    <div style={{ fontSize: 10, color: T.textSec, marginBottom: 6, lineHeight: 1.4 }}>{r.desc}</div>
                    <div style={{ fontSize: 9, color: T.teal, fontFamily: T.mono, fontWeight: 600 }}>✓ {r.mitigation}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Trend: integrity scores over time */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <Section title="EE Methodology Quality Trend — Issued Vintage vs EE Score">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={Array.from({ length: 5 }, (_, i) => {
                  const vintage = 2020 + i;
                  const pts = PROJECTS.filter(p => p.vintage === vintage);
                  const avg = pts.length > 0 ? pts.reduce((s, p) => s + p.overall, 0) / pts.length : 0;
                  return { vintage, avgScore: Math.round(avg), count: pts.length, totalCredits: pts.reduce((s, p) => s + p.credits_issued, 0) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="vintage" tick={{ fontSize: 10, fontFamily: T.mono }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 10, fontFamily: T.mono }} />
                  <Tooltip contentStyle={TIP_STYLE} />
                  <Area dataKey="avgScore" stroke={T.teal} fill={`${T.teal}20`} strokeWidth={2} name="Avg EE Score" />
                </AreaChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
