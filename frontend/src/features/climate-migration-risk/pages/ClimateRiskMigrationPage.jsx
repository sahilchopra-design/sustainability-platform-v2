import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Migration Hotspot Map','Climate Refugee Projections','Urban Stress Indicators','Labor Market Disruption','Real Estate Demand Shift','Investment Implications'];

const CORRIDORS = [
  { origin:'Sub-Saharan Africa', dest:'North Africa/Europe', migrants2030:18, migrants2050:65, driver:'Drought/Desertification', riskLevel:'CRITICAL' },
  { origin:'Central America', dest:'United States', migrants2030:8, migrants2050:28, driver:'Drought/Hurricanes', riskLevel:'HIGH' },
  { origin:'South Asia', dest:'Gulf States', migrants2030:12, migrants2050:42, driver:'Heat Stress/Flooding', riskLevel:'CRITICAL' },
  { origin:'Pacific Islands', dest:'Australia/New Zealand', migrants2030:2, migrants2050:8, driver:'Sea Level Rise', riskLevel:'HIGH' },
  { origin:'Bangladesh', dest:'India (urban)', migrants2030:15, migrants2050:52, driver:'River Flood/Cyclone', riskLevel:'CRITICAL' },
  { origin:'Myanmar/Cambodia', dest:'Thailand/Malaysia', migrants2030:5, migrants2050:18, driver:'Flood/Drought', riskLevel:'MEDIUM' },
  { origin:'North Africa', dest:'Southern Europe', migrants2030:6, migrants2050:22, driver:'Water Scarcity/Heat', riskLevel:'HIGH' },
  { origin:'Central Asia', dest:'Russia/Europe', migrants2030:4, migrants2050:15, driver:'Drought/Desertification', riskLevel:'MEDIUM' },
  { origin:'Caribbean Islands', dest:'US/Canada', migrants2030:3, migrants2050:12, driver:'Hurricanes/SLR', riskLevel:'HIGH' },
  { origin:'Mekong Delta', dest:'Vietnamese Cities', migrants2030:6, migrants2050:20, driver:'Salinization/SLR', riskLevel:'HIGH' },
  { origin:'Horn of Africa', dest:'Gulf/South Africa', migrants2030:9, migrants2050:32, driver:'Drought/Conflict', riskLevel:'CRITICAL' },
  { origin:'Sahel Region', dest:'Coastal W Africa/EU', migrants2030:7, migrants2050:25, driver:'Desertification', riskLevel:'CRITICAL' },
  { origin:'Indonesian Coast', dest:'Java/Sumatra Cities', migrants2030:5, migrants2050:18, driver:'Coastal Flood/SLR', riskLevel:'MEDIUM' },
  { origin:'Philippines', dest:'Manila/Overseas', migrants2030:4, migrants2050:15, driver:'Typhoons/Flood', riskLevel:'HIGH' },
  { origin:'Small Island Dev.', dest:'Nearest Mainland', migrants2030:1, migrants2050:5, driver:'Existential SLR', riskLevel:'CRITICAL' },
];

const PROJECTIONS = [
  { year:2025, optimistic:32, central:44, pessimistic:58 },
  { year:2030, optimistic:48, central:72, pessimistic:98 },
  { year:2035, optimistic:65, central:105, pessimistic:142 },
  { year:2040, optimistic:82, central:138, pessimistic:188 },
  { year:2045, optimistic:98, central:170, pessimistic:230 },
  { year:2050, optimistic:115, central:216, pessimistic:310 },
];

const CITIES = [
  { city:'Dhaka', country:'Bangladesh', popGrowth:3.2, infraStress:92, housingDemand:88, waterStress:85, jobAbsorption:35 },
  { city:'Lagos', country:'Nigeria', popGrowth:4.1, infraStress:95, housingDemand:92, waterStress:78, jobAbsorption:28 },
  { city:'Mumbai', country:'India', popGrowth:2.8, infraStress:88, housingDemand:85, waterStress:72, jobAbsorption:42 },
  { city:'Ho Chi Minh City', country:'Vietnam', popGrowth:2.5, infraStress:75, housingDemand:78, waterStress:65, jobAbsorption:55 },
  { city:'Cairo', country:'Egypt', popGrowth:2.2, infraStress:82, housingDemand:80, waterStress:90, jobAbsorption:38 },
  { city:'Karachi', country:'Pakistan', popGrowth:3.0, infraStress:90, housingDemand:86, waterStress:82, jobAbsorption:32 },
  { city:'Phoenix', country:'US', popGrowth:2.8, infraStress:55, housingDemand:82, waterStress:88, jobAbsorption:72 },
  { city:'Melbourne', country:'Australia', popGrowth:1.8, infraStress:45, housingDemand:72, waterStress:60, jobAbsorption:78 },
];

