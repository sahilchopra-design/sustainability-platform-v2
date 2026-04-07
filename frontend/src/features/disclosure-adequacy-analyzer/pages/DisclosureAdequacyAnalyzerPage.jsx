import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, Legend, PieChart, Pie, LineChart, Line, ScatterChart, Scatter,
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

const FRAMEWORKS = ['TCFD','IFRS S1','IFRS S2','ESRS E1','ESRS E2','ESRS E3','ESRS E4','ESRS E5','GRI 305'];
const SECTORS = ['Energy','Materials','Utilities','Financials','Industrials','Consumer','Technology','Healthcare','Transport'];

const COMPANY_NAMES = [
  'Atlas Energy','Nordic Power','Meridian Capital','Pacific Holdings','Summit Materials',
  'Coastal Utilities','BlueWave Corp','Verdant Finance','Ironclad Industries','Aurelia Partners',
  'Zenith Logistics','Cascade Power','Obsidian Capital','Terraverde Inc','Silver Ridge',
  'Boreal Industries','Eclipse Energy','Polaris Group','Ember Resources','Cobalt Mining',
  'Solstice Holdings','Quarry Systems','Forgepoint Ltd','Riviera Assets','Tempest Finance',
  'Glacier Corp','Nexus Materials','Opal Holdings','Prism Utilities','Quantum Energy',
  'Redwood Capital','Sterling Group','Titan Industries','Umbra Partners','Vortex Power',
  'Westfield Corp','Xenon Holdings','Yeldon Finance','Zephyr Energy','Acumen Capital',
  'Bridgepoint Ltd','Canopy Resources','Delta Industrials','Enviro Corp','Frontier Assets',
];

const RAW_COMPANIES = Array.from({ length: 45 }, (_, i) => {
  const tcfd = Math.round(20 + sr(i * 13) * 75);
  const ifrsS1 = Math.round(15 + sr(i * 13 + 1) * 80);
  const ifrsS2 = Math.round(10 + sr(i * 13 + 2) * 85);
  const esrsE1 = Math.round(25 + sr(i * 13 + 3) * 70);
  const esrsE2 = Math.round(10 + sr(i * 13 + 4) * 80);
  const esrsE3 = Math.round(15 + sr(i * 13 + 5) * 75);
  const esrsE4 = Math.round(5 + sr(i * 13 + 6) * 85);
  const esrsE5 = Math.round(10 + sr(i * 13 + 7) * 80);
  const gri305 = Math.round(20 + sr(i * 13 + 8) * 75);
  const overall = Math.round(
    tcfd * 0.20 + ifrsS2 * 0.20 + esrsE1 * 0.20 + gri305 * 0.15 +
    ifrsS1 * 0.05 + esrsE2 * 0.05 + esrsE3 * 0.05 + esrsE4 * 0.05 + esrsE5 * 0.05
  );
  return {
    id: i + 1,
    name: COMPANY_NAMES[i],
    sector: SECTORS[i % SECTORS.length],
    tcfd, ifrsS1, ifrsS2, esrsE1, esrsE2, esrsE3, esrsE4, esrsE5, gri305,
    overall,
    mandatory: sr(i * 13 + 9) > 0.4,
  };
});

// assign peer ranks by overall desc
const sorted45 = [...RAW_COMPANIES].sort((a, b) => b.overall - a.overall);
const COMPANIES = RAW_COMPANIES.map(c => ({
  ...c,
  peerRank: sorted45.findIndex(s => s.id === c.id) + 1,
}));

