import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#263248', border: '#334155', borderL: '#2d3f55',
  navy: '#60a5fa', navyL: '#93c5fd', gold: '#fbbf24', goldL: '#fcd34d',
  sage: '#34d399', sageL: '#6ee7b7', teal: '#2dd4bf', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#f87171', green: '#4ade80',
  amber: '#fb923c', font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;
const COLORS = [T.navy, T.gold, T.sage, T.teal, T.amber, T.red, T.navyL, T.goldL, '#a78bfa', '#f472b6'];
const tip = { contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, fontFamily: T.font }, labelStyle: { color: T.textSec, fontSize: 10 } };

const SECTORS = ['Electronics', 'Automotive', 'Textiles', 'Agriculture', 'Mining', 'Chemicals', 'Food & Bev', 'Pharma', 'Logistics', 'Packaging'];
const RISK_LEVELS = ['Critical', 'High', 'Medium', 'Low', 'Very Low'];
const REGIONS = ['China', 'India', 'Vietnam', 'Bangladesh', 'Mexico', 'Brazil', 'Indonesia', 'Germany', 'US', 'Taiwan', 'South Korea', 'Malaysia', 'Thailand', 'Philippines', 'Turkey', 'South Africa'];

const SUPPLIERS = Array.from({ length: 150 }, (_, i) => {
  const sector = SECTORS[i % SECTORS.length];
  const region = REGIONS[Math.floor(sr(i * 7) * REGIONS.length)];
  const esgScore = Math.round(sr(i * 11) * 60 + 20);
  const riskLevel = RISK_LEVELS[Math.min(4, Math.floor((100 - esgScore) / 20))];
  const carbonIntensity = Math.round(sr(i * 13) * 500 + 50);
  const laborScore = Math.round(sr(i * 17) * 60 + 20);
  const envScore = Math.round(sr(i * 19) * 60 + 25);
  const deforestRisk = sr(i * 23) < 0.3 ? 'High' : sr(i * 23) < 0.6 ? 'Medium' : 'Low';
  const humanRightsFlags = Math.floor(sr(i * 29) * 5);
  const ddStatus = sr(i * 31) < 0.35 ? 'Audited' : sr(i * 31) < 0.65 ? 'In Progress' : 'Pending';
  const tier = Math.ceil(sr(i * 37) * 3);
  return {
    id: i + 1,
    name: `${sector.replace(' & ', '').replace(/\s/g, '').substring(0, 5)}-S${String(i + 1).padStart(3, '0')}`,
    sector, region, tier,
    esgScore, riskLevel, carbonIntensity, laborScore, envScore,
    deforestRisk, humanRightsFlags, ddStatus,
    annualSpend: Math.round(sr(i * 41) * 500 + 10),
    scope3Contribution: Math.round(sr(i * 43) * 15 + 1),
    certifications: Math.floor(sr(i * 47) * 5),
    waterRisk: sr(i * 53) < 0.3 ? 'High' : sr(i * 53) < 0.6 ? 'Medium' : 'Low',
    childLaborRisk: sr(i * 59) < 0.2 ? 'High' : sr(i * 59) < 0.5 ? 'Medium' : 'Low',
    conflictMinerals: sr(i * 61) < 0.15,
    lastAudit: `${2022 + Math.floor(sr(i * 67) * 3)}-${String(Math.ceil(sr(i * 71) * 12)).padStart(2, '0')}`,
    remediationItems: Math.floor(sr(i * 73) * 4),
    ghgScope1: Math.round(sr(i * 79) * 50000 + 1000),
    ghgScope2: Math.round(sr(i * 83) * 20000 + 500),
    renewableEnergy: Math.round(sr(i * 89) * 80),
    paymentTerms: [30, 45, 60, 90][Math.floor(sr(i * 97) * 4)],
    onTimeDelivery: Math.round(sr(i * 101) * 30 + 70),
  };
});

const SECTOR_RISK_PROFILE = SECTORS.map((s, i) => ({
  sector: s,
  laborRisk: Math.round(sr(i * 7) * 60 + 20),
  envRisk: Math.round(sr(i * 11) * 60 + 20),
  deforestRisk: Math.round(sr(i * 13) * 60 + 10),
  carbonRisk: Math.round(sr(i * 17) * 60 + 25),
  hrRisk: Math.round(sr(i * 19) * 60 + 15),
}));

const DD_REGS = [
  { reg: 'EU CSDDD (Corporate Sustainability Due Diligence)', scope: 'Large EU companies & non-EU if EU turnover >€150M', focus: 'Human rights + environment', effective: '2026', tier: 'Direct + indirect' },
  { reg: 'German LkSG (Supply Chain Act)', scope: 'Companies >1,000 employees in Germany', focus: 'Human rights, env. obligations', effective: '2023', tier: 'Direct + 2nd tier' },
  { reg: 'French Duty of Vigilance Law', scope: 'Companies >5,000 employees in France', focus: 'Human rights + environment', effective: '2017', tier: 'Direct' },
  { reg: 'UK Modern Slavery Act', scope: 'Companies >£36M UK turnover', focus: 'Forced labour', effective: '2015', tier: 'All tiers' },
  { reg: 'US Uyghur Forced Labor Prevention Act (UFLPA)', scope: 'Imports into US from Xinjiang', focus: 'Forced labour', effective: '2022', tier: 'All tiers' },
  { reg: 'EU Conflict Minerals Regulation', scope: 'EU importers of 3TG minerals', focus: 'Conflict minerals', effective: '2021', tier: 'All tiers' },
  { reg: 'EU Deforestation Regulation (EUDR)', scope: 'Operators placing commodities on EU market', focus: 'Deforestation', effective: '2025', tier: 'All tiers' },
  { reg: 'SEC Climate Disclosure (Scope 3)', scope: 'Public companies (stayed pending review)', focus: 'GHG in supply chain', effective: 'TBD', tier: 'Direct' },
  { reg: 'Australia Modern Slavery Act', scope: 'Entities with >A$100M annual turnover', focus: 'Modern slavery risk', effective: '2019', tier: 'All tiers' },
  { reg: 'EU Battery Regulation', scope: 'Battery manufacturers / EV supply chains', focus: 'Carbon footprint, recycled content, due diligence', effective: '2024', tier: 'All tiers' },
];

