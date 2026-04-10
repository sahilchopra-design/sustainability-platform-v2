import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, ComposedChart, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ─── REFERENCE DATA ──────────────────────────────────────────────────────── */
const LEGAL_ENTITIES = [
  'HoldCo','BankCo UK','BankCo EU','BankCo Americas','BankCo APAC',
  'Asset Mgmt','Insurance Sub','RE Sub','Private Equity','Treasury',
  'FinTech Sub','Commodities',
];
const ASSET_CLASSES = [
  'Corporate Loans','Sovereign Bonds','Listed Equity','Real Estate',
  'Infrastructure','Private Credit','Commodities','Derivatives','Cash/MMF','Trade Finance',
];
const BUSINESS_LINES = [
  'Corporate Banking','Retail Banking','Investment Banking','Asset Management',
  'Insurance','Trading & Sales','Private Banking','Treasury',
];
const GEOGRAPHIES = ['UK','EU','North America','APAC','EM','Japan','Australia','Middle East'];
const SECTORS = ['Energy','Financials','Utilities','Materials','Consumer','Technology','Healthcare','Industrials'];
const CURRENCIES = ['USD','EUR','GBP','JPY','AUD','SGD','CHF','HKD'];
const NGFS3 = ['Orderly','Disorderly','Hot House'];
const NGFS3_MULTS = [1.0, 1.4, 2.1];
const NGFS3_COLORS = [T.green, T.amber, T.red];

import { isIndiaMode, adaptForPCAF } from '../../../data/IndiaDataAdapter';

/* ─── EXPOSURES (300) ─────────────────────────────────────────────────────── */
const _DEFAULT_EXPOSURES = Array.from({ length: 300 }, (_, i) => {
  const entityName  = LEGAL_ENTITIES[Math.floor(sr(i * 7)   * LEGAL_ENTITIES.length)];
  const assetClass  = ASSET_CLASSES[Math.floor(sr(i * 11)   * ASSET_CLASSES.length)];
  const businessLine= BUSINESS_LINES[Math.floor(sr(i * 13)  * BUSINESS_LINES.length)];
  const geography   = GEOGRAPHIES[Math.floor(sr(i * 17)     * GEOGRAPHIES.length)];
  const sector      = SECTORS[Math.floor(sr(i * 19)         * SECTORS.length)];
  const currency    = CURRENCIES[Math.floor(sr(i * 43)      * CURRENCIES.length)];
  const vintage     = 2015 + Math.floor(sr(i * 47) * 9);
  const exposureMN  = 50 + sr(i * 23) * 2950;
  const physRisk    = 10 + sr(i * 29) * 80;
  const transRisk   = 10 + sr(i * 31) * 80;
  const climateVaR95= exposureMN * (0.02 + sr(i * 37) * 0.18);
  const hedgeRatio  = sr(i * 59);
  const hedgeCostBps= hedgeRatio > 0.1 ? 5 + sr(i * 61) * 95 : 0;
  const raroc       = 0.04 + sr(i * 71) * 0.16;
  const capitalCharge = exposureMN * (0.08 + sr(i * 73) * 0.07);
  const pdClimate   = 0.001 + sr(i * 79) * 0.079;
  const lgdClimate  = 0.2   + sr(i * 83) * 0.6;
  const rwaClimate  = exposureMN * (0.3 + sr(i * 89) * 0.9);
  const nplRatio    = sr(i * 97) * 0.15;
  const greenTagged = sr(i * 101) > 0.65;
  const carbonFP    = sr(i * 103) * 1000;
  return {
    id: i, entityName, assetClass, businessLine, geography, sector, currency, vintage,
    exposureMN, physRisk, transRisk, climateVaR95, hedgeRatio, hedgeCostBps,
    raroc, capitalCharge, pdClimate, lgdClimate, rwaClimate, nplRatio,
    greenTagged, carbonFP,
  };
});
// ── India Dataset Integration ──
const EXPOSURES = isIndiaMode() ? adaptForPCAF().map((c, i) => ({
  id: i, entityName: 'HoldCo', assetClass: 'Listed Equity', businessLine: 'Asset Management',
  geography: 'India', sector: c.sector, currency: 'INR', vintage: 2022,
  exposureMN: c.marketCap / 1e6, physRisk: 30 + sr(i * 29) * 50, transRisk: 20 + sr(i * 31) * 60,
  climateVaR95: c.marketCap / 1e6 * 0.08, hedgeRatio: sr(i * 59), hedgeCostBps: 15,
  raroc: 0.06 + sr(i * 71) * 0.12, capitalCharge: c.marketCap / 1e6 * 0.1,
  pdClimate: 0.005 + sr(i * 79) * 0.04, lgdClimate: 0.3 + sr(i * 83) * 0.4,
  rwaClimate: c.marketCap / 1e6 * 0.5, nplRatio: sr(i * 97) * 0.1,
  greenTagged: sr(i * 101) > 0.6, carbonFP: c.totalEmissions / (c.revenue / 1e6 || 1),
})) : _DEFAULT_EXPOSURES;

/* ─── RAROC TABLE (12 entities) ──────────────────────────────────────────── */
const RAROC_TABLE = LEGAL_ENTITIES.map((e, i) => ({
  entity: e,
  raroc:         +(0.04 + sr(i * 200) * 0.16).toFixed(4),
  capitalCharge: +(2 + sr(i * 201) * 18).toFixed(2),   // $BN
  hurdleRate:    0.08,
  passes:        (0.04 + sr(i * 200) * 0.16) >= 0.08,
  capitalScore:  +(40 + sr(i * 202) * 60).toFixed(1),
}));

/* ─── HEDGE POSITIONS (12 entities) ──────────────────────────────────────── */
const HEDGE_POSITIONS = LEGAL_ENTITIES.map((e, i) => ({
  entity:       e,
  coverage:     +(20 + sr(i * 300) * 70).toFixed(1),
  costBps:      +(5  + sr(i * 301) * 75).toFixed(1),
  benefitBps:   +(10 + sr(i * 302) * 100).toFixed(1),
  effectiveness:+(40 + sr(i * 303) * 55).toFixed(1),
  basisRisk:    +(2  + sr(i * 304) * 20).toFixed(1),
}));

/* ─── HEDGE TIMELINE (12 months) ─────────────────────────────────────────── */
const HEDGE_TIMELINE = Array.from({ length: 12 }, (_, i) => ({
  month: `M${i + 1}`,
  effectiveness: +(60 + sr(i * 400) * 30).toFixed(1),
  coverage:      +(35 + sr(i * 401) * 40).toFixed(1),
  basisRisk:     +(3  + sr(i * 402) * 12).toFixed(1),
}));

/* ─── SCENARIO P&L (NGFS3 × 5 years × BUSINESS_LINES) ───────────────────── */
const SCENARIO_PNL = NGFS3.map((sc, si) => ({
  scenario: sc,
  years: Array.from({ length: 5 }, (_, yi) => ({
    year: `Y${yi + 1}`,
    data: BUSINESS_LINES.map((bl, bi) => ({
      line:      bl,
      revenue:   +(-200 * NGFS3_MULTS[si] + sr(si * 50 + yi * 10 + bi) * 150).toFixed(1),
      provision: +(-50  * NGFS3_MULTS[si] - sr(si * 51 + yi * 10 + bi) * 80).toFixed(1),
      netPnl:    +(-150 * NGFS3_MULTS[si] + sr(si * 52 + yi * 10 + bi) * 120).toFixed(1),
    })),
  })),
}));

/* ─── CET1 PATH ──────────────────────────────────────────────────────────── */
const CET1_PATH = NGFS3.map((sc, si) => ({
  scenario: sc,
  color: NGFS3_COLORS[si],
  path: Array.from({ length: 5 }, (_, yi) => ({
    year: `Y${yi + 1}`,
    cet1: +(14.5 - si * 1.2 - yi * 0.3 * NGFS3_MULTS[si] + sr(si * 60 + yi) * 0.4).toFixed(2),
  })),
}));

