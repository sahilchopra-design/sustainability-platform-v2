import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, PieChart, Pie,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';

/* ── PRNG ── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Theme ── */
const T = { surface:'#fafaf7', border:'#e2e0d8', navy:'#1b2a4a', gold:'#b8962e', text:'#1a1a2e', sub:'#64748b', card:'#ffffff', indigo:'#4f46e5', green:'#065f46', red:'#991b1b', amber:'#92400e' };
const font = "'DM Sans','SF Pro Display',system-ui,sans-serif";
const mono = "'JetBrains Mono','SF Mono','Fira Code',monospace";
const COLORS = ['#4f46e5','#065f46','#991b1b','#92400e','#b8962e','#0891b2','#7c3aed','#ea580c','#16a34a','#2563eb','#dc2626','#6366f1','#059669','#d97706'];

/* ── Data Constants ── */
const TYPES = ['REDD+','ARR','IFM','Cookstove','DAC','Biochar','Renewable','Blue Carbon','Soil','CCS','Peatland','Waste','Mineralization','Methane'];
const REGISTRIES = ['Verra','GS','ACR','CAR','Puro'];
const COUNTRIES = ['Brazil','Indonesia','Kenya','Ghana','Ethiopia','India','US','UK','Colombia','Peru','Mexico','China','Cambodia','DRC','Tanzania','Australia','Norway','Chile','Canada','Costa Rica','Philippines','Vietnam','Madagascar','Mozambique','Nepal','Myanmar','PNG','Fiji','Uruguay','South Africa','Japan','Germany','France','Thailand','Malaysia','Bangladesh','Sri Lanka','Ecuador','Belize','Gabon','Rwanda','Zambia','Malawi','Laos','Honduras','Guatemala','Nicaragua','Panama','Senegal','Cameroon'];
const REGIONS = { Brazil:'LatAm',Indonesia:'Asia',Kenya:'Africa',Ghana:'Africa',Ethiopia:'Africa',India:'Asia',US:'North America',UK:'Europe',Colombia:'LatAm',Peru:'LatAm',Mexico:'LatAm',China:'Asia',Cambodia:'Asia',DRC:'Africa',Tanzania:'Africa',Australia:'Oceania',Norway:'Europe',Chile:'LatAm',Canada:'North America',CostaRica:'LatAm',Philippines:'Asia',Vietnam:'Asia',Madagascar:'Africa',Mozambique:'Africa',Nepal:'Asia',Myanmar:'Asia',PNG:'Oceania',Fiji:'Oceania',Uruguay:'LatAm',SouthAfrica:'Africa',Japan:'Asia',Germany:'Europe',France:'Europe',Thailand:'Asia',Malaysia:'Asia',Bangladesh:'Asia',SriLanka:'Asia',Ecuador:'LatAm',Belize:'LatAm',Gabon:'Africa',Rwanda:'Africa',Zambia:'Africa',Malawi:'Africa',Laos:'Asia',Honduras:'LatAm',Guatemala:'LatAm',Nicaragua:'LatAm',Panama:'LatAm',Senegal:'Africa',Cameroon:'Africa' };
const BEZERO = ['AAA','AA','A','BBB','BB','B','CCC','CC','C','D'];
const SDGS = [[7,13],[1,13,15],[6,13,14],[1,2,13],[7,13],[13,15],[7,13],[13,14,15],[2,13,15],[7,13],[13,15],[7,11,13],[13],[7,13]];
const VERIFIERS = ['SCS Global','RINA','TUV SUD','DNV','Bureau Veritas','SGS','ERM CVS','Ruby Canyon'];

const HOLDINGS = Array.from({ length: 50 }, (_, i) => {
  const typeIdx = Math.floor(sr(i * 3) * TYPES.length);
  const type = TYPES[typeIdx];
  const vintage = 2015 + Math.floor(sr(i * 7 + 1) * 10);
  const tonnes = Math.round(1000 + sr(i * 11 + 2) * 49000);
  const baseMult = type === 'DAC' ? 300 : type === 'Biochar' ? 60 : type === 'CCS' ? 80 : type === 'Mineralization' ? 70 : type === 'Blue Carbon' ? 20 : type === 'Methane' ? 15 : type === 'Peatland' ? 18 : type === 'ARR' ? 14 : type === 'REDD+' ? 10 : type === 'IFM' ? 9 : type === 'Soil' ? 16 : type === 'Cookstove' ? 6 : type === 'Renewable' ? 3 : 8;
  const costBasis = Math.round((baseMult + sr(i * 13 + 3) * baseMult * 0.4) * 100) / 100;
  const priceMove = 1 + (sr(i * 17 + 4) - 0.4) * 0.3;
  const currentPrice = Math.round(costBasis * priceMove * 100) / 100;
  const retiredPct = sr(i * 19 + 5) * 0.6;
  const retired = Math.round(tonnes * retiredPct);
  const scheduledPct = sr(i * 23 + 6) * 0.4;
  const scheduledRetire = Math.round((tonnes - retired) * scheduledPct);
  const registry = REGISTRIES[Math.floor(sr(i * 29 + 7) * REGISTRIES.length)];
  const country = COUNTRIES[i % COUNTRIES.length];
  const qualityScore = Math.round(40 + sr(i * 31 + 8) * 60);
  const bezIdx = Math.min(BEZERO.length - 1, Math.floor((100 - qualityScore) / 10));
  const permanenceYrs = type === 'DAC' ? 1000 : type === 'CCS' ? 500 : type === 'Mineralization' ? 10000 : type === 'Biochar' ? 100 : type === 'Blue Carbon' ? 50 : type === 'Peatland' ? 40 : type === 'ARR' ? 30 : type === 'REDD+' ? 25 : type === 'IFM' ? 40 : type === 'Soil' ? 20 : 10;
  const bufferPct = Math.round(5 + sr(i * 37 + 9) * 25);
  const reversalRisk = Math.round((1 + sr(i * 41 + 10) * 30) * 10) / 10;
  const corsiaEligible = qualityScore > 60 && (registry === 'Verra' || registry === 'GS' || registry === 'ACR');
  return {
    id: i + 1, name: `${country} ${type} #${i + 1}`, projectType: type, vintage, tonnes, costBasis, currentPrice,
    retired, scheduledRetire, registry, verifier: VERIFIERS[Math.floor(sr(i * 43 + 11) * VERIFIERS.length)],
    permanenceYrs, qualityScore, bezeroRating: BEZERO[bezIdx], country,
    region: REGIONS[country] || 'Other',
    sdgAligned: SDGS[typeIdx] || [13], corsiaEligible, bufferPct, reversalRisk,
    lastVerificationDate: `${2023 + Math.floor(sr(i * 47 + 12) * 2)}-${String(1 + Math.floor(sr(i * 53 + 13) * 12)).padStart(2, '0')}-${String(1 + Math.floor(sr(i * 59 + 14) * 28)).padStart(2, '0')}`,
    mtm: 0, costTotal: 0, pnl: 0, unretired: 0
  };
}).map(h => ({ ...h, mtm: h.tonnes * h.currentPrice, costTotal: h.tonnes * h.costBasis, pnl: h.tonnes * (h.currentPrice - h.costBasis), unretired: h.tonnes - h.retired }));

const RETIREMENT_SCHEDULE = Array.from({ length: 36 }, (_, i) => {
  const yr = 2024 + Math.floor(i / 12);
  const mo = (i % 12) + 1;
  const planned = Math.round(3000 + sr(i * 61 + 20) * 4000);
  const actual = Math.round(planned * (0.7 + sr(i * 67 + 21) * 0.5));
  return { month: `${yr}-${String(mo).padStart(2, '0')}`, planned, actual, cumPlanned: 0, cumActual: 0 };
});
let cpS = 0, caS = 0;
RETIREMENT_SCHEDULE.forEach(r => { cpS += r.planned; caS += r.actual; r.cumPlanned = cpS; r.cumActual = caS; });

const PRICE_HISTORY = Array.from({ length: 24 }, (_, i) => {
  const base = 12 + sr(i * 71 + 30) * 3;
  return { month: `${2024 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`, avgPrice: Math.round(base * (1 + (i - 12) * 0.008 + (sr(i * 73 + 31) - 0.5) * 0.15) * 100) / 100 };
});

const BENCHMARK_INDEX = Array.from({ length: 24 }, (_, i) => ({
  month: PRICE_HISTORY[i].month,
  index: Math.round((100 + i * 0.4 + (sr(i * 79 + 40) - 0.5) * 8) * 100) / 100
}));

const TRANSACTION_LOG = Array.from({ length: 30 }, (_, i) => {
  const txTypes = ['buy', 'sell', 'retire', 'transfer'];
  const type = txTypes[Math.floor(sr(i * 83 + 50) * txTypes.length)];
  const hIdx = Math.floor(sr(i * 89 + 51) * HOLDINGS.length);
  const h = HOLDINGS[hIdx];
  const tonnes = Math.round(100 + sr(i * 97 + 52) * 4900);
  const price = Math.round((h.currentPrice * (0.9 + sr(i * 101 + 53) * 0.2)) * 100) / 100;
  const cps = ['CompanyA','CompanyB','BrokerX','RegistryDirect','CarbonTrader','GreenCorp','EcoFund','NatCapital'];
  return {
    id: i + 1, date: `2024-${String(1 + Math.floor(sr(i * 103 + 54) * 12)).padStart(2, '0')}-${String(1 + Math.floor(sr(i * 107 + 55) * 28)).padStart(2, '0')}`,
    type, holding: h.name, tonnes, price,
    counterparty: cps[Math.floor(sr(i * 109 + 56) * cps.length)],
    status: sr(i * 113 + 57) > 0.2 ? 'settled' : 'pending'
  };
}).sort((a, b) => b.date.localeCompare(a.date));

