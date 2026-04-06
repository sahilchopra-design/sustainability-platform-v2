import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const PIE_COLORS = ['#f59e0b','#3b82f6','#8b5cf6','#06b6d4','#dc2626','#16a34a','#d97706','#ec4899','#0d9488'];

/* ══════════════════════════════════════════════════════════════
   BOND IMPACT METRICS by Use-of-Proceeds Category
   ══════════════════════════════════════════════════════════════ */
const BOND_IMPACT_METRICS = {
  'Renewable Energy': {
    metrics: [
      { name: 'Clean Energy Capacity Installed', unit: 'MW', benchmark: 2.5, per: 'USD Mn invested' },
      { name: 'Annual Clean Energy Generated', unit: 'GWh', benchmark: 4.2, per: 'USD Mn invested' },
      { name: 'GHG Emissions Avoided', unit: 'tCO2e', benchmark: 2800, per: 'USD Mn invested' },
      { name: 'Households Powered', unit: 'count', benchmark: 850, per: 'USD Mn invested' },
    ],
    sdgs: [7, 13], color: '#f59e0b',
  },
  'Clean Transport': {
    metrics: [
      { name: 'EV Charging Stations', unit: 'count', benchmark: 15, per: 'USD Mn invested' },
      { name: 'Rail km Electrified', unit: 'km', benchmark: 0.8, per: 'USD Mn invested' },
      { name: 'GHG Emissions Avoided', unit: 'tCO2e', benchmark: 1500, per: 'USD Mn invested' },
      { name: 'Passengers Served Annually', unit: 'count', benchmark: 50000, per: 'USD Mn invested' },
    ],
    sdgs: [9, 11, 13], color: '#3b82f6',
  },
  'Green Buildings': {
    metrics: [
      { name: 'Floor Area Certified', unit: 'm2', benchmark: 5000, per: 'USD Mn invested' },
      { name: 'Energy Savings', unit: 'MWh/yr', benchmark: 120, per: 'USD Mn invested' },
      { name: 'GHG Emissions Avoided', unit: 'tCO2e', benchmark: 80, per: 'USD Mn invested' },
      { name: 'LEED/BREEAM Certifications', unit: 'count', benchmark: 0.5, per: 'USD Mn invested' },
    ],
    sdgs: [11, 13], color: '#8b5cf6',
  },
  'Water Management': {
    metrics: [
      { name: 'Water Treated', unit: 'megalitres/yr', benchmark: 500, per: 'USD Mn invested' },
      { name: 'People with Clean Water Access', unit: 'count', benchmark: 2000, per: 'USD Mn invested' },
      { name: 'Wastewater Recycled', unit: 'megalitres/yr', benchmark: 200, per: 'USD Mn invested' },
    ],
    sdgs: [6, 14], color: '#06b6d4',
  },
  'Social Housing': {
    metrics: [
      { name: 'Affordable Units Created', unit: 'count', benchmark: 8, per: 'USD Mn invested' },
      { name: 'People Housed', unit: 'count', benchmark: 24, per: 'USD Mn invested' },
      { name: 'Social Housing Renovated', unit: 'm2', benchmark: 2000, per: 'USD Mn invested' },
    ],
    sdgs: [1, 11], color: '#dc2626',
  },
  'Healthcare Access': {
    metrics: [
      { name: 'Hospital Beds Added', unit: 'count', benchmark: 3, per: 'USD Mn invested' },
      { name: 'Patients Served Annually', unit: 'count', benchmark: 5000, per: 'USD Mn invested' },
      { name: 'Vaccines Distributed', unit: 'count', benchmark: 100000, per: 'USD Mn invested' },
    ],
    sdgs: [3], color: '#16a34a',
  },
  'Education': {
    metrics: [
      { name: 'School Places Created', unit: 'count', benchmark: 25, per: 'USD Mn invested' },
      { name: 'Students Supported', unit: 'count', benchmark: 500, per: 'USD Mn invested' },
      { name: 'Teachers Trained', unit: 'count', benchmark: 15, per: 'USD Mn invested' },
    ],
    sdgs: [4], color: '#d97706',
  },
};
const CATEGORIES = Object.keys(BOND_IMPACT_METRICS);

/* ══════════════════════════════════════════════════════════════
   SDG NAMES
   ══════════════════════════════════════════════════════════════ */
const SDG_NAMES = {
  1:'No Poverty',2:'Zero Hunger',3:'Good Health',4:'Quality Education',5:'Gender Equality',
  6:'Clean Water',7:'Affordable Energy',8:'Decent Work',9:'Industry & Innovation',10:'Reduced Inequalities',
  11:'Sustainable Cities',12:'Responsible Consumption',13:'Climate Action',14:'Life Below Water',
  15:'Life on Land',16:'Peace & Justice',17:'Partnerships',
};
const SDG_COLORS = {
  1:'#e5243b',2:'#dda63a',3:'#4c9f38',4:'#c5192d',5:'#ff3a21',6:'#26bde2',7:'#fcc30b',
  8:'#a21942',9:'#fd6925',10:'#dd1367',11:'#fd9d24',12:'#bf8b2e',13:'#3f7e44',14:'#0a97d9',
  15:'#56c02b',16:'#00689d',17:'#19486a',
};

/* ══════════════════════════════════════════════════════════════
   SEED / HELPERS
   ══════════════════════════════════════════════════════════════ */
const seed = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const fmt = (v) => typeof v === 'number' ? (v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : v.toFixed(v < 10 ? 2 : 0)) : v;
const pct = (v) => (v * 100).toFixed(1) + '%';

