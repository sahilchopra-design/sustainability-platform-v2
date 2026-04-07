import React, { useState, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend, PieChart, Pie,
} from 'recharts';
import { EMISSION_FACTORS, SECTOR_BENCHMARKS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Scope 3 upstream category definitions ─────────────────────────────────── */
const CATEGORIES = [
  { id:1, name:'Purchased Goods & Services', short:'Cat 1', color:'#0ea5e9', avgShare:0.42 },
  { id:2, name:'Capital Goods',              short:'Cat 2', color:'#8b5cf6', avgShare:0.08 },
  { id:3, name:'Fuel & Energy Activities',   short:'Cat 3', color:'#f59e0b', avgShare:0.12 },
  { id:4, name:'Upstream Transportation',    short:'Cat 4', color:'#10b981', avgShare:0.09 },
  { id:5, name:'Waste Generated',            short:'Cat 5', color:'#ef4444', avgShare:0.04 },
  { id:6, name:'Business Travel',            short:'Cat 6', color:'#ec4899', avgShare:0.06 },
  { id:7, name:'Employee Commuting',         short:'Cat 7', color:'#06b6d4', avgShare:0.05 },
  { id:8, name:'Leased Assets',              short:'Cat 8', color:'#a78bfa', avgShare:0.14 },
];

const SECTORS = [
  'Energy','Materials','Industrials','Consumer Discretionary','Consumer Staples',
  'Health Care','Financials','Information Technology','Communication Services',
  'Utilities','Real Estate','Automobiles','Chemicals','Mining','Transportation',
];

const COUNTRIES = ['US','GB','DE','FR','JP','CN','AU','BR','IN','KR','CA','NL','CH','SE','SG','MX','ZA','NO','TW','IT'];

const METHODOLOGIES = ['Spend-based','Activity-based','Supplier-specific'];

const ENGAGEMENT_STAGES = ['Identified','Contacted','Data Shared','Target Set','Reducing','Verified'];

/* ── 120 companies ──────────────────────────────────────────────────────────── */
const COMPANY_NAMES = [
  'Apple Inc','Microsoft Corp','Shell plc','TotalEnergies SE','BASF SE','BHP Group','Vale S.A.','Nippon Steel','Rio Tinto','Glencore plc',
  'Anglo American','ArcelorMittal','Thyssenkrupp','Cemex SAB','HeidelbergCement','LafargeHolcim','ExxonMobil','Chevron Corp','BP plc','Equinor ASA',
  'Volkswagen AG','Toyota Motor','Samsung Elec','TSMC','POSCO Holdings','Ford Motor','Siemens AG','Schneider Electric','BMW AG','Daimler AG',
  'Nestlé SA','Unilever plc','P&G Co','Johnson & Johnson','Novartis AG','Roche Holding','Pfizer Inc','AstraZeneca','GSK plc','Sanofi SA',
  'JPMorgan Chase','Goldman Sachs','HSBC Holdings','BNP Paribas','UBS Group','Deutsche Bank','Barclays plc','Citigroup Inc','Morgan Stanley','BlackRock',
  'Amazon.com','Alphabet Inc','Meta Platforms','Intel Corp','NVIDIA Corp','AMD Inc','Broadcom Inc','Qualcomm Inc','Texas Instruments','Applied Materials',
  'Caterpillar','Deere & Co','3M Company','Honeywell Intl','General Electric','ABB Ltd','Emerson Electric','Illinois Tool Works','Parker Hannifin','Eaton Corp',
  'Walmart Inc','Costco Wholesale','Home Depot','Target Corp','LVMH SE','Nike Inc','Starbucks Corp','McDonalds Corp','Coca-Cola Co','PepsiCo Inc',
  'Duke Energy','NextEra Energy','Engie SA','Enel SpA','Iberdrola SA','Ørsted A/S','Vestas Wind','Siemens Gamesa','Canadian Solar','First Solar',
  'FedEx Corp','UPS Inc','Maersk A/S','DHL Group','CMA CGM','Delta Air Lines','United Airlines','Ryanair Holdings','Lufthansa AG','IAG SA',
  'Tata Steel','JSW Steel','Nucor Corp','Steel Dynamics','Fortescue Metals','South32 Ltd','Woodside Energy','Santos Ltd','Origin Energy','AGL Energy',
  'Inditex SA','H&M Group','Fast Retailing','Adidas AG','Lululemon Inc','Under Armour','Burberry Group','Kering SA','Hermès Intl','Richemont SA',
];

const genCompanies = () => COMPANY_NAMES.map((name, i) => {
  const seed = i * 137;
  const sector = SECTORS[Math.floor(sr(seed) * SECTORS.length)];
  const country = COUNTRIES[Math.floor(sr(seed + 1) * COUNTRIES.length)];
  const revenue = Math.round(5000 + sr(seed + 2) * 195000);
  const totalScope3 = Math.round(50000 + sr(seed + 3) * 4950000);
  const cats = CATEGORIES.map((c, ci) => {
    const share = c.avgShare * (0.5 + sr(seed + ci * 7) * 1.0);
    const spend = Math.round(share * revenue * (0.3 + sr(seed + ci * 11) * 0.4));
    const actFactor = 0.6 + sr(seed + ci * 13) * 0.8;
    const suppFactor = 0.4 + sr(seed + ci * 17) * 0.5;
    const spendEmissions = Math.round(totalScope3 * share);
    return {
      catId: c.id, catName: c.name, catShort: c.short,
      spend, spendEmissions,
      activityEmissions: Math.round(spendEmissions * actFactor),
      supplierSpecific: Math.round(spendEmissions * suppFactor),
      dqs: 1 + Math.floor(sr(seed + ci * 19) * 5),
    };
  });
  const normTotal = cats.reduce((a, c) => a + c.spendEmissions, 0);
  return {
    id: i + 1, name, sector, country, revenue,
    totalScope3: normTotal,
    categories: cats,
    quarterlyTrend: Array.from({ length: 12 }, (_, q) => ({
      quarter: `Q${(q % 4) + 1} ${2021 + Math.floor(q / 4)}`,
      emissions: Math.round(normTotal / 4 * (0.85 + sr(seed + q * 23) * 0.3)),
    })),
  };
});

/* ── 200 suppliers per company (generated on demand) ────────────────────────── */
const SUPPLIER_PREFIXES = ['Global','Pacific','Euro','Atlas','Apex','Zenith','Vertex','Omni','Prime','Core','Nova','Sigma','Alpha','Delta','Nexus','Titan','Vanguard','Pinnacle','Quantum','Sterling'];
const SUPPLIER_SUFFIXES = ['Materials','Logistics','Components','Solutions','Systems','Industries','Trading','Supply Co','Manufacturing','Technologies'];

const genSuppliers = (companyId) => Array.from({ length: 200 }, (_, i) => {
  const seed = companyId * 10000 + i * 31;
  const cat = CATEGORIES[Math.floor(sr(seed) * CATEGORIES.length)];
  const prefix = SUPPLIER_PREFIXES[Math.floor(sr(seed + 1) * SUPPLIER_PREFIXES.length)];
  const suffix = SUPPLIER_SUFFIXES[Math.floor(sr(seed + 2) * SUPPLIER_SUFFIXES.length)];
  const country = COUNTRIES[Math.floor(sr(seed + 3) * COUNTRIES.length)];
  const spend = Math.round(0.5 + sr(seed + 4) * 49.5);
  const emissions = Math.round(spend * (50 + sr(seed + 5) * 450));
  return {
    id: i + 1, name: `${prefix} ${suffix} ${i + 1}`, country,
    catId: cat.id, catName: cat.name, catShort: cat.short,
    spend, emissions, intensity: +(emissions / spend).toFixed(1),
    dqs: 1 + Math.floor(sr(seed + 6) * 5),
    engaged: sr(seed + 7) > 0.65,
    stage: ENGAGEMENT_STAGES[Math.floor(sr(seed + 8) * ENGAGEMENT_STAGES.length)],
    methodology: METHODOLOGIES[Math.floor(sr(seed + 9) * METHODOLOGIES.length)],
  };
});

/* ── 40 engagement pipeline suppliers ───────────────────────────────────────── */
const genEngagementPipeline = () => Array.from({ length: 40 }, (_, i) => {
  const seed = i * 53;
  return {
    id: i + 1,
    name: `${SUPPLIER_PREFIXES[Math.floor(sr(seed) * SUPPLIER_PREFIXES.length)]} ${SUPPLIER_SUFFIXES[Math.floor(sr(seed + 1) * SUPPLIER_SUFFIXES.length)]}`,
    stage: ENGAGEMENT_STAGES[Math.floor(sr(seed + 2) * ENGAGEMENT_STAGES.length)],
    emissions: Math.round(1000 + sr(seed + 3) * 49000),
    sector: SECTORS[Math.floor(sr(seed + 4) * SECTORS.length)],
    target: sr(seed + 5) > 0.4 ? `${Math.round(20 + sr(seed + 6) * 30)}% by 2030` : 'Pending',
    cdpScore: ['A','A-','B','B-','C','C-','D','D-','N/A'][Math.floor(sr(seed + 7) * 9)],
    lastContact: `2025-${String(1 + Math.floor(sr(seed + 8) * 12)).padStart(2,'0')}-${String(1 + Math.floor(sr(seed + 9) * 28)).padStart(2,'0')}`,
  };
});

/* ── KPI Card ───────────────────────────────────────────────────────────────── */
const KPI = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 160, cursor:'pointer' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = accent || T.gold; e.currentTarget.style.boxShadow = `0 2px 12px ${(accent || T.gold)}22`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}>
    <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: accent || T.navy }}>{value}</div>
    {sub && <div style={{ fontFamily: T.font, fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

/* ── Pill / Tab bar ─────────────────────────────────────────────────────────── */
const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '6px 16px', borderRadius: 6, border: `1px solid ${active ? T.gold : T.border}`,
    background: active ? T.gold : T.surface, color: active ? '#fff' : T.text,
    fontFamily: T.mono, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
    transition: 'all .15s',
  }}>{label}</button>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display:'flex', gap:4, borderBottom:`2px solid ${T.border}`, paddingBottom:0, marginBottom:20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding:'8px 20px', border:'none', borderBottom: active===t ? `2px solid ${T.gold}` : '2px solid transparent',
        background:'transparent', color: active===t ? T.navy : T.textMut, fontFamily:T.mono, fontSize:12,
        fontWeight: active===t ? 700 : 500, cursor:'pointer', marginBottom:-2, letterSpacing:0.3,
      }}>{t}</button>
    ))}
  </div>
);

