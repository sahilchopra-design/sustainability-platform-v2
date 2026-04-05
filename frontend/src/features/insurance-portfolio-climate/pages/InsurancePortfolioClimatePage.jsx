import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const ASSET_CLASSES = [
  { name: 'Govt Bonds', allocation: 35, transRisk: 12, physRisk: 5, climateScore: 72 },
  { name: 'Corp Bonds', allocation: 25, transRisk: 28, physRisk: 8, climateScore: 58 },
  { name: 'Listed Equity', allocation: 15, transRisk: 35, physRisk: 12, climateScore: 52 },
  { name: 'Real Estate', allocation: 10, transRisk: 18, physRisk: 42, climateScore: 45 },
  { name: 'Infrastructure', allocation: 8, transRisk: 22, physRisk: 35, climateScore: 55 },
  { name: 'Alternatives', allocation: 7, transRisk: 30, physRisk: 15, climateScore: 48 },
];

const UW_LINES = [
  { line: 'Property', premium: 4200, claimsRatio: 68, climateAdj: 82, freqTrend: 1.08, sevTrend: 1.12, reserveGap: 14 },
  { line: 'Liability', premium: 2800, claimsRatio: 55, climateAdj: 62, freqTrend: 1.04, sevTrend: 1.08, reserveGap: 7 },
  { line: 'Motor', premium: 3100, claimsRatio: 72, climateAdj: 78, freqTrend: 1.02, sevTrend: 1.05, reserveGap: 6 },
  { line: 'Business Interrupt.', premium: 1500, claimsRatio: 45, climateAdj: 65, freqTrend: 1.12, sevTrend: 1.18, reserveGap: 20 },
  { line: 'Marine/Aviation', premium: 800, claimsRatio: 52, climateAdj: 68, freqTrend: 1.06, sevTrend: 1.10, reserveGap: 16 },
  { line: 'D&O/E&O', premium: 600, claimsRatio: 38, climateAdj: 48, freqTrend: 1.15, sevTrend: 1.22, reserveGap: 10 },
];

const WARMING = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0];
const claimsTrend = WARMING.map(w => ({
  warming: `+${w}C`,
  property: Math.round(68 * Math.pow(1 + (w - 1) * 0.12, 2)),
  liability: Math.round(55 * Math.pow(1 + (w - 1) * 0.06, 2)),
  business_int: Math.round(45 * Math.pow(1 + (w - 1) * 0.15, 2)),
}));

const ORSA_DIMS = ['Physical Risk', 'Transition Risk', 'Liability Risk', 'Operational Risk', 'Strategic Risk'];
const ORSA_SCORES = [72, 58, 45, 65, 52];

const SOLVENCY_RISKS = [
  { module: 'Market Risk', baseSCR: 850, climateAddon: 120, total: 970 },
  { module: 'Underwriting (Non-Life)', baseSCR: 620, climateAddon: 185, total: 805 },
  { module: 'Counterparty Default', baseSCR: 180, climateAddon: 25, total: 205 },
  { module: 'Operational Risk', baseSCR: 210, climateAddon: 35, total: 245 },
  { module: 'Health Underwriting', baseSCR: 120, climateAddon: 40, total: 160 },
];

const ESG_PILLARS = [
  { pillar: 'Environmental', weight: 40, score: 62 },
  { pillar: 'Social', weight: 30, score: 71 },
  { pillar: 'Governance', weight: 30, score: 78 },
];