/* ── Credit Quality Tiers ── */
const QUALITY_TIERS = [
  { tier: 'Premium', min: 80, max: 100, description: 'Investment-grade removal credits with AAA-AA ratings' },
  { tier: 'Standard', min: 60, max: 79, description: 'Verified avoidance credits with A-BBB ratings' },
  { tier: 'Basic', min: 40, max: 59, description: 'Lower-confidence credits requiring enhanced monitoring' },
  { tier: 'Speculative', min: 0, max: 39, description: 'Unrated or sub-investment credits' },
];

/* ── Methodology Benchmarks ── */
const METHOD_BENCHMARKS = TYPES.map((t, i) => ({
  type: t,
  avgPrice: Math.round((t === 'DAC' ? 350 : t === 'Biochar' ? 75 : t === 'CCS' ? 95 : t === 'Mineralization' ? 80 : t === 'Blue Carbon' ? 24 : t === 'Methane' ? 12 : t === 'Peatland' ? 20 : t === 'ARR' ? 16 : t === 'REDD+' ? 11 : t === 'IFM' ? 10 : t === 'Soil' ? 18 : t === 'Cookstove' ? 7 : t === 'Renewable' ? 3 : 10) * (1 + (sr(i * 151 + 90) - 0.5) * 0.2) * 100) / 100,
  volumeGrowth: Math.round((-5 + sr(i * 157 + 91) * 25) * 10) / 10,
  supplyRisk: ['Low', 'Medium', 'High'][Math.floor(sr(i * 163 + 92) * 3)],
}));

/* ── Counterparty Risk ── */
const COUNTERPARTIES = ['CompanyA', 'CompanyB', 'BrokerX', 'RegistryDirect', 'CarbonTrader', 'GreenCorp', 'EcoFund', 'NatCapital'].map((cp, i) => ({
  name: cp, type: i < 2 ? 'Corporate' : i < 4 ? 'Broker' : i < 6 ? 'Fund' : 'Registry',
  creditRating: ['A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB'][i],
  exposureTonnes: TRANSACTION_LOG.filter(t => t.counterparty === cp).reduce((a, t) => a + t.tonnes, 0),
  exposureValue: TRANSACTION_LOG.filter(t => t.counterparty === cp).reduce((a, t) => a + t.tonnes * t.price, 0),
}));

/* ── Aggregations ── */
const totalTonnes = HOLDINGS.reduce((a, h) => a + h.tonnes, 0);
const totalMTM = HOLDINGS.reduce((a, h) => a + h.mtm, 0);
const totalCost = HOLDINGS.reduce((a, h) => a + h.costTotal, 0);
const totalPnL = HOLDINGS.reduce((a, h) => a + h.pnl, 0);
const totalRetired = HOLDINGS.reduce((a, h) => a + h.retired, 0);
const totalScheduled = HOLDINGS.reduce((a, h) => a + h.scheduledRetire, 0);
const wtdQuality = HOLDINGS.length ? HOLDINGS.reduce((a, h) => a + h.qualityScore * h.tonnes, 0) / totalTonnes : 0;
const retireCoverage = totalTonnes > 0 ? ((totalRetired + totalScheduled) / totalTonnes * 100) : 0;

