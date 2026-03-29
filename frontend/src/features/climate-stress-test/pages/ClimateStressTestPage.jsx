import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, Cell, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { EU_ETS_ANNUAL, NGFS_CARBON_PRICES } from '../../../data/carbonPrices';
import { NGFS_SCENARIOS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = s => { let x = Math.sin(s+1)*10000; return x-Math.floor(x); };

// ─── Scenario definitions ─────────────────────────────────────────────────────
const SCENARIOS = {
  nz: { key:'nz', label:'Net Zero 2050',     color:'#16a34a', temp:'1.5°C', type:'Orderly' },
  dt: { key:'dt', label:'Delayed Transition', color:'#d97706', temp:'1.8°C', type:'Disorderly' },
  hh: { key:'hh', label:'Hot House World',    color:'#dc2626', temp:'3°C+',  type:'No Action' },
};

const YEARS = [2025, 2030, 2035, 2040, 2050];

// NGFS Phase IV shadow carbon prices ($/t)
const CARBON_PRICE = {
  nz: { 2025:45,  2030:130, 2035:190, 2040:230,  2050:250  },
  dt: { 2025:5,   2030:12,  2035:800, 2040:1000, 2050:1200 },
  hh: { 2025:10,  2030:15,  2035:20,  2040:25,   2050:30   },
};

// CET1 impact (pp) by scenario / year
const CET1_IMPACT = {
  nz: { 2025:-0.3, 2030:-0.7, 2035:-1.1, 2040:-1.4, 2050:-1.6 },
  dt: { 2025:-0.1, 2030:-0.3, 2035:-2.8, 2040:-3.5, 2050:-4.2 },
  hh: { 2025:-0.2, 2030:-0.5, 2035:-0.9, 2040:-1.8, 2050:-3.4 },
};

// GDP shock (%) by scenario / year
const GDP_SHOCK = {
  nz: { 2025:-0.3, 2030:-0.8, 2035:-1.0, 2040:-0.9, 2050:-0.5 },
  dt: { 2025:-0.1, 2030:-0.2, 2035:-3.2, 2040:-4.1, 2050:-2.8 },
  hh: { 2025:-0.4, 2030:-1.1, 2035:-2.0, 2040:-3.4, 2050:-5.8 },
};

// ─── 30 Sectors ───────────────────────────────────────────────────────────────
const SECTORS_RAW = [
  { id:'s1',  name:'Coal Mining',              basePD:3.2, nzMult:2.8, dtMult:1.9, hhMult:1.4, transRisk:9, physRisk:5, reg:'ETS, CBAM',          ebitda:42 },
  { id:'s2',  name:'Oil Upstream',             basePD:2.1, nzMult:2.4, dtMult:1.6, hhMult:1.3, transRisk:8, physRisk:6, reg:'ETS, CBAM',          ebitda:31 },
  { id:'s3',  name:'Gas Upstream',             basePD:1.8, nzMult:2.0, dtMult:1.4, hhMult:1.2, transRisk:7, physRisk:5, reg:'ETS',                ebitda:28 },
  { id:'s4',  name:'Oil Refining',             basePD:2.4, nzMult:2.6, dtMult:1.8, hhMult:1.3, transRisk:8, physRisk:4, reg:'ETS, CBAM',          ebitda:38 },
  { id:'s5',  name:'Petrochemicals',           basePD:1.9, nzMult:2.1, dtMult:1.5, hhMult:1.2, transRisk:7, physRisk:4, reg:'ETS, CBAM',          ebitda:30 },
  { id:'s6',  name:'Steel (BF)',               basePD:2.7, nzMult:2.5, dtMult:1.7, hhMult:1.2, transRisk:8, physRisk:3, reg:'ETS, CBAM, MEES',    ebitda:35 },
  { id:'s7',  name:'Steel (EAF)',              basePD:1.6, nzMult:1.3, dtMult:1.2, hhMult:1.1, transRisk:4, physRisk:3, reg:'ETS',                ebitda:12 },
  { id:'s8',  name:'Cement',                  basePD:2.3, nzMult:2.3, dtMult:1.6, hhMult:1.2, transRisk:8, physRisk:4, reg:'ETS, CBAM',          ebitda:33 },
  { id:'s9',  name:'Lime',                    basePD:2.0, nzMult:2.1, dtMult:1.5, hhMult:1.1, transRisk:7, physRisk:3, reg:'ETS, CBAM',          ebitda:29 },
  { id:'s10', name:'Aluminium',               basePD:1.8, nzMult:1.9, dtMult:1.4, hhMult:1.1, transRisk:6, physRisk:3, reg:'ETS, CBAM',          ebitda:25 },
  { id:'s11', name:'Copper',                  basePD:1.4, nzMult:1.5, dtMult:1.3, hhMult:1.2, transRisk:5, physRisk:6, reg:'CBAM',               ebitda:18 },
  { id:'s12', name:'Aviation',                basePD:3.1, nzMult:2.2, dtMult:1.6, hhMult:1.5, transRisk:8, physRisk:5, reg:'ETS, CORSIA',         ebitda:26 },
  { id:'s13', name:'Shipping',                basePD:2.5, nzMult:1.9, dtMult:1.5, hhMult:1.6, transRisk:7, physRisk:7, reg:'IMO, ETS',           ebitda:22 },
  { id:'s14', name:'Road Freight',            basePD:1.7, nzMult:1.8, dtMult:1.4, hhMult:1.2, transRisk:6, physRisk:4, reg:'ETS, CO2 standards', ebitda:20 },
  { id:'s15', name:'Automotive (ICE)',        basePD:2.2, nzMult:2.4, dtMult:1.7, hhMult:1.2, transRisk:8, physRisk:3, reg:'ZEV mandate',         ebitda:28 },
  { id:'s16', name:'Automotive (EV)',         basePD:1.5, nzMult:0.9, dtMult:1.1, hhMult:1.2, transRisk:2, physRisk:3, reg:'Supply chain',        ebitda:8  },
  { id:'s17', name:'Power (coal)',            basePD:3.5, nzMult:3.1, dtMult:2.0, hhMult:1.3, transRisk:10,physRisk:5, reg:'ETS, MEES',           ebitda:45 },
  { id:'s18', name:'Power (gas)',             basePD:1.9, nzMult:1.8, dtMult:1.5, hhMult:1.2, transRisk:6, physRisk:4, reg:'ETS',                ebitda:22 },
  { id:'s19', name:'Power (renewable)',       basePD:0.8, nzMult:0.7, dtMult:0.9, hhMult:1.1, transRisk:1, physRisk:5, reg:'Minimal',             ebitda:5  },
  { id:'s20', name:'Agriculture (intensive)', basePD:1.6, nzMult:1.7, dtMult:1.4, hhMult:1.8, transRisk:5, physRisk:8, reg:'CBAM, nitrates',      ebitda:18 },
  { id:'s21', name:'Agriculture (organic)',   basePD:1.3, nzMult:0.9, dtMult:1.1, hhMult:1.5, transRisk:2, physRisk:7, reg:'Minimal',             ebitda:8  },
  { id:'s22', name:'Commercial RE (EPC A-C)', basePD:1.1, nzMult:1.0, dtMult:1.1, hhMult:1.3, transRisk:2, physRisk:6, reg:'MEES, SFDR',          ebitda:10 },
  { id:'s23', name:'Commercial RE (EPC D-G)', basePD:2.0, nzMult:2.4, dtMult:1.6, hhMult:1.5, transRisk:7, physRisk:6, reg:'MEES, SFDR',          ebitda:30 },
  { id:'s24', name:'Mortgages (EPC A-C)',     basePD:0.6, nzMult:0.7, dtMult:0.8, hhMult:0.9, transRisk:1, physRisk:4, reg:'MEES',               ebitda:5  },
  { id:'s25', name:'Mortgages (EPC D-G)',     basePD:1.4, nzMult:1.9, dtMult:1.4, hhMult:1.3, transRisk:5, physRisk:5, reg:'MEES',               ebitda:20 },
  { id:'s26', name:'Construction',            basePD:2.1, nzMult:1.6, dtMult:1.4, hhMult:1.3, transRisk:5, physRisk:5, reg:'ETS (scope 3)',       ebitda:18 },
  { id:'s27', name:'Chemicals',               basePD:1.8, nzMult:1.9, dtMult:1.4, hhMult:1.2, transRisk:6, physRisk:4, reg:'CBAM, REACH',         ebitda:24 },
  { id:'s28', name:'Paper & Pulp',            basePD:1.5, nzMult:1.6, dtMult:1.3, hhMult:1.3, transRisk:5, physRisk:6, reg:'ETS',                ebitda:19 },
  { id:'s29', name:'Food Processing',         basePD:1.2, nzMult:1.3, dtMult:1.2, hhMult:1.5, transRisk:4, physRisk:7, reg:'CBAM (agri inputs)',  ebitda:14 },
  { id:'s30', name:'Technology',              basePD:0.7, nzMult:0.8, dtMult:0.9, hhMult:0.9, transRisk:2, physRisk:3, reg:'Data centres',        ebitda:6  },
];

// ─── 50 Borrowers (deterministic) ────────────────────────────────────────────
const BORROWERS = Array.from({ length: 50 }, (_, i) => {
  const sIdx = Math.floor(sr(i * 7) * 30);
  const s = SECTORS_RAW[sIdx];
  const countries = ['UK','DE','FR','NL','PL','SE','IT','ES','US','NO'];
  const country = countries[Math.floor(sr(i * 3 + 1) * 10)];
  const exposure = Math.round((sr(i * 5 + 2) * 480 + 20) * 10) / 10;
  const base = s.basePD + sr(i * 11) * 0.8 - 0.4;
  const bpd = Math.max(0.3, Math.round(base * 100) / 100);
  return {
    id: i + 1,
    name: `Borrower ${String(i + 1).padStart(2, '0')}`,
    sector: s.name,
    sectorId: s.id,
    country,
    exposure,
    basePD: bpd,
    nzStressedPD:  Math.round(bpd * s.nzMult * 100) / 100,
    dtStressedPD:  Math.round(bpd * s.dtMult * 100) / 100,
    hhStressedPD:  Math.round(bpd * s.hhMult * 100) / 100,
    eclUpliftNz: Math.round(bpd * (s.nzMult - 1) * exposure * 0.45 * 10) / 10,
    eclUpliftDt: Math.round(bpd * (s.dtMult - 1) * exposure * 0.45 * 10) / 10,
    eclUpliftHh: Math.round(bpd * (s.hhMult - 1) * exposure * 0.45 * 10) / 10,
  };
});

// Top borrowers per sector
const TOP_BORROWERS_BY_SECTOR = {};
BORROWERS.forEach(b => {
  if (!TOP_BORROWERS_BY_SECTOR[b.sector]) TOP_BORROWERS_BY_SECTOR[b.sector] = [];
  if (TOP_BORROWERS_BY_SECTOR[b.sector].length < 3) TOP_BORROWERS_BY_SECTOR[b.sector].push(b);
});

// ─── CET1 Waterfall — 8 components ───────────────────────────────────────────
const WATERFALL_COMPONENTS = [
  { name: 'Credit Risk (transition)',   nz:-0.28, dt:-1.12, hh:-0.65 },
  { name: 'Credit Risk (physical)',     nz:-0.14, dt:-0.09, hh:-0.82 },
  { name: 'Market Risk (repricing)',    nz:-0.08, dt:-0.31, hh:-0.12 },
  { name: 'Operational Risk',           nz:-0.04, dt:-0.15, hh:-0.09 },
  { name: 'Revenue (NII compression)',  nz:-0.06, dt:-0.24, hh:-0.18 },
  { name: 'RWA inflation',              nz:-0.10, dt:-0.38, hh:-0.22 },
  { name: 'Stranded asset write-off',   nz:-0.05, dt:-0.19, hh:-0.14 },
  { name: 'Insurance / hedging gain',   nz:+0.04, dt:+0.08, hh:+0.02 },
];

// ─── Regulatory frameworks ────────────────────────────────────────────────────
const REG_FRAMEWORKS = [
  {
    id:'ecb', name:'ECB Climate Stress Test', color:'#1b3a5c', deadline: new Date('2026-06-30'),
    items: [
      'Governance & strategy documentation',
      'Physical risk assessment (acute)',
      'Physical risk assessment (chronic)',
      'Transition risk scenario mapping (NGFS)',
      'Sector PD migration model',
      'Portfolio heat map by climate risk',
    ],
  },
  {
    id:'boe', name:'BoE CBES Framework', color:'#2c5a8c', deadline: new Date('2026-09-30'),
    items: [
      'Early Action scenario modelling',
      'Late Action scenario modelling',
      'No Additional Action baseline',
      'Counterparty-level vulnerability scores',
      'Mortgage EPC-linked PD curves',
      'Capital impact attestation',
    ],
  },
  {
    id:'eba', name:'EBA Pillar 3 Climate', color:'#5a8a6a', deadline: new Date('2026-12-31'),
    items: [
      'Template 1: GHG emissions (financed)',
      'Template 2: Sector exposure alignment',
      'Template 3: Physical risk exposure',
      'Template 4: Transition plan alignment',
      'CSRD alignment check',
    ],
  },
  {
    id:'bcbs', name:'BCBS 530 Principles', color:'#c5a96a', deadline: new Date('2027-03-31'),
    items: [
      'Governance — board-level climate ownership',
      'Internal controls — climate data quality',
      'Risk appetite — climate thresholds',
      'Scenario analysis — stress testing programme',
      'Capital & liquidity — climate buffers',
    ],
  },
];

const TEAM_MEMBERS = ['Unassigned','Risk Analytics','Capital Planning','Chief Risk Officer','Treasury','Sustainability Office'];

// ─── Small reusable components ────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
    padding:20, boxShadow:T.card, ...style }}>
    {children}
  </div>
);

