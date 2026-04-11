import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TOOLS = ['TOOL01','TOOL02','TOOL07','TOOL21','TOOL01+TOOL02'];
const PROJ_TYPES = ['Solar PV','Wind Onshore','Biogas Digester','LED Lighting Retrofit','EV Fleet Conversion','Composting Facility','Small Hydro','Biomass CHP','Landfill Gas','Cookstoves','Manure Digester','Run-of-River Hydro'];
const COUNTRIES = ['India','China','Brazil','Kenya','Indonesia','Vietnam','Mexico','Bangladesh','Colombia','Nigeria','Ethiopia','Ghana','Pakistan','Philippines','Thailand','Tanzania','Uganda','South Africa','Morocco','Peru'];
const ASSESSORS = ['Bureau Veritas','DNV','SGS','TÜV SÜD','KPMG','EY','SCS Global','Intertek','Ecometrica','South Pole'];
const SDG_OPTIONS = [[7,13,1],[7,13,8],[6,13,15],[11,13,9],[7,11,13],[12,13,15],[6,7,13],[7,8,9],[13,15,12],[1,7,13]];
const BARRIERS = ['Investment','Technological','Prevailing Practice','Institutional/Regulatory'];

const PROJECTS = Array.from({ length: 40 }, (_, i) => {
  const wacc  = 8 + sr(i * 7 + 1) * 7;
  const irr   = 4 + sr(i * 11 + 2) * 16;
  const capex = 500000 + sr(i * 13 + 3) * 9500000;
  const rev   = 80000 + sr(i * 17 + 4) * 1920000;
  const pen   = sr(i * 19 + 5) * 25;
  const addl  = irr < wacc ? 'Additional' : pen < 10 ? 'Additional' : sr(i * 23 + 6) > 0.7 ? 'Non-Additional' : 'Pending';
  return {
    id: `BA-${String(i + 1).padStart(3,'0')}`,
    name: `${PROJ_TYPES[i % 12]} — ${COUNTRIES[i % 20]}`,
    type: PROJ_TYPES[i % 12],
    country: COUNTRIES[i % 20],
    sector: ['Energy','Transport','Waste','Agriculture','Industry'][i % 5],
    tool: TOOLS[i % 5],
    irr: parseFloat(irr.toFixed(2)),
    wacc: parseFloat(wacc.toFixed(2)),
    penetrationPct: parseFloat(pen.toFixed(1)),
    additionalityResult: addl,
    capex_usd: Math.round(capex),
    annualRevenue_usd: Math.round(rev),
    projectLifetime_yrs: 15 + Math.floor(sr(i * 29 + 7) * 10),
    barriers: [
      parseFloat((1 + sr(i * 31 + 8)  * 4).toFixed(1)),
      parseFloat((1 + sr(i * 37 + 9)  * 4).toFixed(1)),
      parseFloat((1 + sr(i * 41 + 10) * 4).toFixed(1)),
      parseFloat((1 + sr(i * 43 + 11) * 4).toFixed(1)),
    ],
    sdgContribution: SDG_OPTIONS[i % 10],
    barrierAnalysisDate: `${2023 + Math.floor(sr(i * 47 + 12) * 2)}-${String(Math.floor(sr(i * 53 + 13) * 12 + 1)).padStart(2,'0')}`,
    assessor: ASSESSORS[i % 10],
    regulatoryStatus: ['No legal requirement','Voluntary','Policy incentive','Partial regulation'][Math.floor(sr(i * 59 + 14) * 4)],
    commonPracticeRef: `CDM-${Math.floor(sr(i * 61 + 15) * 150 + 5)} registered projects (${COUNTRIES[i % 20]}, ${PROJ_TYPES[i % 12]})`,
    carCount: Math.floor(sr(i * 67 + 16) * 4),
    completeness: Math.round(60 + sr(i * 71 + 17) * 40),
  };
});

// Country × Technology penetration matrix (20 countries × 6 tech)
const TECH_TYPES = ['Solar PV','Wind Onshore','Biogas Digesters','LED Lighting','EV Fleet','Compost Facilities'];
const PENETRATION = COUNTRIES.map((c, ci) => ({
  country: c,
  solar:  parseFloat((2 + sr(ci * 7 + 1)  * 33).toFixed(1)),
  wind:   parseFloat((1 + sr(ci * 11 + 2) * 24).toFixed(1)),
  biogas: parseFloat((0.5 + sr(ci * 13 + 3) * 7.5).toFixed(1)),
  led:    parseFloat((15 + sr(ci * 17 + 4) * 65).toFixed(1)),
  ev:     parseFloat((0.1 + sr(ci * 19 + 5) * 11.9).toFixed(1)),
  compost:parseFloat((1 + sr(ci * 23 + 6) * 19).toFixed(1)),
}));

// OM/BM data for TOOL07
const TOOL07_DATA = COUNTRIES.map((c, ci) => ({
  country: c,
  plants: [
    { type: 'Coal', share: parseFloat((10 + sr(ci * 31 + 7) * 50).toFixed(1)), ef: parseFloat((0.9 + sr(ci * 37 + 8) * 0.2).toFixed(3)) },
    { type: 'Gas CCGT', share: parseFloat((5 + sr(ci * 41 + 9) * 30).toFixed(1)), ef: parseFloat((0.35 + sr(ci * 43 + 10) * 0.15).toFixed(3)) },
    { type: 'Oil/Diesel', share: parseFloat((2 + sr(ci * 47 + 11) * 20).toFixed(1)), ef: parseFloat((0.65 + sr(ci * 53 + 12) * 0.1).toFixed(3)) },
    { type: 'Hydro', share: parseFloat((5 + sr(ci * 59 + 13) * 30).toFixed(1)), ef: 0.005 },
    { type: 'Wind/Solar', share: parseFloat((1 + sr(ci * 61 + 14) * 15).toFixed(1)), ef: 0.011 },
  ],
  recentPlants: [
    { type: 'Coal', mw: parseFloat((200 + sr(ci * 67 + 15) * 800).toFixed(0)), ef: parseFloat((0.88 + sr(ci * 71 + 16) * 0.15).toFixed(3)) },
    { type: 'Gas CCGT', mw: parseFloat((100 + sr(ci * 73 + 17) * 500).toFixed(0)), ef: parseFloat((0.35 + sr(ci * 79 + 18) * 0.1).toFixed(3)) },
    { type: 'Solar PV', mw: parseFloat((50 + sr(ci * 83 + 19) * 400).toFixed(0)), ef: 0.011 },
  ],
}));