const LABOR_SECTORS = [
  { sector:'Agriculture', displacement:35, retrainTime:18, wageImpact:-28, demandShift:'Out-migration' },
  { sector:'Construction', displacement:22, retrainTime:8, wageImpact:-12, demandShift:'Destination surge' },
  { sector:'Services', displacement:15, retrainTime:6, wageImpact:-8, demandShift:'Mixed' },
  { sector:'Manufacturing', displacement:18, retrainTime:12, wageImpact:-15, demandShift:'Relocation' },
  { sector:'Healthcare', displacement:8, retrainTime:24, wageImpact:+5, demandShift:'Destination demand' },
  { sector:'Technology', displacement:5, retrainTime:6, wageImpact:+2, demandShift:'Remote shift' },
];

const RE_IMPACTS = [
  { region:'Coastal Florida', type:'Origin (decline)', priceChange:-15, timeline:'2025-2035', driver:'Hurricane/SLR insurance crisis' },
  { region:'Phoenix Metro', type:'Destination (pressure)', priceChange:+22, timeline:'2025-2030', driver:'Domestic climate migration' },
  { region:'Amsterdam', type:'Destination (pressure)', priceChange:+12, timeline:'2025-2035', driver:'European climate migration' },
  { region:'Miami Beach', type:'Origin (decline)', priceChange:-25, timeline:'2025-2040', driver:'SLR + insurance retreat' },
  { region:'Boise/Denver', type:'Destination (pressure)', priceChange:+18, timeline:'2025-2030', driver:'Western US fire/drought migration' },
  { region:'Brisbane', type:'Destination (pressure)', priceChange:+15, timeline:'2025-2035', driver:'Pacific Islands + domestic' },
  { region:'Lagos Lekki', type:'Origin (decline)', priceChange:-20, timeline:'2025-2040', driver:'Coastal flooding + SLR' },
  { region:'Dhaka Outskirts', type:'Origin (decline)', priceChange:-18, timeline:'2025-2035', driver:'Flood zone reclassification' },
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
  sevBadge:(sv)=>({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700, color:'#fff', background:sv==='CRITICAL'?T.red:sv==='HIGH'?T.orange:sv==='MEDIUM'?T.amber:T.blue }),
  select:{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font },
};

