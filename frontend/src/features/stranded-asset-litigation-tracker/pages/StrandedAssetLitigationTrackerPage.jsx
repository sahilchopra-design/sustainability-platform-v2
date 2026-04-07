import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line,
  Cell, Legend, PieChart, Pie, ScatterChart, Scatter,
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a',
  sageL:'#7ba67d', teal:'#5a8a6a', text:'#1b3a5c', textSec:'#5c6b7e',
  textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706',
  blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', card:'#ffffff',
  sub:'#f6f4f0', indigo:'#4f46e5',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace",
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ASSET_TYPES = ['Coal Plant','Oil Field','Gas Terminal','LNG Facility','Refinery','Coal Mine','Oil Sands','Petrochemical'];
const COMPANIES_LIST = ['ExxonMobil','Shell','BP','Chevron','TotalEnergies','RWE','E.ON','Vattenfall','Peabody','Arch Coal','Glencore','BHP','Rio Tinto','Vale','Anglo American'];
const JURISDICTIONS = ['US','UK','Australia','Germany','Netherlands','Canada','Brazil','South Africa'];
const ASSET_SUFFIXES = ['Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta'];
const REG_TRIGGERS_LIST = ['Carbon Tax >$150','Fossil Fuel Ban','Stranding Mandate','Permit Revocation'];

const ASSETS = Array.from({ length: 35 }, (_, i) => ({
  id: `AST-${i + 1}`,
  name: `${ASSET_TYPES[i % 8]} ${ASSET_SUFFIXES[i % 8]}-${Math.ceil((i + 1) / 8)}`,
  company: COMPANIES_LIST[i % 15],
  assetType: ASSET_TYPES[i % 8],
  jurisdiction: JURISDICTIONS[i % 8],
  bookValue: Math.round(200 + sr(i * 37) * 1800),
  strandingRisk: Math.round(15 + sr(i * 37 + 1) * 80),
  litigationExposure: Math.round(10 + sr(i * 37 + 2) * 290),
  activeLitigations: Math.round(sr(i * 37 + 3) * 8),
  writeDownOrderly: -(Math.round(5 + sr(i * 37 + 4) * 30)),
  writeDownDelayed: -(Math.round(15 + sr(i * 37 + 5) * 45)),
  writeDownDisorderly: -(Math.round(30 + sr(i * 37 + 6) * 55)),
  creditorClaims: Math.round(50 + sr(i * 37 + 7) * 450),
  regulatoryTrigger: REG_TRIGGERS_LIST[Math.floor(sr(i * 37 + 8) * 4)],
}));

const SCENARIOS = [
  { name: 'NGFS Net Zero 2050', prob: 0.35, avgWriteDown: -22, litMultiplier: 1.8, color: T.green },
  { name: 'NGFS Delayed Transition', prob: 0.30, avgWriteDown: -38, litMultiplier: 2.4, color: T.amber },
  { name: 'NGFS Current Policies', prob: 0.20, avgWriteDown: -58, litMultiplier: 3.1, color: T.red },
  { name: 'Regulatory Shock', prob: 0.15, avgWriteDown: -71, litMultiplier: 4.2, color: T.purple },
];

const CREDITOR_NAMES = [
  'BlackRock','Vanguard','State Street','HSBC','JPMorgan','Goldman','Deutsche Bank',
  'BNP Paribas','Citigroup','Barclays','Credit Suisse','UBS','Allianz','Munich Re',
  'Aviva','Prudential','Fidelity','T.Rowe Price','Pimco','CalPERS',
];
const CREDITOR_TYPES = [
  'Senior','Senior','Mezzanine','Sub','Senior','Senior','Mezzanine','Sub','Senior','Senior',
  'Mezzanine','Sub','Senior','Senior','Mezzanine','Sub','Senior','Senior','Mezzanine','Sub',
];

const CREDITORS = Array.from({ length: 20 }, (_, i) => ({
  creditor: CREDITOR_NAMES[i],
  type: CREDITOR_TYPES[i],
  exposure: Math.round(100 + sr(i * 43) * 900),
  ltv: +(0.3 + sr(i * 43 + 1) * 0.6).toFixed(2),
  covenantBreachProb: +(sr(i * 43 + 2) * 0.65).toFixed(2),
  expectedLoss: Math.round(20 + sr(i * 43 + 3) * 280),
}));

