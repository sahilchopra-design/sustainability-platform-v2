import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Integrated Risk Dashboard','Physical-Transition Correlation','Compound Scenario Builder','Double-Hit Stress Test','Sector Interaction Matrix','Portfolio Risk Decomposition'];

const NGFS = ['Net Zero 2050','Below 2°C','Divergent Net Zero','Delayed Transition','Current Policies'];
const SSP = ['SSP1-2.6','SSP2-4.5','SSP3-7.0','SSP5-8.5'];

const SECTORS = [
  { name:'Oil & Gas', physScore:72, transScore:88, rho:0.65, cvarPhys:4.2, cvarTrans:8.1, weight:12 },
  { name:'Utilities', physScore:68, transScore:75, rho:0.58, cvarPhys:3.8, cvarTrans:6.2, weight:15 },
  { name:'Mining', physScore:65, transScore:70, rho:0.52, cvarPhys:3.5, cvarTrans:5.8, weight:8 },
  { name:'Agriculture', physScore:82, transScore:45, rho:0.38, cvarPhys:5.1, cvarTrans:2.9, weight:6 },
  { name:'Real Estate', physScore:78, transScore:55, rho:0.45, cvarPhys:4.8, cvarTrans:3.6, weight:18 },
  { name:'Transport', physScore:50, transScore:68, rho:0.48, cvarPhys:2.6, cvarTrans:5.5, weight:10 },
  { name:'Manufacturing', physScore:58, transScore:62, rho:0.42, cvarPhys:3.1, cvarTrans:4.8, weight:20 },
  { name:'Technology', physScore:30, transScore:25, rho:0.22, cvarPhys:1.2, cvarTrans:1.5, weight:11 },
];

const ALERTS = [
  { id:1, sector:'Oil & Gas', msg:'Integrated CVaR exceeds 15% threshold', sev:'CRITICAL', ts:'2 min ago' },
  { id:2, sector:'Utilities', msg:'Physical-transition correlation spike to 0.72', sev:'HIGH', ts:'18 min ago' },
  { id:3, sector:'Real Estate', msg:'Double-hit scenario loss >$2.1B', sev:'HIGH', ts:'45 min ago' },
  { id:4, sector:'Agriculture', msg:'Drought overlay increased physical CVaR by 1.8pp', sev:'MEDIUM', ts:'1 hr ago' },
  { id:5, sector:'Mining', msg:'Carbon price path shift — transition CVaR +0.9pp', sev:'MEDIUM', ts:'2 hr ago' },
];

const WATCHLIST = ['Oil & Gas','Utilities','Real Estate'];

