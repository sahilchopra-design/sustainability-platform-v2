import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', sage:'#5a8a6a', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', teal:'#0f766e', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PURPLE = '#7c3aed';
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const SCENARIOS = [
  { name: 'Net Zero 2050',         tempOutcome: '1.5°C', carbonPrice2030: 130, carbonPrice2050: 250, renewablesShare2030: 65, renewablesShare2050: 90, strandedAssets: 1.2, gdpImpact2050: -1.4, portfolioImpact: 14.2 },
  { name: '1.5°C Accelerated',     tempOutcome: '1.4°C', carbonPrice2030: 185, carbonPrice2050: 310, renewablesShare2030: 72, renewablesShare2050: 95, strandedAssets: 0.9, gdpImpact2050: -1.8, portfolioImpact: 23.1 },
  { name: '2°C Gradual',           tempOutcome: '2.0°C', carbonPrice2030:  85, carbonPrice2050: 170, renewablesShare2030: 52, renewablesShare2050: 78, strandedAssets: 1.9, gdpImpact2050: -0.9, portfolioImpact:  6.8 },
  { name: 'Delayed Transition',    tempOutcome: '2.4°C', carbonPrice2030:  40, carbonPrice2050: 290, renewablesShare2030: 38, renewablesShare2050: 70, strandedAssets: 3.4, gdpImpact2050: -4.2, portfolioImpact: -8.7 },
  { name: 'Failed Transition',     tempOutcome: '3.2°C', carbonPrice2030:  12, carbonPrice2050:  35, renewablesShare2030: 28, renewablesShare2050: 45, strandedAssets: 6.1, gdpImpact2050:-11.3, portfolioImpact:-22.4 },
];

const SECTOR_CAPEX = [
  { sector: 'Power',         required: 820, current: 390, gap: 430, readiness: 72 },
  { sector: 'Transport',     required: 610, current: 210, gap: 400, readiness: 54 },
  { sector: 'Buildings',     required: 480, current: 180, gap: 300, readiness: 48 },
  { sector: 'Industry',      required: 540, current: 140, gap: 400, readiness: 38 },
  { sector: 'Agriculture',   required: 310, current:  90, gap: 220, readiness: 31 },
  { sector: 'Hydrogen',      required: 270, current:  45, gap: 225, readiness: 27 },
  { sector: 'Carbon Capture',required: 190, current:  22, gap: 168, readiness: 19 },
  { sector: 'Land Use',      required: 150, current:  65, gap:  85, readiness: 44 },
];

const STRANDED_TIMELINE = [
  { year: 2025, nz2050: 0.3, gradual: 0.2, failed: 0.1 },
  { year: 2030, nz2050: 1.2, gradual: 0.7, failed: 0.3 },
  { year: 2035, nz2050: 2.4, gradual: 1.3, failed: 0.5 },
  { year: 2040, nz2050: 3.9, gradual: 2.1, failed: 0.9 },
  { year: 2045, nz2050: 5.4, gradual: 3.0, failed: 1.4 },
  { year: 2050, nz2050: 7.1, gradual: 4.2, failed: 2.2 },
];

const PORTFOLIO_IMPACT = [
  { assetClass: 'Renewables Equity',    orderly:  38.4, disorderly: -12.1 },
  { assetClass: 'Green Bonds',          orderly:  12.6, disorderly:  -4.8 },
  { assetClass: 'Diversified Equity',   orderly:   6.3, disorderly: -18.6 },
  { assetClass: 'Real Estate',          orderly:  -2.1, disorderly: -24.3 },
  { assetClass: 'Fossil Fuel Equity',   orderly: -31.7, disorderly:  -8.4 },
  { assetClass: 'Sovereign Bonds (EM)', orderly:  -8.9, disorderly: -34.7 },
];

const PATHWAY_MILESTONES = [
  { milestone: 'Coal power phase-out (OECD)',       year: 2030, dependency: 'Policy' },
  { milestone: 'EV tipping point (>50% new sales)', year: 2032, dependency: 'Market' },
  { milestone: 'Green hydrogen cost parity',         year: 2034, dependency: 'Technology' },
  { milestone: 'Coal phase-out (Global)',            year: 2040, dependency: 'Policy' },
  { milestone: 'Net zero power sector',             year: 2035, dependency: 'Policy' },
  { milestone: 'Sustainable aviation fuel scale',   year: 2037, dependency: 'Technology' },
  { milestone: 'Industrial heat electrification',   year: 2042, dependency: 'Technology' },
  { milestone: 'Net zero industry',                 year: 2050, dependency: 'Market' },
];

