import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, Cell, Legend, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', purple: '#6d28d9' };
const fmt = (n, d = 1) => n >= 1e9 ? `$${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(d)}K` : `$${n.toFixed(d)}`;
const pct = (n, d = 1) => `${(n * 100).toFixed(d)}%`;

const PERILS = ['Tropical Cyclone', 'River Flood', 'Storm Surge', 'Earthquake', 'Wildfire', 'Drought', 'Hail', 'Winter Storm'];
const PERIL_COLORS = { 'Tropical Cyclone': '#0f766e', 'River Flood': '#1d4ed8', 'Storm Surge': '#0369a1', 'Earthquake': '#b45309', 'Wildfire': '#c2410c', 'Drought': '#a16207', 'Hail': '#6d28d9', 'Winter Storm': '#374151' };
const SCENARIOS = ['Current Climate', 'RCP 4.5 (2050)', 'RCP 8.5 (2050)', 'RCP 8.5 (2100)'];
const SCENARIO_MULT = { 'Current Climate': 1.0, 'RCP 4.5 (2050)': 1.24, 'RCP 8.5 (2050)': 1.61, 'RCP 8.5 (2100)': 2.38 };
const REGIONS = ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];

// Exceedance probability data (return period vs loss)
const EP_DATA = [1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000].map((rp, i) => ({
  returnPeriod: rp,
  exceedancePct: (1 / rp * 100).toFixed(3),
  currentLoss:  Math.round((rp === 1 ? 180 : rp === 2 ? 320 : rp === 5 ? 580 : rp === 10 ? 920 : rp === 20 ? 1400 : rp === 50 ? 2200 : rp === 100 ? 3100 : rp === 200 ? 4200 : rp === 250 ? 4600 : rp === 500 ? 6100 : 8400) * 1e6),
  rcp45Loss:    Math.round((rp === 1 ? 220 : rp === 2 ? 400 : rp === 5 ? 720 : rp === 10 ? 1140 : rp === 20 ? 1740 : rp === 50 ? 2730 : rp === 100 ? 3840 : rp === 200 ? 5210 : rp === 250 ? 5710 : rp === 500 ? 7560 : 10420) * 1e6),
  rcp85Loss:    Math.round((rp === 1 ? 290 : rp === 2 ? 520 : rp === 5 ? 940 : rp === 10 ? 1480 : rp === 20 ? 2250 : rp === 50 ? 3540 : rp === 100 ? 4990 : rp === 200 ? 6760 : rp === 250 ? 7410 : rp === 500 ? 9820 : 13530) * 1e6),
  rcp85_2100:   Math.round((rp === 1 ? 430 : rp === 2 ? 770 : rp === 5 ? 1380 : rp === 10 ? 2190 : rp === 20 ? 3330 : rp === 50 ? 5240 : rp === 100 ? 7380 : rp === 200 ? 10000 : rp === 250 ? 10960 : rp === 500 ? 14530 : 20020) * 1e6),
}));

const AAL_BY_PERIL = PERILS.map((p, i) => ({
  peril: p.replace('Tropical ', 'TC '),
  aal_current: Math.round((100 + sr(i * 7) * 400) * 1e6),
  aal_rcp45:   Math.round((100 + sr(i * 7) * 400) * 1e6 * 1.24),
  aal_rcp85:   Math.round((100 + sr(i * 7) * 400) * 1e6 * 1.61),
  aal_2100:    Math.round((100 + sr(i * 7) * 400) * 1e6 * 2.38),
  growth_rcp85: ((1.61 - 1) * 100 * (0.9 + sr(i * 11) * 0.2)).toFixed(0),
}));

const PORTFOLIO_EXPOSURE = REGIONS.map((r, i) => ({
  region: r,
  tiv: Math.round((5 + sr(i * 3) * 45) * 1e9),
  insured: Math.round((3 + sr(i * 5) * 30) * 1e9),
  aal_pct: (0.8 + sr(i * 7) * 2.4).toFixed(2),
  pml_100yr_pct: (4.2 + sr(i * 9) * 8.1).toFixed(2),
  top_peril: PERILS[i % PERILS.length],
}));

