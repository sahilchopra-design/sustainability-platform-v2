import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Voting Dashboard','Say-on-Climate Tracker','Shareholder Resolutions','Management vs Shareholder','Director Climate Score','Voting Policy Alignment'];

const SOC_TRACKER = [
  { company:'Shell', year:2023, support:80, year2:2024, support2:77 },
  { company:'TotalEnergies', year:2023, support:89, year2:2024, support2:75 },
  { company:'BP', year:2023, support:88, year2:2024, support2:76 },
  { company:'Glencore', year:2023, support:75, year2:2024, support2:72 },
  { company:'Rio Tinto', year:2023, support:92, year2:2024, support2:88 },
  { company:'Santos', year:2023, support:62, year2:2024, support2:58 },
  { company:'Woodside', year:2023, support:51, year2:2024, support2:48 },
  { company:'Barclays', year:2023, support:81, year2:2024, support2:79 },
];

const RESOLUTIONS = [
  { topic:'Emissions Targets', count:18, avgSupport:35, trend:'up' },
  { topic:'Lobbying Disclosure', count:12, avgSupport:42, trend:'up' },
  { topic:'Climate Risk Reporting', count:8, avgSupport:38, trend:'stable' },
  { topic:'Just Transition', count:5, avgSupport:22, trend:'up' },
  { topic:'Deforestation', count:4, avgSupport:28, trend:'up' },
  { topic:'Methane Reduction', count:3, avgSupport:45, trend:'up' },
];

const SUPPORT_TREND = [
  { year:2020, avgSupport:22, resolutions:28 },
  { year:2021, avgSupport:28, resolutions:35 },
  { year:2022, avgSupport:35, resolutions:42 },
  { year:2023, avgSupport:32, resolutions:48 },
  { year:2024, avgSupport:34, resolutions:52 },
  { year:2025, avgSupport:36, resolutions:50 },
];

const MGMT_ALIGNMENT = [
  { company:'Shell', mgmtSupport:78, shSupport:82, aligned:true },
  { company:'BP', mgmtSupport:80, shSupport:76, aligned:true },
  { company:'Exxon', mgmtSupport:22, shSupport:62, aligned:false },
  { company:'Chevron', mgmtSupport:18, shSupport:58, aligned:false },
  { company:'Rio Tinto', mgmtSupport:88, shSupport:85, aligned:true },
  { company:'BHP', mgmtSupport:82, shSupport:80, aligned:true },
  { company:'Duke Energy', mgmtSupport:35, shSupport:55, aligned:false },
  { company:'Toyota', mgmtSupport:42, shSupport:65, aligned:false },
];

const DIRECTOR_SCORES = [
  { company:'Shell', expertise:72, training:65, committee:true, score:74 },
  { company:'BP', expertise:78, training:70, committee:true, score:78 },
  { company:'Exxon', expertise:35, training:28, committee:false, score:32 },
  { company:'Rio Tinto', expertise:82, training:75, committee:true, score:82 },
  { company:'BHP', expertise:85, training:80, committee:true, score:85 },
  { company:'Glencore', expertise:62, training:55, committee:true, score:62 },
  { company:'Barclays', expertise:68, training:72, committee:true, score:70 },
  { company:'HSBC', expertise:75, training:68, committee:true, score:75 },
];

const POLICY_ALIGNMENT = [
  { framework:'IIGCC Expectations', aligned:82, partial:12, notAligned:6 },
  { framework:'PRI Voting Guidance', aligned:75, partial:18, notAligned:7 },
  { framework:'CA100+ Voting', aligned:68, partial:22, notAligned:10 },
  { framework:'UK Stewardship Code', aligned:85, partial:10, notAligned:5 },
  { framework:'ISS Climate Policy', aligned:72, partial:20, notAligned:8 },
];

export default function ProxyVotingClimatePage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState(false);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CP2</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>PROXY VOTING CLIMATE</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Climate Proxy Voting Analytics</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>Say-on-Climate, shareholder resolutions & voting policy alignment</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
            <span style={{ padding:'6px 14px', borderRadius:6, background:T.teal+'15', color:T.teal, fontFamily:T.mono, fontSize:11 }}>👥 4 viewing</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Climate Resolutions', '50', '2020-2025 tracked', T.navy)}
            {card('Say-on-Climate Votes', SOC_TRACKER.length.toString(), 'Companies tracked', T.green)}
            {card('Avg Support (2025)', '36%', 'Shareholder resolutions', T.amber)}
            {card('Majority Achieved', '8', 'Resolutions > 50%', T.gold)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Climate Resolution Support & Count Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={SUPPORT_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Line yAxisId="left" dataKey="avgSupport" stroke={T.gold} strokeWidth={2} name="Avg Support %" dot={{ r:4 }} />
                <Line yAxisId="right" dataKey="resolutions" stroke={T.navy} strokeWidth={2} name="# Resolutions" dot={{ r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Say-on-Climate: Support % (2023 vs 2024)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={SOC_TRACKER}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 100]} />
              <Tooltip /><Legend />
              <Bar dataKey="support" fill={T.navy} name="2023 Support %" />
              <Bar dataKey="support2" fill={T.gold} name="2024 Support %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Resolutions by Topic: Count & Avg Support</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={RESOLUTIONS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="topic" tick={{ fontSize:10, fontFamily:T.mono }} />
              <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 60]} />
              <Tooltip /><Legend />
              <Bar yAxisId="left" dataKey="count" fill={T.navy} name="# Resolutions" />
              <Bar yAxisId="right" dataKey="avgSupport" fill={T.green} name="Avg Support %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Management vs Shareholder Support</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={MGMT_ALIGNMENT}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 100]} />
              <Tooltip /><Legend />
              <Bar dataKey="mgmtSupport" fill={T.navy} name="Management %" />
              <Bar dataKey="shSupport" fill={T.gold} name="Shareholder %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Board Climate Competence Score</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={[...DIRECTOR_SCORES].sort((a, b) => b.score - a.score)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 100]} />
              <Tooltip /><Legend />
              <Bar dataKey="expertise" fill={T.navy} name="Expertise" />
              <Bar dataKey="training" fill={T.gold} name="Training" />
              <Bar dataKey="score" fill={T.green} name="Overall Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Voting Policy Alignment (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={POLICY_ALIGNMENT} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis type="category" dataKey="framework" width={160} tick={{ fontSize:10, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Bar dataKey="aligned" stackId="a" fill={T.green} name="Aligned %" />
              <Bar dataKey="partial" stackId="a" fill={T.amber} name="Partial %" />
              <Bar dataKey="notAligned" stackId="a" fill={T.red} name="Not Aligned %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          ShareAction Voting Matters Report · IIGCC Net Zero Voting Expectations · PRI Climate Voting Guidelines · ISS Climate Proxy Voting Policy · CA100+ Company Assessments
        </div>
      </div>
    </div>
  );
}
