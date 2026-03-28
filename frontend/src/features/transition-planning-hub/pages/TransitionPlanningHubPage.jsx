import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line,
} from 'recharts';

/* ── Theme ──────────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Constants ──────────────────────────────────────────────────────────────── */
const TABS = ['Executive Dashboard','Portfolio Transition View','Engagement Pipeline','Board Report'];
const PERIODS = ['Q','YTD','1Y'];
const SECTORS = ['Energy','Utilities','Materials','Industrials','Transport','Finance','Technology','Healthcare','Consumer','Real Estate'];
const ACT_GRADES = ['A','B','C','D','E'];
const TPT_STATUSES = ['Published','In Progress','Committed','Not Started'];
const CRED_TIERS = ['High','Medium','Low','Very Low'];
const ANALYSTS = ['S. Patel','J. Chen','R. Müller','A. Okafor','L. Johansson','T. Nakamura'];
const PRIORITIES = ['Critical','High','Medium','Low'];
const STAGES = ['Identified','Contacted','Engaged','Action Plan','Monitoring','Resolved'];
const STAGE_COLORS = [T.textMut,'#6366f1',T.navyL,T.gold,T.sage,T.green];

/* ── Generate 150 companies ─────────────────────────────────────────────────── */
const COMPANY_NAMES = [
  'Meridian Energy','AuroraPower','Solaris Holdings','CrestField Resources','Verdant Utilities',
  'NorthStar Materials','Titan Industrials','BlueWave Transport','Pinnacle Finance','TechNova',
  'Helios Healthcare','OmniConsumer','Arcadia RE','Vanguard Energy','Lumina Power',
  'Ironclad Materials','Atlas Industries','SeaRoute Logistics','Summit Capital','Quantum Systems',
  'MedVista Health','PrimeRetail','Skyline Properties','Equinox Energy','Nexus Utilities',
  'Cobalt Mining','Forge Manufacturing','Aether Airlines','Sterling Bank','CloudPeak Tech',
  'Zenith Pharma','Horizon Brands','Avalon Realty','Ember Oil','Pacific Power',
  'GreenSteel Corp','Dynamo Works','FastTrack Rail','Harbor Financial','SilverCircuit',
  'CareFirst Health','Opal Markets','Urban Estates','RedRock Petroleum','SunGrid Solar',
  'CoreAlloys Inc','Precision Engines','Continental Shipping','Goldman Trust','InnovateTech',
  'BioLife Sciences','TrendMart','Metro Living','Delta Fuels','WindCrest Energy',
  'AlphaMetals','Omega Assembly','JetStream Air','Pacific Invest','DataForge',
  'Nova Diagnostics','ValueChain Retail','Crestview Homes','Beacon Drilling','HydroGen Power',
  'SteelBridge Corp','Vulcan Machinery','Oceanic Freight','Fidelity Edge','AppSphere',
  'PharmaCore','GlobeMart','Sovereign RE','Tundra Resources','HelioVolt Solar',
  'MineralX Corp','DuraFab Industries','SwiftCargo','CapitalBridge','NeuroTech AI',
  'Apex Medical','ShopWise Group','GrandView Towers','Onyx Petroleum','TerraWatt Grid',
  'RefineCopper Ltd','KineticWorks','RailNet Express','Aspen Wealth','ChipLogic',
  'WellnessFirst','MegaStore Inc','UrbanNest Devs','FossilPeak Oil','BrightSun PV',
  'TitanOre Mining','ElectraMotors','AnchorPort Ships','VentureGate Capital','PixelWave',
  'MedTrend Labs','FreshMart Global','SkyRealty Group','PetroChem Alpha','GreenFlux Grid',
  'NickelRidge Inc','BoltMfg Co','TransOcean Lines','AllianceBank','CodeStream',
  'LifeSpring Health','PrimeGoods','NexusProperties','FuelMaster Corp','AmpGrid Energy',
  'BaseMetal Works','ProBuild Eng','AeroLink Jets','TrustPoint Fin','ByteForce Tech',
  'MedFirst Group','EcoMart','CentrePoint RE','PolarDrill Co','NovaGrid Solar',
  'OreVista Mining','MechaPro Corp','SeaLane Global','RidgeCapital','Synapse Labs',
];

const genCompanies = () => {
  const out = [];
  for (let i = 0; i < 150; i++) {
    const s = sr(i * 7 + 3);
    const s2 = sr(i * 13 + 7);
    const s3 = sr(i * 19 + 11);
    const s4 = sr(i * 23 + 17);
    const s5 = sr(i * 29 + 19);
    const sectorIdx = i % 10;
    out.push({
      id: i + 1,
      name: COMPANY_NAMES[i],
      sector: SECTORS[sectorIdx],
      tptStatus: TPT_STATUSES[Math.floor(s * 4)],
      actGrade: ACT_GRADES[Math.floor(s2 * 5)],
      gfanzAligned: s3 > 0.45,
      nzCommitted: s4 > 0.35,
      credibilityTier: CRED_TIERS[Math.floor(s5 * 4)],
      readiness: Math.floor(20 + s * 75),
      greenCapex: Math.floor(5 + s2 * 50),
      regReady: Math.floor(30 + s3 * 65),
      radarGovernance: Math.floor(30 + sr(i * 31) * 65),
      radarStrategy: Math.floor(25 + sr(i * 37) * 70),
      radarMetrics: Math.floor(20 + sr(i * 41) * 75),
      radarTargets: Math.floor(30 + sr(i * 43) * 60),
      radarCredibility: Math.floor(15 + sr(i * 47) * 80),
    });
  }
  return out;
};

const COMPANIES = genCompanies();

/* ── Engagement pipeline (30 companies) ─────────────────────────────────────── */
const genEngagements = () => {
  const out = [];
  for (let i = 0; i < 30; i++) {
    const c = COMPANIES[i * 5];
    const s = sr(i * 53 + 7);
    const s2 = sr(i * 59 + 11);
    const s3 = sr(i * 61 + 13);
    const dayOff = Math.floor(1 + s3 * 28);
    out.push({
      id: i + 1,
      company: c.name,
      sector: c.sector,
      stage: STAGES[Math.floor(s * 6)],
      priority: PRIORITIES[Math.floor(s2 * 4)],
      analyst: ANALYSTS[Math.floor(sr(i * 67) * 6)],
      nextAction: `2026-04-${String(dayOff).padStart(2, '0')}`,
      notes: '',
    });
  }
  return out;
};

