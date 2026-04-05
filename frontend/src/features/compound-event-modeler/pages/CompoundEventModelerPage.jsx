import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Compound Event Catalogue','Joint Probability Matrix','Concurrent Hazard Scenarios','Cascade Timeline','Loss Amplification','Historical Compound Events'];

const COMPOUND_PAIRS = [
  { id:1, eventA:'Drought', eventB:'Wildfire', pA:0.12, pB:0.08, pAB:0.042, pIndep:0.0096, depRatio:4.38, ampFactor:2.2, region:'Western US/Med', lossIndiv:8.5, lossCompound:18.7 },
  { id:2, eventA:'Heatwave', eventB:'Drought', pA:0.18, pB:0.12, pAB:0.068, pIndep:0.0216, depRatio:3.15, ampFactor:1.8, region:'Southern Europe', lossIndiv:6.2, lossCompound:11.2 },
  { id:3, eventA:'Flood', eventB:'Landslide', pA:0.15, pB:0.05, pAB:0.028, pIndep:0.0075, depRatio:3.73, ampFactor:2.5, region:'SE Asia/C America', lossIndiv:12.0, lossCompound:30.0 },
  { id:4, eventA:'Cyclone', eventB:'Storm Surge', pA:0.10, pB:0.06, pAB:0.052, pIndep:0.006, depRatio:8.67, ampFactor:2.8, region:'Caribbean/Gulf', lossIndiv:22.0, lossCompound:61.6 },
  { id:5, eventA:'Sea Level Rise', eventB:'Coastal Flood', pA:0.25, pB:0.14, pAB:0.098, pIndep:0.035, depRatio:2.80, ampFactor:1.9, region:'Pacific Islands/NL', lossIndiv:9.0, lossCompound:17.1 },
  { id:6, eventA:'Drought', eventB:'Energy Crisis', pA:0.12, pB:0.08, pAB:0.035, pIndep:0.0096, depRatio:3.65, ampFactor:2.1, region:'Europe/S America', lossIndiv:15.0, lossCompound:31.5 },
  { id:7, eventA:'Wildfire', eventB:'Air Quality+Health', pA:0.08, pB:0.10, pAB:0.058, pIndep:0.008, depRatio:7.25, ampFactor:1.6, region:'California/Australia', lossIndiv:5.5, lossCompound:8.8 },
  { id:8, eventA:'Flood', eventB:'Contamination', pA:0.15, pB:0.04, pAB:0.022, pIndep:0.006, depRatio:3.67, ampFactor:2.3, region:'Industrial zones', lossIndiv:7.0, lossCompound:16.1 },
  { id:9, eventA:'Winter Storm', eventB:'Grid Failure', pA:0.10, pB:0.05, pAB:0.032, pIndep:0.005, depRatio:6.40, ampFactor:3.0, region:'Texas/N Europe', lossIndiv:11.0, lossCompound:33.0 },
  { id:10, eventA:'Heat', eventB:'Water Scarcity', pA:0.20, pB:0.15, pAB:0.088, pIndep:0.030, depRatio:2.93, ampFactor:1.7, region:'Middle East/S Asia', lossIndiv:8.0, lossCompound:13.6 },
];

const HISTORICAL_COMPOUND = [
  { year:2023, event:'Drought + Wildfire', region:'Hawaii (Maui)', lossB:5.6, ampFact:2.8, detail:'Drought desiccated vegetation; high winds drove rapid fire spread' },
  { year:2022, event:'Drought + Energy Crisis', region:'Europe', lossB:20.0, ampFact:2.2, detail:'Rhine low water halted coal barges; nuclear cooling water insufficient' },
  { year:2022, event:'Flood + Landslide', region:'Pakistan', lossB:30.0, ampFact:2.5, detail:'Monsoon floods triggered >500 landslides; 1/3 of country submerged' },
  { year:2021, event:'Winter Storm + Grid Failure', region:'Texas, US', lossB:23.0, ampFact:3.2, detail:'Uri storm collapsed ERCOT grid; cascading water, heat, food failures' },
  { year:2021, event:'Flood + Contamination', region:'Germany/Belgium', lossB:43.0, ampFact:2.1, detail:'Ahr Valley floods released industrial chemicals; drinking water compromised' },
  { year:2021, event:'Heatwave + Drought', region:'Pacific NW (BC)', lossB:8.9, ampFact:1.9, detail:'Heat dome; 600+ deaths; followed by atmospheric river flooding' },
  { year:2020, event:'Drought + Wildfire', region:'Australia', lossB:10.0, ampFact:2.4, detail:'Black Summer; 3 years drought preceded worst fire season' },
  { year:2020, event:'Cyclone + Storm Surge', region:'Sundarbans', lossB:13.0, ampFact:2.6, detail:'Cyclone Amphan; 5m surge into low-lying delta' },
];

