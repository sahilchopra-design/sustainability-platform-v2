import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Alert Dashboard','Active Hazard Monitor','72hr Forecast','Asset Exposure Check','Historical Event Library','Response Protocol'];

const ALERTS = [
  { id:1, sev:'CRITICAL', hazard:'Tropical Cyclone', region:'Gulf of Mexico', assets:5, lossRange:'$180-320M', status:'ACTIVE', ts:'4 min ago', detail:'Category 4 hurricane approaching Houston corridor; 72hr landfall window' },
  { id:2, sev:'CRITICAL', hazard:'River Flood', region:'Rhine Valley, DE', assets:3, lossRange:'$95-150M', status:'ACTIVE', ts:'18 min ago', detail:'Water levels at Kaub gauge below critical 40cm; barge transport halted' },
  { id:3, sev:'HIGH', hazard:'Wildfire', region:'California, US', assets:4, lossRange:'$120-240M', status:'ACTIVE', ts:'45 min ago', detail:'Red flag warning; Santa Ana winds >65mph; containment at 15%' },
  { id:4, sev:'HIGH', hazard:'Heat Stress', region:'South Asia', assets:6, lossRange:'$50-85M', status:'MONITORING', ts:'1 hr ago', detail:'WBGT exceeding 33C for 5th consecutive day; labor productivity impact' },
  { id:5, sev:'HIGH', hazard:'Coastal Flood', region:'Netherlands', assets:2, lossRange:'$60-110M', status:'ACTIVE', ts:'2 hr ago', detail:'Storm surge warning; North Sea levels +2.1m above normal' },
  { id:6, sev:'MEDIUM', hazard:'Drought', region:'Panama Canal', assets:8, lossRange:'$30-70M', status:'MONITORING', ts:'3 hr ago', detail:'Gatun Lake at 79.2ft; transit restrictions likely within 2 weeks' },
  { id:7, sev:'MEDIUM', hazard:'Severe Storm', region:'Central Europe', assets:3, lossRange:'$25-55M', status:'RESOLVED', ts:'5 hr ago', detail:'Hailstorm passed; damage assessment underway' },
  { id:8, sev:'MEDIUM', hazard:'Wildfire', region:'Australia East', assets:2, lossRange:'$40-80M', status:'MONITORING', ts:'6 hr ago', detail:'Bushfire season onset; fire danger index EXTREME in NSW' },
  { id:9, sev:'LOW', hazard:'Winter Storm', region:'Northeast US', assets:2, lossRange:'$10-25M', status:'FORECAST', ts:'8 hr ago', detail:'Noreaster expected in 48hrs; accumulations 15-25cm' },
  { id:10, sev:'LOW', hazard:'Drought', region:'Mediterranean', assets:3, lossRange:'$15-30M', status:'MONITORING', ts:'12 hr ago', detail:'SPI index at -1.8; reservoir levels at 42% capacity' },
  { id:11, sev:'MEDIUM', hazard:'Tropical Cyclone', region:'Philippines', assets:4, lossRange:'$35-65M', status:'FORECAST', ts:'14 hr ago', detail:'Tropical depression forming; 40% chance of strengthening to typhoon' },
  { id:12, sev:'LOW', hazard:'River Flood', region:'Mekong Delta, VN', assets:1, lossRange:'$8-15M', status:'MONITORING', ts:'18 hr ago', detail:'Seasonal flood levels above 90th percentile; rice crop exposure' },
];

const FORECAST_EVENTS = [
  { time:'0-12hr', event:'Hurricane approach — Gulf of Mexico', prob:92, impact:'CRITICAL', assets:5 },
  { time:'12-24hr', event:'Storm surge peak — Netherlands coast', prob:78, impact:'HIGH', assets:2 },
  { time:'12-24hr', event:'Wildfire spread — Ventura County, CA', prob:65, impact:'HIGH', assets:3 },
  { time:'24-48hr', event:'Noreaster landfall — NYC metro', prob:55, impact:'MEDIUM', assets:2 },
  { time:'24-48hr', event:'Heatwave extension — Mumbai region', prob:80, impact:'HIGH', assets:4 },
  { time:'48-72hr', event:'Typhoon development — Western Pacific', prob:40, impact:'MEDIUM', assets:4 },
  { time:'48-72hr', event:'Flash flood risk — Rhine tributaries', prob:35, impact:'MEDIUM', assets:2 },
];

