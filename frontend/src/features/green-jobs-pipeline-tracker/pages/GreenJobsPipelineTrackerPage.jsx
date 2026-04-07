import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Green Jobs Dashboard','Sector Pipeline 2025-2040','Skills Taxonomy','Wage Analysis','Geographic Distribution','Policy Incentives'];

const SECTORS = [
  { sector:'Solar Installation', jobs2025:1200, jobs2030:3400, jobs2035:5800, jobs2040:7200, avgWage:52000, fossilWage:58000, retrainingMo:6, certRequired:'NABCEP PV', topRegion:'Americas' },
  { sector:'Wind Turbine Tech', jobs2025:850, jobs2030:2200, jobs2035:4100, jobs2040:5500, avgWage:62000, fossilWage:65000, retrainingMo:12, certRequired:'GWO BST/BTT', topRegion:'Europe' },
  { sector:'EV Manufacturing', jobs2025:980, jobs2030:3800, jobs2035:6200, jobs2040:8400, avgWage:55000, fossilWage:52000, retrainingMo:8, certRequired:'EV Safety Cert', topRegion:'Asia-Pacific' },
  { sector:'Battery Production', jobs2025:420, jobs2030:1800, jobs2035:4500, jobs2040:6800, avgWage:58000, fossilWage:54000, retrainingMo:10, certRequired:'Li-ion Handling', topRegion:'Asia-Pacific' },
  { sector:'Green Hydrogen', jobs2025:180, jobs2030:1200, jobs2035:3200, jobs2040:5800, avgWage:68000, fossilWage:72000, retrainingMo:14, certRequired:'H₂ Safety Eng', topRegion:'Middle East' },
  { sector:'Building Retrofit', jobs2025:1500, jobs2030:4200, jobs2035:6800, jobs2040:8200, avgWage:48000, fossilWage:45000, retrainingMo:4, certRequired:'PAS 2035', topRegion:'Europe' },
  { sector:'Nature Restoration', jobs2025:320, jobs2030:1400, jobs2035:2800, jobs2040:4200, avgWage:42000, fossilWage:38000, retrainingMo:6, certRequired:'Ecology Diploma', topRegion:'Americas' },
  { sector:'Circular Economy', jobs2025:480, jobs2030:1600, jobs2035:3400, jobs2040:5200, avgWage:50000, fossilWage:48000, retrainingMo:6, certRequired:'Waste Mgmt Cert', topRegion:'Europe' },
];

const PIPELINE = [
  { year:2025, solar:1200, wind:850, ev:980, battery:420, hydrogen:180, retrofit:1500, nature:320, circular:480 },
  { year:2028, solar:2200, wind:1500, ev:2200, battery:1100, hydrogen:650, retrofit:2800, nature:850, circular:1000 },
  { year:2030, solar:3400, wind:2200, ev:3800, battery:1800, hydrogen:1200, retrofit:4200, nature:1400, circular:1600 },
  { year:2033, solar:4500, wind:3100, ev:5000, battery:3200, hydrogen:2100, retrofit:5500, nature:2100, circular:2500 },
  { year:2035, solar:5800, wind:4100, ev:6200, battery:4500, hydrogen:3200, retrofit:6800, nature:2800, circular:3400 },
  { year:2038, solar:6500, wind:4800, ev:7400, battery:5800, hydrogen:4500, retrofit:7500, nature:3500, circular:4300 },
  { year:2040, solar:7200, wind:5500, ev:8400, battery:6800, hydrogen:5800, retrofit:8200, nature:4200, circular:5200 },
];

const GEO_DIST = [
  { region:'Europe', share:32, jobs:18400 },
  { region:'Asia-Pacific', share:28, jobs:16100 },
  { region:'Americas', share:24, jobs:13800 },
  { region:'Middle East & Africa', share:10, jobs:5800 },
  { region:'Other', share:6, jobs:3500 },
];

const POLICY = [
  { name:'US IRA Clean Energy Tax Credits', region:'USA', type:'Tax Credit', jobsEnabled:2800, budgetBn:12.5 },
  { name:'EU Green Deal Industrial Plan', region:'EU', type:'Subsidy + Regulation', jobsEnabled:4200, budgetBn:18.0 },
  { name:'UK Green Jobs Taskforce', region:'UK', type:'Training Fund', jobsEnabled:850, budgetBn:2.1 },
  { name:'India PLI Scheme (Solar/EV)', region:'India', type:'Production Incentive', jobsEnabled:3500, budgetBn:8.2 },
  { name:'Australia Rewiring the Nation', region:'Australia', type:'Infrastructure', jobsEnabled:1200, budgetBn:4.5 },
  { name:'Japan GX Transition Bonds', region:'Japan', type:'Green Bond', jobsEnabled:1800, budgetBn:15.0 },
];

const PALETTE = [T.gold, T.navy, T.green, T.blue, T.purple, T.orange, T.sage, T.teal];