const TABS = ['Assessment Pipeline','TOOL01 Investment Analysis','TOOL02 Common Practice','TOOL07 Grid EF','TOOL21 Small-Scale','Barrier Analysis Matrix','Sensitivity & Scenarios','Validation Evidence Log'];

const fmt  = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtM = n => `$${(n / 1e6).toFixed(2)}M`;
const fmtK = n => `$${(n / 1000).toFixed(0)}K`;

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const ResultBadge = ({ result }) => {
  const map = { Additional: T.green, 'Non-Additional': T.red, Pending: T.amber };
  const c = map[result] || T.textSec;
  return <span style={{ background: c + '22', color: c, border: `1px solid ${c}55`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: T.fontMono, fontWeight: 700 }}>{result}</span>;
};

const RegBox = ({ title, refs }) => (
  <div style={{ background: T.navy + '08', border: `1px solid ${T.navy}22`, borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono, marginBottom: 4 }}>{title}</div>
    {refs.map((r, i) => <div key={i} style={{ fontSize: 11, color: T.textSec }}>{r}</div>)}
  </div>
);

const SliderRow = ({ label, val, setVal, min, max, step = 1, unit = '' }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{fmt(val, step < 1 ? 1 : 0)}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={val} onChange={e => setVal(Number(e.target.value))}
      style={{ width: '100%', accentColor: T.navy }} />
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 10, color: T.textSec }}>{min}{unit}</span>
      <span style={{ fontSize: 10, color: T.textSec }}>{max}{unit}</span>
    </div>
  </div>
);