const HISTORICAL = [
  { year:2025, event:'Hurricane Milton', region:'Florida, US', type:'Tropical Cyclone', actualLoss:48.5, modelledLoss:42.0, ratio:1.15 },
  { year:2024, event:'Typhoon Yagi', region:'Vietnam/Philippines', type:'Tropical Cyclone', actualLoss:16.5, modelledLoss:14.8, ratio:1.11 },
  { year:2024, event:'European Heatwave', region:'Southern Europe', type:'Heat Stress', actualLoss:8.2, modelledLoss:6.5, ratio:1.26 },
  { year:2024, event:'Dubai Floods', region:'UAE', type:'Flash Flood', actualLoss:4.5, modelledLoss:2.1, ratio:2.14 },
  { year:2023, event:'Libya Floods', region:'Derna, Libya', type:'Flash Flood', actualLoss:10.0, modelledLoss:3.5, ratio:2.86 },
  { year:2023, event:'Maui Wildfire', region:'Hawaii, US', type:'Wildfire', actualLoss:5.6, modelledLoss:4.2, ratio:1.33 },
  { year:2023, event:'Turkey Earthquake+', region:'Turkey/Syria', type:'Earthquake+Flood', actualLoss:34.2, modelledLoss:28.0, ratio:1.22 },
  { year:2023, event:'Panama Canal Drought', region:'Panama', type:'Drought', actualLoss:3.8, modelledLoss:2.5, ratio:1.52 },
  { year:2022, event:'Pakistan Floods', region:'Pakistan', type:'River Flood', actualLoss:30.0, modelledLoss:18.0, ratio:1.67 },
  { year:2022, event:'European Drought', region:'Rhine/Po Valley', type:'Drought', actualLoss:20.0, modelledLoss:15.0, ratio:1.33 },
  { year:2022, event:'Hurricane Ian', region:'Florida, US', type:'Tropical Cyclone', actualLoss:65.0, modelledLoss:55.0, ratio:1.18 },
  { year:2021, event:'European Floods', region:'Germany/Belgium', type:'River Flood', actualLoss:43.0, modelledLoss:22.0, ratio:1.95 },
  { year:2021, event:'TX Winter Storm', region:'Texas, US', type:'Winter Storm', actualLoss:23.0, modelledLoss:15.0, ratio:1.53 },
  { year:2021, event:'BC Heat Dome', region:'British Columbia', type:'Heat Stress', actualLoss:8.9, modelledLoss:5.0, ratio:1.78 },
  { year:2021, event:'Hurricane Ida', region:'Louisiana, US', type:'Tropical Cyclone', actualLoss:36.0, modelledLoss:32.0, ratio:1.13 },
  { year:2020, event:'Australian Bushfires', region:'Australia', type:'Wildfire', actualLoss:10.0, modelledLoss:7.5, ratio:1.33 },
  { year:2020, event:'Cyclone Amphan', region:'India/Bangladesh', type:'Tropical Cyclone', actualLoss:13.0, modelledLoss:10.5, ratio:1.24 },
  { year:2020, event:'China Floods', region:'Yangtze Basin', type:'River Flood', actualLoss:17.0, modelledLoss:12.0, ratio:1.42 },
  { year:2020, event:'Midwest Derecho', region:'Iowa, US', type:'Severe Storm', actualLoss:11.0, modelledLoss:8.0, ratio:1.38 },
  { year:2020, event:'Hurricane Laura', region:'Louisiana, US', type:'Tropical Cyclone', actualLoss:19.0, modelledLoss:16.5, ratio:1.15 },
];