// 12-quarter timeline Q1 2025 through Q4 2027
const QUARTERS = ['Q1\'25','Q2\'25','Q3\'25','Q4\'25','Q1\'26','Q2\'26','Q3\'26','Q4\'26','Q1\'27','Q2\'27','Q3\'27','Q4\'27'];
const WRITE_DOWN_TIMELINE = QUARTERS.map((q, qi) => ({
  quarter: q,
  orderly: +(qi * (22 / 11)).toFixed(1),
  delayed: +(qi * (38 / 11)).toFixed(1),
  disorderly: +(qi * (58 / 11)).toFixed(1),
}));

const REGULATORY_TRIGGERS = [
  'Carbon Tax >$150/t',
  'Fossil Fuel Phase-out Mandate',
  'Import Carbon Border Adjustment',
  'Stranding Disclosure Mandate',
  'Stranded Asset Write-Down Rule',
  'Fossil Fuel Permit Revocation',
  'Carbon Budget Exhaustion',
  'Investor Fiduciary Duty Rule',
].map((trigger, j) => ({
  trigger,
  probability: +(0.2 + sr(j * 53) * 0.65).toFixed(2),
  jurisdiction: JURISDICTIONS[j % JURISDICTIONS.length],
  affectedAssets: Math.round(5 + sr(j * 53 + 1) * 20),
  exposureImpact: Math.round(200 + sr(j * 53 + 2) * 800),
}));

const TYPE_COLORS = {
  'Coal Plant': T.red, 'Oil Field': T.orange, 'Gas Terminal': T.amber,
  'LNG Facility': T.gold, 'Refinery': T.purple, 'Coal Mine': '#78350f',
  'Oil Sands': T.navy, 'Petrochemical': T.indigo,
};

const riskColor = (v) => v >= 70 ? T.red : v >= 40 ? T.amber : T.green;
const riskBg = (v) => v >= 70 ? '#fee2e2' : v >= 40 ? '#fef3c7' : '#dcfce7';
const probColor = (v) => v >= 0.6 ? T.red : v >= 0.4 ? T.amber : T.green;
const probBg = (v) => v >= 0.6 ? '#fee2e2' : v >= 0.4 ? '#fef3c7' : '#dcfce7';

const TABS = ['Asset Registry','Litigation Scenarios','Creditor Exposure','Write-Down Impact','Regulatory Triggers'];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 150, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color, bg }) => (
  <span style={{ background: bg || '#e0e7ff', color: color || T.indigo, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, fontFamily: T.mono }}>{label}</span>
);

