import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Index Dashboard','CBI Certified Universe','Performance vs Conventional','Sector Allocation','Geographic Distribution','New Issuance Monitor'];

const PERF = [
  { month:'Jan 24', green:100, conv:100 },{ month:'Mar 24', green:101.2, conv:100.8 },{ month:'Jun 24', green:102.8, conv:102.2 },
  { month:'Sep 24', green:103.5, conv:103.8 },{ month:'Dec 24', green:105.2, conv:104.5 },{ month:'Mar 25', green:106.8, conv:105.8 },
];

const SECTORS = [
  { sector:'Energy', pct:38, amountBn:285 },{ sector:'Transport', pct:22, amountBn:165 },{ sector:'Buildings', pct:18, amountBn:135 },
  { sector:'Water', pct:10, amountBn:75 },{ sector:'Waste', pct:7, amountBn:53 },{ sector:'Land Use', pct:5, amountBn:38 },
];

const GEO = [
  { region:'Europe', pct:48, amountBn:360 },{ region:'Asia-Pacific', pct:22, amountBn:165 },{ region:'North America', pct:18, amountBn:135 },
  { region:'Supranational', pct:8, amountBn:60 },{ region:'LatAm & Africa', pct:4, amountBn:30 },
];

const ISSUANCE = [
  { month:'Oct 24', amount:42 },{ month:'Nov 24', amount:38 },{ month:'Dec 24', amount:28 },
  { month:'Jan 25', amount:52 },{ month:'Feb 25', amount:48 },{ month:'Mar 25', amount:55 },
];

const NEW_DEALS = [
  { issuer:'Republic of France', amount:8.0, coupon:2.95, tenor:15, sector:'Sovereign', certified:true },
  { issuer:'KfW', amount:5.0, coupon:2.65, tenor:10, sector:'Agency', certified:true },
  { issuer:'Apple Inc.', amount:2.5, coupon:3.15, tenor:7, sector:'Corporate', certified:false },
  { issuer:'IFC', amount:3.0, coupon:2.80, tenor:5, sector:'Supranational', certified:true },
];

const PALETTE = [T.navy, T.gold, T.green, T.blue, T.orange, T.purple];

export default function ClimateBondIndexTrackerPage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState(false);

  const totalUniverse = 750; const totalAmountBn = 750;
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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CQ4</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>CLIMATE BOND INDEX TRACKER</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Climate Bond Index Tracking & Analytics</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>CBI certified universe, performance comparison & new issuance monitoring</p>
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
            {card('CBI Universe', totalUniverse + ' bonds', '$' + totalAmountBn + 'B outstanding', T.navy)}
            {card('YTD Return', '+6.8%', 'Green Bond Index', T.green)}
            {card('Outperformance', '+100 bps', 'vs Global Agg', T.gold)}
            {card('New Issuance (Q1)', '$155B', '3-month pipeline', T.blue)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Green Bond Index vs Conventional (Indexed to 100)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={PERF}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[99,108]}/><Tooltip/><Legend/>
                <Line dataKey="green" stroke={T.green} strokeWidth={2} name="Green Bond Index" dot={{ r:3 }}/>
                <Line dataKey="conv" stroke={T.textMut} strokeWidth={2} name="Bloomberg Global Agg" dot={{ r:3 }} strokeDasharray="5 5"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Recent CBI Certified Issuances</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
            <thead><tr>{['Issuer','Amount ($B)','Coupon %','Tenor (yrs)','Sector','CBI Certified'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
            <tbody>{NEW_DEALS.map((d,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{d.issuer}</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>${d.amount}B</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{d.coupon}%</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{d.tenor}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{d.sector}</td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:d.certified?T.green+'18':T.amber+'18', color:d.certified?T.green:T.amber }}>{d.certified?'Yes':'Pending'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Performance Comparison (Indexed)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={PERF}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[99,108]}/><Tooltip/><Legend/>
              <Area type="monotone" dataKey="green" fill={T.green+'30'} stroke={T.green} strokeWidth={2} name="Green Index"/>
              <Area type="monotone" dataKey="conv" fill={T.textMut+'20'} stroke={T.textMut} strokeWidth={2} name="Conventional"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Sector Allocation</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart><Pie data={SECTORS} dataKey="pct" nameKey="sector" cx="50%" cy="50%" outerRadius={100} label>{SECTORS.map((_,i)=><Cell key={i} fill={PALETTE[i]}/>)}</Pie><Tooltip/><Legend/></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Amount by Sector ($B)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={SECTORS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{ fontSize:10, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip formatter={v=>'$'+v+'B'}/>
                <Bar dataKey="amountBn" name="Amount ($B)">{SECTORS.map((_,i)=><Cell key={i} fill={PALETTE[i]}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Geographic Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart><Pie data={GEO} dataKey="pct" nameKey="region" cx="50%" cy="50%" outerRadius={100} label>{GEO.map((_,i)=><Cell key={i} fill={PALETTE[i]}/>)}</Pie><Tooltip/><Legend/></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Regional Amounts ($B)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={GEO}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="region" tick={{ fontSize:10, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip formatter={v=>'$'+v+'B'}/>
                <Bar dataKey="amountBn" name="Amount ($B)">{GEO.map((_,i)=><Cell key={i} fill={PALETTE[i]}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Monthly New Issuance ($B)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ISSUANCE}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip formatter={v=>'$'+v+'B'}/>
              <Bar dataKey="amount" fill={T.green} name="Issuance ($B)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          Climate Bonds Initiative Market Intelligence · Bloomberg MSCI Green Bond Index · ICE BofA Green Bond Index · S&P Green Bond Index · CBI Certification Standards v4.0
        </div>
      </div>
    </div>
  );
}