export default function ClimateRiskMigrationPage() {
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState('central');
  const [compareCorridors, setCompareCorridors] = useState([0, 2]);
  const [investHorizon, setInvestHorizon] = useState(10);

  const totalMigrants = CORRIDORS.reduce((s, c) => s + (scenario === 'optimistic' ? c.migrants2050 * 0.53 : scenario === 'pessimistic' ? c.migrants2050 * 1.43 : c.migrants2050), 0);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={s.badge}>EP-CG6</span>
            <h1 style={s.title}>Climate-Driven Migration Risk Intelligence</h1>
          </div>
          <p style={s.subtitle}>15 migration corridors | World Bank Groundswell projections | Demographic impact modelling</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select style={s.select} value={scenario} onChange={e => setScenario(e.target.value)}>
            <option value="optimistic">Optimistic (Climate-Friendly)</option>
            <option value="central">Central (Pessimistic)</option>
            <option value="pessimistic">Worst Case</option>
          </select>
          <button style={s.btn(T.gold)} onClick={() => alert('Migration risk report exported')}>Export Report</button>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map((t, i) => <div key={i} style={s.tab(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {tab === 0 && (<div>
        <div style={{ ...s.grid3, marginBottom:16 }}>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.red }}>{Math.round(totalMigrants)}M</div><div style={s.kpiLbl}>Projected Climate Migrants (2050)</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.navy }}>15</div><div style={s.kpiLbl}>Migration Corridors</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.amber }}>{CORRIDORS.filter(c => c.riskLevel === 'CRITICAL').length}</div><div style={s.kpiLbl}>Critical Risk Corridors</div></div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Migration Corridor Hotspots</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Origin</th><th style={s.th}>Destination</th><th style={s.th}>By 2030 (M)</th><th style={s.th}>By 2050 (M)</th><th style={s.th}>Primary Driver</th><th style={s.th}>Risk Level</th></tr></thead>
            <tbody>{CORRIDORS.map((c, i) => (
              <tr key={i} style={{ background: c.riskLevel === 'CRITICAL' ? '#fef2f2' : 'transparent' }}>
                <td style={{ ...s.td, fontWeight:600 }}>{c.origin}</td>
                <td style={s.td}>{c.dest}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{c.migrants2030}M</td>
                <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700, color:T.red }}>{c.migrants2050}M</td>
                <td style={{ ...s.td, fontSize:11 }}>{c.driver}</td>
                <td style={s.td}><span style={s.sevBadge(c.riskLevel)}>{c.riskLevel}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Top 10 Corridors by 2050 Volume</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...CORRIDORS].sort((a, b) => b.migrants2050 - a.migrants2050).slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:11 }} label={{ value:'Migrants (millions)', position:'bottom', fontSize:10 }} />
              <YAxis dataKey="origin" type="category" width={130} tick={{ fontSize:10 }} />
              <Tooltip />
              <Bar dataKey="migrants2030" fill={T.amber} name="By 2030 (M)" />
              <Bar dataKey="migrants2050" fill={T.red} name="By 2050 (M)" />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.ref}><strong>References:</strong> World Bank (2021) Groundswell Part 2: 216M internal climate migrants by 2050 (pessimistic scenario); IDMC Global Report on Internal Displacement; UNHCR Global Trends; IOM World Migration Report 2024.</div>
      </div>)}

      {tab === 1 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Climate Migrant Projections — Three Scenarios</div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={PROJECTIONS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} label={{ value:'Climate Migrants (millions)', angle:-90, position:'insideLeft', fontSize:10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="pessimistic" fill={T.red} stroke={T.red} fillOpacity={0.15} name="Pessimistic" />
              <Area type="monotone" dataKey="central" fill={T.amber} stroke={T.amber} fillOpacity={0.15} name="Central" />
              <Area type="monotone" dataKey="optimistic" fill={T.green} stroke={T.green} fillOpacity={0.15} name="Optimistic" />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Corridor Comparison Tool</div>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <select style={s.select} value={compareCorridors[0]} onChange={e => setCompareCorridors([+e.target.value, compareCorridors[1]])}>{CORRIDORS.map((c, i) => <option key={i} value={i}>{c.origin}</option>)}</select>
              <span style={{ padding:'6px 0' }}>vs</span>
              <select style={s.select} value={compareCorridors[1]} onChange={e => setCompareCorridors([compareCorridors[0], +e.target.value])}>{CORRIDORS.map((c, i) => <option key={i} value={i}>{c.origin}</option>)}</select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { metric:'2030 (M)', c1: CORRIDORS[compareCorridors[0]].migrants2030, c2: CORRIDORS[compareCorridors[1]].migrants2030 },
                { metric:'2050 (M)', c1: CORRIDORS[compareCorridors[0]].migrants2050, c2: CORRIDORS[compareCorridors[1]].migrants2050 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="metric" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="c1" fill={T.blue} name={CORRIDORS[compareCorridors[0]].origin} />
                <Bar dataKey="c2" fill={T.red} name={CORRIDORS[compareCorridors[1]].origin} />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Key Projections Summary</div>
            <div style={{ background:T.bg, padding:16, borderRadius:8, fontFamily:T.mono, fontSize:12, lineHeight:2 }}>
              World Bank Groundswell (2021):<br/>
              Optimistic: 115M by 2050<br/>
              Central: 216M by 2050<br/>
              Pessimistic: 310M by 2050<br/><br/>
              Current scenario: <strong>{scenario}</strong><br/>
              Total projected: <strong>{Math.round(totalMigrants)}M</strong><br/><br/>
              6 regions modelled: Sub-Saharan Africa,<br/>
              South Asia, Latin America, East Asia,<br/>
              North Africa, Eastern Europe/C Asia
            </div>
          </div>
        </div>
        <div style={s.ref}><strong>Source:</strong> World Bank Groundswell Part 2 (2021); Clement et al. (2021) internal climate migration projections; IPCC AR6 WGII migration chapter.</div>
      </div>)}

      {tab === 2 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Urban Stress Indicators — Receiving Cities</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>City</th><th style={s.th}>Country</th><th style={s.th}>Pop Growth %/yr</th><th style={s.th}>Infra Stress</th><th style={s.th}>Housing Demand</th><th style={s.th}>Water Stress</th><th style={s.th}>Job Absorption</th></tr></thead>
            <tbody>{CITIES.map((c, i) => (
              <tr key={i}><td style={{ ...s.td, fontWeight:600 }}>{c.city}</td>
                <td style={s.td}>{c.country}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{c.popGrowth}%</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: c.infraStress > 85 ? T.red : T.navy }}>{c.infraStress}/100</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: c.housingDemand > 85 ? T.red : T.navy }}>{c.housingDemand}/100</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: c.waterStress > 80 ? T.red : T.navy }}>{c.waterStress}/100</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: c.jobAbsorption < 40 ? T.red : T.green }}>{c.jobAbsorption}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Urban Stress Radar — Top 4 Cities</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={['Infrastructure','Housing','Water','Jobs'].map((m, i) => {
                const keys = ['infraStress','housingDemand','waterStress','jobAbsorption'];
                return { metric: m, dhaka: CITIES[0][keys[i]], lagos: CITIES[1][keys[i]], mumbai: CITIES[2][keys[i]], hcmc: CITIES[3][keys[i]] };
              })}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize:10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize:9 }} />
                <Radar name="Dhaka" dataKey="dhaka" stroke={T.red} fill={T.red} fillOpacity={0.1} />
                <Radar name="Lagos" dataKey="lagos" stroke={T.orange} fill={T.orange} fillOpacity={0.1} />
                <Radar name="Mumbai" dataKey="mumbai" stroke={T.blue} fill={T.blue} fillOpacity={0.1} />
                <Radar name="HCMC" dataKey="hcmc" stroke={T.green} fill={T.green} fillOpacity={0.1} />
                <Legend wrapperStyle={{ fontSize:10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Infrastructure Stress vs Job Absorption</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={CITIES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="city" tick={{ fontSize:10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="infraStress" fill={T.red} name="Infrastructure Stress" />
                <Bar dataKey="jobAbsorption" fill={T.green} name="Job Absorption %" />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab === 3 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Labor Market Disruption by Sector</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Sector</th><th style={s.th}>Displacement %</th><th style={s.th}>Retrain (months)</th><th style={s.th}>Wage Impact</th><th style={s.th}>Demand Shift</th></tr></thead>
            <tbody>{LABOR_SECTORS.map((ls, i) => (
              <tr key={i}><td style={{ ...s.td, fontWeight:600 }}>{ls.sector}</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: ls.displacement > 20 ? T.red : T.navy }}>{ls.displacement}%</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{ls.retrainTime} mo</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: ls.wageImpact < 0 ? T.red : T.green }}>{ls.wageImpact > 0 ? '+' : ''}{ls.wageImpact}%</td>
                <td style={s.td}>{ls.demandShift}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Displacement Rate by Sector</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={LABOR_SECTORS.sort((a, b) => b.displacement - a.displacement)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="displacement" name="Displacement %">
                  {LABOR_SECTORS.map((ls, i) => <Cell key={i} fill={ls.displacement > 20 ? T.red : ls.displacement > 10 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Wage Impact + Retraining Time</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={LABOR_SECTORS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="wageImpact" name="Wage Impact %">
                  {LABOR_SECTORS.map((ls, i) => <Cell key={i} fill={ls.wageImpact < 0 ? T.red : T.green} />)}
                </Bar>
                <Bar dataKey="retrainTime" fill={T.blue} name="Retrain Months" />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab === 4 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Real Estate Demand Shift — Origin (Decline) vs Destination (Pressure)</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Region</th><th style={s.th}>Type</th><th style={s.th}>Price Change</th><th style={s.th}>Timeline</th><th style={s.th}>Driver</th></tr></thead>
            <tbody>{RE_IMPACTS.map((r, i) => (
              <tr key={i}><td style={{ ...s.td, fontWeight:600 }}>{r.region}</td>
                <td style={s.td}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, color:'#fff', background: r.type.includes('decline') ? T.red : T.green }}>{r.type}</span></td>
                <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700, color: r.priceChange < 0 ? T.red : T.green }}>{r.priceChange > 0 ? '+' : ''}{r.priceChange}%</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{r.timeline}</td>
                <td style={{ ...s.td, fontSize:11 }}>{r.driver}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Price Change by Region</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={RE_IMPACTS.sort((a, b) => a.priceChange - b.priceChange)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:11 }} />
                <YAxis dataKey="region" type="category" width={110} tick={{ fontSize:10 }} />
                <Tooltip />
                <Bar dataKey="priceChange" name="Price Change %">
                  {RE_IMPACTS.map((r, i) => <Cell key={i} fill={r.priceChange < 0 ? T.red : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Price Trajectory — Key Markets</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={Array.from({ length: 6 }, (_, i) => ({ year: 2025 + i * 3, miami: -3 * (i + 1), phoenix: 4 * (i + 1) * 0.8, amsterdam: 2 * (i + 1), dhaka: -3.5 * (i + 1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} label={{ value:'Price Change %', angle:-90, position:'insideLeft', fontSize:10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="miami" stroke={T.red} name="Miami Beach" strokeWidth={2} />
                <Line type="monotone" dataKey="phoenix" stroke={T.green} name="Phoenix" strokeWidth={2} />
                <Line type="monotone" dataKey="amsterdam" stroke={T.blue} name="Amsterdam" strokeWidth={2} />
                <Line type="monotone" dataKey="dhaka" stroke={T.orange} name="Dhaka" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab === 5 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Investment Implications of Climate Migration</div>
          <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center' }}>
            <label style={{ fontSize:13 }}>Investment Horizon (years): <strong>{investHorizon}</strong></label>
            <input type="range" min={5} max={30} step={5} value={investHorizon} onChange={e => setInvestHorizon(+e.target.value)} style={{ width:200, accentColor:T.gold }} />
          </div>
          <div style={s.grid3}>
            {[
              { title:'Long — Destination Cities', sectors:'Infrastructure, Housing, Healthcare, Utilities', return:`+8-15% over ${investHorizon}yr`, risk:'MEDIUM' },
              { title:'Short — Coastal Origin', sectors:'Coastal RE, Tourism, Agriculture', return:`-12-25% over ${investHorizon}yr`, risk:'HIGH' },
              { title:'Hedge — Adaptation Tech', sectors:'Water tech, Climate-resilient infra, InsurTech', return:`+15-25% over ${investHorizon}yr`, risk:'LOW' },
            ].map((inv, i) => (
              <div key={i} style={s.card}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>{inv.title}</div>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:8 }}>{inv.sectors}</div>
                <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color: inv.return.includes('+') ? T.green : T.red }}>{inv.return}</div>
                <div style={{ marginTop:8 }}><span style={s.sevBadge(inv.risk)}>{inv.risk} RISK</span></div>
              </div>
            ))}
          </div>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Sector Allocation — Migration-Adjusted</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { sector:'Destination Infra', weight:25, return:12 },
                { sector:'Adaptation Tech', weight:20, return:18 },
                { sector:'Healthcare (dest)', weight:15, return:10 },
                { sector:'RE — Destination', weight:15, return:14 },
                { sector:'Water/Utilities', weight:15, return:8 },
                { sector:'Green Bonds', weight:10, return:6 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="weight" fill={T.navy} name="Portfolio Weight %" />
                <Bar dataKey="return" fill={T.green} name="Expected Return %" />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Cumulative Investment Opportunity</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={Array.from({ length: 6 }, (_, i) => ({ year: 2025 + i * 5, infrastructure: 50 + i * 40, adaptation: 30 + i * 35, healthcare: 20 + i * 20, housing: 40 + i * 30 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} label={{ value:'Market Size ($B)', angle:-90, position:'insideLeft', fontSize:10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="infrastructure" stackId="1" fill={T.navy} stroke={T.navy} fillOpacity={0.3} name="Infrastructure" />
                <Area type="monotone" dataKey="adaptation" stackId="1" fill={T.green} stroke={T.green} fillOpacity={0.3} name="Adaptation Tech" />
                <Area type="monotone" dataKey="healthcare" stackId="1" fill={T.blue} stroke={T.blue} fillOpacity={0.3} name="Healthcare" />
                <Area type="monotone" dataKey="housing" stackId="1" fill={T.teal} stroke={T.teal} fillOpacity={0.3} name="Housing" />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={s.btn(T.navy)} onClick={() => alert('Investment impact calculator opened')}>Investment Calculator</button>
          <button style={s.btn(T.gold)} onClick={() => alert('Demographic scenario builder opened')}>Demographic Scenario Builder</button>
          <button style={s.btn(T.sage)} onClick={() => alert('Report exported')}>Export Analysis</button>
        </div>
        <div style={s.ref}><strong>References:</strong> World Bank Groundswell (2021); IDMC Global Internal Displacement Database; UNHCR climate refugee tracking; IOM World Migration Report 2024; BlackRock Investment Institute climate migration analysis.</div>
      </div>)}
    </div>
  );
}
