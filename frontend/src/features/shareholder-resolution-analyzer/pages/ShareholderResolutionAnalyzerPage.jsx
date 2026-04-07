import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Resolution Database','Success Rate Trends','Topic Classification','Filer Analysis','Management Response','Impact Assessment'];

const RESOLUTIONS = [
  { id:1, company:'ExxonMobil', topic:'Emissions Targets', year:2024, support:35, filer:'Follow This', mgmtResponse:'Oppose', impact:'Partial adoption' },
  { id:2, company:'Chevron', topic:'Lobbying Disclosure', year:2024, support:52, filer:'As You Sow', mgmtResponse:'Oppose', impact:'Full adoption' },
  { id:3, company:'Shell', topic:'Climate Risk Report', year:2023, support:20, filer:'Follow This', mgmtResponse:'Oppose', impact:'None' },
  { id:4, company:'BP', topic:'Emissions Targets', year:2024, support:17, filer:'Follow This', mgmtResponse:'Oppose', impact:'None' },
  { id:5, company:'JPMorgan', topic:'Fossil Fuel Financing', year:2024, support:38, filer:'ShareAction', mgmtResponse:'Oppose', impact:'Policy update' },
  { id:6, company:'HSBC', topic:'Deforestation', year:2023, support:28, filer:'ShareAction', mgmtResponse:'Neutral', impact:'Partial adoption' },
  { id:7, company:'Amazon', topic:'Climate Risk Report', year:2024, support:42, filer:'As You Sow', mgmtResponse:'Oppose', impact:'Enhanced reporting' },
  { id:8, company:'Costco', topic:'Emissions Targets', year:2024, support:68, filer:'Green Century', mgmtResponse:'Oppose', impact:'Target adopted' },
];

const TREND_DATA = [
  { year:2020, total:32, avgSupport:24, majority:2 },
  { year:2021, total:42, avgSupport:30, majority:5 },
  { year:2022, total:55, avgSupport:36, majority:8 },
  { year:2023, total:62, avgSupport:32, majority:7 },
  { year:2024, total:58, avgSupport:35, majority:8 },
  { year:2025, total:50, avgSupport:36, majority:8 },
];

const TOPICS = [
  { topic:'Emissions Targets', count:28, avgSupport:32 },
  { topic:'Lobbying Disclosure', count:18, avgSupport:42 },
  { topic:'Climate Risk Reporting', count:15, avgSupport:38 },
  { topic:'Just Transition', count:8, avgSupport:22 },
  { topic:'Deforestation', count:12, avgSupport:28 },
  { topic:'Methane Reduction', count:9, avgSupport:45 },
  { topic:'Fossil Fuel Financing', count:10, avgSupport:35 },
];

const FILERS = [
  { name:'Follow This', resolutions:22, avgSupport:28, wins:2 },
  { name:'As You Sow', resolutions:18, avgSupport:38, wins:4 },
  { name:'ShareAction', resolutions:15, avgSupport:35, wins:3 },
  { name:'Green Century', resolutions:8, avgSupport:42, wins:2 },
  { name:'Mercy Investment', resolutions:6, avgSupport:30, wins:1 },
  { name:'Ceres', resolutions:5, avgSupport:32, wins:1 },
];

const MGMT_RESP = [{ name:'Oppose', value:72 },{ name:'Neutral', value:15 },{ name:'Support', value:8 },{ name:'Already Implemented', value:5 }];
const RESP_COLORS = [T.red, T.amber, T.green, T.blue];

export default function ShareholderResolutionAnalyzerPage() {
  const [tab, setTab] = useState(0);
  const [topicFilter, setTopicFilter] = useState('All');
  const [watchlist, setWatchlist] = useState(false);

  const topics = [...new Set(RESOLUTIONS.map(r => r.topic))];
  const filtered = useMemo(() => topicFilter === 'All' ? RESOLUTIONS : RESOLUTIONS.filter(r => r.topic === topicFilter), [topicFilter]);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CP4</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>SHAREHOLDER RESOLUTION ANALYZER</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Shareholder Resolution Analysis Engine</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>100 climate/ESG resolutions from 2020-2025 with topic classification</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
            <span style={{ padding:'6px 14px', borderRadius:6, background:T.teal+'15', color:T.teal, fontFamily:T.mono, fontSize:11 }}>👥 3 viewing</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Total Resolutions', '100', '2020-2025', T.navy)}
            {card('Majority Support', '8', 'Above 50%', T.green)}
            {card('Avg Support', '35%', 'All resolutions', T.amber)}
            {card('Top Topic', 'Emissions', '28 resolutions', T.gold)}
          </div>
          <div style={{ marginBottom:12 }}>
            <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
              <option value="All">All Topics</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
              <thead><tr>{['Company','Topic','Year','Support %','Filer','Mgmt','Impact'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map((r, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{r.company}</td>
                  <td style={{ padding:'8px 12px', fontSize:13 }}>{r.topic}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{r.year}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13, color:r.support>=50?T.green:r.support>=30?T.amber:T.red }}>{r.support}%</td>
                  <td style={{ padding:'8px 12px', fontSize:13 }}>{r.filer}</td>
                  <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:r.mgmtResponse==='Support'?T.green+'18':r.mgmtResponse==='Neutral'?T.amber+'18':T.red+'18', color:r.mgmtResponse==='Support'?T.green:r.mgmtResponse==='Neutral'?T.amber:T.red }}>{r.mgmtResponse}</span></td>
                  <td style={{ padding:'8px 12px', fontSize:12 }}>{r.impact}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Resolution Count, Avg Support & Majority Wins</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Line yAxisId="left" dataKey="total" stroke={T.navy} strokeWidth={2} name="Total Resolutions" dot={{ r:4 }} />
              <Line yAxisId="left" dataKey="avgSupport" stroke={T.gold} strokeWidth={2} name="Avg Support %" dot={{ r:4 }} />
              <Line yAxisId="right" dataKey="majority" stroke={T.green} strokeWidth={2} name="Majority Wins" dot={{ r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Resolution Topics: Count & Avg Support</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={TOPICS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="topic" tick={{ fontSize:9, fontFamily:T.mono, angle:-20, textAnchor:'end' }} height={50} />
              <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Bar yAxisId="left" dataKey="count" fill={T.navy} name="# Resolutions" />
              <Bar yAxisId="right" dataKey="avgSupport" fill={T.gold} name="Avg Support %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Top Filers: Resolutions & Success</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={FILERS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Bar dataKey="resolutions" fill={T.navy} name="Filed" />
              <Bar dataKey="wins" fill={T.green} name="Majority Wins" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Management Response Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={MGMT_RESP} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{MGMT_RESP.map((_, i) => <Cell key={i} fill={RESP_COLORS[i]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Filer Avg Support %</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={FILERS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 60]} tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize:10, fontFamily:T.mono }} />
                <Tooltip />
                <Bar dataKey="avgSupport" fill={T.gold} name="Avg Support %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Impact Classification of Resolutions</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={[{ name:'Full Adoption', value:12 },{ name:'Partial Adoption', value:18 },{ name:'Enhanced Reporting', value:15 },{ name:'Policy Update', value:10 },{ name:'None', value:45 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {[T.green, T.blue, T.teal, T.amber, T.textMut].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie><Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          Proxy Monitor (Manhattan Institute) · ISS Governance Analytics · ShareAction Voting Matters · Ceres Shareholder Resolution Database · SEC EDGAR Proxy Filings
        </div>
      </div>
    </div>
  );
}