/* ── KPI computation ────────────────────────────────────────────────────────── */
const computeKPIs = (period) => {
  const pf = period === 'Q' ? 1.0 : period === 'YTD' ? 0.95 : 0.88;
  const published = COMPANIES.filter(c => c.tptStatus === 'Published').length;
  const avgAct = (COMPANIES.reduce((a, c) => a + ACT_GRADES.indexOf(c.actGrade), 0) / 150);
  const gfanzCount = COMPANIES.filter(c => c.gfanzAligned).length;
  const nzCount = COMPANIES.filter(c => c.nzCommitted).length;
  const avgCred = COMPANIES.reduce((a, c) => a + c.readiness, 0) / 150;
  const avgGreenCapex = COMPANIES.reduce((a, c) => a + c.greenCapex, 0) / 150;
  const laggards = COMPANIES.filter(c => c.actGrade === 'E' || c.credibilityTier === 'Very Low').length;
  const regReady = COMPANIES.reduce((a, c) => a + c.regReady, 0) / 150;
  return [
    { label: 'Transition Readiness', value: (avgCred * pf).toFixed(1), unit: '%', delta: '+3.2', color: T.sage },
    { label: 'TPT Coverage', value: ((published / 150) * 100 * pf).toFixed(1), unit: '%', delta: '+5.1', color: T.navyL },
    { label: 'Avg ACT Grade', value: ACT_GRADES[Math.round(avgAct)], unit: '', delta: '+0.3', color: T.gold },
    { label: 'GFANZ Alignment', value: ((gfanzCount / 150) * 100 * pf).toFixed(1), unit: '%', delta: '+2.8', color: T.teal },
    { label: 'NZ Commitment', value: ((nzCount / 150) * 100 * pf).toFixed(1), unit: '%', delta: '+4.5', color: T.green },
    { label: 'Credibility Score', value: (avgCred * pf * 0.85).toFixed(1), unit: '/100', delta: '+1.9', color: T.navy },
    { label: 'CapEx Green Ratio', value: (avgGreenCapex * pf).toFixed(1), unit: '%', delta: '+2.1', color: T.sage },
    { label: 'Laggard Count', value: laggards, unit: 'cos', delta: '-3', color: T.red },
    { label: 'Engagement Pipeline', value: 30, unit: 'active', delta: '+5', color: T.amber },
    { label: 'Regulatory Readiness', value: (regReady * pf).toFixed(1), unit: '%', delta: '+4.0', color: T.navyL },
  ];
};

/* ── Sub-module cards ───────────────────────────────────────────────────────── */
const SUB_MODULES = [
  { name: 'Plan Builder', icon: '\u{1F4CB}', stat: '42 plans drafted', desc: 'TPT-aligned transition plan builder' },
  { name: 'GFANZ Tracker', icon: '\u{1F30D}', stat: `${COMPANIES.filter(c=>c.gfanzAligned).length} aligned`, desc: 'GFANZ commitment monitoring' },
  { name: 'ACT Assessor', icon: '\u{1F3AF}', stat: `Avg grade ${ACT_GRADES[Math.round(COMPANIES.reduce((a,c)=>a+ACT_GRADES.indexOf(c.actGrade),0)/150)]}`, desc: 'ACT methodology scoring' },
  { name: 'NZ Tracker', icon: '\u{2744}\u{FE0F}', stat: `${COMPANIES.filter(c=>c.nzCommitted).length} committed`, desc: 'Net-zero commitment tracker' },
  { name: 'Credibility Engine', icon: '\u{1F50D}', stat: `${COMPANIES.filter(c=>c.credibilityTier==='High').length} high tier`, desc: 'Transition credibility assessment' },
];

/* ── Risks & Opportunities ──────────────────────────────────────────────────── */
const TOP_RISKS = [
  { id: 1, text: 'Energy sector laggards with no published transition plan', severity: 'Critical', sector: 'Energy' },
  { id: 2, text: 'Materials companies with E-grade ACT scores increasing', severity: 'High', sector: 'Materials' },
  { id: 3, text: 'GFANZ alignment gap in Finance sector widening', severity: 'High', sector: 'Finance' },
  { id: 4, text: 'Transport NZ commitments lack interim milestones', severity: 'Medium', sector: 'Transport' },
  { id: 5, text: 'Real Estate credibility scores declining QoQ', severity: 'Medium', sector: 'Real Estate' },
];

const TOP_OPPS = [
  { id: 1, text: 'Utilities sector 78% GFANZ aligned, sector leader potential', impact: 'High', sector: 'Utilities' },
  { id: 2, text: 'Technology companies rapidly publishing TPT plans', impact: 'High', sector: 'Technology' },
  { id: 3, text: 'Healthcare green CapEx ratio above 40%, engagement ready', impact: 'Medium', sector: 'Healthcare' },
  { id: 4, text: 'Consumer brands responding to engagement on NZ targets', impact: 'Medium', sector: 'Consumer' },
  { id: 5, text: 'Industrials credibility improvement +8pp after engagement', impact: 'High', sector: 'Industrials' },
];

/* ── Sector heatmap data ────────────────────────────────────────────────────── */
const genSectorHeatmap = () => SECTORS.map((sec, i) => {
  const cos = COMPANIES.filter(c => c.sector === sec);
  const avgReady = cos.reduce((a, c) => a + c.readiness, 0) / cos.length;
  const tptPct = (cos.filter(c => c.tptStatus === 'Published').length / cos.length) * 100;
  const gfanzPct = (cos.filter(c => c.gfanzAligned).length / cos.length) * 100;
  const nzPct = (cos.filter(c => c.nzCommitted).length / cos.length) * 100;
  return { sector: sec, readiness: Math.round(avgReady), tpt: Math.round(tptPct), gfanz: Math.round(gfanzPct), nz: Math.round(nzPct) };
});

/* ── Board Report Sections ──────────────────────────────────────────────────── */
const REPORT_SECTIONS = [
  'Executive Summary','Transition Readiness','GFANZ Alignment','NZ Commitments','Credibility Assessment','Recommendations',
];