const TABS = ['Investment Portfolio Climate Screen', 'Underwriting Book Climate Stress', 'Reserve Adequacy Under Climate', 'ORSA Climate Module', 'Solvency II Climate SCR', 'Insurance ESG Rating'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const kpi = (label, value, sub, color = T.navy) => (
  <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: '14px 18px', minWidth: 140, flex: 1 }}>
    <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function InsurancePortfolioClimatePage() {
  const [tab, setTab] = useState(0);
  const [warmingLevel, setWarmingLevel] = useState(2.0);
  const [reserveScenario, setReserveScenario] = useState('central');
  const [orsaOverrides, setOrsaOverrides] = useState({});

  const totalPremium = UW_LINES.reduce((s, l) => s + l.premium, 0);
  const totalSCR = SOLVENCY_RISKS.reduce((s, r) => s + r.total, 0);
  const baseSCR = SOLVENCY_RISKS.reduce((s, r) => s + r.baseSCR, 0);
  const climateAddon = SOLVENCY_RISKS.reduce((s, r) => s + r.climateAddon, 0);

  const reserveData = UW_LINES.map(l => {
    const factor = reserveScenario === 'optimistic' ? 0.7 : reserveScenario === 'central' ? 1.0 : 1.4;
    const gapAdj = l.reserveGap * factor;
    return { ...l, adjGap: +gapAdj.toFixed(1), currentReserve: Math.round(l.premium * l.claimsRatio / 100), needed: Math.round(l.premium * l.climateAdj / 100) };
  });

  const orsaRadar = ORSA_DIMS.map((d, i) => ({ dim: d, score: orsaOverrides[d] || ORSA_SCORES[i] }));
  const overallOrsa = Math.round(orsaRadar.reduce((s, d) => s + d.score, 0) / orsaRadar.length);

  const esgTotal = ESG_PILLARS.reduce((s, p) => s + p.score * p.weight / 100, 0).toFixed(1);

  const yearlyTrend = Array.from({ length: 10 }, (_, i) => ({
    year: 2020 + i,
    frequency: +(100 * Math.pow(1.06, i)).toFixed(0),
    severity: +(100 * Math.pow(1.09, i)).toFixed(0),
    combined: +(100 * Math.pow(1.06, i) * Math.pow(1.09, i) / 100).toFixed(0),
  }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CI5 . INSURANCE PORTFOLIO CLIMATE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Insurance Portfolio Climate Risk Analytics</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              Investment Screen . Underwriting Stress . Reserve Adequacy . ORSA Module . Solvency II SCR . ESG Rating
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ color: '#94a3b8', fontSize: 11 }}>Warming:</label>
            <select value={warmingLevel} onChange={e => setWarmingLevel(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {WARMING.map(w => <option key={w} value={w}>+{w}C</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '10px 14px', fontSize: 11, fontWeight: tab === i ? 700 : 500, cursor: 'pointer',
              background: tab === i ? T.bg : 'transparent', color: tab === i ? T.navy : '#94a3b8',
              border: 'none', borderRadius: '8px 8px 0 0', fontFamily: T.font, borderBottom: tab === i ? `2px solid ${T.gold}` : 'none'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {kpi('GWP', `$${(totalPremium / 1000).toFixed(1)}B`, 'gross written premium')}
          {kpi('Investment AUM', '$28.5B', '6 asset classes')}
          {kpi('Total SCR', `$${(totalSCR / 1000).toFixed(1)}B`, `incl. ${climateAddon}M climate add-on`)}
          {kpi('Reserve Gap', `${Math.round(reserveData.reduce((s, l) => s + l.adjGap, 0) / reserveData.length)}%`, 'avg under-reserving', T.red)}
          {kpi('ESG Score', esgTotal, 'weighted composite', T.green)}
        </div>

        {/* Tab 0: Investment Portfolio */}
        {tab === 0 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Investment Portfolio Climate Screen</h3>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={ASSET_CLASSES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="allocation" name="Allocation %" fill={T.blue} opacity={0.5} />
                  <Bar dataKey="transRisk" name="Transition Risk" fill={T.orange} />
                  <Bar dataKey="physRisk" name="Physical Risk" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Asset Class Detail</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Asset Class', 'Allocation', 'Trans Risk', 'Phys Risk', 'Climate Score'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {ASSET_CLASSES.map(a => (
                    <tr key={a.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{a.allocation}%</td>
                      <td style={{ padding: '8px 6px', color: a.transRisk > 25 ? T.red : T.amber, fontWeight: 600 }}>{a.transRisk}%</td>
                      <td style={{ padding: '8px 6px', color: a.physRisk > 25 ? T.red : T.amber, fontWeight: 600 }}>{a.physRisk}%</td>
                      <td style={{ padding: '8px 6px' }}><span style={{ color: a.climateScore > 60 ? T.green : T.amber, fontWeight: 600 }}>{a.climateScore}/100</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 1: Underwriting Stress */}
        {tab === 1 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Claims Ratio Under Warming Scenarios</h3>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={claimsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="warming" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[30, 150]} label={{ value: 'Claims Ratio %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="property" stroke={T.red} strokeWidth={2} name="Property" />
                  <Line dataKey="liability" stroke={T.blue} strokeWidth={2} name="Liability" />
                  <Line dataKey="business_int" stroke={T.orange} strokeWidth={2} name="Business Interruption" />
                  <ReferenceLine y={100} stroke={T.textMut} strokeDasharray="5 5" label={{ value: 'Breakeven', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Frequency & Severity Trend (Indexed to 2020=100)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={yearlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="frequency" fill={T.blue} opacity={0.4} name="Frequency Index" />
                  <Bar dataKey="severity" fill={T.red} opacity={0.4} name="Severity Index" />
                  <Line dataKey="combined" stroke={T.navy} strokeWidth={2} name="Combined Index" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Line', 'Premium ($M)', 'Base Claims%', 'Climate-Adj%', 'Freq Trend', 'Sev Trend'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {UW_LINES.map(l => (
                    <tr key={l.line} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{l.line}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>${l.premium}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{l.claimsRatio}%</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono, color: l.climateAdj > 70 ? T.red : T.amber, fontWeight: 600 }}>{l.climateAdj}%</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{l.freqTrend}x</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono, color: l.sevTrend > 1.1 ? T.red : T.textSec }}>{l.sevTrend}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Reserve Adequacy */}
        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['optimistic', 'central', 'adverse'].map(s => (
                <button key={s} onClick={() => setReserveScenario(s)} style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: reserveScenario === s ? T.navy : T.surface, color: reserveScenario === s ? '#fff' : T.navy,
                  border: `1px solid ${reserveScenario === s ? T.navy : T.border}`
                }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Reserve Gap by Line of Business ({reserveScenario})</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reserveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="line" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="currentReserve" name="Current Reserve ($M)" fill={T.blue} />
                  <Bar dataKey="needed" name="Climate-Adj Needed ($M)" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Reserve Gap Calculator</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Line', 'Current Reserve', 'Climate-Adjusted', 'Gap %', 'Gap Amount'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {reserveData.map(l => (
                    <tr key={l.line} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{l.line}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>${l.currentReserve}M</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>${l.needed}M</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono, fontWeight: 700, color: l.adjGap > 15 ? T.red : l.adjGap > 8 ? T.orange : T.green }}>{l.adjGap}%</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono, color: T.red }}>${Math.round(l.needed - l.currentReserve)}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: ORSA Climate Module */}
        {tab === 3 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>ORSA Climate Risk Assessment (EIOPA Aligned)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  {ORSA_DIMS.map((d, i) => (
                    <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, width: 120 }}>{d}</span>
                      <input type="range" min={0} max={100} value={orsaOverrides[d] || ORSA_SCORES[i]}
                        onChange={e => setOrsaOverrides(p => ({ ...p, [d]: +e.target.value }))} style={{ flex: 1 }} />
                      <span style={{ fontFamily: T.mono, fontSize: 12, width: 30 }}>{orsaOverrides[d] || ORSA_SCORES[i]}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, padding: 12, background: overallOrsa > 60 ? '#f0fdf4' : '#fef2f2', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>Overall ORSA Climate Score</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: overallOrsa > 60 ? T.green : T.red }}>{overallOrsa}/100</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={orsaRadar}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Solvency II Climate SCR */}
        {tab === 4 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Solvency II SCR - Climate Risk Add-On</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={SOLVENCY_RISKS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} label={{ value: '$M', position: 'bottom', fontSize: 11 }} />
                  <YAxis type="category" dataKey="module" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip formatter={v => `$${v}M`} />
                  <Legend />
                  <Bar dataKey="baseSCR" name="Base SCR" fill={T.blue} stackId="a" />
                  <Bar dataKey="climateAddon" name="Climate Add-On" fill={T.red} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {kpi('Base SCR', `$${baseSCR}M`, 'standard formula')}
              {kpi('Climate Add-On', `$${climateAddon}M`, `${(climateAddon / baseSCR * 100).toFixed(1)}% increase`, T.red)}
              {kpi('Total SCR', `$${totalSCR}M`, 'climate-adjusted')}
            </div>
          </div>
        )}

        {/* Tab 5: Insurance ESG Rating */}
        {tab === 5 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Insurance ESG Composite Rating</h3>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ textAlign: 'center', padding: 24, background: '#f0fdf4', borderRadius: 12, minWidth: 120 }}>
                  <div style={{ fontSize: 42, fontWeight: 700, color: T.green }}>{esgTotal}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>Composite Score</div>
                </div>
                <div style={{ flex: 1 }}>
                  {ESG_PILLARS.map(p => (
                    <div key={p.pillar} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, width: 100 }}>{p.pillar}</span>
                      <div style={{ flex: 1, height: 10, background: T.border, borderRadius: 5 }}>
                        <div style={{ width: `${p.score}%`, height: 10, background: p.score > 70 ? T.green : p.score > 55 ? T.amber : T.red, borderRadius: 5 }} />
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 12, width: 40 }}>{p.score}</span>
                      <span style={{ fontSize: 10, color: T.textMut }}>(wt:{p.weight}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Regulatory Compliance Tracker</h3>
              {[
                { reg: 'EIOPA Climate Stress Test', status: 'Compliant', color: T.green },
                { reg: "Lloyd's Climate Scenarios", status: 'Partial', color: T.amber },
                { reg: 'Swiss Re Sigma Benchmark', status: 'On Track', color: T.blue },
                { reg: 'NAIC Climate Risk Disclosure', status: 'Compliant', color: T.green },
                { reg: 'TCFD Recommendations', status: 'Compliant', color: T.green },
                { reg: 'SFDR Principal Adverse Impacts', status: 'In Progress', color: T.amber },
              ].map(r => (
                <div key={r.reg} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{r.reg}</span>
                  <span style={{ color: r.color, fontWeight: 700, fontFamily: T.mono }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Reference Data</h4>
            {['EIOPA Climate Stress Test 2024', "Lloyd's Realistic Climate Scenarios", 'Swiss Re sigma Research', 'NAIC Climate Risk Disclosure Survey', 'Solvency II Standard Formula', 'ORSA Supervisory Guidelines'].map(r => (
              <div key={r} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>{r}</div>
            ))}
          </div>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Engagement Tools</h4>
            {['Reserve gap calculator', 'ORSA climate module template', 'Regulatory compliance tracker', 'Claims frequency/severity modeler', 'Solvency II SCR calculator', 'Investment portfolio climate screener'].map(e => (
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