const SCENARIO_COMPARISON = SCENARIOS.map((s, i) => ({
  scenario: s.replace(' (2050)', '').replace(' (2100)', ''),
  label: s,
  aal: Math.round(1820 * SCENARIO_MULT[s]),
  pml_100:  Math.round(3100 * SCENARIO_MULT[s] * (1 + sr(i * 13) * 0.05)),
  pml_250:  Math.round(4600 * SCENARIO_MULT[s] * (1 + sr(i * 17) * 0.04)),
  freq_change: ((SCENARIO_MULT[s] - 1) * 100 * (0.9 + sr(i * 19) * 0.2)).toFixed(1),
  sev_change:  ((SCENARIO_MULT[s] - 1) * 100 * (0.75 + sr(i * 23) * 0.3)).toFixed(1),
}));

const RADAR_DATA = PERILS.map((p, i) => ({
  peril: p.replace('Tropical Cyclone', 'TC').replace('Winter Storm', 'W.Storm').replace('River Flood', 'Flood').replace('Storm Surge', 'Surge'),
  current: Math.round(30 + sr(i * 5) * 60),
  rcp85:   Math.round((30 + sr(i * 5) * 60) * (1.4 + sr(i * 7) * 0.6)),
}));

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy, borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
        marginBottom: -2, transition: 'all 0.15s',
      }}>{t}</button>
    ))}
  </div>
);

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', border: `1px solid #e5e0d8`, borderRadius: 8, padding: '14px 18px', flex: 1 }}>
    <div style={{ fontSize: 11, color: T.gray, fontFamily: 'DM Sans, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.gray, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Section = ({ title, children, badge }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: 20, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: 'DM Sans, sans-serif' }}>{title}</h3>
      {badge && <span style={{ fontSize: 10, background: T.navy, color: '#fff', padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const Sel = ({ label, value, options, onChange }) => (
  <div>
    {label && <div style={{ fontSize: 11, color: T.gray, marginBottom: 3, fontFamily: 'DM Sans, sans-serif' }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding: '6px 10px', border: `1px solid #d1c9bc`, borderRadius: 6, fontFamily: 'DM Sans, sans-serif',
      fontSize: 13, background: '#fff', color: T.navy, cursor: 'pointer'
    }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

export default function NatCatLossEnginePage() {
  const [tab, setTab] = useState('Loss Modeler');
  const [scenario, setScenario] = useState('RCP 8.5 (2050)');
  const [peril, setPeril] = useState('Tropical Cyclone');
  const [portfolioValue, setPortfolioValue] = useState(25);
  const [returnPeriod, setReturnPeriod] = useState(100);

  const mult = SCENARIO_MULT[scenario];
  const aal = Math.round(1820 * mult * 1e6);
  const pml100 = Math.round(3100 * mult * 1e6);
  const pml250 = Math.round(4600 * mult * 1e6);
  const pmlPct = ((pml100 / (portfolioValue * 1e9)) * 100).toFixed(1);

  const epFiltered = EP_DATA.map(d => ({
    ...d,
    scenarioLoss: scenario === 'Current Climate' ? d.currentLoss : scenario === 'RCP 4.5 (2050)' ? d.rcp45Loss : scenario === 'RCP 8.5 (2050)' ? d.rcp85Loss : d.rcp85_2100,
  }));

  const TABS = ['Loss Modeler', 'EP Curves', 'Scenario Impact', 'AAL by Peril', 'Portfolio Exposure'];

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BM1</span>
          <span style={{ fontSize: 11, color: T.red, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>NATCAT ENGINE</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>NatCat Climate Loss Engine</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>Natural catastrophe loss modelling · IPCC AR6 scenarios · Exceedance probability curves · AAL calculations · Portfolio exposure</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'Loss Modeler' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Sel label="Climate Scenario" value={scenario} options={SCENARIOS} onChange={setScenario} />
            <Sel label="Primary Peril" value={peril} options={PERILS} onChange={setPeril} />
            <div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 3 }}>Portfolio TIV (USD B)</div>
              <input type="range" min={5} max={100} step={5} value={portfolioValue} onChange={e => setPortfolioValue(+e.target.value)}
                style={{ accentColor: T.gold, width: 160 }} />
              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: T.gold, marginLeft: 8 }}>${portfolioValue}B</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Annual Average Loss" value={fmt(aal)} sub={`${pct(aal / (portfolioValue * 1e9))} of TIV`} color={T.red} />
            <Kpi label="100-Yr PML" value={fmt(pml100)} sub={`${pmlPct}% of TIV`} color={T.orange} />
            <Kpi label="250-Yr PML" value={fmt(pml250)} sub={`${((pml250 / (portfolioValue * 1e9)) * 100).toFixed(1)}% of TIV`} color={T.purple} />
            <Kpi label="vs Current Climate" value={`+${((mult - 1) * 100).toFixed(0)}%`} sub="AAL amplification" color={mult > 1.5 ? T.red : T.orange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Loss Distribution by Return Period" badge={scenario}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={epFiltered.slice(0, 8)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="returnPeriod" tickFormatter={v => `${v}yr`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => fmt(v)} labelFormatter={l => `${l}-Year Return Period`} />
                  <Bar dataKey="currentLoss" name="Current Climate" fill="#6b7280" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="scenarioLoss" name={scenario} fill={T.red} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Peril Risk Amplification (RCP 8.5)" badge="Radar">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="#e5e0d8" />
                  <PolarAngleAxis dataKey="peril" style={{ fontSize: 11, fontFamily: 'DM Sans, sans-serif' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 150]} tick={false} />
                  <Radar dataKey="current" name="Current" stroke="#6b7280" fill="#6b7280" fillOpacity={0.2} />
                  <Radar dataKey="rcp85" name="RCP 8.5" stroke={T.red} fill={T.red} fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <Section title="Scenario Comparison Summary">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Scenario', 'AAL', '100-Yr PML', '250-Yr PML', 'Freq Change', 'Sev Change'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCENARIO_COMPARISON.map((s, i) => (
                  <tr key={s.scenario} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{s.label}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.red }}>{fmt(s.aal * 1e6)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(s.pml_100 * 1e6)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(s.pml_250 * 1e6)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: +s.freq_change > 0 ? T.red : T.green }}>{+s.freq_change > 0 ? '+' : ''}{s.freq_change}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: +s.sev_change > 0 ? T.red : T.green }}>{+s.sev_change > 0 ? '+' : ''}{s.sev_change}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {tab === 'EP Curves' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Sel label="Compare Scenarios" value={scenario} options={SCENARIOS} onChange={setScenario} />
          </div>
          <Section title="Occurrence Exceedance Probability (OEP) Curves" badge="All Perils Combined">
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={EP_DATA} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="returnPeriod" tickFormatter={v => `${v}yr`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v)} labelFormatter={l => `${l}-Year Return Period`} />
                <Line dataKey="currentLoss" name="Current Climate" stroke="#6b7280" strokeWidth={2} dot={false} />
                <Line dataKey="rcp45Loss"   name="RCP 4.5 (2050)" stroke="#0f766e" strokeWidth={2} dot={false} strokeDasharray="6 3" />
                <Line dataKey="rcp85Loss"   name="RCP 8.5 (2050)" stroke={T.orange} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line dataKey="rcp85_2100"  name="RCP 8.5 (2100)" stroke={T.red} strokeWidth={2.5} dot={false} />
                <ReferenceLine x={100} stroke={T.gold} strokeDasharray="4 4" label={{ value: '100yr', fill: T.gold, fontSize: 11 }} />
                <ReferenceLine x={250} stroke={T.gold} strokeDasharray="4 4" label={{ value: '250yr', fill: T.gold, fontSize: 11 }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="OEP Table — Key Return Periods">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Return Period', 'Current', 'RCP 4.5', 'RCP 8.5', 'RCP 8.5 2100'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EP_DATA.filter(d => [5, 10, 20, 50, 100, 200, 250, 500, 1000].includes(d.returnPeriod)).map((d, i) => (
                    <tr key={d.returnPeriod} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.navy }}>{d.returnPeriod}-Yr</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(d.currentLoss)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: '#0f766e' }}>{fmt(d.rcp45Loss)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.orange }}>{fmt(d.rcp85Loss)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.red }}>{fmt(d.rcp85_2100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Loss Amplification vs Current Climate">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={EP_DATA.filter(d => [10, 50, 100, 250, 500].includes(d.returnPeriod))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="returnPeriod" tickFormatter={v => `${v}yr`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => `${v.toFixed(1)}%`} />
                  <Bar dataKey={d => d.currentLoss ? parseFloat(((d.rcp45Loss / d.currentLoss - 1) * 100).toFixed(1)) : 0} name="RCP 4.5" fill="#0f766e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey={d => d.currentLoss ? parseFloat(((d.rcp85Loss / d.currentLoss - 1) * 100).toFixed(1)) : 0} name="RCP 8.5" fill={T.orange} radius={[3, 3, 0, 0]} />
                  <Bar dataKey={d => d.currentLoss ? parseFloat(((d.rcp85_2100 / d.currentLoss - 1) * 100).toFixed(1)) : 0} name="RCP 8.5 2100" fill={T.red} radius={[3, 3, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </>
      )}

      {tab === 'Scenario Impact' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {SCENARIO_COMPARISON.map((s, i) => (
              <Kpi key={s.scenario} label={s.label} value={fmt(s.aal * 1e6)} sub={`PML100: ${fmt(s.pml_100 * 1e6)}`} color={i === 0 ? T.gray : i === 1 ? '#0f766e' : i === 2 ? T.orange : T.red} />
            ))}
          </div>
          <Section title="Frequency vs Severity Impact by Scenario">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={SCENARIO_COMPARISON} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="scenario" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }} />
                <YAxis tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `+${v}%`} />
                <Bar dataKey="freq_change" name="Frequency Change %" fill="#0f766e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sev_change"  name="Severity Change %" fill={T.red}     radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="PML Comparison Across Scenarios (100yr vs 250yr)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={SCENARIO_COMPARISON} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="scenario" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(1)}B`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v * 1e6)} />
                <Bar dataKey="pml_100" name="100-Yr PML" fill={T.orange} radius={[3, 3, 0, 0]} />
                <Bar dataKey="pml_250" name="250-Yr PML" fill={T.red}    radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {tab === 'AAL by Peril' && (
        <>
          <Section title="Average Annual Loss by Peril — Climate Scenario Comparison" badge="USD Millions">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={AAL_BY_PERIL} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="peril" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="aal_current" name="Current" fill="#6b7280" radius={[2, 2, 0, 0]} />
                <Bar dataKey="aal_rcp45"   name="RCP 4.5" fill="#0f766e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="aal_rcp85"   name="RCP 8.5" fill={T.orange} radius={[2, 2, 0, 0]} />
                <Bar dataKey="aal_2100"    name="2100"     fill={T.red}   radius={[2, 2, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Peril Details — AAL & RCP 8.5 Growth">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Peril', 'AAL Current', 'AAL RCP 4.5', 'AAL RCP 8.5', 'AAL 2100', 'RCP 8.5 Growth'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AAL_BY_PERIL.map((p, i) => (
                  <tr key={p.peril} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.peril}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(p.aal_current)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: '#0f766e' }}>{fmt(p.aal_rcp45)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.orange }}>{fmt(p.aal_rcp85)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.red }}>{fmt(p.aal_2100)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: +p.growth_rcp85 > 60 ? T.red : T.orange }}>+{p.growth_rcp85}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {tab === 'Portfolio Exposure' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Total TIV" value={fmt(PORTFOLIO_EXPOSURE.reduce((a, r) => a + r.tiv, 0))} sub="Across all regions" color={T.navy} />
            <Kpi label="Total Insured Value" value={fmt(PORTFOLIO_EXPOSURE.reduce((a, r) => a + r.insured, 0))} sub="Insured portion" color={T.green} />
            <Kpi label="Portfolio AAL" value={`$${(PORTFOLIO_EXPOSURE.reduce((a, r) => a + r.tiv * parseFloat(r.aal_pct) / 100, 0) / 1e6).toFixed(0)}M`} sub="Weighted average" color={T.orange} />
            <Kpi label="Max 100-Yr PML%" value={`${Math.max(...PORTFOLIO_EXPOSURE.map(r => parseFloat(r.pml_100yr_pct))).toFixed(1)}%`} sub="Worst region" color={T.red} />
          </div>
          <Section title="Regional TIV & Insured Value">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={PORTFOLIO_EXPOSURE} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="region" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="tiv"     name="TIV"           fill={T.navy}  radius={[3, 3, 0, 0]} />
                <Bar dataKey="insured" name="Insured Value" fill={T.gold}  radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Regional Risk Metrics">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Region', 'TIV', 'Insured Value', 'AAL %', '100-Yr PML %', 'Top Peril'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_EXPOSURE.map((r, i) => (
                  <tr key={r.region} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.region}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(r.tiv)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.green }}>{fmt(r.insured)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.orange }}>{r.aal_pct}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: parseFloat(r.pml_100yr_pct) > 10 ? T.red : T.orange }}>{r.pml_100yr_pct}%</td>
                    <td style={{ padding: '8px 12px', color: T.purple }}>{r.top_peril}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}
    </div>
  );
}