/* ── Styles ──────────────────────────────────────────────────────────────────── */
const sCard = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, boxShadow: '0 1px 4px rgba(27,58,92,0.06)' };
const sBtn = (active) => ({
  padding: '7px 16px', borderRadius: 7, border: `1px solid ${active ? T.navy : T.border}`,
  background: active ? T.navy : T.surface, color: active ? '#fff' : T.text,
  cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: T.font, transition: 'all 0.15s',
});
const sBadge = (color) => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 12,
  background: color + '18', color, fontSize: 11, fontWeight: 700, fontFamily: T.font,
});

const heatColor = (v) => v >= 70 ? T.green : v >= 45 ? T.amber : T.red;
const gradeColor = (g) => g === 'A' ? T.green : g === 'B' ? T.sage : g === 'C' ? T.amber : g === 'D' ? '#e67e22' : T.red;
const tierColor = (t) => t === 'High' ? T.green : t === 'Medium' ? T.amber : t === 'Low' ? '#e67e22' : T.red;
const statusColor = (s) => s === 'Published' ? T.green : s === 'In Progress' ? T.navyL : s === 'Committed' ? T.gold : T.textMut;

const PIE_COLORS = [T.navy, T.sage, T.gold, T.navyL, T.red, T.amber, T.green, T.goldL, T.sageL, '#8b5cf6'];