const TABS = ['Overview', 'Pathway Constructor', 'Sector CapEx', 'Stranded Asset Timeline', 'Portfolio Impact'];

const fmt = (v, prefix = '', suffix = '') => `${prefix}${typeof v === 'number' ? v.toLocaleString() : v}${suffix}`;
const pct = v => `${v > 0 ? '+' : ''}${v}%`;

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, background: color+'18', color, border:`1px solid ${color}40`, letterSpacing:'0.04em' }}>{text}</span>
);

const ScenarioBar = ({ scenario, maxImpact = 30 }) => {
  const isPositive = scenario.portfolioImpact > 0;
  const barW = Math.abs(scenario.portfolioImpact) / maxImpact * 120;
  const color = isPositive ? T.green : T.red;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:`1px solid ${T.border}` }}>
      <div style={{ width:160, fontSize:12, color:T.text, fontWeight:500 }}>{scenario.name}</div>
      <div style={{ width:80, fontSize:11, color:T.textMut }}>{scenario.tempOutcome}</div>
      <div style={{ flex:1, display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width: barW, height:12, borderRadius:3, background:color, opacity:0.8 }} />
        <span style={{ fontSize:12, fontWeight:600, color }}>{pct(scenario.portfolioImpact)}</span>
      </div>
      <div style={{ width:80, fontSize:11, color:T.textSec, textAlign:'right' }}>${scenario.strandedAssets}T stranded</div>
    </div>
  );
};