const Pill = ({ label, active, color, onClick }) => (
  <button onClick={onClick} style={{
    padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
    border:`1.5px solid ${active ? color : T.border}`,
    background: active ? color : T.surface,
    color: active ? '#fff' : T.textSec,
    transition:'all 0.18s',
  }}>{label}</button>
);

const MetricCard = ({ label, value, sub, color }) => (
  <Card style={{ textAlign:'center', padding:16 }}>
    <div style={{ fontSize:10, color:T.textMut, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </Card>
);

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ClimateStressTestPage() {
  // Global state
  const [tab, setTab]                     = useState(0);
  const [activeScenario, setActiveScenario] = useState('nz');
  const [activeYear, setActiveYear]       = useState(2030);
  const [compareMode, setCompareMode]     = useState(false);
  const [customOpen, setCustomOpen]       = useState(false);
  const [custom, setCustom]               = useState({ cp30:130, cp50:250, gdp:-2, phys:1.5 });

  // Sector tab state
  const [sectorSearch, setSectorSearch]   = useState('');
  const [sectorScenario, setSectorScenario] = useState('nz');
  const [sectorYear, setSectorYear]       = useState(2030);
  const [sortCol, setSortCol]             = useState('stressedPD');
  const [sortAsc, setSortAsc]             = useState(false);
  const [expandedSector, setExpandedSector] = useState(null);
  const [pdThreshold, setPdThreshold]     = useState('');

  // Portfolio tab state
  const [portScenario, setPortScenario]   = useState('nz');
  const [portSectorFilter, setPortSectorFilter] = useState('All');
  const [portCountryFilter, setPortCountryFilter] = useState('All');
  const [portRunning, setPortRunning]     = useState(false);
  const [portRan, setPortRan]             = useState(false);

  // Regulatory tab state
  const [regState, setRegState]           = useState({});
  const [regOwner, setRegOwner]           = useState({});
  const [regExpanded, setRegExpanded]     = useState({});

  const sc = SCENARIOS[activeScenario];

  // ── Custom CET1 estimate ─────────────────────────────────────────────────
  const customCet1 = useMemo(() => {
    const base = CET1_IMPACT[activeScenario][activeYear];
    const cpFactor  = (custom.cp30 / 130) * 0.4;
    const gdpFactor = (Math.abs(custom.gdp) / 3) * 0.5;
    const physFactor = (custom.phys / 2) * 0.3;
    return Math.round((base - cpFactor - gdpFactor - physFactor) * 100) / 100;
  }, [activeScenario, activeYear, custom]);

  // ── Carbon price chart ───────────────────────────────────────────────────
  const carbonChartData = useMemo(() => YEARS.map(y => ({
    year: y,
    [SCENARIOS.nz.label]: CARBON_PRICE.nz[y],
    [SCENARIOS.dt.label]: CARBON_PRICE.dt[y],
    [SCENARIOS.hh.label]: CARBON_PRICE.hh[y],
    selected: CARBON_PRICE[activeScenario][y],
  })), [activeScenario]);

  // ── Sector table ─────────────────────────────────────────────────────────
  const sectorMultKey = { nz:'nzMult', dt:'dtMult', hh:'hhMult' }[sectorScenario];
  const filteredSectors = useMemo(() => {
    const yrFactor = sectorYear <= 2025 ? 0.4 : sectorYear <= 2030 ? 0.7 : 1.0;
    let rows = SECTORS_RAW.map(s => {
      const mult = 1 + (s[sectorMultKey] - 1) * yrFactor;
      const stressed = Math.round(s.basePD * mult * 100) / 100;
      return { ...s, stressedPD: stressed, pdChangeBps: Math.round((stressed - s.basePD) * 100), mult: Math.round(mult * 100) / 100 };
    }).filter(s => s.name.toLowerCase().includes(sectorSearch.toLowerCase()));

    rows.sort((a, b) => {
      const v = sortAsc ? 1 : -1;
      if (sortCol === 'name') return a.name.localeCompare(b.name) * v;
      return (a[sortCol] - b[sortCol]) * v;
    });
    return rows;
  }, [sectorSearch, sectorScenario, sectorYear, sortCol, sortAsc, sectorMultKey]);

  const thresholdNum = pdThreshold ? parseFloat(pdThreshold) : null;

  // ── Portfolio metrics ────────────────────────────────────────────────────
  const portMetrics = useMemo(() => {
    const eclKey = { nz:'eclUpliftNz', dt:'eclUpliftDt', hh:'eclUpliftHh' }[portScenario];
    const stKey  = { nz:'nzStressedPD', dt:'dtStressedPD', hh:'hhStressedPD' }[portScenario];
    const totalECL = BORROWERS.reduce((a, b) => a + b[eclKey], 0);
    const rwaDelta = totalECL * 1.8;
    const cet1pp   = CET1_IMPACT[portScenario][activeYear];
    const cvar     = Math.round(totalECL * 2.1 * 100) / 100;
    const nii      = Math.round(totalECL * 0.18 * 100) / 100;
    return { totalECL: Math.round(totalECL), rwaDelta: Math.round(rwaDelta), cet1pp, cvar, nii };
  }, [portScenario, activeYear]);

  const portCountries = ['All', ...Array.from(new Set(BORROWERS.map(b => b.country))).sort()];
  const portSectors   = ['All', ...Array.from(new Set(BORROWERS.map(b => b.sector))).sort()];

  const filteredBorrowers = useMemo(() => {
    const eclKey = { nz:'eclUpliftNz', dt:'eclUpliftDt', hh:'eclUpliftHh' }[portScenario];
    return BORROWERS
      .filter(b => portSectorFilter  === 'All' || b.sector  === portSectorFilter)
      .filter(b => portCountryFilter === 'All' || b.country === portCountryFilter)
      .sort((a, b) => b[eclKey] - a[eclKey]);
  }, [portScenario, portSectorFilter, portCountryFilter]);

  const waterfallData = useMemo(() => WATERFALL_COMPONENTS.map(c => ({
    name: c.name, value: c[activeScenario], fill: c[activeScenario] < 0 ? T.red : T.sage,
  })), [activeScenario]);

  const whatIfSaving = useMemo(() => {
    const eclKey = { nz:'eclUpliftNz', dt:'eclUpliftDt', hh:'eclUpliftHh' }[portScenario];
    const sorted = [...BORROWERS].sort((a, b) => b[eclKey] - a[eclKey]);
    const top5ecl = sorted.slice(0, 5).reduce((a, b) => a + b[eclKey], 0);
    return Math.round((top5ecl / portMetrics.totalECL) * Math.abs(portMetrics.cet1pp) * 100) / 100;
  }, [portScenario, portMetrics]);

  // ── Regulatory readiness ─────────────────────────────────────────────────
  const regReadiness = useMemo(() => {
    const total = REG_FRAMEWORKS.reduce((a, f) => a + f.items.length, 0);
    const done  = REG_FRAMEWORKS.reduce((a, f) => a + f.items.filter((_, i) => regState[`${f.id}_${i}`] === 'complete').length, 0);
    const prog  = REG_FRAMEWORKS.reduce((a, f) => a + f.items.filter((_, i) => regState[`${f.id}_${i}`] === 'progress').length, 0);
    return { total, done, prog, pct: Math.round((done / total) * 100) };
  }, [regState]);

  const daysUntil = d => Math.max(0, Math.ceil((d - new Date()) / 86400000));

  const cycleRegItem = (fid, idx) => {
    const k = `${fid}_${idx}`;
    const cur = regState[k] || 'not';
    setRegState(prev => ({ ...prev, [k]: cur === 'not' ? 'progress' : cur === 'progress' ? 'complete' : 'not' }));
  };

  const regItemColor = s => s === 'complete' ? T.green : s === 'progress' ? T.amber : T.textMut;
  const regItemLabel = s => s === 'complete' ? 'Complete' : s === 'progress' ? 'In Progress' : 'Not Started';

  // ── CSV export ────────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    const eclKey = { nz:'eclUpliftNz', dt:'eclUpliftDt', hh:'eclUpliftHh' }[portScenario];
    const stKey  = { nz:'nzStressedPD', dt:'dtStressedPD', hh:'hhStressedPD' }[portScenario];
    const rows   = [['ID','Name','Sector','Country','Exposure (£M)','Base PD (%)','Stressed PD (%)','ECL Uplift (£M)']];
    BORROWERS.forEach(b => rows.push([b.id, b.name, b.sector, b.country, b.exposure, b.basePD, b[stKey], b[eclKey]]));
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `stress_test_${portScenario}_${activeYear}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [portScenario, activeYear]);

  const handleRunStressTest = () => {
    setPortRunning(true);
    setTimeout(() => { setPortRunning(false); setPortRan(true); }, 2000);
  };

  const sortIcon = col => sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ' ↕';
  const handleSort = col => { if (sortCol === col) setSortAsc(a => !a); else { setSortCol(col); setSortAsc(false); } };

  const tabLabels = ['Scenario Builder', 'Sector PD Migration', 'Portfolio Impact', 'Regulatory Tracker'];

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', color:T.text }}>

      {/* Header */}
      <div style={{ background:T.navy, padding:'24px 32px 0', color:'#fff' }}>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Climate Stress Test Platform</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginBottom:16 }}>
          NGFS Phase IV — ECB / BoE CBES aligned — 3 scenarios × 5 horizons — 30 sectors — 50 borrowers
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {tabLabels.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding:'10px 20px', border:'none', borderRadius:'8px 8px 0 0', cursor:'pointer',
              fontFamily:T.font, fontWeight:600, fontSize:13,
              background: tab === i ? T.bg : 'transparent',
              color: tab === i ? T.navy : 'rgba(255,255,255,0.7)',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:24, maxWidth:1400, margin:'0 auto' }}>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 0  —  SCENARIO BUILDER
        ══════════════════════════════════════════════════════════════════ */}
        {tab === 0 && (
          <div>
            {/* Scenario pills + compare */}
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20, flexWrap:'wrap' }}>
              {Object.values(SCENARIOS).map(s => (
                <Pill key={s.key} label={s.label} active={activeScenario === s.key} color={s.color}
                  onClick={() => setActiveScenario(s.key)} />
              ))}
              <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                <button onClick={() => setCompareMode(m => !m)} style={{
                  padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
                  border:`1.5px solid ${compareMode ? T.navyL : T.border}`,
                  background: compareMode ? T.navyL : T.surface,
                  color: compareMode ? '#fff' : T.textSec,
                }}>Compare Mode</button>
                <button onClick={() => setCustomOpen(o => !o)} style={{
                  padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
                  border:`1.5px solid ${T.gold}`,
                  background: customOpen ? T.gold : T.surface,
                  color: customOpen ? '#fff' : T.textSec,
                }}>{customOpen ? '▲ Custom Scenario' : '▼ Build Custom Scenario'}</button>
              </div>
            </div>

            {/* Year horizon slider */}
            <Card style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontWeight:600, fontSize:14 }}>Year Horizon</span>
                <span style={{ fontWeight:700, fontSize:20, color:sc.color }}>{activeYear}</span>
              </div>
              <input type="range" min={0} max={4} step={1} value={YEARS.indexOf(activeYear)}
                onChange={e => setActiveYear(YEARS[+e.target.value])}
                style={{ width:'100%', accentColor:sc.color, marginBottom:10 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.textMut, marginBottom:16 }}>
                {YEARS.map(y => <span key={y}>{y}</span>)}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                <MetricCard label="Carbon Price (shadow $/t)" value={`$${CARBON_PRICE[activeScenario][activeYear]}`} color={sc.color} />
                <MetricCard label="CET1 Impact (pp)" value={`${CET1_IMPACT[activeScenario][activeYear]} pp`} color={T.red} />
                <MetricCard label="GDP Shock (%)" value={`${GDP_SHOCK[activeScenario][activeYear]}%`} color={T.amber} />
              </div>
            </Card>

            {/* Custom scenario builder */}
            {customOpen && (
              <Card style={{ marginBottom:16, borderColor:T.gold }}>
                <div style={{ fontWeight:600, marginBottom:14, color:T.gold }}>Custom Scenario Builder</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }}>
                  {[
                    { key:'cp30', label:'Carbon Price 2030 ($/t)', min:0,   max:500,  step:5 },
                    { key:'cp50', label:'Carbon Price 2050 ($/t)', min:0,   max:1500, step:10 },
                    { key:'gdp',  label:'GDP Shock (%)',            min:-15, max:0,    step:0.5 },
                    { key:'phys', label:'Physical Damage Factor',   min:0,   max:5,    step:0.1 },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize:12, color:T.textSec, marginBottom:4 }}>
                        {f.label}: <strong>{custom[f.key]}{f.key === 'gdp' ? '%' : ''}</strong>
                      </div>
                      <input type="range" min={f.min} max={f.max} step={f.step}
                        value={custom[f.key]}
                        onChange={e => setCustom(p => ({ ...p, [f.key]: +e.target.value }))}
                        style={{ width:'100%', accentColor:T.gold }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:16, padding:14, background:T.surfaceH, borderRadius:8, textAlign:'center' }}>
                  <span style={{ fontSize:13, color:T.textSec }}>Estimated CET1 Impact — custom scenario at {activeYear}: </span>
                  <span style={{ fontWeight:700, fontSize:22, color:T.red, marginLeft:8 }}>{customCet1} pp</span>
                </div>
              </Card>
            )}

            {/* Charts */}
            <div style={{ display:'grid', gridTemplateColumns: compareMode ? '1fr 1fr' : '3fr 2fr', gap:16, marginBottom:16 }}>
              <Card>
                <div style={{ fontWeight:600, marginBottom:12 }}>
                  Carbon Price Trajectory — {compareMode ? 'All Scenarios' : sc.label}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={carbonChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} unit="$/t" />
                    <Tooltip formatter={(v, n) => [`$${v}/t`, n]} />
                    {compareMode ? (
                      Object.values(SCENARIOS).map(s => (
                        <Area key={s.key} type="monotone" dataKey={s.label}
                          stroke={s.color} fill={s.color} fillOpacity={0.12} strokeWidth={2} dot={{ r:3 }} />
                      ))
                    ) : (
                      <Area type="monotone" dataKey="selected" name={sc.label}
                        stroke={sc.color} fill={sc.color} fillOpacity={0.15} strokeWidth={2.5} dot={{ r:4 }} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <div style={{ fontWeight:600, marginBottom:12 }}>CET1 Depletion by Horizon — {sc.label}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={YEARS.map(y => ({ year:y, impact: CET1_IMPACT[activeScenario][y] }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} unit=" pp" />
                    <Tooltip formatter={v => [`${v} pp`, 'CET1 Impact']} />
                    <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
                      {YEARS.map(y => <Cell key={y} fill={y === activeYear ? sc.color : '#c8d4e0'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* EU ETS historical */}
            <Card>
              <div style={{ fontWeight:600, marginBottom:12 }}>EU ETS Historical Price Context (EUR/tCO2e)</div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={EU_ETS_ANNUAL}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} unit="€" />
                  <Tooltip formatter={(v) => [`€${v}`, 'EU ETS avg']} />
                  <Area type="monotone" dataKey="price" stroke={T.navyL} fill={T.navyL}
                    fillOpacity={0.15} strokeWidth={2} dot={{ r:3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1  —  SECTOR PD MIGRATION
        ══════════════════════════════════════════════════════════════════ */}
        {tab === 1 && (
          <div>
            {/* Controls */}
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
              {Object.values(SCENARIOS).map(s => (
                <Pill key={s.key} label={s.label} active={sectorScenario === s.key} color={s.color}
                  onClick={() => setSectorScenario(s.key)} />
              ))}
              <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
                {[2025, 2030, 2035].map(y => (
                  <button key={y} onClick={() => setSectorYear(y)} style={{
                    padding:'5px 12px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer',
                    border:`1.5px solid ${sectorYear === y ? T.navy : T.border}`,
                    background: sectorYear === y ? T.navy : T.surface,
                    color: sectorYear === y ? '#fff' : T.textSec,
                  }}>{y}</button>
                ))}
              </div>
            </div>

            {/* Search + threshold */}
            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              <input placeholder="Search sectors..." value={sectorSearch}
                onChange={e => setSectorSearch(e.target.value)}
                style={{ flex:1, padding:'8px 12px', border:`1px solid ${T.border}`, borderRadius:8,
                  fontSize:13, fontFamily:T.font, color:T.text, background:T.surface }} />
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:T.textSec, whiteSpace:'nowrap' }}>Alert PD &gt;</span>
                <input type="number" placeholder="e.g. 4.0" value={pdThreshold}
                  onChange={e => setPdThreshold(e.target.value)}
                  style={{ width:80, padding:'8px 10px', border:`1px solid ${T.border}`, borderRadius:8,
                    fontSize:13, fontFamily:T.font, color:T.text, background:T.surface }} />
                <span style={{ fontSize:12, color:T.textSec }}>%</span>
              </div>
            </div>

            <div style={{ fontSize:12, color:T.textMut, marginBottom:8 }}>
              {filteredSectors.length} of 30 sectors · Click row to expand · Click headers to sort
            </div>

            <Card style={{ padding:0, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:T.surfaceH, borderBottom:`1px solid ${T.border}` }}>
                    {[
                      ['name','Sector'], ['basePD','Base PD (%)'], ['stressedPD','Stressed PD (%)'],
                      ['pdChangeBps','ΔPD (bps)'], ['mult','Multiplier'],
                      ['transRisk','Trans Risk'], ['physRisk','Phys Risk'],
                    ].map(([col, label]) => (
                      <th key={col} onClick={() => handleSort(col)} style={{
                        padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600,
                        color: sortCol === col ? T.navy : T.textSec, cursor:'pointer', userSelect:'none',
                      }}>{label}{sortIcon(col)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSectors.map(s => {
                    const breach   = thresholdNum && s.stressedPD > thresholdNum;
                    const expanded = expandedSector === s.id;
                    return (
                      <React.Fragment key={s.id}>
                        <tr onClick={() => setExpandedSector(expanded ? null : s.id)}
                          style={{
                            borderBottom:`1px solid ${T.border}`, cursor:'pointer',
                            background: breach ? 'rgba(220,38,38,0.05)' : expanded ? T.surfaceH : 'transparent',
                          }}>
                          <td style={{ padding:'9px 14px', fontSize:13, fontWeight:500,
                            color: breach ? T.red : T.text }}>
                            {s.name}{breach ? ' ⚠' : ''}
                          </td>
                          <td style={{ padding:'9px 14px', fontSize:13 }}>{s.basePD.toFixed(2)}</td>
                          <td style={{ padding:'9px 14px', fontSize:13, fontWeight:600,
                            color: s.stressedPD > s.basePD * 1.5 ? T.red
                              : s.stressedPD > s.basePD * 1.2 ? T.amber : T.green }}>
                            {s.stressedPD.toFixed(2)}
                          </td>
                          <td style={{ padding:'9px 14px', fontSize:13 }}>+{s.pdChangeBps}</td>
                          <td style={{ padding:'9px 14px', fontSize:13 }}>{s.mult}x</td>
                          <td style={{ padding:'9px 14px' }}>
                            <div style={{ display:'flex', gap:2 }}>
                              {Array.from({ length:10 }, (_, i) => (
                                <div key={i} style={{ width:6, height:12, borderRadius:2,
                                  background: i < s.transRisk ? T.red : T.border }} />
                              ))}
                            </div>
                          </td>
                          <td style={{ padding:'9px 14px' }}>
                            <div style={{ display:'flex', gap:2 }}>
                              {Array.from({ length:10 }, (_, i) => (
                                <div key={i} style={{ width:6, height:12, borderRadius:2,
                                  background: i < s.physRisk ? T.amber : T.border }} />
                              ))}
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr style={{ background:'#f8f6f2' }}>
                            <td colSpan={7} style={{ padding:'14px 20px' }}>
                              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                                <div>
                                  <div style={{ fontSize:10, fontWeight:700, color:T.textMut, marginBottom:6, textTransform:'uppercase' }}>Transition Risk Drivers</div>
                                  <div style={{ fontSize:12 }}>Carbon cost as % EBITDA: <strong>{s.ebitda}%</strong></div>
                                  <div style={{ fontSize:12, marginTop:4 }}>Regulatory exposure: <strong>{s.reg}</strong></div>
                                </div>
                                <div>
                                  <div style={{ fontSize:10, fontWeight:700, color:T.textMut, marginBottom:6, textTransform:'uppercase' }}>Physical Risk</div>
                                  <div style={{ fontSize:12 }}>Score: <strong style={{ color:T.amber }}>{s.physRisk}/10</strong></div>
                                  <div style={{ fontSize:12, marginTop:4 }}>Transition score: <strong style={{ color:T.red }}>{s.transRisk}/10</strong></div>
                                </div>
                                <div>
                                  <div style={{ fontSize:10, fontWeight:700, color:T.textMut, marginBottom:6, textTransform:'uppercase' }}>Top Borrowers</div>
                                  {(TOP_BORROWERS_BY_SECTOR[s.name] || []).map(b => (
                                    <div key={b.id} style={{ fontSize:12, display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                                      <span>{b.name} ({b.country})</span>
                                      <span style={{ color:T.red, fontWeight:600 }}>
                                        {b[{ nz:'nzStressedPD', dt:'dtStressedPD', hh:'hhStressedPD' }[sectorScenario]].toFixed(2)}%
                                      </span>
                                    </div>
                                  ))}
                                  {(!TOP_BORROWERS_BY_SECTOR[s.name] || TOP_BORROWERS_BY_SECTOR[s.name].length === 0) && (
                                    <div style={{ fontSize:12, color:T.textMut }}>No borrowers in portfolio</div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2  —  PORTFOLIO IMPACT CALCULATOR
        ══════════════════════════════════════════════════════════════════ */}
        {tab === 2 && (
          <div>
            {/* Controls */}
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
              {Object.values(SCENARIOS).map(s => (
                <Pill key={s.key} label={s.label} active={portScenario === s.key} color={s.color}
                  onClick={() => { setPortScenario(s.key); setPortRan(false); }} />
              ))}
              <select value={portSectorFilter} onChange={e => { setPortSectorFilter(e.target.value); setPortRan(false); }}
                style={{ padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12,
                  fontFamily:T.font, color:T.text, background:T.surface }}>
                {portSectors.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={portCountryFilter} onChange={e => { setPortCountryFilter(e.target.value); setPortRan(false); }}
                style={{ padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12,
                  fontFamily:T.font, color:T.text, background:T.surface }}>
                {portCountries.map(c => <option key={c}>{c}</option>)}
              </select>
              <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                <button onClick={handleRunStressTest} disabled={portRunning} style={{
                  padding:'8px 20px', borderRadius:8, border:'none',
                  cursor: portRunning ? 'not-allowed' : 'pointer', fontFamily:T.font,
                  fontWeight:700, fontSize:13,
                  background: portRunning ? T.textMut : T.navy, color:'#fff', transition:'all 0.2s',
                }}>
                  {portRunning ? 'Running...' : portRan ? 'Re-run Stress Test' : 'Run Stress Test'}
                </button>
                <button onClick={handleExportCSV} style={{
                  padding:'8px 16px', borderRadius:8, border:`1.5px solid ${T.sage}`, cursor:'pointer',
                  fontFamily:T.font, fontWeight:600, fontSize:12, background:T.surface, color:T.sage,
                }}>Export CSV</button>
              </div>
            </div>

            {portRan && (
              <div style={{ padding:'8px 14px', background:'rgba(22,163,74,0.08)', border:`1px solid ${T.sage}`,
                borderRadius:8, marginBottom:14, fontSize:12, color:T.sage, fontWeight:600 }}>
                Stress test complete — results updated for {SCENARIOS[portScenario].label} at {activeYear}
              </div>
            )}

            {/* Key metrics */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:16 }}>
              <MetricCard label="CVaR" value={`£${portMetrics.cvar}M`} color={T.red} />
              <MetricCard label="NII at Risk" value={`£${portMetrics.nii}M/yr`} color={T.amber} />
              <MetricCard label="ECL Uplift" value={`£${portMetrics.totalECL}M`} color={T.amber} />
              <MetricCard label="RWA Increase" value={`£${portMetrics.rwaDelta}M`} color={T.navyL} />
              <MetricCard label="CET1 Impact" value={`${portMetrics.cet1pp} pp`} color={T.red} />
            </div>

            {/* Waterfall + What-if */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
              <Card>
                <div style={{ fontWeight:600, marginBottom:12 }}>
                  CET1 Capital Waterfall — {SCENARIOS[portScenario].label}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={waterfallData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize:11 }} unit=" pp" />
                    <YAxis dataKey="name" type="category" width={185} tick={{ fontSize:10 }} />
                    <Tooltip formatter={v => [`${v > 0 ? '+' : ''}${v} pp`, 'CET1 Impact']} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {waterfallData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <div style={{ fontWeight:600, marginBottom:12 }}>What-If Divestment</div>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>
                  Divesting the 5 highest-ECL borrowers reduces CET1 impact from:
                </div>
                <div style={{ textAlign:'center', padding:18, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:28, fontWeight:700, color:T.red }}>{portMetrics.cet1pp} pp</div>
                  <div style={{ fontSize:13, color:T.textMut, margin:'8px 0' }}>to</div>
                  <div style={{ fontSize:28, fontWeight:700, color:T.sage }}>
                    {Math.round((Math.abs(portMetrics.cet1pp) - whatIfSaving) * (portMetrics.cet1pp < 0 ? -1 : 1) * 100) / 100} pp
                  </div>
                  <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>saving ~{whatIfSaving} pp</div>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginTop:10 }}>
                  Based on top 5 by ECL in {SCENARIOS[portScenario].label} scenario
                </div>
              </Card>
            </div>

            {/* Heat map */}
            <Card style={{ marginBottom:16 }}>
              <div style={{ fontWeight:600, marginBottom:12 }}>
                Borrower ECL Uplift Heat Map — {SCENARIOS[portScenario].label}
                <span style={{ fontSize:12, fontWeight:400, color:T.textMut, marginLeft:8 }}>
                  {filteredBorrowers.length} borrowers · hover for detail
                </span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                {filteredBorrowers.map(b => {
                  const eclKey = { nz:'eclUpliftNz', dt:'eclUpliftDt', hh:'eclUpliftHh' }[portScenario];
                  const v = b[eclKey];
                  const intensity = Math.min(v / 60, 1);
                  const bg = `rgba(220,38,38,${0.1 + intensity * 0.7})`;
                  return (
                    <div key={b.id}
                      title={`${b.name} | ${b.sector} | ${b.country} | £${b.exposure}M | ECL uplift £${v}M`}
                      style={{ width:36, height:36, borderRadius:6, background:bg, cursor:'default',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:8, fontWeight:600, color: intensity > 0.5 ? '#fff' : T.text }}>
                      {b.id}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:'flex', gap:16, marginTop:10, fontSize:11, color:T.textMut, alignItems:'center' }}>
                <span>Low ECL <span style={{ background:'rgba(220,38,38,0.1)', padding:'2px 10px', borderRadius:4, marginLeft:4 }}>&nbsp;</span></span>
                <span>High ECL <span style={{ background:'rgba(220,38,38,0.8)', padding:'2px 10px', borderRadius:4, marginLeft:4 }}>&nbsp;</span></span>
                <span style={{ marginLeft:'auto', color:T.amber, fontWeight:500 }}>★ = top-5 divestment candidates</span>
              </div>
            </Card>

            {/* Borrower table */}
            <Card style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:`1px solid ${T.border}`, fontWeight:600, fontSize:14 }}>
                Portfolio Detail — {filteredBorrowers.length} Borrowers (sorted by ECL Uplift)
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:T.surfaceH }}>
                      {['#','Name','Sector','Country','Exposure (£M)','Base PD (%)','Stressed PD (%)','ECL Uplift (£M)'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                          fontWeight:600, color:T.textSec, whiteSpace:'nowrap', borderBottom:`1px solid ${T.border}` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBorrowers.map((b, i) => {
                      const stKey  = { nz:'nzStressedPD', dt:'dtStressedPD', hh:'hhStressedPD' }[portScenario];
                      const eclKey = { nz:'eclUpliftNz', dt:'eclUpliftDt', hh:'eclUpliftHh' }[portScenario];
                      return (
                        <tr key={b.id} style={{
                          borderBottom:`1px solid ${T.border}`,
                          background: i < 5 ? 'rgba(220,38,38,0.03)' : 'transparent',
                        }}>
                          <td style={{ padding:'7px 12px', fontSize:12, color:T.textMut }}>{b.id}</td>
                          <td style={{ padding:'7px 12px', fontSize:12, fontWeight: i < 5 ? 600 : 400 }}>
                            {b.name}{i < 5 ? ' ★' : ''}
                          </td>
                          <td style={{ padding:'7px 12px', fontSize:11, color:T.textSec }}>{b.sector}</td>
                          <td style={{ padding:'7px 12px', fontSize:12 }}>{b.country}</td>
                          <td style={{ padding:'7px 12px', fontSize:12 }}>{b.exposure}</td>
                          <td style={{ padding:'7px 12px', fontSize:12 }}>{b.basePD.toFixed(2)}</td>
                          <td style={{ padding:'7px 12px', fontSize:12, fontWeight:600,
                            color: b[stKey] > b.basePD * 1.5 ? T.red : b[stKey] > b.basePD * 1.2 ? T.amber : T.text }}>
                            {b[stKey].toFixed(2)}
                          </td>
                          <td style={{ padding:'7px 12px', fontSize:12, fontWeight:600, color:T.red }}>
                            {b[eclKey].toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3  —  REGULATORY TRACKER
        ══════════════════════════════════════════════════════════════════ */}
        {tab === 3 && (
          <div>
            {/* Overall readiness */}
            <Card style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>Overall Regulatory Readiness</div>
                  <div style={{ fontSize:12, color:T.textSec, marginTop:3 }}>
                    {regReadiness.done} complete · {regReadiness.prog} in progress
                    · {regReadiness.total - regReadiness.done - regReadiness.prog} not started
                    · {regReadiness.total} total items
                  </div>
                </div>
                <div style={{ fontSize:40, fontWeight:700,
                  color: regReadiness.pct >= 80 ? T.green : regReadiness.pct >= 50 ? T.amber : T.red }}>
                  {regReadiness.pct}%
                </div>
              </div>
              <div style={{ background:T.surfaceH, borderRadius:6, height:12, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:6, transition:'width 0.4s',
                  width:`${regReadiness.pct}%`,
                  background: regReadiness.pct >= 80 ? T.green : regReadiness.pct >= 50 ? T.amber : T.red }} />
              </div>
              {regReadiness.prog > 0 && (
                <div style={{ height:5, borderRadius:6, marginTop:3, overflow:'hidden', background:T.surfaceH }}>
                  <div style={{ height:'100%', borderRadius:6,
                    width:`${Math.round((regReadiness.prog / regReadiness.total) * 100)}%`,
                    background:`${T.amber}55` }} />
                </div>
              )}
            </Card>

            {/* Framework cards 2-up */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {REG_FRAMEWORKS.map(f => {
                const done = f.items.filter((_, i) => regState[`${f.id}_${i}`] === 'complete').length;
                const prog = f.items.filter((_, i) => regState[`${f.id}_${i}`] === 'progress').length;
                const days = daysUntil(f.deadline);
                const isExp = regExpanded[f.id];
                return (
                  <Card key={f.id} style={{ borderLeft:`4px solid ${f.color}` }}>
                    {/* Header */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:f.color }}>{f.name}</div>
                        <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>
                          Deadline: {f.deadline.toLocaleDateString('en-GB')} ·{' '}
                          <span style={{ color: days < 90 ? T.red : days < 180 ? T.amber : T.green, fontWeight:600 }}>
                            {days} days remaining
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:22, fontWeight:700, color:f.color }}>{done}/{f.items.length}</div>
                        <div style={{ fontSize:10, color:T.textMut }}>complete</div>
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    <div style={{ background:T.surfaceH, borderRadius:4, height:6, marginBottom:10, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.round((done / f.items.length) * 100)}%`,
                        background:f.color, borderRadius:4, transition:'width 0.3s' }} />
                    </div>

                    {/* Owner selector */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <span style={{ fontSize:11, color:T.textSec, whiteSpace:'nowrap' }}>Owner:</span>
                      <select value={regOwner[f.id] || 'Unassigned'}
                        onChange={e => setRegOwner(p => ({ ...p, [f.id]: e.target.value }))}
                        style={{ flex:1, padding:'4px 8px', border:`1px solid ${T.border}`, borderRadius:6,
                          fontSize:11, fontFamily:T.font, color:T.text, background:T.surface }}>
                        {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>

                    {/* Expand toggle */}
                    <button onClick={() => setRegExpanded(p => ({ ...p, [f.id]: !isExp }))} style={{
                      width:'100%', padding:'6px', border:`1px solid ${T.border}`, borderRadius:6,
                      background:'transparent', cursor:'pointer', fontSize:11, color:T.textSec,
                      fontFamily:T.font, marginBottom: isExp ? 10 : 0,
                    }}>
                      {isExp ? '▲ Hide action items' : `▼ View ${f.items.length} action items`}
                    </button>

                    {/* Checklist */}
                    {isExp && f.items.map((item, i) => {
                      const k = `${f.id}_${i}`;
                      const s = regState[k] || 'not';
                      return (
                        <div key={i} onClick={() => cycleRegItem(f.id, i)}
                          style={{
                            display:'flex', alignItems:'center', gap:10, padding:'7px 8px',
                            borderRadius:6, cursor:'pointer', marginBottom:3,
                            background: s === 'complete' ? 'rgba(22,163,74,0.07)'
                              : s === 'progress' ? 'rgba(217,119,6,0.07)' : 'transparent',
                            transition:'background 0.15s',
                          }}>
                          <div style={{
                            width:16, height:16, borderRadius:4, flexShrink:0,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            border:`2px solid ${regItemColor(s)}`,
                            background: s === 'complete' ? T.green : 'transparent',
                          }}>
                            {s === 'complete' && <span style={{ color:'#fff', fontSize:10, lineHeight:1 }}>✓</span>}
                            {s === 'progress' && <span style={{ color:T.amber, fontSize:10, lineHeight:1 }}>–</span>}
                          </div>
                          <div style={{ flex:1, fontSize:12, color:T.text }}>{item}</div>
                          <div style={{ fontSize:10, color:regItemColor(s), fontWeight:600, whiteSpace:'nowrap' }}>
                            {regItemLabel(s)}
                          </div>
                        </div>
                      );
                    })}

                    {isExp && (
                      <div style={{ fontSize:10, color:T.textMut, marginTop:6, textAlign:'center' }}>
                        Click item to cycle: Not Started → In Progress → Complete
                      </div>
                    )}

                    {/* Summary badges */}
                    <div style={{ display:'flex', gap:10, marginTop:8, fontSize:11, flexWrap:'wrap' }}>
                      {done > 0 && <span style={{ color:T.green }}>✓ {done} complete</span>}
                      {prog > 0 && <span style={{ color:T.amber }}>~ {prog} in progress</span>}
                      {(f.items.length - done - prog) > 0 && (
                        <span style={{ color:T.textMut }}>○ {f.items.length - done - prog} not started</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