export default function GreenJobsPipelineTrackerPage() {
  const [tab, setTab] = useState(0);
  const [selSector, setSelSector] = useState('All');
  const [watchlist, setWatchlist] = useState(false);

  const filteredSectors = useMemo(() => selSector === 'All' ? SECTORS : SECTORS.filter(s => s.sector === selSector), [selSector]);
  const totalJobs2040 = SECTORS.reduce((s, sec) => s + sec.jobs2040, 0);

  const card = (title, value, sub, color) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, flex:1, minWidth:150 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:1 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:700, color:color||T.navy, marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ background:T.surface, border:`2px solid ${T.gold}`, borderRadius:12, padding:'20px 28px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CO5</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>GREEN JOBS PIPELINE TRACKER</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Green Jobs Pipeline Tracker</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>Workforce analytics across 8 green sectors, 2025-2040 projections</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
            <span style={{ padding:'6px 14px', borderRadius:6, background:T.teal+'15', color:T.teal, fontFamily:T.mono, fontSize:11 }}>👥 5 viewing</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Total Green Jobs (2040)', (totalJobs2040/1000).toFixed(1) + 'K', 'Across 8 sectors', T.green)}
            {card('Sectors Tracked', '8', 'Green economy', T.navy)}
            {card('Top Sector (2040)', 'EV Manufacturing', '8,400 jobs (000s)', T.blue)}
            {card('Avg Retraining', Math.round(SECTORS.reduce((s,sec)=>s+sec.retrainingMo,0)/8) + ' months', 'Transition period', T.amber)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Jobs by Sector (2025 vs 2040, thousands)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={SECTORS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar dataKey="jobs2025" fill={T.navy} name="2025 (000s)" />
                <Bar dataKey="jobs2040" fill={T.green} name="2040 (000s)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Green Jobs Pipeline 2025-2040 (000s)</h3>
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={PIPELINE}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Area type="monotone" dataKey="solar" stackId="1" fill={T.gold+'60'} stroke={T.gold} name="Solar" />
              <Area type="monotone" dataKey="wind" stackId="1" fill={T.navy+'60'} stroke={T.navy} name="Wind" />
              <Area type="monotone" dataKey="ev" stackId="1" fill={T.green+'60'} stroke={T.green} name="EV Mfg" />
              <Area type="monotone" dataKey="battery" stackId="1" fill={T.blue+'60'} stroke={T.blue} name="Battery" />
              <Area type="monotone" dataKey="hydrogen" stackId="1" fill={T.purple+'60'} stroke={T.purple} name="Green H₂" />
              <Area type="monotone" dataKey="retrofit" stackId="1" fill={T.orange+'60'} stroke={T.orange} name="Retrofit" />
              <Area type="monotone" dataKey="nature" stackId="1" fill={T.sage+'60'} stroke={T.sage} name="Nature" />
              <Area type="monotone" dataKey="circular" stackId="1" fill={T.teal+'60'} stroke={T.teal} name="Circular" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Retraining Duration by Sector (Months)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SECTORS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis type="category" dataKey="sector" width={130} tick={{ fontSize:10, fontFamily:T.mono }} />
                <Tooltip />
                <Bar dataKey="retrainingMo" name="Months">{SECTORS.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Certification Requirements</h3>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Sector','Certification','Duration (mo)','Top Region'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
              <tbody>{SECTORS.map((s, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{s.sector}</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono }}>{s.certRequired}</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono }}>{s.retrainingMo}</td>
                  <td style={{ padding:'8px 12px', fontSize:13 }}>{s.topRegion}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Green vs Fossil Sector Wages ($)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={SECTORS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
              <Tooltip formatter={v => '$' + v.toLocaleString()} /><Legend />
              <Bar dataKey="avgWage" fill={T.green} name="Green Wage ($)" />
              <Bar dataKey="fossilWage" fill={T.textMut} name="Fossil Wage ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Geographic Distribution of Green Jobs</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={GEO_DIST} dataKey="share" nameKey="region" cx="50%" cy="50%" outerRadius={100} label={({ region, share }) => `${region}: ${share}%`}>
                  {GEO_DIST.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Jobs by Region (000s)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={GEO_DIST}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize:10, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip />
                <Bar dataKey="jobs" name="Jobs (000s)">{GEO_DIST.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Policy Incentives: Jobs Enabled & Budget</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={POLICY}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:8, fontFamily:T.mono, angle:-20, textAnchor:'end' }} height={60} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar yAxisId="left" dataKey="jobsEnabled" fill={T.green} name="Jobs Enabled (000s)" />
                <Bar yAxisId="right" dataKey="budgetBn" fill={T.gold} name="Budget ($B)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
            {POLICY.map((p, i) => (
              <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
                <div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{p.name}</div>
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, marginTop:4 }}>{p.region} · {p.type}</div>
                <div style={{ display:'flex', gap:12, marginTop:8 }}>
                  <span style={{ fontFamily:T.mono, fontSize:12, color:T.green }}>{p.jobsEnabled.toLocaleString()} jobs</span>
                  <span style={{ fontFamily:T.mono, fontSize:12, color:T.gold }}>${p.budgetBn}B budget</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          IRENA Renewable Energy and Jobs Annual Review 2024 · ILO World Employment Outlook · IEA World Energy Employment Report · European Commission Green Deal Jobs Tracker · US DOE Clean Energy Jobs Report
        </div>
      </div>
    </div>
  );
}