export default function BaselineAdditionalityPage() {
  const [activeTab,  setActiveTab]  = useState(0);
  const [sortField,  setSortField]  = useState('irr');
  const [sortDir,    setSortDir]    = useState('asc');
  const [filterRes,  setFilterRes]  = useState('All');
  const [filterTool, setFilterTool] = useState('All');

  // TOOL01 state
  const [t1Capex,   setT1Capex]   = useState(2000000);
  const [t1Om,      setT1Om]      = useState(120000);
  const [t1RevNC,   setT1RevNC]   = useState(280000);
  const [t1Credits, setT1Credits] = useState(8000);
  const [t1Price,   setT1Price]   = useState(12);
  const [t1Wacc,    setT1Wacc]    = useState(10);
  const [t1Life,    setT1Life]    = useState(20);

  // TOOL02 state
  const [t2Country,  setT2Country]  = useState('India');
  const [t2Tech,     setT2Tech]     = useState('solar');
  const [t2Pen,      setT2Pen]      = useState(8.5);
  const [t2Threshold,setT2Threshold]= useState(10);

  // TOOL07 state
  const [t7Country,  setT7Country]  = useState('India');
  const [t7WOm,      setT7WOm]      = useState(0.5);

  // TOOL21 wizard state
  const [t21Step1,   setT21Step1]   = useState(null); // null=unanswered, true/false
  const [t21Step2,   setT21Step2]   = useState(null);
  const [t21Step3,   setT21Step3]   = useState(null);
  const [t21IRR,     setT21IRR]     = useState(9.5);
  const [t21WACC,    setT21WACC]    = useState(12.0);
  const [t21RegPrj,  setT21RegPrj]  = useState(3);

  // Sensitivity state
  const [sensPriceIdx, setSensPriceIdx] = useState(1);
  const [sensWaccIdx,  setSensWaccIdx]  = useState(2);
  const [sensPenIdx,   setSensPenIdx]   = useState(1);

  // Evidence log
  const [evidProj, setEvidProj] = useState(0);

  const sortedProjects = useMemo(() => {
    let p = [...PROJECTS];
    if (filterRes  !== 'All') p = p.filter(x => x.additionalityResult === filterRes);
    if (filterTool !== 'All') p = p.filter(x => x.tool === filterTool);
    return p.sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [sortField, sortDir, filterRes, filterTool]);

  const pipelineKpis = useMemo(() => {
    const add   = PROJECTS.filter(p => p.additionalityResult === 'Additional').length;
    const noAdd = PROJECTS.filter(p => p.additionalityResult === 'Non-Additional').length;
    const pend  = PROJECTS.filter(p => p.additionalityResult === 'Pending').length;
    const avgIRR  = PROJECTS.reduce((s, p) => s + p.irr, 0) / Math.max(1, PROJECTS.length);
    const avgWACC = PROJECTS.reduce((s, p) => s + p.wacc, 0) / Math.max(1, PROJECTS.length);
    return { add, noAdd, pend, addPct: (add / Math.max(1, PROJECTS.length) * 100).toFixed(0), avgIRR, avgWACC };
  }, []);

  // TOOL01 NPV calculation
  const tool01 = useMemo(() => {
    const carbonRev = t1Credits * t1Price;
    const cfNC = t1RevNC - t1Om;
    const cfC  = t1RevNC + carbonRev - t1Om;
    let npvNC = -t1Capex, npvC = -t1Capex;
    for (let t = 1; t <= t1Life; t++) {
      npvNC += cfNC / Math.pow(1 + t1Wacc / 100, t);
      npvC  += cfC  / Math.pow(1 + t1Wacc / 100, t);
    }

    // Solve IRR without carbon (bisection)
    let lo = -0.5, hi = 5.0, irrNC = 0;
    for (let iter = 0; iter < 60; iter++) {
      const mid = (lo + hi) / 2;
      let pv = -t1Capex;
      for (let t = 1; t <= t1Life; t++) pv += cfNC / Math.pow(1 + mid, t);
      if (pv > 0) lo = mid; else hi = mid;
      irrNC = (lo + hi) / 2;
    }
    let lo2 = -0.5, hi2 = 5.0, irrC = 0;
    for (let iter = 0; iter < 60; iter++) {
      const mid = (lo2 + hi2) / 2;
      let pv = -t1Capex;
      for (let t = 1; t <= t1Life; t++) pv += cfC / Math.pow(1 + mid, t);
      if (pv > 0) lo2 = mid; else hi2 = mid;
      irrC = (lo2 + hi2) / 2;
    }

    const payback = cfNC > 0 ? t1Capex / cfNC : Infinity;
    const bcRatio = cfNC > 0 ? (npvNC + t1Capex) / t1Capex : 0;
    const barrier = irrNC * 100 < t1Wacc;

    const scenarios = [5, 10, 15, 20, 25].map(cp => {
      const cfS = t1RevNC + t1Credits * cp - t1Om;
      let lo3 = -0.5, hi3 = 5.0;
      for (let iter = 0; iter < 50; iter++) {
        const mid = (lo3 + hi3) / 2;
        let pv = -t1Capex;
        for (let t = 1; t <= t1Life; t++) pv += cfS / Math.pow(1 + mid, t);
        if (pv > 0) lo3 = mid; else hi3 = mid;
      }
      return { cp, irr: ((lo3 + hi3) / 2 * 100).toFixed(2), addl: (lo3 + hi3) / 2 * 100 < t1Wacc };
    });

    return { npvNC, npvC, irrNC: irrNC * 100, irrC: irrC * 100, payback, bcRatio, barrier, scenarios };
  }, [t1Capex, t1Om, t1RevNC, t1Credits, t1Price, t1Wacc, t1Life]);

  // TOOL02 country penetration lookup
  const t2Data  = PENETRATION.find(r => r.country === t2Country) || PENETRATION[0];
  const t2Value = t2Data[t2Tech];
  const t2Addl  = t2Value < t2Threshold;

  // TOOL07 OM/BM/CM computation
  const t7GridData = TOOL07_DATA.find(d => d.country === t7Country) || TOOL07_DATA[0];
  const t7Total    = t7GridData.plants.reduce((s, p) => s + p.share, 0);
  const t7OM       = t7GridData.plants.reduce((s, p) => s + (p.share / Math.max(1, t7Total)) * p.ef, 0);
  const t7BMTotal  = t7GridData.recentPlants.reduce((s, p) => s + p.mw, 0);
  const t7BM       = t7GridData.recentPlants.reduce((s, p) => s + (p.mw / Math.max(1, t7BMTotal)) * p.ef, 0);
  const t7CM       = t7WOm * t7OM + (1 - t7WOm) * t7BM;

  // TOOL21 wizard logic
  const t21Result = useMemo(() => {
    if (t21Step1 === true)  return { step: 1, result: 'NON-ADDITIONAL', color: T.red, reason: 'Required by law — cannot be additional per UNFCCC Decision 17/CP.7' };
    if (t21Step1 === false && t21Step2 === true)  return { step: 2, result: 'ADDITIONAL', color: T.green, reason: 'Investment barrier confirmed: IRR < WACC without carbon revenue' };
    if (t21Step1 === false && t21Step2 === false && t21Step3 === true)  return { step: 3, result: 'ADDITIONAL', color: T.green, reason: 'Common practice barrier confirmed: fewer than 5 registered projects' };
    if (t21Step1 === false && t21Step2 === false && t21Step3 === false) return { step: 3, result: 'NON-ADDITIONAL', color: T.red, reason: 'Activity not additional: common practice in region/sector' };
    return null;
  }, [t21Step1, t21Step2, t21Step3]);

  // Sensitivity matrices
  const WACC_RANGE  = [6, 8, 10, 12, 15];
  const PRICE_RANGE = [5, 10, 15, 20];
  const PEN_RANGE   = [5, 10, 15, 20];

  const waccSens = WACC_RANGE.map(w => ({
    wacc: w,
    addl: PROJECTS.filter(p => p.tool.includes('TOOL01') && p.irr < w).length,
    nonAddl: PROJECTS.filter(p => p.tool.includes('TOOL01') && p.irr >= w).length,
  }));

  const priceSens = PRICE_RANGE.map(pr => ({
    price: pr,
    posNPV: PROJECTS.filter(p => {
      const cfC = p.annualRevenue_usd + 5000 * pr - p.capex_usd * 0.05;
      let npv = -p.capex_usd;
      for (let t = 1; t <= p.projectLifetime_yrs; t++) npv += cfC / Math.pow(1.10, t);
      return npv > 0;
    }).length,
  }));

  const penSens = PEN_RANGE.map(th => ({
    threshold: th,
    qualifies: PROJECTS.filter(p => p.penetrationPct < th).length,
  }));

  // Evidence log
  const EVID_ITEMS = [
    'Investment analysis workbook (Excel/PDF)',
    'Market survey / penetration study',
    'Technology supplier quotes',
    'Legal / regulatory review',
    'VVB assessment memo',
    'Stakeholder comments addressed',
    'CDM EB communication',
  ];
  const evidProjects = PROJECTS.filter(p => p.additionalityResult === 'Additional').slice(0, 12);
  const evidPrj = evidProjects[evidProj] || evidProjects[0];

  const handleSort = field => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const thS = field => ({
    padding: '8px 10px', background: T.sub, fontSize: 11, fontFamily: T.fontMono,
    color: sortField === field ? T.navy : T.textSec, textAlign: 'left', cursor: 'pointer',
    fontWeight: sortField === field ? 700 : 400, whiteSpace: 'nowrap',
    borderBottom: `1px solid ${T.border}`,
  });
  const tdS = { padding: '7px 10px', fontSize: 12, color: T.textPri, borderBottom: `1px solid ${T.borderL}`, verticalAlign: 'middle' };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px 32px', fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 4, height: 36, background: T.gold, borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.navy }}>Baseline & Additionality Analyzer</div>
            <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>TOOL01 · TOOL02 · TOOL07 · TOOL21 — UNFCCC CDM EB Additionality Framework</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[['UNFCCC Decision 4/CMP.1 Annex II', T.navy],['CDM EB47 Annex 13', T.indigo],['ISO 14064-3 §6.5', T.sage],['40 Projects Pipeline', T.gold],['TOOL01 v8 · TOOL02 v5', T.teal]].map(([l, c]) => (
            <span key={l} style={{ fontSize: 11, background: c + '14', color: c, padding: '3px 10px', borderRadius: 4, fontFamily: T.fontMono }}>{l}</span>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '9px 14px', fontSize: 12, fontWeight: activeTab === i ? 700 : 500,
            color: activeTab === i ? T.navy : T.textSec, background: 'none', border: 'none',
            borderBottom: activeTab === i ? `3px solid ${T.navy}` : '3px solid transparent',
            cursor: 'pointer', fontFamily: T.fontMono, whiteSpace: 'nowrap', marginBottom: -2,
          }}>{t}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 0 — Assessment Pipeline
      ══════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
            <KpiCard label="Total Projects" value={PROJECTS.length.toString()} sub="in assessment pipeline" color={T.navy} />
            <KpiCard label="Additional" value={`${pipelineKpis.add} (${pipelineKpis.addPct}%)`} sub="pass investment/common practice" color={T.green} />
            <KpiCard label="Non-Additional" value={pipelineKpis.noAdd.toString()} sub="fail all 3 steps" color={T.red} />
            <KpiCard label="Pending Review" value={pipelineKpis.pend.toString()} sub="awaiting VVB assessment" color={T.amber} />
            <KpiCard label="Avg Project IRR" value={`${pipelineKpis.avgIRR.toFixed(1)}%`} sub="without carbon revenue" color={T.orange} />
            <KpiCard label="Avg WACC" value={`${pipelineKpis.avgWACC.toFixed(1)}%`} sub="hurdle rate, portfolio avg" color={T.indigo} />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {['All','Additional','Non-Additional','Pending'].map(r => (
              <button key={r} onClick={() => setFilterRes(r)} style={{
                padding: '4px 12px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                background: filterRes === r ? T.navy : T.card, color: filterRes === r ? '#fff' : T.textSec,
                border: `1px solid ${T.border}`, fontFamily: T.fontMono,
              }}>{r}</button>
            ))}
            <span style={{ borderLeft: `1px solid ${T.border}`, margin: '0 6px' }} />
            {['All', ...TOOLS].map(t => (
              <button key={t} onClick={() => setFilterTool(t)} style={{
                padding: '4px 12px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                background: filterTool === t ? T.indigo : T.card, color: filterTool === t ? '#fff' : T.textSec,
                border: `1px solid ${T.border}`, fontFamily: T.fontMono,
              }}>{t}</button>
            ))}
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {[['id','ID'],['name','Project'],['type','Type'],['country','Country'],['tool','Tool'],['irr','IRR %'],['wacc','WACC %'],['penetrationPct','Penetration %'],['barriers','Avg Barrier'],['additionalityResult','Result'],['assessor','Assessor']].map(([f, l]) => (
                    <th key={f} style={thS(f)} onClick={() => handleSort(f)}>{l}{sortField === f ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((p, i) => {
                  const avgBarrier = p.barriers.reduce((s, b) => s + b, 0) / 4;
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11, color: T.indigo }}>{p.id}</td>
                      <td style={{ ...tdS, fontWeight: 500, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</td>
                      <td style={{ ...tdS, fontSize: 11 }}>{p.type}</td>
                      <td style={tdS}>{p.country}</td>
                      <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11 }}>{p.tool}</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, color: p.irr < p.wacc ? T.green : T.red, fontWeight: 600 }}>{p.irr.toFixed(1)}%</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>{p.wacc.toFixed(1)}%</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, color: p.penetrationPct < 10 ? T.green : T.amber }}>{p.penetrationPct.toFixed(1)}%</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, color: avgBarrier > 3 ? T.red : avgBarrier > 2 ? T.amber : T.green }}>{avgBarrier.toFixed(1)}</td>
                      <td style={tdS}><ResultBadge result={p.additionalityResult} /></td>
                      <td style={{ ...tdS, fontSize: 11 }}>{p.assessor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 1 — TOOL01 Investment Analysis
      ══════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <div>
          <RegBox
            title="TOOL01 v8 — Tool for the Demonstration and Assessment of Additionality (Investment Analysis)"
            refs={[
              'Ref: UNFCCC CDM EB Decision EB47 Annex 13 · UNFCCC Decision 4/CMP.1 Annex II',
              'Applicable to: All CDM methodologies · Step 3b — Investment barrier test',
              'Rule: Project is additional if IRR_without_carbon < WACC (financial barrier confirmed)',
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>TOOL01 Input Parameters</div>
              <SliderRow label="Initial CAPEX ($)" val={t1Capex} setVal={setT1Capex} min={100000} max={20000000} step={100000} unit=" $" />
              <SliderRow label="Annual O&M cost ($)" val={t1Om} setVal={setT1Om} min={10000} max={2000000} step={10000} unit=" $" />
              <SliderRow label="Annual revenue WITHOUT carbon ($)" val={t1RevNC} setVal={setT1RevNC} min={50000} max={5000000} step={50000} unit=" $" />
              <SliderRow label="Annual carbon credits (tCO2e)" val={t1Credits} setVal={setT1Credits} min={100} max={100000} step={100} unit=" t" />
              <SliderRow label="Carbon price ($/tCO2e)" val={t1Price} setVal={setT1Price} min={1} max={50} step={1} unit=" $/t" />
              <SliderRow label="Discount rate / WACC (%)" val={t1Wacc} setVal={setT1Wacc} min={3} max={25} step={0.5} unit="%" />
              <SliderRow label="Project lifetime (years)" val={t1Life} setVal={setT1Life} min={5} max={30} step={1} unit=" yrs" />
            </div>

            <div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>TOOL01 Calculated Outputs</div>
                {[
                  ['NPV WITHOUT carbon revenue', tool01.npvNC >= 0 ? '+' : '', fmtM(tool01.npvNC), tool01.npvNC < 0 ? T.green : T.red],
                  ['NPV WITH carbon revenue', tool01.npvC >= 0 ? '+' : '', fmtM(tool01.npvC), tool01.npvC >= 0 ? T.navy : T.amber],
                  ['IRR without carbon', '', `${tool01.irrNC.toFixed(2)}%`, tool01.irrNC < t1Wacc ? T.green : T.red],
                  ['IRR with carbon revenue', '', `${tool01.irrC.toFixed(2)}%`, T.navy],
                  ['Payback period', '', tool01.payback === Infinity ? '∞ (never)' : `${tool01.payback.toFixed(1)} years`, T.textPri],
                  ['Benefit-Cost Ratio', '', tool01.bcRatio.toFixed(3), T.textPri],
                  ['WACC hurdle rate', '', `${t1Wacc.toFixed(1)}%`, T.navy],
                ].map(([l, sign, v, col]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 12, color: T.textSec }}>{l}</span>
                    <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: col }}>{sign}{v}</span>
                  </div>
                ))}

                <div style={{ marginTop: 14, padding: '12px 16px', background: tool01.barrier ? T.green + '12' : T.red + '12', border: `2px solid ${tool01.barrier ? T.green : T.red}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tool01.barrier ? T.green : T.red }}>
                    Investment Analysis Result: {tool01.barrier ? 'BARRIER CONFIRMED ✓' : 'BARRIER NOT CONFIRMED ✗'}
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
                    {tool01.barrier
                      ? `IRR (${tool01.irrNC.toFixed(2)}%) < WACC (${t1Wacc}%) — financial barrier confirmed per TOOL01 Step 3b`
                      : `IRR (${tool01.irrNC.toFixed(2)}%) ≥ WACC (${t1Wacc}%) — project financially viable without carbon; not additional on investment test alone`}
                  </div>
                </div>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>IRR Sensitivity at Carbon Prices (TOOL01 §3b)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Carbon Price','IRR w/ Carbon','vs WACC','Additionality'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tool01.scenarios.map(s => (
                      <tr key={s.cp} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding: '6px 10px', fontFamily: T.fontMono, fontSize: 12 }}>${s.cp}/t</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{s.irr}%</td>
                        <td style={{ padding: '6px 10px', fontFamily: T.fontMono, fontSize: 12, color: parseFloat(s.irr) < t1Wacc ? T.green : T.red }}>
                          {parseFloat(s.irr) < t1Wacc ? `−${(t1Wacc - parseFloat(s.irr)).toFixed(2)}%` : `+${(parseFloat(s.irr) - t1Wacc).toFixed(2)}%`}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ background: s.addl ? T.green + '22' : T.red + '22', color: s.addl ? T.green : T.red, padding: '2px 7px', borderRadius: 3, fontSize: 11, fontFamily: T.fontMono }}>{s.addl ? 'Additional' : 'Non-Add'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 10, fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>
                  CDM Rule: additionaliry must hold WITHOUT carbon revenue (col 2 must fail Step 3b). Carbon revenue is not a determinant.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2 — TOOL02 Common Practice
      ══════════════════════════════════════════════════════ */}
      {activeTab === 2 && (
        <div>
          <RegBox
            title="TOOL02 v5 — Combined Tool to Identify the Baseline Scenario and Demonstrate Additionality"
            refs={[
              'Ref: UNFCCC CDM EB Decision EB39 · Applicable to ACM methodologies (combined baseline+additionality)',
              'Common Practice Test: If technology penetration < threshold AND no regulatory mandate → ADDITIONAL',
              'Data source: national statistics, IEA, and CDM registry project counts by country/technology',
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>TOOL02 — Common Practice Inputs</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono, display: 'block', marginBottom: 4 }}>Host Country</label>
                <select value={t2Country} onChange={e => setT2Country(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.fontMono }}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono, display: 'block', marginBottom: 4 }}>Technology Type</label>
                <select value={t2Tech} onChange={e => setT2Tech(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.fontMono }}>
                  {[['solar','Solar PV'],['wind','Wind Onshore'],['biogas','Biogas Digesters'],['led','LED Lighting'],['ev','EV Fleet'],['compost','Compost Facilities']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <SliderRow label="Penetration rate in market (%)" val={t2Pen} setVal={setT2Pen} min={0} max={50} step={0.5} unit="%" />
              <SliderRow label="Common practice threshold (%)" val={t2Threshold} setVal={setT2Threshold} min={5} max={25} step={1} unit="%" />

              <div style={{ marginTop: 16, padding: '12px 16px', background: t2Addl ? T.green + '12' : T.red + '12', border: `2px solid ${t2Addl ? T.green : T.red}`, borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: t2Addl ? T.green : T.red }}>
                  Common Practice Test: {t2Addl ? 'ADDITIONAL ✓' : 'NOT ADDITIONAL ✗'}
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
                  Market penetration {t2Value.toFixed(1)}% is {t2Addl ? 'below' : 'above'} threshold {t2Threshold}% in {t2Country} ({['solar','Solar PV'],['wind','Wind Onshore'],['biogas','Biogas'],['led','LED'],['ev','EV Fleet'],['compost','Compost']}[t2Tech]?.[1] || t2Tech})
                </div>
              </div>
            </div>

            <div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Country-Technology Penetration Database</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: T.sub }}>
                        <th style={{ padding: '6px 8px', fontSize: 10, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Country</th>
                        {TECH_TYPES.map(t => <th key={t} style={{ padding: '6px 8px', fontSize: 10, fontFamily: T.fontMono, color: T.textSec, textAlign: 'right', borderBottom: `1px solid ${T.border}` }}>{t.split(' ')[0]}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {PENETRATION.slice(0, 10).map((r, i) => (
                        <tr key={r.country} style={{ background: r.country === t2Country ? T.gold + '12' : i % 2 === 0 ? T.card : T.sub }}>
                          <td style={{ ...tdS, fontWeight: r.country === t2Country ? 700 : 400 }}>{r.country}</td>
                          {['solar','wind','biogas','led','ev','compost'].map(k => (
                            <td key={k} style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, fontSize: 11, color: r[k] < 10 ? T.green : r[k] < 20 ? T.amber : T.red }}>{r[k]}%</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ background: T.sub, borderRadius: 8, padding: '12px 16px', fontSize: 11 }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8, fontFamily: T.fontMono }}>TOOL02 §3: SIMILAR PROJECTS IN CDM REGISTRY</div>
                {COUNTRIES.slice(0, 8).map((c, ci) => {
                  const cnt = Math.floor(sr(ci * 91 + 20) * 30);
                  return (
                    <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ color: T.textSec }}>{c} — {PROJ_TYPES[ci % 12]}</span>
                      <span style={{ fontFamily: T.fontMono, color: cnt < 5 ? T.green : T.red }}>{cnt} registered {cnt < 5 ? '→ ADDITIONAL' : '→ COMMON PRACTICE'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3 — TOOL07 Grid Emission Factor
      ══════════════════════════════════════════════════════ */}
      {activeTab === 3 && (
        <div>
          <RegBox
            title="TOOL07 v4 — Tool to Calculate the Emission Factor for an Electricity System"
            refs={[
              'Ref: UNFCCC CDM Methodological Tool · Approved by EB47 · Applicable to all RE/EE CDM methodologies',
              'OM = Operating Margin (dispatchable plants, excluding low-cost/must-run, weighted by generation)',
              'BM = Build Margin (most recently built 20% of capacity by MW) · CM = w_OM×OM + w_BM×BM (default 50:50)',
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono, display: 'block', marginBottom: 4 }}>Select Country Grid</label>
                <select value={t7Country} onChange={e => setT7Country(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.fontMono }}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <SliderRow label="w_OM — Operating margin weight" val={t7WOm} setVal={setT7WOm} min={0} max={1} step={0.1} />

              <div style={{ background: T.sub, borderRadius: 8, padding: '12px 16px', marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, fontFamily: T.fontMono, marginBottom: 8 }}>OPERATING MARGIN — Top Dispatched Plants</div>
                {t7GridData.plants.map((p, pi) => (
                  <div key={pi} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ color: T.textSec }}>{p.type}</span>
                    <span style={{ fontFamily: T.fontMono }}>Share: {p.share.toFixed(0)}% · EF: {p.ef} tCO2e/MWh</span>
                  </div>
                ))}
                <div style={{ marginTop: 8, fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, color: T.navy }}>
                  EF_OM = {t7OM.toFixed(4)} tCO2e/MWh
                </div>
              </div>

              <div style={{ background: T.sub, borderRadius: 8, padding: '12px 16px', marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, fontFamily: T.fontMono, marginBottom: 8 }}>BUILD MARGIN — Recently Built Capacity (20%)</div>
                {t7GridData.recentPlants.map((p, pi) => (
                  <div key={pi} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ color: T.textSec }}>{p.type}</span>
                    <span style={{ fontFamily: T.fontMono }}>{p.mw} MW · EF: {p.ef} tCO2e/MWh</span>
                  </div>
                ))}
                <div style={{ marginTop: 8, fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, color: T.navy }}>
                  EF_BM = {t7BM.toFixed(4)} tCO2e/MWh
                </div>
              </div>
            </div>

            <div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Combined Margin Calculation</div>
                <div style={{ background: '#0a0a1a', borderRadius: 8, padding: '14px 18px', fontFamily: T.fontMono, fontSize: 12, color: '#e2e8f0', lineHeight: 1.85, marginBottom: 14 }}>
                  <div style={{ color: '#fbbf24' }}>TOOL07 v4 — Combined Margin Formula</div>
                  <div style={{ color: '#86efac' }}>  EF_CM = w_OM × EF_OM + w_BM × EF_BM</div>
                  <div>{`        = ${t7WOm.toFixed(1)} × ${t7OM.toFixed(4)} + ${(1 - t7WOm).toFixed(1)} × ${t7BM.toFixed(4)}`}</div>
                  <div style={{ color: '#fbbf24' }}>{`  EF_CM = ${t7CM.toFixed(4)} tCO2e/MWh`}</div>
                </div>
                {[['EF_OM', `${t7OM.toFixed(4)} tCO2e/MWh`, 'Simple OM (excl low-cost/must-run)'],['EF_BM', `${t7BM.toFixed(4)} tCO2e/MWh`, '20% recently built capacity'],['w_OM / w_BM', `${t7WOm.toFixed(1)} / ${(1-t7WOm).toFixed(1)}`, 'Default 50/50 (TOOL07 §7)'],['EF_CM', `${t7CM.toFixed(4)} tCO2e/MWh`, 'Combined margin (use in methodology)'],['Grid type', 'Interconnected', `${t7Country} national grid`],['Source year', '2022', 'IEA / national grid statistics']].map(([l, v, n]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div>
                      <div style={{ fontFamily: T.fontMono, color: T.indigo }}>{l}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{n}</div>
                    </div>
                    <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4 — TOOL21 Small-Scale Additionality
      ══════════════════════════════════════════════════════ */}
      {activeTab === 4 && (
        <div>
          <RegBox
            title="TOOL21 v2 — Demonstration of Additionality of Small-Scale CDM Project Activities"
            refs={[
              'Ref: UNFCCC CDM Simplified Modalities · Appendix B to Annex II to Decision 4/CMP.1',
              'Applicable thresholds: Type I <15MW · Type II <60GWh/yr · Type III <15kt CO2e/yr',
              '3-step wizard: Regulatory surplus → Investment analysis (simplified) → Common practice',
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              {/* Wizard steps */}
              {[
                {
                  step: 1, title: 'STEP 1 — Regulatory Surplus',
                  question: 'Is the project activity required by law or existing regulation?',
                  yesLabel: 'Yes — legally required', noLabel: 'No — voluntary',
                  val: t21Step1, setVal: setT21Step1,
                  yesResult: 'NOT ADDITIONAL — fails regulatory surplus test',
                  yesColor: T.red, noText: 'Proceed to Step 2',
                },
              ].map(s => (
                <div key={s.step} style={{ background: T.card, border: `2px solid ${activeTab === 4 ? (t21Step1 === null ? T.gold : t21Step1 ? T.red : T.green) : T.border}`, borderRadius: 8, padding: 18, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>{s.question}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setT21Step1(true)} style={{ padding: '8px 20px', borderRadius: 6, border: `2px solid ${T.red}`, background: t21Step1 === true ? T.red : 'transparent', color: t21Step1 === true ? '#fff' : T.red, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Yes</button>
                    <button onClick={() => setT21Step1(false)} style={{ padding: '8px 20px', borderRadius: 6, border: `2px solid ${T.green}`, background: t21Step1 === false ? T.green : 'transparent', color: t21Step1 === false ? '#fff' : T.green, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>No</button>
                  </div>
                  {t21Step1 === true && <div style={{ marginTop: 10, color: T.red, fontSize: 12, fontWeight: 600 }}>Result: NOT ADDITIONAL — legally mandated activities cannot earn carbon credits</div>}
                  {t21Step1 === false && <div style={{ marginTop: 10, color: T.green, fontSize: 12 }}>Proceed to Step 2 →</div>}
                </div>
              ))}

              {t21Step1 === false && (
                <div style={{ background: T.card, border: `2px solid ${t21Step2 === null ? T.gold : t21Step2 ? T.green : T.amber}`, borderRadius: 8, padding: 18, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>STEP 2 — Investment Analysis (Simplified)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>IRR w/o carbon (%)</label>
                      <input type="number" value={t21IRR} onChange={e => setT21IRR(Number(e.target.value))} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.fontMono, marginTop: 4 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>WACC / Hurdle rate (%)</label>
                      <input type="number" value={t21WACC} onChange={e => setT21WACC(Number(e.target.value))} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.fontMono, marginTop: 4 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Is IRR (without carbon) &lt; WACC (investment barrier present)?</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setT21Step2(true)} style={{ padding: '8px 20px', borderRadius: 6, border: `2px solid ${T.green}`, background: t21Step2 === true ? T.green : 'transparent', color: t21Step2 === true ? '#fff' : T.green, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Yes — IRR &lt; WACC</button>
                    <button onClick={() => setT21Step2(false)} style={{ padding: '8px 20px', borderRadius: 6, border: `2px solid ${T.amber}`, background: t21Step2 === false ? T.amber : 'transparent', color: t21Step2 === false ? '#fff' : T.amber, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>No — IRR ≥ WACC</button>
                  </div>
                  {t21Step2 === true  && <div style={{ marginTop: 10, color: T.green, fontSize: 12, fontWeight: 600 }}>ADDITIONAL confirmed at Step 2 — financial barrier demonstrated</div>}
                  {t21Step2 === false && <div style={{ marginTop: 10, color: T.amber, fontSize: 12 }}>Proceed to Step 3 →</div>}
                </div>
              )}

              {t21Step1 === false && t21Step2 === false && (
                <div style={{ background: T.card, border: `2px solid ${t21Step3 === null ? T.gold : t21Step3 ? T.green : T.red}`, borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>STEP 3 — Common Practice</div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>Registered similar projects in CDM registry (same country/sector)</label>
                    <input type="number" value={t21RegPrj} min={0} max={50} onChange={e => setT21RegPrj(Number(e.target.value))} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.fontMono, marginTop: 4 }} />
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Are there fewer than 5 similar registered projects in the CDM registry?</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setT21Step3(true)} style={{ padding: '8px 20px', borderRadius: 6, border: `2px solid ${T.green}`, background: t21Step3 === true ? T.green : 'transparent', color: t21Step3 === true ? '#fff' : T.green, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Yes (&lt;5 projects)</button>
                    <button onClick={() => setT21Step3(false)} style={{ padding: '8px 20px', borderRadius: 6, border: `2px solid ${T.red}`, background: t21Step3 === false ? T.red : 'transparent', color: t21Step3 === false ? '#fff' : T.red, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>No (≥5 projects)</button>
                  </div>
                </div>
              )}
            </div>

            <div>
              {t21Result && (
                <div style={{ background: T.card, border: `3px solid ${t21Result.color}`, borderRadius: 10, padding: 24, marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: t21Result.color, marginBottom: 8 }}>
                    FINAL DETERMINATION: {t21Result.result}
                  </div>
                  <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>{t21Result.reason}</div>
                  <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec }}>Determined at Step {t21Result.step} of TOOL21 3-step wizard</div>
                </div>
              )}

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>TOOL21 — Applicable Thresholds</div>
                {[
                  ['Type I', '<15 MW installed capacity', 'RE generation'],
                  ['Type II', '<60 GWh/yr equivalent', 'Energy efficiency'],
                  ['Type III', '<15 kt CO2e/yr', 'Other activities (waste, agri, etc.)'],
                  ['Bundling', 'Aggregate ≤15 MW', 'Multiple Type I SSC bundled'],
                  ['Monitoring', 'Simplified (TOOL21 Annex)', 'Reduced documentation'],
                  ['Crediting', '10yr or 7yr×3', 'As per applicable methodology'],
                  ['Investment', 'NPV/IRR or simple payback', 'Simplified TOOL01'],
                  ['Common practice', '<5 CDM registered projects', 'Within country/sector'],
                ].map(([type, val, note]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div>
                      <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.indigo }}>{type}</span>
                      <div style={{ fontSize: 10, color: T.textSec }}>{note}</div>
                    </div>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.navy, textAlign: 'right' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 5 — Barrier Analysis Matrix
      ══════════════════════════════════════════════════════ */}
      {activeTab === 5 && (
        <div>
          <RegBox
            title="Barrier Analysis Matrix — 4 Barrier Types × 40 Projects (Score 1–5)"
            refs={[
              'Barrier significance threshold: avg score > 3.0 = "significant barriers" per UNFCCC TOOL01 §3c',
              'Investment: capital cost, financing access · Technology: know-how, equipment availability',
              'Prevailing Practice: market penetration, institutional inertia · Institutional: policy, regulatory clarity',
            ]}
          />

          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Project</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Country</th>
                  {BARRIERS.map(b => <th key={b} style={{ padding: '8px 12px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'center', borderBottom: `1px solid ${T.border}`, maxWidth: 100 }}>{b}</th>)}
                  <th style={{ padding: '8px 12px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>Avg</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>Significant?</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {PROJECTS.map((p, i) => {
                  const avg = p.barriers.reduce((s, b) => s + b, 0) / 4;
                  const sig = avg > 3.0;
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11, color: T.indigo }}>{p.id}</td>
                      <td style={{ ...tdS, fontSize: 11 }}>{p.country}</td>
                      {p.barriers.map((b, bi) => {
                        const col = b >= 4 ? T.red : b >= 3 ? T.amber : T.green;
                        return <td key={bi} style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono, fontWeight: 700, color: col, background: col + '12' }}>{b.toFixed(1)}</td>;
                      })}
                      <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono, fontWeight: 700, color: avg > 3 ? T.red : avg > 2 ? T.amber : T.green }}>{avg.toFixed(1)}</td>
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        <span style={{ background: sig ? T.red + '18' : T.green + '18', color: sig ? T.red : T.green, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontFamily: T.fontMono }}>{sig ? 'YES' : 'NO'}</span>
                      </td>
                      <td style={tdS}><ResultBadge result={p.additionalityResult} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {BARRIERS.map((b, bi) => {
              const vals = PROJECTS.map(p => p.barriers[bi]);
              const avg = vals.reduce((s, v) => s + v, 0) / Math.max(1, vals.length);
              const high = vals.filter(v => v > 3).length;
              return (
                <div key={b} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{b.toUpperCase()}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: avg > 3 ? T.red : avg > 2 ? T.amber : T.green }}>{avg.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>avg score (1–5)</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{high}/{PROJECTS.length} projects score &gt;3.0</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 6 — Sensitivity & Scenario Analysis
      ══════════════════════════════════════════════════════ */}
      {activeTab === 6 && (
        <div>
          <RegBox
            title="Sensitivity & Scenario Analysis — TOOL01 WACC · Carbon Price · TOOL02 Penetration Threshold"
            refs={[
              'WACC sensitivity: shows how many projects flip additional/non-additional at each hurdle rate',
              'Carbon price scenario: CDM rule — project must be additional WITHOUT carbon revenue',
              'Penetration threshold sensitivity: TOOL02 — how threshold choice affects pipeline qualification',
            ]}
          />

          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>WACC Sensitivity — TOOL01 Portfolio (Projects with TOOL01 assessment)</div>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['WACC Hurdle Rate','Additional (IRR < WACC)','Non-Additional (IRR ≥ WACC)','Additionality Rate','Projects that Flip'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {waccSens.map((s, i) => {
                  const prev = i > 0 ? waccSens[i - 1].addl : s.addl;
                  return (
                    <tr key={s.wacc} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ ...tdS, fontFamily: T.fontMono, fontWeight: 700 }}>{s.wacc}%</td>
                      <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono, color: T.green, fontWeight: 600 }}>{s.addl}</td>
                      <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono, color: T.red, fontWeight: 600 }}>{s.nonAddl}</td>
                      <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono, color: T.navy }}>{((s.addl / Math.max(1, s.addl + s.nonAddl)) * 100).toFixed(0)}%</td>
                      <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono, color: s.addl - prev > 0 ? T.green : T.textSec }}>{i > 0 && s.addl - prev > 0 ? `+${s.addl - prev} flip additional` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Carbon Price Scenario — NPV Sign Change (CDM additionality must hold at $0 carbon)</div>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Carbon Price','Projects with Positive NPV (incl. carbon)','Notes'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {priceSens.map((s, i) => (
                  <tr key={s.price} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ ...tdS, fontFamily: T.fontMono, fontWeight: 700 }}>${s.price}/tCO2e</td>
                    <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono, color: T.navy, fontWeight: 600 }}>{s.posNPV} / {PROJECTS.length}</td>
                    <td style={{ ...tdS, fontSize: 11, color: T.textSec }}>Carbon revenue material for {s.posNPV} projects; CDM rule: must be additional WITHOUT these revenues</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>TOOL02 Penetration Threshold Sensitivity — Common Practice Test</div>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Penetration Threshold','Projects Qualifying (Additional)','Projects Failing','Pass Rate'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {penSens.map((s, i) => (
                  <tr key={s.threshold} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ ...tdS, fontFamily: T.fontMono, fontWeight: 700 }}>&lt;{s.threshold}%</td>
                    <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono, color: T.green, fontWeight: 600 }}>{s.qualifies}</td>
                    <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono, color: T.red, fontWeight: 600 }}>{PROJECTS.length - s.qualifies}</td>
                    <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono }}>{((s.qualifies / Math.max(1, PROJECTS.length)) * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 7 — Validation Evidence Log
      ══════════════════════════════════════════════════════ */}
      {activeTab === 7 && (
        <div>
          <RegBox
            title="Validation Evidence Log — ISO 14064-3:2019 §6.5 · UNFCCC CDM VVB Requirements"
            refs={[
              'ISO 14064-3:2019 §6.5: Evidence required for baseline/additionality assertions',
              'CAR = Corrective Action Request · CL = Clarification | VVB must resolve all CARs before issuance',
              'CDM EB61 Annex 21: Minimum evidence package for validation/verification',
            ]}
          />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>SELECT ADDITIONAL PROJECT: </label>
            <select value={evidProj} onChange={e => setEvidProj(Number(e.target.value))} style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.fontMono }}>
              {evidProjects.map((p, i) => <option key={p.id} value={i}>{p.id} — {p.name}</option>)}
            </select>
          </div>

          {evidPrj && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{evidPrj.name}</div>
                <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 16 }}>
                  {evidPrj.id} · Tool: {evidPrj.tool} · Assessor: {evidPrj.assessor} · Date: {evidPrj.barrierAnalysisDate}
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 14, padding: '10px 14px', background: T.sub, borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>Completeness: {evidPrj.completeness}%</div>
                  <div style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>Open CARs: {evidPrj.carCount}</div>
                  <div style={{ fontSize: 12, color: T.navy, fontWeight: 700 }}>Result: <ResultBadge result={evidPrj.additionalityResult} /></div>
                </div>

                {EVID_ITEMS.map((item, ei) => {
                  const haveDoc = sr(evidPrj.id.length * 7 + ei * 13) > 0.3;
                  return (
                    <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <div style={{ width: 22, height: 22, borderRadius: 4, flexShrink: 0, background: haveDoc ? T.green + '18' : T.red + '18', border: `2px solid ${haveDoc ? T.green : T.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 13, color: haveDoc ? T.green : T.red, lineHeight: 1 }}>{haveDoc ? '✓' : '✗'}</span>
                      </div>
                      <span style={{ fontSize: 12, color: T.textPri, flex: 1 }}>{item}</span>
                      <span style={{ fontSize: 10, fontFamily: T.fontMono, color: haveDoc ? T.green : T.red, flexShrink: 0 }}>{haveDoc ? 'ON FILE' : 'MISSING'}</span>
                    </div>
                  );
                })}

                {evidPrj.carCount > 0 && (
                  <div style={{ marginTop: 12, background: T.red + '08', border: `1px solid ${T.red}22`, borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 8 }}>OPEN CORRECTIVE ACTION REQUESTS</div>
                    {Array.from({ length: evidPrj.carCount }, (_, ci) => (
                      <div key={ci} style={{ fontSize: 11, color: T.textSec, padding: '4px 0', borderBottom: `1px solid ${T.borderL}` }}>
                        CAR-{ci + 1}: {['Investment analysis workbook incomplete — missing sensitivity table','Market survey data older than 3 years — update required','Regulatory status confirmation letter not included','Technology supplier quote not notarized'][ci % 4]} — Due: {evidPrj.barrierAnalysisDate.slice(0,7)}-{30}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>ISO 14064-3 §6.5 — Validation Criteria</div>
                  {[
                    ['Baseline Scenario Identification', 'Documented, supported by TOOL02 analysis', evidPrj.completeness > 70],
                    ['Investment Analysis (TOOL01)', `IRR ${evidPrj.irr.toFixed(2)}% vs WACC ${evidPrj.wacc.toFixed(2)}%`, evidPrj.irr < evidPrj.wacc],
                    ['Barriers Identified', `Avg barrier score ${(evidPrj.barriers.reduce((s,b)=>s+b,0)/4).toFixed(1)}/5`, (evidPrj.barriers.reduce((s,b)=>s+b,0)/4) > 3],
                    ['Common Practice Analysis', `Penetration ${evidPrj.penetrationPct.toFixed(1)}%`, evidPrj.penetrationPct < 10],
                    ['Regulatory Surplus', evidPrj.regulatoryStatus, evidPrj.regulatoryStatus !== 'Partial regulation'],
                    ['SDG Co-benefits', `SDGs: ${evidPrj.sdgContribution.join(', ')}`, true],
                  ].map(([dim, val, pass]) => (
                    <div key={dim} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{dim}</div>
                        <div style={{ fontSize: 11, color: T.textSec }}>{val}</div>
                      </div>
                      <span style={{ fontSize: 10, fontFamily: T.fontMono, color: pass ? T.green : T.red, flexShrink: 0, marginLeft: 8 }}>{pass ? 'PASS' : 'FAIL'}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: T.sub, borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, fontFamily: T.fontMono, marginBottom: 8 }}>PORTFOLIO EVIDENCE COMPLETENESS</div>
                  {evidProjects.slice(0, 8).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ fontFamily: T.fontMono, color: T.indigo }}>{p.id}</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 80, height: 8, background: T.borderL, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${p.completeness}%`, height: '100%', background: p.completeness > 80 ? T.green : p.completeness > 60 ? T.amber : T.red, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: T.fontMono, color: p.completeness > 80 ? T.green : p.completeness > 60 ? T.amber : T.red }}>{p.completeness}%</span>
                        <span style={{ color: T.textSec }}>CARs: {p.carCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