const PROTOCOLS = {
  CRITICAL: [
    'Activate crisis management team immediately',
    'Notify C-suite and board risk committee',
    'Freeze new exposures in affected region',
    'Engage loss adjusters and claims teams',
    'Activate business continuity plans for affected assets',
    'Issue client/stakeholder communication within 2 hours',
  ],
  HIGH: [
    'Alert portfolio managers and risk officers',
    'Review affected asset exposure and concentration',
    'Pre-position loss adjustment resources',
    'Update scenario models with latest event data',
    'Prepare contingency communication draft',
  ],
  MEDIUM: [
    'Add to active monitoring watchlist',
    'Schedule exposure review within 24 hours',
    'Update risk models with latest parameters',
    'Prepare escalation criteria to HIGH',
  ],
  LOW: [
    'Log event in monitoring system',
    'Schedule routine review within 72 hours',
    'No immediate action required',
  ],
};

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
  grid4:{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 },
  kpi:{ textAlign:'center', padding:16, background:T.bg, borderRadius:8, border:`1px solid ${T.border}` },
  kpiVal:{ fontSize:26, fontWeight:700, fontFamily:T.mono },
  kpiLbl:{ fontSize:11, color:T.textSec, marginTop:4, textTransform:'uppercase', letterSpacing:0.5 },
  ref:{ background:'#fef9ee', border:`1px solid ${T.gold}40`, borderRadius:8, padding:14, fontSize:12, color:T.textSec, marginTop:12, lineHeight:1.6 },
  btn:(c=T.navy)=>({ padding:'7px 16px', borderRadius:6, border:'none', background:c, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, marginRight:8 }),
  tbl:{ width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:{ textAlign:'left', padding:'6px 8px', borderBottom:`2px solid ${T.border}`, fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:0.4, color:T.textSec },
  td:{ padding:'6px 8px', borderBottom:`1px solid ${T.border}` },
  sevBadge:(sv)=>({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700, color:'#fff', background:sv==='CRITICAL'?T.red:sv==='HIGH'?T.orange:sv==='MEDIUM'?T.amber:T.blue }),
  statusBadge:(st)=>({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, color:'#fff', background:st==='ACTIVE'?T.red:st==='MONITORING'?T.amber:st==='FORECAST'?T.blue:T.green }),
  alertRow:{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 0', borderBottom:`1px solid ${T.border}` },
};

export default function PhysicalRiskEarlyWarningPage() {
  const [tab, setTab] = useState(0);
  const [sevFilter, setSevFilter] = useState('ALL');
  const [notifConfig, setNotifConfig] = useState({ email:true, sms:false, slack:true });
  const [acknowledged, setAcknowledged] = useState(new Set());

  const filtered = sevFilter === 'ALL' ? ALERTS : ALERTS.filter(a => a.sev === sevFilter);
  const counts = { CRITICAL: ALERTS.filter(a => a.sev === 'CRITICAL').length, HIGH: ALERTS.filter(a => a.sev === 'HIGH').length, MEDIUM: ALERTS.filter(a => a.sev === 'MEDIUM').length, LOW: ALERTS.filter(a => a.sev === 'LOW').length };

  const sevDistrib = [
    { name:'CRITICAL', value:counts.CRITICAL, color:T.red },
    { name:'HIGH', value:counts.HIGH, color:T.orange },
    { name:'MEDIUM', value:counts.MEDIUM, color:T.amber },
    { name:'LOW', value:counts.LOW, color:T.blue },
  ];

  const ack = (id) => setAcknowledged(p => { const s = new Set(p); s.add(id); return s; });

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={s.badge}>EP-CG4</span>
            <h1 style={s.title}>Physical Risk Early Warning System</h1>
          </div>
          <p style={s.subtitle}>Real-time alert feed | 72hr forecast | Portfolio exposure overlay</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ background:T.red, color:'#fff', padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:700, animation:'pulse 2s infinite' }}>{counts.CRITICAL} CRITICAL</div>
          <button style={s.btn(T.gold)} onClick={() => alert('Alert report exported')}>Export Alerts</button>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map((t, i) => <div key={i} style={s.tab(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {tab === 0 && (<div>
        <div style={s.grid4}>
          <div style={{ ...s.kpi, borderLeft:`4px solid ${T.red}` }}><div style={{ ...s.kpiVal, color:T.red }}>{counts.CRITICAL}</div><div style={s.kpiLbl}>Critical</div></div>
          <div style={{ ...s.kpi, borderLeft:`4px solid ${T.orange}` }}><div style={{ ...s.kpiVal, color:T.orange }}>{counts.HIGH}</div><div style={s.kpiLbl}>High</div></div>
          <div style={{ ...s.kpi, borderLeft:`4px solid ${T.amber}` }}><div style={{ ...s.kpiVal, color:T.amber }}>{counts.MEDIUM}</div><div style={s.kpiLbl}>Medium</div></div>
          <div style={{ ...s.kpi, borderLeft:`4px solid ${T.blue}` }}><div style={{ ...s.kpiVal, color:T.blue }}>{counts.LOW}</div><div style={s.kpiLbl}>Low</div></div>
        </div>
        <div style={{ display:'flex', gap:6, margin:'16px 0' }}>
          {['ALL','CRITICAL','HIGH','MEDIUM','LOW'].map(sv => (
            <button key={sv} style={s.btn(sevFilter === sv ? T.navy : T.textMut)} onClick={() => setSevFilter(sv)}>{sv}</button>
          ))}
        </div>
        <div style={s.card}>
          {filtered.map(a => (
            <div key={a.id} style={{ ...s.alertRow, background: a.sev === 'CRITICAL' ? '#fef2f2' : 'transparent', padding:12, borderRadius:6, marginBottom:4 }}>
              <div style={{ minWidth:80 }}><span style={s.sevBadge(a.sev)}>{a.sev}</span></div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{a.hazard} — {a.region}</div>
                <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{a.detail}</div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>Assets: {a.assets} | Loss Range: {a.lossRange} | <span style={s.statusBadge(a.status)}>{a.status}</span></div>
              </div>
              <div style={{ textAlign:'right', minWidth:100 }}>
                <div style={{ fontSize:11, color:T.textMut, fontFamily:T.mono }}>{a.ts}</div>
                {!acknowledged.has(a.id) ? (
                  <button style={{ ...s.btn(T.green), marginTop:6, fontSize:11, padding:'4px 10px' }} onClick={() => ack(a.id)}>Acknowledge</button>
                ) : (
                  <span style={{ fontSize:11, color:T.green, fontWeight:600 }}>Acknowledged</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={s.ref}><strong>Data Sources:</strong> NOAA National Hurricane Center; ECMWF operational forecasts; Copernicus Emergency Management Service; CAL FIRE incident feed; DWD river gauge network.</div>
      </div>)}

      {tab === 1 && (<div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Active Hazard Distribution</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={sevDistrib} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {sevDistrib.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Hazard Type Breakdown</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...new Set(ALERTS.map(a => a.hazard))].map(h => ({ hazard: h, count: ALERTS.filter(a => a.hazard === h).length }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hazard" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Active Alerts" fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Alert Trend (Last 7 Days)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={Array.from({ length: 7 }, (_, i) => ({ day: `Day ${i + 1}`,
              critical: Math.floor(1 + sr(i * 23 + 10)*3),
              high:     Math.floor(2 + sr(i * 17 + 20)*4),
              medium:   Math.floor(3 + sr(i * 11 + 30)*5),
              low:      Math.floor(1 + sr(i * 31 + 5)*3) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="critical" stackId="1" fill={T.red} stroke={T.red} name="Critical" />
              <Area type="monotone" dataKey="high" stackId="1" fill={T.orange} stroke={T.orange} name="High" />
              <Area type="monotone" dataKey="medium" stackId="1" fill={T.amber} stroke={T.amber} name="Medium" />
              <Area type="monotone" dataKey="low" stackId="1" fill={T.blue} stroke={T.blue} name="Low" />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>)}

      {tab === 2 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>72-Hour Forecast — Upcoming Weather Events with Portfolio Exposure</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Window</th><th style={s.th}>Event</th><th style={s.th}>Probability</th><th style={s.th}>Impact</th><th style={s.th}>Assets Exposed</th></tr></thead>
            <tbody>{FORECAST_EVENTS.map((fe, i) => (
              <tr key={i}><td style={{ ...s.td, fontFamily:T.mono }}>{fe.time}</td>
                <td style={{ ...s.td, fontWeight:600 }}>{fe.event}</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: fe.prob > 70 ? T.red : fe.prob > 50 ? T.amber : T.blue }}>{fe.prob}%</td>
                <td style={s.td}><span style={s.sevBadge(fe.impact)}>{fe.impact}</span></td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{fe.assets}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Event Probability Timeline</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={FORECAST_EVENTS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="time" tick={{ fontSize:10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize:11 }} label={{ value:'Probability %', angle:-90, position:'insideLeft', fontSize:10 }} />
                <Tooltip />
                <Bar dataKey="prob" name="Probability %">
                  {FORECAST_EVENTS.map((fe, i) => <Cell key={i} fill={fe.prob > 70 ? T.red : fe.prob > 50 ? T.amber : T.blue} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Exposed Assets by Time Window</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { window:'0-12hr', assets: FORECAST_EVENTS.filter(e => e.time === '0-12hr').reduce((s, e) => s + e.assets, 0) },
                { window:'12-24hr', assets: FORECAST_EVENTS.filter(e => e.time === '12-24hr').reduce((s, e) => s + e.assets, 0) },
                { window:'24-48hr', assets: FORECAST_EVENTS.filter(e => e.time === '24-48hr').reduce((s, e) => s + e.assets, 0) },
                { window:'48-72hr', assets: FORECAST_EVENTS.filter(e => e.time === '48-72hr').reduce((s, e) => s + e.assets, 0) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="window" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="assets" name="Assets Exposed" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={s.ref}><strong>Sources:</strong> ECMWF 10-day ensemble forecast; NOAA GFS model output; JMA typhoon advisory; Copernicus EMS rapid mapping.</div>
      </div>)}

      {tab === 3 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Asset-Level Exposure Assessment</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Asset</th><th style={s.th}>Location</th><th style={s.th}>Primary Hazard</th><th style={s.th}>Exposure ($M)</th><th style={s.th}>Insurance</th><th style={s.th}>Net Exposure</th><th style={s.th}>Status</th></tr></thead>
            <tbody>{[
              { asset:'Houston Refinery Complex', loc:'TX, US', hazard:'Tropical Cyclone', exposure:450, insurance:320, net:130, status:'CRITICAL' },
              { asset:'Rhine Logistics Hub', loc:'Duisburg, DE', hazard:'Low Water/Flood', exposure:180, insurance:120, net:60, status:'HIGH' },
              { asset:'Malibu RE Portfolio', loc:'CA, US', hazard:'Wildfire', exposure:520, insurance:380, net:140, status:'HIGH' },
              { asset:'Mumbai Office Complex', loc:'Maharashtra, IN', hazard:'Heat Stress', exposure:95, insurance:45, net:50, status:'MEDIUM' },
              { asset:'Rotterdam Port Assets', loc:'Netherlands', hazard:'Storm Surge', exposure:280, insurance:220, net:60, status:'HIGH' },
              { asset:'Bangkok Manufacturing', loc:'Thailand', hazard:'River Flood', exposure:150, insurance:85, net:65, status:'MEDIUM' },
            ].map((a, i) => (
              <tr key={i} style={{ background: a.status === 'CRITICAL' ? '#fef2f2' : 'transparent' }}>
                <td style={{ ...s.td, fontWeight:600 }}>{a.asset}</td>
                <td style={s.td}>{a.loc}</td>
                <td style={s.td}>{a.hazard}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>${a.exposure}M</td>
                <td style={{ ...s.td, fontFamily:T.mono, color:T.green }}>${a.insurance}M</td>
                <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700, color:T.red }}>${a.net}M</td>
                <td style={s.td}><span style={s.sevBadge(a.status)}>{a.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Exposure vs Insurance Coverage</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { name:'Houston', gross:450, insured:320 }, { name:'Rhine', gross:180, insured:120 },
                { name:'Malibu', gross:520, insured:380 }, { name:'Mumbai', gross:95, insured:45 },
                { name:'Rotterdam', gross:280, insured:220 }, { name:'Bangkok', gross:150, insured:85 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="gross" fill={T.red} name="Gross Exposure $M" />
                <Bar dataKey="insured" fill={T.green} name="Insured $M" />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Net Exposure Gap</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { name:'Houston', gap:130 }, { name:'Rhine', gap:60 }, { name:'Malibu', gap:140 },
                { name:'Mumbai', gap:50 }, { name:'Rotterdam', gap:60 }, { name:'Bangkok', gap:65 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="gap" name="Net Exposure Gap $M" fill={T.orange} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab === 4 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Historical NatCat Events (2020-2025) — Actual vs Modelled Loss</div>
          <div style={{ overflowX:'auto' }}>
            <table style={s.tbl}>
              <thead><tr><th style={s.th}>Year</th><th style={s.th}>Event</th><th style={s.th}>Region</th><th style={s.th}>Type</th><th style={s.th}>Actual ($B)</th><th style={s.th}>Modelled ($B)</th><th style={s.th}>A/M Ratio</th></tr></thead>
              <tbody>{HISTORICAL.map((h, i) => (
                <tr key={i}><td style={{ ...s.td, fontFamily:T.mono }}>{h.year}</td>
                  <td style={{ ...s.td, fontWeight:600 }}>{h.event}</td>
                  <td style={s.td}>{h.region}</td>
                  <td style={s.td}>{h.type}</td>
                  <td style={{ ...s.td, fontFamily:T.mono, color:T.red }}>${h.actualLoss}B</td>
                  <td style={{ ...s.td, fontFamily:T.mono }}>${h.modelledLoss}B</td>
                  <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700, color: h.ratio > 1.5 ? T.red : h.ratio > 1.2 ? T.amber : T.green }}>{h.ratio.toFixed(2)}x</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Actual vs Modelled Loss Comparison</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={HISTORICAL.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="event" tick={{ fontSize:9 }} />
                <YAxis tick={{ fontSize:11 }} label={{ value:'Loss ($B)', angle:-90, position:'insideLeft', fontSize:10 }} />
                <Tooltip />
                <Bar dataKey="actualLoss" fill={T.red} name="Actual Loss" />
                <Bar dataKey="modelledLoss" fill={T.blue} name="Modelled Loss" />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Model Accuracy Ratio Trend</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={HISTORICAL.slice(0, 12).reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="event" tick={{ fontSize:9 }} />
                <YAxis domain={[0.8, 3]} tick={{ fontSize:11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="ratio" stroke={T.navy} strokeWidth={2} name="A/M Ratio" />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={s.ref}><strong>References:</strong> Munich Re NatCatSERVICE; Swiss Re sigma; EM-DAT CRED International Disaster Database; NOAA Billion-Dollar Weather and Climate Disasters.</div>
      </div>)}

      {tab === 5 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Response Protocol by Severity Level</div>
          {['CRITICAL','HIGH','MEDIUM','LOW'].map(sv => (
            <div key={sv} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={s.sevBadge(sv)}>{sv}</span>
                <span style={{ fontSize:13, fontWeight:600 }}>Response Actions</span>
              </div>
              <ol style={{ margin:0, paddingLeft:24 }}>
                {PROTOCOLS[sv].map((p, i) => <li key={i} style={{ fontSize:13, marginBottom:4, color:T.textSec }}>{p}</li>)}
              </ol>
            </div>
          ))}
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Notification Configuration</div>
          <div style={{ display:'flex', gap:24 }}>
            {[['email','Email Alerts'],['sms','SMS Alerts'],['slack','Slack Integration']].map(([key, label]) => (
              <label key={key} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={notifConfig[key]} onChange={() => setNotifConfig(p => ({ ...p, [key]: !p[key] }))} style={{ accentColor:T.gold }} />
                {label}
              </label>
            ))}
          </div>
          <div style={{ marginTop:12, fontSize:12, color:T.textSec }}>
            Threshold settings: CRITICAL = immediate | HIGH = within 15 min | MEDIUM = hourly digest | LOW = daily summary
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={s.btn(T.navy)} onClick={() => alert('Notification preferences saved')}>Save Preferences</button>
          <button style={s.btn(T.gold)} onClick={() => alert('Test alert sent')}>Send Test Alert</button>
        </div>
      </div>)}
    </div>
  );
}
