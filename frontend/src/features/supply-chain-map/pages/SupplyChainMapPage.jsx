import React, { useState, useMemo } from 'react';
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
const COLORS = [T.navy, T.gold, T.sage, T.teal, T.amber, T.red, T.navyL, T.goldL];
const tip = { contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, fontFamily: T.font }, labelStyle: { color: T.textSec, fontSize: 10 } };

const SECTORS = ['Electronics', 'Automotive', 'Textiles', 'Agriculture', 'Mining', 'Chemicals', 'Food & Bev', 'Pharma'];
const RISK_LEVELS = ['Critical', 'High', 'Medium', 'Low', 'Very Low'];
const REGIONS = ['China', 'India', 'Vietnam', 'Bangladesh', 'Mexico', 'Brazil', 'Indonesia', 'Germany', 'US', 'Taiwan', 'South Korea', 'Malaysia'];

const SUPPLIERS = Array.from({ length: 48 }, (_, i) => {
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
    name: `${sector.replace(' & ', '').substring(0, 4)}Supplier-${String(i + 1).padStart(2, '0')}`,
    sector, region, tier,
    esgScore, riskLevel, carbonIntensity,
    laborScore, envScore,
    deforestRisk, humanRightsFlags,
    ddStatus,
    annualSpend: Math.round(sr(i * 41) * 500 + 10),
    scope3Contribution: Math.round(sr(i * 43) * 15 + 1),
    certifications: Math.floor(sr(i * 47) * 4),
    waterRisk: sr(i * 53) < 0.3 ? 'High' : sr(i * 53) < 0.6 ? 'Medium' : 'Low',
    childLaborRisk: sr(i * 59) < 0.2 ? 'High' : sr(i * 59) < 0.5 ? 'Medium' : 'Low',
    conflictMinerals: sr(i * 61) < 0.15,
    lastAudit: `${2022 + Math.floor(sr(i * 67) * 3)}-${String(Math.ceil(sr(i * 71) * 12)).padStart(2, '0')}`,
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
  { reg: 'EU CSDDD (Corp. Sustainability Due Diligence)', scope: 'Large EU companies & non-EU if EU turnover >€150M', focus: 'Human rights + environment', effective: '2026', tier: 'Direct + indirect' },
  { reg: 'German LkSG (Supply Chain Act)', scope: 'Companies >1,000 employees in Germany', focus: 'Human rights, env. obligations', effective: '2023', tier: 'Direct + 2nd tier' },
  { reg: 'French Duty of Vigilance Law', scope: 'Companies >5,000 employees in France', focus: 'Human rights + env.', effective: '2017', tier: 'Direct' },
  { reg: 'UK Modern Slavery Act', scope: 'Companies >£36M UK turnover', focus: 'Forced labour', effective: '2015', tier: 'All tiers' },
  { reg: 'US Uyghur Forced Labor Prevention Act', scope: 'Imports into US from Xinjiang', focus: 'Forced labour', effective: '2022', tier: 'All tiers' },
  { reg: 'EU Conflict Minerals Regulation', scope: 'EU importers of 3TG minerals', focus: 'Conflict minerals', effective: '2021', tier: 'All tiers' },
  { reg: 'EU Deforestation Regulation (EUDR)', scope: 'Operators placing commodities on EU market', focus: 'Deforestation', effective: '2025', tier: 'All tiers' },
  { reg: 'SEC Climate Disclosure (Scope 3)', scope: 'Public companies (stayed pending review)', focus: 'GHG in supply chain', effective: 'TBD', tier: 'Direct' },
];

const HR_HOTSPOTS = [
  { region: 'China', issue: 'Forced labour / Xinjiang cotton', severity: 'Critical', sectors: 'Textiles, Electronics' },
  { region: 'Bangladesh', issue: 'Worker safety, wage theft', severity: 'High', sectors: 'Textiles, Food & Bev' },
  { region: 'India', issue: 'Child labour, bonded labour', severity: 'High', sectors: 'Agriculture, Mining' },
  { region: 'DRC', issue: 'Artisanal cobalt mining', severity: 'Critical', sectors: 'Electronics, Automotive (EV)' },
  { region: 'Brazil', issue: 'Land rights, deforestation', severity: 'High', sectors: 'Agriculture, Food & Bev' },
  { region: 'Indonesia', issue: 'Migrant labour, deforestation', severity: 'High', sectors: 'Agriculture, Food & Bev' },
  { region: 'Philippines', issue: 'Labour rights, mining abuses', severity: 'Medium', sectors: 'Mining, Electronics' },
  { region: 'Vietnam', issue: 'Freedom of association', severity: 'Medium', sectors: 'Electronics, Textiles' },
];

const DEFOREST_COMMODITIES = [
  { commodity: 'Soy', exposedPct: 42, hotspotRegion: 'Brazil / Argentina', linkedSectors: 'Food & Bev, Agriculture' },
  { commodity: 'Palm Oil', exposedPct: 38, hotspotRegion: 'Indonesia / Malaysia', linkedSectors: 'Food & Bev, Chemicals' },
  { commodity: 'Beef', exposedPct: 35, hotspotRegion: 'Brazil / Paraguay', linkedSectors: 'Food & Bev' },
  { commodity: 'Cocoa', exposedPct: 28, hotspotRegion: 'Ivory Coast / Ghana', linkedSectors: 'Food & Bev' },
  { commodity: 'Timber', exposedPct: 22, hotspotRegion: 'Brazil / Congo / SE Asia', linkedSectors: 'Chemicals, Food & Bev' },
  { commodity: 'Coffee', exposedPct: 18, hotspotRegion: 'Brazil / Vietnam / Ethiopia', linkedSectors: 'Food & Bev' },
  { commodity: 'Rubber', exposedPct: 15, hotspotRegion: 'Thailand / Vietnam', linkedSectors: 'Automotive, Chemicals' },
];

const TREND_DATA = Array.from({ length: 6 }, (_, i) => ({
  year: `${2020 + i}`,
  'Audited Suppliers': Math.round(25 + i * 6 + sr(i * 7) * 4),
  'HR Flags Resolved': Math.round(10 + i * 4 + sr(i * 11) * 3),
  'Avg ESG Score': Math.round(42 + i * 3 + sr(i * 13) * 2),
}));

const TABS = ['Overview', 'Supplier Registry', 'Risk Hotspots', 'Human Rights', 'Deforestation', 'Due Diligence', 'Regulatory'];
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
const severityColor = s => ({ Critical: T.red, High: T.amber, Medium: T.gold }[s] || T.textSec);

export default function SupplyChainMapPage() {
  const [tab, setTab] = useState('Overview');
  const [sectorF, setSectorF] = useState('All');
  const [riskF, setRiskF] = useState('All');
  const [regionF, setRegionF] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

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

  const tabBtn = t => ({
    padding: '7px 14px', border: `1px solid ${tab === t ? T.navy : T.border}`,
    borderRadius: 6, fontSize: 12, fontFamily: T.font, cursor: 'pointer',
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
        <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0' }}>48 suppliers · 8 sectors · Human rights · Deforestation · Due diligence · CSDDD/LkSG/EUDR</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>{t}</button>)}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search supplier / region..." style={inpS} />
        <select value={sectorF} onChange={e => setSectorF(e.target.value)} style={selS}>{SECTOR_F.map(s => <option key={s}>{s}</option>)}</select>
        <select value={riskF} onChange={e => setRiskF(e.target.value)} style={selS}>{RISK_F.map(r => <option key={r}>{r}</option>)}</select>
        <select value={regionF} onChange={e => setRegionF(e.target.value)} style={selS}>{REGION_F.map(r => <option key={r}>{r}</option>)}</select>
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
            <KpiCard label="Conflict Minerals" value={kpis.conflictMinerals} color={T.red} sub="suppliers flagged" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>High/Critical Risk Suppliers by Sector</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorRiskCount} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 9, fill: T.textSec }} width={90} />
                  <Tooltip {...tip} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {sectorRiskCount.map((e, i) => <Cell key={i} fill={e.count > 4 ? T.red : e.count > 2 ? T.amber : T.sage} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Suppliers by Region</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={regionCount} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="region">
                    {regionCount.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tip} />
                  <Legend formatter={v => <span style={{ fontSize: 10, color: T.textSec }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ESG Improvement Trend 2020–2025</div>
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
                <tr>{['Supplier', 'Sector', 'Region', 'Tier', 'ESG Score', 'Risk Level', 'Carbon Intensity', 'HR Flags', 'Deforest Risk', 'DD Status', 'Last Audit'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={i} onClick={() => setSelected(selected?.id === s.id ? null : s)}
                    style={{ cursor: 'pointer', background: selected?.id === s.id ? T.surfaceH : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{s.name}</td>
                    <td style={tdS}>{s.sector}</td>
                    <td style={tdS}>{s.region}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>T{s.tier}</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 40, height: 5, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${s.esgScore}%`, height: '100%', background: s.esgScore > 60 ? T.sage : s.esgScore > 40 ? T.amber : T.red, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10 }}>{s.esgScore}</span>
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
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{selected.name} — {selected.sector}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {[['Region', selected.region], ['Tier', `T${selected.tier}`], ['ESG Score', `${selected.esgScore}/100`], ['Risk Level', selected.riskLevel], ['Carbon Intensity', selected.carbonIntensity], ['HR Flags', selected.humanRightsFlags], ['Deforest Risk', selected.deforestRisk], ['Water Risk', selected.waterRisk], ['Child Labour', selected.childLaborRisk], ['Conflict Minerals', selected.conflictMinerals ? 'Flagged' : 'Clear'], ['Annual Spend', `$${selected.annualSpend}M`], ['Scope 3 Contrib', `${selected.scope3Contribution}%`]].map(([k, v], j) => (
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
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>HR Flags Distribution by Sector</div>
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
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Child Labour & Water Risk</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { risk: 'Child Labour High', count: filtered.filter(s => s.childLaborRisk === 'High').length },
                  { risk: 'Child Labour Med', count: filtered.filter(s => s.childLaborRisk === 'Medium').length },
                  { risk: 'Water Risk High', count: filtered.filter(s => s.waterRisk === 'High').length },
                  { risk: 'Water Risk Med', count: filtered.filter(s => s.waterRisk === 'Medium').length },
                  { risk: 'Conflict Minerals', count: filtered.filter(s => s.conflictMinerals).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="risk" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={44} />
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
              <thead><tr>{['Commodity', 'Supply Chain Exposure %', 'Hotspot Region', 'Linked Sectors'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Deforestation Risk by Supplier</div>
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
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>EUDR Readiness Actions</div>
              {[
                { action: 'Map commodity origins to cadastre', status: 'Required', deadline: '2025-Q4' },
                { action: 'Geolocation data from tier-2 suppliers', status: 'In Progress', deadline: '2025-Q3' },
                { action: 'No-deforestation clauses in contracts', status: 'Partial', deadline: '2025-Q2' },
                { action: 'Due diligence statement filing', status: 'Required', deadline: '2025-Q4' },
                { action: 'Satellite monitoring system', status: 'Piloting', deadline: '2025-Q3' },
              ].map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{a.action}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>Deadline: {a.deadline}</div>
                  </div>
                  <span style={{ color: a.status === 'In Progress' ? T.amber : a.status === 'Required' ? T.red : T.sage, fontSize: 11, fontWeight: 600 }}>{a.status}</span>
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
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Due Diligence Status by Sector</div>
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
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Scope 3 Contribution by Supplier</div>
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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Regulation', 'Scope', 'Focus Areas', 'Effective', 'Tier Coverage'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Compliance Readiness Assessment</div>
              {[
                { reg: 'EU CSDDD (2026)', status: 'Preparing', pct: 35, color: T.amber },
                { reg: 'German LkSG (2023)', status: 'Compliant', pct: 82, color: T.green },
                { reg: 'UK Modern Slavery Act', status: 'Compliant', pct: 91, color: T.green },
                { reg: 'EU EUDR (2025)', status: 'In Progress', pct: 48, color: T.amber },
                { reg: 'US UFLPA (2022)', status: 'Compliant', pct: 78, color: T.green },
                { reg: 'EU Conflict Minerals Reg.', status: 'Compliant', pct: 85, color: T.green },
              ].map((item, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
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
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Regulatory Risk Exposure by Geography</div>
              <div style={{ overflowY: 'auto', maxHeight: 320 }}>
                {[
                  { region: 'China', regs: ['UFLPA', 'CSDDD'], riskNote: 'Xinjiang-origin goods; UFLPA rebuttable presumption' },
                  { region: 'Bangladesh', regs: ['CSDDD', 'LkSG'], riskNote: 'Labour rights scrutiny; Accord-covered garment factories' },
                  { region: 'DRC', regs: ['EU Conflict Minerals'], riskNote: 'Cobalt artisanal mining; OECD due diligence required' },
                  { region: 'Brazil', regs: ['EUDR', 'CSDDD'], riskNote: 'Soy/beef deforestation; EUDR geolocation required by 2025' },
                  { region: 'Indonesia', regs: ['EUDR', 'CSDDD'], riskNote: 'Palm oil; EUDR commodity scope' },
                  { region: 'India', regs: ['LkSG', 'CSDDD'], riskNote: 'Forced labour mica/cotton; child labour risk' },
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
    </div>
  );
}