/* ── Tooltip ────────────────────────────────────────────────────────────────── */
const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.navy, color: '#fff', padding: '8px 12px', borderRadius: 6, fontFamily: T.mono, fontSize: 11, border: `1px solid ${T.gold}` }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || T.goldL }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</div>)}
    </div>
  );
};

const fmt = n => { if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n); };

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
export default function Scope3UpstreamTrackerPage() {
  const [tab, setTab] = useState('Category Dashboard');
  const [selMethodology, setSelMethodology] = useState('Spend-based');
  const [selSector, setSelSector] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selCompanyId, setSelCompanyId] = useState(null);
  const [selCatId, setSelCatId] = useState(null);
  const [suppPage, setSuppPage] = useState(0);
  const [suppCatFilter, setSuppCatFilter] = useState('All');
  const [suppCountryFilter, setSuppCountryFilter] = useState('All');
  const [suppDqsFilter, setSuppDqsFilter] = useState('All');
  const [suppSpendMin, setSuppSpendMin] = useState('');
  const [suppSort, setSuppSort] = useState({ col:'emissions', dir:'desc' });
  const [selSuppId, setSelSuppId] = useState(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [hybridMethods, setHybridMethods] = useState({});
  const [engSearchTerm, setEngSearchTerm] = useState('');
  const [scenarioTop, setScenarioTop] = useState(20);
  const [scenarioReduction, setScenarioReduction] = useState(30);
  const [showExport, setShowExport] = useState(false);

  const TABS = ['Category Dashboard','Supplier Emissions Engine','Methodology Comparison','Reduction Targets & Engagement'];

  const companies = useMemo(() => genCompanies(), []);

  const filteredCompanies = useMemo(() => {
    let list = companies;
    if (selSector !== 'All') list = list.filter(c => c.sector === selSector);
    if (searchTerm) list = list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [companies, selSector, searchTerm]);

  const selCompany = useMemo(() => companies.find(c => c.id === selCompanyId), [companies, selCompanyId]);

  const suppliers = useMemo(() => selCompanyId ? genSuppliers(selCompanyId) : genSuppliers(1), [selCompanyId]);

  const filteredSuppliers = useMemo(() => {
    let list = suppliers;
    if (suppCatFilter !== 'All') list = list.filter(s => s.catShort === suppCatFilter);
    if (suppCountryFilter !== 'All') list = list.filter(s => s.country === suppCountryFilter);
    if (suppDqsFilter !== 'All') list = list.filter(s => s.dqs === Number(suppDqsFilter));
    if (suppSpendMin) list = list.filter(s => s.spend >= Number(suppSpendMin));
    list = [...list].sort((a, b) => suppSort.dir === 'desc' ? b[suppSort.col] - a[suppSort.col] : a[suppSort.col] - b[suppSort.col]);
    return list;
  }, [suppliers, suppCatFilter, suppCountryFilter, suppDqsFilter, suppSpendMin, suppSort]);

  const pagedSuppliers = useMemo(() => filteredSuppliers.slice(suppPage * 25, (suppPage + 1) * 25), [filteredSuppliers, suppPage]);

  const engagementPipeline = useMemo(() => genEngagementPipeline(), []);

  /* ── Category aggregates ──────────────────────────────────────────────────── */
  const categoryAgg = useMemo(() => {
    const methKey = selMethodology === 'Spend-based' ? 'spendEmissions' : selMethodology === 'Activity-based' ? 'activityEmissions' : 'supplierSpecific';
    return CATEGORIES.map(cat => {
      const vals = filteredCompanies.map(c => { const cc = c.categories.find(x => x.catId === cat.id); return cc ? cc[methKey] : 0; });
      const total = vals.reduce((a, b) => a + b, 0);
      const avg = Math.round(total / (filteredCompanies.length || 1));
      return { ...cat, total, avg, companyCount: filteredCompanies.length };
    });
  }, [filteredCompanies, selMethodology]);

  const totalUpstream = useMemo(() => categoryAgg.reduce((a, c) => a + c.total, 0), [categoryAgg]);

  /* ── Stacked bar data for top 30 companies ────────────────────────────────── */
  const stackedBarData = useMemo(() => {
    const methKey = selMethodology === 'Spend-based' ? 'spendEmissions' : selMethodology === 'Activity-based' ? 'activityEmissions' : 'supplierSpecific';
    const sorted = [...filteredCompanies].sort((a, b) => b.totalScope3 - a.totalScope3).slice(0, 30);
    return sorted.map(c => {
      const row = { name: c.name.length > 12 ? c.name.slice(0, 12) + '..' : c.name, companyId: c.id };
      c.categories.forEach(cat => { row[`cat${cat.catId}`] = cat[methKey]; });
      return row;
    });
  }, [filteredCompanies, selMethodology]);

  /* ── Hotspot matrix ───────────────────────────────────────────────────────── */
  const hotspotData = useMemo(() => {
    const methKey = selMethodology === 'Spend-based' ? 'spendEmissions' : selMethodology === 'Activity-based' ? 'activityEmissions' : 'supplierSpecific';
    const pairs = [];
    SECTORS.forEach(sec => {
      CATEGORIES.forEach(cat => {
        const matching = companies.filter(c => c.sector === sec);
        const total = matching.reduce((a, c) => { const cc = c.categories.find(x => x.catId === cat.id); return a + (cc ? cc[methKey] : 0); }, 0);
        if (total > 0) pairs.push({ sector: sec, category: cat.short, catName: cat.name, total });
      });
    });
    return pairs.sort((a, b) => b.total - a.total).slice(0, 20);
  }, [companies, selMethodology]);

  /* ── Supplier concentration ───────────────────────────────────────────────── */
  const supplierConcentration = useMemo(() => {
    const sorted = [...suppliers].sort((a, b) => b.emissions - a.emissions);
    const totalEm = sorted.reduce((a, s) => a + s.emissions, 0);
    const top10Em = sorted.slice(0, 10).reduce((a, s) => a + s.emissions, 0);
    return { top10Pct: totalEm > 0 ? ((top10Em / totalEm) * 100).toFixed(1) : 0, total: totalEm };
  }, [suppliers]);

  /* ── Methodology comparison data ──────────────────────────────────────────── */
  const methodCompare = useMemo(() => {
    if (!selCompany) return [];
    return selCompany.categories.map(c => ({
      category: CATEGORIES.find(x => x.id === c.catId)?.short || `Cat ${c.catId}`,
      catName: CATEGORIES.find(x => x.id === c.catId)?.name || '',
      'Spend-based': c.spendEmissions,
      'Activity-based': c.activityEmissions,
      'Supplier-specific': c.supplierSpecific,
      dqs: c.dqs,
    }));
  }, [selCompany]);

  /* ── Hybrid blended total ─────────────────────────────────────────────────── */
  const hybridTotal = useMemo(() => {
    if (!selCompany) return 0;
    return selCompany.categories.reduce((sum, c) => {
      const m = hybridMethods[c.catId] || 'Spend-based';
      const val = m === 'Spend-based' ? c.spendEmissions : m === 'Activity-based' ? c.activityEmissions : c.supplierSpecific;
      return sum + val;
    }, 0);
  }, [selCompany, hybridMethods]);

  /* ── Accuracy vs effort scatter data ──────────────────────────────────────── */
  const scatterData = useMemo(() => [
    { method:'Spend-based', accuracy:35, effort:10, color:'#0ea5e9' },
    { method:'Activity-based', accuracy:65, effort:50, color:'#f59e0b' },
    { method:'Supplier-specific', accuracy:92, effort:85, color:'#10b981' },
  ], []);

  /* ── Scenario reduction calc ──────────────────────────────────────────────── */
  const scenarioResult = useMemo(() => {
    const sorted = [...suppliers].sort((a, b) => b.emissions - a.emissions);
    const topN = sorted.slice(0, scenarioTop);
    const topEm = topN.reduce((a, s) => a + s.emissions, 0);
    const totalEm = sorted.reduce((a, s) => a + s.emissions, 0);
    const reduction = Math.round(topEm * scenarioReduction / 100);
    const newTotal = totalEm - reduction;
    return { reduction, pctDrop: totalEm > 0 ? ((reduction / totalEm) * 100).toFixed(1) : 0, newTotal, topEm, totalEm };
  }, [suppliers, scenarioTop, scenarioReduction]);

  /* ── Engagement pipeline stages count ─────────────────────────────────────── */
  const stageCounts = useMemo(() => ENGAGEMENT_STAGES.map(s => ({
    stage: s, count: engagementPipeline.filter(p => p.stage === s).length,
  })), [engagementPipeline]);

  const SortHeader = ({ col, label }) => (
    <th onClick={() => setSuppSort(p => ({ col, dir: p.col === col && p.dir === 'desc' ? 'asc' : 'desc' }))}
      style={{ padding:'8px 10px', textAlign:'left', cursor:'pointer', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}`, background:T.surfaceH, whiteSpace:'nowrap', userSelect:'none' }}>
      {label} {suppSort.col === col ? (suppSort.dir === 'desc' ? ' \u25BC' : ' \u25B2') : ''}
    </th>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 1: Category Dashboard
     ══════════════════════════════════════════════════════════════════════════ */
  const renderCategoryDashboard = () => (
    <div>
      {/* KPIs */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <KPI label="Total Upstream Scope 3" value={fmt(totalUpstream)+' tCO2e'} sub={`${filteredCompanies.length} companies`} accent={T.navy} />
        <KPI label="Largest Category" value={categoryAgg.sort((a,b)=>b.total-a.total)[0]?.name?.split(' ').slice(0,2).join(' ')} sub={fmt(categoryAgg.sort((a,b)=>b.total-a.total)[0]?.total)+' tCO2e'} accent='#0ea5e9' />
        <KPI label="Avg DQS" value={filteredCompanies.length?(filteredCompanies.reduce((a,c)=>a+c.categories.reduce((s,x)=>s+x.dqs,0)/8,0)/filteredCompanies.length).toFixed(1):'0.0'} sub="1=Best, 5=Worst" accent={T.amber} />
        <KPI label="Methodology" value={selMethodology.split('-')[0]} sub="Click to toggle" accent={T.gold} />
      </div>

      {/* Filters row */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:16 }}>
        <div style={{ display:'flex', gap:4 }}>
          {METHODOLOGIES.map(m => <Pill key={m} label={m} active={selMethodology===m} onClick={()=>setSelMethodology(m)} />)}
        </div>
        <select value={selSector} onChange={e=>setSelSector(e.target.value)}
          style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:12, background:T.surface, color:T.text }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="Search company..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
          style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:12, width:180, background:T.surface, color:T.text }} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:20 }}>
        {/* Stacked bar chart */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>EMISSIONS BY CATEGORY — TOP 30 COMPANIES</div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={stackedBarData} onClick={d => { if (d?.activePayload?.[0]) setSelCompanyId(d.activePayload[0].payload.companyId); }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, fill:T.textMut }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} tickFormatter={fmt} />
              <Tooltip content={<CTooltip />} />
              <Legend wrapperStyle={{ fontFamily:T.mono, fontSize:10 }} />
              {CATEGORIES.map(cat => (
                <Bar key={cat.id} dataKey={`cat${cat.id}`} stackId="a" fill={cat.color} name={cat.short} cursor="pointer" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>CATEGORY BREAKDOWN</div>
          {categoryAgg.sort((a,b)=>b.total-a.total).map(cat => (
            <div key={cat.id} onClick={() => setSelCatId(selCatId === cat.id ? null : cat.id)}
              style={{ background: selCatId === cat.id ? T.surfaceH : T.surface, border:`1px solid ${selCatId === cat.id ? cat.color : T.border}`, borderRadius:8, padding:'10px 14px', cursor:'pointer', transition:'all .15s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:cat.color }} />
                  <span style={{ fontFamily:T.mono, fontSize:11, color:T.text, fontWeight:600 }}>{cat.short}</span>
                </div>
                <span style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:cat.color }}>{fmt(cat.total)}</span>
              </div>
              <div style={{ fontFamily:T.font, fontSize:11, color:T.textSec, marginTop:4 }}>{cat.name}</div>
              <div style={{ height:4, background:T.border, borderRadius:2, marginTop:6 }}>
                <div style={{ height:4, background:cat.color, borderRadius:2, width:`${Math.min(100, (cat.total / (categoryAgg[0]?.total || 1)) * 100)}%`, transition:'width .3s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sector emissions breakdown area chart */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:20 }}>
        <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>SECTOR EMISSIONS TREND — 12 QUARTERS (AGGREGATED)</div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={Array.from({length:12}, (_,q) => {
            const qLabel = `Q${(q%4)+1} ${2021+Math.floor(q/4)}`;
            const row = { quarter: qLabel };
            SECTORS.slice(0,6).forEach((sec, si) => {
              const sectorCos = filteredCompanies.filter(c => c.sector === sec);
              row[sec] = sectorCos.reduce((sum, c) => sum + (c.quarterlyTrend[q]?.emissions || 0), 0);
            });
            return row;
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="quarter" tick={{ fontSize:9, fontFamily:T.mono, fill:T.textMut }} />
            <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} tickFormatter={fmt} />
            <Tooltip content={<CTooltip />} />
            <Legend wrapperStyle={{ fontFamily:T.mono, fontSize:10 }} />
            {SECTORS.slice(0,6).map((sec, i) => (
              <Line key={sec} type="monotone" dataKey={sec} stroke={['#0ea5e9','#8b5cf6','#f59e0b','#10b981','#ef4444','#ec4899'][i]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category drill-down on select */}
      {selCatId && (
        <div style={{ background:T.surface, border:`1px solid ${CATEGORIES.find(c=>c.id===selCatId)?.color||T.border}`, borderRadius:8, padding:16, marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:CATEGORIES.find(c=>c.id===selCatId)?.color||T.navy }}>
              {CATEGORIES.find(c=>c.id===selCatId)?.name} — TOP EMITTERS
            </div>
            <button onClick={()=>setSelCatId(null)} style={{ background:'none', border:'none', fontFamily:T.mono, color:T.textMut, cursor:'pointer' }}>x close</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(() => {
              const methKey = selMethodology==='Spend-based'?'spendEmissions':selMethodology==='Activity-based'?'activityEmissions':'supplierSpecific';
              return [...filteredCompanies]
                .map(c => ({ name: c.name.length>14?c.name.slice(0,14)+'..':c.name, value: c.categories.find(x=>x.catId===selCatId)?.[methKey]||0, companyId: c.id }))
                .sort((a,b) => b.value-a.value).slice(0,15);
            })()}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:8, fontFamily:T.mono, fill:T.textMut }} angle={-45} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} tickFormatter={fmt} />
              <Tooltip content={<CTooltip />} />
              <Bar dataKey="value" name="tCO2e" radius={[4,4,0,0]} cursor="pointer" onClick={d=>setSelCompanyId(d.companyId)}>
                {Array.from({length:15}, (_,i) => <Cell key={i} fill={CATEGORIES.find(c=>c.id===selCatId)?.color||T.navy} opacity={1-i*0.04} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hotspot matrix */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>HOTSPOT: CATEGORY x SECTOR (TOP 20)</div>
          <div style={{ maxHeight:300, overflow:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Sector','Category','Total tCO2e'].map(h => (
                    <th key={h} style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:10, color:T.textSec, textAlign:'left', borderBottom:`1px solid ${T.border}`, background:T.surfaceH }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hotspotData.map((r, i) => (
                  <tr key={i} style={{ cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.text, borderBottom:`1px solid ${T.border}` }}>{r.sector}</td>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.text, borderBottom:`1px solid ${T.border}` }}>{r.category}</td>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, fontWeight:700, color:i<3?T.red:i<8?T.amber:T.text, borderBottom:`1px solid ${T.border}` }}>{fmt(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category pie */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>CATEGORY SHARE DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryAgg} dataKey="total" nameKey="short" cx="50%" cy="50%" outerRadius={100} label={({short,percent})=>`${short}: ${(percent*100).toFixed(0)}%`}
                labelLine={{ stroke:T.textMut }} onClick={d => setSelCatId(d.id)} cursor="pointer">
                {categoryAgg.map((c,i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip content={<CTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side panel: company detail on click */}
      {selCompany && (
        <div style={{ background:T.surface, border:`1px solid ${T.gold}`, borderRadius:8, padding:20, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <span style={{ fontFamily:T.mono, fontSize:14, fontWeight:700, color:T.navy }}>{selCompany.name}</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, marginLeft:12 }}>{selCompany.sector} | {selCompany.country} | Rev ${fmt(selCompany.revenue)}M</span>
            </div>
            <button onClick={() => setSelCompanyId(null)} style={{ background:'none', border:'none', fontFamily:T.mono, fontSize:14, color:T.textMut, cursor:'pointer' }}>x</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16 }}>
            <div>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, marginBottom:8 }}>12-QUARTER TREND</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={selCompany.quarterlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="quarter" tick={{ fontSize:9, fontFamily:T.mono, fill:T.textMut }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} tickFormatter={fmt} />
                  <Tooltip content={<CTooltip />} />
                  <Area type="monotone" dataKey="emissions" fill={T.navy+'22'} stroke={T.navy} strokeWidth={2} name="Scope 3 tCO2e" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, marginBottom:8 }}>METHODOLOGY COMPARISON</div>
              {selCompany.categories.map(c => {
                const cat = CATEGORIES.find(x => x.id === c.catId);
                return (
                  <div key={c.catId} style={{ marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:50, fontFamily:T.mono, fontSize:10, color:T.textMut }}>{cat?.short}</div>
                    <div style={{ flex:1, display:'flex', gap:2 }}>
                      {[{k:'spendEmissions',c:'#0ea5e9'},{k:'activityEmissions',c:'#f59e0b'},{k:'supplierSpecific',c:'#10b981'}].map(m => (
                        <div key={m.k} style={{ height:8, background:m.c, borderRadius:2, width:`${Math.min(100, c[m.k] / (Math.max(c.spendEmissions, c.activityEmissions, c.supplierSpecific) || 1) * 100)}%` }}
                          title={`${m.k}: ${fmt(c[m.k])}`} />
                      ))}
                    </div>
                    <div style={{ width:32, fontFamily:T.mono, fontSize:10, color:c.dqs<=2?T.green:c.dqs<=3?T.amber:T.red, textAlign:'right' }}>DQ{c.dqs}</div>
                  </div>
                );
              })}
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                {[{l:'Spend',c:'#0ea5e9'},{l:'Activity',c:'#f59e0b'},{l:'Supplier',c:'#10b981'}].map(m => (
                  <div key={m.l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:m.c }} />
                    <span style={{ fontFamily:T.mono, fontSize:9, color:T.textMut }}>{m.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 2: Supplier Emissions Engine
     ══════════════════════════════════════════════════════════════════════════ */
  const renderSupplierEngine = () => {
    const selSupp = suppliers.find(s => s.id === selSuppId);
    return (
      <div>
        {/* Company selector */}
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom:16 }}>
          <select value={selCompanyId || 1} onChange={e=>setSelCompanyId(Number(e.target.value))}
            style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:12, background:T.surface, color:T.text, maxWidth:220 }}>
            {companies.slice(0,120).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <KPI label="Suppliers" value="200" sub="in supply chain" accent={T.navy} />
          <KPI label="Top 10 Concentration" value={supplierConcentration.top10Pct+'%'} sub="of supply chain emissions" accent={Number(supplierConcentration.top10Pct)>60?T.red:T.amber} />
          <KPI label="Total Supply Chain" value={fmt(supplierConcentration.total)+' tCO2e'} accent={T.sage} />
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
          <select value={suppCatFilter} onChange={e=>{setSuppCatFilter(e.target.value);setSuppPage(0);}}
            style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:11, background:T.surface, color:T.text }}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.short}>{c.short} - {c.name}</option>)}
          </select>
          <select value={suppCountryFilter} onChange={e=>{setSuppCountryFilter(e.target.value);setSuppPage(0);}}
            style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:11, background:T.surface, color:T.text }}>
            <option value="All">All Countries</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={suppDqsFilter} onChange={e=>{setSuppDqsFilter(e.target.value);setSuppPage(0);}}
            style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:11, background:T.surface, color:T.text }}>
            <option value="All">All DQS</option>
            {[1,2,3,4,5].map(d => <option key={d} value={d}>DQS {d}</option>)}
          </select>
          <input placeholder="Min Spend $M" value={suppSpendMin} onChange={e=>{setSuppSpendMin(e.target.value);setSuppPage(0);}}
            style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:11, width:110, background:T.surface, color:T.text }} />
          <button onClick={() => setShowAddSupplier(!showAddSupplier)}
            style={{ padding:'5px 14px', borderRadius:6, border:`1px solid ${T.gold}`, background:T.gold, color:'#fff', fontFamily:T.mono, fontSize:11, fontWeight:700, cursor:'pointer' }}>
            + Add Supplier
          </button>
          <button onClick={() => alert('Bulk import simulation: 50 suppliers parsed from CSV template')}
            style={{ padding:'5px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.text, fontFamily:T.mono, fontSize:11, cursor:'pointer' }}>
            Bulk Import
          </button>
          <div style={{ marginLeft:'auto', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
            {filteredSuppliers.length} suppliers | Page {suppPage+1}/{Math.ceil(filteredSuppliers.length/25)}
          </div>
        </div>

        {/* Add supplier form */}
        {showAddSupplier && (
          <div style={{ background:T.surfaceH, border:`1px solid ${T.gold}`, borderRadius:8, padding:16, marginBottom:12, display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
            {['Supplier Name','Country','Category','Spend $M','Emissions tCO2e'].map(f => (
              <div key={f}>
                <div style={{ fontFamily:T.mono, fontSize:10, color:T.textSec, marginBottom:4 }}>{f}</div>
                <input style={{ padding:'5px 10px', borderRadius:4, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:11, width:f==='Supplier Name'?160:100, background:T.surface }} />
              </div>
            ))}
            <button onClick={() => { setShowAddSupplier(false); alert('Supplier added (simulated)'); }}
              style={{ padding:'6px 16px', borderRadius:6, background:T.sage, color:'#fff', border:'none', fontFamily:T.mono, fontSize:11, fontWeight:700, cursor:'pointer' }}>Save</button>
          </div>
        )}

        {/* Supplier table */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, overflow:'hidden', marginBottom:12 }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
              <thead>
                <tr>
                  <th style={{ padding:'8px 10px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}`, background:T.surfaceH }}>#</th>
                  <th style={{ padding:'8px 10px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}`, background:T.surfaceH }}>Supplier</th>
                  <th style={{ padding:'8px 10px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}`, background:T.surfaceH }}>Country</th>
                  <th style={{ padding:'8px 10px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}`, background:T.surfaceH }}>Category</th>
                  <SortHeader col="spend" label="Spend $M" />
                  <SortHeader col="emissions" label="Emissions tCO2e" />
                  <SortHeader col="intensity" label="Intensity" />
                  <SortHeader col="dqs" label="DQS" />
                  <th style={{ padding:'8px 10px', textAlign:'left', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}`, background:T.surfaceH }}>Engaged</th>
                </tr>
              </thead>
              <tbody>
                {pagedSuppliers.map((s, i) => (
                  <tr key={s.id} onClick={() => setSelSuppId(selSuppId === s.id ? null : s.id)}
                    style={{ cursor:'pointer', background: selSuppId === s.id ? T.surfaceH : 'transparent' }}
                    onMouseEnter={e => { if(selSuppId!==s.id) e.currentTarget.style.background=T.surfaceH; }}
                    onMouseLeave={e => { if(selSuppId!==s.id) e.currentTarget.style.background='transparent'; }}>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.textMut, borderBottom:`1px solid ${T.border}` }}>{suppPage*25+i+1}</td>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.text, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{s.name}</td>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{s.country}</td>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{s.catShort}</td>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.text, borderBottom:`1px solid ${T.border}` }}>${s.spend}M</td>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{s.emissions.toLocaleString()}</td>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{s.intensity}</td>
                    <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:s.dqs<=2?T.green:s.dqs<=3?T.amber:T.red, fontWeight:700, borderBottom:`1px solid ${T.border}` }}>{s.dqs}</td>
                    <td style={{ padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>
                      <span style={{ fontFamily:T.mono, fontSize:10, padding:'2px 8px', borderRadius:4, background:s.engaged?T.green+'18':T.border, color:s.engaged?T.green:T.textMut }}>{s.engaged?'Yes':'No'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:16 }}>
          <button disabled={suppPage===0} onClick={()=>setSuppPage(p=>p-1)} style={{ padding:'4px 12px', borderRadius:4, border:`1px solid ${T.border}`, background:T.surface, fontFamily:T.mono, fontSize:11, cursor:suppPage===0?'default':'pointer', color:suppPage===0?T.textMut:T.text }}>Prev</button>
          {Array.from({length:Math.min(8, Math.ceil(filteredSuppliers.length/25))}, (_,i)=>(
            <button key={i} onClick={()=>setSuppPage(i)} style={{ padding:'4px 10px', borderRadius:4, border:`1px solid ${suppPage===i?T.gold:T.border}`, background:suppPage===i?T.gold:T.surface, color:suppPage===i?'#fff':T.text, fontFamily:T.mono, fontSize:11, cursor:'pointer' }}>{i+1}</button>
          ))}
          <button disabled={(suppPage+1)*25>=filteredSuppliers.length} onClick={()=>setSuppPage(p=>p+1)} style={{ padding:'4px 12px', borderRadius:4, border:`1px solid ${T.border}`, background:T.surface, fontFamily:T.mono, fontSize:11, cursor:(suppPage+1)*25>=filteredSuppliers.length?'default':'pointer', color:(suppPage+1)*25>=filteredSuppliers.length?T.textMut:T.text }}>Next</button>
        </div>

        {/* Supplier detail panel */}
        {selSupp && (
          <div style={{ background:T.surface, border:`1px solid ${T.gold}`, borderRadius:8, padding:20, marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <span style={{ fontFamily:T.mono, fontSize:14, fontWeight:700, color:T.navy }}>{selSupp.name}</span>
                <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, marginLeft:12 }}>{selSupp.country} | {selSupp.catName} | {selSupp.methodology}</span>
              </div>
              <button onClick={()=>setSelSuppId(null)} style={{ background:'none', border:'none', fontFamily:T.mono, fontSize:14, color:T.textMut, cursor:'pointer' }}>x</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
              <div>
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, marginBottom:8 }}>EMISSION FACTORS</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.text, marginBottom:4 }}>Scope 1: {Math.round(selSupp.emissions*0.35).toLocaleString()} tCO2e</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.text, marginBottom:4 }}>Scope 2: {Math.round(selSupp.emissions*0.25).toLocaleString()} tCO2e</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.text, marginBottom:4 }}>Scope 3 upstream: {Math.round(selSupp.emissions*0.40).toLocaleString()} tCO2e</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.gold, fontWeight:700, marginTop:8 }}>Intensity: {selSupp.intensity} tCO2e/$M</div>
              </div>
              <div>
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, marginBottom:8 }}>METHODOLOGY BREAKDOWN</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.text, marginBottom:4 }}>Current: {selSupp.methodology}</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.text, marginBottom:4 }}>Spend-based estimate: {Math.round(selSupp.emissions * 1.15).toLocaleString()}</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.text, marginBottom:4 }}>Activity-based: {Math.round(selSupp.emissions * 0.92).toLocaleString()}</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.text }}>Supplier-specific: {Math.round(selSupp.emissions * 0.78).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, marginBottom:8 }}>IMPROVEMENT RECOMMENDATIONS</div>
                {selSupp.dqs >= 4 && <div style={{ fontFamily:T.font, fontSize:11, color:T.red, marginBottom:4 }}>- Request CDP disclosure from supplier</div>}
                {selSupp.dqs >= 3 && <div style={{ fontFamily:T.font, fontSize:11, color:T.amber, marginBottom:4 }}>- Upgrade to activity-based data collection</div>}
                <div style={{ fontFamily:T.font, fontSize:11, color:T.text, marginBottom:4 }}>- Engage via supplier sustainability program</div>
                {!selSupp.engaged && <div style={{ fontFamily:T.font, fontSize:11, color:T.sage, marginBottom:4 }}>- Add to engagement pipeline</div>}
                <div style={{ fontFamily:T.font, fontSize:11, color:T.text }}>- Set annual reduction target: 4.2% YoY</div>
              </div>
            </div>
          </div>
        )}

        {/* Supplier category & DQS distribution */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>EMISSIONS BY CATEGORY (CURRENT COMPANY)</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={CATEGORIES.map(cat => {
                  const catSupps = suppliers.filter(s => s.catId === cat.id);
                  return { name: cat.short, value: catSupps.reduce((a,s) => a+s.emissions, 0), color: cat.color };
                })} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:T.textMut}}>
                  {CATEGORIES.map((c,i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip content={<CTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>DATA QUALITY SCORE DISTRIBUTION</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[1,2,3,4,5].map(d => ({ dqs:`DQS ${d}`, count:suppliers.filter(s=>s.dqs===d).length, emissions:suppliers.filter(s=>s.dqs===d).reduce((a,s)=>a+s.emissions,0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="dqs" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} />
                <YAxis yAxisId="left" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} tickFormatter={fmt} />
                <Tooltip content={<CTooltip />} />
                <Legend wrapperStyle={{ fontFamily:T.mono, fontSize:10 }} />
                <Bar yAxisId="left" dataKey="count" name="Supplier Count" fill={T.navy} radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="emissions" name="Total Emissions" fill={T.gold} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend vs Emissions scatter (simulated as bar) */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
          <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>SPEND vs EMISSIONS INTENSITY — TOP 30 SUPPLIERS</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[...suppliers].sort((a,b)=>b.intensity-a.intensity).slice(0,30).map(s=>({name:s.name.length>12?s.name.slice(0,12)+'..':s.name,intensity:s.intensity,spend:s.spend}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:7, fontFamily:T.mono, fill:T.textMut }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} />
              <Tooltip content={<CTooltip />} />
              <Legend wrapperStyle={{ fontFamily:T.mono, fontSize:10 }} />
              <Bar dataKey="intensity" name="Intensity (tCO2e/$M)" fill={T.red} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Concentration chart */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>SUPPLIER CONCENTRATION RISK — TOP 20 BY EMISSIONS</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...suppliers].sort((a,b)=>b.emissions-a.emissions).slice(0,20).map(s=>({name:s.name.length>15?s.name.slice(0,15)+'..':s.name,emissions:s.emissions,spend:s.spend}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:8, fontFamily:T.mono, fill:T.textMut }} angle={-45} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} tickFormatter={fmt} />
              <Tooltip content={<CTooltip />} />
              <Bar dataKey="emissions" name="Emissions tCO2e" radius={[4,4,0,0]}>
                {[...suppliers].sort((a,b)=>b.emissions-a.emissions).slice(0,20).map((_,i) => <Cell key={i} fill={i<3?T.red:i<10?T.amber:T.navy} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 3: Methodology Comparison
     ══════════════════════════════════════════════════════════════════════════ */
  const renderMethodologyComparison = () => (
    <div>
      {/* Company selector */}
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
        <select value={selCompanyId || 1} onChange={e=>setSelCompanyId(Number(e.target.value))}
          style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:12, background:T.surface, color:T.text, maxWidth:240 }}>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>Select company for side-by-side methodology comparison</div>
      </div>

      {selCompany && (
        <>
          {/* Side-by-side bar chart */}
          <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16, marginBottom:20 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>3-METHODOLOGY COMPARISON — {selCompany.name.toUpperCase()}</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={methodCompare}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="category" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} />
                  <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} tickFormatter={fmt} />
                  <Tooltip content={<CTooltip />} />
                  <Legend wrapperStyle={{ fontFamily:T.mono, fontSize:10 }} />
                  <Bar dataKey="Spend-based" fill="#0ea5e9" radius={[2,2,0,0]} />
                  <Bar dataKey="Activity-based" fill="#f59e0b" radius={[2,2,0,0]} />
                  <Bar dataKey="Supplier-specific" fill="#10b981" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Accuracy vs Effort */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>ACCURACY vs EFFORT</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={scatterData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} domain={[0,100]} />
                  <YAxis type="category" dataKey="method" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} width={110} />
                  <Tooltip content={<CTooltip />} />
                  <Legend wrapperStyle={{ fontFamily:T.mono, fontSize:10 }} />
                  <Bar dataKey="accuracy" name="Accuracy %" radius={[0,4,4,0]}>
                    {scatterData.map((d,i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                  <Bar dataKey="effort" name="Effort %" fill={T.textMut} radius={[0,4,4,0]} opacity={0.4} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontFamily:T.font, fontSize:10, color:T.textSec, marginTop:8 }}>
                Supplier-specific yields highest accuracy but requires direct supplier engagement. Spend-based is easiest but least precise.
              </div>
            </div>
          </div>

          {/* Hybrid approach builder */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:20 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>HYBRID APPROACH BUILDER</div>
            <div style={{ fontFamily:T.font, fontSize:11, color:T.textSec, marginBottom:14 }}>Select the best methodology per category to create your optimal blended calculation.</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:16 }}>
              {selCompany.categories.map(c => {
                const cat = CATEGORIES.find(x => x.id === c.catId);
                const sel = hybridMethods[c.catId] || 'Spend-based';
                return (
                  <div key={c.catId} style={{ background:T.surfaceH, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
                    <div style={{ fontFamily:T.mono, fontSize:11, fontWeight:600, color:cat?.color || T.text, marginBottom:8 }}>{cat?.short}: {cat?.name?.split(' ').slice(0,2).join(' ')}</div>
                    {METHODOLOGIES.map(m => (
                      <label key={m} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, cursor:'pointer' }}>
                        <input type="radio" name={`hybrid-${c.catId}`} checked={sel===m}
                          onChange={() => setHybridMethods(p => ({...p, [c.catId]:m}))}
                          style={{ accentColor:T.gold }} />
                        <span style={{ fontFamily:T.mono, fontSize:10, color:T.text }}>{m}</span>
                        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut, marginLeft:'auto' }}>
                          {fmt(m==='Spend-based'?c.spendEmissions:m==='Activity-based'?c.activityEmissions:c.supplierSpecific)}
                        </span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:20, alignItems:'center', padding:'12px 16px', background:T.navy+'08', borderRadius:8 }}>
              <div style={{ fontFamily:T.mono, fontSize:12, color:T.textSec }}>Blended Hybrid Total:</div>
              <div style={{ fontFamily:T.mono, fontSize:20, fontWeight:700, color:T.navy }}>{fmt(hybridTotal)} tCO2e</div>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>
                vs Spend-only: {fmt(selCompany.categories.reduce((a,c)=>a+c.spendEmissions,0))} |
                vs Activity-only: {fmt(selCompany.categories.reduce((a,c)=>a+c.activityEmissions,0))} |
                vs Supplier-only: {fmt(selCompany.categories.reduce((a,c)=>a+c.supplierSpecific,0))}
              </div>
            </div>
          </div>

          {/* DQS improvement roadmap */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>DATA QUALITY IMPROVEMENT ROADMAP</div>
            <div style={{ fontFamily:T.font, fontSize:11, color:T.textSec, marginBottom:14 }}>Pathway from current DQS to target DQS 1 (supplier-specific), with estimated cost and effort.</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Category','Current DQS','Target DQS','Steps Required','Est. Cost','Timeline','Priority'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.textSec, borderBottom:`1px solid ${T.border}`, background:T.surfaceH }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selCompany.categories.map(c => {
                  const cat = CATEGORIES.find(x => x.id === c.catId);
                  const steps = c.dqs <= 1 ? 'Maintain' : c.dqs <= 2 ? 'Request primary data' : c.dqs <= 3 ? 'Activity data + verification' : 'Full supplier engagement programme';
                  const cost = c.dqs <= 1 ? '$5K' : c.dqs <= 2 ? '$15K' : c.dqs <= 3 ? '$40K' : '$80K+';
                  const timeline = c.dqs <= 1 ? 'Ongoing' : c.dqs <= 2 ? '3 months' : c.dqs <= 3 ? '6 months' : '12+ months';
                  const priority = c.dqs >= 4 ? 'HIGH' : c.dqs >= 3 ? 'MEDIUM' : 'LOW';
                  return (
                    <tr key={c.catId} style={{ cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:cat?.color, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{cat?.short}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:12, fontWeight:700, color:c.dqs<=2?T.green:c.dqs<=3?T.amber:T.red, borderBottom:`1px solid ${T.border}` }}>{c.dqs}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.green, borderBottom:`1px solid ${T.border}` }}>1</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.font, fontSize:11, color:T.text, borderBottom:`1px solid ${T.border}` }}>{steps}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.text, borderBottom:`1px solid ${T.border}` }}>{cost}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{timeline}</td>
                      <td style={{ padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>
                        <span style={{ fontFamily:T.mono, fontSize:10, padding:'2px 8px', borderRadius:4, background:priority==='HIGH'?T.red+'18':priority==='MEDIUM'?T.amber+'18':T.green+'18', color:priority==='HIGH'?T.red:priority==='MEDIUM'?T.amber:T.green, fontWeight:700 }}>{priority}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 4: Reduction Targets & Engagement
     ══════════════════════════════════════════════════════════════════════════ */
  const renderReductionTargets = () => {
    const filteredPipeline = engSearchTerm ? engagementPipeline.filter(p => p.name.toLowerCase().includes(engSearchTerm.toLowerCase())) : engagementPipeline;
    return (
      <div>
        {/* KPIs */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
          <KPI label="Suppliers in Pipeline" value="40" sub="engagement programme" accent={T.navy} />
          <KPI label="Data Shared" value={engagementPipeline.filter(p=>['Data Shared','Target Set','Reducing','Verified'].includes(p.stage)).length} sub="suppliers disclosing" accent={T.sage} />
          <KPI label="Targets Set" value={engagementPipeline.filter(p=>['Target Set','Reducing','Verified'].includes(p.stage)).length} sub="with reduction targets" accent={T.gold} />
          <KPI label="Verified Reducers" value={engagementPipeline.filter(p=>p.stage==='Verified').length} sub="independently verified" accent={T.green} />
        </div>

        {/* Pipeline funnel */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>SUPPLIER ENGAGEMENT PIPELINE</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stageCounts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} width={90} />
                <Tooltip content={<CTooltip />} />
                <Bar dataKey="count" name="Suppliers" radius={[0,4,4,0]}>
                  {stageCounts.map((_, i) => <Cell key={i} fill={['#94a3b8','#0ea5e9','#f59e0b','#8b5cf6','#10b981','#16a34a'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scenario builder */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>REDUCTION SCENARIO BUILDER</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, marginBottom:4 }}>Top N suppliers to engage:</div>
              <input type="range" min={5} max={50} value={scenarioTop} onChange={e => setScenarioTop(Number(e.target.value))}
                style={{ width:'100%', accentColor:T.gold }} />
              <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy }}>{scenarioTop} suppliers</div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, marginBottom:4 }}>Target reduction per supplier (%):</div>
              <input type="range" min={5} max={50} value={scenarioReduction} onChange={e => setScenarioReduction(Number(e.target.value))}
                style={{ width:'100%', accentColor:T.gold }} />
              <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy }}>{scenarioReduction}%</div>
            </div>
            <div style={{ padding:12, background:T.navy+'08', borderRadius:8, marginTop:8 }}>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec }}>If top {scenarioTop} suppliers reduce by {scenarioReduction}%:</div>
              <div style={{ fontFamily:T.mono, fontSize:18, fontWeight:700, color:T.green, marginTop:4 }}>Portfolio Scope 3 drops {scenarioResult.pctDrop}%</div>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, marginTop:4 }}>
                Reduction: {fmt(scenarioResult.reduction)} tCO2e | New total: {fmt(scenarioResult.newTotal)} tCO2e
              </div>
            </div>
          </div>
        </div>

        {/* SBTi target setting */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>SBTi SCOPE 3 TARGET SETTING</div>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <Pill label="FLAG Approach" active={true} onClick={()=>{}} />
              <Pill label="Absolute Contraction" active={false} onClick={()=>{}} />
            </div>
            <div style={{ fontFamily:T.font, fontSize:11, color:T.text, lineHeight:1.6 }}>
              <div style={{ marginBottom:8 }}>SBTi requires companies to set Scope 3 targets when Scope 3 represents 40%+ of total value chain emissions.</div>
              <div style={{ padding:10, background:T.surfaceH, borderRadius:6, marginBottom:8 }}>
                <div style={{ fontFamily:T.mono, fontSize:10, color:T.textSec }}>FLAG Sector Target (1.5C aligned)</div>
                <div style={{ fontFamily:T.mono, fontSize:16, fontWeight:700, color:T.sage }}>-30.3% by 2030 vs 2020 baseline</div>
              </div>
              <div style={{ padding:10, background:T.surfaceH, borderRadius:6, marginBottom:8 }}>
                <div style={{ fontFamily:T.mono, fontSize:10, color:T.textSec }}>Absolute Contraction Target</div>
                <div style={{ fontFamily:T.mono, fontSize:16, fontWeight:700, color:T.navy }}>-42% by 2030 (well-below 2C)</div>
              </div>
              <div style={{ padding:10, background:T.surfaceH, borderRadius:6 }}>
                <div style={{ fontFamily:T.mono, fontSize:10, color:T.textSec }}>Supplier engagement threshold</div>
                <div style={{ fontFamily:T.mono, fontSize:16, fontWeight:700, color:T.gold }}>67% of Scope 3 emissions covered</div>
              </div>
            </div>
          </div>

          {/* Cost of inaction */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>COST OF INACTION CALCULATOR</div>
            <div style={{ fontFamily:T.font, fontSize:11, color:T.textSec, marginBottom:14 }}>Estimated financial exposure if Scope 3 emissions remain unmanaged.</div>
            {[
              { label:'Carbon pricing risk (EU ETS expansion)', value:'$12.4M–$28.6M', color:T.red },
              { label:'Supply chain disruption (physical climate)', value:'$8.2M–$15.1M', color:T.amber },
              { label:'Regulatory non-compliance (CSRD/SEC)', value:'$3.5M–$7.8M', color:T.amber },
              { label:'Reputational damage (ESG downgrade)', value:'$5.1M–$11.3M', color:T.red },
              { label:'Stranded procurement contracts', value:'$2.8M–$6.4M', color:T.amber },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:i%2===0?T.surfaceH:'transparent', borderRadius:4, marginBottom:4, cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.borderLeft=`3px solid ${item.color}`}
                onMouseLeave={e=>e.currentTarget.style.borderLeft='3px solid transparent'}>
                <span style={{ fontFamily:T.font, fontSize:11, color:T.text }}>{item.label}</span>
                <span style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:item.color }}>{item.value}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', background:T.navy+'08', borderRadius:6, marginTop:8 }}>
              <span style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy }}>TOTAL INACTION RISK</span>
              <span style={{ fontFamily:T.mono, fontSize:14, fontWeight:700, color:T.red }}>$32M–$69.2M</span>
            </div>
          </div>
        </div>

        {/* Engagement table */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy }}>SUPPLIER ENGAGEMENT PROGRAMME — CDP SUPPLY CHAIN</div>
            <div style={{ display:'flex', gap:8 }}>
              <input placeholder="Search supplier..." value={engSearchTerm} onChange={e=>setEngSearchTerm(e.target.value)}
                style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:11, width:160, background:T.surface, color:T.text }} />
              <button onClick={() => setShowExport(true)}
                style={{ padding:'5px 14px', borderRadius:6, border:`1px solid ${T.gold}`, background:T.gold, color:'#fff', fontFamily:T.mono, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                Export CSV
              </button>
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
              <thead>
                <tr>
                  {['#','Supplier','Stage','Emissions tCO2e','Sector','Reduction Target','CDP Score','Last Contact'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.textSec, borderBottom:`1px solid ${T.border}`, background:T.surfaceH }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPipeline.map((p, i) => {
                  const stageIdx = ENGAGEMENT_STAGES.indexOf(p.stage);
                  const stageColors = ['#94a3b8','#0ea5e9','#f59e0b','#8b5cf6','#10b981','#16a34a'];
                  return (
                    <tr key={p.id} style={{ cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.textMut, borderBottom:`1px solid ${T.border}` }}>{i+1}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.text, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{p.name}</td>
                      <td style={{ padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>
                        <span style={{ fontFamily:T.mono, fontSize:10, padding:'2px 8px', borderRadius:4, background:stageColors[stageIdx]+'18', color:stageColors[stageIdx], fontWeight:700 }}>{p.stage}</span>
                      </td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, fontWeight:700, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{p.emissions.toLocaleString()}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{p.sector}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:p.target==='Pending'?T.textMut:T.sage, borderBottom:`1px solid ${T.border}` }}>{p.target}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:['A','A-'].includes(p.cdpScore)?T.green:['B','B-'].includes(p.cdpScore)?T.sage:T.textMut, fontWeight:700, borderBottom:`1px solid ${T.border}` }}>{p.cdpScore}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{p.lastContact}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CDP Supply Chain Programme integration */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>CDP SUPPLY CHAIN PROGRAMME STATUS</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Total suppliers requested', value:'200', color:T.navy },
                { label:'CDP responses received', value:'127 (63.5%)', color:T.sage },
                { label:'A/A- list suppliers', value:'18', color:T.green },
                { label:'Non-responders', value:'73 (36.5%)', color:T.red },
                { label:'First-time responders 2025', value:'31', color:'#0ea5e9' },
                { label:'SBTi-committed suppliers', value:'42 (21%)', color:T.gold },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:i%2===0?T.surfaceH:'transparent', borderRadius:4, cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderLeft=`3px solid ${item.color}`}
                  onMouseLeave={e => e.currentTarget.style.borderLeft='3px solid transparent'}>
                  <span style={{ fontFamily:T.font, fontSize:11, color:T.text }}>{item.label}</span>
                  <span style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement progress over quarters */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>ENGAGEMENT PROGRESS — 12 QUARTERS</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={Array.from({length:12}, (_,q) => ({
                quarter: `Q${(q%4)+1} ${2021+Math.floor(q/4)}`,
                engaged: Math.round(8 + q * 2.8 + sr(q*71)*4),
                dataShared: Math.round(3 + q * 1.9 + sr(q*73)*3),
                targetSet: Math.round(1 + q * 1.2 + sr(q*79)*2),
                verified: Math.round(q * 0.6 + sr(q*83)*1.5),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="quarter" tick={{ fontSize:9, fontFamily:T.mono, fill:T.textMut }} />
                <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} />
                <Tooltip content={<CTooltip />} />
                <Legend wrapperStyle={{ fontFamily:T.mono, fontSize:10 }} />
                <Area type="monotone" dataKey="engaged" stackId="1" fill="#0ea5e9" stroke="#0ea5e9" name="Engaged" />
                <Area type="monotone" dataKey="dataShared" stackId="1" fill="#f59e0b" stroke="#f59e0b" name="Data Shared" />
                <Area type="monotone" dataKey="targetSet" stackId="1" fill="#8b5cf6" stroke="#8b5cf6" name="Target Set" />
                <Area type="monotone" dataKey="verified" stackId="1" fill="#16a34a" stroke="#16a34a" name="Verified" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reduction pathway chart */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:20 }}>
          <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>SCOPE 3 REDUCTION PATHWAY — BAU vs TARGET vs ACTUAL</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={Array.from({length:11}, (_,y) => ({
              year: String(2020+y),
              bau: Math.round(scenarioResult.totalEm * (1 + y * 0.02)),
              target: Math.round(scenarioResult.totalEm * (1 - y * 0.042)),
              actual: y <= 5 ? Math.round(scenarioResult.totalEm * (1 - y * 0.028 + sr(y*37)*0.015)) : null,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="year" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} />
              <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textMut }} tickFormatter={fmt} />
              <Tooltip content={<CTooltip />} />
              <Legend wrapperStyle={{ fontFamily:T.mono, fontSize:10 }} />
              <Line type="monotone" dataKey="bau" stroke={T.red} strokeDasharray="5 5" strokeWidth={2} name="BAU Trajectory" dot={false} />
              <Line type="monotone" dataKey="target" stroke={T.green} strokeWidth={2} name="SBTi Target (-42%)" dot={false} />
              <Line type="monotone" dataKey="actual" stroke={T.gold} strokeWidth={3} name="Actual Progress" dot={{ fill:T.gold, r:4 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:16, marginTop:8 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.red }}>BAU: +2% YoY growth</div>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.green }}>Target: -4.2% YoY (SBTi 1.5C)</div>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.gold }}>Actual: -2.8% avg achieved</div>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>Gap to target: 1.4% YoY acceleration needed</div>
          </div>
        </div>

        {/* Sector-level Scope 3 benchmarks */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:20 }}>
          <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.navy, marginBottom:12 }}>SECTOR SCOPE 3 INTENSITY BENCHMARKS</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Sector','Avg Scope 3 (tCO2e)','Intensity (tCO2e/$M Rev)','SBTi Pathway','Coverage Required','Target Year'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontFamily:T.mono, fontSize:10, color:T.textSec, borderBottom:`1px solid ${T.border}`, background:T.surfaceH }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTORS.slice(0,10).map((sec, i) => {
                  const sectorCos = companies.filter(c => c.sector === sec);
                  const avgEmissions = sectorCos.length > 0 ? Math.round(sectorCos.reduce((a,c) => a+c.totalScope3, 0) / sectorCos.length) : 0;
                  const avgRev = sectorCos.length > 0 ? Math.round(sectorCos.reduce((a,c) => a+c.revenue, 0) / sectorCos.length) : 1;
                  const intensity = avgRev > 0 ? (avgEmissions / avgRev).toFixed(1) : '0';
                  const pathways = ['Well-below 2C','1.5C','FLAG','Cross-sector','FLAG','1.5C','Well-below 2C','Cross-sector','1.5C','FLAG'];
                  return (
                    <tr key={sec} style={{ cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.text, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{sec}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:700, borderBottom:`1px solid ${T.border}` }}>{fmt(avgEmissions)}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:Number(intensity)>100?T.red:Number(intensity)>30?T.amber:T.green, borderBottom:`1px solid ${T.border}` }}>{intensity}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:10, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{pathways[i]}</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.text, borderBottom:`1px solid ${T.border}` }}>67%</td>
                      <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>2030</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export simulation modal */}
        {showExport && (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
            onClick={() => setShowExport(false)}>
            <div style={{ background:T.surface, borderRadius:12, padding:24, maxWidth:420, width:'90%', border:`2px solid ${T.gold}` }} onClick={e=>e.stopPropagation()}>
              <div style={{ fontFamily:T.mono, fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>EXPORT ENGAGEMENT REPORT</div>
              <div style={{ fontFamily:T.font, fontSize:12, color:T.textSec, marginBottom:16 }}>
                Export 40 supplier engagement records as CSV including: supplier name, stage, emissions, sector, reduction target, CDP score, last contact date.
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { setShowExport(false); alert('Engagement report exported: scope3_supplier_engagement_2025.csv'); }}
                  style={{ flex:1, padding:'8px 16px', borderRadius:6, background:T.gold, color:'#fff', border:'none', fontFamily:T.mono, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  Download CSV
                </button>
                <button onClick={() => setShowExport(false)}
                  style={{ padding:'8px 16px', borderRadius:6, background:T.surface, color:T.text, border:`1px solid ${T.border}`, fontFamily:T.mono, fontSize:12, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      {/* Header */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'16px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.textMut, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>EP-AP1 / Scope 3 Upstream</div>
            <div style={{ fontFamily:T.font, fontSize:20, fontWeight:700, color:T.navy }}>Scope 3 Upstream Emissions Tracker</div>
            <div style={{ fontFamily:T.font, fontSize:12, color:T.textSec, marginTop:2 }}>GHG Protocol Categories 1-8 | {companies.length} companies | 200 suppliers/co | 3 methodologies | 12Q history</div>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.textMut, padding:'4px 10px', background:T.surfaceH, borderRadius:4 }}>
              TOTAL UPSTREAM: {fmt(totalUpstream)} tCO2e
            </div>
            <div style={{ width:8, height:8, borderRadius:'50%', background:T.green, boxShadow:`0 0 6px ${T.green}` }} title="Live" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:'20px 24px', maxWidth:1400, margin:'0 auto' }}>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'Category Dashboard' && renderCategoryDashboard()}
        {tab === 'Supplier Emissions Engine' && renderSupplierEngine()}
        {tab === 'Methodology Comparison' && renderMethodologyComparison()}
        {tab === 'Reduction Targets & Engagement' && renderReductionTargets()}
      </div>
    </div>
  );
}