/* ════════════════════════════════════════════════════════════════════════════ */
/*  COMPONENT                                                                  */
/* ════════════════════════════════════════════════════════════════════════════ */
export default function TransitionPlanningHubPage() {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState('Q');
  const [engagements, setEngagements] = useState(genEngagements);
  const [selectedCo, setSelectedCo] = useState(null);
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterSector, setFilterSector] = useState('All');
  const [filterTPT, setFilterTPT] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterNZ, setFilterNZ] = useState('All');
  const [showAddEng, setShowAddEng] = useState(false);
  const [newEng, setNewEng] = useState({ company: '', priority: 'Medium', analyst: ANALYSTS[0], notes: '' });
  const [boardDateFrom, setBoardDateFrom] = useState('2026-01-01');
  const [boardDateTo, setBoardDateTo] = useState('2026-03-31');
  const [boardAudience, setBoardAudience] = useState('Board');
  const [boardSections, setBoardSections] = useState(REPORT_SECTIONS.reduce((a, s) => ({ ...a, [s]: true }), {}));
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedEng, setSelectedEng] = useState(null);
  const [engNoteEdit, setEngNoteEdit] = useState('');

  /* ── KPIs ──────────────────────────────────────────────────────────────────── */
  const kpis = useMemo(() => computeKPIs(period), [period]);
  const sectorHeatmap = useMemo(genSectorHeatmap, []);

  /* ── Portfolio filtering & sorting ─────────────────────────────────────────── */
  const filteredCompanies = useMemo(() => {
    let list = [...COMPANIES];
    if (filterSector !== 'All') list = list.filter(c => c.sector === filterSector);
    if (filterTPT !== 'All') list = list.filter(c => c.tptStatus === filterTPT);
    if (filterGrade !== 'All') list = list.filter(c => c.actGrade === filterGrade);
    if (filterNZ !== 'All') list = list.filter(c => filterNZ === 'Yes' ? c.nzCommitted : !c.nzCommitted);
    list.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0; }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return list;
  }, [filterSector, filterTPT, filterGrade, filterNZ, sortCol, sortDir]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }, [sortCol]);

  /* ── Engagement pipeline helpers ───────────────────────────────────────────── */
  const moveStage = useCallback((id, dir) => {
    setEngagements(prev => prev.map(e => {
      if (e.id !== id) return e;
      const idx = STAGES.indexOf(e.stage);
      const next = idx + dir;
      if (next < 0 || next >= STAGES.length) return e;
      return { ...e, stage: STAGES[next] };
    }));
  }, []);

  const addEngagement = useCallback(() => {
    if (!newEng.company.trim()) return;
    setEngagements(prev => [...prev, {
      id: prev.length + 1, company: newEng.company, sector: 'Other', stage: 'Identified',
      priority: newEng.priority, analyst: newEng.analyst,
      nextAction: '2026-04-15', notes: newEng.notes,
    }]);
    setNewEng({ company: '', priority: 'Medium', analyst: ANALYSTS[0], notes: '' });
    setShowAddEng(false);
  }, [newEng]);

  const pipelineStats = useMemo(() => {
    const byStage = STAGES.map(s => ({ stage: s, count: engagements.filter(e => e.stage === s).length }));
    const byPriority = PRIORITIES.map(p => ({ priority: p, count: engagements.filter(e => e.priority === p).length }));
    return { byStage, byPriority, total: engagements.length };
  }, [engagements]);

  /* ── Scatter data for Tab 2 ────────────────────────────────────────────────── */
  const scatterData = useMemo(() => SECTORS.map((sec, i) => {
    const cos = COMPANIES.filter(c => c.sector === sec);
    return { sector: sec, allocation: Math.round(cos.length / 1.5), alignment: Math.round(cos.reduce((a, c) => a + c.readiness, 0) / cos.length) };
  }), []);

  /* ── Coverage gap ──────────────────────────────────────────────────────────── */
  const coverageGap = useMemo(() => {
    const noTPT = COMPANIES.filter(c => c.tptStatus === 'Not Started').length;
    const noNZ = COMPANIES.filter(c => !c.nzCommitted).length;
    const noGFANZ = COMPANIES.filter(c => !c.gfanzAligned).length;
    const lowCred = COMPANIES.filter(c => c.credibilityTier === 'Very Low' || c.credibilityTier === 'Low').length;
    return [
      { label: 'No TPT Plan', count: noTPT, pct: ((noTPT / 150) * 100).toFixed(1) },
      { label: 'No NZ Commitment', count: noNZ, pct: ((noNZ / 150) * 100).toFixed(1) },
      { label: 'Not GFANZ Aligned', count: noGFANZ, pct: ((noGFANZ / 150) * 100).toFixed(1) },
      { label: 'Low/Very Low Credibility', count: lowCred, pct: ((lowCred / 150) * 100).toFixed(1) },
    ];
  }, []);

  /* ── Board report quarterly comparison ─────────────────────────────────────── */
  const boardQuarterlyData = useMemo(() => {
    return ['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026'].map((q, i) => ({
      quarter: q,
      readiness: Math.round(38 + i * 6 + sr(i * 71) * 5),
      tptCoverage: Math.round(20 + i * 8 + sr(i * 73) * 4),
      gfanzPct: Math.round(30 + i * 5 + sr(i * 79) * 6),
      nzPct: Math.round(35 + i * 7 + sr(i * 83) * 3),
      credibility: Math.round(40 + i * 4 + sr(i * 89) * 5),
    }));
  }, []);

  /* ── CSV Export ─────────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const headers = ['Company','Sector','TPT Status','ACT Grade','GFANZ Aligned','NZ Committed','Credibility Tier','Readiness'];
    const rows = COMPANIES.map(c => [c.name, c.sector, c.tptStatus, c.actGrade, c.gfanzAligned ? 'Yes' : 'No', c.nzCommitted ? 'Yes' : 'No', c.credibilityTier, c.readiness]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transition_planning_hub_report.csv'; a.click();
    URL.revokeObjectURL(url);
  }, []);

  /* ── TPT Status distribution for pie ───────────────────────────────────────── */
  const tptDistribution = useMemo(() => TPT_STATUSES.map(s => ({
    name: s, value: COMPANIES.filter(c => c.tptStatus === s).length,
  })), []);

  const tptPieColors = [T.green, T.navyL, T.gold, T.textMut];

  /* ════════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                     */
  /* ════════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: T.navy }}>Transition Planning Hub</h1>
          <p style={{ margin: '4px 0 0', color: T.textSec, fontSize: 14 }}>EP-AL6 -- Executive dashboard aggregating all Sprint AL modules</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ ...sBadge(T.sage), fontSize: 12 }}>150 companies</span>
          <span style={{ ...sBadge(T.navy), fontSize: 12 }}>10 sectors</span>
          <span style={{ ...sBadge(T.gold), fontSize: 12 }}>Live</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 20px', border: 'none', borderBottom: tab === i ? `3px solid ${T.navy}` : '3px solid transparent',
            background: 'none', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 500,
            fontSize: 14, cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 1: Executive Dashboard                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <div>
          {/* Period toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={sBtn(period === p)}>{p}</button>
            ))}
          </div>

          {/* 10 KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 22 }}>
            {kpis.map((k, i) => (
              <div key={i} style={{ ...sCard, padding: 16, borderLeft: `4px solid ${k.color}` }}>
                <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: T.navy, marginTop: 4 }}>
                  {k.value}<span style={{ fontSize: 12, fontWeight: 500, color: T.textSec }}> {k.unit}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: String(k.delta).startsWith('-') && k.label !== 'Laggard Count' ? T.red : T.green, marginTop: 2 }}>
                  {k.delta} vs prior
                </div>
              </div>
            ))}
          </div>

          {/* Sector heatmap */}
          <div style={{ ...sCard, marginBottom: 22 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700 }}>Transition Readiness Heatmap by Sector</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec, fontWeight: 600 }}>Sector</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', color: T.textSec, fontWeight: 600 }}>Readiness %</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', color: T.textSec, fontWeight: 600 }}>TPT Coverage %</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', color: T.textSec, fontWeight: 600 }}>GFANZ %</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', color: T.textSec, fontWeight: 600 }}>NZ Committed %</th>
                  </tr>
                </thead>
                <tbody>
                  {sectorHeatmap.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.sector}</td>
                      {['readiness', 'tpt', 'gfanz', 'nz'].map(col => (
                        <td key={col} style={{ textAlign: 'center', padding: '8px 12px' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 14px', borderRadius: 6, fontWeight: 700, fontSize: 13,
                            background: heatColor(row[col]) + '18', color: heatColor(row[col]),
                          }}>{row[col]}%</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sub-module cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 22 }}>
            {SUB_MODULES.map((m, i) => (
              <div key={i} style={{ ...sCard, padding: 16, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,58,92,0.1)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(27,58,92,0.06)'}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{m.name}</div>
                <div style={{ fontSize: 12, color: T.textSec, margin: '4px 0' }}>{m.desc}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.sage }}>{m.stat}</div>
              </div>
            ))}
          </div>

          {/* TPT Distribution + Risks + Opportunities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {/* TPT Pie */}
            <div style={sCard}>
              <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700 }}>TPT Status Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={tptDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                    {tptDistribution.map((_, i) => <Cell key={i} fill={tptPieColors[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top 5 Risks */}
            <div style={sCard}>
              <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: T.red }}>Top 5 Risks</h3>
              {TOP_RISKS.map(r => (
                <div key={r.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, flex: 1 }}>{r.text}</span>
                    <span style={sBadge(r.severity === 'Critical' ? T.red : r.severity === 'High' ? T.amber : T.gold)}>{r.severity}</span>
                  </div>
                  <span style={{ fontSize: 11, color: T.textMut }}>{r.sector}</span>
                </div>
              ))}
            </div>

            {/* Top 5 Opportunities */}
            <div style={sCard}>
              <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: T.green }}>Top 5 Opportunities</h3>
              {TOP_OPPS.map(o => (
                <div key={o.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, flex: 1 }}>{o.text}</span>
                    <span style={sBadge(o.impact === 'High' ? T.green : T.sage)}>{o.impact}</span>
                  </div>
                  <span style={{ fontSize: 11, color: T.textMut }}>{o.sector}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ACT Grade Distribution + Readiness Trend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
            <div style={sCard}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>ACT Grade Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ACT_GRADES.map(g => ({ grade: g, count: COMPANIES.filter(c => c.actGrade === g).length }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="grade" tick={{ fontSize: 12, fill: T.textSec, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="count" name="Companies" radius={[6, 6, 0, 0]} barSize={40}>
                    {ACT_GRADES.map((g, i) => <Cell key={i} fill={gradeColor(g)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sCard}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Readiness Trend (Quarterly)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={[
                  { q: 'Q1 25', readiness: 41, coverage: 22 }, { q: 'Q2 25', readiness: 47, coverage: 30 },
                  { q: 'Q3 25', readiness: 52, coverage: 37 }, { q: 'Q4 25', readiness: 56, coverage: 44 },
                  { q: 'Q1 26', readiness: 61, coverage: 51 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="q" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Area type="monotone" dataKey="readiness" stroke={T.navy} fill={T.navy} fillOpacity={0.12} strokeWidth={2} name="Readiness %" />
                  <Area type="monotone" dataKey="coverage" stroke={T.sage} fill={T.sage} fillOpacity={0.1} strokeWidth={2} name="TPT Coverage %" />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Credibility tier breakdown bar */}
          <div style={{ ...sCard, marginTop: 18 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Credibility Tier by Sector</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={SECTORS.map(sec => {
                const cos = COMPANIES.filter(c => c.sector === sec);
                return {
                  sector: sec,
                  High: cos.filter(c => c.credibilityTier === 'High').length,
                  Medium: cos.filter(c => c.credibilityTier === 'Medium').length,
                  Low: cos.filter(c => c.credibilityTier === 'Low').length,
                  'Very Low': cos.filter(c => c.credibilityTier === 'Very Low').length,
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
                <Bar dataKey="High" stackId="a" fill={T.green} barSize={22} />
                <Bar dataKey="Medium" stackId="a" fill={T.gold} />
                <Bar dataKey="Low" stackId="a" fill={T.amber} />
                <Bar dataKey="Very Low" stackId="a" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 2: Portfolio Transition View                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <div>
          {/* Multi-filter bar */}
          <div style={{ ...sCard, padding: 14, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>Filters:</span>
            {[
              { label: 'Sector', value: filterSector, set: setFilterSector, opts: ['All', ...SECTORS] },
              { label: 'TPT Status', value: filterTPT, set: setFilterTPT, opts: ['All', ...TPT_STATUSES] },
              { label: 'ACT Grade', value: filterGrade, set: setFilterGrade, opts: ['All', ...ACT_GRADES] },
              { label: 'NZ Committed', value: filterNZ, set: setFilterNZ, opts: ['All', 'Yes', 'No'] },
            ].map(f => (
              <label key={f.label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
                {f.label}:
                <select value={f.value} onChange={e => f.set(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: T.surface }}>
                  {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
            <span style={{ fontSize: 12, color: T.textMut, marginLeft: 'auto' }}>{filteredCompanies.length} companies</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedCo ? '2.5fr 1fr' : '1fr', gap: 16 }}>
            {/* Company table */}
            <div style={{ ...sCard, padding: 0, overflow: 'hidden' }}>
              <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 2 }}>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {[
                        { key: 'name', label: 'Company' }, { key: 'sector', label: 'Sector' },
                        { key: 'tptStatus', label: 'TPT Status' }, { key: 'actGrade', label: 'ACT Grade' },
                        { key: 'gfanzAligned', label: 'GFANZ' }, { key: 'nzCommitted', label: 'NZ' },
                        { key: 'credibilityTier', label: 'Credibility' },
                      ].map(col => (
                        <th key={col.key} onClick={() => handleSort(col.key)}
                          style={{ padding: '10px 10px', textAlign: 'left', cursor: 'pointer', color: T.textSec, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3, userSelect: 'none' }}>
                          {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map(c => (
                      <tr key={c.id} onClick={() => setSelectedCo(c)} style={{
                        borderBottom: `1px solid ${T.border}`, cursor: 'pointer',
                        background: selectedCo?.id === c.id ? T.surfaceH : 'transparent',
                        transition: 'background 0.1s',
                      }}
                        onMouseOver={e => { if (selectedCo?.id !== c.id) e.currentTarget.style.background = T.surfaceH; }}
                        onMouseOut={e => { if (selectedCo?.id !== c.id) e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '8px 10px' }}>{c.sector}</td>
                        <td style={{ padding: '8px 10px' }}><span style={sBadge(statusColor(c.tptStatus))}>{c.tptStatus}</span></td>
                        <td style={{ padding: '8px 10px' }}><span style={{ ...sBadge(gradeColor(c.actGrade)), fontWeight: 800 }}>{c.actGrade}</span></td>
                        <td style={{ padding: '8px 10px' }}><span style={sBadge(c.gfanzAligned ? T.green : T.red)}>{c.gfanzAligned ? 'Yes' : 'No'}</span></td>
                        <td style={{ padding: '8px 10px' }}><span style={sBadge(c.nzCommitted ? T.green : T.red)}>{c.nzCommitted ? 'Yes' : 'No'}</span></td>
                        <td style={{ padding: '8px 10px' }}><span style={sBadge(tierColor(c.credibilityTier))}>{c.credibilityTier}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side panel - radar scorecard */}
            {selectedCo && (
              <div style={{ ...sCard }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{selectedCo.name}</h3>
                  <button onClick={() => setSelectedCo(null)} style={{ ...sBtn(false), padding: '4px 10px', fontSize: 11 }}>Close</button>
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
                  {selectedCo.sector} | {selectedCo.tptStatus} | ACT: {selectedCo.actGrade} | Credibility: {selectedCo.credibilityTier}
                </div>
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: T.navy }}>Transition Scorecard</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={[
                    { dim: 'Governance', val: selectedCo.radarGovernance },
                    { dim: 'Strategy', val: selectedCo.radarStrategy },
                    { dim: 'Metrics', val: selectedCo.radarMetrics },
                    { dim: 'Targets', val: selectedCo.radarTargets },
                    { dim: 'Credibility', val: selectedCo.radarCredibility },
                  ]}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.font }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="val" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                  {[
                    { label: 'Readiness', val: `${selectedCo.readiness}%` },
                    { label: 'Green CapEx', val: `${selectedCo.greenCapex}%` },
                    { label: 'GFANZ', val: selectedCo.gfanzAligned ? 'Aligned' : 'Not Aligned' },
                    { label: 'NZ Committed', val: selectedCo.nzCommitted ? 'Yes' : 'No' },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '6px 10px', background: T.surfaceH, borderRadius: 6, fontSize: 12 }}>
                      <div style={{ color: T.textMut, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                      <div style={{ fontWeight: 700, color: T.navy }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sector allocation vs pathway alignment + Coverage gap */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginTop: 16 }}>
            <div style={sCard}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Sector Allocation vs Pathway Alignment</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scatterData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="sector" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={90} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="allocation" fill={T.navy} name="Allocation %" barSize={12} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="alignment" fill={T.sage} name="Alignment %" barSize={12} radius={[0, 4, 4, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={sCard}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Coverage Gap Analysis</h3>
              {coverageGap.map((g, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>{g.label}</span>
                    <span style={{ color: T.red }}>{g.count} ({g.pct}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: T.surfaceH }}>
                    <div style={{ height: 8, borderRadius: 4, background: T.red + 'cc', width: `${g.pct}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 3: Engagement Pipeline                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <div>
          {/* Pipeline summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
            {pipelineStats.byStage.map((s, i) => (
              <div key={s.stage} style={{ ...sCard, padding: 14, borderTop: `4px solid ${STAGE_COLORS[i]}`, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: STAGE_COLORS[i] }}>{s.count}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginTop: 2 }}>{s.stage}</div>
              </div>
            ))}
          </div>

          {/* Pipeline bar chart + Priority pie */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={sCard}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Pipeline by Stage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pipelineStats.byStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                    {pipelineStats.byStage.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sCard}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>By Priority</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pipelineStats.byPriority} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {pipelineStats.byPriority.map((_, i) => <Cell key={i} fill={[T.red, T.amber, T.gold, T.sage][i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Add engagement button */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => setShowAddEng(!showAddEng)} style={sBtn(showAddEng)}>
              {showAddEng ? 'Cancel' : '+ Add Engagement'}
            </button>
            <span style={{ fontSize: 12, color: T.textMut }}>Total: {engagements.length} engagements</span>
          </div>

          {/* Add engagement form */}
          {showAddEng && (
            <div style={{ ...sCard, marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 12, color: T.textSec }}>
                Company
                <input value={newEng.company} onChange={e => setNewEng(p => ({ ...p, company: e.target.value }))}
                  style={{ display: 'block', marginTop: 4, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, width: 180 }}
                  placeholder="Company name" />
              </label>
              <label style={{ fontSize: 12, color: T.textSec }}>
                Priority
                <select value={newEng.priority} onChange={e => setNewEng(p => ({ ...p, priority: e.target.value }))}
                  style={{ display: 'block', marginTop: 4, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12, color: T.textSec }}>
                Analyst
                <select value={newEng.analyst} onChange={e => setNewEng(p => ({ ...p, analyst: e.target.value }))}
                  style={{ display: 'block', marginTop: 4, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }}>
                  {ANALYSTS.map(a => <option key={a}>{a}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12, color: T.textSec }}>
                Notes
                <input value={newEng.notes} onChange={e => setNewEng(p => ({ ...p, notes: e.target.value }))}
                  style={{ display: 'block', marginTop: 4, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, width: 220 }}
                  placeholder="Initial notes" />
              </label>
              <button onClick={addEngagement} style={{ ...sBtn(true), background: T.sage, borderColor: T.sage }}>Add</button>
            </div>
          )}

          {/* Engagement table with stage progression */}
          <div style={{ ...sCard, padding: 0, overflow: 'hidden' }}>
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 2 }}>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Company','Sector','Stage','Priority','Analyst','Next Action','Notes','Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {engagements.map(e => {
                    const stageIdx = STAGES.indexOf(e.stage);
                    return (
                      <tr key={e.id} onClick={() => { setSelectedEng(e); setEngNoteEdit(e.notes); }}
                        style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: selectedEng?.id === e.id ? T.surfaceH : 'transparent' }}>
                        <td style={{ padding: '8px 8px', fontWeight: 600 }}>{e.company}</td>
                        <td style={{ padding: '8px 8px' }}>{e.sector}</td>
                        <td style={{ padding: '8px 8px' }}>
                          <span style={{ ...sBadge(STAGE_COLORS[stageIdx]), fontSize: 11 }}>{e.stage}</span>
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <span style={sBadge(e.priority === 'Critical' ? T.red : e.priority === 'High' ? T.amber : e.priority === 'Medium' ? T.gold : T.sage)}>
                            {e.priority}
                          </span>
                        </td>
                        <td style={{ padding: '8px 8px' }}>{e.analyst}</td>
                        <td style={{ padding: '8px 8px', fontFamily: T.mono, fontSize: 11 }}>{e.nextAction}</td>
                        <td style={{ padding: '8px 8px', color: T.textMut, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.notes || '--'}
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => moveStage(e.id, -1)} disabled={stageIdx === 0}
                              style={{ ...sBtn(false), padding: '3px 8px', fontSize: 10, opacity: stageIdx === 0 ? 0.3 : 1 }}
                              title="Move back">&larr;</button>
                            <button onClick={() => moveStage(e.id, 1)} disabled={stageIdx === STAGES.length - 1}
                              style={{ ...sBtn(false), padding: '3px 8px', fontSize: 10, opacity: stageIdx === STAGES.length - 1 ? 0.3 : 1 }}
                              title="Move forward">&rarr;</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Engagement detail panel */}
          {selectedEng && (
            <div style={{ ...sCard, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.navy }}>
                  Engagement Detail: {selectedEng.company}
                </h3>
                <button onClick={() => setSelectedEng(null)} style={{ ...sBtn(false), padding: '4px 12px', fontSize: 11 }}>Close</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {/* Left: info */}
                <div>
                  <div style={{ fontSize: 12, marginBottom: 10 }}>
                    {[
                      { label: 'Sector', value: selectedEng.sector },
                      { label: 'Current Stage', value: selectedEng.stage },
                      { label: 'Priority', value: selectedEng.priority },
                      { label: 'Assigned Analyst', value: selectedEng.analyst },
                      { label: 'Next Action Date', value: selectedEng.nextAction },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ color: T.textMut, fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontWeight: 700, color: T.navy }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Notes</label>
                    <textarea value={engNoteEdit} onChange={e => setEngNoteEdit(e.target.value)}
                      rows={3} style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, resize: 'vertical' }}
                      placeholder="Add engagement notes..." />
                    <button onClick={() => {
                      setEngagements(prev => prev.map(eng => eng.id === selectedEng.id ? { ...eng, notes: engNoteEdit } : eng));
                      setSelectedEng(prev => ({ ...prev, notes: engNoteEdit }));
                    }} style={{ ...sBtn(true), marginTop: 6, background: T.sage, borderColor: T.sage, fontSize: 11 }}>Save Notes</button>
                  </div>
                </div>
                {/* Middle: stage timeline */}
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px' }}>Stage Timeline</h4>
                  {STAGES.map((stage, i) => {
                    const currentIdx = STAGES.indexOf(selectedEng.stage);
                    const isActive = i === currentIdx;
                    const isPast = i < currentIdx;
                    return (
                      <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isPast ? T.green : isActive ? T.navy : T.surfaceH,
                          color: isPast || isActive ? '#fff' : T.textMut, fontSize: 11, fontWeight: 700,
                          border: `2px solid ${isPast ? T.green : isActive ? T.navy : T.border}`,
                        }}>{isPast ? '\u2713' : i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? T.navy : isPast ? T.green : T.textMut }}>{stage}</div>
                        </div>
                        {isActive && <span style={sBadge(T.navy)}>Current</span>}
                      </div>
                    );
                  })}
                </div>
                {/* Right: quick actions */}
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px' }}>Quick Actions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={() => moveStage(selectedEng.id, 1)} style={{ ...sBtn(true), background: T.sage, borderColor: T.sage, textAlign: 'left' }}>
                      Advance to Next Stage &rarr;
                    </button>
                    <button onClick={() => moveStage(selectedEng.id, -1)} style={{ ...sBtn(false), textAlign: 'left' }}>
                      &larr; Revert to Previous Stage
                    </button>
                    <button onClick={() => {
                      setEngagements(prev => prev.map(eng => eng.id === selectedEng.id ? { ...eng, priority: 'Critical' } : eng));
                      setSelectedEng(prev => ({ ...prev, priority: 'Critical' }));
                    }} style={{ ...sBtn(false), textAlign: 'left', color: T.red, borderColor: T.red }}>
                      Escalate to Critical
                    </button>
                  </div>
                  <div style={{ marginTop: 16, padding: 12, background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, marginBottom: 6 }}>ENGAGEMENT HISTORY</div>
                    {[
                      { date: '2026-03-15', action: 'Initial screening completed' },
                      { date: '2026-03-22', action: 'Letter sent to board' },
                      { date: '2026-03-28', action: 'Response received, under review' },
                    ].map((h, i) => (
                      <div key={i} style={{ fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
                        <span style={{ color: T.textMut, fontFamily: T.mono, fontSize: 10 }}>{h.date}</span>
                        <span>{h.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engagement sector breakdown */}
          <div style={{ ...sCard, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Engagements by Sector</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SECTORS.map(sec => ({ sector: sec, count: engagements.filter(e => e.sector === sec).length })).filter(d => d.count > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Bar dataKey="count" fill={T.navyL} name="Engagements" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 4: Board Report                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <div>
          {/* Controls */}
          <div style={{ ...sCard, padding: 14, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
              From:
              <input type="date" value={boardDateFrom} onChange={e => setBoardDateFrom(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            </label>
            <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
              To:
              <input type="date" value={boardDateTo} onChange={e => setBoardDateTo(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {['Board', 'IC', 'Regulator'].map(a => (
                <button key={a} onClick={() => setBoardAudience(a)} style={sBtn(boardAudience === a)}>{a}</button>
              ))}
            </div>
            <button onClick={exportCSV} style={{ ...sBtn(true), background: T.sage, borderColor: T.sage, marginLeft: 'auto' }}>
              Export CSV
            </button>
            <button onClick={() => window.print()} style={{ ...sBtn(false) }}>Print Preview</button>
          </div>

          {/* Section toggles */}
          <div style={{ ...sCard, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Report Sections</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {REPORT_SECTIONS.map(s => (
                <label key={s} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={boardSections[s]} onChange={() => setBoardSections(p => ({ ...p, [s]: !p[s] }))} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {/* Quarterly comparison */}
          <div style={{ ...sCard, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Quarterly Comparison</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={boardQuarterlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
                <Line type="monotone" dataKey="readiness" stroke={T.navy} strokeWidth={2} name="Readiness %" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="tptCoverage" stroke={T.sage} strokeWidth={2} name="TPT Coverage %" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="gfanzPct" stroke={T.gold} strokeWidth={2} name="GFANZ %" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="nzPct" stroke={T.green} strokeWidth={2} name="NZ Committed %" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="credibility" stroke={T.amber} strokeWidth={2} name="Credibility" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Report Sections - expandable */}
          {REPORT_SECTIONS.filter(s => boardSections[s]).map((section, sIdx) => {
            const isExpanded = expandedSections[section];
            return (
              <div key={section} style={{ ...sCard, marginBottom: 12 }}>
                <div onClick={() => setExpandedSections(p => ({ ...p, [section]: !p[section] }))}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.navy }}>
                    {sIdx + 1}. {section}
                  </h3>
                  <span style={{ fontSize: 18, color: T.textMut, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    &#x25BC;
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 16 }}>
                    {/* Executive Summary */}
                    {section === 'Executive Summary' && (
                      <div>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: T.textSec, margin: '0 0 14px' }}>
                          {boardAudience === 'Board'
                            ? 'This report provides the Board with a comprehensive overview of the portfolio transition planning status. Key highlights include improving TPT coverage, strengthening GFANZ alignment, and ongoing engagement with laggard companies.'
                            : boardAudience === 'IC'
                            ? 'Investment Committee briefing: transition readiness metrics show positive momentum across all sectors, with notable improvement in utilities and technology. Engagement pipeline active with 30 companies.'
                            : 'Regulatory disclosure summary: portfolio demonstrates systematic approach to transition planning aligned with TPT framework, GFANZ expectations, and emerging regulatory requirements.'
                          }
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                          {kpis.slice(0, 6).map((k, i) => {
                            const prevVal = typeof k.value === 'string' && !isNaN(parseFloat(k.value)) ? (parseFloat(k.value) - parseFloat(k.delta)).toFixed(1) : '--';
                            return (
                              <div key={i} style={{ padding: 12, background: T.surfaceH, borderRadius: 8 }}>
                                <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600 }}>{k.label}</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                                  <span style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>{k.value}{k.unit}</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: T.green }}>{k.delta}</span>
                                </div>
                                <div style={{ fontSize: 11, color: T.textMut }}>Prior: {prevVal}{k.unit}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Transition Readiness */}
                    {section === 'Transition Readiness' && (
                      <div>
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={boardQuarterlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                            <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: T.textSec }} />
                            <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                            <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                            <Area type="monotone" dataKey="readiness" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} name="Readiness %" />
                            <Area type="monotone" dataKey="tptCoverage" stroke={T.sage} fill={T.sage} fillOpacity={0.1} strokeWidth={2} name="TPT Coverage %" />
                          </AreaChart>
                        </ResponsiveContainer>
                        <div style={{ marginTop: 12 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                                <th style={{ textAlign: 'left', padding: '8px 10px', color: T.textSec, fontWeight: 600 }}>Sector</th>
                                <th style={{ textAlign: 'center', padding: '8px 10px', color: T.textSec, fontWeight: 600 }}>Readiness</th>
                                <th style={{ textAlign: 'center', padding: '8px 10px', color: T.textSec, fontWeight: 600 }}>Delta</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sectorHeatmap.map((row, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{row.sector}</td>
                                  <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                                    <span style={sBadge(heatColor(row.readiness))}>{row.readiness}%</span>
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '6px 10px', color: T.green, fontWeight: 600 }}>
                                    +{Math.round(2 + sr(i * 97) * 6)}pp
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* GFANZ Alignment */}
                    {section === 'GFANZ Alignment' && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Pie data={[
                                  { name: 'Aligned', value: COMPANIES.filter(c => c.gfanzAligned).length },
                                  { name: 'Not Aligned', value: COMPANIES.filter(c => !c.gfanzAligned).length },
                                ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                                  <Cell fill={T.green} />
                                  <Cell fill={T.red} />
                                </Pie>
                                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>GFANZ Alignment by Sector</h4>
                            {sectorHeatmap.map((row, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                                <span>{row.sector}</span>
                                <span style={sBadge(heatColor(row.gfanz))}>{row.gfanz}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NZ Commitments */}
                    {section === 'NZ Commitments' && (
                      <div>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={sectorHeatmap}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
                            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                            <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                            <Bar dataKey="nz" fill={T.sage} name="NZ Committed %" radius={[6, 6, 0, 0]} barSize={28}>
                              {sectorHeatmap.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div style={{ marginTop: 12, padding: 12, background: T.surfaceH, borderRadius: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Key Observations</div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.textSec, lineHeight: 1.8 }}>
                            <li>Net-zero committed companies: {COMPANIES.filter(c => c.nzCommitted).length} of 150 ({((COMPANIES.filter(c => c.nzCommitted).length / 150) * 100).toFixed(1)}%)</li>
                            <li>Utilities and Technology sectors lead NZ adoption</li>
                            <li>Energy and Materials sectors require focused engagement</li>
                            <li>12 companies upgraded NZ commitment tier this quarter</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Credibility Assessment */}
                    {section === 'Credibility Assessment' && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Pie data={CRED_TIERS.map(t => ({ name: t, value: COMPANIES.filter(c => c.credibilityTier === t).length }))}
                                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={3}>
                                  <Cell fill={T.green} />
                                  <Cell fill={T.gold} />
                                  <Cell fill={T.amber} />
                                  <Cell fill={T.red} />
                                </Pie>
                                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>Credibility Tier Distribution</h4>
                            {CRED_TIERS.map(t => {
                              const count = COMPANIES.filter(c => c.credibilityTier === t).length;
                              const pct = ((count / 150) * 100).toFixed(1);
                              return (
                                <div key={t} style={{ marginBottom: 10 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
                                    <span>{t}</span>
                                    <span style={{ color: tierColor(t) }}>{count} ({pct}%)</span>
                                  </div>
                                  <div style={{ height: 6, borderRadius: 3, background: T.surfaceH }}>
                                    <div style={{ height: 6, borderRadius: 3, background: tierColor(t), width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {section === 'Recommendations' && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px', color: T.red }}>Priority Actions</h4>
                            {[
                              { action: 'Escalate engagement with Energy sector laggards (8 companies, E-grade ACT)', timeline: 'Q2 2026', owner: 'ESG Team' },
                              { action: 'Request TPT plan disclosure from 23 companies with no plan', timeline: 'Q2 2026', owner: 'Stewardship' },
                              { action: 'Review GFANZ alignment gaps in Finance sector portfolio', timeline: 'Q3 2026', owner: 'Portfolio Mgr' },
                              { action: 'Conduct credibility deep-dive on 18 Very Low tier holdings', timeline: 'Q2 2026', owner: 'Analyst Team' },
                            ].map((r, i) => (
                              <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: T.surfaceH, borderRadius: 8, borderLeft: `3px solid ${T.red}` }}>
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{r.action}</div>
                                <div style={{ fontSize: 11, color: T.textMut }}>Timeline: {r.timeline} | Owner: {r.owner}</div>
                              </div>
                            ))}
                          </div>
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px', color: T.green }}>Positive Developments</h4>
                            {[
                              { item: 'Transition readiness improved +3.2pp quarter-over-quarter', impact: 'Portfolio-wide' },
                              { item: 'Utilities sector achieved 78% GFANZ alignment', impact: 'Sector leader' },
                              { item: '5 companies upgraded from Low to Medium credibility tier', impact: 'Engagement win' },
                              { item: 'Green CapEx ratio trending upward across 7 of 10 sectors', impact: 'Structural shift' },
                            ].map((r, i) => (
                              <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: T.surfaceH, borderRadius: 8, borderLeft: `3px solid ${T.green}` }}>
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{r.item}</div>
                                <div style={{ fontSize: 11, color: T.textMut }}>Impact: {r.impact}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quarterly delta summary */}
                        <div style={{ marginTop: 16 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>Quarterly Delta Summary</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                            {boardQuarterlyData.slice(-2).length === 2 && (() => {
                              const curr = boardQuarterlyData[boardQuarterlyData.length - 1];
                              const prev = boardQuarterlyData[boardQuarterlyData.length - 2];
                              return [
                                { label: 'Readiness', delta: curr.readiness - prev.readiness },
                                { label: 'TPT Coverage', delta: curr.tptCoverage - prev.tptCoverage },
                                { label: 'GFANZ', delta: curr.gfanzPct - prev.gfanzPct },
                                { label: 'NZ Committed', delta: curr.nzPct - prev.nzPct },
                                { label: 'Credibility', delta: curr.credibility - prev.credibility },
                              ].map((d, i) => (
                                <div key={i} style={{ padding: 12, background: T.surfaceH, borderRadius: 8, textAlign: 'center' }}>
                                  <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600 }}>{d.label}</div>
                                  <div style={{ fontSize: 22, fontWeight: 800, color: d.delta >= 0 ? T.green : T.red, marginTop: 4 }}>
                                    {d.delta >= 0 ? '+' : ''}{d.delta}pp
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