/* ══════════════════════════════════════════════════════════════
   GENERATE 20 SAMPLE BONDS from FI portfolio or defaults
   ══════════════════════════════════════════════════════════════ */
const generateBonds = (fiBonds) => {
  const names = [
    { issuer:'Iberdrola Green 2031', cat:'Renewable Energy', yield:3.65, size:180 },
    { issuer:'Orsted Wind 2030', cat:'Renewable Energy', yield:3.42, size:120 },
    { issuer:'NextEra Energy 2033', cat:'Renewable Energy', yield:4.15, size:200 },
    { issuer:'SNCF Green 2032', cat:'Clean Transport', yield:2.95, size:150 },
    { issuer:'MTR Corp Green 2029', cat:'Clean Transport', yield:3.18, size:85 },
    { issuer:'Volkswagen EV 2028', cat:'Clean Transport', yield:3.85, size:200 },
    { issuer:'Swire Properties Green 2031', cat:'Green Buildings', yield:3.52, size:95 },
    { issuer:'Lendlease BREEAM 2030', cat:'Green Buildings', yield:4.08, size:75 },
    { issuer:'Thames Water 2029', cat:'Water Management', yield:4.55, size:110 },
    { issuer:'Veolia Water 2032', cat:'Water Management', yield:3.72, size:130 },
    { issuer:'Peabody Housing 2031', cat:'Social Housing', yield:4.85, size:60 },
    { issuer:'Sanctuary Housing 2030', cat:'Social Housing', yield:4.62, size:45 },
    { issuer:'NatWest Social 2029', cat:'Social Housing', yield:3.95, size:90 },
    { issuer:'Pfizer Health Bond 2031', cat:'Healthcare Access', yield:3.28, size:250 },
    { issuer:'IFC Health 2030', cat:'Healthcare Access', yield:3.35, size:200 },
    { issuer:'World Bank Edu 2028', cat:'Education', yield:3.18, size:500 },
    { issuer:'ADB Education 2031', cat:'Education', yield:3.28, size:350 },
    { issuer:'Enel Green 2029', cat:'Renewable Energy', yield:3.52, size:300 },
    { issuer:'Apple Green 2030', cat:'Green Buildings', yield:3.82, size:470 },
    { issuer:'AfDB Social 2029', cat:'Healthcare Access', yield:3.62, size:75 },
  ];
  return names.map((n, i) => ({
    id: `IMP${String(i+1).padStart(3,'0')}`,
    issuer: n.issuer,
    category: n.cat,
    size_mn: n.size,
    yield: n.yield,
    verified: seed(i*3+1) > 0.35 ? 'Verified' : seed(i*3+2) > 0.5 ? 'Estimated' : 'Pending',
    additionality: seed(i*7+3) > 0.3 ? 'High' : seed(i*7+4) > 0.5 ? 'Medium' : 'Low',
    icma_compliant: seed(i*5+5) > 0.25,
    impactScore: Math.round(seed(i*11+6) * 30 + 60),
    sdgs: BOND_IMPACT_METRICS[n.cat].sdgs,
  }));
};

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>
);
const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.font, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: T.font, marginTop: 2 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Badge = ({ label, color }) => {
  const map = { green:{bg:'#dcfce7',text:'#166534'}, red:{bg:'#fee2e2',text:'#991b1b'}, amber:{bg:'#fef3c7',text:'#92400e'}, blue:{bg:'#dbeafe',text:'#1e40af'}, purple:{bg:'#ede9fe',text:'#5b21b6'}, gold:{bg:'#fef9c3',text:'#854d0e'}, gray:{bg:'#f3f4f6',text:'#374151'} };
  const c = map[color] || map.gray;
  return <span style={{ padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:700, background:c.bg, color:c.text }}>{label}</span>;
};
const SortHeader = ({ label, col, sortCol, sortDir, onSort, style }) => (
  <th onClick={() => onSort(col)} style={{ padding:'8px 10px', cursor:'pointer', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, textAlign:'left', whiteSpace:'nowrap', userSelect:'none', ...style }}>
    {label} {sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);
const Btn = ({ children, onClick, primary, small, style }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize: small ? 12 : 13, fontFamily:T.font, background: primary ? T.navy : T.surfaceH, color: primary ? '#fff' : T.text, transition:'all 0.15s', ...style }}>{children}</button>
);
const Section = ({ title, badge, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <div style={{ fontSize:16, fontWeight:700, color:T.navy, fontFamily:T.font }}>{title}</div>
      {badge && <Badge label={badge} color="gold" />}
    </div>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
function SdgBondImpactPage() {
  const navigate = useNavigate();

  /* ── FI Portfolio (WRAPPED) ── */
  const [fiPortfolio] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_fi_portfolio_v1') || '[]'); } catch { return []; }
  });

  /* ── Bond Impact Data (user-entered actuals) ── */
  const [bondImpactData, setBondImpactData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_bond_impact_v1') || '{}'); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem('ra_bond_impact_v1', JSON.stringify(bondImpactData)); }, [bondImpactData]);

  /* ── Generate bonds ── */
  const bonds = useMemo(() => generateBonds(fiPortfolio), [fiPortfolio]);

  /* ── Sort state ── */
  const [sortCol, setSortCol] = useState('size_mn');
  const [sortDir, setSortDir] = useState('desc');
  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ── Category filter ── */
  const [catFilter, setCatFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  /* ── Impact input state ── */
  const [inputBond, setInputBond] = useState(null);
  const [inputValues, setInputValues] = useState({});

  /* ── Computed metrics ── */
  const totalInvested = useMemo(() => bonds.reduce((s, b) => s + b.size_mn, 0), [bonds]);

  const categoryTotals = useMemo(() => {
    const m = {};
    CATEGORIES.forEach(c => { m[c] = { invested: 0, bonds: 0 }; });
    bonds.forEach(b => { if (m[b.category]) { m[b.category].invested += b.size_mn; m[b.category].bonds += 1; } });
    return m;
  }, [bonds]);

  const totalGHG = useMemo(() => {
    let total = 0;
    bonds.forEach(b => {
      const cat = BOND_IMPACT_METRICS[b.category];
      if (!cat) return;
      const ghgM = cat.metrics.find(m => m.name.includes('GHG'));
      if (ghgM) total += ghgM.benchmark * b.size_mn;
    });
    return Math.round(total);
  }, [bonds]);

  const totalEnergy = useMemo(() => {
    let t = 0;
    bonds.forEach(b => {
      const cat = BOND_IMPACT_METRICS[b.category];
      if (!cat) return;
      const m = cat.metrics.find(m => m.name.includes('Clean Energy Generated'));
      if (m) t += m.benchmark * b.size_mn;
    });
    return Math.round(t);
  }, [bonds]);

  const totalPeople = useMemo(() => {
    let t = 0;
    bonds.forEach(b => {
      const cat = BOND_IMPACT_METRICS[b.category];
      if (!cat) return;
      cat.metrics.forEach(m => {
        if (m.name.includes('People') || m.name.includes('Patients') || m.name.includes('Students') || m.name.includes('Households')) {
          t += m.benchmark * b.size_mn;
        }
      });
    });
    return Math.round(t);
  }, [bonds]);

  const totalWater = useMemo(() => {
    let t = 0;
    bonds.forEach(b => {
      const cat = BOND_IMPACT_METRICS[b.category];
      if (!cat) return;
      const m = cat.metrics.find(m => m.name.includes('Water Treated'));
      if (m) t += m.benchmark * b.size_mn;
    });
    return Math.round(t);
  }, [bonds]);

  const totalHousing = useMemo(() => {
    let t = 0;
    bonds.forEach(b => {
      const cat = BOND_IMPACT_METRICS[b.category];
      if (!cat) return;
      const m = cat.metrics.find(m => m.name.includes('Affordable Units'));
      if (m) t += m.benchmark * b.size_mn;
    });
    return Math.round(t);
  }, [bonds]);

  const allSdgs = useMemo(() => {
    const s = new Set();
    bonds.forEach(b => b.sdgs.forEach(x => s.add(x)));
    return s;
  }, [bonds]);

  const avgImpact = useMemo(() => bonds.length ? Math.round(bonds.reduce((s, b) => s + b.impactScore, 0) / bonds.length) : 0, [bonds]);

  /* ── Sorted & filtered bonds ── */
  const sortedBonds = useMemo(() => {
    let arr = catFilter === 'All' ? [...bonds] : bonds.filter(b => b.category === catFilter);
    arr.sort((a, b) => { const va = a[sortCol], vb = b[sortCol]; if (va < vb) return sortDir === 'asc' ? -1 : 1; if (va > vb) return sortDir === 'asc' ? 1 : -1; return 0; });
    return arr;
  }, [bonds, catFilter, sortCol, sortDir]);

  /* ── Category pie data ── */
  const pieCatData = useMemo(() => CATEGORIES.map(c => ({ name: c, value: categoryTotals[c]?.invested || 0 })).filter(d => d.value > 0), [categoryTotals]);

  /* ── SDG contribution data ── */
  const sdgContrib = useMemo(() => {
    const m = {};
    bonds.forEach(b => {
      b.sdgs.forEach(s => {
        if (!m[s]) m[s] = 0;
        m[s] += b.size_mn;
      });
    });
    return Object.entries(m).sort((a,b) => a[0] - b[0]).map(([k,v]) => ({ sdg: +k, name: SDG_NAMES[+k], value: v, color: SDG_COLORS[+k] }));
  }, [bonds]);

  /* ── Impact timeline projection ── */
  const timeline = useMemo(() => {
    const years = [];
    for (let y = 2025; y <= 2035; y++) {
      const factor = (y - 2024);
      years.push({
        year: y,
        ghg: Math.round(totalGHG * factor * 0.92),
        energy: Math.round(totalEnergy * factor * 0.95),
        people: Math.round(totalPeople * factor * 0.88),
        water: Math.round(totalWater * factor * 0.90),
      });
    }
    return years;
  }, [totalGHG, totalEnergy, totalPeople, totalWater]);

  /* ── Scatter: yield vs impact ── */
  const scatterData = useMemo(() => bonds.map(b => ({ x: b.yield, y: b.impactScore, z: b.size_mn, name: b.issuer, category: b.category })), [bonds]);

  /* ── Impact report text gen ── */
  const generateReport = useCallback(() => {
    const lines = [
      'SDG BOND IMPACT REPORT',
      `Report Date: ${new Date().toISOString().slice(0,10)}`,
      `Portfolio: ${bonds.length} bonds, $${totalInvested.toFixed(0)}M invested`,
      '',
      'AGGREGATE IMPACT METRICS:',
      `  GHG Emissions Avoided: ${fmt(totalGHG)} tCO2e`,
      `  Clean Energy Generated: ${fmt(totalEnergy)} GWh`,
      `  People Benefited: ${fmt(totalPeople)}`,
      `  Water Treated: ${fmt(totalWater)} ML/yr`,
      `  Housing Units: ${fmt(totalHousing)}`,
      `  SDGs Covered: ${allSdgs.size} of 17`,
      '',
      'PER-CATEGORY BREAKDOWN:',
    ];
    CATEGORIES.forEach(c => {
      const ct = categoryTotals[c];
      if (!ct || ct.invested === 0) return;
      lines.push(`  ${c}: $${ct.invested}M across ${ct.bonds} bonds`);
      BOND_IMPACT_METRICS[c].metrics.forEach(m => {
        lines.push(`    - ${m.name}: ${fmt(m.benchmark * ct.invested)} ${m.unit}`);
      });
    });
    lines.push('', 'ICMA HARMONIZED FRAMEWORK COMPLIANCE:');
    bonds.forEach(b => { lines.push(`  ${b.issuer}: ${b.icma_compliant ? 'Compliant' : 'Non-Compliant'} | Verification: ${b.verified}`); });
    lines.push('', 'Prepared in accordance with ICMA Harmonized Framework for Impact Reporting.');
    return lines.join('\n');
  }, [bonds, totalInvested, totalGHG, totalEnergy, totalPeople, totalWater, totalHousing, allSdgs, categoryTotals]);

  /* ── Exports ── */
  const exportCSV = useCallback(() => {
    const header = 'Bond,Issuer,Category,Size_Mn,Yield,Impact_Score,Verified,Additionality,ICMA_Compliant,SDGs';
    const rows = bonds.map(b => `${b.id},${b.issuer},${b.category},${b.size_mn},${b.yield},${b.impactScore},${b.verified},${b.additionality},${b.icma_compliant},${b.sdgs.join(';')}`);
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sdg_bond_impact_report.csv'; a.click();
  }, [bonds]);

  const exportJSON = useCallback(() => {
    const data = { generated: new Date().toISOString(), portfolio: { bonds: bonds.length, totalInvested }, sdgAnalysis: sdgContrib, categoryTotals, impactMetrics: { ghg: totalGHG, energy: totalEnergy, people: totalPeople, water: totalWater, housing: totalHousing } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sdg_analysis.json'; a.click();
  }, [bonds, totalInvested, sdgContrib, categoryTotals, totalGHG, totalEnergy, totalPeople, totalWater, totalHousing]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Save bond impact actuals ── */
  const saveBondImpact = useCallback((bondId, values) => {
    setBondImpactData(prev => ({ ...prev, [bondId]: { ...values, updatedAt: new Date().toISOString() } }));
    setInputBond(null);
    setInputValues({});
  }, []);

  const TABS = ['dashboard', 'bonds', 'sdg', 'verification', 'report'];

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      {/* ── 1. HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:800, color:T.navy }}>SDG Bond Impact Reporting</div>
          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
            <Badge label="7 Categories" color="gold" />
            <Badge label="25 Metrics" color="blue" />
            <Badge label="SDG-Linked" color="green" />
            <Badge label="ICMA" color="purple" />
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Btn onClick={exportCSV} small>CSV</Btn>
          <Btn onClick={exportJSON} small>JSON</Btn>
          <Btn onClick={exportPrint} small>Print</Btn>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${activeTab === t ? T.navy : T.border}`, background: activeTab === t ? T.navy : T.surface, color: activeTab === t ? '#fff' : T.text, fontWeight:600, fontSize:12, cursor:'pointer', textTransform:'capitalize', fontFamily:T.font }}>{t}</button>
        ))}
      </div>

      {/* ── 2. KPI CARDS (10) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:24 }}>
        <KPI label="Bonds in Portfolio" value={bonds.length} sub="Active SDG bonds" />
        <KPI label="Total Invested" value={`$${totalInvested.toFixed(0)}M`} sub="Aggregate notional" color={T.sage} />
        <KPI label="Impact Categories" value={CATEGORIES.filter(c => categoryTotals[c]?.invested > 0).length} sub="of 7 categories" />
        <KPI label="GHG Avoided" value={fmt(totalGHG)} sub="tCO2e cumulative" color={T.green} />
        <KPI label="Clean Energy" value={`${fmt(totalEnergy)} GWh`} sub="Annual generation" color={T.amber} />
        <KPI label="People Benefited" value={fmt(totalPeople)} sub="Direct beneficiaries" color="#7c3aed" />
        <KPI label="Water Treated" value={`${fmt(totalWater)} ML`} sub="Megalitres/yr" color="#06b6d4" />
        <KPI label="Housing Units" value={fmt(totalHousing)} sub="Affordable units" color={T.red} />
        <KPI label="SDGs Covered" value={`${allSdgs.size}/17`} sub="Goals addressed" color={T.gold} />
        <KPI label="Avg Impact Score" value={avgImpact} sub="Portfolio average" color={avgImpact >= 75 ? T.green : T.amber} />
      </div>

      {/* ── 3. IMPACT BY CATEGORY PIE ── */}
      {(activeTab === 'dashboard' || activeTab === 'sdg') && (
        <Section title="Impact by Use-of-Proceeds Category" badge="Investment Allocation">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieCatData} cx="50%" cy="50%" outerRadius={110} dataKey="value" nameKey="name" label={({name, percent}) => `${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`}>
                    {pieCatData.map((d, i) => <Cell key={i} fill={BOND_IMPACT_METRICS[d.name]?.color || PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v}M`} />
                </PieChart>
              </ResponsiveContainer>
              <div>
                {CATEGORIES.map(c => {
                  const ct = categoryTotals[c];
                  if (!ct || ct.invested === 0) return null;
                  return (
                    <div key={c} onClick={() => setSelectedCategory(selectedCategory === c ? null : c)} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, marginBottom:4, cursor:'pointer', background: selectedCategory === c ? T.surfaceH : 'transparent', borderLeft:`4px solid ${BOND_IMPACT_METRICS[c].color}` }}>
                      <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{c}</span>
                      <span style={{ fontSize:13, color:T.textSec }}>${ct.invested}M ({ct.bonds})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </Section>
      )}

      {/* ── 4. SDG IMPACT DASHBOARD ── */}
      {(activeTab === 'dashboard' || activeTab === 'sdg') && (
        <Section title="SDG Impact Dashboard" badge="17 Goals">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:10 }}>
              {Array.from({length:17}, (_, i) => i+1).map(sdg => {
                const contrib = sdgContrib.find(s => s.sdg === sdg);
                const active = allSdgs.has(sdg);
                return (
                  <div key={sdg} style={{ padding:12, borderRadius:10, textAlign:'center', background: active ? SDG_COLORS[sdg] + '18' : '#f9f9f9', border: `2px solid ${active ? SDG_COLORS[sdg] : '#eee'}`, opacity: active ? 1 : 0.4 }}>
                    <div style={{ fontSize:22, fontWeight:800, color: SDG_COLORS[sdg] }}>{sdg}</div>
                    <div style={{ fontSize:9, color:T.textSec, fontWeight:600, marginTop:2 }}>{SDG_NAMES[sdg]}</div>
                    {contrib && <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginTop:4 }}>${contrib.value}M</div>}
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>
      )}

      {/* ── 5. PER-BOND IMPACT TABLE (sortable) ── */}
      {(activeTab === 'dashboard' || activeTab === 'bonds') && (
        <Section title="Per-Bond Impact Table" badge={`${sortedBonds.length} Bonds`}>
          <div style={{ marginBottom:10, display:'flex', gap:8, flexWrap:'wrap' }}>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Card style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  <SortHeader label="Bond" col="id" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Issuer" col="issuer" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Category" col="category" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Size ($M)" col="size_mn" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} style={{textAlign:'right'}} />
                  <SortHeader label="Yield (%)" col="yield" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} style={{textAlign:'right'}} />
                  <SortHeader label="Impact" col="impactScore" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} style={{textAlign:'right'}} />
                  <th style={{ padding:'8px 10px', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>SDGs</th>
                  <th style={{ padding:'8px 10px', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedBonds.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding:'8px 10px', fontWeight:600, color:T.navy }}>{b.id}</td>
                    <td style={{ padding:'8px 10px', color:T.text }}>{b.issuer}</td>
                    <td style={{ padding:'8px 10px' }}><span style={{ background: BOND_IMPACT_METRICS[b.category]?.color + '20', color: BOND_IMPACT_METRICS[b.category]?.color, padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{b.category}</span></td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:600 }}>${b.size_mn}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right' }}>{b.yield.toFixed(2)}%</td>
                    <td style={{ padding:'8px 10px', textAlign:'right' }}><span style={{ background: b.impactScore >= 80 ? '#dcfce7' : b.impactScore >= 65 ? '#fef3c7' : '#fee2e2', color: b.impactScore >= 80 ? '#166534' : b.impactScore >= 65 ? '#92400e' : '#991b1b', padding:'2px 8px', borderRadius:6, fontWeight:700, fontSize:11 }}>{b.impactScore}</span></td>
                    <td style={{ padding:'8px 10px' }}>{b.sdgs.map(s => <span key={s} style={{ display:'inline-block', width:22, height:22, borderRadius:'50%', background:SDG_COLORS[s], color:'#fff', fontSize:9, fontWeight:700, textAlign:'center', lineHeight:'22px', marginRight:3 }}>{s}</span>)}</td>
                    <td style={{ padding:'8px 10px' }}><Badge label={b.verified} color={b.verified === 'Verified' ? 'green' : b.verified === 'Estimated' ? 'amber' : 'gray'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      )}

      {/* ── 6. CATEGORY DEEP-DIVE CARDS ── */}
      {(activeTab === 'dashboard' || activeTab === 'bonds') && selectedCategory && (
        <Section title={`Category Deep-Dive: ${selectedCategory}`} badge={BOND_IMPACT_METRICS[selectedCategory].sdgs.map(s => `SDG ${s}`).join(', ')}>
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14, marginBottom:16 }}>
              {BOND_IMPACT_METRICS[selectedCategory].metrics.map((m, i) => {
                const total = m.benchmark * (categoryTotals[selectedCategory]?.invested || 0);
                return (
                  <div key={i} style={{ padding:14, borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceH }}>
                    <div style={{ fontSize:11, color:T.textMut, fontWeight:600 }}>{m.name}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:BOND_IMPACT_METRICS[selectedCategory].color, marginTop:4 }}>{fmt(total)}</div>
                    <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{m.unit} | {m.benchmark} {m.per}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:8 }}>Per-Bond Breakdown</div>
            {bonds.filter(b => b.category === selectedCategory).map(b => (
              <div key={b.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                <span style={{ color:T.text, fontWeight:600 }}>{b.issuer}</span>
                <div style={{ display:'flex', gap:16 }}>
                  {BOND_IMPACT_METRICS[selectedCategory].metrics.map((m, j) => (
                    <span key={j} style={{ color:T.textSec, minWidth:80, textAlign:'right' }}>{fmt(m.benchmark * b.size_mn)} {m.unit}</span>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* ── 7. IMPACT VERIFICATION STATUS ── */}
      {(activeTab === 'dashboard' || activeTab === 'verification') && (
        <Section title="Impact Verification Status" badge="Third-Party Review">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
              {['Verified','Estimated','Pending'].map(s => {
                const cnt = bonds.filter(b => b.verified === s).length;
                return (
                  <div key={s} style={{ padding:16, borderRadius:10, textAlign:'center', background: s === 'Verified' ? '#dcfce7' : s === 'Estimated' ? '#fef3c7' : '#f3f4f6' }}>
                    <div style={{ fontSize:28, fontWeight:800, color: s === 'Verified' ? T.green : s === 'Estimated' ? T.amber : T.textMut }}>{cnt}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.textSec }}>{s}</div>
                    <div style={{ fontSize:11, color:T.textMut }}>{pct(cnt / bonds.length)} of portfolio</div>
                  </div>
                );
              })}
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                <th style={{ padding:'6px 10px', textAlign:'left', fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>Bond</th>
                <th style={{ padding:'6px 10px', textAlign:'left', fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>Issuer</th>
                <th style={{ padding:'6px 10px', textAlign:'center', fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>Verification</th>
                <th style={{ padding:'6px 10px', textAlign:'center', fontSize:11, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>ICMA Compliant</th>
              </tr></thead>
              <tbody>
                {bonds.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding:'6px 10px', fontWeight:600, color:T.navy }}>{b.id}</td>
                    <td style={{ padding:'6px 10px', color:T.text }}>{b.issuer}</td>
                    <td style={{ padding:'6px 10px', textAlign:'center' }}><Badge label={b.verified} color={b.verified === 'Verified' ? 'green' : b.verified === 'Estimated' ? 'amber' : 'gray'} /></td>
                    <td style={{ padding:'6px 10px', textAlign:'center' }}><Badge label={b.icma_compliant ? 'Yes' : 'No'} color={b.icma_compliant ? 'green' : 'red'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      )}

      {/* ── 8. ADDITIONALITY ASSESSMENT ── */}
      {(activeTab === 'dashboard' || activeTab === 'verification') && (
        <Section title="Additionality Assessment" badge="Would Impact Occur Without Bond?">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
              {['High','Medium','Low'].map(a => {
                const cnt = bonds.filter(b => b.additionality === a).length;
                return (
                  <div key={a} style={{ padding:14, borderRadius:10, textAlign:'center', border:`2px solid ${a === 'High' ? T.green : a === 'Medium' ? T.amber : T.red}` }}>
                    <div style={{ fontSize:24, fontWeight:800, color: a === 'High' ? T.green : a === 'Medium' ? T.amber : T.red }}>{cnt}</div>
                    <div style={{ fontSize:12, fontWeight:600 }}>{a} Additionality</div>
                    <div style={{ fontSize:10, color:T.textMut }}>{a === 'High' ? 'Would not occur without bond' : a === 'Medium' ? 'Partially additional' : 'Likely would occur anyway'}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>
      )}

      {/* ── 9. IMPACT VS FINANCIAL RETURN ── */}
      {(activeTab === 'dashboard' || activeTab === 'bonds') && (
        <Section title="Impact vs Financial Return" badge="Win-Win Analysis">
          <Card>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="x" name="Yield (%)" unit="%" tick={{ fontSize: 11 }} label={{ value: 'Yield (%)', position: 'bottom', fontSize: 12 }} />
                <YAxis type="number" dataKey="y" name="Impact Score" tick={{ fontSize: 11 }} label={{ value: 'Impact Score', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <ZAxis type="number" dataKey="z" range={[40, 400]} name="Size ($M)" />
                <Tooltip content={({payload}) => {
                  if (!payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (<div style={{ background:'#fff', padding:10, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }}>
                    <div style={{ fontWeight:700, color:T.navy }}>{d.name}</div>
                    <div>Yield: {d.x.toFixed(2)}% | Impact: {d.y} | Size: ${d.z}M</div>
                    <div style={{ color:T.textMut }}>{d.category}</div>
                  </div>);
                }} />
                <Scatter data={scatterData} fill={T.navy}>
                  {scatterData.map((d, i) => <Cell key={i} fill={BOND_IMPACT_METRICS[d.category]?.color || T.navy} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ textAlign:'center', fontSize:11, color:T.textMut, marginTop:6 }}>Bubble size = bond notional. Top-right = highest return + impact (win-win zone).</div>
          </Card>
        </Section>
      )}

      {/* ── 10. ICMA HARMONIZED FRAMEWORK COMPLIANCE ── */}
      {(activeTab === 'dashboard' || activeTab === 'verification') && (
        <Section title="ICMA Harmonized Framework Compliance" badge="Green Bond Principles">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
              {[
                { check: 'Use of Proceeds defined per ICMA GBP', passed: bonds.filter(b => b.icma_compliant).length, total: bonds.length },
                { check: 'Impact metrics follow ICMA Harmonized Framework', passed: Math.round(bonds.length * 0.85), total: bonds.length },
                { check: 'Second Party Opinion obtained', passed: bonds.filter(b => b.verified !== 'Pending').length, total: bonds.length },
                { check: 'Annual impact report published', passed: bonds.filter(b => b.verified === 'Verified').length, total: bonds.length },
                { check: 'Proceeds tracked in separate account', passed: Math.round(bonds.length * 0.9), total: bonds.length },
                { check: 'SDG mapping provided', passed: bonds.length, total: bonds.length },
              ].map((c, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:12, borderRadius:8, background: c.passed === c.total ? '#dcfce7' : '#fef3c7' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background: c.passed === c.total ? T.green : T.amber, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14 }}>{c.passed === c.total ? '\u2713' : '!'}</div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{c.check}</div>
                    <div style={{ fontSize:11, color:T.textSec }}>{c.passed}/{c.total} bonds</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {/* ── 11. IMPACT TIMELINE ── */}
      {(activeTab === 'dashboard' || activeTab === 'sdg') && (
        <Section title="Projected Cumulative Impact 2025-2035" badge="AreaChart">
          <Card>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={timeline} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={(v, name) => [fmt(v), name]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="ghg" name="GHG Avoided (tCO2e)" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
                <Area type="monotone" dataKey="energy" name="Energy (GWh)" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                <Area type="monotone" dataKey="water" name="Water (ML)" stackId="3" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      )}

      {/* ── 12. BOND IMPACT DATA INPUT ── */}
      {(activeTab === 'dashboard' || activeTab === 'bonds') && (
        <Section title="Bond Impact Data Input" badge="Enter Actuals">
          <Card>
            <div style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>Enter actual reported impact metrics per bond. Data persists to localStorage (ra_bond_impact_v1).</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10 }}>
              {bonds.slice(0, 8).map(b => {
                const cat = BOND_IMPACT_METRICS[b.category];
                const saved = bondImpactData[b.id];
                const isEditing = inputBond === b.id;
                return (
                  <div key={b.id} style={{ padding:14, borderRadius:10, border:`1px solid ${T.border}`, background: saved ? '#dcfce7' : T.surface }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{b.issuer}</div>
                      {saved && <Badge label="Saved" color="green" />}
                    </div>
                    {isEditing ? (
                      <div>
                        {cat.metrics.map((m, j) => (
                          <div key={j} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                            <label style={{ fontSize:10, color:T.textSec, flex:1, minWidth:100 }}>{m.name} ({m.unit})</label>
                            <input type="number" value={inputValues[m.name] || ''} onChange={e => setInputValues(prev => ({ ...prev, [m.name]: e.target.value }))}
                              style={{ width:80, padding:'4px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }} placeholder={String(m.benchmark * b.size_mn)} />
                          </div>
                        ))}
                        <div style={{ display:'flex', gap:6, marginTop:8 }}>
                          <Btn small primary onClick={() => saveBondImpact(b.id, inputValues)}>Save</Btn>
                          <Btn small onClick={() => { setInputBond(null); setInputValues({}); }}>Cancel</Btn>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {saved ? (
                          <div style={{ fontSize:11, color:T.textSec }}>{Object.entries(saved).filter(([k]) => k !== 'updatedAt').map(([k, v]) => <div key={k}>{k}: {v}</div>)}</div>
                        ) : (
                          <div style={{ fontSize:11, color:T.textMut }}>No actuals entered</div>
                        )}
                        <Btn small style={{ marginTop:8 }} onClick={() => { setInputBond(b.id); setInputValues(saved || {}); }}>
                          {saved ? 'Edit' : 'Enter Data'}
                        </Btn>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>
      )}

      {/* ── 13. IMPACT REPORT GENERATOR ── */}
      {(activeTab === 'dashboard' || activeTab === 'report') && (
        <Section title="Impact Report Generator" badge="ICMA-Compliant">
          <Card>
            <div style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>Auto-generated ICMA Harmonized Framework impact report for the bond portfolio.</div>
            <pre style={{ background:T.surfaceH, padding:16, borderRadius:10, fontSize:11, color:T.text, fontFamily:'Consolas,monospace', maxHeight:400, overflow:'auto', whiteSpace:'pre-wrap', lineHeight:1.5 }}>
              {generateReport()}
            </pre>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <Btn primary onClick={() => {
                const blob = new Blob([generateReport()], { type: 'text/plain' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'icma_impact_report.txt'; a.click();
              }}>Download Report</Btn>
              <Btn onClick={() => navigator.clipboard.writeText(generateReport())}>Copy to Clipboard</Btn>
            </div>
          </Card>
        </Section>
      )}

      {/* ── 14. SDG Impact per Category BarChart ── */}
      {(activeTab === 'sdg') && (
        <Section title="SDG Contribution by Category" badge="BarChart">
          <Card>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sdgContrib} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, angle: -25 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={(v) => `$${v}M`} />
                <Bar dataKey="value" name="Investment ($M)">
                  {sdgContrib.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      )}

      {/* ── CATEGORY IMPACT HEATMAP ── */}
      {(activeTab === 'sdg') && (
        <Section title="Category x SDG Impact Heatmap" badge="Cross-Reference">
          <Card style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr>
                  <th style={{ padding:'6px 8px', textAlign:'left', fontSize:10, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>Category</th>
                  {Array.from({length:17}, (_, i) => i+1).map(sdg => (
                    <th key={sdg} style={{ padding:'4px', textAlign:'center', fontSize:9, color: allSdgs.has(sdg) ? SDG_COLORS[sdg] : T.textMut, borderBottom:`1px solid ${T.border}`, fontWeight:700 }}>{sdg}</th>
                  ))}
                  <th style={{ padding:'6px 8px', textAlign:'right', fontSize:10, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((cat, ci) => {
                  const catData = BOND_IMPACT_METRICS[cat];
                  const invested = categoryTotals[cat]?.invested || 0;
                  return (
                    <tr key={cat} style={{ background: ci % 2 ? T.surfaceH : T.surface }}>
                      <td style={{ padding:'6px 8px', fontWeight:600, color:T.navy, whiteSpace:'nowrap' }}>{cat}</td>
                      {Array.from({length:17}, (_, i) => i+1).map(sdg => {
                        const isLinked = catData.sdgs.includes(sdg);
                        return (
                          <td key={sdg} style={{ padding:'4px', textAlign:'center' }}>
                            {isLinked ? (
                              <div style={{ width:22, height:22, borderRadius:'50%', background:SDG_COLORS[sdg], color:'#fff', fontSize:8, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                                {Math.round(invested / catData.sdgs.length)}
                              </div>
                            ) : <span style={{ color:'#ddd' }}>-</span>}
                          </td>
                        );
                      })}
                      <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700, color:catData.color }}>${invested}M</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>
      )}

      {/* ── IMPACT INTENSITY RANKING ── */}
      {(activeTab === 'bonds') && (
        <Section title="Impact Intensity Ranking" badge="Impact per $M Invested">
          <Card>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {bonds.sort((a,b) => b.impactScore - a.impactScore).slice(0, 10).map((b, rank) => {
                const cat = BOND_IMPACT_METRICS[b.category];
                const primaryMetric = cat?.metrics[0];
                const impactVal = primaryMetric ? primaryMetric.benchmark * b.size_mn : 0;
                return (
                  <div key={b.id} style={{ display:'flex', alignItems:'center', gap:12, padding:12, borderRadius:10, border:`1px solid ${T.border}`, background: rank < 3 ? '#dcfce720' : T.surface }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background: rank < 3 ? T.green : rank < 6 ? T.amber : T.textMut, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, flexShrink:0 }}>
                      {rank + 1}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.issuer}</div>
                      <div style={{ fontSize:10, color:T.textSec }}>{b.category} | ${b.size_mn}M</div>
                      {primaryMetric && <div style={{ fontSize:10, color:cat.color, fontWeight:600 }}>{primaryMetric.name}: {fmt(impactVal)} {primaryMetric.unit}</div>}
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:18, fontWeight:800, color: b.impactScore >= 80 ? T.green : T.amber }}>{b.impactScore}</div>
                      <div style={{ fontSize:9, color:T.textMut }}>Impact</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>
      )}

      {/* ── PORTFOLIO IMPACT SUMMARY CARDS ── */}
      {(activeTab === 'report') && (
        <Section title="Portfolio Impact Summary" badge="At a Glance">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
            {CATEGORIES.map(cat => {
              const catData = BOND_IMPACT_METRICS[cat];
              const invested = categoryTotals[cat]?.invested || 0;
              if (invested === 0) return null;
              return (
                <Card key={cat} style={{ borderLeft:`4px solid ${catData.color}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:catData.color, marginBottom:8 }}>{cat}</div>
                  <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>${invested}M across {categoryTotals[cat]?.bonds} bonds</div>
                  {catData.metrics.map((m, j) => {
                    const val = m.benchmark * invested;
                    return (
                      <div key={j} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', fontSize:11 }}>
                        <span style={{ color:T.textSec }}>{m.name}</span>
                        <span style={{ fontWeight:700, color:T.navy }}>{fmt(val)} {m.unit}</span>
                      </div>
                    );
                  })}
                  <div style={{ marginTop:6, display:'flex', gap:4 }}>
                    {catData.sdgs.map(s => <span key={s} style={{ width:20, height:20, borderRadius:'50%', background:SDG_COLORS[s], color:'#fff', fontSize:8, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>{s}</span>)}
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── VERIFICATION PROGRESS TRACKER ── */}
      {(activeTab === 'verification') && (
        <Section title="Verification Progress Tracker" badge="Pipeline">
          <Card>
            <div style={{ marginBottom:16 }}>
              {['Verified','Estimated','Pending'].map(status => {
                const cnt = bonds.filter(b => b.verified === status).length;
                const pctVal = bonds.length ? (cnt / bonds.length * 100) : 0;
                return (
                  <div key={status} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                      <span style={{ fontWeight:600, color:T.text }}>{status}</span>
                      <span style={{ color:T.textSec }}>{cnt} bonds ({pctVal.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height:8, background:T.surfaceH, borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pctVal}%`, background: status === 'Verified' ? T.green : status === 'Estimated' ? T.amber : T.textMut, borderRadius:4, transition:'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
              Third-party verification confirms impact metrics through independent audit. Estimated metrics use benchmark calculations. Pending bonds require impact data submission.
            </div>
          </Card>
        </Section>
      )}

      {/* ── CROSS-NAV FOOTER ── */}
      <div style={{ marginTop:32, paddingTop:16, borderTop:`2px solid ${T.border}` }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Related Modules</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            { label:'FI ESG Scoring', path:'/fixed-income-esg' },
            { label:'IWA Impact Weights', path:'/iwa-impact' },
            { label:'IRIS+ Metrics', path:'/iris-metrics' },
            { label:'SDG Tracker', path:'/sdg-tracker' },
            { label:'Social Bond', path:'/social-bond' },
            { label:'Blended Finance', path:'/blended-finance' },
          ].map(n => (
            <button key={n.path} onClick={() => navigate(n.path)} style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:T.font }}>
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SdgBondImpactPage;