const s = {
  page:{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24, color:T.navy },
  header:{ borderBottom:`2px solid ${T.gold}`, paddingBottom:16, marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center' },
  badge:{ background:T.navy, color:'#fff', padding:'4px 12px', borderRadius:4, fontFamily:T.mono, fontSize:13, marginRight:12 },
  title:{ fontSize:22, fontWeight:700, margin:0 },
  subtitle:{ fontSize:13, color:T.textSec, marginTop:2, fontFamily:T.mono },
  tabs:{ display:'flex', gap:4, marginBottom:24, flexWrap:'wrap' },
  tab:(a)=>({ padding:'8px 16px', borderRadius:6, border:`1px solid ${a?T.gold:T.border}`, background:a?T.navy:'#fff', color:a?'#fff':T.textSec, cursor:'pointer', fontSize:13, fontWeight:a?600:400 }),
  card:{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:16 },
  cardTitle:{ fontSize:15, fontWeight:700, marginBottom:12, color:T.navy },
  grid2:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  grid3:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 },
  kpi:{ textAlign:'center', padding:16, background:T.bg, borderRadius:8, border:`1px solid ${T.border}` },
  kpiVal:{ fontSize:26, fontWeight:700, fontFamily:T.mono },
  kpiLbl:{ fontSize:11, color:T.textSec, marginTop:4, textTransform:'uppercase', letterSpacing:0.5 },
  ref:{ background:'#fef9ee', border:`1px solid ${T.gold}40`, borderRadius:8, padding:14, fontSize:12, color:T.textSec, marginTop:12, lineHeight:1.6 },
  btn:(c=T.navy)=>({ padding:'7px 16px', borderRadius:6, border:'none', background:c, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }),
  tbl:{ width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:{ textAlign:'left', padding:'6px 8px', borderBottom:`2px solid ${T.border}`, fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:0.4, color:T.textSec },
  td:{ padding:'6px 8px', borderBottom:`1px solid ${T.border}` },
};

export default function CompoundEventModelerPage() {
  const [tab, setTab] = useState(0);
  const [selectedPair, setSelectedPair] = useState(0);
  const [customAmpA, setCustomAmpA] = useState(1.0);
  const [customAmpB, setCustomAmpB] = useState(1.0);

  const pair = COMPOUND_PAIRS[selectedPair];

  const ampData = COMPOUND_PAIRS.map(p => ({
    name: `${p.eventA.slice(0, 6)}+${p.eventB.slice(0, 6)}`,
    individual: p.lossIndiv,
    compound: p.lossCompound,
    amplification: p.ampFactor,
  }));

  const cascadeTimeline = [
    { day:0, event:`${pair.eventA} onset`, severity:40, cumLoss:0 },
    { day:3, event:`${pair.eventA} intensifies`, severity:65, cumLoss: pair.lossIndiv * 0.2 },
    { day:7, event:`${pair.eventB} triggered`, severity:75, cumLoss: pair.lossIndiv * 0.4 },
    { day:12, event:'Compound interaction peak', severity:95, cumLoss: pair.lossCompound * 0.6 },
    { day:18, event:'Cascading secondary impacts', severity:85, cumLoss: pair.lossCompound * 0.85 },
    { day:25, event:'Peak loss realization', severity:70, cumLoss: pair.lossCompound },
    { day:40, event:'Recovery phase begins', severity:45, cumLoss: pair.lossCompound * 0.95 },
    { day:60, event:'Stabilization', severity:25, cumLoss: pair.lossCompound * 0.9 },
  ];

  const jointProbData = COMPOUND_PAIRS.map(p => ({
    name: `${p.eventA.slice(0, 5)}+${p.eventB.slice(0, 5)}`,
    joint: p.pAB,
    independent: p.pIndep,
    depRatio: p.depRatio,
  }));

  const scenarioData = [
    { scenario:'Baseline (independent)', loss:pair.lossIndiv, prob: pair.pIndep * 100 },
    { scenario:'Low compound (1.5x)', loss: pair.lossIndiv * 1.5 * customAmpA, prob: pair.pAB * 0.6 * 100 },
    { scenario:'Central compound', loss: pair.lossCompound * customAmpA, prob: pair.pAB * 100 },
    { scenario:'High compound (1.3x)', loss: pair.lossCompound * 1.3 * customAmpB, prob: pair.pAB * 0.4 * 100 },
    { scenario:'Extreme compound (2x)', loss: pair.lossCompound * 2 * customAmpB, prob: pair.pAB * 0.15 * 100 },
  ];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={s.badge}>EP-CG5</span>
            <h1 style={s.title}>Compound Climate Event Modeler</h1>
          </div>
          <p style={s.subtitle}>10 compound pairs | Copula-based joint probability | Loss amplification engine</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font }} value={selectedPair} onChange={e => setSelectedPair(+e.target.value)}>
            {COMPOUND_PAIRS.map((p, i) => <option key={i} value={i}>{p.eventA} + {p.eventB}</option>)}
          </select>
          <button style={s.btn(T.gold)} onClick={() => alert('Compound risk report exported')}>Export Report</button>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map((t, i) => <div key={i} style={s.tab(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {tab === 0 && (<div>
        <div style={{ ...s.grid3, marginBottom:16 }}>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.red }}>10</div><div style={s.kpiLbl}>Compound Pairs</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.amber }}>2.3x</div><div style={s.kpiLbl}>Avg Amplification Factor</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.navy }}>4.4x</div><div style={s.kpiLbl}>Avg Dependence Ratio</div></div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Compound Event Catalogue</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Event A</th><th style={s.th}>Event B</th><th style={s.th}>P(A)</th><th style={s.th}>P(B)</th><th style={s.th}>P(A and B)</th><th style={s.th}>P(indep)</th><th style={s.th}>Dep Ratio</th><th style={s.th}>Amp Factor</th><th style={s.th}>Region</th></tr></thead>
            <tbody>{COMPOUND_PAIRS.map((p, i) => (
              <tr key={i} style={{ background: selectedPair === i ? '#f0f4ff' : 'transparent', cursor:'pointer' }} onClick={() => setSelectedPair(i)}>
                <td style={{ ...s.td, fontWeight:600 }}>{p.eventA}</td>
                <td style={{ ...s.td, fontWeight:600 }}>{p.eventB}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{(p.pA * 100).toFixed(0)}%</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{(p.pB * 100).toFixed(0)}%</td>
                <td style={{ ...s.td, fontFamily:T.mono, color:T.red }}>{(p.pAB * 100).toFixed(1)}%</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{(p.pIndep * 100).toFixed(2)}%</td>
                <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700, color: p.depRatio > 5 ? T.red : T.navy }}>{p.depRatio.toFixed(1)}x</td>
                <td style={{ ...s.td, fontFamily:T.mono, color:T.orange }}>{p.ampFactor}x</td>
                <td style={{ ...s.td, fontSize:11 }}>{p.region}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Dependence Ratio Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={COMPOUND_PAIRS.sort((a, b) => b.depRatio - a.depRatio).map(p => ({ name:`${p.eventA.slice(0,5)}+${p.eventB.slice(0,5)}`, ratio: p.depRatio }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:9 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <ReferenceLine y={1} stroke={T.amber} strokeDasharray="3 3" label={{ value:'Independent', fontSize:10 }} />
              <Bar dataKey="ratio" name="Dependence Ratio (P(AB)/P(A)P(B))">
                {COMPOUND_PAIRS.map((p, i) => <Cell key={i} fill={p.depRatio > 5 ? T.red : p.depRatio > 3 ? T.orange : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.ref}><strong>References:</strong> IPCC AR6 WGI Chapter 11 (Weather and Climate Extreme Events); Zscheischler et al. (2018) Future climate risk from compound events; Leonard et al. (2014) compound event framework.</div>
      </div>)}

      {tab === 1 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Joint vs Independent Probability Comparison</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={jointProbData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:9 }} />
              <YAxis tick={{ fontSize:11 }} tickFormatter={v => `${(v*100).toFixed(1)}%`} />
              <Tooltip formatter={v => `${(v * 100).toFixed(2)}%`} />
              <Bar dataKey="joint" fill={T.red} name="Joint P(A∩B)" />
              <Bar dataKey="independent" fill={T.blue} name="Independent P(A)×P(B)" />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Selected: {pair.eventA} + {pair.eventB}</div>
            <div style={{ background:T.bg, padding:16, borderRadius:8, fontFamily:T.mono, fontSize:12, lineHeight:2 }}>
              P({pair.eventA}) = {(pair.pA * 100).toFixed(0)}%<br/>
              P({pair.eventB}) = {(pair.pB * 100).toFixed(0)}%<br/>
              P(A and B) observed = {(pair.pAB * 100).toFixed(1)}%<br/>
              P(A) x P(B) independent = {(pair.pIndep * 100).toFixed(2)}%<br/>
              <strong>Dependence ratio = {pair.depRatio.toFixed(2)}x</strong><br/><br/>
              Copula: Clayton (lower tail dependence)<br/>
              theta = {(pair.depRatio * 0.8).toFixed(2)}
            </div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Dependence vs Amplification</div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="depRatio" name="Dependence Ratio" tick={{ fontSize:11 }} label={{ value:'Dependence Ratio', position:'bottom', fontSize:10 }} />
                <YAxis dataKey="ampFactor" name="Amplification" tick={{ fontSize:11 }} label={{ value:'Loss Amplification', angle:-90, position:'insideLeft', fontSize:10 }} />
                <Tooltip content={({ payload }) => payload?.[0] ? (
                  <div style={{ background:'#fff', border:`1px solid ${T.border}`, padding:8, borderRadius:6, fontSize:11 }}>
                    <div style={{ fontWeight:700 }}>{payload[0].payload.eventA} + {payload[0].payload.eventB}</div>
                    <div>Dep: {payload[0].payload.depRatio}x | Amp: {payload[0].payload.ampFactor}x</div>
                  </div>
                ) : null} />
                <Scatter data={COMPOUND_PAIRS} fill={T.navy}>
                  {COMPOUND_PAIRS.map((p, i) => <Cell key={i} fill={p.ampFactor > 2.5 ? T.red : T.blue} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab === 2 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Concurrent Hazard Scenarios: {pair.eventA} + {pair.eventB}</div>
          <div style={{ display:'flex', gap:16, marginBottom:12, alignItems:'center' }}>
            <label style={{ fontSize:12 }}>Scenario A multiplier: {customAmpA.toFixed(1)}x</label>
            <input type="range" min={0.5} max={2.0} step={0.1} value={customAmpA} onChange={e => setCustomAmpA(+e.target.value)} style={{ width:150, accentColor:T.gold }} />
            <label style={{ fontSize:12 }}>Scenario B multiplier: {customAmpB.toFixed(1)}x</label>
            <input type="range" min={0.5} max={2.0} step={0.1} value={customAmpB} onChange={e => setCustomAmpB(+e.target.value)} style={{ width:150, accentColor:T.gold }} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="scenario" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:11 }} label={{ value:'Loss ($B)', angle:-90, position:'insideLeft', fontSize:10 }} />
              <Tooltip />
              <Bar dataKey="loss" name="Loss ($B)">
                {scenarioData.map((_, i) => <Cell key={i} fill={[T.blue, T.amber, T.orange, T.red, T.purple][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Loss vs Probability</div>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="prob" name="Probability %" tick={{ fontSize:11 }} />
                <YAxis dataKey="loss" name="Loss ($B)" tick={{ fontSize:11 }} />
                <Tooltip />
                <Scatter data={scenarioData} fill={T.navy}>
                  {scenarioData.map((_, i) => <Cell key={i} fill={[T.blue, T.amber, T.orange, T.red, T.purple][i]} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Scenario Comparison Table</div>
            <table style={s.tbl}>
              <thead><tr><th style={s.th}>Scenario</th><th style={s.th}>Loss ($B)</th><th style={s.th}>Probability</th></tr></thead>
              <tbody>{scenarioData.map((d, i) => (
                <tr key={i}><td style={s.td}>{d.scenario}</td>
                  <td style={{ ...s.td, fontFamily:T.mono, color: d.loss > pair.lossCompound ? T.red : T.navy }}>${d.loss.toFixed(1)}B</td>
                  <td style={{ ...s.td, fontFamily:T.mono }}>{d.prob.toFixed(2)}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>)}

      {tab === 3 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Cascade Timeline: {pair.eventA} + {pair.eventB}</div>
          {cascadeTimeline.map((ct, i) => (
            <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
              <span style={{ fontFamily:T.mono, fontSize:12, minWidth:50, color:T.textMut }}>Day {ct.day}</span>
              <div style={{ width:12, height:12, borderRadius:'50%', background: ct.severity > 80 ? T.red : ct.severity > 60 ? T.orange : ct.severity > 40 ? T.amber : T.green }} />
              <span style={{ flex:1, fontSize:13, fontWeight: ct.severity > 80 ? 700 : 400 }}>{ct.event}</span>
              <span style={{ fontFamily:T.mono, fontSize:12, color:T.red }}>${ct.cumLoss.toFixed(1)}B</span>
            </div>
          ))}
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Severity Over Time</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={cascadeTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="day" tick={{ fontSize:11 }} label={{ value:'Day', position:'bottom', fontSize:10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize:11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="severity" fill={T.red} stroke={T.red} fillOpacity={0.2} name="Severity Index" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Cumulative Loss Trajectory</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={cascadeTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="day" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} label={{ value:'Loss ($B)', angle:-90, position:'insideLeft', fontSize:10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="cumLoss" stroke={T.navy} strokeWidth={2} name="Cumulative Loss ($B)" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab === 4 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Loss Amplification: Compound vs Sum of Individual Losses</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ampData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:9 }} />
              <YAxis tick={{ fontSize:11 }} label={{ value:'Loss ($B)', angle:-90, position:'insideLeft', fontSize:10 }} />
              <Tooltip />
              <Bar dataKey="individual" fill={T.blue} name="Sum of Individual Losses ($B)" />
              <Bar dataKey="compound" fill={T.red} name="Compound Loss ($B)" />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Amplification Factors</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={COMPOUND_PAIRS.sort((a, b) => b.ampFactor - a.ampFactor).map(p => ({ name:`${p.eventA.slice(0,5)}+${p.eventB.slice(0,5)}`, amp: p.ampFactor }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9 }} />
                <YAxis domain={[1, 3.5]} tick={{ fontSize:11 }} />
                <Tooltip />
                <ReferenceLine y={1} stroke={T.green} strokeDasharray="3 3" label={{ value:'No amplification', fontSize:10 }} />
                <Bar dataKey="amp" name="Amplification Factor">
                  {COMPOUND_PAIRS.map((p, i) => <Cell key={i} fill={p.ampFactor > 2.5 ? T.red : p.ampFactor > 2 ? T.orange : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Key Insight</div>
            <div style={{ background:T.bg, padding:16, borderRadius:8, fontFamily:T.mono, fontSize:12, lineHeight:2 }}>
              Compound_Loss = Amp_Factor x Sum(Individual_Losses)<br/><br/>
              Typical range: 1.5x - 3.0x<br/>
              Highest: Winter Storm + Grid Failure (3.0x)<br/>
              Lowest: Wildfire + Air Quality (1.6x)<br/><br/>
              Non-linearity from:<br/>
              - Infrastructure cascading failures<br/>
              - Response capacity exhaustion<br/>
              - Insurance deductible stacking<br/>
              - Supply chain multi-point disruption
            </div>
          </div>
        </div>
        <div style={s.ref}><strong>References:</strong> Zscheischler et al. (2020) Typology of compound weather/climate events; AghaKouchak et al. (2020) compound hazard interactions; Raymond et al. (2020) understanding/managing connected extreme events.</div>
      </div>)}

      {tab === 5 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Historical Compound Events (2020-2023)</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Year</th><th style={s.th}>Compound Event</th><th style={s.th}>Region</th><th style={s.th}>Loss ($B)</th><th style={s.th}>Amp Factor</th><th style={s.th}>Details</th></tr></thead>
            <tbody>{HISTORICAL_COMPOUND.map((h, i) => (
              <tr key={i}><td style={{ ...s.td, fontFamily:T.mono }}>{h.year}</td>
                <td style={{ ...s.td, fontWeight:600 }}>{h.event}</td>
                <td style={s.td}>{h.region}</td>
                <td style={{ ...s.td, fontFamily:T.mono, color:T.red }}>${h.lossB}B</td>
                <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700 }}>{h.ampFact}x</td>
                <td style={{ ...s.td, fontSize:11, color:T.textSec }}>{h.detail}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Historical Loss by Compound Type</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={HISTORICAL_COMPOUND} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:11 }} />
                <YAxis dataKey="event" type="category" width={140} tick={{ fontSize:10 }} />
                <Tooltip />
                <Bar dataKey="lossB" name="Loss ($B)" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Amplification Factors — Historical</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={HISTORICAL_COMPOUND.sort((a, b) => b.ampFact - a.ampFact)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="event" tick={{ fontSize:9 }} />
                <YAxis domain={[1, 3.5]} tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="ampFact" name="Amplification Factor">
                  {HISTORICAL_COMPOUND.map((h, i) => <Cell key={i} fill={h.ampFact > 2.5 ? T.red : h.ampFact > 2 ? T.orange : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={s.btn(T.navy)} onClick={() => alert('Custom compound scenario builder opened')}>Custom Compound Builder</button>
          <button style={s.btn(T.gold)} onClick={() => alert('Compound risk report exported')}>Export Compound Report</button>
        </div>
        <div style={s.ref}><strong>References:</strong> IPCC AR6 WGI Chapter 11.8; EM-DAT compound event records; Munich Re NatCatSERVICE compound loss analysis; Swiss Re sigma multi-peril studies.</div>
      </div>)}
    </div>
  );
}