/* ─── TCFD ITEMS (20) ────────────────────────────────────────────────────── */
const TCFD_ITEMS_EXTENDED = [
  { id:0,  domain:'Governance', item:'Board climate oversight committee',        owner:'Board',       dueDate:'2026-Q2' },
  { id:1,  domain:'Governance', item:'Management climate roles & responsibilities',owner:'CEO/CRO',  dueDate:'2026-Q1' },
  { id:2,  domain:'Governance', item:'Climate in executive compensation KPIs',   owner:'RemCo',       dueDate:'2026-Q3' },
  { id:3,  domain:'Governance', item:'Board climate training programme',          owner:'Board Sec',   dueDate:'2026-Q4' },
  { id:4,  domain:'Strategy',   item:'Climate risks & opportunities identified',  owner:'Strategy',    dueDate:'2026-Q1' },
  { id:5,  domain:'Strategy',   item:'Impact on business & financial planning',   owner:'CFO',         dueDate:'2026-Q2' },
  { id:6,  domain:'Strategy',   item:'Strategy resilience under NGFS scenarios', owner:'Strategy',    dueDate:'2026-Q2' },
  { id:7,  domain:'Strategy',   item:'Climate transition plan published',         owner:'CEO',         dueDate:'2026-Q3' },
  { id:8,  domain:'Risk Mgmt',  item:'Climate risk identification process',       owner:'CRO',         dueDate:'2026-Q1' },
  { id:9,  domain:'Risk Mgmt',  item:'Climate risk quantification methodology',  owner:'CRO',         dueDate:'2026-Q1' },
  { id:10, domain:'Risk Mgmt',  item:'Climate integrated into ERM framework',    owner:'CRO',         dueDate:'2026-Q2' },
  { id:11, domain:'Risk Mgmt',  item:'Physical risk assessment completed',        owner:'CRO',         dueDate:'2026-Q2' },
  { id:12, domain:'Metrics',    item:'Climate metrics disclosed (annual)',        owner:'CFO',         dueDate:'2026-Q3' },
  { id:13, domain:'Metrics',    item:'Scope 1, 2 & 3 GHG emissions',             owner:'Sustainability',dueDate:'2026-Q2' },
  { id:14, domain:'Metrics',    item:'Portfolio WACI calculated',                 owner:'Risk',        dueDate:'2026-Q2' },
  { id:15, domain:'Metrics',    item:'Climate-related targets set (SBTi)',        owner:'CEO',         dueDate:'2026-Q4' },
  { id:16, domain:'Metrics',    item:'Progress tracking against targets',         owner:'CFO',         dueDate:'2026-Q3' },
  { id:17, domain:'Scenario',   item:'Scenario analysis framework established',  owner:'CRO',         dueDate:'2026-Q1' },
  { id:18, domain:'Scenario',   item:'Physical risk scenarios quantified',        owner:'CRO',         dueDate:'2026-Q2' },
  { id:19, domain:'Scenario',   item:'Transition risk scenarios quantified',      owner:'CRO',         dueDate:'2026-Q2' },
].map((item, i) => {
  const score = Math.floor(sr(i * 17 + 3) * 4);  // 0–3
  const rag = score >= 2 ? 'Green' : score === 1 ? 'Amber' : 'Red';
  const status = score >= 2 ? 'Complete' : score === 1 ? 'Partial' : 'Not Started';
  return { ...item, score, rag, status };
});

/* ─── CONCENTRATION LIMITS ───────────────────────────────────────────────── */
const CONCENTRATION_LIMITS = LEGAL_ENTITIES.map((e, i) => {
  const limitBN   = +(5 + sr(i * 500) * 25).toFixed(1);
  const currentBN = +(limitBN * (0.4 + sr(i * 501) * 0.75)).toFixed(1);
  const util      = +((currentBN / limitBN) * 100).toFixed(1);
  return { entity: e, limitBN, currentBN, util, breach: util > 90 };
});

/* ─── PEER RADAR (TCFD dimensions) ──────────────────────────────────────── */
const PEER_RADAR = [
  { dim:'Governance', self: 72, peer: 65 },
  { dim:'Strategy',   self: 58, peer: 60 },
  { dim:'Risk Mgmt',  self: 80, peer: 70 },
  { dim:'Metrics',    self: 65, peer: 68 },
  { dim:'Scenario',   self: 55, peer: 62 },
];

/* ─── MATERIALITY MATRIX ─────────────────────────────────────────────────── */
const MATERIALITY_ITEMS = [
  'Transition Risk','Physical Risk','Credit Risk','Market Risk',
  'Operational Risk','Reputational Risk','Liquidity Risk','Legal Risk',
].map((item, i) => ({
  name: item,
  impact:     +(1 + sr(i * 600) * 4).toFixed(1),
  likelihood: +(1 + sr(i * 601) * 4).toFixed(1),
}));