export default function TransitionScenarioModellerPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedScenario, setSelectedScenario] = useState(0);
  const sc = SCENARIOS[selectedScenario];

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, padding:'28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:PURPLE, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:18 }}>🔀</span>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:T.navy }}>Transition Scenario Modeller</h1>
              <Badge text="EP-AB5" color={PURPLE} />
              <Badge text="NGFS Aligned" color={T.teal} />
            </div>
            <p style={{ margin:0, fontSize:12, color:T.textSec, marginTop:2 }}>
              Model climate transition pathways, capital deployment requirements, and portfolio impacts across 5 NGFS-aligned scenarios
            </p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:`2px solid ${T.border}`, paddingBottom:0 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding:'8px 16px', fontSize:13, fontWeight:activeTab===tab?700:500,
            color: activeTab===tab ? PURPLE : T.textSec,
            background:'transparent', border:'none', borderBottom: activeTab===tab ? `2px solid ${PURPLE}` : '2px solid transparent',
            cursor:'pointer', marginBottom:-2, transition:'all 0.15s'
          }}>{tab}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div>
          <div style={{ display:'flex', gap:14, marginBottom:20 }}>
            <StatCard label="Annual Clean Energy Investment Needed" value="$5.4T" sub="By 2030, per IEA NZE pathway" color={PURPLE} />
            <StatCard label="Renewable Capacity Addition" value="847 GW/yr" sub="Required to meet Net Zero 2050" color={T.teal} />
            <StatCard label="Stranded Assets by 2030 (NZ2050)" value="$1.2T" sub="Fossil fuel infrastructure at risk" color={T.amber} />
            <StatCard label="Portfolio Upside — Accelerated" value="+23%" sub="Accelerated 1.5°C scenario return" color={T.green} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Scenario Comparison */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:16 }}>Scenario Portfolio Impact Summary</div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:10, display:'flex', gap:10 }}>
                <span style={{ width:160 }}>SCENARIO</span>
                <span style={{ width:80 }}>OUTCOME</span>
                <span style={{ flex:1 }}>PORTFOLIO IMPACT (2050)</span>
                <span style={{ width:80, textAlign:'right' }}>STRANDED</span>
              </div>
              {SCENARIOS.map(s => <ScenarioBar key={s.name} scenario={s} />)}
            </div>

            {/* Carbon Price Trajectories */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>Carbon Price by Scenario (2030 vs 2050)</div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:12 }}>USD per tonne CO₂e</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={SCENARIOS.map(s => ({ name: s.name.split(' ').slice(0,2).join(' '), y2030: s.carbonPrice2030, y2050: s.carbonPrice2050 }))} margin={{ top:4, right:8, bottom:20, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textMut }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize:10, fill:T.textMut }} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={tip} formatter={(v, n) => [`$${v}/t`, n === 'y2030' ? '2030' : '2050']} />
                  <Bar dataKey="y2030" name="2030" radius={[3,3,0,0]}>
                    {SCENARIOS.map((_, i) => <Cell key={i} fill={PURPLE} opacity={0.55} />)}
                  </Bar>
                  <Bar dataKey="y2050" name="2050" radius={[3,3,0,0]}>
                    {SCENARIOS.map((_, i) => <Cell key={i} fill={PURPLE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Renewables Share */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>Renewables Share of Power Mix (%)</div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:12 }}>2030 and 2050 targets per scenario</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={SCENARIOS.map(s => ({ name: s.name.split(' ').slice(0,2).join(' '), r2030: s.renewablesShare2030, r2050: s.renewablesShare2050 }))} margin={{ top:4, right:8, bottom:20, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textMut }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize:10, fill:T.textMut }} tickFormatter={v => `${v}%`} domain={[0,100]} />
                  <Tooltip contentStyle={tip} formatter={(v, n) => [`${v}%`, n === 'r2030' ? '2030' : '2050']} />
                  <Bar dataKey="r2030" name="2030" radius={[3,3,0,0]}>
                    {SCENARIOS.map((_, i) => <Cell key={i} fill={T.teal} opacity={0.5} />)}
                  </Bar>
                  <Bar dataKey="r2050" name="2050" radius={[3,3,0,0]}>
                    {SCENARIOS.map((_, i) => <Cell key={i} fill={T.teal} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Key Milestones */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:14 }}>Net Zero Pathway Milestones</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {PATHWAY_MILESTONES.map((m, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 10px', background:T.bg, borderRadius:7 }}>
                    <div style={{ width:42, height:42, borderRadius:8, background: PURPLE+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:PURPLE }}>{m.year}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:T.navy, fontWeight:500 }}>{m.milestone}</div>
                      <div style={{ fontSize:10, color:T.textMut, marginTop:1 }}>{m.dependency} driver</div>
                    </div>
                    <Badge text={m.dependency} color={m.dependency==='Policy'?T.amber:m.dependency==='Technology'?PURPLE:T.teal} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pathway Constructor Tab */}
      {activeTab === 'Pathway Constructor' && (
        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, height:'fit-content' }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:16 }}>Select Transition Pathway</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {SCENARIOS.map((s, i) => (
                <button key={i} onClick={() => setSelectedScenario(i)} style={{
                  padding:'12px 14px', borderRadius:9, border: selectedScenario===i ? `2px solid ${PURPLE}` : `1px solid ${T.border}`,
                  background: selectedScenario===i ? PURPLE+'0d' : T.surface, cursor:'pointer', textAlign:'left', transition:'all 0.15s'
                }}>
                  <div style={{ fontSize:13, fontWeight:600, color: selectedScenario===i ? PURPLE : T.navy }}>{s.name}</div>
                  <div style={{ fontSize:11, color:T.textMut, marginTop:3 }}>Outcome: {s.tempOutcome} — GDP: {pct(s.gdpImpact2050)} by 2050</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Scenario Header */}
            <div style={{ background: PURPLE+'0d', border:`2px solid ${PURPLE}30`, borderRadius:12, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
                <div style={{ fontSize:20, fontWeight:700, color:PURPLE }}>{sc.name}</div>
                <Badge text={sc.tempOutcome} color={sc.portfolioImpact>0?T.green:T.red} />
              </div>
              <div style={{ fontSize:12, color:T.textSec }}>
                Modelled GDP impact by 2050: {pct(sc.gdpImpact2050)} | Portfolio projected impact: {pct(sc.portfolioImpact)}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              <StatCard label="Carbon Price 2030" value={`$${sc.carbonPrice2030}/t`} sub="CO₂e per tonne" color={PURPLE} />
              <StatCard label="Carbon Price 2050" value={`$${sc.carbonPrice2050}/t`} sub="CO₂e per tonne" color={PURPLE} />
              <StatCard label="Stranded Assets" value={`$${sc.strandedAssets}T`} sub="Cumulative by 2050" color={T.red} />
              <StatCard label="Renewables 2030" value={`${sc.renewablesShare2030}%`} sub="Share of power mix" color={T.teal} />
              <StatCard label="Renewables 2050" value={`${sc.renewablesShare2050}%`} sub="Share of power mix" color={T.teal} />
              <StatCard label="Portfolio Impact" value={pct(sc.portfolioImpact)} sub="Total return differential" color={sc.portfolioImpact>0?T.green:T.red} />
            </div>

            {/* Pathway Milestones Timeline */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:14 }}>Pathway Milestone Timeline — {sc.name}</div>
              <div style={{ position:'relative', paddingLeft:20 }}>
                <div style={{ position:'absolute', left:8, top:0, bottom:0, width:2, background:`${PURPLE}30`, borderRadius:2 }} />
                {PATHWAY_MILESTONES.sort((a,b)=>a.year-b.year).map((m, i) => (
                  <div key={i} style={{ display:'flex', gap:14, marginBottom:12, alignItems:'flex-start' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:PURPLE, flexShrink:0, marginTop:4, marginLeft:-4 }} />
                    <div>
                      <span style={{ fontSize:12, fontWeight:600, color:PURPLE, marginRight:8 }}>{m.year}</span>
                      <span style={{ fontSize:12, color:T.navy }}>{m.milestone}</span>
                      <span style={{ fontSize:10, color:T.textMut, marginLeft:8 }}>({m.dependency})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sector CapEx Tab */}
      {activeTab === 'Sector CapEx' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>Annual CapEx Requirement vs Current Deployment ($bn)</div>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:16 }}>Net Zero 2050 aligned investment requirement per sector</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SECTOR_CAPEX} margin={{ top:4, right:12, bottom:8, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize:11, fill:T.textMut }} />
                <YAxis tick={{ fontSize:10, fill:T.textMut }} tickFormatter={v => `$${v}bn`} />
                <Tooltip contentStyle={tip} formatter={(v, n) => [`$${v}bn`, n === 'required' ? 'Required' : n === 'current' ? 'Current' : 'Gap']} />
                <Bar dataKey="required" name="required" radius={[3,3,0,0]}>
                  {SECTOR_CAPEX.map((_, i) => <Cell key={i} fill={PURPLE} opacity={0.45} />)}
                </Bar>
                <Bar dataKey="current" name="current" radius={[3,3,0,0]}>
                  {SECTOR_CAPEX.map((_, i) => <Cell key={i} fill={PURPLE} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:14 }}>Sector-Level CapEx Gap Analysis</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  {['Sector','Required ($bn/yr)','Current ($bn/yr)','Gap ($bn/yr)','Gap %','Readiness Score'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textMut, fontWeight:600, fontSize:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTOR_CAPEX.map((s, i) => {
                  const gapPct = Math.round(s.gap / s.required * 100);
                  const rColor = s.readiness >= 60 ? T.green : s.readiness >= 40 ? T.amber : T.red;
                  return (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background: i%2===0 ? T.bg : T.surface }}>
                      <td style={{ padding:'9px 10px', fontWeight:600, color:T.navy }}>{s.sector}</td>
                      <td style={{ padding:'9px 10px', color:T.text }}>${s.required}bn</td>
                      <td style={{ padding:'9px 10px', color:T.text }}>${s.current}bn</td>
                      <td style={{ padding:'9px 10px', color:T.red, fontWeight:600 }}>${s.gap}bn</td>
                      <td style={{ padding:'9px 10px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:60, height:6, borderRadius:3, background:T.border, overflow:'hidden' }}>
                            <div style={{ width:`${gapPct}%`, height:'100%', background:T.red, borderRadius:3 }} />
                          </div>
                          <span style={{ color:T.red, fontWeight:600 }}>{gapPct}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'9px 10px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:60, height:6, borderRadius:3, background:T.border, overflow:'hidden' }}>
                            <div style={{ width:`${s.readiness}%`, height:'100%', background:rColor, borderRadius:3 }} />
                          </div>
                          <span style={{ color:rColor, fontWeight:600 }}>{s.readiness}/100</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stranded Asset Timeline Tab */}
      {activeTab === 'Stranded Asset Timeline' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', gap:14 }}>
            <StatCard label="NZ2050 Stranded by 2030" value="$1.2T" sub="Coal & gas power assets" color={T.red} />
            <StatCard label="Delayed Transition (2035)" value="$3.4T" sub="Lock-in of unabated assets" color={T.amber} />
            <StatCard label="Failed Transition (2050)" value="$2.2T" sub="Below orderly — late write-downs" color={T.textSec} />
            <StatCard label="Peak Stranding Year" value="2042–2048" sub="Under NZ2050 — accelerating" color={PURPLE} />
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>Cumulative Stranded Assets by Scenario ($T)</div>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:8 }}>Fossil fuel infrastructure stranded value (2025–2050)</div>
            <div style={{ display:'flex', gap:16, marginBottom:16 }}>
              {[['Net Zero 2050', PURPLE], ['2°C Gradual', T.amber], ['Failed Transition', T.red]].map(([label, color]) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:T.textSec }}>
                  <div style={{ width:20, height:3, borderRadius:2, background:color }} />
                  {label}
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={STRANDED_TIMELINE} margin={{ top:4, right:16, bottom:8, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textMut }} />
                <YAxis tick={{ fontSize:10, fill:T.textMut }} tickFormatter={v => `$${v}T`} />
                <Tooltip contentStyle={tip} formatter={(v, n) => [`$${v}T`, n === 'nz2050' ? 'Net Zero 2050' : n === 'gradual' ? '2°C Gradual' : 'Failed Transition']} />
                <Line type="monotone" dataKey="nz2050" stroke={PURPLE} strokeWidth={2.5} dot={{ r:4, fill:PURPLE }} />
                <Line type="monotone" dataKey="gradual" stroke={T.amber} strokeWidth={2.5} dot={{ r:4, fill:T.amber }} />
                <Line type="monotone" dataKey="failed" stroke={T.red} strokeWidth={2.5} dot={{ r:4, fill:T.red }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:14 }}>Asset Type Stranding Exposure (NZ2050 Scenario)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { type: 'Coal Power',      value: 2.8, color: T.red },
                { type: 'Gas Extraction',  value: 1.9, color: T.amber },
                { type: 'Oil Sands',       value: 1.4, color: T.amber },
                { type: 'LNG Terminals',   value: 0.9, color: T.textSec },
                { type: 'Petrochem',       value: 0.6, color: T.textSec },
                { type: 'Coal Mining',     value: 0.5, color: T.red },
              ]} margin={{ top:4, right:12, bottom:8, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize:10, fill:T.textMut }} />
                <YAxis tick={{ fontSize:10, fill:T.textMut }} tickFormatter={v => `$${v}T`} />
                <Tooltip contentStyle={tip} formatter={v => [`$${v}T`, 'Stranded Value']} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {[T.red, T.amber, T.amber, T.textSec, T.textSec, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Portfolio Impact Tab */}
      {activeTab === 'Portfolio Impact' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', gap:14 }}>
            <StatCard label="Renewables Upside (Orderly)" value="+38.4%" sub="Equity outperformance by 2050" color={T.green} />
            <StatCard label="Fossil Fuel Downside (Orderly)" value="-31.7%" sub="Equity revaluation risk" color={T.red} />
            <StatCard label="Disorderly Sovereign Bonds EM" value="-34.7%" sub="Climate-vulnerable EM debt" color={T.red} />
            <StatCard label="Green Bond Resilience" value="+12.6%" sub="Orderly transition performance" color={T.teal} />
          </div>

          {/* Horizontal Bar Chart */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>Asset Class Impact: Orderly vs Disorderly Transition (%)</div>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:16 }}>Projected value change by 2050 relative to baseline</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {PORTFOLIO_IMPACT.map((item, i) => {
                const maxAbs = 45;
                return (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:T.navy }}>{item.assetClass}</span>
                      <div style={{ display:'flex', gap:16 }}>
                        <span style={{ fontSize:11, color:item.orderly>=0?T.green:T.red, fontWeight:600 }}>Orderly: {pct(item.orderly)}</span>
                        <span style={{ fontSize:11, color:item.disorderly>=0?T.green:T.red, fontWeight:600 }}>Disorderly: {pct(item.disorderly)}</span>
                      </div>
                    </div>
                    <div style={{ position:'relative', height:10, background:T.border, borderRadius:5, overflow:'visible' }}>
                      <div style={{ position:'absolute', left:'50%', top:-2, width:2, height:14, background:T.textMut, borderRadius:1 }} />
                      {/* Orderly bar */}
                      <div style={{
                        position:'absolute',
                        height:10, borderRadius:5,
                        background: item.orderly>=0 ? T.green : T.red,
                        left: item.orderly>=0 ? '50%' : `calc(50% - ${Math.abs(item.orderly)/maxAbs*45}%)`,
                        width: `${Math.abs(item.orderly)/maxAbs*45}%`,
                        opacity: 0.8,
                      }} />
                    </div>
                    <div style={{ height:6 }} />
                    <div style={{ position:'relative', height:10, background:T.border, borderRadius:5, overflow:'visible' }}>
                      <div style={{ position:'absolute', left:'50%', top:-2, width:2, height:14, background:T.textMut, borderRadius:1 }} />
                      {/* Disorderly bar */}
                      <div style={{
                        position:'absolute',
                        height:10, borderRadius:5,
                        background: item.disorderly>=0 ? T.teal : T.amber,
                        left: item.disorderly>=0 ? '50%' : `calc(50% - ${Math.abs(item.disorderly)/maxAbs*45}%)`,
                        width: `${Math.abs(item.disorderly)/maxAbs*45}%`,
                        opacity: 0.75,
                      }} />
                    </div>
                    <div style={{ display:'flex', gap:16, marginTop:3 }}>
                      <span style={{ fontSize:9, color:T.textMut }}>Orderly (above)</span>
                      <span style={{ fontSize:9, color:T.textMut }}>Disorderly (below)</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:20, marginTop:20, padding:'12px 14px', background:T.bg, borderRadius:8 }}>
              {[['Orderly Positive', T.green], ['Orderly Negative', T.red], ['Disorderly Positive', T.teal], ['Disorderly Negative', T.amber]].map(([label, color]) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:T.textSec }}>
                  <div style={{ width:14, height:8, borderRadius:2, background:color, opacity:0.8 }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Impact Table */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:14 }}>Detailed Portfolio Impact Matrix</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  {['Asset Class','Orderly Transition','Disorderly Transition','Differential','Risk Rating'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textMut, fontWeight:600, fontSize:10, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_IMPACT.map((item, i) => {
                  const diff = (item.orderly - item.disorderly).toFixed(1);
                  const risk = Math.abs(item.disorderly) > 25 ? 'High' : Math.abs(item.disorderly) > 12 ? 'Medium' : 'Low';
                  const riskColor = risk === 'High' ? T.red : risk === 'Medium' ? T.amber : T.green;
                  return (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background: i%2===0 ? T.bg : T.surface }}>
                      <td style={{ padding:'9px 10px', fontWeight:600, color:T.navy }}>{item.assetClass}</td>
                      <td style={{ padding:'9px 10px', color:item.orderly>=0?T.green:T.red, fontWeight:600 }}>{pct(item.orderly)}</td>
                      <td style={{ padding:'9px 10px', color:item.disorderly>=0?T.teal:T.amber, fontWeight:600 }}>{pct(item.disorderly)}</td>
                      <td style={{ padding:'9px 10px', color:PURPLE, fontWeight:600 }}>{diff > 0 ? '+' : ''}{diff}pp</td>
                      <td style={{ padding:'9px 10px' }}><Badge text={risk} color={riskColor} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop:28, padding:'12px 16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:T.textMut }}>EP-AB5 — Transition Scenario Modeller | NGFS v4.0 Scenarios | IEA NZE 2050 Aligned | Updated Q1 2026</span>
        <div style={{ display:'flex', gap:8 }}>
          <Badge text="NGFS v4.0" color={T.teal} />
          <Badge text="IEA NZE" color={T.navy} />
          <Badge text="TCFD Aligned" color={PURPLE} />
        </div>
      </div>
    </div>
  );
}