const s = {
  page:{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24, color:T.navy },
  header:{ borderBottom:`2px solid ${T.gold}`, paddingBottom:16, marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center' },
  badge:{ background:T.navy, color:'#fff', padding:'4px 12px', borderRadius:4, fontFamily:T.mono, fontSize:13, marginRight:12 },
  title:{ fontSize:22, fontWeight:700, margin:0 },
  subtitle:{ fontSize:13, color:T.textSec, marginTop:2, fontFamily:T.mono },
  tabs:{ display:'flex', gap:4, marginBottom:24, flexWrap:'wrap' },
  tab:(a)=>({ padding:'8px 16px', borderRadius:6, border:`1px solid ${a?T.gold:T.border}`, background:a?T.navy:'#fff', color:a?'#fff':T.textSec, cursor:'pointer', fontSize:13, fontWeight:a?600:400, fontFamily:T.font }),
  card:{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:16 },
  cardTitle:{ fontSize:15, fontWeight:700, marginBottom:12, color:T.navy },
  grid2:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  grid3:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 },
  kpi:{ textAlign:'center', padding:16, background:T.bg, borderRadius:8, border:`1px solid ${T.border}` },
  kpiVal:{ fontSize:26, fontWeight:700, fontFamily:T.mono },
  kpiLbl:{ fontSize:11, color:T.textSec, marginTop:4, textTransform:'uppercase', letterSpacing:0.5 },
  ref:{ background:'#fef9ee', border:`1px solid ${T.gold}40`, borderRadius:8, padding:14, fontSize:12, color:T.textSec, marginTop:12, lineHeight:1.6 },
  slider:{ width:'100%', accentColor:T.gold },
  select:{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font },
  btn:(c=T.navy)=>({ padding:'7px 16px', borderRadius:6, border:'none', background:c, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }),
  sevBadge:(s)=>({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700, color:'#fff', background:s==='CRITICAL'?T.red:s==='HIGH'?T.orange:s==='MEDIUM'?T.amber:T.blue }),
  tbl:{ width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:{ textAlign:'left', padding:'8px 10px', borderBottom:`2px solid ${T.border}`, fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:0.4, color:T.textSec },
  td:{ padding:'8px 10px', borderBottom:`1px solid ${T.border}` },
};

export default function PhysicalTransitionNexusPage() {
  const [tab, setTab] = useState(0);
  const [ngfs, setNgfs] = useState(0);
  const [ssp, setSsp] = useState(1);
  const [aum, setAum] = useState(10);
  const [rhoAdj, setRhoAdj] = useState(1.0);
  const [watchlist, setWatchlist] = useState(new Set(WATCHLIST));

  const sectorData = useMemo(() => SECTORS.map(sec => {
    const rho = sec.rho * rhoAdj;
    const intCvar = sec.cvarTrans + sec.cvarPhys + rho * Math.sqrt(sec.cvarTrans * sec.cvarPhys);
    const lossM = intCvar / 100 * aum * 1000 * sec.weight / 100;
    return { ...sec, rho: +rho.toFixed(3), intCvar: +intCvar.toFixed(2), lossM: +lossM.toFixed(1) };
  }), [rhoAdj, aum]);

  const totalCvar = useMemo(() => {
    const w = sectorData.reduce((s, d) => s + d.weight * d.intCvar, 0) / 100;
    return +w.toFixed(2);
  }, [sectorData]);

  const toggleWatch = (n) => setWatchlist(p => { const s = new Set(p); s.has(n) ? s.delete(n) : s.add(n); return s; });

  const radarData = sectorData.map(d => ({ sector: d.name, physical: d.physScore, transition: d.transScore, integrated: Math.min(100, d.intCvar * 6) }));

  const corrTimeSeries = Array.from({ length: 24 }, (_, i) => ({
    month: `M${i + 1}`, oilGas: 0.55 + Math.sin(i / 4) * 0.12, utilities: 0.48 + Math.cos(i / 5) * 0.1,
    realEstate: 0.38 + Math.sin(i / 3) * 0.08, avg: 0.45 + Math.sin(i / 6) * 0.06,
  }));

  const stressScenarios = [
    { name:'Baseline', physLoss:0, transLoss:0, intLoss:0 },
    { name:'Moderate Physical', physLoss:2.1, transLoss:0.5, intLoss:3.2 },
    { name:'Severe Transition', physLoss:0.8, transLoss:4.5, intLoss:6.1 },
    { name:'Double Hit', physLoss:3.8, transLoss:5.2, intLoss:12.4 },
    { name:'Tail Risk', physLoss:6.5, transLoss:8.1, intLoss:21.3 },
  ];

  const decompData = sectorData.map(d => ({ name: d.name, physical: d.cvarPhys * d.weight / 100, transition: d.cvarTrans * d.weight / 100, interaction: (d.intCvar - d.cvarPhys - d.cvarTrans) * d.weight / 100 }));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={s.badge}>EP-CG1</span>
            <h1 style={s.title}>Physical-Transition Risk Nexus</h1>
          </div>
          <p style={s.subtitle}>Integrated CVaR interaction model | NGFS Phase 5 + IPCC AR6 calibration</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select style={s.select} value={ngfs} onChange={e => setNgfs(+e.target.value)}>
            {NGFS.map((n, i) => <option key={i} value={i}>{n}</option>)}
          </select>
          <select style={s.select} value={ssp} onChange={e => setSsp(+e.target.value)}>
            {SSP.map((n, i) => <option key={i} value={i}>{n}</option>)}
          </select>
          <button style={s.btn(T.gold)} onClick={() => alert('Report exported')}>Export Report</button>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map((t, i) => <div key={i} style={s.tab(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {tab === 0 && (<div>
        <div style={{ ...s.grid3, marginBottom:16 }}>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.red }}>{totalCvar}%</div><div style={s.kpiLbl}>Portfolio Integrated CVaR</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.navy }}>${aum}B</div><div style={s.kpiLbl}>Total AUM</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.amber }}>${(totalCvar / 100 * aum * 1000).toFixed(0)}M</div><div style={s.kpiLbl}>Estimated Portfolio Loss</div></div>
        </div>
        <div style={{ marginBottom:16, ...s.card }}>
          <div style={{ display:'flex', gap:24, alignItems:'center', marginBottom:8 }}>
            <label style={{ fontSize:13 }}>AUM ($B): <strong>{aum}</strong></label>
            <input type="range" min={1} max={50} value={aum} onChange={e => setAum(+e.target.value)} style={{ ...s.slider, width:200 }} />
            <label style={{ fontSize:13 }}>Correlation Adj: <strong>{rhoAdj.toFixed(2)}x</strong></label>
            <input type="range" min={0.5} max={2.0} step={0.05} value={rhoAdj} onChange={e => setRhoAdj(+e.target.value)} style={{ ...s.slider, width:200 }} />
          </div>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Integrated CVaR by Sector</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="cvarPhys" stackId="a" fill={T.blue} name="Physical CVaR %" />
                <Bar dataKey="cvarTrans" stackId="a" fill={T.orange} name="Transition CVaR %" />
                <Bar dataKey="intCvar" fill={T.red} name="Integrated CVaR %" />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Risk Radar — Physical vs Transition vs Integrated</div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="sector" tick={{ fontSize:10 }} />
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize:10 }} />
                <Radar name="Physical" dataKey="physical" stroke={T.blue} fill={T.blue} fillOpacity={0.15} />
                <Radar name="Transition" dataKey="transition" stroke={T.orange} fill={T.orange} fillOpacity={0.15} />
                <Radar name="Integrated" dataKey="integrated" stroke={T.red} fill={T.red} fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Risk Alert Feed</div>
          {ALERTS.map(a => (
            <div key={a.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
              <span style={s.sevBadge(a.sev)}>{a.sev}</span>
              <span style={{ fontWeight:600, minWidth:90 }}>{a.sector}</span>
              <span style={{ flex:1, fontSize:13 }}>{a.msg}</span>
              <span style={{ fontSize:11, color:T.textMut, fontFamily:T.mono }}>{a.ts}</span>
            </div>
          ))}
        </div>
        <div style={s.ref}>
          <strong>References:</strong> NGFS Phase 5 Scenario Parameters (2024); IPCC AR6 WGI Regional Climate Projections; ECB Climate Stress Test 2024 correlation assumptions; Battiston et al. (2017) compound climate-financial risk framework.
        </div>
      </div>)}

      {tab === 1 && (<div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Correlation Time Series (24 months)</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={corrTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize:11 }} />
                <YAxis domain={[0.2, 0.8]} tick={{ fontSize:11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="oilGas" stroke={T.red} name="Oil & Gas" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="utilities" stroke={T.orange} name="Utilities" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="realEstate" stroke={T.blue} name="Real Estate" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avg" stroke={T.navy} name="Portfolio Avg" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <ReferenceLine y={0.5} stroke={T.amber} strokeDasharray="3 3" label={{ value:'Threshold', fontSize:10 }} />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Physical vs Transition Score Scatter</div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="physScore" name="Physical Score" tick={{ fontSize:11 }} label={{ value:'Physical Risk Score', position:'bottom', fontSize:11 }} />
                <YAxis dataKey="transScore" name="Transition Score" tick={{ fontSize:11 }} label={{ value:'Transition Risk Score', angle:-90, position:'insideLeft', fontSize:11 }} />
                <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ payload }) => payload?.[0] ? (
                  <div style={{ background:'#fff', border:`1px solid ${T.border}`, padding:8, borderRadius:6, fontSize:12 }}>
                    <div style={{ fontWeight:700 }}>{payload[0].payload.name}</div>
                    <div>Physical: {payload[0].payload.physScore} | Transition: {payload[0].payload.transScore}</div>
                    <div>rho: {payload[0].payload.rho} | IntCVaR: {payload[0].payload.intCvar}%</div>
                  </div>
                ) : null} />
                <Scatter data={sectorData} fill={T.navy}>
                  {sectorData.map((d, i) => <Cell key={i} fill={d.intCvar > 12 ? T.red : d.intCvar > 8 ? T.orange : T.blue} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Sector Correlation Matrix</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Sector</th><th style={s.th}>rho_base</th><th style={s.th}>rho_adjusted</th><th style={s.th}>Direction</th><th style={s.th}>Confidence</th><th style={s.th}>Watchlist</th></tr></thead>
            <tbody>{sectorData.map((d, i) => (
              <tr key={i}><td style={s.td}>{d.name}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{(d.rho / rhoAdj).toFixed(3)}</td>
                <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700, color:d.rho > 0.5 ? T.red : T.navy }}>{d.rho}</td>
                <td style={s.td}>{d.rho > (d.rho / rhoAdj) ? '↑ Increasing' : d.rho < (d.rho / rhoAdj) ? '↓ Decreasing' : '→ Stable'}</td>
                <td style={s.td}>{d.rho > 0.5 ? 'High' : 'Medium'}</td>
                <td style={s.td}><button style={s.btn(watchlist.has(d.name) ? T.gold : T.textMut)} onClick={() => toggleWatch(d.name)}>{watchlist.has(d.name) ? '★ Watching' : '☆ Watch'}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.ref}><strong>Methodology:</strong> Dynamic correlation (rho) estimated via DCC-GARCH on physical hazard index vs carbon price returns. ECB CST 2024 base correlations adjusted for NGFS scenario: {NGFS[ngfs]} + {SSP[ssp]}.</div>
      </div>)}

      {tab === 2 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Scenario Combination: {NGFS[ngfs]} x {SSP[ssp]} ({(ngfs + 1) * (ssp + 1)}/20)</div>
          <p style={{ fontSize:13, color:T.textSec }}>20 scenario combinations (5 NGFS x 4 SSP) — select via header dropdowns.</p>
          <div style={{ ...s.grid3, marginTop:12 }}>
            {NGFS.map((n, ni) => (
              <div key={ni} style={{ ...s.kpi, border: ni === ngfs ? `2px solid ${T.gold}` : `1px solid ${T.border}`, cursor:'pointer' }} onClick={() => setNgfs(ni)}>
                <div style={{ fontSize:13, fontWeight:600 }}>{n}</div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>Carbon price 2050: ${[250, 180, 200, 120, 30][ni]}/tCO2</div>
              </div>
            ))}
          </div>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Scenario Impact Path (2025-2050)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={Array.from({ length: 6 }, (_, i) => ({ year: 2025 + i * 5, physical: 1.2 + i * (ssp + 1) * 0.4, transition: 0.8 + i * (4 - ngfs) * 0.6, integrated: 2.5 + i * ((ssp + 1) * 0.4 + (4 - ngfs) * 0.6) * 1.15 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} label={{ value:'CVaR %', angle:-90, position:'insideLeft', fontSize:11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="physical" stackId="1" fill={T.blue} stroke={T.blue} fillOpacity={0.3} name="Physical CVaR" />
                <Area type="monotone" dataKey="transition" stackId="1" fill={T.orange} stroke={T.orange} fillOpacity={0.3} name="Transition CVaR" />
                <Line type="monotone" dataKey="integrated" stroke={T.red} strokeWidth={2} name="Integrated CVaR" dot />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Key Formula</div>
            <div style={{ background:T.bg, padding:16, borderRadius:8, fontFamily:T.mono, fontSize:13, lineHeight:2 }}>
              IntegratedCVaR = CVaR_trans + CVaR_phys<br/>
              &nbsp;&nbsp;+ rho_dynamic x sqrt(CVaR_trans x CVaR_phys)<br/><br/>
              where rho_dynamic varies by sector and scenario<br/>
              Current rho adjustment: {rhoAdj.toFixed(2)}x
            </div>
          </div>
        </div>
        <div style={s.ref}><strong>References:</strong> NGFS Phase 5 carbon price paths; IPCC AR6 WGI Table SPM.1 SSP radiative forcing; Dietz et al. (2021) integrated physical-transition risk models.</div>
      </div>)}

      {tab === 3 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Double-Hit Stress Test Scenarios</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stressScenarios}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} label={{ value:'Loss %', angle:-90, position:'insideLeft', fontSize:11 }} />
              <Tooltip />
              <Bar dataKey="physLoss" fill={T.blue} name="Physical Loss %" />
              <Bar dataKey="transLoss" fill={T.orange} name="Transition Loss %" />
              <Bar dataKey="intLoss" fill={T.red} name="Integrated Loss %" />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Loss Amplification from Interaction</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stressScenarios.filter(d => d.name !== 'Baseline')}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="intLoss" fill={T.red} name="Integrated" />
                <Bar dataKey={(d) => d.physLoss + d.transLoss} fill={T.textMut} name="Sum of Parts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Amplification Factors</div>
            <table style={s.tbl}>
              <thead><tr><th style={s.th}>Scenario</th><th style={s.th}>Sum Parts</th><th style={s.th}>Integrated</th><th style={s.th}>Amplification</th></tr></thead>
              <tbody>{stressScenarios.filter(d => d.name !== 'Baseline').map((d, i) => {
                const sum = d.physLoss + d.transLoss;
                const amp = sum > 0 ? (d.intLoss / sum).toFixed(2) : '-';
                return (<tr key={i}><td style={s.td}>{d.name}</td><td style={{ ...s.td, fontFamily:T.mono }}>{sum.toFixed(1)}%</td><td style={{ ...s.td, fontFamily:T.mono, color:T.red }}>{d.intLoss}%</td><td style={{ ...s.td, fontFamily:T.mono, fontWeight:700 }}>{amp}x</td></tr>);
              })}</tbody>
            </table>
          </div>
        </div>
        <div style={s.ref}><strong>References:</strong> ECB 2024 Climate Stress Test double-hit scenario methodology; ESRB (2022) compound climate-financial shock analysis; Bank of England 2021 CBES interaction assumptions.</div>
      </div>)}

      {tab === 4 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Sector Interaction Coefficient Matrix</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Sector</th><th style={s.th}>Phys Score</th><th style={s.th}>Trans Score</th><th style={s.th}>rho</th><th style={s.th}>IntCVaR</th><th style={s.th}>Weight %</th><th style={s.th}>Loss ($M)</th><th style={s.th}>Watchlist</th></tr></thead>
            <tbody>{sectorData.sort((a, b) => b.intCvar - a.intCvar).map((d, i) => (
              <tr key={i} style={{ background: d.intCvar > 12 ? '#fef2f2' : 'transparent' }}>
                <td style={{ ...s.td, fontWeight:600 }}>{d.name}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{d.physScore}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{d.transScore}</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: d.rho > 0.5 ? T.red : T.navy }}>{d.rho}</td>
                <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700, color: d.intCvar > 12 ? T.red : T.navy }}>{d.intCvar}%</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{d.weight}%</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>${d.lossM}M</td>
                <td style={s.td}><button style={s.btn(watchlist.has(d.name) ? T.gold : T.textMut)} onClick={() => toggleWatch(d.name)}>{watchlist.has(d.name) ? '★' : '☆'}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Interaction Coefficient Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorData.sort((a, b) => b.rho - a.rho)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:10 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="rho" name="rho (adjusted)">
                  {sectorData.map((d, i) => <Cell key={i} fill={d.rho > 0.5 ? T.red : d.rho > 0.35 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Sector Risk Profile Radar</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="sector" tick={{ fontSize:9 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize:9 }} />
                <Radar name="Integrated Risk" dataKey="integrated" stroke={T.red} fill={T.red} fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab === 5 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Portfolio Risk Decomposition — Physical / Transition / Interaction</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={decompData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:11 }} label={{ value:'Contribution to Portfolio CVaR %', angle:-90, position:'insideLeft', fontSize:10 }} />
              <Tooltip />
              <Bar dataKey="physical" stackId="a" fill={T.blue} name="Physical" />
              <Bar dataKey="transition" stackId="a" fill={T.orange} name="Transition" />
              <Bar dataKey="interaction" stackId="a" fill={T.red} name="Interaction" />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.grid3}>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.blue }}>{decompData.reduce((s, d) => s + d.physical, 0).toFixed(2)}%</div><div style={s.kpiLbl}>Physical Component</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.orange }}>{decompData.reduce((s, d) => s + d.transition, 0).toFixed(2)}%</div><div style={s.kpiLbl}>Transition Component</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.red }}>{decompData.reduce((s, d) => s + d.interaction, 0).toFixed(2)}%</div><div style={s.kpiLbl}>Interaction Component</div></div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Decomposition Detail</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Sector</th><th style={s.th}>Physical</th><th style={s.th}>Transition</th><th style={s.th}>Interaction</th><th style={s.th}>Total</th><th style={s.th}>% of Portfolio CVaR</th></tr></thead>
            <tbody>{decompData.map((d, i) => {
              const tot = d.physical + d.transition + d.interaction;
              return (<tr key={i}><td style={s.td}>{d.name}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{d.physical.toFixed(3)}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{d.transition.toFixed(3)}</td>
                <td style={{ ...s.td, fontFamily:T.mono, color:T.red }}>{d.interaction.toFixed(3)}</td>
                <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700 }}>{tot.toFixed(3)}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{totalCvar > 0 ? (tot / totalCvar * 100).toFixed(1) : 0}%</td>
              </tr>);
            })}</tbody>
          </table>
        </div>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <button style={s.btn(T.navy)} onClick={() => alert('Decomposition report exported')}>Export Decomposition</button>
          <button style={s.btn(T.gold)} onClick={() => alert('Shared with team')}>Share Analysis</button>
        </div>
        <div style={s.ref}><strong>Methodology:</strong> Euler decomposition of portfolio integrated CVaR into physical, transition, and interaction components. Based on McNeil, Frey & Embrechts (2015) quantitative risk management framework extended for climate factors.</div>
      </div>)}
    </div>
  );
}