/* ── Tabs & Styles ── */
const TABS = ['Portfolio Dashboard', 'Holdings Deep-Dive', 'P&L Attribution', 'Vintage & Maturity', 'Retirement Tracker', 'Performance vs Benchmark', 'Quality & Risk', 'Geographic Exposure', 'Transaction Ledger', 'Compliance & Reporting'];
const card = { background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };
const kpiBox = { background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: '14px 18px' };
const fmt = v => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}k` : `$${v.toFixed(0)}`;
const fmtT = v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : `${v}`;
const pct = (n, d) => d > 0 ? (n / d * 100).toFixed(1) : '0.0';

/* ────────────────────── COMPONENT ────────────────────── */
function OffsetPortfolioTrackerPage() {
  /* ── All hooks at top ── */
  const [tab, setTab] = useState(0);
  const [methFilter, setMethFilter] = useState([]);
  const [regFilter, setRegFilter] = useState([]);
  const [vintageRange, setVintageRange] = useState([2015, 2024]);
  const [qualThreshold, setQualThreshold] = useState(0);
  const [corsiaOnly, setCorsiaOnly] = useState(false);
  const [sortCol, setSortCol] = useState('mtm');
  const [sortDir, setSortDir] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [attrPeriod, setAttrPeriod] = useState('12m');
  const [retireWhatIf, setRetireWhatIf] = useState(100);
  const [benchSel, setBenchSel] = useState('VCM Index');
  const [rollingWindow, setRollingWindow] = useState('6m');
  const [riskOverlay, setRiskOverlay] = useState('political');
  const [emissionsInput, setEmissionsInput] = useState(50000);
  const [txSort, setTxSort] = useState('date');

  /* ── Global filtered holdings ── */
  const globalFiltered = useMemo(() => {
    let d = [...HOLDINGS];
    if (methFilter.length > 0) d = d.filter(h => methFilter.includes(h.projectType));
    if (regFilter.length > 0) d = d.filter(h => regFilter.includes(h.registry));
    d = d.filter(h => h.vintage >= vintageRange[0] && h.vintage <= vintageRange[1]);
    if (qualThreshold > 0) d = d.filter(h => h.qualityScore >= qualThreshold);
    if (corsiaOnly) d = d.filter(h => h.corsiaEligible);
    return d;
  }, [methFilter, regFilter, vintageRange, qualThreshold, corsiaOnly]);

  /* ── Holdings sorted (Tab 2) ── */
  const sortedHoldings = useMemo(() => {
    let d = [...globalFiltered];
    if (searchTerm) d = d.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()) || h.country.toLowerCase().includes(searchTerm.toLowerCase()));
    d.sort((a, b) => {
      const m = sortDir === 'desc' ? -1 : 1;
      if (sortCol === 'name') return m * a.name.localeCompare(b.name);
      return m * ((a[sortCol] || 0) - (b[sortCol] || 0));
    });
    return d;
  }, [globalFiltered, searchTerm, sortCol, sortDir]);

  /* ── Type aggregation ── */
  const typeAgg = useMemo(() => {
    const map = {};
    globalFiltered.forEach(h => {
      if (!map[h.projectType]) map[h.projectType] = { type: h.projectType, mtm: 0, tonnes: 0, cost: 0, pnl: 0, count: 0 };
      map[h.projectType].mtm += h.mtm; map[h.projectType].tonnes += h.tonnes;
      map[h.projectType].cost += h.costTotal; map[h.projectType].pnl += h.pnl; map[h.projectType].count += 1;
    });
    return Object.values(map).sort((a, b) => b.mtm - a.mtm);
  }, [globalFiltered]);

  /* ── Toggle helpers ── */
  const toggleMeth = useCallback(t => setMethFilter(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]), []);
  const toggleReg = useCallback(r => setRegFilter(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]), []);
  const handleSort = useCallback(col => { if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortCol(col); setSortDir('desc'); } }, [sortCol]);

  /* ── Vintage data ── */
  const vintageData = useMemo(() => {
    const years = [];
    for (let y = 2015; y <= 2024; y++) {
      const hs = globalFiltered.filter(h => h.vintage === y);
      years.push({ vintage: y, tonnes: hs.reduce((a, h) => a + h.tonnes, 0), mtm: hs.reduce((a, h) => a + h.mtm, 0), count: hs.length });
    }
    return years;
  }, [globalFiltered]);

  /* ── Performance data ── */
  const perfData = useMemo(() => {
    let cumPort = 0, cumBench = 0;
    return PRICE_HISTORY.map((p, i) => {
      const portReturn = i === 0 ? 0 : ((p.avgPrice - PRICE_HISTORY[i - 1].avgPrice) / PRICE_HISTORY[i - 1].avgPrice * 100);
      const benchReturn = i === 0 ? 0 : ((BENCHMARK_INDEX[i].index - BENCHMARK_INDEX[i - 1].index) / BENCHMARK_INDEX[i - 1].index * 100);
      cumPort += portReturn; cumBench += benchReturn;
      return { month: p.month, portReturn: Math.round(cumPort * 100) / 100, benchReturn: Math.round(cumBench * 100) / 100, alpha: Math.round((cumPort - cumBench) * 100) / 100, price: p.avgPrice, index: BENCHMARK_INDEX[i].index };
    });
  }, []);

  /* ── Geographic data ── */
  const geoData = useMemo(() => {
    const byCountry = {};
    globalFiltered.forEach(h => {
      if (!byCountry[h.country]) byCountry[h.country] = { country: h.country, region: h.region, tonnes: 0, mtm: 0, count: 0, politicalRisk: 0, deforestRisk: 0, fireRisk: 0 };
      byCountry[h.country].tonnes += h.tonnes; byCountry[h.country].mtm += h.mtm; byCountry[h.country].count += 1;
    });
    Object.values(byCountry).forEach((c, i) => {
      c.politicalRisk = Math.round(20 + sr(i * 131 + 70) * 60);
      c.deforestRisk = Math.round(10 + sr(i * 137 + 71) * 70);
      c.fireRisk = Math.round(5 + sr(i * 139 + 72) * 50);
    });
    return Object.values(byCountry).sort((a, b) => b.mtm - a.mtm);
  }, [globalFiltered]);

  const regionAgg = useMemo(() => {
    const map = {};
    geoData.forEach(c => { if (!map[c.region]) map[c.region] = { region: c.region, tonnes: 0, mtm: 0 }; map[c.region].tonnes += c.tonnes; map[c.region].mtm += c.mtm; });
    return Object.values(map).sort((a, b) => b.mtm - a.mtm);
  }, [geoData]);

  /* ── Quality radar data ── */
  const qualityRadar = useMemo(() => {
    const f = globalFiltered;
    if (!f.length) return [];
    const avg = (fn) => f.length ? f.reduce((a, h) => a + fn(h), 0) / f.length : 0;
    return [
      { dim: 'Additionality', val: Math.round(avg(h => h.qualityScore * 0.9)) },
      { dim: 'Permanence', val: Math.round(avg(h => Math.min(100, h.permanenceYrs / 10))) },
      { dim: 'Co-benefits', val: Math.round(avg(h => h.sdgAligned.length * 20)) },
      { dim: 'MRV', val: Math.round(avg(h => 50 + h.qualityScore * 0.4)) },
      { dim: 'Registry', val: Math.round(avg(h => h.registry === 'Verra' || h.registry === 'GS' ? 85 : 65)) },
    ];
  }, [globalFiltered]);

  /* ── Render KPI card ── */
  const Kpi = useCallback(({ label, value, color, sub: s }) => (
    <div style={kpiBox}>
      <div style={{ ...lbl, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: mono, color: color || T.text }}>{value}</div>
      {s && <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{s}</div>}
    </div>
  ), []);

  /* ── Render ── */
  const gfMTM = globalFiltered.reduce((a, h) => a + h.mtm, 0);
  const gfCost = globalFiltered.reduce((a, h) => a + h.costTotal, 0);
  const gfPnL = globalFiltered.reduce((a, h) => a + h.pnl, 0);
  const gfTonnes = globalFiltered.reduce((a, h) => a + h.tonnes, 0);
  const gfRetired = globalFiltered.reduce((a, h) => a + h.retired, 0);
  const gfWtdQ = gfTonnes > 0 ? globalFiltered.reduce((a, h) => a + h.qualityScore * h.tonnes, 0) / gfTonnes : 0;
  const gfRetCov = gfTonnes > 0 ? (globalFiltered.reduce((a, h) => a + h.retired + h.scheduledRetire, 0)) / gfTonnes * 100 : 0;

  return (
    <div style={{ fontFamily: font, background: T.surface, minHeight: '100vh', color: T.text }}>
      {/* ── Header ── */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CN5 -- OFFSET PORTFOLIO TRACKER</div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Offset Portfolio Management & Tracking</h1>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>50 Positions -- MTM Analytics -- Vintage Distribution -- Retirement Schedule -- Quality & Risk -- Compliance</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { l: 'Total MTM', v: fmt(gfMTM), c: T.gold },
              { l: 'Unrealized P&L', v: `${gfPnL >= 0 ? '+' : ''}${fmt(Math.abs(gfPnL))}`, c: gfPnL >= 0 ? '#16a34a' : T.red },
              { l: 'Tonnes', v: fmtT(gfTonnes), c: '#0891b2' },
              { l: 'Wtd Quality', v: `${gfWtdQ.toFixed(0)}/100`, c: T.indigo },
            ].map(m => (
              <div key={m.l} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{m.l}</div>
                <div style={{ color: m.c, fontSize: 16, fontWeight: 700, fontFamily: mono }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 11,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', fontFamily: font
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ── Global Filter Bar ── */}
      <div style={{ padding: '12px 32px', background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>FILTERS:</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => toggleMeth(t)} style={{
              padding: '3px 8px', borderRadius: 4, border: `1px solid ${methFilter.includes(t) ? T.indigo : T.border}`,
              background: methFilter.includes(t) ? T.indigo + '15' : 'transparent', color: methFilter.includes(t) ? T.indigo : T.sub,
              fontSize: 9, cursor: 'pointer', fontFamily: font
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {REGISTRIES.map(r => (
            <button key={r} onClick={() => toggleReg(r)} style={{
              padding: '3px 8px', borderRadius: 4, border: `1px solid ${regFilter.includes(r) ? T.green : T.border}`,
              background: regFilter.includes(r) ? T.green + '15' : 'transparent', color: regFilter.includes(r) ? T.green : T.sub,
              fontSize: 9, cursor: 'pointer', fontFamily: font
            }}>{r}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, color: T.sub }}>Vintage</span>
          <input type="range" min={2015} max={2024} value={vintageRange[0]} onChange={e => setVintageRange([+e.target.value, vintageRange[1]])} style={{ width: 60 }} />
          <span style={{ fontSize: 9, fontFamily: mono }}>{vintageRange[0]}-{vintageRange[1]}</span>
          <input type="range" min={2015} max={2024} value={vintageRange[1]} onChange={e => setVintageRange([vintageRange[0], +e.target.value])} style={{ width: 60 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, color: T.sub }}>Quality &ge;</span>
          <input type="range" min={0} max={90} step={5} value={qualThreshold} onChange={e => setQualThreshold(+e.target.value)} style={{ width: 60 }} />
          <span style={{ fontSize: 9, fontFamily: mono }}>{qualThreshold}</span>
        </div>
        <label style={{ fontSize: 9, color: T.sub, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={corsiaOnly} onChange={e => setCorsiaOnly(e.target.checked)} /> CORSIA Only
        </label>
        <div style={{ fontSize: 9, color: T.sub, marginLeft: 'auto' }}>{globalFiltered.length} / {HOLDINGS.length} holdings</div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '20px 32px 40px' }}>

        {/* ═══ TAB 0: Portfolio Dashboard ═══ */}
        {tab === 0 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
            <Kpi label="Total Tonnes" value={fmtT(gfTonnes)} color={T.text} sub="tCO2e" />
            <Kpi label="MTM Value" value={fmt(gfMTM)} color={T.gold} sub="mark-to-market" />
            <Kpi label="Total Cost" value={fmt(gfCost)} color={T.text} sub="cost basis" />
            <Kpi label="Unrealized P&L" value={`${gfPnL >= 0 ? '+' : ''}${fmt(Math.abs(gfPnL))}`} color={gfPnL >= 0 ? '#16a34a' : T.red} sub={`${pct(gfPnL, gfCost)}% return`} />
            <Kpi label="Wtd Avg Quality" value={`${gfWtdQ.toFixed(1)}`} color={T.indigo} sub="score / 100" />
            <Kpi label="Retirement Coverage" value={`${gfRetCov.toFixed(1)}%`} color={T.green} sub="retired + scheduled" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card}>
              <div style={lbl}>Portfolio by Project Type (MTM)</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={typeAgg} dataKey="mtm" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {typeAgg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip formatter={v => fmt(Number(v))} /></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Top 10 Holdings by MTM Value</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...globalFiltered].sort((a, b) => b.mtm - a.mtm).slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={120} />
                  <Tooltip formatter={v => fmt(Number(v))} /><Bar dataKey="mtm" fill={T.navy} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Portfolio Summary Table</div>
            <div style={{ maxHeight: 350, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.card }}>
                  {['#', 'Credit', 'Type', 'Registry', 'Vintage', 'Tonnes', 'Cost', 'Spot', 'MTM', 'P&L', 'Quality', 'BeZero'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 4px', color: T.sub, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{[...globalFiltered].sort((a, b) => b.mtm - a.mtm).slice(0, 20).map((h, idx) => (
                  <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}`, background: idx % 2 === 0 ? T.card : T.surface }}>
                    <td style={{ padding: 4, fontFamily: mono, fontSize: 9, color: T.sub }}>{idx + 1}</td>
                    <td style={{ padding: 4, fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                    <td style={{ padding: 4 }}>{h.projectType}</td>
                    <td style={{ padding: 4 }}>{h.registry}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>{h.vintage}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>{h.tonnes.toLocaleString()}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>${h.costBasis.toFixed(2)}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>${h.currentPrice.toFixed(2)}</td>
                    <td style={{ padding: 4, fontFamily: mono, fontWeight: 700 }}>{fmt(h.mtm)}</td>
                    <td style={{ padding: 4, fontFamily: mono, color: h.pnl >= 0 ? '#16a34a' : T.red }}>{h.pnl >= 0 ? '+' : ''}{fmt(Math.abs(h.pnl))}</td>
                    <td style={{ padding: 4 }}><span style={{ background: h.qualityScore >= 70 ? '#dcfce7' : h.qualityScore >= 50 ? '#fef9c3' : '#fee2e2', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>{h.qualityScore}</span></td>
                    <td style={{ padding: 4, fontWeight: 600, color: h.bezeroRating.startsWith('A') ? T.green : h.bezeroRating.startsWith('B') ? T.amber : T.red }}>{h.bezeroRating}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Registry Distribution</div>
              {(() => {
                const regDist = REGISTRIES.map(r => ({ registry: r, count: globalFiltered.filter(h => h.registry === r).length, tonnes: globalFiltered.filter(h => h.registry === r).reduce((a, h) => a + h.tonnes, 0) })).filter(r => r.count > 0);
                return (<ResponsiveContainer width="100%" height={200}>
                  <BarChart data={regDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="registry" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip />
                    <Bar dataKey="count" name="Holdings" fill={T.indigo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>);
              })()}
            </div>
            <div style={card}>
              <div style={lbl}>Quality Tier Breakdown</div>
              {(() => {
                const tierData = QUALITY_TIERS.map(t => ({
                  tier: t.tier, count: globalFiltered.filter(h => h.qualityScore >= t.min && h.qualityScore <= t.max).length,
                  tonnes: globalFiltered.filter(h => h.qualityScore >= t.min && h.qualityScore <= t.max).reduce((a, h) => a + h.tonnes, 0),
                }));
                return (<ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={tierData.filter(t => t.count > 0)} dataKey="tonnes" nameKey="tier" cx="50%" cy="50%" outerRadius={70} label={({ tier }) => tier}>
                    {tierData.map((_, i) => <Cell key={i} fill={['#16a34a', T.indigo, T.gold, T.red][i]} />)}
                  </Pie><Tooltip formatter={v => `${Number(v).toLocaleString()} tCO2e`} /></PieChart>
                </ResponsiveContainer>);
              })()}
            </div>
            <div style={card}>
              <div style={lbl}>Vintage Vintage Age Profile</div>
              {(() => {
                const ageData = Array.from({ length: 10 }, (_, i) => ({
                  age: `${i}yr`, count: globalFiltered.filter(h => 2024 - h.vintage === i).length,
                }));
                return (<ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ageData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="age" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip />
                    <Bar dataKey="count" name="Holdings" fill={T.navy} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>);
              })()}
            </div>
          </div>
        </div>)}

        {/* ═══ TAB 1: Holdings Deep-Dive ═══ */}
        {tab === 1 && (<div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search holdings or country..." style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, width: 220, fontFamily: font }} />
            <span style={{ fontSize: 10, color: T.sub }}>{sortedHoldings.length} results</span>
          </div>
          <div style={card}>
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.card }}>
                  {[{k:'name',l:'Credit'},{k:'projectType',l:'Type'},{k:'registry',l:'Registry'},{k:'vintage',l:'Vint'},{k:'tonnes',l:'Tonnes'},{k:'costBasis',l:'Cost'},{k:'currentPrice',l:'Spot'},{k:'mtm',l:'MTM'},{k:'pnl',l:'P&L'},{k:'qualityScore',l:'Quality'},{k:'bezeroRating',l:'BeZero'},{k:'country',l:'Country'},{k:'corsiaEligible',l:'CORSIA'},{k:'permanenceYrs',l:'Perm(yr)'}].map(c => (
                    <th key={c.k} onClick={() => handleSort(c.k)} style={{ textAlign: 'left', padding: '6px 3px', color: T.sub, cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}>
                      {c.l}{sortCol === c.k ? (sortDir === 'desc' ? ' v' : ' ^') : ''}
                    </th>
                  ))}
                </tr></thead>
                <tbody>{sortedHoldings.map((h, idx) => (
                  <React.Fragment key={h.id}>
                    <tr onClick={() => setExpandedRow(expandedRow === h.id ? null : h.id)} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: expandedRow === h.id ? T.indigo + '08' : idx % 2 === 0 ? T.card : T.surface }}>
                      <td style={{ padding: '4px 3px', fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                      <td style={{ padding: '4px 3px' }}>{h.projectType}</td>
                      <td style={{ padding: '4px 3px' }}>{h.registry}</td>
                      <td style={{ padding: '4px 3px', fontFamily: mono }}>{h.vintage}</td>
                      <td style={{ padding: '4px 3px', fontFamily: mono }}>{h.tonnes.toLocaleString()}</td>
                      <td style={{ padding: '4px 3px', fontFamily: mono }}>${h.costBasis.toFixed(2)}</td>
                      <td style={{ padding: '4px 3px', fontFamily: mono }}>${h.currentPrice.toFixed(2)}</td>
                      <td style={{ padding: '4px 3px', fontFamily: mono, fontWeight: 700 }}>{fmt(h.mtm)}</td>
                      <td style={{ padding: '4px 3px', fontFamily: mono, color: h.pnl >= 0 ? '#16a34a' : T.red }}>{h.pnl >= 0 ? '+' : ''}{fmt(Math.abs(h.pnl))}</td>
                      <td style={{ padding: '4px 3px' }}><span style={{ background: h.qualityScore >= 70 ? '#dcfce7' : h.qualityScore >= 50 ? '#fef9c3' : '#fee2e2', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>{h.qualityScore}</span></td>
                      <td style={{ padding: '4px 3px', fontWeight: 600, color: h.bezeroRating.startsWith('A') ? T.green : T.amber }}>{h.bezeroRating}</td>
                      <td style={{ padding: '4px 3px' }}>{h.country}</td>
                      <td style={{ padding: '4px 3px', color: h.corsiaEligible ? '#16a34a' : T.red }}>{h.corsiaEligible ? 'Yes' : 'No'}</td>
                      <td style={{ padding: '4px 3px', fontFamily: mono }}>{h.permanenceYrs.toLocaleString()}</td>
                    </tr>
                    {expandedRow === h.id && (
                      <tr><td colSpan={14} style={{ padding: 16, background: T.indigo + '06', borderBottom: `2px solid ${T.indigo}33` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 10 }}>
                          <div><strong>Verifier:</strong> {h.verifier}</div>
                          <div><strong>Buffer Pool:</strong> {h.bufferPct}%</div>
                          <div><strong>Reversal Risk:</strong> {h.reversalRisk}%</div>
                          <div><strong>Last Verified:</strong> {h.lastVerificationDate}</div>
                          <div><strong>Retired:</strong> {h.retired.toLocaleString()} tCO2e</div>
                          <div><strong>Scheduled:</strong> {h.scheduledRetire.toLocaleString()} tCO2e</div>
                          <div><strong>Unretired:</strong> {h.unretired.toLocaleString()} tCO2e</div>
                          <div><strong>Region:</strong> {h.region}</div>
                          <div style={{ gridColumn: 'span 4' }}>
                            <strong>SDG Alignment:</strong>{' '}
                            {h.sdgAligned.map(s => <span key={s} style={{ display: 'inline-block', background: T.indigo + '18', color: T.indigo, padding: '2px 8px', borderRadius: 4, marginRight: 4, fontSize: 9, fontWeight: 600 }}>SDG {s}</span>)}
                          </div>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>)}

        {/* ═══ TAB 2: P&L Attribution ═══ */}
        {tab === 2 && (<div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['1m', '3m', '6m', '12m', 'YTD'].map(p => (
              <button key={p} onClick={() => setAttrPeriod(p)} style={{
                padding: '4px 12px', borderRadius: 4, border: `1px solid ${attrPeriod === p ? T.indigo : T.border}`,
                background: attrPeriod === p ? T.indigo + '15' : 'transparent', color: attrPeriod === p ? T.indigo : T.sub,
                fontSize: 10, cursor: 'pointer', fontWeight: 600, fontFamily: font
              }}>{p}</button>
            ))}
          </div>
          {(() => {
            const waterfall = [
              { name: 'Cost Basis', val: gfCost, fill: T.sub },
              { name: 'Vintage Premium', val: Math.round(gfPnL * 0.25), fill: T.gold },
              { name: 'Quality Premium', val: Math.round(gfPnL * 0.15), fill: T.indigo },
              { name: 'Market Move', val: Math.round(gfPnL * 0.6), fill: gfPnL >= 0 ? '#16a34a' : T.red },
              { name: 'MTM Value', val: gfMTM, fill: T.navy },
            ];
            return (<>
              <div style={card}>
                <div style={lbl}>P&L Waterfall -- Cost Basis to MTM</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={waterfall}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={v => fmt(Number(v))} />
                    <Bar dataKey="val" name="Value">{waterfall.map((w, i) => <Cell key={i} fill={w.fill} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={card}>
                  <div style={lbl}>P&L by Methodology</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={typeAgg}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="type" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={50} /><YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                      <Tooltip formatter={v => fmt(Number(v))} /><Bar dataKey="pnl" name="P&L">{typeAgg.map((t, i) => <Cell key={i} fill={t.pnl >= 0 ? '#16a34a' : T.red} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={card}>
                  <div style={lbl}>P&L by Vintage</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={vintageData.filter(v => v.mtm > 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="vintage" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                      <Tooltip formatter={v => fmt(Number(v))} />
                      <Bar dataKey="mtm" name="MTM" fill={T.navy} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={card}>
                <div style={lbl}>Cumulative P&L (24 Months)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={PRICE_HISTORY.map((p, i) => ({ month: p.month, cumPnL: Math.round((p.avgPrice - PRICE_HISTORY[0].avgPrice) * gfTonnes) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="month" tick={{ fontSize: 8 }} /><YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={v => fmt(Number(v))} /><Area type="monotone" dataKey="cumPnL" stroke={T.indigo} fill={T.indigo + '20'} name="Cum. P&L" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Worst & Best Performers</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[{ title: 'Top 5 Gainers', data: [...globalFiltered].sort((a, b) => b.pnl - a.pnl).slice(0, 5), col: '#16a34a' },
                    { title: 'Top 5 Losers', data: [...globalFiltered].sort((a, b) => a.pnl - b.pnl).slice(0, 5), col: T.red }].map(sec => (
                    <div key={sec.title}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: sec.col, marginBottom: 6 }}>{sec.title}</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
                        <tbody>{sec.data.map(h => (
                          <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: '3px 4px', fontWeight: 600 }}>{h.name}</td>
                            <td style={{ padding: '3px 4px', fontFamily: mono, color: sec.col }}>{h.pnl >= 0 ? '+' : ''}{fmt(Math.abs(h.pnl))}</td>
                            <td style={{ padding: '3px 4px', fontFamily: mono, color: T.sub }}>{gfCost > 0 ? (h.pnl / h.costTotal * 100).toFixed(1) : '0.0'}%</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            </>);
          })()}
          <div style={card}>
            <div style={lbl}>P&L Decomposition by Methodology & Vintage</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Methodology', 'Holdings', 'Tonnes', 'Cost Basis', 'MTM', 'P&L', 'Return %', 'Contribution %'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 4px', color: T.sub, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{typeAgg.map((t, i) => (
                <tr key={t.type} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.surface }}>
                  <td style={{ padding: 4, fontWeight: 600 }}>{t.type}</td>
                  <td style={{ padding: 4, fontFamily: mono }}>{t.count}</td>
                  <td style={{ padding: 4, fontFamily: mono }}>{t.tonnes.toLocaleString()}</td>
                  <td style={{ padding: 4, fontFamily: mono }}>{fmt(t.cost)}</td>
                  <td style={{ padding: 4, fontFamily: mono, fontWeight: 700 }}>{fmt(t.mtm)}</td>
                  <td style={{ padding: 4, fontFamily: mono, color: t.pnl >= 0 ? '#16a34a' : T.red }}>{t.pnl >= 0 ? '+' : ''}{fmt(Math.abs(t.pnl))}</td>
                  <td style={{ padding: 4, fontFamily: mono, color: t.pnl >= 0 ? '#16a34a' : T.red }}>{t.cost > 0 ? (t.pnl / t.cost * 100).toFixed(1) : '0.0'}%</td>
                  <td style={{ padding: 4, fontFamily: mono }}>{gfPnL !== 0 ? (t.pnl / Math.abs(gfPnL) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
              ))}</tbody>
              <tfoot><tr style={{ borderTop: `2px solid ${T.navy}`, fontWeight: 700 }}>
                <td style={{ padding: 4 }}>Total</td>
                <td style={{ padding: 4, fontFamily: mono }}>{globalFiltered.length}</td>
                <td style={{ padding: 4, fontFamily: mono }}>{gfTonnes.toLocaleString()}</td>
                <td style={{ padding: 4, fontFamily: mono }}>{fmt(gfCost)}</td>
                <td style={{ padding: 4, fontFamily: mono }}>{fmt(gfMTM)}</td>
                <td style={{ padding: 4, fontFamily: mono, color: gfPnL >= 0 ? '#16a34a' : T.red }}>{gfPnL >= 0 ? '+' : ''}{fmt(Math.abs(gfPnL))}</td>
                <td style={{ padding: 4, fontFamily: mono }}>{gfCost > 0 ? (gfPnL / gfCost * 100).toFixed(1) : '0.0'}%</td>
                <td style={{ padding: 4, fontFamily: mono }}>100%</td>
              </tr></tfoot>
            </table>
          </div>
        </div>)}

        {/* ═══ TAB 3: Vintage & Maturity ═══ */}
        {tab === 3 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <Kpi label="Avg Vintage" value={(globalFiltered.length ? globalFiltered.reduce((a, h) => a + h.vintage, 0) / globalFiltered.length : 0).toFixed(1)} color={T.navy} />
            <Kpi label="Avg Age (yrs)" value={(globalFiltered.length ? (2024 - globalFiltered.reduce((a, h) => a + h.vintage, 0) / globalFiltered.length) : 0).toFixed(1)} color={T.indigo} />
            <Kpi label="Newest Vintage" value={globalFiltered.length ? Math.max(...globalFiltered.map(h => h.vintage)) : '-'} color={T.green} />
            <Kpi label="Oldest Vintage" value={globalFiltered.length ? Math.min(...globalFiltered.map(h => h.vintage)) : '-'} color={T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card}>
              <div style={lbl}>Holdings by Vintage Year (Stacked by Type)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={vintageData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="vintage" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmtT(v)} />
                  <Tooltip formatter={v => `${Number(v).toLocaleString()} tCO2e`} /><Legend wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="tonnes" name="Tonnes" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Vintage Decay Curve (Remaining Unretired)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={vintageData.map(v => {
                  const hs = globalFiltered.filter(h => h.vintage === v.vintage);
                  return { vintage: v.vintage, unretired: hs.reduce((a, h) => a + h.unretired, 0) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="vintage" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmtT(v)} /><Tooltip formatter={v => `${Number(v).toLocaleString()} tCO2e`} />
                  <Area type="monotone" dataKey="unretired" stroke={T.amber} fill={T.amber + '30'} name="Unretired" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Maturity Ladder -- Scheduled Retirements by Quarter</div>
            {(() => {
              const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'];
              const qData = quarters.map((q, i) => ({ quarter: q, scheduled: Math.round(totalScheduled / 8 * (0.7 + sr(i * 141 + 80) * 0.6)) }));
              return (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={qData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="quarter" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip />
                    <Bar dataKey="scheduled" name="Scheduled" fill={T.navy} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
          <div style={card}>
            <div style={lbl}>Vintage Concentration Risk</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
              {vintageData.map(v => {
                const share = gfTonnes > 0 ? v.tonnes / gfTonnes : 0;
                const intensity = Math.min(255, Math.round(share * 800));
                return (
                  <div key={v.vintage} style={{ padding: 8, borderRadius: 6, background: `rgba(79,70,229,${(intensity / 255).toFixed(2)})`, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: intensity > 120 ? '#fff' : T.text }}>{v.vintage}</div>
                    <div style={{ fontSize: 9, color: intensity > 120 ? '#ddd' : T.sub }}>{(share * 100).toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Vintage Cohort Analysis</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Vintage', 'Holdings', 'Tonnes', 'Avg Cost', 'Avg Spot', 'MTM', 'Retired %', 'Avg Quality'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 4px', color: T.sub, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{vintageData.filter(v => v.count > 0).map((v, i) => {
                const hs = globalFiltered.filter(h => h.vintage === v.vintage);
                const avgCost = hs.length ? hs.reduce((a, h) => a + h.costBasis, 0) / hs.length : 0;
                const avgSpot = hs.length ? hs.reduce((a, h) => a + h.currentPrice, 0) / hs.length : 0;
                const retiredPct = v.tonnes > 0 ? hs.reduce((a, h) => a + h.retired, 0) / v.tonnes * 100 : 0;
                const avgQ = hs.length ? hs.reduce((a, h) => a + h.qualityScore, 0) / hs.length : 0;
                return (
                  <tr key={v.vintage} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.surface }}>
                    <td style={{ padding: 4, fontWeight: 700, fontFamily: mono }}>{v.vintage}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>{v.count}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>{v.tonnes.toLocaleString()}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>${avgCost.toFixed(2)}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>${avgSpot.toFixed(2)}</td>
                    <td style={{ padding: 4, fontFamily: mono, fontWeight: 700 }}>{fmt(v.mtm)}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>{retiredPct.toFixed(1)}%</td>
                    <td style={{ padding: 4 }}><span style={{ background: avgQ >= 70 ? '#dcfce7' : avgQ >= 50 ? '#fef9c3' : '#fee2e2', padding: '2px 6px', borderRadius: 4, fontWeight: 600, fontSize: 9 }}>{avgQ.toFixed(0)}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <div style={card}>
            <div style={lbl}>Vintage MTM vs Cost Basis Comparison</div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={vintageData.filter(v => v.count > 0).map(v => {
                const hs = globalFiltered.filter(h => h.vintage === v.vintage);
                return { vintage: v.vintage, mtm: v.mtm, cost: hs.reduce((a, h) => a + h.costTotal, 0) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="vintage" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={v => fmt(Number(v))} /><Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="cost" name="Cost Basis" fill={T.sub + '60'} />
                <Bar dataKey="mtm" name="MTM Value" fill={T.indigo} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {/* ═══ TAB 4: Retirement Tracker ═══ */}
        {tab === 4 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <Kpi label="Total Retired" value={fmtT(gfRetired)} color={T.green} sub="tCO2e" />
            <Kpi label="Scheduled" value={fmtT(globalFiltered.reduce((a, h) => a + h.scheduledRetire, 0))} color={T.indigo} sub="pending" />
            <Kpi label="Surplus/Deficit" value={`${(gfRetired - RETIREMENT_SCHEDULE.slice(0, 12).reduce((a, r) => a + r.planned, 0) >= 0 ? '+' : '')}${fmtT(Math.abs(gfRetired - RETIREMENT_SCHEDULE.slice(0, 12).reduce((a, r) => a + r.planned, 0)))}`} color={T.navy} />
            <Kpi label="Retire Pace" value={`${retireWhatIf}%`} color={T.amber} sub="what-if slider" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 10, color: T.sub }}>Retirement Pace What-If:</span>
            <input type="range" min={50} max={200} value={retireWhatIf} onChange={e => setRetireWhatIf(+e.target.value)} style={{ width: 200 }} />
            <span style={{ fontSize: 11, fontFamily: mono, fontWeight: 600 }}>{retireWhatIf}%</span>
          </div>
          <div style={card}>
            <div style={lbl}>Planned vs Actual Retirements (Monthly)</div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={RETIREMENT_SCHEDULE.map(r => ({ ...r, adjPlanned: Math.round(r.planned * retireWhatIf / 100) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 8 }} /><YAxis tick={{ fontSize: 9 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="adjPlanned" name="Planned (adjusted)" fill={T.indigo + '60'} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke={T.green} strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card}>
              <div style={lbl}>Retirement by Program</div>
              {(() => {
                const programs = [{ name: 'CORSIA', val: Math.round(gfRetired * 0.35) }, { name: 'SBTi', val: Math.round(gfRetired * 0.25) }, { name: 'Voluntary', val: Math.round(gfRetired * 0.3) }, { name: 'Compliance', val: Math.round(gfRetired * 0.1) }];
                return (<ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={programs} dataKey="val" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                    {programs.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>);
              })()}
            </div>
            <div style={card}>
              <div style={lbl}>Cumulative Retirement Trajectory</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={RETIREMENT_SCHEDULE}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 8 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} />
                  <Line type="monotone" dataKey="cumPlanned" stroke={T.indigo} strokeDasharray="5 3" name="Cum Planned" />
                  <Line type="monotone" dataKey="cumActual" stroke={T.green} strokeWidth={2} name="Cum Actual" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Retirement Schedule Detail</div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.card }}>
                  {['Month', 'Planned', 'Actual', 'Variance', 'Status', 'Cumulative'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 4px', color: T.sub }}>{h}</th>)}
                </tr></thead>
                <tbody>{RETIREMENT_SCHEDULE.map((r, i) => {
                  const variance = r.actual - Math.round(r.planned * retireWhatIf / 100);
                  const status = variance >= 0 ? 'Ahead' : variance > -500 ? 'On Track' : 'Behind';
                  const statusColor = status === 'Ahead' ? '#16a34a' : status === 'On Track' ? T.amber : T.red;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 4, fontFamily: mono }}>{r.month}</td>
                      <td style={{ padding: 4, fontFamily: mono }}>{Math.round(r.planned * retireWhatIf / 100).toLocaleString()}</td>
                      <td style={{ padding: 4, fontFamily: mono }}>{r.actual.toLocaleString()}</td>
                      <td style={{ padding: 4, fontFamily: mono, color: variance >= 0 ? '#16a34a' : T.red }}>{variance >= 0 ? '+' : ''}{variance.toLocaleString()}</td>
                      <td style={{ padding: 4 }}><span style={{ background: statusColor + '18', color: statusColor, padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>{status}</span></td>
                      <td style={{ padding: 4, fontFamily: mono }}>{r.cumActual.toLocaleString()}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        </div>)}

        {/* ═══ TAB 5: Performance vs Benchmark ═══ */}
        {tab === 5 && (<div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <select value={benchSel} onChange={e => setBenchSel(e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, fontFamily: font }}>
              <option>VCM Index</option><option>CBL GEO</option><option>S&P GSCI Carbon</option>
            </select>
            {['3m', '6m', '12m'].map(w => (
              <button key={w} onClick={() => setRollingWindow(w)} style={{
                padding: '4px 10px', borderRadius: 4, border: `1px solid ${rollingWindow === w ? T.indigo : T.border}`,
                background: rollingWindow === w ? T.indigo + '15' : 'transparent', color: rollingWindow === w ? T.indigo : T.sub,
                fontSize: 10, cursor: 'pointer', fontWeight: 600, fontFamily: font
              }}>{w} rolling</button>
            ))}
          </div>
          {(() => {
            const wm = rollingWindow === '3m' ? 3 : rollingWindow === '6m' ? 6 : 12;
            const rollingAlpha = perfData.slice(wm).map((d, i) => ({
              month: d.month,
              alpha: Math.round((d.portReturn - d.benchReturn - (perfData[i].portReturn - perfData[i].benchReturn)) * 100) / 100
            }));
            const trackErr = rollingAlpha.length ? Math.sqrt(rollingAlpha.reduce((a, d) => a + d.alpha * d.alpha, 0) / rollingAlpha.length) : 0;
            const infoRatio = trackErr > 0 ? (perfData[perfData.length - 1].alpha / trackErr) : 0;
            const returns = perfData.map((d, i) => i === 0 ? 0 : d.portReturn - perfData[i - 1].portReturn);
            const avgRet = returns.length ? returns.reduce((a, v) => a + v, 0) / returns.length : 0;
            const stdDev = Math.sqrt(returns.length ? returns.reduce((a, v) => a + (v - avgRet) * (v - avgRet), 0) / returns.length : 0);
            const sharpe = stdDev > 0 ? (avgRet / stdDev * Math.sqrt(12)) : 0;
            let maxDD = 0, peak = 0;
            perfData.forEach(d => { if (d.portReturn > peak) peak = d.portReturn; const dd = peak - d.portReturn; if (dd > maxDD) maxDD = dd; });

            return (<>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <Kpi label="Total Alpha" value={`${perfData[perfData.length - 1].alpha.toFixed(2)}%`} color={perfData[perfData.length - 1].alpha >= 0 ? '#16a34a' : T.red} />
                <Kpi label="Tracking Error" value={`${trackErr.toFixed(2)}%`} color={T.indigo} />
                <Kpi label="Info Ratio" value={infoRatio.toFixed(2)} color={T.navy} />
                <Kpi label="Sharpe Ratio" value={sharpe.toFixed(2)} color={T.gold} sub={`Max DD: ${maxDD.toFixed(2)}%`} />
              </div>
              <div style={card}>
                <div style={lbl}>Portfolio vs {benchSel} -- Cumulative Return</div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={perfData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 8 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} />
                    <Line type="monotone" dataKey="portReturn" stroke={T.indigo} strokeWidth={2} name="Portfolio" dot={false} />
                    <Line type="monotone" dataKey="benchReturn" stroke={T.sub} strokeWidth={2} strokeDasharray="5 3" name={benchSel} dot={false} />
                    <ReferenceLine y={0} stroke={T.border} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Rolling {rollingWindow} Alpha</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={rollingAlpha}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 8 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><ReferenceLine y={0} stroke={T.border} />
                    <Bar dataKey="alpha" name="Alpha">{rollingAlpha.map((d, i) => <Cell key={i} fill={d.alpha >= 0 ? '#16a34a' : T.red} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Attribution by Factor</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[{ factor: 'Methodology', contrib: (perfData[perfData.length - 1].alpha * 0.35).toFixed(2) },
                    { factor: 'Vintage', contrib: (perfData[perfData.length - 1].alpha * 0.2).toFixed(2) },
                    { factor: 'Geography', contrib: (perfData[perfData.length - 1].alpha * 0.25).toFixed(2) },
                    { factor: 'Quality', contrib: (perfData[perfData.length - 1].alpha * 0.2).toFixed(2) }].map(f => (
                    <div key={f.factor} style={{ ...kpiBox, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: T.sub }}>{f.factor}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: mono, color: Number(f.contrib) >= 0 ? '#16a34a' : T.red }}>{Number(f.contrib) >= 0 ? '+' : ''}{f.contrib}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </>);
          })()}
          <div style={card}>
            <div style={lbl}>Monthly Return Distribution</div>
            {(() => {
              const monthlyReturns = perfData.slice(1).map((d, i) => ({
                month: d.month,
                return: Math.round((d.portReturn - perfData[i].portReturn) * 100) / 100,
              }));
              return (<ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyReturns}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 7 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip />
                  <ReferenceLine y={0} stroke={T.border} />
                  <Bar dataKey="return" name="Monthly Return %">{monthlyReturns.map((d, i) => <Cell key={i} fill={d.return >= 0 ? '#16a34a' : T.red} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>);
            })()}
          </div>
          <div style={card}>
            <div style={lbl}>Risk-Return Summary by Methodology</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {typeAgg.slice(0, 6).map((t, i) => {
                const retPct = t.cost > 0 ? (t.pnl / t.cost * 100) : 0;
                const volatility = Math.round(5 + sr(i * 173 + 95) * 20);
                const riskAdj = volatility > 0 ? (retPct / volatility).toFixed(2) : '0.00';
                return (
                  <div key={t.type} style={{ ...kpiBox, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.text }}>{t.type}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 6 }}>
                      <div><div style={{ fontSize: 8, color: T.sub }}>Return</div><div style={{ fontSize: 12, fontFamily: mono, fontWeight: 700, color: retPct >= 0 ? '#16a34a' : T.red }}>{retPct.toFixed(1)}%</div></div>
                      <div><div style={{ fontSize: 8, color: T.sub }}>Vol</div><div style={{ fontSize: 12, fontFamily: mono, fontWeight: 700, color: T.text }}>{volatility}%</div></div>
                      <div><div style={{ fontSize: 8, color: T.sub }}>Risk-Adj</div><div style={{ fontSize: 12, fontFamily: mono, fontWeight: 700, color: T.indigo }}>{riskAdj}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>)}

        {/* ═══ TAB 6: Quality & Risk Analytics ═══ */}
        {tab === 6 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card}>
              <div style={lbl}>Portfolio Quality Dimensions</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={qualityRadar}>
                  <PolarGrid /><PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="Quality" dataKey="val" stroke={T.indigo} fill={T.indigo + '30'} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>BeZero Rating Distribution</div>
              {(() => {
                const dist = BEZERO.map(r => ({ rating: r, count: globalFiltered.filter(h => h.bezeroRating === r).length })).filter(d => d.count > 0);
                return (<ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dist}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="rating" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip />
                    <Bar dataKey="count" name="Holdings">{dist.map((d, i) => <Cell key={i} fill={d.rating.startsWith('A') ? '#16a34a' : d.rating.startsWith('B') ? T.gold : T.red} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>);
              })()}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card}>
              <div style={lbl}>Reversal Risk vs Permanence</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="permanenceYrs" name="Permanence (yrs)" tick={{ fontSize: 9 }} scale="log" domain={['auto', 'auto']} />
                  <YAxis dataKey="reversalRisk" name="Reversal Risk (%)" tick={{ fontSize: 9 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [typeof v === 'number' ? v.toFixed(1) : v, n]} />
                  <Scatter name="Holdings" data={globalFiltered.map(h => ({ permanenceYrs: h.permanenceYrs, reversalRisk: h.reversalRisk, name: h.name }))} fill={T.indigo}>
                    {globalFiltered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Quality Score Distribution</div>
              {(() => {
                const bins = [{ range: '40-50', min: 40, max: 50 }, { range: '50-60', min: 50, max: 60 }, { range: '60-70', min: 60, max: 70 }, { range: '70-80', min: 70, max: 80 }, { range: '80-90', min: 80, max: 90 }, { range: '90-100', min: 90, max: 101 }];
                const histo = bins.map(b => ({ range: b.range, count: globalFiltered.filter(h => h.qualityScore >= b.min && h.qualityScore < b.max).length }));
                return (<ResponsiveContainer width="100%" height={280}>
                  <BarChart data={histo}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip />
                    <Bar dataKey="count" name="Holdings" fill={T.navy} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>);
              })()}
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Buffer Pool Adequacy & Risk Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Kpi label="Avg Buffer Pool" value={`${(globalFiltered.length ? globalFiltered.reduce((a, h) => a + h.bufferPct, 0) / globalFiltered.length : 0).toFixed(1)}%`} color={T.indigo} />
              <Kpi label="Avg Reversal Risk" value={`${(globalFiltered.length ? globalFiltered.reduce((a, h) => a + h.reversalRisk, 0) / globalFiltered.length : 0).toFixed(1)}%`} color={T.red} />
              <Kpi label="Avg Permanence" value={`${(globalFiltered.length ? globalFiltered.reduce((a, h) => a + h.permanenceYrs, 0) / globalFiltered.length : 0).toFixed(0)} yrs`} color={T.green} />
              <Kpi label="CORSIA Eligible" value={`${pct(globalFiltered.filter(h => h.corsiaEligible).length, globalFiltered.length)}%`} color={T.gold} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card}>
              <div style={lbl}>Methodology Risk Benchmarks</div>
              <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Methodology', 'Avg Price', 'Vol Growth', 'Supply Risk'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '5px 4px', color: T.sub, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{METHOD_BENCHMARKS.map((m, i) => (
                    <tr key={m.type} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.surface }}>
                      <td style={{ padding: '4px', fontWeight: 600 }}>{m.type}</td>
                      <td style={{ padding: 4, fontFamily: mono }}>${m.avgPrice}</td>
                      <td style={{ padding: 4, fontFamily: mono, color: m.volumeGrowth >= 0 ? '#16a34a' : T.red }}>{m.volumeGrowth >= 0 ? '+' : ''}{m.volumeGrowth}%</td>
                      <td style={{ padding: 4 }}><span style={{
                        background: m.supplyRisk === 'High' ? '#fee2e2' : m.supplyRisk === 'Medium' ? '#fef9c3' : '#dcfce7',
                        color: m.supplyRisk === 'High' ? T.red : m.supplyRisk === 'Medium' ? T.amber : T.green,
                        padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600
                      }}>{m.supplyRisk}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <div style={card}>
              <div style={lbl}>Counterparty Exposure</div>
              <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Counterparty', 'Type', 'Rating', 'Exposure'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '5px 4px', color: T.sub, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{COUNTERPARTIES.filter(c => c.exposureTonnes > 0).map((c, i) => (
                    <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.surface }}>
                      <td style={{ padding: '4px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: 4 }}>{c.type}</td>
                      <td style={{ padding: 4, fontFamily: mono, fontWeight: 600 }}>{c.creditRating}</td>
                      <td style={{ padding: 4, fontFamily: mono }}>{fmt(c.exposureValue)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Quality Tier Summary & Investment Guidance</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {QUALITY_TIERS.map((tier, i) => {
                const hs = globalFiltered.filter(h => h.qualityScore >= tier.min && h.qualityScore <= tier.max);
                const tierMTM = hs.reduce((a, h) => a + h.mtm, 0);
                const tierColors = ['#16a34a', T.indigo, T.gold, T.red];
                return (
                  <div key={tier.tier} style={{ background: tierColors[i] + '08', borderRadius: 8, padding: 14, border: `1px solid ${tierColors[i]}33` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: tierColors[i] }}>{tier.tier}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: mono, color: T.text, marginTop: 4 }}>{hs.length} holdings</div>
                    <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{fmt(tierMTM)} MTM</div>
                    <div style={{ fontSize: 9, color: T.sub, marginTop: 6, lineHeight: 1.4 }}>{tier.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>)}

        {/* ═══ TAB 7: Geographic Exposure ═══ */}
        {tab === 7 && (<div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['political', 'deforestation', 'fire'].map(o => (
              <button key={o} onClick={() => setRiskOverlay(o)} style={{
                padding: '4px 12px', borderRadius: 4, border: `1px solid ${riskOverlay === o ? T.indigo : T.border}`,
                background: riskOverlay === o ? T.indigo + '15' : 'transparent', color: riskOverlay === o ? T.indigo : T.sub,
                fontSize: 10, cursor: 'pointer', fontWeight: 600, fontFamily: font, textTransform: 'capitalize'
              }}>{o} Risk Overlay</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <Kpi label="Countries" value={geoData.length} color={T.navy} />
            <Kpi label="Top Country" value={geoData.length ? geoData[0].country : '-'} color={T.gold} sub={geoData.length ? `${fmt(geoData[0].mtm)}` : ''} />
            <Kpi label="Geo Diversification" value={geoData.length > 15 ? 'High' : geoData.length > 8 ? 'Medium' : 'Low'} color={geoData.length > 15 ? T.green : T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card}>
              <div style={lbl}>Holdings by Country (Top 15 MTM)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={geoData.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                  <YAxis dataKey="country" type="category" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip formatter={v => fmt(Number(v))} /><Bar dataKey="mtm" fill={T.navy} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Regional Concentration (MTM)</div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart><Pie data={regionAgg} dataKey="mtm" nameKey="region" cx="50%" cy="50%" outerRadius={110} label={({ region }) => region}>
                  {regionAgg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip formatter={v => fmt(Number(v))} /></PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Top 10 Countries with {riskOverlay} Risk</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Country', 'Region', 'MTM', 'Tonnes', 'Holdings', 'Political Risk', 'Deforest Risk', 'Fire Risk'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 4px', color: T.sub, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{geoData.slice(0, 10).map((c, i) => (
                <tr key={c.country} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.surface }}>
                  <td style={{ padding: 4, fontWeight: 600 }}>{c.country}</td>
                  <td style={{ padding: 4 }}>{c.region}</td>
                  <td style={{ padding: 4, fontFamily: mono }}>{fmt(c.mtm)}</td>
                  <td style={{ padding: 4, fontFamily: mono }}>{c.tonnes.toLocaleString()}</td>
                  <td style={{ padding: 4, fontFamily: mono }}>{c.count}</td>
                  {['politicalRisk', 'deforestRisk', 'fireRisk'].map(rk => (
                    <td key={rk} style={{ padding: 4 }}>
                      <span style={{ background: c[rk] > 60 ? '#fee2e2' : c[rk] > 30 ? '#fef9c3' : '#dcfce7', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, color: c[rk] > 60 ? T.red : c[rk] > 30 ? T.amber : T.green }}>{c[rk]}</span>
                    </td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={card}>
            <div style={lbl}>Geographic Diversification Score</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {regionAgg.map((r, i) => {
                const share = gfMTM > 0 ? r.mtm / gfMTM * 100 : 0;
                return (
                  <div key={r.region} style={{ textAlign: 'center', padding: 12, background: COLORS[i % COLORS.length] + '10', borderRadius: 8, border: `1px solid ${COLORS[i % COLORS.length]}30` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{r.region}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: mono, color: COLORS[i % COLORS.length], marginTop: 4 }}>{share.toFixed(1)}%</div>
                    <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>{fmtT(r.tonnes)} tCO2e</div>
                    <div style={{ fontSize: 9, color: T.sub }}>{fmt(r.mtm)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Country Risk Heatmap ({riskOverlay})</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {geoData.slice(0, 20).map(c => {
                const riskVal = riskOverlay === 'political' ? c.politicalRisk : riskOverlay === 'deforestation' ? c.deforestRisk : c.fireRisk;
                const intensity = Math.min(1, riskVal / 80);
                return (
                  <div key={c.country} style={{ padding: 8, borderRadius: 6, background: `rgba(153,27,27,${intensity.toFixed(2)})`, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: intensity > 0.5 ? '#fff' : T.text }}>{c.country}</div>
                    <div style={{ fontSize: 8, color: intensity > 0.5 ? '#ddd' : T.sub }}>{riskVal}/100</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>)}

        {/* ═══ TAB 8: Transaction Ledger ═══ */}
        {tab === 8 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <Kpi label="Total Transactions" value={TRANSACTION_LOG.length} color={T.navy} />
            <Kpi label="Buy Volume" value={fmtT(TRANSACTION_LOG.filter(t => t.type === 'buy').reduce((a, t) => a + t.tonnes, 0))} color={T.green} sub="tCO2e" />
            <Kpi label="Sell Volume" value={fmtT(TRANSACTION_LOG.filter(t => t.type === 'sell').reduce((a, t) => a + t.tonnes, 0))} color={T.red} sub="tCO2e" />
            <Kpi label="Retirements" value={fmtT(TRANSACTION_LOG.filter(t => t.type === 'retire').reduce((a, t) => a + t.tonnes, 0))} color={T.indigo} sub="tCO2e" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card}>
              <div style={lbl}>Transaction Volume by Month</div>
              {(() => {
                const months = [...new Set(TRANSACTION_LOG.map(t => t.date.slice(0, 7)))].sort();
                const volData = months.map(m => ({ month: m, volume: TRANSACTION_LOG.filter(t => t.date.startsWith(m)).reduce((a, t) => a + t.tonnes, 0) }));
                return (<ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={volData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 8 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip />
                    <Area type="monotone" dataKey="volume" stroke={T.indigo} fill={T.indigo + '25'} name="Volume" />
                  </AreaChart>
                </ResponsiveContainer>);
              })()}
            </div>
            <div style={card}>
              <div style={lbl}>Buy vs Sell Flow</div>
              {(() => {
                const months = [...new Set(TRANSACTION_LOG.map(t => t.date.slice(0, 7)))].sort();
                const flowData = months.map(m => ({
                  month: m,
                  buy: TRANSACTION_LOG.filter(t => t.date.startsWith(m) && t.type === 'buy').reduce((a, t) => a + t.tonnes, 0),
                  sell: -TRANSACTION_LOG.filter(t => t.date.startsWith(m) && t.type === 'sell').reduce((a, t) => a + t.tonnes, 0),
                  retire: TRANSACTION_LOG.filter(t => t.date.startsWith(m) && t.type === 'retire').reduce((a, t) => a + t.tonnes, 0),
                }));
                return (<ResponsiveContainer width="100%" height={220}>
                  <BarChart data={flowData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 8 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Bar dataKey="buy" name="Buy" fill="#16a34a" stackId="a" />
                    <Bar dataKey="sell" name="Sell" fill={T.red} stackId="a" />
                    <Bar dataKey="retire" name="Retire" fill={T.indigo} stackId="b" />
                  </BarChart>
                </ResponsiveContainer>);
              })()}
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Transaction Ledger</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['date', 'type', 'tonnes', 'price'].map(s => (
                <button key={s} onClick={() => setTxSort(s)} style={{
                  padding: '3px 10px', borderRadius: 4, border: `1px solid ${txSort === s ? T.indigo : T.border}`,
                  background: txSort === s ? T.indigo + '15' : 'transparent', color: txSort === s ? T.indigo : T.sub,
                  fontSize: 9, cursor: 'pointer', fontWeight: 600, fontFamily: font, textTransform: 'capitalize'
                }}>Sort: {s}</button>
              ))}
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.card }}>
                  {['Date', 'Type', 'Holding', 'Tonnes', 'Price', 'Value', 'Counterparty', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 4px', color: T.sub, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{[...TRANSACTION_LOG].sort((a, b) => {
                  if (txSort === 'date') return b.date.localeCompare(a.date);
                  if (txSort === 'type') return a.type.localeCompare(b.type);
                  if (txSort === 'tonnes') return b.tonnes - a.tonnes;
                  return b.price - a.price;
                }).map((tx, i) => (
                  <tr key={tx.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.surface }}>
                    <td style={{ padding: 4, fontFamily: mono, fontSize: 9 }}>{tx.date}</td>
                    <td style={{ padding: 4 }}><span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                      background: tx.type === 'buy' ? '#dcfce7' : tx.type === 'sell' ? '#fee2e2' : tx.type === 'retire' ? '#e0e7ff' : '#fef9c3',
                      color: tx.type === 'buy' ? T.green : tx.type === 'sell' ? T.red : tx.type === 'retire' ? T.indigo : T.amber
                    }}>{tx.type.toUpperCase()}</span></td>
                    <td style={{ padding: 4, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.holding}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>{tx.tonnes.toLocaleString()}</td>
                    <td style={{ padding: 4, fontFamily: mono }}>${tx.price.toFixed(2)}</td>
                    <td style={{ padding: 4, fontFamily: mono, fontWeight: 600 }}>{fmt(tx.tonnes * tx.price)}</td>
                    <td style={{ padding: 4, fontSize: 9 }}>{tx.counterparty}</td>
                    <td style={{ padding: 4 }}><span style={{
                      padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                      background: tx.status === 'settled' ? '#dcfce7' : '#fef9c3',
                      color: tx.status === 'settled' ? T.green : T.amber
                    }}>{tx.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Cost Basis Impact Analysis</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
              {(() => {
                const buys = TRANSACTION_LOG.filter(t => t.type === 'buy');
                const sells = TRANSACTION_LOG.filter(t => t.type === 'sell');
                const avgBuyPrice = buys.length ? buys.reduce((a, t) => a + t.price * t.tonnes, 0) / buys.reduce((a, t) => a + t.tonnes, 0) : 0;
                const avgSellPrice = sells.length ? sells.reduce((a, t) => a + t.price * t.tonnes, 0) / sells.reduce((a, t) => a + t.tonnes, 0) : 0;
                const totalBuyValue = buys.reduce((a, t) => a + t.price * t.tonnes, 0);
                const totalSellValue = sells.reduce((a, t) => a + t.price * t.tonnes, 0);
                return (<>
                  <Kpi label="Avg Buy Price" value={`$${avgBuyPrice.toFixed(2)}`} color={T.green} sub="per tCO2e" />
                  <Kpi label="Avg Sell Price" value={`$${avgSellPrice.toFixed(2)}`} color={T.red} sub="per tCO2e" />
                  <Kpi label="Total Invested" value={fmt(totalBuyValue)} color={T.navy} sub="buy value" />
                  <Kpi label="Total Proceeds" value={fmt(totalSellValue)} color={T.gold} sub="sell value" />
                </>);
              })()}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={TRANSACTION_LOG.filter(t => t.type === 'buy' || t.type === 'sell').slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="date" tick={{ fontSize: 8 }} /><YAxis tick={{ fontSize: 9 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="tonnes" name="Volume" fill={T.indigo + '40'} />
                <Line type="monotone" dataKey="price" name="Price" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {/* ═══ TAB 9: Compliance & Reporting ═══ */}
        {tab === 9 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {(() => {
              const corsiaCount = globalFiltered.filter(h => h.corsiaEligible).length;
              const corsiaTonnes = globalFiltered.filter(h => h.corsiaEligible).reduce((a, h) => a + h.tonnes, 0);
              const sbtiCov = globalFiltered.filter(h => h.qualityScore >= 70).reduce((a, h) => a + h.tonnes, 0);
              const offsetCov = emissionsInput > 0 ? Math.min(100, gfRetired / emissionsInput * 100) : 0;
              return (<>
                <Kpi label="CORSIA Eligible" value={`${corsiaCount}/${globalFiltered.length}`} color={T.green} sub={`${fmtT(corsiaTonnes)} tCO2e`} />
                <Kpi label="SBTi Acceptance" value={`${pct(sbtiCov, gfTonnes)}%`} color={T.indigo} sub="quality >= 70" />
                <Kpi label="Offset Coverage" value={`${offsetCov.toFixed(1)}%`} color={T.gold} sub={`of ${fmtT(emissionsInput)} tCO2e emissions`} />
                <Kpi label="Retired Certificates" value={gfRetired.toLocaleString()} color={T.navy} sub="verified retirements" />
              </>);
            })()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 10, color: T.sub }}>Scope 1/2/3 Emissions (tCO2e):</span>
            <input type="range" min={5000} max={200000} step={1000} value={emissionsInput} onChange={e => setEmissionsInput(+e.target.value)} style={{ width: 250 }} />
            <span style={{ fontSize: 11, fontFamily: mono, fontWeight: 600 }}>{emissionsInput.toLocaleString()}</span>
            <span style={{ fontSize: 10, color: T.sub, marginLeft: 8 }}>Offset Coverage: <strong>{emissionsInput > 0 ? (gfRetired / emissionsInput * 100).toFixed(1) : '0.0'}%</strong></span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card}>
              <div style={lbl}>CORSIA Eligible vs Non-Eligible</div>
              {(() => {
                const split = [
                  { name: 'CORSIA Eligible', val: globalFiltered.filter(h => h.corsiaEligible).reduce((a, h) => a + h.tonnes, 0) },
                  { name: 'Non-Eligible', val: globalFiltered.filter(h => !h.corsiaEligible).reduce((a, h) => a + h.tonnes, 0) },
                ];
                return (<ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={split} dataKey="val" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    <Cell fill="#16a34a" /><Cell fill={T.sub} />
                  </Pie><Tooltip formatter={v => `${Number(v).toLocaleString()} tCO2e`} /></PieChart>
                </ResponsiveContainer>);
              })()}
            </div>
            <div style={card}>
              <div style={lbl}>Offset Coverage Calculator</div>
              {(() => {
                const cov = emissionsInput > 0 ? Math.min(100, gfRetired / emissionsInput * 100) : 0;
                const data = [
                  { name: 'Scope 1', emissions: Math.round(emissionsInput * 0.3), offset: Math.round(gfRetired * 0.4) },
                  { name: 'Scope 2', emissions: Math.round(emissionsInput * 0.25), offset: Math.round(gfRetired * 0.35) },
                  { name: 'Scope 3', emissions: Math.round(emissionsInput * 0.45), offset: Math.round(gfRetired * 0.25) },
                ];
                return (<ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="emissions" name="Emissions" fill={T.red + '80'} />
                    <Bar dataKey="offset" name="Offsets Applied" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>);
              })()}
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Regulatory Reporting Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { fw: 'CORSIA', status: globalFiltered.filter(h => h.corsiaEligible).length > globalFiltered.length * 0.5 ? 'Compliant' : 'Partial', detail: `${pct(globalFiltered.filter(h => h.corsiaEligible).reduce((a, h) => a + h.tonnes, 0), gfTonnes)}% eligible`, color: '#16a34a' },
                { fw: 'SBTi Net-Zero', status: 'Review', detail: `Offsets at ${pct(gfRetired, emissionsInput)}% of emissions (limit 10%)`, color: T.amber },
                { fw: 'CSRD ESRS E1', status: 'Prepared', detail: 'Gross vs net emissions disclosure ready', color: T.indigo },
                { fw: 'SFDR Article 9', status: 'Compliant', detail: `Offset dependency: ${pct(gfRetired, gfTonnes)}% retired`, color: '#16a34a' },
                { fw: 'ISSB S2', status: 'Partial', detail: 'Transition plan offset disclosure drafted', color: T.amber },
                { fw: 'TCFD', status: 'Compliant', detail: 'Strategy & metrics offset reporting included', color: '#16a34a' },
              ].map(c => (
                <div key={c.fw} style={{ background: c.color + '08', borderRadius: 8, padding: 14, border: `1px solid ${c.color}33` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{c.fw}</div>
                  <div style={{ fontSize: 10, color: c.color, fontWeight: 600, marginTop: 4 }}>{c.status}</div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>{c.detail}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Retirement Certificates (Recent)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Certificate ID', 'Holding', 'Registry', 'Tonnes', 'Retirement Date', 'Beneficiary', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 4px', color: T.sub, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{globalFiltered.filter(h => h.retired > 0).slice(0, 12).map((h, i) => (
                <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.surface }}>
                  <td style={{ padding: 4, fontFamily: mono, fontSize: 9 }}>RC-{String(h.id).padStart(4, '0')}-{h.vintage}</td>
                  <td style={{ padding: 4, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                  <td style={{ padding: 4 }}>{h.registry}</td>
                  <td style={{ padding: 4, fontFamily: mono }}>{h.retired.toLocaleString()}</td>
                  <td style={{ padding: 4, fontFamily: mono, fontSize: 9 }}>{h.lastVerificationDate}</td>
                  <td style={{ padding: 4, fontSize: 9 }}>Corporate Entity</td>
                  <td style={{ padding: 4 }}><span style={{ background: '#dcfce7', color: T.green, padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>Verified</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ ...card, background: T.navy + '06', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 4 }}>Compliance Notes</div>
            <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.7 }}>
              SBTi Net-Zero Standard limits offset use to residual emissions only (&lt;10% of base year). SFDR Article 9 funds must disclose offset dependency ratio.
              CSRD ESRS E1-6 requires separate gross vs net emissions reporting with offset details. CORSIA eligible offsets must meet TAB criteria with Article 6 alignment.
              ISSB S2 requires transition plan disclosure including role of carbon credits. All retirement certificates are registry-verified and immutable.
            </div>
          </div>
        </div>)}


        {/* ── Footer Summary ── */}
        <div style={{ marginTop: 16, padding: '12px 0', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: T.sub }}>
            Portfolio: {globalFiltered.length} holdings -- {fmtT(gfTonnes)} tCO2e -- {fmt(gfMTM)} MTM -- Quality: {gfWtdQ.toFixed(0)}/100
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { /* export stub */ }} style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 9, fontFamily: font }}>Export PDF</button>
            <button onClick={() => { /* export stub */ }} style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 9, fontFamily: font }}>Export CSV</button>
            <button onClick={() => { /* export stub */ }} style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${T.green}`, background: T.green + '10', color: T.green, cursor: 'pointer', fontSize: 9, fontFamily: font }}>Registry API</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OffsetPortfolioTrackerPage;