export default function StrandedAssetLitigationTrackerPage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [jurisFilter, setJurisFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [sortCol, setSortCol] = useState('strandingRisk');
  const [sortDir, setSortDir] = useState('desc');
  const [credSort, setCredSort] = useState('exposure');
  const [credSortDir, setCredSortDir] = useState('desc');

  const filtered = useMemo(() => {
    let arr = ASSETS;
    if (typeFilter !== 'All') arr = arr.filter(a => a.assetType === typeFilter);
    if (jurisFilter !== 'All') arr = arr.filter(a => a.jurisdiction === jurisFilter);
    if (companyFilter !== 'All') arr = arr.filter(a => a.company === companyFilter);
    return [...arr].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      return sortDir === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
    });
  }, [typeFilter, jurisFilter, companyFilter, sortCol, sortDir]);

  // Tab 0 KPIs
  const kpis0 = useMemo(() => {
    if (!filtered.length) return { bookValueB: 0, avgRisk: 0, totalLitExposure: 0, highRisk: 0, writeDownNpv: 0 };
    const bookValueB = (filtered.reduce((s, a) => s + a.bookValue, 0) / 1000).toFixed(1);
    const avgRisk = Math.round(filtered.reduce((s, a) => s + a.strandingRisk, 0) / filtered.length);
    const totalLitExposure = filtered.reduce((s, a) => s + a.litigationExposure, 0);
    const highRisk = filtered.filter(a => a.strandingRisk >= 70).length;
    const writeDownNpv = Math.abs(Math.round(filtered.reduce((s, a) => s + a.bookValue * a.writeDownOrderly / 100, 0)));
    return { bookValueB, avgRisk, totalLitExposure, highRisk, writeDownNpv };
  }, [filtered]);

  const typeRiskBar = useMemo(() => ASSET_TYPES.map(t => {
    const arr = ASSETS.filter(a => a.assetType === t);
    const avg = arr.length ? Math.round(arr.reduce((s, a) => s + a.strandingRisk, 0) / arr.length) : 0;
    return { type: t.split(' ').slice(-1)[0], fullType: t, avg };
  }), []);

  const bookValuePie = useMemo(() => ASSET_TYPES.map(t => {
    const arr = ASSETS.filter(a => a.assetType === t);
    const total = arr.reduce((s, a) => s + a.bookValue, 0);
    return { name: t, value: total, fill: TYPE_COLORS[t] };
  }).filter(d => d.value > 0), []);

  // Tab 1 — Litigation Scenarios
  const scenarioTypeBar = useMemo(() => ASSET_TYPES.map(t => {
    const arr = ASSETS.filter(a => a.assetType === t);
    if (!arr.length) return null;
    const avgBook = arr.reduce((s, a) => s + a.bookValue, 0) / arr.length;
    return {
      type: t.split(' ').slice(0, 2).join(' '),
      orderly: Math.round(avgBook * (SCENARIOS[0].avgWriteDown / -100)),
      delayed: Math.round(avgBook * (SCENARIOS[1].avgWriteDown / -100)),
      disorderly: Math.round(avgBook * (SCENARIOS[2].avgWriteDown / -100)),
      shock: Math.round(avgBook * (SCENARIOS[3].avgWriteDown / -100)),
    };
  }).filter(Boolean), []);

  const totalBookValue = useMemo(() => ASSETS.reduce((s, a) => s + a.bookValue, 0), []);

  const scenarioAreaData = useMemo(() => WRITE_DOWN_TIMELINE.map(q => ({
    quarter: q.quarter,
    orderly: +(totalBookValue * (1 - q.orderly / 100) / 1000).toFixed(1),
    delayed: +(totalBookValue * (1 - q.delayed / 100) / 1000).toFixed(1),
    disorderly: +(totalBookValue * (1 - q.disorderly / 100) / 1000).toFixed(1),
  })), [totalBookValue]);

  const scenarioMatrix = useMemo(() => SCENARIOS.map(sc => ({
    name: sc.name,
    prob: `${(sc.prob * 100).toFixed(0)}%`,
    avgWriteDown: `${sc.avgWriteDown}%`,
    litMultiplier: `${sc.litMultiplier}x`,
    totalWriteDown: `$${Math.abs(Math.round(totalBookValue * sc.avgWriteDown / 100)).toLocaleString()}M`,
    totalLitExposure: `$${Math.round(ASSETS.reduce((s, a) => s + a.litigationExposure, 0) * sc.litMultiplier).toLocaleString()}M`,
    color: sc.color,
  })), [totalBookValue]);

  // Tab 2 — Creditor Exposure
  const sortedCreditors = useMemo(() => [...CREDITORS].sort((a, b) => {
    const av = a[credSort], bv = b[credSort];
    return credSortDir === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
  }), [credSort, credSortDir]);

  const kpis2 = useMemo(() => {
    const totalExp = CREDITORS.reduce((s, c) => s + c.exposure, 0);
    const avgLtv = (CREDITORS.reduce((s, c) => s + c.ltv, 0) / CREDITORS.length).toFixed(2);
    const highBreach = CREDITORS.filter(c => c.covenantBreachProb > 0.4).length;
    const totalLoss = CREDITORS.reduce((s, c) => s + c.expectedLoss, 0);
    return { totalExp, avgLtv, highBreach, totalLoss };
  }, []);

  const credTypeBar = useMemo(() => {
    const map = {};
    CREDITORS.forEach(c => { map[c.type] = (map[c.type] || 0) + c.exposure; });
    return Object.entries(map).map(([type, exp]) => ({ type, exposure: exp }));
  }, []);

  const top10Cred = useMemo(() => [...CREDITORS].sort((a, b) => b.exposure - a.exposure).slice(0, 10).map(c => ({
    name: c.creditor.split(' ').slice(-1)[0],
    fullName: c.creditor,
    exposure: c.exposure,
  })), []);

  const credPie = useMemo(() => {
    const map = { Senior: 0, Mezzanine: 0, Sub: 0 };
    CREDITORS.forEach(c => { map[c.type] = (map[c.type] || 0) + c.exposure; });
    const CRED_COLORS = { Senior: T.navy, Mezzanine: T.amber, Sub: T.red };
    return Object.entries(map).map(([type, value]) => ({ name: type, value, fill: CRED_COLORS[type] }));
  }, []);

  // Tab 3 — Write-Down Impact
  const wdTimelineData = useMemo(() => WRITE_DOWN_TIMELINE, []);

  const wdTypeBar = useMemo(() => ASSET_TYPES.map(t => {
    const arr = ASSETS.filter(a => a.assetType === t);
    if (!arr.length) return null;
    const avgBook = arr.reduce((s, a) => s + a.bookValue, 0) / arr.length;
    return {
      type: t.split(' ').slice(0, 2).join(' '),
      orderly: Math.abs(Math.round(avgBook * SCENARIOS[0].avgWriteDown / 100)),
      delayed: Math.abs(Math.round(avgBook * SCENARIOS[1].avgWriteDown / 100)),
      disorderly: Math.abs(Math.round(avgBook * SCENARIOS[2].avgWriteDown / 100)),
    };
  }).filter(Boolean), []);

  const credLossDelayed = useMemo(() => {
    const map = { Senior: 0, Mezzanine: 0, Sub: 0 };
    CREDITORS.forEach(c => { map[c.type] = (map[c.type] || 0) + Math.round(c.expectedLoss * SCENARIOS[1].litMultiplier); });
    return Object.entries(map).map(([type, loss]) => ({ type, loss }));
  }, []);

  const scatterAssets = useMemo(() => ASSETS.map((a, i) => ({
    x: a.bookValue,
    y: a.strandingRisk,
    z: a.litigationExposure,
    name: a.name,
    type: a.assetType,
    fill: TYPE_COLORS[a.assetType] || T.navy,
  })), []);

  // Tab 4 — Regulatory Triggers
  const triggerSorted = useMemo(() => [...REGULATORY_TRIGGERS].sort((a, b) => b.probability - a.probability), []);
  const triggerPie = useMemo(() => {
    const cats = ['Carbon Pricing','Fuel Phase-out','Border Mechanisms','Disclosure Rules'];
    return REGULATORY_TRIGGERS.map((t, i) => ({
      name: cats[i % cats.length],
      value: Math.round(t.probability * 100),
      fill: [T.navy, T.red, T.amber, T.sage][i % 4],
    }));
  }, []);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const handleCredSort = (col) => {
    if (credSort === col) setCredSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setCredSort(col); setCredSortDir('desc'); }
  };

  const SortIcon = ({ col, active, dir }) => (
    <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: 10 }}>{active && dir === 'asc' ? '▲' : '▼'}</span>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '18px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.gold, color: T.navy, borderRadius: 4, padding: '3px 10px', fontFamily: T.mono, fontWeight: 700, fontSize: 12 }}>EP-DA4</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#ffffff' }}>Stranded Asset Litigation Tracker</h1>
        </div>
        <div style={{ color: T.goldL, fontSize: 13, fontFamily: T.mono }}>35 assets · write-down scenarios · creditor exposure · regulatory triggers</div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 400,
            color: tab === i ? T.navy : T.textSec,
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1600 }}>

        {/* TAB 0 — Asset Registry */}
        {tab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Asset Type', value: typeFilter, set: setTypeFilter, options: ASSET_TYPES },
                { label: 'Jurisdiction', value: jurisFilter, set: setJurisFilter, options: JURISDICTIONS },
                { label: 'Company', value: companyFilter, set: setCompanyFilter, options: COMPANIES_LIST },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{f.label}</label>
                  <select value={f.value} onChange={e => f.set(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, fontFamily: T.font, fontSize: 13, color: T.text }}>
                    <option value="All">All</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Kpi label="Total Book Value" value={`$${kpis0.bookValueB}B`} sub="filtered assets" />
              <Kpi label="Wtd Avg Stranding Risk" value={`${kpis0.avgRisk}`} sub="composite score" color={riskColor(kpis0.avgRisk)} />
              <Kpi label="Total Lit. Exposure" value={`$${kpis0.totalLitExposure.toLocaleString()}M`} sub="litigation claims" color={T.red} />
              <Kpi label="Assets >70 Risk" value={kpis0.highRisk} sub="high stranding risk" color={T.red} />
              <Kpi label="Write-Down NPV (Orderly)" value={`$${kpis0.writeDownNpv.toLocaleString()}M`} sub="NGFS Net Zero 2050" color={T.amber} />
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, overflowX: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Asset Registry ({filtered.length} assets)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {[
                      { label: 'Asset', key: null },
                      { label: 'Company', key: 'company' },
                      { label: 'Type', key: 'assetType' },
                      { label: 'Jurisdiction', key: 'jurisdiction' },
                      { label: 'Book Value $M', key: 'bookValue' },
                      { label: 'Stranding Risk', key: 'strandingRisk' },
                      { label: 'Lit. Exposure $M', key: 'litigationExposure' },
                      { label: 'Active Litigations', key: 'activeLitigations' },
                    ].map(h => (
                      <th key={h.label} onClick={() => h.key && handleSort(h.key)}
                        style={{ textAlign: 'left', padding: '8px 10px', color: T.textMut, fontFamily: T.mono, fontWeight: 600, fontSize: 11, cursor: h.key ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
                        {h.label}{h.key && <SortIcon col={h.key} active={sortCol === h.key} dir={sortDir} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, i) => (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? T.surface : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy, fontFamily: T.mono, fontSize: 11 }}>{a.id}</td>
                      <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{a.company}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ background: `${TYPE_COLORS[a.assetType]}22`, color: TYPE_COLORS[a.assetType], borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600 }}>{a.assetType}</span>
                      </td>
                      <td style={{ padding: '7px 10px', color: T.textSec }}>{a.jurisdiction}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{a.bookValue.toLocaleString()}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ background: riskBg(a.strandingRisk), color: riskColor(a.strandingRisk), borderRadius: 4, padding: '2px 6px', fontFamily: T.mono, fontWeight: 700, fontSize: 11 }}>{a.strandingRisk}</span>
                      </td>
                      <td style={{ padding: '7px 10px', fontFamily: T.mono, color: a.litigationExposure > 150 ? T.red : T.text }}>{a.litigationExposure}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.mono, textAlign: 'center' }}>{a.activeLitigations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Avg Stranding Risk by Asset Type</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={typeRiskBar} layout="vertical" margin={{ top: 4, right: 16, left: 80, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: T.textSec }} width={80} />
                    <Tooltip formatter={(v, n, p) => [v, p.payload.fullType]} contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Bar dataKey="avg" name="Avg Risk" radius={[0, 3, 3, 0]}>
                      {typeRiskBar.map((d, i) => <Cell key={i} fill={TYPE_COLORS[d.fullType] || T.navy} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 280, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Book Value by Asset Type ($M)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={bookValuePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}
                      label={({ name, percent }) => `${name.split(' ').slice(-1)[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {bookValuePie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={(v) => [`$${v.toLocaleString()}M`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1 — Litigation Scenarios */}
        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Scenario cards */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {SCENARIOS.map(sc => (
                <div key={sc.name} style={{ flex: 1, minWidth: 200, background: T.card, border: `2px solid ${sc.color}`, borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 8 }}>{sc.name}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ background: `${sc.color}22`, color: sc.color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: T.mono }}>P={Math.round(sc.prob * 100)}%</span>
                    <span style={{ background: '#fee2e2', color: T.red, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: T.mono }}>{sc.avgWriteDown}% WD</span>
                    <span style={{ background: '#fef3c7', color: T.amber, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: T.mono }}>{sc.litMultiplier}x Lit</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>
                    Total write-down: <strong style={{ color: T.navy, fontFamily: T.mono }}>${Math.abs(Math.round(totalBookValue * sc.avgWriteDown / 100)).toLocaleString()}M</strong>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 380, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Write-Down % by Asset Type — All Scenarios</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={scenarioTypeBar} margin={{ top: 4, right: 12, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="orderly" name="NGFS NZ 2050" fill={T.green} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="delayed" name="NGFS Delayed" fill={T.amber} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="disorderly" name="Current Policies" fill={T.red} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="shock" name="Reg Shock" fill={T.purple} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Portfolio Book Value Under 3 Scenarios ($B, 12Q)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={scenarioAreaData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: T.textSec }} interval={2} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="orderly" name="NZ 2050" stroke={T.green} fill="#dcfce7" strokeWidth={2} />
                    <Area type="monotone" dataKey="delayed" name="Delayed" stroke={T.amber} fill="#fef3c7" strokeWidth={2} />
                    <Area type="monotone" dataKey="disorderly" name="Curr. Policies" stroke={T.red} fill="#fee2e2" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, overflowX: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Scenario Comparison Matrix</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Scenario','Probability','Avg Write-Down','Lit. Multiplier','Total Write-Down $','Total Lit. Exposure $'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMut, fontFamily: T.mono, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scenarioMatrix.map((sc, i) => (
                    <tr key={sc.name} style={{ background: i % 2 === 0 ? T.surface : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: sc.color, marginRight: 6 }}></span>
                        {sc.name}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{sc.prob}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono, color: T.red, fontWeight: 700 }}>{sc.avgWriteDown}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono, color: T.amber }}>{sc.litMultiplier}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{sc.totalWriteDown}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{sc.totalLitExposure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2 — Creditor Exposure */}
        {tab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Kpi label="Total Creditor Exposure" value={`$${kpis2.totalExp.toLocaleString()}M`} sub="all 20 creditors" />
              <Kpi label="Avg LTV" value={kpis2.avgLtv} sub="loan-to-value ratio" color={T.amber} />
              <Kpi label="High Covenant Breach" value={kpis2.highBreach} sub="prob > 0.4" color={T.red} />
              <Kpi label="Expected Total Loss" value={`$${kpis2.totalLoss.toLocaleString()}M`} sub="base case" color={T.red} />
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, overflowX: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Creditor Exposure Table</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {[
                      { label: 'Creditor', key: 'creditor' },
                      { label: 'Type', key: 'type' },
                      { label: 'Exposure $M', key: 'exposure' },
                      { label: 'LTV', key: 'ltv' },
                      { label: 'Covenant Breach Prob', key: 'covenantBreachProb' },
                      { label: 'Expected Loss $M', key: 'expectedLoss' },
                    ].map(h => (
                      <th key={h.label} onClick={() => handleCredSort(h.key)}
                        style={{ textAlign: 'left', padding: '8px 10px', color: T.textMut, fontFamily: T.mono, fontWeight: 600, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {h.label}<SortIcon col={h.key} active={credSort === h.key} dir={credSortDir} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCreditors.map((c, i) => (
                    <tr key={c.creditor} style={{ background: i % 2 === 0 ? T.surface : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{c.creditor}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <Badge label={c.type} color={c.type === 'Senior' ? T.navy : c.type === 'Mezzanine' ? T.amber : T.red} bg={c.type === 'Senior' ? T.sub : c.type === 'Mezzanine' ? '#fef3c7' : '#fee2e2'} />
                      </td>
                      <td style={{ padding: '7px 10px', fontFamily: T.mono, fontWeight: 700 }}>{c.exposure.toLocaleString()}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{c.ltv.toFixed(2)}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ background: probBg(c.covenantBreachProb), color: probColor(c.covenantBreachProb), borderRadius: 4, padding: '2px 6px', fontFamily: T.mono, fontWeight: 700, fontSize: 11 }}>{(c.covenantBreachProb * 100).toFixed(0)}%</span>
                      </td>
                      <td style={{ padding: '7px 10px', fontFamily: T.mono, color: c.expectedLoss > 150 ? T.red : T.text }}>{c.expectedLoss.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Exposure by Creditor Type</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={credTypeBar} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 12, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={v => [`$${v.toLocaleString()}M`]} />
                    <Bar dataKey="exposure" name="Exposure $M" radius={[3, 3, 0, 0]}>
                      {credTypeBar.map((d, i) => <Cell key={i} fill={[T.navy, T.amber, T.red][i % 3]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Top 10 Creditors by Exposure</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={top10Cred} layout="vertical" margin={{ top: 4, right: 16, left: 70, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={70} />
                    <Tooltip formatter={(v, n, p) => [`$${v.toLocaleString()}M`, p.payload.fullName]} contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Bar dataKey="exposure" name="Exposure $M" fill={T.navyL} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 240, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Creditor Type Distribution (Exposure)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={credPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {credPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={v => [`$${v.toLocaleString()}M`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 — Write-Down Impact */}
        {tab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 360, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>12-Quarter Write-Down Trajectory — 3 Scenarios (%)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={wdTimelineData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: T.textSec }} interval={2} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={(v) => [`${v.toFixed(1)}%`]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="orderly" name="NGFS NZ 2050" stroke={T.green} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="delayed" name="NGFS Delayed" stroke={T.amber} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="disorderly" name="Current Policies" stroke={T.red} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 280, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Creditor Expected Loss by Type — Delayed Scenario</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={credLossDelayed} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 12, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={v => [`$${v.toLocaleString()}M`]} />
                    <Bar dataKey="loss" name="Expected Loss $M" radius={[3, 3, 0, 0]}>
                      {credLossDelayed.map((d, i) => <Cell key={i} fill={[T.navy, T.amber, T.red][i % 3]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Write-Down Magnitude by Asset Type — 3 Scenarios ($M avg per asset)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={wdTypeBar} margin={{ top: 4, right: 12, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={v => [`$${v}M`]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="orderly" name="NZ 2050" fill={T.green} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="delayed" name="Delayed" fill={T.amber} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="disorderly" name="Curr. Policies" fill={T.red} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Book Value vs Stranding Risk — Bubble Size = Litigation Exposure</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" dataKey="x" name="Book Value $M" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Book Value $M', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                  <YAxis type="number" dataKey="y" name="Stranding Risk" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Stranding Risk', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontFamily: T.font, fontSize: 12 }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 11, fontFamily: T.font }}>
                          <div style={{ fontWeight: 700, color: T.navy }}>{d.name}</div>
                          <div>Book Value: <strong>${d.x}M</strong></div>
                          <div>Stranding Risk: <strong>{d.y}</strong></div>
                          <div>Lit. Exposure: <strong>${d.z}M</strong></div>
                        </div>
                      );
                    }} />
                  <Scatter data={scatterAssets} fill={T.navy}>
                    {scatterAssets.map((d, i) => (
                      <Cell key={i} fill={d.fill} fillOpacity={0.8} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 4 — Regulatory Triggers */}
        {tab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, overflowX: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Regulatory Trigger Register</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Trigger','Probability','Jurisdiction','Assets Affected','Portfolio Impact $M'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMut, fontFamily: T.mono, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REGULATORY_TRIGGERS.map((r, i) => (
                    <tr key={r.trigger} style={{ background: i % 2 === 0 ? T.surface : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{r.trigger}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: probBg(r.probability), color: probColor(r.probability), borderRadius: 4, padding: '2px 7px', fontFamily: T.mono, fontWeight: 700, fontSize: 11 }}>{(r.probability * 100).toFixed(0)}%</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{r.jurisdiction}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{r.affectedAssets}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono, fontWeight: 700, color: r.exposureImpact > 700 ? T.red : T.text }}>${r.exposureImpact.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Trigger Probability (Sorted Desc)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={triggerSorted.map(r => ({ name: r.trigger.split(' ').slice(0, 3).join(' '), prob: Math.round(r.probability * 100) }))} layout="vertical" margin={{ top: 4, right: 16, left: 110, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={110} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={v => [`${v}%`]} />
                    <Bar dataKey="prob" name="Probability %" fill={T.red} radius={[0, 3, 3, 0]}>
                      {triggerSorted.map((d, i) => <Cell key={i} fill={probColor(d.probability)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Portfolio Impact by Trigger ($M)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[...REGULATORY_TRIGGERS].sort((a, b) => b.exposureImpact - a.exposureImpact).map(r => ({
                    name: r.trigger.split(' ').slice(0, 3).join(' '),
                    impact: r.exposureImpact,
                  }))} layout="vertical" margin={{ top: 4, right: 16, left: 110, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={110} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={v => [`$${v.toLocaleString()}M`]} />
                    <Bar dataKey="impact" name="Impact $M" fill={T.amber} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 240, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Trigger Category Distribution</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={triggerPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                      label={({ name, percent }) => `${name.split(' ').slice(0, 2).join(' ')} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {triggerPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: T.navy, borderTop: `2px solid ${T.gold}`, padding: '14px 32px', marginTop: 40 }}>
        <div style={{ fontSize: 11, color: T.goldL, fontFamily: T.mono, lineHeight: 1.6 }}>
          <strong>Methodology:</strong> Stranding Risk = composite of: carbon intensity percentile (30%), transition scenario alignment (25%), regulatory exposure (25%), financial buffer (20%). Write-down scenarios follow NGFS Phase IV pathways. Litigation exposure = book value × stranding risk × jurisdiction litigation multiplier. Creditor expected loss = exposure × LTV × default probability.
        </div>
      </div>
    </div>
  );
}