const TCFD_RECS = [
  { id: 'G-a', area: 'Governance', recommendation: 'Board oversight of climate-related risks & opportunities' },
  { id: 'G-b', area: 'Governance', recommendation: 'Management role in assessing climate-related issues' },
  { id: 'S-a', area: 'Strategy', recommendation: 'Climate-related risks & opportunities over short/medium/long term' },
  { id: 'S-b', area: 'Strategy', recommendation: 'Impact of climate-related risks on business, strategy & financial planning' },
  { id: 'S-c', area: 'Strategy', recommendation: 'Resilience of strategy under different climate scenarios' },
  { id: 'RM-a', area: 'Risk Management', recommendation: 'Processes for identifying and assessing climate-related risks' },
  { id: 'RM-b', area: 'Risk Management', recommendation: 'Processes for managing climate-related risks' },
  { id: 'RM-c', area: 'Risk Management', recommendation: 'Integration into overall risk management' },
  { id: 'MT-a', area: 'Metrics & Targets', recommendation: 'Metrics used to assess climate-related risks & opportunities' },
  { id: 'MT-b', area: 'Metrics & Targets', recommendation: 'Scope 1, 2 and 3 GHG emissions and related risks' },
  { id: 'MT-c', area: 'Metrics & Targets', recommendation: 'Targets used to manage climate-related risks & opportunities' },
].map((r, j) => ({
  ...r,
  industryAvg: Math.round(30 + sr(j * 29) * 55),
  topQuartile: Math.round(60 + sr(j * 29 + 1) * 35),
}));

const IMPROVEMENT_ROADMAP = [
  { milestone: 'TCFD Governance & Strategy Full Disclosure', framework: 'TCFD', deadline: '2026-Q3', effort: 'Medium', impact: Math.round(2 + sr(0 * 41) * 12) },
  { milestone: 'IFRS S2 Climate Risk Quantification', framework: 'IFRS S2', deadline: '2026-Q4', effort: 'High', impact: Math.round(2 + sr(1 * 41) * 12) },
  { milestone: 'ESRS E1 Scope 1/2/3 Complete Reporting', framework: 'ESRS E1', deadline: '2026-Q3', effort: 'High', impact: Math.round(2 + sr(2 * 41) * 12) },
  { milestone: 'GRI 305 Emissions Intensity Metrics', framework: 'GRI 305', deadline: '2026-Q4', effort: 'Low', impact: Math.round(2 + sr(3 * 41) * 12) },
  { milestone: 'ESRS E2-E5 Biodiversity & Water Coverage', framework: 'ESRS E2', deadline: '2027-Q1', effort: 'Medium', impact: Math.round(2 + sr(4 * 41) * 12) },
  { milestone: 'IFRS S1 General Sustainability Baseline', framework: 'IFRS S1', deadline: '2027-Q2', effort: 'Low', impact: Math.round(2 + sr(5 * 41) * 12) },
];

const FW_KEYS = ['tcfd','ifrsS1','ifrsS2','esrsE1','esrsE2','esrsE3','esrsE4','esrsE5','gri305'];
const FW_COLORS = [T.navy, T.navyL, T.indigo, T.green, T.sage, T.teal, T.amber, T.orange, T.gold];

const scoreColor = (v) => v >= 70 ? T.green : v >= 40 ? T.amber : T.red;
const scoreBg = (v) => v >= 70 ? '#dcfce7' : v >= 40 ? '#fef3c7' : '#fee2e2';
const quartile = (rank) => rank <= 11 ? 'Q1' : rank <= 22 ? 'Q2' : rank <= 33 ? 'Q3' : 'Q4';
const qColor = (q) => ({ Q1: T.green, Q2: T.sage, Q3: T.amber, Q4: T.red }[q]);

const EFFORT_X = { Low: 1, Medium: 2, High: 3 };

const TABS = ['Adequacy Scores', 'Gap Heatmap', 'Framework Alignment', 'Peer Ranking', 'Improvement Roadmap'];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 150, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color, bg }) => (
  <span style={{ background: bg || '#e0e7ff', color: color || T.indigo, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, fontFamily: T.mono }}>{label}</span>
);

export default function DisclosureAdequacyAnalyzerPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [mandatoryFilter, setMandatoryFilter] = useState('All');
  const [sortRankDir, setSortRankDir] = useState('asc');

  const filtered = useMemo(() => {
    let arr = COMPANIES;
    if (sectorFilter !== 'All') arr = arr.filter(c => c.sector === sectorFilter);
    if (mandatoryFilter === 'Mandatory') arr = arr.filter(c => c.mandatory);
    if (mandatoryFilter === 'Voluntary') arr = arr.filter(c => !c.mandatory);
    return arr;
  }, [sectorFilter, mandatoryFilter]);

  // Tab 0 KPIs
  const kpis0 = useMemo(() => {
    if (!filtered.length) return { avg: 0, mandatoryRate: 0, voluntaryRate: 0, above70: 0, lowest: 0 };
    const avg = Math.round(filtered.reduce((s, c) => s + c.overall, 0) / filtered.length);
    const mandatory = filtered.filter(c => c.mandatory);
    const voluntary = filtered.filter(c => !c.mandatory);
    const mandatoryRate = mandatory.length ? Math.round(mandatory.filter(c => c.overall >= 50).length / mandatory.length * 100) : 0;
    const voluntaryRate = voluntary.length ? Math.round(voluntary.filter(c => c.overall >= 50).length / voluntary.length * 100) : 0;
    const above70 = filtered.filter(c => c.overall >= 70).length;
    const lowest = filtered.length ? Math.min(...filtered.map(c => c.overall)) : 0;
    return { avg, mandatoryRate, voluntaryRate, above70, lowest };
  }, [filtered]);

  const barData0 = useMemo(() => {
    if (!filtered.length) return [];
    return [...filtered].sort((a, b) => b.overall - a.overall).slice(0, 30).map(c => ({
      name: c.name.split(' ').slice(-1)[0],
      fullName: c.name,
      score: c.overall,
      fill: scoreColor(c.overall),
    }));
  }, [filtered]);

  const pieData0 = useMemo(() => {
    if (!filtered.length) return [];
    const q1 = filtered.filter(c => c.peerRank <= 11).length;
    const q2 = filtered.filter(c => c.peerRank > 11 && c.peerRank <= 22).length;
    const q3 = filtered.filter(c => c.peerRank > 22 && c.peerRank <= 33).length;
    const q4 = filtered.filter(c => c.peerRank > 33).length;
    return [
      { name: 'Q1 (Top)', value: q1, fill: T.green },
      { name: 'Q2', value: q2, fill: T.sage },
      { name: 'Q3', value: q3, fill: T.amber },
      { name: 'Q4 (Bottom)', value: q4, fill: T.red },
    ].filter(d => d.value > 0);
  }, [filtered]);

  const fwAvgBar = useMemo(() => {
    if (!COMPANIES.length) return [];
    return FRAMEWORKS.map((fw, fi) => {
      const key = FW_KEYS[fi];
      const avg = Math.round(COMPANIES.reduce((s, c) => s + c[key], 0) / COMPANIES.length);
      return { fw: fw.replace(' ', '\u00a0'), avg, fill: FW_COLORS[fi] };
    });
  }, []);

  // Tab 1
  const heatRows = useMemo(() => [...filtered].sort((a, b) => b.overall - a.overall).slice(0, 30), [filtered]);

  const gapBarData = useMemo(() => {
    if (!filtered.length) return [];
    return FRAMEWORKS.map((fw, fi) => {
      const key = FW_KEYS[fi];
      const avg = filtered.reduce((s, c) => s + c[key], 0) / filtered.length;
      return { fw, gap: Math.round(100 - avg) };
    });
  }, [filtered]);

  const tcfdGrouped = useMemo(() => TCFD_RECS.map(r => ({
    name: r.id,
    industryAvg: r.industryAvg,
    topQuartile: r.topQuartile,
  })), []);

  // Tab 2
  const fwTableData = useMemo(() => FRAMEWORKS.map((fw, fi) => {
    const key = FW_KEYS[fi];
    const avg = Math.round(COMPANIES.reduce((s, c) => s + c[key], 0) / COMPANIES.length);
    const above70 = COMPANIES.filter(c => c[key] >= 70).length;
    const gap = 100 - avg;
    const mandatory = ['ESRS E1','ESRS E2','ESRS E3','ESRS E4','ESRS E5'].includes(fw) ? 'CSRD' :
      fw === 'IFRS S1' || fw === 'IFRS S2' ? 'ISSB' : 'Voluntary';
    const keyGap = gap > 50 ? 'Scenario analysis missing' : gap > 30 ? 'Metrics incomplete' : 'Near compliant';
    return { fw, mandatory, avg, above70, keyGap };
  }), []);

  const radarData = useMemo(() => FRAMEWORKS.map((fw, fi) => {
    const key = FW_KEYS[fi];
    const avg = Math.round(COMPANIES.reduce((s, c) => s + c[key], 0) / COMPANIES.length);
    return { subject: fw, A: avg, fullMark: 100 };
  }), []);

  const tcfdSorted = useMemo(() => [...TCFD_RECS].sort((a, b) => b.industryAvg - a.industryAvg), []);

  const esrsBar = useMemo(() => ['esrsE1','esrsE2','esrsE3','esrsE4','esrsE5'].map((key, i) => {
    const avg = Math.round(COMPANIES.reduce((s, c) => s + c[key], 0) / COMPANIES.length);
    return { name: `ESRS E${i + 1}`, avg, fill: FW_COLORS[3 + i] };
  }), []);

  // Tab 3
  const rankTable = useMemo(() => {
    const arr = [...filtered].sort((a, b) => sortRankDir === 'asc' ? a.peerRank - b.peerRank : b.peerRank - a.peerRank);
    return arr;
  }, [filtered, sortRankDir]);

  const histData = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${i * 10 + 10}`, count: 0 }));
    COMPANIES.forEach(c => {
      const idx = Math.min(9, Math.floor(c.overall / 10));
      buckets[idx].count++;
    });
    return buckets;
  }, []);

  const sectorAvg = useMemo(() => SECTORS.map(sec => {
    const arr = COMPANIES.filter(c => c.sector === sec);
    const avg = arr.length ? Math.round(arr.reduce((s, c) => s + c.overall, 0) / arr.length) : 0;
    return { sector: sec, avg };
  }), []);

  const percentileCurve = useMemo(() => sorted45.map((c, i) => ({
    rank: i + 1,
    score: c.overall,
  })), []);

  // Tab 4
  const scatterData = useMemo(() => IMPROVEMENT_ROADMAP.map(r => ({
    x: EFFORT_X[r.effort],
    y: r.impact,
    name: r.milestone.split(' ').slice(0, 3).join(' '),
  })), []);

  const roadmapBar = useMemo(() => [...IMPROVEMENT_ROADMAP].sort((a, b) => b.impact - a.impact).map(r => ({
    name: r.framework,
    impact: r.impact,
    fill: FW_COLORS[FRAMEWORKS.indexOf(r.framework)] || T.indigo,
  })), []);

  const effortPie = useMemo(() => {
    const map = {};
    IMPROVEMENT_ROADMAP.forEach(r => { map[r.framework] = (map[r.framework] || 0) + 1; });
    return Object.entries(map).map(([fw, count], i) => ({ name: fw, value: count, fill: FW_COLORS[i % FW_COLORS.length] }));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '18px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.gold, color: T.navy, borderRadius: 4, padding: '3px 10px', fontFamily: T.mono, fontWeight: 700, fontSize: 12 }}>EP-DA3</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#ffffff' }}>Disclosure Adequacy Analyzer</h1>
        </div>
        <div style={{ color: T.goldL, fontSize: 13, fontFamily: T.mono }}>45 companies · TCFD 11 recommendations · IFRS S1/S2 · ESRS E1-E5 · GRI 305 · peer ranking</div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', gap: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 400,
            color: tab === i ? T.navy : T.textSec,
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1600 }}>

        {/* Filters */}
        {(tab === 0 || tab === 1 || tab === 3) && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>Sector</label>
              <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, fontFamily: T.font, fontSize: 13, color: T.text }}>
                <option value="All">All Sectors</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>Status</label>
              <select value={mandatoryFilter} onChange={e => setMandatoryFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, fontFamily: T.font, fontSize: 13, color: T.text }}>
                <option value="All">All</option>
                <option value="Mandatory">Mandatory (CSRD)</option>
                <option value="Voluntary">Voluntary</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 0 — Adequacy Scores */}
        {tab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Kpi label="Industry Avg Score" value={kpis0.avg} sub="weighted composite" />
              <Kpi label="Mandatory Compliance" value={`${kpis0.mandatoryRate}%`} sub="score ≥ 50" color={T.indigo} />
              <Kpi label="Voluntary Adoption" value={`${kpis0.voluntaryRate}%`} sub="score ≥ 50" color={T.sage} />
              <Kpi label="Companies >70 Score" value={kpis0.above70} sub="strong disclosers" color={T.green} />
              <Kpi label="Lowest Score" value={kpis0.lowest} sub="weakest discloser" color={T.red} />
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 380, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Overall Adequacy Score — Top 30 Companies</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData0} margin={{ top: 4, right: 12, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip formatter={(v, n, p) => [v, p.payload.fullName]} contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                      {barData0.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 260, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Companies by Score Quartile</div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData0} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData0.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Average Score by Framework (All 45 Companies)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={fwAvgBar} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="fw" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="avg" name="Avg Score" radius={[3, 3, 0, 0]}>
                    {fwAvgBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 1 — Gap Heatmap */}
        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, overflowX: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Framework Score Heatmap — Top 30 Companies</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontFamily: T.mono, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Company</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontFamily: T.mono, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Sector</th>
                    {FRAMEWORKS.map(fw => (
                      <th key={fw} style={{ textAlign: 'center', padding: '6px 6px', color: T.textMut, fontFamily: T.mono, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 10 }}>{fw}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatRows.map((c, ri) => (
                    <tr key={c.id} style={{ background: ri % 2 === 0 ? T.surface : T.card }}>
                      <td style={{ padding: '5px 8px', color: T.text, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.name}</td>
                      <td style={{ padding: '5px 8px', color: T.textSec, fontSize: 11 }}>{c.sector}</td>
                      {FW_KEYS.map(key => (
                        <td key={key} style={{ padding: '4px 4px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', minWidth: 36, padding: '2px 4px', borderRadius: 4,
                            background: scoreBg(c[key]), color: scoreColor(c[key]),
                            fontFamily: T.mono, fontWeight: 600, fontSize: 11,
                          }}>{c[key]}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Average Gap by Framework (100 − Score)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={gapBarData} margin={{ top: 4, right: 12, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="fw" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Bar dataKey="gap" name="Avg Gap" fill={T.red} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 380, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>TCFD 11-Recommendation Completion — Industry Avg vs Top Quartile</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={tcfdGrouped} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="industryAvg" name="Industry Avg" fill={T.navyL} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="topQuartile" name="Top Quartile" fill={T.green} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 — Framework Alignment */}
        {tab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, overflowX: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Framework Summary Table</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Framework','Regime','Avg Completion %','Companies >70%','Key Gap'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMut, fontFamily: T.mono, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fwTableData.map((row, i) => (
                    <tr key={row.fw} style={{ background: i % 2 === 0 ? T.surface : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>{row.fw}</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={row.mandatory} color={row.mandatory === 'CSRD' ? T.green : row.mandatory === 'ISSB' ? T.indigo : T.textSec} bg={row.mandatory === 'CSRD' ? '#dcfce7' : row.mandatory === 'ISSB' ? '#e0e7ff' : T.sub} /></td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono, color: scoreColor(row.avg), fontWeight: 600 }}>{row.avg}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{row.above70}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 11 }}>{row.keyGap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 300, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Portfolio Avg — All 9 Frameworks (Radar)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart cx="50%" cy="50%" outerRadius={100} data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: T.textSec }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
                    <Radar name="Avg Score" dataKey="A" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 300, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>TCFD Recommendations — Industry Avg (Sorted)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={tcfdSorted.map(r => ({ name: r.id, avg: r.industryAvg, area: r.area }))} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} width={40} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Bar dataKey="avg" name="Industry Avg" fill={T.navyL} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>ESRS E1–E5 Portfolio Average Scores</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={esrsBar} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.textSec }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="avg" name="Avg Score" radius={[3, 3, 0, 0]}>
                    {esrsBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3 — Peer Ranking */}
        {tab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>Peer Ranking Table</div>
                <button onClick={() => setSortRankDir(d => d === 'asc' ? 'desc' : 'asc')}
                  style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.sub, cursor: 'pointer', fontFamily: T.mono, fontSize: 11, color: T.navy }}>
                  Sort: Rank {sortRankDir === 'asc' ? '▲' : '▼'}
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Rank','Company','Sector','Overall','Mandatory','Quartile'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMut, fontFamily: T.mono, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankTable.map((c, i) => {
                    const q = quartile(c.peerRank);
                    return (
                      <tr key={c.id} style={{ background: i % 2 === 0 ? T.surface : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 12px', fontFamily: T.mono, fontWeight: 700, color: c.peerRank <= 11 ? T.green : T.textSec }}>#{c.peerRank}</td>
                        <td style={{ padding: '7px 12px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                        <td style={{ padding: '7px 12px', color: T.textSec }}>{c.sector}</td>
                        <td style={{ padding: '7px 12px', fontFamily: T.mono, fontWeight: 700, color: scoreColor(c.overall) }}>{c.overall}</td>
                        <td style={{ padding: '7px 12px' }}><Badge label={c.mandatory ? 'CSRD' : 'Vol'} color={c.mandatory ? T.green : T.textSec} bg={c.mandatory ? '#dcfce7' : T.sub} /></td>
                        <td style={{ padding: '7px 12px' }}><Badge label={q} color={qColor(q)} bg={`${qColor(q)}22`} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 280, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Score Distribution Histogram</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={histData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Bar dataKey="count" name="Companies" fill={T.navyL} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 280, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Sector Average Overall Score</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sectorAvg} layout="vertical" margin={{ top: 4, right: 16, left: 60, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis type="category" dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} width={60} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Bar dataKey="avg" name="Avg Score" fill={T.sage} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 280, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Percentile Curve (Rank vs Score)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={percentileCurve} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="rank" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Rank', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={v => [v, 'Score']} />
                    <Line type="monotone" dataKey="score" stroke={T.gold} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4 — Improvement Roadmap */}
        {tab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Improvement Roadmap</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Milestone','Framework','Deadline','Effort','Impact (pts)'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMut, fontFamily: T.mono, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {IMPROVEMENT_ROADMAP.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{r.milestone}</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={r.framework} color={T.indigo} bg="#e0e7ff" /></td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono, fontSize: 11 }}>{r.deadline}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <Badge label={r.effort}
                          color={r.effort === 'Low' ? T.green : r.effort === 'Medium' ? T.amber : T.red}
                          bg={r.effort === 'Low' ? '#dcfce7' : r.effort === 'Medium' ? '#fef3c7' : '#fee2e2'} />
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono, fontWeight: 700, color: T.navy }}>+{r.impact} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 280, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Effort vs Impact (Bubble)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" dataKey="x" name="Effort" domain={[0, 4]} ticks={[1, 2, 3]} tickFormatter={v => ['', 'Low', 'Med', 'High'][v] || ''} tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis type="number" dataKey="y" name="Impact (pts)" tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={(v, n) => [v, n]} />
                    <Scatter data={scatterData} fill={T.gold} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 280, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Score Improvement by Initiative</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={roadmapBar} layout="vertical" margin={{ top: 4, right: 16, left: 70, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} width={70} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Bar dataKey="impact" name="Impact (pts)" radius={[0, 3, 3, 0]}>
                      {roadmapBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 260, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.navy }}>Effort Split by Framework</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={effortPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {effortPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
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
          <strong>Methodology:</strong> Adequacy score = weighted completion rate across disclosure requirements per framework. TCFD: 11 recommendations (Governance 2, Strategy 3, Risk Mgmt 3, Metrics 3). IFRS S1/S2: aligned with ISSB sustainability-related financial disclosure standard. ESRS E1-E5: EU CSRD environmental topical standards. GRI 305: emissions-specific disclosures. Peer ranking covers reporting universe of 45 large-cap entities.
        </div>
      </div>
    </div>
  );
}
