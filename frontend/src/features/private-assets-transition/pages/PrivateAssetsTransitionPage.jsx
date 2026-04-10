import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, Area
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const SECTORS = ['Software', 'Healthcare', 'Manufacturing', 'Energy', 'Fintech', 'Consumer', 'Logistics', 'Clean Tech', 'Real Estate', 'Agri-Food'];
const SEC_COLORS = [T.blue, T.green, T.orange, T.red, T.purple, T.teal, T.amber, T.sage, T.navyL, '#854d0e'];

const PE_FUNDS = [
  { id: 'F1', name: 'Greenfield Growth Fund I', vintage: 2019, aum: 2400, strategy: 'Growth', companies: 8, avgClimate: 72, transRisk: 'Low', physRisk: 'Medium' },
  { id: 'F2', name: 'Transition Capital Partners II', vintage: 2020, aum: 1800, strategy: 'Buyout', companies: 6, avgClimate: 65, transRisk: 'Medium', physRisk: 'Low' },
  { id: 'F3', name: 'Sustainable Ventures III', vintage: 2021, aum: 950, strategy: 'Venture', companies: 12, avgClimate: 81, transRisk: 'Low', physRisk: 'Low' },
  { id: 'F4', name: 'Industrial Transition Fund', vintage: 2018, aum: 3100, strategy: 'Buyout', companies: 5, avgClimate: 48, transRisk: 'High', physRisk: 'Medium' },
  { id: 'F5', name: 'Energy Transition PE I', vintage: 2022, aum: 1200, strategy: 'Growth', companies: 7, avgClimate: 78, transRisk: 'Low', physRisk: 'Low' },
  { id: 'F6', name: 'Asia Infra Partners IV', vintage: 2020, aum: 2800, strategy: 'Infra', companies: 4, avgClimate: 55, transRisk: 'Medium', physRisk: 'High' },
  { id: 'F7', name: 'Nordic Climate Fund II', vintage: 2021, aum: 680, strategy: 'Venture', companies: 9, avgClimate: 85, transRisk: 'Low', physRisk: 'Low' },
  { id: 'F8', name: 'Special Situations Fund', vintage: 2019, aum: 1500, strategy: 'Distressed', companies: 3, avgClimate: 38, transRisk: 'High', physRisk: 'High' },
  { id: 'F9', name: 'Healthcare Growth III', vintage: 2022, aum: 900, strategy: 'Growth', companies: 5, avgClimate: 69, transRisk: 'Low', physRisk: 'Low' },
  { id: 'F10', name: 'Real Assets Climate I', vintage: 2023, aum: 2100, strategy: 'Real Assets', companies: 6, avgClimate: 62, transRisk: 'Medium', physRisk: 'Medium' },
];

const _sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const PORTFOLIO_COS = Array.from({ length: 50 }, (_, i) => ({
  id: `PC${i + 1}`, name: `PortCo ${i + 1}`, fund: PE_FUNDS[i % 10].id,
  sector: SECTORS[i % 10],
  revenue:      20  + Math.round(_sr(i*11) * 480),
  employees:    50  + Math.round(_sr(i*13) * 2000),
  climateScore: 25  + Math.round(_sr(i*17) * 70),
  transFlag: _sr(i*19) > 0.65,
  physFlag:  _sr(i*23) > 0.7,
  co2Intensity: 5  + Math.round(_sr(i*29) * 120),
  exitMultiple: 4  + +(_sr(i*31) * 14).toFixed(1),
}));

const DD_CHECKLIST = [
  { id: 1, cat: 'Governance', item: 'Board-level climate oversight', weight: 8 },
  { id: 2, cat: 'Governance', item: 'TCFD-aligned disclosure in place', weight: 7 },
  { id: 3, cat: 'Governance', item: 'Climate risk in investment thesis', weight: 9 },
  { id: 4, cat: 'Emissions', item: 'Scope 1 & 2 GHG inventory complete', weight: 10 },
  { id: 5, cat: 'Emissions', item: 'Scope 3 material categories identified', weight: 8 },
  { id: 6, cat: 'Emissions', item: 'Science-based targets set (or planned)', weight: 9 },
  { id: 7, cat: 'Emissions', item: 'Third-party emissions verification', weight: 6 },
  { id: 8, cat: 'Physical Risk', item: 'Asset-level physical risk screening', weight: 8 },
  { id: 9, cat: 'Physical Risk', item: 'Business continuity plan for climate events', weight: 7 },
  { id: 10, cat: 'Physical Risk', item: 'Supply chain climate vulnerability mapped', weight: 7 },
  { id: 11, cat: 'Transition', item: 'Carbon pricing exposure assessed', weight: 8 },
  { id: 12, cat: 'Transition', item: 'Technology transition roadmap', weight: 7 },
  { id: 13, cat: 'Transition', item: 'Regulatory compliance pathway clear', weight: 8 },
  { id: 14, cat: 'Transition', item: 'Stranded asset risk quantified', weight: 9 },
  { id: 15, cat: 'Strategy', item: 'Climate scenario analysis performed', weight: 8 },
  { id: 16, cat: 'Strategy', item: 'Net zero transition plan documented', weight: 9 },
  { id: 17, cat: 'Strategy', item: 'Climate value creation opportunities identified', weight: 7 },
  { id: 18, cat: 'Reporting', item: 'SFDR PAI indicators tracked', weight: 6 },
  { id: 19, cat: 'Reporting', item: 'EU Taxonomy eligibility assessed', weight: 7 },
  { id: 20, cat: 'Reporting', item: 'LP climate reporting template ready', weight: 6 },
];