/* ─── HELPER COMPONENTS ──────────────────────────────────────────────────── */
const KpiCard = ({ label, value, color = T.text, sub = '', width = 'auto' }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '14px 18px', flex: 1, minWidth: 140, width,
  }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SectionHead = ({ title, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Sel = ({ value, onChange, options, style = {} }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, background: T.card, ...style }}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const RAGBadge = ({ rag }) => {
  const c = rag === 'Green' ? T.green : rag === 'Amber' ? T.amber : T.red;
  return (
    <span style={{ background: c + '22', color: c, border: `1px solid ${c}`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
      {rag}
    </span>
  );
};

const SliderRow = ({ label, min, max, step = 1, value, onChange, fmt = v => v }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
    <span style={{ fontSize: 12, color: T.muted, width: 160, flexShrink: 0 }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(+e.target.value)}
      style={{ flex: 1, accentColor: T.indigo }} />
    <span style={{ fontSize: 13, fontWeight: 700, color: T.indigo, width: 60, textAlign: 'right' }}>{fmt(value)}</span>
  </div>
);

const TABS = [
  'Enterprise Dashboard','Exposure Database','Legal Entity View',
  'Capital Attribution','Concentration Analysis','Scenario P&L Bridge',
  'Hedging Desk','TCFD Board Pack','Risk Attribution Engine','Summary & Export',
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function EnterpriseClimateRiskPage() {

  /* ── shared state ── */
  const [tab, setTab]                   = useState(0);
  const [scenario, setScenario]         = useState(0);
  const [entityFilter, setEntityFilter] = useState('All');
  const [bizFilter, setBizFilter]       = useState('All');
  const [assetFilter, setAssetFilter]   = useState('All');
  const [geoFilter, setGeoFilter]       = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');

  /* ── tab-2 exposure db ── */
  const [search, setSearch]             = useState('');
  const [sortCol, setSortCol]           = useState('exposureMN');
  const [sortDir, setSortDir]           = useState(-1);
  const [selectedId, setSelectedId]     = useState(null);
  const [expPage, setExpPage]           = useState(0);
  const PAGE_SIZE = 20;

  /* ── tab-3 legal entity ── */
  const [leEntity, setLeEntity]         = useState(LEGAL_ENTITIES[0]);
  const [leScenario, setLeScenario]     = useState(0);
  const [netToggle, setNetToggle]       = useState(false);

  /* ── tab-4 capital ── */
  const [hurdleRate, setHurdleRate]     = useState(8);
  const [capEntity, setCapEntity]       = useState('All');
  const [capMethod, setCapMethod]       = useState('VaR');

  /* ── tab-5 concentration ── */
  const [hhiDim, setHhiDim]            = useState('entity');
  const [limThreshold, setLimThreshold] = useState(90);
  const [breachOnly, setBreachOnly]     = useState(false);

  /* ── tab-6 scenario p&l ── */
  const [scPnlA, setScPnlA]            = useState(0);
  const [scPnlB, setScPnlB]            = useState(1);
  const [pnlYear, setPnlYear]           = useState(1);
  const [showProv, setShowProv]         = useState(true);

  /* ── tab-7 hedging ── */
  const [hedgeEntity, setHedgeEntity]   = useState(LEGAL_ENTITIES[0]);
  const [hedgeRatioSlider, setHedgeRatioSlider] = useState(50);
  const [showHedgeTimeline, setShowHedgeTimeline] = useState(true);

  /* ── tab-8 TCFD ── */
  const [tcfdDomain, setTcfdDomain]     = useState('All');
  const [tcfdThreshold, setTcfdThreshold] = useState(0);
  const [expandActions, setExpandActions] = useState(false);

  /* ── tab-9 attribution ── */
  const [attrDim, setAttrDim]           = useState('entity');
  const [attrScenario, setAttrScenario] = useState(false);
  const [topN, setTopN]                 = useState(10);

  /* ── tab-10 export ── */
  const [exportSections, setExportSections] = useState({
    kpis: true, exposure: true, capital: true, tcfd: true, scenario: true,
  });
  const [exportFormat, setExportFormat] = useState('JSON');

  /* ── derived: filtered exposures ── */
  const filtered = useMemo(() => {
    let d = EXPOSURES;
    if (entityFilter !== 'All') d = d.filter(x => x.entityName === entityFilter);
    if (bizFilter    !== 'All') d = d.filter(x => x.businessLine === bizFilter);
    if (assetFilter  !== 'All') d = d.filter(x => x.assetClass === assetFilter);
    if (geoFilter    !== 'All') d = d.filter(x => x.geography === geoFilter);
    if (sectorFilter !== 'All') d = d.filter(x => x.sector === sectorFilter);
    if (search) d = d.filter(x =>
      x.entityName.toLowerCase().includes(search.toLowerCase()) ||
      x.assetClass.toLowerCase().includes(search.toLowerCase()) ||
      x.sector.toLowerCase().includes(search.toLowerCase())
    );
    return [...d].sort((a, b) => sortDir * ((a[sortCol] ?? 0) - (b[sortCol] ?? 0)));
  }, [entityFilter, bizFilter, assetFilter, geoFilter, sectorFilter, search, sortCol, sortDir]);

  const scenMult = NGFS3_MULTS[scenario];

  /* ── portfolio KPIs ── */
  const totalExposureBN = useMemo(() =>
    filtered.reduce((s, x) => s + x.exposureMN, 0) / 1000, [filtered]);

  const portfolioCVaR = useMemo(() => {
    if (!filtered.length) return 0;
    const sumSq = filtered.reduce((s, x) => s + (x.climateVaR95 * scenMult) ** 2, 0);
    return Math.sqrt(sumSq) * 0.75;
  }, [filtered, scenMult]);

  const standaloneSum = useMemo(() =>
    filtered.reduce((s, x) => s + x.climateVaR95 * scenMult, 0), [filtered, scenMult]);

  const diversBenefitBN = standaloneSum > 0
    ? (standaloneSum - portfolioCVaR) / 1000 : 0;

  const pctHedged = useMemo(() => {
    if (!filtered.length) return 0;
    const wtd = filtered.reduce((s, x) => s + x.hedgeRatio * x.exposureMN, 0);
    const tot = filtered.reduce((s, x) => s + x.exposureMN, 0);
    return tot > 0 ? (wtd / tot) * 100 : 0;
  }, [filtered]);

  const tcfdScore = useMemo(() => {
    const total = TCFD_ITEMS_EXTENDED.reduce((s, x) => s + x.score, 0);
    return total > 0 ? (total / (TCFD_ITEMS_EXTENDED.length * 3)) * 100 : 0;
  }, []);

  /* ── entity bar data ── */
  const entityBarData = useMemo(() => LEGAL_ENTITIES.map(e => {
    const sub = filtered.filter(x => x.entityName === e);
    const totExp  = sub.reduce((s, x) => s + x.exposureMN, 0);
    const physVaR = sub.reduce((s, x) => s + x.climateVaR95 * (x.physRisk / 100) * scenMult, 0);
    const transVaR= sub.reduce((s, x) => s + x.climateVaR95 * (x.transRisk / 100) * scenMult, 0);
    return { entity: e.split(' ')[0], exp: +(totExp / 1000).toFixed(1), physVaR: +physVaR.toFixed(0), transVaR: +transVaR.toFixed(0) };
  }), [filtered, scenMult]);

  /* ── entity RAG ── */
  const entityRAG = useMemo(() => LEGAL_ENTITIES.map(e => {
    const sub = filtered.filter(x => x.entityName === e);
    const var95 = sub.reduce((s, x) => s + x.climateVaR95 * scenMult, 0);
    const exp   = sub.reduce((s, x) => s + x.exposureMN, 0);
    const ratio = exp > 0 ? var95 / exp : 0;
    const rag   = ratio > 0.12 ? 'Red' : ratio > 0.07 ? 'Amber' : 'Green';
    return { entity: e, var95: +(var95 / 1000).toFixed(2), exp: +(exp / 1000).toFixed(1), rag };
  }), [filtered, scenMult]);

  /* ── sort handler ── */
  const handleSort = useCallback(col => {
    if (sortCol === col) setSortDir(d => -d); else { setSortCol(col); setSortDir(-1); }
  }, [sortCol]);

  const selectedExposure = useMemo(() =>
    selectedId != null ? EXPOSURES.find(x => x.id === selectedId) : null, [selectedId]);

  /* ── legal entity detail ── */
  const leData = useMemo(() => {
    const sub = EXPOSURES.filter(x => x.entityName === leEntity);
    const mult = NGFS3_MULTS[leScenario];
    const totalExp  = sub.reduce((s, x) => s + x.exposureMN, 0);
    const totalVar  = sub.reduce((s, x) => s + x.climateVaR95 * mult, 0);
    const netFactor = netToggle ? 0.75 : 1.0;
    const top5 = [...sub].sort((a, b) => b.exposureMN - a.exposureMN).slice(0, 5);
    const byAsset = ASSET_CLASSES.map(ac => ({
      name: ac.split(' ')[0],
      value: +sub.filter(x => x.assetClass === ac).reduce((s, x) => s + x.exposureMN, 0).toFixed(0),
    })).filter(x => x.value > 0);
    const scenPnl = NGFS3.map((sc, si) => ({
      scenario: sc,
      pnl: +(-totalVar * NGFS3_MULTS[si] * netFactor / 1000).toFixed(2),
      capital: +(sub.reduce((s, x) => s + x.capitalCharge, 0) * NGFS3_MULTS[si] * netFactor / 1000).toFixed(2),
    }));
    return { totalExpBN: +(totalExp / 1000).toFixed(2), totalVarBN: +(totalVar * netFactor / 1000).toFixed(2), top5, byAsset, scenPnl, count: sub.length };
  }, [leEntity, leScenario, netToggle]);

  /* ── capital attribution data ── */
  const capData = useMemo(() => {
    const hr = hurdleRate / 100;
    return RAROC_TABLE
      .filter(r => capEntity === 'All' || r.entity === capEntity)
      .map(r => ({ ...r, passes: r.raroc >= hr, delta: +((r.raroc - hr) * 100).toFixed(2) }));
  }, [hurdleRate, capEntity]);

  /* ── HHI ── */
  const hhiData = useMemo(() => {
    const totExp = filtered.reduce((s, x) => s + x.exposureMN, 0);
    if (hhiDim === 'entity') {
      return LEGAL_ENTITIES.map(e => {
        const s = filtered.filter(x => x.entityName === e).reduce((a, x) => a + x.exposureMN, 0);
        const share = totExp > 0 ? s / totExp : 0;
        return { name: e.split(' ')[0], hhi: +(share * share * 10000).toFixed(0), exp: +(s / 1000).toFixed(1) };
      }).filter(x => x.exp > 0);
    } else if (hhiDim === 'sector') {
      return SECTORS.map(s => {
        const v = filtered.filter(x => x.sector === s).reduce((a, x) => a + x.exposureMN, 0);
        const share = totExp > 0 ? v / totExp : 0;
        return { name: s, hhi: +(share * share * 10000).toFixed(0), exp: +(v / 1000).toFixed(1) };
      }).filter(x => x.exp > 0);
    } else {
      return GEOGRAPHIES.map(g => {
        const v = filtered.filter(x => x.geography === g).reduce((a, x) => a + x.exposureMN, 0);
        const share = totExp > 0 ? v / totExp : 0;
        return { name: g, hhi: +(share * share * 10000).toFixed(0), exp: +(v / 1000).toFixed(1) };
      }).filter(x => x.exp > 0);
    }
  }, [filtered, hhiDim]);

  const totalHHI = useMemo(() => hhiData.reduce((s, x) => s + x.hhi, 0), [hhiData]);

  /* ── concentration limits filtered ── */
  const limData = useMemo(() =>
    CONCENTRATION_LIMITS
      .map(r => ({ ...r, breach: r.util > limThreshold }))
      .filter(r => !breachOnly || r.util > limThreshold),
  [limThreshold, breachOnly]);

  /* ── scenario P&L data ── */
  const pnlBridge = useMemo(() => {
    const scA = SCENARIO_PNL[scPnlA];
    const scB = SCENARIO_PNL[scPnlB];
    const yrA = scA.years[pnlYear - 1];
    const yrB = scB.years[pnlYear - 1];
    return BUSINESS_LINES.map((bl, bi) => ({
      line: bl.split(' ')[0],
      [scA.scenario]: yrA.data[bi].netPnl,
      [scB.scenario]: yrB.data[bi].netPnl,
      provA: yrA.data[bi].provision,
      provB: yrB.data[bi].provision,
    }));
  }, [scPnlA, scPnlB, pnlYear]);

  const cet1Lines = useMemo(() => {
    const result = Array.from({ length: 5 }, (_, yi) => ({ year: `Y${yi + 1}` }));
    [scPnlA, scPnlB].forEach(si => {
      CET1_PATH[si].path.forEach((p, yi) => { result[yi][NGFS3[si]] = p.cet1; });
    });
    return result;
  }, [scPnlA, scPnlB]);

  /* ── hedging data ── */
  const hedgeEntityData = useMemo(() =>
    HEDGE_POSITIONS.find(h => h.entity === hedgeEntity) || HEDGE_POSITIONS[0],
  [hedgeEntity]);

  /* ── TCFD filtered ── */
  const tcfdFiltered = useMemo(() =>
    TCFD_ITEMS_EXTENDED
      .filter(t => tcfdDomain === 'All' || t.domain === tcfdDomain)
      .filter(t => t.score >= tcfdThreshold),
  [tcfdDomain, tcfdThreshold]);

  /* ── attribution data ── */
  const attrData = useMemo(() => {
    const totVar = filtered.reduce((s, x) => s + x.climateVaR95 * scenMult, 0);
    let groups;
    if (attrDim === 'entity')   groups = LEGAL_ENTITIES.map(e => ({ key: e.split(' ')[0], items: filtered.filter(x => x.entityName === e) }));
    else if (attrDim === 'asset')    groups = ASSET_CLASSES.map(a => ({ key: a.split(' ')[0], items: filtered.filter(x => x.assetClass === a) }));
    else if (attrDim === 'geo')      groups = GEOGRAPHIES.map(g => ({ key: g, items: filtered.filter(x => x.geography === g) }));
    else                             groups = BUSINESS_LINES.map(b => ({ key: b.split(' ')[0], items: filtered.filter(x => x.businessLine === b) }));
    return groups
      .map(g => {
        const varG = g.items.reduce((s, x) => s + x.climateVaR95 * scenMult, 0);
        const expG = g.items.reduce((s, x) => s + x.exposureMN, 0);
        return { name: g.key, varBN: +(varG / 1000).toFixed(2), pct: totVar > 0 ? +(varG / totVar * 100).toFixed(1) : 0, expBN: +(expG / 1000).toFixed(1) };
      })
      .filter(x => x.varBN > 0)
      .sort((a, b) => b.varBN - a.varBN)
      .slice(0, topN);
  }, [filtered, scenMult, attrDim, topN]);

  /* ── filter bar ── */
  const filterBar = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '10px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, alignItems: 'center' }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
        style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, width: 140 }} />
      <Sel value={entityFilter} onChange={setEntityFilter} options={['All', ...LEGAL_ENTITIES]} />
      <Sel value={bizFilter}    onChange={setBizFilter}    options={['All', ...BUSINESS_LINES]} />
      <Sel value={assetFilter}  onChange={setAssetFilter}  options={['All', ...ASSET_CLASSES]} />
      <Sel value={geoFilter}    onChange={setGeoFilter}    options={['All', ...GEOGRAPHIES]} />
      <Sel value={sectorFilter} onChange={setSectorFilter} options={['All', ...SECTORS]} />
      <Sel value={scenario} onChange={v => setScenario(+v)} options={NGFS3.map((s, i) => i)} style={{ width: 130 }} />
      <span style={{ fontSize: 11, color: T.muted }}>{NGFS3[scenario]} ({scenMult}×) | {filtered.length} rows</span>
    </div>
  );

  /* ═══════════════ TAB RENDERERS ═══════════════ */

  /* ── TAB 0: Enterprise Dashboard ── */
  const renderDashboard = () => (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <KpiCard label="Total Exposure" value={`$${totalExposureBN.toFixed(1)}BN`} color={T.navy} sub="Group consolidated" />
        <KpiCard label="Group CVaR 95%" value={`$${(portfolioCVaR / 1000).toFixed(2)}BN`} color={T.red} sub={`${NGFS3[scenario]} scenario`} />
        <KpiCard label="Diversification Benefit" value={`$${diversBenefitBN.toFixed(2)}BN`} color={T.green} sub="vs stand-alone sum" />
        <KpiCard label="% Hedged" value={`${pctHedged.toFixed(1)}%`} color={T.teal} sub="Exposure-weighted" />
        <KpiCard label="TCFD Score" value={`${tcfdScore.toFixed(0)}%`} color={T.indigo} sub="20-item assessment" />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        {/* Scenario selector panel */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, width: 220, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 12 }}>NGFS Scenario</div>
          {NGFS3.map((s, i) => (
            <button key={i} onClick={() => setScenario(i)}
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: '8px 12px', borderRadius: 6, border: `1px solid ${scenario === i ? NGFS3_COLORS[i] : T.border}`, background: scenario === i ? NGFS3_COLORS[i] + '18' : T.bg, color: scenario === i ? NGFS3_COLORS[i] : T.text, fontWeight: scenario === i ? 700 : 400, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
              {s} <span style={{ float: 'right', fontWeight: 700 }}>{NGFS3_MULTS[i]}×</span>
            </button>
          ))}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Entity Filter</div>
            <Sel value={entityFilter} onChange={setEntityFilter} options={['All', ...LEGAL_ENTITIES]} style={{ width: '100%' }} />
          </div>
        </div>

        {/* Entity bar chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="Climate VaR by Legal Entity" sub="Physical vs Transition decomposition ($M)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={entityBarData} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="entity" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v, n) => [`$${v.toFixed(0)}M`, n]} />
              <Legend />
              <Bar dataKey="physVaR"  name="Physical VaR"    fill={T.orange} stackId="a" />
              <Bar dataKey="transVaR" name="Transition VaR"  fill={T.indigo} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Entity RAG status */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="Entity RAG Status" sub="Climate VaR / Exposure ratio" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Entity','Exposure $BN','CVaR95 $BN','RAG'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entityRAG.map(r => (
                <tr key={r.entity} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.entity}</td>
                  <td style={{ padding: '6px 10px' }}>${r.exp}</td>
                  <td style={{ padding: '6px 10px' }}>${r.var95}</td>
                  <td style={{ padding: '6px 10px' }}><RAGBadge rag={r.rag} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Exposure heatmap proxy (bar by entity × risk type) */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="Exposure Heat Map" sub="Total exposure $BN per entity" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={entityBarData} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="entity" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={v => [`$${v}BN`, 'Exposure']} />
              <Bar dataKey="exp" name="Exposure $BN" fill={T.navy}>
                {entityBarData.map((_, i) => <Cell key={i} fill={`hsl(${220 + i * 12}, 60%, ${35 + i * 3}%)`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ── TAB 1: Exposure Database ── */
  const renderExposureDB = () => {
    const cols = [
      { key: 'entityName',   label: 'Entity' },
      { key: 'assetClass',   label: 'Asset Class' },
      { key: 'businessLine', label: 'Business Line' },
      { key: 'geography',    label: 'Geography' },
      { key: 'sector',       label: 'Sector' },
      { key: 'exposureMN',   label: 'Exp $M' },
      { key: 'physRisk',     label: 'Phys %' },
      { key: 'transRisk',    label: 'Trans %' },
      { key: 'climateVaR95', label: 'CVaR95 $M' },
      { key: 'hedgeRatio',   label: 'Hedge %' },
      { key: 'raroc',        label: 'RAROC' },
      { key: 'currency',     label: 'CCY' },
      { key: 'vintage',      label: 'Vintage' },
    ];
    const pageData = filtered.slice(expPage * PAGE_SIZE, (expPage + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    return (
      <div>
        {filterBar}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: T.muted }}>{filtered.length} exposures | Page {expPage + 1}/{totalPages}</span>
          <button onClick={() => setExpPage(p => Math.max(0, p - 1))} disabled={expPage === 0}
            style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer', fontSize: 12 }}>← Prev</button>
          <button onClick={() => setExpPage(p => Math.min(totalPages - 1, p + 1))} disabled={expPage >= totalPages - 1}
            style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer', fontSize: 12 }}>Next →</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {cols.map(c => (
                  <th key={c.key} onClick={() => handleSort(c.key)} style={{ padding: '7px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {c.label} {sortCol === c.key ? (sortDir === -1 ? '▼' : '▲') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map(row => (
                <React.Fragment key={row.id}>
                  <tr onClick={() => setSelectedId(selectedId === row.id ? null : row.id)}
                    style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: selectedId === row.id ? T.indigo + '0d' : 'transparent' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{row.entityName}</td>
                    <td style={{ padding: '6px 10px' }}>{row.assetClass}</td>
                    <td style={{ padding: '6px 10px' }}>{row.businessLine}</td>
                    <td style={{ padding: '6px 10px' }}>{row.geography}</td>
                    <td style={{ padding: '6px 10px' }}>{row.sector}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 700 }}>${row.exposureMN.toFixed(0)}</td>
                    <td style={{ padding: '6px 10px', color: row.physRisk > 60 ? T.red : row.physRisk > 35 ? T.amber : T.green }}>{row.physRisk.toFixed(0)}%</td>
                    <td style={{ padding: '6px 10px', color: row.transRisk > 60 ? T.red : row.transRisk > 35 ? T.amber : T.green }}>{row.transRisk.toFixed(0)}%</td>
                    <td style={{ padding: '6px 10px' }}>${row.climateVaR95.toFixed(0)}</td>
                    <td style={{ padding: '6px 10px' }}>{(row.hedgeRatio * 100).toFixed(0)}%</td>
                    <td style={{ padding: '6px 10px', color: row.raroc >= 0.08 ? T.green : T.red }}>{(row.raroc * 100).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px' }}>{row.currency}</td>
                    <td style={{ padding: '6px 10px' }}>{row.vintage}</td>
                  </tr>
                  {selectedId === row.id && (
                    <tr>
                      <td colSpan={cols.length} style={{ background: T.sub, padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12 }}>
                          <div><b>PD Climate:</b> {(row.pdClimate * 100).toFixed(2)}%</div>
                          <div><b>LGD Climate:</b> {(row.lgdClimate * 100).toFixed(0)}%</div>
                          <div><b>RWA Climate:</b> ${row.rwaClimate.toFixed(0)}M</div>
                          <div><b>Capital Charge:</b> ${row.capitalCharge.toFixed(0)}M</div>
                          <div><b>NPL Ratio:</b> {(row.nplRatio * 100).toFixed(1)}%</div>
                          <div><b>Carbon FP:</b> {row.carbonFP.toFixed(0)} ktCO₂e</div>
                          <div><b>Green Tagged:</b> {row.greenTagged ? '✓ Yes' : '✗ No'}</div>
                          <div><b>Hedge Cost:</b> {row.hedgeCostBps.toFixed(0)} bps</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── TAB 2: Legal Entity View ── */
  const renderLegalEntity = () => (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Sel value={leEntity}   onChange={setLeEntity}   options={LEGAL_ENTITIES} />
        <Sel value={leScenario} onChange={v => setLeScenario(+v)} options={NGFS3.map((s, i) => i)} style={{ width: 130 }} />
        <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={netToggle} onChange={e => setNetToggle(e.target.checked)} />
          Intra-group netting (×0.75)
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <KpiCard label="Exposures" value={leData.count} sub={leEntity} />
        <KpiCard label="Total Exposure" value={`$${leData.totalExpBN}BN`} color={T.navy} />
        <KpiCard label="Climate CVaR95" value={`$${leData.totalVarBN}BN`} color={T.red} sub={`${NGFS3[leScenario]}${netToggle ? ' | net' : ''}`} />
        <KpiCard label="Netting Status" value={netToggle ? 'ON' : 'OFF'} color={netToggle ? T.green : T.muted} sub="Intra-group" />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        {/* Pie chart by asset class */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="Exposure Mix by Asset Class" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={leData.byAsset} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {leData.byAsset.map((_, i) => <Cell key={i} fill={[T.indigo, T.teal, T.gold, T.orange, T.green, T.red, T.purple, T.blue, T.amber, T.navy][i % 10]} />)}
              </Pie>
              <Tooltip formatter={v => [`$${v.toFixed(0)}M`, 'Exposure']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top-5 exposures */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="Top 5 Exposures" sub={leEntity} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Asset Class','Geography','Sector','Exp $M','CVaR95 $M'].map(h => (
                  <th key={h} style={{ padding: '5px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leData.top5.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '5px 8px' }}>{r.assetClass}</td>
                  <td style={{ padding: '5px 8px' }}>{r.geography}</td>
                  <td style={{ padding: '5px 8px' }}>{r.sector}</td>
                  <td style={{ padding: '5px 8px', fontWeight: 700 }}>${r.exposureMN.toFixed(0)}</td>
                  <td style={{ padding: '5px 8px', color: T.red }}>${r.climateVaR95.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario P&L and capital attribution */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="Entity P&L Under Scenarios" sub="Net P&L impact $BN" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leData.scenPnl} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => [`$${v}BN`, '']} />
              <Bar dataKey="pnl" name="Net P&L $BN">
                {leData.scenPnl.map((r, i) => <Cell key={i} fill={NGFS3_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="Capital Attribution" sub="Scenario capital charge $BN" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leData.scenPnl} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => [`$${v}BN`, 'Capital']} />
              <Bar dataKey="capital" name="Capital $BN">
                {leData.scenPnl.map((r, i) => <Cell key={i} fill={[T.indigo, T.orange, T.red][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ── TAB 3: Capital Attribution ── */
  const renderCapital = () => {
    const passing = capData.filter(r => r.passes).length;
    const totalCap = capData.reduce((s, r) => s + r.capitalCharge, 0);
    const avgRaroc = capData.length ? capData.reduce((s, r) => s + r.raroc, 0) / capData.length : 0;

    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Entity Filter</div>
            <Sel value={capEntity} onChange={setCapEntity} options={['All', ...LEGAL_ENTITIES]} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Capital Method</div>
            <Sel value={capMethod} onChange={setCapMethod} options={['VaR', 'SA']} />
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <SliderRow label={`Hurdle Rate: ${hurdleRate}%`} min={6} max={15} value={hurdleRate} onChange={setHurdleRate} fmt={v => `${v}%`} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <KpiCard label="Entities Beating Hurdle" value={`${passing}/${capData.length}`} color={passing >= capData.length / 2 ? T.green : T.red} sub={`Hurdle: ${hurdleRate}%`} />
          <KpiCard label="Total Capital $BN" value={`$${totalCap.toFixed(1)}BN`} color={T.navy} sub={capMethod} />
          <KpiCard label="Portfolio Avg RAROC" value={`${(avgRaroc * 100).toFixed(1)}%`} color={avgRaroc * 100 >= hurdleRate ? T.green : T.red} sub="Exposure-weighted" />
          <KpiCard label="Hurdle Rate" value={`${hurdleRate}%`} color={T.indigo} sub="Set via slider" />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 2 }}>
            <SectionHead title="RAROC vs Hurdle Rate" sub="Entity breakdown — green = above hurdle" />
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={capData.map(r => ({ ...r, rarocPct: +(r.raroc * 100).toFixed(2) }))} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="entity" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [n === 'rarocPct' ? `${v}%` : `$${v}BN`, n]} />
                <ReferenceLine y={hurdleRate} stroke={T.red} strokeDasharray="4 4" label={{ value: `Hurdle ${hurdleRate}%`, fontSize: 10, fill: T.red }} />
                <Bar dataKey="rarocPct" name="RAROC %">
                  {capData.map((r, i) => <Cell key={i} fill={r.passes ? T.green : T.red} />)}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
            <SectionHead title="Capital Waterfall" sub="Group total → entity attribution ($BN)" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={capData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="entity" tick={{ fontSize: 9 }} width={80} />
                <Tooltip formatter={v => [`$${v}BN`, 'Capital']} />
                <Bar dataKey="capitalCharge" name="Capital $BN" fill={T.indigo}>
                  {capData.map((r, i) => <Cell key={i} fill={r.passes ? T.teal : T.orange} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHead title="RAROC Table" sub="Full entity breakdown" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Entity','RAROC','Capital $BN','Hurdle','Δ bps','Status','Cap Score'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capData.map(r => (
                <tr key={r.entity} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.entity}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: r.passes ? T.green : T.red }}>{(r.raroc * 100).toFixed(1)}%</td>
                  <td style={{ padding: '6px 10px' }}>${r.capitalCharge.toFixed(1)}BN</td>
                  <td style={{ padding: '6px 10px' }}>{hurdleRate}%</td>
                  <td style={{ padding: '6px 10px', color: r.delta >= 0 ? T.green : T.red }}>{r.delta >= 0 ? '+' : ''}{r.delta}bps</td>
                  <td style={{ padding: '6px 10px' }}><RAGBadge rag={r.passes ? 'Green' : 'Red'} /></td>
                  <td style={{ padding: '6px 10px' }}>{r.capitalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── TAB 4: Concentration Analysis ── */
  const renderConcentration = () => {
    const sortedHHI = [...hhiData].sort((a, b) => b.hhi - a.hhi);
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['entity','sector','geo'].map(d => (
              <button key={d} onClick={() => setHhiDim(d)}
                style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${hhiDim === d ? T.indigo : T.border}`, background: hhiDim === d ? T.indigo : T.card, color: hhiDim === d ? '#fff' : T.text, fontSize: 12, cursor: 'pointer' }}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <SliderRow label="Breach Threshold %" min={50} max={100} value={limThreshold} onChange={setLimThreshold} fmt={v => `${v}%`} />
          <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={breachOnly} onChange={e => setBreachOnly(e.target.checked)} />
            Breach only
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <KpiCard label="HHI Index" value={totalHHI.toFixed(0)} color={totalHHI > 1800 ? T.red : totalHHI > 1000 ? T.amber : T.green} sub={totalHHI > 1800 ? 'Highly Concentrated' : totalHHI > 1000 ? 'Moderate' : 'Diversified'} />
          <KpiCard label="Dimension" value={hhiDim.toUpperCase()} color={T.indigo} sub="Active view" />
          <KpiCard label="Limit Breaches" value={limData.filter(r => r.breach).length} color={limData.filter(r => r.breach).length > 0 ? T.red : T.green} sub={`Threshold ${limThreshold}%`} />
          <KpiCard label="Top Concentration" value={sortedHHI[0] ? `${sortedHHI[0].name}` : '—'} color={T.navy} sub={sortedHHI[0] ? `HHI: ${sortedHHI[0].hhi}` : ''} />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
            <SectionHead title={`HHI by ${hhiDim}`} sub="Higher = more concentrated" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sortedHHI} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [v, 'HHI Points']} />
                <ReferenceLine y={1800} stroke={T.red} strokeDasharray="4 4" label={{ value: 'High Conc.', fontSize: 10, fill: T.red }} />
                <ReferenceLine y={1000} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Moderate', fontSize: 10, fill: T.amber }} />
                <Bar dataKey="hhi" name="HHI">
                  {sortedHHI.map((r, i) => <Cell key={i} fill={r.hhi > 1800 ? T.red : r.hhi > 1000 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
            <SectionHead title="Limit Utilization" sub={`Threshold: ${limThreshold}%`} />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={limData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="entity" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 120]} />
                <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                <ReferenceLine y={limThreshold} stroke={T.red} strokeDasharray="4 4" />
                <Bar dataKey="util" name="Utilization %">
                  {limData.map((r, i) => <Cell key={i} fill={r.breach ? T.red : r.util > limThreshold * 0.8 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHead title="Top-10 Concentration Table" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Name','Exposure $BN','HHI Points','Rank','Status'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHHI.slice(0, 10).map((r, i) => (
                <tr key={r.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '6px 10px' }}>${r.exp}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 700 }}>{r.hhi}</td>
                  <td style={{ padding: '6px 10px' }}>#{i + 1}</td>
                  <td style={{ padding: '6px 10px' }}><RAGBadge rag={r.hhi > 1800 ? 'Red' : r.hhi > 1000 ? 'Amber' : 'Green'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── TAB 5: Scenario P&L Bridge ── */
  const renderScenarioPnl = () => (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Scenario A</div>
          <Sel value={scPnlA} onChange={v => setScPnlA(+v)} options={NGFS3.map((_, i) => i)} style={{ width: 130 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Scenario B</div>
          <Sel value={scPnlB} onChange={v => setScPnlB(+v)} options={NGFS3.map((_, i) => i)} style={{ width: 130 }} />
        </div>
        <div style={{ minWidth: 280 }}>
          <SliderRow label="Forecast Year" min={1} max={5} value={pnlYear} onChange={setPnlYear} fmt={v => `Y${v}`} />
        </div>
        <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showProv} onChange={e => setShowProv(e.target.checked)} />
          Show Provisions
        </label>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHead title={`P&L Bridge — ${NGFS3[scPnlA]} vs ${NGFS3[scPnlB]} (Year ${pnlYear})`} sub="Net P&L impact by business line ($M)" />
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={pnlBridge} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="line" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey={NGFS3[scPnlA]} fill={NGFS3_COLORS[scPnlA]} />
            <Bar dataKey={NGFS3[scPnlB]} fill={NGFS3_COLORS[scPnlB]} />
            {showProv && <Line dataKey="provA" stroke={T.purple} strokeDasharray="4 4" dot={false} name="Prov A" />}
            {showProv && <Line dataKey="provB" stroke={T.orange} strokeDasharray="4 4" dot={false} name="Prov B" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="CET1 Ratio Path" sub="Scenario comparison over 5 years (%)" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cet1Lines} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[10, 16]} />
              <Tooltip formatter={v => [`${v}%`, '']} />
              <Legend />
              <ReferenceLine y={12.5} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Min 12.5%', fontSize: 10, fill: T.red }} />
              {[scPnlA, scPnlB].map(si => (
                <Line key={si} dataKey={NGFS3[si]} stroke={NGFS3_COLORS[si]} strokeWidth={2} dot />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="Provision Charge Projection" sub="Year-by-year provision ($M)" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={Array.from({ length: 5 }, (_, yi) => ({
              year: `Y${yi + 1}`,
              [NGFS3[scPnlA]]: SCENARIO_PNL[scPnlA].years[yi].data.reduce((s, r) => s + Math.abs(r.provision), 0).toFixed(0),
              [NGFS3[scPnlB]]: SCENARIO_PNL[scPnlB].years[yi].data.reduce((s, r) => s + Math.abs(r.provision), 0).toFixed(0),
            }))} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area dataKey={NGFS3[scPnlA]} stroke={NGFS3_COLORS[scPnlA]} fill={NGFS3_COLORS[scPnlA] + '33'} />
              <Area dataKey={NGFS3[scPnlB]} stroke={NGFS3_COLORS[scPnlB]} fill={NGFS3_COLORS[scPnlB] + '33'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ── TAB 6: Hedging Desk ── */
  const renderHedging = () => (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Sel value={hedgeEntity} onChange={setHedgeEntity} options={LEGAL_ENTITIES} />
        <div style={{ minWidth: 280 }}>
          <SliderRow label="Target Hedge Ratio" min={0} max={100} value={hedgeRatioSlider} onChange={setHedgeRatioSlider} fmt={v => `${v}%`} />
        </div>
        <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showHedgeTimeline} onChange={e => setShowHedgeTimeline(e.target.checked)} />
          Show effectiveness timeline
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <KpiCard label="Current Coverage" value={`${hedgeEntityData.coverage}%`} color={+hedgeEntityData.coverage >= hedgeRatioSlider ? T.green : T.red} sub={hedgeEntity} />
        <KpiCard label="Hedge Cost" value={`${hedgeEntityData.costBps}bps`} color={T.amber} sub="Annual" />
        <KpiCard label="P&L Benefit" value={`${hedgeEntityData.benefitBps}bps`} color={T.green} sub="vs unhedged" />
        <KpiCard label="Effectiveness" value={`${hedgeEntityData.effectiveness}%`} color={+hedgeEntityData.effectiveness > 70 ? T.green : T.amber} sub="Hedge accounting" />
        <KpiCard label="Basis Risk" value={`${hedgeEntityData.basisRisk}bps`} color={+hedgeEntityData.basisRisk > 15 ? T.red : T.teal} sub="Residual" />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        {/* Coverage bar all entities */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="Hedge Coverage by Entity" sub="Target line shown" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={HEDGE_POSITIONS} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="entity" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip formatter={v => [`${v}%`, '']} />
              <ReferenceLine y={hedgeRatioSlider} stroke={T.indigo} strokeDasharray="4 4" label={{ value: `Target ${hedgeRatioSlider}%`, fontSize: 10, fill: T.indigo }} />
              <Bar dataKey="coverage" name="Coverage %">
                {HEDGE_POSITIONS.map((r, i) => <Cell key={i} fill={+r.coverage >= hedgeRatioSlider ? T.green : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost vs Benefit scatter */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
          <SectionHead title="Hedge Cost vs P&L Benefit" sub="Bubble = coverage %" />
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="costBps" name="Cost bps" tick={{ fontSize: 10 }} label={{ value: 'Cost (bps)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="benefitBps" name="Benefit bps" tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [`${v}bps`, n]} />
              <Scatter data={HEDGE_POSITIONS} fill={T.teal}>
                {HEDGE_POSITIONS.map((r, i) => <Cell key={i} fill={r.benefitBps > r.costBps ? T.green : T.red} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showHedgeTimeline && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHead title="Hedge Effectiveness Timeline (12 months)" sub="Effectiveness %, coverage %, basis risk bps" />
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={HEDGE_TIMELINE} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area dataKey="effectiveness" name="Effectiveness %" stroke={T.green} fill={T.green + '22'} />
              <Line dataKey="coverage" name="Coverage %" stroke={T.indigo} strokeWidth={2} dot={false} />
              <Bar dataKey="basisRisk" name="Basis Risk bps" fill={T.amber + '88'} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  /* ── TAB 7: TCFD Board Pack ── */
  const renderTCFD = () => {
    const domains = ['All', 'Governance', 'Strategy', 'Risk Mgmt', 'Metrics', 'Scenario'];
    const completePct = (TCFD_ITEMS_EXTENDED.filter(t => t.status === 'Complete').length / TCFD_ITEMS_EXTENDED.length * 100).toFixed(0);

    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {domains.map(d => (
            <button key={d} onClick={() => setTcfdDomain(d)}
              style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${tcfdDomain === d ? T.indigo : T.border}`, background: tcfdDomain === d ? T.indigo : T.card, color: tcfdDomain === d ? '#fff' : T.text, fontSize: 12, cursor: 'pointer' }}>
              {d}
            </button>
          ))}
          <div style={{ minWidth: 260 }}>
            <SliderRow label="Min score filter" min={0} max={3} value={tcfdThreshold} onChange={setTcfdThreshold} fmt={v => v} />
          </div>
          <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={expandActions} onChange={e => setExpandActions(e.target.checked)} />
            Expand action items
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <KpiCard label="Overall Score" value={`${tcfdScore.toFixed(0)}%`} color={+tcfdScore >= 70 ? T.green : +tcfdScore >= 40 ? T.amber : T.red} sub="20-item assessment" />
          <KpiCard label="Complete" value={`${completePct}%`} color={T.green} sub="Items status" />
          <KpiCard label="Items Shown" value={tcfdFiltered.length} color={T.indigo} sub={tcfdDomain} />
          <KpiCard label="Governance Score" value={`${(TCFD_ITEMS_EXTENDED.filter(t => t.domain === 'Governance').reduce((s, t) => s + t.score, 0) / 12 * 100).toFixed(0)}%`} color={T.navy} sub="4 items" />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          {/* Radar chart */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
            <SectionHead title="TCFD Radar vs Peer Average" />
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={PEER_RADAR} cx="50%" cy="50%" outerRadius={90}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Our Score" dataKey="self" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                <Radar name="Peer Avg" dataKey="peer" stroke={T.gold} fill={T.gold} fillOpacity={0.15} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Materiality matrix */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
            <SectionHead title="Materiality Matrix" sub="Impact vs Likelihood" />
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="likelihood" name="Likelihood" type="number" domain={[0, 5]} tick={{ fontSize: 10 }} label={{ value: 'Likelihood', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="impact" name="Impact" type="number" domain={[0, 5]} tick={{ fontSize: 10 }} label={{ value: 'Impact', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
                    <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                    <div>Impact: {payload[0].payload.impact} | Likelihood: {payload[0].payload.likelihood}</div>
                  </div>
                ) : null} />
                <Scatter data={MATERIALITY_ITEMS} fill={T.indigo}>
                  {MATERIALITY_ITEMS.map((r, i) => <Cell key={i} fill={r.impact * r.likelihood > 12 ? T.red : r.impact * r.likelihood > 6 ? T.amber : T.green} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TCFD items table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHead title="TCFD Items Tracker" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Domain','Item','Owner','Due','Score','Status','RAG'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tcfdFiltered.map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', color: T.muted }}>{t.domain}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 500, maxWidth: 280 }}>{t.item}</td>
                  <td style={{ padding: '6px 10px' }}>{t.owner}</td>
                  <td style={{ padding: '6px 10px' }}>{t.dueDate}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 700 }}>{t.score}/3</td>
                  <td style={{ padding: '6px 10px' }}>{t.status}</td>
                  <td style={{ padding: '6px 10px' }}><RAGBadge rag={t.rag} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {expandActions && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: T.sub, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Action Items</div>
              {tcfdFiltered.filter(t => t.rag !== 'Green').map(t => (
                <div key={t.id} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start', fontSize: 12 }}>
                  <RAGBadge rag={t.rag} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.item}</div>
                    <div style={{ color: T.muted }}>Owner: {t.owner} | Due: {t.dueDate} | Score: {t.score}/3</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── TAB 8: Risk Attribution Engine ── */
  const renderAttribution = () => {
    const dims = ['entity','asset','geo','bizline'];
    const cumData = attrData.reduce((acc, r, i) => {
      const prev = i === 0 ? 0 : acc[i - 1].cum;
      acc.push({ ...r, cum: +(prev + r.varBN).toFixed(2) });
      return acc;
    }, []);

    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {dims.map(d => (
              <button key={d} onClick={() => setAttrDim(d)}
                style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${attrDim === d ? T.indigo : T.border}`, background: attrDim === d ? T.indigo : T.card, color: attrDim === d ? '#fff' : T.text, fontSize: 12, cursor: 'pointer' }}>
                {d === 'bizline' ? 'Biz Line' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={attrScenario} onChange={e => setAttrScenario(e.target.checked)} />
            Scenario overlay
          </label>
          <div style={{ minWidth: 260 }}>
            <SliderRow label="Top-N" min={5} max={20} value={topN} onChange={setTopN} fmt={v => v} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <KpiCard label="Groups Shown" value={attrData.length} color={T.indigo} sub={attrDim} />
          <KpiCard label="Top Contributor" value={attrData[0]?.name || '—'} color={T.red} sub={attrData[0] ? `${attrData[0].pct}% of CVaR` : ''} />
          <KpiCard label="Total CVaR" value={`$${attrData.reduce((s, r) => s + r.varBN, 0).toFixed(2)}BN`} color={T.navy} sub={`${NGFS3[scenario]}`} />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
            <SectionHead title={`CVaR Attribution by ${attrDim}`} sub="$BN contribution" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attrData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [n === 'varBN' ? `$${v}BN` : `${v}%`, n]} />
                <Legend />
                <Bar dataKey="varBN" name="CVaR $BN" fill={T.indigo}>
                  {attrData.map((_, i) => <Cell key={i} fill={`hsl(${245 + i * 8}, 70%, ${40 + i * 2}%)`} />)}
                </Bar>
                {attrScenario && <Line dataKey="pct" name="% of Total" stroke={T.gold} strokeWidth={2} dot />}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
            <SectionHead title="Cumulative Attribution Waterfall" sub="Running total CVaR $BN" />
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={cumData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [`$${v}BN`, 'Cumulative CVaR']} />
                <Area dataKey="cum" name="Cumulative $BN" stroke={T.teal} fill={T.teal + '33'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHead title="Attribution Detail Table" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Rank','Name','CVaR $BN','% of Total','Exposure $BN','CVaR / Exp'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attrData.map((r, i) => (
                <tr key={r.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', color: T.muted }}>#{i + 1}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: T.red }}>${r.varBN}</td>
                  <td style={{ padding: '6px 10px' }}>{r.pct}%</td>
                  <td style={{ padding: '6px 10px' }}>${r.expBN}</td>
                  <td style={{ padding: '6px 10px' }}>{r.expBN > 0 ? ((r.varBN / r.expBN) * 100).toFixed(1) : '—'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── TAB 9: Summary & Export ── */
  const renderExport = () => {
    const checklist = [
      { label: 'SFDR Art. 8/9 climate risk disclosures', done: tcfdScore > 50 },
      { label: 'CSRD ESRS E1 materiality assessment', done: TCFD_ITEMS_EXTENDED.filter(t => t.domain === 'Metrics').every(t => t.score > 0) },
      { label: 'TCFD 11 recommended disclosures', done: tcfdScore > 60 },
      { label: 'NGFS scenario analysis', done: true },
      { label: 'Physical risk quantification', done: true },
      { label: 'Transition risk quantification', done: true },
      { label: 'Portfolio temperature alignment', done: false },
      { label: 'Scope 1/2/3 financed emissions', done: tcfdScore > 55 },
    ];

    const exportPayload = {
      generated: new Date().toISOString(),
      format: exportFormat,
      sections: exportSections,
      kpis: exportSections.kpis ? {
        totalExposureBN: totalExposureBN.toFixed(2),
        portfolioCVaRBN: (portfolioCVaR / 1000).toFixed(2),
        diversBenefitBN: diversBenefitBN.toFixed(2),
        pctHedged: pctHedged.toFixed(1),
        tcfdScore: tcfdScore.toFixed(0),
        scenario: NGFS3[scenario],
      } : undefined,
    };

    return (
      <div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <KpiCard label="Total Exposure" value={`$${totalExposureBN.toFixed(1)}BN`} color={T.navy} />
          <KpiCard label="Group CVaR 95%" value={`$${(portfolioCVaR / 1000).toFixed(2)}BN`} color={T.red} sub={NGFS3[scenario]} />
          <KpiCard label="Diversification" value={`$${diversBenefitBN.toFixed(2)}BN`} color={T.green} />
          <KpiCard label="TCFD Score" value={`${tcfdScore.toFixed(0)}%`} color={T.indigo} />
          <KpiCard label="Entities Beating Hurdle" value={`${RAROC_TABLE.filter(r => r.raroc >= 0.08).length}/${RAROC_TABLE.length}`} color={T.teal} />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          {/* Regulatory alignment */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
            <SectionHead title="Regulatory Alignment Checklist" sub="SFDR / CSRD / TCFD" />
            {checklist.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13 }}>
                <span style={{ width: 20, height: 20, borderRadius: 10, background: c.done ? T.green : T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, flexShrink: 0 }}>
                  {c.done ? '✓' : '✗'}
                </span>
                <span style={{ color: c.done ? T.text : T.muted }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Export config */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1 }}>
            <SectionHead title="Export Configuration" sub="Board pack sections" />
            {Object.keys(exportSections).map(k => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={exportSections[k]} onChange={e => setExportSections(s => ({ ...s, [k]: e.target.checked }))} />
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </label>
            ))}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Export Format</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['JSON','CSV','PDF'].map(f => (
                  <button key={f} onClick={() => setExportFormat(f)}
                    style={{ padding: '5px 14px', borderRadius: 6, border: `1px solid ${exportFormat === f ? T.indigo : T.border}`, background: exportFormat === f ? T.indigo : T.card, color: exportFormat === f ? '#fff' : T.text, fontSize: 12, cursor: 'pointer' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Board pack narrative */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <SectionHead title="Board Pack Summary" sub="Auto-generated narrative" />
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7, background: T.sub, borderRadius: 6, padding: '14px 16px' }}>
            As at reporting date under the <strong>{NGFS3[scenario]}</strong> NGFS scenario, the Group's consolidated
            climate exposure stands at <strong>${totalExposureBN.toFixed(1)}BN</strong> across {filtered.length} positions
            spanning {LEGAL_ENTITIES.length} legal entities. The Group Climate VaR at 95% confidence is{' '}
            <strong>${(portfolioCVaR / 1000).toFixed(2)}BN</strong>, with a diversification benefit of{' '}
            <strong>${diversBenefitBN.toFixed(2)}BN</strong> versus the stand-alone sum.
            Hedge coverage stands at <strong>{pctHedged.toFixed(1)}%</strong> of total exposure.
            TCFD disclosure completeness is rated <strong>{tcfdScore.toFixed(0)}%</strong>.
            Capital attribution shows <strong>{RAROC_TABLE.filter(r => r.raroc >= 0.08).length}</strong> of{' '}
            {RAROC_TABLE.length} entities beating the {hurdleRate}% hurdle rate under the {capMethod} method.
            Concentration risk (HHI: <strong>{totalHHI}</strong>) is classified as{' '}
            {totalHHI > 1800 ? 'highly concentrated' : totalHHI > 1000 ? 'moderately concentrated' : 'well diversified'}.
          </div>
        </div>

        {/* Export simulation */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHead title="Export Simulation" sub={`Format: ${exportFormat}`} />
          <pre style={{ background: T.sub, borderRadius: 6, padding: '12px 14px', fontSize: 11, color: T.text, overflowX: 'auto', maxHeight: 280 }}>
            {JSON.stringify(exportPayload, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  /* ═══════════════ MAIN RENDER ═══════════════ */
  const tabContent = [
    renderDashboard,
    renderExposureDB,
    renderLegalEntity,
    renderCapital,
    renderConcentration,
    renderScenarioPnl,
    renderHedging,
    renderTCFD,
    renderAttribution,
    renderExport,
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '18px 28px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>
          A² Intelligence · Enterprise Risk Platform
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
          Enterprise Climate Risk — Group Aggregation
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          Goldman Sachs / JP Morgan tier · {EXPOSURES.length} exposures · {LEGAL_ENTITIES.length} legal entities · NGFS scenarios
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 20px', display: 'flex', overflowX: 'auto', gap: 0 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: tab === i ? `3px solid ${T.indigo}` : '3px solid transparent', color: tab === i ? T.indigo : T.muted, fontWeight: tab === i ? 700 : 400, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {tabContent[tab]?.()}
      </div>
    </div>
  );
}