const HR_HOTSPOTS = [
  { region: 'China', issue: 'Forced labour / Xinjiang cotton & polysilicon', severity: 'Critical', sectors: 'Textiles, Electronics' },
  { region: 'Bangladesh', issue: 'Worker safety, wage theft, factory fires', severity: 'High', sectors: 'Textiles, Food & Bev' },
  { region: 'India', issue: 'Child labour, bonded labour, mica mining', severity: 'High', sectors: 'Agriculture, Mining' },
  { region: 'DRC', issue: 'Artisanal cobalt mining, child labour', severity: 'Critical', sectors: 'Electronics, Automotive (EV)' },
  { region: 'Brazil', issue: 'Land rights violations, deforestation', severity: 'High', sectors: 'Agriculture, Food & Bev' },
  { region: 'Indonesia', issue: 'Migrant labour, palm oil deforestation', severity: 'High', sectors: 'Agriculture, Food & Bev' },
  { region: 'Philippines', issue: 'Labour rights, mining abuses', severity: 'Medium', sectors: 'Mining, Electronics' },
  { region: 'Vietnam', issue: 'Freedom of association restrictions', severity: 'Medium', sectors: 'Electronics, Textiles' },
  { region: 'Thailand', issue: 'Migrant worker exploitation in fishing', severity: 'Medium', sectors: 'Food & Bev, Logistics' },
  { region: 'Turkey', issue: 'Syrian refugee labour, child labour risk', severity: 'Medium', sectors: 'Textiles, Agriculture' },
];

const DEFOREST_COMMODITIES = [
  { commodity: 'Soy', exposedPct: 42, hotspotRegion: 'Brazil / Argentina', linkedSectors: 'Food & Bev, Agriculture', eudrScope: true },
  { commodity: 'Palm Oil', exposedPct: 38, hotspotRegion: 'Indonesia / Malaysia', linkedSectors: 'Food & Bev, Chemicals', eudrScope: true },
  { commodity: 'Beef', exposedPct: 35, hotspotRegion: 'Brazil / Paraguay', linkedSectors: 'Food & Bev', eudrScope: true },
  { commodity: 'Cocoa', exposedPct: 28, hotspotRegion: 'Ivory Coast / Ghana', linkedSectors: 'Food & Bev', eudrScope: true },
  { commodity: 'Timber', exposedPct: 22, hotspotRegion: 'Brazil / Congo / SE Asia', linkedSectors: 'Chemicals, Packaging', eudrScope: true },
  { commodity: 'Coffee', exposedPct: 18, hotspotRegion: 'Brazil / Vietnam / Ethiopia', linkedSectors: 'Food & Bev', eudrScope: true },
  { commodity: 'Rubber', exposedPct: 15, hotspotRegion: 'Thailand / Vietnam', linkedSectors: 'Automotive, Chemicals', eudrScope: true },
  { commodity: 'Maize', exposedPct: 12, hotspotRegion: 'Brazil / Argentina / Mexico', linkedSectors: 'Agriculture, Food & Bev', eudrScope: false },
];

const TREND_DATA = Array.from({ length: 6 }, (_, i) => ({
  year: `${2020 + i}`,
  'Audited Suppliers': Math.round(40 + i * 12 + sr(i * 7) * 5),
  'HR Flags Resolved': Math.round(18 + i * 8 + sr(i * 11) * 4),
  'Avg ESG Score': Math.round(42 + i * 3.5 + sr(i * 13) * 2),
  'Critical Risk Suppliers': Math.round(28 - i * 3 + sr(i * 17) * 3),
}));

const CERT_STANDARDS = [
  { cert: 'ISO 14001', type: 'Environmental MS', desc: 'Environmental management system certification', suppliers: Math.round(sr(7) * 40 + 20), sectors: 'All', mandatory: false },
  { cert: 'SA8000', type: 'Social', desc: 'Social accountability — labour rights, child labour, safety', suppliers: Math.round(sr(11) * 25 + 10), sectors: 'Textiles, Agriculture, Electronics', mandatory: false },
  { cert: 'ISO 45001', type: 'OHS', desc: 'Occupational health and safety management', suppliers: Math.round(sr(13) * 35 + 15), sectors: 'Mining, Chemicals, Automotive', mandatory: false },
  { cert: 'FSC', type: 'Forestry', desc: 'Forest Stewardship Council — sustainable forestry', suppliers: Math.round(sr(17) * 20 + 5), sectors: 'Packaging, Chemicals', mandatory: false },
  { cert: 'RSPO', type: 'Deforestation', desc: 'Roundtable on Sustainable Palm Oil', suppliers: Math.round(sr(19) * 18 + 4), sectors: 'Food & Bev, Chemicals', mandatory: false },
  { cert: 'Rainforest Alliance', type: 'Agriculture', desc: 'Sustainable agriculture & forestry certification', suppliers: Math.round(sr(23) * 22 + 8), sectors: 'Agriculture, Food & Bev', mandatory: false },
  { cert: 'B Corp', type: 'Holistic ESG', desc: 'Certified B Corporation — social & environmental performance', suppliers: Math.round(sr(29) * 12 + 3), sectors: 'All', mandatory: false },
  { cert: 'Sedex/SMETA', type: 'Social Audit', desc: 'Sedex Members Ethical Trade Audit', suppliers: Math.round(sr(31) * 38 + 18), sectors: 'Textiles, Food & Bev, Electronics', mandatory: false },
  { cert: 'CDP Climate A', type: 'Climate Disclosure', desc: 'CDP Climate Change A-List rating', suppliers: Math.round(sr(37) * 15 + 4), sectors: 'All', mandatory: false },
  { cert: 'GoodWeave', type: 'Child Labour', desc: 'No child labour in carpets & textiles', suppliers: Math.round(sr(41) * 10 + 2), sectors: 'Textiles', mandatory: false },
  { cert: 'Fairtrade', type: 'Social/Labor', desc: 'Fair trade premium and labour standards', suppliers: Math.round(sr(43) * 14 + 4), sectors: 'Agriculture, Food & Bev', mandatory: false },
  { cert: 'ISO 50001', type: 'Energy', desc: 'Energy management system', suppliers: Math.round(sr(47) * 28 + 10), sectors: 'Chemicals, Automotive, Electronics', mandatory: false },
];