const TABS = ['Fund Portfolio Overview', 'Deal Climate Screening', 'LP Look-Through', 'GP Engagement Assessment', 'Exit Value Climate Adjustment', 'Vintage Transition Analysis'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const kpi = (label, value, sub, color = T.navy) => (
  <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: '14px 18px', minWidth: 145, flex: 1 }}>
    <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function PrivateAssetsTransitionPage() {
  const [tab, setTab] = useState(0);
  const [selectedFund, setSelectedFund] = useState('All');
  const [ddChecks, setDdChecks] = useState({});
  const [scenarioHaircut, setScenarioHaircut] = useState('moderate');
  const [gpScores, setGpScores] = useState({});

  const filteredCos = useMemo(() =>
    selectedFund === 'All' ? PORTFOLIO_COS : PORTFOLIO_COS.filter(c => c.fund === selectedFund),
    [selectedFund]);

  const sectorDist = useMemo(() => {
    const map = {};
    filteredCos.forEach(c => { map[c.sector] = (map[c.sector] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredCos]);

  const fundSummary = PE_FUNDS.map(f => {
    const cos = PORTFOLIO_COS.filter(c => c.fund === f.id);
    return { ...f, avgCO2: Math.round(cos.reduce((s, c) => s + c.co2Intensity, 0) / Math.max(1, cos.length)), flagged: cos.filter(c => c.transFlag || c.physFlag).length };
  });

  const haircutFactor = { conservative: 0.03, moderate: 0.08, aggressive: 0.15 };
  const exitData = filteredCos.slice(0, 20).map(c => ({
    name: c.name.replace('PortCo ', 'PC'),
    baseEV: c.revenue * c.exitMultiple,
    adjustedEV: c.revenue * c.exitMultiple * (1 - haircutFactor[scenarioHaircut] * (c.transFlag ? 2 : 1) * (1 - c.climateScore / 100)),
    haircut: (haircutFactor[scenarioHaircut] * (c.transFlag ? 2 : 1) * (1 - c.climateScore / 100) * 100).toFixed(1),
  }));

  const vintageData = [2018, 2019, 2020, 2021, 2022, 2023].map(v => {
    const funds = PE_FUNDS.filter(f => f.vintage === v);
    return { vintage: v, funds: funds.length, avgClimate: funds.length ? Math.round(funds.reduce((s, f) => s + f.avgClimate, 0) / Math.max(1, funds.length)) : 0, totalAUM: funds.reduce((s, f) => s + f.aum, 0) };
  });

  const lpExposure = useMemo(() => {
    const total = PE_FUNDS.reduce((s, f) => s + f.aum, 0);
    return { total, highRisk: PE_FUNDS.filter(f => f.transRisk === 'High').reduce((s, f) => s + f.aum, 0), lowRisk: PE_FUNDS.filter(f => f.transRisk === 'Low').reduce((s, f) => s + f.aum, 0) };
  }, []);

  const riskColor = r => r === 'High' ? T.red : r === 'Medium' ? T.amber : T.green;
  const ddCats = [...new Set(DD_CHECKLIST.map(d => d.cat))];
  const ddComplete = Object.values(ddChecks).filter(Boolean).length;

  const gpDims = ['Strategy', 'Reporting', 'Engagement', 'Targets', 'Integration'];
  const gpRadar = gpDims.map(d => ({ dim: d, score: gpScores[d] || 50 }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CI2 . PRIVATE ASSETS TRANSITION</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>PE/VC Climate Due Diligence</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              10 PE Funds . 50 Portfolio Companies . Deal Screening . LP Look-Through . Exit Value Adjustment . Vintage Analysis
            </p>
          </div>
          <select value={selectedFund} onChange={e => setSelectedFund(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }}>
            <option value="All">All Funds</option>
            {PE_FUNDS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '10px 16px', fontSize: 12, fontWeight: tab === i ? 700 : 500, cursor: 'pointer',
              background: tab === i ? T.bg : 'transparent', color: tab === i ? T.navy : '#94a3b8',
              border: 'none', borderRadius: '8px 8px 0 0', fontFamily: T.font, borderBottom: tab === i ? `2px solid ${T.gold}` : 'none'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {kpi('Total AUM', `$${(PE_FUNDS.reduce((s, f) => s + f.aum, 0) / 1000).toFixed(1)}B`, '10 funds')}
          {kpi('Portfolio Cos', PORTFOLIO_COS.length.toString(), 'across all funds')}
          {kpi('Avg Climate Score', Math.round(PORTFOLIO_COS.reduce((s, c) => s + c.climateScore, 0) / Math.max(1, PORTFOLIO_COS.length)).toString(), '/100', T.blue)}
          {kpi('Transition Flagged', PORTFOLIO_COS.filter(c => c.transFlag).length.toString(), 'companies', T.red)}
          {kpi('Physical Flagged', PORTFOLIO_COS.filter(c => c.physFlag).length.toString(), 'companies', T.orange)}
        </div>

        {/* Tab 0: Fund Portfolio Overview */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Fund Climate Performance</h3>
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={fundSummary}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgClimate" name="Avg Climate Score" fill={T.blue} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgCO2" name="Avg CO2 Intensity" fill={T.red} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector Distribution</h3>
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart>
                    <Pie data={sectorDist} cx="50%" cy="50%" innerRadius={60} outerRadius={120} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sectorDist.map((_, i) => <Cell key={i} fill={SEC_COLORS[i % SEC_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Fund Summary Table</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Fund', 'Vintage', 'AUM ($M)', 'Strategy', 'Companies', 'Avg Climate', 'Trans Risk', 'Phys Risk', 'Flagged'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {fundSummary.map(f => (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{f.name}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{f.vintage}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>${f.aum}</td>
                      <td style={{ padding: '8px 6px' }}>{f.strategy}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{f.companies}</td>
                      <td style={{ padding: '8px 6px' }}><span style={{ color: f.avgClimate > 70 ? T.green : f.avgClimate > 50 ? T.amber : T.red, fontWeight: 600 }}>{f.avgClimate}</span></td>
                      <td style={{ padding: '8px 6px' }}><span style={{ color: riskColor(f.transRisk), fontWeight: 600 }}>{f.transRisk}</span></td>
                      <td style={{ padding: '8px 6px' }}><span style={{ color: riskColor(f.physRisk), fontWeight: 600 }}>{f.physRisk}</span></td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono, color: T.red }}>{f.flagged}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 1: Deal Climate Screening */}
        {tab === 1 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Pre-Acquisition Climate DD Checklist</h3>
              <p style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Progress: {ddComplete}/{DD_CHECKLIST.length} items ({(ddComplete / Math.max(1, DD_CHECKLIST.length) * 100).toFixed(0)}%)</p>
              <div style={{ width: '100%', height: 8, background: T.border, borderRadius: 4, marginBottom: 16 }}>
                <div style={{ width: `${(ddComplete / Math.max(1, DD_CHECKLIST.length)) * 100}%`, height: 8, background: ddComplete === DD_CHECKLIST.length ? T.green : T.blue, borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
              {ddCats.map(cat => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navyL, marginBottom: 8 }}>{cat}</h4>
                  {DD_CHECKLIST.filter(d => d.cat === cat).map(d => (
                    <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 12 }}>
                      <input type="checkbox" checked={!!ddChecks[d.id]} onChange={() => setDdChecks(p => ({ ...p, [d.id]: !p[d.id] }))} />
                      <span style={{ flex: 1, textDecoration: ddChecks[d.id] ? 'line-through' : 'none', color: ddChecks[d.id] ? T.textMut : T.navy }}>{d.item}</span>
                      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>wt:{d.weight}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: LP Look-Through */}
        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {kpi('Total LP Exposure', `$${(lpExposure.total / 1000).toFixed(1)}B`, 'aggregate AUM')}
              {kpi('High Trans Risk', `$${(lpExposure.highRisk / 1000).toFixed(1)}B`, `${(lpExposure.highRisk / lpExposure.total * 100).toFixed(0)}% of AUM`, T.red)}
              {kpi('Low Trans Risk', `$${(lpExposure.lowRisk / 1000).toFixed(1)}B`, `${(lpExposure.lowRisk / lpExposure.total * 100).toFixed(0)}% of AUM`, T.green)}
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Aggregate Climate Exposure by Fund</h3>
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={fundSummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={70} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: 'AUM $M', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="aum" name="AUM ($M)" fill={T.blue} opacity={0.6} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" dataKey="avgClimate" name="Climate Score" stroke={T.green} strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Portfolio Company Climate Scores</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Company', 'Fund', 'Sector', 'Climate Score', 'CO2 Intensity', 'Trans Flag', 'Phys Flag'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredCos.slice(0, 25).map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono, fontSize: 10 }}>{PE_FUNDS.find(f => f.id === c.fund)?.name.substring(0, 20)}</td>
                      <td style={{ padding: '8px 6px' }}>{c.sector}</td>
                      <td style={{ padding: '8px 6px' }}><span style={{ color: c.climateScore > 65 ? T.green : c.climateScore > 45 ? T.amber : T.red, fontWeight: 600 }}>{c.climateScore}</span></td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{c.co2Intensity}</td>
                      <td style={{ padding: '8px 6px' }}>{c.transFlag && <span style={{ color: T.red, fontWeight: 600 }}>FLAG</span>}</td>
                      <td style={{ padding: '8px 6px' }}>{c.physFlag && <span style={{ color: T.orange, fontWeight: 600 }}>FLAG</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: GP Engagement Assessment */}
        {tab === 3 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>GP Climate Engagement Scorecard</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  {gpDims.map(d => (
                    <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, width: 100 }}>{d}</span>
                      <input type="range" min={0} max={100} value={gpScores[d] || 50} onChange={e => setGpScores(p => ({ ...p, [d]: +e.target.value }))} style={{ flex: 1 }} />
                      <span style={{ fontFamily: T.mono, fontSize: 12, width: 30 }}>{gpScores[d] || 50}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>Overall GP Score</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: T.blue }}>{Math.round(gpDims.reduce((s, d) => s + (gpScores[d] || 50), 0) / Math.max(1, gpDims.length))}/100</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={gpRadar}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar dataKey="score" stroke={T.blue} fill={T.blue} fillOpacity={0.2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>iCI / PRI Alignment</h3>
              {['ILPA ESG Principles compliance', 'PRI Private Equity Guide alignment', 'GRESB PE benchmark participation', 'iCI (Initiative Climat International) signatory', 'SFDR Article 8/9 classification'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: i < 3 ? T.green : T.amber }} />
                  <span>{item}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 11, color: i < 3 ? T.green : T.amber }}>{i < 3 ? 'Aligned' : 'Partial'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Exit Value Climate Adjustment */}
        {tab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {['conservative', 'moderate', 'aggressive'].map(s => (
                <button key={s} onClick={() => setScenarioHaircut(s)} style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: scenarioHaircut === s ? T.navy : T.surface, color: scenarioHaircut === s ? '#fff' : T.navy,
                  border: `1px solid ${scenarioHaircut === s ? T.navy : T.border}`
                }}>{s.charAt(0).toUpperCase() + s.slice(1)} Haircut</button>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Exit Value: Base vs Climate-Adjusted EV</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={exitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip formatter={v => `$${Math.round(v)}M`} />
                  <Legend />
                  <Bar dataKey="baseEV" name="Base EV" fill={T.blue} opacity={0.4} />
                  <Bar dataKey="adjustedEV" name="Climate-Adjusted EV" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 5: Vintage Transition Analysis */}
        {tab === 5 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Climate Score by Vintage Year</h3>
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={vintageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="vintage" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="right" dataKey="totalAUM" name="Total AUM ($M)" fill={T.blue} opacity={0.3} />
                  <Line yAxisId="left" dataKey="avgClimate" name="Avg Climate Score" stroke={T.green} strokeWidth={3} dot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Reference Data</h4>
            {['ILPA ESG Principles', 'PRI Private Equity Guide', 'GRESB PE Benchmark', 'iCI (Initiative Climat International)', 'SFDR PAI Indicators', 'EU Taxonomy Technical Criteria'].map(r => (
              <div key={r} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>{r}</div>
            ))}
          </div>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Engagement Tools</h4>
            {['Deal pipeline climate tracker', 'LP reporting template generator', 'GP engagement scorecard', 'DD checklist (20 items, weighted)', 'Exit value haircut calculator', 'Vintage transition trend analyzer'].map(e => (
              <div key={e} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: T.gold, display: 'inline-block' }} />{e}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