const TIER_ANALYSIS = [1, 2, 3].map(tier => {
  const sups = SUPPLIERS.filter(s => s.tier === tier);
  const n = Math.max(1, sups.length);
  return {
    tier: `Tier ${tier}`,
    count: sups.length,
    avgEsg: Math.round(sups.reduce((s, r) => s + r.esgScore, 0) / n),
    critical: sups.filter(s => s.riskLevel === 'Critical').length,
    audited: sups.filter(s => s.ddStatus === 'Audited').length,
    hrFlags: sups.reduce((s, r) => s + r.humanRightsFlags, 0),
    avgCarbon: Math.round(sups.reduce((s, r) => s + r.carbonIntensity, 0) / n),
    conflictMinerals: sups.filter(s => s.conflictMinerals).length,
    avgSpend: Math.round(sups.reduce((s, r) => s + r.annualSpend, 0) / n),
  };
});

const CARBON_TRACE = SECTORS.map((sec, i) => {
  const sups = SUPPLIERS.filter(s => s.sector === sec);
  const n = Math.max(1, sups.length);
  return {
    sector: sec,
    scope1Total: Math.round(sups.reduce((s, r) => s + r.ghgScope1, 0) / 1000),
    scope2Total: Math.round(sups.reduce((s, r) => s + r.ghgScope2, 0) / 1000),
    avgIntensity: Math.round(sups.reduce((s, r) => s + r.carbonIntensity, 0) / n),
    renewableEnergy: Math.round(sups.reduce((s, r) => s + r.renewableEnergy, 0) / n),
    supplierCount: sups.length,
  };
});

const REMEDIATION_DATA = [
  { id: 'R001', supplier: 'Texti-S007', issue: 'Child labour risk in cotton sourcing (Bangladesh T1)', priority: 'Critical', status: 'In Progress', deadline: '2025-Q2', costUSD: 45000, expectedROI: 'License to operate', owner: 'Procurement' },
  { id: 'R002', supplier: 'Elect-S012', issue: 'Conflict minerals 3TG — cobalt unverified origin (DRC)', priority: 'Critical', status: 'Pending', deadline: '2025-Q3', costUSD: 120000, expectedROI: 'UFLPA compliance', owner: 'Legal' },
  { id: 'R003', supplier: 'Agric-S021', issue: 'Deforestation risk — soy sourcing without EUDR geolocation', priority: 'High', status: 'In Progress', deadline: '2025-Q4', costUSD: 30000, expectedROI: 'EU market access', owner: 'Sustainability' },
  { id: 'R004', supplier: 'Mining-S034', issue: 'Safety violations — 3 incidents YTD (no ISO 45001)', priority: 'High', status: 'Pending', deadline: '2025-Q2', costUSD: 85000, expectedROI: 'Safety certification', owner: 'Operations' },
  { id: 'R005', supplier: 'FoodBe-S045', issue: 'Palm oil without RSPO certification — EUDR risk', priority: 'High', status: 'Resolved', deadline: '2025-Q1', costUSD: 22000, expectedROI: 'EUDR compliance', owner: 'Sustainability' },
  { id: 'R006', supplier: 'Chemi-S056', issue: 'Water discharge violations — local regulator notice', priority: 'High', status: 'In Progress', deadline: '2025-Q3', costUSD: 65000, expectedROI: 'Regulatory compliance', owner: 'EHS' },
  { id: 'R007', supplier: 'Autom-S067', issue: 'Forced overtime — LkSG risk (Germany)', priority: 'Medium', status: 'Pending', deadline: '2025-Q4', costUSD: 18000, expectedROI: 'LkSG compliance', owner: 'HR' },
  { id: 'R008', supplier: 'Texti-S078', issue: 'No living wage payment — SA8000 non-conformance', priority: 'Medium', status: 'In Progress', deadline: '2025-Q3', costUSD: 35000, expectedROI: 'Social certification', owner: 'Procurement' },
  { id: 'R009', supplier: 'Logis-S089', issue: 'Carbon intensity 3× sector average — no reduction target', priority: 'Medium', status: 'Pending', deadline: '2025-Q4', costUSD: 12000, expectedROI: 'Scope 3 reduction', owner: 'Sustainability' },
  { id: 'R010', supplier: 'Packa-S090', issue: 'FSC chain of custody gap — timber procurement', priority: 'Medium', status: 'Resolved', deadline: '2025-Q1', costUSD: 8000, expectedROI: 'EUDR / FSC compliance', owner: 'Procurement' },
  { id: 'R011', supplier: 'Pharm-S101', issue: 'Solvent discharge without permit (India site)', priority: 'High', status: 'In Progress', deadline: '2025-Q2', costUSD: 95000, expectedROI: 'Regulatory compliance', owner: 'EHS' },
  { id: 'R012', supplier: 'Elect-S112', issue: 'Excessive recruitment fees — migrant workers (Thailand)', priority: 'Medium', status: 'Pending', deadline: '2025-Q3', costUSD: 28000, expectedROI: 'ILO compliance', owner: 'HR' },
  { id: 'R013', supplier: 'Agric-S123', issue: 'No water stewardship plan — drought-stressed region', priority: 'Low', status: 'Pending', deadline: '2025-Q4', costUSD: 9000, expectedROI: 'Water risk mitigation', owner: 'Sustainability' },
  { id: 'R014', supplier: 'Mining-S134', issue: 'No mine closure plan — environmental liability', priority: 'High', status: 'In Progress', deadline: '2025-Q4', costUSD: 180000, expectedROI: 'CSDDD compliance', owner: 'Legal' },
  { id: 'R015', supplier: 'FoodBe-S145', issue: 'Cocoa sourcing from unverified origin (Ivory Coast)', priority: 'High', status: 'Pending', deadline: '2025-Q3', costUSD: 40000, expectedROI: 'EUDR compliance', owner: 'Procurement' },
];

const TABS = ['Overview', 'Supplier Registry', 'Risk Hotspots', 'Human Rights', 'Deforestation', 'Due Diligence', 'Regulatory', 'Tier Analysis', 'Carbon Trace', 'Certifications', 'Remediation'];
const SECTOR_F = ['All', ...SECTORS];
const RISK_F = ['All', ...RISK_LEVELS];
const REGION_F = ['All', ...REGIONS];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const cS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 };
const riskColor = r => ({ Critical: T.red, High: T.amber, Medium: T.gold, Low: T.sage, 'Very Low': T.green }[r] || T.textSec);
const severityColor = s => ({ Critical: T.red, High: T.amber, Medium: T.gold, Low: T.sage }[s] || T.textSec);

export default function SupplyChainMapPage() {
  const [tab, setTab] = useState('Overview');
  const [sectorF, setSectorF] = useState('All');
  const [riskF, setRiskF] = useState('All');
  const [regionF, setRegionF] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [remFilter, setRemFilter] = useState('All');

  const filtered = useMemo(() => SUPPLIERS.filter(s => {
    const bySector = sectorF === 'All' || s.sector === sectorF;
    const byRisk = riskF === 'All' || s.riskLevel === riskF;
    const byRegion = regionF === 'All' || s.region === regionF;
    const bySearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.region.toLowerCase().includes(search.toLowerCase());
    return bySector && byRisk && byRegion && bySearch;
  }), [sectorF, riskF, regionF, search]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filtered.length);
    return {
      count: filtered.length,
      avgEsg: Math.round(filtered.reduce((s, r) => s + r.esgScore, 0) / n),
      critical: filtered.filter(s => s.riskLevel === 'Critical').length,
      hrFlags: filtered.reduce((s, r) => s + r.humanRightsFlags, 0),
      audited: filtered.filter(s => s.ddStatus === 'Audited').length,
      conflictMinerals: filtered.filter(s => s.conflictMinerals).length,
      totalSpend: filtered.reduce((s, r) => s + r.annualSpend, 0),
    };
  }, [filtered]);

  const sectorRiskCount = useMemo(() => {
    const m = {};
    filtered.forEach(s => { m[s.sector] = (m[s.sector] || 0) + (s.riskLevel === 'Critical' || s.riskLevel === 'High' ? 1 : 0); });
    return Object.entries(m).map(([sector, count]) => ({ sector, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const regionCount = useMemo(() => {
    const m = {};
    filtered.forEach(s => { m[s.region] = (m[s.region] || 0) + 1; });
    return Object.entries(m).map(([region, count]) => ({ region, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const exportCSV = useCallback((data, fn) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fn; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const tabBtn = t => ({
    padding: '6px 12px', border: `1px solid ${tab === t ? T.navy : T.border}`,
    borderRadius: 6, fontSize: 11, fontFamily: T.font, cursor: 'pointer',
    background: tab === t ? T.navy : T.surface, color: tab === t ? '#0f172a' : T.textSec, fontWeight: tab === t ? 600 : 400,
  });
  const selS = { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.font, background: T.surface, color: T.text };
  const inpS = { padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font, background: T.surface, color: T.text, outline: 'none', width: 180 };
  const thS = { padding: '8px 10px', fontSize: 11, fontFamily: T.mono, color: T.textSec, borderBottom: `1px solid ${T.border}`, textAlign: 'left', background: T.surfaceH };
  const tdS = { padding: '7px 10px', fontSize: 12, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, color: T.text };

  return (
    <div style={{ padding: '24px 32px', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Supply Chain ESG Mapping</h1>
        <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0' }}>150 suppliers · 10 sectors · Tier analysis · Carbon trace · Certification registry · Remediation tracker · CSDDD/LkSG/EUDR</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>{t}</button>)}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search supplier / region..." style={inpS} />
        <select value={sectorF} onChange={e => setSectorF(e.target.value)} style={selS}>{SECTOR_F.map(s => <option key={s}>{s}</option>)}</select>
        <select value={riskF} onChange={e => setRiskF(e.target.value)} style={selS}>{RISK_F.map(r => <option key={r}>{r}</option>)}</select>
        <select value={regionF} onChange={e => setRegionF(e.target.value)} style={selS}>{REGION_F.map(r => <option key={r}>{r}</option>)}</select>
        <button onClick={() => exportCSV(filtered, 'supply_chain.csv')} style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, background: T.surface, color: T.text, cursor: 'pointer' }}>Export CSV</button>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{kpis.count} suppliers</span>
      </div>

      {tab === 'Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Total Suppliers" value={kpis.count} />
            <KpiCard label="Avg ESG Score" value={`${kpis.avgEsg}/100`} color={kpis.avgEsg > 60 ? T.sage : T.amber} />
            <KpiCard label="Critical Risk" value={kpis.critical} color={T.red} sub="suppliers" />
            <KpiCard label="HR Flags" value={kpis.hrFlags} color={T.amber} sub="total" />
            <KpiCard label="Audited" value={kpis.audited} color={T.green} sub={`${Math.round(kpis.audited / Math.max(1, kpis.count) * 100)}% coverage`} />
            <KpiCard label="Conflict Minerals" value={kpis.conflictMinerals} color={T.red} sub="flagged" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>High/Critical Risk by Sector</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorRiskCount} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 9, fill: T.textSec }} width={90} />
                  <Tooltip {...tip} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {sectorRiskCount.map((e, i) => <Cell key={i} fill={e.count > 6 ? T.red : e.count > 3 ? T.amber : T.sage} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Suppliers by Region</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={regionCount.slice(0, 10)} cx="50%" cy="50%" outerRadius={95} dataKey="count" nameKey="region">
                    {regionCount.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tip} />
                  <Legend formatter={v => <span style={{ fontSize: 10, color: T.textSec }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ESG & Audit Improvement Trend 2020–2025</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Line type="monotone" dataKey="Audited Suppliers" stroke={T.navy} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="HR Flags Resolved" stroke={T.sage} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Avg ESG Score" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Critical Risk Suppliers" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Supplier Registry' && (
        <div>
          <div style={{ ...cS, padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Supplier','Sector','Region','Tier','ESG Score','Risk Level','Carbon CI','HR Flags','Deforest Risk','DD Status','Last Audit'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={i} onClick={() => setSelected(selected?.id === s.id ? null : s)}
                    style={{ cursor: 'pointer', background: selected?.id === s.id ? T.surfaceH : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 11, fontFamily: T.mono }}>{s.name}</td>
                    <td style={tdS}>{s.sector}</td>
                    <td style={tdS}>{s.region}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>T{s.tier}</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 40, height: 5, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${s.esgScore}%`, height: '100%', background: s.esgScore > 60 ? T.sage : s.esgScore > 40 ? T.amber : T.red, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, fontFamily: T.mono }}>{s.esgScore}</span>
                      </div>
                    </td>
                    <td style={tdS}><span style={{ color: riskColor(s.riskLevel), fontWeight: 600, fontSize: 11 }}>{s.riskLevel}</span></td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{s.carbonIntensity}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: s.humanRightsFlags > 2 ? T.red : s.humanRightsFlags > 0 ? T.amber : T.green }}>{s.humanRightsFlags}</td>
                    <td style={tdS}><span style={{ color: riskColor(s.deforestRisk), fontSize: 11 }}>{s.deforestRisk}</span></td>
                    <td style={tdS}><span style={{ color: s.ddStatus === 'Audited' ? T.green : s.ddStatus === 'In Progress' ? T.amber : T.red, fontSize: 11 }}>{s.ddStatus}</span></td>
                    <td style={{ ...tdS, fontFamily: T.mono, fontSize: 10 }}>{s.lastAudit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected && (
            <div style={{ ...cS, marginTop: 16, borderLeft: `3px solid ${riskColor(selected.riskLevel)}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{selected.name} — {selected.sector} · {selected.region}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {[['Region', selected.region],['Tier', `T${selected.tier}`],['ESG Score', `${selected.esgScore}/100`],['Risk Level', selected.riskLevel],['Carbon CI', selected.carbonIntensity],['HR Flags', selected.humanRightsFlags],['Deforest Risk', selected.deforestRisk],['Water Risk', selected.waterRisk],['Child Labour', selected.childLaborRisk],['Conflict Minerals', selected.conflictMinerals ? 'Flagged' : 'Clear'],['Annual Spend', `$${selected.annualSpend}M`],['Scope 3 %', `${selected.scope3Contribution}%`],['GHG Scope 1', `${(selected.ghgScope1/1000).toFixed(0)}kt`],['GHG Scope 2', `${(selected.ghgScope2/1000).toFixed(0)}kt`],['Renewable %', `${selected.renewableEnergy}%`],['On-Time Del.', `${selected.onTimeDelivery}%`],['Certifications', selected.certifications],['Last Audit', selected.lastAudit]].map(([k, v], j) => (
                  <div key={j} style={{ background: T.surfaceH, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Risk Hotspots' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Sector Risk Profile Heatmap</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={SECTOR_RISK_PROFILE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-20} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="laborRisk" fill={T.red} name="Labour Risk" stackId="a" />
                  <Bar dataKey="envRisk" fill={T.amber} name="Env. Risk" stackId="a" />
                  <Bar dataKey="deforestRisk" fill={T.sage} name="Deforest" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ESG Score vs Carbon Intensity</div>
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="ESG Score" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'ESG Score', position: 'bottom', fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="Carbon Intensity" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} content={({ active, payload }) => active && payload?.length ? (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                      <div style={{ color: T.text, fontWeight: 600 }}>{payload[0]?.payload?.name}</div>
                      <div style={{ color: T.textSec }}>ESG: {payload[0]?.payload?.x} | Carbon: {payload[0]?.payload?.y}</div>
                    </div>
                  ) : null} />
                  <Scatter data={filtered.map(s => ({ name: s.name, x: s.esgScore, y: s.carbonIntensity }))} fill={T.teal} fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Human Rights' && (
        <div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Human Rights Hotspot Map</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {HR_HOTSPOTS.map((h, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${severityColor(h.severity)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{h.region}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: severityColor(h.severity), fontFamily: T.mono }}>{h.severity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{h.issue}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>Sectors: {h.sectors}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>HR Flags by Sector</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={SECTORS.map(sec => ({
                  sector: sec,
                  flags: filtered.filter(s => s.sector === sec).reduce((sum, s) => sum + s.humanRightsFlags, 0),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-20} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="flags" fill={T.red} radius={[4, 4, 0, 0]} name="HR Flags" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Social Risk Indicators</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { risk: 'Child Labour High', count: filtered.filter(s => s.childLaborRisk === 'High').length },
                  { risk: 'Child Labour Med', count: filtered.filter(s => s.childLaborRisk === 'Medium').length },
                  { risk: 'Water Risk High', count: filtered.filter(s => s.waterRisk === 'High').length },
                  { risk: 'Water Risk Med', count: filtered.filter(s => s.waterRisk === 'Medium').length },
                  { risk: 'Conflict Minerals', count: filtered.filter(s => s.conflictMinerals).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="risk" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {[T.red, T.amber, T.red, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Deforestation' && (
        <div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>High-Deforestation Commodities — Supply Chain Exposure</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Commodity','Exposure%','Hotspot Region','Linked Sectors','EUDR Scope'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {DEFOREST_COMMODITIES.map((c, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{c.commodity}</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${c.exposedPct}%`, height: '100%', background: c.exposedPct > 35 ? T.red : c.exposedPct > 20 ? T.amber : T.sage, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: T.mono }}>{c.exposedPct}%</span>
                      </div>
                    </td>
                    <td style={tdS}>{c.hotspotRegion}</td>
                    <td style={tdS}>{c.linkedSectors}</td>
                    <td style={tdS}><span style={{ color: c.eudrScope ? T.amber : T.textMut, fontSize: 11, fontWeight: 600 }}>{c.eudrScope ? 'In Scope' : 'Out of Scope'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Deforestation Risk Distribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={[
                    { n: 'High', v: filtered.filter(s => s.deforestRisk === 'High').length },
                    { n: 'Medium', v: filtered.filter(s => s.deforestRisk === 'Medium').length },
                    { n: 'Low', v: filtered.filter(s => s.deforestRisk === 'Low').length },
                  ]} cx="50%" cy="50%" outerRadius={90} dataKey="v" nameKey="n" label={({ n, v }) => `${n}: ${v}`}>
                    {[T.red, T.amber, T.sage].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip {...tip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>EUDR Readiness Actions</div>
              {[
                { action: 'Map commodity origins to cadastre polygons', status: 'Required', deadline: '2025-Q4' },
                { action: 'Geolocation data from tier-2 suppliers', status: 'In Progress', deadline: '2025-Q3' },
                { action: 'No-deforestation clauses in contracts', status: 'Partial', deadline: '2025-Q2' },
                { action: 'Due diligence statement filing system', status: 'Required', deadline: '2025-Q4' },
                { action: 'Satellite deforestation monitoring', status: 'Piloting', deadline: '2025-Q3' },
                { action: 'Supplier EUDR training programme', status: 'In Progress', deadline: '2025-Q2' },
              ].map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{a.action}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>Deadline: {a.deadline}</div>
                  </div>
                  <span style={{ color: a.status === 'In Progress' ? T.amber : a.status === 'Required' ? T.red : a.status === 'Partial' ? T.gold : T.sage, fontSize: 11, fontWeight: 600 }}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Due Diligence' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Audited" value={kpis.audited} color={T.green} sub={`${Math.round(kpis.audited / Math.max(1, kpis.count) * 100)}%`} />
            <KpiCard label="In Progress" value={filtered.filter(s => s.ddStatus === 'In Progress').length} color={T.amber} />
            <KpiCard label="Pending" value={filtered.filter(s => s.ddStatus === 'Pending').length} color={T.red} />
            <KpiCard label="Avg Certifications" value={(filtered.reduce((s, r) => s + r.certifications, 0) / Math.max(1, filtered.length)).toFixed(1)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>DD Status by Sector</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={SECTORS.map(sec => {
                  const sups = filtered.filter(s => s.sector === sec);
                  return { sector: sec, audited: sups.filter(s => s.ddStatus === 'Audited').length, inProgress: sups.filter(s => s.ddStatus === 'In Progress').length, pending: sups.filter(s => s.ddStatus === 'Pending').length };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-20} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="audited" stackId="a" fill={T.green} name="Audited" />
                  <Bar dataKey="inProgress" stackId="a" fill={T.amber} name="In Progress" />
                  <Bar dataKey="pending" stackId="a" fill={T.red} name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Top Scope 3 Contributors</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...filtered].sort((a, b) => b.scope3Contribution - a.scope3Contribution).slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} width={90} />
                  <Tooltip {...tip} />
                  <Bar dataKey="scope3Contribution" fill={T.teal} radius={[0, 4, 4, 0]} name="Scope 3 %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Regulatory' && (
        <div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Supply Chain Due Diligence Regulations</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Regulation','Scope','Focus Areas','Effective','Tier Coverage'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {DD_REGS.map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{r.reg}</td>
                      <td style={{ ...tdS, fontSize: 11 }}>{r.scope}</td>
                      <td style={{ ...tdS, fontSize: 11 }}>{r.focus}</td>
                      <td style={{ ...tdS, fontFamily: T.mono, fontSize: 11, color: r.effective === 'TBD' ? T.textMut : r.effective <= '2023' ? T.green : T.amber }}>{r.effective}</td>
                      <td style={{ ...tdS, fontSize: 11 }}>{r.tier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Compliance Readiness</div>
              {[
                { reg: 'EU CSDDD (2026)', pct: 35, color: T.amber, status: 'Preparing' },
                { reg: 'German LkSG (2023)', pct: 82, color: T.green, status: 'Compliant' },
                { reg: 'UK Modern Slavery Act', pct: 91, color: T.green, status: 'Compliant' },
                { reg: 'EU EUDR (2025)', pct: 48, color: T.amber, status: 'In Progress' },
                { reg: 'US UFLPA (2022)', pct: 78, color: T.green, status: 'Compliant' },
                { reg: 'EU Conflict Minerals Reg.', pct: 85, color: T.green, status: 'Compliant' },
                { reg: 'EU Battery Regulation', pct: 28, color: T.red, status: 'Early Stage' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.text }}>{item.reg}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: item.color }}>{item.status}</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: T.border, borderRadius: 3 }}>
                    <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 9, color: T.textMut, marginTop: 2, fontFamily: T.mono }}>{item.pct}% complete</div>
                </div>
              ))}
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Regulatory Risk by Geography</div>
              <div style={{ overflowY: 'auto', maxHeight: 340 }}>
                {[
                  { region: 'China', regs: ['UFLPA', 'CSDDD'], riskNote: 'Xinjiang-origin goods; UFLPA rebuttable presumption' },
                  { region: 'Bangladesh', regs: ['CSDDD', 'LkSG'], riskNote: 'Labour rights scrutiny; Accord-covered garment factories' },
                  { region: 'DRC', regs: ['Conflict Minerals'], riskNote: 'Cobalt artisanal mining; OECD due diligence required' },
                  { region: 'Brazil', regs: ['EUDR', 'CSDDD'], riskNote: 'Soy/beef deforestation; EUDR geolocation by 2025' },
                  { region: 'Indonesia', regs: ['EUDR', 'CSDDD'], riskNote: 'Palm oil; EUDR commodity scope' },
                  { region: 'India', regs: ['LkSG', 'CSDDD'], riskNote: 'Forced labour mica/cotton; child labour risk' },
                  { region: 'Vietnam', regs: ['UFLPA', 'LkSG'], riskNote: 'Potential tariff circumvention; restricted association' },
                  { region: 'Thailand', regs: ['MSA', 'CSDDD'], riskNote: 'Migrant worker exploitation in fishing' },
                ].map((r, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{r.region}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {r.regs.map(reg => <span key={reg} style={{ background: T.navy + '20', color: T.navy, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontFamily: T.mono }}>{reg}</span>)}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{r.riskNote}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Tier Analysis' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {TIER_ANALYSIS.map((t, i) => (
              <KpiCard key={i} label={t.tier} value={t.count} sub={`${t.critical} critical · ${t.audited} audited`} color={COLORS[i]} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Risk Profile by Tier</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={TIER_ANALYSIS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tier" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="critical" fill={T.red} radius={[4, 4, 0, 0]} name="Critical Risk" />
                  <Bar dataKey="audited" fill={T.green} radius={[4, 4, 0, 0]} name="Audited" />
                  <Bar dataKey="conflictMinerals" fill={T.amber} radius={[4, 4, 0, 0]} name="Conflict Minerals" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ESG Score & Carbon Intensity by Tier</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={TIER_ANALYSIS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tier" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgEsg" fill={T.teal} radius={[4, 4, 0, 0]} name="Avg ESG Score" />
                  <Bar yAxisId="right" dataKey="avgCarbon" fill={T.amber} radius={[4, 4, 0, 0]} name="Avg Carbon CI" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Tier-Level Risk Summary Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Tier','Suppliers','Avg ESG','Critical Risk','Audited','HR Flags','Avg Carbon CI','Conflict Minerals','Avg Spend $M'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {TIER_ANALYSIS.map((t, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 700, color: COLORS[i] }}>{t.tier}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{t.count}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: t.avgEsg > 60 ? T.green : T.amber }}>{t.avgEsg}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: t.critical > 5 ? T.red : T.amber }}>{t.critical}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: T.green }}>{t.audited}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: t.hrFlags > 20 ? T.red : T.amber }}>{t.hrFlags}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{t.avgCarbon}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: T.red }}>{t.conflictMinerals}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{t.avgSpend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 14, padding: '12px 14px', background: T.surfaceH, borderRadius: 8, fontSize: 11, color: T.textSec }}>
              <strong style={{ color: T.amber }}>Note:</strong> Tier 2 and Tier 3 visibility is significantly lower than Tier 1. CSDDD extends due diligence obligations to indirect business relationships (Tier 2+). German LkSG covers direct suppliers (Tier 1) with triggered obligations for Tier 2 if red flags are identified.
            </div>
          </div>
        </div>
      )}

      {tab === 'Carbon Trace' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Total Scope 1 (ktCO₂)" value={CARBON_TRACE.reduce((s, r) => s + r.scope1Total, 0).toLocaleString()} color={T.red} />
            <KpiCard label="Total Scope 2 (ktCO₂)" value={CARBON_TRACE.reduce((s, r) => s + r.scope2Total, 0).toLocaleString()} color={T.amber} />
            <KpiCard label="Avg Renewable Energy" value={`${Math.round(CARBON_TRACE.reduce((s, r) => s + r.renewableEnergy, 0) / Math.max(1, CARBON_TRACE.length))}%`} color={T.sage} />
            <KpiCard label="Highest Intensity Sector" value={[...CARBON_TRACE].sort((a, b) => b.avgIntensity - a.avgIntensity)[0]?.sector || '-'} color={T.red} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Scope 1 + 2 by Sector (ktCO₂e)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CARBON_TRACE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-20} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="scope1Total" stackId="a" fill={T.red} name="Scope 1 (kt)" />
                  <Bar dataKey="scope2Total" stackId="a" fill={T.amber} name="Scope 2 (kt)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Renewable Energy % by Sector</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CARBON_TRACE} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 9, fill: T.textSec }} width={90} />
                  <Tooltip {...tip} />
                  <Bar dataKey="renewableEnergy" radius={[0, 4, 4, 0]} name="Renewable Energy%">
                    {CARBON_TRACE.map((d, i) => <Cell key={i} fill={d.renewableEnergy > 60 ? T.green : d.renewableEnergy > 30 ? T.sage : T.amber} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Carbon Trace by Sector — Detail</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Sector','Suppliers','Scope 1 (ktCO₂)','Scope 2 (ktCO₂)','Avg Intensity','Renewable %'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {[...CARBON_TRACE].sort((a, b) => (b.scope1Total + b.scope2Total) - (a.scope1Total + a.scope2Total)).map((c, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{c.sector}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{c.supplierCount}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: c.scope1Total > 800 ? T.red : T.text }}>{c.scope1Total.toLocaleString()}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: c.scope2Total > 300 ? T.amber : T.text }}>{c.scope2Total.toLocaleString()}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: c.avgIntensity > 350 ? T.red : c.avgIntensity > 200 ? T.amber : T.sage }}>{c.avgIntensity}</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 5, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${c.renewableEnergy}%`, height: '100%', background: c.renewableEnergy > 60 ? T.green : c.renewableEnergy > 30 ? T.sage : T.amber, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 11 }}>{c.renewableEnergy}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Certifications' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Certification Standards" value={CERT_STANDARDS.length} sub="tracked" />
            <KpiCard label="Total Certified Suppliers" value={SUPPLIERS.filter(s => s.certifications > 0).length} color={T.green} sub={`of ${SUPPLIERS.length}`} />
            <KpiCard label="Avg Certifications" value={(SUPPLIERS.reduce((s, r) => s + r.certifications, 0) / Math.max(1, SUPPLIERS.length)).toFixed(1)} color={T.teal} sub="per supplier" />
            <KpiCard label="Zero Certifications" value={SUPPLIERS.filter(s => s.certifications === 0).length} color={T.red} sub="suppliers" />
          </div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Certification Registry</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Certification','Type','Description','Supplier Coverage','Key Sectors','Mandatory?'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {CERT_STANDARDS.map((c, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 700, color: T.navy }}>{c.cert}</td>
                    <td style={tdS}><span style={{ background: T.surfaceH, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontFamily: T.mono }}>{c.type}</span></td>
                    <td style={{ ...tdS, fontSize: 11 }}>{c.desc}</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 50, height: 5, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${Math.min(100, c.suppliers / 1.5)}%`, height: '100%', background: T.navy, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 11 }}>{c.suppliers}</span>
                      </div>
                    </td>
                    <td style={{ ...tdS, fontSize: 11 }}>{c.sectors}</td>
                    <td style={tdS}><span style={{ color: c.mandatory ? T.amber : T.textMut, fontSize: 11 }}>{c.mandatory ? 'Mandatory' : 'Voluntary'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Certification Coverage by Standard</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CERT_STANDARDS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="cert" tick={{ fontSize: 9, fill: T.textSec }} width={120} />
                  <Tooltip {...tip} />
                  <Bar dataKey="suppliers" fill={T.navy} radius={[0, 4, 4, 0]} name="Certified Suppliers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Certifications per Supplier Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[0, 1, 2, 3, 4].map(n => ({ certs: `${n} cert${n !== 1 ? 's' : ''}`, count: filtered.filter(s => s.certifications === n).length }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="certs" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {[T.red, T.amber, T.gold, T.sage, T.green].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Remediation' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Open Items" value={REMEDIATION_DATA.filter(r => r.status !== 'Resolved').length} color={T.red} />
            <KpiCard label="In Progress" value={REMEDIATION_DATA.filter(r => r.status === 'In Progress').length} color={T.amber} />
            <KpiCard label="Resolved" value={REMEDIATION_DATA.filter(r => r.status === 'Resolved').length} color={T.green} />
            <KpiCard label="Critical Priority" value={REMEDIATION_DATA.filter(r => r.priority === 'Critical').length} color={T.red} />
            <KpiCard label="Est. Total Cost" value={`$${(REMEDIATION_DATA.reduce((s, r) => s + r.costUSD, 0) / 1000).toFixed(0)}K`} color={T.gold} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: T.textSec }}>Filter:</span>
            {['All', 'Critical', 'High', 'Medium', 'Low'].map(p => (
              <button key={p} onClick={() => setRemFilter(p)} style={{ padding: '5px 12px', border: `1px solid ${remFilter === p ? T.amber : T.border}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', background: remFilter === p ? T.amber : T.surface, color: remFilter === p ? '#0f172a' : T.textSec }}>
                {p}
              </button>
            ))}
          </div>
          <div style={{ ...cS, padding: 0, overflowX: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['ID','Supplier','Issue','Priority','Status','Deadline','Est. Cost','Expected ROI','Owner'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {REMEDIATION_DATA.filter(r => remFilter === 'All' || r.priority === remFilter).map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontFamily: T.mono, fontSize: 10, color: T.textMut }}>{r.id}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, fontWeight: 600, fontSize: 11 }}>{r.supplier}</td>
                    <td style={{ ...tdS, fontSize: 11, maxWidth: 280 }}>{r.issue}</td>
                    <td style={tdS}><span style={{ color: severityColor(r.priority), fontWeight: 600, fontSize: 11 }}>{r.priority}</span></td>
                    <td style={tdS}><span style={{ color: r.status === 'Resolved' ? T.green : r.status === 'In Progress' ? T.amber : T.red, fontSize: 11, fontWeight: 600 }}>{r.status}</span></td>
                    <td style={{ ...tdS, fontFamily: T.mono, fontSize: 11 }}>{r.deadline}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, fontSize: 11 }}>${(r.costUSD / 1000).toFixed(0)}K</td>
                    <td style={{ ...tdS, fontSize: 11 }}>{r.expectedROI}</td>
                    <td style={{ ...tdS, fontSize: 11 }}>{r.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Remediation Cost by Priority</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={['Critical','High','Medium','Low'].map(p => ({
                  priority: p,
                  cost: Math.round(REMEDIATION_DATA.filter(r => r.priority === p).reduce((s, r) => s + r.costUSD, 0) / 1000),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="priority" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} formatter={v => [`$${v}K`, 'Est. Cost']} />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                    {['Critical','High','Medium','Low'].map((p, i) => <Cell key={i} fill={severityColor(p)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Status by Owner Department</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={['Procurement','Legal','Sustainability','EHS','HR','Operations'].map(owner => ({
                  owner,
                  open: REMEDIATION_DATA.filter(r => r.owner === owner && r.status !== 'Resolved').length,
                  resolved: REMEDIATION_DATA.filter(r => r.owner === owner && r.status === 'Resolved').length,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="owner" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="open" stackId="a" fill={T.amber} name="Open" />
                  <Bar dataKey="resolved" stackId="a" fill={T.green} name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
